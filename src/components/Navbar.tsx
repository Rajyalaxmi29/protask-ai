import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, User, Menu, X, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCustomLabels } from '../lib/useCustomLabels';
import { supabase } from '../lib/supabase';

const ADMIN_EMAIL = 'rajyalaxmikunchala06@gmail.com';

interface NavLinkProps {
  key?: string | number;
  label: string;
  to: string;
  active?: boolean;
  onClick?: () => void;
  isAdmin?: boolean;
}

const NavLink = ({ label, to, active = false, onClick, isAdmin = false }: NavLinkProps) => (
  <Link
    to={to}
    onClick={onClick}
    className={`px-4 py-2 rounded-full cursor-pointer transition-all text-sm font-semibold tracking-wide block md:inline-block ${active
      ? isAdmin
        ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
        : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
      : isAdmin
        ? 'text-violet-400 hover:text-white hover:bg-violet-500/10'
        : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}>
    {label}
  </Link>
);

export default function Navbar() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { labels } = useCustomLabels();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAdmin(user?.email === ADMIN_EMAIL);
    });
  }, []);

  const baseNavItems: { label: string; to: string; isAdmin: boolean }[] = [
    { label: 'Dashboard', to: '/dashboard', isAdmin: false },
    { label: 'Tasks', to: '/tasks', isAdmin: false },
    { label: 'Budget', to: '/budget', isAdmin: false },
    { label: 'Reminders', to: '/reminders', isAdmin: false },
    { label: 'Files', to: '/files', isAdmin: false },
  ];

  // Admin sees "Admin Feedback" (violet), regular users see "Feedback"
  const feedbackItem: { label: string; to: string; isAdmin: boolean } = isAdmin
    ? { label: 'Admin Feedback', to: '/admin-feedback', isAdmin: true }
    : { label: 'Feedback', to: '/feedback', isAdmin: false };

  const navItems = [...baseNavItems, feedbackItem];

  return (
    <header className="h-20 border-b border-white/5 px-4 md:px-8 flex items-center justify-between sticky top-0 bg-[#030303]/80 backdrop-blur-md z-50">
      <Link to="/dashboard" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <CheckCircle2 size={18} className="text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">ProTask AI</span>
      </Link>

      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center gap-2">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            label={item.label}
            to={item.to}
            active={location.pathname === item.to}
            isAdmin={('isAdmin' in item ? item.isAdmin : false) as boolean}
          />
        ))}
        {labels.length > 0 && (
          <div className="w-px h-5 bg-white/10 mx-2" />
        )}
        {labels.map(label => (
          <NavLink
            key={`desktop-nav-${label.id}`}
            label={label.name}
            to={`/labels/${label.id}`}
            active={location.pathname === `/labels/${label.id}`}
          />
        ))}

        <div className="ml-6 flex items-center gap-3 pl-6 border-l border-white/10">
          {isAdmin && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full">
              <Shield size={11} className="text-violet-400" />
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Admin</span>
            </div>
          )}
          <Link to="/profile" className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border border-white/10 overflow-hidden cursor-pointer hover:border-white/30 transition-all hover:scale-110">
            <User size={18} className="text-white" />
          </Link>
        </div>
      </nav>

      {/* Mobile Menu Toggle */}
      <button
        className="md:hidden p-2 text-gray-400 hover:text-white relative z-[60]"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            style={{ backgroundColor: '#030303' }}
            className="fixed inset-0 z-[55] flex flex-col pt-24 px-6 pb-10 gap-3 overflow-y-auto"
          >
            {isAdmin && (
              <div className="flex items-center gap-2 px-3 py-2 bg-violet-500/10 border border-violet-500/20 rounded-xl mb-2">
                <Shield size={13} className="text-violet-400" />
                <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">Admin Mode</span>
              </div>
            )}
            {navItems.map(item => (
              <NavLink
                key={item.to}
                label={item.label}
                to={item.to}
                active={location.pathname === item.to}
                isAdmin={'isAdmin' in item ? item.isAdmin : false}
                onClick={() => setIsMenuOpen(false)}
              />
            ))}
            {labels.length > 0 && (
              <div className="h-px w-full bg-white/5 my-2" />
            )}
            {labels.map(label => (
              <NavLink
                key={`mobile-nav-${label.id}`}
                label={label.name}
                to={`/labels/${label.id}`}
                active={location.pathname === `/labels/${label.id}`}
                onClick={() => setIsMenuOpen(false)}
              />
            ))}
            <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="mt-8 pt-8 border-t border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border border-white/10">
                <User size={24} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-white">My Profile</p>
                <p className="text-xs text-gray-500 uppercase tracking-widest">View account</p>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
