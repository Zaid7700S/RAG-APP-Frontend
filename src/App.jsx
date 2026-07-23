import React, { useState, useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';
import axios from 'axios';
import { supabase } from './supabaseClient';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';

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
  const [mode, setMode] = useState('Auto');
  const [showDropdown, setShowDropdown] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('workspace_theme') || 'dark');
  
  // Cloud synced sessions
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

  // CLOUD INITIALIZATION
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
    // 1. FORCE CLOUD FETCH: Bypasses the local browser cache so API key syncs across devices instantly
    const { data: { user: freshUser } } = await supabase.auth.getUser();
    const activeUser = freshUser || user;

    // 2. Load API Key from the freshly fetched cloud data
    if (activeUser.user_metadata?.groq_api_key) {
      setApiKey(activeUser.user_metadata.groq_api_key);
    }
    
    // 3. Fetch Sessions from Cloud
    const { data, error } = await supabase
      .from('workspace_sessions')
      .select('*')
      .eq('user_id', activeUser.id)
      .order('updated_at', { ascending: false });

    if (data && data.length > 0) {
      setSessions(data);
      setActiveSessionId(data[0].id);
    } else {
      // Create first session in cloud if empty
      const newId = `session_${Date.now()}`;
      const newSession = { id: newId, title: 'New Session', history: [] };
      setSessions([newSession]);
      setActiveSessionId(newId);
      await supabase.from('workspace_sessions').insert({
        id: newId, user_id: activeUser.id, title: newSession.title, history: newSession.history
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
      const { error } = await supabase.auth.updateUser({ data: { groq_api_key: tempApiKey } });
      if (error) throw error;
      setApiKey(tempApiKey);
      setShowSettingsDrawer(false);
    } catch (error) {
      alert("Failed to securely save API key to cloud.");
    }
  };

  const handleLogout = async () => {
    setApiKey('');
    setIsAppReady(false);
    await supabase.auth.signOut();
  };

  const currentSession = sessions.find(s => s.id === activeSessionId) || { history: [] };
  const chatHistory = currentSession.history || [];

  const createNewSession = async () => {
    if (sessions.length > 0 && sessions[0].history.length === 0) {
      setActiveSessionId(sessions[0].id);
      if (isMobile) setIsSidebarOpen(false);
      return;
    }
    
    const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSession = { id: newId, title: 'New Session', history: [] };
    
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    if (isMobile) setIsSidebarOpen(false);

    if (session?.user?.id) {
      await supabase.from('workspace_sessions').insert({
        id: newId, user_id: session.user.id, title: newSession.title, history: newSession.history
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
      const newSession = { id: newId, title: 'New Session', history: [] };
      setSessions([newSession]);
      setActiveSessionId(newId);
      if (session?.user?.id) {
        await supabase.from('workspace_sessions').insert({
          id: newId, user_id: session.user.id, title: newSession.title, history: newSession.history
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
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setUploadStatus('Uploading...');
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('user_id', `${session.user.id}_${activeSessionId}`);

    try {
      const backendUrl = "https://rag-app-6zlh.onrender.com"; 
      await axios.post(backendUrl + '/upload/', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadStatus('Attached: ' + selectedFile.name);
    } catch (error) {
      setUploadStatus(`Error: ${error.response?.data?.detail || error.message}`);
      setFile(null);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || !apiKey) return;

    const userQuery = query;
    setQuery('');
    setLoadingChat(true);

    const userMessage = { role: 'user', content: userQuery };
    let updatedSessionForDB = null;

    setSessions(prevSessions => prevSessions.map(s => {
      if (s.id === activeSessionId) {
        const newTitle = s.history.length === 0 ? (userQuery.slice(0, 22) + '...') : s.title;
        const updatedSession = { ...s, title: newTitle, history: [...s.history, userMessage] };
        updatedSessionForDB = updatedSession; // Capture for sync
        return updatedSession;
      }
      return s;
    }));

    // Cloud Sync User Message
    if (session?.user?.id && updatedSessionForDB) {
      supabase.from('workspace_sessions').upsert({
        id: updatedSessionForDB.id, user_id: session.user.id, title: updatedSessionForDB.title, history: updatedSessionForDB.history, updated_at: new Date().toISOString()
      }).then();
    }

    try {
      const backendUrl = "https://rag-app-6zlh.onrender.com";
      const response = await axios.post(backendUrl + '/chat/', {
        session_id: `${session.user.id}_${activeSessionId}`,
        query: userQuery, api_key: apiKey, mode: mode
      });
      
      const aiMessage = { role: 'ai', content: response.data.answer, intent: response.data.intent, sources: response.data.sources };
      
      setSessions(prevSessions => prevSessions.map(s => {
        if (s.id === activeSessionId) {
          const finalSession = { ...s, history: [...s.history, aiMessage] };
          // Cloud Sync AI Message
          supabase.from('workspace_sessions').upsert({
            id: finalSession.id, user_id: session.user.id, title: finalSession.title, history: finalSession.history, updated_at: new Date().toISOString()
          }).then();
          return finalSession;
        }
        return s;
      }));
    } catch (error) {
      const errorMessage = { role: 'ai', content: `System Error: ${error.response?.data?.detail || error.message}` };
      setSessions(prevSessions => prevSessions.map(s => {
        if (s.id === activeSessionId) {
          const finalSession = { ...s, history: [...s.history, errorMessage] };
          supabase.from('workspace_sessions').upsert({
            id: finalSession.id, user_id: session.user.id, title: finalSession.title, history: finalSession.history, updated_at: new Date().toISOString()
          }).then();
          return finalSession;
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
  
  // Loading Screen while fetching cloud data
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

      {isMobile && isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.backdrop, zIndex: 90, transition: 'opacity 0.3s' }} />
      )}

      <div style={{ display: 'flex', height: '100vh', width: '100vw', background: t.bgMain, color: t.textMain, fontFamily: 'system-ui, sans-serif', overflow: 'hidden', transition: 'background 0.3s ease' }}>
        
        <Sidebar 
          isMobile={isMobile} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
          theme={theme} setTheme={setTheme} t={t}
          sessions={sessions} activeSessionId={activeSessionId} createNewSession={createNewSession} selectSession={selectSession} deleteSession={deleteSession}
          showSettingsDrawer={showSettingsDrawer} setShowSettingsDrawer={setShowSettingsDrawer}
          apiKey={apiKey} tempApiKey={tempApiKey} setTempApiKey={setTempApiKey} handleSaveApiKey={handleSaveApiKey}
          userFullName={userFullName} handleLogout={handleLogout}
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

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: chatHistory.length === 0 ? 'center' : 'space-between', boxSizing: 'border-box', overflow: 'hidden' }}>
            
            <ChatWindow 
              t={t} chatHistory={chatHistory} 
              loadingChat={loadingChat} chatEndRef={chatEndRef}
            />

            <InputBar 
              t={t} chatHistoryLength={chatHistory.length} userFullName={userFullName}
              uploadStatus={uploadStatus} file={file} setFile={setFile} setUploadStatus={setUploadStatus} handleFileSelect={handleFileSelect}
              handleChatSubmit={handleChatSubmit} query={query} setQuery={setQuery} apiKey={apiKey} loadingChat={loadingChat}
              mode={mode} setMode={setMode} showDropdown={showDropdown} setShowDropdown={setShowDropdown}
            />

          </div>
        </div>
      </div>
    </>
  );
}
