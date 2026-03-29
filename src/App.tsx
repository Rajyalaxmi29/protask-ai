import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
import { supabase } from './lib/supabase';

// Hide chatbot on public pages
const PUBLIC_PATHS = ['/', '/login', '/register'];
const AUTH_ONLY_PATHS = ['/login', '/register'];

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const showChatbot = !PUBLIC_PATHS.includes(location.pathname);
  const [isAuthChecking, setIsAuthChecking] = React.useState(true);

  // 1. Initial Launch Check (Runs exactly once when app opens)
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      // On fresh app load, if logged in and on Home or Auth pages, go straight to dashboard
      // Read window.location.pathname so it only cares about the EXACT entry path, not future clicks
      if (session && PUBLIC_PATHS.includes(window.location.pathname)) {
        navigate('/dashboard', { replace: true });
      }
      setIsAuthChecking(false);
    });
  }, []); // <-- Empty array: only runs ONCE

  // 2. Active Session Listener (Handles logouts and active navigation)
  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && AUTH_ONLY_PATHS.includes(location.pathname)) {
        navigate('/dashboard', { replace: true });
      } else if (!session && !PUBLIC_PATHS.includes(location.pathname)) {
        // Auto sign-out redirect for protected routes
        navigate('/login', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [location.pathname, navigate]);

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#020817] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
