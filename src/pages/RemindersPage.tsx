import React, { useEffect, useState } from 'react';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';
import { persistentData } from '../lib/persistentData';
import type { Reminder } from '../lib/supabase';

const CATEGORIES = ['General', 'Work', 'Health', 'Personal', 'Finance', 'Shopping', 'Travel', 'Study'];
const CAT_EMOJIS: Record<string, string> = {
  General: '📌', Work: '💼', Health: '🏥', Personal: '👤',
  Finance: '💸', Shopping: '🛍️', Travel: '✈️', Study: '📚',
};

function formatReminderTime(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const isToday = d.toDateString() === today.toDateString();
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  
  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  let dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  if (isToday) dateStr = 'Today';
  else if (isTomorrow) dateStr = 'Tomorrow';
  
  return { date: dateStr, time: timeStr, isOverdue: d < new Date() };
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'done' | 'all'>('all'); // Default to 'all' to show everything
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    date: new Date().toISOString().split('T')[0], 
    time: '12:00',
    category: 'General' 
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const now = new Date().toISOString();

  async function load() {
    const userId = await persistentData.getUserId();
    if (!userId) { setLoading(false); return; }
    const data = await persistentData.get<Reminder>('reminders', userId, 'remind_at');
    setReminders(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const displayed = reminders.filter(r => {
    if (filter === 'upcoming') return !r.is_done && r.remind_at >= now;
    if (filter === 'done') return r.is_done;
    return true;
  });

  const toggleDone = async (r: Reminder) => {
    const updated = await persistentData.mutate('reminders', 'UPDATE', { ...r, is_done: !r.is_done });
    setReminders(prev => prev.map(x => x.id === r.id ? updated : x));
  };

  const deleteReminder = async (id: string) => {
    await persistentData.mutate('reminders', 'DELETE', { id });
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const addReminder = async () => {
    if (!form.title.trim() || !form.date || !form.time) { setError('Title, date and time are required.'); return; }
    setSaving(true);
    const userId = await persistentData.getUserId();
    if (!userId) { setError('Not logged in. Please sign in again.'); setSaving(false); return; }
    
    // Combine date and time
    const dateTime = new Date(`${form.date}T${form.time}`).toISOString();

    const newRem = {
      user_id: userId,
      title: form.title.trim(),
      description: form.description || null,
      remind_at: dateTime,
      category: form.category,
      is_done: false,
      created_at: new Date().toISOString()
    };

    const saved = await persistentData.mutate('reminders', 'INSERT', newRem);
    setReminders(prev => [...prev, saved as Reminder].sort((a, b) => a.remind_at.localeCompare(b.remind_at)));
    setForm({ title: '', description: '', date: new Date().toISOString().split('T')[0], time: '12:00', category: 'General' });
    setShowAdd(false);
    setSaving(false);
    setError('');
  };

  const upcomingCount = reminders.filter(r => !r.is_done && r.remind_at >= now).length;
  const doneCount = reminders.filter(r => r.is_done).length;

  return (
    <div className="page">
      <AppHeader
        title="Reminders"
        showBack
        showTheme
        rightContent={
          <button className="icon-btn" onClick={() => setShowAdd(true)} aria-label="Add reminder" style={{ background: 'var(--accent-grad)', border: 'none', color: '#fff' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        }
      />

      <div className="page-content">
        <div className="stats-row" style={{ marginBottom: 20 }}>
          <div className="stat-card glass-card" style={{ background: 'var(--accent-grad)', border: 'none' }}>
            <div className="stat-card__value">{reminders.length}</div>
            <div className="stat-card__label">Total</div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-card__value" style={{ color: 'var(--accent-light)' }}>{upcomingCount}</div>
            <div className="stat-card__label">Upcoming</div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-card__value" style={{ color: 'var(--success)' }}>{doneCount}</div>
            <div className="stat-card__label">Done</div>
          </div>
        </div>

        <div className="chips" style={{ marginBottom: 20 }}>
          {(['all', 'upcoming', 'done'] as const).map(f => (
            <button key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-lg)' }} />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__emoji">🔔</div>
            <div className="empty-state__title">No reminders found</div>
            <div className="empty-state__desc">Stay organized by adding reminders for your important tasks.</div>
            <button className="btn btn-primary" style={{ width: 'auto', padding: '12px 32px', marginTop: 12 }} onClick={() => setShowAdd(true)}>Create Reminder</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {displayed.map(r => {
              const { date, time, isOverdue } = formatReminderTime(r.remind_at);
              return (
                <div key={r.id} className={`card ${r.is_done ? 'done' : ''}`} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 16, background: r.is_done ? 'var(--bg-card)' : 'var(--bg-secondary)', border: r.is_done ? '1px solid var(--border)' : '1px solid var(--border-active)' }}>
                  <div className="reminder-icon" style={{ background: r.is_done ? 'var(--accent-dim)' : 'var(--accent-grad)', width: 48, height: 48, borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '1.4rem' }}>
                    <span>{CAT_EMOJIS[r.category] || '📌'}</span>
                  </div>
                  <div className="reminder-body" style={{ flex: 1 }}>
                    <div className="reminder-title" style={{ fontSize: '1rem', fontWeight: 700, color: r.is_done ? 'var(--text-muted)' : 'var(--text-primary)' }}>{r.title}</div>
                    <div className="reminder-meta-row" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                      <div className="reminder-date" style={{ color: !r.is_done && isOverdue ? 'var(--danger)' : 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        {date}
                      </div>
                      <div className="reminder-time" style={{ color: 'var(--accent-light)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {time}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => toggleDone(r)}
                      style={{ background: r.is_done ? 'var(--accent-dim)' : 'var(--bg-input)', border: 'none', borderRadius: 'var(--radius-sm)', color: r.is_done ? 'var(--success)' : 'var(--accent-light)', cursor: 'pointer', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 800 }}>
                      {r.is_done ? 'DONE' : 'DO IT'}
                    </button>
                    <button onClick={() => deleteReminder(r.id)} className="icon-btn" style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="overlay" onClick={() => setShowAdd(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-primary)', borderTop: '2px solid var(--accent-light)' }}>
            <div className="sheet-handle" style={{ background: 'var(--accent-dim)', width: 40, height: 4 }} />
            <div className="sheet-title" style={{ fontSize: '1.4rem', textAlign: 'center', marginBottom: 24 }}>New Reminder</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="form-group">
                <input id="reminder-title" type="text" className="input" placeholder="What should I remind you about? *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus style={{ fontSize: '1.1rem', padding: '16px' }} />
              </div>
              
              <div className="form-group">
                <textarea className="textarea" placeholder="Add some notes (optional)..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Set Date</label>
                  <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Set Time</label>
                  <input type="time" className="input" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <div className="chips" style={{ flexWrap: 'wrap', gap: 8 }}>
                  {CATEGORIES.map(c => (
                    <button key={c} className={`chip ${form.category === c ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, category: c }))}>
                      {CAT_EMOJIS[c]} {c}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', textAlign: 'center', fontWeight: 600 }}>{error}</p>}
              
              <button id="add-reminder-submit" className="btn btn-primary" onClick={addReminder} disabled={saving} style={{ height: 56, fontSize: '1rem' }}>
                {saving ? <span className="spinner" /> : 'Set Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
