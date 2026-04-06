import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { persistentData } from '../lib/persistentData';
import type { Transaction } from '../lib/supabase';

const CATEGORY_ICONS: Record<string, string> = {
  Food:'🍕', Transport:'🚗', Shopping:'🛍️', Entertainment:'🎬',
  Health:'🏥', Utilities:'💡', Rent:'🏠', Salary:'💼',
  Freelance:'💻', Investment:'📈', Gift:'🎁', Travel:'✈️',
  Education:'📚', Other:'📋',
};

const CATEGORY_COLORS: Record<string, string> = {
  Food:'#f97316', Transport:'#3b82f6', Shopping:'#ec4899', Entertainment:'#8b5cf6',
  Health:'#A56ABD', Utilities:'#f59e0b', Rent:'#14b8a6', Salary:'#2563eb',
  Freelance:'#6366f1', Investment:'#E7DBEF', Gift:'#e879f9', Travel:'#06b6d4',
  Education:'#6E3482', Other:'#94a3b8',
};

const EXPENSE_CATS = ['Food','Transport','Shopping','Entertainment','Health','Utilities','Rent','Travel','Education','Other'];
const INCOME_CATS  = ['Salary','Freelance','Investment','Gift','Other'];
const PAYMENT_METHODS = ['Card','Cash','Bank Transfer','Google Pay','PayPal','Other'];

export default function ExpensesPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<'expense' | 'income'>('expense');
  const [form, setForm] = useState({ title: '', amount: '', category: 'Food', via: 'Card', date: new Date().toISOString().split('T')[0], note: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    const userId = await persistentData.getUserId();
    if (!userId) { setLoading(false); return; }
    const data = await persistentData.get<Transaction>('transactions', userId, 'date');
    setTransactions(data.sort((a,b) => b.date.localeCompare(a.date)));
    setLoading(false);
  }

  useEffect(() => { 
    load(); 
    const draft = localStorage.getItem('protask_expense_draft');
    if (draft) {
      try { setForm(prev => ({ ...prev, ...JSON.parse(draft) })); } catch(e) {}
    }
  }, []);

  useEffect(() => {
    if (form.title || form.amount) {
      localStorage.setItem('protask_expense_draft', JSON.stringify(form));
    }
  }, [form]);

  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const displayed = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);

  const addTransaction = async () => {
    if (!form.title || !form.amount || parseFloat(form.amount) <= 0) return;
    setSaving(true);
    const userId = await persistentData.getUserId();
    const newTx = {
      user_id: userId, type: addType, title: form.title, amount: parseFloat(form.amount),
      category: form.category, date: form.date, via: form.via, note: form.note || null,
      created_at: new Date().toISOString()
    };
    const saved = await persistentData.mutate('transactions', 'INSERT', newTx);
    setTransactions(prev => [saved as Transaction, ...prev].sort((a,b) => b.date.localeCompare(a.date)));
    setForm({ title: '', amount: '', category: 'Food', via: 'Card', date: new Date().toISOString().split('T')[0], note: '' });
    localStorage.removeItem('protask_expense_draft');
    setShowAdd(false);
    setSaving(false);
  };

  return (
    <div className="page" style={{ background: 'var(--bg-primary)', overflowX: 'hidden' }}>
      <AppHeader 
        title="Finance" 
        rightContent={
          <button 
           onClick={() => setShowAdd(true)} 
           style={{ width: 44, height: 44, borderRadius: '16px', background: 'var(--accent-grad)', border: 'none', color: '#fff', fontSize: '1.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 15px var(--accent-glow)' }}>
           +
          </button>
        }
      />

      <div className="page-content" style={{ padding: '0px' }}>
        
        {/* HERO SECTION: Fintech Bento Wallet Card */}
        <div style={{ padding: '24px 20px 32px', background: 'linear-gradient(180deg, rgba(165,106,189,0.1) 0%, transparent 100%)' }}>
           <div className="card" style={{ background: 'linear-gradient(135deg, #49225B 0%, #6E3482 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '42px', padding: '32px', boxShadow: '0 32px 64px rgba(73,34,91,0.4)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: 200, height: 200, background: 'radial-gradient(circle, rgba(165,106,189,0.2) 0%, transparent 70%)', filter: 'blur(30px)' }} />
              
              <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 8 }}>Total Balance</div>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', letterSpacing: '-1.5px', marginBottom: 32 }}>₹{stats.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: '24px 0 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                 <div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Income</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent-light)' }}>+₹{stats.income.toLocaleString('en-IN')}</div>
                 </div>
                 <div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Expenses</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fb7185' }}>-₹{stats.expense.toLocaleString('en-IN')}</div>
                 </div>
              </div>
           </div>
        </div>

        {/* LIST SECTION: Fintech Glass List */}
        <div style={{ background: 'var(--bg-secondary)', borderTopLeftRadius: '48px', borderTopRightRadius: '48px', minHeight: '600px', padding: '40px 24px', boxShadow: '0 -20px 40px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', gap: 12, marginBottom: 32, overflowX: 'auto', scrollbarWidth: 'none' }} className="chips">
               {(['all', 'expense', 'income'] as const).map(f => (
                 <button key={f} onClick={() => setFilter(f)} style={{ padding: '12px 24px', borderRadius: '18px', background: filter === f ? 'var(--text-primary)' : 'rgba(255,255,255,0.05)', color: filter === f ? 'var(--bg-primary)' : 'var(--text-secondary)', border: 'none', fontSize: '0.9rem', fontWeight: 900, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                 </button>
               ))}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Loading Wealth...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                 {displayed.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                       <div style={{ fontSize: '4rem', marginBottom: 24, filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))' }}>🏦</div>
                       <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>Start Tracking</div>
                       <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: 8 }}>Every rupee counts on your journey.</div>
                    </div>
                 ) : (
                    displayed.map(tx => (
                      <div key={tx.id} className="tx-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 20 }}>
                         <div style={{ width: 56, height: 56, borderRadius: '20px', background: `${CATEGORY_COLORS[tx.category] || '#94a3b8'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', boxShadow: `0 8px 16px ${CATEGORY_COLORS[tx.category] || '#94a3b8'}10` }}>
                            {CATEGORY_ICONS[tx.category] || '📋'}
                         </div>
                         <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '1.05rem', fontWeight: 850, color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: 2 }}>{tx.title}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>{new Date(tx.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} • {tx.via}</div>
                         </div>
                         <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: tx.type === 'income' ? 'var(--accent-light)' : '#fb7185' }}>
                               {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{tx.category}</div>
                         </div>
                      </div>
                    ))
                 )}
              </div>
            )}
        </div>
      </div>

      <BottomNav />

      {/* Add Modal */}
      {showAdd && (
        <div className="overlay" onClick={() => setShowAdd(false)}>
           <div className="sheet" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-secondary)', borderRadius: '48px 48px 0 0', padding: '16px 24px 48px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: 40, height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: '10px', margin: '0 auto 32px' }} />
              
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', padding: '6px', marginBottom: 32 }}>
                 <button onClick={() => setAddType('expense')} style={{ flex: 1, padding: '12px', borderRadius: '18px', background: addType === 'expense' ? '#fb7185' : 'transparent', color: '#fff', border: 'none', fontWeight: 900, fontSize: '0.95rem' }}>Expense</button>
                 <button onClick={() => setAddType('income')} style={{ flex: 1, padding: '12px', borderRadius: '18px', background: addType === 'income' ? 'var(--accent)' : 'transparent', color: '#fff', border: 'none', fontWeight: 900, fontSize: '0.95rem' }}>Income</button>
              </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                 <input type="text" className="input" placeholder="What was this for? *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={{ color: 'var(--text-primary)', fontSize: '1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '20px 24px' }} autoFocus />
              </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                 <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-muted)' }}>₹</div>
                    <input type="number" className="input" placeholder="0.00 *" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={{ color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: 800, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '20px 24px 20px 50px' }} />
                 </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 }}>
                 <div className="form-group">
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 12, display: 'block', fontWeight: 800, textTransform: 'uppercase' }}>Category</label>
                    <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ color: 'var(--text-primary)', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '16px' }}>
                       {(addType === 'expense' ? EXPENSE_CATS : INCOME_CATS).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
                 <div className="form-group">
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 12, display: 'block', fontWeight: 800, textTransform: 'uppercase' }}>Method</label>
                    <select className="input" value={form.via} onChange={e => setForm(f => ({ ...f, via: e.target.value }))} style={{ color: 'var(--text-primary)', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '16px' }}>
                       {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                 </div>
              </div>

              <button className="btn btn-primary" onClick={addTransaction} disabled={saving} style={{ height: 68, borderRadius: '28px', fontSize: '1.2rem', fontWeight: 900, background: addType === 'income' ? 'var(--accent-grad)' : 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)', boxShadow: addType === 'income' ? 'var(--shadow-blue)' : '0 12px 24px rgba(251,113,133,0.3)' }}>
                {saving ? 'Processing...' : `Save ${addType.charAt(0).toUpperCase() + addType.slice(1)}`}
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
