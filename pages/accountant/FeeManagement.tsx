import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/UI/Spinner';
import { Alert } from '../../components/UI/Alert';
import { financeService } from '../../services/financeService';
import { FeeCategory } from '../../types';

export const FeeManagement: React.FC = () => {
  const { user } = useAuth();
  const [feeComponents, setFeeComponents] = useState<any[]>([]);
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Modal States
  const [showCompModal, setShowCompModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Confirmation States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [componentToDelete, setComponentToDelete] = useState<any>(null);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  
  // Reset States
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetStep, setResetStep] = useState(1);

  // Form States
  const [compForm, setCompForm] = useState({
    feeName: '',
    amount: '',
    category: '',
    applicableClass: 'All Classes',
    classId: '',
    term: 'Term 1'
  });
  const [newCatName, setNewCatName] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [comps, cats, cls] = await Promise.all([
        financeService.getFeeComponents(),
        financeService.getFeeCategories(),
        financeService.getAllClasses()
      ]);
      setFeeComponents(comps);
      setCategories(cats);
      setClasses(cls);
    } catch (err: any) {
      setAlert({ type: 'error', message: 'Synchronization error.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleMasterReset = async () => {
    if (!user) return;
    setSyncing(true);
    setShowResetConfirm(false);
    try {
      const res = await financeService.resetFinancialSystem(user.id, `${user.firstName} ${user.lastName}`);
      setAlert({ type: 'success', message: `SYSTEM WIPE COMPLETE: ${res.studentsReset} students reset and ${res.paymentsArchived} payments archived.` });
      await loadData();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setSyncing(false);
      setResetStep(1);
    }
  };

  const executeSync = async () => {
    setSyncing(true);
    setShowSyncConfirm(false);
    try {
      await financeService.syncAllStudentFees();
      setAlert({ type: 'success', message: 'Institutional ledger recalculated successfully.' });
      await loadData();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSyncing(true);
    try {
      if (isEditing && editingId) {
        await financeService.updateFeeComponent(editingId, compForm, user);
        setAlert({ type: 'success', message: 'Component updated and arrears recalculated.' });
      } else {
        await financeService.createFeeComponent(compForm, user);
        setAlert({ type: 'success', message: 'New component added. Arrears assigned to target students.' });
      }
      setShowCompModal(false);
      resetCompForm();
      await loadData();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const executeDelete = async () => {
    if (!componentToDelete || !user) return;
    setSyncing(true);
    try {
      await financeService.deleteFeeComponent(componentToDelete.id, user.id);
      
      // Critical Check: If this was the last component, system should offer a full reset
      if (feeComponents.length <= 1) {
         setAlert({ type: 'success', message: 'Final billing rule removed. System is now in Zero State.' });
         setResetStep(1);
         setShowResetConfirm(true); // Automatically prompt for a full reset to clear 'paid' persists
      } else {
         setAlert({ type: 'success', message: `Removed "${componentToDelete.feeName}" and cleared related billing.` });
      }
      
      setShowDeleteConfirm(false);
      setComponentToDelete(null);
      await loadData();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Deletion failed.' });
    } finally {
      setSyncing(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !user) return;
    try {
      await financeService.saveFeeCategory({ name: newCatName }, user);
      setNewCatName('');
      const updatedCats = await financeService.getFeeCategories();
      setCategories(updatedCats);
    } catch (err: any) {
      setAlert({ type: 'error', message: 'Failed to add category.' });
    }
  };

  const resetCompForm = () => {
    setCompForm({
      feeName: '',
      amount: '',
      category: categories[0]?.name || '',
      applicableClass: 'All Classes',
      classId: '',
      term: 'Term 1'
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const openEdit = (comp: any) => {
    setCompForm({
      feeName: comp.feeName,
      amount: comp.amount.toString(),
      category: comp.category,
      applicableClass: comp.applicableClass,
      classId: comp.classId || '',
      term: comp.term
    });
    setEditingId(comp.id);
    setIsEditing(true);
    setShowCompModal(true);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Fee Settings</h1>
          <p className="text-slate-500 dark:text-slate-400">Configure institutional billing rules and debt assignment</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowSyncConfirm(true)} disabled={syncing} className="btn btn-secondary text-xs uppercase tracking-widest">
            {syncing ? '🔄 Syncing...' : '🔄 Sync Mirror'}
          </button>
          <button onClick={() => setShowCatModal(true)} className="btn btn-secondary text-xs uppercase tracking-widest">Manage Categories</button>
          <button onClick={() => { resetCompForm(); setShowCompModal(true); }} className="btn btn-primary text-xs uppercase tracking-widest">+ Add Component</button>
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="card overflow-hidden">
        <div className="card-header border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Billing Components ({feeComponents.length})</h2>
        </div>
        
        {loading && feeComponents.length === 0 ? <div className="p-20 flex justify-center"><Spinner size="lg" /></div> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Fee Name</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Target Scope</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {feeComponents.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td>
                       <p className="font-bold text-slate-900 dark:text-white">{c.feeName}</p>
                       <p className="text-[10px] text-slate-400 font-mono">BILL-ID: {c.id.slice(-6).toUpperCase()}</p>
                    </td>
                    <td className="font-black text-indigo-600 dark:text-indigo-400">GH₵ {parseFloat(c.amount).toLocaleString()}</td>
                    <td>
                      <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-[9px] font-black uppercase tracking-wider">
                        {c.category}
                      </span>
                    </td>
                    <td className="text-slate-500 text-xs font-medium">
                      {c.applicableClass} • {c.term}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(c)} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg" title="Edit Component">✏️</button>
                        <button onClick={() => { setComponentToDelete(c); setShowDeleteConfirm(true); }} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg" title="Delete Component">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {feeComponents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-400 italic font-medium">Institutional billing roster is empty.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* System Operations Section */}
      <div className="card border-rose-100 dark:border-rose-900/30 bg-rose-50/20 dark:bg-rose-900/5 mt-10">
         <div className="card-header border-b border-rose-100 dark:border-rose-900/30">
            <h2 className="text-sm font-black uppercase tracking-widest text-rose-600">Critical System Operations</h2>
         </div>
         <div className="card-body p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
               <h3 className="font-black text-slate-900 dark:text-white">Master Financial Reset</h3>
               <p className="text-sm text-slate-500 max-w-xl">
                 Archive all active payment history and wipe student ledgers to absolute zero. Perform this only when transitioning between terms or starting fresh.
               </p>
            </div>
            <button 
              onClick={() => { setResetStep(1); setShowResetConfirm(true); }}
              className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-rose-100 dark:shadow-none hover:bg-rose-700 active:scale-95 transition-all whitespace-nowrap"
            >
              🔄 Reset Financial System
            </button>
         </div>
      </div>

      {/* Master Reset Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-12 max-w-lg w-full shadow-2xl border-4 border-rose-500/20 animate-in zoom-in-95 duration-200">
             {resetStep === 1 ? (
                <>
                  <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-4xl mb-8 mx-auto">🧨</div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 text-center">Final System Wipe?</h2>
                  <p className="text-slate-500 text-center mb-10 leading-relaxed font-medium">
                    This will set ALL student billed amounts to zero, archive ALL existing transaction history, and clear the Treasury Dashboard. All arrears and payments will be cleared for a new term.
                  </p>
                  <div className="flex flex-col gap-3">
                     <button onClick={() => setResetStep(2)} className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Yes, Begin Full Reset</button>
                     <button onClick={() => setShowResetConfirm(false)} className="w-full py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold uppercase tracking-widest">Cancel</button>
                  </div>
                </>
             ) : (
                <>
                  <h2 className="text-3xl font-black text-rose-600 mb-4 text-center">IRREVERSIBLE ACTION</h2>
                  <p className="text-slate-900 dark:text-white text-center mb-10 text-lg font-bold">
                    One last confirmation: Are you ABSOLUTELY sure you want to purge all active financial data?
                  </p>
                  <div className="flex flex-col gap-3">
                     <button onClick={handleMasterReset} className="w-full py-5 bg-rose-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl border-2 border-rose-500">I UNDERSTAND, WIPE ALL DATA</button>
                     <button onClick={() => { setResetStep(1); setShowResetConfirm(false); }} className="w-full py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-2xl font-bold uppercase tracking-widest">Abort Operation</button>
                  </div>
                </>
             )}
          </div>
        </div>
      )}

      {/* Sync Confirmation Modal */}
      {showSyncConfirm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-10 max-md w-full shadow-2xl border border-slate-100 dark:border-slate-800">
             <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Sync Financial Ledger?</h2>
             <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
               This will update the billed amount for every student based on current fee components. Existing payments will be preserved.
             </p>
             <div className="flex gap-4">
                <button onClick={executeSync} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg">Run Sync</button>
                <button onClick={() => setShowSyncConfirm(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-2xl font-bold uppercase tracking-widest">Cancel</button>
             </div>
          </div>
        </div>
      )}

      {/* Delete Component Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto">⚠️</div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 text-center">Delete Billing Rule?</h2>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-8">
              Removing <strong>"{componentToDelete?.feeName}"</strong> will update balances. If this is the last rule, a system reset will be suggested.
            </p>
            <div className="flex gap-4">
               <button onClick={executeDelete} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg">Confirm Delete</button>
               <button onClick={() => { setShowDeleteConfirm(false); setComponentToDelete(null); }} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold uppercase tracking-widest">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Component Edit/Add Modal */}
      {showCompModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-xl w-full shadow-2xl border border-slate-100 dark:border-slate-800">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8">{isEditing ? 'Modify Component' : 'New Billing Rule'}</h2>
            <form onSubmit={handleSaveComponent} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Fee Description</label>
                <input required className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white font-bold" value={compForm.feeName} onChange={e => setCompForm({...compForm, feeName: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Amount (GH₵)</label>
                   <input required type="number" step="0.01" className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white font-black" value={compForm.amount} onChange={e => setCompForm({...compForm, amount: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Category</label>
                    <select required className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white font-bold" value={compForm.category} onChange={e => setCompForm({...compForm, category: e.target.value})}>
                      <option value="">Select Category</option>
                      {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                    </select>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Assigned Class</label>
                    <select required className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white font-bold" value={compForm.applicableClass} onChange={e => {
                        const val = e.target.value;
                        const cls = classes.find(c => c.name === val);
                        setCompForm({...compForm, applicableClass: val, classId: cls?.id || ''});
                    }}>
                      <option value="All Classes">All Classes</option>
                      {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Term</label>
                    <select className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white font-bold" value={compForm.term} onChange={e => setCompForm({...compForm, term: e.target.value})}>
                      <option value="Term 1">Term 1</option>
                      <option value="Term 2">Term 2</option>
                      <option value="Term 3">Term 3</option>
                    </select>
                 </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="submit" disabled={syncing} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest">
                   {syncing ? <Spinner size="sm" /> : 'Save Rule'}
                </button>
                <button type="button" onClick={() => setShowCompModal(false)} className="px-8 py-4 bg-slate-100 rounded-2xl font-bold">Discard</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800">
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Fee Categories</h2>
                <button onClick={() => setShowCatModal(false)} className="text-2xl text-slate-400">&times;</button>
             </div>
             <form onSubmit={handleAddCategory} className="flex gap-2 mb-8">
                <input required className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none dark:text-white text-sm" placeholder="New category name..." value={newCatName} onChange={e => setNewCatName(e.target.value)} />
                <button type="submit" className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm">Add</button>
             </form>
             <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {categories.map(cat => (
                  <div key={cat.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between items-center group">
                     <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{cat.name}</span>
                     <span className="text-[10px] text-slate-400">REGISTERED</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};