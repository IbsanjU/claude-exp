import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { SSHService } from './ssh';
import { RDPService } from './rdp';
import { WSMessage, SSHConnection, RDPConnection } from '../types';

interface ActiveSession {
  id: string;
  ws: WebSocket;
  service: SSHService | RDPService;
  type: 'ssh' | 'rdp';
}

const activeSessions = new Map<string, ActiveSession>();

export function setupWebSocket(wss: WebSocketServer): void {
  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection established');

    ws.on('message', async (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        await handleMessage(ws, message);
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        sendError(ws, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      cleanupSessions(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      cleanupSessions(ws);
    });
  });
}

async function handleMessage(ws: WebSocket, message: WSMessage): Promise<void> {
  switch (message.type) {
    case 'connect':
      await handleConnect(ws, message);
      break;

    case 'data':
      handleData(message);
      break;

    case 'resize':
      handleResize(message);
      break;

    case 'disconnect':
      handleDisconnect(message);
      break;

    default:
      sendError(ws, 'Unknown message type');
  }
}

async function handleConnect(ws: WebSocket, message: WSMessage): Promise<void> {
  try {
    const { connectionId, data } = message;

    if (!data || !data.type || !data.config) {
      return sendError(ws, 'Missing connection configuration');
    }

    const sessionId = uuidv4();
    let service: SSHService | RDPService;

    if (data.type === 'ssh') {
      service = new SSHService();
      const config: SSHConnection = data.config;

      await service.connect(config);
      await (service as SSHService).startShell(data.cols || 80, data.rows || 24);
    } else if (data.type === 'rdp') {
      service = new RDPService();
      const config: RDPConnection = data.config;

      await service.connect(config);
    } else {
      return sendError(ws, 'Invalid connection type');
    }

    // Setup event handlers
    service.on('data', (data: Buffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'data',
          sessionId,
          data: data.toString('base64')
        }));
      }
    });

    service.on('error', (error: Error) => {
      sendError(ws, error.message, sessionId);
    });

    service.on('disconnected', () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'disconnect',
          sessionId
        }));
      }
      activeSessions.delete(sessionId);
    });

    activeSessions.set(sessionId, {
      id: sessionId,
      ws,
      service,
      type: data.type
    });

    // Send success message
    ws.send(JSON.stringify({
      type: 'connected',
      sessionId,
      connectionId
    }));

    console.log(`${data.type.toUpperCase()} session ${sessionId} established`);
  } catch (error) {
    console.error('Error establishing connection:', error);
    sendError(ws, error instanceof Error ? error.message : 'Connection failed');
  }
}

function handleData(message: WSMessage): void {
  const { sessionId, data } = message;

  if (!sessionId) {
    return;
  }

  const session = activeSessions.get(sessionId);
  if (!session) {
    return;
  }

  try {
    const decodedData = Buffer.from(data, 'base64').toString('utf-8');
    session.service.write(decodedData);
  } catch (error) {
    console.error('Error writing data to session:', error);
  }
}

function handleResize(message: WSMessage): void {
  const { sessionId, cols, rows } = message;

  if (!sessionId || !cols || !rows) {
    return;
  }

  const session = activeSessions.get(sessionId);
  if (!session || session.type !== 'ssh') {
    return;
  }

  (session.service as SSHService).resize(cols, rows);
}

function handleDisconnect(message: WSMessage): void {
  const { sessionId } = message;

  if (!sessionId) {
    return;
  }

  const session = activeSessions.get(sessionId);
  if (session) {
    session.service.disconnect();
    activeSessions.delete(sessionId);
    console.log(`Session ${sessionId} disconnected`);
  }
}

function cleanupSessions(ws: WebSocket): void {
  const sessionsToCleanup: string[] = [];

  activeSessions.forEach((session, sessionId) => {
    if (session.ws === ws) {
      session.service.disconnect();
      sessionsToCleanup.push(sessionId);
    }
  });

  sessionsToCleanup.forEach(sessionId => {
    activeSessions.delete(sessionId);
  });
}

function sendError(ws: WebSocket, message: string, sessionId?: string): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'error',
      sessionId,
      data: message
    }));
  }
}
