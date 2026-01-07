import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/UI/Spinner';
import { Alert } from '../../components/UI/Alert';
import { getStoredSubjects } from '../../services/mockDb';
import { Link } from 'react-router-dom';

export const ClassManagement: React.FC = () => {
  const { user: authUser } = useAuth();
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
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateOrUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingClass) {
        await adminService.updateClass(editingClass.id, classForm);
      } else {
        await adminService.createClass(classForm);
      }
      setShowAddClass(false);
      setEditingClass(null);
      setClassForm({ name: '', gradeLevel: '', section: '' });
      await fetchData();
      setAlert({ type: 'success', message: 'Operation successful' });
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    try {
      await adminService.assignTeacherToClass(assignForm.teacherId, selectedClass.id, assignForm.subjectId);
      setShowAssignModal(false);
      setAssignForm({ teacherId: '', subjectId: '' });
      fetchData();
      setAlert({ type: 'success', message: 'Teacher assigned' });
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  if (loading && classes.length === 0) return <div className="p-20 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black">Class Hub</h1>
          <p className="text-slate-500">Institutional grouping and academic leads</p>
        </div>
        <button 
          onClick={() => { setEditingClass(null); setClassForm({ name: '', gradeLevel: '', section: '' }); setShowAddClass(true); }}
          className="btn btn-primary"
        >
          + Add New Class
        </button>
      </header>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(c => (
          <div key={c.id} className="card">
            <div className="card-header flex justify-between items-center">
              <span>{c.name}</span>
              <div className="flex gap-2">
                <button onClick={() => { setEditingClass(c); setClassForm({name: c.name, gradeLevel: c.gradeLevel, section: c.section}); setShowAddClass(true); }} className="text-indigo-600 text-xs font-bold">Edit</button>
                <button onClick={() => adminService.deleteClass(c.id).then(fetchData)} className="text-rose-600 text-xs font-bold">Delete</button>
              </div>
            </div>
            <div className="card-body">
              <p className="text-xs text-slate-400 font-bold uppercase mb-4">Grade {c.gradeLevel} • Section {c.section}</p>
              
              <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                 <div className="text-center">
                    <p className="text-lg font-bold">{c.studentCount}</p>
                    <p className="text-[10px] text-slate-400 uppercase">Students</p>
                 </div>
                 <Link to={`/admin/classes/${c.id}/roster`} className="btn btn-sm btn-primary">Roster</Link>
              </div>

              <div className="space-y-2">
                {c.teachers?.map((t: any) => (
                  <div key={t.id} className="text-[10px] bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded flex justify-between">
                    <span className="font-bold">{t.name} • {t.subject}</span>
                  </div>
                ))}
                <button onClick={() => { setSelectedClass(c); setShowAssignModal(true); }} className="w-full py-2 border border-dashed border-indigo-200 text-indigo-600 text-[10px] font-bold uppercase rounded-lg">Assign Instructor</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddClass && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-xl max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-6">{editingClass ? 'Edit Class' : 'Create Class'}</h2>
            <form onSubmit={handleCreateOrUpdateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Name</label>
                <input required className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Grade</label>
                  <input required className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg" value={classForm.gradeLevel} onChange={e => setClassForm({...classForm, gradeLevel: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Section</label>
                  <input required className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg" value={classForm.section} onChange={e => setClassForm({...classForm, section: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold">Save</button>
                <button type="button" onClick={() => setShowAddClass(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-xl max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-6">Assign Faculty</h2>
            <form onSubmit={handleAssignTeacher} className="space-y-4">
              <select required className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800" value={assignForm.teacherId} onChange={e => setAssignForm({...assignForm, teacherId: e.target.value})}>
                <option value="">Select Teacher</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.user?.firstName} {t.user?.lastName}</option>)}
              </select>
              <select required className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800" value={assignForm.subjectId} onChange={e => setAssignForm({...assignForm, subjectId: e.target.value})}>
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold">Assign</button>
                <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};