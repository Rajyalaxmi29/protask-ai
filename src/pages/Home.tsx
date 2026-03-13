import React from 'react';
import { Link } from 'react-router-dom';
import LightBeamButton from '../components/LightBeamButton';
import { MorphingText } from '../components/MorphingText';
import CardSwap, { Card } from '../components/CardSwap';
import TubesBackground from '../components/TubesBackground';
import PenScrollSequence from '../components/PenScrollSequence';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative w-full min-h-screen bg-[#080808] overflow-x-clip font-sans text-[#E2E8F0]">
      {/* 
        Hero Section: 
        Keeps the interactive tubes background locked to the viewport height 
      */}
      <div className="relative w-full h-[100svh] flex flex-col items-center justify-center" style={{ touchAction: 'pan-y' }}>
        {/* Interactive Tubes Background */}
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <TubesBackground />
        </div>

        {/* Centered Quote */}
        <div className="absolute top-[30%] left-0 right-0 z-20 flex flex-col items-center pointer-events-none px-6 w-[92vw] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
            className="text-center w-full"
          >
            <div className="flex flex-col items-center justify-center md:flex-row text-[clamp(42px,8vw,120px)] font-serif italic tracking-tighter text-white leading-[0.85]">
              <span className="mr-4">Work</span>
              <MorphingText
                words={["Smarter", "Faster", "Better", "Together"]}
                className="text-[clamp(42px,8vw,120px)]"
                interval={2500}
              />
            </div>
            <p className="mt-8 text-sm md:text-lg text-[#E2E8F0] tracking-wide max-w-xl mx-auto font-sans font-light bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/5 shadow-2xl inline-block">
              Your AI-powered workspace to plan, track, and conquer every task effortlessly.
            </p>
          </motion.div>
        </div>

        {/* Top Branding - Monospace */}
        <div className="absolute top-8 md:top-12 left-0 right-0 z-20 flex flex-col items-center pointer-events-none w-[92vw] mx-auto pt-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-full flex justify-center items-center"
          >
            <h1 className="text-xs md:text-sm font-mono font-medium text-white tracking-[0.2em] uppercase opacity-90">
              ProTask AI
            </h1>
          </motion.div>
        </div>


      </div>

      {/* 
        3D Scroll Pen Animation Sequence
        The pen writes "Tasks" and "Budget" as you scroll down
      */}
      <PenScrollSequence />

      {/* 
        Showcase Section:
        Scroll down to reveal the perspective card swap animation
      */}
      <div className="relative w-full py-32 flex flex-col items-center justify-center bg-[#080808] z-10">
        <div className="text-center mb-16 md:mb-32 px-6 w-[92vw] max-w-5xl mx-auto flex flex-col items-center">
          <span className="text-[10px] font-mono tracking-[0.5em] text-[#E2E8F0] mb-4 uppercase">System Capabilities</span>
          <h2 className="text-[clamp(32px,5vw,72px)] font-serif italic tracking-tighter text-white mb-6 leading-[0.9]">Inside the Framework</h2>
          <p className="text-sm md:text-base text-[#E2E8F0] max-w-lg font-sans font-light">
            Engineered precision. Everything you need to orchestrate your daily workflows, wrapped in a high-performance interface.
          </p>
        </div>

        <div className="relative w-full max-w-[500px] h-[400px] mt-12 md:mt-24">
          <CardSwap
            width={400}
            height={400}
            cardDistance={40}
            verticalDistance={40}
            delay={3000}
            pauseOnHover={true}
            skewAmount={4}
          >
            {/* Card 1: Task Management */}
            <Card className="p-0 overflow-hidden group">
              <div className="relative h-full w-full flex flex-col bg-[#050505]">
                <div className="flex-1 overflow-hidden p-8 flex items-center justify-center">
                  <img
                    src="https://cdn3d.iconscout.com/3d/premium/thumb/checklist-5381347-4497557.png"
                    alt="Task Prioritization"
                    className="w-48 h-48 object-contain transition-transform duration-700 group-hover:scale-110 drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white z-10 border-t border-white/5 bg-black/40 backdrop-blur-md">
                  <h3 className="text-xl font-serif mb-2 text-white">Task Prioritization</h3>
                  <p className="text-sm text-white/50 leading-relaxed font-sans">
                    Seamlessly organize, filter, and track dependencies with AI-driven categorizations.
                  </p>
                </div>
              </div>
            </Card>

            {/* Card 2: Smarter Budgeting */}
            <Card className="p-0 overflow-hidden group">
              <div className="relative h-full w-full flex flex-col bg-[#050505]">
                <div className="flex-1 overflow-hidden p-8 flex items-center justify-center">
                  <img
                    src="https://cdn3d.iconscout.com/3d/premium/thumb/saving-money-5381348-4497558.png"
                    alt="Smarter Budgeting"
                    className="w-48 h-48 object-contain transition-transform duration-700 group-hover:scale-110 drop-shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white z-10 border-t border-white/5 bg-black/40 backdrop-blur-md">
                  <h3 className="text-xl font-serif mb-2 text-white">Financial Clarity</h3>
                  <p className="text-sm text-white/50 leading-relaxed font-sans">
                    Track every expense with dynamic charts and visual breakdowns to stay under your limits.
                  </p>
                </div>
              </div>
            </Card>

            {/* Card 3: Instant Reminders */}
            <Card className="p-0 overflow-hidden group">
              <div className="relative h-full w-full flex flex-col bg-[#050505]">
                <div className="flex-1 overflow-hidden p-8 flex items-center justify-center">
                  <img
                    src="https://cdn3d.iconscout.com/3d/premium/thumb/calendar-5381346-4497556.png"
                    alt="Instant Reminders"
                    className="w-48 h-48 object-contain transition-transform duration-700 group-hover:scale-110 drop-shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white z-10 border-t border-white/5 bg-black/40 backdrop-blur-md">
                  <h3 className="text-xl font-serif mb-2 text-white">Smart Reminders</h3>
                  <p className="text-sm text-white/50 leading-relaxed font-sans">
                    Never miss a critical deadline. Centralized notifications that keep you on pulse.
                  </p>
                </div>
              </div>
            </Card>

            {/* Card 4: Document Vault */}
            <Card className="p-0 overflow-hidden group">
              <div className="relative h-full w-full flex flex-col bg-[#050505]">
                <div className="flex-1 overflow-hidden p-8 flex items-center justify-center">
                  <img
                    src="https://cdn3d.iconscout.com/3d/premium/thumb/folder-5381345-4497555.png"
                    alt="Document Vault"
                    className="w-48 h-48 object-contain transition-transform duration-700 group-hover:scale-110 drop-shadow-[0_0_30px_rgba(236,72,153,0.3)]"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white z-10 border-t border-white/5 bg-black/40 backdrop-blur-md">
                  <h3 className="text-xl font-serif mb-2 text-white">Secure Documents</h3>
                  <p className="text-sm text-white/50 leading-relaxed font-sans">
                    Store, manage, and retrieve your project files seamlessly directly inside ProTask.
                  </p>
                </div>
              </div>
            </Card>

          </CardSwap>
        </div>

        {/* Get Started CTA - below cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mt-20 mb-8 flex flex-col items-center gap-4 px-6 w-full"
        >
          <p className="text-xs font-mono tracking-[0.3em] uppercase text-[#E2E8F0]/50">Ready to take control?</p>
          <LightBeamButton
            as={Link}
            to="/login"
            className="w-full max-w-xs px-10 py-4 text-xs font-mono font-bold tracking-[0.2em] uppercase transition-all active:scale-95 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] text-white rounded-xl"
            gradientColors={["#8B5CF6", "#06B6D4", "#8B5CF6"]}
          >
            Get Started
          </LightBeamButton>
        </motion.div>
      </div>
    </div>
  );
}
