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
          <button className="icon-btn" onClick={() => setShowAdd(true)} aria-label="Add task" style={{ background: 'var(--accent-grad)', border: 'none', color: '#fff' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        }
      />

      <div className="page-content">
        {/* Stats */}
        <div className="stats-row" style={{ marginBottom: 20 }}>
          <div className="stat-card glass-card" style={{ background: 'var(--accent-grad)', border: 'none' }}>
            <div className="stat-card__value">{counts.total}</div>
            <div className="stat-card__label">Total</div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-card__value" style={{ color: 'var(--warning)' }}>{counts.pending}</div>
            <div className="stat-card__label">Pending</div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-card__value" style={{ color: 'var(--success)' }}>{counts.done}</div>
            <div className="stat-card__label">Done</div>
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
                    <div className="task-meta" style={{ marginTop: 8 }}>
                      <span className={`priority-badge ${task.priority ?? 'medium'}`} style={{ borderRadius: 6, fontSize: '0.62rem' }}>{task.priority ?? 'medium'}</span>
                      <span className={`status-badge ${task.status ?? 'todo'}`} style={{ borderRadius: 6, fontSize: '0.62rem' }}>{(task.status ?? 'todo').replace('_', ' ')}</span>
                      {due && <span className={`task-due ${due.overdue ? 'overdue' : ''}`} style={{ fontSize: '0.72rem' }}>📅 {due.label}</span>}
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

              <div className="form-group">
                <label className="form-label" htmlFor="task-due">Due Date</label>
                <div className="input-icon-wrap">
                  <span className="input-prefix-icon">📅</span>
                  <input id="task-due" type="date" className="input" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
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
