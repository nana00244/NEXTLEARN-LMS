
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { assignmentService } from '../../services/assignmentService';
import { Spinner } from '../../components/UI/Spinner';
import { Alert } from '../../components/UI/Alert';

export const AssignmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [files, setFiles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id && user) {
      assignmentService.getAssignmentDetails(id, user.id).then(res => {
        setData(res);
        if (res?.submission) {
            setSubmissionText(res.submission.studentText || '');
        }
        setLoading(false);
      });
    }
  }, [id, user]);

  // Fix: Explicitly type 'f' as 'File' to avoid TS unknown type errors
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded) return;
    const newFiles = Array.from(uploaded).map((f: File) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        url: URL.createObjectURL(f)
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleSubmit = async () => {
    if (!id || !user) return;
    setSubmitting(true);
    try {
        await assignmentService.submitAssignment(id, user.id, {
            text: submissionText,
            files: files
        });
        alert('Assignment submitted successfully!');
        navigate('/student/assignments');
    } catch (err) {
        setError('Submission failed. Please try again.');
    } finally {
        setSubmitting(false);
    }
  };

  if (loading) return <div className="p-20"><Spinner size="lg" /></div>;
  if (!data) return <div className="p-20 text-center">Assignment not found</div>;

  const isSubmitted = !!data.submission;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-4">
         <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">←</button>
         <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{data.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Instructions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center pb-6 border-b border-slate-50 dark:border-slate-800 mb-6">
                <div className="flex gap-8">
                   <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Due Date</p>
                       <p className="text-sm font-bold text-slate-800 dark:text-white">{new Date(data.dueDate).toLocaleDateString()} • {data.dueTime}</p>
                   </div>
                   <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Points</p>
                       <p className="text-sm font-bold text-slate-800 dark:text-white">{data.points} Possible</p>
                   </div>
                </div>
                {isSubmitted && <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">Turned In</span>}
            </div>

            <div className="prose dark:prose-invert max-w-none">
                <h3 className="text-sm font-bold uppercase text-slate-400 mb-2">Instructions</h3>
                <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{data.instructions || data.description}</p>
            </div>

            {data.attachments && data.attachments.length > 0 && (
              <div className="mt-8">
                 <h3 className="text-sm font-bold uppercase text-slate-400 mb-4">Reference Materials</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {data.attachments.map((att: any) => (
                      <div key={att.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <span className="text-2xl">📄</span>
                        <div className="flex-1 overflow-hidden">
                           <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{att.fileName}</p>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Submission Box */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden sticky top-24">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
               <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Work</h2>
               {isSubmitted && data.submission.isLate && <p className="text-[10px] font-bold text-rose-500 uppercase mt-1">Submitted Late</p>}
            </div>
            
            <div className="p-6 space-y-4">
                {/* Submission Form */}
                <textarea
                  rows={4}
                  placeholder="Type your response here..."
                  className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 text-sm outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white resize-none"
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  disabled={isSubmitted}
                />

                <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                
                {!isSubmitted && (
                   <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-500 hover:border-indigo-600 hover:text-indigo-600 transition-all"
                   >
                    + Add or Create Files
                   </button>
                )}

                {/* Files List */}
                <div className="space-y-2">
                    {files.map((f, i) => (
                        <div key={i} className="flex justify-between items-center p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-xs">
                            <span className="truncate flex-1">📎 {f.name}</span>
                            {!isSubmitted && <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-rose-500 font-bold ml-2">×</button>}
                        </div>
                    ))}
                    {isSubmitted && data.submission.attachments.map((f: any, i: number) => (
                        <div key={i} className="flex items-center p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                             <span className="truncate">📎 {f.name}</span>
                        </div>
                    ))}
                </div>

                <div className="pt-4">
                    <button 
                      onClick={handleSubmit}
                      disabled={isSubmitted || submitting}
                      className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 dark:shadow-none disabled:opacity-50"
                    >
                      {submitting ? <Spinner size="sm" /> : isSubmitted ? 'Resubmit' : 'Turn In'}
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-4">By turning in, you confirm this is your own work.</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
