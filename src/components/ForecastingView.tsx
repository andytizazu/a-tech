import React, { useState, useEffect, useMemo } from 'react';
import { 
  query, 
  collection, 
  where, 
  onSnapshot, 
  addDoc 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import AIEpidemiologicalAlertPanel from './AIEpidemiologicalAlertPanel';
import { 
  UserProfile, 
  InventoryProduct, 
  Sale, 
  Branch, 
  Warehouse, 
  Supplier 
} from '../types';
import { 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  ShoppingCart, 
  Search, 
  Filter, 
  Layers, 
  Building2, 
  CheckCircle, 
  ArrowRight, 
  HelpCircle, 
  ChevronRight, 
  LineChart, 
  RefreshCw 
} from 'lucide-react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error in ForecastingView: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface ForecastingViewProps {
  user: UserProfile;
  branches?: Branch[];
  warehouses?: Warehouse[];
}

export default function ForecastingView({ user, branches = [], warehouses = [] }: ForecastingViewProps) {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [importers, setImporters] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Forecast config & filters
  const [lookbackDays, setLookbackDays] = useState<number>(30); // 7, 14, 30, 90
  const [leadTimeDays, setLeadTimeDays] = useState<number>(3); // time to receive item
  const [safetyStockDays, setSafetyStockDays] = useState<number>(7); // buffer days
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');
  
  // Create PO request form state
  const [showPOModal, setShowPOModal] = useState(false);
  const [selectedPOProducts, setSelectedPOProducts] = useState<Record<string, { qty: number; selected: boolean }>>({});
  const [orderSupplierId, setOrderSupplierId] = useState('');
  const [orderBranchId, setOrderBranchId] = useState('');
  const [orderWarehouseId, setOrderWarehouseId] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [submittingPO, setSubmittingPO] = useState(false);

  const ownerId = user.role === 'staff' ? (user.pharmacyId || user.uid) : user.uid;

  // Real-Time Subscriptions: Products, Sales, Suppliers
  useEffect(() => {
    if (!ownerId) return;
    setLoading(true);
    const unsubs: (() => void)[] = [];

    // Subscribe to Medicines
    const qMed = query(collection(db, 'medicines'), where('pharmacyId', '==', ownerId));
    const unsubMed = onSnapshot(qMed, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryProduct)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'medicines'));
    unsubs.push(unsubMed);

    // Subscribe to Sales
    const qSales = query(collection(db, 'sales'), where('pharmacyId', '==', ownerId));
    const unsubSales = onSnapshot(qSales, (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'sales'));
    unsubs.push(unsubSales);

    // Subscribe to Suppliers
    const qSuppliers = query(collection(db, 'suppliers'), where('pharmacyId', '==', ownerId));
    const unsubSuppliers = onSnapshot(qSuppliers, (snapshot) => {
      setSuppliers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'suppliers'));
    unsubs.push(unsubSuppliers);

    // Fetch registered Importers for Supplier matching
    const qImporters = query(
      collection(db, 'users'), 
      where('role', '==', 'importer'),
      where('verificationStatus', '==', 'approved')
    );
    const unsubImporters = onSnapshot(qImporters, (snapshot) => {
      setImporters(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));
    unsubs.push(unsubImporters);

    setLoading(false);
    return () => unsubs.forEach(unsub => unsub());
  }, [ownerId]);

  // Derived category list
  const categories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  }, [products]);

  // Complete List of All Potential Suppliers (Local + B2B Importers)
  const combinedSuppliersList = useMemo(() => {
    const sList: Array<{ id: string; name: string; type: 'importer' | 'local'; leadTime: number }> = [];
    
    // Local Suppliers configured in the CRM
    suppliers.forEach(s => {
      sList.push({
        id: s.id,
        name: s.name,
        type: 'local',
        leadTime: s.leadTimeDays || 5
      });
    });

    // Registered B2B Importers from A-Tech Network
    importers.forEach(imp => {
      sList.push({
        id: imp.uid,
        name: imp.importerName || imp.displayName || 'B2B Importer',
        type: 'importer',
        leadTime: 4 // default b2b transit lead time
      });
    });

    return sList;
  }, [suppliers, importers]);

  // --- DETERMINISTIC FORECASTING CORE ENGINE ---
  const forecasts = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const cutOffTime = today.getTime() - (lookbackDays * 24 * 60 * 60 * 1000);

    // Filter relevant sales in the lookback window
    const windowSales = sales.filter(s => s.createdAt >= cutOffTime);

    return products.map(product => {
      // 1. Calculate sales velocity (quantity of item sold in window)
      let totalUnitsSold = 0;
      windowSales.forEach(sale => {
        // Only run calculations if sale belongs to filtered branch if query is branch-specific
        if (selectedBranchFilter !== 'all') {
          const sBranch = sale.branchId || `main_branch_${ownerId}`;
          const activeMainBranchId = `main_branch_${ownerId}`;
          const targetIsMain = selectedBranchFilter === 'main-branch' || selectedBranchFilter === activeMainBranchId;
          const currentIsMain = sBranch === 'main-branch' || sBranch === activeMainBranchId;
          if (targetIsMain && !currentIsMain) return;
          if (!targetIsMain && sBranch !== selectedBranchFilter) return;
        }

        const item = sale.items?.find(i => i.productId === product.id);
        if (item) {
          totalUnitsSold += item.quantity || 0;
        }
      });

      // Daily sales frequency algorithm
      // Adjust lookup duration if product was created after the lookback window start time to avoid undervaluing newly added products
      const ageInDays = Math.ceil((today.getTime() - product.createdAt) / (1000 * 60 * 60 * 24));
      const effectiveDays = Math.max(1, Math.min(lookbackDays, ageInDays));
      const averageDailySales = totalUnitsSold / effectiveDays;

      // 2. Calculate stock coverage remaining days
      const currentQty = product.quantity || 0;
      const coverageDays = averageDailySales > 0 ? currentQty / averageDailySales : Infinity;

      // 3. Predict Stock-Out Date
      let predictedStockOutDate: string = 'N/A';
      let stockOutTimestamp: number | null = null;
      if (coverageDays !== Infinity) {
        const msRemaining = coverageDays * 24 * 60 * 60 * 1000;
        const outDate = new Date(Date.now() + msRemaining);
        stockOutTimestamp = outDate.getTime();
        predictedStockOutDate = outDate.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }

      // 4. Generate Reorder Recommendations
      // Generate if stock coverage is less than lead time + safety stock OR product is already low stock (<= threshold)
      const targetMinCoverageDays = leadTimeDays + safetyStockDays;
      const isPredictedStockoutDanger = coverageDays <= targetMinCoverageDays;
      const isAlreadyLowStock = currentQty <= (product.lowStockThreshold || 5);
      const requiresReorder = isPredictedStockoutDanger || isAlreadyLowStock;

      // Deterministic replenishment reorder replenishment volume logic
      // Target stock: Daily Sales * (Lead Time + Safety Buffer Day + 30 Days Target Refill Cycle)
      const bufferDaysNeeded = leadTimeDays + safetyStockDays + 30;
      const targetStockQty = Math.ceil(averageDailySales * bufferDaysNeeded);
      
      let recommendedReorderQty = 0;
      if (requiresReorder) {
        if (averageDailySales > 0) {
          recommendedReorderQty = Math.max(0, targetStockQty - currentQty);
        } else {
          // If no sales yet but already below threshold, recommend ordering to double the low-stock-threshold
          recommendedReorderQty = Math.max(0, ((product.lowStockThreshold || 5) * 2) - currentQty);
        }
      }

      // Reorder cost calculation
      const predictedReorderCost = recommendedReorderQty * (product.costPrice || product.price || 0);

      return {
        product,
        totalUnitsSold,
        averageDailySales,
        coverageDays,
        predictedStockOutDate,
        stockOutTimestamp,
        requiresReorder,
        recommendedReorderQty,
        predictedReorderCost,
        targetMinCoverageDays,
        isPredictedStockoutDanger,
        isAlreadyLowStock
      };
    }).sort((a,b) => a.coverageDays - b.coverageDays); // Priority: soonest to run out first
  }, [products, sales, lookbackDays, leadTimeDays, safetyStockDays, selectedBranchFilter, ownerId]);

  // Initializing reorder checkboxes on forecasts change
  useEffect(() => {
    const initialSelections: Record<string, { qty: number; selected: boolean }> = {};
    forecasts.forEach(item => {
      if (item.requiresReorder && item.recommendedReorderQty > 0) {
        initialSelections[item.product.id] = {
          qty: item.recommendedReorderQty,
          selected: true // Default checked for low stock runouts
        };
      }
    });
    setSelectedPOProducts(initialSelections);
  }, [products, lookbackDays, leadTimeDays, safetyStockDays]);

  // Filter forecasts for table display
  const filteredForecasts = useMemo(() => {
    return forecasts.filter(item => {
      // Branch filter on product level
      if (selectedBranchFilter !== 'all') {
        const pBranch = item.product.branchId || `main_branch_${ownerId}`;
        const activeMainBranchId = `main_branch_${ownerId}`;
        const targetIsMain = selectedBranchFilter === 'main-branch' || selectedBranchFilter === activeMainBranchId;
        const currentIsMain = pBranch === 'main-branch' || pBranch === activeMainBranchId;
        if (targetIsMain && !currentIsMain) return false;
        if (!targetIsMain && pBranch !== selectedBranchFilter) return false;
      }

      // Search
      const matchesSearch = item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.product.supplier || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category
      const matchesCategory = selectedCategory === 'all' || item.product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [forecasts, searchQuery, selectedCategory, selectedBranchFilter, ownerId]);

  // Stats summaries
  const criticalRunoutsCount = useMemo(() => {
    return forecasts.filter(item => item.coverageDays <= 7).length;
  }, [forecasts]);

  const warningRunoutsCount = useMemo(() => {
    return forecasts.filter(item => item.coverageDays > 7 && item.coverageDays <= 14).length;
  }, [forecasts]);

  const activeReordersCount = useMemo(() => {
    return Object.values(selectedPOProducts).filter((v: any) => v.selected && v.qty > 0).length;
  }, [selectedPOProducts]);

  const totalEstimatedReorderCost = useMemo(() => {
    return Object.entries(selectedPOProducts)
      .filter(([_, v]: [string, any]) => v.selected && v.qty > 0)
      .reduce((sum, [prodId, v]: [string, any]) => {
        const prod = products.find(p => p.id === prodId);
        const cost = prod ? (prod.costPrice || prod.price || 0) : 0;
        return sum + (v.qty * cost);
      }, 0);
  }, [selectedPOProducts, products]);

  // Checkbox interactions
  const handleCheckboxToggle = (productId: string) => {
    setSelectedPOProducts(prev => {
      const current = prev[productId] || { qty: 0, selected: false };
      return {
        ...prev,
        [productId]: {
          ...current,
          selected: !current.selected
        }
      };
    });
  };

  const handleQtyChange = (productId: string, qty: number) => {
    setSelectedPOProducts(prev => {
      const current = prev[productId] || { qty: 0, selected: false };
      return {
        ...prev,
        [productId]: {
          ...current,
          qty: Math.max(1, qty)
        }
      };
    });
  };

  // Create real Firestore Purchase Order Request
  const handleRaisePO = async () => {
    const selectedItems = Object.entries(selectedPOProducts)
      .filter(([_, value]: [string, any]) => value.selected && value.qty > 0)
      .map(([id, value]: [string, any]) => {
        const prod = products.find(p => p.id === id);
        return {
          productId: id,
          name: prod?.name || 'Unknown item',
          quantity: value.qty,
          unitPrice: prod?.costPrice || prod?.price || 0,
          total: value.qty * (prod?.costPrice || prod?.price || 0),
          quantityReceived: 0
        };
      });

    if (selectedItems.length === 0) {
      alert('Please check at least one product with recommended reorder stock to issue.');
      return;
    }

    setSubmittingPO(true);

    const supInfo = combinedSuppliersList.find(s => s.id === orderSupplierId);
    const destBranch = branches.find(b => b.id === orderBranchId);
    const destWarehouse = warehouses.find(w => w.id === orderWarehouseId);

    const finalPoPayload: any = {
      pharmacyId: ownerId,
      pharmacyName: user.pharmacyName || user.displayName || 'Pharmacy Chain',
      createdById: user.uid,
      createdByName: user.displayName || 'Staff Forecasting Agent',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'pending_approval', // Formal purchase request workflow
      items: selectedItems,
      totalAmount: totalEstimatedReorderCost,
      notes: orderNotes || `Auto-Replenish Recommendation (deterministic prediction with lookback=${lookbackDays}d, buffer=${leadTimeDays+safetyStockDays}d)`
    };

    if (orderBranchId) {
      finalPoPayload.branchId = orderBranchId;
      finalPoPayload.branchName = destBranch?.name || 'Main Branch';
    }
    if (orderWarehouseId) {
      finalPoPayload.warehouseId = orderWarehouseId;
      finalPoPayload.warehouseName = destWarehouse?.name || 'Main Storage';
    }
    if (orderSupplierId && supInfo) {
      finalPoPayload.supplierId = orderSupplierId;
      finalPoPayload.supplierName = supInfo.name;
      finalPoPayload.supplierType = supInfo.type;
    }

    try {
      await addDoc(collection(db, 'purchase_orders'), finalPoPayload);
      alert('Success! B2B Purchase Request for ' + selectedItems.length + ' items generated and submitted for Manager/Owner approval.');
      setShowPOModal(false);
      setOrderNotes('');
      setOrderSupplierId('');
      setOrderBranchId('');
      setOrderWarehouseId('');
      
      // Clear out the successfully processed items
      setSelectedPOProducts(prev => {
        const next = { ...prev };
        selectedItems.forEach(item => {
          if (next[item.productId]) {
            next[item.productId].selected = false;
          }
        });
        return next;
      });
    } catch (e) {
      console.error(e);
      alert('Error saving Purchase Order. Please check connection rules.');
    } finally {
      setSubmittingPO(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div id="intelligent_forecasting_view" className="space-y-6">
      
      {/* Header section */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-[32px] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-slate-950/20">
        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-indigo-300 border border-indigo-400/20 mb-4 animate-pulse">
            <LineChart size={13} /> Real-Time Analytics Running
          </div>
          <h1 className="text-2xl sm:text-3.5xl font-black tracking-tight leading-none mb-3">
            Intelligent Inventory Forecasting
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Deterministic runout predictions and automatic replenishment recommendations based on rolling daily transaction logs. Fully integrated with your procurement pipeline.
          </p>
        </div>
        
        {/* Decorative ambient elements */}
        <div className="absolute top-0 right-0 -m-12 w-64 h-64 bg-indigo-600 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -m-16 w-80 h-80 bg-emerald-500 rounded-full blur-3xl opacity-10 pointer-events-none"></div>
      </div>

      {/* Overview Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stats card 1 */}
        <div id="stat_critical" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl flex items-center gap-4.5 shadow-sm">
          <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Critical Runouts</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 leading-none">{criticalRunoutsCount} Items</h3>
            <p className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-bold">Predicted stockout &le; 7 days</p>
          </div>
        </div>

        {/* Stats card 2 */}
        <div id="stat_warning" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl flex items-center gap-4.5 shadow-sm">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-400 rounded-2xl">
            <HelpCircle size={24} />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Moderate Runouts</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 leading-none">{warningRunoutsCount} Items</h3>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-bold">Predicted stockout 8-14 Days</p>
          </div>
        </div>

        {/* Stats card 3 */}
        <div id="stat_reorder" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl flex items-center gap-4.5 shadow-sm">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Covered / Healthy</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 leading-none">{products.length - (criticalRunoutsCount + warningRunoutsCount)} Items</h3>
            <p className="text-[10px] text-slate-500 mt-1 font-bold">Sufficient stock levels</p>
          </div>
        </div>

        {/* Stats card 4 */}
        <div id="stat_sales_volume" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl flex items-center gap-4.5 shadow-sm">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Daily Sales Rate</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 leading-none">
              {forecasts.reduce((sum, item) => sum + item.averageDailySales, 0).toFixed(1)} qty
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 font-bold">Cumulative outlet daily sales speed</p>
          </div>
        </div>
      </div>

      {/* Live Gemini Country Epidemic & Disease Outbreak Forecaster */}
      <AIEpidemiologicalAlertPanel user={user} />

      {/* Forecasting Dynamic Engine Configurations Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
          <RefreshCw size={14} className="text-blue-500" /> Predictions Calibration Panel
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Lookback window configuration */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex justify-between">
              <span>Historical Sales Window</span>
              <span className="text-blue-500">{lookbackDays} Days back</span>
            </label>
            <select 
              value={lookbackDays}
              onChange={e => setLookbackDays(parseInt(e.target.value))}
              className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-slate-700 dark:text-white outline-none focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="7">Last 7 Days (Short-term swing dynamics)</option>
              <option value="14">Last 14 days (Balanced medium velocity)</option>
              <option value="30">Last 30 days (Standard rolling month average)</option>
              <option value="90">Last 90 days (Long-term seasonality filter)</option>
            </select>
          </div>

          {/* Supplier Lead Time configuration */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex justify-between">
              <span>Standard Supplier Transit (Lead Time)</span>
              <span className="text-indigo-500 font-bold">{leadTimeDays} Days</span>
            </label>
            <div className="flex items-center gap-3">
              <input 
                type="range" 
                min="1" 
                max="30" 
                value={leadTimeDays} 
                onChange={e => setLeadTimeDays(parseInt(e.target.value))}
                className="w-full cursor-pointer accent-indigo-600"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-6 text-right">{leadTimeDays}d</span>
            </div>
            <p className="text-[10px] text-slate-400">Duration in days required for stock to arrive after purchase.</p>
          </div>

          {/* Safety stock buffer size configuration */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex justify-between">
              <span>Safety Stock Guard (Buffer)</span>
              <span className="text-purple-500 font-bold">{safetyStockDays} Days</span>
            </label>
            <div className="flex items-center gap-3">
              <input 
                type="range" 
                min="0" 
                max="30" 
                value={safetyStockDays} 
                onChange={e => setSafetyStockDays(parseInt(e.target.value))}
                className="w-full cursor-pointer accent-purple-600"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-6 text-right">{safetyStockDays}d</span>
            </div>
            <p className="text-[10px] text-slate-400">Extra safety buffer days of inventory to avoid sudden stock-outs.</p>
          </div>
        </div>
      </div>

      {/* Main interactive table and filters container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        
        {/* Table Filters header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                type="text"
                placeholder="Search products by title or default supplier..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 pl-10 pr-4 py-2 text-slate-700 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
              <Filter size={12} className="text-slate-400" />
              <select 
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)}
                className="text-xs bg-transparent dark:text-white font-medium focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((c, idx) => (
                  <option key={idx} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Branch Filter dropdown */}
            {(branches?.length > 0) && (
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
                <Building2 size={12} className="text-slate-400" />
                <select 
                  value={selectedBranchFilter} 
                  onChange={e => setSelectedBranchFilter(e.target.value)}
                  className="text-xs bg-transparent dark:text-white font-medium focus:outline-none"
                >
                  <option value="all">aggregated All Branches</option>
                  <option value="main-branch">Main Branch</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Forecast Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/30">
                <th className="py-3 px-4.5 text-[10px] w-12 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Select</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Medical Product</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Available Qty</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Avg Daily Sales</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Stock Coverage</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Projected Runout</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Reorder Suggestion</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Est. Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-xs">
              {filteredForecasts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-600 italic">
                    No medical products correspond to your filters. Adjust lookback window or review search query.
                  </td>
                </tr>
              ) : (
                filteredForecasts.map((item) => {
                  const prodId = item.product.id;
                  const checkboxState = selectedPOProducts[prodId] || { qty: 0, selected: false };
                  const isChecked = checkboxState.selected;
                  const customQtyVal = checkboxState.qty || 0;

                  // Styling determinations for Stock Coverage Alert Indicators
                  let coverageBadgeColor = 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
                  let isCritical = false;
                  
                  if (item.coverageDays <= 7) {
                    coverageBadgeColor = 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-105';
                    isCritical = true;
                  } else if (item.coverageDays <= 14) {
                    coverageBadgeColor = 'bg-amber-50 text-amber-600 dark:bg-amber-955/20 dark:text-amber-400 border border-amber-105';
                  } else if (item.coverageDays !== Infinity) {
                    coverageBadgeColor = 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400 border border-green-105';
                  }

                  return (
                    <tr 
                      key={prodId} 
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all ${
                        isChecked ? 'bg-indigo-50/20 dark:bg-indigo-950/5 border-l-2 border-indigo-500' : ''
                      }`}
                    >
                      {/* Selection checkbox */}
                      <td className="py-3 px-4.5 text-center">
                        {item.requiresReorder ? (
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleCheckboxToggle(prodId)}
                            className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-slate-700 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase">Safe</span>
                        )}
                      </td>

                      {/* Medical Product */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{item.product.name}</div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          <span>{item.product.category}</span>
                          {item.product.supplier && (
                            <>
                              <span>&bull;</span>
                              <span className="truncate max-w-[120px]">Sup: {item.product.supplier}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Stock quantity */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        {item.product.quantity}
                      </td>

                      {/* Dynamic average daily sales */}
                      <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                        {item.averageDailySales.toFixed(2)} /d
                        <div className="text-[9px] text-slate-400">({item.totalUnitsSold} sold)</div>
                      </td>

                      {/* Dynamic stock coverage countdown */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${coverageBadgeColor}`}>
                          {item.coverageDays === Infinity ? 'Infinite' : `${Math.ceil(item.coverageDays)} Days`}
                        </span>
                      </td>

                      {/* Future Predicted Runout Date */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{item.predictedStockOutDate === 'N/A' ? 'Never' : item.predictedStockOutDate}</span>
                        </div>
                        {isCritical && (
                          <span className="text-[9px] text-red-500 font-bold block mt-0.5">Alert: Out within lead time!</span>
                        )}
                      </td>

                      {/* Reorder Recommendation Inputs */}
                      <td className="py-3 px-4 text-right">
                        {item.requiresReorder ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <input 
                              type="number"
                              min="1"
                              value={customQtyVal}
                              onChange={e => handleQtyChange(prodId, parseInt(e.target.value) || 0)}
                              disabled={!isChecked}
                              className={`w-18 text-right px-2 py-1 rounded-lg border text-xs outline-none ${
                                isChecked 
                                  ? 'bg-white dark:bg-slate-800 border-indigo-400 text-indigo-900 dark:text-indigo-200' 
                                  : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400'
                              }`}
                            />
                            <span className="text-[10px] text-slate-400 uppercase font-black w-6 text-left">Unit</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-emerald-500 font-extrabold uppercase">&bull; Healthy Stock</span>
                        )}
                      </td>

                      {/* Reorder Cost */}
                      <td className="py-3 px-4 text-right font-mono text-slate-800 dark:text-slate-200 font-bold">
                        {item.requiresReorder && customQtyVal > 0 ? (
                          `${(customQtyVal * (item.product.costPrice || item.product.price || 0)).toLocaleString()} ETB`
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Cart Summary and PO Submitter Sticky drawer */}
        {activeReordersCount > 0 && (
          <div className="bg-slate-900 dark:bg-black text-white p-5 rounded-b-3xl border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl relative">
                <ShoppingCart size={18} />
                <span className="absolute -top-1 -right-1 bg-indigo-500 text-[10px] text-white font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {activeReordersCount}
                </span>
              </div>
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wide text-indigo-300">Procurement Reorder Draft ready</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Raised procurement for <span className="font-bold text-white">{activeReordersCount} items</span> yielding total of <span className="font-bold text-white font-mono">{totalEstimatedReorderCost.toLocaleString()} ETB</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPOModal(true)}
              className="bg-indigo-600 text-white hover:bg-indigo-500 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
            >
              Configure & Raise Purchase Order <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Raised Purchase Order Configuration Modal */}
      {showPOModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-800 shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-indigo-750 to-indigo-900 text-white relative">
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                <Layers size={18} /> Configure Corporate purchase Request
              </h3>
              <p className="text-xs text-indigo-200 mt-1">
                Auto-replenish {activeReordersCount} selected forecasting items to your official purchase orders registry.
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Destination Branch picker */}
              {(branches?.length > 0) && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Target Branch (Destination)</label>
                  <select
                    value={orderBranchId}
                    onChange={e => {
                      setOrderBranchId(e.target.value);
                      setOrderWarehouseId(''); // Clear sibling picker
                    }}
                    className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value="">Select target physical branch</option>
                    <option value="main-branch">Main Branch</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Destination Warehouse picker */}
              {(warehouses?.length > 0) && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Target Warehouse (Alternative Destination)</label>
                  <select
                    value={orderWarehouseId}
                    onChange={e => {
                      setOrderWarehouseId(e.target.value);
                      setOrderBranchId(''); // Clear sibling picker
                    }}
                    className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value="">Select target storage warehouse</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Supplier Picker */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Matched Supplier / Importer</label>
                <select
                  value={orderSupplierId}
                  onChange={e => setOrderSupplierId(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                >
                  <option value="">None (Generic / Open Bid Purchase Request)</option>
                  {combinedSuppliersList.map(sup => (
                    <option key={sup.id} value={sup.id}>
                      [{sup.type.toUpperCase()}] {sup.name} (Avg Lead: {sup.leadTime} days)
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Order Instructions / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Insert custom specifications or terms if required..."
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Total Summary Cost check */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-500">Order Subtotal (Excl. VAT):</span>
                  <span className="font-bold font-mono text-slate-700 dark:text-slate-300">{totalEstimatedReorderCost.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-500">VAT (15%):</span>
                  <span className="font-bold font-mono text-slate-600 dark:text-slate-400">{(totalEstimatedReorderCost * 0.15).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-1.5">
                  <span className="font-extrabold text-slate-600 dark:text-slate-300">Total Est. (Incl. 15% VAT):</span>
                  <span className="font-black font-mono text-slate-900 dark:text-white text-base">{(totalEstimatedReorderCost * 1.15).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB</span>
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-150 dark:border-slate-800/80 flex justify-end gap-3.5">
              <button
                onClick={() => setShowPOModal(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRaisePO}
                disabled={submittingPO}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-xs font-black transition-all shadow-md shadow-indigo-600/10 flex items-center gap-2 cursor-pointer disabled:opacity-55"
              >
                {submittingPO ? 'Submitting Request...' : (
                  <>Submit Purchase Request <ArrowRight size={14} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
