import React from 'react';
import { motion } from 'framer-motion';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, 
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  TrendingUp, Download, Search, Filter, 
  ChevronDown, Flame, CheckCircle2, AlertCircle,
  Activity, Target, Zap, Sparkles, Menu, BarChart2, Edit3, Trash2
} from 'lucide-react';
import BottomNav from '../components/BottomNav';

const radarData = [
  { subject: 'Consistency', A: 85 },
  { subject: 'Focus', A: 90 },
  { subject: 'Streak', A: 65 },
  { subject: 'Discipline', A: 88 },
  { subject: 'Weekend', A: 70 },
];

const productivityData = [
  { name: 'Mon', score: 75 },
  { name: 'Tue', score: 50 },
  { name: 'Wed', score: 92 },
  { name: 'Thu', score: 85 },
  { name: 'Fri', score: 84 },
  { name: 'Sat', score: 82 },
  { name: 'Sun', score: 78 },
];

const trajectoryData = [
  { name: 'D1', val: 30 },
  { name: 'D2', val: 45 },
  { name: 'D3', val: 25 },
  { name: 'D4', val: 40 },
  { name: 'D5', val: 15 },
  { name: 'D6', val: 35 },
  { name: 'D7', val: 10 },
];

const goodHabits = [
  { task: 'Sleep', completion: 100 },
  { task: 'Posting content', completion: 100 },
  { task: 'Startup marketing', completion: 100 },
  { task: 'Exercise', completion: 100 },
  { task: 'Finance and Stock', completion: 100 },
  { task: 'Learn New Technology', completion: 86 },
  { task: 'Read Book', completion: 86 },
  { task: 'Other Need', completion: 86 },
  { task: 'Startup', completion: 71 },
  { task: 'Learn About Startup', completion: 67 },
  { task: 'DSA', completion: 29 },
  { task: 'Webdev', completion: 0 },
];

const badHabits = [
  { task: 'Time waste', violation: 29 },
  { task: 'Play Game', violation: 14 },
  { task: 'Reels Scroll', violation: 14 },
  { task: 'Extra Content', violation: 0 },
  { task: 'Extra Sleep', violation: 0 },
];

export default function AnalysisPage() {
  return (
    <div className="page" style={{ background: '#000' }}>
      {/* Top Header */}
      <header style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '20px', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.8)', 
        backdropFilter: 'blur(10px)', zIndex: 100 
      }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Menu size={20} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
               <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>CH7MAR</span>
            </div>
         </div>
         <div style={{ display: 'flex', gap: 20, color: 'var(--text-secondary)' }}>
            <BarChart2 size={18} />
            <Edit3 size={18} />
            <Trash2 size={18} />
         </div>
      </header>
      
      <div className="page-content" style={{ padding: '20px' }}>
        
        {/* Top Control Bar Filter */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
           <div style={{ padding: '10px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} color="var(--accent)" />
           </div>
           
           <div style={{ padding: '10px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent)' }}>CH7MAR...</span>
              <ChevronDown size={14} color="var(--accent)" />
           </div>

           <div style={{ padding: '10px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>All Time</span>
              <ChevronDown size={14} color="var(--text-muted)" />
           </div>

           <div style={{ padding: '10px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Download size={16} />
           </div>
        </div>

        {/* Top Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
           <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent)', marginBottom: 12 }}>
                 <CheckCircle2 size={16} />
                 <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>Tasks Done</span>
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>62</div>
           </div>

           <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent)', marginBottom: 12 }}>
                 <Zap size={16} />
                 <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>Avg Score</span>
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>78</div>
           </div>
        </div>

        {/* Discipline Radar */}
        <div className="card" style={{ padding: '24px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
              <Target color="var(--accent)" size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900 }}>Discipline Radar</h3>
           </div>
           <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                 <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }} />
                    <Radar dataKey="A" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} />
                 </RadarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Productivity Pulse */}
        <div className="card" style={{ padding: '24px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Zap color="var(--accent)" size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900 }}>Productivity Pulse</h3>
           </div>
           <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 32 }}>Your average performance by day of week</p>
           <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={productivityData}>
                    <defs>
                       <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <YAxis hide />
                    <Area type="monotone" dataKey="score" stroke="var(--accent)" fill="url(#colorPulse)" strokeWidth={3} />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Daily Discipline Score */}
        <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
              <Activity color="var(--accent)" size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900 }}>Daily Discipline Score</h3>
           </div>
           <div style={{ position: 'relative', width: 220, height: 220, margin: '0 auto' }}>
              <svg width="220" height="220" viewBox="0 0 220 220">
                 <circle cx="110" cy="110" r="95" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="18" />
                 <circle 
                   cx="110" cy="110" r="95" fill="none" stroke="var(--accent)" strokeWidth="18" 
                   strokeDasharray="596" strokeDashoffset={596 * (1 - 0.78)} strokeLinecap="round"
                   transform="rotate(-90 110 110)"
                   style={{ filter: 'drop-shadow(0 0 10px var(--accent-glow))' }}
                 />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                 <span style={{ fontSize: '4.5rem', fontWeight: 900 }}>78</span>
                 <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: 2 }}>SCORE</span>
              </div>
           </div>
           <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 32 }}>Your overall consistency based on task completion and habits.</p>
        </div>

        {/* Momentum */}
        <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
              <Flame color="#F97316" size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900 }}>Current Momentum</h3>
           </div>
           <Flame size={80} color="#F97316" style={{ opacity: 0.1, margin: '0 auto' }} />
           <div style={{ marginTop: -50 }}>
              <div style={{ fontSize: '4rem', fontWeight: 900 }}>0</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 2 }}>DAY STREAK</div>
           </div>
           <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 24 }}>Keep the flame alive by completing at least one positive habit daily!</p>
        </div>

        {/* Habit Track Grid */}
        <div className="card" style={{ padding: '24px' }}>
           <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: 24 }}>Habit Track Grid</h3>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12 }}>
              {Array.from({ length: 9 * 7 }).map((_, i) => (
                <div key={i} style={{ 
                  aspectRatio: '1', borderRadius: 8, background: Math.random() > 0.3 ? 'var(--accent)' : 'var(--bg-input)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: Math.random() > 0.3 ? 1 : 0.3 
                }}>
                   {Math.random() > 0.3 && <CheckCircle2 size={12} color="#000" />}
                </div>
              ))}
           </div>
        </div>

        {/* Growth Trajectory */}
        <div className="card" style={{ padding: '24px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <TrendingUp color="var(--accent)" size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900 }}>Growth Trajectory</h3>
           </div>
           <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 24 }}>Your performance visualized in 3D space</p>
           <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={trajectoryData}>
                    <Bar dataKey="val" radius={[10, 10, 0, 0]}>
                       {trajectoryData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.val > 20 ? 'rgba(0,255,178,0.3)' : 'rgba(239,68,68,0.3)'} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Good Habits List */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
           <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(0,255,178,0.02)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--accent)' }}>Good Habits Statistics</h3>
           </div>
           <div style={{ padding: '20px' }}>
              <div className="flex flex-col gap-6">
                 {goodHabits.map((h, i) => (
                   <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 700 }}>{h.task}</span>
                      <div style={{ width: 100, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                         <div style={{ width: `${h.completion}%`, height: '100%', background: 'var(--accent)', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 900, minWidth: 40 }}>{h.completion}%</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Bad Habits List */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: 24 }}>
           <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(239,68,68,0.02)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#EF4444' }}>Bad Habits Statistics</h3>
           </div>
           <div style={{ padding: '20px' }}>
              <div className="flex flex-col gap-6">
                 {badHabits.map((h, i) => (
                   <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 700 }}>{h.task}</span>
                      <div style={{ width: 100, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                         <div style={{ width: `${h.violation}%`, height: '100%', background: '#EF4444', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 900, minWidth: 40 }}>{h.violation}%</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>

      </div>

      {/* Floating Sparkle Action */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{ 
          position: 'fixed', bottom: 100, right: 24, 
          width: 50, height: 50, borderRadius: '16px', 
          background: 'rgba(18, 24, 33, 0.8)', border: '1px solid var(--border)', 
          backdropFilter: 'blur(10px)', color: 'var(--accent)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 100 
        }}
      >
         <Sparkles size={24} />
      </motion.button>

      <BottomNav />
    </div>
  );
}
