import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DollarSign, CheckCircle, Clock, AlertCircle, ArrowUpRight, Edit } from 'lucide-react';
import { motion } from 'motion/react';
import { PLANS } from '../constants';

interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  totalAmount?: number;
  paidAmount?: number;
  remainingAmount?: number;
  date: string;
  nextDueDate?: string;
  status: 'Paid' | 'Half Paid' | 'Completed' | 'Failed';
  paymentType?: 'Full Payment' | 'Half Payment';
  plan: string;
}

export const PaymentsPage = () => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [activeTab, setActiveTab] = useState<'history' | 'pending'>('history');
    const [isAddingPayment, setIsAddingPayment] = useState(false);
    const [updatingPayment, setUpdatingPayment] = useState<Payment | null>(null);

    useEffect(() => {
        const q = query(collection(db, "payments"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
            setPayments(docs);
        });
        return unsubscribe;
    }, []);

    const filteredPayments = activeTab === 'history' 
        ? payments.filter(p => p.status === 'Completed' || p.status === 'Paid')
        : payments.filter(p => p.status === 'Half Paid');

    const totalRevenue = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const pendingBalance = payments.reduce((acc, p) => acc + (Number(p.remainingAmount) || 0), 0);
    const collectionEfficiency = totalRevenue > 0 
        ? Math.round((totalRevenue / (totalRevenue + pendingBalance)) * 100) 
        : 100;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight italic">Revenue <span className="text-brand">Engine</span></h2>
                    <p className="text-neutral-500 mt-1">Audit of financial synchronized events and asset flow.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <button 
                        onClick={() => setIsAddingPayment(true)}
                        className="px-6 py-2 bg-brand text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(255,107,0,0.3)] transition-all"
                    >
                        Record Payment
                    </button>
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                        <button 
                            onClick={() => setActiveTab('history')}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors ${activeTab === 'history' ? 'bg-brand text-black' : 'text-neutral-500 hover:text-white'}`}
                        >
                            History
                        </button>
                        <button 
                            onClick={() => setActiveTab('pending')}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors ${activeTab === 'pending' ? 'bg-brand text-black' : 'text-neutral-500 hover:text-white'}`}
                        >
                            Pending
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-brand' },
                    { label: 'Pending Balance', value: `₹${pendingBalance.toLocaleString()}`, icon: Clock, color: 'text-blue-500' },
                    { label: 'Collection Rate', value: `${collectionEfficiency}%`, icon: CheckCircle, color: 'text-green-500' },
                ].map((stat, i) => (
                    <div key={i} className="glass-card p-6 rounded-2xl flex items-center gap-4">
                        <div className={`p-3 bg-white/5 rounded-xl ${stat.color}`}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{stat.label}</p>
                            <p className="text-xl font-bold">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-black/50 text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 border-b border-white/5">
                            <th className="px-6 py-4">Transaction ID</th>
                            <th className="px-6 py-4">Member / Plan</th>
                            <th className="px-6 py-4">Financial Details</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">{activeTab === 'history' ? 'Date' : 'Due Date'}</th>
                            <th className="px-6 py-4">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredPayments.map((p) => (
                            <tr key={p.id} className="hover:bg-brand/5 transition-colors group text-sm">
                                <td className="px-6 py-4 font-mono text-xs text-neutral-400">#TRX-{p.id.slice(0, 8).toUpperCase()}</td>
                                <td className="px-6 py-4">
                                    <div className="font-bold">{p.memberName}</div>
                                    <div className="text-[10px] text-neutral-500 uppercase tracking-widest">{p.plan}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-brand">₹{(p.amount || 0).toLocaleString()}</div>
                                    {p.remainingAmount !== undefined && p.remainingAmount > 0 && (
                                        <div className="text-[10px] text-red-500 uppercase font-black">Reflects: ₹{p.remainingAmount.toLocaleString()} Pending</div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-sm text-[8px] font-black uppercase tracking-widest ${
                                        (p.status === 'Completed' || p.status === 'Paid') ? 'bg-green-500/20 text-green-500' :
                                        p.status === 'Failed' ? 'bg-red-500/20 text-red-500' :
                                        'bg-brand/20 text-brand'
                                    }`}>
                                        {p.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-neutral-500 font-mono">
                                    {activeTab === 'history' 
                                        ? new Date(p.date).toLocaleDateString() 
                                        : p.nextDueDate ? new Date(p.nextDueDate).toLocaleDateString() : 'N/A'
                                    }
                                </td>
                                <td className="px-6 py-4">
                                    {p.status === 'Half Paid' && (
                                        <button 
                                            onClick={() => setUpdatingPayment(p)}
                                            className="p-2 bg-brand/10 text-brand rounded-lg hover:bg-brand hover:text-black transition-all group-hover:scale-110"
                                            title="Collect Remaining"
                                        >
                                            <Edit size={14} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredPayments.length === 0 && (
                    <div className="py-20 text-center space-y-4">
                        <DollarSign size={48} className="mx-auto text-neutral-800" />
                        <p className="text-neutral-500 font-mono text-sm">No transaction units detected in this sector.</p>
                    </div>
                )}
            </div>

            {isAddingPayment && (
                <RecordPaymentModal 
                    onClose={() => setIsAddingPayment(false)} 
                />
            )}

            {updatingPayment && (
                <RecordPaymentModal 
                    onClose={() => setUpdatingPayment(null)} 
                    initialPayment={updatingPayment}
                />
            )}
        </div>
    );
};

const RecordPaymentModal = ({ onClose, initialPayment }: { onClose: () => void, initialPayment?: Payment }) => {
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState<{id: string, name: string, plan: string}[]>([]);
    const [formData, setFormData] = useState({
        memberId: initialPayment?.memberId || '',
        paymentType: initialPayment ? 'Half Payment' as const : 'Full Payment' as 'Full Payment' | 'Half Payment',
        totalAmount: initialPayment?.totalAmount || 0,
        paidAmount: 0,
        nextDueDate: initialPayment?.nextDueDate || '',
    });

    useEffect(() => {
        const q = query(collection(db, "members"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                name: doc.data().name,
                plan: doc.data().plan
            }));
            setMembers(docs);
        });
        return unsubscribe;
    }, []);

    // Auto-populate Total Amount based on plan or initial payment
    useEffect(() => {
        if (initialPayment) return; // Don't override if updating

        const member = members.find(m => m.id === formData.memberId);
        if (member) {
            const plan = PLANS.find(p => p.name === member.plan);
            if (plan) {
                setFormData(prev => ({ ...prev, totalAmount: plan.price }));
            }
        }
    }, [formData.memberId, members, initialPayment]);

    const selectedMember = members.find(m => m.id === formData.memberId);
    
    // For updates, the remaining balance is relative to the previous payment
    const currentRemaining = initialPayment ? (initialPayment.remainingAmount || 0) : formData.totalAmount;
    const newRemaining = currentRemaining - formData.paidAmount;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.memberId || !selectedMember) return;
        setLoading(true);

        try {
            // Determine status based on if balance is cleared
            const status = newRemaining <= 0 ? 'Paid' : 'Half Paid';
            
            const paymentData = {
                memberId: formData.memberId,
                memberName: selectedMember.name,
                plan: selectedMember.plan,
                amount: formData.paidAmount,
                totalAmount: initialPayment ? initialPayment.totalAmount : formData.totalAmount,
                paidAmount: (initialPayment ? (initialPayment.paidAmount || 0) : 0) + formData.paidAmount,
                remainingAmount: newRemaining,
                paymentType: formData.paymentType,
                status: status,
                nextDueDate: status === 'Paid' ? '' : formData.nextDueDate,
                date: new Date().toISOString()
            };

            await addDoc(collection(db, "payments"), paymentData);
            
            // If it was an update, we should probably mark the old one as "Completed" or similar
            // For now we just create a new record which serves as the "Latest State"
            
            // Update member payment status
            await updateDoc(doc(db, "members", formData.memberId), {
                paymentStatus: status
            });
            
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 sm:p-0">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-card w-full max-w-lg p-8 rounded-[40px] relative border border-white/10 overflow-hidden"
            >
                <div className="absolute inset-0 bg-brand/5 -z-10" />
                <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-6">
                    {initialPayment ? 'Update' : 'Record'} <span className="text-brand text-xl">Unit Payment</span>
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 block">Athlete Selection</label>
                        <select 
                            required
                            disabled={!!initialPayment}
                            value={formData.memberId}
                            onChange={e => setFormData({...formData, memberId: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:border-brand outline-none transition-all appearance-none disabled:opacity-50"
                        >
                            <option value="" className="bg-neutral-900">Select Member...</option>
                            {members.map(m => (
                                <option key={m.id} value={m.id} className="bg-neutral-900">{m.name}</option>
                            ))}
                        </select>
                    </div>

                    {!initialPayment && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 block">Strategic Logic</label>
                                <select 
                                    value={formData.paymentType}
                                    onChange={e => setFormData({...formData, paymentType: e.target.value as any})}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:border-brand outline-none transition-all appearance-none"
                                >
                                    <option value="Full Payment" className="bg-neutral-900">Full Payment</option>
                                    <option value="Half Payment" className="bg-neutral-900">Half Payment</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 block">Total Amount</label>
                                <input 
                                    type="number" 
                                    required
                                    value={formData.totalAmount || ''}
                                    onChange={e => setFormData({...formData, totalAmount: Number(e.target.value)})}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:border-brand outline-none transition-all"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 block">
                                {initialPayment ? 'Additional Paid' : 'Paid Amount'}
                            </label>
                            <input 
                                type="number" 
                                required
                                value={formData.paidAmount || ''}
                                onChange={e => setFormData({...formData, paidAmount: Number(e.target.value)})}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:border-brand outline-none transition-all"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 block">Next Due Date</label>
                            <input 
                                type="date" 
                                required={(formData.paymentType === 'Half Payment' || !!initialPayment) && newRemaining > 0}
                                value={formData.nextDueDate}
                                onChange={e => setFormData({...formData, nextDueDate: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:border-brand outline-none transition-all disabled:opacity-50"
                                disabled={newRemaining <= 0}
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-brand/10 border border-brand/20 rounded-2xl">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand">Calculated Balance</span>
                            <span className={`text-xl font-black italic ${newRemaining <= 0 ? 'text-green-500' : ''}`}>₹{newRemaining.toLocaleString()}</span>
                        </div>
                        <p className="text-[8px] uppercase tracking-wider text-neutral-500">
                            {initialPayment ? `Initial Balance: ₹${currentRemaining.toLocaleString()}` : 'Remaining units after current synchronization.'}
                        </p>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-white/5 text-neutral-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all border border-white/5"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-4 bg-brand text-black text-[10px] font-black uppercase tracking-widest rounded-2xl hover:shadow-[0_0_20px_rgba(255,107,0,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Confirm Synchronization'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
