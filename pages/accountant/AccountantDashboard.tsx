
import React, { useState, useEffect } from 'react';
import { financeService } from '../../services/financeService';
import { Spinner } from '../../components/UI/Spinner';

export const AccountantDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financeService.getFinancialSummary().then(res => {
      setStats(res);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Financial Intelligence</h1>
        <p className="text-slate-500 dark:text-slate-400">Institutional revenue and treasury management (Ghana Edition)</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FinanceStatCard 
          label="Collected Revenue" 
          value={`GH₵ ${parseFloat(stats.totalCollected).toLocaleString()}`} 
          trend="+12%" 
          icon="💰" 
          color="emerald" 
        />
        <FinanceStatCard 
          label="Outstanding Fees" 
          value={`GH₵ ${parseFloat(stats.outstanding).toLocaleString()}`} 
          trend="-5%" 
          icon="⏳" 
          color="rose" 
        />
        <FinanceStatCard 
          label="Collection Rate" 
          value={`${stats.collectionRate}%`} 
          trend="Optimal" 
          icon="📈" 
          color="indigo" 
        />
        <FinanceStatCard 
          label="Defaulters" 
          value={stats.defaultersCount.toString()} 
          trend="Action Required" 
          icon="🚫" 
          color="amber" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
           <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Revenue Distribution</h2>
           <div className="h-64 flex items-end gap-4">
              {[60, 45, 80, 55, 90, 70, 85].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                   <div 
                    className="w-full bg-indigo-50 dark:bg-indigo-900/20 rounded-t-xl group-hover:bg-indigo-600 transition-all duration-500 flex items-end overflow-hidden" 
                    style={{ height: `${h}%` }}
                   >
                     <div className="w-full bg-indigo-600 h-0 group-hover:h-full transition-all duration-700"></div>
                   </div>
                   <span className="text-[10px] font-bold text-slate-400">Term {i+1}</span>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
           <div className="text-center">
              <div className="relative inline-flex items-center justify-center mb-6">
                 <svg className="w-40 h-40 transform -rotate-90">
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                    <circle 
                      cx="80" 
                      cy="80" 
                      r="70" 
                      stroke="currentColor" 
                      strokeWidth="12" 
                      fill="transparent" 
                      strokeDasharray={440} 
                      strokeDashoffset={440 - (440 * stats.collectionRate / 100)} 
                      className="text-indigo-600 transition-all duration-1000"
                    />
                 </svg>
                 <span className="absolute text-3xl font-black text-slate-900 dark:text-white">{stats.collectionRate}%</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Collection Efficiency</h3>
              <p className="text-sm text-slate-500 mt-2">Target collection rate is 95% for this academic term.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

const FinanceStatCard: React.FC<{ label: string; value: string; trend: string; icon: string; color: string }> = ({ label, value, trend, icon, color }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-12 h-12 rounded-2xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center text-2xl`}>
        {icon}
      </div>
      <span className={`text-[10px] font-black uppercase tracking-widest ${color === 'rose' ? 'text-rose-600' : 'text-emerald-600'}`}>
        {trend}
      </span>
    </div>
    <p className="text-sm font-medium text-slate-400">{label}</p>
    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{value}</p>
  </div>
);
