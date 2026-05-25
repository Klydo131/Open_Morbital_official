// SPDX-License-Identifier: AGPL-3.0-or-later
import { Menu, Settings as SettingsIcon, Music2, Library, BookMarked, ListMusic } from 'lucide-react';
import { MobileUpdatesPopover } from '../mobile/MobileUpdatesPopover';
import { useState } from 'react';
import { useUIStore, type ActiveTab } from '../../store/uiStore';
import { useAudioEngine } from '../../core/audio/audioEngine';
import { usePersistence } from '../../core/audio/usePersistence';
import { MobilePlayerView } from '../player/MobilePlayerView';
import { MobileLibraryView } from '../mobile/MobileLibraryView';
import { MobileQueueView } from '../mobile/MobileQueueView';
import { MobileSettingsView } from '../mobile/MobileSettingsView';
import { MobileVaultView } from '../mobile/MobileVaultView';
import { MobileTutorial } from '../mobile/MobileTutorial';
import { Toast } from '../shared/Toast';

type TabDef = { id: ActiveTab; icon: React.ReactNode; label: string };

const TABS: TabDef[] = [
  { id: 'player',  icon: <Music2 size={20} />,    label: 'Player' },
  { id: 'library', icon: <Library size={20} />,   label: 'Library' },
  { id: 'vault',   icon: <BookMarked size={20} />, label: 'Vault' },
  { id: 'queue',   icon: <ListMusic size={20} />,  label: 'Queue' },
];

export function MobileShell() {
  const { mobileMenuOpen, mobileActiveTab, setMobileMenuOpen, setMobileActiveTab } = useUIStore();
  const [showTutorial, setShowTutorial] = useState(() => (
    localStorage.getItem('sonata-mobile-tutorial-complete') !== 'yes' &&
    localStorage.getItem('sonata-mobile-tutorial-skipped') !== 'yes'
  ));

  const {
    audioRef,
    handleEnded,
    handleError,
    setIsPlaying,
    setCurrentTime,
    setDuration,
  } = useAudioEngine();

  usePersistence();

  return (
    <div className="sonata-mobile-shell mobile-only">
      {/* Top bar */}
      <div className="sonata-mobile-topbar">
        <button className="sonata-mobile-topbar__menu" onClick={() => setMobileMenuOpen(true)} aria-label="Menu">
          <Menu size={22} />
        </button>
        <span className="sonata-mobile-topbar__title">OPEN MORBITAL</span>
        <div className="sonata-mobile-topbar__right">
          <MobileUpdatesPopover />
          <button
            className="sonata-mobile-topbar__gear"
            aria-label="Settings"
            onClick={() => setMobileActiveTab('settings')}
          >
            <SettingsIcon size={22} />
          </button>
        </div>
      </div>

      {/* Mode switch bar */}
      <div className="sonata-mobile-mode-bar">
        <button
          className={`sonata-mobile-mode-btn${mobileActiveTab === 'player' ? ' sonata-mobile-mode-btn--active' : ''}`}
          onClick={() => setMobileActiveTab('player')}
        >
          PLAYER
        </button>
        <button
          className={`sonata-mobile-mode-btn${mobileActiveTab === 'library' ? ' sonata-mobile-mode-btn--active' : ''}`}
          onClick={() => setMobileActiveTab('library')}
        >
          ADD MUSIC
        </button>
      </div>

      {/* Content */}
      <div className="sonata-mobile-content">
        {mobileActiveTab === 'player' && <MobilePlayerView onTabChange={setMobileActiveTab} />}
        {mobileActiveTab === 'library' && <MobileLibraryView />}
        {mobileActiveTab === 'queue' && <MobileQueueView />}
        {mobileActiveTab === 'settings' && <MobileSettingsView />}
        {mobileActiveTab === 'vault' && <MobileVaultView />}
      </div>

      {/* Bottom tabs */}
      <div className="sonata-mobile-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`sonata-mobile-tab${mobileActiveTab === tab.id ? ' sonata-mobile-tab--active' : ''}`}
            onClick={() => setMobileActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onEnded={handleEnded}
        onError={handleError}
        preload="metadata"
      />

      {/* Slide-in mobile nav */}
      {mobileMenuOpen && (
        <>
          <div
            className="sonata-mobile-menu-overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
          <nav className="sonata-mobile-menu">
            <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--sonata-border)' }}>
              <div className="sonata-sidebar__logo">OPEN MORBITAL</div>
              <div className="sonata-sidebar__tagline">RETRO WAVE PLAYER</div>
            </div>
            {/* Menu items mirror the sidebar nav — tap to dismiss */}
            {(['Now Playing', 'Library', 'Playlists', 'Radio', 'Discover', 'Karaoke', 'Themes', 'Settings'] as const).map((label) => (
              <button
                key={label}
                className="sonata-nav-item"
                onClick={() => {
                  if (label === 'Now Playing') setMobileActiveTab('player');
                  if (label === 'Library') setMobileActiveTab('library');
                  if (label === 'Themes' || label === 'Settings') setMobileActiveTab('settings');
                  setMobileMenuOpen(false);
                }}
              >
                {label}
              </button>
            ))}
          </nav>
        </>
      )}

      <Toast />
      {showTutorial && <MobileTutorial onClose={() => setShowTutorial(false)} />}
    </div>
  );
}
