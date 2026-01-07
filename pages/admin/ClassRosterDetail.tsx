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
        const res = result as any;
        if (res.credentials) setCredentials(res.credentials);
        else setAlert({ type: 'success', message: 'Updated.' });
      } else {
        const result = await adminService.addStudent(
          { admissionNumber: form.admissionNumber, classId: classId, status: 'active' },
          { firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password }
        );
        setCredentials(result.credentials);
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message });
      setLoading(false);
    }
  };

  const filtered = students.filter(s => 
    `${s.user?.firstName} ${s.user?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.admissionNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !classInfo) return <div className="p-20 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/classes')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">←</button>
          <div>
            <h1 className="text-2xl font-black">{classInfo?.name}</h1>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">{students.length} Enrollments</p>
          </div>
        </div>
        <button onClick={() => { setIsEditing(false); setShowModal(true); }} className="btn btn-primary">➕ Enroll Student</button>
      </header>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="card">
        <div className="p-4 border-b">
          <input 
            type="text" 
            placeholder="Search class roster..." 
            className="w-full px-4 py-2 bg-gray-50 rounded-lg border focus:ring-2 focus:ring-indigo-600 outline-none"
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Identity</th>
                <th>Admission</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">{s.user?.firstName[0]}</div>
                    <span className="font-bold">{s.user?.firstName} {s.user?.lastName}</span>
                  </td>
                  <td className="font-mono text-xs">{s.admissionNumber}</td>
                  <td className="text-right">
                    <button onClick={() => { setEditingId(s.id); setIsEditing(true); setForm({firstName: s.user?.firstName, lastName: s.user?.lastName, email: s.user?.email, admissionNumber: s.admissionNumber, password: ''}); setShowModal(true); }} className="text-indigo-600 text-xs font-bold mr-4">Edit</button>
                    <button onClick={() => adminService.deleteStudent(s.id).then(fetchData)} className="text-rose-600 text-xs font-bold">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-xl max-w-2xl w-full">
             <h2 className="text-xl font-bold mb-6">{isEditing ? 'Edit Profile' : 'Enroll Student'}</h2>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <input required placeholder="First Name" className="w-full p-2 border rounded" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                   <input required placeholder="Last Name" className="w-full p-2 border rounded" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                </div>
                <input required type="email" placeholder="Email" className="w-full p-2 border rounded" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                <input required placeholder="Admission No" className="w-full p-2 border rounded" value={form.admissionNumber} onChange={e => setForm({...form, admissionNumber: e.target.value})} />
                <div className="flex gap-4 pt-4">
                   <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded font-bold">Save</button>
                   <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 bg-gray-100 rounded font-bold">Cancel</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};