
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { assignmentService } from '../../services/assignmentService';
import { Spinner } from '../../components/UI/Spinner';
import { Link } from 'react-router-dom';

type AssignmentStatus = 'assigned' | 'completed' | 'graded' | 'missing';

export const StudentAssignments: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AssignmentStatus>('assigned');

  useEffect(() => {
    if (user) {
      assignmentService.getStudentAssignments(user.id).then(data => {
        setAssignments(data);
        setLoading(false);
      });
    }
  }, [user]);

  const filtered = assignments.filter(a => a.status === activeTab);

  if (loading) return <div className="p-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Assignments</h1>
        <p className="text-slate-500 dark:text-slate-400">Keep track of your coursework and deadlines</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl w-fit">
        {(['assigned', 'completed', 'graded', 'missing'] as AssignmentStatus[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
              activeTab === tab 
                ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab}
            <span className="ml-2 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-md text-[10px] text-slate-600 dark:text-slate-400">
                {assignments.filter(a => a.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(a => (
          <Link 
            key={a.id} 
            to={`/student/assignments/${a.id}`}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase rounded-bl-xl ${
                a.status === 'missing' ? 'bg-rose-500 text-white' : 
                a.status === 'completed' ? 'bg-emerald-500 text-white' :
                'bg-indigo-600 text-white'
            }`}>
                {a.status}
            </div>

            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Mathematics</p>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 line-clamp-1">{a.title}</h3>
            
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>📅 Due {new Date(a.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>🎯 {a.points} Points</span>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Click to open</span>
                <span className="text-indigo-600">→</span>
            </div>
          </Link>
        ))}

        {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                 <p className="text-slate-500">No {activeTab} assignments found.</p>
            </div>
        )}
      </div>
    </div>
  );
};
