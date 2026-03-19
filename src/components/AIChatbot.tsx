import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  ListTodo,
  PiggyBank,
  Tag,
  FileText,
  Lightbulb,
  RefreshCw,
  Bot,
  Menu,
  Plus,
  MessageSquare,
  Paperclip,
} from 'lucide-react';
import { callHuggingFace, ChatMessage } from '../lib/huggingface';
import { fetchUserAIContext, buildSystemPrompt } from '../lib/aiContext';
import { supabase } from '../lib/supabase';

// ── Types ────────────────────────────────────────────────────────────────
interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  typing?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: number;
  messages: DisplayMessage[];
}

// ── Quick Actions ─────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    id: 'task-breakdown',
    icon: ListTodo,
    label: 'Break down my next task',
    prompt: 'Look at my task list and break down my most urgent incomplete task into clear, actionable subtasks.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20',
  },
  {
    id: 'budget-tips',
    icon: PiggyBank,
    label: 'Budget tips',
    prompt: 'Analyze my recent budget entries and give me 3 personalized tips to save money or improve my financial habits.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20',
  },
  {
    id: 'categorize',
    icon: Tag,
    label: 'Categorize an expense',
    prompt: 'I want to categorize an expense. Please ask me to describe the expense and then suggest the best category for it.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20',
  },
  {
    id: 'summarize-files',
    icon: FileText,
    label: 'Summarize my files',
    prompt: 'Look at my uploaded files list and give me a brief summary of what I have stored and any suggestions for organizing them.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20',
  },
  {
    id: 'productivity',
    icon: Lightbulb,
    label: 'Productivity tips',
    prompt: 'Based on my tasks and reminders, give me 3 actionable productivity tips for today.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20',
  },
];

// ── Markdown-lite renderer ────────────────────────────────────────────────
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Bold: **text**
    const boldified = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Bullet
    if (/^[•\-\*]\s/.test(line.trim())) {
      return (
        <li
          key={i}
          className="ml-4 list-none text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: boldified.replace(/^[•\-\*]\s/, '• ') }}
        />
      );
    }
    if (line.trim() === '') return <div key={i} className="h-2" />;
    return (
      <p
        key={i}
        className="text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: boldified }}
      />
    );
  });
}

// ── Typing Dots ───────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-blue-400"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [contextLoaded, setContextLoaded] = useState(false);
  const [contextError, setContextError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const savedSessions = localStorage.getItem(`protask_ai_sessions_${user.id}`);
        if (savedSessions) {
          try {
            const parsed = JSON.parse(savedSessions) as ChatSession[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSessions(parsed);
              const latest = parsed.sort((a,b) => b.updatedAt - a.updatedAt)[0];
              setCurrentSessionId(latest.id);
              setMessages(latest.messages);
              return;
            }
          } catch (e) {
            console.error("Failed to parse chat sessions", e);
          }
        } else {
            // Migration for users jumping from single-chat to multiple-chat
            const oldSaved = localStorage.getItem(`protask_ai_chat_${user.id}`);
            if (oldSaved) {
                try {
                    const parsedOld = JSON.parse(oldSaved);
                    if (Array.isArray(parsedOld) && parsedOld.length > 0) {
                        const migratedSession: ChatSession = {
                           id: Date.now().toString(),
                           title: 'Previous Chat',
                           updatedAt: Date.now(),
                           messages: parsedOld
                        };
                        setSessions([migratedSession]);
                        setCurrentSessionId(migratedSession.id);
                        setMessages(parsedOld);
                        return;
                    }
                } catch(e) {}
            }
        }
      }
    };
    loadHistory();
  }, []);

  // Save chat history on change
  useEffect(() => {
    const saveHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && messages.length > 0) {
        const toSave = messages.filter(m => !m.typing && m.id !== 'welcome');
        if (toSave.length === 0) return;

        setSessions(prevSessions => {
            let updated = [...prevSessions];
            let activeIdx = updated.findIndex(s => s.id === currentSessionId);
            
            let title = 'New Chat';
            const firstUserMsg = toSave.find(m => m.role === 'user');
            if (firstUserMsg) {
               title = firstUserMsg.content.slice(0, 30).trim();
               if (firstUserMsg.content.length > 30) title += '...';
            }

            if (activeIdx >= 0) {
                updated[activeIdx] = {
                   ...updated[activeIdx],
                   messages: toSave,
                   updatedAt: Date.now(),
                   title: updated[activeIdx].title === 'New Chat' || updated[activeIdx].title === 'Previous Chat' ? title : updated[activeIdx].title
                };
            } else {
                const newId = currentSessionId || Date.now().toString();
                if (!currentSessionId) setCurrentSessionId(newId);
                
                updated.push({
                   id: newId,
                   title,
                   messages: toSave,
                   updatedAt: Date.now()
                });
            }
            
            updated.sort((a,b) => b.updatedAt - a.updatedAt);
            localStorage.setItem(`protask_ai_sessions_${user.id}`, JSON.stringify(updated));
            return updated;
        });
      }
    };
    saveHistory();
  }, [messages, currentSessionId]);

  const createNewChat = () => {
      setCurrentSessionId(Date.now().toString());
      setMessages([]);
      setShowHistory(false);
  };

  const loadSession = (sessionId: string) => {
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
          setCurrentSessionId(session.id);
          setMessages(session.messages);
          setShowHistory(false);
      }
  };

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Load context once when chat is first opened
  const loadContext = useCallback(async () => {
    try {
      setContextLoaded(false);
      setContextError(false);
      const ctx = await fetchUserAIContext();
      const prompt = buildSystemPrompt(ctx);
      setSystemPrompt(prompt);
      setContextLoaded(true);
    } catch (err) {
      console.error('Failed to load AI context:', err);
      setContextError(true);
      setContextLoaded(true); // Still allow chat with fallback
      setSystemPrompt(
        'You are ProTask AI — a helpful productivity assistant. Help the user manage tasks, budget, reminders, and files.'
      );
    }
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    if (!contextLoaded) {
      loadContext();
      // Add welcome message ONLY if there are no existing messages loaded from history
      setMessages((prev) => {
        if (prev.length === 0) {
          return [
            {
              id: 'welcome',
              role: 'assistant',
              content:
                "👋 Hi! I'm **ProTask AI**, your personal productivity assistant.\n\nI have access to your tasks, budget, reminders, and files. Use the quick actions below or just ask me anything!",
            },
          ];
        }
        return prev;
      });
    }
  };

  // Convert display messages to API format
  const toApiMessages = (msgs: DisplayMessage[]): ChatMessage[] =>
    msgs
      .filter((m) => !m.typing && m.id !== 'welcome')
      .map((m) => ({ role: m.role, content: m.content }));

  const sendMessage = useCallback(
    async (textOverride?: string) => {
      const text = (textOverride ?? input).trim();
      if (!text || isLoading) return;

      setInput('');

      const userMsg: DisplayMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
      };

      const typingMsg: DisplayMessage = {
        id: 'typing',
        role: 'assistant',
        content: '',
        typing: true,
      };

      setMessages((prev) => [...prev, userMsg, typingMsg]);
      setIsLoading(true);

      try {
        const history = toApiMessages([...messages, userMsg]);
        let response = await callHuggingFace(systemPrompt, history);

        // -- AI ACTION PARSING --
        const budgetMatch = response.match(/<ADD_BUDGET\s+amount="([^"]+)"\s+category="([^"]+)"\s+note="([^"]*)"\s+type="([^"]+)"\s*\/>/);
        const taskMatch = response.match(/<ADD_TASK\s+title="([^"]+)"\s+priority="([^"]+)"\s+due_date="([^"]+)"\s*\/>/);
        const reminderMatch = response.match(/<ADD_REMINDER\s+title="([^"]+)"\s+reminder_time="([^"]+)"\s*\/>/);

        const { data: { user } } = await supabase.auth.getUser();

        if (budgetMatch && user) {
          try {
            const [_, amountStr, category, note, type] = budgetMatch;
            const amount = parseFloat(amountStr);
            
            if (!isNaN(amount)) {
              const today = new Date();
              const y = today.getFullYear();
              const m = String(today.getMonth() + 1).padStart(2, '0');
              const d = String(today.getDate()).padStart(2, '0');
              const dateSplit = `${y}-${m}-${d}`;
              
              const { error } = await supabase.from('budget_entries').insert({
                  user_id: user.id,
                  amount: amount,
                  category: category,
                  type: type.toLowerCase(),
                  entry_date: dateSplit,
                  note: note || category
              });
              
              if (!error) {
                response = `✅ Successfully added **₹${amount}** to your budget under **${category}**!`;
                // Refresh AI context so it knows about the new entry
                setTimeout(() => loadContext(), 500);
              } else throw error;
            }
          } catch (e) {
            console.error("AI Budget Action Error:", e);
            response = `❌ I tried to add the budget entry but encountered an error.`;
          }
        }
        else if (taskMatch && user) {
          try {
            const [_, title, priority, dueDate] = taskMatch;
            const { error } = await supabase.from('tasks').insert({
                user_id: user.id,
                title,
                priority: priority || 'Medium',
                due_date: dueDate || null,
                completed: false
            });
            if (!error) {
                response = `✅ Successfully added task: **${title}** (Priority: ${priority}, Due: ${dueDate})`;
                setTimeout(() => loadContext(), 500);
            } else throw error;
          } catch (e) {
            console.error("AI Task Action Error:", e);
            response = `❌ I tried to add the task but encountered an error.`;
          }
        }
        else if (reminderMatch && user) {
          try {
            const [_, title, reminderTime] = reminderMatch;
            
            // Parse as local time, then convert to strict ISO for Supabase (which expects UTC)
            const dateObj = new Date(reminderTime);
            const dbTime = !isNaN(dateObj.getTime()) ? dateObj.toISOString() : reminderTime;
            
            const { error } = await supabase.from('reminders').insert({
                user_id: user.id,
                title,
                reminder_time: dbTime,
                status: 'pending'
            });
            if (!error) {
                const timeStr = !isNaN(dateObj.getTime()) ? dateObj.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : reminderTime;
                response = `⏰ Successfully set reminder for **${timeStr}**: **${title}**`;
                setTimeout(() => loadContext(), 500);
            } else throw error;
          } catch (e) {
            console.error("AI Reminder Action Error:", e);
            response = `❌ I tried to set the reminder but encountered an error.`;
          }
        }
        // -- END PARSING --

        setMessages((prev) => [
          ...prev.filter((m) => m.id !== 'typing'),
          {
            id: Date.now().toString() + '-ai',
            role: 'assistant',
            content: response,
          },
        ]);
      } catch (err) {
        console.error('AI error:', err);
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== 'typing'),
          {
            id: Date.now().toString() + '-err',
            role: 'assistant',
            content:
              '⚠️ Sorry, I couldn\'t get a response. Please check that your Hugging Face API token is set correctly in the `.env` file (`VITE_HF_API_TOKEN`).',
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, systemPrompt]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleRefreshContext = async () => {
    await loadContext();
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString() + '-refresh',
        role: 'assistant',
        content: '🔄 I\'ve refreshed your data context! I now have your latest tasks, budget, reminders, and files.',
      },
    ]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const tempId = Date.now().toString();
    
    setMessages((prev) => [...prev, {
       id: tempId,
       role: 'user',
       content: `*Uploading ${file.name}...*`
    }]);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const timestamp = Date.now();
      const filePath = `${user.id}/${timestamp}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('files').insert({
          file_name: file.name,
          file_path: filePath,
          category: 'Personal',
          tags: 'AI Upload',
          user_id: user.id,
      });

      if (insertError) throw insertError;

      setMessages((prev) => [
          ...prev.filter(m => m.id !== tempId),
          { id: tempId + '-done', role: 'user', content: `📎 Attached file: **${file.name}**` },
          { id: Date.now().toString() + '-ai', role: 'assistant', content: `✅ Successfully uploaded **${file.name}** to your Files dashboard!` }
      ]);
      
      setTimeout(() => loadContext(), 500);

    } catch (err) {
      console.error("Upload error", err);
      setMessages((prev) => [
          ...prev.filter(m => m.id !== tempId),
          { id: Date.now().toString() + '-err', role: 'assistant', content: `❌ Failed to upload **${file.name}**.` }
      ]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* ── Floating Button ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpen}
            className="fixed bottom-6 right-6 z-50 text-blue-500 hover:text-blue-400 drop-shadow-2xl cursor-pointer transition-colors"
            aria-label="Open AI Chat"
          >
            <Bot size={52} strokeWidth={1.5} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[90vw] sm:w-[400px] h-[600px] max-h-[85vh] flex flex-col rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50"
            style={{ background: 'rgba(8, 8, 12, 0.97)', backdropFilter: 'blur(20px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <Bot size={24} className="text-blue-500" strokeWidth={1.5} />
                <div>
                  <h3 className="text-sm font-bold text-white">ProTask AI</h3>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1">
                    {contextLoaded ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        Data loaded
                        {contextError && ' (limited)'}
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse" />
                        Loading your data…
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={createNewChat}
                  title="New Chat"
                  className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  <Plus size={18} strokeWidth={2} />
                </button>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  title="History"
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showHistory ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}
                >
                  <Menu size={16} />
                </button>
                <button
                  onClick={handleRefreshContext}
                  title="Refresh data context"
                  className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                >
                  <RefreshCw size={14} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {showHistory ? (
               <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-white/10">
                 <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Your Conversations</h4>
                 {sessions.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center mt-10">No past conversations yet.</p>
                 ) : (
                    <div className="space-y-2">
                      {sessions.map(session => (
                         <button 
                            key={session.id} 
                            onClick={() => loadSession(session.id)}
                            className={`w-full text-left p-3 rounded-xl border flex items-start gap-3 transition-colors ${session.id === currentSessionId ? 'bg-white/10 border-white/20' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                         >
                            <MessageSquare size={16} className={`mt-0.5 flex-shrink-0 ${session.id === currentSessionId ? 'text-blue-400' : 'text-gray-500'}`} />
                            <div className="overflow-hidden">
                               <p className={`text-sm truncate font-medium ${session.id === currentSessionId ? 'text-white' : 'text-gray-300'}`}>{session.title}</p>
                               <p className="text-[10px] text-gray-500 mt-1">{new Date(session.updatedAt).toLocaleString()}</p>
                            </div>
                         </button>
                      ))}
                    </div>
                 )}
               </div>
            ) : (
               <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <Bot size={56} className="text-blue-500 drop-shadow-md" strokeWidth={1.5} />
                  <div>
                    <p className="text-white font-semibold text-sm">ProTask AI</p>
                    <p className="text-gray-500 text-xs mt-1">Your productivity co-pilot</p>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <Bot size={22} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white/5 border border-white/8 text-gray-100 rounded-bl-md'
                    }`}
                  >
                    {msg.typing ? (
                      <TypingDots />
                    ) : (
                      <div className="space-y-1">{renderMarkdown(msg.content)}</div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 border-t border-white/5">
              <p className="text-[10px] text-gray-600 uppercase tracking-widest font-mono mb-2">Quick actions</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => sendMessage(action.prompt)}
                      disabled={isLoading || !contextLoaded}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${action.bg}`}
                    >
                      <Icon size={11} className={action.color} />
                      <span className="text-gray-300">{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-white/10 bg-white/[0.02]">
              <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 focus-within:border-blue-500/50 transition-colors">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isUploading}
                  title="Upload to Files"
                  className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <Paperclip size={16} />
                </button>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isUploading ? "Uploading..." : "Ask me anything…"}
                  rows={1}
                  disabled={isLoading || isUploading}
                  className="flex-1 bg-transparent text-white text-sm resize-none outline-none placeholder-gray-600 disabled:opacity-50 max-h-28 overflow-y-auto leading-relaxed ml-1"
                  style={{ minHeight: '20px' }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading || isUploading}
                  className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
                >
                  {isLoading ? (
                    <RefreshCw size={13} className="text-white animate-spin" />
                  ) : (
                    <Send size={13} className="text-white" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-gray-700 mt-1.5 text-center">
                Press Enter to send · Shift+Enter for newline
              </p>
            </div>
            </>
          )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Close button when panel is open ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(false)}
            className="fixed bottom-6 right-6 z-[51] w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white cursor-pointer sm:hidden"
          >
            <MessageCircle size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
