// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import { saveStateEntry, saveQueueState } from '../storage/db';
import { saveSessionQueue } from '../storage/sessionQueue';

export function usePersistence() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const queue = usePlayerStore((s) => s.queue);
  const volume = usePlayerStore((s) => s.volume);
  const isRepeatOn = usePlayerStore((s) => s.isRepeatOn);
  const isShuffleOn = usePlayerStore((s) => s.isShuffleOn);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void saveStateEntry('lastTrackId', currentTrack?.id ?? null);
      void saveStateEntry('volume', volume);
      void saveStateEntry('isRepeatOn', isRepeatOn);
      void saveStateEntry('isShuffleOn', isShuffleOn);
      void saveQueueState(
        queue.map((t) => t.id),
        currentTrack?.id ?? null,
      );
      saveSessionQueue(queue, currentTrack?.id ?? null);
    }, 600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [currentTrack, queue, volume, isRepeatOn, isShuffleOn]);
}
