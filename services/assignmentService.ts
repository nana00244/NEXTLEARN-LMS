
import { 
  getStoredAssignments, saveAssignments, 
  getStoredSubmissions, saveSubmissions,
  getStoredLessons, getStoredClasses,
  getStoredSubjects, getStoredUsers,
  getStoredStudents
} from './mockDb';
import { Assignment, Submission, Lesson } from '../types';

export const assignmentService = {
  // Teacher Actions
  getTeacherAssignments: async (teacherId: string) => {
    return getStoredAssignments().filter(a => a.teacherId === teacherId);
  },

  getAssignmentById: async (id: string) => {
    return getStoredAssignments().find(a => a.id === id);
  },

  createAssignment: async (data: Partial<Assignment>) => {
    const assignments = getStoredAssignments();
    const newAssignment = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      type: data.type || 'assignment',
      attachments: data.attachments || [],
      status: data.status || 'published'
    } as Assignment;
    saveAssignments([...assignments, newAssignment]);
    return newAssignment;
  },

  updateAssignment: async (id: string, updates: Partial<Assignment>) => {
    const assignments = getStoredAssignments();
    const idx = assignments.findIndex(a => a.id === id);
    if (idx === -1) throw new Error("Assignment not found");
    assignments[idx] = { ...assignments[idx], ...updates };
    saveAssignments(assignments);
    return assignments[idx];
  },

  deleteAssignment: async (id: string) => {
    const assignments = getStoredAssignments();
    saveAssignments(assignments.filter(a => a.id !== id));
  },

  // Student Actions
  getStudentStream: async (studentUserId: string) => {
    const students = getStoredStudents();
    const student = students.find(s => s.userId === studentUserId);
    if (!student || !student.classId) return [];

    const lessons = getStoredLessons().filter(l => l.classId === student.classId);
    const assignments = getStoredAssignments().filter(a => a.classId === student.classId);
    const users = getStoredUsers();
    const subjects = getStoredSubjects();

    const merged = [
      ...lessons.map(l => ({ ...l, type: 'lesson' as const })),
      ...assignments.map(a => ({ ...a, type: 'assignment' as const }))
    ];

    return merged.sort((a, b) => {
      const dateA = a.type === 'lesson' ? a.postedDate : a.createdAt;
      const dateB = b.type === 'lesson' ? b.postedDate : b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    }).map(item => ({
        ...item,
        teacher: users.find(u => u.id === item.teacherId),
        subject: subjects.find(s => s.id === item.subjectId)
    }));
  },

  getStudentAssignments: async (studentUserId: string) => {
    const students = getStoredStudents();
    const student = students.find(s => s.userId === studentUserId);
    if (!student || !student.classId) return [];

    const assignments = getStoredAssignments().filter(a => a.classId === student.classId);
    const submissions = getStoredSubmissions().filter(s => s.studentId === student.id);

    return assignments.map(a => {
        const sub = submissions.find(s => s.assignmentId === a.id);
        return {
            ...a,
            submission: sub,
            status: sub ? (sub.status === 'graded' ? 'graded' : 'completed') : (new Date(a.dueDate) < new Date() ? 'missing' : 'assigned')
        };
    });
  },

  getAssignmentDetails: async (id: string, studentUserId: string) => {
    const assignments = getStoredAssignments();
    const assignment = assignments.find(a => a.id === id);
    if (!assignment) return null;

    const students = getStoredStudents();
    const student = students.find(s => s.userId === studentUserId);
    
    // Safety check: ensure student is actually in the class the assignment belongs to
    if (student?.classId !== assignment.classId) {
      throw new Error("Access Denied: Assignment is not for your class.");
    }

    const submissions = getStoredSubmissions();
    const submission = submissions.find(s => s.assignmentId === id && s.studentId === student?.id);

    return { ...assignment, submission };
  },

  submitAssignment: async (assignmentId: string, studentUserId: string, data: { text?: string, files?: any[] }) => {
    const students = getStoredStudents();
    const student = students.find(s => s.userId === studentUserId);
    if (!student) throw new Error("Student record not found");

    const assignments = getStoredAssignments();
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    const submissions = getStoredSubmissions();
    const existing = submissions.findIndex(s => s.assignmentId === assignmentId && s.studentId === student.id);

    const isLate = new Date() > new Date(`${assignment.dueDate}T${assignment.dueTime || '23:59:59'}`);

    const newSubmission: Submission = {
        id: Math.random().toString(36).substr(2, 9),
        assignmentId,
        studentId: student.id,
        submittedDate: new Date().toISOString(),
        status: 'submitted',
        attachments: data.files || [],
        studentText: data.text,
        isLate
    };

    if (existing !== -1) {
        submissions[existing] = newSubmission;
        saveSubmissions(submissions);
    } else {
        saveSubmissions([...submissions, newSubmission]);
    }

    return newSubmission;
  }
};
