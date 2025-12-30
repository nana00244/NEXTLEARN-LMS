
import { STORAGE_KEYS } from '../constants';
import { SalaryStructure, Payslip, User } from '../types';

const getTable = <T>(key: string): T[] => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

const saveTable = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const payrollService = {
  getSalaryStructures: async () => getTable<SalaryStructure>(STORAGE_KEYS.MOCK_DB_SALARY_STRUCTURES),

  getSalaryStructureForUser: async (userId: string) => {
    return getTable<SalaryStructure>(STORAGE_KEYS.MOCK_DB_SALARY_STRUCTURES).find(s => s.userId === userId);
  },

  saveSalaryStructure: async (data: Partial<SalaryStructure>) => {
    const all = getTable<SalaryStructure>(STORAGE_KEYS.MOCK_DB_SALARY_STRUCTURES);
    const base = data.baseSalary || 0;
    const allowances = (data.housingAllowance || 0) + (data.transportAllowance || 0) + (data.otherAllowances || 0);
    const deductions = (data.taxDeduction || 0) + (data.insuranceDeduction || 0);
    const net = base + allowances - deductions;

    const newStruct = {
      ...data,
      id: data.id || Math.random().toString(36).substr(2, 9),
      netPay: net
    } as SalaryStructure;

    const updated = all.some(s => s.id === newStruct.id)
      ? all.map(s => s.id === newStruct.id ? newStruct : s)
      : [...all, newStruct];

    saveTable(STORAGE_KEYS.MOCK_DB_SALARY_STRUCTURES, updated);
    return newStruct;
  },

  generateMonthlyPayroll: async (month: string, year: number) => {
    const structures = getTable<SalaryStructure>(STORAGE_KEYS.MOCK_DB_SALARY_STRUCTURES);
    const payslips: Payslip[] = [];

    for (const s of structures) {
      const ps: Payslip = {
        id: `PS-${s.userId}-${month}-${year}`,
        userId: s.userId,
        month,
        year,
        grossPay: s.baseSalary + s.housingAllowance + s.transportAllowance + s.otherAllowances,
        totalDeductions: s.taxDeduction + s.insuranceDeduction,
        netPay: s.netPay,
        status: 'processed',
        paymentDate: ''
      };
      payslips.push(ps);
    }

    const existing = getTable<Payslip>(STORAGE_KEYS.MOCK_DB_PAYSLIPS);
    saveTable(STORAGE_KEYS.MOCK_DB_PAYSLIPS, [...existing, ...payslips]);
    return payslips;
  },

  getPayslipsForUser: async (userId: string) => {
    return getTable<Payslip>(STORAGE_KEYS.MOCK_DB_PAYSLIPS).filter(ps => ps.userId === userId);
  }
};
