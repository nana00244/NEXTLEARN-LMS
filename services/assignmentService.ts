import { 
  collection, doc, getDocs, getDoc, setDoc, updateDoc, 
  deleteDoc, query, where, orderBy, serverTimestamp 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Assignment, Submission } from '../types';

export const assignmentService = {
  getStudentStream: async (userId: string) => {
    // 1. Get student profile to find classId
    const q = query(collection(db, "students"), where("userId", "==", userId));
    const studentSnap = await getDocs(q);
    if (studentSnap.empty) return [];
    
    const student = studentSnap.docs[0].data();
    const classId = student.classId;

    // 2. Query lessons and assignments for this class
    const lessonsQ = query(collection(db, "lessons"), where("classId", "==", classId), orderBy("postedDate", "desc"));
    const assignmentsQ = query(collection(db, "assignments"), where("classId", "==", classId), orderBy("createdAt", "desc"));

    const [lSnap, aSnap] = await Promise.all([getDocs(lessonsQ), getDocs(assignmentsQ)]);

    const items = [
      ...lSnap.docs.map(d => ({ ...d.data(), id: d.id, type: 'lesson' })),
      ...aSnap.docs.map(d => ({ ...d.data(), id: d.id, type: 'assignment' }))
    ];

    // Enrich with teacher info
    return Promise.all(items.map(async (item: any) => {
      const tSnap = await getDoc(doc(db, "users", item.teacherId));
      const sSnap = item.subjectId ? await getDoc(doc(db, "subjects", item.subjectId)) : null;
      return {
        ...item,
        teacher: tSnap.exists() ? tSnap.data() : { firstName: 'Teacher', lastName: '' },
        subject: sSnap?.exists() ? sSnap.data() : { name: 'General' }
      };
    }));
  },

  createAssignment: async (data: Partial<Assignment>) => {
    const id = "a_" + Math.random().toString(36).substr(2, 9);
    const assignment = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      status: data.status || 'published'
    };
    await setDoc(doc(db, "assignments", id), assignment);
    return assignment;
  },

  getTeacherAssignments: async (teacherId: string) => {
    const q = query(collection(db, "assignments"), where("teacherId", "==", teacherId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Assignment[];
  },

  // Fix: Added getStudentAssignments method
  getStudentAssignments: async (userId: string) => {
    const sq = query(collection(db, "students"), where("userId", "==", userId));
    const sSnap = await getDocs(sq);
    if (sSnap.empty) return [];
    const student = sSnap.docs[0].data();
    const studentId = sSnap.docs[0].id;

    const aq = query(collection(db, "assignments"), where("classId", "==", student.classId));
    const aSnap = await getDocs(aq);
    
    return Promise.all(aSnap.docs.map(async (d) => {
      const assignment = d.data();
      const subQ = query(collection(db, "submissions"), where("assignmentId", "==", d.id), where("studentId", "==", studentId));
      const subSnap = await getDocs(subQ);
      
      let status = 'assigned';
      if (!subSnap.empty) {
        const sub = subSnap.docs[0].data();
        status = sub.status === 'graded' || sub.status === 'returned' ? 'graded' : 'completed';
      } else if (new Date(assignment.dueDate) < new Date()) {
        status = 'missing';
      }

      return { ...assignment, id: d.id, status };
    }));
  },

  // Fix: Added getAssignmentDetails method
  getAssignmentDetails: async (assignmentId: string, userId: string) => {
    const [aSnap, sq] = await Promise.all([
      getDoc(doc(db, "assignments", assignmentId)),
      getDocs(query(collection(db, "students"), where("userId", "==", userId)))
    ]);
    
    if (!aSnap.exists() || sq.empty) return null;
    const assignment = aSnap.data();
    const studentId = sq.docs[0].id;

    const subQ = query(collection(db, "submissions"), where("assignmentId", "==", assignmentId), where("studentId", "==", studentId));
    const subSnap = await getDocs(subQ);
    
    return {
      ...assignment,
      id: aSnap.id,
      submission: subSnap.empty ? null : subSnap.docs[0].data()
    };
  },

  // Fix: Added submitAssignment method
  submitAssignment: async (assignmentId: string, userId: string, data: any) => {
    const sq = query(collection(db, "students"), where("userId", "==", userId));
    const sSnap = await getDocs(sq);
    if (sSnap.empty) throw new Error("Student not found");
    const studentId = sSnap.docs[0].id;

    const aSnap = await getDoc(doc(db, "assignments", assignmentId));
    const assignment = aSnap.data();
    
    const id = `sub_${studentId}_${assignmentId}`;
    const submission = {
      id,
      assignmentId,
      studentId,
      submittedDate: new Date().toISOString(),
      studentText: data.text,
      attachments: data.files || [],
      isLate: assignment?.dueDate ? (new Date() > new Date(assignment.dueDate)) : false,
      status: 'submitted'
    };
    await setDoc(doc(db, "submissions", id), submission);
    return submission;
  },

  // Fix: Added updateAssignment method
  updateAssignment: async (id: string, data: Partial<Assignment>) => {
    await updateDoc(doc(db, "assignments", id), data);
  },

  // Fix: Added deleteAssignment method
  deleteAssignment: async (id: string) => {
    await deleteDoc(doc(db, "assignments", id));
  }
};