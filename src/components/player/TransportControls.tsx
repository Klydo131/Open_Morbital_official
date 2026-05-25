// SPDX-License-Identifier: AGPL-3.0-or-later
import { SkipBack, Play, Pause, SkipForward, Shuffle, Repeat } from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';

type Props = {
  onPlayPause: () => void;
};

export function TransportControls({ onPlayPause }: Props) {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isShuffleOn = usePlayerStore((s) => s.isShuffleOn);
  const isRepeatOn = usePlayerStore((s) => s.isRepeatOn);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const setRepeatOn = usePlayerStore((s) => s.setRepeatOn);
  const playNext = usePlayerStore((s) => s.playNext);
  const playPrevious = usePlayerStore((s) => s.playPrevious);

  return (
    <div className="sonata-transport">
      <button
        className={`sonata-transport__btn${isShuffleOn ? ' sonata-transport__btn--active' : ''}`}
        onClick={toggleShuffle}
        title="Shuffle"
      >
        <Shuffle size={16} />
      </button>

      <button
        className="sonata-transport__btn"
        onClick={playPrevious}
        title="Previous"
        disabled={!currentTrack}
      >
        <SkipBack size={18} />
      </button>

      <button
        className="sonata-transport__btn sonata-transport__play"
        onClick={onPlayPause}
        title={isPlaying ? 'Pause' : 'Play'}
        disabled={!currentTrack}
      >
        {isPlaying ? <Pause size={22} /> : <Play size={22} />}
      </button>

      <button
        className="sonata-transport__btn"
        onClick={playNext}
        title="Next"
        disabled={!currentTrack}
      >
        <SkipForward size={18} />
      </button>

      <button
        className={`sonata-transport__btn${isRepeatOn ? ' sonata-transport__btn--active' : ''}`}
        onClick={() => setRepeatOn(!isRepeatOn)}
        title="Repeat"
      >
        <Repeat size={16} />
      </button>
    </div>
  );
}
