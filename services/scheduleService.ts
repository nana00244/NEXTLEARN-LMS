
import { STORAGE_KEYS } from '../constants';
import { TimetableSlot, Period, Class, Subject, Teacher } from '../types';

const getTable = <T>(key: string): T[] => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

const saveTable = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const scheduleService = {
  getPeriods: async () => getTable<Period>(STORAGE_KEYS.MOCK_DB_PERIODS),

  getTimetableForClass: async (classId: string) => {
    const slots = getTable<TimetableSlot>(STORAGE_KEYS.MOCK_DB_SCHEDULE).filter(s => s.classId === classId);
    const subjects = getTable<Subject>(STORAGE_KEYS.MOCK_DB_SUBJECTS);
    const teachers = getTable<any>(STORAGE_KEYS.MOCK_DB_TEACHERS);
    const users = getTable<any>(STORAGE_KEYS.MOCK_DB_USERS);
    const periods = getTable<Period>(STORAGE_KEYS.MOCK_DB_PERIODS);

    return slots.map(slot => {
      const teacher = teachers.find((t: any) => t.id === slot.teacherId);
      const teacherUser = users.find((u: any) => u.id === teacher?.userId);
      return {
        ...slot,
        subject: subjects.find(s => s.id === slot.subjectId),
        period: periods.find(p => p.id === slot.periodId),
        teacherName: teacherUser ? `${teacherUser.firstName} ${teacherUser.lastName}` : 'Unknown'
      };
    });
  },

  getTimetableForTeacher: async (teacherId: string) => {
    const slots = getTable<TimetableSlot>(STORAGE_KEYS.MOCK_DB_SCHEDULE).filter(s => s.teacherId === teacherId);
    const subjects = getTable<Subject>(STORAGE_KEYS.MOCK_DB_SUBJECTS);
    const periods = getTable<Period>(STORAGE_KEYS.MOCK_DB_PERIODS);
    const classes = getTable<Class>(STORAGE_KEYS.MOCK_DB_CLASSES);

    return slots.map(slot => ({
      ...slot,
      subject: subjects.find(s => s.id === slot.subjectId),
      period: periods.find(p => p.id === slot.periodId),
      className: classes.find(c => c.id === slot.classId)?.name || 'Unknown'
    }));
  },

  addSlot: async (slot: Partial<TimetableSlot>) => {
    const slots = getTable<TimetableSlot>(STORAGE_KEYS.MOCK_DB_SCHEDULE);
    
    // Conflict Detection
    const hasConflict = slots.some(s => 
      s.dayOfWeek === slot.dayOfWeek && 
      s.periodId === slot.periodId && 
      (s.teacherId === slot.teacherId || s.room === slot.room || s.classId === slot.classId)
    );

    if (hasConflict) {
      throw new Error("Timetable conflict detected: Teacher, Room, or Class is already booked for this time.");
    }

    const newSlot = { ...slot, id: Math.random().toString(36).substr(2, 9) } as TimetableSlot;
    saveTable(STORAGE_KEYS.MOCK_DB_SCHEDULE, [...slots, newSlot]);
    return newSlot;
  },

  deleteSlot: async (id: string) => {
    const slots = getTable<TimetableSlot>(STORAGE_KEYS.MOCK_DB_SCHEDULE);
    saveTable(STORAGE_KEYS.MOCK_DB_SCHEDULE, slots.filter(s => s.id !== id));
  }
};
