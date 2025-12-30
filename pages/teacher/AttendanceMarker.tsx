
import React, { useState, useEffect } from 'react';
import { teacherService } from '../../services/teacherService';
import { attendanceService } from '../../services/attendanceService';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/UI/Spinner';
import { Alert } from '../../components/UI/Alert';
// Fix: Added AttendanceRecord to imports
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
      // Fix: Explicitly typing the records array and casting status to AttendanceStatus 
      // to resolve 'unknown' type inference from Object.entries
      const records: Partial<AttendanceRecord>[] = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        classId: selectedClassId,
        date,
        status: status as AttendanceStatus,
        markedBy: user.id
      }));
      await attendanceService.markAttendance(records);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert("Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && classes.length === 0) return <div className="p-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Attendance Register</h1>
          <p className="text-slate-500">Track student presence for today's sessions</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="date"
            className="px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <select 
            className="px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            {classes.map(c => <option key={c.id} value={c.classId}>{c.class.name}</option>)}
          </select>
        </div>
      </header>

      {success && <Alert type="success" message="Attendance successfully updated!" />}

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-center mb-8">
           <div className="flex gap-2">
              <button 
                onClick={() => handleMarkAll('present')}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-100 transition-colors"
              >
                Mark All Present
              </button>
           </div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{students.length} Students Enrolled</p>
        </div>

        <div className="space-y-4">
          {students.map(student => (
            <div key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl gap-4 group hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold">
                    {student.user.firstName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{student.user.firstName} {student.user.lastName}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{student.admissionNumber}</p>
                  </div>
               </div>

               <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  {(['present', 'late', 'absent', 'excused'] as AttendanceStatus[]).map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(student.id, status)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                        attendance[student.id] === status
                          ? status === 'present' ? 'bg-emerald-600 text-white' :
                            status === 'absent' ? 'bg-rose-600 text-white' :
                            status === 'late' ? 'bg-amber-500 text-white' : 'bg-sky-600 text-white'
                          : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
               </div>
            </div>
          ))}
          {students.length === 0 && (
            <div className="py-20 text-center text-slate-500 italic">No students assigned to this class.</div>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
           <button 
            onClick={handleSave}
            disabled={saving || students.length === 0}
            className="w-full sm:w-auto px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-none disabled:opacity-50"
           >
            {saving ? <Spinner size="sm" /> : 'Confirm Register'}
           </button>
        </div>
      </div>
    </div>
  );
};
