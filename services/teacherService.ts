
import { supabase } from '../lib/supabase';
import { Lesson, Topic, Class, Subject, Announcement } from '../types';

export const teacherService = {
  getAssignedClasses: async (teacherUserId: string) => {
    // 1. Get the teacher record
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', teacherUserId)
      .single();

    if (!teacher) return [];

    // 2. Get the assigned classes
    const { data, error } = await supabase
      .from('class_subject_teachers')
      .select(`
        id,
        class:class_id (*),
        subject:subject_id (*)
      `)
      .eq('teacher_id', teacher.id);

    if (error) throw error;
    
    // Map SnakeCase to CamelCase and fix structure
    return data.map(tc => ({
      ...tc,
      classId: tc.class.id,
      subjectId: tc.subject.id
    }));
  },

  getClassById: async (id: string) => {
    const { data, error } = await supabase.from('classes').select('*').eq('id', id).single();
    if (error) throw error;
    return {
      ...data,
      classCode: data.class_code
    };
  },

  getClassPeople: async (classId: string) => {
    const { data: students } = await supabase
      .from('students')
      .select('*, profiles:user_id (*)')
      .eq('class_id', classId);

    const { data: teacherLinks } = await supabase
      .from('class_subject_teachers')
      .select('profiles:teacher_id (*)')
      .eq('class_id', classId);

    return {
      students: students?.map(s => ({ 
        ...s, 
        user: { 
          ...s.profiles,
          firstName: s.profiles.first_name,
          lastName: s.profiles.last_name
        } 
      })) || [],
      teachers: Array.from(new Set(teacherLinks?.map(t => ({
        ...t.profiles,
        firstName: t.profiles.first_name,
        lastName: t.profiles.last_name
      })) || []))
    };
  },

  // Fix: Added getClassRoster method
  getClassRoster: async (classId: string) => {
    const { data, error } = await supabase
      .from('students')
      .select('*, profiles:user_id (*)')
      .eq('class_id', classId);
    
    if (error) throw error;
    return data.map(s => ({ 
      ...s, 
      user: {
        ...s.profiles,
        firstName: s.profiles.first_name,
        lastName: s.profiles.last_name
      }
    }));
  },

  getClassAnnouncements: async (classId: string, subjectId: string) => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('target_class_id', classId)
      .order('posted_date', { ascending: false });
    
    if (error) throw error;
    return data.map(a => ({
      ...a,
      postedDate: a.posted_date
    }));
  },

  postAnnouncement: async (classId: string, subjectId: string, teacherId: string, content: string, attachments: any[] = []) => {
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        target_class_id: classId,
        author_id: teacherId,
        content,
        posted_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getLessons: async (classId: string, subjectId: string) => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('class_id', classId)
      .eq('subject_id', subjectId)
      .order('is_pinned', { ascending: false })
      .order('posted_date', { ascending: false });
    
    if (error) throw error;
    return data.map(l => ({
      ...l,
      classId: l.class_id,
      subjectId: l.subject_id,
      teacherId: l.teacher_id,
      videoUrl: l.video_url,
      isPublished: l.is_published,
      isPinned: l.is_pinned,
      postedDate: l.posted_date,
      topicId: l.topic_id
    }));
  },

  createLesson: async (lessonData: Partial<Lesson>) => {
    // Map CamelCase to SnakeCase
    const insertData = {
      title: lessonData.title,
      content: lessonData.content,
      class_id: lessonData.classId,
      subject_id: lessonData.subjectId,
      teacher_id: lessonData.teacherId,
      video_url: lessonData.videoUrl,
      is_published: lessonData.isPublished,
      is_pinned: lessonData.isPinned,
      topic_id: lessonData.topicId,
      posted_date: new Date().toISOString()
    };

    const { data, error } = await supabase.from('lessons').insert(insertData).select().single();
    if (error) throw error;
    return data;
  },

  // Fix: Added deleteLesson method
  deleteLesson: async (id: string) => {
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) throw error;
  },

  // Fix: Added updateLesson method
  updateLesson: async (id: string, updates: Partial<Lesson>) => {
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.videoUrl !== undefined) dbUpdates.video_url = updates.videoUrl;
    if (updates.isPublished !== undefined) dbUpdates.is_published = updates.isPublished;
    if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
    if (updates.topicId !== undefined) dbUpdates.topic_id = updates.topicId;

    const { error } = await supabase.from('lessons').update(dbUpdates).eq('id', id);
    if (error) throw error;
  },

  // Fix: Added getTopics method
  getTopics: async (classId: string, subjectId: string) => {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('class_id', classId)
      .eq('subject_id', subjectId)
      .order('order', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Fix: Added createTopic method
  createTopic: async (name: string, classId: string, subjectId: string) => {
    const { data, error } = await supabase
      .from('topics')
      .insert({
        name,
        class_id: classId,
        subject_id: subjectId,
        order: 0
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
