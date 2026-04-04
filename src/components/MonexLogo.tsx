import React from 'react';

export default function MonexLogo({ size = 40, showText = false }: { size?: number; showText?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="ProTask logo">
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="14" fill="url(#logoGrad)" />
        {/* P shape for ProTask */}
        <rect x="13" y="11" width="4" height="26" rx="2" fill="white" />
        <rect x="13" y="11" width="16" height="4" rx="2" fill="white" />
        <rect x="13" y="22" width="14" height="4" rx="2" fill="white" />
        <rect x="25" y="11" width="4" height="15" rx="2" fill="white" />
      </svg>
      {showText && (
        <span style={{ fontSize: size * 0.42, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          ProTask
        </span>
      )}
    </div>
  );
}
