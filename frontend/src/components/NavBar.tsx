import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../services/api';

const links = [
  { path: '/streams', label: 'Live Streams' },
  { path: '/broadcast', label: 'Broadcast' },
  { path: '/recordings', label: 'Recordings' },
];

export const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      window.location.href = '/';
    }
  };

  return (
    <div style={{
      background: '#2d2d2d',
      borderBottom: '1px solid #3d3d3d',
      padding: '0 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      height: '52px',
    }}>
      <span
        onClick={() => navigate('/streams')}
        style={{
          fontWeight: 700,
          fontSize: '16px',
          color: '#fff',
          cursor: 'pointer',
          marginRight: '20px',
          letterSpacing: '-0.02em',
        }}
      >
        StreamPOC
      </span>

      {links.map(link => {
        const active = location.pathname.startsWith(link.path);
        return (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            style={{
              background: active ? '#3b82f620' : 'none',
              border: 'none',
              color: active ? '#60a5fa' : '#94a3b8',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: active ? 600 : 400,
            }}
          >
            {link.label}
          </button>
        );
      })}

      <div style={{ flex: 1 }} />

      <button
        onClick={handleLogout}
        style={{
          background: 'none',
          border: '1px solid #3d3d3d',
          color: '#94a3b8',
          padding: '5px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
        }}
      >
        Logout
      </button>
    </div>
  );
};
