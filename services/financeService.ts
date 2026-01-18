import { 
  collection, getDocs, getDoc, doc, query, where, 
  orderBy, addDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch, setDoc
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { 
  FeeStructure, FeeCategory, StudentFee, 
  Payment, Student, User, Class 
} from '../types';

const handleFirestoreError = (error: any, context: string) => {
  console.error(`[FinanceService] ${context} Error:`, error);
  if (error.code === 'permission-denied' || error.message?.includes('permission')) {
    const customError = new Error(`ACCESS DENIED: Database security rules are blocking the '${context}' operation. Please update your Firestore Rules.`);
    (customError as any).code = 'permission-denied';
    throw customError;
  }
  throw error;
};

export const financeService = {
  /**
   * MASTER SYNC: RECONCILE LEDGER WITH BILLING RULES
   * Updates totalDue based on active components while preserving existing 'paid' totals.
   * Now supports: All Classes, Specific Class, and Individual Student scopes.
   */
  syncAllStudentFees: async () => {
    console.log('=== [Finance] LEDGER SYNCHRONIZATION STARTED ===');
    
    try {
      const [
        componentsSnap, 
        studentsSnap, 
        usersSnap, 
        classesSnap, 
        summariesSnap 
      ] = await Promise.all([
        getDocs(collection(db, "fee_components")),
        getDocs(collection(db, "students")),
        getDocs(query(collection(db, "users"), where("role", "==", "student"))),
        getDocs(collection(db, "classes")),
        getDocs(collection(db, "student_fees"))
      ]);

      const feeComponents = componentsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
      const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
      const userProfiles = new Map(usersSnap.docs.map(d => [d.id, d.data()]));
      const classesMap = new Map(classesSnap.docs.map(d => [d.id, d.data()]));
      const existingSummaries = new Map(summariesSnap.docs.map(d => [d.id, d.data()]));
      
      const batch = writeBatch(db);
      let opCount = 0;

      for (const student of students) {
        const userData = (userProfiles.get(student.userId) || {}) as any;
        const classData = (classesMap.get(student.classId) || {}) as any;
        const currentSummary = (existingSummaries.get(student.id) || {}) as any;
        
        const studentName = `${userData.firstName || 'Student'} ${userData.lastName || ''}`.trim();
        const className = classData.name || student.className || 'Unassigned';

        let totalDue = 0;
        const applicableFees: any[] = [];
        
        if (feeComponents.length > 0) {
          feeComponents.forEach(comp => {
            let applies = false;
            
            // Scope-based assignment logic
            if (comp.targetScope === 'individual_students') {
              // Priority 1: Individual assignments
              applies = comp.targetStudents?.includes(student.id);
            } else if (comp.targetScope === 'specific_class') {
              // Priority 2: Specific Class assignments
              applies = comp.classId === student.classId || comp.applicableClass === className;
            } else {
              // Priority 3: All Classes (Default/Legacy)
              applies = comp.applicableClass === 'All Classes' || comp.targetScope === 'all_classes';
            }
            
            if (applies && comp.isActive !== false) {
              const amount = parseFloat(comp.amount) || 0;
              totalDue += amount;
              applicableFees.push({
                feeId: comp.id,
                feeName: comp.feeName,
                amount: amount,
                category: comp.category,
                targetScope: comp.targetScope || 'all_classes'
              });
            }
          });
        }

        const paid = parseFloat(currentSummary.paid) || 0;
        const balance = Math.max(0, totalDue - paid);
        
        let status = 'UNPAID';
        if (totalDue === 0 && paid === 0) {
          status = 'NO_FEES';
        } else if (totalDue > 0 && balance <= 0) {
          status = 'PAID';
        } else if (paid > 0) {
          status = 'PARTIAL';
        } else if (totalDue === 0 && paid > 0) {
          status = 'OVERPAID';
        }

        const summaryRef = doc(db, "student_fees", student.id);
        const summaryData = {
          studentId: student.id,
          studentName,
          admissionNumber: student.admissionNumber || 'ID-RESERVED',
          class: className,
          classId: student.classId || '',
          totalDue,
          paid, 
          balance,
          status,
          applicableFees,
          lastSyncedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        batch.set(summaryRef, summaryData);
        opCount++;

        if (opCount >= 450) {
          await batch.commit();
          opCount = 0;
        }
      }

      if (opCount > 0) await batch.commit();
      console.log('=== [Finance] Sync Complete: Ledger Reconciled. ===');
      return { success: true };
    } catch (error: any) {
      return handleFirestoreError(error, "syncAllStudentFees");
    }
  },

  resetFinancialSystem: async (operatorId: string, operatorName: string) => {
    console.log('=== [Finance] INITIATING FULL SYSTEM WIPE ===');
    try {
      const [studentsSnap, transactionsSnap] = await Promise.all([
        getDocs(collection(db, "students")),
        getDocs(collection(db, "financial_records"))
      ]);
      
      const batch = writeBatch(db);
      
      studentsSnap.forEach(sDoc => {
        const student = sDoc.data();
        const ref = doc(db, "student_fees", sDoc.id);
        batch.set(ref, {
          studentId: sDoc.id,
          studentName: student.name || 'Unknown',
          class: student.class || 'Unknown',
          classId: student.classId || '',
          totalDue: 0,
          paid: 0,
          balance: 0,
          status: 'NO_FEES',
          applicableFees: [],
          resetAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          note: 'Master System Reset Performed'
        });
      });

      for (const tDoc of transactionsSnap.docs) {
        const tx = tDoc.data();
        const archiveRef = doc(collection(db, "archived_financial_records"));
        batch.set(archiveRef, {
          ...tx,
          archivedAt: serverTimestamp(),
          archiveReason: 'Term transition/System reset'
        });
        batch.delete(tDoc.ref);
      }

      const logRef = doc(collection(db, "accountant_activity"));
      batch.set(logRef, {
        accountantId: operatorId,
        action: 'MASTER_FINANCIAL_RESET',
        details: `FULL WIPE: ${studentsSnap.size} students zeroed, ${transactionsSnap.size} payments archived by ${operatorName}`,
        timestamp: serverTimestamp()
      });

      await batch.commit();
      console.log('=== [Finance] MASTER RESET COMPLETE ===');
      return { success: true, studentsReset: studentsSnap.size, paymentsArchived: transactionsSnap.size };
    } catch (error: any) {
      return handleFirestoreError(error, "resetFinancialSystem");
    }
  },

  getStudentFinancials: async () => {
    try {
      const snap = await getDocs(collection(db, "student_fees"));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error: any) { return handleFirestoreError(error, "getStudentFinancials"); }
  },

  getAllClasses: async () => {
    try {
      const classesSnap = await getDocs(query(collection(db, "classes"), orderBy("name", "asc")));
      return classesSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
    } catch (error: any) { return handleFirestoreError(error, "getAllClasses"); }
  },

  getFeeCategories: async () => {
    try {
      const q = query(collection(db, "fee_categories"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() })) as FeeCategory[];
    } catch (error: any) { return handleFirestoreError(error, "getFeeCategories"); }
  },
  
  saveFeeCategory: async (category: any, user: User) => {
    try {
      const docRef = await addDoc(collection(db, "fee_categories"), {
        name: category.name.trim().toUpperCase(),
        createdBy: user.id,
        createdAt: serverTimestamp()
      });
      return { id: docRef.id, ...category };
    } catch (error: any) { return handleFirestoreError(error, "saveFeeCategory"); }
  },

  getFeeComponents: async () => {
    try {
      const q = query(collection(db, "fee_components"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error: any) { return handleFirestoreError(error, "getFeeComponents"); }
  },

  createFeeComponent: async (data: any, user: User) => {
    try {
      const payload = {
        ...data,
        amount: parseFloat(data.amount),
        currency: 'GH₵',
        createdBy: user.id,
        createdAt: serverTimestamp(),
        isActive: true
      };
      await addDoc(collection(db, "fee_components"), payload);
      await financeService.syncAllStudentFees();
    } catch (error: any) { return handleFirestoreError(error, "createFeeComponent"); }
  },

  updateFeeComponent: async (id: string, data: any, user: User) => {
    try {
      await updateDoc(doc(db, "fee_components", id), { 
        ...data, 
        amount: parseFloat(data.amount),
        updatedAt: serverTimestamp() 
      });
      await financeService.syncAllStudentFees();
    } catch (error: any) { return handleFirestoreError(error, "updateFeeComponent"); }
  },

  deleteFeeComponent: async (id: string, userId: string) => {
    try {
      await deleteDoc(doc(db, "fee_components", id));
      await financeService.syncAllStudentFees();
    } catch (error: any) { return handleFirestoreError(error, "deleteFeeComponent"); }
  },

  recordPayment: async (data: any) => {
    try {
      const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;
      const amount = parseFloat(data.amount) || 0;
      const studentId = data.studentId;

      const summaryRef = doc(db, "student_fees", studentId);
      const summarySnap = await getDoc(summaryRef);
      if (!summarySnap.exists()) throw new Error("Student financial record not initialized.");
      
      const current = summarySnap.data();
      const newPaid = (parseFloat(current.paid) || 0) + amount;
      const newBalance = Math.max(0, parseFloat(current.totalDue) - newPaid);
      
      let newStatus = 'UNPAID';
      if (newBalance <= 0) newStatus = 'PAID';
      else if (newPaid > 0) newStatus = 'PARTIAL';

      await updateDoc(summaryRef, {
        paid: newPaid,
        balance: newBalance,
        status: newStatus,
        lastPaymentDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const txData = {
        ...data,
        amount,
        receiptNumber,
        previousBalance: current.balance,
        newBalance,
        timestamp: serverTimestamp()
      };
      
      await addDoc(collection(db, "financial_records"), txData);

      return { receiptNumber, amount, ...txData };
    } catch (error: any) { return handleFirestoreError(error, "recordPayment"); }
  }
};