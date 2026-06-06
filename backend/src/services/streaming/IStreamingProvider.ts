import { Channel, CreateChannelParams, StreamState, Recording, StreamKey } from '../../types/streaming';

export interface IngestEndpoint {
  rtmpUrl: string;
  endpoint: string;
  streamKey: string;
}

export interface IStreamingProvider {
  createChannel(params: CreateChannelParams): Promise<{ channel: Channel; streamKey: string }>;
  getChannel(channelId: string): Promise<Channel | null>;
  deleteChannel(channelId: string): Promise<void>;
  listChannels(): Promise<Channel[]>;
  getIngestEndpoint(channelId: string): Promise<IngestEndpoint>;
  rotateStreamKey(channelId: string): Promise<string>;
  getStreamState(channelId: string): Promise<StreamState>;
  listRecordings(channelId?: string): Promise<Recording[]>;
  getRecording(recordingId: string): Promise<Recording | null>;
  deleteRecording(recordingId: string): Promise<void>;
  startReplay(channelId: string, s3Key: string, loop: boolean): Promise<string>;
  stopReplay(channelId: string, taskId: string): Promise<void>;
}
