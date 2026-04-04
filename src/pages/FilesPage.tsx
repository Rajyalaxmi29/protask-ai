import React, { useEffect, useState, useRef } from 'react';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';
import type { FileRecord } from '../lib/supabase';

const FOLDER_COLORS: Record<string, string> = {
  General: '#2563eb', Work: '#f59e0b', Personal: '#8b5cf6',
  Images: '#ec4899', Documents: '#14b8a6', Downloads: '#f97316',
};

function fileTypeIcon(name?: string): string {
  const ext = name?.split('.').pop()?.toLowerCase() || '';
  if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return '🖼️';
  if (ext === 'pdf') return '📄';
  if (['doc','docx','txt','md'].includes(ext)) return '📝';
  if (['xls','xlsx','csv'].includes(ext)) return '📊';
  if (['ppt','pptx'].includes(ext)) return '📑';
  if (['zip','tar','rar','gz'].includes(ext)) return '🗜️';
  if (['mp4','mov','avi','mkv'].includes(ext)) return '🎬';
  if (['mp3','wav','aac','flac'].includes(ext)) return '🎵';
  return '📁';
}

function formatSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const FOLDERS = ['General', 'Work', 'Personal', 'Images', 'Documents', 'Downloads'];

export default function FilesPage() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAdd, setShowAdd] = useState(false);

  // Form state
  const [tab, setTab] = useState<'upload' | 'link'>('upload');
  const [folder, setFolder] = useState('General');
  const [url, setUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  async function load() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setLoading(false); return; }
    const { data, error } = await supabase.from('files').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
    setFiles((error ? [] : data || []) as FileRecord[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const folders = ['All', ...FOLDERS];
  const displayed = activeFolder === 'All' ? files : files.filter(f => f.folder === activeFolder);
  const folderCounts = files.reduce((acc, f) => { acc[f.folder] = (acc[f.folder] || 0) + 1; return acc; }, {} as Record<string, number>);

  const deleteFile = async (f: FileRecord) => {
    // If stored in Supabase Storage, remove from bucket too
    if (f.url?.includes('supabase') && f.url?.includes('/storage/')) {
      const path = f.url.split('/storage/v1/object/public/files/')[1];
      if (path) await supabase.storage.from('files').remove([path]);
    }
    await supabase.from('files').delete().eq('id', f.id);
    setFiles(prev => prev.filter(x => x.id !== f.id));
  };

  const resetForm = () => {
    setSelectedFile(null);
    setUrl('');
    setLinkName('');
    setFolder('General');
    setError('');
    setTab('upload');
  };

  // Upload file to Supabase Storage
  const handleUpload = async () => {
    if (tab === 'upload' && !selectedFile) { setError('Please select a file.'); return; }
    if (tab === 'link' && !url.trim()) { setError('Please enter a URL.'); return; }
    if (tab === 'link' && !linkName.trim()) { setError('Please enter a name for the link.'); return; }

    setUploading(true);
    setError('');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setError('Not logged in.'); setUploading(false); return; }

    try {
      if (tab === 'upload' && selectedFile) {
        const ext = selectedFile.name.split('.').pop();
        const path = `${session.user.id}/${Date.now()}_${selectedFile.name}`;

        const { error: storageErr } = await supabase.storage.from('files').upload(path, selectedFile, { upsert: false });
        if (storageErr) {
          // If bucket doesn't exist, fall back to storing file info only
          if (storageErr.message?.includes('Bucket not found') || storageErr.message?.includes('bucket')) {
            setError('Storage bucket not set up. Please create a "files" bucket in Supabase Storage first, or use the Link tab instead.');
            setUploading(false); return;
          }
          throw storageErr;
        }

        const { data: urlData } = supabase.storage.from('files').getPublicUrl(path);
        const { data, error: dbErr } = await supabase.from('files').insert({
          user_id: session.user.id,
          name: selectedFile.name,
          type: selectedFile.type || ext || null,
          size: selectedFile.size,
          url: urlData.publicUrl,
          folder,
        }).select().single();
        if (dbErr) throw dbErr;
        setFiles(prev => [data as FileRecord, ...prev]);

      } else {
        // Link tab
        const { data, error: dbErr } = await supabase.from('files').insert({
          user_id: session.user.id,
          name: linkName.trim(),
          url: url.trim(),
          folder,
        }).select().single();
        if (dbErr) throw dbErr;
        setFiles(prev => [data as FileRecord, ...prev]);
      }

      resetForm();
      setShowAdd(false);
    } catch (e: any) {
      setError(e.message || 'Upload failed.');
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setSelectedFile(f);
  };

  return (
    <div className="page">
      <AppHeader
        title="Files"
        showBack
        showTheme
        rightContent={
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="icon-btn" onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')} aria-label="Toggle view">
              {viewMode === 'grid'
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              }
            </button>
            <button className="icon-btn" onClick={() => { resetForm(); setShowAdd(true); }} aria-label="Add file">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        }
      />

      <div className="page-content">
        {/* Stats */}
        <div className="stats-row" style={{ marginBottom: 16 }}>
          <div className="stat-card"><div className="stat-card__value">{files.length}</div><div className="stat-card__label">Total</div></div>
          <div className="stat-card stat-card--normal"><div className="stat-card__value" style={{ color: 'var(--accent-light)' }}>{Object.keys(folderCounts).length}</div><div className="stat-card__label">Folders</div></div>
          <div className="stat-card stat-card--normal"><div className="stat-card__value" style={{ color: 'var(--success)' }}>{files.filter(f => f.url).length}</div><div className="stat-card__label">With Links</div></div>
        </div>

        {/* Folder chips */}
        <div className="chips" style={{ marginBottom: 16 }}>
          {folders.map(f => (
            <button key={f} className={`chip ${activeFolder === f ? 'active' : ''}`} onClick={() => setActiveFolder(f)}>
              {f}{f !== 'All' && folderCounts[f] ? ` (${folderCounts[f]})` : ''}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? '1fr 1fr' : '1fr', gap: 10 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__emoji">📁</div>
            <div className="empty-state__title">No files here</div>
            <div className="empty-state__desc">Upload a file or add a link</div>
            <button className="btn btn-primary" style={{ width: 'auto', padding: '10px 24px', marginTop: 8 }} onClick={() => { resetForm(); setShowAdd(true); }}>Add File</button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="file-grid">
            {displayed.map(f => (
              <div key={f.id} className="file-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="file-icon" style={{ background: `${FOLDER_COLORS[f.folder] || '#2563eb'}20` }}>
                    <span style={{ fontSize: '1.3rem' }}>{fileTypeIcon(f.name)}</span>
                  </div>
                  <button onClick={() => deleteFile(f)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <div>
                  <div className="file-name">{f.name}</div>
                  <div className="file-meta">{f.folder}{f.size ? ` · ${formatSize(f.size)}` : ''}</div>
                </div>
                {f.url && (
                  <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: 'var(--text-accent)', fontWeight: 600, textDecoration: 'none' }}>
                    {f.url.includes('supabase') && f.url.includes('/storage/') ? '⬇️ Download' : '🔗 Open link'}
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: '4px 16px' }}>
            {displayed.map(f => (
              <div key={f.id} className="file-list-item">
                <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: `${FOLDER_COLORS[f.folder] || '#2563eb'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                  {fileTypeIcon(f.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{f.folder}{f.size ? ` · ${formatSize(f.size)}` : ''} · {new Date(f.created_at).toLocaleDateString()}</div>
                </div>
                {f.url && (
                  <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-accent)', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                )}
                <button onClick={() => deleteFile(f)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Sheet */}
      {showAdd && (
        <div className="overlay" onClick={() => setShowAdd(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="sheet-handle" />
            <div className="sheet-title">Add File</div>

            {/* Upload vs Link tabs */}
            <div className="tabs" style={{ marginBottom: 16 }}>
              <button className={`tab-btn ${tab === 'upload' ? 'active' : ''}`} onClick={() => { setTab('upload'); setError(''); }}>
                📤 Upload File
              </button>
              <button className={`tab-btn ${tab === 'link' ? 'active' : ''}`} onClick={() => { setTab('link'); setError(''); }}>
                🔗 Add Link
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tab === 'upload' ? (
                <>
                  {/* Drag & drop zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${dragOver ? 'var(--accent-light)' : selectedFile ? 'var(--success)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-lg)',
                      padding: '24px 16px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: dragOver ? 'var(--accent-dim)' : selectedFile ? 'rgba(34,197,94,0.05)' : 'var(--bg-input)',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      style={{ display: 'none' }}
                      onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    {selectedFile ? (
                      <>
                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>{fileTypeIcon(selectedFile.name)}</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedFile.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{formatSize(selectedFile.size)}</div>
                        <button onClick={e => { e.stopPropagation(); setSelectedFile(null); }} style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.75rem' }}>Remove</button>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>📤</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>Tap to upload or drag & drop</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Any file type supported</div>
                      </>
                    )}
                  </div>

                  <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.75rem', color: 'var(--warning)' }}>
                    ⚠️ File upload requires a <strong>"files"</strong> bucket in Supabase Storage. If not set up, use the <strong>Link tab</strong> instead.
                  </div>
                </>
              ) : (
                <>
                  <input
                    id="link-name"
                    type="text"
                    className="input"
                    placeholder="Name (e.g. Project Report)"
                    value={linkName}
                    onChange={e => setLinkName(e.target.value)}
                    autoFocus
                  />
                  <input
                    id="link-url"
                    type="url"
                    className="input"
                    placeholder="https://... (URL or link)"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                  />
                </>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="file-folder">Folder</label>
                <select id="file-folder" className="select" value={folder} onChange={e => setFolder(e.target.value)}>
                  {FOLDERS.map(fl => <option key={fl}>{fl}</option>)}
                </select>
              </div>

              {error && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', margin: 0 }}>{error}</p>}

              <button id="add-file-submit" className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
                {uploading
                  ? <><span className="spinner" /> Uploading...</>
                  : tab === 'upload' ? '📤 Upload File' : '🔗 Save Link'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
