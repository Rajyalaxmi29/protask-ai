import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Set initial theme before render to prevent flash
const savedTheme = localStorage.getItem('protask_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

// FORCE UNREGISTER Service Worker in development to allow instant mobile updates
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (let registration of registrations) {
      registration.unregister();
      console.log('SW Unregistered for Live Development');
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

