
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

  if (loading) return <div className="p-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Security Audit Trail</h1>
        <p className="text-sm text-slate-500">Real-time log of critical system actions and modifications</p>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
         <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
               <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
               {logs.map(log => (
                 <tr key={log.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-all">
                    <td className="px-6 py-4 text-xs font-medium text-slate-400 font-mono">
                       {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                       <p className="text-sm font-bold text-slate-800 dark:text-white">{log.user?.firstName} {log.user?.lastName}</p>
                       <p className="text-[10px] text-slate-400 capitalize">{log.user?.role}</p>
                    </td>
                    <td className="px-6 py-4">
                       <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md text-[10px] font-black uppercase">
                          {log.action}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                       {log.details || '—'}
                    </td>
                 </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};
