export type ChannelStatus = 'IDLE' | 'LIVE' | 'OFFLINE';
export type UserRole = 'viewer' | 'broadcaster' | 'admin';

export interface Channel {
  id: string;
  name: string;
  description?: string;
  status: ChannelStatus;
  playbackUrl: string;
  ingestEndpoint: string;
  ownerId: string;
  ownerName: string;
  createdAt: string;
}

export interface Recording {
  id: string;
  channelId: string;
  channelName: string;
  playbackUrl: string;
  thumbnailUrl?: string;
  duration: number;
  size: number;
  startedAt: string;
  endedAt: string;
}

export interface StreamState {
  channelId: string;
  status: ChannelStatus;
  viewerCount: number;
  startedAt?: string;
  health: 'HEALTHY' | 'STARVING' | 'UNKNOWN';
}

export interface IngestInfo {
  rtmpUrl: string;
  endpoint: string;
  streamKey: string;
}
