import React from 'react';
import { useNavigate } from 'react-router-dom';
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
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {showBack && (
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        {showLogo && <div className={forceDesktopLogo ? "" : "mobile-only-logo"}><AppLogo size={32} showText /></div>}
        {title && <span className="header-title">{title}</span>}
      </div>
      <div className="header-actions">
        {rightContent}
        {showTheme && <ThemeToggle />}
      </div>
    </header>
  );
}
