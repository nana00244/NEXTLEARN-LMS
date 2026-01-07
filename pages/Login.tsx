import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/UI/Spinner';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const { login, loginWithGoogle, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError("Institutional keys required.");
      return;
    }

    try {
      await login(email, password);
      handleNavigation();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Use recovery if needed.');
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await loginWithGoogle();
      handleNavigation();
    } catch (err: any) {
      setError(err.message || 'Google identity verification failed.');
    }
  };

  const handleNavigation = () => {
    const sessionStr = localStorage.getItem('nextlearn_active_session');
    if (sessionStr) {
      const user = JSON.parse(sessionStr);
      console.log('[Login] Directing to:', user.role);
      switch (user.role) {
        case 'administrator': navigate('/admin/staff'); break;
        case 'accountant': navigate('/accountant/dashboard'); break;
        case 'teacher': navigate('/'); break;
        default: navigate('/');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
        {/* Branding Background Blob */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full -mr-16 -mt-16"></div>
        
        <div className="text-center mb-8 relative">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-xl shadow-indigo-600/20">N</div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">NextLearn LMS</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-3">Identity Management</p>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-2xl border border-rose-100 dark:border-rose-800 animate-in slide-in-from-top-2">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-4 mb-8">
          <button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            type="button"
            className="w-full flex items-center justify-center gap-3 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-[0.98]"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Institutional Google Sign-In
          </button>
          
          <div className="flex items-center gap-4 text-slate-300 dark:text-slate-700">
            <div className="h-px bg-current flex-1"></div>
            <span className="text-[10px] font-black uppercase tracking-widest">secure login</span>
            <div className="h-px bg-current flex-1"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest ml-1">Access Email</label>
            <input 
              type="email" required className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold dark:text-white" 
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="e.g. admin@nextlearn.com"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest ml-1">Access Key</label>
            <input 
              type="password" required className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold dark:text-white" 
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" disabled={isLoading}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 h-16 flex items-center justify-center"
          >
            {isLoading ? <Spinner size="sm" /> : 'Access Dashboard'}
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
           <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
             Need an account? <a href="#/register" className="text-indigo-600 hover:underline">Apply Now</a>
           </p>
           
           <button 
             onClick={() => setShowHelp(!showHelp)}
             className="text-[10px] font-black text-slate-300 hover:text-indigo-600 uppercase tracking-widest transition-colors"
           >
             {showHelp ? 'Hide Recovery' : 'Developer Access Help'}
           </button>
        </div>

        {showHelp && (
          <div className="mt-6 p-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl border border-indigo-100 dark:border-indigo-800 animate-in fade-in slide-in-from-bottom-2">
             <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3"># Seed Credentials</p>
             <div className="space-y-3">
                <div>
                   <p className="text-[9px] text-slate-400 uppercase font-bold">Admin Email</p>
                   <p className="text-xs font-mono font-bold dark:text-white select-all">admin@nextlearn.com</p>
                </div>
                <div>
                   <p className="text-[9px] text-slate-400 uppercase font-bold">Default Key</p>
                   <p className="text-xs font-mono font-bold dark:text-white select-all">password123</p>
                </div>
             </div>
          </div>
        )}
      </div>
      
      <p className="mt-10 text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.4em]">NextLearn Cloud Ledger v3.0</p>
    </div>
  );
};