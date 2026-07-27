import React, { useState } from 'react';
import { Menu, Plus, MessageSquare, Trash2, Sun, Moon, X, Key, LogOut, Edit2, Check, FolderOpen } from 'lucide-react';
import axios from 'axios';

export default function Sidebar({
  isMobile, isSidebarOpen, setIsSidebarOpen,
  theme, setTheme, t,
  sessions, setSessions, activeSessionId, createNewSession, selectSession, deleteSession,
  showSettingsDrawer, setShowSettingsDrawer,
  apiKey, tempApiKey, setTempApiKey,
  hfApiKey, tempHfApiKey, setTempHfApiKey,
  handleSaveApiKey,
  userFullName, handleLogout,
  setShowDocumentManager 
}) {
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const startEditing = (e, session) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const saveEditing = async (e, sessionId) => {
    if (e) e.stopPropagation();
    
    if (!editTitle.trim()) {
      setEditingSessionId(null);
      return;
    }

    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: editTitle } : s));
    setEditingSessionId(null);

    try {
      const backendUrl = "https://rag-app-6zlh.onrender.com";
      await axios.put(`${backendUrl}/api/sessions/${sessionId}`, { title: editTitle });
    } catch (error) {
      console.error("Failed to rename session:", error);
    }
  };

  return (
    <div style={{ 
      position: isMobile ? 'fixed' : 'relative',
      top: 0, left: 0, height: '100%',
      width: isSidebarOpen ? '260px' : '0px', 
      minWidth: isSidebarOpen ? '260px' : '0px',
      backgroundColor: t.bgSidebar, 
      borderRight: isSidebarOpen ? `1px solid ${t.border}` : 'none', 
      transition: 'all 0.3s ease',
      overflow: 'hidden',
      display: 'flex', 
      flexDirection: 'column',
      zIndex: 100,
      boxShadow: isMobile && isSidebarOpen ? `4px 0 25px ${t.shadow}` : 'none'
    }}>
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', height: '100%', width: '260px', boxSizing: 'border-box' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
          <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', letterSpacing: '1px' }}>RAG System</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', padding: '4px' }}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', padding: '4px' }}>
              <Menu size={18} />
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
          <button 
            onClick={createNewSession}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: t.accent, color: t.accentText, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'opacity 0.2s' }}
          >
            <Plus size={16} /> New Chat
          </button>
          <button 
            onClick={() => setShowDocumentManager(true)}
            title="Manage Documents"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', background: t.inputBg, color: t.textMain, border: `1px solid ${t.borderDark}`, borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s' }}
          >
            <FolderOpen size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          <p style={{ fontSize: '0.7rem', color: t.textMuted, fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Recent History</p>
          {sessions.map((s) => (
            <div 
              key={s.id} 
              onClick={() => selectSession(s.id)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '10px', 
                borderRadius: '8px',
                cursor: 'pointer', 
                backgroundColor: s.id === activeSessionId ? t.activeSidebarBg : 'transparent',
                color: s.id === activeSessionId ? t.activeSidebarText : t.textMuted, 
                fontSize: '0.85rem',
                marginBottom: '4px',
                transition: 'background-color 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                <MessageSquare size={16} flexShrink={0} />
                
                {editingSessionId === s.id ? (
                  <input 
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEditing(e, s.id)}
                    onBlur={(e) => saveEditing(e, s.id)} // FIX: Closes input when clicking away
                    onClick={(e) => e.stopPropagation()}
                    style={{ flex: 1, background: t.inputBg, color: t.textMain, border: `1px solid ${t.accent}`, borderRadius: '4px', padding: '2px 4px', fontSize: '0.85rem', outline: 'none' }}
                  />
                ) : (
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: s.id === activeSessionId ? '500' : '400' }}>
                    {s.title}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '2px' }}>
                {editingSessionId === s.id ? (
                  <button onMouseDown={(e) => saveEditing(e, s.id)} style={{ background: 'none', border: 'none', color: t.accent, cursor: 'pointer', padding: '4px' }}>
                    <Check size={14} />
                  </button>
                ) : (
                  <button onClick={(e) => startEditing(e, s)} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', padding: '4px', opacity: s.id === activeSessionId ? 0.8 : 0 }}>
                    <Edit2 size={14} />
                  </button>
                )}
                
                <button onClick={(e) => deleteSession(e, s.id)} title="Delete Session" style={{ background: 'none', border: 'none', color: t.danger, cursor: 'pointer', padding: '4px', opacity: s.id === activeSessionId ? 0.8 : 0 }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: '10px', marginTop: 'auto' }}>
          {showSettingsDrawer ? (
            <form onSubmit={handleSaveApiKey} style={{ background: t.inputBg, padding: '12px', borderRadius: '12px', border: `1px solid ${t.borderDark}`, boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: t.textMuted }}>SET API KEYS</span>
                <X size={14} style={{ cursor: 'pointer', color: t.textMuted }} onClick={() => setShowSettingsDrawer(false)} />
              </div>
              <input type="password" value={tempApiKey} onChange={(e) => setTempApiKey(e.target.value)} placeholder="Groq Key (gsk_...)" style={{ width: '100%', padding: '8px', background: t.bgSidebar, border: `1px solid ${t.borderDark}`, borderRadius: '8px', color: t.textMain, fontSize: '0.85rem', boxSizing: 'border-box', marginBottom: '8px', outline: 'none' }} />
              <input type="password" value={tempHfApiKey} onChange={(e) => setTempHfApiKey(e.target.value)} placeholder="Hugging Face Token (hf_...)" style={{ width: '100%', padding: '8px', background: t.bgSidebar, border: `1px solid ${t.borderDark}`, borderRadius: '8px', color: t.textMain, fontSize: '0.85rem', boxSizing: 'border-box', marginBottom: '10px', outline: 'none' }} />
              <button type="submit" style={{ width: '100%', padding: '8px', background: t.accent, color: t.accentText, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Save Keys</button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div onClick={() => { setTempApiKey(apiKey); setTempHfApiKey(hfApiKey); setShowSettingsDrawer(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '12px', cursor: 'pointer', color: t.textMuted, backgroundColor: t.inputBg, border: `1px solid ${t.borderDark}` }}>
                <Key size={16} color={(apiKey && hfApiKey) ? '#34d399' : t.danger} />
                <span style={{ fontSize: '0.8rem', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(apiKey && hfApiKey) ? 'APIs Configured' : 'Set API Keys'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                  <div style={{ width: '30px', height: '30px', minWidth: '30px', borderRadius: '50%', backgroundColor: t.activeSidebarBg, color: t.activeSidebarText, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>{userFullName?.[0]?.toUpperCase()}</div>
                  <div style={{ overflow: 'hidden' }}><div style={{ fontSize: '0.85rem', color: t.textMain, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: '500' }}>{userFullName}</div></div>
                </div>
                <button onClick={handleLogout} title="Logout" style={{ background: 'none', border: 'none', color: t.danger, cursor: 'pointer', padding: '4px' }}><LogOut size={18} /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
