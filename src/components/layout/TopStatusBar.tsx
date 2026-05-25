// SPDX-License-Identifier: AGPL-3.0-or-later
import { Wifi, WifiOff, Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useUIStore } from '../../store/uiStore';

export function TopStatusBar() {
  const [online, setOnline] = useState(navigator.onLine);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  return (
    <header className="sonata-topbar">
      <div className="sonata-topbar__brand">
        <span className="sonata-topbar__logo">OPEN MORBITAL</span>
        <span className="sonata-topbar__sub">RETRO WAVE PLAYER</span>
      </div>

      <div className="sonata-topbar__status">
        <span
          className={`sonata-topbar__status-dot ${online ? 'sonata-topbar__status-dot--online' : 'sonata-topbar__status-dot--offline'}`}
        />
        {online
          ? <><Wifi size={13} /> <span>Online</span></>
          : <><WifiOff size={13} /> <span>Offline</span></>
        }

        <button
          className="sonata-theme-toggle"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </header>
  );
}
