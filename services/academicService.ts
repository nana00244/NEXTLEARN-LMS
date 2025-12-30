
import { STORAGE_KEYS } from '../constants';
import { Term, Announcement, SchoolEvent, AppNotification } from '../types';

const getTable = <T>(key: string): T[] => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

const saveTable = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const academicService = {
  // Terms
  getTerms: async () => getTable<Term>(STORAGE_KEYS.MOCK_DB_TERMS),
  getCurrentTerm: async () => getTable<Term>(STORAGE_KEYS.MOCK_DB_TERMS).find(t => t.isCurrent),

  // Announcements
  getAnnouncements: async (role?: string, classId?: string) => {
    const all = getTable<Announcement>(STORAGE_KEYS.MOCK_DB_ANNOUNCEMENTS);
    return all.filter(a => 
      (!a.targetRole || a.targetRole === role) && 
      (!a.targetClassId || a.targetClassId === classId)
    ).sort((a,b) => b.postedDate.localeCompare(a.postedDate));
  },

  createAnnouncement: async (data: Partial<Announcement>) => {
    const all = getTable<Announcement>(STORAGE_KEYS.MOCK_DB_ANNOUNCEMENTS);
    const newA = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      postedDate: new Date().toISOString(),
      isPinned: !!data.isPinned
    } as Announcement;
    saveTable(STORAGE_KEYS.MOCK_DB_ANNOUNCEMENTS, [...all, newA]);
    return newA;
  },

  // Notifications
  getNotifications: async (userId: string) => {
    return getTable<AppNotification>(STORAGE_KEYS.MOCK_DB_NOTIFICATIONS)
      .filter(n => n.userId === userId)
      .sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  },

  markNotificationRead: async (id: string) => {
    const all = getTable<AppNotification>(STORAGE_KEYS.MOCK_DB_NOTIFICATIONS);
    const updated = all.map(n => n.id === id ? { ...n, isRead: true } : n);
    saveTable(STORAGE_KEYS.MOCK_DB_NOTIFICATIONS, updated);
  },

  createNotification: async (data: Partial<AppNotification>) => {
    const all = getTable<AppNotification>(STORAGE_KEYS.MOCK_DB_NOTIFICATIONS);
    const newN = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      isRead: false,
      createdAt: new Date().toISOString()
    } as AppNotification;
    saveTable(STORAGE_KEYS.MOCK_DB_NOTIFICATIONS, [...all, newN]);
    return newN;
  },

  // Events
  getEvents: async () => getTable<SchoolEvent>(STORAGE_KEYS.MOCK_DB_EVENTS)
};
