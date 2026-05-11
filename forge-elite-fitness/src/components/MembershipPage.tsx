import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ArrowRight } from 'lucide-react';
import { Logo } from './Logo';
import { db, handleFirestoreError, OperationType, signOut, auth } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { PLANS } from '../constants';
import { useAuth } from '../context/AuthContext';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface MembershipProps {
  onBack: () => void;
}

export const MembershipPage: React.FC<MembershipProps> = ({ onBack }) => {
  const { user, isGuest, setAsGuest } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isGuest) {
        // If they are a guest, we sign them out so they go back to the login gate
        setAsGuest(false);
        return;
    }

    const razorpayKey = (import.meta as any).env.VITE_RAZORPAY_KEY_ID;
    
    if (!razorpayKey) {
      setCheckoutError("Razorpay Key ID not configured in environment variables.");
      return;
    }

    const plan = PLANS.find(p => p.id === selectedPlan);
    if (!plan) return;

    setIsSubmitting(true);
    setCheckoutError(null);

    const amountInPaise = plan.price * 100;

    const options = {
      key: razorpayKey,
      amount: amountInPaise,
      currency: "INR",
      name: "FORGE ELITE",
      description: `Membership: ${plan.name}`,
      handler: async function (response: any) {
        try {
          // Payment successful, now update Firestore
          let months = 1;
          if (selectedPlan === '3months') months = 3;
          if (selectedPlan === '6months') months = 6;
          if (selectedPlan === '12months') months = 12;
          
          const expiry = new Date();
          expiry.setMonth(expiry.getMonth() + months);

          const invoiceId = `INV-${new Date().getFullYear()}${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
          const startDate = new Date().toLocaleDateString('en-GB');

          const memberData = {
            ...formData,
            authId: user?.uid,
            plan: plan?.name || 'Unknown',
            joinDate: new Date().toISOString(),
            paymentStatus: 'Paid',
            razorpayPaymentId: response.razorpay_payment_id,
            expiryDate: expiry.toISOString(),
            paidAmount: plan?.price || 0,
            totalAmount: plan?.price || 0
          };
          
          const memberRef = await addDoc(collection(db, 'members'), memberData);
          
          // Add payment record
          await addDoc(collection(db, 'payments'), {
              memberId: memberRef.id,
              memberName: formData.name,
              amount: plan?.price || 0,
              plan: plan?.name || 'Unknown',
              date: new Date().toISOString(),
              status: 'Completed',
              razorpayPaymentId: response.razorpay_payment_id,
              currency: 'INR'
          });

          // Add Invoice record
          const invoiceData = {
            invoiceId,
            customerName: formData.name,
            customerEmail: formData.email,
            planName: plan?.name || 'Unknown',
            amountPaid: plan?.price || 0,
            remainingAmount: 0, 
            nextDueDate: '',
            status: 'Paid',
            startDate,
            endDate: expiry.toLocaleDateString('en-GB'),
            createdAt: new Date().toISOString()
          };
          await addDoc(collection(db, 'invoices'), invoiceData);
          
          // Trigger Email API
          try {
            await fetch('/api/send-invoice', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(invoiceData)
            });
          } catch (emailErr) {
            console.error("Email notification failed:", emailErr);
            // We don't block success for email failure, but we log it
          }
          
          // Also add a message for admin
          await addDoc(collection(db, 'messages'), {
              name: formData.name,
              email: formData.email,
              subject: 'New Membership Secured',
              message: `Secured the ${plan?.name} plan (${plan?.duration}). Payment ID: ${response.razorpay_payment_id}`,
              date: new Date().toISOString(),
              status: 'New'
          });

          setIsSuccess(true);
        } catch (err) {
          setCheckoutError(err instanceof Error ? err.message : 'Transmission failed: Check details.');
          handleFirestoreError(err, OperationType.CREATE, 'members');
        } finally {
          setIsSubmitting(false);
        }
      },
      prefill: {
        name: formData.name,
        email: formData.email,
        contact: formData.phone
      },
      theme: {
        color: "#FF6B00"
      },
      modal: {
        ondismiss: function() {
          setIsSubmitting(false);
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setCheckoutError("Failed to initialize Razorpay checkout.");
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-neutral-900 border border-brand/20 rounded-3xl p-12 text-center space-y-6"
        >
          <div className="w-20 h-20 bg-brand/20 border border-brand/40 rounded-full flex items-center justify-center mx-auto">
            <Check size={40} className="text-brand" />
          </div>
          <h2 className="text-3xl font-bold uppercase italic tracking-tighter">Cycle Activated</h2>
          <p className="text-neutral-400 font-light">
            Your biological cycle has been successfully funded and activated. Your membership for the <span className="text-brand font-bold uppercase">{PLANS.find(p => p.id === selectedPlan)?.name}</span> protocol is now live.
          </p>
          <button 
            onClick={onBack}
            className="w-full py-4 bg-brand text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-white transition-all shadow-[0_0_30px_rgba(255,107,0,0.3)]"
          >
            Return to Surface
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-brand selection:text-black">
      <nav className="px-8 py-6 flex justify-between items-center border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-brand transition-colors"
        >
          <ArrowRight size={14} className="rotate-180" /> Back
        </button>
        <Logo size="sm" />
        <div className="w-14" />
      </nav>

      <main className="max-w-7xl mx-auto py-20 px-6">
        <div className="text-center space-y-4 mb-20">
          <h1 className="text-5xl md:text-7xl font-bold uppercase italic tracking-tighter">
            Choose Your <span className="text-brand">Protocol</span>
          </h1>
          <p className="text-neutral-500 font-light uppercase tracking-widest text-xs max-w-2xl mx-auto">
            Select the commitment level required for your biological transformation. Longer cycles yield higher resonance and architectural priority.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative glass-card rounded-[32px] p-8 border hover:bg-white/[0.02] flex flex-col transition-all group ${plan.color} ${plan.popular ? 'bg-brand/5 shadow-[0_0_40px_rgba(255,107,0,0.05)]' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-black text-[8px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(255,107,0,0.4)]">
                  Most Optimal
                </div>
              )}
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-8">
                  <div className={`p-4 rounded-2xl ${plan.popular ? 'bg-brand text-black' : 'bg-white/5 text-neutral-400'}`}>
                    <plan.icon size={24} />
                  </div>
                  {plan.save && (
                    <span className="text-[10px] font-black uppercase text-brand tracking-widest">{plan.save}</span>
                  )}
                </div>

                <h3 className="text-2xl font-bold uppercase italic tracking-tighter mb-1">{plan.name}</h3>
                <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mb-6">{plan.duration}</p>

                <div className="flex items-baseline gap-1 mb-8 border-b border-white/5 pb-8">
                  <span className="text-4xl font-black italic tracking-tighter">₹{plan.priceLabel}</span>
                  <span className="text-neutral-600 text-xs font-bold">/CYCLE</span>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map(feat => (
                    <li key={feat} className="flex items-start gap-3 text-xs text-neutral-400 font-light group-hover:text-neutral-200 transition-colors">
                      <Check size={14} className="text-brand shrink-0 mt-0.5" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => {
                  setSelectedPlan(plan.id);
                  setShowCheckout(true);
                }}
                className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${
                  plan.popular 
                    ? 'bg-brand text-black hover:bg-white shadow-[0_0_30px_rgba(255,107,0,0.2)]' 
                    : 'bg-white/5 border border-white/10 hover:border-brand/40'
                }`}
              >
                Forge Elite
              </button>
            </motion.div>
          ))}
        </div>
      </main>

      <AnimatePresence>
        {showCheckout && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCheckout(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass-card rounded-[40px] p-8 md:p-10 border border-brand/20 shadow-2xl"
            >
              <h3 className="text-2xl font-bold italic uppercase tracking-tighter mb-2">Final Processing</h3>
              <p className="text-neutral-500 text-[9px] font-black uppercase tracking-widest mb-6">
                Target: {PLANS.find(p => p.id === selectedPlan)?.name} ({PLANS.find(p => p.id === selectedPlan)?.duration})
              </p>

              <form onSubmit={handleJoin} className="space-y-5">
                <div className="space-y-3">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-600 ml-4">Name</label>
                        <input 
                            required
                            type="text"
                            placeholder="NAME SURNAME"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3.5 text-sm focus:border-brand/50 focus:outline-none transition-all uppercase tracking-widest placeholder:text-neutral-800"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-600 ml-4">Email</label>
                        <input 
                            required
                            type="email"
                            placeholder="IDENTITY@RESONANCE.XYZ"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3.5 text-sm focus:border-brand/50 focus:outline-none transition-all uppercase tracking-widest placeholder:text-neutral-800"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-600 ml-4">Phone Number</label>
                        <input 
                            required
                            type="tel"
                            placeholder="+1 (000) 000-0000"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3.5 text-sm focus:border-brand/50 focus:outline-none transition-all uppercase tracking-widest placeholder:text-neutral-800"
                        />
                    </div>
                </div>

                <div className="bg-brand/5 rounded-2xl p-5 border border-brand/10 mb-6 space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-neutral-500">
                        <span>Initiation Fee</span>
                        <span>₹0.00</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold uppercase italic tracking-tighter">
                        <span>Total Cycle Due</span>
                        <span className="text-brand">₹{PLANS.find(p => p.id === selectedPlan)?.priceLabel}</span>
                    </div>
                </div>

                {checkoutError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-6">
                        Error: {checkoutError}
                    </div>
                )}

                {isGuest ? (
                    <div className="space-y-4 pt-4">
                        <p className="text-brand text-[10px] font-black uppercase tracking-widest text-center italic">Authorization Required for Transaction</p>
                        <button 
                            type="button"
                            onClick={() => setAsGuest(false)}
                            className="w-full py-4 bg-brand text-black rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-white transition-all flex items-center justify-center gap-2"
                        >
                            Login with Google
                            <ArrowRight size={14} />
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-4">
                      <button 
                        type="button"
                        onClick={() => setShowCheckout(false)}
                        className="flex-1 py-4 text-neutral-500 text-xs font-bold uppercase tracking-widest"
                      >
                        Hold
                      </button>
                      <button 
                        disabled={isSubmitting}
                        className="flex-1 py-4 bg-brand text-black rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,107,0,0.3)] hover:bg-white animate-pulse transition-all"
                      >
                        {isSubmitting ? 'Syncing...' : 'Forge Elite'}
                      </button>
                    </div>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
