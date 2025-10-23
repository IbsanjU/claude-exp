import { Client, ClientChannel } from 'ssh2';
import { SSHConnection } from '../types';
import { EventEmitter } from 'events';

export class SSHService extends EventEmitter {
  private client: Client;
  private stream: ClientChannel | null = null;
  private connected: boolean = false;

  constructor() {
    super();
    this.client = new Client();
  }

  async connect(config: SSHConnection): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.on('ready', () => {
        console.log('SSH connection established');
        this.connected = true;
        this.emit('connected');
        resolve();
      });

      this.client.on('error', (err) => {
        console.error('SSH connection error:', err);
        this.emit('error', err);
        reject(err);
      });

      this.client.on('close', () => {
        console.log('SSH connection closed');
        this.connected = false;
        this.emit('disconnected');
      });

      const sshConfig: any = {
        host: config.host,
        port: config.port || 22,
        username: config.username,
      };

      if (config.password) {
        sshConfig.password = config.password;
      }

      if (config.privateKey) {
        sshConfig.privateKey = config.privateKey;
      }

      try {
        this.client.connect(sshConfig);
      } catch (err) {
        reject(err);
      }
    });
  }

  async startShell(cols: number = 80, rows: number = 24): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        return reject(new Error('SSH client not connected'));
      }

      this.client.shell({
        term: 'xterm-256color',
        cols,
        rows,
      }, (err, stream) => {
        if (err) {
          return reject(err);
        }

        this.stream = stream;

        stream.on('data', (data: Buffer) => {
          this.emit('data', data);
        });

        stream.on('close', () => {
          console.log('SSH shell stream closed');
          this.emit('close');
        });

        stream.stderr.on('data', (data: Buffer) => {
          this.emit('data', data);
        });

        resolve();
      });
    });
  }

  write(data: string): void {
    if (this.stream && !this.stream.destroyed) {
      this.stream.write(data);
    }
  }

  resize(cols: number, rows: number): void {
    if (this.stream && !this.stream.destroyed) {
      this.stream.setWindow(rows, cols, 0, 0);
    }
  }

  disconnect(): void {
    if (this.stream) {
      this.stream.end();
      this.stream = null;
    }
    if (this.client) {
      this.client.end();
    }
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }
}
