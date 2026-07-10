import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Notification } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  MailOpen,
  Search, 
  Inbox, 
  Bell, 
  Calendar, 
  User, 
  Check, 
  CheckCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface NotificationsViewProps {
  user: UserProfile;
}

export default function NotificationsView({ user }: NotificationsViewProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [readIds, setReadIds] = useState<string[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

  // Load read notification IDs from local storage on mount
  useEffect(() => {
    if (user?.uid) {
      const stored = localStorage.getItem(`read_notifications_${user.uid}`);
      if (stored) {
        try {
          setReadIds(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse read notification IDs', e);
        }
      }
    }
  }, [user?.uid]);

  // Persist read notification IDs when they change
  const saveReadIds = (newIds: string[]) => {
    setReadIds(newIds);
    if (user?.uid) {
      localStorage.setItem(`read_notifications_${user.uid}`, JSON.stringify(newIds));
    }
  };

  // Subscribe to live announcements
  useEffect(() => {
    // Standard limit is 50 recent announcements
    const q = query(
      collection(db, 'notifications'), 
      orderBy('createdAt', 'desc'), 
      limit(50)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      
      // Filter incoming updates at client side matching the user's scope:
      // - Target: 'all'
      // - Target: 'pharmacies' if standard pharmacy/staff or user has pharmacy prefix/role
      // - Target: 'importers' if Wholesale Pharmacy or its staff
      // - Target: 'specific' where user.uid is in targetUids
      // - Target: 'region' where country fits targetRegion
      const userFiltered = list.filter(notif => {
        if (!notif.target || notif.target === 'all') return true;
        
        if (notif.target === 'pharmacies') {
          return user.role === 'pharmacy' || user.role === 'staff';
        }
        
        if (notif.target === 'importers') {
          return user.role === 'importer';
        }
        
        if (notif.target === 'specific' && notif.targetUids) {
          return notif.targetUids.includes(user.uid);
        }

        if (notif.target === 'region' && notif.targetRegion) {
          return notif.targetRegion.toLowerCase() === user.country?.toLowerCase();
        }

        return false;
      });

      setNotifications(userFiltered);
      setLoading(false);
    }, (error) => {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load announcements');
      setLoading(false);
    });

    return unsub;
  }, [user]);

  // Handle Mark as Read
  const handleMarkAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      saveReadIds(updated);
    }
  };

  // Handle Mark All as Read
  const handleMarkAllAsRead = () => {
    const unreadFiltered = notifications.filter(n => !readIds.includes(n.id));
    if (unreadFiltered.length === 0) {
      toast.success('All announcements are already marked as read');
      return;
    }
    const updated = [...readIds, ...unreadFiltered.map(n => n.id)];
    saveReadIds(updated);
    toast.success('All announcements marked as read');
  };

  // Filter and search notifications
  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch = 
      notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchQuery.toLowerCase());

    const isRead = readIds.includes(notif.id);

    if (!matchesSearch) return false;

    if (filter === 'unread') return !isRead;
    if (filter === 'read') return isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto" id="user-notifications-view">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/10 px-3 py-1.5 rounded-full">Ecosystem Center</span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-2">
            <Bell className="w-8 h-8 text-blue-600 animate-pulse" /> Announcements & Alerts
          </h1>
          <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
            Stay updated with administration notices, policy updates, and platform alerts
          </p>
        </div>

        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold rounded-2xl transition-all text-sm border border-blue-100/30 self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4" /> Mark all as read
          </button>
        )}
      </div>

      {/* Grid Filter & Feed layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left pane: Filters & Search */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 dark:bg-blue-400/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
            
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 relative">
              <span className="w-1.5 h-3 bg-blue-600 rounded-full"></span> Feed Controls
            </h3>

            {/* Search Input */}
            <div className="relative mb-5">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white transition-all"
              />
            </div>

            {/* Quick Filters */}
            <div className="space-y-2">
              <button 
                onClick={() => setFilter('all')}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all border ${filter === 'all' ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-md shadow-blue-600/10' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <span className="flex items-center gap-3">
                  <Inbox className="w-4 h-4" /> All updates
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${filter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  {notifications.length}
                </span>
              </button>

              <button 
                onClick={() => setFilter('unread')}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all border ${filter === 'unread' ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-md shadow-blue-600/10' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <span className="flex items-center gap-3">
                  <Mail className="w-4 h-4" /> Unread
                </span>
                {unreadCount > 0 ? (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-extrabold animate-bounce ${filter === 'unread' ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
                    {unreadCount}
                  </span>
                ) : (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${filter === 'unread' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                    0
                  </span>
                )}
              </button>

              <button 
                onClick={() => setFilter('read')}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all border ${filter === 'read' ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-md shadow-blue-600/10' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <span className="flex items-center gap-3">
                  <MailOpen className="w-4 h-4" /> Read
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${filter === 'read' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  {readIds.filter(id => notifications.some(n => n.id === id)).length}
                </span>
              </button>
            </div>
          </div>

          {/* Quick info panel */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-3xl text-xs text-slate-500 dark:text-slate-400 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Official CommunicationsOnly</p>
              These circulars and messages represent verified notifications from the Ministry, platform administrators, and official distribution chains. Please review updates regularly to ensure policy compliance.
            </div>
          </div>
        </div>

        {/* Right pane: Announcements Feed */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/85 dark:border-slate-800">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-sm text-slate-520 dark:text-slate-450 italic">Synchronizing notices...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/85 dark:border-slate-800 px-6">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/40 rounded-full flex items-center justify-center text-slate-350 dark:text-slate-550 mb-4 border border-slate-100 dark:border-slate-850">
                <Inbox className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">No announcements found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm">
                {searchQuery 
                  ? "We couldn't find any announcements matching your search keys." 
                  : "All quiet here. We'll post any system updates or official notifications right here."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notif) => {
                const isRead = readIds.includes(notif.id);
                const isSelected = selectedNotif?.id === notif.id;

                return (
                  <motion.div 
                    key={notif.id}
                    layoutId={`notif-card-${notif.id}`}
                    onClick={() => {
                      handleMarkAsRead(notif.id);
                      setSelectedNotif(notif);
                    }}
                    className={`p-6 rounded-3xl border transition-all cursor-pointer relative overflow-hidden group ${
                      isSelected 
                        ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-400/60 dark:border-blue-800/60 shadow-lg' 
                        : isRead 
                          ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750 hover:shadow-sm' 
                          : 'bg-white dark:bg-slate-900 border-blue-100 dark:border-blue-900/40 shadow-sm hover:shadow-md ring-1 ring-blue-500/10'
                    }`}
                  >
                    {/* Unread dot ribbon/bar */}
                    {!isRead && (
                      <div className="absolute top-0 bottom-0 left-0 w-1 bg-blue-600"></div>
                    )}

                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        {/* Title and Badge */}
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <h3 className={`font-black text-base transition-colors leading-tight ${isSelected ? 'text-blue-700 dark:text-blue-300' : isRead ? 'text-slate-800 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
                            {notif.title}
                          </h3>
                          {!isRead && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white animate-pulse">
                              New
                            </span>
                          )}
                        </div>

                        {/* Date and Sender */}
                        <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 font-bold">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> 
                            {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(notif.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1 normal-case font-medium">
                            <User className="w-3.5 h-3.5" /> Admin Portal
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform flex-shrink-0 self-center" />
                    </div>

                    {/* Excerpt */}
                    <p className={`text-sm leading-relaxed ${isSelected ? 'text-slate-700 dark:text-slate-300' : 'text-slate-600 dark:text-slate-400'} line-clamp-2`}>
                      {notif.message}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail Full View Overlay Modal */}
      <AnimatePresence>
        {selectedNotif && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative"
            >
              <div className="p-6 md:p-8">
                {/* Meta Row */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="inline-flex items-center px-3 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider rounded-lg">
                    Official Notice
                  </span>
                  
                  {/* Date */}
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                    <Calendar className="w-3.5 h-3.5" /> 
                    {new Date(selectedNotif.createdAt).toLocaleString()}
                  </div>
                </div>

                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight mb-4">
                  {selectedNotif.title}
                </h2>

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-4"></div>

                {/* Message Body */}
                <div className="text-slate-750 dark:text-slate-350 text-sm leading-relaxed whitespace-pre-wrap max-h-[350px] overflow-y-auto pr-2 scrollbar-hide py-2 font-medium">
                  {selectedNotif.message}
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-4"></div>

                {/* Sender/Signature */}
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-blue-100 dark:bg-blue-950/40 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                      A
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">A-TECH Admin Operations</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold mt-0.5">Verified Broadcast</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedNotif(null)}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-300 font-bold rounded-xl transition-all text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
