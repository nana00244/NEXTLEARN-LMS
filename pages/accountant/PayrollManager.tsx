import React, { useState, useEffect } from 'react';
import { payrollService } from '../../services/payrollService';
import { adminService } from '../../services/adminService';
import { Spinner } from '../../components/UI/Spinner';
import { Alert } from '../../components/UI/Alert';
import { SalaryStructure, Payslip, User } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const PayrollManager: React.FC = () => {
  const { user: authUser } = useAuth();
  const [staff, setStaff] = useState<any[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState(false);
  
  // Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [salaryForm, setSalaryForm] = useState({
    baseSalary: 0,
    housingAllowance: 0,
    transportAllowance: 0,
    otherAllowances: 0,
    taxDeduction: 0,
    insuranceDeduction: 0
  });

  const [month, setMonth] = useState('October');
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffData, structures] = await Promise.all([
        adminService.getStaff(),
        payrollService.getSalaryStructures()
      ]);
      setStaff(staffData);
      setSalaryStructures(structures);
      setPermissionError(false);
    } catch (err: any) {
      if (err.message.includes('ACCESS DENIED') || err.message.includes('permission')) setPermissionError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunPayroll = async () => {
    setProcessing(true);
    try {
      await payrollService.generateMonthlyPayroll(month, year);
      setSuccess(`Payroll batch for ${month} ${year} processed successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      if (err.message.includes('ACCESS DENIED') || err.message.includes('permission')) setPermissionError(true);
      else alert("Payroll generation failed.");
    } finally {
      setProcessing(false);
    }
  };

  const openEditModal = (member: any) => {
    const existing = salaryStructures.find(s => s.userId === member.id);
    setEditingStaff(member);
    setSalaryForm({
      baseSalary: existing?.baseSalary || 0,
      housingAllowance: existing?.housingAllowance || 0,
      transportAllowance: existing?.transportAllowance || 0,
      otherAllowances: existing?.otherAllowances || 0,
      taxDeduction: existing?.taxDeduction || 0,
      insuranceDeduction: existing?.insuranceDeduction || 0
    });
    setShowEditModal(true);
  };

  const handleSaveStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    
    setProcessing(true);
    try {
      const existing = salaryStructures.find(s => s.userId === editingStaff.id);
      await payrollService.saveSalaryStructure({
        ...salaryForm,
        id: existing?.id,
        userId: editingStaff.id
      });
      setSuccess(`Salary structure updated for ${editingStaff.firstName}`);
      setShowEditModal(false);
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      if (err.message.includes('ACCESS DENIED') || err.message.includes('permission')) {
        setPermissionError(true);
        setShowEditModal(false);
      } else {
        alert("Failed to save salary structure.");
      }
    } finally {
      setProcessing(false);
    }
  };

  const calculateNet = () => {
    const gross = salaryForm.baseSalary + salaryForm.housingAllowance + salaryForm.transportAllowance + salaryForm.otherAllowances;
    const deductions = salaryForm.taxDeduction + salaryForm.insuranceDeduction;
    return gross - deductions;
  };

  const getStaffSalary = (userId: string) => {
    const struct = salaryStructures.find(s => s.userId === userId);
    if (!struct) return { base: 0, deductions: 0, net: 0 };
    
    return {
      base: struct.baseSalary,
      deductions: struct.taxDeduction + struct.insuranceDeduction,
      net: struct.netPay
    };
  };

  const securityRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 1. Financial Collections (Admins & Accountants)
    // CRITICAL: Includes archived_financial_records for system resets
    match /{collectionName}/{docId} {
      allow read, write: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'administrator' || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'accountant') &&
        collectionName in [
          'fee_categories', 'fee_components', 'financial_records', 
          'archived_financial_records', 'student_fees', 'accountant_activity', 
          'salary_structures', 'payslips', 'users', 'students'
        ];
    }

    // 2. Standard collection access
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'administrator';
    }
  }
}`;

  if (loading) return <div className="p-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Treasury & Payroll</h1>
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
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            {processing ? <Spinner size="sm" /> : 'Run Monthly Batch'}
          </button>
        </div>
      </header>

      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {permissionError && (
        <div className="bg-slate-900 border border-rose-500/30 rounded-[2.5rem] p-10 shadow-2xl animate-in slide-in-from-top-4 mb-8">
          <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-3">
            <span className="text-3xl">⚠️</span> Security Rules Update Required
          </h3>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Your current Firestore rules are blocking the <strong>Reset</strong> or <strong>Payroll</strong> operation. Specifically, the <code>archived_financial_records</code> collection needs permission. Copy and paste the corrected rules below:
          </p>
          <pre className="bg-black/60 p-6 rounded-2xl border border-slate-700 font-mono text-[11px] overflow-x-auto text-emerald-400 mb-6">
            {securityRules}
          </pre>
          <div className="flex gap-4">
            <button onClick={() => { navigator.clipboard.writeText(securityRules); alert('Corrected rules copied!'); }} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">Copy Rules</button>
            <button onClick={fetchData} className="px-6 py-3 bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest">Verify Sync</button>
          </div>
        </div>
      )}

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
            {staff.map(member => {
              const salary = getStaffSalary(member.id);
              return (
                <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all">
                  <td className="px-6 py-4">
                     <p className="text-sm font-bold text-slate-900 dark:text-white">{member.firstName} {member.lastName}</p>
                     <p className="text-[10px] text-slate-400">{member.email}</p>
                  </td>
                  <td className="px-6 py-4 capitalize text-xs text-slate-600 dark:text-slate-400">{member.role}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white text-right">
                    {salary.base > 0 ? `GH₵ ${salary.base.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : <span className="text-slate-300 italic">Not set</span>}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-rose-600 text-right">
                    {salary.deductions > 0 ? `GH₵ ${salary.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-indigo-600 text-right">
                    {salary.net > 0 ? `GH₵ ${salary.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-center">
                     <button 
                      onClick={() => openEditModal(member)}
                      className="text-xs font-black text-indigo-600 hover:underline uppercase tracking-widest"
                     >
                       Manage Structure
                     </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Salary Structure Modal */}
      {showEditModal && editingStaff && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-start mb-8">
                 <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white">Manage Salary</h2>
                    <p className="text-slate-500">Configure pay components for {editingStaff.firstName} {editingStaff.lastName}</p>
                 </div>
                 <button onClick={() => setShowEditModal(false)} className="w-12 h-12 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-2xl text-slate-400">&times;</button>
              </div>

              <form onSubmit={handleSaveStructure} className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Income Components</h3>
                       <div>
                          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Base Salary (GH₵)</label>
                          <input 
                            type="number" 
                            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white font-black" 
                            value={salaryForm.baseSalary}
                            onChange={e => setSalaryForm({...salaryForm, baseSalary: parseFloat(e.target.value) || 0})}
                          />
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Housing Allowance</label>
                          <input 
                            type="number" 
                            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white" 
                            value={salaryForm.housingAllowance}
                            onChange={e => setSalaryForm({...salaryForm, housingAllowance: parseFloat(e.target.value) || 0})}
                          />
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Transport Allowance</label>
                          <input 
                            type="number" 
                            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white" 
                            value={salaryForm.transportAllowance}
                            onChange={e => setSalaryForm({...salaryForm, transportAllowance: parseFloat(e.target.value) || 0})}
                          />
                       </div>
                    </div>

                    <div className="space-y-4">
                       <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-widest border-b border-rose-100 pb-2">Deductions</h3>
                       <div>
                          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Tax (PAYE)</label>
                          <input 
                            type="number" 
                            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-rose-500 dark:text-white" 
                            value={salaryForm.taxDeduction}
                            onChange={e => setSalaryForm({...salaryForm, taxDeduction: parseFloat(e.target.value) || 0})}
                          />
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Insurance / SSNIT</label>
                          <input 
                            type="number" 
                            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-rose-500 dark:text-white" 
                            value={salaryForm.insuranceDeduction}
                            onChange={e => setSalaryForm({...salaryForm, insuranceDeduction: parseFloat(e.target.value) || 0})}
                          />
                       </div>
                       
                       <div className="mt-8 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800 text-center">
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Estimated Net Pay</p>
                          <p className="text-3xl font-black text-indigo-700 dark:text-indigo-400">GH₵ {calculateNet().toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                       </div>
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button type="submit" disabled={processing} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center h-16">
                       {processing ? <Spinner size="sm" /> : 'Save Structure'}
                    </button>
                    <button type="button" onClick={() => setShowEditModal(false)} className="px-10 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest">Cancel</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};