import React, { useEffect, useState } from 'react';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';
import { persistentData } from '../lib/persistentData';
import type { Task, Priority, TaskStatus } from '../lib/supabase';

const PRIORITIES: Priority[] = ['low', 'medium', 'high'];
const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];

const PRIORITY_COLOR: Record<Priority, string> = { low: 'var(--success)', medium: 'var(--warning)', high: 'var(--danger)' };

function formatDue(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  
  const isToday = d.toDateString() === today.toDateString();
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  
  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  let dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  if (isToday) dateStr = 'Today';
  else if (isTomorrow) dateStr = 'Tomorrow';
  
  return { date: dateStr, time: iso.includes('T') || iso.includes(':') ? timeStr : null, overdue: d < now && !isToday };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | TaskStatus>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    priority: 'medium' as Priority, 
    date: new Date().toISOString().split('T')[0],
    time: '09:00'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const userId = await persistentData.getUserId();
    if (!userId) { setLoading(false); return; }
    const data = await persistentData.get<Task>('tasks', userId);
    setTasks(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const displayed = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const toggleStatus = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    const updated = await persistentData.mutate('tasks', 'UPDATE', { ...task, status: newStatus });
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
  };

  const deleteTask = async (id: string) => {
    await persistentData.mutate('tasks', 'DELETE', { id });
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addTask = async () => {
    if (!form.title.trim()) { setError('Title is required.'); return; }
    setSaving(true);
    setError('');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setError('Not logged in. Please sign in again.'); setSaving(false); return; }
    
    // Combined date and time
    const dateTime = form.date && form.time ? new Date(`${form.date}T${form.time}`).toISOString() : form.date ? new Date(form.date).toISOString() : null;

    const newTask = {
      user_id: session.user.id,
      title: form.title.trim(),
      description: form.description || null,
      priority: form.priority,
      status: 'todo',
      due_date: dateTime,
      created_at: new Date().toISOString()
    };

    const saved = await persistentData.mutate('tasks', 'INSERT', newTask);
    setTasks(prev => [saved as Task, ...prev]);
    setForm({ title: '', description: '', priority: 'medium', date: new Date().toISOString().split('T')[0], time: '09:00' });
    setShowAdd(false);
    setSaving(false);
    setError('');
  };

  const counts = { total: tasks.length, done: tasks.filter(t => t.status === 'done').length, pending: tasks.filter(t => t.status === 'todo' || t.status === 'in_progress').length };

  return (
    <div className="page">
      <AppHeader
        title="Tasks"
        showBack
        showTheme
        rightContent={
          <button className="icon-btn" onClick={() => setShowAdd(true)} aria-label="Add task" style={{ background: 'var(--accent-grad)', border: 'none', color: '#fff' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        }
      />

      <div className="page-content">
        {/* Stats Row with prioritized visibility */}
        <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 32 }}>
          <div className="glass-card" style={{ background: 'var(--accent-grad)', border: 'none', padding: '20px 12px', textAlign: 'center', boxShadow: 'var(--shadow-blue)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{counts.total}</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Tasks</div>
          </div>
          
          <div className="glass-card" style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '20px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--warning)', lineHeight: 1 }}>{counts.pending}</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8 }}>Pending</div>
          </div>

          <div className="glass-card" style={{ background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.4)', padding: '20px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--success)', lineHeight: 1 }}>{counts.done}</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8 }}>Completed</div>
          </div>
        </div>

        {/* Filter chips */}
        <div className="chips" style={{ marginBottom: 20 }}>
          {(['all', 'todo', 'in_progress', 'done'] as const).map(f => (
            <button key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f === 'todo' ? 'To Do' : f === 'in_progress' ? 'Running' : 'Done'}
            </button>
          ))}
        </div>

        {/* Task list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-lg)' }} />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__emoji">📋</div>
            <div className="empty-state__title">No tasks found</div>
            <div className="empty-state__desc">Great things happen when you start planning. Create your first task!</div>
            <button className="btn btn-primary" style={{ width: 'auto', padding: '12px 32px', marginTop: 12 }} onClick={() => setShowAdd(true)}>Create Task</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {displayed.map(task => {
              const due = formatDue(task.due_date);
              const isDone = (task.status ?? 'todo') === 'done';
              return (
                <div key={task.id} className={`card ${isDone ? 'done' : ''}`} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 16, background: isDone ? 'var(--bg-card)' : 'var(--bg-secondary)', border: isDone ? '1px solid var(--border)' : '1px solid var(--border-active)' }}>
                  <button className={`task-check ${isDone ? 'checked' : ''}`} onClick={() => toggleStatus(task)} aria-label="Toggle complete">
                    {isDone && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <div className="task-body" style={{ flex: 1 }}>
                    <div className="task-title" style={{ fontSize: '1rem', fontWeight: 700, color: isDone ? 'var(--text-muted)' : 'var(--text-primary)' }}>{task.title}</div>
                    {task.description && <div className="task-desc" style={{ fontSize: '0.8rem', opacity: 0.7 }}>{task.description}</div>}
                    <div className="task-meta" style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span className={`priority-badge ${task.priority ?? 'medium'}`} style={{ borderRadius: 6, fontSize: '0.62rem' }}>{task.priority ?? 'medium'}</span>
                      <span className={`status-badge ${task.status ?? 'todo'}`} style={{ borderRadius: 6, fontSize: '0.62rem' }}>{(task.status ?? 'todo').replace('_', ' ')}</span>
                      {due && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                          <span style={{ color: due.overdue ? 'var(--danger)' : 'var(--text-secondary)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            {due.date}
                          </span>
                          {due.time && (
                            <span style={{ color: 'var(--accent-light)', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                              {due.time}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="icon-btn"
                    style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Task Sheet */}
      {showAdd && (
        <div className="overlay" onClick={() => setShowAdd(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-primary)', borderTop: '2px solid var(--accent-light)' }}>
            <div className="sheet-handle" style={{ background: 'var(--accent-dim)', width: 40, height: 4 }} />
            <div className="sheet-title" style={{ fontSize: '1.4rem', textAlign: 'center', marginBottom: 24 }}>New Task</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="form-group">
                <input id="task-title" type="text" className="input" placeholder="What needs to be done? *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus style={{ fontSize: '1.1rem', padding: '16px' }} />
              </div>
              
              <div className="form-group">
                <textarea className="textarea" placeholder="Add some details (optional)..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
              </div>

              <div>
                <div className="form-label" style={{ marginBottom: 12 }}>Priority Level</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {PRIORITIES.map(p => (
                    <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))}
                      style={{ flex: 1, padding: '12px 0', borderRadius: 'var(--radius-md)', border: `2px solid ${form.priority === p ? PRIORITY_COLOR[p] : 'var(--border)'}`, background: form.priority === p ? `${PRIORITY_COLOR[p]}18` : 'var(--bg-input)', color: form.priority === p ? PRIORITY_COLOR[p] : 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase' }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <div className="input-icon-wrap">
                    <span className="input-prefix-icon">📅</span>
                    <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Time</label>
                  <div className="input-icon-wrap">
                    <span className="input-prefix-icon">🕒</span>
                    <input type="time" className="input" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                  </div>
                </div>
              </div>

              {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', textAlign: 'center', fontWeight: 600 }}>{error}</p>}
              
              <button id="add-task-submit" className="btn btn-primary" onClick={addTask} disabled={saving} style={{ height: 56, fontSize: '1rem' }}>
                {saving ? <span className="spinner" /> : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
