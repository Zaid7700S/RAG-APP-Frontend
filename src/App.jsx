import React, { useState, useEffect, useRef } from 'react';
import { Menu, Globe, Lock, Bot } from 'lucide-react';
import axios from 'axios';
import { supabase } from './supabaseClient';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';
import DocumentManager from './components/DocumentManager';

const themeColors = {
  dark: {
    bgMain: 'linear-gradient(135deg, #0f1115 0%, #1a1d24 100%)',
    bgSidebar: '#16181d',
    border: '#27272a',
    borderDark: '#3f3f46',
    textMain: '#e4e4e7',
    textMuted: '#a1a1aa',
    inputBg: '#1e1e24',
    userMsgBg: '#27272a',
    userMsgText: '#e4e4e7',
    aiMsgText: '#e4e4e7',
    btnBg: '#e4e4e7',
    btnText: '#09090b',
    accent: '#2563eb',
    accentText: '#ffffff',
    danger: '#f87171',
    shadow: 'rgba(0,0,0,0.5)',
    backdrop: 'rgba(0,0,0,0.6)',
    activeSidebarBg: '#27272a',
    activeSidebarText: '#ffffff'
  },
  light: {
    bgMain: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    bgSidebar: '#ffffff',
    border: '#e2e8f0',
    borderDark: '#cbd5e1',
    textMain: '#0f172a',
    textMuted: '#64748b',
    inputBg: '#ffffff',
    userMsgBg: '#0f172a',
    userMsgText: '#ffffff',
    aiMsgText: '#0f172a',
    btnBg: '#0f172a',
    btnText: '#ffffff',
    accent: '#0f172a',
    accentText: '#ffffff',
    danger: '#ef4444',
    shadow: 'rgba(0,0,0,0.05)',
    backdrop: 'rgba(0,0,0,0.2)',
    activeSidebarBg: '#f1f5f9',
    activeSidebarText: '#0f172a'
  }
};

export default function App() {
  const [session, setSession] = useState(null);
  const [isAppReady, setIsAppReady] = useState(false);
  
  const [apiKey, setApiKey] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');
  
  const [hfApiKey, setHfApiKey] = useState('');
  const [tempHfApiKey, setTempHfApiKey] = useState('');

  const [mode, setMode] = useState('Auto');
  const [showDropdown, setShowDropdown] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('workspace_theme') || 'dark');
  
  const [showDocumentManager, setShowDocumentManager] = useState(false);
  const [searchAllFiles, setSearchAllFiles] = useState(false); 
  const [fastMode, setFastMode] = useState(true); // NEW: Fast Engine Toggle

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  
  const [query, setQuery] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  
  const chatEndRef = useRef(null);
  const t = themeColors[theme];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) initializeUserData(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        initializeUserData(session.user);
      } else {
        setSessions([]);
        setIsAppReady(false);
      }
    });

    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => { subscription.unsubscribe(); window.removeEventListener('resize', handleResize); };
  }, []);

   const initializeUserData = async (user) => {
    const { data: { user: freshUser } } = await supabase.auth.getUser();
    const activeUser = freshUser || user;

    if (activeUser.user_metadata?.groq_api_key) {
      setApiKey(activeUser.user_metadata.groq_api_key);
    }
    if (activeUser.user_metadata?.hf_api_key) {
      setHfApiKey(activeUser.user_metadata.hf_api_key);
    }
    
    const { data, error } = await supabase
      .from('workspace_sessions')
      .select('*')
      .eq('user_id', activeUser.id)
      .order('updated_at', { ascending: false });

    if (data && data.length > 0) {
      setSessions(data);
      setActiveSessionId(data[0].id);
    } else {
      const newId = `session_${Date.now()}`;
      const newSession = { id: newId, title: 'New Session', history: [], files: [] };
      setSessions([newSession]);
      setActiveSessionId(newId);
      await supabase.from('workspace_sessions').insert({
        id: newId, user_id: activeUser.id, title: newSession.title, history: newSession.history, files: newSession.files
      });
    }
    setIsAppReady(true);
  };

  useEffect(() => localStorage.setItem('workspace_theme', theme), [theme]);
  
  useEffect(() => {
    if (chatEndRef.current) {
      try { chatEndRef.current.scrollIntoView({ behavior: 'smooth' }); } catch (e) {}
    }
  }, [sessions, activeSessionId]);

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.updateUser({ 
        data: { 
          groq_api_key: tempApiKey,
          hf_api_key: tempHfApiKey 
        } 
      });
      if (error) throw error;
      setApiKey(tempApiKey);
      setHfApiKey(tempHfApiKey);
      setShowSettingsDrawer(false);
    } catch (error) {
      alert("Failed to securely save API keys to cloud.");
    }
  };

  const handleLogout = async () => {
    setApiKey('');
    setHfApiKey('');
    setIsAppReady(false);
    await supabase.auth.signOut();
  };

  const currentSession = sessions.find(s => s.id === activeSessionId) || { history: [], files: [] };
  const chatHistory = currentSession.history || [];
  const attachedFiles = currentSession.files || [];

  const createNewSession = async () => {
    if (sessions.length > 0 && sessions[0].history.length === 0) {
      setActiveSessionId(sessions[0].id);
      if (isMobile) setIsSidebarOpen(false);
      return;
    }
    
    const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSession = { id: newId, title: 'New Session', history: [], files: [] };
    
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    if (isMobile) setIsSidebarOpen(false);

    if (session?.user?.id) {
      await supabase.from('workspace_sessions').insert({
        id: newId, user_id: session.user.id, title: newSession.title, history: newSession.history, files: newSession.files
      });
    }
  };

  const selectSession = (id) => {
    setActiveSessionId(id);
    if (isMobile) setIsSidebarOpen(false);
  };

  const deleteSession = async (e, idToDelete) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== idToDelete);
    
    if (newSessions.length === 0) {
      const newId = `session_${Date.now()}`;
      const newSession = { id: newId, title: 'New Session', history: [], files: [] };
      setSessions([newSession]);
      setActiveSessionId(newId);
      if (session?.user?.id) {
        await supabase.from('workspace_sessions').insert({
          id: newId, user_id: session.user.id, title: newSession.title, history: newSession.history, files: newSession.files
        });
      }
    } else {
      setSessions(newSessions);
      if (activeSessionId === idToDelete) setActiveSessionId(newSessions[0].id);
    }

    if (session?.user?.id) {
      await supabase.from('workspace_sessions').delete().eq('id', idToDelete);
    }
  };

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;
    
    const selectedFile = selectedFiles[0]; 
    setUploadStatus(`Uploading ${selectedFile.name}...`);
    
    // 1. Instantly attach the file to the active session UI & Database
    const activeSession = sessions.find(s => s.id === activeSessionId);
    if (activeSession) {
      const currentFiles = activeSession.files || [];
      if (!currentFiles.includes(selectedFile.name)) {
        const updatedFiles = [...currentFiles, selectedFile.name];
        const updatedSession = { ...activeSession, files: updatedFiles };
        
        // Update React State immediately
        setSessions(prev => prev.map(s => s.id === activeSessionId ? updatedSession : s));
        
        // Persist to Supabase immediately
        if (session?.user?.id) {
          supabase.from('workspace_sessions').upsert({
            id: updatedSession.id, 
            user_id: session.user.id, 
            title: updatedSession.title, 
            history: updatedSession.history,
            files: updatedSession.files,
            updated_at: new Date().toISOString()
          }).then();
        }
      }
    }

    // 2. Start the backend upload process
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('user_id', session.user.id); 
    formData.append('hf_api_key', hfApiKey);
    formData.append('groq_api_key', apiKey); 
    formData.append('fast_mode', fastMode.toString()); // NEW: Send the engine mode

    try {
      const backendUrl = "https://rag-app-6zlh.onrender.com"; 
      
      await axios.post(backendUrl + '/upload/', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setUploadStatus(`⚙️ Parsing & Embedding ${selectedFile.name}...`);
      
      // 3. Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const res = await axios.get(`${backendUrl}/api/upload/status/?user_id=${session.user.id}&file_name=${selectedFile.name}`);
          
          if (res.data.status === 'completed') {
            setUploadStatus(`✅ Successfully processed ${selectedFile.name}`);
            clearInterval(pollInterval);
            
            setTimeout(() => {
              setUploadStatus((currentStatus) => currentStatus.includes('✅') ? '' : currentStatus);
            }, 4000);

          } else if (res.data.status.startsWith('failed')) {
            setUploadStatus(`❌ Error processing ${selectedFile.name}. Try a smaller file.`);
            clearInterval(pollInterval);
          } else if (res.data.status.startsWith('processing page')) {
            // Dynamically update UI with page progress
            setUploadStatus(`⚙️ ${res.data.status}...`);
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 2000); 

    } catch (error) {
      setUploadStatus(`❌ Upload failed: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || !apiKey) return;

    const userQuery = query;
    setQuery('');
    setLoadingChat(true);

    const userMessage = { role: 'user', content: userQuery };
    const tempAiMessageId = Date.now();

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
        supabase.from('workspace_sessions').upsert({
            id: updatedSessionForDB.id, user_id: session.user.id, title: updatedSessionForDB.title, 
            history: updatedSessionForDB.history.slice(0, -1), files: updatedSessionForDB.files, updated_at: new Date().toISOString()
        }).then();
    }

    try {
      const backendUrl = "https://rag-app-6zlh.onrender.com";
      
      const response = await fetch(backendUrl + '/chat/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: activeSessionId,
            user_id: session.user.id,
            query: userQuery, 
            api_key: apiKey, 
            hf_api_key: hfApiKey,
            mode: mode,
            active_files: attachedFiles,
            search_all_files: searchAllFiles
          })
      });

      if (!response.ok) throw new Error(`Server returned ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let partialLine = '';
      let finalAiContent = '';

      while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          partialLine += decoder.decode(value, { stream: true });
          const lines = partialLine.split('\n');
          partialLine = lines.pop();
          
          for (const line of lines) {
              if (!line.trim()) continue;
              const data = JSON.parse(line);
              
              if (data.type === 'metadata') {
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

      setSessions(prev => {
          const updated = prev.map(s => {
              if (s.id === activeSessionId) {
                  const finalSession = { ...s };
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

  if (!session) return <Login />;
  
  if (!isAppReady) return (
    <div style={{ height: '100vh', width: '100vw', background: t.bgMain, display: 'flex', justifyContent: 'center', alignItems: 'center', color: t.textMain, fontFamily: 'system-ui, sans-serif' }}>
      Fetching cloud workspace...
    </div>
  );

  const userFullName = session.user.user_metadata?.full_name || session.user.email.split('@')[0];

  return (
    <>
      <style>
        {`
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: ${t.borderDark}; border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: ${t.textMuted}; }
          * { scrollbar-width: thin; scrollbar-color: ${t.borderDark} transparent; }
        `}
      </style>

      {showDocumentManager && (
        <DocumentManager 
          t={t} 
          session={session} 
          onClose={() => setShowDocumentManager(false)} 
        />
      )}

      {isMobile && isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.backdrop, zIndex: 90, transition: 'opacity 0.3s' }} />
      )}

      <div style={{ display: 'flex', height: '100vh', width: '100vw', background: t.bgMain, color: t.textMain, fontFamily: 'system-ui, sans-serif', overflow: 'hidden', transition: 'background 0.3s ease' }}>
        
        <Sidebar 
          isMobile={isMobile} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
          theme={theme} setTheme={setTheme} t={t}
          sessions={sessions} setSessions={setSessions} activeSessionId={activeSessionId} createNewSession={createNewSession} selectSession={selectSession} deleteSession={deleteSession}
          showSettingsDrawer={showSettingsDrawer} setShowSettingsDrawer={setShowSettingsDrawer}
          apiKey={apiKey} tempApiKey={tempApiKey} setTempApiKey={setTempApiKey} 
          hfApiKey={hfApiKey} tempHfApiKey={tempHfApiKey} setTempHfApiKey={setTempHfApiKey}
          handleSaveApiKey={handleSaveApiKey}
          userFullName={userFullName} handleLogout={handleLogout}
          setShowDocumentManager={setShowDocumentManager} 
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', height: '100%', boxSizing: 'border-box', minWidth: 0 }}>
          
          <div style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', minHeight: '40px', width: '100%', boxSizing: 'border-box' }}>
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', zIndex: 50 }}
              >
                <Menu size={24} />
              </button>
            )}
          </div>

        {chatHistory.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', paddingBottom: '10vh' }}>
              
              <div style={{ width: '100%', maxWidth: '800px' }}>
                
                <InputBar 
                  t={t} chatHistoryLength={chatHistory.length} userFullName={userFullName}
                  uploadStatus={uploadStatus} file={file} setFile={setFile} setUploadStatus={setUploadStatus} handleFileSelect={handleFileSelect}
                  handleChatSubmit={handleChatSubmit} query={query} setQuery={setQuery} apiKey={apiKey} loadingChat={loadingChat}
                  mode={mode} setMode={setMode} showDropdown={showDropdown} setShowDropdown={setShowDropdown}
                />

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
                  
                  {/* Display attached files */}
                  {attachedFiles.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {attachedFiles.map((fileName, idx) => (
                        <span key={idx} style={{ padding: '4px 10px', fontSize: '0.75rem', background: t.bgSidebar, border: `1px solid ${t.borderDark}`, borderRadius: '12px', color: t.textMuted }}>
                          📄 {fileName}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Scope & Engine Toggles */}
                  <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    
                    <button type="button" onClick={() => setSearchAllFiles(!searchAllFiles)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', border: `1px solid ${searchAllFiles ? t.accent : t.borderDark}`, backgroundColor: searchAllFiles ? t.activeSidebarBg : t.inputBg, color: searchAllFiles ? t.accentText : t.textMuted, fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                      {searchAllFiles ? <><Globe size={14}/> Scope: All Uploaded Files</> : <><Lock size={14}/> Scope: Current Session Only</>}
                    </button>

                    {/* NEW: Extraction Engine Toggle */}
                    <button type="button" onClick={() => setFastMode(!fastMode)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', border: `1px solid ${fastMode ? t.accent : t.borderDark}`, backgroundColor: fastMode ? t.activeSidebarBg : t.inputBg, color: fastMode ? t.accentText : t.textMuted, fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                      {fastMode ? "⚡ Fast Mode (Text Only)" : "📊 Deep Scan (Tables/Layout)"}
                    </button>
                    
                  </div>
                  
                </div>

              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              
              <ChatWindow 
                t={t} chatHistory={chatHistory} 
                loadingChat={loadingChat} chatEndRef={chatEndRef}
              />

              <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '0 1rem', paddingBottom: '1rem', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {attachedFiles.map((fileName, idx) => (
                      <span key={idx} style={{ padding: '4px 10px', fontSize: '0.75rem', background: t.bgSidebar, border: `1px solid ${t.borderDark}`, borderRadius: '12px', color: t.textMuted }}>
                        📄 {fileName}
                      </span>
                    ))}
                  </div>
                  
                  {/* Scope & Engine Toggles */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => setSearchAllFiles(!searchAllFiles)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', border: `1px solid ${searchAllFiles ? t.accent : t.borderDark}`, backgroundColor: searchAllFiles ? t.activeSidebarBg : t.inputBg, color: searchAllFiles ? t.accentText : t.textMuted, fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                      {searchAllFiles ? <><Globe size={14}/> Scope: All Uploaded Files</> : <><Lock size={14}/> Scope: Current Session Only</>}
                    </button>

                    <button type="button" onClick={() => setFastMode(!fastMode)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', border: `1px solid ${fastMode ? t.accent : t.borderDark}`, backgroundColor: fastMode ? t.activeSidebarBg : t.inputBg, color: fastMode ? t.accentText : t.textMuted, fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                      {fastMode ? "⚡ Fast Mode" : "📊 Deep Scan"}
                    </button>
                  </div>
                </div>

                <InputBar 
                  t={t} chatHistoryLength={chatHistory.length} userFullName={userFullName}
                  uploadStatus={uploadStatus} file={file} setFile={setFile} setUploadStatus={setUploadStatus} handleFileSelect={handleFileSelect}
                  handleChatSubmit={handleChatSubmit} query={query} setQuery={setQuery} apiKey={apiKey} loadingChat={loadingChat}
                  mode={mode} setMode={setMode} showDropdown={showDropdown} setShowDropdown={setShowDropdown}
                />
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}
