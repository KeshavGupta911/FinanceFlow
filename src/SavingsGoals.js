import React, { useState } from 'react';
import { useFinance } from './FinanceContext';

const EMOJIS = ['🎯','💻','✈️','🏠','🚗','📱','🎓','💍','🛡️','🌴','🏋️','🎸'];

export default function SavingsGoals() {
  const { goals, addGoal, updateGoalSaved, deleteGoal } = useFinance();
  const [form, setForm] = useState({ name: '', target: '', saved: '', emoji: '🎯' });
  const [depositAmounts, setDepositAmounts] = useState({});

  const handleAdd = () => {
    if (!form.name || !form.target) return;
    addGoal({ ...form, target: Number(form.target), saved: Number(form.saved || 0) });
    setForm({ name: '', target: '', saved: '', emoji: '🎯' });
  };

  const handleDeposit = (id) => {
    const amt = Number(depositAmounts[id] || 0);
    if (amt <= 0) return;
    updateGoalSaved(id, amt);
    setDepositAmounts(prev => ({ ...prev, [id]: '' }));
  };

  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
  const overallPct = totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : 0;

  return (
    <div>
      <h2 className="page-title">🎯 Savings Goals</h2>

      {/* Summary */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="summary-card" style={{ '--card-accent': 'linear-gradient(90deg,#00d4aa,#0891b2)' }}>
          <div className="sc-icon">🎯</div>
          <div className="sc-label">Total Goals</div>
          <div className="sc-value" style={{ color: 'var(--accent)' }}>{goals.length}</div>
          <div className="sc-sub">Active savings goals</div>
        </div>
        <div className="summary-card" style={{ '--card-accent': 'linear-gradient(90deg,#7c3aed,#6d28d9)' }}>
          <div className="sc-icon">💰</div>
          <div className="sc-label">Total Saved</div>
          <div className="sc-value" style={{ color: 'var(--accent2)' }}>₹{totalSaved.toLocaleString()}</div>
          <div className="sc-sub">of ₹{totalTarget.toLocaleString()} target</div>
        </div>
        <div className="summary-card" style={{ '--card-accent': 'linear-gradient(90deg,#10b981,#059669)' }}>
          <div className="sc-icon">📊</div>
          <div className="sc-label">Overall Progress</div>
          <div className="sc-value" style={{ color: 'var(--success)' }}>{overallPct}%</div>
          <div className="sc-sub">Across all goals</div>
        </div>
      </div>

      {/* Add Goal Form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">➕ Add New Goal</div>
        <div className="form-grid">
          <div className="form-group">
            <label>Goal Name</label>
            <input className="form-input" type="text" placeholder="e.g. New Laptop" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Target Amount (₹)</label>
            <input className="form-input" type="number" placeholder="50000" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Already Saved (₹)</label>
            <input className="form-input" type="number" placeholder="0" value={form.saved} onChange={e => setForm({ ...form, saved: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Pick Emoji</label>
            <select className="form-select" value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })}>
              {EMOJIS.map(e => <option key={e} value={e}>{e} {e}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>&nbsp;</label>
            <button className="btn-primary" onClick={handleAdd}>Add Goal</button>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="empty-state"><div className="emoji">🎯</div><p>No savings goals yet. Add one above!</p></div>
      ) : (
        <div className="grid-3">
          {goals.map(g => {
            const pct = Math.min((g.saved / g.target) * 100, 100);
            const remaining = g.target - g.saved;
            const isComplete = g.saved >= g.target;
            return (
              <div key={g.id} className="goal-card" style={isComplete ? { borderColor: 'var(--success)', boxShadow: '0 0 20px rgba(16,185,129,0.2)' } : {}}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="goal-emoji">{g.emoji}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {isComplete && <span style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 700, padding: '2px 10px', background: 'rgba(16,185,129,0.15)', borderRadius: 20 }}>✅ DONE!</span>}
                    <button className="btn-danger" onClick={() => deleteGoal(g.id)}>🗑</button>
                  </div>
                </div>
                <div className="goal-name">{g.name}</div>
                <div className="goal-pct">{pct.toFixed(0)}%</div>

                <div className="progress-bar-bg" style={{ marginBottom: 10 }}>
                  <div className="progress-bar-fill" style={{ width: `${pct}%`, background: isComplete ? 'linear-gradient(90deg, var(--success), #34d399)' : undefined }} />
                </div>

                <div className="goal-amounts">
                  <span>Saved: <strong style={{ color: 'var(--success)' }}>₹{g.saved.toLocaleString()}</strong></span>
                  <span>Target: <strong>₹{g.target.toLocaleString()}</strong></span>
                </div>

                {!isComplete && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginBottom: 12 }}>
                    ₹{remaining.toLocaleString()} more to go!
                  </div>
                )}

                {!isComplete && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="form-input"
                      type="number"
                      placeholder="Add ₹"
                      style={{ flex: 1, padding: '7px 10px', fontSize: '0.85rem' }}
                      value={depositAmounts[g.id] || ''}
                      onChange={e => setDepositAmounts(prev => ({ ...prev, [g.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleDeposit(g.id)}
                    />
                    <button className="btn-success" onClick={() => handleDeposit(g.id)}>+Add</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
