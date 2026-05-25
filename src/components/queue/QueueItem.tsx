// SPDX-License-Identifier: AGPL-3.0-or-later
import { X } from 'lucide-react';
import type { MorbitalTrack } from '../../store/playerStore';
import { usePlayerStore } from '../../store/playerStore';

function formatDuration(sec?: number): string {
  if (!sec || !Number.isFinite(sec)) return '';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type Props = {
  track: MorbitalTrack;
  index: number;
  isActive: boolean;
  onSelect: () => void;
};

export function QueueItem({ track, index, isActive, onSelect }: Props) {
  const removeTrack = usePlayerStore((s) => s.removeTrack);

  return (
    <div
      className={`sonata-queue-item${isActive ? ' sonata-queue-item--active' : ''}`}
      onClick={onSelect}
    >
      <span className="sonata-queue-item__num">{isActive ? '▶' : index + 1}</span>
      <div className="sonata-queue-item__info">
        <div className="sonata-queue-item__title">{track.title}</div>
        <div className="sonata-queue-item__artist">{track.artist}</div>
      </div>
      {track.duration && (
        <span className="sonata-queue-item__dur">{formatDuration(track.duration)}</span>
      )}
      <button
        className="sonata-queue-item__remove"
        onClick={(e) => { e.stopPropagation(); removeTrack(track.id); }}
        title="Remove from queue"
      >
        <X size={13} />
      </button>
    </div>
  );
}
