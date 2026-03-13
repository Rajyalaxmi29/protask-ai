import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';

const CssPen = () => (
  // A CSS-only 3D stylus pen object built with shadows and gradients.
  // We use origin-bottom so rotation pivots around the glowing tip.
  <div className="relative w-4 md:w-5 h-32 md:h-40 origin-bottom scale-110 md:scale-125 rotate-[25deg] drop-shadow-[8px_15px_12px_rgba(0,0,0,0.6)] flex flex-col items-center">
    
    {/* Clicker / Top */}
    <div className="w-2 md:w-3 h-3 md:h-4 bg-gradient-to-b from-[#8a8a99] to-[#4a4a55] rounded-t-full border-b border-[#1a1a20]" />

    {/* Barrel */}
    <div className="w-full h-24 md:h-28 rounded-t-sm bg-gradient-to-r from-[#2a2a30] via-[#5a5a66] to-[#1a1a20] border border-white/10 shadow-inner relative overflow-hidden">
      {/* Extruded metallic highlight */}
      <div className="absolute inset-y-0 left-1 w-[2px] bg-white/30 blur-[1px]" />
    </div>
    
    {/* Cone to Tip */}
    <div className="w-full h-6 md:h-8 bg-gradient-to-b from-[#1a1a20] to-[#04040a]" style={{ clipPath: 'polygon(0 0, 100% 0, 60% 100%, 40% 100%)' }} />
    
    {/* Glowing Tip point */}
    <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-[#06B6D4] rounded-full -mt-0.5 md:-mt-1 shadow-[0_0_15px_8px_rgba(6,182,212,0.9),0_0_30px_15px_rgba(139,92,246,0.6)] z-10" />
    
  </div>
);

export default function PenScrollSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 60, damping: 25, restDelta: 0.001 });

  // --- Animation Block 1: "TASKS" (0.05 to 0.15) ---
  const tasksClip = useTransform(smoothProgress, [0.05, 0.15], [100, 0]);
  const tasksOpacity = useTransform(smoothProgress, [0.0, 0.05, 0.18, 0.2], [0, 1, 1, 0]);

  // --- Animation Block 2: "BUDGET" (0.20 to 0.30) ---
  const budgetClip = useTransform(smoothProgress, [0.20, 0.30], [100, 0]);
  const budgetOpacity = useTransform(smoothProgress, [0.15, 0.20, 0.33, 0.35], [0, 1, 1, 0]);

  // --- Animation Block 3: "REMINDERS" (0.35 to 0.45) ---
  const remindersClip = useTransform(smoothProgress, [0.35, 0.45], [100, 0]);
  const remindersOpacity = useTransform(smoothProgress, [0.30, 0.35, 0.48, 0.5], [0, 1, 1, 0]);

  // --- Animation Block 4: "FILES" (0.50 to 0.60) ---
  const filesClip = useTransform(smoothProgress, [0.50, 0.60], [100, 0]);
  const filesOpacity = useTransform(smoothProgress, [0.45, 0.50, 0.63, 0.65], [0, 1, 1, 0]);

  // --- Animation Block 5: The Grand Finale (0.68 to 0.95) ---
  const finaleOpacity = useTransform(smoothProgress, [0.65, 0.72, 0.9, 0.95], [0, 1, 1, 0]);
  const finaleScale = useTransform(smoothProgress, [0.65, 0.95], [0.95, 1.05]);

  // --- Pen Coordinates & Movement ---
  // Pen X perfectly tracks the physical width of each word
  // Tasks(~110px:-55 to 55), Budget(~130px:-65 to 65), Reminders(~180px:-90 to 90), Files(~100px:-50 to 50)
  const penX = useTransform(smoothProgress, 
    [0.05, 0.15, 0.20, 0.30, 0.35, 0.45, 0.50, 0.60], 
    [-55,  55,   -65,  65,   -90,  90,   -50,  50]
  );
  
  // Pen Y sweeps in, stays vertically centered (0vh) to write, "lifts" slightly (-5vh) between words, then flies away to bottom
  const penY = useTransform(smoothProgress, 
    [0, 0.05, 0.15, 0.18, 0.20, 0.30, 0.33, 0.35, 0.45, 0.48, 0.50, 0.60, 0.65], 
    ['-50vh', '0vh', '0vh', '-5vh', '0vh', '0vh', '-5vh', '0vh', '0vh', '-5vh', '0vh', '0vh', '100vh']
  );

  // Pen Scribble: tiny bounce effect only while actually drawing text
  const penScribbleY = useTransform(smoothProgress, (p) => {
    if ((p > 0.05 && p < 0.15) || (p > 0.20 && p < 0.30) || (p > 0.35 && p < 0.45) || (p > 0.50 && p < 0.60)) {
      return Math.sin(p * 800) * 5; // Fast small 5px bounce for high-speed
    }
    return 0; // Still when lifting
  });

  const sequenceOpacity = useTransform(smoothProgress, [0.95, 1.0], [1, 0]);

  return (
    <motion.div ref={containerRef} className="w-full h-[250vh] bg-[#080808] z-30 flex flex-col items-center" style={{ position: 'relative', opacity: sequenceOpacity }}>
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden">
        
        {/* CSS 3D Pen Object */}
        <motion.div 
          className="absolute z-50 pointer-events-none"
          style={{ x: penX, y: penY, translateY: penScribbleY }}
        >
          <div className="-translate-x-1/2 -translate-y-[98%]">
            <CssPen />
          </div>
        </motion.div>

        {/* Word 1: TASKS */}
        <motion.div 
          className="absolute text-xl md:text-3xl font-mono tracking-[0.2em] font-medium text-white z-40 uppercase"
          style={{ opacity: tasksOpacity, clipPath: useTransform(tasksClip, v => `inset(0 ${v}% 0 0)`) }}
        >
          TASKS
        </motion.div>

        {/* Word 2: BUDGET */}
        <motion.div 
          className="absolute text-xl md:text-3xl font-mono tracking-[0.2em] font-medium text-white z-40 uppercase"
          style={{ opacity: budgetOpacity, clipPath: useTransform(budgetClip, v => `inset(0 ${v}% 0 0)`) }}
        >
          BUDGET
        </motion.div>

        {/* Word 3: REMINDERS */}
        <motion.div 
          className="absolute text-xl md:text-3xl font-mono tracking-[0.2em] font-medium text-white z-40 uppercase"
          style={{ opacity: remindersOpacity, clipPath: useTransform(remindersClip, v => `inset(0 ${v}% 0 0)`) }}
        >
          REMINDERS
        </motion.div>

        {/* Word 4: FILES */}
        <motion.div 
          className="absolute text-xl md:text-3xl font-mono tracking-[0.2em] font-medium text-white z-40 uppercase"
          style={{ opacity: filesOpacity, clipPath: useTransform(filesClip, v => `inset(0 ${v}% 0 0)`) }}
        >
          FILES
        </motion.div>

        {/* The Impressive Finale Statement */}
        <motion.div 
          className="absolute flex flex-col items-center justify-center text-center px-4 z-40"
          style={{ opacity: finaleOpacity, scale: finaleScale }}
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#06B6D4] to-[#10B981] text-[clamp(28px,6vw,60px)] font-serif italic font-black leading-tight tracking-tight drop-shadow-lg">
            A Workspace Built For <br className="hidden md:block"/> High Achievers.
          </span>
          <span className="mt-4 text-[10px] md:text-xs font-mono tracking-[0.3em] uppercase text-white/50">
            Flawless Execution Awaits
          </span>
        </motion.div>

      </div>
    </motion.div>
  );
}
