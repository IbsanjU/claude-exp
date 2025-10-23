import React from 'react';

interface NotificationProps {
  message: string;
  type: 'error' | 'success' | 'info';
  onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  const backgroundColor = {
    error: '#d9534f',
    success: '#5cb85c',
    info: '#5bc0de',
  }[type];

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor,
        color: '#fff',
        padding: '15px 20px',
        borderRadius: '4px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        zIndex: 9999,
        maxWidth: '400px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '15px',
      }}
    >
      <div>{message}</div>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#fff',
          fontSize: '20px',
          cursor: 'pointer',
          padding: '0',
          lineHeight: '1',
        }}
      >
        ×
      </button>
    </div>
  );
};
