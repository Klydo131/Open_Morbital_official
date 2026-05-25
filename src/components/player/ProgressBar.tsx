// SPDX-License-Identifier: AGPL-3.0-or-later
import { useCallback, useRef } from 'react';
import { usePlayerStore } from '../../store/playerStore';

type Props = {
  onSeek: (percent: number) => void;
};

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ProgressBar({ onSeek }: Props) {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const isDragging = useRef(false);
  const barRef = useRef<HTMLDivElement>(null);

  const pct = Number.isFinite(duration) && duration > 0 ? (currentTime / duration) * 100 : 0;

  const getPercent = useCallback((e: React.PointerEvent<HTMLDivElement>): number => {
    const rect = barRef.current!.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    return (x / rect.width) * 100;
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.dataset.dragging = 'true';
      isDragging.current = true;
      onSeek(getPercent(e));
    },
    [onSeek, getPercent],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return;
      onSeek(getPercent(e));
    },
    [onSeek, getPercent],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    delete e.currentTarget.dataset.dragging;
  }, []);

  return (
    <div className="sonata-progress">
      <div
        ref={barRef}
        className="sonata-progress__bar-wrap"
        role="slider"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="sonata-progress__fill" style={{ width: `${pct}%` }} />
        <div className="sonata-progress__thumb" style={{ left: `${pct}%` }} />
      </div>
      <div className="sonata-progress__times">
        <span className="mono">{formatTime(currentTime)}</span>
        <span className="mono">{formatTime(duration)}</span>
      </div>
    </div>
  );
}
