import React, { useState, useMemo } from 'react';
import { useFinance } from './FinanceContext';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CATEGORIES = ['Food', 'Rent', 'Travel', 'Entertainment', 'Shopping', 'Health', 'Others'];

const CAT_COLORS = {
  Food: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
  Rent: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  Travel: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  Entertainment: { bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
  Shopping: { bg: 'rgba(236,72,153,0.15)', color: '#ec4899' },
  Health: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  Others: { bg: 'rgba(107,114,128,0.15)', color: '#6b7280' },
};

export default function ExpenseTracker() {
  const { expenses, addExpense, deleteExpense, totalExpenses } = useFinance();
  const [form, setForm] = useState({ title: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0] });
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const handleAdd = () => {
    if (!form.title || !form.amount || isNaN(form.amount)) return;
    addExpense({ ...form, amount: Number(form.amount) });
    setForm({ title: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0] });
  };

  const filtered = useMemo(() => {
    let list = expenses.filter(e => {
      const catMatch = filterCat === 'all' || e.category === filterCat;
      const monthMatch = filterMonth === 'all' || new Date(e.date).getMonth() === Number(filterMonth);
      const searchMatch = e.title.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase());
      return catMatch && monthMatch && searchMatch;
    });
    if (sortBy === 'amount') list = [...list].sort((a, b) => b.amount - a.amount);
    else if (sortBy === 'date') list = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
    return list;
  }, [expenses, filterCat, filterMonth, search, sortBy]);

  const filteredTotal = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <h2 className="page-title">💸 Expense Tracker</h2>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="summary-card" style={{ '--card-accent': 'linear-gradient(90deg,#ef4444,#dc2626)' }}>
          <div className="sc-icon">💸</div>
          <div className="sc-label">Total Spent</div>
          <div className="sc-value" style={{ color: 'var(--danger)' }}>₹{totalExpenses.toLocaleString()}</div>
        </div>
        {CATEGORIES.slice(0, 3).map(cat => {
          const catTotal = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
          const c = CAT_COLORS[cat];
          return (
            <div key={cat} className="summary-card" style={{ '--card-accent': `linear-gradient(90deg,${c.color},${c.color}88)` }}>
              <div className="sc-icon" style={{ opacity: 0.4 }}>
                {cat === 'Food' ? '🍽️' : cat === 'Rent' ? '🏠' : '✈️'}
              </div>
              <div className="sc-label">{cat}</div>
              <div className="sc-value" style={{ color: c.color }}>₹{catTotal.toLocaleString()}</div>
            </div>
          );
        })}
      </div>

      {/* Add Form */}
      <div className="card" style={{ marginBottom: 24 }}>
  <div className="section-title">➕ Add Expense</div>
  <div className="form-grid">

    <div className="form-group">
      <label>Title</label>
      <input className="form-input" type="text" placeholder="e.g. Grocery"
        value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
    </div>

    <div className="form-group">
      <label>Amount (₹)</label>
      <input className="form-input" type="number" placeholder="1500"
        value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
    </div>

    <div className="form-group">
      <label>Category</label>
      <select className="form-select" value={form.category}
        onChange={e => setForm({ ...form, category: e.target.value })}>
        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
      </select>
    </div>

    <div className="form-group">
      <label>Note</label>
      <input className="form-input" type="text" placeholder="Optional note"
        value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
    </div>

    <div className="form-group">
      <label>Date</label>
      <input className="form-input" type="date"
        value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
    </div>

    <div className="form-group">
      <label>&nbsp;</label>
      <button className="btn-primary" onClick={handleAdd}>Add Expense</button>
    </div>

  </div>
</div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
          <span className="search-icon">🔍</span>
          <input placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 140 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="form-select" style={{ width: 130 }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
          <option value="all">All Months</option>
          {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select className="form-select" style={{ width: 120 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="date">Sort: Date</option>
          <option value="amount">Sort: Amount</option>
        </select>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>{filtered.length} transactions shown</span>
        <span style={{ fontWeight: 700, color: 'var(--danger)' }}>Total: ₹{filteredTotal.toLocaleString()}</span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="emoji">🔍</div><p>No expenses found matching your filters.</p></div>
      ) : (
        <div className="data-list">
          {filtered.map(item => {
            const c = CAT_COLORS[item.category] || CAT_COLORS.Others;
            return (
              <div key={item.id} className="data-item">
                <div className="di-info">
                  <div className="di-title">{item.title}</div>
                  <div className="di-sub">📅 {item.date}</div>
                </div>
                <div className="di-right">
                  <span className="cat-badge" style={{ '--badge-bg': c.bg, '--badge-color': c.color }}>{item.category}</span>
                  <div className="di-amount amount-expense">-₹{item.amount.toLocaleString()}</div>
                  <button className="btn-danger" onClick={() => deleteExpense(item.id)}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
