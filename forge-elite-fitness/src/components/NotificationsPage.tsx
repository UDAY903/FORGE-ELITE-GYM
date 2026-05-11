import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Bell, Trash2, Send, Clock, AlertTriangle, Info, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Notification {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'Info' | 'Alert' | 'Promo';
  active: boolean;
}

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNotif, setNewNotif] = useState({ title: '', content: '', type: 'Info' as const });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "notifications"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      // Sort by date descending
      docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setNotifications(docs);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "notifications");
    });
    return unsubscribe;
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "notifications"), {
        ...newNotif,
        date: new Date().toISOString(),
        active: true
      });
      setIsModalOpen(false);
      setNewNotif({ title: '', content: '', type: 'Info' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "notifications");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (notif: Notification) => {
    try {
      await updateDoc(doc(db, "notifications", notif.id), { active: !notif.active });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `notifications/${notif.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "notifications", id));
      setConfirmDeleteId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `notifications/${id}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Alert': return <AlertTriangle size={18} className="text-red-500" />;
      case 'Promo': return <Megaphone size={18} className="text-brand" />;
      default: return <Info size={18} className="text-blue-400" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-2">Protocol Broadcast</h1>
          <p className="text-neutral-500 text-sm tracking-widest uppercase">Manage Neural-Link Notifications</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand text-black px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(255,107,0,0.3)] flex items-center gap-2"
        >
          <Send size={16} /> Broadcast Alert
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={notif.id}
              className={`glass-card rounded-2xl p-6 border-l-4 transition-all ${
                notif.active ? 'border-l-brand' : 'border-l-neutral-800 opacity-60'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    notif.type === 'Alert' ? 'bg-red-500/10' : 
                    notif.type === 'Promo' ? 'bg-brand/10' : 'bg-blue-500/10'
                  }`}>
                    {getIcon(notif.type)}
                  </div>
                  <div>
                    <h3 className="font-bold flex items-center gap-2">
                      {notif.title}
                      {!notif.active && <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-neutral-800 text-neutral-500 rounded-full">Inactive</span>}
                    </h3>
                    <p className="text-sm text-neutral-400 mt-1 max-w-2xl">{notif.content}</p>
                    <div className="flex gap-4 mt-4 text-[10px] uppercase font-black tracking-widest text-neutral-600">
                      <span className="flex items-center gap-1"><Clock size={10} /> {new Date(notif.date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Bell size={10} /> {notif.type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleActive(notif)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                      notif.active ? 'bg-white/5 text-neutral-400 hover:bg-white/10' : 'bg-brand text-black'
                    }`}
                  >
                    {notif.active ? 'Disable' : 'Enable'}
                  </button>
                  
                  <div className="relative">
                    <AnimatePresence mode="wait">
                      {confirmDeleteId === notif.id ? (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex gap-1"
                        >
                          <button 
                            onClick={() => handleDelete(notif.id)}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Confirm
                          </button>
                          <button 
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-2 bg-white/10 text-neutral-400 rounded-lg"
                          >
                            Cancel
                          </button>
                        </motion.div>
                      ) : (
                        <button 
                          onClick={() => setConfirmDeleteId(notif.id)}
                          className="p-2 text-neutral-600 hover:text-red-500 bg-white/5 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {notifications.length === 0 && (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <Bell size={48} className="mx-auto text-neutral-700 mb-4" />
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm">No Active Broadcasts</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-neutral-900 border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl"
            >
              <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-6">Initialize Broadcast</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 block">Alert Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Info', 'Alert', 'Promo'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewNotif({...newNotif, type: t as any})}
                        className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                          newNotif.type === t ? 'bg-brand border-brand text-black' : 'border-white/10 bg-white/5 text-neutral-400 hover:border-white/30'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 block">Heading</label>
                  <input
                    required
                    type="text"
                    value={newNotif.title}
                    onChange={e => setNewNotif({...newNotif, title: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 block">Transmission Content</label>
                  <textarea
                    required
                    rows={4}
                    value={newNotif.content}
                    onChange={e => setNewNotif({...newNotif, content: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/50 resize-none"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 text-neutral-500 text-xs font-bold uppercase tracking-widest"
                  >
                    Abort
                  </button>
                  <button 
                    disabled={isSubmitting}
                    className="flex-1 py-4 bg-brand text-black rounded-xl text-xs font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(255,107,0,0.2)]"
                  >
                    {isSubmitting ? 'Syncing...' : 'Fire Broadcast'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
