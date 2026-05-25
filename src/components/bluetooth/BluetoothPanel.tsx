// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from 'react';
import { Bluetooth, BluetoothConnected, ArrowUpFromLine, BadgeCheck, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';

type PairedDevice = { id: string; name: string };

const btAvailable = typeof navigator !== 'undefined' && 'bluetooth' in navigator;
const shareAvailable = typeof navigator !== 'undefined' && 'share' in navigator;

export function BluetoothPanel() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const addToast     = usePlayerStore((s) => s.addToast);

  const [paired, setPaired]       = useState<PairedDevice | null>(null);
  const [scanning, setScanning]   = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);

  async function handleScan() {
    if (!btAvailable) return;
    setScanning(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bt = (navigator as any).bluetooth;
      const device = await bt.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['device_information'],
      });
      const name = (device.name as string | undefined) || 'Bluetooth Device';
      setPaired({ id: device.id as string, name });
      addToast(`Paired with ${name}`, 'success');
    } catch (err: unknown) {
      const name = err instanceof Error ? err.name : '';
      if (name !== 'NotFoundError' && name !== 'NotAllowedError') {
        addToast('Could not connect to Bluetooth device', 'error');
      }
    } finally {
      setScanning(false);
    }
  }

  async function handleShare() {
    if (!shareAvailable || !currentTrack) return;
    const shareData: ShareData = {
      title: currentTrack.title,
      text: `${currentTrack.title} — ${currentTrack.artist} | Shared from Open Morbital`,
    };
    if (currentTrack.localFile) {
      shareData.files = [currentTrack.localFile];
    }
    try {
      await navigator.share(shareData);
    } catch (err: unknown) {
      const name = err instanceof Error ? err.name : '';
      if (name !== 'AbortError') {
        addToast('Could not share this track', 'error');
      }
    }
  }

  return (
    <div className="sonata-settings-section">
      <div className="sonata-settings-section__title">Bluetooth</div>

      {/* ── Device connection ── */}
      <div className="sonata-settings-row">
        <div>
          <div className="sonata-settings-row__label">
            {paired ? paired.name : 'Connect a Device'}
          </div>
          <div className="sonata-settings-row__sub">
            {paired
              ? 'Audio routes through your OS — press play and it will output to this device'
              : 'Pair headphones, a speaker, or your car audio via the browser'}
          </div>
        </div>

        {btAvailable ? (
          <button
            className="sonata-btn sonata-btn--ghost sonata-btn--sm sonata-bt-btn"
            onClick={() => void handleScan()}
            disabled={scanning}
            title={paired ? `Connected: ${paired.name}` : 'Scan for Bluetooth devices'}
          >
            {paired
              ? <><BluetoothConnected size={13} /> Connected</>
              : scanning
                ? <>… Scanning</>
                : <><Bluetooth size={13} /> Scan</>}
          </button>
        ) : (
          <span className="sonata-bt-unsupported">Use Chrome/Edge</span>
        )}
      </div>

      {/* ── Share track ── */}
      <div className="sonata-settings-row">
        <div>
          <div className="sonata-settings-row__label">Share Current Track</div>
          <div className="sonata-settings-row__sub">
            {currentTrack
              ? `Share "${currentTrack.title}" via your device's share sheet (Bluetooth, AirDrop, etc.)`
              : 'Load a track first to enable sharing'}
          </div>
        </div>

        {shareAvailable ? (
          <button
            className="sonata-btn sonata-btn--ghost sonata-btn--sm sonata-bt-btn sonata-bt-btn--share"
            onClick={() => void handleShare()}
            disabled={!currentTrack}
            title="Share via OS share sheet"
          >
            <ArrowUpFromLine size={13} /> Share
          </button>
        ) : (
          <span className="sonata-bt-unsupported">Not supported</span>
        )}
      </div>

      {/* ── How-to guide ── */}
      <div className="sonata-settings-row sonata-settings-row--block">
        <div className="sonata-settings-row__label">How Bluetooth Audio Works in Open Morbital</div>
        <ol className="sonata-bt-guide">
          <li>Connect your Bluetooth audio device (headphones, speaker, car) via your <strong>OS Bluetooth settings</strong></li>
          <li>Set it as your system audio output device</li>
          <li>Press play in Open Morbital — audio routes automatically to the connected device</li>
          <li>To share a track file, use the <strong>Share</strong> button above (works on mobile &amp; some desktops)</li>
        </ol>
      </div>

      {/* ── Safety tips (collapsible) ── */}
      <div className="sonata-bt-safety">
        <button
          className="sonata-bt-safety__header"
          onClick={() => setSafetyOpen((v) => !v)}
          aria-expanded={safetyOpen}
        >
          <BadgeCheck size={13} style={{ color: 'var(--sonata-cyan)', flexShrink: 0 }} />
          <span>Safety Tips</span>
          {safetyOpen ? <ChevronUp size={11} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={11} style={{ marginLeft: 'auto' }} />}
        </button>

        {safetyOpen && (
          <ul className="sonata-bt-safety__list">
            <li><AlertTriangle size={11} /> Only pair with devices you recognise and trust</li>
            <li><AlertTriangle size={11} /> Bluetooth scanning only runs when you press <strong>Scan</strong> — Open Morbital never scans in the background</li>
            <li><AlertTriangle size={11} /> Your audio files are never transmitted over Bluetooth by Open Morbital — only OS audio output is routed</li>
            <li><AlertTriangle size={11} /> If sharing a local file, it goes directly from your device to the recipient via the OS share sheet — no external server is involved</li>
            <li><AlertTriangle size={11} /> Avoid pairing with unknown public devices in cafés, airports, or other public spaces</li>
          </ul>
        )}
      </div>
    </div>
  );
}
