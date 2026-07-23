import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { full_name: fullName } // Save custom name to user metadata
          }
        });
        if (error) throw error;
        alert('System initialization complete. You can now log in.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090b', color: '#e4e4e7', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '2.5rem', border: '1px solid #27272a', borderRadius: '12px', width: '380px', backgroundColor: '#18181b', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, fontWeight: '600', letterSpacing: '1px', color: '#fff' }}>
            {isSignUp ? 'INIT_WORKSPACE' : 'SYS_LOGIN'}
          </h2>
          <p style={{ margin: '8px 0 0 0', color: '#a1a1aa', fontSize: '0.85rem' }}>
            Authenticate to access the RAG engine
          </p>
        </div>
        
        {error && (
          <div style={{ padding: '10px', backgroundColor: '#7f1d1d', border: '1px solid #ef4444', color: '#fca5a5', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isSignUp && (
            <input 
              type="text" 
              placeholder="Full Name (e.g. Muhammad Zaid)" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              style={{ padding: '12px', background: '#09090b', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff', outline: 'none' }}
            />
          )}
          <input 
            type="email" 
            placeholder="User / Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '12px', background: '#09090b', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff', outline: 'none' }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '12px', background: '#09090b', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff', outline: 'none' }}
          />
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ padding: '12px', background: '#e4e4e7', color: '#09090b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}
          >
            {loading ? 'AUTHENTICATING...' : (isSignUp ? 'REGISTER' : 'ENTER')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.85rem' }}
          >
            {isSignUp ? 'Existing user? Log in.' : 'Request new access credentials.'}
          </button>
        </div>
      </div>
    </div>
  );
}