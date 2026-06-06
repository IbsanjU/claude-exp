import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// In-memory user storage (replace with database in production)
const users = new Map<string, any>();

// Demo users for testing
const DEMO_USER = {
  id: uuidv4(),
  username: 'demo',
  passwordHash: bcrypt.hashSync('demo', 10),
  role: 'broadcaster',
  createdAt: new Date()
};
const VIEWER_USER = {
  id: uuidv4(),
  username: 'viewer',
  passwordHash: bcrypt.hashSync('viewer', 10),
  role: 'viewer',
  createdAt: new Date()
};
users.set('demo', DEMO_USER);
users.set('viewer', VIEWER_USER);

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = users.get(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    (req.session as any).userId = user.id;
    (req.session as any).username = user.username;
    (req.session as any).role = user.role || 'viewer';

    res.json({
      id: user.id,
      username: user.username,
      role: user.role || 'viewer'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

router.get('/me', (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = Array.from(users.values()).find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    username: user.username,
    role: user.role || 'viewer'
  });
});

export default router;
