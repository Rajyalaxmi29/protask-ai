import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { supabase } from '../lib/supabase';

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password) { setError('Please fill all fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setDone(true);
  };

  if (done) {
    return (
      <div className="page--full" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 'var(--space-md)' }}>
        <div style={{ fontSize: '4rem', animation: 'scaleIn 0.4s ease' }}>🎉</div>
        <h2 style={{ textAlign: 'center', animation: 'slideUp 0.3s ease 0.2s both' }}>Account Created!</h2>
        <p style={{ textAlign: 'center', animation: 'slideUp 0.3s ease 0.3s both' }}>Check your email to confirm your account, then sign in.</p>
        <button className="btn btn-primary" style={{ width: 'auto', padding: '12px 32px' }} onClick={() => navigate('/login')}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className="page--full" style={{ display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.4s ease' }}>
      <AppHeader showLogo showTheme />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px var(--space-md)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ marginBottom: 8 }}>Create Account ✨</h2>
          <p>Join ProTask and manage your life in one place</p>
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} noValidate>
          <div className="input-icon-wrap">
            <span className="input-prefix-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <input id="signup-name" type="text" className="input" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div className="input-icon-wrap">
            <span className="input-prefix-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
              </svg>
            </span>
            <input id="signup-email" type="email" className="input" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>

          <div className="input-icon-wrap" style={{ position: 'relative' }}>
            <span className="input-prefix-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input id="signup-password" type={showPw ? 'text' : 'password'} className="input" style={{ paddingRight: 40 }} placeholder="Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="button" className="input-suffix-btn" onClick={() => setShowPw(s => !s)} aria-label={showPw ? 'Hide' : 'Show'}>
              {showPw
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--danger)', fontSize: '0.82rem' }}>
              {error}
            </div>
          )}

          <button id="signup-submit" type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <div className="divider" style={{ margin: '24px 0' }} />
        <div style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--text-accent)', fontWeight: 600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
