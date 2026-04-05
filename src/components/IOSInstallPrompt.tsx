import React, { useEffect, useState } from 'react';

export default function IOSInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // Check if it's NOT already installed (standalone mode)
    const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;

    if (isIOS && !isStandalone) {
      // Check if we already showed it recently
      const lastShown = localStorage.getItem('ios_prompt_shown');
      const now = Date.now();
      
      // Only show if never shown OR shown more than 24h ago
      if (!lastShown || now - parseInt(lastShown) > 86400000) {
        setShow(true);
      }
    }
  }, []);

  if (!show) return null;

  return (
    <div className="ios-prompt" style={{
      position: 'fixed',
      bottom: 'var(--nav-height, 80px)',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)',
      maxWidth: '400px',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--accent-light)',
      borderRadius: 'var(--radius-xl)',
      padding: '16px',
      zIndex: 1000,
      boxShadow: 'var(--shadow-blue)',
      animation: 'slideUp 0.5s ease'
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <img src="/app-icon.jpg" alt="App Icon" style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Install ProTask AI</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Add to your home screen for the full experience.</div>
        </div>
        <button 
          onClick={() => {
            setShow(false);
            localStorage.setItem('ios_prompt_shown', Date.now().toString());
          }}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
        >
          ✕
        </button>
      </div>
      
      <div style={{ 
        marginTop: 12, 
        padding: '10px 12px', 
        background: 'var(--accent-dim)', 
        borderRadius: 'var(--radius-md)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 10,
        fontSize: '0.8rem',
        fontWeight: 600
      }}>
        <span>Tap 📤 Share, then <b>"Add to Home Screen"</b></span>
        <span style={{ fontSize: '1.2rem' }}>⤴️</span>
      </div>
    </div>
  );
}
