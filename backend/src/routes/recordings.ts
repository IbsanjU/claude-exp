import express from 'express';
import { requireAuth, requireRole } from '../middleware/requireRole';
import { getProvider } from '../services/streaming/provider';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const channelId = req.query.channelId as string | undefined;
    const recordings = await getProvider().listRecordings(channelId);
    res.json(recordings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const recording = await getProvider().getRecording(req.params.id);
    if (!recording) return res.status(404).json({ error: 'Recording not found' });
    res.json(recording);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireAuth, requireRole('broadcaster'), async (req, res) => {
  try {
    await getProvider().deleteRecording(req.params.id);
    res.json({ message: 'Recording deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
