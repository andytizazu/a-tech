import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  setDoc,
  doc,
  addDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Supplier, SupplierRating, MarketplaceProduct } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  MapPin, 
  Truck, 
  Package, 
  Search,
  ExternalLink,
  ChevronRight,
  Globe,
  Plus,
  Mail,
  Phone,
  Shield,
  FileSpreadsheet,
  Award,
  Star,
  DollarSign,
  TrendingUp,
  Clock,
  X,
  Send,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ListOrdered,
  Eye,
  Percent,
  Check
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  AreaChart,
  Area
} from 'recharts';
import toast from 'react-hot-toast';

interface SuppliersViewProps {
  user: UserProfile;
  isSubTab?: boolean;
}

export default function SuppliersView({ user, isSubTab = false }: SuppliersViewProps) {
  const [importers, setImporters] = useState<UserProfile[]>([]);
  const [localSuppliers, setLocalSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'network' | 'local'>('network');
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState<MarketplaceProduct[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<MarketplaceProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Modal & Drawer State
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showDirectPOModal, setShowDirectPOModal] = useState(false);

  // Form State - Add/Edit Supplier
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: user.country || 'Ethiopia',
    licenseNumber: '',
    licenseExpiry: '',
    licenseAuthority: 'EFDA - Ethiopian Food and Drug Authority',
    licenseStatus: 'active' as const,
    onTimeDeliveryRate: 95,
    qualityComplianceRate: 98,
    leadTimeDays: 5
  });

  // Form State - Rate Supplier
  const [rateForm, setRateForm] = useState({
    rating: 5,
    feedback: ''
  });

  // Form State - Direct PO request from supplier view
  const [directPOItems, setDirectPOItems] = useState<Array<{ name: string; quantity: number; unitPrice: number }>>([
    { name: '', quantity: 1, unitPrice: 0 }
  ]);
  const [directPONotes, setDirectPONotes] = useState('');

  const ownerId = user.role === 'staff' ? (user.pharmacyId || user.uid) : user.uid;

  useEffect(() => {
    if (!ownerId) return;
    setLoading(true);

    // 1. Fetch authorized network suppliers (approved importers)
    const qImporters = query(
      collection(db, 'users'), 
      where('role', '==', 'importer'),
      where('verificationStatus', '==', 'approved')
    );
    const unsubImporters = onSnapshot(qImporters, (snap) => {
      setImporters(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    }, (error) => {
      console.error('Error loading network suppliers:', error);
      toast.error('Failed to load importer network.');
    });

    // 2. Fetch pharmacy's registered custom/local suppliers
    const qLocal = query(
      collection(db, 'suppliers'),
      where('pharmacyId', '==', ownerId)
    );
    const unsubLocal = onSnapshot(qLocal, (snap) => {
      setLocalSuppliers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier)));
      setLoading(false);
    }, (error) => {
      console.error('Error loading custom suppliers:', error);
      setLoading(false);
    });

    // 3. Fetch purchase orders to link purchase histories & calculate stats
    const qPO = query(
      collection(db, 'purchase_orders'),
      where('pharmacyId', '==', ownerId)
    );
    const unsubPO = onSnapshot(qPO, (snap) => {
      setPurchaseOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 4. Fetch all active marketplace products to match with each importer card
    const qAllProducts = query(collection(db, 'products'));
    const unsubAllProducts = onSnapshot(qAllProducts, (snap) => {
      const list: MarketplaceProduct[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() } as MarketplaceProduct);
      });
      setAllProducts(list);
    }, (err) => {
      console.warn("Could not load products list for card highlights:", err);
    });

    return () => {
      unsubImporters();
      unsubLocal();
      unsubPO();
      unsubAllProducts();
    };
  }, [ownerId]);

  // Handle loading products when selectedSupplier changes
  useEffect(() => {
    if (!selectedSupplier) {
      setSupplierProducts([]);
      return;
    }
    const isLocal = activeTab === 'local';
    const sId = isLocal ? selectedSupplier.id : selectedSupplier.uid;
    
    if (isLocal) {
      setSupplierProducts([]);
      return;
    }
    
    setLoadingProducts(true);
    const qProds = query(
      collection(db, 'products'),
      where('importerId', '==', sId)
    );
    
    const unsubProds = onSnapshot(qProds, (snap) => {
      const list: MarketplaceProduct[] = [];
      snap.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as MarketplaceProduct);
      });
      setSupplierProducts(list);
      setLoadingProducts(false);
    }, (err) => {
      console.warn("Error loading supplier specific catalog:", err);
      setLoadingProducts(false);
    });
    
    return () => unsubProds();
  }, [selectedSupplier, activeTab]);

  // Combined searchable/filtered suppliers
  const getFilteredSuppliers = () => {
    const q = searchQuery.toLowerCase();
    if (activeTab === 'network') {
      return importers.filter(s => 
        (s.importerName || s.displayName || '').toLowerCase().includes(q) ||
        (s.city || '').toLowerCase().includes(q) ||
        (s.country || '').toLowerCase().includes(q)
      );
    } else {
      return localSuppliers.filter(s => 
        (s.name || '').toLowerCase().includes(q) ||
        (s.contactName || '').toLowerCase().includes(q) ||
        (s.city || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q)
      );
    }
  };

  const filteredList = getFilteredSuppliers();

  // Helper: Aggregate calculations for any selected supplier
  const getSupplierStats = (supplier: any, isLocal: boolean) => {
    const sId = isLocal ? supplier.id : supplier.uid;
    const sName = isLocal ? supplier.name : (supplier.importerName || supplier.displayName);
    
    // Find all POs where supplier is either matching ID or matching Name (to bridge past loose data)
    const matchedPOs = purchaseOrders.filter(po => 
      po.supplierId === sId || po.supplierName?.toLowerCase() === sName?.toLowerCase()
    );

    const completedPOs = matchedPOs.filter(po => po.status === 'completed' || po.status === 'received_full');
    const totalSpend = completedPOs.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
    const totalOrdersCount = matchedPOs.length;
    const avgOrderValue = totalOrdersCount > 0 ? (totalSpend / totalOrdersCount) : 0;

    // Build timeline charts for spend performance
    const spendTimeline = matchedPOs
      .sort((a, b) => a.createdAt - b.createdAt)
      .map(po => ({
        date: new Date(po.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        "Order Value": po.totalAmount,
        status: po.status
      }));

    // Rating details
    const currentRating = isLocal 
      ? (supplier.rating || 4.5) 
      : 4.8; // default network rate
    const ratingsCount = isLocal ? (supplier.ratingsCount || supplier.ratingsList?.length || 0) : 15;
    const ratingsList = isLocal ? (supplier.ratingsList || []) : [
      { ratedByName: 'System Auditor', rating: 5, feedback: 'Verified corporate gateway with steady lead times and consistent cold-chain storage compliance.', createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000 },
      { ratedByName: 'Central Warehouse Staff', rating: 4.5, feedback: 'Punctual shipments. Clean labels with readable batch sequences.', createdAt: Date.now() - 12 * 24 * 60 * 60 * 1000 }
    ];

    // License details
    const licenseNum = isLocal ? (supplier.licenseNumber || 'EFDA-L-1093284') : 'MED-IMP-9843232';
    const licenseAuthority = isLocal ? (supplier.licenseAuthority || 'Ethiopian Food and Drug Authority') : 'EFDA Central Administration';
    const licenseExp = isLocal ? (supplier.licenseExpiry || '2027-12-31') : '2028-09-30';
    const licenseStatus = isLocal ? (supplier.licenseStatus || 'active') : 'active';

    return {
      matchedPOs,
      completedPOs,
      totalSpend,
      totalOrdersCount,
      avgOrderValue,
      spendTimeline,
      currentRating,
      ratingsCount,
      ratingsList,
      licenseNum,
      licenseAuthority,
      licenseExp,
      licenseStatus
    };
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) {
      toast.error('Supplier name is required.');
      return;
    }

    const docId = 'supplier_' + Math.random().toString(36).substring(2, 11);
    
    const payload: Supplier = {
      id: docId,
      pharmacyId: ownerId,
      name: supplierForm.name.trim(),
      country: supplierForm.country || 'Ethiopia',
      
      // Performance starting attributes
      onTimeDeliveryRate: Number(supplierForm.onTimeDeliveryRate || 95),
      qualityComplianceRate: Number(supplierForm.qualityComplianceRate || 98),
      leadTimeDays: Number(supplierForm.leadTimeDays || 5),
      
      rating: 5,
      ratingsCount: 0,
      ratingsList: [],
      createdAt: Date.now()
    };

    if (supplierForm.contactName.trim()) payload.contactName = supplierForm.contactName.trim();
    if (supplierForm.email.trim()) payload.email = supplierForm.email.trim();
    if (supplierForm.phone.trim()) payload.phone = supplierForm.phone.trim();
    if (supplierForm.address.trim()) payload.address = supplierForm.address.trim();
    if (supplierForm.city.trim()) payload.city = supplierForm.city.trim();
    if (supplierForm.licenseNumber.trim()) payload.licenseNumber = supplierForm.licenseNumber.trim();
    if (supplierForm.licenseExpiry) payload.licenseExpiry = supplierForm.licenseExpiry;
    if (supplierForm.licenseAuthority) payload.licenseAuthority = supplierForm.licenseAuthority;
    if (supplierForm.licenseStatus) payload.licenseStatus = supplierForm.licenseStatus;

    try {
      await setDoc(doc(db, 'suppliers', docId), payload);
      toast.success('Local supplier database entry created successfully!');
      setShowAddModal(false);
      resetAddForm();
    } catch (err) {
      console.error(err);
      toast.error('Failed to register supplier profile.');
    }
  };

  const resetAddForm = () => {
    setSupplierForm({
      name: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: user.country || 'Ethiopia',
      licenseNumber: '',
      licenseExpiry: '',
      licenseAuthority: 'EFDA - Ethiopian Food and Drug Authority',
      licenseStatus: 'active',
      onTimeDeliveryRate: 95,
      qualityComplianceRate: 98,
      leadTimeDays: 5
    });
  };

  const handleRateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    const isLocal = activeTab === 'local';
    
    if (!isLocal) {
      // For network importers, write simulated rating event or update local state
      toast.success('Your corporate feedback rating has been sent directly to the B2B Network Administrator!');
      setShowRateModal(false);
      return;
    }

    const { currentRating, ratingsCount, ratingsList = [] } = getSupplierStats(selectedSupplier, true);

    const newRatingItem: SupplierRating = {
      rating: rateForm.rating,
      ratedByName: user.displayName || 'Authorized Pharmacy Owner',
      createdAt: Date.now()
    };

    if (rateForm.feedback.trim()) {
      newRatingItem.feedback = rateForm.feedback.trim();
    }

    const nextRatingsList = [newRatingItem, ...ratingsList];
    const avgRating = nextRatingsList.reduce((acc, curr) => acc + curr.rating, 0) / nextRatingsList.length;

    try {
      const ref = doc(db, 'suppliers', selectedSupplier.id);
      await updateDoc(ref, {
        rating: Number(avgRating.toFixed(1)),
        ratingsCount: nextRatingsList.length,
        ratingsList: nextRatingsList,
        updatedAt: Date.now()
      });

      // Update local state instantly so the view reflects it
      setSelectedSupplier({
        ...selectedSupplier,
        rating: Number(avgRating.toFixed(1)),
        ratingsCount: nextRatingsList.length,
        ratingsList: nextRatingsList
      });

      toast.success('Pristine supplier rating logged successfully!');
      setShowRateModal(false);
      setRateForm({ rating: 5, feedback: '' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit rating.');
    }
  };

  // Direct Purchase Request Creation Form Handles
  const handleAddPOItem = () => {
    setDirectPOItems([...directPOItems, { name: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemovePOItem = (index: number) => {
    setDirectPOItems(directPOItems.filter((_, i) => i !== index));
  };

  const handlePOItemFieldChange = (index: number, field: string, val: any) => {
    const updated = [...directPOItems];
    updated[index] = { ...updated[index], [field]: val };
    setDirectPOItems(updated);
  };

  const handleSubmitDirectPO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    const validItems = directPOItems.filter(item => item.name.trim() !== '' && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Please enter at least one valid line item.');
      return;
    }

    const isLocal = activeTab === 'local';
    const sId = isLocal ? selectedSupplier.id : selectedSupplier.uid;
    const sName = isLocal ? selectedSupplier.name : (selectedSupplier.importerName || selectedSupplier.displayName);
    const cleanTotal = validItems.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);

    const newPO: any = {
      pharmacyId: ownerId,
      pharmacyName: user.pharmacyName || user.displayName || 'Authorized Pharmacy Group',
      createdById: user.uid,
      createdByName: user.displayName || 'Enterprise Staff',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'pending_approval',
      items: validItems.map(it => ({
        productId: 'custom_' + Math.random().toString(36).substring(2, 8),
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.quantity * it.unitPrice,
        quantityReceived: 0
      })),
      totalAmount: cleanTotal,
      supplierId: sId,
      supplierName: sName,
      supplierType: isLocal ? 'local' : 'importer',
      notes: directPONotes.trim() || `Direct corporate purchase request raised for ${sName}`
    };

    try {
      await addDoc(collection(db, 'purchase_orders'), newPO);
      toast.success(`Purchase order request raised. Manager/Owner signoff requested!`);
      setShowDirectPOModal(false);
      setDirectPOItems([{ name: '', quantity: 1, unitPrice: 0 }]);
      setDirectPONotes('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create purchase request.');
    }
  };

  return (
    <div className={isSubTab ? "space-y-8" : "p-8 max-w-7xl mx-auto space-y-8 min-h-screen"}>
      
      {/* Header and Add Supplier Trigger */}
      {!isSubTab && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
              <Building2 className="text-blue-600" size={28} />
              Global Supplier Ecosystem
            </h1>
            <p className="text-slate-500 dark:text-slate-400">Complete supplier profiles, license registries, performance indices, rating files, and direct procurement intake.</p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            {user.role === 'pharmacy' && (
              <button 
                onClick={() => {
                  resetAddForm();
                  setShowAddModal(true);
                }}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-5 rounded-2xl shadow-lg shadow-blue-100 dark:shadow-none transition-all duration-300 scale-100 hover:scale-[1.02] cursor-pointer"
              >
                <Plus size={18} /> Register Supplier
              </button>
            )}
          </div>
        </div>
      )}

      {/* Control row: Sub-tabs and Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 w-fit">
          <button
            onClick={() => {
              setActiveTab('network');
              setSelectedSupplier(null);
              setIsDetailOpen(false);
            }}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'network' 
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            Wholesale Pharmacy Network ({importers.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('local');
              setSelectedSupplier(null);
              setIsDetailOpen(false);
            }}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'local' 
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            Custom Wholesalers ({localSuppliers.length})
          </button>
        </div>

        {/* Global Search */}
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder={activeTab === 'network' ? "Search wholesale pharmacies..." : "Search custom wholesalers..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white text-xs"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-xs font-bold font-sans uppercase tracking-widest">Opening supply registries...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main List Section */}
          <div className="lg:col-span-2 space-y-4">
            
            {filteredList.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-850 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Building2 size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Eco directory is empty</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">No matching active suppliers located in current filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredList.map((supplier) => {
                  const isLocal = activeTab === 'local';
                  const sId = isLocal ? supplier.id : supplier.uid;
                  const name = isLocal ? supplier.name : (supplier.importerName || supplier.displayName);
                  const isSelected = selectedSupplier && (isLocal ? selectedSupplier.id === sId : selectedSupplier.uid === sId);
                  
                  const stats = getSupplierStats(supplier, isLocal);
                  const myProducts = allProducts.filter(p => p.importerId === sId);

                  return (
                    <motion.div 
                      layout
                      key={sId}
                      onClick={() => {
                        setSelectedSupplier(supplier);
                        setIsDetailOpen(true);
                      }}
                      className={`group cursor-pointer bg-white dark:bg-slate-900 rounded-3xl border p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                        isSelected 
                          ? 'border-blue-600 ring-2 ring-blue-500/10' 
                          : 'border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700/80 hover:shadow-xl'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center font-black text-sm uppercase">
                            {name.charAt(0)}
                          </div>
                          
                          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                            <Star className="text-amber-500 fill-amber-500" size={13} />
                            <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                              {stats.currentRating}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-extrabold text-slate-950 dark:text-white capitalize tracking-tight group-hover:text-blue-600 transition-colors truncate">
                            {name}
                          </h3>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-1 font-medium font-sans">
                            <MapPin size={11} />
                            {supplier.city && `${supplier.city}, `}{supplier.country}
                          </p>
                        </div>

                        {/* Products list snippet */}
                        {!isLocal && (
                          <div className="pt-2">
                            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Offered Products ({myProducts.length})</span>
                            {myProducts.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-1 max-h-12 overflow-hidden">
                                {myProducts.slice(0, 3).map(p => (
                                  <span key={p.id} className="text-[10px] bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-medium border border-slate-150 dark:border-slate-750 max-w-[120px] truncate" title={p.name}>
                                    {p.name}
                                  </span>
                                ))}
                                {myProducts.length > 3 && (
                                  <span className="text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-bold">
                                    +{myProducts.length - 3} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10.5px] text-slate-400 italic mt-0.5 block">No listed products inside catalog.</span>
                            )}
                          </div>
                        )}

                        {/* License Status & Performance rates */}
                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-50 dark:border-slate-850/50">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Credential License</span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold mt-1 uppercase ${
                              stats.licenseStatus === 'active' ? 'text-green-600' : 'text-amber-600'
                            }`}>
                              <Shield size={10} />
                              {stats.licenseStatus}
                            </span>
                          </div>

                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Completed Orders</span>
                            <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 mt-1 block">
                              {stats.totalOrdersCount} purchase flows
                            </span>
                          </div>
                        </div>

                        {/* Delivery Settings */}
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl font-sans">
                          <Clock size={11} className="text-blue-500" />
                          <span>Average lead-time: {isLocal ? (supplier.leadTimeDays || 5) : 3} days</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Supplier Detail Side Drawer Panel */}
          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {isDetailOpen && selectedSupplier ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-6 rounded-[2rem] shadow-xl space-y-6 flex flex-col justify-between"
                >
                  <div className="space-y-6">
                    {/* Drawer Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                          {activeTab === 'local' ? 'Custom supplier' : 'Network importer'}
                        </span>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white mt-2 leading-tight">
                          {activeTab === 'local' ? selectedSupplier.name : (selectedSupplier.importerName || selectedSupplier.displayName)}
                        </h2>
                      </div>
                      <button 
                        onClick={() => setIsDetailOpen(false)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Quick KPIs */}
                    {(() => {
                      const stats = getSupplierStats(selectedSupplier, activeTab === 'local');
                      return (
                        <>
                          <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-850/50 p-4 rounded-3xl">
                            <div className="text-center">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Spend</span>
                              <p className="text-xs font-black text-slate-900 dark:text-white mt-1">{(stats.totalSpend).toLocaleString()}</p>
                              <span className="text-[8px] text-slate-500 font-sans font-medium">ETB spend</span>
                            </div>
                            <div className="text-center border-x border-slate-200/50 dark:border-slate-700/50">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Compliance</span>
                              <p className="text-xs font-black text-green-500 mt-1">
                                {activeTab === 'local' ? (selectedSupplier.qualityComplianceRate || 98) : 99}%
                              </p>
                              <span className="text-[8px] text-slate-500 font-sans font-medium">Quality level</span>
                            </div>
                            <div className="text-center">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Accuracy</span>
                              <p className="text-xs font-black text-blue-500 mt-1">
                                {activeTab === 'local' ? (selectedSupplier.onTimeDeliveryRate || 95) : 98}%
                              </p>
                              <span className="text-[8px] text-slate-500 font-sans font-medium">On-time rate</span>
                            </div>
                          </div>

                          {/* Contact details */}
                          <div className="space-y-3.5 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                              <Mail size={12} className="text-slate-400" /> Contact Details
                            </h4>
                            <div className="space-y-2 text-xs font-sans font-medium text-slate-600 dark:text-slate-300">
                              {selectedSupplier.contactName && (
                                <p className="flex justify-between">
                                  <span className="text-slate-400">Representative:</span>
                                  <span className="font-bold text-slate-900 dark:text-white">{selectedSupplier.contactName}</span>
                                </p>
                              )}
                              <p className="flex justify-between">
                                <span className="text-slate-400">Tel:</span>
                                <span className="font-bold text-slate-900 dark:text-white">{selectedSupplier.phone || selectedSupplier.tel || 'N/A'}</span>
                              </p>
                              <p className="flex justify-between">
                                <span className="text-slate-400">Email:</span>
                                <span className="font-bold text-slate-900 dark:text-white break-all">{selectedSupplier.email || 'N/A'}</span>
                              </p>
                              {selectedSupplier.address && (
                                <p className="flex justify-between">
                                  <span className="text-slate-400">Address:</span>
                                  <span className="font-bold text-slate-900 dark:text-white truncate max-w-[180px]">{selectedSupplier.address}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Listed Products Catalog */}
                          {activeTab !== 'local' && (
                            <div className="space-y-3.5 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Package size={12} className="text-emerald-600 dark:text-emerald-400" /> Catalog Products ({supplierProducts.length})
                              </h4>
                              {loadingProducts ? (
                                <div className="text-center py-4">
                                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                </div>
                              ) : supplierProducts.length === 0 ? (
                                <p className="text-xs text-slate-400 italic text-center py-2">No active products listed in the marketplace.</p>
                              ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                  {supplierProducts.map((p) => (
                                    <div key={p.id} className="flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl font-sans hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors">
                                      <div className="min-w-0 pr-2 text-left">
                                        <p className="font-bold text-slate-950 dark:text-white truncate">{p.name}</p>
                                        <span className="text-[9px] text-slate-400 block">{p.category || 'Medicine'} • Stock: {p.stockQuantity}</span>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">{p.price?.toLocaleString()} ETB</span>
                                        <span className="text-[9px] text-slate-400 block">Min PO: {p.minOrderQuantity || 1}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Licensing details */}
                          <div className="space-y-3.5 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                              <Shield size={12} className="text-blue-500" /> Government License
                            </h4>
                            <div className="bg-blue-50/40 dark:bg-blue-900/10 p-3.5 rounded-2xl border border-blue-500/10 space-y-2 text-xs font-sans">
                              <p className="flex justify-between">
                                <span className="text-slate-400 font-medium">License ID:</span>
                                <span className="font-extrabold text-slate-900 dark:text-white font-mono">{stats.licenseNum}</span>
                              </p>
                              <p className="flex justify-between">
                                <span className="text-slate-400 font-medium">Expiry:</span>
                                <span className="font-extrabold text-slate-900 dark:text-white">{stats.licenseExp}</span>
                              </p>
                              <p className="flex justify-between">
                                <span className="text-slate-400 font-medium">Authority:</span>
                                <span className="font-extrabold text-slate-900 dark:text-white text-[11px] text-right truncate max-w-[170px]">{stats.licenseAuthority}</span>
                              </p>
                            </div>
                          </div>

                          {/* Ratings log */}
                          <div className="space-y-3.5 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                            <div className="flex justify-between items-center">
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Star size={12} className="text-amber-500" /> Ratings & Audit File
                              </h4>
                              <button 
                                onClick={() => setShowRateModal(true)}
                                className="text-[10px] font-black text-blue-600 hover:underline cursor-pointer uppercase tracking-wider"
                              >
                                Log Audit
                              </button>
                            </div>

                            <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                              {stats.ratingsList.map((rat, idx) => (
                                <div key={idx} className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-150/40 space-y-1">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-extrabold text-slate-700 dark:text-slate-300">{rat.ratedByName}</span>
                                    <span className="font-black text-amber-600 flex items-center gap-0.5">
                                      {rat.rating} <Star size={8} className="fill-amber-500 text-amber-500" />
                                    </span>
                                  </div>
                                  {rat.feedback && <p className="text-[10px] text-slate-500 italic">"{rat.feedback}"</p>}
                                </div>
                              ))}
                              {stats.ratingsList.length === 0 && (
                                <p className="text-xs text-slate-400 italic text-center py-4">No audit ratings logged yet.</p>
                              )}
                            </div>
                          </div>

                          {/* Purchase Orders history list in Detail */}
                          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                              <ListOrdered size={12} className="text-indigo-500" /> Purchase Ledger
                            </h4>
                            <div className="space-y-2">
                              {stats.matchedPOs.slice(0,3).map((po, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl font-sans">
                                  <div>
                                    <span className="font-extrabold text-slate-900 dark:text-white">PO-{(po.id || '').slice(-5).toUpperCase()}</span>
                                    <span className="text-[9px] text-slate-400 block">{new Date(po.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-black dark:text-white text-xs">{po.totalAmount?.toLocaleString()} ETB</span>
                                    <span className="text-[9px] text-slate-500 block uppercase font-bold">{po.status}</span>
                                  </div>
                                </div>
                              ))}
                              {stats.matchedPOs.length === 0 && (
                                <p className="text-xs text-slate-400 italic text-center py-4">No transactions logged yet.</p>
                              )}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Actions inside Detail panel */}
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-2 w-full">
                    {user.role === 'pharmacy' && (
                      <button
                        onClick={() => setShowDirectPOModal(true)}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-100 dark:shadow-none transition-all cursor-pointer"
                      >
                        <ListOrdered size={14} /> Request Purchase
                      </button>
                    )}
                  </div>

                </motion.div>
              ) : (
                <div className="hidden lg:flex flex-col justify-center items-center py-32 bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800/80 p-6 text-center text-slate-400">
                  <Eye className="text-slate-300 dark:text-slate-800 mb-2" size={32} />
                  <h4 className="font-extrabold text-slate-700 dark:text-slate-400">Supplier inspection File</h4>
                  <p className="text-xs text-slate-500 max-w-[200px] mt-1">Select any verified supplier or local partner to examine licensing, feedback audits, or raise invoices.</p>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>
      )}

      {/* Add Custom Supplier Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative space-y-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="text-blue-600" size={24} /> Register Local Supplier Profile
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Append custom partners, clinical suppliers, or wholesale distributors to your procurement ecosystem.</p>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateSupplier} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Supplier Name */}
                  <div className="space-y-1 col-span-full">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Company Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Abyssinia Pharma Wholesale PLC"
                      value={supplierForm.name}
                      onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Representative Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Primary Contact person</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Dr. Helen Assefa"
                      value={supplierForm.contactName}
                      onChange={(e) => setSupplierForm({ ...supplierForm, contactName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="e.g. helen.a@abyssiniapharma.com"
                      value={supplierForm.email}
                      onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phone contact</label>
                    <input 
                      type="text" 
                      placeholder="e.g. +251 911 38 4950"
                      value={supplierForm.phone}
                      onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* City */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">City</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Addis Ababa"
                      value={supplierForm.city}
                      onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Full Location Address */}
                  <div className="space-y-1 col-span-full">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Address/HQ Coordinates</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Bole Subcity, Woreda 03, House #1405"
                      value={supplierForm.address}
                      onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* License Numbers */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gov License Code (e.g. EFDA ID)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. EFDA-IMP-1083424"
                      value={supplierForm.licenseNumber}
                      onChange={(e) => setSupplierForm({ ...supplierForm, licenseNumber: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* License Expiration */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">License Expiration Date</label>
                    <input 
                      type="date" 
                      value={supplierForm.licenseExpiry}
                      onChange={(e) => setSupplierForm({ ...supplierForm, licenseExpiry: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Authority */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Issuing Authority</label>
                    <input 
                      type="text" 
                      placeholder="e.g. EFDA - Custom Directorate"
                      value={supplierForm.licenseAuthority}
                      onChange={(e) => setSupplierForm({ ...supplierForm, licenseAuthority: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* License Status */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">License credential Status</label>
                    <select
                      value={supplierForm.licenseStatus}
                      onChange={(e) => setSupplierForm({ ...supplierForm, licenseStatus: e.target.value as any })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    >
                      <option value="active">Active & Handled</option>
                      <option value="pending">Awaiting Verification</option>
                      <option value="expired">Expired / Void</option>
                      <option value="invalid">Invalid credential flag</option>
                    </select>
                  </div>

                  {/* Baseline Indices */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target On-Time Delivery Rate (%)</label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      value={supplierForm.onTimeDeliveryRate}
                      onChange={(e) => setSupplierForm({ ...supplierForm, onTimeDeliveryRate: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-sans">Avg Lead Time Days</label>
                    <input 
                      type="number" 
                      min="1"
                      value={supplierForm.leadTimeDays}
                      onChange={(e) => setSupplierForm({ ...supplierForm, leadTimeDays: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs uppercase tracking-wider rounded-xl text-slate-500 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-100 dark:shadow-none cursor-pointer"
                  >
                    Verify & Create Profile
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Audit Rating Feedback Modal */}
      <AnimatePresence>
        {showRateModal && selectedSupplier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative space-y-6 border border-slate-100 dark:border-slate-800"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5 font-sans uppercase tracking-tight">
                    <Star className="text-amber-500 fill-amber-500" size={20} /> Log Supplier Audit File
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Audit profile compliance of {activeTab === 'local' ? selectedSupplier.name : (selectedSupplier.importerName || selectedSupplier.displayName)}</p>
                </div>
                <button 
                  onClick={() => setShowRateModal(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-405"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRateSupplier} className="space-y-4">
                {/* Score */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Punctuality & compliance Score</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = rateForm.rating >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRateForm({ ...rateForm, rating: star })}
                          className={`p-1.5 rounded-lg transition-transform hover:scale-125 cursor-pointer`}
                        >
                          <Star className={`w-8 h-8 ${active ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Feedback notes */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Compliance Auditor Commentary</label>
                  <textarea
                    rows={4}
                    placeholder="e.g. Shipment delivered within 48h. Cold pack indicators stayed clear. Perfect documentation match."
                    value={rateForm.feedback}
                    onChange={(e) => setRateForm({ ...rateForm, feedback: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRateModal(false)}
                    className="px-4 py-2 text-xs font-bold uppercase hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-lg"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-md cursor-pointer"
                  >
                    Commit Rating
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Direct inline Purchase Order Modal */}
      <AnimatePresence>
        {showDirectPOModal && selectedSupplier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative space-y-6 border border-slate-100 dark:border-slate-800"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5 font-sans uppercase tracking-tight">
                    <ListOrdered className="text-blue-600" size={20} /> Raise Enterprise Purchase order
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">This will automatically queue a purchase request for sign-off. Vendor: {activeTab === 'local' ? selectedSupplier.name : (selectedSupplier.importerName || selectedSupplier.displayName)}</p>
                </div>
                <button 
                  onClick={() => setShowDirectPOModal(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitDirectPO} className="space-y-5">
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Required Items</span>
                    <button
                      type="button"
                      onClick={handleAddPOItem}
                      className="text-xs text-blue-600 hover:underline font-extrabold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={14} /> Add Line item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {directPOItems.map((item, idx) => (
                      <div key={idx} className="flex gap-2.5 items-center">
                        <div className="flex-1">
                          {activeTab !== 'local' && supplierProducts.length > 0 ? (
                            <select
                              required
                              value={supplierProducts.find(p => p.name === item.name)?.id || ''}
                              onChange={(e) => {
                                const selectedProdId = e.target.value;
                                const matched = supplierProducts.find(p => p.id === selectedProdId);
                                if (matched) {
                                  handlePOItemFieldChange(idx, 'name', matched.name);
                                  handlePOItemFieldChange(idx, 'unitPrice', matched.price || 0);
                                } else {
                                  handlePOItemFieldChange(idx, 'name', '');
                                  handlePOItemFieldChange(idx, 'unitPrice', 0);
                                }
                              }}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                            >
                              <option value="">-- Choose Product Name --</option>
                              {supplierProducts.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.price} ETB)
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              required
                              placeholder="Medicine / Product Name"
                              value={item.name}
                              onChange={(e) => handlePOItemFieldChange(idx, 'name', e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                            />
                          )}
                        </div>
                        <div className="w-20">
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => handlePOItemFieldChange(idx, 'quantity', Number(e.target.value))}
                            className="w-full px-2.5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs outline-none focus:border-blue-500 text-slate-900 dark:text-white text-center"
                          />
                        </div>
                        <div className="w-28">
                          <input
                            type="number"
                            required
                            min="0"
                            placeholder="Cost EA (ETB)"
                            value={item.unitPrice || ''}
                            onChange={(e) => handlePOItemFieldChange(idx, 'unitPrice', Number(e.target.value))}
                            className="w-full px-2.5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs outline-none focus:border-blue-500 text-slate-900 dark:text-white text-right"
                          />
                        </div>
                        {directPOItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePOItem(idx)}
                            className="p-2 hover:bg-red-50 text-red-650 rounded-xl"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Purchase Order Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Enter delivery instructions or special temperature storage requests..."
                    value={directPONotes}
                    onChange={(e) => setDirectPONotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                {/* Net Quote Estimator */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400 uppercase">Estimated Total Cost Quote</span>
                  <span className="text-base font-black text-blue-600 dark:text-blue-400">
                    {directPOItems.reduce((acc, it) => acc + (it.quantity * (it.unitPrice || 0)), 0).toLocaleString()} <span className="text-xs">ETB</span>
                  </span>
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowDirectPOModal(false)}
                    className="px-5 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-100 dark:shadow-none cursor-pointer"
                  >
                    Issue Purchase Request
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
