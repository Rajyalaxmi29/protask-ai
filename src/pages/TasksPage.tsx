import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Menu, 
  CheckCircle2, Clock, Trash2, 
  Filter, Calendar, X, Flag, AlignLeft
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { persistentData } from '../lib/persistentData';

const PRIORITIES = [
  { label: 'High', color: '#EF4444' },
  { label: 'Medium', color: '#F59E0B' },
  { label: 'Low', color: '#6C4CF1' },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [todoCount, setTodoCount] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadTasks(); }, []);
  
  useEffect(() => {
    if (showModal) setTimeout(() => inputRef.current?.focus(), 100);
  }, [showModal]);

  const loadTasks = async () => {
    try {
      const userId = await persistentData.getUserId();
      if (!userId) return;
      const records = await persistentData.get<any>('tasks', userId);
      setTasks(records);
      setTodoCount(records.filter((t: any) => !t.done).length);
      setDoneCount(records.filter((t: any) => t.done).length);
    } catch (e) {
      console.error('Failed to load tasks', e);
    }
  };

  const openModal = () => {
    setNewTitle(''); setNewPriority('Medium'); setNewNote('');
    setShowModal(true);
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const userId = await persistentData.getUserId();
      if (!userId) return;
      await persistentData.mutate('tasks', 'INSERT', {
        user_id: userId,
        title: newTitle.trim(),
        priority: newPriority,
        note: newNote.trim() || null,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        done: false,
        created_at: new Date().toISOString()
      });
      setShowModal(false);
      loadTasks();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const toggleTask = async (task: any) => {
    await persistentData.mutate('tasks', 'UPDATE', { ...task, done: !task.done });
    loadTasks();
  };

  const removeTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await persistentData.mutate('tasks', 'DELETE', { id }, id);
    loadTasks();
  };

  const priorityColor = PRIORITIES.find(p => p.label === newPriority)?.color || 'var(--accent)';

  return (
    <div className="page" style={{ background: '#000' }}>
      {/* Header */}
      <header style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '20px', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.8)', 
        backdropFilter: 'blur(10px)', zIndex: 100 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Menu size={20} />
          <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>Tasks Core</span>
        </div>
        <div style={{ display: 'flex', gap: 20, color: 'var(--text-secondary)' }}>
          <Search size={18} />
          <Filter size={18} />
        </div>
      </header>

      <div className="page-content" style={{ padding: '20px' }}>
        {/* Counter */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 32 }}>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>TODO</div>
            <div style={{ fontSize: '2rem', fontWeight: 900 }}>{todoCount}</div>
          </div>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8 }}>DONE</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-muted)' }}>{doneCount}</div>
          </div>
        </div>

        {/* Task List */}
        <div style={{ marginBottom: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '1.5px' }}>PRIORITY SEQUENCE</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 800 }}>
              <Calendar size={14} /> TODAY
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {tasks.map((task) => (
                <motion.div
                  key={task.id} layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="card"
                  onClick={() => toggleTask(task)}
                  style={{ 
                    padding: '20px', cursor: 'pointer', position: 'relative', overflow: 'hidden',
                    background: task.done ? 'rgba(0,255,178,0.03)' : 'var(--bg-card)',
                    borderColor: task.done ? 'var(--accent)' : 'var(--border)',
                  }}
                >
                  {task.priority === 'High' && !task.done && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: '#EF4444' }} />
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ 
                      width: 28, height: 28, borderRadius: '8px', flexShrink: 0,
                      border: `2px solid ${task.done ? 'var(--accent)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: task.done ? 'var(--accent)' : 'transparent',
                    }}>
                      {task.done && <CheckCircle2 size={16} color="#000" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: '1.05rem', fontWeight: 800,
                        color: task.done ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: task.done ? 'line-through' : 'none',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }}>{task.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                        <span style={{ 
                          fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                          background: `${PRIORITIES.find(p=>p.label===task.priority)?.color || '#888'}20`,
                          color: PRIORITIES.find(p=>p.label===task.priority)?.color || '#888'
                        }}>{(task.priority||'Medium').toUpperCase()}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} /> {task.time || '12:00 PM'}
                        </span>
                      </div>
                    </div>
                    <button
                      className="icon-btn"
                      style={{ background: 'transparent', zIndex: 2, position: 'relative' }}
                      onClick={(e) => removeTask(task.id, e)}
                    >
                      <Trash2 size={16} color="var(--text-muted)" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {tasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                No tasks yet. Tap + to add one.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        onClick={openModal}
        style={{ 
          position: 'fixed', bottom: 100, right: 24,
          width: 56, height: 56, borderRadius: '20px',
          background: 'var(--accent)', border: 'none',
          color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px var(--accent-glow)', zIndex: 100, cursor: 'pointer'
        }}
      >
        <Plus size={28} />
      </motion.button>

      {/* Custom Add Task Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 300 }}
            />

            {/* Modal Sheet */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{ 
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 301,
                background: '#0d0d0d', borderTop: '1px solid var(--border)',
                borderRadius: '28px 28px 0 0',
                padding: '20px 24px 100px',
                maxHeight: '85vh', overflowY: 'auto'
              }}
            >
              {/* Handle */}
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 24px' }} />

              {/* Header Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 900 }}>New Task</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={16} color="var(--text-muted)" />
                </button>
              </div>

              {/* Task Title */}
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', marginBottom: 16 }}>
                <AlignLeft size={16} color="var(--text-muted)" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="What needs to be done?"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  style={{ 
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Priority Selector */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: 12 }}>PRIORITY</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {PRIORITIES.map(p => (
                    <motion.button
                      key={p.label}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setNewPriority(p.label)}
                      style={{ 
                        flex: 1, padding: '12px 8px', borderRadius: '14px',
                        border: `1px solid ${newPriority === p.label ? p.color : 'var(--border)'}`,
                        background: newPriority === p.label ? `${p.color}18` : 'var(--bg-card)',
                        color: newPriority === p.label ? p.color : 'var(--text-muted)',
                        fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Flag size={13} /> {p.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="card" style={{ padding: '14px 18px', marginBottom: 24 }}>
                <textarea
                  placeholder="Add a note (optional)"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  rows={2}
                  style={{ 
                    width: '100%', background: 'transparent', border: 'none', outline: 'none',
                    resize: 'none', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Submit */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAdd}
                disabled={saving || !newTitle.trim()}
                style={{ 
                  width: '100%', padding: '17px', borderRadius: '18px',
                  background: newTitle.trim() ? priorityColor : 'var(--bg-card)',
                  border: 'none', color: newTitle.trim() ? '#fff' : 'var(--text-muted)',
                  fontSize: '1rem', fontWeight: 900, cursor: newTitle.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: newTitle.trim() ? `0 8px 24px ${priorityColor}40` : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {saving
                  ? <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  : <><Plus size={20} /> Add Task</>
                }
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
