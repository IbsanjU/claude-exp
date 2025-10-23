import React, { useState, useEffect } from 'react';
import { Terminal } from '../components/Terminal';
import { RDPViewer } from '../components/RDPViewer';
import { ConnectionList } from '../components/ConnectionList';
import { ConnectionForm } from '../components/ConnectionForm';
import { Notification } from '../components/Notification';
import { Connection } from '../types';
import { authApi } from '../services/api';
import { connectionStorage } from '../services/storage';
import { v4 as uuidv4 } from 'uuid';

interface NotificationState {
  message: string;
  type: 'error' | 'success' | 'info';
}

export const Dashboard: React.FC = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeConnection, setActiveConnection] = useState<Connection | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [view, setView] = useState<'list' | 'terminal'>('list');
  const [notification, setNotification] = useState<NotificationState | null>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = () => {
    try {
      const data = connectionStorage.getAll();
      setConnections(data);
    } catch (error) {
      console.error('Failed to load connections:', error);
      showNotification('Failed to load connections', 'error');
    }
  };

  const showNotification = (message: string, type: 'error' | 'success' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSaveConnection = (connection: Omit<Connection, 'id' | 'createdAt'>) => {
    try {
      if (editingConnection) {
        connectionStorage.update(editingConnection.id, connection);
        showNotification('Connection updated successfully', 'success');
      } else {
        const newConnection: Connection = {
          ...connection,
          id: uuidv4(),
          createdAt: new Date(),
        };
        connectionStorage.add(newConnection);
        showNotification('Connection saved successfully', 'success');
      }
      loadConnections();
      setShowForm(false);
      setEditingConnection(null);
    } catch (error) {
      console.error('Failed to save connection:', error);
      showNotification('Failed to save connection', 'error');
    }
  };

  const handleDeleteConnection = (id: string) => {
    if (!confirm('Are you sure you want to delete this connection?')) {
      return;
    }

    try {
      connectionStorage.delete(id);
      loadConnections();
      showNotification('Connection deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete connection:', error);
      showNotification('Failed to delete connection', 'error');
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
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
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
