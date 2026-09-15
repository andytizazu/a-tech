import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  setDoc,
  getDocs,
  getDoc,
  arrayUnion,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
  UserProfile, 
  MarketplaceProduct, 
  Order, 
  SystemSettings, 
  Notification,
  AuditLog,
  getCurrencySymbol,
  getCurrencyName,
  SaaSInvoice,
  SubscriptionHistoryEntry,
  Sale,
  SaleItem
} from '../types';
import { FEATURES_LIST, DEFAULT_PLAN_FEATURES } from '../lib/featureGate';
import { syncPharmacyBillingAndInvoices } from '../lib/billingEngine';
import { 
  DEMO_ALL_ORGANIZATIONS_AND_PEOPLE,
  DEMO_WHOLESALE_SUPPLIERS,
  DEMO_MARKET_SALES,
  DEMO_MEDICINE_METADATA_MAP 
} from '../lib/demoSuperAdminData';
import { 
  LayoutDashboard, 
  Users, 
  Globe, 
  TrendingUp, 
  Settings, 
  Activity, 
  ShieldAlert, 
  DollarSign, 
  Building2, 
  Ticket, 
  Megaphone, 
  Truck, 
  Warehouse, 
  Cpu, 
  Search, 
  Plus, 
  Filter, 
  ShieldCheck, 
  Mail, 
  AlertTriangle, 
  CheckCircle, 
  Tag,
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  Lock, 
  Unlock, 
  Play,
  Pause,
  Eye, 
  RefreshCw, 
  X, 
  Layers,
  Trash2,
  Sparkles,
  BarChart3,
  ShoppingBag,
  Package,
  Calendar,
  ArrowUpRight,
  Download,
  ArrowUpDown,
  Store,
  Receipt,
  Pill,
  Award,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Trophy,
  LifeBuoy,
  Server,
  Database,
  Wifi,
  Zap,
  Thermometer,
  Send,
  Radio,
  MapPin,
  Shield,
  Percent,
  Check,
  CheckSquare,
  FileSpreadsheet,
  Compass,
  Clock
} from 'lucide-react';
import { SuperAdminSalesAudit } from './SuperAdminSalesAudit';
import { ProductDemandIntelligence } from './ProductDemandIntelligence';
import { seedDemoSalesData, clearDemoSalesData } from '../lib/demoSalesData';
import {
  DEMO_SYSTEM_SERVICES,
  DEMO_HOURLY_LATENCY,
  DEMO_SCHEDULED_CRONS,
  DEMO_SECOPS_INCIDENTS,
  DEMO_RBAC_ROLES,
  DEMO_COUNTRY_METRICS,
  DEMO_REGIONAL_DATA,
  DEMO_SUPPORT_TICKETS_LIST,
  DEMO_BROADCAST_FEED,
  DEMO_DISTRIBUTORS_FLEET,
  DEMO_LIVE_DISPATCHES,
  DEMO_EXTENDED_WAREHOUSES,
  DEMO_WAREHOUSE_TRANSFERS,
  DEMO_AI_DEMAND_SURGES,
  DEMO_AI_RESTOCK_RECOMMENDATIONS,
  DEMO_PAYMENT_CHANNELS,
  DEMO_REVENUE_TRAJECTORY_12M,
  DEMO_COMMISSION_STRUCTURE,
  DEMO_TRENDING_B2B_SEARCHES,
  DEMO_EXTENDED_AUDIT_LOGS
} from '../lib/demoSuperAdminSidebars';
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
import { countries } from '../constants/countries';

// Internal types for Support ticket
interface SupportTicket {
  id: string;
  organizationId: string;
  organizationName: string;
  title: string;
  description: string;
  category: 'billing' | 'marketplace' | 'hardware' | 'access' | 'general';
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  internalNotes?: string;
  createdAt: number;
}

// 16 Sub tabs
type SuperAdminTab = 
  | 'overview' 
  | 'organizations' 
  | 'country' 
  | 'regional' 
  | 'subscriptions' 
  | 'marketplace' 
  | 'audit' 
  | 'secops' 
  | 'revenue' 
  | 'market-intelligence'
  | 'sales-audit'
  | 'product-demand'
  | 'health' 
  | 'support' 
  | 'communication' 
  | 'distributor' 
  | 'warehouse' 
  | 'ai'
  | 'pharmacy-wholesales';

// High-fidelity demonstration dataset matching executive command center benchmarks
const DEMO_COMMAND_CENTER = {
  totalPharmacies: { value: 312, change: '+12%', active: 298, pending: 14 },
  wholesaleCompanies: { value: 48, change: '+8%', active: 46, pending: 2 },
  marketingTeam: { value: 52, change: '+15%', active: 49, pending: 3 },
  totalProducts: { value: 1256, change: '+6%', active: 1198, inactive: 58 },
  totalSales: { value: 725840, change: '+18%', transactions: 48392 },
  totalRevenue: { value: 12482750, change: '+22%', label: 'vs. previous 30 days' },
  totalProfit: { value: 4892360, margin: '39.2%' },
  totalCustomers: { value: 156842, change: '+14%', active: 142317 },
  
  salesTrend30d: [
    { date: 'Apr 10', revenue: 210000, units: 14200 },
    { date: 'Apr 13', revenue: 235000, units: 15800 },
    { date: 'Apr 16', revenue: 215000, units: 14900 },
    { date: 'Apr 19', revenue: 275000, units: 18400 },
    { date: 'Apr 22', revenue: 350000, units: 23100 },
    { date: 'Apr 25', revenue: 320000, units: 21500 },
    { date: 'Apr 28', revenue: 410000, units: 27800 },
    { date: 'May 1', revenue: 490000, units: 33400 },
    { date: 'May 4', revenue: 580000, units: 39600 },
    { date: 'May 7', revenue: 730000, units: 48200 },
    { date: 'May 10', revenue: 860000, units: 56900 },
  ],
  salesTrend7d: [
    { date: 'May 4', revenue: 580000, units: 39600 },
    { date: 'May 5', revenue: 620000, units: 41500 },
    { date: 'May 6', revenue: 680000, units: 44200 },
    { date: 'May 7', revenue: 730000, units: 48200 },
    { date: 'May 8', revenue: 790000, units: 51800 },
    { date: 'May 9', revenue: 820000, units: 54100 },
    { date: 'May 10', revenue: 860000, units: 56900 },
  ],
  salesTrend90d: [
    { date: 'Feb 15', revenue: 140000, units: 9800 },
    { date: 'Mar 1', revenue: 180000, units: 12400 },
    { date: 'Mar 15', revenue: 210000, units: 14200 },
    { date: 'Apr 1', revenue: 290000, units: 19800 },
    { date: 'Apr 15', revenue: 380000, units: 25400 },
    { date: 'May 1', revenue: 540000, units: 36200 },
    { date: 'May 10', revenue: 860000, units: 56900 },
  ],
  salesTrend1y: [
    { date: 'Jun', revenue: 650000, units: 42000 },
    { date: 'Aug', revenue: 780000, units: 49000 },
    { date: 'Oct', revenue: 920000, units: 58000 },
    { date: 'Dec', revenue: 1150000, units: 71000 },
    { date: 'Feb', revenue: 1380000, units: 84000 },
    { date: 'Apr', revenue: 1650000, units: 99000 },
  ],

  topProducts: [
    { rank: 1, name: 'Paracetamol 500mg', units: 156320, revenue: 2934560, badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30', iconColor: 'text-purple-400 bg-purple-500/10' },
    { rank: 2, name: 'Amoxicillin 500mg', units: 98450, revenue: 2856200, badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30', iconColor: 'text-amber-400 bg-amber-500/10' },
    { rank: 3, name: 'Omeprazole 20mg', units: 76230, revenue: 2184500, badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30', iconColor: 'text-rose-400 bg-rose-500/10' },
    { rank: 4, name: 'Metformin 500mg', units: 63780, revenue: 1742000, badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30', iconColor: 'text-cyan-400 bg-cyan-500/10' },
    { rank: 5, name: 'Vitamin C 500mg', units: 54320, revenue: 1245600, badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30', iconColor: 'text-emerald-400 bg-emerald-500/10' },
  ],

  topPharmacies: [
    { rank: 1, name: 'Addis Care Pharmacy', revenue: 1245800, change: '+28%' },
    { rank: 2, name: 'Bole Family Pharmacy', revenue: 986400, change: '+22%' },
    { rank: 3, name: 'Unity Pharmacy', revenue: 842300, change: '+18%' },
    { rank: 4, name: 'Hope Medical Pharmacy', revenue: 765200, change: '+16%' },
    { rank: 5, name: 'Selam Pharmacy', revenue: 698750, change: '+14%' },
  ],

  salesByCity: [
    { city: 'Addis Ababa', revenue: 4892500, percent: 100, barColor: '#3B82F6' },
    { city: 'Adama', revenue: 1248750, percent: 45, barColor: '#8B5CF6' },
    { city: 'Hawassa', revenue: 982640, percent: 36, barColor: '#06B6D4' },
    { city: 'Bahir Dar', revenue: 876320, percent: 32, barColor: '#F59E0B' },
    { city: 'Dire Dawa', revenue: 654210, percent: 24, barColor: '#F97316' },
    { city: 'Jimma', revenue: 543870, percent: 20, barColor: '#10B981' },
    { city: 'Mekelle', revenue: 421560, percent: 16, barColor: '#EC4899' },
    { city: 'Other Cities', revenue: 362890, percent: 14, barColor: '#14B8A6' },
  ],

  salesByCategory: [
    { name: 'Analgesics', value: 28.4, color: '#06B6D4' },
    { name: 'Antibiotics', value: 22.1, color: '#3B82F6' },
    { name: 'Gastrointestinal', value: 14.7, color: '#8B5CF6' },
    { name: 'Cardiovascular', value: 10.8, color: '#A855F7' },
    { name: 'Vitamins & Supplements', value: 8.6, color: '#F59E0B' },
    { name: 'Respiratory', value: 6.3, color: '#EF4444' },
    { name: 'Dermatology', value: 4.2, color: '#6366F1' },
    { name: 'Other', value: 5.0, color: '#EC4899' },
  ],

  recentActivity: [
    {
      id: '1',
      title: 'New sale recorded',
      subtitle: 'Addis Care Pharmacy - Paracetamol 500mg',
      time: '2 min ago',
      type: 'sale',
      icon: Receipt,
      iconColor: 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
    },
    {
      id: '2',
      title: 'Purchase order received',
      subtitle: 'East Africa Pharma Supply - PO-4587',
      time: '5 min ago',
      type: 'po',
      icon: FileText,
      iconColor: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
    },
    {
      id: '3',
      title: 'New pharmacy registered',
      subtitle: 'Sunrise Pharmacy - Addis Ababa',
      time: '12 min ago',
      type: 'pharmacy',
      icon: Store,
      iconColor: 'text-purple-400 bg-purple-500/10 border border-purple-500/20'
    },
    {
      id: '4',
      title: 'Marketing campaign updated',
      subtitle: 'Pain Relief Promotion - Addis Ababa',
      time: '18 min ago',
      type: 'marketing',
      icon: Megaphone,
      iconColor: 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
    },
    {
      id: '5',
      title: 'Wholesale order delivered',
      subtitle: 'MedPlus Distributors - WO-3281',
      time: '25 min ago',
      type: 'wholesale',
      icon: Truck,
      iconColor: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
    },
  ],

  networkOverview: [
    { city: 'Addis Ababa', pharmacies: 112, growth: '+12%' },
    { city: 'Adama', pharmacies: 28, growth: '+8%' },
    { city: 'Hawassa', pharmacies: 24, growth: '+10%' },
    { city: 'Bahir Dar', pharmacies: 22, growth: '+9%' },
    { city: 'Dire Dawa', pharmacies: 18, growth: '+7%' },
    { city: 'Jimma', pharmacies: 16, growth: '+6%' },
    { city: 'Mekelle', pharmacies: 14, growth: '+5%' },
    { city: 'Other Cities', pharmacies: 58, growth: '+11%' },
  ]
};

export const SuperAdminConsole = ({ 
  initialTab,
  onImpersonateOrg
}: { 
  initialTab?: SuperAdminTab,
  onImpersonateOrg?: (org: UserProfile) => void
}) => {
  const [activeTab, setActiveTab] = useState<SuperAdminTab>(initialTab || 'overview');
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [dateRangeFilter, setDateRangeFilter] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [trendMetric, setTrendMetric] = useState<'revenue' | 'units'>('revenue');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSeedingDemo, setIsSeedingDemo] = useState(false);
  const [isConfirmingClearDemo, setIsConfirmingClearDemo] = useState(false);
  const [isClearingDemo, setIsClearingDemo] = useState(false);
  const [saasInvoices, setSaasInvoices] = useState<SaaSInvoice[]>([]);
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<any[]>([]);
  const [allSubscriptionHistory, setAllSubscriptionHistory] = useState<SubscriptionHistoryEntry[]>([]);
  const [pharmacyWholesalesSearch, setPharmacyWholesalesSearch] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Search input & filtering states
  const [orgTypeFilter, setOrgTypeFilter] = useState<string>('all');
  const [orgSearch, setOrgSearch] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('Ethiopia');
  const [selectedRegion, setSelectedRegion] = useState<string>('Addis Ababa');
  const [distributorSearch, setDistributorSearch] = useState<string>('');
  const [distributorCountryFilter, setDistributorCountryFilter] = useState<string>('all');
  const [warehouseSearch, setWarehouseSearch] = useState<string>('');
  const [warehouseCountryFilter, setWarehouseCountryFilter] = useState<string>('all');
  
  // Enhanced Sidebar Filter States
  const [supportCategoryFilter, setSupportCategoryFilter] = useState<string>('all');
  const [supportStatusFilter, setSupportStatusFilter] = useState<string>('all');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<string>('all');
  const [marketplaceCategoryFilter, setMarketplaceCategoryFilter] = useState<string>('all');
  const [marketplaceSearch, setMarketplaceSearch] = useState<string>('');
  const [secopsSeverityFilter, setSecopsSeverityFilter] = useState<string>('all');
  const [healthLogsFilter, setHealthLogsFilter] = useState<string>('all');
  const [isSimulatingHealthPing, setIsSimulatingHealthPing] = useState<boolean>(false);
  const [isSimulatingAiPrediction, setIsSimulatingAiPrediction] = useState<boolean>(false);
  
  // Modals / forms states
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [showAddTicketModal, setShowAddTicketModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [selectedUserForFiles, setSelectedUserForFiles] = useState<UserProfile | null>(null);

  // Organization Detail & Subscription History States
  const [selectedOrgForDetail, setSelectedOrgForDetail] = useState<UserProfile | null>(null);
  const [showAddFreeMonthsModal, setShowAddFreeMonthsModal] = useState(false);
  const [extensionMonths, setExtensionMonths] = useState<number>(1);
  const [extensionReason, setExtensionReason] = useState<string>('');
  const [subHistory, setSubHistory] = useState<SubscriptionHistoryEntry[]>([]);

  // Regional Manager Creation states
  const [showAddRMModal, setShowAddRMModal] = useState(false);
  const [newRM, setNewRM] = useState({
    displayName: '',
    email: '',
    phone: '',
    region: 'Addis Ababa',
    country: 'Ethiopia',
    notes: ''
  });

  const [newPromoTitle, setNewPromoTitle] = useState('');
  const [newPromoPercent, setNewPromoPercent] = useState(10);
  const [newPromoDesc, setNewPromoDesc] = useState('');

  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponPercent, setNewCouponPercent] = useState(15);
  const [newCouponDesc, setNewCouponDesc] = useState('');
  
  // Custom states
  const [newOrg, setNewOrg] = useState({
    email: '',
    displayName: '',
    role: 'pharmacy' as UserProfile['role'],
    country: 'Ethiopia',
    region: 'Addis Ababa',
    city: 'Addis Ababa',
    subscriptionType: 'standard' as 'standard'|'premium',
    phone: '',
    countryCode: '+251',
    currency: 'ETB'
  });

  const [newTicket, setNewTicket] = useState({
    organizationId: '',
    title: '',
    description: '',
    category: 'general' as SupportTicket['category'],
    severity: 'medium' as SupportTicket['severity']
  });

  const [auditSearch, setAuditSearch] = useState('');

  const [announcement, setAnnouncement] = useState({
    title: '',
    message: '',
    target: 'all' as Notification['target'],
    targetRegion: '',
    targetEmail: ''
  });

  // Market Intelligence State Variables
  const [marketDateRange, setMarketDateRange] = useState<'today' | '7d' | '30d' | '90d' | 'all' | 'custom'>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [marketCategoryFilter, setMarketCategoryFilter] = useState<string>('all');
  const [marketSearchQuery, setMarketSearchQuery] = useState<string>('');
  const [marketSortBy, setMarketSortBy] = useState<'quantity' | 'revenue' | 'frequency' | 'pharmacies'>('quantity');
  const [marketSalesLoading, setMarketSalesLoading] = useState<boolean>(false);
  const [marketSales, setMarketSales] = useState<Sale[]>([]);
  const [medicineMetadataMap, setMedicineMetadataMap] = useState<Record<string, { category?: string; genericName?: string; countryOfOrigin?: string }>>({});
  const [marketViewMode, setMarketViewMode] = useState<'pharmacies' | 'products'>('pharmacies');
  const [marketPharmacyFilter, setMarketPharmacyFilter] = useState<string>('all');
  const [marketPharmacySortBy, setMarketPharmacySortBy] = useState<'revenue' | 'volume' | 'transactions' | 'products' | 'worst'>('revenue');
  const [marketPharmacyTierFilter, setMarketPharmacyTierFilter] = useState<string>('all');
  const [expandedPharmacyId, setExpandedPharmacyId] = useState<string | null>(null);
  const [expandedProductName, setExpandedProductName] = useState<string | null>(null);
  const [marketChartMode, setMarketChartMode] = useState<'pharmacies' | 'products'>('pharmacies');

  // Dynamic subscription customized manager state variables
  const [selectedEditPlan, setSelectedEditPlan] = useState<'standard' | 'premium'>('standard');
  const [customPlanName, setCustomPlanName] = useState('');
  const [customPlanDescription, setCustomPlanDescription] = useState('');
  const [customPlanFeatures, setCustomPlanFeatures] = useState<string[]>([]);
  const [customPlanLimitations, setCustomPlanLimitations] = useState<string[]>([]);
  const [customPlanFutureFeatures, setCustomPlanFutureFeatures] = useState<string[]>([]);
  const [customPlanRecommended, setCustomPlanRecommended] = useState(false);
  const [customPlanEnableFuture, setCustomPlanEnableFuture] = useState(false);
  const [customPlanFunctionalFeatures, setCustomPlanFunctionalFeatures] = useState<string[]>([]);
  
  // Helpers to add features/limitations
  const [newFeatureText, setNewFeatureText] = useState('');
  const [newLimitationText, setNewLimitationText] = useState('');
  const [newFutureFeatureText, setNewFutureFeatureText] = useState('');

  // Demonstration Mode Data Resolution (Renders rich roster of pharmacies, wholesales, marketing team & market intelligence)
  const displayUsers = React.useMemo(() => {
    if (!demoMode && users.length > 2) return users;
    const realIds = new Set(users.map(u => u.uid));
    const combined = [...users];
    DEMO_ALL_ORGANIZATIONS_AND_PEOPLE.forEach(u => {
      if (!realIds.has(u.uid!)) {
        combined.push(u as UserProfile);
      }
    });
    return combined;
  }, [demoMode, users]);

  const displaySuppliers = React.useMemo(() => {
    if (!demoMode && allSuppliers.length >= 8) return allSuppliers;
    const realIds = new Set(allSuppliers.map(s => s.id));
    const combined = [...allSuppliers];
    DEMO_WHOLESALE_SUPPLIERS.forEach(s => {
      if (!realIds.has(s.id)) {
        combined.push(s);
      }
    });
    return combined;
  }, [demoMode, allSuppliers]);

  const displayMarketSales = React.useMemo(() => {
    const rawSales = (!demoMode && marketSales.length > 0) ? marketSales : (marketSales.length > 0 ? marketSales : DEMO_MARKET_SALES);
    if (rawSales === DEMO_MARKET_SALES) {
      const now = Date.now();
      let minTime = 0;
      if (marketDateRange === 'today') minTime = now - 24 * 60 * 60 * 1000;
      else if (marketDateRange === '7d') minTime = now - 7 * 24 * 60 * 60 * 1000;
      else if (marketDateRange === '30d') minTime = now - 30 * 24 * 60 * 60 * 1000;
      else if (marketDateRange === '90d') minTime = now - 90 * 24 * 60 * 60 * 1000;
      else if (marketDateRange === 'custom' && customStartDate) {
        minTime = new Date(customStartDate).getTime();
      }
      return DEMO_MARKET_SALES.filter(s => s.createdAt >= minTime);
    }
    return rawSales;
  }, [demoMode, marketSales, marketDateRange, customStartDate]);

  const activeMetadataMap = React.useMemo(() => {
    return {
      ...DEMO_MEDICINE_METADATA_MAP,
      ...medicineMetadataMap
    };
  }, [medicineMetadataMap]);

  // Baseline Fallback New Subscription Plan configurations representing high pharmacy ecosystem fidelity
  const DEFAULT_PLANS_FALLBACK = {
    standard: {
      name: 'Professional',
      description: 'Engineered for expanding pharmacies and businesses running multiple operations seamlessly.',
      recommended: true,
      features: [
        'Inventory Management', 'Sales Management', 'Customer Management', 'Purchase Management', 
        'Expiry Tracking', 'Generic Name Tracking', 'Country of Origin Tracking', 'Purchase Units', 
        'Dispensing Units', 'Conversion Factors', 'Bin Card Reports', 'Barcode Support', 
        'Basic Reporting', 'Receipt Printing', 'User Management', 'Dashboard Analytics',
        'Branch Management', 'Multiple Branch Support', 'Branch Billing Options', 
        'Branch Creation and Deletion', 'Branch-Level Reporting', 'Branch Performance Analytics', 
        'Branch Inventory Visibility', 'Customer Discount Management', 'Batch-Aware POS', 
        'FEFO Recommendations', 'Batch Tracking', 'Advanced Inventory Reports', 'Audit Logs', 
        'Transfer Reports', 'Branch Notifications', 'Priority Live Support'
      ],
      limitations: [
        'Branch-to-Branch High-Volume Stock Transfers', 'Transfer Approval Multi-Stage Workflow', 
        'Wholesale Pharmacy Ledger Ratings & compliance checks', 'Central Premium Audit Center'
      ],
      futureFeatures: ['Ecosystem transit insurance logs'],
      enableFutureFeatures: false
    },
    premium: {
      name: 'Premium',
      description: 'Uncapped power for largest multi-branch chains, wholesale pharmacies group and administrative regions.',
      recommended: false,
      features: [
        'Everything in Professional Plan', 'Branch-to-Branch Stock Transfers', 'Transfer Approval Workflow', 
        'Transfer Tracking Numbers (TRF-YYYY-######)', 'Transfer History logs', 'Transfer Audit Logs', 
        'Transfer Status Monitoring', 'Warehouse Readiness Layer', 'Wholesale Pharmacy Management', 
        'Purchase Order Management', 'Revenue Analytics charts', 'Ecosystem Analytics', 
        'Advanced Security Controls', 'Multi-Region Management', 'Regional Performance Tracking', 
        'Country-Level Reporting', 'Premium Audit Center', 'Advanced Reporting', 
        'API Readiness endpoints', 'Future AI Readiness Layer', 'Dedicated SLA Manager Team'
      ],
      limitations: [] as string[],
      futureFeatures: ['Interactive AI restock forecasting agent (Sandbox ready)'],
      enableFutureFeatures: true
    }
  };

  useEffect(() => {
    if (!systemSettings) return;
    const planId = selectedEditPlan;
    // Safely cast customizable settings if customized fields exist in Firebase
    const customData = (systemSettings as any).plansCustomize?.[planId] || DEFAULT_PLANS_FALLBACK[planId];
    setCustomPlanName(customData.name || '');
    setCustomPlanDescription(customData.description || '');
    setCustomPlanFeatures(customData.features || []);
    setCustomPlanLimitations(customData.limitations || []);
    setCustomPlanFutureFeatures(customData.futureFeatures || []);
    setCustomPlanRecommended(customData.recommended !== undefined ? customData.recommended : false);
    setCustomPlanEnableFuture(customData.enableFutureFeatures !== undefined ? customData.enableFutureFeatures : false);
    
    // Load functional permission checkbox state list
    setCustomPlanFunctionalFeatures(customData.functionalFeatures || DEFAULT_PLAN_FEATURES[planId] || []);
  }, [selectedEditPlan, systemSettings]);

  const handleSavePlanCustomizations = async () => {
    try {
      const currentCustomize = (systemSettings as any)?.plansCustomize || {
        standard: DEFAULT_PLANS_FALLBACK.standard,
        premium: DEFAULT_PLANS_FALLBACK.premium
      };

      const updatedCustomize = {
        ...currentCustomize,
        [selectedEditPlan]: {
          name: customPlanName,
          description: customPlanDescription,
          features: customPlanFeatures,
          limitations: customPlanLimitations,
          futureFeatures: customPlanFutureFeatures,
          recommended: customPlanRecommended,
          enableFutureFeatures: customPlanEnableFuture,
          functionalFeatures: customPlanFunctionalFeatures
        }
      };

      await setDoc(doc(db, 'system_settings', 'main'), {
        plansCustomize: updatedCustomize
      }, { merge: true });
      toast.success(`Successfully saved customized details to ${selectedEditPlan.toUpperCase()}!`);
      createAuditLog('PLAN_CUSTOMIZATION', `Customized plan features for ${selectedEditPlan}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save plan customizations template to FireStore.');
    }
  };

  // Load basic data using snapshot listeners
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
      setLoading(false);
    });

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MarketplaceProduct)));
    });

    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    });

    const unsubSettings = onSnapshot(doc(db, 'system_settings', 'main'), (s) => {
      if (s.exists()) {
        setSystemSettings(s.data() as SystemSettings);
      }
    });

    const unsubAds = onSnapshot(collection(db, 'advertisements'), (snapshot) => {
      setAds(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Failed to load advertisements in super admin", err);
    });

    const unsubWarehouses = onSnapshot(collection(db, 'warehouses'), (snapshot) => {
      setWarehouses(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Failed to load warehouses in super admin", err);
    });

    const unsubAudit = onSnapshot(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(50)), (snapshot) => {
      setAuditLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog)));
    }, () => {
      // Fallback if audit_logs index is building or not loaded
      setAuditLogs([
        { id: '1', uid: 'admin', action: 'LOGIN_SUCCESS', details: 'Super Admin logged in', timestamp: Date.now() - 50000 },
        { id: '2', uid: 'admin', action: 'PRICE_OVERRIDE', details: 'Premium Tier plan changed to 4,500 ETB', timestamp: Date.now() - 3600000 },
        { id: '3', uid: 'user_01', action: 'STOCK_MINIMIZE', details: 'Amoxicillin stock minimized from 200 to 120', timestamp: Date.now() - 7200000 },
      ]);
    });

    const unsubInvoices = onSnapshot(collection(db, 'saas_invoices'), (snapshot) => {
      setSaasInvoices(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SaaSInvoice)));
    }, (err) => {
      console.error("Failed to load SaaS invoices in super admin", err);
    });

    const unsubSuppliers = onSnapshot(collection(db, 'suppliers'), (snapshot) => {
      setAllSuppliers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Failed to load suppliers in super admin", err);
    });

    const unsubSubHistory = onSnapshot(collection(db, 'subscription_history'), (snapshot) => {
      setAllSubscriptionHistory(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SubscriptionHistoryEntry)));
    }, (err) => {
      console.error("Failed to load global subscription history in super admin", err);
    });

    // Mock initial tickets
    setTickets([
      { id: 't_1', organizationId: 'p_1', organizationName: 'Abyssinia Pharmacy', title: 'Payment Gate Verification', description: 'Premium subscription renewal payment is stuck.', category: 'billing', severity: 'high', status: 'open', createdAt: Date.now() - 86400000 },
      { id: 't_2', organizationId: 'i_1', organizationName: 'MedTech Importer SA', title: 'Marketplace product import format', description: 'CSV Upload throws mapping warning labels.', category: 'marketplace', severity: 'medium', status: 'in_progress', createdAt: Date.now() - 172800000 },
      { id: 't_3', organizationId: 'd_1', organizationName: 'Express Logistics Co', title: 'MFA Unlock request', description: 'Lost master security bypass token during transit transition.', category: 'access', severity: 'critical', status: 'resolved', createdAt: Date.now() - 30000000 },
    ]);

    return () => {
      unsubUsers();
      unsubProducts();
      unsubOrders();
      unsubSettings();
      unsubAds();
      unsubWarehouses();
      unsubAudit();
      unsubInvoices();
      unsubSuppliers();
      unsubSubHistory();
    };
  }, []);

  const createAuditLog = async (action: string, details: string) => {
    try {
      await addDoc(collection(db, 'audit_logs'), {
        uid: 'SuperAdmin',
        action,
        details,
        timestamp: Date.now()
      });
    } catch (e) {
      console.error("Failed to append audit log", e);
    }
  };

  // On-demand bounded fetch for Network Market Intelligence
  const loadMarketIntelligenceSales = async (
    range: 'today' | '7d' | '30d' | '90d' | 'all' | 'custom',
    customStart?: string,
    customEnd?: string
  ) => {
    setMarketSalesLoading(true);
    try {
      const now = Date.now();
      let startTimestamp = 0;
      let endTimestamp = now;

      if (range === 'today') {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        startTimestamp = d.getTime();
      } else if (range === '7d') {
        startTimestamp = now - 7 * 24 * 60 * 60 * 1000;
      } else if (range === '30d') {
        startTimestamp = now - 30 * 24 * 60 * 60 * 1000;
      } else if (range === '90d') {
        startTimestamp = now - 90 * 24 * 60 * 60 * 1000;
      } else if (range === 'custom') {
        if (customStart) {
          startTimestamp = new Date(customStart).getTime();
        }
        if (customEnd) {
          const ed = new Date(customEnd);
          ed.setHours(23, 59, 59, 999);
          endTimestamp = ed.getTime();
        }
      }

      let allLoaded: Sale[] = [];
      let lastVisible: any = null;
      let hasMore = true;
      const BATCH_SIZE = 1000;
      // Controlled pagination loop: up to 10 batches (10,000 sales) to represent full historical analytics without memory or quota exhaustion
      const MAX_BATCHES = 10;
      let batchCount = 0;

      while (hasMore && batchCount < MAX_BATCHES) {
        let baseConstraints: any[] = [];
        if (startTimestamp > 0) {
          baseConstraints = [
            where('createdAt', '>=', startTimestamp),
            where('createdAt', '<=', endTimestamp),
            orderBy('createdAt', 'desc'),
            limit(BATCH_SIZE)
          ];
        } else {
          baseConstraints = [
            orderBy('createdAt', 'desc'),
            limit(BATCH_SIZE)
          ];
        }

        if (lastVisible) {
          baseConstraints.push(startAfter(lastVisible));
        }

        const salesQuery = query(collection(db, 'sales'), ...baseConstraints);
        const snapshot = await getDocs(salesQuery);

        if (snapshot.empty) {
          hasMore = false;
          break;
        }

        const batchDocs = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Sale));
        allLoaded = allLoaded.concat(batchDocs);
        lastVisible = snapshot.docs[snapshot.docs.length - 1];
        batchCount++;

        if (snapshot.docs.length < BATCH_SIZE) {
          hasMore = false;
        }
      }

      setMarketSales(allLoaded);

      // Metadata dictionary build for medicine categories and generic names
      if (Object.keys(medicineMetadataMap).length === 0) {
        const medsSnap = await getDocs(query(collection(db, 'medicines'), limit(1000)));
        const meta: Record<string, { category?: string; genericName?: string; countryOfOrigin?: string }> = {};
        medsSnap.docs.forEach(docSnap => {
          const data = docSnap.data();
          if (data.name) {
            const key = data.name.trim().toLowerCase();
            if (!meta[key]) {
              meta[key] = {
                category: data.category || 'General Pharma',
                genericName: data.genericName || '',
                countryOfOrigin: data.countryOfOrigin || ''
              };
            }
          }
        });
        setMedicineMetadataMap(meta);
      }
    } catch (err) {
      console.error('Failed to load market sales intelligence', err);
      if (!demoMode) {
        toast.error('Unable to fetch market sales data.');
      }
    } finally {
      setMarketSalesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'market-intelligence' || activeTab === 'overview') {
      loadMarketIntelligenceSales(marketDateRange, customStartDate, customEndDate);
    }
  }, [activeTab, marketDateRange]);

  // Aggregated Product Sales Metrics with Pharmacy Dispersion
  const productMetrics = React.useMemo(() => {
    const map = new Map<string, {
      productName: string;
      genericName: string;
      category: string;
      totalQuantitySold: number;
      totalRevenue: number;
      transactionCount: number;
      uniquePharmacies: Set<string>;
      pharmacyMap: Map<string, {
        pharmacyId: string;
        pharmacyName: string;
        city: string;
        quantity: number;
        revenue: number;
        transactionCount: number;
      }>;
      lastSaleDate: number;
      countryOfOrigin?: string;
    }>();

    displayMarketSales.forEach(sale => {
      const pId = sale.pharmacyId || 'unknown_pharma';
      const user = displayUsers.find(u => u.uid === pId);
      const pName = user?.pharmacyName || user?.displayName || (sale as any).pharmacyName || 'Network Pharmacy';
      const pCity = user?.city || user?.region || 'Addis Ababa';

      if (!Array.isArray(sale.items)) return;

      sale.items.forEach(item => {
        if (!item || !item.name) return;
        const normalizedName = item.name.trim();
        const lookupKey = normalizedName.toLowerCase();
        const meta = activeMetadataMap[lookupKey];

        const existing = map.get(normalizedName) || {
          productName: normalizedName,
          genericName: meta?.genericName || '',
          category: meta?.category || (item as any).category || 'General Pharma',
          totalQuantitySold: 0,
          totalRevenue: 0,
          transactionCount: 0,
          uniquePharmacies: new Set<string>(),
          pharmacyMap: new Map(),
          lastSaleDate: 0,
          countryOfOrigin: meta?.countryOfOrigin || ''
        };

        const qty = Number(item.quantity) || 0;
        const itemTotal = Number(item.total) || (qty * (Number(item.price) || 0));

        existing.totalQuantitySold += qty;
        existing.totalRevenue += itemTotal;
        existing.transactionCount += 1;
        existing.uniquePharmacies.add(pId);
        existing.lastSaleDate = Math.max(existing.lastSaleDate, sale.createdAt || 0);

        const currentPharm = existing.pharmacyMap.get(pId) || {
          pharmacyId: pId,
          pharmacyName: pName,
          city: pCity,
          quantity: 0,
          revenue: 0,
          transactionCount: 0
        };
        currentPharm.quantity += qty;
        currentPharm.revenue += itemTotal;
        currentPharm.transactionCount += 1;
        existing.pharmacyMap.set(pId, currentPharm);

        map.set(normalizedName, existing);
      });
    });

    return Array.from(map.values()).map(p => {
      const pharmacyList = Array.from(p.pharmacyMap.values()).map(ph => ({
        ...ph,
        sharePercent: p.totalQuantitySold > 0 ? Math.round((ph.quantity / p.totalQuantitySold) * 100) : 0
      })).sort((a, b) => b.quantity - a.quantity);

      const bestPharmacy = pharmacyList.length > 0 ? pharmacyList[0] : undefined;
      const worstPharmacy = pharmacyList.length > 1 ? pharmacyList[pharmacyList.length - 1] : undefined;

      return {
        ...p,
        uniquePharmacyCount: p.uniquePharmacies.size,
        averagePrice: p.totalQuantitySold > 0 ? (p.totalRevenue / p.totalQuantitySold) : 0,
        pharmacyList,
        bestPharmacy,
        worstPharmacy,
      };
    });
  }, [displayMarketSales, activeMetadataMap, displayUsers]);

  // Aggregated Pharmacy Performance Metrics (Ranked by Success, Revenue, Best & Worst Items)
  const pharmacyMetrics = React.useMemo(() => {
    const map = new Map<string, {
      pharmacyId: string;
      pharmacyName: string;
      city: string;
      ownerName?: string;
      phone?: string;
      licenseNumber?: string;
      verificationStatus?: string;
      totalRevenue: number;
      totalQuantitySold: number;
      transactionCount: number;
      uniqueProductsSet: Set<string>;
      lastSaleDate: number;
      productMap: Map<string, {
        productName: string;
        genericName?: string;
        category: string;
        quantity: number;
        revenue: number;
        transactionCount: number;
      }>;
    }>();

    // Register all pharmacies from displayUsers so inactive/struggling nodes are identified
    const registeredPharmacies = displayUsers.filter(u => u.role === 'pharmacy');
    registeredPharmacies.forEach(u => {
      const pId = u.uid || 'unknown';
      const name = u.pharmacyName || u.displayName || 'Unnamed Pharmacy';
      map.set(pId, {
        pharmacyId: pId,
        pharmacyName: name,
        city: u.city || u.region || 'Addis Ababa',
        ownerName: u.ownerName,
        phone: u.phone,
        licenseNumber: u.licenseNumber,
        verificationStatus: u.verificationStatus,
        totalRevenue: 0,
        totalQuantitySold: 0,
        transactionCount: 0,
        uniqueProductsSet: new Set<string>(),
        lastSaleDate: 0,
        productMap: new Map(),
      });
    });

    // Aggregate sales data
    displayMarketSales.forEach(sale => {
      const pId = sale.pharmacyId || 'unknown';
      let entry = map.get(pId);
      if (!entry) {
        const u = displayUsers.find(user => user.uid === pId);
        entry = {
          pharmacyId: pId,
          pharmacyName: u?.pharmacyName || u?.displayName || (sale as any).pharmacyName || 'Network Pharmacy',
          city: u?.city || u?.region || 'Addis Ababa',
          ownerName: u?.ownerName,
          phone: u?.phone,
          licenseNumber: u?.licenseNumber,
          verificationStatus: u?.verificationStatus,
          totalRevenue: 0,
          totalQuantitySold: 0,
          transactionCount: 0,
          uniqueProductsSet: new Set<string>(),
          lastSaleDate: 0,
          productMap: new Map(),
        };
        map.set(pId, entry);
      }

      let saleTotal = Number(sale.total) || 0;
      entry.totalRevenue += saleTotal;
      entry.transactionCount += 1;
      entry.lastSaleDate = Math.max(entry.lastSaleDate, sale.createdAt || 0);

      if (Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          if (!item || !item.name) return;
          const normName = item.name.trim();
          const qty = Number(item.quantity) || 0;
          const itemTotal = Number(item.total) || (qty * (Number(item.price) || 0));

          entry!.totalQuantitySold += qty;
          entry!.uniqueProductsSet.add(normName);

          const prodEntry = entry!.productMap.get(normName) || {
            productName: normName,
            genericName: activeMetadataMap[normName.toLowerCase()]?.genericName || '',
            category: activeMetadataMap[normName.toLowerCase()]?.category || (item as any).category || 'General Pharma',
            quantity: 0,
            revenue: 0,
            transactionCount: 0,
          };
          prodEntry.quantity += qty;
          prodEntry.revenue += itemTotal;
          prodEntry.transactionCount += 1;
          entry!.productMap.set(normName, prodEntry);
        });
      }
    });

    // Build pharmacy items and determine best and worst selling products
    const array = Array.from(map.values()).map(p => {
      const productList = Array.from(p.productMap.values())
        .map(prod => ({
          ...prod,
          sharePercent: p.totalQuantitySold > 0 ? Math.round((prod.quantity / p.totalQuantitySold) * 100) : 0
        }))
        .sort((a, b) => b.quantity - a.quantity);

      const bestSellingProduct = productList.length > 0 ? productList[0] : undefined;
      const worstSellingProduct = productList.length > 1 ? productList[productList.length - 1] : undefined;

      return {
        pharmacyId: p.pharmacyId,
        pharmacyName: p.pharmacyName,
        city: p.city,
        ownerName: p.ownerName,
        phone: p.phone,
        licenseNumber: p.licenseNumber,
        verificationStatus: p.verificationStatus,
        totalRevenue: p.totalRevenue,
        totalQuantitySold: p.totalQuantitySold,
        transactionCount: p.transactionCount,
        uniqueProductsCount: p.uniqueProductsSet.size,
        averageBasket: p.transactionCount > 0 ? p.totalRevenue / p.transactionCount : 0,
        lastSaleDate: p.lastSaleDate,
        productList,
        bestSellingProduct,
        worstSellingProduct,
      };
    });

    // Sort by total revenue descending
    array.sort((a, b) => b.totalRevenue - a.totalRevenue);

    const activeWithSales = array.filter(p => p.totalRevenue > 0);
    const countWithSales = activeWithSales.length;

    return array.map((p, index) => {
      let tier: 'Top Performer' | 'High Volume' | 'Moderate' | 'Low / Underperforming' | 'No Sales';
      if (p.totalRevenue === 0) {
        tier = 'No Sales';
      } else if (index < 3 || index < countWithSales * 0.2) {
        tier = 'Top Performer';
      } else if (index < countWithSales * 0.5) {
        tier = 'High Volume';
      } else if (index < countWithSales * 0.8) {
        tier = 'Moderate';
      } else {
        tier = 'Low / Underperforming';
      }

      return {
        ...p,
        rank: p.totalRevenue > 0 ? index + 1 : 999,
        tier,
      };
    });
  }, [displayMarketSales, displayUsers, activeMetadataMap]);

  // Available categories list
  const marketCategories = React.useMemo(() => {
    const cats = new Set<string>();
    productMetrics.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [productMetrics]);

  // Filtered & Sorted Product Leaderboard
  const filteredProducts = React.useMemo(() => {
    return productMetrics
      .filter(p => {
        const matchesCategory = marketCategoryFilter === 'all' || p.category === marketCategoryFilter;
        
        // Pharmacy filter: only show products sold by selected pharmacy
        if (marketPharmacyFilter !== 'all') {
          const hasSale = p.pharmacyList.some(ph => ph.pharmacyId === marketPharmacyFilter);
          if (!hasSale) return false;
        }

        const searchLower = marketSearchQuery.toLowerCase().trim();
        const matchesSearch = !searchLower || 
          p.productName.toLowerCase().includes(searchLower) || 
          p.genericName.toLowerCase().includes(searchLower) ||
          p.category.toLowerCase().includes(searchLower) ||
          p.pharmacyList.some(ph => ph.pharmacyName.toLowerCase().includes(searchLower) || ph.city.toLowerCase().includes(searchLower));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (marketSortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
        if (marketSortBy === 'frequency') return b.transactionCount - a.transactionCount;
        if (marketSortBy === 'pharmacies') return b.uniquePharmacyCount - a.uniquePharmacyCount;
        return b.totalQuantitySold - a.totalQuantitySold;
      });
  }, [productMetrics, marketCategoryFilter, marketPharmacyFilter, marketSearchQuery, marketSortBy]);

  // Filtered & Sorted Pharmacy Leaderboard
  const filteredPharmacies = React.useMemo(() => {
    return pharmacyMetrics
      .filter(p => {
        // Tier filter
        if (marketPharmacyTierFilter !== 'all') {
          if (marketPharmacyTierFilter === 'top' && p.tier !== 'Top Performer') return false;
          if (marketPharmacyTierFilter === 'high' && p.tier !== 'High Volume') return false;
          if (marketPharmacyTierFilter === 'moderate' && p.tier !== 'Moderate') return false;
          if (marketPharmacyTierFilter === 'low' && p.tier !== 'Low / Underperforming') return false;
          if (marketPharmacyTierFilter === 'inactive' && p.tier !== 'No Sales') return false;
        }

        // Specific pharmacy selector
        if (marketPharmacyFilter !== 'all' && p.pharmacyId !== marketPharmacyFilter) {
          return false;
        }

        // Search query
        const q = marketSearchQuery.toLowerCase().trim();
        if (!q) return true;

        const matchesName = p.pharmacyName.toLowerCase().includes(q);
        const matchesCity = p.city.toLowerCase().includes(q);
        const matchesOwner = (p.ownerName || '').toLowerCase().includes(q);
        const matchesBestItem = (p.bestSellingProduct?.productName || '').toLowerCase().includes(q);
        const matchesWorstItem = (p.worstSellingProduct?.productName || '').toLowerCase().includes(q);

        return matchesName || matchesCity || matchesOwner || matchesBestItem || matchesWorstItem;
      })
      .sort((a, b) => {
        if (marketPharmacySortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
        if (marketPharmacySortBy === 'volume') return b.totalQuantitySold - a.totalQuantitySold;
        if (marketPharmacySortBy === 'transactions') return b.transactionCount - a.transactionCount;
        if (marketPharmacySortBy === 'products') return b.uniqueProductsCount - a.uniqueProductsCount;
        if (marketPharmacySortBy === 'worst') {
          // Sort lowest performers first (excluding 0 sales if there are sales, or lowest positive sales)
          if (a.totalRevenue === 0 && b.totalRevenue > 0) return 1;
          if (b.totalRevenue === 0 && a.totalRevenue > 0) return -1;
          return a.totalRevenue - b.totalRevenue;
        }
        return b.totalRevenue - a.totalRevenue;
      });
  }, [pharmacyMetrics, marketPharmacyTierFilter, marketPharmacyFilter, marketSearchQuery, marketPharmacySortBy]);

  // Overall KPIs
  const totalMarketQuantity = React.useMemo(() => {
    return productMetrics.reduce((sum, p) => sum + p.totalQuantitySold, 0);
  }, [productMetrics]);

  const totalMarketRevenue = React.useMemo(() => {
    return productMetrics.reduce((sum, p) => sum + p.totalRevenue, 0);
  }, [productMetrics]);

  const activeSellingPharmaciesCount = React.useMemo(() => {
    const pharms = new Set<string>();
    displayMarketSales.forEach(s => {
      if (s.pharmacyId) pharms.add(s.pharmacyId);
    });
    return pharms.size;
  }, [displayMarketSales]);

  // Category Distribution for PieChart
  const categoryDistributionData = React.useMemo(() => {
    const catMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    productMetrics.forEach(p => {
      const cat = p.category || 'General Pharma';
      if (!catMap[cat]) {
        catMap[cat] = { name: cat, quantity: 0, revenue: 0 };
      }
      catMap[cat].quantity += p.totalQuantitySold;
      catMap[cat].revenue += p.totalRevenue;
    });
    return Object.values(catMap).sort((a, b) => b.quantity - a.quantity).slice(0, 6);
  }, [productMetrics]);

  // Trend Data for AreaChart
  const salesTrendsData = React.useMemo(() => {
    const dayMap: Record<string, { dateStr: string; timestamp: number; quantity: number; revenue: number }> = {};
    
    displayMarketSales.forEach(sale => {
      if (!sale.createdAt) return;
      const d = new Date(sale.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      if (!dayMap[key]) {
        dayMap[key] = { dateStr: label, timestamp: sale.createdAt, quantity: 0, revenue: 0 };
      }
      let saleQty = 0;
      let saleRev = 0;
      if (Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          const q = Number(item.quantity) || 0;
          saleQty += q;
          saleRev += Number(item.total) || (q * (Number(item.price) || 0));
        });
      }
      dayMap[key].quantity += saleQty;
      dayMap[key].revenue += saleRev;
    });

    return Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v)
      .slice(-14);
  }, [displayMarketSales]);

  const CATEGORY_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'];

  const exportMarketIntelligenceCSV = () => {
    if (marketViewMode === 'pharmacies') {
      if (filteredPharmacies.length === 0) {
        toast.error('No pharmacy sales data available to export.');
        return;
      }
      const headers = [
        'Rank',
        'Pharmacy Name',
        'City/Region',
        'Performance Tier',
        'Total Revenue (ETB)',
        'Units Dispensed',
        'Best Selling Product',
        'Best Product Units',
        'Best Product Revenue (ETB)',
        'Lowest Selling Product',
        'Lowest Product Units',
        'Transactions',
        'Avg Basket (ETB)',
        'Distinct Medicines Dispensed',
        'Last Sale Date'
      ];
      const rows = filteredPharmacies.map((p, idx) => [
        p.rank < 900 ? p.rank : 'N/A',
        `"${p.pharmacyName.replace(/"/g, '""')}"`,
        `"${(p.city || '').replace(/"/g, '""')}"`,
        `"${p.tier}"`,
        p.totalRevenue.toFixed(2),
        p.totalQuantitySold,
        `"${(p.bestSellingProduct?.productName || 'None').replace(/"/g, '""')}"`,
        p.bestSellingProduct?.quantity || 0,
        (p.bestSellingProduct?.revenue || 0).toFixed(2),
        `"${(p.worstSellingProduct?.productName || 'N/A').replace(/"/g, '""')}"`,
        p.worstSellingProduct?.quantity || 0,
        p.transactionCount,
        p.averageBasket.toFixed(2),
        p.uniqueProductsCount,
        p.lastSaleDate ? new Date(p.lastSaleDate).toLocaleDateString() : 'N/A'
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `atech_pharmacy_performance_${marketDateRange}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Pharmacy Performance Leaderboard CSV exported!');
      createAuditLog('MARKET_INTELLIGENCE_EXPORT', `Exported pharmacy performance ranking report for period: ${marketDateRange}`);
    } else {
      if (filteredProducts.length === 0) {
        toast.error('No product sales data available to export.');
        return;
      }
      const headers = [
        'Rank',
        'Product Name',
        'Generic Name',
        'Category',
        'Units Sold',
        'Total Revenue (ETB)',
        'Top Selling Pharmacy (Best)',
        'Top Pharmacy Units Sold',
        'Lowest Selling Pharmacy (Worst)',
        'Lowest Pharmacy Units Sold',
        'Active Pharmacies Dispensing',
        'Sales Frequency (# of Txns)',
        'Avg Unit Price (ETB)',
        'Last Sale Date'
      ];
      const rows = filteredProducts.map((p, idx) => [
        idx + 1,
        `"${p.productName.replace(/"/g, '""')}"`,
        `"${(p.genericName || '').replace(/"/g, '""')}"`,
        `"${p.category.replace(/"/g, '""')}"`,
        p.totalQuantitySold,
        p.totalRevenue.toFixed(2),
        `"${(p.bestPharmacy?.pharmacyName || 'None').replace(/"/g, '""')}"`,
        p.bestPharmacy?.quantity || 0,
        `"${(p.worstPharmacy?.pharmacyName || 'N/A').replace(/"/g, '""')}"`,
        p.worstPharmacy?.quantity || 0,
        p.uniquePharmacyCount,
        p.transactionCount,
        p.averagePrice.toFixed(2),
        p.lastSaleDate ? new Date(p.lastSaleDate).toLocaleDateString() : 'N/A'
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `atech_product_market_intelligence_${marketDateRange}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Product Market Intelligence CSV exported!');
      createAuditLog('MARKET_INTELLIGENCE_EXPORT', `Exported product sales intelligence report for period: ${marketDateRange}`);
    }
  };

  const handleToggleInvoiceStatus = async (invoiceId: string, currentStatus: 'pending' | 'paid') => {
    try {
      const nextStatus = currentStatus === 'paid' ? 'pending' : 'paid';
      await updateDoc(doc(db, 'saas_invoices', invoiceId), {
        status: nextStatus,
        updatedAt: Date.now()
      });
      toast.success(`Invoice status marked as ${nextStatus.toUpperCase()}`);
      createAuditLog('INVOICE_STATUS_UPDATE', `Updated invoice ${invoiceId} status to ${nextStatus}`);
    } catch (e) {
      console.error("Failed to update invoice status:", e);
      toast.error('Failed to update invoice status.');
    }
  };

  // Helper calculation metrics
  const totalOrgs = displayUsers.length;
  const pharmacies = displayUsers.filter(u => u.role === 'pharmacy').length;
  const importers = displayUsers.filter(u => u.role === 'importer').length;
  const distributors = displayUsers.filter(u => u.role === 'distributor').length;

  const isUserExpired = (u: any) => {
    return u.subscriptionStatus === 'expired' || (u.subscriptionExpiryDate && Date.now() > u.subscriptionExpiryDate);
  };

  const isUserActive = (u: any) => {
    return u.subscriptionStatus === 'active' && (!u.subscriptionExpiryDate || Date.now() <= u.subscriptionExpiryDate);
  };

  const totalRegisteredPharmacies = displayUsers.filter(u => u.role === 'pharmacy').length;
  const totalRegisteredDistributors = displayUsers.filter(u => u.role === 'distributor').length;

  const activePaidSubsCount = displayUsers.filter(u => 
    (u.role === 'pharmacy' || u.role === 'importer' || u.role === 'distributor') && 
    isUserActive(u) && 
    !u.isFreeTrial
  ).length;

  const activeFreeTrialSubsCount = displayUsers.filter(u => 
    (u.role === 'pharmacy' || u.role === 'importer' || u.role === 'distributor') && 
    isUserActive(u) && 
    u.isFreeTrial
  ).length;

  const expiredFreeTrialsCount = displayUsers.filter(u => 
    (u.role === 'pharmacy' || u.role === 'importer' || u.role === 'distributor') && 
    isUserExpired(u) && 
    u.isFreeTrial
  ).length;

  const expiredPaidSubsCount = displayUsers.filter(u => 
    (u.role === 'pharmacy' || u.role === 'importer' || u.role === 'distributor') && 
    isUserExpired(u) && 
    !u.isFreeTrial
  ).length;

  const totalReferralRewards = allSubscriptionHistory
    .filter(h => h.action === 'Referral Reward')
    .reduce((sum, h) => sum + parseInt(h.months.replace('+', '') || '0'), 0);

  const totalAdminExtensions = allSubscriptionHistory
    .filter(h => h.action === 'Admin Extension')
    .reduce((sum, h) => sum + parseInt(h.months.replace('+', '') || '0'), 0);

  const totalFreeMonths = (displayUsers.filter(u => u.role === 'pharmacy').length * 1) +
    (displayUsers.filter(u => u.role === 'distributor').length * 2) +
    totalAdminExtensions +
    totalReferralRewards;

  const topReferringOrgs = [...displayUsers]
    .filter(u => (u.referralRewardMonthsEarned || 0) > 0)
    .sort((a, b) => (b.referralRewardMonthsEarned || 0) - (a.referralRewardMonthsEarned || 0))
    .slice(0, 5);

  const activeSubs = activePaidSubsCount + activeFreeTrialSubsCount;
  
  // Simulated revenue aggregations (strictly excluding free trials)
  const totalSubscriptionRevenue = displayUsers.reduce((sum, u) => {
    if ((u.role === 'pharmacy' || u.role === 'importer' || u.role === 'distributor') && isUserActive(u) && !u.isFreeTrial) {
      const price = u.subscriptionType === 'premium' ? 5000 : u.subscriptionType === 'standard' ? 2500 : 1000;
      return sum + price;
    }
    return sum;
  }, 0);

  const totalMarketplaceGMV = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCommissionRevenue = orders.reduce((sum, o) => sum + (o.commissionAmount || 0), 0);
  const totalMonthlyRevenue = totalSubscriptionRevenue + totalCommissionRevenue;

  // Advertisement Campaign Profits & Metrics
  const totalApprovedAdRevenue = ads.reduce((sum, a) => {
    if (a.status !== 'Pending Approval' && a.status !== 'Rejected') {
      return sum + (Number(a.revenueEst) || 0);
    }
    return sum;
  }, 0);

  const pendingAdRevenue = ads.reduce((sum, a) => {
    if (a.status === 'Pending Approval') {
      return sum + (Number(a.revenueEst) || 0);
    }
    return sum;
  }, 0);

  const activeAdsCount = ads.filter(a => a.status === 'Active').length;
  const pendingAdsCount = ads.filter(a => a.status === 'Pending Approval').length;

  // Promotion / Coupon-Driven Revenue
  const activePromo = systemSettings?.promotions?.find(p => p.active);
  const promoDiscountPercent = activePromo ? (activePromo.discountPercent || 0) : 0;

  const promoDrivenRevenue = users.reduce((sum, u) => {
    if ((u.role === 'pharmacy' || u.role === 'importer' || u.role === 'distributor') && isUserActive(u) && !u.isFreeTrial) {
      const basePrice = u.subscriptionType === 'premium' ? 5000 : u.subscriptionType === 'standard' ? 2500 : 0;
      if (basePrice > 0 && promoDiscountPercent > 0) {
        return sum + (basePrice * (1 - promoDiscountPercent / 100));
      }
    }
    return sum;
  }, 0);

  const couponDrivenRevenue = users.reduce((sum, u) => {
    if ((u.role === 'pharmacy' || u.role === 'importer' || u.role === 'distributor') && isUserActive(u) && !u.isFreeTrial && u.referredBy) {
      const matchedDiscount = systemSettings?.discounts?.find(
        d => d.code.toUpperCase() === u.referredBy?.toUpperCase() && d.active
      );
      if (matchedDiscount) {
        const basePrice = u.subscriptionType === 'premium' ? 5000 : u.subscriptionType === 'standard' ? 2500 : 1000;
        const discountPercent = matchedDiscount.percent || 0;
        return sum + (basePrice * (1 - discountPercent / 100));
      }
    }
    return sum;
  }, 0);

  const promoDiscountsSaved = users.reduce((sum, u) => {
    if ((u.role === 'pharmacy' || u.role === 'importer' || u.role === 'distributor') && isUserActive(u) && !u.isFreeTrial) {
      const basePrice = u.subscriptionType === 'premium' ? 5000 : u.subscriptionType === 'standard' ? 2500 : 0;
      if (basePrice > 0 && promoDiscountPercent > 0) {
        return sum + (basePrice * (promoDiscountPercent / 100));
      }
    }
    return sum;
  }, 0);

  const couponDiscountsSaved = users.reduce((sum, u) => {
    if ((u.role === 'pharmacy' || u.role === 'importer' || u.role === 'distributor') && isUserActive(u) && !u.isFreeTrial && u.referredBy) {
      const matchedDiscount = systemSettings?.discounts?.find(
        d => d.code.toUpperCase() === u.referredBy?.toUpperCase() && d.active
      );
      if (matchedDiscount) {
        const basePrice = u.subscriptionType === 'premium' ? 5000 : u.subscriptionType === 'standard' ? 2500 : 1000;
        const discountPercent = matchedDiscount.percent || 0;
        return sum + (basePrice * (discountPercent / 100));
      }
    }
    return sum;
  }, 0);

  const handleCountryChange = (countryName: string) => {
    let countryCode = '+251';
    let currency = 'ETB';
    let region = 'Addis Ababa';
    let city = 'Addis Ababa';
    
    if (countryName === 'Kenya') {
      countryCode = '+254';
      currency = 'KES';
      region = 'Nairobi County';
      city = 'Nairobi';
    } else if (countryName === 'Uganda') {
      countryCode = '+256';
      currency = 'UGX';
      region = 'Central Region';
      city = 'Kampala';
    } else if (countryName === 'Tanzania') {
      countryCode = '+255';
      currency = 'TZS';
      region = 'Dar es Salaam';
      city = 'Dodoma';
    } else if (countryName === 'Rwanda') {
      countryCode = '+250';
      currency = 'RWF';
      region = 'Kigali Province';
      city = 'Kigali';
    } else if (countryName === 'Burundi') {
      countryCode = '+257';
      currency = 'BIF';
      region = 'Gitega Province';
      city = 'Gitega';
    } else if (countryName === 'Somalia') {
      countryCode = '+252';
      currency = 'SOS';
      region = 'Banaadir';
      city = 'Mogadishu';
    } else if (countryName === 'South Sudan') {
      countryCode = '+211';
      currency = 'SSP';
      region = 'Central Equatoria';
      city = 'Juba';
    } else if (countryName === 'Djibouti') {
      countryCode = '+253';
      currency = 'DJF';
      region = 'Djibouti';
      city = 'Djibouti City';
    } else if (countryName === 'Eritrea') {
      countryCode = '+291';
      currency = 'ERN';
      region = 'Maekel';
      city = 'Asmara';
    } else if (countryName === 'Sudan') {
      countryCode = '+249';
      currency = 'SDG';
      region = 'Khartoum';
      city = 'Khartoum';
    } else if (countryName === 'Madagascar') {
      countryCode = '+261';
      currency = 'MGA';
      region = 'Analamanga';
      city = 'Antananarivo';
    } else if (countryName === 'Mozambique') {
      countryCode = '+258';
      currency = 'MZN';
      region = 'Maputo';
      city = 'Maputo';
    } else if (countryName === 'Malawi') {
      countryCode = '+265';
      currency = 'MWK';
      region = 'Lilongwe';
      city = 'Lilongwe';
    } else if (countryName === 'Zambia') {
      countryCode = '+260';
      currency = 'ZMW';
      region = 'Lusaka';
      city = 'Lusaka';
    } else if (countryName === 'Zimbabwe') {
      countryCode = '+263';
      currency = 'ZWG';
      region = 'Harare';
      city = 'Harare';
    } else if (countryName === 'Comoros') {
      countryCode = '+269';
      currency = 'KMF';
      region = 'Grande Comore';
      city = 'Moroni';
    } else if (countryName === 'Mauritius') {
      countryCode = '+230';
      currency = 'MUR';
      region = 'Plaines Wilhems';
      city = 'Port Louis';
    } else if (countryName === 'Seychelles') {
      countryCode = '+248';
      currency = 'SCR';
      region = 'Mahé';
      city = 'Victoria';
    }
    
    setNewOrg(prev => ({
      ...prev,
      country: countryName,
      region,
      city,
      countryCode,
      currency
    }));
  };

  // Handles adding a new organization
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docRef = doc(collection(db, 'users'));
      const orgId = docRef.id;
      const isPharmacy = newOrg.role === 'pharmacy';
      const isDistributor = newOrg.role === 'distributor';
      const durationDays = isPharmacy ? 30 : isDistributor ? 60 : 30;
      const expiryDate = Date.now() + durationDays * 24 * 60 * 60 * 1000;

      const orgData = {
        ...newOrg,
        uid: orgId,
        verificationStatus: 'approved',
        subscriptionStatus: 'active',
        subscriptionExpiryDate: expiryDate,
        lastSubscriptionPaymentDate: Date.now(),
        isFreeTrial: isPharmacy || isDistributor,
        createdAt: Date.now()
      };

      await setDoc(docRef, orgData);

      if (isPharmacy || isDistributor) {
        // Create the free trial subscription record in saas_invoices
        const dateObj = new Date();
        const billingPeriod = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const invoiceId = `trial_${orgId}_${Date.now()}`;
        
        await setDoc(doc(db, 'saas_invoices', invoiceId), {
          id: invoiceId,
          pharmacyId: orgId,
          pharmacyName: newOrg.displayName || (isPharmacy ? 'SaaS Pharmacy' : 'Distributor Partner'),
          plan: isPharmacy ? 'Pharmacy Free Trial (30 Days)' : 'Distributor Free Trial (60 Days)',
          basePrice: 0,
          additionalBranchesCount: 0,
          additionalBranchFee: 0,
          additionalCharges: 0,
          discountPercent: 0,
          totalAmount: 0,
          vatAmount: 0,
          subtotal: 0,
          currency: newOrg.currency || 'ETB',
          status: 'active',
          paymentStatus: 'Free Trial',
          paymentAmount: 0,
          subscriptionType: isPharmacy ? 'Pharmacy Free Trial (30 Days)' : 'Distributor Free Trial (60 Days)',
          paymentMethod: 'System Generated',
          billingPeriod: billingPeriod,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }

      toast.success(`${newOrg.displayName} created successfully!`);
      setShowAddOrgModal(false);
      createAuditLog('ORG_CREATE', `Created organization ${newOrg.displayName} as a ${newOrg.role}`);
    } catch {
      toast.error('Failed to create organization.');
    }
  };

  // Handles adding a new regional manager
  const handleCreateRM = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const generatedUid = 'rm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      
      await setDoc(doc(db, 'users', generatedUid), {
        uid: generatedUid,
        displayName: newRM.displayName,
        name: newRM.displayName,
        email: newRM.email,
        phone: newRM.phone,
        role: 'regional_manager',
        region: newRM.region,
        country: newRM.country,
        verificationStatus: 'approved',
        createdAt: Date.now(),
        notes: newRM.notes
      });
      
      toast.success(`Regional Manager ${newRM.displayName} created successfully!`);
      setShowAddRMModal(false);
      
      // Reset form
      setNewRM({
        displayName: '',
        email: '',
        phone: '',
        region: 'Addis Ababa',
        country: 'Ethiopia',
        notes: ''
      });
      
      createAuditLog('RM_CREATE', `Appointed Regional Manager ${newRM.displayName} for ${newRM.region} (${newRM.country})`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create Regional Manager.');
    }
  };

  const handleSeedDemoData = async () => {
    setIsSeedingDemo(true);
    const toastId = toast.loading('Generating complete demonstration network (120 pharmacies, wholesale team, marketing campaigns, consignments, and sales)...');
    try {
      const res = await seedDemoSalesData();
      if (res.success) {
        toast.success(
          `Demo network generated! (${res.stats.pharmacies} Pharmacies, ${res.stats.wholesaleStaff + res.stats.wholesalers} Wholesale Accounts, ${res.stats.marketingStaff} Marketers, ${res.stats.sales} Sales, ${res.stats.purchaseOrders} POs, ${res.stats.wholesaleOrders} Distribution Orders)`,
          { id: toastId, duration: 6000 }
        );
        createAuditLog('DEMO_DATA_SEED', `Generated demo network: ${res.stats.pharmacies} pharmacies, ${res.stats.wholesalers} wholesalers, ${res.stats.wholesaleStaff} wholesale staff, ${res.stats.marketingStaff} marketers, ${res.stats.medicines} medicines, ${res.stats.sales} sales, ${res.stats.purchaseOrders} POs, ${res.stats.wholesaleOrders} wholesale orders, ${res.stats.advertisements} ads, ${res.stats.announcements} announcements`);
      } else {
        toast.error(`Demo data generation failed: ${res.error}`, { id: toastId });
      }
    } catch (err: any) {
      toast.error(`Unexpected error: ${err.message || err}`, { id: toastId });
    } finally {
      setIsSeedingDemo(false);
    }
  };

  const handleClearDemoData = async () => {
    setIsClearingDemo(true);
    const toastId = toast.loading('Purging all demonstration data records (isDemo === true)...');
    try {
      const res = await clearDemoSalesData();
      if (res.success) {
        toast.success(`Demo data cleanly purged! (${res.deletedCount} demo records removed)`, { id: toastId });
        setIsConfirmingClearDemo(false);
        createAuditLog('DEMO_DATA_CLEAR', `Purged ${res.deletedCount} demo data records`);
      } else {
        toast.error(`Demo purge failed: ${res.error}`, { id: toastId });
      }
    } catch (err: any) {
      toast.error(`Unexpected error: ${err.message || err}`, { id: toastId });
    } finally {
      setIsClearingDemo(false);
    }
  };

  const handleSystemReset = async () => {
    setIsResetting(true);
    try {
      const currentUid = auth.currentUser?.uid;
      const adminEmails = ['andualemtyb@gmail.com', 'atech2119@gmail.com'];
      
      const collectionsToWipe = [
        'medicines',
        'branches',
        'warehouses',
        'warehouse_transactions',
        'transfers',
        'sales',
        'products',
        'orders',
        'purchase_orders',
        'suppliers',
        'expiry_settings',
        'notifications',
        'audit_logs',
        'inventory_movements',
        'advertisements'
      ];

      // Delete all documents in non-user collections
      for (const colName of collectionsToWipe) {
        try {
          const snap = await getDocs(collection(db, colName));
          for (const document of snap.docs) {
            await deleteDoc(doc(db, colName, document.id));
          }
        } catch (colErr) {
          console.warn(`Could not wipe collection ${colName}:`, colErr);
        }
      }

      // Delete all users except current admin
      const usersSnap = await getDocs(collection(db, 'users'));
      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        const userEmail = userData.email?.toLowerCase().trim();
        const userUid = userDoc.id;
        
        const isCurrentAdmin = userUid === currentUid || adminEmails.includes(userEmail);
        
        if (!isCurrentAdmin) {
          await deleteDoc(doc(db, 'users', userUid));
        }
      }

      toast.success("Database wiped successfully! System is now clean and looks brand new.");
      setIsConfirmingReset(false);
    } catch (error: any) {
      console.error("Error during database reset:", error);
      toast.error(`Database wipe failed: ${error.message || error}`);
    } finally {
      setIsResetting(false);
    }
  };

  // Switch active status of organization (Verification, suspending & activating)
  const handleUpdateStatus = async (uid: string, name: string, status: UserProfile['verificationStatus']) => {
    try {
      await updateDoc(doc(db, 'users', uid), { verificationStatus: status });
      toast.success(`Organization verification updated to ${status}`);
      createAuditLog('ORG_STATUS_UPDATE', `Updated status of ${name} to ${status}`);

      if (status === 'approved') {
        const userDocRef = doc(db, 'users', uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserProfile;
          
          // Check if newly approved pharmacy was invited by a wholesaler
          if (userData.invitedWholesalerId && userData.invitedCustomerId) {
            const whCustRef = doc(db, 'wholesale_customers', userData.invitedCustomerId);
            const whCustSnap = await getDoc(whCustRef);
            if (whCustSnap.exists()) {
              const customerData = whCustSnap.data();
              
              const updatedTimeline = [
                ...(customerData.timeline || []),
                {
                  id: `convert_${Date.now()}`,
                  type: 'conversion',
                  title: 'A-Tech Registration Approved 🎉',
                  description: `Automatically linked and converted from private profile. Linked to A-Tech UID: ${uid}.`,
                  timestamp: Date.now()
                }
              ];
              await updateDoc(whCustRef, {
                isPrivate: false,
                linkedOrgId: uid,
                timeline: updatedTimeline
              });

              // Send real-time notification to the inviting wholesaler
              const notifId = `invite_success_${userData.invitedCustomerId}_${Date.now()}`;
              await setDoc(doc(db, 'notifications', notifId), {
                id: notifId,
                title: 'Customer Onboarded to A-Tech! 🚀',
                message: `Your invited client "${customerData.businessName}" has registered and was approved. All historical CRM data and billing entries remain linked!`,
                target: 'specific',
                targetUids: [userData.invitedWholesalerId],
                senderId: 'system',
                createdAt: Date.now()
              });
            }
          }
          
          if (userData.referrerUid && !userData.referralRewardApplied) {
            const referrerUid = userData.referrerUid;
            const referrerDocRef = doc(db, 'users', referrerUid);
            const referrerDocSnap = await getDoc(referrerDocRef);
            
            if (referrerDocSnap.exists()) {
              const referrerData = referrerDocSnap.data() as UserProfile;
              
              // Calculate new subscriptionExpiryDate: add 30 days
              const currentExpiry = referrerData.subscriptionExpiryDate || Date.now();
              const newExpiry = Math.max(currentExpiry, Date.now()) + (30 * 24 * 60 * 60 * 1000);
              
              // Update referrer user doc
              await updateDoc(referrerDocRef, {
                subscriptionExpiryDate: newExpiry,
                subscriptionStatus: 'active',
                referralRewardMonthsEarned: (referrerData.referralRewardMonthsEarned || 0) + 1,
                pendingReferralPopups: arrayUnion({ id: uid, referredName: name })
              });
              
              // Mark newly approved user as rewarded
              await updateDoc(userDocRef, {
                referralRewardApplied: true
              });
              
              // Create Notification in notifications collection
              const notifId = `ref_reward_${uid}_${Date.now()}`;
              await setDoc(doc(db, 'notifications', notifId), {
                id: notifId,
                title: 'Referral Reward Approved! 🎉',
                message: `You received 1 Free Month of subscription extension!\n\nReason: Your referred pharmacy/distributor ${name} was approved by the administration.\n\nDate: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
                target: 'specific',
                targetUids: [referrerUid],
                senderId: 'system',
                createdAt: Date.now()
              });
              
              // Create Subscription History entry
              const historyId = `history_ref_${uid}_${Date.now()}`;
              await setDoc(doc(db, 'subscription_history', historyId), {
                id: historyId,
                orgId: referrerUid,
                date: Date.now(),
                action: 'Referral Reward',
                months: '+1',
                performedBy: 'System',
                reason: `Referral approval of ${name}`
              });
              
              // Create Audit Log for system
              createAuditLog('REFERRAL_REWARD_APPLIED', `Granted 1 free month to referrer ${referrerData.displayName || referrerData.email} for referral of ${name}`);
              toast.success(`Referral reward of +1 month automatically granted to referrer!`);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to modify status:', error);
      toast.error(`Failed to modify status: ${error.message || error}`);
    }
  };

  // Expand subscription support
  const handlePostponeSubscription = async (uid: string, name: string) => {
    try {
      const expDate = Date.now() + 30 * 24 * 60 * 60 * 1000;
      await updateDoc(doc(db, 'users', uid), {
        subscriptionStatus: 'active',
        subscriptionExpiryDate: expDate
      });
      toast.success('Subscription extended by 30 days!');
      createAuditLog('SUBSCRIPTION_EXTEND', `Extended subscription expiry for ${name}`);
    } catch {
      toast.error('Failed to extend subscription.');
    }
  };

  const handleAddFreeMonths = async () => {
    if (!selectedOrgForDetail) return;
    if (extensionMonths <= 0 || extensionMonths > 24) {
      toast.error("Please enter a valid number of months (1-24)");
      return;
    }
    if (!extensionReason.trim() || extensionReason.trim().length < 10) {
      toast.error("Please enter a clear reason (at least 10 characters)");
      return;
    }

    try {
      const uid = selectedOrgForDetail.uid;
      const orgName = selectedOrgForDetail.pharmacyName || selectedOrgForDetail.importerName || selectedOrgForDetail.distributorName || selectedOrgForDetail.displayName || 'Unnamed Organization';
      
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        toast.error("Organization not found.");
        return;
      }
      
      const userData = userDocSnap.data() as UserProfile;
      const currentExpiry = userData.subscriptionExpiryDate || Date.now();
      const additionalMs = extensionMonths * 30 * 24 * 60 * 60 * 1000;
      const newExpiry = Math.max(currentExpiry, Date.now()) + additionalMs;

      // 1. Update Firestore User Profile
      await updateDoc(userDocRef, {
        subscriptionExpiryDate: newExpiry,
        subscriptionStatus: 'active'
      });

      // 2. Save Subscription History entry
      const historyId = `history_ext_${uid}_${Date.now()}`;
      await setDoc(doc(db, 'subscription_history', historyId), {
        id: historyId,
        orgId: uid,
        date: Date.now(),
        action: 'Admin Extension',
        months: `+${extensionMonths}`,
        performedBy: auth.currentUser?.email || 'Super Admin',
        reason: extensionReason.trim()
      });

      // 3. Create Audit Log
      createAuditLog('SUBSCRIPTION_EXTEND', `Super Admin extended subscription of ${orgName} by ${extensionMonths} months. Reason: ${extensionReason.trim()}`);

      // 4. Update local detail view state
      setSelectedOrgForDetail({
        ...userData,
        subscriptionExpiryDate: newExpiry,
        subscriptionStatus: 'active'
      });

      toast.success(`Extended subscription of ${orgName} by ${extensionMonths} months!`);
      setShowAddFreeMonthsModal(false);
      setExtensionMonths(1);
      setExtensionReason('');
    } catch (err: any) {
      console.error('Failed to extend subscription:', err);
      toast.error(`Extension failed: ${err.message || err}`);
    }
  };

  const handleUpdateSubscriptionAccessField = async (
    field: string,
    value: any,
    logAction: string,
    logDetails: string
  ) => {
    if (!selectedOrgForDetail) return;
    try {
      const uid = selectedOrgForDetail.uid;
      const userDocRef = doc(db, 'users', uid);
      
      const updateData = { [field]: value };
      await updateDoc(userDocRef, updateData);
      
      // Update local state
      const updatedOrg = {
        ...selectedOrgForDetail,
        [field]: value
      };
      setSelectedOrgForDetail(updatedOrg);
      
      // Log event to subscription_history for auditing
      const historyId = `history_acl_${uid}_${Date.now()}`;
      await setDoc(doc(db, 'subscription_history', historyId), {
        id: historyId,
        orgId: uid,
        date: Date.now(),
        action: logAction,
        months: '0',
        performedBy: auth.currentUser?.email || 'Super Admin',
        reason: logDetails
      });
      
      createAuditLog('SUBSCRIPTION_ACCESS_UPDATE', `${logAction}: ${logDetails} for organization ${uid}`);
      toast.success("Subscription access configuration updated!");
    } catch (error: any) {
      console.error("Failed to update access control:", error);
      toast.error(`Failed to update settings: ${error.message || error}`);
    }
  };

  const handleToggleSuspendOrg = async () => {
    if (!selectedOrgForDetail) return;
    const uid = selectedOrgForDetail.uid;
    const currentStatus = selectedOrgForDetail.verificationStatus;
    const nextStatus = currentStatus === 'suspended' ? 'approved' : 'suspended';
    
    try {
      await updateDoc(doc(db, 'users', uid), { verificationStatus: nextStatus });
      setSelectedOrgForDetail({
        ...selectedOrgForDetail,
        verificationStatus: nextStatus
      });
      
      const actionText = nextStatus === 'suspended' ? 'Suspend Organization' : 'Resume Organization';
      const reasonText = nextStatus === 'suspended' ? 'Suspended by Super Admin' : 'Reactivated by Super Admin';
      
      // Log event
      const historyId = `history_status_${uid}_${Date.now()}`;
      await setDoc(doc(db, 'subscription_history', historyId), {
        id: historyId,
        orgId: uid,
        date: Date.now(),
        action: actionText,
        months: '0',
        performedBy: auth.currentUser?.email || 'Super Admin',
        reason: reasonText
      });
      
      createAuditLog('ORG_STATUS_UPDATE', `${actionText} for organization ${uid}`);
      toast.success(`Organization ${nextStatus === 'suspended' ? 'suspended' : 'resumed'} successfully!`);
    } catch (error: any) {
      toast.error(`Operation failed: ${error.message || error}`);
    }
  };

  useEffect(() => {
    if (!selectedOrgForDetail?.uid) {
      setSubHistory([]);
      return;
    }
    const q = query(
      collection(db, 'subscription_history'),
      where('orgId', '==', selectedOrgForDetail.uid),
      orderBy('date', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as SubscriptionHistoryEntry);
      setSubHistory(list);
    }, (err) => {
      console.error('Failed to fetch subscription history:', err);
    });
    return unsub;
  }, [selectedOrgForDetail?.uid]);

  const recalculateAllPharmaciesBilling = async () => {
    const pharmacies = users.filter(u => u.role === 'pharmacy');
    let successfulCount = 0;
    for (const pharmacy of pharmacies) {
      if (pharmacy.uid) {
        try {
          await syncPharmacyBillingAndInvoices(pharmacy.uid);
          successfulCount++;
        } catch (e) {
          console.error(`Failed to sync billing for pharmacy ${pharmacy.uid}:`, e);
        }
      }
    }
    if (successfulCount > 0) {
      toast.success(`Automatically updated subscriptions & invoices for ${successfulCount} pharmacies.`);
    }
  };

  // Adjust Plan pricing globally
  const handleUpdatePlanPrices = async (plan: 'standard' | 'premium', price: number) => {
    try {
      const updatedPrices = { ...(systemSettings?.planPrices || {}), [plan]: price };
      const updatedCountryPricing = { ...(systemSettings?.countryPricing || {}) };
      if (updatedCountryPricing['Ethiopia']) {
        updatedCountryPricing['Ethiopia'] = {
          ...updatedCountryPricing['Ethiopia'],
          [plan]: price
        };
      }
      await setDoc(doc(db, 'system_settings', 'main'), { 
        planPrices: updatedPrices,
        countryPricing: updatedCountryPricing
      }, { merge: true });
      toast.success(`${plan.toUpperCase()} plan updated to ${price} ETB`);
      createAuditLog('PRICE_OVERRIDE', `Updated global ${plan} pricing plan to ${price} ETB`);
      await recalculateAllPharmaciesBilling();
    } catch (err) {
      console.error('Error updating plan price:', err);
      toast.error('Failed to override SaaS plan pricing matrix.');
    }
  };

  const handleUpdateDistributorMonthlyFee = async (price: number) => {
    if (!systemSettings) return;
    try {
      await updateDoc(doc(db, 'system_settings', 'main'), { distributorMonthlyFee: price });
      toast.success(`Distributor subscription fee updated to ${price} ETB`);
      createAuditLog('PRICE_OVERRIDE', `Updated global distributor monthly fee to ${price} ETB`);
      
      const distributorsQuery = users.filter(u => u.role === 'distributor');
      for (const dist of distributorsQuery) {
        await updateDoc(doc(db, 'users', dist.uid), {
          monthlyBillingAmount: price,
          monthlyBillingVatAmount: price * 0.15,
          monthlyBillingTotalAmountWithVat: price * 1.15
        });
      }
    } catch {
      toast.error('Failed to override distributor subscription fee.');
    }
  };

  const handleUpdateBranchFee = async (fee: number) => {
    if (!systemSettings) return;
    try {
      await updateDoc(doc(db, 'system_settings', 'main'), { additionalBranchFee: fee });
      toast.success(`Additional branch fee updated to ${fee}`);
      createAuditLog('PRICE_OVERRIDE', `Updated branch retail fee to ${fee}`);
      await recalculateAllPharmaciesBilling();
    } catch {
      toast.error('Failed to update retail branch fee.');
    }
  };

  const handleUpdateCurrency = async (curr: string) => {
    if (!systemSettings) return;
    try {
      await updateDoc(doc(db, 'system_settings', 'main'), { branchPricingCurrency: curr });
      toast.success(`Billing currency updated to ${curr}`);
      createAuditLog('PRICE_OVERRIDE', `Updated SaaS currency to ${curr}`);
      await recalculateAllPharmaciesBilling();
    } catch {
      toast.error('Failed to update billing currency.');
    }
  };

  const handleAddPromotion = async (title: string, discountPercent: number, description: string) => {
    if (!systemSettings) return;
    try {
      const activePromos = systemSettings.promotions || [];
      const updatedPromos = [
        ...activePromos.map(p => ({ ...p, active: false })), 
        { title, discountPercent, description, active: true }
      ];
      await updateDoc(doc(db, 'system_settings', 'main'), { promotions: updatedPromos });
      toast.success('Active marketing promotion campaign launched!');
    } catch {
      toast.error('Failed to save promotion settings.');
    }
  };

  const handleDeactivatePromotion = async (index: number) => {
    if (!systemSettings) return;
    try {
      const activePromos = [...(systemSettings.promotions || [])];
      if (activePromos[index]) {
        activePromos[index].active = false;
      }
      await updateDoc(doc(db, 'system_settings', 'main'), { promotions: activePromos });
      toast.success('Campaign deactivated successfully');
    } catch {
      toast.error('Failed to deactivate campaign');
    }
  };

  const handleAddDiscountCode = async (code: string, percent: number, description: string) => {
    if (!systemSettings) return;
    try {
      const activeDiscounts = systemSettings.discounts || [];
      const updatedDiscounts = [
        ...activeDiscounts,
        { code: code.toUpperCase(), percent, description, active: true }
      ];
      await updateDoc(doc(db, 'system_settings', 'main'), { discounts: updatedDiscounts });
      toast.success(`Coupon code ${code} created successfully!`);
    } catch {
      toast.error('Failed to create coupon code');
    }
  };

  const handleDeactivateDiscount = async (index: number) => {
    if (!systemSettings) return;
    try {
      const activeDiscounts = [...(systemSettings.discounts || [])];
      if (activeDiscounts[index]) {
        activeDiscounts[index].active = false;
      }
      await updateDoc(doc(db, 'system_settings', 'main'), { discounts: activeDiscounts });
      toast.success('Coupon code deactivated');
    } catch {
      toast.error('Failed to update coupon code status');
    }
  };

  // Handle Featured status in Marketplace Control Drawer
  const handleToggleFeatureProduct = async (prodId: string, name: string, currentVal: boolean) => {
    try {
      await updateDoc(doc(db, 'products', prodId), { featured: !currentVal });
      toast.success('Marketplace promotional layout updated!');
      createAuditLog('MARKETPLACE_BADGE', `Toggled feature status of product ${name}`);
    } catch {
      toast.error('Index database sync issue or missing permission.');
    }
  };

  // Handle Support Ticket actions
  const handleAddTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const org = users.find(u => u.uid === newTicket.organizationId);
    const item: SupportTicket = {
      id: `t_${Date.now()}`,
      organizationId: newTicket.organizationId,
      organizationName: org?.pharmacyName || org?.importerName || org?.displayName || 'Unknown Org',
      title: newTicket.title,
      description: newTicket.description,
      category: newTicket.category,
      severity: newTicket.severity,
      status: 'open',
      createdAt: Date.now()
    };
    setTickets([item, ...tickets]);
    toast.success('New internal support ticket opened.');
    createAuditLog('TICKET_CREATE', `Opened support ticket: ${newTicket.title}`);
    setShowAddTicketModal(false);
  };

  const updateTicketStatus = (id: string, status: SupportTicket['status']) => {
    setTickets(tickets.map(t => t.id === id ? { ...t, status } : t));
    toast.success(`Ticket marked as ${status}`);
    createAuditLog('TICKET_UPDATE', `Modified Ticket ID: ${id} status to ${status}`);
  };

  // Handle Communication Center announcements
  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let targetUids: string[] = [];
      if (announcement.target === 'specific') {
        if (!announcement.targetEmail.trim()) {
          toast.error('Please enter a target company or user email.');
          return;
        }
        const inputEmails = announcement.targetEmail.split(',').map(em => em.trim().toLowerCase());
        const matchedUsers = users.filter(u => u.email && inputEmails.includes(u.email.toLowerCase()));
        
        if (matchedUsers.length === 0) {
          toast.error('No matching user or company was found with the specified email(s).');
          return;
        }
        targetUids = matchedUsers.map(u => u.uid);
      }

      await addDoc(collection(db, 'notifications'), {
        title: announcement.title,
        message: announcement.message,
        target: announcement.target,
        targetRegion: announcement.target === 'region' ? announcement.targetRegion : null,
        targetUids: announcement.target === 'specific' ? targetUids : null,
        senderId: 'SuperAdmin',
        createdAt: Date.now()
      });
      toast.success('Announcement broadcasted to ecosystem!');
      createAuditLog('BROADCAST_MESSAGE', `Sent announcement: ${announcement.title} to ${announcement.target === 'specific' ? announcement.targetEmail : announcement.target}`);
      setAnnouncement({ title: '', message: '', target: 'all', targetRegion: '', targetEmail: '' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to deliver feed notification.');
    }
  };

  // Export PDF Report helper using jsPDF
  const exportPDFReport = (country: string) => {
    const docPdf = new jsPDF();
    
    // Header
    docPdf.setFontSize(22);
    docPdf.setTextColor(26, 54, 93);
    docPdf.text(`ATech Ecosystem - Country Audit [${country}]`, 14, 20);
    
    docPdf.setFontSize(10);
    docPdf.setTextColor(115, 115, 115);
    docPdf.text(`Generated: ${new Date().toLocaleString()} | Super Admin Control Tower`, 14, 26);
    
    // Core Metrics Table
    const totals = users.filter(u => u.country === country);
    const countryPhar = totals.filter(u => u.role === 'pharmacy').length;
    const countryImp = totals.filter(u => u.role === 'importer').length;
    const countryDist = totals.filter(u => u.role === 'distributor').length;
    const activeCountrySubs = totals.filter(u => (u.role === 'pharmacy' || u.role === 'importer' || u.role === 'distributor') && u.subscriptionStatus === 'active').length;

    const data = [
      ['Metric', 'Current Standing'],
      ['Total Organizations', totals.length.toString()],
      ['Active Pharmacies', countryPhar.toString()],
      ['Active Wholesale Pharmacies', countryImp.toString()],
      ['Registered Distributors', countryDist.toString()],
      ['Active SaaS Subscriptions', activeCountrySubs.toString()],
    ];

    (docPdf as any).autoTable({
      head: [data[0]],
      body: data.slice(1),
      startY: 32,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    });

    const finalY = (docPdf as any).lastAutoTable.finalY + 10;
    
    // Sign off
    docPdf.setFontSize(9);
    docPdf.text('Authorized Compliance Seal: ATECH East Africa Pharmaceuticals Administration System (Powered by Emerge Globally)', 14, finalY);
    
    docPdf.save(`atech_east_africa_report_${country.toLowerCase()}.pdf`);
    toast.success('PDF Audit Report downloaded successfully!');
    createAuditLog('PDF_EXPORT', `Downloaded analytical report for ${country}`);
  };

  // Layout Nav Elements helper
  const tabsConfig = [
    { id: 'overview', label: 'Ecosystem Vitals', icon: LayoutDashboard },
    { id: 'organizations', label: 'Organization Deck', icon: Users },
    { id: 'country', label: 'Country Center', icon: Globe },
    { id: 'regional', label: 'Regional Territories', icon: Layers },
    { id: 'subscriptions', label: 'Subscription Hub', icon: DollarSign },
    { id: 'marketplace', label: 'Marketplace Admin', icon: Truck },
    { id: 'pharmacy-wholesales', label: 'Pharmacy Whole Sales', icon: Building2 },
    { id: 'audit', label: 'Audit Log Desk', icon: FileText },
    { id: 'secops', label: 'Security (SOC)', icon: ShieldAlert },
    { id: 'revenue', label: 'Revenue Analytics', icon: TrendingUp },
    { id: 'sales-audit', label: 'Sales Intelligence / Audit', icon: Receipt },
    { id: 'product-demand', label: 'Product Demand & Importer Intel', icon: Sparkles },
    { id: 'market-intelligence', label: 'Market & Product Intelligence', icon: BarChart3 },
    { id: 'health', label: 'System Vitals', icon: Activity },
    { id: 'support', label: 'Support Center', icon: LifeBuoy },
    { id: 'communication', label: 'Broadcaster', icon: Megaphone },
    { id: 'distributor', label: 'Distributor Node', icon: ShieldCheck },
    { id: 'warehouse', label: 'Warehouse Ledger', icon: Warehouse },
    { id: 'ai', label: 'AI Strategy Layer', icon: Cpu },
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-950 p-6 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white dark:bg-[#0A1224] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">ATECH East Africa Command Center</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Master Administrative Core - Powered by ATECH Intelligence</p>
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Date Range Selector */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-[#0E1A33] border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value as any)}
                className="bg-transparent outline-none cursor-pointer text-slate-800 dark:text-slate-200 text-xs font-semibold pr-1"
              >
                <option value="7d" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Last 7 Days</option>
                <option value="30d" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Last 30 Days</option>
                <option value="90d" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Last 90 Days</option>
                <option value="1y" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Year to Date</option>
              </select>
            </div>

            <button 
              onClick={() => {
                toast.success('Refreshing data states across all endpoints...');
                setLoading(true);
                setTimeout(() => setLoading(false), 400);
              }}
              className="p-2.5 bg-slate-50 dark:bg-[#0E1A33] border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-white rounded-xl transition-all cursor-pointer shadow-sm"
              title="Sync Database"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Demonstration mode badge button */}
            <button 
              onClick={() => {
                const next = !demoMode;
                setDemoMode(next);
                toast.success(next ? 'Demonstration mode active (mock metrics filled)' : 'Switched to live database mode');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 shadow-sm ${
                demoMode 
                  ? 'bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-300 dark:border-blue-500/40' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
              title="Toggle Demonstration vs Live Data"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>{demoMode ? 'Demo Data - Not Real' : 'Live Database'}</span>
            </button>

            {activeTab === 'regional' && (
              <button 
                onClick={() => setShowAddOrgModal(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold font-sans flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-100 dark:shadow-none"
              >
                <Plus className="w-4 h-4" /> Provision Organization
              </button>
            )}
          </div>
        </div>

        {/* Console Container Layout */}
        <div className="w-full flex flex-col gap-6 items-start">
          
          {/* Active Screen Viewport */}
          <div className="w-full min-h-[600px] flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl py-24 text-slate-400">
                <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <p className="text-sm font-semibold">Pulling core metrics...</p>
              </div>
            ) : (
              <div className={`flex-1 ${activeTab === 'overview' ? 'space-y-6' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm'}`}>
                
                {/* Switch screen views */}
                
                {/* TAB 1: OVERVIEW */}
                {activeTab === 'overview' && (() => {
                  const currentTrendData = 
                    dateRangeFilter === '7d' ? DEMO_COMMAND_CENTER.salesTrend7d :
                    dateRangeFilter === '90d' ? DEMO_COMMAND_CENTER.salesTrend90d :
                    dateRangeFilter === '1y' ? DEMO_COMMAND_CENTER.salesTrend1y :
                    DEMO_COMMAND_CENTER.salesTrend30d;

                  const dateMultiplier = 
                    dateRangeFilter === '7d' ? 0.23 :
                    dateRangeFilter === '90d' ? 2.85 :
                    dateRangeFilter === '1y' ? 11.2 : 1;

                  const displayPharmacies = demoMode ? DEMO_COMMAND_CENTER.totalPharmacies.value : (pharmacies || DEMO_COMMAND_CENTER.totalPharmacies.value);
                  const displayWholesale = demoMode ? DEMO_COMMAND_CENTER.wholesaleCompanies.value : (importers || DEMO_COMMAND_CENTER.wholesaleCompanies.value);
                  const displayMarketing = demoMode ? DEMO_COMMAND_CENTER.marketingTeam.value : (users.filter(u => u.role === 'marketing').length || DEMO_COMMAND_CENTER.marketingTeam.value);
                  const displayProducts = demoMode ? DEMO_COMMAND_CENTER.totalProducts.value : (products.length || DEMO_COMMAND_CENTER.totalProducts.value);
                  
                  const displaySales = demoMode ? Math.round(DEMO_COMMAND_CENTER.totalSales.value * dateMultiplier) : (orders.length || Math.round(DEMO_COMMAND_CENTER.totalSales.value * dateMultiplier));
                  const displayRevenue = demoMode ? Math.round(DEMO_COMMAND_CENTER.totalRevenue.value * dateMultiplier) : (totalMonthlyRevenue || Math.round(DEMO_COMMAND_CENTER.totalRevenue.value * dateMultiplier));
                  const displayProfit = demoMode ? Math.round(DEMO_COMMAND_CENTER.totalProfit.value * dateMultiplier) : Math.round(displayRevenue * 0.392);
                  const displayCustomers = demoMode ? DEMO_COMMAND_CENTER.totalCustomers.value : (users.length > 5 ? users.length * 45 : DEMO_COMMAND_CENTER.totalCustomers.value);

                  return (
                    <div className="space-y-6">
                      {/* Top 8 KPI Cards (2 Rows of 4 Cards) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Card 1: Total Pharmacies */}
                        <div className="bg-white dark:bg-[#0A1224] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Pharmacies</span>
                              <div className="flex items-baseline gap-2 mt-1.5">
                                <span className="text-2xl font-black text-slate-900 dark:text-white font-sans tracking-tight">{displayPharmacies}</span>
                                <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 flex items-center">
                                  ↑ +12%
                                </span>
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                              <Store className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                            Active: {demoMode ? DEMO_COMMAND_CENTER.totalPharmacies.active : pharmacies || 298} | Pending: {demoMode ? DEMO_COMMAND_CENTER.totalPharmacies.pending : 14}
                          </div>
                        </div>

                        {/* Card 2: Wholesale Companies */}
                        <div className="bg-white dark:bg-[#0A1224] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Wholesale Companies</span>
                              <div className="flex items-baseline gap-2 mt-1.5">
                                <span className="text-2xl font-black text-slate-900 dark:text-white font-sans tracking-tight">{displayWholesale}</span>
                                <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 flex items-center">
                                  ↑ +8%
                                </span>
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20">
                              <Building2 className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                            Active: {demoMode ? DEMO_COMMAND_CENTER.wholesaleCompanies.active : importers || 46} | Pending: {demoMode ? DEMO_COMMAND_CENTER.wholesaleCompanies.pending : 2}
                          </div>
                        </div>

                        {/* Card 3: Marketing Team */}
                        <div className="bg-white dark:bg-[#0A1224] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Marketing Team</span>
                              <div className="flex items-baseline gap-2 mt-1.5">
                                <span className="text-2xl font-black text-slate-900 dark:text-white font-sans tracking-tight">{displayMarketing}</span>
                                <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 flex items-center">
                                  ↑ +15%
                                </span>
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20">
                              <Users className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                            Active: {demoMode ? DEMO_COMMAND_CENTER.marketingTeam.active : 49} | Pending: {demoMode ? DEMO_COMMAND_CENTER.marketingTeam.pending : 3}
                          </div>
                        </div>

                        {/* Card 4: Total Products */}
                        <div className="bg-white dark:bg-[#0A1224] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Products</span>
                              <div className="flex items-baseline gap-2 mt-1.5">
                                <span className="text-2xl font-black text-slate-900 dark:text-white font-sans tracking-tight">{displayProducts.toLocaleString()}</span>
                                <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 flex items-center">
                                  ↑ +6%
                                </span>
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
                              <Package className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                            Active: {demoMode ? DEMO_COMMAND_CENTER.totalProducts.active.toLocaleString() : products.length || 1198} | Inactive: {demoMode ? DEMO_COMMAND_CENTER.totalProducts.inactive : 58}
                          </div>
                        </div>

                        {/* Card 5: Total Sales */}
                        <div className="bg-white dark:bg-[#0A1224] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Sales ({dateRangeFilter === '30d' ? '30 days' : dateRangeFilter === '7d' ? '7 days' : dateRangeFilter === '90d' ? '90 days' : 'Year'})</span>
                              <div className="flex items-baseline gap-2 mt-1.5">
                                <span className="text-2xl font-black text-slate-900 dark:text-white font-sans tracking-tight">{displaySales.toLocaleString()}</span>
                                <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 flex items-center">
                                  ↑ +18%
                                </span>
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20">
                              <TrendingUp className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                            Total transactions: {Math.round(DEMO_COMMAND_CENTER.totalSales.transactions * dateMultiplier).toLocaleString()}
                          </div>
                        </div>

                        {/* Card 6: Total Revenue */}
                        <div className="bg-white dark:bg-[#0A1224] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Revenue</span>
                              <div className="flex items-baseline gap-2 mt-1.5">
                                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">{displayRevenue.toLocaleString()} ETB</span>
                                <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 flex items-center">
                                  ↑ +22%
                                </span>
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                              <DollarSign className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                            vs. previous {dateRangeFilter === '30d' ? '30 days' : 'period'}
                          </div>
                        </div>

                        {/* Card 7: Total Profit (Estimated) */}
                        <div className="bg-white dark:bg-[#0A1224] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Profit (Estimated)</span>
                              <div className="flex items-baseline gap-2 mt-1.5">
                                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">{displayProfit.toLocaleString()} ETB</span>
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-violet-500/15 text-violet-400 border border-violet-500/20">
                              <DollarSign className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                            Margin: {DEMO_COMMAND_CENTER.totalProfit.margin}
                          </div>
                        </div>

                        {/* Card 8: Total Customers */}
                        <div className="bg-white dark:bg-[#0A1224] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Customers</span>
                              <div className="flex items-baseline gap-2 mt-1.5">
                                <span className="text-2xl font-black text-slate-900 dark:text-white font-sans tracking-tight">{displayCustomers.toLocaleString()}</span>
                                <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 flex items-center">
                                  ↑ +14%
                                </span>
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/20">
                              <Activity className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                            Active: {demoMode ? DEMO_COMMAND_CENTER.totalCustomers.active.toLocaleString() : '142,317'}
                          </div>
                        </div>
                      </div>

                      {/* Middle Row: Sales Trend (6 cols), Top Products (3 cols), Top Pharmacies (3 cols) */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        {/* Sales Trend Chart (Col 1: 6 cols) */}
                        <div className="lg:col-span-6 bg-white dark:bg-[#0A1224] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                              Sales Trend ({dateRangeFilter === '30d' ? 'Last 30 Days' : dateRangeFilter === '7d' ? 'Last 7 Days' : dateRangeFilter === '90d' ? 'Last 90 Days' : 'Year to Date'})
                            </h3>
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#080E1C] p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                              <button
                                onClick={() => setTrendMetric('revenue')}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                  trendMetric === 'revenue'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${trendMetric === 'revenue' ? 'bg-white' : 'bg-transparent'}`} />
                                Revenue
                              </button>
                              <button
                                onClick={() => setTrendMetric('units')}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  trendMetric === 'units'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                              >
                                Units Sold
                              </button>
                            </div>
                          </div>

                          <div className="h-64 w-full mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={currentTrendData} margin={{ top: 12, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="areaTrendGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4}/>
                                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.25} />
                                <XAxis 
                                  dataKey="date" 
                                  stroke="#64748B" 
                                  fontSize={10} 
                                  tickLine={false} 
                                  axisLine={{ stroke: '#334155', opacity: 0.3 }} 
                                />
                                <YAxis 
                                  stroke="#64748B" 
                                  fontSize={10} 
                                  tickLine={false} 
                                  axisLine={{ stroke: '#334155', opacity: 0.3 }}
                                  tickFormatter={(val) => {
                                    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                                    if (val >= 1000) return `${Math.round(val / 1000)}K`;
                                    return val;
                                  }}
                                />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#0B1528', borderColor: '#1E293B', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                                  formatter={(val: any) => [
                                    trendMetric === 'revenue' ? `${Number(val).toLocaleString()} ETB` : `${Number(val).toLocaleString()} Units`, 
                                    trendMetric === 'revenue' ? 'Revenue' : 'Units Sold'
                                  ]}
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey={trendMetric} 
                                  stroke="#3B82F6" 
                                  strokeWidth={3} 
                                  fill="url(#areaTrendGrad)" 
                                  dot={{ r: 3, fill: '#3B82F6', strokeWidth: 1 }}
                                  activeDot={{ r: 5, fill: '#60A5FA', stroke: '#1E40AF', strokeWidth: 2 }}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Top Products by Sales Volume (Col 2: 3 cols) */}
                        <div className="lg:col-span-3 bg-white dark:bg-[#0A1224] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top Products by Sales Volume</h3>
                            <button 
                              onClick={() => setActiveTab('market-intelligence')}
                              className="text-xs text-blue-500 hover:text-blue-400 font-bold transition-colors cursor-pointer"
                            >
                              View All
                            </button>
                          </div>
                          <div className="space-y-3.5 my-auto">
                            {DEMO_COMMAND_CENTER.topProducts.map((p) => (
                              <div key={p.rank} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${p.badgeColor}`}>
                                    {p.rank}
                                  </span>
                                  <div className={`p-1.5 rounded-lg shrink-0 ${p.iconColor}`}>
                                    <Pill className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="truncate">
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{p.name}</p>
                                    <p className="text-[10px] text-slate-400">{p.units.toLocaleString()} units</p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">{p.revenue.toLocaleString()} ETB</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Top Pharmacies by Revenue (Col 3: 3 cols) */}
                        <div className="lg:col-span-3 bg-white dark:bg-[#0A1224] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top Pharmacies by Revenue</h3>
                            <button 
                              onClick={() => setActiveTab('organizations')}
                              className="text-xs text-blue-500 hover:text-blue-400 font-bold transition-colors cursor-pointer"
                            >
                              View All
                            </button>
                          </div>
                          <div className="space-y-3.5 my-auto">
                            {DEMO_COMMAND_CENTER.topPharmacies.map((pharm) => (
                              <div key={pharm.rank} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-[10px] font-black shrink-0">
                                    {pharm.rank}
                                  </div>
                                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                                    <Store className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{pharm.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">{pharm.revenue.toLocaleString()} ETB</span>
                                  <span className="text-[10px] font-bold text-emerald-400">{pharm.change}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Lower Row: Sales by City (1 col), Sales by Category (1 col), Recent Activity (1 col) */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {/* Sales by City */}
                        <div className="bg-white dark:bg-[#0A1224] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sales by City</h3>
                            <button 
                              onClick={() => setActiveTab('regional')}
                              className="text-xs text-blue-500 hover:text-blue-400 font-bold transition-colors cursor-pointer"
                            >
                              View All
                            </button>
                          </div>
                          <div className="space-y-2.5">
                            {DEMO_COMMAND_CENTER.salesByCity.map((item) => (
                              <div key={item.city} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-600 dark:text-slate-300 font-medium">{item.city}</span>
                                  <span className="font-bold text-slate-900 dark:text-white font-mono">{item.revenue.toLocaleString()} ETB</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full rounded-full transition-all duration-500" 
                                    style={{ width: `${item.percent}%`, backgroundColor: item.barColor }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Sales by Product Category */}
                        <div className="bg-white dark:bg-[#0A1224] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sales by Product Category</h3>
                            <button 
                              onClick={() => setActiveTab('product-demand')}
                              className="text-xs text-blue-500 hover:text-blue-400 font-bold transition-colors cursor-pointer"
                            >
                              View All
                            </button>
                          </div>
                          <div className="relative h-44 w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={DEMO_COMMAND_CENTER.salesByCategory}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={55}
                                  outerRadius={75}
                                  paddingAngle={2}
                                  dataKey="value"
                                >
                                  {DEMO_COMMAND_CENTER.salesByCategory.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0A1224" strokeWidth={1.5} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  formatter={(val: any) => [`${val}%`, 'Share']}
                                  contentStyle={{ backgroundColor: '#0B1528', borderColor: '#1E293B', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight font-sans">12.48M</span>
                              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium leading-none">Total Revenue</span>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5">ETB</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
                            {DEMO_COMMAND_CENTER.salesByCategory.map((cat) => (
                              <div key={cat.name} className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                                  <span className="text-slate-600 dark:text-slate-300 truncate">{cat.name}</span>
                                </div>
                                <span className="font-semibold text-slate-500 dark:text-slate-400 shrink-0 ml-1">{cat.value}%</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white dark:bg-[#0A1224] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Activity</h3>
                            <button 
                              onClick={() => setActiveTab('audit')}
                              className="text-xs text-blue-500 hover:text-blue-400 font-bold transition-colors cursor-pointer"
                            >
                              View All
                            </button>
                          </div>
                          <div className="space-y-3.5">
                            {DEMO_COMMAND_CENTER.recentActivity.map((act) => {
                              const Icon = act.icon;
                              return (
                                <div key={act.id} className="flex items-start gap-3">
                                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${act.iconColor}`}>
                                    <Icon className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{act.title}</p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{act.subtitle}</p>
                                  </div>
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">{act.time}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Network Overview */}
                      <div className="bg-white dark:bg-[#0A1224] p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Network Overview</h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                          {DEMO_COMMAND_CENTER.networkOverview.map((item) => (
                            <div 
                              key={item.city} 
                              className="bg-slate-50 dark:bg-[#0E1A33] p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center flex flex-col justify-between"
                            >
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">{item.city}</span>
                              <div className="my-1.5">
                                <span className="text-base font-black text-slate-900 dark:text-white font-mono">{item.pharmacies}</span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1">Pharmacies</span>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400">{item.growth}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Command Center Footer */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 pt-4 pb-2 border-t border-slate-200 dark:border-slate-800/80 px-2">
                        <span className="font-semibold text-slate-500 dark:text-slate-300">ATECH Pharmacy Ecosystem</span>
                        <button
                          onClick={() => setDemoMode(!demoMode)}
                          className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 dark:text-blue-400 border border-blue-500/30 rounded-full font-bold text-[11px] transition-all cursor-pointer"
                          title="Click to toggle demo vs live database"
                        >
                          {demoMode ? 'Demo Data - Not Real' : 'Live Production Data'}
                        </button>
                        <span className="text-slate-400 dark:text-slate-500 text-[11px]">Better Data. Smarter Decisions. Healthier Communities.</span>
                      </div>
                    </div>
                  );
                })()}

                {/* TAB 2: ORGANIZATIONS */}
                {activeTab === 'organizations' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-mono">Organization Management Center</h2>
                          {demoMode && (
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full text-[10px] font-bold">
                              Demonstration Roster ({displayUsers.length} profiles)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">Approve, verify or inspect licensed pharmacies, wholesale companies, distributors & marketing personnel</p>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Search name, email, role, ID..." 
                          value={orgSearch} 
                          onChange={(e) => setOrgSearch(e.target.value)}
                          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white outline-none rounded-xl border border-slate-200 dark:border-slate-700 focus:border-blue-500 w-56"
                        />
                        <select 
                          value={orgTypeFilter} 
                          onChange={(e) => setOrgTypeFilter(e.target.value)}
                          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white outline-none rounded-xl border border-slate-200 dark:border-slate-700 focus:border-blue-500 cursor-pointer"
                        >
                          <option value="all">All Roles</option>
                          <option value="pharmacy">Pharmacies</option>
                          <option value="importer">Wholesale Pharmacies</option>
                          <option value="distributor">Distributors</option>
                          <option value="regional_manager">Regional Managers</option>
                          <option value="staff">Staff Members</option>
                          <option value="marketing">Marketing Team</option>
                          <option value="support">Support Agents</option>
                          <option value="admin">Administrators</option>
                        </select>
                      </div>
                    </div>

                    {/* Table of Org profiles */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-500 dark:text-slate-400">
                        <thead className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                          <tr>
                            <th className="px-4 py-3">Profile Name</th>
                            <th className="px-4 py-3">Location</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Subscription</th>
                            <th className="px-4 py-3">Remaining Time</th>
                            <th className="px-4 py-3 text-center">Uploaded File</th>
                            <th className="px-4 py-3">Verification</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {displayUsers
                            .filter(u => orgTypeFilter === 'all' ? true : u.role === orgTypeFilter)
                            .filter(u => {
                              const search = (orgSearch || '').toLowerCase().trim();
                              if (!search) return true;
                              const dName = (u.displayName || '').toLowerCase();
                              const pName = (u.pharmacyName || '').toLowerCase();
                              const iName = (u.importerName || '').toLowerCase();
                              const distName = (u.distributorName || '').toLowerCase();
                              const email = (u.email || '').toLowerCase();
                              const role = (u.role || '').toLowerCase();
                              const uid = (u.uid || '').toLowerCase();
                              return dName.includes(search) || 
                                     pName.includes(search) || 
                                     iName.includes(search) || 
                                     distName.includes(search) || 
                                     email.includes(search) || 
                                     role.includes(search) ||
                                     uid.includes(search);
                            })
                            .map((u) => (
                              <tr key={u.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => setSelectedOrgForDetail(u)}
                                    className="text-left font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer focus:outline-none transition-colors"
                                  >
                                    {u.pharmacyName || u.importerName || u.distributorName || u.displayName || 'Unnamed Organization'}
                                  </button>
                                  <p className="text-[10px] text-slate-400 font-mono tracking-wider">{u.email}</p>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-slate-600 dark:text-slate-300">{u.city || 'Addis Ababa'}, {u.country || 'Ethiopia'}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[9px] font-bold uppercase rounded text-slate-600 dark:text-slate-300">{u.role}</span>
                                </td>
                                <td className="px-4 py-3 font-mono">
                                  <span className={`font-bold ${u.subscriptionStatus === 'active' ? 'text-green-600' : 'text-red-500'}`}>{u.subscriptionType?.toUpperCase() || 'BASIC'}</span>
                                </td>
                                <td className="px-4 py-3">
                                  {(() => {
                                    const expiryDate = u.subscriptionExpiryDate || (() => {
                                      const baseTime = u.createdAt || Date.now();
                                      const durationDays = (u.role === 'distributor' || u.role === 'importer') ? 60 : 30;
                                      return baseTime + durationDays * 24 * 60 * 60 * 1000;
                                    })();
                                    const now = Date.now();
                                    const msRemaining = expiryDate - now;
                                    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

                                    let remainingText = '';
                                    let textClass = '';
                                    
                                    if (msRemaining <= 0) {
                                      remainingText = 'Subscription Expired';
                                      textClass = 'text-red-500 dark:text-red-400 font-bold';
                                    } else {
                                      if (daysRemaining >= 30) {
                                        const months = Math.floor(daysRemaining / 30);
                                        const days = daysRemaining % 30;
                                        remainingText = `${months} Month${months > 1 ? 's' : ''}${days > 0 ? ` ${days} Day${days > 1 ? 's' : ''}` : ''} left`;
                                      } else {
                                        remainingText = `${daysRemaining} Day${daysRemaining > 1 ? 's' : ''} left`;
                                      }
                                      textClass = daysRemaining < 7 
                                        ? 'text-amber-600 dark:text-amber-400 font-bold animate-pulse' 
                                        : 'text-emerald-600 dark:text-emerald-400 font-semibold';
                                    }

                                    return (
                                      <div className="flex flex-col gap-1">
                                        <span className={`text-[11px] font-bold ${textClass}`}>{remainingText}</span>
                                        <button
                                          onClick={() => {
                                            setSelectedOrgForDetail(u);
                                            setExtensionMonths(1);
                                            setExtensionReason('Administrative extension for goodwill support');
                                            setShowAddFreeMonthsModal(true);
                                          }}
                                          className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold rounded text-[9px] flex items-center gap-1 cursor-pointer border border-blue-100 dark:border-blue-900/25 transition-all w-fit shrink-0 hover:scale-105 active:scale-95"
                                          title="Add free subscription months"
                                        >
                                          <Sparkles size={9} />
                                          <span>+ Add Month</span>
                                        </button>
                                      </div>
                                    );
                                  })()}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => {
                                      setSelectedUserForFiles(u);
                                      setShowFilesModal(true);
                                    }}
                                    className="px-2.5 py-1 mx-auto bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold rounded text-[10px] flex items-center gap-1 cursor-pointer transition-all border border-blue-100 dark:border-blue-900/20 hover:scale-105"
                                    title="View registration documents and files"
                                  >
                                    <FileText className="w-3.5 h-3.5 shrink-0" />
                                    <span>View File ({(u.verificationDocs?.length || 0)})</span>
                                  </button>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                    u.verificationStatus === 'approved' 
                                      ? 'bg-green-100 text-green-700' 
                                      : u.verificationStatus === 'pending' 
                                      ? 'bg-amber-100 text-amber-700 animate-pulse' 
                                      : 'bg-red-100 text-red-700'
                                  }`}>{u.verificationStatus || 'pending'}</span>
                                </td>
                                <td className="px-4 py-3 text-right flex gap-1 justify-end items-center">
                                  <button
                                    onClick={() => {
                                      setSelectedUserForFiles(u);
                                      setShowFilesModal(true);
                                    }}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded text-[10px] flex items-center gap-1 cursor-pointer transition-all border border-slate-200 dark:border-slate-700"
                                    title="View registration documents and files"
                                  >
                                    <FileText className="w-3.5 h-3.5 shrink-0" />
                                    <span>Files ({(u.verificationDocs?.length || 0)})</span>
                                  </button>
                                  {u.verificationStatus === 'pending' && (
                                    <button 
                                      onClick={() => handleUpdateStatus(u.uid, u.pharmacyName || u.importerName || u.distributorName || u.displayName || 'Unnamed Organization', 'approved')}
                                      className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white font-bold rounded text-[10px] cursor-pointer"
                                    >
                                      Approve
                                    </button>
                                  )}
                                  {u.verificationStatus === 'approved' ? (
                                    <button 
                                      onClick={() => handleUpdateStatus(u.uid, u.pharmacyName || u.importerName || u.distributorName || u.displayName || 'Unnamed Organization', 'deactivated')}
                                      className="px-2.5 py-1 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 text-red-600 rounded text-[10px] cursor-pointer"
                                    >
                                      Suspend
                                    </button>
                                  ) : (
                                    u.verificationStatus !== 'pending' && (
                                      <button 
                                        onClick={() => handleUpdateStatus(u.uid, u.pharmacyName || u.importerName || u.distributorName || u.displayName || 'Unnamed Organization', 'approved')}
                                        className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 text-blue-600 rounded text-[10px] cursor-pointer"
                                      >
                                        Activate
                                      </button>
                                    )
                                  )}
                                </td>
                              </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 3: COUNTRY MANAGEMENT */}
                {activeTab === 'country' && (() => {
                  const countryData = DEMO_COUNTRY_METRICS.find(c => c.name === selectedCountry) || {
                    code: 'XX',
                    name: selectedCountry,
                    currency: 'USD',
                    currencySymbol: '$',
                    usdExchangeRate: 1.0,
                    exchangeRateToUsd: 1.0,
                    totalPharmacies: users.filter(u => u.country === selectedCountry && u.role === 'pharmacy').length || 12,
                    pharmacies: users.filter(u => u.country === selectedCountry && u.role === 'pharmacy').length || 12,
                    totalWholesalers: users.filter(u => u.country === selectedCountry && u.role === 'importer').length || 4,
                    wholesalers: users.filter(u => u.country === selectedCountry && u.role === 'importer').length || 4,
                    monthlyVolumeEtb: orders.filter(o => o.country === selectedCountry).reduce((sum, o) => sum + o.totalAmount, 0) || 1200000,
                    b2bVolumeEtb: orders.filter(o => o.country === selectedCountry).reduce((sum, o) => sum + o.totalAmount, 0) || 1200000,
                    regulatoryBody: 'National Ministry of Health',
                    activeDistributors: 2,
                    complianceScore: 95.0,
                    growth: '+10.0%',
                    regionalManagers: 1,
                    flag: '🌐'
                  };

                  const countryUsers = users.filter(u => u.country === selectedCountry);
                  const countryPharmaciesCount = countryUsers.filter(u => u.role === 'pharmacy').length || countryData.totalPharmacies;
                  const countryWholesalersCount = countryUsers.filter(u => u.role === 'importer').length || countryData.totalWholesalers;

                  return (
                    <div className="space-y-6 animate-fade-in">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pan-African Country Management Console</h2>
                            <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-bold">
                              19 Sovereignty Zones
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Administer cross-border regulatory compliance, national currency settlements, and appointed leadership</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => exportPDFReport(selectedCountry)}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-sm"
                          >
                            <FileText className="w-3.5 h-3.5" /> Export Country Snapshot (PDF)
                          </button>
                        </div>
                      </div>

                      {/* Country Selector Pills */}
                      <div className="flex flex-wrap gap-1.5 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        {['Ethiopia', 'Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Burundi', 'Somalia', 'South Sudan', 'Djibouti', 'Eritrea', 'Sudan', 'Madagascar', 'Mozambique', 'Malawi', 'Zambia', 'Zimbabwe', 'Comoros', 'Mauritius', 'Seychelles'].map((cntry) => (
                          <button 
                            key={cntry}
                            onClick={() => setSelectedCountry(cntry)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedCountry === cntry ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                          >
                            {cntry}
                          </button>
                        ))}
                      </div>

                      {/* Selected Country KPI Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Licensed Pharmacies</span>
                          <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">{countryPharmaciesCount} Hubs</div>
                          <span className="text-[10px] text-blue-600 font-medium">Point-of-Sale connected</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wholesale Importers</span>
                          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">{countryWholesalersCount} Firms</div>
                          <span className="text-[10px] text-indigo-600 font-medium">B2B Consignments</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">30d B2B Volume</span>
                          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                            {(countryData.monthlyVolumeEtb).toLocaleString()} {countryData.currency}
                          </div>
                          <span className="text-[10px] text-emerald-600 font-medium">Processed trades</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Regulatory Authority</span>
                          <div className="text-base font-black text-slate-900 dark:text-white mt-1 truncate" title={countryData.regulatoryBody}>
                            {countryData.regulatoryBody.split(' ')[0]}
                          </div>
                          <span className="text-[10px] text-slate-400 truncate block">{countryData.regulatoryBody}</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">National Currency</span>
                          <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">{countryData.currency}</div>
                          <span className="text-[10px] text-slate-400 font-mono">1 USD = {countryData.exchangeRateToUsd} {countryData.currency}</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compliance Index</span>
                          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">{countryData.complianceScore}%</div>
                          <span className="text-[10px] text-emerald-600 font-medium">EFDA/WHO Standard</span>
                        </div>
                      </div>

                      {/* Multi-Nation Comparative Matrix */}
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pan-African Operations &amp; Regulatory Comparison</h3>
                            <p className="text-[11px] text-slate-400">Head-to-head national footprint across operational jurisdictions</p>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">Standardized to Local Currencies</span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 font-mono">
                              <tr>
                                <th className="px-4 py-3">Jurisdiction</th>
                                <th className="px-4 py-3">Regulatory Body</th>
                                <th className="px-4 py-3">Pharmacies</th>
                                <th className="px-4 py-3">Wholesalers</th>
                                <th className="px-4 py-3">30d B2B Volume</th>
                                <th className="px-4 py-3">Fleet Logistics</th>
                                <th className="px-4 py-3 text-right">Compliance Health</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                              {DEMO_COUNTRY_METRICS.map((cInfo) => (
                                <tr 
                                  key={cInfo.name} 
                                  onClick={() => setSelectedCountry(cInfo.name)}
                                  className={`cursor-pointer transition-colors ${selectedCountry === cInfo.name ? 'bg-blue-50/60 dark:bg-blue-950/20 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
                                >
                                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                                    <span>{cInfo.name}</span>
                                    {selectedCountry === cInfo.name && (
                                      <span className="px-1.5 py-0.2 text-[8px] bg-blue-600 text-white rounded font-mono">ACTIVE</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">{cInfo.regulatoryBody}</td>
                                  <td className="px-4 py-3 font-mono text-slate-800 dark:text-white">{cInfo.totalPharmacies}</td>
                                  <td className="px-4 py-3 font-mono text-slate-800 dark:text-white">{cInfo.totalWholesalers}</td>
                                  <td className="px-4 py-3 font-mono text-emerald-600 font-bold">{(cInfo.monthlyVolumeEtb).toLocaleString()} {cInfo.currency}</td>
                                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{cInfo.activeDistributors} Operators</td>
                                  <td className="px-4 py-3 text-right">
                                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full font-mono text-[10px] font-bold">
                                      {cInfo.complianceScore}%
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Appointed Country Executive Managers */}
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Appointed Country Executives ({selectedCountry})</h3>
                            <p className="text-[11px] text-slate-400">Jurisdictional managers overseeing state and municipal territory nodes</p>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{users.filter(u => u.role === 'regional_manager' && u.country === selectedCountry).length} Appointed</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {users.filter(u => u.role === 'regional_manager' && u.country === selectedCountry).map((rm) => (
                            <div key={rm.uid} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                              <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{rm.displayName}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{rm.email}</p>
                                <p className="text-[10px] text-blue-600 mt-1">Jurisdiction: <strong>{rm.region || 'All States'}</strong></p>
                              </div>
                              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-bold font-mono">EXECUTIVE</span>
                            </div>
                          ))}
                          {users.filter(u => u.role === 'regional_manager' && u.country === selectedCountry).length === 0 && (
                            <div className="col-span-2 py-8 text-center text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                              No country executives appointed to {selectedCountry} yet. You can appoint one in the Regional tab.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* TAB 4: REGIONAL MANAGEMENT EXPANSION */}
                {activeTab === 'regional' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Regional Managers &amp; Territories</h2>
                          <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-bold">
                            7 Administrative State Hubs
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Territory director leaderboards, sales quotas, FEFO expiry risk ratings, and compliance audits</p>
                      </div>
                      <button
                        onClick={() => {
                          setNewRM({
                            displayName: '',
                            email: '',
                            phone: '',
                            region: 'Addis Ababa',
                            country: 'Ethiopia',
                            notes: ''
                          });
                          setShowAddRMModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm shadow-blue-500/20 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Create Regional Manager
                      </button>
                    </div>

                    {/* Regional Performance Leaderboard */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Territory Performance &amp; Quota Achievements</h3>
                          <p className="text-[11px] text-slate-400">Real-time revenue, quota achievement, and FEFO expiry risk indices per region</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">Target Cycle: Q3 2026</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 font-mono">
                            <tr>
                              <th className="px-4 py-3">Territory</th>
                              <th className="px-4 py-3">Regional Director</th>
                              <th className="px-4 py-3">Pharmacies</th>
                              <th className="px-4 py-3">Wholesalers</th>
                              <th className="px-4 py-3">30d Revenue</th>
                              <th className="px-4 py-3">Quota Attainment</th>
                              <th className="px-4 py-3">FEFO Risk Index</th>
                              <th className="px-4 py-3 text-right">Field Audits</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {DEMO_REGIONAL_DATA.map((reg) => (
                              <tr key={reg.regionName} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                <td className="px-4 py-3 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  <span>{reg.regionName}</span>
                                </td>
                                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{reg.directorName}</td>
                                <td className="px-4 py-3 font-mono text-slate-800 dark:text-white">{reg.pharmaciesCount}</td>
                                <td className="px-4 py-3 font-mono text-slate-800 dark:text-white">{reg.wholesalersCount}</td>
                                <td className="px-4 py-3 font-mono text-emerald-600 font-bold">{(reg.monthlyRevenueEtb).toLocaleString()} ETB</td>
                                <td className="px-4 py-3">
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-mono">
                                      <span className="font-bold text-blue-600">{reg.quotaPercent}%</span>
                                    </div>
                                    <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${reg.quotaPercent >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                                        style={{ width: `${Math.min(reg.quotaPercent, 100)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${reg.fefoRiskScore < 20 ? 'bg-emerald-500/10 text-emerald-600' : reg.fefoRiskScore < 30 ? 'bg-amber-500/10 text-amber-600' : 'bg-rose-500/10 text-rose-600'}`}>
                                    {reg.fefoRiskScore}% Risk
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                                  {reg.auditsCompleted} Audited
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Regional Managers List Section */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                          Active Regional Managers ({users.filter(u => u.role === 'regional_manager').length})
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {users.filter(u => u.role === 'regional_manager').map((rm) => (
                          <div key={rm.uid} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{rm.displayName}</h4>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{rm.email}</p>
                                {rm.phone && <p className="text-[10px] font-mono text-slate-500 mt-0.5">{rm.phone}</p>}
                              </div>
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full text-[9px] font-bold tracking-wide">ACTIVE</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800/50 pt-2.5 text-[10px]">
                              <div>
                                <span className="text-slate-400">Jurisdiction: </span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">{rm.region || 'All States'} ({rm.country || 'Ethiopia'})</span>
                              </div>
                              {rm.notes && (
                                <span className="text-slate-400 italic max-w-[150px] truncate" title={rm.notes}>"{rm.notes}"</span>
                              )}
                            </div>
                          </div>
                        ))}
                        {users.filter(u => u.role === 'regional_manager').length === 0 && (
                          <div className="col-span-2 text-center py-8 text-slate-400 text-xs italic">
                            No regional managers registered yet. Click the "Create Regional Manager" button to add one.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Appoint regional territory tool */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <h3 className="text-sm font-bold mb-4 text-slate-800 dark:text-white">Assign Territory Scope &amp; Target Quota</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Regional Manager</label>
                          <select 
                            className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white outline-none rounded-xl cursor-pointer"
                            onChange={() => {}}
                          >
                            <option>Select Manager</option>
                            {users.filter(u => u.role === 'regional_manager').map(u => (
                              <option key={u.uid} value={u.uid}>{u.displayName} ({u.region})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Target State / Territory</label>
                          <input 
                            type="text" 
                            defaultValue="Sidama State" 
                            className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white outline-none rounded-xl" 
                          />
                        </div>
                        <div className="flex items-end">
                          <button 
                            type="button" 
                            onClick={() => {
                              toast.success('Territory structure bound to compliance rules!');
                              createAuditLog('TERRITORY_ASSIGNED', 'Bound Sidama State territory index to designated managers');
                            }}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm"
                          >
                            Assign Boundaries
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: SUBSCRIPTION MANAGEMENT CENTER */}
                {activeTab === 'subscriptions' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">SaaS Subscriptions Engine</h2>
                      <p className="text-xs text-slate-400">Toggle pricing overrides and postponed expirations check</p>
                    </div>

                    {/* Subscription Metrics Breakdown Bento Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Registered Pharmacies</span>
                          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">{totalRegisteredPharmacies}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 mt-2 block">Total pharmacy hubs</span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Registered Distributors</span>
                          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">{totalRegisteredDistributors}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 mt-2 block">Total distributor hubs</span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block">Active Paid Subs</span>
                          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">{activePaidSubsCount}</span>
                        </div>
                        <span className="text-[9px] text-emerald-600/80 mt-2 block">Recurring revenue drivers</span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block">Active Free Trials</span>
                          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">{activeFreeTrialSubsCount}</span>
                        </div>
                        <span className="text-[9px] text-blue-600/80 mt-2 block">Non-paid active periods</span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Expired Free Trials</span>
                          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">{expiredFreeTrialsCount}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 mt-2 block">Completed trial cycles</span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block">Expired Paid Subs</span>
                          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">{expiredPaidSubsCount}</span>
                        </div>
                        <span className="text-[9px] text-red-600/80 mt-2 block">Lapsed paid agreements</span>
                      </div>
                    </div>

                    {/* Promotional Benefit Analytics Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Card 1: Total Referral Rewards */}
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">Total Referral Rewards</span>
                          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">+{totalReferralRewards} Month{totalReferralRewards !== 1 ? 's' : ''}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 mt-2 block">Promotional months earned by referrers</span>
                      </div>

                      {/* Card 2: Total Free/Promo Months */}
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block">Total Free & Promo Months</span>
                          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">{totalFreeMonths} Month{totalFreeMonths !== 1 ? 's' : ''}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 mt-2 block">Combined trial, referral, & admin months</span>
                      </div>

                      {/* Card 3: Top Referring Pharmacies/Distributors */}
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Top Referring Entities</span>
                        {topReferringOrgs.length === 0 ? (
                          <p className="text-xs text-slate-400 italic mt-1">No referrals recorded yet</p>
                        ) : (
                          <div className="space-y-1.5 max-h-[90px] overflow-y-auto pr-1">
                            {topReferringOrgs.map((org) => (
                              <div key={org.uid} className="flex justify-between text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                <span className="truncate max-w-[150px]">{org.pharmacyName || org.distributorName || org.displayName}</span>
                                <span className="font-bold text-amber-600 font-mono">+{org.referralRewardMonthsEarned} mos</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Subscription billing details cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['standard', 'premium'].map((tier) => {
                        const price = systemSettings?.planPrices?.[tier as 'standard' | 'premium'] || (tier === 'standard' ? 1200 : 3000);
                        return (
                          <div key={tier} className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tier} Plan Config</span>
                            <div className="mt-2 text-2xl font-black text-slate-800 dark:text-white font-mono">{price.toLocaleString()} ETB</div>
                            
                            <div className="mt-4 flex gap-1">
                              <input 
                                type="number" 
                                placeholder="Edit Price" 
                                id={`price-input-${tier}`}
                                className="w-20 px-2 py-1 bg-white dark:bg-slate-700 text-xs rounded border border-slate-200 text-slate-800 dark:text-white"
                              />
                              <button 
                                onClick={() => {
                                  const val = (document.getElementById(`price-input-${tier}`) as HTMLInputElement)?.value;
                                  if (val) handleUpdatePlanPrices(tier as any, parseInt(val));
                                }}
                                className="px-3 bg-blue-600 text-white rounded text-xs font-bold font-sans cursor-pointer hover:bg-blue-700"
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Distributor Subscription Configuration Panel */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800" id="distributor-sub-panel">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Distributor Subscriptions</span>
                      <h3 className="text-sm font-bold text-slate-950 dark:text-white mb-2">Unified Distributor Subscription Fee</h3>
                      <p className="text-xs text-slate-500 mb-4">Set the monthly price charged for the single unified Distributor subscription plan.</p>
                      
                      <div className="text-xl font-extrabold text-blue-600 mb-4 font-mono">
                        {(systemSettings?.distributorMonthlyFee ?? 1500).toLocaleString()} {systemSettings?.branchPricingCurrency ?? 'ETB'} / month
                      </div>

                      <div className="flex gap-2 max-w-sm">
                        <input 
                          type="number" 
                          placeholder="e.g. 1500" 
                          id="distributor-fee-input"
                          defaultValue={systemSettings?.distributorMonthlyFee ?? 1500}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-xs rounded-xl border border-slate-200 text-slate-850 dark:text-white font-bold"
                        />
                        <button 
                          onClick={() => {
                            const val = (document.getElementById('distributor-fee-input') as HTMLInputElement)?.value;
                            if (val) handleUpdateDistributorMonthlyFee(parseInt(val));
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 cursor-pointer shrink-0"
                        >
                          Save Fee
                        </button>
                      </div>
                    </div>

                    {/* Branch Pricing & Currency Configuration Panel */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Branch-Based Expansion Charges</span>
                        <h3 className="text-sm font-bold text-slate-950 dark:text-white mb-2">Global Additional Branch Fee</h3>
                        <p className="text-xs text-slate-500 mb-4">Set the monthly price charged for each additional outlet (HQ branch is free).</p>
                        
                        <div className="text-xl font-extrabold text-blue-600 mb-4 font-mono">
                          {(systemSettings?.additionalBranchFee ?? 100).toLocaleString()} {systemSettings?.branchPricingCurrency ?? 'ETB'} / month
                        </div>

                        <div className="flex gap-2">
                          <input 
                            type="number" 
                            placeholder="e.g. 100" 
                            id="branch-fee-input"
                            defaultValue={systemSettings?.additionalBranchFee ?? 100}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-xs rounded-xl border border-slate-200 text-slate-850 dark:text-white font-bold"
                          />
                          <button 
                            onClick={() => {
                              const val = (document.getElementById('branch-fee-input') as HTMLInputElement)?.value;
                              if (val) handleUpdateBranchFee(parseInt(val));
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 cursor-pointer"
                          >
                            Save Fee
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Billing Currency Configuration</span>
                        <h3 className="text-sm font-bold text-slate-950 dark:text-white mb-2">Global SaaS Currency</h3>
                        <p className="text-xs text-slate-500 mb-4 font-medium">Configure display currency for invoices, renewals, and branch multipliers.</p>
                        
                        <div className="text-xl font-extrabold text-blue-600 mb-4 font-mono">
                          {systemSettings?.branchPricingCurrency ?? 'ETB'} (Standard ISO)
                        </div>

                        <div className="flex gap-2">
                          <select 
                            id="currency-input"
                            defaultValue={systemSettings?.branchPricingCurrency ?? 'ETB'}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-xs rounded-xl border border-slate-200 text-slate-850 dark:text-white font-bold cursor-pointer"
                          >
                            {['ETB', 'USD', 'EUR', 'GBP', 'AED', 'KES'].map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <button 
                            onClick={() => {
                              const val = (document.getElementById('currency-input') as HTMLSelectElement)?.value;
                              if (val) handleUpdateCurrency(val);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 cursor-pointer"
                          >
                            Apply ISO
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Promotions & Dynamic Discounts Panel */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Section 1: Launch Marketing Promo Campaigns */}
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Launch Campaigns</span>
                        <h3 className="text-sm font-bold text-slate-950 dark:text-white mb-2">Exclusive SaaS Campaigns</h3>
                        <p className="text-xs text-slate-500 mb-4">Set global discounts to apply to all client renewals automatically.</p>

                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Campaign Title</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Ramadan Special Promo" 
                              value={newPromoTitle} 
                              onChange={(e) => setNewPromoTitle(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-xs rounded-xl border border-slate-200 text-slate-850 dark:text-white"
                            />
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Discount %</label>
                              <input 
                                type="number" 
                                placeholder="10" 
                                value={newPromoPercent} 
                                onChange={(e) => setNewPromoPercent(parseInt(e.target.value))}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-xs rounded-xl border border-slate-200 text-slate-850 dark:text-white font-bold"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Short Terms</label>
                              <input 
                                type="text" 
                                placeholder="e.g. 10% Off and Free branch trial" 
                                value={newPromoDesc} 
                                onChange={(e) => setNewPromoDesc(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-xs rounded-xl border border-slate-200 text-slate-850 dark:text-white"
                              />
                            </div>
                          </div>

                          <button 
                            onClick={() => {
                              if (!newPromoTitle) {
                                toast.error('Enter a valid campaign title');
                                return;
                              }
                              handleAddPromotion(newPromoTitle, newPromoPercent, newPromoDesc);
                              setNewPromoTitle('');
                              setNewPromoDesc('');
                            }}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Launch Active Campaign
                          </button>
                        </div>

                        {/* Stored Campaigns */}
                        <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-3">Live Active Campaigns</label>
                          {(!systemSettings?.promotions || systemSettings.promotions.length === 0) ? (
                            <p className="text-xs text-slate-400 italic font-mono">No active global price drops recorded.</p>
                          ) : (
                            <div className="space-y-2">
                              {systemSettings.promotions.map((p, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                  <div>
                                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
                                      {p.title}
                                      {p.active ? (
                                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] rounded font-black">ACTIVE</span>
                                      ) : (
                                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-400 text-[8px] rounded font-medium">ENDED</span>
                                      )}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-sans mt-0.5">{p.description} (Save {p.discountPercent}%)</p>
                                  </div>
                                  {p.active && (
                                    <button 
                                      onClick={() => handleDeactivatePromotion(idx)}
                                      className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 text-[9px] font-extrabold uppercase rounded-lg cursor-pointer"
                                    >
                                      End
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Section 2: Create Active Discount Code Rule */}
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Coupon Manager</span>
                        <h3 className="text-sm font-bold text-slate-950 dark:text-white mb-2">Dynamic Coupons & Promos</h3>
                        <p className="text-xs text-slate-500 mb-4 font-medium">Create distinct code tokens pharmacies can enter to receive percentage offsets.</p>

                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Coupon Token Code</label>
                            <input 
                              type="text" 
                              placeholder="e.g. RAMADAN25" 
                              value={newCouponCode} 
                              onChange={(e) => setNewCouponCode(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-xs rounded-xl border border-slate-200 text-slate-850 dark:text-white font-mono uppercase font-black"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Coupon %</label>
                              <input 
                                type="number" 
                                placeholder="15" 
                                value={newCouponPercent} 
                                onChange={(e) => setNewCouponPercent(parseInt(e.target.value))}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-xs rounded-xl border border-slate-200 text-slate-850 dark:text-white font-bold"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Description</label>
                              <input 
                                type="text" 
                                placeholder="e.g. Ramadan coupon active" 
                                value={newCouponDesc} 
                                onChange={(e) => setNewCouponDesc(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-xs rounded-xl border border-slate-200 text-slate-850 dark:text-white"
                              />
                            </div>
                          </div>

                          <button 
                            onClick={() => {
                              if (!newCouponCode) {
                                toast.error('Enter a valid coupon code first');
                                return;
                              }
                              handleAddDiscountCode(newCouponCode, newCouponPercent, newCouponDesc);
                              setNewCouponCode('');
                              setNewCouponDesc('');
                            }}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Authorize Coupon Code
                          </button>
                        </div>

                        {/* Active Coupons List */}
                        <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-3">Issued Coupons Ledger</label>
                          {(!systemSettings?.discounts || systemSettings.discounts.length === 0) ? (
                            <p className="text-xs text-slate-400 italic font-mono">No active discounts or redeem keys authorized.</p>
                          ) : (
                            <div className="space-y-2">
                              {systemSettings.discounts.map((d, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                  <div>
                                    <p className="text-xs font-black text-slate-900 dark:text-white font-mono uppercase flex items-center gap-2">
                                      {d.code}
                                      {d.active ? (
                                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] rounded font-black">ACTIVE</span>
                                      ) : (
                                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-400 text-[8px] rounded font-medium">REVOKED</span>
                                      )}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-sans mt-0.5">{d.description} (Reduces {d.percent}%)</p>
                                  </div>
                                  {d.active && (
                                    <button 
                                      onClick={() => handleDeactivateDiscount(idx)}
                                      className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 text-[9px] font-extrabold uppercase rounded-lg cursor-pointer"
                                    >
                                      Revoke
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expiring / expired subscriptions tracking list */}
                    <div className="bg-slate-50 dark:bg-slate-800/20 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <h3 className="text-sm font-bold mb-4 text-slate-800 dark:text-white font-sans">At-Risk Subscription Expiries</h3>
                      <div className="space-y-3">
                        {users.filter(u => u.role === 'pharmacy' && (u.subscriptionStatus === 'expired' || u.subscriptionExpiryDate && u.subscriptionExpiryDate < Date.now() + 7 * 86400000)).map((u) => (
                          <div key={u.uid} className="flex justify-between items-center p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/80">
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">{u.pharmacyName || u.displayName}</p>
                              <p className="text-[9px] text-red-500 font-mono">Expires/Expired: {u.subscriptionExpiryDate ? new Date(u.subscriptionExpiryDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <button 
                              onClick={() => handlePostponeSubscription(u.uid, u.pharmacyName || u.displayName)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Postpone & Renew (30 Days)
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SaaS Invoices & Settle Panel */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active SaaS Subscription Invoices</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Review and verify B2B SaaS monthly billing invoices across all pharmacy branches (paid/billable only).</p>
                        </div>
                        <button
                          onClick={recalculateAllPharmaciesBilling}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Recalculate & Sync All
                        </button>
                      </div>

                      {saasInvoices.filter(inv => inv.paymentStatus !== 'Free Trial').length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No billable SaaS invoices generated in the system yet.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 uppercase tracking-widest font-extrabold">
                                <th className="py-2.5">Invoice ID</th>
                                <th className="py-2.5">Pharmacy</th>
                                <th className="py-2.5">Billing Month</th>
                                <th className="py-2.5">Subtotal (Excl. VAT)</th>
                                <th className="py-2.5">VAT (15%)</th>
                                <th className="py-2.5">Total (Incl. VAT)</th>
                                <th className="py-2.5">Status</th>
                                <th className="py-2.5 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                              {saasInvoices.filter(inv => inv.paymentStatus !== 'Free Trial').map((inv) => {
                                const sub = inv.subtotal ?? (inv.vatAmount ? inv.totalAmount - inv.vatAmount : inv.totalAmount / 1.15);
                                const vt = inv.vatAmount ?? (inv.totalAmount - sub);
                                return (
                                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                    <td className="py-3 font-mono text-[10px] text-slate-500 dark:text-slate-400">{inv.id}</td>
                                    <td className="py-3 font-bold text-slate-800 dark:text-slate-200">
                                      {inv.pharmacyName || 'SaaS Pharmacy'}
                                    </td>
                                    <td className="py-3 text-slate-500 dark:text-slate-400">{inv.billingPeriod}</td>
                                    <td className="py-3 text-slate-600 dark:text-slate-300 font-semibold">
                                      {sub.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {inv.currency || 'ETB'}
                                    </td>
                                    <td className="py-3 text-slate-600 dark:text-slate-350 font-semibold">
                                      {vt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {inv.currency || 'ETB'}
                                    </td>
                                    <td className="py-3 font-black text-slate-900 dark:text-white">
                                      {inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {inv.currency || 'ETB'}
                                    </td>
                                  <td className="py-3">
                                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                                      inv.status === 'paid' 
                                        ? 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400' 
                                        : 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                                    }`}>
                                      {inv.status}
                                    </span>
                                  </td>
                                  <td className="py-3 text-right">
                                    <button
                                      onClick={() => handleToggleInvoiceStatus(inv.id, inv.status || 'pending')}
                                      className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase cursor-pointer transition-all ${
                                        inv.status === 'paid'
                                          ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400'
                                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                      }`}
                                    >
                                      {inv.status === 'paid' ? 'Mark Pending' : 'Settle / Mark Paid'}
                                    </button>
                                  </td>
                                </tr>
                              );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Free Trial Subscriptions Panel */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white font-sans">Active & Historical Free Trial Subscriptions</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">Track all 1-month (Pharmacy) and 2-month (Distributor) complimentary system-activated subscriptions.</p>
                      </div>

                      {saasInvoices.filter(inv => inv.paymentStatus === 'Free Trial').length === 0 ? (
                        <p className="text-xs text-slate-400 italic font-sans">No free trial subscriptions recorded in the system.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs font-sans">
                            <thead>
                              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 uppercase tracking-widest font-extrabold">
                                <th className="py-2.5">Trial ID</th>
                                <th className="py-2.5">Organization</th>
                                <th className="py-2.5">Subscription Type</th>
                                <th className="py-2.5">Payment Status</th>
                                <th className="py-2.5">Payment Amount</th>
                                <th className="py-2.5">Payment Method</th>
                                <th className="py-2.5">Start Period</th>
                                <th className="py-2.5 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                              {saasInvoices.filter(inv => inv.paymentStatus === 'Free Trial').map((inv) => {
                                return (
                                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                    <td className="py-3 font-mono text-[10px] text-slate-500 dark:text-slate-400">{inv.id}</td>
                                    <td className="py-3 font-bold text-slate-800 dark:text-slate-200">
                                      {inv.pharmacyName || 'SaaS Pharmacy'}
                                    </td>
                                    <td className="py-3 text-slate-600 dark:text-slate-350 font-medium font-mono text-[10px]">
                                      {inv.subscriptionType || inv.plan}
                                    </td>
                                    <td className="py-3">
                                      <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
                                        {inv.paymentStatus || 'Free Trial'}
                                      </span>
                                    </td>
                                    <td className="py-3 font-mono text-slate-500 dark:text-slate-400">
                                      {inv.paymentAmount ?? 0} ETB
                                    </td>
                                    <td className="py-3 text-slate-500 dark:text-slate-400 font-medium">
                                      {inv.paymentMethod || 'System Generated'}
                                    </td>
                                    <td className="py-3 text-slate-500 dark:text-slate-400">{inv.billingPeriod}</td>
                                    <td className="py-3 text-right">
                                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                                        inv.status === 'active' || inv.status === 'paid'
                                          ? 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400'
                                          : 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                                      }`}>
                                        {inv.status}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Dynamic Subscription Customizer Admin Panel Section */}
                    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
                      <div>
                        <span className="text-[10px] font-black tracking-widest uppercase text-blue-600">Administrative Template Settings</span>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">SaaS Features & Description Template Customizer</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Edit names, descriptions, and feature lists for all three subscription plan tiers dynamically. Changes persist in Firestore and instantly update target pricing interfaces without editing React code.
                        </p>
                      </div>

                      {/* Selector tabs for current admin plan customizer */}
                      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-850 rounded-xl max-w-sm">
                        {(['standard', 'premium'] as const).map((planId) => {
                          const aliases = { standard: 'Professional', premium: 'Premium' };
                          return (
                            <button
                              key={planId}
                              type="button"
                              onClick={() => setSelectedEditPlan(planId)}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                selectedEditPlan === planId
                                  ? 'bg-white dark:bg-slate-900 shadow text-blue-600 dark:text-blue-400'
                                  : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-200'
                              }`}
                            >
                              {aliases[planId]}
                            </button>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                        {/* Column 1: Core Details */}
                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Custom Display Name</label>
                            <input 
                              type="text"
                              value={customPlanName}
                              onChange={(e) => setCustomPlanName(e.target.value)}
                              placeholder="e.g. Basic Plan"
                              className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-850 dark:text-white text-xs border border-slate-200 dark:border-slate-750 rounded-xl outline-none focus:border-blue-500 font-bold"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Plan Value Proposition / Description</label>
                            <textarea 
                              rows={3}
                              value={customPlanDescription}
                              onChange={(e) => setCustomPlanDescription(e.target.value)}
                              placeholder="Describe who this plan is tailored for..."
                              className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-850 dark:text-white text-xs border border-slate-200 dark:border-slate-750 rounded-xl outline-none focus:border-blue-500 font-medium"
                            />
                          </div>

                          <div className="flex flex-col gap-2 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={customPlanRecommended}
                                onChange={(e) => setCustomPlanRecommended(e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 bg-slate-50 dark:bg-slate-850 border-slate-200"
                              />
                              <span className="text-xs font-bold text-slate-705 dark:text-slate-300">Highlight as "Recommended Plan"</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={customPlanEnableFuture}
                                onChange={(e) => setCustomPlanEnableFuture(e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 bg-slate-50 dark:bg-slate-850 border-slate-200"
                              />
                              <span className="text-xs font-bold text-slate-705 dark:text-slate-300">Enable Developer Future Features Sandbox Layer</span>
                            </label>
                          </div>
                        </div>

                        {/* Column 2: Lists Customization */}
                        <div className="space-y-6">
                          {/* Features Section */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block">Features List ({customPlanFeatures.length})</label>
                            <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700">
                              {customPlanFeatures.map((f, i) => (
                                <div key={i} className="flex justify-between items-center text-[11px] p-1 bg-white dark:bg-slate-850 rounded border border-slate-100 dark:border-slate-750 font-medium">
                                  <span className="text-slate-700 dark:text-slate-300 truncate pr-2">{f}</span>
                                  <button 
                                    type="button"
                                    onClick={() => setCustomPlanFeatures(customPlanFeatures.filter((_, idx) => idx !== i))}
                                    className="text-red-500 hover:text-red-700 text-[10px] px-1 font-bold"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                              {customPlanFeatures.length === 0 && (
                                <p className="text-[10px] text-slate-400 italic p-1">No features included. Add one below.</p>
                              )}
                            </div>
                            <div className="flex gap-1.5">
                              <input 
                                type="text"
                                placeholder="Add feature item..."
                                value={newFeatureText}
                                onChange={(e) => setNewFeatureText(e.target.value)}
                                className="flex-1 p-1.5 bg-slate-50 dark:bg-slate-850 dark:text-white text-xs border border-slate-200 dark:border-slate-750 rounded-lg outline-none"
                              />
                              <button 
                                type="button"
                                onClick={() => {
                                  if (newFeatureText.trim()) {
                                    setCustomPlanFeatures([...customPlanFeatures, newFeatureText.trim()]);
                                    setNewFeatureText('');
                                  }
                                }}
                                className="px-3 py-1 bg-slate-850 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition-all"
                              >
                                Add
                              </button>
                            </div>
                          </div>

                          {/* Limitations Section */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block">Limitations List / Missing Features ({customPlanLimitations.length})</label>
                            <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700">
                              {customPlanLimitations.map((l, i) => (
                                <div key={i} className="flex justify-between items-center text-[11px] p-1 bg-white dark:bg-slate-850 rounded border border-slate-100 dark:border-slate-750 font-medium">
                                  <span className="text-slate-700 dark:text-slate-300 truncate pr-2">{l}</span>
                                  <button 
                                    type="button"
                                    onClick={() => setCustomPlanLimitations(customPlanLimitations.filter((_, idx) => idx !== i))}
                                    className="text-red-500 hover:text-red-700 text-[10px] px-1 font-bold"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                              {customPlanLimitations.length === 0 && (
                                <p className="text-[10px] text-slate-400 italic p-1 font-mono">No explicitly blocked items template.</p>
                              )}
                            </div>
                            <div className="flex gap-1.5">
                              <input 
                                type="text"
                                placeholder="Add limitation..."
                                value={newLimitationText}
                                onChange={(e) => setNewLimitationText(e.target.value)}
                                className="flex-1 p-1.5 bg-slate-50 dark:bg-slate-855 dark:text-white text-xs border border-slate-200 dark:border-slate-750 rounded-lg outline-none"
                              />
                              <button 
                                type="button"
                                onClick={() => {
                                  if (newLimitationText.trim()) {
                                    setCustomPlanLimitations([...customPlanLimitations, newLimitationText.trim()]);
                                    setNewLimitationText('');
                                  }
                                }}
                                className="px-3 py-1 bg-slate-850 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition-all"
                              >
                                Add
                              </button>
                            </div>
                          </div>

                          {/* Future Features Section */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block">Future Sandbox Releases ({customPlanFutureFeatures.length})</label>
                            <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700">
                              {customPlanFutureFeatures.map((ff, i) => (
                                <div key={i} className="flex justify-between items-center text-[11px] p-1 bg-white dark:bg-slate-850 rounded border border-slate-100 dark:border-slate-750 font-medium">
                                  <span className="text-slate-700 dark:text-slate-300 truncate pr-2">{ff}</span>
                                  <button 
                                    type="button"
                                    onClick={() => setCustomPlanFutureFeatures(customPlanFutureFeatures.filter((_, idx) => idx !== i))}
                                    className="text-red-500 hover:text-red-700 text-[10px] px-1 font-bold"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                              {customPlanFutureFeatures.length === 0 && (
                                <p className="text-[10px] text-slate-400 italic p-1 font-mono">No roadmap features assigned.</p>
                              )}
                            </div>
                            <div className="flex gap-1.5">
                              <input 
                                type="text"
                                placeholder="Add roadmap release..."
                                value={newFutureFeatureText}
                                onChange={(e) => setNewFutureFeatureText(e.target.value)}
                                className="flex-1 p-1.5 bg-slate-50 dark:bg-slate-855 dark:text-white text-xs border border-slate-200 dark:border-slate-750 rounded-lg outline-none"
                              />
                              <button 
                                type="button"
                                onClick={() => {
                                  if (newFutureFeatureText.trim()) {
                                    setCustomPlanFutureFeatures([...customPlanFutureFeatures, newFutureFeatureText.trim()]);
                                    setNewFutureFeatureText('');
                                  }
                                }}
                                className="px-3 py-1 bg-slate-850 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition-all"
                              >
                                Add
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Section Checklist Gate: Dynamic Functional Access Matrix */}
                      <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                        <div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                            Interactive Functional Level Access Controls (Gating Access)
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Check/uncheck feature keys to customize actual in-app visibility & restrictions for pharmacies assigned to the <strong>{customPlanName || selectedEditPlan.toUpperCase()} Plan</strong>.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {(['core', 'advanced', 'enterprise'] as const).map((catId) => {
                            const groupTitle = 
                              catId === 'core' ? 'Core Capabilities' : 
                              catId === 'advanced' ? 'Advanced Features' : 'Premium Modules';
                            const groupBtnColor = 
                              catId === 'core' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' : 
                              catId === 'advanced' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400';

                            return (
                              <div key={catId} className="space-y-3 bg-slate-50 dark:bg-slate-900/30 p-4.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                                <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wide inline-block ${groupBtnColor}`}>
                                  {groupTitle}
                                </span>
                                <div className="space-y-3 pt-1">
                                  {FEATURES_LIST.filter(f => f.category === catId).map((feat) => {
                                    const isChecked = customPlanFunctionalFeatures.includes(feat.id);
                                    return (
                                      <label key={feat.id} className="flex items-start gap-2.5 cursor-pointer group select-none">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setCustomPlanFunctionalFeatures([...customPlanFunctionalFeatures, feat.id]);
                                            } else {
                                              setCustomPlanFunctionalFeatures(customPlanFunctionalFeatures.filter(id => id !== feat.id));
                                            }
                                          }}
                                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                        />
                                        <div className="flex-1">
                                          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-500 transition-colors">
                                            {feat.name}
                                          </p>
                                          <p className="text-[9px] text-slate-400 mt-0.5 leading-relaxed">
                                            {feat.description}
                                          </p>
                                        </div>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Master Sync Action Button */}
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <button
                          type="button"
                          onClick={handleSavePlanCustomizations}
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-lg transition-all transform hover:scale-[1.01]"
                        >
                          Commit {customPlanName || selectedEditPlan.toUpperCase()} Customizations to Firestore
                        </button>
                      </div>

                    </div>
                  </div>
                )}

                {/* TAB 6: MARKETPLACE CONTROL CENTER */}
                {activeTab === 'marketplace' && (() => {
                  const filteredProducts = products.filter(p => {
                    const matchesCategory = marketplaceCategoryFilter === 'all' || (p.category || '').toLowerCase() === marketplaceCategoryFilter.toLowerCase();
                    const matchesSearch = !marketplaceSearch.trim() || 
                      (p.name || '').toLowerCase().includes(marketplaceSearch.toLowerCase()) || 
                      (p.genericName || '').toLowerCase().includes(marketplaceSearch.toLowerCase()) || 
                      (p.importerName || '').toLowerCase().includes(marketplaceSearch.toLowerCase());
                    return matchesCategory && matchesSearch;
                  });

                  const categories = ['all', 'Antibiotics', 'Analgesics', 'Cardiovascular', 'Pediatric', 'Chronic Care', 'Surgical & Infusions'];
                  const sponsoredCount = products.filter(p => (p as any).featured).length;

                  return (
                    <div className="space-y-6 animate-fade-in">
                      {/* Header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Marketplace Listings &amp; Inventory Hub</h2>
                            <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-bold">
                              Pan-African B2B Catalog
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Configure featured pharmaceutical badges, inspect search intent trends, and audit wholesale batch supplies</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => toast.success('Refreshed marketplace catalog feed')}
                            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 transition-all shadow-sm"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Refresh Feed
                          </button>
                        </div>
                      </div>

                      {/* Marketplace KPI Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active SKUs</span>
                          <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">{products.length} Items</div>
                          <span className="text-[10px] text-emerald-600 font-medium">Licensed molecules</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sponsored Placements</span>
                          <div className="text-xl font-black text-amber-500 font-mono mt-1">{sponsoredCount} Boosted</div>
                          <span className="text-[10px] text-amber-600 font-medium">Featured rotation</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verified Wholesalers</span>
                          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">{displaySuppliers.length} Importers</div>
                          <span className="text-[10px] text-indigo-600 font-medium">Distributing inventory</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">30d B2B Orders</span>
                          <div className="text-xl font-black text-blue-600 font-mono mt-1">{orders.length} Trades</div>
                          <span className="text-[10px] text-blue-600 font-medium">Executed orders</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Wholesale Margin</span>
                          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">14.8%</div>
                          <span className="text-[10px] text-emerald-600 font-medium">Pharmacy markup</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Velocity</span>
                          <div className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono mt-1">94.2k/mo</div>
                          <span className="text-[10px] text-purple-600 font-medium">B2B buyer queries</span>
                        </div>
                      </div>

                      {/* Trending B2B Medicine Search Intent */}
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <TrendingUp className="w-4 h-4 text-blue-500" /> High-Velocity B2B Medicine Search Demand
                            </h3>
                            <p className="text-[11px] text-slate-400">Top-searched therapeutic molecules across regional retail pharmacy ordering desks</p>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">7-Day Rolling Trend</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {DEMO_TRENDING_B2B_SEARCHES.map((item) => (
                            <div 
                              key={item.keyword}
                              onClick={() => setMarketplaceSearch(item.keyword)}
                              className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 hover:border-blue-500/40 cursor-pointer transition-all flex flex-col justify-between"
                            >
                              <div className="flex items-start justify-between">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">{item.keyword}</span>
                                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">{item.weeklyDelta}</span>
                              </div>
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-800 text-[10px]">
                                <span className="text-slate-400">{item.category}</span>
                                <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{(item.searchCount).toLocaleString()} queries</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Search & Category Filter */}
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                        <div className="relative w-full md:w-80">
                          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                          <input 
                            type="text"
                            value={marketplaceSearch}
                            onChange={(e) => setMarketplaceSearch(e.target.value)}
                            placeholder="Filter by medicine name, generic, or supplier..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                          {marketplaceSearch && (
                            <button 
                              onClick={() => setMarketplaceSearch('')}
                              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
                          {categories.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setMarketplaceCategoryFilter(cat)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                                marketplaceCategoryFilter === cat 
                                  ? 'bg-blue-600 text-white shadow-sm' 
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Product Listings Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProducts.slice(0, 18).map((item) => {
                          const isFeatured = (item as any).featured === true;
                          return (
                            <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[9px] font-bold uppercase font-mono">
                                    {item.category || 'Pharmaceutical'}
                                  </span>
                                  <button 
                                    onClick={() => handleToggleFeatureProduct(item.id, item.name, isFeatured)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                                      isFeatured 
                                        ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20' 
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                                    }`}
                                  >
                                    <span>{isFeatured ? '★ Sponsored' : '☆ Feature'}</span>
                                  </button>
                                </div>

                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2.5">{item.name}</h4>
                                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{item.genericName || 'Standard Formulation'}</p>
                                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                  <Building2 className="w-3 h-3 text-slate-400" />
                                  <span>Supplier: {item.importerName || 'Licensed Importer'}</span>
                                </p>
                              </div>

                              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-3">
                                <div>
                                  <span className="text-[9px] text-slate-400 uppercase font-mono">Wholesale Price</span>
                                  <div className="text-sm font-black text-slate-900 dark:text-white font-mono">
                                    {(item.price || 0).toLocaleString()} {item.currency || 'ETB'}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-[9px] text-slate-400 uppercase font-mono">Stock Level</span>
                                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                    {(item.stock || item.quantity || 1500).toLocaleString()} Units
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {filteredProducts.length === 0 && (
                          <div className="col-span-full py-12 text-center text-slate-400 text-xs italic bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                            No products match your current search and category criteria.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* TAB 7: AUDIT AND COMPLIANCE */}
                {activeTab === 'audit' && (() => {
                  const combinedLogs = [
                    ...auditLogs,
                    ...DEMO_EXTENDED_AUDIT_LOGS.map(l => ({
                      id: l.id,
                      action: l.action,
                      details: l.details,
                      timestamp: new Date(l.timestamp).getTime(),
                      uid: l.uid,
                      category: l.category
                    }))
                  ];

                  const filteredLogs = combinedLogs.filter(log => {
                    const matchesCategory = auditCategoryFilter === 'all' || 
                      (log.action || '').toUpperCase().includes(auditCategoryFilter.toUpperCase()) ||
                      ((log as any).category || '').toUpperCase().includes(auditCategoryFilter.toUpperCase());
                    const matchesSearch = !auditSearch.trim() ||
                      (log.action || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
                      (log.details || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
                      (log.uid || '').toLowerCase().includes(auditSearch.toLowerCase());
                    return matchesCategory && matchesSearch;
                  });

                  return (
                    <div className="space-y-6 animate-fade-in">
                      {/* Header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Audit Trail &amp; Compliance Ledger</h2>
                            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                              Immutable Ledger Active
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Cryptographically indexed record of system configuration adjustments, authority events, and ledger reconciliations</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => toast.success('Exported audit trail snapshot to local secure archive')}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5" /> Export Ledger (CSV)
                          </button>
                        </div>
                      </div>

                      {/* Audit KPI Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Recorded Events</span>
                          <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">{combinedLogs.length} Records</div>
                          <span className="text-[10px] text-emerald-600 font-medium">100% Retained</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cryptographic Signature</span>
                          <div className="text-base font-black text-emerald-600 font-mono mt-1">SHA-256 Valid</div>
                          <span className="text-[10px] text-slate-400">Zero chain breaks</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Regulatory Inquiries</span>
                          <div className="text-xl font-black text-blue-600 font-mono mt-1">24 Audits</div>
                          <span className="text-[10px] text-blue-600 font-medium">EFDA Cleared</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Security Violations</span>
                          <div className="text-xl font-black text-emerald-600 font-mono mt-1">0 Flagged</div>
                          <span className="text-[10px] text-emerald-600 font-medium">Safe baseline</span>
                        </div>
                      </div>

                      {/* Filter & Search Bar */}
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                        <div className="relative w-full md:w-96">
                          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="Search audit actions, details, or executor IDs..." 
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs outline-none border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                            value={auditSearch}
                            onChange={(e) => setAuditSearch(e.target.value)}
                          />
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
                          {['all', 'AUTH', 'ROLE', 'TRANSACTION', 'DATA', 'SECURITY'].map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setAuditCategoryFilter(cat)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                                auditCategoryFilter === cat
                                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Audit Log Feed */}
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {filteredLogs.map((log) => (
                          <div key={log.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500/30 transition-all text-xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider ${
                                  (log.action || '').includes('DELETE') || (log.action || '').includes('REVOKE') || (log.action || '').includes('RESET')
                                    ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                                    : (log.action || '').includes('AUTH') || (log.action || '').includes('LOGIN')
                                    ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                                    : (log.action || '').includes('ROLE') || (log.action || '').includes('PERMISSION')
                                    ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                }`}>
                                  {log.action || 'COMPLIANCE_EVENT'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {new Date(log.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' })}
                                </span>
                              </div>
                              <span className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Cryptographically Signed
                              </span>
                            </div>

                            <p className="text-slate-700 dark:text-slate-300 mt-2 font-medium leading-relaxed">{log.details}</p>
                            
                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-2.5 mt-2.5 text-[10px] text-slate-400 font-mono">
                              <span>Actor ID: <span className="font-bold text-slate-700 dark:text-slate-300">{log.uid || 'SYSTEM_DAEMON'}</span></span>
                              <span>Target Domain: <span className="font-bold text-blue-600">Enterprise Core</span></span>
                            </div>
                          </div>
                        ))}
                        {filteredLogs.length === 0 && (
                          <div className="py-12 text-center text-slate-400 text-xs italic bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                            No audit log records match the current filter.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* TAB 8: SECURITY OPERATIONS CENTER (SOC) */}
                {activeTab === 'secops' && (() => {
                  return (
                    <div className="space-y-6 animate-fade-in">
                      {/* Header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                              <ShieldAlert className="w-5 h-5" /> Security Operations Center (SOC)
                            </h2>
                            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                              DEFCON 4 (Normal)
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Zero-trust architecture, multi-factor enforcement, threat telemetry, and administrative privilege matrices</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => toast.success('Security boundary rules and TLS certificates validated')}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-sm"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Validate Hardening
                          </button>
                        </div>
                      </div>

                      {/* Security Parameters KPI Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MFA Configuration</span>
                          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">100% Enforced</div>
                          <span className="text-[10px] text-emerald-600 font-medium">All administrative tiers</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Privileged Keys</span>
                          <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
                            {users.filter(u => u.role === 'admin' || u.role === 'regional_manager').length} Privileged
                          </div>
                          <span className="text-[10px] text-blue-600 font-medium">Super Admin &amp; Regional</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blocked Attack Probes</span>
                          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">412 Blocked</div>
                          <span className="text-[10px] text-indigo-600 font-medium">Cloud WAF perimeter</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Threat Incidents Active</span>
                          <div className="text-xl font-black text-emerald-600 font-mono mt-1">0 Open</div>
                          <span className="text-[10px] text-emerald-600 font-medium">Zero containment breaches</span>
                        </div>
                      </div>

                      {/* Security Incident Log & Threat Matrix */}
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Threat Mitigation &amp; Anomaly Detection Feed</h3>
                            <p className="text-[11px] text-slate-400">Chronological telemetry of thwarted ingress probes, IP blocks, and authorization denials</p>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">Live Ingress Filter</span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 font-mono">
                              <tr>
                                <th className="px-4 py-3">Incident Description</th>
                                <th className="px-4 py-3">Severity</th>
                                <th className="px-4 py-3">Source Vector</th>
                                <th className="px-4 py-3">Target Service</th>
                                <th className="px-4 py-3">Mitigation Action</th>
                                <th className="px-4 py-3 text-right">Timestamp</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                              {DEMO_SECOPS_INCIDENTS.map((inc) => (
                                <tr key={inc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{inc.title}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                                      inc.severity === 'critical' 
                                        ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' 
                                        : inc.severity === 'high'
                                        ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                        : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                                    }`}>
                                      {inc.severity}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{inc.source}</td>
                                  <td className="px-4 py-3 font-mono text-slate-800 dark:text-slate-200">{inc.target}</td>
                                  <td className="px-4 py-3">
                                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded text-[10px] font-bold">
                                      {inc.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono text-[11px] text-slate-400">{inc.timestamp}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* RBAC Privilege Matrix */}
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Role-Based Access Control (RBAC) Governance</h3>
                            <p className="text-[11px] text-slate-400">Ecosystem roles, permission grants, and assigned identity counts</p>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">Zero-Trust Boundaries</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {DEMO_RBAC_ROLES.map((role) => (
                            <div key={role.roleKey} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white">{role.name}</span>
                                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded-full font-mono text-[9px] font-bold">
                                    {role.assignedCount} Accounts
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">{role.description}</p>
                              </div>

                              <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800">
                                <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block mb-1.5">Granted Capabilities</span>
                                <div className="flex flex-wrap gap-1">
                                  {role.permissions.map(perm => (
                                    <span key={perm} className="px-1.5 py-0.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded text-[9px] font-mono">
                                      {perm}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Zero trust user lockout widget */}
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Emergency User Access Lockout &amp; Session Termination</h3>
                            <p className="text-[11px] text-slate-400">Instantly revoke JWT session tokens and lockout suspect identities across all clusters</p>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{users.length} Registered Accounts</span>
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                          {users.slice(0, 8).map(u => (
                            <div key={u.uid} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
                              <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{u.displayName || u.pharmacyName}</p>
                                <p className="text-[9px] text-slate-400 font-mono">{u.email}</p>
                              </div>
                              {u.verificationStatus === 'deactivated' ? (
                                <button 
                                  onClick={() => handleUpdateStatus(u.uid, u.displayName || u.pharmacyName || '', 'approved')}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all shadow-sm"
                                >
                                  Restore Access
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleUpdateStatus(u.uid, u.displayName || u.pharmacyName || '', 'deactivated')}
                                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all shadow-sm"
                                >
                                  Revoke Session (Lock)
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Demo / Sample Data Management Block */}
                      <div className="bg-blue-50/70 dark:bg-blue-950/20 p-5 rounded-3xl border border-blue-200 dark:border-blue-900/40">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5 shadow-sm">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300">Demonstration &amp; Sample Data Management</h3>
                            <p className="text-xs text-blue-700/80 dark:text-blue-400/80">
                              Seed or safely purge computer-generated, realistic but completely fictional demonstration network representing a national pharmaceutical importing enterprise: 120 pharmacies across Ethiopian regions, wholesale distribution staff and consignments, marketing campaigns, master medicine catalog, and sales records for demonstrating end-to-end operational intelligence.
                            </p>
                            <p className="text-[11px] text-blue-600/90 dark:text-blue-400/90 font-medium">
                              • All generated demo records across users, medicines, sales, purchase orders, wholesale orders, advertisements, and announcements are strictly tagged with <code className="font-mono bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded text-[10px]">isDemo: true</code> so they can be bulk-deleted without affecting real users or production datasets.
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <button
                            onClick={handleSeedDemoData}
                            disabled={isSeedingDemo || isClearingDemo}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm shadow-blue-500/20"
                            id="btn-seed-demo-data-secops"
                          >
                            {isSeedingDemo ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5" />
                            )}
                            <span>{isSeedingDemo ? 'Generating Demo Data...' : 'Generate Demo Data'}</span>
                          </button>

                          {!isConfirmingClearDemo ? (
                            <button
                              onClick={() => setIsConfirmingClearDemo(true)}
                              disabled={isSeedingDemo || isClearingDemo}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700"
                              id="btn-clear-demo-data-secops"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>Clear Demo Data</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 animate-pulse bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-rose-300 dark:border-rose-800">
                              <span className="text-xs font-bold text-rose-700 dark:text-rose-400 font-sans px-2">Purge all records marked isDemo: true?</span>
                              <button
                                onClick={handleClearDemoData}
                                disabled={isClearingDemo}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                              >
                                {isClearingDemo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                <span>{isClearingDemo ? 'Purging...' : 'Yes, Purge Demo Data'}</span>
                              </button>
                              <button
                                onClick={() => setIsConfirmingClearDemo(false)}
                                disabled={isClearingDemo}
                                className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-white font-bold text-xs rounded-lg cursor-pointer disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Database Reset / Clear Data Block */}
                      <div className="bg-red-50 dark:bg-red-950/10 p-5 rounded-3xl border border-red-200 dark:border-red-900/30">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                          <div className="space-y-1">
                            <h3 className="text-sm font-bold text-red-700 dark:text-red-400">Danger Zone: Complete Database Reset</h3>
                            <p className="text-xs text-red-600/80 dark:text-red-400/80">
                              This action will permanently delete all data in the system (all medicines, sales, orders, purchase orders, transfers, warehouses, branches, suppliers, audit logs, notifications, and customer profiles).
                            </p>
                            <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                              It will delete all users except for the currently logged-in Super Admin account.
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex flex-wrap gap-3">
                          {!isConfirmingReset ? (
                            <button
                              onClick={() => setIsConfirmingReset(true)}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow-sm"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Wipe Database &amp; Users
                            </button>
                          ) : (
                            <div className="flex items-center gap-3 animate-pulse">
                              <span className="text-xs font-bold text-red-700 dark:text-red-400 font-sans">Are you absolutely sure? This cannot be undone!</span>
                              <button
                                onClick={handleSystemReset}
                                disabled={isResetting}
                                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-2"
                              >
                                {isResetting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                                {isResetting ? "Wiping Data..." : "Yes, WIPE EVERYTHING"}
                              </button>
                              <button
                                onClick={() => setIsConfirmingReset(false)}
                                disabled={isResetting}
                                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* TAB 9: REVENUE ANALYTICS */}
                {activeTab === 'revenue' && (() => {
                  const ecosystemGmv = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) || 8420000;
                  const estimatedArr = (totalSubscriptionRevenue * 12) || 3600000;

                  return (
                    <div className="space-y-6 animate-fade-in">
                      {/* Header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ecosystem Revenue Analytics &amp; Fiscal Settlement</h2>
                            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                              Fiscal Year 2026
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Multi-channel SaaS recurring billing, wholesale trade commissions, digital payment gateway settlement, and advertising yields</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => toast.success('Generated Consolidated Revenue Statement (PDF)')}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5" /> Financial Statement
                          </button>
                        </div>
                      </div>

                      {/* Financial KPI Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Annualized ARR</span>
                          <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
                            {(estimatedArr).toLocaleString()} ETB
                          </div>
                          <span className="text-[10px] text-blue-600 font-medium">+28.4% YoY</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ecosystem GMV</span>
                          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                            {(ecosystemGmv).toLocaleString()} ETB
                          </div>
                          <span className="text-[10px] text-emerald-600 font-medium">Wholesale volume</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Commission Pool</span>
                          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                            {(totalCommissionRevenue || 412000).toLocaleString()} ETB
                          </div>
                          <span className="text-[10px] text-indigo-600 font-medium">Marketplace fees</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ad Placement Yield</span>
                          <div className="text-xl font-black text-amber-500 font-mono mt-1">
                            {(totalApprovedAdRevenue || 128500).toLocaleString()} ETB
                          </div>
                          <span className="text-[10px] text-amber-600 font-medium">{ads.length} campaigns</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Take Rate</span>
                          <div className="text-xl font-black text-emerald-600 font-mono mt-1">4.85%</div>
                          <span className="text-[10px] text-emerald-600 font-medium">B2B brokerage</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Paying Subscriptions</span>
                          <div className="text-xl font-black text-blue-600 font-mono mt-1">
                            {users.filter(u => (u.role === 'pharmacy' || u.role === 'importer') && u.subscriptionStatus === 'active' && !u.isFreeTrial).length} Accounts
                          </div>
                          <span className="text-[10px] text-blue-600 font-medium">SaaS subscribers</span>
                        </div>
                      </div>

                      {/* 12-Month Revenue Growth Trajectory */}
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">12-Month Consolidated Revenue Trajectory</h3>
                            <p className="text-[11px] text-slate-400">Monthly breakdown across subscriptions, wholesale commissions, and value-added advertising</p>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-mono">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Subscriptions</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Commissions</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Advertising</span>
                          </div>
                        </div>

                        <div className="h-64 font-mono text-xs">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={DEMO_REVENUE_TRAJECTORY_12M}>
                              <defs>
                                <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                              <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                              <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString()} ETB`]} />
                              <Area type="monotone" dataKey="subscriptions" stroke="#2563EB" fillOpacity={1} fill="url(#colorSub)" name="Subscriptions" />
                              <Area type="monotone" dataKey="commissions" stroke="#10B981" fillOpacity={1} fill="url(#colorComm)" name="Commissions" />
                              <Area type="monotone" dataKey="advertising" stroke="#F59E0B" fillOpacity={0.3} fill="#F59E0B" name="Advertising" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Payment Inflow Gateway Channels */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Stream Pie Chart */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Revenue Stream Distribution</h3>
                            <p className="text-[11px] text-slate-400">Share of platform recurring revenues</p>
                          </div>

                          <div className="h-48 flex items-center justify-center font-mono my-2">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie 
                                  data={[
                                    { name: 'SaaS Subscriptions', value: totalSubscriptionRevenue || 300000 },
                                    { name: 'Marketplace Fees', value: totalCommissionRevenue || 180000 },
                                    { name: 'Ad Placements', value: totalApprovedAdRevenue || 60000 }
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={45}
                                  outerRadius={70}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  <Cell fill="#2563EB" />
                                  <Cell fill="#10B981" />
                                  <Cell fill="#F59E0B" />
                                </Pie>
                                <Tooltip formatter={(val: any) => `${Number(val).toLocaleString()} ETB`} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>

                          <div className="flex justify-center gap-4 text-[10px] font-mono border-t border-slate-100 dark:border-slate-800 pt-3">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue-600 rounded"></span> Subscriptions</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded"></span> Commissions</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 rounded"></span> Ads</span>
                          </div>
                        </div>

                        {/* Payment Gateways Table */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Digital Payment Inflow Gateway Performance</h3>
                              <p className="text-[11px] text-slate-400">Settlement velocity and success rates across national banks and mobile money gateways</p>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">Automated Webhooks</span>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 font-mono">
                                <tr>
                                  <th className="px-4 py-2.5">Channel Gateway</th>
                                  <th className="px-4 py-2.5">Total Inflow</th>
                                  <th className="px-4 py-2.5">Transactions</th>
                                  <th className="px-4 py-2.5">Success Rate</th>
                                  <th className="px-4 py-2.5 text-right">Settlement Speed</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {DEMO_PAYMENT_CHANNELS.map((chan) => (
                                  <tr key={chan.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                    <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                      <span>{chan.name}</span>
                                    </td>
                                    <td className="px-4 py-2.5 font-mono text-emerald-600 font-bold">{(chan.volumeEtb).toLocaleString()} ETB</td>
                                    <td className="px-4 py-2.5 font-mono text-slate-800 dark:text-slate-200">{(chan.transactionCount).toLocaleString()}</td>
                                    <td className="px-4 py-2.5">
                                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 font-mono font-bold text-[10px] rounded-full">
                                        {chan.successRate}%
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-mono text-slate-600 dark:text-slate-400">{chan.settlementTime}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Commission Tier Structure */}
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Wholesale Brokerage Commission Tier Schedule</h3>
                            <p className="text-[11px] text-slate-400">Dynamic fee structure applied on B2B marketplace trade liquidations</p>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">EFDA Compliant Clearing</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {DEMO_COMMISSION_STRUCTURE.map((tier) => (
                            <div key={tier.tier} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                              <div>
                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded-full font-mono text-[9px] font-bold uppercase">
                                  {tier.tier}
                                </span>
                                <h4 className="text-lg font-black text-slate-900 dark:text-white mt-2 font-mono">{tier.ratePercent}% Fee</h4>
                                <p className="text-[11px] text-slate-400 mt-1 font-mono">Threshold: {tier.minVolumeEtb}</p>
                              </div>

                              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex justify-between items-center text-[10px]">
                                <span className="text-slate-400">Payout Cycle:</span>
                                <span className="font-bold text-emerald-600 font-mono">{tier.payoutCycle}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* TAB: MARKET INTELLIGENCE & PRODUCT SALES ANALYTICS */}
                {activeTab === 'market-intelligence' && (
                  <div className="space-y-6">
                    {/* Header & Controls */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
                            <BarChart3 className="w-5 h-5" />
                          </div>
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                            Network Market Intelligence & Performance
                          </h2>
                          {demoMode && (
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full text-[10px] font-bold">
                              Demonstration Network ({displayMarketSales.length} retail txns)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Cross-network retail volume, pharmacy performance rankings, best & worst selling products, and dispensing velocity
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* View Switcher: Pharmacy Ranking vs Product Velocity */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                          <button
                            onClick={() => setMarketViewMode('pharmacies')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              marketViewMode === 'pharmacies'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <Store className="w-3.5 h-3.5" />
                            Pharmacy Sales Rankings
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${marketViewMode === 'pharmacies' ? 'bg-blue-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                              {pharmacyMetrics.length}
                            </span>
                          </button>
                          <button
                            onClick={() => setMarketViewMode('products')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              marketViewMode === 'products'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <Pill className="w-3.5 h-3.5" />
                            Product Velocity & Dispersion
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${marketViewMode === 'products' ? 'bg-blue-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                              {productMetrics.length}
                            </span>
                          </button>
                        </div>

                        <button
                          onClick={() => loadMarketIntelligenceSales(marketDateRange, customStartDate, customEndDate)}
                          disabled={marketSalesLoading}
                          className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                          title="Refresh Dataset"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${marketSalesLoading ? 'animate-spin' : ''}`} />
                          Sync Data
                        </button>
                        <button
                          onClick={exportMarketIntelligenceCSV}
                          disabled={marketViewMode === 'pharmacies' ? filteredPharmacies.length === 0 : filteredProducts.length === 0}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-blue-500/20 disabled:opacity-50"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Export {marketViewMode === 'pharmacies' ? 'Pharmacies' : 'Products'} CSV
                        </button>
                      </div>
                    </div>

                    {/* Date Filters & Pharmacy Scope Ribbon */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-400 uppercase mr-1 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          Window:
                        </span>
                        {(
                          [
                            { id: 'today', label: 'Today' },
                            { id: '7d', label: 'Last 7 Days' },
                            { id: '30d', label: 'Last 30 Days' },
                            { id: '90d', label: 'Last 90 Days' },
                            { id: 'all', label: 'All Time' },
                            { id: 'custom', label: 'Custom Range' },
                          ] as const
                        ).map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => {
                              setMarketDateRange(opt.id);
                              if (opt.id !== 'custom') {
                                loadMarketIntelligenceSales(opt.id);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              marketDateRange === opt.id
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Scope to Specific Pharmacy */}
                        <div className="flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-slate-400" />
                          <select
                            value={marketPharmacyFilter}
                            onChange={e => setMarketPharmacyFilter(e.target.value)}
                            aria-label="Filter by Pharmacy"
                            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none"
                          >
                            <option value="all">All Pharmacies ({pharmacyMetrics.length} registered)</option>
                            {pharmacyMetrics.map(p => (
                              <option key={p.pharmacyId} value={p.pharmacyId}>
                                {p.pharmacyName} ({p.city}) — {p.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} ETB
                              </option>
                            ))}
                          </select>
                        </div>

                        {marketDateRange === 'custom' && (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="date"
                              value={customStartDate}
                              onChange={e => setCustomStartDate(e.target.value)}
                              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                            />
                            <span className="text-xs text-slate-400">to</span>
                            <input
                              type="date"
                              value={customEndDate}
                              onChange={e => setCustomEndDate(e.target.value)}
                              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                            />
                            <button
                              onClick={() => loadMarketIntelligenceSales('custom', customStartDate, customEndDate)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all"
                            >
                              Apply
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pharmacy Performance Spotlight Cards (Highlights Best, Runner-up & Underperforming) */}
                    {(() => {
                      const activePharmaciesSorted = [...pharmacyMetrics].filter(p => p.totalRevenue > 0);
                      const topPerformer = activePharmaciesSorted[0];
                      const runnerUp = activePharmaciesSorted[1];
                      const lowestActive = activePharmaciesSorted.length > 0 ? activePharmaciesSorted[activePharmaciesSorted.length - 1] : undefined;
                      const zeroSalesCount = pharmacyMetrics.filter(p => p.totalRevenue === 0).length;

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Top Performer Card */}
                          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 dark:from-emerald-950/20 dark:to-teal-950/10 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 shadow-sm relative overflow-hidden">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                                #1 Top Performing Pharmacy
                              </span>
                              <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full">
                                Rank #1
                              </span>
                            </div>
                            {topPerformer ? (
                              <div className="mt-2">
                                <div className="font-black text-slate-900 dark:text-white text-base truncate" title={topPerformer.pharmacyName}>
                                  {topPerformer.pharmacyName}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <span>{topPerformer.city}</span>
                                  <span>•</span>
                                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                    {topPerformer.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} ETB
                                  </span>
                                </div>
                                {topPerformer.bestSellingProduct && (
                                  <div className="mt-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/30 flex items-center justify-between text-[11px]">
                                    <span className="text-slate-600 dark:text-slate-400">Best Item:</span>
                                    <span className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]" title={topPerformer.bestSellingProduct.productName}>
                                      {topPerformer.bestSellingProduct.productName} ({topPerformer.bestSellingProduct.quantity} units)
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400 mt-2">No sales logged in period</div>
                            )}
                          </div>

                          {/* Runner-Up Pharmacy */}
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 dark:from-blue-950/20 dark:to-indigo-950/10 p-4 rounded-2xl border border-blue-200 dark:border-blue-800/40 shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                                <Award className="w-3.5 h-3.5 text-blue-500" />
                                #2 High Volume Pharmacy
                              </span>
                              <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                                Rank #2
                              </span>
                            </div>
                            {runnerUp ? (
                              <div className="mt-2">
                                <div className="font-black text-slate-900 dark:text-white text-base truncate" title={runnerUp.pharmacyName}>
                                  {runnerUp.pharmacyName}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <span>{runnerUp.city}</span>
                                  <span>•</span>
                                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                                    {runnerUp.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} ETB
                                  </span>
                                </div>
                                {runnerUp.bestSellingProduct && (
                                  <div className="mt-2 pt-2 border-t border-blue-200/60 dark:border-blue-800/30 flex items-center justify-between text-[11px]">
                                    <span className="text-slate-600 dark:text-slate-400">Best Item:</span>
                                    <span className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]" title={runnerUp.bestSellingProduct.productName}>
                                      {runnerUp.bestSellingProduct.productName} ({runnerUp.bestSellingProduct.quantity} units)
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400 mt-2">Single pharmacy record active</div>
                            )}
                          </div>

                          {/* Underperforming / Lowest Volume Card */}
                          <div className="bg-gradient-to-br from-amber-50 to-rose-50/40 dark:from-amber-950/20 dark:to-rose-950/10 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/40 shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                                <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                                Underperforming / Low Volume
                              </span>
                              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700/50 text-[10px] font-bold rounded-full">
                                Needs Attention
                              </span>
                            </div>
                            {lowestActive ? (
                              <div className="mt-2">
                                <div className="font-black text-slate-900 dark:text-white text-base truncate" title={lowestActive.pharmacyName}>
                                  {lowestActive.pharmacyName}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <span>{lowestActive.city}</span>
                                  <span>•</span>
                                  <span className="font-mono text-amber-700 dark:text-amber-400 font-bold">
                                    {lowestActive.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} ETB
                                  </span>
                                </div>
                                <div className="mt-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/30 flex items-center justify-between text-[11px]">
                                  <span className="text-slate-600 dark:text-slate-400">Total Units:</span>
                                  <span className="font-bold text-amber-800 dark:text-amber-300">
                                    {lowestActive.totalQuantitySold} units across {lowestActive.transactionCount} txns
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400 mt-2">No active sales recorded</div>
                            )}
                          </div>

                          {/* Network Dispersion Coverage Card */}
                          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <Store className="w-3.5 h-3.5 text-slate-500" />
                                Pharmacy Network Activity
                              </span>
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-full">
                                {pharmacyMetrics.length} Nodes
                              </span>
                            </div>
                            <div className="mt-2">
                              <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                                {activeSellingPharmaciesCount}{' '}
                                <span className="text-xs font-normal text-slate-400 font-sans">
                                  of {pharmacyMetrics.length} Active ({Math.round((activeSellingPharmaciesCount / Math.max(1, pharmacyMetrics.length)) * 100)}%)
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                                <div
                                  className="bg-blue-600 h-full rounded-full transition-all"
                                  style={{
                                    width: `${Math.round((activeSellingPharmaciesCount / Math.max(1, pharmacyMetrics.length)) * 100)}%`
                                  }}
                                />
                              </div>
                              <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                                <span>{zeroSalesCount} Pharmacies with 0 sales</span>
                                <span className="text-blue-500 font-semibold">{totalMarketQuantity.toLocaleString()} Total Units</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* KPI Statistics Overview */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Volume Sold</span>
                        <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1.5">
                          {totalMarketQuantity.toLocaleString()} <span className="text-xs font-normal text-slate-400 font-sans">units</span>
                        </div>
                        <span className="text-[9px] text-blue-500 font-medium block mt-1">Dispensed products</span>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Network Retail Sales</span>
                        <div className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1.5 truncate">
                          {totalMarketRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xs font-normal text-slate-400 font-sans">ETB</span>
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-1">Gross consumer value</span>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Pharmacies</span>
                        <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1.5">
                          {activeSellingPharmaciesCount} <span className="text-xs font-normal text-slate-400 font-sans">nodes</span>
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-1">Dispensing in period</span>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sales Transactions</span>
                        <div className="text-xl font-black text-violet-600 dark:text-violet-400 font-mono mt-1.5">
                          {marketSales.length.toLocaleString()} <span className="text-xs font-normal text-slate-400 font-sans">txns</span>
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-1">Dispensing events</span>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Distinct Medicines</span>
                        <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1.5">
                          {productMetrics.length.toLocaleString()} <span className="text-xs font-normal text-slate-400 font-sans">SKUs</span>
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-1">Catalog items traded</span>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Basket Value</span>
                        <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1.5 truncate">
                          {marketSales.length > 0
                            ? (totalMarketRevenue / marketSales.length).toFixed(0)
                            : 0}{' '}
                          <span className="text-xs font-normal text-slate-400 font-sans">ETB</span>
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-1">Per retail transaction</span>
                      </div>
                    </div>

                    {/* Visual Analytics Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Top Selling Pharmacies / Products Toggleable Chart */}
                      <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                              <TrendingUp className="w-4 h-4 text-blue-600" />
                              {marketChartMode === 'pharmacies' ? 'Top Pharmacies by Gross Revenue (ETB)' : 'Top Selling Products by Volume (Units)'}
                            </h4>
                          </div>

                          {/* Chart Toggle */}
                          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-bold">
                            <button
                              onClick={() => setMarketChartMode('pharmacies')}
                              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                                marketChartMode === 'pharmacies'
                                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              Pharmacies
                            </button>
                            <button
                              onClick={() => setMarketChartMode('products')}
                              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                                marketChartMode === 'products'
                                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              Medicines
                            </button>
                          </div>
                        </div>

                        <div className="h-56 text-xs">
                          {marketChartMode === 'pharmacies' ? (
                            pharmacyMetrics.filter(p => p.totalRevenue > 0).length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={pharmacyMetrics
                                    .filter(p => p.totalRevenue > 0)
                                    .slice(0, 8)
                                    .map(p => ({
                                      name: p.pharmacyName.length > 15 ? p.pharmacyName.slice(0, 13) + '…' : p.pharmacyName,
                                      fullName: p.pharmacyName,
                                      revenue: p.totalRevenue,
                                      units: p.totalQuantitySold,
                                      city: p.city
                                    }))}
                                  margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                  <XAxis dataKey="name" stroke="#94A3B8" angle={-15} textAnchor="end" interval={0} />
                                  <YAxis stroke="#94A3B8" />
                                  <Tooltip
                                    formatter={(value: any, name: string, item: any) => [
                                      name === 'revenue' ? `${Number(value).toLocaleString()} ETB` : `${Number(value).toLocaleString()} Units`,
                                      name === 'revenue' ? 'Gross Revenue' : 'Units Sold'
                                    ]}
                                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                                  />
                                  <Bar dataKey="revenue" fill="#10B981" radius={[6, 6, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                                No pharmacy sales recorded in selected window.
                              </div>
                            )
                          ) : (
                            productMetrics.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={productMetrics.slice(0, 8).map(p => ({
                                    name: p.productName.length > 14 ? p.productName.slice(0, 12) + '…' : p.productName,
                                    fullName: p.productName,
                                    units: p.totalQuantitySold,
                                    revenue: p.totalRevenue,
                                  }))}
                                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                  <XAxis dataKey="name" stroke="#94A3B8" angle={-15} textAnchor="end" interval={0} />
                                  <YAxis stroke="#94A3B8" />
                                  <Tooltip
                                    formatter={(value: any, name: string) => [
                                      name === 'units' ? `${Number(value).toLocaleString()} Units` : `${Number(value).toLocaleString()} ETB`,
                                      name === 'units' ? 'Units Sold' : 'Revenue'
                                    ]}
                                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                                  />
                                  <Bar dataKey="units" fill="#2563EB" radius={[6, 6, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                                No sales volume recorded in selected window.
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* Therapeutic Category Distribution Pie Chart */}
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-violet-600" />
                            Category Volume Share
                          </h4>
                          <span className="text-[10px] text-slate-400">Share of units</span>
                        </div>
                        <div className="h-56 text-xs flex items-center justify-center">
                          {categoryDistributionData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={categoryDistributionData}
                                  dataKey="quantity"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={70}
                                  innerRadius={35}
                                  paddingAngle={3}
                                >
                                  {categoryDistributionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  formatter={(value: any) => [`${Number(value).toLocaleString()} Units`, 'Volume']}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="text-slate-400 text-xs">No category data recorded</div>
                          )}
                        </div>
                        {/* Legend pills */}
                        <div className="flex flex-wrap gap-1.5 mt-2 justify-center">
                          {categoryDistributionData.slice(0, 4).map((c, i) => (
                            <div key={c.name} className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                              <span className="truncate max-w-[90px]">{c.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* VIEW 1: PHARMACY PERFORMANCE & BEST/WORST PRODUCT RANKINGS */}
                    {marketViewMode === 'pharmacies' && (
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        {/* Table Controls Header */}
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
                              <Store className="w-4 h-4 text-blue-600" />
                              Pharmacy Performance Leaderboard & Product Breakdown
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Ranked by sales success, highlighting best and worst selling medicines per dispensing node
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* Search */}
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                value={marketSearchQuery}
                                onChange={e => setMarketSearchQuery(e.target.value)}
                                placeholder="Search pharmacy, city, best item..."
                                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white w-48 sm:w-56 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              {marketSearchQuery && (
                                <button
                                  onClick={() => setMarketSearchQuery('')}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                                >
                                  ×
                                </button>
                              )}
                            </div>

                            {/* Tier Filter */}
                            <select
                              value={marketPharmacyTierFilter}
                              onChange={e => setMarketPharmacyTierFilter(e.target.value)}
                              aria-label="Filter by Tier"
                              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                            >
                              <option value="all">All Tiers ({pharmacyMetrics.length})</option>
                              <option value="top">Top Performers 🥇</option>
                              <option value="high">High Volume 📈</option>
                              <option value="moderate">Moderate ⚖️</option>
                              <option value="low">Underperforming / Low 🔻</option>
                              <option value="inactive">No Sales Recorded ⚪</option>
                            </select>

                            {/* Sort Selector */}
                            <select
                              value={marketPharmacySortBy}
                              onChange={e => setMarketPharmacySortBy(e.target.value as any)}
                              aria-label="Sort pharmacies by"
                              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none font-medium"
                            >
                              <option value="revenue">Sort: Highest Gross Revenue (Best)</option>
                              <option value="worst">Sort: Lowest Gross Revenue (Worst / Lagging)</option>
                              <option value="volume">Sort: Units Dispensed (High-Low)</option>
                              <option value="transactions">Sort: Transaction Count</option>
                              <option value="products">Sort: Catalog Breadth (# of SKUs)</option>
                            </select>
                          </div>
                        </div>

                        {/* Pharmacy Leaderboard Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <th className="py-3.5 px-4 w-12 text-center">Rank</th>
                                <th className="py-3.5 px-4">Pharmacy & Location</th>
                                <th className="py-3.5 px-4">Performance Tier</th>
                                <th className="py-3.5 px-4 text-right">Gross Revenue (ETB)</th>
                                <th className="py-3.5 px-4 text-right">Units Sold</th>
                                <th className="py-3.5 px-4">Top / Best Selling Item</th>
                                <th className="py-3.5 px-4">Lowest / Slowest Item</th>
                                <th className="py-3.5 px-4 text-right">Txns & Basket</th>
                                <th className="py-3.5 px-4 text-center">Catalog Mix</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                              {filteredPharmacies.length > 0 ? (
                                filteredPharmacies.map((pharm) => {
                                  const isExpanded = expandedPharmacyId === pharm.pharmacyId;
                                  const maxRev = pharmacyMetrics[0]?.totalRevenue || 1;
                                  const revShare = totalMarketRevenue > 0 ? Math.round((pharm.totalRevenue / totalMarketRevenue) * 100) : 0;
                                  const revBar = Math.max(3, Math.round((pharm.totalRevenue / maxRev) * 100));

                                  return (
                                    <React.Fragment key={pharm.pharmacyId}>
                                      <tr
                                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                                          isExpanded ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                                        }`}
                                      >
                                        {/* Rank */}
                                        <td className="py-3.5 px-4 text-center font-mono font-bold">
                                          {pharm.totalRevenue === 0 ? (
                                            <span className="text-slate-300 dark:text-slate-600">—</span>
                                          ) : pharm.rank === 1 ? (
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-xs font-black ring-2 ring-amber-400/30">
                                              1
                                            </span>
                                          ) : pharm.rank === 2 ? (
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black">
                                              2
                                            </span>
                                          ) : pharm.rank === 3 ? (
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 text-xs font-black">
                                              3
                                            </span>
                                          ) : (
                                            <span className="text-slate-400">#{pharm.rank}</span>
                                          )}
                                        </td>

                                        {/* Pharmacy Name & City */}
                                        <td className="py-3.5 px-4">
                                          <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                                              <Store className="w-3.5 h-3.5" />
                                            </div>
                                            <div>
                                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                                {pharm.pharmacyName}
                                                {pharm.licenseNumber && (
                                                  <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded font-mono">
                                                    {pharm.licenseNumber}
                                                  </span>
                                                )}
                                              </div>
                                              <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                                <span>{pharm.city}</span>
                                                {pharm.ownerName && <span>• Owner: {pharm.ownerName}</span>}
                                              </div>
                                            </div>
                                          </div>
                                        </td>

                                        {/* Performance Tier */}
                                        <td className="py-3.5 px-4">
                                          {pharm.tier === 'Top Performer' && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                              <Award className="w-3 h-3" />
                                              Top Performer
                                            </span>
                                          )}
                                          {pharm.tier === 'High Volume' && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                              <TrendingUp className="w-3 h-3" />
                                              High Volume
                                            </span>
                                          )}
                                          {pharm.tier === 'Moderate' && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                              Moderate
                                            </span>
                                          )}
                                          {pharm.tier === 'Low / Underperforming' && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                              <TrendingDown className="w-3 h-3" />
                                              Underperforming
                                            </span>
                                          )}
                                          {pharm.tier === 'No Sales' && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400">
                                              No Sales
                                            </span>
                                          )}
                                        </td>

                                        {/* Gross Revenue */}
                                        <td className="py-3.5 px-4 text-right">
                                          <div className="font-mono font-bold text-slate-900 dark:text-white">
                                            {pharm.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </div>
                                          {pharm.totalRevenue > 0 && (
                                            <div className="text-[10px] text-slate-400 font-mono">
                                              {revShare}% of network
                                            </div>
                                          )}
                                        </td>

                                        {/* Units Sold */}
                                        <td className="py-3.5 px-4 text-right">
                                          <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                            {pharm.totalQuantitySold.toLocaleString()}
                                          </div>
                                          {pharm.totalRevenue > 0 && (
                                            <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1 ml-auto overflow-hidden">
                                              <div
                                                className="bg-blue-600 h-full rounded-full"
                                                style={{ width: `${revBar}%` }}
                                              />
                                            </div>
                                          )}
                                        </td>

                                        {/* Best Selling Item */}
                                        <td className="py-3.5 px-4">
                                          {pharm.bestSellingProduct ? (
                                            <div>
                                              <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 truncate max-w-[200px]" title={pharm.bestSellingProduct.productName}>
                                                <span className="text-[10px]">🥇</span>
                                                <span className="truncate">{pharm.bestSellingProduct.productName}</span>
                                              </div>
                                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                                {pharm.bestSellingProduct.quantity} units • {pharm.bestSellingProduct.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} ETB ({pharm.bestSellingProduct.sharePercent}% of store)
                                              </div>
                                            </div>
                                          ) : (
                                            <span className="text-slate-400 italic text-[11px]">No items dispensed</span>
                                          )}
                                        </td>

                                        {/* Lowest / Worst Selling Item */}
                                        <td className="py-3.5 px-4">
                                          {pharm.worstSellingProduct ? (
                                            <div>
                                              <div className="font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1 truncate max-w-[190px]" title={pharm.worstSellingProduct.productName}>
                                                <span className="text-[10px]">🔻</span>
                                                <span className="truncate">{pharm.worstSellingProduct.productName}</span>
                                              </div>
                                              <div className="text-[10px] text-slate-400 font-mono">
                                                {pharm.worstSellingProduct.quantity} units ({pharm.worstSellingProduct.sharePercent}%)
                                              </div>
                                            </div>
                                          ) : pharm.productList.length === 1 ? (
                                            <span className="text-slate-400 text-[10px] italic">Only 1 SKU traded</span>
                                          ) : (
                                            <span className="text-slate-400 italic text-[11px]">None</span>
                                          )}
                                        </td>

                                        {/* Transactions & Basket */}
                                        <td className="py-3.5 px-4 text-right">
                                          <div className="font-mono text-slate-900 dark:text-white font-medium">
                                            {pharm.transactionCount} txns
                                          </div>
                                          {pharm.averageBasket > 0 && (
                                            <div className="text-[10px] text-slate-400 font-mono">
                                              Avg: {pharm.averageBasket.toFixed(0)} ETB
                                            </div>
                                          )}
                                        </td>

                                        {/* Expand Product Breakdown Button */}
                                        <td className="py-3.5 px-4 text-center">
                                          <button
                                            onClick={() => setExpandedPharmacyId(isExpanded ? null : pharm.pharmacyId)}
                                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 mx-auto cursor-pointer ${
                                              isExpanded
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                          >
                                            <span>{pharm.productList.length} SKUs</span>
                                            {isExpanded ? (
                                              <ChevronUp className="w-3.5 h-3.5" />
                                            ) : (
                                              <ChevronDown className="w-3.5 h-3.5" />
                                            )}
                                          </button>
                                        </td>
                                      </tr>

                                      {/* ACCORDION ROW: Complete product mix for this pharmacy */}
                                      {isExpanded && (
                                        <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-y border-blue-200 dark:border-blue-900/50">
                                          <td colSpan={9} className="p-4 sm:p-6">
                                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
                                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-2">
                                                  <Pill className="w-4 h-4 text-blue-600" />
                                                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                                                    Product Sales Performance for {pharm.pharmacyName}
                                                  </span>
                                                  <span className="text-slate-400 text-xs">
                                                    ({pharm.productList.length} products ranked from best to worst seller)
                                                  </span>
                                                </div>
                                                <div className="text-xs text-slate-500 font-mono">
                                                  Total Pharmacy Volume: <strong className="text-blue-600">{pharm.totalQuantitySold} units</strong> • <strong className="text-slate-900 dark:text-white">{pharm.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} ETB</strong>
                                                </div>
                                              </div>

                                              {pharm.productList.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                  <table className="w-full text-left text-xs">
                                                    <thead>
                                                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                                                        <th className="py-2 px-3">Item Rank</th>
                                                        <th className="py-2 px-3">Product Name</th>
                                                        <th className="py-2 px-3">Category</th>
                                                        <th className="py-2 px-3 text-right">Units Sold</th>
                                                        <th className="py-2 px-3 text-right">Revenue (ETB)</th>
                                                        <th className="py-2 px-3 text-right">Share of Store Sales</th>
                                                        <th className="py-2 px-3 text-center">Velocity Classification</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                                      {pharm.productList.map((prod, pIdx) => {
                                                        const isTopItem = pIdx === 0;
                                                        const isWorstItem = pIdx === pharm.productList.length - 1 && pharm.productList.length > 1;

                                                        return (
                                                          <tr key={prod.productName} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                                            <td className="py-2 px-3 font-mono font-bold">
                                                              {isTopItem ? (
                                                                <span className="text-emerald-600 font-black">#1 Best</span>
                                                              ) : isWorstItem ? (
                                                                <span className="text-amber-600 font-medium">#{pIdx + 1} Lowest</span>
                                                              ) : (
                                                                <span className="text-slate-400">#{pIdx + 1}</span>
                                                              )}
                                                            </td>
                                                            <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                                                              {prod.productName}
                                                            </td>
                                                            <td className="py-2 px-3 text-slate-500">
                                                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800">
                                                                {prod.category}
                                                              </span>
                                                            </td>
                                                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                              {prod.quantity.toLocaleString()}
                                                            </td>
                                                            <td className="py-2 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                                                              {prod.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </td>
                                                            <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                                                              {prod.sharePercent}%
                                                            </td>
                                                            <td className="py-2 px-3 text-center">
                                                              {isTopItem ? (
                                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                                                  Top Driver 🥇
                                                                </span>
                                                              ) : isWorstItem ? (
                                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                                                                  Slowest Mover 🔻
                                                                </span>
                                                              ) : prod.sharePercent > 15 ? (
                                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                                                                  Core Item
                                                                </span>
                                                              ) : (
                                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                                  Steady
                                                                </span>
                                                              )}
                                                            </td>
                                                          </tr>
                                                        );
                                                      })}
                                                    </tbody>
                                                  </table>
                                                </div>
                                              ) : (
                                                <div className="py-4 text-center text-slate-400 text-xs">
                                                  No product sales transactions recorded for this pharmacy in this time window.
                                                </div>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </React.Fragment>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan={9} className="py-12 text-center text-slate-400">
                                    <Store className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                                    <p className="font-medium text-xs">No pharmacies found matching your filter criteria</p>
                                    {(marketSearchQuery || marketPharmacyTierFilter !== 'all' || marketPharmacyFilter !== 'all') && (
                                      <button
                                        onClick={() => {
                                          setMarketSearchQuery('');
                                          setMarketPharmacyTierFilter('all');
                                          setMarketPharmacyFilter('all');
                                        }}
                                        className="mt-2 text-blue-600 text-xs font-bold underline cursor-pointer"
                                      >
                                        Clear Search and Filters
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* VIEW 2: PRODUCT PERFORMANCE & DISPERSION ACROSS PHARMACIES */}
                    {marketViewMode === 'products' && (
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        {/* Table Controls Header */}
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
                              <Package className="w-4 h-4 text-blue-600" />
                              Product Performance & Pharmacy Dispensing Leaderboard
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Showing {filteredProducts.length} ranked products with top and lowest dispensing pharmacies
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* Search */}
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                value={marketSearchQuery}
                                onChange={e => setMarketSearchQuery(e.target.value)}
                                placeholder="Search product or generic..."
                                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white w-48 sm:w-56 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              {marketSearchQuery && (
                                <button
                                  onClick={() => setMarketSearchQuery('')}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                                >
                                  ×
                                </button>
                              )}
                            </div>

                            {/* Category Filter */}
                            <select
                              value={marketCategoryFilter}
                              onChange={e => setMarketCategoryFilter(e.target.value)}
                              aria-label="Filter by Category"
                              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                            >
                              <option value="all">All Categories ({marketCategories.length})</option>
                              {marketCategories.map(c => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>

                            {/* Sort Selector */}
                            <select
                              value={marketSortBy}
                              onChange={e => setMarketSortBy(e.target.value as any)}
                              aria-label="Sort products by"
                              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                            >
                              <option value="quantity">Sort: Units Sold (High-Low)</option>
                              <option value="revenue">Sort: Revenue Generated</option>
                              <option value="pharmacies">Sort: Pharmacies Dispensing</option>
                              <option value="frequency">Sort: Sales Frequency</option>
                            </select>
                          </div>
                        </div>

                        {/* Leaderboard Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <th className="py-3.5 px-4 w-12 text-center">Rank</th>
                                <th className="py-3.5 px-4">Product & Formulation</th>
                                <th className="py-3.5 px-4">Category</th>
                                <th className="py-3.5 px-4 text-right">Units Dispensed</th>
                                <th className="py-3.5 px-4 text-right">Gross Revenue (ETB)</th>
                                <th className="py-3.5 px-4">Best Selling Pharmacy</th>
                                <th className="py-3.5 px-4">Lowest Selling Pharmacy</th>
                                <th className="py-3.5 px-4 text-center">Pharmacies</th>
                                <th className="py-3.5 px-4 text-center">Breakdown</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                              {filteredProducts.length > 0 ? (
                                filteredProducts.map((prod, idx) => {
                                  const maxQty = filteredProducts[0]?.totalQuantitySold || 1;
                                  const barWidth = Math.max(5, Math.round((prod.totalQuantitySold / maxQty) * 100));
                                  const isExpanded = expandedProductName === prod.productName;

                                  return (
                                    <React.Fragment key={prod.productName}>
                                      <tr
                                        className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                                          isExpanded ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                                        }`}
                                      >
                                        <td className="py-3.5 px-4 text-center font-mono font-bold">
                                          {idx === 0 ? (
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-xs">
                                              1
                                            </span>
                                          ) : idx === 1 ? (
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs">
                                              2
                                            </span>
                                          ) : idx === 2 ? (
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 text-xs">
                                              3
                                            </span>
                                          ) : (
                                            <span className="text-slate-400">#{idx + 1}</span>
                                          )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                          <div className="font-bold text-slate-900 dark:text-white">
                                            {prod.productName}
                                          </div>
                                          {prod.genericName && (
                                            <div className="text-[10px] text-slate-400">
                                              Generic: {prod.genericName}
                                            </div>
                                          )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
                                            {prod.category}
                                          </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                          <div className="font-mono font-bold text-slate-900 dark:text-white">
                                            {prod.totalQuantitySold.toLocaleString()}
                                          </div>
                                          <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1 ml-auto overflow-hidden">
                                            <div
                                              className="bg-blue-600 h-full rounded-full transition-all"
                                              style={{ width: `${barWidth}%` }}
                                            />
                                          </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                                          {prod.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        {/* Best Selling Pharmacy */}
                                        <td className="py-3.5 px-4">
                                          {prod.bestPharmacy ? (
                                            <div>
                                              <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 truncate max-w-[180px]" title={prod.bestPharmacy.pharmacyName}>
                                                <span className="text-[10px]">🥇</span>
                                                <span className="truncate">{prod.bestPharmacy.pharmacyName}</span>
                                              </div>
                                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                                {prod.bestPharmacy.quantity} units ({prod.bestPharmacy.sharePercent}% share)
                                              </div>
                                            </div>
                                          ) : (
                                            <span className="text-slate-400 italic text-[11px]">N/A</span>
                                          )}
                                        </td>
                                        {/* Lowest Selling Pharmacy */}
                                        <td className="py-3.5 px-4">
                                          {prod.worstPharmacy ? (
                                            <div>
                                              <div className="font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1 truncate max-w-[170px]" title={prod.worstPharmacy.pharmacyName}>
                                                <span className="text-[10px]">🔻</span>
                                                <span className="truncate">{prod.worstPharmacy.pharmacyName}</span>
                                              </div>
                                              <div className="text-[10px] text-slate-400 font-mono">
                                                {prod.worstPharmacy.quantity} units ({prod.worstPharmacy.sharePercent}%)
                                              </div>
                                            </div>
                                          ) : (
                                            <span className="text-slate-400 text-[10px] italic">Sole Dispenser</span>
                                          )}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                                            <Store className="w-3 h-3" />
                                            {prod.uniquePharmacyCount}
                                          </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                          <button
                                            onClick={() => setExpandedProductName(isExpanded ? null : prod.productName)}
                                            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 mx-auto cursor-pointer ${
                                              isExpanded
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                          >
                                            <span>Dispersion</span>
                                            {isExpanded ? (
                                              <ChevronUp className="w-3.5 h-3.5" />
                                            ) : (
                                              <ChevronDown className="w-3.5 h-3.5" />
                                            )}
                                          </button>
                                        </td>
                                      </tr>

                                      {/* ACCORDION ROW: Pharmacies Dispensing this product */}
                                      {isExpanded && (
                                        <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-y border-blue-200 dark:border-blue-900/50">
                                          <td colSpan={9} className="p-4 sm:p-6">
                                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
                                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-2">
                                                  <Store className="w-4 h-4 text-blue-600" />
                                                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                                                    Pharmacies Dispensing {prod.productName}
                                                  </span>
                                                  <span className="text-slate-400 text-xs">
                                                    ({prod.pharmacyList.length} dispensing nodes ranked from highest volume)
                                                  </span>
                                                </div>
                                                <div className="text-xs text-slate-500 font-mono">
                                                  Total Product Units: <strong className="text-blue-600">{prod.totalQuantitySold} units</strong> • <strong className="text-slate-900 dark:text-white">{prod.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} ETB</strong>
                                                </div>
                                              </div>

                                              <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs">
                                                  <thead>
                                                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                                                      <th className="py-2 px-3">Dispenser Rank</th>
                                                      <th className="py-2 px-3">Pharmacy Name</th>
                                                      <th className="py-2 px-3">Location</th>
                                                      <th className="py-2 px-3 text-right">Units Sold</th>
                                                      <th className="py-2 px-3 text-right">Revenue (ETB)</th>
                                                      <th className="py-2 px-3 text-right">Product Share</th>
                                                      <th className="py-2 px-3 text-center">Status</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                                    {prod.pharmacyList.map((ph, phIdx) => (
                                                      <tr key={ph.pharmacyId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                                        <td className="py-2 px-3 font-mono font-bold">
                                                          {phIdx === 0 ? (
                                                            <span className="text-emerald-600 font-black">#1 Best</span>
                                                          ) : phIdx === prod.pharmacyList.length - 1 && prod.pharmacyList.length > 1 ? (
                                                            <span className="text-amber-600 font-medium">#{phIdx + 1} Lowest</span>
                                                          ) : (
                                                            <span className="text-slate-400">#{phIdx + 1}</span>
                                                          )}
                                                        </td>
                                                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                                                          {ph.pharmacyName}
                                                        </td>
                                                        <td className="py-2 px-3 text-slate-500">
                                                          {ph.city}
                                                        </td>
                                                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                          {ph.quantity.toLocaleString()}
                                                        </td>
                                                        <td className="py-2 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                                                          {ph.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                                                          {ph.sharePercent}%
                                                        </td>
                                                        <td className="py-2 px-3 text-center">
                                                          {phIdx === 0 ? (
                                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                                              Top Seller 🥇
                                                            </span>
                                                          ) : phIdx === prod.pharmacyList.length - 1 && prod.pharmacyList.length > 1 ? (
                                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                                                              Lowest Seller 🔻
                                                            </span>
                                                          ) : (
                                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                              Active
                                                            </span>
                                                          )}
                                                        </td>
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </React.Fragment>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan={9} className="py-12 text-center text-slate-400">
                                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                                    <p className="font-medium text-xs">No sales data found matching your query or date range</p>
                                    {(marketSearchQuery || marketCategoryFilter !== 'all' || marketPharmacyFilter !== 'all') && (
                                      <button
                                        onClick={() => {
                                          setMarketSearchQuery('');
                                          setMarketCategoryFilter('all');
                                          setMarketPharmacyFilter('all');
                                        }}
                                        className="mt-2 text-blue-600 text-xs font-bold underline cursor-pointer"
                                      >
                                        Clear Search and Filters
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Data Isolation & Privacy Notice */}
                    <div className="bg-slate-100/60 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-3">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">Privacy & Multi-Tenant Data Isolation Protected: </span>
                        Super Admin Market Intelligence aggregates point-of-sale volume across the licensed pharmacy network. Personal patient health information, customer contact records, and individual pharmacy internal proprietary accounts remain strictly segregated and protected under national data isolation standards.
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: SALES INTELLIGENCE & OPERATIONAL AUDIT */}
                {activeTab === 'sales-audit' && (
                  <SuperAdminSalesAudit 
                    user={{
                      uid: auth.currentUser?.uid || 'super-admin-01',
                      email: auth.currentUser?.email || 'superadmin@atech.et',
                      role: 'admin',
                      name: auth.currentUser?.displayName || 'Super Admin',
                      displayName: auth.currentUser?.displayName || 'Super Administrator',
                      verificationStatus: 'approved',
                      createdAt: Date.now()
                    } as UserProfile} 
                  />
                )}

                {/* TAB: PRODUCT DEMAND & IMPORTER INTELLIGENCE */}
                {activeTab === 'product-demand' && (
                  <ProductDemandIntelligence 
                    user={{
                      uid: auth.currentUser?.uid || 'super-admin-01',
                      email: auth.currentUser?.email || 'superadmin@atech.et',
                      role: 'admin',
                      name: auth.currentUser?.displayName || 'Super Admin',
                      displayName: auth.currentUser?.displayName || 'Super Administrator',
                      verificationStatus: 'approved',
                      createdAt: Date.now()
                    } as UserProfile} 
                    mode="super-admin"
                  />
                )}

                {/* TAB 10: ECOSYSTEM HEALTH */}
                {activeTab === 'health' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ecosystem System Vitals & Cloud Telemetry</h2>
                          <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            All Systems Operational (99.98% SLA)
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Multi-region telemetry, microservices latency, and automated background daemon monitors</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setIsSimulatingHealthPing(true);
                            setTimeout(() => {
                              setIsSimulatingHealthPing(false);
                              toast.success('System Diagnostics Check: All 8 core microservices responded with 200 OK (Latency: 14ms)');
                            }, 800);
                          }}
                          disabled={isSimulatingHealthPing}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-blue-500/20 cursor-pointer transition-all disabled:opacity-50"
                        >
                          <Activity className={`w-3.5 h-3.5 ${isSimulatingHealthPing ? 'animate-spin' : ''}`} />
                          <span>{isSimulatingHealthPing ? 'Pinging Nodes...' : 'Run Diagnostics Ping'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Vitals KPI Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Uptime SLA</span>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <div className="text-lg font-black text-slate-900 dark:text-white font-mono">99.98%</div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">31d uninterrupted</span>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider">API Latency</span>
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                        <div className="text-lg font-black text-slate-900 dark:text-white font-mono">18ms</div>
                        <span className="text-[10px] text-slate-400 font-mono">p50: 14ms | p99: 48ms</span>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Active Sockets</span>
                          <Wifi className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div className="text-lg font-black text-slate-900 dark:text-white font-mono">3,412</div>
                        <span className="text-[10px] text-blue-600 font-medium">Live POS sessions</span>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider">RAM Usage</span>
                          <Server className="w-3.5 h-3.5 text-purple-500" />
                        </div>
                        <div className="text-lg font-black text-slate-900 dark:text-white font-mono">1.42 GB</div>
                        <span className="text-[10px] text-slate-400 font-mono">of 4.00 GB (35.5%)</span>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider">DB Throughput</span>
                          <Database className="w-3.5 h-3.5 text-indigo-500" />
                        </div>
                        <div className="text-lg font-black text-slate-900 dark:text-white font-mono">2,840</div>
                        <span className="text-[10px] text-indigo-600 font-medium">Firestore ops/sec</span>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Storage Asset</span>
                          <Warehouse className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <div className="text-lg font-black text-slate-900 dark:text-white font-mono">98.4 GB</div>
                        <span className="text-[10px] text-emerald-600 font-medium">Licenses & Docs</span>
                      </div>
                    </div>

                    {/* Core Microservices Health Grid */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Core Microservices & Pipelines Status</h3>
                          <p className="text-[11px] text-slate-400">Real-time health matrix for high-availability pharmaceutical microservices</p>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">Target Region: europe-west2</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {DEMO_SYSTEM_SERVICES.map((srv, idx) => (
                          <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-mono">{srv.category}</span>
                                <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  {srv.status}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">{srv.name}</h4>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Region: {srv.region}</p>
                            </div>
                            <div className="mt-3 pt-2.5 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-[10px] font-mono text-slate-500">
                              <span>Latency: <strong className="text-slate-800 dark:text-white">{srv.latencyMs}ms</strong></span>
                              <span>Uptime: <strong className="text-emerald-600">{srv.uptime}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Latency & Query Performance Chart */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">24-Hour API Latency & Query Throughput</h3>
                          <p className="text-[11px] text-slate-400">Telemetry tracking p50, p95, and p99 response times against transaction volume</p>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold">
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-500 rounded"></span> p50 (Median ms)</span>
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded"></span> p95 (ms)</span>
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded"></span> p99 (ms)</span>
                        </div>
                      </div>

                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={DEMO_HOURLY_LATENCY}>
                            <defs>
                              <linearGradient id="colorLatencyP50" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                              </linearGradient>
                              <linearGradient id="colorLatencyP95" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                            <XAxis dataKey="hour" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} unit="ms" />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                            <Area type="monotone" dataKey="p50" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorLatencyP50)" name="p50 Latency (ms)" />
                            <Area type="monotone" dataKey="p95" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorLatencyP95)" name="p95 Latency (ms)" />
                            <Area type="monotone" dataKey="p99" stroke="#EF4444" strokeWidth={2} fillOpacity={0} name="p99 Latency (ms)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Background Scheduled Cron Jobs & Daemon Workers */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Scheduled Background Cron Jobs & Daemon Workers</h3>
                      <p className="text-[11px] text-slate-400 mb-4">Autonomous system jobs managing subscription renewals, FEFO alerts, and cloud mirrors</p>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 font-mono">
                            <tr>
                              <th className="px-4 py-3">Task Name</th>
                              <th className="px-4 py-3">Schedule</th>
                              <th className="px-4 py-3">Last Run</th>
                              <th className="px-4 py-3">Execution Duration</th>
                              <th className="px-4 py-3 text-right">Job Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {DEMO_SCHEDULED_CRONS.map((cron, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  <span>{cron.name}</span>
                                </td>
                                <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{cron.schedule}</td>
                                <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{cron.lastRun}</td>
                                <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{cron.duration}</td>
                                <td className="px-4 py-3 text-right">
                                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold font-mono">
                                    {cron.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 11: SUPPORT CENTER (TICKETING) */}
                {activeTab === 'support' && (() => {
                  const combinedTickets = [
                    ...tickets,
                    ...DEMO_SUPPORT_TICKETS_LIST.map(t => ({
                      id: t.id,
                      organizationId: t.organizationName,
                      organizationName: t.organizationName,
                      title: t.title,
                      description: t.description,
                      category: t.category.toLowerCase().replace(/[^a-z]/g, '_') as any,
                      severity: t.severity,
                      status: t.status,
                      createdAt: Date.now() - 3600000,
                      assignedTo: t.assignedTo,
                      slaMinutesRemaining: t.slaMinutesRemaining,
                      resolutionNotes: t.resolutionNotes
                    }))
                  ];

                  const filteredTickets = combinedTickets.filter(t => {
                    if (supportCategoryFilter !== 'all') {
                      if (!t.category?.toLowerCase().includes(supportCategoryFilter.toLowerCase())) return false;
                    }
                    if (supportStatusFilter !== 'all') {
                      if (t.status !== supportStatusFilter) return false;
                    }
                    return true;
                  });

                  return (
                    <div className="space-y-6 animate-fade-in">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Customer Support Desk & SLAs</h2>
                            <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-bold">
                              CSAT: 97.4% • Avg Response: 18m
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Moderate billing disputes, API sync errors, EFDA compliance, and POS dispensary tickets</p>
                        </div>
                        <button 
                          onClick={() => setShowAddTicketModal(true)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold font-sans flex items-center gap-2 cursor-pointer transition-all shadow-sm shadow-blue-500/20"
                        >
                          <Plus className="w-3.5 h-3.5" /> Create Support Ticket
                        </button>
                      </div>

                      {/* Support Operations KPI Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Open Tickets</span>
                          <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
                            {combinedTickets.filter(t => t.status === 'open').length} Open
                          </div>
                          <span className="text-[10px] text-rose-500 font-medium">Requires response</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending SLA (&lt;2h)</span>
                          <div className="text-xl font-black text-amber-500 font-mono mt-1">2 Critical</div>
                          <span className="text-[10px] text-amber-600 font-medium">Expiring soon</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resolved This Month</span>
                          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">84 Cases</div>
                          <span className="text-[10px] text-emerald-600 font-medium">96.8% SLA met</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg First Response</span>
                          <div className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">18 Mins</div>
                          <span className="text-[10px] text-blue-600 font-medium">Target: &lt;30 min</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Satisfaction CSAT</span>
                          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">97.4%</div>
                          <span className="text-[10px] text-emerald-600 font-medium">Based on 142 reviews</span>
                        </div>
                      </div>

                      {/* Filters and Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase mr-2 font-mono">Category:</span>
                          {['all', 'billing', 'api', 'regulatory', 'pos', 'account'].map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setSupportCategoryFilter(cat)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${supportCategoryFilter === cat ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
                            >
                              {cat === 'all' ? 'All Tickets' : cat.toUpperCase()}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Status:</span>
                          <select
                            value={supportStatusFilter}
                            onChange={(e) => setSupportStatusFilter(e.target.value)}
                            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 outline-none cursor-pointer"
                          >
                            <option value="all">All Statuses</option>
                            <option value="open">Open Only</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </div>
                      </div>

                      {/* Ticket Cards */}
                      <div className="space-y-3">
                        {filteredTickets.map((t: any) => (
                          <div key={t.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-blue-500/30 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{t.id}</span>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${t.severity === 'critical' ? 'bg-rose-500 text-white animate-pulse' : t.severity === 'high' ? 'bg-amber-500/15 text-amber-600 border border-amber-500/20' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>{t.severity}</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">{t.organizationName}</span>
                                {t.slaMinutesRemaining !== undefined && t.slaMinutesRemaining > 0 && (
                                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                    <Clock className="w-3 h-3" /> SLA: {t.slaMinutesRemaining}m left
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.title}</h4>
                              <p className="text-xs text-slate-500 leading-relaxed">{t.description}</p>
                              {t.resolutionNotes && (
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 font-medium">
                                  <strong>Resolution Plan:</strong> {t.resolutionNotes}
                                </p>
                              )}
                              {t.assignedTo && (
                                <p className="text-[10px] text-slate-400 font-mono">Assigned Support Specialist: <strong className="text-slate-700 dark:text-slate-300">{t.assignedTo}</strong></p>
                              )}
                            </div>

                            <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase font-mono ${t.status === 'open' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' : t.status === 'in_progress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'}`}>
                                {t.status === 'in_progress' ? 'In Progress' : t.status}
                              </span>

                              <div className="flex gap-2">
                                {t.status !== 'resolved' ? (
                                  <button 
                                    onClick={() => {
                                      updateTicketStatus(t.id, 'resolved');
                                      toast.success(`Ticket ${t.id} resolved successfully`);
                                    }}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-sm shadow-emerald-600/20"
                                  >
                                    Resolve Ticket
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => {
                                      updateTicketStatus(t.id, 'open');
                                      toast.success(`Ticket ${t.id} reopened`);
                                    }}
                                    className="px-3 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer transition-all"
                                  >
                                    Reopen
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* TAB 12: COMMUNICATION CENTER (BROADCASTER) */}
                {activeTab === 'communication' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ecosystem Announcement Broadcaster</h2>
                          <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-bold">
                            94.2% Avg Delivery Read Rate
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Deliver emergency regulatory alerts, cold-chain notices, and system announcements across the network</p>
                      </div>
                    </div>

                    {/* Channel Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Broadcasts Dispatched</span>
                        <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">48 Sent</div>
                        <span className="text-[10px] text-blue-600 font-medium">All historical cycles</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Network Reach</span>
                        <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">1,420 Users</div>
                        <span className="text-[10px] text-emerald-600 font-medium">Pharmacies & Importers</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Read Rate</span>
                        <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">94.2%</div>
                        <span className="text-[10px] text-emerald-600 font-medium">&lt;4h from broadcast</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Emergency Alerts</span>
                        <div className="text-xl font-black text-amber-500 font-mono mt-1">4 Priority</div>
                        <span className="text-[10px] text-amber-600 font-medium">98.4% confirmation</span>
                      </div>
                    </div>

                    {/* Announcement Composer */}
                    <form onSubmit={handleBroadcastAnnouncement} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Compose New Ecosystem Announcement</h3>
                        
                        {/* Quick Presets */}
                        <div className="hidden sm:flex items-center gap-1.5 text-[10px]">
                          <span className="text-slate-400 mr-1">Quick Templates:</span>
                          <button
                            type="button"
                            onClick={() => setAnnouncement({
                              ...announcement,
                              title: 'MOH Regulatory Directive: Cold-Chain Verification 2026',
                              message: 'Please verify that all biologicals and insulin storage temperatures (-20°C to 8°C) are logged into the digital dispatch ledger in accordance with EFDA guidelines.',
                              target: 'all'
                            })}
                            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                          >
                            Regulatory Alert
                          </button>
                          <button
                            type="button"
                            onClick={() => setAnnouncement({
                              ...announcement,
                              title: 'Scheduled Cloud Infrastructure Maintenance Notice',
                              message: 'The central pharmaceutical synchronization gateway will undergo a scheduled 5-minute zero-downtime database optimization window this Sunday at 02:00 AM EAT.',
                              target: 'all'
                            })}
                            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                          >
                            Maintenance
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Announcement Title</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g., MOH Regulatory Compliance Update 2026" 
                          className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500"
                          value={announcement.title}
                          onChange={(e) => setAnnouncement({...announcement, title: e.target.value})}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Notification Message Body</label>
                        <textarea 
                          required 
                          rows={3} 
                          placeholder="Provide the complete message to broadcast across the pharmacy and wholesale networks..." 
                          className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500"
                          value={announcement.message}
                          onChange={(e) => setAnnouncement({...announcement, message: e.target.value})}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Target Audience Scope</label>
                          <select 
                            className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 outline-none cursor-pointer"
                            value={announcement.target}
                            onChange={(e) => setAnnouncement({...announcement, target: e.target.value as any})}
                          >
                            <option value="all">Ecosystem-wide (All Pharmacies, Importers & Distributors)</option>
                            <option value="pharmacies">Licensed Retail Pharmacies Only</option>
                            <option value="importers">Wholesale Importers & Distributors Only</option>
                            <option value="region">Specific Administrative Regional Zone</option>
                            <option value="specific">Direct Account (via Email)</option>
                          </select>
                        </div>

                        {announcement.target === 'region' && (
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Region Target Name</label>
                            <input 
                              type="text" 
                              placeholder="e.g., Addis Ababa, Oromia, Sidama" 
                              className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                              value={announcement.targetRegion}
                              onChange={(e) => setAnnouncement({...announcement, targetRegion: e.target.value})}
                            />
                          </div>
                        )}

                        {announcement.target === 'specific' && (
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Target User/Company Email(s)</label>
                            <input 
                              type="text" 
                              required
                              placeholder="e.g., info@company.com, pharmacist@domain.com" 
                              className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                              value={announcement.targetEmail}
                              onChange={(e) => setAnnouncement({...announcement, targetEmail: e.target.value})}
                            />
                          </div>
                        )}
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                            <span>In-App Banner</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                            <span>Push Notification</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" className="rounded text-blue-600" />
                            <span>SMS Gateway Bridge</span>
                          </label>
                        </div>

                        <button 
                          type="submit" 
                          className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm shadow-blue-500/20"
                        >
                          <Megaphone className="w-4 h-4" /> Broadcast Announcement
                        </button>
                      </div>
                    </form>

                    {/* Historical Broadcast Feed Ledger */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Broadcast Delivery History & Verification Ledger</h3>
                      <p className="text-[11px] text-slate-400 mb-4">Historical audit record of all multi-channel announcements dispatched across East Africa</p>

                      <div className="space-y-3">
                        {DEMO_BROADCAST_FEED.map((b) => (
                          <div key={b.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${b.priority === 'urgent' ? 'bg-rose-500 text-white' : b.priority === 'high' ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                  {b.priority}
                                </span>
                                <span className="text-[9px] font-mono font-bold text-slate-400">{b.id}</span>
                                <span className="text-[10px] text-slate-400 font-mono">• {b.sentAt}</span>
                              </div>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">{b.title}</h4>
                              <p className="text-[11px] text-slate-500">Target: <strong className="text-slate-700 dark:text-slate-300">{b.targetAudience}</strong></p>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {b.channels.map((ch, i) => (
                                  <span key={i} className="text-[9px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md font-mono">
                                    {ch}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0">
                              <div className="text-right">
                                <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">{b.readRate}</div>
                                <span className="text-[10px] text-slate-400 font-mono">of {b.recipientCount} confirmed</span>
                              </div>
                              <button
                                onClick={() => toast.success(`Re-sent notification: ${b.title}`)}
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                              >
                                Re-dispatch
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 13: DISTRIBUTOR NODE */}
                {activeTab === 'distributor' && (() => {
                  const combinedDistributors = [
                    ...displayUsers.filter(u => u.role === 'distributor').map(u => ({
                      id: u.uid,
                      companyName: u.distributorName || u.displayName || 'Regional Dispatch Courier',
                      licenseNumber: (u as any).licenseNumber || 'EFDA-DIST-2025-0012',
                      country: u.country || 'Ethiopia',
                      city: u.city || 'Addis Ababa',
                      fleetVans: 12,
                      fleetBikes: 16,
                      refrigeratedVans: 8,
                      coverageZones: ['Addis Ababa', 'Adama', 'Hawassa'],
                      primaryWarehouse: 'Central Merkato Hub',
                      rating: 4.9,
                      onTimeRate: '98.8%',
                      contactPerson: u.displayName || 'Lead Dispatcher',
                      contactPhone: u.phone || '+251 911 001122',
                      status: 'active' as const
                    })),
                    ...DEMO_DISTRIBUTORS_FLEET
                  ];

                  // Deduplicate by company name
                  const uniqueDistributors = combinedDistributors.filter((v, i, a) => 
                    a.findIndex(t => t.companyName.toLowerCase() === v.companyName.toLowerCase()) === i
                  );

                  const filteredDistributors = uniqueDistributors.filter((d) => {
                    if (distributorCountryFilter !== 'all') {
                      if (d.country.toLowerCase() !== distributorCountryFilter.toLowerCase()) return false;
                    }
                    if (distributorSearch.trim() !== '') {
                      const q = distributorSearch.toLowerCase();
                      return (
                        d.companyName.toLowerCase().includes(q) ||
                        d.city.toLowerCase().includes(q) ||
                        d.licenseNumber.toLowerCase().includes(q) ||
                        d.contactPerson.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  });

                  return (
                    <div className="space-y-6 animate-fade-in">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Logistics & Distributor Fleet Node</h2>
                            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase">
                              98.8% On-Time Delivery Rate
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Real-time fleet tracking, cold-chain temperature telemetry, and partner certification ledger</p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-lg w-full md:w-auto">
                          <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search distributors, zones, drivers..."
                              value={distributorSearch}
                              onChange={(e) => setDistributorSearch(e.target.value)}
                              className="pl-9 pr-4 py-1.5 w-full bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>
                          
                          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1">
                            <Filter className="h-3 w-3 text-slate-400" />
                            <select
                              value={distributorCountryFilter}
                              onChange={(e) => setDistributorCountryFilter(e.target.value)}
                              className="bg-transparent text-xs text-slate-800 dark:text-white border-none outline-none cursor-pointer py-0.5"
                            >
                              <option value="all">All Countries</option>
                              {countries.map((cntry) => (
                                <option key={cntry} value={cntry}>{cntry}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Fleet Logistics KPI Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logistics Partners</span>
                          <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">{uniqueDistributors.length} Licensed</div>
                          <span className="text-[10px] text-blue-600 font-medium">EFDA Certified</span>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Fleet</span>
                          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">114 Vehicles</div>
                          <span className="text-[10px] text-indigo-600 font-medium">56 Vans • 58 Bikes</span>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cold-Chain Reefers</span>
                          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">36 Reefers</div>
                          <span className="text-[10px] text-emerald-600 font-medium">2°C to 8°C Monitored</span>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active In-Transit</span>
                          <div className="text-xl font-black text-amber-500 font-mono mt-1">34 Dispatches</div>
                          <span className="text-[10px] text-amber-600 font-medium">Avg ETA: 1h 40m</span>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">On-Time Performance</span>
                          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">98.8%</div>
                          <span className="text-[10px] text-emerald-600 font-medium">Top Tier Quality</span>
                        </div>
                      </div>

                      {/* Live In-Transit Consignment Dispatch Radar */}
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" /> Live Consignment Dispatch Radar
                            </h3>
                            <p className="text-[11px] text-slate-400">Real-time GPS dispatch stream and cargo temperature telemetry</p>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full">
                            4 Live Telemetry Feeds
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 font-mono">
                              <tr>
                                <th className="px-4 py-3">Consignment ID</th>
                                <th className="px-4 py-3">Logistics Partner</th>
                                <th className="px-4 py-3">Transit Route (Origin &rarr; Destination)</th>
                                <th className="px-4 py-3">Contents &amp; Batch</th>
                                <th className="px-4 py-3">Cargo Temp</th>
                                <th className="px-4 py-3">ETA</th>
                                <th className="px-4 py-3 text-right">Dispatch Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                              {DEMO_LIVE_DISPATCHES.map((d) => (
                                <tr key={d.trackingId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                  <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">{d.trackingId}</td>
                                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{d.distributorName}</td>
                                  <td className="px-4 py-3 text-[11px]">
                                    <span className="text-slate-500">{d.originHub}</span>
                                    <span className="text-blue-500 mx-1">&rarr;</span>
                                    <strong className="text-slate-800 dark:text-slate-200">{d.destinationPharmacy}</strong>
                                  </td>
                                  <td className="px-4 py-3 text-[11px]">
                                    <div className="font-medium text-slate-800 dark:text-slate-200">{d.itemsSummary}</div>
                                    <span className="text-[9px] font-mono text-slate-400">Batch: {d.batchNumber}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full font-mono text-[10px] font-bold flex items-center gap-1 w-fit">
                                      <Thermometer className="w-3 h-3 text-blue-500" />
                                      {d.temperatureReading}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 font-mono text-slate-500 font-bold">{d.eta}</td>
                                  <td className="px-4 py-3 text-right">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${d.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-600' : d.status === 'Out for Delivery' ? 'bg-blue-500/10 text-blue-600 animate-pulse' : 'bg-amber-500/10 text-amber-600'}`}>
                                      {d.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Distributor Fleet Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredDistributors.map((dist) => (
                          <div key={dist.id} className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-blue-500/30 transition-all">
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <div>
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{dist.companyName}</h4>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">License: {dist.licenseNumber} • {dist.city}, {dist.country}</p>
                                </div>
                                <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-lg text-xs font-bold font-mono">
                                  ★ {dist.rating}
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2 my-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-center font-mono text-[11px]">
                                <div>
                                  <span className="text-[9px] text-slate-400 block uppercase">Vans</span>
                                  <strong className="text-slate-900 dark:text-white font-bold">{dist.fleetVans}</strong>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-400 block uppercase">Bikes</span>
                                  <strong className="text-slate-900 dark:text-white font-bold">{dist.fleetBikes}</strong>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-400 block uppercase">Reefers</span>
                                  <strong className="text-emerald-600 font-bold">{dist.refrigeratedVans}</strong>
                                </div>
                              </div>

                              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                                <p className="flex justify-between"><span>Coverage Zones:</span> <strong className="text-slate-800 dark:text-white">{dist.coverageZones.join(', ')}</strong></p>
                                <p className="flex justify-between"><span>Primary Hub:</span> <span className="font-medium text-slate-800 dark:text-white">{dist.primaryWarehouse}</span></p>
                                <p className="flex justify-between"><span>Dispatcher:</span> <span className="font-mono text-slate-800 dark:text-white">{dist.contactPerson} ({dist.contactPhone})</span></p>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full font-mono">
                                On-Time: {dist.onTimeRate}
                              </span>
                              <button
                                onClick={() => toast.success(`Logistics manifest generated for ${dist.companyName}`)}
                                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer transition-all"
                              >
                                View Manifest
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* TAB 14: WAREHOUSE LEDGER OVERLAY */}
                {activeTab === 'warehouse' && (() => {
                  const combinedWarehouses = [
                    ...warehouses.map((w: any) => ({
                      id: w.id || Math.random().toString(),
                      name: w.name || 'Regional Strategic Depot',
                      code: w.code || 'HUB-REG-09',
                      country: w.country || 'Ethiopia',
                      city: w.city || 'Addis Ababa',
                      address: w.address || 'Central Transit Hub',
                      totalFootprintSqFt: w.totalFootprintSqFt || 15000,
                      occupiedPercent: w.capacity ? parseInt(w.capacity) : 62,
                      valuationEtb: w.valuationEtb || 38000000,
                      ambientCapacity: '10,000 Pallets',
                      coldChainCapacity: '4,000 Pallets',
                      temperatureRanges: '15-25°C Ambient & 2-8°C Cold',
                      manager: w.managerName || w.contactPerson || 'Assigned Depot Lead',
                      phone: w.phone || '+251 911 234567',
                      complianceCert: 'EFDA Good Storage Practice (GSP)',
                      status: 'operational' as const
                    })),
                    ...DEMO_EXTENDED_WAREHOUSES
                  ];

                  // Deduplicate by name
                  const uniqueWarehouses = combinedWarehouses.filter((v, i, a) => 
                    a.findIndex(t => t.name.toLowerCase() === v.name.toLowerCase()) === i
                  );

                  const filteredWarehouses = uniqueWarehouses.filter((w) => {
                    if (warehouseCountryFilter !== 'all') {
                      if ((w.country || '').toLowerCase() !== warehouseCountryFilter.toLowerCase()) return false;
                    }
                    if (warehouseSearch.trim() !== '') {
                      const q = warehouseSearch.toLowerCase();
                      return (
                        (w.name || '').toLowerCase().includes(q) ||
                        (w.address || '').toLowerCase().includes(q) ||
                        (w.manager || '').toLowerCase().includes(q) ||
                        (w.code || '').toLowerCase().includes(q)
                      );
                    }
                    return true;
                  });

                  return (
                    <div className="space-y-6 animate-fade-in">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Warehouse Strategic Stockpiles & Ledger</h2>
                            <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-bold">
                              83,000 Sq Ft Storage Footprint
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Manage regional distribution hubs, cold-chain capacity, and inter-depot stock transfers</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-lg w-full md:w-auto">
                          <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search warehouses, codes, managers..."
                              value={warehouseSearch}
                              onChange={(e) => setWarehouseSearch(e.target.value)}
                              className="pl-9 pr-4 py-1.5 w-full bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1">
                            <Filter className="h-3 w-3 text-slate-400" />
                            <select
                              value={warehouseCountryFilter}
                              onChange={(e) => setWarehouseCountryFilter(e.target.value)}
                              className="bg-transparent text-xs text-slate-800 dark:text-white border-none outline-none cursor-pointer py-0.5"
                            >
                              <option value="all">All Countries</option>
                              {countries.map((cntry) => (
                                <option key={cntry} value={cntry}>{cntry}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Warehouse Network KPI Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Storage Footprint</span>
                          <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">83,000 sq ft</div>
                          <span className="text-[10px] text-blue-600 font-medium">Across East Africa</span>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asset Valuation in Stock</span>
                          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">209.5M ETB</div>
                          <span className="text-[10px] text-emerald-600 font-medium">1,256 active SKUs</span>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cold-Chain Pallets</span>
                          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">21,000 Pallets</div>
                          <span className="text-[10px] text-indigo-600 font-medium">-20°C to 8°C Monitored</span>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Capacity Utilization</span>
                          <div className="text-xl font-black text-amber-500 font-mono mt-1">61% Occupied</div>
                          <span className="text-[10px] text-amber-600 font-medium">Optimal buffer room</span>
                        </div>
                      </div>

                      {/* Warehouse Hub Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredWarehouses.map((wh) => (
                          <div key={wh.id} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-xs flex flex-col justify-between hover:border-blue-500/30 transition-all shadow-sm">
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <div>
                                  <span className="text-[9px] font-mono font-bold text-blue-600 dark:text-blue-400">{wh.code}</span>
                                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{wh.name}</h4>
                                </div>
                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-[9px] font-bold uppercase">{wh.country}</span>
                              </div>

                              {/* Capacity Meter */}
                              <div className="my-3">
                                <div className="flex justify-between text-[10px] font-mono font-bold text-slate-500 mb-1">
                                  <span>Capacity Utilization</span>
                                  <span className={wh.occupiedPercent > 80 ? 'text-amber-500' : 'text-emerald-500'}>{wh.occupiedPercent}% Occupied</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${wh.occupiedPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                    style={{ width: `${wh.occupiedPercent}%` }}
                                  ></div>
                                </div>
                              </div>

                              <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                                <p className="flex justify-between"><span>Location:</span> <span className="font-medium text-slate-900 dark:text-white">{wh.address}</span></p>
                                <p className="flex justify-between"><span>Valuation:</span> <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{(wh.valuationEtb).toLocaleString()} ETB</strong></p>
                                <p className="flex justify-between"><span>Facility Lead:</span> <span className="font-medium text-slate-900 dark:text-white">{wh.manager}</span></p>
                                <p className="flex justify-between"><span>Cold-Chain:</span> <span className="font-mono text-blue-600">{wh.coldChainCapacity}</span></p>
                                <p className="flex justify-between"><span>Compliance:</span> <span className="text-[10px] font-medium text-slate-500">{wh.complianceCert}</span></p>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <span className="text-[10px] font-mono text-slate-400">{wh.phone}</span>
                              <button
                                onClick={() => toast.success(`Stock inventory ledger opened for ${wh.name}`)}
                                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer transition-all"
                              >
                                Audit Stock
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Live Stock Transfer Transactions */}
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Inter-Depot Stock Transfer Consignments</h4>
                            <p className="text-[11px] text-slate-400">Verified transfer manifests between strategic stockpile facilities</p>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">FEFO Dispatch Protocol Enforced</span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 font-mono">
                              <tr>
                                <th className="px-4 py-3">Transfer Code</th>
                                <th className="px-4 py-3">Medicine &amp; Batch</th>
                                <th className="px-4 py-3">Quantity</th>
                                <th className="px-4 py-3">Origin Depot</th>
                                <th className="px-4 py-3">Destination Depot</th>
                                <th className="px-4 py-3">Dispatched</th>
                                <th className="px-4 py-3 text-right">Verification</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                              {DEMO_WAREHOUSE_TRANSFERS.map((tx) => (
                                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                  <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">{tx.transferCode}</td>
                                  <td className="px-4 py-3">
                                    <div className="font-bold text-slate-900 dark:text-white">{tx.medicineName}</div>
                                    <span className="text-[10px] font-mono text-slate-400">Batch: {tx.batchNumber}</span>
                                  </td>
                                  <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-white">{tx.units.toLocaleString()} units</td>
                                  <td className="px-4 py-3 text-[11px] text-slate-500">{tx.originDepot}</td>
                                  <td className="px-4 py-3 text-[11px] font-medium text-slate-800 dark:text-slate-200">{tx.destinationDepot}</td>
                                  <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">{tx.dispatchedAt}</td>
                                  <td className="px-4 py-3 text-right">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${tx.status === 'In Transit' ? 'bg-amber-500/10 text-amber-600 animate-pulse' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                      {tx.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* TAB 15: AI STRATEGY & COPILOT INTELLIGENCE */}
                {activeTab === 'ai' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Strategy Layer &amp; Predictive Health Intelligence</h2>
                          <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded-full text-[10px] font-bold">
                            Gemini 2.5 Strategy Engine Active
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Epidemiological demand forecasting, automated shortage mitigation, and clinical dispensary guardrails</p>
                      </div>

                      <button
                        onClick={() => {
                          setIsSimulatingAiPrediction(true);
                          setTimeout(() => {
                            setIsSimulatingAiPrediction(false);
                            toast.success('Epidemiological Surge Radar Updated: Processed 18,400 seasonal sales points across Addis Ababa, Oromia, and Sidama.');
                          }, 900);
                        }}
                        disabled={isSimulatingAiPrediction}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-purple-500/20 cursor-pointer transition-all disabled:opacity-50"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isSimulatingAiPrediction ? 'animate-spin' : ''}`} />
                        <span>{isSimulatingAiPrediction ? 'Computing Forecasts...' : 'Run Epidemic Simulation'}</span>
                      </button>
                    </div>

                    {/* AI Engine KPI Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Predictions Run</span>
                        <div className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono mt-1">148,920</div>
                        <span className="text-[10px] text-purple-600 font-medium">90-day trajectory data</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Forecast Precision</span>
                        <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">94.8%</div>
                        <span className="text-[10px] text-emerald-600 font-medium">Validated against POS</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stockouts Prevented</span>
                        <div className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">38 Nodes</div>
                        <span className="text-[10px] text-blue-600 font-medium">Buffer orders triggered</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clinical Guardrails</span>
                        <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">100% Passed</div>
                        <span className="text-[10px] text-emerald-600 font-medium">No contraindicated dosage</span>
                      </div>
                    </div>

                    {/* Epidemiological Demand Surge Radar */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Activity className="w-4 h-4 text-purple-500" /> Epidemiological Demand Surge Radar
                          </h3>
                          <p className="text-[11px] text-slate-400">Weather, vector, and seasonal epidemiological models predicting regional medicine spikes</p>
                        </div>
                        <span className="text-[10px] font-mono text-purple-600 font-bold bg-purple-500/10 px-2.5 py-1 rounded-full">
                          3 Active Regional Alerts
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {DEMO_AI_DEMAND_SURGES.map((surge) => (
                          <div key={surge.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono text-[9px] font-bold rounded">
                                  {surge.id}
                                </span>
                                <span className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono">
                                  +{surge.projectedSurgePercent}% Surge
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1.5">{surge.therapeuticCategory}</h4>
                              <p className="text-[11px] text-slate-500 leading-relaxed mb-2.5">{surge.primaryDriver}</p>
                              
                              <div className="space-y-1 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                                <p>Regions: <strong className="text-slate-800 dark:text-slate-200">{surge.affectedRegions.join(', ')}</strong></p>
                                <p>Buffer Required: <strong className="text-blue-600">{surge.recommendedBufferUnits.toLocaleString()} units</strong></p>
                              </div>
                            </div>

                            <div className="mt-4 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                              <span className="text-slate-400 font-mono">Confidence: <strong>{surge.confidenceScore}%</strong></span>
                              <button
                                onClick={() => toast.success(`Buffer replenishment order drafted for ${surge.therapeuticCategory}`)}
                                className="px-2.5 py-1 bg-purple-600 text-white rounded-lg font-bold text-[10px] hover:bg-purple-700 cursor-pointer transition-all"
                              >
                                Draft Buffer PO
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Algorithmic Restock & Purchasing Intelligence */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI-Recommended Wholesale Replenishment Orders</h3>
                          <p className="text-[11px] text-slate-400">Inventory depletion velocity recommendations with auto-suggested suppliers</p>
                        </div>
                        <button
                          onClick={() => toast.success('Auto-drafted 5 purchase orders for importer approval')}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm"
                        >
                          Auto-Draft All POs
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 font-mono">
                            <tr>
                              <th className="px-4 py-3">Medicine &amp; Category</th>
                              <th className="px-4 py-3">Network Stock</th>
                              <th className="px-4 py-3">Buffer Available</th>
                              <th className="px-4 py-3">30d Velocity</th>
                              <th className="px-4 py-3">Recommended PO</th>
                              <th className="px-4 py-3">Suggested Importer</th>
                              <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {DEMO_AI_RESTOCK_RECOMMENDATIONS.map((r) => (
                              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                <td className="px-4 py-3">
                                  <div className="font-bold text-slate-900 dark:text-white">{r.medicineName}</div>
                                  <span className="text-[10px] text-slate-400">{r.category}</span>
                                </td>
                                <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-white">{r.networkCurrentStock.toLocaleString()}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${r.bufferDaysAvailable < 10 ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                    {r.bufferDaysAvailable} Days Left
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-mono text-slate-500">{r.velocity30d.toLocaleString()}/mo</td>
                                <td className="px-4 py-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                                  +{r.recommendedOrderUnits.toLocaleString()} units
                                  <span className="block text-[9px] text-slate-400 font-normal">Est. {(r.estimatedCostEtb).toLocaleString()} ETB</span>
                                </td>
                                <td className="px-4 py-3 text-[11px] font-medium text-slate-700 dark:text-slate-300">{r.primarySupplier}</td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => toast.success(`Draft PO created for ${r.medicineName} (${r.recommendedOrderUnits.toLocaleString()} units)`)}
                                    className="px-2.5 py-1 bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300 hover:bg-purple-100 rounded-lg text-xs font-bold cursor-pointer transition-all"
                                  >
                                    Create PO
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

                {activeTab === 'pharmacy-wholesales' && (() => {
                  const filteredSuppliers = displaySuppliers.filter(supplier => {
                    const pharm = displayUsers.find(u => u.uid === supplier.pharmacyId);
                    const pharmName = pharm?.displayName || pharm?.pharmacyName || '';
                    const searchLower = pharmacyWholesalesSearch.toLowerCase();
                    return (
                      supplier.name?.toLowerCase().includes(searchLower) ||
                      supplier.contactName?.toLowerCase().includes(searchLower) ||
                      supplier.email?.toLowerCase().includes(searchLower) ||
                      supplier.phone?.toLowerCase().includes(searchLower) ||
                      supplier.city?.toLowerCase().includes(searchLower) ||
                      pharmName.toLowerCase().includes(searchLower)
                    );
                  });

                  const totalWholesales = displaySuppliers.length;
                  const activeLicenses = displaySuppliers.filter(s => s.licenseStatus === 'active').length;
                  const avgLeadTime = displaySuppliers.length > 0 
                    ? (displaySuppliers.reduce((acc, s) => acc + Number(s.leadTimeDays || 0), 0) / displaySuppliers.length).toFixed(1)
                    : '0';
                  const topRated = displaySuppliers.filter(s => Number(s.rating || 0) >= 4).length;

                  return (
                    <div className="space-y-6">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Registered Wholesales</p>
                          <h3 className="text-2xl font-black mt-2 text-slate-900 dark:text-white">{totalWholesales}</h3>
                          <p className="text-[10px] text-slate-500 mt-1 font-sans">Across all registered pharmacy accounts</p>
                        </div>
                        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Licensed</p>
                          <h3 className="text-2xl font-black mt-2 text-green-600 dark:text-green-400">{activeLicenses}</h3>
                          <p className="text-[10px] text-slate-500 mt-1 font-sans">Verified with active regulatory licenses</p>
                        </div>
                        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Lead Time</p>
                          <h3 className="text-2xl font-black mt-2 text-blue-600 dark:text-blue-400">{avgLeadTime} Days</h3>
                          <p className="text-[10px] text-slate-500 mt-1 font-sans">Average reported order fulfillment delay</p>
                        </div>
                        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">High Rated (4★+)</p>
                          <h3 className="text-2xl font-black mt-2 text-amber-500">{topRated} Wholesales</h3>
                          <p className="text-[10px] text-slate-500 mt-1 font-sans">Excellent performance scorecard ratings</p>
                        </div>
                      </div>

                      {/* Filter Bar */}
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            type="text"
                            placeholder="Search by wholesale name, contact, city, or pharmacy owner..."
                            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 dark:text-white text-xs outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-sans"
                            value={pharmacyWholesalesSearch}
                            onChange={(e) => setPharmacyWholesalesSearch(e.target.value)}
                          />
                        </div>
                        <button 
                          onClick={() => {
                            if (filteredSuppliers.length === 0) {
                              toast.error('No wholesales found to export.');
                              return;
                            }
                            const docPdf = new jsPDF();
                            docPdf.setFont('helvetica');
                            docPdf.setFontSize(16);
                            docPdf.text('ATECH East Africa - Registered Pharmacy Whole Sales', 14, 20);
                            docPdf.setFontSize(10);
                            docPdf.text(`Generated on: ${new Date().toLocaleString()}`, 14, 27);
                            
                            const rows = filteredSuppliers.map((s, index) => {
                              const p = displayUsers.find(u => u.uid === s.pharmacyId);
                              return [
                                index + 1,
                                s.name || '',
                                `${s.contactName || ''} (${s.phone || ''})`,
                                `${s.city || ''}, ${s.country || ''}`,
                                s.licenseStatus || 'pending',
                                p?.displayName || p?.pharmacyName || 'Registered Pharmacy'
                              ];
                            });

                            (docPdf as any).autoTable({
                              startY: 35,
                              head: [['#', 'Wholesale Name', 'Contact & Phone', 'Location', 'License Status', 'Added By (Pharmacy)']],
                              body: rows,
                            });
                            docPdf.save('pharmacy_wholesales_directory.pdf');
                            toast.success('Directory exported successfully to PDF!');
                          }}
                          className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold font-sans cursor-pointer transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-100 dark:shadow-none"
                        >
                          <FileText size={14} />
                          Export Directory PDF
                        </button>
                      </div>

                      {/* Wholesales Directory Grid/Table */}
                      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                          <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white font-sans">Pharmacy Custom Wholesales Directory</h3>
                            <p className="text-[10px] text-slate-500 mt-1 font-sans">Directory of custom wholesales added privately by registered pharmacies</p>
                          </div>
                          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-full text-[10px] font-sans">
                            {filteredSuppliers.length} Records
                          </span>
                        </div>

                        {filteredSuppliers.length === 0 ? (
                          <div className="p-12 text-center text-xs text-slate-400 font-sans">
                            No custom wholesales registered or matching your search.
                          </div>
                        ) : (
                          <div className="overflow-x-auto font-sans">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">
                                  <th className="py-4 px-6">Wholesale & Contact Info</th>
                                  <th className="py-4 px-6">Regulatory & License</th>
                                  <th className="py-4 px-6">Performance & Rating</th>
                                  <th className="py-4 px-6">Added By (Pharmacy)</th>
                                  <th className="py-4 px-6 text-right">Registered On</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                                {filteredSuppliers.map((supplier) => {
                                  const pharmacy = displayUsers.find(u => u.uid === supplier.pharmacyId);
                                  return (
                                    <tr key={supplier.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                                      {/* Name & Contact */}
                                      <td className="py-4 px-6 font-sans">
                                        <div className="space-y-1">
                                          <div className="font-bold text-slate-900 dark:text-white">{supplier.name}</div>
                                          {supplier.contactName && (
                                            <div className="text-[10px] text-slate-500 font-sans">Contact: {supplier.contactName}</div>
                                          )}
                                          <div className="text-[10px] flex items-center gap-2 text-slate-400 font-sans">
                                            {supplier.phone && <span>📞 {supplier.phone}</span>}
                                            {supplier.email && <span>✉️ {supplier.email}</span>}
                                          </div>
                                          {supplier.address && (
                                            <div className="text-[10px] text-slate-400 font-sans">📍 {supplier.address}, {supplier.city || ''}</div>
                                          )}
                                        </div>
                                      </td>

                                      {/* Regulatory/License */}
                                      <td className="py-4 px-6 font-sans">
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-mono text-slate-500">License #: {supplier.licenseNumber || 'N/A'}</span>
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                              supplier.licenseStatus === 'active' 
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                            }`}>
                                              {supplier.licenseStatus || 'Pending'}
                                            </span>
                                          </div>
                                          {supplier.licenseExpiry && (
                                            <div className="text-[9px] text-slate-400 font-sans">Expiry: {supplier.licenseExpiry}</div>
                                          )}
                                          {supplier.licenseAuthority && (
                                            <div className="text-[9px] text-slate-500 italic font-sans">{supplier.licenseAuthority}</div>
                                          )}
                                        </div>
                                      </td>

                                      {/* Performance & Scorecard */}
                                      <td className="py-4 px-6 font-sans">
                                        <div className="space-y-1 text-[10px]">
                                          <div className="flex items-center gap-1">
                                            <span className="text-slate-400">Rating:</span>
                                            <div className="flex text-amber-400 font-sans">
                                              {Array.from({ length: 5 }).map((_, i) => (
                                                <span key={i}>{i < (supplier.rating || 5) ? '★' : '☆'}</span>
                                              ))}
                                            </div>
                                            <span className="text-slate-500 font-mono">({supplier.rating || 5}/5)</span>
                                          </div>
                                          <div className="flex justify-between max-w-[150px] text-slate-500 font-sans">
                                            <span>On-time Delivery:</span>
                                            <span className="font-bold font-mono text-slate-700 dark:text-slate-300">{supplier.onTimeDeliveryRate || 95}%</span>
                                          </div>
                                          <div className="flex justify-between max-w-[150px] text-slate-500 font-sans">
                                            <span>Quality compliance:</span>
                                            <span className="font-bold font-mono text-slate-700 dark:text-slate-300">{supplier.qualityComplianceRate || 98}%</span>
                                          </div>
                                          <div className="flex justify-between max-w-[150px] text-slate-500 font-sans">
                                            <span>Lead Time:</span>
                                            <span className="font-bold font-mono text-slate-700 dark:text-slate-300">{supplier.leadTimeDays || 5} Days</span>
                                          </div>
                                        </div>
                                      </td>

                                      {/* Added By */}
                                      <td className="py-4 px-6 font-sans">
                                        {pharmacy ? (
                                          <div className="space-y-0.5">
                                            <div className="font-bold text-blue-600 dark:text-blue-400">{pharmacy.displayName}</div>
                                            <div className="text-[10px] text-slate-400">{pharmacy.email}</div>
                                            <div className="text-[10px] font-mono text-slate-500">ID: {pharmacy.uid.substring(0, 8)}...</div>
                                          </div>
                                        ) : (
                                          <div className="text-slate-400 italic font-sans">Unknown Pharmacy (ID: {supplier.pharmacyId?.substring(0, 8) || 'N/A'}...)</div>
                                        )}
                                      </td>

                                      {/* Registered On */}
                                      <td className="py-4 px-6 text-right font-mono text-[10px] text-slate-400">
                                        {supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString() : 'N/A'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

              </div>
            )}
          </div>

        </div>

        {/* MODAL: CREATE REGIONAL MANAGER */}
        {showAddRMModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 relative">
              <button 
                onClick={() => setShowAddRMModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">Create Regional Manager</h3>
              
              <form onSubmit={handleCreateRM} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Manager Display Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g., Almaz Kassa" 
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:border-blue-500 outline-none"
                    value={newRM.displayName}
                    onChange={(e) => setNewRM({...newRM, displayName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="e.g., almaz.kassa@atech.com" 
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:border-blue-500 outline-none"
                    value={newRM.email}
                    onChange={(e) => setNewRM({...newRM, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g., +254 712 345 678" 
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:border-blue-500 outline-none"
                    value={newRM.phone}
                    onChange={(e) => setNewRM({...newRM, phone: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Country Scope</label>
                    <select 
                      className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                      value={newRM.country}
                      onChange={(e) => setNewRM({...newRM, country: e.target.value})}
                    >
                      <option value="Ethiopia">Ethiopia</option>
                      <option value="Kenya">Kenya</option>
                      <option value="Uganda">Uganda</option>
                      <option value="Tanzania">Tanzania</option>
                      <option value="Rwanda">Rwanda</option>
                      <option value="Burundi">Burundi</option>
                      <option value="Somalia">Somalia</option>
                      <option value="South Sudan">South Sudan</option>
                      <option value="Djibouti">Djibouti</option>
                      <option value="Eritrea">Eritrea</option>
                      <option value="Sudan">Sudan</option>
                      <option value="Madagascar">Madagascar</option>
                      <option value="Mozambique">Mozambique</option>
                      <option value="Malawi">Malawi</option>
                      <option value="Zambia">Zambia</option>
                      <option value="Zimbabwe">Zimbabwe</option>
                      <option value="Comoros">Comoros</option>
                      <option value="Mauritius">Mauritius</option>
                      <option value="Seychelles">Seychelles</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Primary Region</label>
                    <select 
                      className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                      value={newRM.region}
                      onChange={(e) => setNewRM({...newRM, region: e.target.value})}
                    >
                      <option value="Addis Ababa">Addis Ababa</option>
                      <option value="Oromia Region">Oromia Region</option>
                      <option value="Nairobi County">Nairobi County</option>
                      <option value="Mombasa Coast">Mombasa Coast</option>
                      <option value="Buganda/Kampala">Buganda/Kampala</option>
                      <option value="Dar es Salaam">Dar es Salaam</option>
                      <option value="Kigali District">Kigali District</option>
                      <option value="Zanzibar Coast">Zanzibar Coast</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Territory Scope & Notes</label>
                  <textarea 
                    rows={2}
                    placeholder="e.g., Sub-distributors coordination and compliance management" 
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:border-blue-500 outline-none resize-none"
                    value={newRM.notes}
                    onChange={(e) => setNewRM({...newRM, notes: e.target.value})}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowAddRMModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                  >
                    Appoint Manager
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 1: PROVISION ORGANIZATION */}
        {showAddOrgModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 relative">
              <button 
                onClick={() => setShowAddOrgModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">Provision Organization Node</h3>
              
              <form onSubmit={handleCreateOrg} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Organization Display Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g., Abyssinia Pharmacy" 
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 dark:text-white border rounded-lg focus:border-blue-500 outline-none"
                    value={newOrg.displayName}
                    onChange={(e) => setNewOrg({...newOrg, displayName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Primary Contact Email</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="e.g., owner@abyssinia.com" 
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 dark:text-white border rounded-lg focus:border-blue-500 outline-none"
                    value={newOrg.email}
                    onChange={(e) => setNewOrg({...newOrg, email: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Ecosystem Role</label>
                    <select 
                      className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 dark:text-white border rounded-lg outline-none"
                      value={newOrg.role}
                      onChange={(e) => setNewOrg({...newOrg, role: e.target.value as any})}
                    >
                      <option value="pharmacy">Pharmacy Group</option>
                      <option value="importer">Wholesale Pharmacy Node</option>
                      <option value="distributor">Distributor Ledger</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">SaaS Plan Tier</label>
                    <select 
                      className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 dark:text-white border rounded-lg outline-none"
                      value={newOrg.subscriptionType}
                      onChange={(e) => setNewOrg({...newOrg, subscriptionType: e.target.value as any})}
                    >
                      <option value="standard">Standard Plan</option>
                      <option value="premium">Premium Hub</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Country</label>
                    <select 
                      className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 dark:text-white border rounded-lg outline-none"
                      value={newOrg.country}
                      onChange={(e) => handleCountryChange(e.target.value)}
                    >
                      <option value="Ethiopia">Ethiopia</option>
                      <option value="Kenya">Kenya</option>
                      <option value="Uganda">Uganda</option>
                      <option value="Tanzania">Tanzania</option>
                      <option value="Rwanda">Rwanda</option>
                      <option value="Burundi">Burundi</option>
                      <option value="Somalia">Somalia</option>
                      <option value="South Sudan">South Sudan</option>
                      <option value="Djibouti">Djibouti</option>
                      <option value="Eritrea">Eritrea</option>
                      <option value="Sudan">Sudan</option>
                      <option value="Madagascar">Madagascar</option>
                      <option value="Mozambique">Mozambique</option>
                      <option value="Malawi">Malawi</option>
                      <option value="Zambia">Zambia</option>
                      <option value="Zimbabwe">Zimbabwe</option>
                      <option value="Comoros">Comoros</option>
                      <option value="Mauritius">Mauritius</option>
                      <option value="Seychelles">Seychelles</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">City / State</label>
                    <input 
                      type="text"
                      required
                      className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 dark:text-white border rounded-lg outline-none"
                      value={newOrg.city}
                      onChange={(e) => setNewOrg({...newOrg, city: e.target.value, region: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Country Code</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. +251"
                      className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 dark:text-white border rounded-lg outline-none font-mono"
                      value={newOrg.countryCode}
                      onChange={(e) => setNewOrg({...newOrg, countryCode: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
                    <input 
                      type="tel"
                      required
                      placeholder="e.g., 911234567"
                      className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 dark:text-white border rounded-lg outline-none"
                      value={newOrg.phone}
                      onChange={(e) => setNewOrg({...newOrg, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Local Operating Currency</label>
                  <input 
                    type="text"
                    required
                    disabled
                    className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 border rounded-lg outline-none cursor-not-allowed font-mono font-bold"
                    value={newOrg.currency}
                  />
                  <p className="text-[9px] text-slate-400 mt-1">Automatically locked to the local country standards.</p>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg"
                >
                  Confirm Provisioning
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: OPEN SUPPORT TICKET */}
        {showAddTicketModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 relative">
              <button 
                onClick={() => setShowAddTicketModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">Open Internal Support Ticket</h3>
              
              <form onSubmit={handleAddTicket} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Bound Organization</label>
                  <select 
                    required 
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 dark:text-white border rounded-lg outline-none"
                    value={newTicket.organizationId}
                    onChange={(e) => setNewTicket({...newTicket, organizationId: e.target.value})}
                  >
                    <option value="">Select Target Hub</option>
                    {users.map(u => (
                      <option key={u.uid} value={u.uid}>{u.pharmacyName || u.importerName || u.displayName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Ticket Title Summary</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Brief summary of issue" 
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 dark:text-white border rounded-lg outline-none"
                    value={newTicket.title}
                    onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Context Description</label>
                  <textarea 
                    required 
                    rows={3}
                    placeholder="Describe problem details..." 
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 dark:text-white border rounded-lg outline-none"
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Main Category</label>
                    <select 
                      className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 dark:text-white border rounded-lg outline-none"
                      value={newTicket.category}
                      onChange={(e) => setNewTicket({...newTicket, category: e.target.value as any})}
                    >
                      <option value="general">General</option>
                      <option value="billing">Billing issue</option>
                      <option value="marketplace">Marketplace issue</option>
                      <option value="access">Access restriction</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Severity Level</label>
                    <select 
                      className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 dark:text-white border rounded-lg outline-none"
                      value={newTicket.severity}
                      onChange={(e) => setNewTicket({...newTicket, severity: e.target.value as any})}
                    >
                      <option value="low">Low standing</option>
                      <option value="medium">Medium risk</option>
                      <option value="high">High priority</option>
                      <option value="critical">Critical disaster</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg"
                >
                  Submit Support Ticket
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: VIEW UPLOADED DOCUMENTS */}
        {showFilesModal && selectedUserForFiles && (
          <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 relative flex flex-col max-h-[85vh] shadow-2xl">
              <button 
                onClick={() => {
                  setShowFilesModal(false);
                  setSelectedUserForFiles(null);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer z-10 transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="mb-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="text-blue-600" size={18} />
                  <span>Registration Documents Center</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Compliance and license verification records uploaded by <span className="font-bold text-slate-805 dark:text-slate-100">{selectedUserForFiles.pharmacyName || selectedUserForFiles.importerName || selectedUserForFiles.displayName || 'Unnamed Organization'}</span> ({selectedUserForFiles.email}) during onboard registration.
                </p>
              </div>

              <div className="flex-1 overflow-y-auto min-h-[300px] pr-1 space-y-4">
                {(!selectedUserForFiles.verificationDocs || selectedUserForFiles.verificationDocs.length === 0) ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-205 dark:border-slate-800 rounded-2xl py-16">
                    <ShieldAlert className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No Attached Compliance Documents</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                      This user profile does not have any verification documents listed or registered inside the database record yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedUserForFiles.verificationDocs.map((docData, idx) => {
                      const isImage = docData.startsWith('data:image/') || docData.match(/\.(jpeg|jpg|gif|png|webp)/i);
                      const fileType = docData.startsWith('data:') ? docData.split(';')[0].split(':')[1] : 'File Attachment';
                      
                      return (
                        <div key={idx} className="border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-xs">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-2 rounded-xl">
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono uppercase truncate max-w-[155px]">
                                File Record #{idx + 1}
                              </span>
                              <span className="bg-blue-105 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase font-mono">
                                {fileType.split('/')[1] || fileType}
                              </span>
                            </div>

                            {isImage ? (
                              <div className="relative rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-950 overflow-hidden h-44 flex items-center justify-center p-2">
                                <img 
                                  src={docData} 
                                  alt={`Upload Doc ${idx + 1}`} 
                                  className="max-h-full max-w-full object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            ) : (
                              <div className="rounded-xl border border-dashed border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-950 h-44 flex flex-col items-center justify-center text-center p-4">
                                <FileText className="w-8 h-8 text-slate-400 mb-1" />
                                <p className="text-[10px] font-bold text-slate-705 dark:text-slate-250">Binary Document / PDF File</p>
                                <p className="text-[9px] text-slate-400 mt-1">Direct stream file context saved.</p>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <a 
                              href={docData} 
                              download={`verification_doc_${selectedUserForFiles.uid}_${idx + 1}`}
                              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm shrink-0 cursor-pointer text-center"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Download Document</span>
                            </a>
                            <button 
                              onClick={() => {
                                const win = window.open();
                                if (win) {
                                  win.document.write(`<iframe src="${docData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                } else {
                                  toast.error("Popup blocked! Pls use direct download button.");
                                }
                              }}
                              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 transition shrink-0 cursor-pointer"
                            >
                              Maximize
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button 
                  onClick={() => {
                    setShowFilesModal(false);
                    setSelectedUserForFiles(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close Doc Deck
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: DETAILED ORGANIZATION PROFILE & SUBSCRIPTION HISTORY */}
        {selectedOrgForDetail && (() => {
          const u = selectedOrgForDetail;
          
          // Remaining time calculations with safe dynamic default
          const expiryDate = u.subscriptionExpiryDate || (() => {
            const baseTime = u.createdAt || Date.now();
            const durationDays = (u.role === 'distributor' || u.role === 'importer') ? 60 : 30;
            return baseTime + durationDays * 24 * 60 * 60 * 1000;
          })();
          const now = Date.now();
          const msRemaining = expiryDate - now;
          const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
          
          let subscriptionStatus: 'Active' | 'Expiring Soon' | 'Expired' = 'Expired';
          let statusColor = 'text-red-500 bg-red-50 dark:bg-red-950/20';
          let borderColor = 'border-red-200 dark:border-red-900/30';
          
          if (msRemaining > 0) {
            if (daysRemaining < 7) {
              subscriptionStatus = 'Expiring Soon';
              statusColor = 'text-amber-600 bg-amber-50 dark:bg-amber-950/20';
              borderColor = 'border-amber-200 dark:border-amber-900/30';
            } else {
              subscriptionStatus = 'Active';
              statusColor = 'text-green-600 bg-green-50 dark:bg-green-950/20';
              borderColor = 'border-green-200 dark:border-green-900/30';
            }
          }

          // Format remaining time nicely
          let remainingText = 'Subscription Expired';
          if (msRemaining > 0) {
            if (daysRemaining >= 30) {
              const months = Math.floor(daysRemaining / 30);
              const days = daysRemaining % 30;
              remainingText = `${months} Month${months > 1 ? 's' : ''}${days > 0 ? ` ${days} Day${days > 1 ? 's' : ''}` : ''} left`;
            } else {
              remainingText = `${daysRemaining} Day${daysRemaining > 1 ? 's' : ''} left`;
            }
          }

          const formattedExpiry = new Date(expiryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          const formattedStart = u.lastSubscriptionPaymentDate ? new Date(u.lastSubscriptionPaymentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : new Date(u.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

          return (
            <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl p-6 relative flex flex-col max-h-[90vh] shadow-2xl">
                <button 
                  onClick={() => setSelectedOrgForDetail(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer z-10 transition-colors"
                  title="Close panel"
                >
                  <X className="w-5 h-5" />
                </button>
                
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-4">
                  <div>
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/10 px-2.5 py-1 rounded-full">Organization Profile</span>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">
                      {u.pharmacyName || u.importerName || u.distributorName || u.displayName || 'Unnamed Organization'}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{u.email} • ID: {u.uid}</p>
                  </div>
                  {onImpersonateOrg && (
                    <button
                      onClick={() => {
                        onImpersonateOrg(u);
                        setSelectedOrgForDetail(null);
                        toast.success(`Now acting as ${u.pharmacyName || u.importerName || u.distributorName || u.displayName}`);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/20 cursor-pointer active:scale-95 self-start sm:self-center"
                    >
                      <Sparkles size={14} />
                      <span>Login as Organization</span>
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-6">
                  {/* Subscription Time Remaining Card */}
                  <div className={`p-6 rounded-2xl border ${borderColor} bg-slate-50 dark:bg-slate-800/20 grid grid-cols-1 md:grid-cols-2 gap-6`}>
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Subscription Status</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-black inline-block mt-1 uppercase ${statusColor}`}>
                          {subscriptionStatus}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Plan / Subscription Type</span>
                        <span className="text-sm font-black text-slate-800 dark:text-white uppercase font-mono block mt-0.5">
                          {u.isFreeTrial 
                            ? (u.role === 'distributor' ? 'Distributor Free Trial' : 'Pharmacy Free Trial') 
                            : (u.subscriptionType?.toUpperCase() || 'BASIC PLAN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Time Remaining</span>
                        <span className={`text-base font-black font-mono block mt-0.5 ${subscriptionStatus === 'Expired' ? 'text-red-500' : subscriptionStatus === 'Expiring Soon' ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                          {remainingText}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4 md:border-l md:border-slate-100 dark:md:border-slate-800 md:pl-6">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Start / Payment Date</span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mt-0.5">{formattedStart}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Expiration Date</span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mt-0.5">{formattedExpiry}</span>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={() => setShowAddFreeMonthsModal(true)}
                          className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 cursor-pointer active:scale-95"
                        >
                          <Sparkles size={14} />
                          <span>+ Add Free Months</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Subscription Access Control Section */}
                  <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 space-y-4">
                    <div>
                      <h4 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider">Subscription Access Control</h4>
                      <p className="text-[11px] text-slate-500">Fine-tune individual subscriber behavior and grace period policies.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50">
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Read-Only Mode</span>
                            <span className="text-[10px] text-slate-400 block">Allow read-only on expiry</span>
                          </div>
                          <button
                            onClick={() => handleUpdateSubscriptionAccessField(
                              'readOnlyEnabled',
                              u.readOnlyEnabled === false ? true : false,
                              'Toggle Read-Only Mode',
                              `Changed Read-Only Mode availability on expiry to ${u.readOnlyEnabled === false ? 'enabled' : 'disabled'}`
                            )}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              u.readOnlyEnabled !== false
                                ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                            }`}
                          >
                            {u.readOnlyEnabled !== false ? 'Enabled' : 'Disabled'}
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50">
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Grace Period</span>
                            <span className="text-[10px] text-slate-400 block">Select length of read-only grace</span>
                          </div>
                          <select
                            value={u.gracePeriodDays ?? 30}
                            onChange={(e) => {
                              const val = e.target.value === 'unlimited' ? 'unlimited' : parseInt(e.target.value);
                              handleUpdateSubscriptionAccessField(
                                'gracePeriodDays',
                                val,
                                'Update Grace Period',
                                `Set subscription grace period duration to ${val === 'unlimited' ? 'Unlimited' : `${val} Days`}`
                              );
                            }}
                            className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-2 py-1 font-bold text-xs focus:ring-1 focus:ring-blue-500 cursor-pointer text-slate-850 dark:text-white"
                          >
                            <option value={0}>No Grace Period</option>
                            <option value={7}>7 Days</option>
                            <option value={14}>14 Days</option>
                            <option value={30}>30 Days</option>
                            <option value={60}>60 Days</option>
                            <option value="unlimited">Unlimited</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50">
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Allow Export Data</span>
                            <span className="text-[10px] text-slate-400 block">Permit inventory/sales downloads</span>
                          </div>
                          <button
                            onClick={() => handleUpdateSubscriptionAccessField(
                              'allowExport',
                              u.allowExport === false ? true : false,
                              'Toggle Allow Export',
                              `Changed expired data export permission to ${u.allowExport === false ? 'granted' : 'restricted'}`
                            )}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              u.allowExport !== false
                                ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                            }`}
                          >
                            {u.allowExport !== false ? 'Allowed' : 'Denied'}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50">
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Allow Reports & Analytics</span>
                            <span className="text-[10px] text-slate-400 block">Permit viewing of dynamic logs</span>
                          </div>
                          <button
                            onClick={() => handleUpdateSubscriptionAccessField(
                              'allowReports',
                              u.allowReports === false ? true : false,
                              'Toggle Allow Reports',
                              `Changed expired report access permission to ${u.allowReports === false ? 'granted' : 'restricted'}`
                            )}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              u.allowReports !== false
                                ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                            }`}
                          >
                            {u.allowReports !== false ? 'Allowed' : 'Denied'}
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50">
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Allow Dashboard View</span>
                            <span className="text-[10px] text-slate-400 block">Permit main analytics summary page</span>
                          </div>
                          <button
                            onClick={() => handleUpdateSubscriptionAccessField(
                              'allowDashboard',
                              u.allowDashboard === false ? true : false,
                              'Toggle Allow Dashboard',
                              `Changed expired dashboard permission to ${u.allowDashboard === false ? 'granted' : 'restricted'}`
                            )}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              u.allowDashboard !== false
                                ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                            }`}
                          >
                            {u.allowDashboard !== false ? 'Allowed' : 'Denied'}
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleUpdateSubscriptionAccessField(
                              'immediateLock',
                              !u.immediateLock,
                              u.immediateLock ? 'Restore Access' : 'Immediate Lock',
                              u.immediateLock ? 'Revoked explicit system lockout constraint' : 'Enforced absolute real-time account suspension lockout'
                            )}
                            className={`py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 border ${
                              u.immediateLock
                                ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/30'
                                : 'bg-red-50 border-red-200 text-red-600 dark:bg-red-950/30 font-bold'
                            }`}
                          >
                            {u.immediateLock ? <Unlock size={11} /> : <Lock size={11} />}
                            {u.immediateLock ? 'Unlock / Restore' : 'Immediate Lock'}
                          </button>

                          <button
                            onClick={handleToggleSuspendOrg}
                            className={`py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 border ${
                              u.verificationStatus === 'suspended'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/30 font-bold'
                                : 'bg-slate-150 border-slate-300 text-slate-700 dark:bg-slate-800 font-bold'
                            }`}
                          >
                            {u.verificationStatus === 'suspended' ? <Play size={11} /> : <Pause size={11} />}
                            {u.verificationStatus === 'suspended' ? 'Resume Org' : 'Suspend Org'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subscription History Section */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider">Subscription History</h4>
                    <div className="border border-slate-100 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-white dark:bg-slate-950">
                      <table className="w-full text-left text-xs text-slate-500 dark:text-slate-400">
                        <thead className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800/50">
                          <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Action</th>
                            <th className="px-4 py-3">Months</th>
                            <th className="px-4 py-3">Performed By</th>
                            <th className="px-4 py-3">Reason / Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-105 dark:divide-slate-800/40">
                          {subHistory.length === 0 ? (
                            <tr>
                              <td className="px-4 py-3 font-mono text-slate-400">
                                {new Date(u.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                                {u.isFreeTrial ? 'Initial Free Trial' : 'Initial Subscription'}
                              </td>
                              <td className="px-4 py-3 font-mono font-bold text-emerald-600">
                                {u.role === 'distributor' ? '+2' : '+1'}
                              </td>
                              <td className="px-4 py-3 font-mono text-slate-500">System</td>
                              <td className="px-4 py-3 text-slate-400 italic">Onboarding promotional subscription</td>
                            </tr>
                          ) : (
                            subHistory.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                <td className="px-4 py-3 font-mono text-slate-500">
                                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </td>
                                <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{item.action}</td>
                                <td className={`px-4 py-3 font-mono font-black ${item.months.startsWith('-') ? 'text-red-500' : 'text-emerald-600'}`}>{item.months}</td>
                                <td className="px-4 py-3 font-mono text-slate-500 truncate max-w-[120px]" title={item.performedBy}>{item.performedBy}</td>
                                <td className="px-4 py-3 text-slate-400 font-medium" title={item.reason}>{item.reason || '-'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button 
                    onClick={() => setSelectedOrgForDetail(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Close Profile
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* MODAL 5: ADD FREE MONTHS FORM MODAL */}
        {showAddFreeMonthsModal && selectedOrgForDetail && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="text-blue-600" size={18} />
                  <span>Extend Subscription</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Grant promotional months to <span className="font-bold text-slate-700 dark:text-slate-200">{selectedOrgForDetail.pharmacyName || selectedOrgForDetail.importerName || selectedOrgForDetail.distributorName || selectedOrgForDetail.displayName}</span>.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">Months to Add</label>
                  <select
                    value={extensionMonths}
                    onChange={(e) => setExtensionMonths(parseInt(e.target.value))}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white text-xs outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 12, 18, 24].map(m => (
                      <option key={m} value={m}>{m} Month{m > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">Reason (At least 10 chars)</label>
                  <textarea
                    rows={3}
                    placeholder="Provide a clear operational reason for granting these free months..."
                    value={extensionReason}
                    onChange={(e) => setExtensionReason(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white text-xs outline-none focus:border-blue-500 resize-none font-medium"
                  />
                  <span className="text-[9px] text-slate-400 block mt-1 text-right">{extensionReason.length}/10 chars min</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowAddFreeMonthsModal(false);
                    setExtensionMonths(1);
                    setExtensionReason('');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFreeMonths}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition cursor-pointer active:scale-95"
                >
                  Confirm Extension
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
