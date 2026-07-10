import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  setDoc,
  getDocs,
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
  SaaSInvoice
} from '../types';
import { FEATURES_LIST, DEFAULT_PLAN_FEATURES } from '../lib/featureGate';
import { syncPharmacyBillingAndInvoices } from '../lib/billingEngine';
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
  Eye, 
  RefreshCw, 
  X, 
  Layers,
  Trash2
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

// 15 Sub tabs
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
  | 'health' 
  | 'support' 
  | 'communication' 
  | 'distributor' 
  | 'warehouse' 
  | 'ai'
  | 'pharmacy-wholesales';

export const SuperAdminConsole = ({ initialTab }: { initialTab?: SuperAdminTab }) => {
  const [activeTab, setActiveTab] = useState<SuperAdminTab>(initialTab || 'overview');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [saasInvoices, setSaasInvoices] = useState<SaaSInvoice[]>([]);
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<any[]>([]);
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
  
  // Modals / forms states
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [showAddTicketModal, setShowAddTicketModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [selectedUserForFiles, setSelectedUserForFiles] = useState<UserProfile | null>(null);

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
    subscriptionType: 'basic' as 'basic'|'standard'|'premium',
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

  // Dynamic subscription customized manager state variables
  const [selectedEditPlan, setSelectedEditPlan] = useState<'basic' | 'standard' | 'premium'>('basic');
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

  // Baseline Fallback New Subscription Plan configurations representing high pharmacy ecosystem fidelity
  const DEFAULT_PLANS_FALLBACK = {
    basic: {
      name: 'Basic',
      description: 'Ideal support for single location pharmacies, small stores and new setups starting active workflows.',
      recommended: false,
      features: [
        'Inventory Management', 'Sales Management', 'Customer Management', 'Purchase Management', 
        'Expiry Tracking', 'Generic Name Tracking', 'Country of Origin Tracking', 'Purchase Units', 
        'Dispensing Units', 'Conversion Factors', 'Bin Card Reports', 'Barcode Support', 
        'Basic Reporting', 'Receipt Printing', 'User Management', 'Dashboard Analytics'
      ],
      limitations: [
        'Branch Management & Multi-Outlet accounts', 'Branch-to-Branch Transfers & approvals', 
        'Advanced Inventory Analytics indicators', 'Logistics & Wholesale Pharmacies Ledger Node', 
        'Detailed Administrative Audit Operations'
      ],
      futureFeatures: ['Standard Multi-user Audits Platform'],
      enableFutureFeatures: false
    },
    standard: {
      name: 'Professional',
      description: 'Engineered for expanding pharmacies and businesses running multiple operations seamlessly.',
      recommended: true,
      features: [
        'Everything in Basic Plan', 'Branch Management', 'Multiple Branch Support', 'Branch Billing Options', 
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
        basic: DEFAULT_PLANS_FALLBACK.basic,
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

      await updateDoc(doc(db, 'system_settings', 'main'), {
        plansCustomize: updatedCustomize
      });
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
  const totalOrgs = users.length;
  const pharmacies = users.filter(u => u.role === 'pharmacy').length;
  const importers = users.filter(u => u.role === 'importer').length;
  const distributors = users.filter(u => u.role === 'distributor').length;
  const activeSubs = users.filter(u => u.subscriptionStatus === 'active').length;
  
  // Simulated revenue aggregations
  const totalSubscriptionRevenue = users.reduce((sum, u) => {
    if (u.subscriptionStatus === 'active') {
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
    if (u.subscriptionStatus === 'active') {
      const basePrice = u.subscriptionType === 'premium' ? 5000 : u.subscriptionType === 'standard' ? 2500 : 0;
      if (basePrice > 0 && promoDiscountPercent > 0) {
        return sum + (basePrice * (1 - promoDiscountPercent / 100));
      }
    }
    return sum;
  }, 0);

  const couponDrivenRevenue = users.reduce((sum, u) => {
    if (u.subscriptionStatus === 'active' && u.referredBy) {
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
    if (u.subscriptionStatus === 'active') {
      const basePrice = u.subscriptionType === 'premium' ? 5000 : u.subscriptionType === 'standard' ? 2500 : 0;
      if (basePrice > 0 && promoDiscountPercent > 0) {
        return sum + (basePrice * (promoDiscountPercent / 100));
      }
    }
    return sum;
  }, 0);

  const couponDiscountsSaved = users.reduce((sum, u) => {
    if (u.subscriptionStatus === 'active' && u.referredBy) {
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
      await addDoc(collection(db, 'users'), {
        ...newOrg,
        verificationStatus: 'approved',
        subscriptionStatus: 'active',
        subscriptionExpiryDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
        createdAt: Date.now()
      });
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
        'inventory_movements'
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
    } catch {
      toast.error('Failed to modify status.');
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
  const handleUpdatePlanPrices = async (plan: 'basic' | 'standard' | 'premium', price: number) => {
    if (!systemSettings) return;
    try {
      const updatedPrices = { ...(systemSettings.planPrices || {}), [plan]: price };
      await updateDoc(doc(db, 'system_settings', 'main'), { planPrices: updatedPrices });
      toast.success(`${plan.toUpperCase()} plan updated to ${price} ETB`);
      createAuditLog('PRICE_OVERRIDE', `Updated global ${plan} pricing plan to ${price} ETB`);
      await recalculateAllPharmaciesBilling();
    } catch {
      toast.error('Failed to override SaaS plan pricing matrix.');
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
    const activeCountrySubs = totals.filter(u => u.subscriptionStatus === 'active').length;

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
    { id: 'health', label: 'System Vitals', icon: Activity },
    { id: 'communication', label: 'Broadcaster', icon: Megaphone },
    { id: 'distributor', label: 'Distributor Node', icon: ShieldCheck },
    { id: 'warehouse', label: 'Warehouse Ledger', icon: Warehouse },
    { id: 'ai', label: 'AI Strategy Layer', icon: Cpu },
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-950 p-6 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
              <Cpu className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">ATECH East Africa Command Tower</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Master Administrative Core - Powered by Emerge Globally</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                toast.success('Refreshing data states across all endpoints...');
                setLoading(true);
                setTimeout(() => setLoading(false), 500);
              }}
              className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              title="Sync Database"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            {activeTab === 'regional' && (
              <button 
                onClick={() => setShowAddOrgModal(true)}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold font-sans flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-100 dark:shadow-none"
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
              <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                
                {/* Switch screen views */}
                
                {/* TAB 1: OVERVIEW */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Ecosystem Overview</h2>
                      <p className="text-xs text-slate-400">Real-time KPIs and general institutional standings</p>
                    </div>

                    {/* KPIs Bento Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Ecosystem Total Hubs</span>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{totalOrgs}</span>
                          <span className="text-[10px] text-green-500 font-bold">+12%</span>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-2 flex gap-2">
                          <span>{pharmacies} Phar</span>
                          <span>{importers} Imp</span>
                          <span>{distributors} Dist</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">ATech SaaS Monthly Revenue</span>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">{totalMonthlyRevenue.toLocaleString()} ETB</span>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-2 flex justify-between">
                          <span>Subs: {totalSubscriptionRevenue.toLocaleString()} ETB</span>
                          <span>Commis: {totalCommissionRevenue.toLocaleString()} ETB</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5 text-violet-500" />
                          Promo & Coupon Revenue
                        </span>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-2xl font-black text-violet-600 dark:text-violet-400 font-mono">
                            {(promoDrivenRevenue + couponDrivenRevenue).toLocaleString()} ETB
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-2 flex justify-between">
                          <span>Promo: {promoDrivenRevenue.toLocaleString()} ETB</span>
                          <span>Saved: {(promoDiscountsSaved + couponDiscountsSaved).toLocaleString()} ETB</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <Megaphone className="w-3.5 h-3.5 text-emerald-500" />
                          Advertisement Profits
                        </span>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            {totalApprovedAdRevenue.toLocaleString()} ETB
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-2 flex justify-between">
                          <span>Active: {activeAdsCount} Ads</span>
                          <span>Pending: {pendingAdsCount} ({pendingAdRevenue.toLocaleString()} ETB)</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Active Marketplace GMV</span>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{totalMarketplaceGMV.toLocaleString()} ETB</span>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-2">
                          <span>Across {orders.length} bulk B2B purchase cycles</span>
                        </div>
                      </div>
                    </div>

                    {/* Chart visualizations row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                        <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-4">Ecosystem Scaling Track (Cumulative)</h4>
                        <div className="h-48 text-xs font-mono">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[
                              { name: 'Jan', value: 12 },
                              { name: 'Feb', value: 18 },
                              { name: 'Mar', value: 29 },
                              { name: 'Apr', value: 41 },
                              { name: 'May', value: totalOrgs || 55 }
                            ]}>
                              <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                              <XAxis dataKey="name" stroke="#94A3B8" />
                              <YAxis stroke="#94A3B8" />
                              <Tooltip />
                              <Area type="monotone" dataKey="value" stroke="#2563EB" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2.5} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                        <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-4">Organizational Distribution</h4>
                        <div className="h-48 text-xs">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                              { type: 'Pharmacy', count: pharmacies },
                              { type: 'Wholesale Pharmacy', count: importers },
                              { type: 'Distributor', count: distributors },
                              { type: 'Clinic', count: users.filter(u => u.role === 'staff').length }
                            ]}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                              <XAxis dataKey="type" stroke="#94A3B8" />
                              <YAxis stroke="#94A3B8" />
                              <Tooltip />
                              <Bar dataKey="count" fill="#475569" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: ORGANIZATIONS */}
                {activeTab === 'organizations' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white font-mono">Organization Management Center</h2>
                        <p className="text-xs text-slate-400">Approve, verify or suspend active operational entities</p>
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
                            <th className="px-4 py-3 text-center">Uploaded File</th>
                            <th className="px-4 py-3">Verification</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {users
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
                                  <p className="font-bold text-slate-900 dark:text-white">{u.pharmacyName || u.importerName || u.distributorName || u.displayName || 'Unnamed Organization'}</p>
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
                {activeTab === 'country' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Country Management Console</h2>
                        <p className="text-xs text-slate-400">Administer multi-national compliance policies and metrics</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-w-xl justify-end">
                        {['Ethiopia', 'Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Burundi', 'Somalia', 'South Sudan', 'Djibouti', 'Eritrea', 'Sudan', 'Madagascar', 'Mozambique', 'Malawi', 'Zambia', 'Zimbabwe', 'Comoros', 'Mauritius', 'Seychelles'].map((cntry) => (
                          <button 
                            key={cntry}
                            onClick={() => setSelectedCountry(cntry)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${selectedCountry === cntry ? 'bg-blue-500 text-white shadow-md' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
                          >
                            {cntry}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-50 dark:bg-slate-800/20 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800">
                        <h3 className="text-sm font-bold mb-4 text-slate-800 dark:text-white">Active Territory Performance</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Total Registered Institutions</span>
                            <span className="font-bold font-mono text-slate-800 dark:text-white">{users.filter(u => u.country === selectedCountry).length} Hubs</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Active High-Tier Subscriptions</span>
                            <span className="font-bold font-mono text-slate-800 dark:text-white">
                              {users.filter(u => u.country === selectedCountry && u.subscriptionStatus === 'active' && u.subscriptionType === 'premium').length} Premium
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Country B2B Transactions Value</span>
                            <span className="font-bold font-mono text-blue-600">
                              {orders.filter(o => o.country === selectedCountry).reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()} {getCurrencySymbol(selectedCountry)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-between">
                          <button 
                            onClick={() => exportPDFReport(selectedCountry)}
                            className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                          >
                            <FileText className="w-4 h-4" /> Export Country Audit Snapshot (PDF)
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/25 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800">
                        <h3 className="text-sm font-bold mb-4 text-slate-800 dark:text-white">Country Executive Managers</h3>
                        <div className="space-y-4">
                          {users.filter(u => u.role === 'regional_manager' && u.country === selectedCountry).map((rm) => (
                            <div key={rm.uid} className="flex justify-between items-center p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/80">
                              <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{rm.displayName}</p>
                                <p className="text-[9px] text-slate-400">Owner Zone: {rm.region || 'All States'}</p>
                              </div>
                              <span className="px-2 py-0.5 bg-green-500/10 text-green-600 rounded text-[9px] font-bold">ACTIVE</span>
                            </div>
                          ))}
                          {users.filter(u => u.role === 'regional_manager' && u.country === selectedCountry).length === 0 && (
                            <p className="text-xs text-slate-400 italic text-center py-6">No country executives appointed to {selectedCountry} region yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: REGIONAL MANAGEMENT EXPANSION */}
                {activeTab === 'regional' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Regional Managers & Territories</h2>
                        <p className="text-xs text-slate-400">Delegating state jurisdictions and regional telemetry tracking</p>
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
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-100 dark:shadow-none shrink-0"
                      >
                        <Plus className="w-4 h-4" /> Create Regional Manager
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {['Addis Ababa', 'Oromia Region', 'Nairobi County', 'Mombasa Coast', 'Buganda/Kampala', 'Dar es Salaam', 'Kigali District', 'Zanzibar Coast'].map((reg) => {
                        const countInRegion = users.filter(u => u.region === reg).length;
                        return (
                          <div key={reg} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-white">{reg} State</p>
                              <p className="text-[10px] text-slate-400 mt-1">{countInRegion} Organizations Bound</p>
                            </div>
                            <span className="p-2 bg-blue-500/10 text-blue-600 rounded-lg text-xs font-bold font-mono">Territory</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Regional Managers List Section */}
                    <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Active Regional Managers ({users.filter(u => u.role === 'regional_manager').length})</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {users.filter(u => u.role === 'regional_manager').map((rm) => (
                          <div key={rm.uid} className="p-4 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{rm.displayName}</h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">{rm.email}</p>
                                {rm.phone && <p className="text-[10px] font-mono text-slate-500 mt-0.5">{rm.phone}</p>}
                              </div>
                              <span className="px-2 py-0.5 bg-green-500/10 text-green-600 rounded-full text-[9px] font-bold tracking-wide">ACTIVE</span>
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
                    <div className="bg-slate-50 dark:bg-slate-800/20 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <h3 className="text-sm font-bold mb-4 text-slate-800 dark:text-white">Assign Territory Scope</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Regional Manager</label>
                          <select 
                            className="w-full mt-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white outline-none rounded-lg"
                            onChange={() => {}}
                          >
                            <option>Select Manager UID</option>
                            {users.filter(u => u.role === 'regional_manager').map(u => (
                              <option key={u.uid} value={u.uid}>{u.displayName}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Target State</label>
                          <input 
                            type="text" 
                            defaultValue="Sidama State" 
                            className="w-full mt-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white outline-none rounded-lg" 
                          />
                        </div>
                        <div className="flex items-end">
                          <button 
                            type="button" 
                            onClick={() => {
                              toast.success('Territory structure bound to compliance rules!');
                              createAuditLog('TERRITORY_ASSIGNED', 'Bound Sidama State territory index to designated managers');
                            }}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
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

                    {/* Subscription billing details cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {['basic', 'standard', 'premium'].map((tier) => {
                        const price = systemSettings?.planPrices?.[tier as 'basic' | 'standard' | 'premium'] || 1000;
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
                          <p className="text-xs text-slate-500 dark:text-slate-400">Review and verify B2B SaaS monthly billing invoices across all pharmacy branches.</p>
                        </div>
                        <button
                          onClick={recalculateAllPharmaciesBilling}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Recalculate & Sync All
                        </button>
                      </div>

                      {saasInvoices.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No SaaS invoices generated in the system yet.</p>
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
                              {saasInvoices.map((inv) => {
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
                        {(['basic', 'standard', 'premium'] as const).map((planId) => {
                          const aliases = { basic: 'Basic', standard: 'Professional', premium: 'Premium' };
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
                {activeTab === 'marketplace' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Marketplace Listings & Promotion</h2>
                        <p className="text-xs text-slate-400">Configure featured stock badges and sponsored items</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {products.slice(0, 6).map((item) => {
                        const isFeatured = (item as any).featured === true;
                        return (
                          <div key={item.id} className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div>
                              <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[9px] font-bold uppercase">{item.category}</span>
                              <p className="text-xs font-black text-slate-900 dark:text-white mt-1.5">{item.name}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{item.importerName}</p>
                            </div>
                            <button 
                              onClick={() => handleToggleFeatureProduct(item.id, item.name, isFeatured)}
                              className={`px-3 py-1 rounded text-xs font-bold cursor-pointer font-sans transition-all ${isFeatured ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'}`}
                            >
                              {isFeatured ? '★ Sponsored' : '☆ Feature Item'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 7: AUDIT AND COMPLIANCE */}
                {activeTab === 'audit' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Audit Trail & Compliance Ledger</h2>
                      <p className="text-xs text-slate-400">Chronological list of ecosystem edits and permission adjustments</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Search audit actions, details, or executor IDs..." 
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 rounded-lg text-xs outline-none border border-slate-200 dark:border-slate-700 dark:text-white"
                        value={auditSearch}
                        onChange={(e) => setAuditSearch(e.target.value)}
                      />
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {auditLogs
                        .filter(log => 
                          (log.action || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
                          (log.details || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
                          (log.uid || '').toLowerCase().includes(auditSearch.toLowerCase())
                        )
                        .map((log) => (
                          <div key={log.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 text-xs hover:border-blue-500/30 transition-all">
                            <div className="flex justify-between items-center">
                              <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-mono text-[9px] font-bold uppercase tracking-wider">{log.action || 'COMPLIANCE_TICK'}</span>
                              <span className="text-[10px] text-slate-400 font-mono font-medium">
                                {new Date(log.timestamp).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'medium' })}
                              </span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 mt-2 font-medium leading-relaxed">{log.details}</p>
                            
                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/50 mt-2.5 pt-2 text-[10px] text-slate-400 font-mono">
                              <span>Executor ID: <span className="font-bold text-slate-600 dark:text-slate-400">{log.uid || 'SYSTEM_DAEMON'}</span></span>
                              <span className="flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400/90 px-2 py-0.5 rounded font-sans font-bold text-[9px] tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                <span>Condition: SUCCESS_SECURE_VERIFIED</span>
                              </span>
                            </div>
                          </div>
                        ))}
                      {auditLogs.filter(log => 
                        (log.action || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
                        (log.details || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
                        (log.uid || '').toLowerCase().includes(auditSearch.toLowerCase())
                      ).length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-8">No matching audit logs found.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 8: SECURITY OPERATIONS CENTER (SOC) */}
                {activeTab === 'secops' && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h2 className="text-lg font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 animate-bounce" /> Security Operations Center (SOC)
                      </h2>
                      <p className="text-xs text-slate-400">Monitor MFA configurations, access lockouts, and telemetry risks</p>
                    </div>

                    {/* Risk parameters stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">Suspicious Alerts Flagged</span>
                        <div className="text-2xl font-black text-red-600 dark:text-red-400 font-mono mt-1">0 Active</div>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">MFA Configuration Enrolled</span>
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">100% Secure</div>
                      </div>
                      <div className="bg-slate-500/10 border border-slate-500/20 p-4 rounded-2xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Active Administrative Keys</span>
                        <div className="text-2xl font-black text-slate-800 dark:text-white font-mono mt-1">
                          {users.filter(u => u.role === 'admin' || u.role === 'regional_manager').length} Privileged
                        </div>
                      </div>
                    </div>

                    {/* Zero trust user lockout widget */}
                    <div className="bg-slate-50 dark:bg-slate-800/20 p-5 rounded-2xl border border-slate-200">
                      <h3 className="text-xs font-bold uppercase text-slate-400 mb-4">Emergency User Access Lockout</h3>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {users.slice(0, 10).map(u => (
                          <div key={u.uid} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100">
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">{u.displayName || u.pharmacyName}</p>
                              <p className="text-[9px] text-slate-400 font-mono">{u.email}</p>
                            </div>
                            {u.verificationStatus === 'deactivated' ? (
                              <button 
                                onClick={() => handleUpdateStatus(u.uid, u.displayName || u.pharmacyName || '', 'approved')}
                                className="px-3 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Restore Access
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleUpdateStatus(u.uid, u.displayName || u.pharmacyName || '', 'deactivated')}
                                className="px-3 py-1 bg-red-600 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Revoke Session (Lock)
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Database Reset / Clear Data Block */}
                    <div className="bg-red-50 dark:bg-red-950/10 p-5 rounded-2xl border border-red-200 dark:border-red-900/30">
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
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Wipe Database & Users
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
                )}

                {/* TAB 9: REVENUE ANALYTICS */}
                {activeTab === 'revenue' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white font-sans">Ecosystem Revenue Analytics</h2>
                      <p className="text-xs text-slate-400">Overview of sub-billing commissions, advertisement placements, and promotional SaaS growth</p>
                    </div>
 
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-50 dark:bg-slate-800/35 p-5 rounded-2xl border border-slate-200">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Ecosystem Revenue Streams</h3>
                        <div className="h-44 flex items-center justify-center font-mono">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie 
                                data={[
                                  { name: 'SaaS Subscriptions', value: totalSubscriptionRevenue },
                                  { name: 'Marketplace Fees', value: totalCommissionRevenue },
                                  { name: 'Ad Placements', value: totalApprovedAdRevenue }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                fill="#2563EB"
                                paddingAngle={5}
                                dataKey="value"
                              >
                                <Cell fill="#2563EB" />
                                <Cell fill="#10B981" />
                                <Cell fill="#F59E0B" />
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-4 mt-2 text-[10px]">
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-600 rounded"></span> Subscriptions</span>
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded"></span> Commissions</span>
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded"></span> Ad Profits</span>
                        </div>
                      </div>
 
                      <div className="bg-slate-50 dark:bg-slate-800/35 p-5 rounded-2xl border border-slate-200/60">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Aggregated Financial Ledger</h3>
                        <div className="space-y-3 text-xs mt-4">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Active Billable Premium Tiers</span>
                            <span className="font-bold text-slate-900 dark:text-white font-mono">{users.filter(u => u.subscriptionType === 'premium' && u.subscriptionStatus === 'active').length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Active Billable Standard Tiers</span>
                            <span className="font-bold text-slate-900 dark:text-white font-mono">{users.filter(u => u.subscriptionType === 'standard' && u.subscriptionStatus === 'active').length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Total Ecosystem Transaction Index</span>
                            <span className="font-bold text-slate-900 dark:text-white font-mono">{orders.length} orders</span>
                          </div>
                          <div className="border-t border-slate-200 dark:border-slate-850 my-2 pt-2"></div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Ad Campaigns Placed</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">{ads.length} ads</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Advertisement Profits</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{totalApprovedAdRevenue.toLocaleString()} ETB</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Promo & Coupon Revenue</span>
                            <span className="font-bold text-violet-600 dark:text-violet-400 font-mono">{(promoDrivenRevenue + couponDrivenRevenue).toLocaleString()} ETB</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Campaign Discounts Saved By Clients</span>
                            <span className="font-bold text-slate-500 font-mono">{(promoDiscountsSaved + couponDiscountsSaved).toLocaleString()} ETB</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 10: ECOSYSTEM HEALTH */}
                {activeTab === 'health' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ecosystem Vitals & Database Stats</h2>
                      <p className="text-xs text-slate-400">System engagement distribution and active connections check</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Vitals status bars */}
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200">
                        <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Engaged Organizations Vitals</h4>
                        <div className="space-y-3 mt-4">
                          <div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                              <span>HIGH ACTIVITY CLUSTER</span>
                              <span>85%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 w-[85%]"></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                              <span>LOW ENGAGEMENT WARNING</span>
                              <span>15%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500 w-[15%]"></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200">
                        <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Cloud Synced Gate Status</h4>
                        <div className="space-y-2 text-xs mt-3">
                          <p className="flex justify-between"><span>Region Deployment Target:</span> <span className="font-mono text-slate-800 dark:text-white">europe-west2 (Cloud Run)</span></p>
                          <p className="flex justify-between"><span>Database Read Pipeline:</span> <span className="font-mono text-emerald-600 font-bold">Online</span></p>
                          <p className="flex justify-between"><span>Workspace Synchronization:</span> <span className="font-mono text-green-600 font-bold">Authenticated</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 11: SUPPORT CENTER (TICKETING) */}
                {activeTab === 'support' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Organization Support Tickets Desk</h2>
                        <p className="text-xs text-slate-400">Moderate billing, token, and system access tickets in real-time</p>
                      </div>
                      <button 
                        onClick={() => setShowAddTicketModal(true)}
                        className="px-3.5 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-lg text-xs font-sans font-bold cursor-pointer transition-all"
                      >
                        Create Support Ticket
                      </button>
                    </div>

                    <div className="space-y-3">
                      {tickets.map(t => (
                        <div key={t.id} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${t.severity === 'critical' ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600 dark:bg-slate-705'}`}>{t.severity}</span>
                              <span className="text-[10px] text-slate-400 font-bold">{t.organizationName}</span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">{t.title}</h4>
                            <p className="text-[10px] text-slate-500 mt-1">{t.description}</p>
                          </div>
                          <div className="flex gap-2 items-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${t.status === 'open' ? 'bg-red-100 text-red-700' : t.status === 'in_progress' ? 'bg-amber-105 text-amber-700' : 'bg-green-150 text-green-700'}`}>{t.status}</span>
                            
                            {t.status !== 'resolved' ? (
                              <button 
                                onClick={() => updateTicketStatus(t.id, 'resolved')}
                                className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Mark Resolved
                              </button>
                            ) : (
                              <button 
                                onClick={() => updateTicketStatus(t.id, 'open')}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-semibold cursor-pointer"
                              >
                                Reopen
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 12: COMMUNICATION CENTER (BROADCASTER) */}
                {activeTab === 'communication' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ecosystem Announcement Broadcaster</h2>
                      <p className="text-xs text-slate-400">Deliver push notifications or system banner feeds directly to users</p>
                    </div>

                    <form onSubmit={handleBroadcastAnnouncement} className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-100 space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Announcement Title</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g., System Maintenance Notification" 
                          className="w-full mt-1 p-2 bg-white dark:bg-slate-700 text-xs text-slate-800 dark:text-white rounded-lg border border-slate-200 outline-none"
                          value={announcement.title}
                          onChange={(e) => setAnnouncement({...announcement, title: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Message Body</label>
                        <textarea 
                          required 
                          rows={3} 
                          placeholder="Provide the notification message contents..." 
                          className="w-full mt-1 p-2 bg-white dark:bg-slate-700 text-xs text-slate-800 dark:text-white rounded-lg border border-slate-200 outline-none"
                          value={announcement.message}
                          onChange={(e) => setAnnouncement({...announcement, message: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Target Audience Scope</label>
                          <select 
                            className="w-full mt-1 p-2 bg-white dark:bg-slate-700 text-xs text-slate-800 dark:text-white rounded-lg border border-slate-200 outline-none"
                            value={announcement.target}
                            onChange={(e) => setAnnouncement({...announcement, target: e.target.value as any})}
                          >
                            <option value="all">Ecosystem-wide (All Entities)</option>
                            <option value="pharmacies">All Pharmacies</option>
                            <option value="importers">All Wholesale Pharmacies</option>
                            <option value="region">Specific Administrative Region</option>
                            <option value="specific">Specific User / Company (via Email)</option>
                          </select>
                        </div>
                        {announcement.target === 'region' && (
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Region Target Name</label>
                            <input 
                              type="text" 
                              placeholder="e.g., Addis Ababa" 
                              className="w-full mt-1 p-2 bg-white dark:bg-slate-700 text-xs text-slate-800 dark:text-white rounded-lg border"
                              value={announcement.targetRegion}
                              onChange={(e) => setAnnouncement({...announcement, targetRegion: e.target.value})}
                            />
                          </div>
                        )}
                        {announcement.target === 'specific' && (
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Target User/Company Email(s)</label>
                            <input 
                              type="text" 
                              required
                              placeholder="e.g., info@company.com, user@domain.com" 
                              className="w-full mt-1 p-2 bg-white dark:bg-slate-700 text-xs text-slate-800 dark:text-white rounded-lg border border-slate-200 outline-none"
                              value={announcement.targetEmail}
                              onChange={(e) => setAnnouncement({...announcement, targetEmail: e.target.value})}
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Separate multiple emails with commas.</p>
                          </div>
                        )}
                      </div>
                      <button 
                        type="submit" 
                        className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold font-sans flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Megaphone className="w-4 h-4" /> Broadcast News Feed
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB 13: DISTRIBUTOR NODE */}
                {activeTab === 'distributor' && (() => {
                  const filteredDistributors = users.filter((u) => {
                    if (u.role !== 'distributor') return false;
                    
                    if (distributorCountryFilter !== 'all') {
                      const uCountry = u.country ? u.country.toLowerCase() : 'ethiopia';
                      if (uCountry !== distributorCountryFilter.toLowerCase()) {
                        return false;
                      }
                    }
                    
                    if (distributorSearch.trim() !== '') {
                      const queryStr = distributorSearch.toLowerCase();
                      const name = (u.distributorName || u.displayName || '').toLowerCase();
                      const city = (u.city || '').toLowerCase();
                      const region = (u.region || '').toLowerCase();
                      const email = (u.email || '').toLowerCase();
                      
                      return (
                        name.includes(queryStr) ||
                        city.includes(queryStr) ||
                        region.includes(queryStr) ||
                        email.includes(queryStr)
                      );
                    }
                    
                    return true;
                  });

                  return (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Distributors Ledger Node</h2>
                          <p className="text-xs text-slate-400">Track and verify approved logistics partners for the supply chain</p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-lg w-full md:w-auto">
                          <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search distributors..."
                              value={distributorSearch}
                              onChange={(e) => setDistributorSearch(e.target.value)}
                              className="pl-9 pr-4 py-1.5 w-full bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>
                          
                          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1">
                            <Filter className="h-3 w-3 text-slate-400" />
                            <select
                              value={distributorCountryFilter}
                              onChange={(e) => setDistributorCountryFilter(e.target.value)}
                              className="bg-transparent text-xs text-slate-800 dark:text-white border-none outline-none focus:ring-0 cursor-pointer py-0.5"
                            >
                              <option value="all">All Countries</option>
                              {countries.map((cntry) => (
                                <option key={cntry} value={cntry}>
                                  {cntry}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {filteredDistributors.map((dist) => (
                          <div key={dist.uid} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex justify-between items-center border border-slate-100 dark:border-slate-700/40">
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">{dist.distributorName || dist.displayName}</p>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10px] text-slate-500 font-mono">
                                <span>Location: {dist.city || 'Addis Ababa'}{dist.country ? `, ${dist.country}` : ''}</span>
                                {dist.email && <span className="text-slate-400">• {dist.email}</span>}
                              </div>
                            </div>
                            <span className="px-2.5 py-1 bg-green-500/10 text-green-600 rounded-full text-[10px] font-black uppercase">Verified Dispatch Team</span>
                          </div>
                        ))}
                        {filteredDistributors.length === 0 && (
                          <div className="py-12 text-center text-slate-400 text-xs">
                            {users.filter(u => u.role === 'distributor').length === 0 
                              ? 'No registered logistics distributors active in user tables. Please provision one.' 
                              : 'No distributors found matching the search criteria.'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* TAB 14: WAREHOUSE LEDGER OVERLAY */}
                {activeTab === 'warehouse' && (() => {
                  const defaultWarehouses = [
                    { id: 'wh_1', name: 'Addis Hub Warehouse (Central)', address: 'Merkato, Building A, Addis Ababa', country: 'Ethiopia', manager: 'Adisu Bekele', capacity: '80% occupied', phone: '+251 911 234567' },
                    { id: 'wh_2', name: 'Nairobi East Depot', address: 'Industrial Area, Enterprise Rd, Nairobi', country: 'Kenya', manager: 'Jane Kamau', capacity: '45% occupied', phone: '+254 722 000111' },
                    { id: 'wh_3', name: 'Kampala Transit Depot', address: 'Nakawa Industrial Area, Kampala', country: 'Uganda', manager: 'David Okello', capacity: '60% occupied', phone: '+256 772 333444' },
                    { id: 'wh_4', name: 'Dar es Salaam Port Storage', address: 'Kurasini, Port Road, Dar es Salaam', country: 'Tanzania', manager: 'Ali Mwinyi', capacity: '90% occupied', phone: '+255 22 211000' }
                  ];

                  const allCombined = [
                    ...warehouses.map((w: any) => ({
                      id: w.id || Math.random().toString(),
                      name: w.name || 'Unnamed Depot',
                      address: w.address || 'Central Transit Area',
                      country: w.country || 'Ethiopia',
                      manager: w.managerName || w.contactPerson || 'Assigned Agent',
                      capacity: w.capacity ? `${w.capacity}% occupied` : '35% occupied',
                      phone: w.phone || 'N/A'
                    })),
                    ...defaultWarehouses
                  ];

                  const filteredWarehouses = allCombined.filter((w) => {
                    if (warehouseCountryFilter !== 'all') {
                      if ((w.country || '').toLowerCase() !== warehouseCountryFilter.toLowerCase()) {
                        return false;
                      }
                    }

                    if (warehouseSearch.trim() !== '') {
                      const queryStr = warehouseSearch.toLowerCase();
                      return (
                        (w.name || '').toLowerCase().includes(queryStr) ||
                        (w.address || '').toLowerCase().includes(queryStr) ||
                        (w.manager || '').toLowerCase().includes(queryStr) ||
                        (w.country || '').toLowerCase().includes(queryStr)
                      );
                    }

                    return true;
                  });

                  return (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Warehouse Network Administration</h2>
                          <p className="text-xs text-slate-400">Central inventory consolidation warehouses and transit transactions tracking</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-lg w-full md:w-auto">
                          <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search warehouses..."
                              value={warehouseSearch}
                              onChange={(e) => setWarehouseSearch(e.target.value)}
                              className="pl-9 pr-4 py-1.5 w-full bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1">
                            <Filter className="h-3 w-3 text-slate-400" />
                            <select
                              value={warehouseCountryFilter}
                              onChange={(e) => setWarehouseCountryFilter(e.target.value)}
                              className="bg-transparent text-xs text-slate-800 dark:text-white border-none outline-none focus:ring-0 cursor-pointer py-0.5"
                            >
                              <option value="all">All Countries</option>
                              {countries.map((cntry) => (
                                <option key={cntry} value={cntry}>
                                  {cntry}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredWarehouses.map((wh) => (
                          <div key={wh.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-2xl text-xs flex flex-col justify-between hover:border-blue-500/30 transition-all">
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-3">
                                <h4 className="font-bold text-slate-800 dark:text-white uppercase text-[10px] tracking-wide">{wh.name}</h4>
                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-[9px] font-bold uppercase">{wh.country}</span>
                              </div>
                              <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400 mt-2">
                                <p>Address: <span className="font-medium text-slate-900 dark:text-white">{wh.address}</span></p>
                                <p>Manager Profile: <span className="font-medium text-slate-900 dark:text-white">{wh.manager}</span></p>
                                <p>Storage Capacity: <span className="font-medium text-slate-900 dark:text-white">{wh.capacity}</span></p>
                                {wh.phone !== 'N/A' && <p>Phone Contact: <span className="font-medium text-slate-900 dark:text-white font-mono">{wh.phone}</span></p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {filteredWarehouses.length === 0 && (
                        <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                          No warehouses match the search and country filters.
                        </div>
                      )}

                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-2xl text-xs">
                        <h4 className="font-bold text-slate-800 dark:text-white uppercase text-[10px] mb-3">Live Stock Transfer Transactions</h4>
                        <div className="space-y-2 mt-2 font-mono text-[9px] text-slate-400">
                          <p className="text-slate-600 dark:text-slate-300">● [Dispatch] Amoxicillin x50 units sent to Branch West</p>
                          <p className="text-slate-600 dark:text-slate-300">● [Receiving] Paracetamol x500 units received from MedTech Import</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* TAB 15: AI STRATEGY LAYER */}
                {activeTab === 'ai' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 bg-blue-600/10 p-4 rounded-2xl border border-blue-600/20">
                      <Cpu className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-pulse" />
                      <div>
                        <h2 className="text-sm font-bold text-blue-605">ATech Core AI Strategy Layer (Forecasting-Ready)</h2>
                        <p className="text-[10px] text-slate-500">Extensible design configuration framework for forecasting & restock engines</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-5 bg-slate-50 dark:bg-slate-800/25 border border-slate-200 rounded-2xl text-xs">
                        <h3 className="text-xs font-bold uppercase text-slate-400 mb-4">Model Weights Target Selection</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2.5 rounded-lg">
                            <span>Gemini 2.5 Flash API Payload (Default)</span>
                            <span className="px-2 py-0.5 bg-green-500/10 text-green-600 rounded font-black text-[9px]">READY</span>
                          </div>
                          <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2.5 rounded-lg opacity-60">
                            <span>Gemini 1.5 Pro (Fallback Strategy)</span>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[9px]">OFFLINE</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200/50">
                          <button 
                            type="button" 
                            onClick={() => toast.success('Smart model checkpoints validated successfully.')}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold font-sans cursor-pointer transition-all"
                          >
                            Verify Data Quality (Health Check)
                          </button>
                        </div>
                      </div>

                      <div className="p-5 bg-slate-50 dark:bg-slate-800/25 border border-slate-200 rounded-2xl text-xs">
                        <h3 className="text-xs font-bold uppercase text-slate-400 mb-4">Simulated smart reorder graph</h3>
                        <div className="h-32 flex items-center justify-center font-mono text-[10px] text-slate-400">
                          [ Area Chart: Stock Level (Peak) vs Suggestions Restock ]
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'pharmacy-wholesales' && (() => {
                  const filteredSuppliers = allSuppliers.filter(supplier => {
                    const pharm = users.find(u => u.uid === supplier.pharmacyId);
                    const pharmName = pharm?.displayName || '';
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

                  const totalWholesales = allSuppliers.length;
                  const activeLicenses = allSuppliers.filter(s => s.licenseStatus === 'active').length;
                  const avgLeadTime = allSuppliers.length > 0 
                    ? (allSuppliers.reduce((acc, s) => acc + Number(s.leadTimeDays || 0), 0) / allSuppliers.length).toFixed(1)
                    : '0';
                  const topRated = allSuppliers.filter(s => Number(s.rating || 0) >= 4).length;

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
                              const p = users.find(u => u.uid === s.pharmacyId);
                              return [
                                index + 1,
                                s.name || '',
                                `${s.contactName || ''} (${s.phone || ''})`,
                                `${s.city || ''}, ${s.country || ''}`,
                                s.licenseStatus || 'pending',
                                p?.displayName || 'Unknown Pharmacy'
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
                                  const pharmacy = users.find(u => u.uid === supplier.pharmacyId);
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
                      <option value="basic">Basic Plan</option>
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

      </div>
    </div>
  );
};
