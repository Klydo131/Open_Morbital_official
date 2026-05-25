# Security Notice and Acceptable Use

This file is a **use-terms supplement** that ships alongside the MIT License.
The MIT License governs distribution. This Notice describes the spirit in
which Open Morbital was built and the uses we ask you not to put it to.

By using, forking, or building on this codebase, you are asked — not legally
bound, but asked in good faith — to honor the following.

---

## 1. What Open Morbital is for

Open Morbital is a **local-first music player**. Its purpose is to bring joy
to people who love music. It is designed for:

- Personal listening to your own audio and video files
- Casual YouTube playback through the official IFrame API
- Saving a personal library on your own device
- Listening offline with a PWA install
- Hobbyist forking, learning, and modification

The common thread: **one human, one device, choosing music for themselves
or a small known group in a trusted setting.**

---

## 2. What Open Morbital is NOT for

Please do not use, fork, or repurpose this codebase for any of the following:

| Prohibited use | Why |
|---|---|
| Hidden analytics or covert telemetry | Open Morbital's README claims none. Any fork that adds them silently makes the README lie to the user. |
| Bot-driven playback automation | Open Morbital is built for humans listening. No headless playback farms, no view-count manipulation. |
| Scraping audio from YouTube, Spotify, or any platform | The embed APIs are not for download. Do not use this code's iframe handling as a starting point for stream extraction. |
| DRM bypass | Open Morbital does not attempt to strip protection. Forks must not either. |
| Surveillance or ambient listening | No microphone capture. No background audio recording. No room-monitoring. |
| Phishing or credential harvesting | No fake login screens dressed in this UI. |
| Silent file upload | Local files stay on the user's device. A fork that silently uploads them to a server is breaking the spirit of this code. |
| Mass distribution of unlicensed media | Open Morbital plays your own files. It is not a piracy distribution tool. |
| Dark patterns in feedback flows | The included `FeedbackPanel` is a sample. Do not weaponize it to harvest emails behind a "feedback" label. |
| Disguising commercial tracking as "diagnostic" | If you collect data, say so to the user, in plain language, before you collect it. |

---

## 3. Engineering-level expectations for forks

If you ship a public product built on this code, you are expected to keep
the following enforceable:

1. **No hidden network calls.** Every outbound request should be traceable to a
   user-visible feature. Audit `fetch`, `XMLHttpRequest`, `navigator.sendBeacon`,
   service-worker traffic.
2. **No silent upload of local media.** `localFile`, `objectUrl`, blob URLs,
   and IndexedDB blobs must not be transmitted off-device without explicit,
   informed user consent.
3. **No filesystem path leakage.** Do not store full filesystem paths in any
   feedback report, telemetry payload, or persistence layer.
4. **CSP discipline.** Do not add domains to the Content Security Policy
   without a real feature that needs them. No `script-src 'unsafe-eval'`,
   no `'unsafe-inline'` beyond what Vite or Workbox require.
5. **URL scheme validation.** Reject `javascript:`, `data:`, `file:`, and
   `blob:` schemes at URL-import boundaries. This codebase already does that;
   do not regress it.
6. **Honest UI.** If a button says "Save", it must save. If a toast says
   "loaded", something must have loaded. If the Settings panel claims "no
   analytics", there must be no analytics. The README claims must match the
   code.
7. **Disclose third-party origins.** If your fork contacts a new external
   service, document it. Users deserve to know which servers their browser
   talks to when they press play.

---

## 4. Honest engineering encouraged

This project tries to demonstrate that you can build a polished, useful music
player without:

- Tracking the user
- Uploading their files
- Hiding network calls behind feature labels
- Locking in features behind dark-pattern paywalls
- Manipulating defaults to harvest data

If you fork this, please carry that spirit forward. The point of releasing
this code is to make honest engineering a more visible option.

---

## 5. Reporting a security issue in this repo

If you find a security vulnerability in Open Morbital itself (not a fork),
please open a private GitHub Security Advisory on the repository rather than
filing a public issue. Disclose responsibly so a fix can ship before the
vulnerability is widely known.

---

## 6. No warranty

This code is provided under the MIT License. There is no warranty of any
kind, express or implied. The license text governs your legal rights. This
Notice describes the social contract we hope you will choose to honor.

---

*This Notice is intentionally not in the README. It is a separate document
that sits alongside the LICENSE, similar in spirit to a `NOTICE` file under
the Apache 2.0 license convention.*
