import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './FinanceContext';
import Dashboard from './Dashboard';
import IncomeTracker from './IncomeTracker';
import ExpenseTracker from './ExpenseTracker';
import BudgetPlanner from './BudgetPlanner';
import Analytics from './Analytics';
import SavingsGoals from './SavingsGoals';
import TaxEstimator from './TaxEstimator';
import Notifications from './Notifications';
import './App.css';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'income',    label: 'Income',    icon: '💰' },
  { id: 'expenses',  label: 'Expenses',  icon: '💸' },
  { id: 'budget',    label: 'Budget',    icon: '📋' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
  { id: 'tax',       label: 'Tax',       icon: '🧾' },
  { id: 'goals',     label: 'Goals',     icon: '🎯' },
];

function AppInner() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { darkMode, setDarkMode, exportData } = useFinance();

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      <div className="bg-animation">
        {[...Array(20)].map((_, i) => (
          <span key={i} className="bubble" style={{ '--i': i }} />
        ))}
      </div>

      <Notifications />

      <header className="header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">₹</span>
            <div>
              <h1>FinanceFlow</h1>
              <p>Personal Finance Dashboard</p>
              <p>Keshav Gupta 24BCE0260</p>
            </div>
          </div>
        </div>
        <div className="header-right">
          <div className="export-btns">
            <button className="btn-sm" onClick={() => exportData('csv')}>⬇ CSV</button>
            <button className="btn-sm" onClick={() => exportData('json')}>⬇ JSON</button>
          </div>
          <button className="dark-toggle" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <nav className="nav">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`nav-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            <span className="nav-icon">{t.icon}</span>
            <span className="nav-label">{t.label}</span>
          </button>
        ))}
        <a
          href="https://keshavgupta-resume.tiiny.site"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-btn"
          style={{ textDecoration: 'none', marginLeft: 'auto' }}
        >
          <span className="nav-label">Portfolio</span>
        </a>
      </nav>

      <main className="main">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'income'    && <IncomeTracker />}
        {activeTab === 'expenses'  && <ExpenseTracker />}
        {activeTab === 'budget'    && <BudgetPlanner />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'goals'     && <SavingsGoals />}
        {activeTab === 'tax'       && <TaxEstimator />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <AppInner />
    </FinanceProvider>
  );
}
