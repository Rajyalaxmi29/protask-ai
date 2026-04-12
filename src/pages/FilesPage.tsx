import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  File, Folder, Plus, Search, 
  Download, Trash2, Cloud,
  Image as ImageIcon, FileText, Video, Music,
  HardDrive, Menu, Filter, MoreVertical,
  Upload, Link, X, ExternalLink, Globe
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { persistentData } from '../lib/persistentData';

export default function FilesPage() {
  const [files, setFiles] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal state
  const [showPicker, setShowPicker] = useState(false);   // "upload or url" chooser
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [savingUrl, setSavingUrl] = useState(false);

  useEffect(() => { loadFiles(); }, []);

  const loadFiles = async () => {
    try {
      const userId = await persistentData.getUserId();
      if (!userId) return;
      const records = await persistentData.get<any>('files', userId);
      setFiles(records);
    } catch (e) {
      console.error('Failed to load files', e);
    }
  };

  const readFileAsDataURL = (file: File) => new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string || '');
    reader.readAsDataURL(file);
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const userId = await persistentData.getUserId();
      if (!userId) return;

      const uploadPromises = Array.from(e.target.files).map(async (f: File) => {
        let tStr = 'DOC';
        if (f.type.startsWith('image')) tStr = 'IMG';
        else if (f.type.startsWith('video')) tStr = 'VID';
        else if (f.type.startsWith('text')) tStr = 'TXT';
        else if (f.type.startsWith('audio')) tStr = 'AUD';
        else if (f.name.endsWith('.pdf')) tStr = 'PDF';
        
        let sizeStr = (f.size / 1024 / 1024).toFixed(1) + ' MB';
        if (f.size < 1024 * 1024) sizeStr = (f.size / 1024).toFixed(1) + ' KB';

        const content = await readFileAsDataURL(f);

        const fileData = {
          user_id: userId,
          name: f.name,
          type: tStr,
          size: sizeStr,
          realSize: f.size,
          source: 'upload',
          created_at: new Date().toISOString()
        };

        try {
          const result = await persistentData.mutate('files', 'INSERT', fileData);
          if (result && result.id) {
            try { localStorage.setItem(`file_content_${result.id}`, content); } 
            catch (q) { console.warn('Storage quota full'); }
          }
        } catch (err) { console.error('Upload failed', err); }
      });

      await Promise.all(uploadPromises);
      loadFiles();
      setShowPicker(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveUrl = async () => {
    if (!urlValue.trim()) return;
    setSavingUrl(true);
    try {
      const userId = await persistentData.getUserId();
      if (!userId) return;

      // Try to detect what kind of URL
      const lower = urlValue.toLowerCase();
      let tStr = 'URL';
      if (lower.includes('youtube') || lower.includes('youtu.be')) tStr = 'YT';
      else if (lower.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/)) tStr = 'IMG';
      else if (lower.match(/\.pdf(\?|$)/)) tStr = 'PDF';
      else if (lower.match(/\.(mp4|mov|webm)(\?|$)/)) tStr = 'VID';
      else if (lower.match(/github\.com/)) tStr = 'GH';
      else if (lower.match(/docs\.google/)) tStr = 'DOC';

      const displayName = urlTitle.trim() || new URL(urlValue.startsWith('http') ? urlValue : 'https://' + urlValue).hostname;

      const fileData = {
        user_id: userId,
        name: displayName,
        type: tStr,
        size: '—',
        url: urlValue.startsWith('http') ? urlValue : 'https://' + urlValue,
        source: 'url',
        created_at: new Date().toISOString()
      };

      await persistentData.mutate('files', 'INSERT', fileData);
      setShowUrlModal(false);
      setShowPicker(false);
      setUrlValue('');
      setUrlTitle('');
      loadFiles();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingUrl(false);
    }
  };

  const viewDocument = (file: any) => {
    // URL-type file → open directly
    if (file.source === 'url' && file.url) {
      window.open(file.url, '_blank');
      return;
    }

    const localContent = localStorage.getItem(`file_content_${file.id}`);
    if (!localContent) {
      alert("File content not cached. Please re-upload.");
      return;
    }
    try {
      fetch(localContent)
        .then(res => res.blob())
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          if (['IMG', 'PDF', 'TXT'].includes(file.type)) {
            window.open(blobUrl, '_blank');
          } else {
            const a = document.createElement('a');
            a.href = blobUrl; a.download = file.name; a.click();
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
          }
        });
    } catch (e) {
      const a = document.createElement('a');
      a.href = localContent; a.download = file.name; a.click();
    }
  };

  const removeFile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await persistentData.mutate('files', 'DELETE', { id }, id);
    localStorage.removeItem(`file_content_${id}`);
    loadFiles();
  };

  const getIconForType = (type: string, source: string) => {
    if (source === 'url') return Globe;
    switch(type) {
      case 'IMG': return ImageIcon;
      case 'VID': return Video;
      case 'AUD': return Music;
      case 'PDF': return FileText;
      case 'TXT': return FileText;
      case 'YT': return Video;
      case 'GH': return File;
      case 'DOC': return FileText;
      default: return File;
    }
  };

  const getTypeColor = (type: string, source: string) => {
    if (source === 'url') return '#6C4CF1';
    switch(type) {
      case 'IMG': return '#3B82F6';
      case 'VID': return '#EF4444';
      case 'PDF': return '#F59E0B';
      case 'AUD': return '#10B981';
      default: return 'var(--text-muted)';
    }
  };

  const totalSimulatedUsage = 2.4 * 1024 * 1024 * 1024;
  const dynamicUsage = files.filter(f => f.source !== 'url').reduce((acc, f) => acc + (f.realSize || 0), 0) + totalSimulatedUsage;
  const gbUsed = (dynamicUsage / (1024 * 1024 * 1024)).toFixed(1);
  const percentage = Math.min(Math.round(((dynamicUsage / (1024 * 1024 * 1024)) / 5.0) * 100), 100);

  const uploadedFiles = files.filter(f => f.source !== 'url');
  const linkedUrls = files.filter(f => f.source === 'url');

  return (
    <div className="page" style={{ background: '#000' }}>
      <header style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '20px', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.85)', 
        backdropFilter: 'blur(12px)', zIndex: 100 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Menu size={20} />
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px' }}>STORAGE</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 900 }}>Neural Vault</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, color: 'var(--text-secondary)' }}>
          <Search size={18} />
          <Filter size={18} />
        </div>
      </header>

      <div className="page-content" style={{ padding: '20px', paddingBottom: 100 }}>

        {/* Storage Bar */}
        <div className="card" style={{ padding: '28px 24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(0,255,178,0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cloud size={22} />
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 900 }}>Storage Status</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>{gbUsed} GB of 5.0 GB used</div>
              </div>
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--accent)' }}>{percentage}%</span>
          </div>
          <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
            <div style={{ width: `${percentage}%`, transition: 'width 0.5s ease', height: '100%', background: 'var(--accent)', borderRadius: 3, boxShadow: '0 0 10px var(--accent-glow)' }} />
          </div>
          {/* Quick stats */}
          <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Upload size={12} color="var(--accent)" />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>{uploadedFiles.length} uploaded</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Link size={12} color="#6C4CF1" />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>{linkedUrls.length} links</span>
            </div>
          </div>
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: 14 }}>UPLOADED FILES</div>
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {uploadedFiles.map((file) => {
                  const FileIcon = getIconForType(file.type, file.source);
                  const iconColor = getTypeColor(file.type, file.source);
                  return (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                      className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: '12px', background: `${iconColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileIcon size={20} color={iconColor} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: 2 }}>{file.type} · {file.size}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="icon-btn" style={{ background: 'transparent' }} onClick={() => viewDocument(file)}>
                          <Download size={15} color="var(--text-muted)" />
                        </button>
                        <button className="icon-btn" style={{ background: 'transparent' }} onClick={(e) => removeFile(file.id, e)}>
                          <Trash2 size={15} color="#EF4444" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Saved Links */}
        {linkedUrls.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: 14 }}>SAVED LINKS</div>
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {linkedUrls.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                    className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(108,76,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Globe size={20} color="#6C4CF1" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6C4CF1', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.url}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="icon-btn" style={{ background: 'transparent' }} onClick={() => window.open(file.url, '_blank')}>
                        <ExternalLink size={15} color="#6C4CF1" />
                      </button>
                      <button className="icon-btn" style={{ background: 'transparent' }} onClick={(e) => removeFile(file.id, e)}>
                        <Trash2 size={15} color="#EF4444" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {files.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
            <Cloud size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Vault is empty</div>
            <div style={{ fontSize: '0.8rem' }}>Tap + to upload a file or save a link</div>
          </div>
        )}
      </div>

      <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
        onClick={() => setShowPicker(true)}
        style={{ 
          position: 'fixed', bottom: 100, right: 24,
          width: 56, height: 56, borderRadius: '20px',
          background: 'var(--accent)', border: 'none',
          color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px var(--accent-glow)', zIndex: 100, cursor: 'pointer'
        }}
      >
        <Plus size={28} />
      </motion.button>

      {/* ── Option Picker Sheet ── */}
      <AnimatePresence>
        {showPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPicker(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 300 }}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 301, background: '#0d0d0d', borderTop: '1px solid var(--border)', borderRadius: '28px 28px 0 0', padding: '20px 24px 110px' }}
            >
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 24px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 900 }}>Add to Vault</h2>
                <button onClick={() => setShowPicker(false)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={15} color="var(--text-muted)" />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Upload File */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ padding: '28px 16px', borderRadius: '20px', background: 'rgba(0,255,178,0.06)', border: '1px solid rgba(0,255,178,0.2)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}
                >
                  <div style={{ width: 52, height: 52, borderRadius: '16px', background: 'rgba(0,255,178,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Upload size={24} color="var(--accent)" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--accent)' }}>Upload File</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>Images, PDFs, docs</div>
                  </div>
                </motion.button>

                {/* Save URL */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setShowUrlModal(true); setShowPicker(false); }}
                  style={{ padding: '28px 16px', borderRadius: '20px', background: 'rgba(108,76,241,0.06)', border: '1px solid rgba(108,76,241,0.2)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}
                >
                  <div style={{ width: 52, height: 52, borderRadius: '16px', background: 'rgba(108,76,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Link size={24} color="#6C4CF1" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#6C4CF1' }}>Save Link</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>YouTube, GitHub, Docs</div>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── URL Modal ── */}
      <AnimatePresence>
        {showUrlModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowUrlModal(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 302 }}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 303, background: '#0d0d0d', borderTop: '1px solid var(--border)', borderRadius: '28px 28px 0 0', padding: '20px 24px 80px' }}
            >
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 24px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 900 }}>Save a Link</h2>
                <button onClick={() => setShowUrlModal(false)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={15} color="var(--text-muted)" />
                </button>
              </div>

              {/* URL Input */}
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', marginBottom: 12 }}>
                <Globe size={16} color="#6C4CF1" />
                <input
                  type="url"
                  placeholder="https://..."
                  value={urlValue}
                  onChange={e => setUrlValue(e.target.value)}
                  autoFocus
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}
                />
              </div>

              {/* Title Input */}
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', marginBottom: 24 }}>
                <FileText size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Label (optional — e.g. 'React Docs')"
                  value={urlTitle}
                  onChange={e => setUrlTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveUrl()}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSaveUrl}
                disabled={savingUrl || !urlValue.trim()}
                style={{ 
                  width: '100%', padding: '17px', borderRadius: '18px', border: 'none',
                  background: urlValue.trim() ? '#6C4CF1' : 'var(--bg-card)',
                  color: urlValue.trim() ? '#fff' : 'var(--text-muted)',
                  fontSize: '1rem', fontWeight: 900, cursor: urlValue.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: urlValue.trim() ? '0 8px 24px rgba(108,76,241,0.4)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {savingUrl
                  ? <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  : <><Link size={18} /> Save Link</>
                }
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
