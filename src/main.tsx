import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Set initial theme before render to prevent flash
const savedTheme = localStorage.getItem('protask_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

// FORCE UNREGISTER Service Worker in development to allow instant mobile updates
// AGGRESSIVE MOBILE CACHE CLEARING
// Forces all service workers and caches to reset to ensure mobile browsers see live updates instantly.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (let registration of registrations) {
      registration.unregister().then(() => {
        console.log('SW Unregistered Success');
        if ('caches' in window) {
           caches.keys().then(names => {
             for (let name of names) caches.delete(name);
           });
        }
      });
    }
  });
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

