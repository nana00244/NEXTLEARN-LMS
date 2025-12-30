
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { teacherService } from '../../services/teacherService';
import { assignmentService } from '../../services/assignmentService';
import { gradingService } from '../../services/gradingService';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/UI/Spinner';
import { Class, Subject, Assignment, Topic } from '../../types';

// Tab Components
import { ClassStreamTab } from './tabs/ClassStreamTab';
import { ClassworkTab } from './tabs/ClassworkTab';
import { PeopleTab } from './tabs/PeopleTab';
import { GradesTab } from './tabs/GradesTab';

export const ClassView: React.FC = () => {
  const { classId, subjectId } = useParams<{ classId: string; subjectId: string }>();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'stream' | 'classwork' | 'people' | 'grades'>('stream');
  const [classInfo, setClassInfo] = useState<Class | null>(null);
  const [subjectInfo, setSubjectInfo] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClassData = async () => {
      if (classId && subjectId) {
        const [cData, sData] = await Promise.all([
          teacherService.getClassById(classId),
          // Find subject in mock DB
          Promise.resolve(JSON.parse(localStorage.getItem('nextlearn_mock_db_subjects') || '[]').find((s: any) => s.id === subjectId))
        ]);
        setClassInfo(cData);
        setSubjectInfo(sData);
        setLoading(false);
      }
    };
    loadClassData();
  }, [classId, subjectId]);

  if (loading) return <div className="p-20"><Spinner size="lg" /></div>;
  if (!classInfo) return <div className="p-20 text-center">Class not found</div>;

  return (
    <div className="flex flex-col min-h-screen -mt-8 -mx-8">
      {/* Secondary Nav / Tabs */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-16 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-8">
           <div className="flex gap-8">
              <TabButton active={activeTab === 'stream'} label="Stream" onClick={() => setActiveTab('stream')} />
              <TabButton active={activeTab === 'classwork'} label="Classwork" onClick={() => setActiveTab('classwork')} />
              <TabButton active={activeTab === 'people'} label="People" onClick={() => setActiveTab('people')} />
              <TabButton active={activeTab === 'grades'} label="Grades" onClick={() => setActiveTab('grades')} />
           </div>
           <div className="hidden md:flex items-center gap-3">
              <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">⚙️</button>
           </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl w-full mx-auto p-8">
        {activeTab === 'stream' && <ClassStreamTab classId={classId!} subjectId={subjectId!} />}
        {activeTab === 'classwork' && <ClassworkTab classId={classId!} subjectId={subjectId!} />}
        {activeTab === 'people' && <PeopleTab classId={classId!} />}
        {activeTab === 'grades' && <GradesTab classId={classId!} subjectId={subjectId!} />}
      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-5 text-sm font-bold transition-all border-b-2 ${
      active 
        ? 'text-indigo-600 border-indigo-600' 
        : 'text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-slate-200'
    }`}
  >
    {label}
  </button>
);
