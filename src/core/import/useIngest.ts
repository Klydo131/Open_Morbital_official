// SPDX-License-Identifier: AGPL-3.0-or-later
// ============================================================================
// INGEST — URL and file import entry point
// ============================================================================
// This module is the trust boundary between user input and the player.
// Everything that becomes a playable track in Open Morbital passes through
// here. Treat it accordingly.
//
// SECURITY RULES (do not regress):
//   1. Reject URL schemes other than https: for direct URL playback.
//   2. Reject javascript:, data:, file:, blob: schemes at the import boundary.
//      They are vectors for XSS, local file enumeration, and CSP bypass.
//   3. Validate YouTube video IDs against /^[A-Za-z0-9_-]{11}$/ before
//      constructing an embed URL — otherwise a malicious URL with embedded
//      query/fragment can hijack the iframe.
//   4. Never auto-download or auto-fetch a URL the user did not explicitly
//      paste/drop. No URL-shortener expansion. No "preview" calls in the
//      background. Every network call here must be traceable to a gesture.
//   5. Do not log file system paths, file names, or URL contents to telemetry.
//      The privacy notice in the README claims this; the code must keep it.
//
// If you fork Open Morbital and add new ingestion sources (Soundcloud,
// IPFS, etc.), they must satisfy all five rules above before merging.
// ============================================================================

import { useCallback } from 'react';
import { usePlayerStore, type MorbitalTrack } from '../../store/playerStore';
import { readAudioMetadata } from './metadataService';
import { playTrackNow } from '../audio/audioEngine';
import { transcodeLocalAudioToAac } from '../audio/localTranscode';

const ACCEPTED_TYPES = new Set([
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/flac',
  'audio/x-flac',
  'audio/mp4',
  'video/mp4',
  'audio/aac',
  'audio/x-aac',
  'audio/x-m4a',
  'audio/ogg',
  'audio/vorbis',
  'audio/webm',
  'video/webm',
]);

const ACCEPTED_EXT = ['.mp3', '.wav', '.flac', '.m4a', '.mp4', '.aac', '.ogg', '.opus', '.webm', '.alac'];
const MAX_FALLBACK_DATA_URL_BYTES = 75 * 1024 * 1024;
const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB hard cap per file

function getFileExt(file: File): string {
  const match = file.name.toLowerCase().match(/\.[^.]+$/);
  return match?.[0] ?? '';
}

function isSupportedAudio(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_TYPES.has(file.type) || ACCEPTED_EXT.some((ext) => name.endsWith(ext));
}

function getMediaKind(file: File): MorbitalTrack['mediaKind'] {
  if (file.type.startsWith('video/')) return 'video';
  const name = file.name.toLowerCase();
  if (name.endsWith('.mp4') || name.endsWith('.webm')) return 'video';
  return 'audio';
}

function getPlayableMimeType(file: File, mediaKind: MorbitalTrack['mediaKind']): string {
  const fileType = file.type.toLowerCase();
  const ext = getFileExt(file);

  if (ext === '.m4a') return 'audio/mp4';
  if (ext === '.mp4') return mediaKind === 'video' ? 'video/mp4' : 'audio/mp4';
  if (ext === '.aac') return 'audio/aac';
  if (ext === '.mp3') return 'audio/mpeg';
  if (ext === '.wav') return 'audio/wav';
  if (ext === '.flac') return 'audio/flac';
  if (ext === '.ogg' || ext === '.opus') return 'audio/ogg';
  if (ext === '.webm') return mediaKind === 'video' ? 'video/webm' : 'audio/webm';

  if (!fileType || fileType === 'application/octet-stream' || fileType === 'binary/octet-stream') {
    return mediaKind === 'video' ? 'video/mp4' : 'audio/mp4';
  }

  return fileType;
}

function createPlayableObjectUrl(file: File, mediaKind: MorbitalTrack['mediaKind']): { objectUrl: string; mimeType: string } {
  const mimeType = getPlayableMimeType(file, mediaKind);
  const shouldNormalizeBlob =
    !file.type ||
    file.type === 'application/octet-stream' ||
    file.type === 'binary/octet-stream' ||
    file.type.toLowerCase() === 'audio/x-m4a' ||
    file.type.toLowerCase() !== mimeType;

  const playableBlob = shouldNormalizeBlob ? new Blob([file], { type: mimeType }) : file;
  return {
    objectUrl: URL.createObjectURL(playableBlob),
    mimeType,
  };
}

function shouldPrepareDataUrlFallback(file: File, mediaKind: MorbitalTrack['mediaKind']): boolean {
  if (mediaKind === 'video') return false;
  if (file.size > MAX_FALLBACK_DATA_URL_BYTES) return false;
  const ext = getFileExt(file);
  return ext === '.m4a' || ext === '.aac';
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('File fallback conversion failed.'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('File fallback conversion failed.'));
    reader.readAsDataURL(file);
  });
}

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

function getYoutubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    let id: string | null = null;
    if (host === 'youtu.be') {
      id = parsed.pathname.slice(1).split('/')[0] || null;
    } else if (host === 'youtube.com' || host === 'music.youtube.com') {
      const v = parsed.searchParams.get('v');
      if (v) {
        id = v;
      } else {
        const match = parsed.pathname.match(/\/(shorts|embed)\/([^/?]+)/);
        if (match) id = match[2];
      }
    }
    return id && YOUTUBE_ID_RE.test(id) ? id : null;
  } catch {
    return null;
  }
}

function getYoutubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

function getYoutubeEmbedUrl(videoId: string): string {
  const params = new URLSearchParams({
    enablejsapi: '1',
    origin: window.location.origin,
    rel: '0',
  });
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
}

function splitYoutubeTitle(title: string): { title: string; artist: string } {
  const clean = title.replace(/\s+-\s+YouTube$/i, '').trim();
  const parts = clean.split(/\s+-\s+/);
  if (parts.length >= 2) {
    return {
      artist: parts[0].trim() || 'YouTube',
      title: parts.slice(1).join(' - ').trim() || clean,
    };
  }
  return { title: clean || 'YouTube video', artist: 'YouTube' };
}

async function fetchYoutubeMetadata(videoId: string): Promise<Pick<MorbitalTrack, 'title' | 'artist' | 'album' | 'albumArt'> | null> {
  const endpoint = new URL('https://www.youtube.com/oembed');
  endpoint.searchParams.set('url', getYoutubeWatchUrl(videoId));
  endpoint.searchParams.set('format', 'json');

  try {
    const response = await fetch(endpoint);
    if (!response.ok) return null;
    const data = await response.json() as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
    };
    const fallback = splitYoutubeTitle(data.title ?? '');
    return {
      title: fallback.title,
      artist: data.author_name?.trim() || fallback.artist,
      album: 'YouTube',
      albumArt: data.thumbnail_url,
    };
  } catch {
    return null;
  }
}

type UrlKind = 'youtube' | 'direct' | 'unsupported';
type HandleFilesOptions = { playFirst?: boolean };

function classifyUrl(url: string): { kind: UrlKind; reason?: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { kind: 'unsupported', reason: 'That is not a valid URL.' };
  }
  const host = parsed.hostname.replace(/^www\./, '');
  if (host === 'youtube.com' || host === 'youtu.be' || host.endsWith('.youtube.com')) {
    return { kind: 'youtube' };
  }
  if (host === 'spotify.com' || host.endsWith('.spotify.com')) {
    return { kind: 'unsupported', reason: 'Spotify links are not supported. Add local files or paste a YouTube URL.' };
  }
  if (host === 'soundcloud.com' || host.endsWith('.soundcloud.com')) {
    return { kind: 'unsupported', reason: 'SoundCloud links cannot be played directly. Use a direct .mp3/.wav/.flac URL.' };
  }
  return { kind: 'direct' };
}

export function useIngest() {
  const { addTracks, setCurrentTrack, setIsPlaying, setUrlDraft, setUrlStatus, addToast, updateTrack } = usePlayerStore();

  const handleFiles = useCallback(async (files: File[], options: HandleFilesOptions = {}) => {
    const oversized = files.filter((f) => f.size > MAX_FILE_SIZE_BYTES);
    if (oversized.length > 0) {
      addToast(`${oversized.length} file${oversized.length > 1 ? 's' : ''} exceed the 500 MB limit and were skipped`, 'error');
    }
    const validFiles = files.filter(isSupportedAudio).filter((f) => f.size <= MAX_FILE_SIZE_BYTES);
    const rejected = files.filter((f) => f.size <= MAX_FILE_SIZE_BYTES).length - validFiles.length;

    if (!validFiles.length) {
      addToast('No supported audio files (.mp3 .mp4 .wav .flac .m4a .aac .ogg)', 'error');
      return;
    }
    if (rejected > 0) {
      addToast(`${rejected} unsupported file${rejected > 1 ? 's' : ''} skipped`, 'info');
    }

    const existingFileNames = new Set(usePlayerStore.getState().queue.map((t) => t.fileName));
    const uniqueFiles = validFiles.filter((f) => !existingFileNames.has(f.name));
    const duplicates = validFiles.length - uniqueFiles.length;

    if (!uniqueFiles.length) {
      addToast('All selected tracks are already in the queue', 'info');
      return;
    }
    if (duplicates > 0) {
      addToast(`${duplicates} duplicate${duplicates > 1 ? 's' : ''} skipped`, 'info');
    }

    const createdAt = Date.now();
    const tracks = uniqueFiles.map((file, index): MorbitalTrack => {
      const mediaKind = getMediaKind(file);
      const playable = createPlayableObjectUrl(file, mediaKind);

      return {
        id: crypto.randomUUID(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Local file',
        album: 'Unknown Album',
        fileName: file.name,
        mimeType: playable.mimeType,
        localFile: file,
        objectUrl: playable.objectUrl,
        sourceType: 'local',
        mediaKind,
        createdAt: createdAt + index,
      };
    });

    addTracks(tracks);
    if (options.playFirst && tracks[0]) {
      playTrackNow(tracks[0]);
    }
    addToast(`Added ${tracks.length} track${tracks.length > 1 ? 's' : ''}`, 'success');

    void Promise.all(
      tracks.map(async (track, index) => {
        const file = uniqueFiles[index];

        // Proactively transcode .alac files — browser cannot decode Apple Lossless
        if (getFileExt(file) === '.alac') {
          addToast(`Converting "${track.title}" to AAC for playback…`, 'info');
          transcodeLocalAudioToAac(track)
            .then((url) => {
              if (url) updateTrack(track.id, { transcodedObjectUrl: url, mimeType: 'audio/mp4' });
            })
            .catch(() => undefined);
        }

        if (shouldPrepareDataUrlFallback(file, track.mediaKind)) {
          readFileAsDataUrl(file)
            .then((fallbackDataUrl) => updateTrack(track.id, { fallbackDataUrl }))
            .catch(() => undefined);
        }

        const meta = await readAudioMetadata(file);
        updateTrack(track.id, {
          title: meta.title ?? track.title,
          artist: meta.artist ?? track.artist,
          album: meta.album ?? track.album,
          albumArt: meta.albumArt,
        });
      }),
    );
  }, [addTracks, addToast, updateTrack]);

  const handleUrl = useCallback(async (url: string) => {
    const clean = url.trim();
    if (!clean) return;

    const { kind, reason } = classifyUrl(clean);

    if (kind === 'unsupported') {
      setUrlStatus(reason ?? 'This URL is not supported.');
      return;
    }

    const existingUrls = new Set(usePlayerStore.getState().queue.map((t) => t.sourceUrl ?? ''));

    if (kind === 'youtube') {
      const videoId = getYoutubeVideoId(clean);
      if (!videoId) {
        setUrlStatus('Could not parse a YouTube video ID from that URL.');
        return;
      }
      const embedUrl = getYoutubeEmbedUrl(videoId);
      if (existingUrls.has(embedUrl)) {
        addToast('This YouTube video is already in the queue', 'info');
        return;
      }
      const metadata = await fetchYoutubeMetadata(videoId);
      const track: MorbitalTrack = {
        id: `yt-${videoId}`,
        title: `YouTube - ${videoId}`,
        artist: 'YouTube',
        album: 'YouTube',
        fileName: `youtube-${videoId}`,
        sourceUrl: embedUrl,
        sourceType: 'youtube',
        mediaKind: 'video',
        createdAt: Date.now(),
      };
      if (metadata) Object.assign(track, metadata);
      setIsPlaying(false);
      addTracks([track]);
      setCurrentTrack(track);
      setUrlDraft('');
      setUrlStatus('YouTube video added. Press Play when you are ready.');
      addToast('YouTube video added', 'success');
      return;
    }

    if (existingUrls.has(clean)) {
      addToast('This URL is already in the queue', 'info');
      return;
    }
    const fileName = decodeURIComponent(clean.split('/').pop()?.split('?')[0] ?? 'Network audio');
    const track: MorbitalTrack = {
      id: `url-${crypto.randomUUID()}`,
      title: fileName.replace(/\.[^/.]+$/, '') || 'Network audio',
      artist: 'Direct URL',
      album: 'Open Morbital',
      fileName,
      sourceUrl: clean,
      sourceType: 'url',
      mediaKind: 'audio',
      createdAt: Date.now(),
    };

    setIsPlaying(false);
    addTracks([track]);
    setCurrentTrack(track);
    setUrlDraft('');
    setUrlStatus('URL added. Press Play when you are ready.');
    addToast('URL track added', 'success');
  }, [addTracks, setCurrentTrack, setIsPlaying, setUrlDraft, setUrlStatus, addToast]);

  return { handleFiles, handleUrl };
}
