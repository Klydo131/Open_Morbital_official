// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from 'react';
import { AlertTriangle, Disc, Trash2 } from 'lucide-react';

type Variant = 'danger' | 'warning';

type Props = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  variant?: Variant;
  /** localStorage key — stores "true" when user checks "do not ask again" */
  skipKey: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  variant = 'danger',
  skipKey,
  onConfirm,
  onCancel,
}: Props) {
  const [doNotAsk, setDoNotAsk] = useState(false);

  if (!isOpen) return null;

  function handleConfirm() {
    if (doNotAsk) localStorage.setItem(skipKey, 'true');
    setDoNotAsk(false);
    onConfirm();
  }

  function handleCancel() {
    setDoNotAsk(false);
    onCancel();
  }

  const Icon = variant === 'danger' ? Trash2 : Disc;
  const accentVar = variant === 'danger' ? 'var(--sonata-pink)' : 'var(--sonata-cyan)';

  return (
    <div className="sonata-dialog-overlay" onClick={handleCancel}>
      <div
        className="sonata-dialog"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="sonata-dialog-title"
        aria-describedby="sonata-dialog-msg"
      >
        <div className="sonata-dialog__icon" style={{ color: accentVar }}>
          <AlertTriangle size={22} />
        </div>

        <div className="sonata-dialog__icon-action" style={{ color: accentVar }}>
          <Icon size={16} />
        </div>

        <h2 className="sonata-dialog__title" id="sonata-dialog-title">
          {title}
        </h2>

        <p className="sonata-dialog__msg" id="sonata-dialog-msg">
          {message}
        </p>

        <label className="sonata-dialog__skip">
          <input
            type="checkbox"
            checked={doNotAsk}
            onChange={(e) => setDoNotAsk(e.target.checked)}
          />
          <span>Do not ask for this again</span>
        </label>

        <div className="sonata-dialog__actions">
          <button className="sonata-btn sonata-btn--ghost" onClick={handleCancel}>
            Cancel
          </button>
          <button
            className="sonata-btn"
            style={{
              background: accentVar,
              color: '#fff',
              border: 'none',
              boxShadow: variant === 'danger'
                ? '0 0 18px rgba(255,79,216,0.35)'
                : '0 0 18px rgba(53,217,255,0.35)',
            }}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Returns true if the user has previously chosen to skip confirmation for this key */
export function shouldSkipConfirm(skipKey: string): boolean {
  return localStorage.getItem(skipKey) === 'true';
}
