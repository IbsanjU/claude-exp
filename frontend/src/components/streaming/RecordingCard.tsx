import React from 'react';
import { Recording } from '../../types/streaming';

interface RecordingCardProps {
  recording: Recording;
  onPlay: () => void;
  onDelete?: () => void;
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatSize(bytes: number) {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

export const RecordingCard: React.FC<RecordingCardProps> = ({ recording, onPlay, onDelete }) => {
  return (
    <div style={{
      background: '#2d2d2d',
      border: '1px solid #3d3d3d',
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      {/* Thumbnail */}
      <div
        onClick={onPlay}
        style={{
          aspectRatio: '16/9',
          background: '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
        }}
        onMouseEnter={e => (e.currentTarget.querySelector('.play-icon')! as HTMLElement).style.opacity = '1'}
        onMouseLeave={e => (e.currentTarget.querySelector('.play-icon')! as HTMLElement).style.opacity = '0.6'}
      >
        <div className="play-icon" style={{ fontSize: '44px', color: '#fff', opacity: 0.6, transition: 'opacity 0.15s' }}>▶</div>
        <div style={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 600,
          padding: '2px 6px',
          borderRadius: '4px',
        }}>
          {formatDuration(recording.duration)}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '12px' }}>
        <div style={{ fontWeight: 600, fontSize: '14px', color: '#fff', marginBottom: '2px' }}>
          {recording.channelName}
        </div>
        <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>
          {formatDate(recording.startedAt)} · {formatSize(recording.size)}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onPlay}
            style={{
              flex: 1,
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Play
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              style={{
                background: '#3d3d3d',
                color: '#f87171',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
