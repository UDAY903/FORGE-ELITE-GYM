import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Activity, Users, DollarSign, Calendar, TrendingUp, ChevronRight } from "lucide-react";
import { collection, query, onSnapshot, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

export const Overview = () => {
  const [stats, setStats] = useState([
    { label: 'Revenue', value: '₹0', change: '+0%', icon: DollarSign, color: 'text-brand' },
    { label: 'Total Members', value: '0', change: '...', icon: Users, color: 'text-brand' },
    { label: 'Active Sessions', value: '0', change: '...', icon: Activity, color: 'text-blue-500' },
    { label: 'New Signups', value: '0', change: '...', icon: TrendingUp, color: 'text-orange-500' },
  ]);

  useEffect(() => {
    // Member count
    const unsubscribeMembers = onSnapshot(collection(db, "members"), (snapshot) => {
        updateStat('Total Members', snapshot.size.toLocaleString());
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newOnes = snapshot.docs.filter(doc => new Date(doc.data().joinDate) > thirtyDaysAgo);
        updateStat('New Signups', newOnes.length.toString());
    });

    // Active Appointments
    const unsubscribeAppts = onSnapshot(
        query(collection(db, "appointments"), where("status", "==", "Accepted")), 
        (snapshot) => {
            updateStat('Active Sessions', snapshot.size.toString());
        }
    );

    // Revenue
    const unsubscribePayments = onSnapshot(collection(db, "payments"), (snapshot) => {
        const total = snapshot.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0);
        updateStat('Revenue', `₹${total.toLocaleString()}`);
    });

    return () => {
        unsubscribeMembers();
        unsubscribeAppts();
        unsubscribePayments();
    };
  }, []);

  const updateStat = (label: string, value: string) => {
    setStats(prev => prev.map(s => s.label === label ? { ...s, value } : s));
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Performance <span className="text-brand">Overview</span></h2>
        <p className="text-neutral-500 mt-1">Real-time gym metrics and athlete stats.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="glass-card p-6 rounded-2xl relative overflow-hidden group"
          >
            <div className={`p-3 rounded-xl bg-white/5 w-fit ${stat.color}`}>
                <stat.icon size={24} />
            </div>
            <div className="mt-4">
                <p className="text-neutral-500 text-xs font-semibold uppercase tracking-widest">{stat.label}</p>
                <div className="flex items-end gap-2 mt-1">
                    <span className="text-2xl font-bold">{stat.value}</span>
                    <span className="text-[10px] text-green-500 font-bold mb-1">{stat.change}</span>
                </div>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-brand/10 transition-all" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card rounded-2xl p-8">
            <h3 className="text-lg font-bold mb-6 flex items-center justify-between">
                Recent Transmissions
                <TrendingUp size={16} className="text-brand" />
            </h3>
            <div className="space-y-4">
                <RecentMessages />
            </div>
        </div>

        <div className="glass-card rounded-2xl p-8">
            <h3 className="text-lg font-bold mb-6 flex items-center justify-between">
                Pending Protocol
                <Calendar size={16} className="text-brand" />
            </h3>
            <div className="space-y-4">
                <RecentAppointments />
            </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold">Attendance Trends</h3>
              <div className="flex gap-2">
                  <button className="px-3 py-1 bg-brand text-black text-[10px] font-bold rounded-lg uppercase tracking-wider">Weekly</button>
                  <button className="px-3 py-1 bg-white/5 text-neutral-400 text-[10px] font-bold rounded-lg uppercase tracking-wider">Monthly</button>
              </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2 px-2">
              {[40, 70, 45, 90, 65, 80, 50, 85, 30, 95, 60, 75].map((h, i) => (
                  <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: i * 0.05, duration: 1 }}
                      key={i} 
                      className="flex-1 bg-neutral-800 rounded-t-sm relative group"
                  >
                      <div className="absolute inset-0 bg-brand opacity-0 group-hover:opacity-100 transition-opacity rounded-t-sm" />
                  </motion.div>
              ))}
          </div>
      </div>
    </div>
  );
};

const RecentMessages = () => {
    const [msgs, setMsgs] = useState<any[]>([]);
    useEffect(() => {
        const q = query(collection(db, "messages"), where("status", "==", "New"));
        return onSnapshot(q, (snapshot) => {
            setMsgs(snapshot.docs.slice(0, 3).map(d => ({ id: d.id, ...d.data() })));
        });
    }, []);

    if (msgs.length === 0) return <p className="text-xs text-neutral-500 font-mono text-center py-4 italic">No new messages.</p>;

    return (
        <div className="space-y-3">
            {msgs.map(m => (
                <div key={m.id} className="p-3 bg-white/5 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-brand/5 transition-all">
                    <div>
                        <p className="text-xs font-bold">{m.name}</p>
                        <p className="text-[10px] text-neutral-500 truncate max-w-[150px]">{m.message}</p>
                    </div>
                    <ChevronRight size={14} className="text-neutral-700 group-hover:text-brand" />
                </div>
            ))}
        </div>
    );
};

const RecentAppointments = () => {
    const [appts, setAppts] = useState<any[]>([]);
    useEffect(() => {
        const q = query(collection(db, "appointments"), where("status", "==", "Pending"));
        return onSnapshot(q, (snapshot) => {
            setAppts(snapshot.docs.slice(0, 3).map(d => ({ id: d.id, ...d.data() })));
        });
    }, []);

    if (appts.length === 0) return <p className="text-xs text-neutral-500 font-mono text-center py-4 italic">No pending bookings.</p>;

    return (
        <div className="space-y-3">
            {appts.map(a => (
                <div key={a.id} className="p-3 bg-white/5 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-brand/5 transition-all">
                    <div>
                        <p className="text-xs font-bold">{a.memberName}</p>
                        <p className="text-[10px] text-brand uppercase font-black">{new Date(a.date).toLocaleDateString()}</p>
                    </div>
                    <ChevronRight size={14} className="text-neutral-700 group-hover:text-brand" />
                </div>
            ))}
        </div>
    );
};
