import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calculator, Receipt, Bot, Menu, Settings, Database, UploadCloud } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { ProfitCalculator } from './components/ProfitCalculator';
import { AIAnalyst } from './components/AIAnalyst';
import { Transaction, PlanType, Expense } from './types';
import { 
    initFirebase, 
    isFirebaseInitialized, 
    subscribeToTransactions, 
    subscribeToExpenses,
    addTransactionToDb,
    updateTransactionInDb,
    deleteTransactionFromDb,
    addExpenseToDb,
    updateExpenseInDb,
    deleteExpenseFromDb,
    migrateDataToFirebase
} from './services/firebase';

// Initial Dummy Data
const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2023-10-24', customerName: 'Alice Johnson', planType: PlanType.PLUS, costPrice: 250, salePrice: 450, currency: 'BDT' },
  { id: '2', date: '2023-10-25', customerName: 'TechCorp Inc', planType: PlanType.GOOGLE_AI_PRO, costPrice: 600, salePrice: 1000, currency: 'BDT' },
];

const INITIAL_EXPENSES: Expense[] = [
    { id: 'e1', date: '2023-10-20', category: 'Facebook Ads', amount: 1500, description: 'Weekend Campaign' },
];

type ViewState = 'dashboard' | 'calculator' | 'transactions' | 'ai' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // Database State
  const [isConnected, setIsConnected] = useState(false);
  const [dbConfig, setDbConfig] = useState('');

  // 1. Initial Load: Check for Firebase Config
  useEffect(() => {
    const savedConfig = localStorage.getItem('gpt_reseller_firebase_config');
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            setDbConfig(savedConfig);
            if (initFirebase(config)) {
                setIsConnected(true);
            }
        } catch (e) {
            console.error("Invalid config saved");
        }
    }

    // Load local data as fallback or for migration
    if (!isFirebaseInitialized()) {
        const localTrans = localStorage.getItem('gpt_reseller_transactions');
        const localExp = localStorage.getItem('gpt_reseller_expenses');
        setTransactions(localTrans ? JSON.parse(localTrans) : INITIAL_TRANSACTIONS);
        setExpenses(localExp ? JSON.parse(localExp) : INITIAL_EXPENSES);
    }
  }, []);

  // 2. Subscribe to Firebase Data if Connected
  useEffect(() => {
    if (isConnected) {
        const unsubTrans = subscribeToTransactions((data) => {
            setTransactions(data);
        });
        const unsubExp = subscribeToExpenses((data) => {
            setExpenses(data);
        });

        return () => {
            unsubTrans();
            unsubExp();
        };
    }
  }, [isConnected]);

  // 3. Sync to LocalStorage (Only if NOT connected to DB, as backup)
  useEffect(() => {
    if (!isConnected) {
        localStorage.setItem('gpt_reseller_transactions', JSON.stringify(transactions));
    }
  }, [transactions, isConnected]);

  useEffect(() => {
    if (!isConnected) {
        localStorage.setItem('gpt_reseller_expenses', JSON.stringify(expenses));
    }
  }, [expenses, isConnected]);


  // --- Handlers (Switch between DB and Local) ---

  const addTransaction = async (newT: Omit<Transaction, 'id'>) => {
    if (isConnected) {
        await addTransactionToDb(newT);
    } else {
        const transaction: Transaction = { ...newT, id: Math.random().toString(36).substr(2, 9) };
        setTransactions(prev => [...prev, transaction]);
    }
  };

  const updateTransaction = async (updated: Transaction) => {
    if (isConnected) {
        await updateTransactionInDb(updated);
    } else {
        setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
    }
  };

  const deleteTransaction = async (id: string) => {
    if (isConnected) {
        await deleteTransactionFromDb(id);
    } else {
        setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const addExpense = async (newE: Omit<Expense, 'id'>) => {
    if (isConnected) {
        await addExpenseToDb(newE);
    } else {
        const expense: Expense = { ...newE, id: Math.random().toString(36).substr(2, 9) };
        setExpenses(prev => [...prev, expense]);
    }
  };

  const updateExpense = async (updated: Expense) => {
    if (isConnected) {
        await updateExpenseInDb(updated);
    } else {
        setExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));
    }
  };

  const deleteExpense = async (id: string) => {
    if (isConnected) {
        await deleteExpenseFromDb(id);
    } else {
        setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleConnect = () => {
      try {
          const config = JSON.parse(dbConfig);
          if (initFirebase(config)) {
              localStorage.setItem('gpt_reseller_firebase_config', dbConfig);
              setIsConnected(true);
              alert("Connected to Firebase!");
          } else {
              alert("Failed to initialize. Check config.");
          }
      } catch (e) {
          alert("Invalid JSON format. Please copy the config object exactly.");
      }
  };

  const handleDisconnect = () => {
      localStorage.removeItem('gpt_reseller_firebase_config');
      setIsConnected(false);
      window.location.reload(); // Simple reload to clear firebase instances
  };

  const handleMigration = async () => {
      if (!window.confirm("This will upload your local data to Firebase. Proceed?")) return;
      try {
          await migrateDataToFirebase(transactions, expenses);
          alert("Migration successful! Your local data is now in the database.");
      } catch (e) {
          console.error(e);
          alert("Migration failed. Check console.");
      }
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
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:transform-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Rudmax Mastermind
            </h1>
            <p className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                {isConnected ? (
                    <span className="flex items-center text-green-600 gap-1"><Database size={10}/> Cloud Synced</span>
                ) : (
                    <span className="flex items-center text-orange-500 gap-1"><Database size={10}/> Local Mode</span>
                )}
            </p>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem view="calculator" icon={Calculator} label="Campaign Calculator" />
            <NavItem view="ai" icon={Bot} label="AI Analyst" />
            <NavItem view="settings" icon={Settings} label="Settings" />
          </nav>
        </div>
      </aside>

      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
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
                {currentView === 'settings' && 'App Settings'}
              </h2>
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

            {currentView === 'settings' && (
              <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                        <Database size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Database Connection</h3>
                        <p className="text-sm text-slate-500">Connect to Firebase Firestore to sync your data across devices.</p>
                    </div>
                </div>

                {!isConnected ? (
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-600">
                            <p className="font-semibold mb-2">How to connect:</p>
                            <ol className="list-decimal ml-4 space-y-1">
                                <li>Go to Firebase Console and create a project.</li>
                                <li>Create a Firestore Database (Start in Test Mode).</li>
                                <li>Go to Project Settings and copy the "firebaseConfig" object.</li>
                                <li>Paste it below.</li>
                            </ol>
                        </div>
                        <textarea 
                            className="w-full h-48 p-4 font-mono text-xs bg-slate-900 text-green-400 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder={'{ "apiKey": "...", "authDomain": "...", ... }'}
                            value={dbConfig}
                            onChange={(e) => setDbConfig(e.target.value)}
                        />
                        <button 
                            onClick={handleConnect}
                            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Connect Database
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 text-green-800">
                            <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></div>
                            <span className="font-medium">Connected to Firebase Firestore</span>
                        </div>

                        <div className="border-t border-slate-100 pt-6">
                            <h4 className="font-semibold text-slate-800 mb-2">Data Migration</h4>
                            <p className="text-sm text-slate-500 mb-4">If you have data saved on this device (Local Storage), you can upload it to the database now.</p>
                            <button 
                                onClick={handleMigration}
                                className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <UploadCloud size={18} />
                                Upload Local Data to Database
                            </button>
                        </div>

                        <div className="border-t border-slate-100 pt-6">
                            <button 
                                onClick={handleDisconnect}
                                className="text-red-600 text-sm font-medium hover:underline"
                            >
                                Disconnect and remove API Key
                            </button>
                        </div>
                    </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;