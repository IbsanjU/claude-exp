import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import { WebSocketService } from '../services/websocket';
import { Connection } from '../types';

interface TerminalProps {
  connection: Connection;
  onClose: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({ connection, onClose }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocketService | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
      },
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Initialize WebSocket
    const wsUrl = `ws://localhost:3001/terminal`;
    const ws = new WebSocketService(wsUrl);
    wsRef.current = ws;

    ws.connect().then(() => {
      // Send connect message
      ws.send({
        type: 'connect',
        connectionId: connection.id,
        data: {
          type: connection.type,
          config: connection.config,
          cols: term.cols,
          rows: term.rows,
        },
      });
    }).catch((error) => {
      console.error('Failed to connect to WebSocket:', error);
      setStatus('error');
      term.writeln('Failed to connect to server');
    });

    // Handle messages from server
    ws.on('connected', (message) => {
      setSessionId(message.sessionId);
      setStatus('connected');
    });

    ws.on('data', (message) => {
      const data = atob(message.data);
      term.write(data);
    });

    ws.on('error', (message) => {
      setStatus('error');
      term.writeln(`\r\nError: ${message.data}`);
    });

    ws.on('disconnect', () => {
      setStatus('disconnected');
      term.writeln('\r\nConnection closed');
    });

    // Handle terminal input
    term.onData((data) => {
      if (sessionId && ws.isConnected()) {
        ws.send({
          type: 'data',
          sessionId,
          data: btoa(data),
        });
      }
    });

    // Handle terminal resize
    const handleResize = () => {
      fitAddon.fit();
      if (sessionId && ws.isConnected()) {
        ws.send({
          type: 'resize',
          sessionId,
          cols: term.cols,
          rows: term.rows,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (sessionId && ws.isConnected()) {
        ws.send({ type: 'disconnect', sessionId });
      }
      ws.disconnect();
      term.dispose();
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
          <strong>{connection.name}</strong> - {status}
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
      <div ref={terminalRef} style={{ flex: 1, padding: '10px' }} />
    </div>
  );
};
