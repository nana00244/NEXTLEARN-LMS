
import { STORAGE_KEYS } from '../constants';

const getTable = (key: string): any[] => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

const saveTable = (key: string, data: any[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const getStoredUsers = () => getTable(STORAGE_KEYS.MOCK_DB_USERS);
export const saveUsers = (users: any[]) => saveTable(STORAGE_KEYS.MOCK_DB_USERS, users);

export const saveUser = (user: any) => {
  const users = getStoredUsers();
  saveUsers([...users, user]);
};

export const getStoredStudents = () => getTable(STORAGE_KEYS.MOCK_DB_STUDENTS);
export const saveStudents = (data: any[]) => saveTable(STORAGE_KEYS.MOCK_DB_STUDENTS, data);

export const getStoredTeachers = () => getTable(STORAGE_KEYS.MOCK_DB_TEACHERS);
export const saveTeachers = (data: any[]) => saveTable(STORAGE_KEYS.MOCK_DB_TEACHERS, data);

export const getStoredClasses = () => getTable(STORAGE_KEYS.MOCK_DB_CLASSES);
export const saveClasses = (data: any[]) => saveTable(STORAGE_KEYS.MOCK_DB_CLASSES, data);

export const getStoredAcademicYears = () => getTable(STORAGE_KEYS.MOCK_DB_ACADEMIC_YEARS);
export const saveAcademicYears = (data: any[]) => saveTable(STORAGE_KEYS.MOCK_DB_ACADEMIC_YEARS, data);

export const getStoredSubjects = () => getTable(STORAGE_KEYS.MOCK_DB_SUBJECTS);
export const saveSubjects = (data: any[]) => saveTable(STORAGE_KEYS.MOCK_DB_SUBJECTS, data);

export const getStoredTeacherClasses = () => getTable(STORAGE_KEYS.MOCK_DB_TEACHER_CLASSES);
export const saveTeacherClasses = (data: any[]) => saveTable(STORAGE_KEYS.MOCK_DB_TEACHER_CLASSES, data);

export const getStoredLessons = () => getTable(STORAGE_KEYS.MOCK_DB_LESSONS);
export const saveLessons = (data: any[]) => saveTable(STORAGE_KEYS.MOCK_DB_LESSONS, data);

export const getStoredTopics = () => getTable(STORAGE_KEYS.MOCK_DB_TOPICS);
export const saveTopics = (data: any[]) => saveTable(STORAGE_KEYS.MOCK_DB_TOPICS, data);

export const getStoredGradeCategories = () => getTable(STORAGE_KEYS.MOCK_DB_GRADE_CATEGORIES);
export const saveGradeCategories = (data: any[]) => saveTable(STORAGE_KEYS.MOCK_DB_GRADE_CATEGORIES, data);

export const getStoredTests = () => getTable(STORAGE_KEYS.MOCK_DB_TESTS);
export const saveTests = (data: any[]) => saveTable(STORAGE_KEYS.MOCK_DB_TESTS, data);

export const getStoredTestScores = () => getTable(STORAGE_KEYS.MOCK_DB_TEST_SCORES);
export const saveTestScores = (data: any[]) => saveTable(STORAGE_KEYS.MOCK_DB_TEST_SCORES, data);

export const getStoredAssignments = () => getTable(STORAGE_KEYS.MOCK_DB_ASSIGNMENTS);
export const saveAssignments = (data: any[]) => saveTable(STORAGE_KEYS.MOCK_DB_ASSIGNMENTS, data);

export const getStoredSubmissions = () => getTable(STORAGE_KEYS.MOCK_DB_SUBMISSIONS);
export const saveSubmissions = (data: any[]) => saveTable(STORAGE_KEYS.MOCK_DB_SUBMISSIONS, data);

export const findUserByEmail = (email: string) => {
  return getStoredUsers().find(u => u.email === email);
};

const initializeSeedData = () => {
  const users = getStoredUsers();
  
  // Default Administrator
  if (!users.find(u => u.email === 'admin@nextlearn.com')) {
    saveUser({
      id: 'u_admin', email: 'admin@nextlearn.com', passwordHash: 'password123',
      firstName: 'System', lastName: 'Administrator', role: 'administrator', themePreference: 'light',
      createdAt: new Date().toISOString(), isActive: true
    });
  }

  // Default Accountant
  if (!users.find(u => u.email === 'accountant@nextlearn.com')) {
    saveUser({
      id: 'u_acc', email: 'accountant@nextlearn.com', passwordHash: 'password123',
      firstName: 'Financial', lastName: 'Officer', role: 'accountant', themePreference: 'light',
      createdAt: new Date().toISOString(), isActive: true
    });
  }

  // Phase 8 Seeds: Resources
  if (getTable(STORAGE_KEYS.MOCK_DB_RESOURCES).length === 0) {
    saveTable(STORAGE_KEYS.MOCK_DB_RESOURCES, [
      { id: 'r1', title: 'Mathematics Syllabus 2024', category: 'syllabus', uploadedBy: 'u_admin', uploadDate: new Date().toISOString(), fileUrl: '#' },
      { id: 'r2', title: 'Biology Past Paper - Term 1', category: 'past_paper', uploadedBy: 'u_admin', uploadDate: new Date().toISOString(), fileUrl: '#' }
    ]);
  }

  // Phase 8 Seeds: Messages
  if (getTable(STORAGE_KEYS.MOCK_DB_MESSAGES).length === 0) {
    saveTable(STORAGE_KEYS.MOCK_DB_MESSAGES, [
      { id: 'm1', senderId: 'u_acc', recipientId: 'u_admin', subject: 'Budget Review', body: 'The final budget for Term 2 is ready for your approval.', isRead: false, sentAt: new Date().toISOString() }
    ]);
  }

  // Activity Logs
  if (getTable(STORAGE_KEYS.MOCK_DB_ACTIVITY_LOGS).length === 0) {
    saveTable(STORAGE_KEYS.MOCK_DB_ACTIVITY_LOGS, [
      { id: 'l1', userId: 'u_admin', action: 'LOGIN', timestamp: new Date().toISOString(), details: 'Admin logged in via seed' }
    ]);
  }

  // Payroll Seeds
  if (getTable(STORAGE_KEYS.MOCK_DB_SALARY_STRUCTURES).length === 0) {
    saveTable(STORAGE_KEYS.MOCK_DB_SALARY_STRUCTURES, [
      { id: 'ss1', userId: 'u_acc', baseSalary: 4500, housingAllowance: 500, transportAllowance: 300, otherAllowances: 200, taxDeduction: 600, insuranceDeduction: 150, netPay: 4750 }
    ]);
  }

  if (getStoredAcademicYears().length === 0) {
    saveAcademicYears([{ id: 'ay1', name: '2023/2024', isCurrent: true, startDate: '2023-09-01', endDate: '2024-06-30' }]);
  }

  if (getStoredClasses().length === 0) {
    saveClasses([
      { id: 'c1', name: 'Grade 10-A', gradeLevel: '10', section: 'A' },
      { id: 'c2', name: 'Grade 11-B', gradeLevel: '11', section: 'B' }
    ]);
  }

  if (getStoredSubjects().length === 0) {
    saveSubjects([
      { id: 'sub1', name: 'Mathematics', code: 'MATH101' },
      { id: 'sub2', name: 'English Language', code: 'ENG101' },
      { id: 'sub3', name: 'Physics', code: 'PHY101' }
    ]);
  }

  if (getTable(STORAGE_KEYS.MOCK_DB_PERIODS).length === 0) {
    saveTable(STORAGE_KEYS.MOCK_DB_PERIODS, [
      { id: 'p1', periodNumber: 1, startTime: '08:00', endTime: '09:00' },
      { id: 'p2', periodNumber: 2, startTime: '09:00', endTime: '10:00' },
      { id: 'p3', periodNumber: 3, startTime: '10:30', endTime: '11:30' },
      { id: 'p4', periodNumber: 4, startTime: '11:30', endTime: '12:30' }
    ]);
  }

  if (getTable(STORAGE_KEYS.MOCK_DB_TERMS).length === 0) {
    saveTable(STORAGE_KEYS.MOCK_DB_TERMS, [
      { id: 't1', academicYearId: 'ay1', name: 'Term 1', startDate: '2023-09-01', endDate: '2023-12-15', isCurrent: true }
    ]);
  }

  if (getTable(STORAGE_KEYS.MOCK_DB_ANNOUNCEMENTS).length === 0) {
    saveTable(STORAGE_KEYS.MOCK_DB_ANNOUNCEMENTS, [
      { id: 'a1', title: 'Welcome to Term 1!', content: 'We are excited to have all students back for the new academic year.', priority: 'high', postedDate: new Date().toISOString(), isPinned: true, authorId: 'u_admin' }
    ]);
  }
};

initializeSeedData();
