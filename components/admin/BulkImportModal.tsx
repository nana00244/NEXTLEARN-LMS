import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { adminService } from '../../services/adminService';
import { Spinner } from '../UI/Spinner';
import { Class } from '../../types';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: (successCount?: number) => void;
  classes: Class[];
}

interface ImportRow {
  firstName: string;
  lastName: string;
  email: string;
  admissionNumber: string;
  phone?: string;
  errors: string[];
  isValid: boolean;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, classes }) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'processing'>('upload');
  const [data, setData] = useState<ImportRow[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'First Name': 'John', 'Last Name': 'Doe', 'Email': 'john.doe@example.com', 'Student ID': 'SN1001', 'Phone': '0501234567' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "NextLearn_Student_Import_Template.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws) as any[];

        const processed: ImportRow[] = rawData.map((row: any, index: number) => {
          const errors: string[] = [];
          
          // Map columns flexibly
          const firstName = (row['First Name'] || row['firstName'] || row['First'] || '').toString().trim();
          const lastName = (row['Last Name'] || row['lastName'] || row['Last'] || '').toString().trim();
          const email = (row['Email'] || row['email'] || '').toString().trim();
          const admissionNumber = (row['Student ID'] || row['Student ID #'] || row['admissionNumber'] || row['ID'] || '').toString().trim();
          const phone = (row['Phone'] || row['phone'] || '').toString().trim();

          if (!firstName) errors.push("Missing First Name");
          if (!lastName) errors.push("Missing Last Name");
          if (!email) errors.push("Missing Email");
          else if (!/\S+@\S+\.\S+/.test(email)) errors.push("Invalid Email format");
          
          if (!admissionNumber) errors.push("Missing Student ID");

          return {
            firstName,
            lastName,
            email,
            admissionNumber,
            phone,
            errors,
            isValid: errors.length === 0
          };
        });

        setData(processed);
        setStep('preview');
      } catch (err) {
        alert("Failed to parse Excel file. Please ensure it follows the template.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (!selectedClassId) {
      alert("Please select a target class for the imported students.");
      return;
    }

    const validRows = data.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert("No valid rows to import.");
      return;
    }

    setStep('processing');
    try {
      const bulkPayload = validRows.map(row => ({
        userData: {
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          phone: row.phone
        },
        studentData: {
          admissionNumber: row.admissionNumber,
          classId: selectedClassId,
          status: 'active'
        }
      }));

      await adminService.addStudentsBulk(bulkPayload);
      onClose(validRows.length);
    } catch (err: any) {
      alert("Import failed: " + err.message);
      setStep('preview');
    }
  };

  const validCount = data.filter(r => r.isValid).length;
  const invalidCount = data.length - validCount;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-4xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Bulk Student Import</h2>
            <p className="text-sm text-slate-500">Accelerated institutional enrollment via Excel</p>
          </div>
          <button onClick={() => onClose()} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">&times;</button>
        </div>

        {step === 'upload' && (
          <div className="flex-1 flex flex-col space-y-8">
            <div className="p-10 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem] text-center space-y-6">
              <div className="text-5xl">📄</div>
              <div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Select Spreadsheet</h3>
                <p className="text-sm text-slate-400">Supported formats: .xlsx, .xls</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                accept=".xlsx, .xls"
                onChange={handleFileUpload} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-none"
              >
                {loading ? <Spinner size="sm" /> : 'Choose File'}
              </button>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-widest">Format Requirements</h4>
                <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">Columns: First Name, Last Name, Email, Student ID, Phone (Optional)</p>
              </div>
              <button onClick={downloadTemplate} className="text-xs font-black text-indigo-600 hover:underline uppercase tracking-widest">Download Template</button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="flex-1 flex flex-col overflow-hidden space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-700">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Target Class</span>
                <select 
                  className="bg-transparent border-0 font-bold text-sm outline-none focus:ring-0 dark:text-white"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="">Select Target...</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-around border border-slate-100 dark:border-slate-700">
                <div className="text-center">
                  <p className="text-lg font-black text-emerald-600">{validCount}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Valid</p>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                <div className="text-center">
                  <p className="text-lg font-black text-rose-600">{invalidCount}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Invalid</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-2xl custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 font-black text-slate-400 uppercase">Name</th>
                    <th className="px-4 py-3 font-black text-slate-400 uppercase">Email</th>
                    <th className="px-4 py-3 font-black text-slate-400 uppercase">ID</th>
                    <th className="px-4 py-3 font-black text-slate-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {data.map((row, i) => (
                    <tr key={i} className={row.isValid ? '' : 'bg-rose-50/30 dark:bg-rose-900/10'}>
                      <td className="px-4 py-3 font-bold">{row.firstName} {row.lastName}</td>
                      <td className="px-4 py-3 font-medium text-slate-500">{row.email}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{row.admissionNumber}</td>
                      <td className="px-4 py-3">
                        {row.isValid ? (
                          <span className="text-emerald-600 font-black uppercase text-[10px]">Ready</span>
                        ) : (
                          <span className="text-rose-500 font-bold" title={row.errors.join(", ")}>⚠️ Error</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={handleImport}
                disabled={validCount === 0 || !selectedClassId}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50"
              >
                Import {validCount} Valid Students
              </button>
              <button 
                onClick={() => setStep('upload')}
                className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-bold uppercase tracking-widest"
              >
                Re-upload
              </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <Spinner size="lg" />
            <div className="text-center">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Processing Ledger...</h3>
              <p className="text-sm text-slate-500">Integrating students and calculating arrears</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};