import React, { useState, useMemo } from 'react';
import { useFinance } from './FinanceContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

// ─── Indian Tax Slabs FY 2024-25 ───────────────────────────────────────────
const NEW_REGIME_SLABS = [
  { min: 0,       max: 300000,  rate: 0    },
  { min: 300000,  max: 600000,  rate: 0.05 },
  { min: 600000,  max: 900000,  rate: 0.10 },
  { min: 900000,  max: 1200000, rate: 0.15 },
  { min: 1200000, max: 1500000, rate: 0.20 },
  { min: 1500000, max: Infinity,rate: 0.30 },
];

const OLD_REGIME_SLABS = [
  { min: 0,       max: 250000,  rate: 0    },
  { min: 250000,  max: 500000,  rate: 0.05 },
  { min: 500000,  max: 1000000, rate: 0.20 },
  { min: 1000000, max: Infinity,rate: 0.30 },
];

function calcSlabTax(income, slabs) {
  let tax = 0;
  for (const slab of slabs) {
    if (income <= slab.min) break;
    const taxable = Math.min(income, slab.max) - slab.min;
    tax += taxable * slab.rate;
  }
  return Math.max(0, tax);
}

function calcTax(grossIncome, deductions, regime) {
  const standardDeduction = regime === 'new' ? 75000 : 50000;
  const totalDeductions = regime === 'new'
    ? standardDeduction
    : standardDeduction + Object.values(deductions).reduce((s, v) => s + (Number(v) || 0), 0);
  const taxableIncome = Math.max(0, grossIncome - totalDeductions);
  const slabs = regime === 'new' ? NEW_REGIME_SLABS : OLD_REGIME_SLABS;
  let baseTax = calcSlabTax(taxableIncome, slabs);

  // Rebate 87A: zero tax if taxable income ≤ 7L (new) or 5L (old)
  const rebateLimit = regime === 'new' ? 700000 : 500000;
  if (taxableIncome <= rebateLimit) baseTax = 0;

  const cess = baseTax * 0.04; // 4% health & education cess
  return {
    taxableIncome,
    totalDeductions,
    baseTax,
    cess,
    total: baseTax + cess,
    standardDeduction,
  };
}

// ─── Deduction sections ──────────────────────────────────────────────────
const DEDUCTION_SECTIONS = [
  {
    id: '80C', label: 'Section 80C', max: 150000,
    icon: '🏛️', color: '#7c3aed',
    desc: 'PPF, ELSS, LIC, EPF, NSC, home loan principal, children\'s tuition',
    fields: [
      { key: 'ppf',      label: 'PPF Contribution' },
      { key: 'elss',     label: 'ELSS Mutual Funds' },
      { key: 'lic',      label: 'LIC Premium' },
      { key: 'epf',      label: 'EPF (employee share)' },
      { key: 'nsc',      label: 'NSC / Tax Saver FD' },
      { key: 'homeLoan', label: 'Home Loan Principal' },
      { key: 'tuition',  label: "Children's Tuition" },
    ],
  },
  {
    id: '80D', label: 'Section 80D', max: 75000,
    icon: '💊', color: '#10b981',
    desc: 'Health insurance premiums for self (₹25k), parents (₹25k), senior parents (₹50k)',
    fields: [
      { key: 'healthSelf',    label: 'Health Insurance – Self/Family (max ₹25k)' },
      { key: 'healthParents', label: 'Health Insurance – Parents (max ₹25k)' },
      { key: 'preventive',    label: 'Preventive Health Checkup (max ₹5k)' },
    ],
  },
  {
    id: 'HRA', label: 'HRA Exemption', max: null,
    icon: '🏠', color: '#f59e0b',
    desc: 'House Rent Allowance — min of: actual HRA, 50%/40% of basic, rent paid − 10% of basic',
    fields: [
      { key: 'hraReceived',  label: 'HRA Received from Employer' },
      { key: 'basicSalary',  label: 'Basic Salary' },
      { key: 'rentPaid',     label: 'Annual Rent Paid' },
      { key: 'metroCity',    label: null, type: 'toggle', toggleLabel: 'Metro city (Mumbai/Delhi/Kolkata/Chennai)' },
    ],
  },
  {
    id: '80E', label: 'Section 80E', max: null,
    icon: '🎓', color: '#3b82f6',
    desc: 'Interest on education loan (no upper limit, for up to 8 years)',
    fields: [
      { key: 'educationLoan', label: 'Education Loan Interest Paid' },
    ],
  },
  {
    id: '80G', label: 'Section 80G', max: null,
    icon: '🤝', color: '#ec4899',
    desc: '50%–100% deduction on donations to approved funds/charities',
    fields: [
      { key: 'donations100', label: 'Donations (100% deductible)' },
      { key: 'donations50',  label: 'Donations (50% deductible)' },
    ],
  },
  {
    id: '80TTA', label: '80TTA / 80TTB', max: 50000,
    icon: '🏦', color: '#00d4aa',
    desc: 'Savings account interest (80TTA, max ₹10k) or all interest for seniors (80TTB, max ₹50k)',
    fields: [
      { key: 'savingsInterest', label: 'Savings/FD Interest Earned' },
      { key: 'seniorCitizen',   label: null, type: 'toggle', toggleLabel: 'Senior Citizen (60+) — use 80TTB' },
    ],
  },
];

const COLORS_PIE = ['#00d4aa', '#7c3aed', '#ef4444', '#f59e0b'];

const fmt = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

export default function TaxEstimator() {
  const { totalIncome } = useFinance();

  const [grossIncome, setGrossIncome] = useState(() => Math.round(totalIncome / 12) * 12 || 800000);
  const [regime, setRegime] = useState('both'); // 'old' | 'new' | 'both'
  const [deductions, setDeductions] = useState({
    // 80C
    ppf: 50000, elss: 0, lic: 0, epf: 50000, nsc: 0, homeLoan: 0, tuition: 0,
    // 80D
    healthSelf: 25000, healthParents: 0, preventive: 5000,
    // HRA
    hraReceived: 0, basicSalary: 0, rentPaid: 0, metroCity: false,
    // 80E
    educationLoan: 0,
    // 80G
    donations100: 0, donations50: 0,
    // 80TTA/TTB
    savingsInterest: 0, seniorCitizen: false,
  });
  const [openSections, setOpenSections] = useState({ '80C': true });

  const setField = (key, val) =>
    setDeductions(prev => ({ ...prev, [key]: val }));

  // ─── HRA calc ─────────────────────────────────────────────────────────
  const hraExemption = useMemo(() => {
    const { hraReceived, basicSalary, rentPaid, metroCity } = deductions;
    if (!hraReceived || !basicSalary || !rentPaid) return 0;
    const pct = metroCity ? 0.5 : 0.4;
    const a = Number(hraReceived);
    const b = Number(basicSalary) * pct;
    const c = Math.max(0, Number(rentPaid) - Number(basicSalary) * 0.1);
    return Math.min(a, b, c);
  }, [deductions]);

  // ─── 80C cap ──────────────────────────────────────────────────────────
  const c80C = Math.min(150000,
    ['ppf','elss','lic','epf','nsc','homeLoan','tuition']
      .reduce((s, k) => s + (Number(deductions[k]) || 0), 0)
  );

  // ─── 80D cap ──────────────────────────────────────────────────────────
  const self80D = Math.min(25000, Number(deductions.healthSelf) || 0);
  const parent80D = Math.min(25000, Number(deductions.healthParents) || 0);
  const prev80D = Math.min(5000, Number(deductions.preventive) || 0);
  const c80D = Math.min(75000, self80D + parent80D + prev80D);

  // ─── 80TTA/TTB cap ────────────────────────────────────────────────────
  const tta_max = deductions.seniorCitizen ? 50000 : 10000;
  const c80TTA = Math.min(tta_max, Number(deductions.savingsInterest) || 0);

  // ─── 80G ──────────────────────────────────────────────────────────────
  const c80G = (Number(deductions.donations100) || 0)
             + (Number(deductions.donations50) || 0) * 0.5;

  // ─── Build deduction map for calcTax ──────────────────────────────────
  const effectiveDeductions = {
    '80C': c80C,
    '80D': c80D,
    HRA:   hraExemption,
    '80E': Number(deductions.educationLoan) || 0,
    '80G': c80G,
    '80TTA': c80TTA,
  };

  const oldResult = calcTax(grossIncome, effectiveDeductions, 'old');
  const newResult = calcTax(grossIncome, {}, 'new');

  const saving = oldResult.total - newResult.total;
  const recommended = saving > 0 ? 'new' : 'old';

  // ─── Monthly breakdown data ────────────────────────────────────────────
  const pieOld = [
    { name: 'Tax + Cess', value: Math.round(oldResult.total) },
    { name: 'Deductions', value: Math.round(oldResult.totalDeductions) },
    { name: 'Take-home', value: Math.round(grossIncome - oldResult.total) },
  ].filter(d => d.value > 0);

  const compareData = [
    {
      name: 'Old Regime',
      taxable: Math.round(oldResult.taxableIncome / 1000),
      tax: Math.round(oldResult.total / 1000),
    },
    {
      name: 'New Regime',
      taxable: Math.round(newResult.taxableIncome / 1000),
      tax: Math.round(newResult.total / 1000),
    },
  ];

  const toggleSection = (id) =>
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div>
      <h2 className="page-title">🧾 Tax Estimator — FY 2024-25</h2>

      {/* Income Input */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">💼 Annual Gross Income</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>
              Enter your gross salary / total annual income
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--accent)', fontWeight: 700, fontSize: 16,
              }}>₹</span>
              <input
                className="form-input"
                type="number"
                value={grossIncome}
                onChange={e => setGrossIncome(Number(e.target.value) || 0)}
                style={{ paddingLeft: 32 }}
              />
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>Monthly equivalent</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>
              {fmt(grossIncome / 12)}/mo
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>Auto-filled from</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>your income data</div>
            <button
              className="btn-sm"
              style={{ marginTop: 6 }}
              onClick={() => setGrossIncome(Math.round(totalIncome))}
            >
              Use ₹{Math.round(totalIncome).toLocaleString('en-IN')}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="summary-card" style={{ '--card-accent': 'linear-gradient(90deg,#7c3aed,#6d28d9)' }}>
          <div className="sc-icon">📜</div>
          <div className="sc-label">Old Regime Tax</div>
          <div className="sc-value" style={{ color: 'var(--accent2)' }}>{fmt(oldResult.total)}</div>
          <div className="sc-sub">After all deductions</div>
          <div className="sc-trend" style={{ color: recommended === 'old' ? 'var(--success)' : 'var(--text3)' }}>
            {recommended === 'old' ? '✅ Recommended' : `₹${Math.abs(Math.round(saving)).toLocaleString('en-IN')} more`}
          </div>
        </div>
        <div className="summary-card" style={{ '--card-accent': 'linear-gradient(90deg,#00d4aa,#0891b2)' }}>
          <div className="sc-icon">🆕</div>
          <div className="sc-label">New Regime Tax</div>
          <div className="sc-value" style={{ color: 'var(--accent)' }}>{fmt(newResult.total)}</div>
          <div className="sc-sub">Standard deduction ₹75k</div>
          <div className="sc-trend" style={{ color: recommended === 'new' ? 'var(--success)' : 'var(--text3)' }}>
            {recommended === 'new' ? '✅ Recommended' : `₹${Math.abs(Math.round(saving)).toLocaleString('en-IN')} more`}
          </div>
        </div>
        <div className="summary-card" style={{ '--card-accent': 'linear-gradient(90deg,#10b981,#059669)' }}>
          <div className="sc-icon">💰</div>
          <div className="sc-label">Total Deductions</div>
          <div className="sc-value" style={{ color: 'var(--success)' }}>{fmt(oldResult.totalDeductions)}</div>
          <div className="sc-sub">Old regime (incl. std. ded.)</div>
          <div className="sc-trend trend-up">▲ Reducing taxable income</div>
        </div>
        <div className="summary-card" style={{ '--card-accent': saving > 0 ? 'linear-gradient(90deg,#10b981,#059669)' : 'linear-gradient(90deg,#f59e0b,#d97706)' }}>
          <div className="sc-icon">{saving > 0 ? '🎉' : '💡'}</div>
          <div className="sc-label">You save by choosing</div>
          <div className="sc-value" style={{ color: saving > 0 ? 'var(--success)' : 'var(--accent3)' }}>
            {saving > 0 ? 'New Regime' : 'Old Regime'}
          </div>
          <div className="sc-sub">by {fmt(Math.abs(saving))} / year</div>
          <div className="sc-trend" style={{ color: 'var(--text3)' }}>
            {fmt(Math.abs(saving) / 12)}/month difference
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="section-title">📊 Regime Comparison</div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compareData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text3)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} tickFormatter={v => `₹${v}k`} />
                <Tooltip
                  formatter={(v, name) => [`₹${(v * 1000).toLocaleString('en-IN')}`, name === 'taxable' ? 'Taxable Income' : 'Tax Payable']}
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 10 }}
                  labelStyle={{ color: 'var(--text)' }}
                />
                <Legend />
                <Bar dataKey="taxable" fill="#7c3aed" radius={[6,6,0,0]} name="Taxable Income (₹k)" />
                <Bar dataKey="tax" fill="#ef4444" radius={[6,6,0,0]} name="Tax Payable (₹k)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="section-title">🥧 Income Breakdown (Old Regime)</div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieOld}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: 'var(--text3)', strokeWidth: 0.5 }}
                >
                  {pieOld.map((_, i) => <Cell key={i} fill={COLORS_PIE[i]} />)}
                </Pie>
                <Tooltip
                  formatter={(v) => [fmt(v)]}
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 10 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Deduction Builder */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>
          📝 Deductions Builder — Old Regime
        </div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
          Fill in your actual investments and expenses. Caps are applied automatically.
        </div>

        {DEDUCTION_SECTIONS.map(section => {
          const isOpen = openSections[section.id];
          const effectiveAmt = effectiveDeductions[section.id] ?? 0;

          return (
            <div
              key={section.id}
              style={{
                border: '1px solid var(--card-border)',
                borderRadius: 12,
                marginBottom: 12,
                overflow: 'hidden',
              }}
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 18px',
                  background: isOpen ? 'var(--bg3)' : 'var(--bg2)',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.2s',
                }}
              >
                <span style={{ fontSize: 20 }}>{section.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: section.color, fontSize: 15 }}>{section.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{section.desc}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: effectiveAmt > 0 ? section.color : 'var(--text3)' }}>
                    {fmt(effectiveAmt)}
                  </div>
                  {section.max && (
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>max {fmt(section.max)}</div>
                  )}
                </div>
                <span style={{ color: 'var(--text3)', fontSize: 18, marginLeft: 8 }}>
                  {isOpen ? '▲' : '▼'}
                </span>
              </button>

              {/* Section Fields */}
              {isOpen && (
                <div style={{ padding: '16px 18px', background: 'var(--bg)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {section.fields.map(field => {
                    if (field.type === 'toggle') {
                      return (
                        <label key={field.key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: 'var(--text2)' }}>
                          <input
                            type="checkbox"
                            checked={!!deductions[field.key]}
                            onChange={e => setField(field.key, e.target.checked)}
                            style={{ width: 16, height: 16, cursor: 'pointer' }}
                          />
                          {field.toggleLabel}
                        </label>
                      );
                    }
                    return (
                      <div key={field.key} style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 12 }}>
                        <label style={{ fontSize: 13, color: 'var(--text2)' }}>{field.label}</label>
                        <div style={{ position: 'relative' }}>
                          <span style={{
                            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                            color: 'var(--accent)', fontSize: 13, fontWeight: 600,
                          }}>₹</span>
                          <input
                            type="number"
                            className="form-input"
                            value={deductions[field.key] || ''}
                            onChange={e => setField(field.key, e.target.value)}
                            placeholder="0"
                            style={{ paddingLeft: 26, width: 160, textAlign: 'right' }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* HRA computed exemption callout */}
                  {section.id === 'HRA' && hraExemption > 0 && (
                    <div style={{
                      background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                      borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f59e0b',
                    }}>
                      ✅ Computed HRA exemption: <strong>{fmt(hraExemption)}</strong>
                      <div style={{ fontSize: 11, marginTop: 4, color: 'var(--text3)' }}>
                        = min(HRA received, {deductions.metroCity ? '50' : '40'}% of basic, rent − 10% of basic)
                      </div>
                    </div>
                  )}

                  {/* 80C limit warning */}
                  {section.id === '80C' && (
                    (() => {
                      const raw = ['ppf','elss','lic','epf','nsc','homeLoan','tuition']
                        .reduce((s, k) => s + (Number(deductions[k]) || 0), 0);
                      return raw > 150000 ? (
                        <div style={{
                          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                          borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#ef4444',
                        }}>
                          ⚠️ Total {fmt(raw)} exceeds 80C cap of ₹1,50,000. Only ₹1,50,000 will be claimed.
                        </div>
                      ) : null;
                    })()
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detailed breakdown table */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">📋 Tax Computation Summary</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text3)', fontWeight: 500 }}>Item</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', color: '#7c3aed', fontWeight: 600 }}>Old Regime</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', color: '#00d4aa', fontWeight: 600 }}>New Regime</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Gross Income', grossIncome, grossIncome],
                ['Standard Deduction', -50000, -75000],
                ...(Object.entries(effectiveDeductions).map(([k, v]) => [`${k} Deduction`, -v, null])),
                ['= Taxable Income', oldResult.taxableIncome, newResult.taxableIncome],
                ['Income Tax', oldResult.baseTax, newResult.baseTax],
                ['Health & Education Cess (4%)', oldResult.cess, newResult.cess],
                ['Total Tax Payable', oldResult.total, newResult.total],
                ['Monthly Tax Burden', oldResult.total / 12, newResult.total / 12],
                ['Monthly Take-home', (grossIncome - oldResult.total) / 12, (grossIncome - newResult.total) / 12],
              ].map(([label, old, nw], i) => {
                const isTotal = label.startsWith('Total') || label.startsWith('Taxable') || label.startsWith('Monthly');
                return (
                  <tr key={i} style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: isTotal ? 'rgba(255,255,255,0.03)' : 'transparent',
                  }}>
                    <td style={{ padding: '9px 12px', color: isTotal ? 'var(--text)' : 'var(--text2)', fontWeight: isTotal ? 600 : 400 }}>
                      {label}
                    </td>
                    <td style={{
                      textAlign: 'right', padding: '9px 12px',
                      color: old < 0 ? 'var(--success)' : isTotal && label.includes('Payable') ? '#ef4444' : 'var(--text)',
                      fontWeight: isTotal ? 700 : 400,
                    }}>
                      {old !== null ? fmt(old) : '—'}
                    </td>
                    <td style={{
                      textAlign: 'right', padding: '9px 12px',
                      color: nw < 0 ? 'var(--success)' : isTotal && label.includes('Payable') ? '#ef4444' : 'var(--text)',
                      fontWeight: isTotal ? 700 : 400,
                    }}>
                      {nw !== null ? fmt(nw) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendation box */}
      <div className="card" style={{
        borderLeft: `4px solid ${saving > 0 ? 'var(--success)' : 'var(--accent2)'}`,
        marginBottom: 24,
      }}>
        <div className="section-title">🎯 Recommendation</div>
        {saving > 0 ? (
          <p style={{ color: 'var(--text2)', lineHeight: 1.7 }}>
            With your current deductions of <strong style={{ color: 'var(--success)' }}>{fmt(oldResult.totalDeductions)}</strong>,
            the <strong style={{ color: 'var(--success)' }}>New Regime</strong> saves you{' '}
            <strong style={{ color: 'var(--success)' }}>{fmt(saving)}/year</strong> ({fmt(saving / 12)}/month).
            The new regime works better when your deductions are relatively low.
          </p>
        ) : (
          <p style={{ color: 'var(--text2)', lineHeight: 1.7 }}>
            With your current deductions of <strong style={{ color: 'var(--accent2)' }}>{fmt(oldResult.totalDeductions)}</strong>,
            the <strong style={{ color: 'var(--accent2)' }}>Old Regime</strong> saves you{' '}
            <strong style={{ color: 'var(--accent2)' }}>{fmt(Math.abs(saving))}/year</strong> ({fmt(Math.abs(saving) / 12)}/month).
            Maximize 80C (EPF+PPF+ELSS) to get more benefit from the old regime.
          </p>
        )}
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text3)' }}>
          ⚠️ This is an estimate for planning purposes only. Consult a CA for filing. Surcharge not included.
          Assumes income from salary only — other income heads (capital gains, business) have different treatment.
        </div>
      </div>
    </div>
  );
}
