# Open Morbital — Developer Guide

## Stack

| Layer | Tech |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 6 |
| State | Zustand v5 |
| PWA | vite-plugin-pwa (Workbox) |
| Styling | Plain CSS + CSS custom properties |
| Icons | lucide-react |

---

## Project Structure

```
src/
├── app/
│   ├── App.tsx               Entry point — mobile/desktop split, theme init, PWA reload
│   └── routes/               Page-level route components (NowPlaying, Library, etc.)
│
├── components/
│   ├── layout/
│   │   ├── DesktopShell.tsx  Desktop wrapper — mounts <audio> element, all panels
│   │   ├── MobileShell.tsx   Mobile wrapper — mounts <audio> element, tab navigation
│   │   ├── TopStatusBar.tsx  Top bar: branding, online status, theme toggle
│   │   ├── Sidebar.tsx       Desktop left nav
│   │   ├── QueuePanel.tsx    Desktop right panel: track queue, eject, clear
│   │   └── BottomConsole.tsx Desktop bottom: progress bar + transport controls
│   │
│   ├── player/
│   │   ├── CDPlayer.tsx      Animated Open Morbital CD (layered HTML + SVG)
│   │   ├── TrackReadout.tsx  LCD-style track info display
│   │   ├── PlaybackHub.tsx   Desktop now-playing area (CD or iframe for embeds)
│   │   ├── ProgressBar.tsx   Seek bar
│   │   ├── TransportControls.tsx  Play/pause/skip/shuffle/repeat buttons
│   │   └── VolumeSlider.tsx  Volume + mute control
│   │
│   ├── mobile/
│   │   ├── MobilePlayerView.tsx  Mobile player tab (CD, transport, up-next)
│   │   ├── MobileLibraryView.tsx Mobile library tab (file picker, URL input, track list)
│   │   └── MobileQueueView.tsx   Mobile queue tab
│   │
│   ├── import/
│   │   └── DropZone.tsx      Drag-and-drop file area
│   │
│   └── shared/
│       ├── ConfirmDialog.tsx  Modal with "do not ask again" checkbox
│       └── Toast.tsx          Toast notification stack
│
├── core/
│   ├── audio/
│   │   ├── audioRef.ts       Module-level audio element singleton + directPlaySrc flag
│   │   ├── audioEngine.ts    useAudioEngine hook + playTrackNow() + toggle/seek helpers
│   │   └── usePersistence.ts Saves/restores volume and repeat from localStorage
│   │
│   ├── import/
│   │   ├── useIngest.ts      Handles file drops + URL parsing (YouTube/Spotify/direct)
│   │   └── metadataService.ts Reads ID3/MP4 tags from local audio files
│   │
│   └── storage/
│       └── db.ts             Thin IndexedDB wrapper (track record CRUD, no blobs)
│
├── store/
│   ├── playerStore.ts        All playback state: queue, currentTrack, isPlaying, volume…
│   └── uiStore.ts            UI state: mobile tab, theme, brightness
│
└── styles/
    ├── tokens.css            CSS variables — dark (Midnight Purple) + light (Silver Lavender)
    ├── base.css              CSS reset + base typography
    ├── sonata.css            All component styles (~1800 lines)
    └── responsive.css        Mobile breakpoints
```

---

## How Audio Playback Works

The `<audio>` element lives in `DesktopShell` or `MobileShell` (whichever is active). There is exactly **one** audio element per session.

### The global audio singleton (`audioRef.ts`)

```
setGlobalAudio(el)   ← called once on mount in useAudioEngine
getGlobalAudio()     ← used by playTrackNow, audioTogglePlayback, audioSeekTo
```

`audioTogglePlayback()` and `audioSeekTo()` are plain functions (not hooks) that can be called from anywhere — buttons, keyboard shortcuts, etc.

### Two ways to play a track

**1. Gesture-safe direct play — `playTrackNow(track)`**
Use this inside a click/tap handler on mobile (and desktop). It calls `audio.play()` synchronously within the browser's user-gesture window, which is required by iOS/Android autoplay policy.

```ts
// Inside onClick handler:
playTrackNow(track);
```

Internally it:
1. Sets `currentTrack` in the store
2. Sets `directPlaySrc` flag in audioRef
3. Sets `audio.src` + calls `audio.load()` + `audio.play()`
4. The useEffect sees the flag and skips reloading (which would interrupt playback)

**2. Reactive load — via Zustand store `setCurrentTrack(track)`**
Changing `currentTrack` in the store triggers a `useEffect` in `useAudioEngine`. It loads the new src but only calls `play()` if `isPlaying` was already `true`. Use this for programmatic track changes (skip, shuffle, etc.) where autoplay policy doesn't apply.

### CRITICAL — Never set `audio.src = ''`

Setting the src to an empty string fires a browser `error` event. `handleError` catches this and calls `playNext()`, causing unintended track switching. To stop audio cleanly, always use:

```ts
audio.pause();
audio.removeAttribute('src');
audio.load();  // Fires 'emptied', NOT 'error' — safe
```

### YouTube / Spotify tracks

These play via an `<iframe>` rendered in `PlaybackHub` / `MobilePlayerView`. The `<audio>` element is silenced (paused + src removed) while an embed track is active. The iframe handles its own playback — the app has no JS control over it.

### isPlaying state

`isPlaying` in the store is driven by the audio element's `onPlay` and `onPause` events (wired in the Shell components). It is the **only** reliable source of truth for whether audio is actually playing. Never set `isPlaying: true` manually without audio actually playing.

---

## State Architecture

### `playerStore.ts` — playback state

Key fields:
- `queue` — ordered list of `MorbitalTrack[]`
- `originalQueue` — unshuffled copy (restored when shuffle is turned off)
- `currentTrack` — the track currently loaded (may or may not be playing)
- `isPlaying` — mirrors `audio.paused` via onPlay/onPause events
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
- `brightness` — unused placeholder

---

## Theme System

Themes are controlled by the `data-theme` attribute on `<html>`:
```html
<html data-theme="dark">   <!-- Midnight Purple (default) -->
<html data-theme="light">  <!-- Silver Lavender -->
```

CSS variables are defined in `tokens.css`. **Never hardcode colors in components.** Always use `var(--sonata-*)` tokens.

Key token groups:
- `--sonata-bg`, `--sonata-panel`, `--sonata-glass` — backgrounds
- `--sonata-text`, `--sonata-muted`, `--sonata-dim` — text hierarchy
- `--sonata-cyan`, `--sonata-blue`, `--sonata-violet`, `--sonata-pink` — accents
- `--sonata-lcd-bg`, `--sonata-lcd-text` — LCD display colors
- `--sonata-cd-face-1/2`, `--sonata-cd-rim-a/b`, `--sonata-cd-hub-1/2` — CD layer colors
- `--sonata-bevel-top`, `--sonata-bevel-bot`, `--sonata-inset`, `--sonata-inset-deep` — hardware surface textures

---

## Adding a New Track Source

1. Add the new source type to `SourceType` in `playerStore.ts`
2. Handle it in `useIngest.ts` — URL classifier + track factory
3. Handle it in `audioEngine.ts` useEffect — decide whether to use audio element or iframe
4. Update source badges in `TrackReadout.tsx` and `MobilePlayerView.tsx`

---

## PWA / Service Worker

- `vite.config.ts` uses `vite-plugin-pwa` with `registerType: 'autoUpdate'`
- `workbox.skipWaiting: true` + `clientsClaim: true` — new SW takes over immediately on deploy
- `App.tsx` listens for `controllerchange` on the service worker and reloads once — users always get the latest version without manual reinstall

---

## Local Track Storage Model

Tracks are **session-only**. `URL.createObjectURL(file)` creates a temporary blob URL that lives while the tab is open. Nothing is persisted to disk. IndexedDB holds only lightweight track metadata records (id, title, artist, etc.) — no audio blobs. This prevents storage accumulation.

`URL.revokeObjectURL()` is called on `removeTrack`, `eject`, and `clearQueue` to free memory immediately.

---

## Common Mistakes to Avoid

| Mistake | Correct approach |
|---|---|
| `audio.src = ''` to stop audio | `audio.pause(); audio.removeAttribute('src'); audio.load()` |
| Calling `audio.play()` from useEffect on mobile | Use `playTrackNow()` inside the click handler |
| Setting `isPlaying: true` manually | Let `onPlay` event drive it |
| Hardcoding hex colors in components | Use `var(--sonata-*)` CSS tokens |
| Calling `setCurrentTrack()` when adding files in batch | Let `addTracks()` handle first-track selection |
| Using `useAudioEngine` in more than one component | Mount it only once — in DesktopShell or MobileShell |
