import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, User, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCustomLabels } from '../lib/useCustomLabels';

interface NavLinkProps {
  key?: string | number;
  label: string;
  to: string;
  active?: boolean;
  onClick?: () => void;
}

const NavLink = ({ label, to, active = false, onClick }: NavLinkProps) => (
  <Link
    to={to}
    onClick={onClick}
    className={`px-4 py-2 rounded-full cursor-pointer transition-all text-sm font-semibold tracking-wide block md:inline-block ${active
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
        : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}>
    {label}
  </Link>
);

export default function Navbar() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { labels } = useCustomLabels();

  const navItems = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Tasks', to: '/tasks' },
    { label: 'Budget', to: '/budget' },
    { label: 'Reminders', to: '/reminders' },
    { label: 'Files', to: '/files' },
  ];

  return (
    <header className="h-20 border-b border-white/5 px-4 md:px-8 flex items-center justify-between sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-md z-50">
      <Link to="/dashboard" className="flex items-center gap-2 relative z-[60]">
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 bg-[#0a0a0a] z-50 flex flex-col pt-24 px-6 gap-4"
          >
            {navItems.map(item => (
              <NavLink
                key={item.to}
                label={item.label}
                to={item.to}
                active={location.pathname === item.to}
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
