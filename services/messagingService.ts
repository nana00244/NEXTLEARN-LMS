
import { STORAGE_KEYS } from '../constants';
import { Message, User } from '../types';

const getMessages = (): Message[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.MOCK_DB_MESSAGES);
  return stored ? JSON.parse(stored) : [];
};

export const messagingService = {
  getInbox: async (userId: string) => {
    const all = getMessages();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.MOCK_DB_USERS) || '[]');
    return all
      .filter(m => m.recipientId === userId)
      .map(m => ({
        ...m,
        sender: users.find((u: any) => u.id === m.senderId)
      }))
      .sort((a, b) => b.sentAt.localeCompare(a.sentAt));
  },

  sendMessage: async (msg: Partial<Message>) => {
    const all = getMessages();
    const newM = {
      ...msg,
      id: Math.random().toString(36).substr(2, 9),
      sentAt: new Date().toISOString(),
      isRead: false
    } as Message;
    localStorage.setItem(STORAGE_KEYS.MOCK_DB_MESSAGES, JSON.stringify([...all, newM]));
    return newM;
  },

  markAsRead: async (id: string) => {
    const all = getMessages();
    const updated = all.map(m => m.id === id ? { ...m, isRead: true } : m);
    localStorage.setItem(STORAGE_KEYS.MOCK_DB_MESSAGES, JSON.stringify(updated));
  }
};
