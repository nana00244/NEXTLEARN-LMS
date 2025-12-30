
import React, { useState, useEffect } from 'react';
import { reportCardService } from '../../services/reportCardService';
import { adminService } from '../../services/adminService';
import { academicService } from '../../services/academicService';
import { Spinner } from '../../components/UI/Spinner';
import { Alert } from '../../components/UI/Alert';
import { Class, Term, AcademicYear } from '../../types';

export const ReportCardGenerator: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    Promise.all([
      adminService.getClasses(),
      academicService.getTerms(),
      academicService.getCurrentTerm()
    ]).then(([cData, tData, current]) => {
      setClasses(cData);
      setTerms(tData);
      if (cData.length > 0) setSelectedClass(cData[0].id);
      if (current) {
        setSelectedTerm(current.id);
        setSelectedYear(current.academicYearId);
      }
      setLoading(false);
    });
  }, []);

  const handleGenerate = async () => {
    if (!selectedClass || !selectedTerm) return;
    setProcessing(true);
    try {
      await reportCardService.generateForClass(selectedClass, selectedTerm, selectedYear);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert("Generation failed.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Academic Performance Engine</h1>
        <p className="text-slate-500">Bulk generate report cards based on gradebook and attendance data</p>
      </header>

      {success && <Alert type="success" message="Reports successfully generated and ranked!" />}

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-widest">Select Class</label>
              <select 
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
              >
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
           </div>
           <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-widest">Term</label>
              <select 
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                value={selectedTerm}
                onChange={e => setSelectedTerm(e.target.value)}
              >
                {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
           </div>
           <div className="flex items-end">
              <button 
                onClick={handleGenerate}
                disabled={processing}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2"
              >
                {processing ? <Spinner size="sm" /> : 'Run Batch Generation'}
              </button>
           </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
           <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Notice on Data Compilation</h3>
           <p className="text-xs text-slate-500 leading-relaxed">
             Running this process will automatically calculate overall percentages, class rankings, and pull attendance totals. 
             This action will overwrite any unfinalized report cards for the selected term.
           </p>
        </div>
      </div>
    </div>
  );
};
