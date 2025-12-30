
import { STORAGE_KEYS } from '../constants';
import { 
  FeeStructure, FeeCategory, StudentFee, 
  Payment, PayrollRecord, Student, User 
} from '../types';

const getTable = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveTable = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const financeService = {
  // Stats
  getFinancialSummary: async () => {
    const studentFees = getTable<StudentFee>(STORAGE_KEYS.MOCK_DB_STUDENT_FEES);
    const payments = getTable<Payment>(STORAGE_KEYS.MOCK_DB_PAYMENTS);
    
    const totalDue = studentFees.reduce((acc, curr) => acc + curr.amountDue, 0);
    const totalCollected = payments.reduce((acc, curr) => acc + curr.amount, 0);
    const outstanding = totalDue - totalCollected;
    const collectionRate = totalDue > 0 ? (totalCollected / totalDue) * 100 : 0;
    const defaultersCount = studentFees.filter(f => f.balance > 0).length;

    return {
      totalCollected,
      outstanding,
      collectionRate: collectionRate.toFixed(1),
      defaultersCount
    };
  },

  // Fee Management
  getFeeCategories: async () => getTable<FeeCategory>(STORAGE_KEYS.MOCK_DB_FEE_CATEGORIES),
  
  saveFeeCategory: async (category: Partial<FeeCategory>) => {
    const categories = getTable<FeeCategory>(STORAGE_KEYS.MOCK_DB_FEE_CATEGORIES);
    const newCat = { 
      name: category.name || '',
      description: category.description || '',
      id: Math.random().toString(36).substr(2, 9) 
    } as FeeCategory;
    saveTable(STORAGE_KEYS.MOCK_DB_FEE_CATEGORIES, [...categories, newCat]);
    return newCat;
  },

  getFeeStructures: async () => {
    const structures = getTable<FeeStructure>(STORAGE_KEYS.MOCK_DB_FEE_STRUCTURES);
    const classes = getTable<any>(STORAGE_KEYS.MOCK_DB_CLASSES);
    const categories = getTable<FeeCategory>(STORAGE_KEYS.MOCK_DB_FEE_CATEGORIES);
    
    return structures.map(s => ({
      ...s,
      class: classes.find((c: any) => c.id === s.classId),
      category: categories.find(cat => cat.id === s.categoryId)
    }));
  },

  createFeeStructure: async (data: Partial<FeeStructure>) => {
    const structures = getTable<FeeStructure>(STORAGE_KEYS.MOCK_DB_FEE_STRUCTURES);
    const newStructure = { 
      ...data, 
      id: Math.random().toString(36).substr(2, 9),
      isMandatory: data.isMandatory ?? true 
    } as FeeStructure;
    saveTable(STORAGE_KEYS.MOCK_DB_FEE_STRUCTURES, [...structures, newStructure]);
    
    // Auto-apply to ALL students in that class (Biling)
    const students = getTable<Student>(STORAGE_KEYS.MOCK_DB_STUDENTS).filter(s => s.classId === data.classId);
    const studentFees = getTable<StudentFee>(STORAGE_KEYS.MOCK_DB_STUDENT_FEES);
    
    const newStudentFees = students.map(s => ({
      id: Math.random().toString(36).substr(2, 9),
      studentId: s.id,
      feeStructureId: newStructure.id,
      amountDue: newStructure.amount,
      amountPaid: 0,
      balance: newStructure.amount,
      status: 'unpaid' as const
    }));
    
    saveTable(STORAGE_KEYS.MOCK_DB_STUDENT_FEES, [...studentFees, ...newStudentFees]);
    return newStructure;
  },

  updateFeeStructure: async (id: string, data: Partial<FeeStructure>) => {
    const structures = getTable<FeeStructure>(STORAGE_KEYS.MOCK_DB_FEE_STRUCTURES);
    const updated = structures.map(s => s.id === id ? { ...s, ...data } : s);
    saveTable(STORAGE_KEYS.MOCK_DB_FEE_STRUCTURES, updated);

    // Update ALL existing student billing records for this fee component
    const studentFees = getTable<StudentFee>(STORAGE_KEYS.MOCK_DB_STUDENT_FEES);
    const updatedStudentFees = studentFees.map(sf => {
      if (sf.feeStructureId === id) {
        const newDue = data.amount ?? sf.amountDue;
        const newBalance = newDue - sf.amountPaid;
        
        let newStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
        if (newBalance <= 0) newStatus = 'paid';
        else if (sf.amountPaid > 0) newStatus = 'partial';

        return {
          ...sf,
          amountDue: newDue,
          balance: newBalance,
          status: newStatus
        } as StudentFee;
      }
      return sf;
    });
    saveTable(STORAGE_KEYS.MOCK_DB_STUDENT_FEES, updatedStudentFees);
  },

  deleteFeeStructure: async (id: string) => {
    const structures = getTable<FeeStructure>(STORAGE_KEYS.MOCK_DB_FEE_STRUCTURES);
    saveTable(STORAGE_KEYS.MOCK_DB_FEE_STRUCTURES, structures.filter(s => s.id !== id));
    
    const studentFees = getTable<StudentFee>(STORAGE_KEYS.MOCK_DB_STUDENT_FEES);
    saveTable(STORAGE_KEYS.MOCK_DB_STUDENT_FEES, studentFees.filter(sf => sf.feeStructureId !== id));
  },

  // Student Roster
  getStudentFinancials: async () => {
    const students = getTable<Student>(STORAGE_KEYS.MOCK_DB_STUDENTS);
    const users = getTable<User>(STORAGE_KEYS.MOCK_DB_USERS);
    const studentFees = getTable<StudentFee>(STORAGE_KEYS.MOCK_DB_STUDENT_FEES);
    const classes = getTable<any>(STORAGE_KEYS.MOCK_DB_CLASSES);

    return students.map(s => {
      const user = users.find(u => u.id === s.userId);
      const fees = studentFees.filter(f => f.studentId === s.id);
      
      const totalDue = fees.reduce((acc, curr) => acc + curr.amountDue, 0);
      const totalPaid = fees.reduce((acc, curr) => acc + curr.amountPaid, 0);
      const balance = totalDue - totalPaid;
      const cls = classes.find((c: any) => c.id === s.classId);

      let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
      if (balance <= 0 && totalDue > 0) status = 'paid';
      else if (totalPaid > 0) status = 'partial';

      return {
        id: s.id,
        name: `${user?.firstName} ${user?.lastName}`,
        admissionNumber: s.admissionNumber,
        className: cls?.name || 'Unassigned',
        totalDue,
        totalPaid,
        balance,
        status
      };
    });
  },

  // Payments
  recordPayment: async (data: Partial<Payment>) => {
    const payments = getTable<Payment>(STORAGE_KEYS.MOCK_DB_PAYMENTS);
    const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;
    const newPayment = { 
      ...data, 
      id: Math.random().toString(36).substr(2, 9),
      paymentDate: new Date().toISOString(),
      receiptNumber
    } as Payment;
    
    saveTable(STORAGE_KEYS.MOCK_DB_PAYMENTS, [...payments, newPayment]);

    // Update Student Fees balance
    let paymentLeft = data.amount || 0;
    const studentFees = getTable<StudentFee>(STORAGE_KEYS.MOCK_DB_STUDENT_FEES);
    
    // Sort student fees so we pay off unpaid ones first (simplified)
    const updatedStudentFees = studentFees.map(fee => {
      if (fee.studentId === data.studentId && paymentLeft > 0 && fee.balance > 0) {
        const payAmount = Math.min(paymentLeft, fee.balance);
        const newPaid = fee.amountPaid + payAmount;
        const newBalance = fee.amountDue - newPaid;
        paymentLeft -= payAmount;
        
        return {
          ...fee,
          amountPaid: newPaid,
          balance: newBalance,
          status: newBalance <= 0 ? 'paid' : 'partial'
        } as StudentFee;
      }
      return fee;
    });

    saveTable(STORAGE_KEYS.MOCK_DB_STUDENT_FEES, updatedStudentFees);
    return newPayment;
  },

  getPaymentHistory: async (studentId: string) => {
    const payments = getTable<Payment>(STORAGE_KEYS.MOCK_DB_PAYMENTS);
    return payments.filter(p => p.studentId === studentId).sort((a,b) => b.paymentDate.localeCompare(a.paymentDate));
  }
};
