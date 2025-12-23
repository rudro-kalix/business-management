import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, Target, Mail, Megaphone, Users, TrendingUp } from 'lucide-react';

export const ProfitCalculator: React.FC = () => {
  // Unit Economics
  const [salePrice, setSalePrice] = useState<number>(450);
  const [baseCost, setBaseCost] = useState<number>(250); // Cost per subscription

  // Total Operational Costs (OpEx)
  const [totalGmailCost, setTotalGmailCost] = useState<number>(1200);
  const [totalFbAdCost, setTotalFbAdCost] = useState<number>(2500);
  const [totalPosterCost, setTotalPosterCost] = useState<number>(800);
  
  // Volume Scenario
  const [salesVolume, setSalesVolume] = useState<number>(20);

  // Results
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalCOGS, setTotalCOGS] = useState<number>(0);
  const [totalOpEx, setTotalOpEx] = useState<number>(0);
  const [netProfit, setNetProfit] = useState<number>(0);
  const [breakEvenPoint, setBreakEvenPoint] = useState<number>(0);

  useEffect(() => {
    // 1. Calculate Totals
    const revenue = salePrice * salesVolume;
    const cogs = baseCost * salesVolume; // Cost of Goods Sold
    const opEx = totalGmailCost + totalFbAdCost + totalPosterCost;

    // 2. Net Profit
    const profit = revenue - cogs - opEx;

    // 3. Break Even Point (Fixed Costs / (Price - Variable Cost))
    const contributionMargin = salePrice - baseCost;
    const bep = contributionMargin > 0 ? Math.ceil(opEx / contributionMargin) : 9999;

    setTotalRevenue(revenue);
    setTotalCOGS(cogs);
    setTotalOpEx(opEx);
    setNetProfit(profit);
    setBreakEvenPoint(bep);
  }, [salePrice, baseCost, totalGmailCost, totalFbAdCost, totalPosterCost, salesVolume]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-indigo-600" />
          Campaign Profitability Calculator
        </h2>
      </div>
      
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          
          {/* Unit Economics */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4">
            <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
              <Users size={16} /> Unit Economics (Per Person)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sale Price (৳)</label>
                <input
                  type="number"
                  value={salePrice}
                  onChange={(e) => setSalePrice(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Base Cost (৳)</label>
                <input
                  type="number"
                  value={baseCost}
                  onChange={(e) => setBaseCost(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <p className="text-xs text-blue-600 font-medium">
              You make ৳{salePrice - baseCost} per sale before marketing expenses.
            </p>
          </div>

          {/* Total Costs Section */}
          <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 space-y-4">
            <h3 className="text-sm font-semibold text-orange-800 flex items-center gap-2">
              <Target size={16} /> Total Expenses (Fixed)
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                  <Mail size={12} /> Total Gmail Accounts Cost (৳)
                </label>
                <input
                  type="number"
                  value={totalGmailCost}
                  onChange={(e) => setTotalGmailCost(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                  <Megaphone size={12} /> Total Facebook Ads Budget (৳)
                </label>
                <input
                  type="number"
                  value={totalFbAdCost}
                  onChange={(e) => setTotalFbAdCost(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                  <Target size={12} /> Total Poster Marketing Cost (৳)
                </label>
                <input
                  type="number"
                  value={totalPosterCost}
                  onChange={(e) => setTotalPosterCost(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Volume Slider */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
             <label className="block text-sm font-medium text-slate-700 mb-2 flex justify-between">
                <span>Sales Volume Scenario</span>
                <span className="text-indigo-600 font-bold">{salesVolume} sales</span>
             </label>
             <input 
                type="range" 
                min="0" 
                max="200" 
                value={salesVolume}
                onChange={(e) => setSalesVolume(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
             />
             <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>0</span>
                <span>100</span>
                <span>200+</span>
             </div>
          </div>

        </div>

        {/* Results Column */}
        <div className="flex flex-col space-y-6">
          <div className={`rounded-xl p-8 text-center space-y-6 transition-colors duration-300 ${netProfit >= 0 ? 'bg-indigo-50' : 'bg-red-50'}`}>
            <div>
              <p className={`text-sm font-medium uppercase tracking-wide ${netProfit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                Total Net Profit
              </p>
              <p className={`text-5xl font-bold mt-2 ${netProfit >= 0 ? 'text-indigo-900' : 'text-red-600'}`}>
                {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(2)}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                 BDT (৳) at {salesVolume} sales
              </p>
            </div>

            <div className={`w-full border-t ${netProfit >= 0 ? 'border-indigo-200' : 'border-red-200'}`}></div>

            <div className="grid grid-cols-2 gap-4">
                <div className="text-left">
                    <p className="text-xs text-slate-500">Total Revenue</p>
                    <p className="text-xl font-bold text-slate-800">৳{totalRevenue}</p>
                </div>
                 <div className="text-left">
                    <p className="text-xs text-slate-500">Total Expenses (Fixed)</p>
                    <p className="text-xl font-bold text-red-600">-৳{totalOpEx}</p>
                </div>
                 <div className="text-left">
                    <p className="text-xs text-slate-500">Total COGS (Variable)</p>
                    <p className="text-xl font-bold text-orange-600">-৳{totalCOGS}</p>
                </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
             <TrendingUp className="text-green-500 mb-2" size={24} />
             <h4 className="font-semibold text-slate-800">Break-Even Point</h4>
             <p className="text-sm text-slate-500 mt-1">
               You need to make <span className="font-bold text-slate-900">{breakEvenPoint} sales</span> to cover your total expenses of ৳{totalOpEx}.
             </p>
             {salesVolume >= breakEvenPoint ? (
               <div className="mt-3 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                 Profitable Zone
               </div>
             ) : (
                <div className="mt-3 px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                 Loss Zone
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};