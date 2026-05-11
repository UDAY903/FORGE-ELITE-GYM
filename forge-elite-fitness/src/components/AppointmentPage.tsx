import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, Clock, Zap, Waves, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { db, handleFirestoreError, OperationType, signOut, auth } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

interface AppointmentPageProps {
    onBack: () => void;
}

export const AppointmentPage = ({ onBack }: AppointmentPageProps) => {
    const { user, isGuest, setAsGuest } = useAuth();
    const [step, setStep] = useState(1);
    const [viewDate, setViewDate] = useState(new Date());
    const [service, setService] = useState<'training' | 'sauna' | null>(null);

    const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });

    const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

    const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1));
    const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1));

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const isToday = (day: number) => {
        const today = new Date();
        return today.getDate() === day && today.getMonth() === viewDate.getMonth() && today.getFullYear() === viewDate.getFullYear();
    };

    const isSelected = (day: number) => {
        if (!date) return false;
        const year = viewDate.getFullYear();
        const month = String(viewDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        return date === `${year}-${month}-${dayStr}`;
    };

    const handleDateSelect = (day: number) => {
        const year = viewDate.getFullYear();
        const month = String(viewDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        setDate(`${year}-${month}-${dayStr}`);
    };
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [bookingError, setBookingError] = useState<string | null>(null);

    const services = [
        {
            id: 'training',
            title: 'Workout Session',
            desc: '1-on-1 biological architecture session with a master coach.',
            icon: Zap,
            duration: '60 Min',
            color: 'bg-brand'
        },
        {
            id: 'sauna',
            title: 'Sauna',
            desc: 'Deep tissue thermal recovery & cellular detoxification.',
            icon: Waves,
            duration: '45 Min',
            color: 'bg-blue-500'
        }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isGuest) {
            setAsGuest(false);
            return;
        }

        setIsSubmitting(true);
        
        try {
            setBookingError(null);
            await addDoc(collection(db, 'appointments'), {
                memberName: `${form.firstName} ${form.lastName}`,
                memberId: user?.uid || form.email, 
                trainerName: service === 'training' ? 'Workout Session' : 'Sauna System',
                trainerId: 'admin',
                date: `${date}T${convertTo24Hour(time)}:00Z`,
                status: 'Pending',
                type: service
            });
            setIsSuccess(true);
        } catch (err) {
            setBookingError(err instanceof Error ? err.message : 'Permission Denied: Check details.');
            handleFirestoreError(err, OperationType.CREATE, 'appointments');
        } finally {
            setIsSubmitting(false);
        }
    };

    const convertTo24Hour = (timeStr: string) => {
        if (!timeStr) return "00:00";
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') hours = '00';
        if (modifier === 'PM' && hours !== '12') hours = String(parseInt(hours, 10) + 12);
        return `${hours.padStart(2, '0')}:${minutes}`;
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-neutral-900 border border-white/5 rounded-3xl p-12 text-center space-y-6"
                >
                    <div className="w-20 h-20 bg-brand/20 border border-brand/40 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={40} className="text-brand" />
                    </div>
                    <h2 className="text-3xl font-bold uppercase italic tracking-tighter">Session Securely Booked</h2>
                    <p className="text-neutral-400">Your session has been synced with our master schedule. Check your neural-link (email) for confirmation.</p>
                    <button 
                        onClick={onBack}
                        className="w-full py-4 bg-brand text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-white transition-all"
                    >
                        Return to Base
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-brand selection:text-black">
            {/* Header */}
            <header className="px-8 py-6 flex justify-between items-center border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
                <button 
                    onClick={onBack}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-brand transition-colors"
                >
                    <ArrowLeft size={14} /> Back
                </button>
                <button onClick={onBack} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-2 h-6 bg-brand rounded-full" />
                    <span className="text-sm font-bold tracking-tighter uppercase italic">Forge <span className="text-brand text-xs">Elite</span></span>
                </button>
                <div className="w-14" /> {/* Spacer */}
            </header>

            <main className="max-w-4xl mx-auto py-20 px-6">
                <div className="space-y-4 mb-16 text-center">
                    <h1 className="text-5xl md:text-7xl font-bold uppercase italic tracking-tighter">Reserve <span className="text-brand">Transcendence</span></h1>
                    <p className="text-neutral-500 font-light uppercase tracking-widest text-xs">Select your session and coordinate with our schedule.</p>
                </div>

                <div className="bg-neutral-900/50 border border-white/5 rounded-[40px] p-8 md:p-12 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand opacity-5 blur-[100px] pointer-events-none" />
                    
                    {/* Progress Bar */}
                    <div className="flex gap-2 mb-12">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-brand' : 'bg-white/10'}`} />
                        ))}
                    </div>

                    {step === 1 && (
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-8"
                        >
                            <h2 className="text-2xl font-bold uppercase tracking-tight">Select Protocol</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {services.map(s => {
                                    const Icon = s.icon;
                                    return (
                                        <button
                                            key={s.id}
                                            onClick={() => {
                                                setService(s.id as any);
                                                setStep(2);
                                            }}
                                            className={`group p-8 rounded-3xl border text-left transition-all ${
                                                service === s.id ? 'bg-brand border-brand' : 'bg-black/40 border-white/10 hover:border-brand/40'
                                            }`}
                                        >
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
                                                service === s.id ? 'bg-black/20' : 'bg-neutral-800'
                                            }`}>
                                                <Icon size={24} className={service === s.id ? 'text-black' : 'text-brand'} />
                                            </div>
                                            <h3 className={`text-xl font-bold uppercase mb-2 ${service === s.id ? 'text-black' : ''}`}>{s.title}</h3>
                                            <p className={`text-sm mb-6 ${service === s.id ? 'text-black/70' : 'text-neutral-500'}`}>{s.desc}</p>
                                            {s.id !== 'training' && (
                                                <div className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${service === s.id ? 'text-black' : 'text-brand'}`}>
                                                    {s.duration} <ChevronRight size={12} />
                                                </div>
                                            )}
                                            {s.id === 'training' && (
                                                <div className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${service === s.id ? 'text-black' : 'text-brand'}`}>
                                                    Reserve Slot <ChevronRight size={12} />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-8"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold uppercase tracking-tight">Select Baseline</h2>
                                <button onClick={() => setStep(1)} className="text-[10px] uppercase font-bold text-neutral-500 hover:text-white">Change Service</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black uppercase tracking-widest text-neutral-500">Coordinate Date</span>
                                            <div className="flex items-center gap-4">
                                                <button onClick={handlePrevMonth} className="p-1 hover:text-brand transition-colors"><ChevronLeft size={16} /></button>
                                                <span className="text-[10px] font-black uppercase tracking-widest">{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                                                <button onClick={handleNextMonth} className="p-1 hover:text-brand transition-colors"><ChevronRight size={16} /></button>
                                            </div>
                                        </div>

                                        <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
                                            <div className="grid grid-cols-7 mb-2">
                                                {dayNames.map(d => (
                                                    <div key={d} className="text-center text-[8px] font-black uppercase tracking-tighter text-neutral-600 py-2">{d}</div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-7 gap-1">
                                                {Array.from({ length: firstDayOfMonth(viewDate.getMonth(), viewDate.getFullYear()) }).map((_, i) => (
                                                    <div key={`empty-${i}`} />
                                                ))}
                                                {Array.from({ length: daysInMonth(viewDate.getMonth(), viewDate.getFullYear()) }).map((_, i) => {
                                                    const d = i + 1;
                                                    const selected = isSelected(d);
                                                    const today = isToday(d);
                                                    return (
                                                        <button
                                                            key={d}
                                                            onClick={() => handleDateSelect(d)}
                                                            className={`aspect-square rounded-lg text-xs font-bold transition-all relative flex items-center justify-center ${
                                                                selected 
                                                                    ? 'bg-brand text-black scale-110 z-10' 
                                                                    : 'hover:bg-white/5 text-neutral-300'
                                                            }`}
                                                        >
                                                            {d}
                                                            {today && !selected && (
                                                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand rounded-full" />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <span className="text-xs font-black uppercase tracking-widest text-neutral-500 block">Available Slots</span>
                                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 gap-2">
                                            {(service === 'sauna' 
                                                ? ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM']
                                                : ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM']
                                            ).map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => setTime(t)}
                                                    className={`py-3 rounded-lg text-[10px] font-bold transition-all ${
                                                        time === t ? 'bg-brand text-black' : 'bg-black border border-white/5 hover:border-brand/30'
                                                    }`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-black/30 rounded-3xl p-8 border border-white/5 space-y-6">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-brand">Session Summary</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-neutral-500">Service</span>
                                            <span className="font-bold uppercase italic text-brand">{service === 'training' ? 'Workout Session' : 'Sauna'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-neutral-500">Date</span>
                                            <span className="font-mono">{date || 'TBD'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-neutral-500">Time</span>
                                            <span className="font-mono">{time || 'TBD'}</span>
                                        </div>
                                    </div>
                                    <button
                                        disabled={!date || !time}
                                        onClick={() => setStep(3)}
                                        className="w-full py-4 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-brand transition-all disabled:opacity-20"
                                    >
                                        Proceed to Verification
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-8"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold uppercase tracking-tight">Final Verification</h2>
                                <button onClick={() => setStep(2)} className="text-[10px] uppercase font-bold text-neutral-500 hover:text-white">Back to Schedule</button>
                            </div>

                            <div className="bg-neutral-800/30 rounded-2xl p-6 border border-white/5 mb-8 max-w-lg mx-auto">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-brand mb-4">Verification Details</h3>
                                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                    <div>
                                        <p className="text-[8px] text-neutral-500 uppercase font-black tracking-widest mb-1">Service</p>
                                        <p className="text-sm font-bold uppercase italic">{service === 'training' ? 'Workout Session' : 'Sauna'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] text-neutral-500 uppercase font-black tracking-widest mb-1">Duration</p>
                                        <p className="text-sm font-bold uppercase tracking-widest">{service === 'training' ? '60 MIN' : '45 MIN'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] text-neutral-500 uppercase font-black tracking-widest mb-1">Target Date</p>
                                        <p className="text-sm font-mono">{date}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] text-neutral-500 uppercase font-black tracking-widest mb-1">Time Slot</p>
                                        <p className="text-sm font-mono">{time}</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">First Name</label>
                                        <input 
                                            required 
                                            type="text" 
                                            value={form.firstName}
                                            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                                            className="w-full bg-black border border-white/10 rounded-xl py-3.5 px-4 text-sm focus:border-brand outline-none" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Last Name</label>
                                        <input 
                                            required 
                                            type="text" 
                                            value={form.lastName}
                                            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                            className="w-full bg-black border border-white/10 rounded-xl py-3.5 px-4 text-sm focus:border-brand outline-none" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Email</label>
                                    <input 
                                        required 
                                        type="email" 
                                        placeholder="identity@nexus.com" 
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded-xl py-3.5 px-4 text-sm focus:border-brand outline-none" 
                                    />
                                </div>

                                {bookingError && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                                        Error: {bookingError}
                                    </div>
                                )}

                                    {isGuest ? (
                                        <button 
                                            type="button"
                                            onClick={() => setAsGuest(false)}
                                            className="w-full py-5 bg-brand text-black font-black uppercase text-xs tracking-[0.2em] rounded-xl hover:bg-white transition-all shadow-[0_0_40px_rgba(255,107,0,0.2)]"
                                        >
                                            Login with Google to Book
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full py-5 bg-brand text-black font-black uppercase text-xs tracking-[0.2em] rounded-xl hover:bg-white transition-all shadow-[0_0_40px_rgba(255,107,0,0.2)]"
                                        >
                                            {isSubmitting ? 'Syncing...' : 'Book Session'}
                                        </button>
                                    )}
                            </form>
                        </motion.div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-700">Digital Protocol v.4.0</p>
            </footer>
        </div>
    );
};
