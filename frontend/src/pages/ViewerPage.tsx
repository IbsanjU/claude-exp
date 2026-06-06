import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Channel } from '../types/streaming';
import { channelsApi } from '../services/streaming';
import { HLSPlayer } from '../components/streaming/HLSPlayer';
import { useStreamStatus } from '../hooks/useStreamStatus';
import { NavBar } from '../components/NavBar';

export const ViewerPage: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const { state: streamState } = useStreamStatus(channelId || null);

  useEffect(() => {
    if (!channelId) return;
    channelsApi.get(channelId)
      .then(setChannel)
      .catch(() => navigate('/streams'))
      .finally(() => setLoading(false));
  }, [channelId]);

  const statusColor: Record<string, string> = { LIVE: '#22c55e', IDLE: '#94a3b8', OFFLINE: '#64748b' };

  return (
    <div style={{ minHeight: '100vh', background: '#111', color: '#fff' }}>
      <NavBar />
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 20px' }}>
        {loading ? (
          <div style={{ color: '#666', textAlign: 'center', padding: '60px' }}>Loading...</div>
        ) : !channel ? null : (
          <>
            <HLSPlayer
              playbackUrl={channel.playbackUrl}
              title={channel.name}
            />

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ margin: '0 0 6px', fontSize: '22px' }}>{channel.name}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#aaa', fontSize: '14px' }}>
                  <span style={{
                    background: statusColor[channel.status],
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}>
                    {channel.status}
                  </span>
                  <span>by {channel.ownerName}</span>
                  {streamState && streamState.status === 'LIVE' && (
                    <span>{streamState.viewerCount} watching</span>
                  )}
                </div>
                {channel.description && (
                  <p style={{ marginTop: '10px', color: '#aaa', fontSize: '14px', lineHeight: 1.5 }}>
                    {channel.description}
                  </p>
                )}
              </div>

              <button
                onClick={() => navigate('/streams')}
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
