
import { STORAGE_KEYS } from '../constants';
import { ActivityLog } from '../types';

const getLogs = (): ActivityLog[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.MOCK_DB_ACTIVITY_LOGS);
  return stored ? JSON.parse(stored) : [];
};

const saveLogs = (logs: ActivityLog[]) => {
  localStorage.setItem(STORAGE_KEYS.MOCK_DB_ACTIVITY_LOGS, JSON.stringify(logs));
};

export const loggingService = {
  logAction: (userId: string, action: string, details?: string) => {
    const logs = getLogs();
    const newLog: ActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    // Keep only last 500 logs for performance in local storage
    saveLogs([newLog, ...logs].slice(0, 500));
  },

  getLogs: async () => {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 500));
    const logs = getLogs();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.MOCK_DB_USERS) || '[]');
    
    return logs.map(log => ({
      ...log,
      user: users.find((u: any) => u.id === log.userId)
    }));
  }
};
