# Open Morbital — Developer Guide

This file is the developer's tour of the codebase. It is intentionally short. If something is missing here, the source is the source of truth — read it.

## Stack

| Layer | Tech |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 6 |
| State | Zustand v5 |
| PWA | vite-plugin-pwa (Workbox) |
| Styling | Plain CSS + CSS custom properties |
| Icons | lucide-react |
| Local storage | Dexie (IndexedDB wrapper) |
| Audio metadata | jsmediatags |
| Optional local transcoding | @ffmpeg/* (WASM, bundled to `public/vendor/ffmpeg/`) |

No backend. No telemetry SDK. No analytics. No login. Files stay on the user's device.

## Project Structure

```
src/
├── app/
│   ├── App.tsx               Entry — mobile/desktop split, session restore, theme init, keyboard help, SW update toast
│   └── routes/               Page-level routes (NowPlaying, Library, Playlists, Radio, Vault, Settings, ComingSoon)
│
├── components/
│   ├── layout/               DesktopShell, MobileShell, Sidebar, QueuePanel, TopStatusBar, BottomConsole
│   ├── player/               NowPlayingHero (the desktop centerpiece), CDPlayer (mobile + opt-in), PlaybackHub,
│   │                         TrackReadout, ProgressBar, TransportControls, VolumeSlider, YoutubeEmbedPlayer,
│   │                         LocalVideoDeck, MobilePlayerView
│   ├── mobile/               Mobile-specific tab views (Library, Queue, Settings, Vault, Tutorial, UpdatesPopover)
│   ├── import/               DropZone, ImportMusicPanel
│   ├── queue/                QueueItem
│   ├── bluetooth/            BluetoothPanel (Web Share + Web Bluetooth — opt-in)
│   └── shared/               ConfirmDialog, Toast, UpdatesPanel, UpdateHistoryModal, FeedbackPanel, KeyboardHelp
│
├── core/
│   ├── audio/                audioRef (singleton), audioEngine (play/pause/seek), useMediaSession (lockscreen),
│   │                         audioAnalyser (VU meter), embedPlayerBridge (YouTube control), localTranscode (FFmpeg WASM),
│   │                         usePersistence (volume/repeat)
│   ├── import/               useIngest (file drop + URL parser), metadataService (ID3/MP4 tags)
│   ├── storage/              db (track metadata, Dexie), vaultDb (Pod persistent library), sessionQueue,
│   │                         useStorageEstimate, useContentStorage
│   ├── download/             downloadTrack (save-as helper)
│   └── keyboard/             useGlobalShortcuts (Space, arrows, M, S, R, ?, Esc)
│
├── store/
│   ├── playerStore.ts        Playback state: queue, currentTrack, isPlaying, volume, shuffle, repeat
│   ├── uiStore.ts            UI state: mobile tab, theme, brightness
│   └── vaultStore.ts         Pod (persistent library) state
│
└── styles/
    ├── tokens.css            CSS variables — Paper Deck identity (--mb-*) + --sonata-* aliases
    ├── base.css              Reset + base typography (Inter + JetBrains Mono via @fontsource)
    ├── sonata.css            All component styles + NowPlayingHero + keyboard help overlay + touch targets
    └── responsive.css        Mobile breakpoints
```

## How Audio Playback Works

The `<audio>` element lives in `DesktopShell` or `MobileShell` (whichever is active). There is exactly **one** audio element per session. For local video files, `LocalVideoDeck` swaps the global audio singleton to point at the `<video>` element so the same engine drives playback.

### The global audio singleton (`core/audio/audioRef.ts`)

```
setGlobalAudio(el)   // called by useAudioEngine on mount; by LocalVideoDeck for video
getGlobalAudio()     // used by audioTogglePlayback, audioSeekTo, useMediaSession
```

`audioTogglePlayback()` and `audioSeekTo()` are plain functions (not hooks). They can be called from anywhere — transport buttons, keyboard shortcuts, Media Session handlers.

### Two ways to play a track

**1. Gesture-safe direct play — `playTrackNow(track)`**
Use this inside a click/tap handler on mobile (and desktop). It calls `audio.play()` synchronously inside the browser's user-gesture window, which is required by iOS/Android autoplay policy.

```ts
// Inside an onClick handler:
playTrackNow(track);
```

**2. Reactive load — via Zustand store `setCurrentTrack(track)`**
Changing `currentTrack` in the store triggers a `useEffect` in `useAudioEngine` that loads the new src and only calls `play()` if `isPlaying` was already true. Use this for programmatic track changes (skip, shuffle, queue advance) where autoplay policy does not apply because the previous track's play was already user-gesture-blessed.

### CRITICAL — Never set `audio.src = ''`

Setting the src to an empty string fires a browser `error` event. `handleError` catches that and calls `playNext()`, causing unintended track switching. To stop audio cleanly:

```ts
audio.pause();
audio.removeAttribute('src');
audio.load();  // Fires 'emptied', NOT 'error' — safe
```

### YouTube tracks

YouTube plays via an `<iframe>` rendered by `YoutubeEmbedPlayer`. The iframe src is force-rewritten to `youtube-nocookie.com` to avoid tracking cookies. The iframe carries a sandbox (`allow-scripts allow-same-origin allow-presentation allow-popups`) and `referrerPolicy="no-referrer"`. The `<audio>` element is silenced while a YouTube track is active. The app talks to the iframe via the YouTube IFrame API (`registerEmbedPlayer` in `embedPlayerBridge`).

### isPlaying state

`isPlaying` in the store is driven by the audio element's `onPlay` and `onPause` events (wired in the Shell components). It is the **only** reliable source of truth for whether audio is actually playing. Never set `isPlaying: true` manually without audio actually playing.

## State Architecture

### `playerStore.ts` — playback state

Key fields:
- `queue` — ordered list of `MorbitalTrack[]`
- `originalQueue` — unshuffled copy (restored when shuffle is turned off)
- `currentTrack` — the track currently loaded (may or may not be playing)
- `isPlaying` — mirrors the audio element via onPlay/onPause events
- `volume`, `isMuted`, `isRepeatOn`, `isShuffleOn`

Key actions:
- `addTracks(tracks[])` — adds to queue, selects first only if nothing was playing
- `setCurrentTrack(track)` — switches track, resets currentTime/duration
- `playNext()` / `playPrevious()` — advances queue, wraps around
- `eject()` — removes currentTrack, revokes objectUrl, deletes DB record
- `clearQueue()` — removes all tracks, revokes all objectUrls

### `uiStore.ts` — UI state

- `theme: 'dark' | 'light'` + `setTheme()` — persisted to localStorage, sets `data-theme` on `<html>`
- `mobileActiveTab` — which mobile tab is shown

## Theme System (Paper Deck identity)

Themes are controlled by the `data-theme` attribute on `<html>`:

```html
<html data-theme="dark">   <!-- Paper Deck — Ink (default) -->
<html data-theme="light">  <!-- Paper Deck — Paper -->
```

CSS variables are defined in `tokens.css`. **Never hardcode colors in components.** Always use `var(--sonata-*)` tokens, which are aliases over the `--mb-*` identity primitives.

Identity primitives (`--mb-*`):

| Token             | Value      | Role |
|-------------------|------------|------|
| `--mb-paper`      | `#f6efe3`  | light-mode background; dark-mode text |
| `--mb-paper-deep` | `#ebe2d2`  | panel cream |
| `--mb-walnut`     | `#3a2a1c`  | light-mode primary text |
| `--mb-walnut-soft`| `#6b5641`  | secondary text + rim accents |
| `--mb-rule`       | `#d9c9ad`  | hairlines, borders, hero art frame |
| `--mb-signal`     | `#c0392b`  | the one accent — active state, badge, LCD |
| `--mb-ink`        | `#14110d`  | dark-mode background, PWA theme color |

Sonata aliases (used by every component): `--sonata-bg`, `--sonata-panel`, `--sonata-text`, `--sonata-muted`, `--sonata-cyan`, `--sonata-blue`, `--sonata-violet`, etc. They resolve to the Paper Deck primitives. Keep using them — they are the stable contract.

## Keyboard mode

`core/keyboard/useGlobalShortcuts.ts` runs once at the App root. Bindings:

| Keys | Action |
|---|---|
| Space | Play / Pause |
| → / ← | Next / Previous track |
| Shift + → / ← | Seek ±10 s |
| ↑ / ↓ | Volume ±5% |
| M | Mute / Unmute |
| S | Shuffle |
| R | Repeat |
| ? | Toggle keyboard help overlay |
| Esc | Close any overlay |

Inputs (`<input>`, `<textarea>`, `contenteditable`) are ignored — typing in the library search will not pause playback.

## Media Session (lockscreen)

`core/audio/useMediaSession.ts` is wired in `App.tsx`. On every track change it sets `navigator.mediaSession.metadata` (title, artist, album, artwork) and registers action handlers for play, pause, next, previous, seek. Lockscreen / OS media keys / Bluetooth media buttons all flow through this hook.

The hook safely no-ops in browsers without `mediaSession` support.

## Wake Lock

`LocalVideoDeck.tsx` requests `navigator.wakeLock.request('screen')` while a local video is playing and releases it on pause / unmount. Wake Lock requests can be denied (e.g. background tab) — failure is swallowed silently.

## Adding a New Track Source

1. Add the new source type to `SourceType` in `playerStore.ts`.
2. Handle it in `useIngest.ts` — URL classifier + track factory.
3. Handle it in `audioEngine.ts` `useEffect` — decide whether to use the audio element or an iframe deck.
4. Update the source badge in `TrackReadout.tsx` and `NowPlayingHero.tsx`.

## PWA / Service Worker

- `vite.config.ts` uses `vite-plugin-pwa` with `registerType: 'autoUpdate'`.
- `workbox.skipWaiting: true` + `clientsClaim: true` — a new SW takes over immediately on deploy.
- `App.tsx` listens for `controllerchange` on the SW and shows a "Open Morbital updated" toast instead of force-reloading (we do not interrupt playback mid-track).

## Content Security Policy

`index.html` ships a strict CSP via `<meta http-equiv="Content-Security-Policy">`. Summary:

- `default-src 'self'`
- `connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com` — no analytics, no telemetry, no third-party API
- `frame-src https://www.youtube-nocookie.com https://www.youtube.com` — for YouTube embed
- `script-src 'self' https://www.youtube.com` — for the YouTube IFrame API
- `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` — required by Vite for `@fontsource` CSS injection
- `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`

Do not loosen the CSP without a real feature request that fails in the browser console. No silent CSP expansion.

## Local Track Storage Model

Tracks are session-only by default. `URL.createObjectURL(file)` makes a temporary blob URL that lives as long as the tab. IndexedDB holds lightweight metadata only (id, title, artist, etc.) — no audio blobs — to prevent storage accumulation.

The **Pod (Vault)** is an opt-in persistent library. Pod tracks are stored as full Blobs in a separate IndexedDB (`vaultDb`). Users add tracks to the Pod explicitly. The Pod is the only place audio blobs are persisted.

`URL.revokeObjectURL()` is called on `removeTrack`, `eject`, and `clearQueue` to free memory immediately.

## Common Mistakes to Avoid

| Mistake | Correct approach |
|---|---|
| `audio.src = ''` to stop audio | `audio.pause(); audio.removeAttribute('src'); audio.load()` |
| Calling `audio.play()` from useEffect on mobile | Use `playTrackNow()` inside the click handler |
| Setting `isPlaying: true` manually | Let `onPlay` event drive it |
| Hardcoding hex colors in components | Use `var(--sonata-*)` CSS tokens |
| Calling `setCurrentTrack()` when adding files in batch | Let `addTracks()` handle first-track selection |
| Using `useAudioEngine` in more than one component | Mount it only once — in DesktopShell or MobileShell |
| Adding a new outbound origin without updating CSP | The browser will block it. Update CSP **and** README "What Origins We Contact" together. |

## How to Contribute

See [CONTRIBUTING.md](./CONTRIBUTING.md) for what we accept, the commit style, and the local dev loop. Security issues go through [SECURITY.md](./SECURITY.md). The full license is [AGPL-3.0-or-later](./LICENSE).
