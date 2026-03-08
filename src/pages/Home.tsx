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

      {/* Cover Spline watermark with background color */}
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: '250px', height: '60px', backgroundColor: '#000000', zIndex: 10 }} />

      {/* Cover "Clarity. Focus. Impact." and subtitle text with background color */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '55%', backgroundColor: '#000000', zIndex: 5 }} />

      {/* Centered Quote */}
      <div className="absolute top-[30%] left-0 right-0 z-20 flex flex-col items-center pointer-events-none px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
          className="text-center"
        >
          <h2 className="text-lg md:text-3xl font-bold text-white tracking-tight leading-tight">
            Organize Smarter.{' '}
            <span className="text-blue-500">Achieve More.</span>
          </h2>
          <p className="mt-3 text-xs md:text-sm text-gray-400 tracking-wide max-w-md mx-auto">
            Your AI-powered workspace to plan, track, and conquer every task effortlessly.
          </p>
        </motion.div>
      </div>

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
