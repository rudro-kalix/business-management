import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { TrendingUp, Users, DollarSign, CreditCard, PlusCircle, MinusCircle, Facebook, Mail, Megaphone, Receipt } from 'lucide-react';
import { MetricsCard } from './MetricsCard';
import { Transaction, PlanType, Expense } from '../types';

interface DashboardProps {
  transactions: Transaction[];
  expenses: Expense[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onAddExpense: (e: Omit<Expense, 'id'>) => void;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

export const Dashboard: React.FC<DashboardProps> = ({ transactions, expenses, onAddTransaction, onAddExpense }) => {
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  
  // 1. Calculate Metrics
  const totalRevenue = transactions.reduce((acc, t) => acc + t.salePrice, 0);
  
  // COGS = Cost of Goods Sold (Base subscription cost only)
  const totalCOGS = transactions.reduce((acc, t) => acc + t.costPrice, 0);
  
  // OpEx = Operating Expenses (Ads, Gmails, Posters)
  const totalOpEx = expenses.reduce((acc, e) => acc + e.amount, 0);

  // Net Profit
  const totalProfit = totalRevenue - totalCOGS - totalOpEx;
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // 2. Prepare Chart Data
  const salesByPlan = Object.values(PlanType).map(type => {
    return {
      name: type,
      value: transactions.filter(t => t.planType === type).length
    };
  }).filter(d => d.value > 0);

  // Profit Trend (Simplified for daily view - assumes linear distribution of OpEx for simplicity in viz, or just shows Gross Profit daily)
  // Let's show Daily Revenue vs Daily Gross Profit to keep it simple, as OpEx is often lump sum.
  const dailyMetrics = transactions.reduce((acc: any[], t) => {
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
  const [newTrans, setNewTrans] = useState<Omit<Transaction, 'id'>>({
    customerName: '',
    planType: PlanType.PLUS,
    costPrice: 10,
    salePrice: 25,
    currency: 'USD',
    date: new Date().toISOString().split('T')[0]
  });

  const [newExpense, setNewExpense] = useState<Omit<Expense, 'id'>>({
    category: 'Facebook Ads',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTransaction(newTrans);
    setIsSaleModalOpen(false);
    setNewTrans(prev => ({ ...prev, customerName: '' }));
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddExpense(newExpense);
    setIsExpenseModalOpen(false);
    setNewExpense(prev => ({ ...prev, amount: 0, description: '' }));
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard 
          title="Net Profit" 
          value={`$${totalProfit.toFixed(2)}`} 
          icon={TrendingUp} 
          color={totalProfit >= 0 ? "green" : "red"} 
          trend="Revenue - (COGS + Exp)" 
          trendUp={totalProfit >= 0} 
        />
        <MetricsCard 
          title="Total Revenue" 
          value={`$${totalRevenue.toFixed(2)}`} 
          icon={DollarSign} 
          color="blue" 
        />
        <MetricsCard 
          title="Total Expenses" 
          value={`$${totalOpEx.toFixed(2)}`} 
          icon={Receipt} 
          color="orange" 
        />
         <MetricsCard 
          title="Active Sales" 
          value={transactions.length.toString()} 
          icon={Users} 
          color="purple" 
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gross Profit Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Daily Gross Profit (Before OpEx)</h3>
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
                <Bar dataKey="grossProfit" fill="#10B981" radius={[4, 4, 0, 0]} name="Gross Profit" />
                <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Revenue" hide />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Plan */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Sales by Plan Type</h3>
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
              onClick={() => setIsExpenseModalOpen(true)}
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
                            <tr key={e.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2 font-medium text-slate-700">
                                        {e.category === 'Facebook Ads' && <Facebook size={14} className="text-blue-600"/>}
                                        {e.category === 'Gmail' && <Mail size={14} className="text-red-500"/>}
                                        {e.category === 'Poster' && <Megaphone size={14} className="text-orange-500"/>}
                                        {e.category === 'Other' && <Receipt size={14} className="text-slate-400"/>}
                                        {e.category}
                                    </div>
                                    <div className="text-xs text-slate-400">{e.date}</div>
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-red-600">-${e.amount}</td>
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
            <h3 className="text-lg font-semibold text-slate-800">Recent Sales</h3>
            <button 
                onClick={() => setIsSaleModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
                <PlusCircle size={18} />
                Add Sale
            </button>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Plan</th>
                    <th className="px-6 py-3 text-right">Cost</th>
                    <th className="px-6 py-3 text-right">Price</th>
                    <th className="px-6 py-3 text-right">Gross Profit</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {transactions.slice().reverse().slice(0, 5).map((t) => {
                    const gross = t.salePrice - t.costPrice;
                    return (
                    <tr key={t.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3">{t.date}</td>
                        <td className="px-6 py-3 font-medium text-slate-900">{t.customerName}</td>
                        <td className="px-6 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {t.planType}
                        </span>
                        </td>
                        <td className="px-6 py-3 text-right text-slate-500">${t.costPrice}</td>
                        <td className="px-6 py-3 text-right text-slate-900">${t.salePrice}</td>
                        <td className="px-6 py-3 text-right font-bold text-green-600">
                        +${gross.toFixed(2)}
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

      {/* Add Sale Modal */}
      {isSaleModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">Record New Sale</h2>
            <form onSubmit={handleSaleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Customer</label>
                  <input 
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newTrans.customerName}
                    onChange={e => setNewTrans({...newTrans, customerName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input 
                    type="date"
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newTrans.date}
                    onChange={e => setNewTrans({...newTrans, date: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Plan Type</label>
                <select 
                    className="w-full border border-slate-300 rounded-lg p-2"
                    value={newTrans.planType}
                    onChange={e => setNewTrans({...newTrans, planType: e.target.value as PlanType})}
                >
                    {Object.values(PlanType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Base Cost ($)</label>
                  <input 
                    type="number"
                    required
                    className="w-full border border-slate-300 rounded-lg p-2"
                    value={newTrans.costPrice}
                    onChange={e => setNewTrans({...newTrans, costPrice: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sale Price ($)</label>
                  <input 
                    type="number"
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                    value={newTrans.salePrice}
                    onChange={e => setNewTrans({...newTrans, salePrice: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                <button type="button" onClick={() => setIsSaleModalOpen(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Sale</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h2 className="text-xl font-bold mb-4 text-red-700">Add Expense</h2>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select 
                    className="w-full border border-slate-300 rounded-lg p-2"
                    value={newExpense.category}
                    onChange={e => setNewExpense({...newExpense, category: e.target.value as any})}
                >
                    <option value="Facebook Ads">Facebook Ads</option>
                    <option value="Gmail">Gmail Accounts (Bulk)</option>
                    <option value="Poster">Poster Marketing</option>
                    <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                 <label className="block text-sm font-medium mb-1">Amount ($)</label>
                 <input 
                    type="number"
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500"
                    value={newExpense.amount}
                    onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                    placeholder="0.00"
                 />
              </div>

              <div>
                 <label className="block text-sm font-medium mb-1">Date</label>
                 <input 
                    type="date"
                    required
                    className="w-full border border-slate-300 rounded-lg p-2"
                    value={newExpense.date}
                    onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                 />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Add Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};