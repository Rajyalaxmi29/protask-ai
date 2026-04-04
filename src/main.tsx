import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Set initial theme before render to prevent flash
const savedTheme = localStorage.getItem('protask_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
