import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, Target, Mail, Megaphone } from 'lucide-react';

export const ProfitCalculator: React.FC = () => {
  // Income
  const [price, setPrice] = useState<number>(25);
  
  // Costs
  const [baseCost, setBaseCost] = useState<number>(15);
  const [gmailCost, setGmailCost] = useState<number>(1.50);
  const [fbAdCost, setFbAdCost] = useState<number>(2.00);
  const [posterCost, setPosterCost] = useState<number>(0.50);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [fees, setFees] = useState<number>(0);
  
  // Results
  const [totalCost, setTotalCost] = useState<number>(0);
  const [profit, setProfit] = useState<number>(0);
  const [margin, setMargin] = useState<number>(0);

  const totalUnitCost = baseCost + gmailCost + fbAdCost + posterCost;

  useEffect(() => {
    // Logic: (Sale Price - Fees) - ((Base + Gmail + Ads + Poster) * Exchange Rate)
    // Assuming Marketing/Gmail costs are in the same currency base as Base Cost (often USD for resellers)
    // or typically these are local costs. Let's assume user inputs everything in one currency or converts mentally, 
    // but usually Base Cost is USD.
    // To keep it simple but flexible: We assume all Cost inputs are in the same currency unit as Base Cost.
    
    const totalCostConverted = totalUnitCost * exchangeRate;
    
    const netSale = price - fees;
    const calcProfit = netSale - totalCostConverted;
    const calcMargin = netSale > 0 ? (calcProfit / netSale) * 100 : 0;

    setTotalCost(totalCostConverted);
    setProfit(calcProfit);
    setMargin(calcMargin);
  }, [totalUnitCost, price, exchangeRate, fees]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-indigo-600" />
          True Profit Calculator
        </h2>
      </div>
      
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          
          {/* Revenue Section */}
          <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 space-y-4">
            <h3 className="text-sm font-semibold text-green-800 flex items-center gap-2">
              <DollarSign size={16} /> Revenue
            </h3>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Selling Price (Local)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Exchange Rate (1 Cost Unit = ? Local)</label>
              <input
                type="number"
                step="0.01"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Costs Section */}
          <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 space-y-4">
            <h3 className="text-sm font-semibold text-red-800 flex items-center gap-2">
              <Target size={16} /> Costs Breakdown (Per Unit)
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sub. Base Cost</label>
                <input
                  type="number"
                  value={baseCost}
                  onChange={(e) => setBaseCost(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                  <Mail size={12} /> Gmail Cost
                </label>
                <input
                  type="number"
                  value={gmailCost}
                  onChange={(e) => setGmailCost(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                  <Megaphone size={12} /> FB Ads (CPA)
                </label>
                <input
                  type="number"
                  value={fbAdCost}
                  onChange={(e) => setFbAdCost(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                  <Target size={12} /> Poster Cost
                </label>
                <input
                  type="number"
                  value={posterCost}
                  onChange={(e) => setPosterCost(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
            </div>
             <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Platform Fees</label>
                <input
                  type="number"
                  value={fees}
                  onChange={(e) => setFees(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
          </div>

        </div>

        {/* Results Column */}
        <div className="flex flex-col justify-center space-y-6">
          <div className="bg-indigo-50 rounded-xl p-8 text-center space-y-6">
            <div>
              <p className="text-sm font-medium text-indigo-600 uppercase tracking-wide">Net Profit</p>
              <p className={`text-5xl font-bold mt-2 ${profit >= 0 ? 'text-indigo-900' : 'text-red-600'}`}>
                {profit.toFixed(2)}
              </p>
              <p className="text-xs text-indigo-400 mt-1">per sale</p>
            </div>

            <div className="w-full border-t border-indigo-200"></div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-xs font-medium text-indigo-500 uppercase">Margin</p>
                    <p className={`text-2xl font-bold mt-1 ${margin >= 20 ? 'text-green-600' : 'text-orange-500'}`}>
                    {margin.toFixed(1)}%
                    </p>
                </div>
                <div>
                    <p className="text-xs font-medium text-indigo-500 uppercase">Total Cost</p>
                    <p className="text-2xl font-bold mt-1 text-slate-700">
                    {totalCost.toFixed(2)}
                    </p>
                </div>
            </div>
            
            <div className="text-xs text-slate-500 bg-white/50 p-3 rounded-lg">
             <span className="font-semibold">Formula:</span> Sale - (Sub + Gmail + FB + Poster + Fees)
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h4 className="font-medium text-slate-800 text-sm mb-3">Cost Composition</h4>
              <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Subscription Base</span>
                      <span className="font-medium">{totalUnitCost > 0 ? ((baseCost / totalUnitCost) * 100).toFixed(0) : 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${totalUnitCost > 0 ? (baseCost / totalUnitCost) * 100 : 0}%` }}></div>
                  </div>
                  
                  <div className="flex justify-between text-xs pt-1">
                      <span className="text-slate-500">Marketing (FB + Poster)</span>
                      <span className="font-medium">{totalUnitCost > 0 ? (((fbAdCost + posterCost) / totalUnitCost) * 100).toFixed(0) : 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${totalUnitCost > 0 ? ((fbAdCost + posterCost) / totalUnitCost) * 100 : 0}%` }}></div>
                  </div>

                  <div className="flex justify-between text-xs pt-1">
                      <span className="text-slate-500">Gmail Accounts</span>
                      <span className="font-medium">{totalUnitCost > 0 ? ((gmailCost / totalUnitCost) * 100).toFixed(0) : 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${totalUnitCost > 0 ? (gmailCost / totalUnitCost) * 100 : 0}%` }}></div>
                  </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};