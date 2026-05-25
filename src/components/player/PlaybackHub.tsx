// SPDX-License-Identifier: AGPL-3.0-or-later
import { Smile } from 'lucide-react';
import { CDPlayer } from './CDPlayer';
import { TrackReadout } from './TrackReadout';
import { ProgressBar } from './ProgressBar';
import { TransportControls } from './TransportControls';
import { VolumeSlider } from './VolumeSlider';
import { YoutubeEmbedPlayer } from './YoutubeEmbedPlayer';
import { LocalVideoDeck } from './LocalVideoDeck';
import { audioTogglePlayback, audioSeekTo } from '../../core/audio/audioEngine';
import { usePlayerStore } from '../../store/playerStore';

export function PlaybackHub() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isEmbedTrack = currentTrack?.sourceType === 'youtube';
  const hasYoutubeProgress = currentTrack?.sourceType === 'youtube';
  const isLocalVideo = currentTrack?.sourceType === 'local' && currentTrack.mediaKind === 'video';

  const deckVariant = isLocalVideo ? 'video' : isEmbedTrack ? 'embed' : 'cd';

  return (
    <div className={`sonata-playback-hub sonata-playback-hub--${deckVariant}`}>
      <div className={`sonata-desktop-deck sonata-desktop-deck--${deckVariant}`}>
        {isEmbedTrack && currentTrack?.sourceUrl ? (
          <YoutubeEmbedPlayer track={currentTrack} height={380} />
        ) : isLocalVideo && currentTrack ? (
          <LocalVideoDeck track={currentTrack} />
        ) : (
          <CDPlayer size={220} />
        )}
      </div>

      <div className="sonata-playback-controls">
        <div className="sonata-controls-topbar">
          <button className="sonata-mood-btn">
            <Smile size={11} />
            Mood
          </button>
        </div>
        <TrackReadout />
        {(!isEmbedTrack || hasYoutubeProgress) && <ProgressBar onSeek={audioSeekTo} />}
        <TransportControls onPlayPause={() => void audioTogglePlayback()} />
        {!isEmbedTrack && <VolumeSlider />}
      </div>
    </div>
  );
}
