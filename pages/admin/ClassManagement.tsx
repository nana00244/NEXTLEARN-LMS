
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Spinner } from '../../components/UI/Spinner';
import { Alert } from '../../components/UI/Alert';
import { getStoredSubjects } from '../../services/mockDb';
import { Link } from 'react-router-dom';

export const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddClass, setShowAddClass] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Form States
  const [classForm, setClassForm] = useState({ name: '', gradeLevel: '', section: '' });
  const [assignForm, setAssignForm] = useState({ teacherId: '', subjectId: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cData, tData, sData] = await Promise.all([
        adminService.getClasses(),
        adminService.getTeachers(),
        getStoredSubjects()
      ]);
      setClasses(cData);
      setTeachers(tData);
      setSubjects(sData);
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateOrUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await adminService.updateClass(editingClass.id, classForm);
        setAlert({ type: 'success', message: 'Class updated successfully!' });
      } else {
        await adminService.createClass(classForm);
        setAlert({ type: 'success', message: 'Class created successfully!' });
      }
      setShowAddClass(false);
      setEditingClass(null);
      setClassForm({ name: '', gradeLevel: '', section: '' });
      fetchData();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleQuickAddSubject = async () => {
    if (!newSubjectName.trim()) return;
    try {
      const subject = await adminService.createSubject(newSubjectName.trim());
      setSubjects(prev => [...prev, subject]);
      setAssignForm(prev => ({ ...prev, subjectId: subject.id }));
      setNewSubjectName('');
    } catch (err: any) {
      setAlert({ type: 'error', message: 'Failed to add subject' });
    }
  };

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    try {
      await adminService.assignTeacherToClass(assignForm.teacherId, selectedClass.id, assignForm.subjectId);
      setAlert({ type: 'success', message: 'Teacher assigned successfully!' });
      setShowAssignModal(false);
      setAssignForm({ teacherId: '', subjectId: '' });
      fetchData();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleEditClick = (c: any) => {
    setEditingClass(c);
    setClassForm({ name: c.name, gradeLevel: c.gradeLevel, section: c.section });
    setShowAddClass(true);
  };

  if (loading && classes.length === 0) return <div className="p-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Class Hub</h1>
          <p className="text-slate-500">Master view of all academic groupings and staff leads</p>
        </div>
        <button 
          onClick={() => { setEditingClass(null); setClassForm({ name: '', gradeLevel: '', section: '' }); setShowAddClass(true); }}
          className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all"
        >
          + Add New Class
        </button>
      </header>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(c => (
          <div key={c.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🏫</div>
              <div className="flex gap-2">
                <button onClick={() => handleEditClick(c)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit Properties">✏️</button>
                <button onClick={() => adminService.deleteClass(c.id).then(fetchData)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors" title="Remove Class">🗑️</button>
              </div>
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{c.name}</h3>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-6">Grade {c.gradeLevel} • Section {c.section}</p>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-6">
               <div className="text-center">
                  <p className="text-xl font-black text-indigo-600">{c.studentCount}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Students</p>
               </div>
               <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
               <div className="text-center">
                  <p className="text-xl font-black text-emerald-600">{c.teachers?.length || 0}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Instructors</p>
               </div>
               <Link 
                to={`/admin/classes/${c.id}/roster`}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700 transition-all"
               >
                 Roster
               </Link>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Academic Leads</p>
                <div className="space-y-2">
                  {c.teachers?.length > 0 ? c.teachers.map((t: any) => (
                    <div key={t.id} className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded-xl shadow-sm">
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-black text-slate-900 dark:text-white leading-tight truncate">{t.name}</p>
                        <p className="text-[8px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">{t.subject}</p>
                      </div>
                      <button onClick={() => adminService.removeTeacherFromClass(t.id).then(fetchData)} className="text-rose-400 hover:text-rose-600 text-xs px-2">×</button>
                    </div>
                  )) : <span className="text-[10px] text-slate-400 italic">No assigned staff</span>}
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={() => { setSelectedClass(c); setShowAssignModal(true); }}
                  className="w-full py-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                >
                  Assign Instructor
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {showAddClass && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black mb-8">{editingClass ? 'Edit Class' : 'Create New Class'}</h2>
            <form onSubmit={handleCreateOrUpdateClass} className="space-y-4">
              <input required placeholder="Class Name (e.g. Science 101)" className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Level (e.g. 10)" className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white" value={classForm.gradeLevel} onChange={e => setClassForm({...classForm, gradeLevel: e.target.value})} />
                <input required placeholder="Section (e.g. Alpha)" className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white" value={classForm.section} onChange={e => setClassForm({...classForm, section: e.target.value})} />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black">{editingClass ? 'Update Class' : 'Create Class'}</button>
                <button type="button" onClick={() => setShowAddClass(false)} className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-bold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
            <h2 className="text-2xl font-black mb-2">Faculty Assignment</h2>
            <p className="text-slate-400 text-sm mb-8">Link an instructor to {selectedClass?.name}</p>
            <form onSubmit={handleAssignTeacher} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Select Instructor</label>
                <select required className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none dark:text-white" value={assignForm.teacherId} onChange={e => setAssignForm({...assignForm, teacherId: e.target.value})}>
                  <option value="">Select Teacher</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.user?.firstName} {t.user?.lastName}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Assign Subject (Optional)</label>
                <select className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none dark:text-white" value={assignForm.subjectId} onChange={e => setAssignForm({...assignForm, subjectId: e.target.value})}>
                  <option value="">No Subject (General Instructor)</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Add Missing Subject</label>
                <div className="flex gap-2">
                  <input 
                    placeholder="New Subject Name" 
                    className="flex-1 p-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none dark:text-white"
                    value={newSubjectName}
                    onChange={e => setNewSubjectName(e.target.value)}
                  />
                  <button 
                    type="button" 
                    onClick={handleQuickAddSubject}
                    className="px-4 py-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl font-bold text-xs"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black">Finalize Link</button>
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-6 py-4 bg-slate-100 rounded-2xl font-bold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
