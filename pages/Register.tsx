import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/UI/Alert';
import { Spinner } from '../components/UI/Spinner';
import { UserRole } from '../types';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as UserRole,
  });
  
  const [error, setError] = useState<string | null>(null);
  const { register, loginWithGoogle, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) return "Full name is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return "Invalid institutional email.";
    if (formData.password.length < 6) return "Access key must be at least 6 characters.";
    if (formData.password !== formData.confirmPassword) return "Access keys do not match.";
    return null;
  };

  const handleRoleNavigation = (role: string) => {
    console.log('[Register] Finalizing navigation for role:', role);
    switch (role) {
      case 'administrator': navigate('/admin/staff'); break;
      case 'accountant': navigate('/accountant/dashboard'); break;
      case 'teacher': navigate('/'); break;
      default: navigate('/');
    }
  };

  const handleGoogleRegister = async () => {
    setError(null);
    try {
      await loginWithGoogle(formData.role);
      handleRoleNavigation(formData.role);
    } catch (err: any) {
      setError(err.message || 'Google Registration failed.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      const res = await register(formData);
      handleRoleNavigation(res.user.role);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 font-sans">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 p-10 md:p-14 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-10">
          <div className="mx-auto w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <span className="text-white font-black text-2xl">N</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Institutional Profile</h2>
          <p className="mt-2 text-sm text-slate-500 font-medium italic">Create your NextLearn digital footprint</p>
        </div>

        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} onClose={() => setError(null)} />
            {error.includes('SECURITY_BLOCK') && (
              <div className="mt-2 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl text-[10px] font-medium leading-relaxed">
                Tip: If you're seeing a security block, ensure you've set your Firestore rules to: <code className="bg-white/50 px-1 rounded font-mono text-indigo-600">allow read, create: if true;</code> for the users collection.
              </div>
            )}
          </div>
        )}

        <div className="mb-10">
          <button 
            onClick={handleGoogleRegister}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-[0.98]"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Sign up with Google
          </button>
          
          <div className="flex items-center gap-4 text-slate-300 dark:text-slate-700 mt-6">
            <div className="h-px bg-current flex-1"></div>
            <span className="text-[10px] font-black uppercase tracking-widest">or manual enrollment</span>
            <div className="h-px bg-current flex-1"></div>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">First Name</label>
              <input name="firstName" required className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white" value={formData.firstName} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Last Name</label>
              <input name="lastName" required className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white" value={formData.lastName} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Work Email</label>
            <input name="email" type="email" required className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white" value={formData.email} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Access Key</label>
              <input name="password" type="password" required className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white" value={formData.password} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Verify Key</label>
              <input name="confirmPassword" type="password" required className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white" value={formData.confirmPassword} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Account Role</label>
            <select name="role" value={formData.role} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white">
              <option value="student">Student User</option>
              <option value="teacher">Faculty Instructor</option>
              <option value="accountant">Financial Officer (Accountant)</option>
              <option value="administrator">System Administrator</option>
            </select>
          </div>

          <div className="pt-6">
            <button
              type="submit" disabled={isLoading}
              className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 h-16 flex items-center justify-center"
            >
              {isLoading ? <Spinner size="sm" /> : 'Initialize Account'}
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
          Account ready?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline">Sign in here</Link>
        </p>
      </div>
    </div>
  );
};