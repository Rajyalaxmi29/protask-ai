import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Shield, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Mail, Calendar } from 'lucide-react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';

const ADMIN_EMAIL = 'rajyalaxmikunchala06@gmail.com';

interface FeedbackEntry {
    id: string;
    name: string;
    email: string | null;
    pros: string | null;
    cons: string | null;
    rating: number;
    created_at: string;
}

const StarDisplay = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
            <span
                key={star}
                className={`text-lg ${star <= rating
                    ? 'text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]'
                    : 'text-white/10'
                    }`}
            >
                ★
            </span>
        ))}
    </div>
);

const FeedbackCard: React.FC<{ entry: FeedbackEntry; index: number }> = ({ entry, index }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            whileHover={{ y: -4 }}
            className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col gap-4 hover:border-white/20 transition-all cursor-default"
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/30 border border-white/10 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {entry.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-white font-bold text-sm">{entry.name}</p>
                        {entry.email && (
                            <div className="flex items-center gap-1 text-gray-500 text-xs">
                                <Mail size={10} />
                                {entry.email}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <StarDisplay rating={entry.rating} />
                    <div className="flex items-center gap-1 text-gray-600 text-[10px] font-mono">
                        <Calendar size={9} />
                        {new Date(entry.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric'
                        })}
                    </div>
                </div>
            </div>

            {/* Pros & Cons */}
            <AnimatePresence>
                {(entry.pros || entry.cons) && (
                    <div className="space-y-3">
                        {entry.pros && (
                            <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <ThumbsUp size={11} className="text-emerald-400" />
                                    <span className="text-[9px] font-black text-emerald-500/80 uppercase tracking-widest font-mono">Liked</span>
                                </div>
                                <p className={`text-gray-300 text-xs leading-relaxed ${!expanded && entry.pros.length > 120 ? 'line-clamp-2' : ''}`}>
                                    {entry.pros}
                                </p>
                            </div>
                        )}
                        {entry.cons && (
                            <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-xl">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <ThumbsDown size={11} className="text-red-400" />
                                    <span className="text-[9px] font-black text-red-500/80 uppercase tracking-widest font-mono">Improve</span>
                                </div>
                                <p className={`text-gray-300 text-xs leading-relaxed ${!expanded && entry.cons.length > 120 ? 'line-clamp-2' : ''}`}>
                                    {entry.cons}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </AnimatePresence>

            {/* Expand toggle */}
            {((entry.pros && entry.pros.length > 120) || (entry.cons && entry.cons.length > 120)) && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-400 transition-colors font-mono uppercase tracking-widest self-start"
                >
                    {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {expanded ? 'Show less' : 'Read more'}
                </button>
            )}
        </motion.div>
    );
};

export default function AdminFeedback() {
    const navigate = useNavigate();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || user.email !== ADMIN_EMAIL) {
                setIsAuthorized(false);
                navigate('/dashboard', { replace: true });
                return;
            }
            setIsAuthorized(true);
            fetchFeedback();
        } catch {
            setIsAuthorized(false);
            navigate('/dashboard', { replace: true });
        }
    };

    const fetchFeedback = async () => {
        try {
            const { data, error } = await supabase
                .from('feedback')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Fetch feedback error:', JSON.stringify(error, null, 2));
                return;
            }

            setFeedback(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Compute stats
    const avgRating = feedback.length
        ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
        : '—';

    const ratingCounts = [5, 4, 3, 2, 1].map((r) => ({
        star: r,
        count: feedback.filter((f) => f.rating === r).length,
    }));

    if (isAuthorized === null || loading) {
        return (
            <div className="min-h-screen bg-[#030303] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 text-sm font-mono uppercase tracking-widest">Checking access...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030303] text-white font-sans flex flex-col">
            <Navbar />

            <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">

                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Shield size={16} className="text-violet-400" />
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest font-mono">Admin View</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-serif font-normal tracking-[-0.02em]">
                            User Feedback
                        </h1>
                        <p className="text-gray-500 mt-1 text-sm">{feedback.length} response{feedback.length !== 1 ? 's' : ''} collected</p>
                    </div>
                </motion.div>

                {/* Stats Bar */}
                {feedback.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
                    >
                        {/* Avg Rating */}
                        <div className="col-span-2 md:col-span-1 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-1">
                            <span className="text-5xl font-black text-white">{avgRating}</span>
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <span key={s} className={`text-lg ${s <= Math.round(Number(avgRating)) ? 'text-yellow-400' : 'text-white/10'}`}>★</span>
                                ))}
                            </div>
                            <span className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">Avg Rating</span>
                        </div>

                        {/* Distribution */}
                        <div className="col-span-2 md:col-span-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest font-mono mb-4">Rating Distribution</p>
                            <div className="space-y-2">
                                {ratingCounts.map(({ star, count }) => (
                                    <div key={star} className="flex items-center gap-3">
                                        <span className="text-yellow-400 text-xs w-3">{star}</span>
                                        <span className="text-yellow-400 text-xs">★</span>
                                        <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: feedback.length ? `${(count / feedback.length) * 100}%` : '0%' }}
                                                transition={{ delay: 0.3, duration: 0.6 }}
                                                className="h-full bg-yellow-400 rounded-full"
                                            />
                                        </div>
                                        <span className="text-gray-600 text-[10px] font-mono w-4">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Feedback Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : feedback.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-24 gap-4"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                            <Star size={28} className="text-gray-700" />
                        </div>
                        <p className="text-gray-600 text-sm uppercase tracking-widest font-mono">No feedback yet</p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {feedback.map((entry, i) => (
                            <FeedbackCard key={entry.id} entry={entry} index={i} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
