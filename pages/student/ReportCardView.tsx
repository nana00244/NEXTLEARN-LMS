
import React, { useState, useEffect } from 'react';
import { reportCardService } from '../../services/reportCardService';
import { useAuth } from '../../context/AuthContext';
import { getStoredStudents } from '../../services/mockDb';
import { Spinner } from '../../components/UI/Spinner';
import { ReportCard } from '../../types';

export const ReportCardView: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportCard[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const student = getStoredStudents().find(s => s.userId === user.id);
      if (student) {
        reportCardService.getReportCardsForStudent(student.id).then(data => {
          setReports(data);
          if (data.length > 0) setSelectedReport(data[0]);
          setLoading(false);
        });
      }
    }
  }, [user]);

  const handlePrint = () => window.print();

  if (loading) return <div className="p-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center no-print">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Academic Reports</h1>
          <p className="text-slate-500">Official term performance and conduct assessments</p>
        </div>
        <div className="flex gap-4">
           <select 
            className="px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-sm font-bold"
            value={selectedReport?.id}
            onChange={e => setSelectedReport(reports.find(r => r.id === e.target.value) || null)}
           >
             {reports.map(r => <option key={r.id} value={r.id}>{r.termId} - {r.academicYearId}</option>)}
           </select>
           <button 
            onClick={handlePrint}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
           >
            Download PDF / Print
           </button>
        </div>
      </header>

      {selectedReport ? (
        <div className="receipt-card bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-2xl space-y-10 relative">
           {/* Institutional Header */}
           <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8">
              <div className="flex gap-4 items-center">
                 <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-3xl">N</div>
                 <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase">NextLearn Academy</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Office of the Registrar • Term Performance Report</p>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-4xl font-black text-slate-900">{selectedReport.overallGrade}</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Term Final Grade</p>
              </div>
           </div>

           {/* Student Details Grid */}
           <div className="grid grid-cols-4 gap-6 py-6 border-b border-slate-100">
              <div className="col-span-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Student Name</p>
                 <p className="text-sm font-black text-slate-900 capitalize">{user?.firstName} {user?.lastName}</p>
              </div>
              <div className="col-span-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">ID Number</p>
                 <p className="text-sm font-black text-slate-900">SN-2023-1029</p>
              </div>
              <div className="col-span-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Academic Year</p>
                 <p className="text-sm font-black text-slate-900">2023/2024</p>
              </div>
              <div className="col-span-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Class Position</p>
                 <p className="text-sm font-black text-slate-900">{selectedReport.classRank} of {selectedReport.totalStudents}</p>
              </div>
           </div>

           {/* Performance Breakdown */}
           <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-indigo-600 pl-3">Summary Metrics</h3>
              <div className="grid grid-cols-3 gap-6">
                 <div className="p-6 bg-slate-50 rounded-3xl text-center">
                    <p className="text-3xl font-black text-slate-900">{selectedReport.overallPercentage}%</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Weighted Average</p>
                 </div>
                 <div className="p-6 bg-slate-50 rounded-3xl text-center">
                    <p className="text-3xl font-black text-slate-900">{selectedReport.attendancePercentage}%</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Attendance Record</p>
                 </div>
                 <div className="p-6 bg-slate-50 rounded-3xl text-center">
                    <p className="text-3xl font-black text-indigo-600 uppercase italic">{selectedReport.conductRating}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Conduct Rating</p>
                 </div>
              </div>
           </div>

           {/* Comments Section */}
           <div className="grid grid-cols-2 gap-10 pt-8 border-t border-slate-100">
              <div className="space-y-4">
                 <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Class Teacher's Remarks</p>
                 <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-slate-200 pl-4">
                   "{selectedReport.teacherComment}"
                 </p>
              </div>
              <div className="space-y-4">
                 <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Principal's Remarks</p>
                 <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-slate-200 pl-4">
                   "Impressive performance. Maintain this momentum in the upcoming terms to ensure placement in honors classes."
                 </p>
              </div>
           </div>

           {/* Authentication Footer */}
           <div className="flex justify-between items-end pt-16 mt-8">
              <div className="text-center">
                 <div className="w-48 border-b-2 border-slate-200 mb-2"></div>
                 <p className="text-xs font-bold text-slate-900">Class Teacher Signature</p>
              </div>
              <div className="text-center">
                 <div className="w-24 h-24 border-2 border-indigo-100 rounded-full flex items-center justify-center text-indigo-100 text-[10px] font-black uppercase mb-2 -rotate-12">
                   Institutional Seal
                 </div>
              </div>
              <div className="text-center">
                 <div className="w-48 border-b-2 border-slate-200 mb-2"></div>
                 <p className="text-xs font-bold text-slate-900">Principal Signature</p>
              </div>
           </div>
           
           <p className="text-[8px] text-slate-400 text-center italic mt-12">
             This is an automated academic transcript generated by the NextLearn Learning Management System on {new Date().toLocaleDateString()}.
           </p>
        </div>
      ) : (
        <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
           <p className="text-slate-500 italic">No report cards generated for your account yet.</p>
        </div>
      )}
    </div>
  );
};
