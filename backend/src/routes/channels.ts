import express from 'express';
import { requireAuth, requireRole } from '../middleware/requireRole';
import { getProvider } from '../services/streaming/provider';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const channels = await getProvider().listChannels();
    res.json(channels);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const channel = await getProvider().getChannel(req.params.id);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    res.json(channel);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireAuth, requireRole('broadcaster'), async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const session = req.session as any;
    const result = await getProvider().createChannel({
      name,
      description,
      ownerId: session.userId,
      ownerName: session.username,
    });
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireAuth, requireRole('broadcaster'), async (req, res) => {
  try {
    await getProvider().deleteChannel(req.params.id);
    res.json({ message: 'Channel deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get ingest endpoint — broadcaster only
router.get('/:id/ingest', requireAuth, requireRole('broadcaster'), async (req, res) => {
  try {
    const ingest = await getProvider().getIngestEndpoint(req.params.id);
    res.json(ingest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Rotate stream key — broadcaster only
router.post('/:id/stream-key/rotate', requireAuth, requireRole('broadcaster'), async (req, res) => {
  try {
    const streamKey = await getProvider().rotateStreamKey(req.params.id);
    res.json({ streamKey });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
