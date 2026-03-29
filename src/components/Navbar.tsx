import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, User, Menu, X, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

const ADMIN_EMAIL = 'rajyalaxmikunchala06@gmail.com';

interface NavItem {
  label: string;
  to: string;
  isAdmin: boolean;
}

export default function Navbar() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAdmin(user?.email === ADMIN_EMAIL);
    });
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const baseNavItems: NavItem[] = [
    { label: 'Home', to: '/', isAdmin: false },
    { label: 'Dashboard', to: '/dashboard', isAdmin: false },
    { label: 'Tasks', to: '/tasks', isAdmin: false },
    { label: 'Budget', to: '/budget', isAdmin: false },
    { label: 'Reminders', to: '/reminders', isAdmin: false },
    { label: 'Files', to: '/files', isAdmin: false },
  ];

  const feedbackItem: NavItem = isAdmin
    ? { label: 'Admin Feedback', to: '/admin-feedback', isAdmin: true }
    : { label: 'Feedback', to: '/feedback', isAdmin: false };

  const navItems = [...baseNavItems, feedbackItem];

  const isActive = (to: string) => location.pathname === to;

  return (
    <>
      {/* Header */}
      <header className="h-16 md:h-20 border-b border-white/5 px-4 md:px-8 flex items-center justify-between sticky top-0 z-50" style={{ backgroundColor: '#030303' }}>
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} className="text-white" />
          </div>
          <span className="text-lg md:text-xl font-bold tracking-tight text-white">ProTask AI</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`px-4 py-2 rounded-full text-sm font-semibold tracking-wide transition-all ${isActive(item.to)
                  ? item.isAdmin
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                    : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : item.isAdmin
                    ? 'text-violet-400 hover:text-white hover:bg-violet-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              {item.label}
            </Link>
          ))}

          <div className="ml-4 flex items-center gap-3 pl-4 border-l border-white/10">
            {isAdmin && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full">
                <Shield size={11} className="text-violet-400" />
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Admin</span>
              </div>
            )}
            <Link to="/profile" className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border border-white/10 hover:border-white/30 transition-all hover:scale-110">
              <User size={18} className="text-white" />
            </Link>
          </div>
        </nav>

        {/* Mobile hamburger — always on top */}
        <button
          className="md:hidden p-2 text-gray-400 hover:text-white z-[70] relative"
          onClick={() => setIsMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Nav Overlay — rendered outside header so z-index is simpler */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            key="mobile-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] md:hidden"
            style={{ backgroundColor: '#0a0a0a' }}
          >
            {/* Scrollable nav content, pushed below the header */}
            <div className="h-full overflow-y-auto pt-16 pb-10 px-5 flex flex-col">

              {/* Admin badge */}
              {isAdmin && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-violet-500/10 border border-violet-500/20 rounded-2xl mb-4">
                  <Shield size={14} className="text-violet-400" />
                  <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">Admin Mode</span>
                </div>
              )}

              {/* Nav items */}
              <nav className="flex flex-col gap-1 mb-6">
                {navItems.map((item, i) => (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                  >
                    <Link
                      to={item.to}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-base font-semibold transition-all ${isActive(item.to)
                          ? item.isAdmin
                            ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                            : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive(item.to)
                          ? item.isAdmin ? 'bg-violet-400' : 'bg-blue-400'
                          : 'bg-gray-600'
                        }`} />
                      {item.label}
                    </Link>
                  </motion.div>
                ))}

              </nav>

              {/* Profile section at the bottom */}
              <div className="mt-auto pt-6 border-t border-white/5">
                <Link
                  to="/profile"
                  className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/5 transition-all"
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border border-white/10 shrink-0">
                    <User size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">My Profile</p>
                    <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">View account</p>
                  </div>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
