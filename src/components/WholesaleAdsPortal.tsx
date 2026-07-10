import React, { useState, useEffect } from 'react';
import { 
  db 
} from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  UserProfile, 
  MarketplaceProduct 
} from '../types';
import { 
  Plus, 
  Package,
  Tag, 
  Calendar, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Pause, 
  Play, 
  Trash2, 
  Edit, 
  Eye, 
  TrendingUp, 
  MousePointer, 
  Percent, 
  Building2, 
  ChevronRight, 
  ShoppingBag,
  Clock,
  Briefcase
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { toast } from 'react-hot-toast';

interface WholesaleAdsPortalProps {
  user: UserProfile;
}

export interface Advertisement {
  id?: string;
  importerId: string;
  importerName: string;
  productId: string;
  productName: string;
  type: 'sponsored' | 'banner';
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Active' | 'Paused' | 'Expired' | 'Rejected';
  startDate: string;
  endDate: string;
  priorityLevel: 'high' | 'medium' | 'low';
  displayPosition: string; // e.g. "top_banner", "marketplace_top"
  headline: string;
  promotionalText: string;
  description: string;
  ctaText: string;
  linkTarget: string;
  imageUrl?: string;
  imagePreset?: string; // Curated preset tags like "pills", "syrup", "capsules"
  promotionType?: string; // e.g. "Percentage Discount", "BOGO", "Free Shipping"
  discountPercent?: number; // percentage discount (e.g. 15 for 15% off)
  assetType?: 'image' | 'video'; // image or loop video
  videoPreset?: string; // Pills flow, DNA helix, heartbeat scan etc.
  impressions: number;
  clicks: number;
  revenueEst?: number; // Estimated campaign cost based on priority/duration
  rejectionReason?: string | null;
  bannerSource?: 'upload' | 'agency';
  promoThemeColor?: 'pink' | 'amber' | 'blue' | 'purple' | 'emerald';
  paymentScreenshotUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export const PRESET_IMAGES = [
  { id: 'pills', label: '💊 Blue Pills Bottle', color: 'bg-blue-500' },
  { id: 'orange_pills', label: '💊 Orange Pills Jar', color: 'bg-orange-500' },
  { id: 'syrup', label: '🧪 Syringe & Ampoule', color: 'bg-emerald-500' },
  { id: 'vaccine', label: '💉 Vaccine Vial', color: 'bg-purple-500' },
  { id: 'medical_kit', label: '📦 Medical Supplies Box', color: 'bg-rose-500' },
  { id: 'first_aid', label: '❤️ First Aid Cross', color: 'bg-teal-500' },
];

export const PRESET_VIDEOS = [
  { id: 'pills_flow', label: '🌀 Looping Pills Flow (3s video effect)', color: 'bg-blue-600' },
  { id: 'syrup_drip', label: '🧪 Looping Serum & Drip (5s video effect)', color: 'bg-emerald-600' },
  { id: 'heartbeat_wave', label: '📈 Glowing Electrocardiogram / Heartbeat', color: 'bg-rose-600' },
  { id: 'dna_helix', label: '🧬 Rotating DNA Science Teaser (Video)', color: 'bg-indigo-600' },
  { id: 'delivery_transit', label: '🚚 Logistics Supply Drone Route (Loop)', color: 'bg-amber-600' },
];

export const WholesaleAdsPortal: React.FC<WholesaleAdsPortalProps> = ({ user }) => {
  const [activePortalTab, setActivePortalTab] = useState<'campaigns' | 'new-ad' | 'analytics' | 'future-billing'>('campaigns');
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [importerProducts, setImporterProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [adType, setAdType] = useState<'sponsored' | 'banner'>('sponsored');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [headline, setHeadline] = useState('');
  const [promoText, setPromoText] = useState('20% Discount');
  const [description, setDescription] = useState('');
  const [ctaText, setCtaText] = useState('Order Now');
  const [linkTarget, setLinkTarget] = useState('marketplace');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0]);
  const [priorityLevel, setPriorityLevel] = useState<'high' | 'medium' | 'low'>('medium');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreset, setImagePreset] = useState('pills');
  const [promotionType, setPromotionType] = useState('Percentage Discount');
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [assetType, setAssetType] = useState<'image' | 'video'>('image');
  const [videoPreset, setVideoPreset] = useState('pills_flow');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom creative option and empty catalog helper states
  const [bannerSource, setBannerSource] = useState<'upload' | 'agency'>('upload');
  const [promoThemeColor, setPromoThemeColor] = useState<'pink' | 'amber' | 'blue' | 'purple' | 'emerald'>('pink');
  const [customProductName, setCustomProductName] = useState('');
  const [customProductPrice, setCustomProductPrice] = useState('150');
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState('');
  const [bankName, setBankName] = useState('Commercial Bank of Ethiopia (CBE)');
  const [accountName, setAccountName] = useState('EthioPharma Wholesale PLC');
  const [accountNo, setAccountNo] = useState('1000192837349');
  const [paymentAccounts, setPaymentAccounts] = useState<{
    id: string;
    bankName: string;
    accountName: string;
    accountNo: string;
    type: string;
  }[]>([]);

  useEffect(() => {
    // 1. Snapshot Listener for current importer's advertisements
    const qAds = query(
      collection(db, 'advertisements'), 
      where('importerId', '==', user.uid)
    );
    const unsubAds = onSnapshot(qAds, (snap) => {
      const list: Advertisement[] = [];
      snap.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as Advertisement);
      });
      // Sort by creation time newest first
      list.sort((a, b) => b.createdAt - a.createdAt);
      setAds(list);
      setLoading(false);
    }, (err) => {
      console.error("Error loaded ads: ", err);
      setLoading(false);
    });

    // 2. Fetch importer's products to link to campaigns
    const qProducts = query(
      collection(db, 'products'), 
      where('importerId', '==', user.uid)
    );
    getDocs(qProducts).then((snap) => {
      const list: MarketplaceProduct[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() } as MarketplaceProduct);
      });
      setImporterProducts(list);
    }).catch(err => {
      console.error("Error loading products: ", err);
    });

    return () => {
      unsubAds();
    };
  }, [user.uid]);

  const handleSeedSamples = async () => {
    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const twoWeeksLater = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0];
      
      const samples = [
        {
          importerId: user.uid,
          importerName: user.importerName || user.displayName || 'Grand Wholesale Importer',
          productId: 'custom',
          productName: 'Ciprofloxacin BP 500mg (Clearance)',
          type: 'banner',
          status: 'Approved',
          startDate: today,
          endDate: twoWeeksLater,
          headline: '⚡ Emergency Ciprofloxacin Super Deal',
          promoText: 'Buy 5 Get 1 Free Standard Carton',
          promotionalText: 'Buy 5 Get 1 Free Standard Carton',
          description: 'FDA certified high potency supply with cold chain distribution guarantee. Secure the highest priority wholesale inventory immediately before seasonal peaks.',
          ctaText: 'Order Wholesale Promo',
          linkTarget: 'marketplace',
          priorityLevel: 'high',
          imageUrl: '',
          imagePreset: 'syrup',
          promotionType: 'Buy One Get One Free (BOGO)',
          assetType: 'image',
          videoPreset: 'pills_flow',
          impressions: 480,
          clicks: 38,
          revenueEst: 5400,
          rejectionReason: null,
          createdAt: Date.now() - 3600000 * 2,
          updatedAt: Date.now(),
          bannerSource: 'agency',
          promoThemeColor: 'pink'
        },
        {
          importerId: user.uid,
          importerName: user.importerName || user.displayName || 'Grand Wholesale Importer',
          productId: 'custom',
          productName: 'Metformin Hydrochloride 850mg',
          type: 'sponsored',
          status: 'Pending Approval',
          startDate: today,
          endDate: twoWeeksLater,
          headline: '📉 Special Wholesale Price Cut',
          promoText: '15% Off direct invoice processing',
          promotionalText: '15% Off direct invoice processing',
          description: 'Top-tier glycemic control tablets. Pure grade specification. High retention order batch currently in customs, pre-booking active today.',
          ctaText: 'Pre-book Now',
          linkTarget: 'marketplace',
          priorityLevel: 'medium',
          imageUrl: '',
          imagePreset: 'pills',
          promotionType: 'Percentage Discount',
          discountPercent: 15,
          assetType: 'image',
          videoPreset: 'pills_flow',
          impressions: 120,
          clicks: 14,
          revenueEst: 3500,
          rejectionReason: null,
          createdAt: Date.now() - 3600000 * 5,
          updatedAt: Date.now(),
          bannerSource: 'upload',
          promoThemeColor: 'amber'
        },
        {
          importerId: user.uid,
          importerName: user.importerName || user.displayName || 'Grand Wholesale Importer',
          productId: 'custom',
          productName: 'Albendazole 400mg Dewormer',
          type: 'banner',
          status: 'Draft',
          startDate: today,
          endDate: twoWeeksLater,
          headline: '🚚 Albendazole BP Fresh Import Cargo',
          promoText: 'Free city delivery on orders above 12,000 ETB',
          promotionalText: 'Free city delivery on orders above 12,000 ETB',
          description: 'Broad spectrum anthelmintic agent. Approved therapeutic equivalent formulation. Ideal for primary care centers & pharmacy chains.',
          ctaText: 'Inquire Delivery',
          linkTarget: 'marketplace',
          priorityLevel: 'low',
          imageUrl: '',
          imagePreset: 'first_aid',
          promotionType: 'Free Shipping Promotion',
          assetType: 'video',
          videoPreset: 'heartbeat_wave',
          impressions: 0,
          clicks: 0,
          revenueEst: 2800,
          rejectionReason: null,
          createdAt: Date.now() - 3600000 * 24,
          updatedAt: Date.now(),
          bannerSource: 'agency',
          promoThemeColor: 'blue'
        }
      ];

      for (const sample of samples) {
        await addDoc(collection(db, 'advertisements'), sample);
      }
      toast.success("Successfully seeded 3 professional sample campaigns into your portal dashboard!");
    } catch (err: any) {
      console.error(err);
      toast.error("Error setting up sample data: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic pricing listener and formula rules (no hardcoded pricing)
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

  useEffect(() => {
    const unsubPricing = onSnapshot(doc(db, 'system_settings', 'advertising_pricing'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPricing({
          featuredProductFee: Number(data.featuredProductFee ?? 150),
          slideshowBannerFee: Number(data.slideshowBannerFee ?? 350),
          campaignDuration: Number(data.campaignDuration ?? 14),
          priority1Fee: Number(data.priority1Fee ?? 250),
          priority2Fee: Number(data.priority2Fee ?? 180),
          priority3Fee: Number(data.priority3Fee ?? 120),
        });
        if (data.bankName) setBankName(data.bankName);
        if (data.accountName) setAccountName(data.accountName);
        if (data.accountNo) setAccountNo(data.accountNo);

        const loadedAccounts = data.paymentAccounts || [
          {
            id: '1',
            bankName: data.bankName || 'Commercial Bank of Ethiopia (CBE)',
            accountName: data.accountName || 'EthioPharma Wholesale PLC',
            accountNo: data.accountNo || '1000192837349',
            type: 'Bank'
          }
        ];
        setPaymentAccounts(loadedAccounts);
      }
    }, (err) => {
      console.warn("Could not load dynamic pricing configuration for portal:", err);
    });
    return () => unsubPricing();
  }, []);

  // Update endDate automatically when startDate or default campaignDuration changes
  useEffect(() => {
    if (pricing && pricing.campaignDuration) {
      const days = pricing.campaignDuration;
      const calculatedEnd = new Date(new Date(startDate).getTime() + days * 24 * 3600 * 1000).toISOString().split('T')[0];
      setEndDate(calculatedEnd);
    }
  }, [startDate, pricing.campaignDuration]);

  const calculateEstimatedSpend = (type: 'sponsored' | 'banner', priority: 'high' | 'medium' | 'low', start: string, end: string, source: 'upload' | 'agency' = 'upload') => {
    const days = Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / (24 * 3600 * 1000)));
    const baseRate = type === 'banner' ? pricing.slideshowBannerFee : pricing.featuredProductFee;
    const prioritySurcharge = priority === 'high' ? pricing.priority1Fee : priority === 'medium' ? pricing.priority2Fee : pricing.priority3Fee;
    const baseCost = days * (baseRate + prioritySurcharge);
    const agencyFee = source === 'agency' ? 2500 : 0;
    return baseCost + agencyFee;
  };

  const handleCreateAd = async (asDraft: boolean) => {
    // Validation
    if (!selectedProductId) {
      toast.error("Please select a product or enter custom promotion details.");
      return;
    }
    if (!headline.trim()) {
      toast.error("Please provide an advertisement title/headline");
      return;
    }
    if (!promoText.trim()) {
      toast.error("Please fill the promotional text / callout");
      return;
    }

    let prodName = "";
    let prodPrice = 100;
    
    if (selectedProductId === 'custom') {
      if (!customProductName.trim()) {
        toast.error("Please enter a name for the custom promotional item.");
        return;
      }
      prodName = customProductName.trim();
      prodPrice = Number(customProductPrice) || 120;
    } else {
      const linkedProduct = importerProducts.find(p => p.id === selectedProductId);
      if (!linkedProduct) {
        toast.error("Invalid product chosen");
        return;
      }
      prodName = linkedProduct.name;
      prodPrice = linkedProduct.price;
    }

    setIsSubmitting(true);
    try {
      const spend = calculateEstimatedSpend(adType, priorityLevel, startDate, endDate, bannerSource);
      
      const newAd: Advertisement = {
        importerId: user.uid,
        importerName: user.importerName || user.displayName || 'Wholesale Importer Partner',
        productId: selectedProductId,
        productName: prodName,
        type: adType,
        status: asDraft ? 'Draft' : 'Pending Approval',
        startDate,
        endDate,
        priorityLevel,
        displayPosition: adType === 'banner' ? 'top_banner' : 'marketplace_top',
        headline,
        promotionalText: promoText,
        description,
        ctaText,
        linkTarget,
        imageUrl: imageUrl || '',
        imagePreset,
        promotionType,
        discountPercent: promotionType === 'Percentage Discount' ? Number(discountPercent) : 0,
        assetType,
        videoPreset,
        impressions: 0,
        clicks: 0,
        revenueEst: spend,
        rejectionReason: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        bannerSource: bannerSource,
        promoThemeColor: promoThemeColor,
        paymentScreenshotUrl: paymentScreenshotUrl || ''
      };

      await addDoc(collection(db, 'advertisements'), newAd);
      toast.success(asDraft ? "Campaign saved as Draft" : "Campaign submitted for review!");
      
      // Reset Form fields
      setHeadline('');
      setDescription('');
      setSelectedProductId('');
      setCustomProductName('');
      setBannerSource('upload');
      setPaymentScreenshotUrl('');
      setDiscountPercent(10);
      // Switch tab back
      setActivePortalTab('campaigns');
    } catch (err: any) {
      console.error("Error creating ad: ", err);
      toast.error("Failed to submit campaign: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePause = async (ad: Advertisement) => {
    if (!ad.id) return;
    try {
      const newStatus = ad.status === 'Paused' ? 'Active' : 'Paused';
      await updateDoc(doc(db, 'advertisements', ad.id), {
        status: newStatus,
        updatedAt: Date.now()
      });
      toast.success(`Campaign ${newStatus === 'Active' ? 'Resumed' : 'Paused'} successfully!`);
    } catch (err: any) {
      toast.error("Error changing status: " + err.message);
    }
  };

  const handleDeleteAd = async (adId: string) => {
    if (!window.confirm("Are you sure you want to delete this advertising campaign permanently?")) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'advertisements', adId));
      toast.success("Campaign deleted successfully");
    } catch (err: any) {
      toast.error("Error deleting campaign: " + err.message);
    }
  };

  const getStatusBadge = (status: Advertisement['status']) => {
    switch (status) {
      case 'Draft':
        return <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-1 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700">Draft</span>;
      case 'Pending Approval':
        return <span className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400 px-2.5 py-1 rounded-full text-xs font-bold border border-yellow-100 dark:border-yellow-900/30">Pending Retail Review</span>;
      case 'Approved':
        return <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-100 dark:border-emerald-900/30">Approved</span>;
      case 'Active':
        return <span className="bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 px-2.5 py-1 rounded-full text-xs font-black animate-pulse border border-green-200 dark:border-green-900/30">● Live Campaign</span>;
      case 'Paused':
        return <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 px-2.5 py-1 rounded-full text-xs font-bold border border-blue-100 dark:border-blue-900/30">Paused</span>;
      case 'Expired':
        return <span className="bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 px-2.5 py-1 rounded-full text-xs font-bold border border-rose-100 dark:border-rose-900/30">Expired</span>;
      case 'Rejected':
        return <span className="bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 px-2.5 py-1 rounded-full text-xs font-bold border border-red-100 dark:border-red-900/30">Rejected</span>;
      default:
        return null;
    }
  };

  // Aggregated Stats
  const activeCampaignsCount = ads.filter(a => a.status === 'Active').length;
  const expiredCampaignsCount = ads.filter(a => a.status === 'Expired').length;
  const totalImpressions = ads.reduce((sum, a) => sum + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((sum, a) => sum + (a.clicks || 0), 0);
  const overallCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) : 0;
  const prospectiveCostTotal = ads.reduce((sum, a) => sum + (a.revenueEst || 0), 0);

  // Generate chart mock-ready datasets based on existing ads or standard intervals
  const analyticsChartData = ads.length > 0 ? ads.slice(0, 7).map(a => ({
    name: a.productName.length > 12 ? a.productName.slice(0, 10) + '..' : a.productName,
    Impressions: a.impressions || 50,
    Clicks: a.clicks || 2,
    CTR: a.impressions > 0 ? Number(((a.clicks / a.impressions) * 100).toFixed(1)) : 4.0
  })).reverse() : [
    { name: 'Paracetamol', Impressions: 120, Clicks: 8, CTR: 6.6 },
    { name: 'Insulin Pen', Impressions: 280, Clicks: 22, CTR: 7.8 },
    { name: 'Amoxicillin', Impressions: 90, Clicks: 4, CTR: 4.4 },
    { name: 'Ciprofloxacin', Impressions: 150, Clicks: 11, CTR: 7.3 },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8" id="wholesale_ads_portal_root">
      {/* Dynamic Breadcrumbs & Section Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Marketing & Promotion</span>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">Wholesale Ad Portal</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Promote products, boost visibility, and reach peak pharmacy orders instantly.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActivePortalTab('campaigns')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activePortalTab === 'campaigns' ? 'bg-blue-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'}`}
          >
            My Campaigns
          </button>
          <button
            onClick={() => setActivePortalTab('new-ad')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${activePortalTab === 'new-ad' ? 'bg-emerald-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'}`}
          >
            <Plus size={14} /> Submit Campaign
          </button>
          <button
            onClick={() => setActivePortalTab('analytics')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activePortalTab === 'analytics' ? 'bg-purple-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'}`}
          >
            Metrics & ROI
          </button>
          <button
            onClick={() => setActivePortalTab('future-billing')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activePortalTab === 'future-billing' ? 'bg-amber-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'}`}
          >
            Estimated Cost Mode
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-500 text-sm">Synchronizing Campaign metrics...</p>
        </div>
      ) : (
        <>
          {/* Top Quick Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Active Campaigns</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{activeCampaignsCount}</h3>
                <span className="text-[10px] text-green-500 font-bold">Currently Live on App</span>
              </div>
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center">
                <Clock size={24} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Total Impressions</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{totalImpressions.toLocaleString()}</h3>
                <span className="text-[10px] text-slate-400 font-bold">Ad views across dashboards</span>
              </div>
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Total Clickthroughs</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{totalClicks.toLocaleString()}</h3>
                <span className="text-[10px] text-purple-500 font-bold">Avg. CTR: {(overallCtr * 100).toFixed(1)}%</span>
              </div>
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center">
                <MousePointer size={24} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Est. Marketing Budget</p>
                <div className="mt-1 space-y-0.5">
                  <p className="text-[11px] text-slate-500">Subtotal: {prospectiveCostTotal.toLocaleString()} ETB</p>
                  <p className="text-[11px] text-slate-500">VAT (15%): {(prospectiveCostTotal * 0.15).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB</p>
                  <h3 className="text-xl font-black text-amber-600 dark:text-amber-400">{(prospectiveCostTotal * 1.15).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-bold block mt-1">Future Billing Preparedness (Incl. VAT)</span>
              </div>
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center">
                <Briefcase size={24} />
              </div>
            </div>
          </div>

          {/* TAB 1: Campaigns List */}
          {activePortalTab === 'campaigns' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Ad Contracts & Submissions ({ads.length})</h2>
                <button
                  onClick={() => setActivePortalTab('new-ad')}
                  className="bg-blue-600 text-white px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1 hover:bg-blue-700 transition-all cursor-pointer"
                >
                  <Plus size={14} /> Promote Product
                </button>
              </div>

              {ads.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-12 text-center max-w-2xl mx-auto shadow-md">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/10 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Tag className="text-blue-500" size={32} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Active Ad Portal is Currently Empty</h3>
                  <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                    Set up beautiful wholesale campaigns today to advertise medicines directly to retail pharmacies!
                    Choose whether you want to <strong>upload your own custom design file</strong>, or let our design team construct raw optimized imagery.
                  </p>
                  
                  <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                      onClick={() => setActivePortalTab('new-ad')}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black text-xs transition-all cursor-pointer shadow-lg shadow-blue-100 dark:shadow-none"
                    >
                      ➕ Create Custom Promotion
                    </button>
                    <button
                      disabled={isSubmitting}
                      onClick={handleSeedSamples}
                      className="w-full sm:w-auto bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-6 py-3 rounded-xl font-black text-xs transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                    >
                      {isSubmitting ? "Generating Demo Setup..." : "⚡ Seed 3 Demo Active Campaigns"}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-4 font-mono">Generates live, approved, and pending campaign setups with high-quality presets.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {ads.map((ad) => {
                    const preset = PRESET_IMAGES.find(p => p.id === ad.imagePreset);
                    const ctrPercent = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0.0';
                    const expDaysLeft = Math.max(0, Math.round((new Date(ad.endDate).getTime() - Date.now()) / (24 * 3600 * 1000)));

                    return (
                      <div 
                        key={ad.id} 
                        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-sm relative hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                      >
                        {/* Status Tag */}
                        <div className="absolute top-6 right-6">
                          {getStatusBadge(ad.status)}
                        </div>

                        <div>
                          {/* Ad Type Indicator */}
                          <div className="flex items-center gap-2 mb-4">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                              ad.type === 'banner' 
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400' 
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                            }`}>
                              {ad.type === 'banner' ? '🔥 Dashboard Banner' : '⭐ Sponsored product'}
                            </span>
                            <span className="text-xs text-slate-400">{ad.priorityLevel} priority</span>
                          </div>

                          <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-1">
                            {ad.headline}
                            {ad.promotionType && (
                              <span className="ml-2 inline-block text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-850 dark:bg-orange-950/40 dark:text-orange-400 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-900/30">
                                {ad.promotionType}
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-0.5">Product: {ad.productName}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 line-clamp-2">{ad.description || "No description provided."}</p>

                          {/* Rejection Notification if present */}
                          {ad.status === 'Rejected' && ad.rejectionReason && (
                            <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/25 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-2">
                              <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                              <div className="text-[11.5px]">
                                <span className="font-bold text-red-700 dark:text-red-400">Rejection Reason:</span>
                                <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{ad.rejectionReason}</p>
                              </div>
                            </div>
                          )}

                          {/* Image Preset / Creative Frame Preview */}
                          <div className="my-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center gap-3 border border-slate-100 dark:border-slate-800">
                            <div className={`w-10 h-10 ${preset ? preset.color : 'bg-blue-600'} text-white rounded-xl flex items-center justify-center font-bold text-xs shrink-0`}>
                              {ad.type === 'banner' ? 'B' : 'SP'}
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Promotional snippet</span>
                              <span className="text-xs font-black text-slate-700 dark:text-slate-300 block truncate">{ad.promotionalText}</span>
                            </div>
                          </div>

                          {/* Campaign Stats */}
                          <div className="grid grid-cols-3 gap-2 border-t border-b border-slate-100 dark:border-slate-800 py-3 my-4">
                            <div className="text-center">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Impressions</span>
                              <span className="text-sm font-black text-slate-800 dark:text-white font-mono">{ad.impressions || 0}</span>
                            </div>
                            <div className="text-center border-l border-r border-slate-100 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Clicks</span>
                              <span className="text-sm font-black text-slate-800 dark:text-white font-mono">{ad.clicks || 0}</span>
                            </div>
                            <div className="text-center">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wide block">CTR</span>
                              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">{ctrPercent}%</span>
                            </div>
                          </div>

                          {/* Duration info */}
                          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                            <span className="flex items-center gap-1"><Calendar size={13} /> {ad.startDate} to {ad.endDate}</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {expDaysLeft > 0 ? `${expDaysLeft} days left` : 'Expired'}
                            </span>
                          </div>
                        </div>

                        {/* Actions block */}
                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <button
                            onClick={() => handleDeleteAd(ad.id!)}
                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all cursor-pointer"
                            title="Delete Campaign"
                          >
                            <Trash2 size={16} />
                          </button>

                          <div className="flex gap-2">
                            {(ad.status === 'Active' || ad.status === 'Paused') && (
                              <button
                                onClick={() => handleTogglePause(ad)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                  ad.status === 'Paused' 
                                    ? 'bg-green-50 text-green-700 hover:bg-green-100' 
                                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                }`}
                              >
                                {ad.status === 'Paused' ? (
                                  <>
                                    <Play size={12} /> Resume
                                  </>
                                ) : (
                                  <>
                                    <Pause size={12} /> Pause
                                  </>
                                )}
                              </button>
                            )}

                            {ad.status === 'Draft' && (
                              <button
                                onClick={async () => {
                                  try {
                                    await updateDoc(doc(db, 'advertisements', ad.id!), {
                                      status: 'Pending Approval',
                                      updatedAt: Date.now()
                                    });
                                    toast.success("Submitted for admin approval!");
                                  } catch (e: any) {
                                    toast.error("Failed to submit: " + e.message);
                                  }
                                }}
                                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-black hover:bg-blue-700 transition-all cursor-pointer"
                              >
                                Submit Campaign
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Creative Submission Form */}
          {activePortalTab === 'new-ad' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Create New Advertising Campaign</h2>

              {/* Pre-configured Templates */}
              <div className="bg-blue-50/50 dark:bg-slate-800/40 p-5 rounded-3xl border border-blue-100/40 dark:border-slate-800 mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-1 px-2.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider">⚡ Empty Solution</span>
                  <p className="text-xs font-black text-blue-800 dark:text-blue-300 uppercase tracking-wide">Quick Importer Templates (Click to Instantly Auto-fill)</p>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">If you do not have active catalog units, load one of our optimized mockups below to try the promotion system immediately!</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdType('banner');
                      setSelectedProductId('custom');
                      setCustomProductName('Amoxicillin Trihydrate Bulk');
                      setCustomProductPrice('4200');
                      setHeadline('🚨 Amoxicillin Supply Clearance');
                      setPromoText('Buy One Get One (BOGO) Free on 50+ carton purchases');
                      setDescription('FDA approved antibiotic batch. Secure immediate clearance prices. High clinical efficacy, reliable direct distributor delivery.');
                      setCtaText('Order Wholesale BOGO');
                      setPromotionType('Buy One Get One Free (BOGO)');
                      setAssetType('image');
                      setImagePreset('pills');
                      setBannerSource('agency');
                      toast.success("Loaded 'Amoxicillin Clearance BOGO' template!");
                    }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer shadow-sm"
                  >
                    💊 Amoxicillin BOGO Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdType('banner');
                      setSelectedProductId('custom');
                      setCustomProductName('Human Insulin Isophane Injection');
                      setCustomProductPrice('1800');
                      setHeadline(' Certified Cold Chain Insulin');
                      setPromoText('20% Direct Discount on Priority Orders');
                      setDescription('100% verified cold-storage shipping. High-purity hormone preparation for partner retail networks.');
                      setCtaText('Secure Cold Chain');
                      setPromotionType('Percentage Discount');
                      setAssetType('video');
                      setVideoPreset('syrup_drip');
                      setBannerSource('upload');
                      toast.success("Loaded 'Certified Cold Chain Insulin' template!");
                    }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer shadow-sm"
                  >
                    💉 Cold Chain Insulin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdType('sponsored');
                      setSelectedProductId('custom');
                      setCustomProductName('Paracetamol BP 500mg');
                      setCustomProductPrice('600');
                      setHeadline('🚚 Bulk Paracetamol Stock Arrived');
                      setPromoText('Free logistics on bulk orders over 5,000 ETB');
                      setDescription('Direct importer delivery. High quality formulation. 100% compliant with National medicine regulatory bodies.');
                      setCtaText('Order Bulk Pack');
                      setPromotionType('Free Shipping Promotion');
                      setAssetType('image');
                      setImagePreset('first_aid');
                      setBannerSource('agency');
                      toast.success("Loaded 'Bulk Paracetamol Fast Courier' template!");
                    }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer shadow-sm"
                  >
                    🚚 Bulk Paracetamol Free Ship
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Inputs area */}
                <div className="space-y-6">
                  {/* Ad Type Selector */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Campaign Format</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setAdType('sponsored');
                          setCtaText('Order Now');
                        }}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${adType === 'sponsored' ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
                      >
                        <span className="font-black text-sm text-slate-800 dark:text-white block">Sponsored Catalog Listing</span>
                        <span className="text-[11px] text-slate-400 mt-1 block">Promoted product appears at the prime top of marketplace and availability lists. Includes "Sponsored" tag.</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAdType('banner');
                          setCtaText('Claim Offer');
                        }}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${adType === 'banner' ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
                      >
                        <span className="font-black text-sm text-slate-800 dark:text-white block">Pharmacy Dashboard Banner</span>
                        <span className="text-[11px] text-slate-400 mt-1 block">Full-width visual spotlight banner placed prominently in partner pharmacies dashboard headers.</span>
                      </button>
                    </div>
                  </div>

                  {/* Product Selector */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Select Product to Advertise</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900 dark:text-white text-sm"
                    >
                      <option value="">-- Choose active Wholesale Listing --</option>
                      {importerProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.name} - ({p.price} ETB)</option>
                      ))}
                      <option value="custom">✨ Promote custom campaign item (no product catalog required)</option>
                    </select>

                    {selectedProductId === 'custom' && (
                      <div className="grid grid-cols-2 gap-4 p-4 mt-3 bg-blue-50/20 dark:bg-slate-800/20 rounded-2xl border border-blue-100/40 dark:border-slate-800 animate-slide-down">
                        <div>
                          <label className="text-[10.5px] font-bold text-slate-500 uppercase block mb-1">Promo Item Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Paracetamol BP 500mg"
                            value={customProductName}
                            onChange={(e) => setCustomProductName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 bg-white dark:bg-slate-900 dark:text-white text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10.5px] font-bold text-slate-500 uppercase block mb-1">Unit Price (ETB)</label>
                          <input
                            type="number"
                            placeholder="150"
                            value={customProductPrice}
                            onChange={(e) => setCustomProductPrice(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 bg-white dark:bg-slate-900 dark:text-white text-xs font-mono font-bold text-blue-600"
                          />
                        </div>
                      </div>
                    )}

                    {importerProducts.length === 0 && selectedProductId !== 'custom' && (
                      <span className="text-[10px] text-amber-500 mt-1 block font-medium">⚠️ No current marketplace products registered. Choose "Promote custom campaign item" or one of our quick templates above instead!</span>
                    )}
                  </div>

                  {/* Title / Headline */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Headline / Offer Title</label>
                    <input
                      type="text"
                      placeholder="e.g. 20% Discount / Best Seller / New Stock Arrived"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  {/* Promotion Type Request */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Requested Promotion Type</label>
                    <select
                      value={promotionType}
                      onChange={(e) => setPromotionType(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-blue-200 dark:border-slate-800 outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900 dark:text-slate-800 text-sm font-bold text-blue-600 dark:text-blue-400"
                    >
                      <option value="Percentage Discount">Discount Campaign (Percentage off list price)</option>
                      <option value="Buy One Get One Free (BOGO)">Buy One Get One Free (BOGO) Campaign</option>
                      <option value="Free Shipping Promotion">Free Logistics & Speed Shipping Promotion</option>
                      <option value="Bulk Purchase Tier Discount">Bulk Tier Pack Discount (Wholesale only)</option>
                      <option value="Seasonal Stock Clearance">Seasonal Clearance / Expiry Sale Spotlight</option>
                      <option value="New Product Launch Trial Pack">New Product Launch & Trial Pack Deal</option>
                    </select>

                    {promotionType === 'Percentage Discount' && (
                      <div className="p-4 mt-3 bg-amber-500/5 dark:bg-amber-950/10 border border-amber-200/55 dark:border-amber-900/30 rounded-2xl space-y-3 font-sans animate-slide-down">
                        <div className="flex justify-between items-center">
                          <label className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Set Percentage Discount (%)</label>
                          <span className="text-[9.5px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">Calculates Automatically</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="relative w-28">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={discountPercent}
                              onChange={(e) => {
                                const val = Math.min(100, Math.max(0, Number(e.target.value)));
                                setDiscountPercent(val);
                              }}
                              className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-amber-500 bg-white dark:bg-slate-900 dark:text-white font-bold text-xs"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">%</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="95"
                            value={discountPercent}
                            onChange={(e) => setDiscountPercent(Number(e.target.value))}
                            className="flex-1 accent-amber-500"
                          />
                        </div>
                        
                        {/* Dynamic calculation display */}
                        {(() => {
                          const orig = selectedProductId === 'custom' ? (Number(customProductPrice) || 120) : (importerProducts.find(p => p.id === selectedProductId)?.price || 0);
                          const finalPrice = Math.max(0, orig - Math.round((orig * discountPercent) / 100));
                          return (
                            <div className="pt-2 border-t border-dashed border-amber-100 dark:border-amber-900/30 flex justify-between items-center text-xs">
                              <span className="text-slate-400 font-bold">Calculated Price:</span>
                              <div className="flex items-center gap-2">
                                <span className="line-through text-slate-400 font-bold font-mono">{orig.toLocaleString()} ETB</span>
                                <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">{finalPrice.toLocaleString()} ETB</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Snippet / Promotional Text */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Promotional Subtext / Snippet</label>
                    <input
                      type="text"
                      placeholder="e.g. Free delivery on orders over 5k / Fast Delivery"
                      value={promoText}
                      onChange={(e) => setPromoText(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Expanded Description</label>
                    <textarea
                      placeholder="Detail clinical qualities, supply reliability, bulk incentives, or wholesale specifications..."
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  {/* Core Settings: Duration & Priority */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900 dark:text-white text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Expiry/End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900 dark:text-white text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Priority Ranking</label>
                      <select
                        value={priorityLevel}
                        onChange={(e) => setPriorityLevel(e.target.value as any)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900 dark:text-white text-sm"
                      >
                        <option value="low">Low Priority Rank</option>
                        <option value="medium">Medium Priority Rank</option>
                        <option value="high">High Priority Premium Rank</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Creative Asset Format</label>
                      <select
                        value={assetType}
                        onChange={(e) => setAssetType(e.target.value as any)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900 dark:text-white text-sm"
                      >
                        <option value="image">🏞️ High-Quality Picture Banner</option>
                        <option value="video">🎥 3-5 Second Looping Video</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    {assetType === 'image' ? (
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Visual Icon / Image theme</label>
                        <select
                          value={imagePreset}
                          onChange={(e) => setImagePreset(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900 dark:text-white text-sm"
                        >
                          {PRESET_IMAGES.map(img => (
                            <option key={img.id} value={img.id}>{img.label}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Simulated Looping Video Preset</label>
                        <select
                          value={videoPreset}
                          onChange={(e) => setVideoPreset(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-blue-200 dark:border-slate-800 outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900 dark:text-white text-sm font-bold text-blue-600 dark:text-blue-400"
                        >
                          {PRESET_VIDEOS.map(v => (
                            <option key={v.id} value={v.id}>{v.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Vibrant Promo Styling Theme */}
                  <div className="bg-pink-50/20 dark:bg-pink-950/5 p-4 rounded-2xl border border-pink-100/50 dark:border-pink-950/25 space-y-2">
                    <label className="text-xs font-black text-rose-650 dark:text-rose-450 uppercase block mb-1">💗 High-Visibility Theme Color Style</label>
                    <p className="text-[11px] text-slate-505 dark:text-slate-400 leading-normal mb-2">Choose the premium presentation theme. Pink Highlight is custom programmed for extreme B2B visual conversion on top of the marketplace.</p>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { id: 'pink', name: 'Pink', bg: 'bg-pink-500 dark:bg-pink-600 ring-pink-300' },
                        { id: 'amber', name: 'Amber', bg: 'bg-amber-500 dark:bg-amber-600 ring-amber-300' },
                        { id: 'blue', name: 'Blue', bg: 'bg-sky-550 dark:bg-sky-600 ring-sky-300' },
                        { id: 'purple', name: 'Purple', bg: 'bg-purple-500 dark:bg-purple-600 ring-purple-300' },
                        { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-500 dark:bg-emerald-600 ring-emerald-300' },
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setPromoThemeColor(t.id as any)}
                          className={`py-2 rounded-xl text-xs font-bold text-white transition-all capitalize shadow-sm ${t.bg} ${promoThemeColor === t.id ? 'ring-4 ring-offset-1 scale-105 font-black' : 'opacity-65 hover:opacity-100'}`}
                        >
                          {t.id === 'pink' ? '💗 Pink' : t.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Banner Layout & Creative Design Source Selector */}
                  <div className="bg-slate-50 dark:bg-slate-800/10 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                    <div>
                      <label className="text-xs font-black text-slate-500 uppercase block mb-2">🖌️ Creative Design & Banner Asset Source</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setBannerSource('upload')}
                          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${bannerSource === 'upload' ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/15 font-black text-blue-700 dark:text-blue-300 ring-2 ring-blue-100' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:border-slate-300'}`}
                        >
                          <span className="text-xs font-bold block mb-0.5">I will upload design</span>
                          <span className="text-[10px] text-slate-400 font-medium block">Provide your own raw poster graphics file/link. (No creative surcharge).</span>
                        </button>
                        <button
                                       className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${bannerSource === 'agency' ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/15 font-black text-blue-700 dark:text-blue-300 ring-2 ring-blue-100' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:border-slate-300'}`}
                        >
                          <span className="text-xs font-bold block mb-0.5">🎨 Design it for me!</span>
                          <span className="text-[10px] text-slate-400 font-medium block">Let us construct custom, highly optimized visual assets (+2,500 ETB design surcharge).</span>
                        </button>
                      </div>
                    </div>

                    {bannerSource === 'agency' ? (
                      <div className="p-3.5 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100/40 dark:border-blue-900/30 rounded-xl space-y-2">
                        <span className="text-[11px] text-blue-700 dark:text-blue-400 font-black block">🎨 Peak Graphic Agency Design Included</span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                          Our graphic design team will assemble a professional, high-converting banner incorporating your exact custom brand elements. Surcharge of 2,500 ETB added dynamically to final campaign setup statement.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase block">Raw Poster Image URL (Optional)</label>
                        <input
                          type="text"
                          placeholder="Paste image/graphic HTTP link, or keep empty for system rendering presets"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 bg-white dark:bg-slate-900 dark:text-white text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* Bank Transfer Receipt Screenshot Section */}
                  <div className="bg-amber-50/10 dark:bg-amber-955/5 p-5 rounded-2xl border border-amber-150/40 dark:border-amber-950/20 space-y-4 text-left">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-amber-500/15 text-amber-700 dark:text-amber-400 rounded-xl text-lg">
                        💳
                      </div>
                      <div>
                        <label className="text-xs font-black text-amber-850 dark:text-amber-400 uppercase block">Bank Payment Transfer Verification Screenshot</label>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                          Ad campaigns require upfront mobile bank transfer verification. Submit a screenshot of your payment slip to activate automatic review.
                        </p>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-amber-100/30 p-4 rounded-xl text-xs space-y-3 shadow-xs">
                      {(() => {
                        const estSpend = calculateEstimatedSpend(adType, priorityLevel, startDate, endDate, bannerSource);
                        const estVat = estSpend * 0.15;
                        const estTotal = estSpend + estVat;
                        return (
                          <div className="border-b border-dashed border-slate-150 dark:border-slate-800 pb-2.5 font-sans space-y-1 text-xs">
                            <div className="flex justify-between text-slate-400 font-bold">
                              <span>Campaign Subtotal (Excl. VAT):</span>
                              <span className="font-mono">{estSpend.toLocaleString()} ETB</span>
                            </div>
                            <div className="flex justify-between text-slate-400 font-bold">
                              <span>VAT (15%):</span>
                              <span className="font-mono">{estVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB</span>
                            </div>
                            <div className="flex justify-between font-black text-amber-600 dark:text-amber-400 text-sm pt-1 border-t border-dashed border-slate-100">
                              <span>Total Campaign Cost (Incl. VAT):</span>
                              <span className="font-mono">{estTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB</span>
                            </div>
                          </div>
                        );
                      })()}
                      
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block font-sans">Select Preferred Payment Method</span>
                        
                        <div className="grid grid-cols-1 gap-2.5">
                          {paymentAccounts.map((account, index) => (
                            <div 
                              key={account.id || index} 
                              className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800/80 hover:border-amber-400 transition-all text-left flex items-start gap-2.5 relative"
                            >
                              <div className="mt-0.5 px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-md font-black text-[9px] uppercase tracking-wide font-sans">
                                {account.type || 'Bank'}
                              </div>
                              <div className="flex-1 text-[11px] font-sans space-y-0.5 leading-relaxed">
                                <div className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                  {account.bankName}
                                </div>
                                <div className="text-slate-500 dark:text-slate-400">
                                  <span className="font-bold">Account Name:</span> {account.accountName}
                                </div>
                                <div className="text-slate-700 dark:text-slate-200 font-mono font-bold flex items-center gap-2 mt-0.5">
                                  <span>No: {account.accountNo}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(account.accountNo);
                                      toast.success("Copied to clipboard!");
                                    }}
                                    className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-400 rounded text-[9px] font-bold cursor-pointer transition-all"
                                  >
                                    Copy
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="text-[10px] text-amber-650 dark:text-amber-500 font-black mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-850 flex items-center gap-1 font-sans">
                        ⚠️ Please transfer the exact amount using any account above before uploading proof.
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10.5px] font-bold text-slate-500 uppercase block">Upload Payment Slip / Screenshot Proof</label>
                      <div className="flex flex-col gap-3">
                        {/* Elegant Drag and Drop / Browse Box */}
                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 rounded-2xl p-6 text-center transition-all bg-white dark:bg-slate-900 cursor-pointer relative group">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (typeof reader.result === 'string') {
                                    setPaymentScreenshotUrl(reader.result);
                                    toast.success("Transaction screenshot uploaded and attached successfully!");
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="space-y-2">
                            <div className="mx-auto w-10 h-10 bg-amber-55/60 dark:bg-amber-950/40 rounded-xl flex items-center justify-center text-lg text-amber-605 group-hover:scale-110 transition-transform">
                              📸
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                Click or drag a picture here to browse from your PC / Gallery
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1">
                                Supports JPG, PNG, WEBP, or HEIC transaction screenshot files
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Developer/User Simulation Button */}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentScreenshotUrl('/src/assets/images/cbe_transfer_receipt_1782153225722.jpg');
                              toast.success("CBE mobile bank transfer slip screenshot attached successfully!");
                            }}
                            className="px-3 py-1.5 bg-pink-50 text-pink-600 dark:bg-pink-950/35 dark:text-pink-450 hover:bg-pink-100 dark:hover:bg-pink-900/15 rounded-xl text-[10.5px] font-black tracking-wide border border-pink-100/60 flex items-center gap-1 cursor-pointer select-none transition-all"
                            title="Simulate CBE mobile bank transfer receipt slip instantly"
                          >
                            💸 Simulate CBE Slip Form Gallery (Dev Mode)
                          </button>
                        </div>
                      </div>
                    </div>

                    {paymentScreenshotUrl && (
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Preview Verification Screenshot Proof</span>
                        <div className="aspect-[4/3] max-h-[160px] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 relative">
                          <img 
                            src={paymentScreenshotUrl} 
                            alt="Payment verification screenshot proof slip" 
                            className="w-full h-full object-contain mx-auto"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => setPaymentScreenshotUrl('')}
                            className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-black text-white text-[9px] font-bold py-1 px-2.5 rounded-full transition-all cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submission Flow */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleCreateAd(true)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white py-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Save as Draft
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleCreateAd(false)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-100 dark:shadow-none"
                    >
                      {isSubmitting ? "Submitting Campaign..." : "Submit Campaign for Approval"}
                    </button>
                  </div>
                </div>

                {/* Right Area: Real-time Mock Previews */}
                <div className="space-y-6 lg:border-l lg:border-slate-100 lg:dark:border-slate-800 lg:pl-8">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5"><Eye size={16} /> Live Rendering Canvas</h3>
                  <p className="text-xs text-slate-500">Review exactly how this ad will look to other user roles in real-time before budgeting.</p>

                  {/* Preview Type 1: Sponsored Marketplace product preview */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Display Item Preview</span>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 p-6">
                      {(() => {
                        const isPink = promoThemeColor === 'pink';
                        const isBlue = promoThemeColor === 'blue';
                        const isPurple = promoThemeColor === 'purple';
                        const isEmerald = promoThemeColor === 'emerald';

                        let themeBorderClass = 'border-amber-400 dark:border-amber-500/50 bg-amber-50/5 ring-1 ring-amber-100';
                        let themeBadgeClass = 'bg-amber-550 text-white';
                        let themeAccentBg = 'bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-400';
                        let textColorClass = 'text-amber-600 dark:text-amber-400';

                        if (isPink) {
                          themeBorderClass = 'border-pink-420 dark:border-pink-900/60 bg-pink-50/10 ring-2 ring-pink-100 dark:ring-0 shadow-lg shadow-pink-50 dark:shadow-none';
                          themeBadgeClass = 'bg-pink-600 text-white';
                          themeAccentBg = 'bg-pink-50/70 dark:bg-pink-950/20 text-pink-700 dark:text-pink-300';
                          textColorClass = 'text-pink-600 dark:text-pink-400';
                        } else if (isBlue) {
                          themeBorderClass = 'border-sky-400 dark:border-sky-500/50 bg-sky-50/5 ring-2 ring-sky-100 dark:ring-0';
                          themeBadgeClass = 'bg-sky-600 text-white';
                          themeAccentBg = 'bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-450';
                          textColorClass = 'text-sky-600 dark:text-sky-400';
                        } else if (isPurple) {
                          themeBorderClass = 'border-purple-400 dark:border-purple-500/50 bg-purple-50/5 ring-2 ring-purple-100 dark:ring-0';
                          themeBadgeClass = 'bg-purple-600 text-white';
                          themeAccentBg = 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400';
                          textColorClass = 'text-purple-650 dark:text-purple-400';
                        } else if (isEmerald) {
                          themeBorderClass = 'border-emerald-400 dark:border-emerald-500/50 bg-emerald-50/5 ring-2 ring-emerald-100 dark:ring-0';
                          themeBadgeClass = 'bg-emerald-600 text-white';
                          themeAccentBg = 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450';
                          textColorClass = 'text-emerald-600 dark:text-emerald-400';
                        }

                        return (
                          <div className={`rounded-2xl border p-4 shadow-sm relative transition-all duration-300 ${themeBorderClass}`}>
                            {/* Sponsored Badge */}
                            <div className={`absolute -top-3 left-6 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-0.5 shadow-sm ${themeBadgeClass}`}>
                              ⭐ In Promotion
                            </div>

                            <div className="flex justify-between items-start mb-4 mt-1">
                              <div className={`w-12 h-12 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center`}><Package size={24} /></div>
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Medicine</span>
                            </div>

                            <h4 className="text-sm font-black text-slate-800 dark:text-white mb-1">
                              {selectedProductId === 'custom' 
                                ? customProductName || "Custom Promo Item" 
                                : (selectedProductId ? importerProducts.find(p=>p.id===selectedProductId)?.name : "Active Medicine Name")
                              }
                            </h4>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{description || "Promotional marketing description text goes here..."}</p>

                            <div className={`text-[10.5px] font-black px-2.5 py-1 rounded-lg mt-2.5 inline-block ${themeAccentBg}`}>
                              💗 {headline || "20% Exclusive Discount"}
                            </div>

                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                              <div>
                                <span className="text-[9px] text-slate-400 font-bold block">PRICE</span>
                                {promotionType === 'Percentage Discount' ? (
                                  <div className="flex flex-col">
                                    <span className="line-through text-slate-400 font-bold text-[10px] font-mono leading-none mb-1">
                                      {selectedProductId === 'custom' 
                                        ? (Number(customProductPrice) || 120).toLocaleString() 
                                        : (selectedProductId ? importerProducts.find(p=>p.id===selectedProductId)?.price.toLocaleString() : '550')
                                      } ETB
                                    </span>
                                    <span className={`font-mono text-xs font-black ${textColorClass} leading-none`}>
                                      {(() => {
                                        const orig = selectedProductId === 'custom' ? (Number(customProductPrice) || 120) : (importerProducts.find(p => p.id === selectedProductId)?.price || 0);
                                        const finalPrice = Math.max(0, orig - Math.round((orig * discountPercent) / 100));
                                        return finalPrice.toLocaleString();
                                      })()} ETB
                                    </span>
                                  </div>
                                ) : (
                                  <span className={`font-mono text-xs font-black ${textColorClass}`}>
                                    {selectedProductId === 'custom' 
                                      ? (customProductPrice || '0') + ' ETB' 
                                      : (selectedProductId ? importerProducts.find(p=>p.id===selectedProductId)?.price + ' ETB' : '550 ETB')
                                    }
                                  </span>
                                )}
                              </div>
                              <span className={`text-white text-[10.5px] px-3.5 py-1.5 rounded-lg font-bold transition-all inline-block pointer-events-none ${isPink ? 'bg-pink-600 hover:bg-pink-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{ctaText}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Preview Type 2: Banner display simulation */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Pharmacy Dashboard Banner View</span>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 p-4">
                      {(() => {
                        const isPink = promoThemeColor === 'pink';
                        const isBlue = promoThemeColor === 'blue';
                        const isPurple = promoThemeColor === 'purple';
                        const isEmerald = promoThemeColor === 'emerald';

                        let bannerGradient = "from-amber-500 via-orange-600 to-amber-700";
                        if (isPink) bannerGradient = "from-pink-500 via-pink-600 to-rose-700";
                        else if (isBlue) bannerGradient = "from-cyan-500 via-blue-600 to-indigo-800";
                        else if (isPurple) bannerGradient = "from-purple-500 via-indigo-600 to-purple-800";
                        else if (isEmerald) bannerGradient = "from-emerald-500 via-teal-600 to-emerald-800";

                        return (
                          <div className={`bg-gradient-to-r text-white rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all duration-300 ${bannerGradient}`}>
                            {/* Background decoration */}
                            <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 bg-contain bg-no-repeat bg-right" style={{ backgroundImage: `radial-gradient(circle, white 10%, transparent 11%)`, backgroundSize: '12px 12px' }}></div>
                            
                            <div className="relative z-10">
                              <div className="flex justify-between items-start mb-2">
                                <span className="bg-white/20 backdrop-blur-md text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">Partner Spotlight</span>
                                <span className="text-[8.5px] text-white/95 font-black">{user.importerName || 'ABC Importers'} Wholesale</span>
                              </div>

                              <div className="flex items-center gap-3 mt-1.5">
                                <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white font-bold shrink-0">
                                  ⭐
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-sm font-black tracking-tight truncate">{headline || "Save 20% on Paracetamol Purchases"}</h4>
                                  <p className="text-[11px] text-white/90 line-clamp-1 mt-0.2">{promoText || "Promotional detail banner subtext..."}</p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-white/10">
                                <p className="text-[10px] text-white/80 font-medium">Link: Redirects to B2B Catalog</p>
                                <span className="bg-white text-blue-900 font-extrabold text-[10.5px] px-3.5 py-1.5 rounded-lg shadow-md cursor-pointer">{ctaText}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Dynamic cost calculation */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-3xl border border-slate-150 dark:border-slate-800 space-y-3">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide block mb-1">💼 Live Campaign Cost breakdown</span>
                    
                    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>Base Placement ({adType === 'banner' ? 'Dashboard Slideshow' : 'Sponsored Product'}):</span>
                        <span className="font-mono">{adType === 'banner' ? pricing.slideshowBannerFee : pricing.featuredProductFee} ETB/day</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>Distribution Priority Surcharge ({priorityLevel}):</span>
                        <span className="font-mono">+{priorityLevel === 'high' ? pricing.priority1Fee : priorityLevel === 'medium' ? pricing.priority2Fee : pricing.priority3Fee} ETB/day</span>
                      </div>

                      <div className="flex justify-between border-b border-slate-200/50 dark:border-slate-800/60 pb-2">
                        <span>Campaign Duration:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-300">
                          {Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (24 * 3600 * 1000)))} Days
                        </span>
                      </div>

                      <div className="flex justify-between pt-1">
                        <span>🖌️ Creative Banner Design:</span>
                        <span className={`font-mono font-bold ${bannerSource === 'agency' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>
                          {bannerSource === 'agency' ? '+2,500 ETB (Agency Design)' : '0 ETB (Self Upload)'}
                        </span>
                      </div>
                    </div>

                    {(() => {
                      const estSpend = calculateEstimatedSpend(adType, priorityLevel, startDate, endDate, bannerSource);
                      const estVat = estSpend * 0.15;
                      const estTotal = estSpend + estVat;
                      return (
                        <div className="space-y-1.5 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                          <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                            <span>Subtotal (Excl. VAT):</span>
                            <span className="font-mono">{estSpend.toLocaleString()} ETB</span>
                          </div>
                          <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                            <span>VAT (15%):</span>
                            <span className="font-mono">{estVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                            <span className="font-black text-slate-800 dark:text-white">Estimated Statement Total (Incl. VAT):</span>
                            <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                              {estTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                    <span className="text-[9.5px] text-slate-400 mt-1 block leading-normal">This provides a high fidelity simulation of the promotional pricing structure. In offline-ready prototype mode, no actual accounts are billed.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Metrics & ROI Charts */}
          {activePortalTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">ROI & Campaign Delivery Analytics</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Visual Chart 1: Impressions vs Clicks */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Campaign Impressions by Active Item</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Impressions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Clicks" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Visual Chart 2: CTR Performance */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Click-Through Rate (CTR) Curve (%)</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsChartData}>
                        <defs>
                          <linearGradient id="ctrGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="CTR" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#ctrGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Table break down of historical stats */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6">
                <h3 className="text-sm font-bold text-slate-950 dark:text-white mb-4">Granular Campaign ROI Inventory</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10.5px] uppercase text-slate-400 font-black">
                        <th className="py-3 px-4">Kampaign Product</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Impressions</th>
                        <th className="py-3 px-4">Clicks</th>
                        <th className="py-3 px-4">Avg. CTR</th>
                        <th className="py-3 px-4">Est Spend Potential</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {ads.map((ad) => {
                        const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0.0';
                        return (
                          <tr key={ad.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{ad.productName}</td>
                            <td className="py-3 px-4 uppercase text-[9.5px] font-black text-slate-400">{ad.type}</td>
                            <td className="py-3 px-4 font-mono font-bold">{ad.impressions || 0}</td>
                            <td className="py-3 px-4 font-mono font-bold">{ad.clicks || 0}</td>
                            <td className="py-3 px-4 font-mono text-purple-600 font-bold">{ctr}%</td>
                            <td className="py-3 px-4 font-mono font-bold">{ad.revenueEst || 0} ETB</td>
                            <td className="py-3 px-4">{getStatusBadge(ad.status)}</td>
                          </tr>
                        );
                      })}
                      {ads.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">No campaigns launched to map performance.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Future billing models */}
          {activePortalTab === 'future-billing' && (
            <div className="bg-white dark:bg-slate-900 p-8 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-2xl">
                  <Percent size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Future Billing Readiness Architecture</h2>
                  <p className="text-xs text-slate-400 mt-0.5">SaaS Infrastructure prepared for premium monetization parameters.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Monetization Pricing Formulas</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Once active, advertisement campaigns will connect securely to dynamic invoice pipelines. Supported models configured below:
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center text-xs border-b border-slate-50 dark:border-slate-800/50 pb-2">
                      <span className="font-bold">Featured Product Fee:</span>
                      <span className="font-mono text-slate-600 dark:text-slate-400">120 ETB / day</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-b border-slate-50 dark:border-slate-800/50 pb-2">
                      <span className="font-bold">Banner Advertisement Fee:</span>
                      <span className="font-mono text-slate-600 dark:text-slate-400">350 ETB / day</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-b border-slate-50 dark:border-slate-800/50 pb-2">
                      <span className="font-bold">High Priority Campaign Fee:</span>
                      <span className="font-mono text-gradient text-rose-600 font-bold">Multiplier 1.5x</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-4 bg-slate-50/50 dark:bg-slate-800/10">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Estimated Total Marketing Costs</h3>
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-center space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">PROSPECTIVE BILLING ACCUMULATED</span>
                    <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <p>Subtotal (Excl. VAT): <span className="font-bold text-slate-700 dark:text-slate-350 font-mono">{prospectiveCostTotal.toLocaleString()} ETB</span></p>
                      <p>VAT (15%): <span className="font-bold text-slate-700 dark:text-slate-350 font-mono">{(prospectiveCostTotal * 0.15).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB</span></p>
                    </div>
                    <div className="border-t border-dashed border-slate-150 dark:border-slate-800 pt-2">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">{(prospectiveCostTotal * 1.15).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB</h3>
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-1">Total (Incl. 15% VAT)</p>
                    </div>
                    <p className="text-[10px] text-emerald-500 font-bold block">Current Active Setup: Draft Free Playmode</p>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    💡 **Architectural Note:** These prospective values are pre-calculated values attached directly to documents under the `revenueEst` schema model parameter. It does not deduct from any credit card or bank account yet.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
