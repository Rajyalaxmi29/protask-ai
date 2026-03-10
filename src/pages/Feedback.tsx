import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star, Send, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';

export default function Feedback() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [pros, setPros] = useState('');
    const [cons, setCons] = useState('');
    const [rating, setRating] = useState(0);
    const [hoveredStar, setHoveredStar] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0 || !name.trim()) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('feedback').insert({
                name: name.trim(),
                email: email.trim() || null,
                pros: pros.trim() || null,
                cons: cons.trim() || null,
                rating,
            });

            if (error) {
                console.error('Feedback error:', JSON.stringify(error, null, 2));
                return;
            }

            setName('');
            setEmail('');
            setPros('');
            setCons('');
            setRating(0);
            setHoveredStar(0);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 4000);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030303] text-white font-sans flex flex-col">
            <Navbar />

            {/* Success Toast */}
            {showToast && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 bg-[#0a0a0a] border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-500/10 backdrop-blur-xl"
                >
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <CheckCircle size={16} className="text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-white text-sm font-bold">Feedback Received!</p>
                        <p className="text-gray-500 text-xs">Thank you for helping improve ProTask AI.</p>
                    </div>
                </motion.div>
            )}

            <main className="flex-1 flex items-center justify-center p-6 md:p-12">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="w-full max-w-xl"
                >
                    {/* Header */}
                    <div className="mb-10 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-bold uppercase tracking-widest font-mono mb-5">
                            <Star size={12} />
                            Share Your Experience
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif font-normal tracking-[-0.02em] text-white mb-3">
                            We'd Love Your<br />
                            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Feedback</span>
                        </h1>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Help us make ProTask AI better for everyone. Your feedback matters.
                        </p>
                    </div>

                    {/* Glassmorphism Card */}
                    <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                        {/* Glow effect */}
                        <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-blue-500/10 via-transparent to-violet-500/10 pointer-events-none" />

                        <form className="space-y-6" onSubmit={handleSubmit}>

                            {/* Star Rating */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest font-mono mb-3">
                                    Rating *
                                </label>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoveredStar(star)}
                                            onMouseLeave={() => setHoveredStar(0)}
                                            className="text-4xl transition-all duration-100 hover:scale-125 focus:outline-none"
                                        >
                                            <span
                                                className={`${star <= (hoveredStar || rating)
                                                        ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]'
                                                        : 'text-white/10'
                                                    } transition-all`}
                                            >
                                                ★
                                            </span>
                                        </button>
                                    ))}
                                    {rating > 0 && (
                                        <motion.span
                                            key={rating}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="ml-3 text-sm text-gray-400 font-mono"
                                        >
                                            {ratingLabels[rating]}
                                        </motion.span>
                                    )}
                                </div>
                            </div>

                            {/* Name & Email Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest font-mono mb-2">
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Your name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest font-mono mb-2">
                                        Email <span className="normal-case font-normal tracking-normal text-gray-600">(optional)</span>
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            {/* Pros */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest font-mono mb-2">
                                    <span className="text-emerald-500 mr-1">✓</span> What Did You Like?
                                </label>
                                <textarea
                                    placeholder="The things that worked great..."
                                    value={pros}
                                    onChange={(e) => setPros(e.target.value)}
                                    rows={3}
                                    className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:outline-none focus:border-emerald-500/50 transition-all resize-none text-sm"
                                />
                            </div>

                            {/* Cons */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest font-mono mb-2">
                                    <span className="text-red-400 mr-1">✗</span> What Can Be Improved?
                                </label>
                                <textarea
                                    placeholder="Things that could be better..."
                                    value={cons}
                                    onChange={(e) => setCons(e.target.value)}
                                    rows={3}
                                    className="w-full bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:outline-none focus:border-red-500/50 transition-all resize-none text-sm"
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isSubmitting || rating === 0 || !name.trim()}
                                className={`w-full flex items-center justify-center gap-2 font-bold py-4 rounded-xl transition-all uppercase text-xs tracking-widest shadow-lg ${isSubmitting || rating === 0 || !name.trim()
                                        ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-blue-600/20 hover:shadow-blue-600/40 hover:scale-[1.02]'
                                    }`}
                            >
                                <Send size={14} />
                                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
