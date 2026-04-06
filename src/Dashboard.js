import React, { useMemo } from 'react';
import { useFinance } from './FinanceContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Area, AreaChart,
} from 'recharts';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <strong>{label}</strong>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginTop: 4 }}>
          {p.name}: ₹{p.value?.toLocaleString()}
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { balance, totalIncome, totalExpenses, income, expenses, budgets } = useFinance();

  const savings = totalIncome - totalExpenses;
  const savingRate = totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : 0;

  const monthlyData = useMemo(() => {
    const map = {};
    income.forEach(i => {
      const m = new Date(i.date).getMonth();
      if (!map[m]) map[m] = { month: MONTHS[m], income: 0, expenses: 0 };
      map[m].income += i.amount;
    });
    expenses.forEach(e => {
      const m = new Date(e.date).getMonth();
      if (!map[m]) map[m] = { month: MONTHS[m], income: 0, expenses: 0 };
      map[m].expenses += e.amount;
    });
    return Object.values(map).sort((a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month));
  }, [income, expenses]);

  // Smart insights
  const insights = useMemo(() => {
    const list = [];
    const now = new Date();
    const thisMonth = now.getMonth();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;

    const thisExp = expenses.filter(e => new Date(e.date).getMonth() === thisMonth).reduce((s, e) => s + e.amount, 0);
    const lastExp = expenses.filter(e => new Date(e.date).getMonth() === lastMonth).reduce((s, e) => s + e.amount, 0);

    if (lastExp > 0) {
      const diff = ((thisExp - lastExp) / lastExp * 100).toFixed(1);
      if (diff > 0) list.push({ icon: '📈', text: `You spent <strong>₹${(thisExp - lastExp).toLocaleString()}</strong> more this month than last month (+${diff}%).` });
      else list.push({ icon: '📉', text: `Great! You spent <strong>₹${Math.abs(thisExp - lastExp).toLocaleString()}</strong> less this month (${diff}%).` });
    }

    const catTotals = {};
    expenses.filter(e => new Date(e.date).getMonth() === thisMonth).forEach(e => {
      catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
    });
    const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
    if (topCat) list.push({ icon: '🍽️', text: `Your top spending category this month is <strong>${topCat[0]}</strong> at ₹${topCat[1].toLocaleString()}.` });

    const exceeded = Object.entries(budgets).filter(([cat, limit]) => (catTotals[cat] || 0) > limit && limit > 0);
    if (exceeded.length > 0) list.push({ icon: '🚨', text: `Budget exceeded in: <strong>${exceeded.map(e => e[0]).join(', ')}</strong>. Review your spending!` });

    if (savingRate >= 20) list.push({ icon: '🌟', text: `Excellent! You're saving <strong>${savingRate}%</strong> of your income this period.` });
    else if (savingRate < 10) list.push({ icon: '⚠️', text: `Your saving rate is only <strong>${savingRate}%</strong>. Try to aim for at least 20%.` });

    return list;
  }, [expenses, budgets, savingRate]);

  return (
    <div>
      <h2 className="page-title">📊 Dashboard Overview</h2>

      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="summary-card" style={{ '--card-accent': 'linear-gradient(90deg,#00d4aa,#00b894)' }}>
          <div className="sc-icon">💰</div>
          <div className="sc-label">Total Balance</div>
          <div className="sc-value" style={{ color: balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            ₹{Math.abs(balance).toLocaleString()}
          </div>
          <div className="sc-sub">{balance >= 0 ? 'In surplus' : 'In deficit'}</div>
          <div className={`sc-trend ${balance >= 0 ? 'trend-up' : 'trend-down'}`}>
            {balance >= 0 ? '▲' : '▼'} {savingRate}% saving rate
          </div>
        </div>

        <div className="summary-card" style={{ '--card-accent': 'linear-gradient(90deg,#10b981,#059669)' }}>
          <div className="sc-icon">📥</div>
          <div className="sc-label">Total Income</div>
          <div className="sc-value" style={{ color: 'var(--success)' }}>₹{totalIncome.toLocaleString()}</div>
          <div className="sc-sub">{income.length} transactions</div>
          <div className="sc-trend trend-up">▲ Lifetime total</div>
        </div>

        <div className="summary-card" style={{ '--card-accent': 'linear-gradient(90deg,#ef4444,#dc2626)' }}>
          <div className="sc-icon">📤</div>
          <div className="sc-label">Total Expenses</div>
          <div className="sc-value" style={{ color: 'var(--danger)' }}>₹{totalExpenses.toLocaleString()}</div>
          <div className="sc-sub">{expenses.length} transactions</div>
          <div className="sc-trend trend-down">▼ Lifetime total</div>
        </div>

        <div className="summary-card" style={{ '--card-accent': 'linear-gradient(90deg,#7c3aed,#6d28d9)' }}>
          <div className="sc-icon">🏦</div>
          <div className="sc-label">Net Savings</div>
          <div className="sc-value" style={{ color: 'var(--accent2)' }}>₹{savings.toLocaleString()}</div>
          <div className="sc-sub">After all expenses</div>
          <div className="sc-trend trend-up">🎯 {savingRate}% rate</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="section-title">📊 Monthly Income vs Expenses</div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text3)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="income" fill="#10b981" radius={[6,6,0,0]} name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" radius={[6,6,0,0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="section-title">📈 Savings Trend</div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="incG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00d4aa" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d4aa" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text3)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="income" stroke="#00d4aa" fill="url(#incG)" strokeWidth={2} name="Income" />
                <Area type="monotone" dataKey="expenses" stroke="#7c3aed" fill="url(#expG)" strokeWidth={2} name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Smart Insights */}
      <div className="card">
        <div className="section-title">🧠 Smart Insights</div>
        {insights.length === 0 ? (
          <div className="empty-state"><p>Add more transactions to see insights.</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {insights.map((ins, i) => (
              <div key={i} className="insight-card">
                <div className="insight-icon">{ins.icon}</div>
                <div className="insight-text" dangerouslySetInnerHTML={{ __html: ins.text }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* About this Project */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="section-title">📌 About This Project</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>

          {/* Description */}
          <p style={{ color: 'var(--text2)', lineHeight: 1.8, fontSize: 15 }}>
            <strong style={{ color: 'var(--text)' }}>FinanceFlow</strong> is a personal finance dashboard
            built for Indian users to track income, manage expenses, plan budgets, set savings goals,
            visualise analytics, and estimate income tax liability under both Old and New regimes (FY 2024-25).
            All data is stored locally in your browser — no server, no sign-up required.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              '📊 Dashboard & Charts',
              '💰 Income Tracker',
              '💸 Expense Tracker',
              '📋 Budget Planner',
              '📈 Analytics',
              '🎯 Savings Goals',
              '🧾 Tax Estimator (80C / 80D / HRA)',
              '🌙 Dark / Light Mode',
              '⬇️ CSV & JSON Export',
            ].map(f => (
              <span key={f} style={{
                padding: '5px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                background: 'var(--bg3)',
                color: 'var(--text2)',
                border: '1px solid var(--card-border)',
              }}>
                {f}
              </span>
            ))}
          </div>

          {/* Tech stack */}
          <div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.04em' }}>
              TECH STACK
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { label: 'React 18', color: '#61dafb' },
                { label: 'Recharts', color: '#00d4aa' },
                { label: 'localStorage', color: '#f59e0b' },
                { label: 'CSS Variables', color: '#7c3aed' },
                { label: 'Indian Tax Slabs FY24-25', color: '#10b981' },
              ].map(({ label, color }) => (
                <span key={label} style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  background: `${color}18`,
                  color: color,
                  border: `1px solid ${color}40`,
                }}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Source Code block */}
          <div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.04em' }}>
              💻 SOURCE CODE SNIPPET
            </div>
            <pre style={{
              background: 'var(--bg)',
              border: '1px solid var(--card-border)',
              borderRadius: 10,
              padding: '16px 18px',
              overflowX: 'auto',
              fontSize: 12,
              lineHeight: 1.7,
              color: 'var(--text2)',
              fontFamily: "'Courier New', Courier, monospace",
            }}>{`// FinanceFlow — Dashboard.js (core logic)
import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';

export default function Dashboard() {
  const { balance, totalIncome, totalExpenses,
          income, expenses, budgets } = useFinance();

  const savings    = totalIncome - totalExpenses;
  const savingRate = totalIncome > 0
    ? ((savings / totalIncome) * 100).toFixed(1)
    : 0;

  // Smart Insights — auto-generated from your data
  const insights = useMemo(() => {
    const list = [];
    const thisMonth = new Date().getMonth();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;

    const thisExp = expenses
      .filter(e => new Date(e.date).getMonth() === thisMonth)
      .reduce((s, e) => s + e.amount, 0);

    const lastExp = expenses
      .filter(e => new Date(e.date).getMonth() === lastMonth)
      .reduce((s, e) => s + e.amount, 0);

    if (lastExp > 0) {
      const diff = ((thisExp - lastExp) / lastExp * 100).toFixed(1);
      list.push({ icon: diff > 0 ? '📈' : '📉',
        text: \`Spent ₹\${Math.abs(thisExp-lastExp).toLocaleString()}
               \${diff > 0 ? 'more' : 'less'} than last month (\${diff}%)\`
      });
    }
    return list;
  }, [expenses, budgets, savingRate]);
}`}</pre>
          </div>

          {/* Portfolio link */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
            <a
              href="https://keshavgupta-resume.tiiny.site"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10,
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                border: 'none',
                color: '#fff',
                textDecoration: 'none',
                fontSize: 14, fontWeight: 600,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              View Portfolio
            </a>
          </div>

          {/* Built by */}
          <div style={{ fontSize: 13, color: 'var(--text3)', borderTop: '1px solid var(--card-border)', paddingTop: 14 }}>
            Built by <strong style={{ color: 'var(--accent)' }}>Keshav Gupta</strong> · Personal Finance Dashboard for Indian users · FY 2024-25
          </div>
        </div>
      </div>
    </div>
  );
}
