// SPDX-License-Identifier: AGPL-3.0-or-later
import { usePlayerStore } from '../../store/playerStore';

export function Toast() {
  const toasts = usePlayerStore((s) => s.toasts);

  if (!toasts.length) return null;

  return (
    <div className="sonata-toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`sonata-toast sonata-toast--${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
