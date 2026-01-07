import React from 'react';
import { Link } from 'react-router-dom';

export const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <div className="bg-red-50 dark:bg-red-900/10 p-10 rounded-[2.5rem] mb-10 shadow-sm border border-red-100 dark:border-red-900/30">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-6">
          🚫
        </div>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-3">Restricted Access</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto font-medium leading-relaxed">
          The requested resource requires higher administrative privileges than your current profile provides.
        </p>
      </div>
      
      <div className="space-y-4">
        <Link 
          to="/" 
          className="inline-flex px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest rounded-xl shadow-xl transition-all"
        >
          Back to Dashboard
        </Link>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Error Code: 403 Forbidden</p>
      </div>
    </div>
  );
};