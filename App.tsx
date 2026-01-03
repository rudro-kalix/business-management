import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calculator, Menu, Settings, Database, UploadCloud, LogIn, LogOut, ShieldCheck, User, Info } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { ProfitCalculator } from './components/ProfitCalculator';
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
    migrateDataToFirebase,
    loginWithGoogle,
    logoutUser,
    subscribeToAuth
} from './services/firebase';

// Default config placeholder - User must enter their own in Settings
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Initial Dummy Data
const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2023-10-24', customerName: 'Client A', planType: PlanType.PLUS, costPrice: 250, salePrice: 450, currency: 'BDT' },
  { id: '2', date: '2023-10-25', customerName: 'Client B', planType: PlanType.GOOGLE_AI_PRO, costPrice: 600, salePrice: 1000, currency: 'BDT' },
];

const INITIAL_EXPENSES: Expense[] = [
    { id: 'e1', date: '2023-10-20', category: 'Facebook Ads', amount: 1500, description: 'Weekend Campaign' },
];

type ViewState = 'dashboard' | 'calculator' | 'transactions' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // Database & Auth State
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [dbConfig, setDbConfig] = useState(JSON.stringify(DEFAULT_FIREBASE_CONFIG, null, 2));

  // 1. Initial Load: Initialize Firebase with Default or Saved Config
  useEffect(() => {
    let configToUse = DEFAULT_FIREBASE_CONFIG;
    const savedConfig = localStorage.getItem('gpt_reseller_firebase_config');
    
    if (savedConfig) {
        try {
            configToUse = JSON.parse(savedConfig);
            setDbConfig(savedConfig);
        } catch (e) {
            console.error("Invalid config saved, using default");
        }
    }

    // Only attempt initialization if config looks valid (has apiKey)
    if (configToUse.apiKey && initFirebase(configToUse)) {
        setIsConnected(true);
    }

    // Load local data as fallback (will be overwritten if DB subscription kicks in)
    if (!isFirebaseInitialized()) {
        const localTrans = localStorage.getItem('gpt_reseller_transactions');
        const localExp = localStorage.getItem('gpt_reseller_expenses');
        setTransactions(localTrans ? JSON.parse(localTrans) : INITIAL_TRANSACTIONS);
        setExpenses(localExp ? JSON.parse(localExp) : INITIAL_EXPENSES);
    }
  }, []);

  // 2. Subscribe to Auth State
  useEffect(() => {
    if (isConnected) {
        const unsub = subscribeToAuth((user) => {
            setCurrentUser(user);
        });
        return () => unsub();
    }
  }, [isConnected]);

  // 3. Subscribe to Firebase Data (Only if Connected AND Logged In)
  useEffect(() => {
    if (isConnected && currentUser) {
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
    } else if (isConnected && !currentUser) {
        setTransactions([]);
        setExpenses([]);
    }
  }, [isConnected, currentUser]);

  // 4. Sync to LocalStorage (Only if NOT connected to DB, as backup)
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
        if (!currentUser) { alert("Please login to add data."); return; }
        await addTransactionToDb(newT);
    } else {
        const transaction: Transaction = { ...newT, id: Math.random().toString(36).substr(2, 9) };
        setTransactions(prev => [...prev, transaction]);
    }
  };

  const updateTransaction = async (updated: Transaction) => {
    if (isConnected) {
        if (!currentUser) { alert("Please login to update data."); return; }
        await updateTransactionInDb(updated);
    } else {
        setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
    }
  };

  const deleteTransaction = async (id: string) => {
    if (isConnected) {
        if (!currentUser) { alert("Please login to delete data."); return; }
        await deleteTransactionFromDb(id);
    } else {
        setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const addExpense = async (newE: Omit<Expense, 'id'>) => {
    if (isConnected) {
        if (!currentUser) { alert("Please login to add expenses."); return; }
        await addExpenseToDb(newE);
    } else {
        const expense: Expense = { ...newE, id: Math.random().toString(36).substr(2, 9) };
        setExpenses(prev => [...prev, expense]);
    }
  };

  const updateExpense = async (updated: Expense) => {
    if (isConnected) {
        if (!currentUser) { alert("Please login to update expenses."); return; }
        await updateExpenseInDb(updated);
    } else {
        setExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));
    }
  };

  const deleteExpense = async (id: string) => {
    if (isConnected) {
        if (!currentUser) { alert("Please login to delete expenses."); return; }
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
      setCurrentUser(null);
      window.location.reload(); 
  };

  const handleMigration = async () => {
      if (!currentUser) { alert("You must be logged in to upload data."); return; }
      if (!window.confirm("This will upload your local data to Firebase. Proceed?")) return;
      try {
          await migrateDataToFirebase(transactions, expenses);
          alert("Migration successful! Your local data is now in the database.");
      } catch (e) {
          console.error(e);
          alert("Migration failed. Check console.");
      }
  };

  const handleLogin = async () => {
      try {
          await loginWithGoogle();
      } catch (e: any) {
          alert(`Login failed: ${e.message}`);
      }
  }

  const handleLogout = async () => {
      await logoutUser();
  }

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
            <div className="mt-2">
                {isConnected ? (
                    currentUser ? (
                        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded border border-green-100">
                            <ShieldCheck size={12} />
                            <span className="truncate max-w-[140px]">{currentUser.email}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-100">
                            <ShieldCheck size={12} />
                            <span>Authentication Required</span>
                        </div>
                    )
                ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 p-2 rounded border border-slate-200">
                         <Database size={12}/> <span>Local Storage Mode</span>
                    </div>
                )}
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem view="calculator" icon={Calculator} label="Campaign Calculator" />
            <NavItem view="settings" icon={Settings} label="Settings" />
          </nav>

          {isConnected && (
              <div className="p-4 border-t border-slate-100">
                  {currentUser ? (
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 p-2 rounded w-full transition-colors"
                      >
                          <LogOut size={16} /> Logout
                      </button>
                  ) : (
                       <button 
                        onClick={handleLogin}
                        className="flex items-center gap-2 text-sm text-indigo-600 hover:bg-indigo-50 p-2 rounded w-full transition-colors"
                      >
                          <LogIn size={16} /> Login
                      </button>
                  )}
              </div>
          )}
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
                {currentView === 'settings' && 'App Settings'}
              </h2>
            </header>

            {/* View Logic */}
            
            {/* If Cloud Mode AND Logged Out -> Show Login Prompt (Except for Settings) */}
            {isConnected && !currentUser && currentView !== 'settings' && (
                <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                    <div className="bg-indigo-100 p-4 rounded-full mb-4">
                        <ShieldCheck className="w-12 h-12 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Authentication Required</h3>
                    <p className="text-slate-500 max-w-md mb-6">
                        You are connected to a secure database. Please sign in to view your sales and expenses.
                    </p>
                    <button 
                        onClick={handleLogin}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                    >
                        <LogIn size={20} />
                        Sign In with Google
                    </button>
                </div>
            )}

            {/* If Local Mode OR (Cloud Mode AND Logged In) -> Show Content */}
            {(!isConnected || (isConnected && currentUser)) && (
                <>
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
                </>
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
                                <li>Create a Firestore Database.</li>
                                <li>Enable <strong>Authentication</strong> (Google Sign-In provider).</li>
                                <li>
                                    <strong>Important:</strong> Add this domain to Authorized Domains:
                                    <br/>
                                    <span className="text-xs font-mono bg-slate-200 px-1 rounded">{window.location.hostname}</span>
                                </li>
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
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-green-800 font-medium">
                                <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></div>
                                <span>Connected to Firebase Firestore</span>
                            </div>
                            <div className="text-xs text-slate-500 font-mono break-all bg-white/50 p-2 rounded border border-green-100">
                                Project ID: {JSON.parse(dbConfig).projectId || 'Unknown'}
                            </div>
                        </div>

                        {/* Auth Section in Settings */}
                        <div className="border-t border-slate-100 pt-6">
                             <h4 className="font-semibold text-slate-800 mb-4">Authentication</h4>
                             {currentUser ? (
                                 <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200">
                                     <div className="flex items-center gap-3">
                                         {currentUser.photoURL ? (
                                             <img src={currentUser.photoURL} alt="User" className="w-10 h-10 rounded-full" />
                                         ) : (
                                             <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                                 <User size={20} />
                                             </div>
                                         )}
                                         <div>
                                             <p className="text-sm font-semibold text-slate-900">{currentUser.displayName || 'User'}</p>
                                             <p className="text-xs text-slate-500">{currentUser.email}</p>
                                         </div>
                                     </div>
                                     <button onClick={handleLogout} className="text-red-600 text-sm font-medium hover:underline">Sign Out</button>
                                 </div>
                             ) : (
                                 <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                                     <p className="text-sm text-blue-800 mb-3">Sign in to secure your database access.</p>
                                     <div className="flex flex-col items-center gap-2">
                                         <button 
                                            onClick={handleLogin}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                         >
                                             <LogIn size={16} /> Sign In with Google
                                         </button>
                                         <div className="text-[10px] text-blue-600/70 flex items-center gap-1 mt-1">
                                             <Info size={10} />
                                             <span>Make sure {window.location.hostname} is authorized in Firebase</span>
                                         </div>
                                     </div>
                                 </div>
                             )}
                        </div>

                        {currentUser && (
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
                        )}

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