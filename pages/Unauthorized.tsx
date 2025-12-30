
import React from 'react';
import { Link } from 'react-router-dom';

export const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-rose-100 dark:bg-rose-900/30 p-6 rounded-full mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-rose-600 dark:text-rose-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">Access Denied</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">
        Oops! It looks like you don't have permission to access this page. Please contact your administrator if you believe this is an error.
      </p>
      <Link 
        to="/" 
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all"
      >
        Go to Dashboard
      </Link>
    </div>
  );
};
