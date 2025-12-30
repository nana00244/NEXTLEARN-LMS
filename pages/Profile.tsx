
import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/UI/Alert';
import { Spinner } from '../components/UI/Spinner';

export const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });

  if (!user) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await updateProfile(formData);
      setLoading(false);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setLoading(false);
      setError('Failed to update profile.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit for base64 storage simulation
      setError('Image size should be less than 2MB.');
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        await updateProfile({ profilePicture: base64String });
        setSuccess('Profile picture updated!');
      } catch (err) {
        setError('Failed to upload image.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Profile Settings</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your personal information and preferences</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Edit Profile
          </button>
        )}
      </header>

      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Quick Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="relative inline-block group">
              <div className="w-32 h-32 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-4xl font-bold text-indigo-600 mb-4 border-4 border-white dark:border-slate-800 shadow-xl mx-auto overflow-hidden">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{user.firstName[0]}{user.lastName[0]}</span>
                )}
                {loading && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Spinner size="sm" />
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
              <button 
                onClick={triggerFileInput}
                className="absolute bottom-4 right-0 w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 shadow-sm hover:scale-110 transition-transform z-10"
                title="Change Profile Picture"
              >
                📷
              </button>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.firstName} {user.lastName}</h2>
            <p className="text-sm text-slate-500 capitalize mb-6">{user.role}</p>
            
            <div className="flex justify-center gap-4">
               <div className="text-center">
                 <p className="text-lg font-bold text-slate-800 dark:text-white">100%</p>
                 <p className="text-[10px] uppercase text-slate-400 font-bold">Completed</p>
               </div>
               <div className="w-px bg-slate-100 dark:bg-slate-800"></div>
               <div className="text-center">
                 <p className="text-lg font-bold text-slate-800 dark:text-white">Active</p>
                 <p className="text-[10px] uppercase text-slate-400 font-bold">Status</p>
               </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">Security</h3>
            <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors">
              🔒 Change Password
            </button>
            <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors">
              📱 Two-Factor Auth
            </button>
          </div>
        </div>

        {/* Right Column: Detailed Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-2">First Name</label>
                  <input 
                    type="text" 
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 ring-1 ring-slate-200 dark:ring-slate-700 text-slate-900 dark:text-white disabled:opacity-60 transition-all outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-2">Last Name</label>
                  <input 
                    type="text" 
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 ring-1 ring-slate-200 dark:ring-slate-700 text-slate-900 dark:text-white disabled:opacity-60 transition-all outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">Email Address</label>
                <input 
                  type="email" 
                  defaultValue={user.email} 
                  disabled
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 ring-1 ring-slate-200 dark:ring-slate-700 text-slate-900 dark:text-white opacity-60 cursor-not-allowed outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">Phone Number</label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 ring-1 ring-slate-200 dark:ring-slate-700 text-slate-900 dark:text-white disabled:opacity-60 transition-all outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {isEditing && (
                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                  >
                    {loading ? <Spinner size="sm" /> : 'Save Changes'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
