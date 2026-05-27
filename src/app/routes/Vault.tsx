// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useRef, useState } from 'react';
import { HardDrive, Music, FileText, Plus, Trash2, Play, FolderPlus, Info, X, Download, ListPlus } from 'lucide-react';
import { useVaultStore } from '../../store/vaultStore';
import { usePlayerStore, type MorbitalTrack } from '../../store/playerStore';
import { playTrackNow } from '../../core/audio/audioEngine';
import { formatFileSize, type VaultTrack, type VaultPlaylist } from '../../core/storage/vaultDb';

const AUDIO_ACCEPT = '.mp3,.wav,.flac,.m4a,.aac,.ogg,.opus,.webm,.alac,.mp4';
const WORKSPACE_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip';

function vaultTrackToMorbital(vt: VaultTrack): MorbitalTrack {
  return {
    id: vt.id,
    title: vt.title,
    artist: vt.artist,
    album: vt.album,
    fileName: vt.fileName,
    mimeType: vt.mimeType,
    objectUrl: URL.createObjectURL(vt.blob),
    sourceType: 'local',
    mediaKind: vt.mediaKind,
    duration: vt.duration,
    albumArt: vt.albumArt,
    createdAt: vt.addedAt,
  };
}

function TutorialCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="vault-tutorial">
      <button className="vault-tutorial__close" onClick={onDismiss} title="Dismiss">
        <X size={14} />
      </button>
      <div className="vault-tutorial__header">
        <Info size={16} />
        <strong>How Pod works</strong>
      </div>
      <div className="vault-tutorial__body">
        <div className="vault-tutorial__section">
          <span className="vault-tutorial__badge vault-tutorial__badge--warn">Temporary</span>
          <p>
            <strong>Queue (Now Playing)</strong> — Files you drop or add are session-only.
            They disappear when you close the browser tab. Great for quick listening.
          </p>
        </div>
        <div className="vault-tutorial__section">
          <span className="vault-tutorial__badge vault-tutorial__badge--ok">Permanent</span>
          <p>
            <strong>Pod → Music &amp; Video</strong> — Save files here to keep them on your
            device forever (stored in your browser&apos;s local storage). Organize them into
            playlists. Works offline, no account needed.
          </p>
        </div>
        <div className="vault-tutorial__section">
          <span className="vault-tutorial__badge vault-tutorial__badge--ok">Permanent</span>
          <p>
            <strong>Pod → Workspace</strong> — Save PDFs, Word docs, Excel sheets, and other
            documents here. Open them in a new tab while music plays in the background.
          </p>
        </div>
        <p className="vault-tutorial__tip">
          💡 <strong>To save a track:</strong> Drag audio files into the Music &amp; Video tab,
          or click <em>Add to Pod</em> on any track in your queue. Playlists only save tracks
          already in your Pod — add the tracks first, then organize them.
        </p>
      </div>
    </div>
  );
}

function MusicTab() {
  const {
    vaultTracks, vaultPlaylists,
    saveFilesToVault, removeVaultTrack,
    createPlaylist, renamePlaylist, deletePlaylist,
    addTracksToPlaylist, removeFromPlaylist,
  } = useVaultStore();
  const addTracks = usePlayerStore((s) => s.addTracks);
  const addToast = usePlayerStore((s) => s.addToast);

  const [activePlaylist, setActivePlaylist] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [addToPlId, setAddToPlId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPlaylist = vaultPlaylists.find((p) => p.id === activePlaylist) ?? null;
  const displayTracks = currentPlaylist
    ? vaultTracks.filter((t) => currentPlaylist.trackIds.includes(t.id))
    : vaultTracks;

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('audio/') || f.type.startsWith('video/') ||
      AUDIO_ACCEPT.split(',').some((ext) => f.name.toLowerCase().endsWith(ext)),
    );
    if (!files.length) { addToast('No supported audio/video files dropped', 'error'); return; }
    const saved = await saveFilesToVault(files);
    addToast(`Saved ${saved.length} file${saved.length !== 1 ? 's' : ''} to Pod`, 'success');
  }

  async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const saved = await saveFilesToVault(files);
    addToast(`Saved ${saved.length} file${saved.length !== 1 ? 's' : ''} to Pod`, 'success');
    e.target.value = '';
  }

  function playTrack(vt: VaultTrack) {
    const morbital = vaultTrackToMorbital(vt);
    addTracks([morbital]);
    playTrackNow(morbital);
  }

  function playAll() {
    if (!displayTracks.length) return;
    const morbitals = displayTracks.map(vaultTrackToMorbital);
    addTracks(morbitals);
    playTrackNow(morbitals[0]);
  }

  async function handleCreatePlaylist() {
    const name = newPlaylistName.trim();
    if (!name) return;
    await createPlaylist(name);
    setNewPlaylistName('');
    addToast(`Playlist "${name}" created`, 'success');
  }

  async function handleRename() {
    if (!renameId) return;
    await renamePlaylist(renameId, renameName);
    setRenameId(null);
    setRenameName('');
  }

  return (
    <div className="vault-music">
      <div className="vault-music__sidebar">
        <div className="vault-section-label">Playlists</div>
        <button
          className={`vault-pl-item${activePlaylist === null ? ' vault-pl-item--active' : ''}`}
          onClick={() => setActivePlaylist(null)}
        >
          <HardDrive size={13} /> All Tracks ({vaultTracks.length})
        </button>
        {vaultPlaylists.map((pl) => (
          <div key={pl.id} className={`vault-pl-item${activePlaylist === pl.id ? ' vault-pl-item--active' : ''}`}>
            {renameId === pl.id ? (
              <input
                className="vault-pl-rename"
                value={renameName}
                autoFocus
                onChange={(e) => setRenameName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenameId(null); }}
              />
            ) : (
              <span
                className="vault-pl-item__name"
                onClick={() => setActivePlaylist(pl.id)}
                onDoubleClick={() => { setRenameId(pl.id); setRenameName(pl.name); }}
                title="Double-click to rename"
              >
                <ListPlus size={13} /> {pl.name} ({pl.trackIds.length})
              </span>
            )}
            <button
              className="vault-pl-item__del"
              title="Delete playlist"
              onClick={(e) => { e.stopPropagation(); void deletePlaylist(pl.id); if (activePlaylist === pl.id) setActivePlaylist(null); }}
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}

        <div className="vault-pl-create">
          <input
            className="vault-pl-input"
            placeholder="New playlist name…"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleCreatePlaylist(); }}
          />
          <button className="vault-btn vault-btn--sm" onClick={() => void handleCreatePlaylist()}>
            <Plus size={12} />
          </button>
        </div>
      </div>

      <div className="vault-music__main">
        <div className="vault-music__toolbar">
          <div className="vault-section-label">
            {currentPlaylist ? currentPlaylist.name : 'All Tracks'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {displayTracks.length > 0 && (
              <button className="vault-btn" onClick={playAll}>
                <Play size={12} /> Play All
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={AUDIO_ACCEPT}
              multiple
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
            <button className="vault-btn vault-btn--primary" onClick={() => fileInputRef.current?.click()}>
              <Plus size={12} /> Add Files
            </button>
          </div>
        </div>

        <div
          className={`vault-dropzone${isDragging ? ' vault-dropzone--active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => void handleDrop(e)}
        >
          {displayTracks.length === 0 && (
            <div className="vault-dropzone__hint">
              <Music size={32} />
              <p>Drop audio &amp; video files here to save them permanently</p>
              <p className="vault-muted">Supports MP3, WAV, FLAC, M4A, AAC, OGG, MP4 and more</p>
            </div>
          )}

          <div className="vault-track-list">
            {displayTracks.map((vt) => (
              <div key={vt.id} className="vault-track-row">
                <button className="vault-track-row__play" onClick={() => playTrack(vt)} title="Play">
                  <Play size={13} />
                </button>
                <div className="vault-track-row__info">
                  <span className="vault-track-row__title">{vt.title}</span>
                  <span className="vault-track-row__meta">{vt.artist} · {formatFileSize(vt.size)}</span>
                </div>
                <span className="vault-track-row__kind">{vt.mediaKind}</span>
                {vaultPlaylists.length > 0 && !currentPlaylist && (
                  <div className="vault-track-row__actions">
                    <select
                      className="vault-pl-select"
                      defaultValue=""
                      onChange={async (e) => {
                        const plId = e.target.value;
                        if (!plId) return;
                        await addTracksToPlaylist(plId, [vt.id]);
                        addToast(`Added to playlist`, 'success');
                        e.target.value = '';
                      }}
                    >
                      <option value="">+ Playlist</option>
                      {vaultPlaylists.map((pl) => (
                        <option key={pl.id} value={pl.id}>{pl.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {currentPlaylist && (
                  <button
                    className="vault-track-row__remove"
                    title="Remove from playlist"
                    onClick={() => void removeFromPlaylist(currentPlaylist.id, vt.id)}
                  >
                    <X size={12} />
                  </button>
                )}
                <button
                  className="vault-track-row__del"
                  title="Delete from Pod"
                  onClick={() => { if (confirm(`Delete "${vt.title}" from Pod?`)) void removeVaultTrack(vt.id); }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const WORKSPACE_MIME_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'text/plain': 'TXT',
  'text/csv': 'CSV',
};

function getFileLabel(mimeType: string, fileName: string): string {
  if (WORKSPACE_MIME_LABELS[mimeType]) return WORKSPACE_MIME_LABELS[mimeType];
  const ext = fileName.split('.').pop()?.toUpperCase();
  return ext ?? 'FILE';
}

function WorkspaceTab() {
  const { workspaceFiles, workspaceFolders, saveFileToWorkspace, deleteWorkspaceFile, createFolder, deleteFolder } = useVaultStore();
  const addToast = usePlayerStore((s) => s.addToast);

  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayFiles = activeFolder
    ? workspaceFiles.filter((f) => f.folderId === activeFolder)
    : workspaceFiles.filter((f) => !f.folderId);

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;
    await Promise.all(files.map((f) => saveFileToWorkspace(f, activeFolder ?? undefined)));
    addToast(`Saved ${files.length} file${files.length !== 1 ? 's' : ''} to Workspace`, 'success');
  }

  async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    await Promise.all(files.map((f) => saveFileToWorkspace(f, activeFolder ?? undefined)));
    addToast(`Saved ${files.length} file${files.length !== 1 ? 's' : ''} to Workspace`, 'success');
    e.target.value = '';
  }

  function openFile(file: { blob: Blob; name: string; mimeType: string }) {
    const url = URL.createObjectURL(file.blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function downloadFile(file: { blob: Blob; name: string }) {
    const url = URL.createObjectURL(file.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  return (
    <div className="vault-workspace">
      <div className="vault-workspace__sidebar">
        <div className="vault-section-label">Folders</div>
        <button
          className={`vault-pl-item${activeFolder === null ? ' vault-pl-item--active' : ''}`}
          onClick={() => setActiveFolder(null)}
        >
          <FileText size={13} /> All Documents ({workspaceFiles.filter((f) => !f.folderId).length})
        </button>
        {workspaceFolders.map((folder) => (
          <div key={folder.id} className={`vault-pl-item${activeFolder === folder.id ? ' vault-pl-item--active' : ''}`}>
            <span className="vault-pl-item__name" onClick={() => setActiveFolder(folder.id)}>
              <FolderPlus size={13} /> {folder.name} ({workspaceFiles.filter((f) => f.folderId === folder.id).length})
            </span>
            <button
              className="vault-pl-item__del"
              title="Delete folder"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete folder "${folder.name}"? Files will be moved to root.`)) {
                  void deleteFolder(folder.id);
                  if (activeFolder === folder.id) setActiveFolder(null);
                }
              }}
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}
        <div className="vault-pl-create">
          <input
            className="vault-pl-input"
            placeholder="New folder…"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newFolderName.trim()) {
                void createFolder(newFolderName.trim());
                setNewFolderName('');
              }
            }}
          />
          <button
            className="vault-btn vault-btn--sm"
            onClick={() => {
              if (!newFolderName.trim()) return;
              void createFolder(newFolderName.trim());
              setNewFolderName('');
            }}
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      <div className="vault-workspace__main">
        <div className="vault-music__toolbar">
          <div className="vault-section-label">
            {activeFolder ? workspaceFolders.find((f) => f.id === activeFolder)?.name ?? 'Folder' : 'All Documents'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept={WORKSPACE_ACCEPT}
              multiple
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
            <button className="vault-btn vault-btn--primary" onClick={() => fileInputRef.current?.click()}>
              <Plus size={12} /> Add Documents
            </button>
          </div>
        </div>

        <div
          className={`vault-dropzone${isDragging ? ' vault-dropzone--active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => void handleDrop(e)}
        >
          {displayFiles.length === 0 && (
            <div className="vault-dropzone__hint">
              <FileText size={32} />
              <p>Drop documents here to save them</p>
              <p className="vault-muted">PDF, Word, Excel, PowerPoint, TXT, CSV and more</p>
              <p className="vault-muted">Open and read documents while music plays in the background</p>
            </div>
          )}

          <div className="vault-track-list">
            {displayFiles.map((wf) => (
              <div key={wf.id} className="vault-track-row">
                <span className="vault-ws-badge">{getFileLabel(wf.mimeType, wf.name)}</span>
                <div className="vault-track-row__info">
                  <span className="vault-track-row__title">{wf.name}</span>
                  <span className="vault-track-row__meta">{formatFileSize(wf.size)}</span>
                </div>
                <div className="vault-track-row__actions">
                  <button className="vault-btn vault-btn--sm" onClick={() => openFile(wf)} title="Open in new tab">
                    Open
                  </button>
                  <button className="vault-btn vault-btn--sm" onClick={() => downloadFile(wf)} title="Download">
                    <Download size={12} />
                  </button>
                </div>
                <button
                  className="vault-track-row__del"
                  title="Delete from Workspace"
                  onClick={() => { if (confirm(`Delete "${wf.name}"?`)) void deleteWorkspaceFile(wf.id); }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function VaultRoute() {
  const { init, initialized, vaultTracks, workspaceFiles } = useVaultStore();
  const [activeTab, setActiveTab] = useState<'music' | 'workspace'>('music');
  const [showTutorial, setShowTutorial] = useState(
    () => localStorage.getItem('sonata-vault-tutorial-dismissed') !== 'yes',
  );

  useEffect(() => {
    void init();
  }, [init]);

  function dismissTutorial() {
    localStorage.setItem('sonata-vault-tutorial-dismissed', 'yes');
    setShowTutorial(false);
  }

  if (!initialized) {
    return <div className="sonata-coming-soon"><span className="sonata-coming-soon__title">Loading Pod…</span></div>;
  }

  return (
    <div className="vault-root">
      <div className="vault-header">
        <div className="vault-header__left">
          <HardDrive size={18} />
          <h1 className="vault-header__title">Pod</h1>
          <span className="vault-muted" style={{ fontSize: 12 }}>
            {vaultTracks.length} tracks · {workspaceFiles.length} documents
          </span>
        </div>
        {!showTutorial && (
          <button className="vault-btn" onClick={() => setShowTutorial(true)} title="Show help">
            <Info size={13} /> How it works
          </button>
        )}
      </div>

      {showTutorial && <TutorialCard onDismiss={dismissTutorial} />}

      <div className="vault-tabs">
        <button
          className={`vault-tab${activeTab === 'music' ? ' vault-tab--active' : ''}`}
          onClick={() => setActiveTab('music')}
        >
          <Music size={14} /> Music &amp; Video
        </button>
        <button
          className={`vault-tab${activeTab === 'workspace' ? ' vault-tab--active' : ''}`}
          onClick={() => setActiveTab('workspace')}
        >
          <FileText size={14} /> Workspace
        </button>
      </div>

      {activeTab === 'music' ? <MusicTab /> : <WorkspaceTab />}
    </div>
  );
}
