// SPDX-License-Identifier: AGPL-3.0-or-later
import { SkipBack, Play, Pause, SkipForward, Shuffle, Repeat, Library, Maximize2, Minimize2, ArrowLeft, ChevronLeft, ChevronRight, Expand, Shrink, Download, CheckCircle, Loader, FolderOpen } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { CDPlayer } from './CDPlayer';
import { ProgressBar } from './ProgressBar';
import { YoutubeEmbedPlayer } from './YoutubeEmbedPlayer';
import { LocalVideoDeck } from './LocalVideoDeck';
import { usePlayerStore } from '../../store/playerStore';
import { audioTogglePlayback, audioSeekTo, playTrackNow } from '../../core/audio/audioEngine';
import { downloadTrackForOffline } from '../../core/download/downloadTrack';
import { useUIStore, type ActiveTab } from '../../store/uiStore';

type PlayHint = 'play' | 'pause' | null;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function readableTitle(raw: string | undefined): string {
  if (!raw) return 'No track loaded';
  return UUID_RE.test(raw) ? 'Local Track' : raw;
}

type Props = {
  onTabChange: (tab: ActiveTab) => void;
};

export function MobilePlayerView({ onTabChange }: Props) {
  const reelRef = useRef<HTMLDivElement>(null);
  const [reelControlsVisible, setReelControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reelFill, setReelFill] = useState(false);
  const [playHint, setPlayHint] = useState<PlayHint>(null);
  const hintTimerRef = useRef(0);
  const touchStart = useRef({ y: 0, x: 0 });
  const didSwipe = useRef(false);
  const reAddInputRef = useRef<HTMLInputElement>(null);

  const handleReAddFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !currentTrack) return;
    const objectUrl = URL.createObjectURL(file);
    updateTrack(currentTrack.id, { localFile: file, objectUrl, needsReAdd: false });
  };

  // Deck swipe state (for non-video tracks)
  const deckTouchStartX = useRef(0);
  const [deckOffset, setDeckOffset] = useState(0);
  const [deckDragging, setDeckDragging] = useState(false);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const conversionStatus = usePlayerStore((s) => s.conversionStatus);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isShuffleOn = usePlayerStore((s) => s.isShuffleOn);
  const isRepeatOn = usePlayerStore((s) => s.isRepeatOn);
  const queue = usePlayerStore((s) => s.queue);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const setRepeatOn = usePlayerStore((s) => s.setRepeatOn);
  const playNext = usePlayerStore((s) => s.playNext);
  const playPrevious = usePlayerStore((s) => s.playPrevious);
  const updateTrack = usePlayerStore((s) => s.updateTrack);

  const isEmbedTrack = currentTrack?.sourceType === 'youtube';
  const isLocalVideo = currentTrack?.sourceType === 'local' && currentTrack.mediaKind === 'video';
  const isVideoTrack = isEmbedTrack || isLocalVideo;
  const upNext = queue.slice(0, 3).filter((t) => t.id !== currentTrack?.id);
  const currentQueueIndex = queue.findIndex((t) => t.id === currentTrack?.id);
  const hasPrev = currentQueueIndex > 0;
  const hasNext = currentQueueIndex < queue.length - 1;

  useEffect(() => { setReelFill(false); }, [currentTrack?.id]);

  useEffect(() => {
    if (!isVideoTrack) return undefined;
    setReelControlsVisible(!isPlaying);
    if (!isPlaying) return undefined;

    const timer = window.setTimeout(() => setReelControlsVisible(false), 650);
    return () => window.clearTimeout(timer);
  }, [isPlaying, isVideoTrack, currentTrack?.id]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(document.fullscreenElement === reelRef.current);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const showReelControls = () => {
    setReelControlsVisible(true);
    if (!isPlaying) return;
    window.setTimeout(() => setReelControlsVisible(false), 2200);
  };

  const toggleReelFullscreen = () => {
    const reel = reelRef.current;
    if (!reel) return;
    if (document.fullscreenElement === reel) {
      void document.exitFullscreen?.();
      return;
    }
    void reel.requestFullscreen?.();
  };

  const flashHint = (which: 'play' | 'pause') => {
    window.clearTimeout(hintTimerRef.current);
    setPlayHint(which);
    hintTimerRef.current = window.setTimeout(() => setPlayHint(null), 700);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { y: e.touches[0].clientY, x: e.touches[0].clientX };
    didSwipe.current = false;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (queue.length <= 1) return;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    if (Math.abs(dy) > 55 && Math.abs(dy) > Math.abs(dx) * 1.3) {
      didSwipe.current = true;
      if (dy < 0) playNext();
      else playPrevious();
    } else if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      didSwipe.current = true;
      if (dx < 0) playNext();
      else playPrevious();
    }
  };

  const handleReelTap = () => {
    if (didSwipe.current) { didSwipe.current = false; return; }
    showReelControls();
    if (isEmbedTrack) return;
    void audioTogglePlayback();
    flashHint(isPlaying ? 'pause' : 'play');
  };

  // Deck swipe handlers (non-video player)
  const DECK_SWIPE_THRESHOLD = 68;

  const handleDeckTouchStart = (e: React.TouchEvent) => {
    deckTouchStartX.current = e.touches[0].clientX;
    setDeckDragging(true);
  };

  const handleDeckTouchMove = (e: React.TouchEvent) => {
    if (queue.length <= 1) return;
    setDeckOffset(e.touches[0].clientX - deckTouchStartX.current);
  };

  const handleDeckTouchEnd = () => {
    setDeckDragging(false);
    if (queue.length <= 1) { setDeckOffset(0); return; }
    if (deckOffset < -DECK_SWIPE_THRESHOLD) {
      setDeckOffset(-window.innerWidth);
      window.setTimeout(() => { playNext(); setDeckOffset(0); }, 210);
    } else if (deckOffset > DECK_SWIPE_THRESHOLD) {
      setDeckOffset(window.innerWidth);
      window.setTimeout(() => { playPrevious(); setDeckOffset(0); }, 210);
    } else {
      setDeckOffset(0);
    }
  };

  // Only apply inline style while dragging or animating out — clear it at rest so
  // the CSS sonata-deck-cd-in animation can fire unobstructed on the incoming track.
  const deckSwipeStyle: React.CSSProperties =
    deckOffset === 0 && !deckDragging
      ? { cursor: queue.length > 1 ? 'grab' : undefined }
      : {
          transform: `translateX(${deckOffset}px) rotate(${deckOffset * 0.045}deg)`,
          opacity: Math.max(0, 1 - Math.abs(deckOffset) / 260),
          transition: deckDragging
            ? 'none'
            : 'transform 210ms cubic-bezier(0.2,0.8,0.2,1), opacity 210ms ease',
          cursor: queue.length > 1 ? 'grab' : undefined,
        };

  const transportControls = (
    <div className="sonata-mobile-transport">
      <button
        className={`sonata-mobile-transport__btn${isShuffleOn ? ' sonata-mobile-transport__btn--active' : ''}`}
        onClick={toggleShuffle}
        aria-label="Shuffle"
      >
        <Shuffle size={20} />
      </button>
      <button className="sonata-mobile-transport__btn" onClick={playPrevious} disabled={!currentTrack} aria-label="Previous">
        <SkipBack size={24} />
      </button>
      <button
        className="sonata-mobile-transport__btn sonata-mobile-transport__play"
        onClick={() => void audioTogglePlayback()}
        disabled={!currentTrack}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause size={26} /> : <Play size={26} />}
      </button>
      <button className="sonata-mobile-transport__btn" onClick={playNext} disabled={!currentTrack} aria-label="Next">
        <SkipForward size={24} />
      </button>
      <button
        className={`sonata-mobile-transport__btn${isRepeatOn ? ' sonata-mobile-transport__btn--active' : ''}`}
        onClick={() => setRepeatOn(!isRepeatOn)}
        aria-label="Repeat"
      >
        <Repeat size={20} />
      </button>
    </div>
  );

  if (isVideoTrack && currentTrack) {
    return (
      <div className="sonata-mobile-player sonata-mobile-player--reel">
        <div
          ref={reelRef}
          className={`sonata-mobile-reel${reelControlsVisible ? ' sonata-mobile-reel--controls-visible' : ''}${reelFill ? ' sonata-mobile-reel--fill' : ''}`}
          aria-label="Video player"
          onClick={handleReelTap}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="sonata-mobile-reel__media">
            {currentTrack.needsReAdd ? (
              <div className="sonata-mobile-reel__readd" onClick={(e) => e.stopPropagation()}>
                <FolderOpen size={36} />
                <span>Local file needs re-adding</span>
                <button
                  className="sonata-btn sonata-btn--ghost"
                  onClick={() => reAddInputRef.current?.click()}
                  aria-label="Re-add file"
                >
                  Re-add File
                </button>
                <input
                  ref={reAddInputRef}
                  type="file"
                  accept="video/*,audio/*"
                  onChange={handleReAddFile}
                  style={{ display: 'none' }}
                />
              </div>
            ) : isEmbedTrack && currentTrack.sourceUrl ? (
              <YoutubeEmbedPlayer track={currentTrack} className="sonata-mobile-youtube-player" />
            ) : (
              <LocalVideoDeck track={currentTrack} />
            )}
          </div>

          {playHint && (
            <div className="sonata-mobile-reel__play-hint" aria-hidden="true">
              {playHint === 'play' ? <Play size={52} /> : <Pause size={52} />}
            </div>
          )}

          <button
            className="sonata-mobile-reel__back-btn"
            onClick={(e) => { e.stopPropagation(); onTabChange('library'); }}
            aria-label="Back to library"
          >
            <ArrowLeft size={18} />
          </button>

          <div
            className="sonata-mobile-reel__overlay sonata-mobile-reel__overlay--top"
            onClick={(e) => e.stopPropagation()}
          >
            {isLocalVideo && (
              <button
                className={`sonata-mobile-reel__fit-btn${reelFill ? ' sonata-mobile-reel__fit-btn--active' : ''}`}
                onClick={() => setReelFill((v) => !v)}
                aria-label={reelFill ? 'Switch to fit mode' : 'Switch to fill mode'}
              >
                {reelFill ? <><Shrink size={12} /> FIT</> : <><Expand size={12} /> FILL</>}
              </button>
            )}
            <button
              className="sonata-mobile-reel__icon-btn"
              onClick={toggleReelFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={19} /> : <Maximize2 size={19} />}
            </button>
          </div>

          <div
            className="sonata-mobile-reel__overlay sonata-mobile-reel__overlay--bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sonata-mobile-reel__meta">
              <div className="sonata-mobile-reel__title">{currentTrack.title}</div>
              <div className="sonata-mobile-reel__artist">{currentTrack.artist}</div>
            </div>
            <div className="sonata-mobile-progress sonata-mobile-progress--reel">
              <ProgressBar onSeek={audioSeekTo} />
            </div>
            {queue.length > 1 && (
              <div className="sonata-mobile-reel__queue-nav">
                <button
                  className="sonata-mobile-reel__nav-btn"
                  onClick={(e) => { e.stopPropagation(); playPrevious(); }}
                  disabled={!hasPrev}
                  aria-label="Previous track"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="sonata-mobile-reel__nav-counter">
                  {currentQueueIndex >= 0 ? `${currentQueueIndex + 1} / ${queue.length}` : `— / ${queue.length}`}
                </span>
                <button
                  className="sonata-mobile-reel__nav-btn"
                  onClick={(e) => { e.stopPropagation(); playNext(); }}
                  disabled={!hasNext}
                  aria-label="Next track"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
            {transportControls}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sonata-mobile-player">
      <div
        key={currentTrack?.id ?? 'empty'}
        className={`sonata-mobile-deck${isLocalVideo ? ' sonata-mobile-deck--video' : ' sonata-mobile-deck--cd'}`}
        style={deckSwipeStyle}
        onTouchStart={handleDeckTouchStart}
        onTouchMove={handleDeckTouchMove}
        onTouchEnd={handleDeckTouchEnd}
      >
        {currentTrack?.needsReAdd ? (
          <div className="sonata-mobile-deck__readd">
            <FolderOpen size={32} />
            <span>Local file needs re-adding</span>
            <button
              className="sonata-btn sonata-btn--ghost"
              onClick={() => reAddInputRef.current?.click()}
              aria-label="Re-add file"
            >
              Re-add File
            </button>
            <input
              ref={reAddInputRef}
              type="file"
              accept="video/*,audio/*"
              onChange={handleReAddFile}
              style={{ display: 'none' }}
            />
          </div>
        ) : isEmbedTrack && currentTrack?.sourceUrl ? (
          <YoutubeEmbedPlayer track={currentTrack} className="sonata-mobile-youtube-player" />
        ) : isLocalVideo && currentTrack ? (
          <LocalVideoDeck track={currentTrack} />
        ) : (
          <CDPlayer size={Math.min(window.innerWidth * 0.52, 204)} />
        )}
      </div>

      {queue.length > 1 && (
        <div className="sonata-deck-swipe-row">
          <button
            className={`sonata-deck-swipe-row__arrow${deckOffset > 20 ? ' sonata-deck-swipe-row__arrow--active' : ''}`}
            onClick={playPrevious}
            disabled={!hasPrev}
            aria-label="Previous track"
          >
            <ChevronLeft size={13} />
          </button>
          <span className="sonata-deck-swipe-row__counter">
            {currentQueueIndex >= 0 ? `${currentQueueIndex + 1} / ${queue.length}` : `— / ${queue.length}`}
          </span>
          <button
            className={`sonata-deck-swipe-row__arrow${deckOffset < -20 ? ' sonata-deck-swipe-row__arrow--active' : ''}`}
            onClick={playNext}
            disabled={!hasNext}
            aria-label="Next track"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      )}

      <div className="sonata-mobile-track">
        {(() => {
          const title = readableTitle(currentTrack?.title);
          const marquee = title.length > 28;
          return (
            <div className={`sonata-mobile-track__title${marquee ? ' sonata-mobile-track__title--marquee' : ''}`}>
              {marquee ? (
                <span className="sonata-mobile-track__title-inner" aria-label={title}>
                  {title}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{title}
                </span>
              ) : title}
            </div>
          );
        })()}
        <div className="sonata-mobile-track__artist">
          {currentTrack?.artist ?? 'Go to Library to add music'}
        </div>
        {currentTrack && (
          <div className="sonata-mobile-track__badges">
            <span className={`sonata-badge ${currentTrack.sourceType === 'local' ? 'sonata-badge--local' : 'sonata-badge--online'}`}>
              {currentTrack.mediaKind === 'video' ? 'VIDEO'
                : currentTrack.sourceType === 'local' ? 'LOCAL'
                : currentTrack.sourceType === 'youtube' ? 'YOUTUBE'
                : 'ONLINE'}
            </span>
            {currentTrack.sourceType === 'url' && (
              <button
                className={`sonata-mobile-track__dl-btn${currentTrack.downloadState === 'downloaded' ? ' sonata-mobile-track__dl-btn--done' : ''}`}
                onClick={() => void downloadTrackForOffline(currentTrack)}
                disabled={currentTrack.downloadState === 'downloading' || currentTrack.downloadState === 'downloaded'}
                aria-label={
                  currentTrack.downloadState === 'downloaded' ? 'Saved offline'
                  : currentTrack.downloadState === 'downloading' ? 'Downloading…'
                  : 'Save for offline'
                }
              >
                {currentTrack.downloadState === 'downloaded'
                  ? <><CheckCircle size={11} /> SAVED</>
                  : currentTrack.downloadState === 'downloading'
                  ? <><Loader size={11} className="sonata-spin" /> SAVING…</>
                  : <><Download size={11} /> SAVE OFFLINE</>}
              </button>
            )}
          </div>
        )}
      </div>

      {conversionStatus && (
        <div className="sonata-mobile-conversion-status">
          {conversionStatus}
        </div>
      )}

      {(!isEmbedTrack || currentTrack?.sourceType === 'youtube') && (
        <div className="sonata-mobile-progress">
          <ProgressBar onSeek={audioSeekTo} />
        </div>
      )}

      {transportControls}

      {upNext.length > 0 && (
        <div className="sonata-mobile-upnext">
          <div className="sonata-mobile-upnext__header">Up Next</div>
          {upNext.map((track) => (
            <div
              key={track.id}
              className="sonata-queue-item"
              onClick={() => playTrackNow(track)}
              style={{ cursor: 'pointer', borderRadius: 'var(--sonata-radius-sm)' }}
            >
              <div className="sonata-queue-item__info">
                <div className="sonata-queue-item__title">{readableTitle(track.title)}</div>
                <div className="sonata-queue-item__artist">{track.artist}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {queue.length === 0 && (
        <button
          className="sonata-btn sonata-btn--ghost sonata-btn--full"
          onClick={() => onTabChange('library')}
        >
          <Library size={14} />
          Open Library
        </button>
      )}
    </div>
  );
}
