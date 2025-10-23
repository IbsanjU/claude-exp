import React from 'react';
import { Connection } from '../types';

interface ConnectionListProps {
  connections: Connection[];
  onConnect: (connection: Connection) => void;
  onEdit: (connection: Connection) => void;
  onDelete: (id: string) => void;
}

export const ConnectionList: React.FC<ConnectionListProps> = ({
  connections,
  onConnect,
  onEdit,
  onDelete,
}) => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Saved Connections</h2>
      {connections.length === 0 ? (
        <p style={{ color: '#888' }}>No connections saved yet. Create one to get started.</p>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {connections.map((connection) => (
            <div
              key={connection.id}
              style={{
                border: '1px solid #444',
                borderRadius: '8px',
                padding: '15px',
                background: '#2d2d2d',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0' }}>{connection.name}</h3>
                  <p style={{ margin: '0', color: '#888', fontSize: '14px' }}>
                    {connection.type.toUpperCase()} - {(connection.config as any).host}:{(connection.config as any).port}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => onConnect(connection)}
                    style={{
                      background: '#5cb85c',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Connect
                  </button>
                  <button
                    onClick={() => onEdit(connection)}
                    style={{
                      background: '#5bc0de',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(connection.id)}
                    style={{
                      background: '#d9534f',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
