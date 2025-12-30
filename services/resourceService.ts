
import { STORAGE_KEYS } from '../constants';
import { Resource } from '../types';

const getResources = (): Resource[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.MOCK_DB_RESOURCES);
  return stored ? JSON.parse(stored) : [];
};

export const resourceService = {
  getAll: async () => {
    await new Promise(r => setTimeout(r, 400));
    return getResources().sort((a, b) => b.uploadDate.localeCompare(a.uploadDate));
  },

  upload: async (resource: Partial<Resource>) => {
    const all = getResources();
    const newR = {
      ...resource,
      id: Math.random().toString(36).substr(2, 9),
      uploadDate: new Date().toISOString()
    } as Resource;
    localStorage.setItem(STORAGE_KEYS.MOCK_DB_RESOURCES, JSON.stringify([...all, newR]));
    return newR;
  },

  delete: async (id: string) => {
    const filtered = getResources().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.MOCK_DB_RESOURCES, JSON.stringify(filtered));
  }
};
