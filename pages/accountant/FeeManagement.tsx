
import React, { useState, useEffect } from 'react';
import { financeService } from '../../services/financeService';
import { Spinner } from '../../components/UI/Spinner';
import { FeeStructure, FeeCategory } from '../../types';
import { STORAGE_KEYS } from '../../constants';

export const FeeManagement: React.FC = () => {
  const [structures, setStructures] = useState<any[]>([]);
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAdd, setShowAdd] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Custom Delete Confirm State
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean, id: string | null }>({ show: false, id: null });

  // Form State
  const [form, setForm] = useState({
    classId: '',
    categoryId: '',
    amount: 0,
    term: 'Term 1',
    isMandatory: true
  });

  // Category Form State
  const [catForm, setCatForm] = useState({
    name: '',
    description: ''
  });

  const fetchData = async () => {
    try {
        const [sData, cData] = await Promise.all([
            financeService.getFeeStructures(),
            financeService.getFeeCategories()
        ]);
        
        const classesStored = localStorage.getItem(STORAGE_KEYS.MOCK_DB_CLASSES);
        const clData = classesStored ? JSON.parse(classesStored) : [];
        
        setStructures(sData);
        setCategories(cData);
        setClasses(clData);
    } catch (err) {
        console.error("Error fetching financial data:", err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setForm({
      classId: '',
      categoryId: '',
      amount: 0,
      term: 'Term 1',
      isMandatory: true
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEdit = (s: any) => {
    setForm({
      classId: s.classId,
      categoryId: s.categoryId,
      amount: s.amount,
      term: s.term,
      isMandatory: s.isMandatory
    });
    setIsEditing(true);
    setEditingId(s.id);
    setShowAdd(true);
  };

  const triggerDelete = (id: string) => {
    setDeleteConfirm({ show: true, id });
  };

  const executeDelete = async () => {
    if (!deleteConfirm.id) return;
    setLoading(true);
    await financeService.deleteFeeStructure(deleteConfirm.id);
    setDeleteConfirm({ show: false, id: null });
    await fetchData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isEditing && editingId) {
      await financeService.updateFeeStructure(editingId, form);
    } else {
      await financeService.createFeeStructure(form);
    }
    setShowAdd(false);
    resetForm();
    await fetchData();
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await financeService.saveFeeCategory(catForm);
    setCatForm({ name: '', description: '' });
    setShowCategoryModal(false);
    await fetchData();
  };

  if (loading && structures.length === 0) return <div className="p-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Fee Configuration</h1>
          <p className="text-slate-500">Define academic costs and collection rules</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowCategoryModal(true)}
            className="px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all"
          >
            Manage Categories
          </button>
          <button 
            onClick={() => { resetForm(); setShowAdd(true); }}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all"
          >
            + Add Fee Component
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {structures.map(s => (
          <div key={s.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group min-h-[180px] flex flex-col justify-between">
            <div className={`absolute top-0 right-0 p-3 ${s.isMandatory ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 bg-slate-50'} text-[10px] font-black uppercase rounded-bl-xl`}>
              {s.isMandatory ? 'Mandatory' : 'Optional'}
            </div>
            
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.class?.name || 'All Classes'}</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">{s.category?.name}</h3>
              <p className="text-3xl font-black text-indigo-600">GH₵ {s.amount.toLocaleString()}</p>
            </div>

            <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
               <span className="text-xs text-slate-400">Target: {s.term}</span>
               <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(s)}
                    className="text-indigo-600 font-bold text-xs hover:underline"
                  >
                    Edit
                  </button>
                  <span className="text-slate-200">|</span>
                  <button 
                    onClick={() => triggerDelete(s.id)}
                    className="text-rose-600 font-bold text-xs hover:underline"
                  >
                    Delete
                  </button>
               </div>
            </div>
          </div>
        ))}
        {structures.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-slate-500 italic">No fee structures defined yet.</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-2xl max-w-sm w-full border border-slate-100 dark:border-slate-800">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">Confirm Removal</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">Are you sure? This will also remove pending billing records for all assigned students.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setDeleteConfirm({ show: false, id: null })}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-2xl font-black shadow-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fee Structure Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8">{isEditing ? 'Edit Fee Component' : 'New Fee Component'}</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Class / Grade</label>
                    <select 
                      required 
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                      value={form.classId}
                      onChange={e => setForm({...form, classId: e.target.value})}
                    >
                      <option value="">Select Class</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Category</label>
                    <select 
                      required 
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                      value={form.categoryId}
                      onChange={e => setForm({...form, categoryId: e.target.value})}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Amount (GH₵)</label>
                    <input 
                      type="number"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                      value={form.amount}
                      onChange={e => setForm({...form, amount: parseFloat(e.target.value)})}
                    />
                 </div>
                 <div className="flex items-center gap-3 py-2">
                   <input 
                    type="checkbox" 
                    id="mandatory" 
                    checked={form.isMandatory} 
                    onChange={e => setForm({...form, isMandatory: e.target.checked})}
                    className="w-5 h-5 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500"
                   />
                   <label htmlFor="mandatory" className="text-sm font-bold text-slate-700 dark:text-slate-300">Mandatory for all students in class</label>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl">
                      {isEditing ? 'Save Changes' : 'Create'}
                    </button>
                    <button type="button" onClick={() => { setShowAdd(false); resetForm(); }} className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold">Cancel</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Manage Categories Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Fee Categories</h2>
              
              <div className="max-h-48 overflow-y-auto mb-8 pr-2 space-y-2">
                 {categories.map(cat => (
                   <div key={cat.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold dark:text-white">{cat.name}</p>
                        <p className="text-[10px] text-slate-500">{cat.description}</p>
                      </div>
                   </div>
                 ))}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                 <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 uppercase">New Category</h3>
                 <form onSubmit={handleCreateCategory} className="space-y-4">
                    <input 
                      required
                      placeholder="Category Name (e.g. PTA Dues)"
                      className="w-full px-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                      value={catForm.name}
                      onChange={e => setCatForm({...catForm, name: e.target.value})}
                    />
                    <input 
                      placeholder="Description"
                      className="w-full px-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                      value={catForm.description}
                      onChange={e => setCatForm({...catForm, description: e.target.value})}
                    />
                    <div className="flex gap-3">
                      <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all">Add Category</button>
                      <button type="button" onClick={() => setShowCategoryModal(false)} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold">Close</button>
                    </div>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
