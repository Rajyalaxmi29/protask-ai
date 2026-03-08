import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, FileText, Image as ImageIcon, FileCode, Trash2, Eye, Upload, AlertTriangle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import { supabase } from '../lib/supabase';

interface FileData {
  id: string;
  name: string;
  type: 'PDF' | 'JPG' | 'DOCX';
  uploadDate: string;
  expiryDate?: string;
  rawExpiryDate?: string;
  tags: string[];
  category: string;
  filePath: string;
}

interface DBFile {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  category: string;
  tags: string;
  expiry_date: string | null;
  created_at: string;
}

type FilesTableName = 'files' | 'documents';

export default function Files() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [filter, setFilter] = useState<'All' | 'Expiring' | 'Tag'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');
  const [loading, setLoading] = useState(true);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [category, setCategory] = useState('Personal');
  const [tags, setTags] = useState('');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [filesTable, setFilesTable] = useState<FilesTableName | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 2500);
  };

  const getErrorCode = (error: unknown): string | undefined => {
    if (error && typeof error === 'object' && 'code' in error) {
      return String((error as { code?: string }).code || '');
    }
    return undefined;
  };

  const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error(JSON.stringify(error, null, 2));
      return null;
    }
    return user;
  };

  const getFileType = (name: string): 'PDF' | 'JPG' | 'DOCX' => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return 'PDF';
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'webp') return 'JPG';
    return 'DOCX';
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return undefined;
    return date.toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  const mapDBFile = (f: DBFile): FileData => ({
    id: f.id,
    name: f.file_name,
    type: getFileType(f.file_name),
    uploadDate: formatDate(f.created_at) || '',
    expiryDate: formatDate(f.expiry_date),
    rawExpiryDate: f.expiry_date || undefined,
    tags: (f.tags || '').split(',').map(tag => tag.trim()).filter(Boolean),
    category: f.category,
    filePath: f.file_path,
  });

  const resolveFilesTable = async (userId: string): Promise<FilesTableName | null> => {
    if (filesTable) return filesTable;

    const candidates: FilesTableName[] = ['files', 'documents'];
    for (const table of candidates) {
      const { error } = await supabase
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (!error) {
        setFilesTable(table);
        return table;
      }

      if (getErrorCode(error) !== 'PGRST205') {
        console.error(JSON.stringify(error, null, 2));
        break;
      }
    }

    return null;
  };

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) {
        setFiles([]);
        return;
      }

      const table = await resolveFilesTable(user.id);
      if (!table) {
        showToast('Files table not found', 'error');
        setFiles([]);
        return;
      }

      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(JSON.stringify(error, null, 2));
        showToast('Unable to fetch files', 'error');
        return;
      }

      setFiles(((data || []) as DBFile[]).map(mapDBFile));
    } catch (error) {
      console.error(JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (file: FileData) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        showToast('Delete error', 'error');
        return;
      }

      const table = await resolveFilesTable(user.id);
      if (!table) {
        showToast('Delete error', 'error');
        return;
      }

      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([file.filePath]);

      if (storageError) {
        console.error(JSON.stringify(storageError, null, 2));
        showToast('Delete error', 'error');
        return;
      }

      const { error: dbError } = await supabase
        .from(table)
        .delete()
        .eq('id', file.id);

      if (dbError) {
        console.error(JSON.stringify(dbError, null, 2));
        showToast('Delete error', 'error');
        return;
      }

      setFiles(prev => prev.filter(f => f.id !== file.id));
      showToast('Delete success', 'success');
    } catch (error) {
      console.error(JSON.stringify(error, null, 2));
      showToast('Delete error', 'error');
    }
  };

  const previewFile = async (file: FileData) => {
    try {
      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(file.filePath);

      if (data?.publicUrl) {
        window.open(data.publicUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error(JSON.stringify(error, null, 2));
    }
  };

  const uploadFile = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!selectedFile) {
        showToast('Upload error', 'error');
        return;
      }

      const user = await getCurrentUser();
      if (!user) {
        showToast('Upload error', 'error');
        return;
      }

      const table = await resolveFilesTable(user.id);
      if (!table) {
        showToast('Upload error', 'error');
        return;
      }

      const finalName = documentName.trim() || selectedFile.name;
      const filePath = `${user.id}/${selectedFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile, { upsert: true });

      if (uploadError) {
        console.error(JSON.stringify(uploadError, null, 2));
        showToast('Upload error', 'error');
        return;
      }

      const { error: insertError } = await supabase
        .from(table)
        .insert({
          file_name: finalName,
          file_path: filePath,
          category,
          tags,
          expiry_date: expiryDate || null,
          user_id: user.id,
        });

      if (insertError) {
        console.error(JSON.stringify(insertError, null, 2));
        showToast('Upload error', 'error');
        return;
      }

      await fetchFiles();
      setIsModalOpen(false);
      setSelectedFile(null);
      setDocumentName('');
      setExpiryDate('');
      setCategory('Personal');
      setTags('');
      showToast('Upload success', 'success');
    } catch (error) {
      console.error(JSON.stringify(error, null, 2));
      showToast('Upload error', 'error');
    }
  };

  const isExpiringSoon = (date?: string) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(date);
    expiry.setHours(0, 0, 0, 0);

    const diffMs = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  };

  const allTags = useMemo<string[]>(
    () => Array.from(new Set<string>(files.flatMap(f => f.tags))).sort((a, b) => a.localeCompare(b)),
    [files]
  );

  useEffect(() => {
    if (selectedTag && !allTags.some(tag => tag.toLowerCase() === selectedTag.toLowerCase())) {
      setSelectedTag('');
    }
  }, [allTags, selectedTag]);

  const filteredFiles = files.filter(f => {
    if (filter === 'Expiring') return isExpiringSoon(f.rawExpiryDate);
    if (filter === 'Tag') {
      if (!selectedTag) return true;
      return f.tags.some(tag => tag.toLowerCase() === selectedTag.toLowerCase());
    }
    return true;
  });

  const expiringCount = files.filter(f => isExpiringSoon(f.rawExpiryDate)).length;

  return (
    <div className="min-h-screen bg-[#020817] text-white font-sans flex flex-col">
      <Navbar />

      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-4 py-3 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest border ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
            {toast.message}
          </div>
        </div>
      )}

      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
        {expiringCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-500"
          >
            <AlertTriangle size={20} className="shrink-0" />
            <p className="text-[10px] md:text-sm font-bold uppercase tracking-widest">
              ⚠️ {expiringCount} document{expiringCount > 1 ? 's are' : ' is'} expiring within 30 days. Review now.
            </p>
          </motion.div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">Files & Documents</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/30 active:scale-95"
          >
            <Plus size={18} />
            Upload File
          </button>
        </div>

        {/* Filter Tabs - Scrollable on mobile */}
        <div className="flex items-center gap-2 mb-12 p-1 bg-white/5 rounded-full w-full md:w-fit overflow-x-auto no-scrollbar">
          {[
            { id: 'All', label: 'All Files' },
            { id: 'Expiring', label: 'Expiring Soon' },
            { id: 'Tag', label: 'By Tag' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => {
                const nextFilter = f.id as 'All' | 'Expiring' | 'Tag';
                setFilter(nextFilter);
                if (nextFilter === 'Tag' && !selectedTag && allTags.length > 0) {
                  setSelectedTag(allTags[0]);
                }
              }}
              className={`px-6 py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${filter === f.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-white'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filter === 'Tag' && (
          <div className="flex items-center gap-2 mb-12 p-1 bg-white/5 rounded-full w-full md:w-fit overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedTag('')}
              className={`px-6 py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedTag === '' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-white'
                }`}
            >
              All Tags
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-6 py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedTag.toLowerCase() === tag.toLowerCase() ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-white'
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* File Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="bg-[#141414] border border-white/5 rounded-3xl p-6 animate-pulse"
              >
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/5 mb-6" />
                <div className="h-6 bg-white/5 rounded mb-2" />
                <div className="h-3 bg-white/5 rounded mb-4" />
                <div className="h-6 w-24 bg-white/5 rounded-full mb-4" />
                <div className="flex gap-2 mb-6">
                  <div className="h-4 w-12 bg-white/5 rounded" />
                  <div className="h-4 w-16 bg-white/5 rounded" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-10 bg-white/5 rounded-xl" />
                  <div className="w-10 h-10 bg-white/5 rounded-xl" />
                </div>
              </div>
            ))
          ) : filteredFiles.length > 0 ? (
            filteredFiles.map((file) => (
              <motion.div
                layout
                key={file.id}
                className="bg-[#141414] border border-white/5 rounded-3xl p-6 hover:border-blue-500/30 transition-all group relative"
              >
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 text-gray-400 group-hover:text-blue-500 transition-colors shrink-0">
                  {file.type === 'PDF' ? <FileText size={24} className="md:w-7 md:h-7" /> : file.type === 'JPG' ? <ImageIcon size={24} className="md:w-7 md:h-7" /> : <FileCode size={24} className="md:w-7 md:h-7" />}
                </div>

                <h4 className="font-bold text-base md:text-lg text-white mb-1 truncate pr-8">{file.name}</h4>
                <p className="text-[9px] md:text-[10px] text-gray-500 font-black uppercase tracking-widest mb-4">{file.uploadDate}</p>

                {file.expiryDate && (
                  <div className={`mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest ${isExpiringSoon(file.rawExpiryDate) ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-gray-400'
                    }`}>
                    Exp: {file.expiryDate}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-6">
                  {file.tags.map(tag => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => {
                        setFilter('Tag');
                        setSelectedTag(tag);
                      }}
                      className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded text-[8px] md:text-[9px] font-black uppercase tracking-widest"
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => previewFile(file)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    <Eye size={14} />
                    Preview
                  </button>
                  <button
                    onClick={() => deleteFile(file)}
                    className="w-10 h-10 bg-white/5 hover:bg-red-500/10 text-gray-500 hover:text-red-500 rounded-xl transition-all flex items-center justify-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-[#141414] rounded-3xl border border-dashed border-white/10">
              <p className="text-gray-500 font-medium px-6">Nothing here yet. Click + to add your first one.</p>
            </div>
          )}
        </div>
      </main>

      {/* Upload Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload New Document"
      >
        <form className="space-y-5" onSubmit={uploadFile}>
          <div className="relative border-2 border-dashed border-white/10 rounded-3xl p-10 flex flex-col items-center justify-center hover:border-blue-500/30 transition-all cursor-pointer group">
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-blue-500 transition-colors mb-4">
              <Upload size={32} />
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Drag & Drop File</p>
            <p className="text-[10px] text-gray-600 mt-2 uppercase tracking-widest">{selectedFile ? selectedFile.name : 'or click to browse'}</p>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Document Name</label>
            <input
              type="text"
              placeholder="e.g. Passport_Copy.pdf"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Expiry Date (Optional)</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all appearance-none"
              >
                <option value="Personal">Personal</option>
                <option value="Work">Work</option>
                <option value="Finance">Finance</option>
                <option value="Medical">Medical</option>
                <option value="Legal">Legal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Tags (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. ID, Passport, 2026"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 uppercase text-xs tracking-widest"
            >
              Upload
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
