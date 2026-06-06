import { useEffect, useState, useCallback } from 'react';
import { StreamState } from '../types/streaming';
import { streamsApi } from '../services/streaming';

export function useStreamStatus(channelId: string | null, intervalMs = 10_000) {
  const [state, setState] = useState<StreamState | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!channelId) return;
    setLoading(true);
    try {
      const data = await streamsApi.getState(channelId);
      setState(data);
    } catch {
      // silently fail on poll errors
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    if (!channelId) return;
    refresh();
    const timer = setInterval(refresh, intervalMs);
    return () => clearInterval(timer);
  }, [channelId, intervalMs, refresh]);

  return { state, loading, refresh };
}
