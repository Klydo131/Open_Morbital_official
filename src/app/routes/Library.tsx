// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from 'react';
import { Search, Music, PlusCircle } from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';
import { DropZone } from '../../components/import/DropZone';
import { useIngest } from '../../core/import/useIngest';
import { playTrackNow } from '../../core/audio/audioEngine';

export function LibraryRoute() {
  const [search, setSearch] = useState('');
  const queue = usePlayerStore((s) => s.queue);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const { handleFiles } = useIngest();

  const filtered = queue.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artist.toLowerCase().includes(search.toLowerCase()) ||
      t.album.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="sonata-route">
      <div className="sonata-route__header">
        <div className="sonata-route__title">Library</div>
        <div className="sonata-route__sub">{queue.length} track{queue.length !== 1 ? 's' : ''} in session</div>
      </div>

      <div className="sonata-search">
        <Search size={14} className="sonata-search__icon" />
        <input
          className="sonata-search__input"
          type="search"
          placeholder="Search tracks, artists, albums…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="sonata-scroll-row">
        <button className="sonata-chip sonata-chip--active">All</button>
        <button className="sonata-chip">Local</button>
        <button className="sonata-chip">URL</button>
      </div>

      {queue.length === 0 ? (
        <div style={{ maxWidth: 360 }}>
          <DropZone onFiles={(files) => void handleFiles(files)} />
          <p style={{ fontSize: 12, color: 'var(--sonata-dim)', marginTop: 12, textAlign: 'center' }}>
            Your library is empty. Drop audio files above or use the Import panel on the left.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--sonata-dim)', fontSize: 13 }}>No tracks match "{search}"</p>
      ) : (
        <div className="sonata-track-list">
          {filtered.map((track) => (
            <div
              key={track.id}
              className={`sonata-track-card${track.id === currentTrack?.id ? ' sonata-track-card--active' : ''}`}
              onClick={() => playTrackNow(track)}
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
              <div className="sonata-track-card__meta">
                <span className={`sonata-badge ${track.sourceType === 'local' ? 'sonata-badge--local' : 'sonata-badge--online'}`}>
                  {track.mediaKind === 'video' ? 'VIDEO' : track.sourceType === 'local' ? 'LOCAL' : 'ONLINE'}
                </span>
              </div>
              <button
                className="sonata-btn sonata-btn--ghost sonata-btn--sm"
                onClick={(e) => { e.stopPropagation(); playTrackNow(track); }}
                title="Play"
              >
                <PlusCircle size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
