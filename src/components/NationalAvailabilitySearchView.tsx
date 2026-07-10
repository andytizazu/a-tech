import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, MarketplaceProduct, InventoryProduct } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  MapPin, 
  Building2, 
  Truck, 
  Package, 
  Map as MapIcon, 
  Grid, 
  Award, 
  Eye, 
  Phone, 
  Mail, 
  CheckCircle, 
  AlertTriangle, 
  Filter, 
  Layers, 
  ShoppingCart,
  Send,
  Info,
  Calendar,
  Lock,
  ChevronRight,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

// Haversine formula to calculate distance between two coordinates in km
const calculateDistance = (lat1?: number, lon1?: number, lat2?: number, lon2?: number) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// Common Ethiopian administrative regions for smart filtering
const ETHIOPIAN_REGIONS = [
  "Addis Ababa",
  "Oromia",
  "Amhara",
  "Tigray",
  "Southern Nations (SNNPR)",
  "Sidama",
  "Somali",
  "Afar",
  "Harari",
  "Dire Dawa",
  "Benishangul-Gumuz",
  "Gambela",
  "South Ethiopia",
  "Central Ethiopia"
];

interface NationalAvailabilitySearchViewProps {
  user: UserProfile;
  addToCart?: (product: MarketplaceProduct) => void;
  openCart?: () => void;
  cartCount?: number;
}

interface MergedSearchResult {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  batchNumber?: string;
  expiryDate?: string;
  minOrderQuantity?: number;
  description?: string;
  
  // Supplier Info joined from users collection
  supplierId: string;
  supplierName: string;
  supplierRole: 'importer' | 'distributor' | 'pharmacy';
  supplierVerification: 'pending' | 'approved' | 'rejected' | 'deactivated';
  supplierPhone?: string;
  supplierEmail?: string;
  
  // Location Info
  country: string;
  region?: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  distanceKm: number;
  
  // Custom Estimated Delivery info
  estimatedDeliveryDays: number;
  estimatedDeliveryFee: number;
  deliveryMethod: 'pickup' | 'delivery' | 'both';
  
  // Source reference
  sourceCollection: 'products' | 'medicines';
}

export default function NationalAvailabilitySearchView({ 
  user, 
  addToCart, 
  openCart, 
  cartCount = 0 
}: NationalAvailabilitySearchViewProps) {
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [hideExpired, setHideExpired] = useState(true);
  const [minQuantity, setMinQuantity] = useState<number>(0);
  
  // Datasets
  const [allProducts, setAllProducts] = useState<MarketplaceProduct[]>([]);
  const [allMedicines, setAllMedicines] = useState<InventoryProduct[]>([]);
  const [allUsers, setAllUsers] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  
  // Modal/Details
  const [selectedItem, setSelectedItem] = useState<MergedSearchResult | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferQty, setTransferQty] = useState<number>(1);
  const [transferNotes, setTransferNotes] = useState('');
  const [activeAds, setActiveAds] = useState<any[]>([]);
  const [loggedImpressions, setLoggedImpressions] = useState<Record<string, boolean>>({});

  // Fetch active sponsored advertisements
  useEffect(() => {
    const q = query(
      collection(db, 'advertisements'), 
      where('status', '==', 'Active'), 
      where('type', '==', 'sponsored')
    );
    const unsub = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() });
      });
      setActiveAds(list);
    }, (err) => {
      console.warn("Could not load sponsored ads: ", err);
    });
    return unsub;
  }, []);

  // Increment sponsored ad impressions
  useEffect(() => {
    activeAds.forEach(async (ad) => {
      if (ad.id && !loggedImpressions[ad.id]) {
        setLoggedImpressions(prev => ({ ...prev, [ad.id!]: true }));
        try {
          await updateDoc(doc(db, 'advertisements', ad.id), {
            impressions: increment(1),
            updatedAt: Date.now()
          });
        } catch (err) {
          console.error("Ad impression update failed", err);
        }
      }
    });
  }, [activeAds, loggedImpressions]);

  // Search Debouncer logic to optimize for large-scale datasets (performance & firestore throttle)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 280); // 280ms debounce is optimal for live-typing responsiveness & load reduction
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Users on mount to join profiles efficiently in O(1) in-memory lookups
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'users'), 
      where('role', 'in', ['importer', 'distributor', 'pharmacy']),
      where('verificationStatus', '==', 'approved')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const usersMap: Record<string, UserProfile> = {};
      snapshot.docs.forEach(doc => {
        usersMap[doc.id] = { uid: doc.id, ...doc.data() } as UserProfile;
      });
      setAllUsers(usersMap);
    }, (err) => {
      console.error("Failed to load global suppliers index: ", err);
      toast.error("Suppliers registry connection error.");
    });
    return unsub;
  }, []);

  // Fetch Importers catalog (products)
  useEffect(() => {
    const q = query(
      collection(db, 'products'),
      where('country', '==', user.country || 'Ethiopia')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setAllProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketplaceProduct)));
    }, (err) => {
      console.error("Products lookup subscription error: ", err);
    });
    return unsub;
  }, [user.country]);

  // Fetch Pharmacy & Distributor stock (medicines)
  useEffect(() => {
    // Unrestricted queries with in-memory indexes allow seamless client filtering of big datasets
    const q = query(collection(db, 'medicines'));
    const unsub = onSnapshot(q, (snapshot) => {
      setAllMedicines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryProduct)));
      setLoading(false);
    }, (err) => {
      console.error("Medicines ledger replication error: ", err);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Compute Merged availability data with O(1) user profile mapping and calculated metrics
  const mergedDataset = useMemo(() => {
    const results: MergedSearchResult[] = [];
    const currentUserLat = user.latitude || 9.03;
    const currentUserLng = user.longitude || 38.74;

    // 1. Process Importers products
    allProducts.forEach(prod => {
      const supplier = allUsers[prod.importerId];
      if (!supplier) return;

      const distance = calculateDistance(currentUserLat, currentUserLng, supplier.latitude, supplier.longitude);
      
      // Calculate dynamic estimated delivery
      const isFree = supplier.deliverySettings?.isFreeDelivery || false;
      const baseFee = supplier.deliverySettings?.baseFee ?? 50;
      const perKm = supplier.deliverySettings?.feePerKm ?? 15;
      const deliveryFee = isFree ? 0 : baseFee + (distance * perKm);

      // Simple estimated days based on distance
      let estDays = 1;
      if (distance > 250) estDays = 4;
      else if (distance > 50) estDays = 2;

      results.push({
        id: prod.id,
        name: prod.name,
        category: prod.category,
        price: prod.price,
        quantity: prod.stockQuantity ?? 0,
        minOrderQuantity: prod.minOrderQuantity,
        description: prod.description,
        
        supplierId: prod.importerId,
        supplierName: supplier.importerName || supplier.displayName || 'Federal Importer',
        supplierRole: 'importer',
        supplierVerification: supplier.verificationStatus || 'pending',
        supplierPhone: supplier.phone,
        supplierEmail: supplier.email,
        
        country: prod.country || 'Ethiopia',
        region: supplier.region || 'Addis Ababa',
        city: supplier.city || 'Addis Ababa',
        address: supplier.address,
        latitude: supplier.latitude,
        longitude: supplier.longitude,
        distanceKm: distance,
        
        estimatedDeliveryDays: estDays,
        estimatedDeliveryFee: Math.round(deliveryFee),
        deliveryMethod: 'both',
        sourceCollection: 'products'
      });
    });

    // 2. Process Distributors & Pharmacies (medicines)
    allMedicines.forEach(med => {
      const supplier = allUsers[med.pharmacyId];
      if (!supplier) return;

      // Do not list own stock in search results
      if (med.pharmacyId === user.uid || (user.pharmacyId && med.pharmacyId === user.pharmacyId)) {
        return;
      }

      const distance = calculateDistance(currentUserLat, currentUserLng, supplier.latitude, supplier.longitude);

      // Estimate Delivery
      let estDays = 1;
      let deliveryFee = 100; // Flat-rate B2B runner/logistic proxy
      if (distance > 100) {
        estDays = 3;
        deliveryFee = 350;
      } else if (distance > 15) {
        estDays = 2;
        deliveryFee = 200;
      }

      results.push({
        id: med.id,
        name: med.name,
        category: med.category || 'Medicine',
        price: med.price,
        quantity: med.quantity ?? 0,
        batchNumber: med.batchNumber,
        expiryDate: med.expiryDate,
        
        supplierId: med.pharmacyId,
        supplierName: supplier.role === 'distributor' 
          ? (supplier.distributorName || supplier.displayName) 
          : (supplier.pharmacyName || supplier.displayName),
        supplierRole: supplier.role === 'distributor' ? 'distributor' : 'pharmacy',
        supplierVerification: supplier.verificationStatus || 'pending',
        supplierPhone: supplier.phone,
        supplierEmail: supplier.email,
        
        country: supplier.country || 'Ethiopia',
        region: supplier.region || 'Addis Ababa',
        city: supplier.city || 'Addis Ababa',
        address: supplier.address,
        latitude: supplier.latitude,
        longitude: supplier.longitude,
        distanceKm: distance,
        
        estimatedDeliveryDays: estDays,
        estimatedDeliveryFee: deliveryFee,
        deliveryMethod: supplier.role === 'distributor' ? 'both' : 'pickup',
        sourceCollection: 'medicines'
      });
    });

    return results;
  }, [allProducts, allMedicines, allUsers, user]);

  // Apply Search, Filters, Permissions and Optimizations on the computed unified dataset
  const filteredDataset = useMemo(() => {
    let output = [...mergedDataset];

    // 1. Text Search query (Case-Insensitive match on medicine names, categories, or supplier names)
    if (debouncedQuery.trim() !== '') {
      const normQuery = debouncedQuery.toLowerCase();
      output = output.filter(item => 
        item.name.toLowerCase().includes(normQuery) || 
        item.category.toLowerCase().includes(normQuery) ||
        item.supplierName.toLowerCase().includes(normQuery)
      );
    }

    // 2. Reginal administrative filtering
    if (selectedRegion !== 'All') {
      output = output.filter(item => item.region === selectedRegion);
    }

    // 3. Supplier tier roles filtering
    if (selectedRole !== 'All') {
      output = output.filter(item => item.supplierRole === selectedRole);
    }

    // 4. Low shelf life / expired filtering
    if (hideExpired) {
      const nowMs = Date.now();
      output = output.filter(item => {
        if (!item.expiryDate) return true; // Keep products/items without exact expiration tag
        const expMs = new Date(item.expiryDate).getTime();
        return expMs > nowMs + (30 * 24 * 60 * 60 * 1000); // Filter out expired or expiring inside 30 days
      });
    }

    // 5. Quantity thresholds standardizer
    if (minQuantity > 0) {
      output = output.filter(item => item.quantity >= minQuantity);
    }

    // Priority Ranking: active sponsored campaigns first, then verified suppliers, then closer distance, then stock levels
    return output.sort((a, b) => {
      const adA = activeAds.find(ad => ad.productId === a.id);
      const adB = activeAds.find(ad => ad.productId === b.id);

      if (adA && !adB) return -1;
      if (!adA && adB) return 1;
      if (adA && adB) {
        const priorityMap = { high: 3, medium: 2, low: 1 };
        const priorityA = priorityMap[adA.priorityLevel as 'high' | 'medium' | 'low'] || 0;
        const priorityB = priorityMap[adB.priorityLevel as 'high' | 'medium' | 'low'] || 0;
        if (priorityA !== priorityB) {
          return priorityB - priorityA;
        }
      }

      if (a.supplierVerification === 'approved' && b.supplierVerification !== 'approved') return -1;
      if (a.supplierVerification !== 'approved' && b.supplierVerification === 'approved') return 1;
      
      // Secondary: Sort closer suppliers first
      if (a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
      }
      
      // Tertiary: higher stock levels
      return b.quantity - a.quantity;
    });
  }, [mergedDataset, debouncedQuery, selectedRegion, selectedRole, hideExpired, minQuantity, activeAds]);

  // Access Permission Rule constraints
  const isUserUnverified = user.verificationStatus !== 'approved';

  // Handler: Peer-to-Peer Transfer Request init
  const handleInitiateTransfer = (item: MergedSearchResult) => {
    setSelectedItem(item);
    setTransferQty(1);
    setIsTransferModalOpen(true);
  };

  const submitTransferRequest = async () => {
    if (!selectedItem) return;
    if (transferQty <= 0 || transferQty > selectedItem.quantity) {
      toast.error('Invalid quantity requested.');
      return;
    }

    try {
      // Create transfer payload and upload to DB
      const p2pPayload = {
        requesterId: user.uid,
        requesterName: user.pharmacyName || user.displayName || 'Acquiring Node',
        supplierId: selectedItem.supplierId,
        supplierName: selectedItem.supplierName,
        supplierRole: selectedItem.supplierRole,
        productId: selectedItem.id,
        productName: selectedItem.name,
        batchNumber: selectedItem.batchNumber || 'N/A',
        expiryDate: selectedItem.expiryDate || 'N/A',
        quantityRequested: transferQty,
        estimatedDeliveryFee: selectedItem.estimatedDeliveryFee,
        status: 'pending_approval',
        createdAt: Date.now(),
        notes: transferNotes || `Direct clinical allocation search sourcing from ${selectedItem.supplierName}`
      };

      await addDoc(collection(db, 'p2p_requests'), p2pPayload);
      toast.success('P2P Sourcing request dispatched successfully!');
      setIsTransferModalOpen(false);
      setTransferNotes('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit transfer request.');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header with quick stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white font-sans tracking-tight">
              National Medicine Availability Search
            </h1>
            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={10} /> Real-Time Sync
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 leading-relaxed">
            Locate critical pharmaceutical stocks instantly across all Wholesale Pharmacies, Distributors, and verified peer Pharmacies.
          </p>
        </div>

        {/* Floating Cart display */}
        {cartCount > 0 && openCart && (
          <button 
            onClick={openCart}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:bg-blue-700 hover:scale-[1.03] transition-all cursor-pointer text-sm"
          >
            <ShoppingCart size={18} />
            <span>Marketplace Cart</span>
            <span className="bg-white text-blue-600 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          </button>
        )}
      </div>

      {/* Permission warning banner for unverified accounts */}
      {isUserUnverified && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-start gap-3.5 shadow-sm">
          <Lock className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">
              Restricted Search Mode (Pending EFDA Verification)
            </h4>
            <p className="text-xs text-amber-700/80 dark:text-amber-500/80 mt-1 leading-relaxed">
              Your profile verification status is currently <b>{user.verificationStatus}</b>. To prevent stock raiding and preserve fair market value, exact inventory levels of peer pharmacies are rounded or masked. Contact administration to fast-track your approval credentials.
            </p>
          </div>
        </div>
      )}

      {/* Search Input and region/category filters (Optimized layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
        <div className="lg:col-span-5 relative">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search brand, generic name, active ingredients or supplier..."
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-all"
          />
        </div>

        {/* Region Filter */}
        <div className="lg:col-span-3 flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <MapPin size={16} className="text-slate-400 shrink-0" />
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="w-full text-xs text-slate-600 dark:text-slate-300 bg-transparent outline-none py-1.5 focus:none cursor-pointer font-bold"
          >
            <option value="All">All Regions (National Search)</option>
            {ETHIOPIAN_REGIONS.map((r, i) => (
              <option key={i} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Supplier Role Filter */}
        <div className="lg:col-span-2 flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <Building2 size={16} className="text-slate-400 shrink-0" />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full text-xs text-slate-600 dark:text-slate-300 bg-transparent outline-none py-1.5 focus:none cursor-pointer font-bold"
          >
            <option value="All font-sans">All Channels</option>
            <option value="importer">Wholesale Pharmacies Only</option>
            <option value="distributor">Distributors Only</option>
            <option value="pharmacy">Peer Health Centers</option>
          </select>
        </div>

        {/* Min Qty Selector */}
        <div className="lg:col-span-2 flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <Package size={16} className="text-slate-400 shrink-0" />
          <input 
            type="number"
            value={minQuantity === 0 ? '' : minQuantity}
            onChange={(e) => setMinQuantity(Math.max(0, parseInt(e.target.value) || 0))}
            placeholder="Min stock level"
            className="w-full text-xs text-slate-600 dark:text-slate-300 bg-transparent outline-none py-1 block placeholder-slate-400 focus:none font-bold"
          />
        </div>
      </div>

      {/* Toggle options / stats counters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <button 
            type="button"
            onClick={() => setHideExpired(!hideExpired)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${hideExpired ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 border border-slate-100 dark:border-slate-800'}`}
          >
            <AlertTriangle size={12} />
            <span>Hide Expiring (&lt;30 days)</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 font-mono">
          Showing <b>{filteredDataset.length}</b> matches nationwide from <b>{mergedDataset.length}</b> global ledger items
        </p>
      </div>

      {/* Main Results Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-mono mt-4">Streaming national networks logbook...</p>
        </div>
      ) : filteredDataset.length === 0 ? (
        <div className="col-span-full py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
          <Search className="mx-auto text-slate-300 dark:text-slate-700 mb-4" size={48} />
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">No Medicine Availability Found</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
            Try adjusting your search criteria, selecting active regions, or choosing different sourcing tiers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDataset.map((item) => {
            // Apply unverified masking for privacy/scouting control on competitor pharmacy data
            const displayQty = (isUserUnverified && item.supplierRole === 'pharmacy')
              ? (item.quantity > 50 ? "50+ units (Masked)" : (item.quantity >= 10 ? "10+ units (Masked)" : "Limited Stock (Masked)"))
              : `${item.quantity.toLocaleString()} units`;

            const ad = activeAds.find(a => a.productId === item.id);

            return (
              <div 
                key={`${item.sourceCollection}-${item.id}`}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-6 flex flex-col justify-between hover:shadow-md transition-all group relative ${
                  ad ? 'border-amber-400 dark:border-amber-500/50 bg-amber-50/5' : 'border-slate-100 dark:border-slate-800'
                }`}
              >
                <div>
                  {/* Top line with Supplier Role badge and Region */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        item.supplierRole === 'importer' 
                          ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/20' 
                          : item.supplierRole === 'distributor'
                          ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/20'
                          : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20'
                      }`}>
                        {item.supplierRole}
                      </span>
                      {ad && (
                        <span className="text-[8.5px] font-black tracking-wider uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-white px-1.5 py-0.5 rounded">
                          ⭐ Sponsored
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1">
                      <MapPin size={10} /> {item.city || item.region}
                    </span>
                  </div>

                  {/* Medicine core details */}
                  <h3 className="font-bold text-slate-900 dark:text-white text-base truncate group-hover:text-blue-600 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">{item.category}</p>

                  <div className="space-y-2 border-t border-b border-slate-50 dark:border-slate-800/70 py-3 my-3">
                    {/* Quantity Available */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 flex items-center gap-1.5"><Package size={13} /> Stock Level</span>
                      <span className={`font-mono text-xs font-bold ${item.quantity <= 0 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                        {displayQty}
                      </span>
                    </div>

                    {/* Expiry and batch, only show if medicines source */}
                    {item.expiryDate && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 flex items-center gap-1.5"><Calendar size={13} /> Exp Date</span>
                        <span className={`font-mono text-xs font-bold ${new Date(item.expiryDate).getTime() < Date.now() + (30 * 24 * 60 * 60 * 1000) ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'}`}>
                          {item.expiryDate}
                        </span>
                      </div>
                    )}

                    {/* Distance in km */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 flex items-center gap-1.5"><MapIcon size={13} /> Location Proximity</span>
                      <span className="font-mono text-xs text-slate-600 dark:text-slate-300 font-bold">
                        {item.distanceKm} km away
                      </span>
                    </div>

                    {/* Estimated Sourcing delivery */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 flex items-center gap-1.5"><Truck size={13} /> Sourcing Proxy</span>
                      <span className="font-sans text-[11px] text-slate-700 dark:text-slate-300 font-bold text-right leading-tight max-w-[150px]">
                        {item.estimatedDeliveryDays} day ({item.estimatedDeliveryFee === 0 ? 'Free Cargo' : `${item.estimatedDeliveryFee} ETB`})
                      </span>
                    </div>
                  </div>

                  {/* Supplier Brand Node Info */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0">
                        <Building2 size={13} className="text-slate-500 dark:text-slate-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                          {item.supplierName}
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-0.5">
                          {item.supplierVerification === 'approved' ? (
                            <span className="text-emerald-600 flex items-center gap-0.5"><CheckCircle size={10} /> Certified EFDA Member</span>
                          ) : (
                            <span className="text-amber-500 flex items-center gap-0.5"><AlertTriangle size={10} /> Unverified Partner</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sourcing CTA depends on role */}
                <div>
                  {item.supplierRole === 'importer' ? (
                    addToCart ? (
                      <button
                        onClick={() => {
                          // Assemble correct format mimicking product schema
                          const prodPayload: MarketplaceProduct = {
                            id: item.id,
                            importerId: item.supplierId,
                            importerName: item.supplierName,
                            name: item.name,
                            description: item.description || '',
                            category: item.category,
                            price: item.price,
                            minOrderQuantity: item.minOrderQuantity || 1,
                            stockQuantity: item.quantity,
                            country: item.country,
                            createdAt: Date.now()
                          };
                          addToCart(prodPayload);
                        }}
                        disabled={item.quantity <= 0}
                        className={`w-full py-2.5 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 ${
                          item.quantity <= 0 
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                        }`}
                      >
                        <ShoppingCart size={13} /> Buy Bulk stock ({item.price.toLocaleString()} ETB)
                      </button>
                    ) : null
                  ) : (
                    <button
                      onClick={() => handleInitiateTransfer(item)}
                      disabled={item.quantity <= 0 || (isUserUnverified && item.supplierRole === 'pharmacy')}
                      className={`w-full py-2.5 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 border ${
                        item.quantity <= 0 
                          ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed dark:border-slate-800 dark:bg-slate-800' 
                          : isUserUnverified && item.supplierRole === 'pharmacy'
                          ? 'border-amber-100 bg-amber-50 text-amber-500 cursor-not-allowed dark:border-amber-950/20'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <ArrowRightLeft size={13} /> {item.supplierRole === 'distributor' ? 'Contact / Sourcing Order' : 'P2P Stock Allocation'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sourcing Modal for P2P Transfer & Distributor Procurement Request */}
      <AnimatePresence>
        {isTransferModalOpen && selectedItem && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1010] p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 max-w-lg w-full p-8 shadow-2xl relative"
            >
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <ArrowRightLeft className="text-blue-600 animate-pulse" size={20} /> Request Stock Sourcing Alignment
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
                You are initiating a direct clinical allocation. The supplier will receive an automated request logs form.
              </p>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl mb-6 space-y-3">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-400">Medicine Node</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedItem.name}</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-400">Supplier Tier</span>
                  <span className="font-bold text-slate-900 dark:text-white capitalize">{selectedItem.supplierRole}</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-400">Supplier Name</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedItem.supplierName}</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-400">City / Proximity</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedItem.city} ({selectedItem.distanceKm} km away)</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-400">Total Stock Available</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{selectedItem.quantity.toLocaleString()} units</span>
                </div>
              </div>

              {/* Form Input elements */}
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Sourcing Quantity</label>
                  <input 
                    type="number"
                    value={transferQty}
                    onChange={(e) => setTransferQty(Math.min(selectedItem.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm rounded-xl outline-none focus:border-blue-500 transition-all font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Maximum limits based on inventory levels</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Special Allocations Note</label>
                  <textarea 
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    placeholder="Provide specific medical transfer directives, delivery guidelines, or clinical comments..."
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm rounded-xl outline-none focus:border-blue-500 transition-all min-h-[90px]"
                  />
                </div>
              </div>

              {/* Action trigger row */}
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsTransferModalOpen(false)}
                  className="flex-1 py-3 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm"
                >
                  Withdraw
                </button>
                <button 
                  onClick={submitTransferRequest}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Send size={15} /> Dispatch Request
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
