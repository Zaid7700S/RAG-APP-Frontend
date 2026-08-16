import React, { useState, useEffect } from 'react';
import { X, Search, Trash2, FileText, Loader } from 'lucide-react';
import axios from 'axios';

export default function DocumentManager({ t, onClose, session, isGuest, getAuthHeaders }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const fetchDocuments = async () => {
    try {
      const backendUrl = "https://rag-app-6zlh.onrender.com";
      const res = await axios.get(`${backendUrl}/api/documents/${session.user.id}`, {
        headers: { ...getAuthHeaders() }
      });
      setDocuments(res.data.documents || []);
    } catch (error) {
      console.error("Failed to fetch documents", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (fileName) => {
    if (!window.confirm(`Are you sure you want to delete ${fileName}? This removes it from your knowledge base.`)) return;
    
    setDeleteError('');
    try {
      setDocuments(prev => prev.filter(doc => doc.file_name !== fileName));
      const backendUrl = "https://rag-app-6zlh.onrender.com";
      await axios.delete(`${backendUrl}/api/documents/${session.user.id}/${fileName}`, {
        headers: { ...getAuthHeaders() }
      });
    } catch (error) {
      setDeleteError(error.response?.data?.detail || `Failed to delete ${fileName}. Please try again.`);
      fetchDocuments(); // Revert on failure
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (doc.title && doc.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: t.backdrop, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: '800px', backgroundColor: t.bgMain, borderRadius: '16px', border: `1px solid ${t.border}`, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', display: 'flex', flexDirection: 'column', maxHeight: '85vh', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: t.bgSidebar }}>
          <h2 style={{ margin: 0, color: t.textMain, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color={t.accent} /> Knowledge Base
            {isGuest && (
              <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '3px 8px', borderRadius: '10px', background: t.inputBg, border: `1px solid ${t.borderDark}`, color: documents.length >= 3 ? t.danger : t.textMuted }}>
                {documents.length}/3 documents (Guest)
              </span>
            )}
          </h2>
          <button onClick={onClose} title="Close" aria-label="Close" style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {deleteError && (
          <div style={{ padding: '10px 1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderBottom: `1px solid ${t.border}`, color: t.danger, fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <span>{deleteError}</span>
            <X size={14} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => setDeleteError('')} role="button" aria-label="Dismiss" />
          </div>
        )}

        {/* Search Bar */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${t.border}` }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color={t.textMuted} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search your uploaded documents..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: `1px solid ${t.borderDark}`, backgroundColor: t.inputBg, color: t.textMain, boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', color: t.textMuted }}>
              <Loader className="animate-spin" size={24} />
            </div>
          ) : filteredDocs.length === 0 ? (
            <div style={{ textAlign: 'center', color: t.textMuted, padding: '2rem 0' }}>
              No documents found.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {filteredDocs.map((doc) => (
                <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1rem', border: `1px solid ${t.borderDark}`, borderRadius: '12px', backgroundColor: t.bgSidebar }}>
                  <div style={{ flex: 1, overflow: 'hidden', paddingRight: '1rem' }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: t.textMain, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.title || doc.file_name}
                    </h3>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: t.accent }}>{doc.file_name}</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: t.textMuted, lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {doc.summary}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(doc.file_name)} title={`Delete ${doc.file_name}`} aria-label={`Delete ${doc.file_name}`} style={{ background: t.inputBg, border: `1px solid ${t.borderDark}`, color: t.danger, padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
