import React, { useState } from 'react';
import { User, Bot, FileText, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatWindow({ t, chatHistory, loadingChat, chatEndRef }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (content, index) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex((cur) => (cur === index ? null : cur)), 1500);
    });
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Global styles for chat animations and markdown formatting */}
      <style>
        {`
          @keyframes bounce { 0%, 100% { transform: translateY(0); opacity: 0.4; } 50% { transform: translateY(-4px); opacity: 1; } }
          .dot { width: 6px; height: 6px; background-color: ${t.textMuted}; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
          .dot1 { animation-delay: -0.32s; }
          .dot2 { animation-delay: -0.16s; }
          
          .ai-markdown p { margin-top: 0; margin-bottom: 0.8rem; }
          .ai-markdown p:last-child { margin-bottom: 0; }
          .ai-markdown ul, .ai-markdown ol { margin-top: 0; margin-bottom: 0.8rem; padding-left: 1.5rem; }
          .ai-markdown ul { list-style-type: disc; }
          .ai-markdown ol { list-style-type: decimal; }
          .ai-markdown li { margin-bottom: 0.3rem; display: list-item; }
          .ai-markdown li > p { margin: 0; display: inline; }
          .ai-markdown pre { background: rgba(0,0,0,0.1); padding: 8px; border-radius: 6px; overflow-x: auto; }
          .ai-markdown code { background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }

          .ai-markdown table { border-collapse: collapse; width: 100%; margin: 0.6rem 0 1rem 0; font-size: 0.88em; display: block; overflow-x: auto; white-space: nowrap; }
          .ai-markdown th, .ai-markdown td { border: 1px solid ${t.borderDark}; padding: 6px 12px; text-align: left; }
          .ai-markdown th { background: ${t.bgSidebar}; font-weight: 600; }
          .ai-markdown tr:nth-child(even) td { background: rgba(128, 128, 128, 0.06); }

          .msg-row .msg-copy-btn { opacity: 0; transition: opacity 0.15s ease; }
          .msg-row:hover .msg-copy-btn { opacity: 1; }
        `}
      </style>

      {/* Centralized Message Column */}
      <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {chatHistory.map((msg, index) => (
          <div key={index} className="msg-row" style={{ 
            display: 'flex', 
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', 
            gap: '16px', 
            alignItems: 'flex-start',
            width: '100%'
          }}>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              backgroundColor: msg.role === 'user' ? t.accent : t.activeSidebarBg,
              color: msg.role === 'user' ? t.accentText : t.textMain
            }}>
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '80%' }}>
              <div 
                className={msg.role === 'ai' ? 'ai-markdown' : ''}
                style={{ 
                  padding: '12px 18px', 
                  borderRadius: '16px', 
                  backgroundColor: msg.role === 'user' ? t.userMsgBg : 'transparent',
                  border: msg.role === 'user' ? 'none' : `1px solid ${t.border}`,
                  color: msg.role === 'user' ? t.userMsgText : t.aiMsgText,
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                  wordBreak: 'break-word',
                  /* Disable pre-wrap for AI so markdown handles the spacing */
                  whiteSpace: msg.role === 'user' ? 'pre-wrap' : 'normal'
                }}>
                
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                )}
                
                {/* Typing Indicator */}
                {msg.role === 'ai' && !msg.content && loadingChat && (
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '24px' }}>
                    <div className="dot dot1"></div>
                    <div className="dot dot2"></div>
                    <div className="dot"></div>
                  </div>
                )}
              </div>

              {msg.content && (
                <button
                  className="msg-copy-btn"
                  onClick={() => handleCopy(msg.content, index)}
                  title="Copy message"
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: t.textMuted, fontSize: '0.7rem', padding: '2px 4px'
                  }}
                >
                  {copiedIndex === index ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                </button>
              )}

              {msg.sources && msg.sources.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: t.textMuted, textTransform: 'uppercase' }}>Sources</span>
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
        ))}
        
        {/* Invisible div to scroll to bottom */}
        <div ref={chatEndRef} />
      </div>
      
    </div>
  );
}