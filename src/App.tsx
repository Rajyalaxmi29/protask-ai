import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Budget from './pages/Budget';
import Reminders from './pages/Reminders';
import Files from './pages/Files';
import LabelDetail from './pages/LabelDetail';
import Profile from './pages/Profile';
import Feedback from './pages/Feedback';
import AdminFeedback from './pages/AdminFeedback';
import AIChatbot from './components/AIChatbot';

// Hide chatbot on public pages
const PUBLIC_PATHS = ['/', '/login', '/register'];

function AppContent() {
  const location = useLocation();
  const showChatbot = !PUBLIC_PATHS.includes(location.pathname);

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/files" element={<Files />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/admin-feedback" element={<AdminFeedback />} />
        <Route path="/labels/:id" element={<LabelDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showChatbot && <AIChatbot />}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
