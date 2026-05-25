// SPDX-License-Identifier: AGPL-3.0-or-later
let _audioEl: HTMLMediaElement | null = null;
let _stickyAudioEl: HTMLAudioElement | null = null; // survives LocalVideoDeck cleanup
let _directPlaySrc: string | null = null;

export function setGlobalAudio(el: HTMLMediaElement | null): void {
  _audioEl = el;
  // Only update the sticky ref when we're setting a real <audio> element.
  // LocalVideoDeck passes an HTMLVideoElement (not HTMLAudioElement), so it will
  // never overwrite the sticky. And when it passes null on cleanup, the sticky
  // keeps pointing at the shell <audio> element so play() never returns silently.
  if (el instanceof HTMLAudioElement) _stickyAudioEl = el;
}

export function getGlobalAudio(): HTMLMediaElement | null {
  return _audioEl ?? _stickyAudioEl;
}

export function clearStickyAudio(): void { _stickyAudioEl = null; }

// Returns the shell <audio> element specifically. Used by code paths that
// must speak to the persistent audio element rather than the current owner.
export function getShellAudio(): HTMLAudioElement | null { return _stickyAudioEl; }

let _suppressNextPauseFlag = false;
// Set immediately before a programmatic pause/load so the onPause handler in
// the Shell can ignore the resulting pause and avoid clearing isPlaying.
export function suppressNextPause(): void { _suppressNextPauseFlag = true; }
export function consumeSuppressNextPause(): boolean {
  const v = _suppressNextPauseFlag;
  _suppressNextPauseFlag = false;
  return v;
}

// Set before calling audio.play() directly in a gesture handler so the
// useEffect knows to skip reloading that src (which would interrupt playback).
export function setDirectPlaySrc(src: string | null): void { _directPlaySrc = src; }
export function getDirectPlaySrc(): string | null { return _directPlaySrc; }
