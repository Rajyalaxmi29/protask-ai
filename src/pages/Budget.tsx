import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, ArrowUpRight, ArrowDownRight, Coffee, Car, ShoppingBag, MoreHorizontal } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';

const data = [
  { name: 'Food', value: 35, color: '#3b82f6' },
  { name: 'Transport', value: 20, color: '#10b981' },
  { name: 'Shopping', value: 25, color: '#f59e0b' },
  { name: 'Other', value: 20, color: '#ef4444' },
];

const transactions = [
  { id: '1', name: 'Grocery Store', category: 'Food', date: 'Today', amount: -1200, icon: Coffee },
  { id: '2', name: 'Salary Credit', category: 'Income', date: 'Yesterday', amount: 15000, icon: ArrowUpRight },
  { id: '3', name: 'Uber Ride', category: 'Transport', date: 'Yesterday', amount: -450, icon: Car },
  { id: '4', name: 'Amazon Order', category: 'Shopping', date: 'Feb 26', amount: -2500, icon: ShoppingBag },
  { id: '5', name: 'Starbucks', category: 'Food', date: 'Feb 25', amount: -350, icon: Coffee },
];

export default function Budget() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState<'Income' | 'Expense'>('Expense');

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
            { label: 'Total Income', value: '₹15,000', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: 'Total Expenses', value: '₹4,200', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            { label: 'Remaining', value: '₹10,800', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
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
              <span className="text-[10px] font-medium text-gray-500 bg-white/5 px-2 py-1 rounded-full uppercase tracking-widest">5 Entries</span>
            </h3>
            <div className="space-y-4">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 md:p-5 bg-[#141414] border border-white/5 rounded-2xl hover:border-white/10 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${t.amount > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      <t.icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm md:text-base text-white truncate">{t.name}</h4>
                      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider truncate">{t.category} • {t.date}</p>
                    </div>
                  </div>
                  <div className={`text-base md:text-lg font-black ${t.amount > 0 ? 'text-emerald-500' : 'text-red-500'} shrink-0 ml-2`}>
                    {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Spending Chart */}
          <div className="bg-[#141414] p-6 md:p-8 rounded-3xl border border-white/5 flex flex-col items-center justify-center">
            <h3 className="text-lg md:text-xl font-bold mb-8 w-full text-left">Spending by Category</h3>
            <div className="w-full h-[250px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
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
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
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
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all text-2xl font-black"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Category</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all appearance-none">
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
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Date</label>
            <input 
              type="date" 
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
