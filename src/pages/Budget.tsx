import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, ArrowUpRight, ArrowDownRight, Coffee, Car, ShoppingBag, MoreHorizontal } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import { supabase } from '../lib/supabase';

const categoryIcons: { [key: string]: React.ReactNode } = {
  'Food': Coffee,
  'Transport': Car,
  'Shopping': ShoppingBag,
  'Income': ArrowUpRight,
  'Other': MoreHorizontal,
};

const categoryColors: { [key: string]: string } = {
  'Food': '#3b82f6',
  'Transport': '#10b981',
  'Shopping': '#f59e0b',
  'Other': '#ef4444',
  'Income': '#10b981',
};

interface BudgetEntry {
  id: string;
  type: string;
  amount: number;
  category: string;
  note: string;
  entry_date: string;
}

export default function Budget() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState<'Income' | 'Expense'>('Expense');
  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food',
    note: '',
    entry_date: new Date().toISOString().split('T')[0],
  });

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      const amount = parseFloat(formData.amount);
      if (!amount || amount <= 0) {
        console.error('Invalid amount');
        return;
      }

      const { error } = await supabase
        .from('budget_entries')
        .insert({
          user_id: user.id,
          type: type.toLowerCase(),
          amount: amount,
          category: formData.category,
          note: formData.note,
          entry_date: formData.entry_date,
        });

      if (error) {
        console.error(JSON.stringify(error, null, 2));
        return;
      }

      setFormData({
        amount: '',
        category: 'Food',
        note: '',
        entry_date: new Date().toISOString().split('T')[0],
      });
      setType('Expense');
      setIsModalOpen(false);
      
      await fetchEntries();
    } catch (error) {
      console.error(JSON.stringify(error, null, 2));
    }
  };

  // Calculate summary values
  const totalIncome = entries
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = entries
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const remaining = totalIncome - totalExpenses;

  // Calculate pie chart data
  const expensesByCategory = entries
    .filter(e => e.type === 'expense')
    .reduce((acc: { [key: string]: number }, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

  const chartData = Object.entries(expensesByCategory).map(([category, value]) => ({
    name: category,
    value: value,
    color: categoryColors[category] || '#ef4444',
  }));

  // Format recent transactions for display
  const getRelativeDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  const transactions = entries
    .sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime())
    .slice(0, 5)
    .map(entry => ({
      ...entry,
      displayDate: getRelativeDate(entry.entry_date),
      displayAmount: entry.type === 'income' ? entry.amount : -entry.amount,
      icon: categoryIcons[entry.category] || MoreHorizontal,
    }));

  return (
    <div className="min-h-screen bg-[#020817] text-white font-sans flex flex-col">
      <Navbar />
      
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">Budget Tracker</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/30 active:scale-95"
          >
            <Plus size={18} />
            Add Entry
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12">
          {[
            { label: 'Total Income', value: totalIncome.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }), color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: 'Total Expenses', value: totalExpenses.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }), color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            { label: 'Remaining', value: remaining.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }), color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
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
              <span className="text-[10px] font-medium text-gray-500 bg-white/5 px-2 py-1 rounded-full uppercase tracking-widest">{transactions.length} Entries</span>
            </h3>
            <div className="space-y-4">
              {transactions.map((t) => {
                const Icon = t.icon as React.ElementType;
                return (
                  <div key={t.id} className="flex items-center justify-between p-4 md:p-5 bg-[#141414] border border-white/5 rounded-2xl hover:border-white/10 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${t.displayAmount > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm md:text-base text-white truncate">{t.note || t.category}</h4>
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider truncate">{t.category} • {t.displayDate}</p>
                      </div>
                    </div>
                    <div className={`text-base md:text-lg font-black ${t.displayAmount > 0 ? 'text-emerald-500' : 'text-red-500'} shrink-0 ml-2`}>
                      {t.displayAmount > 0 ? '+' : ''}{t.displayAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Spending Chart */}
          <div className="bg-[#141414] p-6 md:p-8 rounded-3xl border border-white/5 flex flex-col items-center justify-center">
            <h3 className="text-lg md:text-xl font-bold mb-8 w-full text-left">Spending by Category</h3>
            <div className="w-full h-[250px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
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
        <form className="space-y-5" onSubmit={handleSubmit}>
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
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Amount (₹)</label>
            <input 
              type="number" 
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all text-2xl font-black"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Category</label>
            <select 
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all appearance-none"
            >
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Shopping">Shopping</option>
              <option value="Income">Income</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Note / Description</label>
            <input 
              type="text" 
              placeholder="What was this for?"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Date</label>
            <input 
              type="date" 
              value={formData.entry_date}
              onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
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