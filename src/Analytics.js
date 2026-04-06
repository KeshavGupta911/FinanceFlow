import React, { useMemo } from 'react';
import { useFinance } from './FinanceContext';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from 'recharts';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const COLORS = ['#00d4aa','#7c3aed','#f59e0b','#ef4444','#3b82f6','#ec4899','#10b981'];

const CATEGORIES = ['Food', 'Rent', 'Travel', 'Entertainment', 'Shopping', 'Health', 'Others'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <strong>{label}</strong>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--accent)', marginTop: 4 }}>
          {p.name}: ₹{p.value?.toLocaleString()}
        </div>
      ))}
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <strong>{payload[0].name}</strong>
      <div style={{ color: payload[0].payload.fill, marginTop: 4 }}>₹{payload[0].value?.toLocaleString()}</div>
      <div style={{ color: 'var(--text3)' }}>{payload[0].payload.percent}%</div>
    </div>
  );
};

export default function Analytics() {
  const { income, expenses, totalExpenses } = useFinance();

  const pieData = useMemo(() => {
    const map = {};
    expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map).map(([name, value]) => ({
      name, value,
      percent: ((value / totalExpenses) * 100).toFixed(1),
    })).sort((a, b) => b.value - a.value);
  }, [expenses, totalExpenses]);

  const monthlyLine = useMemo(() => {
    const map = {};
    income.forEach(i => {
      const m = new Date(i.date).getMonth();
      if (!map[m]) map[m] = { month: MONTHS[m], income: 0, expenses: 0, savings: 0 };
      map[m].income += i.amount;
    });
    expenses.forEach(e => {
      const m = new Date(e.date).getMonth();
      if (!map[m]) map[m] = { month: MONTHS[m], income: 0, expenses: 0, savings: 0 };
      map[m].expenses += e.amount;
    });
    return Object.values(map).map(d => ({
      ...d,
      savings: d.income - d.expenses,
    })).sort((a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month));
  }, [income, expenses]);

  const catMonthly = useMemo(() => {
    const months = [...new Set(expenses.map(e => new Date(e.date).getMonth()))].sort();
    return months.map(m => {
      const row = { month: MONTHS[m] };
      CATEGORIES.forEach(cat => {
        row[cat] = expenses.filter(e => new Date(e.date).getMonth() === m && e.category === cat).reduce((s, e) => s + e.amount, 0);
      });
      return row;
    });
  }, [expenses]);

  return (
    <div>
      <h2 className="page-title">📈 Analytics</h2>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Pie Chart */}
        <div className="card">
          <div className="section-title">🥧 Expense by Category</div>
          {pieData.length === 0 ? (
            <div className="empty-state"><div className="emoji">📊</div><p>No expense data yet.</p></div>
          ) : (
            <>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend formatter={(v) => <span style={{ color: 'var(--text2)', fontSize: '0.8rem' }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {pieData.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text2)' }}>{d.name}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>₹{d.value.toLocaleString()}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text3)', width: 38, textAlign: 'right' }}>{d.percent}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Monthly Trend Line */}
        <div className="card">
          <div className="section-title">📉 Monthly Financial Trend</div>
          {monthlyLine.length === 0 ? (
            <div className="empty-state"><div className="emoji">📈</div><p>No data yet.</p></div>
          ) : (
            <div className="chart-wrapper" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyLine} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text3)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} name="Income" />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: '#ef4444', r: 4 }} name="Expenses" />
                  <Line type="monotone" dataKey="savings" stroke="#7c3aed" strokeWidth={2.5} dot={{ fill: '#7c3aed', r: 4 }} name="Savings" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Category Monthly Breakdown */}
      <div className="card">
        <div className="section-title">📊 Category Spending by Month</div>
        {catMonthly.length === 0 ? (
          <div className="empty-state"><div className="emoji">📊</div><p>No data yet.</p></div>
        ) : (
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catMonthly} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text3)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {CATEGORIES.map((cat, i) => (
                  <Bar key={cat} dataKey={cat} fill={COLORS[i % COLORS.length]} stackId="a" radius={i === CATEGORIES.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
