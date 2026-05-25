// SPDX-License-Identifier: AGPL-3.0-or-later
import Dexie, { type Table } from 'dexie';

export type VaultTrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  fileName: string;
  blob: Blob;
  mimeType: string;
  albumArt?: string;
  mediaKind: 'audio' | 'video';
  duration?: number;
  size: number;
  addedAt: number;
};

export type VaultPlaylist = {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
};

export type WorkspaceFile = {
  id: string;
  name: string;
  blob: Blob;
  mimeType: string;
  size: number;
  addedAt: number;
  folderId?: string;
};

export type WorkspaceFolder = {
  id: string;
  name: string;
  createdAt: number;
};

class VaultDatabase extends Dexie {
  vault_tracks!: Table<VaultTrack, string>;
  vault_playlists!: Table<VaultPlaylist, string>;
  workspace_files!: Table<WorkspaceFile, string>;
  workspace_folders!: Table<WorkspaceFolder, string>;

  constructor() {
    super('sonata-vault');
    this.version(1).stores({
      vault_tracks: 'id, title, artist, mediaKind, addedAt',
      vault_playlists: 'id, name, createdAt',
      workspace_files: 'id, name, mimeType, addedAt, folderId',
      workspace_folders: 'id, name, createdAt',
    });
  }
}

export const vaultDb = new VaultDatabase();

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
