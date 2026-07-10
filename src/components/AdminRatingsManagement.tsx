import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Star, 
  Award, 
  TrendingDown, 
  TrendingUp, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  FileText, 
  User, 
  X,
  MessageSquare,
  ShieldCheck,
  Building2,
  ShoppingCart
} from 'lucide-react';

interface MetricResult {
  referralCount: number;
  orderCount: number;
  totalSalesVolume: number;
  totalCommissions: number;
}

interface SystemWorkEvaluation {
  score: number;
  rating: number;
  level: string;
  color: string;
  badgeBg: string;
  text: string;
}

export const calculateSystemWork = (metrics: MetricResult): SystemWorkEvaluation => {
  const referralPoints = Math.min(metrics.referralCount * 10, 40); // Max 40 pts (4 pharmacies)
  const orderPoints = Math.min(metrics.orderCount * 10, 40); // Max 40 pts (4 orders)
  const salesPoints = Math.min(Math.floor(metrics.totalSalesVolume / 100), 20); // Max 20 pts ($2000 volume)
  
  const score = referralPoints + orderPoints + salesPoints;
  
  if (score >= 80) {
    return {
      score,
      rating: 5,
      level: "Elite Effort",
      color: "text-violet-600 dark:text-violet-400",
      badgeBg: "bg-violet-50 dark:bg-violet-950/35 border-violet-100 dark:border-violet-900/30",
      text: `Outstanding effort! Work score of ${score}/100. Successfully referred ${metrics.referralCount} onboarded client signups and logged ${metrics.orderCount} sales orders totaling $${metrics.totalSalesVolume.toLocaleString()} in volume.`
    };
  } else if (score >= 55) {
    return {
      score,
      rating: 4,
      level: "High Effort",
      color: "text-emerald-600 dark:text-emerald-400",
      badgeBg: "bg-emerald-50 dark:bg-emerald-950/35 border-emerald-100 dark:border-emerald-900/30",
      text: `Strong performance. Work score of ${score}/100. Brought in ${metrics.referralCount} referred signups and generated ${metrics.orderCount} sales orders ($${metrics.totalSalesVolume.toLocaleString()}).`
    };
  } else if (score >= 30) {
    return {
      score,
      rating: 3,
      level: "Steady Effort",
      color: "text-blue-600 dark:text-blue-400",
      badgeBg: "bg-blue-50 dark:bg-blue-950/35 border-blue-100 dark:border-blue-900/30",
      text: `Active work status. Work score of ${score}/100. Maintained steady output with ${metrics.referralCount} signups and $${metrics.totalSalesVolume.toLocaleString()} in order volume.`
    };
  } else if (score > 0) {
    return {
      score,
      rating: 2,
      level: "Low Activity",
      color: "text-amber-600 dark:text-amber-400",
      badgeBg: "bg-amber-50 dark:bg-amber-950/35 border-amber-100 dark:border-amber-900/30",
      text: `Limited work activity. Work score of ${score}/100. Registered minimal signups/orders. Requires supportive outreach and pipeline development.`
    };
  } else {
    return {
      score,
      rating: 1,
      level: "No Activity",
      color: "text-slate-400 dark:text-slate-500",
      badgeBg: "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800",
      text: "Inactive. No client signups, orders, or referred sales have been registered under this agent's promo code."
    };
  }
};

export const AdminRatingsManagement: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  
  // Rating form state
  const [formRating, setFormRating] = useState<number>(5);
  const [formFeedback, setFormFeedback] = useState<string>('');
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'referrals' | 'sales' | 'name'>('rating');

  useEffect(() => {
    // 1. Fetch marketing representatives
    const qMembers = query(collection(db, 'users'), where('role', '==', 'marketing'));
    const unsubMembers = onSnapshot(qMembers, 
      (s) => {
        setMembers(s.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching representatives:", error);
        toast.error("Failed to load representatives list.");
      }
    );

    // 2. Fetch all users to compute live referrals
    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, 
      (s) => setAllUsers(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      (error) => console.error("Error fetching referrals:", error)
    );

    // 3. Fetch all orders to compute sales volume
    const qOrders = query(collection(db, 'orders'));
    const unsubOrders = onSnapshot(qOrders, 
      (s) => setAllOrders(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      (error) => console.error("Error fetching orders:", error)
    );

    return () => {
      unsubMembers();
      unsubUsers();
      unsubOrders();
    };
  }, []);

  // Synchronize form when selected representative changes
  useEffect(() => {
    if (selectedMember) {
      setFormRating(selectedMember.adminRating || 5);
      setFormFeedback(selectedMember.adminFeedback || '');
    } else {
      setFormRating(5);
      setFormFeedback('');
    }
  }, [selectedMember]);

  const getMetrics = (memberId: string): MetricResult => {
    const referrals = allUsers.filter(u => u.marketingId === memberId);
    const orders = allOrders.filter(o => o.marketingId === memberId);
    const totalSalesVolume = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalCommissions = orders.reduce((sum, o) => sum + (o.commissionAmount || 0), 0);
    return {
      referralCount: referrals.length,
      orderCount: orders.length,
      totalSalesVolume,
      totalCommissions
    };
  };

  const handleSaveRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    
    setIsSubmitting(true);
    const toastId = toast.loading(`Saving evaluation for ${selectedMember.displayName}...`);
    
    try {
      await updateDoc(doc(db, 'users', selectedMember.id), {
        adminRating: formRating,
        adminFeedback: formFeedback,
        ratingUpdatedAt: Date.now()
      });
      
      toast.success(`Performance rating updated for ${selectedMember.displayName}!`, { id: toastId });
      setSelectedMember(null);
    } catch (error: any) {
      toast.error(`Failed to update rating: ${error.message}`, { id: toastId });
      console.error("Error saving representative rating:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute composite statistics
  const ratedMembers = members.filter(m => m.adminRating !== undefined && m.adminRating > 0);
  const avgRating = ratedMembers.length > 0
    ? (ratedMembers.reduce((sum, m) => sum + m.adminRating, 0) / ratedMembers.length).toFixed(1)
    : 'N/A';

  // Construct members with metrics for dynamic leaderboards
  const membersWithMetrics = members.map(member => {
    const metrics = getMetrics(member.id);
    return {
      ...member,
      metrics
    };
  });

  // Top Representative based on rating + sales volume composite score
  const getTopPerformer = () => {
    if (membersWithMetrics.length === 0) return null;
    return [...membersWithMetrics].sort((a, b) => {
      const scoreA = ((a.adminRating || 0) * 10) + (a.metrics.referralCount * 5) + (a.metrics.orderCount * 2);
      const scoreB = ((b.adminRating || 0) * 10) + (b.metrics.referralCount * 5) + (b.metrics.orderCount * 2);
      return scoreB - scoreA;
    })[0];
  };

  // Bottom Representative/Needs evaluation based on low composite score or low rating
  const getBottomPerformer = () => {
    if (membersWithMetrics.length === 0) return null;
    return [...membersWithMetrics].sort((a, b) => {
      const scoreA = ((a.adminRating || 0) * 10) + (a.metrics.referralCount * 5) + (a.metrics.orderCount * 2);
      const scoreB = ((b.adminRating || 0) * 10) + (b.metrics.referralCount * 5) + (b.metrics.orderCount * 2);
      return scoreA - scoreB;
    })[0];
  };

  const topRep = getTopPerformer();
  const bottomRep = getBottomPerformer();

  // Search and Sort logic
  const filteredMembers = membersWithMetrics
    .filter(m => {
      const queryStr = searchQuery.toLowerCase();
      return (
        m.displayName?.toLowerCase().includes(queryStr) ||
        m.email?.toLowerCase().includes(queryStr) ||
        m.city?.toLowerCase().includes(queryStr) ||
        m.promoCode?.toLowerCase().includes(queryStr)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.adminRating || 0) - (a.adminRating || 0);
      }
      if (sortBy === 'referrals') {
        return b.metrics.referralCount - a.metrics.referralCount;
      }
      if (sortBy === 'sales') {
        return b.metrics.totalSalesVolume - a.metrics.totalSalesVolume;
      }
      return (a.displayName || '').localeCompare(b.displayName || '');
    });

  const renderStars = (rating: number, interactive = false, size = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const filled = interactive 
        ? (hoverRating !== null ? i <= hoverRating : i <= formRating)
        : i <= rating;

      stars.push(
        <Star
          key={i}
          size={size}
          className={`${
            filled 
              ? 'text-amber-500 fill-amber-500' 
              : 'text-slate-200 dark:text-slate-700'
          } ${interactive ? 'cursor-pointer hover:scale-120 transition-all' : ''}`}
          onClick={() => interactive && setFormRating(i)}
          onMouseEnter={() => interactive && setHoverRating(i)}
          onMouseLeave={() => interactive && setHoverRating(null)}
        />
      );
    }
    return <div className="flex gap-1 items-center">{stars}</div>;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Representative Ledger</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-sans tracking-tight">
          Sales & Marketing Performance Evaluations
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Audit signups, track referred product sales volume, and assign administrative star ratings with performance feedback to know your top agents and those requiring assistance.
        </p>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Reps */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Users size={120} />
          </div>
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4 border border-blue-100/40 dark:border-blue-900/30">
            <Users size={22} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Representatives</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{members.length}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Ecosystem agents contract</p>
        </div>

        {/* Avg Rating */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Star size={120} />
          </div>
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-4 border border-amber-100/40 dark:border-amber-900/30">
            <Star size={22} className="fill-amber-500" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Average Representative Rating</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
            {avgRating} <span className="text-xs text-slate-400 dark:text-slate-500">/ 5.0</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">{ratedMembers.length} evaluations submitted</p>
        </div>

        {/* Top Performer */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Award size={120} />
          </div>
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100/40 dark:border-emerald-900/30">
            <Award size={22} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Top Performer</p>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1.5 truncate">
            {topRep ? topRep.displayName : 'No Agents'}
          </h3>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
            <TrendingUp size={12} />
            {topRep ? `${topRep.metrics.referralCount} signups • ${topRep.metrics.orderCount} sales` : 'N/A'}
          </p>
        </div>

        {/* Needs Evaluation / Lowest Rating */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <TrendingDown size={120} />
          </div>
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mb-4 border border-rose-100/40 dark:border-rose-900/30">
            <TrendingDown size={22} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Lowest Evaluated / Needs Support</p>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1.5 truncate">
            {bottomRep ? bottomRep.displayName : 'No Agents'}
          </h3>
          <p className="text-[11px] text-rose-500 dark:text-rose-400 font-bold mt-1.5 flex items-center gap-1">
            <TrendingDown size={12} />
            Rating: {bottomRep?.adminRating ? `${bottomRep.adminRating} / 5` : 'Unevaluated'}
          </p>
        </div>

      </div>

      {/* Main Grid: List vs Evaluation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Representative Leaderboard (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search agent, code, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Sort Actions */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1 mr-1">
                <Filter size={12} /> Sort By:
              </span>
              
              <button
                onClick={() => setSortBy('rating')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  sortBy === 'rating'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                Rating
              </button>

              <button
                onClick={() => setSortBy('referrals')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  sortBy === 'referrals'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                Signups
              </button>

              <button
                onClick={() => setSortBy('sales')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  sortBy === 'sales'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                Sales Volume
              </button>

              <button
                onClick={() => setSortBy('name')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  sortBy === 'name'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                Name
              </button>
            </div>

          </div>

          {/* Representatives List Grid */}
          {filteredMembers.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
              <Users className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={40} />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Representatives Found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Try adjusting your search filters or make sure your agents are onboarded properly in the system.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMembers.map((member) => (
                <div 
                  key={member.id}
                  className={`bg-white dark:bg-slate-900 rounded-3xl border p-6 transition-all relative flex flex-col justify-between ${
                    selectedMember?.id === member.id
                      ? 'border-blue-500 shadow-md ring-2 ring-blue-500/10'
                      : 'border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-extrabold text-lg flex items-center justify-center border border-blue-100/30 dark:border-blue-900/20 shrink-0">
                          {member.displayName ? member.displayName.charAt(0).toUpperCase() : 'M'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug truncate">{member.displayName}</h4>
                          <p className="text-slate-400 text-[10.5px] truncate">{member.email}</p>
                        </div>
                      </div>
                      
                      {/* Rating Badges */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {member.adminRating ? (
                          <div className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100/40 dark:border-amber-900/30 text-[10px] font-black text-amber-600 dark:text-amber-400 flex items-center gap-1 font-mono" title="Super Admin Manual Rating">
                            <Star size={11} className="fill-amber-500 text-amber-500" />
                            Admin: {member.adminRating.toFixed(1)}
                          </div>
                        ) : (
                          <div className="px-2 py-1 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 text-[9px] font-black text-slate-400 uppercase tracking-tight">
                            No Admin Rating
                          </div>
                        )}
                        
                        {/* System Computed Work Rating */}
                        {(() => {
                          const sysWork = calculateSystemWork(member.metrics);
                          return (
                            <div className={`px-2.5 py-1 rounded-xl border text-[10px] font-black flex items-center gap-1 font-mono ${sysWork.badgeBg}`} title={`System Performance Work Score: ${sysWork.score}/100`}>
                              <Award size={11} className={sysWork.color} />
                              Work: {sysWork.rating}.0
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Quick Metadata Info */}
                    <div className="grid grid-cols-2 gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-slate-400" />
                        <span className="truncate">{member.city || 'N/A'}, {member.country || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-400" />
                        <span className="truncate">{member.shift || 'Flexible Shift'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <span className="font-bold uppercase tracking-wider text-[8.5px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-lg border border-blue-100/30 dark:border-blue-900/30">
                          PROMO: {member.promoCode || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Live Metrics Row */}
                    <div className="grid grid-cols-3 gap-2 text-center mb-4">
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850">
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Signups</p>
                        <h5 className="text-sm font-black text-slate-800 dark:text-white mt-0.5">{member.metrics.referralCount}</h5>
                      </div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850">
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Orders</p>
                        <h5 className="text-sm font-black text-slate-800 dark:text-white mt-0.5">{member.metrics.orderCount}</h5>
                      </div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850">
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Sales Vol</p>
                        <h5 className="text-sm font-black text-slate-800 dark:text-white mt-0.5 truncate">
                          {member.metrics.totalSalesVolume >= 1000 
                            ? `${(member.metrics.totalSalesVolume / 1000).toFixed(1)}k`
                            : member.metrics.totalSalesVolume}
                        </h5>
                      </div>
                    </div>

                    {/* Admin Feedback Preview */}
                    {member.adminFeedback && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 mb-4 text-left">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          <MessageSquare size={10} /> Performance Feedback
                        </div>
                        <p className="text-slate-600 dark:text-slate-350 text-[11px] leading-relaxed italic line-clamp-2">
                          "{member.adminFeedback}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Action */}
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setSelectedMember(member)}
                      className="w-full py-2.5 bg-blue-50 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 text-blue-650 dark:text-slate-200 hover:text-white text-xs font-bold rounded-2xl transition-all border border-blue-100/30 dark:border-slate-700 hover:border-transparent flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow"
                    >
                      <Star size={13} />
                      Evaluate & Rate Representative
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>

        {/* Right Side: Interactive Performance Review Panel (1 Column) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm relative sticky top-8">
            
            <AnimatePresence mode="wait">
              {!selectedMember ? (
                <motion.div
                  key="empty-panel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 text-slate-300 dark:text-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-850">
                    <Star size={30} />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-white">Awaiting Representative Selection</h4>
                  <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
                    Select any sales and marketing representative from the leaderboard on the left to write reviews, adjust grading, or log performance ratings in the database.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="rating-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Selected Header */}
                  <div className="flex justify-between items-start gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/60">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-lg border border-blue-100/30 dark:border-blue-900/30">
                        Selected Agent
                      </span>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2 leading-snug">
                        {selectedMember.displayName}
                      </h3>
                      <p className="text-slate-400 text-xs mt-0.5">{selectedMember.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedMember(null)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                      title="Clear Selection"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Representative Micro Metrics */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Signups</p>
                      <p className="text-base font-extrabold text-slate-800 dark:text-white mt-1">
                        {selectedMember.metrics.referralCount} pharmacies
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Promo Code</p>
                      <p className="text-base font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                        {selectedMember.promoCode || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* System recommendation report card */}
                  {(() => {
                    const sysEval = calculateSystemWork(selectedMember.metrics);
                    return (
                      <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                            <Award size={14} className="text-blue-500" />
                            <span>System Work Rating Engine</span>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider ${sysEval.badgeBg} ${sysEval.color}`}>
                            {sysEval.level}
                          </span>
                        </div>

                        {/* Progress Bar showing activity score out of 100 */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                            <span>Activity Score</span>
                            <span>{sysEval.score} / 100 Points</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                sysEval.score >= 80 ? 'bg-violet-500' :
                                sysEval.score >= 55 ? 'bg-emerald-500' :
                                sysEval.score >= 30 ? 'bg-blue-500' :
                                sysEval.score > 0 ? 'bg-amber-500' : 'bg-slate-400'
                              }`}
                              style={{ width: `${sysEval.score}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Calculated Star Rating Row */}
                        <div className="flex items-center justify-between text-xs py-1 border-t border-b border-slate-200/50 dark:border-slate-800/50">
                          <span className="text-slate-500 font-medium">Computed Work Rating:</span>
                          <div className="flex items-center gap-2">
                            {renderStars(sysEval.rating, false, 14)}
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">({sysEval.rating}.0/5)</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
                          "{sysEval.text}"
                        </p>

                        {/* Adopt Recommendation Quick Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setFormRating(sysEval.rating);
                            setFormFeedback(sysEval.text);
                            toast.success("Adopted system performance evaluation rating & notes!");
                          }}
                          className="w-full py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          Adopt System Work Assessment
                        </button>
                      </div>
                    );
                  })()}

                  {/* Interactive Evaluation Form */}
                  <form onSubmit={handleSaveRating} className="space-y-6">
                    
                    {/* Star Rating Picker */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        Overall Performance Star Rating
                      </label>
                      <div className="flex gap-2 items-center p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850">
                        {renderStars(formRating, true, 26)}
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-2 font-mono">
                          ({formRating} / 5)
                        </span>
                      </div>
                    </div>

                    {/* Feedback textarea */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                          Performance Review & Notes
                        </label>
                        <span className="text-[10px] text-slate-400">
                          {formFeedback.length} / 500 chars
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        maxLength={500}
                        value={formFeedback}
                        onChange={(e) => setFormFeedback(e.target.value)}
                        placeholder="Provide detailed feedback on this agent's performance, strengths, or support requirements. This will be stored for audit logs..."
                        className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedMember(null)}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs transition-all cursor-pointer text-center"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-100 dark:shadow-none flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <ShieldCheck size={14} />
                            Save Evaluation
                          </>
                        )}
                      </button>
                    </div>

                  </form>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

      </div>

    </div>
  );
};
