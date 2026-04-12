import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Flame, 
  CheckSquare, 
  Wallet, 
  User,
  Folder
} from 'lucide-react';

const NAV = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/tracker', label: 'Tracker', icon: Flame },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/expenses', label: 'Finance', icon: Wallet },
  { path: '/files', label: 'Vault', icon: Folder },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="bottom-nav">
      {NAV.map(item => {
        const active = pathname === item.path || (pathname === '/' && item.path === '/dashboard');
        const Icon = item.icon;
        return (
          <button
            key={item.path}
            className={`nav-item ${active ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: 4,
              cursor: 'pointer',
              padding: '8px 0',
              flex: 1
            }}
          >
            <div style={{ position: 'relative' }}>
               <Icon 
                 size={22} 
                 color={active ? 'var(--accent)' : 'var(--text-muted)'} 
                 strokeWidth={active ? 2.5 : 2} 
               />
               {active && (
                 <div style={{ 
                   position: 'absolute', 
                   top: -8, 
                   left: '50%', 
                   transform: 'translateX(-50%)', 
                   width: 4, 
                   height: 4, 
                   borderRadius: '50%', 
                   background: 'var(--accent)',
                   boxShadow: '0 0 8px var(--accent)'
                 }} />
               )}
            </div>
            <span style={{ 
              fontSize: '0.6rem', 
              fontWeight: 800, 
              color: active ? 'var(--accent)' : 'var(--text-muted)',
              textTransform: 'capitalize'
            }}>
              {item.label}
            </span>
            {active && (
               <div style={{ 
                 position: 'absolute', 
                 bottom: 0, 
                 width: 20, 
                 height: 2, 
                 background: 'var(--accent)', 
                 borderRadius: '2px' 
               }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
