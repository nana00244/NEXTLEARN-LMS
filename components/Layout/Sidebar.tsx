import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const links = [
    { to: '/', label: 'Dashboard', icon: '📊', roles: ['administrator', 'teacher', 'student', 'accountant'] },
    { to: '/profile', label: 'My Profile', icon: '👤', roles: ['administrator', 'teacher', 'student', 'accountant'] },
    { to: '/admin/staff', label: 'Staff Hub', icon: '👥', roles: ['administrator'] },
    { to: '/admin/students', label: 'Student Roster', icon: '🎓', roles: ['administrator'] },
    { to: '/admin/classes', label: 'Class Hub', icon: '🏫', roles: ['administrator'] },
    { to: '/accountant/students', label: 'Fee Roster', icon: '💸', roles: ['accountant'] },
    { to: '/accountant/fees', label: 'Fee Settings', icon: '⚙️', roles: ['accountant'] },
    { to: '/accountant/payroll', label: 'Payroll Manager', icon: '🏦', roles: ['accountant'] },
    { to: '/teacher/attendance', label: 'Attendance', icon: '✅', roles: ['teacher'] },
    { to: '/teacher/assignments', label: 'Assignments', icon: '📝', roles: ['teacher'] },
    { to: '/student/assignments', label: 'My Work', icon: '✍️', roles: ['student'] },
    { to: '/messages', label: 'Messages', icon: '✉️', roles: ['administrator', 'teacher', 'student', 'accountant'] },
  ].filter(link => link.roles.includes(user.role));

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">N</div>
        <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white">NextLearn</span>
      </div>

      <nav className="flex flex-col gap-1">
        {links.map(link => (
          <Link 
            key={link.to} 
            to={link.to} 
            className={`sidebar-link ${location.pathname === link.to ? 'active' : ''}`}
          >
            <span className="text-xl">{link.icon}</span>
            <span className="text-sm font-semibold">{link.label}</span>
          </Link>
        ))}
      </nav>

      <div className="absolute bottom-6 left-6 right-6">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Build Status</p>
          <p className="text-xs font-bold mt-1 text-indigo-600">Stable - bv3</p>
        </div>
      </div>
    </aside>
  );
};