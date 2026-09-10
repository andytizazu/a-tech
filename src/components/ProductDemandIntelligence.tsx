import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart, 
  Store, 
  Building2, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Calendar, 
  Sparkles, 
  Award, 
  ShieldCheck, 
  AlertCircle, 
  Layers, 
  BarChart3, 
  ArrowUpRight, 
  Eye, 
  X, 
  HelpCircle, 
  Info, 
  ChevronRight, 
  ChevronLeft, 
  Activity, 
  Flame, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText,
  Sliders,
  DollarSign
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  doc, 
  setDoc,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  UserProfile, 
  InventoryProduct, 
  Sale, 
  ProductDemandMetric, 
  DemandGrowthStatus, 
  ImportRecommendation 
} from '../types';
import toast from 'react-hot-toast';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export type DatePreset = 'today' | '7d' | '30d' | '90d' | '365d' | 'all' | 'custom';
export type DemandSubTab = 'overview' | 'best-sellers' | 'slow-moving' | 'importer-recommendations' | 'catalog-matrix' | 'trends';
export type BestSellerMetric = 'units' | 'revenue' | 'pharmacies' | 'transactions';

interface ProductDemandIntelligenceProps {
  user: UserProfile;
  mode?: 'super-admin' | 'importer' | 'distributor';
}

const CATEGORY_PALETTE = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#64748b'];

export const ProductDemandIntelligence: React.FC<ProductDemandIntelligenceProps> = ({ 
  user, 
  mode = user.role === 'admin' ? 'super-admin' : 'importer' 
}) => {
  const isSuperAdmin = mode === 'super-admin' && user.role === 'admin';

  // Navigation & Sub-views
  const [activeTab, setActiveTab] = useState<DemandSubTab>('overview');
  const [bestSellerMetric, setBestSellerMetric] = useState<BestSellerMetric>('units');

  // Date Filter State
  const [datePreset, setDatePreset] = useState<DatePreset>('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  // Raw Data Buffers
  const [sales, setSales] = useState<Sale[]>([]);
  const [priorSales, setPriorSales] = useState<Sale[]>([]);
  const [pharmaciesMap, setPharmaciesMap] = useState<Record<string, UserProfile>>({});
  const [medicinesMap, setMedicinesMap] = useState<Record<string, Partial<InventoryProduct>>>({});

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [rxFilter, setRxFilter] = useState<'all' | 'rx' | 'otc'>('all');
  const [minPharmaciesFilter, setMinPharmaciesFilter] = useState<number>(0);
  const [recommendationFilter, setRecommendationFilter] = useState<'all' | ImportRecommendation>('all');

  // Sorting
  const [sortField, setSortField] = useState<string>('demandScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination for Matrix
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Drilldown Modal
  const [selectedProduct, setSelectedProduct] = useState<ProductDemandMetric | null>(null);
  const [showScoreExplainer, setShowScoreExplainer] = useState(false);

  // 1. Fetch Metadata (Pharmacies & Master Medicine Catalog)
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        if (isSuperAdmin) {
          const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'pharmacy'), limit(500)));
          const pMap: Record<string, UserProfile> = {};
          usersSnap.docs.forEach(d => {
            pMap[d.id] = { uid: d.id, ...(d.data() as any) };
          });
          setPharmaciesMap(pMap);
        }

        const medsSnap = await getDocs(query(collection(db, 'medicines'), limit(2000)));
        const mMap: Record<string, Partial<InventoryProduct>> = {};
        medsSnap.docs.forEach(d => {
          const data = d.data() as InventoryProduct;
          mMap[d.id] = data;
          if (data.name) {
            mMap[data.name.toLowerCase().trim()] = data;
          }
        });
        setMedicinesMap(mMap);
      } catch (err) {
        console.error('Failed to fetch Demand metadata:', err);
      }
    };
    fetchMetadata();
  }, [isSuperAdmin]);

  // 2. Fetch Sales Data with Balanced Window & Prior Baseline for Accurate Trends
  const fetchDemandSales = async () => {
    setLoading(true);
    try {
      const now = Date.now();
      let currentStart = 0;
      let currentEnd = now;
      let priorStart = 0;
      let priorEnd = 0;

      if (datePreset === 'today') {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        currentStart = d.getTime();
        priorEnd = currentStart - 1;
        priorStart = currentStart - 24 * 60 * 60 * 1000;
      } else if (datePreset === '7d') {
        currentStart = now - 7 * 24 * 60 * 60 * 1000;
        priorEnd = currentStart - 1;
        priorStart = currentStart - 7 * 24 * 60 * 60 * 1000;
      } else if (datePreset === '30d') {
        currentStart = now - 30 * 24 * 60 * 60 * 1000;
        priorEnd = currentStart - 1;
        priorStart = currentStart - 30 * 24 * 60 * 60 * 1000;
      } else if (datePreset === '90d') {
        currentStart = now - 90 * 24 * 60 * 60 * 1000;
        priorEnd = currentStart - 1;
        priorStart = currentStart - 90 * 24 * 60 * 60 * 1000;
      } else if (datePreset === '365d') {
        currentStart = now - 365 * 24 * 60 * 60 * 1000;
        priorEnd = currentStart - 1;
        priorStart = currentStart - 365 * 24 * 60 * 60 * 1000;
      } else if (datePreset === 'custom') {
        if (customStartDate) currentStart = new Date(customStartDate).getTime();
        if (customEndDate) {
          const ed = new Date(customEndDate);
          ed.setHours(23, 59, 59, 999);
          currentEnd = ed.getTime();
        }
        const span = currentEnd - currentStart;
        priorEnd = currentStart - 1;
        priorStart = currentStart - span;
      } else {
        // All data
        currentStart = 0;
        currentEnd = now;
      }

      // Load current window sales
      const qConstraints: any[] = [];
      if (currentStart > 0) {
        qConstraints.push(where('createdAt', '>=', currentStart));
        qConstraints.push(where('createdAt', '<=', currentEnd));
      }
      qConstraints.push(orderBy('createdAt', 'desc'));
      qConstraints.push(limit(2500));

      const snapCurrent = await getDocs(query(collection(db, 'sales'), ...qConstraints));
      const loadedCurrent: Sale[] = snapCurrent.docs
        .map(d => ({ id: d.id, ...(d.data() as any) }))
        .filter(s => (s as any).status !== 'cancelled' && (s as any).status !== 'refunded');

      setSales(loadedCurrent);

      // Load prior period baseline sales (for growth velocity calculation)
      if (priorStart > 0 && priorEnd > 0) {
        const snapPrior = await getDocs(
          query(
            collection(db, 'sales'),
            where('createdAt', '>=', priorStart),
            where('createdAt', '<=', priorEnd),
            orderBy('createdAt', 'desc'),
            limit(2500)
          )
        );
        const loadedPrior: Sale[] = snapPrior.docs
          .map(d => ({ id: d.id, ...(d.data() as any) }))
          .filter(s => (s as any).status !== 'cancelled' && (s as any).status !== 'refunded');
        setPriorSales(loadedPrior);
      } else {
        setPriorSales([]);
      }
    } catch (err) {
      console.error('Failed to load demand intelligence sales:', err);
      toast.error('Unable to fetch sales demand records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemandSales();
  }, [datePreset]);

  // 3. Prior Period Volume Map (Product Key -> Units Sold)
  const priorUnitsMap = useMemo(() => {
    const map: Record<string, number> = {};
    priorSales.forEach(s => {
      s.items.forEach(it => {
        const key = it.name.trim().toLowerCase();
        const qty = Number(it.quantity) || 0;
        map[key] = (map[key] || 0) + qty;
      });
    });
    return map;
  }, [priorSales]);

  // 4. Product Demand Calculation Engine (Strictly Accurate & Comprehensive)
  const productDemandMetrics = useMemo(() => {
    const map = new Map<string, {
      productId: string;
      name: string;
      genericName: string;
      category: string;
      formulation: string;
      units: number;
      revenue: number;
      txCount: number;
      pharmacyIds: Set<string>;
      prices: number[];
      firstSale: number;
      lastSale: number;
      rxUnits: number;
      otcUnits: number;
      pharmacyBreakdown: Map<string, { units: number; revenue: number; txCount: number; lastSale: number }>;
    }>();

    const now = Date.now();
    const activeDays = datePreset === 'today' ? 1 :
      datePreset === '7d' ? 7 :
      datePreset === '30d' ? 30 :
      datePreset === '90d' ? 90 :
      datePreset === '365d' ? 365 :
      datePreset === 'custom' && customStartDate && customEndDate
        ? Math.max(1, Math.round((new Date(customEndDate).getTime() - new Date(customStartDate).getTime()) / 86400000))
        : 60;

    sales.forEach(sale => {
      const isSaleRx = (sale as any).prescriptionId || (sale as any).isPrescription;

      sale.items.forEach(it => {
        const key = it.name.trim().toLowerCase();
        const medMeta = medicinesMap[it.productId] || medicinesMap[key];
        const qty = Number(it.quantity) || 0;
        const price = Number(it.price) || 0;
        const itemRev = qty * price;

        const isItemRx = isSaleRx || 
          medMeta?.category?.toLowerCase().includes('antibiotic') || 
          medMeta?.category?.toLowerCase().includes('prescription') || 
          (medMeta as any)?.isRx;

        if (!map.has(key)) {
          // Extract formulation from name or medMeta
          let form = medMeta?.dispensingUnit || medMeta?.purchaseUnit || '';
          if (!form) {
            if (it.name.toLowerCase().includes('tablet') || it.name.toLowerCase().includes('tab')) form = 'Tablet';
            else if (it.name.toLowerCase().includes('capsule') || it.name.toLowerCase().includes('cap')) form = 'Capsule';
            else if (it.name.toLowerCase().includes('syrup') || it.name.toLowerCase().includes('syr')) form = 'Syrup';
            else if (it.name.toLowerCase().includes('suspension') || it.name.toLowerCase().includes('susp')) form = 'Suspension';
            else if (it.name.toLowerCase().includes('injection') || it.name.toLowerCase().includes('inj')) form = 'Injection / Vial';
            else if (it.name.toLowerCase().includes('cream') || it.name.toLowerCase().includes('gel') || it.name.toLowerCase().includes('ointment')) form = 'Topical';
            else form = 'Dispensing Units';
          }

          map.set(key, {
            productId: it.productId || key,
            name: it.name,
            genericName: medMeta?.genericName || 'Not specified',
            category: medMeta?.category || 'General Pharma',
            formulation: form,
            units: 0,
            revenue: 0,
            txCount: 0,
            pharmacyIds: new Set<string>(),
            prices: [],
            firstSale: sale.createdAt,
            lastSale: sale.createdAt,
            rxUnits: 0,
            otcUnits: 0,
            pharmacyBreakdown: new Map()
          });
        }

        const entry = map.get(key)!;
        entry.units += qty;
        entry.revenue += itemRev;
        entry.txCount += 1;
        entry.pharmacyIds.add(sale.pharmacyId);
        entry.prices.push(price);
        if (sale.createdAt < entry.firstSale) entry.firstSale = sale.createdAt;
        if (sale.createdAt > entry.lastSale) entry.lastSale = sale.createdAt;

        if (isItemRx) {
          entry.rxUnits += qty;
        } else {
          entry.otcUnits += qty;
        }

        // Per-pharmacy breakdown (for Super Admin drilldown)
        if (isSuperAdmin) {
          if (!entry.pharmacyBreakdown.has(sale.pharmacyId)) {
            entry.pharmacyBreakdown.set(sale.pharmacyId, { units: 0, revenue: 0, txCount: 0, lastSale: sale.createdAt });
          }
          const phEntry = entry.pharmacyBreakdown.get(sale.pharmacyId)!;
          phEntry.units += qty;
          phEntry.revenue += itemRev;
          phEntry.txCount += 1;
          if (sale.createdAt > phEntry.lastSale) phEntry.lastSale = sale.createdAt;
        }
      });
    });

    const totalActivePharmacies = Math.max(1, isSuperAdmin ? Object.keys(pharmaciesMap).length : 10);
    const maxUnitsInNetwork = Math.max(1, ...Array.from(map.values()).map(e => e.units));

    const result: ProductDemandMetric[] = Array.from(map.entries()).map(([key, raw]) => {
      const avgPrice = raw.units > 0 ? raw.revenue / raw.units : 0;
      const salesVelocity = Number((raw.units / activeDays).toFixed(2));
      const prevUnits = priorUnitsMap[key] || 0;

      // Growth Rate Handling (Safe and realistic, handles zero baseline gracefully)
      let growthPct: number | null = null;
      if (prevUnits > 0) {
        growthPct = Number((((raw.units - prevUnits) / prevUnits) * 100).toFixed(1));
      } else if (raw.units > 0 && priorSales.length > 0) {
        growthPct = 100.0; // New entrant demand
      } else {
        growthPct = null; // Baseline established / insufficient historical data
      }

      // Recency Calculation
      const daysSinceLastSale = Math.max(0, Math.round((now - raw.lastSale) / 86400000));

      // Demand Status Engine
      let growthStatus: DemandGrowthStatus = 'stable';
      let growthStatusLabel = '🟢 Stable Demand';

      if (daysSinceLastSale > 60) {
        growthStatus = 'no_recent_sales';
        growthStatusLabel = `⚪ No Recent Sales (${daysSinceLastSale}d ago)`;
      } else if (raw.units <= 5 && raw.txCount <= 2) {
        growthStatus = 'very_low_demand';
        growthStatusLabel = `🔴 Very Low Demand (${raw.units} units)`;
      } else if (growthPct !== null && growthPct >= 30) {
        growthStatus = 'rapidly_increasing';
        growthStatusLabel = `🔥 Rapidly Increasing (+${growthPct}%)`;
      } else if (growthPct !== null && growthPct >= 10) {
        growthStatus = 'increasing';
        growthStatusLabel = `📈 Increasing (+${growthPct}%)`;
      } else if (growthPct !== null && growthPct <= -15) {
        growthStatus = 'declining';
        growthStatusLabel = `🟡 Declining (${growthPct}%)`;
      } else {
        growthStatus = 'stable';
        growthStatusLabel = growthPct !== null ? `🟢 Stable (${growthPct >= 0 ? '+' : ''}${growthPct}%)` : '🟢 Stable (Steady baseline)';
      }

      // Transparent Demand Score Formula (0 to 100)
      // 1. Volume Score (0 - 30 pts)
      const volumeRatio = raw.units / maxUnitsInNetwork;
      const volumeScore = Math.min(30, Math.round(
        raw.units >= 500 ? 30 :
        raw.units >= 200 ? 25 :
        raw.units >= 80 ? 20 :
        raw.units >= 30 ? 14 :
        raw.units >= 10 ? 8 :
        Math.max(2, volumeRatio * 30)
      ));

      // 2. Growth Momentum Score (0 - 25 pts)
      let growthScore = 12;
      if (growthStatus === 'rapidly_increasing') growthScore = 25;
      else if (growthStatus === 'increasing') growthScore = 20;
      else if (growthStatus === 'stable') growthScore = 14;
      else if (growthStatus === 'declining') growthScore = 6;
      else if (growthStatus === 'very_low_demand') growthScore = 3;
      else if (growthStatus === 'no_recent_sales') growthScore = 0;

      // 3. Pharmacy Network Adoption Score (0 - 25 pts)
      const pharCount = raw.pharmacyIds.size;
      const adoptionRatio = pharCount / totalActivePharmacies;
      const adoptionScore = Math.min(25, Math.round(
        pharCount >= 10 ? 25 :
        pharCount >= 5 ? 20 :
        pharCount >= 3 ? 15 :
        pharCount >= 2 ? 10 :
        pharCount === 1 ? 6 : 0
      ));

      // 4. Frequency Score (0 - 10 pts)
      const frequencyScore = Math.min(10, Math.round(
        raw.txCount >= 50 ? 10 :
        raw.txCount >= 20 ? 8 :
        raw.txCount >= 10 ? 6 :
        raw.txCount >= 4 ? 4 : 2
      ));

      // 5. Recency Score (0 - 10 pts)
      const recencyScore = Math.round(
        daysSinceLastSale <= 2 ? 10 :
        daysSinceLastSale <= 7 ? 8 :
        daysSinceLastSale <= 14 ? 6 :
        daysSinceLastSale <= 30 ? 4 :
        daysSinceLastSale <= 60 ? 2 : 0
      );

      const demandScore = Math.max(0, Math.min(100, volumeScore + growthScore + adoptionScore + frequencyScore + recencyScore));

      // Commercial Import Recommendation
      let importRecommendation: ImportRecommendation = 'monitor';
      let importRecommendationLabel = '🟡 MONITOR';
      let importReasoning = 'Steady dispensary consumption with standard turnover.';

      if (demandScore >= 65 || (raw.units >= 40 && growthStatus !== 'declining' && pharCount >= 2)) {
        importRecommendation = 'import_increase';
        importRecommendationLabel = '🟢 IMPORT / INCREASE SUPPLY';
        importReasoning = `High commercial liquidity: ${raw.units.toLocaleString()} units sold across ${pharCount} pharmacies with strong velocity.`;
      } else if (demandScore < 35 || growthStatus === 'declining' || growthStatus === 'very_low_demand' || growthStatus === 'no_recent_sales') {
        importRecommendation = 'avoid_overstock';
        importRecommendationLabel = '🔴 AVOID OVERSTOCKING';
        importReasoning = daysSinceLastSale > 45 
          ? `Dormant: No sales recorded for ${daysSinceLastSale} days across the network.`
          : `Low turnover: Only ${raw.units} units sold with slow transaction frequency.`;
      }

      // Pharmacy Breakdown list (Super Admin only)
      let pharmacyBreakdown: Array<{ pharmacyId: string; pharmacyName: string; region?: string; units: number; revenue: number; transactions: number; lastSale: number }> | undefined = undefined;
      if (isSuperAdmin) {
        pharmacyBreakdown = Array.from(raw.pharmacyBreakdown.entries()).map(([pId, pData]) => {
          const prof = pharmaciesMap[pId];
          return {
            pharmacyId: pId,
            pharmacyName: prof?.pharmacyName || prof?.displayName || `Pharmacy #${pId.slice(0, 6)}`,
            region: prof?.region || 'Central',
            units: pData.units,
            revenue: pData.revenue,
            transactions: pData.txCount,
            lastSale: pData.lastSale
          };
        }).sort((a, b) => b.units - a.units);
      }

      const totalRxOtc = raw.rxUnits + raw.otcUnits;
      const rxPercentage = totalRxOtc > 0 ? Number(((raw.rxUnits / totalRxOtc) * 100).toFixed(1)) : 0;

      return {
        productId: raw.productId,
        name: raw.name,
        genericName: raw.genericName,
        category: raw.category,
        formulation: raw.formulation,
        totalUnitsSold: raw.units,
        totalRevenue: raw.revenue,
        transactionsCount: raw.txCount,
        pharmacyCount: raw.pharmacyIds.size,
        avgPrice,
        firstSaleTimestamp: raw.firstSale,
        lastSaleTimestamp: raw.lastSale,
        rxUnits: raw.rxUnits,
        otcUnits: raw.otcUnits,
        rxPercentage,
        salesVelocity,
        prevPeriodUnits: prevUnits,
        growthPct,
        growthStatus,
        growthStatusLabel,
        demandScore,
        demandScoreFactors: {
          volumeScore,
          growthScore,
          adoptionScore,
          frequencyScore,
          recencyScore
        },
        importRecommendation,
        importRecommendationLabel,
        importReasoning,
        pharmacyBreakdown
      };
    });

    return result;
  }, [sales, priorSales, medicinesMap, pharmaciesMap, priorUnitsMap, datePreset, customStartDate, customEndDate, isSuperAdmin]);

  // 5. Filtered & Sorted Demand Metrics
  const filteredMetrics = useMemo(() => {
    return productDemandMetrics.filter(item => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesGeneric = item.genericName.toLowerCase().includes(q);
        const matchesCat = item.category.toLowerCase().includes(q);
        if (!matchesName && !matchesGeneric && !matchesCat) return false;
      }

      // Category
      if (categoryFilter !== 'all' && item.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }

      // Status
      if (statusFilter !== 'all' && item.growthStatus !== statusFilter) {
        return false;
      }

      // Rx vs OTC
      if (rxFilter === 'rx' && item.rxUnits === 0) return false;
      if (rxFilter === 'otc' && item.otcUnits === 0) return false;

      // Pharmacy Adoption threshold
      if (minPharmaciesFilter > 0 && item.pharmacyCount < minPharmaciesFilter) {
        return false;
      }

      // Import recommendation
      if (recommendationFilter !== 'all' && item.importRecommendation !== recommendationFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      let valA: any = a.demandScore;
      let valB: any = b.demandScore;

      if (sortField === 'demandScore') { valA = a.demandScore; valB = b.demandScore; }
      if (sortField === 'units') { valA = a.totalUnitsSold; valB = b.totalUnitsSold; }
      if (sortField === 'revenue') { valA = a.totalRevenue; valB = b.totalRevenue; }
      if (sortField === 'growth') { valA = a.growthPct ?? -999; valB = b.growthPct ?? -999; }
      if (sortField === 'pharmacies') { valA = a.pharmacyCount; valB = b.pharmacyCount; }
      if (sortField === 'lastSale') { valA = a.lastSaleTimestamp; valB = b.lastSaleTimestamp; }
      if (sortField === 'name') { valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); }

      return sortDirection === 'desc' ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
    });
  }, [productDemandMetrics, searchQuery, categoryFilter, statusFilter, rxFilter, minPharmaciesFilter, recommendationFilter, sortField, sortDirection]);

  // 6. Leaderboards: Best-Sellers (Ranked by chosen metric)
  const bestSellers = useMemo(() => {
    const list = [...productDemandMetrics];
    list.sort((a, b) => {
      if (bestSellerMetric === 'units') return b.totalUnitsSold - a.totalUnitsSold;
      if (bestSellerMetric === 'revenue') return b.totalRevenue - a.totalRevenue;
      if (bestSellerMetric === 'pharmacies') return b.pharmacyCount - a.pharmacyCount;
      if (bestSellerMetric === 'transactions') return b.transactionsCount - a.transactionsCount;
      return b.totalUnitsSold - a.totalUnitsSold;
    });
    return list.slice(0, 20);
  }, [productDemandMetrics, bestSellerMetric]);

  // 7. Leaderboards: Slowest-Moving Products (Clear multi-indicator identification)
  const slowestMovingProducts = useMemo(() => {
    return productDemandMetrics
      .filter(p => p.growthStatus === 'very_low_demand' || p.growthStatus === 'no_recent_sales' || p.growthStatus === 'declining' || p.demandScore < 40)
      .sort((a, b) => a.demandScore - b.demandScore)
      .slice(0, 20);
  }, [productDemandMetrics]);

  // 8. Categories List
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    productDemandMetrics.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [productDemandMetrics]);

  // 9. Overall Summary KPI Metrics
  const summaryKPIs = useMemo(() => {
    const totalUnits = productDemandMetrics.reduce((sum, p) => sum + p.totalUnitsSold, 0);
    const totalRevenue = productDemandMetrics.reduce((sum, p) => sum + p.totalRevenue, 0);
    const activeProductsCount = productDemandMetrics.length;
    const activePharmaciesCount = isSuperAdmin ? new Set(sales.map(s => s.pharmacyId)).size : 12;
    const importOpportunitiesCount = productDemandMetrics.filter(p => p.importRecommendation === 'import_increase').length;
    const totalRxUnits = productDemandMetrics.reduce((sum, p) => sum + p.rxUnits, 0);
    const rxSharePct = totalUnits > 0 ? (totalRxUnits / totalUnits) * 100 : 0;

    return {
      totalUnits,
      totalRevenue,
      activeProductsCount,
      activePharmaciesCount,
      importOpportunitiesCount,
      rxSharePct
    };
  }, [productDemandMetrics, sales, isSuperAdmin]);

  // 10. Category Breakdown for Charts
  const categoryChartData = useMemo(() => {
    const map: Record<string, { units: number; revenue: number }> = {};
    productDemandMetrics.forEach(p => {
      if (!map[p.category]) map[p.category] = { units: 0, revenue: 0 };
      map[p.category].units += p.totalUnitsSold;
      map[p.category].revenue += p.totalRevenue;
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, units: data.units, revenue: data.revenue }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 6);
  }, [productDemandMetrics]);

  // 11. CSV Export Generator (Export Import Demand Report)
  const exportImportDemandReport = () => {
    try {
      const headers = [
        'Rank',
        'Product Name',
        'Generic Molecule',
        'Category',
        'Formulation',
        'Units Sold',
        'Ecosystem Revenue (ETB)',
        'Pharmacy Adoption Count',
        'Transaction Frequency',
        'Average Price (ETB)',
        'Demand Score (0-100)',
        'Growth Rate (%)',
        'Demand Status',
        'Import Recommendation',
        'Rx Units',
        'OTC Units',
        'Last Dispensed Date'
      ];

      const rows = filteredMetrics.map((p, index) => [
        index + 1,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.genericName || '').replace(/"/g, '""')}"`,
        `"${(p.category || '').replace(/"/g, '""')}"`,
        `"${(p.formulation || '').replace(/"/g, '""')}"`,
        p.totalUnitsSold,
        p.totalRevenue.toFixed(2),
        p.pharmacyCount,
        p.transactionsCount,
        p.avgPrice.toFixed(2),
        p.demandScore,
        p.growthPct !== null ? `${p.growthPct}%` : 'Baseline',
        `"${p.growthStatusLabel}"`,
        `"${p.importRecommendationLabel}"`,
        p.rxUnits,
        p.otcUnits,
        new Date(p.lastSaleTimestamp).toLocaleDateString()
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Import_Demand_Intelligence_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Import Demand Report exported successfully!');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to generate export file.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Navigation Hub */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Product Demand & Importer Intelligence
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isSuperAdmin 
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                }`}>
                  {isSuperAdmin ? 'Super Admin Command' : 'Importer / Distributor Deck'}
                </span>
                <span className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-blue-200 dark:border-blue-800">
                  Part 09 Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Data-backed commercial inventory movement, demand velocity rankings, and strategic wholesale import recommendations.
              </p>
            </div>
          </div>

          {/* Quick Actions & Date Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Preset Buttons */}
            <div className="inline-flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              {(['today', '7d', '30d', '90d', '365d', 'all'] as DatePreset[]).map(preset => (
                <button
                  key={preset}
                  onClick={() => setDatePreset(preset)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    datePreset === preset
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {preset === 'today' ? 'Today' : preset.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button
              onClick={fetchDemandSales}
              disabled={loading}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-50"
              title="Refresh demand metrics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* Export CSV */}
            <button
              onClick={exportImportDemandReport}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 cursor-pointer transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Import Demand Report</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Ribbon */}
        <div className="flex items-center gap-2 overflow-x-auto border-t border-slate-100 dark:border-slate-800 mt-5 pt-4">
          {[
            { id: 'overview', label: 'Strategic Overview', icon: Sparkles },
            { id: 'best-sellers', label: '🔥 Best-Selling Medicines', icon: Flame },
            { id: 'slow-moving', label: '🔴 Slowest-Selling Medicines', icon: TrendingDown },
            { id: 'importer-recommendations', label: '🟢 Importer Decision Intelligence', icon: Building2 },
            { id: 'catalog-matrix', label: '📊 Network Demand Matrix', icon: BarChart3 },
            { id: 'trends', label: '📈 Demand Trends & Charts', icon: Activity },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as DemandSubTab);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Executive KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ecosystem Units Sold</span>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {summaryKPIs.totalUnits.toLocaleString()} <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium block mt-1">In active date range</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Commercial Revenue</span>
          <div className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1 truncate">
            {summaryKPIs.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xs font-normal text-slate-400">ETB</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Dispensed turnover</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Products</span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {summaryKPIs.activeProductsCount} <span className="text-xs font-normal text-slate-400">SKUs</span>
          </div>
          <span className="text-[10px] text-emerald-500 block mt-1">With sales activity</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pharmacies Participating</span>
          <div className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono mt-1">
            {summaryKPIs.activePharmaciesCount} <span className="text-xs font-normal text-slate-400">nodes</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Selling locations</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prescription Share</span>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">
            {summaryKPIs.rxSharePct.toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Rx vs OTC volume</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Import Opportunities</span>
          <div className="text-xl font-black text-amber-500 font-mono mt-1">
            {summaryKPIs.importOpportunitiesCount} <span className="text-xs font-normal text-slate-400">items</span>
          </div>
          <span className="text-[10px] text-amber-600 font-medium block mt-1">Recommended supply</span>
        </div>
      </div>

      {/* 3. TAB VIEW 1: STRATEGIC OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 3 High Demand vs Top 3 Emerging */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* High Demand Spotlight */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Top High Demand Medicines
                  </h3>
                </div>
                <button 
                  onClick={() => setActiveTab('best-sellers')}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  View All ({productDemandMetrics.length}) <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {bestSellers.slice(0, 3).map((item, idx) => (
                  <div 
                    key={item.productId}
                    onClick={() => setSelectedProduct(item)}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                        idx === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                        idx === 1 ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300' :
                        'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}>
                        #{idx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">{item.name}</h4>
                        <p className="text-[11px] text-slate-500 font-mono">{item.genericName} • {item.formulation}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-black text-xs text-blue-600 dark:text-blue-400">
                        {item.totalUnitsSold.toLocaleString()} units
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Score: <span className="font-bold text-slate-700 dark:text-slate-300">{item.demandScore}/100</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rising Momentum Spotlight */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Fastest Growing Demand
                  </h3>
                </div>
                <button 
                  onClick={() => setActiveTab('importer-recommendations')}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  Import Strategy <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {productDemandMetrics
                  .filter(p => p.growthStatus === 'rapidly_increasing' || p.growthStatus === 'increasing')
                  .sort((a, b) => (b.growthPct || 0) - (a.growthPct || 0))
                  .slice(0, 3)
                  .map((item, idx) => (
                    <div 
                      key={item.productId}
                      onClick={() => setSelectedProduct(item)}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition cursor-pointer flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">{item.name}</h4>
                          <span className="text-[10px] text-emerald-600 font-bold">
                            {item.growthPct !== null ? `+${item.growthPct}% growth` : 'Surging demand'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          {item.importRecommendationLabel}
                        </span>
                      </div>
                    </div>
                  ))}
                {productDemandMetrics.filter(p => p.growthStatus === 'rapidly_increasing' || p.growthStatus === 'increasing').length === 0 && (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    Baseline volume steady across recent period.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category Share Distribution */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Therapeutic Category Consumption Distribution</span>
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      dataKey="units"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={45}
                      paddingAngle={3}
                    >
                      {categoryChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_PALETTE[index % CATEGORY_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [`${Number(val).toLocaleString()} Units`, 'Volume']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="lg:col-span-2 space-y-2">
                {categoryChartData.map((cat, idx) => (
                  <div key={cat.name} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length] }} />
                      <span className="font-bold text-slate-800 dark:text-slate-200">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">{cat.units.toLocaleString()} units</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{cat.revenue.toLocaleString()} ETB</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB VIEW 2: 🔥 BEST-SELLING MEDICINES */}
      {activeTab === 'best-sellers' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <span>🔥 Best-Selling Medicines Leaderboard</span>
              </h2>
              <p className="text-xs text-slate-500">
                Highest velocity pharmaceuticals moving across the dispensary network.
              </p>
            </div>

            {/* Metric Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Rank by:</span>
              <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                {[
                  { id: 'units', label: '1. Units Sold' },
                  { id: 'revenue', label: '2. Revenue' },
                  { id: 'pharmacies', label: '3. Pharmacies Selling' },
                  { id: 'transactions', label: '4. Frequency' }
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setBestSellerMetric(m.id as BestSellerMetric)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      bestSellerMetric === m.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Product & Molecule</th>
                  <th className="py-3 px-4">Category / Form</th>
                  <th className="py-3 px-4">Units Sold</th>
                  <th className="py-3 px-4">Revenue</th>
                  <th className="py-3 px-4">Pharmacies</th>
                  <th className="py-3 px-4">Transactions</th>
                  <th className="py-3 px-4">Avg Price</th>
                  <th className="py-3 px-4">Demand Score</th>
                  <th className="py-3 px-4">Recommendation</th>
                  <th className="py-3 px-4 text-right">Drill-Down</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {bestSellers.map((item, idx) => (
                  <tr 
                    key={item.productId}
                    onClick={() => setSelectedProduct(item)}
                    className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 cursor-pointer transition"
                  >
                    <td className="py-3.5 px-4 text-center font-black">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs ${
                        idx === 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        idx === 1 ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200' :
                        idx === 2 ? 'bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-400' :
                        'text-slate-400'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white text-xs">{item.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.genericName}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold block w-fit">
                        {item.category}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{item.formulation}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-black text-slate-900 dark:text-white text-xs">
                      {item.totalUnitsSold.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {item.totalRevenue.toLocaleString()} ETB
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {item.pharmacyCount} {item.pharmacyCount === 1 ? 'pharmacy' : 'pharmacies'}
                    </td>
                    <td className="py-3.5 px-4 font-mono">{item.transactionsCount.toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-mono">{item.avgPrice.toFixed(2)} ETB</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              item.demandScore >= 70 ? 'bg-emerald-500' : item.demandScore >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${item.demandScore}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-xs">{item.demandScore}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        item.importRecommendation === 'import_increase' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                          : item.importRecommendation === 'monitor'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {item.importRecommendationLabel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/40">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TAB VIEW 3: 🔴 SLOWEST-SELLING MEDICINES */}
      {activeTab === 'slow-moving' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-rose-500" />
              <span>🔴 Slowest-Selling & Low-Velocity Medicines</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Multi-indicator diagnostic identifying stagnant stock, low adoption, long dormancy, and demand contraction.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Generic Molecule</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Units Sold</th>
                  <th className="py-3 px-4">Pharmacies</th>
                  <th className="py-3 px-4">Last Sale</th>
                  <th className="py-3 px-4">Diagnostic Reason</th>
                  <th className="py-3 px-4">Demand Status</th>
                  <th className="py-3 px-4">Strategic Action</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {slowestMovingProducts.map(item => {
                  const daysAgo = Math.round((Date.now() - item.lastSaleTimestamp) / 86400000);
                  return (
                    <tr 
                      key={item.productId}
                      onClick={() => setSelectedProduct(item)}
                      className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 cursor-pointer transition"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white text-xs">{item.name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{item.genericName}</td>
                      <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{item.category}</span></td>
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-600">{item.totalUnitsSold}</td>
                      <td className="py-3.5 px-4">{item.pharmacyCount}</td>
                      <td className="py-3.5 px-4 font-mono">{daysAgo === 0 ? 'Today' : `${daysAgo} days ago`}</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {item.importReasoning}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          {item.growthStatusLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                          🔴 AVOID OVERSTOCKING
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {slowestMovingProducts.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      No slow-moving products identified in this window.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. TAB VIEW 4: 🟢 IMPORTER DECISION INTELLIGENCE */}
      {activeTab === 'importer-recommendations' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span>Wholesale Import Decision Intelligence Engine</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Data-driven guidance answering: <span className="font-bold text-slate-700 dark:text-slate-300">"What medicines should an importer bring into the country?"</span>
                </p>
              </div>

              {/* Disclaimer */}
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>Commercial inventory-demand intelligence only. Strictly non-clinical.</span>
              </div>
            </div>

            {/* 3 Strategy Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Pillar 1: IMPORT / INCREASE SUPPLY */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>🟢 IMPORT / INCREASE SUPPLY</span>
                  </h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                    High volume, surging growth momentum, and widespread multi-pharmacy retail adoption.
                  </p>
                </div>

                <div className="space-y-2">
                  {productDemandMetrics
                    .filter(p => p.importRecommendation === 'import_increase')
                    .sort((a, b) => b.demandScore - a.demandScore)
                    .map(item => (
                      <div
                        key={item.productId}
                        onClick={() => setSelectedProduct(item)}
                        className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition cursor-pointer space-y-1.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">{item.name}</span>
                          <span className="font-mono font-bold text-xs text-emerald-600">{item.demandScore}/100</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">{item.genericName}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700">
                          <span>{item.totalUnitsSold.toLocaleString()} units</span>
                          <span>{item.pharmacyCount} pharmacies</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Pillar 2: MONITOR */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>🟡 MONITOR SUPPLY</span>
                  </h4>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                    Moderate baseline demand, stable dispensing rates, and standard buffer levels.
                  </p>
                </div>

                <div className="space-y-2">
                  {productDemandMetrics
                    .filter(p => p.importRecommendation === 'monitor')
                    .sort((a, b) => b.demandScore - a.demandScore)
                    .map(item => (
                      <div
                        key={item.productId}
                        onClick={() => setSelectedProduct(item)}
                        className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-amber-500 transition cursor-pointer space-y-1.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">{item.name}</span>
                          <span className="font-mono font-bold text-xs text-amber-600">{item.demandScore}/100</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">{item.genericName}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700">
                          <span>{item.totalUnitsSold.toLocaleString()} units</span>
                          <span>{item.pharmacyCount} pharmacies</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Pillar 3: AVOID OVERSTOCKING */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                  <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>🔴 AVOID OVERSTOCKING</span>
                  </h4>
                  <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-1">
                    Low turnover, declining momentum, or long inactivity. High capital lockup and expiry risk.
                  </p>
                </div>

                <div className="space-y-2">
                  {productDemandMetrics
                    .filter(p => p.importRecommendation === 'avoid_overstock')
                    .sort((a, b) => a.demandScore - b.demandScore)
                    .map(item => (
                      <div
                        key={item.productId}
                        onClick={() => setSelectedProduct(item)}
                        className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-rose-500 transition cursor-pointer space-y-1.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">{item.name}</span>
                          <span className="font-mono font-bold text-xs text-rose-600">{item.demandScore}/100</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">{item.genericName}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700">
                          <span>{item.totalUnitsSold.toLocaleString()} units</span>
                          <span className="text-rose-500 font-medium">Avoid excess</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB VIEW 5: 📊 NETWORK DEMAND MATRIX & DIRECTORY */}
      {activeTab === 'catalog-matrix' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Complete Network Product Demand Directory
              </h2>
              <p className="text-xs text-slate-500">
                Filter and sort all registered pharmaceuticals across demand score, velocity, and category.
              </p>
            </div>

            <button
              onClick={() => setShowScoreExplainer(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>How Demand Score is Computed</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search medicine or generic..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 dark:text-white"
              />
            </div>

            {/* Category */}
            <div>
              <select
                value={categoryFilter}
                onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 dark:text-white"
              >
                <option value="all">All Categories ({allCategories.length})</option>
                {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Status */}
            <div>
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 dark:text-white"
              >
                <option value="all">All Demand Statuses</option>
                <option value="rapidly_increasing">🔥 Rapidly Increasing</option>
                <option value="increasing">📈 Increasing</option>
                <option value="stable">🟢 Stable</option>
                <option value="declining">🟡 Declining</option>
                <option value="very_low_demand">🔴 Very Low Demand</option>
                <option value="no_recent_sales">⚪ No Recent Sales</option>
              </select>
            </div>

            {/* Rx / OTC */}
            <div>
              <select
                value={rxFilter}
                onChange={e => { setRxFilter(e.target.value as any); setCurrentPage(1); }}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 dark:text-white"
              >
                <option value="all">All Prescriptions (Rx & OTC)</option>
                <option value="rx">Prescription (Rx) Only</option>
                <option value="otc">Over-The-Counter (OTC)</option>
              </select>
            </div>

            {/* Sort Field */}
            <div>
              <select
                value={sortField}
                onChange={e => setSortField(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 dark:text-white"
              >
                <option value="demandScore">Sort by: Demand Score</option>
                <option value="units">Sort by: Units Sold</option>
                <option value="revenue">Sort by: Revenue</option>
                <option value="growth">Sort by: Growth Momentum</option>
                <option value="pharmacies">Sort by: Pharmacy Reach</option>
                <option value="lastSale">Sort by: Last Dispensation</option>
              </select>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Generic Molecule</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Units Sold</th>
                  <th className="py-3 px-4">Revenue</th>
                  <th className="py-3 px-4">Pharmacies</th>
                  <th className="py-3 px-4">Txns</th>
                  <th className="py-3 px-4">Growth Rate</th>
                  <th className="py-3 px-4">Demand Score</th>
                  <th className="py-3 px-4">Recommendation</th>
                  <th className="py-3 px-4 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMetrics.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(item => (
                  <tr 
                    key={item.productId}
                    onClick={() => setSelectedProduct(item)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white text-xs">{item.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{item.genericName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{item.totalUnitsSold.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono font-semibold">{item.totalRevenue.toLocaleString()} ETB</td>
                    <td className="py-3 px-4 font-semibold">{item.pharmacyCount}</td>
                    <td className="py-3 px-4 font-mono">{item.transactionsCount}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.growthPct !== null && item.growthPct >= 10 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                          : item.growthPct !== null && item.growthPct < -10
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {item.growthPct !== null ? `${item.growthPct >= 0 ? '+' : ''}${item.growthPct}%` : 'Stable'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-black text-blue-600 dark:text-blue-400">
                      {item.demandScore}/100
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.importRecommendation === 'import_increase'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : item.importRecommendation === 'monitor'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {item.importRecommendationLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredMetrics.length)} of {filteredMetrics.length} medicines
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-slate-700 dark:text-slate-300">Page {currentPage}</span>
              <button
                disabled={currentPage * pageSize >= filteredMetrics.length}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. TAB VIEW 6: 📈 DEMAND TRENDS & CHARTS */}
      {activeTab === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Top 8 Medicines by Sales Volume</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={productDemandMetrics.slice(0, 8).map(p => ({
                    name: p.name.length > 12 ? p.name.slice(0, 10) + '…' : p.name,
                    fullName: p.name,
                    units: p.totalUnitsSold,
                    score: p.demandScore
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(val: any, name: string) => [Number(val).toLocaleString(), name === 'units' ? 'Units Sold' : 'Score']} />
                  <Bar dataKey="units" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Demand Score vs Market Reach</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={productDemandMetrics.slice(0, 8).map(p => ({
                    name: p.name.length > 12 ? p.name.slice(0, 10) + '…' : p.name,
                    score: p.demandScore,
                    pharmacies: p.pharmacyCount
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9. PRODUCT DRILL-DOWN MODAL */}
      {/* ========================================================= */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Product Demand Scorecard
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  {selectedProduct.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedProduct.genericName} • {selectedProduct.category}
                </p>
              </div>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score & Recommendation Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-850 border border-blue-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase">Demand Score</div>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                  {selectedProduct.demandScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase">Status & Momentum</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                  {selectedProduct.growthStatusLabel}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase">Commercial Recommendation</div>
                <span className="inline-block mt-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {selectedProduct.importRecommendationLabel}
                </span>
              </div>
            </div>

            {/* Demand Score Contributing Factors */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Demand Score Factors Breakdown
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Volume</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{selectedProduct.demandScoreFactors.volumeScore}/30</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Growth</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{selectedProduct.demandScoreFactors.growthScore}/25</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Adoption</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{selectedProduct.demandScoreFactors.adoptionScore}/25</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Frequency</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{selectedProduct.demandScoreFactors.frequencyScore}/10</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Recency</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{selectedProduct.demandScoreFactors.recencyScore}/10</span>
                </div>
              </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Units Sold</span>
                <span className="font-black text-slate-900 dark:text-white font-mono">{selectedProduct.totalUnitsSold.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Gross Revenue</span>
                <span className="font-black text-blue-600 dark:text-blue-400 font-mono">{selectedProduct.totalRevenue.toLocaleString()} ETB</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Avg Price</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedProduct.avgPrice.toFixed(2)} ETB</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Daily Velocity</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedProduct.salesVelocity} units/day</span>
              </div>
            </div>

            {/* Super Admin ONLY: Detailed Pharmacy Distribution Breakdown */}
            {isSuperAdmin && selectedProduct.pharmacyBreakdown && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
                  <span>Pharmacy Network Demand Distribution</span>
                  <span className="text-[11px] font-normal text-purple-600 dark:text-purple-400 font-mono">
                    Super Admin Authorized View
                  </span>
                </h4>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-48 overflow-y-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Pharmacy</th>
                        <th className="py-2 px-3">Region</th>
                        <th className="py-2 px-3">Units Sold</th>
                        <th className="py-2 px-3">Revenue</th>
                        <th className="py-2 px-3">Last Sale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedProduct.pharmacyBreakdown.map(p => (
                        <tr key={p.pharmacyId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{p.pharmacyName}</td>
                          <td className="py-2 px-3 text-slate-500">{p.region}</td>
                          <td className="py-2 px-3 font-mono font-bold text-blue-600">{p.units.toLocaleString()}</td>
                          <td className="py-2 px-3 font-mono">{p.revenue.toLocaleString()} ETB</td>
                          <td className="py-2 px-3 text-slate-400">{new Date(p.lastSale).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                Close Scorecard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 10. DEMAND SCORE EXPLAINER MODAL */}
      {/* ========================================================= */}
      {showScoreExplainer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <span>Demand Score (0–100) Methodology</span>
              </h3>
              <button 
                onClick={() => setShowScoreExplainer(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
              <p>
                The <strong>Demand Score</strong> is a transparent 100-point index calculated from 5 verified commercial consumption signals:
              </p>

              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white">1. Volume Scale (Max 30 pts): </span>
                  Total unit dispensations relative to network volume threshold.
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white">2. Growth Momentum (Max 25 pts): </span>
                  Rate of change compared against the prior equivalent baseline period.
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white">3. Pharmacy Adoption Reach (Max 25 pts): </span>
                  Breadth of licensed dispensary locations actively stocking and selling the medicine.
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white">4. Transaction Frequency (Max 10 pts): </span>
                  Number of distinct customer dispensing events.
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white">5. Recency & Consistency (Max 10 pts): </span>
                  Time elapsed since last verified point-of-sale dispensation.
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-[11px] text-blue-800 dark:text-blue-300">
                <strong>Commercial Rationale: </strong> Scores $\ge 65$ trigger a 🟢 IMPORT / INCREASE SUPPLY signal, while scores &lt; 35 trigger an 🔴 AVOID OVERSTOCKING caution.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowScoreExplainer(false)}
                className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
