// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import { audioTogglePlayback } from './audioEngine';

export function useMediaSession(): void {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playNext = usePlayerStore((s) => s.playNext);
  const playPrevious = usePlayerStore((s) => s.playPrevious);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (!currentTrack) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title:  currentTrack.title  || 'Unknown title',
      artist: currentTrack.artist || 'Unknown artist',
      album:  currentTrack.album  || '',
      artwork: currentTrack.albumArt
        ? [{ src: currentTrack.albumArt, sizes: '512x512', type: 'image/png' }]
        : [],
    });

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const handlers: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
      ['play',         () => audioTogglePlayback()],
      ['pause',        () => audioTogglePlayback()],
      ['nexttrack',    () => playNext()],
      ['previoustrack',() => playPrevious()],
    ];

    handlers.forEach(([action, handler]) => {
      try { navigator.mediaSession.setActionHandler(action, handler); }
      catch { /* unsupported action — ignore */ }
    });

    return () => {
      handlers.forEach(([action]) => {
        try { navigator.mediaSession.setActionHandler(action, null); }
        catch { /* ignore */ }
      });
    };
  }, [playNext, playPrevious]);
}
