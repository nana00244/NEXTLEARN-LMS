
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { teacherService } from '../../services/teacherService';
import { Spinner } from '../../components/UI/Spinner';
import { Alert } from '../../components/UI/Alert';
import { Lesson, Topic, LessonAttachment } from '../../types';

export const ClassStream: React.FC = () => {
  const { classId, subjectId } = useParams<{ classId: string; subjectId: string }>();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostForm, setShowPostForm] = useState(false);
  
  // Custom Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);

  // Post Form State
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [attachments, setAttachments] = useState<{ name: string; size: number; type: string; url: string }[]>([]);
  const [showVideoInput, setShowVideoInput] = useState(false);
  
  // UI State
  const [showTopicInput, setShowTopicInput] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const refreshData = async () => {
    if (classId && subjectId) {
      const [lData, tData] = await Promise.all([
        teacherService.getLessons(classId, subjectId),
        teacherService.getTopics(classId, subjectId)
      ]);
      setLessons(lData);
      setTopics(tData);
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [classId, subjectId]);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateTopic = async () => {
    if (!newTopicName.trim() || !classId || !subjectId) return;
    setLoading(true);
    await teacherService.createTopic(newTopicName.trim(), classId, subjectId);
    setNewTopicName('');
    setShowTopicInput(false);
    refreshData();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments = Array.from(files).map((file: File) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file) // Mock URL for demo
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handlePost = async () => {
    if (!postTitle || !postContent || !classId || !subjectId) return;
    setLoading(true);
    
    const finalAttachments: LessonAttachment[] = attachments.map(a => ({
      id: Math.random().toString(36).substr(2, 9),
      lessonId: '', // To be filled by server simulation
      fileName: a.name,
      fileUrl: a.url,
      fileType: a.type,
      fileSize: a.size
    }));

    await teacherService.createLesson({
      title: postTitle,
      content: postContent,
      classId,
      subjectId,
      topicId: selectedTopic || undefined,
      videoUrl: videoUrl || undefined,
      attachments: finalAttachments,
      isPublished: true,
      isPinned: false
    });

    // Reset Form
    setPostTitle('');
    setPostContent('');
    setSelectedTopic('');
    setAttachments([]);
    setVideoUrl('');
    setShowVideoInput(false);
    setShowPostForm(false);
    refreshData();
  };

  const confirmDeleteLesson = (id: string) => {
    setLessonToDelete(id);
    setShowDeleteConfirm(true);
    setActiveMenuId(null);
  };

  const executeDeleteLesson = async () => {
    if (!lessonToDelete) return;
    setLoading(true);
    await teacherService.deleteLesson(lessonToDelete);
    setShowDeleteConfirm(false);
    setLessonToDelete(null);
    refreshData();
  };

  const handleTogglePin = async (lesson: Lesson) => {
    setLoading(true);
    await teacherService.updateLesson(lesson.id, { isPinned: !lesson.isPinned });
    setActiveMenuId(null);
    refreshData();
  };

  const getYoutubeEmbedUrl = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  if (loading && lessons.length === 0) return <div className="p-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Class Banner */}
      <div className="relative h-48 bg-indigo-600 rounded-3xl overflow-hidden shadow-xl flex items-end p-8">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="relative z-10 text-white">
          <h1 className="text-3xl font-black">Academic Stream</h1>
          <p className="text-indigo-100 font-medium">Interactive Course Materials & Announcements</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar: Upcoming & Topics */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Upcoming</h3>
             <p className="text-xs text-slate-500 italic">No work due soon</p>
           </div>

           <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Topics</h3>
                <button 
                  onClick={() => setShowTopicInput(!showTopicInput)}
                  className="text-xs text-indigo-600 font-bold"
                >
                  {showTopicInput ? 'Cancel' : '+ Add'}
                </button>
             </div>
             
             {showTopicInput && (
               <div className="mb-4 space-y-2">
                 <input 
                   type="text" 
                   className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-1 focus:ring-indigo-600 dark:text-white"
                   placeholder="New Topic Name"
                   value={newTopicName}
                   onChange={(e) => setNewTopicName(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleCreateTopic()}
                 />
                 <button 
                   onClick={handleCreateTopic}
                   className="w-full py-1.5 text-xs bg-indigo-600 text-white rounded-lg font-bold"
                 >
                   Save
                 </button>
               </div>
             )}

             <ul className="space-y-2">
               {topics.map(t => (
                 <li key={t.id} className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-2">
                   <span className="text-slate-400">#</span> {t.name}
                 </li>
               ))}
               {topics.length === 0 && <p className="text-[10px] text-slate-400">No topics created yet</p>}
             </ul>
           </div>
        </div>

        {/* Feed */}
        <div className="lg:col-span-3 space-y-6">
          {/* Create Post Form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            {!showPostForm ? (
              <button 
                onClick={() => setShowPostForm(true)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">👤</div>
                <span className="text-slate-400 text-sm font-medium">Announce something to your class...</span>
              </button>
            ) : (
              <div className="p-6 space-y-4">
                <input 
                  type="text" 
                  placeholder="Lesson Title"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                />
                <textarea 
                  rows={4}
                  placeholder="Share details about this lesson..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-600 resize-none text-sm"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                />

                {/* Video URL Input */}
                {showVideoInput && (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Enter YouTube URL"
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border-0 text-xs outline-none"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                    <button onClick={() => setShowVideoInput(false)} className="text-xs text-rose-500">×</button>
                  </div>
                )}

                {/* Attachments Preview */}
                {(attachments.length > 0 || videoUrl) && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((a, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-[10px] text-indigo-700 dark:text-indigo-300">
                        <span>📎 {a.name}</span>
                        <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="hover:text-rose-500 font-bold">×</button>
                      </div>
                    ))}
                    {videoUrl && (
                       <div className="flex items-center gap-2 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-[10px] text-emerald-700 dark:text-emerald-300">
                        <span>🎥 Video Linked</span>
                        <button onClick={() => setVideoUrl('')} className="hover:text-rose-500 font-bold">×</button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <select 
                      className="text-xs bg-slate-50 dark:bg-slate-800 border-0 rounded-lg px-2 py-1 outline-none text-slate-600 dark:text-slate-400"
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                    >
                      <option value="">No Topic</option>
                      {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>

                    <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                    <button onClick={() => fileInputRef.current?.click()} className="text-lg hover:scale-110 transition-transform" title="Add File">📎</button>
                    <button onClick={() => setShowVideoInput(true)} className="text-lg hover:scale-110 transition-transform" title="Add Video">🎥</button>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowPostForm(false)}
                      className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handlePost}
                      disabled={!postTitle || !postContent}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      Post Lesson
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lesson Feed */}
          <div className="space-y-6">
            {lessons.map(lesson => (
              <div key={lesson.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden group">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-sm font-bold">JD</div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">John Doe</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                          {new Date(lesson.postedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={() => setActiveMenuId(activeMenuId === lesson.id ? null : lesson.id)}
                        className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        ⋮
                      </button>
                      
                      {activeMenuId === lesson.id && (
                        <div 
                          ref={menuRef}
                          className="absolute right-0 top-10 w-48 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xl z-50 py-2 animate-in fade-in zoom-in duration-200"
                        >
                          <button 
                            onClick={() => handleTogglePin(lesson)}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                          >
                            <span>{lesson.isPinned ? '📍 Unpin from top' : '📌 Pin to top'}</span>
                          </button>
                          <button 
                            onClick={() => confirmDeleteLesson(lesson.id)}
                            className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center gap-2"
                          >
                            <span>🗑️ Delete Lesson</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{lesson.title}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{lesson.content}</p>
                    
                    {/* Video Embed */}
                    {lesson.videoUrl && getYoutubeEmbedUrl(lesson.videoUrl) && (
                      <div className="aspect-video rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-black">
                        <iframe 
                          width="100%" 
                          height="100%" 
                          src={getYoutubeEmbedUrl(lesson.videoUrl)!} 
                          title="YouTube video player" 
                          frameBorder="0" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen
                        ></iframe>
                      </div>
                    )}

                    {/* Attachments List */}
                    {lesson.attachments && lesson.attachments.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                        {lesson.attachments.map(att => (
                          <a 
                            key={att.id} 
                            href={att.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <span className="text-xl">📄</span>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{att.fileName}</p>
                              <p className="text-[10px] text-slate-500">{(att.fileSize / 1024).toFixed(1)} KB</p>
                            </div>
                            <span className="text-slate-400">⬇️</span>
                          </a>
                        ))}
                      </div>
                    )}
                    
                    {lesson.topicId || lesson.isPinned ? (
                      <div className="pt-2 flex flex-wrap gap-2">
                        {lesson.isPinned && (
                          <span className="inline-block text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md uppercase">
                            📌 Pinned
                          </span>
                        )}
                        {lesson.topicId && (
                          <span className="inline-block text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md uppercase">
                            {topics.find(t => t.id === lesson.topicId)?.name || 'Unit Resource'}
                          </span>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
                
                <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                   <button className="text-xs font-bold text-slate-500 hover:text-indigo-600">Add class comment</button>
                   <div className="flex gap-4">
                      <span className="text-[10px] font-bold text-slate-400">{lesson.attachments?.length || 0} attachments</span>
                   </div>
                </div>
              </div>
            ))}
            {lessons.length === 0 && !loading && (
              <div className="py-20 text-center space-y-4">
                <div className="text-6xl opacity-20">📭</div>
                <h3 className="text-lg font-bold text-slate-400">Class feed is empty</h3>
                <p className="text-sm text-slate-500">Post a lesson or announcement to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-2xl max-w-sm w-full border border-slate-100 dark:border-slate-800">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">Delete Lesson?</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Are you sure you want to remove this academic resource? This cannot be undone.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => { setShowDeleteConfirm(false); setLessonToDelete(null); }}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={executeDeleteLesson}
                className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-2xl font-black shadow-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
