// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useMemo, useState } from 'react';
import { usePlayerStore, type MorbitalTrack } from '../../store/playerStore';
import { vaultDb } from './vaultDb';

const REFRESH_MS = 10_000;

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(0)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function getQueueFileKey(track: MorbitalTrack): string | null {
  if (!track.localFile) return null;
  return `${track.fileName}:${track.localFile.size}`;
}

function getQueueFileBytes(queue: MorbitalTrack[]): number {
  const seen = new Set<string>();

  return queue.reduce((total, track) => {
    const key = getQueueFileKey(track);
    if (!key || seen.has(key) || !track.localFile) return total;
    seen.add(key);
    return total + track.localFile.size;
  }, 0);
}

async function getSavedContentBytes(): Promise<number> {
  const [vaultTracks, workspaceFiles] = await Promise.all([
    vaultDb.vault_tracks.toArray(),
    vaultDb.workspace_files.toArray(),
  ]);

  return (
    vaultTracks.reduce((total, track) => total + track.size, 0) +
    workspaceFiles.reduce((total, file) => total + file.size, 0)
  );
}

export function useContentStorage(): string {
  const queue = usePlayerStore((s) => s.queue);
  const [savedBytes, setSavedBytes] = useState(0);
  const queueBytes = useMemo(() => getQueueFileBytes(queue), [queue]);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const bytes = await getSavedContentBytes();
        if (!cancelled) setSavedBytes(bytes);
      } catch {
        if (!cancelled) setSavedBytes(0);
      }
    }

    void refresh();
    const id = setInterval(refresh, REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return formatBytes(queueBytes + savedBytes);
}
