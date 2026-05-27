// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { readAudioLevels } from '../../core/audio/audioAnalyser';
import { usePlayerStore } from '../../store/playerStore';

function formatTime(secs: number): string {
  if (!isFinite(secs) || secs < 0) return '--:--';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function MiniAudioVisualizer({ isPlaying }: { isPlaying: boolean }) {
  const idleSeeds = useMemo(
    () => Array.from({ length: 32 }, (_, index) => 0.16 + ((index * 7) % 13) / 100),
    [],
  );
  const [levels, setLevels] = useState(idleSeeds);

  useEffect(() => {
    let frame = 0;
    let raf = 0;

    function animate() {
      frame += 1;
      if (isPlaying) {
        const next = readAudioLevels();
        const hasSignal = next.some((level) => level > 0.035);
        setLevels((previous) => {
          if (!hasSignal) {
            return previous.map((level, index) => {
              const wave = Math.sin(frame * 0.13 + index * 0.72) * 0.08;
              return Math.max(0.08, Math.min(0.42, idleSeeds[index] + wave));
            });
          }
          return next.map((level, index) => {
            const glowLift = Math.sin(frame * 0.05 + index * 0.4) * 0.025;
            return Math.max(0.06, Math.min(1, level * 1.35 + glowLift));
          });
        });
      } else {
        setLevels((previous) =>
          previous.map((level, index) => {
            const pulse = Math.sin(frame * 0.055 + index * 0.65) * 0.025;
            return level * 0.9 + (idleSeeds[index] + pulse) * 0.1;
          }),
        );
      }

      raf = window.requestAnimationFrame(animate);
    }

    raf = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(raf);
  }, [idleSeeds, isPlaying]);

  return (
    <div className="sonata-lcd-visualizer-wrap" aria-hidden="true">
      <span className="sonata-lcd-visualizer-label">VOLUME</span>
      <div className="sonata-lcd-visualizer">
        {levels.map((level, index) => {
          const cells = Math.max(1, Math.round(level * 10));
          return (
            <span
              className="sonata-lcd-visualizer__bar"
              key={index}
              style={{ '--sonata-vu-level': String(cells) } as CSSProperties}
            >
              {Array.from({ length: 10 }, (_, cell) => (
                <i key={cell} className={cell < cells ? 'is-lit' : ''} />
              ))}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function TrackReadout() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  if (!currentTrack) {
    return (
      <div className="sonata-track-lcd">
        <div className="sonata-lcd__row1">
          <span className="sonata-lcd__time">--:--</span>
          <span className="sonata-lcd__title sonata-lcd__title--idle">NO TRACK LOADED</span>
        </div>
        <div className="sonata-lcd__row2">DROP A FILE OR PASTE A URL</div>
        <div className="sonata-lcd__row3">
          <span className="sonata-lcd__status">STANDBY</span>
        </div>
        <MiniAudioVisualizer isPlaying={false} />
      </div>
    );
  }

  const sourceLabel =
    currentTrack.mediaKind === 'video' ? 'VIDEO'
      : currentTrack.sourceType === 'local' ? 'LOCAL'
      : currentTrack.sourceType === 'youtube' ? 'YT'
      : 'NET';

  const artist = currentTrack.artist && currentTrack.artist !== 'Unknown Artist'
    ? currentTrack.artist
    : null;
  const album = currentTrack.album && currentTrack.album !== 'Unknown Album'
    ? currentTrack.album
    : null;

  const row2Parts = [artist, album].filter(Boolean).join(' - ') || 'UNKNOWN ARTIST';
  const displayTitle = currentTrack.title;

  return (
    <div className="sonata-track-lcd">
      <div className="sonata-lcd__row1">
        <span className="sonata-lcd__time">{formatTime(currentTime)}</span>
        <span className="sonata-lcd__title">{displayTitle}</span>
      </div>
      <div className="sonata-lcd__row2">{row2Parts.toUpperCase()}</div>
      <div className="sonata-lcd__row3">
        <span className={`sonata-lcd__badge sonata-lcd__badge--${currentTrack.sourceType}`}>
          {sourceLabel}
        </span>
        <span className="sonata-lcd__status">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
      <MiniAudioVisualizer isPlaying={isPlaying} />
    </div>
  );
}
