// SPDX-License-Identifier: AGPL-3.0-or-later
import { Moon, Sun, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { BluetoothPanel } from '../bluetooth/BluetoothPanel';
import { UpdateHistoryModal } from '../shared/UpdateHistoryModal';
import { FeedbackPanel } from '../shared/FeedbackPanel';
import { hasUnread, subscribeUnread } from '../shared/updatesData';

export function MobileSettingsView() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [showHistory, setShowHistory] = useState(false);
  const [unread, setUnread] = useState(hasUnread);

  useEffect(() => subscribeUnread(() => setUnread(false)), []);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="sonata-mobile-settings">

      {/* ── What's New ── */}
      <div className="sonata-settings-section">
        <div className="sonata-settings-row">
          <div>
            <div className="sonata-settings-row__label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              What&apos;s New
              {unread && <span className="sonata-settings-new-badge">NEW</span>}
            </div>
            <div className="sonata-settings-row__sub">Every update, from day one to today.</div>
          </div>
          <button
            className="sonata-btn sonata-btn--ghost sonata-btn--sm"
            onClick={() => setShowHistory(true)}
          >
            View
          </button>
        </div>
      </div>

      {/* ── Theme ── */}
      <div className="sonata-settings-section">
        <div className="sonata-settings-section__title">Theme</div>
        <div className="sonata-mobile-theme-toggle" role="group" aria-label="Theme">
          <button
            className={`sonata-mobile-theme-toggle__btn${theme === 'dark' ? ' sonata-mobile-theme-toggle__btn--active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            <Moon size={16} />
            Dark
          </button>
          <button
            className={`sonata-mobile-theme-toggle__btn${theme === 'light' ? ' sonata-mobile-theme-toggle__btn--active' : ''}`}
            onClick={() => setTheme('light')}
          >
            <Sun size={16} />
            Light
          </button>
        </div>
      </div>

      {/* ── Connection ── */}
      <div className="sonata-settings-section">
        <div className="sonata-settings-section__title">Connection</div>
        <div className="sonata-settings-row">
          <div>
            <div className="sonata-settings-row__label">Network status</div>
            <div className="sonata-settings-row__sub">
              {online ? 'Online links can load when providers allow embeds.' : 'Local files still play while offline.'}
            </div>
          </div>
          <span className={`sonata-network-pill${online ? ' sonata-network-pill--online' : ' sonata-network-pill--offline'}`}>
            {online ? <Wifi size={13} /> : <WifiOff size={13} />}
            {online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* ── Privacy ── */}
      <div className="sonata-settings-section">
        <div className="sonata-settings-section__title">Privacy</div>
        <div className="sonata-settings-row">
          <div>
            <div className="sonata-settings-row__label">Local-first playback</div>
            <div className="sonata-settings-row__sub">Audio files stay on this device and are never uploaded by Open Morbital.</div>
          </div>
        </div>
      </div>

      <BluetoothPanel />

      <FeedbackPanel />

      {showHistory && <UpdateHistoryModal onClose={() => setShowHistory(false)} variant="sheet" />}
    </div>
  );
}
