import React from 'react';
import { Paperclip, X, Plus, ChevronDown, Send } from 'lucide-react';

export default function InputBar({
  t, chatHistoryLength, userFullName,
  uploadStatus, uploadProgress, file, setFile, setUploadStatus, handleFileSelect,
  handleChatSubmit, query, setQuery, apiKey, loadingChat,
  mode, setMode, showDropdown, setShowDropdown
}) {
  const suggestedPrompts = [
    "Summarize the key points of this document",
    "What are the main risks or limitations mentioned?",
    "Explain this in simple terms"
  ];
  return (
    <div style={{ width: '100%', boxSizing: 'border-box', padding: '1rem', marginTop: chatHistoryLength === 0 ? '-10vh' : '0' }}>
      <div style={{ width: '100%', maxWidth: '850px', margin: '0 auto' }}>
        
        {chatHistoryLength === 0 && (
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontWeight: '500', margin: '0 0 10px 0', fontSize: '1.8rem', color: t.textMain }}>
              Hello, {userFullName}
            </h2>
            <p style={{ color: t.textMuted, margin: '0 0 20px 0', fontSize: '1rem' }}>How can I help you today?</p>
            {apiKey && (
              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px' }}>
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setQuery(prompt)}
                    style={{ padding: '8px 14px', borderRadius: '16px', border: `1px solid ${t.borderDark}`, background: t.inputBg, color: t.textMuted, fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {uploadStatus && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: t.inputBg, border: `1px solid ${t.borderDark}`, padding: '6px 14px', borderRadius: '16px', fontSize: '0.8rem', color: t.textMuted }}>
              <Paperclip size={14} />
              <span style={{ maxWidth: '350px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{uploadStatus}</span>
              {file && <X size={14} style={{ cursor: 'pointer', marginLeft: '5px' }} onClick={() => { setFile(null); setUploadStatus(''); }} />}
            </div>
            {typeof uploadProgress === 'number' && uploadProgress < 100 && (
              <div style={{ width: '220px', height: '4px', background: t.borderDark, borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', background: t.accent, borderRadius: '2px', transition: 'width 0.4s ease' }} />
              </div>
            )}
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
