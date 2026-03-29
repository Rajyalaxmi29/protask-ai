import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, BarChart2, Bell, Shield, ArrowRight } from 'lucide-react';
import LightBeamButton from '../components/LightBeamButton';
import StickyStackCards from '../components/StickyStackCards';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'motion/react';
import logoSrc from '../assets/logo.png';

// ─── Hero Navbar ──────────────────────────────────────────────────
function HeroNavbar() {
  return (
    <div className="relative z-10 w-full">
      <div className="flex items-center justify-between py-5 px-8">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <img src={logoSrc} alt="ProTask AI" style={{ height: 32, width: 'auto' }} />
        </div>

        {/* Center: Nav Anchors */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { label: 'Features',    id: 'features' },
            { label: 'How It Works',id: 'howitworks' },
            { label: 'Showcase',    id: 'showcase' },
            { label: 'Get Started', id: 'getstarted' },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
              className="px-4 py-2 text-sm rounded-full transition-all duration-200 hover:bg-white/5 cursor-pointer"
              style={{ color: 'rgba(244,240,229,0.9)' }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right: Sign Up */}
        <Link
          to="/register"
          className="liquid-glass px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:bg-white/10"
          style={{ color: 'var(--foreground)' }}
        >
          Sign Up
        </Link>
      </div>

      {/* Divider */}
      <div
        className="w-full mt-[3px]"
        style={{
          height: '1px',
          background: 'linear-gradient(to right, transparent, rgba(244,240,229,0.2), transparent)',
        }}
      />
    </div>
  );
}

// ─── Floating particles ────────────────────────────────────────────
function Particles() {
  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 12 + 8,
    delay: Math.random() * 6,
    opacity: Math.random() * 0.4 + 0.1,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: 'rgba(139,92,246,0.7)',
            boxShadow: `0 0 ${p.size * 4}px rgba(139,92,246,0.5)`,
          }}
          animate={{
            y: [0, -60, 0],
            x: [0, Math.random() * 30 - 15, 0],
            opacity: [0, p.opacity, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ─── Animated stats section ────────────────────────────────────────
const STATS = [
  { value: '98%', label: 'Task Completion Rate', icon: Zap,       color: '#6366f1' },
  { value: '3×',  label: 'Productivity Boost',   icon: BarChart2, color: '#a855f7' },
  { value: '12k', label: 'Active Users',          icon: Bell,      color: '#f59e0b' },
  { value: 'SOC2',label: 'Security Certified',    icon: Shield,    color: '#10b981' },
];

function StatsSection() {
  return (
    <section style={{ background: 'var(--background)' }} className="py-24 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
        {STATS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: 'easeOut' }}
              whileHover={{ scale: 1.04, y: -4 }}
              className="liquid-glass rounded-2xl p-6 flex flex-col gap-3 cursor-default"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${stat.color}22` }}
              >
                <Icon size={20} style={{ color: stat.color }} />
              </div>
              <span
                className="text-4xl font-serif font-bold"
                style={{ color: stat.color }}
              >
                {stat.value}
              </span>
              <span className="text-xs font-mono tracking-wider uppercase opacity-50" style={{ color: 'var(--foreground)' }}>
                {stat.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Animated gradient orb divider ────────────────────────────────
function GlowDivider({ accentColor = '#6366f1' }: { accentColor?: string }) {
  return (
    <div className="relative w-full flex justify-center py-4 overflow-hidden">
      <motion.div
        className="rounded-full"
        style={{
          width: 600,
          height: 1,
          background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
        }}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 200,
          height: 60,
          background: accentColor,
          filter: 'blur(50px)',
          opacity: 0.12,
        }}
        animate={{ scaleX: [1, 1.4, 1], opacity: [0.08, 0.18, 0.08] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ─── Typewriter ticker ────────────────────────────────────────────
const WORDS = ['plan smarter', 'track faster', 'budget better', 'stay reminded', 'work with AI'];

function TypewriterTicker() {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = WORDS[idx];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && displayed.length < word.length) {
      timeout = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 65);
    } else if (!deleting && displayed.length === word.length) {
      timeout = setTimeout(() => setDeleting(true), 1600);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(word.slice(0, displayed.length - 1)), 35);
    } else {
      setDeleting(false);
      setIdx(i => (i + 1) % WORDS.length);
    }
    return () => clearTimeout(timeout);
  }, [displayed, deleting, idx]);

  return (
    <section style={{ background: 'var(--background)' }} className="py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-sm font-mono tracking-[0.3em] uppercase opacity-40 mb-6"
          style={{ color: 'var(--foreground)' }}
        >
          Built to help you
        </motion.p>
        <h2
          className="text-[clamp(38px,6vw,88px)] font-serif leading-[1.05] tracking-tight"
          style={{ color: 'var(--foreground)' }}
        >
          Let AI help you{' '}
          <span
            style={{
              backgroundImage: 'linear-gradient(to right, #6366f1, #a855f7)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
            }}
          >
            {displayed}
            <span
              style={{
                display: 'inline-block',
                width: '2px',
                height: '0.85em',
                background: '#a855f7',
                marginLeft: 3,
                verticalAlign: 'middle',
                borderRadius: 2,
              }}
              className="animate-pulse"
            />
          </span>
        </h2>
      </div>
    </section>
  );
}

// ─── Scrolling feature band ────────────────────────────────────────
const FEATURES = [
  '⚡ AI Task Prioritization',
  '📊 Budget Tracking',
  '🔔 Smart Reminders',
  '📁 Secure File Vault',
  '🤖 Gemini AI Chatbot',
  '📈 Progress Analytics',
  '🏷️ Custom Labels',
  '🌐 Real-time Sync',
];

function FeatureBand() {
  const doubled = [...FEATURES, ...FEATURES];
  return (
    <div
      className="relative w-full overflow-hidden py-5"
      style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(255,255,255,0.015)',
      }}
    >
      {/* fade masks */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(to right, var(--background), transparent)', zIndex: 1, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(to left, var(--background), transparent)', zIndex: 1, pointerEvents: 'none' }} />
      <motion.div
        className="flex items-center gap-12 whitespace-nowrap"
        style={{ width: 'max-content' }}
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
      >
        {doubled.map((f, i) => (
          <span
            key={i}
            className="text-sm font-mono tracking-widest opacity-50"
            style={{ color: 'var(--foreground)' }}
          >
            {f}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Final CTA section ─────────────────────────────────────────────
function FinalCTA() {
  return (
    <section style={{ background: 'var(--background)' }} className="py-32 px-6 relative overflow-hidden">
      {/* Background orb */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(40px)',
        }}
      />
      <div className="max-w-2xl mx-auto text-center relative z-10">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-[10px] font-mono tracking-[0.4em] uppercase opacity-40 block mb-6"
          style={{ color: 'var(--foreground)' }}
        >
          Start your journey
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-[clamp(32px,5vw,64px)] font-serif leading-tight tracking-tight mb-6"
          style={{ color: 'var(--foreground)' }}
        >
          Your most productive
          <br />
          workspace awaits
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.55 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-sm md:text-base mb-10 font-light"
          style={{ color: 'var(--foreground)' }}
        >
          Join thousands already using ProTask AI to plan, track, and achieve more
          every single day.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3, type: 'spring', stiffness: 200 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <LightBeamButton
            as={Link}
            to="/register"
            className="px-10 py-4 text-sm font-mono font-bold tracking-[0.15em] uppercase transition-all active:scale-95 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] text-white rounded-2xl"
            gradientColors={['#6366f1', '#a855f7', '#6366f1']}
          >
            Get Started Free
          </LightBeamButton>
          <Link
            to="/login"
            className="flex items-center gap-2 text-sm font-mono tracking-wider opacity-50 hover:opacity-80 transition-opacity"
            style={{ color: 'var(--foreground)' }}
          >
            Sign in instead <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Home Page ────────────────────────────────────────────────────
export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef   = useRef<number | null>(null);

  // Custom JS-controlled fade loop
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const FADE_DURATION = 0.5;

    function tick() {
      if (!video) return;
      const { currentTime, duration } = video;
      if (!duration || isNaN(duration)) { rafRef.current = requestAnimationFrame(tick); return; }
      if (currentTime < FADE_DURATION) {
        video.style.opacity = String(currentTime / FADE_DURATION);
      } else if (currentTime > duration - FADE_DURATION) {
        video.style.opacity = String((duration - currentTime) / FADE_DURATION);
      } else {
        video.style.opacity = '1';
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    function handleEnded() {
      if (!video) return;
      video.style.opacity = '0';
      video.pause();
      setTimeout(() => { video.currentTime = 0; video.play().catch(() => {}); }, 100);
    }

    video.style.opacity = '0';
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', () => { rafRef.current = requestAnimationFrame(tick); });
    video.play().catch(() => {});

    return () => {
      video.removeEventListener('ended', handleEnded);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="relative w-full font-sans" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: '100svh' }}>
        {/* Background video */}
        <video
          ref={videoRef}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_065045_c44942da-53c6-4804-b734-f9e07fc22e08.mp4"
          muted playsInline preload="auto"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0, zIndex: 0 }}
        />

        {/* Floating particles */}
        <Particles />

        {/* Hero content */}
        <div className="relative z-10 flex flex-col" style={{ minHeight: '100svh', overflow: 'visible' }}>
          <HeroNavbar />

          {/* Centered content */}
          <div className="flex-1 flex items-center justify-center relative" style={{ overflow: 'visible' }}>
            {/* Blurred oval */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 984, height: 527, opacity: 0.9, background: 'rgb(3, 7, 18)', filter: 'blur(82px)', pointerEvents: 'none', zIndex: 0 }} />

            {/* Text */}
            <div className="relative z-10 flex flex-col items-start px-8 md:px-16 max-w-7xl w-full">

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, type: 'spring', stiffness: 100 }}
                style={{
                  fontSize: 'clamp(80px, 14vw, 220px)',
                  fontFamily: '"General Sans", ui-sans-serif, system-ui, sans-serif',
                  fontWeight: 400,
                  lineHeight: 1.02,
                  letterSpacing: '-0.024em',
                  margin: 0,
                  color: 'var(--foreground)',
                }}
              >
                <span>ProTask </span>
                <span style={{
                  backgroundImage: 'linear-gradient(to left, #6366f1, #a855f7, #fcd34d)',
                  WebkitBackgroundClip: 'text', backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent', color: 'transparent',
                }}>
                  AI
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 0.8, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                style={{ color: 'var(--hero-sub)', fontSize: '1.125rem', lineHeight: '2rem', maxWidth: '28rem', marginTop: 9 }}
              >
                Your AI-powered workspace to plan,
                <br />
                track, and conquer every task effortlessly.
              </motion.p>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <Link
                  to="/register"
                  className="liquid-glass mt-[25px] inline-flex items-center rounded-full font-medium transition-all duration-200 hover:bg-white/10 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(139,92,246,0.4)]"
                  style={{ paddingLeft: 29, paddingRight: 29, paddingTop: 24, paddingBottom: 24, color: 'var(--foreground)', fontSize: '0.9rem' }}
                >
                  Get Started Free
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FEATURE BAND ─────────────────────────────────────────── */}
      <div id="features"><FeatureBand /></div>

      {/* ── STATS ────────────────────────────────────────────────── */}
      <StatsSection />

      <GlowDivider accentColor="#6366f1" />

      {/* ── TYPEWRITER ───────────────────────────────────────────── */}
      <div id="howitworks"><TypewriterTicker /></div>

      <GlowDivider accentColor="#a855f7" />

      {/* ── STICKY STACK CARDS ───────────────────────────────────── */}
      <div id="showcase"><StickyStackCards /></div>

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <div id="getstarted"><FinalCTA /></div>
    </div>
  );
}
