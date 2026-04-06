import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';
import { persistentData } from '../lib/persistentData';
import type { Task, Reminder, Transaction, FileRecord } from '../lib/supabase';

interface Counts {
  tasks: number;
  tasksDone: number;
  reminders: number;
  income: number;
  expense: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<Counts>({ tasks: 0, tasksDone: 0, reminders: 0, income: 0, expense: 0 });
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const uid = await persistentData.getUserId();
      if (!uid) { setLoading(false); return; }
      
      const session = await supabase.auth.getSession();
      const user = session.data.session?.user;
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User');
        setAvatarUrl(user.user_metadata?.avatar_url || null);
      }

      const [tsks, rems, txs] = await Promise.all([
        persistentData.get<Task>('tasks', uid),
        persistentData.get<Reminder>('reminders', uid),
        persistentData.get<Transaction>('transactions', uid),
      ]);

      const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      
      setCounts({
        tasks: tsks.filter(t => (t.status ?? 'todo') !== 'done').length,
        tasksDone: tsks.filter(t => (t.status ?? 'todo') === 'done').length,
        reminders: rems.filter(r => !r.is_done).length,
        income,
        expense
      });
      setTasks(tsks);
      setTransactions(txs);
      setLoading(false);
    }
    load();
  }, []);

  // REAL DATA: Daily Tasks Overview (Last 7 Days)
  const taskChartData = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      const isoDate = d.toISOString().split('T')[0];
      
      const dayTasks = tasks.filter(t => (t.due_date || t.created_at).startsWith(isoDate));
      days.push({
        name: dayStr,
        completed: dayTasks.filter(t => (t.status ?? 'todo') === 'done').length,
        ongoing: dayTasks.filter(t => (t.status ?? 'todo') !== 'done').length
      });
    }
    return days;
  }, [tasks]);

  // REAL DATA: Monthly Growth Calculation
  const monthlyBalance = useMemo(() => {
    const now = new Date();
    const thisMonth = now.toISOString().substring(0, 7); // YYYY-MM
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = prevMonthDate.toISOString().substring(0, 7);

    const thisMonthTxs = transactions.filter(t => t.date.startsWith(thisMonth));
    const thisMonthNet = thisMonthTxs.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);

    const prevMonthTxs = transactions.filter(t => t.date.startsWith(prevMonth));
    const prevMonthNet = prevMonthTxs.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);

    const diff = thisMonthNet - prevMonthNet;
    const pct = prevMonthNet !== 0 ? Math.round((diff / Math.abs(prevMonthNet)) * 100) : 100;

    return { 
      net: thisMonthNet, 
      diff: diff >= 0 ? `+₹${Math.abs(diff).toLocaleString()}` : `-₹${Math.abs(diff).toLocaleString()}`,
      pct: `${pct}%`,
      isUp: diff >= 0
    };
  }, [transactions]);

  // REAL DATA: Pulse Sparkline from Recent Daily Net
  const sparkData = useMemo(() => {
    const last7 = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const iso = d.toISOString().split('T')[0];
        const dayNet = transactions.filter(t => t.date === iso).reduce((s, t) => s + t.amount, 0);
        last7.push({ v: dayNet || 10 }); // fallback to 10 for visual pulse if 0
    }
    return last7;
  }, [transactions]);

  return (
    <div className="page">
      <AppHeader
        showLogo
        showTheme
        rightContent={
          <div onClick={() => navigate('/profile')} style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--accent-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, cursor: 'pointer', color: '#fff' }}>
             {avatarUrl ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} alt="avatar" /> : userName.charAt(0).toUpperCase()}
          </div>
        }
      />

      <div className="page-content" style={{ padding: '20px' }}>
        <div style={{ marginBottom: 24 }}>
           <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 2 }}>Good evening,</p>
           <h2 style={{ fontSize: '1.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10 }}>
              {userName} <span className="animate-wave">👋</span>
           </h2>
        </div>

        {/* Dynamic Financial Hero */}
        <div className="card" style={{ background: '#2D3139', border: 'none', padding: '24px', borderRadius: '24px', color: '#fff', marginBottom: 16 }}>
           <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: 8 }}>Total Net Worth</div>
           <div style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: 12 }}>₹{(counts.income - counts.expense).toLocaleString('en-IN')}</div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.85rem', background: monthlyBalance.isUp ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', color: monthlyBalance.isUp ? '#4ADE80' : '#F87171', padding: '4px 10px', borderRadius: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                 {monthlyBalance.isUp ? '↗' : '↘'} {monthlyBalance.pct}
              </span>
              <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>{monthlyBalance.diff} this month</span>
           </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
           <div className="card" style={{ background: '#fff', border: '1px solid #F0F0F0', padding: '20px', borderRadius: '24px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#F8F9FB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: '#333' }}>↑</div>
              <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600, marginBottom: 4 }}>Total Income</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111' }}>₹{counts.income.toLocaleString('en-IN')}</div>
           </div>
           <div className="card" style={{ background: '#fff', border: '1px solid #F0F0F0', padding: '20px', borderRadius: '24px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#F8F9FB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: '#333' }}>↓</div>
              <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600, marginBottom: 4 }}>Total Expense</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111' }}>₹{counts.expense.toLocaleString('en-IN')}</div>
           </div>
        </div>

        <div className="section-header" style={{ marginBottom: 16 }}>
           <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111' }}>Ecosystem</h3>
           <button style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, fontSize: '0.85rem' }}>See all</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
           {[
              { title: 'Task Manager', path: '/tasks', icon: '📋', count: counts.tasks, color: '#3B82F6' },
              { title: 'Reminders', path: '/reminders', icon: '🔔', count: counts.reminders, color: '#F59E0B' },
              { title: 'Finance Tracker', path: '/expenses', icon: '💸', count: transactions.length, color: '#10B981' }
           ].map((item, idx) => (
             <div key={idx} onClick={() => navigate(item.path)} className="card" style={{ background: '#fff', border: '1px solid #F0F0F0', padding: '16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
                <div style={{ width: 44, height: 44, borderRadius: '14px', background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem' }}>
                   {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                   <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111' }}>{item.title}</div>
                   <div style={{ fontSize: '0.75rem', color: '#888' }}>{item.count} items tracked</div>
                </div>
                <div style={{ color: '#CCC' }}>❯</div>
             </div>
           ))}
        </div>

        <div style={{ marginBottom: 16 }}>
           <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111' }}>Task Overview</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
           <div className="card" style={{ background: '#9E8896', border: 'none', borderRadius: '24px', padding: '24px', position: 'relative', overflow: 'hidden', minHeight: 180 }}>
              <div style={{ textAlign: 'center', color: '#fff', position: 'relative', zIndex: 2 }}>
                 <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{counts.tasksDone}</div>
                 <div style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 600 }}>Completed Task</div>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '60px' }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparkData}>
                       <Area type="monotone" dataKey="v" stroke="rgba(255,255,255,0.4)" fill="rgba(255,255,255,0.1)" strokeWidth={2} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>
           <div className="card" style={{ background: '#EFB08C', border: 'none', borderRadius: '24px', padding: '24px', position: 'relative', overflow: 'hidden', minHeight: 180 }}>
              <div style={{ textAlign: 'center', color: '#fff', position: 'relative', zIndex: 2 }}>
                 <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{counts.tasks}</div>
                 <div style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 600 }}>Ongoing Task</div>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '60px' }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparkData}>
                       <Area type="monotone" dataKey="v" stroke="rgba(255,255,255,0.4)" fill="rgba(255,255,255,0.1)" strokeWidth={2} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

        <div className="card" style={{ background: '#fff', border: '1px solid #F0F0F0', borderRadius: '24px', padding: '24px', marginBottom: 20 }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111' }}>Daily tasks overview</div>
              <div style={{ fontSize: '0.75rem', color: '#AAA' }}>{new Date().toLocaleDateString('en-GB')}</div>
           </div>
           <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={taskChartData} barGap={8}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#AAA', fontSize: 10 }} dy={10} />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }} />
                    <Bar dataKey="completed" fill="#9E8896" radius={[4, 4, 0, 0]} barSize={10} />
                    <Bar dataKey="ongoing" fill="#EFB08C" radius={[4, 4, 0, 0]} barSize={10} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
           <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: '#666', fontWeight: 600 }}>
                 <div style={{ width: 8, height: 8, borderRadius: '2px', background: '#9E8896' }} /> Completed
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: '#666', fontWeight: 600 }}>
                 <div style={{ width: 8, height: 8, borderRadius: '2px', background: '#EFB08C' }} /> Ongoing
              </div>
           </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
