import React, { useState, useMemo } from 'react';
import { useFinance } from './FinanceContext';

const CATEGORIES = ['Food', 'Rent', 'Travel', 'Entertainment', 'Shopping', 'Health', 'Others'];

const CAT_EMOJI = { Food: '🍽️', Rent: '🏠', Travel: '✈️', Entertainment: '🎭', Shopping: '🛍️', Health: '💊', Others: '📦' };

export default function BudgetPlanner() {
  const { budgets, updateBudget, expenses } = useFinance();
  const [editValues, setEditValues] = useState({});

  const thisMonth = new Date().getMonth();

  const catSpent = useMemo(() => {
    const map = {};
    expenses.filter(e => new Date(e.date).getMonth() === thisMonth).forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return map;
  }, [expenses, thisMonth]);

  const handleSave = (cat) => {
    if (editValues[cat] !== undefined) {
      updateBudget(cat, editValues[cat]);
      setEditValues(prev => { const n = { ...prev }; delete n[cat]; return n; });
    }
  };

  const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0);
  const totalSpent = Object.values(catSpent).reduce((s, v) => s + v, 0);
  const overBudgetCats = CATEGORIES.filter(c => catSpent[c] > budgets[c] && budgets[c] > 0);

  return (
    <div>
      <h2 className="page-title">📋 Budget Planner</h2>

      {/* Overview */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="summary-card" style={{ '--card-accent': 'linear-gradient(90deg,#7c3aed,#6d28d9)' }}>
          <div className="sc-icon">📋</div>
          <div className="sc-label">Total Budget</div>
          <div className="sc-value" style={{ color: 'var(--accent2)' }}>₹{totalBudget.toLocaleString()}</div>
          <div className="sc-sub">Across all categories</div>
        </div>
        <div className="summary-card" style={{ '--card-accent': 'linear-gradient(90deg,#ef4444,#dc2626)' }}>
          <div className="sc-icon">💸</div>
          <div className="sc-label">Spent This Month</div>
          <div className="sc-value" style={{ color: 'var(--danger)' }}>₹{totalSpent.toLocaleString()}</div>
          <div className="sc-sub">{((totalSpent/totalBudget)*100 || 0).toFixed(0)}% of budget used</div>
        </div>
        <div className="summary-card" style={{ '--card-accent': overBudgetCats.length > 0 ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'linear-gradient(90deg,#10b981,#059669)' }}>
          <div className="sc-icon">🚨</div>
          <div className="sc-label">Alerts</div>
          <div className="sc-value" style={{ color: overBudgetCats.length > 0 ? 'var(--accent3)' : 'var(--success)' }}>
            {overBudgetCats.length}
          </div>
          <div className="sc-sub">{overBudgetCats.length === 0 ? 'No overruns!' : `${overBudgetCats.join(', ')} over budget`}</div>
        </div>
      </div>

      {overBudgetCats.length > 0 && (
        <div className="card" style={{ marginBottom: 24, borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '2rem' }}>🚨</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: 4 }}>Budget Exceeded!</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text2)' }}>
                You've exceeded your budget in: <strong>{overBudgetCats.join(', ')}</strong>. Consider reviewing your spending or adjusting your budget.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Cards */}
      <div className="grid-3">
        {CATEGORIES.map(cat => {
          const budget = budgets[cat] || 0;
          const spent = catSpent[cat] || 0;
          const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
          const isOver = spent > budget && budget > 0;
          const isWarning = pct >= 80 && !isOver;
          const remaining = budget - spent;

          return (
            <div key={cat} className="budget-item">
              <div className="budget-header">
                <div className="budget-cat">
                  <span>{CAT_EMOJI[cat]}</span>
                  <span>{cat}</span>
                </div>
                {isOver && <span style={{ fontSize: '0.72rem', color: 'var(--danger)', fontWeight: 700, padding: '2px 8px', background: 'rgba(239,68,68,0.15)', borderRadius: 20 }}>OVER!</span>}
                {isWarning && <span style={{ fontSize: '0.72rem', color: 'var(--accent3)', fontWeight: 700, padding: '2px 8px', background: 'rgba(245,158,11,0.15)', borderRadius: 20 }}>WARNING</span>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text3)', marginBottom: 8 }}>
                <span>Spent: <strong style={{ color: isOver ? 'var(--danger)' : 'var(--text)' }}>₹{spent.toLocaleString()}</strong></span>
                <span>Budget: <strong style={{ color: 'var(--text)' }}>₹{budget.toLocaleString()}</strong></span>
              </div>

              <div className="progress-bar-bg">
                <div
                  className={`progress-bar-fill ${isOver ? 'danger' : isWarning ? 'warning' : ''}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: 6 }}>
                <span style={{ color: 'var(--text3)' }}>{pct.toFixed(0)}% used</span>
                <span style={{ color: remaining >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                  {remaining >= 0 ? `₹${remaining.toLocaleString()} left` : `₹${Math.abs(remaining).toLocaleString()} over`}
                </span>
              </div>

              <div className="budget-input-row">
                <input
                  className="form-input"
                  type="number"
                  placeholder={`Set budget ₹`}
                  value={editValues[cat] ?? budget}
                  onChange={e => setEditValues(prev => ({ ...prev, [cat]: e.target.value }))}
                />
                <button className="btn-success" onClick={() => handleSave(cat)}>Save</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
