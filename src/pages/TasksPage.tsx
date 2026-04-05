import React, { useEffect, useState } from 'react';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';
import { persistentData } from '../lib/persistentData';
import type { Task, Priority, TaskStatus } from '../lib/supabase';

const PRIORITIES: Priority[] = ['low', 'medium', 'high'];
const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];

const PRIORITY_COLOR: Record<Priority, string> = { low: 'var(--success)', medium: 'var(--warning)', high: 'var(--danger)' };

function formatDue(d?: string) {
  if (!d) return null;
  const due = new Date(d);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return { label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), overdue: due < now };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | TaskStatus>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' as Priority, due_date: '' });
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
    
    const newTask = {
      user_id: session.user.id,
      title: form.title.trim(),
      description: form.description || null,
      priority: form.priority,
      status: 'todo',
      due_date: form.due_date || null,
      created_at: new Date().toISOString()
    };

    const saved = await persistentData.mutate('tasks', 'INSERT', newTask);
    setTasks(prev => [saved as Task, ...prev]);
    setForm({ title: '', description: '', priority: 'medium', due_date: '' });
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
          <button className="icon-btn" onClick={() => setShowAdd(true)} aria-label="Add task">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        }
      />

      <div className="page-content">
        {/* Stats */}
        <div className="stats-row" style={{ marginBottom: 16 }}>
          <div className="stat-card"><div className="stat-card__value">{counts.total}</div><div className="stat-card__label">Total</div></div>
          <div className="stat-card stat-card--normal"><div className="stat-card__value" style={{ color: 'var(--warning)' }}>{counts.pending}</div><div className="stat-card__label">Pending</div></div>
          <div className="stat-card stat-card--normal"><div className="stat-card__value" style={{ color: 'var(--success)' }}>{counts.done}</div><div className="stat-card__label">Done</div></div>
        </div>

        {/* Filter chips */}
        <div className="chips" style={{ marginBottom: 16 }}>
          {(['all', 'todo', 'in_progress', 'done'] as const).map(f => (
            <button key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f === 'todo' ? 'To Do' : f === 'in_progress' ? 'In Progress' : 'Done'}
            </button>
          ))}
        </div>

        {typeof Notification !== 'undefined' && Notification.permission !== 'granted' && (
          <div className="card" style={{ marginBottom: 16, background: 'var(--accent-dim)', border: '1px solid var(--accent-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.2rem' }}>🔔</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Enable Notifications</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Get alerts for your task deadlines.</div>
              </div>
              <button 
                className="btn btn-primary btn-sm" 
                onClick={async () => {
                  const { notificationService } = await import('../lib/notifications');
                  await notificationService.requestPermission();
                  window.location.reload();
                }}
              >
                Enable
              </button>
            </div>
          </div>
        )}

        {/* Task list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 'var(--radius-lg)' }} />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__emoji">📋</div>
            <div className="empty-state__title">No tasks here</div>
            <div className="empty-state__desc">Tap + to add your first task</div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 8, width: 'auto', padding: '10px 24px' }} onClick={() => setShowAdd(true)}>Add Task</button>
          </div>
        ) : (
          <div className="card" style={{ padding: '4px 16px' }}>
            {displayed.map(task => {
              const due = formatDue(task.due_date);
              return (
                <div key={task.id} className={`task-item ${(task.status ?? 'todo') === 'done' ? 'done' : ''}`}>
                  <button className={`task-check ${(task.status ?? 'todo') === 'done' ? 'checked' : ''}`} onClick={() => toggleStatus(task)} aria-label="Toggle complete">
                    {(task.status ?? 'todo') === 'done' && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <div className="task-body">
                    <div className="task-title">{task.title}</div>
                    {task.description && <div className="task-desc">{task.description}</div>}
                    <div className="task-meta">
                      <span className={`priority-badge ${task.priority ?? 'medium'}`}>{task.priority ?? 'medium'}</span>
                      <span className={`status-badge ${task.status ?? 'todo'}`}>{(task.status ?? 'todo').replace('_', ' ')}</span>
                      {due && <span className={`task-due ${due.overdue ? 'overdue' : ''}`}>📅 {due.label}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 6, flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                    aria-label="Delete task"
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
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">New Task</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input id="task-title" type="text" className="input" placeholder="Task title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
              <textarea className="textarea" placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />

              <div>
                <div className="form-label" style={{ marginBottom: 8 }}>Priority</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {PRIORITIES.map(p => (
                    <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))}
                      style={{ flex: 1, padding: '8px 0', borderRadius: 'var(--radius-md)', border: `2px solid ${form.priority === p ? PRIORITY_COLOR[p] : 'var(--border)'}`, background: form.priority === p ? `${PRIORITY_COLOR[p]}18` : 'transparent', color: form.priority === p ? PRIORITY_COLOR[p] : 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'capitalize' }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task-due">Due Date (optional)</label>
                <input id="task-due" type="date" className="input" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>

              {error && <p style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>{error}</p>}
              <button id="add-task-submit" className="btn btn-primary" onClick={addTask} disabled={saving}>
                {saving ? <span className="spinner" /> : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
