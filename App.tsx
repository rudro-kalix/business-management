import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calculator, Receipt, Bot, Menu, X } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { ProfitCalculator } from './components/ProfitCalculator';
import { AIAnalyst } from './components/AIAnalyst';
import { Transaction, PlanType, Expense } from './types';

// Initial Dummy Data with BDT values and new Plan Types
const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2023-10-24', customerName: 'Alice Johnson', planType: PlanType.PLUS, costPrice: 250, salePrice: 450, currency: 'BDT' },
  { id: '2', date: '2023-10-25', customerName: 'TechCorp Inc', planType: PlanType.GOOGLE_AI_PRO, costPrice: 600, salePrice: 1000, currency: 'BDT' },
  { id: '3', date: '2023-10-25', customerName: 'Bob Smith', planType: PlanType.PLUS, costPrice: 250, salePrice: 450, currency: 'BDT' },
  { id: '4', date: '2023-10-26', customerName: 'Charlie Brown', planType: PlanType.GO, costPrice: 1200, salePrice: 2000, currency: 'BDT' },
  { id: '5', date: '2023-10-27', customerName: 'Dave Wilson', planType: PlanType.PLUS, costPrice: 250, salePrice: 420, currency: 'BDT' }, 
];

const INITIAL_EXPENSES: Expense[] = [
    { id: 'e1', date: '2023-10-20', category: 'Facebook Ads', amount: 1500, description: 'Weekend Campaign' },
    { id: 'e2', date: '2023-10-22', category: 'Gmail', amount: 500, description: '10 Accounts Batch' },
    { id: 'e3', date: '2023-10-25', category: 'Poster', amount: 800, description: 'Local flyers' },
];

type ViewState = 'dashboard' | 'calculator' | 'transactions' | 'ai';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initialize state from LocalStorage or fallback to initial data
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('gpt_reseller_transactions');
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch (e) {
      console.error("Failed to parse transactions from local storage", e);
      return INITIAL_TRANSACTIONS;
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem('gpt_reseller_expenses');
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch (e) {
      console.error("Failed to parse expenses from local storage", e);
      return INITIAL_EXPENSES;
    }
  });

  // Save to LocalStorage whenever transactions change
  useEffect(() => {
    localStorage.setItem('gpt_reseller_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Save to LocalStorage whenever expenses change
  useEffect(() => {
    localStorage.setItem('gpt_reseller_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Transaction Handlers
  const addTransaction = (newT: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = {
      ...newT,
      id: Math.random().toString(36).substr(2, 9)
    };
    setTransactions(prev => [...prev, transaction]);
  };

  const updateTransaction = (updated: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Expense Handlers
  const addExpense = (newE: Omit<Expense, 'id'>) => {
    const expense: Expense = {
      ...newE,
      id: Math.random().toString(36).substr(2, 9)
    };
    setExpenses(prev => [...prev, expense]);
  }

  const updateExpense = (updated: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };


  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setIsSidebarOpen(false);
      }}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors font-medium ${
        currentView === view 
          ? 'bg-indigo-50 text-indigo-700' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar for Desktop */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:transform-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Rudmax Mastermind
            </h1>
            <p className="text-xs text-slate-400 mt-1">Manage your subscriptions</p>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem view="calculator" icon={Calculator} label="Campaign Calculator" />
            <NavItem view="ai" icon={Bot} label="AI Analyst" />
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className="bg-indigo-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-indigo-800">Pro Tip</p>
              <p className="text-xs text-indigo-600 mt-1">
                Add your total ad & gmail costs in the Expenses list to see your true net profit.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header Mobile */}
        <header className="bg-white border-b border-slate-200 lg:hidden px-4 py-3 flex items-center justify-between sticky top-0 z-20">
           <h1 className="font-bold text-slate-800">GPT Reseller Pro</h1>
           <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600">
             <Menu size={24} />
           </button>
        </header>

        <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <header className="mb-8 hidden lg:block">
              <h2 className="text-2xl font-bold text-slate-900">
                {currentView === 'dashboard' && 'Dashboard Overview'}
                {currentView === 'calculator' && 'Campaign Profitability'}
                {currentView === 'ai' && 'AI Business Intelligence'}
              </h2>
              <p className="text-slate-500 mt-1">
                {currentView === 'dashboard' && 'Track your sales, total expenses, and net profit.'}
                {currentView === 'calculator' && 'Calculate how many sales you need to cover your total costs.'}
                {currentView === 'ai' && 'Get insights powered by Gemini 3 Flash.'}
              </p>
            </header>

            {currentView === 'dashboard' && (
              <Dashboard 
                transactions={transactions} 
                expenses={expenses}
                onAddTransaction={addTransaction}
                onUpdateTransaction={updateTransaction}
                onDeleteTransaction={deleteTransaction}
                onAddExpense={addExpense}
                onUpdateExpense={updateExpense}
                onDeleteExpense={deleteExpense}
              />
            )}
            
            {currentView === 'calculator' && (
              <div className="max-w-3xl mx-auto">
                 <ProfitCalculator />
              </div>
            )}

            {currentView === 'ai' && (
              <AIAnalyst transactions={transactions} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;