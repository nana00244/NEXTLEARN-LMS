import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Spinner } from '../../components/UI/Spinner';
import { Alert } from '../../components/UI/Alert';
import { financeService } from '../../services/financeService';
import { printService } from '../../services/printService';
import { useAuth } from '../../context/AuthContext';

export const StudentFinanceList: React.FC = () => {
  const { user } = useAuth();
  const [feeRoster, setFeeRoster] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Sync Confirmation State
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);

  // Collection Modal State
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('bank_transfer');
  const [processingPay, setProcessingPay] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const classesData = await financeService.getAllClasses();
      setClasses(classesData);
    };
    fetchData();

    const unsubscribe = onSnapshot(
      query(collection(db, 'student_fees'), orderBy('studentName', 'asc')),
      (snapshot) => {
        setFeeRoster(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    setShowSyncConfirm(false);
    try {
      await financeService.syncAllStudentFees();
      setAlert({ type: 'success', message: 'Financial ledger synchronized with billing rules.' });
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !payAmount || parseFloat(payAmount) <= 0) return;
    
    if (parseFloat(payAmount) > selectedStudent.balance) {
      alert(`Error: Cannot collect more than the outstanding balance of GH₵ ${selectedStudent.balance}`);
      return;
    }

    setProcessingPay(true);
    try {
      const res = await financeService.recordPayment({
        studentId: selectedStudent.studentId,
        studentName: selectedStudent.studentName,
        amount: payAmount,
        paymentMethod: payMethod,
        accountantId: user?.id,
        class: selectedStudent.class
      });
      setReceipt(res);
      setAlert({ type: 'success', message: `GH₵ ${payAmount} collected for ${selectedStudent.studentName}.` });
      setPayAmount('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingPay(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!receipt || !selectedStudent) return;
    printService.printReceipt({
      receiptNumber: receipt.receiptNumber,
      date: new Date().toLocaleDateString('en-GB'),
      studentName: selectedStudent.studentName,
      admission: selectedStudent.admissionNumber || 'N/A',
      amount: parseFloat(receipt.amount),
      paymentMethod: receipt.paymentMethod,
      balance: receipt.newBalance,
      recordedBy: `${user?.firstName} ${user?.lastName}`
    });
  };

  const filtered = feeRoster.filter(s => {
    const searchLower = search.toLowerCase();
    
    // Improved search: Includes Student Name, Admission Number, AND Class Name
    const matchesSearch = 
      (s.studentName || '').toLowerCase().includes(searchLower) || 
      (s.admissionNumber || '').toLowerCase().includes(searchLower) ||
      (s.class || '').toLowerCase().includes(searchLower);

    const matchesStatus = filter === 'all' || s.status?.toLowerCase() === filter.toLowerCase();
    
    // Fixed class filtering: Handle both string match (legacy) and ID match
    const matchesClass = classFilter === 'all' || s.classId === classFilter || s.class === classes.find(c => c.id === classFilter)?.name;

    return matchesSearch && matchesStatus && matchesClass;
  });

  // LEDGER ZERO STATE DETECTOR
  const isZeroState = feeRoster.length > 0 && feeRoster.every(r => (r.totalDue || 0) === 0 && (r.paid || 0) === 0);

  if (loading) return <div className="p-20 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Fee Roster</h1>
          <p className="text-sm text-slate-500">Live institutional collection ledger</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowSyncConfirm(true)} disabled={syncing} className="btn btn-secondary text-xs uppercase tracking-widest">
            {syncing ? '🔄 Syncing...' : '🔄 Sync Mirror'}
          </button>
          <input 
            type="text" 
            placeholder="Search name, ID or class..." 
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 bg-white dark:bg-slate-900 text-sm font-medium"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </header>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {isZeroState && (
        <div className="p-8 bg-amber-50 border-2 border-amber-200 rounded-[2rem] flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-top-2 shadow-sm">
           <div className="text-4xl">⚠️</div>
           <div className="flex-1">
              <h3 className="text-lg font-black text-amber-900">Institutional Ledger is Clean</h3>
              <p className="text-sm text-amber-700 font-medium">No fee components are active. Students currently have GH₵ 0.00 billed. Setup billing rules to begin collection.</p>
           </div>
           <button 
             onClick={() => window.location.hash = '#/accountant/fees'}
             className="px-6 py-3 bg-amber-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest"
           >
             Setup Billing
           </button>
        </div>
      )}

      <div className="flex gap-4 p-4 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-x-auto">
         <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Class:</span>
            <select className="px-3 py-2 border-0 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-bold" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
               <option value="all">All Units</option>
               {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
         </div>
         <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
            <select className="px-3 py-2 border-0 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-bold" value={filter} onChange={e => setFilter(e.target.value)}>
               <option value="all">Global</option>
               <option value="paid">Paid Only</option>
               <option value="partial">Partial Arrears</option>
               <option value="unpaid">Zero Payments</option>
               <option value="no_fees">No Fees Set</option>
            </select>
         </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Student / Identity</th>
                <th className="text-right">Billed Amount</th>
                <th className="text-right">Actual Paid</th>
                <th className="text-right">Balance Due</th>
                <th className="text-center">Ledger Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td>
                    <p className="font-bold text-slate-900 dark:text-white">{s.studentName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{s.admissionNumber} • {s.class}</p>
                  </td>
                  <td className="text-right font-semibold text-slate-600 dark:text-slate-400">GH₵ {(s.totalDue || 0).toLocaleString()}</td>
                  <td className="text-right font-bold text-emerald-600 dark:text-emerald-500">GH₵ {(s.paid || 0).toLocaleString()}</td>
                  <td className="text-right font-black text-rose-600 dark:text-rose-500">GH₵ {(s.balance || 0).toLocaleString()}</td>
                  <td className="text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                      s.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
                      s.status === 'PARTIAL' ? 'bg-amber-100 text-amber-700' : 
                      (s.status === 'NO_FEES' || s.status === 'NO_FEES_SET') ? 'bg-slate-100 text-slate-500' : 'bg-rose-100 text-rose-700'
                    }`}>{s.status === 'NO_FEES_SET' ? 'NO_FEES' : s.status}</span>
                  </td>
                  <td className="text-right">
                    <button 
                      onClick={() => { setSelectedStudent(s); setReceipt(null); }}
                      disabled={s.status === 'PAID' || s.status === 'NO_FEES' || s.status === 'NO_FEES_SET'}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        (s.status === 'PAID') ? 'bg-slate-100 text-slate-400' : 
                        (s.status === 'NO_FEES' || s.status === 'NO_FEES_SET') ? 'bg-slate-50 text-slate-300' : 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 active:scale-95'
                      }`}
                    >
                      {s.status === 'PAID' ? 'Settled ✓' : (s.status === 'NO_FEES' || s.status === 'NO_FEES_SET') ? 'Locked' : 'Collect'}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-400 italic">No records matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sync Confirmation Modal */}
      {showSyncConfirm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800">
             <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Sync Financial Ledger?</h2>
             <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
               This will update the billed amount for every student based on current fee components.
             </p>
             <div className="flex gap-4">
                <button onClick={handleManualSync} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg">Run Sync</button>
                <button onClick={() => setShowSyncConfirm(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-2xl font-bold uppercase tracking-widest">Cancel</button>
             </div>
          </div>
        </div>
      )}

      {/* Collection Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-y-auto max-h-[90vh]">
            {!receipt ? (
              <>
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white">Record Payment</h2>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Institutional Collection</p>
                  </div>
                  <button onClick={() => setSelectedStudent(null)} className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-2xl text-slate-400">&times;</button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl mb-8 space-y-4 border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center"><span className="text-xs text-slate-500 font-bold">Student Name</span><span className="text-sm font-black">{selectedStudent.studentName}</span></div>
                  <div className="flex justify-between items-center"><span className="text-xs text-slate-500 font-bold">Admission Number</span><span className="text-sm font-mono">{selectedStudent.admissionNumber}</span></div>
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
                    <div className="text-center bg-white dark:bg-slate-900 p-3 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Already Paid</p>
                      <p className="text-lg font-black text-emerald-600">GH₵ {(selectedStudent.paid || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center bg-rose-50 dark:bg-rose-900/20 p-3 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Balance Due</p>
                      <p className="text-lg font-black text-rose-600">GH₵ {(selectedStudent.balance || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleCollect} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Collection Amount (GH₵)</label>
                    <input 
                      required 
                      type="number" 
                      step="0.01" 
                      max={selectedStudent.balance} 
                      className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 text-2xl font-black dark:text-white" 
                      placeholder="0.00"
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment Channel</label>
                    <select className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none font-bold dark:text-white" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                       <option value="bank_transfer">Bank Transfer</option>
                       <option value="cash">Cash Collection</option>
                       <option value="mobile_money">Mobile Money (MoMo)</option>
                       <option value="cheque">Cheque</option>
                    </select>
                  </div>

                  <div className="pt-4 flex gap-4">
                    <button type="submit" disabled={processingPay || !payAmount} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">
                       {processingPay ? <Spinner size="sm" /> : 'Finalize Collection'}
                    </button>
                    <button type="button" onClick={() => setSelectedStudent(null)} className="px-8 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold uppercase tracking-widest">Discard</button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center animate-in zoom-in-95">
                 <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">💰</div>
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white">Transaction Verified</h2>
                 <p className="text-slate-500 mb-8 font-medium">Official receipt has been generated and balance updated.</p>
                 
                 <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl text-left border-2 border-dashed border-slate-200 dark:border-slate-800 mb-8">
                    <div className="flex justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-2"><span className="text-xs font-bold text-slate-400">RECEIPT NO</span><span className="font-mono font-bold">{receipt.receiptNumber}</span></div>
                    <div className="flex justify-between mb-2"><span className="text-xs font-bold text-slate-400">STUDENT</span><span className="text-sm font-bold">{selectedStudent.studentName}</span></div>
                    <div className="flex justify-between mb-2"><span className="text-xs font-bold text-slate-400">COLLECTED</span><span className="text-sm font-black text-emerald-600">GH₵ {(receipt.amount || 0).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-xs font-bold text-slate-400">NEW BALANCE</span><span className="text-sm font-black text-rose-600">GH₵ {(receipt.newBalance || 0).toLocaleString()}</span></div>
                 </div>

                 <div className="flex gap-4">
                    <button onClick={handlePrintReceipt} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg">Print Receipt</button>
                    <button onClick={() => setSelectedStudent(null)} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest">Done</button>
                 </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};