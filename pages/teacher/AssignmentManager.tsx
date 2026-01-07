import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { assignmentService } from '../../services/assignmentService';
import { teacherService } from '../../services/teacherService';
import { Spinner } from '../../components/UI/Spinner';
import { Alert } from '../../components/UI/Alert';
import { Assignment } from '../../types';
import { Link } from 'react-router-dom';

export const AssignmentManager: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    instructions: '',
    points: 100,
    dueDate: '',
    dueTime: '23:59',
    classId: '',
    subjectId: '',
    submissionType: 'both' as 'file' | 'text' | 'both'
  });

  const refreshData = async () => {
    if (user) {
      const [aData, cData] = await Promise.all([
        assignmentService.getTeacherAssignments(user.id),
        teacherService.getAssignedClasses(user.id)
      ]);
      setAssignments(aData);
      setClasses(cData);
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    await assignmentService.createAssignment({
      ...form,
      teacherId: user.id
    });
    setShowAdd(false);
    refreshData();
  };

  if (loading && assignments.length === 0) return <div className="p-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Assignments</h1>
          <p className="text-slate-500 dark:text-slate-400">Create and track coursework for your classes</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all"
        >
          + Create Assignment
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map(a => (
          <div key={a.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all">
             <div className="flex justify-between mb-4">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Grade 10-A • Math</span>
                <span className="text-xs font-bold text-slate-400">Due {new Date(a.dueDate).toLocaleDateString()}</span>
             </div>
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{a.title}</h3>
             <p className="text-sm text-slate-500 line-clamp-2 mb-6">{a.instructions}</p>
             
             <div className="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-slate-800">
                <div className="flex gap-4">
                   <div className="text-center">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">0</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Turned In</p>
                   </div>
                   <div className="text-center">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">48</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Assigned</p>
                   </div>
                </div>
                <Link to={`/teacher/assignments/${a.id}/submissions`} className="text-indigo-600 text-sm font-bold hover:underline">Grade Work</Link>
             </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8">New Assignment</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="form-group">
                  <label>Title</label>
                  <input 
                    required 
                    placeholder="Homework #1: Algebraic Functions"
                    value={form.title}
                    onChange={e => setForm({...form, title: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Instructions</label>
                  <textarea 
                    rows={4}
                    placeholder="Detailed steps for students..."
                    value={form.instructions}
                    onChange={e => setForm({...form, instructions: e.target.value})}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Points</label>
                    <input 
                      type="number"
                      value={form.points}
                      onChange={e => setForm({...form, points: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Target Class</label>
                    <select 
                      required
                      onChange={e => {
                        const tc = classes.find(c => c.id === e.target.value);
                        setForm({...form, classId: tc.classId, subjectId: tc.subjectId});
                      }}
                    >
                      <option value="">Select Class</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.class.name} - {c.subject.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Due Date</label>
                    <input 
                      type="date"
                      required
                      value={form.dueDate}
                      onChange={e => setForm({...form, dueDate: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Due Time</label>
                    <input 
                      type="time"
                      value={form.dueTime}
                      onChange={e => setForm({...form, dueTime: e.target.value})}
                    />
                  </div>
                </div>

                <div className="modal-footer pt-8">
                  <button type="submit" className="bg-indigo-600 text-white rounded-2xl font-bold shadow-xl hover:bg-indigo-700 transition-all">Create Assignment</button>
                  <button type="button" onClick={() => setShowAdd(false)} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold">Cancel</button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};