// SPDX-License-Identifier: AGPL-3.0-or-later
import { Play, Pause } from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';
import { audioTogglePlayback } from '../../core/audio/audioEngine';

type Props = {
  size?: number;
};

export function CDPlayer({ size = 220 }: Props) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying    = usePlayerStore((s) => s.isPlaying);
  const hasArt       = !!currentTrack?.albumArt;

  function handleClick() {
    if (currentTrack) void audioTogglePlayback();
  }

  return (
    <div className="sonata-cd-tray">
      <div className="sonata-cd-well">
        {/* Tray notch — lower-left cutout detail */}
        <div className="sonata-cd-well__notch" />

        <div
          className={`sonata-cd${isPlaying ? ' sonata-cd--spinning' : ''}${currentTrack ? ' sonata-cd--interactive' : ''}`}
          style={{ width: size, height: size }}
          onClick={handleClick}
          title={currentTrack ? (isPlaying ? 'Pause' : 'Play') : undefined}
          role={currentTrack ? 'button' : undefined}
          tabIndex={currentTrack ? 0 : undefined}
          onKeyDown={currentTrack ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } } : undefined}
        >
          {/* 1. Outer metallic rim */}
          <div className="sonata-cd__rim" />

          {/* 2. Disc face (background changes per theme, holds album art) */}
          <div className={`sonata-cd__face${hasArt ? ' sonata-cd__face--art' : ''}`}>
            {hasArt && (
              <img
                className="sonata-cd__art"
                src={currentTrack!.albumArt}
                alt={currentTrack!.title}
                draggable={false}
              />
            )}
          </div>

          {/* 3. App branding SVG — only when no album art */}
          {!hasArt && (
            <svg
              className="sonata-cd__brand"
              viewBox="0 0 200 200"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                <path id="cd-top-arc" d="M 28 100 A 72 72 0 0 1 172 100" />
                <path id="cd-bot-arc" d="M 45 118 A 58 58 0 0 0 155 118" />
              </defs>

              {/* Primary orbital swoosh */}
              <path
                d="M 52 100 A 48 48 0 0 1 148 100"
                stroke="var(--sonata-cd-accent)"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                opacity="0.65"
              />
              {/* Secondary swoosh offset */}
              <path
                d="M 56 94 A 46 46 0 0 1 144 94"
                stroke="var(--sonata-cd-accent)"
                strokeWidth="0.75"
                fill="none"
                strokeLinecap="round"
                opacity="0.3"
              />

              {/* "OPEN MORBITAL" along top arc */}
              <text
                fontFamily="'JetBrains Mono', monospace"
                fontSize="8"
                fontWeight="700"
                fill="var(--sonata-cd-text)"
                letterSpacing="2"
              >
                <textPath href="#cd-top-arc" startOffset="50%" textAnchor="middle">
                  OPEN MORBITAL
                </textPath>
              </text>

              {/* "v1.4" along bottom arc */}
              <text
                fontFamily="'JetBrains Mono', monospace"
                fontSize="7"
                fill="var(--sonata-cd-text)"
                letterSpacing="2"
                opacity="0.75"
              >
                <textPath href="#cd-bot-arc" startOffset="50%" textAnchor="middle">
                  v1.4
                </textPath>
              </text>

              {/* Cardinal dot markers N/S/E/W */}
              <circle cx="100" cy="30"  r="1.5" fill="var(--sonata-cd-accent)" opacity="0.5" />
              <circle cx="100" cy="170" r="1.5" fill="var(--sonata-cd-accent)" opacity="0.5" />
              <circle cx="30"  cy="100" r="1.5" fill="var(--sonata-cd-accent)" opacity="0.5" />
              <circle cx="170" cy="100" r="1.5" fill="var(--sonata-cd-accent)" opacity="0.5" />

              {/* Technical tick marks at 45° corners */}
              <line x1="51"  y1="51"  x2="56"  y2="56"  stroke="var(--sonata-cd-accent)" strokeWidth="1" opacity="0.3" />
              <line x1="149" y1="51"  x2="144" y2="56"  stroke="var(--sonata-cd-accent)" strokeWidth="1" opacity="0.3" />
              <line x1="51"  y1="149" x2="56"  y2="144" stroke="var(--sonata-cd-accent)" strokeWidth="1" opacity="0.3" />
              <line x1="149" y1="149" x2="144" y2="144" stroke="var(--sonata-cd-accent)" strokeWidth="1" opacity="0.3" />
            </svg>
          )}

          {/* 4. Radial groove lines */}
          <div className="sonata-cd__grooves" />

          {/* 5. Reflective shine overlay */}
          <div className="sonata-cd__sheen" />

          {/* 6. Inner hub ring */}
          <div className="sonata-cd__hub" />

          {/* 7. Center hole */}
          <div className="sonata-cd__hole" />

          {/* 8. Play/pause hover overlay — only shown when a track is loaded */}
          {currentTrack && (
            <div className="sonata-cd__play-overlay" aria-hidden="true">
              {isPlaying ? <Pause size={36} /> : <Play size={36} />}
            </div>
          )}
        </div>

        {/* Drop shadow under disc */}
        <div className="sonata-cd-well__shadow" />
      </div>

      {/* Corner screw rivets on the tray frame */}
      <div className="sonata-cd-tray__screw sonata-cd-tray__screw--tl" />
      <div className="sonata-cd-tray__screw sonata-cd-tray__screw--tr" />
      <div className="sonata-cd-tray__screw sonata-cd-tray__screw--bl" />
      <div className="sonata-cd-tray__screw sonata-cd-tray__screw--br" />
    </div>
  );
}
