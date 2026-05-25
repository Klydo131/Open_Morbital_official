// SPDX-License-Identifier: AGPL-3.0-or-later
import Dexie, { type Table } from 'dexie';

export type StoredTrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  fileName: string;
  sourceType: 'local' | 'url';
  sourceUrl?: string;
  blob?: Blob;
  mimeType?: string;
  albumArt?: string;
  duration?: number;
  createdAt: number;
};

export type StoredPlayerState = {
  key: string;
  value: unknown;
};

export type StoredPlaylist = {
  id: string;
  name: string;
  trackIds: string[];
  trackSnapshots?: StoredPlaylistTrack[];
  createdAt: number;
  updatedAt: number;
};

export type StoredPlaylistTrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  fileName: string;
  sourceType: 'local' | 'url' | 'youtube';
  sourceUrl?: string;
  albumArt?: string;
  duration?: number;
  mediaKind?: 'audio' | 'video';
  mimeType?: string;
};

export type StoredQueue = {
  key: 'current';
  trackIds: string[];
  currentTrackId: string | null;
};

class MorbitalDatabase extends Dexie {
  tracks!: Table<StoredTrack, string>;
  playerState!: Table<StoredPlayerState, string>;
  playlists!: Table<StoredPlaylist, string>;
  queue!: Table<StoredQueue, string>;

  constructor() {
    super('sonata-v1-4');
    this.version(1).stores({
      tracks: 'id, title, artist, sourceType, createdAt',
      playerState: 'key',
      playlists: 'id, name, createdAt',
      queue: 'key',
    });
  }
}

export const morbitalDb = new MorbitalDatabase();

/* ── Tracks ─────────────────────────────────── */

export async function saveTrack(track: StoredTrack): Promise<void> {
  await morbitalDb.tracks.put(track);
}

export async function loadAllTracks(): Promise<StoredTrack[]> {
  return morbitalDb.tracks.orderBy('createdAt').toArray();
}

export async function deleteTrackRecord(id: string): Promise<void> {
  await morbitalDb.tracks.delete(id);
}

export async function clearAllTrackRecords(): Promise<void> {
  await morbitalDb.tracks.clear();
}

/* ── Player state ────────────────────────────── */

export async function saveStateEntry(key: string, value: unknown): Promise<void> {
  await morbitalDb.playerState.put({ key, value });
}

export async function loadStateEntry(key: string): Promise<unknown> {
  const row = await morbitalDb.playerState.get(key);
  return row?.value;
}

/* ── Playlists ────────────────────────────────── */

export async function loadAllPlaylists(): Promise<StoredPlaylist[]> {
  return morbitalDb.playlists.orderBy('createdAt').toArray();
}

export async function savePlaylist(playlist: StoredPlaylist): Promise<void> {
  await morbitalDb.playlists.put(playlist);
}

export async function deletePlaylist(id: string): Promise<void> {
  await morbitalDb.playlists.delete(id);
}

/* ── Queue ────────────────────────────────────── */

export async function saveQueueState(trackIds: string[], currentTrackId: string | null): Promise<void> {
  await morbitalDb.queue.put({ key: 'current', trackIds, currentTrackId });
}

export async function loadQueueState(): Promise<StoredQueue | undefined> {
  return morbitalDb.queue.get('current');
}

/* ── Nuke all ────────────────────────────────── */

export async function clearAllData(): Promise<void> {
  await Promise.all([
    morbitalDb.tracks.clear(),
    morbitalDb.playerState.clear(),
    morbitalDb.playlists.clear(),
    morbitalDb.queue.clear(),
  ]);
}
