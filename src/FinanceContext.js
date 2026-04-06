import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const FinanceContext = createContext();

export const useFinance = () => useContext(FinanceContext);

const defaultBudgets = {
  Food: 5000,
  Rent: 15000,
  Travel: 3000,
  Entertainment: 2000,
  Shopping: 4000,
  Health: 2000,
  Others: 3000,
};

const sampleIncome = [
  { id: 1, source: 'Salary', amount: 55000, date: '2025-03-01', note: 'Monthly salary' },
  { id: 2, source: 'Freelance', amount: 12000, date: '2025-03-10', note: 'React project' },
  { id: 3, source: 'Salary', amount: 55000, date: '2025-02-01', note: 'Monthly salary' },
  { id: 4, source: 'Investment', amount: 3500, date: '2025-02-15', note: 'Dividend' },
];

const sampleExpenses = [
  { id: 1, title: 'Grocery', amount: 2200, category: 'Food', date: '2025-03-05' },
  { id: 2, title: 'Monthly Rent', amount: 12000, category: 'Rent', date: '2025-03-01' },
  { id: 3, title: 'Bus Pass', amount: 800, category: 'Travel', date: '2025-03-03' },
  { id: 4, title: 'Netflix', amount: 649, category: 'Entertainment', date: '2025-03-07' },
  { id: 5, title: 'Clothes', amount: 3200, category: 'Shopping', date: '2025-03-12' },
  { id: 6, title: 'Medicine', amount: 560, category: 'Health', date: '2025-03-14' },
  { id: 7, title: 'Restaurant', amount: 1800, category: 'Food', date: '2025-02-20' },
  { id: 8, title: 'Flight Ticket', amount: 4500, category: 'Travel', date: '2025-02-25' },
  { id: 9, title: 'Grocery', amount: 1900, category: 'Food', date: '2025-02-10' },
  { id: 10, title: 'Rent', amount: 12000, category: 'Rent', date: '2025-02-01' },
];

const sampleGoals = [
  { id: 1, name: 'Emergency Fund', target: 100000, saved: 45000, emoji: '🛡️' },
  { id: 2, name: 'New Laptop', target: 80000, saved: 32000, emoji: '💻' },
  { id: 3, name: 'Vacation', target: 50000, saved: 18000, emoji: '✈️' },
];

export const FinanceProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => JSON.parse(localStorage.getItem('darkMode') || 'true'));
  const [income, setIncome] = useState(() => JSON.parse(localStorage.getItem('income') || 'null') || sampleIncome);
  const [expenses, setExpenses] = useState(() => JSON.parse(localStorage.getItem('expenses') || 'null') || sampleExpenses);
  const [budgets, setBudgets] = useState(() => JSON.parse(localStorage.getItem('budgets') || 'null') || defaultBudgets);
  const [goals, setGoals] = useState(() => JSON.parse(localStorage.getItem('goals') || 'null') || sampleGoals);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => { localStorage.setItem('darkMode', JSON.stringify(darkMode)); }, [darkMode]);
  useEffect(() => { localStorage.setItem('income', JSON.stringify(income)); }, [income]);
  useEffect(() => { localStorage.setItem('expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('budgets', JSON.stringify(budgets)); }, [budgets]);
  useEffect(() => { localStorage.setItem('goals', JSON.stringify(goals)); }, [goals]);

  const addNotification = useCallback((msg, type = 'warning') => {
    const id = Date.now();
    setNotifications(n => [...n, { id, msg, type }]);
    setTimeout(() => setNotifications(n => n.filter(x => x.id !== id)), 4000);
  }, []);

  const addIncome = (item) => {
    const newItem = { ...item, id: Date.now() };
    setIncome(prev => [newItem, ...prev]);
    addNotification(`Income of ₹${item.amount} added!`, 'success');
  };

  const deleteIncome = (id) => setIncome(prev => prev.filter(i => i.id !== id));

  const addExpense = (item) => {
    const newItem = { ...item, id: Date.now() };
    const catBudget = budgets[item.category] || 0;
    const catSpent = expenses.filter(e => e.category === item.category).reduce((s, e) => s + e.amount, 0);
    if (catBudget > 0 && (catSpent + item.amount) >= catBudget) {
      addNotification(`⚠️ Budget exceeded for ${item.category}!`, 'warning');
    }
    setExpenses(prev => [newItem, ...prev]);
  };

  const deleteExpense = (id) => setExpenses(prev => prev.filter(e => e.id !== id));

  const updateBudget = (cat, val) => setBudgets(prev => ({ ...prev, [cat]: Number(val) }));

  const addGoal = (g) => {
    const newGoal = { ...g, id: Date.now() };
    setGoals(prev => [...prev, newGoal]);
  };

  const updateGoalSaved = (id, amount) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g;
      const newSaved = Math.min(g.saved + amount, g.target);
      if (newSaved >= g.target) addNotification(`🎉 Goal "${g.name}" reached!`, 'success');
      return { ...g, saved: newSaved };
    }));
  };

  const deleteGoal = (id) => setGoals(prev => prev.filter(g => g.id !== id));

  const totalIncome = income.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpenses;

  const exportData = (format) => {
    const data = { income, expenses, budgets, goals };
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'finance_data.json'; a.click();
    } else {
      const rows = [['Type', 'Title/Source', 'Amount', 'Category', 'Date']];
      income.forEach(i => rows.push(['Income', i.source, i.amount, '', i.date]));
      expenses.forEach(e => rows.push(['Expense', e.title, e.amount, e.category, e.date]));
      const csv = rows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'finance_data.csv'; a.click();
    }
    addNotification('Data exported successfully!', 'success');
  };

  return (
    <FinanceContext.Provider value={{
      darkMode, setDarkMode,
      income, addIncome, deleteIncome,
      expenses, addExpense, deleteExpense,
      budgets, updateBudget,
      goals, addGoal, updateGoalSaved, deleteGoal,
      totalIncome, totalExpenses, balance,
      notifications, addNotification,
      exportData,
    }}>
      {children}
    </FinanceContext.Provider>
  );
};
