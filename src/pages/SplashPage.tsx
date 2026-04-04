import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLogo from '../components/AppLogo';
import type { Session } from '@supabase/supabase-js';

interface Props {
  session: Session | null;
}

export default function SplashPage({ session }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (session) {
        navigate('/dashboard', { replace: true });
      } else if (localStorage.getItem('protask_onboarded')) {
        navigate('/login', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    }, 2200);
    return () => clearTimeout(timer);
  }, [navigate, session]);

  return (
    <div className="page--full" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, animation: 'fadeIn 0.5s ease' }}>
      <div style={{ position: 'absolute', width: 280, height: 280, background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)', borderRadius: '50%', animation: 'pulse 2s ease infinite' }} />
      <div style={{ animation: 'scaleIn 0.6s cubic-bezier(0.4,0,0.2,1) 0.3s both' }}>
        <AppLogo size={100} />
      </div>
      <div style={{ animation: 'slideUp 0.5s ease 0.6s both', textAlign: 'center' }}>
        <div style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>ProTask</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 6 }}>Tasks · Reminders · Finance · Files</div>
      </div>
      <div style={{ position: 'absolute', bottom: 50, display: 'flex', gap: 8, animation: 'fadeIn 0.5s ease 1.2s both' }}>
        {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i === 2 ? 'var(--accent-light)' : 'var(--border)', animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />)}
      </div>
    </div>
  );
}
