import React, { useState, useEffect } from 'react';
import { loggingService } from '../../services/loggingService';
import { Spinner } from '../../components/UI/Spinner';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loggingService.getLogs().then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-40 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Security Audit Trail</h1>
        <p className="text-sm text-slate-500 font-medium">Cloud-synced log of administrative and financial modifications</p>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-500 responsive-table">
         <div className="table-wrapper">
           <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                 <tr>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">Timestamp</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">Operator</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">Action Type</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">Parameters</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                 {logs.map(log => (
                   <tr key={log.id} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-900/5 transition-all group animated">
                      <td className="px-8 py-6 text-[11px] font-bold text-slate-400 font-mono tracking-tighter" data-label="Timestamp">
                         {new Date(log.timestamp).toLocaleString(undefined, {
                           year: 'numeric', month: 'short', day: 'numeric',
                           hour: '2-digit', minute: '2-digit', second: '2-digit'
                         })}
                      </td>
                      <td className="px-8 py-6" data-label="Operator">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-black text-[10px] uppercase">
                               {log.user?.firstName?.[0] || 'A'}
                            </div>
                            <div className="overflow-hidden">
                               <p className="text-sm font-black text-slate-800 dark:text-white truncate">{log.user?.firstName} {log.user?.lastName}</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{log.user?.role}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-6" data-label="Action Type">
                         <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100/50 dark:border-indigo-800/50">
                            {log.action}
                         </span>
                      </td>
                      <td className="px-8 py-6 text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed" data-label="Parameters">
                         <div className="max-w-md break-words">
                            {log.details || <span className="italic opacity-50">No data payload</span>}
                         </div>
                      </td>
                   </tr>
                 ))}
                 {logs.length === 0 && (
                   <tr>
                     <td colSpan={4} className="py-40 text-center">
                        <div className="text-6xl mb-6 opacity-10">🛡️</div>
                        <h3 className="text-lg font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Audit Trail Clear</h3>
                        <p className="text-sm text-slate-400 italic">Security logs will populate as operators interact with critical endpoints.</p>
                     </td>
                   </tr>
                 )}
              </tbody>
           </table>
         </div>
      </div>
      
      <div className="p-8 bg-slate-900 rounded-[2.5rem] text-slate-400 flex flex-col md:flex-row items-center justify-between gap-6 no-print border border-slate-800">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-2xl">🔒</div>
            <div>
               <p className="text-white font-black text-lg">Immutable Ledger</p>
               <p className="text-xs">Security logs are archived in real-time and cannot be modified by staff.</p>
            </div>
         </div>
         <button className="px-10 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all text-sm uppercase tracking-widest">
            Export Archive (CSV)
         </button>
      </div>
    </div>
  );
};