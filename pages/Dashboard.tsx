import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { academicService } from '../services/academicService';
import { Spinner } from '../components/UI/Spinner';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      academicService.getAnnouncements(user.role).then(data => {
        setAnnouncements(data);
        setLoading(false);
      });
    }
  }, [user]);

  if (loading) return <div className="p-20 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-black">Dashboard</h1>
        <p className="text-gray-500 font-medium">Institutional overview for {user?.firstName} {user?.lastName}</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card-label">Profile Status</span>
          <span className="stat-card-value text-indigo-600">Active</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Role Permissions</span>
          <span className="stat-card-value capitalize">{user?.role}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Last Login</span>
          <span className="stat-card-value text-sm">Today, {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex justify-between items-center">
          <span>Campus Bulletin</span>
          <button className="text-xs text-indigo-600 uppercase font-black">View All</button>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            {announcements.map(a => (
              <div key={a.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-transparent hover:border-indigo-100 transition-all">
                <div className="flex justify-between mb-1">
                  <h3 className="font-bold text-sm">{a.title || 'Announcement'}</h3>
                  <span className="text-[10px] text-gray-400 font-bold">{new Date(a.postedDate).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{a.content}</p>
              </div>
            ))}
            {announcements.length === 0 && (
              <div className="py-12 text-center text-gray-400 italic text-sm">
                No recent announcements to display.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};