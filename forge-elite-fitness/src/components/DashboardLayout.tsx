import { motion } from "motion/react";
import { Search, Bell, User as UserIcon, LayoutDashboard, Users, Calendar, CreditCard, MessageSquare, Settings, LogOut, Menu, X, Plus, ChevronRight, Activity, TrendingUp, DollarSign } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { useAuth } from "../context/AuthContext";
import { signOut, auth } from "../lib/firebase";

export const Sidebar = ({ activeTab, setTab, notificationCounts, onItemClick }: { 
  activeTab: string, 
  setTab: (t: string) => void,
  notificationCounts?: { [key: string]: boolean },
  onItemClick?: () => void
}) => {
  const { user } = useAuth();
  
  const menuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'members', icon: Users, label: 'Members', hasBadge: notificationCounts?.members },
    { id: 'appointments', icon: Calendar, label: 'Appointments', hasBadge: notificationCounts?.appointments },
    { id: 'trainers', icon: UserIcon, label: 'Trainers' },
    { id: 'payments', icon: CreditCard, label: 'Payments' },
    { id: 'messages', icon: MessageSquare, label: 'Messages', hasBadge: notificationCounts?.messages },
    { id: 'notifications', icon: Bell, label: 'Notifications', hasBadge: notificationCounts?.notifications },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="h-full bg-neutral-950 flex flex-col w-64 border-r border-white/5">
      <div className="p-8">
        <Logo size="md" />
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
                setTab(item.id);
                if (onItemClick) onItemClick();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${
              activeTab === item.id 
                ? 'bg-brand/10 text-brand border border-brand/20' 
                : 'text-neutral-500 hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="text-sm font-medium">{item.label}</span>
            {item.hasBadge && (
              <span className="absolute right-4 w-2 h-2 bg-brand rounded-full shadow-[0_0_8px_rgba(255,107,0,0.5)] animate-pulse" />
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-3 px-4 py-3 text-neutral-500 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all"
        >
          <LogOut size={20} />
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </div>
    </div>
  );
};

export const Topbar = ({ 
  onSettingsClick, 
  onNotificationsClick,
  hasGlobalNotifications,
  onMenuClick
}: { 
  onSettingsClick?: () => void, 
  onNotificationsClick?: () => void,
  hasGlobalNotifications?: boolean,
  onMenuClick?: () => void
}) => {
  return (
    <header className="h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-black/50 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-4">
            <button 
                onClick={onMenuClick}
                className="p-2 md:hidden text-neutral-400 hover:text-white transition-colors"
            >
                <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/5 w-64 lg:w-96">
                <Search size={18} className="text-neutral-500" />
                <input type="text" placeholder="Search athletes..." className="bg-transparent border-none focus:outline-none text-sm w-full" />
            </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
            <button 
                onClick={onNotificationsClick}
                className="p-2 text-neutral-400 hover:text-white transition-colors relative"
            >
                <Bell size={20} />
                {hasGlobalNotifications && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-brand rounded-full border-2 border-black animate-pulse" />
                )}
            </button>
            <div className="h-8 w-[1px] bg-white/10" />
            <button 
                onClick={onSettingsClick}
                className="flex items-center gap-3 hover:bg-white/5 p-1 px-2 rounded-xl transition-all"
            >
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">ADMIN</p>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Forge Master</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-brand/20 border border-brand/50 flex items-center justify-center">
                    <UserIcon size={20} className="text-brand" />
                </div>
            </button>
        </div>
    </header>
  );
};
