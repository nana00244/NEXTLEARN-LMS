import React, { useState, useEffect, useRef } from 'react';
import { teacherService } from '../../../services/teacherService';
import { assignmentService } from '../../../services/assignmentService';
import { useAuth } from '../../../context/AuthContext';
import { Spinner } from '../../../components/UI/Spinner';
import { Announcement, Assignment, Class } from '../../../types';
import { useNavigate } from 'react-router-dom';

export const ClassStreamTab: React.FC<{ classId: string; subjectId: string }> = ({ classId, subjectId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [upcoming, setUpcoming] = useState<Assignment[]>([]);
  const [classInfo, setClassInfo] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [pastPosts, setPastPosts] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshFeed = async () => {
    setLoading(true);
    const [aData, uData, cData] = await Promise.all([
      teacherService.getClassAnnouncements(classId, subjectId),
      assignmentService.getTeacherAssignments(user!.id),
      teacherService.getClassById(classId)
    ]);
    
    // Upcoming widget query
    const now = new Date();
    const next7Days = new Date();
    next7Days.setDate(now.getDate() + 7);

    const filteredUpcoming = uData
      .filter(a => a.classId === classId)
      .filter(a => {
        const dDate = new Date(a.dueDate);
        return dDate >= now && dDate <= next7Days;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    // Sync: Merge and update stream
    const classAssignments = uData.filter(a => a.classId === classId);
    
    // Fix: Using type casting to safely handle mixed stream items during sorting and property access
    const streamItems = [
      ...aData.map(a => ({ ...a, streamType: 'announcement' })),
      ...classAssignments.map(a => ({ 
        ...a, 
        streamType: 'assignment_card', 
        content: `posted a new assignment: ${a.title}`,
        postedDate: (a as any).createdAt 
      }))
    ].sort((a: any, b: any) => {
      const dateA = new Date(a.postedDate || a.createdAt).getTime();
      const dateB = new Date(b.postedDate || b.createdAt).getTime();
      return dateB - dateA;
    });

    setAnnouncements(streamItems as any);
    setUpcoming(filteredUpcoming);
    setClassInfo(cData);
    setLoading(false);
  };

  useEffect(() => { refreshFeed(); }, [classId, subjectId]);

  const handlePost = async () => {
    if (!content.trim()) return;
    const mockAttachments = attachments.map(file => ({ name: file.name, size: file.size, type: file.type, url: '#' }));
    await teacherService.postAnnouncement(classId, subjectId, user!.id, content, mockAttachments);
    setContent('');
    setAttachments([]);
    setIsExpanded(false);
    refreshFeed();
  };

  const handleRepost = (post: any) => {
    setContent(post.content || post.instructions || '');
    setIsExpanded(true);
    setShowRepostModal(false);
  };

  const openRepost = async () => {
    const history = await teacherService.getClassAnnouncements(classId, subjectId);
    setPastPosts(history);
    setShowRepostModal(true);
  };

  if (loading && !classInfo) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="relative h-64 w-full rounded-2xl bg-indigo-600 overflow-hidden shadow-md group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/40 to-transparent"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-60"></div>
        
        <div className="absolute bottom-0 left-0 p-10 text-white z-10">
          <h1 className="text-5xl font-black tracking-tight mb-2 drop-shadow-sm">{classInfo?.name}</h1>
          <p className="text-xl font-medium opacity-90">{classInfo?.section} • Academic Year 2024</p>
        </div>

        <button className="absolute top-6 right-6 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-2 opacity-0 group-hover:opacity-100">
           🎨 Customize
        </button>

        <div className="absolute top-6 left-6 z-20">
          <div 
            className={`bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 transition-all duration-300 w-fit ${showCode ? 'ring-2 ring-white/50' : 'cursor-pointer hover:bg-white/20'}`}
            onClick={() => !showCode && setShowCode(true)}
          >
            <div className="flex items-center gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/70">Class Code</p>
                <p className="text-2xl font-mono font-bold text-white tracking-tighter">{classInfo?.classCode}</p>
              </div>
              {showCode ? (
                <button onClick={(e) => { e.stopPropagation(); setShowCode(false); }} className="text-white/60 hover:text-white text-xl ml-4">×</button>
              ) : (
                <span className="text-white/40">🔍</span>
              )}
            </div>
            {showCode && (
              <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(classInfo?.classCode || ''); }}
                  className="w-full py-2 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors"
                >
                  Copy Link
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Upcoming</h3>
             <div className="space-y-6">
                {upcoming.length > 0 ? upcoming.map(a => (
                  <div key={a.id} className="group cursor-pointer">
                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-1">
                      Due {new Date(a.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors leading-snug">{a.title}</p>
                  </div>
                )) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-slate-400 italic">No work due soon</p>
                  </div>
                )}
                <button className="w-full mt-4 py-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors text-left pl-2">View All</button>
             </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
            {!isExpanded ? (
              <div className="p-4 flex items-center justify-between">
                <div 
                  onClick={() => setIsExpanded(true)}
                  className="flex-1 flex items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-xl transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold">
                    {user?.firstName[0]}
                  </div>
                  <span className="text-sm text-slate-400 font-medium italic">Announce something to your class</span>
                </div>
                <button 
                  onClick={openRepost}
                  className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition-all"
                  title="Repost from database entries"
                >
                  🔄
                </button>
              </div>
            ) : (
              <div className="p-8 space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Announcement</span>
                  <button onClick={openRepost} className="text-[10px] font-bold text-indigo-600 hover:underline uppercase">Repost Past Entry</button>
                </div>
                <textarea 
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl p-5 text-sm outline-none focus:border-indigo-600/20 focus:ring-4 focus:ring-indigo-600/5 dark:text-white resize-none transition-all min-h-[120px]"
                  placeholder="Share with your class..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />

                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 py-2">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg text-xs">
                        <span className="text-indigo-600 truncate max-w-[150px]">📎 {file.name}</span>
                        <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="text-rose-500 font-bold">&times;</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                   <div>
                     <input type="file" multiple className="hidden" ref={fileInputRef} onChange={e => e.target.files && setAttachments(prev => [...prev, ...Array.from(e.target.files!)])} />
                     <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:text-indigo-600 hover:bg-indigo-50 transition-all text-sm font-bold">📎 Add Material</button>
                   </div>
                   <div className="flex gap-4">
                      <button onClick={() => { setIsExpanded(false); setAttachments([]); setContent(''); }} className="px-6 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
                      <button onClick={handlePost} disabled={!content.trim()} className="px-10 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50">Post</button>
                   </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {announcements.map((a: any) => (
              <div 
                key={a.id} 
                onClick={() => a.streamType === 'assignment_card' && navigate(`/teacher/assignments/${a.id}/submissions`)}
                className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden group transition-all ${a.streamType === 'assignment_card' ? 'cursor-pointer hover:border-indigo-600/30 hover:shadow-md' : ''}`}
              >
                 <div className="p-6">
                    <div className="flex items-center gap-4 mb-5">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm uppercase shadow-sm ${a.streamType === 'assignment_card' ? 'bg-emerald-500' : 'bg-indigo-600'}`}>
                          {a.streamType === 'assignment_card' ? '📝' : user?.firstName[0]}
                        </div>
                        <div>
                           <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">
                             {user?.firstName} {user?.lastName} {a.streamType === 'assignment_card' && <span className="font-normal text-slate-500">{a.content}</span>}
                           </p>
                           <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                             {new Date(a.postedDate || a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                           </p>
                        </div>
                    </div>
                    {a.streamType === 'announcement' && (
                      <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                         {a.content}
                      </div>
                    )}
                    {a.attachments && a.attachments.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {a.attachments.map((att: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                            <span className="text-xl">{att.icon || '📄'}</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{att.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
                 <div className="px-6 py-4 border-t border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                    <button className="text-[10px] font-black text-slate-400 uppercase hover:text-indigo-600 tracking-widest transition-colors">
                      {a.streamType === 'assignment_card' ? 'View Grading Workflow' : 'Add class comment'}
                    </button>
                 </div>
              </div>
            ))}
            
            {announcements.length === 0 && !loading && (
              <div className="py-24 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem]">
                <div className="text-6xl opacity-10 mb-4">📢</div>
                <p className="text-slate-400 font-medium italic">Class feed is empty.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showRepostModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-10">
                <div>
                   <h2 className="text-3xl font-black text-slate-900 dark:text-white">Repost Content</h2>
                   <p className="text-sm text-slate-400">Recycle previous announcements or assignments</p>
                </div>
                <button onClick={() => setShowRepostModal(false)} className="w-12 h-12 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-2xl text-slate-400">&times;</button>
             </div>
             
             <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-3 custom-scrollbar">
                {pastPosts.map(post => (
                  <div 
                    key={post.id} 
                    onClick={() => handleRepost(post)}
                    className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-2 border-transparent hover:border-indigo-600/20 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{post.type || 'Announcement'}</p>
                      <p className="text-[10px] font-bold text-slate-400">{new Date(post.postedDate || post.createdAt).toLocaleDateString()}</p>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed font-medium">
                      {post.content || post.instructions || post.title}
                    </p>
                  </div>
                ))}
                {pastPosts.length === 0 && <p className="text-center py-20 text-slate-400 italic">No post history found.</p>}
             </div>
             <div className="mt-10">
                <button onClick={() => setShowRepostModal(false)} className="w-full py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};