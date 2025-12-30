
export type UserRole = 'administrator' | 'teacher' | 'student' | 'accountant';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  profilePicture?: string;
  themePreference: 'light' | 'dark';
  createdAt: string;
  isActive: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Phase 8: Report Cards
export interface ReportCard {
  id: string;
  studentId: string;
  termId: string;
  academicYearId: string;
  overallGrade: string;
  overallPercentage: number;
  classRank: number;
  totalStudents: number;
  attendancePercentage: number;
  conductRating: 'excellent' | 'good' | 'fair' | 'needs_improvement';
  teacherComment: string;
  principalComment?: string;
  isFinalized: boolean;
  generatedDate: string;
}

export interface ReportCardSubjectGrade {
  id: string;
  reportCardId: string;
  subjectId: string;
  score: number;
  grade: string;
  teacherComment?: string;
}

// Phase 8: Resources & Communication
export interface Resource {
  id: string;
  title: string;
  category: 'syllabus' | 'past_paper' | 'notes' | 'guideline';
  subjectId?: string;
  classId?: string;
  fileUrl: string;
  uploadedBy: string;
  uploadDate: string;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  subject: string;
  body: string;
  isRead: boolean;
  sentAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  details?: string;
}

export interface Student {
  id: string;
  userId: string;
  admissionNumber: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  classId: string;
  enrollmentDate: string;
  status: 'active' | 'inactive' | 'graduated';
}

export interface Teacher {
  id: string;
  userId: string;
  employeeId: string;
  specialization?: string;
  status: 'active' | 'inactive';
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  markedBy: string;
  notes?: string;
  timestamp: string;
}

export interface Class {
  id: string;
  name: string;
  gradeLevel: string;
  section: string;
  classCode?: string;
  description?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
}

export interface Assignment {
  id: string;
  title: string;
  instructions: string;
  points: number;
  dueDate: string;
  dueTime: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  createdAt: string;
  type: 'assignment' | 'quiz' | 'material' | 'question';
  attachments: any[];
  status: 'draft' | 'published' | 'scheduled';
  topicId?: string;
  categoryId?: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  submittedDate: string;
  status: 'submitted' | 'graded' | 'returned';
  attachments: any[];
  studentText?: string;
  isLate: boolean;
  grade?: number;
  feedback?: string;
  letterGrade?: string;
  gradedDate?: string;
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  classId: string;
  subjectId: string;
  topicId?: string;
  videoUrl?: string;
  attachments: LessonAttachment[];
  isPublished: boolean;
  isPinned: boolean;
  postedDate: string;
  teacherId: string;
}

export interface LessonAttachment {
  id: string;
  lessonId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export interface Topic {
  id: string;
  name: string;
  classId: string;
  subjectId: string;
  order: number;
}

export interface Announcement {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  content: string;
  postedDate: string;
  attachments: any[];
  title?: string;
  priority?: 'low' | 'medium' | 'high';
  isPinned?: boolean;
  targetRole?: string;
  targetClassId?: string;
  authorId?: string;
}

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface Term {
  id: string;
  academicYearId: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface GradeCategory {
  id: string;
  name: string;
  weight: number;
  classId: string;
  subjectId: string;
}

export interface Test {
  id: string;
  title: string;
  maxScore: number;
  classId: string;
  subjectId: string;
  categoryId: string;
  date: string;
}

export interface TestScore {
  id: string;
  testId: string;
  studentId: string;
  score: number;
  gradedDate: string;
}

export interface FeeCategory {
  id: string;
  name: string;
  description?: string;
}

export interface FeeStructure {
  id: string;
  classId: string;
  categoryId: string;
  amount: number;
  term: string;
  isMandatory: boolean;
}

export interface StudentFee {
  id: string;
  studentId: string;
  feeStructureId: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  status: 'paid' | 'partial' | 'unpaid';
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  paymentMethod: 'bank_transfer' | 'cash' | 'mobile_money' | 'card' | 'cheque';
  transactionRef: string;
  paymentDate: string;
  receiptNumber: string;
  term: string;
  recordedBy: string;
  notes?: string;
}

export interface Period {
  id: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
}

export interface TimetableSlot {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  periodId: string;
  dayOfWeek: number;
  room: string;
}

export interface SalaryStructure {
  id: string;
  userId: string;
  baseSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  taxDeduction: number;
  insuranceDeduction: number;
  netPay: number;
}

export interface Payslip {
  id: string;
  userId: string;
  month: string;
  year: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  status: 'pending' | 'processed' | 'paid';
  paymentDate: string;
}

export interface PayrollRecord extends Payslip {}

export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  color?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type?: 'system' | 'academic' | 'financial';
}
