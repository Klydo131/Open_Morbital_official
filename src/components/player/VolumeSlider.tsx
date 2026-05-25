// SPDX-License-Identifier: AGPL-3.0-or-later
import { Volume2, VolumeX } from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';

export function VolumeSlider() {
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);

  return (
    <div className="sonata-volume">
      <button className="sonata-volume__icon" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
        {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      <input
        className="sonata-volume__slider"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        style={{ '--volume-pct': `${volume * 100}%` } as React.CSSProperties}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        aria-label="Volume"
      />
    </div>
  );
}
