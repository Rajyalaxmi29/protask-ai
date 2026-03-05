import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Spline from '@splinetool/react-spline';
import {
  CheckCircle2,
  MoreVertical,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import { useCustomLabels } from '../lib/useCustomLabels';
import { supabase } from '../lib/supabase';

const StatCard = ({ title, value, subtitle, to, color = "blue", index, scene, imageUrl }: { title: string, value: string, subtitle: string, to: string, color?: "blue" | "emerald" | "amber" | "rose", index: number, scene?: string, imageUrl?: string }) => {
  const navigate = useNavigate();
  const glowColors = {
    blue: "group-hover:border-blue-500/30 shadow-blue-500/5",
    emerald: "group-hover:border-emerald-500/30 shadow-emerald-500/5",
    amber: "group-hover:border-amber-500/30 shadow-amber-500/5",
    rose: "group-hover:border-rose-500/30 shadow-rose-500/5"
  };

  const btnColors = {
    blue: "hover:bg-blue-600",
    emerald: "hover:bg-emerald-600",
    amber: "hover:bg-amber-600",
    rose: "hover:bg-rose-600"
  };

  const isEven = index % 2 === 0;

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.01 }}
      onClick={() => navigate(to)}
      className={`bg-[#141414] border border-white/5 rounded-3xl overflow-hidden relative group md:h-72 flex flex-col md:flex-row transition-all cursor-pointer ${glowColors[color]} ${!isEven ? 'md:flex-row-reverse' : ''}`}
    >
      {/* Content Side */}
      <div className="relative z-10 p-8 md:p-10 w-full md:w-1/2 flex flex-col justify-center backdrop-blur-sm bg-white/[0.02]">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-3">{title}</p>
        <h3 className="text-3xl md:text-4xl font-bold text-white mb-2">{value}</h3>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">{subtitle}</p>

        <div>
          <div
            className={`inline-flex items-center gap-2 px-6 py-2.5 bg-white/5 ${btnColors[color]} text-white rounded-full text-[10px] font-bold uppercase tracking-widest transition-all group/btn`}
          >
            Get in touch
            <ArrowUpRight size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Spline/Image Side - Balanced and Clear */}
      <div className="w-full md:w-1/2 h-48 md:h-full relative bg-[#050505] overflow-hidden border-t md:border-t-0 md:border-x border-white/5">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-contain transition-transform duration-700 ease-out group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="absolute inset-0">
              <Spline
                scene={scene!}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const TaskItem = ({ title, date, priority, completed = false }: { title: string, date: string, priority: string, completed?: boolean }) => (
  <div className="flex items-center justify-between p-4 bg-[#1a1a1a] border border-white/5 rounded-xl hover:border-white/10 transition-all group">
    <div className="flex items-center gap-4">
      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors ${completed ? 'bg-blue-600 border-blue-600' : 'border-gray-600 hover:border-blue-600'}`}>
        {completed && <CheckCircle2 size={14} className="text-white" />}
      </div>
      <div>
        <h4 className={`font-medium ${completed ? 'text-gray-500 line-through' : 'text-white'}`}>{title}</h4>
        <p className="text-xs text-gray-500">{date}</p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${priority === 'High' ? 'bg-red-500/10 text-red-500' :
        priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' :
          'bg-blue-500/10 text-blue-500'
        }`}>
        {priority}
      </span>
      <button className="text-gray-600 hover:text-white transition-colors">
        <MoreVertical size={18} />
      </button>
    </div>
  </div>
);

export default function Dashboard() {
  const { addLabel } = useCustomLabels();
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [todaysTaskCount, setTodaysTaskCount] = useState<string>("0");
  const [budgetThisMonth, setBudgetThisMonth] = useState<string>("₹0");
  const [upcomingRemindersCount, setUpcomingRemindersCount] = useState<string>("0");
  const navigate = useNavigate();

  useEffect(() => {
    fetchTodaysTaskCount();
    fetchBudgetThisMonth();
    fetchUpcomingRemindersCount();
  }, []);

  const fetchTodaysTaskCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get today's date in YYYY-MM-DD
      const today = new Date();
      // Use local timezone to match the date input exactly
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const { count, error } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', false)
        // If due_date is just a date, casting might be safer, or just use the string.
        // Let's also check if maybe they have no due dates set for today, or if they are stored weirdly
        .eq('due_date', todayStr);

      if (error) {
        console.error("Supabase count error:", error);
        throw error;
      }
      setTodaysTaskCount(count ? count.toString() : "0");
    } catch (error) {
      console.error("Error fetching today's task count:", error);
    }
  };

  const fetchBudgetThisMonth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      // Get current month's first and last day
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const firstDayStr = firstDay.toISOString().split('T')[0];
      const lastDayStr = lastDay.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('budget_entries')
        .select('amount')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('entry_date', firstDayStr)
        .lte('entry_date', lastDayStr);

      if (error) {
        console.error(JSON.stringify(error, null, 2));
        return;
      }

      const totalSpent = (data || []).reduce((sum, entry) => sum + (entry.amount || 0), 0);
      const formattedValue = totalSpent.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
      setBudgetThisMonth(formattedValue);
    } catch (error) {
      console.error(JSON.stringify(error, null, 2));
    }
  };

  const fetchUpcomingRemindersCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count, error } = await supabase
        .from('reminders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) {
        throw error;
      }
      setUpcomingRemindersCount(count ? count.toString() : "0");
    } catch (error) {
      console.error(JSON.stringify(error, null, 2));
    }
  };

  const handleCreateLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    const newLabel = addLabel(newLabelName.trim());
    setIsLabelModalOpen(false);
    setNewLabelName('');
    // Navigate to the newly created label page
    navigate(`/labels/${newLabel.id}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col">
      {/* CSS to hide Spline Watermark */}
      <style dangerouslySetInnerHTML={{
        __html: `
        #spline-watermark, 
        .spline-watermark,
        a[href*="spline.design"] { 
          display: none !important; 
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}} />

      <Navbar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Dashboard Content */}
        <div className="p-8 max-w-7xl mx-auto w-full">
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-1">Good morning, Alex</h2>
              <p className="text-gray-500">Here's what's happening with your projects today.</p>
            </div>
            <button
              onClick={() => setIsLabelModalOpen(true)}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-full text-sm font-bold transition-all border border-white/10 flex items-center gap-2"
            >
              <Plus size={18} />
              Create Label
            </button>
          </div>

          {/* Stats Grid - Staggered Alternating Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-16 mb-20">
            <div className="lg:col-start-1">
              <StatCard
                index={0}
                title="Today's Tasks"
                value={todaysTaskCount}
                subtitle="Pending completion"
                to="/tasks"
                color="blue"
                imageUrl="https://cdn3d.iconscout.com/3d/premium/thumb/checklist-5381347-4497557.png"
              />
            </div>
            <div className="lg:col-start-2 lg:mt-24">
              <StatCard
                index={1}
                title="Budget This Month"
                value={budgetThisMonth}
                subtitle="Total spent"
                to="/budget"
                color="emerald"
                imageUrl="https://cdn3d.iconscout.com/3d/premium/thumb/saving-money-5381348-4497558.png"
              />
            </div>
            <div className="lg:col-start-1 lg:-mt-12">
              <StatCard
                index={2}
                title="Upcoming Reminders"
                value={upcomingRemindersCount}
                subtitle="Pending reminders"
                to="/reminders"
                color="amber"
                imageUrl="https://cdn3d.iconscout.com/3d/premium/thumb/calendar-5381346-4497556.png"
              />
            </div>
            <div className="lg:col-start-2 lg:mt-12">
              <StatCard
                index={3}
                title="Files Expiring"
                value="1"
                subtitle="Document review needed"
                to="/files"
                color="rose"
                imageUrl="https://cdn3d.iconscout.com/3d/premium/thumb/folder-5381345-4497555.png"
              />
            </div>
          </div>

        </div>
      </main>

      <Modal
        isOpen={isLabelModalOpen}
        onClose={() => setIsLabelModalOpen(false)}
        title="Create Custom Label"
      >
        <form className="space-y-5" onSubmit={handleCreateLabel}>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Label Name</label>
            <input
              type="text"
              placeholder="e.g. Side Project"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 uppercase text-xs tracking-widest"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setIsLabelModalOpen(false)}
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
