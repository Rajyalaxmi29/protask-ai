import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Set initial theme before render to prevent flash
const savedTheme = localStorage.getItem('protask_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

// CLEAR CACHE & FORCE RELOAD FOR MOBILE UPDATES (Nuclear Versioning)
const PROTASK_V = '52-Premium';
if (localStorage.getItem('protask_version') !== PROTASK_V) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
  }
  if ('caches' in window) {
    caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
  }
  localStorage.setItem('protask_version', PROTASK_V);
  console.log('Mobile Cache Bursting... Hard Reloading.');
  window.location.reload();
}
if (typeof window !== 'undefined' && window.localStorage) {
  const queueKey = 'offline_mutations';
  const rawQueue = localStorage.getItem(queueKey);
  if (rawQueue) {
    try {
      const queue = JSON.parse(rawQueue);
      const cleaned = queue.filter((m: any) => {
        if (m.type === 'INSERT') {
          // UUID Check regex: ensuring we only keep database-compliant IDs
          return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(m.id);
        }
        return true;
      });
      if (cleaned.length !== queue.length) {
         localStorage.setItem(queueKey, JSON.stringify(cleaned));
         console.warn(`[Sync Health] Cleared ${queue.length - cleaned.length} invalid items.`);
      }
    } catch (e) {}
  }
}
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

