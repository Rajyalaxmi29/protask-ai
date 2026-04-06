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
      const uid = await persistentData.getUserId();
      if (!uid) { setLoading(false); return; }
      
      // Update basic UI if we can
      if (navigator.onLine) {
        supabase.auth.getSession().then(({ data }) => {
          const user = data.session?.user;
          setUserName(user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User');
          setAvatarUrl(user?.user_metadata?.avatar_url || null);
        });
      } else {
        setUserName(localStorage.getItem('last_user_name') || 'User');
      }

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
            style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--accent-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', color: '#fff', border: '3px solid rgba(255,255,255,0.15)', overflow: 'hidden', boxShadow: 'var(--shadow-blue)' }}
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
        {/* Greeting Section */}
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.02em' }}>{greeting()},</p>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{userName}</h2>
          </div>
          <div className="glass-card" style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 10 }}>
             <span style={{ fontSize: '1.2rem', animation: 'float 3s ease-in-out infinite' }}>🚀</span>
             <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-light)' }}>ACTIVE</span>
          </div>
        </div>

        {/* Today's Overview Glass Card */}
        <div className="glass-card" style={{ background: 'var(--accent-grad)', border: 'none', padding: '24px', marginBottom: 32, boxShadow: 'var(--shadow-blue)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -20, width: 140, height: 140, background: 'rgba(255,255,255,0.12)', borderRadius: '50%', filter: 'blur(30px)' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -10, width: 100, height: 100, background: 'rgba(255,255,255,0.08)', borderRadius: '50%', filter: 'blur(20px)' }} />
          
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>Today's Performance</div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[
              { label: 'Tasks', val: counts.tasks, color: '#fff' },
              { label: 'Reminders', val: counts.remindersToday, color: '#fff' },
              { label: 'Balance', val: `₹${(counts.income - counts.expense).toFixed(0)}`, color: '#fff' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 8 }}>{s.val}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="section-header" style={{ marginBottom: 16 }}>
          <span className="section-title" style={{ fontSize: '1.1rem', fontWeight: 900 }}>Ecosystem</span>
        </div>
        <div className="feature-grid" style={{ marginBottom: 32 }}>
          {MODULES.map(m => (
            <div key={m.title} className="glass-card feature-card" onClick={() => navigate(m.path)} style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer' }}>
              <div className="feature-card__header" style={{ marginBottom: 16 }}>
                <div className="feature-card__icon-wrap" style={{ background: `${m.color}15`, color: m.color, width: 44, height: 44 }}>
                  <span style={{ fontSize: '1.4rem' }}>{m.emoji}</span>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: 8, fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>OPEN</div>
              </div>
              <div>
                <div className="feature-card__count" style={{ color: 'var(--text-primary)', fontSize: '1.3rem', fontWeight: 900 }}>{m.count}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-muted)', marginTop: 4 }}>{m.title}</div>
                <div style={{ fontSize: '0.7rem', color: m.color, fontWeight: 700, marginTop: 4 }}>{m.subtitle}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
          {/* Recent Tasks */}
          {!loading && recentTasks.length > 0 && (
            <div className="glass-card" style={{ border: '1px solid var(--border)' }}>
              <div className="section-header" style={{ marginBottom: 16 }}>
                <span className="section-title" style={{ fontSize: '1rem', fontWeight: 900 }}>Recent Tasks</span>
                <button className="section-link" onClick={() => navigate('/tasks')} style={{ color: 'var(--accent-light)', fontWeight: 800 }}>Explore</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recentTasks.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: (t.priority ?? 'medium') === 'high' ? 'var(--danger)' : (t.priority ?? 'medium') === 'medium' ? 'var(--warning)' : 'var(--success)', boxShadow: `0 0 10px ${(t.priority ?? 'medium') === 'high' ? 'var(--danger)' : (t.priority ?? 'medium') === 'medium' ? 'var(--warning)' : 'var(--success)'}55` }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{t.title}</div>
                      {t.due_date && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Deadline: {t.due_date}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Reminders */}
          {!loading && upcomingReminders.length > 0 && (
            <div className="glass-card" style={{ border: '1px solid var(--border)' }}>
              <div className="section-header" style={{ marginBottom: 16 }}>
                <span className="section-title" style={{ fontSize: '1rem', fontWeight: 900 }}>Immediate Alerts</span>
                <button className="section-link" onClick={() => navigate('/reminders')} style={{ color: 'var(--accent-light)', fontWeight: 800 }}>View Timeline</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {upcomingReminders.map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '1.4rem' }}>🔔</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{r.title}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--accent-light)', fontWeight: 700, marginTop: 2 }}>{new Date(r.remind_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} today</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />)}
          </div>
        ) }
      </div>

      <BottomNav />
    </div>
  );
}
