
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Spinner } from '../../components/UI/Spinner';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const data = await adminService.getStats();
      setStats(data);
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Overview</h1>
        <p className="text-slate-500 dark:text-slate-400">Real-time status of your academic institution</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Students" value={stats.studentsCount} icon="🎓" color="bg-indigo-500" />
        <StatCard label="Total Staff" value={stats.staffCount} icon="👥" color="bg-rose-500" />
        <StatCard label="Active Classes" value={stats.classesCount} icon="🏫" color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
           <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Recent Activities</h2>
           <div className="space-y-6">
              {stats.recentActivity.map((act: any) => (
                <div key={act.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-sm">
                    ✨
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{act.text}</p>
                    <p className="text-xs text-slate-400 mt-1">{act.time}</p>
                  </div>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
           <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">System Health</h2>
           <div className="space-y-4">
              <HealthItem label="Database Storage" percentage={14} color="bg-indigo-600" />
              <HealthItem label="User Load" percentage={45} color="bg-emerald-600" />
              <HealthItem label="Server Uptime" percentage={99} color="bg-amber-600" />
           </div>
           <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Notice Board</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">Term end maintenance scheduled for Saturday midnight.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; icon: string; color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-slate-400 mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-900 dark:text-white">{value}</p>
    </div>
    <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-slate-100 dark:shadow-none text-white`}>
      {icon}
    </div>
  </div>
);

const HealthItem: React.FC<{ label: string; percentage: number; color: string }> = ({ label, percentage, color }) => (
  <div>
    <div className="flex justify-between text-sm mb-2">
      <span className="text-slate-600 dark:text-slate-400 font-medium">{label}</span>
      <span className="font-bold text-slate-800 dark:text-white">{percentage}%</span>
    </div>
    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
    </div>
  </div>
);
