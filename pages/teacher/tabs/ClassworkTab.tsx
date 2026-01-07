import React, { useState, useEffect } from 'react';
import { teacherService } from '../../../services/teacherService';
import { assignmentService } from '../../../services/assignmentService';
import { useAuth } from '../../../context/AuthContext';
import { Spinner } from '../../../components/UI/Spinner';
import { Topic, Assignment } from '../../../types';
import { useNavigate } from 'react-router-dom';

export const ClassworkTab: React.FC<{ classId: string; subjectId: string }> = ({ classId, subjectId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [modalType, setModalType] = useState<'assignment' | 'material' | 'topic' | null>(null);
  
  const [form, setForm] = useState({ title: '', instructions: '', points: 100, dueDate: '' });
  const [topicName, setTopicName] = useState('');

  const fetchData = async () => {
    const [tData, aData] = await Promise.all([
      teacherService.getTopics(classId, subjectId),
      assignmentService.getTeacherAssignments(user!.id)
    ]);
    setTopics(tData);
    setAssignments(aData.filter(a => a.classId === classId));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [classId, subjectId]);

  const handleCreate = async () => {
    if (modalType === 'topic') {
      await teacherService.createTopic(topicName, classId, subjectId);
    } else {
      await assignmentService.createAssignment({
        ...form,
        type: modalType as any,
        classId,
        subjectId,
        teacherId: user!.id
      });
    }
    setModalType(null);
    fetchData();
  };

  if (loading) return <div className="p-20 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center py-4">
        <div className="relative">
          <button onClick={() => setShowCreateMenu(!showCreateMenu)} className="btn btn-primary rounded-full px-8">+ Create</button>
          {showCreateMenu && (
            <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-900 border rounded-lg shadow-xl z-50">
               <button onClick={() => { setModalType('assignment'); setShowCreateMenu(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-bold border-b">📝 Assignment</button>
               <button onClick={() => { setModalType('material'); setShowCreateMenu(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-bold border-b">📄 Material</button>
               <button onClick={() => { setModalType('topic'); setShowCreateMenu(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-bold">🔖 Topic</button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-12">
        {topics.map(t => (
          <section key={t.id}>
             <h2 className="text-2xl font-black text-indigo-600 border-b-2 border-indigo-100 pb-2 mb-4">{t.name}</h2>
             <div className="space-y-2">
                {assignments.filter(a => a.topicId === t.id).map(a => (
                  <div key={a.id} onClick={() => navigate(`/teacher/assignments/${a.id}/submissions`)} className="p-4 bg-white dark:bg-gray-900 border rounded-lg hover:shadow-md cursor-pointer flex justify-between items-center">
                     <span className="font-bold">{a.title}</span>
                     <span className="text-[10px] text-slate-400 uppercase font-black">Due {new Date(a.dueDate).toLocaleDateString()}</span>
                  </div>
                ))}
             </div>
          </section>
        ))}
        <section>
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Uncategorized</h2>
          <div className="space-y-2">
             {assignments.filter(a => !a.topicId).map(a => (
                <div key={a.id} onClick={() => navigate(`/teacher/assignments/${a.id}/submissions`)} className="p-4 bg-white dark:bg-gray-900 border rounded-lg hover:shadow-md cursor-pointer flex justify-between items-center">
                   <span className="font-bold">{a.title}</span>
                   <span className="text-[10px] text-slate-400 uppercase font-black">Posted {new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
             ))}
          </div>
        </section>
      </div>

      {modalType && (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-950 flex flex-col">
          <header className="h-16 border-b px-8 flex justify-between items-center">
             <div className="flex items-center gap-4">
                <button onClick={() => setModalType(null)} className="text-2xl">&times;</button>
                <h2 className="font-black text-lg uppercase tracking-widest">{modalType}</h2>
             </div>
             <button onClick={handleCreate} className="btn btn-primary px-8">Save</button>
          </header>
          <div className="flex-1 p-10 max-w-4xl mx-auto w-full space-y-6">
             {modalType === 'topic' ? (
                <input required autoFocus className="w-full text-4xl font-bold border-b-2 outline-none pb-4 bg-transparent" placeholder="Topic Title" value={topicName} onChange={e => setTopicName(e.target.value)} />
             ) : (
                <>
                  <input required className="w-full text-4xl font-bold border-b-2 outline-none pb-4 bg-transparent" placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                  <textarea rows={10} className="w-full p-4 border rounded-xl bg-gray-50 outline-none" placeholder="Instructions" value={form.instructions} onChange={e => setForm({...form, instructions: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                     <div><label className="text-xs font-bold uppercase text-slate-400">Points</label><input type="number" className="w-full p-2 border rounded" value={form.points} onChange={e => setForm({...form, points: parseInt(e.target.value)})} /></div>
                     <div><label className="text-xs font-bold uppercase text-slate-400">Due Date</label><input type="date" className="w-full p-2 border rounded" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} /></div>
                  </div>
                </>
             )}
          </div>
        </div>
      )}
    </div>
  );
};