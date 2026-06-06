import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/Login';
import { Dashboard } from './pages/Dashboard';
import { StreamsPage } from './pages/StreamsPage';
import { ViewerPage } from './pages/ViewerPage';
import { BroadcasterDashboard } from './pages/BroadcasterDashboard';
import { BroadcasterStudio } from './pages/BroadcasterStudio';
import { RecordingsLibrary } from './pages/RecordingsLibrary';
import { VODPlayer } from './pages/VODPlayer';
import { authApi } from './services/api';
import { User } from './types';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = async (username: string, password: string) => {
    const userData = await authApi.login(username, password);
    setUser(userData);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#1e1e1e',
        color: '#fff',
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/streams" replace />} />
        <Route path="/streams" element={<StreamsPage />} />
        <Route path="/streams/:channelId" element={<ViewerPage />} />
        <Route path="/broadcast" element={<BroadcasterDashboard />} />
        <Route path="/broadcast/:channelId" element={<BroadcasterStudio />} />
        <Route path="/recordings" element={<RecordingsLibrary />} />
        <Route path="/recordings/:id" element={<VODPlayer />} />
        {/* Keep existing terminal app */}
        <Route path="/terminal" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/streams" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
