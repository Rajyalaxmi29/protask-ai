import React from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';

// ─── Card data ────────────────────────────────────────────────────
const CARDS = [
  {
    title: 'Task Prioritization',
    description:
      'Seamlessly organize, filter, and track dependencies with AI-driven categorizations.',
    img: 'https://cdn3d.iconscout.com/3d/premium/thumb/checklist-5381347-4497557.png',
    glow: 'rgba(99,102,241,0.35)',
    accent: '#6366f1',
    bg: 'linear-gradient(135deg, #0b0b1a 0%, #0f0f2a 100%)',
    tag: 'Tasks',
  },
  {
    title: 'Financial Clarity',
    description:
      'Track every expense with dynamic charts and visual breakdowns to stay under your limits.',
    img: 'https://cdn3d.iconscout.com/3d/premium/thumb/saving-money-5381348-4497558.png',
    glow: 'rgba(16,185,129,0.35)',
    accent: '#10b981',
    bg: 'linear-gradient(135deg, #0a1a12 0%, #0f2a1a 100%)',
    tag: 'Budget',
  },
  {
    title: 'Smart Reminders',
    description:
      'Never miss a critical deadline. Centralized notifications that keep you on pulse.',
    img: 'https://cdn3d.iconscout.com/3d/premium/thumb/calendar-5381346-4497556.png',
    glow: 'rgba(245,158,11,0.35)',
    accent: '#f59e0b',
    bg: 'linear-gradient(135deg, #1a1500 0%, #2a1f00 100%)',
    tag: 'Reminders',
  },
  {
    title: 'Secure Documents',
    description:
      'Store, manage, and retrieve your project files seamlessly directly inside ProTask.',
    img: 'https://cdn3d.iconscout.com/3d/premium/thumb/folder-5381345-4497555.png',
    glow: 'rgba(236,72,153,0.35)',
    accent: '#ec4899',
    bg: 'linear-gradient(135deg, #1a0010 0%, #2a0020 100%)',
    tag: 'Files',
  },
];

type CardData = (typeof CARDS)[0];

// How far from the top each card sticks (creates the stacked look)
const TOP_OFFSET = 80; // px

// ─── Single sticky card slot ──────────────────────────────────────
function StickyCard({ card, index }: { card: CardData; index: number }) {
  const ref = React.useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Smooth spring bounce as card slides in
  const translateY = useTransform(
    scrollYProgress,
    [0, 0.35, 0.5, 0.65, 1],
    [60, -8, 4, 0, 0]
  );
  const springY = useSpring(translateY, { stiffness: 160, damping: 18, mass: 0.7 });

  const scale = useTransform(scrollYProgress, [0, 0.4, 1], [0.94, 1, 1]);
  const springScale = useSpring(scale, { stiffness: 180, damping: 22, mass: 0.6 });

  const opacity = useTransform(scrollYProgress, [0, 0.22, 0.9, 1], [0, 1, 1, 1]);

  return (
    // Each slot occupies 100vh — the card inside is sticky so cards stack
    <div
      ref={ref}
      style={{ height: '100vh', display: 'flex', alignItems: 'flex-start' }}
    >
      <motion.div
        style={{
          position: 'sticky',
          top: TOP_OFFSET * index + 16,
          width: '100%',
          scale: springScale,
          y: springY,
          opacity,
          transformOrigin: 'top center',
        }}
      >
        {/* ── Card shell ── */}
        <div
          className="mx-auto rounded-3xl overflow-hidden"
          style={{
            maxWidth: 780,
            background: card.bg,
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow:
              '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex flex-col md:flex-row items-stretch min-h-[340px]">
            {/* Left: text */}
            <div className="flex-1 flex flex-col justify-center p-10 md:p-14">
              {/* Tag */}
              <span
                className="text-[11px] font-mono font-semibold tracking-[0.22em] uppercase mb-5 inline-block"
                style={{ color: card.accent }}
              >
                {card.tag}
              </span>

              {/* Faint large index number */}
              <span
                className="text-[72px] font-serif leading-none mb-4 select-none"
                style={{ color: 'rgba(255,255,255,0.04)' }}
              >
                0{index + 1}
              </span>

              <h3 className="text-2xl md:text-3xl font-serif text-white mb-4 leading-tight">
                {card.title}
              </h3>
              <p className="text-sm md:text-base text-white/50 leading-relaxed max-w-xs">
                {card.description}
              </p>

              {/* Accent line */}
              <div
                className="mt-8 h-[2px] w-12 rounded-full"
                style={{ background: card.accent }}
              />
            </div>

            {/* Right: image */}
            <div
              className="flex items-center justify-center p-10 md:p-12 md:w-[280px]"
              style={{
                background: 'rgba(0,0,0,0.25)',
                borderLeft: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <img
                src={card.img}
                alt={card.title}
                className="w-40 h-40 object-contain"
                style={{ filter: `drop-shadow(0 0 40px ${card.glow})` }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Export ─────────────────────────────────────────────────────────
export default function StickyStackCards() {
  return (
    <section style={{ background: 'var(--background)' }}>
      {/* Section header */}
      <div className="text-center pt-24 pb-6 px-6">
        <span
          className="text-[10px] font-mono tracking-[0.5em] uppercase mb-4 inline-block opacity-50"
          style={{ color: 'var(--foreground)' }}
        >
          System Capabilities
        </span>
        <h2
          className="text-[clamp(32px,5vw,68px)] font-serif tracking-tight leading-[0.95]"
          style={{ color: 'var(--foreground)' }}
        >
          Inside the Framework
        </h2>
        <p
          className="mt-4 text-sm md:text-base max-w-md mx-auto font-light opacity-60"
          style={{ color: 'var(--foreground)' }}
        >
          Engineered precision. Everything you need to orchestrate your daily workflows.
        </p>
      </div>

      {/* Sticky stack area */}
      <div className="px-4 md:px-8 pb-24">
        {CARDS.map((card, i) => (
          <StickyCard key={card.title} card={card} index={i} />
        ))}
      </div>
    </section>
  );
}
