
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { scheduleService } from '../../services/scheduleService';
import { getStoredStudents } from '../../services/mockDb';
import { Spinner } from '../../components/UI/Spinner';

export const StudentSchedule: React.FC = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const student = getStoredStudents().find(s => s.userId === user.id);
      if (student) {
        Promise.all([
          scheduleService.getTimetableForClass(student.classId),
          scheduleService.getPeriods()
        ]).then(([sData, pData]) => {
          setSlots(sData);
          setPeriods(pData);
          setLoading(false);
        });
      }
    }
  }, [user]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  if (loading) return <div className="p-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Class Timetable</h1>
        <p className="text-slate-500">View your weekly academic schedule and room assignments</p>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-r border-slate-100 dark:border-slate-800 min-w-[120px]">Period</th>
              {days.map((day) => (
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
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl group hover:shadow-lg transition-all">
                           <p className="text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-1">{slot.subject?.name}</p>
                           <p className="text-[10px] font-bold text-slate-500">{slot.teacherName}</p>
                           <p className="text-[10px] text-slate-400 mt-2 font-mono">{slot.room}</p>
                        </div>
                      ) : (
                        <div className="h-12"></div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-8 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-100 dark:shadow-none flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-black">Ready to print?</h3>
          <p className="text-indigo-100 text-sm">Download your official timetable as a PDF for offline reference.</p>
        </div>
        <button className="px-8 py-3 bg-white text-indigo-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all">
          Generate PDF
        </button>
      </div>
    </div>
  );
};
