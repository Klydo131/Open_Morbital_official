// SPDX-License-Identifier: AGPL-3.0-or-later
import { Search, Music, Plus, Link } from 'lucide-react';
import { useState, useRef } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';
import { DropZone } from '../import/DropZone';
import { useIngest } from '../../core/import/useIngest';
import { playTrackNow } from '../../core/audio/audioEngine';

export function MobileLibraryView() {
  const [search, setSearch] = useState('');
  const [urlValue, setUrlValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const queue = usePlayerStore((s) => s.queue);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const urlStatus = usePlayerStore((s) => s.urlStatus);
  const { setMobileActiveTab } = useUIStore();
  const { handleFiles, handleUrl } = useIngest();

  const filtered = queue.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artist.toLowerCase().includes(search.toLowerCase()),
  );

  const submitUrl = () => {
    if (urlValue.trim()) {
      void handleUrl(urlValue.trim());
      setUrlValue('');
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* Search */}
      <div className="sonata-search" style={{ marginBottom: 12 }}>
        <Search size={14} className="sonata-search__icon" />
        <input
          className="sonata-search__input"
          type="search"
          placeholder="Search tracks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Add File row — always visible */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
        <button
          className="sonata-btn sonata-btn--ghost sonata-btn--sm"
          onClick={() => inputRef.current?.click()}
          title="Add local audio or video files"
          style={{ whiteSpace: 'nowrap' }}
        >
          <Plus size={13} />
          Add File
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.mp4,.wav,.flac,.m4a,.aac,.ogg,.opus,.webm,audio/*,video/mp4,video/webm"
          multiple
          style={{ position: 'fixed', left: -9999, width: 1, height: 1, opacity: 0 }}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) {
              void handleFiles(files);
              setMobileActiveTab('player');
            }
            e.target.value = '';
          }}
        />
        <input
          className="sonata-input"
          style={{ flex: 1, minWidth: 0 }}
          type="url"
          placeholder="YouTube / Direct URL…"
          value={urlValue}
          onChange={(e) => setUrlValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submitUrl(); }}
        />
        <button
          className="sonata-btn sonata-btn--cyan sonata-btn--sm"
          onClick={submitUrl}
          title="Add URL"
        >
          <Link size={13} />
        </button>
      </div>

      {urlStatus && (
        <div
          className={`sonata-url-status${
            urlStatus.toLowerCase().includes('could not') || urlStatus.toLowerCase().includes('not a valid')
              ? ' sonata-url-status--error'
              : urlStatus.toLowerCase().includes('added')
              ? ' sonata-url-status--success'
              : ''
          }`}
          style={{ marginBottom: 8 }}
        >
          {urlStatus}
        </div>
      )}

      {/* Empty state or track list */}
      {queue.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <DropZone onFiles={(files) => void handleFiles(files)} />
        </div>
      ) : (
        <div className="sonata-track-list">
          {filtered.map((track) => (
            <div
              key={track.id}
              className={`sonata-track-card${track.id === currentTrack?.id ? ' sonata-track-card--active' : ''}`}
              onClick={() => {
                playTrackNow(track);
                setMobileActiveTab('player');
              }}
            >
              <div className="sonata-track-card__art">
                {track.albumArt
                  ? <img src={track.albumArt} alt={track.title} />
                  : <Music size={18} style={{ color: 'var(--sonata-dim)' }} />
                }
              </div>
              <div className="sonata-track-card__info">
                <div className="sonata-track-card__title">{track.title}</div>
                <div className="sonata-track-card__artist">{track.artist}</div>
              </div>
              <span className={`sonata-badge ${track.sourceType === 'local' ? 'sonata-badge--local' : 'sonata-badge--online'}`}>
                {track.mediaKind === 'video' ? 'VIDEO'
                  : track.sourceType === 'local' ? 'LOCAL'
                  : track.sourceType === 'youtube' ? 'YOUTUBE'
                  : 'ONLINE'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
