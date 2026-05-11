import React from 'react';
import { motion } from 'motion/react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { Logo } from './Logo';
import { Shield, Zap, ArrowRight, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
    const { setAsGuest } = useAuth();
    const handleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err: any) {
            if (err.code === 'auth/popup-closed-by-user') {
                console.log("Authentication cancelled by user.");
                return;
            }
            console.error("Authentication failed:", err);
        }
    };

    const handleGuestLogin = () => {
        setAsGuest(true);
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden select-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand/10 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand/5 blur-[150px] rounded-full" />
            </div>

            <div className="max-w-md w-full z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="glass-card p-12 rounded-[40px] border border-white/10 text-center relative overflow-hidden backdrop-blur-xl"
                >
                    <div className="absolute inset-0 bg-brand/5 -z-10" />
                    
                    <div className="flex justify-center mb-12">
                        <Logo size="lg" />
                    </div>

                    <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-4 leading-none">
                        Elite <span className="text-brand">Access</span>
                    </h1>
                    <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.3em] mb-12">
                        Authentication required for system entry
                    </p>

                    <div className="space-y-6 mb-12 text-left">
                        {[
                            { icon: Shield, title: 'Secure Protocol', desc: 'Encrypted biometric synchronization' },
                            { icon: Zap, title: 'Titan Sync', desc: 'Real-time performance distribution' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 group">
                                <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-brand border border-white/5 group-hover:border-brand/40 transition-all">
                                    <item.icon size={18} />
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white">{item.title}</h3>
                                    <p className="text-[9px] text-neutral-500 uppercase font-bold">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <motion.button 
                            whileHover={{ scale: 1.02, shadow: "0 0 40px rgba(255,107,0,0.3)" }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleLogin}
                            className="w-full bg-brand text-black py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all flex items-center justify-center gap-4 group"
                        >
                            Login with Google
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </motion.button>

                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleGuestLogin}
                            className="w-full bg-white/5 border border-white/10 text-white/60 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] transition-all flex items-center justify-center gap-3 hover:text-white hover:bg-white/10"
                        >
                            <User size={14} />
                            Continue as Guest
                        </motion.button>
                    </div>

                    <p className="mt-8 text-[8px] text-neutral-600 font-black uppercase tracking-widest">
                        Forge Elite Security Architecture © 2026
                    </p>
                </motion.div>
                
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-center mt-12 text-neutral-500 text-[10px] font-bold uppercase tracking-widest"
                >
                    Unauthorized attempts will be logged by the architects.
                </motion.p>
            </div>
        </div>
    );
};
