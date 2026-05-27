# Security Policy

Open Morbital is a local-first music player. It runs entirely in the user's browser, makes no outbound network requests beyond what the user explicitly initiates (loading a YouTube iframe) and the app shell (Google Fonts CSS at boot), and stores nothing on a remote server.

This file describes how to report a security issue you find in Open Morbital.

## Supported versions

| Version | Status            |
|---------|-------------------|
| 1.0.x   | actively supported |
| < 1.0   | not supported     |

## What counts as a security issue

- Cross-site scripting (XSS), code injection, prototype pollution
- Anything that exfiltrates a user's local file, library, or browsing data
- Any way to make Open Morbital perform an outbound network request without the user's explicit action (e.g. silent telemetry, third-party tracking)
- Any way to bypass the Content Security Policy declared in `index.html`
- Any way the PWA installation can be used to phish or spoof the user
- Supply-chain concerns about a direct dependency

We treat anything that violates the README's privacy claims ("no account, no upload, no tracking") as a security issue, not a feature request.

## What does **not** count as a security issue

- Bugs in the YouTube iframe itself (those go to YouTube)
- A user choosing to paste a malicious URL into the URL bar (the app sandboxes the iframe; we cannot prevent the user from clicking through to a third party's site)
- A user dropping malware into the file picker (the browser, not Open Morbital, decides whether to execute it; Open Morbital only reads audio/video metadata)

## How to report

Open a private security advisory on GitHub:

    https://github.com/Klydo131/Open_Morbital_official/security/advisories/new

Do **not** open a public issue for a vulnerability.

We aim to acknowledge a report within **7 calendar days**. A fix or mitigation timeline depends on severity; we will keep you posted on the advisory thread.

## What you can expect

- A reply confirming we received the report.
- A reproduction step or a request for more information if needed.
- A patch released as soon as we can ship one.
- Credit in the release notes if you want it (default: no credit unless you request).
- We do **not** offer a bug bounty. Open Morbital is volunteer-maintained, AGPL-3.0, non-commercial.
