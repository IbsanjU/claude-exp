import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Channel, IngestInfo } from '../types/streaming';
import { channelsApi } from '../services/streaming';
import { BroadcastSDKPanel } from '../components/streaming/BroadcastSDKPanel';
import { FFmpegReplayPanel } from '../components/streaming/FFmpegReplayPanel';
import { NavBar } from '../components/NavBar';

type Tab = 'webcam' | 'replay' | 'obs';

export const BroadcasterStudio: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [ingest, setIngest] = useState<IngestInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('webcam');
  const [rotatingKey, setRotatingKey] = useState(false);

  useEffect(() => {
    if (!channelId) return;
    Promise.all([
      channelsApi.get(channelId),
      channelsApi.getIngest(channelId),
    ]).then(([ch, ing]) => {
      setChannel(ch);
      setIngest(ing);
    }).catch(() => navigate('/broadcast'))
      .finally(() => setLoading(false));
  }, [channelId]);

  const rotateKey = async () => {
    if (!channelId || !confirm('Rotate stream key? OBS/apps using the old key will stop working.')) return;
    setRotatingKey(true);
    try {
      const res = await channelsApi.rotateStreamKey(channelId);
      alert(`New stream key: ${res.streamKey}\n\nUpdate your streaming app.`);
      const ing = await channelsApi.getIngest(channelId);
      setIngest(ing);
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setRotatingKey(false);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'webcam', label: 'Webcam / Browser' },
    { id: 'replay', label: 'Stream Recording' },
    { id: 'obs', label: 'OBS / External' },
  ];

  const codeStyle: React.CSSProperties = {
    background: '#111',
    border: '1px solid #333',
    borderRadius: '4px',
    padding: '8px 10px',
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#a3e635',
    wordBreak: 'break-all',
    userSelect: 'all',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1e1e1e', color: '#fff' }}>
      <NavBar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px' }}>
        {loading ? (
          <div style={{ color: '#666', textAlign: 'center', padding: '60px' }}>Loading studio...</div>
        ) : !channel || !ingest ? null : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <div>
                <button
                  onClick={() => navigate('/broadcast')}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px', padding: '0 0 4px', marginBottom: '6px', display: 'block' }}
                >
                  ← My Channels
                </button>
                <h2 style={{ margin: 0, fontSize: '20px' }}>{channel.name}</h2>
              </div>
            </div>

            {/* Tab nav */}
            <div style={{ display: 'flex', borderBottom: '1px solid #333', marginBottom: '24px' }}>
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: tab === t.id ? '2px solid #3b82f6' : '2px solid transparent',
                    color: tab === t.id ? '#fff' : '#64748b',
                    padding: '10px 18px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: tab === t.id ? 600 : 400,
                    marginBottom: '-1px',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {tab === 'webcam' && (
              <BroadcastSDKPanel ingestEndpoint={ingest.endpoint} streamKey={ingest.streamKey} />
            )}

            {tab === 'replay' && (
              <FFmpegReplayPanel channelId={channel.id} />
            )}

            {tab === 'obs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '6px' }}>Server (RTMP ingest)</label>
                  <div style={codeStyle}>{ingest.rtmpUrl.replace(ingest.streamKey, '')}</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '6px' }}>Stream Key</label>
                  <div style={codeStyle}>{ingest.streamKey}</div>
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                  In OBS: Settings → Stream → Custom → paste the server and stream key above.
                  Alternatively, paste the full RTMP URL as a single string.
                </div>
                <button
                  onClick={rotateKey}
                  disabled={rotatingKey}
                  style={{
                    alignSelf: 'flex-start',
                    background: '#3d3d3d',
                    color: '#f59e0b',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  {rotatingKey ? 'Rotating...' : 'Rotate Stream Key'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
