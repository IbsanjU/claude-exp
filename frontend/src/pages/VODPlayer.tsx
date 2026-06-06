import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Recording } from '../types/streaming';
import { recordingsApi } from '../services/streaming';
import { HLSPlayer } from '../components/streaming/HLSPlayer';
import { NavBar } from '../components/NavBar';

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function formatSize(bytes: number) {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  return `${(bytes / 1e6).toFixed(0)} MB`;
}

export const VODPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recording, setRecording] = useState<Recording | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    recordingsApi.get(id)
      .then(setRecording)
      .catch(() => navigate('/recordings'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div style={{ minHeight: '100vh', background: '#111', color: '#fff' }}>
      <NavBar />
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 20px' }}>
        {loading ? (
          <div style={{ color: '#666', textAlign: 'center', padding: '60px' }}>Loading...</div>
        ) : !recording ? null : (
          <>
            <HLSPlayer playbackUrl={recording.playbackUrl} title={recording.channelName} />

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ margin: '0 0 6px', fontSize: '20px' }}>{recording.channelName}</h1>
                <div style={{ color: '#aaa', fontSize: '13px', display: 'flex', gap: '16px' }}>
                  <span>{new Date(recording.startedAt).toLocaleString()}</span>
                  <span>{formatDuration(recording.duration)}</span>
                  <span>{formatSize(recording.size)}</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/recordings')}
                style={{
                  background: '#2d2d2d',
                  color: '#aaa',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
