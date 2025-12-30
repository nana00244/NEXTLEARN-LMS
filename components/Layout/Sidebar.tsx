
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isAdmin = user.role === 'administrator';
  const isTeacher = user.role === 'teacher';
  const isStudent = user.role === 'student';
  const isAccountant = user.role === 'accountant';

  return (
    <aside className="w-64 hidden lg:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-[calc(100vh-64px)] fixed left-0 top-16 overflow-y-auto no-print">
      <div className="p-4 space-y-1">
        <p className="px-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Main Menu</p>
        
        <SidebarLink to="/" label="Dashboard" active={location.pathname === '/'} icon="📊" />
        <SidebarLink to="/profile" label="My Profile" active={location.pathname === '/profile'} icon="👤" />
        <SidebarLink to="/messages" label="Messages" active={location.pathname === '/messages'} icon="✉️" />
        <SidebarLink to="/resources" label="Library" active={location.pathname === '/resources'} icon="📚" />
        
        {isAdmin && (
          <>
            <p className="px-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-6 mb-2">Administration</p>
            <SidebarLink to="/admin/classes" label="Class Hub" active={location.pathname === '/admin/classes'} icon="🏫" />
            <SidebarLink to="/admin/teachers" label="Teachers" active={location.pathname === '/admin/teachers'} icon="👥" />
            <SidebarLink to="/admin/students" label="Student Roster" active={location.pathname === '/admin/students'} icon="🎓" />
            <SidebarLink to="/admin/timetable" label="Master Timetable" active={location.pathname === '/admin/timetable'} icon="📅" />
            <SidebarLink to="/admin/reports" label="Report Generator" active={location.pathname === '/admin/reports'} icon="🏆" />
            <SidebarLink to="/admin/logs" label="Audit Trail" active={location.pathname === '/admin/logs'} icon="🛡️" />
          </>
        )}

        {isTeacher && (
          <>
            <p className="px-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-6 mb-2">Academic Hub</p>
            <SidebarLink to="/teacher/attendance" label="Attendance" active={location.pathname === '/teacher/attendance'} icon="✅" />
            <SidebarLink to="/teacher/assignments" label="Assignments" active={location.pathname.startsWith('/teacher/assignments')} icon="📝" />
          </>
        )}

        {isStudent && (
          <>
            <p className="px-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-6 mb-2">My Education</p>
            <SidebarLink to="/student/assignments" label="My Assignments" active={location.pathname === '/student/assignments'} icon="✍️" />
            <SidebarLink to="/student/schedule" label="My Schedule" active={location.pathname === '/student/schedule'} icon="📅" />
            <SidebarLink to="/student/report-cards" label="My Reports" active={location.pathname === '/student/report-cards'} icon="📜" />
            <SidebarLink to="/student/grades" label="My Grades" active={location.pathname === '/student/grades'} icon="🎯" />
          </>
        )}

        {isAccountant && (
          <>
            <p className="px-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-6 mb-2">Treasury</p>
            <SidebarLink to="/accountant/students" label="Fee Roster" active={location.pathname === '/accountant/students'} icon="👨‍🎓" />
            <SidebarLink to="/accountant/fees" label="Fee Settings" active={location.pathname === '/accountant/fees'} icon="⚙️" />
            <SidebarLink to="/accountant/payroll" label="Payroll Manager" active={location.pathname === '/accountant/payroll'} icon="🏦" />
            <SidebarLink to="/accountant/payments/new" label="Record Payment" active={location.pathname.startsWith('/accountant/payments')} icon="💸" />
          </>
        )}
      </div>

      <div className="mt-auto p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-4">
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">NextLearn Enterprise</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Final Stable Build</p>
        </div>
      </div>
    </aside>
  );
};

const SidebarLink: React.FC<{ to: string; label: string; active?: boolean; icon: string }> = ({ to, label, active, icon }) => (
  <Link 
    to={to} 
    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
    }`}
  >
    <span className="text-lg">{icon}</span>
    {label}
  </Link>
);
