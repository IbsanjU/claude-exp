import { EventEmitter } from 'events';
import { RDPConnection } from '../types';
import * as net from 'net';

export class RDPService extends EventEmitter {
  private socket: net.Socket | null = null;
  private connected: boolean = false;
  private config: RDPConnection | null = null;
  private argsReceived: string[] = [];

  constructor() {
    super();
  }

  async connect(config: RDPConnection): Promise<void> {
    return new Promise((resolve, reject) => {
      this.config = config;

      const guacamoleHost = process.env.GUACAMOLE_HOST || 'localhost';
      const guacamolePort = parseInt(process.env.GUACAMOLE_PORT || '4822');

      this.socket = new net.Socket();
      let handshakeComplete = false;
      let buffer = '';

      this.socket.on('connect', () => {
        console.log('Connected to Guacamole daemon');
        this.connected = true;

        // Immediately send select instruction to choose RDP protocol
        const protocol = 'rdp';
        const selectInstruction = `6.select,3.${protocol};`;
        console.log('Sending select instruction:', selectInstruction);
        if (this.socket) {
          this.socket.write(selectInstruction);
        }
      });

      this.socket.on('data', (data) => {
        const dataStr = data.toString();
        buffer += dataStr;
        console.log('Received from guacd:', dataStr);

        // Parse Guacamole protocol instructions
        const instructions = buffer.split(';');

        // Process complete instructions (last one might be incomplete)
        for (let i = 0; i < instructions.length - 1; i++) {
          const instruction = instructions[i];
          console.log('Processing instruction:', instruction);

          if (instruction.includes('args')) {
            // Server sent args instruction, parse and respond with connection parameters
            console.log('Received args instruction, parsing parameters');
            this.parseArgsInstruction(instruction);
            this.sendConnectionParameters();
          } else if (instruction.includes('ready')) {
            // Connection is ready
            console.log('Connection ready');
            if (!handshakeComplete) {
              handshakeComplete = true;
              this.emit('connected');
              resolve();
            }
          } else if (instruction.includes('error')) {
            // Error occurred
            const error = new Error('Guacamole connection error: ' + instruction);
            console.error('Guacamole error:', error);
            this.emit('error', error);
            if (!handshakeComplete) {
              reject(error);
            }
          }
        }

        // Keep the last incomplete instruction in buffer
        buffer = instructions[instructions.length - 1];

        // Emit data to client
        if (handshakeComplete) {
          this.emit('data', data);
        }
      });

      this.socket.on('error', (err) => {
        console.error('RDP/Guacamole connection error:', err);
        this.emit('error', err);
        if (!handshakeComplete) {
          reject(err);
        }
      });

      this.socket.on('close', () => {
        console.log('RDP connection closed');
        this.connected = false;
        this.emit('disconnected');
      });

      try {
        this.socket.connect(guacamolePort, guacamoleHost);
      } catch (err) {
        reject(err);
      }
    });
  }

  private parseArgsInstruction(instruction: string): void {
    // Parse: 4.args,13.VERSION_1_5_0,8.hostname,4.port,...
    const parts = instruction.split(',');
    this.argsReceived = [];

    // Skip first element (4.args) and extract parameter names
    for (let i = 1; i < parts.length; i++) {
      const match = parts[i].match(/^\d+\.(.+)$/);
      if (match) {
        this.argsReceived.push(match[1]);
      }
    }
    console.log('Parsed args:', this.argsReceived.join(', '));
  }

  private sendConnectionParameters(): void {
    if (!this.socket || !this.config || this.argsReceived.length === 0) return;

    // Build connection parameters map
    const params: Record<string, string> = {
      'hostname': this.config.host,
      'port': String(this.config.port || 3389),
      'username': this.config.username || '',
      'password': this.config.password || '',
      'security': this.config.security || 'any',
      'ignore-cert': this.config.ignoreCert ? 'true' : 'false',
      'width': '1024',
      'height': '768',
      'dpi': '96'
    };

    if (this.config.domain) {
      params['domain'] = this.config.domain;
    }

    // Build connect instruction with ALL parameters in the order specified by args
    // Format: length.connect,length.value1,length.value2,...
    let connectInstruction = '7.connect';

    for (const paramName of this.argsReceived) {
      const value = params[paramName] || '';
      connectInstruction += `,${value.length}.${value}`;
    }

    connectInstruction += ';';
    console.log('Sending connect instruction with', this.argsReceived.length, 'parameters');
    console.log('Connect instruction:', connectInstruction.substring(0, 200) + '...');
    this.socket.write(connectInstruction);
  }

  write(data: string): void {
    if (this.socket && !this.socket.destroyed) {
      this.socket.write(data);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.end();
      this.socket = null;
    }
    this.connected = false;
    this.config = null;
  }

  isConnected(): boolean {
    return this.connected;
  }
}
