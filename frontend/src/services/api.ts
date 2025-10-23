import axios from 'axios';
import { Connection, User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const authApi = {
  login: async (username: string, password: string): Promise<User> => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const connectionsApi = {
  getAll: async (): Promise<Connection[]> => {
    const response = await api.get('/connections');
    return response.data;
  },

  getById: async (id: string): Promise<Connection> => {
    const response = await api.get(`/connections/${id}`);
    return response.data;
  },

  create: async (connection: Omit<Connection, 'id' | 'createdAt'>): Promise<Connection> => {
    const response = await api.post('/connections', connection);
    return response.data;
  },

  update: async (id: string, connection: Partial<Connection>): Promise<Connection> => {
    const response = await api.put(`/connections/${id}`, connection);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/connections/${id}`);
  },
};

export default api;
