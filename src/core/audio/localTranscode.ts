// SPDX-License-Identifier: AGPL-3.0-or-later
import type { MorbitalTrack } from '../../store/playerStore';

let ffmpegPromise: Promise<import('@ffmpeg/ffmpeg').FFmpeg> | null = null;

function getFileExt(fileName: string): string {
  return fileName.match(/\.([^.]+)$/)?.[1]?.toLowerCase() ?? 'm4a';
}

async function getFfmpeg() {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
        import('@ffmpeg/ffmpeg'),
        import('@ffmpeg/util'),
      ]);
      const ffmpeg = new FFmpeg();
      const workerURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/umd/814.ffmpeg.js';
      const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd';

      const loaded = await ffmpeg.load({
        classWorkerURL: await toBlobURL(workerURL, 'text/javascript'),
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      if (!loaded && !ffmpeg.loaded) {
        throw new Error('Local converter could not load.');
      }

      return ffmpeg;
    })();
  }

  return ffmpegPromise;
}

export async function transcodeLocalAudioToAac(track: MorbitalTrack): Promise<string | null> {
  if (!track.localFile || track.mediaKind === 'video') return null;

  const ffmpeg = await getFfmpeg();
  const inputName = `input-${track.id}.${getFileExt(track.fileName)}`;
  const outputName = `sonata-${track.id}.m4a`;
  const inputBytes = new Uint8Array(await track.localFile.arrayBuffer());

  await ffmpeg.writeFile(inputName, inputBytes);
  const exitCode = await ffmpeg.exec([
    '-i', inputName,
    '-vn',
    '-c:a', 'aac',
    '-b:a', '256k',
    '-movflags', 'faststart',
    outputName,
  ], 90000);

  if (exitCode !== 0) return null;

  const output = await ffmpeg.readFile(outputName);
  await Promise.allSettled([
    ffmpeg.deleteFile(inputName),
    ffmpeg.deleteFile(outputName),
  ]);

  const bytes = typeof output === 'string' ? new TextEncoder().encode(output) : output;
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return URL.createObjectURL(new Blob([buffer], { type: 'audio/mp4' }));
}
