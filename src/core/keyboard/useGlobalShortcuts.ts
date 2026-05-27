// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useState } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import { audioTogglePlayback, audioSeekTo } from '../audio/audioEngine';
import { getGlobalAudio } from '../audio/audioRef';

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

function shiftSeek(deltaSec: number): void {
  const audio = getGlobalAudio();
  if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
  const next = Math.max(0, Math.min(audio.duration, audio.currentTime + deltaSec));
  audioSeekTo((next / audio.duration) * 100);
}

export function useGlobalShortcuts(): {
  helpOpen: boolean;
  setHelpOpen: (v: boolean) => void;
} {
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (helpOpen) {
          setHelpOpen(false);
          e.preventDefault();
        }
        return;
      }

      if (isEditable(e.target)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const store = usePlayerStore.getState();

      switch (e.key) {
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          void audioTogglePlayback();
          return;
        case '?':
          e.preventDefault();
          setHelpOpen((v) => !v);
          return;
        case 'm':
        case 'M':
          e.preventDefault();
          store.toggleMute();
          return;
        case 's':
        case 'S':
          e.preventDefault();
          store.toggleShuffle();
          return;
        case 'r':
        case 'R':
          e.preventDefault();
          store.setRepeatOn(!store.isRepeatOn);
          return;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) shiftSeek(10);
          else store.playNext();
          return;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) shiftSeek(-10);
          else store.playPrevious();
          return;
        case 'ArrowUp':
          e.preventDefault();
          store.setVolume(Math.min(1, store.volume + 0.05));
          return;
        case 'ArrowDown':
          e.preventDefault();
          store.setVolume(Math.max(0, store.volume - 0.05));
          return;
        default:
          return;
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [helpOpen]);

  return { helpOpen, setHelpOpen };
}
