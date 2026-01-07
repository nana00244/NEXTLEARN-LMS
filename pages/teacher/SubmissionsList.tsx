import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { gradingService } from '../../services/gradingService';
import { Spinner } from '../../components/UI/Spinner';
import { Submission } from '../../types';

export const SubmissionsList: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'graded' | 'ungraded' | 'late'>('all');

  useEffect(() => {
    if (assignmentId) {
      gradingService.getAssignmentSubmissions(assignmentId).then(data => {
        setSubmissions(data);
        setLoading(false);
      });
    }
  }, [assignmentId]);

  const filtered = submissions.filter(s => {
    if (filter === 'graded') return s.status === 'graded' || s.status === 'returned';
    if (filter === 'ungraded') return s.status === 'submitted';
    if (filter === 'late') return s.isLate;
    return true;
  });

  if (loading) return <div className="p-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Submissions</h1>
          <p className="text-sm text-slate-500">Review and grade student work</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
           {['all', 'ungraded', 'graded', 'late'].map((f: any) => (
             <button
               key={f}
               onClick={() => setFilter(f)}
               className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-colors ${
                 filter === f ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-100 dark:border-slate-800'
               }`}
             >
               {f}
             </button>
           ))}
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="table-wrapper">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grade</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4" data-label="Student">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {s.user?.firstName[0]}{s.user?.lastName[0]}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{s.user?.firstName} {s.user?.lastName}</p>
                        <p className="text-[10px] text-slate-400">{s.student?.admissionNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4" data-label="Date">
                     <p className="text-xs text-slate-600 dark:text-slate-400">{new Date(s.submittedDate).toLocaleDateString()}</p>
                     {s.isLate && <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">Late</span>}
                  </td>
                  <td className="px-6 py-4" data-label="Status">
                     <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                       s.status === 'submitted' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                     }`}>
                       {s.status}
                     </span>
                  </td>
                  <td className="px-6 py-4" data-label="Grade">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{s.grade !== undefined ? `${s.grade}%` : '—'}</p>
                  </td>
                  <td className="px-6 py-4 text-right" data-label="Action">
                    <Link 
                      to={`/teacher/grading/${s.id}`}
                      className="inline-block px-4 py-2 bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      Grade
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-slate-500 italic">No submissions match the current filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};