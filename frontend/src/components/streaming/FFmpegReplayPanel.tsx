import React, { useEffect, useState } from 'react';
import { Recording } from '../../types/streaming';
import { recordingsApi, streamsApi } from '../../services/streaming';

interface FFmpegReplayPanelProps {
  channelId: string;
}

export const FFmpegReplayPanel: React.FC<FFmpegReplayPanelProps> = ({ channelId }) => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [loop, setLoop] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    recordingsApi.list().then(setRecordings).catch(() => {});
  }, []);

  const startReplay = async () => {
    if (!selectedKey) return;
    setLoading(true);
    setError(null);
    try {
      const res = await streamsApi.startReplay(channelId, { s3Key: selectedKey, loop });
      setTaskId(res.taskId);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const stopReplay = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      await streamsApi.stopReplay(channelId, taskId);
      setTaskId(null);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: '#1a1a1a',
    border: '1px solid #3d3d3d',
    borderRadius: '6px',
    color: '#fff',
    padding: '8px 10px',
    fontSize: '13px',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '13px', color: '#94a3b8' }}>
        Stream a pre-recorded file through this channel as a live broadcast.
      </div>

      <div>
        <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>
          Select Recording
        </label>
        <select
          value={selectedKey}
          onChange={e => setSelectedKey(e.target.value)}
          disabled={!!taskId}
          style={inputStyle}
        >
          <option value="">— Choose a recording —</option>
          {recordings.map(r => (
            <option key={r.id} value={r.id}>
              {r.channelName} · {new Date(r.startedAt).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#aaa' }}>
        <input
          type="checkbox"
          checked={loop}
          onChange={e => setLoop(e.target.checked)}
          disabled={!!taskId}
          style={{ accentColor: '#3b82f6' }}
        />
        Loop continuously
      </label>

      {!taskId ? (
        <button
          onClick={startReplay}
          disabled={!selectedKey || loading}
          style={{
            background: !selectedKey || loading ? '#3d3d3d' : '#f59e0b',
            color: '#fff',
            border: 'none',
            padding: '10px',
            borderRadius: '6px',
            cursor: !selectedKey || loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          {loading ? 'Starting...' : 'Stream as Live'}
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            background: '#1a2e1a',
            border: '1px solid #14532d',
            borderRadius: '6px',
            padding: '10px 14px',
            fontSize: '13px',
            color: '#4ade80',
          }}>
            Relay running · task: {taskId.slice(0, 20)}...
          </div>
          <button
            onClick={stopReplay}
            disabled={loading}
            style={{
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              padding: '10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Stop Relay
          </button>
        </div>
      )}

      {error && (
        <div style={{
          background: '#3f1f1f',
          border: '1px solid #7f1d1d',
          borderRadius: '6px',
          padding: '10px 14px',
          color: '#f87171',
          fontSize: '13px',
        }}>
          {error}
        </div>
      )}
    </div>
  );
};
