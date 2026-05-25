// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useRef, useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import { ALL_UPDATES, TAG_LABELS, hasUnread, markAllSeen, subscribeUnread } from './updatesData';

const UPDATES = ALL_UPDATES.slice(0, 4);

type Props = {
  className?: string;
};

export function UpdatesPanel({ className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(hasUnread);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeUnread(() => setUnread(false)), []);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  function handleToggle() {
    if (!open) {
      markAllSeen();
      setUnread(false);
    }
    setOpen((v) => !v);
  }

  return (
    <div ref={panelRef} className={`sonata-updates-wrap ${className}`} style={{ position: 'relative' }}>
      <button
        className={`sonata-console__cell sonata-console__cell--btn${open ? ' sonata-console__cell--active' : ''}`}
        onClick={handleToggle}
        title="What's new in Open Morbital"
      >
        <Megaphone size={11} />
        Updates
        {unread && <span className="sonata-updates-dot" />}
      </button>

      {open && (
        <div className="sonata-updates-panel">
          <div className="sonata-updates-panel__header">
            <span>What&apos;s New</span>
            <button className="sonata-updates-panel__close" onClick={() => setOpen(false)}>
              <X size={13} />
            </button>
          </div>
          <div className="sonata-updates-panel__list">
            {UPDATES.map((u) => (
              <div key={u.id} className="sonata-updates-entry">
                <div className="sonata-updates-entry__top">
                  <span className="sonata-updates-entry__date">{u.date}</span>
                  {u.tag && (
                    <span className={`sonata-updates-tag sonata-updates-tag--${u.tag}`}>
                      {TAG_LABELS[u.tag]}
                    </span>
                  )}
                </div>
                <div className="sonata-updates-entry__title">{u.title}</div>
                <div className="sonata-updates-entry__body">{u.body}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
