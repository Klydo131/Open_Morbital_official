// SPDX-License-Identifier: AGPL-3.0-or-later
import type { MorbitalTrack } from '../../store/playerStore';

type SessionTrackSnapshot = {
  id: string;
  title: string;
  artist: string;
  album: string;
  fileName: string;
  mimeType?: string;
  sourceUrl?: string;
  sourceUri?: string;
  albumArt?: string;
  sourceType: 'local' | 'url' | 'youtube';
  mediaKind?: 'audio' | 'video';
  duration?: number;
  createdAt: number;
  downloadState?: string;
};

type SessionQueueData = {
  savedAt: number;
  currentTrackId: string | null;
  tracks: SessionTrackSnapshot[];
};

type RestoredSession = {
  tracks: SessionTrackSnapshot[];
  currentTrackId: string | null;
};

const KEY = 'sonata-session-queue-v1';
const TTL_MS = 24 * 60 * 60 * 1000;

export function saveSessionQueue(tracks: MorbitalTrack[], currentTrackId: string | null): void {
  const snapshots: SessionTrackSnapshot[] = tracks.map((t) => ({
    id: t.id,
    title: t.title,
    artist: t.artist,
    album: t.album,
    fileName: t.fileName,
    mimeType: t.mimeType,
    sourceUrl: t.sourceUrl,
    sourceUri: t.sourceUri,
    albumArt: t.albumArt,
    sourceType: t.sourceType,
    mediaKind: t.mediaKind,
    duration: t.duration,
    createdAt: t.createdAt,
    downloadState: t.downloadState,
  }));

  const data: SessionQueueData = {
    savedAt: Date.now(),
    currentTrackId,
    tracks: snapshots,
  };

  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

export function loadSessionQueue(): RestoredSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SessionQueueData;
    if (!data.savedAt || Date.now() - data.savedAt > TTL_MS) return null;
    if (!Array.isArray(data.tracks) || data.tracks.length === 0) return null;
    return { tracks: data.tracks, currentTrackId: data.currentTrackId };
  } catch {
    return null;
  }
}

export function clearSessionQueue(): void {
  localStorage.removeItem(KEY);
}
