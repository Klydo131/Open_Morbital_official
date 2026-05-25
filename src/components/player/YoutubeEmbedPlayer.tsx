// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useRef } from 'react';
import { registerEmbedPlayer, clearPendingPlay } from '../../core/audio/embedPlayerBridge';
import { clearPosition, usePlayerStore, rememberPosition, recallPosition, type MorbitalTrack } from '../../store/playerStore';

type YoutubePlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getDuration: () => number;
  getCurrentTime: () => number;
  destroy: () => void;
};

type YoutubeEvent = {
  target: YoutubePlayer;
  data: number;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLIFrameElement,
        options: {
          events: {
            onReady: (event: YoutubeEvent) => void;
            onStateChange: (event: YoutubeEvent) => void;
          };
        },
      ) => YoutubePlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiReady: Promise<void> | null = null;

function loadYoutubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (youtubeApiReady) return youtubeApiReady;

  youtubeApiReady = new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      youtubeApiReady = null;
      reject(new Error('YouTube IFrame API timed out'));
    }, 10_000);

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timer);
      previousReady?.();
      resolve();
    };

    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => {
        window.clearTimeout(timer);
        youtubeApiReady = null;
        reject(new Error('YouTube IFrame API failed to load'));
      };
      document.head.appendChild(script);
    }
  });

  return youtubeApiReady;
}

type Props = {
  track: MorbitalTrack;
  className?: string;
  height?: number;
};

export function YoutubeEmbedPlayer({ track, className, height = 220 }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<YoutubePlayer | null>(null);
  const isYoutubePlayingRef = useRef(false);

  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const playNext = usePlayerStore((s) => s.playNext);

  useEffect(() => {
    if (!track.sourceUrl) return;

    let cancelled = false;
    let unregister: () => void = () => undefined;
    let progressTimer: number | undefined;

    // Restore the per-track saved position instead of always resetting to 0.
    // Session 39 added rememberPosition/recallPosition for local audio;
    // YouTube was missing from that path because the previous mount-effect
    // hard-reset currentTime to 0 every time the iframe loaded.
    const resumeAt = recallPosition(track.id);
    const wantsPlaybackOnMount = usePlayerStore.getState().isPlaying;
    setCurrentTime(resumeAt);
    setDuration(track.duration ?? 0);
    if (!wantsPlaybackOnMount) setIsPlaying(false);
    isYoutubePlayingRef.current = false;

    void loadYoutubeApi().then(() => {
      if (cancelled || !iframeRef.current || !window.YT) return;

      const player = new window.YT.Player(iframeRef.current, {
        events: {
          onReady: (event) => {
            if (cancelled) return;
            playerRef.current = event.target;
            const duration = event.target.getDuration();
            if (Number.isFinite(duration) && duration > 0) setDuration(duration);
            // Seek to the saved position before playback. Use allowSeekAhead=true
            // so the player can buffer past the current bookmark.
            if (resumeAt > 0) {
              try { event.target.seekTo(resumeAt, true); } catch { /* player not ready */ }
            }
            unregister = registerEmbedPlayer({
              play: () => event.target.playVideo(),
              pause: () => event.target.pauseVideo(),
              seekTo: (seconds) => event.target.seekTo(seconds, true),
              getDuration: () => event.target.getDuration(),
              isPlaying: () => isYoutubePlayingRef.current,
            });
            // If the store wants playback (e.g., user pressed Next from a
            // playing audio track into this YouTube track), start the iframe
            // now. Without this the previous behavior was: track loaded but
            // stayed paused until the user pressed Play again — the exact
            // "I have to click again" complaint.
            if (usePlayerStore.getState().isPlaying) {
              try { event.target.playVideo(); } catch { /* autoplay policy may block */ }
            }
          },
          onStateChange: (event) => {
            if (cancelled || usePlayerStore.getState().currentTrack?.id !== track.id) return;
            // Hardcoded constants — YT.PlayerState values have not changed in 15 years
            // and using window.YT?.PlayerState can silently exit if accessed mid-init.
            if (event.data === 1) {        // PLAYING
              isYoutubePlayingRef.current = true;
              setIsPlaying(true);
            } else if (event.data === 2) { // PAUSED
              isYoutubePlayingRef.current = false;
              setIsPlaying(false);
            } else if (event.data === 0) { // ENDED
              isYoutubePlayingRef.current = false;
              clearPosition(track.id);
              setCurrentTime(0);
              setIsPlaying(false);
              playNext();
            }
          },
        },
      });
      playerRef.current = player;

      progressTimer = window.setInterval(() => {
        try {
          if (cancelled || usePlayerStore.getState().currentTrack?.id !== track.id) return;
          const p = playerRef.current;
          if (!p) return;
          const dur = p.getDuration();
          const t = p.getCurrentTime();
          if (Number.isFinite(dur) && dur > 0) setDuration(dur);
          if (Number.isFinite(t)) setCurrentTime(t);
        } catch {
          // Player was destroyed between ticks
        }
      }, 500);
    }).catch(() => {
      if (!cancelled) {
        clearPendingPlay();
        usePlayerStore.getState().addToast(
          'YouTube controls could not connect. Use the YouTube player controls directly.',
          'error',
        );
      }
    });

    return () => {
      cancelled = true;
      // Save the YouTube player's exact position before unmount so Next/Prev
      // back to this track resumes where the user left off.
      try {
        const t = playerRef.current?.getCurrentTime();
        if (typeof t === 'number' && Number.isFinite(t) && t > 0) {
          rememberPosition(track.id, t);
        }
      } catch { /* player may already be torn down */ }
      unregister();
      if (progressTimer !== undefined) window.clearInterval(progressTimer);
      playerRef.current?.destroy();
      playerRef.current = null;
      isYoutubePlayingRef.current = false;
    };
  }, [playNext, setCurrentTime, setDuration, setIsPlaying, track]);

  return (
    <iframe
      ref={iframeRef}
      className={className}
      key={track.sourceUrl}
      src={track.sourceUrl}
      title={track.title}
      allow="autoplay; encrypted-media; picture-in-picture"
      sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
      allowFullScreen
      style={{
        width: '100%',
        height: className ? undefined : height,
        border: 'none',
        borderRadius: 'var(--sonata-radius-md)',
      }}
    />
  );
}
