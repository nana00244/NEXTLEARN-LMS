import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onMenuToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <nav className="top-nav">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest hidden sm:block">NextLearn LMS</span>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>

        <div 
          className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
          onClick={() => navigate('/profile')}
        >
          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-sm font-bold leading-none">{user.firstName} {user.lastName}</p>
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter mt-1">{user.role}</p>
          </div>
        </div>

        <button 
          onClick={logout}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          title="Logout"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
        </button>
      </div>
    </nav>
  );
};