import React, { useState, useEffect } from 'react';
import { teacherService } from '../../services/teacherService';
import { attendanceService } from '../../services/attendanceService';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/UI/Spinner';
import { Alert } from '../../components/UI/Alert';
import { AttendanceStatus, AttendanceRecord } from '../../types';

export const AttendanceMarker: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      teacherService.getAssignedClasses(user.id).then(data => {
        setClasses(data);
        if (data.length > 0) setSelectedClassId(data[0].classId);
        setLoading(false);
      });
    }
  }, [user]);

  useEffect(() => {
    if (selectedClassId) {
      setLoading(true);
      Promise.all([
        teacherService.getClassRoster(selectedClassId),
        attendanceService.getAttendanceForClass(selectedClassId, date)
      ]).then(([roster, existing]) => {
        setStudents(roster);
        const attMap: Record<string, AttendanceStatus> = {};
        roster.forEach(s => {
          const rec = existing.find(e => e.studentId === s.id);
          attMap[s.id] = rec ? rec.status : 'present';
        });
        setAttendance(attMap);
        setLoading(false);
      });
    }
  }, [selectedClassId, date]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const newMap: Record<string, AttendanceStatus> = {};
    students.forEach(s => newMap[s.id] = status);
    setAttendance(newMap);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const records: Partial<AttendanceRecord>[] = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        classId: selectedClassId,
        date,
        status: status as AttendanceStatus,
        markedBy: user.id
      }));
      await attendanceService.markAttendance(records);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert("Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && classes.length === 0) return <div className="p-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8">
      <header className="page-header flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="page-title">Attendance Register</h1>
          <p className="page-subtitle">Track presence for institutional records</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <input 
            type="date"
            className="px-5 py-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-indigo-600 text-sm font-semibold shadow-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <select 
            className="px-5 py-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-indigo-600 text-sm font-semibold shadow-sm"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            {classes.map(c => <option key={c.id} value={c.classId}>{c.class?.name || 'Class'}</option>)}
          </select>
        </div>
      </header>

      {success && <Alert type="success" message="Register finalized and stored in Cloud Registry." />}

      <div className="card relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-6 border-b border-gray-100 dark:border-gray-800 pb-8">
           <div className="flex gap-3 w-full sm:w-auto">
              <button 
                onClick={() => handleMarkAll('present')}
                className="btn btn-secondary text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              >
                Mark All Present
              </button>
           </div>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{students.length} ENROLLMENTS ACTIVE</p>
        </div>

        <div className="space-y-4">
          {students.map(student => (
            <div key={student.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-6 bg-gray-50 dark:bg-gray-800/40 rounded-2xl gap-6 group transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30">
               <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-lg uppercase shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    {student.user.firstName[0]}
                  </div>
                  <div>
                    <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">{student.user.firstName} {student.user.lastName}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">{student.admissionNumber}</p>
                  </div>
               </div>

               <div className="flex flex-wrap gap-2 bg-white dark:bg-gray-900 p-1.5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 w-full lg:w-auto">
                  {(['present', 'late', 'absent', 'excused'] as AttendanceStatus[]).map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(student.id, status)}
                      className={`flex-1 lg:flex-none px-6 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                        attendance[student.id] === status
                          ? status === 'present' ? 'bg-emerald-600 text-white shadow-md' :
                            status === 'absent' ? 'bg-rose-600 text-white shadow-md' :
                            status === 'late' ? 'bg-amber-500 text-white shadow-md' : 'bg-sky-600 text-white shadow-md'
                          : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
               </div>
            </div>
          ))}
          {students.length === 0 && !loading && (
            <div className="py-20 text-center">
              <div className="text-6xl opacity-10 grayscale mb-6">👥</div>
              <h3 className="text-xl font-bold text-gray-400 uppercase tracking-widest">No Class Records</h3>
              <p className="text-sm text-gray-500 italic mt-2">Enrollments will appear once finalized in the Admin Hub.</p>
            </div>
          )}
        </div>

        <div className="mt-12 pt-10 border-t border-gray-100 dark:border-gray-800">
           <button 
            onClick={handleSave}
            disabled={saving || students.length === 0}
            className="w-full btn btn-primary py-5 text-xl font-bold rounded-2xl shadow-xl active:scale-95 disabled:opacity-50"
           >
            {saving ? <Spinner size="sm" /> : (
              <div className="flex items-center gap-4">
                <span>💾 Finalize Register</span>
                <span className="text-[10px] opacity-40">|</span>
                <span className="text-[10px] uppercase font-bold tracking-widest">{date}</span>
              </div>
            )}
           </button>
        </div>
      </div>
    </div>
  );
};