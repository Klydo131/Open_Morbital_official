// SPDX-License-Identifier: AGPL-3.0-or-later
import { Outlet } from 'react-router-dom';
import { TopStatusBar } from './TopStatusBar';
import { Sidebar } from './Sidebar';
import { QueuePanel } from './QueuePanel';
import { BottomConsole } from './BottomConsole';
import { Toast } from '../shared/Toast';
import { useAudioEngine } from '../../core/audio/audioEngine';
import { usePersistence } from '../../core/audio/usePersistence';

export function DesktopShell() {
  const {
    audioRef,
    handleEnded,
    handleError,
    setIsPlaying,
    setCurrentTime,
    setDuration,
  } = useAudioEngine();

  usePersistence();

  return (
    <div className="sonata-shell desktop-only">
      <TopStatusBar />

      <div className="sonata-content">
        <Sidebar />

        <main className="sonata-center">
          <Outlet />
        </main>

        <QueuePanel />
      </div>

      <BottomConsole />

      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onEnded={handleEnded}
        onError={handleError}
        preload="metadata"
      />

      <Toast />
    </div>
  );
}

