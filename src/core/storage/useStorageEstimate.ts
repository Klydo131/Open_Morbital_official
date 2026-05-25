// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useState } from 'react';

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export function useStorageEstimate(): string | null {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.storage?.estimate) return;

    async function refresh() {
      try {
        const { usage } = await navigator.storage.estimate();
        if (usage != null) setLabel(formatBytes(usage));
      } catch {
        // storage API unavailable or denied
      }
    }

    void refresh();
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, []);

  return label;
}
