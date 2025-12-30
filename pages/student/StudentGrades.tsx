
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gradingService } from '../../services/gradingService';
import { Spinner } from '../../components/UI/Spinner';

export const StudentGrades: React.FC = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      gradingService.getStudentGrades(user.id).then(res => {
        setGrades(res);
        setLoading(false);
      });
    }
  }, [user]);

  if (loading) return <div className="p-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Academic Performance</h1>
        <p className="text-slate-500 dark:text-slate-400">Track your grades and teacher feedback</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Overall GPA</p>
            <h2 className="text-5xl font-black text-indigo-600">3.8</h2>
            <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 space-y-4">
               <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-500">Graded Work</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-white">{grades.length} items</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-500">In Progress</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-white">4 items</span>
               </div>
            </div>
         </div>

         <div className="lg:col-span-3 space-y-4">
            {grades.map(grade => (
              <div key={grade.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="flex-1">
                   <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md uppercase">
                        {grade.subject?.name}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Graded {new Date(grade.gradedDate).toLocaleDateString()}
                      </span>
                   </div>
                   <h3 className="text-lg font-bold text-slate-900 dark:text-white">{grade.assignment?.title}</h3>
                   {grade.feedback && (
                     <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Teacher Feedback</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 italic">"{grade.feedback}"</p>
                     </div>
                   )}
                </div>

                <div className="flex items-center gap-6 self-end md:self-center">
                   <div className="text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Score</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{grade.grade}%</p>
                   </div>
                   <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200 dark:shadow-none">
                      {grade.letterGrade}
                   </div>
                </div>
              </div>
            ))}

            {grades.length === 0 && (
              <div className="py-20 text-center bg-slate-50 dark:bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-slate-500">No graded work available yet.</p>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};
