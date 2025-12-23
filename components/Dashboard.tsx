import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { TrendingUp, Users, DollarSign, CreditCard, PlusCircle, Facebook, Mail, Megaphone } from 'lucide-react';
import { MetricsCard } from './MetricsCard';
import { Transaction, PlanType } from '../types';

interface DashboardProps {
  transactions: Transaction[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

export const Dashboard: React.FC<DashboardProps> = ({ transactions, onAddTransaction }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Calculate Metrics
  const totalRevenue = transactions.reduce((acc, t) => acc + t.salePrice, 0);
  
  // Total Cost needs to include all breakdown costs if present
  const totalCost = transactions.reduce((acc, t) => {
      const base = t.costPrice;
      const gmail = t.gmailCost || 0;
      const fb = t.fbAdCost || 0;
      const poster = t.posterCost || 0;
      return acc + base + gmail + fb + poster;
  }, 0);

  const totalProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Prepare Chart Data
  const salesByPlan = Object.values(PlanType).map(type => {
    return {
      name: type,
      value: transactions.filter(t => t.planType === type).length
    };
  }).filter(d => d.value > 0);

  // Profit by Date
  const profitByDate = transactions.reduce((acc: any[], t) => {
    const existing = acc.find(item => item.date === t.date);
    const cost = t.costPrice + (t.gmailCost || 0) + (t.fbAdCost || 0) + (t.posterCost || 0);
    const profit = t.salePrice - cost;
    
    if (existing) {
      existing.profit += profit;
    } else {
      acc.push({ date: t.date, profit });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-7);

  // Add Transaction Form State
  const [newTrans, setNewTrans] = useState<Omit<Transaction, 'id'>>({
    customerName: '',
    planType: PlanType.PLUS,
    costPrice: 20,
    gmailCost: 0,
    fbAdCost: 0,
    posterCost: 0,
    salePrice: 25,
    currency: 'USD',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTransaction(newTrans);
    setIsModalOpen(false);
    // Reset form slightly but keep useful defaults
    setNewTrans(prev => ({ ...prev, customerName: '' }));
  };

  const getTransactionProfit = (t: Transaction) => {
      const allCosts = t.costPrice + (t.gmailCost || 0) + (t.fbAdCost || 0) + (t.posterCost || 0);
      return t.salePrice - allCosts;
  }

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard 
          title="Net Profit" 
          value={`$${totalProfit.toFixed(2)}`} 
          icon={TrendingUp} 
          color="green" 
          trend="Real Net" 
          trendUp={true} 
        />
        <MetricsCard 
          title="Total Revenue" 
          value={`$${totalRevenue.toFixed(2)}`} 
          icon={DollarSign} 
          color="blue" 
        />
        <MetricsCard 
          title="Active Sales" 
          value={transactions.length.toString()} 
          icon={Users} 
          color="purple" 
        />
        <MetricsCard 
          title="Net Margin" 
          value={`${margin.toFixed(1)}%`} 
          icon={CreditCard} 
          color="orange" 
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Net Profit Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitByDate}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#64748b" />
                <YAxis tick={{fontSize: 12}} stroke="#64748b" />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="profit" fill="#10B981" radius={[4, 4, 0, 0]} />
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

      {/* Recent Transactions & Add Button */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">Recent Transactions</h3>
          <button 
            onClick={() => setIsModalOpen(true)}
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
                <th className="px-6 py-3 text-right">Total Cost</th>
                <th className="px-6 py-3 text-right">Price</th>
                <th className="px-6 py-3 text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.slice().reverse().slice(0, 5).map((t) => {
                const totalC = t.costPrice + (t.gmailCost || 0) + (t.fbAdCost || 0) + (t.posterCost || 0);
                const prof = t.salePrice - totalC;
                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3">{t.date}</td>
                    <td className="px-6 py-3 font-medium text-slate-900">{t.customerName}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {t.planType}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-slate-500">${totalC.toFixed(2)}</td>
                    <td className="px-6 py-3 text-right text-slate-900">${t.salePrice}</td>
                    <td className={`px-6 py-3 text-right font-bold ${prof >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {prof >= 0 ? '+' : ''}${prof.toFixed(2)}
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

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold mb-4">Record New Sale</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Customer Name</label>
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
                <label className="block text-sm font-medium mb-1">Plan</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newTrans.planType}
                  onChange={e => setNewTrans({...newTrans, planType: e.target.value as PlanType})}
                >
                  {Object.values(PlanType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Cost Section */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">Cost Breakdown (Unit Economics)</p>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="block text-sm font-medium mb-1">Sub. Base Cost ($)</label>
                    <input 
                        type="number"
                        step="0.01"
                        required
                        className="w-full border border-slate-300 rounded-lg p-2"
                        value={newTrans.costPrice}
                        onChange={e => setNewTrans({...newTrans, costPrice: parseFloat(e.target.value)})}
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                        <Mail size={14} className="text-slate-400"/> Gmail Cost ($)
                    </label>
                    <input 
                        type="number"
                        step="0.01"
                        className="w-full border border-slate-300 rounded-lg p-2"
                        value={newTrans.gmailCost}
                        onChange={e => setNewTrans({...newTrans, gmailCost: parseFloat(e.target.value)})}
                        placeholder="0.00"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                        <Facebook size={14} className="text-slate-400"/> FB Ad (CPA) ($)
                    </label>
                    <input 
                        type="number"
                        step="0.01"
                        className="w-full border border-slate-300 rounded-lg p-2"
                        value={newTrans.fbAdCost}
                        onChange={e => setNewTrans({...newTrans, fbAdCost: parseFloat(e.target.value)})}
                        placeholder="0.00"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                        <Megaphone size={14} className="text-slate-400"/> Poster Cost ($)
                    </label>
                    <input 
                        type="number"
                        step="0.01"
                        className="w-full border border-slate-300 rounded-lg p-2"
                        value={newTrans.posterCost}
                        onChange={e => setNewTrans({...newTrans, posterCost: parseFloat(e.target.value)})}
                        placeholder="0.00"
                    />
                    </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-indigo-900">Final Sale Price ($)</label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  className="w-full border-2 border-indigo-100 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newTrans.salePrice}
                  onChange={e => setNewTrans({...newTrans, salePrice: parseFloat(e.target.value)})}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};