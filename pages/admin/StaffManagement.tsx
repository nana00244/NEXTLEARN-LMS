import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Spinner } from '../../components/UI/Spinner';
import { Alert } from '../../components/UI/Alert';
import { UserRole } from '../../types';

export const StaffManagement: React.FC = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showEnrolModal, setShowEnrolModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Selected Users
  const [memberToManage, setMemberToManage] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Notifications
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [newCreds, setNewCreds] = useState<{ email: string, password: string } | null>(null);

  // Form State
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'teacher' as UserRole,
    specialization: '',
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
      const data = await adminService.getStaffMembers();
      setStaff(data);
    } catch (err: any) {
      setAlert({ type: 'error', message: 'Sync failed.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleEdit = (member: any) => {
    setMemberToManage(member);
    setIsEditing(true);
    setForm({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      role: member.role,
      specialization: member.teacherData?.specialization || '',
      password: ''
    });
    setShowEnrolModal(true);
  };

  const handleEnrolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing && memberToManage) {
        await adminService.updateStaff(memberToManage.id, form);
        setAlert({ type: 'success', message: 'Staff profile updated.' });
      } else {
        const res = await adminService.addStaff(form);
        setNewCreds(res.credentials);
      }
      setShowEnrolModal(false);
      await fetchData();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Operation failed.' });
      setLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!memberToManage) return;
    setLoading(true);
    try {
      await adminService.deleteStaffMember(memberToManage.id);
      setAlert({ type: 'success', message: `${memberToManage.firstName} has been removed.` });
      setShowDeleteModal(false);
      await fetchData();
    } catch (err) {
      setAlert({ type: 'error', message: 'Delete failed.' });
      setLoading(false);
    }
  };

  const executePasswordReset = async () => {
    if (!memberToManage) return;
    setLoading(true);
    try {
      if (pwdMode === 'auto') {
        const res = await adminService.resetUserPassword(memberToManage.id);
        setNewCreds(res);
      } else {
        if (manualPwd !== confirmPwd) throw new Error("Passwords mismatch.");
        if (manualPwd.length < 8) throw new Error("Password must be 8+ chars.");
        await adminService.updateUserPassword(memberToManage.id, manualPwd);
        setNewCreds({ email: memberToManage.email, password: manualPwd });
      }
      setShowPasswordModal(false);
      await fetchData();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message });
      setLoading(false);
    }
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: 'None', color: 'bg-slate-200', width: '0%' };
    if (pwd.length < 6) return { label: 'Weak', color: 'bg-rose-500', width: '33%' };
    if (pwd.length < 10) return { label: 'Medium', color: 'bg-amber-500', width: '66%' };
    return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
  };

  const filtered = staff.filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && staff.length === 0) return <div className="p-20 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Staff Hub</h1>
          <p className="text-slate-500">Personnel & Access Control Center</p>
        </div>
        <button 
          onClick={() => { setIsEditing(false); setMemberToManage(null); setForm({firstName: '', lastName: '', email: '', role: 'teacher', specialization: '', password: ''}); setShowEnrolModal(true); }}
          className="btn btn-primary px-8"
        >
          ➕ Enroll New Staff
        </button>
      </header>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="card">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="relative w-full md:w-96">
              <span className="absolute left-4 top-1/2 -translate-y-1/2">🔍</span>
              <input 
                type="text" 
                placeholder="Search faculty..." 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-600"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{staff.length} Active Records</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(member => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {member.firstName[0]}{member.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{member.firstName} {member.lastName}</p>
                        <p className="text-xs text-slate-400">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                      {member.role}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                     <div className="flex justify-end gap-2">
                        <button onClick={() => { setMemberToManage(member); setPwdMode('auto'); setShowPasswordModal(true); }} className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">🔑 Reset</button>
                        <button onClick={() => handleEdit(member)} className="p-2 border border-slate-200 dark:border-slate-700 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all">✏️</button>
                        <button onClick={() => { setMemberToManage(member); setShowDeleteModal(true); }} className="p-2 border border-rose-200 dark:border-rose-900/50 text-rose-500 rounded-xl hover:bg-rose-50 transition-all">🗑️</button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enrolment/Edit Modal */}
      {showEnrolModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
              <h2 className="text-3xl font-black mb-8">{isEditing ? 'Update Staff Member' : 'Enroll New Personnel'}</h2>
              <form onSubmit={handleEnrolSubmit} className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">First Name</label>
                       <input required className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                    </div>
                    <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Last Name</label>
                       <input required className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Email Address</label>
                    <input required type="email" className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Role</label>
                       <select className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 font-bold" value={form.role} onChange={e => setForm({...form, role: e.target.value as UserRole})}>
                          <option value="teacher">Teacher</option>
                          <option value="administrator">Admin</option>
                          <option value="accountant">Accountant</option>
                       </select>
                    </div>
                    {form.role === 'teacher' && (
                       <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Specialization</label>
                          <input className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0" placeholder="e.g. Science" value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})} />
                       </div>
                    )}
                 </div>
                 <div className="pt-4 flex gap-4">
                    <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">
                      {isEditing ? 'Save Changes' : 'Enroll Staff'}
                    </button>
                    <button type="button" onClick={() => setShowEnrolModal(false)} className="px-8 py-4 bg-slate-100 rounded-2xl font-bold uppercase tracking-widest">Cancel</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Improved Delete Confirmation Modal */}
      {showDeleteModal && memberToManage && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-10 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 text-center animate-in zoom-in-95">
              <div className="text-6xl mb-6 animate-bounce">⚠️</div>
              <h3 className="text-2xl font-black mb-2">Confirm Deletion</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
                Are you sure you want to delete <strong>{memberToManage.firstName} {memberToManage.lastName}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                 <button onClick={executeDelete} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-rose-200">Delete</button>
                 <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-bold uppercase tracking-widest">Cancel</button>
              </div>
           </div>
        </div>
      )}

      {/* sophisticated Password Reset Modal */}
      {showPasswordModal && memberToManage && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
              <div className="flex items-center gap-4 mb-8 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                 <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-2xl">👤</div>
                 <div>
                    <p className="text-sm font-black dark:text-white">{memberToManage.firstName} {memberToManage.lastName}</p>
                    <p className="text-[10px] text-indigo-600 font-bold uppercase">{memberToManage.email}</p>
                 </div>
              </div>

              <div className="space-y-4 mb-8">
                 <div 
                   onClick={() => setPwdMode('auto')}
                   className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${pwdMode === 'auto' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-800 bg-slate-50/50'}`}
                 >
                    <div className="flex justify-between items-center mb-1">
                       <p className="text-sm font-black dark:text-white">Auto-Generate Password</p>
                       <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${pwdMode === 'auto' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                          {pwdMode === 'auto' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                       </div>
                    </div>
                    <p className="text-xs text-slate-500">System will create a secure random key.</p>
                 </div>

                 <div 
                   onClick={() => setPwdMode('manual')}
                   className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${pwdMode === 'manual' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-800 bg-slate-50/50'}`}
                 >
                    <div className="flex justify-between items-center mb-1">
                       <p className="text-sm font-black dark:text-white">Set Manual Password</p>
                       <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${pwdMode === 'manual' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                          {pwdMode === 'manual' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                       </div>
                    </div>
                    <p className="text-xs text-slate-500">Define a custom entry credential.</p>

                    {pwdMode === 'manual' && (
                       <div className="mt-6 space-y-4 animate-in slide-in-from-top-2">
                          <div className="relative">
                             <input 
                               type={showPwd ? 'text' : 'password'}
                               className="w-full p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-medium"
                               placeholder="New password (8+ chars)"
                               value={manualPwd}
                               onChange={e => setManualPwd(e.target.value)}
                             />
                             <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-lg">
                                {showPwd ? '👁️' : '🙈'}
                             </button>
                          </div>
                          <input 
                             type="password"
                             className="w-full p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-medium"
                             placeholder="Confirm password"
                             value={confirmPwd}
                             onChange={e => setConfirmPwd(e.target.value)}
                          />
                          
                          <div className="space-y-1">
                             <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                                <span>Security Level</span>
                                <span className="text-indigo-600">{getPasswordStrength(manualPwd).label}</span>
                             </div>
                             <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-500 ${getPasswordStrength(manualPwd).color}`}
                                  style={{ width: getPasswordStrength(manualPwd).width }}
                                ></div>
                             </div>
                          </div>
                       </div>
                    )}
                 </div>
              </div>

              <div className="flex gap-3">
                 <button onClick={executePasswordReset} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Update Password</button>
                 <button onClick={() => { setShowPasswordModal(false); setManualPwd(''); setConfirmPwd(''); }} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-bold uppercase tracking-widest">Discard</button>
              </div>
           </div>
        </div>
      )}

      {/* Credentials Result Modal */}
      {newCreds && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 max-w-sm w-full shadow-2xl text-center border-4 border-emerald-500/20 animate-in zoom-in-95">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">🎉</div>
              <h3 className="text-2xl font-black mb-2">Access Updated</h3>
              <p className="text-slate-500 mb-8 text-sm">Security clearance finalized. Copy these credentials for the personnel.</p>
              
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl text-left space-y-4 mb-8 border border-slate-100 dark:border-slate-700">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Work Email</p>
                    <p className="font-bold text-slate-900 dark:text-white truncate">{newCreds.email}</p>
                 </div>
                 <div className="relative group">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">New Password</p>
                    <p className="font-mono text-xl font-black text-indigo-600 select-all">{newCreds.password}</p>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(newCreds.password); alert('Password copied!'); }}
                      className="absolute right-0 top-0 text-xs font-bold text-indigo-600 hover:underline"
                    >
                      Copy
                    </button>
                 </div>
              </div>
              
              <button onClick={() => setNewCreds(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all">Done & Secured</button>
           </div>
        </div>
      )}
    </div>
  );
};