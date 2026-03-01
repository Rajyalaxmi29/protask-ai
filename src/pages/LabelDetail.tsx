import React, { useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Plus, CheckCircle2, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import { useCustomLabels, useLabelItems } from '../lib/useCustomLabels';

export default function LabelDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { labels, removeLabel } = useCustomLabels();
    const { items, addItem, toggleItem, removeItem } = useLabelItems(id);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newItemTitle, setNewItemTitle] = useState('');

    const label = labels.find(l => l.id === id);

    if (!label && labels.length > 0) {
        // If labels are loaded but this one isn't found, 404/redirect
        return <Navigate to="/dashboard" replace />;
    }

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemTitle.trim()) return;
        addItem(newItemTitle.trim());
        setNewItemTitle('');
        setIsModalOpen(false);
    };

    const handleDeleteLabel = () => {
        if (confirm(`Are you sure you want to delete the label "${label?.name}"? All tasks inside will be lost.`)) {
            removeLabel(id!);
            navigate('/dashboard');
        }
    };

    const completedCount = items.filter(t => t.completed).length;
    const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

    return (
        <div className="min-h-screen bg-[#020817] text-white font-sans flex flex-col">
            <Navbar />

            <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight">{label?.name || 'Loading...'}</h2>
                        <button
                            onClick={handleDeleteLabel}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                            title="Delete Label"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/30 active:scale-95"
                    >
                        <Plus size={18} />
                        Add Item
                    </button>
                </div>

                {/* Task List */}
                <div className="space-y-4 mb-12">
                    {items.length > 0 ? (
                        items.map((task) => (
                            <motion.div
                                layout
                                key={task.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-[#141414] border border-white/5 rounded-2xl hover:border-white/10 transition-all group gap-4"
                            >
                                <div className="flex items-center gap-5">
                                    <button
                                        onClick={() => toggleItem(task.id)}
                                        className={`w-6 h-6 shrink-0 rounded-lg border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-blue-600 border-blue-600' : 'border-gray-600 hover:border-blue-500'
                                            }`}
                                    >
                                        {task.completed && <CheckCircle2 size={14} className="text-white" />}
                                    </button>
                                    <div className="min-w-0">
                                        <h4 className={`font-bold text-base md:text-lg transition-all truncate ${task.completed ? 'text-gray-600 line-through' : 'text-white'}`}>
                                            {task.title}
                                        </h4>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-6">
                                    <button
                                        onClick={() => removeItem(task.id)}
                                        className="text-gray-600 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-[#141414] rounded-3xl border border-dashed border-white/10">
                            <p className="text-gray-500 font-medium px-6">Nothing here yet. Click + to add your first item.</p>
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                {items.length > 0 && (
                    <div className="bg-[#141414] p-6 rounded-3xl border border-white/5">
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                {completedCount} of {items.length} items completed
                            </p>
                            <p className="text-sm font-bold text-blue-500">{Math.round(progress)}%</p>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                            />
                        </div>
                    </div>
                )}
            </main>

            {/* Add Task Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New Item"
            >
                <form className="space-y-5" onSubmit={handleCreateTask}>
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Item Title</label>
                        <input
                            type="text"
                            placeholder="What needs to be done?"
                            value={newItemTitle}
                            onChange={(e) => setNewItemTitle(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 uppercase text-xs tracking-widest"
                        >
                            Save Item
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all uppercase text-xs tracking-widest"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
