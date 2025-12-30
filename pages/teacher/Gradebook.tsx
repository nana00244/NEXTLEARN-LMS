
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { gradingService } from '../../services/gradingService';
import { Spinner } from '../../components/UI/Spinner';

export const Gradebook: React.FC = () => {
  const { classId, subjectId } = useParams<{ classId: string; subjectId: string }>();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (classId && subjectId) {
      gradingService.getGradebook(classId, subjectId).then(res => {
        setData(res);
        setLoading(false);
      });
    }
  }, [classId, subjectId]);

  if (loading) return <div className="p-20"><Spinner size="lg" /></div>;

  // Extract all unique items (assignments/tests) for header
  const headers = data.length > 0 ? data[0].items : [];

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Class Gradebook</h1>
          <p className="text-sm text-slate-500">Academic performance summary</p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all flex items-center gap-2">
          📊 Export CSV
        </button>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-800/50 px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-r border-slate-100 dark:border-slate-700 min-w-[200px]">Student Name</th>
                {headers.map((h: any) => (
                  <th key={h.id} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[140px] text-center border-r border-slate-100 dark:border-slate-700">
                    <span className="block truncate max-w-[120px]">{h.title}</span>
                    <span className="text-[8px] text-indigo-500">{h.max} pts</span>
                  </th>
                ))}
                <th className="px-6 py-4 text-[10px] font-bold text-indigo-600 uppercase tracking-widest text-center min-w-[120px]">Overall Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.map(student => (
                <tr key={student.studentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-6 py-4 border-r border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{student.name}</p>
                  </td>
                  {student.items.map((item: any, i: number) => (
                    <td key={i} className="px-6 py-4 text-center border-r border-slate-100 dark:border-slate-700">
                      <div className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${
                        item.points === undefined 
                          ? 'bg-slate-100 text-slate-400 dark:bg-slate-800' 
                          : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                      }`}>
                        {item.points !== undefined ? item.points : '—'}
                      </div>
                    </td>
                  ))}
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                       <span className="text-lg font-black text-slate-900 dark:text-white">{student.overallGrade}%</span>
                       <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                         student.letterGrade === 'A' ? 'bg-emerald-100 text-emerald-700' : 
                         student.letterGrade === 'F' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                       }`}>{student.letterGrade}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
