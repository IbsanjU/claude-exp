import { v4 as uuidv4 } from 'uuid';
import { IStreamingProvider, IngestEndpoint } from './IStreamingProvider';
import { Channel, CreateChannelParams, Recording, StreamState } from '../../types/streaming';

const channels = new Map<string, Channel>();
const streamKeys = new Map<string, string>();
const recordings = new Map<string, Recording>();
const replayTasks = new Map<string, { channelId: string; taskId: string }>();

// Seed one demo recording
const demoRecordingId = uuidv4();
recordings.set(demoRecordingId, {
  id: demoRecordingId,
  channelId: 'demo',
  channelName: 'Demo Channel',
  s3Key: 'recordings/demo/2024-01-01.mp4',
  playbackUrl: 'mock://recordings/demo',
  duration: 3600,
  size: 500_000_000,
  startedAt: new Date(Date.now() - 86400_000).toISOString(),
  endedAt: new Date(Date.now() - 82800_000).toISOString(),
  createdAt: new Date(Date.now() - 82800_000).toISOString(),
});

export class MockProvider implements IStreamingProvider {
  async createChannel(params: CreateChannelParams): Promise<{ channel: Channel; streamKey: string }> {
    const id = uuidv4();
    const streamKey = `mock-sk-${uuidv4().replace(/-/g, '').slice(0, 20)}`;
    const channel: Channel = {
      id,
      name: params.name,
      description: params.description,
      status: 'IDLE',
      type: params.type || 'BASIC',
      latencyMode: params.latencyMode || 'LOW',
      playbackUrl: `mock://playback/${id}`,
      ingestEndpoint: 'mock.contribute.live-video.net',
      ownerId: params.ownerId,
      ownerName: params.ownerName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    channels.set(id, channel);
    streamKeys.set(id, streamKey);
    return { channel, streamKey };
  }

  async getChannel(channelId: string): Promise<Channel | null> {
    return channels.get(channelId) || null;
  }

  async deleteChannel(channelId: string): Promise<void> {
    channels.delete(channelId);
    streamKeys.delete(channelId);
  }

  async listChannels(): Promise<Channel[]> {
    return Array.from(channels.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getIngestEndpoint(channelId: string): Promise<IngestEndpoint> {
    const key = streamKeys.get(channelId) || `mock-sk-${channelId}`;
    return {
      rtmpUrl: `rtmps://mock.contribute.live-video.net:443/app/${key}`,
      endpoint: 'mock.contribute.live-video.net',
      streamKey: key,
    };
  }

  async rotateStreamKey(channelId: string): Promise<string> {
    const newKey = `mock-sk-${uuidv4().replace(/-/g, '').slice(0, 20)}`;
    streamKeys.set(channelId, newKey);
    return newKey;
  }

  async getStreamState(channelId: string): Promise<StreamState> {
    const channel = channels.get(channelId);
    return {
      channelId,
      status: channel?.status || 'OFFLINE',
      viewerCount: channel?.status === 'LIVE' ? Math.floor(Math.random() * 50) : 0,
      startedAt: channel?.status === 'LIVE' ? new Date(Date.now() - 600_000).toISOString() : undefined,
      health: 'HEALTHY',
    };
  }

  async listRecordings(channelId?: string): Promise<Recording[]> {
    let all = Array.from(recordings.values());
    if (channelId) all = all.filter(r => r.channelId === channelId);
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getRecording(recordingId: string): Promise<Recording | null> {
    return recordings.get(recordingId) || null;
  }

  async deleteRecording(recordingId: string): Promise<void> {
    recordings.delete(recordingId);
  }

  async startReplay(channelId: string, s3Key: string, loop: boolean): Promise<string> {
    const taskId = `mock-task-${uuidv4()}`;
    replayTasks.set(channelId, { channelId, taskId });
    const channel = channels.get(channelId);
    if (channel) {
      channel.status = 'LIVE';
      channel.updatedAt = new Date().toISOString();
      channels.set(channelId, channel);
    }
    return taskId;
  }

  async stopReplay(channelId: string, taskId: string): Promise<void> {
    replayTasks.delete(channelId);
    const channel = channels.get(channelId);
    if (channel) {
      channel.status = 'IDLE';
      channel.updatedAt = new Date().toISOString();
      channels.set(channelId, channel);
    }
  }
}
