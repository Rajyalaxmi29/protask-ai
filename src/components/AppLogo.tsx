import React from 'react';

export default function AppLogo({ size = 40, showText = false }: { size?: number; showText?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <img 
        src="/app-icon.jpg" 
        alt="ProTask Logo" 
        style={{ 
          width: size, 
          height: size, 
          borderRadius: size * 0.25, 
          objectFit: 'cover',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }} 
      />
      {showText && (
        <span style={{ fontSize: size * 0.45, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          ProTask
        </span>
      )}
    </div>
  );
}
