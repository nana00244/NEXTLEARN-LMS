
import React, { useState, useEffect } from 'react';
import { resourceService } from '../services/resourceService';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/UI/Spinner';
import { Resource } from '../types';

export const ResourceLibrary: React.FC = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);

  const [form, setForm] = useState({ title: '', category: 'notes' as any });

  const fetchResources = async () => {
    const data = await resourceService.getAll();
    setResources(data);
    setLoading(false);
  };

  useEffect(() => { fetchResources(); }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    await resourceService.upload({
      ...form,
      uploadedBy: user.id,
      fileUrl: '#'
    });
    setShowUpload(false);
    fetchResources();
  };

  const filtered = filter === 'all' ? resources : resources.filter(r => r.category === filter);

  if (loading && resources.length === 0) return <div className="p-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Institutional Library</h1>
          <p className="text-slate-500">Access Syllabi, Past Papers, and academic guidelines</p>
        </div>
        {(user?.role === 'administrator' || user?.role === 'teacher') && (
          <button 
            onClick={() => setShowUpload(true)}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all"
          >
            + Upload Resource
          </button>
        )}
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {['all', 'syllabus', 'past_paper', 'notes', 'guideline'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-bold capitalize whitespace-nowrap transition-all ${
              filter === cat ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-100 dark:border-slate-800'
            }`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(r => (
          <div key={r.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-2xl">
                {r.category === 'syllabus' ? '📜' : r.category === 'past_paper' ? '📝' : '📄'}
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(r.uploadDate).toLocaleDateString()}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors">{r.title}</h3>
            <p className="text-xs text-slate-500 uppercase font-black tracking-tighter mb-6">{r.category.replace('_', ' ')}</p>
            
            <a href={r.fileUrl} className="w-full py-3 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">
              <span>⬇️</span> Download File
            </a>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-slate-500 italic">No resources found in this category.</p>
          </div>
        )}
      </div>

      {showUpload && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Upload Material</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <input 
                required 
                placeholder="Resource Title"
                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
              />
              <select 
                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                value={form.category}
                onChange={e => setForm({...form, category: e.target.value as any})}
              >
                <option value="syllabus">Syllabus</option>
                <option value="past_paper">Past Paper</option>
                <option value="notes">Lecture Notes</option>
                <option value="guideline">Institutional Guideline</option>
              </select>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold">Post to Library</button>
                <button type="button" onClick={() => setShowUpload(false)} className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-2xl font-bold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
