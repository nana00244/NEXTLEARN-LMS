
import React, { useState, useEffect } from 'react';
import { financeService } from '../../services/financeService';
import { Spinner } from '../../components/UI/Spinner';
import { Link } from 'react-router-dom';

export const StudentFinanceList: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    financeService.getStudentFinancials().then(res => {
      setStudents(res);
      setLoading(false);
    });
  }, []);

  const filtered = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.admissionNumber.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="p-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Fee Roster</h1>
          <p className="text-sm text-slate-500">Monitor individual student financial profiles</p>
        </div>
        <div className="flex gap-2">
           <input 
            type="text"
            placeholder="Search by name or ID..."
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
           />
           <select 
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-sm outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
           >
             <option value="all">All Status</option>
             <option value="paid">Paid</option>
             <option value="partial">Partial</option>
             <option value="unpaid">Unpaid</option>
           </select>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Class</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Total Due</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Paid</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Balance</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map(s => (
              <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                      {s.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{s.name}</p>
                      <p className="text-[10px] text-slate-400">{s.admissionNumber}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-400">{s.className}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-white text-right">GH₵ {s.totalDue.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">GH₵ {s.totalPaid.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm font-bold text-rose-600 text-right">GH₵ {s.balance.toLocaleString()}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                    s.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                    s.status === 'partial' ? 'bg-amber-50 text-amber-600' :
                    'bg-rose-50 text-rose-600'
                  }`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    to={`/accountant/payments/new?studentId=${s.id}`}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
                  >
                    Pay
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-slate-500 italic">No financial records matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};
