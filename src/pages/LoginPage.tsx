import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill all fields.'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="page--full" style={{ display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)', background: 'radial-gradient(circle at top right, var(--accent-dim), transparent), radial-gradient(circle at bottom left, var(--bg-secondary), transparent)' }}>
      <AppHeader showLogo forceDesktopLogo showTheme />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px var(--space-md)' }}>
        
        <div className="glass-card" style={{ width: '100%', maxWidth: 420, padding: '40px 32px', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ display: 'inline-flex', background: 'var(--accent-grad)', width: 64, height: 64, borderRadius: 'var(--radius-md)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, color: '#fff', boxShadow: 'var(--shadow-blue)' }}>
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 8, letterSpacing: '-0.02em' }}>Welcome Back</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Login to access your high-performance workspace.</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }} noValidate>
            {/* Email */}
            <div className="form-group">
              <label className="form-label">Work Email</label>
              <div className="input-icon-wrap">
                <span className="input-prefix-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </span>
                <input id="login-email" type="email" className="input" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} required aria-label="Email" autoComplete="email" style={{ height: 52 }} />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-icon-wrap" style={{ position: 'relative' }}>
                <span className="input-prefix-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input id="login-password" type={showPw ? 'text' : 'password'} className="input" style={{ paddingRight: 48, height: 52 }} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required aria-label="Password" autoComplete="current-password" />
                <button type="button" className="input-suffix-btn" onClick={() => setShowPw(s => !s)} aria-label={showPw ? 'Hide' : 'Show'}>
                  {showPw
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Status Link */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8 }}>
              <Link to="/login" style={{ fontSize: '0.85rem', color: 'var(--accent-light)', fontWeight: 700, textDecoration: 'none' }}
                onClick={e => { e.preventDefault(); setError('Password recovery coming soon.'); }}>
                Forgot Password?
              </Link>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', padding: '12px 16px', color: 'var(--danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button id="login-submit" type="submit" className="btn btn-primary" disabled={loading} style={{ height: 56, fontSize: '1rem', fontWeight: 800, marginTop: 10 }}>
              {loading ? <span className="spinner" /> : 'Log In to ProTask'}
            </button>
          </form>

          <div className="divider" style={{ margin: '32px 0', opacity: 0.5 }} />

          <div style={{ textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            New to the platform?{' '}
            <Link to="/signup" style={{ color: 'var(--accent-light)', fontWeight: 800, textDecoration: 'none' }}>Create Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
