
import React, { useState, useEffect } from 'react';
import { payrollService } from '../../services/payrollService';
import { adminService } from '../../services/adminService';
import { Spinner } from '../../components/UI/Spinner';
import { Alert } from '../../components/UI/Alert';
import { SalaryStructure, Payslip } from '../../types';

export const PayrollManager: React.FC = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [month, setMonth] = useState('October');
  const [year, setYear] = useState(2023);

  useEffect(() => {
    adminService.getStaff().then(data => {
      setStaff(data);
      setLoading(false);
    });
  }, []);

  const handleRunPayroll = async () => {
    setProcessing(true);
    try {
      await payrollService.generateMonthlyPayroll(month, year);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert("Payroll generation failed.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Treasury & Payroll</h1>
          <p className="text-slate-500">Manage institutional disbursements and staff compensation</p>
        </div>
        <div className="flex gap-3">
          <select 
            className="px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-sm font-bold"
            value={month}
            onChange={e => setMonth(e.target.value)}
          >
            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button 
            onClick={handleRunPayroll}
            disabled={processing}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all"
          >
            {processing ? <Spinner size="sm" /> : 'Run Monthly Batch'}
          </button>
        </div>
      </header>

      {success && <Alert type="success" message={`Payroll batch for ${month} processed successfully!`} />}

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Position</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Base Salary</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Deductions</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Net Pay</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {staff.map(member => (
              <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all">
                <td className="px-6 py-4">
                   <p className="text-sm font-bold text-slate-900 dark:text-white">{member.firstName} {member.lastName}</p>
                   <p className="text-[10px] text-slate-400">{member.email}</p>
                </td>
                <td className="px-6 py-4 capitalize text-xs text-slate-600 dark:text-slate-400">{member.role}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white text-right">GH₵ 4,500.00</td>
                <td className="px-6 py-4 text-sm font-bold text-rose-600 text-right">GH₵ 750.00</td>
                <td className="px-6 py-4 text-sm font-black text-indigo-600 text-right">GH₵ 4,750.00</td>
                <td className="px-6 py-4 text-center">
                   <button className="text-xs font-bold text-indigo-600 hover:underline">Manage Structure</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
