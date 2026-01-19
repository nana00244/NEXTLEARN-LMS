import { 
  collection, doc, getDocs, getDoc, setDoc, updateDoc, 
  deleteDoc, query, where, writeBatch, serverTimestamp 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { financeService } from "./financeService";
import { Student, User, Class, Teacher, Subject, UserRole } from '../types';

export const adminService = {
  getStats: async () => {
    const results = await Promise.allSettled([
      getDocs(collection(db, "students")),
      getDocs(collection(db, "users")),
      getDocs(collection(db, "classes"))
    ]);

    const studentsSnap = results[0].status === 'fulfilled' ? results[0].value : null;
    const usersSnap = results[1].status === 'fulfilled' ? results[1].value : null;
    const classesSnap = results[2].status === 'fulfilled' ? results[2].value : null;

    return {
      studentsCount: studentsSnap ? studentsSnap.size : 0,
      staffCount: usersSnap ? usersSnap.docs.filter(d => d.data().role !== 'student').length : 0,
      classesCount: classesSnap ? classesSnap.size : 0,
      recentActivity: [
        { id: 1, text: 'System connected to Firebase Firestore', time: 'Live' },
        { id: 2, text: 'Real-time database active', time: 'Just now' }
      ]
    };
  },

  getStudents: async () => {
    const studentsSnap = await getDocs(collection(db, "students"));
    const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    const enriched = await Promise.all(students.map(async (s: any) => {
      const [uSnap, cSnap] = await Promise.all([
        getDoc(doc(db, "users", s.userId)),
        s.classId ? getDoc(doc(db, "classes", s.classId)) : Promise.resolve(null)
      ]);
      return {
        ...s,
        user: uSnap.exists() ? uSnap.data() : null,
        class: cSnap?.exists() ? cSnap.data() : null
      };
    }));
    
    return enriched;
  },

  getClasses: async () => {
    const classesSnap = await getDocs(collection(db, "classes"));
    const classes = classesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    const enriched = await Promise.all(classes.map(async (c: any) => {
      const studentsQuery = query(collection(db, "students"), where("classId", "==", c.id));
      const teachersQuery = query(collection(db, "teacher_classes"), where("classId", "==", c.id));
      
      const [sSnap, tSnap] = await Promise.all([
        getDocs(studentsQuery),
        getDocs(teachersQuery)
      ]);

      return {
        ...c,
        studentCount: sSnap.size,
        teachers: tSnap.docs.map(d => d.data())
      };
    }));

    return enriched;
  },

  createClass: async (data: any) => {
    const classId = "c_" + Math.random().toString(36).substr(2, 9);
    const newClass = {
      ...data,
      id: classId,
      classCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
      createdAt: serverTimestamp()
    };
    await setDoc(doc(db, "classes", classId), newClass);
    return newClass;
  },

  deleteClass: async (id: string) => {
    await deleteDoc(doc(db, "classes", id));
  },

  getTeachers: async () => {
    const teachersSnap = await getDocs(collection(db, "teachers"));
    const teachers = teachersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    return Promise.all(teachers.map(async (t: any) => {
      const uSnap = await getDoc(doc(db, "users", t.userId));
      return { ...t, user: uSnap.exists() ? uSnap.data() : null };
    }));
  },

  getStaffMembers: async () => {
    const q = query(collection(db, "users"), where("role", "!=", "student"));
    const snap = await getDocs(q);
    const staff = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return Promise.all(staff.map(async (member: any) => {
      if (member.role === 'teacher') {
        const tq = query(collection(db, "teachers"), where("userId", "==", member.id));
        const tSnap = await getDocs(tq);
        if (!tSnap.empty) {
          return { ...member, teacherData: { id: tSnap.docs[0].id, ...tSnap.docs[0].data() } };
        }
      }
      return member;
    }));
  },

  getStaff: async () => {
    const q = query(collection(db, "users"), where("role", "!=", "student"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  deleteStudent: async (id: string) => {
    const sRef = doc(db, "students", id);
    const sSnap = await getDoc(sRef);
    if (!sSnap.exists()) return;

    const { userId } = sSnap.data();
    const batch = writeBatch(db);
    
    // 1. Delete specialized profile
    batch.delete(sRef);
    // 2. Delete base authentication record
    batch.delete(doc(db, "users", userId));
    // 3. Delete financial ledger entry
    batch.delete(doc(db, "student_fees", id));
    
    await batch.commit();
    await financeService.syncAllStudentFees();
  },

  deleteStaffMember: async (userId: string) => {
    const uRef = doc(db, "users", userId);
    const uSnap = await getDoc(uRef);
    if (!uSnap.exists()) return;

    const data = uSnap.data();
    const batch = writeBatch(db);

    // 1. Delete Specialized Records (Teacher, etc.)
    if (data.role === 'teacher') {
      const tq = query(collection(db, "teachers"), where("userId", "==", userId));
      const tSnap = await getDocs(tq);
      tSnap.forEach(tDoc => batch.delete(tDoc.ref));

      // Remove Class Associations
      const tcq = query(collection(db, "teacher_classes"), where("teacherId", "==", userId));
      const tcSnap = await getDocs(tcq);
      tcSnap.forEach(tcDoc => batch.delete(tcDoc.ref));
    }

    // 2. Delete Base User Profile
    batch.delete(uRef);
    
    await batch.commit();
  },

  deleteStudentsBulk: async (ids: string[]) => {
    const batch = writeBatch(db);
    for (const id of ids) {
      const sRef = doc(db, "students", id);
      const sSnap = await getDoc(sRef);
      if (sSnap.exists()) {
        const { userId } = sSnap.data();
        batch.delete(sRef);
        batch.delete(doc(db, "users", userId));
        batch.delete(doc(db, "student_fees", id));
      }
    }
    await batch.commit();
  },

  updateStudent: async (id: string, studentData: any, userData: any) => {
    const sRef = doc(db, "students", id);
    const sSnap = await getDoc(sRef);
    if (!sSnap.exists()) throw new Error("Student not found");
    
    const { userId } = sSnap.data();
    await updateDoc(sRef, studentData);
    if (userData) {
      await updateDoc(doc(db, "users", userId), userData);
    }
    
    await financeService.syncAllStudentFees();
    return { credentials: userData.password ? { email: userData.email, password: userData.password } : undefined };
  },

  addStudent: async (studentData: any, userData: any) => {
    const userId = "u_" + Math.random().toString(36).substr(2, 9);
    const studentId = "s_" + Math.random().toString(36).substr(2, 9);
    const password = userData.password || "NextLearn" + Math.floor(1000 + Math.random() * 9000);
    
    await setDoc(doc(db, "users", userId), {
      ...userData,
      id: userId,
      password, // Explicitly store for admin view in this demo
      role: 'student',
      isActive: true,
      createdAt: serverTimestamp(),
      themePreference: 'light'
    });

    await setDoc(doc(db, "students", studentId), {
      ...studentData,
      id: studentId,
      userId,
      createdAt: serverTimestamp()
    });

    await financeService.syncAllStudentFees();
    return { credentials: { email: userData.email, password } };
  },

  addStudentsBulk: async (studentList: { studentData: any; userData: any }[]) => {
    const batch = writeBatch(db);
    const credentialsList: { email: string; password: string }[] = [];

    for (const entry of studentList) {
      const userId = "u_" + Math.random().toString(36).substr(2, 9);
      const studentId = "s_" + Math.random().toString(36).substr(2, 9);
      const password = entry.userData.password || "NextLearn" + Math.floor(1000 + Math.random() * 9000);

      const userRef = doc(db, "users", userId);
      batch.set(userRef, {
        ...entry.userData,
        id: userId,
        password,
        role: 'student',
        isActive: true,
        createdAt: serverTimestamp(),
        themePreference: 'light'
      });

      const studentRef = doc(db, "students", studentId);
      batch.set(studentRef, {
        ...entry.studentData,
        id: studentId,
        userId,
        createdAt: serverTimestamp()
      });

      credentialsList.push({ email: entry.userData.email, password });
    }

    await batch.commit();
    await financeService.syncAllStudentFees();
    return credentialsList;
  },

  addStaff: async (data: any) => {
    const userId = "u_" + Math.random().toString(36).substr(2, 9);
    const password = data.password || data.role.charAt(0).toUpperCase() + data.role.slice(1) + Math.floor(1000 + Math.random() * 9000);

    await setDoc(doc(db, "users", userId), {
      id: userId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password, // Explicitly store for admin view in this demo
      role: data.role as UserRole,
      isActive: true,
      createdAt: serverTimestamp(),
      themePreference: 'light'
    });

    if (data.role === 'teacher') {
      const teacherId = "t_" + Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, "teachers", teacherId), {
        id: teacherId,
        userId,
        specialization: data.specialization || 'General',
        status: 'active',
        createdAt: serverTimestamp()
      });
    }

    return { credentials: { email: data.email, password } };
  },

  updateStaff: async (userId: string, data: any) => {
    const uRef = doc(db, "users", userId);
    await updateDoc(uRef, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      role: data.role,
      updatedAt: serverTimestamp()
    });

    if (data.role === 'teacher') {
      const tq = query(collection(db, "teachers"), where("userId", "==", userId));
      const tSnap = await getDocs(tq);
      if (!tSnap.empty) {
        await updateDoc(doc(db, "teachers", tSnap.docs[0].id), {
          specialization: data.specialization,
          updatedAt: serverTimestamp()
        });
      }
    }
  },

  resetUserPassword: async (userId: string) => {
    const uRef = doc(db, "users", userId);
    const uSnap = await getDoc(uRef);
    if (!uSnap.exists()) throw new Error("User not found");
    
    const role = uSnap.data().role;
    const newPassword = role.charAt(0).toUpperCase() + role.slice(1) + Math.floor(1000 + Math.random() * 9000);
    
    await updateDoc(uRef, { password: newPassword });
    return { email: uSnap.data().email, password: newPassword };
  },

  updateUserPassword: async (userId: string, newPassword: string) => {
    const uRef = doc(db, "users", userId);
    await updateDoc(uRef, { password: newPassword });
  },

  updateClass: async (id: string, data: any) => {
    await updateDoc(doc(db, "classes", id), data);
  },

  createSubject: async (name: string) => {
    const id = "sub_" + Math.random().toString(36).substr(2, 9);
    const sub = { id, name, code: name.toUpperCase().substr(0, 3) + Math.floor(100 + Math.random() * 900) };
    await setDoc(doc(db, "subjects", id), sub);
    return sub;
  },

  assignTeacherToClass: async (teacherId: string, classId: string, subjectId: string) => {
    const id = `tc_${teacherId}_${classId}_${subjectId}`;
    await setDoc(doc(db, "teacher_classes", id), {
      id,
      teacherId,
      classId,
      subjectId,
      assignedAt: serverTimestamp()
    });
  },

  removeTeacherFromClass: async (id: string) => {
    await deleteDoc(doc(db, "teacher_classes", id));
  },

  addTeacher: async (data: any) => {
    const userId = "u_" + Math.random().toString(36).substr(2, 9);
    const teacherId = "t_" + Math.random().toString(36).substr(2, 9);
    const password = data.password || "Teacher" + Math.floor(1000 + Math.random() * 9000);

    await setDoc(doc(db, "users", userId), {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      id: userId,
      password,
      role: 'teacher',
      isActive: true,
      createdAt: serverTimestamp(),
      themePreference: 'light'
    });

    await setDoc(doc(db, "teachers", teacherId), {
      id: teacherId,
      userId,
      specialization: data.specialization,
      status: 'active',
      createdAt: serverTimestamp()
    });

    return { credentials: { email: data.email, password } };
  },

  deleteTeacher: async (id: string) => {
    await deleteDoc(doc(db, "teachers", id));
  },

  getClassById: async (id: string) => {
    const snap = await getDoc(doc(db, "classes", id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  getStudentsByClass: async (classId: string) => {
    const q = query(collection(db, "students"), where("classId", "==", classId));
    const snap = await getDocs(q);
    return Promise.all(snap.docs.map(async (d) => {
      const student = d.data();
      const uSnap = await getDoc(doc(db, "users", student.userId));
      return { ...student, id: d.id, user: uSnap.exists() ? uSnap.data() : null };
    }));
  },

  moveStudentToClass: async (studentId: string, newClassId: string) => {
    await updateDoc(doc(db, "students", studentId), { classId: newClassId });
    await financeService.syncAllStudentFees();
  }
};