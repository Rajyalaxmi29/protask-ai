import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';

const SLIDES = [
  { emoji: '✅', title: 'Manage Tasks', desc: 'Create tasks with priorities, due dates and track your progress effortlessly.' },
  { emoji: '🔔', title: 'Smart Reminders', desc: 'Set reminders for anything — work, health, shopping, personal goals.' },
  { emoji: '💸', title: 'Track Finance', desc: 'Log income & expenses, visualize spending by category and stay on budget.' },
  { emoji: '📁', title: 'Organize Files', desc: 'Keep all your documents and links organized in one beautiful place.' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < SLIDES.length - 1) {
      setStep(s => s + 1);
    } else {
      localStorage.setItem('protask_onboarded', '1');
      navigate('/login', { replace: true });
    }
  };

  const slide = SLIDES[step];

  return (
    <div className="page--full" style={{ display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.4s ease' }}>
      <AppHeader showLogo showTheme />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px var(--space-md)', gap: 32 }}>
        {/* Illustration card */}
        <div
          key={step}
          style={{
            width: '100%', maxWidth: 300,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 32,
            padding: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 16,
            animation: 'scaleIn 0.35s ease',
          }}
        >
          <div style={{ fontSize: '4.5rem', lineHeight: 1 }}>{slide.emoji}</div>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'var(--accent-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            {/* decorative rings */}
            <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', border: '1.5px dashed var(--border)', animation: 'spin 8s linear infinite' }} />
            <div style={{ position: 'absolute', inset: -24, borderRadius: '50%', border: '1px dashed var(--border)', animation: 'spin 14s linear infinite reverse', opacity: 0.5 }} />
            <div style={{ fontSize: '2rem' }}>{slide.emoji}</div>
          </div>
        </div>

        {/* Text */}
        <div key={`t-${step}`} style={{ textAlign: 'center', animation: 'slideUp 0.35s ease' }}>
          <h2 style={{ marginBottom: 10 }}>{slide.title}</h2>
          <p style={{ maxWidth: 260, margin: '0 auto' }}>{slide.desc}</p>
        </div>

        {/* Dots */}
        <div className="dots">
          {SLIDES.map((_, i) => (
            <div key={i} className={`dot ${i === step ? 'active' : ''}`} onClick={() => setStep(i)} role="button" aria-label={`Slide ${i+1}`} />
          ))}
        </div>
      </div>

      <div style={{ padding: '0 var(--space-md) 48px' }}>
        <button className="btn btn-primary" onClick={handleNext}>
          {step === SLIDES.length - 1 ? "Get Started" : "Next"}
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => { localStorage.setItem('protask_onboarded', '1'); navigate('/login', { replace: true }); }}
          style={{ display: 'block', margin: '8px auto 0', width: 'auto' }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
