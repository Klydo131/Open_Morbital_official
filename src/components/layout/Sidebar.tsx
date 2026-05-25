// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  Music2, Library, ListMusic, Radio, Compass, Mic2,
  Palette, Settings, HardDrive,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { ImportMusicPanel } from '../import/ImportMusicPanel';

type NavEntry = {
  to: string;
  icon: React.ReactNode;
  label: string;
};

const NAV_ITEMS: NavEntry[] = [
  { to: '/',          icon: <Music2 size={15} />,    label: 'Now Playing' },
  { to: '/library',   icon: <Library size={15} />,   label: 'Library' },
  { to: '/playlists', icon: <ListMusic size={15} />, label: 'Playlists' },
  { to: '/vault',     icon: <HardDrive size={15} />, label: 'Pod' },
  { to: '/radio',     icon: <Radio size={15} />,     label: 'Radio' },
  { to: '/discover',  icon: <Compass size={15} />,   label: 'Discover' },
  { to: '/karaoke',   icon: <Mic2 size={15} />,      label: 'Karaoke' },
  { to: '/themes',    icon: <Palette size={15} />,   label: 'Themes' },
  { to: '/settings',  icon: <Settings size={15} />,  label: 'Settings' },
];

export function Sidebar() {
  return (
    <aside className="sonata-sidebar">
      <div className="sonata-sidebar__header">
        <div className="sonata-sidebar__logo">OPEN MORBITAL</div>
        <div className="sonata-sidebar__tagline">RETRO WAVE PLAYER</div>
      </div>

      <nav className="sonata-sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `sonata-nav-item${isActive ? ' sonata-nav-item--active' : ''}`
            }
          >
            <span className="sonata-nav-item__icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <ImportMusicPanel />
    </aside>
  );
}
