import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';
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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<'expense' | 'income'>('expense');
  const [form, setForm] = useState({ title: '', amount: '', category: 'Food', via: 'Card', date: new Date().toISOString().split('T')[0], note: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const userId = await persistentData.getUserId();
    if (!userId) { setLoading(false); return; }
    const data = await persistentData.get<Transaction>('transactions', userId, 'date');
    setTransactions(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const displayed = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);
  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const deleteTransaction = async (id: string) => {
    await persistentData.mutate('transactions', 'DELETE', { id });
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addTransaction = async () => {
    if (!form.title || !form.amount || parseFloat(form.amount) <= 0) { setError('Valid title and amount required.'); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const newTx = {
      user_id: user!.id,
      type: addType,
      title: form.title,
      amount: parseFloat(form.amount),
      category: form.category,
      date: form.date,
      via: form.via,
      note: form.note || null,
      created_at: new Date().toISOString()
    };

    const saved = await persistentData.mutate('transactions', 'INSERT', newTx);
    setTransactions(prev => [saved as Transaction, ...prev]);
    setForm({ title: '', amount: '', category: 'Food', via: 'Card', date: new Date().toISOString().split('T')[0], note: '' });
    setShowAdd(false);
    setSaving(false);
    setError('');
  };

  return (
    <div className="page">
      <AppHeader
        title="Finance"
        showBack
        showTheme
        rightContent={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="icon-btn" onClick={() => setViewMode(v => v === 'list' ? 'grid' : 'list')} aria-label="Toggle layout">
              {viewMode === 'list' 
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              }
            </button>
            <button className="icon-btn" onClick={() => setShowAdd(true)} aria-label="Add" style={{ background: 'var(--accent-grad)', border: 'none', color: '#fff' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        }
      />

      <div className="page-content">
        {/* Balance overview glass card */}
        <div className="glass-card" style={{ background: 'var(--accent-grad)', border: 'none', padding: '24px', marginBottom: 24, boxShadow: 'var(--shadow-blue)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, left: -20, width: 100, height: 100, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(30px)' }} />
          <div style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(20px)' }} />
          
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontWeight: 600 }}>Total Balance</div>
          <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Income</span>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>₹{totalIncome.toLocaleString('en-IN')}</div>
            </div>
            <div style={{ height: 32, width: 1, background: 'rgba(255,255,255,0.2)', alignSelf: 'center' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Expense</span>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>₹{totalExpense.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="tabs" style={{ marginBottom: 24, padding: 4 }}>
          {(['all', 'expense', 'income'] as const).map(f => (
            <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Transaction list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-lg)' }} />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__emoji">💸</div>
            <div className="empty-state__title">Empty wallet?</div>
            <div className="empty-state__desc">Track your daily income and expenses here to see where your money goes.</div>
            <button className="btn btn-primary" style={{ width: 'auto', padding: '12px 32px', marginTop: 12 }} onClick={() => setShowAdd(true)}>Log First Item</button>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(160px, 1fr))' : '1fr', 
            gap: 12 
          }}>
            {displayed.map(tx => {
              const color = CATEGORY_COLORS[tx.category] || '#94a3b8';
              
              if (viewMode === 'list') {
                return (
                  <div key={tx.id} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 16, border: '1px solid var(--border)' }}>
                    <div className="tx-icon" style={{ background: `${color}15`, color: color, width: 48, height: 48, borderRadius: 'var(--radius-md)', fontSize: '1.4rem' }}>
                      <span>{CATEGORY_ICONS[tx.category] || '📋'}</span>
                    </div>
                    <div className="tx-info" style={{ flex: 1 }}>
                      <div className="tx-title" style={{ fontSize: '1rem', fontWeight: 700 }}>{tx.title}</div>
                      <div className="tx-date" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {tx.category}
                      </div>
                    </div>
                    <div className="tx-amount" style={{ textAlign: 'right' }}>
                      <div className="amt" style={{ fontSize: '1.1rem', fontWeight: 800, color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                        {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                      </div>
                      <div className="via" style={{ fontSize: '0.65rem', opacity: 0.5, fontWeight: 700, textTransform: 'uppercase' }}>{tx.via}</div>
                    </div>
                    <button onClick={() => deleteTransaction(tx.id)} className="icon-btn" style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                );
              }

              // GRID VIEW
              return (
                <div key={tx.id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid var(--border)', minHeight: 180, position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.6rem' }}>{CATEGORY_ICONS[tx.category] || '📋'}</div>
                    <button onClick={() => deleteTransaction(tx.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                    </button>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div className="tx-title" style={{ fontSize: '0.95rem', fontWeight: 700, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{tx.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>{tx.category} · {tx.via}</div>
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)', marginBottom: 4 }}>
                      {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {new Date(tx.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Transaction sheet */}
      {showAdd && (
        <div className="overlay" onClick={() => setShowAdd(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-primary)', borderTop: '2px solid var(--accent-light)' }}>
            <div className="sheet-handle" style={{ background: 'var(--accent-dim)', width: 40, height: 4 }} />
            <div className="sheet-title" style={{ fontSize: '1.4rem', textAlign: 'center', marginBottom: 24 }}>Log Transaction</div>
            
            <div className="tabs" style={{ marginBottom: 24, padding: 4 }}>
              {(['expense', 'income'] as const).map(t => (
                <button key={t} className={`tab-btn ${addType === t ? 'active' : ''}`} onClick={() => { setAddType(t); setForm(f => ({ ...f, category: t === 'expense' ? 'Food' : 'Salary' })); }}>
                  {t === 'expense' ? '💸 Expense' : '💰 Income'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="form-group">
                <div className="input-icon-wrap">
                  <span className="input-prefix-icon" style={{ fontSize: '1.2rem', fontWeight: 800, color: addType === 'income' ? 'var(--success)' : 'var(--danger)' }}>₹</span>
                  <input id="tx-amount" type="number" className="input" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={{ fontSize: '1.5rem', fontWeight: 900, padding: '16px 16px 16px 48px' }} />
                </div>
              </div>

              <div className="form-group">
                <input id="tx-title" type="text" className="input" placeholder="What was this for? *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={{ fontSize: '1.1rem', padding: '16px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ height: 50 }}>
                    {(addType === 'expense' ? EXPENSE_CATS : INCOME_CATS).map(c => <option key={c}>{CATEGORY_ICONS[c]} {c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Method</label>
                  <select className="select" value={form.via} onChange={e => setForm(f => ({ ...f, via: e.target.value }))} style={{ height: 50 }}>
                    {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Transaction Date</label>
                <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>

              <div className="form-group">
                <textarea className="textarea" placeholder="Add a note (optional)..." value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2} />
              </div>

              {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', textAlign: 'center', fontWeight: 600 }}>{error}</p>}
              
              <button id="add-tx-submit" className="btn btn-primary" onClick={addTransaction} disabled={saving} style={{ height: 56, fontSize: '1rem' }}>
                {saving ? <span className="spinner" /> : `Log ${addType.charAt(0).toUpperCase() + addType.slice(1)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
