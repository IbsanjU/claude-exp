import { Connection } from '../types';

const STORAGE_KEY = 'web-terminal-connections';

export const connectionStorage = {
  getAll: (): Connection[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading connections from localStorage:', error);
      return [];
    }
  },

  save: (connections: Connection[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
    } catch (error) {
      console.error('Error saving connections to localStorage:', error);
    }
  },

  add: (connection: Connection): void => {
    const connections = connectionStorage.getAll();
    connections.push(connection);
    connectionStorage.save(connections);
  },

  update: (id: string, connection: Partial<Connection>): void => {
    const connections = connectionStorage.getAll();
    const index = connections.findIndex(c => c.id === id);
    if (index !== -1) {
      connections[index] = { ...connections[index], ...connection };
      connectionStorage.save(connections);
    }
  },

  delete: (id: string): void => {
    const connections = connectionStorage.getAll();
    const filtered = connections.filter(c => c.id !== id);
    connectionStorage.save(filtered);
  },
};
