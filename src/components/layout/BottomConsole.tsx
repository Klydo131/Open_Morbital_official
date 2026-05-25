// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useState } from 'react';
import { Activity, Gauge, Monitor, HardDrive } from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';
import { UpdatesPanel } from '../shared/UpdatesPanel';
import { useContentStorage } from '../../core/storage/useContentStorage';

const IDLE_MESSAGES = [
  'WELCOME ABOARD OPEN MORBITAL - LOCAL SHIP ONLINE',
  'GOOD TO SEE YOU - YOUR MUSIC STAYS ON THIS DEVICE',
  'OPEN MORBITAL READY - DROP A TRACK AND LIGHT THE DECK',
  'RETRO WAVE PLAYER IDLE - SYSTEMS GLOWING SOFTLY',
  'NO CLOUD STATIC - LOCAL PLAYBACK BAY IS OPEN',
  'SYNC DISABLED - PRIVATE LISTENING MODE ACTIVE',
  'QUEUE BAY CLEAR - READY FOR THE NEXT MEMORY',
  'INSTALLABLE PWA - OFFLINE VAULT STANDING BY',
  'WELCOME BACK PILOT - THE DECK MISSED YOUR MUSIC',
  'STATUS: CALM, BRIGHT, AND READY',
];

function pickLaunchMessage() {
  return IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)];
}

export function BottomConsole() {
  const [time, setTime] = useState(() => new Date());
  const [launchMessage] = useState(pickLaunchMessage);
  const storageLabel = useContentStorage();

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying    = usePlayerStore((s) => s.isPlaying);
  const queueCount   = usePlayerStore((s) => s.queue.length);
  const conversionStatus = usePlayerStore((s) => s.conversionStatus);
  const urlStatus        = usePlayerStore((s) => s.urlStatus);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const clockStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const modeLabel = currentTrack?.mediaKind === 'video'
    ? 'VIDEO'
    : currentTrack?.sourceType === 'youtube'
      ? 'YOUTUBE'
      : currentTrack
        ? 'AUDIO'
        : 'STANDBY';

  const isMediaTrack = currentTrack?.mediaKind === 'video' || currentTrack?.sourceType === 'youtube';

  const networkStatus = navigator.onLine ? 'NETWORK LOCAL-READY' : 'NETWORK OFFLINE';
  const lcd = conversionStatus
    ? `CONVERSION: ${conversionStatus}`
    : urlStatus
      ? `IMPORT STATUS: ${urlStatus}`
      : isPlaying && currentTrack
        ? `PLAYING: ${currentTrack.title} - ${currentTrack.artist} - ${networkStatus}`
        : currentTrack
          ? `READY: ${currentTrack.title} - QUEUE ${queueCount} - OPEN MORBITAL`
          : `${launchMessage} - ${networkStatus} - QUEUE ${queueCount}`;

  return (
    <footer className="sonata-console">

      <div className="sonata-console__left">
        <span className="sonata-console__clock">{clockStr}</span>
        <span className={`sonata-console__cell${isMediaTrack ? ' sonata-console__cell--video' : ''}`}>
          <Monitor size={11} />
          {modeLabel}
        </span>
        <span className="sonata-console__cell">
          <Gauge size={11} />
          QUEUE {queueCount}
        </span>
        <span className={`sonata-console__cell${isPlaying ? ' sonata-console__cell--live' : ''}`}>
          <Activity size={11} />
          {isPlaying ? 'SIGNAL LIVE' : 'DECK READY'}
        </span>
      </div>

      <div className="sonata-console__center">
        <span className="sonata-console__lcd" key={lcd}>
          <span className="sonata-console__marquee">{lcd}</span>
        </span>
      </div>

      <div className="sonata-console__right">
        <span className="sonata-console__cell" title="Music player content storage">
          <HardDrive size={11} />
          {storageLabel}
        </span>
        <UpdatesPanel />
      </div>

    </footer>
  );
}
