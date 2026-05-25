// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useMemo, useState } from 'react';
import { HelpCircle, Play, Plus, Trash2 } from 'lucide-react';
import { usePlayerStore, type MorbitalTrack } from '../../store/playerStore';
import {
  deletePlaylist,
  loadAllPlaylists,
  savePlaylist,
  type StoredPlaylist,
  type StoredPlaylistTrack,
} from '../../core/storage/db';
import { vaultDb, type VaultTrack } from '../../core/storage/vaultDb';
import { playTrackNow } from '../../core/audio/audioEngine';

function snapshotTrack(track: MorbitalTrack): StoredPlaylistTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    album: track.album,
    fileName: track.fileName,
    sourceType: track.sourceType,
    sourceUrl: track.sourceUrl,
    albumArt: track.albumArt,
    duration: track.duration,
    mediaKind: track.mediaKind,
    mimeType: track.mimeType,
  };
}

function cloneSessionTrack(track: MorbitalTrack): MorbitalTrack {
  if (track.localFile) {
    return {
      ...track,
      objectUrl: URL.createObjectURL(track.localFile),
      transcodedObjectUrl: undefined,
    };
  }
  return { ...track };
}

function trackFromVault(vaultTrack: VaultTrack): MorbitalTrack {
  return {
    id: vaultTrack.id,
    title: vaultTrack.title,
    artist: vaultTrack.artist,
    album: vaultTrack.album,
    fileName: vaultTrack.fileName,
    mimeType: vaultTrack.mimeType,
    objectUrl: URL.createObjectURL(vaultTrack.blob),
    albumArt: vaultTrack.albumArt,
    sourceType: 'local',
    mediaKind: vaultTrack.mediaKind,
    duration: vaultTrack.duration,
    createdAt: vaultTrack.addedAt,
  };
}

function trackFromSnapshot(snapshot: StoredPlaylistTrack): MorbitalTrack | null {
  if (!snapshot.sourceUrl || snapshot.sourceType === 'local') return null;
  return {
    id: snapshot.id,
    title: snapshot.title,
    artist: snapshot.artist,
    album: snapshot.album,
    fileName: snapshot.fileName,
    mimeType: snapshot.mimeType,
    sourceUrl: snapshot.sourceUrl,
    albumArt: snapshot.albumArt,
    sourceType: snapshot.sourceType,
    mediaKind: snapshot.mediaKind ?? (snapshot.sourceType === 'youtube' ? 'video' : 'audio'),
    duration: snapshot.duration,
    createdAt: Date.now(),
  };
}

function getPlaylistEntries(playlist: StoredPlaylist): StoredPlaylistTrack[] {
  if (playlist.trackSnapshots?.length) return playlist.trackSnapshots;
  return playlist.trackIds.map((id) => ({
    id,
    title: id,
    artist: 'Unknown artist',
    album: 'Unknown album',
    fileName: id,
    sourceType: 'local',
  }));
}

export function PlaylistsRoute() {
  const [playlists, setPlaylists] = useState<StoredPlaylist[]>([]);
  const [newName, setNewName] = useState('');
  const [showTutorial, setShowTutorial] = useState(
    () => localStorage.getItem('sonata-playlist-tutorial-dismissed') !== 'yes',
  );
  const [loadStatus, setLoadStatus] = useState('');

  const queue = usePlayerStore((s) => s.queue);
  const addTracks = usePlayerStore((s) => s.addTracks);
  const clearQueue = usePlayerStore((s) => s.clearQueue);
  const addToast = usePlayerStore((s) => s.addToast);

  const queueHasTemporaryLocalFiles = useMemo(
    () => queue.some((track) => track.sourceType === 'local' && track.localFile),
    [queue],
  );

  useEffect(() => {
    loadAllPlaylists().then(setPlaylists).catch(console.error);
  }, []);

  function dismissTutorial() {
    localStorage.setItem('sonata-playlist-tutorial-dismissed', 'yes');
    setShowTutorial(false);
  }

  async function createPlaylist() {
    const name = newName.trim();
    if (!name) {
      addToast('Name your playlist first', 'info');
      return;
    }
    if (queue.length === 0) {
      addToast('Add tracks to the queue before saving a playlist', 'info');
      return;
    }

    const playlist: StoredPlaylist = {
      id: crypto.randomUUID(),
      name,
      trackIds: queue.map((track) => track.id),
      trackSnapshots: queue.map(snapshotTrack),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await savePlaylist(playlist);
    setPlaylists((prev) => [...prev, playlist]);
    setNewName('');
    setLoadStatus('');
    addToast(`Playlist "${name}" saved`, 'success');
  }

  async function loadPlaylist(playlist: StoredPlaylist) {
    const entries = getPlaylistEntries(playlist);
    const currentQueue = usePlayerStore.getState().queue;
    const currentById = new Map(currentQueue.map((track) => [track.id, track]));
    const vaultTracks = await vaultDb.vault_tracks.toArray();
    const vaultById = new Map(vaultTracks.map((track) => [track.id, track]));
    const vaultByFileName = new Map(vaultTracks.map((track) => [track.fileName, track]));

    const nextQueue: MorbitalTrack[] = [];
    const missing: StoredPlaylistTrack[] = [];

    for (const entry of entries) {
      const sessionTrack = currentById.get(entry.id);
      if (sessionTrack) {
        nextQueue.push(cloneSessionTrack(sessionTrack));
        continue;
      }

      const vaultTrack = vaultById.get(entry.id) ?? vaultByFileName.get(entry.fileName);
      if (vaultTrack) {
        nextQueue.push(trackFromVault(vaultTrack));
        continue;
      }

      const sourceTrack = trackFromSnapshot(entry);
      if (sourceTrack) {
        nextQueue.push(sourceTrack);
        continue;
      }

      missing.push(entry);
    }

    if (nextQueue.length === 0) {
      setLoadStatus(`"${playlist.name}" could not load. Re-add the local files or save them to Pod first.`);
      addToast('Playlist tracks need to be re-added or saved to Pod', 'error');
      return;
    }

    clearQueue();
    addTracks(nextQueue);
    playTrackNow(nextQueue[0]);

    const missingMessage = missing.length
      ? ` ${missing.length} local track${missing.length === 1 ? '' : 's'} need to be re-added or saved to Pod.`
      : '';
    setLoadStatus(`Loaded "${playlist.name}" with ${nextQueue.length} track${nextQueue.length === 1 ? '' : 's'}.${missingMessage}`);
    addToast(`Loaded "${playlist.name}"`, missing.length ? 'info' : 'success');
  }

  async function removePlaylist(id: string) {
    await deletePlaylist(id);
    setPlaylists((prev) => prev.filter((playlist) => playlist.id !== id));
    setLoadStatus('');
    addToast('Playlist deleted', 'info');
  }

  return (
    <div className="sonata-route">
      <div className="sonata-route__header sonata-playlist-header">
        <div>
          <div className="sonata-route__title">Playlists</div>
          <div className="sonata-route__sub">{playlists.length} playlist{playlists.length !== 1 ? 's' : ''} saved</div>
        </div>
        <button className="sonata-btn sonata-btn--ghost sonata-btn--sm" onClick={() => setShowTutorial((open) => !open)}>
          <HelpCircle size={13} />
          Guide
        </button>
      </div>

      {showTutorial && (
        <section className="sonata-playlist-guide">
          <div className="sonata-playlist-guide__header">
            <strong>How playlists work</strong>
            <button className="sonata-playlist-guide__close" onClick={dismissTutorial}>Dismiss</button>
          </div>
          <div className="sonata-playlist-guide__steps">
            <p><span>1</span>Add tracks to Up Next from local files, URLs, YouTube, or Pod.</p>
            <p><span>2</span>Name the mix, then choose Save as Playlist.</p>
            <p><span>3</span>Press the play button on a saved playlist to rebuild the queue and start the first available track.</p>
          </div>
          <p className="sonata-playlist-guide__tip">
            Local files added only to the queue are temporary browser files. Save them to Pod if you want playlists to reload after closing Open Morbital.
          </p>
        </section>
      )}

      <div className="sonata-playlist-save-row">
        <input
          className="sonata-input"
          type="text"
          placeholder="New playlist name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void createPlaylist(); }}
        />
        <button
          className="sonata-btn sonata-btn--primary sonata-btn--sm sonata-playlist-save-row__btn"
          onClick={() => void createPlaylist()}
          disabled={!newName.trim() || queue.length === 0}
        >
          <Plus size={14} />
          Save as Playlist
        </button>
      </div>

      {queue.length === 0 && (
        <p className="sonata-playlist-hint">Add tracks to the queue before saving a playlist.</p>
      )}
      {queueHasTemporaryLocalFiles && (
        <p className="sonata-playlist-hint sonata-playlist-hint--warn">
          Some queued local files are temporary. Save them to Pod for playlists that survive reloads.
        </p>
      )}
      {loadStatus && <p className="sonata-playlist-load-status">{loadStatus}</p>}

      {playlists.length === 0 ? (
        <p className="sonata-playlist-empty">
          No playlists yet. Build a queue, then save it as a playlist.
        </p>
      ) : (
        <div className="sonata-playlist-list">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="sonata-playlist-card">
              <div>
                <div className="sonata-playlist-card__name">{playlist.name}</div>
                <div className="sonata-playlist-card__count">
                  {playlist.trackIds.length} track{playlist.trackIds.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="sonata-playlist-card__actions">
                <button
                  className="sonata-btn sonata-btn--ghost sonata-btn--sm"
                  title="Load and play playlist"
                  onClick={() => void loadPlaylist(playlist)}
                >
                  <Play size={13} />
                </button>
                <button
                  className="sonata-btn sonata-btn--ghost sonata-btn--sm"
                  title="Delete playlist"
                  onClick={() => void removePlaylist(playlist.id)}
                  style={{ color: 'var(--sonata-pink)' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
