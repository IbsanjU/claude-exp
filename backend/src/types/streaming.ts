export type ChannelStatus = 'IDLE' | 'LIVE' | 'OFFLINE';
export type UserRole = 'viewer' | 'broadcaster' | 'admin';
export type ChannelType = 'BASIC' | 'STANDARD';
export type LatencyMode = 'LOW' | 'NORMAL';

export interface Channel {
  id: string;
  name: string;
  description?: string;
  status: ChannelStatus;
  type: ChannelType;
  latencyMode: LatencyMode;
  playbackUrl: string;
  ingestEndpoint: string;
  ivsChannelArn?: string;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface StreamKey {
  channelId: string;
  keyValue: string;
  arn?: string;
}

export interface Recording {
  id: string;
  channelId: string;
  channelName: string;
  s3Key: string;
  playbackUrl: string;
  thumbnailUrl?: string;
  duration: number;
  size: number;
  startedAt: string;
  endedAt: string;
  createdAt: string;
}

export interface StreamState {
  channelId: string;
  status: ChannelStatus;
  viewerCount: number;
  startedAt?: string;
  health: 'HEALTHY' | 'STARVING' | 'UNKNOWN';
}

export interface ReplayTask {
  taskId: string;
  channelId: string;
  s3Key: string;
  loop: boolean;
  startedAt: string;
}

export interface CreateChannelParams {
  name: string;
  description?: string;
  type?: ChannelType;
  latencyMode?: LatencyMode;
  ownerId: string;
  ownerName: string;
}
