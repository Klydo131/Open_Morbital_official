// SPDX-License-Identifier: AGPL-3.0-or-later
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { DesktopShell } from '../components/layout/DesktopShell';
import { MobileShell } from '../components/layout/MobileShell';
import { NowPlayingRoute } from './routes/NowPlaying';
import { LibraryRoute } from './routes/Library';
import { PlaylistsRoute } from './routes/Playlists';
import { SettingsRoute } from './routes/Settings';
import { VaultRoute } from './routes/Vault';
import { ComingSoonRoute } from './routes/ComingSoon';
import { RadioRoute } from './routes/Radio';
import { usePlayerStore } from '../store/playerStore';
import { loadSessionQueue } from '../core/storage/sessionQueue';
import { useMediaSession } from '../core/audio/useMediaSession';
import { morbitalDb } from '../core/storage/db';
import { vaultDb } from '../core/storage/vaultDb';
import type { MorbitalTrack } from '../store/playerStore';

const MOBILE_BP = 768;

function useSessionRestore() {
  useEffect(() => {
    const saved = loadSessionQueue();
    if (!saved || saved.tracks.length === 0) return;

    void (async () => {
      const { addTracks, setCurrentTrack, addToast } = usePlayerStore.getState();

      const restoredTracks = await Promise.all(
        saved.tracks.map(async (t) => {
          if (t.sourceType !== 'local') return { ...t } as unknown as MorbitalTrack;

          try {
            const stored = await morbitalDb.tracks.get(t.id);
            if (stored?.blob) {
              const mimeType = stored.mimeType || t.mimeType || stored.blob.type || '';
              const file = new File([stored.blob], t.fileName, { type: mimeType });
              const objectUrl = URL.createObjectURL(file);
              return { ...t, localFile: file, objectUrl, needsReAdd: false } as unknown as MorbitalTrack;
            }
            // Also check the Pod (Vault) database — Pod tracks are stored there, not in morbitalDb
            const vaultStored = await vaultDb.vault_tracks.get(t.id);
            if (vaultStored?.blob) {
              const mimeType = vaultStored.mimeType || t.mimeType || '';
              const file = new File([vaultStored.blob], t.fileName, { type: mimeType });
              const objectUrl = URL.createObjectURL(file);
              return { ...t, localFile: file, objectUrl, needsReAdd: false } as unknown as MorbitalTrack;
            }
          } catch {
            // IndexedDB unavailable — fall through to stub
          }

          // Blob not found: keep as stub, playback will fail gracefully
          return { ...t, needsReAdd: true } as unknown as MorbitalTrack;
        })
      );

      addTracks(restoredTracks);

      const currentTrack = restoredTracks.find((t) => t.id === saved.currentTrackId);
      if (currentTrack) setCurrentTrack(currentTrack);

      const unavailable = restoredTracks.filter((t) => t.sourceType === 'local' && (t as MorbitalTrack & { needsReAdd?: boolean }).needsReAdd).length;
      const total = restoredTracks.length;
      const message =
        unavailable > 0
          ? `${total} track${total > 1 ? 's' : ''} restored. ${unavailable} local file${unavailable > 1 ? 's' : ''} could not be found.`
          : `${total} track${total > 1 ? 's' : ''} restored from your last session.`;
      addToast(message, 'info');
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BP);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BP}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

function DesktopApp() {
  return (
    <Routes>
      <Route element={<DesktopShell />}>
        <Route index element={<NowPlayingRoute />} />
        <Route path="/library" element={<LibraryRoute />} />
        <Route path="/playlists" element={<PlaylistsRoute />} />
        <Route path="/vault" element={<VaultRoute />} />
        <Route path="/radio" element={<RadioRoute />} />
        <Route path="/discover" element={<ComingSoonRoute feature="Discover" />} />
        <Route path="/karaoke" element={<ComingSoonRoute feature="Karaoke" />} />
        <Route path="/themes" element={<ComingSoonRoute feature="Themes" />} />
        <Route path="/settings" element={<SettingsRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function MorbitalApp() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileShell /> : <DesktopApp />;
}

export default function App() {
  useSessionRestore();
  useMediaSession();

  useEffect(() => {
    if (navigator.storage?.persist) void navigator.storage.persist();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('sonata-theme') ?? 'dark';
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  useEffect(() => {
    // Show a toast when the page loaded after a SW update — flag set just before reload.
    if (sessionStorage.getItem('sonata-sw-updated')) {
      sessionStorage.removeItem('sonata-sw-updated');
      const timer = window.setTimeout(() => {
        usePlayerStore.getState().addToast('Open Morbital updated to the latest version', 'success');
      }, 1200);
      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    // Never reload the app while a user is listening. The previous behavior
    // interrupted playback mid-track and forced a session restore screen,
    // which made local files look broken even when the blob was still saved.
    let notified = false;
    const handleControllerChange = () => {
      if (notified) return;
      notified = true;
      sessionStorage.setItem('sonata-sw-updated', '1');
      usePlayerStore.getState().addToast('Open Morbital updated. Keep listening; reopen when you are ready.', 'info');
    };
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  return (
    <BrowserRouter>
      <MorbitalApp />
    </BrowserRouter>
  );
}
