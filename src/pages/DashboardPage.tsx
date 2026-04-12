import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Menu,
  Flame, Zap,
  TrendingUp, CheckCircle2,
  DollarSign, FileText,
  ChevronRight, Bell,
  Target, Folder,
  TrendingDown, Clock
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { persistentData } from '../lib/persistentData';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  // Stats
  const [todoCount, setTodoCount] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [balance, setBalance] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [fileCount, setFileCount] = useState(0);
  const [productivity, setProductivity] = useState(0);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const userId = await persistentData.getUserId();
      if (!userId) { setLoading(false); return; }

      const [tasks, transactions, files] = await Promise.all([
        persistentData.get<any>('tasks', userId),
        persistentData.get<any>('transactions', userId),
        persistentData.get<any>('files', userId),
      ]);

      // --- Task stats ---
      const todo = tasks.filter((t: any) => !t.done).length;
      const done = tasks.filter((t: any) => t.done).length;
      setTodoCount(todo);
      setDoneCount(done);

      // Productivity = % of tasks completed
      const totalTasks = todo + done;
      const prod = totalTasks > 0 ? Math.round((done / totalTasks) * 100) : 0;
      setProductivity(prod);

      // --- Finance stats ---
      let inc = 0, exp = 0;
      transactions.forEach((t: any) => {
        if (t.type === 'income') inc += Number(t.amount) || 0;
        else exp += Number(t.amount) || 0;
      });
      setTotalIncome(inc);
      setTotalExpense(exp);
      setBalance(inc - exp);

      // --- File count ---
      setFileCount(files.length);

      // --- Activity feed: TODAY only ---
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const isToday = (dateStr: string) => {
        if (!dateStr) return false;
        return new Date(dateStr).getTime() >= todayStart.getTime();
      };

      const feed: any[] = [
        ...tasks
          .filter((t: any) => isToday(t.created_at) || (t.done && isToday(t.updated_at)))
          .map((t: any) => ({
            icon: t.done ? '✅' : '⚡',
            title: t.title,
            sub: t.done ? 'Task completed today' : 'Task added today',
            date: t.updated_at || t.created_at,
            path: '/tasks'
          })),
        ...transactions
          .filter((t: any) => isToday(t.created_at) || isToday(t.date))
          .map((t: any) => ({
            icon: t.type === 'income' ? '💰' : '💸',
            title: t.title,
            sub: `${t.type === 'income' ? '+' : '-'}₹${Number(t.amount).toLocaleString('en-IN')} · ${t.category}`,
            date: t.created_at || t.date,
            path: '/expenses'
          })),
        ...files
          .filter((f: any) => isToday(f.created_at))
          .map((f: any) => ({
            icon: '📁',
            title: f.name,
            sub: `${f.type} · ${f.size} · uploaded`,
            date: f.created_at,
            path: '/files'
          })),
      ];

      feed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivities(feed.slice(0, 6));

    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="page" style={{ background: '#000' }}>
      {/* Header */}
      <header style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '20px', position: 'sticky', top: 0, 
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 100 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Menu size={20} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{greeting()} 👋</span>
            <span style={{ fontSize: '1rem', fontWeight: 900 }}>System Dashboard</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, color: 'var(--text-secondary)' }}>
          <Search size={18} />
          <Bell size={18} />
        </div>
      </header>

      <div className="page-content" style={{ padding: '20px', paddingBottom: 100 }}>

        {/* Productivity Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{ 
            background: 'linear-gradient(135deg, #0a0a0a 0%, #141414 100%)',
            border: '1px solid rgba(0,255,178,0.15)',
            padding: '28px 24px', marginBottom: 20,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '1.5px', marginBottom: 10 }}>TASK COMPLETION RATE</div>
            <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1 }}>
              {loading ? '—' : `${productivity}%`}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 10 }}>
              {doneCount} done · {todoCount} pending
            </div>
            {/* mini progress bar */}
            <div style={{ width: 140, height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, marginTop: 14 }}>
              <div style={{ width: `${productivity}%`, height: '100%', background: 'var(--accent)', borderRadius: 2, transition: 'width 0.8s ease', boxShadow: '0 0 8px var(--accent-glow)' }} />
            </div>
          </div>
          <div style={{ width: 72, height: 72, borderRadius: '22px', background: 'rgba(0,255,178,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={36} color="var(--accent)" />
          </div>
        </motion.div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Balance', value: `₹${Math.abs(balance).toLocaleString('en-IN')}`, sub: balance >= 0 ? 'surplus' : 'deficit', color: balance >= 0 ? '#22c55e' : '#EF4444', icon: DollarSign },
            { label: 'Tasks', value: `${todoCount}`, sub: 'remaining', color: 'var(--accent)', icon: CheckCircle2 },
            { label: 'Vault', value: `${fileCount}`, sub: 'files', color: '#3B82F6', icon: Folder },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="card"
              style={{ padding: '18px 14px' }}
            >
              <s.icon size={16} color={s.color} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 900, lineHeight: 1 }}>{loading ? '—' : s.value}</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase' }}>{s.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Finance Summary */}
        <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: 16 }}>FINANCE OVERVIEW</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <TrendingUp size={14} color="#22c55e" />
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#22c55e' }}>INCOME</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>₹{loading ? '—' : totalIncome.toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <TrendingDown size={14} color="#EF4444" />
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#EF4444' }}>EXPENSES</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>₹{loading ? '—' : totalExpense.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>NET BALANCE</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: balance >= 0 ? '#22c55e' : '#EF4444' }}>
              {balance >= 0 ? '+' : '-'}₹{loading ? '—' : Math.abs(balance).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Command Center */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: 14 }}>COMMAND CENTER</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { icon: CheckCircle2, label: 'Tasks', color: 'var(--accent)', path: '/tasks', badge: todoCount > 0 ? todoCount : null },
              { icon: DollarSign, label: 'Finance', color: '#FCD34D', path: '/expenses', badge: null },
              { icon: Folder, label: 'Vault', color: '#3B82F6', path: '/files', badge: fileCount > 0 ? fileCount : null },
              { icon: Target, label: 'Profile', color: '#A855F7', path: '/profile', badge: null },
            ].map((m, i) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={i} whileTap={{ scale: 0.94 }}
                  onClick={() => navigate(m.path)}
                  style={{ 
                    aspectRatio: '1', borderRadius: '18px', background: 'var(--bg-card)',
                    border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: `${m.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color }}>
                    <Icon size={18} />
                  </div>
                  <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)' }}>{m.label}</span>
                  {m.badge !== null && m.badge !== undefined && (
                    <div style={{ position: 'absolute', top: 8, right: 8, minWidth: 18, height: 18, borderRadius: 9, background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 900, color: '#000', padding: '0 4px' }}>
                      {m.badge}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1.5px' }}>LATEST ACTIVITY</div>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 800 }}>LIVE</span>
          </div>

          <div className="flex flex-col gap-3">
            {loading && (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Loading activity...
              </div>
            )}
            {!loading && activities.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)' }}>
                ✨ Nothing done yet today. Go get it! 🚀
              </div>
            )}
            {!loading && activities.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate(item.path)}
                className="card"
                style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '14px', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{item.sub}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>{timeAgo(item.date)}</span>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>

      <BottomNav />
    </div>
  );
}
