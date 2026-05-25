// SPDX-License-Identifier: AGPL-3.0-or-later
import { Bell, X, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ALL_UPDATES, TAG_LABELS, hasUnread, markAllSeen, subscribeUnread } from '../shared/updatesData';
import { useUIStore } from '../../store/uiStore';

const RECENT_COUNT = 4;

export function MobileUpdatesPopover() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(hasUnread);
  const { setMobileActiveTab } = useUIStore();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeUnread(() => setUnread(false)), []);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: TouchEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('touchstart', handleOutside);
    return () => document.removeEventListener('touchstart', handleOutside);
  }, [open]);

  function handleOpen() {
    if (!open) {
      markAllSeen();
      setUnread(false);
    }
    setOpen((v) => !v);
  }

  const recent = ALL_UPDATES.slice(0, RECENT_COUNT);

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      <button
        className="sonata-mobile-topbar__bell"
        onClick={handleOpen}
        aria-label="What's new in Open Morbital"
      >
        <Bell size={20} />
        {unread && <span className="sonata-mobile-updates-dot" />}
      </button>

      {open && (
        <div className="sonata-mobile-updates-popover">
          <div className="sonata-mobile-updates-popover__header">
            <span>What&apos;s New</span>
            <button onClick={() => setOpen(false)} aria-label="Close">
              <X size={13} />
            </button>
          </div>

          <div className="sonata-mobile-updates-popover__list">
            {recent.map((u) => (
              <div key={u.id} className="sonata-mobile-updates-item">
                <div className="sonata-mobile-updates-item__top">
                  <span className="sonata-updates-entry__date">{u.date}</span>
                  {u.tag && (
                    <span className={`sonata-updates-tag sonata-updates-tag--${u.tag}`}>
                      {TAG_LABELS[u.tag]}
                    </span>
                  )}
                </div>
                <div className="sonata-mobile-updates-item__title">{u.title}</div>
                <div className="sonata-mobile-updates-item__body">{u.body}</div>
              </div>
            ))}
          </div>

          <button
            className="sonata-mobile-updates-popover__all"
            onClick={() => { setOpen(false); setMobileActiveTab('settings'); }}
          >
            View full update history
            <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
