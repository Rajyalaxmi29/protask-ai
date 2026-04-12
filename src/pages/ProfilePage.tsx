import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, 
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  User, Mail, Shield, Bell, 
  Settings, LogOut, Camera, ChevronRight, 
  Award, Zap, CheckCircle2, Menu,
  Search, TrendingUp, Download, 
  ChevronDown, Flame, Activity, 
  Target, BarChart2
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { persistentData } from '../lib/persistentData';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);

  // Profile stats
  const [userName] = useState('Raji');
  const [totalTasksDone, setTotalTasksDone] = useState(0);
  const [growthPct, setGrowthPct] = useState(0);
  const [disciplineScore, setDisciplineScore] = useState(0);

  // Charts
  const [radarData, setRadarData] = useState<any[]>([]);
  const [productivityData, setProductivityData] = useState<any[]>([]);
  const [trajectoryData, setTrajectoryData] = useState<any[]>([]);
  const [habitGrid, setHabitGrid] = useState<number[]>([]);

  // Habit lists
  const [goodHabits, setGoodHabits] = useState<any[]>([]);
  const [badHabits, setBadHabits] = useState<any[]>([]);

  // Settings state
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [notifTasks, setNotifTasks] = useState(true);
  const [notifFinance, setNotifFinance] = useState(false);
  const [notifHabits, setNotifHabits] = useState(true);
  const [emailAddr, setEmailAddr] = useState('');
  const [darkMode] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [compactView, setCompactView] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const userId = await persistentData.getUserId();
      if (!userId) return;

      const [tasks, habits, transactions] = await Promise.all([
        persistentData.get<any>('tasks', userId),
        persistentData.get<any>('habits', userId),
        persistentData.get<any>('transactions', userId),
      ]);

      // ── Achievement badges ──────────────────────────────
      const done = tasks.filter((t: any) => t.done);
      setTotalTasksDone(done.length);
      const growth = tasks.length > 0 ? Math.round((done.length / tasks.length) * 100) : 0;
      setGrowthPct(growth);

      // ── Winning / Avoid habits ──────────────────────────
      const winning = habits.filter((h: any) => h.habit_type === 'winning');
      const avoid   = habits.filter((h: any) => h.habit_type === 'avoid');

      const goodList = winning.map((h: any) => ({
        task: h.title,
        completion: winning.length > 0
          ? Math.round(habits.filter((x: any) => x.habit_type === 'winning' && x.done).length / winning.length * 100)
          : 0,
      }));

      // per-habit completion (each habit gets its actual done state as %)
      const goodListDetailed = winning.map((h: any) => ({ task: h.title, completion: h.done ? 100 : 0 }));
      const badListDetailed  = avoid.map((h: any) => ({ task: h.title, violation: h.done ? 100 : 0 }));
      setGoodHabits(goodListDetailed);
      setBadHabits(badListDetailed);

      // ── Discipline Score (0-100) ────────────────────────
      const habitsDone  = habits.filter((h: any) => h.done).length;
      const habitsTotal = habits.length;
      const habScore    = habitsTotal > 0 ? (habitsDone / habitsTotal) * 50 : 0;
      const taskScore   = tasks.length > 0 ? (done.length / tasks.length) * 50 : 0;
      const disc        = Math.round(habScore + taskScore);
      setDisciplineScore(disc);

      // ── Radar: 5 dimensions ────────────────────────────
      const consistency = habitsTotal > 0 ? Math.round((habitsDone / habitsTotal) * 100) : 0;
      const focus = tasks.length > 0
        ? Math.round((tasks.filter((t: any) => t.priority === 'High' && t.done).length / Math.max(tasks.filter((t: any) => t.priority === 'High').length, 1)) * 100)
        : 0;

      const daysWithHabits = new Set(
        habits.filter((h: any) => h.done && h.created_at)
          .map((h: any) => new Date(h.created_at).toDateString())
      ).size;
      const streak = Math.min(daysWithHabits * 20, 100);

      const discipline = disc;

      const weekend = habits.filter((h: any) => {
        if (!h.created_at) return false;
        const d = new Date(h.created_at).getDay();
        return (d === 0 || d === 6) && h.done;
      }).length;
      const weekendPct = Math.min(weekend * 25, 100);

      setRadarData([
        { subject: 'Consistency', A: consistency },
        { subject: 'Focus',       A: focus },
        { subject: 'Streak',      A: streak },
        { subject: 'Discipline',  A: discipline },
        { subject: 'Weekend',     A: weekendPct },
      ]);

      // ── Productivity Pulse: tasks done each day of week ─
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayCounts: Record<string, number> = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
      done.forEach((t: any) => {
        if (t.created_at) {
          const d = days[new Date(t.created_at).getDay()];
          dayCounts[d]++;
        }
      });
      const maxDayCount = Math.max(...Object.values(dayCounts), 1);
      setProductivityData(days.map(d => ({
        name: d,
        score: Math.round((dayCounts[d] / maxDayCount) * 100)
      })));

      // ── Growth Trajectory: transactions net by day (last 7) ──
      const last7: Record<string, number> = {};
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        last7[d.toDateString()] = 0;
      }
      transactions.forEach((t: any) => {
        const d = new Date(t.date || t.created_at).toDateString();
        if (d in last7) {
          last7[d] += t.type === 'income' ? Number(t.amount) : -Number(t.amount);
        }
      });
      const tDays = Object.keys(last7);
      setTrajectoryData(tDays.map((d, i) => ({ name: `D${i + 1}`, val: last7[d] })));

      // ── Habit Track Grid (63 cells = 9 weeks × 7 days) ────
      // A day is "active" if the user completed a task, checked off a habit, or logged a transaction
      // Count activity per day for intensity-based colouring
      const activityCount: Record<string, number> = {};

      const addActivity = (dateStr: string) => {
        const key = new Date(dateStr).toDateString();
        activityCount[key] = (activityCount[key] || 0) + 1;
      };

      tasks.filter((t: any) => t.done && t.created_at).forEach((t: any) => addActivity(t.created_at));
      habits.filter((h: any) => h.done && h.created_at).forEach((h: any) => addActivity(h.created_at));
      transactions.filter((t: any) => t.created_at || t.date).forEach((t: any) => addActivity(t.created_at || t.date));

      const grid: number[] = [];
      for (let i = 62; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        grid.push(activityCount[d.toDateString()] || 0);
      }
      setHabitGrid(grid);


    } catch (e) {
      console.error('Profile load error', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="page" style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading profile...</div>
    </div>
  );

  const circumference = 2 * Math.PI * 95;

  return (
    <div className="page" style={{ background: '#000' }}>
      {/* Header */}
      <header style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '20px', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.85)', 
        backdropFilter: 'blur(10px)', zIndex: 100 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Menu size={20} />
          <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>Identity Core</span>
        </div>
        <div style={{ display: 'flex', gap: 20, color: 'var(--text-secondary)' }}>
          <Search size={18} />
          <Settings size={18} />
        </div>
      </header>

      <div className="page-content" style={{ padding: '20px' }}>

        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '32px 0' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 120, height: 120, borderRadius: '40px', background: 'var(--bg-card)', border: '2px solid var(--accent)', padding: 4, boxShadow: '0 0 20px var(--accent-glow)' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '36px', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={60} color="var(--accent)" />
              </div>
            </div>
            <button style={{ position: 'absolute', bottom: -5, right: -5, width: 36, height: 36, borderRadius: '12px', background: 'var(--accent)', border: 'none', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Camera size={18} />
            </button>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: 24, marginBottom: 4 }}>{userName}</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>GROWTH MASTER • {disciplineScore >= 80 ? 'ELITE' : disciplineScore >= 50 ? 'PRO' : 'RISING'}</p>
        </div>

        {/* Achievement Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 40 }}>
          {[
            { label: 'Rank', value: disciplineScore >= 80 ? 'Elite' : disciplineScore >= 50 ? 'Pro' : 'Rising', icon: Award, color: '#FCD34D' },
            { label: 'Growth', value: `${growthPct}%`, icon: Zap, color: 'var(--accent)' },
            { label: 'Tasks', value: `${totalTasksDone}`, icon: CheckCircle2, color: '#3B82F6' },
          ].map((s, i) => (
            <div key={i} className="card" style={{ padding: '20px 10px', textAlign: 'center' }}>
              <s.icon size={20} color={s.color} style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '1rem', fontWeight: 900 }}>{s.value}</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* PERFORMANCE ANALYSIS */}
        <div style={{ marginBottom: 60 }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: 20 }}>PERFORMANCE ANALYSIS</h3>

          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
            {[
              <TrendingUp size={16} color="var(--accent)" />,
              <><span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent)' }}>ALL TIME</span><ChevronDown size={14} color="var(--accent)" /></>,
              <Download size={16} />,
            ].map((el, i) => (
              <div key={i} style={{ padding: '10px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                {el}
              </div>
            ))}
          </div>

          {/* Discipline Radar */}
          <div className="card" style={{ padding: '24px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <Target color="var(--accent)" size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900 }}>Discipline Radar</h3>
            </div>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }} />
                  <Radar dataKey="A" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Discipline Score Ring */}
          <div className="card" style={{ padding: '32px 24px', textAlign: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
              <Activity color="var(--accent)" size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900 }}>Daily Discipline Score</h3>
            </div>
            <div style={{ position: 'relative', width: 220, height: 220, margin: '0 auto' }}>
              <svg width="220" height="220" viewBox="0 0 220 220">
                <circle cx="110" cy="110" r="95" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="18" />
                <circle
                  cx="110" cy="110" r="95" fill="none" stroke="var(--accent)" strokeWidth="18"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - disciplineScore / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 110 110)"
                  style={{ filter: 'drop-shadow(0 0 10px var(--accent-glow))', transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '4rem', fontWeight: 900, lineHeight: 1 }}>{disciplineScore}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: 2 }}>SCORE</span>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 24 }}>
              Based on your task completion ({growthPct}%) and habit tracking.
            </p>
          </div>

          {/* Productivity Pulse */}
          <div className="card" style={{ padding: '24px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Zap color="var(--accent)" size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900 }}>Productivity Pulse</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 24 }}>Tasks completed by day of week</p>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <AreaChart data={productivityData}>
                  <defs>
                    <linearGradient id="colorPulseProfile" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <YAxis hide />
                  <Area type="monotone" dataKey="score" stroke="var(--accent)" fill="url(#colorPulseProfile)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Momentum */}
          <div className="card" style={{ padding: '32px 24px', textAlign: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
              <Flame color="#F97316" size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900 }}>Current Momentum</h3>
            </div>
            <Flame size={80} color="#F97316" style={{ opacity: 0.1, margin: '0 auto', display: 'block' }} />
            <div style={{ marginTop: -50 }}>
              <div style={{ fontSize: '4rem', fontWeight: 900 }}>
                {habitGrid.filter(Boolean).length}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 2 }}>DAYS ACTIVE</div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 20 }}>
              Keep the flame alive by completing at least one habit daily!
            </p>
          </div>

          {/* Finance Trajectory */}
          <div className="card" style={{ padding: '24px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <TrendingUp color="var(--accent)" size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900 }}>Finance Trajectory</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>Net flow over last 7 days</p>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={trajectoryData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <YAxis hide />
                  <Bar dataKey="val" radius={[8, 8, 0, 0]}>
                    {trajectoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.val >= 0 ? 'rgba(0,255,178,0.5)' : 'rgba(239,68,68,0.5)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Habit Track Grid */}
          <div className="card" style={{ padding: '24px', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: 8 }}>Habit Track Grid</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              Activity over the last 9 weeks — tasks, habits & transactions
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 5 }}>
              {habitGrid.map((count, i) => {
                // Intensity: 0 = none, 1-2 = light, 3-4 = medium, 5+ = full
                const opacity = count === 0 ? 0 : count <= 2 ? 0.3 : count <= 4 ? 0.6 : 1;
                const isToday = i === habitGrid.length - 1;
                return (
                  <div
                    key={i}
                    title={count > 0 ? `${count} action${count > 1 ? 's' : ''}` : 'No activity'}
                    style={{ 
                      aspectRatio: '1', borderRadius: 5,
                      background: count > 0 ? `rgba(0,255,178,${opacity})` : 'rgba(255,255,255,0.05)',
                      border: isToday ? '1px solid var(--accent)' : '1px solid transparent',
                      boxShadow: count > 4 ? '0 0 6px var(--accent-glow)' : 'none',
                      transition: 'background 0.3s ease'
                    }}
                  />
                );
              })}
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 12 }}>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Less</span>
              {[0.05, 0.3, 0.6, 1].map((op, i) => (
                <div key={i} style={{ width: 12, height: 12, borderRadius: 3, background: op < 0.1 ? 'rgba(255,255,255,0.05)' : `rgba(0,255,178,${op})` }} />
              ))}
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>More</span>
            </div>
          </div>

          {/* Good Habits */}
          {goodHabits.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid var(--border)', background: 'rgba(0,255,178,0.02)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--accent)' }}>Good Habits Statistics</h3>
              </div>
              <div style={{ padding: '20px' }}>
                <div className="flex flex-col gap-5">
                  {goodHabits.map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 700 }}>{h.task}</span>
                      <div style={{ width: 100, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                        <div style={{ width: `${h.completion}%`, height: '100%', background: 'var(--accent)', borderRadius: 3, transition: 'width 0.6s ease' }} />
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 900, minWidth: 40, textAlign: 'right' }}>{h.completion}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bad Habits */}
          {badHabits.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid var(--border)', background: 'rgba(239,68,68,0.02)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#EF4444' }}>Bad Habits Statistics</h3>
              </div>
              <div style={{ padding: '20px' }}>
                <div className="flex flex-col gap-5">
                  {badHabits.map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 700 }}>{h.task}</span>
                      <div style={{ width: 100, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                        <div style={{ width: `${h.violation}%`, height: '100%', background: '#EF4444', borderRadius: 3, transition: 'width 0.6s ease' }} />
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 900, minWidth: 40, textAlign: 'right' }}>{h.violation}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {goodHabits.length === 0 && badHabits.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px dashed var(--border)', borderRadius: 16 }}>
              Add habits in the Tracker tab to see statistics here.
            </div>
          )}
        </div>

        {/* Settings */}
        <div style={{ marginBottom: 100 }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: 20 }}>SYSTEM PREFERENCES</h3>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Security & Privacy', icon: Shield, color: 'var(--accent)', key: 'security' },
              { label: 'Notification Pulse',  icon: Bell,   color: '#6C4CF1', key: 'notifications' },
              { label: 'Email Configuration', icon: Mail,   color: '#06B6D4', key: 'email' },
              { label: 'OS Settings',         icon: Settings, color: '#F59E0B', key: 'os' },
            ].map((item, i) => (
              <motion.div
                key={i} whileTap={{ scale: 0.98 }}
                className="card"
                onClick={() => setActivePanel(item.key)}
                style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
              >
                <div style={{ width: 44, height: 44, borderRadius: '14px', background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                  <item.icon size={20} />
                </div>
                <div style={{ flex: 1, fontSize: '0.95rem', fontWeight: 800 }}>{item.label}</div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </motion.div>
            ))}
          </div>

          <button style={{ 
            marginTop: 32, width: '100%', height: 58, borderRadius: '20px',
            background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)',
            color: '#EF4444', fontSize: '1rem', fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer'
          }}>
            <LogOut size={20} /> DISCONNECT CORE
          </button>
        </div>

      </div>

      <BottomNav />

      {/* ── Settings Panels ── */}
      <AnimatePresence>
        {activePanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActivePanel(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 300 }}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 301, background: '#0d0d0d', borderTop: '1px solid var(--border)', borderRadius: '28px 28px 0 0', padding: '20px 24px 80px', maxHeight: '80vh', overflowY: 'auto' }}
            >
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 24px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 900 }}>
                  {activePanel === 'security' && 'Security & Privacy'}
                  {activePanel === 'notifications' && 'Notification Pulse'}
                  {activePanel === 'email' && 'Email Configuration'}
                  {activePanel === 'os' && 'OS Settings'}
                </h2>
                <button onClick={() => setActivePanel(null)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <ChevronRight size={16} color="var(--text-muted)" style={{ transform: 'rotate(90deg)' }} />
                </button>
              </div>

              {/* Security Panel */}
              {activePanel === 'security' && (
                <div className="flex flex-col gap-4">
                  {[{ label: 'Two-Factor Authentication', sub: 'Adds an extra layer of security', on: true },
                    { label: 'Biometric Login', sub: 'Use fingerprint or Face ID', on: false },
                    { label: 'Auto Lock', sub: 'Lock app after 5 minutes idle', on: true },
                    { label: 'Data Encryption', sub: 'All data encrypted at rest', on: true },
                  ].map((item, i) => (
                    <div key={i} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{item.label}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>{item.sub}</div>
                      </div>
                      <div style={{ width: 44, height: 24, borderRadius: 12, background: item.on ? 'var(--accent)' : 'var(--bg-input)', position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0 }}>
                        <div style={{ position: 'absolute', top: 3, left: item.on ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                      </div>
                    </div>
                  ))}
                  <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#EF4444' }}>Delete Account</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>Permanently remove all data</div>
                    </div>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </div>
                </div>
              )}

              {/* Notifications Panel */}
              {activePanel === 'notifications' && (
                <div className="flex flex-col gap-4">
                  {[
                    { label: 'All Notifications', sub: 'Master switch for all alerts', val: notifEnabled, set: setNotifEnabled },
                    { label: 'Task Reminders', sub: 'Get notified about pending tasks', val: notifTasks, set: setNotifTasks },
                    { label: 'Finance Alerts', sub: 'Budget limits and new transactions', val: notifFinance, set: setNotifFinance },
                    { label: 'Habit Check-ins', sub: 'Daily habit completion reminders', val: notifHabits, set: setNotifHabits },
                  ].map((item, i) => (
                    <div key={i} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{item.label}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>{item.sub}</div>
                      </div>
                      <div
                        onClick={() => item.set(!item.val)}
                        style={{ width: 44, height: 24, borderRadius: 12, background: item.val ? '#6C4CF1' : 'var(--bg-input)', position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0 }}
                      >
                        <div style={{ position: 'absolute', top: 3, left: item.val ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Email Panel */}
              {activePanel === 'email' && (
                <div className="flex flex-col gap-4">
                  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
                    <Mail size={16} color="#06B6D4" />
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={emailAddr}
                      onChange={e => setEmailAddr(e.target.value)}
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}
                    />
                  </div>
                  {[{ label: 'Weekly Digest', sub: 'Summary of your weekly performance', on: true },
                    { label: 'Finance Reports', sub: 'Monthly expense breakdown', on: false },
                    { label: 'Habit Insights', sub: 'Personalized habit analytics email', on: true },
                  ].map((item, i) => (
                    <div key={i} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{item.label}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>{item.sub}</div>
                      </div>
                      <div style={{ width: 44, height: 24, borderRadius: 12, background: item.on ? '#06B6D4' : 'var(--bg-input)', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                        <div style={{ position: 'absolute', top: 3, left: item.on ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                      </div>
                    </div>
                  ))}
                  <motion.button whileTap={{ scale: 0.97 }} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#06B6D4', border: 'none', color: '#000', fontWeight: 900, fontSize: '0.95rem', cursor: 'pointer' }}>
                    Save Email Settings
                  </motion.button>
                </div>
              )}

              {/* OS Panel */}
              {activePanel === 'os' && (
                <div className="flex flex-col gap-4">
                  {[
                    { label: 'Dark Mode', sub: 'Always-on dark theme', val: darkMode, color: 'var(--accent)', readonly: true },
                    { label: 'Haptic Feedback', sub: 'Vibration on interactions', val: haptics, color: '#F59E0B', set: setHaptics },
                    { label: 'Compact View', sub: 'Denser layout for more content', val: compactView, color: '#3B82F6', set: setCompactView },
                  ].map((item: any, i) => (
                    <div key={i} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{item.label}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>{item.sub}</div>
                      </div>
                      <div
                        onClick={() => !item.readonly && item.set && item.set(!item.val)}
                        style={{ width: 44, height: 24, borderRadius: 12, background: item.val ? item.color : 'var(--bg-input)', position: 'relative', transition: 'background 0.2s', cursor: item.readonly ? 'default' : 'pointer', flexShrink: 0 }}
                      >
                        <div style={{ position: 'absolute', top: 3, left: item.val ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                      </div>
                    </div>
                  ))}
                  <div className="card" style={{ padding: '18px 20px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '1px' }}>APP VERSION</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>ProTask v2.0.0</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>Build 2026.04 · Up to date ✓</div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => persistentData.clearAllCache()}
                    style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#EF4444', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer' }}
                  >
                    Clear Cache & Reset
                  </motion.button>
                </div>
              )}

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
