
import { supabase } from '../lib/supabase';
import { Student, User, Class, UserRole, Teacher, Subject } from '../types';

// Helper to map DB Classes to Frontend Classes
const mapClassFromDb = (c: any) => ({
  ...c,
  gradeLevel: c.grade_level,
  classCode: c.class_code,
  studentCount: c.students?.[0]?.count || 0,
  teachers: c.class_subject_teachers?.map((link: any) => ({
    id: link.id,
    name: link.profiles ? `${link.profiles.first_name} ${link.profiles.last_name}` : 'Unknown',
    subject: link.subjects?.name || 'General'
  })) || []
});

const mapStudentFromDb = (s: any) => ({
  ...s,
  admissionNumber: s.admission_number,
  classId: s.class_id,
  user: s.profiles ? {
    ...s.profiles,
    firstName: s.profiles.first_name,
    lastName: s.profiles.last_name,
  } : null,
  class: s.classes
});

export const adminService = {
  // Students
  getStudents: async () => {
    console.log("[AdminService] Fetching all students...");
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        profiles:user_id (*),
        classes:class_id (*)
      `);
    
    if (error) {
      console.error("[AdminService] getStudents error:", error.message, error.details);
      throw error;
    }

    return data.map(mapStudentFromDb);
  },

  getStudentsByClass: async (classId: string) => {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        profiles:user_id (*)
      `)
      .eq('class_id', classId);
    
    if (error) {
      console.error("[AdminService] getStudentsByClass error:", error.message);
      throw error;
    }
    return data.map(mapStudentFromDb);
  },
  
  addStudent: async (studentData: any, userData: any) => {
    console.log("[AdminService] Enrolling new student:", userData.email);
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

    if (error) {
      console.error("[AdminService] Auth signUp error:", error.message);
      throw error;
    }

    const userId = data.user!.id;

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

    if (sError) {
      console.error("[AdminService] student insert error:", sError.message);
      throw sError;
    }

    return { 
      user: { id: userId, email: userData.email, ...userData }, 
      student,
      credentials: { email: userData.email, password: userData.password || 'NextLearn123' }
    };
  },

  updateStudent: async (studentId: string, studentUpdates: any, userUpdates: any) => {
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
    const { error } = await supabase.from('students').delete().eq('id', studentId);
    if (error) throw error;
  },

  deleteStudentsBulk: async (ids: string[]) => {
    const { error } = await supabase.from('students').delete().in('id', ids);
    if (error) throw error;
  },

  moveStudentToClass: async (studentId: string, classId: string) => {
    const { error } = await supabase.from('students').update({ class_id: classId }).eq('id', studentId);
    if (error) throw error;
  },

  // Classes
  getClasses: async () => {
    console.log("[AdminService] Fetching all classes...");
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

    if (error) {
      console.error("[AdminService] getClasses error:", error.message, error.hint);
      throw error;
    }

    return data.map(mapClassFromDb);
  },

  getClassById: async (id: string) => {
    const { data, error } = await supabase.from('classes').select('*').eq('id', id).single();
    if (error) throw error;
    return mapClassFromDb(data);
  },

  createClass: async (classData: Partial<Class>) => {
    // Map camelCase to snake_case for DB insert
    const dbData = {
      name: classData.name,
      grade_level: classData.gradeLevel,
      section: classData.section,
      class_code: classData.classCode || `CL-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      description: classData.description
    };

    const { data, error } = await supabase.from('classes').insert(dbData).select().single();
    if (error) {
      console.error("[AdminService] createClass error:", error.message);
      throw error;
    }
    return mapClassFromDb(data);
  },

  updateClass: async (classId: string, updates: Partial<Class>) => {
    const dbUpdate: any = {};
    if (updates.name) dbUpdate.name = updates.name;
    if (updates.gradeLevel) dbUpdate.grade_level = updates.gradeLevel;
    if (updates.section) dbUpdate.section = updates.section;
    if (updates.description) dbUpdate.description = updates.description;

    const { error } = await supabase.from('classes').update(dbUpdate).eq('id', classId);
    if (error) throw error;
  },

  deleteClass: async (classId: string) => {
    const { error } = await supabase.from('classes').delete().eq('id', classId);
    if (error) throw error;
  },

  // Teachers & Faculty
  getTeachers: async () => {
    console.log("[AdminService] Fetching all teachers...");
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
    
    if (error) {
      console.error("[AdminService] getTeachers error:", error.message);
      throw error;
    }

    return data.map(t => ({
      ...t,
      user: t.profiles ? {
        ...t.profiles,
        firstName: t.profiles.first_name,
        lastName: t.profiles.last_name
      } : null,
      assignments: t.class_subject_teachers?.map((link: any) => ({
        id: link.id,
        className: link.classes?.name || 'Unknown Class',
        subjectName: link.subjects?.name || 'General'
      })) || []
    }));
  },

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

  deleteTeacher: async (id: string) => {
    const { error } = await supabase.from('teachers').delete().eq('id', id);
    if (error) throw error;
  },

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

  removeTeacherFromClass: async (id: string) => {
    const { error } = await supabase.from('class_subject_teachers').delete().eq('id', id);
    if (error) throw error;
  },

  createSubject: async (name: string) => {
    const { data, error } = await supabase
      .from('subjects')
      .insert({ name, code: name.substring(0, 3).toUpperCase() + Math.floor(100 + Math.random() * 900) })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

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
    try {
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
    } catch (err) {
      console.error("[AdminService] getStats failed:", err);
      return { studentsCount: 0, staffCount: 0, classesCount: 0, recentActivity: [] };
    }
  }
};
