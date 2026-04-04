import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';
import type { Transaction } from '../lib/supabase';

const CATEGORY_ICONS: Record<string, string> = {
  Food:'🍕', Transport:'🚗', Shopping:'🛍️', Entertainment:'🎬',
  Health:'🏥', Utilities:'💡', Rent:'🏠', Salary:'💼',
  Freelance:'💻', Investment:'📈', Gift:'🎁', Travel:'✈️',
  Education:'📚', Other:'📋',
};
const CATEGORY_COLORS: Record<string, string> = {
  Food:'#f97316', Transport:'#3b82f6', Shopping:'#ec4899', Entertainment:'#8b5cf6',
  Health:'#22c55e', Utilities:'#f59e0b', Rent:'#14b8a6', Salary:'#2563eb',
  Freelance:'#6366f1', Investment:'#10b981', Gift:'#e879f9', Travel:'#06b6d4',
  Education:'#84cc16', Other:'#94a3b8',
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
  const [error, setError] = useState('');

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false });
    setTransactions((error ? [] : data || []) as Transaction[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const displayed = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);
  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const deleteTransaction = async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addTransaction = async () => {
    if (!form.title || !form.amount || parseFloat(form.amount) <= 0) { setError('Valid title and amount required.'); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error: err } = await supabase.from('transactions').insert({
      user_id: user!.id,
      type: addType,
      title: form.title,
      amount: parseFloat(form.amount),
      category: form.category,
      date: form.date,
      via: form.via,
      note: form.note || null,
    }).select().single();
    setSaving(false);
    if (err) { setError(err.message); return; }
    setTransactions(prev => [data as Transaction, ...prev]);
    setForm({ title: '', amount: '', category: 'Food', via: 'Card', date: new Date().toISOString().split('T')[0], note: '' });
    setShowAdd(false);
    setError('');
  };

  return (
    <div className="page">
      <AppHeader
        title="Finance"
        showBack
        showTheme
        rightContent={
          <button className="icon-btn" onClick={() => navigate('/add-expense')} aria-label="Add">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        }
      />

      <div className="page-content">
        {/* Balance card */}
        <div style={{ background: 'var(--accent-grad)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: 16, boxShadow: 'var(--shadow-blue)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Current Balance</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>₹{balance.toFixed(2)}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginTop: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 4 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)' }}>Income</span>
              </div>
              <div style={{ fontWeight: 800, color: '#fff' }}>₹{totalIncome.toFixed(2)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 4 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)' }}>Expense</span>
              </div>
              <div style={{ fontWeight: 800, color: '#fff' }}>₹{totalExpense.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Quick add buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <button className="btn btn-primary btn-sm" style={{ borderRadius: 'var(--radius-md)', padding: '12px 0', width: '100%' }} onClick={() => { setAddType('expense'); setForm(f => ({ ...f, category: 'Food' })); setShowAdd(true); }}>
            + Add Expense
          </button>
          <button className="btn btn-outline btn-sm" style={{ borderRadius: 'var(--radius-md)', padding: '12px 0', width: '100%' }} onClick={() => { setAddType('income'); setForm(f => ({ ...f, category: 'Salary' })); setShowAdd(true); }}>
            + Add Income
          </button>
        </div>

        {/* Filter */}
        <div className="tabs" style={{ marginBottom: 16 }}>
          {(['all', 'expense', 'income'] as const).map(f => (
            <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 'var(--radius-md)' }} />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__emoji">💸</div>
            <div className="empty-state__title">No transactions yet</div>
            <div className="empty-state__desc">Start tracking your finances</div>
          </div>
        ) : (
          <div className="card" style={{ padding: '4px 16px' }}>
            {displayed.map(tx => {
              const color = CATEGORY_COLORS[tx.category] || '#94a3b8';
              return (
                <div key={tx.id} className="tx-item">
                  <div className="tx-icon" style={{ background: `${color}22` }}>
                    <span>{CATEGORY_ICONS[tx.category] || '📋'}</span>
                  </div>
                  <div className="tx-info">
                    <div className="tx-title">{tx.title}</div>
                    <div className="tx-date">{tx.date}{tx.via ? ` · ${tx.via}` : ''}</div>
                  </div>
                  <div className="tx-amount">
                    <div className="amt" style={{ color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                      {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                    </div>
                    <div className="via">{tx.category}</div>
                  </div>
                  <button onClick={() => deleteTransaction(tx.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 6 }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add sheet */}
      {showAdd && (
        <div className="overlay" onClick={() => setShowAdd(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            {/* Type toggle */}
            <div className="tabs" style={{ marginBottom: 20 }}>
              {(['expense', 'income'] as const).map(t => (
                <button key={t} className={`tab-btn ${addType === t ? 'active' : ''}`} onClick={() => { setAddType(t); setForm(f => ({ ...f, category: t === 'expense' ? 'Food' : 'Salary' })); }}>
                  {t === 'expense' ? '💸 Expense' : '💰 Income'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="input-icon-wrap">
                <span className="input-prefix-icon" style={{ fontWeight: 700, color: addType === 'income' ? 'var(--success)' : 'var(--danger)' }}>₹</span>
                <input id="tx-amount" type="number" className="input" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} min="0.01" step="0.01" style={{ fontSize: '1.2rem', fontWeight: 700 }} />
              </div>
              <input id="tx-title" type="text" className="input" placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <select className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {(addType === 'expense' ? EXPENSE_CATS : INCOME_CATS).map(c => <option key={c}>{c}</option>)}
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <select className="select" value={form.via} onChange={e => setForm(f => ({ ...f, via: e.target.value }))}>
                  {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
                <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              {error && <p style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>{error}</p>}
              <button id="add-tx-submit" className="btn btn-primary" onClick={addTransaction} disabled={saving}>
                {saving ? <span className="spinner" /> : `Add ${addType === 'expense' ? 'Expense' : 'Income'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
