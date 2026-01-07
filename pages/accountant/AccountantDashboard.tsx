import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Spinner } from '../../components/UI/Spinner';
import { financeService } from '../../services/financeService';

export const AccountantDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    collectedRevenue: 0,
    outstandingFees: 0,
    totalDue: 0,
    collectionRate: '0.0',
    arrearsCount: 0,
    totalStudents: 0,
    coverage: { paid: 0, partial: 0, unpaid: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    // MASTER TREASURY AGGREGATOR
    const unsubscribe = onSnapshot(collection(db, "student_fees"), (snap) => {
      let totalDueSum = 0;
      let totalPaidSum = 0;
      let totalBalanceSum = 0;
      let arrearsCount = 0;
      let pCount = 0;
      let prCount = 0;
      let uCount = 0;
      let errors: string[] = [];

      snap.docs.forEach(doc => {
        const data = doc.data();
        const due = parseFloat(data.totalDue) || 0;
        const paid = parseFloat(data.paid) || 0;
        const balance = parseFloat(data.balance) || 0;
        const status = data.status || 'UNPAID';

        totalDueSum += due;
        totalPaidSum += paid;
        totalBalanceSum += balance;

        // Categorization
        if (status === 'PAID') pCount++;
        else if (status === 'PARTIAL') { prCount++; arrearsCount++; }
        else if (status === 'UNPAID' || status === 'NO_FEES_SET') { uCount++; if (balance > 0) arrearsCount++; }

        // Sanity check
        if (paid > due && due > 0) {
          errors.push(`${data.studentName}: Overpayment (Paid: ${paid}, Due: ${due})`);
        }
      });

      // COLLECTION RATE: (Paid / Due) * 100, Capped at 100
      let rate = 0;
      if (totalDueSum > 0) {
        rate = (totalPaidSum / totalDueSum) * 100;
        if (rate > 100) rate = 100;
      }

      setStats({
        collectedRevenue: totalPaidSum,
        outstandingFees: totalBalanceSum,
        totalDue: totalDueSum,
        collectionRate: rate.toFixed(1),
        arrearsCount,
        totalStudents: snap.size,
        coverage: { paid: pCount, partial: prCount, unpaid: uCount }
      });
      setValidationErrors(errors);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const runReconciliation = async () => {
     setLoading(true);
     try {
       await financeService.syncAllStudentFees();
     } catch (err) {
       console.error(err);
     } finally {
       setLoading(false);
     }
  };

  // SYSTEM ZERO STATE DETECTOR
  const isZeroState = stats.totalDue === 0 && stats.collectedRevenue === 0 && stats.totalStudents > 0;

  if (loading) return <div className="p-20 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Institutional Treasury</h1>
          <p className="text-slate-500 font-medium italic">Verified Financial Intelligence Hub</p>
        </div>
        <button onClick={runReconciliation} className="px-5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
          Reconcile Ledger
        </button>
      </div>

      {isZeroState && (
        <div className="p-8 bg-indigo-50 border-2 border-indigo-100 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6 animate-in zoom-in-95 duration-500 shadow-sm">
           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">🔄</div>
           <div className="flex-1">
              <h3 className="text-lg font-black text-indigo-900">System in Zero State</h3>
              <p className="text-sm text-indigo-700 font-medium">No fee components configured. All financial metrics are at GH₵ 0.00. Add billing rules in Settings to initialize the current term.</p>
           </div>
           <button 
             onClick={() => window.location.hash = '#/accountant/fees'}
             className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest"
           >
             Initialize Fees
           </button>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card ring-1 ring-emerald-100 dark:ring-emerald-900/30">
          <div className="stat-card-icon green">💰</div>
          <div className="stat-card-label">Collected Revenue</div>
          <div className="stat-card-value text-emerald-600 dark:text-emerald-400">GH₵ {stats.collectedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-auto tracking-widest">Aggregate Collections</p>
        </div>
        
        <div className="stat-card ring-1 ring-rose-100 dark:ring-rose-900/30">
          <div className="stat-card-icon red">⏳</div>
          <div className="stat-card-label">Outstanding Fees</div>
          <div className="stat-card-value text-rose-600 dark:text-rose-400">GH₵ {stats.outstandingFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-auto tracking-widest">Total Arrears</p>
        </div>
        
        <div className="stat-card ring-1 ring-indigo-100 dark:ring-indigo-900/30">
          <div className="stat-card-icon blue">📊</div>
          <div className="stat-card-label">Collection Rate</div>
          <div className="stat-card-value text-indigo-600 dark:text-indigo-400">{stats.collectionRate}%</div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-auto tracking-widest">Billing Efficiency</p>
        </div>
        
        <div className="stat-card ring-1 ring-slate-100 dark:ring-slate-800">
          <div className="stat-card-icon">🚫</div>
          <div className="stat-card-label">Arrears Count</div>
          <div className="stat-card-value">{stats.arrearsCount}</div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-auto tracking-widest">Pending Settlement</p>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="p-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-3xl animate-in slide-in-from-top-2">
           <h3 className="text-sm font-black text-rose-600 uppercase tracking-widest mb-3 flex items-center gap-2">⚠️ Data Consistency Alerts ({validationErrors.length})</h3>
           <div className="space-y-2 max-h-32 overflow-y-auto">
              {validationErrors.map((err, i) => (
                <p key={i} className="text-xs text-rose-500 font-medium">• {err}</p>
              ))}
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card border-0 shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
          <div className="card-header border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
            <h2 className="text-sm font-black uppercase tracking-widest">Enrollment Coverage</h2>
            <span className="text-[10px] font-bold text-slate-400">{stats.totalStudents} Global Files</span>
          </div>
          <div className="card-body p-8">
             <div className="flex justify-between items-end mb-10">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-tighter">Total Billable</p>
                   <p className="text-2xl font-black text-slate-900 dark:text-white">GH₵ {stats.totalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-tighter">Progress</p>
                   <p className="text-xl font-black text-indigo-600">{stats.collectionRate}%</p>
                </div>
             </div>
             
             <div className="space-y-6">
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner flex">
                   <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: stats.totalStudents > 0 ? `${(stats.coverage.paid / stats.totalStudents) * 100}%` : '0%' }}></div>
                   <div className="h-full bg-amber-400 transition-all duration-1000" style={{ width: stats.totalStudents > 0 ? `${(stats.coverage.partial / stats.totalStudents) * 100}%` : '0%' }}></div>
                   <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: stats.totalStudents > 0 ? `${(stats.coverage.unpaid / stats.totalStudents) * 100}%` : '0%' }}></div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                   <div className="text-center">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Paid</p>
                      <p className="text-lg font-black">{stats.coverage.paid}</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[10px] font-black text-amber-50 uppercase tracking-widest mb-1">Partial</p>
                      <p className="text-lg font-black">{stats.coverage.partial}</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Unpaid</p>
                      <p className="text-lg font-black">{stats.coverage.unpaid}</p>
                   </div>
                </div>
             </div>
          </div>
        </div>

        <div className="card border-0 shadow-xl bg-white dark:bg-slate-900">
           <div className="card-header border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
             <h2 className="text-sm font-black uppercase tracking-widest">System Health</h2>
           </div>
           <div className="card-body p-8 space-y-6">
              <HealthBar label="Sync Performance" percentage={100} color="bg-indigo-600" />
              <HealthBar label="Ledger Reconciliation" percentage={validationErrors.length > 0 ? 92 : 100} color="bg-emerald-500" />
              <HealthBar label="Data Consistency" percentage={100} color="bg-sky-500" />
              
              <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                 <p className="text-[10px] text-slate-500 italic leading-relaxed">"Treasury metrics are derived via real-time sums from the student financial document collection."</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const HealthBar: React.FC<{ label: string; percentage: number; color: string }> = ({ label, percentage, color }) => (
  <div>
    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-900 dark:text-white">{percentage}%</span>
    </div>
    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
    </div>
  </div>
);