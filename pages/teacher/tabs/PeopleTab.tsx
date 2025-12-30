
import React, { useState, useEffect } from 'react';
import { teacherService } from '../../../services/teacherService';
import { Spinner } from '../../../components/UI/Spinner';

export const PeopleTab: React.FC<{ classId: string }> = ({ classId }) => {
  const [data, setData] = useState<any>(null);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      teacherService.getClassPeople(classId),
      teacherService.getClassById(classId)
    ]).then(([pData, cData]) => {
      setData(pData);
      setClassInfo(cData);
      setLoading(false);
    });
  }, [classId]);

  if (loading) return <Spinner />;

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      {/* Invite Code Section */}
      <div className="bg-indigo-600 rounded-[2rem] p-8 text-white flex justify-between items-center shadow-xl">
         <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Class Code</p>
            <h3 className="text-4xl font-black font-mono">{classInfo?.classCode}</h3>
         </div>
         <div className="text-right">
            <button className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all flex items-center gap-2">
               🔗 Copy Invite Link
            </button>
         </div>
      </div>

      {/* Teachers Section */}
      <section>
         <div className="flex justify-between items-center border-b border-indigo-600 pb-3 mb-6">
            <h2 className="text-3xl font-black text-indigo-600">Teachers</h2>
            <button className="text-indigo-600 p-2 hover:bg-indigo-50 rounded-full transition-colors">➕</button>
         </div>
         <div className="space-y-4">
            {data.teachers.map((t: any) => (
              <div key={t.id} className="flex items-center gap-4 py-2 border-b border-slate-50 dark:border-slate-800">
                 <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold uppercase">
                   {t.firstName[0]}{t.lastName[0]}
                 </div>
                 <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{t.firstName} {t.lastName}</span>
              </div>
            ))}
         </div>
      </section>

      {/* Students Section */}
      <section>
         <div className="flex justify-between items-center border-b border-indigo-600 pb-3 mb-6">
            <div className="flex items-center gap-6">
               <h2 className="text-3xl font-black text-indigo-600">Students</h2>
               <span className="text-sm font-bold text-slate-400 mt-2">{data.students.length} students</span>
            </div>
            <div className="flex items-center gap-2">
               <button className="text-indigo-600 p-2 hover:bg-indigo-50 rounded-full transition-colors">👤+</button>
            </div>
         </div>
         
         <div className="space-y-2">
            {data.students.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-800 group px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all">
                 <div className="flex items-center gap-4">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-sm font-bold uppercase">
                       {s.user.firstName[0]}
                    </div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{s.user.firstName} {s.user.lastName}</span>
                 </div>
                 <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">⋮</button>
              </div>
            ))}
         </div>

         {data.students.length === 0 && (
           <div className="py-20 text-center">
              <p className="text-slate-400 italic">Invite students to your class using the class code above.</p>
           </div>
         )}
      </section>
    </div>
  );
};
