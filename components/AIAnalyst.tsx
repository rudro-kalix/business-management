import React, { useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { Transaction } from '../types';
import { analyzeBusinessData, forecastSales } from '../services/geminiService';
import ReactMarkdown from 'react-markdown'; // Assuming we can use standard markdown rendering or just text
// Since I cannot add new libraries easily in this format without explicit request, I will just render text with whitespace preserved or basic formatting.

interface AIAnalystProps {
  transactions: Transaction[];
}

export const AIAnalyst: React.FC<AIAnalystProps> = ({ transactions }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'chat' | 'forecast'>('chat');

  const handleAnalyze = async () => {
    if (!query.trim() && mode === 'chat') return;
    
    setIsLoading(true);
    setResponse(null);
    try {
        let result: string;
        if (mode === 'forecast') {
            result = await forecastSales(transactions);
        } else {
            result = await analyzeBusinessData(transactions, query);
        }
        setResponse(result);
    } catch (e) {
      setResponse("Failed to generate analysis. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Gemini Business Analyst</h2>
            <p className="text-sm text-slate-500">Ask questions about your sales, profits, or future trends.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
        {!response && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8">
            <Sparkles size={48} className="mb-4 text-indigo-200" />
            <p className="text-lg font-medium text-slate-600">How can I help you grow today?</p>
            <p className="text-sm mt-2 max-w-md">Try asking: "Which plan has the best margin?" or "How can I increase my profit by 10% next month?"</p>
            
            <div className="mt-8 flex gap-3">
                <button 
                    onClick={() => { setMode('forecast'); handleAnalyze(); }}
                    className="px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-full text-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                    Run Sales Forecast
                </button>
                <button 
                     onClick={() => { setQuery("What is my most profitable customer segment?"); setMode('chat'); }}
                    className="px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-full text-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                    Analyze Customer Segments
                </button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="h-full flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
            <p className="text-slate-500">Analyzing your business data...</p>
          </div>
        )}

        {response && (
          <div className="prose prose-slate max-w-none bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             {/* Simple rendering for the response text. In a real app, use ReactMarkdown */}
             <div className="whitespace-pre-wrap leading-relaxed text-slate-700">
                {response}
             </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex gap-2 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setMode('chat'); }}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="Ask anything about your business..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
          />
          <button 
            onClick={handleAnalyze}
            disabled={isLoading}
            className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};