
import { supabase } from '../lib/supabase';
import { Student, User, Class, UserRole, Teacher, Subject } from '../types';

// Helper to map DB Classes to Frontend Classes
const mapClassFromDb = (c: any) => ({
  ...c,
  gradeLevel: c.grade_level || c.gradelevel || 'N/A',
  classCode: c.class_code || c.classcode || 'N/A',
  studentCount: c.students?.[0]?.count || 0,
  teachers: c.class_subject_teachers?.map((link: any) => {
    const profile = link.teachers?.profiles;
    return {
      id: link.id,
      name: profile ? `${profile.first_name} ${profile.last_name}` : 'Staff Member',
      subject: link.subjects?.name || 'General'
    };
  }) || []
});

const mapStudentFromDb = (s: any) => ({
  ...s,
  admissionNumber: s.admission_number || s.admissionnumber,
  classId: s.class_id || s.classid,
  user: s.profiles ? {
    ...s.profiles,
    firstName: s.profiles.first_name,
    lastName: s.profiles.last_name,
    email: s.profiles.email
  } : null,
  class: s.classes
});

/**
 * Utility to wait for the database trigger to finish creating the profile record.
 */
const ensureProfileExists = async (userId: string, retries = 15) => {
  for (let i = 0; i < retries; i++) {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (data) return true;
    
    const delay = 300; 
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return false;
};

/**
 * Manual Profile Fix: Attempt to create the profile if the trigger failed.
 */
const attemptManualProfileSync = async (userId: string, userData: any, role: string) => {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    email: userData.email,
    first_name: userData.firstName,
    last_name: userData.lastName,
    role: role,
    is_active: true
  });
  
  if (error) {
    if (error.message.includes('row-level security') || error.code === '42501') {
      throw new Error("SETUP_REQUIRED: Database trigger missing and RLS blocking manual sync.");
    }
    throw error;
  }
  return true;
};

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
    return data.map(mapStudentFromDb);
  },

  getStudentsByClass: async (classId: string) => {
    const { data, error } = await supabase
      .from('students')
      .select(`*, profiles:user_id (*), classes:class_id (*)`)
      .eq('class_id', classId);
    
    if (error) throw error;
    return data.map(mapStudentFromDb);
  },
  
  addStudent: async (studentData: any, userData: any, setIgnoreAuthEvents?: (ignore: boolean) => void) => {
    if (setIgnoreAuthEvents) setIgnoreAuthEvents(true);
    
    try {
        const { data: { session: adminSession } } = await supabase.auth.getSession();

        const { data: authData, error } = await supabase.auth.signUp({
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
        const userId = authData.user!.id;
        
        if (adminSession) {
          await supabase.auth.setSession(adminSession);
        }

        let ready = await ensureProfileExists(userId);
        
        if (!ready) {
          try {
            await attemptManualProfileSync(userId, userData, 'student');
            ready = true;
          } catch (e: any) {
            if (e.message.startsWith('SETUP_REQUIRED')) throw e;
            throw new Error("Sync Timeout: The profile record failed to appear. Please ensure your Supabase triggers are active.");
          }
        }

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
    } finally {
        if (setIgnoreAuthEvents) setIgnoreAuthEvents(false);
    }
  },

  updateStudent: async (studentId: string, studentUpdates: any, userUpdates: any) => {
    await supabase.from('students').update({
      admission_number: studentUpdates.admissionNumber,
      class_id: studentUpdates.classId,
      status: studentUpdates.status
    }).eq('id', studentId);

    const { data: student } = await supabase.from('students').select('user_id').eq('id', studentId).single();
    if (student?.user_id) {
       await supabase.from('profiles').update({
         first_name: userUpdates.firstName,
         last_name: userUpdates.lastName,
       }).eq('id', student.user_id);
    }
    return { credentials: null };
  },

  deleteStudent: async (studentId: string) => {
    await supabase.from('students').delete().eq('id', studentId);
  },

  deleteStudentsBulk: async (ids: string[]) => {
    await supabase.from('students').delete().in('id', ids);
  },

  moveStudentToClass: async (studentId: string, classId: string) => {
    await supabase.from('students').update({ class_id: classId }).eq('id', studentId);
  },

  // Classes
  getClasses: async () => {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        class_subject_teachers (
          id,
          teachers:teacher_id (
            profiles:user_id (first_name, last_name)
          ),
          subjects:subject_id (name)
        ),
        students (count)
      `);

    if (error) throw error;
    return data.map(mapClassFromDb);
  },

  getClassById: async (id: string) => {
    const { data, error } = await supabase.from('classes').select('*').eq('id', id).single();
    if (error) throw error;
    return mapClassFromDb(data);
  },

  createClass: async (classData: Partial<Class>) => {
    const classCode = classData.classCode || `CL-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const { data, error } = await supabase.from('classes').insert({
      name: classData.name,
      grade_level: classData.gradeLevel,
      section: classData.section,
      class_code: classCode,
      description: classData.description
    }).select().single();
    
    if (!error) return mapClassFromDb(data);

    if (error.message.includes('column')) {
      const { data: dataB, error: errorB } = await supabase.from('classes').insert({
        name: classData.name,
        gradelevel: classData.gradeLevel,
        section: classData.section,
        classcode: classCode,
        description: classData.description
      }).select().single();
      
      if (!errorB) return mapClassFromDb(dataB);
      throw errorB;
    }
    
    throw error;
  },

  updateClass: async (classId: string, updates: Partial<Class>) => {
    const dbUpdate: any = {
      name: updates.name,
      section: updates.section,
      description: updates.description,
      grade_level: updates.gradeLevel,
      gradelevel: updates.gradeLevel 
    };
    await supabase.from('classes').update(dbUpdate).eq('id', classId);
  },

  deleteClass: async (classId: string) => {
    await supabase.from('classes').delete().eq('id', classId);
  },

  // Teachers & Faculty
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
      user: t.profiles ? {
        firstName: t.profiles.first_name,
        lastName: t.profiles.last_name,
        email: t.profiles.email
      } : null,
      assignments: t.class_subject_teachers?.map((link: any) => ({
        id: link.id,
        className: link.classes?.name || 'Unknown Class',
        subjectName: link.subjects?.name || 'General'
      })) || []
    }));
  },

  addTeacher: async (data: any, setIgnoreAuthEvents?: (ignore: boolean) => void) => {
    if (setIgnoreAuthEvents) setIgnoreAuthEvents(true);
    
    try {
        const { data: { session: adminSession } } = await supabase.auth.getSession();

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

        if (adminSession) {
          await supabase.auth.setSession(adminSession);
        }

        let ready = await ensureProfileExists(userId);
        
        if (!ready) {
          try {
            await attemptManualProfileSync(userId, data, 'teacher');
            ready = true;
          } catch (e: any) {
            if (e.message.startsWith('SETUP_REQUIRED')) throw e;
            throw new Error("Sync Timeout: The system created the account but the database failed to synchronize. Ensure your triggers are running.");
          }
        }

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
    } finally {
        if (setIgnoreAuthEvents) setIgnoreAuthEvents(false);
    }
  },

  deleteTeacher: async (id: string) => {
    await supabase.from('teachers').delete().eq('id', id);
  },

  assignTeacherToClass: async (teacherId: string, classId: string, subjectId: string) => {
    const { data, error } = await supabase
      .from('class_subject_teachers')
      .insert({ teacher_id: teacherId, class_id: classId, subject_id: subjectId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  removeTeacherFromClass: async (id: string) => {
    await supabase.from('class_subject_teachers').delete().eq('id', id);
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
    return data.map(u => ({ ...u, firstName: u.first_name, lastName: u.last_name }));
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
          { id: 2, text: 'Security policies updated', time: '1m ago' }
        ]
      };
    } catch (err) {
      return { studentsCount: 0, staffCount: 0, classesCount: 0, recentActivity: [] };
    }
  }
};
