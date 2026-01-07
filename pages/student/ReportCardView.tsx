import React, { useState, useEffect } from 'react';
import { reportCardService } from '../../services/reportCardService';
import { useAuth } from '../../context/AuthContext';
import { getStoredStudents } from '../../services/mockDb';
import { Spinner } from '../../components/UI/Spinner';
import { ReportCard } from '../../types';
import { printService } from '../../services/printService';

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

  const handlePrint = () => {
    if (!selectedReport) return;
    printService.printReportCard(user, selectedReport);
  };

  if (loading) return <div className="p-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Academic Reports</h1>
          <p className="text-slate-500">Official term performance and conduct assessments</p>
        </div>
        <div className="flex gap-4">
           <select 
            className="px-5 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
            value={selectedReport?.id}
            onChange={e => setSelectedReport(reports.find(r => r.id === e.target.value) || null)}
           >
             {reports.map(r => <option key={r.id} value={r.id}>{r.termId} - {r.academicYearId}</option>)}
           </select>
           <button 
            onClick={handlePrint}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-none"
           >
            Generate Transcript
           </button>
        </div>
      </header>

      {selectedReport ? (
        <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-2xl space-y-10 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
           {/* Decorative Elements */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
           
           {/* Institutional Header */}
           <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-slate-900 pb-10 relative z-10">
              <div className="flex gap-6 items-center mb-6 md:mb-0">
                 <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white font-black text-4xl shadow-xl">N</div>
                 <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">NextLearn Academy</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Registrar's Office • Performance Appraisal</p>
                 </div>
              </div>
              <div className="text-right">
                 <div className="inline-block p-4 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-5xl font-black text-slate-900">{selectedReport.overallGrade}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Final Grade</p>
                 </div>
              </div>
           </div>

           {/* Student Details Grid */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 border-b border-slate-100">
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Student Name</p>
                 <p className="text-sm font-black text-slate-900 capitalize">{user?.firstName} {user?.lastName}</p>
              </div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Admission No.</p>
                 <p className="text-sm font-mono font-black text-slate-900">SN-2024-REG</p>
              </div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Academic Year</p>
                 <p className="text-sm font-black text-slate-900">2024/2025</p>
              </div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Class Rank</p>
                 <p className="text-sm font-black text-indigo-600">{selectedReport.classRank} of {selectedReport.totalStudents}</p>
              </div>
           </div>

           {/* Performance Breakdown */}
           <div className="space-y-8">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] border-l-4 border-indigo-600 pl-4">Metrical Appraisal</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="p-8 bg-slate-50 rounded-[2.5rem] text-center border border-slate-100 hover:scale-105 transition-transform duration-500">
                    <p className="text-4xl font-black text-slate-900">{selectedReport.overallPercentage}%</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Weighted Average</p>
                 </div>
                 <div className="p-8 bg-slate-50 rounded-[2.5rem] text-center border border-slate-100 hover:scale-105 transition-transform duration-500">
                    <p className="text-4xl font-black text-slate-900">{selectedReport.attendancePercentage}%</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Attendance Rating</p>
                 </div>
                 <div className="p-8 bg-indigo-50 rounded-[2.5rem] text-center border border-indigo-100 hover:scale-105 transition-transform duration-500 shadow-lg shadow-indigo-100">
                    <p className="text-4xl font-black text-indigo-600 uppercase italic tracking-tighter">{selectedReport.conductRating}</p>
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-2">Conduct Status</p>
                 </div>
              </div>
           </div>

           {/* Comments Section */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10 border-t border-slate-100">
              <div className="space-y-4">
                 <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Instructor's Assessment</p>
                 <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-slate-200 pl-6 py-2">
                   "{selectedReport.teacherComment}"
                 </p>
              </div>
              <div className="space-y-4">
                 <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Administrative Review</p>
                 <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-slate-200 pl-6 py-2">
                   "A commendable performance this term. The student has demonstrated a strong aptitude for subject-specific analysis. Continued engagement is expected for the next semester."
                 </p>
              </div>
           </div>

           {/* Authentication Footer */}
           <div className="flex flex-col md:flex-row justify-between items-center md:items-end pt-20 mt-10 gap-10">
              <div className="text-center w-full md:w-auto">
                 <div className="w-full md:w-64 border-b-2 border-slate-200 mb-3"></div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Faculty Signature</p>
              </div>
              <div className="text-center shrink-0">
                 <div className="w-28 h-28 border-2 border-indigo-100 rounded-full flex items-center justify-center text-indigo-100 text-[8px] font-black uppercase text-center p-4 -rotate-12 select-none shadow-inner">
                   Institutional Registry Seal
                 </div>
              </div>
              <div className="text-center w-full md:w-auto">
                 <div className="w-full md:w-64 border-b-2 border-slate-200 mb-3"></div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Principal Signature</p>
              </div>
           </div>
           
           <p className="text-[7px] text-slate-300 text-center uppercase font-black tracking-[0.5em] mt-16 select-none">
             Certified Digital Transcript • Verified on NextLearn Cloud Ledger
           </p>
        </div>
      ) : (
        <div className="py-32 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
           <div className="text-6xl mb-6 opacity-10">📜</div>
           <h3 className="text-xl font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">No Reports Found</h3>
           <p className="text-sm text-slate-400 italic">Official term assessments will appear here once finalized by the Registrar.</p>
        </div>
      )}
    </div>
  );
};