import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';
import { persistentData } from '../lib/persistentData';
import type { Reminder } from '../lib/supabase';

export default function RemindersPage() {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAdd, setShowAdd] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', date: new Date().toISOString().split('T')[0], time: '12:00' });
  const [saving, setSaving] = useState(false);

  async function load() {
    const userId = await persistentData.getUserId();
    if (!userId) { setLoading(false); return; }
    const data = await persistentData.get<Reminder>('reminders', userId, 'remind_at');
    setReminders(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

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

  // Filtering Logic
  const activeForDate = useMemo(() => {
    return reminders.filter(r => r.remind_at.startsWith(selectedDate) && !r.is_done)
                   .sort((a,b) => a.remind_at.localeCompare(b.remind_at));
  }, [reminders, selectedDate]);

  const completedForDate = useMemo(() => {
    return reminders.filter(r => r.remind_at.startsWith(selectedDate) && r.is_done)
                   .sort((a,b) => a.remind_at.localeCompare(b.remind_at));
  }, [reminders, selectedDate]);

  // Actions
  const toggleReminder = async (r: Reminder) => {
    const updated = await persistentData.mutate('reminders', 'UPDATE', { ...r, is_done: !r.is_done });
    setReminders(prev => prev.map(x => x.id === r.id ? (updated as Reminder) : x));
  };

  const addReminder = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const userId = await persistentData.getUserId();
    const dateTime = `${form.date}T${form.time}:00`;
    const newRem = { 
        user_id: userId, title: form.title, description: form.description || '', 
        remind_at: dateTime, is_done: false, category: 'General', created_at: new Date().toISOString() 
    };
    const saved = await persistentData.mutate('reminders', 'INSERT', newRem);
    setReminders(prev => [...prev, saved as Reminder].sort((a,b) => a.remind_at.localeCompare(b.remind_at)));
    setShowAdd(false);
    setSaving(false);
  };

  const formattedSelectedDate = new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="page" style={{ background: 'var(--bg-primary)', overflowX: 'hidden' }}>
      <AppHeader
        title="Schedule"
        showBack
        showTheme
        rightContent={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button 
                onClick={() => setShowAdd(true)} 
                style={{ width: 40, height: 40, borderRadius: '14px', background: 'var(--accent-grad)', border: 'none', color: '#fff', fontSize: '1.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px var(--accent-glow)' }}>
                +
            </button>
          </div>
        }
      />

      <div className="page-content" style={{ padding: '0px', position: 'relative' }}>
        
        {/* HERO SECTION: Trending Calendar Card */}
        <div style={{ padding: '24px 20px 32px', background: 'linear-gradient(180deg, rgba(165,106,189,0.1) 0%, transparent 100%)' }}>
           <div className="card" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '32px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                 <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>{viewDate.toLocaleString('en-US', { month: 'long' })}</h2>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{viewDate.getFullYear()}</div>
                 </div>
                 <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth()-1))} style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontSize: '1rem' }}>❮</button>
                    <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth()+1))} style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontSize: '1rem' }}>❯</button>
                 </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
                 {['S','M','T','W','T','F','S'].map(d => <div key={d} style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: 16 }}>{d}</div>)}
                 {calendarDays.map((d, i) => {
                    if (!d) return <div key={i} />;
                    const isToday = new Date().toISOString().split('T')[0] === d.date;
                    const hasRem = reminders.some(r => r.remind_at.startsWith(d.date));
                    const isSelected = selectedDate === d.date;
                    return (
                        <div key={i} onClick={() => setSelectedDate(d.date)} style={{ aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '14px', background: isSelected ? 'var(--accent-grad)' : (isToday ? 'rgba(165,106,189,0.1)' : 'transparent'), color: isSelected ? '#fff' : (isToday ? 'var(--accent-light)' : 'var(--text-primary)'), fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative' }}>
                           {d.num}
                           {hasRem && !isSelected && <div style={{ position: 'absolute', bottom: 6, width: 4, height: 4, borderRadius: '50%', background: 'var(--accent-light)', boxShadow: '0 0 10px var(--accent-light)' }} />}
                        </div>
                    );
                 })}
              </div>
           </div>
        </div>

        {/* AGENDA SECTION: Optimized Date-Specific List */}
        <div style={{ background: 'var(--bg-secondary)', borderTopLeftRadius: '40px', borderTopRightRadius: '40px', minHeight: '600px', padding: '40px 24px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
              <div>
                 <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Activities</h3>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: 4 }}>{formattedSelectedDate}</div>
              </div>
              <div style={{ padding: '8px 16px', background: 'rgba(165,106,189,0.1)', color: 'var(--accent-light)', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                 {activeForDate.length} Tasks
              </div>
           </div>

           {loading ? (
             <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Syncing...</div>
           ) : (
             <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {activeForDate.length === 0 && completedForDate.length === 0 ? (
                   <div style={{ textAlign: 'center', padding: '60px 0' }}>
                      <div style={{ fontSize: '3rem', marginBottom: 20 }}>🍃</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Free Day</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>Nothing scheduled for this date.</div>
                   </div>
                ) : (
                   <>
                      {/* Active Reminders */}
                      {activeForDate.map(r => (
                        <div key={r.id} onClick={() => toggleReminder(r)} className="rem-card" style={{ display: 'flex', gap: 20, cursor: 'pointer' }}>
                           <div style={{ padding: '4px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{ width: 24, height: 24, borderRadius: '6px', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 <div style={{ width: 12, height: 12, borderRadius: '2px', background: 'transparent' }} />
                              </div>
                           </div>
                           <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-light)', marginBottom: 4 }}>{new Date(r.remind_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>{r.title}</div>
                              {r.description && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>{r.description}</div>}
                           </div>
                        </div>
                      ))}

                      {/* Completed Section Separator */}
                      {completedForDate.length > 0 && (
                        <div style={{ marginTop: 24 }}>
                           <button 
                             onClick={() => setShowCompleted(!showCompleted)}
                             style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: 0 }}>
                             {showCompleted ? 'Hide Completed' : `Show Completed (${completedForDate.length})`}
                             <div style={{ flex: 1, borderBottom: '1px dashed rgba(255,255,255,0.1)', marginLeft: 8 }} />
                           </button>

                           {showCompleted && (
                             <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 24, opacity: 0.6 }}>
                                {completedForDate.map(r => (
                                  <div key={r.id} onClick={() => toggleReminder(r)} style={{ display: 'flex', gap: 20, cursor: 'pointer' }}>
                                     <div style={{ padding: '4px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ width: 24, height: 24, borderRadius: '6px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                        </div>
                                     </div>
                                     <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', textDecoration: 'line-through' }}>{r.title}</div>
                                     </div>
                                  </div>
                                ))}
                             </div>
                           )}
                        </div>
                      )}
                   </>
                )}
             </div>
           )}
        </div>
      </div>

      <BottomNav />

      {/* Add Modal */}
      {showAdd && (
        <div className="overlay" onClick={() => setShowAdd(false)}>
           <div className="sheet" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-secondary)', borderRadius: '40px 40px 0 0', padding: '12px 24px 40px' }}>
              <div className="sheet-handle" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, textAlign: 'center', margin: '32px 0 24px', color: 'var(--text-primary)' }}>New Activity</h2>
              <div className="form-group" style={{ marginBottom: 24 }}>
                 <input type="text" className="input" placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={{ background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '1.1rem' }} autoFocus />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 }}>
                 <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--text-muted)' }}>Date</label>
                    <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ background: 'rgba(255,255,255,0.03)', color: '#fff' }} />
                 </div>
                 <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--text-muted)' }}>Time</label>
                    <input type="time" className="input" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} style={{ background: 'rgba(255,255,255,0.03)', color: '#fff' }} />
                 </div>
              </div>
              <button className="btn btn-primary" onClick={addReminder} style={{ height: 60, borderRadius: '24px' }}>Save Entry</button>
           </div>
        </div>
      )}
      
      <style>{`
        .rem-card { transition: all 0.2s ease; border-radius: 20px; padding: 4px; }
        .rem-card:active { transform: scale(0.98); background: rgba(255,255,255,0.02); }
      `}</style>
    </div>
  );
}
