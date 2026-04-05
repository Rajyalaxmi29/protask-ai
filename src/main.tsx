import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Set initial theme before render to prevent flash
const savedTheme = localStorage.getItem('protask_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

// Register service worker for offline support and notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW Registered', reg))
      .catch(err => console.error('SW Registration Failed', err));
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

