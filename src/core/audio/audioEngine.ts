// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useRef } from 'react';
import { clearPosition, usePlayerStore, type MorbitalTrack } from '../../store/playerStore';
import { setGlobalAudio, getGlobalAudio, getShellAudio, clearStickyAudio, setDirectPlaySrc, getDirectPlaySrc, suppressNextPause } from './audioRef';
import { ensureAudioAnalyser } from './audioAnalyser';
import { seekEmbedToPercent, playEmbedPlayer, pauseEmbedPlayer } from './embedPlayerBridge';
import { transcodeLocalAudioToAac } from './localTranscode';

let lastPlaybackFailureKey = '';
let lastPlaybackFailureAt = 0;
// Incremented every time a new play attempt starts. Any in-flight async play
// that captures a stale generation number silently abandons itself rather than
// showing an error toast or mutating state for the wrong track.
let _playGeneration = 0;

function getPlayableSrc(track: MorbitalTrack | null): string {
  return track?.objectUrl ?? track?.transcodedObjectUrl ?? track?.fallbackDataUrl ?? track?.sourceUrl ?? '';
}

function getPlayableSources(track: MorbitalTrack | null): string[] {
  if (!track) return [];
  return [track.objectUrl, track.transcodedObjectUrl, track.fallbackDataUrl, track.sourceUrl].filter(Boolean) as string[];
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Local file could not be converted for fallback playback.'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Local file fallback read failed.'));
    reader.readAsDataURL(file);
  });
}

async function ensureLocalFallbackDataUrl(track: MorbitalTrack | null): Promise<string | null> {
  if (!track || track.sourceType !== 'local') return null;
  if (track.fallbackDataUrl) return track.fallbackDataUrl;
  if (!track.localFile) return null;

  const dataUrl = await readFileAsDataUrl(track.localFile);
  usePlayerStore.getState().updateTrack(track.id, { fallbackDataUrl: dataUrl });
  return dataUrl;
}

function getLocalFormatLabel(track: MorbitalTrack | null): string {
  const ext = track?.fileName.match(/\.([^.]+)$/)?.[1]?.toUpperCase();
  return ext ? `${ext} file` : 'local file';
}

function canPlayNatively(mimeType: string): boolean {
  if (!mimeType) return true;
  const probe = document.createElement('audio');
  return probe.canPlayType(mimeType) !== '';
}

function shouldReportPlaybackFailure(track: MorbitalTrack | null): boolean {
  const key = track?.id ?? 'unknown';
  const now = Date.now();
  if (lastPlaybackFailureKey === key && now - lastPlaybackFailureAt < 2500) {
    return false;
  }
  lastPlaybackFailureKey = key;
  lastPlaybackFailureAt = now;
  return true;
}

function reportMissingSource(track: MorbitalTrack | null): void {
  if (!track) return;
  const { addToast, setUrlStatus, setIsPlaying } = usePlayerStore.getState();
  setIsPlaying(false);
  if (track.sourceType === 'local') {
    if (track.needsReAdd) {
      addToast(`"${track.title}" needs to be re-added from your device. Tap Locate File.`, 'error');
    } else {
      addToast(`"${track.title}" is not available in this session.`, 'error');
    }
    setUrlStatus('This local file is not available. Tap Locate File to re-add it from your device.');
    return;
  }
  addToast(`No playable source for "${track.title}"`, 'error');
}

function reportPlaybackFailure(track: MorbitalTrack | null): void {
  const { addToast, setIsPlaying } = usePlayerStore.getState();
  setIsPlaying(false);
  if (!shouldReportPlaybackFailure(track)) return;
  if (track?.sourceType === 'local') {
    addToast(`Could not play "${track.title}". This ${getLocalFormatLabel(track)} may use a codec this browser cannot decode. Try MP3, MP4, or WAV.`, 'error');
    return;
  }
  addToast(`Could not play "${track?.title ?? 'this track'}"`, 'error');
}

async function playAudioWithRetry(audio: HTMLMediaElement, src: string): Promise<void> {
  audio.preload = 'auto';
  if (audio.currentSrc !== src) {
    audio.src = src;
    audio.load();
  }

  if (
    audio.ended ||
    (Number.isFinite(audio.duration) && audio.duration > 0 && audio.currentTime >= Math.max(0, audio.duration - 0.35))
  ) {
    try { audio.currentTime = 0; } catch { /* seek failed silently */ }
  }

  try {
    await audio.play();
    return;
  } catch (firstError) {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    await new Promise((resolve) => window.setTimeout(resolve, 80));
    audio.src = src;
    audio.load();
    try {
      await audio.play();
      return;
    } catch {
      throw firstError;
    }
  }
}

async function playTrackSourcesWithFallback(audio: HTMLMediaElement, track: MorbitalTrack | null): Promise<void> {
  // Snapshot the generation at call time. If a newer play starts while we are
  // awaiting, _playGeneration will have advanced — we bail out silently rather
  // than showing an error for the wrong track or mutating state mid-switch.
  const gen = _playGeneration;

  const tried = new Set<string>();
  const trySource = async (src: string) => {
    if (gen !== _playGeneration) return false;
    if (tried.has(src)) return false;
    tried.add(src);
    await playAudioWithRetry(audio, src);
    return true;
  };

  // For definitely-unsupported formats with a prior transcode ready, try that first.
  if (track?.mimeType && !canPlayNatively(track.mimeType) && track.transcodedObjectUrl) {
    try { if (await trySource(track.transcodedObjectUrl)) return; } catch { /* fall through to normal path */ }
  }

  for (const src of getPlayableSources(track)) {
    if (gen !== _playGeneration) return;
    try {
      if (await trySource(src)) return;
    } catch {
      // Try the next local source shape before reporting a real failure.
    }
  }

  if (gen !== _playGeneration) return;
  const fallbackDataUrl = await ensureLocalFallbackDataUrl(track);
  if (gen !== _playGeneration) return;

  if (fallbackDataUrl) {
    try {
      await trySource(fallbackDataUrl);
      return;
    } catch {
      // If the browser still cannot decode the bytes, try local transcoding.
    }
  }

  if (gen !== _playGeneration) return;

  if (track?.sourceType === 'local' && track.mediaKind !== 'video' && track.localFile) {
    usePlayerStore.getState().setConversionStatus(`Converting "${track.title}" locally for this browser...`);
    usePlayerStore.getState().addToast(`Converting "${track.title}" locally for this browser...`, 'info');
    try {
      const transcodedObjectUrl = await transcodeLocalAudioToAac(track);
      if (gen !== _playGeneration) return;
      if (transcodedObjectUrl) {
        usePlayerStore.getState().updateTrack(track.id, {
          transcodedObjectUrl,
          mimeType: 'audio/mp4',
        });
        usePlayerStore.getState().setConversionStatus('');
        await trySource(transcodedObjectUrl);
        return;
      }
    } catch {
      // Fall through to the final compatibility message.
    }
    if (gen !== _playGeneration) return;
    usePlayerStore.getState().setConversionStatus('Local conversion could not finish on this browser. Try opening Open Morbital in Chrome/Safari or convert this file to AAC/MP3.');
  }

  throw new Error('No playable source succeeded.');
}

export function audioTogglePlayback(): Promise<void> {
  const { currentTrack: track, isPlaying } = usePlayerStore.getState();
  if (track?.sourceType === 'youtube') {
    if (isPlaying) pauseEmbedPlayer();
    else playEmbedPlayer();
    return Promise.resolve();
  }
  // Local video: LocalVideoDeck owns playback — just flip isPlaying in the store
  if (track?.sourceType === 'local' && track.mediaKind === 'video') {
    if (!track.objectUrl) { reportMissingSource(track); return Promise.resolve(); }
    usePlayerStore.getState().setIsPlaying(!isPlaying);
    return Promise.resolve();
  }
  // Prefer the sticky shell <audio> element so a concurrent video→audio transition
  // (LocalVideoDeck still mounted) doesn't accidentally target the video element.
  const audio = getShellAudio() ?? getGlobalAudio();
  if (!audio) return Promise.resolve();
  if (!getPlayableSrc(track)) {
    reportMissingSource(track);
    return Promise.resolve();
  }
  if (audio.paused) {
    ensureAudioAnalyser();
    return playTrackSourcesWithFallback(audio, track).catch(() => {
      reportPlaybackFailure(track);
    });
  }
  audio.pause();
  return Promise.resolve();
}

export function audioSeekTo(percent: number): void {
  const track = usePlayerStore.getState().currentTrack;
  if (track?.sourceType === 'youtube') {
    seekEmbedToPercent(percent);
    return;
  }
  const audio = getGlobalAudio();
  if (!audio || !Number.isFinite(audio.duration) || audio.duration === 0) return;
  audio.currentTime = (percent / 100) * audio.duration;
}

export function playTrackNow(track: MorbitalTrack): void {
  usePlayerStore.getState().setCurrentTrack(track);
  if (track.sourceType === 'youtube') {
    usePlayerStore.getState().setIsPlaying(true);
    playEmbedPlayer();
    return;
  }
  pauseEmbedPlayer();
  // Local video: stop hidden audio immediately to prevent echo.
  // LocalVideoDeck owns playback; isPlaying=true signals it to start.
  if (track.sourceType === 'local' && track.mediaKind === 'video') {
    const audio = getGlobalAudio();
    if (audio) { suppressNextPause(); audio.pause(); audio.removeAttribute('src'); audio.load(); }
    if (track.objectUrl) usePlayerStore.getState().setIsPlaying(true);
    return;
  }
  // Prefer the sticky shell <audio> element — getGlobalAudio() may return the
  // video element while LocalVideoDeck is still mounted during a video→audio switch.
  const audio = getShellAudio() ?? getGlobalAudio();
  if (!audio) return;
  const src = getPlayableSrc(track);
  if (!src) {
    reportMissingSource(track);
    return;
  }
  ensureAudioAnalyser();
  setDirectPlaySrc(src);
  // Defense-in-depth: ensure isPlaying=true so the useAudioEngine effect's
  // wasPlaying fallback path can recover if the direct play attempt loses the
  // race (e.g., during a local-video → audio transition while React is still
  // tearing down LocalVideoDeck).
  usePlayerStore.getState().setIsPlaying(true);
  // Resume from saved position (set by setCurrentTrack via recallPosition)
  const { currentTime: resumeAt, duration: savedDuration } = usePlayerStore.getState();
  if (resumeAt > 0) {
    const onMeta = () => {
      const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : savedDuration;
      const safeResumeAt = Number.isFinite(duration) && duration > 0 && resumeAt >= Math.max(0, duration - 0.75)
        ? 0
        : resumeAt;
      try { audio.currentTime = safeResumeAt; } catch { /* seek failed silently */ }
      audio.removeEventListener('loadedmetadata', onMeta);
    };
    audio.addEventListener('loadedmetadata', onMeta);
  }
  const gen = ++_playGeneration;
  void playTrackSourcesWithFallback(audio, track).catch(() => {
    if (gen !== _playGeneration) return;
    setDirectPlaySrc(null);
    reportPlaybackFailure(track);
  });
}

export function useAudioEngine() {
  const audioRef = useRef<HTMLAudioElement>(null);

  const {
    currentTrack,
    isRepeatOn,
    volume,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setUrlStatus,
    playNext,
    addToast,
  } = usePlayerStore();

  useEffect(() => {
    setGlobalAudio(audioRef.current);
    return () => { setGlobalAudio(null); clearStickyAudio(); };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const isLocalVideo = currentTrack?.sourceType === 'local' && currentTrack.mediaKind === 'video';

    if (!currentTrack) {
      setGlobalAudio(audio);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      return;
    }

    if (currentTrack.sourceType === 'youtube' || isLocalVideo) {
      const wantsPlayback = usePlayerStore.getState().isPlaying;
      if (!isLocalVideo) setGlobalAudio(audio);
      // Switching owners must not let the old shell <audio> pause event cancel
      // the new owner's play intent. This was the root of "Next into YouTube
      // stops" and "local track needs another click" during mixed queues.
      if (wantsPlayback || isLocalVideo) suppressNextPause();
      if (currentTrack.sourceType === 'youtube' && wantsPlayback) playEmbedPlayer();
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      return;
    }

    setGlobalAudio(audio);
    const newSrc = getPlayableSrc(currentTrack);
    if (!newSrc) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      setIsPlaying(false);
      return;
    }

    if (getDirectPlaySrc() === newSrc) {
      setDirectPlaySrc(null);
      return;
    }

    audio.src = newSrc;
    audio.load();

    // Resume from the saved per-track position (set when the user previously
    // paused or switched away). Seek before play so the first frames come from
    // the right spot. Browsers defer seek until metadata loads if needed.
    const { currentTime: resumeAt, duration: savedDuration } = usePlayerStore.getState();
    if (resumeAt > 0) {
      const onMeta = () => {
        const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : savedDuration;
        const safeResumeAt = Number.isFinite(duration) && duration > 0 && resumeAt >= Math.max(0, duration - 0.75)
          ? 0
          : resumeAt;
        try { audio.currentTime = safeResumeAt; } catch { /* seek failed silently */ }
        audio.removeEventListener('loadedmetadata', onMeta);
      };
      audio.addEventListener('loadedmetadata', onMeta);
    }

    const wasPlaying = usePlayerStore.getState().isPlaying;
    if (wasPlaying) {
      const gen = ++_playGeneration;
      void playTrackSourcesWithFallback(audio, currentTrack).catch(() => {
        if (gen !== _playGeneration) return;
        if (currentTrack.sourceType === 'url') {
          setUrlStatus('Could not start this URL. Ensure it is a direct audio file URL with CORS access.');
        }
        if (currentTrack.sourceType === 'local') {
          reportPlaybackFailure(currentTrack);
        }
      });
    }
  }, [currentTrack, setIsPlaying, setUrlStatus]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.loop = isRepeatOn;
  }, [isRepeatOn]);

  function handleEnded() {
    clearPosition(usePlayerStore.getState().currentTrack?.id);
    setCurrentTime(0);
    if (!usePlayerStore.getState().isRepeatOn) {
      // onPause fires just before onEnded (browser pauses at track end) and sets
      // isPlaying=false. Re-arm it so the useAudioEngine effect sees wasPlaying=true
      // and auto-starts the next track.
      usePlayerStore.getState().setIsPlaying(true);
      playNext();
    }
  }

  function handleError() {
    const audio = audioRef.current;
    if (!audio || !audio.currentSrc) return;

    setIsPlaying(false);
    const track = usePlayerStore.getState().currentTrack;
    if (track?.sourceType === 'url') {
      setUrlStatus('This URL could not be loaded. The host may block browser access.');
    }
    reportPlaybackFailure(track);
  }

  return {
    audioRef,
    handleEnded,
    handleError,
    setIsPlaying,
    setCurrentTime,
    setDuration,
  };
}
