import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Channel } from '../types/streaming';
import { channelsApi } from '../services/streaming';
import { ChannelCard } from '../components/streaming/ChannelCard';
import { NavBar } from '../components/NavBar';

export const StreamsPage: React.FC = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'live'>('all');

  useEffect(() => {
    channelsApi.list()
      .then(setChannels)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayed = filter === 'live' ? channels.filter(c => c.status === 'LIVE') : channels;

  return (
    <div style={{ minHeight: '100vh', background: '#1e1e1e', color: '#fff' }}>
      <NavBar />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '22px' }}>Live Streams</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['all', 'live'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  background: filter === f ? '#3b82f6' : '#2d2d2d',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: filter === f ? 600 : 400,
                }}
              >
                {f === 'all' ? 'All Channels' : 'Live Now'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ color: '#666', textAlign: 'center', padding: '60px' }}>Loading channels...</div>
        ) : displayed.length === 0 ? (
          <div style={{ color: '#666', textAlign: 'center', padding: '60px' }}>
            {filter === 'live' ? 'No streams are live right now.' : 'No channels yet. Create one to get started.'}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}>
            {displayed.map(channel => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                onClick={() => navigate(`/streams/${channel.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
