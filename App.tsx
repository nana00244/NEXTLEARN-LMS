import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Unauthorized } from './pages/Unauthorized';
import { Profile } from './pages/Profile';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { StudentList } from './pages/admin/StudentList';
import { TeacherManagement } from './pages/admin/TeacherManagement';
import { StaffManagement } from './pages/admin/StaffManagement';
import { ClassManagement } from './pages/admin/ClassManagement';
import { ClassRosterDetail } from './pages/admin/ClassRosterDetail';
import { TimetableManager } from './pages/admin/TimetableManager';
import { ReportCardGenerator } from './pages/admin/ReportCardGenerator';
import { AuditLogs } from './pages/admin/AuditLogs';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { AttendanceMarker } from './pages/teacher/AttendanceMarker';
import { AssignmentManager } from './pages/teacher/AssignmentManager';
import { SubmissionsList } from './pages/teacher/SubmissionsList';
import { GradingView } from './pages/teacher/GradingView';
import { Gradebook } from './pages/teacher/Gradebook';
import { ClassView } from './pages/teacher/ClassView';
import { TeacherRoster } from './pages/teacher/TeacherRoster';
import { StudentStream } from './pages/student/StudentStream';
import { StudentAssignments } from './pages/student/StudentAssignments';
import { AssignmentDetail } from './pages/student/AssignmentDetail';
import { StudentSchedule } from './pages/student/StudentSchedule';
import { ReportCardView } from './pages/student/ReportCardView';
import { StudentGrades } from './pages/student/StudentGrades';
import { AccountantDashboard } from './pages/accountant/AccountantDashboard';
import { StudentFinanceList } from './pages/accountant/StudentFinanceList';
import { PayrollManager } from './pages/accountant/PayrollManager';
import { PaymentRecorder } from './pages/accountant/PaymentRecorder';
import { FeeManagement } from './pages/accountant/FeeManagement';
import { ResourceLibrary } from './pages/ResourceLibrary';
import { Messaging } from './pages/Messaging';
import { Spinner } from './components/UI/Spinner';

const ProtectedRoute: React.FC<{ 
  children: React.ReactNode, 
  allowedRoles?: string[] 
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.warn(`[ProtectedRoute] Access denied for role: ${user.role}. Expected:`, allowedRoles);
    return <Navigate to="/unauthorized" replace />;
  }

  return <Layout>{children}</Layout>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"><Spinner size="lg" /></div>;

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/unauthorized" element={<ProtectedRoute><Unauthorized /></ProtectedRoute>} />
      
      {/* Root Switcher: Directs users to their specialized dashboard */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            {user?.role === 'administrator' ? <AdminDashboard /> : 
             user?.role === 'teacher' ? <TeacherDashboard /> : 
             user?.role === 'accountant' ? <AccountantDashboard /> :
             user?.role === 'student' ? <StudentStream /> :
             <Dashboard />}
          </ProtectedRoute>
        } 
      />

      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/resources" element={<ProtectedRoute><ResourceLibrary /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messaging /></ProtectedRoute>} />

      {/* Admin Specific Routes */}
      <Route path="/admin/staff" element={<ProtectedRoute allowedRoles={['administrator']}><StaffManagement /></ProtectedRoute>} />
      <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['administrator']}><StudentList /></ProtectedRoute>} />
      <Route path="/admin/teachers" element={<ProtectedRoute allowedRoles={['administrator']}><TeacherManagement /></ProtectedRoute>} />
      <Route path="/admin/classes" element={<ProtectedRoute allowedRoles={['administrator']}><ClassManagement /></ProtectedRoute>} />
      <Route path="/admin/classes/:classId/roster" element={<ProtectedRoute allowedRoles={['administrator']}><ClassRosterDetail /></ProtectedRoute>} />
      <Route path="/admin/timetable" element={<ProtectedRoute allowedRoles={['administrator']}><TimetableManager /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['administrator']}><ReportCardGenerator /></ProtectedRoute>} />
      <Route path="/admin/logs" element={<ProtectedRoute allowedRoles={['administrator']}><AuditLogs /></ProtectedRoute>} />
      
      {/* Accountant Specific Routes */}
      <Route path="/accountant/dashboard" element={<ProtectedRoute allowedRoles={['accountant']}><AccountantDashboard /></ProtectedRoute>} />
      <Route path="/accountant/students" element={<ProtectedRoute allowedRoles={['accountant']}><StudentFinanceList /></ProtectedRoute>} />
      <Route path="/accountant/fees" element={<ProtectedRoute allowedRoles={['accountant']}><FeeManagement /></ProtectedRoute>} />
      <Route path="/accountant/payroll" element={<ProtectedRoute allowedRoles={['accountant']}><PayrollManager /></ProtectedRoute>} />
      <Route path="/accountant/payments/new" element={<ProtectedRoute allowedRoles={['accountant']}><PaymentRecorder /></ProtectedRoute>} />

      {/* Teacher Specific Routes */}
      <Route path="/teacher/attendance" element={<ProtectedRoute allowedRoles={['teacher']}><AttendanceMarker /></ProtectedRoute>} />
      <Route path="/teacher/assignments" element={<ProtectedRoute allowedRoles={['teacher']}><AssignmentManager /></ProtectedRoute>} />
      <Route path="/teacher/assignments/:assignmentId/submissions" element={<ProtectedRoute allowedRoles={['teacher']}><SubmissionsList /></ProtectedRoute>} />
      <Route path="/teacher/grading/:submissionId" element={<ProtectedRoute allowedRoles={['teacher']}><GradingView /></ProtectedRoute>} />
      <Route path="/teacher/gradebook/:classId/:subjectId" element={<ProtectedRoute allowedRoles={['teacher']}><Gradebook /></ProtectedRoute>} />
      <Route path="/teacher/classes/:classId/:subjectId" element={<ProtectedRoute allowedRoles={['teacher']}><ClassView /></ProtectedRoute>} />
      <Route path="/teacher/roster/:classId" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherRoster /></ProtectedRoute>} />
      
      {/* Student Specific Routes */}
      <Route path="/student/stream" element={<ProtectedRoute allowedRoles={['student']}><StudentStream /></ProtectedRoute>} />
      <Route path="/student/assignments" element={<ProtectedRoute allowedRoles={['student']}><StudentAssignments /></ProtectedRoute>} />
      <Route path="/student/assignments/:id" element={<ProtectedRoute allowedRoles={['student']}><AssignmentDetail /></ProtectedRoute>} />
      <Route path="/student/schedule" element={<ProtectedRoute allowedRoles={['student']}><StudentSchedule /></ProtectedRoute>} />
      <Route path="/student/report-cards" element={<ProtectedRoute allowedRoles={['student']}><ReportCardView /></ProtectedRoute>} />
      <Route path="/student/grades" element={<ProtectedRoute allowedRoles={['student']}><StudentGrades /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;