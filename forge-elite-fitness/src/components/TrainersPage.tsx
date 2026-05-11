import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Plus, Search, Trash2, Edit2, Phone, Mail, Instagram } from 'lucide-react';
import { motion } from 'motion/react';

interface Trainer {
  id: string;
  name: string;
  specialization: string;
  schedule: string;
  contact: string;
  profileImage?: string;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  alert(`Operation Failed: ${errInfo.error}. Path: ${path}`);
  throw new Error(JSON.stringify(errInfo));
};

export const TrainersPage = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [newTrainer, setNewTrainer] = useState({ name: '', specialization: '', schedule: '', contact: '' });

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "trainers"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trainer));
      setTrainers(docs);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'trainers');
    });
    return unsubscribe;
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = isEditModalOpen && editingTrainer ? `trainers/${editingTrainer.id}` : 'trainers';
    try {
      if (isEditModalOpen && editingTrainer) {
        const docRef = doc(db, "trainers", editingTrainer.id);
        await updateDoc(docRef, newTrainer);
        setIsEditModalOpen(false);
        setEditingTrainer(null);
      } else {
        await addDoc(collection(db, "trainers"), newTrainer);
        setIsAddModalOpen(false);
      }
      setNewTrainer({ name: '', specialization: '', schedule: '', contact: '' });
    } catch (err) {
      handleFirestoreError(err, isEditModalOpen ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const handleEdit = (trainer: Trainer) => {
    setEditingTrainer(trainer);
    setNewTrainer({
        name: trainer.name,
        specialization: trainer.specialization,
        schedule: trainer.schedule,
        contact: trainer.contact
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
        const docRef = doc(db, "trainers", id);
        await deleteDoc(docRef);
        setDeletingId(null);
    } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `trainers/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight italic">Elite <span className="text-brand">Architects</span></h2>
          <p className="text-neutral-500 mt-1">Manage your team of professional trainers and coaches.</p>
        </div>
        <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-brand text-black px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all"
        >
          Add Trainer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trainers.map((trainer, i) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            key={trainer.id}
            className="glass-card rounded-2xl p-6 group relative overflow-hidden"
          >
            <div className="flex items-start justify-between mb-6">
                <div className="w-20 h-20 bg-brand/20 rounded-2xl border border-brand/20 flex items-center justify-center font-bold text-3xl text-brand group-hover:scale-110 transition-transform">
                    {trainer.name.charAt(0)}
                </div>
                <div className="flex gap-2">
                    <button 
                        title="Edit Architect"
                        onClick={() => handleEdit(trainer)}
                        className="p-2.5 bg-white/5 rounded-xl text-neutral-400 hover:text-brand hover:bg-brand/10 transition-all active:scale-95 border border-transparent hover:border-brand/20"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button 
                        title="Decommission Architect"
                        onClick={() => setDeletingId(trainer.id)}
                        className="p-2.5 bg-white/5 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-95 border border-transparent hover:border-red-500/20"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
            
            <h3 className="text-xl font-bold group-hover:text-brand transition-colors">{trainer.name}</h3>
            <p className="text-[10px] text-brand font-black uppercase tracking-[0.2em] mb-4">{trainer.specialization}</p>
            
            <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <Mail size={12} /> {trainer.contact}
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <Instagram size={12} /> coaching_forge
                </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <div>
                    <p className="text-[10px] text-neutral-600 uppercase font-black tracking-widest">Schedule</p>
                    <p className="text-xs font-bold">{trainer.schedule}</p>
                </div>
                <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            </div>
            
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-brand/10 transition-all" />
          </motion.div>
        ))}

        {trainers.length === 0 && (
            <div className="col-span-full py-20 text-center glass-card rounded-2xl border-dashed border-2">
                <p className="text-neutral-500 font-mono text-sm">No architectural assets assigned to this sector.</p>
            </div>
        )}
      </div>

      {/* Add/Edit Trainer Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md glass rounded-3xl p-8 border border-brand/20 shadow-2xl"
          >
            <h3 className="text-2xl font-bold italic uppercase tracking-tighter mb-8">
                {isEditModalOpen ? 'Edit' : 'Onboard'} <span className="text-brand">Architect</span>
            </h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <input 
                required placeholder="NAME" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand"
                value={newTrainer.name} onChange={e => setNewTrainer({...newTrainer, name: e.target.value})}
              />
              <input 
                required placeholder="SPECIALIZATION (e.g. HIIT, POWERLIFTING)" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand"
                value={newTrainer.specialization} onChange={e => setNewTrainer({...newTrainer, specialization: e.target.value})}
              />
              <input 
                required placeholder="SCHEDULE (e.g. MON-FRI 8-5)" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand"
                value={newTrainer.schedule} onChange={e => setNewTrainer({...newTrainer, schedule: e.target.value})}
              />
              <input 
                required placeholder="CONTACT EMAIL/PHONE" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand"
                value={newTrainer.contact} onChange={e => setNewTrainer({...newTrainer, contact: e.target.value})}
              />
              <div className="flex gap-4 pt-4">
                <button 
                    type="button" 
                    onClick={() => {
                        setIsAddModalOpen(false);
                        setIsEditModalOpen(false);
                        setEditingTrainer(null);
                        setNewTrainer({ name: '', specialization: '', schedule: '', contact: '' });
                    }} 
                    className="flex-1 py-4 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-neutral-500"
                >
                    Cancel
                </button>
                <button type="submit" className="flex-1 py-4 bg-brand text-black rounded-xl text-xs font-bold uppercase tracking-widest">
                    {isEditModalOpen ? 'Save' : 'Add Architect'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Decommission Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md glass rounded-3xl p-8 border border-red-500/20 shadow-2xl text-center"
          >
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
                <Trash2 size={32} />
            </div>
            
            <h3 className="text-2xl font-bold italic uppercase tracking-tighter mb-2">
                Confirm <span className="text-red-500">Decommission</span>
            </h3>
            <p className="text-neutral-500 text-sm mb-8">
                Are you certain you want to remove this architect from the active team?
            </p>

            <div className="flex gap-4">
                <button 
                    onClick={() => setDeletingId(null)}
                    className="flex-1 py-4 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-neutral-500 hover:bg-white/5 transition-all"
                >
                    Abort
                </button>
                <button 
                    onClick={() => handleDelete(deletingId)}
                    className="flex-1 py-4 bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                >
                    Confirm
                </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
