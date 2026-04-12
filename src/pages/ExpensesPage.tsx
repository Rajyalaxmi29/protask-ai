import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Menu, 
  DollarSign, ArrowUpRight, ArrowDownLeft,
  PieChart, History, ChevronRight, Filter, TrendingUp
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { persistentData } from '../lib/persistentData';

export default function ExpensesPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ balance: 0, income: 0, expense: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userId = await persistentData.getUserId();
      if (!userId) return;
      
      const records = await persistentData.get<any>('transactions', userId);
      let balance = 0, income = 0, expense = 0;
      
      records.forEach(t => {
        if (t.type === 'income') {
          income += t.amount;
          balance += t.amount;
        } else {
          expense += t.amount;
          balance -= t.amount;
        }
      });

      setStats({ balance, income, expense });
      setTransactions(records.sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()));
    } catch (err) {
      console.error('Failed to load transactions', err);
    }
  };

  const formatMoney = (val: number) => {
    return val.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  };

  return (
    <div className="page" style={{ background: '#000' }}>
      {/* Top Header */}
      <header style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '20px', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.8)', 
        backdropFilter: 'blur(10px)', zIndex: 100 
      }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Menu size={20} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
               <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>Finance Core</span>
            </div>
         </div>
         <div style={{ display: 'flex', gap: 20, color: 'var(--text-secondary)' }}>
            <Search size={18} />
            <Filter size={18} />
         </div>
      </header>

      <div className="page-content" style={{ padding: '20px' }}>
        
        {/* Balance Hero Card */}
        <div className="card" style={{ background: 'linear-gradient(135deg, #111 0%, #0a0a0a 100%)', padding: '32px 24px', textAlign: 'center', marginBottom: 24 }}>
           <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 12 }}>Available Balance</div>
           <div style={{ fontSize: '3rem', fontWeight: 900 }}>{formatMoney(stats.balance)}</div>
           <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                 <div style={{ width: 32, height: 32, borderRadius: '10px', background: 'rgba(0,255,178,0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowDownLeft size={16} />
                 </div>
                 <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>INCOME</div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--accent)' }}>{formatMoney(stats.income)}</div>
                 </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                 <div style={{ width: 32, height: 32, borderRadius: '10px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowUpRight size={16} />
                 </div>
                 <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>EXPENSE</div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#EF4444' }}>{formatMoney(stats.expense)}</div>
                 </div>
              </div>
           </div>
        </div>

        {/* Categories / Insights */}
        <div style={{ marginBottom: 40 }}>
           <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: 20 }}>SPENDING ANALYTICS</h3>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                 <PieChart size={32} color="var(--accent)" style={{ margin: '0 auto 12px' }} />
                 <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>65% Safe</div>
                 <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>Budget health</div>
              </div>
              <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                 <TrendingUp size={32} color="#6C4CF1" style={{ margin: '0 auto 12px' }} />
                 <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>-12% Down</div>
                 <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>vs last month</div>
              </div>
           </div>
        </div>

        {/* Transactions */}
        <div style={{ marginBottom: 100 }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '1.5px' }}>RECENT FLOW</h3>
              <History size={16} color="var(--text-muted)" />
           </div>
           
           <div className="flex flex-col gap-3">
              {transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No transactions yet.</div>
              ) : transactions.map((tx, i) => (
                <div key={tx.id || i} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                   <div style={{ width: 44, height: 44, borderRadius: '14px', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                      {tx.type === 'income' ? '💰' : '💸'}
                   </div>
                   <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{tx.title}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{tx.category}</div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 900, color: tx.type === 'income' ? 'var(--accent)' : '#fff' }}>
                         {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>

      </div>

      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/add-expense')}
        style={{ 
          position: 'fixed', bottom: 100, right: 24, 
          width: 56, height: 56, borderRadius: '20px', 
          background: 'var(--accent)', border: 'none', 
          color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', 
          boxShadow: '0 8px 24px var(--accent-glow)', zIndex: 100, cursor: 'pointer'
        }}
      >
         <Plus size={28} />
      </motion.button>

      <BottomNav />
    </div>
  );
}
