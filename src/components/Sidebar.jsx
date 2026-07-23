import React from 'react';
import { Menu, Plus, MessageSquare, Trash2, Sun, Moon, X, Key, LogOut } from 'lucide-react';

export default function Sidebar({
  isMobile, isSidebarOpen, setIsSidebarOpen,
  theme, setTheme, t,
  sessions, activeSessionId, createNewSession, selectSession, deleteSession,
  showSettingsDrawer, setShowSettingsDrawer,
  apiKey, tempApiKey, setTempApiKey, handleSaveApiKey,
  userFullName, handleLogout
}) {
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
        
        <button 
          onClick={createNewSession}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px', background: t.accent, color: t.accentText, border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', marginBottom: '1rem', boxSizing: 'border-box', transition: 'opacity 0.2s' }}
        >
          <Plus size={18} /> New Session
        </button>

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
                borderRadius: '12px',
                cursor: 'pointer', 
                backgroundColor: s.id === activeSessionId ? t.activeSidebarBg : 'transparent',
                color: s.id === activeSessionId ? t.activeSidebarText : t.textMuted, 
                fontSize: '0.85rem',
                marginBottom: '6px',
                transition: 'background-color 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <MessageSquare size={16} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: s.id === activeSessionId ? '500' : '400' }}>{s.title}</span>
              </div>
              <button 
                onClick={(e) => deleteSession(e, s.id)}
                style={{ background: 'none', border: 'none', color: s.id === activeSessionId ? t.activeSidebarText : t.textMuted, cursor: 'pointer', display: 'flex', padding: '2px', opacity: 0.7 }}
                title="Delete Session"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: '10px', marginTop: 'auto' }}>
          {showSettingsDrawer ? (
            <form onSubmit={handleSaveApiKey} style={{ background: t.inputBg, padding: '12px', borderRadius: '12px', border: `1px solid ${t.borderDark}`, boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: t.textMuted }}>SET GROQ KEY</span>
                <X size={14} style={{ cursor: 'pointer', color: t.textMuted }} onClick={() => setShowSettingsDrawer(false)} />
              </div>
              <input 
                type="password" 
                value={tempApiKey} 
                onChange={(e) => setTempApiKey(e.target.value)} 
                placeholder="gsk_..."
                style={{ width: '100%', padding: '8px', background: t.bgSidebar, border: `1px solid ${t.borderDark}`, borderRadius: '8px', color: t.textMain, fontSize: '0.85rem', boxSizing: 'border-box', marginBottom: '10px', outline: 'none' }}
              />
              <button type="submit" style={{ width: '100%', padding: '8px', background: t.accent, color: t.accentText, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                Save Key
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div 
                onClick={() => { setTempApiKey(apiKey); setShowSettingsDrawer(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '12px', cursor: 'pointer', color: t.textMuted, backgroundColor: t.inputBg, border: `1px solid ${t.borderDark}` }}
              >
                <Key size={16} color={apiKey ? '#34d399' : t.danger} />
                <span style={{ fontSize: '0.8rem', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{apiKey ? 'API Configured' : 'Set API Key'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                  <div style={{ width: '30px', height: '30px', minWidth: '30px', borderRadius: '50%', backgroundColor: t.activeSidebarBg, color: t.activeSidebarText, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {userFullName?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.85rem', color: t.textMain, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: '500' }}>{userFullName}</div>
                  </div>
                </div>
                <button onClick={handleLogout} title="Logout" style={{ background: 'none', border: 'none', color: t.danger, cursor: 'pointer', padding: '4px' }}>
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}