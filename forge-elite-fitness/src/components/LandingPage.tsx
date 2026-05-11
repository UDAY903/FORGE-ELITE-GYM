import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dumbbell, Shield, Zap, ArrowRight, Instagram, Twitter, Youtube, Menu, X, Check, Mail, Phone, MapPin } from 'lucide-react';
import { signInWithPopup, auth, googleProvider, db, signOut } from '../lib/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

import { Logo } from './Logo';

export const LandingPage = ({ onBook, onMemberships }: { onBook: () => void, onMemberships?: () => void }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isGuest, setAsGuest } = useAuth();

    const handleSignOut = async () => {
        if (isGuest) {
            setAsGuest(false);
        } else {
            await signOut(auth);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-brand selection:text-black">
            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 px-8 py-6 flex justify-between items-center bg-gradient-to-b from-black to-transparent pointer-events-none">
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="pointer-events-auto shrink-0 hover:opacity-80 transition-opacity">
                    <Logo size="md" />
                </button>

                <div className="hidden lg:flex gap-10 items-center pointer-events-auto absolute left-1/2 -translate-x-1/2">
                    {['Appointments', 'Contact', 'Memberships'].map(item => (
                        <button 
                            key={item} 
                            onClick={() => {
                                if (item === 'Appointments') onBook();
                                if (item === 'Memberships' && onMemberships) onMemberships();
                                if (item === 'Contact') document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 hover:text-brand transition-colors whitespace-nowrap"
                        >
                            {item}
                        </button>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="hidden lg:flex gap-4 items-center pointer-events-auto">
                    <button 
                        onClick={handleSignOut}
                        className="bg-white/5 border border-white/10 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:border-red-500/50 hover:bg-red-500/5 transition-all text-neutral-400 hover:text-red-500"
                    >
                        Sign Out
                    </button>
                </div>

                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="lg:hidden pointer-events-auto p-2 bg-white/5 rounded-full border border-white/5"
                >
                    {isMenuOpen ? <X /> : <Menu />}
                </button>
            </nav>

            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-40 bg-black flex flex-col items-center justify-center gap-8 p-12 text-center"
                    >
                        {['Appointments', 'Contact', 'Memberships'].map(item => (
                            <button 
                                key={item} 
                                onClick={() => {
                                    if (item === 'Appointments') onBook();
                                    if (item === 'Memberships' && onMemberships) onMemberships();
                                    if (item === 'Contact') document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                                    setIsMenuOpen(false);
                                }} 
                                className="text-4xl font-bold italic tracking-tighter hover:text-brand"
                            >
                                {item}
                            </button>
                        ))}
                        <button 
                            onClick={() => {
                                handleSignOut();
                                setIsMenuOpen(false);
                            }}
                            className="mt-4 bg-red-500 text-white px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                        >
                            Sign Out
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10" />
                    <img 
                        src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=2070" 
                        className="w-full h-full object-cover grayscale opacity-30 scale-105" 
                        alt="Hero"
                        referrerPolicy="no-referrer"
                    />
                </div>

                <div className="relative z-20 text-center px-6 max-w-5xl space-y-8 mt-12 mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-6xl md:text-9xl font-bold italic tracking-tighter uppercase leading-[0.85]">
                            Evolve to <br />
                            <span className="text-brand">Absolute</span> Power
                        </h1>
                        <p className="mt-8 text-neutral-400 text-lg md:text-xl font-light max-w-2xl mx-auto uppercase tracking-widest leading-relaxed mb-12">
                            A high-end sanctuary for elite athletes. No compromises. <br /> Only results.
                        </p>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onMemberships}
                            className="bg-brand text-black px-12 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white transition-all shadow-[0_0_50px_rgba(255,107,0,0.3)]"
                        >
                            Forge Elite
                        </motion.button>
                    </motion.div>
                </div>

                <div className="absolute bottom-12 left-12 hidden lg:flex flex-col gap-6 text-neutral-500">
                    <Instagram size={20} className="hover:text-brand cursor-pointer transition-colors" />
                    <Twitter size={20} className="hover:text-brand cursor-pointer transition-colors" />
                    <Youtube size={20} className="hover:text-brand cursor-pointer transition-colors" />
                </div>

                <div className="absolute bottom-8 right-12 text-[10px] font-bold text-neutral-600 uppercase tracking-widest vertical-rl transform rotate-180">
                    Scroll to Transcend
                </div>
            </section>

            {/* Features */}
            <section className="py-32 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
                {[
                    { icon: Zap, title: 'Hyper Drive', desc: 'Cutting edge bio-tracking and neuro-performance zones for accelerated results.' },
                    { icon: Shield, title: 'The Vault', desc: 'A secure, members-only environment focused on absolute concentration and purity.' },
                    { icon: Dumbbell, title: 'Titan Tech', desc: 'Precision engineered weight equipment designed by olympic architects.' },
                ].map((feat, i) => (
                    <motion.div 
                        whileInView={{ opacity: 1, y: 0 }}
                        initial={{ opacity: 0, y: 30 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="p-10 bg-neutral-950 border border-white/5 rounded-3xl group hover:border-brand/40 transition-all"
                    >
                        <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center text-brand mb-8 group-hover:scale-110 transition-transform">
                            <feat.icon size={32} />
                        </div>
                        <h3 className="text-2xl font-bold uppercase italic tracking-tighter mb-4">{feat.title}</h3>
                        <p className="text-neutral-500 leading-relaxed font-light">{feat.desc}</p>
                    </motion.div>
                ))}
            </section>

            {/* CTA/Contact */}
            <section id="contact" className="py-32 px-6 max-w-4xl mx-auto text-center space-y-12">
                <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-brand/20">
                    <Mail size={32} className="text-brand" />
                </div>
                <h2 className="text-4xl md:text-6xl font-bold italic uppercase tracking-tighter">Contact <span className="text-brand">Us</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    <div className="space-y-6 bg-neutral-950 p-8 rounded-3xl border border-white/5">
                        <div className="flex items-center gap-4 text-neutral-400 hover:text-brand transition-colors cursor-pointer group">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-brand/10 transition-all">
                                <Phone size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Phone</p>
                                <p className="font-bold">+1 (800) FORGE-PRO</p>
                            </div>
                        </div>
                        <a href="mailto:elite@forge.fit" className="flex items-center gap-4 text-neutral-400 hover:text-brand transition-colors cursor-pointer group">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-brand/10 transition-all">
                                <Mail size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Email</p>
                                <p className="font-bold">elite@forge.fit</p>
                            </div>
                        </a>
                        <div className="flex items-center gap-4 text-neutral-400 hover:text-brand transition-colors cursor-pointer group">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-brand/10 transition-all">
                                <MapPin size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Location</p>
                                <p className="font-bold">Alpha Sector, DTLA 90012</p>
                            </div>
                        </div>
                    </div>
                    <form 
                        className="space-y-4"
                        onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.target as HTMLFormElement;
                            const name = (form.elements[0] as HTMLInputElement).value;
                            const email = (form.elements[1] as HTMLInputElement).value;
                            const message = (form.elements[2] as HTMLTextAreaElement).value;
                            
                            try {
                                await addDoc(collection(db, 'messages'), {
                                    name,
                                    email,
                                    message,
                                    date: new Date().toISOString(),
                                    status: 'New',
                                    subject: 'Elite Program Inquiry'
                                });

                                // Trigger Email Notification
                                try {
                                    await fetch('/api/send-message-alert', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ name, email, message, subject: 'Elite Program Inquiry' })
                                    });
                                } catch (emailErr) {
                                    console.error("Message alert failed:", emailErr);
                                }

                                alert('Message dispatched to the Architects.');
                                form.reset();
                            } catch (err) {
                                console.error(err);
                                alert('Signal lost. Transmission failed.');
                            }
                        }}
                    >
                        <input required type="text" placeholder="NAME" className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:border-brand/50 focus:outline-none focus:bg-brand/5 transition-all uppercase tracking-widest" />
                        <input required type="email" placeholder="EMAIL" className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:border-brand/50 focus:outline-none focus:bg-brand/5 transition-all uppercase tracking-widest" />
                        <textarea required placeholder="MESSAGE" rows={4} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:border-brand/50 focus:outline-none focus:bg-brand/5 transition-all uppercase tracking-widest" />
                        <button type="submit" className="w-full py-5 bg-brand text-black font-black uppercase text-xs tracking-[0.3em] rounded-2xl hover:bg-white transition-all shadow-[0_0_30px_rgba(255,107,0,0.1)]">Forge Elite</button>
                    </form>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 px-6 border-t border-white/5">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="flex flex-col items-center gap-4">
                        <Logo size="lg" className="mb-4" />
                    </div>
                    <div className="flex gap-12">
                        {['Terms', 'Privacy', 'Compliance', 'Security'].map(item => (
                            <a key={item} href="#" className="text-[10px] font-black uppercase tracking-widest text-neutral-600 hover:text-white transition-colors">{item}</a>
                        ))}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-700">© 2026 FORGE ELITE FITNESS. ALL RIGHTS SECURED.</p>
                </div>
            </footer>
        </div>
    );
};
