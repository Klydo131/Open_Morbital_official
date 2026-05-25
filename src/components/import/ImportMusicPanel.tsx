// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState, useRef } from 'react';
import { FolderOpen, Link } from 'lucide-react';
import { DropZone } from './DropZone';
import { useIngest } from '../../core/import/useIngest';
import { usePlayerStore } from '../../store/playerStore';

export function ImportMusicPanel() {
  const [urlValue, setUrlValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { handleFiles, handleUrl } = useIngest();
  const urlStatus = usePlayerStore((s) => s.urlStatus);

  const submitUrl = () => {
    if (urlValue.trim()) {
      void handleUrl(urlValue.trim());
      setUrlValue('');
    }
  };

  return (
    <div className="sonata-import-panel">
      <div className="sonata-import-panel__title">Import Music</div>

      <DropZone onFiles={(files) => void handleFiles(files)} />

      <div className="sonata-import-actions">
        <button
          className="sonata-btn sonata-btn--ghost sonata-btn--sm sonata-btn--full"
          onClick={() => inputRef.current?.click()}
        >
          <FolderOpen size={13} />
          Browse Files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.mp4,.wav,.flac,.m4a,.aac,.ogg,.opus,.webm,audio/*,video/mp4,video/webm"
          multiple
          style={{ position: 'fixed', left: -9999, width: 1, height: 1, opacity: 0 }}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) void handleFiles(files);
            e.target.value = '';
          }}
        />
      </div>

      <div className="sonata-url-row" style={{ marginTop: 8 }}>
        <input
          className="sonata-input"
          type="url"
          placeholder="Paste audio URL…"
          value={urlValue}
          onChange={(e) => setUrlValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submitUrl(); }}
        />
        <button className="sonata-btn sonata-btn--cyan sonata-btn--sm" onClick={submitUrl} title="Add URL">
          <Link size={13} />
        </button>
      </div>

      {urlStatus && (
        <div className={`sonata-url-status${urlStatus.toLowerCase().includes('could not') || urlStatus.toLowerCase().includes('not a valid') ? ' sonata-url-status--error' : urlStatus.toLowerCase().includes('added') ? ' sonata-url-status--success' : ''}`}>
          {urlStatus}
        </div>
      )}
    </div>
  );
}
