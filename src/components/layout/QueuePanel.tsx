// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from 'react';
import { Trash2, Save, FolderOpen, Disc } from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';
import { QueueItem } from '../queue/QueueItem';
import { saveQueueState, loadQueueState } from '../../core/storage/db';
import { ConfirmDialog, shouldSkipConfirm } from '../shared/ConfirmDialog';
import { playTrackNow } from '../../core/audio/audioEngine';

const SKIP_EJECT_KEY = 'sonata-skip-confirm-eject';
const SKIP_CLEAR_KEY = 'sonata-skip-confirm-clear';

export function QueuePanel() {
  const queue = usePlayerStore((s) => s.queue);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const clearQueue = usePlayerStore((s) => s.clearQueue);
  const eject = usePlayerStore((s) => s.eject);
  const addToast = usePlayerStore((s) => s.addToast);

  const [ejectDialogOpen, setEjectDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  function handleEjectClick() {
    if (!currentTrack) return;
    if (shouldSkipConfirm(SKIP_EJECT_KEY)) { eject(); return; }
    setEjectDialogOpen(true);
  }

  function handleClearClick() {
    if (queue.length === 0) return;
    if (shouldSkipConfirm(SKIP_CLEAR_KEY)) { clearQueue(); return; }
    setClearDialogOpen(true);
  }

  async function handleSave() {
    await saveQueueState(queue.map((t) => t.id), currentTrack?.id ?? null);
    addToast('Queue saved', 'success');
  }

  async function handleLoad() {
    const stored = await loadQueueState();
    if (!stored?.trackIds.length) {
      addToast('No saved queue found', 'info');
      return;
    }
    addToast(`Queue loaded (${stored.trackIds.length} tracks)`, 'success');
  }

  return (
    <aside className="sonata-queue">
      <div className="sonata-queue__header">
        <span className="sonata-queue__title">Up Next</span>
        <div className="sonata-queue__actions">
          <button
            className="sonata-btn sonata-btn--ghost sonata-btn--sm"
            onClick={handleEjectClick}
            title="Eject current track"
            disabled={!currentTrack}
          >
            <Disc size={12} />
          </button>
          <button
            className="sonata-btn sonata-btn--ghost sonata-btn--sm"
            onClick={handleClearClick}
            title="Clear entire playlist"
            disabled={queue.length === 0}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="sonata-queue__list">
        {queue.length === 0 ? (
          <p className="sonata-queue__empty">
            Queue is empty.<br />Drop music files or paste a URL to get started.
          </p>
        ) : (
          queue.map((track, index) => (
            <QueueItem
              key={track.id}
              track={track}
              index={index}
              isActive={track.id === currentTrack?.id}
              onSelect={() => playTrackNow(track)}
            />
          ))
        )}
      </div>

      <div className="sonata-queue__footer">
        <button className="sonata-btn sonata-btn--ghost sonata-btn--sm" style={{ flex: 1 }} onClick={handleSave}>
          <Save size={12} />
          Save Queue
        </button>
        <button className="sonata-btn sonata-btn--ghost sonata-btn--sm" style={{ flex: 1 }} onClick={handleLoad}>
          <FolderOpen size={12} />
          Load Queue
        </button>
      </div>

      <ConfirmDialog
        isOpen={ejectDialogOpen}
        title="Eject Track"
        message={`"${currentTrack?.title ?? 'This track'}" will be removed from the playlist and stopped. This cannot be undone.`}
        confirmLabel="Eject"
        variant="warning"
        skipKey={SKIP_EJECT_KEY}
        onConfirm={() => { setEjectDialogOpen(false); eject(); }}
        onCancel={() => setEjectDialogOpen(false)}
      />

      <ConfirmDialog
        isOpen={clearDialogOpen}
        title="Clear Entire Playlist"
        message={`All ${queue.length} track${queue.length !== 1 ? 's' : ''} will be permanently removed from the playlist. This cannot be undone.`}
        confirmLabel="Clear All"
        variant="danger"
        skipKey={SKIP_CLEAR_KEY}
        onConfirm={() => { setClearDialogOpen(false); clearQueue(); }}
        onCancel={() => setClearDialogOpen(false)}
      />
    </aside>
  );
}
