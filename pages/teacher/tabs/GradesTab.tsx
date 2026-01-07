import React, { useState, useEffect } from 'react';
import { gradingService } from '../../../services/gradingService';
import { Spinner } from '../../../components/UI/Spinner';

export const GradesTab: React.FC<{ classId: string; subjectId: string }> = ({ classId, subjectId }) => {
  const [data, setData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGradebook = async () => {
      const res = await gradingService.getGradebook(classId, subjectId);
      setData(res);
      if (res.length > 0) {
         setHeaders(res[0].items);
      }
      setLoading(false);
    };
    fetchGradebook();
  }, [classId, subjectId]);

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center mb-2 px-1">
         <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Gradebook</h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Academic Matrix</p>
         </div>
         <button className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
           📊 Export
         </button>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden table-wrapper matrix-table">
        <table className="w-full border-collapse">
           <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                 <th className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-800/50 px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 dark:border-slate-700 min-w-[220px] text-left">Student</th>
                 <th className="px-6 py-6 text-[10px] font-black text-indigo-600 uppercase tracking-widest text-center border-r border-slate-100 dark:border-slate-700 min-w-[100px]">Avg</th>
                 {headers.map(h => (
                   <th key={h.id} className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 dark:border-slate-700 min-w-[140px] text-center">
                      <p className="truncate max-w-[120px] text-slate-800 dark:text-slate-200">{h.title}</p>
                      <p className="text-[8px] text-slate-400 mt-1">{h.max} pts</p>
                   </th>
                 ))}
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.map(student => (
                <tr key={student.studentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                   <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-8 py-4 border-r border-slate-100 dark:border-slate-700 font-bold text-sm text-slate-800 dark:text-slate-200 text-left">
                      {student.name}
                   </td>
                   <td className="px-6 py-4 text-center border-r border-slate-100 dark:border-slate-700">
                      <span className={`text-sm font-black ${parseFloat(student.overallGrade) > 70 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                        {student.overallGrade}%
                      </span>
                   </td>
                   {student.items.map((item: any, i: number) => (
                     <td key={i} className="px-4 py-4 text-center border-r border-slate-100 dark:border-slate-700">
                        <GradeCell item={item} />
                     </td>
                   ))}
                </tr>
              ))}
           </tbody>
        </table>
        
        {data.length === 0 && (
          <div className="py-20 text-center">
             <p className="text-slate-400 italic font-medium">No students or grades found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const GradeCell: React.FC<{ item: any }> = ({ item }) => {
  const isMissing = item.points === undefined;
  
  return (
    <div className={`inline-flex items-center justify-center min-w-[50px] min-h-[36px] rounded-xl transition-all group relative ${
      item.points !== undefined 
        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' 
        : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400'
    }`}>
       <span className="text-xs font-black">
         {item.points !== undefined ? item.points : '—'}
       </span>
       
       <button className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase transition-all shadow-lg">
          Edit
       </button>
    </div>
  );
};