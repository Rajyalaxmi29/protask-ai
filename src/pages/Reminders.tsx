import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Bell, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import { supabase } from '../lib/supabase';
import LightBeamButton from '../components/LightBeamButton';

interface Reminder {
  id: string;
  title: string;
  time: string;
  taskName?: string;
  section: 'Today' | 'Upcoming';
  date?: string;
  rawTime: Date;
}

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const fetchReminders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      if (data) {
        const mappedReminders: Reminder[] = data.map((r: any) => {
          const d = new Date(r.reminder_time);
          const today = new Date();
          today.setHours(23, 59, 59, 999);

          const isTodayOrPast = d <= today;

          return {
            id: r.id,
            title: r.title,
            time: d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
            date: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
            taskName: r.description || undefined,
            section: isTodayOrPast ? 'Today' : 'Upcoming',
            rawTime: d,
          };
        });

        // Sort ascending by time
        mappedReminders.sort((a, b) => {
          return a.rawTime.getTime() - b.rawTime.getTime();
        });

        setReminders(mappedReminders);
      }
    } catch (error) {
      console.error(JSON.stringify(error, null, 2));
    }
  };

  useEffect(() => {
    // Request notification permission on load
    if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    fetchReminders();

    const channel = supabase
      .channel('reminders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders' }, () => {
        fetchReminders();
      })
      .subscribe();

    const intervalId = setInterval(() => {
      setReminders(currentReminders => {
        const now = new Date();
        const expiredReminders = currentReminders.filter(r => r.rawTime <= now);

        expiredReminders.forEach(async (reminder) => {
          // Trigger notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('⏰ Reminder', {
              body: reminder.title
            });
          }

          // Mark as dismissed in Supabase so it does NOT fire again
          try {
            const { error } = await supabase
              .from('reminders')
              .update({ status: 'dismissed' })
              .eq('id', reminder.id);

            if (error) throw error;
            fetchReminders();
          } catch (error) {
            console.error(JSON.stringify(error, null, 2));
          }
        });

        // Eagerly remove the ones we just notified about from the UI array
        if (expiredReminders.length > 0) {
          return currentReminders.filter(r => r.rawTime > now);
        }
        return currentReminders;
      });
    }, 10000); // Check every 10 seconds

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalId);
    };
  }, []);

  const dismissReminder = async (id: string) => {
    // Optimistic UI update
    setReminders(reminders.filter(r => r.id !== id));

    try {
      const { error } = await supabase
        .from('reminders')
        .update({ status: 'dismissed' })
        .eq('id', id);

      if (error) throw error;
      fetchReminders();
    } catch (error) {
      console.error(JSON.stringify(error, null, 2));
      fetchReminders();
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate || !newTime) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const reminder_time = new Date(`${newDate}T${newTime}`).toISOString();

      const { error } = await supabase.from('reminders').insert([
        {
          title: newTitle,
          description: newDesc,
          reminder_time,
          user_id: user.id,
          status: 'pending'
        }
      ]);

      if (error) throw error;

      setIsModalOpen(false);
      setNewTitle('');
      setNewDate('');
      setNewTime('');
      setNewDesc('');
      fetchReminders();
    } catch (error) {
      console.error(JSON.stringify(error, null, 2));
    }
  };

  const todayReminders = reminders.filter(r => r.section === 'Today');
  const upcomingReminders = reminders.filter(r => r.section === 'Upcoming');

  return (
    <div className="min-h-screen bg-[#020817] text-white font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight font-serif font-normal tracking-[-0.02em]">Reminders</h2>
          <LightBeamButton
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/30 active:scale-95"
          >
            <Plus size={18} />
            Add Reminder
          </LightBeamButton>
        </div>

        {/* Today Section */}
        <div className="mb-12">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6 tracking-widest font-mono">Today</h3>
          <div className="space-y-4">
            {todayReminders.length > 0 ? (
              todayReminders.map((reminder) => (
                <motion.div
                  layout
                  key={reminder.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 bg-[#0a0a0a]/70 backdrop-blur-xl border-white/10 border border-white/5 rounded-3xl hover:border-white/10 transition-all group gap-6"
                >
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.1)] shrink-0">
                      <Bell size={20} className="md:w-6 md:h-6" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-lg md:text-xl text-white mb-1 truncate">{reminder.title}</h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-xs md:text-sm font-black text-blue-500">{reminder.time}</span>
                        {reminder.taskName && (
                          <span className="text-[9px] md:text-xs text-gray-500 font-medium uppercase tracking-wider truncate">Linked: {reminder.taskName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissReminder(reminder.id)}
                    className="w-full sm:w-auto px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                  >
                    Dismiss
                  </button>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 bg-[#0a0a0a]/70 backdrop-blur-xl border-white/10 rounded-3xl border border-dashed border-white/10">
                <p className="text-gray-500 font-medium px-6">Nothing here yet. Click + to add your first one.</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Section */}
        <div className="mb-12">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6 tracking-widest font-mono">Upcoming</h3>
          <div className="space-y-4">
            {upcomingReminders.length > 0 ? (
              upcomingReminders.map((reminder) => (
                <motion.div
                  layout
                  key={reminder.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 bg-[#0a0a0a]/70 backdrop-blur-xl border-white/10 border border-white/5 rounded-3xl hover:border-white/10 transition-all group gap-6"
                >
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-purple-600/10 flex items-center justify-center text-purple-500 shadow-[0_0_20px_rgba(124,58,237,0.1)] shrink-0">
                      <Bell size={20} className="md:w-6 md:h-6" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-lg md:text-xl text-white mb-1 truncate">{reminder.title}</h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-xs md:text-sm font-black text-purple-500">{reminder.date} • {reminder.time}</span>
                        {reminder.taskName && (
                          <span className="text-[9px] md:text-xs text-gray-500 font-medium uppercase tracking-wider truncate">Linked: {reminder.taskName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissReminder(reminder.id)}
                    className="w-full sm:w-auto px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                  >
                    Dismiss
                  </button>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 bg-[#0a0a0a]/70 backdrop-blur-xl border-white/10 rounded-3xl border border-dashed border-white/10">
                <p className="text-gray-500 font-medium px-6">Nothing here yet. Click + to add your first one.</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Tip Banner */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/10 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] backdrop-blur-md flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 text-center sm:text-left">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/10 flex items-center justify-center text-blue-400 shrink-0">
              <Sparkles size={28} className="md:w-8 md:h-8" />
            </div>
            <div>
              <h4 className="text-lg md:text-xl font-bold text-white mb-1">🤖 AI Tip</h4>
              <p className="text-gray-300 text-xs md:text-sm">You have 2 tasks due tomorrow with no reminders set. Want AI to add them?</p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <button className="flex-1 lg:flex-none px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 whitespace-nowrap">
              Yes, Add
            </button>
            <button className="text-[10px] md:text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors whitespace-nowrap">
              Skip
            </button>
          </div>
        </div>
      </main>

      {/* Add Reminder Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Reminder"
      >
        <form className="space-y-5" onSubmit={handleAddReminder}>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 tracking-widest font-mono">Reminder Title</label>
            <input
              type="text"
              placeholder="What should we remind you about?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 tracking-widest font-mono">Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 tracking-widest font-mono">Time</label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 tracking-widest font-mono">Link to Task (Optional)</label>
            <select
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all appearance-none [color-scheme:dark]"
            >
              <option value="" className="bg-[#141414] text-white">None</option>
              <option value="Design system update" className="bg-[#141414] text-white">Design system update</option>
              <option value="Review budget spreadsheet" className="bg-[#141414] text-white">Review budget spreadsheet</option>
              <option value="Buy groceries" className="bg-[#141414] text-white">Buy groceries</option>
            </select>
          </div>
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
            <div>
              <p className="text-xs font-bold text-white mb-1">AI Suggestion</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Let AI pick the best time</p>
            </div>
            <div className="w-12 h-6 bg-white/10 rounded-full relative cursor-pointer">
              <div className="absolute left-1 top-1 w-4 h-4 bg-gray-500 rounded-full transition-all" />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 uppercase text-xs tracking-widest"
            >
              Save Reminder
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
