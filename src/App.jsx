const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || !apiKey) return;

    const userQuery = query;
    setQuery('');
    setLoadingChat(true);

    const userMessage = { role: 'user', content: userQuery };
    const tempAiMessageId = Date.now(); // Unique ID for streaming message updates

    // 1. Add User Message and an Empty AI Message placeholder to UI
    let updatedSessionForDB = null;
    setSessions(prevSessions => prevSessions.map(s => {
      if (s.id === activeSessionId) {
        const newTitle = s.history.length === 0 ? (userQuery.slice(0, 22) + '...') : s.title;
        const updatedSession = { 
            ...s, 
            title: newTitle, 
            history: [...s.history, userMessage, { role: 'ai', content: '', sources: [], _streamId: tempAiMessageId }] 
        };
        updatedSessionForDB = updatedSession;
        return updatedSession;
      }
      return s;
    }));

    if (session?.user?.id && updatedSessionForDB) {
        // Sync user message header to cloud (exclude the incomplete AI chunk)
        supabase.from('workspace_sessions').upsert({
            id: updatedSessionForDB.id, user_id: session.user.id, title: updatedSessionForDB.title, 
            history: updatedSessionForDB.history.slice(0, -1), files: updatedSessionForDB.files, updated_at: new Date().toISOString()
        }).then();
    }

    try {
      const backendUrl = "https://rag-app-6zlh.onrender.com";
      
      // 2. Fetch using native API for streaming (Replaces Axios)
      const response = await fetch(backendUrl + '/chat/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: activeSessionId,
            user_id: session.user.id,
            query: userQuery, 
            api_key: apiKey, 
            hf_api_key: hfApiKey,
            mode: mode
          })
      });

      if (!response.ok) throw new Error(`Server returned ${response.status}`);

      // 3. Setup Stream Reader
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let partialLine = '';
      
      let finalAiContent = '';
      let finalAiSources = [];

      // 4. Read the incoming text chunks dynamically
      while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          partialLine += decoder.decode(value, { stream: true });
          const lines = partialLine.split('\n');
          partialLine = lines.pop(); // Keep the last incomplete line for next loop
          
          for (const line of lines) {
              if (!line.trim()) continue;
              const data = JSON.parse(line);
              
              if (data.type === 'metadata') {
                  finalAiSources = data.sources;
                  // Update UI with metadata immediately
                  setSessions(prev => prev.map(s => {
                      if (s.id === activeSessionId) {
                          const newHistory = [...s.history];
                          const idx = newHistory.findIndex(m => m._streamId === tempAiMessageId);
                          if (idx !== -1) newHistory[idx] = { ...newHistory[idx], intent: data.intent, sources: data.sources };
                          return { ...s, history: newHistory };
                      }
                      return s;
                  }));
              } 
              else if (data.type === 'token') {
                  finalAiContent += data.content;
                  // Live Update Text UI
                  setSessions(prev => prev.map(s => {
                      if (s.id === activeSessionId) {
                          const newHistory = [...s.history];
                          const idx = newHistory.findIndex(m => m._streamId === tempAiMessageId);
                          if (idx !== -1) newHistory[idx] = { ...newHistory[idx], content: finalAiContent };
                          return { ...s, history: newHistory };
                      }
                      return s;
                  }));
              }
          }
      }

      // 5. Finalize and Sync to Cloud Storage
      setSessions(prev => {
          const updated = prev.map(s => {
              if (s.id === activeSessionId) {
                  const finalSession = { ...s };
                  // Clean up internal temp id for cloud storage
                  const cleanHistory = finalSession.history.map(m => {
                      const { _streamId, ...rest } = m;
                      return rest;
                  });
                  supabase.from('workspace_sessions').upsert({
                      id: finalSession.id, user_id: session.user.id, title: finalSession.title, 
                      history: cleanHistory, files: finalSession.files, updated_at: new Date().toISOString()
                  }).then();
              }
              return s;
          });
          return updated;
      });

    } catch (error) {
      // Error Fallback
      setSessions(prevSessions => prevSessions.map(s => {
        if (s.id === activeSessionId) {
          const newHistory = [...s.history];
          const idx = newHistory.findIndex(m => m._streamId === tempAiMessageId);
          if (idx !== -1) newHistory[idx] = { role: 'ai', content: `System Error: ${error.message}` };
          return { ...s, history: newHistory };
        }
        return s;
      }));
    } finally {
      setLoadingChat(false);
      setFile(null);
      setUploadStatus('');
    }
  };
