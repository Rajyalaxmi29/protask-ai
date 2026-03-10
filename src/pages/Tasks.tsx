import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, MoreVertical, CheckCircle2, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import { supabase } from '../lib/supabase';
import LightBeamButton from '../components/LightBeamButton';

interface Task {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  due_date: string;
  completed: boolean;
  label: string;
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'All' | 'Today' | 'Completed'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newTaskLabel, setNewTaskLabel] = useState('Work');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setTasks(data as Task[]);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 3. Prevent insert if user is null
      if (!user) {
        console.error("User is not authenticated. Cannot insert task.");
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title: newTaskTitle.trim(),
            description: newTaskDesc.trim(),
            // 4. Ensure due_date is in YYYY-MM-DD format from the date input Native value is already YYYY-MM-DD
            due_date: newTaskDate ? newTaskDate : null,
            priority: newTaskPriority,
            label: newTaskLabel,
            // 5. Ensure completed is explicitly set to false on insert.
            completed: false,
            // 2. Ensure user_id is set
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (error) {
        // 6. Log full Supabase error
        console.error(JSON.stringify(error, null, 2));
        return;
      }

      if (data) {
        setTasks([data as Task, ...tasks]);
        setIsModalOpen(false);
        // Reset form
        setNewTaskTitle('');
        setNewTaskDesc('');
        setNewTaskDate('');
        setNewTaskPriority('Medium');
        setNewTaskLabel('Work');
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const toggleTask = async (id: string, currentStatus: boolean) => {
    try {
      // Optimistic update
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));

      const { error } = await supabase
        .from('tasks')
        .update({ completed: !currentStatus })
        .eq('id', id);

      if (error) {
        // Revert on error
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: currentStatus } : t));
        throw error;
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      // Optimistic upate
      const previousTasks = [...tasks];
      setTasks(tasks.filter(t => t.id !== id));

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        setTasks(previousTasks);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const isToday = (dateStr: string) => {
    if (!dateStr) return false;
    const today = new Date();
    const date = new Date(dateStr);
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'Today') return isToday(t.due_date);
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
          <h2 className="text-3xl md:text-4xl font-black tracking-tight font-serif font-normal tracking-[-0.02em]">My Tasks</h2>
          <LightBeamButton
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/30 active:scale-95"
          >
            <Plus size={18} />
            Add Task
          </LightBeamButton>
        </div>

        {/* Filter Tabs - Scrollable on mobile */}
        <div className="flex items-center gap-2 mb-8 p-1 bg-white/5 rounded-full w-full md:w-fit overflow-x-auto no-scrollbar">
          {['All', 'Today', 'Completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-6 py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${filter === f ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-white'
                }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Task List */}
        <div className="space-y-4 mb-12">
          {loading ? (
            <div className="text-center py-20 bg-[#0a0a0a]/70 backdrop-blur-xl border-white/10 rounded-3xl border border-dashed border-white/10">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 font-medium px-6">Loading tasks...</p>
            </div>
          ) : filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <motion.div
                layout
                key={task.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-[#0a0a0a]/70 backdrop-blur-xl border-white/10 border border-white/5 rounded-2xl hover:border-white/10 transition-all group gap-4"
              >
                <div className="flex items-center gap-5">
                  <button
                    onClick={() => toggleTask(task.id, task.completed)}
                    className={`w-6 h-6 shrink-0 rounded-lg border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-blue-600 border-blue-600' : 'border-gray-600 hover:border-blue-500'
                      }`}
                  >
                    {task.completed && <CheckCircle2 size={14} className="text-white" />}
                  </button>
                  <div className="min-w-0">
                    <h4 className={`font-bold text-base md:text-lg transition-all truncate ${task.completed ? 'text-gray-600 line-through' : 'text-white'}`}>
                      {task.title}
                    </h4>
                    {task.due_date && <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider tracking-widest font-mono">{new Date(task.due_date).toLocaleDateString()}</p>}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <span className={`px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest ${task.priority === 'High' ? 'bg-red-500/10 text-red-500' :
                    task.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-emerald-500/10 text-emerald-500'
                    }`}>
                    {task.priority}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-gray-600 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-[#0a0a0a]/70 backdrop-blur-xl border-white/10 rounded-3xl border border-dashed border-white/10">
              <p className="text-gray-500 font-medium px-6">Nothing here yet. Click + to add your first one.</p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="bg-[#0a0a0a]/70 backdrop-blur-xl border-white/10 p-6 rounded-3xl border border-white/5">
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
        <form className="space-y-5" onSubmit={handleAddTask}>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 tracking-widest font-mono">Task Title</label>
            <input
              type="text"
              placeholder="What needs to be done?"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 tracking-widest font-mono">Description</label>
            <textarea
              placeholder="Add more details..."
              rows={3}
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 tracking-widest font-mono">Due Date</label>
              <input
                type="date"
                value={newTaskDate}
                onChange={(e) => setNewTaskDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 tracking-widest font-mono">Priority</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all appearance-none [color-scheme:dark]"
              >
                <option value="High" className="bg-[#141414] text-white">High</option>
                <option value="Medium" className="bg-[#141414] text-white">Medium</option>
                <option value="Low" className="bg-[#141414] text-white">Low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 tracking-widest font-mono">Label</label>
            <select
              value={newTaskLabel}
              onChange={(e) => setNewTaskLabel(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all appearance-none [color-scheme:dark]"
            >
              <option value="Work" className="bg-[#141414] text-white">Work</option>
              <option value="Personal" className="bg-[#141414] text-white">Personal</option>
              <option value="Finance" className="bg-[#141414] text-white">Finance</option>
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
