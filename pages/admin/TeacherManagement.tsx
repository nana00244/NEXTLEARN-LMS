
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/UI/Spinner';
import { Alert } from '../../components/UI/Alert';
import { getStoredSubjects } from '../../services/mockDb';

export const TeacherManagement: React.FC = () => {
  const { setIgnoreAuthEvents, user: authUser } = useAuth();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showCreds, setShowCreds] = useState<any>(null);
  const [showAssign, setShowAssign] = useState<any>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Form states
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', specialization: '' });
  const [assignForm, setAssignForm] = useState({ classId: '', subjectId: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log("[TeacherManager] Syncing faculty data...");
      const [tData, cData, sData] = await Promise.all([
        adminService.getTeachers(),
        adminService.getClasses(),
        getStoredSubjects()
      ]);
      setTeachers(tData);
      setClasses(cData);
      setSubjects(sData);
    } catch (err: any) {
      console.error("[TeacherManager] Sync failed:", err);
      setAlert({ type: 'error', message: err.message || "Identity Sync Error: Ensure RLS is configured for profiles/teachers tables." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);
    try {
      const result = await adminService.addTeacher(form, setIgnoreAuthEvents);
      setShowCreds(result.credentials);
      setShowAdd(false);
      setForm({ firstName: '', lastName: '', email: '', password: '', specialization: '' });
      setTimeout(() => fetchData(), 1000);
    } catch (err: any) {
      console.error("[TeacherManager] Error during creation:", err);
      setAlert({ type: 'error', message: err.message || "Failed to create teacher account." });
      setLoading(false);
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

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.assignTeacherToClass(showAssign.id, assignForm.classId, assignForm.subjectId);
      setAlert({ type: 'success', message: 'Class assigned successfully' });
      setShowAssign(null);
      setAssignForm({ classId: '', subjectId: '' });
      fetchData();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    await adminService.removeTeacherFromClass(id);
    fetchData();
  };

  if (loading && teachers.length === 0) return <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
    <Spinner size="lg" />
    <p className="text-slate-400 font-medium">Synchronizing Faculty List...</p>
  </div>;

  const isSyncError = alert?.message.includes('Sync Timeout') || alert?.message.includes('SETUP_REQUIRED');

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Faculty Management</h1>
          <p className="text-slate-500">Manage instructors and academic workloads</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">🔄</button>
          <button 
            onClick={() => { setAlert(null); setShowAdd(true); }}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all"
          >
            + Add New Teacher
          </button>
        </div>
      </header>

      {alert && (
        <div className="space-y-4">
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
          
          {alert.type === 'error' && (isSyncError || alert.message.includes('row-level security')) && (
            <div className="p-8 bg-slate-900 text-slate-300 rounded-[2.5rem] border border-slate-800 animate-in slide-in-from-top-4 shadow-2xl">
                <div className="flex justify-between items-start mb-6">
                   <p className="text-indigo-400 font-black uppercase tracking-widest text-xs"># CRITICAL: Database Sync Fix</p>
                </div>
                <p className="mb-4 text-sm leading-relaxed">The "Sync Timeout" occurs because your database is missing the automation to create profiles when users sign up. Run this <strong>SQL Script</strong> in your Supabase SQL Editor to fix it:</p>
                
                <div className="bg-black/60 p-6 rounded-2xl border border-slate-700 font-mono text-[10px] overflow-x-auto whitespace-pre mb-6">
{`/* 1. Create the Automation Function */
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'first_name', 
    new.raw_user_meta_data->>'last_name', 
    new.raw_user_meta_data->>'role'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/* 2. Enable the Trigger */
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

/* 3. Ensure Permissions are Open for Admins */
DROP POLICY IF EXISTS "Admins manage all" ON profiles;
CREATE POLICY "Admins manage all" ON profiles FOR ALL TO authenticated 
USING (lower(auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'administrator'));`}
                </div>
                
                <p className="text-[10px] text-slate-500 italic font-medium">Running these 3 commands will eliminate sync timeouts forever.</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm min-h-[300px]">
        {teachers.length > 0 ? (
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Instructor</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Workload</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {teachers.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-black text-sm uppercase">
                        {t.user?.firstName?.[0] || 'T'}{t.user?.lastName?.[0] || 'R'}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{t.user?.firstName} {t.user?.lastName}</p>
                        <p className="text-xs text-slate-400">{t.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                     <div className="flex flex-wrap gap-2">
                        {t.assignments?.map((a: any) => (
                          <span key={a.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] font-bold">
                            {a.className} - {a.subjectName}
                            <button onClick={() => handleDeleteAssignment(a.id)} className="text-rose-400 hover:text-rose-600 ml-1">×</button>
                          </span>
                        ))}
                        <button 
                          onClick={() => setShowAssign(t)}
                          className="px-2.5 py-1 border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 rounded-lg text-[10px] font-bold hover:border-indigo-400 hover:text-indigo-400 transition-all"
                        >
                          + Assign
                        </button>
                     </div>
                  </td>
                  <td className="px-8 py-5 text-xs font-mono text-slate-400">{t.employee_id || t.employeeId}</td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => adminService.deleteTeacher(t.id).then(fetchData)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-24 text-center">
             <div className="text-6xl opacity-10 mb-4">👥</div>
             <h3 className="text-lg font-black text-slate-400">No teachers registered</h3>
             <p className="text-sm text-slate-500">Create instructor profiles to begin academic assignment.</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black mb-8">Add New Instructor</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="First Name" className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                <input required placeholder="Last Name" className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
              </div>
              <input required type="email" placeholder="Email Address" className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              <input placeholder="Password (Optional - default: NextLearn123)" type="password" className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={loading} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black">
                  {loading ? <Spinner size="sm" /> : 'Create Profile'}
                </button>
                <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-bold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credential Modal */}
      {showCreds && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-sm w-full shadow-2xl text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">🎉</div>
            <h2 className="text-2xl font-black mb-2">Account Ready!</h2>
            <p className="text-slate-500 mb-8">Admin session maintained. Share these credentials with the teacher.</p>
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl text-left space-y-3 mb-8">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username / Email</p>
                  <p className="font-bold text-slate-900 dark:text-white">{showCreds.email}</p>
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initial Password</p>
                  <p className="font-mono text-lg font-black text-indigo-600">{showCreds.password}</p>
               </div>
            </div>
            <button onClick={() => setShowCreds(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest">Got it</button>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssign && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black mb-2">Assign Class</h2>
            <p className="text-slate-400 text-sm mb-8">Select class and subject for {showAssign.user?.firstName}</p>
            <form onSubmit={handleAssign} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Select Class</label>
                <select required className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none dark:text-white" value={assignForm.classId} onChange={e => setAssignForm({...assignForm, classId: e.target.value})}>
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black">Link Class</button>
                <button type="button" onClick={() => setShowAssign(null)} className="px-6 py-4 bg-slate-100 rounded-2xl font-bold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
