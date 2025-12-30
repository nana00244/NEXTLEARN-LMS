
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

  if (!user) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome back, {user.firstName}!</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 capitalize">{user.role} Dashboard • Academic Hub</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Notifications" value="4" icon="🔔" color="amber" />
        <StatCard label="Active Classes" value="12" icon="🏫" color="indigo" />
        <StatCard label="Attendance" value="98%" icon="✅" color="emerald" />
        <StatCard label="Term Progress" value="65%" icon="📉" color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Campus Announcements</h2>
            <span className="text-[10px] font-bold text-indigo-600 uppercase">View All</span>
          </div>
          
          <div className="space-y-4">
            {loading ? <Spinner /> : announcements.map(a => (
              <div key={a.id} className="flex gap-4 items-start p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all">
                <div className={`w-10 h-10 rounded-xl ${a.priority === 'high' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'} flex items-center justify-center shrink-0`}>
                  {a.priority === 'high' ? '⚡' : '📢'}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{a.title}</p>
                    <span className="text-[10px] text-slate-400">{new Date(a.postedDate).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{a.content}</p>
                </div>
              </div>
            ))}
            {!loading && announcements.length === 0 && <p className="text-sm text-slate-400 italic text-center py-8">No active announcements</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Upcoming Events</h2>
          <div className="space-y-3">
            <div className="p-3 border-l-4 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10 rounded-r-xl">
              <p className="text-xs font-bold text-indigo-600 uppercase mb-1">Dec 15</p>
              <p className="text-sm font-bold text-slate-800 dark:text-white">Term 1 Final Exams</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">All Grade Levels</p>
            </div>
            <div className="p-3 border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 rounded-r-xl">
              <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Jan 05</p>
              <p className="text-sm font-bold text-slate-800 dark:text-white">Winter Break Ends</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Classes Resume</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; icon: string; color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
      </div>
      <div className="text-2xl">{icon}</div>
    </div>
  </div>
);
