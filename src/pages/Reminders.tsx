import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Bell, X, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';

interface Reminder {
  id: string;
  title: string;
  time: string;
  taskName?: string;
  section: 'Today' | 'Upcoming';
  date?: string;
}

const initialReminders: Reminder[] = [
  { id: '1', title: 'Call with design team', time: '3:00 PM', taskName: 'Design system update', section: 'Today' },
  { id: '2', title: 'Submit tax reports', time: '5:30 PM', taskName: 'Budget review', section: 'Today' },
  { id: '3', title: 'Grocery shopping', time: '10:00 AM', date: 'Mar 2', taskName: 'Buy groceries', section: 'Upcoming' },
  { id: '4', title: 'Client follow-up', time: '2:00 PM', date: 'Mar 3', taskName: 'Call client', section: 'Upcoming' },
  { id: '5', title: 'Gym session', time: '6:00 PM', date: 'Mar 4', taskName: 'Gym session', section: 'Upcoming' },
];

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const dismissReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const todayReminders = reminders.filter(r => r.section === 'Today');
  const upcomingReminders = reminders.filter(r => r.section === 'Upcoming');

  return (
    <div className="min-h-screen bg-[#020817] text-white font-sans flex flex-col">
      <Navbar />
      
      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">Reminders</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/30 active:scale-95"
          >
            <Plus size={18} />
            Add Reminder
          </button>
        </div>

        {/* Today Section */}
        <div className="mb-12">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6">Today</h3>
          <div className="space-y-4">
            {todayReminders.length > 0 ? (
              todayReminders.map((reminder) => (
                <motion.div
                  layout
                  key={reminder.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 bg-[#141414] border border-white/5 rounded-3xl hover:border-white/10 transition-all group gap-6"
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
              <div className="text-center py-12 bg-[#141414] rounded-3xl border border-dashed border-white/10">
                <p className="text-gray-500 font-medium px-6">Nothing here yet. Click + to add your first one.</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Section */}
        <div className="mb-12">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6">Upcoming</h3>
          <div className="space-y-4">
            {upcomingReminders.length > 0 ? (
              upcomingReminders.map((reminder) => (
                <motion.div
                  layout
                  key={reminder.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 bg-[#141414] border border-white/5 rounded-3xl hover:border-white/10 transition-all group gap-6"
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
              <div className="text-center py-12 bg-[#141414] rounded-3xl border border-dashed border-white/10">
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
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Reminder Title</label>
            <input 
              type="text" 
              placeholder="What should we remind you about?"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Date</label>
              <input 
                type="date" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Time</label>
              <input 
                type="time" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Link to Task (Optional)</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all appearance-none">
              <option value="">None</option>
              <option value="1">Design system update</option>
              <option value="2">Review budget spreadsheet</option>
              <option value="3">Buy groceries</option>
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
