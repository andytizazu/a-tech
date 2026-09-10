import React, { useState, useMemo } from 'react';
import { 
  UserProfile, 
  Sale, 
  InventoryProduct 
} from '../types';
import { 
  Globe, 
  MapPin, 
  Building2, 
  Package, 
  Search, 
  ArrowUpDown, 
  TrendingUp, 
  BarChart3, 
  Layers, 
  DollarSign, 
  AlertTriangle, 
  ChevronRight, 
  Filter, 
  Sparkles, 
  Trash2, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  Info, 
  ExternalLink,
  ChevronDown,
  X,
  ShieldCheck,
  Tag,
  Clock,
  Percent,
  Check
} from 'lucide-react';
import { 
  seedDemoSalesData, 
  clearDemoSalesData, 
  DEMO_MEDICINE_CATALOG,
  DEMO_PHARMACIES
} from '../lib/demoSalesData';
import { toast } from 'react-hot-toast';

interface GeographicSalesIntelligenceProps {
  sales: Sale[];
  pharmaciesMap: Record<string, UserProfile>;
  medicinesMap: Record<string, Partial<InventoryProduct>>;
  rawMedicinesList?: Partial<InventoryProduct>[];
  loading: boolean;
  onRefresh: () => void;
  currentUser: UserProfile;
}

type CityViewTab = 'products' | 'pharmacies';
type PharmacySortOption = 'best_selling' | 'worst_selling' | 'highest_revenue' | 'highest_profit' | 'most_transactions';
type CityProductSortOption = 'units' | 'revenue' | 'pharmacies' | 'transactions' | 'profit';
type CityPharmacySortOption = 'revenue' | 'units' | 'transactions' | 'profit' | 'basket';
type ProductAreaSortOption = 'units' | 'revenue' | 'transactions' | 'avg_price';

export const GeographicSalesIntelligence: React.FC<GeographicSalesIntelligenceProps> = ({
  sales,
  pharmaciesMap,
  medicinesMap,
  rawMedicinesList = [],
  loading,
  onRefresh,
  currentUser
}) => {
  // Navigation & Selection States
  const [selectedCountry, setSelectedCountry] = useState<string>('Ethiopia');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Sub-tabs & Sorters
  const [cityTab, setCityTab] = useState<CityViewTab>('products');
  const [cityProductSort, setCityProductSort] = useState<CityProductSortOption>('units');
  const [cityPharmacySort, setCityPharmacySort] = useState<CityPharmacySortOption>('revenue');
  const [pharmacySort, setPharmacySort] = useState<PharmacySortOption>('best_selling');
  const [productPharmacySort, setProductPharmacySort] = useState<ProductAreaSortOption>('units');
  const [filterProductCity, setFilterProductCity] = useState<string>('all');

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

  // Demo Seeding State
  const [seedingLoading, setSeedingLoading] = useState<boolean>(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState<boolean>(false);

  // Detect Demo status from current data
  const hasDemoData = useMemo(() => {
    return sales.some(s => (s as any).isDemo === true) || 
           Object.values(pharmaciesMap).some(p => (p as any).isDemo === true);
  }, [sales, pharmaciesMap]);

  // Extract Geographic Hierarchy from Pharmacies
  const geoHierarchy = useMemo(() => {
    const countries = new Set<string>();
    const regionsByCountry = new Map<string, Set<string>>();
    const citiesByRegion = new Map<string, Set<string>>();

    // Standard baseline
    countries.add('Ethiopia');

    (Object.values(pharmaciesMap) as any[]).forEach((pharm: any) => {
      const country = pharm.country || 'Ethiopia';
      const region = pharm.region || 'Addis Ababa';
      const city = pharm.city || pharm.address || 'Addis Ababa City';

      countries.add(country);

      if (!regionsByCountry.has(country)) {
        regionsByCountry.set(country, new Set<string>());
      }
      regionsByCountry.get(country)!.add(region);

      if (!citiesByRegion.has(region)) {
        citiesByRegion.set(region, new Set<string>());
      }
      citiesByRegion.get(region)!.add(city);
    });

    return {
      countries: Array.from(countries),
      regionsByCountry: Object.fromEntries(
        Array.from(regionsByCountry.entries()).map(([k, v]) => [k, Array.from(v)])
      ),
      citiesByRegion: Object.fromEntries(
        Array.from(citiesByRegion.entries()).map(([k, v]) => [k, Array.from(v)])
      )
    };
  }, [pharmaciesMap]);

  // Current available regions and cities based on parent selections
  const availableRegions = useMemo(() => {
    return geoHierarchy.regionsByCountry[selectedCountry] || [];
  }, [geoHierarchy, selectedCountry]);

  const availableCities = useMemo(() => {
    if (selectedRegion === 'all') {
      const allCities = new Set<string>();
      availableRegions.forEach(r => {
        (geoHierarchy.citiesByRegion[r] || []).forEach(c => allCities.add(c));
      });
      return Array.from(allCities);
    }
    return geoHierarchy.citiesByRegion[selectedRegion] || [];
  }, [geoHierarchy, selectedRegion, availableRegions]);

  // Filter sales based on current geographic selection
  const scopedSales = useMemo(() => {
    return sales.filter(s => {
      const pharm = pharmaciesMap[s.pharmacyId];
      if (!pharm) return false;

      const pCountry = pharm.country || 'Ethiopia';
      const pRegion = pharm.region || 'Addis Ababa';
      const pCity = pharm.city || pharm.address || 'Addis Ababa City';

      if (selectedCountry && pCountry !== selectedCountry) return false;
      if (selectedRegion !== 'all' && pRegion !== selectedRegion) return false;
      if (selectedCity !== 'all' && pCity !== selectedCity) return false;
      if (selectedPharmacyId && s.pharmacyId !== selectedPharmacyId) return false;

      return true;
    });
  }, [sales, pharmaciesMap, selectedCountry, selectedRegion, selectedCity, selectedPharmacyId]);

  // Scoped Pharmacies
  const scopedPharmacies = useMemo(() => {
    return Object.values(pharmaciesMap).filter((pharm: any) => {
      const pCountry = pharm.country || 'Ethiopia';
      const pRegion = pharm.region || 'Addis Ababa';
      const pCity = pharm.city || pharm.address || 'Addis Ababa City';

      if (selectedCountry && pCountry !== selectedCountry) return false;
      if (selectedRegion !== 'all' && pRegion !== selectedRegion) return false;
      if (selectedCity !== 'all' && pCity !== selectedCity) return false;

      return true;
    });
  }, [pharmaciesMap, selectedCountry, selectedRegion, selectedCity]);

  // Global Geographic Scope Summary KPIs
  const scopeKPIs = useMemo(() => {
    const totalTransactions = scopedSales.length;
    const totalRevenue = scopedSales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
    const totalUnits = scopedSales.reduce((sum, s) => 
      sum + s.items.reduce((iSum, it) => iSum + (Number(it.quantity) || 0), 0), 0
    );
    const activePharmaciesCount = new Set(scopedSales.map(s => s.pharmacyId)).size;
    const avgBasket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    let totalEstProfit = 0;
    scopedSales.forEach(s => {
      s.items.forEach(it => {
        const m = medicinesMap[it.productId] || medicinesMap[it.name.toLowerCase().trim()];
        const unitCost = (it as any).costPrice !== undefined ? Number((it as any).costPrice) : (m?.costPrice !== undefined ? Number(m.costPrice) : null);
        if (unitCost !== null && unitCost > 0) {
          const itemRev = Number(it.price) * Number(it.quantity);
          const itemCost = unitCost * Number(it.quantity);
          totalEstProfit += (itemRev - itemCost);
        }
      });
    });

    const marginPct = totalRevenue > 0 ? (totalEstProfit / totalRevenue) * 100 : 0;

    return {
      totalTransactions,
      totalRevenue,
      totalUnits,
      activePharmaciesCount,
      avgBasket,
      totalEstProfit,
      marginPct
    };
  }, [scopedSales, medicinesMap]);

  // 1. Regional Aggregates for Selected Country
  const regionAggregates = useMemo(() => {
    const map = new Map<string, {
      region: string;
      pharmacyCount: number;
      transactions: number;
      units: number;
      revenue: number;
    }>();

    availableRegions.forEach(r => {
      map.set(r, { region: r, pharmacyCount: 0, transactions: 0, units: 0, revenue: 0 });
    });

    // Count pharmacies
    Object.values(pharmaciesMap).forEach((p: any) => {
      const r = p.region || 'Addis Ababa';
      if (map.has(r)) {
        map.get(r)!.pharmacyCount += 1;
      }
    });

    // Add sales data
    sales.forEach(s => {
      const p = pharmaciesMap[s.pharmacyId];
      if (!p) return;
      const r = p.region || 'Addis Ababa';
      if (map.has(r)) {
        const entry = map.get(r)!;
        entry.transactions += 1;
        entry.revenue += (Number(s.totalAmount) || 0);
        entry.units += s.items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
      }
    });

    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [availableRegions, pharmaciesMap, sales]);

  // 2. City Aggregates for Selected Region
  const cityAggregates = useMemo(() => {
    const map = new Map<string, {
      city: string;
      region: string;
      pharmacyCount: number;
      transactions: number;
      units: number;
      revenue: number;
    }>();

    availableCities.forEach(c => {
      map.set(c, { city: c, region: selectedRegion, pharmacyCount: 0, transactions: 0, units: 0, revenue: 0 });
    });

    // Count pharmacies
    Object.values(pharmaciesMap).forEach((p: any) => {
      const r = p.region || 'Addis Ababa';
      const c = p.city || p.address || 'Addis Ababa City';
      if (selectedRegion !== 'all' && r !== selectedRegion) return;
      if (map.has(c)) {
        map.get(c)!.pharmacyCount += 1;
      }
    });

    // Add sales data
    sales.forEach(s => {
      const p = pharmaciesMap[s.pharmacyId];
      if (!p) return;
      const r = p.region || 'Addis Ababa';
      const c = p.city || p.address || 'Addis Ababa City';
      if (selectedRegion !== 'all' && r !== selectedRegion) return;
      if (map.has(c)) {
        const entry = map.get(c)!;
        entry.transactions += 1;
        entry.revenue += (Number(s.totalAmount) || 0);
        entry.units += s.items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
      }
    });

    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [availableCities, selectedRegion, pharmaciesMap, sales]);

  // 3. City Product Demand Table (Calculated from actual sales in scoped city/area)
  const cityProductDemand = useMemo(() => {
    const map = new Map<string, {
      productId: string;
      name: string;
      genericName: string;
      category: string;
      supplier: string;
      unitsSold: number;
      pharmacyIds: Set<string>;
      transactionsCount: number;
      totalRevenue: number;
      prices: number[];
      avgPrice: number;
      unitCost: number | null;
      estProfit: number | null;
      marginPct: number | null;
    }>();

    scopedSales.forEach(sale => {
      sale.items.forEach(item => {
        const key = item.name.trim().toLowerCase();
        const medMeta = medicinesMap[item.productId] || medicinesMap[key];
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const total = qty * price;
        const unitCost = (item as any).costPrice !== undefined 
          ? Number((item as any).costPrice) 
          : (medMeta?.costPrice !== undefined ? Number(medMeta.costPrice) : null);

        const supplier = (item as any).supplier || medMeta?.supplier || 'Direct Wholesale Supplier';

        if (!map.has(key)) {
          map.set(key, {
            productId: item.productId || key,
            name: item.name,
            genericName: medMeta?.genericName || 'Not specified',
            category: medMeta?.category || 'General Medicine',
            supplier,
            unitsSold: 0,
            pharmacyIds: new Set<string>(),
            transactionsCount: 0,
            totalRevenue: 0,
            prices: [],
            avgPrice: 0,
            unitCost,
            estProfit: null,
            marginPct: null
          });
        }

        const entry = map.get(key)!;
        entry.unitsSold += qty;
        entry.pharmacyIds.add(sale.pharmacyId);
        entry.transactionsCount += 1;
        entry.totalRevenue += total;
        entry.prices.push(price);
      });
    });

    const list = Array.from(map.values()).map(prod => {
      const avgPrice = prod.unitsSold > 0 ? prod.totalRevenue / prod.unitsSold : 0;
      let estProfit: number | null = null;
      let marginPct: number | null = null;
      if (prod.unitCost !== null && prod.unitCost > 0) {
        estProfit = prod.totalRevenue - (prod.unitsSold * prod.unitCost);
        marginPct = prod.totalRevenue > 0 ? (estProfit / prod.totalRevenue) * 100 : 0;
      }
      return {
        ...prod,
        avgPrice,
        estProfit,
        marginPct
      };
    });

    // Sort list according to cityProductSort
    list.sort((a, b) => {
      if (cityProductSort === 'units') return b.unitsSold - a.unitsSold;
      if (cityProductSort === 'revenue') return b.totalRevenue - a.totalRevenue;
      if (cityProductSort === 'pharmacies') return b.pharmacyIds.size - a.pharmacyIds.size;
      if (cityProductSort === 'transactions') return b.transactionsCount - a.transactionsCount;
      if (cityProductSort === 'profit') return (b.estProfit || 0) - (a.estProfit || 0);
      return b.unitsSold - a.unitsSold;
    });

    return list;
  }, [scopedSales, medicinesMap, cityProductSort]);

  // 4. City Pharmacy Rankings Table (Calculated from actual sales in scoped city/area)
  const cityPharmacyRankings = useMemo(() => {
    const map = new Map<string, {
      pharmacyId: string;
      pharmacyName: string;
      region: string;
      city: string;
      address: string;
      transactionsCount: number;
      unitsSold: number;
      grossRevenue: number;
      totalDiscounts: number;
      netRevenue: number;
      estCost: number;
      estProfit: number;
      marginPct: number;
      avgBasket: number;
    }>();

    // Initialize with all scoped pharmacies (even those with 0 sales yet)
    scopedPharmacies.forEach(p => {
      map.set(p.uid, {
        pharmacyId: p.uid,
        pharmacyName: p.pharmacyName || p.displayName || `Pharmacy #${p.uid.slice(0, 6)}`,
        region: p.region || 'Addis Ababa',
        city: p.city || p.address || 'Addis Ababa City',
        address: p.address || 'Address not listed',
        transactionsCount: 0,
        unitsSold: 0,
        grossRevenue: 0,
        totalDiscounts: 0,
        netRevenue: 0,
        estCost: 0,
        estProfit: 0,
        marginPct: 0,
        avgBasket: 0
      });
    });

    scopedSales.forEach(sale => {
      const pId = sale.pharmacyId;
      if (!map.has(pId)) {
        const p = pharmaciesMap[pId];
        map.set(pId, {
          pharmacyId: pId,
          pharmacyName: p?.pharmacyName || p?.displayName || `Pharmacy #${pId.slice(0, 6)}`,
          region: p?.region || 'Addis Ababa',
          city: p?.city || p?.address || 'Addis Ababa City',
          address: p?.address || 'Address not listed',
          transactionsCount: 0,
          unitsSold: 0,
          grossRevenue: 0,
          totalDiscounts: 0,
          netRevenue: 0,
          estCost: 0,
          estProfit: 0,
          marginPct: 0,
          avgBasket: 0
        });
      }

      const pEntry = map.get(pId)!;
      const gross = Number(sale.subtotalAmount || sale.totalAmount) || 0;
      const discount = Number((sale as any).discountAmount) || 0;
      const net = Number(sale.totalAmount) || 0;
      const units = sale.items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);

      pEntry.transactionsCount += 1;
      pEntry.unitsSold += units;
      pEntry.grossRevenue += gross;
      pEntry.totalDiscounts += discount;
      pEntry.netRevenue += net;

      // Cost calculation
      sale.items.forEach(it => {
        const m = medicinesMap[it.productId] || medicinesMap[it.name.toLowerCase().trim()];
        const unitCost = (it as any).costPrice !== undefined ? Number((it as any).costPrice) : (m?.costPrice !== undefined ? Number(m.costPrice) : null);
        if (unitCost !== null && unitCost > 0) {
          pEntry.estCost += unitCost * (Number(it.quantity) || 0);
        }
      });
    });

    const list = Array.from(map.values()).map(p => {
      const avgBasket = p.transactionsCount > 0 ? p.netRevenue / p.transactionsCount : 0;
      const estProfit = p.netRevenue - p.estCost;
      const marginPct = p.netRevenue > 0 ? (estProfit / p.netRevenue) * 100 : 0;
      return {
        ...p,
        avgBasket,
        estProfit,
        marginPct
      };
    });

    list.sort((a, b) => {
      if (cityPharmacySort === 'revenue') return b.netRevenue - a.netRevenue;
      if (cityPharmacySort === 'units') return b.unitsSold - a.unitsSold;
      if (cityPharmacySort === 'transactions') return b.transactionsCount - a.transactionsCount;
      if (cityPharmacySort === 'profit') return b.estProfit - a.estProfit;
      if (cityPharmacySort === 'basket') return b.avgBasket - a.avgBasket;
      return b.netRevenue - a.netRevenue;
    });

    return list;
  }, [scopedPharmacies, scopedSales, pharmaciesMap, medicinesMap, cityPharmacySort]);

  // 5. Individual Pharmacy Performance Data (when a pharmacy is selected)
  const selectedPharmacyData = useMemo(() => {
    if (!selectedPharmacyId) return null;
    const profile = pharmaciesMap[selectedPharmacyId];
    const pharmSales = sales.filter(s => s.pharmacyId === selectedPharmacyId);

    // Aggregate products sold by this pharmacy
    const prodMap = new Map<string, {
      name: string;
      genericName: string;
      category: string;
      supplier: string;
      unitsSold: number;
      revenue: number;
      transactions: number;
      prices: number[];
      avgPrice: number;
      unitCost: number | null;
      estProfit: number | null;
      marginPct: number | null;
    }>();

    pharmSales.forEach(s => {
      s.items.forEach(it => {
        const key = it.name.trim().toLowerCase();
        const medMeta = medicinesMap[it.productId] || medicinesMap[key] || rawMedicinesList.find(m => m.name?.trim().toLowerCase() === key);
        const qty = Number(it.quantity) || 0;
        const price = Number(it.price) || 0;
        const total = qty * price;
        const unitCost = (it as any).costPrice !== undefined 
          ? Number((it as any).costPrice) 
          : (medMeta?.costPrice !== undefined ? Number(medMeta.costPrice) : null);
        const supplier = (it as any).supplier || medMeta?.supplier || 'SUPPLIER INFORMATION NOT AVAILABLE';

        if (!prodMap.has(key)) {
          prodMap.set(key, {
            name: it.name,
            genericName: medMeta?.genericName || 'Not specified',
            category: medMeta?.category || 'General Medicine',
            supplier,
            unitsSold: 0,
            revenue: 0,
            transactions: 0,
            prices: [],
            avgPrice: 0,
            unitCost,
            estProfit: null,
            marginPct: null
          });
        }

        const entry = prodMap.get(key)!;
        entry.unitsSold += qty;
        entry.revenue += total;
        entry.transactions += 1;
        entry.prices.push(price);
        if (entry.supplier === 'SUPPLIER INFORMATION NOT AVAILABLE' && supplier !== 'SUPPLIER INFORMATION NOT AVAILABLE') {
          entry.supplier = supplier;
        }
      });
    });

    const rankedProducts = Array.from(prodMap.values()).map(p => {
      const avgPrice = p.unitsSold > 0 ? p.revenue / p.unitsSold : 0;
      let estProfit: number | null = null;
      let marginPct: number | null = null;
      if (p.unitCost !== null && p.unitCost > 0) {
        estProfit = p.revenue - (p.unitsSold * p.unitCost);
        marginPct = p.revenue > 0 ? (estProfit / p.revenue) * 100 : 0;
      }
      return {
        ...p,
        avgPrice,
        estProfit,
        marginPct
      };
    });

    // Sort products based on pharmacySort
    rankedProducts.sort((a, b) => {
      if (pharmacySort === 'best_selling') return b.unitsSold - a.unitsSold;
      if (pharmacySort === 'worst_selling') return a.unitsSold - b.unitsSold;
      if (pharmacySort === 'highest_revenue') return b.revenue - a.revenue;
      if (pharmacySort === 'highest_profit') return (b.estProfit || 0) - (a.estProfit || 0);
      if (pharmacySort === 'most_transactions') return b.transactions - a.transactions;
      return b.unitsSold - a.unitsSold;
    });

    // Zero-Sales / Slow Moving Medicines in Inventory for this pharmacy
    // Find all medicines belonging to this pharmacy that had 0 sales in the period
    const soldProductNames = new Set(Array.from(prodMap.keys()));
    const zeroSalesInventory = Object.values(medicinesMap).filter((m: any) => {
      if (m.pharmacyId !== selectedPharmacyId) return false;
      const key = (m.name || '').trim().toLowerCase();
      return !soldProductNames.has(key);
    });

    const totalRev = pharmSales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
    const totalUnits = pharmSales.reduce((acc, s) => 
      acc + s.items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0), 0
    );

    return {
      profile,
      pharmacyId: selectedPharmacyId,
      pharmacyName: profile?.pharmacyName || profile?.displayName || `Pharmacy #${selectedPharmacyId.slice(0, 6)}`,
      city: profile?.city || profile?.address || 'Addis Ababa City',
      region: profile?.region || 'Addis Ababa',
      address: profile?.address || 'Address not listed',
      salesCount: pharmSales.length,
      totalRevenue: totalRev,
      totalUnits,
      avgBasket: pharmSales.length > 0 ? totalRev / pharmSales.length : 0,
      rankedProducts,
      zeroSalesInventory
    };
  }, [selectedPharmacyId, pharmaciesMap, sales, medicinesMap, pharmacySort]);

  // 6. Product -> Pharmacy & Area Demand Analysis (when a product is selected)
  const selectedProductAnalysis = useMemo(() => {
    if (!selectedProductId) return null;

    // Look for product in medicines or sales
    let prodMeta = medicinesMap[selectedProductId] || medicinesMap[selectedProductId.toLowerCase().trim()];
    if (!prodMeta) {
      prodMeta = rawMedicinesList.find(m => 
        m.id === selectedProductId || 
        m.name?.toLowerCase().trim() === selectedProductId.toLowerCase().trim()
      );
    }
    let prodName = prodMeta?.name || selectedProductId;

    // Find all sales of this product across the network
    const productSales: {
      sale: Sale;
      item: { name: string; quantity: number; price: number; total: number; costPrice?: number; supplier?: string };
      pharmacyId: string;
      city: string;
      region: string;
    }[] = [];

    sales.forEach(s => {
      const p = pharmaciesMap[s.pharmacyId];
      s.items.forEach(it => {
        if (
          it.productId === selectedProductId || 
          it.name.toLowerCase().trim() === selectedProductId.toLowerCase().trim() ||
          (prodMeta && it.name.toLowerCase().trim() === prodMeta.name?.toLowerCase().trim())
        ) {
          prodName = it.name;
          productSales.push({
            sale: s,
            item: it,
            pharmacyId: s.pharmacyId,
            city: p?.city || p?.address || 'Addis Ababa City',
            region: p?.region || 'Addis Ababa'
          });
        }
      });
    });

    // Determine primary wholesale supplier
    let supplierFound = prodMeta?.supplier?.trim();
    if (!supplierFound || supplierFound === 'Not specified') {
      for (const ps of productSales) {
        if (ps.item.supplier && ps.item.supplier !== 'Not specified') {
          supplierFound = ps.item.supplier;
          break;
        }
      }
    }
    const resolvedSupplier = supplierFound && supplierFound !== 'Not specified'
      ? supplierFound 
      : 'SUPPLIER INFORMATION NOT AVAILABLE';

    // Total Network Metrics for this Product
    const networkUnits = productSales.reduce((sum, p) => sum + (Number(p.item.quantity) || 0), 0);
    const networkRevenue = productSales.reduce((sum, p) => sum + ((Number(p.item.quantity) || 0) * (Number(p.item.price) || 0)), 0);
    const networkTransactions = productSales.length;
    const avgSellingPrice = networkUnits > 0 ? networkRevenue / networkUnits : 0;
    const activePharmacies = new Set(productSales.map(p => p.pharmacyId)).size;

    // Product Demand by Area (Ranked Cities & Regions)
    const cityDemandMap = new Map<string, { city: string; region: string; units: number; revenue: number; transactions: number }>();
    productSales.forEach(p => {
      if (!cityDemandMap.has(p.city)) {
        cityDemandMap.set(p.city, { city: p.city, region: p.region, units: 0, revenue: 0, transactions: 0 });
      }
      const cEntry = cityDemandMap.get(p.city)!;
      cEntry.units += Number(p.item.quantity) || 0;
      cEntry.revenue += (Number(p.item.quantity) || 0) * (Number(p.item.price) || 0);
      cEntry.transactions += 1;
    });

    const rankedAreas = Array.from(cityDemandMap.values()).sort((a, b) => b.units - a.units);

    // Every Pharmacy Selling this Product
    const pharmacySalesMap = new Map<string, {
      pharmacyId: string;
      pharmacyName: string;
      city: string;
      region: string;
      unitsSold: number;
      revenue: number;
      transactions: number;
      avgPrice: number;
    }>();

    productSales.forEach(p => {
      const pProfile = pharmaciesMap[p.pharmacyId];
      const pName = pProfile?.pharmacyName || pProfile?.displayName || `Pharmacy #${p.pharmacyId.slice(0, 6)}`;

      if (!pharmacySalesMap.has(p.pharmacyId)) {
        pharmacySalesMap.set(p.pharmacyId, {
          pharmacyId: p.pharmacyId,
          pharmacyName: pName,
          city: p.city,
          region: p.region,
          unitsSold: 0,
          revenue: 0,
          transactions: 0,
          avgPrice: 0
        });
      }

      const entry = pharmacySalesMap.get(p.pharmacyId)!;
      entry.unitsSold += Number(p.item.quantity) || 0;
      entry.revenue += (Number(p.item.quantity) || 0) * (Number(p.item.price) || 0);
      entry.transactions += 1;
    });

    const pharmaciesList = Array.from(pharmacySalesMap.values()).map(ph => ({
      ...ph,
      avgPrice: ph.unitsSold > 0 ? ph.revenue / ph.unitsSold : 0
    }));

    // Sort pharmacies selling it
    pharmaciesList.sort((a, b) => {
      if (productPharmacySort === 'units') return b.unitsSold - a.unitsSold;
      if (productPharmacySort === 'revenue') return b.revenue - a.revenue;
      if (productPharmacySort === 'transactions') return b.transactions - a.transactions;
      if (productPharmacySort === 'avg_price') return b.avgPrice - a.avgPrice;
      return b.unitsSold - a.unitsSold;
    });

    return {
      productId: selectedProductId,
      productName: prodName,
      genericName: prodMeta?.genericName || 'Not specified',
      category: prodMeta?.category || 'General Medicine',
      supplier: resolvedSupplier,
      networkUnits,
      networkRevenue,
      networkTransactions,
      avgSellingPrice,
      activePharmacies,
      rankedAreas,
      pharmaciesList
    };
  }, [selectedProductId, sales, pharmaciesMap, medicinesMap, rawMedicinesList, productPharmacySort]);

  // Filtered pharmacies list for the selected product based on filterProductCity
  const filteredProductPharmaciesList = useMemo(() => {
    if (!selectedProductAnalysis) return [];
    if (filterProductCity === 'all') return selectedProductAnalysis.pharmaciesList;
    return selectedProductAnalysis.pharmaciesList.filter(
      p => p.city.toLowerCase().trim() === filterProductCity.toLowerCase().trim()
    );
  }, [selectedProductAnalysis, filterProductCity]);

  // Unified Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return null;
    const q = searchQuery.toLowerCase().trim();

    // 1. Matching Pharmacies
    const matchingPharmacies = (Object.values(pharmaciesMap) as any[]).filter((p: any) => {
      const name = (p.pharmacyName || p.displayName || '').toLowerCase();
      const id = (p.uid || '').toLowerCase();
      const city = (p.city || '').toLowerCase();
      return name.includes(q) || id.includes(q) || city.includes(q);
    }).slice(0, 5);

    // 2. Matching Products
    const prodSet = new Map<string, { name: string; genericName: string; category: string }>();
    (Object.values(medicinesMap) as any[]).forEach((m: any) => {
      if (!m.name) return;
      const name = m.name.toLowerCase();
      const gen = (m.genericName || '').toLowerCase();
      if (name.includes(q) || gen.includes(q)) {
        prodSet.set(m.name, {
          name: m.name,
          genericName: m.genericName || 'Not specified',
          category: m.category || 'Medicine'
        });
      }
    });
    const matchingProducts = Array.from(prodSet.values()).slice(0, 5);

    // 3. Matching Cities & Regions
    const matchingCities: { city: string; region: string }[] = [];
    Object.entries(geoHierarchy.citiesByRegion as Record<string, string[]>).forEach(([region, cities]) => {
      (cities || []).forEach((city: string) => {
        if (city.toLowerCase().includes(q) || region.toLowerCase().includes(q)) {
          matchingCities.push({ city, region });
        }
      });
    });

    return {
      pharmacies: matchingPharmacies,
      products: matchingProducts,
      cities: matchingCities.slice(0, 5)
    };
  }, [searchQuery, pharmaciesMap, medicinesMap, geoHierarchy]);

  // Demo Seed Execution
  const handleSeedDemoData = async () => {
    if (currentUser.role !== 'admin') {
      toast.error('Only Super Admins can seed demo datasets.');
      return;
    }

    setSeedingLoading(true);
    const toastId = toast.loading('Seeding realistic multi-city pharmacy demo data with products and sales...');
    try {
      const res = await seedDemoSalesData();
      if (res.success) {
        toast.success(
          `Demo data seeded successfully! (${res.stats.pharmacies} Pharmacies, ${res.stats.medicines} Medicines, ${res.stats.sales} Sales across 4 regions)`,
          { id: toastId, duration: 5000 }
        );
        onRefresh();
      } else {
        toast.error(`Seeding failed: ${res.error}`, { id: toastId });
      }
    } catch (err: any) {
      toast.error(`Unexpected error: ${err.message}`, { id: toastId });
    } finally {
      setSeedingLoading(false);
    }
  };

  // Demo Clear Execution
  const handleClearDemoData = async () => {
    if (currentUser.role !== 'admin') {
      toast.error('Only Super Admins can clear demo datasets.');
      return;
    }

    setSeedingLoading(true);
    const toastId = toast.loading('Clearing all demo records (isDemo === true)...');
    try {
      const res = await clearDemoSalesData();
      if (res.success) {
        toast.success(`Demo data cleanly purged! (${res.deletedCount} demo records removed)`, { id: toastId });
        setConfirmClearOpen(false);
        onRefresh();
      } else {
        toast.error(`Purge failed: ${res.error}`, { id: toastId });
      }
    } catch (err: any) {
      toast.error(`Unexpected error: ${err.message}`, { id: toastId });
    } finally {
      setSeedingLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="geographic-sales-intelligence-root">
      
      {/* 1. Header with Breadcrumb & Quick Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        
        {/* Top bar with Title and Demo Badge */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    Geographic Sales & Product Intelligence
                  </h2>
                  {hasDemoData && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      <Sparkles className="w-3 h-3" />
                      Demo Dataset Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Hierarchical analysis: Country → Region → City → Pharmacy → Product demand and revenue performance
                </p>
              </div>
            </div>
          </div>

          {/* Demo Controls for Super Admin */}
          {currentUser.role === 'admin' && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleSeedDemoData}
                disabled={seedingLoading || loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl transition-all shadow-sm"
                title="Seed realistic multi-city Ethiopian pharmacies, wholesale suppliers, and sales records"
                id="seed-demo-data-btn"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>{hasDemoData ? 'Re-Seed Demo Data' : 'Seed Realistic Demo Data'}</span>
              </button>

              {hasDemoData && (
                <button
                  onClick={() => setConfirmClearOpen(true)}
                  disabled={seedingLoading || loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl transition-all shadow-sm"
                  title="Purge only demo records (isDemo: true), protecting production data"
                  id="purge-demo-data-btn"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Purge Demo Data</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Interactive Breadcrumb Hierarchy Bar */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-bold pt-2 border-t border-slate-100 dark:border-slate-800" id="geo-breadcrumb-bar">
          <span className="text-slate-400 font-normal">Hierarchy Level:</span>

          {/* Country Level */}
          <button
            onClick={() => {
              setSelectedRegion('all');
              setSelectedCity('all');
              setSelectedPharmacyId(null);
              setSelectedProductId(null);
            }}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
              selectedRegion === 'all' && !selectedPharmacyId && !selectedProductId
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{selectedCountry} (National)</span>
          </button>

          {/* Region Level */}
          {selectedRegion !== 'all' && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <button
                onClick={() => {
                  setSelectedCity('all');
                  setSelectedPharmacyId(null);
                  setSelectedProductId(null);
                }}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                  selectedCity === 'all' && !selectedPharmacyId && !selectedProductId
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Region: {selectedRegion}</span>
              </button>
            </>
          )}

          {/* City Level */}
          {selectedCity !== 'all' && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <button
                onClick={() => {
                  setSelectedPharmacyId(null);
                  setSelectedProductId(null);
                }}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                  !selectedPharmacyId && !selectedProductId
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>City: {selectedCity}</span>
              </button>
            </>
          )}

          {/* Pharmacy Level */}
          {selectedPharmacyId && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg shadow-sm">
                <Building2 className="w-3.5 h-3.5" />
                <span>Pharmacy: {selectedPharmacyData?.pharmacyName}</span>
                <button 
                  onClick={() => setSelectedPharmacyId(null)}
                  className="ml-1 p-0.5 hover:bg-blue-700 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </>
          )}

          {/* Product Level (if inspecting specific product) */}
          {selectedProductId && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-lg shadow-sm">
                <Package className="w-3.5 h-3.5" />
                <span>Product: {selectedProductAnalysis?.productName}</span>
                <button 
                  onClick={() => setSelectedProductId(null)}
                  className="ml-1 p-0.5 hover:bg-indigo-700 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Geographic Selection & Unified Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          
          {/* Region Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Select Region
            </label>
            <select
              value={selectedRegion}
              onChange={e => {
                setSelectedRegion(e.target.value);
                setSelectedCity('all');
                setSelectedPharmacyId(null);
                setSelectedProductId(null);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              id="geo-region-select"
            >
              <option value="all">All Regions in {selectedCountry}</option>
              {availableRegions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* City Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Select City / District
            </label>
            <select
              value={selectedCity}
              onChange={e => {
                setSelectedCity(e.target.value);
                setSelectedPharmacyId(null);
                setSelectedProductId(null);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              id="geo-city-select"
            >
              <option value="all">All Cities ({availableCities.length})</option>
              {availableCities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Pharmacy Quick Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Select Pharmacy Outlet
            </label>
            <select
              value={selectedPharmacyId || 'all'}
              onChange={e => {
                const val = e.target.value;
                setSelectedPharmacyId(val === 'all' ? null : val);
                setSelectedProductId(null);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              id="geo-pharmacy-select"
            >
              <option value="all">All Pharmacies in Scope ({scopedPharmacies.length})</option>
              {scopedPharmacies.map(p => (
                <option key={p.uid} value={p.uid}>
                  {p.pharmacyName || p.displayName || p.uid.slice(0, 8)} ({p.city || 'Central'})
                </option>
              ))}
            </select>
          </div>

          {/* Global Search Bar with Autocomplete Dropdown */}
          <div className="relative">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Fast Search (Pharmacy / Medicine / City)
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowSearchResults(true)}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                placeholder="Search pharmacy, medicine, city..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                id="geo-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Search Dropdown Popup */}
            {showSearchResults && searchResults && (
              <div 
                className="absolute z-50 mt-1 w-80 md:w-96 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-3 space-y-3 max-h-96 overflow-y-auto"
                id="geo-search-results-popup"
              >
                {/* Matching Pharmacies */}
                {searchResults.pharmacies.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-blue-500" />
                      Pharmacies ({searchResults.pharmacies.length})
                    </span>
                    <div className="space-y-1">
                      {searchResults.pharmacies.map(p => (
                        <button
                          key={p.uid}
                          onClick={() => {
                            setSelectedPharmacyId(p.uid);
                            setSelectedRegion(p.region || 'all');
                            setSelectedCity(p.city || p.address || 'all');
                            setSelectedProductId(null);
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs flex items-center justify-between transition-all"
                        >
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {p.pharmacyName || p.displayName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {p.city} • {p.region}
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matching Products */}
                {searchResults.products.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1">
                      <Package className="w-3 h-3 text-emerald-500" />
                      Medicines ({searchResults.products.length})
                    </span>
                    <div className="space-y-1">
                      {searchResults.products.map(pr => (
                        <button
                          key={pr.name}
                          onClick={() => {
                            setSelectedProductId(pr.name);
                            setSelectedPharmacyId(null);
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs flex items-center justify-between transition-all"
                        >
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {pr.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {pr.genericName} • {pr.category}
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matching Cities */}
                {searchResults.cities.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-500" />
                      Cities & Locations
                    </span>
                    <div className="space-y-1">
                      {searchResults.cities.map(c => (
                        <button
                          key={c.city}
                          onClick={() => {
                            setSelectedRegion(c.region);
                            setSelectedCity(c.city);
                            setSelectedPharmacyId(null);
                            setSelectedProductId(null);
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs flex items-center justify-between transition-all"
                        >
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {c.city}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Region: {c.region}
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.pharmacies.length === 0 && searchResults.products.length === 0 && searchResults.cities.length === 0 && (
                  <div className="text-center py-4 text-xs text-slate-400">
                    No matching pharmacies, medicines, or cities found.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Geographic KPI Strip for the currently scoped area */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Scope Gross Revenue
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {scopeKPIs.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-400">ETB</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Scope:</span>
            <span className="font-bold text-blue-600">
              {selectedPharmacyId ? 'Pharmacy' : selectedCity !== 'all' ? selectedCity : selectedRegion !== 'all' ? selectedRegion : 'National'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Scope Units Sold
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {scopeKPIs.totalUnits.toLocaleString()} <span className="text-xs font-normal text-slate-400">Units</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across {scopeKPIs.totalTransactions} transactions
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Active Outlets
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {scopeKPIs.activePharmaciesCount} <span className="text-xs font-normal text-slate-400">/ {scopedPharmacies.length}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Reporting sales in this period
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Estimated Gross Profit
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {scopeKPIs.totalEstProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-400">ETB</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Avg Margin: <span className="font-bold text-emerald-600">{scopeKPIs.marginPct.toFixed(1)}%</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-2 md:col-span-1">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Average Basket
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {scopeKPIs.avgBasket.toFixed(2)} <span className="text-xs font-normal text-slate-400">ETB</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Per customer transaction
          </div>
        </div>
      </div>

      {/* 3. Drill-Down Views */}

      {/* VIEW A: Product -> Pharmacy & Area Demand Analysis (when user clicks a product) */}
      {selectedProductId && selectedProductAnalysis && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-indigo-200 dark:border-indigo-900/50 shadow-sm overflow-hidden p-6 space-y-6" id="product-demand-analysis-view">
          
          {/* Product Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full">
                  Product Demand Intelligence
                </span>
                <span className="text-xs text-slate-500">Network Traceability</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {selectedProductAnalysis.productName}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span>Generic: <strong className="text-slate-700 dark:text-slate-300">{selectedProductAnalysis.genericName}</strong></span>
                <span>•</span>
                <span>Category: <strong className="text-slate-700 dark:text-slate-300">{selectedProductAnalysis.category}</strong></span>
                <span>•</span>
                <span>Supplier: <strong className="text-slate-700 dark:text-slate-300">{selectedProductAnalysis.supplier}</strong></span>
              </div>
            </div>

            <button
              onClick={() => setSelectedProductId(null)}
              className="self-start md:self-center px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
            >
              Close Product View
            </button>
          </div>

          {/* Product Network Performance Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
              <div className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase">Total Units Consumed</div>
              <div className="text-2xl font-black text-indigo-900 dark:text-indigo-200 mt-1">
                {selectedProductAnalysis.networkUnits.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Across all cities & pharmacies</div>
            </div>

            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase">Total Network Revenue</div>
              <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200 mt-1">
                {selectedProductAnalysis.networkRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">ETB</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Gross retail sales value</div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-500 font-bold uppercase">Average Selling Price</div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">
                {selectedProductAnalysis.avgSellingPrice.toFixed(2)} <span className="text-xs font-normal">ETB</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Network average price</div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-500 font-bold uppercase">Active Selling Outlets</div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">
                {selectedProductAnalysis.activePharmacies} <span className="text-xs font-normal">Pharmacies</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Stocking & dispensing this item</div>
            </div>
          </div>

          {/* Product Demand by Area (Ranked Cities) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Product Demand by Geographical Area (Ranked Cities)
                </h4>
              </div>
              <span className="text-xs text-slate-500">
                Sorted by units consumed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {selectedProductAnalysis.rankedAreas.map((area, idx) => {
                const pct = selectedProductAnalysis.networkUnits > 0 
                  ? ((area.units / selectedProductAnalysis.networkUnits) * 100).toFixed(1) 
                  : '0';
                const isSelectedCity = filterProductCity.toLowerCase() === area.city.toLowerCase();

                return (
                  <div 
                    key={area.city}
                    onClick={() => setFilterProductCity(isSelectedCity ? 'all' : area.city)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                      isSelectedCity
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">#{idx + 1} Demand Hub</span>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{pct}% Share</span>
                    </div>
                    <div className="text-base font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-center justify-between">
                      <span>{area.city}</span>
                      {isSelectedCity && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-600 text-white">Active</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mb-2">
                      Region: {area.region}
                    </div>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Units Sold</span>
                        <strong className="text-slate-800 dark:text-slate-200">{area.units.toLocaleString()}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px]">Revenue</span>
                        <strong className="text-emerald-600">{area.revenue.toLocaleString()} ETB</strong>
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] text-center text-indigo-600 dark:text-indigo-400 font-semibold">
                      {isSelectedCity ? 'Click to show all cities' : 'Click to filter pharmacies'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Table: Every Pharmacy Selling This Product */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Pharmacies Dispensing {selectedProductAnalysis.productName}
                  {filterProductCity !== 'all' ? ` in ${filterProductCity}` : ''} ({filteredProductPharmaciesList.length})
                </h4>
                {filterProductCity !== 'all' && (
                  <button
                    onClick={() => setFilterProductCity('all')}
                    className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200"
                  >
                    Clear City Filter ✕
                  </button>
                )}
              </div>

              {/* Sorter */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold">Sort By:</span>
                <select
                  value={productPharmacySort}
                  onChange={e => setProductPharmacySort(e.target.value as ProductAreaSortOption)}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                >
                  <option value="units">Units Sold (Highest)</option>
                  <option value="revenue">Total Revenue (Highest)</option>
                  <option value="transactions">Transactions (Most)</option>
                  <option value="avg_price">Avg Dispensing Price</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">Pharmacy Name</th>
                    <th className="p-3">City / Area</th>
                    <th className="p-3">Region</th>
                    <th className="p-3 text-right">Units Sold</th>
                    <th className="p-3 text-right">Transactions</th>
                    <th className="p-3 text-right">Total Revenue</th>
                    <th className="p-3 text-right">Avg Unit Price</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProductPharmaciesList.map((ph, idx) => (
                    <tr key={ph.pharmacyId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-bold text-slate-400">#{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                        {ph.pharmacyName}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{ph.city}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{ph.region}</td>
                      <td className="p-3 text-right font-black text-indigo-600 dark:text-indigo-400">
                        {ph.unitsSold.toLocaleString()}
                      </td>
                      <td className="p-3 text-right text-slate-700 dark:text-slate-300">
                        {ph.transactions}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-600">
                        {ph.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                      </td>
                      <td className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                        {ph.avgPrice.toFixed(2)} ETB
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedPharmacyId(ph.pharmacyId);
                            setSelectedRegion(ph.region);
                            setSelectedCity(ph.city);
                            setSelectedProductId(null);
                          }}
                          className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-lg text-xs font-bold transition-all"
                        >
                          Inspect Pharmacy
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: Individual Pharmacy Performance & Product Ranking (when user selects a pharmacy) */}
      {selectedPharmacyId && selectedPharmacyData && !selectedProductId && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-blue-200 dark:border-blue-900/50 shadow-sm overflow-hidden p-6 space-y-6" id="individual-pharmacy-audit-view">
          
          {/* Pharmacy Profile Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
                  Individual Pharmacy Performance
                </span>
                <span className="text-xs text-slate-400">ID: {selectedPharmacyData.pharmacyId}</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {selectedPharmacyData.pharmacyName}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  {selectedPharmacyData.city}, {selectedPharmacyData.region}
                </span>
                <span>•</span>
                <span>Address: {selectedPharmacyData.address}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedPharmacyId(null)}
              className="self-start md:self-center px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
            >
              Back to City View
            </button>
          </div>

          {/* Pharmacy Sales KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-500 font-bold uppercase">Total Net Revenue</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {selectedPharmacyData.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs font-normal">ETB</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">{selectedPharmacyData.salesCount} Completed Transactions</div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-500 font-bold uppercase">Total Units Dispensed</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {selectedPharmacyData.totalUnits.toLocaleString()} <span className="text-xs font-normal">Units</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Across {selectedPharmacyData.rankedProducts.length} unique medicines</div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-500 font-bold uppercase">Average Basket Value</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {selectedPharmacyData.avgBasket.toFixed(2)} <span className="text-xs font-normal">ETB</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Per dispensing order</div>
            </div>

            <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800">
              <div className="text-xs text-amber-700 dark:text-amber-400 font-bold uppercase">Zero-Sales Inventory Items</div>
              <div className="text-2xl font-black text-amber-800 dark:text-amber-300 mt-1">
                {selectedPharmacyData.zeroSalesInventory.length} <span className="text-xs font-normal">Items</span>
              </div>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">Slow-moving products in stock</div>
            </div>
          </div>

          {/* Pharmacy Products Ranked: Best Selling to Worst Selling */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Product Sales Ranking (Best to Worst Selling)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculated from actual completed POS sales records of this pharmacy
                </p>
              </div>

              {/* Sorting Options */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold">Ranking Mode:</span>
                <select
                  value={pharmacySort}
                  onChange={e => setPharmacySort(e.target.value as PharmacySortOption)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                  id="pharmacy-products-sort-select"
                >
                  <option value="best_selling">Best Selling (Highest Units)</option>
                  <option value="worst_selling">Worst Selling (Lowest Units)</option>
                  <option value="highest_revenue">Highest Revenue</option>
                  <option value="highest_profit">Highest Estimated Profit</option>
                  <option value="most_transactions">Most Transactions</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Generic Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Wholesale Supplier</th>
                    <th className="p-3 text-right">Units Sold</th>
                    <th className="p-3 text-right">Transactions</th>
                    <th className="p-3 text-right">Total Revenue</th>
                    <th className="p-3 text-right">Avg Unit Price</th>
                    <th className="p-3 text-right">Est. Gross Profit</th>
                    <th className="p-3 text-right">Margin %</th>
                    <th className="p-3 text-center">Analyze</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedPharmacyData.rankedProducts.map((p, idx) => (
                    <tr key={p.name} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-bold text-slate-400">
                        {pharmacySort === 'worst_selling' ? `#${selectedPharmacyData.rankedProducts.length - idx}` : `#${idx + 1}`}
                      </td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                        {p.name}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{p.genericName}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-3">
                        {p.supplier && p.supplier !== 'SUPPLIER INFORMATION NOT AVAILABLE' ? (
                          <div>
                            <div className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate max-w-[140px]" title={p.supplier}>{p.supplier}</span>
                            </div>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Verified Supplier</span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                            SUPPLIER INFORMATION NOT AVAILABLE
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-black text-blue-600 dark:text-blue-400">
                        {p.unitsSold.toLocaleString()}
                      </td>
                      <td className="p-3 text-right text-slate-700 dark:text-slate-300">
                        {p.transactions}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">
                        {p.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                      </td>
                      <td className="p-3 text-right text-slate-600 dark:text-slate-400">
                        {p.avgPrice.toFixed(2)} ETB
                      </td>
                      <td className="p-3 text-right font-semibold text-emerald-600">
                        {p.estProfit !== null ? `${p.estProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB` : '—'}
                      </td>
                      <td className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                        {p.marginPct !== null ? `${p.marginPct.toFixed(1)}%` : '—'}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedProductId(p.name)}
                          className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-all"
                        >
                          Network Demand
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: ZERO SALES / SLOW MOVING INVENTORY for this Pharmacy */}
          {selectedPharmacyData.zeroSalesInventory.length > 0 && (
            <div className="p-5 bg-amber-50/40 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/80 space-y-3" id="zero-sales-inventory-block">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <div>
                  <h4 className="text-sm font-black text-amber-900 dark:text-amber-200">
                    NO SALES / SLOW MOVING INVENTORY ({selectedPharmacyData.zeroSalesInventory.length} Items)
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    These medicines exist in this pharmacy's inventory catalog but logged ZERO sales in the active date period.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {selectedPharmacyData.zeroSalesInventory.map(med => (
                  <div 
                    key={med.id || med.name}
                    className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/80 dark:border-amber-900/60 text-xs space-y-1 shadow-sm"
                  >
                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate" title={med.name}>
                      {med.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Generic: {med.genericName || 'Not specified'}
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-amber-600 font-bold">0 Units Sold</span>
                      <span className="text-slate-600 dark:text-slate-400">Stock: {med.quantity || 0}</span>
                      <span className="text-slate-600 dark:text-slate-400">{med.price ? `${med.price} ETB` : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW C: Main City Level or Regional Hub Level (Default view when no specific pharmacy or product is pinned) */}
      {!selectedPharmacyId && !selectedProductId && (
        <div className="space-y-6">
          
          {/* Sub-tabs: City Product Demand VS City Pharmacy Rankings */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            
            {/* View Tab Switcher & Title */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {selectedCity !== 'all' 
                    ? `City Intelligence: ${selectedCity}` 
                    : selectedRegion !== 'all' 
                    ? `Regional Intelligence: ${selectedRegion}` 
                    : `National Pharmacy Intelligence (${selectedCountry})`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Actual POS sales demand, top consumed medications, and competitive pharmacy rankings
                </p>
              </div>

              {/* Sub-tab Pills */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setCityTab('products')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    cityTab === 'products'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  id="tab-city-product-demand"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>City Product Demand ({cityProductDemand.length})</span>
                </button>

                <button
                  onClick={() => setCityTab('pharmacies')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    cityTab === 'pharmacies'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  id="tab-city-pharmacy-rankings"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Pharmacy Rankings ({cityPharmacyRankings.length})</span>
                </button>
              </div>
            </div>

            {/* TAB 1: City Product Demand Table */}
            {cityTab === 'products' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    Showing <strong className="text-slate-800 dark:text-slate-200">{cityProductDemand.length}</strong> products with active sales in the selected scope.
                  </div>

                  {/* Sorter */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 font-semibold">Sort Demand By:</span>
                    <select
                      value={cityProductSort}
                      onChange={e => setCityProductSort(e.target.value as CityProductSortOption)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                      id="city-product-demand-sort"
                    >
                      <option value="units">Units Sold (Highest)</option>
                      <option value="revenue">Total Revenue (Highest)</option>
                      <option value="pharmacies">Selling Pharmacies Count</option>
                      <option value="transactions">Transaction Volume</option>
                      <option value="profit">Estimated Profit</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3">Rank</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Generic Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3 text-right">Units Sold</th>
                        <th className="p-3 text-right">Pharmacies</th>
                        <th className="p-3 text-right">Transactions</th>
                        <th className="p-3 text-right">Total Revenue</th>
                        <th className="p-3 text-right">Avg Price</th>
                        <th className="p-3 text-right">Est. Profit</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {cityProductDemand.map((prod, idx) => (
                        <tr key={prod.name} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-bold text-slate-400">#{idx + 1}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-800 dark:text-slate-200">{prod.name}</div>
                            <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-0.5">
                              <span>Source: {prod.supplier}</span>
                            </div>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{prod.genericName}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {prod.category}
                            </span>
                          </td>
                          <td className="p-3 text-right font-black text-blue-600 dark:text-blue-400">
                            {prod.unitsSold.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-bold text-slate-700 dark:text-slate-300">
                            {prod.pharmacyIds.size}
                          </td>
                          <td className="p-3 text-right text-slate-600 dark:text-slate-400">
                            {prod.transactionsCount}
                          </td>
                          <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">
                            {prod.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                          </td>
                          <td className="p-3 text-right text-slate-600 dark:text-slate-400">
                            {prod.avgPrice.toFixed(2)} ETB
                          </td>
                          <td className="p-3 text-right font-semibold text-emerald-600">
                            {prod.estProfit !== null ? `${prod.estProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB` : '—'}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => setSelectedProductId(prod.name)}
                              className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-all"
                            >
                              Network Demand
                            </button>
                          </td>
                        </tr>
                      ))}

                      {cityProductDemand.length === 0 && (
                        <tr>
                          <td colSpan={11} className="p-8 text-center text-slate-400">
                            No product sales logged in this geographical area for the selected date range.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: City Pharmacy Rankings Table */}
            {cityTab === 'pharmacies' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    Showing <strong className="text-slate-800 dark:text-slate-200">{cityPharmacyRankings.length}</strong> pharmacies in the selected scope.
                  </div>

                  {/* Sorter */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 font-semibold">Rank By:</span>
                    <select
                      value={cityPharmacySort}
                      onChange={e => setCityPharmacySort(e.target.value as CityPharmacySortOption)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                      id="city-pharmacy-rankings-sort"
                    >
                      <option value="revenue">Net Revenue (Highest)</option>
                      <option value="units">Units Dispensed (Highest)</option>
                      <option value="transactions">Transaction Volume</option>
                      <option value="profit">Estimated Profit</option>
                      <option value="basket">Average Basket Value</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3">Rank</th>
                        <th className="p-3">Pharmacy Name</th>
                        <th className="p-3">City / Area</th>
                        <th className="p-3">Region</th>
                        <th className="p-3 text-right">Transactions</th>
                        <th className="p-3 text-right">Units Sold</th>
                        <th className="p-3 text-right">Net Revenue</th>
                        <th className="p-3 text-right">Est. Profit</th>
                        <th className="p-3 text-right">Margin %</th>
                        <th className="p-3 text-right">Avg Basket</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {cityPharmacyRankings.map((ph, idx) => (
                        <tr key={ph.pharmacyId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-bold text-slate-400">#{idx + 1}</td>
                          <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                            {ph.pharmacyName}
                            <div className="text-[10px] text-slate-400 font-normal">ID: {ph.pharmacyId}</div>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{ph.city}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{ph.region}</td>
                          <td className="p-3 text-right text-slate-700 dark:text-slate-300">
                            {ph.transactionsCount}
                          </td>
                          <td className="p-3 text-right font-black text-blue-600 dark:text-blue-400">
                            {ph.unitsSold.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">
                            {ph.netRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                          </td>
                          <td className="p-3 text-right font-semibold text-emerald-600">
                            {ph.estProfit > 0 ? `${ph.estProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB` : '—'}
                          </td>
                          <td className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                            {ph.marginPct > 0 ? `${ph.marginPct.toFixed(1)}%` : '—'}
                          </td>
                          <td className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                            {ph.avgBasket.toFixed(2)} ETB
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedPharmacyId(ph.pharmacyId);
                                setSelectedRegion(ph.region);
                                setSelectedCity(ph.city);
                              }}
                              className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-lg text-xs font-bold transition-all"
                            >
                              Inspect Pharmacy
                            </button>
                          </td>
                        </tr>
                      ))}

                      {cityPharmacyRankings.length === 0 && (
                        <tr>
                          <td colSpan={11} className="p-8 text-center text-slate-400">
                            No pharmacies registered in this geographical scope.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Regional & City Breakdown Cards (When at National or Regional level) */}
          {selectedRegion === 'all' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    Regional Distribution ({regionAggregates.length} Regions in {selectedCountry})
                  </h4>
                </div>
                <span className="text-xs text-slate-400">Click any region to drill down</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {regionAggregates.map(reg => (
                  <button
                    key={reg.region}
                    onClick={() => {
                      setSelectedRegion(reg.region);
                      setSelectedCity('all');
                    }}
                    className="p-4 text-left bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-slate-800 dark:text-slate-200 group-hover:text-blue-600">
                        {reg.region}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {reg.pharmacyCount} Pharmacy Outlets
                    </div>
                    <div className="flex items-center justify-between text-xs pt-3 mt-3 border-t border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Units Sold</span>
                        <strong className="text-slate-700 dark:text-slate-300">{reg.units.toLocaleString()}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Gross Revenue</span>
                        <strong className="text-emerald-600">{reg.revenue.toLocaleString()} ETB</strong>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cities Breakdown Cards (When viewing a specific Region) */}
          {selectedRegion !== 'all' && selectedCity === 'all' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    Cities & Commercial Hubs in {selectedRegion} ({cityAggregates.length})
                  </h4>
                </div>
                <span className="text-xs text-slate-400">Click any city to isolate demand</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cityAggregates.map(cit => (
                  <button
                    key={cit.city}
                    onClick={() => setSelectedCity(cit.city)}
                    className="p-4 text-left bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-slate-800 dark:text-slate-200 group-hover:text-blue-600">
                        {cit.city}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {cit.pharmacyCount} Pharmacy Outlets
                    </div>
                    <div className="flex items-center justify-between text-xs pt-3 mt-3 border-t border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Units Sold</span>
                        <strong className="text-slate-700 dark:text-slate-300">{cit.units.toLocaleString()}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Gross Revenue</span>
                        <strong className="text-emerald-600">{cit.revenue.toLocaleString()} ETB</strong>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Clearing Demo Data */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/50 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  Purge Demo Sales & Pharmacies?
                </h4>
                <p className="text-xs text-slate-500">
                  Strictly isolates documents with <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">isDemo: true</code>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This action will remove all simulated demo pharmacies, demo wholesale records, demo medicines, and demo sales transactions. Real production pharmacy accounts and actual retail sales are strictly protected and will remain untouched.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmClearOpen(false)}
                disabled={seedingLoading}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleClearDemoData}
                disabled={seedingLoading}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                {seedingLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm & Purge Demo Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
