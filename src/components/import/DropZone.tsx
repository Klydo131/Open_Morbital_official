// SPDX-License-Identifier: AGPL-3.0-or-later
import { useCallback, useRef, useState } from 'react';
import { Upload } from 'lucide-react';

type Props = {
  onFiles: (files: File[]) => void;
};

export function DropZone({ onFiles }: Props) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onFiles(files);
    },
    [onFiles],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length) onFiles(files);
      e.target.value = '';
    },
    [onFiles],
  );

  return (
    <>
      <div
        className={`sonata-dropzone${isDragActive ? ' sonata-dropzone--active' : ''}`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
        onDragLeave={() => setIsDragActive(false)}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
      >
        <Upload size={18} style={{ margin: '0 auto 6px', color: 'var(--sonata-muted)', display: 'block' }} />
        <div className="sonata-dropzone__text">Drop music files here</div>
        <div className="sonata-dropzone__hint">MP3 · MP4 · WAV · FLAC · M4A · AAC · OGG</div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.mp4,.wav,.flac,.m4a,.aac,.ogg,.opus,.webm,audio/*,video/mp4,video/webm"
        multiple
        style={{ position: 'fixed', left: -9999, width: 1, height: 1, opacity: 0 }}
        onChange={handleChange}
      />
    </>
  );
}
