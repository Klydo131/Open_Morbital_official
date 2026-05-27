// SPDX-License-Identifier: AGPL-3.0-or-later
import { Play, Pause } from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';
import { audioTogglePlayback } from '../../core/audio/audioEngine';

function formatTime(secs: number): string {
  if (!isFinite(secs) || secs < 0) return '--:--';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function NowPlayingHero() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying    = usePlayerStore((s) => s.isPlaying);
  const currentTime  = usePlayerStore((s) => s.currentTime);
  const duration     = usePlayerStore((s) => s.duration);

  const hasArt = !!currentTrack?.albumArt;
  const sourceLabel =
    currentTrack?.mediaKind === 'video' ? 'VIDEO'
      : currentTrack?.sourceType === 'local' ? 'LOCAL'
      : currentTrack?.sourceType === 'youtube' ? 'YOUTUBE'
      : currentTrack ? 'URL' : null;

  function handleClick() {
    if (currentTrack) void audioTogglePlayback();
  }

  return (
    <div className="mb-hero">
      <div
        className={`mb-hero__art${isPlaying ? ' is-playing' : ''}${currentTrack ? ' is-interactive' : ''}`}
        onClick={handleClick}
        role={currentTrack ? 'button' : undefined}
        tabIndex={currentTrack ? 0 : undefined}
        title={currentTrack ? (isPlaying ? 'Pause' : 'Play') : undefined}
        onKeyDown={
          currentTrack
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClick();
                }
              }
            : undefined
        }
      >
        {hasArt ? (
          <img
            className="mb-hero__art-img"
            src={currentTrack!.albumArt}
            alt={currentTrack!.title}
            draggable={false}
          />
        ) : (
          <div className="mb-hero__art-fallback" aria-hidden="true">
            <span className="mb-hero__art-mark">OM</span>
          </div>
        )}
        {currentTrack && (
          <div className="mb-hero__art-overlay" aria-hidden="true">
            {isPlaying ? <Pause size={42} /> : <Play size={42} />}
          </div>
        )}
      </div>

      <div className="mb-hero__meta">
        <div className="mb-hero__title">
          {currentTrack ? currentTrack.title : 'No track loaded'}
        </div>
        <div className="mb-hero__artist">
          {currentTrack
            ? (currentTrack.artist && currentTrack.artist !== 'Unknown Artist'
                ? currentTrack.artist
                : '—')
            : 'Drop a file or paste a URL'}
        </div>
        <div className="mb-hero__line">
          <span className="mb-hero__time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          {sourceLabel && (
            <span className={`mb-hero__badge mb-hero__badge--${currentTrack?.sourceType ?? 'local'}`}>
              {sourceLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
