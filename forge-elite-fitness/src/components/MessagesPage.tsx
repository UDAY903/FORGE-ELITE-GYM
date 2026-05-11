import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Mail, Trash2, CheckCircle, Clock, Reply, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  status: 'New' | 'Read' | 'Replied';
}

export const MessagesPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "messages"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      // Sort messages by date descending
      docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMessages(docs);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "messages");
    });
    return unsubscribe;
  }, []);

  const markAsRead = async (id: string) => {
    const msg = messages.find(m => m.id === id);
    if (msg?.status !== 'New') return;
    try {
        await updateDoc(doc(db, "messages", id), { status: 'Read' });
    } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `messages/${id}`);
    }
  };

  const deleteMessage = async (id: string) => {
    try {
        await deleteDoc(doc(db, "messages", id));
        setConfirmDeleteId(null);
    } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `messages/${id}`);
    }
  };

  const handleSendReply = async () => {
    if (!replyingTo || !replyText.trim()) return;
    setIsSubmitting(true);
    try {
        // Mark as Replied in Firestore
        await updateDoc(doc(db, "messages", replyingTo.id), { status: 'Replied' });
        
        // Trigger Server-side Email via Resend
        const response = await fetch('/api/send-reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toEmail: replyingTo.email,
            toName: replyingTo.name,
            replyMessage: replyText,
            originalMessage: replyingTo.message,
            subject: `Re: ${replyingTo.subject || 'Elite Program Inquiry'}`
          })
        });

        if (!response.ok) {
          throw new Error('Failed to send email via server');
        }
        
        alert(`Strategic response dispatched to ${replyingTo.email}`);
        setReplyingTo(null);
        setReplyText('');
    } catch (err) {
        console.error("Reply error:", err);
        alert("Communication failure. Reverting to backup protocols.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight italic">Mission <span className="text-brand">Briefings</span></h2>
        <p className="text-neutral-500 mt-1">Inbound intelligence and prospective athlete inquiries.</p>
      </div>

      <div className="space-y-4">
        {messages.map((msg, i) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            key={msg.id}
            onClick={() => markAsRead(msg.id)}
            className={`glass-card rounded-2xl p-6 border-l-4 cursor-pointer transition-all ${
                msg.status === 'New' ? 'border-l-brand bg-brand/5 shadow-[0_0_20px_rgba(255,107,0,0.05)]' : 
                msg.status === 'Replied' ? 'border-l-green-500/50' : 'border-l-neutral-700'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-brand">
                        <Mail size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold">{msg.name}</h3>
                        <p className="text-xs text-neutral-500 uppercase tracking-widest font-mono">{msg.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] text-neutral-600 font-mono italic">{new Date(msg.date).toLocaleString()}</span>
                    <div className="flex items-center gap-1">
                        <AnimatePresence mode="wait">
                            {confirmDeleteId === msg.id ? (
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="flex items-center gap-2"
                                >
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); }}
                                        className="text-[10px] font-black uppercase tracking-widest bg-red-500 text-white px-3 py-1.5 rounded-full hover:bg-red-600 transition-colors"
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                                        className="text-[10px] font-black uppercase tracking-widest bg-white/10 text-neutral-400 px-3 py-1.5 rounded-full hover:bg-white/20 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </motion.div>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setReplyingTo(msg);
                                            setReplyText(`Hi ${msg.name},\n\n`);
                                        }}
                                        className="p-2 text-brand hover:text-white transition-colors bg-brand/5 hover:bg-brand rounded-full"
                                        title="Reply to Transmission"
                                    >
                                        <Reply size={16} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(msg.id); }}
                                        className="p-2 text-neutral-600 hover:text-red-500 transition-colors bg-white/5 rounded-full"
                                        title="Delete Transmission"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
            
            <div className="pl-12">
                <p className="text-sm font-bold text-neutral-300 mb-2 uppercase tracking-tighter italic">RE: {msg.subject || 'Elite Program Inquiry'}</p>
                <p className="text-sm text-neutral-400 font-light leading-relaxed">{msg.message}</p>
            </div>
            
            <div className="mt-4 pl-12 flex gap-2">
                {msg.status === 'New' && <span className="text-[8px] bg-brand text-black px-2 py-0.5 rounded-full font-black uppercase tracking-widest">New Transmission</span>}
                {msg.status === 'Replied' && <span className="text-[8px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle size={8} /> Replied
                </span>}
                {msg.status !== 'Replied' && (
                    <span className="text-[8px] bg-white/5 text-neutral-500 px-2 py-0.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
                        <Clock size={8} /> Awaiting Reply
                    </span>
                )}
            </div>
          </motion.div>
        ))}

        {messages.length === 0 && (
            <div className="py-32 text-center space-y-4 glass-card rounded-3xl border-dashed">
                <Mail size={48} className="mx-auto text-neutral-800" />
                <p className="text-neutral-500 font-mono text-sm">Static silence. No transmissions detected.</p>
            </div>
        )}
      </div>

      <AnimatePresence>
        {replyingTo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReplyingTo(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg glass rounded-3xl p-8 border border-brand/20 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold italic uppercase tracking-tighter">
                  Reply to <span className="text-brand">{replyingTo.name}</span>
                </h3>
                <button 
                  onClick={() => setReplyingTo(null)}
                  className="p-2 text-neutral-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5 max-h-32 overflow-y-auto mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Original Transmission</p>
                    <p className="text-xs text-neutral-400">{replyingTo.message}</p>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 block">Response Content</label>
                  <textarea
                    autoFocus
                    required
                    rows={6}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand focus:outline-none transition-all resize-none"
                    placeholder="Type your strategic response..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="flex-1 py-4 text-neutral-500 text-xs font-bold uppercase tracking-widest"
                  >
                    Abort
                  </button>
                  <button 
                    onClick={handleSendReply}
                    disabled={isSubmitting || !replyText.trim()}
                    className="flex-1 py-4 bg-brand text-black rounded-xl text-xs font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(255,107,0,0.2)] flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Syncing...' : <><Send size={14} /> Send via Email</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

