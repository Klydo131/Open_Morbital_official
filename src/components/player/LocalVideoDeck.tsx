// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useRef, useState } from 'react';
import { clearPosition, usePlayerStore, type MorbitalTrack } from '../../store/playerStore';
import { setGlobalAudio } from '../../core/audio/audioRef';

type Props = { track: MorbitalTrack };

export function LocalVideoDeck({ track }: Props) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  // Prevents the store→video→onPlay/onPause→store feedback loop
  const syncingRef = useRef(false);

  const [shape, setShape] = useState<'unknown' | 'portrait' | 'landscape' | 'square'>('unknown');

  const isPlaying    = usePlayerStore((s) => s.isPlaying);
  const currentTime  = usePlayerStore((s) => s.currentTime);
  const volume       = usePlayerStore((s) => s.volume);
  const isRepeatOn   = usePlayerStore((s) => s.isRepeatOn);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);
  const setDuration  = usePlayerStore((s) => s.setDuration);
  const playNext     = usePlayerStore((s) => s.playNext);

  // Mount: register video as the global audio singleton
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !track.objectUrl) return;
    setGlobalAudio(video);
    setShape('unknown');
    video.src = track.objectUrl;
    video.load();
    return () => {
      // Suppress the onPause→setIsPlaying(false) feedback loop during unmount.
      // When this deck unmounts because the user switched tracks, isPlaying must
      // stay true so useAudioEngine plays the incoming track automatically.
      syncingRef.current = true;
      video.pause();
      setGlobalAudio(null);
    };
  }, [track.id, track.objectUrl]);

  // Store → video: play / pause (one-way, guarded to break feedback loop)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    syncingRef.current = true;

    if (isPlaying) {
      // Don't re-call play() if already playing
      if (!video.paused) { syncingRef.current = false; return; }
      void video.play().catch(() => {
        syncingRef.current = false;
        setIsPlaying(false);
      });
    } else {
      // Don't re-call pause() if already paused
      if (video.paused) { syncingRef.current = false; return; }
      video.pause();
    }

    // Give the browser one event cycle to fire onPlay/onPause before we
    // allow those handlers to write back to the store again.
    const id = window.setTimeout(() => { syncingRef.current = false; }, 100);
    return () => window.clearTimeout(id);
  }, [isPlaying, setIsPlaying]);

  // Store → video: seek (only when the delta is meaningful)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(currentTime)) return;
    if (Math.abs(video.currentTime - currentTime) > 0.35) {
      video.currentTime = currentTime;
    }
  }, [currentTime]);

  // Store → video: volume
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.volume = volume;
  }, [volume]);

  // Store → video: loop
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.loop = isRepeatOn;
  }, [isRepeatOn]);

  function detectShape(video: HTMLVideoElement) {
    const { videoWidth: w, videoHeight: h } = video;
    if (!w || !h) { setShape('unknown'); return; }
    const r = w / h;
    if (r < 0.82) setShape('portrait');
    else if (r > 1.18) setShape('landscape');
    else setShape('square');
  }

  return (
    <div
      className={`sonata-local-video-deck sonata-local-video-deck--${shape}`}
      aria-label="Video player"
    >
      <div className="sonata-local-video-deck__rail sonata-local-video-deck__rail--top" />
      <video
        ref={videoRef}
        playsInline
        preload="metadata"
        className="sonata-local-video-deck__video"
        // Video → store: only when NOT triggered by our own store sync
        onPlay={() => { if (!syncingRef.current) setIsPlaying(true); }}
        onPause={() => { if (!syncingRef.current) setIsPlaying(false); }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          detectShape(e.currentTarget);
          setDuration(e.currentTarget.duration);
        }}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => {
          // playNext() already sets isPlaying=true; don't pre-emptively set false
          // here or the next track will load but stay paused.
          clearPosition(track.id);
          setCurrentTime(0);
          if (!usePlayerStore.getState().isRepeatOn) playNext();
        }}
        onError={() => {
          setIsPlaying(false);
          usePlayerStore.getState().addToast(`Could not play "${track.title}"`, 'error');
        }}
      />
      <div className="sonata-local-video-deck__rail sonata-local-video-deck__rail--bottom" />
    </div>
  );
}
