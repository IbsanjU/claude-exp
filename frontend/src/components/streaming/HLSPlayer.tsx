import React, { useRef } from 'react';
import { useHLSPlayer } from '../../hooks/useHLSPlayer';

interface HLSPlayerProps {
  playbackUrl: string | null;
  title?: string;
  autoPlay?: boolean;
}

export const HLSPlayer: React.FC<HLSPlayerProps> = ({ playbackUrl, title, autoPlay = true }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { state, error } = useHLSPlayer(videoRef, playbackUrl);

  const containerStyle: React.CSSProperties = {
    width: '100%',
    aspectRatio: '16/9',
    background: '#000',
    borderRadius: '8px',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    gap: '12px',
  };

  return (
    <div style={containerStyle}>
      <video
        ref={videoRef}
        style={{ width: '100%', height: '100%', display: state === 'playing' ? 'block' : 'none' }}
        controls
        autoPlay={autoPlay}
        playsInline
      />

      {state === 'idle' && (
        <div style={overlayStyle}>
          <div style={{ fontSize: '48px' }}>▶</div>
          <p style={{ margin: 0, color: '#aaa' }}>No stream selected</p>
        </div>
      )}

      {state === 'loading' && (
        <div style={overlayStyle}>
          <div style={{ fontSize: '14px', color: '#aaa' }}>Loading stream...</div>
        </div>
      )}

      {state === 'mock' && (
        <div style={overlayStyle}>
          <div style={{ fontSize: '48px' }}>🎬</div>
          <p style={{ margin: 0, fontWeight: 600 }}>{title || 'Mock Stream'}</p>
          <p style={{ margin: 0, fontSize: '13px', color: '#aaa' }}>
            Mock mode — configure IVS for real video
          </p>
        </div>
      )}

      {state === 'error' && (
        <div style={overlayStyle}>
          <div style={{ fontSize: '48px' }}>⚠</div>
          <p style={{ margin: 0, color: '#f87171' }}>{error || 'Stream unavailable'}</p>
        </div>
      )}
    </div>
  );
};
