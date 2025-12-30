
import { supabase } from '../lib/supabase';
import { Student, User, Class, UserRole, Teacher, Subject } from '../types';

export const adminService = {
  // Students
  getStudents: async () => {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        profiles:user_id (*),
        classes:class_id (*)
      `);
    
    if (error) throw error;

    return data.map(s => ({
      ...s,
      user: s.profiles,
      class: s.classes
    }));
  },

  getStudentsByClass: async (classId: string) => {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        profiles:user_id (*)
      `)
      .eq('class_id', classId);
    
    if (error) throw error;
    return data.map(s => ({ ...s, user: s.profiles }));
  },
  
  addStudent: async (studentData: any, userData: any) => {
    // 1. Create Auth User (Note: This usually requires Service Role for cross-user creation, 
    // but we simulate using signUp here. In production, use Supabase Edge Functions or admin SDK)
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password || 'NextLearn123',
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: 'student'
        }
      }
    });

    if (error) throw error;

    const userId = data.user!.id;

    // 2. Add Student Record
    const { data: student, error: sError } = await supabase
      .from('students')
      .insert({
        user_id: userId,
        admission_number: studentData.admissionNumber,
        class_id: studentData.classId,
        status: studentData.status || 'active'
      })
      .select()
      .single();

    if (sError) throw sError;

    return { 
      user: { id: userId, email: userData.email, ...userData }, 
      student,
      credentials: { email: userData.email, password: userData.password || 'NextLearn123' }
    };
  },

  updateStudent: async (studentId: string, studentUpdates: any, userUpdates: any) => {
    // Map CamelCase to SnakeCase for DB
    const sUpdate = {
      admission_number: studentUpdates.admissionNumber,
      class_id: studentUpdates.classId,
      status: studentUpdates.status
    };

    const { error: sErr } = await supabase.from('students').update(sUpdate).eq('id', studentId);
    if (sErr) throw sErr;

    const { data: student } = await supabase.from('students').select('user_id').eq('id', studentId).single();
    
    if (student?.user_id) {
       const uUpdate = {
         first_name: userUpdates.firstName,
         last_name: userUpdates.lastName,
       };
       const { error: uErr } = await supabase.from('profiles').update(uUpdate).eq('id', student.user_id);
       if (uErr) throw uErr;
    }

    return { credentials: null };
  },

  deleteStudent: async (studentId: string) => {
    // In Supabase, if CASCADE is set on profiles, we just delete the student or the auth user
    const { error } = await supabase.from('students').delete().eq('id', studentId);
    if (error) throw error;
  },

  // Fix: Added deleteStudentsBulk method
  deleteStudentsBulk: async (ids: string[]) => {
    const { error } = await supabase.from('students').delete().in('id', ids);
    if (error) throw error;
  },

  // Fix: Added moveStudentToClass method
  moveStudentToClass: async (studentId: string, classId: string) => {
    const { error } = await supabase.from('students').update({ class_id: classId }).eq('id', studentId);
    if (error) throw error;
  },

  // Classes
  getClasses: async () => {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        class_subject_teachers (
          id,
          profiles:teacher_id (first_name, last_name),
          subjects:subject_id (name)
        ),
        students (count)
      `);

    if (error) throw error;

    return data.map(c => ({
      ...c,
      studentCount: c.students?.[0]?.count || 0,
      teachers: c.class_subject_teachers.map((link: any) => ({
        id: link.id,
        name: `${link.profiles.first_name} ${link.profiles.last_name}`,
        subject: link.subjects.name
      }))
    }));
  },

  getClassById: async (id: string) => {
    const { data, error } = await supabase.from('classes').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  createClass: async (classData: Partial<Class>) => {
    const { data, error } = await supabase.from('classes').insert(classData).select().single();
    if (error) throw error;
    return data;
  },

  updateClass: async (classId: string, updates: Partial<Class>) => {
    const { error } = await supabase.from('classes').update(updates).eq('id', classId);
    if (error) throw error;
  },

  deleteClass: async (classId: string) => {
    const { error } = await supabase.from('classes').delete().eq('id', classId);
    if (error) throw error;
  },

  // Teachers & Faculty
  // Fix: Added getTeachers method
  getTeachers: async () => {
    const { data, error } = await supabase
      .from('teachers')
      .select(`
        *,
        profiles:user_id (*),
        class_subject_teachers (
          id,
          classes:class_id (name),
          subjects:subject_id (name)
        )
      `);
    
    if (error) throw error;

    return data.map(t => ({
      ...t,
      user: t.profiles,
      assignments: t.class_subject_teachers.map((link: any) => ({
        id: link.id,
        className: link.classes.name,
        subjectName: link.subjects.name
      }))
    }));
  },

  // Fix: Added addTeacher method
  addTeacher: async (data: any) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password || 'NextLearn123',
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          role: 'teacher'
        }
      }
    });

    if (error) throw error;

    const userId = authData.user!.id;

    const { data: teacher, error: tError } = await supabase
      .from('teachers')
      .insert({
        user_id: userId,
        employee_id: 'T' + Math.floor(1000 + Math.random() * 9000),
        specialization: data.specialization,
        status: 'active'
      })
      .select()
      .single();

    if (tError) throw tError;

    return { 
      user: { id: userId, email: data.email, ...data }, 
      teacher,
      credentials: { email: data.email, password: data.password || 'NextLearn123' }
    };
  },

  // Fix: Added deleteTeacher method
  deleteTeacher: async (id: string) => {
    const { error } = await supabase.from('teachers').delete().eq('id', id);
    if (error) throw error;
  },

  // Fix: Added assignTeacherToClass method
  assignTeacherToClass: async (teacherId: string, classId: string, subjectId: string) => {
    const { data, error } = await supabase
      .from('class_subject_teachers')
      .insert({
        teacher_id: teacherId,
        class_id: classId,
        subject_id: subjectId
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Fix: Added removeTeacherFromClass method
  removeTeacherFromClass: async (id: string) => {
    const { error } = await supabase.from('class_subject_teachers').delete().eq('id', id);
    if (error) throw error;
  },

  // Fix: Added createSubject method
  createSubject: async (name: string) => {
    const { data, error } = await supabase
      .from('subjects')
      .insert({ name, code: name.substring(0, 3).toUpperCase() + Math.floor(100 + Math.random() * 900) })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Fix: Added getStaff method
  getStaff: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('role', 'student');
    
    if (error) throw error;
    return data.map(u => ({
      ...u,
      firstName: u.first_name,
      lastName: u.last_name
    }));
  },

  getStats: async () => {
    const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
    const { count: staffCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'student');
    const { count: classesCount } = await supabase.from('classes').select('*', { count: 'exact', head: true });

    return {
      studentsCount: studentCount || 0,
      staffCount: staffCount || 0,
      classesCount: classesCount || 0,
      recentActivity: [
        { id: 1, text: 'System synced with Supabase Realtime', time: 'Just now' },
        { id: 2, text: 'Database migrations verified', time: '1h ago' }
      ]
    };
  }
};
