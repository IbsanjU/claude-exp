import React, { useEffect, useRef, useState } from 'react';

interface BroadcastSDKPanelProps {
  ingestEndpoint: string;
  streamKey: string;
}

type BroadcastState = 'idle' | 'initializing' | 'preview' | 'live' | 'error';

export const BroadcastSDKPanel: React.FC<BroadcastSDKPanelProps> = ({ ingestEndpoint, streamKey }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clientRef = useRef<any>(null);
  const [broadcastState, setBroadcastState] = useState<BroadcastState>('idle');
  const [error, setError] = useState<string | null>(null);
  const isMock = ingestEndpoint.startsWith('mock');

  useEffect(() => {
    return () => {
      stopBroadcast(true);
    };
  }, []);

  const initializeCamera = async () => {
    if (isMock) {
      setBroadcastState('preview');
      return;
    }

    setBroadcastState('initializing');
    setError(null);

    try {
      const IVSBroadcastClient = (await import('amazon-ivs-web-broadcast')).default;

      const client = await (IVSBroadcastClient as any).create({
        streamConfig: (IVSBroadcastClient as any).BASIC_LANDSCAPE,
        ingestEndpoint,
      });
      clientRef.current = client;

      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const audioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });

      await client.addVideoInputDevice(videoStream, 'camera1', { index: 0 });
      await client.addAudioInputDevice(audioStream, 'mic1');

      if (canvasRef.current) {
        client.attachPreview(canvasRef.current);
      }

      setBroadcastState('preview');
    } catch (err: any) {
      setError(err.message || 'Failed to initialize camera');
      setBroadcastState('error');
    }
  };

  const startBroadcast = async () => {
    if (isMock) {
      setBroadcastState('live');
      return;
    }
    try {
      await clientRef.current?.startBroadcast(streamKey);
      setBroadcastState('live');
    } catch (err: any) {
      setError(err.message || 'Failed to start broadcast');
      setBroadcastState('error');
    }
  };

  const stopBroadcast = async (cleanup = false) => {
    if (!isMock && clientRef.current) {
      try {
        await clientRef.current.stopBroadcast();
      } catch {}
    }
    if (!cleanup) setBroadcastState('idle');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Preview canvas / mock placeholder */}
      <div style={{
        width: '100%',
        aspectRatio: '16/9',
        background: '#111',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {isMock ? (
          <div style={{ color: '#666', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🎥</div>
            <div style={{ fontSize: '13px' }}>Mock mode — camera preview disabled</div>
          </div>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: '100%',
                display: broadcastState === 'preview' || broadcastState === 'live' ? 'block' : 'none',
              }}
            />
            {broadcastState === 'idle' && (
              <div style={{ color: '#666', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>📷</div>
                <div style={{ fontSize: '13px' }}>Camera preview will appear here</div>
              </div>
            )}
            {broadcastState === 'initializing' && (
              <div style={{ color: '#aaa' }}>Initializing camera...</div>
            )}
          </>
        )}

        {broadcastState === 'live' && (
          <div style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: '#ef4444',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '4px',
            letterSpacing: '0.05em',
          }}>
            LIVE
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {broadcastState === 'idle' && (
          <button
            onClick={initializeCamera}
            style={{
              flex: 1,
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              padding: '10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Initialize Camera
          </button>
        )}

        {broadcastState === 'preview' && (
          <button
            onClick={startBroadcast}
            style={{
              flex: 1,
              background: '#22c55e',
              color: '#fff',
              border: 'none',
              padding: '10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 700,
            }}
          >
            Go Live
          </button>
        )}

        {broadcastState === 'live' && (
          <button
            onClick={() => stopBroadcast()}
            style={{
              flex: 1,
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              padding: '10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 700,
            }}
          >
            Stop Broadcast
          </button>
        )}

        {broadcastState === 'error' && (
          <button
            onClick={() => { setError(null); setBroadcastState('idle'); }}
            style={{
              flex: 1,
              background: '#3d3d3d',
              color: '#fff',
              border: 'none',
              padding: '10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Retry
          </button>
        )}
      </div>

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

      {isMock && (
        <div style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '6px',
          padding: '10px 14px',
          fontSize: '12px',
          color: '#94a3b8',
        }}>
          <strong>Mock mode:</strong> Set <code>STREAMING_PROVIDER=ivs</code> and provide real IVS credentials for live broadcasting.
        </div>
      )}
    </div>
  );
};
