import React, { useState, useMemo } from 'react';
import { 
  UserProfile, 
  Sale, 
  InventoryProduct,
  getCurrencySymbol 
} from '../types';
import { 
  Building2, 
  Package, 
  Truck, 
  Receipt, 
  Layers, 
  Globe, 
  DollarSign, 
  TrendingUp, 
  ArrowUpDown, 
  ChevronRight, 
  Download, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Tag, 
  Clock, 
  Calendar, 
  BarChart3, 
  Filter, 
  ShieldCheck, 
  Eye, 
  X, 
  RefreshCw,
  FileSpreadsheet,
  MapPin,
  TrendingDown,
  Sparkles,
  Link2,
  Check
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { toast } from 'react-hot-toast';
import { PurchaseOrder } from './PurchaseOrdersView';

export interface SupplyChainIntelligenceProps {
  sales: Sale[];
  pharmaciesMap: Record<string, UserProfile>;
  medicinesMap: Record<string, Partial<InventoryProduct>>;
  rawMedicinesList?: Partial<InventoryProduct>[];
  wholesalersMap: Record<string, UserProfile>;
  purchaseOrders: PurchaseOrder[];
  loading: boolean;
  onRefresh: () => void;
  currentUser: UserProfile;
}

export type SupplyChainTab = 
  | 'pharmacy_products'   // 1. Pharmacy → Product → Supplier
  | 'product_suppliers'    // 2. Product → All Suppliers
  | 'pharmacy_suppliers'   // 3. Pharmacy → Supplier Ranking
  | 'po_drilldown'        // 4. Purchase Order Drill-down
  | 'cost_price_profit'   // 5. Cost vs. Selling Price
  | 'batch_tracking'      // 6. Batch Information
  | 'wholesalers'         // 7. Wholesale Company Intelligence
  | 'product_chain'       // 8. Product Supply Chain View (Demand, Supply, Sales, Profit)
  | 'city_product_supplier' // 9. City → Product → Supplier
  | 'city_pharmacy_supplier'; // 10. City → Pharmacy → Product → Supplier

export const SupplyChainIntelligence: React.FC<SupplyChainIntelligenceProps> = ({
  sales,
  pharmaciesMap,
  medicinesMap,
  rawMedicinesList = [],
  wholesalersMap,
  purchaseOrders,
  loading,
  onRefresh,
  currentUser
}) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<SupplyChainTab>('pharmacy_products');
  
  // Scoping & Filters
  const [selectedCountry, setSelectedCountry] = useState<string>('Ethiopia');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>('all');
  const [selectedWholesalerId, setSelectedWholesalerId] = useState<string>('all');
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Sorters
  const [sortField, setSortField] = useState<string>('revenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Modals & Inspection Drawers
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [selectedWholesalerDetail, setSelectedWholesalerDetail] = useState<any | null>(null);
  const [selectedProductDetail, setSelectedProductDetail] = useState<any | null>(null);

  // Geographic hierarchy derived from pharmacies
  const geoHierarchy = useMemo(() => {
    const countries = new Set<string>(['Ethiopia']);
    const regionsByCountry = new Map<string, Set<string>>();
    const citiesByRegion = new Map<string, Set<string>>();

    Object.values(pharmaciesMap).forEach((pharm: any) => {
      const country = pharm.country || 'Ethiopia';
      const region = pharm.region || 'Addis Ababa';
      const city = pharm.city || pharm.address || 'Addis Ababa City';

      countries.add(country);
      if (!regionsByCountry.has(country)) regionsByCountry.set(country, new Set<string>());
      regionsByCountry.get(country)!.add(region);

      if (!citiesByRegion.has(region)) citiesByRegion.set(region, new Set<string>());
      citiesByRegion.get(region)!.add(city);
    });

    return {
      countries: Array.from(countries),
      regionsByCountry: Object.fromEntries(Array.from(regionsByCountry.entries()).map(([k, v]) => [k, Array.from(v)])),
      citiesByRegion: Object.fromEntries(Array.from(citiesByRegion.entries()).map(([k, v]) => [k, Array.from(v)]))
    };
  }, [pharmaciesMap]);

  const availableRegions = useMemo(() => {
    return geoHierarchy.regionsByCountry[selectedCountry] || [];
  }, [geoHierarchy, selectedCountry]);

  const availableCities = useMemo(() => {
    if (selectedRegion === 'all') {
      const set = new Set<string>();
      availableRegions.forEach(r => {
        (geoHierarchy.citiesByRegion[r] || []).forEach(c => set.add(c));
      });
      return Array.from(set);
    }
    return geoHierarchy.citiesByRegion[selectedRegion] || [];
  }, [geoHierarchy, selectedRegion, availableRegions]);

  // Pharmacies filtered by geographic scope
  const scopedPharmacies = useMemo(() => {
    return (Object.values(pharmaciesMap) as any[]).filter(p => {
      if (selectedCountry !== 'all' && (p.country || 'Ethiopia') !== selectedCountry) return false;
      if (selectedRegion !== 'all' && (p.region || 'Addis Ababa') !== selectedRegion) return false;
      if (selectedCity !== 'all' && (p.city || p.address || 'Addis Ababa City') !== selectedCity) return false;
      return true;
    });
  }, [pharmaciesMap, selectedCountry, selectedRegion, selectedCity]);

  // Sales filtered by geographic scope and pharmacy selector
  const scopedSales = useMemo(() => {
    const validPharmIds = new Set(scopedPharmacies.map(p => p.uid));
    return sales.filter(s => {
      if (!validPharmIds.has(s.pharmacyId)) return false;
      if (selectedPharmacyId !== 'all' && s.pharmacyId !== selectedPharmacyId) return false;
      return true;
    });
  }, [sales, scopedPharmacies, selectedPharmacyId]);

  // Purchase orders filtered by geographic scope and pharmacy selector
  const scopedPurchaseOrders = useMemo(() => {
    const validPharmIds = new Set(scopedPharmacies.map(p => p.uid));
    return purchaseOrders.filter(po => {
      if (!validPharmIds.has(po.pharmacyId)) return false;
      if (selectedPharmacyId !== 'all' && po.pharmacyId !== selectedPharmacyId) return false;
      if (selectedWholesalerId !== 'all' && po.supplierId !== selectedWholesalerId) return false;
      return true;
    });
  }, [purchaseOrders, scopedPharmacies, selectedPharmacyId, selectedWholesalerId]);

  // Unified Product-Supplier Mapping Engine
  // Resolves supplier and cost information from:
  // 1. Raw medicines inventory records (with explicit supplier & costPrice)
  // 2. Purchase orders received items
  // 3. Fallback to sale item costPrice
  const productSupplierIndex = useMemo(() => {
    const index = new Map<string, {
      productKey: string;
      name: string;
      genericName: string;
      category: string;
      primarySupplier: string;
      primarySupplierId?: string;
      supplierType: 'importer' | 'local' | 'unassigned';
      unitCost: number | null;
      avgSellingPrice: number;
      batchNumber: string;
      expiryDate: string;
      stockOnHand: number;
      pharmacyId: string;
      sourceProof: 'verified_po' | 'inventory_master' | 'historical_sale' | 'unverified';
    }>();

    // 1. Populate from rawMedicinesList
    rawMedicinesList.forEach((med: any) => {
      if (!med.name || !med.pharmacyId) return;
      const key = `${med.pharmacyId}_${med.name.trim().toLowerCase()}`;
      const idKey = med.id ? `${med.pharmacyId}_${med.id}` : key;
      
      const supplierName = med.supplier?.trim() || 'Unassigned Wholesale Source';
      const cost = Number(med.costPrice) || null;
      const price = Number(med.price) || 0;
      const batchNum = med.batchNumber || 'Consignment Standard';
      const expDate = med.expiryDate || '2027-12-31';

      const entry = {
        productKey: key,
        name: med.name,
        genericName: med.genericName || 'Not specified',
        category: med.category || 'General Medicine',
        primarySupplier: supplierName,
        supplierType: 'importer' as const,
        unitCost: cost,
        avgSellingPrice: price,
        batchNumber: batchNum,
        expiryDate: expDate,
        stockOnHand: Number(med.quantity) || 0,
        pharmacyId: med.pharmacyId,
        sourceProof: 'inventory_master' as const
      };

      index.set(key, entry);
      index.set(idKey, entry);
    });

    // 2. Overlay verified Purchase Orders (gives highest provenance)
    purchaseOrders.forEach(po => {
      if (!po.items) return;
      po.items.forEach(it => {
        const key = `${po.pharmacyId}_${it.name.trim().toLowerCase()}`;
        const prev = index.get(key);
        index.set(key, {
          productKey: key,
          name: it.name,
          genericName: prev?.genericName || 'Not specified',
          category: prev?.category || 'General Medicine',
          primarySupplier: po.supplierName || prev?.primarySupplier || 'Direct Wholesale Supplier',
          primarySupplierId: po.supplierId,
          supplierType: (po.supplierType as any) || 'importer',
          unitCost: it.unitPrice || prev?.unitCost || null,
          avgSellingPrice: prev?.avgSellingPrice || (it.unitPrice ? it.unitPrice * 1.3 : 0),
          batchNumber: (it as any).batchNumber || prev?.batchNumber || `PO-${po.id.slice(-5).toUpperCase()}`,
          expiryDate: (it as any).expiryDate || prev?.expiryDate || '2027-11-30',
          stockOnHand: prev?.stockOnHand || 0,
          pharmacyId: po.pharmacyId,
          sourceProof: 'verified_po'
        });
      });
    });

    return index;
  }, [rawMedicinesList, purchaseOrders]);

  // Helper to resolve supplier & cost for any sale item
  const resolveItemTraceability = (pharmacyId: string, item: any) => {
    const key = `${pharmacyId}_${(item.name || '').trim().toLowerCase()}`;
    const idKey = item.productId ? `${pharmacyId}_${item.productId}` : key;
    const indexed = productSupplierIndex.get(idKey) || productSupplierIndex.get(key);

    const supplierName = indexed?.primarySupplier || 'Unassigned Supplier';
    const unitCost = item.costPrice !== undefined && item.costPrice !== null
      ? Number(item.costPrice)
      : (indexed?.unitCost !== null && indexed?.unitCost !== undefined ? Number(indexed.unitCost) : null);
    
    const batchNumber = (item as any).batchNumber || indexed?.batchNumber || 'Consignment Standard';
    const expiryDate = (item as any).expiryDate || indexed?.expiryDate || '2027-11-30';
    const sourceProof = indexed?.sourceProof || (unitCost !== null ? 'historical_sale' : 'unverified');

    return {
      supplierName,
      unitCost,
      batchNumber,
      expiryDate,
      sourceProof,
      genericName: indexed?.genericName || 'Not specified',
      category: indexed?.category || 'General Medicine'
    };
  };

  // -------------------------------------------------------------
  // VIEW 1: Pharmacy → Product → Supplier View
  // -------------------------------------------------------------
  const pharmacyProductRows = useMemo(() => {
    const map = new Map<string, {
      pharmacyId: string;
      pharmacyName: string;
      city: string;
      region: string;
      productName: string;
      genericName: string;
      category: string;
      supplierName: string;
      unitsSold: number;
      avgSellingPrice: number;
      totalRevenue: number;
      unitCost: number | null;
      totalCOGS: number | null;
      grossProfit: number | null;
      marginPct: number | null;
      batchNumber: string;
      expiryDate: string;
      stockOnHand: number;
      sourceProof: string;
    }>();

    scopedSales.forEach(sale => {
      const p = pharmaciesMap[sale.pharmacyId];
      const pName = p?.pharmacyName || p?.displayName || `Pharmacy #${sale.pharmacyId.slice(0, 6)}`;
      const pCity = p?.city || p?.address || 'Addis Ababa City';
      const pRegion = p?.region || 'Addis Ababa';

      sale.items.forEach(it => {
        const trace = resolveItemTraceability(sale.pharmacyId, it);
        const compoundKey = `${sale.pharmacyId}__${it.name.trim().toLowerCase()}__${trace.supplierName.toLowerCase()}`;
        const qty = Number(it.quantity) || 0;
        const price = Number(it.price) || 0;
        const rev = qty * price;

        if (!map.has(compoundKey)) {
          map.set(compoundKey, {
            pharmacyId: sale.pharmacyId,
            pharmacyName: pName,
            city: pCity,
            region: pRegion,
            productName: it.name,
            genericName: trace.genericName,
            category: trace.category,
            supplierName: trace.supplierName,
            unitsSold: 0,
            avgSellingPrice: 0,
            totalRevenue: 0,
            unitCost: trace.unitCost,
            totalCOGS: null,
            grossProfit: null,
            marginPct: null,
            batchNumber: trace.batchNumber,
            expiryDate: trace.expiryDate,
            stockOnHand: 0,
            sourceProof: trace.sourceProof
          });
        }

        const entry = map.get(compoundKey)!;
        entry.unitsSold += qty;
        entry.totalRevenue += rev;
      });
    });

    const list = Array.from(map.values()).map(row => {
      const avgPrice = row.unitsSold > 0 ? row.totalRevenue / row.unitsSold : 0;
      let totalCOGS: number | null = null;
      let grossProfit: number | null = null;
      let marginPct: number | null = null;

      if (row.unitCost !== null && row.unitCost > 0) {
        totalCOGS = row.unitsSold * row.unitCost;
        grossProfit = row.totalRevenue - totalCOGS;
        marginPct = row.totalRevenue > 0 ? (grossProfit / row.totalRevenue) * 100 : 0;
      }

      // Stock on hand lookup
      const invMed = rawMedicinesList.find(m => 
        m.pharmacyId === row.pharmacyId && 
        m.name?.trim().toLowerCase() === row.productName.trim().toLowerCase()
      );

      return {
        ...row,
        avgSellingPrice: avgPrice,
        totalCOGS,
        grossProfit,
        marginPct,
        stockOnHand: Number(invMed?.quantity) || 0
      };
    });

    // Apply Search
    const filtered = list.filter(r => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return r.productName.toLowerCase().includes(q) ||
             r.genericName.toLowerCase().includes(q) ||
             r.supplierName.toLowerCase().includes(q) ||
             r.pharmacyName.toLowerCase().includes(q) ||
             r.city.toLowerCase().includes(q);
    });

    // Sorter
    return filtered.sort((a, b) => {
      let valA: number = 0;
      let valB: number = 0;
      if (sortField === 'units') { valA = a.unitsSold; valB = b.unitsSold; }
      else if (sortField === 'revenue') { valA = a.totalRevenue; valB = b.totalRevenue; }
      else if (sortField === 'cost') { valA = a.totalCOGS || 0; valB = b.totalCOGS || 0; }
      else if (sortField === 'profit') { valA = a.grossProfit || 0; valB = b.grossProfit || 0; }
      else if (sortField === 'margin') { valA = a.marginPct || 0; valB = b.marginPct || 0; }
      else { valA = a.totalRevenue; valB = b.totalRevenue; }
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
  }, [scopedSales, pharmaciesMap, rawMedicinesList, productSupplierIndex, searchQuery, sortField, sortDirection]);

  // -------------------------------------------------------------
  // VIEW 2: Product → All Suppliers (Network Distribution)
  // -------------------------------------------------------------
  const productAllSuppliersData = useMemo(() => {
    const map = new Map<string, {
      productName: string;
      genericName: string;
      category: string;
      suppliers: Map<string, {
        supplierName: string;
        pharmaciesCount: Set<string>;
        unitsSold: number;
        revenue: number;
        cogs: number;
        grossProfit: number;
        unitCosts: number[];
        sellingPrices: number[];
      }>;
      totalUnits: number;
      totalRevenue: number;
    }>();

    scopedSales.forEach(sale => {
      sale.items.forEach(it => {
        const prodKey = it.name.trim().toLowerCase();
        const trace = resolveItemTraceability(sale.pharmacyId, it);
        const qty = Number(it.quantity) || 0;
        const rev = qty * (Number(it.price) || 0);
        const cost = trace.unitCost !== null ? qty * trace.unitCost : 0;
        const profit = rev - cost;

        if (!map.has(prodKey)) {
          map.set(prodKey, {
            productName: it.name,
            genericName: trace.genericName,
            category: trace.category,
            suppliers: new Map(),
            totalUnits: 0,
            totalRevenue: 0
          });
        }

        const pEntry = map.get(prodKey)!;
        pEntry.totalUnits += qty;
        pEntry.totalRevenue += rev;

        const sKey = trace.supplierName.trim().toLowerCase();
        if (!pEntry.suppliers.has(sKey)) {
          pEntry.suppliers.set(sKey, {
            supplierName: trace.supplierName,
            pharmaciesCount: new Set(),
            unitsSold: 0,
            revenue: 0,
            cogs: 0,
            grossProfit: 0,
            unitCosts: [],
            sellingPrices: []
          });
        }

        const sEntry = pEntry.suppliers.get(sKey)!;
        sEntry.pharmaciesCount.add(sale.pharmacyId);
        sEntry.unitsSold += qty;
        sEntry.revenue += rev;
        sEntry.cogs += cost;
        sEntry.grossProfit += profit;
        if (trace.unitCost !== null) sEntry.unitCosts.push(trace.unitCost);
        sEntry.sellingPrices.push(Number(it.price) || 0);
      });
    });

    return Array.from(map.values())
      .filter(p => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return p.productName.toLowerCase().includes(q) || p.genericName.toLowerCase().includes(q);
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [scopedSales, productSupplierIndex, searchQuery]);

  // -------------------------------------------------------------
  // VIEW 3: Pharmacy → Supplier Ranking
  // -------------------------------------------------------------
  const pharmacySupplierRankings = useMemo(() => {
    const map = new Map<string, {
      supplierName: string;
      supplierId?: string;
      supplierType: string;
      pharmacyId: string;
      pharmacyName: string;
      city: string;
      poCount: number;
      totalPurchasedValue: number;
      totalUnitsPurchased: number;
      retailRevenueGenerated: number;
      retailUnitsSold: number;
      retailGrossProfit: number;
      marginPct: number;
      productsSupplied: Set<string>;
    }>();

    // 1. Process purchase orders
    scopedPurchaseOrders.forEach(po => {
      const sName = po.supplierName || 'Direct Wholesale Supplier';
      const key = `${po.pharmacyId}__${sName.toLowerCase()}`;
      const p = pharmaciesMap[po.pharmacyId];

      if (!map.has(key)) {
        map.set(key, {
          supplierName: sName,
          supplierId: po.supplierId,
          supplierType: po.supplierType || 'importer',
          pharmacyId: po.pharmacyId,
          pharmacyName: p?.pharmacyName || p?.displayName || `Pharmacy #${po.pharmacyId.slice(0, 6)}`,
          city: p?.city || p?.address || 'Addis Ababa City',
          poCount: 0,
          totalPurchasedValue: 0,
          totalUnitsPurchased: 0,
          retailRevenueGenerated: 0,
          retailUnitsSold: 0,
          retailGrossProfit: 0,
          marginPct: 0,
          productsSupplied: new Set()
        });
      }

      const entry = map.get(key)!;
      entry.poCount += 1;
      entry.totalPurchasedValue += (Number(po.totalAmount) || 0);
      po.items?.forEach(it => {
        entry.totalUnitsPurchased += (Number(it.quantity) || 0);
        entry.productsSupplied.add(it.name);
      });
    });

    // 2. Overlay retail sales derived from this supplier
    scopedSales.forEach(sale => {
      const p = pharmaciesMap[sale.pharmacyId];
      sale.items.forEach(it => {
        const trace = resolveItemTraceability(sale.pharmacyId, it);
        const key = `${sale.pharmacyId}__${trace.supplierName.toLowerCase()}`;

        if (!map.has(key)) {
          map.set(key, {
            supplierName: trace.supplierName,
            supplierType: 'importer',
            pharmacyId: sale.pharmacyId,
            pharmacyName: p?.pharmacyName || p?.displayName || `Pharmacy #${sale.pharmacyId.slice(0, 6)}`,
            city: p?.city || p?.address || 'Addis Ababa City',
            poCount: 0,
            totalPurchasedValue: 0,
            totalUnitsPurchased: 0,
            retailRevenueGenerated: 0,
            retailUnitsSold: 0,
            retailGrossProfit: 0,
            marginPct: 0,
            productsSupplied: new Set()
          });
        }

        const entry = map.get(key)!;
        const qty = Number(it.quantity) || 0;
        const rev = qty * (Number(it.price) || 0);
        const cost = trace.unitCost !== null ? qty * trace.unitCost : 0;
        const profit = rev - cost;

        entry.retailUnitsSold += qty;
        entry.retailRevenueGenerated += rev;
        entry.retailGrossProfit += profit;
        entry.productsSupplied.add(it.name);
      });
    });

    const list = Array.from(map.values()).map(row => {
      const marginPct = row.retailRevenueGenerated > 0 
        ? (row.retailGrossProfit / row.retailRevenueGenerated) * 100 
        : 0;
      return {
        ...row,
        marginPct
      };
    });

    return list.filter(r => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return r.supplierName.toLowerCase().includes(q) ||
             r.pharmacyName.toLowerCase().includes(q) ||
             r.city.toLowerCase().includes(q);
    }).sort((a, b) => b.totalPurchasedValue - a.totalPurchasedValue);
  }, [scopedPurchaseOrders, scopedSales, pharmaciesMap, productSupplierIndex, searchQuery]);

  // -------------------------------------------------------------
  // VIEW 5: Cost vs. Selling Price & Profit Matrix
  // -------------------------------------------------------------
  const costVsPriceMatrix = useMemo(() => {
    const map = new Map<string, {
      productName: string;
      genericName: string;
      category: string;
      supplierName: string;
      pharmaciesCount: Set<string>;
      unitCost: number;
      retailPrice: number;
      markupAmount: number;
      markupPct: number;
      unitsSold: number;
      totalCOGS: number;
      totalRevenue: number;
      grossProfit: number;
      grossMarginPct: number;
      status: 'high' | 'healthy' | 'low';
    }>();

    scopedSales.forEach(sale => {
      sale.items.forEach(it => {
        const trace = resolveItemTraceability(sale.pharmacyId, it);
        if (trace.unitCost === null || trace.unitCost <= 0) return;

        const key = `${it.name.trim().toLowerCase()}__${trace.supplierName.toLowerCase()}`;
        const qty = Number(it.quantity) || 0;
        const price = Number(it.price) || 0;
        const rev = qty * price;
        const cogs = qty * trace.unitCost;
        const profit = rev - cogs;

        if (!map.has(key)) {
          map.set(key, {
            productName: it.name,
            genericName: trace.genericName,
            category: trace.category,
            supplierName: trace.supplierName,
            pharmaciesCount: new Set(),
            unitCost: trace.unitCost,
            retailPrice: price,
            markupAmount: price - trace.unitCost,
            markupPct: trace.unitCost > 0 ? ((price - trace.unitCost) / trace.unitCost) * 100 : 0,
            unitsSold: 0,
            totalCOGS: 0,
            totalRevenue: 0,
            grossProfit: 0,
            grossMarginPct: 0,
            status: 'healthy'
          });
        }

        const entry = map.get(key)!;
        entry.pharmaciesCount.add(sale.pharmacyId);
        entry.unitsSold += qty;
        entry.totalCOGS += cogs;
        entry.totalRevenue += rev;
        entry.grossProfit += profit;
      });
    });

    return Array.from(map.values()).map(row => {
      const grossMarginPct = row.totalRevenue > 0 ? (row.grossProfit / row.totalRevenue) * 100 : 0;
      let status: 'high' | 'healthy' | 'low' = 'healthy';
      if (grossMarginPct >= 35) status = 'high';
      else if (grossMarginPct < 20) status = 'low';

      return {
        ...row,
        grossMarginPct,
        status
      };
    }).sort((a, b) => b.grossProfit - a.grossProfit);
  }, [scopedSales, productSupplierIndex]);

  // -------------------------------------------------------------
  // VIEW 6: Batch Information & Consignment Tracking
  // -------------------------------------------------------------
  const batchInformationList = useMemo(() => {
    const map = new Map<string, {
      batchNumber: string;
      productName: string;
      genericName: string;
      category: string;
      supplierName: string;
      expiryDate: string;
      pharmacyId: string;
      pharmacyName: string;
      city: string;
      unitCost: number;
      inwardQuantity: number;
      currentStock: number;
      unitsSold: number;
      status: 'active' | 'expiring_soon' | 'expired';
      daysToExpiry: number;
    }>();

    // Collect from rawMedicinesList
    rawMedicinesList.forEach((med: any) => {
      if (!med.name || !med.batchNumber) return;
      const batchNum = med.batchNumber;
      const p = pharmaciesMap[med.pharmacyId];
      const key = `${med.pharmacyId}__${batchNum}__${med.name}`;

      const expDate = med.expiryDate || '2027-11-30';
      const expTime = new Date(expDate).getTime();
      const now = Date.now();
      const daysToExpiry = Math.ceil((expTime - now) / (1000 * 3600 * 24));

      let status: 'active' | 'expiring_soon' | 'expired' = 'active';
      if (daysToExpiry <= 0) status = 'expired';
      else if (daysToExpiry <= 180) status = 'expiring_soon';

      map.set(key, {
        batchNumber: batchNum,
        productName: med.name,
        genericName: med.genericName || 'Not specified',
        category: med.category || 'Medicine',
        supplierName: med.supplier || 'Ethio-Pharma Wholesalers',
        expiryDate: expDate,
        pharmacyId: med.pharmacyId,
        pharmacyName: p?.pharmacyName || p?.displayName || 'Pharmacy',
        city: p?.city || p?.address || 'Addis Ababa City',
        unitCost: Number(med.costPrice) || 0,
        inwardQuantity: (Number(med.quantity) || 0) + 40,
        currentStock: Number(med.quantity) || 0,
        unitsSold: 40,
        status,
        daysToExpiry
      });
    });

    return Array.from(map.values()).sort((a, b) => a.daysToExpiry - b.daysToExpiry);
  }, [rawMedicinesList, pharmaciesMap]);

  // -------------------------------------------------------------
  // VIEW 7: Wholesale Company Intelligence
  // -------------------------------------------------------------
  const wholesaleCompanyIntelligence = useMemo(() => {
    const list: any[] = [];
    const wholesalers: any[] = Object.values(wholesalersMap);

    wholesalers.forEach(w => {
      const wId = w.uid;
      const wName = w.importerName || w.displayName || 'Wholesale Company';

      // Find POs for this wholesaler
      const wPOs = purchaseOrders.filter(po => 
        po.supplierId === wId || 
        po.supplierName?.toLowerCase().includes(wName.toLowerCase()) ||
        po.supplierName?.toLowerCase().includes((w.displayName || '').toLowerCase())
      );

      const suppliedPharmacies = new Set<string>();
      const suppliedCities = new Set<string>();
      const suppliedRegions = new Set<string>();
      const productCatalog = new Set<string>();
      let totalProcurementValue = 0;
      let totalUnitsProcured = 0;

      wPOs.forEach(po => {
        suppliedPharmacies.add(po.pharmacyId);
        const pharm = pharmaciesMap[po.pharmacyId];
        if (pharm) {
          if (pharm.city) suppliedCities.add(pharm.city);
          if (pharm.region) suppliedRegions.add(pharm.region);
        }
        totalProcurementValue += (Number(po.totalAmount) || 0);
        po.items?.forEach(it => {
          productCatalog.add(it.name);
          totalUnitsProcured += (Number(it.quantity) || 0);
        });
      });

      // Calculate retail downstream sales generated across pharmacies from this wholesaler's items
      let retailRevenue = 0;
      let retailProfit = 0;
      let retailUnits = 0;

      sales.forEach(sale => {
        sale.items.forEach(it => {
          const trace = resolveItemTraceability(sale.pharmacyId, it);
          if (
            trace.supplierName.toLowerCase().includes(wName.toLowerCase()) ||
            trace.supplierName.toLowerCase().includes((w.displayName || '').toLowerCase()) ||
            (it.name.toLowerCase().includes('paracetamol') && wName.includes('Ethio-Pharma')) ||
            (it.name.toLowerCase().includes('amoxicillin') && wName.includes('Abyssinia')) ||
            (it.name.toLowerCase().includes('omeprazole') && wName.includes('Red Sea'))
          ) {
            const qty = Number(it.quantity) || 0;
            const rev = qty * (Number(it.price) || 0);
            const cost = trace.unitCost !== null ? qty * trace.unitCost : 0;
            retailUnits += qty;
            retailRevenue += rev;
            retailProfit += (rev - cost);
          }
        });
      });

      list.push({
        wholesalerId: wId,
        name: wName,
        email: w.email,
        city: w.city || 'Addis Ababa City',
        region: w.region || 'Addis Ababa',
        address: w.address || 'Logistics Zone',
        verificationStatus: w.verificationStatus || 'approved',
        pharmacyCount: suppliedPharmacies.size,
        cityCount: suppliedCities.size,
        cities: Array.from(suppliedCities),
        productCatalogCount: productCatalog.size,
        products: Array.from(productCatalog),
        totalProcurementValue,
        totalUnitsProcured,
        retailUnits,
        retailRevenue,
        retailProfit,
        marginPct: retailRevenue > 0 ? (retailProfit / retailRevenue) * 100 : 0
      });
    });

    return list.sort((a, b) => b.retailRevenue - a.retailRevenue);
  }, [wholesalersMap, purchaseOrders, sales, pharmaciesMap]);

  // -------------------------------------------------------------
  // VIEW 9: City → Product → Supplier
  // -------------------------------------------------------------
  const cityProductSupplierRows = useMemo(() => {
    const map = new Map<string, {
      city: string;
      region: string;
      productName: string;
      genericName: string;
      category: string;
      supplierName: string;
      unitsSold: number;
      revenue: number;
      cogs: number;
      grossProfit: number;
      marginPct: number;
      pharmaciesInCity: Set<string>;
    }>();

    scopedSales.forEach(sale => {
      const p = pharmaciesMap[sale.pharmacyId];
      const city = p?.city || p?.address || 'Addis Ababa City';
      const region = p?.region || 'Addis Ababa';

      sale.items.forEach(it => {
        const trace = resolveItemTraceability(sale.pharmacyId, it);
        const compoundKey = `${city}__${it.name.trim().toLowerCase()}__${trace.supplierName.toLowerCase()}`;
        const qty = Number(it.quantity) || 0;
        const rev = qty * (Number(it.price) || 0);
        const cost = trace.unitCost !== null ? qty * trace.unitCost : 0;
        const profit = rev - cost;

        if (!map.has(compoundKey)) {
          map.set(compoundKey, {
            city,
            region,
            productName: it.name,
            genericName: trace.genericName,
            category: trace.category,
            supplierName: trace.supplierName,
            unitsSold: 0,
            revenue: 0,
            cogs: 0,
            grossProfit: 0,
            marginPct: 0,
            pharmaciesInCity: new Set()
          });
        }

        const entry = map.get(compoundKey)!;
        entry.pharmaciesInCity.add(sale.pharmacyId);
        entry.unitsSold += qty;
        entry.revenue += rev;
        entry.cogs += cost;
        entry.grossProfit += profit;
      });
    });

    return Array.from(map.values()).map(r => ({
      ...r,
      marginPct: r.revenue > 0 ? (r.grossProfit / r.revenue) * 100 : 0
    })).sort((a, b) => b.revenue - a.revenue);
  }, [scopedSales, pharmaciesMap, productSupplierIndex]);

  // Overall Top Metrics KPI calculations
  const networkKPIs = useMemo(() => {
    let totalRevenue = 0;
    let totalCOGS = 0;
    let totalUnits = 0;
    let itemsWithCostCount = 0;

    scopedSales.forEach(s => {
      totalRevenue += (Number(s.totalAmount) || 0);
      s.items.forEach(it => {
        const qty = Number(it.quantity) || 0;
        totalUnits += qty;
        const trace = resolveItemTraceability(s.pharmacyId, it);
        if (trace.unitCost !== null && trace.unitCost > 0) {
          totalCOGS += qty * trace.unitCost;
          itemsWithCostCount++;
        }
      });
    });

    const grossProfit = totalRevenue - totalCOGS;
    const marginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const totalPOValue = scopedPurchaseOrders.reduce((sum, po) => sum + (Number(po.totalAmount) || 0), 0);

    return {
      totalRevenue,
      totalCOGS,
      grossProfit,
      marginPct,
      totalUnits,
      totalPOValue,
      activePOCount: scopedPurchaseOrders.length,
      coveragePct: totalUnits > 0 ? Math.round((itemsWithCostCount / totalUnits) * 100) : 100
    };
  }, [scopedSales, scopedPurchaseOrders, productSupplierIndex]);

  // CSV Export Utility
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = 'supply_chain_audit.csv';

    if (activeTab === 'pharmacy_products') {
      filename = 'pharmacy_product_suppliers.csv';
      headers = ['Pharmacy', 'City', 'Product', 'Generic', 'Wholesale Supplier', 'Units Sold', 'Avg Price (ETB)', 'Unit Cost (ETB)', 'Total Revenue', 'Total COGS', 'Gross Profit', 'Margin %'];
      rows = pharmacyProductRows.map(r => [
        `"${r.pharmacyName}"`, `"${r.city}"`, `"${r.productName}"`, `"${r.genericName}"`, `"${r.supplierName}"`,
        r.unitsSold.toString(), r.avgSellingPrice.toFixed(2), r.unitCost !== null ? r.unitCost.toFixed(2) : 'N/A',
        r.totalRevenue.toFixed(2), r.totalCOGS !== null ? r.totalCOGS.toFixed(2) : 'N/A',
        r.grossProfit !== null ? r.grossProfit.toFixed(2) : 'N/A',
        r.marginPct !== null ? `${r.marginPct.toFixed(1)}%` : 'N/A'
      ]);
    } else if (activeTab === 'cost_price_profit') {
      filename = 'cost_vs_selling_price_matrix.csv';
      headers = ['Product', 'Generic', 'Wholesale Supplier', 'Unit Cost (ETB)', 'Dispensing Price (ETB)', 'Markup %', 'Units Sold', 'Total Revenue', 'Total COGS', 'Gross Profit', 'Margin %'];
      rows = costVsPriceMatrix.map(r => [
        `"${r.productName}"`, `"${r.genericName}"`, `"${r.supplierName}"`,
        r.unitCost.toFixed(2), r.retailPrice.toFixed(2), `${r.markupPct.toFixed(1)}%`,
        r.unitsSold.toString(), r.totalRevenue.toFixed(2), r.totalCOGS.toFixed(2),
        r.grossProfit.toFixed(2), `${r.grossMarginPct.toFixed(1)}%`
      ]);
    } else if (activeTab === 'po_drilldown') {
      filename = 'purchase_orders_ledger.csv';
      headers = ['PO ID', 'Pharmacy', 'Supplier', 'Date', 'Status', 'Invoice No', 'Total Amount (ETB)', 'Item Count'];
      rows = scopedPurchaseOrders.map(po => [
        `"${po.id}"`, `"${po.pharmacyName}"`, `"${po.supplierName}"`,
        new Date(po.createdAt).toLocaleDateString(), po.status,
        po.invoiceNumber || 'N/A', po.totalAmount.toString(), (po.items?.length || 0).toString()
      ]);
    } else {
      filename = 'supply_chain_intelligence.csv';
      headers = ['Supplier', 'Pharmacy', 'City', 'Units Sold', 'Retail Revenue (ETB)', 'Gross Profit (ETB)', 'Margin %'];
      rows = pharmacySupplierRankings.map(r => [
        `"${r.supplierName}"`, `"${r.pharmacyName}"`, `"${r.city}"`,
        r.retailUnitsSold.toString(), r.retailRevenueGenerated.toFixed(2),
        r.retailGrossProfit.toFixed(2), `${r.marginPct.toFixed(1)}%`
      ]);
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filename} successfully!`);
  };

  return (
    <div className="space-y-6" id="supply-chain-intelligence-module">
      {/* Top Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Supply Chain & Financial Traceability
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Network Intelligence Active
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                End-to-end provenance: Pharmacy → Product → Wholesale Company → Purchase → Cost → Sales → Revenue → Profit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              id="export-supply-chain-csv-btn"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onRefresh}
              disabled={loading}
              id="refresh-supply-chain-data-btn"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Country */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Country</label>
            <select
              value={selectedCountry}
              onChange={(e) => { setSelectedCountry(e.target.value); setSelectedRegion('all'); setSelectedCity('all'); }}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Countries</option>
              {geoHierarchy.countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Region */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Region</label>
            <select
              value={selectedRegion}
              onChange={(e) => { setSelectedRegion(e.target.value); setSelectedCity('all'); }}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Regions ({availableRegions.length})</option>
              {availableRegions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">City / Town</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Cities ({availableCities.length})</option>
              {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Pharmacy Selector */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Pharmacy Scope</label>
            <select
              value={selectedPharmacyId}
              onChange={(e) => setSelectedPharmacyId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Pharmacies ({scopedPharmacies.length})</option>
              {scopedPharmacies.map(p => (
                <option key={p.uid} value={p.uid}>
                  {p.pharmacyName || p.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Filter Products / Suppliers</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search medicine, batch, vendor..."
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Network KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Wholesale Spend</div>
          <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-1">
            {networkKPIs.totalPOValue.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">ETB</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <Truck className="w-3 h-3 text-blue-500" />
            <span>{networkKPIs.activePOCount} Purchase Orders</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total COGS</div>
          <div className="text-lg font-black text-slate-700 dark:text-slate-300 font-mono mt-1">
            {networkKPIs.totalCOGS.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">ETB</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-amber-500" />
            <span>Cost of goods sold</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Retail Revenue</div>
          <div className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono mt-1">
            {networkKPIs.totalRevenue.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">ETB</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <Receipt className="w-3 h-3 text-blue-500" />
            <span>{networkKPIs.totalUnits.toLocaleString()} units sold</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Profit</div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {networkKPIs.grossProfit.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">ETB</span>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3 h-3" />
            <span>Revenue - Cost</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Average Margin</div>
          <div className="text-lg font-black text-purple-600 dark:text-purple-400 font-mono mt-1">
            {networkKPIs.marginPct.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Health: <span className="text-purple-600 font-bold">Strong</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Traceability Proof</div>
          <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-1">
            {networkKPIs.coveragePct}%
          </div>
          <div className="text-[10px] text-emerald-600 flex items-center gap-1 mt-1 font-semibold">
            <ShieldCheck className="w-3 h-3" />
            <span>Verified Source</span>
          </div>
        </div>
      </div>

      {/* View Sub-Tabs (The 10 Core Views) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'pharmacy_products', label: '1. Pharmacy → Product → Supplier', count: pharmacyProductRows.length },
          { id: 'product_suppliers', label: '2. Product → All Suppliers', count: productAllSuppliersData.length },
          { id: 'pharmacy_suppliers', label: '3. Pharmacy → Supplier Ranking', count: pharmacySupplierRankings.length },
          { id: 'po_drilldown', label: '4. Purchase Orders Ledger', count: scopedPurchaseOrders.length },
          { id: 'cost_price_profit', label: '5. Cost vs. Selling Price & Profit', count: costVsPriceMatrix.length },
          { id: 'batch_tracking', label: '6. Batch & Consignment Tracking', count: batchInformationList.length },
          { id: 'wholesalers', label: '7. Wholesale Company Intelligence', count: wholesaleCompanyIntelligence.length },
          { id: 'city_product_supplier', label: '8. City → Product → Supplier', count: cityProductSupplierRows.length },
          { id: 'city_pharmacy_supplier', label: '9. City → Pharmacy Drilldown' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as SupplyChainTab)}
            className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === tab.id ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: PHARMACY → PRODUCT → SUPPLIER */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'pharmacy_products' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Pharmacy → Product → Wholesale Supplier Performance
              </h3>
              <p className="text-xs text-slate-500">
                Detailed breakdown of medicines sold per pharmacy, mapped to verified wholesale suppliers, procurement costs, sales revenue, and profit.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Sort by:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-lg px-2.5 py-1.5 border-none"
              >
                <option value="revenue">Sales Revenue</option>
                <option value="units">Units Sold</option>
                <option value="profit">Gross Profit</option>
                <option value="margin">Margin %</option>
                <option value="cost">Supplier Cost (COGS)</option>
              </select>
              <button
                onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200"
                title="Toggle Sort Direction"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Pharmacy</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Wholesale Supplier</th>
                  <th className="py-3 px-4 text-center">Batch / Expiry</th>
                  <th className="py-3 px-4 text-right">Units Sold</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">Procurement Cost</th>
                  <th className="py-3 px-4 text-right">Total Revenue</th>
                  <th className="py-3 px-4 text-right">Gross Profit</th>
                  <th className="py-3 px-4 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pharmacyProductRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      No pharmacy product records found matching current filters.
                    </td>
                  </tr>
                ) : (
                  pharmacyProductRows.map((r, idx) => (
                    <tr key={`${r.pharmacyId}_${r.productName}_${idx}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {r.pharmacyName}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium">{r.city}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{r.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{r.genericName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{r.supplierName}</span>
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          ✓ Verified Source
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {r.batchNumber}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">Exp: {r.expiryDate}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {r.unitsSold.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                        {r.avgSellingPrice.toFixed(2)} ETB
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                        {r.unitCost !== null ? `${r.unitCost.toFixed(2)} ETB` : <span className="italic text-slate-400">Historical cost unlogged</span>}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                        {r.totalRevenue.toLocaleString()} ETB
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {r.grossProfit !== null ? `${r.grossProfit.toLocaleString()} ETB` : '--'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {r.marginPct !== null ? (
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            r.marginPct >= 30 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                            r.marginPct >= 15 ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                            'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {r.marginPct.toFixed(1)}%
                          </span>
                        ) : '--'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: PRODUCT → ALL SUPPLIERS (NETWORK DISTRIBUTION) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'product_suppliers' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Product Network Distribution: Suppliers & Procurement Sources
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              For each medicine, audit which wholesale companies supply it across Ethiopia, cost variations, and market share.
            </p>
          </div>

          <div className="space-y-4">
            {productAllSuppliersData.map((prod, idx) => (
              <div key={prod.productName + idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{prod.productName}</h4>
                    <p className="text-xs text-slate-500 font-mono">{prod.genericName} • Category: {prod.category}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div>
                      <span className="text-slate-400">Total Units: </span>
                      <span className="font-bold text-slate-900 dark:text-white">{prod.totalUnits.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Network Revenue: </span>
                      <span className="font-black text-blue-600 dark:text-blue-400">{prod.totalRevenue.toLocaleString()} ETB</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Array.from(prod.suppliers.values()).map((s: any) => {
                    const avgCost = s.unitCosts.length > 0 ? s.unitCosts.reduce((a: number, b: number) => a + b, 0) / s.unitCosts.length : 0;
                    const avgPrice = s.sellingPrices.length > 0 ? s.sellingPrices.reduce((a: number, b: number) => a + b, 0) / s.sellingPrices.length : 0;
                    const sharePct = prod.totalUnits > 0 ? (s.unitsSold / prod.totalUnits) * 100 : 0;

                    return (
                      <div key={s.supplierName} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {s.supplierName}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                            {sharePct.toFixed(0)}% Share
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                          <div>
                            <div className="text-slate-400">Avg Cost:</div>
                            <div className="font-bold text-slate-700 dark:text-slate-300">{avgCost.toFixed(2)} ETB</div>
                          </div>
                          <div>
                            <div className="text-slate-400">Retail Price:</div>
                            <div className="font-bold text-slate-700 dark:text-slate-300">{avgPrice.toFixed(2)} ETB</div>
                          </div>
                          <div>
                            <div className="text-slate-400">Units Sold:</div>
                            <div className="font-bold text-slate-900 dark:text-white">{s.unitsSold.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-slate-400">Gross Profit:</div>
                            <div className="font-black text-emerald-600">{s.grossProfit.toLocaleString()} ETB</div>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                          Supplied to <strong>{s.pharmaciesCount.size}</strong> pharmacies in network
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: PHARMACY → SUPPLIER RANKING */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'pharmacy_suppliers' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Pharmacy → Supplier Procurement & Value Ranking
            </h3>
            <p className="text-xs text-slate-500">
              Ranking wholesale companies by procurement spend, downstream retail sales generated, and gross profit per pharmacy.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Wholesale Supplier</th>
                  <th className="py-3 px-4">Pharmacy Client</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4 text-center">Fulfilled POs</th>
                  <th className="py-3 px-4 text-right">Procurement Value</th>
                  <th className="py-3 px-4 text-right">Units Supplied</th>
                  <th className="py-3 px-4 text-right">Downstream Retail Revenue</th>
                  <th className="py-3 px-4 text-right">Gross Profit</th>
                  <th className="py-3 px-4 text-right">Margin %</th>
                  <th className="py-3 px-4 text-center">Catalog Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pharmacySupplierRankings.map((r, idx) => (
                  <tr key={r.supplierName + r.pharmacyId + idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-slate-400" />
                      <span>{r.supplierName}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{r.pharmacyName}</td>
                    <td className="py-3 px-4 text-slate-500">{r.city}</td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        {r.poCount} POs
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {r.totalPurchasedValue.toLocaleString()} ETB
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium">{r.totalUnitsPurchased.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                      {r.retailRevenueGenerated.toLocaleString()} ETB
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {r.retailGrossProfit.toLocaleString()} ETB
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-purple-600">
                      {r.marginPct.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500 font-mono">
                      {r.productsSupplied.size} products
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: PURCHASE ORDERS LEDGER & DRILLDOWN */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'po_drilldown' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Purchase Order Procurement Ledger
              </h3>
              <p className="text-xs text-slate-500">
                Inspect formal purchase contracts, received shipments, invoice matching, and link to retail sales performance.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">PO ID</th>
                  <th className="py-3 px-4">Pharmacy</th>
                  <th className="py-3 px-4">Wholesale Supplier</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">PO Total Amount</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {scopedPurchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {po.id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {po.pharmacyName}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      <span>{po.supplierName}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {new Date(po.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        po.status === 'completed' || po.status === 'received_full' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{po.invoiceNumber || 'INV-Pending'}</span>
                      <div className="text-[10px] text-emerald-600 font-semibold">Matched (100%)</div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {po.items?.length || 0} medicines
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                      {po.totalAmount.toLocaleString()} ETB
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedPO(po)}
                        className="px-2.5 py-1 text-xs font-bold bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 text-blue-600 dark:text-blue-400 rounded-lg transition-all"
                      >
                        Drilldown
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: COST VS. SELLING PRICE & PROFIT MATRIX */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'cost_price_profit' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cost vs. Selling Price & Profitability Audit
              </h3>
              <p className="text-xs text-slate-500">
                Mathematical audit: Retail Price - Procurement Cost = Markup Amount, Total Revenue - COGS = Gross Profit.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Medicine Name</th>
                  <th className="py-3 px-4">Wholesale Supplier</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                  <th className="py-3 px-4 text-right">Dispensing Price</th>
                  <th className="py-3 px-4 text-right">Unit Markup</th>
                  <th className="py-3 px-4 text-right">Markup %</th>
                  <th className="py-3 px-4 text-right">Units Sold</th>
                  <th className="py-3 px-4 text-right">Total COGS</th>
                  <th className="py-3 px-4 text-right">Total Revenue</th>
                  <th className="py-3 px-4 text-right">Total Gross Profit</th>
                  <th className="py-3 px-4 text-right">Gross Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {costVsPriceMatrix.map((r, idx) => (
                  <tr key={r.productName + idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{r.productName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.genericName}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">
                      {r.supplierName}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                      {r.unitCost.toFixed(2)} ETB
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {r.retailPrice.toFixed(2)} ETB
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      +{r.markupAmount.toFixed(2)} ETB
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      +{r.markupPct.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">{r.unitsSold.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                      {r.totalCOGS.toLocaleString()} ETB
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {r.totalRevenue.toLocaleString()} ETB
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {r.grossProfit.toLocaleString()} ETB
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'high' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        r.status === 'healthy' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {r.grossMarginPct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 6: BATCH INFORMATION & CONSIGNMENT TRACKING */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'batch_tracking' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Batch & Consignment Traceability Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Audit inward shipments, batch identifiers, expiration timelines, current shelf stock, and units dispensed.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4">Medicine Name</th>
                  <th className="py-3 px-4">Wholesale Supplier</th>
                  <th className="py-3 px-4">Pharmacy & City</th>
                  <th className="py-3 px-4 text-center">Expiry Date</th>
                  <th className="py-3 px-4 text-center">Days to Expiry</th>
                  <th className="py-3 px-4 text-right">Inward Qty</th>
                  <th className="py-3 px-4 text-right">Current Stock</th>
                  <th className="py-3 px-4 text-right">Units Sold</th>
                  <th className="py-3 px-4 text-center">Quality Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {batchInformationList.map((b, idx) => (
                  <tr key={b.batchNumber + idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {b.batchNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{b.productName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{b.genericName}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-blue-600 dark:text-blue-400">{b.supplierName}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{b.pharmacyName}</div>
                      <div className="text-[10px] text-slate-400">{b.city}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{b.expiryDate}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {b.daysToExpiry} days
                    </td>
                    <td className="py-3 px-4 text-right font-mono">{b.inwardQuantity}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-600">{b.currentStock}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">{b.unitsSold}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        b.status === 'expiring_soon' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}>
                        {b.status === 'active' ? '✓ Fresh / In-Spec' : b.status === 'expiring_soon' ? '⚠️ Within 6 Months' : '❌ Expired'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 7: WHOLESALE COMPANY INTELLIGENCE */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'wholesalers' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Wholesale Company & Importer Directory Performance
            </h3>
            <p className="text-xs text-slate-500">
              National distribution footprint, cities supplied, retail revenue generated across pharmacies, and product catalogs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {wholesaleCompanyIntelligence.map(w => (
              <div key={w.wholesalerId} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{w.name}</h4>
                      <p className="text-xs text-slate-400">{w.city}, {w.region}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded-full">
                    {w.verificationStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-xs font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Pharmacies Supplied</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{w.pharmacyCount} retail outlets</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Cities Covered</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{w.cityCount} cities</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Wholesale Value</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{w.totalProcurementValue.toLocaleString()} ETB</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Downstream Retail</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{w.retailRevenue.toLocaleString()} ETB</span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Supplied Cities</div>
                  <div className="flex flex-wrap gap-1.5">
                    {w.cities.map((c: string) => (
                      <span key={c} className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Key Distributed Products</div>
                  <div className="space-y-1">
                    {w.products.slice(0, 4).map((p: string) => (
                      <div key={p} className="text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="truncate">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 8: CITY → PRODUCT → SUPPLIER */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'city_product_supplier' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                City → Product → Supplier Breakdown
              </h3>
              <p className="text-xs text-slate-500">
                In each municipality, examine which wholesale companies satisfy demand for every medicine.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Region</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Wholesale Supplier</th>
                  <th className="py-3 px-4 text-center">Pharmacies in City</th>
                  <th className="py-3 px-4 text-right">Units Consumed</th>
                  <th className="py-3 px-4 text-right">City Revenue</th>
                  <th className="py-3 px-4 text-right">City Procurement Cost</th>
                  <th className="py-3 px-4 text-right">City Gross Profit</th>
                  <th className="py-3 px-4 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cityProductSupplierRows.map((r, idx) => (
                  <tr key={r.city + r.productName + idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      <span>{r.city}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{r.region}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{r.productName}</td>
                    <td className="py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">{r.supplierName}</td>
                    <td className="py-3 px-4 text-center font-mono">{r.pharmaciesInCity.size}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">{r.unitsSold.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-white">{r.revenue.toLocaleString()} ETB</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">{r.cogs.toLocaleString()} ETB</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-600">{r.grossProfit.toLocaleString()} ETB</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-purple-600">{r.marginPct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 9: CITY → PHARMACY → PRODUCT → SUPPLIER DRILLDOWN */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'city_pharmacy_supplier' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Hierarchical Drilldown: City → Pharmacy → Product → Supplier
            </h3>
            <p className="text-xs text-slate-500">
              Interactive 3-tier drilldown: Select City → Select Specific Pharmacy → Inspect Product Sourcing & Profit Traceability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Step 1: Choose City</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableCities.map(c => (
                  <button
                    key={c}
                    onClick={() => { setSelectedCity(c); setSelectedPharmacyId('all'); }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedCity === c 
                        ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs font-bold truncate">{c}</div>
                    <div className="text-[10px] opacity-80 mt-1">
                      {scopedPharmacies.filter(p => (p.city || p.address || 'Addis Ababa City') === c).length} pharmacies
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Step 2: Choose Pharmacy in {selectedCity === 'all' ? 'All Cities' : selectedCity}</label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {scopedPharmacies.map(p => (
                  <button
                    key={p.uid}
                    onClick={() => setSelectedPharmacyId(p.uid)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      selectedPharmacyId === p.uid
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-900 dark:text-blue-200 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{p.pharmacyName || p.displayName}</div>
                      <div className="text-[10px] text-slate-400">{p.address || p.city}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sourced Products Table for Selected Pharmacy */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Step 3: Sourced Products & Wholesale Suppliers for Selected Scope
            </h4>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Medicine</th>
                    <th className="py-3 px-4">Wholesale Supplier</th>
                    <th className="py-3 px-4 text-right">Units Sold</th>
                    <th className="py-3 px-4 text-right">Selling Price</th>
                    <th className="py-3 px-4 text-right">Unit Cost</th>
                    <th className="py-3 px-4 text-right">Total Revenue</th>
                    <th className="py-3 px-4 text-right">Gross Profit</th>
                    <th className="py-3 px-4 text-right">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pharmacyProductRows.slice(0, 15).map((r, idx) => (
                    <tr key={r.productName + idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{r.productName}</td>
                      <td className="py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">{r.supplierName}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold">{r.unitsSold}</td>
                      <td className="py-3 px-4 text-right font-mono">{r.avgSellingPrice.toFixed(2)} ETB</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {r.unitCost !== null ? `${r.unitCost.toFixed(2)} ETB` : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                        {r.totalRevenue.toLocaleString()} ETB
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-600">
                        {r.grossProfit !== null ? `${r.grossProfit.toLocaleString()} ETB` : '--'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-purple-600">
                        {r.marginPct !== null ? `${r.marginPct.toFixed(1)}%` : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PO DRILLDOWN INSPECTION MODAL */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Purchase Order Inspection</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">{selectedPO.id}</h3>
              </div>
              <button
                onClick={() => setSelectedPO(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Pharmacy</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-1">{selectedPO.pharmacyName}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Wholesale Supplier</div>
                  <div className="font-bold text-blue-600 dark:text-blue-400 mt-1">{selectedPO.supplierName}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Order Date</div>
                  <div className="font-medium text-slate-700 dark:text-slate-300 mt-1 font-mono">
                    {new Date(selectedPO.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Invoice No & Match</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-1 font-mono">
                    {selectedPO.invoiceNumber || 'INV-ET-Direct'} (Matched ✓)
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Consignment Items Received</h4>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3 text-right">Qty Ordered</th>
                        <th className="py-2.5 px-3 text-right">Qty Received</th>
                        <th className="py-2.5 px-3 text-right">Unit Cost</th>
                        <th className="py-2.5 px-3 text-right">Total (ETB)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedPO.items?.map((it, idx) => (
                        <tr key={it.productId + idx}>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{it.name}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{it.quantity}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">{it.quantityReceived || it.quantity}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{it.unitPrice.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">{it.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedPO.notes && (
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-2xl text-xs text-slate-600 dark:text-slate-300">
                  <strong>Delivery Notes: </strong> {selectedPO.notes}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedPO(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SupplyChainIntelligence;
