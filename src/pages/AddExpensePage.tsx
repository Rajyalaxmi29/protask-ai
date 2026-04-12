import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, TrendingDown, TrendingUp, 
  Tag, CreditCard, Calendar, AlignLeft,
  CheckCircle2, IndianRupee
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { persistentData } from '../lib/persistentData';

const EXPENSE_CATS = ['Food','Transport','Shopping','Entertainment','Health','Utilities','Rent','Travel','Education','Other'];
const INCOME_CATS  = ['Salary','Freelance','Investment','Gift','Other'];
const PAYMENT_METHODS = ['Card','Cash','Bank Transfer','Google Pay','UPI','Other'];

const CAT_EMOJIS: Record<string, string> = {
  Food:'🍜', Transport:'🚗', Shopping:'🛍️', Entertainment:'🎬', Health:'💊',
  Utilities:'⚡', Rent:'🏠', Travel:'✈️', Education:'📚', Other:'📦',
  Salary:'💼', Freelance:'💻', Investment:'📈', Gift:'🎁',
};

export default function AddExpensePage() {
  const navigate = useNavigate();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [form, setForm] = useState({ 
    title: '', amount: '', 
    category: 'Food', via: 'Card', 
    date: new Date().toISOString().split('T')[0], note: '' 
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isExpense = type === 'expense';
  const accentColor = isExpense ? '#EF4444' : '#22c55e';
  const categories = isExpense ? EXPENSE_CATS : INCOME_CATS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.amount || parseFloat(form.amount) <= 0) {
      setError('Please enter a valid title and amount.');
      return;
    }
    setError('');
    setSaving(true);
    const userId = await persistentData.getUserId();
    if (!userId) { setError('Not logged in. Please sign in again.'); setSaving(false); return; }
    
    await persistentData.mutate('transactions', 'INSERT', {
      user_id: userId, 
      type, 
      title: form.title,
      amount: parseFloat(form.amount), 
      category: form.category,
      date: form.date, 
      via: form.via, 
      note: form.note || null,
      created_at: new Date().toISOString()
    });
    
    setSaving(false);
    setSuccess(true);
    setTimeout(() => navigate('/expenses'), 1400);
  };

  if (success) return (
    <div className="page" style={{ background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
      >
        <div style={{ width: 80, height: 80, borderRadius: '28px', background: `${accentColor}15`, border: `2px solid ${accentColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle2 size={40} color={accentColor} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900 }}>
          {isExpense ? 'Expense' : 'Income'} Added!
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Redirecting to Finance...</p>
      </motion.div>
    </div>
  );

  return (
    <div className="page" style={{ background: '#000' }}>
      {/* Header */}
      <header style={{ 
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '20px', position: 'sticky', top: 0, 
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 100 
      }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ width: 40, height: 40, borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <ArrowLeft size={18} color="var(--text-primary)" />
        </button>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1.5px' }}>FINANCE</div>
          <div style={{ fontSize: '1rem', fontWeight: 900 }}>Add Transaction</div>
        </div>
      </header>

      <div className="page-content" style={{ padding: '20px', paddingBottom: 100 }}>

        {/* Type Toggle */}
        <div style={{ 
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, 
          marginBottom: 28, background: 'var(--bg-card)', 
          border: '1px solid var(--border)', borderRadius: '18px', padding: 6 
        }}>
          {(['expense', 'income'] as const).map(t => (
            <motion.button
              key={t}
              onClick={() => { setType(t); setForm(f => ({ ...f, category: t === 'expense' ? 'Food' : 'Salary' })); }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: type === t ? (t === 'expense' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)') : 'transparent',
                color: type === t ? (t === 'expense' ? '#EF4444' : '#22c55e') : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontWeight: 800, fontSize: '0.9rem',
                transition: 'all 0.2s ease'
              }}
            >
              {t === 'expense' ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
              {t === 'expense' ? 'Expense' : 'Income'}
            </motion.button>
          ))}
        </div>

        {/* Amount Hero */}
        <div className="card" style={{ 
          padding: '28px 24px', marginBottom: 16, textAlign: 'center',
          border: `1px solid ${accentColor}30`, background: `${accentColor}06` 
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: accentColor, letterSpacing: '1.5px', marginBottom: 16 }}>
            {isExpense ? 'AMOUNT SPENT' : 'AMOUNT RECEIVED'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <IndianRupee size={28} color={accentColor} strokeWidth={2.5} />
            <input
              type="number"
              placeholder="0.00"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              min="0.01" step="0.01"
              style={{ 
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: '3rem', fontWeight: 900, color: 'var(--text-primary)',
                width: '180px', textAlign: 'center'
              }}
            />
          </div>
        </div>

        {/* Title */}
        <div className="card" style={{ padding: '4px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <Tag size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="What's this for?"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            style={{ 
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)',
              padding: '18px 0'
            }}
          />
        </div>

        {/* Category */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: 10 }}>CATEGORY</div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {categories.map(c => (
              <motion.button
                key={c}
                onClick={() => setForm(f => ({ ...f, category: c }))}
                whileTap={{ scale: 0.95 }}
                style={{
                  flexShrink: 0, padding: '10px 16px', borderRadius: '14px', border: '1px solid',
                  borderColor: form.category === c ? accentColor : 'var(--border)',
                  background: form.category === c ? `${accentColor}15` : 'var(--bg-card)',
                  color: form.category === c ? accentColor : 'var(--text-muted)',
                  fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{CAT_EMOJIS[c] || '📦'}</span> {c}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Payment & Date Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: 8 }}>VIA</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={14} color={accentColor} />
              <select
                value={form.via}
                onChange={e => setForm(f => ({ ...f, via: e.target.value }))}
                style={{ 
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: 'var(--text-primary)', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer'
                }}
              >
                {PAYMENT_METHODS.map(m => <option key={m} value={m} style={{ background: '#111' }}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: 8 }}>DATE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={14} color={accentColor} />
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                style={{ 
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: 'var(--text-primary)', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer'
                }}
              />
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="card" style={{ padding: '14px 20px', marginBottom: 28, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <AlignLeft size={16} color="var(--text-muted)" style={{ marginTop: 4, flexShrink: 0 }} />
          <textarea
            placeholder="Add a note (optional)"
            value={form.note}
            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            rows={2}
            style={{ 
              flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none',
              color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem',
              lineHeight: 1.6
            }}
          />
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ color: '#EF4444', fontSize: '0.82rem', marginBottom: 16, textAlign: 'center', fontWeight: 700 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Submit */}
        <motion.button
          onClick={handleSubmit as any}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={saving}
          style={{ 
            width: '100%', padding: '18px', borderRadius: '18px', border: 'none',
            background: accentColor,
            color: '#fff', fontSize: '1rem', fontWeight: 900, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: `0 8px 28px ${accentColor}40`,
            opacity: saving ? 0.7 : 1
          }}
        >
          {saving ? (
            <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          ) : (
            <>
              {isExpense ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
              Add {isExpense ? 'Expense' : 'Income'}
            </>
          )}
        </motion.button>

      </div>
      <BottomNav />
    </div>
  );
}
