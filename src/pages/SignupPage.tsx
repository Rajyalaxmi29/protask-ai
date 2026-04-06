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
      <div className="page--full" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-md)', background: 'var(--bg-primary)' }}>
        <div className="glass-card" style={{ maxWidth: 400, width: '100%', textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ fontSize: '4rem', marginBottom: 24, animation: 'float 3s ease-in-out infinite' }}>✨</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 12 }}>Check your Inbox</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: 32 }}>We've sent a magic link to your email. Click it to verify your account and join the platform.</p>
          <button className="btn btn-primary" style={{ height: 56, fontSize: '1rem' }} onClick={() => navigate('/login')}>Back to Log In</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page--full" style={{ display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)', background: 'radial-gradient(circle at top left, var(--accent-dim), transparent), radial-gradient(circle at bottom right, var(--bg-secondary), transparent)' }}>
      <AppHeader showLogo forceDesktopLogo showTheme />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px var(--space-md)' }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: 420, padding: '40px 32px', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 8, letterSpacing: '-0.02em' }}>Join ProTask</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Experience the next generation of productivity.</p>
          </div>

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 20 }} noValidate>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-icon-wrap">
                <span className="input-prefix-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input id="signup-name" type="text" className="input" placeholder="e.g. John Doe" value={name} onChange={e => setName(e.target.value)} required style={{ height: 52 }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-icon-wrap">
                <span className="input-prefix-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </span>
                <input id="signup-email" type="email" className="input" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" style={{ height: 52 }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Choose Password</label>
              <div className="input-icon-wrap" style={{ position: 'relative' }}>
                <span className="input-prefix-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input id="signup-password" type={showPw ? 'text' : 'password'} className="input" style={{ paddingRight: 48, height: 52 }} placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" className="input-suffix-btn" onClick={() => setShowPw(s => !s)} aria-label={showPw ? 'Hide' : 'Show'}>
                  {showPw
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', padding: '12px 16px', color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600 }}>
                {error}
              </div>
            )}

            <button id="signup-submit" type="submit" className="btn btn-primary" disabled={loading} style={{ height: 56, fontSize: '1rem', fontWeight: 800, marginTop: 10 }}>
              {loading ? <span className="spinner" /> : 'Create Free Account'}
            </button>
          </form>

          <div className="divider" style={{ margin: '32px 0', opacity: 0.5 }} />
          <div style={{ textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            Already using ProTask?{' '}
            <Link to="/login" style={{ color: 'var(--accent-light)', fontWeight: 800, textDecoration: 'none' }}>Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
