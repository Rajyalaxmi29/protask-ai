import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Plus, Calendar as CalendarIcon, Clock, 
  CheckCircle2, Trash2, ChevronLeft, ChevronRight,
  AlertPixel, Sparkles, Activity
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';
import { persistentData } from '../lib/persistentData';
import type { Reminder } from '../lib/supabase';

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAdd, setShowAdd] = useState(false);
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

  const activeForDate = useMemo(() => {
    return reminders.filter(r => r.remind_at.startsWith(selectedDate) && !r.is_done)
                   .sort((a,b) => a.remind_at.localeCompare(b.remind_at));
  }, [reminders, selectedDate]);

  const completedForDate = useMemo(() => {
    return reminders.filter(r => r.remind_at.startsWith(selectedDate) && r.is_done)
                   .sort((a,b) => a.remind_at.localeCompare(b.remind_at));
  }, [reminders, selectedDate]);

  const toggleReminder = async (r: Reminder) => {
    const updated = await persistentData.mutate('reminders', 'UPDATE', { ...r, is_done: !r.is_done });
    setReminders(prev => prev.map(x => x.id === r.id ? (updated as Reminder) : x));
  };

  const deleteReminder = async (id: string) => {
    if (!window.confirm('Delete scheduling?')) return;
    await persistentData.mutate('reminders', 'DELETE', { id });
    setReminders(prev => prev.filter(r => r.id !== id));
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
    setForm({ ...form, title: '', description: '' });
  };

  return (
    <div className="page">
      <AppHeader title="Pulse Schedule" showTheme />

      <div className="page-content" style={{ padding: '0px' }}>
        
        {/* Pulse Insights Header */}
        <div style={{ padding: '32px 20px', background: 'var(--bg-primary)' }}>
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="card" 
             style={{ 
               background: 'var(--secondary-grad)', border: 'none', 
               padding: '24px', borderRadius: '24px', position: 'relative', overflow: 'hidden' 
             }}
           >
              <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}><Bell size={120} /></div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', fontWeight: 600, marginBottom: 12 }}>
                    <Activity size={16} /> MOMENTUM STATUS
                 </div>
                 <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', marginBottom: 4 }}>You've stayed focused for 3 hours</h3>
                 <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Next activity starts in 45 minutes.</p>
              </div>
           </motion.div>
        </div>

        {/* Pulse Timeline Matrix */}
        <div style={{ padding: '0 20px 100px' }}>
           <div className="section-header" style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Timeline</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={e => setSelectedDate(e.target.value)}
                  style={{ 
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)', 
                    borderRadius: '12px', padding: '6px 12px', color: 'var(--text-primary)',
                    fontSize: '0.8rem', fontWeight: 700
                  }}
                />
              </div>
           </div>

           <div style={{ position: 'relative' }}>
              {/* Vertical Pulse Line */}
              <div style={{ position: 'absolute', left: 24, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, var(--accent), transparent)', opacity: 0.3 }} />

              <div className="flex flex-col gap-8">
                 {activeForDate.length === 0 && completedForDate.length === 0 && (
                   <div className="empty-state" style={{ padding: '60px 0', marginLeft: 60 }}>
                      <Sparkles size={40} color="var(--accent)" style={{ marginBottom: 16 }} />
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Quiet Zone</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No activities detected for this sequence.</p>
                   </div>
                 )}

                 {activeForDate.map((r, i) => (
                   <motion.div 
                     key={r.id}
                     initial={{ opacity: 0, x: -10 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: i * 0.1 }}
                     style={{ display: 'flex', gap: 24, position: 'relative' }}
                   >
                      {/* Pulse Node */}
                      <div style={{ width: 50, display: 'flex', justifyContent: 'center', zIndex: 1 }}>
                         <div style={{ 
                           width: 14, height: 14, borderRadius: '50%', background: 'var(--accent)', 
                           marginTop: 10, border: '4px solid var(--bg-primary)',
                           boxShadow: '0 0 15px var(--accent-glow)'
                         }} className="animate-pulse" />
                      </div>
                      
                      <div 
                        className="card" 
                        style={{ 
                          flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                          padding: '20px', borderRadius: '24px', position: 'relative'
                        }}
                      >
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
                               <Clock size={14} /> {new Date(r.remind_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <button onClick={() => deleteReminder(r.id)} className="icon-btn" style={{ width: 28, height: 28, background: 'transparent' }}>
                               <Trash2 size={14} color="var(--text-muted)" />
                            </button>
                         </div>
                         <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 8 }}>{r.title}</h4>
                         {r.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{r.description}</p>}
                         
                         <button 
                           onClick={() => toggleReminder(r)}
                           className="btn" 
                           style={{ 
                             marginTop: 16, background: 'rgba(0,255,178,0.05)', color: 'var(--accent)', 
                             width: '100%', borderRadius: '12px', padding: '10px', fontSize: '0.8rem', fontWeight: 800,
                             border: '1px solid rgba(0,255,178,0.1)'
                           }}
                         >
                            Check-in Done
                         </button>
                      </div>
                   </motion.div>
                 ))}

                 {completedForDate.length > 0 && (
                   <div className="flex flex-col gap-4" style={{ opacity: 0.5 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', marginLeft: 74, marginBottom: 8 }}>COMPLETED SEQUENCE</div>
                      {completedForDate.map(r => (
                        <div key={r.id} style={{ display: 'flex', gap: 24, paddingLeft: 12 }}>
                           <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <CheckCircle2 size={14} color="var(--text-muted)" />
                           </div>
                           <div style={{ flex: 1, fontSize: '0.95rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>{r.title}</div>
                        </div>
                      ))}
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* Action Launcher */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowAdd(true)}
        style={{ 
          position: 'fixed', bottom: 100, right: 24, 
          width: 56, height: 56, borderRadius: '20px', 
          background: 'var(--accent)', border: 'none', 
          color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', 
          boxShadow: '0 8px 25px var(--accent-glow)', zIndex: 100, cursor: 'pointer' 
        }}
      >
         <Plus size={28} />
      </motion.button>

      {/* Add Sheet */}
      <AnimatePresence>
        {showAdd && (
          <div className="overlay" onClick={() => setShowAdd(false)}>
             <motion.div 
               initial={{ y: '100%' }}
               animate={{ y: 0 }}
               exit={{ y: '100%' }}
               className="sheet" 
               onClick={e => e.stopPropagation()} 
               style={{ background: '#121821', borderRadius: '32px 32px 0 0', padding: '40px 24px' }}
             >
                <div className="sheet-handle" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 32 }}>Schedule Activity</h2>
                
                <div className="flex flex-col gap-6">
                   <div className="form-group">
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 10, display: 'block' }}>TITLE</label>
                      <input 
                        type="text" className="input" placeholder="What's the pulse?" 
                        value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus 
                      />
                   </div>
                   
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="form-group">
                         <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 10, display: 'block' }}>DATE</label>
                         <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                      </div>
                      <div className="form-group">
                         <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 10, display: 'block' }}>TIME</label>
                         <input type="time" className="input" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                      </div>
                   </div>
                </div>

                <button 
                  disabled={saving || !form.title.trim()}
                  className="btn btn-primary" 
                  onClick={addReminder} 
                  style={{ marginTop: 40, height: 60, borderRadius: '20px', fontSize: '1rem', fontWeight: 900, width: '100%' }}
                >
                   {saving ? 'Syncing Timeline...' : 'Stabilize Schedule'}
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
