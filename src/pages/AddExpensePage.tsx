import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';

export default function AddExpensePage() {
  const navigate = useNavigate();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [form, setForm] = useState({ title: '', amount: '', category: 'Food', via: 'Card', date: new Date().toISOString().split('T')[0], note: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const EXPENSE_CATS = ['Food','Transport','Shopping','Entertainment','Health','Utilities','Rent','Travel','Education','Other'];
  const INCOME_CATS  = ['Salary','Freelance','Investment','Gift','Other'];
  const PAYMENT_METHODS = ['Card','Cash','Bank Transfer','Google Pay','PayPal','Other'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.amount || parseFloat(form.amount) <= 0) { setError('Valid title and amount required.'); return; }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setError('Not logged in. Please sign in again.'); setSaving(false); return; }
    const { error: err } = await supabase.from('transactions').insert({
      user_id: session.user.id, type, title: form.title,
      amount: parseFloat(form.amount), category: form.category,
      date: form.date, via: form.via, note: form.note || null,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
    setTimeout(() => navigate('/expenses'), 1200);
  };

  if (success) return (
    <div className="page--full" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ fontSize: '4rem', animation: 'scaleIn 0.4s ease' }}>{type === 'expense' ? '💸' : '💰'}</div>
      <h3 style={{ animation: 'slideUp 0.3s ease 0.2s both' }}>{type === 'expense' ? 'Expense' : 'Income'} Added!</h3>
    </div>
  );

  return (
    <div className="page">
      <AppHeader title={`Add ${type === 'expense' ? 'Expense' : 'Income'}`} showBack showTheme />
      <div className="page-content">
        <div className="tabs" style={{ marginBottom: 20 }}>
          {(['expense', 'income'] as const).map(t => (
            <button key={t} className={`tab-btn ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>
              {t === 'expense' ? '💸 Expense' : '💰 Income'}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
          <div className="input-icon-wrap">
            <span className="input-prefix-icon" style={{ fontWeight: 800, color: type === 'income' ? 'var(--success)' : 'var(--danger)' }}>₹</span>
            <input id="add-amount" type="number" className="input" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} min="0.01" step="0.01" style={{ fontSize: '1.4rem', fontWeight: 800 }} />
          </div>
          <input id="add-title" type="text" className="input" placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <select className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {(type === 'expense' ? EXPENSE_CATS : INCOME_CATS).map(c => <option key={c}>{c}</option>)}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <select className="select" value={form.via} onChange={e => setForm(f => ({ ...f, via: e.target.value }))}>
              {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
            </select>
            <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <textarea className="textarea" placeholder="Note (optional)" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2} />
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>{error}</p>}
          <button id="submit-add" type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 8 }}>
            {saving ? <span className="spinner" /> : `Add ${type === 'expense' ? 'Expense' : 'Income'}`}
          </button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
