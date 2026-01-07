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

  if (loading) return <div className="p-20 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-10">
      <header className="page-header">
        <h1 className="page-title">Institutional Intelligence</h1>
        <p className="page-subtitle">Master Administration & Command Center</p>
      </header>

      <div className="stats-grid">
        <StatCard label="Enrollment" value={stats.studentsCount} icon="🎓" colorClass="blue" />
        <StatCard label="Faculty" value={stats.staffCount} icon="👥" colorClass="green" />
        <StatCard label="Class Units" value={stats.classesCount} icon="🏫" colorClass="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
           <div className="card-header">
              <h2 className="card-title">Recent Activity</h2>
              <button className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Global Trail</button>
           </div>
           <div className="card-body">
             <div className="space-y-8">
                {stats.recentActivity.map((act: any) => (
                  <div key={act.id} className="flex gap-6 group">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                      ✨
                    </div>
                    <div className="flex-1 py-1">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-snug">{act.text}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest">{act.time}</p>
                    </div>
                  </div>
                ))}
             </div>
           </div>
        </div>

        <div className="card">
           <div className="card-header">
              <h2 className="card-title">System Telemetry</h2>
           </div>
           <div className="card-body">
             <div className="space-y-10">
                <HealthItem label="Firestore Storage" percentage={14} color="bg-indigo-600" />
                <HealthItem label="Auth Latency" percentage={45} color="bg-emerald-600" />
                <HealthItem label="API Availability" percentage={99} color="bg-amber-500" />
             </div>
             <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Service Notice</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic leading-relaxed">Infrastructure baseline synchronization successful. Cloud endpoints operational.</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; icon: string; colorClass: string }> = ({ label, value, icon, colorClass }) => (
  <div className="stat-card">
    <div className={`stat-card-icon ${colorClass}`}>
      {icon}
    </div>
    <p className="stat-card-label">{label}</p>
    <p className="stat-card-value">{value}</p>
  </div>
);

const HealthItem: React.FC<{ label: string; percentage: number; color: string }> = ({ label, percentage, color }) => (
  <div>
    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-3">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-900 dark:text-white">{percentage}%</span>
    </div>
    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
      <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
    </div>
  </div>
);