import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  addDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Sale, InventoryProduct, Customer } from '../types';
import { 
  Receipt, 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  ArrowUpDown, 
  TrendingUp, 
  BarChart3, 
  Building2, 
  Users, 
  DollarSign, 
  Package, 
  ShieldCheck, 
  Eye, 
  X, 
  RefreshCw, 
  Layers, 
  Activity, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Stethoscope, 
  ArrowUpRight, 
  Percent, 
  ShoppingBag, 
  Truck,
  CreditCard,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { toast } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface SuperAdminSalesAuditProps {
  user: UserProfile;
}

type DatePreset = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'this_month' | 'prev_month' | 'all' | 'custom';
type ActiveAuditTab = 'products' | 'transactions' | 'pharmacies' | 'importers' | 'demand' | 'suppliers' | 'trends';

interface ProductAggregate {
  productId: string;
  name: string;
  genericName: string;
  category: string;
  dispensingUnit: string;
  unitsSold: number;
  transactionsCount: number;
  pharmacyIds: Set<string>;
  totalRevenue: number;
  prices: number[];
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  unitCost: number | null;
  estTotalCost: number | null;
  estGrossProfit: number | null;
  grossMarginPct: number | null;
  lastSaleTimestamp: number;
  supplier: string;
}

interface PharmacyAggregate {
  pharmacyId: string;
  pharmacyName: string;
  region: string;
  city: string;
  transactionsCount: number;
  unitsSold: number;
  grossRevenue: number;
  totalDiscounts: number;
  netRevenue: number;
  estCost: number | null;
  estGrossProfit: number | null;
  grossMarginPct: number | null;
  avgBasketValue: number;
  prescriptionSalesCount: number;
  lastSaleTimestamp: number;
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#64748b'];

export const SuperAdminSalesAudit: React.FC<SuperAdminSalesAuditProps> = ({ user }) => {
  // Authorization Gate
  if (user.role !== 'admin') {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center" id="unauthorized-audit-notice">
        <div className="p-6 bg-red-50 dark:bg-red-950/40 rounded-3xl border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-red-500" />
          <h2 className="text-xl font-bold mb-2">Restricted Access Module</h2>
          <p className="text-sm">Only authorized Super Administrators are permitted to inspect global network sales audit data.</p>
        </div>
      </div>
    );
  }

  // State Management
  const [activeTab, setActiveTab] = useState<ActiveAuditTab>('products');
  const [datePreset, setDatePreset] = useState<DatePreset>('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  // Raw Data
  const [sales, setSales] = useState<Sale[]>([]);
  const [pharmaciesMap, setPharmaciesMap] = useState<Record<string, UserProfile>>({});
  const [medicinesMap, setMedicinesMap] = useState<Record<string, Partial<InventoryProduct>>>({});
  const [customersMap, setCustomersMap] = useState<Record<string, Partial<Customer & { chronicConditions?: string[]; allergies?: string[]; prescriptions?: any[] }>>>({});

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPharmacyId, setSelectedPharmacyId] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRxFilter, setSelectedRxFilter] = useState<'all' | 'rx' | 'non_rx'>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'all' | 'cash' | 'credit'>('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState<string>('revenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Drilldown Modals
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<Sale | null>(null);
  const [selectedProductDrilldown, setSelectedProductDrilldown] = useState<ProductAggregate | null>(null);
  const [selectedPharmacyAudit, setSelectedPharmacyAudit] = useState<PharmacyAggregate | null>(null);

  // Audit Logger
  const logAuditEvent = async (action: string, details: string, targetType: string, targetId: string) => {
    try {
      await addDoc(collection(db, 'audit_logs'), {
        uid: user.uid,
        adminEmail: user.email || 'superadmin@atech.et',
        action,
        details,
        targetType,
        targetId,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error('Audit logging failed silently:', err);
    }
  };

  // Load Metadata (Pharmacies, Medicines, Customers)
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        // 1. Fetch Pharmacies
        const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'pharmacy'), limit(500)));
        const pMap: Record<string, UserProfile> = {};
        usersSnap.docs.forEach(d => {
          pMap[d.id] = { uid: d.id, ...(d.data() as any) };
        });
        setPharmaciesMap(pMap);

        // 2. Fetch Sample Medicines Catalog for Cost & Generic lookup
        const medsSnap = await getDocs(query(collection(db, 'medicines'), limit(1500)));
        const mMap: Record<string, Partial<InventoryProduct>> = {};
        medsSnap.docs.forEach(d => {
          const data = d.data() as InventoryProduct;
          mMap[d.id] = data;
          if (data.name) {
            mMap[data.name.toLowerCase().trim()] = data;
          }
        });
        setMedicinesMap(mMap);

        // 3. Fetch Registered Customers for Rich Patient & Prescription context
        const custSnap = await getDocs(query(collection(db, 'customers'), limit(1000)));
        const cMap: Record<string, any> = {};
        custSnap.docs.forEach(d => {
          cMap[d.id] = { id: d.id, ...d.data() };
        });
        setCustomersMap(cMap);
      } catch (err) {
        console.error('Failed to load audit metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Load Sales Data with Date Presets and Controlled Batch Pagination
  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const now = Date.now();
      let startTimestamp = 0;
      let endTimestamp = now;

      if (datePreset === 'today') {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        startTimestamp = d.getTime();
      } else if (datePreset === 'yesterday') {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        d.setHours(0, 0, 0, 0);
        startTimestamp = d.getTime();
        const ed = new Date();
        ed.setDate(ed.getDate() - 1);
        ed.setHours(23, 59, 59, 999);
        endTimestamp = ed.getTime();
      } else if (datePreset === '7d') {
        startTimestamp = now - 7 * 24 * 60 * 60 * 1000;
      } else if (datePreset === '30d') {
        startTimestamp = now - 30 * 24 * 60 * 60 * 1000;
      } else if (datePreset === '90d') {
        startTimestamp = now - 90 * 24 * 60 * 60 * 1000;
      } else if (datePreset === 'this_month') {
        const d = new Date();
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        startTimestamp = d.getTime();
      } else if (datePreset === 'prev_month') {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        startTimestamp = d.getTime();
        const ed = new Date();
        ed.setDate(0);
        ed.setHours(23, 59, 59, 999);
        endTimestamp = ed.getTime();
      } else if (datePreset === 'custom') {
        if (customStartDate) {
          startTimestamp = new Date(customStartDate).getTime();
        }
        if (customEndDate) {
          const ed = new Date(customEndDate);
          ed.setHours(23, 59, 59, 999);
          endTimestamp = ed.getTime();
        }
      }

      // Controlled batch pagination
      let loadedSales: Sale[] = [];
      let lastVisible: any = null;
      let hasMore = true;
      const BATCH_SIZE = 1000;
      const MAX_BATCHES = 10;
      let batchCount = 0;

      while (hasMore && batchCount < MAX_BATCHES) {
        let constraints: any[] = [];
        if (startTimestamp > 0) {
          constraints = [
            where('createdAt', '>=', startTimestamp),
            where('createdAt', '<=', endTimestamp),
            orderBy('createdAt', 'desc'),
            limit(BATCH_SIZE)
          ];
        } else {
          constraints = [
            orderBy('createdAt', 'desc'),
            limit(BATCH_SIZE)
          ];
        }

        if (lastVisible) {
          constraints.push(startAfter(lastVisible));
        }

        const q = query(collection(db, 'sales'), ...constraints);
        const snap = await getDocs(q);

        if (snap.empty) {
          hasMore = false;
          break;
        }

        const batchDocs = snap.docs.map(docSnap => ({
          id: docSnap.id,
          ...(docSnap.data() as any)
        } as Sale));

        loadedSales = loadedSales.concat(batchDocs);
        lastVisible = snap.docs[snap.docs.length - 1];
        batchCount++;

        if (snap.docs.length < BATCH_SIZE) {
          hasMore = false;
        }
      }

      setSales(loadedSales);
    } catch (err) {
      console.error('Failed to load operational sales for audit:', err);
      toast.error('Could not load sales records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [datePreset]);

  // Filtering Engine
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // 1. Pharmacy Filter
      if (selectedPharmacyId !== 'all' && sale.pharmacyId !== selectedPharmacyId) {
        return false;
      }

      // 2. Payment Method
      if (selectedPaymentMethod !== 'all' && sale.paymentMethod !== selectedPaymentMethod) {
        return false;
      }

      // 3. Amount Filters
      const total = Number(sale.totalAmount) || 0;
      if (minAmount && total < Number(minAmount)) return false;
      if (maxAmount && total > Number(maxAmount)) return false;

      // 4. Prescription Filter
      const isRx = (sale as any).prescriptionId || 
        (sale.customerId && customersMap[sale.customerId]?.prescriptions && (customersMap[sale.customerId]?.prescriptions?.length || 0) > 0) ||
        sale.items.some(it => {
          const m = medicinesMap[it.productId] || medicinesMap[it.name.toLowerCase().trim()];
          return m?.category?.toLowerCase().includes('antibiotic') || m?.category?.toLowerCase().includes('prescription');
        });
      
      if (selectedRxFilter === 'rx' && !isRx) return false;
      if (selectedRxFilter === 'non_rx' && isRx) return false;

      // 5. Category Filter
      if (selectedCategory !== 'all') {
        const matchesCat = sale.items.some(it => {
          const m = medicinesMap[it.productId] || medicinesMap[it.name.toLowerCase().trim()];
          return (m?.category || 'General Pharma').toLowerCase() === selectedCategory.toLowerCase();
        });
        if (!matchesCat) return false;
      }

      // 6. Search Query (Sale ID, Customer, Pharmacy, Items)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const pName = (pharmaciesMap[sale.pharmacyId]?.pharmacyName || pharmaciesMap[sale.pharmacyId]?.displayName || '').toLowerCase();
        const cName = (sale.customerName || '').toLowerCase();
        const cPhone = (sale.customerPhone || '').toLowerCase();
        const sId = sale.id.toLowerCase();
        const matchesItem = sale.items.some(it => 
          it.name.toLowerCase().includes(q) || 
          (medicinesMap[it.productId]?.genericName || '').toLowerCase().includes(q)
        );

        if (!sId.includes(q) && !pName.includes(q) && !cName.includes(q) && !cPhone.includes(q) && !matchesItem) {
          return false;
        }
      }

      return true;
    });
  }, [sales, selectedPharmacyId, selectedPaymentMethod, minAmount, maxAmount, selectedRxFilter, selectedCategory, searchQuery, pharmaciesMap, medicinesMap, customersMap]);

  // Aggregation: Product Sales Board
  const productAggregates = useMemo(() => {
    const map = new Map<string, ProductAggregate>();

    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const key = item.name.trim().toLowerCase();
        const medMeta = medicinesMap[item.productId] || medicinesMap[key];
        const itemQty = Number(item.quantity) || 0;
        const itemPrice = Number(item.price) || 0;
        const itemTotal = itemQty * itemPrice;
        
        // Exact stored cost or historical medicine metadata cost
        const unitCost = (item as any).costPrice !== undefined ? Number((item as any).costPrice) : (medMeta?.costPrice !== undefined ? Number(medMeta.costPrice) : null);

        if (!map.has(key)) {
          map.set(key, {
            productId: item.productId || key,
            name: item.name,
            genericName: medMeta?.genericName || 'Not specified',
            category: medMeta?.category || 'General Pharma',
            dispensingUnit: medMeta?.dispensingUnit || medMeta?.purchaseUnit || 'Units',
            unitsSold: 0,
            transactionsCount: 0,
            pharmacyIds: new Set<string>(),
            totalRevenue: 0,
            prices: [],
            avgPrice: 0,
            minPrice: itemPrice,
            maxPrice: itemPrice,
            unitCost,
            estTotalCost: null,
            estGrossProfit: null,
            grossMarginPct: null,
            lastSaleTimestamp: sale.createdAt,
            supplier: medMeta?.supplier || 'Not specified'
          });
        }

        const entry = map.get(key)!;
        entry.unitsSold += itemQty;
        entry.transactionsCount += 1;
        entry.pharmacyIds.add(sale.pharmacyId);
        entry.totalRevenue += itemTotal;
        entry.prices.push(itemPrice);
        if (itemPrice < entry.minPrice) entry.minPrice = itemPrice;
        if (itemPrice > entry.maxPrice) entry.maxPrice = itemPrice;
        if (sale.createdAt > entry.lastSaleTimestamp) entry.lastSaleTimestamp = sale.createdAt;
      });
    });

    const list = Array.from(map.values()).map(prod => {
      const avgPrice = prod.unitsSold > 0 ? prod.totalRevenue / prod.unitsSold : 0;
      let estTotalCost: number | null = null;
      let estGrossProfit: number | null = null;
      let grossMarginPct: number | null = null;

      if (prod.unitCost !== null && prod.unitCost > 0) {
        estTotalCost = prod.unitsSold * prod.unitCost;
        estGrossProfit = prod.totalRevenue - estTotalCost;
        grossMarginPct = prod.totalRevenue > 0 ? (estGrossProfit / prod.totalRevenue) * 100 : 0;
      }

      return {
        ...prod,
        avgPrice,
        estTotalCost,
        estGrossProfit,
        grossMarginPct
      };
    });

    // Sorting
    return list.sort((a, b) => {
      let valA: any = a.totalRevenue;
      let valB: any = b.totalRevenue;
      if (sortField === 'units') { valA = a.unitsSold; valB = b.unitsSold; }
      if (sortField === 'transactions') { valA = a.transactionsCount; valB = b.transactionsCount; }
      if (sortField === 'pharmacies') { valA = a.pharmacyIds.size; valB = b.pharmacyIds.size; }
      if (sortField === 'avgPrice') { valA = a.avgPrice; valB = b.avgPrice; }
      if (sortField === 'profit') { valA = a.estGrossProfit || 0; valB = b.estGrossProfit || 0; }
      if (sortField === 'margin') { valA = a.grossMarginPct || 0; valB = b.grossMarginPct || 0; }
      if (sortField === 'lastSale') { valA = a.lastSaleTimestamp; valB = b.lastSaleTimestamp; }

      return sortDirection === 'desc' ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
    });
  }, [filteredSales, medicinesMap, sortField, sortDirection]);

  // Aggregation: Pharmacy Revenue Board
  const pharmacyAggregates = useMemo(() => {
    const map = new Map<string, PharmacyAggregate>();

    filteredSales.forEach(sale => {
      const pId = sale.pharmacyId;
      const pProfile = pharmaciesMap[pId];
      const pName = pProfile?.pharmacyName || pProfile?.displayName || `Pharmacy #${pId.substring(0, 6)}`;
      const reg = pProfile?.region || 'National Territory';
      const cit = pProfile?.city || pProfile?.address || 'Central District';
      const grossRev = Number(sale.subtotalAmount || sale.totalAmount) || 0;
      const discount = Number((sale as any).discountAmount) || 0;
      const netRev = Number(sale.totalAmount) || 0;
      const units = sale.items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

      const isRx = (sale as any).prescriptionId || (sale.customerId && customersMap[sale.customerId]?.prescriptions?.length);

      // Estimate cost
      let saleCost = 0;
      let hasCost = false;
      sale.items.forEach(it => {
        const m = medicinesMap[it.productId] || medicinesMap[it.name.toLowerCase().trim()];
        const unitCost = (it as any).costPrice !== undefined ? Number((it as any).costPrice) : (m?.costPrice !== undefined ? Number(m.costPrice) : null);
        if (unitCost !== null && unitCost > 0) {
          saleCost += unitCost * (Number(it.quantity) || 0);
          hasCost = true;
        }
      });

      if (!map.has(pId)) {
        map.set(pId, {
          pharmacyId: pId,
          pharmacyName: pName,
          region: reg,
          city: cit,
          transactionsCount: 0,
          unitsSold: 0,
          grossRevenue: 0,
          totalDiscounts: 0,
          netRevenue: 0,
          estCost: 0,
          estGrossProfit: 0,
          grossMarginPct: 0,
          avgBasketValue: 0,
          prescriptionSalesCount: 0,
          lastSaleTimestamp: sale.createdAt
        });
      }

      const pEntry = map.get(pId)!;
      pEntry.transactionsCount += 1;
      pEntry.unitsSold += units;
      pEntry.grossRevenue += grossRev;
      pEntry.totalDiscounts += discount;
      pEntry.netRevenue += netRev;
      if (hasCost) {
        pEntry.estCost = (pEntry.estCost || 0) + saleCost;
      }
      if (isRx) pEntry.prescriptionSalesCount += 1;
      if (sale.createdAt > pEntry.lastSaleTimestamp) pEntry.lastSaleTimestamp = sale.createdAt;
    });

    return Array.from(map.values()).map(p => {
      const avgBasket = p.transactionsCount > 0 ? p.netRevenue / p.transactionsCount : 0;
      const profit = p.estCost !== null && p.estCost > 0 ? p.netRevenue - p.estCost : null;
      const margin = profit !== null && p.netRevenue > 0 ? (profit / p.netRevenue) * 100 : null;

      return {
        ...p,
        avgBasketValue: avgBasket,
        estGrossProfit: profit,
        grossMarginPct: margin
      };
    }).sort((a, b) => b.netRevenue - a.netRevenue);
  }, [filteredSales, pharmaciesMap, medicinesMap, customersMap]);

  // Overall KPI Metrics
  const kpiMetrics = useMemo(() => {
    const totalTransactions = filteredSales.length;
    const totalRevenue = filteredSales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
    const totalUnits = filteredSales.reduce((acc, s) => acc + s.items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0), 0);
    const activePharmacies = new Set(filteredSales.map(s => s.pharmacyId)).size;
    const totalDiscounts = filteredSales.reduce((acc, s) => acc + (Number((s as any).discountAmount) || 0), 0);

    let totalEstProfit = 0;
    let profitCount = 0;
    filteredSales.forEach(s => {
      let saleCost = 0;
      let hasCost = false;
      s.items.forEach(it => {
        const m = medicinesMap[it.productId] || medicinesMap[it.name.toLowerCase().trim()];
        const unitCost = (it as any).costPrice !== undefined ? Number((it as any).costPrice) : (m?.costPrice !== undefined ? Number(m.costPrice) : null);
        if (unitCost !== null && unitCost > 0) {
          saleCost += unitCost * (Number(it.quantity) || 0);
          hasCost = true;
        }
      });
      if (hasCost) {
        totalEstProfit += ((Number(s.totalAmount) || 0) - saleCost);
        profitCount++;
      }
    });

    const prescriptionSalesCount = filteredSales.filter(s => 
      (s as any).prescriptionId || 
      (s.customerId && customersMap[s.customerId]?.prescriptions?.length) ||
      s.items.some(it => {
        const m = medicinesMap[it.productId] || medicinesMap[it.name.toLowerCase().trim()];
        return m?.category?.toLowerCase().includes('antibiotic') || m?.category?.toLowerCase().includes('prescription');
      })
    ).length;

    return {
      totalTransactions,
      totalRevenue,
      totalUnits,
      activePharmacies,
      totalDiscounts,
      totalEstProfit,
      avgGrossMarginPct: totalRevenue > 0 ? (totalEstProfit / totalRevenue) * 100 : 0,
      prescriptionSalesCount
    };
  }, [filteredSales, medicinesMap, customersMap]);

  // Categories list for dropdown
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    (Object.values(medicinesMap) as Partial<InventoryProduct>[]).forEach(m => {
      if (m.category) cats.add(m.category);
    });
    return Array.from(cats);
  }, [medicinesMap]);

  // Trend Data for Charts
  const trendData = useMemo(() => {
    const dateMap = new Map<string, { date: string; revenue: number; units: number; rxCount: number; transactions: number }>();
    
    filteredSales.forEach(s => {
      const d = new Date(s.createdAt);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const rev = Number(s.totalAmount) || 0;
      const units = s.items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
      const isRx = (s as any).prescriptionId || (s.customerId && customersMap[s.customerId]?.prescriptions?.length);

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { date: dateKey, revenue: 0, units: 0, rxCount: 0, transactions: 0 });
      }
      const entry = dateMap.get(dateKey)!;
      entry.revenue += rev;
      entry.units += units;
      entry.transactions += 1;
      if (isRx) entry.rxCount += 1;
    });

    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredSales, customersMap]);

  // Category Distribution for Charts
  const categoryDistribution = useMemo(() => {
    const catMap = new Map<string, number>();
    filteredSales.forEach(s => {
      s.items.forEach(it => {
        const m = medicinesMap[it.productId] || medicinesMap[it.name.toLowerCase().trim()];
        const cat = m?.category || 'General Pharma';
        catMap.set(cat, (catMap.get(cat) || 0) + (Number(it.quantity) * Number(it.price) || 0));
      });
    });
    return Array.from(catMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [filteredSales, medicinesMap]);

  // CSV Export Engine
  const exportCSV = (type: 'products' | 'transactions' | 'pharmacies' | 'demand' | 'importers') => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `atech_sales_audit_${type}_${Date.now()}.csv`;

    if (type === 'products') {
      headers = ['Rank', 'Product Name', 'Generic Name', 'Category', 'Units Sold', 'Transactions', 'Pharmacies Selling', 'Total Revenue (ETB)', 'Avg Price', 'Min Price', 'Max Price', 'Supplier Cost', 'Est Profit', 'Gross Margin %', 'Last Sale Date'];
      rows = productAggregates.map((p, idx) => [
        idx + 1,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.genericName.replace(/"/g, '""')}"`,
        `"${p.category}"`,
        p.unitsSold,
        p.transactionsCount,
        p.pharmacyIds.size,
        p.totalRevenue.toFixed(2),
        p.avgPrice.toFixed(2),
        p.minPrice.toFixed(2),
        p.maxPrice.toFixed(2),
        p.unitCost !== null ? p.unitCost.toFixed(2) : 'Unavailable',
        p.estGrossProfit !== null ? p.estGrossProfit.toFixed(2) : 'Unavailable',
        p.grossMarginPct !== null ? `${p.grossMarginPct.toFixed(1)}%` : 'Unavailable',
        new Date(p.lastSaleTimestamp).toLocaleDateString()
      ]);
    } else if (type === 'transactions') {
      headers = ['Sale ID', 'Date', 'Time', 'Pharmacy Name', 'Pharmacy ID', 'Customer Name', 'Customer Phone', 'Payment Method', 'Items Count', 'Subtotal (ETB)', 'Discount (ETB)', 'Total (ETB)', 'Prescription Status'];
      rows = filteredSales.map(s => {
        const pName = pharmaciesMap[s.pharmacyId]?.pharmacyName || pharmaciesMap[s.pharmacyId]?.displayName || 'Pharmacy';
        const d = new Date(s.createdAt);
        const isRx = (s as any).prescriptionId || (s.customerId && customersMap[s.customerId]?.prescriptions?.length) ? 'Prescription' : 'OTC';
        return [
          s.id,
          d.toLocaleDateString(),
          d.toLocaleTimeString(),
          `"${pName.replace(/"/g, '""')}"`,
          s.pharmacyId,
          `"${(s.customerName || 'Walk-in Customer').replace(/"/g, '""')}"`,
          s.customerPhone || 'N/A',
          s.paymentMethod.toUpperCase(),
          s.items.length,
          (s.subtotalAmount || s.totalAmount).toFixed(2),
          ((s as any).discountAmount || 0).toFixed(2),
          s.totalAmount.toFixed(2),
          isRx
        ];
      });
    } else if (type === 'pharmacies') {
      headers = ['Pharmacy Name', 'Pharmacy ID', 'Region', 'Transactions', 'Units Sold', 'Gross Revenue (ETB)', 'Discounts (ETB)', 'Net Revenue (ETB)', 'Est Cost (ETB)', 'Est Profit (ETB)', 'Gross Margin %', 'Avg Basket Value (ETB)', 'Rx Sales Count'];
      rows = pharmacyAggregates.map(p => [
        `"${p.pharmacyName.replace(/"/g, '""')}"`,
        p.pharmacyId,
        `"${p.region}"`,
        p.transactionsCount,
        p.unitsSold,
        p.grossRevenue.toFixed(2),
        p.totalDiscounts.toFixed(2),
        p.netRevenue.toFixed(2),
        p.estCost !== null ? p.estCost.toFixed(2) : 'Unavailable',
        p.estGrossProfit !== null ? p.estGrossProfit.toFixed(2) : 'Unavailable',
        p.grossMarginPct !== null ? `${p.grossMarginPct.toFixed(1)}%` : 'Unavailable',
        p.avgBasketValue.toFixed(2),
        p.prescriptionSalesCount
      ]);
    } else if (type === 'demand' || type === 'importers') {
      headers = ['Product', 'Generic Name', 'Category', 'Units Consumed', 'Active Pharmacies', 'Transactions', 'Total Revenue (ETB)', 'Avg Unit Price (ETB)', 'Consumption Velocity', 'Last Sale Date'];
      rows = productAggregates.map(p => [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.genericName.replace(/"/g, '""')}"`,
        `"${p.category}"`,
        p.unitsSold,
        p.pharmacyIds.size,
        p.transactionsCount,
        p.totalRevenue.toFixed(2),
        p.avgPrice.toFixed(2),
        p.unitsSold > 100 ? 'High Demand' : p.unitsSold > 30 ? 'Moderate Demand' : 'Emerging Demand',
        new Date(p.lastSaleTimestamp).toLocaleDateString()
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logAuditEvent('EXPORT_AUDIT_CSV', `Exported ${type} sales audit dataset (${rows.length} rows)`, 'sales_audit', type);
    toast.success(`${type.toUpperCase()} Audit CSV exported successfully!`);
  };

  // PDF Export Engine
  const exportPDFSummary = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(30, 58, 138);
    doc.text('ATECH East Africa - Sales Intelligence & Audit Report', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Super Admin Control Tower`, 14, 30);
    doc.text(`Audit Preset: ${datePreset.toUpperCase()} | Total Filtered Transactions: ${kpiMetrics.totalTransactions}`, 14, 36);

    const summaryTable = [
      ['Metric', 'Value'],
      ['Total Gross Revenue', `${kpiMetrics.totalRevenue.toLocaleString()} ETB`],
      ['Total Units Sold', kpiMetrics.totalUnits.toLocaleString()],
      ['Active Pharmacy Outlets', kpiMetrics.activePharmacies.toString()],
      ['Total Transaction Volume', kpiMetrics.totalTransactions.toLocaleString()],
      ['Discounts Subsidized', `${kpiMetrics.totalDiscounts.toLocaleString()} ETB`],
      ['Estimated Gross Profit', `${kpiMetrics.totalEstProfit.toLocaleString()} ETB`],
      ['Estimated Gross Margin', `${kpiMetrics.avgGrossMarginPct.toFixed(1)}%`],
      ['Prescription Sales Logged', kpiMetrics.prescriptionSalesCount.toString()]
    ];

    (doc as any).autoTable({
      head: [summaryTable[0]],
      body: summaryTable.slice(1),
      startY: 42,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    });

    const nextY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text('Top 10 Product Sales by Revenue', 14, nextY);

    const topProds = productAggregates.slice(0, 10).map((p, i) => [
      (i + 1).toString(),
      p.name,
      p.category,
      p.unitsSold.toString(),
      `${p.totalRevenue.toLocaleString()} ETB`,
      p.pharmacyIds.size.toString()
    ]);

    (doc as any).autoTable({
      head: [['#', 'Product', 'Category', 'Units', 'Revenue', 'Pharmacies']],
      body: topProds,
      startY: nextY + 6,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] }
    });

    doc.save(`atech_sales_audit_summary_${Date.now()}.pdf`);
    logAuditEvent('EXPORT_AUDIT_PDF', 'Exported Sales Audit Summary PDF report', 'sales_audit', 'summary_pdf');
    toast.success('Executive Sales Audit PDF exported!');
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 font-sans" id="super-admin-sales-audit-view">
      
      {/* Top Banner & Control Deck */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-lg">
            <Receipt className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Sales Intelligence & Operational Audit
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
                Super Admin SEC-08
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Comprehensive network-wide retail sales ledger, pharmacy performance, profit audit, and consumer medicine consumption.
            </p>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchSalesData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-xl transition-all"
            id="refresh-sales-audit-btn"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh Audit</span>
          </button>

          <button
            onClick={exportPDFSummary}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-semibold text-sm rounded-xl hover:bg-blue-100 transition-all"
            id="export-pdf-summary-btn"
          >
            <Download className="w-4 h-4" />
            <span>Executive PDF</span>
          </button>
        </div>
      </div>

      {/* Date Filters Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Audit Date Preset:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: '90d', label: 'Last 90 Days' },
              { id: 'this_month', label: 'This Month' },
              { id: 'prev_month', label: 'Previous Month' },
              { id: 'all', label: 'All Time' },
              { id: 'custom', label: 'Custom Range' }
            ].map(preset => (
              <button
                key={preset.id}
                onClick={() => setDatePreset(preset.id as DatePreset)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  datePreset === preset.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Range Inputs */}
        {datePreset === 'custom' && (
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">From:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">To:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              />
            </div>
            <button
              onClick={fetchSalesData}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
            >
              Apply Filter
            </button>
          </div>
        )}
      </div>

      {/* 8 Primary KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Total Revenue', value: `${kpiMetrics.totalRevenue.toLocaleString()} ETB`, icon: DollarSign, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
          { label: 'Total Units', value: kpiMetrics.totalUnits.toLocaleString(), icon: Package, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
          { label: 'Transactions', value: kpiMetrics.totalTransactions.toLocaleString(), icon: Receipt, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
          { label: 'Active Outlets', value: kpiMetrics.activePharmacies, icon: Building2, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
          { label: 'Total Discounts', value: `${kpiMetrics.totalDiscounts.toLocaleString()} ETB`, icon: Percent, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' },
          { label: 'Est. Gross Profit', value: `${kpiMetrics.totalEstProfit.toLocaleString()} ETB`, icon: TrendingUp, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40' },
          { label: 'Gross Margin', value: `${kpiMetrics.avgGrossMarginPct.toFixed(1)}%`, icon: BarChart3, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40' },
          { label: 'Rx Sales', value: kpiMetrics.prescriptionSalesCount.toLocaleString(), icon: Stethoscope, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
              <div className={`p-1.5 rounded-lg ${kpi.color}`}>
                <kpi.icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-base font-black text-slate-900 dark:text-white truncate">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Multi-Dimensional Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Audit Query Filters</span>
          </div>
          <span className="text-xs text-slate-400">
            Showing <strong>{filteredSales.length}</strong> matching transaction(s)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Universal Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search product, Rx, customer..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 dark:text-white"
            />
          </div>

          {/* Pharmacy Filter */}
          <select
            value={selectedPharmacyId}
            onChange={e => { setSelectedPharmacyId(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 dark:text-white"
          >
            <option value="all">All Pharmacies ({Object.keys(pharmaciesMap).length})</option>
            {(Object.values(pharmaciesMap) as UserProfile[]).map(p => (
              <option key={p.uid} value={p.uid}>
                {p.pharmacyName || p.displayName || (p.uid ? p.uid.substring(0, 8) : 'Pharmacy')}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 dark:text-white"
          >
            <option value="all">All Therapeutic Categories</option>
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Rx Filter */}
          <select
            value={selectedRxFilter}
            onChange={e => { setSelectedRxFilter(e.target.value as any); setCurrentPage(1); }}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 dark:text-white"
          >
            <option value="all">All Sale Classifications</option>
            <option value="rx">Prescription Regimens Only</option>
            <option value="non_rx">OTC / Non-Prescription</option>
          </select>

          {/* Payment Method */}
          <select
            value={selectedPaymentMethod}
            onChange={e => { setSelectedPaymentMethod(e.target.value as any); setCurrentPage(1); }}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 dark:text-white"
          >
            <option value="all">All Payment Types</option>
            <option value="cash">Cash Settlement</option>
            <option value="credit">Credit / Account</option>
          </select>

          {/* Reset Filters */}
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedPharmacyId('all');
              setSelectedCategory('all');
              setSelectedRxFilter('all');
              setSelectedPaymentMethod('all');
              setMinAmount('');
              setMaxAmount('');
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-xl transition-all"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-2">
        {[
          { id: 'products', label: 'Product Sales Board', icon: Package, count: productAggregates.length },
          { id: 'transactions', label: 'Individual Transactions', icon: Receipt, count: filteredSales.length },
          { id: 'pharmacies', label: 'Pharmacy Revenue Ledger', icon: Building2, count: pharmacyAggregates.length },
          { id: 'importers', label: 'Import Intelligence', icon: Truck },
          { id: 'demand', label: 'Network Product Demand', icon: Layers },
          { id: 'suppliers', label: 'Supplier & Cost Intelligence', icon: ShieldCheck },
          { id: 'trends', label: 'Sales Trends & Visual Analytics', icon: BarChart3 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as ActiveAuditTab); setCurrentPage(1); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.id ? 'bg-blue-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: 1. Product Sales Board */}
      {activeTab === 'products' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Network-Wide Product Sales Performance</h2>
              <p className="text-xs text-slate-500">Every unique medicine sold across all pharmacies during the chosen period.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => exportCSV('products')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Products CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Product / Generic</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 cursor-pointer" onClick={() => { setSortField('units'); setSortDirection(d => d === 'asc' ? 'desc' : 'asc'); }}>
                    <div className="flex items-center gap-1">Units Sold <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer" onClick={() => { setSortField('pharmacies'); setSortDirection(d => d === 'asc' ? 'desc' : 'asc'); }}>
                    <div className="flex items-center gap-1">Pharmacies <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer" onClick={() => { setSortField('revenue'); setSortDirection(d => d === 'asc' ? 'desc' : 'asc'); }}>
                    <div className="flex items-center gap-1">Revenue (ETB) <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="py-3 px-4">Avg Price</th>
                  <th className="py-3 px-4">Supplier Cost</th>
                  <th className="py-3 px-4 cursor-pointer" onClick={() => { setSortField('profit'); setSortDirection(d => d === 'asc' ? 'desc' : 'asc'); }}>
                    <div className="flex items-center gap-1">Est. Profit <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="py-3 px-4">Margin %</th>
                  <th className="py-3 px-4 text-right">Drilldown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {productAggregates.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((prod, idx) => (
                  <tr 
                    key={prod.productId + idx}
                    className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedProductDrilldown(prod);
                      logAuditEvent('VIEW_PRODUCT_AUDIT_DRILLDOWN', `Inspected product performance for ${prod.name}`, 'product', prod.productId);
                    }}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-400">{(currentPage - 1) * pageSize + idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{prod.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{prod.genericName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        {prod.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{prod.unitsSold.toLocaleString()} {prod.dispensingUnit}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold">
                        {prod.pharmacyIds.size} outlets
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900 dark:text-white font-mono">{prod.totalRevenue.toLocaleString()} ETB</td>
                    <td className="py-3 px-4 font-mono">{prod.avgPrice.toFixed(2)} ETB</td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {prod.unitCost !== null ? `${prod.unitCost.toFixed(2)} ETB` : <span className="italic text-slate-400">Unavailable</span>}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {prod.estGrossProfit !== null ? `${prod.estGrossProfit.toLocaleString()} ETB` : <span className="italic text-slate-400 font-normal">Unavailable</span>}
                    </td>
                    <td className="py-3 px-4">
                      {prod.grossMarginPct !== null ? (
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                          prod.grossMarginPct >= 20 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {prod.grossMarginPct.toFixed(1)}%
                        </span>
                      ) : <span className="text-slate-400 italic">--</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg dark:hover:bg-blue-900/40">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, productAggregates.length)} of {productAggregates.length} products
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
                disabled={currentPage * pageSize >= productAggregates.length}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. Individual Transactions Audit */}
      {activeTab === 'transactions' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Individual Sale Transactions Ledger</h2>
              <p className="text-xs text-slate-500">Granular transaction records with patient and clinical prescription links.</p>
            </div>

            <button
              onClick={() => exportCSV('transactions')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Transactions CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Sale ID / Date</th>
                  <th className="py-3 px-4">Pharmacy Origin</th>
                  <th className="py-3 px-4">Customer / Patient</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Subtotal</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Final Total</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSales.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(sale => {
                  const pProfile = pharmaciesMap[sale.pharmacyId];
                  const pName = pProfile?.pharmacyName || pProfile?.displayName || `Pharmacy #${sale.pharmacyId.substring(0, 6)}`;
                  const isRx = (sale as any).prescriptionId || (sale.customerId && customersMap[sale.customerId]?.prescriptions?.length);

                  return (
                    <tr 
                      key={sale.id}
                      className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedSaleDetail(sale);
                        logAuditEvent('VIEW_INDIVIDUAL_SALE_AUDIT', `Audited transaction ${sale.id} for ${pName}`, 'sale', sale.id);
                      }}
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">{sale.id.substring(0, 14)}...</div>
                        <div className="text-[11px] text-slate-400">{new Date(sale.createdAt).toLocaleString()}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{pName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{sale.pharmacyId.substring(0, 10)}...</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-700 dark:text-slate-300">{sale.customerName || 'Walk-in Customer'}</div>
                        <div className="text-[11px] text-slate-400">{sale.customerPhone || 'No Phone'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{sale.items.length} item(s)</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                          {sale.items.map(i => i.name).join(', ')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 uppercase font-mono font-bold text-[10px]">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold">{(sale.subtotalAmount || sale.totalAmount).toFixed(2)} ETB</td>
                      <td className="py-3 px-4 font-mono text-rose-600">{((sale as any).discountAmount || 0).toFixed(2)} ETB</td>
                      <td className="py-3 px-4 font-mono font-black text-slate-900 dark:text-white">{sale.totalAmount.toFixed(2)} ETB</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isRx ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {isRx ? 'Prescription' : 'OTC'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg dark:hover:bg-blue-900/40">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredSales.length)} of {filteredSales.length} transactions
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
                disabled={currentPage * pageSize >= filteredSales.length}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. Pharmacy Revenue Ledger */}
      {activeTab === 'pharmacies' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Pharmacy Operational Revenue & Margin Ledger</h2>
              <p className="text-xs text-slate-500">Breakdown of gross turnover, discounts, profits, and basket values by pharmacy entity.</p>
            </div>

            <button
              onClick={() => exportCSV('pharmacies')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Pharmacies CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Pharmacy</th>
                  <th className="py-3 px-4">Region / City</th>
                  <th className="py-3 px-4">Transactions</th>
                  <th className="py-3 px-4">Units Sold</th>
                  <th className="py-3 px-4">Gross Revenue</th>
                  <th className="py-3 px-4">Discounts</th>
                  <th className="py-3 px-4">Net Turnover</th>
                  <th className="py-3 px-4">Est. Profit</th>
                  <th className="py-3 px-4">Margin %</th>
                  <th className="py-3 px-4">Avg Basket</th>
                  <th className="py-3 px-4 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pharmacyAggregates.map(phar => (
                  <tr 
                    key={phar.pharmacyId}
                    className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedPharmacyAudit(phar);
                      logAuditEvent('VIEW_PHARMACY_AUDIT_LEDGER', `Audited pharmacy operations for ${phar.pharmacyName}`, 'pharmacy', phar.pharmacyId);
                    }}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{phar.pharmacyName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{phar.pharmacyId.substring(0, 12)}...</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">{phar.region}</div>
                      <div className="text-[11px] text-slate-400">{phar.city}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{phar.transactionsCount.toLocaleString()}</td>
                    <td className="py-3 px-4 font-semibold">{phar.unitsSold.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono">{phar.grossRevenue.toLocaleString()} ETB</td>
                    <td className="py-3 px-4 font-mono text-rose-600">{phar.totalDiscounts.toLocaleString()} ETB</td>
                    <td className="py-3 px-4 font-mono font-black text-blue-600 dark:text-blue-400">{phar.netRevenue.toLocaleString()} ETB</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                      {phar.estGrossProfit !== null ? `${phar.estGrossProfit.toLocaleString()} ETB` : <span className="italic text-slate-400 font-normal">Unavailable</span>}
                    </td>
                    <td className="py-3 px-4">
                      {phar.grossMarginPct !== null ? (
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold rounded-md text-[11px]">
                          {phar.grossMarginPct.toFixed(1)}%
                        </span>
                      ) : <span className="text-slate-400 italic">--</span>}
                    </td>
                    <td className="py-3 px-4 font-mono">{phar.avgBasketValue.toFixed(2)} ETB</td>
                    <td className="py-3 px-4 text-right">
                      <button className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg dark:hover:bg-blue-900/40">
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. Import Intelligence */}
      {activeTab === 'importers' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Wholesale Import Strategy & Consumption Analytics</h2>
              <p className="text-xs text-slate-500">Real-time prescription and OTC consumer demand signals to guide import tenders and supply ordering.</p>
            </div>
            <button
              onClick={() => exportCSV('importers')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-lg"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Import Intelligence CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/60 border border-blue-100 dark:border-slate-700">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase">Fastest Velocity Category</span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {categoryDistribution[0]?.name || 'Antibiotics & Anti-Infectives'}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Generates {categoryDistribution[0] ? ((categoryDistribution[0].value / kpiMetrics.totalRevenue) * 100).toFixed(1) : '34'}% of ecosystem revenue.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-800/60 border border-emerald-100 dark:border-slate-700">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">Total Medicine Consumption</span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{kpiMetrics.totalUnits.toLocaleString()} Dispensations</p>
              <p className="text-xs text-slate-500 mt-2">Across {kpiMetrics.activePharmacies} active licensed dispensary nodes.</p>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-800/60 border border-purple-100 dark:border-slate-700">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase">Active Catalog Breadth</span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{productAggregates.length} Commercial SKUs</p>
              <p className="text-xs text-slate-500 mt-2">Circulating in active retail circulation.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Generic Molecule</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Units Consumed</th>
                  <th className="py-3 px-4">Market Reach</th>
                  <th className="py-3 px-4">Turnover</th>
                  <th className="py-3 px-4">Import Demand Signal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {productAggregates.slice(0, 20).map(p => (
                  <tr key={p.productId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{p.name}</td>
                    <td className="py-3 px-4 font-mono">{p.genericName}</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{p.category}</span></td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white font-mono">{p.unitsSold.toLocaleString()}</td>
                    <td className="py-3 px-4 font-semibold">{p.pharmacyIds.size} pharmacies</td>
                    <td className="py-3 px-4 font-mono font-black">{p.totalRevenue.toLocaleString()} ETB</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        p.unitsSold > 100 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {p.unitsSold > 100 ? '🔥 High Import Priority' : '⭐ Stable Demand'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. Network Product Demand Table */}
      {activeTab === 'demand' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Network Product Demand Matrix</h2>
              <p className="text-xs text-slate-500">Complete searchable database of medicine consumption patterns.</p>
            </div>
            <button
              onClick={() => exportCSV('demand')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Demand CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Generic</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Units Sold</th>
                  <th className="py-3 px-4">Pharmacies</th>
                  <th className="py-3 px-4">Transactions</th>
                  <th className="py-3 px-4">Revenue</th>
                  <th className="py-3 px-4">Demand Tier</th>
                  <th className="py-3 px-4">Last Sale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {productAggregates.map(p => (
                  <tr key={p.productId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{p.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{p.genericName}</td>
                    <td className="py-3 px-4">{p.category}</td>
                    <td className="py-3 px-4 font-bold font-mono">{p.unitsSold.toLocaleString()}</td>
                    <td className="py-3 px-4">{p.pharmacyIds.size}</td>
                    <td className="py-3 px-4">{p.transactionsCount}</td>
                    <td className="py-3 px-4 font-mono font-bold">{p.totalRevenue.toLocaleString()} ETB</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                        {p.unitsSold > 50 ? 'Tier 1 (High)' : 'Tier 2 (Standard)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{new Date(p.lastSaleTimestamp).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 6. Supplier & Cost Intelligence */}
      {activeTab === 'suppliers' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Supplier Sourcing & Purchasing Cost Audit</h2>
            <p className="text-xs text-slate-500">
              Verified supplier pricing and profit margins. Where supplier cost is not logged on historical sales, it is explicitly indicated.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Supplier Source</th>
                  <th className="py-3 px-4">Units Sold</th>
                  <th className="py-3 px-4">Supplier Cost</th>
                  <th className="py-3 px-4">Avg Selling Price</th>
                  <th className="py-3 px-4">Gross Margin %</th>
                  <th className="py-3 px-4">Estimated Gross Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {productAggregates.map(p => (
                  <tr key={p.productId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{p.name}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">{p.supplier}</td>
                    <td className="py-3 px-4 font-mono font-bold">{p.unitsSold.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {p.unitCost !== null ? `${p.unitCost.toFixed(2)} ETB` : <span className="italic text-slate-400">Historical supplier cost unavailable</span>}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">{p.avgPrice.toFixed(2)} ETB</td>
                    <td className="py-3 px-4">
                      {p.grossMarginPct !== null ? (
                        <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold rounded">
                          {p.grossMarginPct.toFixed(1)}%
                        </span>
                      ) : <span className="text-slate-400 italic">--</span>}
                    </td>
                    <td className="py-3 px-4 font-mono font-black text-emerald-600">
                      {p.estGrossProfit !== null ? `${p.estGrossProfit.toLocaleString()} ETB` : <span className="text-slate-400 italic font-normal">Unavailable</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 7. Sales Trends & Charts */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Daily Sales Revenue Velocity (ETB)</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#2563eb" fillOpacity={1} fill="url(#revGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Units & Transactions Trend */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                <span>Units Dispensed & Prescription Volumes</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="units" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="rxCount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <span>Therapeutic Category Revenue Share</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* DRILLDOWN MODAL 1: "Who Sold It" Product Audit */}
      {selectedProductDrilldown && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-600 rounded-2xl">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedProductDrilldown.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">Generic: {selectedProductDrilldown.genericName} | Category: {selectedProductDrilldown.category}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProductDrilldown(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Summary KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Units Sold</span>
                <p className="text-base font-black text-slate-900 dark:text-white">{selectedProductDrilldown.unitsSold.toLocaleString()} {selectedProductDrilldown.dispensingUnit}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Turnover</span>
                <p className="text-base font-black text-blue-600 font-mono">{selectedProductDrilldown.totalRevenue.toLocaleString()} ETB</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Selling Price</span>
                <p className="text-base font-black text-slate-900 dark:text-white font-mono">{selectedProductDrilldown.avgPrice.toFixed(2)} ETB</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Selling Outlets</span>
                <p className="text-base font-black text-emerald-600">{selectedProductDrilldown.pharmacyIds.size} Pharmacies</p>
              </div>
            </div>

            {/* Pharmacy Breakdown Table */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Pharmacy Breakdown ("Who Sold It")</h4>
              <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Pharmacy Name</th>
                      <th className="py-2.5 px-3">Location</th>
                      <th className="py-2.5 px-3">Quantity Sold</th>
                      <th className="py-2.5 px-3">Transactions</th>
                      <th className="py-2.5 px-3">Total Revenue</th>
                      <th className="py-2.5 px-3">Avg Price</th>
                      <th className="py-2.5 px-3 text-right">Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-400">
                    {Array.from(selectedProductDrilldown.pharmacyIds).map((pId: string) => {
                      const pProfile = pharmaciesMap[pId];
                      const pName = pProfile?.pharmacyName || pProfile?.displayName || `Pharmacy #${String(pId).substring(0, 6)}`;
                      
                      // Calculate specific pharmacy sales for this product
                      const pharSales = filteredSales.filter(s => s.pharmacyId === pId && s.items.some(i => i.name.toLowerCase().trim() === selectedProductDrilldown.name.toLowerCase().trim()));
                      let qty = 0;
                      let rev = 0;
                      pharSales.forEach(s => {
                        s.items.forEach(i => {
                          if (i.name.toLowerCase().trim() === selectedProductDrilldown.name.toLowerCase().trim()) {
                            qty += Number(i.quantity) || 0;
                            rev += (Number(i.quantity) || 0) * (Number(i.price) || 0);
                          }
                        });
                      });

                      return (
                        <tr key={pId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{pName}</td>
                          <td className="py-2.5 px-3 text-slate-400">{pProfile?.city || pProfile?.region || 'Central'}</td>
                          <td className="py-2.5 px-3 font-mono font-bold">{qty}</td>
                          <td className="py-2.5 px-3 font-mono">{pharSales.length}</td>
                          <td className="py-2.5 px-3 font-mono font-black text-blue-600">{rev.toLocaleString()} ETB</td>
                          <td className="py-2.5 px-3 font-mono">{(qty > 0 ? rev / qty : 0).toFixed(2)} ETB</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => {
                                const agg = pharmacyAggregates.find(pa => pa.pharmacyId === pId);
                                if (agg) setSelectedPharmacyAudit(agg);
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-600 rounded-lg hover:bg-blue-100"
                            >
                              Audit Outlet
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRILLDOWN MODAL 2: Full Sale Details Modal */}
      {selectedSaleDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 rounded-2xl">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Transaction Audit: {selectedSaleDetail.id}</h3>
                  <p className="text-xs text-slate-400">
                    Timestamp: {new Date(selectedSaleDetail.createdAt).toLocaleString()} | Origin: {pharmaciesMap[selectedSaleDetail.pharmacyId]?.pharmacyName || selectedSaleDetail.pharmacyId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Patient Information */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Patient / Customer Profile</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Full Name:</span>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedSaleDetail.customerName || 'Not available'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Phone Number:</span>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedSaleDetail.customerPhone || 'Not available'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Customer ID:</span>
                  <p className="font-mono text-slate-700 dark:text-slate-300">{selectedSaleDetail.customerId || 'Not available'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Payment Channel:</span>
                  <p className="font-bold uppercase text-slate-900 dark:text-white">{selectedSaleDetail.paymentMethod}</p>
                </div>
              </div>

              {/* Prescription Context if attached */}
              {selectedSaleDetail.customerId && customersMap[selectedSaleDetail.customerId]?.prescriptions && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-xs">
                  <span className="font-bold text-purple-600 flex items-center gap-1.5 mb-1">
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Logged Prescription Regimens ({customersMap[selectedSaleDetail.customerId]?.prescriptions?.length})</span>
                  </span>
                  <div className="space-y-1">
                    {customersMap[selectedSaleDetail.customerId]?.prescriptions?.map((rx: any, idx: number) => (
                      <div key={idx} className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded-lg text-purple-900 dark:text-purple-200">
                        <strong>{rx.drugName}</strong>: {rx.dosage}, {rx.frequency} (Duration: {rx.durationDays} days)
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Itemized Basket Breakdown</h4>
              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Batch / Expiry</th>
                      <th className="py-2.5 px-3">Quantity</th>
                      <th className="py-2.5 px-3">Unit Price</th>
                      <th className="py-2.5 px-3">Supplier Cost</th>
                      <th className="py-2.5 px-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-400">
                    {selectedSaleDetail.items.map((it, idx) => {
                      const m = medicinesMap[it.productId] || medicinesMap[it.name.toLowerCase().trim()];
                      const cost = (it as any).costPrice !== undefined ? Number((it as any).costPrice) : (m?.costPrice !== undefined ? Number(m.costPrice) : null);

                      return (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{it.name}</td>
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                            {m?.batchNumber || (it as any).batchNumber || 'N/A'} (Exp: {m?.expiryDate || 'N/A'})
                          </td>
                          <td className="py-2.5 px-3 font-bold font-mono">{it.quantity}</td>
                          <td className="py-2.5 px-3 font-mono">{Number(it.price).toFixed(2)} ETB</td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">
                            {cost !== null ? `${cost.toFixed(2)} ETB` : <span className="italic text-slate-400">Unavailable</span>}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-black text-slate-900 dark:text-white text-right">
                            {(Number(it.quantity) * Number(it.price)).toFixed(2)} ETB
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <div className="space-y-1">
                <div>Subtotal: <strong>{(selectedSaleDetail.subtotalAmount || selectedSaleDetail.totalAmount).toFixed(2)} ETB</strong></div>
                <div>Discounts: <strong className="text-rose-600">{((selectedSaleDetail as any).discountAmount || 0).toFixed(2)} ETB</strong></div>
                <div>VAT / Tax: <strong>{(selectedSaleDetail.vatAmount || 0).toFixed(2)} ETB</strong></div>
              </div>
              <div className="text-right">
                <span className="text-slate-400 uppercase text-[10px] font-bold">Settlement Total</span>
                <p className="text-2xl font-black text-blue-600 font-mono">{selectedSaleDetail.totalAmount.toFixed(2)} ETB</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRILLDOWN MODAL 3: Pharmacy Audit Sub-View */}
      {selectedPharmacyAudit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 rounded-2xl">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedPharmacyAudit.pharmacyName}</h3>
                  <p className="text-xs text-slate-400 font-mono">Pharmacy ID: {selectedPharmacyAudit.pharmacyId} | Region: {selectedPharmacyAudit.region}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPharmacyAudit(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pharmacy KPI Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Net Turnover</span>
                <p className="text-base font-black text-blue-600 font-mono">{selectedPharmacyAudit.netRevenue.toLocaleString()} ETB</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Transactions</span>
                <p className="text-base font-black text-slate-900 dark:text-white">{selectedPharmacyAudit.transactionsCount}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Units Sold</span>
                <p className="text-base font-black text-slate-900 dark:text-white">{selectedPharmacyAudit.unitsSold.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Rx Sales Count</span>
                <p className="text-base font-black text-purple-600">{selectedPharmacyAudit.prescriptionSalesCount}</p>
              </div>
            </div>

            {/* Pharmacy Specific Sales Table */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Pharmacy Individual Sales History</h4>
              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Sale ID</th>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Items Count</th>
                      <th className="py-2.5 px-3 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-400">
                    {filteredSales.filter(s => s.pharmacyId === selectedPharmacyAudit.pharmacyId).slice(0, 15).map(s => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">{s.id.substring(0, 14)}...</td>
                        <td className="py-2.5 px-3 text-slate-400">{new Date(s.createdAt).toLocaleString()}</td>
                        <td className="py-2.5 px-3">{s.customerName || 'Walk-in'}</td>
                        <td className="py-2.5 px-3 font-bold">{s.items.length}</td>
                        <td className="py-2.5 px-3 font-mono font-black text-slate-900 dark:text-white text-right">{s.totalAmount.toFixed(2)} ETB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
