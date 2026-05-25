// SPDX-License-Identifier: AGPL-3.0-or-later
import { create } from 'zustand';
import { vaultDb, type VaultTrack, type VaultPlaylist, type WorkspaceFile, type WorkspaceFolder } from '../core/storage/vaultDb';
import type { MorbitalTrack } from './playerStore';

type VaultState = {
  vaultTracks: VaultTrack[];
  vaultPlaylists: VaultPlaylist[];
  workspaceFiles: WorkspaceFile[];
  workspaceFolders: WorkspaceFolder[];
  initialized: boolean;
};

type VaultActions = {
  init: () => Promise<void>;
  saveTrackToVault: (track: MorbitalTrack) => Promise<void>;
  saveFilesToVault: (files: File[]) => Promise<VaultTrack[]>;
  removeVaultTrack: (id: string) => Promise<void>;
  createPlaylist: (name: string, trackIds?: string[]) => Promise<VaultPlaylist>;
  renamePlaylist: (id: string, name: string) => Promise<void>;
  addTracksToPlaylist: (playlistId: string, trackIds: string[]) => Promise<void>;
  removeFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  saveFileToWorkspace: (file: File, folderId?: string) => Promise<void>;
  deleteWorkspaceFile: (id: string) => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
};

const AUDIO_EXTS = new Set(['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg', '.opus', '.webm', '.alac']);
const VIDEO_EXTS = new Set(['.mp4', '.webm', '.mkv', '.mov', '.avi']);

function detectMediaKind(fileName: string, mimeType: string): 'audio' | 'video' {
  const ext = fileName.toLowerCase().match(/\.[^.]+$/)?.[0] ?? '';
  if (VIDEO_EXTS.has(ext) || mimeType.startsWith('video/')) return 'video';
  if (AUDIO_EXTS.has(ext) || mimeType.startsWith('audio/')) return 'audio';
  return 'audio';
}

export const useVaultStore = create<VaultState & VaultActions>((set, get) => ({
  vaultTracks: [],
  vaultPlaylists: [],
  workspaceFiles: [],
  workspaceFolders: [],
  initialized: false,

  init: async () => {
    if (get().initialized) return;
    const [vaultTracks, vaultPlaylists, workspaceFiles, workspaceFolders] = await Promise.all([
      vaultDb.vault_tracks.orderBy('addedAt').reverse().toArray(),
      vaultDb.vault_playlists.orderBy('createdAt').toArray(),
      vaultDb.workspace_files.orderBy('addedAt').reverse().toArray(),
      vaultDb.workspace_folders.orderBy('createdAt').toArray(),
    ]);
    set({ vaultTracks, vaultPlaylists, workspaceFiles, workspaceFolders, initialized: true });
  },

  saveTrackToVault: async (track: MorbitalTrack) => {
    let blob: Blob;
    if (track.localFile) {
      blob = track.localFile;
    } else if (track.objectUrl) {
      const resp = await fetch(track.objectUrl);
      blob = await resp.blob();
    } else {
      throw new Error('No file source available to save to Vault.');
    }

    const existing = get().vaultTracks.find((t) => t.id === track.id || t.fileName === track.fileName);
    if (existing) return;

    const vaultTrack: VaultTrack = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      fileName: track.fileName,
      blob,
      mimeType: track.mimeType ?? (blob.type || 'audio/mpeg'),
      albumArt: track.albumArt,
      mediaKind: track.mediaKind ?? 'audio',
      duration: track.duration,
      size: blob.size,
      addedAt: Date.now(),
    };

    const estimate = await navigator.storage?.estimate?.() ?? {};
    const used = estimate.usage ?? 0;
    const quota = estimate.quota ?? Infinity;
    if (used + blob.size > quota * 0.9) {
      throw new Error('Storage almost full — free up space before saving more tracks.');
    }

    await vaultDb.vault_tracks.put(vaultTrack);
    set((s) => ({ vaultTracks: [vaultTrack, ...s.vaultTracks] }));
  },

  saveFilesToVault: async (files: File[]) => {
    const saved: VaultTrack[] = [];
    const existing = new Set(get().vaultTracks.map((t) => t.fileName));

    for (const file of files) {
      if (existing.has(file.name)) continue;

      const estimate = await navigator.storage?.estimate?.() ?? {};
      const used = estimate.usage ?? 0;
      const quota = estimate.quota ?? Infinity;
      if (used + file.size > quota * 0.9) {
        throw new Error(`Storage almost full — could not save "${file.name}". Free up space and try again.`);
      }

      const mimeType = file.type || 'application/octet-stream';
      const mediaKind = detectMediaKind(file.name, mimeType);
      const track: VaultTrack = {
        id: crypto.randomUUID(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Local file',
        album: 'Unknown Album',
        fileName: file.name,
        blob: file,
        mimeType,
        mediaKind,
        size: file.size,
        addedAt: Date.now(),
      };
      await vaultDb.vault_tracks.put(track);
      saved.push(track);
      existing.add(file.name);
    }

    if (saved.length > 0) {
      set((s) => ({ vaultTracks: [...saved, ...s.vaultTracks] }));
    }
    return saved;
  },

  removeVaultTrack: async (id: string) => {
    await vaultDb.vault_tracks.delete(id);
    const updatedPlaylists = get().vaultPlaylists.map((pl) =>
      pl.trackIds.includes(id)
        ? { ...pl, trackIds: pl.trackIds.filter((tid) => tid !== id), updatedAt: Date.now() }
        : pl,
    );
    await Promise.all(
      updatedPlaylists
        .filter((pl) => pl.trackIds !== get().vaultPlaylists.find((p) => p.id === pl.id)?.trackIds)
        .map((pl) => vaultDb.vault_playlists.put(pl)),
    );
    set((s) => ({
      vaultTracks: s.vaultTracks.filter((t) => t.id !== id),
      vaultPlaylists: updatedPlaylists,
    }));
  },

  createPlaylist: async (name: string, trackIds: string[] = []) => {
    const playlist: VaultPlaylist = {
      id: crypto.randomUUID(),
      name: name.trim() || 'New Playlist',
      trackIds,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await vaultDb.vault_playlists.put(playlist);
    set((s) => ({ vaultPlaylists: [...s.vaultPlaylists, playlist] }));
    return playlist;
  },

  renamePlaylist: async (id: string, name: string) => {
    const playlists = get().vaultPlaylists.map((pl) =>
      pl.id === id ? { ...pl, name: name.trim() || pl.name, updatedAt: Date.now() } : pl,
    );
    const updated = playlists.find((pl) => pl.id === id);
    if (updated) await vaultDb.vault_playlists.put(updated);
    set({ vaultPlaylists: playlists });
  },

  addTracksToPlaylist: async (playlistId: string, trackIds: string[]) => {
    const pl = get().vaultPlaylists.find((p) => p.id === playlistId);
    if (!pl) return;
    const newIds = [...new Set([...pl.trackIds, ...trackIds])];
    const updated = { ...pl, trackIds: newIds, updatedAt: Date.now() };
    await vaultDb.vault_playlists.put(updated);
    set((s) => ({ vaultPlaylists: s.vaultPlaylists.map((p) => (p.id === playlistId ? updated : p)) }));
  },

  removeFromPlaylist: async (playlistId: string, trackId: string) => {
    const pl = get().vaultPlaylists.find((p) => p.id === playlistId);
    if (!pl) return;
    const updated = { ...pl, trackIds: pl.trackIds.filter((id) => id !== trackId), updatedAt: Date.now() };
    await vaultDb.vault_playlists.put(updated);
    set((s) => ({ vaultPlaylists: s.vaultPlaylists.map((p) => (p.id === playlistId ? updated : p)) }));
  },

  deletePlaylist: async (id: string) => {
    await vaultDb.vault_playlists.delete(id);
    set((s) => ({ vaultPlaylists: s.vaultPlaylists.filter((pl) => pl.id !== id) }));
  },

  saveFileToWorkspace: async (file: File, folderId?: string) => {
    const wsFile: WorkspaceFile = {
      id: crypto.randomUUID(),
      name: file.name,
      blob: file,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      addedAt: Date.now(),
      folderId,
    };
    await vaultDb.workspace_files.put(wsFile);
    set((s) => ({ workspaceFiles: [wsFile, ...s.workspaceFiles] }));
  },

  deleteWorkspaceFile: async (id: string) => {
    await vaultDb.workspace_files.delete(id);
    set((s) => ({ workspaceFiles: s.workspaceFiles.filter((f) => f.id !== id) }));
  },

  createFolder: async (name: string) => {
    const folder: WorkspaceFolder = {
      id: crypto.randomUUID(),
      name: name.trim() || 'New Folder',
      createdAt: Date.now(),
    };
    await vaultDb.workspace_folders.put(folder);
    set((s) => ({ workspaceFolders: [...s.workspaceFolders, folder] }));
  },

  deleteFolder: async (id: string) => {
    await vaultDb.workspace_folders.delete(id);
    const updated = get().workspaceFiles.map((f) =>
      f.folderId === id ? { ...f, folderId: undefined } : f,
    );
    await Promise.all(
      updated.filter((f) => !f.folderId && get().workspaceFiles.find((orig) => orig.id === f.id)?.folderId === id)
        .map((f) => vaultDb.workspace_files.put(f)),
    );
    set((s) => ({
      workspaceFolders: s.workspaceFolders.filter((f) => f.id !== id),
      workspaceFiles: updated,
    }));
  },
}));
