
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { assignmentService } from '../../services/assignmentService';
import { Spinner } from '../../components/UI/Spinner';
import { Link } from 'react-router-dom';

export const StudentStream: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      assignmentService.getStudentStream(user.id).then(data => {
        setItems(data);
        setLoading(false);
      });
    }
  }, [user]);

  if (loading) return <div className="p-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Class Stream</h1>
        <p className="text-slate-500 dark:text-slate-400">Chronological feed of your lessons and assignments</p>
      </header>

      <div className="space-y-6">
        {items.map(item => (
          <div key={item.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden group">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-sm font-bold uppercase">
                    {item.teacher?.firstName[0]}{item.teacher?.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{item.teacher?.firstName} {item.teacher?.lastName}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      {new Date(item.postedDate || item.createdAt).toLocaleDateString()} • {item.subject?.name}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                  item.type === 'assignment' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                }`}>
                  {item.type}
                </span>
              </div>

              <div className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{item.title}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                  {item.description || item.content}
                </p>

                {item.type === 'assignment' && (
                  <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Due Date</p>
                      <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                        {new Date(item.dueDate).toLocaleDateString()} at {item.dueTime}
                      </p>
                    </div>
                    <Link 
                      to={`/student/assignments/${item.id}`}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                    >
                      Open Assignment
                    </Link>
                  </div>
                )}
                
                {item.type === 'lesson' && (
                    <Link 
                    to={`/teacher/classes/${item.classId}/${item.subjectId}`} // Student view of class page
                    className="mt-4 block text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    View lesson details →
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="py-20 text-center space-y-4">
             <div className="text-6xl opacity-20">📡</div>
             <h3 className="text-lg font-bold text-slate-400">Your stream is quiet</h3>
             <p className="text-sm text-slate-500">New lessons and assignments will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};
