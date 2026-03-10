import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Mail, LogOut, FileText, CheckCircle2, Wallet,
  Bell, Shield, Clock, TrendingUp, ChevronRight, Lock,
  KeyRound, Trash2, Eye, EyeOff, AlertTriangle, X, Fingerprint, Pencil
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import { supabase } from '../lib/supabase';
import LightBeamButton from '../components/LightBeamButton';

interface UserStats {
  totalTasks: number;
  completedTasks: number;
  totalDocuments: number;
  totalReminders: number;
  totalBudgetEntries: number;
  memberSince: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);

  // Security states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [securityToast, setSecurityToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [lastSignIn, setLastSignIn] = useState('');
  const [provider, setProvider] = useState('');
  const toastTimeoutRef = useRef<number | null>(null);
  const [stats, setStats] = useState<UserStats>({
    totalTasks: 0,
    completedTasks: 0,
    totalDocuments: 0,
    totalReminders: 0,
    totalBudgetEntries: 0,
    memberSince: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        navigate('/login');
        return;
      }

      setEmail(user.email || '');
      setUserId(user.id);

      // Fetch name from profiles table first, fall back to user_metadata
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      setDisplayName(
        profile?.full_name ||
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name ||
        ''
      );

      const memberDate = new Date(user.created_at);
      const memberSince = memberDate.toLocaleDateString('en-IN', {
        month: 'long', year: 'numeric'
      });

      // Last sign in
      if (user.last_sign_in_at) {
        const lastSign = new Date(user.last_sign_in_at);
        setLastSignIn(lastSign.toLocaleDateString('en-IN', {
          month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }));
      }

      // Auth provider
      setProvider(user.app_metadata?.provider || 'email');

      // Fetch all stats in parallel
      const [tasksRes, completedRes, docsRes, remindersRes, budgetRes] = await Promise.all([
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('completed', true),
        supabase.from('files').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('reminders').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('budget_entries').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      setStats({
        totalTasks: tasksRes.count || 0,
        completedTasks: completedRes.count || 0,
        totalDocuments: docsRes.count || 0,
        totalReminders: remindersRes.count || 0,
        totalBudgetEntries: budgetRes.count || 0,
        memberSince,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current !== null) {
        clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }
    };
  }, []);

  const showSecurityToast = (message: string, type: 'success' | 'error') => {
    if (toastTimeoutRef.current !== null) {
      clearTimeout(toastTimeoutRef.current);
    }
    setSecurityToast({ message, type });
    toastTimeoutRef.current = window.setTimeout(() => {
      setSecurityToast(null);
      toastTimeoutRef.current = null;
    }, 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      showSecurityToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showSecurityToast('Passwords do not match', 'error');
      return;
    }

    try {
      setChangingPassword(true);

      // Verify current password by re-signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (signInError) {
        showSecurityToast('Current password is incorrect', 'error');
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        showSecurityToast(updateError.message, 'error');
        return;
      }

      showSecurityToast('Password updated successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      showSecurityToast('Something went wrong', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== 'DELETE') return;

    try {
      setDeleting(true);

      // Delete user data from all tables
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const tableNames = ['tasks', 'files', 'reminders', 'budget_entries', 'profiles'] as const;
        const results = await Promise.allSettled([
          supabase.from('tasks').delete().eq('user_id', user.id),
          supabase.from('files').delete().eq('user_id', user.id),
          supabase.from('reminders').delete().eq('user_id', user.id),
          supabase.from('budget_entries').delete().eq('user_id', user.id),
          supabase.from('profiles').delete().eq('id', user.id),
        ]);

        const failures = results
          .map((r, i) => (r.status === 'rejected' ? tableNames[i] : null))
          .filter(Boolean);

        if (failures.length > 0) {
          console.error('Failed to delete data from:', failures.join(', '));
          showSecurityToast(`Failed to delete data from: ${failures.join(', ')}`, 'error');
          setDeleting(false);
          return;
        }

        // Delete storage files
        const { data: storageFiles } = await supabase.storage
          .from('documents')
          .list(user.id);

        if (storageFiles && storageFiles.length > 0) {
          const filePaths = storageFiles.map(f => `${user.id}/${f.name}`);
          await supabase.storage.from('documents').remove(filePaths);
        }
      }

      // Sign out
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err) {
      console.error(err);
      showSecurityToast('Failed to delete account', 'error');
      setDeleting(false);
    }
  };

  const handleChangeName = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    try {
      setSavingName(true);

      // Update auth metadata
      const { error } = await supabase.auth.updateUser({
        data: { display_name: trimmed, full_name: trimmed },
      });

      if (error) {
        console.error(error);
        showSecurityToast(`Failed to update name: ${error.message}`, 'error');
        return;
      }

      // Also update profiles table
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          full_name: trimmed,
          email: user.email,
        });
      }

      setDisplayName(trimmed);
      setEditingName(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingName(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate('/login');
  };

  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  const initials = displayName
    ? displayName.charAt(0).toUpperCase()
    : email
      ? email.charAt(0).toUpperCase()
      : 'U';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020817] text-white font-sans flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020817] text-white font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">

        {/* Profile Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative rounded-[2.5rem] overflow-hidden mb-8"
        >
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-purple-600/20" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />

          <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 border border-white/5 rounded-[2.5rem]">
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-5xl md:text-6xl font-black text-white shadow-2xl shadow-blue-600/30 ring-4 ring-white/10 font-serif font-normal tracking-[-0.02em]">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full border-4 border-[#020817] flex items-center justify-center">
                <CheckCircle2 size={14} className="text-white" />
              </div>
            </motion.div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              {editingName ? (
                <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleChangeName(); if (e.key === 'Escape') setEditingName(false); }}
                    autoFocus
                    placeholder="Enter your name"
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-2xl md:text-3xl font-black text-white focus:outline-none focus:border-blue-500 transition-all w-full max-w-xs font-serif font-normal tracking-[-0.02em]"
                  />
                  <LightBeamButton
                    onClick={handleChangeName}
                    disabled={savingName || !newName.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    {savingName ? '...' : 'Save'}
                  </LightBeamButton>
                  <LightBeamButton
                    onClick={() => setEditingName(false)}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    <X size={16} />
                  </LightBeamButton>
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight font-serif font-normal tracking-[-0.02em]">
                    {displayName || email.split('@')[0]}
                  </h1>
                  <LightBeamButton
                    onClick={() => { setNewName(displayName || email.split('@')[0]); setEditingName(true); }}
                    className="p-2 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-all"
                    title="Edit name"
                  >
                    <Pencil size={16} />
                  </LightBeamButton>
                </div>
              )}
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400 mb-4">
                <Mail size={14} />
                <span className="text-sm">{email}</span>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span className="px-4 py-1.5 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                  Pro Member
                </span>
                <span className="px-4 py-1.5 bg-white/5 text-gray-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5 flex items-center gap-1.5">
                  <Clock size={10} />
                  Since {stats.memberSince}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Ring + Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          {/* Completion Ring */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-[#0d1117] border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center"
          >
            <div className="relative w-36 h-36 mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${completionRate * 3.27} 327`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white font-serif font-normal tracking-[-0.02em]">{completionRate}%</span>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Complete</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 font-semibold">Task Completion Rate</p>
          </motion.div>

          {/* Stat Cards Grid */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            {[
              { icon: CheckCircle2, label: 'Total Tasks', value: stats.totalTasks, color: 'blue', delay: 0.35 },
              { icon: TrendingUp, label: 'Completed', value: stats.completedTasks, color: 'emerald', delay: 0.4 },
              { icon: FileText, label: 'Documents', value: stats.totalDocuments, color: 'rose', delay: 0.45 },
              { icon: Bell, label: 'Reminders', value: stats.totalReminders, color: 'amber', delay: 0.5 },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: stat.delay }}
                className="bg-[#0d1117] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  stat.color === 'blue' ? 'bg-blue-500/10 text-blue-400' :
                  stat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
                  stat.color === 'rose' ? 'bg-rose-500/10 text-rose-400' :
                  'bg-[#030303]mber-500/10 text-amber-400'
                }`}>
                  <stat.icon size={18} />
                </div>
                <p className="text-2xl font-black text-white mb-1 font-serif font-normal tracking-[-0.02em]">{stat.value}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="bg-[#0d1117] border border-white/5 rounded-3xl overflow-hidden mb-8"
        >
          <div className="p-6 border-b border-white/5">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Account</h3>
          </div>
          {[
            { icon: Shield, label: 'Security & Privacy', desc: 'Manage your account security', onClick: () => setShowSecurity(true) },
            { icon: Wallet, label: 'Budget Overview', desc: `${stats.totalBudgetEntries} entries recorded`, onClick: () => navigate('/budget') },
            { icon: FileText, label: 'My Documents', desc: `${stats.totalDocuments} files uploaded`, onClick: () => navigate('/files') },
          ].map((item, i) => (
            <LightBeamButton
              key={item.label}
              onClick={item.onClick}
              className={`w-full flex items-center gap-4 p-5 hover:bg-white/[0.02] transition-all text-left ${
                i < 2 ? 'border-b border-white/5' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
                <item.icon size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </LightBeamButton>
          ))}
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <LightBeamButton
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-3 p-5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 rounded-2xl transition-all text-red-500 font-bold text-sm uppercase tracking-widest"
          >
            <LogOut size={18} />
            {loggingOut ? 'Signing out...' : 'Sign Out'}
          </LightBeamButton>
        </motion.div>

      </main>

      {/* Security & Privacy Panel */}
      <AnimatePresence>
        {showSecurity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center p-4 overflow-y-auto"
          >
            <div className="absolute inset-0 bg-[#030303]/70 backdrop-blur-sm" onClick={() => setShowSecurity(false)} />

            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              className="relative w-full max-w-2xl my-8 bg-[#0d1117] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Shield size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Security & Privacy</h3>
                    <p className="text-xs text-gray-500">Manage your account protection</p>
                  </div>
                </div>
                <LightBeamButton
                  onClick={() => setShowSecurity(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </LightBeamButton>
              </div>

              {/* Toast */}
              {securityToast && (
                <div className="mx-6 mt-4">
                  <div className={`px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border ${securityToast.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                    {securityToast.message}
                  </div>
                </div>
              )}

              <div className="p-6 space-y-6">

                {/* Session Info */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Fingerprint size={14} />
                    Session Info
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Email</span>
                      <span className="text-sm text-white font-semibold">{email}</span>
                    </div>
                    <div className="h-px bg-white/5" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Auth Provider</span>
                      <span className="text-sm text-white font-semibold capitalize">{provider}</span>
                    </div>
                    <div className="h-px bg-white/5" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Last Sign In</span>
                      <span className="text-sm text-white font-semibold">{lastSignIn || 'N/A'}</span>
                    </div>
                    <div className="h-px bg-white/5" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">User ID</span>
                      <span className="text-[10px] text-gray-500 font-mono">{userId.slice(0, 8)}...{userId.slice(-4)}</span>
                    </div>
                  </div>
                </div>

                {/* Change Password */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <KeyRound size={14} />
                    Change Password
                  </h4>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type={showCurrentPw ? 'text' : 'password'}
                        placeholder="Current Password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="w-full pl-11 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all text-sm"
                      />
                      <LightBeamButton type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                        {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </LightBeamButton>
                    </div>

                    <div className="relative">
                      <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type={showNewPw ? 'text' : 'password'}
                        placeholder="New Password (min 6 characters)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full pl-11 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all text-sm"
                      />
                      <LightBeamButton type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                        {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </LightBeamButton>
                    </div>

                    <div className="relative">
                      <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type={showConfirmPw ? 'text' : 'password'}
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full pl-11 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all text-sm"
                      />
                      <LightBeamButton type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                        {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </LightBeamButton>
                    </div>

                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-red-400 text-xs font-semibold">Passwords do not match</p>
                    )}

                    <LightBeamButton
                      type="submit"
                      disabled={changingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-widest"
                    >
                      {changingPassword ? 'Updating...' : 'Update Password'}
                    </LightBeamButton>
                  </form>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-500/[0.03] border border-red-500/10 rounded-2xl p-5">
                  <h4 className="text-xs font-black text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <AlertTriangle size={14} />
                    Danger Zone
                  </h4>
                  <p className="text-xs text-gray-500 mb-4">
                    Permanently delete your account and all data. This action cannot be undone.
                  </p>

                  {!showDeleteConfirm ? (
                    <LightBeamButton
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-xl text-red-500 font-bold text-xs uppercase tracking-widest transition-all"
                    >
                      <Trash2 size={14} />
                      Delete Account
                    </LightBeamButton>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-red-400 font-semibold">
                        Type <span className="font-black">DELETE</span> to confirm:
                      </p>
                      <input
                        type="text"
                        placeholder="Type DELETE"
                        value={deleteText}
                        onChange={(e) => setDeleteText(e.target.value)}
                        className="w-full px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-xl text-white placeholder-red-500/40 focus:outline-none focus:border-red-500/50 transition-all text-sm"
                      />
                      <div className="flex gap-3">
                        <LightBeamButton
                          onClick={handleDeleteAccount}
                          disabled={deleteText !== 'DELETE' || deleting}
                          className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all"
                        >
                          {deleting ? 'Deleting...' : 'Confirm Delete'}
                        </LightBeamButton>
                        <LightBeamButton
                          onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); }}
                          className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all"
                        >
                          Cancel
                        </LightBeamButton>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
