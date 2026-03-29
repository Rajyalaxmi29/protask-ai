import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useAnimationFrame } from 'motion/react';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import logoSrc from '../assets/logo.png';

// ─── Auth Logic (unchanged) ───────────────────────────────────────
const EASE: [number, number, number, number] = [0.76, 0, 0.24, 1];

// ─── Animated right-panel canvas ──────────────────────────────────
function AnimatedPanel({ mode }: { mode: 'login' | 'register' }) {
  const accentA = mode === 'login' ? '#6366f1' : '#a855f7';
  const accentB = mode === 'login' ? '#06b6d4' : '#ec4899';

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [ringPos, setRingPos] = React.useState({ x: 50, y: 50 }); // % of container
  const targetRef = React.useRef({ x: 50, y: 50 });
  const currentRef = React.useRef({ x: 50, y: 50 });
  const rafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      targetRef.current = {
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      };
    };
    container.addEventListener('mousemove', onMove);

    // Lerp loop
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const loop = () => {
      currentRef.current.x = lerp(currentRef.current.x, targetRef.current.x, 0.06);
      currentRef.current.y = lerp(currentRef.current.y, targetRef.current.y, 0.06);
      setRingPos({ x: currentRef.current.x, y: currentRef.current.y });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      container.removeEventListener('mousemove', onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const orbs = [
    { size: 320, x: '20%', y: '15%', color: accentA, blur: 90, opacity: 0.22, dur: 8 },
    { size: 240, x: '65%', y: '55%', color: accentB, blur: 80, opacity: 0.18, dur: 10 },
    { size: 180, x: '40%', y: '75%', color: accentA, blur: 60, opacity: 0.15, dur: 7 },
    { size: 120, x: '80%', y: '20%', color: '#f59e0b', blur: 50, opacity: 0.12, dur: 12 },
  ];

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{ background: '#04040e' }}>

      {/* Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Orbs */}
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: orb.size, height: orb.size,
            left: orb.x, top: orb.y,
            transform: 'translate(-50%, -50%)',
            background: orb.color,
            filter: `blur(${orb.blur}px)`,
            opacity: orb.opacity,
          }}
          animate={{ x: [0, 30, -20, 0], y: [0, -25, 15, 0], scale: [1, 1.15, 0.95, 1] }}
          transition={{ duration: orb.dur, repeat: Infinity, ease: 'easeInOut', delay: i * 1.2 }}
        />
      ))}

      {/* Floating particles */}
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div
          key={`p${i}`}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 3 + 1, height: Math.random() * 3 + 1,
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            background: i % 2 === 0 ? accentA : accentB,
            boxShadow: `0 0 8px ${i % 2 === 0 ? accentA : accentB}`,
          }}
          animate={{ y: [0, -60, 0], opacity: [0, 0.7, 0], scale: [0.5, 1.3, 0.5] }}
          transition={{ duration: 5 + Math.random() * 8, repeat: Infinity, delay: Math.random() * 5, ease: 'easeInOut' }}
        />
      ))}

      {/* Cursor-tracking rings */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${ringPos.x}%`,
          top: `${ringPos.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Outer ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 260, height: 260,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            border: `1.5px solid ${accentA}`,
            boxShadow: `0 0 40px ${accentA}40, inset 0 0 40px ${accentA}10`,
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.8, 0.4], rotate: [0, 360] }}
          transition={{
            scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
            opacity: { duration: 4, repeat: Infinity },
            rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
          }}
        />
        {/* Inner ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 160, height: 160,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            border: `1px solid ${accentB}`,
            boxShadow: `0 0 20px ${accentB}40`,
          }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.7, 0.3], rotate: [0, -360] }}
          transition={{
            scale: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 },
            opacity: { duration: 5, repeat: Infinity, delay: 1 },
            rotate: { duration: 14, repeat: Infinity, ease: 'linear' },
          }}
        />
      </div>

      {/* Mode label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] font-mono tracking-[0.4em] uppercase opacity-40 text-white">
            {mode === 'login' ? 'Welcome back' : 'Join ProTask AI'}
          </span>
          <h2
            className="text-4xl font-serif font-bold text-center"
            style={{
              backgroundImage: `linear-gradient(135deg, ${accentA}, ${accentB})`,
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent', color: 'transparent',
            }}
          >
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Field ─────────────────────────────────────────────────────────
function Field({ icon: Icon, label, rightSlot, ...props }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <motion.div
      className="flex flex-col gap-1.5"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <label className="text-[10px] font-mono tracking-[0.2em] uppercase"
        style={{ color: focused ? '#8b5cf6' : 'rgba(255,255,255,0.3)' }}>
        {label}
      </label>
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: focused ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.08)',
          boxShadow: focused ? '0 0 20px rgba(139,92,246,0.15)' : 'none',
        }}
      >
        <Icon size={15} style={{ color: focused ? '#8b5cf6' : 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
        <input
          {...props}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent text-white text-sm placeholder-white/20 outline-none"
        />
        {rightSlot}
      </div>
    </motion.div>
  );
}

// ─── Submit button ─────────────────────────────────────────────────
function SubmitBtn({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="relative w-full py-3.5 rounded-xl text-sm font-bold tracking-[0.12em] uppercase text-white overflow-hidden disabled:opacity-50"
      style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #6366f1 100%)', boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}
    >
      <span
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
        style={{ animation: 'shimmer 2s infinite' }}
      />
      {loading ? 'Processing…' : children}
    </motion.button>
  );
}

// ─── Main Component ────────────────────────────────────────────────
export default function Login({ initialMode = 'login' }: { initialMode?: 'login' | 'register' }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // Login state
  const [lEmail, setLEmail] = useState('');
  const [lPass, setLPass]   = useState('');
  const [showLP, setShowLP] = useState(false);

  // Register state
  const [rName, setRName]   = useState('');
  const [rEmail, setREmail] = useState('');
  const [rPass, setRPass]   = useState('');
  const [rConf, setRConf]   = useState('');
  const [showRP, setShowRP] = useState(false);
  const [showRC, setShowRC] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email: lEmail, password: lPass });
    setBusy(false);
    if (error) return setErr(error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message);
    navigate('/dashboard');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rPass !== rConf) return setErr('Passwords do not match.');
    if (rPass.length < 6) return setErr('Password must be at least 6 characters.');
    setBusy(true); setErr('');
    const { data, error } = await supabase.auth.signUp({ email: rEmail, password: rPass, options: { data: { full_name: rName.trim() } } });
    if (error) { setBusy(false); return setErr(error.message); }
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, full_name: rName.trim(), email: rEmail });
      setMode('login'); setErr('');
    }
    setBusy(false);
  };

  const switchMode = (next: 'login' | 'register') => { if (next !== mode) { setErr(''); setMode(next); } };

  return (
    <div
      className="min-h-screen w-full flex font-sans overflow-hidden"
      style={{ background: '#04040e' }}
    >
      {/* shimmer keyframe */}
      <style>{`@keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }`}</style>

      {/* ── LEFT: Form Panel ── */}
      <div className="relative flex-1 flex flex-col justify-center px-8 sm:px-14 lg:px-20 py-12 z-10 min-h-screen">

        {/* Back to home */}
        <Link
          to="/"
          className="absolute top-8 left-8 flex items-center gap-2 text-xs font-mono tracking-wider opacity-40 hover:opacity-70 transition-opacity"
          style={{ color: 'var(--foreground, #f4f0e5)' }}
        >
          <ArrowLeft size={13} /> Home
        </Link>

        {/* Logo */}
        <div className="mb-10">
          <img src={logoSrc} alt="ProTask AI" style={{ height: 36, width: 'auto' }} />
        </div>

        {/* Mode toggler */}
        <div className="flex gap-1 mb-10 p-1 rounded-full w-fit" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {(['login', 'register'] as const).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className="px-5 py-2 rounded-full text-xs font-mono tracking-widest uppercase transition-all duration-300"
              style={{
                background: mode === m ? 'rgba(139,92,246,0.3)' : 'transparent',
                color: mode === m ? '#fff' : 'rgba(255,255,255,0.35)',
                boxShadow: mode === m ? '0 0 16px rgba(139,92,246,0.3)' : 'none',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Form */}
        <AnimatePresence mode="wait">
          {mode === 'login' ? (
            <motion.form
              key="login"
              onSubmit={handleLogin}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="flex flex-col gap-5 max-w-sm"
            >
              <div>
                <h1 className="text-3xl font-serif font-bold text-white mb-1">Welcome back</h1>
                <p className="text-sm opacity-40 text-white">Sign in to your ProTask AI workspace.</p>
              </div>

              <div className="flex flex-col gap-4 mt-2">
                <Field icon={Mail} label="Email" type="email" required placeholder="you@example.com"
                  value={lEmail} onChange={(e: any) => setLEmail(e.target.value)} />
                <Field icon={Lock} label="Password" type={showLP ? 'text' : 'password'} required placeholder="••••••••"
                  value={lPass} onChange={(e: any) => setLPass(e.target.value)}
                  rightSlot={
                    <button type="button" onClick={() => setShowLP(v => !v)} className="opacity-30 hover:opacity-70">
                      {showLP ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  }
                />
              </div>

              {err && (
                <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{err}</motion.p>
              )}

              <SubmitBtn loading={busy}>Sign In</SubmitBtn>

              <p className="text-xs text-center opacity-30 text-white">
                Don't have an account?{' '}
                <button type="button" onClick={() => switchMode('register')}
                  className="text-[#8b5cf6] font-semibold hover:opacity-80">Sign Up</button>
              </p>
            </motion.form>
          ) : (
            <motion.form
              key="register"
              onSubmit={handleRegister}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="flex flex-col gap-5 max-w-sm"
            >
              <div>
                <h1 className="text-3xl font-serif font-bold text-white mb-1">Create account</h1>
                <p className="text-sm opacity-40 text-white">Join your AI-powered workspace today.</p>
              </div>

              <div className="flex flex-col gap-4 mt-2">
                <Field icon={User} label="Full Name" type="text" required placeholder="Your full name"
                  value={rName} onChange={(e: any) => setRName(e.target.value)} />
                <Field icon={Mail} label="Email" type="email" required placeholder="you@example.com"
                  value={rEmail} onChange={(e: any) => setREmail(e.target.value)} />
                <Field icon={Lock} label="Password" type={showRP ? 'text' : 'password'} required placeholder="Min 6 characters"
                  value={rPass} onChange={(e: any) => setRPass(e.target.value)}
                  rightSlot={
                    <button type="button" onClick={() => setShowRP(v => !v)} className="opacity-30 hover:opacity-70">
                      {showRP ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  }
                />
                <Field icon={Lock} label="Confirm Password" type={showRC ? 'text' : 'password'} required placeholder="Repeat password"
                  value={rConf} onChange={(e: any) => setRConf(e.target.value)}
                  rightSlot={
                    <button type="button" onClick={() => setShowRC(v => !v)} className="opacity-30 hover:opacity-70">
                      {showRC ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  }
                />
              </div>

              {err && (
                <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{err}</motion.p>
              )}

              <SubmitBtn loading={busy}>Create Account</SubmitBtn>

              <p className="text-xs text-center opacity-30 text-white">
                Already have an account?{' '}
                <button type="button" onClick={() => switchMode('login')}
                  className="text-[#8b5cf6] font-semibold hover:opacity-80">Sign In</button>
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* ── RIGHT: Animated Visual Panel (desktop only) ── */}
      <div className="hidden lg:block relative w-[52%] min-h-screen overflow-hidden">
        {/* Smooth mode-change transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="absolute inset-0"
          >
            <AnimatedPanel mode={mode} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}