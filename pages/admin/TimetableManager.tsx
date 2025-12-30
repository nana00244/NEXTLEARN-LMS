
import React, { useState, useEffect } from 'react';
import { scheduleService } from '../../services/scheduleService';
import { adminService } from '../../services/adminService';
import { getStoredSubjects, getStoredTeachers, getStoredUsers } from '../../services/mockDb';
import { Spinner } from '../../components/UI/Spinner';
import { Period, TimetableSlot } from '../../types';

export const TimetableManager: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [periods, setPeriods] = useState<Period[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom Delete Confirm State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<string | null>(null);

  const [form, setForm] = useState({
    subjectId: '',
    teacherId: '',
    dayOfWeek: 1,
    periodId: '',
    room: ''
  });

  const fetchData = async () => {
    const [cData, pData, subData, tData, uData] = await Promise.all([
      adminService.getClasses(),
      scheduleService.getPeriods(),
      getStoredSubjects(),
      getStoredTeachers(),
      getStoredUsers()
    ]);
    
    setClasses(cData);
    if (cData.length > 0 && !selectedClassId) setSelectedClassId(cData[0].id);
    setPeriods(pData);
    setSubjects(subData);
    setTeachers(tData.map(t => ({
      ...t,
      name: uData.find(u => u.id === t.userId)?.firstName + ' ' + uData.find(u => u.id === t.userId)?.lastName
    })));
    setLoading(false);
  };

  const fetchSlots = async () => {
    if (selectedClassId) {
      const sData = await scheduleService.getTimetableForClass(selectedClassId);
      setSlots(sData);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchSlots(); }, [selectedClassId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await scheduleService.addSlot({ ...form, classId: selectedClassId });
      setShowAdd(false);
      fetchSlots();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const triggerDelete = (id: string) => {
    setSlotToDelete(id);
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    if (slotToDelete) {
      await scheduleService.deleteSlot(slotToDelete);
      setShowDeleteConfirm(false);
      setSlotToDelete(null);
      fetchSlots();
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  if (loading) return <div className="p-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Timetable Builder</h1>
          <p className="text-slate-500">Coordinate classes, subjects, and teacher availability</p>
        </div>
        <div className="flex gap-3">
          <select 
            className="px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 text-sm font-bold"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button 
            onClick={() => setShowAdd(true)}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all"
          >
            + Add Schedule Slot
          </button>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-r border-slate-100 dark:border-slate-800 min-w-[120px]">Period</th>
              {days.map((day, i) => (
                <th key={day} className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center min-w-[180px] border-r border-slate-100 dark:border-slate-800">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {periods.map(period => (
              <tr key={period.id}>
                <td className="p-6 text-center border-r border-slate-100 dark:border-slate-800">
                   <p className="text-sm font-black text-slate-900 dark:text-white">P{period.periodNumber}</p>
                   <p className="text-[10px] text-slate-400 font-bold">{period.startTime} - {period.endTime}</p>
                </td>
                {[1, 2, 3, 4, 5].map(dayNum => {
                  const slot = slots.find(s => s.dayOfWeek === dayNum && s.periodId === period.id);
                  return (
                    <td key={dayNum} className="p-4 border-r border-slate-100 dark:border-slate-800 align-top">
                      {slot ? (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl relative group">
                           <button 
                            onClick={() => triggerDelete(slot.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs shadow-md"
                           >×</button>
                           <p className="text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-1 truncate">{slot.subject?.name}</p>
                           <p className="text-[10px] font-bold text-slate-500 truncate">{slot.teacherName}</p>
                           <p className="text-[10px] text-slate-400 mt-2 font-mono">{slot.room}</p>
                        </div>
                      ) : (
                        <div className="h-12 border-2 border-dashed border-slate-50 dark:border-slate-800/50 rounded-2xl"></div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-2xl max-w-sm w-full border border-slate-100 dark:border-slate-800">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">Confirm Removal</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">Are you sure you want to remove this schedule entry? This will free up the room and instructor for this period.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => { setShowDeleteConfirm(false); setSlotToDelete(null); }}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-2xl font-black shadow-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">New Schedule Entry</h2>
              {error && <div className="mb-4 text-xs font-bold text-rose-500 p-3 bg-rose-50 rounded-xl">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Subject</label>
                    <select className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white text-sm" value={form.subjectId} onChange={e => setForm({...form, subjectId: e.target.value})} required>
                        <option value="">Select Subject</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Teacher</label>
                    <select className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white text-sm" value={form.teacherId} onChange={e => setForm({...form, teacherId: e.target.value})} required>
                        <option value="">Select Teacher</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Day</label>
                        <select className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white text-sm" value={form.dayOfWeek} onChange={e => setForm({...form, dayOfWeek: parseInt(e.target.value)})}>
                            {days.map((d, i) => <option key={d} value={i+1}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Period</label>
                        <select className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white text-sm" value={form.periodId} onChange={e => setForm({...form, periodId: e.target.value})} required>
                            <option value="">Select Period</option>
                            {periods.map(p => <option key={p.id} value={p.id}>Period {p.periodNumber}</option>)}
                        </select>
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Room / Venue</label>
                    <input className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white text-sm" placeholder="e.g. Science Lab" value={form.room} onChange={e => setForm({...form, room: e.target.value})} required />
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl">Assign Slot</button>
                    <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold">Cancel</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
