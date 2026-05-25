// SPDX-License-Identifier: AGPL-3.0-or-later
import { create } from 'zustand';
import { deleteTrackRecord, clearAllTrackRecords } from '../core/storage/db';

// Per-track resume positions (in-memory, not in state — avoids re-renders on every
// timeupdate). Each track remembers where it was paused so switching to another
// track and back resumes from the same time.
const _trackPositions = new Map<string, number>();
export function rememberPosition(id: string, t: number, duration?: number): void {
  if (!Number.isFinite(t) || t <= 0) {
    _trackPositions.delete(id);
    return;
  }

  // Never resume from the very end. Short recordings such as MyRec_0515_1351
  // can otherwise appear "dead" on the second play because the app seeks to the
  // last saved second and immediately ends again.
  if (duration != null && Number.isFinite(duration) && duration > 0 && t >= Math.max(0, duration - 0.75)) {
    _trackPositions.delete(id);
    return;
  }

  _trackPositions.set(id, t);
}
export function recallPosition(id: string | undefined): number {
  return id ? (_trackPositions.get(id) ?? 0) : 0;
}
export function clearPosition(id: string | undefined): void {
  if (id) _trackPositions.delete(id);
}

export type SourceType = 'local' | 'url' | 'youtube';
export type MediaKind = 'audio' | 'video';

export type DownloadState = 'none' | 'downloading' | 'downloaded';

export type MorbitalTrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  fileName: string;
  mimeType?: string;
  localFile?: File;
  objectUrl?: string;
  transcodedObjectUrl?: string;
  fallbackDataUrl?: string;
  sourceUrl?: string;
  sourceUri?: string;
  albumArt?: string;
  sourceType: SourceType;
  mediaKind?: MediaKind;
  duration?: number;
  createdAt: number;
  downloadState?: DownloadState;
  needsReAdd?: boolean;
};

export type ToastItem = {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
};

type PlayerState = {
  currentTrack: MorbitalTrack | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isRepeatOn: boolean;
  isShuffleOn: boolean;
  isMuted: boolean;
  queue: MorbitalTrack[];
  originalQueue: MorbitalTrack[];
  volume: number;
  previousVolume: number;
  urlDraft: string;
  urlStatus: string;
  conversionStatus: string;
  toasts: ToastItem[];

  setCurrentTrack: (track: MorbitalTrack) => void;
  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;
  setIsPlaying: (v: boolean) => void;
  setRepeatOn: (v: boolean) => void;
  setVolume: (v: number) => void;
  setUrlDraft: (v: string) => void;
  setUrlStatus: (v: string) => void;
  setConversionStatus: (v: string) => void;
  updateTrack: (id: string, patch: Partial<MorbitalTrack>) => void;
  toggleShuffle: () => void;
  toggleMute: () => void;
  addTracks: (tracks: MorbitalTrack[]) => void;
  removeTrack: (id: string) => void;
  clearQueue: () => void;
  playNext: () => void;
  playPrevious: () => void;
  eject: () => void;
  addToast: (message: string, type: ToastItem['type']) => void;
  removeToast: (id: string) => void;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  isRepeatOn: false,
  isShuffleOn: false,
  isMuted: false,
  queue: [],
  originalQueue: [],
  volume: 0.72,
  previousVolume: 0.72,
  urlDraft: '',
  urlStatus: '',
  conversionStatus: '',
  toasts: [],

  addTracks: (tracks) =>
    set((state) => {
      const existingIds = new Set(state.queue.map((t) => t.id));
      const newTracks = tracks.filter((t) => !existingIds.has(t.id));
      const merged = [...state.queue, ...newTracks];
      return {
        queue: merged,
        originalQueue: state.isShuffleOn ? state.originalQueue : merged,
        currentTrack: state.currentTrack ?? newTracks[0] ?? null,
      };
    }),

  removeTrack: (id) => {
    const track = get().queue.find((t) => t.id === id);
    if (track?.objectUrl) URL.revokeObjectURL(track.objectUrl);
    if (track?.transcodedObjectUrl) URL.revokeObjectURL(track.transcodedObjectUrl);
    void deleteTrackRecord(id);
    set((state) => {
      const queue = state.queue.filter((t) => t.id !== id);
      const originalQueue = state.originalQueue.filter((t) => t.id !== id);
      if (state.currentTrack?.id === id) {
        return {
          queue,
          originalQueue,
          currentTrack: queue[0] ?? null,
          currentTime: 0,
          duration: 0,
          isPlaying: false,
        };
      }
      return { queue, originalQueue };
    });
  },

  clearQueue: () => {
    const { queue } = get();
    queue.forEach((t) => {
      if (t.objectUrl) URL.revokeObjectURL(t.objectUrl);
      if (t.transcodedObjectUrl) URL.revokeObjectURL(t.transcodedObjectUrl);
    });
    void clearAllTrackRecords();
    set({ queue: [], originalQueue: [], currentTrack: null, currentTime: 0, duration: 0, isPlaying: false });
  },

  setCurrentTrack: (track) =>
    set((state) => {
      // Save outgoing track's position before switching
      if (state.currentTrack && state.currentTrack.id !== track.id) {
        rememberPosition(state.currentTrack.id, state.currentTime, state.duration);
      }
      return {
        currentTrack: track,
        currentTime: recallPosition(track.id),
        duration: 0,
        queue: state.queue.some((t) => t.id === track.id) ? state.queue : [...state.queue, track],
        originalQueue: state.originalQueue.some((t) => t.id === track.id)
          ? state.originalQueue
          : [...state.originalQueue, track],
      };
    }),

  setCurrentTime: (currentTime) => {
    const cur = get().currentTrack;
    if (cur) rememberPosition(cur.id, currentTime, get().duration);
    set({ currentTime });
  },
  setDuration: (duration) => set({ duration }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setRepeatOn: (isRepeatOn) => set({ isRepeatOn }),

  updateTrack: (id, patch) =>
    set((state) => {
      const mergeTrack = (track: MorbitalTrack) => (track.id === id ? { ...track, ...patch } : track);
      return {
        queue: state.queue.map(mergeTrack),
        originalQueue: state.originalQueue.map(mergeTrack),
        currentTrack: state.currentTrack?.id === id ? mergeTrack(state.currentTrack) : state.currentTrack,
      };
    }),

  toggleShuffle: () => {
    const { isShuffleOn, queue, currentTrack, originalQueue } = get();
    if (!isShuffleOn) {
      const shuffled = [...queue];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      if (currentTrack) {
        const idx = shuffled.findIndex((t) => t.id === currentTrack.id);
        if (idx > 0) { shuffled.splice(idx, 1); shuffled.unshift(currentTrack); }
      }
      set({ isShuffleOn: true, originalQueue: queue, queue: shuffled });
    } else {
      set({ isShuffleOn: false, queue: originalQueue });
    }
  },

  toggleMute: () => {
    const { isMuted, volume, previousVolume } = get();
    if (isMuted) {
      set({ isMuted: false, volume: previousVolume > 0 ? previousVolume : 0.72 });
    } else {
      set({ isMuted: true, previousVolume: volume, volume: 0 });
    }
  },

  setUrlDraft: (urlDraft) => set({ urlDraft }),
  setUrlStatus: (urlStatus) => set({ urlStatus }),
  setConversionStatus: (conversionStatus) => set({ conversionStatus }),
  setVolume: (volume) => set({ volume }),

  playNext: () => {
    const { queue, currentTrack, currentTime } = get();
    const index = queue.findIndex((t) => t.id === currentTrack?.id);
    const next = queue[index + 1] ?? queue[0];
    if (!next) return;
    if (currentTrack && currentTrack.id !== next.id) rememberPosition(currentTrack.id, currentTime, get().duration);
    set({
      currentTrack: next,
      currentTime: recallPosition(next.id),
      duration: 0,
      isPlaying: true,
    });
  },

  playPrevious: () => {
    const { queue, currentTrack, currentTime } = get();
    const index = queue.findIndex((t) => t.id === currentTrack?.id);
    const prev = queue[index - 1] ?? queue[queue.length - 1];
    if (!prev) return;
    if (currentTrack && currentTrack.id !== prev.id) rememberPosition(currentTrack.id, currentTime, get().duration);
    set({
      currentTrack: prev,
      currentTime: recallPosition(prev.id),
      duration: 0,
      isPlaying: true,
    });
  },

  eject: () => {
    const { currentTrack, queue, originalQueue } = get();
    if (!currentTrack) return;
    if (currentTrack.objectUrl) URL.revokeObjectURL(currentTrack.objectUrl);
    if (currentTrack.transcodedObjectUrl) URL.revokeObjectURL(currentTrack.transcodedObjectUrl);
    void deleteTrackRecord(currentTrack.id);
    const newQueue = queue.filter((t) => t.id !== currentTrack.id);
    const newOriginalQueue = originalQueue.filter((t) => t.id !== currentTrack.id);
    set({
      currentTrack: null,
      queue: newQueue,
      originalQueue: newOriginalQueue,
      currentTime: 0,
      duration: 0,
      isPlaying: false,
    });
  },

  addToast: (message, type) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts.slice(-2), { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 4000);
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
