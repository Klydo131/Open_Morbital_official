// SPDX-License-Identifier: AGPL-3.0-or-later
import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js';

export type AudioMetadata = {
  title?: string;
  artist?: string;
  album?: string;
  albumArt?: string;
};

type PictureTag = {
  data: number[];
  format: string;
};

function pictureToDataUrl(picture?: PictureTag): string | undefined {
  if (!picture?.data?.length || !picture.format) return undefined;
  const bytes = new Uint8Array(picture.data);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return `data:${picture.format};base64,${window.btoa(binary)}`;
}

export function readAudioMetadata(file: File): Promise<AudioMetadata> {
  return new Promise((resolve) => {
    jsmediatags.read(file, {
      onSuccess: ({ tags }: { tags: Record<string, unknown> }) => {
        resolve({
          title: tags['title'] as string | undefined,
          artist: tags['artist'] as string | undefined,
          album: tags['album'] as string | undefined,
          albumArt: pictureToDataUrl(tags['picture'] as PictureTag | undefined),
        });
      },
      onError: () => resolve({}),
    });
  });
}
