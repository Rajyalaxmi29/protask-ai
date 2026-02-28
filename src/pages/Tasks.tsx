import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, MoreVertical, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';

interface Task {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  completed: boolean;
  label: string;
}

const initialTasks: Task[] = [
  { id: '1', title: 'Design system update', priority: 'High', dueDate: 'Today', completed: false, label: 'Work' },
  { id: '2', title: 'Review budget spreadsheet', priority: 'Medium', dueDate: 'Tomorrow', completed: true, label: 'Finance' },
  { id: '3', title: 'Buy groceries', priority: 'Low', dueDate: 'Mar 2', completed: false, label: 'Personal' },
  { id: '4', title: 'Call client for feedback', priority: 'High', dueDate: 'Today', completed: false, label: 'Work' },
  { id: '5', title: 'Gym session', priority: 'Low', dueDate: 'Today', completed: true, label: 'Personal' },
];

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState<'All' | 'Today' | 'Completed'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'Today') return t.dueDate === 'Today';
    if (filter === 'Completed') return t.completed;
    return true;
  });

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = (completedCount / tasks.length) * 100;

  return (
    <div className="min-h-screen bg-[#020817] text-white font-sans flex flex-col">
      <Navbar />
      
      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">My Tasks</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/30 active:scale-95"
          >
            <Plus size={18} />
            Add Task
          </button>
        </div>

        {/* Filter Tabs - Scrollable on mobile */}
        <div className="flex items-center gap-2 mb-8 p-1 bg-white/5 rounded-full w-full md:w-fit overflow-x-auto no-scrollbar">
          {['All', 'Today', 'Completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-6 py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                filter === f ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Task List */}
        <div className="space-y-4 mb-12">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <motion.div
                layout
                key={task.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-[#141414] border border-white/5 rounded-2xl hover:border-white/10 transition-all group gap-4"
              >
                <div className="flex items-center gap-5">
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className={`w-6 h-6 shrink-0 rounded-lg border-2 flex items-center justify-center transition-all ${
                      task.completed ? 'bg-blue-600 border-blue-600' : 'border-gray-600 hover:border-blue-500'
                    }`}
                  >
                    {task.completed && <CheckCircle2 size={14} className="text-white" />}
                  </button>
                  <div className="min-w-0">
                    <h4 className={`font-bold text-base md:text-lg transition-all truncate ${task.completed ? 'text-gray-600 line-through' : 'text-white'}`}>
                      {task.title}
                    </h4>
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{task.dueDate}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <span className={`px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest ${
                    task.priority === 'High' ? 'bg-red-500/10 text-red-500' : 
                    task.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' : 
                    'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {task.priority}
                  </span>
                  <button className="text-gray-600 hover:text-white transition-colors">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-[#141414] rounded-3xl border border-dashed border-white/10">
              <p className="text-gray-500 font-medium px-6">Nothing here yet. Click + to add your first one.</p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="bg-[#141414] p-6 rounded-3xl border border-white/5">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              {completedCount} of {tasks.length} tasks completed
            </p>
            <p className="text-sm font-bold text-blue-500">{Math.round(progress)}%</p>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
            />
          </div>
        </div>
      </main>

      {/* Add Task Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Add New Task"
      >
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Task Title</label>
            <input 
              type="text" 
              placeholder="What needs to be done?"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Description</label>
            <textarea 
              placeholder="Add more details..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Due Date</label>
              <input 
                type="date" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Priority</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all appearance-none">
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Label</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all appearance-none">
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="Finance">Finance</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button 
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 uppercase text-xs tracking-widest"
            >
              Save Task
            </button>
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all uppercase text-xs tracking-widest"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
