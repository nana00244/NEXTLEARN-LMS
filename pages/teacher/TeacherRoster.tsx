
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherService } from '../../services/teacherService';
import { Spinner } from '../../components/UI/Spinner';

export const TeacherRoster: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (classId) {
      teacherService.getClassRoster(classId).then(data => {
        setStudents(data);
        setLoading(false);
      });
    }
  }, [classId]);

  if (loading) return <div className="p-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">←</button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Class Roster</h1>
          <p className="text-sm text-slate-500">View-only list of enrolled students</p>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Name</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Admission No.</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {students.map(student => (
              <tr key={student.id} className="hover:bg-slate-50/50 transition-all">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-xs">
                      {student.user?.firstName[0]}{student.user?.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{student.user?.firstName} {student.user?.lastName}</p>
                      <p className="text-xs text-slate-400">{student.user?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-sm font-mono text-slate-600 dark:text-slate-400">{student.admissionNumber}</td>
                <td className="px-8 py-5">
                   <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase">Enrolled</span>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={3} className="p-20 text-center text-slate-500 italic">No students are currently enrolled in this class.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
