import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';
import { signOut, auth } from '../lib/firebase';
import { Logo } from './Logo';

export const AccessDenied = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-card p-12 rounded-[40px] border border-red-500/20 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-red-500/5 backdrop-blur-3xl -z-10" />
        
        <Logo size="md" className="mb-12 justify-center" />
        
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
          <ShieldAlert size={40} className="text-red-500" />
        </div>

        <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-4">
          Unauthorized <span className="text-red-500">Access</span>
        </h1>
        
        <p className="text-neutral-400 text-sm font-light uppercase tracking-[0.2em] leading-relaxed mb-12">
          Your credentials do not carry the administrative clearance required for this sector. 
          Biological signature mismatch.
        </p>

        <div className="flex flex-col gap-4">
          <button 
            onClick={() => signOut(auth)}
            className="w-full py-4 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-brand hover:text-black transition-all flex items-center justify-center gap-3"
          >
            <LogOut size={14} /> Switch Account
          </button>
          
          <button 
            onClick={() => {
              signOut(auth);
              onBack();
            }}
            className="w-full py-4 bg-transparent text-neutral-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:text-white transition-all flex items-center justify-center gap-3"
          >
            <ArrowLeft size={14} /> Return to Sanctum
          </button>
        </div>
      </motion.div>
    </div>
  );
};
