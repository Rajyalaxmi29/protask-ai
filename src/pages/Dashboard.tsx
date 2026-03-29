import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, DollarSign, Bell, FolderOpen, Plus, ArrowUpRight, Tag, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import { useCustomLabels } from '../lib/useCustomLabels';
import { supabase } from '../lib/supabase';
import LightBeamButton from '../components/LightBeamButton';

// ─── 2-color palette ──────────────────────────────────────────────
// Background: #0a0a0f  |  Accent: #6366f1 (indigo)
const ACCENT = '#6366f1';

const CARDS = [
  { key: 'tasks',     icon: CheckSquare, label: "Today's tasks",     unit: 'pending',          to: '/tasks' },
  { key: 'budget',    icon: DollarSign,  label: 'Spent this month',  unit: 'expenses',         to: '/budget' },
  { key: 'reminders', icon: Bell,        label: 'Upcoming',          unit: 'reminders',        to: '/reminders' },
  { key: 'files',     icon: FolderOpen,  label: 'Documents',         unit: 'files uploaded',   to: '/files' },
];

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

// ─── Stat card ────────────────────────────────────────────────────
function StatCard({ card, value, index }: { card: typeof CARDS[0]; value: string; index: number }) {
  const navigate = useNavigate();
  const Icon = card.icon;
  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(card.to)}
      className="group text-left w-full rounded-2xl p-6 flex flex-col gap-4 transition-all duration-200"
      style={{
        background: '#111118',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200"
        style={{ background: 'rgba(99,102,241,0.12)' }}
      >
        <Icon size={18} color={ACCENT} />
      </div>

      {/* Label */}
      <p className="text-xs font-mono tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {card.label}
      </p>

      {/* Value */}
      <p className="text-4xl font-bold text-white leading-none">{value}</p>

      {/* Unit + arrow */}
      <div className="flex items-center justify-between">
        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{card.unit}</span>
        <ArrowUpRight
          size={14}
          style={{ color: ACCENT, opacity: 0, transition: 'opacity 0.2s' }}
          className="group-hover:opacity-100"
        />
      </div>

      {/* Bottom accent line fills on hover */}
      <div className="h-[1px] w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: ACCENT, width: '0%' }}
          whileHover={{ width: '100%' }}
          transition={{ duration: 0.35 }}
        />
      </div>
    </motion.button>
  );
}

// ─── Label card ───────────────────────────────────────────────────
function LabelCard({ label, onDelete, index }: { label: { id: string; name: string }; onDelete: () => void; index: number }) {
  const navigate = useNavigate();

  // Count items for this label from localStorage
  const itemCount = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('protask_label_items');
      if (!raw) return 0;
      const items = JSON.parse(raw);
      return items.filter((i: any) => i.labelId === label.id).length;
    } catch { return 0; }
  }, [label.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="group relative rounded-2xl p-6 flex flex-col gap-4 cursor-pointer"
      style={{
        background: '#111118',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
      }}
      onClick={() => navigate(`/labels/${label.id}`)}
      whileHover={{ y: -3 }}
    >
      {/* Delete button */}
      <button
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-500/10"
        style={{ color: 'rgba(255,255,255,0.3)' }}
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
      >
        <Trash2 size={13} />
      </button>

      {/* Icon */}
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)' }}>
        <Tag size={18} color={ACCENT} />
      </div>

      {/* Name */}
      <p className="text-xs font-mono tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>Label</p>

      {/* Label name as value */}
      <p className="text-xl font-bold text-white leading-snug truncate">{label.name}</p>

      {/* Count + arrow */}
      <div className="flex items-center justify-between">
        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
        <ArrowUpRight size={14} style={{ color: ACCENT, opacity: 0, transition: 'opacity 0.2s' }} className="group-hover:opacity-100" />
      </div>

      {/* Bottom accent line */}
      <div className="h-[1px] w-full rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
    </motion.div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────
export default function Dashboard() {
  const { labels, addLabel, removeLabel } = useCustomLabels();
  const navigate = useNavigate();

  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [userName, setUserName] = useState('');

  const [values, setValues] = useState(['0', '₹0', '0', '0']);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Name
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
      setUserName(profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || '');

      // Tasks today
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      const { count: taskCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('completed', false).eq('due_date', todayStr);

      // Budget
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const lastDay  = new Date(today.getFullYear(), today.getMonth()+1, 0).toISOString().split('T')[0];
      const { data: budgetData } = await supabase.from('budget_entries').select('amount').eq('user_id', user.id).eq('type', 'expense').gte('entry_date', firstDay).lte('entry_date', lastDay);
      const total = (budgetData || []).reduce((s, e) => s + (e.amount || 0), 0);

      // Reminders
      const { count: reminderCount } = await supabase.from('reminders').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'pending');

      // Files
      const { count: fileCount } = await supabase.from('files').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

      setValues([
        taskCount?.toString() ?? '0',
        total.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }),
        reminderCount?.toString() ?? '0',
        fileCount?.toString() ?? '0',
      ]);
    })();
  }, []);

  const handleCreateLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    const newLabel = addLabel(newLabelName.trim());
    setIsLabelModalOpen(false);
    setNewLabelName('');
    navigate(`/labels/${newLabel.id}`);
  };

  return (
    <div className="min-h-screen font-sans" style={{ background: '#0a0a0f', color: '#fff' }}>
      <Navbar />

      <main className="max-w-5xl mx-auto px-5 md:px-10 py-12">

        {/* ── Header ── */}
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 0.35, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-xs font-mono tracking-[0.3em] uppercase mb-3"
            >
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-3xl md:text-4xl font-bold tracking-tight"
            >
              {getGreeting()}{userName ? `, ${userName}` : ''}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="mt-2 text-sm"
            >
              Here's your workspace overview.
            </motion.p>
          </div>

          {/* Create label */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            onClick={() => setIsLabelModalOpen(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="hidden sm:flex shrink-0 items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: ACCENT }}
          >
            <Plus size={15} /> New Label
          </motion.button>
        </div>

        {/* ── Divider ── */}
        <div className="mb-8 h-px w-full" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* ── Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {CARDS.map((card, i) => (
            <StatCard key={card.key} card={card} value={values[i]} index={i} />
          ))}
        </div>

        {/* ── Custom Labels ── */}
        {labels.length > 0 && (
          <>
            <p className="text-[10px] font-mono tracking-[0.35em] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
              My Labels
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {labels.map((label, i) => (
                <LabelCard key={label.id} label={label} onDelete={() => removeLabel(label.id)} index={i} />
              ))}
            </div>
          </>
        )}

        {/* ── Section label ── */}
        <p className="text-[10px] font-mono tracking-[0.35em] uppercase mb-5" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Quick navigation
        </p>

        {/* ── Quick nav tiles ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Tasks',     to: '/tasks',     sub: 'Manage todos' },
            { label: 'Budget',    to: '/budget',    sub: 'Track spending' },
            { label: 'Reminders', to: '/reminders', sub: 'Upcoming alerts' },
            { label: 'Files',     to: '/files',     sub: 'Document vault' },
          ].map((item, i) => (
            <motion.button
              key={item.to}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.06, duration: 0.4 }}
              whileHover={{ y: -2 }}
              onClick={() => navigate(item.to)}
              className="group text-left p-4 rounded-xl transition-all duration-200"
              style={{
                background: '#111118',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <p className="text-sm font-semibold text-white mb-1">{item.label}</p>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.sub}</p>
            </motion.button>
          ))}
        </div>
      </main>

      {/* ── Label Modal ── */}
      <Modal isOpen={isLabelModalOpen} onClose={() => setIsLabelModalOpen(false)} title="Create Label">
        <form className="space-y-4" onSubmit={handleCreateLabel}>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-[0.2em] mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Label name
            </label>
            <input
              type="text"
              placeholder="e.g. Side Project"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-1">
            <LightBeamButton type="submit"
              className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-white"
              style={{ background: ACCENT } as React.CSSProperties}
            >Create</LightBeamButton>
            <LightBeamButton type="button" onClick={() => setIsLabelModalOpen(false)}
              className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' } as React.CSSProperties}
            >Cancel</LightBeamButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
