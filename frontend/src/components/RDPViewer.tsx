import React, { useEffect, useRef, useState } from 'react';
import { WebSocketService } from '../services/websocket';
import { Connection } from '../types';

interface RDPViewerProps {
  connection: Connection;
  onClose: () => void;
}

export const RDPViewer: React.FC<RDPViewerProps> = ({ connection, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocketService | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Initialize WebSocket
    const wsUrl = `ws://localhost:3001/terminal`;
    const ws = new WebSocketService(wsUrl);
    wsRef.current = ws;

    ws.connect().then(() => {
      ws.send({
        type: 'connect',
        connectionId: connection.id,
        data: {
          type: connection.type,
          config: connection.config,
        },
      });
    }).catch((error) => {
      console.error('Failed to connect to WebSocket:', error);
      setStatus('error');
    });

    ws.on('connected', (message) => {
      setSessionId(message.sessionId);
      setStatus('connected');
    });

    ws.on('data', (message) => {
      // Handle Guacamole protocol data
      // This would need to be implemented with proper Guacamole protocol parsing
      // For now, we'll just log it
      console.log('Received RDP data:', message.data);
    });

    ws.on('error', (message) => {
      setStatus('error');
      console.error('RDP error:', message.data);
    });

    ws.on('disconnect', () => {
      setStatus('disconnected');
    });

    // Handle mouse and keyboard events
    const handleMouseMove = (e: MouseEvent) => {
      if (sessionId && ws.isConnected()) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Send mouse move event (Guacamole protocol)
        ws.send({
          type: 'data',
          sessionId,
          data: btoa(`5.mouse,${x},${y};`),
        });
      }
    };

    const handleMouseClick = (e: MouseEvent) => {
      if (sessionId && ws.isConnected()) {
        const button = e.button;
        const pressed = e.type === 'mousedown' ? 1 : 0;

        ws.send({
          type: 'data',
          sessionId,
          data: btoa(`5.mouse,${button},${pressed};`),
        });
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseClick);
    canvas.addEventListener('mouseup', handleMouseClick);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseClick);
      canvas.removeEventListener('mouseup', handleMouseClick);

      if (sessionId && ws.isConnected()) {
        ws.send({ type: 'disconnect', sessionId });
      }
      ws.disconnect();
    };
  }, [connection]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '10px',
        background: '#2d2d2d',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <strong>{connection.name}</strong> (RDP) - {status}
        </div>
        <button
          onClick={onClose}
          style={{
            background: '#d9534f',
            color: '#fff',
            border: 'none',
            padding: '5px 15px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
      <div style={{ flex: 1, background: '#1e1e1e', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <canvas
          ref={canvasRef}
          width={1024}
          height={768}
          style={{
            border: '1px solid #444',
            cursor: 'default',
          }}
        />
      </div>
    </div>
  );
};
