# Third-Party Notices

Open Morbital is distributed under the GNU Affero General Public License v3.0
(see [`LICENSE`](./LICENSE)). It includes and depends on third-party software
whose licenses are listed below.

All third-party licenses listed here have been reviewed for compatibility
with the AGPL-3.0 governing license. None of them prevent the combined work
from being distributed under the AGPL-3.0.

If you fork Open Morbital, please keep this file accurate. Adding a new
dependency means adding a row to the table below. Removing one means
removing the row.

---

## Bundled runtime components

These are shipped as part of the application either through `npm install` or
through the `public/vendor/` directory.

| Component | License | Notes |
|---|---|---|
| `@ffmpeg/ffmpeg` (JS wrapper) | MIT | JavaScript API around the WASM core. |
| `@ffmpeg/core` (WASM build of FFmpeg) | GPL-2.0-or-later | FFmpeg is GPL when built with the default flags used by `@ffmpeg/core`. The "or-later" provision permits use under GPL-3.0, which in turn is compatible with AGPL-3.0 via the cross-license clause of GPL-3.0 §13 and AGPL-3.0 §13. The combined work is therefore lawfully distributable under AGPL-3.0. |
| `@ffmpeg/util` | MIT | Small utility helpers used by the ffmpeg wrapper. |
| `react`, `react-dom` | MIT | UI framework. |
| `react-router-dom` | MIT | Client-side routing. |
| `zustand` | MIT | State management. |
| `dexie` | Apache-2.0 | IndexedDB wrapper. The Apache-2.0 license is one-way compatible with AGPL-3.0 (Apache code may be incorporated into AGPL-3.0 projects). |
| `jsmediatags` | BSD-3-Clause | Audio metadata parser. BSD-3-Clause is compatible with AGPL-3.0. |
| `lucide-react` | ISC | Icon set. ISC is functionally equivalent to MIT for compatibility purposes. |
| `@fontsource/inter` | OFL-1.1 | The Inter typeface. SIL Open Font License is permissive and compatible with AGPL-3.0 for accompanying software. |
| `@fontsource/jetbrains-mono` | OFL-1.1 | JetBrains Mono typeface. Same posture as Inter. |

## Build-time / development components

These are used to build the production output but are not shipped in the
runtime bundle.

| Component | License |
|---|---|
| `vite` | MIT |
| `@vitejs/plugin-react` | MIT |
| `vite-plugin-pwa` | MIT |
| `workbox-window` | MIT |
| `typescript` | Apache-2.0 |

## Notes on the FFmpeg WASM component

The FFmpeg WebAssembly binary distributed with this app is the unmodified
output of the upstream `@ffmpeg/core` package. We do not maintain a custom
FFmpeg build. Because that package is published under
**GPL-2.0-or-later**, the GPL's strong-copyleft obligations propagate to
this app. By distributing Open Morbital under the AGPL-3.0 (which is
explicitly compatible with GPL-3.0 and, via the "or-later" clause, with
GPL-2.0-or-later code that is upgraded to v3), we satisfy those
obligations. Any fork that ships `@ffmpeg/core` is in the same position
and must release its complete corresponding source under a compatible
copyleft license.

If your fork must avoid copyleft propagation from FFmpeg, the only safe
path is to remove `@ffmpeg/*` entirely (which means losing in-browser
audio transcoding, used by the local transcode feature when a file
codec is not natively supported by the browser).

## Reporting a license concern

If you believe Open Morbital is mishandling an upstream license, please
open a GitHub issue describing the concern with citations. License
hygiene is treated as a first-class correctness issue, not a paperwork
formality.
