import React from 'react';
import { Paperclip, X, Plus, ChevronDown, Send } from 'lucide-react';

export default function InputBar({
  t, chatHistoryLength, userFullName,
  uploadStatus, file, setFile, setUploadStatus, handleFileSelect,
  handleChatSubmit, query, setQuery, apiKey, loadingChat,
  mode, setMode, showDropdown, setShowDropdown
}) {
  return (
    <div style={{ width: '100%', boxSizing: 'border-box', padding: '1rem', marginTop: chatHistoryLength === 0 ? '-10vh' : '0' }}>
      <div style={{ width: '100%', maxWidth: '850px', margin: '0 auto' }}>
        
        {chatHistoryLength === 0 && (
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontWeight: '500', margin: '0 0 10px 0', fontSize: '1.8rem', color: t.textMain }}>
              Hello, {userFullName}
            </h2>
            <p style={{ color: t.textMuted, margin: 0, fontSize: '1rem' }}>How can I help you today?</p>
          </div>
        )}

        {uploadStatus && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: t.inputBg, border: `1px solid ${t.borderDark}`, padding: '6px 14px', borderRadius: '16px', fontSize: '0.8rem', marginBottom: '12px', color: t.textMuted }}>
            <Paperclip size={14} />
            <span style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{uploadStatus}</span>
            {file && <X size={14} style={{ cursor: 'pointer', marginLeft: '5px' }} onClick={() => { setFile(null); setUploadStatus(''); }} />}
          </div>
        )}
        
        <form onSubmit={handleChatSubmit} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: t.inputBg, 
          borderRadius: '32px',
          padding: '8px 12px',
          border: `1px solid ${t.borderDark}`,
          position: 'relative',
          width: '100%',
          boxSizing: 'border-box',
          boxShadow: `0 8px 30px ${t.shadow}`
        }}>
          
          <input type="file" id="file-upload" accept=".pdf" onChange={handleFileSelect} style={{ display: 'none' }} />
          <label htmlFor="file-upload" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', minWidth: '38px', borderRadius: '50%', background: t.bgSidebar, cursor: 'pointer', color: t.textMuted, transition: 'background 0.2s' }}>
            <Plus size={20} />
          </label>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={apiKey ? "Ask anything or search documents..." : "Configure API key first..."}
            disabled={!apiKey}
            style={{ flex: 1, padding: '10px 16px', background: 'transparent', border: 'none', color: t.textMain, outline: 'none', fontSize: '1rem', minWidth: '0' }}
          />

          <div style={{ position: 'relative', marginRight: '8px' }}>
            <button 
              type="button" 
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: t.bgSidebar, border: `1px solid ${t.borderDark}`, color: t.textMain, padding: '8px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap', fontWeight: '500' }}
            >
              <span style={{ display: window.innerWidth > 480 ? 'inline' : 'none' }}>
                {mode === 'Auto' ? 'Auto-Router' : mode === 'RAG' ? 'Strict RAG' : 'General'}
              </span>
              <span style={{ display: window.innerWidth <= 480 ? 'inline' : 'none' }}>
                {mode.slice(0, 4)}
              </span>
              <ChevronDown size={16} />
            </button>

            {showDropdown && (
              <div style={{ position: 'absolute', bottom: '120%', right: '0', background: t.bgSidebar, border: `1px solid ${t.borderDark}`, borderRadius: '12px', width: '140px', boxShadow: `0 10px 25px ${t.shadow}`, zIndex: 20, overflow: 'hidden' }}>
                {['Auto', 'RAG', 'General'].map((m) => (
                  <div 
                    key={m} 
                    onClick={() => { setMode(m); setShowDropdown(false); }}
                    style={{ padding: '10px 14px', fontSize: '0.85rem', fontWeight: '500', color: mode === m ? t.textMain : t.textMuted, background: mode === m ? t.activeSidebarBg : 'transparent', cursor: 'pointer' }}
                  >
                    {m === 'Auto' ? 'Auto-Router' : m === 'RAG' ? 'Strict RAG' : 'General LLM'}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={!apiKey || loadingChat || !query.trim()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', minWidth: '40px', borderRadius: '50%', background: (!apiKey || loadingChat || !query.trim()) ? t.activeSidebarBg : t.accent, color: t.accentText, border: 'none', cursor: (!apiKey || loadingChat || !query.trim()) ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}