import { v4 as uuidv4 } from 'uuid';
import { IStreamingProvider, IngestEndpoint } from './IStreamingProvider';
import { Channel, CreateChannelParams, Recording, StreamState } from '../../types/streaming';

// Lazy imports so the app boots even without AWS SDK installed
let IVSClient: any, CreateChannelCommand: any, DeleteChannelCommand: any,
  GetChannelCommand: any, ListChannelsCommand: any, CreateStreamKeyCommand: any,
  DeleteStreamKeyCommand: any, ListStreamKeysCommand: any, GetStreamCommand: any;
let S3Client: any, GetObjectCommand: any, DeleteObjectCommand: any;
let ECSClient: any, RunTaskCommand: any, StopTaskCommand: any;
let getSignedUrl: any;

async function loadAWSSDK() {
  try {
    const ivs = await import('@aws-sdk/client-ivs' as any);
    IVSClient = ivs.IVSClient;
    CreateChannelCommand = ivs.CreateChannelCommand;
    DeleteChannelCommand = ivs.DeleteChannelCommand;
    GetChannelCommand = ivs.GetChannelCommand;
    ListChannelsCommand = ivs.ListChannelsCommand;
    CreateStreamKeyCommand = ivs.CreateStreamKeyCommand;
    DeleteStreamKeyCommand = ivs.DeleteStreamKeyCommand;
    ListStreamKeysCommand = ivs.ListStreamKeysCommand;
    GetStreamCommand = ivs.GetStreamCommand;

    const s3 = await import('@aws-sdk/client-s3' as any);
    S3Client = s3.S3Client;
    GetObjectCommand = s3.GetObjectCommand;
    DeleteObjectCommand = s3.DeleteObjectCommand;

    const presigner = await import('@aws-sdk/s3-request-presigner' as any);
    getSignedUrl = presigner.getSignedUrl;

    const ecs = await import('@aws-sdk/client-ecs' as any);
    ECSClient = ecs.ECSClient;
    RunTaskCommand = ecs.RunTaskCommand;
    StopTaskCommand = ecs.StopTaskCommand;
  } catch {
    throw new Error('AWS SDK not installed. Run: npm install @aws-sdk/client-ivs @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @aws-sdk/client-ecs');
  }
}

// In-memory cache of stream keys (returned only once from IVS)
const streamKeyCache = new Map<string, string>();
// In-memory recording store (normally populated by EventBridge Lambda)
const recordingStore = new Map<string, Recording>();

export class IVSProvider implements IStreamingProvider {
  private region: string;
  private recordingBucket: string;
  private recordingConfigArn?: string;
  private ecsCluster?: string;
  private ffmpegTaskDef?: string;
  private ecsSubnet?: string;
  private ecsSecurityGroup?: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.recordingBucket = process.env.IVS_RECORDING_BUCKET || '';
    this.recordingConfigArn = process.env.IVS_RECORDING_CONFIG_ARN;
    this.ecsCluster = process.env.ECS_CLUSTER;
    this.ffmpegTaskDef = process.env.FFMPEG_TASK_DEFINITION;
    this.ecsSubnet = process.env.ECS_SUBNET_ID;
    this.ecsSecurityGroup = process.env.ECS_SECURITY_GROUP_ID;
  }

  private ivsClient() {
    return new IVSClient({ region: this.region });
  }

  private s3Client() {
    return new S3Client({ region: this.region });
  }

  private ecsClient() {
    return new ECSClient({ region: this.region });
  }

  async createChannel(params: CreateChannelParams): Promise<{ channel: Channel; streamKey: string }> {
    await loadAWSSDK();
    const client = this.ivsClient();

    const res = await client.send(new CreateChannelCommand({
      name: params.name,
      latencyMode: params.latencyMode || 'LOW',
      type: params.type || 'BASIC',
      recordingConfigurationArn: this.recordingConfigArn,
    }));

    const ivsChannel = res.channel;
    const ivsStreamKey = res.streamKey;

    const channel: Channel = {
      id: ivsChannel.arn.split('/').pop()!,
      name: ivsChannel.name,
      description: params.description,
      status: 'IDLE',
      type: (ivsChannel.type || 'BASIC') as any,
      latencyMode: (ivsChannel.latencyMode || 'LOW') as any,
      playbackUrl: ivsChannel.playbackUrl,
      ingestEndpoint: ivsChannel.ingestEndpoint,
      ivsChannelArn: ivsChannel.arn,
      ownerId: params.ownerId,
      ownerName: params.ownerName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Cache the stream key — IVS only returns it on creation
    streamKeyCache.set(channel.id, ivsStreamKey.value);

    return { channel, streamKey: ivsStreamKey.value };
  }

  async getChannel(channelId: string): Promise<Channel | null> {
    await loadAWSSDK();
    try {
      const res = await this.ivsClient().send(new GetChannelCommand({ arn: channelId }));
      const c = res.channel;
      return {
        id: channelId,
        name: c.name,
        status: 'IDLE',
        type: c.type || 'BASIC',
        latencyMode: c.latencyMode || 'LOW',
        playbackUrl: c.playbackUrl,
        ingestEndpoint: c.ingestEndpoint,
        ivsChannelArn: c.arn,
        ownerId: '',
        ownerName: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  async deleteChannel(channelId: string): Promise<void> {
    await loadAWSSDK();
    await this.ivsClient().send(new DeleteChannelCommand({ arn: channelId }));
    streamKeyCache.delete(channelId);
  }

  async listChannels(): Promise<Channel[]> {
    await loadAWSSDK();
    const res = await this.ivsClient().send(new ListChannelsCommand({}));
    return (res.channels || []).map((c: any) => ({
      id: c.arn,
      name: c.name,
      status: 'IDLE' as const,
      type: c.type || 'BASIC',
      latencyMode: c.latencyMode || 'LOW',
      playbackUrl: c.playbackUrl,
      ingestEndpoint: c.ingestEndpoint,
      ivsChannelArn: c.arn,
      ownerId: '',
      ownerName: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  async getIngestEndpoint(channelId: string): Promise<IngestEndpoint> {
    await loadAWSSDK();
    const channel = await this.getChannel(channelId);
    if (!channel) throw new Error('Channel not found');

    const cachedKey = streamKeyCache.get(channelId);
    if (!cachedKey) throw new Error('Stream key not found. Rotate the stream key to retrieve it.');

    return {
      rtmpUrl: `rtmps://${channel.ingestEndpoint}:443/app/${cachedKey}`,
      endpoint: channel.ingestEndpoint,
      streamKey: cachedKey,
    };
  }

  async rotateStreamKey(channelId: string): Promise<string> {
    await loadAWSSDK();
    const client = this.ivsClient();

    // Delete existing keys
    const listRes = await client.send(new ListStreamKeysCommand({ channelArn: channelId }));
    for (const key of listRes.streamKeys || []) {
      await client.send(new DeleteStreamKeyCommand({ arn: key.arn }));
    }

    // Create new key
    const createRes = await client.send(new CreateStreamKeyCommand({ channelArn: channelId }));
    const newKey = createRes.streamKey.value;
    streamKeyCache.set(channelId, newKey);
    return newKey;
  }

  async getStreamState(channelId: string): Promise<StreamState> {
    await loadAWSSDK();
    try {
      const res = await this.ivsClient().send(new GetStreamCommand({ channelArn: channelId }));
      const stream = res.stream;
      return {
        channelId,
        status: stream ? 'LIVE' : 'IDLE',
        viewerCount: stream?.viewerCount || 0,
        startedAt: stream?.startTime?.toISOString(),
        health: (stream?.health as any) || 'UNKNOWN',
      };
    } catch {
      return { channelId, status: 'OFFLINE', viewerCount: 0, health: 'UNKNOWN' };
    }
  }

  async listRecordings(channelId?: string): Promise<Recording[]> {
    let all = Array.from(recordingStore.values());
    if (channelId) all = all.filter(r => r.channelId === channelId);
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getRecording(recordingId: string): Promise<Recording | null> {
    const recording = recordingStore.get(recordingId);
    if (!recording) return null;

    // Generate a fresh presigned URL
    await loadAWSSDK();
    const url = await getSignedUrl(
      this.s3Client(),
      new GetObjectCommand({ Bucket: this.recordingBucket, Key: recording.s3Key }),
      { expiresIn: 3600 }
    );
    return { ...recording, playbackUrl: url };
  }

  async deleteRecording(recordingId: string): Promise<void> {
    const recording = recordingStore.get(recordingId);
    if (!recording) return;
    await loadAWSSDK();
    await this.s3Client().send(new DeleteObjectCommand({
      Bucket: this.recordingBucket,
      Key: recording.s3Key,
    }));
    recordingStore.delete(recordingId);
  }

  async startReplay(channelId: string, s3Key: string, loop: boolean): Promise<string> {
    if (!this.ecsCluster || !this.ffmpegTaskDef) {
      throw new Error('ECS_CLUSTER and FFMPEG_TASK_DEFINITION env vars required for replay');
    }
    await loadAWSSDK();

    const ingest = await this.getIngestEndpoint(channelId);

    // Generate presigned URL for the S3 source file
    const sourceUrl = await getSignedUrl(
      this.s3Client(),
      new GetObjectCommand({ Bucket: this.recordingBucket, Key: s3Key }),
      { expiresIn: 21600 }
    );

    const res = await this.ecsClient().send(new RunTaskCommand({
      cluster: this.ecsCluster,
      taskDefinition: this.ffmpegTaskDef,
      launchType: 'FARGATE',
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: [this.ecsSubnet!],
          securityGroups: [this.ecsSecurityGroup!],
          assignPublicIp: 'ENABLED',
        },
      },
      overrides: {
        containerOverrides: [{
          name: 'ffmpeg',
          environment: [
            { name: 'INPUT_URL', value: sourceUrl },
            { name: 'OUTPUT_URL', value: ingest.rtmpUrl },
            { name: 'LOOP', value: loop ? '1' : '0' },
          ],
        }],
      },
    }));

    return res.tasks?.[0]?.taskArn || '';
  }

  async stopReplay(channelId: string, taskId: string): Promise<void> {
    if (!this.ecsCluster) return;
    await loadAWSSDK();
    await this.ecsClient().send(new StopTaskCommand({
      cluster: this.ecsCluster,
      task: taskId,
    }));
  }

  // Called by EventBridge Lambda to register a completed recording
  static registerRecording(recording: Recording) {
    recordingStore.set(recording.id, recording);
  }
}
