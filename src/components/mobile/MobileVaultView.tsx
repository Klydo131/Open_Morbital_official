// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useRef, useState } from 'react';
import { HardDrive, Music, FileText, Plus, Trash2, Play, Info, X, Download } from 'lucide-react';
import { useVaultStore } from '../../store/vaultStore';
import { usePlayerStore, type MorbitalTrack } from '../../store/playerStore';
import { playTrackNow } from '../../core/audio/audioEngine';
import { formatFileSize, type VaultTrack } from '../../core/storage/vaultDb';

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

const AUDIO_ACCEPT = '.mp3,.wav,.flac,.m4a,.aac,.ogg,.opus,.webm,.alac,.mp4';
const WORKSPACE_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip';

export function MobileVaultView() {
  const { init, initialized, vaultTracks, workspaceFiles, vaultPlaylists, saveFilesToVault, saveFileToWorkspace, removeVaultTrack, deleteWorkspaceFile, createPlaylist } = useVaultStore();
  const addTracks = usePlayerStore((s) => s.addTracks);
  const addToast = usePlayerStore((s) => s.addToast);

  const [activeTab, setActiveTab] = useState<'music' | 'workspace'>('music');
  const [showHelp, setShowHelp] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void init();
  }, [init]);

  async function handleAudioFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const saved = await saveFilesToVault(files);
    addToast(`Saved ${saved.length} file${saved.length !== 1 ? 's' : ''} to Pod`, 'success');
    e.target.value = '';
  }

  async function handleDocFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    await Promise.all(files.map((f) => saveFileToWorkspace(f)));
    addToast(`Saved ${files.length} file${files.length !== 1 ? 's' : ''} to Workspace`, 'success');
    e.target.value = '';
  }

  function playTrack(vt: VaultTrack) {
    const morbital = vaultTrackToMorbital(vt);
    addTracks([morbital]);
    playTrackNow(morbital);
  }

  function playAll() {
    if (!vaultTracks.length) return;
    const morbitals = vaultTracks.map(vaultTrackToMorbital);
    addTracks(morbitals);
    playTrackNow(morbitals[0]);
  }

  function openDoc(file: { blob: Blob; name: string }) {
    const url = URL.createObjectURL(file.blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function downloadDoc(file: { blob: Blob; name: string }) {
    const url = URL.createObjectURL(file.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  if (!initialized) {
    return <div className="vault-mobile-loading">Loading Pod…</div>;
  }

  return (
    <div className="vault-mobile">
      {/* Header */}
      <div className="vault-mobile__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HardDrive size={16} />
          <span className="vault-mobile__title">Pod</span>
          <span className="vault-muted" style={{ fontSize: 11 }}>{vaultTracks.length} tracks</span>
        </div>
        <button className="vault-mobile__info-btn" onClick={() => setShowHelp(!showHelp)}>
          <Info size={16} />
        </button>
      </div>

      {/* Help panel */}
      {showHelp && (
        <div className="vault-mobile__help">
          <button className="vault-tutorial__close" onClick={() => setShowHelp(false)}><X size={13} /></button>
          <p><strong>Queue</strong> = temporary (lost when you close the app).</p>
          <p><strong>Pod → Music</strong> = permanent files saved on this device. Works offline. No account needed.</p>
          <p><strong>Pod → Workspace</strong> = PDFs and documents saved here, open them while music plays.</p>
          <p style={{ marginTop: 8 }}>To save: tap <strong>+ Add</strong> in the Music tab. Files stay even after closing.</p>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="vault-mobile__tabs">
        <button
          className={`vault-mobile__tab${activeTab === 'music' ? ' vault-mobile__tab--active' : ''}`}
          onClick={() => setActiveTab('music')}
        >
          <Music size={13} /> Music &amp; Video
        </button>
        <button
          className={`vault-mobile__tab${activeTab === 'workspace' ? ' vault-mobile__tab--active' : ''}`}
          onClick={() => setActiveTab('workspace')}
        >
          <FileText size={13} /> Workspace
        </button>
      </div>

      {/* Music tab */}
      {activeTab === 'music' && (
        <div className="vault-mobile__content">
          <div className="vault-mobile__toolbar">
            {vaultTracks.length > 0 && (
              <button className="vault-btn vault-btn--sm" onClick={playAll}>
                <Play size={12} /> Play All
              </button>
            )}
            <input ref={audioInputRef} type="file" accept={AUDIO_ACCEPT} multiple style={{ display: 'none' }} onChange={handleAudioFiles} />
            <button className="vault-btn vault-btn--primary vault-btn--sm" onClick={() => audioInputRef.current?.click()}>
              <Plus size={12} /> Add Files
            </button>
          </div>

          {vaultTracks.length === 0 && (
            <div className="vault-mobile__empty">
              <Music size={28} />
              <p>No saved tracks yet</p>
              <p className="vault-muted">Tap + Add Files to save music permanently to this device</p>
            </div>
          )}

          <div className="vault-track-list">
            {vaultTracks.map((vt) => (
              <div key={vt.id} className="vault-track-row">
                <button className="vault-track-row__play" onClick={() => playTrack(vt)}>
                  <Play size={13} />
                </button>
                <div className="vault-track-row__info">
                  <span className="vault-track-row__title">{vt.title}</span>
                  <span className="vault-track-row__meta">{vt.artist} · {formatFileSize(vt.size)}</span>
                </div>
                <button
                  className="vault-track-row__del"
                  onClick={() => { if (confirm(`Delete "${vt.title}"?`)) void removeVaultTrack(vt.id); }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workspace tab */}
      {activeTab === 'workspace' && (
        <div className="vault-mobile__content">
          <div className="vault-mobile__toolbar">
            <input ref={docInputRef} type="file" accept={WORKSPACE_ACCEPT} multiple style={{ display: 'none' }} onChange={handleDocFiles} />
            <button className="vault-btn vault-btn--primary vault-btn--sm" onClick={() => docInputRef.current?.click()}>
              <Plus size={12} /> Add Documents
            </button>
          </div>

          {workspaceFiles.length === 0 && (
            <div className="vault-mobile__empty">
              <FileText size={28} />
              <p>No documents saved yet</p>
              <p className="vault-muted">Save PDFs, Word docs, Excel sheets — open them while music plays</p>
            </div>
          )}

          <div className="vault-track-list">
            {workspaceFiles.map((wf) => (
              <div key={wf.id} className="vault-track-row">
                <div className="vault-track-row__info">
                  <span className="vault-track-row__title">{wf.name}</span>
                  <span className="vault-track-row__meta">{formatFileSize(wf.size)}</span>
                </div>
                <div className="vault-track-row__actions">
                  <button className="vault-btn vault-btn--sm" onClick={() => openDoc(wf)}>Open</button>
                  <button className="vault-btn vault-btn--sm" onClick={() => downloadDoc(wf)}><Download size={12} /></button>
                </div>
                <button
                  className="vault-track-row__del"
                  onClick={() => { if (confirm(`Delete "${wf.name}"?`)) void deleteWorkspaceFile(wf.id); }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
