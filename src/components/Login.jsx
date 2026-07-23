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
          options: { data: { full_name: fullName } }
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

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090b', color: '#e4e4e7', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '2.5rem', border: '1px solid #27272a', borderRadius: '16px', width: '380px', backgroundColor: '#18181b', boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, fontWeight: '600', letterSpacing: '1px', color: '#fff' }}>
            {isSignUp ? 'INIT_WORKSPACE' : 'SYS_LOGIN'}
          </h2>
          <p style={{ margin: '8px 0 0 0', color: '#a1a1aa', fontSize: '0.85rem' }}>
            Authenticate to access the OS
          </p>
        </div>
        
        {error && (
          <div style={{ padding: '10px', backgroundColor: '#7f1d1d', border: '1px solid #ef4444', color: '#fca5a5', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
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
              style={{ padding: '12px', background: '#09090b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff', outline: 'none' }}
            />
          )}
          <input 
            type="email" 
            placeholder="User / Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '12px', background: '#09090b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff', outline: 'none' }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '12px', background: '#09090b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff', outline: 'none' }}
          />
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px', transition: 'opacity 0.2s' }}
          >
            {loading ? 'AUTHENTICATING...' : (isSignUp ? 'REGISTER' : 'ENTER')}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#3f3f46' }}></div>
          <span style={{ padding: '0 10px', color: '#a1a1aa', fontSize: '0.8rem' }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#3f3f46' }}></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '12px', background: '#e4e4e7', color: '#09090b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

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
