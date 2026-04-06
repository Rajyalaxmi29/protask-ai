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
  const [viewMode, setViewMode] = useState<'calendar' | 'grid'>('calendar');
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

  const monthLabel = viewDate.toLocaleString('en-US', { month: 'long' });

  const displayedReminders = useMemo(() => {
    return reminders.sort((a,b) => a.remind_at.localeCompare(b.remind_at));
  }, [reminders]);

  const addReminder = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const userId = await persistentData.getUserId();
    const dateTime = `${form.date}T${form.time}:00`;
    const newRem = { 
        user_id: userId, 
        title: form.title, 
        description: form.description || '', 
        remind_at: dateTime, 
        is_done: false, 
        category: 'General', 
        created_at: new Date().toISOString() 
    };
    const saved = await persistentData.mutate('reminders', 'INSERT', newRem);
    setReminders(prev => [...prev, saved as Reminder].sort((a,b) => a.remind_at.localeCompare(b.remind_at)));
    setShowAdd(false);
    setSaving(false);
  };

  const changeMonth = (offset: number) => {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() + offset);
    setViewDate(d);
  };

  return (
    <div className="page" style={{ background: '#FFF' }}>
      <AppHeader
        title="Reminders"
        showBack
        showTheme
        rightContent={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button 
                className="icon-btn" 
                onClick={() => setViewMode(v => v === 'calendar' ? 'grid' : 'calendar')} 
                style={{ width: 40, height: 40, borderRadius: '14px', background: '#fff' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
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
        {/* Month Selector matching image style */}
        <div style={{ padding: '20px 24px 10px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#111' }}>{monthLabel}</h2>
            <div style={{ display: 'flex', gap: 10 }}>
               <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#CCC', cursor: 'pointer' }}>❮</button>
               <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#CCC', cursor: 'pointer' }}>❯</button>
            </div>
            <button onClick={load} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '1.2rem' }}>🔄</button>
        </div>

        {viewMode === 'calendar' ? (
          <>
            {/* Calendar Grid */}
            <div style={{ padding: '0 24px 20px' }}>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: 12 }}>
                  {['S','M','T','W','T','F','S'].map(d => <div key={d} style={{ fontSize: '0.75rem', fontWeight: 800, color: '#CCC' }}>{d}</div>)}
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                  {calendarDays.map((d, i) => {
                     if (!d) return <div key={i} />;
                     const hasRem = reminders.some(r => r.remind_at.startsWith(d.date));
                     const isSelected = selectedDate === d.date;
                     return (
                       <div key={i} onClick={() => setSelectedDate(d.date)} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, color: isSelected ? 'var(--accent-light)' : '#111', cursor: 'pointer', position: 'relative', border: isSelected ? '2px solid var(--accent-light)' : 'none', borderRadius: '50%' }}>
                          {d.num}
                          {hasRem && !isSelected && <div style={{ position: 'absolute', bottom: 6, width: 4, height: 4, borderRadius: '50%', background: 'var(--accent-dim)' }} />}
                       </div>
                     );
                  })}
               </div>
            </div>

            {/* List Sheet */}
            <div style={{ background: '#FFF', borderTop: '1px solid #F5F5F5', minHeight: '400px', padding: '32px 24px' }}>
               <div style={{ width: 40, height: 4, background: '#F0F0F0', borderRadius: '2px', margin: '0 auto 32px' }} />
               
               {displayedReminders.length === 0 ? (
                 <div style={{ textAlign: 'center', padding: '40px 0', color: '#AAA' }}>No reminders found.</div>
               ) : (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    {Array.from(new Set(displayedReminders.map(r => r.remind_at.split('T')[0]))).map(date => (
                      <div key={date}>
                         <h4 style={{ fontSize: '0.8rem', fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                            {new Date(date as string).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric' })}
                            <div style={{ flex: 1, height: 1, background: '#F5F5F5' }} />
                         </h4>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {displayedReminders.filter(r => r.remind_at.startsWith(date)).map(r => (
                              <div key={r.id} style={{ display: 'flex', gap: 20 }}>
                                 <div style={{ width: 50, fontSize: '0.8rem', color: '#AAA', fontWeight: 700 }}>
                                    {new Date(r.remind_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                 </div>
                                 <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-light)', marginTop: 4 }} />
                                 <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#111' }}>{r.title}</div>
                                    {r.description && <div style={{ fontSize: '0.85rem', color: '#888', marginTop: 4 }}>{r.description}</div>}
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          </>
        ) : (
          /* Grid View Mode */
          <div style={{ padding: '24px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
             {displayedReminders.map(r => (
               <div key={r.id} className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '24px', padding: '20px', minHeight: 160, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                     <div style={{ fontSize: '0.7rem', color: 'var(--accent-light)', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>{new Date(r.remind_at).toLocaleDateString()}</div>
                     <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{r.title}</div>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                     {new Date(r.remind_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>

      <BottomNav />

      {/* Add Modal */}
      {showAdd && (
        <div className="overlay" onClick={() => setShowAdd(false)}>
           <div className="sheet" onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '32px 32px 0 0', padding: '32px 24px' }}>
              <div className="sheet-handle" style={{ background: '#EEE' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, textAlign: 'center', marginBottom: 24 }}>New Reminder</h2>
              <div className="form-group">
                 <input type="text" className="input" placeholder="What should I remind you? *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
                 <div className="form-group">
                    <label className="form-label">Date</label>
                    <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                 </div>
                 <div className="form-group">
                    <label className="form-label">Time</label>
                    <input type="time" className="input" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                 </div>
              </div>
              <button className="btn btn-primary" onClick={addReminder} style={{ marginTop: 32, height: 56, borderRadius: '20px' }}>Set Reminder</button>
           </div>
        </div>
      )}
    </div>
  );
}
