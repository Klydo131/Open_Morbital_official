// SPDX-License-Identifier: AGPL-3.0-or-later
export type UpdateEntry = {
  id: string;
  date: string;
  title: string;
  body: string;
  tag?: 'new' | 'improved' | 'fixed';
  milestone?: boolean;
};

export const ALL_UPDATES: UpdateEntry[] = [
  {
    id: 'u-20260513-navfix',
    date: '2026-05-13',
    title: 'Swipe & Arrow Navigation',
    body: 'Swipe left/right (or tap the arrows) to move between tracks on mobile. Arrows appear in both the video reel and the music deck. Swipe is blocked on single-track queues to prevent accidental resets.',
    tag: 'improved',
  },
  {
    id: 'u-20260513-readd',
    date: '2026-05-13',
    title: 'Clear Re-Add Prompt for Local Files',
    body: 'Restored local files now show a "Re-add File" button instead of silently failing on play. Tap it to pick the file again — your queue position and metadata are kept.',
    tag: 'improved',
  },
  {
    id: 'u-20260513-queue24h',
    date: '2026-05-13',
    title: '24-Hour Queue Memory',
    body: 'Close the app, come back later — your queue is still there. Tracks are saved for 24 hours. YouTube and URL tracks are fully playable. Local files restore as stubs; re-add from your device to play them again.',
    tag: 'new',
  },
  {
    id: 'u-20260513-ytfix',
    date: '2026-05-13',
    title: 'YouTube Play/Pause & Progress Restored',
    body: 'Play and pause from the Open Morbital controls now works reliably. The progress bar tracks YouTube in real time. First-click-before-ready is no longer dropped.',
    tag: 'fixed',
  },
  {
    id: 'u-20260513-bugfix',
    date: '2026-05-13',
    title: 'Smoother Playback — 5 Bugs Fixed',
    body: 'Added music no longer autoplays — it waits for you to press Play. YouTube sync is now reliable. Echo on track skip is gone. The progress bar shows on every track. MP4 files load faster.',
    tag: 'fixed',
  },
  {
    id: 'u-20260512-reel',
    date: '2026-05-12',
    title: 'Full-Screen Video Reel',
    body: 'Videos now open in a full-screen reel — like Reels or Shorts. Swipe up/down to skip tracks. Tap to show controls. Vertical videos display naturally — tap FIT or FILL to choose your crop.',
    tag: 'new',
  },
  {
    id: 'u-20260512-download',
    date: '2026-05-12',
    title: 'Save Online Music for Offline Play',
    body: 'Playing a track from a URL? Tap SAVE OFFLINE to download it. It stays saved after closing Open Morbital — perfect for Bluetooth car audio or boombox sessions without internet.',
    tag: 'new',
  },
  {
    id: 'u-20260512-silent',
    date: '2026-05-12',
    title: 'Silent Audio Bug Fixed',
    body: 'First-play silence on mobile is gone. The audio engine now correctly wakes the browser sound system before routing audio.',
    tag: 'fixed',
  },
  {
    id: 'u-20260510-security',
    date: '2026-05-10',
    title: 'Security Hardening',
    body: 'Internal security review completed. Content Security Policy tightened, and all data flows confirmed local-only. Your music never leaves your device.',
    tag: 'improved',
  },
  {
    id: 'u-20260508-radio',
    date: '2026-05-08',
    title: 'Radio — Live Internet Streams',
    body: 'Tune into curated internet radio stations from the Radio tab. Lo-fi, chill, classical, jazz — always on, no playlist needed.',
    tag: 'new',
  },
  {
    id: 'u-20260507-vault',
    date: '2026-05-07',
    title: 'Vault — Save Music Permanently',
    body: 'Your music now survives after closing the app. The Vault stores tracks in the browser local database. Build offline playlists and keep your collection in one place.',
    tag: 'new',
  },
  {
    id: 'u-20260506-pwa',
    date: '2026-05-06',
    title: 'Install Open Morbital on Your Home Screen',
    body: 'Open Morbital is now a Progressive Web App. Add it to your home screen — no app store required. It auto-updates in the background and works offline.',
    tag: 'new',
  },
  {
    id: 'u-20260505-theme',
    date: '2026-05-05',
    title: 'Dark & Light Themes',
    body: 'Choose between Midnight Purple (dark) and Silver Lavender (light). Your preference is saved between sessions.',
    tag: 'improved',
  },
  {
    id: 'u-20260504-youtube',
    date: '2026-05-04',
    title: 'YouTube Playback',
    body: 'Paste any YouTube URL into the queue. Open Morbital fetches the title and thumbnail and plays it alongside your local tracks — no app switching.',
    tag: 'new',
  },
  {
    id: 'u-20260504-bluetooth',
    date: '2026-05-04',
    title: 'Bluetooth in Settings',
    body: 'Scan for nearby Bluetooth devices and share audio files via the Web Share API. Found under Settings.',
    tag: 'new',
  },
  {
    id: 'u-20260504-launch',
    date: '2026-05-04',
    title: 'Open Morbital — Full Rebuild',
    body: 'Complete ground-up rebuild. Faster, cleaner, more reliable. Desktop and mobile layouts unified under one codebase. Local files, YouTube, and direct URLs all share the same queue.',
    tag: 'new',
    milestone: true,
  },
  {
    id: 'u-20260501-library',
    date: '2026-05-01',
    title: 'Library Module',
    body: 'First version of the file library — browse and manage your local music collection in a dedicated panel.',
    tag: 'new',
  },
  {
    id: 'u-20260425-launch',
    date: '2026-04-25',
    title: 'Open Morbital Launches',
    body: 'The first version of Open Morbital is live. Play local music files, drag and drop tracks, and enjoy a retro wave-inspired UI. This is where it all started.',
    tag: 'new',
    milestone: true,
  },
];

export const TAG_LABELS: Record<string, string> = {
  new: 'NEW',
  improved: 'IMPROVED',
  fixed: 'FIXED',
};

const STORAGE_KEY = 'sonata-updates-last-seen';
let _listeners: (() => void)[] = [];

export function hasUnread(): boolean {
  const lastSeen = localStorage.getItem(STORAGE_KEY) ?? '';
  if (!lastSeen) return true;
  return ALL_UPDATES.findIndex((u) => u.id === lastSeen) !== 0;
}

export function markAllSeen(): void {
  localStorage.setItem(STORAGE_KEY, ALL_UPDATES[0].id);
  _listeners.forEach((fn) => fn());
}

export function subscribeUnread(fn: () => void): () => void {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter((l) => l !== fn); };
}
