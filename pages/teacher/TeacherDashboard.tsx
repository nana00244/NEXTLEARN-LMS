
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { teacherService } from '../../services/teacherService';
import { Spinner } from '../../components/UI/Spinner';
import { Link } from 'react-router-dom';
import { getStoredSubjects } from '../../services/mockDb';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (user) {
      setLoading(true);
      const classData = await teacherService.getAssignedClasses(user.id);
      setClasses(classData);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  if (loading && classes.length === 0) return <div className="p-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Instructor Portal</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your subjects and monitor student progress</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickStat label="Assigned Classes" value={classes.length.toString()} icon="🏫" color="emerald" />
        <QuickStat label="Active Stream" value="Live" icon="📡" color="indigo" />
        <QuickStat label="Notifications" value="2" icon="🔔" color="amber" />
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">My Assigned Classes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map(tc => (
            <div 
              key={tc.id} 
              className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    📚
                 </div>
                 <Link 
                    to={`/teacher/roster/${tc.classId}`}
                    className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest"
                 >
                   View Roster
                 </Link>
              </div>
              
              <Link to={`/teacher/classes/${tc.classId}/${tc.subjectId}`}>
                 <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{tc.class?.name}</h3>
                 <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-6">{tc.subject?.name}</p>
              </Link>
              
              <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800">
                <Link to={`/teacher/gradebook/${tc.classId}/${tc.subjectId}`} className="text-xs font-bold text-slate-400 hover:text-indigo-600">Gradebook</Link>
                <Link to={`/teacher/classes/${tc.classId}/${tc.subjectId}`} className="text-xs font-bold text-indigo-600">Enter Class →</Link>
              </div>
            </div>
          ))}
          {classes.length === 0 && (
            <div className="col-span-full p-12 text-center bg-slate-50 dark:bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 italic">No classes have been assigned to you by the administrator yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const QuickStat: React.FC<{ label: string; value: string; icon: string; color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
    <div className={`w-14 h-14 rounded-2xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center text-2xl`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  </div>
);
