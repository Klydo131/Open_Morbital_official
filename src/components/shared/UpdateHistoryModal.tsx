// SPDX-License-Identifier: AGPL-3.0-or-later
import { X, Rocket } from 'lucide-react';
import { useEffect } from 'react';
import { ALL_UPDATES, TAG_LABELS, markAllSeen } from './updatesData';

type Props = {
  onClose: () => void;
  variant?: 'modal' | 'sheet';
};

export function UpdateHistoryModal({ onClose, variant = 'modal' }: Props) {
  useEffect(() => {
    markAllSeen();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className={variant === 'modal' ? 'sonata-modal-overlay' : 'sonata-sheet-overlay'}
      onClick={onClose}
    >
      <div
        className={variant === 'modal' ? 'sonata-modal-card' : 'sonata-sheet-card'}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sonata-history-header">
          <div className="sonata-history-header__left">
            <Rocket size={14} style={{ color: 'var(--sonata-cyan)' }} />
            <span>Open Morbital — Update History</span>
          </div>
          <button className="sonata-history-header__close" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </div>
        <div className="sonata-history-sub">
          Every update, from day one to today.
        </div>

        <div className="sonata-history-timeline">
          {ALL_UPDATES.map((u, i) => (
            <div
              key={u.id}
              className={[
                'sonata-history-entry',
                u.milestone ? 'sonata-history-entry--milestone' : '',
                i === 0 ? 'sonata-history-entry--latest' : '',
              ].filter(Boolean).join(' ')}
            >
              <div className={`sonata-history-dot sonata-history-dot--${u.tag ?? 'new'}`} />
              <div className="sonata-history-content">
                <div className="sonata-history-meta">
                  <span className="sonata-history-date">{u.date}</span>
                  {u.tag && (
                    <span className={`sonata-updates-tag sonata-updates-tag--${u.tag}`}>
                      {TAG_LABELS[u.tag]}
                    </span>
                  )}
                  {i === 0 && (
                    <span className="sonata-history-latest-badge">LATEST</span>
                  )}
                </div>
                <div className="sonata-history-title">{u.title}</div>
                <div className="sonata-history-body">{u.body}</div>
              </div>
            </div>
          ))}
          <div className="sonata-history-origin">
            ★ &nbsp;Open Morbital was born here. Thank you for being part of the journey.
          </div>
        </div>
      </div>
    </div>
  );
}
