// SPDX-License-Identifier: AGPL-3.0-or-later
import { Wifi, WifiOff, Play, Square, Shuffle, Music2, Radio } from 'lucide-react';
import { usePlayerStore, type MorbitalTrack } from '../../store/playerStore';
import { useVaultStore } from '../../store/vaultStore';
import { playTrackNow, audioTogglePlayback } from '../../core/audio/audioEngine';
import type { VaultTrack } from '../../core/storage/vaultDb';

// SomaFM Groove Salad — ambient/chillout, CORS-enabled, no login, no ads
const WAVE_RADIO: MorbitalTrack = {
  id: 'radio-sonata-wave',
  title: 'Wave Radio',
  artist: 'Ambient · Groove Salad by SomaFM',
  album: 'Online Radio',
  fileName: 'sonata-wave-radio',
  sourceUrl: 'https://ice4.somafm.com/groovesalad-128-mp3',
  sourceType: 'url',
  mediaKind: 'audio',
  createdAt: 0,
};

function vaultToMorbital(vt: VaultTrack): MorbitalTrack {
  return {
    id: vt.id,
    title: vt.title,
    artist: vt.artist,
    album: vt.album,
    fileName: vt.fileName,
    mimeType: vt.mimeType,
    objectUrl: URL.createObjectURL(vt.blob),
    sourceType: 'local',
    mediaKind: vt.mediaKind,
    duration: vt.duration,
    albumArt: vt.albumArt,
    createdAt: vt.addedAt,
  };
}

function shuffled<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function RadioRoute() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const addTracks = usePlayerStore((s) => s.addTracks);
  const clearQueue = usePlayerStore((s) => s.clearQueue);
  const vaultTracks = useVaultStore((s) => s.vaultTracks);

  const isOnlineLoaded = currentTrack?.id === WAVE_RADIO.id;
  const isOnlinePlaying = isOnlineLoaded && isPlaying;

  const audioTracks = vaultTracks.filter((t) => t.mediaKind === 'audio');
  const vaultIds = new Set(vaultTracks.map((t) => t.id));
  const isOfflinePlaying = isPlaying && !!currentTrack && vaultIds.has(currentTrack.id);

  function handleOnline() {
    if (isOnlineLoaded) {
      void audioTogglePlayback();
      return;
    }
    addTracks([WAVE_RADIO]);
    playTrackNow(WAVE_RADIO);
  }

  function handleOffline() {
    if (isOfflinePlaying) {
      void audioTogglePlayback();
      return;
    }
    if (!audioTracks.length) return;
    const tracks = shuffled(audioTracks).map(vaultToMorbital);
    clearQueue();
    addTracks(tracks);
    playTrackNow(tracks[0]);
  }

  return (
    <div className="sonata-radio-page">
      <div className="sonata-radio-header">
        <Radio size={20} className="sonata-radio-header__icon" />
        <div>
          <h1 className="sonata-radio-header__title">RADIO</h1>
          <p className="sonata-radio-header__sub">Two stations · always ready</p>
        </div>
      </div>

      <div className="sonata-radio-grid">

        {/* ── Station 1: Online ── */}
        <div className={`sonata-radio-card sonata-radio-card--online${isOnlineLoaded ? ' sonata-radio-card--active' : ''}`}>
          <div className="sonata-radio-card__toprow">
            <span className="sonata-radio-badge sonata-radio-badge--live">
              <Wifi size={9} /> LIVE
            </span>
            {isOnlinePlaying && (
              <span className="sonata-radio-card__onair">● ON AIR</span>
            )}
          </div>

          <div className="sonata-radio-card__name">Wave Radio</div>
          <div className="sonata-radio-card__genre">Ambient · Chillout · Electronic</div>
          <p className="sonata-radio-card__desc">
            A continuous ambient stream from SomaFM Groove Salad. No ads, no login — just the wave.
          </p>
          <div className="sonata-radio-card__meta">
            <span>128 kbps MP3</span>
            <span>Requires internet</span>
          </div>

          <button
            className={`sonata-radio-card__btn${isOnlineLoaded ? ' sonata-radio-card__btn--active' : ''}`}
            onClick={handleOnline}
          >
            {isOnlinePlaying
              ? <><Square size={13} /> Stop</>
              : isOnlineLoaded
              ? <><Play size={13} /> Resume</>
              : <><Play size={13} /> Tune In</>}
          </button>
        </div>

        {/* ── Station 2: Offline ── */}
        <div className={`sonata-radio-card sonata-radio-card--offline${isOfflinePlaying ? ' sonata-radio-card--active' : ''}`}>
          <div className="sonata-radio-card__toprow">
            <span className="sonata-radio-badge sonata-radio-badge--local">
              <WifiOff size={9} /> LOCAL
            </span>
            {isOfflinePlaying && (
              <span className="sonata-radio-card__onair sonata-radio-card__onair--local">● PLAYING</span>
            )}
          </div>

          <div className="sonata-radio-card__name">My Station</div>
          <div className="sonata-radio-card__genre">Your Saved Music · Shuffled</div>
          <p className="sonata-radio-card__desc">
            Shuffles all your Pod tracks continuously. Fully offline — no internet required, no streaming.
          </p>
          <div className="sonata-radio-card__meta">
            <Music2 size={10} />
            <span>{audioTracks.length} track{audioTracks.length !== 1 ? 's' : ''} in Pod</span>
            <span>No internet needed</span>
          </div>

          {audioTracks.length === 0 ? (
            <p className="sonata-radio-card__empty">
              Save tracks to <strong>Pod</strong> first to use My Station.
            </p>
          ) : (
            <button
              className={`sonata-radio-card__btn sonata-radio-card__btn--local${isOfflinePlaying ? ' sonata-radio-card__btn--active' : ''}`}
              onClick={handleOffline}
            >
              {isOfflinePlaying
                ? <><Square size={13} /> Stop</>
                : <><Shuffle size={13} /> Play My Station</>}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
