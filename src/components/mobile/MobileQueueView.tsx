// SPDX-License-Identifier: AGPL-3.0-or-later
import { Trash2 } from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';
import { QueueItem } from '../queue/QueueItem';
import { playTrackNow } from '../../core/audio/audioEngine';

export function MobileQueueView() {
  const queue = usePlayerStore((s) => s.queue);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const clearQueue = usePlayerStore((s) => s.clearQueue);
  const { setMobileActiveTab } = useUIStore();

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span className="sonata-queue__title">Queue ({queue.length})</span>
        {queue.length > 0 && (
          <button className="sonata-btn sonata-btn--ghost sonata-btn--sm" onClick={clearQueue}>
            <Trash2 size={13} />
            Clear
          </button>
        )}
      </div>

      {queue.length === 0 ? (
        <p className="sonata-queue__empty">Queue is empty. Add music from the Library tab.</p>
      ) : (
        queue.map((track, index) => (
          <QueueItem
            key={track.id}
            track={track}
            index={index}
            isActive={track.id === currentTrack?.id}
            onSelect={() => { playTrackNow(track); setMobileActiveTab('player'); }}
          />
        ))
      )}
    </div>
  );
}
