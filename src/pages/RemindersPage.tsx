import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
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
  const [form, setForm] = useState({ title: '', description: '', date: selectedDate, time: '12:00', category: 'General' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(prev => ({ ...prev, date: selectedDate }));
  }, [selectedDate]);

  async function load() {
    const userId = await persistentData.getUserId();
    if (!userId) { setLoading(false); return; }
    const data = await persistentData.get<Reminder>('reminders', userId, 'remind_at');
    setReminders(data);
    setLoading(false);
  }

  useEffect(() => { 
    load();
    const draft = localStorage.getItem('protask_reminder_draft');
    if (draft) {
      try {
        const d = JSON.parse(draft);
        setForm(prev => ({ ...prev, ...d }));
      } catch(e) {}
    }
  }, []);

  useEffect(() => {
    if (form.title || form.description) {
      const { title, description, date, time } = form;
      localStorage.setItem('protask_reminder_draft', JSON.stringify({ title, description, date, time }));
    }
  }, [form]);

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
        remind_at: dateTime, is_done: false, category: form.category || 'General', created_at: new Date().toISOString() 
    };
    const saved = await persistentData.mutate('reminders', 'INSERT', newRem);
    setReminders(prev => [...prev, saved as Reminder].sort((a,b) => a.remind_at.localeCompare(b.remind_at)));
    setForm({ title: '', description: '', date: selectedDate, time: '12:00', category: 'General' });
    localStorage.removeItem('protask_reminder_draft');
    setShowAdd(false);
    setSaving(false);
  };

  const formattedSelectedDate = new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="page" style={{ background: 'var(--bg-primary)', overflowX: 'hidden' }}>
      <AppHeader 
        title="Schedule"
        rightContent={
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
                onClick={() => setShowAdd(true)} 
                style={{ width: 44, height: 44, borderRadius: '16px', background: 'var(--accent-grad)', border: 'none', color: '#fff', fontSize: '1.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(165,106,189,0.35)' }}>
                +
            </button>
          </div>
        }
      />

      <div className="page-content" style={{ padding: '0px', position: 'relative' }}>
        
        {/* HERO SECTION: Trending Bento Monthly Card */}
        <div style={{ padding: '24px 20px 32px', background: 'linear-gradient(180deg, rgba(165,106,189,0.12) 0%, transparent 100%)' }}>
           <div className="card" style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '42px', padding: '28px', boxShadow: '0 24px 48px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: 150, height: 150, background: 'radial-gradient(circle, rgba(165,106,189,0.15) 0%, transparent 70%)', filter: 'blur(20px)' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                 <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>{viewDate.toLocaleString('en-US', { month: 'long' })}</h3>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: 2 }}>{viewDate.getFullYear()}</div>
                 </div>
                 <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth()-1))} style={{ width: 44, height: 44, borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>❮</button>
                    <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth()+1))} style={{ width: 44, height: 44, borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>❯</button>
                 </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, textAlign: 'center' }}>
                 {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: 16 }}>{d}</div>)}
                 {calendarDays.map((d, i) => {
                    if (!d) return <div key={i} />;
                    const isToday = new Date().toISOString().split('T')[0] === d.date;
                    const hasRem = reminders.some(r => r.remind_at.startsWith(d.date));
                    const isSelected = selectedDate === d.date;
                    return (
                        <div key={i} onClick={() => setSelectedDate(d.date)} style={{ aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', background: isSelected ? 'var(--accent-grad)' : (isToday ? 'rgba(165,106,189,0.12)' : 'transparent'), color: isSelected ? '#fff' : (isToday ? 'var(--accent-light)' : 'var(--text-primary)'), fontSize: '1rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', border: isSelected ? 'none' : (isToday ? '1px solid rgba(165,106,189,0.2)' : '1px solid transparent') }}>
                           {d.num}
                           {hasRem && !isSelected && <div style={{ position: 'absolute', bottom: 6, width: 4, height: 4, borderRadius: '50%', background: 'var(--accent-light)', boxShadow: '0 0 10px var(--accent-light)' }} />}
                        </div>
                    );
                 })}
              </div>
           </div>
        </div>

        {/* AGENDA SECTION: Premium Timeline Bento List */}
        <div style={{ background: 'var(--bg-secondary)', borderTopLeftRadius: '48px', borderTopRightRadius: '48px', minHeight: '600px', padding: '48px 24px', boxShadow: '0 -20px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
               <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>Timeline</h3>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: 4 }}>{formattedSelectedDate}</div>
               </div>
               <div style={{ padding: '10px 20px', background: 'rgba(165,106,189,0.08)', color: 'var(--accent-light)', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 800 }}>
                  {activeForDate.length} Active
               </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Syncing Experience...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
                 {/* Timeline Connector Line */}
                 {activeForDate.length > 0 && <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '20px', width: '2px', background: 'linear-gradient(180deg, var(--accent) 0%, transparent 100%)', opacity: 0.2 }} />}

                 {activeForDate.length === 0 && completedForDate.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                       <div style={{ fontSize: '4rem', marginBottom: 24, filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))' }}>🌟</div>
                       <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>Clear Sky</div>
                       <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: 8 }}>Ready for your next adventure.</div>
                    </div>
                 ) : (
                    <>
                       {/* Active Reminders with Pulse Dots */}
                       {activeForDate.map(r => (
                         <div key={r.id} onClick={() => toggleReminder(r)} className="rem-card" style={{ display: 'flex', gap: 24, cursor: 'pointer', padding: '12px 0 32px', position: 'relative' }}>
                            <div style={{ position: 'relative', zIndex: 2 }}>
                               <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-primary)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(165,106,189,0.3)' }}>
                                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
                               </div>
                            </div>
                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--accent-light)', background: 'rgba(165,106,189,0.1)', padding: '2px 8px', borderRadius: '8px' }}>
                                  {r.remind_at.includes('T') ? r.remind_at.split('T')[1].substring(0, 5) : '12:00'}
                               </div>
                                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>#{r.category || 'Schedule'}</div>
                               </div>
                               <div style={{ fontSize: '1.1rem', fontWeight: 850, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>{r.title}</div>
                               {r.description && <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.6, opacity: 0.8 }}>{r.description}</div>}
                            </div>
                         </div>
                       ))}

                       {/* Completed Section Separator */}
                       {completedForDate.length > 0 && (
                         <div style={{ marginTop: 24 }}>
                            <button 
                              onClick={() => setShowCompleted(!showCompleted)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: 0, width: '100%' }}>
                              <div style={{ flex: 1, borderBottom: '1px dashed rgba(255,255,255,0.1)' }} />
                              <span style={{ padding: '0 12px' }}>{showCompleted ? 'Hide Completed' : `Show Completed (${completedForDate.length})`}</span>
                              <div style={{ flex: 1, borderBottom: '1px dashed rgba(255,255,255,0.1)' }} />
                            </button>

                            {showCompleted && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24, padding: '0 12px' }}>
                                 {completedForDate.map(r => (
                                   <div key={r.id} onClick={() => toggleReminder(r)} style={{ display: 'flex', gap: 20, cursor: 'pointer', padding: '16px', background: 'rgba(255,255,255,0.01)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)', opacity: 0.5 }}>
                                      <div style={{ width: 22, height: 22, borderRadius: '6px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                      </div>
                                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', textDecoration: 'line-through' }}>{r.title}</div>
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
           <div className="sheet" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-secondary)', borderRadius: '48px 48px 0 0', padding: '16px 24px 48px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: 40, height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: '10px', margin: '0 auto 32px' }} />
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, textAlign: 'center', marginBottom: 32, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>New Entry</h2>
              
              <div className="form-group" style={{ marginBottom: 28 }}>
                 <input 
                  type="text" 
                  className="input" 
                  placeholder="What's happening? *" 
                  value={form.title} 
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
                  style={{ color: 'var(--text-primary)', fontSize: '1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '20px 24px' }} 
                  autoFocus 
                 />
              </div>

              <div className="form-group" style={{ marginBottom: 28 }}>
                 <textarea 
                  className="input" 
                  placeholder="Add details (Optional)" 
                  value={form.description} 
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                  style={{ color: 'var(--text-primary)', fontSize: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '20px 24px', minHeight: 120, resize: 'none' }} 
                 />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 }}>
                 <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 12, display: 'block', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Date</label>
                    <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ color: 'var(--text-primary)', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '16px' }} />
                 </div>
                 <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 12, display: 'block', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Time</label>
                    <input type="time" className="input" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} style={{ color: 'var(--text-primary)', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '16px' }} />
                 </div>
              </div>

              <button 
                className="btn btn-primary" 
                onClick={addReminder} 
                disabled={saving || !form.title.trim()}
                style={{ height: 68, borderRadius: '28px', fontSize: '1.2rem', fontWeight: 900, boxShadow: '0 12px 24px rgba(165,106,189,0.3)', background: 'var(--accent-grad)' }}>
                {saving ? 'Creating...' : 'Finalise Entry'}
              </button>
           </div>
        </div>
      )}
      
      <style>{`
        .pulse { animation: pulseAnim 2s infinite; }
        @keyframes pulseAnim {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
