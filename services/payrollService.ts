import { 
  collection, getDocs, getDoc, doc, query, where, 
  setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { SalaryStructure, Payslip, User } from '../types';
import { loggingService } from './loggingService';

const handleFirestoreError = (error: any, context: string) => {
  console.error(`[PayrollService] ${context} Error:`, error);
  if (error.code === 'permission-denied') {
    throw new Error("ACCESS DENIED: Your Firebase Security Rules are blocking this action. Please check the System Health dashboard on the Payroll page.");
  }
  throw error;
};

/**
 * Utility to remove undefined values from objects before sending to Firestore.
 * Firestore does not support 'undefined' as a value.
 */
const cleanFirebaseData = (data: any) => {
  const cleaned: any = {};
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        cleaned[key] = cleanFirebaseData(value);
      } else {
        cleaned[key] = value;
      }
    }
  });
  return cleaned;
};

export const payrollService = {
  getSalaryStructures: async () => {
    try {
      const snap = await getDocs(collection(db, "salary_structures"));
      return snap.docs.map(d => ({ id: d.id, ...d.data() })) as SalaryStructure[];
    } catch (error: any) {
      return handleFirestoreError(error, "getSalaryStructures");
    }
  },

  getSalaryStructureForUser: async (userId: string) => {
    try {
      const q = query(collection(db, "salary_structures"), where("userId", "==", userId));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as SalaryStructure;
    } catch (error: any) {
      return handleFirestoreError(error, "getSalaryStructureForUser");
    }
  },

  saveSalaryStructure: async (data: Partial<SalaryStructure> & { userId: string }) => {
    try {
      console.log('[PayrollService] Preparing to save salary structure:', data);
      
      const base = data.baseSalary || 0;
      const allowances = (data.housingAllowance || 0) + (data.transportAllowance || 0) + (data.otherAllowances || 0);
      const deductions = (data.taxDeduction || 0) + (data.insuranceDeduction || 0);
      const net = base + allowances - deductions;

      // Determine Document ID
      const docId = data.id || `salary_${data.userId}`;
      
      // CRITICAL FIX: Destructure 'id' out so it's not part of the document body if it's undefined
      // Also ensures we don't save the id field inside the document if it causes issues
      const { id, ...dataWithoutId } = data;

      const structureData = {
        ...dataWithoutId,
        netPay: net,
        updatedAt: serverTimestamp()
      };

      // CRITICAL FIX: Strip all undefined values
      const cleanedPayload = cleanFirebaseData(structureData);
      
      console.log(`[PayrollService] Writing to salary_structures/${docId}:`, cleanedPayload);

      await setDoc(doc(db, "salary_structures", docId), cleanedPayload, { merge: true });
      await loggingService.logAction(data.userId, 'UPDATE_SALARY_STRUCTURE', `Salary updated to Net: GH₵${net}`);
      
      return { id: docId, ...cleanedPayload } as SalaryStructure;
    } catch (error: any) {
      return handleFirestoreError(error, "saveSalaryStructure");
    }
  },

  generateMonthlyPayroll: async (month: string, year: number) => {
    try {
      const structuresSnap = await getDocs(collection(db, "salary_structures"));
      const batch = writeBatch(db);
      const payslips: Payslip[] = [];

      structuresSnap.forEach(sDoc => {
        const s = sDoc.data() as SalaryStructure;
        const psId = `PS-${s.userId}-${month}-${year}`;
        
        const psData: Payslip = {
          id: psId,
          userId: s.userId,
          month,
          year,
          grossPay: s.baseSalary + (s.housingAllowance || 0) + (s.transportAllowance || 0) + (s.otherAllowances || 0),
          totalDeductions: (s.taxDeduction || 0) + (s.insuranceDeduction || 0),
          netPay: s.netPay,
          status: 'processed',
          paymentDate: new Date().toISOString()
        };
        
        const psRef = doc(db, "payslips", psId);
        // Ensure data is clean for payslips too
        const { id, ...psPayload } = psData;
        batch.set(psRef, { ...cleanFirebaseData(psPayload), createdAt: serverTimestamp() });
        payslips.push(psData);
      });

      if (!structuresSnap.empty) {
        await batch.commit();
      }
      
      return payslips;
    } catch (error: any) {
      return handleFirestoreError(error, "generateMonthlyPayroll");
    }
  },

  getPayslipsForUser: async (userId: string) => {
    try {
      const q = query(collection(db, "payslips"), where("userId", "==", userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Payslip[];
    } catch (error: any) {
      return handleFirestoreError(error, "getPayslipsForUser");
    }
  }
};