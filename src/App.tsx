import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { ThemeProvider } from './contexts/ThemeContext';
import { InstallProvider } from './contexts/InstallContext';
import type { Session } from '@supabase/supabase-js';
import NotificationManager from './components/NotificationManager';
import IOSInstallPrompt from './components/IOSInstallPrompt';
import SyncManager from './components/SyncManager';

// Pages
import SplashPage from './pages/SplashPage';
import OnboardingPage from './pages/OnboardingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import RemindersPage from './pages/RemindersPage';
import ExpensesPage from './pages/ExpensesPage';
import FilesPage from './pages/FilesPage';
import ProfilePage from './pages/ProfilePage';
import AddExpensePage from './pages/AddExpensePage';

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div style={{ fontSize: '2.5rem', animation: 'pulse 1.5s ease infinite' }}>⚡</div>
      <div className="spinner spinner-dark" />
    </div>
  );
}

function Protected({ session, children }: { session: Session | null; children: React.ReactNode }) {
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div style={{
      background: 'var(--danger)',
      color: '#fff',
      padding: '8px 16px',
      textAlign: 'center',
      fontSize: '0.8rem',
      fontWeight: 700,
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
    }}>
      <span>📶</span> You are currently offline. Some features may be limited.
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    // Set initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Still loading
  if (session === undefined) {
    return (
      <ThemeProvider>
        <div className="app-shell"><LoadingScreen /></div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <InstallProvider>
        <BrowserRouter>
          <div className="app-shell">
            <NotificationManager />
            <SyncManager />
            <IOSInstallPrompt />
            <OfflineBanner />
            <Routes>
              {/* Public */}
              <Route path="/" element={<SplashPage session={session} />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
              <Route path="/signup" element={session ? <Navigate to="/dashboard" replace /> : <SignupPage />} />

              {/* Protected */}
              <Route path="/dashboard"  element={<Protected session={session}><DashboardPage /></Protected>} />
              <Route path="/tasks"      element={<Protected session={session}><TasksPage /></Protected>} />
              <Route path="/reminders"  element={<Protected session={session}><RemindersPage /></Protected>} />
              <Route path="/expenses"   element={<Protected session={session}><ExpensesPage /></Protected>} />
              <Route path="/files"      element={<Protected session={session}><FilesPage /></Protected>} />
              <Route path="/profile"    element={<Protected session={session}><ProfilePage /></Protected>} />
              <Route path="/add-expense" element={<Protected session={session}><AddExpensePage /></Protected>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </BrowserRouter>
      </InstallProvider>
    </ThemeProvider>
  );
}

