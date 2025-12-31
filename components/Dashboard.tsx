import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { TrendingUp, Users, DollarSign, CreditCard, PlusCircle, MinusCircle, Facebook, Mail, Megaphone, Receipt, Pencil, Trash2, History } from 'lucide-react';
import { MetricsCard } from './MetricsCard';
import { Transaction, PlanType, Expense } from '../types';

interface DashboardProps {
  transactions: Transaction[];
  expenses: Expense[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onAddExpense: (e: Omit<Expense, 'id'>) => void;
  onUpdateExpense: (e: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

export const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, 
  expenses, 
  onAddTransaction, 
  onUpdateTransaction,
  onDeleteTransaction,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense
}) => {
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  
  // State for editing
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  // 1. Calculate Metrics (INCLUDES Historical Data)
  const totalRevenue = transactions.reduce((acc, t) => acc + t.salePrice, 0);
  const totalCOGS = transactions.reduce((acc, t) => acc + t.costPrice, 0);
  const totalOpEx = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalProfit = totalRevenue - totalCOGS - totalOpEx;
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  
  // Count total sales by summing quantities
  const totalSalesCount = transactions.reduce((acc, t) => acc + (t.quantity || 1), 0);

  // 2. Prepare Chart Data (EXCLUDES Historical Data)
  // We filter out transactions where isHistorical is true for visual trends
  const activeTransactions = transactions.filter(t => !t.isHistorical);

  const salesByPlan = Object.values(PlanType).map(type => {
    return {
      name: type,
      value: activeTransactions.filter(t => t.planType === type).reduce((acc, t) => acc + (t.quantity || 1), 0)
    };
  }).filter(d => d.value > 0);

  const dailyMetrics = activeTransactions.reduce((acc: any[], t) => {
    const existing = acc.find(item => item.date === t.date);
    const grossProfit = t.salePrice - t.costPrice;
    
    if (existing) {
      existing.revenue += t.salePrice;
      existing.grossProfit += grossProfit;
    } else {
      acc.push({ date: t.date, revenue: t.salePrice, grossProfit });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-7);

  // Forms State
  const defaultTrans: Omit<Transaction, 'id'> = {
    customerName: '',
    planType: PlanType.PLUS,
    costPrice: 250,
    salePrice: 450,
    currency: 'BDT',
    date: new Date().toISOString().split('T')[0],
    isHistorical: false,
    quantity: 1
  };
  const [transForm, setTransForm] = useState<Omit<Transaction, 'id'>>(defaultTrans);

  const defaultExpense = {
    category: 'Facebook Ads',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  };
  const [expenseForm, setExpenseForm] = useState<Omit<Expense, 'id'>>(defaultExpense as any);

  // --- Handlers for Sales ---

  const openAddSale = () => {
    setEditingTransactionId(null);
    setTransForm(defaultTrans);
    setIsSaleModalOpen(true);
  };

  const openEditSale = (t: Transaction) => {
    setEditingTransactionId(t.id);
    setTransForm({
        customerName: t.customerName || '',
        planType: t.planType,
        costPrice: t.costPrice,
        salePrice: t.salePrice,
        currency: t.currency,
        date: t.date,
        isHistorical: t.isHistorical || false,
        quantity: t.quantity || 1
    });
    setIsSaleModalOpen(true);
  };

  const handleSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTransactionId) {
        onUpdateTransaction({ ...transForm, id: editingTransactionId });
    } else {
        onAddTransaction(transForm);
    }
    setIsSaleModalOpen(false);
  };

  const updateQuantity = (newQty: number) => {
      const oldQty = transForm.quantity || 1;
      const unitCost = transForm.costPrice / oldQty;
      const unitPrice = transForm.salePrice / oldQty;
      
      setTransForm({
          ...transForm,
          quantity: newQty,
          costPrice: unitCost * newQty,
          salePrice: unitPrice * newQty
      });
  };

  const handleUnitCostChange = (val: number) => {
      const qty = transForm.quantity || 1;
      setTransForm({
          ...transForm,
          costPrice: val * qty
      });
  };

  const handleUnitSalePriceChange = (val: number) => {
      const qty = transForm.quantity || 1;
      setTransForm({
          ...transForm,
          salePrice: val * qty
      });
  };

  // --- Handlers for Expenses ---

  const openAddExpense = () => {
    setEditingExpenseId(null);
    setExpenseForm(defaultExpense as any);
    setIsExpenseModalOpen(true);
  };

  const openEditExpense = (e: Expense) => {
    setEditingExpenseId(e.id);
    setExpenseForm({
        category: e.category,
        amount: e.amount,
        description: e.description || '',
        date: e.date
    });
    setIsExpenseModalOpen(true);
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExpenseId) {
        onUpdateExpense({ ...expenseForm, id: editingExpenseId } as Expense);
    } else {
        onAddExpense(expenseForm);
    }
    setIsExpenseModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard 
          title="Net Profit" 
          value={`৳${totalProfit.toLocaleString()}`} 
          icon={TrendingUp} 
          color={totalProfit >= 0 ? "green" : "red"} 
          trend="Total All-Time" 
          trendUp={totalProfit >= 0} 
        />
        <MetricsCard 
          title="Total Revenue" 
          value={`৳${totalRevenue.toLocaleString()}`} 
          icon={DollarSign} 
          color="blue" 
        />
        <MetricsCard 
          title="Total Expenses" 
          value={`৳${totalOpEx.toLocaleString()}`} 
          icon={Receipt} 
          color="orange" 
        />
         <MetricsCard 
          title="Total Sales" 
          value={totalSalesCount.toString()} 
          icon={Users} 
          color="purple" 
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gross Profit Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
             <div>
                <h3 className="text-lg font-semibold text-slate-800">Daily Gross Profit</h3>
                <p className="text-xs text-slate-400">Excluding historical data</p>
             </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyMetrics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#64748b" />
                <YAxis tick={{fontSize: 12}} stroke="#64748b" />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="grossProfit" fill="#10B981" radius={[4, 4, 0, 0]} name="Gross Profit (৳)" />
                <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Revenue (৳)" hide />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Plan */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
             <div>
                <h3 className="text-lg font-semibold text-slate-800">Sales by Plan Type</h3>
                <p className="text-xs text-slate-400">Current active sales only</p>
             </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesByPlan}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {salesByPlan.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expenses List */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-red-50/30">
            <h3 className="text-md font-semibold text-slate-800">Operating Expenses</h3>
            <button 
              onClick={openAddExpense}
              className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              <PlusCircle size={16} />
            </button>
          </div>
          <div className="overflow-y-auto max-h-[400px]">
            {expenses.length === 0 ? (
               <div className="p-6 text-center text-sm text-slate-400">No expenses recorded yet.</div>
            ) : (
                <table className="w-full text-left text-sm text-slate-600">
                    <tbody className="divide-y divide-slate-100">
                        {expenses.slice().reverse().map(e => (
                            <tr key={e.id} className="hover:bg-slate-50 group">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2 font-medium text-slate-700">
                                        {e.category === 'Facebook Ads' && <Facebook size={14} className="text-blue-600"/>}
                                        {e.category === 'Gmail' && <Mail size={14} className="text-red-500"/>}
                                        {e.category === 'Poster' && <Megaphone size={14} className="text-orange-500"/>}
                                        {e.category === 'Other' && <Receipt size={14} className="text-slate-400"/>}
                                        {e.category}
                                    </div>
                                    <div className="text-xs text-slate-400">{e.date} {e.description ? `- ${e.description}` : ''}</div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="font-medium text-red-600">-৳{e.amount}</div>
                                    <div className="flex justify-end gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEditExpense(e)} className="text-slate-400 hover:text-blue-600"><Pencil size={12}/></button>
                                        <button onClick={() => onDeleteExpense(e.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={12}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
          </div>
        </div>

        {/* Transactions List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">Sales History</h3>
            <button 
                onClick={openAddSale}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
                <PlusCircle size={18} />
                Add Sale
            </button>
            </div>
            <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 sticky top-0">
                <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Plan</th>
                    <th className="px-6 py-3 text-right">Cost</th>
                    <th className="px-6 py-3 text-right">Price</th>
                    <th className="px-6 py-3 text-right">Profit</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {transactions.slice().reverse().map((t) => {
                    const gross = t.salePrice - t.costPrice;
                    const qty = t.quantity || 1;
                    return (
                    <tr key={t.id} className={`hover:bg-slate-50 group ${t.isHistorical ? 'bg-slate-50/50' : ''}`}>
                        <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                                {t.isHistorical && (
                                    <span title="Historical Data (Excluded from graphs)">
                                        <History size={14} className="text-slate-400" />
                                    </span>
                                )}
                                {t.date}
                            </div>
                        </td>
                        <td className="px-6 py-3 font-medium text-slate-900">{t.customerName || <span className="text-slate-400 text-xs italic">No Name</span>}</td>
                        <td className="px-6 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {t.planType} {qty > 1 && <span className="ml-1 text-[10px] bg-blue-200 text-blue-800 px-1 rounded-sm">x{qty}</span>}
                        </span>
                        </td>
                        <td className="px-6 py-3 text-right text-slate-500">৳{t.costPrice}</td>
                        <td className="px-6 py-3 text-right text-slate-900">৳{t.salePrice}</td>
                        <td className="px-6 py-3 text-right font-bold text-green-600">
                        +৳{gross.toFixed(2)}
                        </td>
                         <td className="px-6 py-3 text-right">
                            <div className="flex justify-end gap-2">
                                <button onClick={() => openEditSale(t)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Pencil size={14}/></button>
                                <button onClick={() => onDeleteTransaction(t.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                            </div>
                        </td>
                    </tr>
                    );
                })}
                </tbody>
            </table>
            {transactions.length === 0 && (
                <div className="p-8 text-center text-slate-400">No transactions yet. Add your first sale!</div>
            )}
            </div>
        </div>
      </div>

      {/* Sale Modal */}
      {isSaleModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">{editingTransactionId ? 'Edit Sale' : 'Record New Sale'}</h2>
            <form onSubmit={handleSaleSubmit} className="space-y-4">
              
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                 <input 
                    type="checkbox"
                    id="isHistorical"
                    className="w-4 h-4 text-indigo-600 rounded"
                    checked={transForm.isHistorical || false}
                    onChange={e => setTransForm({...transForm, isHistorical: e.target.checked})}
                 />
                 <label htmlFor="isHistorical" className="text-sm text-slate-700 select-none cursor-pointer flex flex-col">
                    <span className="font-medium">Previous/Historical Sale</span>
                    <span className="text-xs text-slate-500">Calculate in Total Profit, but hide from daily graphs.</span>
                 </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Customer <span className="text-slate-400 font-normal text-xs">(Optional)</span></label>
                  <input 
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={transForm.customerName || ''}
                    onChange={e => setTransForm({...transForm, customerName: e.target.value})}
                    placeholder="Guest"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input 
                    type="date"
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={transForm.date}
                    onChange={e => setTransForm({...transForm, date: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Plan Type</label>
                <select 
                    className="w-full border border-slate-300 rounded-lg p-2"
                    value={transForm.planType}
                    onChange={e => setTransForm({...transForm, planType: e.target.value as PlanType})}
                >
                    {Object.values(PlanType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Quantity Section */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase">Quantity</label>
                  <div className="flex items-center gap-2 mb-3">
                      <input 
                          type="number"
                          min="1"
                          required
                          className="w-20 border border-slate-300 rounded-lg p-2 text-center font-bold text-indigo-700"
                          value={transForm.quantity || 1}
                          onChange={e => updateQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                      <div className="flex flex-wrap gap-2">
                          {[2, 3, 4, 5, 6].map(num => (
                              <button
                                  key={num}
                                  type="button"
                                  onClick={() => updateQuantity(num)}
                                  className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                                      (transForm.quantity === num) 
                                      ? 'bg-indigo-600 text-white' 
                                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                              >
                                  {num}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Unit Cost (৳)</label>
                  <input 
                    type="number"
                    required
                    className="w-full border border-slate-300 rounded-lg p-2"
                    value={(transForm.costPrice / (transForm.quantity || 1)).toFixed(2).replace(/[.,]00$/, "")}
                    onChange={e => handleUnitCostChange(Number(e.target.value))}
                  />
                  <div className="text-xs text-slate-400 mt-1 text-right">Total: ৳{transForm.costPrice}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unit Sale Price (৳)</label>
                  <input 
                    type="number"
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                    value={(transForm.salePrice / (transForm.quantity || 1)).toFixed(2).replace(/[.,]00$/, "")}
                    onChange={e => handleUnitSalePriceChange(Number(e.target.value))}
                  />
                  <div className="text-xs text-slate-400 mt-1 text-right">Total: ৳{transForm.salePrice}</div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                <button type="button" onClick={() => setIsSaleModalOpen(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    {editingTransactionId ? 'Update Sale' : 'Save Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h2 className="text-xl font-bold mb-4 text-red-700">{editingExpenseId ? 'Edit Expense' : 'Add Expense'}</h2>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select 
                    className="w-full border border-slate-300 rounded-lg p-2"
                    value={expenseForm.category}
                    onChange={e => setExpenseForm({...expenseForm, category: e.target.value as any})}
                >
                    <option value="Facebook Ads">Facebook Ads</option>
                    <option value="Gmail">Gmail Accounts (Bulk)</option>
                    <option value="Poster">Poster Marketing</option>
                    <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                 <label className="block text-sm font-medium mb-1">Amount (৳)</label>
                 <input 
                    type="number"
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500"
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm({...expenseForm, amount: Number(e.target.value)})}
                    placeholder="0.00"
                 />
              </div>

              <div>
                 <label className="block text-sm font-medium mb-1">Date</label>
                 <input 
                    type="date"
                    required
                    className="w-full border border-slate-300 rounded-lg p-2"
                    value={expenseForm.date}
                    onChange={e => setExpenseForm({...expenseForm, date: e.target.value})}
                 />
              </div>
              
               <div>
                 <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                 <input 
                    type="text"
                    className="w-full border border-slate-300 rounded-lg p-2"
                    value={expenseForm.description}
                    onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                 />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    {editingExpenseId ? 'Update Expense' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};