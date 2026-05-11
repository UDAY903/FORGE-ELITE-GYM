import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Shield, Save, LogOut, Bell, User as UserIcon, Globe, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { signOut } from 'firebase/auth';

export const SettingsPage = () => {
    const [settings, setSettings] = useState({ gymName: 'Forge Elite Fitness', address: 'Alpha Sector, DTLA', email: 'elite@forge.fit', phone: '+1 800 FORGE-PRO' });

    return (
        <div className="space-y-8 max-w-2xl">
            <div>
                <h2 className="text-3xl font-bold tracking-tight italic">System <span className="text-brand">Configuration</span></h2>
                <p className="text-neutral-500 mt-1">Core architectural parameters and admin security.</p>
            </div>

            <div className="space-y-6">
                <section className="glass-card rounded-2xl p-8 space-y-6">
                    <div className="flex items-center gap-3 text-brand">
                        <Globe size={20} />
                        <h3 className="text-sm font-black uppercase tracking-[0.2em]">Gym Identity</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Brand Name</label>
                            <input 
                                value={settings.gymName}
                                onChange={e => setSettings({...settings, gymName: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand/50 focus:outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">HQ Address</label>
                            <input 
                                value={settings.address}
                                onChange={e => setSettings({...settings, address: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand/50 focus:outline-none"
                            />
                        </div>
                    </div>
                </section>

                <section className="glass-card rounded-2xl p-8 space-y-6">
                    <div className="flex items-center gap-3 text-brand">
                        <Shield size={20} />
                        <h3 className="text-sm font-black uppercase tracking-[0.2em]">Security Protocol</h3>
                    </div>

                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-neutral-300">Admin Whitelist</p>
                            <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">udaywelapure@gmail.com</p>
                        </div>
                        <span className="px-3 py-1 bg-brand/10 text-brand text-[8px] font-black uppercase tracking-widest rounded-full border border-brand/20">Active Access</span>
                    </div>

                    <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand hover:text-white transition-colors">
                        <Bell size={14} /> Configure Notifications
                    </button>
                </section>

                <div className="flex gap-4">
                    <button className="flex-1 py-4 bg-brand text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white transition-all transform active:scale-95 shadow-[0_0_20px_rgba(255,107,0,0.2)]">
                        Save
                    </button>
                    <button 
                        onClick={() => signOut(auth)}
                        className="px-8 py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-500 hover:text-black transition-all"
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
};
