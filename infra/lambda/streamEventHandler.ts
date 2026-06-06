/**
 * EventBridge Lambda triggered by IVS stream events.
 * Deploy to AWS Lambda and configure EventBridge rule:
 *   source: aws.ivs
 *   detail-type: IVS Recording State Change
 *
 * Required env vars: DYNAMODB_TABLE, RECORDINGS_BUCKET
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

interface IVSStreamEvent {
  detail: {
    channel_name: string;
    recording_status: 'Recording Start' | 'Recording End' | 'Recording Start Failure';
    recording_status_reason?: string;
    recording_s3_bucket_name?: string;
    recording_s3_key_prefix?: string;
    recording_duration_ms?: number;
    stream_id: string;
  };
}

export const handler = async (event: IVSStreamEvent) => {
  const { detail } = event;
  console.log('IVS event:', JSON.stringify(detail, null, 2));

  if (detail.recording_status !== 'Recording End') return;

  const recordingId = uuidv4();
  const now = new Date().toISOString();
  const s3Key = `${detail.recording_s3_key_prefix}/media/hls/master.m3u8`;

  await ddb.send(new PutCommand({
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      PK: `RECORDING#${recordingId}`,
      SK: `CHANNEL#${detail.channel_name}`,
      id: recordingId,
      channelId: detail.channel_name,
      channelName: detail.channel_name,
      s3Key,
      s3Bucket: detail.recording_s3_bucket_name,
      duration: Math.round((detail.recording_duration_ms || 0) / 1000),
      size: 0,
      startedAt: now,
      endedAt: now,
      createdAt: now,
      streamId: detail.stream_id,
    },
  }));

  console.log(`Saved recording ${recordingId} for channel ${detail.channel_name}`);
};
