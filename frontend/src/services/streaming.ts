import api from './api';
import { Channel, Recording, StreamState, IngestInfo } from '../types/streaming';

export const channelsApi = {
  list: async (): Promise<Channel[]> => {
    const res = await api.get('/channels');
    return res.data;
  },

  get: async (id: string): Promise<Channel> => {
    const res = await api.get(`/channels/${id}`);
    return res.data;
  },

  create: async (body: { name: string; description?: string }): Promise<{ channel: Channel; streamKey: string }> => {
    const res = await api.post('/channels', body);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/channels/${id}`);
  },

  getIngest: async (id: string): Promise<IngestInfo> => {
    const res = await api.get(`/channels/${id}/ingest`);
    return res.data;
  },

  rotateStreamKey: async (id: string): Promise<{ streamKey: string }> => {
    const res = await api.post(`/channels/${id}/stream-key/rotate`);
    return res.data;
  },
};

export const streamsApi = {
  listLive: async (): Promise<Channel[]> => {
    const res = await api.get('/streams');
    return res.data;
  },

  getState: async (channelId: string): Promise<StreamState> => {
    const res = await api.get(`/streams/${channelId}`);
    return res.data;
  },

  startReplay: async (channelId: string, body: { s3Key: string; loop: boolean }): Promise<{ taskId: string }> => {
    const res = await api.post(`/streams/${channelId}/replay`, body);
    return res.data;
  },

  stopReplay: async (channelId: string, taskId: string): Promise<void> => {
    await api.delete(`/streams/${channelId}/replay`, { data: { taskId } });
  },
};

export const recordingsApi = {
  list: async (channelId?: string): Promise<Recording[]> => {
    const res = await api.get('/recordings', { params: channelId ? { channelId } : undefined });
    return res.data;
  },

  get: async (id: string): Promise<Recording> => {
    const res = await api.get(`/recordings/${id}`);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/recordings/${id}`);
  },
};
