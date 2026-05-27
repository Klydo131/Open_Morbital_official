# Contributing to Open Morbital

Thanks for your interest. Open Morbital is a local-first music player. Contributions are welcome, but the project moves slowly on purpose — every PR is reviewed against a small set of hard rules before it can land.

## Project posture

Open Morbital ships:

- No account, no login, no upload, no server-side anything.
- No analytics, no telemetry, no third-party tracking SDKs — ever.
- No crash reporting service.
- Audio and video files stay on the user's device.

A PR that adds any of those things will not be merged. There is no "opt-in telemetry" option. If you want analytics in your fork, that is what forks are for.

## Local dev setup

You need Node 18+ and npm.

```
git clone https://github.com/Klydo131/Open_Morbital_official.git
cd Open_Morbital_official
npm install
npm run dev
```

To verify a clean build before opening a PR:

```
npx tsc --noEmit
npm run build
```

Both must exit 0.

## What we accept

- Bug fixes with a clear reproduction.
- Accessibility improvements (keyboard, screen reader, contrast).
- Performance fixes that don't bloat the bundle.
- Documentation improvements.
- New keyboard shortcuts (existing list is in the in-app `?` help overlay).
- Open-source-friendly enhancements that don't add a server dependency.

## What we will probably reject

- Anything that adds a network dependency that wasn't there before. The Content Security Policy in `index.html` is intentionally tight. If your feature needs a new origin, talk to us in an issue first.
- Account / login / cloud sync.
- Large new dependencies. A 200 KB package for something twenty lines of vanilla code can do is not a good trade.
- Visual changes that lose accessibility.

## Commit style

- One logical change per commit.
- Subject line ≤ 72 chars.
- Body explains *why*, not *what*.

## Code style

- TypeScript strict; `npx tsc --noEmit` must pass before commit.
- React function components only.
- Zustand for state.
- Plain CSS with `--sonata-*` tokens; no Tailwind, no styled-components.

## Code of Conduct

By participating you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md). The short version: treat people like people.

## License

Open Morbital is AGPL-3.0-or-later. By submitting a PR you agree your contribution is licensed under the same terms. If you do not own the code you are submitting, do not submit it.

## Security

Found a vulnerability? Do **not** open a public issue. See [SECURITY.md](SECURITY.md).
