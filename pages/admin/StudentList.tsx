
import React, { useState, useEffect, useRef } from 'react';
import { adminService } from '../../services/adminService';
import { Spinner } from '../../components/UI/Spinner';
import { Alert } from '../../components/UI/Alert';
import { Class } from '../../types';

export const StudentList: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{type: 'success' | 'error' | 'warning' | 'info', message: string} | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom Confirm Dialog State
  const [confirmDelete, setConfirmDelete] = useState<{
    show: boolean;
    type: 'single' | 'bulk';
    id?: string;
  }>({ show: false, type: 'single' });

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sData, cData] = await Promise.all([
        adminService.getStudents(),
        adminService.getClasses()
      ]);
      setStudents([...(sData || [])]);
      setClasses(cData || []);
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to synchronize with roster database.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map(s => s.id));
    }
  };

  // Trigger Confirmation
  const openDeleteConfirm = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDelete({ show: true, type: 'single', id });
  };

  const openBulkDeleteConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedIds.length > 0) {
      setConfirmDelete({ show: true, type: 'bulk' });
    }
  };

  // Execution Logic for Deletions
  const executeDelete = async () => {
    const { type, id } = confirmDelete;
    setConfirmDelete({ show: false, type: 'single' });
    setLoading(true);

    try {
      if (type === 'single' && id) {
        await adminService.deleteStudent(id);
        setAlert({ type: 'success', message: 'Student record and associated account removed.' });
        setSelectedIds(prev => prev.filter(i => i !== id));
      } else if (type === 'bulk') {
        const idsToKill = [...selectedIds];
        const count = idsToKill.length;
        setSelectedIds([]); 
        await adminService.deleteStudentsBulk(idsToKill);
        setAlert({ type: 'success', message: `Batch deletion successful: ${count} records removed.` });
      }
      await fetchData();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Operation failed. Please try again.' });
      setLoading(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent, student: any) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(student.id);
    setIsEditing(true);
    setForm({
      firstName: student.user?.firstName || '',
      lastName: student.user?.lastName || '',
      email: student.user?.email || '',
      admissionNumber: student.admissionNumber || '',
      classId: student.classId || '',
      status: student.status || 'active',
      password: '' // Don't show existing password
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      admissionNumber: 'SN' + Math.floor(1000 + Math.random() * 9000),
      classId: classes.length > 0 ? classes[0].id : '',
      status: 'active',
      password: ''
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing && editingId) {
        const result = await adminService.updateStudent(
          editingId,
          { admissionNumber: form.admissionNumber, classId: form.classId, status: form.status },
          { firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password }
        );
        if (result.credentials) {
          setCredentials(result.credentials);
        } else {
          setAlert({ type: 'success', message: 'Student profile updated successfully.' });
        }
      } else {
        const result = await adminService.addStudent(
          { admissionNumber: form.admissionNumber, classId: form.classId, status: form.status },
          { firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password }
        );
        setCredentials(result.credentials);
      }
      setShowModal(false);
      resetForm();
      await fetchData();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Operation failed.' });
      setLoading(false);
    }
  };

  const cleanName = (name: string) => {
    if (!name) return '';
    return name
      .trim()
      .split(/\s+/)
      .filter(part => part.length > 0)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  };

  const parseCsvLine = (line: string) => {
    const result = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      setLoading(true);
      const text = (event.target?.result as string) || '';
      const cleanText = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const lines = cleanText.split('\n').map(l => l.trim()).filter(line => line.length > 0);
      
      if (lines.length === 0) {
        setAlert({ type: 'error', message: 'Selected CSV file is empty.' });
        setLoading(false);
        return;
      }

      let importCount = 0;
      let errorCount = 0;
      
      const firstLineParts = parseCsvLine(lines[0]);
      const headers = firstLineParts.map(h => h.toLowerCase());
      
      const colIdx = {
        firstName: headers.findIndex(h => h.includes('first') || h === 'fname' || h === 'given'),
        lastName: headers.findIndex(h => h.includes('last') || h === 'lname' || h === 'surname' || h === 'family'),
        fullName: headers.findIndex(h => h === 'name' || h === 'student name' || h === 'full name' || h === 'student'),
        email: headers.findIndex(h => h.includes('email') || h === 'mail'),
        id: headers.findIndex(h => h.includes('id') || h.includes('admission') || h.includes('code') || h === 'no'),
        class: headers.findIndex(h => h.includes('class') || h.includes('grade') || h === 'room')
      };

      const hasAnyHeader = Object.values(colIdx).some(idx => idx !== -1);
      const startIndex = hasAnyHeader ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const parts = parseCsvLine(lines[i]);
        if (parts.length < 1 || parts.every(p => p === '')) continue;

        try {
          let fName = '';
          let lName = '';
          let email = '';
          let adNo = '';
          let clsId = classes[0]?.id || '';

          if (hasAnyHeader) {
            if (colIdx.firstName !== -1) fName = parts[colIdx.firstName] || '';
            if (colIdx.lastName !== -1) lName = parts[colIdx.lastName] || '';
            if (!fName && colIdx.fullName !== -1 && parts[colIdx.fullName]) {
              const full = parts[colIdx.fullName];
              const nameParts = full.trim().split(/\s+/);
              fName = nameParts[0] || '';
              lName = nameParts.slice(1).join(' ') || '';
            }
            if (colIdx.email !== -1) email = parts[colIdx.email] || '';
            if (colIdx.id !== -1) adNo = parts[colIdx.id] || '';
            if (colIdx.class !== -1 && parts[colIdx.class]) {
              const csvCls = parts[colIdx.class].toLowerCase();
              const matchedClass = classes.find(c => c.name.toLowerCase() === csvCls || c.id.toLowerCase() === csvCls);
              if (matchedClass) clsId = matchedClass.id;
            }
          } else {
            fName = parts[0] || '';
            lName = parts[1] || '';
            email = parts[2] || '';
            adNo = parts[3] || '';
          }

          fName = cleanName(fName);
          lName = cleanName(lName) || 'Student';
          email = email.toLowerCase().trim();
          adNo = adNo.trim().toUpperCase() || 'SN' + Math.floor(1000 + Math.random() * 9000);

          if (!email) throw new Error(`Email is required for enrollment (Row ${i + 1})`);

          await adminService.addStudent(
            { admissionNumber: adNo, classId: clsId, status: 'active' },
            { firstName: fName, lastName: lName, email: email }
          );
          importCount++;
        } catch (err: any) {
          errorCount++;
        }
      }

      setAlert({ 
        type: errorCount > importCount ? 'error' : (errorCount > 0 ? 'warning' : 'success'), 
        message: `Import complete: ${importCount} students added. ${errorCount > 0 ? errorCount + ' records skipped.' : ''}` 
      });
      await fetchData();
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredStudents = students.filter(s => 
    `${s.user?.firstName} ${s.user?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.admissionNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Student Roster</h1>
          <p className="text-slate-500">Manage institutional enrollments and academic records</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleImport} />
           <button className="px-6 py-3 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2" onClick={() => fileInputRef.current?.click()}>📥 Import CSV</button>
           <button onClick={() => { resetForm(); setShowModal(true); }} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2">➕ Enroll Student</button>
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm min-h-[400px] relative">
        {selectedIds.length > 0 && (
          <div className="bg-indigo-600 p-4 flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
             <p className="text-white font-bold text-sm">
                <span className="bg-white text-indigo-600 w-6 h-6 inline-flex items-center justify-center rounded-full mr-2">{selectedIds.length}</span>
                Students Selected
             </p>
             <div className="flex gap-2">
                <button type="button" onClick={openBulkDeleteConfirm} className="px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-600 transition-all">🗑️ Delete Selected</button>
                <button type="button" onClick={() => setSelectedIds([])} className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-xs font-bold hover:bg-indigo-400">Cancel</button>
             </div>
          </div>
        )}

        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
             <input type="text" placeholder="Search roster..." className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-8 py-5 w-12"><input type="checkbox" className="w-5 h-5 rounded border-slate-200 text-indigo-600 cursor-pointer" checked={selectedIds.length === filteredStudents.length && filteredStudents.length > 0} onChange={handleSelectAll} /></th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Info</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Class</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map(student => (
                <tr key={student.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group ${selectedIds.includes(student.id) ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                  <td className="px-8 py-5"><input type="checkbox" className="w-5 h-5 rounded border-slate-200 text-indigo-600 cursor-pointer" checked={selectedIds.includes(student.id)} onChange={() => handleSelectOne(student.id)} /></td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-black text-sm uppercase">{student.user?.firstName?.[0]}{student.user?.lastName?.[0]}</div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{student.user?.firstName} {student.user?.lastName}</p>
                        <p className="text-xs text-slate-400 font-medium">{student.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center"><span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] font-black uppercase">{student.class?.name || 'Unassigned'}</span></td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={(e) => handleEditClick(e, student)} className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm">✏️</button>
                      <button onClick={(e) => openDeleteConfirm(e, student.id)} className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmDelete.show && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <h3 className="text-2xl font-black mb-2">Confirm Delete</h3>
            <p className="text-slate-500 mb-8">This action permanently removes student data and user account access.</p>
            <div className="flex gap-4">
              <button onClick={executeDelete} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase hover:bg-rose-700">Delete</button>
              <button onClick={() => setConfirmDelete({ ...confirmDelete, show: false })} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-8">{isEditing ? 'Update Profile' : 'Enroll Student'}</h2>
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
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email (Username)</label>
                  <input required type="email" className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 font-bold" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Admission Code</label>
                  <input required className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 font-black font-mono" value={form.admissionNumber} onChange={e => setForm({...form, admissionNumber: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Class Assignment</label>
                  <select required className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 font-black" value={form.classId} onChange={e => setForm({...form, classId: e.target.value})}>
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Set Password</label>
                  <input placeholder={isEditing ? "Leave blank to keep existing" : "Leave blank to auto-generate"} className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 font-bold" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl">{isEditing ? 'Save Changes' : 'Enroll Student'}</button>
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
              <h2 className="text-3xl font-black mb-2">Credentials Ready!</h2>
              <p className="text-slate-500 mb-10">Ensure the student receives these details to access NextLearn.</p>
              <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-[2rem] text-left space-y-6 mb-10 border border-slate-100 dark:border-slate-700">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Login Email</p>
                    <p className="font-bold text-slate-900 dark:text-white break-all">{credentials.email}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Password</p>
                    <p className="font-mono text-2xl font-black text-indigo-600">{credentials.password}</p>
                 </div>
              </div>
              <button onClick={() => setCredentials(null)} className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest">Done</button>
           </div>
        </div>
      )}
    </div>
  );
};
