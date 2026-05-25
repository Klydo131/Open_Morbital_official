// SPDX-License-Identifier: AGPL-3.0-or-later
import { vaultDb } from '../storage/vaultDb';
import { usePlayerStore, type MorbitalTrack } from '../../store/playerStore';

export async function downloadTrackForOffline(track: MorbitalTrack): Promise<void> {
  if (!track.sourceUrl || track.sourceType !== 'url') return;
  if (track.downloadState === 'downloading' || track.downloadState === 'downloaded') return;

  const { updateTrack, setConversionStatus, addToast } = usePlayerStore.getState();

  updateTrack(track.id, { downloadState: 'downloading' });
  setConversionStatus(`Downloading "${track.title}"…`);

  try {
    const estimate = await navigator.storage?.estimate?.() ?? {};
    const used = (estimate.usage ?? 0);
    const quota = (estimate.quota ?? Infinity);

    const response = await fetch(track.sourceUrl, { mode: 'cors' });
    if (!response.ok) throw new Error(`Server returned ${response.status}`);

    const blob = await response.blob();

    if (used + blob.size > quota * 0.9) {
      throw new Error('Not enough storage space to save this track.');
    }

    // Revoke any previous objectUrl for this track before creating a new one
    if (track.objectUrl) URL.revokeObjectURL(track.objectUrl);
    const objectUrl = URL.createObjectURL(blob);

    updateTrack(track.id, { objectUrl, downloadState: 'downloaded' });

    // Persist blob to Vault so it survives page reloads
    const existing = await vaultDb.vault_tracks.get(track.id);
    if (!existing) {
      await vaultDb.vault_tracks.put({
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        fileName: track.fileName,
        blob,
        mimeType: blob.type || track.mimeType || 'audio/mpeg',
        mediaKind: track.mediaKind ?? 'audio',
        duration: track.duration,
        size: blob.size,
        addedAt: Date.now(),
      });
    }

    setConversionStatus('');
    addToast(`"${track.title}" saved for offline playback`, 'success');
  } catch (err) {
    updateTrack(track.id, { downloadState: 'none' });
    setConversionStatus('');
    const msg = err instanceof Error ? err.message : 'Download failed';
    // CORS is the most common failure for direct URL downloads
    const hint = msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('cors')
      ? '. The host may block direct downloads.'
      : `. ${msg}`;
    addToast(`Could not download "${track.title}"${hint}`, 'error');
  }
}
