
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { financeService } from '../../services/financeService';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/UI/Spinner';

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
    paymentMethod: 'bank_transfer' as any,
    transactionRef: '',
    term: 'Term 1',
    notes: ''
  });

  const fetchStudentInfo = async (sid: string) => {
    try {
      const students = await financeService.getStudentFinancials();
      const student = students.find(s => s.id === sid);
      if (student) {
        setStudentDetails({
          name: student.name,
          class: student.className,
          admission: student.admissionNumber,
          balance: student.balance
        });
      }
    } catch (err) {
      console.error("Failed to fetch student details", err);
    }
  };

  useEffect(() => {
    const sid = studentIdParam || form.studentId;
    if (sid) {
      fetchStudentInfo(sid);
    }
  }, [studentIdParam, form.studentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId || form.amount <= 0) return;
    
    setLoading(true);
    try {
      const res = await financeService.recordPayment({
        ...form,
        recordedBy: authUser?.id || 'system'
      });
      
      // Crucial: Update student info AGAIN after payment to reflect the new balance on the receipt
      await fetchStudentInfo(form.studentId);
      
      setSuccess(res);
    } catch (err) {
      alert("Payment failed. Please verify the amount and Student ID.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    window.focus();
    window.print();
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
        {/* Screen Only Success Message */}
        <div className="text-center no-print">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-4xl mx-auto mb-4">✓</div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">Transaction Successful</h2>
          <p className="text-slate-500">The payment has been recorded and the student ledger updated.</p>
        </div>

        {/* The Receipt Card - The only thing that prints */}
        <div id="printable-receipt" className="receipt-card bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-bl-2xl no-print">
             Digital Receipt
           </div>
           
           <div className="space-y-8">
              {/* Receipt Header */}
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-8">
                 <div>
                    <div className="flex items-center gap-2 mb-2">
                       <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">N</div>
                       <h3 className="text-2xl font-black text-slate-900 dark:text-white">NextLearn Academy</h3>
                    </div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-relaxed">
                       Bursar's Office • Financial Services<br />
                       Accra, Ghana • +233 24 000 0000
                    </p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Receipt No</p>
                    <p className="text-xl font-black text-indigo-600">{success.receiptNumber}</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-bold">
                      {new Date(success.paymentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                 </div>
              </div>

              {/* Student and Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Student Information</p>
                    <p className="text-base font-black text-slate-900 dark:text-white">{studentDetails?.name || 'Loading Student...'}</p>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">Admission: {studentDetails?.admission || '-'}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Class: {studentDetails?.class || '-'}</p>
                 </div>
                 <div className="bg-indigo-50/40 dark:bg-indigo-900/10 p-5 rounded-2xl border border-indigo-50 dark:border-indigo-900/20">
                    <p className="text-[10px] font-black text-indigo-400 uppercase mb-2 tracking-widest">Payment Meta</p>
                    <p className="text-base font-black text-slate-900 dark:text-white uppercase">{success.paymentMethod.replace('_', ' ')}</p>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">Ref: {success.transactionRef || 'Direct Deposit'}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Period: {success.term}</p>
                 </div>
              </div>

              {/* Financial Summary */}
              <div className="pt-4 space-y-4">
                 <div className="flex justify-between items-center py-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Amount Received</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">GH₵ {success.amount.toLocaleString()}</span>
                 </div>
                 
                 <div className="flex justify-between items-center py-5 bg-emerald-50 dark:bg-emerald-900/10 px-8 -mx-10 border-y border-emerald-100/50 dark:border-emerald-900/20">
                    <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Net Paid Today</span>
                    <span className="text-3xl font-black text-emerald-600">GH₵ {success.amount.toLocaleString()}</span>
                 </div>

                 <div className="flex justify-between items-center py-4 bg-slate-50 dark:bg-slate-800/50 px-8 -mx-10 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest text-rose-600">Remaining Balance</span>
                    <span className={`text-xl font-black ${studentDetails?.balance === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      GH₵ {studentDetails?.balance.toLocaleString() || '0'}
                    </span>
                 </div>
              </div>

              {/* Authenticator Footer */}
              <div className="text-center pt-6">
                 <p className="text-[10px] font-bold text-slate-400 uppercase mb-4">Official Verification</p>
                 <div className="flex flex-col items-center">
                    <div className="h-px w-40 bg-slate-200 dark:bg-slate-700 mb-2"></div>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                      {authUser?.firstName} {authUser?.lastName}
                    </p>
                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Finance Department • Bursar</p>
                 </div>
                 <p className="text-[8px] text-slate-300 mt-10 italic">This receipt is a valid institutional record generated electronically. No signature is required.</p>
              </div>
           </div>
        </div>

        {/* Screen Only Actions */}
        <div className="flex flex-col sm:flex-row gap-4 no-print pb-12">
           <button 
             type="button"
             onClick={handlePrint} 
             className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-none active:scale-[0.98] flex items-center justify-center gap-3"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
             </svg>
             Print / Download PDF
           </button>
           <button 
             type="button"
             onClick={() => navigate('/accountant/students')} 
             className="flex-1 py-4 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-50 transition-all"
           >
             Return to Student List
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Record Fee Payment</h1>
        <p className="text-slate-500">Post an incoming transaction to a student's institutional ledger</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-widest">Student Identifier</label>
            <input 
              required
              autoFocus
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white font-medium"
              value={form.studentId}
              onChange={e => setForm({...form, studentId: e.target.value})}
              placeholder="Enter Student ID (e.g., s_1)"
              disabled={!!studentIdParam}
            />
            {studentDetails && (
              <div className="flex justify-between items-center mt-3 px-1">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                  {studentDetails.name} • {studentDetails.class}
                </p>
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">
                  Total Owed: GH₵ {studentDetails.balance.toLocaleString()}
                </p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-widest">Amount Paid (GH₵)</label>
            <input 
              type="number"
              required
              min="0.1"
              step="0.01"
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white text-2xl font-black text-indigo-600"
              value={form.amount || ''}
              onChange={e => setForm({...form, amount: parseFloat(e.target.value) || 0})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-widest">Payment Method</label>
            <select 
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white font-medium"
              value={form.paymentMethod}
              onChange={e => setForm({...form, paymentMethod: e.target.value as any})}
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash Deposit</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="card">Card Payment</option>
              <option value="cheque">Institutional Cheque</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-widest">Reference / ID</label>
            <input 
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white font-medium"
              placeholder="e.g., TXN-102938"
              value={form.transactionRef}
              onChange={e => setForm({...form, transactionRef: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-widest">Academic Term</label>
            <select 
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white font-medium"
              value={form.term}
              onChange={e => setForm({...form, term: e.target.value})}
            >
              <option>Term 1</option>
              <option>Term 2</option>
              <option>Term 3</option>
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || !form.studentId || form.amount <= 0}
          className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {loading ? <Spinner size="sm" /> : (
            <>
              Generate Receipt & Post Payment
              <span className="text-xl">→</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
