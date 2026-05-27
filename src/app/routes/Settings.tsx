// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from 'react';
import { clearAllData } from '../../core/storage/db';
import { usePlayerStore } from '../../store/playerStore';
import { BluetoothPanel } from '../../components/bluetooth/BluetoothPanel';
import { UpdateHistoryModal } from '../../components/shared/UpdateHistoryModal';
import { FeedbackPanel } from '../../components/shared/FeedbackPanel';

export function SettingsRoute() {
  const clearQueue = usePlayerStore((s) => s.clearQueue);
  const addToast = usePlayerStore((s) => s.addToast);
  const [showHistory, setShowHistory] = useState(false);

  async function handleClearAll() {
    clearQueue();
    await clearAllData();
    addToast('All local data cleared', 'success');
  }

  return (
    <div className="sonata-route">
      <div className="sonata-route__header">
        <div className="sonata-route__title">Settings</div>
        <div className="sonata-route__sub">Open Morbital — Local only</div>
      </div>

      <div className="sonata-settings-section">
        <div className="sonata-settings-section__title">Privacy</div>
        <div className="sonata-settings-row">
          <div>
            <div className="sonata-settings-row__label">Local-first mode</div>
            <div className="sonata-settings-row__sub">Audio files stay on your device. Nothing is uploaded.</div>
          </div>
          <span style={{ color: 'var(--sonata-green)', fontSize: 12 }}>Active</span>
        </div>
        <div className="sonata-settings-row">
          <div>
            <div className="sonata-settings-row__label">Analytics / Tracking</div>
            <div className="sonata-settings-row__sub">None. Open Morbital does not track your activity.</div>
          </div>
          <span style={{ color: 'var(--sonata-green)', fontSize: 12 }}>Disabled</span>
        </div>
        <div className="sonata-settings-row">
          <div>
            <div className="sonata-settings-row__label">Outbound network</div>
            <div className="sonata-settings-row__sub">Only YouTube iframes you load and the Google Fonts CSS at startup.</div>
          </div>
          <span style={{ color: 'var(--sonata-green)', fontSize: 12 }}>Locked</span>
        </div>
      </div>

      <div className="sonata-settings-section">
        <div className="sonata-settings-section__title">Storage</div>
        <div className="sonata-settings-row">
          <div>
            <div className="sonata-settings-row__label">Local storage (IndexedDB)</div>
            <div className="sonata-settings-row__sub">Queue, playlists, and settings stored locally via Dexie.</div>
          </div>
          <span style={{ color: 'var(--sonata-cyan)', fontSize: 12 }}>Active</span>
        </div>
        <div className="sonata-settings-row">
          <div>
            <div className="sonata-settings-row__label">Clear all local data</div>
            <div className="sonata-settings-row__sub">Removes tracks, playlists, and saved state from IndexedDB.</div>
          </div>
          <button className="sonata-btn sonata-btn--ghost sonata-btn--sm" onClick={() => void handleClearAll()}
            style={{ color: 'var(--sonata-pink)', borderColor: 'rgba(255,79,216,0.3)' }}>
            Clear
          </button>
        </div>
      </div>

      <BluetoothPanel />

      <div className="sonata-settings-section">
        <div className="sonata-settings-section__title">PWA</div>
        <div className="sonata-settings-row">
          <div>
            <div className="sonata-settings-row__label">Install as app</div>
            <div className="sonata-settings-row__sub">Open in Chrome and tap the install button in the address bar.</div>
          </div>
        </div>
        <div className="sonata-settings-row">
          <div>
            <div className="sonata-settings-row__label">Offline support</div>
            <div className="sonata-settings-row__sub">App shell and local playback work without internet.</div>
          </div>
          <span style={{ color: 'var(--sonata-green)', fontSize: 12 }}>Active</span>
        </div>
      </div>

      <div className="sonata-settings-section">
        <div className="sonata-settings-section__title">Updates</div>
        <div className="sonata-settings-row">
          <div>
            <div className="sonata-settings-row__label">Update History</div>
            <div className="sonata-settings-row__sub">Every change, from day one to today — see how Open Morbital has grown.</div>
          </div>
          <button
            className="sonata-btn sonata-btn--ghost sonata-btn--sm"
            onClick={() => setShowHistory(true)}
          >
            View
          </button>
        </div>
      </div>

      <FeedbackPanel />

      <div className="sonata-settings-section">
        <div className="sonata-settings-section__title">About</div>
        <div className="sonata-settings-row">
          <div>
            <div className="sonata-settings-row__label">Open Morbital</div>
            <div className="sonata-settings-row__sub">Open-source retro-wave local music player. Local-first, no analytics, no cloud upload.</div>
          </div>
        </div>
      </div>

      {showHistory && <UpdateHistoryModal onClose={() => setShowHistory(false)} variant="modal" />}
    </div>
  );
}
