import { 
  collection, doc, getDocs, getDoc, setDoc, updateDoc, 
  deleteDoc, query, where, orderBy, serverTimestamp 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Lesson, Topic, Class, Subject, Announcement } from '../types';

export const teacherService = {
  getAssignedClasses: async (teacherUserId: string) => {
    // Get teacher doc first
    const tq = query(collection(db, "teachers"), where("userId", "==", teacherUserId));
    const tSnap = await getDocs(tq);
    if (tSnap.empty) return [];
    
    const teacherId = tSnap.docs[0].id;
    const q = query(collection(db, "teacher_classes"), where("teacherId", "==", teacherId));
    const linksSnap = await getDocs(q);

    return Promise.all(linksSnap.docs.map(async (linkDoc) => {
      const link = linkDoc.data();
      const [cSnap, sSnap] = await Promise.all([
        getDoc(doc(db, "classes", link.classId)),
        getDoc(doc(db, "subjects", link.subjectId))
      ]);
      return {
        ...link,
        id: linkDoc.id,
        class: cSnap.exists() ? cSnap.data() : null,
        subject: sSnap.exists() ? sSnap.data() : null
      };
    }));
  },

  getClassById: async (id: string) => {
    const snap = await getDoc(doc(db, "classes", id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Class : null;
  },

  getClassRoster: async (classId: string) => {
    const q = query(collection(db, "students"), where("classId", "==", classId));
    const snap = await getDocs(q);
    
    return Promise.all(snap.docs.map(async (d) => {
      const student = d.data();
      const uSnap = await getDoc(doc(db, "users", student.userId));
      return { ...student, id: d.id, user: uSnap.exists() ? uSnap.data() : null };
    }));
  },

  postAnnouncement: async (classId: string, subjectId: string, teacherId: string, content: string, attachments: any[] = []) => {
    const id = "ann_" + Math.random().toString(36).substr(2, 9);
    const announcement = {
      id,
      targetClassId: classId,
      subjectId,
      authorId: teacherId,
      content,
      postedDate: new Date().toISOString(),
      attachments: attachments || []
    };
    await setDoc(doc(db, "announcements", id), announcement);
    return announcement;
  },

  getClassAnnouncements: async (classId: string, subjectId: string) => {
    const q = query(collection(db, "announcements"), where("targetClassId", "==", classId), orderBy("postedDate", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data()) as Announcement[];
  },

  // Fix: Added getLessons method
  getLessons: async (classId: string, subjectId: string) => {
    const q = query(collection(db, "lessons"), where("classId", "==", classId), where("subjectId", "==", subjectId), orderBy("postedDate", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Lesson[];
  },

  // Fix: Added getTopics method
  getTopics: async (classId: string, subjectId: string) => {
    const q = query(collection(db, "topics"), where("classId", "==", classId), where("subjectId", "==", subjectId), orderBy("order", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Topic[];
  },

  // Fix: Added createTopic method
  createTopic: async (name: string, classId: string, subjectId: string) => {
    const id = "top_" + Math.random().toString(36).substr(2, 9);
    const topic = { id, name, classId, subjectId, order: Date.now() };
    await setDoc(doc(db, "topics", id), topic);
    return topic;
  },

  // Fix: Added createLesson method
  createLesson: async (data: Partial<Lesson>) => {
    const id = "les_" + Math.random().toString(36).substr(2, 9);
    const lesson = {
      ...data,
      id,
      postedDate: new Date().toISOString(),
      attachments: data.attachments || []
    };
    await setDoc(doc(db, "lessons", id), lesson);
    return lesson;
  },

  // Fix: Added deleteLesson method
  deleteLesson: async (id: string) => {
    await deleteDoc(doc(db, "lessons", id));
  },

  // Fix: Added updateLesson method
  updateLesson: async (id: string, data: Partial<Lesson>) => {
    await updateDoc(doc(db, "lessons", id), data);
  },

  // Fix: Added getClassPeople method
  getClassPeople: async (classId: string) => {
    const [roster, tcSnap] = await Promise.all([
      teacherService.getClassRoster(classId),
      getDocs(query(collection(db, "teacher_classes"), where("classId", "==", classId)))
    ]);

    const teacherLinks = tcSnap.docs.map(d => d.data());
    const teachers = await Promise.all(teacherLinks.map(async (link) => {
      const tSnap = await getDoc(doc(db, "teachers", link.teacherId));
      if (!tSnap.exists()) return null;
      const tData = tSnap.data();
      const uSnap = await getDoc(doc(db, "users", tData.userId));
      return uSnap.exists() ? uSnap.data() : null;
    }));

    return {
      students: roster,
      teachers: teachers.filter(Boolean)
    };
  }
};