
import React, { useState, useEffect, useRef } from 'react';
import { teacherService } from '../../../services/teacherService';
import { assignmentService } from '../../../services/assignmentService';
import { useAuth } from '../../../context/AuthContext';
import { Spinner } from '../../../components/UI/Spinner';
import { Topic, Assignment, Student, Class } from '../../../types';
import { useNavigate } from 'react-router-dom';

type ModalType = 'assignment' | 'question' | 'material' | 'topic' | null;
type AttachmentType = 'drive' | 'youtube' | 'create' | 'upload' | 'link' | null;

export const ClassworkTab: React.FC<{ classId: string; subjectId: string }> = ({ classId, subjectId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Attachment Logic States
  const [activeAttachmentModal, setActiveAttachmentModal] = useState<AttachmentType>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [ytUrl, setYtUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [workForm, setWorkForm] = useState({
    title: '',
    instructions: '',
    points: 100,
    dueDate: '',
    dueTime: '23:59',
    topicId: '',
    targetClassIds: [classId],
    selectedStudentIds: [] as string[],
  });
  const [topicName, setTopicName] = useState('');

  const fetchData = async () => {
    const [tData, aData, cData, pData] = await Promise.all([
      teacherService.getTopics(classId, subjectId),
      assignmentService.getTeacherAssignments(user!.id),
      teacherService.getAssignedClasses(user!.id),
      teacherService.getClassPeople(classId)
    ]);
    setTopics(tData);
    setAssignments(aData.filter(a => a.classId === classId));
    setClasses(cData);
    setStudents(pData.students);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [classId, subjectId]);

  const handleCreateWork = async (status: 'published' | 'scheduled' | 'draft' = 'published') => {
    if (!modalType || modalType === 'topic') return;
    if (!workForm.title.trim()) return;
    
    setProcessing(true);
    try {
      if (editingId) {
        await assignmentService.updateAssignment(editingId, {
          ...workForm,
          attachments,
          status
        });
      } else {
        const newAssignment = await assignmentService.createAssignment({
          ...workForm,
          attachments,
          type: modalType as any,
          classId,
          subjectId,
          teacherId: user!.id,
          status: status
        });

        if (status === 'published') {
          await teacherService.postAnnouncement(
            classId, 
            subjectId, 
            user!.id, 
            `posted a new ${modalType}: "${workForm.title}"`,
            attachments
          );
        }
      }

      setModalType(null);
      setEditingId(null);
      resetForms();
      fetchData();
    } catch (err) {
      alert('Failed to save content');
    } finally {
      setProcessing(false);
    }
  };

  const resetForms = () => {
    setWorkForm({
      title: '',
      instructions: '',
      points: 100,
      dueDate: '',
      dueTime: '23:59',
      topicId: '',
      targetClassIds: [classId],
      selectedStudentIds: [],
    });
    setAttachments([]);
    setTopicName('');
  };

  const handleEditAssignment = (item: Assignment) => {
    setEditingId(item.id);
    setModalType(item.type);
    setWorkForm({
      title: item.title,
      instructions: item.instructions,
      points: item.points,
      dueDate: item.dueDate,
      dueTime: item.dueTime,
      topicId: item.topicId || '',
      targetClassIds: [item.classId],
      selectedStudentIds: [],
    });
    setAttachments(item.attachments || []);
  };

  const handleDeleteAssignment = async () => {
    if (deleteConfirm) {
      await assignmentService.deleteAssignment(deleteConfirm);
      setDeleteConfirm(null);
      fetchData();
    }
  };

  // Attachment Actions
  const addLink = () => {
    if (!linkUrl.match(/^https?:\/\/.+/)) return;
    const newAttachment = {
      type: 'link',
      title: linkUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0],
      url: linkUrl,
      icon: '🔗'
    };
    setAttachments([...attachments, newAttachment]);
    setLinkUrl('');
    setActiveAttachmentModal(null);
  };

  const addYoutube = () => {
    if (!ytUrl.trim()) return;
    const newAttachment = {
      type: 'youtube',
      title: 'YouTube Video Resource',
      url: ytUrl,
      icon: '🎥'
    };
    setAttachments([...attachments, newAttachment]);
    setYtUrl('');
    setActiveAttachmentModal(null);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadProgress(10);
    const timer = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          const newAtts = Array.from(files).map(f => ({
            type: 'file',
            title: f.name,
            size: f.size,
            icon: '📄'
          }));
          setAttachments([...attachments, ...newAtts]);
          setUploadProgress(0);
          setActiveAttachmentModal(null);
          return 0;
        }
        return prev + 15;
      });
    }, 200);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Create Toolbar */}
      <div className="flex justify-between items-center sticky top-32 z-30 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md py-4 -mt-4">
        <div className="relative">
          <button 
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="px-8 py-3 bg-indigo-600 text-white rounded-full font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-3"
          >
            <span className="text-2xl leading-none">+</span> Create
          </button>
          
          {showCreateMenu && (
            <div className="absolute left-0 mt-3 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 py-3 animate-in fade-in zoom-in-95 duration-200">
               <CreateMenuItem icon="📝" label="Assignment" onClick={() => { resetForms(); setEditingId(null); setModalType('assignment'); setShowCreateMenu(false); }} />
               <CreateMenuItem icon="❓" label="Question" onClick={() => { resetForms(); setEditingId(null); setModalType('question'); setShowCreateMenu(false); }} />
               <CreateMenuItem icon="📄" label="Material" onClick={() => { resetForms(); setEditingId(null); setModalType('material'); setShowCreateMenu(false); }} />
               <div className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-4"></div>
               <CreateMenuItem icon="🔖" label="Topic" onClick={() => { resetForms(); setEditingId(null); setModalType('topic'); setShowCreateMenu(false); }} />
            </div>
          )}
        </div>
        <div className="flex gap-6">
           <button className="text-xs font-black text-slate-400 uppercase hover:text-indigo-600 transition-colors">📅 Calendar</button>
           <button className="text-xs font-black text-slate-400 uppercase hover:text-indigo-600 transition-colors">📂 Class Drive</button>
        </div>
      </div>

      <div className="space-y-16">
        {topics.map(topic => (
          <section key={topic.id} className="space-y-6">
             <div className="flex justify-between items-end border-b-2 border-indigo-600 pb-3">
                <h2 className="text-3xl font-black text-indigo-600">{topic.name}</h2>
                <button className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center">⋮</button>
             </div>
             <div className="space-y-3">
                {assignments.filter(a => a.topicId === topic.id).map(a => (
                  <WorkItem 
                    key={a.id} 
                    item={a} 
                    onEdit={() => handleEditAssignment(a)}
                    onDelete={() => setDeleteConfirm(a.id)}
                    onView={() => navigate(`/teacher/assignments/${a.id}/submissions`)}
                  />
                ))}
             </div>
          </section>
        ))}
        <section className="space-y-6">
           {topics.length > 0 && assignments.filter(a => !a.topicId).length > 0 && <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-2">Uncategorized</h2>}
           <div className="space-y-3">
              {assignments.filter(a => !a.topicId).map(a => (
                <WorkItem 
                  key={a.id} 
                  item={a} 
                  onEdit={() => handleEditAssignment(a)}
                  onDelete={() => setDeleteConfirm(a.id)}
                  onView={() => navigate(`/teacher/assignments/${a.id}/submissions`)}
                />
              ))}
           </div>
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
             <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">Delete assignment?</h3>
             <p className="text-sm text-slate-500 mb-8">This action will remove the assignment and all associated student submissions. It cannot be undone.</p>
             <div className="flex gap-4">
                <button 
                  onClick={handleDeleteAssignment}
                  className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-rose-700 transition-all"
                >
                  Delete
                </button>
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Creator Interface Modal */}
      {modalType && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-slate-950 animate-in fade-in duration-300">
          <header className="h-20 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-10 bg-white dark:bg-slate-950 z-10">
             <div className="flex items-center gap-8">
                <button onClick={() => { resetForms(); setEditingId(null); setModalType(null); }} className="w-12 h-12 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-2xl text-slate-400 transition-colors">&times;</button>
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-lg shadow-lg">
                      {modalType === 'material' ? '📄' : modalType === 'topic' ? '🔖' : '📝'}
                   </div>
                   <h2 className="text-xl font-black text-slate-900 dark:text-white capitalize">{editingId ? `Edit ${modalType}` : `New ${modalType}`}</h2>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <button onClick={() => { resetForms(); setEditingId(null); setModalType(null); }} className="px-8 py-3 text-sm font-black text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">Discard</button>
                <button 
                  onClick={() => handleCreateWork('published')}
                  disabled={!workForm.title.trim() && modalType !== 'topic'}
                  className="px-10 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50"
                >
                  {processing ? <Spinner size="sm" /> : editingId ? 'Update' : 'Assign'}
                </button>
             </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
             <div className="flex-1 overflow-y-auto p-16 custom-scrollbar bg-slate-50/20 dark:bg-slate-950">
                <div className="max-w-3xl mx-auto space-y-12">
                   {modalType === 'topic' ? (
                     <div className="space-y-8 text-center pt-20">
                        <h2 className="text-4xl font-black">Create a new unit</h2>
                        <input required autoFocus className="w-full text-4xl font-bold bg-transparent border-b-4 border-slate-100 dark:border-slate-800 focus:border-indigo-600 outline-none pb-6 text-center transition-all" placeholder="Enter Topic Title..." value={topicName} onChange={e => setTopicName(e.target.value)} />
                        <button onClick={async () => {
                           if (!topicName.trim()) return;
                           setProcessing(true);
                           await teacherService.createTopic(topicName, classId, subjectId);
                           setModalType(null);
                           setTopicName('');
                           fetchData();
                           setProcessing(false);
                        }} className="px-16 py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-2xl hover:scale-105 transition-all">Create Topic</button>
                     </div>
                   ) : (
                     <>
                        <div className="space-y-3">
                           <input required className="w-full text-5xl font-black bg-transparent border-b-2 border-slate-100 dark:border-slate-800 focus:border-indigo-600 outline-none pb-6 placeholder:text-slate-300 dark:text-white transition-all" placeholder="Title" value={workForm.title} onChange={e => setWorkForm({...workForm, title: e.target.value})} />
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Required</p>
                        </div>

                        <div className="space-y-4">
                           <div className="flex items-center gap-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl border-b-0 shadow-sm">
                              <span className="px-3 text-xs font-black text-slate-400 uppercase tracking-widest border-r mr-2">WYSIWYG</span>
                              <button className="w-8 h-8 rounded hover:bg-slate-100 dark:hover:bg-slate-800 font-black">B</button>
                              <button className="w-8 h-8 rounded hover:bg-slate-100 dark:hover:bg-slate-800 italic">I</button>
                              <button className="w-8 h-8 rounded hover:bg-slate-100 dark:hover:bg-slate-800 underline">U</button>
                              <button className="w-8 h-8 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ml-auto">🔗</button>
                           </div>
                           <textarea rows={12} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-b-3xl p-8 text-base outline-none focus:ring-4 focus:ring-indigo-600/5 dark:text-white resize-none transition-all leading-relaxed shadow-sm" placeholder="Add instructions (optional)..." value={workForm.instructions} onChange={e => setWorkForm({...workForm, instructions: e.target.value})} />
                        </div>

                        {/* Attachments List */}
                        {attachments.length > 0 && (
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Attachments</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                               {attachments.map((att, idx) => (
                                 <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                       <span className="text-xl">{att.icon || '📄'}</span>
                                       <div className="overflow-hidden">
                                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{att.title}</p>
                                          <p className="text-[9px] text-slate-400 uppercase font-bold">{att.type}</p>
                                       </div>
                                    </div>
                                    <button onClick={() => removeAttachment(idx)} className="text-rose-400 hover:text-rose-600 p-2">&times;</button>
                                 </div>
                               ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Institutional Media Suite</label>
                           <div className="flex gap-4 p-5 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                              <MediaButton icon="☁️" label="Cloud Storage" onClick={() => setActiveAttachmentModal('drive')} />
                              <MediaButton icon="🎥" label="Video Embed" onClick={() => setActiveAttachmentModal('youtube')} />
                              <MediaButton icon="➕" label="Docs" onClick={() => setActiveAttachmentModal('create')} />
                              <MediaButton icon="📤" label="File Upload" onClick={() => setActiveAttachmentModal('upload')} />
                              <MediaButton icon="🔗" label="Web Links" onClick={() => setActiveAttachmentModal('link')} />
                           </div>
                        </div>
                     </>
                   )}
                </div>
             </div>

             <aside className="w-96 border-l border-slate-200 dark:border-slate-800 p-10 overflow-y-auto bg-white dark:bg-slate-900 custom-scrollbar">
                <div className="space-y-10">
                   <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Target Class</label>
                      <select className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-0 outline-none dark:text-white text-sm font-bold">
                        {classes.map(c => <option key={c.id} value={c.classId}>{c.class?.name}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Individual Students</label>
                      <div className="max-h-48 overflow-y-auto pr-3 space-y-2 custom-scrollbar">
                         {students.map(s => (
                            <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                               <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                               <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{s.user.firstName} {s.user.lastName}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                   {modalType !== 'material' && (
                     <>
                        <div>
                           <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Assessment Points</label>
                           <input type="number" className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none text-2xl font-black text-indigo-600" value={workForm.points} onChange={e => setWorkForm({...workForm, points: parseInt(e.target.value) || 0})} />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Submission Deadline</label>
                           <div className="space-y-3">
                             <input type="date" required className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 text-sm font-bold" value={workForm.dueDate} onChange={e => setWorkForm({...workForm, dueDate: e.target.value})} />
                             <input type="time" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 text-sm font-bold" value={workForm.dueTime} onChange={e => setWorkForm({...workForm, dueTime: e.target.value})} />
                           </div>
                        </div>
                     </>
                   )}
                   <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Unit / Topic</label>
                      <select className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 text-sm font-bold" value={workForm.topicId} onChange={e => setWorkForm({...workForm, topicId: e.target.value})}>
                         <option value="">No Topic</option>
                         {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                   </div>
                </div>
             </aside>
          </div>

          {/* Attachment Modals */}
          {activeAttachmentModal === 'youtube' && (
            <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
               <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl animate-in zoom-in-95">
                  <h3 className="text-2xl font-black mb-2">Video Resource</h3>
                  <p className="text-slate-500 text-sm mb-8">Search YouTube or paste a direct video URL</p>
                  <div className="space-y-6">
                     <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2">🔍</span>
                        <input className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white" placeholder="Search or paste URL..." value={ytUrl} onChange={e => setYtUrl(e.target.value)} />
                     </div>
                     <div className="flex gap-4">
                        <button onClick={addYoutube} disabled={!ytUrl.trim()} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black disabled:opacity-50">Add Video</button>
                        <button onClick={() => setActiveAttachmentModal(null)} className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-2xl font-bold">Cancel</button>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeAttachmentModal === 'link' && (
            <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
               <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95">
                  <h3 className="text-2xl font-black mb-2">Add Web Link</h3>
                  <div className="space-y-6 mt-6">
                     <div className="relative">
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Link URL</label>
                        <input autoFocus className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white" placeholder="https://..." value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
                     </div>
                     <div className="flex gap-4">
                        <button onClick={addLink} disabled={!linkUrl.match(/^https?:\/\/.+/)} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black disabled:opacity-50">Add link</button>
                        <button onClick={() => setActiveAttachmentModal(null)} className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-2xl font-bold">Cancel</button>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeAttachmentModal === 'upload' && (
            <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
               <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-xl w-full shadow-2xl animate-in zoom-in-95">
                  <h3 className="text-2xl font-black mb-8">Insert Files</h3>
                  
                  {uploadProgress > 0 ? (
                    <div className="py-12 space-y-4 text-center">
                       <p className="text-sm font-bold text-indigo-600 uppercase">Uploading...</p>
                       <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                       </div>
                    </div>
                  ) : (
                    <div 
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer.files); }}
                      className={`py-20 border-4 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all ${isDragging ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30'}`}
                    >
                       <div className="text-5xl mb-4">📤</div>
                       <p className="text-lg font-black text-slate-800 dark:text-slate-200">Drag files here</p>
                       <label className="mt-6 px-10 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:shadow-md transition-all shadow-sm">
                          Browse Files
                          <input type="file" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
                       </label>
                    </div>
                  )}

                  <div className="mt-8 flex justify-end">
                    <button onClick={() => setActiveAttachmentModal(null)} className="px-10 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold">Cancel</button>
                  </div>
               </div>
            </div>
          )}

          {activeAttachmentModal === 'drive' && (
            <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
               <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-4xl w-full h-[80vh] shadow-2xl animate-in zoom-in-95 flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-2xl font-black">Cloud Storage</h3>
                  </div>
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto pr-4">
                    {[1,2,3,4,5,6,7,8].map(i => (
                      <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-transparent hover:border-indigo-600 cursor-pointer group">
                        <div className="aspect-square bg-white dark:bg-slate-700 rounded-xl mb-3 flex items-center justify-center text-4xl shadow-sm">📄</div>
                        <p className="text-[10px] font-black uppercase text-slate-400 truncate">Document_{i}.pdf</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 flex justify-end gap-4">
                    <button onClick={() => setActiveAttachmentModal(null)} className="px-10 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold">Cancel</button>
                  </div>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CreateMenuItem: React.FC<{ icon: string; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="w-full text-left px-6 py-4 text-sm font-black text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-5 transition-all">
    <span className="text-2xl">{icon}</span> {label}
  </button>
);

const MediaButton: React.FC<{ icon: string; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="flex-1 flex flex-col items-center gap-3 p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all border border-transparent hover:border-indigo-600/20 group">
    <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{icon}</span>
    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors text-center">{label}</span>
  </button>
);

// Module 2: Expandable WorkItem Component Refinement
const WorkItem: React.FC<{ 
  item: Assignment; 
  onEdit: () => void; 
  onDelete: () => void; 
  onView: () => void; 
}> = ({ item, onEdit, onDelete, onView }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#/teacher/assignments/${item.id}/submissions`;
    navigator.clipboard.writeText(url);
    alert('Direct link copied to clipboard!');
    setShowMenu(false);
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all shadow-sm ${isExpanded ? 'ring-2 ring-indigo-600 shadow-lg' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
      <div 
        className="p-5 flex items-center justify-between cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-5 overflow-hidden">
           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg shadow-sm transition-colors ${
             item.type === 'material' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
           }`}>
             {item.type === 'material' ? '📄' : item.type === 'question' ? '❓' : '📝'}
           </div>
           <div>
              <p className="text-base font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors leading-tight mb-1 truncate">{item.title}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Posted {new Date(item.createdAt).toLocaleDateString()}</p>
           </div>
        </div>
        <div className="flex items-center gap-6">
           {item.type !== 'material' && item.dueDate && !isExpanded && (
             <div className="hidden md:block text-right">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mb-1">Due Date</p>
                <p className="text-xs font-black text-rose-500">{new Date(item.dueDate).toLocaleDateString()}</p>
             </div>
           )}
           <div className="relative" ref={menuRef}>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                className="text-slate-300 hover:text-slate-600 p-2 rounded-full transition-colors"
              >
                ⋮
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 py-1 animate-in zoom-in-95 duration-150">
                  <button onClick={(e) => { e.stopPropagation(); onEdit(); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20">Delete</button>
                  <button onClick={(e) => { e.stopPropagation(); handleCopyLink(); }} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">Copy Link</button>
                </div>
              )}
           </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-5 animate-in slide-in-from-top-2 duration-300">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-3 space-y-6">
                 {item.instructions && (
                   <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap italic border-l-2 border-slate-100 dark:border-slate-800 pl-4">
                      {item.instructions}
                   </div>
                 )}
                 {item.attachments && item.attachments.length > 0 && (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {item.attachments.map((att: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                          <span className="text-xl">{att.icon || '📄'}</span>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">{att.title}</span>
                        </div>
                      ))}
                   </div>
                 )}
              </div>
              <div className="md:col-span-1 border-l border-slate-100 dark:border-slate-800 pl-8 flex flex-col justify-between min-h-[120px]">
                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                       <p className="text-sm font-black text-slate-900 dark:text-white">0</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Turned In</p>
                    </div>
                    <div className="flex justify-between items-center">
                       <p className="text-sm font-black text-slate-900 dark:text-white">12</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Assigned</p>
                    </div>
                 </div>
                 <button 
                  onClick={(e) => { e.stopPropagation(); onView(); }}
                  className="w-full mt-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md"
                 >
                  View Assignment
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
