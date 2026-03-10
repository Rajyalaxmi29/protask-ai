import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Plus, ArrowUpRight, ArrowDownRight, Coffee, Car, ShoppingBag, MoreHorizontal } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import LightBeamButton from '../components/LightBeamButton';

interface BudgetEntry {
    id: string;
    user_id: string;
    amount: number;
    category: string;
    type: 'income' | 'expense';
    entry_date: string;
    note: string;
}

export default function Budget() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [type, setType] = useState<'Income' | 'Expense'>('Expense');

    // Form state
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Food');
    const [note, setNote] = useState('');
    const [date, setDate] = useState(() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    });

    // Data state
    const [entries, setEntries] = useState<BudgetEntry[]>([]);

    useEffect(() => {
        fetchEntries();
    }, []);

    const fetchEntries = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('budget_entries')
                .select('*')
                .eq('user_id', user.id)
                .order('entry_date', { ascending: false });

            if (error) {
                console.error(JSON.stringify(error, null, 2));
                return;
            }

            setEntries(data || []);
        } catch (error) {
            console.error(JSON.stringify(error, null, 2));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const numAmount = parseFloat(amount);
            if (isNaN(numAmount) || numAmount <= 0) return;

            const finalCategory = type === 'Income' ? 'Income' : category;

            const { error } = await supabase
                .from('budget_entries')
                .insert({
                    user_id: user.id,
                    amount: numAmount,
                    category: finalCategory,
                    type: type.toLowerCase(),
                    entry_date: date,
                    note: note || finalCategory
                });

            if (error) {
                console.error(JSON.stringify(error, null, 2));
                return;
            }

            setIsModalOpen(false);
            setAmount('');
            setNote('');
            fetchEntries();
        } catch (error) {
            console.error(JSON.stringify(error, null, 2));
        }
    };

    // Calculate dynamic data
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthEntries = entries.filter(e => e.entry_date.startsWith(currentMonthStr));

    const totalIncomeNum = currentMonthEntries
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0);

    const totalExpensesNum = currentMonthEntries
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0);

    const remainingNum = totalIncomeNum - totalExpensesNum;

    const formatCurrency = (val: number) => {
        const absVal = Math.abs(val);
        const formatted = absVal.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
        return val < 0 ? `-${formatted}` : formatted;
    };

    const formattedIncome = formatCurrency(totalIncomeNum);
    const formattedExpenses = formatCurrency(totalExpensesNum);
    const formattedRemaining = formatCurrency(remainingNum);

    // Pie Chart Data
    const expensesOnly = currentMonthEntries.filter(e => e.type === 'expense');
    const categoriesMap = expensesOnly.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
    }, {} as Record<string, number>);

    const categoryColors: Record<string, string> = {
        'Food': '#3b82f6',
        'Transport': '#10b981',
        'Shopping': '#f59e0b',
        'Other': '#ef4444'
    };

    const chartData = Object.entries(categoriesMap).map(([name, value]) => ({
        name,
        value,
        color: categoryColors[name] || '#ef4444'
    }));

    if (chartData.length === 0) {
        chartData.push({ name: 'No Expenses', value: 1, color: '#333333' });
    }

    const getIcon = (cat: string) => {
        switch (cat) {
            case 'Food': return Coffee;
            case 'Transport': return Car;
            case 'Shopping': return ShoppingBag;
            case 'Income': return ArrowUpRight;
            default: return MoreHorizontal;
        }
    };

    const recentTransactions = entries.slice(0, 5);

    return (
        <div className="min-h-screen bg-[#020817] text-white font-sans flex flex-col">
            <Navbar />

            <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight font-serif font-normal tracking-[-0.02em]">Budget Tracker</h2>
                    <LightBeamButton
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/30 active:scale-95"
                    >
                        <Plus size={18} />
                        Add Entry
                    </LightBeamButton>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12">
                    {[
                        { label: 'Total Income', value: formattedIncome, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                        { label: 'Total Expenses', value: formattedExpenses, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
                        { label: 'Remaining', value: formattedRemaining, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                    ].map((card, i) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={card.label}
                            className={`p-6 md:p-8 rounded-3xl border ${card.border} ${card.bg} backdrop-blur-sm`}
                        >
                            <p className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{card.label}</p>
                            <h3 className={`text-2xl md:text-4xl font-black ${card.color}`}>{card.value}</h3>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                    {/* Recent Transactions */}
                    <div>
                        <h3 className="text-lg md:text-xl font-bold mb-6 flex items-center gap-2">
                            Recent Transactions
                            <span className="text-[10px] font-medium text-gray-500 bg-white/5 px-2 py-1 rounded-full uppercase tracking-widest">{recentTransactions.length} Entries</span>
                        </h3>
                        <div className="space-y-4">
                            {recentTransactions.map((t) => {
                                const Icon = getIcon(t.category);
                                const isIncome = t.type === 'income';

                                return (
                                    <div key={t.id} className="flex items-center justify-between p-4 md:p-5 bg-[#0a0a0a]/70 backdrop-blur-xl border-white/10 border border-white/5 rounded-2xl hover:border-white/10 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${isIncome ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                <Icon size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-sm md:text-base text-white truncate">{t.note || t.category}</h4>
                                                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider truncate tracking-widest font-mono">{t.category} • {t.entry_date}</p>
                                            </div>
                                        </div>
                                        <div className={`text-base md:text-lg font-black ${isIncome ? 'text-emerald-500' : 'text-red-500'} shrink-0 ml-2`}>
                                            {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                                        </div>
                                    </div>
                                );
                            })}
                            {recentTransactions.length === 0 && (
                                <div className="p-8 text-center text-gray-500 bg-[#0a0a0a]/70 backdrop-blur-xl border-white/10 border border-white/5 rounded-2xl">
                                    No entries found.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Spending Chart */}
                    <div className="bg-[#0a0a0a]/70 backdrop-blur-xl border-white/10 p-6 md:p-8 rounded-3xl border border-white/5 flex flex-col items-center justify-center">
                        <h3 className="text-lg md:text-xl font-bold mb-8 w-full text-left">Spending by Category</h3>
                        <div className="w-full h-[250px] md:h-[300px]">
                            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </main>

            {/* Add Entry Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add Budget Entry"
            >
                <form className="space-y-5" onSubmit={handleSave}>
                    <div className="flex p-1 bg-white/5 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setType('Expense')}
                            className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${type === 'Expense' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-500'}`}
                        >
                            Expense
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('Income')}
                            className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${type === 'Income' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-500'}`}
                        >
                            Income
                        </button>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 tracking-widest font-mono">Amount (₹)</label>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            min="0.01"
                            step="0.01"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all text-2xl font-black font-serif font-normal tracking-[-0.02em]"
                        />
                    </div>
                    {type === 'Expense' && (
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 tracking-widest font-mono">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-[#0a0a0a]/70 backdrop-blur-xl border-white/10 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all [color-scheme:dark]"
                            >
                                <option value="Food" className="bg-[#141414] text-white">Food</option>
                                <option value="Transport" className="bg-[#141414] text-white">Transport</option>
                                <option value="Shopping" className="bg-[#141414] text-white">Shopping</option>
                                <option value="Other" className="bg-[#141414] text-white">Other</option>
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 tracking-widest font-mono">Note / Description</label>
                        <input
                            type="text"
                            placeholder="What was this for?"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 tracking-widest font-mono">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all [color-scheme:dark]"
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 uppercase text-xs tracking-widest"
                        >
                            Save Entry
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
