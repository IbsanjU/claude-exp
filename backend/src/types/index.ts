export interface SSHConnection {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
}

export interface RDPConnection {
  host: string;
  port: number;
  username: string;
  password?: string;
  domain?: string;
  security?: string;
  ignoreCert?: boolean;
}

export interface Connection {
  id: string;
  type: 'ssh' | 'rdp';
  name: string;
  config: SSHConnection | RDPConnection;
  createdAt: Date;
}

export interface TerminalSession {
  id: string;
  connectionId: string;
  type: 'ssh' | 'rdp';
  active: boolean;
  createdAt: Date;
}

export interface WSMessage {
  type: 'connect' | 'disconnect' | 'data' | 'resize' | 'error';
  sessionId?: string;
  connectionId?: string;
  data?: any;
  cols?: number;
  rows?: number;
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
}
