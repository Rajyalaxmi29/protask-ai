import React, { useEffect, useState, useMemo } from 'react';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';
import { persistentData } from '../lib/persistentData';
import type { Task, Priority, TaskStatus } from '../lib/supabase';

const PRIORITIES: Priority[] = ['low', 'medium', 'high'];
const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];

const PRIORITY_ICON: Record<Priority, string> = { low: '📗', medium: '📒', high: '📕' };

function formatTime(iso?: string) {
  if (!iso) return 'No Time';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | TaskStatus>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAdd, setShowAdd] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    priority: 'medium' as Priority, 
    date: new Date().toISOString().split('T')[0],
    time: '09:00'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Date strip logic
  const dateStrip = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = -2; i < 5; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        dates.push({
            date: d.toISOString().split('T')[0],
            day: d.toLocaleDateString('en-US', { weekday: 'short' }),
            num: d.getDate(),
            month: d.toLocaleDateString('en-US', { month: 'short' })
        });
    }
    return dates;
  }, []);

  // Calendar logic
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        days.push({ num: i, date: d.toISOString().split('T')[0] });
    }
    return days;
  }, [viewDate]);

  async function load() {
    const userId = await persistentData.getUserId();
    if (!userId) { setLoading(false); return; }
    const data = await persistentData.get<Task>('tasks', userId);
    setTasks(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const displayed = useMemo(() => {
    const dayTasks = tasks.filter(t => t.due_date?.startsWith(selectedDate) || t.created_at.startsWith(selectedDate));
    return filter === 'all' ? dayTasks : dayTasks.filter(t => t.status === filter);
  }, [tasks, selectedDate, filter]);

  const addTask = async () => {
    if (!form.title.trim()) { setError('Title is required.'); return; }
    setSaving(true);
    const userId = await persistentData.getUserId();
    const dateTime = `${form.date}T${form.time}:00`;
    const newTask = { user_id: userId, title: form.title.trim(), description: form.description || null, priority: form.priority, status: 'todo', due_date: dateTime, created_at: new Date().toISOString() };
    const saved = await persistentData.mutate('tasks', 'INSERT', newTask);
    setTasks(prev => [saved as Task, ...prev]);
    setShowAdd(false);
    setSaving(false);
  };

  const toggleStatus = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    const updated = await persistentData.mutate('tasks', 'UPDATE', { ...task, status: newStatus });
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
  };

  return (
    <div className="page" style={{ background: '#F8F9FD' }}>
      <AppHeader
        title="Today's Tasks"
        showBack
        showTheme
        rightContent={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button 
                onClick={() => setShowCalendar(!showCalendar)}
                style={{ background: '#fff', border: '1px solid var(--border)', padding: '8px 14px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', cursor: 'pointer', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Day ▾
            </button>
            <button 
                onClick={() => setShowAdd(true)} 
                style={{ width: 40, height: 40, borderRadius: '14px', background: 'var(--accent-grad)', border: 'none', color: '#fff', fontSize: '1.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px var(--accent-glow)' }}>
                +
            </button>
          </div>
        }
      />

      <div className="page-content" style={{ padding: '0px' }}>
        {/* Full Calendar Overlay Style Dropdown */}
        {showCalendar && (
          <div style={{ padding: '24px', background: '#FFF', borderBottom: '1px solid #EEE', animation: 'slideDown 0.3s ease-out' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>{viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</h3>
                <div style={{ display: 'flex', gap: 16 }}>
                   <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))} style={{ background: 'none', border: 'none', fontSize: '1rem', color: '#AAA' }}>❮</button>
                   <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))} style={{ background: 'none', border: 'none', fontSize: '1rem', color: '#AAA' }}>❯</button>
                </div>
             </div>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, textAlign: 'center' }}>
                {['S','M','T','W','T','F','S'].map(d => <div key={d} style={{ fontSize: '0.75rem', fontWeight: 800, color: '#CCC' }}>{d}</div>)}
                {calendarDays.map((d, i) => (
                   <div key={i} onClick={() => { if(d) { setSelectedDate(d.date); setShowCalendar(false); } }} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700, background: d?.date === selectedDate ? 'var(--accent-grad)' : 'none', color: d?.date === selectedDate ? '#fff' : '#111', borderRadius: '50%', opacity: d ? 1 : 0, cursor: 'pointer' }}>
                      {d?.num}
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* Date Strip */}
        <div style={{ padding: '20px', overflowX: 'auto', display: 'flex', gap: 12, scrollbarWidth: 'none' }} className="chips">
           {dateStrip.map(d => (
             <div key={d.date} onClick={() => setSelectedDate(d.date)} style={{ flexShrink: 0, width: 64, height: 100, background: selectedDate === d.date ? 'var(--accent-grad)' : '#fff', border: selectedDate === d.date ? 'none' : '1px solid #EEE', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', cursor: 'pointer', boxShadow: selectedDate === d.date ? '0 8px 20px rgba(165,106,189,0.3)' : 'none' }}>
                <div style={{ fontSize: '0.7rem', color: selectedDate === d.date ? 'rgba(255,255,255,0.7)' : '#AAA', marginBottom: 4 }}>{d.month}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: selectedDate === d.date ? '#fff' : '#111' }}>{d.num}</div>
                <div style={{ fontSize: '0.7rem', color: selectedDate === d.date ? 'rgba(255,255,255,0.7)' : '#AAA', marginTop: 4 }}>{d.day}</div>
             </div>
           ))}
        </div>

        {/* Filters */}
        <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10, overflowX: 'auto' }} className="chips">
           {(['all', 'in_progress', 'todo', 'done'] as const).map(f => (
             <button key={f} onClick={() => setFilter(f)} className={`chip ${filter === f ? 'active' : ''}`} style={{ background: filter === f ? 'var(--accent-grad)' : 'rgba(165,106,189,0.1)', color: filter === f ? '#fff' : 'var(--accent-light)', border: 'none', padding: '10px 24px', borderRadius: '15px', fontWeight: 800, fontSize: '0.75rem', textTransform: 'capitalize' }}>
                {f.replace('_', ' ')}
             </button>
           ))}
        </div>

        {/* Tasks List */}
        <div style={{ padding: '0 20px 100px' }}>
           {loading ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: '24px' }} />)}
             </div>
           ) : displayed.length === 0 ? (
             <div className="empty-state">📅 No tasks for this day</div>
           ) : (
             <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {displayed.map(task => {
                  const isDone = task.status === 'done';
                  return (
                    <div key={task.id} className="card" onClick={() => toggleStatus(task)} style={{ background: '#fff', border: '1px solid #F0F0F0', borderRadius: '24px', padding: '20px', position: 'relative', cursor: 'pointer' }}>
                       <div style={{ position: 'absolute', top: 20, right: 20, fontSize: '1.2rem' }}>{PRIORITY_ICON[task.priority ?? 'medium']}</div>
                       <div style={{ fontSize: '0.7rem', color: '#AAA', marginBottom: 8, fontWeight: 600 }}>{task.description?.slice(0, 30) || 'Task Management'}</div>
                       <div style={{ fontSize: '1.05rem', fontWeight: 800, color: isDone ? '#AAA' : '#2D3139', textDecoration: isDone ? 'line-through' : 'none', marginBottom: 20 }}>{task.title}</div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#888', fontSize: '0.8rem', fontWeight: 700 }}>
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                             {formatTime(task.due_date || task.created_at)}
                          </div>
                          <div style={{ padding: '4px 12px', background: isDone ? 'rgba(74, 222, 128, 0.1)' : 'rgba(37, 99, 235, 0.05)', color: isDone ? '#4ADE80' : 'var(--accent-light)', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800 }}>
                             {isDone ? '(Done)' : (task.status === 'in_progress' ? '(In Progress)' : '(To-Do)')}
                          </div>
                       </div>
                    </div>
                  );
                })}
             </div>
           )}
        </div>
      </div>

      <BottomNav />

      {/* Add Modal */}
      {showAdd && (
        <div className="overlay" onClick={() => setShowAdd(false)}>
           <div className="sheet" onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '32px 32px 0 0', padding: '32px 24px' }}>
              <div className="sheet-handle" style={{ background: '#EEE' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, textAlign: 'center', marginBottom: 24 }}>New Task</h2>
              <div className="form-group"><input type="text" className="input" placeholder="Task title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus /></div>
              <div className="form-group" style={{ marginTop: 20 }}><label className="form-label">Task Group / Description</label><input type="text" className="input" placeholder="e.g. Design Sprint" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
                 <div className="form-group"><label className="form-label">Date</label><input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
                 <div className="form-group"><label className="form-label">Time</label><input type="time" className="input" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} /></div>
              </div>
              <button className="btn btn-primary" onClick={addTask} style={{ marginTop: 32, height: 56, borderRadius: '20px' }}>Create Task</button>
           </div>
        </div>
      )}
    </div>
  );
}
