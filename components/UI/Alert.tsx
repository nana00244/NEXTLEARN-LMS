import React from 'react';

interface AlertProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  const styles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
    error: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800',
    info: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  };

  return (
    <div 
      className={`p-4 md:p-5 mb-4 border rounded-2xl flex justify-between items-center shadow-sm animate-in fade-in slide-in-from-top-1 ${styles[type]} animated`}
      role="alert"
    >
      <div className="flex items-center gap-3">
        <span className="text-xl" aria-hidden="true">
          {type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️'}
        </span>
        <span className="text-sm font-bold leading-tight">{message}</span>
      </div>
      {onClose && (
        <button 
          onClick={onClose} 
          className="ml-4 w-12 h-12 flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all active:scale-90 ripple"
          aria-label="Dismiss alert"
        >
          <span className="text-2xl leading-none">&times;</span>
        </button>
      )}
    </div>
  );
};