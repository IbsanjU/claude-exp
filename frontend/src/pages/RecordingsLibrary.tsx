import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Recording } from '../types/streaming';
import { recordingsApi } from '../services/streaming';
import { RecordingCard } from '../components/streaming/RecordingCard';
import { NavBar } from '../components/NavBar';

export const RecordingsLibrary: React.FC = () => {
  const navigate = useNavigate();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    recordingsApi.list()
      .then(setRecordings)
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recording?')) return;
    try {
      await recordingsApi.delete(id);
      load();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1e1e1e', color: '#fff' }}>
      <NavBar />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
        <h2 style={{ margin: '0 0 24px', fontSize: '22px' }}>Recordings</h2>

        {loading ? (
          <div style={{ color: '#666', textAlign: 'center', padding: '60px' }}>Loading recordings...</div>
        ) : recordings.length === 0 ? (
          <div style={{ color: '#666', textAlign: 'center', padding: '60px' }}>
            No recordings yet. Finished streams are saved automatically.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}>
            {recordings.map(rec => (
              <RecordingCard
                key={rec.id}
                recording={rec}
                onPlay={() => navigate(`/recordings/${rec.id}`)}
                onDelete={() => handleDelete(rec.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
