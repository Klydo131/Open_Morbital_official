// SPDX-License-Identifier: AGPL-3.0-or-later
import { getGlobalAudio } from './audioRef';

const BAR_COUNT = 32;

let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let analyserConnected = false;
let source: MediaElementAudioSourceNode | null = null;
let sourceElement: HTMLMediaElement | null = null;
let frequencyData: Uint8Array<ArrayBuffer> | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextCtor = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextCtor) return null;
  audioContext ??= new AudioContextCtor();
  return audioContext;
}

export function ensureAudioAnalyser(): AnalyserNode | null {
  const audio = getGlobalAudio();
  const context = getAudioContext();
  if (!audio || !context) return null;

  if (!analyser) {
    analyser = context.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.72;
    frequencyData = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
  }

  // On mobile the AudioContext starts suspended. Connecting createMediaElementSource
  // before resuming routes audio through a silent suspended graph — audio.play()
  // succeeds but produces no sound. Resume first; skip connecting this call so the
  // browser outputs the audio directly. The next call (after resume) will connect.
  if (context.state === 'suspended') {
    void context.resume().catch(() => undefined);
    return null;
  }

  if (sourceElement !== audio) {
    source?.disconnect();
    try {
      source = context.createMediaElementSource(audio);
      source.connect(analyser);
      if (!analyserConnected) {
        analyser.connect(context.destination);
        analyserConnected = true;
      }
      sourceElement = audio;
    } catch {
      // Element already captured — mark it to prevent retry loops.
      sourceElement = audio;
    }
  }

  return analyser;
}

export function readAudioLevels(): number[] {
  const node = ensureAudioAnalyser();
  const data = frequencyData;
  if (!node || !data) return Array.from({ length: BAR_COUNT }, () => 0);

  node.getByteFrequencyData(data);
  const bucketSize = Math.max(1, Math.floor(data.length / BAR_COUNT));

  return Array.from({ length: BAR_COUNT }, (_, index) => {
    const start = index * bucketSize;
    const end = Math.min(data.length, start + bucketSize);
    let sum = 0;

    for (let i = start; i < end; i++) sum += data[i];

    const value = sum / Math.max(1, end - start) / 255;
    return Math.min(1, Math.max(0, value));
  });
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
