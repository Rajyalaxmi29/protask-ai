import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, Trophy, TrendingUp, Calendar, 
  Menu, BarChart2, Plus,
  CheckCircle2, XCircle, Clock, X, Flag, AlignLeft
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { persistentData } from '../lib/persistentData';

export default function TrackerPage() {
  const [winningHabits, setWinningHabits] = useState<any[]>([]);
  const [avoidHabits, setAvoidHabits] = useState<any[]>([]);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'winning' | 'avoid'>('winning');
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadHabits(); }, []);
  useEffect(() => { if (showModal) setTimeout(() => inputRef.current?.focus(), 100); }, [showModal]);

  const loadHabits = async () => {
    try {
      const userId = await persistentData.getUserId();
      if (!userId) return;
      const records = await persistentData.get<any>('habits', userId);
      setWinningHabits(records.filter((h: any) => h.habit_type === 'winning'));
      setAvoidHabits(records.filter((h: any) => h.habit_type === 'avoid'));
    } catch (e) {
      console.error('Failed to load habits', e);
    }
  };

  const openModal = (type: 'winning' | 'avoid') => {
    setModalType(type);
    setNewTitle('');
    setNewTime('');
    setShowModal(true);
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const userId = await persistentData.getUserId();
      if (!userId) return;
      await persistentData.mutate('habits', 'INSERT', {
        user_id: userId,
        title: newTitle.trim(),
        time: newTime.trim() || null,
        habit_type: modalType,
        done: false,
        created_at: new Date().toISOString()
      });
      setShowModal(false);
      loadHabits();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const toggleHabit = async (habit: any) => {
    await persistentData.mutate('habits', 'UPDATE', { ...habit, done: !habit.done });
    loadHabits();
  };

  const deleteHabit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await persistentData.mutate('habits', 'DELETE', { id }, id);
    loadHabits();
  };

  // Computed stats
  const allHabits = [...winningHabits, ...avoidHabits];
  const doneCount = allHabits.filter(h => h.done).length;
  const total = allHabits.length;
  const rate = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const left = total - doneCount;

  // Streak: consecutive days with ≥1 done (simple approximation using done count)
  const streak = doneCount > 0 ? Math.min(doneCount, 7) : 0;

  return (
    <div className="page" style={{ background: '#000' }}>
      {/* Header */}
      <header style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '20px', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.85)', 
        backdropFilter: 'blur(12px)', zIndex: 100 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Menu size={20} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px' }}>HABIT TRACKER</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 900 }}>Today's Discipline</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, color: 'var(--text-secondary)' }}>
          <BarChart2 size={18} />
        </div>
      </header>

      <div className="page-content" style={{ padding: '20px', paddingBottom: 100 }}>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
          {[
            { icon: Flame, color: '#F97316', value: streak, label: 'STREAK' },
            { icon: Trophy, color: '#F59E0B', value: doneCount, label: 'BEST' },
            { icon: TrendingUp, color: 'var(--accent)', value: `${rate}%`, label: 'RATE' },
            { icon: Calendar, color: '#3B82F6', value: left, label: 'LEFT' },
          ].map((s, i) => (
            <div key={i} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <s.icon size={20} color={s.color} />
              <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{s.value}</div>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Winning Habits */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--accent)', letterSpacing: '1.5px' }}>WINNING HABITS</h3>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => openModal('winning')}
              style={{ width: 32, height: 32, borderRadius: '10px', background: 'rgba(0,255,178,0.1)', border: '1px solid rgba(0,255,178,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Plus size={16} color="var(--accent)" />
            </motion.button>
          </div>

          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {winningHabits.map((h) => (
                <motion.div
                  key={h.id} layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="card"
                  onClick={() => toggleHabit(h)}
                  style={{ 
                    padding: '18px 20px', cursor: 'pointer',
                    background: h.done ? 'rgba(0,255,178,0.05)' : 'var(--bg-card)',
                    borderColor: h.done ? 'var(--accent)' : 'var(--border)',
                    display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s'
                  }}
                >
                  <div style={{ 
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${h.done ? 'var(--accent)' : 'var(--text-muted)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: h.done ? 'var(--accent)' : 'transparent',
                    boxShadow: h.done ? '0 0 14px var(--accent-glow)' : 'none'
                  }}>
                    {h.done && <CheckCircle2 size={22} color="#000" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: '1rem', fontWeight: 800,
                      color: h.done ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: h.done ? 'line-through' : 'none',
                    }}>{h.title}</div>
                    {h.time && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} /> {h.time}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => deleteHabit(h.id, e)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
                  >
                    <X size={14} color="var(--text-muted)" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {winningHabits.length === 0 && (
              <div 
                onClick={() => openModal('winning')}
                style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px dashed var(--border)', borderRadius: 16, cursor: 'pointer' }}
              >
                + Add a winning habit
              </div>
            )}
          </div>
        </div>

        {/* Avoid These */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 900, color: '#EF4444', letterSpacing: '1.5px' }}>AVOID THESE</h3>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => openModal('avoid')}
              style={{ width: 32, height: 32, borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Plus size={16} color="#EF4444" />
            </motion.button>
          </div>

          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {avoidHabits.map((h) => (
                <motion.div
                  key={h.id} layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="card"
                  onClick={() => toggleHabit(h)}
                  style={{ 
                    padding: '18px 20px', cursor: 'pointer',
                    background: h.done ? 'rgba(239,68,68,0.05)' : 'var(--bg-card)',
                    borderColor: h.done ? '#EF4444' : 'var(--border)',
                    display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s'
                  }}
                >
                  <div style={{ 
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${h.done ? '#EF4444' : 'var(--text-muted)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: h.done ? '#EF4444' : 'transparent',
                    boxShadow: h.done ? '0 0 14px rgba(239,68,68,0.4)' : 'none'
                  }}>
                    {h.done && <XCircle size={22} color="#fff" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '1rem', fontWeight: 800,
                      color: h.done ? '#EF4444' : 'var(--text-primary)',
                      textDecoration: h.done ? 'line-through' : 'none'
                    }}>{h.title}</div>
                  </div>
                  <button
                    onClick={(e) => deleteHabit(h.id, e)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
                  >
                    <X size={14} color="var(--text-muted)" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {avoidHabits.length === 0 && (
              <div 
                onClick={() => openModal('avoid')}
                style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px dashed rgba(239,68,68,0.3)', borderRadius: 16, cursor: 'pointer' }}
              >
                + Add a habit to avoid
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Add Habit Bottom Sheet Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 300 }}
            />
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
                maxHeight: '80vh', overflowY: 'auto'
              }}
            >
              {/* Handle */}
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 24px' }} />

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1.5px', color: modalType === 'winning' ? 'var(--accent)' : '#EF4444', marginBottom: 4 }}>
                    {modalType === 'winning' ? 'WINNING HABIT' : 'AVOID HABIT'}
                  </div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Add New Habit</h2>
                </div>
                <button onClick={() => setShowModal(false)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={16} color="var(--text-muted)" />
                </button>
              </div>

              {/* Title Input */}
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', marginBottom: 14 }}>
                <AlignLeft size={16} color="var(--text-muted)" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={modalType === 'winning' ? 'e.g. Morning Workout' : 'e.g. Doom Scrolling'}
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}
                />
              </div>

              {/* Time (only for winning) */}
              {modalType === 'winning' && (
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', marginBottom: 24 }}>
                  <Clock size={16} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="Time window e.g. 06:00 - 07:00 (optional)"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}
                  />
                </div>
              )}

              {/* Submit */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAdd}
                disabled={saving || !newTitle.trim()}
                style={{ 
                  width: '100%', padding: '17px', borderRadius: '18px', border: 'none',
                  background: newTitle.trim() ? (modalType === 'winning' ? 'var(--accent)' : '#EF4444') : 'var(--bg-card)',
                  color: newTitle.trim() ? (modalType === 'winning' ? '#000' : '#fff') : 'var(--text-muted)',
                  fontSize: '1rem', fontWeight: 900, cursor: newTitle.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: newTitle.trim() ? `0 8px 24px ${modalType === 'winning' ? 'var(--accent-glow)' : 'rgba(239,68,68,0.3)'}` : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {saving
                  ? <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  : <><Plus size={20} /> Add Habit</>
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
