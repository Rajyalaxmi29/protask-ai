import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';
import { persistentData } from '../lib/persistentData';
import type { Task, Reminder, Transaction, FileRecord } from '../lib/supabase';

interface Counts {
  tasks: number;
  tasksDone: number;
  reminders: number;
  remindersToday: number;
  income: number;
  expense: number;
  files: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<Counts>({ tasks: 0, tasksDone: 0, reminders: 0, remindersToday: 0, income: 0, expense: 0, files: 0 });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      setUserName(user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User');
      setAvatarUrl(user?.user_metadata?.avatar_url || null);

      const uid = user?.id;
      if (!uid) { setLoading(false); return; }

      const [tasks, reminders, transactions, files] = await Promise.all([
        persistentData.get<Task>('tasks', uid),
        persistentData.get<Reminder>('reminders', uid, 'remind_at'),
        persistentData.get<Transaction>('transactions', uid, 'date'),
        persistentData.get<FileRecord>('files', uid),
      ]);

      const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const remindersToday = reminders.filter(r => !r.is_done && r.remind_at.startsWith(today)).length;

      setCounts({
        tasks: tasks.filter(t => (t.status ?? 'todo') !== 'done').length,
        tasksDone: tasks.filter(t => (t.status ?? 'todo') === 'done').length,
        reminders: reminders.filter(r => !r.is_done).length,
        remindersToday,
        income,
        expense,
        files: files.length,
      });
      setRecentTasks(tasks.filter(t => (t.status ?? 'todo') !== 'done').slice(0, 3));
      setUpcomingReminders(reminders.filter(r => !r.is_done && r.remind_at >= now).slice(0, 3));
      setLoading(false);
    }
    load();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const MODULES = [
    {
      title: 'Tasks',
      count: counts.tasks,
      subtitle: `${counts.tasksDone} completed`,
      emoji: '✅',
      color: '#2563eb',
      path: '/tasks',
    },
    {
      title: 'Reminders',
      count: counts.reminders,
      subtitle: `${counts.remindersToday} today`,
      emoji: '🔔',
      color: '#f59e0b',
      path: '/reminders',
    },
    {
      title: 'Finance',
      count: `₹${counts.income.toFixed(0)}`,
      subtitle: `Spent ₹${counts.expense.toFixed(0)}`,
      emoji: '💸',
      color: '#22c55e',
      path: '/expenses',
    },
    {
      title: 'Files',
      count: counts.files,
      subtitle: 'Documents',
      emoji: '📁',
      color: '#8b5cf6',
      path: '/files',
    },
  ];

  return (
    <div className="page">
      <AppHeader
        showLogo
        showTheme
        rightContent={
          <div
            onClick={() => navigate('/profile')}
            style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', color: '#fff', border: '2px solid rgba(255,255,255,0.15)', overflow: 'hidden' }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              userName.charAt(0).toUpperCase()
            )}
          </div>
        }
      />

      <div className="page-content">
        {/* Greeting */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 2 }}>{greeting()},</p>
          <h2 style={{ fontSize: '1.5rem' }}>{userName} 👋</h2>
        </div>

        {/* Quick stats */}
        <div style={{ background: 'var(--accent-grad)', borderRadius: 'var(--radius-lg)', padding: '18px', marginBottom: 20, boxShadow: 'var(--shadow-blue)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, background: 'rgba(255,255,255,0.07)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: -30, left: -10, width: 80, height: 80, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', fontWeight: 600, marginBottom: 12 }}>Today's Overview</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            {[
              { label: 'Pending Tasks', val: counts.tasks },
              { label: 'Reminders Today', val: counts.remindersToday },
              { label: 'Balance', val: `₹${(counts.income - counts.expense).toFixed(0)}` },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, minWidth: '100px' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 4 Feature modules */}
        <div className="section-header">
          <span className="section-title">Features</span>
        </div>
        <div className="feature-grid" style={{ marginBottom: 24 }}>
          {MODULES.map(m => (
            <div key={m.title} className="feature-card" onClick={() => navigate(m.path)}>
              <div className="feature-card__header">
                <div className="feature-card__icon-wrap" style={{ background: `${m.color}22` }}>
                  <span style={{ fontSize: '1.3rem' }}>{m.emoji}</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
              <div>
                <div className="feature-card__count" style={{ color: m.color }}>{m.count}</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{m.title}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{m.subtitle}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Tasks */}
        {!loading && recentTasks.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="section-header" style={{ marginBottom: 8 }}>
              <span className="section-title">Pending Tasks</span>
              <button className="section-link" onClick={() => navigate('/tasks')}>See all</button>
            </div>
            {recentTasks.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: (t.priority ?? 'medium') === 'high' ? 'var(--danger)' : (t.priority ?? 'medium') === 'medium' ? 'var(--warning)' : 'var(--success)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 500 }}>{t.title}</span>
                {t.due_date && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.due_date}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Upcoming Reminders */}
        {!loading && upcomingReminders.length > 0 && (
          <div className="card">
            <div className="section-header" style={{ marginBottom: 8 }}>
              <span className="section-title">Upcoming Reminders</span>
              <button className="section-link" onClick={() => navigate('/reminders')}>See all</button>
            </div>
            {upcomingReminders.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '1.2rem' }}>🔔</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>{r.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(r.remind_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 'var(--radius-lg)' }} />)}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
