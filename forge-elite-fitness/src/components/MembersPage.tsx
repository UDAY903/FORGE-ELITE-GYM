import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Plus, Search, Filter, Edit2, Trash2, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  paymentStatus: string;
  expiryDate: string;
  paidAmount?: number;
  totalAmount?: number;
}

export const MembersPage = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [newMember, setNewMember] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    plan: 'Standard Protocol', 
    paymentStatus: 'Paid', 
    expiryDate: '',
    paidAmount: 0,
    totalAmount: 9999
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "members"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
      setMembers(docs);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'members');
    });
    return unsubscribe;
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = isEditModalOpen && editingMember ? `members/${editingMember.id}` : 'members';
    try {
      if (isEditModalOpen && editingMember) {
        const memberRef = doc(db, "members", editingMember.id);
        await updateDoc(memberRef, {
          name: newMember.name,
          email: newMember.email,
          phone: newMember.phone,
          plan: newMember.plan,
          paymentStatus: newMember.paymentStatus,
          paidAmount: newMember.paidAmount,
          totalAmount: newMember.totalAmount,
        });
        setIsEditModalOpen(false);
        setEditingMember(null);
      } else {
        await addDoc(collection(db, "members"), {
            ...newMember,
            joinDate: new Date().toISOString(),
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days default
        });
        setIsAddModalOpen(false);
      }
      setNewMember({ 
        name: '', 
        email: '', 
        phone: '', 
        plan: 'Standard Protocol', 
        paymentStatus: 'Paid', 
        expiryDate: '',
        paidAmount: 0,
        totalAmount: 9999
      });
    } catch (err) {
      handleFirestoreError(err, isEditModalOpen ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setNewMember({
      name: member.name,
      email: member.email,
      phone: member.phone,
      plan: member.plan,
      paymentStatus: member.paymentStatus,
      expiryDate: member.expiryDate,
      paidAmount: member.paidAmount || 0,
      totalAmount: member.totalAmount || 0
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
        const memberRef = doc(db, "members", id);
        await deleteDoc(memberRef);
        setDeletingId(null);
    } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `members/${id}`);
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight italic">Member <span className="text-brand">Registry</span></h2>
          <p className="text-neutral-500 mt-1">Direct control over member metadata and status.</p>
        </div>
        <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-brand text-black px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all w-fit"
        >
          <Plus size={18} />
          Add Member
        </button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
        <div className="p-4 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-brand transition-colors" size={16} />
                <input 
                    type="text" 
                    placeholder="Filter by name or identity..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 pl-12 pr-4 text-sm focus:border-brand/50 focus:outline-none transition-all"
                />
            </div>
            <button className="flex items-center gap-2 bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 text-sm font-medium hover:border-white/20 transition-all">
                <Filter size={16} />
                Filters
            </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/50 text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 border-b border-white/5">
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Financials</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Expiry</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-brand/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-brand/20 border border-brand/20 flex items-center justify-center font-bold text-xs text-brand">
                            {member.name.charAt(0)}
                         </div>
                         <div>
                            <p className="font-bold group-hover:text-brand transition-colors">{member.name}</p>
                            <p className="text-[10px] text-neutral-500 uppercase tracking-widest">{member.email}</p>
                         </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm ${
                        member.plan === 'Titan Continuum' ? 'bg-brand/10 text-brand' : 
                        member.plan === 'Architect Tier' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-neutral-800 text-neutral-400'
                    }`}>
                        {member.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                       <p className="font-mono text-xs text-brand font-bold">₹{(member.paidAmount || 0).toLocaleString()}</p>
                       {member.totalAmount && member.totalAmount > (member.paidAmount || 0) && (
                         <p className="text-[9px] text-red-500 font-black uppercase tracking-widest">
                           Due: ₹{(member.totalAmount - (member.paidAmount || 0)).toLocaleString()}
                         </p>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          member.paymentStatus === 'Paid' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 
                          member.paymentStatus === 'Half Paid' ? 'bg-brand shadow-[0_0_8px_rgba(255,107,0,0.5)]' :
                          member.paymentStatus === 'Overdue' ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                          'bg-neutral-500 shadow-[0_0_8px_rgba(115,115,115,0.5)]'}`} 
                        />
                        <span className="font-bold text-xs uppercase tracking-widest">{member.paymentStatus}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-neutral-400 font-mono text-xs">{member.phone}</td>
                  <td className="px-6 py-4 text-neutral-500 text-xs">
                    {new Date(member.expiryDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <button 
                            title="Edit Athlete"
                            onClick={() => handleEdit(member)}
                            className="p-2.5 bg-white/5 hover:bg-brand/20 text-brand rounded-xl transition-all active:scale-95 border border-white/5 hover:border-brand/20"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button 
                                    title="Purge Athlete"
                                    onClick={() => setDeletingId(member.id)}
                                    className="p-2.5 bg-white/5 hover:bg-red-500/20 text-red-500 rounded-xl transition-all active:scale-95 border border-white/5 hover:border-red-500/20"
                                >
                                    <Trash2 size={18} />
                                </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMembers.length === 0 && (
            <div className="p-20 text-center space-y-4">
                <Users size={48} className="mx-auto text-neutral-800" />
                <p className="text-neutral-500 font-mono">No data units found matching search criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(isAddModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    setEditingMember(null);
                    setNewMember({ name: '', email: '', phone: '', plan: 'Standard Protocol', paymentStatus: 'Paid', expiryDate: '' });
                }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg glass rounded-3xl p-8 border border-brand/20 shadow-2xl overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-32 h-32 bg-brand opacity-5 blur-[100px] pointer-events-none" />
                
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-bold italic uppercase tracking-tighter">
                            {isEditModalOpen ? 'Edit' : 'Add'} <span className="text-brand">Member</span>
                        </h3>
                        <button 
                            onClick={() => {
                                setIsAddModalOpen(false);
                                setIsEditModalOpen(false);
                                setEditingMember(null);
                                setNewMember({ 
                                  name: '', 
                                  email: '', 
                                  phone: '', 
                                  plan: 'Standard Protocol', 
                                  paymentStatus: 'Paid', 
                                  expiryDate: '',
                                  paidAmount: 0,
                                  totalAmount: 9999
                                });
                            }} 
                            className="p-2 text-neutral-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                <form onSubmit={handleAddMember} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Full Name</label>
                            <input 
                                required
                                value={newMember.name}
                                onChange={e => setNewMember({...newMember, name: e.target.value})}
                                type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand/50 focus:outline-none transition-all" 
                                placeholder="E.g. Marcus Aurelius"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Email Address</label>
                            <input 
                                required
                                value={newMember.email}
                                onChange={e => setNewMember({...newMember, email: e.target.value})}
                                type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand/50 focus:outline-none transition-all" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Phone</label>
                            <input 
                                required
                                value={newMember.phone}
                                onChange={e => setNewMember({...newMember, phone: e.target.value})}
                                type="tel" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand/50 focus:outline-none transition-all" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Membership Tier</label>
                            <select 
                                value={newMember.plan}
                                onChange={e => {
                                    const selectedPlan = e.target.value;
                                    // Auto update total amount based on constants.ts if possible
                                    // Standard: 9999, Strategic: 24999, Architect: 44999, Titan: 79999
                                    let price = 9999;
                                    if (selectedPlan === 'Strategic cycle') price = 24999;
                                    if (selectedPlan === 'Architect Tier') price = 44999;
                                    if (selectedPlan === 'Titan Continuum') price = 79999;

                                    setNewMember({
                                        ...newMember, 
                                        plan: selectedPlan,
                                        totalAmount: price,
                                        paidAmount: newMember.paymentStatus === 'Paid' ? price : newMember.paidAmount
                                    });
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand/50 focus:outline-none transition-all appearance-none"
                            >
                                <option className="bg-neutral-900" value="Standard Protocol">Standard Protocol</option>
                                <option className="bg-neutral-900" value="Strategic cycle">Strategic cycle</option>
                                <option className="bg-neutral-900" value="Architect Tier">Architect Tier</option>
                                <option className="bg-neutral-900" value="Titan Continuum">Titan Continuum</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Payment Status</label>
                            <select 
                                value={newMember.paymentStatus}
                                onChange={e => {
                                    const status = e.target.value;
                                    setNewMember({
                                        ...newMember, 
                                        paymentStatus: status,
                                        paidAmount: status === 'Paid' ? newMember.totalAmount : newMember.paidAmount
                                    });
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand/50 focus:outline-none transition-all appearance-none"
                            >
                                <option className="bg-neutral-900" value="Paid">Paid</option>
                                <option className="bg-neutral-900" value="Half Paid">Half Paid</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Total Amount (₹)</label>
                            <input 
                                required
                                value={newMember.totalAmount}
                                onChange={e => setNewMember({...newMember, totalAmount: Number(e.target.value)})}
                                type="number" 
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand/50 focus:outline-none transition-all" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Paid Amount (₹)</label>
                            <input 
                                required
                                value={newMember.paidAmount}
                                onChange={e => setNewMember({...newMember, paidAmount: Number(e.target.value)})}
                                type="number" 
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand/50 focus:outline-none transition-all" 
                            />
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-brand text-black py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-white transition-all transform active:scale-95">
                        {isEditModalOpen ? 'Save' : 'Add Member'}
                    </button>
                </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setDeletingId(null)}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md glass rounded-3xl p-8 border border-red-500/20 shadow-2xl overflow-hidden text-center"
                >
                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
                        <Trash2 size={32} />
                    </div>
                    
                    <h3 className="text-2xl font-bold italic uppercase tracking-tighter mb-2">
                        Confirm <span className="text-red-500">Redaction</span>
                    </h3>
                    <p className="text-neutral-500 text-sm mb-8">
                        Are you absolutely certain you want to purge this record? This action will permanently remove the athlete from the registry.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => setDeletingId(null)}
                            className="bg-white/5 hover:bg-white/10 text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest transition-all"
                        >
                            Abort
                        </button>
                        <button 
                            onClick={() => handleDelete(deletingId)}
                            className="bg-red-500 text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                        >
                            Confirm
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};
