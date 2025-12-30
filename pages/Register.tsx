
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
    role: 'student' as UserRole,
    phone: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      return "First and last names are required.";
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return "Please enter a valid email address.";
    }

    if (formData.password.length < 6) {
      return "Password must be at least 6 characters long.";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    console.log("[Register] Form submitted. Data:", { ...formData, password: '***' });
    
    const validationError = validateForm();
    if (validationError) {
      console.warn("[Register] Validation failed:", validationError);
      setError(validationError);
      return;
    }
    
    try {
      console.log("[Register] Calling register context function...");
      const result = await register(formData);
      console.log("[Register] Registration call finished. Result:", result);

      if (result?.emailConfirmationRequired) {
        setSuccess("Success! A confirmation link has been sent to your email. Please verify your account before logging in.");
        // Clear form to allow new registration or visual cleanup
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          role: 'student',
          phone: '',
        });
      } else {
        console.log("[Register] Registration successful, redirecting...");
        navigate('/');
      }
    } catch (err: any) {
      console.error("[Register] Error caught in component:", err);
      setError(err.message || 'Registration failed. Check console for details.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Create Account</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Join the NextLearn community today</p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

        <form className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
          <div className="space-y-4 md:col-span-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">First Name</label>
            <input
              name="firstName"
              required
              disabled={isLoading}
              value={formData.firstName}
              onChange={handleChange}
              className="block w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 ring-1 ring-slate-200 dark:ring-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none disabled:opacity-50"
            />
          </div>

          <div className="space-y-4 md:col-span-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Last Name</label>
            <input
              name="lastName"
              required
              disabled={isLoading}
              value={formData.lastName}
              onChange={handleChange}
              className="block w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 ring-1 ring-slate-200 dark:ring-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none disabled:opacity-50"
            />
          </div>

          <div className="space-y-4 md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
            <input
              name="email"
              type="email"
              required
              disabled={isLoading}
              value={formData.email}
              onChange={handleChange}
              className="block w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 ring-1 ring-slate-200 dark:ring-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none disabled:opacity-50"
            />
          </div>

          <div className="space-y-4 md:col-span-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Account Type</label>
            <select
              name="role"
              disabled={isLoading}
              value={formData.role}
              onChange={handleChange}
              className="block w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 ring-1 ring-slate-200 dark:ring-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none disabled:opacity-50"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="administrator">Administrator</option>
              <option value="accountant">Accountant</option>
            </select>
          </div>

          <div className="space-y-4 md:col-span-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Phone (Optional)</label>
            <input
              name="phone"
              disabled={isLoading}
              value={formData.phone}
              onChange={handleChange}
              className="block w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 ring-1 ring-slate-200 dark:ring-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none disabled:opacity-50"
            />
          </div>

          <div className="space-y-4 md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
            <input
              name="password"
              type="password"
              required
              disabled={isLoading}
              value={formData.password}
              onChange={handleChange}
              className="block w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 ring-1 ring-slate-200 dark:ring-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none disabled:opacity-50"
            />
            <p className="text-[10px] text-slate-400 mt-1 italic">Minimum 6 characters required.</p>
          </div>

          <div className="md:col-span-2 mt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-70 transition-all flex justify-center items-center h-12"
            >
              {isLoading ? <Spinner size="sm" /> : 'Create Account'}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
