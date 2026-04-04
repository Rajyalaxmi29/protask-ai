import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

interface Profile {
  name: string;
  email: string;
  currency: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
  const [profile, setProfile] = useState<Profile>({ name: '', email: '', currency: '₹' });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '' });
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ tasks: 0, reminders: 0, transactions: 0, files: 0 });

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const user = session.user;
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      setProfile({ name, email: user.email || '', currency: '₹' });
      setForm({ name });

      const [t, r, tx, f] = await Promise.all([
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('reminders').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('files').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);
      setStats({ tasks: t.count || 0, reminders: r.count || 0, transactions: tx.count || 0, files: f.count || 0 });
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await supabase.auth.updateUser({ data: { full_name: form.name } });
    setProfile(p => ({ ...p, name: form.name }));
    setSaving(false);
    setEditing(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  const QUICK_LINKS = [
    { icon: '✅', label: 'Tasks', count: stats.tasks, path: '/tasks' },
    { icon: '🔔', label: 'Reminders', count: stats.reminders, path: '/reminders' },
    { icon: '💸', label: 'Finance', count: stats.transactions, path: '/expenses' },
    { icon: '📁', label: 'Files', count: stats.files, path: '/files' },
  ];

  return (
    <div className="page">
      <AppHeader title="Profile" showBack showTheme />

      <div className="page-content">
        {/* Avatar + name */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 90, height: 90, borderRadius: '50%',
            background: 'var(--accent-grad)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.2rem', fontWeight: 900,
            border: '4px solid var(--bg-card)',
            boxShadow: 'var(--shadow-blue)',
            color: '#fff',
          }}>
            {profile.name.charAt(0).toUpperCase()}
          </div>
          {editing ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input id="profile-name" type="text" className="input" value={form.name} onChange={e => setForm({ name: e.target.value })} style={{ textAlign: 'center' }} placeholder="Display name" />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>{saving ? <span className="spinner" /> : 'Save'}</button>
                <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center' }}>
                <h3>{profile.name}</h3>
                <p style={{ fontSize: '0.85rem' }}>{profile.email}</p>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)} style={{ width: 'auto', padding: '8px 24px', fontSize: '0.8rem' }}>Edit Profile</button>
            </>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24 }}>
          {QUICK_LINKS.map(l => (
            <div key={l.label} onClick={() => navigate(l.path)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 6px', textAlign: 'center', cursor: 'pointer', transition: 'all var(--transition-fast)' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{l.icon}</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{l.count}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{l.label}</div>
            </div>
          ))}
        </div>

        {/* Theme toggle */}
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.2rem' }}>{isDark ? '🌙' : '☀️'}</span>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{isDark ? 'Dark Mode' : 'Light Mode'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tap to switch theme</div>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              style={{
                width: 52, height: 28,
                background: isDark ? 'var(--bg-input)' : 'var(--accent-grad)',
                border: '2px solid ' + (isDark ? 'var(--border)' : 'transparent'),
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer', position: 'relative',
                transition: 'all var(--transition-base)',
              }}
              aria-label="Toggle theme"
            >
              <div style={{
                position: 'absolute', top: 2,
                left: isDark ? 2 : 24,
                width: 20, height: 20,
                background: '#fff',
                borderRadius: '50%',
                transition: 'left var(--transition-base)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px',
              }}>
                {isDark ? '🌙' : '☀️'}
              </div>
            </button>
          </div>
        </div>

        {/* Settings list */}
        <div className="card" style={{ marginBottom: 14, padding: 0, overflow: 'hidden' }}>
          {[
            { icon: '🔔', label: 'Notifications', sub: 'Manage alerts' },
            { icon: '💱', label: 'Currency', sub: profile.currency },
            { icon: '🔒', label: 'Privacy & Security', sub: 'Manage access' },
            { icon: '📊', label: 'Export Data', sub: 'Download your data' },
          ].map((item, i, arr) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background var(--transition-fast)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{item.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.sub}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          ))}
        </div>

        {/* Logout */}
        <button
          id="logout-btn"
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', width: '100%', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font)', color: 'var(--danger)', fontWeight: 700, fontSize: '0.9rem', transition: 'background var(--transition-fast)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

