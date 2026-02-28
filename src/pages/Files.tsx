import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, FileText, Image as ImageIcon, FileCode, Trash2, Eye, Upload, AlertTriangle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';

interface FileData {
  id: string;
  name: string;
  type: 'PDF' | 'JPG' | 'DOCX';
  uploadDate: string;
  expiryDate?: string;
  tags: string[];
  category: string;
}

const initialFiles: FileData[] = [
  { id: '1', name: 'Identity_Card.pdf', type: 'PDF', uploadDate: 'Jan 12, 2026', expiryDate: 'Mar 15, 2026', tags: ['Personal', 'ID'], category: 'Personal' },
  { id: '2', name: 'Project_Proposal.docx', type: 'DOCX', uploadDate: 'Feb 05, 2026', tags: ['Work', 'Design'], category: 'Work' },
  { id: '3', name: 'Receipt_Feb.jpg', type: 'JPG', uploadDate: 'Feb 20, 2026', tags: ['Finance', 'Tax'], category: 'Finance' },
  { id: '4', name: 'Medical_Report.pdf', type: 'PDF', uploadDate: 'Feb 22, 2026', expiryDate: 'Aug 22, 2026', tags: ['Medical'], category: 'Medical' },
];

export default function Files() {
  const [files, setFiles] = useState<FileData[]>(initialFiles);
  const [filter, setFilter] = useState<'All' | 'Expiring' | 'Tag'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const deleteFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const isExpiringSoon = (date?: string) => {
    if (!date) return false;
    // Simple check for demo: if it's in March 2026, it's soon
    return date.includes('Mar');
  };

  const filteredFiles = files.filter(f => {
    if (filter === 'Expiring') return isExpiringSoon(f.expiryDate);
    return true;
  });

  const expiringCount = files.filter(f => isExpiringSoon(f.expiryDate)).length;

  return (
    <div className="min-h-screen bg-[#020817] text-white font-sans flex flex-col">
      <Navbar />
      
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
              onClick={() => setFilter(f.id as any)}
              className={`px-6 py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                filter === f.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* File Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredFiles.length > 0 ? (
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
                  <div className={`mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest ${
                    isExpiringSoon(file.expiryDate) ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-gray-400'
                  }`}>
                    Exp: {file.expiryDate}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-6">
                  {file.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded text-[8px] md:text-[9px] font-black uppercase tracking-widest">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                    <Eye size={14} />
                    Preview
                  </button>
                  <button 
                    onClick={() => deleteFile(file.id)}
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
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
          <div className="border-2 border-dashed border-white/10 rounded-3xl p-10 flex flex-col items-center justify-center hover:border-blue-500/30 transition-all cursor-pointer group">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-blue-500 transition-colors mb-4">
              <Upload size={32} />
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Drag & Drop File</p>
            <p className="text-[10px] text-gray-600 mt-2 uppercase tracking-widest">or click to browse</p>
          </div>
          
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Document Name</label>
            <input 
              type="text" 
              placeholder="e.g. Passport_Copy.pdf"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Expiry Date (Optional)</label>
              <input 
                type="date" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Category</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all appearance-none">
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
