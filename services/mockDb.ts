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

export const getStoredAnnouncements = () => getTable(STORAGE_KEYS.MOCK_DB_ANNOUNCEMENTS);
export const saveAnnouncements = (data: any[]) => saveTable(STORAGE_KEYS.MOCK_DB_ANNOUNCEMENTS, data);

export const findUserByEmail = (email: string) => {
  return getStoredUsers().find(u => u.email === email);
};

const initializeSeedData = () => {
  const users = getStoredUsers();
  if (users.length === 0) {
    saveUsers([
      { id: 'u_admin', email: 'admin@nextlearn.com', passwordHash: 'password123', firstName: 'System', lastName: 'Admin', role: 'administrator', themePreference: 'light', isActive: true, createdAt: new Date().toISOString() },
      { id: 'u_acc', email: 'accountant@nextlearn.com', passwordHash: 'password123', firstName: 'Financial', lastName: 'Officer', role: 'accountant', themePreference: 'light', isActive: true, createdAt: new Date().toISOString() }
    ]);
  }

  if (getStoredClasses().length === 0) {
    saveClasses([
      { id: 'c1', name: 'Grade 10-A', gradeLevel: '10', section: 'A', classCode: 'NL10A' },
      { id: 'c2', name: 'Grade 11-B', gradeLevel: '11', section: 'B', classCode: 'NL11B' }
    ]);
  }

  if (getStoredSubjects().length === 0) {
    saveSubjects([
      { id: 'sub1', name: 'Mathematics', code: 'MATH101' },
      { id: 'sub2', name: 'English', code: 'ENG101' }
    ]);
  }
};

initializeSeedData();