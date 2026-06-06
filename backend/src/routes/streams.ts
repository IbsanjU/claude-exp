import express from 'express';
import { requireAuth, requireRole } from '../middleware/requireRole';
import { getProvider } from '../services/streaming/provider';

const router = express.Router();

// List all live channels
router.get('/', async (req, res) => {
  try {
    const channels = await getProvider().listChannels();
    const live = channels.filter(c => c.status === 'LIVE');
    res.json(live);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Stream state for one channel
router.get('/:channelId', async (req, res) => {
  try {
    const state = await getProvider().getStreamState(req.params.channelId);
    res.json(state);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start FFmpeg relay (stream a pre-recorded file as live)
router.post('/:channelId/replay', requireAuth, requireRole('broadcaster'), async (req, res) => {
  const { s3Key, loop = false } = req.body;
  if (!s3Key) return res.status(400).json({ error: 's3Key is required' });

  try {
    const taskId = await getProvider().startReplay(req.params.channelId, s3Key, loop);
    res.json({ taskId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Stop FFmpeg relay
router.delete('/:channelId/replay', requireAuth, requireRole('broadcaster'), async (req, res) => {
  const { taskId } = req.body;
  if (!taskId) return res.status(400).json({ error: 'taskId is required' });

  try {
    await getProvider().stopReplay(req.params.channelId, taskId);
    res.json({ message: 'Replay stopped' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
