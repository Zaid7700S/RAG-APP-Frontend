import React from 'react';
import { User, Bot, FileText, Activity } from 'lucide-react';

export default function ChatWindow({ t, chatHistory, loadingChat, chatEndRef }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {chatHistory.length === 0 ? (
        <div style={{ margin: 'auto', textAlign: 'center', color: t.textMuted, maxWidth: '400px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', backgroundColor: t.activeSidebarBg, marginBottom: '16px' }}>
            <Activity size={32} color={t.accent} />
          </div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '8px', color: t.textMain }}>How can I help you today?</h2>
          <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>Upload a document to analyze it, or just ask me a general question.</p>
        </div>
      ) : (
        chatHistory.map((msg, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', 
            gap: '12px', 
            alignItems: 'flex-start',
            maxWidth: '850px',
            margin: msg.role === 'user' ? '0 0 0 auto' : '0 auto 0 0',
            width: '100%'
          }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              backgroundColor: msg.role === 'user' ? t.accent : t.activeSidebarBg,
              color: msg.role === 'user' ? t.accentText : t.textMain
            }}>
              {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: 'calc(100% - 44px)' }}>
              <div style={{ 
                padding: '12px 16px', 
                borderRadius: '16px', 
                backgroundColor: msg.role === 'user' ? t.userMsgBg : 'transparent',
                border: msg.role === 'user' ? 'none' : `1px solid ${t.border}`,
                color: msg.role === 'user' ? t.userMsgText : t.aiMsgText,
                fontSize: '0.95rem',
                lineHeight: '1.6',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap'
              }}>
                {msg.content}
                
                {/* Typing Indicator inside AI bubble if streaming hasn't yielded text yet */}
                {msg.role === 'ai' && !msg.content && loadingChat && (
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '24px' }}>
                     <style>
                      {`
                        @keyframes bounce { 
                          0%, 100% { transform: translateY(0); opacity: 0.4; } 
                          50% { transform: translateY(-4px); opacity: 1; } 
                        }
                        .dot { width: 6px; height: 6px; background-color: ${t.textMuted}; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
                        .dot1 { animation-delay: -0.32s; }
                        .dot2 { animation-delay: -0.16s; }
                      `}
                    </style>
                    <div className="dot dot1"></div>
                    <div className="dot dot2"></div>
                    <div className="dot"></div>
                  </div>
                )}
              </div>

              {msg.sources && msg.sources.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: t.textMuted, textTransform: 'uppercase' }}>Sources Identified</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {msg.sources.map((src, idx) => (
                      <div key={idx} title={`Confidence: ${src.confidence_score}`} style={{ 
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', 
                        backgroundColor: t.bgSidebar, border: `1px solid ${t.borderDark}`, borderRadius: '8px', 
                        fontSize: '0.75rem', color: t.textMuted, cursor: 'help'
                      }}>
                        <FileText size={12} />
                        <span>{src.source} (Pg {src.page})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))
      )}
      <div ref={chatEndRef} />
    </div>
  );
}
