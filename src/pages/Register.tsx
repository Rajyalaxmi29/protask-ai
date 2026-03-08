import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, User, Lock, Mail } from 'lucide-react';
import Spline from '@splinetool/react-spline';
import { supabase } from '../lib/supabase';

export default function Register() {
    const navigate = useNavigate();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { display_name: fullName.trim(), full_name: fullName.trim() },
            },
        });

        if (error) {
            setLoading(false);
            alert(error.message);
            return;
        }

        if (data.user) {
            // Insert into profiles table
            await supabase.from('profiles').upsert({
                id: data.user.id,
                full_name: fullName.trim(),
                email: email,
                created_at: new Date().toISOString(),
            });

            setLoading(false);
            alert('Registration successful! Please log in.');
            navigate('/login');
        } else {
            setLoading(false);
        }
    };

    return (
        <div className="relative w-full min-h-screen md:h-screen bg-black overflow-x-hidden md:overflow-hidden font-sans flex flex-col md:flex-row items-center justify-start md:justify-end md:px-24">
            <div className="relative md:absolute w-full h-[100svh] md:h-auto md:inset-0 z-0 flex-shrink-0 scale-125 md:scale-110 md:translate-x-[-20%] opacity-100">
                <Spline scene="https://prod.spline.design/A9DxtsyVZmcjfxXg/scene.splinecode" />
            </div>

            {/* Cover Spline watermark with background color */}
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '250px', height: '60px', backgroundColor: '#000000', zIndex: 50 }} />

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md px-4 pb-24 md:pb-0"
            >
                <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden">

                    <div className="flex flex-col items-center mb-10">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-600/40 rotate-3">
                            <CheckCircle2 className="text-white w-9 h-9" />
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">Create Account</h2>
                        <p className="text-gray-400 text-center text-sm">Join the workspace instantly.</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="space-y-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    placeholder="Full Name"
                                />
                            </div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    placeholder="Email Address"
                                />
                            </div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    placeholder="Password"
                                />
                            </div>

                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-blue-600/30 text-sm uppercase tracking-widest mt-6"
                        >
                            {loading ? "Signing Up..." : "Sign Up"}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-white/5 text-center">
                        <p className="text-gray-500 text-xs tracking-wide">
                            ALREADY HAVE AN ACCOUNT?
                            <Link to="/login" className="text-blue-500 font-bold hover:underline ml-1">
                                SIGN IN
                            </Link>
                        </p>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}
