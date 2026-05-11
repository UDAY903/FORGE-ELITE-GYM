import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { Sidebar, Topbar } from "./components/DashboardLayout";
import { Overview } from "./components/Overview";
import { MembersPage } from "./components/MembersPage";
import { TrainersPage } from "./components/TrainersPage";
import { AppointmentsPage } from "./components/AppointmentsPage";
import { PaymentsPage } from "./components/PaymentsPage";
import { MessagesPage } from "./components/MessagesPage";
import { NotificationsPage } from "./components/NotificationsPage";
import { SettingsPage } from "./components/SettingsPage";
import { LandingPage } from "./components/LandingPage";
import { AppointmentPage } from "./components/AppointmentPage";
import { MembershipPage } from "./components/MembershipPage";
import { AccessDenied } from "./components/AccessDenied";
import { LoginPage } from "./components/LoginPage";
import { motion, AnimatePresence } from "motion/react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "./lib/firebase";

export default function App() {
  const { user, isAdmin, isGuest, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [view, setView] = useState<"landing" | "booking" | "memberships">("landing");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [notifCounts, setNotifCounts] = useState({
    messages: false,
    appointments: false,
    members: false,
    notifications: false
  });

  useEffect(() => {
    if (!isAdmin) return;

    // Listen for new messages
    const qMessages = query(collection(db, "messages"), where("status", "==", "New"));
    const unsubMessages = onSnapshot(qMessages, (snap) => {
      setNotifCounts(prev => ({ ...prev, messages: snap.size > 0 }));
    });

    // Listen for pending appointments
    const qAppts = query(collection(db, "appointments"), where("status", "==", "Pending"));
    const unsubAppts = onSnapshot(qAppts, (snap) => {
      setNotifCounts(prev => ({ ...prev, appointments: snap.size > 0 }));
    });

    // Listen for pending members (unpaid/new)
    const qMembers = query(collection(db, "members"), where("paymentStatus", "==", "Pending"));
    const unsubMembers = onSnapshot(qMembers, (snap) => {
      setNotifCounts(prev => ({ ...prev, members: snap.size > 0 }));
    });

    // Listen for active notifications
    const qNotifs = query(collection(db, "notifications"), where("active", "==", true));
    const unsubNotifs = onSnapshot(qNotifs, (snap) => {
      setNotifCounts(prev => ({ ...prev, notifications: snap.size > 0 }));
    });

    return () => {
      unsubMessages();
      unsubAppts();
      unsubMembers();
      unsubNotifs();
    };
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand animate-pulse">Initializing Systems</p>
        </div>
      </div>
    );
  }

  // Authentication Gate: Require user OR guest status
  if (!user && !isGuest) {
    return <LoginPage />;
  }

  // Public views - show these regardless of admin status, but ONLY to logged in users
  if (view === "booking") {
    return <AppointmentPage onBack={() => setView("landing")} />;
  }
  if (view === "memberships") {
    return <MembershipPage onBack={() => setView("landing")} />;
  }

  // Admin routing
  if (!isAdmin) {
    // If sign-in succeeded but they are NOT admin, they see the regular landing page (for booking/memberships)
    // We could also show a "Client Dashboard" here if it existed
    return <LandingPage onBook={() => setView("booking")} onMemberships={() => setView("memberships")} />;
  }

  const hasGlobalNotifs = notifCounts.messages || notifCounts.appointments || notifCounts.members || notifCounts.notifications;

  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans relative">
      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop static, Mobile absolute drawer */}
      <div className={`
        fixed inset-y-0 left-0 z-50 md:relative md:z-auto transition-transform duration-300 transform 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        w-64 h-full
      `}>
          <Sidebar 
            activeTab={activeTab} 
            setTab={setActiveTab} 
            notificationCounts={notifCounts}
            onItemClick={() => setIsSidebarOpen(false)}
          />
      </div>
      
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar 
          onSettingsClick={() => setActiveTab('settings')} 
          onNotificationsClick={() => setActiveTab('notifications')} 
          hasGlobalNotifications={hasGlobalNotifs}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "overview" && <Overview />}
              {activeTab === "members" && <MembersPage />}
              {activeTab === "appointments" && <AppointmentsPage />}
              {activeTab === "trainers" && <TrainersPage />}
              {activeTab === "payments" && <PaymentsPage />}
              {activeTab === "messages" && <MessagesPage />}
              {activeTab === "notifications" && <NotificationsPage />}
              {activeTab === "settings" && <SettingsPage />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function PlaceholderPage({ title }: { title: string }) {
    return (
        <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
            <h2 className="text-4xl font-bold uppercase italic tracking-tighter">{title} <span className="text-brand">Protocol</span></h2>
            <p className="text-neutral-500 font-mono text-sm uppercase tracking-widest">System segment currently under architectural construction.</p>
            <div className="w-64 h-[1px] bg-white/10" />
        </div>
    );
}
