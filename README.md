# Open Morbital

Open Morbital is a local-first retro-wave music player that runs in the browser. It does not require an account, analytics service, or cloud audio processing.

## What It Does

- Plays local audio and video files: MP3, FLAC, WAV, M4A, AAC, OGG, OPUS, MP4, and WebM.
- Saves a personal library on the user's own device with IndexedDB.
- Plays YouTube links inside the app.
- Provides an offline-capable PWA build for supported browsers.
- Includes online radio and shuffled playback from saved tracks.
- Stores workspace documents locally: PDF, Word, Excel, PowerPoint, TXT, CSV, and ZIP.
- Supports dark and light themes.

## Privacy And Safety

- Local files stay on the user's device unless the user explicitly opens an external URL.
- The app has no built-in analytics, telemetry, login, or cloud upload flow.
- YouTube playback and online radio contact their external providers when those features are used.
- Workspace documents are limited to known document/archive extensions and files up to 100 MB.
- Saved media files are limited to supported media types and files up to 500 MB.

### What Origins We Contact

Open Morbital is a static frontend. Outbound network traffic is limited to:

| Origin | When | Why |
|---|---|---|
| `fonts.googleapis.com`, `fonts.gstatic.com` | App boot | Inter + JetBrains Mono CSS/woff2 |
| `www.youtube-nocookie.com`, `www.youtube.com` | Only when you load a YouTube track | Iframe player + IFrame API |
| `i.ytimg.com` | Only when a YouTube track is loaded | Album-art thumbnail |

Any other outbound request is a bug — please report it via [SECURITY.md](./SECURITY.md). The Content Security Policy in `index.html` enforces this whitelist; the browser will block anything else.

## Keyboard Shortcuts

Open Morbital is keyboard-first. Press `?` anywhere to open the help overlay.

| Keys | Action |
|---|---|
| Space | Play / Pause |
| → / ← | Next / Previous track |
| Shift + → / ← | Seek ±10 s |
| ↑ / ↓ | Volume ±5% |
| M / S / R | Mute / Shuffle / Repeat |
| ? / Esc | Help / Close overlay |

Inputs (search, URL bar) are ignored — typing will not trigger shortcuts.

## Identity

The visual identity is **Paper Deck** — paper + walnut + signal-red, designed to feel like a handmade paper-and-walnut hi-fi rather than a spaceship. Dark mode = ink background + paper text + signal accent. Light mode = paper background + walnut text + signal accent. No neon, no glass, no spinning disc by default.

CSS tokens live in [`src/styles/tokens.css`](./src/styles/tokens.css). The seven identity primitives are `--mb-paper`, `--mb-paper-deep`, `--mb-walnut`, `--mb-walnut-soft`, `--mb-rule`, `--mb-signal`, `--mb-ink`. The `--sonata-*` tokens used by components are aliases over those primitives.

## Requirements

- Node.js 20 or newer.
- npm, which is included with Node.js.
- A modern browser such as Chrome, Edge, Firefox, or Safari.

## Run On Your Computer

From this project folder, install dependencies and start the local development server:

```bash
npm install
npm run dev
```

Vite will print a local address in the terminal. Open that address on the same computer to use the app.

On Windows, PowerShell may block `npm.ps1`. If that happens, run the same commands with `npm.cmd`:

```powershell
npm.cmd install
npm.cmd run dev
```

## Windows Helper Script

The helper script copies the project to a writable app workspace under the current user's local profile, installs dependencies there, and starts the app:

```powershell
.\run-local.ps1
```

This avoids installing packages inside cloud-synced folders, which can cause slow installs or file write warnings.

## Build A Production Copy

```bash
npm run build
npm run preview
```

The production files are written to `dist/`.

## Updating Dependencies Safely

```bash
npm audit
npm update
npm audit
npm run build
```

Commit both `package.json` and `package-lock.json` after dependency changes.

## Tech Stack

- React 18 + TypeScript
- Vite + Vite PWA
- Zustand
- Dexie / IndexedDB
- Lucide React
- FFmpeg WASM for local audio conversion

## License

**The package as a whole — including all source files, assets, build configuration, and documentation in this repository — is governed by the GNU Affero General Public License, version 3 (AGPL-3.0), or, at your option, any later version.**

Earlier revisions of this repository were released under the MIT License. The MIT License permits sublicensing, and the copyright holder has exercised that right to place the entire combined work (the original MIT-licensed sources and all subsequent modifications) under the stricter copyleft terms of the AGPL-3.0. The original MIT copyright notice is preserved verbatim inside the root [`LICENSE`](./LICENSE) file in compliance with the MIT notice-retention requirement; it documents the licensing history of portions of the code but does not loosen the governing license of the combined work.

In plain English: if you run a modified version of this software as a public network service, you must make the complete corresponding source code of your modifications available to that service's users under the same AGPL-3.0 license. The goal is to keep this codebase — and every fork built on it — honest, inspectable, and beyond capture by closed-source commercial wrappers.

For the full license text, see [`LICENSE`](./LICENSE). For acceptable-use terms that sit alongside the license, see [`SECURITY_NOTICE.md`](./SECURITY_NOTICE.md).

```
SPDX-License-Identifier: AGPL-3.0-or-later
Copyright (C) 2026 Klydo131 and contributors
```
