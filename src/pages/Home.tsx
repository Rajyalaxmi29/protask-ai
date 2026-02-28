import React from 'react';
import { Link } from 'react-router-dom';
import Spline from '@splinetool/react-spline';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      {/* Spline 3D Hero */}
      <div className="absolute inset-0 z-0">
        <Spline 
          scene="https://prod.spline.design/F7NTAvHVf3E7N79x/scene.splinecode" 
        />
      </div>

      {/* CSS to hide Spline Watermark */}
      <style dangerouslySetInnerHTML={{ __html: `
        #spline-watermark, 
        a[href*="spline.design"],
        div[style*="z-index: 1000000"],
        div[style*="position: absolute"][style*="bottom: 10px"][style*="right: 10px"],
        div[style*="position: absolute"][style*="bottom: 16px"][style*="right: 16px"],
        .spline-watermark { 
          display: none !important; 
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}} />

      {/* Top Branding - Small and Concise */}
      <div className="absolute top-8 md:top-12 left-0 right-0 z-20 flex flex-col items-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center"
        >
          <h1 className="text-xs md:text-base font-bold text-white tracking-[0.4em] uppercase opacity-80">
            ProTask <span className="text-blue-500">AI</span>
          </h1>
        </motion.div>
      </div>

      {/* Bottom Action - Get Started */}
      <div className="absolute bottom-12 md:bottom-16 left-0 right-0 z-10 flex justify-center pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.6 }}
          className="text-center pointer-events-auto w-full px-6"
        >
          <Link 
            to="/login"
            className="inline-block w-full max-w-xs md:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(37,99,235,0.4)]"
          >
            Get Started
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
