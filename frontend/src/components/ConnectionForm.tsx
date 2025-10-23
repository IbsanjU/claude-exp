import React, { useState } from 'react';
import { Connection, SSHConnection, RDPConnection } from '../types';

interface ConnectionFormProps {
  connection?: Connection;
  onSave: (connection: Omit<Connection, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export const ConnectionForm: React.FC<ConnectionFormProps> = ({ connection, onSave, onCancel }) => {
  const [type, setType] = useState<'ssh' | 'rdp'>(connection?.type || 'ssh');
  const [name, setName] = useState(connection?.name || '');
  const [host, setHost] = useState((connection?.config as any)?.host || '');
  const [port, setPort] = useState((connection?.config as any)?.port || (type === 'ssh' ? 22 : 3389));
  const [username, setUsername] = useState((connection?.config as any)?.username || '');
  const [password, setPassword] = useState('');
  const [privateKey, setPrivateKey] = useState((connection?.config as SSHConnection)?.privateKey || '');
  const [domain, setDomain] = useState((connection?.config as RDPConnection)?.domain || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let config: SSHConnection | RDPConnection;

    if (type === 'ssh') {
      config = {
        host,
        port,
        username,
        password: password || undefined,
        privateKey: privateKey || undefined,
      };
    } else {
      config = {
        host,
        port,
        username,
        password: password || undefined,
        domain: domain || undefined,
        security: 'any',
        ignoreCert: true,
      };
    }

    onSave({ type, name, config });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>{connection ? 'Edit Connection' : 'New Connection'}</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Connection Type</label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as 'ssh' | 'rdp');
              setPort(e.target.value === 'ssh' ? 22 : 3389);
            }}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #444',
              background: '#2d2d2d',
              color: '#fff',
            }}
            disabled={!!connection}
          >
            <option value="ssh">SSH</option>
            <option value="rdp">RDP</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Connection Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #444',
              background: '#2d2d2d',
              color: '#fff',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Host</label>
          <input
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            required
            placeholder="example.com or 192.168.1.1"
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #444',
              background: '#2d2d2d',
              color: '#fff',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Port</label>
          <input
            type="number"
            value={port}
            onChange={(e) => setPort(parseInt(e.target.value))}
            required
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #444',
              background: '#2d2d2d',
              color: '#fff',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #444',
              background: '#2d2d2d',
              color: '#fff',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={connection ? 'Leave blank to keep current' : ''}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #444',
              background: '#2d2d2d',
              color: '#fff',
            }}
          />
        </div>

        {type === 'ssh' && (
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Private Key (Optional)</label>
            <textarea
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="-----BEGIN RSA PRIVATE KEY-----"
              rows={5}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #444',
                background: '#2d2d2d',
                color: '#fff',
                fontFamily: 'monospace',
              }}
            />
          </div>
        )}

        {type === 'rdp' && (
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Domain (Optional)</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="DOMAIN"
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #444',
                background: '#2d2d2d',
                color: '#fff',
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button
            type="submit"
            style={{
              flex: 1,
              background: '#5cb85c',
              color: '#fff',
              border: 'none',
              padding: '10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              background: '#6c757d',
              color: '#fff',
              border: 'none',
              padding: '10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
