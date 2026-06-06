import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Channel } from '../types/streaming';
import { channelsApi } from '../services/streaming';
import { NavBar } from '../components/NavBar';

export const BroadcasterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    channelsApi.list()
      .then(all => setChannels(all))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const createChannel = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await channelsApi.create({ name: form.name, description: form.description });
      alert(`Channel created!\n\nStream Key: ${res.streamKey}\n\nSave this key — it won't be shown again.`);
      setShowForm(false);
      setForm({ name: '', description: '' });
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setCreating(false);
    }
  };

  const deleteChannel = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await channelsApi.delete(id);
      load();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
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

  const statusColor: Record<string, string> = { LIVE: '#22c55e', IDLE: '#94a3b8', OFFLINE: '#64748b' };

  return (
    <div style={{ minHeight: '100vh', background: '#1e1e1e', color: '#fff' }}>
      <NavBar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0 }}>My Channels</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: '#22c55e',
              color: '#fff',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            + New Channel
          </button>
        </div>

        {showForm && (
          <div style={{
            background: '#2d2d2d',
            border: '1px solid #3d3d3d',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Create Channel</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Channel Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="My Channel"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Description</label>
                <input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description"
                  style={inputStyle}
                />
              </div>
              {error && (
                <div style={{ color: '#f87171', fontSize: '13px' }}>{error}</div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={createChannel}
                  disabled={!form.name.trim() || creating}
                  style={{
                    background: creating ? '#3d3d3d' : '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick={() => { setShowForm(false); setError(null); }}
                  style={{
                    background: '#3d3d3d',
                    color: '#aaa',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ color: '#666', textAlign: 'center', padding: '60px' }}>Loading channels...</div>
        ) : channels.length === 0 ? (
          <div style={{ color: '#666', textAlign: 'center', padding: '60px' }}>
            No channels yet. Create your first one to start streaming.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {channels.map(channel => (
              <div
                key={channel.id}
                style={{
                  background: '#2d2d2d',
                  border: '1px solid #3d3d3d',
                  borderRadius: '8px',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '15px' }}>{channel.name}</span>
                    <span style={{
                      background: statusColor[channel.status] || '#64748b',
                      color: '#fff',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '4px',
                    }}>
                      {channel.status}
                    </span>
                  </div>
                  {channel.description && (
                    <div style={{ fontSize: '13px', color: '#aaa' }}>{channel.description}</div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => navigate(`/broadcast/${channel.id}`)}
                    style={{
                      background: '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      padding: '7px 14px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    Studio
                  </button>
                  <button
                    onClick={() => deleteChannel(channel.id, channel.name)}
                    style={{
                      background: '#3d3d3d',
                      color: '#f87171',
                      border: 'none',
                      padding: '7px 14px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
