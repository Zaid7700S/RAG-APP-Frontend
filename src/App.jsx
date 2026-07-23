import React, { useState, useEffect, useRef } from 'react';
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
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('groq_api_key') || '');
  const [tempApiKey, setTempApiKey] = useState('');
  const [mode, setMode] = useState('Auto');
  const [showDropdown, setShowDropdown] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('workspace_theme') || 'dark');
  
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('workspace_sessions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [{ id: 'session_' + Date.now(), title: 'New Session', history: [] }];
  });
  
  const [activeSessionId, setActiveSessionId] = useState(() => sessions[0]?.id || 'default');
  const [query, setQuery] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  
  const chatEndRef = useRef(null);
  const t = themeColors[theme];

  // System Effects
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));

    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => { subscription.unsubscribe(); window.removeEventListener('resize', handleResize); };
  }, []);

  useEffect(() => localStorage.setItem('workspace_sessions', JSON.stringify(sessions)), [sessions]);
  useEffect(() => localStorage.setItem('workspace_theme', theme), [theme]);
  
  // FIXED: Safe scrolling prevents detach crashes
  useEffect(() => {
    if (chatEndRef.current) {
      try { chatEndRef.current.scrollIntoView({ behavior: 'smooth' }); } catch (e) {}
    }
  }, [sessions, activeSessionId]);

  // Handlers
  const handleSaveApiKey = (e) => {
    e.preventDefault();
    setApiKey(tempApiKey);
    localStorage.setItem('groq_api_key', tempApiKey);
    setShowSettingsDrawer(false);
  };

  const handleLogout = async () => {
    localStorage.removeItem('groq_api_key');
    localStorage.removeItem('workspace_sessions');
    await supabase.auth.signOut();
  };

  const currentSession = sessions.find(s => s.id === activeSessionId) || sessions[0] || { history: [] };
  const chatHistory = currentSession.history || [];

  const createNewSession = () => {
    if (sessions.length > 0 && sessions[0].history.length === 0) {
      setActiveSessionId(sessions[0].id);
      if (isMobile) setIsSidebarOpen(false);
      return;
    }
    // FIXED: Collision-proof IDs
    const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessions(prev => [{ id: newId, title: 'New Session', history: [] }, ...prev]);
    setActiveSessionId(newId);
    if (isMobile) setIsSidebarOpen(false);
  };

  const selectSession = (id) => {
    setActiveSessionId(id);
    if (isMobile) setIsSidebarOpen(false);
  };

  const deleteSession = (e, idToDelete) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== idToDelete);
    if (newSessions.length === 0) {
      const newId = `session_${Date.now()}`;
      setSessions([{ id: newId, title: 'New Session', history: [] }]);
      setActiveSessionId(newId);
    } else {
      setSessions(newSessions);
      if (activeSessionId === idToDelete) setActiveSessionId(newSessions[0].id);
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
      await axios.post(`${API_BASE_URL}/upload/`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      setUploadStatus('Attached: ' + selectedFile.name);
    } catch (error) {
      console.error(error);
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

    setSessions(prevSessions => prevSessions.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, title: s.history.length === 0 ? (userQuery.slice(0, 22) + '...') : s.title, history: [...s.history, userMessage] };
      }
      return s;
    }));

    try {
      const response = await axios.post(`${API_BASE_URL}/chat/`, {
        session_id: `${session.user.id}_${activeSessionId}`,
        query: userQuery, api_key: apiKey, mode: mode
      });
      const aiMessage = { role: 'ai', content: response.data.answer, intent: response.data.intent, sources: response.data.sources };
      setSessions(prevSessions => prevSessions.map(s => s.id === activeSessionId ? { ...s, history: [...s.history, aiMessage] } : s));
    } catch (error) {
      const errorMessage = { role: 'ai', content: `System Error: ${error.response?.data?.detail || error.message}` };
      setSessions(prevSessions => prevSessions.map(s => s.id === activeSessionId ? { ...s, history: [...s.history, errorMessage] } : s));
    } finally {
      setLoadingChat(false);
      setFile(null);
      setUploadStatus('');
    }
  };

  if (!session) return <Login />;

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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: chatHistory.length === 0 ? 'center' : 'space-between', boxSizing: 'border-box', overflow: 'hidden' }}>
            
            <ChatWindow 
              t={t} chatHistory={chatHistory} 
              loadingChat={loadingChat} chatEndRef={chatEndRef}
              isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
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
