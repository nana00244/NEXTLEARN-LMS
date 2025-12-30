
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { Spinner } from '../../components/UI/Spinner';
import { Alert } from '../../components/UI/Alert';
import { Class } from '../../types';

export const ClassRosterDetail: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState<any>(null);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<any>(null);
  const [alert, setAlert] = useState<{type: 'success' | 'error' | 'warning', message: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    admissionNumber: '',
    password: ''
  });

  const fetchData = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const [cData, sData, allC] = await Promise.all([
        adminService.getClassById(classId),
        adminService.getStudentsByClass(classId),
        adminService.getClasses()
      ]);
      setClassInfo(cData);
      setStudents(sData);
      setAllClasses(allC);
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to fetch roster data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [classId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing && editingId) {
        const result = await adminService.updateStudent(
          editingId,
          { admissionNumber: form.admissionNumber, classId: classId, status: 'active' },
          { firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password }
        );
        if (result.credentials) {
          setCredentials(result.credentials);
        } else {
          setAlert({ type: 'success', message: 'Student profile updated.' });
        }
      } else {
        const result = await adminService.addStudent(
          { admissionNumber: form.admissionNumber, classId: classId, status: 'active' },
          { firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password }
        );
        setCredentials(result.credentials);
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Operation failed.' });
      setLoading(false);
    }
  };

  const handleEditClick = (student: any) => {
    setEditingId(student.id);
    setIsEditing(true);
    setForm({
      firstName: student.user?.firstName || '',
      lastName: student.user?.lastName || '',
      email: student.user?.email || '',
      admissionNumber: student.admissionNumber || '',
      password: ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      admissionNumber: 'SN' + Math.floor(1000 + Math.random() * 9000),
      password: ''
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleMoveStudent = async (studentId: string, newClassId: string) => {
    if (!newClassId) return;
    setLoading(true);
    await adminService.moveStudentToClass(studentId, newClassId);
    setAlert({ type: 'success', message: 'Student moved successfully.' });
    fetchData();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !classId) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      setLoading(true);
      const text = (event.target?.result as string) || '';
      const lines = text.split('\n').map(l => l.trim()).filter(line => line.length > 0);
      
      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length < 3) continue;
        try {
          await adminService.addStudent(
            { admissionNumber: parts[3] || '', classId: classId, status: 'active' },
            { firstName: parts[0], lastName: parts[1], email: parts[2] }
          );
          count++;
        } catch (err) {}
      }
      setAlert({ type: 'success', message: `Bulk import complete: ${count} students added to class.` });
      fetchData();
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredStudents = students.filter(s => 
    `${s.user?.firstName} ${s.user?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.admissionNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !classInfo) return <div className="p-20 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate('/admin/classes')} className="p-3 bg-white dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm hover:scale-110 transition-transform">←</button>
           <div>
             <h1 className="text-3xl font-black text-slate-900 dark:text-white">{classInfo?.name} Roster</h1>
             <p className="text-slate-500 uppercase text-[10px] font-black tracking-widest">Section {classInfo?.section} • {students.length} Total Enrolled</p>
           </div>
        </div>
        <div className="flex gap-3">
           <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleImport} />
           <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 transition-all flex items-center gap-2">📥 CSV Import</button>
           <button onClick={() => { resetForm(); setShowModal(true); }} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2">➕ Enroll Student</button>
        </div>
      </header>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800">
           <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input type="text" placeholder="Search class roster..." className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 text-sm font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Info</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Admission No.</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Move Class</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-black text-sm uppercase">{student.user?.firstName?.[0]}{student.user?.lastName?.[0]}</div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{student.user?.firstName} {student.user?.lastName}</p>
                        <p className="text-xs text-slate-400 font-medium">{student.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-mono font-bold text-slate-600 dark:text-slate-400">{student.admissionNumber}</td>
                  <td className="px-8 py-5">
                     <select className="text-xs bg-slate-100 dark:bg-slate-800 border-0 rounded-lg px-3 py-1.5 font-bold text-slate-600 outline-none" onChange={(e) => handleMoveStudent(student.id, e.target.value)} value={classId}>
                        {allClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEditClick(student)} className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all">✏️</button>
                      <button onClick={() => adminService.deleteStudent(student.id).then(fetchData)} className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl animate-in zoom-in-95">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-8">{isEditing ? 'Modify Enrollee' : 'Direct Class Enrollment'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">First Name</label>
                  <input required className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 font-bold" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Last Name</label>
                  <input required className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 font-bold" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email Address</label>
                  <input required type="email" className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 font-bold" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Admission Code</label>
                  <input required className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 font-black font-mono" value={form.admissionNumber} onChange={e => setForm({...form, admissionNumber: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Set Password</label>
                  <input placeholder={isEditing ? "Leave blank to keep existing" : "Leave blank to auto-gen"} className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 font-bold" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4 pt-8">
                <button type="submit" className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl transition-all">{isEditing ? 'Update Record' : 'Complete Enrollment'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-10 py-5 bg-slate-100 rounded-3xl font-black uppercase tracking-widest">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credential Reveal Modal */}
      {credentials && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 max-w-sm w-full shadow-2xl text-center">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 animate-bounce">🎓</div>
              <h2 className="text-3xl font-black mb-2">Student Credentials</h2>
              <p className="text-slate-500 mb-10">Share these login details with the student immediately.</p>
              <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-[2rem] text-left space-y-6 mb-10 border border-slate-100 dark:border-slate-700">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Username / Email</p>
                    <p className="font-bold text-slate-900 dark:text-white break-all">{credentials.email}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Temporary Password</p>
                    <p className="font-mono text-2xl font-black text-indigo-600">{credentials.password}</p>
                 </div>
              </div>
              <button onClick={() => setCredentials(null)} className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest">Close Record</button>
           </div>
        </div>
      )}
    </div>
  );
};
