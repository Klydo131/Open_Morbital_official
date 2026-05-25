// SPDX-License-Identifier: AGPL-3.0-or-later
type EmbedControls = {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  getDuration: () => number;
  isPlaying: () => boolean;
};

let controls: EmbedControls | null = null;
let pendingPlay = false;

export function registerEmbedPlayer(nextControls: EmbedControls): () => void {
  controls = nextControls;
  if (pendingPlay) {
    pendingPlay = false;
    controls.play();
  }
  return () => {
    if (controls === nextControls) controls = null;
  };
}

export function playEmbedPlayer(): void {
  if (controls) {
    controls.play();
  } else {
    pendingPlay = true;
  }
}

export function pauseEmbedPlayer(): void {
  pendingPlay = false;
  controls?.pause();
}

export function toggleEmbedPlayback(): boolean {
  if (!controls) return false;
  if (controls.isPlaying()) {
    controls.pause();
  } else {
    controls.play();
  }
  return true;
}

export function seekEmbedToPercent(percent: number): boolean {
  if (!controls) return false;
  const duration = controls.getDuration();
  if (!Number.isFinite(duration) || duration <= 0) return true;
  controls.seekTo((Math.min(100, Math.max(0, percent)) / 100) * duration);
  return true;
}

export function clearPendingPlay(): void {
  pendingPlay = false;
}
