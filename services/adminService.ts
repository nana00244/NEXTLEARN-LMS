import { supabase, isConfigured } from '../lib/supabase';
import { Student, User, Class, UserRole, Teacher, Subject } from '../types';
import { 
  getStoredStudents, saveStudents,
  getStoredUsers, saveUsers,
  getStoredClasses, saveClasses,
  getStoredSubjects, saveSubjects,
  getStoredTeachers, saveTeachers,
  getStoredTeacherClasses, saveTeacherClasses
} from './mockDb';

// Helper to generate random passwords for new enrollments
const generatePassword = () => 'NextLearn' + Math.floor(1000 + Math.random() * 9000);

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

const mapTeacherFromDb = (t: any) => ({
  ...t,
  employeeId: t.employee_id || t.employeeId,
  user: t.profiles ? {
    ...t.profiles,
    firstName: t.profiles.first_name,
    lastName: t.profiles.last_name,
    email: t.profiles.email
  } : null,
  assignments: t.class_subject_teachers?.map((link: any) => ({
    id: link.id,
    className: link.classes?.name || 'Unknown Class',
    subjectName: link.subjects?.name || 'General'
  })) || []
});

export const adminService = {
  // Stats
  getStats: async () => {
    if (!isConfigured) {
      return {
        studentsCount: getStoredStudents().length,
        staffCount: getStoredUsers().filter(u => u.role !== 'student').length,
        classesCount: getStoredClasses().length,
        recentActivity: [
          { id: 1, text: 'Running in local Demo Mode', time: 'Just now' },
          { id: 2, text: 'Using internal mock database', time: 'Just now' }
        ]
      };
    }

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
  },

  // Student Management
  getStudents: async () => {
    if (!isConfigured) return getStoredStudents().map(s => ({...s, user: getStoredUsers().find(u => u.id === s.userId)}));
    const { data, error } = await supabase.from('students').select('*, profiles:user_id (*), classes:class_id (*)');
    if (error) throw error;
    return data.map(mapStudentFromDb);
  },

  getStudentsByClass: async (classId: string) => {
    if (!isConfigured) return getStoredStudents()
      .filter(s => s.classId === classId)
      .map(s => ({...s, user: getStoredUsers().find(u => u.id === s.userId)}));
    
    const { data, error } = await supabase
      .from('students')
      .select('*, profiles:user_id (*), classes:class_id (*)')
      .eq('class_id', classId);
    if (error) throw error;
    return data.map(mapStudentFromDb);
  },

  addStudent: async (studentData: any, userData: any) => {
    const password = userData.password || generatePassword();
    if (!isConfigured) {
      const users = getStoredUsers();
      const newUser = {
        id: 'u_s_' + Math.random().toString(36).substr(2, 9),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'student',
        passwordHash: password,
        themePreference: 'light',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      saveUsers([...users, newUser]);

      const students = getStoredStudents();
      const newStudent = {
        id: 's_' + Math.random().toString(36).substr(2, 9),
        userId: newUser.id,
        admissionNumber: studentData.admissionNumber,
        classId: studentData.classId,
        status: studentData.status || 'active',
        enrollmentDate: new Date().toISOString()
      };
      saveStudents([...students, newStudent]);

      return { student: newStudent, credentials: { email: newUser.email, password } };
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password,
      options: { data: { first_name: userData.firstName, last_name: userData.lastName, role: 'student' } }
    });
    if (authError) throw authError;

    // Manually create profile to ensure FK constraints are met immediately
    await supabase.from('profiles').upsert({
      id: authData.user?.id,
      email: userData.email,
      first_name: userData.firstName,
      last_name: userData.lastName,
      role: 'student'
    });

    const { data: student, error: studentError } = await supabase.from('students').insert({
      user_id: authData.user?.id,
      admission_number: studentData.admissionNumber,
      class_id: studentData.classId,
      status: studentData.status || 'active'
    }).select().single();
    if (studentError) throw studentError;

    return { student, credentials: { email: userData.email, password } };
  },

  updateStudent: async (id: string, studentData: any, userData: any): Promise<{ success: boolean; credentials?: { email: string; password: string } }> => {
    const credentials = userData.password ? { email: userData.email, password: userData.password } : undefined;

    if (!isConfigured) {
      const students = getStoredStudents();
      const idx = students.findIndex(s => s.id === id);
      if (idx !== -1) {
        students[idx] = { ...students[idx], ...studentData };
        saveStudents(students);
        
        const users = getStoredUsers();
        const uIdx = users.findIndex(u => u.id === students[idx].userId);
        if (uIdx !== -1) {
          users[uIdx] = { ...users[uIdx], firstName: userData.firstName, lastName: userData.lastName, email: userData.email };
          if (userData.password) users[uIdx].passwordHash = userData.password;
          saveUsers(users);
        }
      }
      return { success: true, credentials };
    }

    const { error: studentError } = await supabase.from('students').update({
      admission_number: studentData.admissionNumber,
      class_id: studentData.classId,
      status: studentData.status
    }).eq('id', id);
    if (studentError) throw studentError;

    return { success: true, credentials };
  },

  deleteStudent: async (id: string) => {
    if (!isConfigured) {
      const students = getStoredStudents();
      const s = students.find(item => item.id === id);
      saveStudents(students.filter(item => item.id !== id));
      if (s) {
        const users = getStoredUsers();
        saveUsers(users.filter(u => u.id !== s.userId));
      }
      return;
    }
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) throw error;
  },

  deleteStudentsBulk: async (ids: string[]) => {
    if (!isConfigured) {
      for (const id of ids) await adminService.deleteStudent(id);
      return;
    }
    const { error } = await supabase.from('students').delete().in('id', ids);
    if (error) throw error;
  },

  moveStudentToClass: async (studentId: string, newClassId: string) => {
    if (!isConfigured) {
      const students = getStoredStudents();
      const idx = students.findIndex(s => s.id === studentId);
      if (idx !== -1) {
        students[idx].classId = newClassId;
        saveStudents(students);
      }
      return;
    }
    const { error } = await supabase.from('students').update({ class_id: newClassId }).eq('id', studentId);
    if (error) throw error;
  },

  // Staff Management
  getStaff: async () => {
    if (!isConfigured) return getStoredUsers().filter(u => u.role !== 'student');
    const { data, error } = await supabase.from('profiles').select('*').neq('role', 'student');
    if (error) throw error;
    return data;
  },

  getTeachers: async () => {
    if (!isConfigured) {
      const teachers = getStoredTeachers();
      const users = getStoredUsers();
      const links = getStoredTeacherClasses();
      const classes = getStoredClasses();
      const subjects = getStoredSubjects();

      return teachers.map(t => {
        const user = users.find(u => u.id === t.userId);
        const tLinks = links.filter(l => l.teacherId === t.id);
        return {
          ...t,
          user,
          assignments: tLinks.map(l => ({
            id: l.id,
            className: classes.find(c => c.id === l.classId)?.name,
            subjectName: subjects.find(s => s.id === l.subjectId)?.name
          }))
        };
      });
    }
    const { data, error } = await supabase.from('teachers').select(`
      *, 
      profiles:user_id (*), 
      class_subject_teachers(
        id, 
        classes:class_id(name), 
        subjects:subject_id(name)
      )
    `);
    if (error) throw error;
    return data.map(mapTeacherFromDb);
  },

  addTeacher: async (data: any, setIgnoreAuthEvents: (ignore: boolean) => void) => {
    const password = data.password || 'NextLearn123';
    if (!isConfigured) {
      const users = getStoredUsers();
      const newUser = {
        id: 'u_t_' + Math.random().toString(36).substr(2, 9),
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'teacher',
        passwordHash: password,
        themePreference: 'light',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      saveUsers([...users, newUser]);

      const teachers = getStoredTeachers();
      const newTeacher = {
        id: 't_' + Math.random().toString(36).substr(2, 9),
        userId: newUser.id,
        employeeId: 'EMP' + Math.floor(1000 + Math.random() * 9000),
        specialization: data.specialization,
        status: 'active'
      };
      saveTeachers([...teachers, newTeacher]);

      return { teacher: newTeacher, credentials: { email: data.email, password } };
    }

    setIgnoreAuthEvents(true);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password,
      options: { data: { first_name: data.firstName, last_name: data.lastName, role: 'teacher' } }
    });
    if (authError) {
      setIgnoreAuthEvents(false);
      throw authError;
    }

    // Manually create profile to ensure FK constraints are met immediately
    await supabase.from('profiles').upsert({
      id: authData.user?.id,
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      role: 'teacher'
    });

    const { data: teacher, error: teacherError } = await supabase.from('teachers').insert({
      user_id: authData.user?.id,
      employee_id: 'EMP' + Math.floor(1000 + Math.random() * 9000),
      specialization: data.specialization,
      status: 'active'
    }).select().single();

    setIgnoreAuthEvents(false);
    if (teacherError) throw teacherError;

    return { teacher, credentials: { email: data.email, password } };
  },

  deleteTeacher: async (id: string) => {
    if (!isConfigured) {
      const teachers = getStoredTeachers();
      const t = teachers.find(item => item.id === id);
      saveTeachers(teachers.filter(item => item.id !== id));
      if (t) {
        const users = getStoredUsers();
        // Fix: Changed 's.userId' to 't.userId' to resolve undefined reference
        saveUsers(users.filter(u => u.id !== t.userId));
      }
      return;
    }
    const { error } = await supabase.from('teachers').delete().eq('id', id);
    if (error) throw error;
  },

  // Class Management
  getClasses: async () => {
    if (!isConfigured) {
      const classes = getStoredClasses();
      const students = getStoredStudents();
      const links = getStoredTeacherClasses();
      const teachers = getStoredTeachers();
      const users = getStoredUsers();
      const subjects = getStoredSubjects();

      return classes.map(c => ({
        ...c,
        studentCount: students.filter(s => s.classId === c.id).length,
        teachers: links.filter(l => l.classId === c.id).map(l => {
          const t = teachers.find(item => item.id === l.teacherId);
          const u = users.find(user => user.id === t?.userId);
          const s = subjects.find(sub => sub.id === l.subjectId);
          return {
            id: l.id,
            name: u ? `${u.firstName} ${u.lastName}` : 'Staff Member',
            subject: s?.name || 'General'
          };
        })
      }));
    }
    const { data, error } = await supabase.from('classes').select(`
      *, 
      class_subject_teachers(
        id, 
        teachers:teacher_id(profiles:user_id(first_name, last_name)), 
        subjects:subject_id(name)
      ), 
      students(count)
    `);
    if (error) throw error;
    return data.map(mapClassFromDb);
  },

  getClassById: async (id: string) => {
    if (!isConfigured) return getStoredClasses().find(c => c.id === id);
    const { data, error } = await supabase.from('classes').select('*').eq('id', id).single();
    if (error) throw error;
    return { ...data, gradeLevel: data.grade_level, classCode: data.class_code };
  },

  createClass: async (data: any) => {
    if (!isConfigured) {
      const classes = getStoredClasses();
      const newClass = {
        id: 'c_' + Math.random().toString(36).substr(2, 9),
        name: data.name,
        gradeLevel: data.gradeLevel,
        section: data.section,
        classCode: Math.random().toString(36).substr(2, 6).toUpperCase()
      };
      saveClasses([...classes, newClass]);
      return newClass;
    }
    const { data: cls, error } = await supabase.from('classes').insert({
      name: data.name,
      grade_level: data.gradeLevel,
      section: data.section,
      class_code: Math.random().toString(36).substr(2, 6).toUpperCase()
    }).select().single();
    if (error) throw error;
    return cls;
  },

  updateClass: async (id: string, data: any) => {
    if (!isConfigured) {
      const classes = getStoredClasses();
      const idx = classes.findIndex(c => c.id === id);
      if (idx !== -1) {
        classes[idx] = { ...classes[idx], ...data };
        saveClasses(classes);
      }
      return;
    }
    const { error } = await supabase.from('classes').update({
      name: data.name,
      grade_level: data.gradeLevel,
      section: data.section
    }).eq('id', id);
    if (error) throw error;
  },

  deleteClass: async (id: string) => {
    if (!isConfigured) {
      const classes = getStoredClasses();
      saveClasses(classes.filter(c => c.id !== id));
      return;
    }
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (error) throw error;
  },

  // Faculty Assignments & Subjects
  createSubject: async (name: string) => {
    if (!isConfigured) {
      const subjects = getStoredSubjects();
      const newSub = { id: 'sub_' + Math.random().toString(36).substr(2, 9), name, code: name.slice(0,3).toUpperCase() + '101' };
      saveSubjects([...subjects, newSub]);
      return newSub;
    }
    const { data, error } = await supabase.from('subjects').insert({ name, code: name.slice(0,3).toUpperCase() + '101' }).select().single();
    if (error) throw error;
    return data;
  },

  assignTeacherToClass: async (teacherId: string, classId: string, subjectId: string) => {
    if (!isConfigured) {
      const links = getStoredTeacherClasses();
      const newLink = {
        id: 'link_' + Math.random().toString(36).substr(2, 9),
        teacherId,
        classId,
        subjectId
      };
      saveTeacherClasses([...links, newLink]);
      return newLink;
    }
    const { data, error } = await supabase.from('class_subject_teachers').insert({
      teacher_id: teacherId,
      class_id: classId,
      subject_id: subjectId
    }).select().single();
    if (error) throw error;
    return data;
  },

  removeTeacherFromClass: async (linkId: string) => {
    if (!isConfigured) {
      const links = getStoredTeacherClasses();
      saveTeacherClasses(links.filter(l => l.id !== linkId));
      return;
    }
    const { error } = await supabase.from('class_subject_teachers').delete().eq('id', linkId);
    if (error) throw error;
  }
};