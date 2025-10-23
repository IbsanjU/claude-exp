import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Connection } from '../types';

const router = express.Router();

// In-memory storage (replace with database in production)
const connections = new Map<string, Connection>();

router.get('/', (req, res) => {
  const allConnections = Array.from(connections.values());
  res.json(allConnections);
});

router.post('/', (req, res) => {
  try {
    const { type, name, config } = req.body;

    if (!type || !name || !config) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (type !== 'ssh' && type !== 'rdp') {
      return res.status(400).json({ error: 'Invalid connection type' });
    }

    const connection: Connection = {
      id: uuidv4(),
      type,
      name,
      config,
      createdAt: new Date()
    };

    connections.set(connection.id, connection);
    res.status(201).json(connection);
  } catch (error) {
    console.error('Error creating connection:', error);
    res.status(500).json({ error: 'Failed to create connection' });
  }
});

router.get('/:id', (req, res) => {
  const connection = connections.get(req.params.id);
  if (!connection) {
    return res.status(404).json({ error: 'Connection not found' });
  }
  res.json(connection);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const connection = connections.get(id);

  if (!connection) {
    return res.status(404).json({ error: 'Connection not found' });
  }

  const { name, config } = req.body;
  if (name) connection.name = name;
  if (config) connection.config = { ...connection.config, ...config };

  connections.set(id, connection);
  res.json(connection);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;

  if (!connections.has(id)) {
    return res.status(404).json({ error: 'Connection not found' });
  }

  connections.delete(id);
  res.json({ message: 'Connection deleted successfully' });
});

export default router;
