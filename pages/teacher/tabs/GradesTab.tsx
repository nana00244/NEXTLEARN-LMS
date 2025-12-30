
import React, { useState, useEffect } from 'react';
import { gradingService } from '../../../services/gradingService';
import { assignmentService } from '../../../services/assignmentService';
import { teacherService } from '../../../services/teacherService';
import { Spinner } from '../../../components/UI/Spinner';
import { Link } from 'react-router-dom';

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

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
         <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Class Gradebook</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Live Performance Matrix</p>
         </div>
         <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all">
           📊 Settings
         </button>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse">
           <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                 <th className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-800/50 px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 dark:border-slate-700 min-w-[220px]">Student</th>
                 <th className="px-6 py-6 text-[10px] font-black text-indigo-600 uppercase tracking-widest text-center border-r border-slate-100 dark:border-slate-700 min-w-[100px]">Overall</th>
                 {headers.map(h => (
                   <th key={h.id} className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 dark:border-slate-700 min-w-[150px] text-center">
                      <p className="truncate max-w-[140px] text-slate-800 dark:text-slate-200">{h.title}</p>
                      <p className="text-[8px] text-slate-400 mt-1">{h.max} pts</p>
                   </th>
                 ))}
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.map(student => (
                <tr key={student.studentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                   <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-8 py-4 border-r border-slate-100 dark:border-slate-700 font-bold text-sm text-slate-800 dark:text-slate-200">
                      {student.name}
                   </td>
                   <td className="px-6 py-4 text-center border-r border-slate-100 dark:border-slate-700">
                      <span className={`text-sm font-black ${parseFloat(student.overallGrade) > 70 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                        {student.overallGrade}%
                      </span>
                   </td>
                   {student.items.map((item: any, i: number) => (
                     <td key={i} className="px-6 py-4 text-center border-r border-slate-100 dark:border-slate-700">
                        <GradeCell item={item} />
                     </td>
                   ))}
                </tr>
              ))}
           </tbody>
        </table>
        
        {data.length === 0 && (
          <div className="py-20 text-center">
             <p className="text-slate-400 italic">No grades recorded for this class yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const GradeCell: React.FC<{ item: any }> = ({ item }) => {
  const isMissing = item.points === undefined && new Date() > new Date(); // Simplified missing logic
  
  return (
    <div className={`inline-flex items-center justify-center w-full min-h-[40px] rounded-xl transition-all group relative ${
      item.points !== undefined 
        ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600' 
        : isMissing ? 'bg-rose-50 dark:bg-rose-900/10 text-rose-600' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400'
    }`}>
       <span className="text-sm font-black">
         {item.points !== undefined ? item.points : isMissing ? 'Missing' : '—'}
       </span>
       
       {/* Hover Action */}
       <button className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase transition-all">
          View Detail
       </button>
    </div>
  );
};
