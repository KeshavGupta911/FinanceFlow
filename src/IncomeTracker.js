import React, { useState, useMemo } from 'react';
import { useFinance } from './FinanceContext';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const SOURCES = ['Salary','Freelance','Business','Investment','Gift','Other'];

export default function IncomeTracker() {
  const { income, addIncome, deleteIncome, totalIncome } = useFinance();
  const [form, setForm] = useState({ source: 'Salary', amount: '', date: new Date().toISOString().split('T')[0], note: '' });
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');

  const handleAdd = () => {
    if (!form.amount || isNaN(form.amount)) return;
    addIncome({ ...form, amount: Number(form.amount) });
    setForm({ source: 'Salary', amount: '', date: new Date().toISOString().split('T')[0], note: '' });
  };

  const filtered = useMemo(() => {
    return income.filter(i => {
      const monthMatch = filterMonth === 'all' || new Date(i.date).getMonth() === Number(filterMonth);
      const searchMatch = i.source.toLowerCase().includes(search.toLowerCase()) || i.note?.toLowerCase().includes(search.toLowerCase());
      return monthMatch && searchMatch;
    });
  }, [income, filterMonth, search]);

  const monthlyTotals = useMemo(() => {
    const map = {};
    income.forEach(i => {
      const m = new Date(i.date).getMonth();
      map[m] = (map[m] || 0) + i.amount;
    });
    return map;
  }, [income]);

  return (
    <div>
      <h2 className="page-title">💰 Income Tracker</h2>

      {/* Summary */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="summary-card" style={{ '--card-accent': 'linear-gradient(90deg,#10b981,#059669)' }}>
          <div className="sc-icon">📥</div>
          <div className="sc-label">Lifetime Income</div>
          <div className="sc-value" style={{ color: 'var(--success)' }}>₹{totalIncome.toLocaleString()}</div>
          <div className="sc-sub">{income.length} total entries</div>
        </div>
        <div className="summary-card" style={{ '--card-accent': 'linear-gradient(90deg,#00d4aa,#0891b2)' }}>
          <div className="sc-icon">📅</div>
          <div className="sc-label">This Month</div>
          <div className="sc-value" style={{ color: 'var(--accent)' }}>
            ₹{(monthlyTotals[new Date().getMonth()] || 0).toLocaleString()}
          </div>
          <div className="sc-sub">{MONTHS[new Date().getMonth()]} earnings</div>
        </div>
        <div className="summary-card" style={{ '--card-accent': 'linear-gradient(90deg,#7c3aed,#6d28d9)' }}>
          <div className="sc-icon">📊</div>
          <div className="sc-label">Avg Monthly</div>
          <div className="sc-value" style={{ color: 'var(--accent2)' }}>
            ₹{Object.keys(monthlyTotals).length > 0 ? Math.round(totalIncome / Object.keys(monthlyTotals).length).toLocaleString() : 0}
          </div>
          <div className="sc-sub">Per active month</div>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">➕ Add Income</div>
        <div className="form-grid">
          <div className="form-group">
            <label>Source</label>
            <select className="form-select" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
              {SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Amount (₹)</label>
            <input className="form-input" type="number" placeholder="50000" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Note</label>
            <input className="form-input" type="text" placeholder="Optional note" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
          </div>
          <div className="form-group">
            <label>&nbsp;</label>
            <button className="btn-primary" onClick={handleAdd}>Add Income</button>
          </div>
        </div>
      </div>

      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input placeholder="Search by source or note..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-select" style={{ width: 140 }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
          <option value="all">All Months</option>
          {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="emoji">💸</div><p>No income entries found.</p></div>
      ) : (
        <div className="data-list">
          {filtered.map(item => (
            <div key={item.id} className="data-item">
              <div className="di-info">
                <div className="di-title">{item.source}</div>
                <div className="di-sub">📅 {item.date} {item.note && `• ${item.note}`}</div>
              </div>
              <div className="di-right">
                <div className="di-amount amount-income">+₹{item.amount.toLocaleString()}</div>
                <button className="btn-danger" onClick={() => deleteIncome(item.id)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
