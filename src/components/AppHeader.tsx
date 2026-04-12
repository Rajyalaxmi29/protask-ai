import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Zap } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import AppLogo from './AppLogo';

interface Props {
  title?: string;
  showLogo?: boolean;
  forceDesktopLogo?: boolean;
  showBack?: boolean;
  showTheme?: boolean;
  rightContent?: React.ReactNode;
}

export default function AppHeader({ title, showLogo, forceDesktopLogo, showBack, showTheme = true, rightContent }: Props) {
  const navigate = useNavigate();

  return (
    <header className="app-header" style={{ backdropFilter: 'blur(20px)', background: 'rgba(11, 15, 20, 0.8)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {showBack && (
          <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Go back" style={{ background: 'transparent' }}>
             <ChevronLeft size={24} />
          </button>
        )}
        
        {showLogo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
             <AppLogo size={32} />
             <div style={{ display: forceDesktopLogo ? 'block' : 'none' }} className="desktop-block">
                <span style={{ fontWeight: 900, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>ProTask<span style={{ color: 'var(--accent)' }}>.ai</span></span>
             </div>
          </div>
        )}

        {title && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="header-title" style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>{title}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
               <Zap size={10} color="var(--accent)" fill="var(--accent)" />
               <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>System Active</span>
            </div>
          </div>
        )}
      </div>

      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {rightContent}
        {showTheme && <ThemeToggle />}
      </div>
    </header>
  );
}
