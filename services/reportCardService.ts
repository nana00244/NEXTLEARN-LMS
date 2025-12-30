
import { STORAGE_KEYS } from '../constants';
import { ReportCard, ReportCardSubjectGrade, Student, User, Submission, AttendanceRecord } from '../types';
import { gradingService } from './gradingService';
import { attendanceService } from './attendanceService';

const getTable = <T>(key: string): T[] => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

const saveTable = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const reportCardService = {
  getReportCardsForStudent: async (studentId: string) => {
    return getTable<ReportCard>(STORAGE_KEYS.MOCK_DB_REPORT_CARDS).filter(rc => rc.studentId === studentId);
  },

  getReportCardById: async (id: string) => {
    const rc = getTable<ReportCard>(STORAGE_KEYS.MOCK_DB_REPORT_CARDS).find(r => r.id === id);
    if (!rc) return null;
    
    const grades = getTable<ReportCardSubjectGrade>(STORAGE_KEYS.MOCK_DB_REPORT_CARD_GRADES).filter(g => g.reportCardId === id);
    return { ...rc, grades };
  },

  generateForClass: async (classId: string, termId: string, yearId: string) => {
    const students = getTable<Student>(STORAGE_KEYS.MOCK_DB_STUDENTS).filter(s => s.classId === classId);
    const reportCards: ReportCard[] = [];
    const reportGrades: ReportCardSubjectGrade[] = [];

    for (const student of students) {
      // 1. Compile Academic Performance
      const subs = getTable<Submission>(STORAGE_KEYS.MOCK_DB_SUBMISSIONS).filter(s => s.studentId === student.id);
      const graded = subs.filter(s => s.status === 'graded');
      
      const totalPercentage = graded.length > 0 
        ? graded.reduce((acc, curr) => acc + (curr.grade || 0), 0) / graded.length 
        : 0;

      // 2. Compile Attendance
      const attendance = await attendanceService.getStudentAttendanceSummary(student.id);

      const rc: ReportCard = {
        id: `RC-${student.id}-${termId}`,
        studentId: student.id,
        termId,
        academicYearId: yearId,
        overallGrade: calculateLetterGrade(totalPercentage),
        overallPercentage: Math.round(totalPercentage),
        classRank: 0, // Calculated after bulk generation
        totalStudents: students.length,
        attendancePercentage: attendance.percentage,
        conductRating: 'good',
        teacherComment: 'A dedicated student showing steady progress across core competencies.',
        isFinalized: false,
        generatedDate: new Date().toISOString()
      };
      
      reportCards.push(rc);
    }

    // 3. Simple Ranking Logic
    const sorted = [...reportCards].sort((a, b) => b.overallPercentage - a.overallPercentage);
    const finalReportCards = reportCards.map(rc => ({
      ...rc,
      classRank: sorted.findIndex(s => s.id === rc.id) + 1
    }));

    // 4. Save
    const existing = getTable<ReportCard>(STORAGE_KEYS.MOCK_DB_REPORT_CARDS);
    saveTable(STORAGE_KEYS.MOCK_DB_REPORT_CARDS, [...existing.filter(ex => !finalReportCards.some(f => f.id === ex.id)), ...finalReportCards]);

    return finalReportCards;
  },

  updateReportCard: async (id: string, updates: Partial<ReportCard>) => {
    const all = getTable<ReportCard>(STORAGE_KEYS.MOCK_DB_REPORT_CARDS);
    const updated = all.map(rc => rc.id === id ? { ...rc, ...updates } : rc);
    saveTable(STORAGE_KEYS.MOCK_DB_REPORT_CARDS, updated);
  }
};

const calculateLetterGrade = (percentage: number) => {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};
