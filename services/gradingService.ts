
import { 
  getStoredSubmissions, saveSubmissions, 
  getStoredAssignments, getStoredStudents,
  getStoredUsers, getStoredTests,
  getStoredTestScores, saveTestScores,
  getStoredGradeCategories, saveGradeCategories,
  getStoredSubjects
} from './mockDb';
import { Submission, Assignment, GradeCategory, Test, TestScore } from '../types';

export const gradingService = {
  // Grading Submissions
  getAssignmentSubmissions: async (assignmentId: string) => {
    const submissions = getStoredSubmissions().filter(s => s.assignmentId === assignmentId);
    const students = getStoredStudents();
    const users = getStoredUsers();

    return submissions.map(s => {
      const student = students.find(st => st.id === s.studentId);
      const user = users.find(u => u.id === student?.userId);
      return { ...s, student, user };
    });
  },

  gradeSubmission: async (id: string, data: Partial<Submission>) => {
    const subs = getStoredSubmissions();
    const idx = subs.findIndex(s => s.id === id);
    if (idx === -1) throw new Error("Submission not found");

    const letterGrade = calculateLetterGrade((data.grade || 0) / 100 * 100); // Simplistic
    
    subs[idx] = { 
      ...subs[idx], 
      ...data, 
      status: data.status || 'graded',
      letterGrade,
      gradedDate: new Date().toISOString()
    };
    saveSubmissions(subs);
    return subs[idx];
  },

  // Grade Categories
  getGradeCategories: async (classId: string, subjectId: string) => {
    return getStoredGradeCategories().filter(c => c.classId === classId && c.subjectId === subjectId);
  },

  saveGradeCategory: async (category: Partial<GradeCategory>) => {
    const cats = getStoredGradeCategories();
    const newCat = { ...category, id: Math.random().toString(36).substr(2, 9) } as GradeCategory;
    saveGradeCategories([...cats, newCat]);
    return newCat;
  },

  // Gradebook Logic
  getGradebook: async (classId: string, subjectId: string) => {
    const students = getStoredStudents().filter(s => s.classId === classId);
    const users = getStoredUsers();
    const assignments = getStoredAssignments().filter(a => a.classId === classId && a.subjectId === subjectId);
    const submissions = getStoredSubmissions();
    const tests = getStoredTests().filter(t => t.classId === classId && t.subjectId === subjectId);
    const testScores = getStoredTestScores();
    const categories = getStoredGradeCategories().filter(c => c.classId === classId && c.subjectId === subjectId);

    return students.map(student => {
      const user = users.find(u => u.id === student.userId);
      const studentSubmissions = submissions.filter(s => s.studentId === student.id);
      const studentTestScores = testScores.filter(ts => ts.studentId === student.id);

      const items = [
        ...assignments.map(a => {
          const sub = studentSubmissions.find(s => s.assignmentId === a.id);
          return { id: a.id, type: 'assignment', title: a.title, points: sub?.grade, max: a.points, categoryId: a.categoryId };
        }),
        ...tests.map(t => {
          const score = studentTestScores.find(ts => ts.testId === t.id);
          return { id: t.id, type: 'test', title: t.title, points: score?.score, max: t.maxScore, categoryId: t.categoryId };
        })
      ];

      // Weighted Calculation
      let overallScore = 0;
      let totalWeightUsed = 0;

      categories.forEach(cat => {
        const catItems = items.filter(i => i.categoryId === cat.id && i.points !== undefined);
        if (catItems.length > 0) {
          const catAvg = catItems.reduce((acc, curr) => acc + (curr.points! / curr.max), 0) / catItems.length;
          overallScore += catAvg * cat.weight;
          totalWeightUsed += cat.weight;
        }
      });

      const finalGrade = totalWeightUsed > 0 ? (overallScore / totalWeightUsed) * 100 : 0;

      return {
        studentId: student.id,
        name: `${user?.firstName} ${user?.lastName}`,
        items,
        overallGrade: finalGrade.toFixed(1),
        letterGrade: calculateLetterGrade(finalGrade)
      };
    });
  },

  // Student Actions
  getStudentGrades: async (studentUserId: string) => {
    const students = getStoredStudents();
    const student = students.find(s => s.userId === studentUserId);
    if (!student) return [];

    const assignments = getStoredAssignments();
    const subjects = getStoredSubjects();
    const submissions = getStoredSubmissions().filter(s => s.studentId === student.id && (s.status === 'graded' || s.status === 'returned'));

    return submissions.map(sub => {
      const assignment = assignments.find(a => a.id === sub.assignmentId);
      const subject = subjects.find(s => s.id === assignment?.subjectId);
      return {
        ...sub,
        assignment,
        subject
      };
    });
  }
};

const calculateLetterGrade = (percentage: number) => {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};
