import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  updateDoc, 
  doc, 
  deleteDoc, 
  getDocs,
  query,
  where,
  setDoc
} from 'firebase/firestore';
import { Advertisement, PRESET_IMAGES, PRESET_VIDEOS } from './WholesaleAdsPortal';
import { 
  CheckCircle, 
  XCircle, 
  Pause, 
  Play, 
  Trash2, 
  Edit, 
  AlertTriangle, 
  DollarSign, 
  BarChart2, 
  MousePointer, 
  Eye, 
  Filter, 
  Calendar, 
  Tag, 
  FolderMinus, 
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Clock,
  Briefcase,
  Info,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface PaymentAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNo: string;
  type: string;
}

export const AdminAdsCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pricing'>('dashboard');
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Dynamic pricing configs (no hardcoded defaults)
  const [pricing, setPricing] = useState<{
    featuredProductFee: number;
    slideshowBannerFee: number;
    campaignDuration: number;
    priority1Fee: number; // High
    priority2Fee: number; // Medium
    priority3Fee: number; // Low
  }>({
    featuredProductFee: 150,
    slideshowBannerFee: 350,
    campaignDuration: 14,
    priority1Fee: 250,
    priority2Fee: 180,
    priority3Fee: 120,
  });

  // Dynamic pricing form states
  const [formFeatured, setFormFeatured] = useState('150');
  const [formBanner, setFormBanner] = useState('350');
  const [formDuration, setFormDuration] = useState('14');
  const [formPriority1, setFormPriority1] = useState('250');
  const [formPriority2, setFormPriority2] = useState('180');
  const [formPriority3, setFormPriority3] = useState('120');
  const [formBankName, setFormBankName] = useState('Commercial Bank of Ethiopia (CBE)');
  const [formAccountName, setFormAccountName] = useState('EthioPharma Wholesale PLC');
  const [formAccountNo, setFormAccountNo] = useState('1000192837349');
  
  // Multiple payment accounts states
  const [formAccounts, setFormAccounts] = useState<PaymentAccount[]>([
    {
      id: '1',
      bankName: 'Commercial Bank of Ethiopia (CBE)',
      accountName: 'EthioPharma Wholesale PLC',
      accountNo: '1000192837349',
      type: 'Bank'
    }
  ]);
  const [newBankName, setNewBankName] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountNo, setNewAccountNo] = useState('');
  const [newAccountType, setNewAccountType] = useState('Bank');

  const [isSavingPricing, setIsSavingPricing] = useState(false);
  
  // Modal states for editing
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [selectedReviewAd, setSelectedReviewAd] = useState<Advertisement | null>(null);
  const [editPromotionType, setEditPromotionType] = useState('');
  const [rejectionAd, setRejectionAd] = useState<Advertisement | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Lightbox state for zoomable screenshot view
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxScale, setLightboxScale] = useState(1);
  const [lightboxRotation, setLightboxRotation] = useState(0);

  // Fields for editing ad parameters
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editPriority, setEditPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [editHeadline, setEditHeadline] = useState('');
  const [editPromoText, setEditPromoText] = useState('');

  useEffect(() => {
    const q = collection(db, 'advertisements');
    const unsub = onSnapshot(q, (snap) => {
      const list: Advertisement[] = [];
      snap.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as Advertisement);
      });
      // Sort: Pending Approval first, then Active, then others, newer creation date first
      list.sort((a, b) => {
        if (a.status === 'Pending Approval' && b.status !== 'Pending Approval') return -1;
        if (a.status !== 'Pending Approval' && b.status === 'Pending Approval') return 1;
        return b.createdAt - a.createdAt;
      });
      setAds(list);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching advertisements for admin: ", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Fetch dynamic system_settings/advertising_pricing configurations
  useEffect(() => {
    const unsubPricing = onSnapshot(doc(db, 'system_settings', 'advertising_pricing'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const loadedFeatured = Number(data.featuredProductFee ?? 150);
        const loadedBanner = Number(data.slideshowBannerFee ?? 350);
        const loadedDuration = Number(data.campaignDuration ?? 14);
        const loadedP1 = Number(data.priority1Fee ?? 250);
        const loadedP2 = Number(data.priority2Fee ?? 180);
        const loadedP3 = Number(data.priority3Fee ?? 120);

        setPricing({
          featuredProductFee: loadedFeatured,
          slideshowBannerFee: loadedBanner,
          campaignDuration: loadedDuration,
          priority1Fee: loadedP1,
          priority2Fee: loadedP2,
          priority3Fee: loadedP3,
        });

        // Initialize edit form states
        setFormFeatured(loadedFeatured.toString());
        setFormBanner(loadedBanner.toString());
        setFormDuration(loadedDuration.toString());
        setFormPriority1(loadedP1.toString());
        setFormPriority2(loadedP2.toString());
        setFormPriority3(loadedP3.toString());
        setFormBankName(data.bankName || 'Commercial Bank of Ethiopia (CBE)');
        setFormAccountName(data.accountName || 'EthioPharma Wholesale PLC');
        setFormAccountNo(data.accountNo || '1000192837349');

        const loadedAccounts = data.paymentAccounts || [
          {
            id: '1',
            bankName: data.bankName || 'Commercial Bank of Ethiopia (CBE)',
            accountName: data.accountName || 'EthioPharma Wholesale PLC',
            accountNo: data.accountNo || '1000192837349',
            type: 'Bank'
          }
        ];
        setFormAccounts(loadedAccounts);
      }
    }, (err) => {
      console.error("Could not read advertising_pricing Settings doc:", err);
    });
    return () => unsubPricing();
  }, []);

  const handleApprove = async (adId: string) => {
    try {
      await updateDoc(doc(db, 'advertisements', adId), {
        status: 'Active', // Set to Active on approval so it goes live instantly
        rejectionReason: null,
        updatedAt: Date.now()
      });
      toast.success("Campaign Approved and Launched Live!");
    } catch (err: any) {
      toast.error("Approval error: " + err.message);
    }
  };

  const handleOpenReject = (ad: Advertisement) => {
    setRejectionAd(ad);
    setRejectionReason('');
  };

  const handleReject = async () => {
    if (!rejectionAd || !rejectionAd.id) return;
    if (!rejectionReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }

    try {
      await updateDoc(doc(db, 'advertisements', rejectionAd.id), {
        status: 'Rejected',
        rejectionReason: rejectionReason.trim(),
        updatedAt: Date.now()
      });
      toast.success("Campaign rejected and returned to Draft status.");
      setRejectionAd(null);
    } catch (err: any) {
      toast.error("Rejection error: " + err.message);
    }
  };

  const handleToggleState = async (ad: Advertisement) => {
    if (!ad.id) return;
    try {
      const newStatus = ad.status === 'Active' ? 'Paused' : 'Active';
      await updateDoc(doc(db, 'advertisements', ad.id), {
        status: newStatus,
        updatedAt: Date.now()
      });
      toast.success(`Campaign successfully changed to ${newStatus}`);
    } catch (err: any) {
      toast.error("Status toggle error: " + err.message);
    }
  };

  const handleOpenEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setEditStartDate(ad.startDate);
    setEditEndDate(ad.endDate);
    setEditPriority(ad.priorityLevel);
    setEditHeadline(ad.headline);
    setEditPromoText(ad.promotionalText);
    setEditPromotionType(ad.promotionType || '');
  };

  const handleSaveEdit = async () => {
    if (!editingAd || !editingAd.id) return;
    try {
      await updateDoc(doc(db, 'advertisements', editingAd.id), {
        startDate: editStartDate,
        endDate: editEndDate,
        priorityLevel: editPriority,
        headline: editHeadline,
        promotionalText: editPromoText,
        promotionType: editPromotionType,
        updatedAt: Date.now()
      });
      toast.success("Campaign parameters updated successfully!");
      setEditingAd(null);
    } catch (err: any) {
      toast.error("Save error: " + err.message);
    }
  };

  const handleDelete = async (adId: string) => {
    if (!window.confirm("Permanently erase this advertisement document?")) return;
    try {
      await deleteDoc(doc(db, 'advertisements', adId));
      toast.success("Campaign deleted");
    } catch (err: any) {
      toast.error("Deletion error: " + err.message);
    }
  };

  // Stats calculation
  const totalAdvertised = ads.length;
  const activeAds = ads.filter(a => a.status === 'Active').length;
  const pendingApproval = ads.filter(a => a.status === 'Pending Approval').length;
  const totalImpressions = ads.reduce((sum, a) => sum + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((sum, a) => sum + (a.clicks || 0), 0);
  const totalRevenuePotential = ads.reduce((sum, a) => sum + (a.revenueEst || 0), 0);

  // Filters application
  const filteredAds = ads.filter(ad => {
    const matchStat = filterStatus === 'all' || ad.status === filterStatus;
    const matchType = filterType === 'all' || ad.type === filterType;
    return matchStat && matchType;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8" id="admin_ads_center_root">
      {/* Header section with branding details and total metric stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-rose-500">Global Control Room</span>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">Advertisement Center</h1>
          <p className="text-sm text-slate-500 mt-1">Approve partner campaigns, monitor CTR metrics, and set premium sponsorship priorities globally.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'dashboard' ? 'bg-rose-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'}`}
          >
            Active Campaigns
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'pricing' ? 'bg-rose-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'}`}
          >
            Configure Pricing
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-slate-500 text-sm">Synchronizing advertisements across network...</p>
        </div>
      ) : activeTab === 'pricing' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">ATech Pricing & Billing Configurations</h2>
            <p className="text-xs text-slate-500">Formulate and adjust advertising rates for partner Wholesale Pharmacies globally. Changes affect cost estimates in real-time.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Inputs block */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Featured Product Base Fee (ETB / Day)</label>
                <input
                  type="number"
                  value={formFeatured}
                  onChange={(e) => setFormFeatured(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-rose-505 bg-slate-50 dark:bg-slate-900 dark:text-white text-sm font-mono"
                />
                <span className="text-[10px] text-slate-400">Daily rate applied to sponsored marketplace catalog items.</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Slideshow Banner Base Fee (ETB / Day)</label>
                <input
                  type="number"
                  value={formBanner}
                  onChange={(e) => setFormBanner(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-rose-505 bg-slate-50 dark:bg-slate-900 dark:text-white text-sm font-mono"
                />
                <span className="text-[10px] text-slate-400">Daily rate applied to top dashboard rotational banners.</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Default Campaign Duration (Days)</label>
                <input
                  type="number"
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-rose-505 bg-slate-50 dark:bg-slate-900 dark:text-white text-sm font-mono"
                />
                <span className="text-[10px] text-slate-400">Suggested or minimum duration requested for newly drafted packages.</span>
              </div>
            </div>

            {/* Priority block */}
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-850">
                <h3 className="text-xs font-black uppercase tracking-wider text-rose-500 mb-3">Priority Surcharges (ETB / Day)</h3>
                <p className="text-[11px] text-slate-400 mb-4">Set additional daily rates for high-stakes campaign options to order prioritized listing display.</p>

                <div className="space-y-3 font-sans">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">Priority 1 (High - Premium Visibility)</label>
                    <input
                      type="number"
                      value={formPriority1}
                      onChange={(e) => setFormPriority1(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:text-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">Priority 2 (Medium - Moderate Visibility)</label>
                    <input
                      type="number"
                      value={formPriority2}
                      onChange={(e) => setFormPriority2(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:text-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">Priority 3 (Standard - Regular Visibility)</label>
                    <input
                      type="number"
                      value={formPriority3}
                      onChange={(e) => setFormPriority3(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:text-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Payment Collection Account Details (Synchronized globally) */}
          <div className="bg-amber-50/10 dark:bg-amber-955/5 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/10 space-y-6 text-left">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-600">Campaign Invoice Payment Destinations</h3>
              <p className="text-xs text-slate-400">Configure multiple payment accounts (e.g. Commercial Bank of Ethiopia, telebirr, CBE Birr) that Wholesale Importers will see during ad checkout.</p>
            </div>

            {/* List of Active Accounts */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">Active Payment Accounts</label>
              {formAccounts.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-2">No payment accounts configured yet. Please add at least one bank or mobile money wallet below.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formAccounts.map((account, index) => (
                    <div key={account.id || index} className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl relative group font-sans">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formAccounts.filter((_, i) => i !== index);
                          setFormAccounts(updated);
                          toast.success("Account removed locally. Save settings to apply.");
                        }}
                        className="absolute top-2 right-2 text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer"
                        title="Remove Account"
                      >
                        <Trash2 size={14} />
                      </button>

                      <div className="grid grid-cols-1 gap-2.5 mt-2">
                        <div className="flex gap-2">
                          <span className="text-[10px] font-black uppercase text-amber-600 border border-amber-150 rounded px-1.5 py-0.5 bg-amber-50/20">
                            {account.type || 'Bank'}
                          </span>
                        </div>

                        <div>
                          <label className="text-[9.5px] font-bold text-slate-400 uppercase">Bank / Platform Name</label>
                          <input
                            type="text"
                            value={account.bankName}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = [...formAccounts];
                              updated[index] = { ...updated[index], bankName: val };
                              setFormAccounts(updated);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 outline-none focus:border-amber-500 bg-transparent text-xs font-semibold"
                            placeholder="e.g. Commercial Bank of Ethiopia (CBE)"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9.5px] font-bold text-slate-400 uppercase">Account Holder</label>
                            <input
                              type="text"
                              value={account.accountName}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = [...formAccounts];
                                updated[index] = { ...updated[index], accountName: val };
                                setFormAccounts(updated);
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 outline-none focus:border-amber-500 bg-transparent text-xs font-semibold"
                              placeholder="Holder Name"
                            />
                          </div>

                          <div>
                            <label className="text-[9.5px] font-bold text-slate-400 uppercase">Account / Mobile No.</label>
                            <input
                              type="text"
                              value={account.accountNo}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = [...formAccounts];
                                updated[index] = { ...updated[index], accountNo: val };
                                setFormAccounts(updated);
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 outline-none focus:border-amber-500 bg-transparent text-xs font-mono font-semibold"
                              placeholder="Account or Phone No."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Account Form Row */}
            <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
              <span className="text-[11px] font-black text-amber-600 uppercase tracking-wider block font-sans">✨ Add Payment Destination (e.g. telebirr, CBE, Awash)</span>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-sans">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Account Type</label>
                  <select
                    value={newAccountType}
                    onChange={(e) => setNewAccountType(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 outline-none bg-white dark:bg-slate-950 text-xs font-semibold"
                  >
                    <option value="Bank">Bank Account</option>
                    <option value="telebirr">telebirr</option>
                    <option value="CBE Birr">CBE Birr</option>
                    <option value="Mobile Money">Mobile Money (Other)</option>
                    <option value="Other">Other Wallet</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Bank / Service Name</label>
                  <input
                    type="text"
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-amber-500 bg-white dark:bg-slate-950 text-xs font-semibold"
                    placeholder="e.g. telebirr, CBE, Awash Bank"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-amber-500 bg-white dark:bg-slate-950 text-xs font-semibold"
                    placeholder="e.g. EthioPharma Wholesale PLC"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Account / Phone Number</label>
                  <input
                    type="text"
                    value={newAccountNo}
                    onChange={(e) => setNewAccountNo(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-amber-500 bg-white dark:bg-slate-950 text-xs font-mono font-semibold"
                    placeholder="e.g. 0912345678 or 1000192837349"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!newBankName.trim() || !newAccountName.trim() || !newAccountNo.trim()) {
                      toast.error("Please fill in all details for the new account.");
                      return;
                    }
                    const newAccountObj = {
                      id: Date.now().toString(),
                      bankName: newBankName.trim(),
                      accountName: newAccountName.trim(),
                      accountNo: newAccountNo.trim(),
                      type: newAccountType
                    };
                    setFormAccounts([...formAccounts, newAccountObj]);
                    setNewBankName('');
                    setNewAccountName('');
                    setNewAccountNo('');
                    toast.success(`${newBankName} added to the list! Save settings to synchronize.`);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer select-none transition-all flex items-center gap-1.5 font-sans"
                >
                  ➕ Add Account
                </button>
              </div>
            </div>
          </div>

          {/* Formula & Live Preview Simulation */}
          <div className="p-4 bg-rose-50/50 dark:bg-rose-955/10 rounded-2xl border border-rose-100 dark:border-rose-900/10 flex items-start gap-3">
            <Info size={16} className="text-rose-550 mt-0.5 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-rose-800 dark:text-rose-400">Total Campaign Cost Formula:</span>
              <code className="block mt-1 p-2 bg-white dark:bg-slate-950 rounded border dark:border-slate-800 font-mono text-[11px]">
                Cost = (Type Base Rate + Priority Daily Surcharge) * Duration in Days
              </code>
              <p className="text-slate-400 mt-1.5 font-sans">
                With your active numbers: A <b>{formDuration}-day</b> Sponsored product at High priority costs: <span className="font-bold text-emerald-600 font-mono">{( (Number(formFeatured) + Number(formPriority1)) * Number(formDuration) ).toLocaleString()} ETB</span>, while a Banner costs: <span className="font-bold text-indigo-500 font-mono">{( (Number(formBanner) + Number(formPriority1)) * Number(formDuration) ).toLocaleString()} ETB</span>.
              </p>
            </div>
          </div>

          {/* Sync Actions */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex justify-end">
            <button
              type="button"
              disabled={isSavingPricing}
              onClick={async () => {
                setIsSavingPricing(true);
                try {
                  const updatedPricing = {
                    featuredProductFee: Number(formFeatured),
                    slideshowBannerFee: Number(formBanner),
                    campaignDuration: Number(formDuration),
                    priority1Fee: Number(formPriority1),
                    priority2Fee: Number(formPriority2),
                    priority3Fee: Number(formPriority3),
                    bankName: formAccounts[0]?.bankName || formBankName,
                    accountName: formAccounts[0]?.accountName || formAccountName,
                    accountNo: formAccounts[0]?.accountNo || formAccountNo,
                    paymentAccounts: formAccounts,
                  };
                  await setDoc(doc(db, 'system_settings', 'advertising_pricing'), {
                     ...updatedPricing,
                     updatedAt: Date.now()
                  });
                  toast.success("Advertising pricing settings synchronized successfully.");
                } catch (e: any) {
                  toast.error("Failed to update pricing rules: " + e.message);
                } finally {
                  setIsSavingPricing(false);
                }
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-6 py-3 rounded-xl transition-all shadow-lg cursor-pointer font-sans"
            >
              {isSavingPricing ? "Configuring Database..." : "Save Pricing Settings"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Global Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pending Review</p>
                <h3 className={`text-3xl font-black mt-1 ${pendingApproval > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-900 dark:text-white'}`}>{pendingApproval}</h3>
                <span className="text-[10px] text-slate-400 font-bold">Needs approval</span>
              </div>
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center">
                <Clock size={24} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Live Ads</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{activeAds}</h3>
                <span className="text-[10px] text-slate-400 font-bold">Currently showing</span>
              </div>
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center">
                <Play size={24} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Impressions</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">{totalImpressions.toLocaleString()}</h3>
                <span className="text-[10px] text-slate-400 font-bold">Ad impressions logged</span>
              </div>
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                <Eye size={24} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Clickthroughs</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{totalClicks.toLocaleString()}</h3>
                <span className="text-[10px] text-slate-400 font-bold">Avg. CTR: {totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0'}%</span>
              </div>
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center">
                <MousePointer size={24} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Revenue Potential</p>
                <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1.5">{totalRevenuePotential.toLocaleString()} ETB</h3>
                <span className="text-[10px] text-emerald-500 font-bold">Total simulated potential</span>
              </div>
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center">
                <DollarSign size={24} />
              </div>
            </div>
          </div>

          {/* Filtering Header Options */}
          <div className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="text-slate-400" size={18} />
              <h3 className="text-sm font-bold text-slate-700 dark:text-white">Active Campaigns Filter</h3>
            </div>

            <div className="flex flex-wrap gap-4">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Status State</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 dark:text-white"
                >
                  <option value="all">-- All Statuses --</option>
                  <option value="Pending Approval">Pending Retail Review</option>
                  <option value="Active">Active Live</option>
                  <option value="Paused">Paused</option>
                  <option value="Approved">Approved</option>
                  <option value="Expired">Expired</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Creative Format</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 dark:text-white"
                >
                  <option value="all">-- All Ad Formats --</option>
                  <option value="sponsored">Sponsored Catalog Listing</option>
                  <option value="banner">Dashboard Banner Ad</option>
                </select>
              </div>
            </div>
          </div>

          {/* Campaigns Records list table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4">Ad Campaigns & Requests</h3>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10.5px] uppercase text-slate-400 font-black">
                    <th className="py-3 px-4">Wholesale Supplier</th>
                    <th className="py-3 px-4">Target Drug/Item</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4 text-center">Impressions / Clicks</th>
                    <th className="py-3 px-4">Est. Revenue</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                  {filteredAds.map((ad) => {
                    const ctrVal = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0';
                    return (
                      <tr key={ad.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                          <div>{ad.importerName}</div>
                          {ad.promotionType && (
                            <span className="inline-block mt-1 text-[9px] font-black uppercase bg-orange-100 dark:bg-orange-950/40 text-orange-850 dark:text-orange-400 border border-orange-200 dark:border-orange-900/20 px-2 py-0.5 rounded-full">
                              Type: {ad.promotionType}
                            </span>
                          )}
                          {ad.bannerSource === 'agency' && (
                            <span className="inline-block mt-1 ml-1 text-[9px] font-black uppercase bg-indigo-100 dark:bg-indigo-950/40 text-indigo-850 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/20 px-2 py-0.5 rounded-full">
                              🎨 design service: requested (+2.5k ETB)
                            </span>
                          )}
                          {ad.assetType === 'video' && (
                            <span className="inline-block mt-1 ml-1 text-[9px] font-black uppercase bg-violet-100 dark:bg-violet-950/40 text-violet-850 dark:text-violet-400 border border-violet-200 dark:border-violet-900/20 px-2 py-0.5 rounded-full">
                              🎥 Loop Video
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-bold text-blue-600 block">{ad.productName}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 line-clamp-1">"{ad.headline}"</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            ad.type === 'banner' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>{ad.type}</span>
                        </td>
                        <td className="py-4 px-4 font-black uppercase text-[10px] text-slate-400">{ad.priorityLevel}</td>
                        <td className="py-4 px-4 font-mono text-slate-400 md:whitespace-nowrap">{ad.startDate} to {ad.endDate}</td>
                        <td className="py-4 px-4 text-center font-mono font-bold">
                          <div>{ad.impressions || 0} / {ad.clicks || 0}</div>
                          <div className="text-[10px] text-purple-600 mt-0.5 font-bold">CTR: {ctrVal}%</div>
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-emerald-600">{ad.revenueEst || 0} ETB</td>
                        <td className="py-4 px-4">
                          {ad.status === 'Pending Approval' ? (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold text-[10px]">Review Required</span>
                          ) : ad.status === 'Active' ? (
                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold text-[10px]">Active Live</span>
                          ) : ad.status === 'Paused' ? (
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold text-[10px]">Paused</span>
                          ) : ad.status === 'Rejected' ? (
                            <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold text-[10px]">Rejected</span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold text-[10px]">{ad.status}</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex gap-2 justify-end items-center">
                            <button
                              onClick={() => setSelectedReviewAd(ad)}
                              className="p-1.5 px-2.5 bg-pink-50 text-pink-600 dark:bg-pink-950/20 dark:text-pink-400 border border-pink-100 rounded-lg font-black hover:bg-pink-100 dark:hover:bg-pink-900/15 transition-all cursor-pointer flex items-center gap-1"
                              title="Deep Review Creative Media, loop video presets & theme configs"
                            >
                              <Eye size={12} /> View Media
                            </button>

                            {ad.status === 'Pending Approval' && (
                              <>
                                <button
                                  onClick={() => handleApprove(ad.id!)}
                                  className="p-1 px-2.5 bg-emerald-50 text-emerald-600 rounded-lg font-black hover:bg-emerald-100 transition-all cursor-pointer text-[10px]"
                                  title="Approve Campaign"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleOpenReject(ad)}
                                  className="p-1 px-2.5 bg-rose-50 text-rose-600 rounded-lg font-black hover:bg-rose-100 transition-all cursor-pointer text-[10px]"
                                  title="Reject Campaign"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {(ad.status === 'Active' || ad.status === 'Paused') && (
                              <button
                                onClick={() => handleToggleState(ad)}
                                className={`p-1 px-2.5 rounded-lg text-[10.5px] font-black transition-all cursor-pointer ${
                                  ad.status === 'Paused' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {ad.status === 'Paused' ? 'Resume' : 'Pause'}
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenEdit(ad)}
                              className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 rounded-lg text-slate-600 dark:text-slate-400 cursor-pointer"
                              title="Tune parameters"
                            >
                              <Edit size={14} />
                            </button>

                            <button
                              onClick={() => handleDelete(ad.id!)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded-lg text-rose-600 cursor-pointer"
                              title="Delete campaign"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAds.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">No matching advertisement campaigns found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Editing Modal Dialog */}
      {editingAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl w-full max-w-lg space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Configure Campaign Parameters</h3>
            
            <div className="space-y-3 font-sans text-xs">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Headline Text</label>
                <input
                  type="text"
                  value={editHeadline}
                  onChange={(e) => setEditHeadline(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Subtext / Callout</label>
                <input
                  type="text"
                  value={editPromoText}
                  onChange={(e) => setEditPromoText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900 dark:text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900 dark:text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Priority Ranking</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900 dark:text-white text-xs"
                >
                  <option value="low">Low Priority Rank</option>
                  <option value="medium">Medium Priority Rank</option>
                  <option value="high">High Priority Premium Rank</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Requested Promotion Type</label>
                <select
                  value={editPromotionType}
                  onChange={(e) => setEditPromotionType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900 dark:text-white text-xs font-bold text-blue-600"
                >
                  <option value="">No special Promotion Type</option>
                  <option value="Percentage Discount">Discount Campaign (Percentage off list price)</option>
                  <option value="Buy One Get One Free (BOGO)">Buy One Get One Free (BOGO) Campaign</option>
                  <option value="Free Shipping Promotion">Free Logistics & Speed Shipping Promotion</option>
                  <option value="Bulk Purchase Tier Discount">Bulk Tier Pack Discount (Wholesale only)</option>
                  <option value="Seasonal Stock Clearance">Seasonal Clearance / Expiry Sale Spotlight</option>
                  <option value="New Product Launch Trial Pack">New Product Launch & Trial Pack Deal</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditingAd(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal Reason Input */}
      {rejectionAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5"><AlertTriangle className="text-amber-500" size={18} /> Reject Ad Request</h3>
            <p className="text-xs text-slate-500">Provide feedback on why this ad cannot be approved at this time:</p>
            
            <textarea
              placeholder="e.g. Image does not meet clinical criteria / Incorrect product target linking / Promotional pricing not compliant..."
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900 dark:text-white text-xs"
            />

            <div className="flex gap-3 font-sans">
              <button
                onClick={() => setRejectionAd(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visual Ad Campaign & Media Review Lab Modal */}
      {selectedReviewAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-8 rounded-3xl w-full max-w-4xl space-y-6 shadow-2xl relative my-8 text-slate-700 dark:text-slate-300">
            <button 
              onClick={() => setSelectedReviewAd(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer font-bold text-sm w-9 h-9 flex items-center justify-center"
            >
              ✕
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-pink-650 bg-pink-50 dark:bg-pink-950/20 px-2.5 py-1 rounded-full">Platform Inspector</span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Ad Campaign & Media Review Lab</h2>
            </div>

            <p className="text-xs text-slate-500 max-w-2xl">
              Inspect raw promotional images, simulated 3-5 second looping videos, metadata logs, pricing details, and visual styling cues for <b>{selectedReviewAd.importerName}</b>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start text-left">
              {/* Left Column: Visual Media Box & Loop Preview */}
              <div className="space-y-4">
                <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Raw Campaign Asset Preview</span>

                {selectedReviewAd.assetType === 'video' ? (
                  <div className="bg-slate-950 text-white rounded-2xl p-6 aspect-video flex flex-col justify-between relative overflow-hidden border border-slate-800 group shadow-lg min-h-[220px]">
                    {/* Glowing effect to simulate looping video */}
                    <div className="absolute inset-0 bg-radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.15), transparent 70%) animate-pulse pointer-events-none"></div>

                    <div className="flex justify-between items-start z-10">
                      <span className="text-[9px] font-black tracking-widest bg-emerald-500 text-white px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span> 🎥 Looping Sim Video
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 bg-black/40 px-2 py-0.5 rounded">Preset: {selectedReviewAd.videoPreset || 'default'}</span>
                    </div>

                    <div className="my-auto text-center z-10 py-4">
                      {selectedReviewAd.videoPreset === 'pills_flow' && (
                        <div className="space-y-2 animate-bounce">
                          <span className="text-4xl block">🌀</span>
                          <span className="text-xs font-bold text-blue-300">Infinite Blue Pills Flow (Looped Effect)</span>
                        </div>
                      )}
                      {selectedReviewAd.videoPreset === 'syrup_drip' && (
                        <div className="space-y-2 animate-bounce">
                          <span className="text-4xl block">🧪</span>
                          <span className="text-xs font-bold text-emerald-300">Infinite Liquid Serum Drip (Looped Effect)</span>
                        </div>
                      )}
                      {selectedReviewAd.videoPreset === 'heartbeat_wave' && (
                        <div className="space-y-2 animate-pulse">
                          <span className="text-4xl block">📈</span>
                          <span className="text-xs font-bold text-rose-300">Live Glowing Electrocardiogram Waveform</span>
                        </div>
                      )}
                      {selectedReviewAd.videoPreset === 'dna_helix' && (
                        <div className="space-y-2 animate-pulse">
                          <span className="text-4xl block">🧬</span>
                          <span className="text-xs font-bold text-indigo-300 font-mono">Rotating DNA Helix Molecule (Looped Effect)</span>
                        </div>
                      )}
                      {!selectedReviewAd.videoPreset && (
                        <div>
                          <span className="text-3xl block">🎥</span>
                          <span className="text-xs font-bold">Standard Looping Video Simulator</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center z-10 text-[9.5px] text-slate-400 bg-black/40 p-2 rounded-lg border border-slate-900">
                      <span>FPS: 60fps</span>
                      <span>Asset: 3.5s looping sequence</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl aspect-video bg-slate-900 border border-slate-800 overflow-hidden relative flex items-center justify-center group shadow-lg min-h-[220px]">
                    {selectedReviewAd.imageUrl ? (
                      <>
                        <img 
                          src={selectedReviewAd.imageUrl} 
                          alt="Custom Advertiser Uploaded Poster link" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-md text-[9px] font-bold text-white px-3 py-1 rounded-full flex items-center gap-1">
                          🔗 Custom Graphic Link
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6 space-y-3">
                        <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-white ${
                          selectedReviewAd.imagePreset === 'syrup' ? 'bg-emerald-500' :
                          selectedReviewAd.imagePreset === 'vaccine' ? 'bg-purple-500' :
                          selectedReviewAd.imagePreset === 'medical_kit' ? 'bg-rose-500' :
                          selectedReviewAd.imagePreset === 'first_aid' ? 'bg-teal-500' :
                          'bg-blue-500'
                        }`}>
                          <span className="text-2xl">
                            {selectedReviewAd.imagePreset === 'syrup' ? '🧪' :
                             selectedReviewAd.imagePreset === 'vaccine' ? '💉' :
                             selectedReviewAd.imagePreset === 'medical_kit' ? '📦' :
                             selectedReviewAd.imagePreset === 'first_aid' ? '❤️' :
                             '💊'
                            }
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-400 block font-bold">Preset Topic Theme</span>
                          <span className="text-sm font-black text-white capitalize">{selectedReviewAd.imagePreset || 'pills'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Theme Highlights Indicator */}
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/25 space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold block">🎨 Theme Highlights and Prominence Cues</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full ${
                      selectedReviewAd.promoThemeColor === 'pink' ? 'bg-pink-500' :
                      selectedReviewAd.promoThemeColor === 'blue' ? 'bg-sky-500' :
                      selectedReviewAd.promoThemeColor === 'purple' ? 'bg-purple-500' :
                      selectedReviewAd.promoThemeColor === 'emerald' ? 'bg-emerald-500' :
                      'bg-amber-500'
                    }`}></span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">
                      {selectedReviewAd.promoThemeColor || 'pink'} Presentation Layout Accent
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-normal">
                    This theme determines highlighted borders, neon accent tags, and high-CTR buttons across the B2B Wholesale app catalog.
                  </p>
                </div>

                {/* Verified Bank Transfer Screenshot Proof */}
                <div className="p-4 rounded-2xl border border-amber-100 dark:border-amber-950/20 bg-amber-50/10 dark:bg-amber-955/5 space-y-2 text-left">
                  <span className="text-[10px] text-amber-750 dark:text-amber-400 font-black uppercase tracking-wider block">💳 Verified Bank Transfer Screenshot Proof</span>
                  
                  {selectedReviewAd.paymentScreenshotUrl ? (
                    <div className="space-y-3">
                      <div 
                        onClick={() => {
                          setLightboxScale(1);
                          setLightboxRotation(0);
                          setIsLightboxOpen(true);
                        }}
                        className="aspect-[4/3] rounded-xl overflow-hidden border border-amber-100/40 bg-white dark:bg-slate-950 shadow-sm relative group cursor-zoom-in"
                        title="Click to zoom, rotate, and view high-resolution copy"
                      >
                        <img 
                          src={selectedReviewAd.paymentScreenshotUrl} 
                          alt="Bank Transfer Verification Receipt Screenshot" 
                          className="w-full h-full object-contain mx-auto transition-all duration-300 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                          Attached Proof
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-black gap-1.5 backdrop-blur-[1px]">
                          <span>🔍 Click to Zoom & Inspect</span>
                        </div>
                      </div>
                      <div className="text-[10.5px] text-amber-600 dark:text-amber-400 font-bold text-center animate-pulse">
                        💡 Click the image to zoom, rotate, download, or open in a new tab.
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium flex items-center gap-1.5 leading-normal">
                        <span>✅</span>
                        <span>Confirm payment receipt aligns with the <b>{selectedReviewAd.revenueEst || 0} ETB</b> campaign charge before authorizing.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-red-200 dark:border-red-900/30 bg-red-500/5 text-center space-y-1.5">
                      <span className="text-xl block">⚠️</span>
                      <span className="text-red-700 dark:text-red-400 font-black text-xs block">No Payment Screenshot Uploaded</span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        This advertiser has registered this campaign without submitting visual transfer proof/slip yet, or this is a historical campaign.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Campaign Information & Action Panel */}
              <div className="space-y-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Campaign Registration Details</span>

                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60 text-left">
                    <span className="text-[10px] text-slate-400 font-bold font-sans block">PROMOTION FORMAT</span>
                    <span className="text-slate-900 dark:text-white font-black capitalize">{selectedReviewAd.type} Ad</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60 text-left">
                    <span className="text-[10px] text-slate-400 font-bold font-sans block">PRIORITY VALUE</span>
                    <span className="text-slate-900 dark:text-white font-black capitalize">{selectedReviewAd.priorityLevel} Rank</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60 text-left col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold font-sans block">DATES INTERVAL</span>
                    <span className="text-slate-900 dark:text-white font-bold">{selectedReviewAd.startDate} to {selectedReviewAd.endDate}</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60 text-left col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold font-sans block">CAMPAIGN EST REVENUE</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">{selectedReviewAd.revenueEst || 0} ETB</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-left">
                  <div>
                    <span className="text-[10px] text-slate-400 font-black block mb-0.5">TARGET COMPANION MEDICINE</span>
                    <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/10 dark:bg-blue-950/10 font-bold text-blue-600 dark:text-blue-400">{selectedReviewAd.productName || 'Custom Direct item link'}</div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-black block mb-0.5">TEXT BLURB HEADLINE</span>
                    <p className="p-3 rounded-xl border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-200 font-bold leading-normal">"{selectedReviewAd.headline || 'Exclusive partner deal'}"</p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-black block mb-0.5">CAMPAIGN DESCRIPTION DETAILS</span>
                    <p className="p-3 rounded-xl border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 leading-relaxed font-sans">{selectedReviewAd.description || 'Promotional descriptive bio supplied for B2B wholesale buyers...'}</p>
                  </div>

                  {selectedReviewAd.bannerSource && (
                    <div className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/20 dark:bg-amber-950/10 text-slate-650 dark:text-slate-400 font-sans">
                      <span className="font-bold text-amber-800 dark:text-amber-400 block mb-0.5">📦 Source Protocol</span>
                      {selectedReviewAd.bannerSource === 'agency' 
                        ? "Design service requested. Administrator must review files and design customized banners for them (+2,500 ETB fee applied)."
                        : "Publisher self-served graphics. Verified raw graphics links will display directly in-carousels."
                      }
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex gap-2 font-sans">
                  {selectedReviewAd.status === 'Pending Approval' ? (
                    <>
                      <button
                        onClick={async () => {
                          const adId = selectedReviewAd.id;
                          if (adId) {
                            await handleApprove(adId);
                            setSelectedReviewAd(null);
                          }
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-xl transition-all cursor-pointer text-center text-xs shadow-md"
                      >
                        Approve & Launch Live 🚀
                      </button>
                      <button
                        onClick={() => {
                          handleOpenReject(selectedReviewAd);
                          setSelectedReviewAd(null);
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-black py-3 px-5 rounded-xl transition-all cursor-pointer text-xs"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setSelectedReviewAd(null)}
                      className="w-full bg-slate-900 dark:bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-705 transition-all cursor-pointer text-xs"
                    >
                      Close Review Window
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* High-Resolution Interactive Screenshot Lightbox */}
      {isLightboxOpen && selectedReviewAd?.paymentScreenshotUrl && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md p-4">
          {/* Header Bar */}
          <div className="w-full max-w-5xl flex items-center justify-between mb-4 text-white z-10">
            <div className="text-left font-sans">
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-500">
                Payment Verification Receipt
              </h3>
              <p className="text-xs text-slate-400">
                Authorized for {selectedReviewAd.importerName} • Campaign cost: {selectedReviewAd.revenueEst || 0} ETB
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLightboxScale(prev => Math.min(5, prev + 0.25))}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all font-bold text-xs flex items-center gap-1 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={16} /> <span className="hidden sm:inline">Zoom In ({Math.round(lightboxScale * 100)}%)</span>
              </button>
              
              <button
                onClick={() => setLightboxScale(prev => Math.max(0.5, prev - 0.25))}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all font-bold text-xs flex items-center gap-1 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut size={16} /> <span className="hidden sm:inline">Zoom Out</span>
              </button>

              <button
                onClick={() => setLightboxRotation(prev => (prev + 90) % 360)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all font-bold text-xs flex items-center gap-1 cursor-pointer"
                title="Rotate Clockwise"
              >
                <RotateCw size={16} /> <span className="hidden sm:inline">Rotate</span>
              </button>

              <button
                onClick={() => {
                  setLightboxScale(1);
                  setLightboxRotation(0);
                }}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all font-bold text-xs cursor-pointer text-slate-300"
                title="Reset Zoom & Rotate"
              >
                Reset
              </button>

              <a
                href={selectedReviewAd.paymentScreenshotUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-amber-500 hover:bg-amber-600 rounded-xl transition-all font-bold text-xs flex items-center gap-1 cursor-pointer text-slate-950"
                title="Open original high-res image in new tab for maximum clarity"
              >
                <ExternalLink size={16} /> <span className="hidden sm:inline">Open Original</span>
              </a>

              <button
                onClick={() => setIsLightboxOpen(false)}
                className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all font-bold text-xs flex items-center justify-center cursor-pointer w-9 h-9"
                title="Close Lightbox"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Interactive Image Frame */}
          <div className="flex-1 w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative flex items-center justify-center p-4 shadow-2xl">
            <div 
              className="w-full h-full overflow-auto flex items-center justify-center relative select-none"
              style={{ cursor: lightboxScale > 1 ? 'grab' : 'default' }}
            >
              <img
                src={selectedReviewAd.paymentScreenshotUrl}
                alt="Interactive Zoom Proof Receipt"
                className="max-h-[80vh] max-w-full object-contain transition-transform duration-200 shadow-xl rounded-lg"
                style={{
                  transform: `scale(${lightboxScale}) rotate(${lightboxRotation}deg)`,
                  transformOrigin: 'center center'
                }}
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Helpful Guide Overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-y-0 -translate-x-1/2 bg-black/60 text-slate-400 text-[11px] px-4 py-2 rounded-full pointer-events-none backdrop-blur-sm shadow-md font-sans text-center">
              💡 Use zoom/rotate buttons at top. Open Original for direct high-res browser zoom capabilities.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
