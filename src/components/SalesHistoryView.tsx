import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Sale, Branch } from '../types';
import { 
  History, 
  Calendar, 
  Search, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Receipt, 
  Download, 
  Filter, 
  ChevronRight, 
  Clock, 
  ArrowUpRight, 
  Store, 
  Layers,
  FileSpreadsheet,
  Printer,
  CalendarDays,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SalesHistoryViewProps {
  user: UserProfile;
  selectedBranchId?: string;
  branches?: Branch[];
  onNavigateToPOS?: () => void;
}

type TimeRangeFilter = 'today' | 'week' | 'month' | 'custom';

interface AggregatedProductSale {
  productId: string;
  name: string;
  genericName?: string;
  batchNumbers: string[];
  totalQuantity: number;
  totalRevenue: number;
  transactionCount: number;
  dispensingUnit?: string;
}

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({
  user,
  selectedBranchId = 'all',
  branches = [],
  onNavigateToPOS
}) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('today');
  
  // Custom Date range states (YYYY-MM-DD format)
  const todayStr = new Date().toISOString().split('T')[0];
  const [customStartDate, setCustomStartDate] = useState(todayStr);
  const [customEndDate, setCustomEndDate] = useState(todayStr);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>(selectedBranchId);
  const [activeTab, setActiveTab] = useState<'products' | 'transactions'>('products');
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  const ownerId = user.role === 'staff' ? user.pharmacyId : user.uid;

  // Sync selected branch if prop changes
  useEffect(() => {
    setSelectedBranch(selectedBranchId);
  }, [selectedBranchId]);

  // Real-time Firestore subscription to sales collection
  useEffect(() => {
    if (!ownerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const qSales = query(collection(db, 'sales'), where('pharmacyId', '==', ownerId));
    
    const unsubscribe = onSnapshot(
      qSales,
      (snapshot) => {
        const loadedSales: Sale[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        } as Sale));
        // Sort descending by creation date
        loadedSales.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setSales(loadedSales);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load sales history:', error);
        toast.error('Unable to retrieve sales records');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ownerId]);

  // Compute start and end timestamps based on selected timeRange
  const { startTimestamp, endTimestamp, rangeLabel } = useMemo(() => {
    const now = new Date();
    
    if (timeRange === 'today') {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return {
        startTimestamp: start.getTime(),
        endTimestamp: end.getTime(),
        rangeLabel: `Today (${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`
      };
    }

    if (timeRange === 'week') {
      // Start of current week (Monday)
      const start = new Date(now);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when Sunday
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return {
        startTimestamp: start.getTime(),
        endTimestamp: end.getTime(),
        rangeLabel: `This Week (${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - Present)`
      };
    }

    if (timeRange === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return {
        startTimestamp: start.getTime(),
        endTimestamp: end.getTime(),
        rangeLabel: `This Month (${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`
      };
    }

    // 'custom'
    const start = new Date(customStartDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(customEndDate);
    end.setHours(23, 59, 59, 999);
    return {
      startTimestamp: start.getTime(),
      endTimestamp: end.getTime(),
      rangeLabel: `Custom (${customStartDate} to ${customEndDate})`
    };
  }, [timeRange, customStartDate, customEndDate]);

  // Filter sales based on Time, Branch, and Search
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const saleTime = s.createdAt || 0;
      if (saleTime < startTimestamp || saleTime > endTimestamp) {
        return false;
      }

      // Branch filter
      if (selectedBranch !== 'all') {
        const sBranch = s.branchId || `main_branch_${ownerId}`;
        const targetMain = `main_branch_${ownerId}`;
        if (selectedBranch === 'main-branch' || selectedBranch === targetMain) {
          if (sBranch !== 'main-branch' && sBranch !== targetMain) return false;
        } else if (sBranch !== selectedBranch) {
          return false;
        }
      }

      // Search Query filter (matches product names, customer, receipt ID)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const idMatch = (s.id || '').toLowerCase().includes(q);
        const customerMatch = (s.customerName || '').toLowerCase().includes(q);
        const itemMatch = s.items && s.items.some((item) => 
          (item.name || '').toLowerCase().includes(q) ||
          ((item as any).genericName || '').toLowerCase().includes(q) ||
          ((item as any).batchNumber || '').toLowerCase().includes(q)
        );
        return idMatch || customerMatch || itemMatch;
      }

      return true;
    });
  }, [sales, startTimestamp, endTimestamp, selectedBranch, searchQuery, ownerId]);

  // Aggregate sold products in the filtered period
  const aggregatedProducts = useMemo(() => {
    const map: Record<string, AggregatedProductSale> = {};

    filteredSales.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const key = item.productId || item.name;
        if (!map[key]) {
          map[key] = {
            productId: item.productId,
            name: item.name,
            genericName: (item as any).genericName || '',
            batchNumbers: [],
            totalQuantity: 0,
            totalRevenue: 0,
            transactionCount: 0,
            dispensingUnit: (item as any).dispensingUnit || 'Units'
          };
        }

        map[key].totalQuantity += Number(item.quantity) || 0;
        map[key].totalRevenue += Number(item.total || (item.quantity * item.price)) || 0;
        map[key].transactionCount += 1;

        if ((item as any).batchNumber && !map[key].batchNumbers.includes((item as any).batchNumber)) {
          map[key].batchNumbers.push((item as any).batchNumber);
        }
      });
    });

    return Object.values(map).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredSales]);

  // Overall statistics for the chosen period
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalUnits = 0;

    filteredSales.forEach((s) => {
      totalRevenue += Number(s.totalAmount) || 0;
      (s.items || []).forEach((item) => {
        totalUnits += Number(item.quantity) || 0;
      });
    });

    const totalOrders = filteredSales.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalRevenue,
      totalUnits,
      totalOrders,
      avgOrderValue
    };
  }, [filteredSales]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredSales.length === 0) {
      toast.error('No sales data to export for this period');
      return;
    }

    const rows: string[] = [
      ['Receipt ID', 'Date & Time', 'Product Name', 'Batch', 'Quantity Sold', 'Unit Price (ETB)', 'Item Total (ETB)', 'Receipt Total (ETB)', 'Customer', 'Payment Method'].join(',')
    ];

    filteredSales.forEach((s) => {
      const dateStr = new Date(s.createdAt).toLocaleString('en-US');
      const cust = `"${(s.customerName || 'Walk-in').replace(/"/g, '""')}"`;
      const pMethod = s.paymentMethod || 'cash';
      
      (s.items || []).forEach((item) => {
        const prodName = `"${(item.name || '').replace(/"/g, '""')}"`;
        const batch = `"${((item as any).batchNumber || 'N/A').replace(/"/g, '""')}"`;
        const qty = item.quantity;
        const price = item.price;
        const itemTotal = item.total || (qty * price);
        rows.push([
          s.id,
          `"${dateStr}"`,
          prodName,
          batch,
          qty,
          price,
          itemTotal,
          s.totalAmount,
          cust,
          pMethod
        ].join(','));
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_report_${timeRange}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sales report exported to CSV!');
  };

  // Printable Report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <History size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                Sales History
                <span className="text-xs font-bold px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full">
                  {timeRange === 'today' ? 'Sold Today' : timeRange === 'week' ? 'Sold This Week' : timeRange === 'month' ? 'Sold This Month' : 'Custom Period'}
                </span>
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider mt-0.5">
                Detailed report of medicines sold today, this week, this month, or customized period
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {onNavigateToPOS && (
            <button
              onClick={onNavigateToPOS}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-sm cursor-pointer"
            >
              <ShoppingBag size={16} />
              <span>Go to Dispense (POS)</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs transition border border-slate-200 dark:border-slate-700 cursor-pointer"
            title="Export this sales report to CSV"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2.5 rounded-xl font-bold text-xs transition border border-slate-200 dark:border-slate-700 cursor-pointer"
            title="Print report"
          >
            <Printer size={15} />
          </button>
        </div>
      </div>

      {/* Primary Time Filters & Custom Range Selector */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Select Time Horizon:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                onClick={() => setTimeRange('today')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                  timeRange === 'today'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Clock size={15} />
                <span>Sold Today</span>
              </button>

              <button
                onClick={() => setTimeRange('week')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                  timeRange === 'week'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <CalendarDays size={15} />
                <span>Within This Week</span>
              </button>

              <button
                onClick={() => setTimeRange('month')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                  timeRange === 'month'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Calendar size={15} />
                <span>Within This Month</span>
              </button>

              <button
                onClick={() => setTimeRange('custom')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                  timeRange === 'custom'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Filter size={15} />
                <span>Customize Date Range</span>
              </button>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold text-slate-400">Current Scope:</span>
            <p className="text-sm font-black text-slate-800 dark:text-slate-200">{rangeLabel}</p>
          </div>
        </div>

        {/* Custom Date Range Picker inputs when 'custom' is active */}
        {timeRange === 'custom' && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">From:</label>
              <input
                type="date"
                value={customStartDate}
                max={customEndDate || todayStr}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">To:</label>
              <input
                type="date"
                value={customEndDate}
                min={customStartDate}
                max={todayStr}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
              />
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Filter records between specific start and end dates.
            </span>
          </div>
        )}

        {/* Search and Branch Selector */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <input
              type="text"
              placeholder="Search sold medicine name, generic name, batch #, customer, or receipt ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 pl-11 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
            />
            <Search className="absolute left-4 top-3.5 text-slate-400" size={16} />
          </div>

          {branches.length > 0 && (
            <div className="flex items-center gap-2">
              <Store size={16} className="text-slate-400" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
              >
                <option value="all">All Branches</option>
                <option value="main-branch">Main Branch (HQ)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalRevenue.toLocaleString()} <span className="text-xs font-bold text-slate-400">ETB</span>
          </p>
          <p className="text-[11px] text-slate-400">
            Recorded in {timeRange === 'today' ? 'today\'s sales' : rangeLabel.toLowerCase()}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Units Sold</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Package size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalUnits.toLocaleString()} <span className="text-xs font-bold text-slate-400">Units</span>
          </p>
          <p className="text-[11px] text-slate-400">
            Across {aggregatedProducts.length} unique medicines
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transactions Completed</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Receipt size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalOrders.toLocaleString()} <span className="text-xs font-bold text-slate-400">Receipts</span>
          </p>
          <p className="text-[11px] text-slate-400">
            Checkout receipts issued
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Sale Value</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.avgOrderValue.toFixed(1)} <span className="text-xs font-bold text-slate-400">ETB</span>
          </p>
          <p className="text-[11px] text-slate-400">
            Average per patient checkout
          </p>
        </div>
      </div>

      {/* Tabs: Itemized Sold Products vs. Transaction Slips */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Package size={15} />
              <span>Sold Medicines ({aggregatedProducts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'transactions'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Receipt size={15} />
              <span>Checkout Receipts ({filteredSales.length})</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 font-medium hidden sm:block">
            {activeTab === 'products' ? 'Summed quantities and earnings per product' : 'Chronological receipts with customer breakdown'}
          </p>
        </div>

        {/* Tab Content 1: Sold Products Table */}
        {activeTab === 'products' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400">Loading sales records...</div>
            ) : aggregatedProducts.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <Package size={24} />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No medicines sold in this period</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {timeRange === 'today'
                    ? 'No sales have been processed today yet. Go to Dispense to record pharmacy checkout transactions.'
                    : `No sales matching the selected horizon (${rangeLabel}).`}
                </p>
                {onNavigateToPOS && (
                  <button
                    onClick={onNavigateToPOS}
                    className="mt-2 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs"
                  >
                    <ShoppingBag size={14} /> Dispense Medicines Now
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Medicine</th>
                      <th className="px-6 py-4">Batches Sold</th>
                      <th className="px-6 py-4 text-center">Quantity Sold</th>
                      <th className="px-6 py-4 text-center">Times Dispensed</th>
                      <th className="px-6 py-4 text-right">Total Revenue (ETB)</th>
                      <th className="px-6 py-4 text-right">Avg Price / Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {aggregatedProducts.map((p, idx) => {
                      const avgPrice = p.totalQuantity > 0 ? (p.totalRevenue / p.totalQuantity).toFixed(2) : '0.00';
                      return (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</p>
                              {p.genericName && (
                                <p className="text-[11px] text-slate-400 font-mono italic">{p.genericName}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {p.batchNumbers.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {p.batchNumbers.map((b, bIdx) => (
                                  <span
                                    key={bIdx}
                                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                  >
                                    {b}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Standard Stock</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-black text-slate-900 dark:text-white text-sm px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-lg">
                              {p.totalQuantity} {p.dispensingUnit}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-600 dark:text-slate-400">
                            {p.transactionCount} sale{p.transactionCount > 1 ? 's' : ''}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                            {p.totalRevenue.toLocaleString()} ETB
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-500">
                            {avgPrice} ETB
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: Individual Sales Receipts */}
        {activeTab === 'transactions' && (
          <div className="space-y-3">
            {loading ? (
              <div className="p-12 text-center text-slate-400">Loading transactions...</div>
            ) : filteredSales.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-16 text-center space-y-3 rounded-3xl border border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <Receipt size={24} />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No checkout transactions found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No sales receipts were recorded within {rangeLabel}.
                </p>
              </div>
            ) : (
              filteredSales.map((sale) => {
                const isExpanded = expandedSaleId === sale.id;
                const dateStr = new Date(sale.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={sale.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                  >
                    <div
                      onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                      className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                          <Receipt size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-slate-900 dark:text-white text-xs">
                              {sale.id}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {sale.paymentMethod || 'cash'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>{dateStr}</span>
                            <span>•</span>
                            <span>Customer: <strong className="text-slate-700 dark:text-slate-300">{sale.customerName || 'Walk-in'}</strong></span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                        <div className="text-right">
                          <p className="text-xs text-slate-400 font-bold">{(sale.items || []).length} item{(sale.items || []).length > 1 ? 's' : ''}</p>
                          <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                            {sale.totalAmount.toLocaleString()} ETB
                          </p>
                        </div>
                        <ChevronRight
                          size={18}
                          className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20 space-y-3">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Items in this Sale:</p>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                          {(sale.items || []).map((it, itIdx) => (
                            <div key={itIdx} className="py-2.5 flex justify-between items-center">
                              <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200">{it.name}</p>
                                {(it as any).batchNumber && (
                                  <p className="text-[10px] font-mono text-slate-400">
                                    Batch: {(it as any).batchNumber} {(it as any).expiryDate ? `| Exp: ${(it as any).expiryDate}` : ''}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-slate-700 dark:text-slate-300">
                                  {it.quantity} x {it.price.toLocaleString()} ETB
                                </p>
                                <p className="text-xs font-black text-slate-900 dark:text-white">
                                  {(it.total || (it.quantity * it.price)).toLocaleString()} ETB
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-500">Transaction Net Total:</span>
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                            {sale.totalAmount.toLocaleString()} ETB
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
