import React, { useState, useEffect } from 'react';
import { Terminal } from '../components/Terminal';
import { RDPViewer } from '../components/RDPViewer';
import { ConnectionList } from '../components/ConnectionList';
import { ConnectionForm } from '../components/ConnectionForm';
import { Connection } from '../types';
import { connectionsApi, authApi } from '../services/api';

export const Dashboard: React.FC = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeConnection, setActiveConnection] = useState<Connection | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [view, setView] = useState<'list' | 'terminal'>('list');

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const data = await connectionsApi.getAll();
      setConnections(data);
    } catch (error) {
      console.error('Failed to load connections:', error);
    }
  };

  const handleSaveConnection = async (connection: Omit<Connection, 'id' | 'createdAt'>) => {
    try {
      if (editingConnection) {
        await connectionsApi.update(editingConnection.id, connection);
      } else {
        await connectionsApi.create(connection);
      }
      await loadConnections();
      setShowForm(false);
      setEditingConnection(null);
    } catch (error) {
      console.error('Failed to save connection:', error);
      alert('Failed to save connection');
    }
  };

  const handleDeleteConnection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this connection?')) {
      return;
    }

    try {
      await connectionsApi.delete(id);
      await loadConnections();
    } catch (error) {
      console.error('Failed to delete connection:', error);
      alert('Failed to delete connection');
    }
  };

  const handleConnect = (connection: Connection) => {
    setActiveConnection(connection);
    setView('terminal');
  };

  const handleCloseTerminal = () => {
    setActiveConnection(null);
    setView('list');
  };

  const handleEdit = (connection: Connection) => {
    setEditingConnection(connection);
    setShowForm(true);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (view === 'terminal' && activeConnection) {
    if (activeConnection.type === 'ssh') {
      return <Terminal connection={activeConnection} onClose={handleCloseTerminal} />;
    } else {
      return <RDPViewer connection={activeConnection} onClose={handleCloseTerminal} />;
    }
  }

  if (showForm) {
    return (
      <ConnectionForm
        connection={editingConnection || undefined}
        onSave={handleSaveConnection}
        onCancel={() => {
          setShowForm(false);
          setEditingConnection(null);
        }}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1e1e1e', color: '#fff' }}>
      <div style={{
        background: '#2d2d2d',
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #444',
      }}>
        <h1 style={{ margin: 0 }}>Web Terminal</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowForm(true)}
            style={{
              background: '#5cb85c',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            New Connection
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: '#d9534f',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </div>
      <ConnectionList
        connections={connections}
        onConnect={handleConnect}
        onEdit={handleEdit}
        onDelete={handleDeleteConnection}
      />
    </div>
  );
};
