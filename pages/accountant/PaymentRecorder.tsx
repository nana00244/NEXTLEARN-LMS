import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { financeService } from '../../services/financeService';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/UI/Spinner';
import { printService } from '../../services/printService';

export const PaymentRecorder: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const studentIdParam = params.get('studentId');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<any>(null);
  const [studentDetails, setStudentDetails] = useState<{ name: string; class: string; admission: string; balance: number } | null>(null);
  
  const [form, setForm] = useState({
    studentId: studentIdParam || '',
    amount: 0,
    paymentMethod: 'bank_transfer',
    transactionRef: '',
    notes: ''
  });

  const fetchStudentInfo = async (sid: string) => {
    try {
      const students = await financeService.getStudentFinancials();
      const student = students.find(s => s.id === sid);
      if (student) {
        setStudentDetails({
          name: student.studentName || 'Unknown Student',
          class: student.class || 'Unassigned',
          admission: student.admissionNumber || 'N/A',
          balance: student.balance || 0
        });
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const sid = studentIdParam || form.studentId;
    if (sid) fetchStudentInfo(sid);
  }, [studentIdParam, form.studentId]);

  const handlePrint = () => {
    if (!success || !studentDetails) return;
    printService.printReceipt({
      receiptNumber: success.receiptNumber,
      date: new Date().toLocaleDateString(),
      studentName: studentDetails.name,
      admission: studentDetails.admission,
      amount: success.amount,
      paymentMethod: success.paymentMethod,
      balance: studentDetails.balance,
      recordedBy: `${authUser?.firstName} ${authUser?.lastName}`
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId || form.amount <= 0) return;
    setLoading(true);
    try {
      const res = await financeService.recordPayment({
        ...form,
        accountantId: authUser?.id,
        paymentDate: new Date().toISOString()
      });
      setSuccess(res);
      await fetchStudentInfo(form.studentId);
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  if (success) return (
    <div className="max-w-xl mx-auto space-y-8 pt-10 animate-in fade-in zoom-in-95 duration-500">
      <div className="receipt-window">
         <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-indigo-600 tracking-tighter">NEXTLMS</h2>
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Institutional Receipt</p>
         </div>
         <div className="flex justify-between border-b border-slate-100 pb-4 mb-4">
            <p className="text-[10px] font-black uppercase text-slate-400">Receipt No: <span className="text-slate-900 font-mono">${success.receiptNumber}</span></p>
            <p className="text-[10px] font-black uppercase text-slate-400">Date: <span className="text-slate-900">${new Date().toLocaleDateString()}</span></p>
         </div>
         <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500">Student</span><span className="text-sm font-black">{studentDetails?.name}</span></div>
            <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500">Admission</span><span className="text-sm font-mono font-bold">{studentDetails?.admission}</span></div>
            <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500">Amount Paid</span><span className="text-lg font-black text-emerald-600">GH₵ {success.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500">Method</span><span className="text-xs font-black uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">{success.paymentMethod.replace('_', ' ')}</span></div>
         </div>
         <div className="p-6 bg-rose-50 rounded-3xl text-center mb-8 border border-rose-100">
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Outstanding Balance</p>
            <p className="text-2xl font-black text-rose-600">GH₵ {studentDetails?.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
         </div>
         <div className="flex gap-4 no-print">
            <button onClick={handlePrint} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">Print Receipt</button>
            <button onClick={() => setSuccess(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest transition-all">New Payment</button>
         </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-10">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 rounded-full hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm">←</button>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Record Payment</h1>
      </header>

      <div className="card border-0 shadow-2xl shadow-indigo-600/5">
        <form onSubmit={handleSubmit} className="card-body p-10 space-y-8">
          {studentDetails && (
            <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] border border-indigo-100 dark:border-indigo-800 flex justify-between items-center">
              <div>
                <p className="text-lg font-black text-slate-900 dark:text-white">{studentDetails.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{studentDetails.admission} • {studentDetails.class}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Current Arrears</p>
                <p className="text-2xl font-black text-rose-600">GH₵ {studentDetails.balance.toLocaleString()}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Collection Amount (GH₵)</label>
            <input 
              required 
              type="number" 
              step="0.01" 
              className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl text-4xl font-black text-indigo-600 dark:text-indigo-400 focus:ring-4 focus:ring-indigo-600/10 outline-none transition-all" 
              value={form.amount || ''} 
              onChange={e => setForm({...form, amount: parseFloat(e.target.value) || 0})} 
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Payment Method</label>
              <select className="w-full p-4 border-0 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all" value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})}>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash Collection</option>
                <option value="mobile_money">Mobile Money (MoMo)</option>
                <option value="cheque">Cheque / Draft</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Transaction Ref #</label>
              <input className="w-full p-4 border-0 bg-slate-50 dark:bg-slate-800 rounded-2xl font-mono font-bold dark:text-white outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all" placeholder="Optional" value={form.transactionRef} onChange={e => setForm({...form, transactionRef: e.target.value})} />
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" disabled={loading || form.amount <= 0} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 h-20 flex items-center justify-center">
              {loading ? <Spinner size="sm" /> : 'Finalize & Issue Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};