import { useEffect, useRef, useState } from 'react';

type PlayerState = 'idle' | 'loading' | 'playing' | 'error' | 'mock';

export function useHLSPlayer(videoRef: React.RefObject<HTMLVideoElement>, playbackUrl: string | null) {
  const hlsRef = useRef<any>(null);
  const [state, setState] = useState<PlayerState>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playbackUrl || !videoRef.current) {
      setState('idle');
      return;
    }

    if (playbackUrl.startsWith('mock://')) {
      setState('mock');
      return;
    }

    setState('loading');
    setError(null);

    const video = videoRef.current;

    const loadHLS = async () => {
      try {
        const { default: Hls } = await import('hls.js');

        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        // Native HLS (Safari)
        if (!Hls.isSupported() && video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = playbackUrl;
          video.addEventListener('loadedmetadata', () => {
            video.play().catch(() => {});
            setState('playing');
          }, { once: true });
          video.addEventListener('error', () => {
            setError('Failed to load stream');
            setState('error');
          }, { once: true });
          return;
        }

        if (!Hls.isSupported()) {
          setError('HLS not supported in this browser');
          setState('error');
          return;
        }

        const hls = new Hls({
          lowLatencyMode: true,
          backBufferLength: 30,
          maxBufferLength: 30,
        });
        hlsRef.current = hls;

        hls.loadSource(playbackUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
          setState('playing');
        });

        hls.on(Hls.Events.ERROR, (_: any, data: any) => {
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              hls.startLoad();
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              setError('Stream error. Please try again.');
              setState('error');
            }
          }
        });
      } catch (err) {
        setError('Failed to initialize player');
        setState('error');
      }
    };

    loadHLS();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [playbackUrl]);

  return { state, error };
}
