import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  return matches;
}

const EASE: [number, number, number, number] = [0.76, 0, 0.24, 1];
const DURATION = 0.65;

function GradientOrbs() {
  return (
    <>
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 rounded-full bg-[#8B5CF6]/40 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[10%] w-56 h-56 rounded-full bg-[#06B6D4]/30 blur-[60px] pointer-events-none" />
      <div className="absolute top-[30%] left-[20%] w-40 h-40 rounded-full bg-[#EC4899]/20 blur-[50px] pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
    </>
  );
}

function Field({ icon: Icon, label, rightSlot, ...props }: any) {
  return (
    <div className="group relative flex flex-col gap-1">
      <label className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-mono">
        {label}
      </label>
      <div className="flex items-center border-b border-white/15 pb-2 focus-within:border-[#8B5CF6] transition-colors duration-300">
        <Icon className="w-4 h-4 mr-3 text-white/25 flex-shrink-0 group-focus-within:text-[#8B5CF6]" />
        <input {...props} className="flex-1 bg-transparent text-white text-sm placeholder-white/20 outline-none" />
        {rightSlot}
      </div>
    </div>
  );
}

function ShowHideBtn({ show, onToggle }: any) {
  return (
    <button type="button" onClick={onToggle} className="text-white/25 hover:text-[#8B5CF6] ml-2">
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );
}

function SubmitBtn({ loading, children }: any) {
  return (
    <button
      type="submit" disabled={loading}
      className="relative mt-2 w-full py-3 rounded-full text-sm font-bold tracking-widest uppercase text-white overflow-hidden transition-all duration-200 active:scale-[0.97] hover:brightness-110 disabled:opacity-50"
      style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #5B21B6 50%, #06B6D4 100%)', boxShadow: '0 0 24px rgba(139,92,246,0.45)' }}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
      {loading ? <span className="inline-flex items-center gap-2 pr-4">Processing…</span> : children}
    </button>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [busy, setBusy] = useState(false);

  const [lEmail, setLEmail] = useState('');
  const [lPass, setLPass] = useState('');
  const [showLP, setShowLP] = useState(false);

  const [rName, setRName] = useState('');
  const [rEmail, setREmail] = useState('');
  const [rPass, setRPass] = useState('');
  const [rConf, setRConf] = useState('');
  const [showRP, setShowRP] = useState(false);
  const [showRC, setShowRC] = useState(false);
  const [err, setErr] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('');
    const { data, error } = await supabase.auth.signInWithPassword({ email: lEmail, password: lPass });
    setBusy(false);
    if (error) return setErr(error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message);
    navigate('/dashboard');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rPass !== rConf) return setErr('Passwords do not match.');
    if (rPass.length < 6) return setErr('Password must be at least 6 characters.');
    setBusy(true); setErr('');
    const { data, error } = await supabase.auth.signUp({ email: rEmail, password: rPass, options: { data: { full_name: rName.trim() } } });
    if (error) { setBusy(false); return setErr(error.message); }
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, full_name: rName.trim(), email: rEmail });
      setMode('login'); setErr('');
    }
    setBusy(false);
  };

  const switchMode = (next: 'login' | 'register') => {
    if (next === mode) return; setErr(''); setMode(next);
  };

  // responsive clips (diagonal moves Top<->Bottom on Mobile, Left<->Right on Desktop)
  const clipLogin = isMobile 
    ? 'polygon(0 0, 100% 0, 100% 34%, 0 42%)' 
    : 'polygon(0 0, 52% 0, 44% 100%, 0 100%)';
  const clipRegister = isMobile 
    ? 'polygon(0 68%, 100% 60%, 100% 100%, 0 100%)' 
    : 'polygon(56% 0, 100% 0, 100% 100%, 48% 100%)';

  // positioning values
  const imgLoginClass = isMobile ? "absolute top-0 left-0 right-0 h-[38%] flex items-center justify-center px-4" : "absolute left-0 top-0 bottom-0 w-[48%] flex items-center justify-center px-8";
  const imgRegClass = isMobile ? "absolute bottom-0 left-0 right-0 h-[38%] flex items-center justify-center px-4" : "absolute right-0 top-0 bottom-0 w-[48%] flex items-center justify-center px-8";

  const formLoginClass = isMobile ? "absolute bottom-0 left-0 right-0 h-[62%] flex flex-col justify-center px-6" : "absolute right-0 top-0 bottom-0 w-[52%] flex flex-col justify-center px-14";
  const formRegClass = isMobile ? "absolute top-0 left-0 right-0 h-[62%] flex flex-col justify-center px-6 pt-8" : "absolute left-0 top-0 bottom-0 w-[52%] flex flex-col justify-center px-14";

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-5 py-10 font-sans" style={{ background: 'radial-gradient(ellipse at 50% 50%, #0d0820 0%, #080808 65%)' }}>
      <div className="absolute w-full max-w-[680px] h-full max-h-[480px] rounded-3xl pointer-events-none" style={{ boxShadow: '0 0 120px 20px rgba(139,92,246,0.15)' }} />

      <motion.div
        initial={{ opacity: 0, y: 40, rotateX: 8 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 0.7, ease: EASE }}
        style={{ perspective: 1400 }}
        className="relative w-full max-w-[860px] overflow-hidden rounded-[2rem]"
      >
        <div className="absolute inset-0 rounded-[2rem] pointer-events-none z-30" style={{ padding: '1.5px', background: 'linear-gradient(135deg, #8B5CF6, #06B6D4 50%, #8B5CF6)', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />

        <div className="relative rounded-[2rem] overflow-hidden bg-[#07070f] min-h-[750px] md:min-h-[560px]">
          
          <motion.div
            className="absolute inset-0 z-10"
            animate={{ clipPath: mode === 'login' ? clipLogin : clipRegister }}
            transition={{ duration: DURATION, ease: EASE }}
            style={{ background: 'linear-gradient(145deg, #8B5CF6 0%, #5B21B6 40%, #1e0b4b 80%, #060414 100%)' }}
          >
            <GradientOrbs />
            <AnimatePresence mode="wait">
              {mode === 'login' ? (
                <motion.div key="img-l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className={imgLoginClass}>
                  <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }} className="bg-white/5 p-3 rounded-[2rem] backdrop-blur-md border border-white/10 shadow-2xl relative w-full max-w-[200px] md:max-w-[240px] flex justify-center">
                    <img src="/login_illustration.png" alt="Welcome" className="w-full h-auto max-h-[120px] md:max-h-[220px] rounded-[1.5rem] object-cover" />
                    <div className="absolute inset-x-0 -bottom-8 flex justify-center opacity-70">
                       <span className="text-[10px] md:text-xs font-mono tracking-[0.2em] uppercase text-white font-bold whitespace-nowrap">Welcome Back</span>
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div key="img-r" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className={imgRegClass}>
                  <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, ease: "easeInOut", repeat: Infinity, delay: 0.5 }} className="bg-white/5 p-3 rounded-[2rem] backdrop-blur-md border border-white/10 shadow-2xl relative w-full max-w-[200px] md:max-w-[240px] flex justify-center">
                    <img src="/register_illustration.png" alt="Join" className="w-full h-auto max-h-[120px] md:max-h-[220px] rounded-[1.5rem] object-cover" />
                    <div className="absolute inset-x-0 -bottom-8 md:top-auto md:-bottom-8 flex justify-center opacity-70">
                       <span className="text-[10px] md:text-xs font-mono tracking-[0.2em] uppercase text-white font-bold whitespace-nowrap">Join the Workspace</span>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="relative z-20 w-full h-full min-h-[750px] md:min-h-[560px]">
            <AnimatePresence mode="wait">
              {mode === 'login' && (
                <motion.form key="f-login" onSubmit={handleLogin} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className={formLoginClass}>
                  <h1 className="text-3xl md:text-4xl font-black text-white mb-6 md:mb-8 tracking-tight">Login</h1>
                  <div className="space-y-6 md:space-y-7">
                    <Field icon={Mail} label="Email" type="email" required placeholder="you@example.com" value={lEmail} onChange={(e: any) => setLEmail(e.target.value)} />
                    <Field icon={Lock} label="Password" type={showLP ? 'text' : 'password'} required placeholder="••••••••" value={lPass} onChange={(e: any) => setLPass(e.target.value)} rightSlot={<ShowHideBtn show={showLP} onToggle={() => setShowLP((v: boolean) => !v)} />} />
                  </div>
                  {err && <p className="mt-4 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{err}</p>}
                  <SubmitBtn loading={busy}>Sign In</SubmitBtn>
                  <p className="mt-6 text-center text-xs text-white/30"> Don't have an account? <button type="button" onClick={() => switchMode('register')} className="text-[#8B5CF6] font-semibold hover:text-white transition-colors">Sign Up</button></p>
                </motion.form>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.form key="f-reg" onSubmit={handleRegister} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className={formRegClass}>
                  <h1 className="text-3xl md:text-4xl font-black text-white mb-5 md:mb-6 tracking-tight">Register</h1>
                  <div className="space-y-4 md:space-y-5">
                    <Field icon={User} label="Full Name" type="text" required placeholder="Your name" value={rName} onChange={(e: any) => setRName(e.target.value)} />
                    <Field icon={Mail} label="Email" type="email" required placeholder="you@example.com" value={rEmail} onChange={(e: any) => setREmail(e.target.value)} />
                    <Field icon={Lock} label="Password" type={showRP ? 'text' : 'password'} required placeholder="Min 6 chars" value={rPass} onChange={(e: any) => setRPass(e.target.value)} rightSlot={<ShowHideBtn show={showRP} onToggle={() => setShowRP((v: boolean) => !v)} />} />
                    <Field icon={Lock} label="Confirm" type={showRC ? 'text' : 'password'} required placeholder="Repeat password" value={rConf} onChange={(e: any) => setRConf(e.target.value)} rightSlot={<ShowHideBtn show={showRC} onToggle={() => setShowRC((v: boolean) => !v)} />} />
                  </div>
                  {err && <p className="mt-3 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{err}</p>}
                  <SubmitBtn loading={busy}>Create Account</SubmitBtn>
                  <p className="mt-4 text-center text-xs text-white/30">Already have an account? <button type="button" onClick={() => switchMode('login')} className="text-[#8B5CF6] font-semibold hover:text-white transition-colors">Login</button></p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}