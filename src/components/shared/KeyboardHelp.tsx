// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

type Binding = { keys: string; label: string };

const BINDINGS: Binding[] = [
  { keys: 'Space',     label: 'Play / Pause' },
  { keys: '→',    label: 'Next track' },
  { keys: '←',    label: 'Previous track' },
  { keys: 'Shift + →', label: 'Seek forward 10 s' },
  { keys: 'Shift + ←', label: 'Seek backward 10 s' },
  { keys: '↑',    label: 'Volume up' },
  { keys: '↓',    label: 'Volume down' },
  { keys: 'M',         label: 'Mute / Unmute' },
  { keys: 'S',         label: 'Shuffle' },
  { keys: 'R',         label: 'Repeat' },
  { keys: '?',         label: 'Toggle this help' },
  { keys: 'Esc',       label: 'Close any overlay' },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function KeyboardHelp({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="mb-help-overlay" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      <div ref={dialogRef} className="mb-help-panel">
        <div className="mb-help-panel__header">
          <span>Keyboard shortcuts</span>
          <button className="mb-help-panel__close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <ul className="mb-help-list">
          {BINDINGS.map((b) => (
            <li key={b.keys} className="mb-help-row">
              <kbd className="mb-help-keys">{b.keys}</kbd>
              <span className="mb-help-label">{b.label}</span>
            </li>
          ))}
        </ul>
        <p className="mb-help-foot">
          Shortcuts ignore text inputs. Open Morbital is keyboard-first.
        </p>
      </div>
    </div>
  );
}
