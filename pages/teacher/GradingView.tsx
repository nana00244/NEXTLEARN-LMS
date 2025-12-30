
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gradingService } from '../../services/gradingService';
import { Spinner } from '../../components/UI/Spinner';
import { Alert } from '../../components/UI/Alert';
import { Submission, Assignment } from '../../types';

export const GradingView: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [grade, setGrade] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!submissionId) return;
      const allSubs = JSON.parse(localStorage.getItem('nextlearn_mock_db_submissions') || '[]');
      const sub = allSubs.find((s: any) => s.id === submissionId);
      if (sub) {
        // Hydrate
        const users = JSON.parse(localStorage.getItem('nextlearn_mock_db_users') || '[]');
        const students = JSON.parse(localStorage.getItem('nextlearn_mock_db_students') || '[]');
        const assignments = JSON.parse(localStorage.getItem('nextlearn_mock_db_assignments') || '[]');
        
        const student = students.find((st: any) => st.id === sub.studentId);
        const user = users.find((u: any) => u.id === student?.userId);
        const assignment = assignments.find((a: any) => a.id === sub.assignmentId);

        setSubmission({ ...sub, user, assignment });
        setGrade(sub.grade?.toString() || '');
        setFeedback(sub.feedback || '');
      }
      setLoading(false);
    };
    fetchData();
  }, [submissionId]);

  const handleSave = async (status: 'graded' | 'returned') => {
    if (!submissionId) return;
    setIsSaving(true);
    try {
      await gradingService.gradeSubmission(submissionId, {
        grade: parseFloat(grade),
        feedback,
        status
      });
      alert(status === 'returned' ? 'Work returned to student!' : 'Grade saved as draft.');
      navigate(-1);
    } catch (err) {
      alert('Error saving grade.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-20"><Spinner size="lg" /></div>;
  if (!submission) return <div className="p-20 text-center">Submission not found.</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">←</button>
           <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{submission.user?.firstName} {submission.user?.lastName}</h1>
              <p className="text-xs text-slate-500">{submission.assignment?.title}</p>
           </div>
        </div>
        <div className="flex gap-3">
          <button 
            disabled={isSaving}
            onClick={() => handleSave('graded')}
            className="px-6 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 transition-all text-sm"
          >
            Save Draft
          </button>
          <button 
            disabled={isSaving}
            onClick={() => handleSave('returned')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all text-sm"
          >
            Return Work
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        {/* Left: Content Viewer */}
        <div className="lg:col-span-8 overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 space-y-8">
           <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Student Response</h3>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap min-h-[200px]">
                {submission.studentText || <span className="italic text-slate-400">No text provided.</span>}
              </div>
           </div>

           {submission.attachments && submission.attachments.length > 0 && (
             <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Attached Files</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {submission.attachments.map((file: any, i: number) => (
                     <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-3">
                           <span className="text-2xl">📄</span>
                           <div className="overflow-hidden">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                              <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                           </div>
                        </div>
                        <a href={file.url} download className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">⬇️</a>
                     </div>
                   ))}
                </div>
             </div>
           )}
        </div>

        {/* Right: Grading Panel */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col shadow-sm">
           <div className="space-y-6">
              <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Grade Points</label>
                 <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 text-2xl font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-600"
                      placeholder="0"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                    />
                    <span className="text-slate-400 font-bold">/ {submission.assignment?.points}</span>
                 </div>
              </div>

              <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Feedback to Student</label>
                 <textarea 
                   rows={10}
                   className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 text-sm outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white resize-none"
                   placeholder="Type your feedback here..."
                   value={feedback}
                   onChange={(e) => setFeedback(e.target.value)}
                 />
              </div>

              {submission.isLate && (
                <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-800">
                   <p className="text-xs font-bold text-rose-600">Note: Submission was LATE</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
