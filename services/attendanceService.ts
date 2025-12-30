
import { STORAGE_KEYS } from '../constants';
import { AttendanceRecord, AttendanceStatus, Student, User } from '../types';

const getTable = <T>(key: string): T[] => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

const saveTable = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const attendanceService = {
  getAttendanceForClass: async (classId: string, date: string) => {
    const records = getTable<AttendanceRecord>(STORAGE_KEYS.MOCK_DB_ATTENDANCE);
    return records.filter(r => r.classId === classId && r.date === date);
  },

  markAttendance: async (records: Partial<AttendanceRecord>[]) => {
    const existing = getTable<AttendanceRecord>(STORAGE_KEYS.MOCK_DB_ATTENDANCE);
    const newRecords = records.map(r => ({
      ...r,
      id: r.id || Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    })) as AttendanceRecord[];

    // Replace existing records for same student/class/date
    const filtered = existing.filter(ex => 
      !newRecords.some(nr => 
        nr.studentId === ex.studentId && 
        nr.classId === ex.classId && 
        nr.date === ex.date
      )
    );

    saveTable(STORAGE_KEYS.MOCK_DB_ATTENDANCE, [...filtered, ...newRecords]);
    return newRecords;
  },

  getStudentAttendanceSummary: async (studentId: string) => {
    const records = getTable<AttendanceRecord>(STORAGE_KEYS.MOCK_DB_ATTENDANCE).filter(r => r.studentId === studentId);
    const total = records.length;
    if (total === 0) return { percentage: 100, present: 0, absent: 0, late: 0, excused: 0 };

    const present = records.filter(r => r.status === 'present').length;
    const late = records.filter(r => r.status === 'late').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const excused = records.filter(r => r.status === 'excused').length;

    const percentage = ((present + late + (excused * 0.5)) / total) * 100;

    return {
      percentage: Math.round(percentage),
      present,
      absent,
      late,
      excused,
      history: records.sort((a,b) => b.date.localeCompare(a.date))
    };
  },

  getClassAttendanceStats: async (classId: string) => {
    const records = getTable<AttendanceRecord>(STORAGE_KEYS.MOCK_DB_ATTENDANCE).filter(r => r.classId === classId);
    const dates = Array.from(new Set(records.map(r => r.date)));
    
    return dates.map(date => {
      const dayRecords = records.filter(r => r.date === date);
      const presentCount = dayRecords.filter(r => r.status === 'present' || r.status === 'late').length;
      return {
        date,
        percentage: Math.round((presentCount / dayRecords.length) * 100) || 0
      };
    }).sort((a,b) => a.date.localeCompare(b.date));
  }
};
