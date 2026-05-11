import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Check, X, Clock, User, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Appointment {
  id: string;
  memberName: string;
  trainerName: string;
  date: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  type: 'training' | 'sauna';
}

export const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "appointments"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setAppointments(docs);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "appointments");
    });
    return unsubscribe;
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
        await updateDoc(doc(db, "appointments", id), { status });
    } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `appointments/${id}`);
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
        await deleteDoc(doc(db, "appointments", id));
        setConfirmDeleteId(null);
    } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `appointments/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight italic">Training <span className="text-brand">Logistics</span></h2>
        <p className="text-neutral-500 mt-1">Approve or redirect athlete-architect synchronization events.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {appointments.map((appt, i) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            key={appt.id}
            className="glass-card rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${
                    appt.status === 'Accepted' ? 'border-green-500/50 bg-green-500/10 text-green-500' :
                    appt.status === 'Rejected' ? 'border-red-500/50 bg-red-500/10 text-red-500' :
                    'border-brand/50 bg-brand/10 text-brand'
                }`}>
                    <CalendarIcon size={24} />
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{appt.memberName}</span>
                        <span className="text-neutral-600 text-xs font-mono uppercase tracking-widest">/</span>
                        <span className="text-brand text-xs font-black uppercase tracking-widest">
                            {appt.type === 'sauna' ? 'Sauna Session' : (appt.trainerName === 'Master Architect' ? 'Workout Session' : appt.trainerName)}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(appt.date).toLocaleString()}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                            appt.status === 'Accepted' ? 'bg-green-500/20 text-green-500' :
                            appt.status === 'Rejected' ? 'bg-red-500/20 text-red-500' :
                            'bg-brand/20 text-brand'
                        }`}>
                            {appt.status}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
              {appt.status === 'Pending' && (
                <>
                  <button 
                    onClick={() => updateStatus(appt.id, 'Accepted')}
                    className="px-6 py-2.5 bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500 hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                  >
                    <Check size={14} /> Accept
                  </button>
                  <button 
                    onClick={() => updateStatus(appt.id, 'Rejected')}
                    className="px-6 py-2.5 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                  >
                    <X size={14} /> Reject
                  </button>
                </>
              )}
              {appt.status !== 'Pending' && (
                <div className="flex items-center gap-1">
                  <AnimatePresence mode="wait">
                    {confirmDeleteId === appt.id ? (
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center gap-2"
                      >
                        <button
                          onClick={() => deleteAppointment(appt.id)}
                          className="text-[10px] font-black uppercase tracking-widest bg-red-500 text-white px-3 py-1.5 rounded-full hover:bg-red-600 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-[10px] font-black uppercase tracking-widest bg-white/10 text-neutral-400 px-3 py-1.5 rounded-full hover:bg-white/20 transition-colors"
                        >
                          Cancel
                        </button>
                      </motion.div>
                    ) : (
                      <button 
                        onClick={() => setConfirmDeleteId(appt.id)}
                        className="p-3 bg-white/5 hover:bg-red-500/10 text-neutral-600 hover:text-red-500 rounded-xl transition-all"
                        title="Delete Session Log"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {appointments.length === 0 && (
            <div className="py-32 text-center space-y-4 bg-white/5 rounded-3xl border border-dashed border-white/5">
                <Clock size={48} className="mx-auto text-neutral-700" />
                <p className="text-neutral-500 font-mono text-sm">No synchronization requests currently in queue.</p>
            </div>
        )}
      </div>
    </div>
  );
};
