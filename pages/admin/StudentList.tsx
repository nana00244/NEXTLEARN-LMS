import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Spinner } from '../../components/UI/Spinner';
import { Alert } from '../../components/UI/Alert';
import { Class } from '../../types';

export const StudentList: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showEnrolModal, setShowEnrolModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // State for targets
  const [studentToManage, setStudentToManage] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Results
  const [alert, setAlert] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [newCreds, setNewCreds] = useState<{ email: string; password: string } | null>(null);

  // Form State
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    admissionNumber: '',
    classId: '',
    status: 'active',
    password: ''
  });

  // Password Reset State
  const [pwdMode, setPwdMode] = useState<'auto' | 'manual'>('auto');
  const [manualPwd, setManualPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sData, cData] = await Promise.all([
        adminService.getStudents(),
        adminService.getClasses()
      ]);
      setStudents(sData || []);
      setClasses(cData || []);
    } catch (err) {
      setAlert({ type: 'error', message: 'Synchronization error.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleEdit = (student: any) => {
    setStudentToManage(student);
    setIsEditing(true);
    setForm({
      firstName: student.user?.firstName || '',
      lastName: student.user?.lastName || '',
      email: student.user?.email || '',
      admissionNumber: student.admissionNumber || '',
      classId: student.classId || '',
      status: student.status || 'active',
      password: ''
    });
    setShowEnrolModal(true);
  };

  const handleEnrolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing && studentToManage) {
        await adminService.updateStudent(
          studentToManage.id,
          { admissionNumber: form.admissionNumber, classId: form.classId, status: form.status },
          { firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password }
        );
        setAlert({ type: 'success', message: 'Student profile updated.' });
      } else {
        const res = await adminService.addStudent(
          { admissionNumber: form.admissionNumber, classId: form.classId, status: form.status },
          { firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password }
        );
        setNewCreds(res.credentials);
      }
      setShowEnrolModal(false);
      await fetchData();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message });
      setLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!studentToManage) return;
    setLoading(true);
    try {
      await adminService.deleteStudent(studentToManage.id);
      setAlert({ type: 'success', message: `Unenrolled ${studentToManage.user?.firstName} from system.` });
      setShowDeleteModal(false);
      await fetchData();
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to remove enrollment.' });
      setLoading(false);
    }
  };

  const executePasswordReset = async () => {
    if (!studentToManage) return;
    setLoading(true);
    try {
      if (pwdMode === 'auto') {
        const res = await adminService.resetUserPassword(studentToManage.user?.id);
        setNewCreds(res);
      } else {
        if (manualPwd !== confirmPwd) throw new Error("Passwords mismatch.");
        if (manualPwd.length < 6) throw new Error("Security check failed: 6+ characters required.");
        await adminService.updateUserPassword(studentToManage.user?.id, manualPwd);
        setNewCreds({ email: studentToManage.user?.email, password: manualPwd });
      }
      setShowPasswordModal(false);
      await fetchData();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message });
      setLoading(false);
    }
  };

  const filtered = students.filter(s => 
    `${s.user?.firstName} ${s.user?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Student Roster</h1>
          <p className="text-slate-500">Academic Lifecycle Management</p>
        </div>
        <button 
          onClick={() => { setIsEditing(false); setStudentToManage(null); setShowEnrolModal(true); }}
          className="btn btn-primary px-8"
        >
          ➕ Enroll New Student
        </button>
      </header>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="card">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <input 
            type="text" 
            placeholder="Search name or ID..." 
            className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 font-bold text-xs uppercase">
                        {s.user?.firstName[0]}{s.user?.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{s.user?.firstName} {s.user?.lastName}</p>
                        <p className="text-xs text-slate-400">{s.class?.name || 'Unassigned'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-mono text-slate-500 dark:text-slate-400 uppercase">{s.admissionNumber}</td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => { setStudentToManage(s); setPwdMode('auto'); setShowPasswordModal(true); }} className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">🔑 Access</button>
                       <button onClick={() => handleEdit(s)} className="p-2 border border-slate-200 dark:border-slate-700 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all">✏️</button>
                       <button onClick={() => { setStudentToManage(s); setShowDeleteModal(true); }} className="p-2 border border-rose-200 dark:border-rose-900/50 text-rose-500 rounded-xl hover:bg-rose-50 transition-all">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && studentToManage && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-10 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 text-center animate-in zoom-in-95">
              <div className="text-6xl mb-6">⚠️</div>
              <h3 className="text-2xl font-black mb-2">Unenroll Student?</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
                Confirm removal of <strong>{studentToManage.user?.firstName} {studentToManage.user?.lastName}</strong>. Their academic and financial history will be archived.
              </p>
              <div className="flex gap-3">
                 <button onClick={executeDelete} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Unenroll</button>
                 <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-bold uppercase tracking-widest">Cancel</button>
              </div>
           </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && studentToManage && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
              <div className="flex items-center gap-4 mb-8 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                 <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-2xl">🎓</div>
                 <div>
                    <p className="text-sm font-black dark:text-white">{studentToManage.user?.firstName} {studentToManage.user?.lastName}</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase">{studentToManage.admissionNumber}</p>
                 </div>
              </div>

              <div className="space-y-4 mb-8">
                 <div onClick={() => setPwdMode('auto')} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${pwdMode === 'auto' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-800 bg-slate-50/50'}`}>
                    <p className="text-sm font-black dark:text-white">Auto-Generate System Key</p>
                    <p className="text-xs text-slate-500">Secure 12-char random alphanumeric sequence.</p>
                 </div>

                 <div onClick={() => setPwdMode('manual')} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${pwdMode === 'manual' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-800 bg-slate-50/50'}`}>
                    <p className="text-sm font-black dark:text-white">Manual Credentials Override</p>
                    {pwdMode === 'manual' && (
                       <div className="mt-4 space-y-3">
                          <input type="password" placeholder="New Password" className="w-full p-4 rounded-xl border border-slate-200 dark:bg-slate-800" value={manualPwd} onChange={e => setManualPwd(e.target.value)} />
                          <input type="password" placeholder="Confirm" className="w-full p-4 rounded-xl border border-slate-200 dark:bg-slate-800" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
                       </div>
                    )}
                 </div>
              </div>

              <div className="flex gap-3">
                 <button onClick={executePasswordReset} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Apply Access Key</button>
                 <button onClick={() => { setShowPasswordModal(false); setManualPwd(''); setConfirmPwd(''); }} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-bold uppercase tracking-widest">Discard</button>
              </div>
           </div>
        </div>
      )}

      {/* Results Modal */}
      {newCreds && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 max-w-sm w-full shadow-2xl text-center border-4 border-emerald-500/20">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">🔑</div>
              <h3 className="text-2xl font-black mb-2">Access Credentials</h3>
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl text-left space-y-4 mb-8">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">User Identity</p>
                    <p className="font-bold text-slate-900 dark:text-white truncate">{newCreds.email}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Generated Access Key</p>
                    <p className="font-mono text-xl font-black text-indigo-600">{newCreds.password}</p>
                 </div>
              </div>
              <button onClick={() => setNewCreds(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest">Confirm & Secure</button>
           </div>
        </div>
      )}

      {/* Enrollment Modal */}
      {showEnrolModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] max-w-2xl w-full shadow-2xl animate-in zoom-in-95">
            <h2 className="text-3xl font-black mb-8">{isEditing ? 'Update Profile' : 'Enroll Student'}</h2>
            <form onSubmit={handleEnrolSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0" placeholder="First Name" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                <input required className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0" placeholder="Last Name" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
              </div>
              <input required type="email" className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0" placeholder="Admission No" value={form.admissionNumber} onChange={e => setForm({...form, admissionNumber: e.target.value})} />
                <select required className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 font-bold" value={form.classId} onChange={e => setForm({...form, classId: e.target.value})}>
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest">Save Record</button>
                <button type="button" onClick={() => setShowEnrolModal(false)} className="px-8 py-4 bg-slate-100 rounded-2xl font-bold uppercase">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};