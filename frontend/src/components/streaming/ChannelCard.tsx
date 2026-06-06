import React from 'react';
import { Channel } from '../../types/streaming';

interface ChannelCardProps {
  channel: Channel;
  onClick: () => void;
}

const statusColor: Record<string, string> = {
  LIVE: '#22c55e',
  IDLE: '#94a3b8',
  OFFLINE: '#64748b',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export const ChannelCard: React.FC<ChannelCardProps> = ({ channel, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#2d2d2d',
        border: '1px solid #3d3d3d',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#555')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#3d3d3d')}
    >
      {/* Thumbnail area */}
      <div style={{
        aspectRatio: '16/9',
        background: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{ fontSize: '40px', color: '#444' }}>▶</div>
        <div style={{
          position: 'absolute',
          top: 8,
          left: 8,
          background: statusColor[channel.status] || '#64748b',
          color: '#fff',
          fontSize: '11px',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: '4px',
          letterSpacing: '0.05em',
        }}>
          {channel.status}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '12px' }}>
        <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px', color: '#fff' }}>
          {channel.name}
        </div>
        {channel.description && (
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '6px', lineHeight: 1.4 }}>
            {channel.description}
          </div>
        )}
        <div style={{ fontSize: '11px', color: '#666' }}>
          {channel.ownerName} · {formatDate(channel.createdAt)}
        </div>
      </div>
    </div>
  );
};
