import React, { useEffect, useState } from 'react';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';
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
  if (isToday) return `Today at ${timeStr}`;
  if (isTomorrow) return `Tomorrow at ${timeStr}`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` at ${timeStr}`;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'done' | 'all'>('upcoming');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', remind_at: '', category: 'General' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const now = new Date().toISOString();

  async function load() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setLoading(false); return; }
    const { data, error } = await supabase.from('reminders').select('*').eq('user_id', session.user.id).order('remind_at', { ascending: true });
    setReminders((error ? [] : data || []) as Reminder[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const displayed = reminders.filter(r => {
    if (filter === 'upcoming') return !r.is_done && r.remind_at >= now;
    if (filter === 'done') return r.is_done;
    return true;
  });

  const toggleDone = async (r: Reminder) => {
    await supabase.from('reminders').update({ is_done: !r.is_done }).eq('id', r.id);
    setReminders(prev => prev.map(x => x.id === r.id ? { ...x, is_done: !x.is_done } : x));
  };

  const deleteReminder = async (id: string) => {
    await supabase.from('reminders').delete().eq('id', id);
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const addReminder = async () => {
    if (!form.title.trim() || !form.remind_at) { setError('Title and time are required.'); return; }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setError('Not logged in. Please sign in again.'); setSaving(false); return; }
    const { data, error: err } = await supabase.from('reminders').insert({
      user_id: session.user.id,
      title: form.title.trim(),
      description: form.description || null,
      remind_at: new Date(form.remind_at).toISOString(),
      category: form.category,
      is_done: false,
    }).select().single();
    setSaving(false);
    if (err) { setError(err.message); return; }
    setReminders(prev => [...prev, data as Reminder].sort((a, b) => a.remind_at.localeCompare(b.remind_at)));
    setForm({ title: '', description: '', remind_at: '', category: 'General' });
    setShowAdd(false);
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
          <button className="icon-btn" onClick={() => setShowAdd(true)} aria-label="Add reminder">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        }
      />

      <div className="page-content">
        <div className="stats-row" style={{ marginBottom: 16 }}>
          <div className="stat-card"><div className="stat-card__value">{reminders.length}</div><div className="stat-card__label">Total</div></div>
          <div className="stat-card stat-card--normal"><div className="stat-card__value" style={{ color: 'var(--accent-light)' }}>{upcomingCount}</div><div className="stat-card__label">Upcoming</div></div>
          <div className="stat-card stat-card--normal"><div className="stat-card__value" style={{ color: 'var(--success)' }}>{doneCount}</div><div className="stat-card__label">Done</div></div>
        </div>

        <div className="chips" style={{ marginBottom: 16 }}>
          {(['upcoming', 'all', 'done'] as const).map(f => (
            <button key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72 }} />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__emoji">🔔</div>
            <div className="empty-state__title">No reminders</div>
            <div className="empty-state__desc">Add a reminder to stay on track</div>
            <button className="btn btn-primary" style={{ width: 'auto', padding: '10px 24px', marginTop: 8 }} onClick={() => setShowAdd(true)}>Add Reminder</button>
          </div>
        ) : (
          <div className="card" style={{ padding: '4px 16px' }}>
            {displayed.map(r => (
              <div key={r.id} className={`reminder-item ${r.is_done ? 'done' : ''}`}>
                <div className="reminder-icon" style={{ background: r.is_done ? 'rgba(34,197,94,0.1)' : 'var(--accent-dim)' }}>
                  <span>{CAT_EMOJIS[r.category] || '📌'}</span>
                </div>
                <div className="reminder-body" style={{ flex: 1 }}>
                  <div className="reminder-title">{r.title}</div>
                  <div className="reminder-time">{formatReminderTime(r.remind_at)}</div>
                  <div className="reminder-cat">{r.category}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => toggleDone(r)}
                    style={{ background: r.is_done ? 'rgba(34,197,94,0.15)' : 'var(--accent-dim)', border: 'none', borderRadius: 'var(--radius-sm)', color: r.is_done ? 'var(--success)' : 'var(--accent-light)', cursor: 'pointer', padding: '4px 8px', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font)' }}>
                    {r.is_done ? 'Undo' : 'Done'}
                  </button>
                  <button onClick={() => deleteReminder(r.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 6 }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="overlay" onClick={() => setShowAdd(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">New Reminder</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input id="reminder-title" type="text" className="input" placeholder="Reminder title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
              <textarea className="textarea" placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
              <div className="form-group">
                <label className="form-label" htmlFor="reminder-time">Date & Time *</label>
                <input id="reminder-time" type="datetime-local" className="input" value={form.remind_at} onChange={e => setForm(f => ({ ...f, remind_at: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reminder-category">Category</label>
                <select id="reminder-category" className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              {error && <p style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>{error}</p>}
              <button id="add-reminder-submit" className="btn btn-primary" onClick={addReminder} disabled={saving}>
                {saving ? <span className="spinner" /> : 'Add Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
