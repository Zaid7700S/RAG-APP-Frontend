import React from 'react';

export default function ChatWindow({ 
  t, chatHistory, loadingChat, chatEndRef 
}) {
  if (chatHistory.length === 0) return null;

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: '850px', margin: '0 auto', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {chatHistory.map((msg, idx) => (
          <div key={idx} style={{ alignSelf: msg?.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            <div style={{ 
              background: msg?.role === 'user' ? t.userMsgBg : 'transparent', 
              padding: msg?.role === 'user' ? '1rem 1.4rem' : '0.4rem 0', 
              borderRadius: '24px',
              borderBottomRightRadius: msg?.role === 'user' ? '4px' : '24px',
              borderBottomLeftRadius: msg?.role === 'ai' ? '4px' : '24px',
              lineHeight: '1.6',
              color: msg?.role === 'user' ? t.userMsgText : t.aiMsgText,
              fontSize: '0.95rem',
              wordBreak: 'break-word',
              boxShadow: msg?.role === 'user' ? `0 2px 10px ${t.shadow}` : 'none'
            }}>
              {msg?.content}
            </div>
            {msg?.role === 'ai' && msg?.sources?.length > 0 && (
              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: t.textMuted, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {msg.sources.map((src, i) => (
                  <span key={i} style={{ padding: '4px 10px', border: `1px solid ${t.borderDark}`, borderRadius: '12px', background: t.bgSidebar }}>
                    📄 {src.source}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {loadingChat && <div style={{ alignSelf: 'flex-start', color: t.textMuted, fontSize: '0.9rem', marginBottom: '1rem', paddingLeft: '1rem' }}>Processing query...</div>}
        <div ref={chatEndRef} style={{ height: '1px' }} />
      </div>
    </div>
  );
}
