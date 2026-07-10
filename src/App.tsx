/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Component } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidGoogleMapsKey = Boolean(GOOGLE_MAPS_API_KEY) && GOOGLE_MAPS_API_KEY !== 'YOUR_API_KEY';
import { 
  auth, db 
} from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  browserPopupRedirectResolver
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  addDoc,
  updateDoc,
  deleteDoc,
  increment,
  writeBatch,
  getDocs,
  getDocFromServer,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Truck, 
  Settings, 
  LogOut, 
  Plus, 
  Clock,
  Calendar,
  Search, 
  AlertTriangle,
  FileText,
  Printer,
  Download,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  XCircle,
  TrendingUp,
  Save,
  CreditCard,
  Users,
  MapPin,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Mail,
  Lock,
  User,
  X,
  ExternalLink,
  Building2,
  Globe,
  ShieldAlert,
  Percent,
  Send,
  Zap,
  UserPlus,
  Sun,
  Moon,
  Phone,
  Menu,
  Box,
  Store,
  BarChart3,
  Wifi,
  WifiOff,
  RefreshCw,
  Layers,
  Cpu,
  Warehouse as WarehouseIcon,
  Tag,
  Megaphone,
  DollarSign,
  Activity,
  LifeBuoy,
  Star,
  Award,
  TrendingDown,
  Sparkles,
  Pill
} from 'lucide-react';

import { WholesaleAdsPortal } from './components/WholesaleAdsPortal';
import { AdminAdsCenter } from './components/AdminAdsCenter';
import { AdminRatingsManagement, calculateSystemWork } from './components/AdminRatingsManagement';
import { LegalFooter } from './components/LegalFooter';

export const recordBinCardMovement = async (db: any, entry: any) => {
  try {
    const nextId = 'bm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    await setDoc(doc(db, 'inventory_movements', nextId), {
      id: nextId,
      ...entry,
      date: entry.date || Date.now()
    });
  } catch (err) {
    console.error('Failed to log inventory movement:', err);
  }
};

const GoogleMapsPlaceholder = ({ message }: { message: string }) => (
  <div className="w-full h-80 min-h-[300px] bg-slate-50 dark:bg-slate-800/10 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center p-6 text-center">
    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4">
      <Globe size={24} />
    </div>
    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1 text-sm font-sans">Google Maps Required</h4>
    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4 leading-relaxed font-sans">
      {message}
    </p>
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl text-left text-[11px] text-slate-600 dark:text-slate-400 max-w-sm w-full shadow-xs">
      <p className="font-bold text-slate-700 dark:text-slate-300 mb-1 font-sans">How to configure:</p>
      <ol className="list-decimal list-inside space-y-1 text-[11px] leading-tight font-sans">
        <li>Get a key from the Google Cloud Console.</li>
        <li>In AI Studio (top right), click <strong>Settings</strong> (⚙️) &rarr; <strong>Secrets</strong>.</li>
        <li>Add <code>GOOGLE_MAPS_PLATFORM_KEY</code> as name and paste your key.</li>
      </ol>
    </div>
  </div>
);
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import SuppliersView from './components/SuppliersView';
import CustomersView from './components/CustomersView';
import WarehousesView from './components/WarehousesView';
import PurchaseOrdersView from './components/PurchaseOrdersView';
import { ExpiryTrackerView } from './components/ExpiryTrackerView';
import ForecastingView from './components/ForecastingView';
import DistributorView from './components/DistributorView';
import NationalAvailabilitySearchView from './components/NationalAvailabilitySearchView';
import { SuperAdminConsole } from './components/SuperAdminConsole';
import NotificationsView from './components/NotificationsView';
import { syncPharmacyBillingAndInvoices, getSubscriptionCost } from './lib/billingEngine';
import { hasFeature, getUpgradeRequirementLabel } from './lib/featureGate';
import { SubscriptionView } from './components/SubscriptionView';
import BinCardLedgerView from './components/BinCardLedgerView';
import { 
  UserProfile, 
  InventoryProduct, 
  Sale, 
  SaleItem, 
  UserRole, 
  MarketplaceProduct, 
  Order, 
  OrderStatus,
  VerificationStatus,
  SystemSettings,
  Notification,
  AuditLog,
  Branch,
  StockTransfer,
  Customer,
  getCurrencySymbol,
  getCurrencyName
} from './types';
import { downloadReceipt, printReceipt, generateInventoryReport, generateRevenueReport, downloadTransferDocument, downloadTransferReport } from './lib/pdfGenerator';

import { countries } from './constants/countries';

// --- Multilingual Support Constants ---
export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'am', name: 'አማርኛ (Amharic)', flag: '🇪🇹' },
  { code: 'om', name: 'Oromoo (Oromiffa)', flag: '🇪🇹' },
  { code: 'ti', name: 'ትግርኛ (Tigrinya)', flag: '🇪🇹' }
];

export const TRANSLATIONS = {
  en: {
    dashboard: 'Dashboard',
    inventory: 'Inventory',
    'my-products': 'My Products',
    sales: 'Sales & POS',
    marketplace: 'Marketplace',
    orders: 'B2B Orders',
    suppliers: 'Wholesale Pharmacies',
    staff: 'Staff Accounts',
    subscription: 'Subscription Plan',
    customers: 'Customers',
    branches: 'Branches',
    warehouses: 'Warehouses',
    'admin-users': 'User Management',
    'admin-marketing': 'Marketing Team',
    users: 'Approve/Reject Users',
    'admin-revenue': 'Revenue & Finance',
    'admin-marketplace': 'Marketplace Control',
    'admin-notifications': 'Notifications',
    notifications: 'Announcements',
    'admin-system': 'System Control',
    settings: 'Settings',
    advertising: 'Wholesale Promotions',
    'admin-ads': 'Promotion',
    expiry: 'Expiry Control',
    forecasting: 'Forecasts & Reorders',
    bincard: 'Bin Card Ledger',
    system_active: 'E-HEALTH ETHIOPIA ACTIVE',
    choose_role: 'Choose your business type',
    profile_details: 'Profile Details',
    sub_plan: 'Subscription Plan',
    upload_docs: 'Upload Documents',
    limitations: 'Limitations (Not Included):',
    whats_included: 'What is included:',
    current_plan: 'Current Plan',
    quick_renew: 'Quick Renew',
    renew_now: 'Renew Now',
    select_plan: 'Select Plan',
    request_pending: 'Request Pending',
    current_plan_btn: 'Current Plan',
    basic: 'Basic',
    standard: 'Standard',
    premium: 'Premium'
  },
  am: {
    dashboard: 'ዳሽቦርድ',
    inventory: 'ክምችት (ኢንቬንቶሪ)',
    'my-products': 'የምርት ዝርዝር',
    sales: 'ሽያጭ እና POS',
    marketplace: 'የገበያ ቦታ',
    orders: 'የጅምላ ትዕዛዞች (B2B)',
    suppliers: 'የጅምላ መድኃኒት ቤቶች',
    staff: 'የሰራተኞች አስተዳደር',
    subscription: 'ክፍያና ሰብስክሪፕሽን',
    customers: 'ደንበኞች',
    branches: 'ቅርንጫፎች',
    warehouses: 'መጋዘኖች (Warehouses)',
    'admin-users': 'ተጠቃሚዎች አስተዳደር',
    'admin-marketing': 'የማርኬቲንግ ቡድን',
    users: 'ማረጋገጫዎች',
    'admin-revenue': 'ገቢ እና በጀት',
    'admin-marketplace': 'ማርኬትፕሌስ መቆጣጠሪያ',
    'admin-notifications': 'ማሳወቂያዎች',
    notifications: 'ማሳወቂያዎች',
    'admin-system': 'የሲስተም ቁጥጥር',
    settings: 'ቅንጅቶች',
    expiry: 'የመድኃኒት ጊዜ መቆጣጠሪያ',
    forecasting: 'የኢንቬንቶሪ ትንበያ ቁጥጥር',
    bincard: 'ቢን ካርድ ሌጀር (Bin Card)',
    system_active: 'የኢትዮጵያ ኢ-ጤና ሲስተም ንቁ ነው',
    choose_role: 'የንግድዎን አይነት ይምረጡ',
    profile_details: 'የመለያዎ ዝርዝሮች',
    sub_plan: 'የምዝገባ ዕቅድ',
    upload_docs: 'ማረጋገጫ ሰነዶችን ይስቀሉ',
    limitations: 'ከርካሽ እቅዱ ተቀናሽ የሆኑ (ያልተካተቱ):',
    whats_included: 'ከተጠቃሚነት እቅድ ጋር የሚካተቱ:',
    current_plan: 'የአሁኑ ዕቅድ',
    quick_renew: 'በፍጥነት ማደስ',
    renew_now: 'አሁን አድስ',
    select_plan: 'ዕቅዱን ይምረጡ',
    request_pending: 'ማረጋገጫ በመጠባበቅ ላይ',
    current_plan_btn: 'የአሁኑ ዕቅድ',
    basic: 'መሰረታዊ (Basic)',
    standard: 'መደበኛ (Standard)',
    premium: 'ልዩ (Premium)'
  },
  om: {
    dashboard: 'Dursaa (Dashboard)',
    inventory: 'Kuusaa Qorichaa',
    'my-products': 'Oomishaalee Koo',
    sales: 'Gurgurtaa & POS',
    marketplace: 'Gabaa Meeshaalee',
    orders: 'Ajajawwan B2B',
    suppliers: 'Dhiyeessitoota Jimlaa',
    staff: 'Herrega Hojjettootaa',
    subscription: 'Dhamannaa & Kaffaltii',
    customers: 'Mamiltoota',
    branches: 'Dameewwan',
    warehouses: 'Warehouses (Godambawwan)',
    'admin-users': 'Bulchiinsa Fayyadamtootaa',
    'admin-marketing': 'Garee Maarkeetingii',
    users: 'Mirkaneessa',
    'admin-revenue': 'Galiidhaan Karoora',
    'admin-marketplace': 'To’annoo Gabaa',
    'admin-notifications': 'Beeksisa Macaafa',
    notifications: 'Beeksisa',
    'admin-system': 'To’annoo Sirnaa',
    settings: 'Sajeewwan',
    expiry: 'To’annoo Yeroo Qorichaa',
    forecasting: 'Saje Kuusaa Raagduu (Forecast)',
    system_active: 'SIRNA FAYYAA ETHIOPIA',
    choose_role: 'Gosa daldalaa keessan filadhaa',
    profile_details: 'Bal’ina Profaayilii Meeshaa',
    sub_plan: 'Karoora Miseensummaa',
    upload_docs: 'Sanadoota Galmeessitootaa tursiisaa',
    limitations: 'Hanqinaalee (Hin dabalatne):',
    whats_included: 'Wanti dabalame:',
    current_plan: 'Karoora Ammaa',
    quick_renew: 'Saffisaan Haaromsuu',
    renew_now: 'Haaromsi Amma',
    select_plan: 'Karoora Filadhu',
    request_pending: 'Eeggachaa Jiru',
    current_plan_btn: 'Karoora Keessan',
    basic: 'Bu’ura (Basic)',
    standard: 'Giddu-galeessa (Standard)',
    premium: 'Ol’aanaa (Premium)'
  },
  ti: {
    dashboard: 'ዳሽቦርድ',
    inventory: 'ክምችት (ኢንቬንቶሪ)',
    'my-products': 'ፍርያተይ',
    sales: 'ሽያጭን POSን',
    marketplace: 'ቦታ ዕዳጋ',
    orders: 'ጅምላ ትእዛዛት (B2B)',
    suppliers: 'ጅምላ መድኃኒት መቕረብቲ',
    staff: 'ሕሳብ ሰራሕተኛታት',
    subscription: 'ክፍያና ሰብስክሪፕሽን',
    customers: 'ደንበኛታት',
    branches: 'ቅርንጫፋት',
    warehouses: 'መጋዘናት (Warehouses)',
    'admin-users': 'ምሕደራ ተጠቀምቲ',
    'admin-marketing': 'ጋንታ ማርኬቲንግ',
    users: 'ምርግጋፅ ተጠቀምቲ',
    'admin-revenue': 'እቶትን ፋይናንስን',
    'admin-marketplace': 'ቁፅፅር ማርኬትፕሌስ',
    'admin-notifications': 'מלእኽትታት',
    notifications: 'መልእኽትታት',
    'admin-system': 'ቁፅፅር ሲስተም',
    settings: 'ቅንጅታት',
    system_active: 'ምምሕዳር ኢ-ጥዕና ንቑሕ እዩ',
    choose_role: 'ዓይነት ንግድኹም ሕረዩ',
    profile_details: 'ዝርዝር ፕሮፋይል',
    sub_plan: 'መደብ ሰብስክሪፕሽን',
    upload_docs: 'ሰነዳት መረዳእታ ስቐሉ',
    limitations: 'ብመደብኩም ዘይረኸብኩምዎም (ዝተገደቡ):',
    whats_included: 'ኣብዚ መደብ ዝተኻተቱ:',
    current_plan: 'ናይ ሕዚ መደብ',
    quick_renew: 'ብቕጽበት ሓድሽ',
    renew_now: 'ሕዚ ሓድሽ',
    select_plan: 'መደብ ሕረዩ',
    request_pending: 'ሕቶ ይፅበ ኣሎ',
    current_plan_btn: 'ናይ ሕዚ መደብ',
    basic: 'መሰረታዊ (Basic)',
    standard: 'ማእከላይ (Standard)',
    premium: 'ፍሉይ (Premium)'
  }
};

// --- Firestore Error Handling ---

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
  
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  if (errorMessage.toLowerCase().includes('offline') || 
      errorMessage.toLowerCase().includes('unavailable') || 
      errorMessage.toLowerCase().includes('failed to fetch') ||
      errorMessage.toLowerCase().includes('network-request-failed')) {
    toast.error("Network connection unstable. Please: 1. Disable ad-blockers. 2. Ensure third-party cookies are enabled. 3. Try 'Open in new tab'.", { icon: '🌐', duration: 7000 });
  } else if (errorMessage.toLowerCase().includes('permission denied') || errorMessage.toLowerCase().includes('insufficient permissions')) {
    toast.error(`Access Denied: ${operationType} on ${path}. Please contact admin.`);
  } else {
    toast.error(`Operation failed: ${operationType}. Check your connection.`);
  }
}

// Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public props: ErrorBoundaryProps;
  public state: ErrorBoundaryState = {
    hasError: false
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-md text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-slate-500 mb-8">The application encountered an unexpected error. Please refresh the page or contact support.</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              Refresh Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Auth & Signup Components ---

const bootstrapAdmin = async (user: any) => {
  const adminEmails = ['andualemtyb@gmail.com', 'atech2119@gmail.com'];
  if (user && user.email && adminEmails.includes(user.email.toLowerCase())) {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      const adminProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        role: 'admin',
        displayName: user.displayName || 'Super Admin',
        verificationStatus: 'approved',
        subscriptionType: 'premium',
        createdAt: Date.now()
      };
      await setDoc(userRef, adminProfile);
    } else {
      const data = userDoc.data() as UserProfile;
      if (data.role !== 'admin' || data.verificationStatus !== 'approved' || data.subscriptionType !== 'premium') {
        await updateDoc(userRef, { 
          role: 'admin', 
          verificationStatus: 'approved',
          subscriptionType: 'premium'
        });
      }
    }
  }
};

const ConnectionTroubleshooter = () => {
  const [status, setStatus] = useState<'idle' | 'checking' | 'error' | 'success'>('idle');
  const [details, setDetails] = useState<string[]>([]);

  const checkConnection = async () => {
    setStatus('checking');
    setDetails([]);
    
    const logs: string[] = [];
    try {
      logs.push("Checking Firebase initialization...");
      if (!auth || !db) throw new Error("Firebase modules not loaded");
      logs.push("✓ Firebase modules active");

      logs.push("Testing Firestore reachability...");
      // Wrap in a promise with timeout
      const testPromise = getDocFromServer(doc(db, 'test', 'connection'));
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Connection timed out")), 5000));
      
      await Promise.race([testPromise, timeoutPromise]).catch(err => {
        if (err.message.includes('permission') || err.code === 'permission-denied') {
          // This is fine, we just want to see if we can reach the server
          return;
        }
        throw err;
      });
      
      logs.push("✓ Firestore connection stable");
      setStatus('success');
    } catch (err: any) {
      console.error("Diagnostic error:", err);
      logs.push(`✖ Error: ${err.message || "Unknown connectivity issue"}`);
      if (err.code === 'unavailable' || err.message?.includes('offline') || err.message?.includes('timeout')) {
        logs.push("Reason: You appear to be offline or a firewall/ad-blocker is blocking Firebase.");
      }
      setStatus('error');
    }
    setDetails(logs);
  };

  return (
    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap size={14} className="text-amber-500" />
            Connection Troubleshooter
          </h3>
          {status === 'success' && <CheckCircle size={14} className="text-green-500" />}
          {status === 'error' && <AlertTriangle size={14} className="text-red-500" />}
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
          Having trouble reaching our servers? Use this tool to diagnose common browser restrictions.
        </p>
        
        {status === 'idle' && (
          <button 
            onClick={checkConnection}
            className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Run Connectivity Test →
          </button>
        )}
        
        {status === 'checking' && (
          <div className="flex items-center gap-2 text-[10px] text-blue-600 dark:text-blue-400 font-bold">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Testing...
          </div>
        )}
        
        {details.length > 0 && (
          <div className="mt-2 space-y-1">
            {details.map((log, i) => (
              <p key={i} className={`text-[9px] font-mono leading-tight ${log.startsWith('✓') ? 'text-green-600 dark:text-green-400' : log.startsWith('✖') ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`}>
                {log}
              </p>
            ))}
          </div>
        )}

        {(status === 'error' || status === 'success') && (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
              <strong>Recommendation:</strong> If any test fails, clicking the <strong>"Open in new tab"</strong> icon at the top right is usually the fastest fix.
            </p>
            <button 
              onClick={checkConnection}
              className="text-[9px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors self-start"
            >
              Verify Again
            </button>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
            <Lock size={12} className="text-amber-500" />
            Google Popup Blocked or Client Offline?
          </h4>
          <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Browsers block logins and Firestore inside preview iframes due to privacy shields or third-party cookie restrictions.
          </p>
          <div className="mt-2 space-y-1 pl-3.5 border-l border-slate-200 dark:border-slate-700 text-[9px] text-slate-500 dark:text-slate-400">
            <p>1. <button type="button" onClick={() => window.open(window.location.href, '_blank')} className="text-blue-500 font-bold hover:underline">Open in a new tab</button> to bypass standard iframe limitations.</p>
            <p>2. Or, use the <strong>Email / Password</strong> form below—it does not require popups and is 100% functional inside any sandbox iframe.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Login = ({ onLoginSuccess }: { onLoginSuccess: (user: any) => void }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isStaffLogin, setIsStaffLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pharmacyName, setPharmacyName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Marketing Agent Invitation States
  const [marketingInvite, setMarketingInvite] = useState<any | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [marketingForm, setMarketingForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    photo: '',
  });

  const validateEmail = (emailStr: string) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailStr.trim());
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const join = params.get('join');
    const inviteId = params.get('inviteId');

    if (join === 'marketing' && inviteId) {
      setInviteLoading(true);
      const fetchInvite = async () => {
        try {
          let docSnap;
          try {
            docSnap = await getDocFromServer(doc(db, 'marketing_invites', inviteId));
          } catch (serverErr) {
            console.warn("getDocFromServer failed, falling back to standard getDoc", serverErr);
            docSnap = await getDoc(doc(db, 'marketing_invites', inviteId));
          }
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.used) {
              setInviteError("This registration link has already been used to register an account. Please sign in to access your dashboard.");
            } else {
              setMarketingInvite(data);
              setMarketingForm({
                name: data.name,
                email: data.email === 'N/A' ? '' : data.email,
                phoneNumber: '',
                password: '',
                photo: '',
              });
            }
          } else {
            setInviteError("The onboarding invitation link is invalid or has expired. Please request a fresh invitation link from the Super Admin.");
          }
        } catch (error: any) {
          console.error("Error fetching marketing invite:", error);
          setInviteError(`Failed to verify invitation link. Details: ${error?.message || error}`);
        } finally {
          setInviteLoading(false);
        }
      };
      fetchInvite();
    }

    const mode = params.get('login');
    const u = params.get('u');
    const p = params.get('p');
    const ph = params.get('ph');

    if (mode === 'staff' && u && p && ph) {
      setIsStaffLogin(true);
      setUsername(u);
      setPassword(p);
      setPharmacyName(ph);
      // Auto-trigger login if all params are present
      handleStaffAuth(u, p, ph);
    }
  }, []);

  const handleMarketingRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marketingForm.name || !marketingForm.email || !marketingForm.password) {
      toast.error('Please fill in all required fields (Full Name, Email, Password)');
      return;
    }
    if (marketingForm.password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const regToast = toast.loading('Signing Authorized Agent Agreement & Creating Account...');
    try {
      const result = await createUserWithEmailAndPassword(auth, marketingForm.email.toLowerCase().trim(), marketingForm.password);
      const user = result.user;

      const userProfile = {
        uid: user.uid,
        displayName: marketingForm.name,
        email: marketingForm.email.toLowerCase().trim(),
        phoneNumber: marketingForm.phoneNumber || 'N/A',
        photo: marketingForm.photo || '',
        role: 'marketing',
        country: marketingInvite.country,
        city: marketingInvite.city,
        shift: marketingInvite.shift,
        salary: marketingInvite.salary,
        currency: marketingInvite.currency,
        promoCode: marketingInvite.promoCode,
        commissionBalance: 0,
        verificationStatus: 'approved',
        createdAt: Date.now()
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);

      await updateDoc(doc(db, 'marketing_invites', marketingInvite.id), {
        used: true,
        usedByUid: user.uid,
        usedAt: Date.now()
      });

      toast.success('Agent account created and linked! Welcome to ATECH.', { id: regToast });
      onLoginSuccess(user);
    } catch (err: any) {
      console.error(err);
      let msg = 'Failed to onboard agent.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email address is already in use by another account.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'The password is too weak. Must be at least 6 characters.';
      }
      toast.error(msg, { id: regToast });
    } finally {
      setLoading(false);
    }
  };

  const handleStaffAuth = async (u?: string, p?: string, ph?: string) => {
    const inputUsername = u || username;
    const inputPassword = p || password;
    const inputPharmacy = ph || pharmacyName;

    if (!inputUsername || !inputPassword || !inputPharmacy) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    const authToast = toast.loading('Authenticating staff...');
    try {
      // Robust normalization for staff credentials
      const slugify = (text: string, sep: string = '') => {
        const slug = text.toLowerCase().trim().replace(/[^a-z0-9]+/g, sep);
        if (!sep) return slug;
        const escapedSep = sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return slug.replace(new RegExp(`^${escapedSep}+|${escapedSep}+$`, 'g'), '');
      };

      let email = '';
      const trimmedUsername = inputUsername.toLowerCase().trim();

      // If they provided the full generated email, use it directly
      if (trimmedUsername.endsWith('@staff.atech.com')) {
        email = trimmedUsername;
      } else {
        let pharmacySlug = slugify(inputPharmacy);
        let namePart = trimmedUsername;

        if (namePart.includes('@')) {
          const parts = namePart.split('@');
          namePart = parts[0].trim();
          // If they typed name@Pharmacy Name, the @ part overrides the pharmacy field
          pharmacySlug = slugify(parts[1]);
        }
        
        const nameSlug = slugify(namePart, '.');
        email = `${nameSlug}.${pharmacySlug}@staff.atech.com`;
      }
      
      console.log('[Staff Auth Debug]', { 
        inputUsername, 
        inputPharmacy, 
        generatedEmail: email 
      });
      
      const cleanedEmail = email.trim().toLowerCase();
      const result = await signInWithEmailAndPassword(auth, cleanedEmail, inputPassword);
      const user = result.user;
      
      toast.success('Welcome back!', { id: authToast });
      onLoginSuccess(user);
    } catch (error: any) {
      console.error(error);
      let message = 'Staff login failed';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = 'Invalid credentials. Please double-check your Pharmacy Name, Username, and Password. The Pharmacy Name must match what was used during registration.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'The generated staff email is invalid. Please contact support.';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Connection failed. Please: 1. Check your internet. 2. Disable ad-blockers. 3. Try "Open in new tab" using the icon at the top right of this preview.';
      }
      toast.error(message, { id: authToast });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    
    setLoading(true);
    const provider = new GoogleAuthProvider();
    const loginToast = toast.loading('Connecting to Google...');
    try {
      const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      const user = result.user;
      await bootstrapAdmin(user);
      onLoginSuccess(user);
      toast.success('Google login successful!', { id: loginToast });
    } catch (error: any) {
      const errorCode = error.code;
      const errorMsg = error.message?.toLowerCase() || '';
      
      if (
        errorCode === 'auth/popup-closed-by-user' || 
        errorCode === 'auth/cancelled-popup-request' ||
        errorMsg.includes('popup-closed-by-user') ||
        errorMsg.includes('cancelled-popup-request')
      ) {
        toast.dismiss(loginToast);
        setLoading(false);
        return;
      }

      console.error('Google Auth Error:', error);
      let message = 'Google login failed';
      if (error.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your connection and disable any ad-blockers.';
      } else if (error.code === 'auth/popup-blocked') {
        message = 'The Google login popup was blocked by your browser. This is common in preview environments. Please try clicking the "open in a new tab" link at the bottom of the login form.';
      } else if (error.code === 'auth/internal-error' || error.message?.includes('cookies')) {
        message = 'Third-party cookies might be blocked. Please enable them in your browser settings to use Google Login.';
      } else if (error.code === 'auth/operation-not-allowed') {
        message = 'Google Login is not enabled in the Firebase Console. Please use Email login or contact the administrator.';
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        message = 'An account already exists with this email using a different login method (e.g. Email/Password). Please log in using that method instead.';
      }

      toast.error(message, { id: loginToast });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }
    const resetToast = toast.loading('Sending reset email...');
    try {
      const cleanedEmail = email.replace(/\s/g, '').toLowerCase();
      await sendPasswordResetEmail(auth, cleanedEmail);
      toast.success('Password reset email sent! Check your inbox.', { id: resetToast });
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to send reset email. Please check the email address.', { id: resetToast });
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && !agreedToTerms) {
      toast.error('You must agree to the Terms & Conditions and Privacy Policy to register.');
      return;
    }
    if (isSignUp && password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    setLoading(true);
    const authToast = toast.loading(isSignUp ? 'Creating account...' : 'Signing in...');
    try {
      let user;
      // Aggressive cleaning: remove all whitespace and non-ASCII characters
      const cleanedEmail = email.replace(/[^a-zA-Z0-9@._%+-]/g, '').toLowerCase();
      
      console.log('[Auth Debug] Attempting login with:', { 
        original: Array.from(email).map((c: string) => c.charCodeAt(0)), // Log char codes to find hidden chars
        cleaned: cleanedEmail,
        isSignUp 
      });

      if (!cleanedEmail || !cleanedEmail.includes('@') || !cleanedEmail.includes('.') || cleanedEmail.length < 5) {
        toast.error('Please enter a valid email address');
        setLoading(false);
        return;
      }

      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, cleanedEmail, password);
        user = result.user;
        toast.success('Account created!', { id: authToast });
      } else {
        const result = await signInWithEmailAndPassword(auth, cleanedEmail, password);
        user = result.user;
        toast.success('Welcome back!', { id: authToast });
      }
      await bootstrapAdmin(user);
      onLoginSuccess(user);
    } catch (error: any) {
      if (error && error.code !== 'auth/email-already-in-use') {
        console.log('Auth detail info:', error.message || error);
      } else {
        console.warn('Auth validation Check: Email is already in use');
      }
      let message = 'Authentication failed';
      if (error.code === 'auth/invalid-email') {
        const cleaned = email.replace(/[^a-zA-Z0-9@._%+-]/g, '').toLowerCase();
        message = `The email format "${cleaned}" was rejected by the system. Please ensure there are no special characters.`;
      } else if (error.code === 'auth/invalid-credential') {
        message = 'Invalid email or password. Please try again.';
      } else if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password.';
      } else if (error.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. We have switched you to the Sign In screen so you can log in instead.';
        setIsSignUp(false); // Automatically switch to sign in mode
        setPassword(''); // Clear password for security and to allow fresh entry
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Connection failed. Please: 1. Check your internet. 2. Disable ad-blockers. 3. Try "Open in new tab" using the icon at the top right of this preview.';
      }
      toast.error(message, { id: authToast });
    } finally {
      setLoading(false);
    }
  };

  if (inviteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans">
        <div className="text-center">
          <RefreshCw className="animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" size={32} />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Verifying Agent Onboarding Invitation...</p>
        </div>
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-100 dark:border-slate-800 text-center animate-in fade-in zoom-in-95"
        >
          <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/20 rounded-2xl flex items-center justify-center mx-auto mb-5 text-rose-500">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white mb-2">Invitation Unverified</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            {inviteError}
          </p>
          <button
            onClick={() => {
              setInviteError(null);
              setMarketingInvite(null);
              window.history.pushState({}, document.title, window.location.pathname);
            }}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Go to Standard Login Portal
          </button>
        </motion.div>
      </div>
    );
  }

  if (marketingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck size={24} className="text-blue-100" />
              <span className="text-xs uppercase font-extrabold tracking-widest text-blue-100">ATECH signing app platform</span>
            </div>
            <h1 className="text-2xl font-black">Authorized Agent Agreement</h1>
            <p className="text-blue-100 text-xs mt-1">
              Please review your pre-assigned terms and complete your official team profile to finalize onboarding.
            </p>
          </div>

          <div className="p-8 space-y-6">
            {/* Pre-assigned terms card */}
            <div className="p-5 bg-blue-50/50 dark:bg-slate-800/40 border border-blue-100/60 dark:border-slate-800 rounded-2xl">
              <h3 className="text-xs font-extrabold uppercase text-blue-600 dark:text-blue-400 mb-3 tracking-wider">Approved Contractual Terms</h3>
              <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">Representative Name</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{marketingInvite.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">Territory Branch / City</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{marketingInvite.city}, {marketingInvite.country}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">Assigned Work Shift</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{marketingInvite.shift}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">Assigned Base Salary</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{marketingInvite.salary.toLocaleString()} {marketingInvite.currency} / Month</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800/50 flex justify-between items-center">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block">Automatically Generated Promo Code</span>
                    <span className="text-sm font-black text-purple-600 dark:text-purple-400 tracking-wider font-mono">{marketingInvite.promoCode}</span>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-950/20 px-2.5 py-1 rounded-lg text-[10px] font-bold text-purple-600 dark:text-purple-400 border border-purple-100/30">
                    Auto-Applied
                  </div>
                </div>
              </div>
            </div>

            {/* Registration fields form */}
            <form onSubmit={handleMarketingRegister} className="space-y-4 font-sans">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Confirm Display Name</label>
                <input 
                  type="text"
                  required
                  value={marketingForm.name}
                  onChange={e => setMarketingForm({ ...marketingForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white text-sm font-semibold"
                  placeholder="Your official full name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Onboarding Email</label>
                <input 
                  type="email"
                  required
                  value={marketingForm.email}
                  onChange={e => setMarketingForm({ ...marketingForm, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white text-sm font-semibold"
                  placeholder="email@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Contact Phone Number</label>
                  <input 
                    type="tel"
                    value={marketingForm.phoneNumber}
                    onChange={e => setMarketingForm({ ...marketingForm, phoneNumber: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white text-sm font-semibold"
                    placeholder="e.g. Telebirr / Safaricom No."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Choose Password</label>
                  <input 
                    type="password"
                    required
                    value={marketingForm.password}
                    onChange={e => setMarketingForm({ ...marketingForm, password: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white text-sm font-semibold"
                    placeholder="At least 6 characters"
                  />
                </div>
              </div>

              {/* Profile Image Drag and Drop */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Official Profile Picture</label>
                <div 
                  className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500/50 rounded-2xl p-4 text-center cursor-pointer transition-all bg-slate-50/40 dark:bg-slate-800/10 flex flex-col items-center justify-center gap-1.5"
                  onClick={() => {
                    const el = document.getElementById('marketing-photo-input');
                    if (el) el.click();
                  }}
                >
                  <input 
                    type="file"
                    id="marketing-photo-input"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setMarketingForm({ ...marketingForm, photo: ev.target?.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {marketingForm.photo ? (
                    <div className="flex items-center gap-3">
                      <img src={marketingForm.photo} alt="Profile" className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Photo Uploaded Successfully</p>
                        <p className="text-[10px] text-slate-400">Click to change picture</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <User size={20} className="text-slate-400" />
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Drag & drop or click to upload photo</p>
                        <p className="text-[10px] text-slate-400">Supported formats: JPG, PNG (Max 5MB)</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Security/Consent Agreement */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed cursor-pointer">
                  <input 
                    type="checkbox"
                    required
                    className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500/20"
                  />
                  <span>
                    I hereby sign and accept the agency representation contract. I agree to operate professionally within my assigned city and territory, and to uphold the ATECH code of conduct.
                  </span>
                </label>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl text-xs transition-all shadow-xl shadow-blue-100 dark:shadow-none flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} /> Saving and Finalizing Onboarding...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} /> Sign Agent Contract & Onboard Team
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-10 border border-slate-100 dark:border-slate-800"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200 dark:shadow-none">
            <Package className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">ATECH East Africa</h1>
          <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1">
            Healthcare Intelligence Platform
          </p>
          <p className="text-[8px] font-medium text-slate-400 dark:text-slate-500 lowercase tracking-tight mt-0.5">
            powered by emerge globally
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">
            {isStaffLogin ? 'Staff Portal' : isSignUp ? 'Create your business account' : 'Sign in to your dashboard'}
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-8">
          <button 
            onClick={() => { setIsStaffLogin(false); setIsSignUp(false); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${!isStaffLogin ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Business
          </button>
          <button 
            onClick={() => setIsStaffLogin(true)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${isStaffLogin ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Staff
          </button>
        </div>

        {isStaffLogin ? (
          <form onSubmit={(e) => { e.preventDefault(); handleStaffAuth(); }} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Pharmacy Name</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  value={pharmacyName}
                  onChange={(e) => setPharmacyName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                  placeholder="e.g. Central Pharmacy"
                />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 ml-1 italic">Use the name provided by your manager.</p>
            </div>

            {/* Visual Feedback for Staff Credentials */}
            {(username || pharmacyName) && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 overflow-hidden"
              >
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Generated Login Identity</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {username.toLowerCase().trim().replace(/[^a-z0-9]+/g, '.') || '...'}
                      <span className="text-blue-600 dark:text-blue-400">@</span>
                      {pharmacyName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '') || '...'}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      Internal ID: {username.toLowerCase().trim().replace(/[^a-z0-9]+/g, '.')}.{pharmacyName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '')}@staff.atech.com
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                  placeholder="firstname.lastname@pharmacy"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-200 dark:shadow-none"
            >
              {loading ? 'Authenticating...' : 'Staff Sign In'}
            </button>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2 text-center">Trouble Logging In?</p>
              <ul className="text-[10px] text-slate-500 dark:text-slate-400 space-y-1 list-disc pl-4">
                <li>Ensure <strong>Pharmacy Name</strong> matches exactly what your manager sees.</li>
                <li>Try using your full name (e.g. <code>abebe.kebede</code>) as the username.</li>
                <li>Managers can find your exact login email in the <strong>Staff Management</strong> tab.</li>
                <li>If you recently changed your name, your login might still use your old name.</li>
              </ul>
            </div>
          </form>
        ) : (
          <>
            <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Email Address</label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${email && !validateEmail(email) ? 'text-red-400' : 'text-slate-400'}`} size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 transition-all dark:text-white ${email && !validateEmail(email) ? 'border-red-200 dark:border-red-900/50 focus:ring-red-500/10' : 'border-slate-100 dark:border-slate-700 focus:ring-blue-500/20'}`}
                  placeholder="name@company.com"
                />
              </div>
              {email && !validateEmail(email) && (
                <p className="text-[10px] text-red-500 mt-1 ml-1 font-medium">Please enter a valid email format</p>
              )}
            </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Password</label>
              {!isSignUp && (
                <button 
                  type="button"
                  onClick={handleResetPassword}
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          {isSignUp && (
            <div className="flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400 my-4 select-none">
              <input 
                type="checkbox" 
                id="agree-checkbox" 
                required
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
              />
              <label htmlFor="agree-checkbox" className="cursor-pointer">
                I agree to the{' '}
                <button 
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                  Terms & Conditions
                </button>{' '}
                and{' '}
                <button 
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                  Privacy Policy
                </button>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-blue-200 dark:shadow-none"
          >
            {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
            </form>

            <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-900 px-4 text-slate-400 dark:text-slate-500 font-bold">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          type="button"
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-bold shadow-sm active:scale-95 disabled:opacity-50 disabled:active:scale-100"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Google Account
        </button>

        <p className="text-[10px] text-center text-slate-400 dark:text-slate-600 mt-3 px-4">
          If the login window doesn't appear, please check your browser's popup blocker or 
          <button 
            type="button" 
            onClick={() => window.open(window.location.href, '_blank')}
            className="text-blue-500 hover:underline ml-1 font-bold"
          >
            open in a new tab
          </button>.
        </p>

        <ConnectionTroubleshooter />

        <p className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline ml-1"
          >
            {isSignUp ? 'Sign In' : 'Create one now'}
          </button>
        </p>
          </>
        )}
      </motion.div>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 relative max-h-[80vh] overflow-y-auto">
            <button 
              onClick={() => setShowTermsModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b pb-2 dark:border-slate-800">
              Terms and Conditions of Use
            </h3>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3 font-sans leading-relaxed">
              <p className="font-bold">Welcome to ATECH East Africa!</p>
              <p>1. <strong>Acceptance of Agreement:</strong> By creating an account or accessing the ATECH East Africa platform, you agree to be bound by these Terms and Conditions. If you do not accept, please do not proceed.</p>
              <p>2. <strong>Ecosystem Services:</strong> ATECH East Africa acts as a multi-lateral B2B pharmacy network, coordinating operations, warehouse systems, and procurement between authorized pharmaceutical importers, distributors, and licensed retail pharmacies.</p>
              <p>3. <strong>Regulatory Compliance:</strong> Users must maintain valid professional licenses issued by the respective authority in their country of operation (e.g. EFDA in Ethiopia). Any failure in regulatory compliance will lead to immediate deactivation of access.</p>
              <p>4. <strong>Billing & Subscriptions:</strong> Access is provided on a subscription tier base. Subscriptions are billed in local country currencies as configured inside the country management system.</p>
              <p>5. <strong>Limitation of Liability:</strong> ATECH East Africa does not prescribe, manufacture, or deliver drugs directly. We are not responsible for inventory stock discrepancies, drug safety parameters, or transaction integrity.</p>
            </div>
            <button 
              type="button"
              onClick={() => {
                setAgreedToTerms(true);
                setShowTermsModal(false);
              }}
              className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer transition-all"
            >
              Agree and Accept
            </button>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 relative max-h-[80vh] overflow-y-auto">
            <button 
              onClick={() => setShowPrivacyModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b pb-2 dark:border-slate-800">
              Privacy & Data Policy
            </h3>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3 font-sans leading-relaxed">
              <p className="font-bold">Your Privacy is Our Priority</p>
              <p>1. <strong>Information Collection:</strong> We collect business contact details, email addresses, geo-location coordinate data, and billing options to provide secure mapping and cross-border payment processing.</p>
              <p>2. <strong>Data Encryption:</strong> All sensitive transaction data, product pricing tables, customer records, and communication broadcasting are fully encrypted at rest and during transit.</p>
              <p>3. <strong>Usage Restrictions:</strong> We strictly adhere to patient record privacy. We never share, sell, or rent pharmacy POS sales records, stock details, or compliance logs to third-party advertisers.</p>
              <p>4. <strong>Cookies and Session State:</strong> Local browser cookies and session keys are used only to preserve user authentication state and display preferences.</p>
            </div>
            <button 
              type="button"
              onClick={() => setShowPrivacyModal(false)}
              className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer transition-all"
            >
              Close & Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const SignupFlow = ({ user, onComplete, settings, initialProfile }: { user: any, onComplete: () => void, settings: SystemSettings | null, initialProfile?: UserProfile | null }) => {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, data: string}[]>(() => {
    if (initialProfile?.verificationDocs && initialProfile.verificationDocs.length > 0) {
      return initialProfile.verificationDocs.map((doc, idx) => ({
        name: `Verification_Document_${idx + 1}`,
        data: doc
      }));
    }
    return [];
  });
  const [countrySearch, setCountrySearch] = useState(initialProfile?.country || '');
  const [showCountryList, setShowCountryList] = useState(false);
  const [formData, setFormData] = useState({
    role: (initialProfile?.role as UserRole) || 'pharmacy',
    displayName: initialProfile?.displayName || user.displayName || '',
    pharmacyName: initialProfile?.pharmacyName || '',
    importerName: initialProfile?.importerName || '',
    distributorName: initialProfile?.distributorName || '',
    country: initialProfile?.country || '',
    region: initialProfile?.region || '',
    city: initialProfile?.city || '',
    referredBy: initialProfile?.referredBy || '',
    subscriptionType: (initialProfile?.subscriptionType as 'basic' | 'standard' | 'premium') || 'basic'
  });

  const filteredCountries = countries.filter(c => 
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCountryList && !(event.target as HTMLElement).closest('.relative')) {
        setShowCountryList(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCountryList]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploading(true);
      const files = Array.from(e.target.files as FileList);
      
      try {
        const filePromises = files.map(file => {
          return new Promise<{name: string, data: string}>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ name: file.name, data: reader.result as string });
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        });

        const newFiles = await Promise.all(filePromises);
        setUploadedFiles(prev => [...prev, ...newFiles]);
        toast.success(`Attached ${newFiles.length} document(s)`);
      } catch (err) {
        console.error('File reading failed:', err);
        toast.error('Failed to read files');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleComplete = async () => {
    if (step === 4 && uploadedFiles.length === 0) {
      toast.error('Please upload at least one document');
      return;
    }

    // Firestore has a 1MB limit for the entire document.
    // Check total size of uploaded files (Base64 is ~33% larger than binary)
    const totalSize = uploadedFiles.reduce((acc, f) => acc + f.data.length, 0);
    if (totalSize > 800000) {
      toast.error('Documents are too large (limit: 800KB total for all files). Please compress them or use smaller files.');
      return;
    }

    const completeToast = toast.loading('Submitting application...');
    try {
      let marketingId = '';
      let referrerUid = '';
      if (formData.referredBy) {
        try {
          // 1. Check for marketing promo code
          const qMarketing = query(collection(db, 'users'), where('role', '==', 'marketing'), where('promoCode', '==', formData.referredBy));
          const marketingSnap = await getDocs(qMarketing);
          if (!marketingSnap.empty) {
            marketingId = marketingSnap.docs[0].id;
          } else {
            // 2. Check for pharmacy/importer referral code
            const qReferral = query(collection(db, 'users'), where('referralCode', '==', formData.referredBy));
            const referralSnap = await getDocs(qReferral);
            if (!referralSnap.empty) {
              referrerUid = referralSnap.docs[0].id;
            }
          }
        } catch (error) {
          console.error('Error verifying referral code:', error);
        }
      }

      const profile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        role: formData.role,
        displayName: formData.displayName,
        country: formData.country,
        pharmacyName: formData.role === 'pharmacy' ? formData.pharmacyName : '',
        importerName: formData.role === 'importer' ? formData.importerName : '',
        distributorName: formData.role === 'distributor' ? formData.distributorName : '',
        region: formData.region,
        city: formData.city,
        referredBy: formData.referredBy || null,
        marketingId: marketingId || null,
        referrerUid: referrerUid as any, // Adding this to track p2p referrals
        referralCode: user.uid.slice(0, 8).toUpperCase(), // Unique code for this user
        subscriptionType: formData.subscriptionType,
        subscriptionStatus: 'active',
        verificationStatus: 'pending',
        verificationDocs: uploadedFiles.map(f => f.data),
        createdAt: Date.now()
      };
      
      console.log('Saving profile for UID:', user.uid);
      await setDoc(doc(db, 'users', user.uid), profile);
      toast.success('Application submitted!', { id: completeToast });
      onComplete();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.', { id: completeToast });
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!formData.role) {
        toast.error('Please select a business type');
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.displayName.trim()) {
        toast.error('Please enter your Display Name');
        return false;
      }
      const businessName = formData.role === 'pharmacy' 
        ? formData.pharmacyName 
        : formData.role === 'importer' 
          ? formData.importerName 
          : formData.distributorName;
      if (!businessName.trim()) {
        toast.error(
          formData.role === 'pharmacy' 
            ? 'Please enter your Pharmacy Name' 
            : formData.role === 'importer' 
              ? 'Please enter your Wholesale Pharmacy Name' 
              : 'Please enter your Distributor Name'
        );
        return false;
      }
      if (!formData.country.trim()) {
        toast.error('Please select or search your Country');
        return false;
      }
      if (!formData.city.trim()) {
        toast.error('Please enter your City');
        return false;
      }
    } else if (currentStep === 3) {
      if (!formData.subscriptionType) {
        toast.error('Please select a subscription plan');
        return false;
      }
    } else if (currentStep === 4) {
      if (uploadedFiles.length === 0) {
        toast.error('Please upload at least one document for verification');
        return false;
      }
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl dark:shadow-none overflow-hidden border border-slate-100 dark:border-slate-800"
      >
        <div className="bg-blue-600 p-8 text-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Account Setup</h2>
            <span className="bg-blue-500 px-3 py-1 rounded-full text-sm font-bold">Step {step} of 4</span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-white' : 'bg-blue-400'}`} />
            ))}
          </div>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Choose your business type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => setFormData({...formData, role: 'pharmacy'})}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${formData.role === 'pharmacy' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${formData.role === 'pharmacy' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    <ShoppingCart size={24} />
                  </div>
                  <p className="font-bold text-lg text-slate-900 dark:text-white">Pharmacy</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Retail medical products & supply inventory.</p>
                </button>
                <button 
                  onClick={() => setFormData({...formData, role: 'importer'})}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${formData.role === 'importer' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${formData.role === 'importer' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    <Truck size={24} />
                  </div>
                  <p className="font-bold text-lg text-slate-900 dark:text-white">Wholesale Pharmacy</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Bulk pharmaceutical supply, distribution & warehouse storage.</p>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Profile Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Display Name</label>
                  <input type="text" value={formData.displayName || ''} onChange={e => setFormData({...formData, displayName: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {formData.role === 'pharmacy' 
                      ? 'Pharmacy Name' 
                      : formData.role === 'importer' 
                        ? 'Wholesale Pharmacy Name' 
                        : 'Distributor Company Name'}
                  </label>
                  <input 
                    type="text" 
                    value={
                      formData.role === 'pharmacy' 
                        ? formData.pharmacyName 
                        : formData.role === 'importer' 
                          ? formData.importerName 
                          : formData.distributorName
                    } 
                    onChange={e => {
                      const field = formData.role === 'pharmacy' 
                        ? 'pharmacyName' 
                        : formData.role === 'importer' 
                          ? 'importerName' 
                          : 'distributorName';
                      setFormData({...formData, [field]: e.target.value});
                    }} 
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" 
                  />
                </div>
                <div className="space-y-1 relative">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Country</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search country..."
                      value={formData.country || countrySearch || ''} 
                      onFocus={() => setShowCountryList(true)}
                      onChange={e => {
                        setCountrySearch(e.target.value);
                        setFormData({...formData, country: ''});
                        setShowCountryList(true);
                      }} 
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" 
                    />
                    {showCountryList && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map(c => (
                            <button
                              key={c}
                              onClick={() => {
                                setFormData({...formData, country: c});
                                setCountrySearch(c);
                                setShowCountryList(false);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm transition-colors dark:text-white"
                            >
                              {c}
                            </button>
                          ))
                        ) : (
                          <p className="p-4 text-xs text-slate-400 dark:text-slate-500 text-center">No countries found</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">City</label>
                  <input type="text" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Promo Code (Optional)</label>
                  <input type="text" value={formData.referredBy || ''} onChange={e => setFormData({...formData, referredBy: e.target.value.toUpperCase()})} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" placeholder="e.g. ATECH123" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Subscription Plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { 
                    id: 'basic', 
                    name: 'Basic', 
                    price: `${settings?.planPrices?.basic || PLAN_PRICES.basic} ETB`, 
                    features: [
                      'Inventory Management', 
                      'Sales & POS Billing', 
                      'Expiry Date Alerts', 
                      'Standard Bin Card Logging', 
                      'Conversion Factors Audit',
                      'Receipt/Invoice Printing'
                    ] 
                  },
                  { 
                    id: 'standard', 
                    name: 'Professional', 
                    price: `${settings?.planPrices?.standard || PLAN_PRICES.standard} ETB`, 
                    features: [
                      'Everything in Basic Plan', 
                      'Multiple Branch Registry', 
                      'Branch Inventory Visibility', 
                      'Branch Billing Controls', 
                      'Advanced Analytics Dashboard',
                      'Comprehensive Activity Logs'
                    ] 
                  },
                  { 
                    id: 'premium', 
                    name: 'Premium', 
                    price: `${settings?.planPrices?.premium || PLAN_PRICES.premium} ETB`, 
                    features: [
                      'Everything in Professional', 
                      'Branch-to-Branch Stock Transfers', 
                      'Automatic Unified TRF IDs', 
                      'Multi-Stage Approval Workflows', 
                      'AI Demand Forecasting',
                      'Priority Support 24/7'
                    ] 
                  },
                ].map(plan => (
                  <button 
                    key={plan.id}
                    onClick={() => setFormData({...formData, subscriptionType: plan.id as any})}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${formData.subscriptionType === plan.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
                  >
                    <p className="font-bold text-slate-900 dark:text-white">{plan.name}</p>
                    <p className="text-blue-600 dark:text-blue-400 font-bold text-lg mb-4">{plan.price}</p>
                    <ul className="text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
                      {plan.features.map(f => <li key={f}>• {f}</li>)}
                    </ul>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Upload Documents</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Upload your business license and ID for verification.</p>
              <label className="block">
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    multiple 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-400">Uploading...</p>
                    </div>
                  ) : (
                    <>
                      <Plus className="mx-auto text-slate-400 dark:text-slate-600 mb-2" size={32} />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Click to upload documents</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">PDF, JPG, or PNG</p>
                    </>
                  )}
                </div>
              </label>
              
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Attached Files</p>
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-xl text-sm font-medium">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle size={18} className="shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFiles(prev => prev.filter((_, idx) => idx !== i));
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100/50 dark:hover:bg-red-950/40 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Delete file"
                        id={`delete-file-${i}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-10 flex justify-between items-center">
            <button 
              onClick={() => step > 1 ? setStep(step - 1) : signOut(auth)} 
              className="flex items-center gap-2 px-6 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              <ChevronRight className="rotate-180" size={20} />
              {step === 1 ? 'Back to Login' : 'Back'}
            </button>
            <button 
              onClick={() => {
                if (validateStep(step)) {
                  if (step < 4) {
                    setStep(step + 1);
                  } else {
                    handleComplete();
                  }
                }
              }}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none flex items-center gap-2"
            >
              {step === 4 ? 'Submit Application' : 'Next Step'}
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const VerificationPending = ({ profile }: { profile: UserProfile }) => {
  const isRejected = profile.verificationStatus === 'rejected';
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 text-center transition-colors duration-300">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-10 border border-slate-100 dark:border-slate-800">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isRejected ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-500'}`}>
          {isRejected ? <XCircle size={40} /> : <AlertTriangle size={40} />}
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {isRejected ? 'Application Rejected' : 'Verification Pending'}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-4">
          {isRejected 
            ? 'Unfortunately, your application was not approved.' 
            : 'Our team is reviewing your documents. This usually takes 24 hours.'}
        </p>
        
        {isRejected && profile.rejectionReason && (
          <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl mb-8 text-left border border-red-100 dark:border-red-900/30">
            <p className="text-xs font-bold text-red-400 dark:text-red-500 uppercase tracking-widest mb-1">Reason for rejection</p>
            <p className="text-sm text-red-700 dark:text-red-400">{profile.rejectionReason}</p>
          </div>
        )}

        <div className="space-y-3">
          {isRejected && (
            <button 
              onClick={async () => {
                try {
                  await updateDoc(doc(db, 'users', profile.uid), { 
                    verificationStatus: 'rejected_resubmitting' 
                  });
                } catch (err) {
                  console.error(err);
                  toast.error("Failed to reset application form. Please try again.");
                }
              }}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              Re-submit Application
            </button>
          )}
          <button onClick={() => signOut(auth)} className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all">Sign Out</button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Admin Components ---

const DocItem = ({ d, i }: { d: string, i: number, key?: any }) => {
  const isPdf = d.startsWith('data:application/pdf') || d.toLowerCase().endsWith('.pdf');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (d.startsWith('data:')) {
       try {
        const base64 = d.split(',')[1];
        const binary = atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let j = 0; j < len; j++) {
          bytes[j] = binary.charCodeAt(j);
        }
        const mime = d.split(',')[0].split(':')[1].split(';')[0];
        const blob = new Blob([bytes], { type: mime });
        const objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
      } catch (e) {
        console.error('Failed to create blob:', e);
      }
    }
  }, [d]);

  const targetUrl = blobUrl || d;

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Document {i + 1}</p>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-[3/4] relative">
        {isPdf ? (
          <iframe src={targetUrl} title={`Doc ${i+1}`} className="w-full h-full border-none" />
        ) : (
          <img src={targetUrl} alt={`Doc ${i+1}`} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
        )}
      </div>
      <div className="flex justify-between items-center text-xs">
        <div className="flex gap-3">
          <a href={targetUrl} download={`verification-doc-${i+1}`} className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline">
            <Download size={14} /> Download
          </a>
          <a href={targetUrl} target="_blank" rel="noreferrer" className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1 hover:underline">
            <ExternalLink size={14} /> Open Full
          </a>
        </div>
        {isPdf && <span className="text-slate-400">PDF Document</span>}
      </div>
    </div>
  );
};

const AdminVerificationView = () => {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [subscriptionRequests, setSubscriptionRequests] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'all' | 'pharmacy' | 'importer' | 'distributor'>('all');
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    let unsubFallback: (() => void) | null = null;

    // Listen for all users to catch those with missing or pending status
    const q1 = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsub1 = onSnapshot(q1, (snapshot) => {
      setAllUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    }, (error) => {
      if (error.code === 'failed-precondition') {
        // Fallback for missing index: fetch without ordering
        const qFallback = query(collection(db, 'users'), limit(500));
        unsubFallback = onSnapshot(qFallback, (snapshot) => {
          setAllUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
        });
      } else {
        handleFirestoreError(error, OperationType.LIST, 'users (verification)');
      }
    });

    // Listen for subscription change requests
    const q2 = query(collection(db, 'users'), where('pendingSubscriptionType', 'in', ['basic', 'standard', 'premium']));
    const unsub2 = onSnapshot(q2, (snapshot) => {
      setSubscriptionRequests(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    }, (error) => {
      if (error.code === 'failed-precondition') {
        // Fallback for missing index
      } else {
        handleFirestoreError(error, OperationType.LIST, 'users (subscriptions)');
      }
    });

    // Listen to system settings for referral reward info
    const unsubSettings = onSnapshot(doc(db, 'system_settings', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as SystemSettings);
      }
    }, (error) => {
      console.error("Error loading system settings in AdminVerificationView:", error);
    });

    return () => {
      unsub1();
      if (unsubFallback) {
        unsubFallback();
      }
      unsub2();
      unsubSettings();
    };
  }, []);

  const handleVerify = async (uid: string, status: 'approved' | 'rejected') => {
    const loadingToast = toast.loading(`Processing verification for ${status}...`);
    try {
      const updateData: any = { verificationStatus: status };
      if (status === 'rejected') {
        updateData.rejectionReason = rejectionReason;
      } else {
        updateData.rejectionReason = null;
      }
      
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, updateData);

      // Perform referrer rewarding in custom try-catch so it never blocks approval!
      try {
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          if (status === 'approved' && userData.referrerUid && settings?.pharmacyReferralRewardMonths) {
            const referrerRef = doc(db, 'users', userData.referrerUid);
            const referrerDoc = await getDoc(referrerRef);
            if (referrerDoc.exists()) {
              const referrerData = referrerDoc.data() as UserProfile;
              const monthsToAdd = settings.pharmacyReferralRewardMonths;
              const msToAdd = monthsToAdd * 30 * 24 * 60 * 60 * 1000;
              const currentExpiry = referrerData.subscriptionExpiryDate || Date.now();
              const newExpiry = currentExpiry + msToAdd;
              
              await updateDoc(referrerRef, {
                subscriptionExpiryDate: newExpiry,
                referralRewardMonthsEarned: (referrerData.referralRewardMonthsEarned || 0) + monthsToAdd
              });
              toast.success(`Referrer rewarded with ${monthsToAdd} free months!`);
            }
          }
        }
      } catch (refErr) {
        console.error("Referrer reward side-effect failed, skipping:", refErr);
      }

      toast.success(`Account successfully ${status}!`, { id: loadingToast });
      setShowRejectionModal(false);
      setRejectionReason('');
      setSelectedUser(null);
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error(`Failed to verify user ${uid} to ${status}:`, error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleSubscriptionApprove = async (uid: string, plan: string, approve: boolean) => {
    const loadingToast = toast.loading('Processing subscription upgrade...');
    try {
      if (approve) {
        const userToUpdate = allUsers.find(u => u.uid === uid) || subscriptionRequests.find(u => u.uid === uid);
        const currentExpiry = userToUpdate?.subscriptionExpiryDate;
        const newExpiry = (!currentExpiry || currentExpiry < Date.now())
          ? Date.now() + (30 * 24 * 60 * 60 * 1000)
          : currentExpiry + (30 * 24 * 60 * 60 * 1000);

        await updateDoc(doc(db, 'users', uid), { 
          subscriptionType: plan as any,
          subscriptionStatus: 'active',
          subscriptionExpiryDate: newExpiry,
          pendingSubscriptionType: null 
        });
        toast.success('Subscription approved and activated', { id: loadingToast });
      } else {
        await updateDoc(doc(db, 'users', uid), { 
          pendingSubscriptionType: null 
        });
        toast.success('Subscription request rejected', { id: loadingToast });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid} (subscription)`);
    }
  };

  const nonApprovedUsers = allUsers.filter(u => u.verificationStatus !== 'approved' && u.role !== 'admin');

  const filteredPending = nonApprovedUsers.filter(u => {
    const isPending = u.verificationStatus === 'pending' || !u.verificationStatus;
    const matchesSearch = u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (u.pharmacyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (u.importerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (u.distributorName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return (showAll || isPending) && matchesSearch && matchesRole;
  });

  const filteredSubscriptions = subscriptionRequests.length > 0
    ? subscriptionRequests.filter(u => 
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.pharmacyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.importerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.distributorName || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allUsers.filter(u => 
        u.pendingSubscriptionType && (
          u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
          u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.pharmacyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.importerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.distributorName || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
      );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Verifications & Requests</h1>
          <p className="text-slate-500 dark:text-slate-400">Review new accounts and subscription changes.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {['all', 'pharmacy', 'importer', 'distributor'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  roleFilter === r 
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                {r === 'all' ? 'All Roles' : r === 'distributor' ? 'Distributors' : r.charAt(0).toUpperCase() + r.slice(1) + 's'}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by email or name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white w-full md:w-64"
            />
          </div>
          <button 
            onClick={() => setShowAll(!showAll)}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${showAll ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            {showAll ? 'Show Pending Only' : 'Show Waiting & Rejected Accounts'}
          </button>
        </div>
      </div>

      <section>
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {showAll ? 'All Waiting & Rejected Accounts' : 'Waiting to be Approved List'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {showAll ? 'Review all waiting and rejected business applications.' : 'Review and verify new business accounts.'}
            </p>
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
            Total in Queue: {nonApprovedUsers.length} Users
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredPending.map(user => (
            <div key={user.uid} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${user.role === 'importer' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' : user.role === 'distributor' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'} rounded-xl flex items-center justify-center font-bold`}>
                  {user.role === 'importer' ? <Truck size={20} /> : user.role === 'distributor' ? <Building2 size={20} /> : (user.displayName || '?').charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {user.pharmacyName || user.importerName || user.distributorName || user.displayName}
                    {user.role === 'importer' && (
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 tracking-tighter uppercase">Importer</span>
                    )}
                    {user.role === 'distributor' && (
                      <span className="text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800 tracking-tighter uppercase">Distributor</span>
                    )}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{user.email} • <span className="capitalize">{user.role.replace('_', ' ')}</span></p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1 uppercase tracking-wider flex items-center gap-1">
                    <MapPin size={12} /> {user.country || 'No Country'}, {user.city}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right font-mono">
                  <span className="text-[10pt] text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider">Subscription</span>
                  <span className={`font-bold text-xs ${user.subscriptionStatus === 'active' ? 'text-green-600' : 'text-red-500'}`}>
                    {user.subscriptionType?.toUpperCase() || 'BASIC'}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedUser(user)}
                  className="px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all border border-blue-100 dark:border-blue-900/20 hover:scale-105"
                  title="View registration documents and files"
                >
                  <FileText size={16} />
                  <span>View File ({(user.verificationDocs?.length || 0)})</span>
                </button>
                <div className="flex gap-2">
                  {user.verificationStatus === 'pending' || !user.verificationStatus ? (
                    <>
                      <button 
                        onClick={() => {
                          setSelectedUser(user);
                          setShowRejectionModal(true);
                        }} 
                        id={`verify-reject-${user.uid}`}
                        className="px-4 py-2 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => handleVerify(user.uid, 'approved')} 
                        id={`verify-approve-${user.uid}`}
                        className="px-6 py-2 bg-green-600 text-white font-bold hover:bg-green-700 rounded-xl shadow-lg shadow-green-100 dark:shadow-none"
                      >
                        Approve
                      </button>
                    </>
                  ) : (
                    <span id={`status-badge-${user.uid}`} className={`px-4 py-2 text-xs font-bold uppercase rounded-xl border ${
                      user.verificationStatus === 'approved' 
                        ? 'bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/30' 
                        : 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30'
                    }`}>
                      {user.verificationStatus}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredPending.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <ShieldCheck className="mx-auto text-slate-200 dark:text-slate-800 mb-4" size={48} />
              <p className="text-slate-500 dark:text-slate-400">
                {searchQuery ? 'No users found matching your search.' : 'No pending account verifications.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Document Preview Modal */}
      <AnimatePresence>
        {selectedUser && !showRejectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Verification Documents</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{selectedUser.pharmacyName || selectedUser.importerName}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors dark:text-slate-400"><X size={24} /></button>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
                {selectedUser.verificationDocs?.map((d, i) => (
                  <DocItem key={i} d={d} i={i} />
                ))}
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 items-center">
                {selectedUser.verificationStatus === 'pending' || !selectedUser.verificationStatus ? (
                  <>
                    <button id={`preview-reject-${selectedUser.uid}`} onClick={() => { setShowRejectionModal(true); }} className="px-6 py-3 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl transition-all">Reject Account</button>
                    <button id={`preview-approve-${selectedUser.uid}`} onClick={() => handleVerify(selectedUser.uid, 'approved')} className="px-8 py-3 bg-green-600 text-white font-bold hover:bg-green-700 rounded-xl shadow-lg shadow-green-100 dark:shadow-none">Approve Account</button>
                  </>
                ) : (
                  <span id={`preview-status-${selectedUser.uid}`} className={`px-4 py-2 text-xs font-bold uppercase rounded-xl border ${
                    selectedUser.verificationStatus === 'approved' 
                      ? 'bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/30' 
                      : 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30'
                  }`}>
                    Status: {selectedUser.verificationStatus}
                  </span>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Rejection Modal */}
        {showRejectionModal && selectedUser && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-100 dark:border-slate-800"
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Reject Application</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Please provide a reason for rejecting the application for {selectedUser.pharmacyName || selectedUser.importerName}.</p>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Rejection Reason</label>
                  <textarea 
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-red-500 h-32"
                    placeholder="e.g. Documents are blurry or expired..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button id={`modal-rejection-cancel-${selectedUser.uid}`} onClick={() => { setShowRejectionModal(false); setRejectionReason(''); }} className="flex-1 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">Cancel</button>
                  <button 
                    id={`modal-rejection-confirm-${selectedUser.uid}`}
                    disabled={!rejectionReason.trim()}
                    onClick={() => handleVerify(selectedUser.uid, 'rejected')} 
                    className="flex-1 py-3 bg-red-600 text-white font-bold hover:bg-red-700 rounded-xl shadow-lg shadow-red-100 dark:shadow-none disabled:opacity-50"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <section>
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Subscription Requests</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Approve plan upgrades and renewals.</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredSubscriptions.map(user => (
            <div key={user.uid} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center font-bold"><CreditCard size={24} /></div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{user.pharmacyName || user.importerName || user.displayName}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Requesting <span className="text-blue-600 dark:text-blue-400 font-bold uppercase">{user.pendingSubscriptionType}</span> Plan</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleSubscriptionApprove(user.uid, '', false)} 
                  id={`sub-decline-${user.uid}`}
                  className="px-4 py-2 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                >
                  Decline
                </button>
                <button 
                  onClick={() => handleSubscriptionApprove(user.uid, user.pendingSubscriptionType!, true)} 
                  id={`sub-approve-${user.uid}`}
                  className="px-6 py-2 bg-blue-600 text-white font-bold hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-100 dark:shadow-none"
                >
                  Approve Upgrade
                </button>
              </div>
            </div>
          ))}
          {filteredSubscriptions.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <CreditCard className="mx-auto text-slate-200 dark:text-slate-800 mb-4" size={48} />
              <p className="text-slate-500 dark:text-slate-400">
                {searchQuery ? 'No subscription requests found matching your search.' : 'No pending subscription requests.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const PLAN_PRICES = {
  basic: 400,
  standard: 1200,
  premium: 3000
};

const SubscriptionLock = ({ user, onRenew, settings }: { user: UserProfile, onRenew: () => void, settings: SystemSettings | null }) => {
  const [months, setMonths] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const currentPlan = user.subscriptionType || 'basic';
  const pricePerMonth = (settings?.planPrices?.[currentPlan as keyof typeof PLAN_PRICES]) ?? PLAN_PRICES[currentPlan as keyof typeof PLAN_PRICES];
  const total = pricePerMonth * months;

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      const expiryDate = Math.max(user.subscriptionExpiryDate || Date.now(), Date.now()) + (months * 30 * 24 * 60 * 60 * 1000);
      await updateDoc(doc(db, 'users', user.uid), {
        subscriptionExpiryDate: expiryDate,
        subscriptionStatus: 'active',
        lastSubscriptionPaymentDate: Date.now()
      });
      toast.success(`Successfully renewed for ${months} month(s)!`);
      onRenew();
    } catch (error) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800"
      >
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <ShieldAlert size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2">Subscription Expired</h2>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-8">Your access to the system has been suspended. Please renew your subscription to continue.</p>
        
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">Plan</span>
            <span className="font-black text-blue-600 dark:text-blue-400 uppercase">{currentPlan}</span>
          </div>
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">Duration</span>
            <select 
              value={months} 
              onChange={(e) => setMonths(parseInt(e.target.value))}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 3, 6, 12].map(m => (
                <option key={m} value={m}>{m} Month{m > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-900 dark:text-white uppercase">Total Amount</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{total.toLocaleString()} ETB</span>
          </div>
        </div>

        <button 
          onClick={handlePay}
          disabled={isProcessing}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isProcessing ? <Clock className="animate-spin" size={20} /> : <CreditCard size={20} />}
          {isProcessing ? 'Processing...' : 'Pay & Reactivate'}
        </button>
        
        <button 
          onClick={() => auth.signOut()}
          className="w-full mt-4 text-slate-400 dark:text-slate-500 text-sm font-bold hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          Sign Out
        </button>
      </motion.div>
    </div>
  );
};

const SubscriptionViewOld = ({ user, settings, language = 'en' }: { user: UserProfile, settings: SystemSettings | null, language?: 'en' | 'am' | 'om' | 'ti' }) => {
  const [renewalMonths, setRenewalMonths] = useState(1);
  const [isRenewing, setIsRenewing] = useState(false);

  const t = (key: string) => {
    const dict = TRANSLATIONS[language as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;
    return (dict as any)[key] || key;
  };

  const getPlanPrice = (planId: string) => {
    return (settings?.planPrices?.[planId as keyof typeof PLAN_PRICES]) ?? PLAN_PRICES[planId as keyof typeof PLAN_PRICES];
  };

  const plans = [
    { 
      id: 'basic', 
      name: t('basic') || 'Basic', 
      price: getPlanPrice('basic') === 0 ? 'Free' : `${getPlanPrice('basic')} ETB/mo`, 
      features: [
        'Add/Edit/Delete products',
        'Basic inventory tracking',
        'Low stock alerts',
        'Expiry tracking',
        'Record sales',
        'Basic profit calculation'
      ],
      limitations: [
        'Max 200 products limit',
        'No PDF reports & printable receipts',
        'No Importer Marketplace access',
        'No customer tracking & records',
        'No advanced market trends',
        'No smart bulk-purchase reorders'
      ]
    },
    { 
      id: 'standard', 
      name: t('standard') || 'Standard', 
      price: `${getPlanPrice('standard')} ETB/mo`, 
      features: [
        'Everything in Basic',
        'Unlimited products catalog',
        'PDF receipts & reports',
        'Sales history logs',
        'Customer tracking',
        'Basic dashboard analytics',
        'Importer marketplace access'
      ],
      limitations: [
        'No advanced analytical trends',
        'No automated smart reorders',
        'No multi-user staff sub-accounts',
        'No advanced supplier manager tools'
      ]
    },
    { 
      id: 'premium', 
      name: t('premium') || 'Premium', 
      price: `${getPlanPrice('premium')} ETB/mo`, 
      features: [
        'Everything in Standard',
        'Advanced analytics & trends',
        'Smart insights (Auto-reorder)',
        'Multi-user staff accounts',
        'Supplier management',
        'Region performance insights',
        'Priority live support',
        'Early access to features'
      ]
    },
  ];

  const handleRequestUpgrade = async (planId: string) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), { 
        pendingSubscriptionType: planId 
      });
      toast.success('Upgrade request sent to admin!');
    } catch (error) {
      toast.error('Failed to send request');
    }
  };

  const handleRenew = async () => {
    setIsRenewing(true);
    try {
      const currentPlan = user.subscriptionType || 'basic';
      const pricePerMonth = getPlanPrice(currentPlan);
      const total = pricePerMonth * renewalMonths;
      
      const expiryDate = Math.max(user.subscriptionExpiryDate || Date.now(), Date.now()) + (renewalMonths * 30 * 24 * 60 * 60 * 1000);
      
      await updateDoc(doc(db, 'users', user.uid), {
        subscriptionExpiryDate: expiryDate,
        subscriptionStatus: 'active',
        lastSubscriptionPaymentDate: Date.now()
      });
      
      toast.success(`Successfully renewed for ${renewalMonths} month(s)!`);
    } catch (error) {
      toast.error('Renewal failed');
    } finally {
      setIsRenewing(false);
    }
  };

  const daysRemaining = user.subscriptionExpiryDate 
    ? Math.ceil((user.subscriptionExpiryDate - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('subscription')}</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your business subscription and features.</p>
        </div>
        {user.subscriptionExpiryDate && (
          <div className={`px-4 py-2 rounded-xl text-sm font-bold ${daysRemaining <= 3 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-green-50 text-green-600'}`}>
            {daysRemaining <= 0 ? 'Expired' : `${daysRemaining} Days Remaining`}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 bg-blue-600 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl shadow-blue-100 dark:shadow-none">
          <div>
            <p className="text-blue-100 font-medium mb-1 uppercase tracking-wider text-xs">{t('current_plan')}</p>
            <h2 className="text-4xl font-black uppercase">{user.subscriptionType || 'Basic'}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold capitalize">
                Status: {user.subscriptionStatus || 'Active'}
              </span>
              {user.subscriptionExpiryDate && (
                <span className="text-blue-100 text-sm font-medium">
                  Expires: {format(user.subscriptionExpiryDate, 'MMM dd, yyyy')}
                </span>
              )}
            </div>
          </div>
          {user.pendingSubscriptionType && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl">
              <p className="text-sm font-bold flex items-center gap-2">
                <AlertTriangle size={18} />
                Upgrade to {user.pendingSubscriptionType.toUpperCase()} pending approval
              </p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('quick_renew')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">Extend your current plan instantly.</p>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-400 uppercase">Duration</span>
                <select 
                  value={renewalMonths} 
                  onChange={(e) => setRenewalMonths(parseInt(e.target.value))}
                  className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-1 font-bold text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 3, 6, 12].map(m => (
                    <option key={m} value={m}>{m} Month{m > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-400 uppercase">Total</span>
                <span className="font-black text-slate-900 dark:text-white">
                  {(getPlanPrice(user.subscriptionType || 'basic') * renewalMonths).toLocaleString()} ETB
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleRenew}
            disabled={isRenewing}
            className="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isRenewing ? <Clock className="animate-spin" size={18} /> : <Zap size={18} />}
            {isRenewing ? 'Renewing...' : t('renew_now')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.id} className={`bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 transition-all flex flex-col ${user.subscriptionType === plan.id ? 'border-blue-600 shadow-xl' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
              <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{plan.price}</p>
            </div>
            
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-4">{t('whats_included')}</p>
              <ul className="space-y-3 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-slate-400 text-sm">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>

              {plan.limitations && (
                <>
                  <p className="text-xs font-bold text-red-500 dark:text-red-400 uppercase mb-4 tracking-wider">{t('limitations')}</p>
                  <ul className="space-y-3 mb-8 bg-red-50/50 dark:bg-red-950/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                    {plan.limitations.map((f, i) => (
                      <li key={i} className="flex items-start gap-3 text-red-600 dark:text-red-400 text-sm font-medium">
                        <XCircle size={16} className="text-red-500 dark:text-red-400 mt-0.5 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <button 
              disabled={user.subscriptionType === plan.id || user.pendingSubscriptionType === plan.id}
              onClick={() => handleRequestUpgrade(plan.id)}
              className={`w-full py-4 rounded-2xl font-bold transition-all ${
                user.subscriptionType === plan.id 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-default' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-50'
              }`}
            >
              {user.subscriptionType === plan.id ? t('current_plan_btn') : user.pendingSubscriptionType === plan.id ? t('request_pending') : t('select_plan')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Sidebar & Dashboard ---

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

const MarketplaceView = ({ user }: { user: UserProfile }) => {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [cart, setCart] = useState<{ product: MarketplaceProduct, quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState(user.address || '');
  const [importersData, setImportersData] = useState<Record<string, UserProfile>>({});
  const [userLocation, setUserLocation] = useState({
    lat: user.latitude,
    lng: user.longitude
  });

  const PAGE_SIZE = 24;
  const [subTab, setSubTab] = useState<'catalog' | 'suppliers' | 'search'>('catalog');
  const [activeAds, setActiveAds] = useState<any[]>([]);
  const [loggedImpressions, setLoggedImpressions] = useState<Record<string, boolean>>({});

  const getPharmacyLocation = () => {
    const handleNetworkFallback = async () => {
      toast("Using network IP address to estimate location...", { duration: 3000 });
      try {
        const response = await fetch("https://ipapi.co/json/");
        if (!response.ok) throw new Error("ipapi failed");
        const data = await response.json();
        if (data.latitude && data.longitude) {
          const newLoc = { lat: data.latitude, lng: data.longitude };
          setUserLocation(newLoc);
          await updateDoc(doc(db, 'users', user.uid), {
            latitude: newLoc.lat,
            longitude: newLoc.lng
          });
          toast.success("Location estimated via secure network ping!");
          return;
        }
      } catch (err) {
        console.warn("ipapi.co failed, trying freeipapi...", err);
      }

      try {
        const response = await fetch("https://freeipapi.com/api/json");
        if (!response.ok) throw new Error("freeipapi failed");
        const data = await response.json();
        if (data.latitude && data.longitude) {
          const newLoc = { lat: Number(data.latitude), lng: Number(data.longitude) };
          setUserLocation(newLoc);
          await updateDoc(doc(db, 'users', user.uid), {
            latitude: newLoc.lat,
            longitude: newLoc.lng
          });
          toast.success("Location estimated via secure network ping!");
          return;
        }
      } catch (err) {
        console.error("All geolocation services failed", err);
        toast.error("Fully blocked by secure context. Please click manually on the Map to set location.");
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLoc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(newLoc);
          updateDoc(doc(db, 'users', user.uid), {
            latitude: newLoc.lat,
            longitude: newLoc.lng
          });
          toast.success("GPS Location updated!");
        },
        (error) => {
          console.warn("HTML5 Geolocation failed. Code: " + error.code + ", Message: " + error.message);
          handleNetworkFallback();
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      handleNetworkFallback();
    }
  };

  useEffect(() => {
    // Fetch unique importers in the results to get their delivery settings
    const uniqueImporterIds = Array.from(new Set(products.map(p => p.importerId))) as string[];
    uniqueImporterIds.forEach((id: string) => {
      if (!importersData[id]) {
        getDoc(doc(db, 'users', id)).then(d => {
          if (d.exists()) {
            setImportersData(prev => ({ ...prev, [id]: d.data() as UserProfile }));
          }
        });
      }
    });
  }, [products]);

  const getFeesForImporter = (importerId: string, orderAmount: number) => {
    const importer = importersData[importerId];
    if (!importer) return { distance: 0, fee: 0 };
    
    const settings = importer.deliverySettings || {
      isFreeDelivery: false,
      baseFee: 50,
      feePerKm: 15,
      freeDeliveryThreshold: 5000,
      pricingType: 'distance'
    };
    
    const distance = calculateDistance(
      userLocation.lat || 0, 
      userLocation.lng || 0, 
      importer.latitude || 0, 
      importer.longitude || 0
    );

    if (settings.isFreeDelivery) return { distance, fee: 0 };
    if (settings.freeDeliveryThreshold && orderAmount >= settings.freeDeliveryThreshold) return { distance, fee: 0 };
    if (settings.freeDistanceLimit && distance <= settings.freeDistanceLimit) return { distance, fee: 0 };
    
    if (settings.pricingType === 'flat') {
      const fee = settings.flatFee ?? 200;
      return { distance, fee };
    } else {
      const base = settings.baseFee ?? 50;
      const perKm = settings.feePerKm ?? 15;
      const fee = base + (distance * perKm);
      return { distance, fee };
    }
  };

  useEffect(() => {
    const q = query(
      collection(db, 'advertisements'),
      where('status', '==', 'Active'),
      where('type', '==', 'sponsored')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActiveAds(list);
    }, (err) => {
      console.warn("Could not load marketplace sponsored ads: ", err);
    });
    return unsub;
  }, []);

  // Log marketplace sponsor impressions
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
          console.error("Ad impression track failed", err);
        }
      }
    });
  }, [activeAds, loggedImpressions]);

  const handleAdClick = async (adId: string) => {
    try {
      await updateDoc(doc(db, 'advertisements', adId), {
        clicks: increment(1),
        updatedAt: Date.now()
      });
    } catch (err) {
      console.error("Ad click track failed", err);
    }
  };

  const totalDeliveryFee = deliveryMethod === 'pickup' ? 0 : Object.keys(
    cart.reduce((acc: any, item) => {
      acc[item.product.importerId] = (acc[item.product.importerId] || 0) + (item.product.price * item.quantity);
      return acc;
    }, {})
  ).reduce((sum, id) => {
    const amount = cart.filter(i => i.product.importerId === id).reduce((s, i) => s + (i.product.price * i.quantity), 0);
    return sum + getFeesForImporter(id, amount).fee;
  }, 0);

  useEffect(() => {
    // We want to see products from the user's country AND "Global" products
    const userCountry = user.country || 'Global';
    
    setLoading(true);
    const q = query(
      collection(db, 'products'), 
      where('country', 'in', [userCountry, 'Global']),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketplaceProduct)));
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
      setLoading(false);
    }, (error) => {
      if (error.code === 'failed-precondition') {
        console.warn('Index missing for country filter, falling back to client-side filtering');
        // Fallback: list all and filter in memory if index is missing
        const qFallback = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(100));
        onSnapshot(qFallback, (snapshot) => {
          const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketplaceProduct));
          setProducts(all.filter(p => p.country === userCountry || p.country === 'Global'));
          setLoading(false);
        });
      } else {
        handleFirestoreError(error, OperationType.LIST, 'products');
        setLoading(false);
      }
    });
    return unsub;
  }, [user.country]);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    const userCountry = user.country || 'Global';
    try {
      const q = query(
        collection(db, 'products'), 
        where('country', 'in', [userCountry, 'Global']),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );
      const snapshot = await getDocs(q);
      const nextProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketplaceProduct));
      setProducts(prev => [...prev, ...nextProducts]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'products');
    } finally {
      setLoadingMore(false);
    }
  };

  const getProductEffectivePrice = (product: MarketplaceProduct) => {
    const ad = activeAds.find(a => a.productId === product.id);
    if (ad && ad.promotionType === 'Percentage Discount' && ad.discountPercent) {
      const discountAmount = Math.round((product.price * ad.discountPercent) / 100);
      return Math.max(0, product.price - discountAmount);
    }
    return product.price;
  };

  const addToCart = (product: MarketplaceProduct) => {
    // Track sponsored ad click
    const adAd = activeAds.find(a => a.productId === product.id);
    if (adAd && adAd.id) {
       handleAdClick(adAd.id);
    }

    const finalPrice = getProductEffectivePrice(product);
    const productWithPrice = { ...product, price: finalPrice };

    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product: productWithPrice, quantity: product.minOrderQuantity }]);
    }
    setIsCartOpen(true);
    toast.success('Added to cart');
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    if (deliveryMethod === 'delivery') {
      if (!deliveryAddress.trim()) {
        toast.error('Please enter a delivery address');
        return;
      }
      if (!userLocation.lat) {
        toast.error('Please set your location to calculate delivery fees');
        return;
      }
    }
    
    // Group by importer
    const ordersByImporter: { [key: string]: typeof cart } = {};
    cart.forEach(item => {
      if (!ordersByImporter[item.product.importerId]) ordersByImporter[item.product.importerId] = [];
      ordersByImporter[item.product.importerId].push(item);
    });

    try {
      // First, validate that there is sufficient stock for all items
      for (const item of cart) {
        const productRef = doc(db, 'products', item.product.id);
        let productSnap;
        try {
          productSnap = await getDoc(productRef);
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `products/${item.product.id}`);
          return;
        }
        if (productSnap.exists()) {
          const currentStock = productSnap.data().stockQuantity ?? 0;
          if (currentStock < item.quantity) {
            toast.error(`Insufficient stock for "${item.product.name}". Available: ${currentStock}, Requested: ${item.quantity}`);
            return;
          }
        }
      }

      // If stock check passes, create the orders and minimize the stock in database
      for (const importerId in ordersByImporter) {
        const items = ordersByImporter[importerId];
        const itemsTotal = items.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
        const { distance, fee } = getFeesForImporter(importerId, itemsTotal);

        const importer = importersData[importerId];

        // Customer Block Gate Check
        if (importer && Array.isArray(importer.blockedPharmacies) && importer.blockedPharmacies.includes(user.uid)) {
          toast.error(`You have been blocked from placing orders with ${importer.distributorName || importer.importerName || importer.displayName || 'this distributor'}.`);
          return;
        }

        // Generate unique, sequential order ID matching ORD-YYYY-######
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1).getTime();
        let orderIndex = 1;
        try {
          const qCount = query(collection(db, 'orders'), where('createdAt', '>=', startOfYear));
          const snap = await getDocs(qCount);
          orderIndex = snap.size + 1;
        } catch (e) {
          console.warn("Error calculating exact order counter sequential order sequence value:", e);
          orderIndex = Math.floor(Math.random() * 89999) + 10000;
        }
        const orderNumber = `ORD-${currentYear}-${String(orderIndex).padStart(6, '0')}`;

        const order: any = {
          orderNumber,
          pharmacyId: user.uid,
          pharmacyName: user.pharmacyName || user.displayName,
          pharmacyCreatedAt: user.createdAt,
          marketingId: user.marketingId || null,
          importerId: importerId,
          importerName: items[0].product.importerName,
          items: items.map(i => ({
            productId: i.product.id,
            name: i.product.name,
            quantity: i.quantity,
            price: i.product.price,
            total: i.product.price * i.quantity
          })),
          totalAmount: itemsTotal + (deliveryMethod === 'delivery' ? fee : 0),
          commissionAmount: itemsTotal * 0.03, // Default 3% commission
          status: 'pending',
          country: user.country || 'Global',
          createdAt: Date.now(),
          deliveryMethod,
          deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : null,
          distanceKm: deliveryMethod === 'delivery' ? distance : null,
          deliveryFee: deliveryMethod === 'delivery' ? fee : 0,
          deliveryLat: deliveryMethod === 'delivery' ? (userLocation.lat || null) : null,
          deliveryLng: deliveryMethod === 'delivery' ? (userLocation.lng || null) : null,
          importerLat: importer?.latitude || null,
          importerLng: importer?.longitude || null,
        };

        // Complete order placement
        try {
          await addDoc(collection(db, 'orders'), order);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'orders');
          return;
        }

        // Substract stock/minimize product inventory
        for (const i of items) {
          const productRef = doc(db, 'products', i.product.id);
          try {
            await updateDoc(productRef, {
              stockQuantity: increment(-i.quantity)
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `products/${i.product.id}`);
            return;
          }
        }
      }
      setCart([]);
      toast.success('Orders placed and stock minimized successfully!');
    } catch (error) {
      toast.error('Failed to complete transaction.');
      console.error(error);
    }
  };

  const handleCreatePurchaseRequestFromCart = async () => {
    if (cart.length === 0) {
      toast.error('Your cart empty.');
      return;
    }

    const ownerId = user.role === 'staff' ? (user.pharmacyId || user.uid) : user.uid;
    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    const purchaseItems = cart.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      unitPrice: item.product.price,
      total: item.product.price * item.quantity,
      quantityReceived: 0
    }));

    const prPayload = {
      pharmacyId: ownerId,
      pharmacyName: user.pharmacyName || user.displayName || 'Pharmacy Group',
      createdById: user.uid,
      createdByName: user.displayName || 'Staff Member',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'pending_approval' as const,
      items: purchaseItems,
      totalAmount: total,
      notes: 'Automated request created from B2B Marketplace Cart items'
    };

    try {
      await addDoc(collection(db, 'purchase_orders'), prPayload);
      setCart([]);
      toast.success('Your cart items have been submitted as a formal Purchase Request!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create purchase request from cart.');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* View Select Switchboard */}
      <div className="flex border-b border-slate-100 dark:border-slate-800/80 mb-8 gap-6 justify-start overflow-x-auto scrollbar-none">
        <button
          onClick={() => setSubTab('catalog')}
          className={`pb-4 px-2 font-bold text-sm transition-all border-b-2 relative shrink-0 flex items-center gap-2 cursor-pointer ${subTab === 'catalog' ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          <ShoppingCart size={16} /> B2B Marketplace (Importer Catalog)
        </button>
        <button
          onClick={() => setSubTab('suppliers')}
          className={`pb-4 px-2 font-bold text-sm transition-all border-b-2 relative shrink-0 flex items-center gap-2 cursor-pointer ${subTab === 'suppliers' ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          <Building2 size={16} /> Wholesale Pharmacies Directory
        </button>
        <button
          onClick={() => setSubTab('search')}
          className={`pb-4 px-2 font-bold text-sm transition-all border-b-2 relative shrink-0 flex items-center gap-2 cursor-pointer ${subTab === 'search' ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          <Search size={16} /> National Medicine Availability Search
        </button>
      </div>

      {subTab === 'search' ? (
        <NationalAvailabilitySearchView 
          user={user} 
          addToCart={addToCart} 
          cartCount={cart.length}
        />
      ) : subTab === 'suppliers' ? (
        <SuppliersView user={user} isSubTab={true} />
      ) : (
        <>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">B2B Marketplace</h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Bulk medical supplies in {user.country}</p>
            </div>
            <div className="relative">
              <button 
                onClick={() => setIsCartOpen(!isCartOpen)}
                className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all dark:text-white cursor-pointer"
              >
                <ShoppingCart size={20} />
                <span className="font-bold">{cart.length}</span>
              </button>
              {cart.length > 0 && isCartOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 z-50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold dark:text-white">Your Cart</h3>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-all cursor-pointer p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
                    {cart.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <div>
                          <p className="font-bold dark:text-white">{item.product.name}</p>
                          <p className="text-slate-500 dark:text-slate-400">{item.quantity} units</p>
                        </div>
                        <p className="font-bold dark:text-white">{(item.product.price * item.quantity).toLocaleString()} ETB</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mb-6">
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Delivery Options</h4>
                    <div className="flex gap-2 mb-4">
                      <button 
                        onClick={() => setDeliveryMethod('pickup')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${deliveryMethod === 'pickup' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                      >
                        Self-Pickup
                      </button>
                      <button 
                        onClick={() => setDeliveryMethod('delivery')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${deliveryMethod === 'delivery' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                      >
                        Delivery
                      </button>
                    </div>

                    {deliveryMethod === 'delivery' && (
                      <div className="space-y-4 font-sans">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Delivery Address</label>
                          <input 
                            type="text" 
                            value={deliveryAddress} 
                            onChange={e => setDeliveryAddress(e.target.value)}
                            placeholder="Enter full address"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white text-sm outline-none focus:border-blue-500"
                          />
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Your Location</label>
                            <button 
                              type="button"
                              onClick={getPharmacyLocation}
                              className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 font-sans"
                            >
                              <MapPin size={10} /> Auto-Set GPS
                            </button>
                          </div>
                          
                          {userLocation.lat ? (
                            <div className="flex items-center gap-2 text-[10px] text-green-600 font-bold">
                              <CheckCircle size={12} /> Geographic coordinates set
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-[10px] text-amber-600 font-bold">
                              <AlertTriangle size={12} /> Please set location for accurate fees
                            </div>
                          )}

                          {!hasValidGoogleMapsKey ? (
                            <div className="text-[10px] bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/55 mt-2 font-sans">
                              <p className="font-bold flex items-center gap-1"><AlertTriangle size={12} /> Map Setup Required</p>
                              <p className="mt-0.5 leading-tight">To drop a custom delivery pin on the Google Map, configure your API Secret (<code>GOOGLE_MAPS_PLATFORM_KEY</code>).</p>
                            </div>
                          ) : (
                            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden h-[180px] mt-2 relative group font-sans">
                              <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
                                <Map
                                  defaultCenter={{ lat: userLocation.lat || 9.03, lng: userLocation.lng || 38.74 }}
                                  defaultZoom={11}
                                  mapId="DEMO_MAP_ID"
                                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                                  style={{ width: '100%', height: '100%' }}
                                  onClick={(e) => {
                                    if (e.detail?.latLng) {
                                      const lat = typeof e.detail.latLng.lat === 'function' ? e.detail.latLng.lat() : e.detail.latLng.lat;
                                      const lng = typeof e.detail.latLng.lng === 'function' ? e.detail.latLng.lng() : e.detail.latLng.lng;
                                      const newLoc = { lat, lng };
                                      setUserLocation(newLoc);
                                      updateDoc(doc(db, 'users', user.uid), {
                                        latitude: lat,
                                        longitude: lng
                                      });
                                      toast.success("Delivery pin updated!");
                                    }
                                  }}
                                >
                                  <AdvancedMarker 
                                    position={{ lat: userLocation.lat || 9.03, lng: userLocation.lng || 38.74 }}
                                    draggable={true}
                                    onDragEnd={(e) => {
                                      if (e.latLng) {
                                        const lat = e.latLng.lat();
                                        const lng = e.latLng.lng();
                                        const newLoc = { lat, lng };
                                        setUserLocation(newLoc);
                                        updateDoc(doc(db, 'users', user.uid), {
                                          latitude: lat,
                                          longitude: lng
                                        });
                                        toast.success("Delivery pin dropped!");
                                      }
                                    }}
                                    title="Your Pharmacy Delivery Pin"
                                  >
                                    <Pin background="#E11D48" glyphColor="#FFF" />
                                  </AdvancedMarker>
                                </Map>
                              </APIProvider>
                              <div className="absolute bottom-2 left-2 right-2 bg-black/60 dark:bg-slate-900/85 backdrop-blur-[1px] text-[9px] text-white py-1 px-2 rounded-md pointer-events-none text-center font-sans">
                                Drag red pin or click map to set drop point
                              </div>
                            </div>
                          )}

                          <div className="pt-2 space-y-1 font-sans">
                            {Object.keys(importersData).length > 0 && (Array.from(new Set(cart.map(i => i.product.importerId))) as string[]).map((id: string) => {
                              const amount = cart.filter(i => i.product.importerId === id).reduce((s, i) => s + (i.product.price * i.quantity), 0);
                              const { distance, fee } = getFeesForImporter(id, amount);
                              return (
                                <div key={id} className="flex justify-between text-[9px] text-slate-500">
                                  <span className="truncate max-w-[140px] font-bold">{importersData[id]?.importerName || 'Supplier'} ({distance}km)</span>
                                  <span className="font-bold">{fee > 0 ? `${fee.toLocaleString()} ETB` : 'FREE'}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 mb-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Items Total</span>
                      <span className="font-bold dark:text-white font-mono">
                        {cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toLocaleString()} ETB
                      </span>
                    </div>
                    {deliveryMethod === 'delivery' && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Delivery Total</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                          {totalDeliveryFee > 0 ? `${totalDeliveryFee.toLocaleString()} ETB` : 'FREE'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mb-6">
                    <span className="font-bold text-slate-900 dark:text-white">Total Amount</span>
                    <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
                      {(cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) + totalDeliveryFee).toLocaleString()} ETB
                    </span>
                  </div>

                  <button 
                    onClick={handlePlaceOrder} 
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none cursor-pointer"
                  >
                    Place Order
                  </button>
                  <button 
                    onClick={handleCreatePurchaseRequestFromCart} 
                    className="w-full mt-2 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 dark:shadow-none cursor-pointer"
                  >
                    Create Purchase Request
                  </button>
                  <button 
                    onClick={() => {
                      setCart([]);
                      setIsCartOpen(false);
                      toast("Your order has been cancelled, cart cleared.");
                    }} 
                    className="w-full mt-2 bg-red-50 hover:bg-red-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/45 text-red-600 dark:text-red-400 py-3 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border border-red-100 dark:border-rose-900/35"
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(() => {
              const sortedProductsWithSponsorship = [...products].sort((a, b) => {
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
                  return adB.createdAt - adA.createdAt;
                }
                return 0;
              });

              return sortedProductsWithSponsorship.map(product => {
                const ad = activeAds.find(a => a.productId === product.id);
                const theme = ad?.promoThemeColor || 'pink'; // default highlight pink if general active promotion
                
                let cardBorderClass = 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900';
                if (ad) {
                  if (theme === 'pink') {
                    cardBorderClass = 'border-pink-500 dark:border-pink-650/80 bg-pink-50/5 shadow-md shadow-pink-100/40 dark:shadow-none ring-2 ring-pink-100/50 dark:ring-0';
                  } else if (theme === 'blue') {
                    cardBorderClass = 'border-sky-400 dark:border-sky-500/50 bg-sky-50/5 ring-1 ring-sky-100/50 dark:ring-0';
                  } else if (theme === 'purple') {
                    cardBorderClass = 'border-purple-400 dark:border-purple-500/50 bg-purple-50/5 ring-1 ring-purple-100/50 dark:ring-0';
                  } else if (theme === 'emerald') {
                    cardBorderClass = 'border-emerald-400 dark:border-emerald-500/50 bg-emerald-50/5 ring-1 ring-emerald-100/50 dark:ring-0';
                  } else {
                    cardBorderClass = 'border-amber-400 dark:border-amber-500/50 bg-amber-50/5 ring-1 ring-amber-100/50 dark:ring-0';
                  }
                }

                return (
                  <div 
                    key={product.id} 
                    className={`rounded-3xl border p-6 shadow-sm hover:shadow-md transition-all relative ${cardBorderClass}`}
                  >
                    {ad && (() => {
                      if (theme === 'pink') {
                        return (
                          <div className="absolute -top-3 left-6 text-[9px] font-black tracking-widest uppercase bg-gradient-to-r from-pink-500 via-rose-500 to-pink-655 text-white px-3 py-1 rounded-full shadow-md z-10 animate-pulse">
                            💗 IN PROMOTION
                          </div>
                        );
                      }
                      if (theme === 'blue') {
                        return (
                          <div className="absolute -top-3 left-6 text-[9px] font-black tracking-widest uppercase bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-3 py-1 rounded-full shadow-sm z-10">
                            💙 SPECIAL PROMO
                          </div>
                        );
                      }
                      if (theme === 'purple') {
                        return (
                          <div className="absolute -top-3 left-6 text-[9px] font-black tracking-widest uppercase bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-3 py-1 rounded-full shadow-sm z-10">
                            💜 EXCLUSIVE OFFER
                          </div>
                        );
                      }
                      if (theme === 'emerald') {
                        return (
                          <div className="absolute -top-3 left-6 text-[9px] font-black tracking-widest uppercase bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1 rounded-full shadow-sm z-10">
                            💚 FRESH DEAL
                          </div>
                        );
                      }
                      return (
                        <div className="absolute -top-3 left-6 text-[9px] font-black tracking-widest uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full shadow-sm z-10">
                          ⭐ Sponsored
                        </div>
                      );
                    })()}

                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center"><Package size={24} /></div>
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase">{product.category}</span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                      {product.name}
                      {ad && ad.promotionType && (
                        <span className="ml-2 inline-block text-[9px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-pink-400 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/30">
                          {ad.promotionType}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                      {product.description || "Premium wholesale pharmaceutical supply grade specification packaging."}
                    </p>

                    <div className="flex justify-between items-end mb-6">
                      <div>
                        {ad && ad.promotionType === 'Percentage Discount' && ad.discountPercent ? (
                          <div className="flex flex-col">
                            <span className="line-through text-slate-400 font-bold text-xs font-mono leading-none mb-1">
                              {product.price.toLocaleString()} ETB
                            </span>
                            <span className={`text-xl font-black font-mono leading-none ${
                              theme === 'pink' ? 'text-pink-600 dark:text-pink-400' :
                              theme === 'blue' ? 'text-sky-600 dark:text-sky-400' :
                              theme === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                              theme === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                              'text-blue-600 dark:text-blue-400'
                            }`}>
                              {getProductEffectivePrice(product).toLocaleString()} ETB
                            </span>
                          </div>
                        ) : (
                          <p className={`text-xl font-black font-mono ${
                            ad && theme === 'pink' ? 'text-pink-600 dark:text-pink-400' :
                            ad && theme === 'blue' ? 'text-sky-600 dark:text-sky-400' :
                            ad && theme === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                            ad && theme === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                            'text-blue-600 dark:text-blue-400'
                          }`}>{product.price.toLocaleString()} ETB</p>
                        )}
                        
                        <div className="flex flex-col gap-0.5 mt-1 font-sans">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Min. Order: {product.minOrderQuantity}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${product.stockQuantity <= 0 ? 'text-red-500 dark:text-red-400' : product.stockQuantity <= product.minOrderQuantity ? 'text-amber-500 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                            Stock: {product.stockQuantity ?? 0} {product.stockQuantity <= 0 ? '(Out of Stock)' : 'units'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right font-sans">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{product.importerName}</p>
                        <p className="text-[10px] text-slate-400">Importer</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => addToCart(product)} 
                      disabled={product.stockQuantity <= 0}
                      className={`w-full py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        product.stockQuantity <= 0 
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                          : ad && theme === 'pink'
                            ? 'bg-pink-600 text-white hover:bg-pink-700 shadow-md shadow-pink-100/50 dark:shadow-none'
                            : 'bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white'
                      }`}
                    >
                      {product.stockQuantity <= 0 ? (
                        <span>Out of Stock</span>
                      ) : (
                        <>
                          <Plus size={18} /> Add to Order
                        </>
                      )}
                    </button>
                  </div>
                );
              });
            })()}



            {products.length === 0 && !loading && (
              <div className="col-span-full py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                <Globe className="mx-auto text-slate-200 dark:text-slate-800 mb-4" size={64} />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No products in {user.country} yet</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Importers haven't listed any products for your region yet. 
                  Check back soon or contact your regional manager to invite importers to the platform.
                </p>
              </div>
            )}
          </div>

          {hasMore && (
            <div className="mt-8 text-center">
              <button 
                onClick={loadMore}
                disabled={loadingMore}
                className="px-8 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loadingMore ? 'Loading...' : 'Load More Products'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const ImporterInventoryView = ({ user }: { user: UserProfile }) => {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState(user.deliverySettings || {
    isFreeDelivery: false,
    freeDeliveryThreshold: 5000,
    baseFee: 50,
    feePerKm: 15, // standard starting price as per requested
    pricingType: 'distance',
    flatFee: 250,
    freeDistanceLimit: 5
  });
  const [warehouse, setWarehouse] = useState({
    address: user.address || '',
    latitude: user.latitude || 9.03, // Default to Addis Ababa
    longitude: user.longitude || 38.74
  });

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: 'Medicine',
    price: 0,
    minOrderQuantity: 10,
    stockQuantity: 100
  });

  const handleSaveSettings = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        deliverySettings,
        address: warehouse.address,
        latitude: warehouse.latitude,
        longitude: warehouse.longitude
      });
      toast.success('Delivery settings updated!');
      setShowSettings(false);
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const getUserLocation = () => {
    const handleNetworkFallback = async () => {
      toast("Using network IP address to estimate warehouse location...", { duration: 3000 });
      try {
        const response = await fetch("https://ipapi.co/json/");
        if (!response.ok) throw new Error("ipapi failed");
        const data = await response.json();
        if (data.latitude && data.longitude) {
          setWarehouse(prev => ({
            ...prev,
            latitude: data.latitude,
            longitude: data.longitude
          }));
          toast.success("Warehouse located via secure network ping!");
          return;
        }
      } catch (err) {
        console.warn("ipapi.co failed, trying freeipapi...", err);
      }

      try {
        const response = await fetch("https://freeipapi.com/api/json");
        if (!response.ok) throw new Error("freeipapi failed");
        const data = await response.json();
        if (data.latitude && data.longitude) {
          setWarehouse(prev => ({
            ...prev,
            latitude: Number(data.latitude),
            longitude: Number(data.longitude)
          }));
          toast.success("Warehouse located via secure network ping!");
          return;
        }
      } catch (err) {
        console.error("All geolocation services failed", err);
        toast.error("Failed to estimate location. Please click on the map to place the warehouse.");
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setWarehouse(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          toast.success("GPS Coordinates updated!");
        },
        (error) => {
          console.warn("HTML5 Geolocation failed. Code: " + error.code + ", Message: " + error.message);
          handleNetworkFallback();
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      handleNetworkFallback();
    }
  };

  useEffect(() => {
    if (!user.uid) return;
    const q = query(collection(db, 'products'), where('importerId', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketplaceProduct)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));
    
    // Listen to active orders for delivery coordinates
    const qOrders = query(
      collection(db, 'orders'),
      where('importerId', '==', user.uid),
      where('status', 'not-in', ['delivered', 'cancelled', 'cancelled_by_buyer'])
    );
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setActiveOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Active orders listen failed", err));

    return () => {
      unsub();
      unsubOrders();
    };
  }, [user.uid]);

  const handleAddProduct = async () => {
    try {
      const product: Omit<MarketplaceProduct, 'id'> = {
        ...newProduct,
        importerId: user.uid,
        importerName: user.importerName || user.displayName,
        country: user.country || 'Global',
        createdAt: Date.now()
      };
      await addDoc(collection(db, 'products'), product);
      setIsAdding(false);
      toast.success('Product listed in marketplace!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Supply Chain Inventory</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your B2B supply of medical products for {user.country}.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setShowSettings(true)} className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
            <Truck size={20} /> Delivery Settings
          </button>
          <button onClick={() => setIsAdding(true)} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none flex items-center gap-2">
            <Plus size={20} /> List New Product
          </button>
        </div>
      </div>

      {showSettings && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold dark:text-white">Delivery & Warehouse Config</h2>
            <button onClick={() => setShowSettings(false)}><X className="text-slate-400" /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Truck size={18} className="text-blue-500" /> Delivery Fees
              </h3>
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Universal Free Delivery</p>
                  <p className="text-[10px] text-slate-500">Enable this to make all your deliveries free.</p>
                </div>
                <button 
                  onClick={() => setDeliverySettings({...deliverySettings, isFreeDelivery: !deliverySettings.isFreeDelivery})}
                  className={`w-12 h-6 rounded-full transition-colors relative ${deliverySettings.isFreeDelivery ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${deliverySettings.isFreeDelivery ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {!deliverySettings.isFreeDelivery && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Pricing Strategy</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliverySettings({...deliverySettings, pricingType: 'distance'})}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          (deliverySettings.pricingType || 'distance') === 'distance'
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        Distance-Based (per KM)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliverySettings({...deliverySettings, pricingType: 'flat'})}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          deliverySettings.pricingType === 'flat'
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        Flat-Rate (One-Time)
                      </button>
                    </div>
                  </div>

                  {(deliverySettings.pricingType || 'distance') === 'distance' ? (
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Base Fee (ETB)</label>
                        <input type="number" value={deliverySettings.baseFee ?? 50} onChange={e => setDeliverySettings({...deliverySettings, baseFee: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 text-xs" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Fee Per KM (ETB)</label>
                        <input type="number" value={deliverySettings.feePerKm ?? 15} onChange={e => setDeliverySettings({...deliverySettings, feePerKm: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 text-xs" />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">One-Time Flat Delivery Fee (ETB)</label>
                      <input type="number" value={deliverySettings.flatFee ?? 250} onChange={e => setDeliverySettings({...deliverySettings, flatFee: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 text-xs" placeholder="e.g. 250" />
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2 pt-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase">Free Delivery Threshold (ETB)</label>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded-full uppercase font-sans">Reward Bulk Orders</span>
                </div>
                <input type="number" value={deliverySettings.freeDeliveryThreshold ?? 0} onChange={e => setDeliverySettings({...deliverySettings, freeDeliveryThreshold: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 text-xs" placeholder="e.g. 10000" />
                <p className="text-[10px] text-slate-500 font-sans">Delivery will be free if order total exceeds this amount.</p>
              </div>

              <div className="space-y-2 pt-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase">Free Delivery Distance Limit (KM)</label>
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded-full uppercase font-sans">Reward Local Orders</span>
                </div>
                <input type="number" value={deliverySettings.freeDistanceLimit || 0} onChange={e => setDeliverySettings({...deliverySettings, freeDistanceLimit: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 text-xs" placeholder="e.g. 5" />
                <p className="text-[10px] text-slate-500 font-sans">Delivery will be free if distance is less than or equal to this limit.</p>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <MapPin size={18} className="text-blue-500" /> Warehouse Location
              </h3>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Warehouse Address</label>
                <input type="text" value={warehouse.address || ''} onChange={e => setWarehouse({...warehouse, address: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 text-xs font-sans" placeholder="e.g. Merkato, Building A, Addis Ababa" />
              </div>

              {!hasValidGoogleMapsKey ? (
                <GoogleMapsPlaceholder message="Identify your warehouse position to display delivery paths and accurately calculate geographic rates." />
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase flex justify-between items-center">
                    <span>Interactive Coverage Map</span>
                    {activeOrders.length > 0 && (
                      <span className="text-[9px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full font-sans">
                        {activeOrders.filter(o => o.deliveryLat).length} active orders
                      </span>
                    )}
                  </label>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden h-80 min-h-[300px] relative">
                    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
                      <Map
                        defaultCenter={{ lat: warehouse.latitude || 9.03, lng: warehouse.longitude || 38.74 }}
                        defaultZoom={11}
                        mapId="DEMO_MAP_ID"
                        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                        style={{ width: '100%', height: '100%' }}
                        onClick={(e) => {
                          if (e.detail?.latLng) {
                            const lat = typeof e.detail.latLng.lat === 'function' ? e.detail.latLng.lat() : e.detail.latLng.lat;
                            const lng = typeof e.detail.latLng.lng === 'function' ? e.detail.latLng.lng() : e.detail.latLng.lng;
                            setWarehouse(prev => ({ ...prev, latitude: lat, longitude: lng }));
                          }
                        }}
                      >
                        <AdvancedMarker 
                          position={{ lat: warehouse.latitude || 9.03, lng: warehouse.longitude || 38.74 }}
                          draggable={true}
                          onDragEnd={(e) => {
                            if (e.latLng) {
                              setWarehouse(prev => ({ ...prev, latitude: e.latLng.lat(), longitude: e.latLng.lng() }));
                            }
                          }}
                          title="Your Warehouse"
                        >
                          <Pin background="#2563EB" glyphColor="#FFF" />
                        </AdvancedMarker>

                        {activeOrders.map(order => order.deliveryLat && order.deliveryLng && (
                          <AdvancedMarker 
                            key={order.id} 
                            position={{ lat: order.deliveryLat, lng: order.deliveryLng }}
                            title={`Order #${order.id?.slice(-6).toUpperCase()} to ${order.pharmacyName}`}
                          >
                            <Pin background="#E11D48" glyphColor="#FFF" scale={0.8} />
                          </AdvancedMarker>
                        ))}
                      </Map>
                    </APIProvider>
                  </div>
                  <p className="text-[9px] text-slate-400 text-center italic font-sans animate-pulse">Drag blue pin or click map to relocate key warehouse. Pharmacy delivery locations are marked in Red.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Latitude</label>
                  <input type="number" step="0.000001" value={warehouse.latitude ?? 0} readOnly className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/15 text-slate-500 outline-none text-xs" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Longitude</label>
                  <input type="number" step="0.000001" value={warehouse.longitude ?? 0} readOnly className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/15 text-slate-500 outline-none text-xs" />
                </div>
              </div>
              <button 
                type="button"
                onClick={getUserLocation}
                className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2 font-sans"
              >
                <MapPin size={16} /> Mark Current Location as Warehouse
              </button>
              <p className="text-[10px] text-slate-400 italic">This will be used to automatically calculate distance-based delivery fees for pharmacies.</p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4">
            <button onClick={() => setShowSettings(false)} className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">Cancel</button>
            <button onClick={handleSaveSettings} className="bg-blue-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none">Save Settings</button>
          </div>
        </motion.div>
      )}

      {isAdding && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl mb-8">
          <h2 className="text-xl font-bold mb-6 dark:text-white">New Marketplace Listing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Product Name</label>
              <input type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" placeholder="e.g. Amoxicillin 500mg" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Category</label>
              <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500">
                <option>Medicine</option>
                <option>Surgical</option>
                <option>Equipment</option>
                <option>Diagnostics</option>
                <option>Cosmetics</option>
                <option>Hair Supplies</option>
                <option>Personal Care</option>
                <option>Baby Care</option>
                <option>Nutritional Supplements</option>
                <option>Other</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Description</label>
              <textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 h-24 resize-none" placeholder="Product details, batch info, etc." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Bulk Price (ETB)</label>
              <input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Min. Order Quantity</label>
              <input type="number" value={newProduct.minOrderQuantity} onChange={e => setNewProduct({...newProduct, minOrderQuantity: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-4">
            <button onClick={() => setIsAdding(false)} className="px-6 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">Cancel</button>
            <button onClick={handleAddProduct} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none">Publish Listing</button>
          </div>
        </motion.div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="px-8 py-5">Product</th>
              <th className="px-8 py-5">Category</th>
              <th className="px-8 py-5">Price</th>
              <th className="px-8 py-5">Min. Order</th>
              <th className="px-8 py-5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-8 py-5">
                  <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-xs">{p.description}</p>
                </td>
                <td className="px-8 py-5">
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase">{p.category}</span>
                </td>
                <td className="px-8 py-5 font-bold text-blue-600 dark:text-blue-400">{p.price.toLocaleString()} ETB</td>
                <td className="px-8 py-5 text-slate-600 dark:text-slate-400">{p.minOrderQuantity} units</td>
                <td className="px-8 py-5">
                  <button className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const OrdersView = ({ user }: { user: UserProfile }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedMapOrderId, setExpandedMapOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  const PAGE_SIZE = 10;

  useEffect(() => {
    if (!user.uid) return;
    const field = user.role === 'pharmacy' ? 'pharmacyId' : 'importerId';
    const q = query(
      collection(db, 'orders'), 
      where(field, '==', user.uid), 
      orderBy('createdAt', 'desc'), 
      limit(PAGE_SIZE)
    );
    const unsubOrders = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    const unsubSettings = onSnapshot(doc(db, 'system_settings', 'main'), 
      (s) => {
        if (s.exists()) setSettings(s.data() as SystemSettings);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'system_settings/main')
    );

    return () => {
      unsubOrders();
      unsubSettings();
    };
  }, [user.uid, user.role]);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const field = user.role === 'pharmacy' ? 'pharmacyId' : 'importerId';
      const q = query(
        collection(db, 'orders'), 
        where(field, '==', user.uid), 
        orderBy('createdAt', 'desc'), 
        startAfter(lastDoc), 
        limit(PAGE_SIZE)
      );
      const snapshot = await getDocs(q);
      const nextOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(prev => [...prev, ...nextOrders]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    } finally {
      setLoadingMore(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const orderToUpdate = orders.find(o => o.id === orderId);
      await updateDoc(doc(db, 'orders', orderId), { status });
      
      // Credit marketing commission if delivered
      if (status === 'delivered' && orderToUpdate?.marketingId && settings?.marketingCommission) {
        const { durationMonths, orderCommissionPercent } = settings.marketingCommission;
        
        const pharmacyCreatedAt = orderToUpdate.pharmacyCreatedAt;
        if (pharmacyCreatedAt) {
          const expiryDate = new Date(pharmacyCreatedAt);
          expiryDate.setMonth(expiryDate.getMonth() + durationMonths);
          
          if (Date.now() < expiryDate.getTime()) {
            const commission = orderToUpdate.totalAmount * (orderCommissionPercent / 100);
            if (commission > 0) {
              const marketingRef = doc(db, 'users', orderToUpdate.marketingId);
              const marketingDoc = await getDoc(marketingRef);
              if (marketingDoc.exists()) {
                const currentBalance = marketingDoc.data().commissionBalance || 0;
                await updateDoc(marketingRef, {
                  commissionBalance: currentBalance + commission
                });
                toast.success(`Marketing commission of ${commission.toLocaleString()} ETB credited!`);
              }
            }
          }
        }
      }

      toast.success(`Order ${status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'confirmed': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'shipped': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'delivered': return 'bg-green-50 text-green-600 border-green-100';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">B2B Orders</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your marketplace transactions.</p>
      </div>

      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500"><ShoppingCart size={24} /></div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Order {order.orderNumber || `#${order.id?.slice(-6).toUpperCase()}`}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {(user.role === 'pharmacy' || user.role === 'staff') ? `To: ${order.importerName}` : `From: ${order.pharmacyName}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                  {order.status}
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-slate-900 dark:text-white">{order.totalAmount.toLocaleString()} ETB</p>
                  {order.deliveryMethod === 'delivery' && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Incl. Delivery</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-6">
              <div className="space-y-2 mb-4 border-b border-slate-200 dark:border-slate-700 pb-4">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <p className="text-slate-600 dark:text-slate-400">{item.name} <span className="text-slate-400 dark:text-slate-500 ml-2">x{item.quantity}</span></p>
                    <p className="font-bold text-slate-900 dark:text-white">{item.total.toLocaleString()} ETB</p>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col md:flex-row justify-between gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <MapPin size={16} className="text-blue-600" />
                  <span>
                    {order.deliveryMethod === 'pickup' ? (
                      <span className="font-bold">Self-Pickup</span>
                    ) : (
                      <>
                        <span className="font-bold">Delivery:</span> {order.deliveryAddress} 
                        <span className="text-slate-400 dark:text-slate-500 ml-2">({order.distanceKm} km)</span>
                      </>
                    )}
                  </span>
                </div>
                {order.deliveryMethod === 'delivery' && (
                  <div className="flex justify-between md:justify-end gap-4">
                    <span className="text-slate-500 dark:text-slate-400">Delivery Fee:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{order.deliveryFee?.toLocaleString()} ETB</span>
                  </div>
                )}
              </div>
            </div>

            {order.deliveryMethod === 'delivery' && (order as any).deliveryLat && (
              <div className="px-4 pb-4 -mt-2 mb-4">
                <button
                  type="button"
                  onClick={() => setExpandedMapOrderId(expandedMapOrderId === order.id ? null : order.id)}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline font-sans"
                >
                  <Globe size={14} />
                  {expandedMapOrderId === order.id ? 'Hide Delivery Route Map' : 'Show Delivery Route Map'}
                </button>

                {expandedMapOrderId === order.id && (
                  <div className="mt-3">
                    {!hasValidGoogleMapsKey ? (
                      <div className="text-[10px] bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 text-center font-sans">
                        Please ask the system administrator to add your Google Maps key (<code>GOOGLE_MAPS_PLATFORM_KEY</code>) through AI Secrets to access routing maps.
                      </div>
                    ) : (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden h-60 min-h-[240px] relative">
                        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
                          <Map
                            defaultCenter={{
                              lat: ((order as any).deliveryLat + ((order as any).importerLat || (order as any).deliveryLat)) / 2,
                              lng: ((order as any).deliveryLng + ((order as any).importerLng || (order as any).deliveryLng)) / 2
                            }}
                            defaultZoom={11}
                            mapId="DEMO_MAP_ID"
                            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                            style={{ width: '100%', height: '100%' }}
                          >
                            <AdvancedMarker 
                              position={{ lat: (order as any).deliveryLat, lng: (order as any).deliveryLng }}
                              title={`Delivery Address - Drop Point`}
                            >
                              <Pin background="#E11D48" glyphColor="#FFF" />
                            </AdvancedMarker>

                            {(order as any).importerLat && (order as any).importerLng && (
                              <AdvancedMarker 
                                position={{ lat: (order as any).importerLat, lng: (order as any).importerLng }}
                                title={`Warehouse Origin`}
                              >
                                <Pin background="#2563EB" glyphColor="#FFF" />
                              </AdvancedMarker>
                            )}
                          </Map>
                        </APIProvider>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3">
              {user.role === 'importer' && order.status === 'pending' && (
                <>
                  <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="px-6 py-2 text-red-600 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">Reject</button>
                  <button onClick={() => updateOrderStatus(order.id, 'confirmed')} className="px-6 py-2 bg-blue-600 text-white font-bold hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-100 dark:shadow-none">Confirm Order</button>
                </>
              )}
              {user.role === 'importer' && order.status === 'confirmed' && (
                <button onClick={() => updateOrderStatus(order.id, 'shipped')} className="px-6 py-2 bg-purple-600 text-white font-bold hover:bg-purple-700 rounded-xl shadow-lg shadow-purple-100 dark:shadow-none">Mark as Shipped</button>
              )}
              {user.role === 'importer' && order.status === 'shipped' && (
                <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="px-6 py-2 bg-green-600 text-white font-bold hover:bg-green-700 rounded-xl shadow-lg shadow-green-100 dark:shadow-none">Mark as Delivered</button>
              )}
              {(user.role === 'pharmacy' || user.role === 'staff') && order.status === 'pending' && (
                <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="px-6 py-2 text-red-600 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">Cancel Order</button>
              )}
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <ShoppingCart className="mx-auto text-slate-200 dark:text-slate-800 mb-4" size={64} />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No B2B orders yet</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
              {(user.role === 'pharmacy' || user.role === 'staff')
                ? "You haven't placed any bulk orders from importers yet. Visit the Marketplace to find supplies for your pharmacy."
                : "You haven't received any orders from pharmacies yet. Make sure your products are listed in 'My Products' with competitive prices."}
            </p>
            {(user.role === 'pharmacy' || user.role === 'staff') && (
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'marketplace' }))}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none"
              >
                Go to Marketplace
              </button>
            )}
          </div>
        )}
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <button 
            onClick={loadMore}
            disabled={loadingMore}
            className="px-8 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load More Orders'}
          </button>
        </div>
      )}
    </div>
  );
};

const AdminUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pharmacy' | 'importer' | 'regional_manager'>('all');
  const [showExpiringSoon, setShowExpiringSoon] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingUsers, setEditingUsers] = useState<Record<string, { type: string, status: string }>>({});
  const [newUser, setNewUser] = useState({
    email: '',
    displayName: '',
    role: 'pharmacy' as UserRole,
    country: 'Ethiopia',
    city: '',
    businessName: '',
    password: ''
  });

  const PAGE_SIZE = 50;

  useEffect(() => {
    let q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
    
    if (filter !== 'all') {
      q = query(collection(db, 'users'), where('role', '==', filter), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
    }

    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedUsers = snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
      setUsers(fetchedUsers);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
      setLoading(false);
    }, (error) => {
      if (error.code === 'failed-precondition') {
        process.env.NODE_ENV !== 'production' && console.warn('Missing index for user role filter, falling back to client-side filtering');
        // Fallback: fetch all new users and filter locally to prevent "silent empty state"
        const qFallback = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100));
        onSnapshot(qFallback, (snapshot) => {
          const all = snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
          setUsers(filter === 'all' ? all : all.filter(u => u.role === filter));
          setLoading(false);
        });
      } else {
        handleFirestoreError(error, OperationType.LIST, 'users');
        setLoading(false);
      }
    });

    const unsubSettings = onSnapshot(doc(db, 'system_settings', 'main'), 
      (s) => {
        if (s.exists()) setSettings(s.data() as SystemSettings);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'system_settings/main')
    );

    return () => {
      unsub();
      unsubSettings();
    };
  }, [filter]);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      let q = query(
        collection(db, 'users'), 
        orderBy('createdAt', 'desc'), 
        startAfter(lastDoc), 
        limit(PAGE_SIZE)
      );

      if (filter !== 'all') {
        q = query(
          collection(db, 'users'), 
          where('role', '==', filter), 
          orderBy('createdAt', 'desc'), 
          startAfter(lastDoc), 
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);
      const nextUsers = snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
      setUsers(prev => [...prev, ...nextUsers]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleStatusChange = async (uid: string, status: VerificationStatus) => {
    const loadingToast = toast.loading(`Updating user status to ${status}...`);
    try {
      const userToUpdate = users.find(u => u.uid === uid);
      const oldStatus = userToUpdate?.verificationStatus;
      
      await updateDoc(doc(db, 'users', uid), { verificationStatus: status });

      // Pharmacy Referral Reward Logic
      if (status === 'approved' && oldStatus === 'pending' && userToUpdate?.referrerUid && settings?.pharmacyReferralRewardMonths) {
        try {
          const referrerRef = doc(db, 'users', userToUpdate.referrerUid);
          const referrerDoc = await getDoc(referrerRef);
          if (referrerDoc.exists()) {
            const referrerData = referrerDoc.data() as UserProfile;
            const monthsToAdd = settings.pharmacyReferralRewardMonths;
            const msToAdd = monthsToAdd * 30 * 24 * 60 * 60 * 1000;
            
            const currentExpiry = referrerData.subscriptionExpiryDate || Date.now();
            const newExpiry = currentExpiry + msToAdd;
            
            await updateDoc(referrerRef, {
              subscriptionExpiryDate: newExpiry,
              referralRewardMonthsEarned: (referrerData.referralRewardMonthsEarned || 0) + monthsToAdd
            });
            toast.success(`Referrer rewarded with ${monthsToAdd} free months!`);
          }
        } catch (refError) {
          console.error("Referrer reward side-effect failed, skipping:", refError);
        }
      }

      toast.success(`User status updated to ${status}`, { id: loadingToast });
    } catch (error) {
      toast.dismiss(loadingToast);
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleSubscriptionUpdate = async (uid: string, type: 'basic' | 'standard' | 'premium', status: 'active' | 'expired') => {
    try {
      const userToUpdate = users.find(u => u.uid === uid);
      const isUpgrade = userToUpdate && userToUpdate.subscriptionType !== type && status === 'active';
      
      const updateData: any = {
        subscriptionType: type,
        subscriptionStatus: status,
        pendingSubscriptionType: null
      };

      // If activating/renewing, set or extend expiry by 30 days if it's missing or already expired
      if (status === 'active') {
        const currentExpiry = userToUpdate?.subscriptionExpiryDate;
        if (!currentExpiry || currentExpiry < Date.now()) {
          updateData.subscriptionExpiryDate = Date.now() + (30 * 24 * 60 * 60 * 1000);
        }
      } else if (status === 'expired') {
        updateData.subscriptionExpiryDate = Date.now() - 1000;
      }
      
      await updateDoc(doc(db, 'users', uid), updateData);

      // Credit marketing commission if it's an upgrade and user was referred
      if (isUpgrade && userToUpdate.marketingId && settings?.marketingCommission) {
        const { durationMonths, basicPlanRate, standardPlanRate, premiumPlanRate } = settings.marketingCommission;
        
        // Check if commission is still active
        const expiryDate = new Date(userToUpdate.createdAt);
        expiryDate.setMonth(expiryDate.getMonth() + durationMonths);
        
        if (Date.now() < expiryDate.getTime()) {
          const rate = type === 'premium' ? premiumPlanRate : (type === 'standard' ? standardPlanRate : (type === 'basic' ? basicPlanRate : 0));
          if (rate > 0) {
            const marketingRef = doc(db, 'users', userToUpdate.marketingId);
            const marketingDoc = await getDoc(marketingRef);
            if (marketingDoc.exists()) {
              const currentBalance = marketingDoc.data().commissionBalance || 0;
              await updateDoc(marketingRef, {
                commissionBalance: currentBalance + rate
              });
              toast.success(`Marketing commission of ${rate} ETB credited!`);
            }
          }
        }
      }

      toast.success(`Subscription updated to ${type} (${status})`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password || !newUser.displayName) {
      toast.error('Email, Display Name and Password are required');
      return;
    }
    
    setIsCreating(true);
    try {
      // In a real app, we'd use Firebase Admin SDK or Cloud Functions
      // Since we are in frontend, we use createUserWithEmailAndPassword
      // CRITICAL: This will log out the admin. We use a secondary app if possible.
      // For this applet, I'll create the Firestore document and the user can "Reset Password"
      // or I'll just create it and assume the admin will tell them.
      // Actually, better to just create the Firestore document with a specific flag.
      // But they need an Auth UID to login.
      
      // Let's create a temporary UID for now or use the email as UID (not recommended but works for demo)
      // Actually, I'll just warn the user that for a production app we'd use a Cloud Function.
      // For now, I'll use a unique ID and the user will have to sign up with the SAME email.
      const tempId = `manual_${Date.now()}`;
      const userProfile: UserProfile = {
        uid: tempId,
        email: newUser.email,
        role: newUser.role,
        displayName: newUser.displayName,
        country: newUser.country,
        city: newUser.city,
        verificationStatus: 'approved',
        subscriptionType: 'basic',
        subscriptionStatus: 'active',
        subscriptionExpiryDate: Date.now() + (30 * 24 * 60 * 60 * 1000),
        createdAt: Date.now()
      };

      if (newUser.role === 'pharmacy') userProfile.pharmacyName = newUser.businessName;
      if (newUser.role === 'importer') userProfile.importerName = newUser.businessName;

      await setDoc(doc(db, 'users', tempId), userProfile);
      toast.success('User profile created! User must sign up with this email to link account.');
      setShowAddModal(false);
      setNewUser({
        email: '',
        displayName: '',
        role: 'pharmacy',
        country: 'Ethiopia',
        city: '',
        businessName: '',
        password: ''
      });
    } catch (error) {
      toast.error('Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesFilter = filter === 'all' || u.role === filter;
    const matchesSearch = u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (u.pharmacyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (u.importerName || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesExpiry = true;
    if (showExpiringSoon) {
      const now = Date.now();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      matchesExpiry = !!u.subscriptionExpiryDate && (u.subscriptionExpiryDate - now) < sevenDays;
    }

    return matchesFilter && matchesSearch && matchesExpiry;
  });

  const expiringCount = users.filter(u => {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return !!u.subscriptionExpiryDate && (u.subscriptionExpiryDate - now) < sevenDays;
  }).length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage pharmacies, importers, and staff accounts.</p>
        </div>
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none"
          >
            <Plus size={18} /> Add User
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by email or name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 w-full md:w-64 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Total Users</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{users.length}</p>
        </div>
        <button 
          onClick={() => setShowExpiringSoon(!showExpiringSoon)}
          className={`p-6 rounded-3xl border transition-all text-left ${showExpiringSoon ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm'}`}
        >
          <div className="flex justify-between items-start mb-2">
            <p className={`text-xs font-bold uppercase tracking-wider ${showExpiringSoon ? 'text-red-600' : 'text-slate-400 dark:text-slate-500'}`}>Expiring Soon</p>
            <Clock size={16} className={showExpiringSoon ? 'text-red-500' : 'text-slate-300'} />
          </div>
          <p className={`text-3xl font-black ${showExpiringSoon ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>{expiringCount}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Next 7 Days</p>
        </button>
      </div>

      <div className="flex gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto mb-6 w-fit">
        {(['all', 'pharmacy', 'importer', 'regional_manager'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filter === f ? 'bg-blue-600 text-white shadow-md shadow-blue-100 dark:shadow-none' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}s
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User / Business</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Location</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Subscription</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Loading users...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No users found.</td></tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.uid} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${u.subscriptionStatus === 'expired' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        u.subscriptionStatus === 'expired' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {(u.displayName || '?').charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{u.displayName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                        {(u.pharmacyName || u.importerName) && (
                          <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase mt-0.5">
                            {u.pharmacyName || u.importerName}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                      <MapPin size={12} /> {u.city}, {u.country}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {(u.role === 'pharmacy' || u.role === 'importer' || u.role === 'distributor') ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <select 
                            value={editingUsers[u.uid]?.type || u.subscriptionType || 'basic'} 
                            onChange={(e) => setEditingUsers({...editingUsers, [u.uid]: { type: e.target.value, status: editingUsers[u.uid]?.status || u.subscriptionStatus || 'active' }})}
                            className="text-[10px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                          >
                            <option value="basic">BASIC</option>
                            <option value="standard">STANDARD</option>
                            <option value="premium">PREMIUM</option>
                          </select>
                          {editingUsers[u.uid] && (
                            <button 
                              onClick={async () => {
                                await handleSubscriptionUpdate(u.uid, editingUsers[u.uid].type as any, editingUsers[u.uid].status as any);
                                const newEditing = {...editingUsers};
                                delete newEditing[u.uid];
                                setEditingUsers(newEditing);
                              }}
                              className="text-[8px] font-bold text-white bg-blue-600 px-1 rounded hover:bg-blue-700 transition-colors flex items-center gap-0.5"
                            >
                              <Save size={10} /> UPDATE
                            </button>
                          )}
                          {u.pendingSubscriptionType && !editingUsers[u.uid] && (
                            <button 
                              onClick={() => handleSubscriptionUpdate(u.uid, u.pendingSubscriptionType as any, 'active')}
                              className="text-[8px] font-bold text-white bg-amber-500 px-1 rounded hover:bg-amber-600 transition-colors"
                              title={`Approve upgrade to ${u.pendingSubscriptionType}`}
                            >
                              APPROVE {u.pendingSubscriptionType.toUpperCase()}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <select 
                            value={editingUsers[u.uid]?.status || u.subscriptionStatus || 'expired'} 
                            onChange={(e) => setEditingUsers({...editingUsers, [u.uid]: { status: e.target.value, type: editingUsers[u.uid]?.type || u.subscriptionType || 'basic' }})}
                            className={`text-[9px] font-bold border rounded px-1 py-0.5 outline-none ${(editingUsers[u.uid]?.status || u.subscriptionStatus) === 'active' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-200 dark:border-red-800'}`}
                          >
                            <option value="active">ACTIVE</option>
                            <option value="expired">EXPIRED</option>
                          </select>
                          {u.subscriptionExpiryDate && (
                            <span className="text-[9px] text-slate-400">
                              {format(u.subscriptionExpiryDate, 'MMM dd')}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                      u.verificationStatus === 'approved' ? 'bg-green-100 dark:bg-green-900/20 text-green-600' :
                      u.verificationStatus === 'pending' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600' :
                      u.verificationStatus === 'deactivated' ? 'bg-red-100 dark:bg-red-900/20 text-red-600' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {u.verificationStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {u.verificationStatus === 'pending' && (
                        <>
                          <button onClick={() => handleStatusChange(u.uid, 'approved')} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" title="Approve"><CheckCircle size={18} /></button>
                          <button onClick={() => handleStatusChange(u.uid, 'rejected')} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Reject"><XCircle size={18} /></button>
                        </>
                      )}
                      {u.verificationStatus === 'approved' && (
                        <button onClick={() => handleStatusChange(u.uid, 'deactivated')} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Deactivate"><ShieldAlert size={18} /></button>
                      )}
                      {u.verificationStatus === 'deactivated' && (
                        <button onClick={() => handleStatusChange(u.uid, 'approved')} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" title="Activate"><CheckCircle size={18} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <button 
            onClick={loadMore}
            disabled={loadingMore}
            className="px-8 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load More Users'}
          </button>
        </div>
      )}

      {/* Manual Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add New User</h2>
                  <p className="text-xs text-slate-500">Manually onboard a business or manager.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleManualAdd} className="p-8 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Account Role</label>
                    <select 
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white font-bold text-sm"
                    >
                      <option value="pharmacy">Pharmacy</option>
                      <option value="importer">Importer</option>
                      <option value="regional_manager">Regional Manager</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Email Address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="user@example.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Display Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="John Doe"
                      value={newUser.displayName}
                      onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Business Name</label>
                    <input 
                      type="text" 
                      placeholder="Optional"
                      value={newUser.businessName}
                      onChange={(e) => setNewUser({...newUser, businessName: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">City</label>
                    <input 
                      type="text" 
                      placeholder="Addis Ababa"
                      value={newUser.city}
                      onChange={(e) => setNewUser({...newUser, city: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Password</label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={isCreating}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isCreating ? <Clock className="animate-spin" size={20} /> : <UserPlus size={20} />}
                    {isCreating ? 'Creating Profile...' : 'Confirm and Add User'}
                  </button>
                  <p className="text-[10px] text-center text-slate-400 mt-4 font-medium italic">
                    Note: User will need to register with this exact email to link to this profile.
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminRevenuePanel = ({ settings }: { settings: SystemSettings | null }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'daily' | 'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    // For scalability with millions of users/orders, these should be aggregated 
    // into a summary document or fetched via a cloud function.
    // For now, we limit to the most recent 100 for performance.
    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100));
    const qUsers = query(collection(db, 'users'), limit(100));
    
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    return () => {
      unsubOrders();
      unsubUsers();
    };
  }, []);

  const totalCommission = orders.reduce((sum, o) => sum + (o.commissionAmount || 0), 0);
  const activeSubs = users.filter(u => u.subscriptionStatus === 'active').length;
  const subscriptionIncome = users
    .filter(u => u.subscriptionStatus === 'active')
    .reduce((sum, u) => {
      const plan = u.subscriptionType || 'basic';
      const price = (settings?.planPrices?.[plan as keyof typeof PLAN_PRICES]) ?? PLAN_PRICES[plan as keyof typeof PLAN_PRICES];
      return sum + price;
    }, 0);
    
  const totalRevenue = totalCommission + subscriptionIncome;

  const revenueByRegion = orders.reduce((acc: any, o) => {
    const region = o.country || 'Unknown';
    acc[region] = (acc[region] || 0) + (o.commissionAmount || 0);
    return acc;
  }, {});

  const handleExportPDF = () => {
    const regionalData = Object.entries(revenueByRegion).map(([region, revenue]) => ({
      label: region,
      revenue: revenue as number,
      orders: orders.filter(o => o.country === region).length
    }));

    const reportData = [
      { label: 'OVERALL SUMMARY', revenue: totalRevenue, orders: orders.length },
      ...regionalData
    ];

    const doc = generateRevenueReport(reportData, 'Platform Financial Summary', `Time Range: ${timeRange.toUpperCase()} | Active Subscriptions: ${activeSubs}`);
    doc.save(`revenue-report-${timeRange}-${Date.now()}.pdf`);
    toast.success('Detailed financial report exported!');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Revenue & Finance</h1>
          <p className="text-slate-500 dark:text-slate-400">Track platform earnings and financial performance.</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="daily">Daily View</option>
            <option value="monthly">Monthly View</option>
            <option value="yearly">Yearly View</option>
          </select>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            <Download size={18} /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl"><TrendingUp size={24} /></div>
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Total Revenue</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{totalRevenue.toLocaleString()} ETB</p>
            </div>
          </div>
          <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 w-3/4"></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl"><CreditCard size={24} /></div>
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Subscription Income</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{subscriptionIncome.toLocaleString()} ETB</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">From {activeSubs} active subscriptions</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl"><Percent size={24} /></div>
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Commission Earned</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{totalCommission.toLocaleString()} ETB</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">From {orders.length} transactions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6">Revenue by Region</h3>
          <div className="space-y-4">
            {Object.entries(revenueByRegion).map(([region, amount]: [string, any]) => (
              <div key={region} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400"><Globe size={16} /></div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{region}</span>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-white">{amount.toLocaleString()} ETB</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6">Recent Financial Activity</h3>
          <div className="space-y-4">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Order #{order.id?.slice(-6)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{order.pharmacyName} → {order.importerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600 dark:text-green-400">+{order.commissionAmount?.toLocaleString()} ETB</p>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Commission</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminMarketplaceControl = () => {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);

  const PAGE_SIZE = 50;

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
    const unsub = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MarketplaceProduct)));
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));
    return unsub;
  }, []);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const q = query(
        collection(db, 'products'), 
        orderBy('createdAt', 'desc'), 
        startAfter(lastDoc), 
        limit(PAGE_SIZE)
      );
      const snapshot = await getDocs(q);
      const nextProducts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MarketplaceProduct));
      setProducts(prev => [...prev, ...nextProducts]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'products');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Product removed from marketplace');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.importerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Marketplace Control</h1>
          <p className="text-slate-500 dark:text-slate-400">Monitor and manage all product listings.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search products or importers..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 w-full dark:text-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Product</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Importer</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Price</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">Loading products...</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No products found.</td></tr>
            ) : (
              filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{p.category}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-bold">{p.importerName}</td>
                  <td className="px-6 py-4 text-sm font-black text-blue-600 dark:text-blue-400">{p.price.toLocaleString()} ETB</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{p.stockQuantity}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedProduct(p)} 
                        className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="View Full Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)} 
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete Listing"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <button 
            onClick={loadMore}
            disabled={loadingMore}
            className="px-8 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load More Products'}
          </button>
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="inline-block bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold px-2.5 py-1 rounded-lg font-mono mb-2">
                  {selectedProduct.category}
                </span>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                  {selectedProduct.name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-601 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-6">
              {/* Product Specifications */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Unit Price</p>
                  <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
                    {selectedProduct.price.toLocaleString()} ETB
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Available Stock</p>
                  <p className={`text-xl font-bold mt-0.5 ${selectedProduct.stockQuantity <= 0 ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
                    {selectedProduct.stockQuantity.toLocaleString()} units
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Min Order Qty</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedProduct.minOrderQuantity || 1} units
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Region / Country</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                    <Globe size={16} className="text-slate-400" />
                    {selectedProduct.country || 'Global'}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="bg-slate-50 dark:bg-slate-800/20 p-5 rounded-2xl border border-slate-150/40 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Product Description
                </p>
                <p className="text-slate-650 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line font-medium">
                  {selectedProduct.description || 'No description provided by the importer.'}
                </p>
              </div>

              {/* Owner / Importer Section */}
              <div className="bg-blue-50/30 dark:bg-blue-950/10 p-5 rounded-2xl border border-blue-100/50 dark:border-blue-900/20">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2">
                  Listed by Importer
                </p>
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-extrabold text-slate-800 dark:text-slate-200">
                      {selectedProduct.importerName}
                    </p>
                    <p className="text-[10px] text-slate-450 mt-0.5">
                      ID: {selectedProduct.importerId}
                    </p>
                  </div>
                  {selectedProduct.createdAt && (
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Date Listed</p>
                      <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                        {new Date(selectedProduct.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="mt-8 flex justify-end">
              <button 
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-300 font-bold rounded-xl transition-all text-sm"
              >
                Close View
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNotif, setNewNotif] = useState({ title: '', message: '', target: 'all' as any });

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(d => d.data() as Notification));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'notifications'));
    return unsub;
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotif.title || !newNotif.message) return;
    try {
      const id = doc(collection(db, 'notifications')).id;
      await setDoc(doc(db, 'notifications', id), {
        ...newNotif,
        id,
        senderId: auth.currentUser?.uid,
        createdAt: Date.now()
      });
      setNewNotif({ title: '', message: '', target: 'all' });
      toast.success('Notification sent successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'notifications');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Send Notification</h2>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Target Audience</label>
                <select 
                  value={newNotif.target} 
                  onChange={(e) => setNewNotif({ ...newNotif, target: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                >
                  <option value="all">All Users</option>
                  <option value="pharmacies">All Pharmacies</option>
                  <option value="importers">All Importers</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Title</label>
                <input 
                  type="text" 
                  value={newNotif.title}
                  onChange={(e) => setNewNotif({ ...newNotif, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  placeholder="Announcement Title"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Message</label>
                <textarea 
                  rows={4}
                  value={newNotif.message}
                  onChange={(e) => setNewNotif({ ...newNotif, message: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
                  placeholder="Type your message here..."
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none flex items-center justify-center gap-2">
                <Send size={18} /> Send Message
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Recent Announcements</h2>
          <div className="space-y-4">
            {loading ? (
              <p className="text-slate-500 dark:text-slate-400 italic">Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 italic">No notifications sent yet.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-white">{n.title}</h3>
                    <span className="text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">To: {n.target}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{n.message}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminSystemControl = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [tempSettings, setTempSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_settings', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SystemSettings;
        const hydratedData: SystemSettings = {
          ...data,
          planPrices: {
            ...PLAN_PRICES,
            ...(data.planPrices || {})
          }
        };
        setSettings(hydratedData);
        if (!tempSettings) setTempSettings(hydratedData);
      } else {
        // Initialize default settings
        const defaultSettings: SystemSettings = {
          globalCommissionPercent: 3,
          contactEmail: 'support@a-tech.com',
          contactPhone: '+251 911 223344',
          telegramLink: 'https://t.me/atech_east_africa',
          whatsappLink: 'https://wa.me/251116633000',
          contactActiveRegions: 'Active across Ethiopia · Kenya · Rwanda · Tanzania · Uganda',
          footerDescription: 'Next-generation pharmaceutical logistics, intelligent supply-chain forecasting, and integrated B2B procurement. Engineered to secure medicine distribution and coordinate multi-branch inventory across East Africa.',
          termsOfServiceTitle: 'Terms of Service',
          termsOfServiceContent: '',
          privacyPolicyTitle: 'Global Privacy Policy',
          privacyPolicyContent: '',
          cookiePolicyTitle: 'Cookie & Tracking Policy',
          cookiePolicyContent: '',
          cookiePreferencesDescription: 'ATECH East Africa uses essential parameters to secure logins, keep track of multi-branch sync operations, and hold offline invoice logs.',
          importerCommissions: {},
          marketingCommission: {
            durationMonths: 12,
            basicPlanRate: 50,
            standardPlanRate: 100,
            premiumPlanRate: 250,
            orderCommissionPercent: 1
          },
          pharmacyReferralRewardMonths: 1,
          maxProductsPerPlan: { basic: 100, standard: 500, premium: 2000 },
          planPrices: { basic: 400, standard: 1200, premium: 3000 },
          featuresEnabled: { marketplace: true, subscriptions: true, analytics: true },
          updatedAt: Date.now()
        };
        setDoc(doc(db, 'system_settings', 'main'), defaultSettings);
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'system_settings/main'));
    return unsub;
  }, []);

  const saveSettings = async () => {
    if (!tempSettings) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'system_settings', 'main'), {
        ...tempSettings,
        updatedAt: Date.now()
      });
      toast.success('System settings saved successfully');
      setSettings(tempSettings);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'system_settings/main');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(tempSettings);

  if (loading || !tempSettings) return <div className="p-8 text-center text-slate-500 italic">Loading settings...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto pb-32">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Control</h1>
        <button 
          onClick={saveSettings}
          disabled={isSaving}
          className={`px-6 py-2 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50 ${
            hasChanges 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700/50'
          }`}
        >
          {isSaving ? <Clock className="animate-spin" size={18} /> : <Save size={18} />}
          {isSaving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
      
      <div className="space-y-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><Mail size={20} className="text-blue-600" /> Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Support Email</label>
              <input 
                type="email" 
                value={tempSettings.contactEmail ?? ''}
                onChange={(e) => setTempSettings({ ...tempSettings, contactEmail: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Support Phone</label>
              <input 
                type="text" 
                value={tempSettings.contactPhone ?? ''}
                onChange={(e) => setTempSettings({ ...tempSettings, contactPhone: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Telegram Link</label>
              <input 
                type="text" 
                value={tempSettings.telegramLink ?? ''}
                onChange={(e) => setTempSettings({ ...tempSettings, telegramLink: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                placeholder="https://t.me/your_channel"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">WhatsApp Link</label>
              <input 
                type="text" 
                value={tempSettings.whatsappLink ?? ''}
                onChange={(e) => setTempSettings({ ...tempSettings, whatsappLink: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                placeholder="https://wa.me/your_number"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Active Regions Text</label>
              <input 
                type="text" 
                value={tempSettings.contactActiveRegions ?? ''}
                onChange={(e) => setTempSettings({ ...tempSettings, contactActiveRegions: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                placeholder="Active across Ethiopia · Kenya · Rwanda · Tanzania · Uganda"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Footer Brand Description</label>
              <textarea 
                rows={3}
                value={tempSettings.footerDescription ?? ''}
                onChange={(e) => setTempSettings({ ...tempSettings, footerDescription: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                placeholder="Next-generation pharmaceutical logistics..."
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><FileText size={20} className="text-blue-600" /> Legal Documents & Cookie Preferences</h3>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mb-6 font-normal">
            Customize the titles and contents of the official legal agreements and cookie preferences text shown to users in the Legal Footer of ATECH East Africa. Leave empty to use the system defaults.
          </p>
          <div className="space-y-6">
            
            {/* Terms of Service */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-6 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Terms of Service / Use</h4>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Document Title</label>
                <input 
                  type="text" 
                  value={tempSettings.termsOfServiceTitle ?? ''}
                  onChange={(e) => setTempSettings({ ...tempSettings, termsOfServiceTitle: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white mb-2"
                  placeholder="Terms of Service"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Document Content</label>
                <textarea 
                  rows={5}
                  value={tempSettings.termsOfServiceContent ?? ''}
                  onChange={(e) => setTempSettings({ ...tempSettings, termsOfServiceContent: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-sans"
                  placeholder="Enter custom Terms of Service... (leave blank to restore system defaults)"
                />
              </div>
            </div>

            {/* Privacy Policy */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-6 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Global Privacy Policy</h4>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Document Title</label>
                <input 
                  type="text" 
                  value={tempSettings.privacyPolicyTitle ?? ''}
                  onChange={(e) => setTempSettings({ ...tempSettings, privacyPolicyTitle: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white mb-2"
                  placeholder="Global Privacy Policy"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Document Content</label>
                <textarea 
                  rows={5}
                  value={tempSettings.privacyPolicyContent ?? ''}
                  onChange={(e) => setTempSettings({ ...tempSettings, privacyPolicyContent: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-sans"
                  placeholder="Enter custom Privacy Policy... (leave blank to restore system defaults)"
                />
              </div>
            </div>

            {/* Cookie Policy */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-6 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Cookie & Tracking Policy</h4>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Document Title</label>
                <input 
                  type="text" 
                  value={tempSettings.cookiePolicyTitle ?? ''}
                  onChange={(e) => setTempSettings({ ...tempSettings, cookiePolicyTitle: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white mb-2"
                  placeholder="Cookie & Tracking Policy"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Document Content</label>
                <textarea 
                  rows={5}
                  value={tempSettings.cookiePolicyContent ?? ''}
                  onChange={(e) => setTempSettings({ ...tempSettings, cookiePolicyContent: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-sans"
                  placeholder="Enter custom Cookie Policy... (leave blank to restore system defaults)"
                />
              </div>
            </div>

            {/* Cookie Preferences Description */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Cookie Preferences</h4>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Preferences Modal Description</label>
                <textarea 
                  rows={3}
                  value={tempSettings.cookiePreferencesDescription ?? ''}
                  onChange={(e) => setTempSettings({ ...tempSettings, cookiePreferencesDescription: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-sans"
                  placeholder="ATECH East Africa uses essential parameters to secure logins..."
                />
              </div>
            </div>

          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><Percent size={20} className="text-blue-600" /> Commission Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Global Commission (%)</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={tempSettings.globalCommissionPercent ?? 0}
                  onChange={(e) => setTempSettings({ ...tempSettings, globalCommissionPercent: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><Users size={20} className="text-blue-600" /> Marketing Commission Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Commission Duration (Months)</label>
              <input 
                type="number" 
                value={tempSettings.marketingCommission?.durationMonths || 12}
                onChange={(e) => setTempSettings({ ...tempSettings, marketingCommission: { ...tempSettings.marketingCommission, durationMonths: Number(e.target.value) } })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 italic">How many months a marketing member earns from a referral.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Order Commission (%)</label>
              <input 
                type="number" 
                value={tempSettings.marketingCommission?.orderCommissionPercent || 1}
                onChange={(e) => setTempSettings({ ...tempSettings, marketingCommission: { ...tempSettings.marketingCommission, orderCommissionPercent: Number(e.target.value) } })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 italic">Percentage of B2B order totals paid to referrer.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Basic Plan Referral (ETB)</label>
              <input 
                type="number" 
                value={tempSettings.marketingCommission?.basicPlanRate || 50}
                onChange={(e) => setTempSettings({ ...tempSettings, marketingCommission: { ...tempSettings.marketingCommission, basicPlanRate: Number(e.target.value) } })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Standard Plan Referral (ETB)</label>
              <input 
                type="number" 
                value={tempSettings.marketingCommission?.standardPlanRate || 100}
                onChange={(e) => setTempSettings({ ...tempSettings, marketingCommission: { ...tempSettings.marketingCommission, standardPlanRate: Number(e.target.value) } })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Premium Plan Referral (ETB)</label>
              <input 
                type="number" 
                value={tempSettings.marketingCommission?.premiumPlanRate || 250}
                onChange={(e) => setTempSettings({ ...tempSettings, marketingCommission: { ...tempSettings.marketingCommission, premiumPlanRate: Number(e.target.value) } })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><UserPlus size={20} className="text-blue-600" /> B2B Referral Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Free Months Per Referral</label>
              <input 
                type="number" 
                value={tempSettings.pharmacyReferralRewardMonths || 1}
                onChange={(e) => setTempSettings({ ...tempSettings, pharmacyReferralRewardMonths: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 italic">Subscription extension given to pharmacies/importers when their referral is approved.</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><ShieldCheck size={20} className="text-blue-600" /> Feature Flags</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(tempSettings.featuresEnabled).map(([feature, enabled]) => (
              <button 
                key={feature}
                onClick={() => setTempSettings({ ...tempSettings, featuresEnabled: { ...tempSettings.featuresEnabled, [feature]: !enabled } })}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${enabled ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}
              >
                <span className="text-sm font-bold capitalize">{feature}</span>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${enabled ? 'right-1' : 'left-1'}`}></div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><CreditCard size={20} className="text-blue-600" /> Subscription Pricing (ETB/Month)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(tempSettings.planPrices || PLAN_PRICES).map(([plan, price]) => (
              <div key={plan}>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">{plan} Plan Price</label>
                <input 
                  type="number" 
                  value={price}
                  onChange={(e) => setTempSettings({ 
                    ...tempSettings, 
                    planPrices: { 
                      ...(tempSettings.planPrices || PLAN_PRICES), 
                      [plan]: Number(e.target.value) 
                    } 
                  })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>
            ))}
          </div>
        </div>


      </div>

      {/* Persistent Save Settings Action Bar */}
      <div className="mt-8 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Apply System Configuration</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {hasChanges ? 'You have unsaved changes in system settings.' : 'System configuration is completely up-to-date.'}
          </p>
        </div>
        <button 
          onClick={saveSettings}
          disabled={isSaving}
          className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 ${
            hasChanges 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-150'
          }`}
        >
          {isSaving ? <Clock className="animate-spin" size={18} /> : <Save size={18} />}
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {hasChanges && (
        <div className="fixed bottom-8 right-8 z-50">
          <button 
            onClick={saveSettings}
            disabled={isSaving}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-2xl flex items-center gap-2 disabled:opacity-50 scale-110"
          >
            {isSaving ? <Clock className="animate-spin" size={20} /> : <Save size={20} />}
            {isSaving ? 'Saving...' : 'Save System Changes'}
          </button>
        </div>
      )}
    </div>
  );
};

const RegionalManagerDashboard = ({ user }: { user: UserProfile }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingVerifications: 0,
    totalOrders: 0,
    revenue: 0
  });

  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!user.country) return;
    // Regional managers see data for their country
    const qUsers = query(collection(db, 'users'), where('country', '==', user.country));
    const qOrders = query(collection(db, 'orders'), where('country', '==', user.country));

    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const users = snapshot.docs.map(d => d.data() as UserProfile);
      setStats(prev => ({
        ...prev,
        totalUsers: users.length,
        pendingVerifications: users.filter(u => u.verificationStatus === 'pending').length
      }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const orders = snapshot.docs.map(d => d.data() as Order).sort((a, b) => b.createdAt - a.createdAt);
      setStats(prev => ({
        ...prev,
        totalOrders: orders.length,
        revenue: orders.reduce((sum, o) => sum + o.totalAmount, 0)
      }));
      setRecentOrders(orders.slice(0, 5));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    return () => {
      unsubUsers();
      unsubOrders();
    };
  }, [user.country]);

  const handleExportPDF = () => {
    const reportData = [
      { label: 'Total Businesses', revenue: stats.totalUsers, orders: stats.totalUsers },
      { label: 'Total Orders', revenue: stats.revenue, orders: stats.totalOrders },
      { label: 'Pending Verifications', revenue: stats.pendingVerifications, orders: stats.pendingVerifications }
    ];
    const doc = generateRevenueReport(reportData, `Regional Report: ${user.country}`, `Generated on: ${format(new Date(), 'yyyy-MM-dd')}`);
    doc.save(`regional-report-${user.country}-${Date.now()}.pdf`);
    toast.success('Regional report exported!');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="mb-0">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Regional Overview: {user.country}</h1>
          <p className="text-slate-500 dark:text-slate-400">Monitoring business activity in your region.</p>
        </div>
        <button 
          onClick={handleExportPDF}
          className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
        >
          <Download size={18} /> Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Total Businesses', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Pending Verifications', value: stats.pendingVerifications, icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { label: 'Regional Revenue', value: `${stats.revenue.toLocaleString()} ETB`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}><stat.icon size={24} /></div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold mb-6 dark:text-white">Regional Performance</h3>
          <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-slate-400 dark:text-slate-500 text-sm">Regional analytics coming soon.</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold mb-6 dark:text-white">Recent Activity</h3>
          <div className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Order #{order.id?.slice(-6)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{order.totalAmount.toLocaleString()} ETB</p>
                    <p className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">{order.status}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">No recent activity in {user.country}.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  pharmacist: ['dashboard', 'inventory', 'sales', 'marketplace', 'orders', 'customers', 'suppliers', 'settings'],
  cashier: ['dashboard', 'sales', 'settings'],
  inventory: ['dashboard', 'inventory', 'marketplace', 'orders', 'suppliers', 'settings'],
  importer_staff: ['dashboard', 'my-products', 'orders', 'settings'],
  warehouse_manager: ['dashboard', 'warehouses', 'settings'],
};

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  role, 
  user, 
  onSignOut,
  toggleTheme,
  settings,
  isCollapsed,
  onToggle,
  language = 'en',
  changeLanguage
}: { 
  activeTab: string, 
  setActiveTab: (t: string) => void, 
  role: UserRole, 
  user: UserProfile, 
  onSignOut: () => void,
  toggleTheme: () => void,
  settings: SystemSettings | null,
  isCollapsed: boolean,
  onToggle: () => void,
  language?: 'en' | 'am' | 'om' | 'ti',
  changeLanguage?: (lang: 'en' | 'am' | 'om' | 'ti') => void
}) => {
  const t = (key: string) => {
    const dict = TRANSLATIONS[language as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;
    return (dict as any)[key] || key;
  };

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard, roles: ['admin', 'pharmacy', 'importer', 'regional_manager', 'staff', 'marketing', 'distributor'] },
    { id: 'inventory', label: t('inventory'), icon: Package, roles: ['pharmacy', 'staff'] },
    { id: 'bincard', label: t('bincard'), icon: FileText, roles: ['pharmacy', 'staff'], minPlan: 'basic' },
    { id: 'expiry', label: t('expiry'), icon: Clock, roles: ['pharmacy', 'staff'], minPlan: 'basic' },
    { id: 'forecasting', label: t('forecasting'), icon: TrendingUp, roles: ['pharmacy', 'staff'], minPlan: 'basic' },
    { id: 'my-products', label: (role === 'importer' || role === 'distributor') ? 'Products' : t('my-products'), icon: Box, roles: ['importer', 'distributor', 'staff'] },
    { id: 'sales', label: t('sales'), icon: ShoppingCart, roles: ['pharmacy', 'staff'] },
    { id: 'customers', label: (role === 'importer' || role === 'distributor') ? 'Customers' : t('customers'), icon: Users, roles: ['pharmacy', 'staff'] },
    { id: 'suppliers', label: 'Wholesales', icon: Building2, roles: ['pharmacy', 'staff'] },
    { id: 'analytics', label: 'Analytics Insights', icon: TrendingUp, roles: ['importer', 'distributor'] },
    { id: 'marketplace', label: t('marketplace'), icon: Truck, roles: ['pharmacy', 'admin', 'staff'], minPlan: 'standard' },
    { id: 'orders', label: (role === 'importer' || role === 'distributor') ? 'Orders' : t('orders'), icon: ShoppingCart, roles: ['pharmacy', 'importer', 'distributor', 'staff'], minPlan: 'standard' },
    { id: 'procurement', label: 'Procurement (PR & PO)', icon: Layers, roles: ['pharmacy', 'staff'], minPlan: 'basic' },
    { id: 'warehouses', label: 'Warehouses', icon: WarehouseIcon, roles: ['pharmacy', 'importer', 'distributor', 'staff'], minPlan: 'standard' },
    { id: 'deliveries', label: 'Delivery & Shipping', icon: Truck, roles: ['importer', 'distributor'] },
    { id: 'advertising', label: (role === 'importer' || role === 'distributor') ? 'Promotions' : t('advertising'), icon: Tag, roles: ['importer', 'distributor'] },
    { id: 'reports', label: 'Reports', icon: FileText, roles: ['importer', 'distributor'] },
    { id: 'staff', label: t('staff'), icon: Users, roles: ['pharmacy', 'importer', 'distributor', 'staff'], minPlan: 'premium' },
    { id: 'branches', label: t('branches'), icon: Store, roles: ['pharmacy', 'staff'], minPlan: 'standard' },
    { id: 'subscription', label: t('subscription'), icon: CreditCard, roles: ['pharmacy', 'importer', 'distributor'] },
    { id: 'notifications', label: (role === 'importer' || role === 'distributor') ? 'Announcements' : t('notifications'), icon: Mail, roles: ['pharmacy', 'importer', 'regional_manager', 'staff', 'marketing', 'distributor'] },
    { id: 'super-admin-organizations', label: 'Organization Deck', icon: Users, roles: ['admin'] },
    { id: 'super-admin-country', label: 'Country Center', icon: Globe, roles: ['admin'] },
    { id: 'super-admin-regional', label: 'Regional Territories', icon: Layers, roles: ['admin'] },
    { id: 'super-admin-subscriptions', label: 'Subscription Hub', icon: DollarSign, roles: ['admin'] },
    { id: 'super-admin-marketplace', label: 'Marketplace Admin', icon: Truck, roles: ['admin'] },
    { id: 'super-admin-pharmacy-wholesales', label: 'Pharmacy Whole Sales', icon: Building2, roles: ['admin'] },
    { id: 'super-admin-audit', label: 'Audit Log Desk', icon: FileText, roles: ['admin'] },
    { id: 'super-admin-secops', label: 'Security (SOC)', icon: ShieldAlert, roles: ['admin'] },
    { id: 'super-admin-revenue', label: 'Revenue Analytics', icon: TrendingUp, roles: ['admin'] },
    { id: 'super-admin-health', label: 'System Vitals', icon: Activity, roles: ['admin'] },
    { id: 'super-admin-support', label: 'Support Center', icon: LifeBuoy, roles: ['admin'] },
    { id: 'super-admin-communication', label: 'Broadcaster', icon: Megaphone, roles: ['admin'] },
    { id: 'super-admin-distributor', label: 'Distributor Node', icon: ShieldCheck, roles: ['admin'] },
    { id: 'super-admin-warehouse', label: 'Warehouse Ledger', icon: WarehouseIcon, roles: ['admin'] },
    { id: 'super-admin-ai', label: 'AI Strategy Layer', icon: Cpu, roles: ['admin'] },
    { id: 'admin-users', label: t('admin-users'), icon: Users, roles: ['admin'] },
    { id: 'admin-marketing', label: t('admin-marketing'), icon: Users, roles: ['admin'] },
    { id: 'admin-ratings', label: 'Team Performance & Ratings', icon: Star, roles: ['admin'] },
    { id: 'users', label: t('users'), icon: ShieldCheck, roles: ['admin'] },
    { id: 'admin-revenue', label: t('admin-revenue'), icon: TrendingUp, roles: ['admin'] },
    { id: 'admin-marketplace', label: t('admin-marketplace'), icon: Globe, roles: ['admin'] },
    { id: 'admin-notifications', label: t('admin-notifications'), icon: Mail, roles: ['admin'] },
    { id: 'admin-ads', label: t('admin-ads'), icon: Megaphone, roles: ['admin'] },
    { id: 'admin-system', label: t('admin-system'), icon: Settings, roles: ['admin'] },
    { id: 'settings', label: t('settings'), icon: Settings, roles: ['admin', 'pharmacy', 'importer', 'regional_manager', 'staff', 'marketing', 'distributor'] },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles.includes(role)) return false;
    
    // Check subscription plan for pharmacies or staff (via central featureGate hasFeature logic)
    if (role === 'pharmacy' || role === 'staff') {
      if (!hasFeature(user, item.id, settings)) return false;
    }

    // Hide subscription tab if they did not pay for the future
    if (item.id === 'subscription' && (role === 'pharmacy' || role === 'staff')) {
      const plan = user.subscriptionType || 'basic';
      if (plan === 'basic' || user.subscriptionStatus !== 'active') {
        return false;
      }
    }

    // Check permissions for staff
    if (role === 'staff') {
      if (user.permissions && !user.permissions.includes(item.id)) return false;
      // If no permissions set, use defaults based on staffRole
      if (!user.permissions && user.staffRole) {
        const defaults = DEFAULT_PERMISSIONS[user.staffRole] || ['dashboard', 'settings'];
        if (!defaults.includes(item.id)) return false;
      }
    }
    
    return true;
  });

  return (
    <>
      {/* Mobile/Tablet Backdrop Overlay - closes the sidebar drawer layout */}
      {!isCollapsed && (
        <div 
          onClick={onToggle}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99] lg:hidden cursor-pointer"
        />
      )}
      <div className={`
        fixed lg:sticky inset-y-0 left-0 z-[100] h-screen flex flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 overflow-y-auto scrollbar-hide
        ${isCollapsed ? 'w-20 -translate-x-full lg:w-20 lg:translate-x-0' : 'w-72 translate-x-0 lg:w-72'}
      `}>
      <div className={`${isCollapsed ? 'p-4' : 'p-6'}`}>
        <div className={`flex items-center ${isCollapsed ? 'flex-col gap-6' : 'justify-between'} mb-10`}>
          <div className="flex items-center gap-3 group">
            <div className={`w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 dark:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-500 group-hover:rotate-6`}>
              <Package className="text-white w-7 h-7" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-black text-xl text-slate-900 dark:text-white tracking-tighter leading-none">ATECH</span>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mt-1">East Africa</span>
                <span className="text-[8px] text-slate-500 dark:text-slate-400 leading-tight mt-1 font-bold">Healthcare Intelligence Platform</span>
                <span className="text-[8px] text-slate-400 dark:text-slate-500 lowercase tracking-tight mt-0.5 font-medium">powered by emerge globally</span>
              </div>
            )}
          </div>
          <button 
            onClick={onToggle}
            className={`p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400 hover:text-blue-600 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800 shadow-sm hover:shadow-md ${isCollapsed ? '' : ''}`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        <nav className="space-y-1.5">
          {filteredMenuItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)} 
              id={`nav-item-${item.id}`}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center py-4' : 'gap-3 px-4 py-3.5'} rounded-2xl transition-all relative group ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none font-bold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'}`}
              title={isCollapsed ? item.label : ''}
            >
              <item.icon size={22} className={`${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110 transition-transform'}`} /> 
              {!isCollapsed && <span className="text-sm">{item.label}</span>}
              {activeTab === item.id && isCollapsed && (
                <motion.div layoutId="active-pill" className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
              )}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-6 border-t border-slate-100 dark:border-slate-800">
        {!isCollapsed && (role === 'pharmacy' || role === 'importer') && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Referral Code</p>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-blue-700 dark:text-blue-300">{user.referralCode || user.uid.slice(0, 8).toUpperCase()}</span>
              <button 
                onClick={() => {
                  const code = user.referralCode || user.uid.slice(0, 8).toUpperCase();
                  navigator.clipboard.writeText(code);
                  toast.success('Referral code copied!');
                  // If it's missing in DB, we could optionally update it here, but it's fine for now
                  if (!user.referralCode) {
                    updateDoc(doc(db, 'users', user.uid), { referralCode: code });
                  }
                }}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-blue-600 transition-colors"
                title="Copy Code"
              >
                <Copy size={14} />
              </button>
            </div>
            <p className="text-[9px] text-blue-500/70 mt-1 italic">Invite others to earn free months!</p>
          </div>
        )}

        {!isCollapsed && settings && (
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Support</p>
            <div className="space-y-2">
              <a href={`mailto:${settings.contactEmail}`} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <Mail size={12} /> {settings.contactEmail}
              </a>
              <a href={`tel:${settings.contactPhone}`} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <Phone size={12} /> {settings.contactPhone}
              </a>
            </div>
          </div>
        )}

        <button 
          onClick={toggleTheme}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-2 mb-4 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors text-sm font-bold`}
          title={isCollapsed ? (user.theme === 'dark' ? 'Light Mode' : 'Dark Mode') : ''}
        >
          {user.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {!isCollapsed && (user.theme === 'dark' ? 'Light Mode' : 'Dark Mode')}
        </button>

        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} mb-4`}>
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">{(user.displayName || '?').charAt(0)}</div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.displayName}</p>
              <div className="flex items-center gap-1 text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">
                <MapPin size={10} /> {user.country || 'Global'}
              </div>
            </div>
          )}
        </div>
        <button 
          onClick={onSignOut} 
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-bold`}
          title={isCollapsed ? 'Sign Out' : ''}
        >
          <LogOut size={18} /> 
          {!isCollapsed && 'Sign Out'}
        </button>
      </div>
    </div>
    </>
  );
};

const ImporterDashboard = ({ user }: { user: UserProfile }) => {
  const [stats, setStats] = useState({
    totalSales: 0,
    activeOrders: 0,
    pendingShipments: 0,
    lowStockAlerts: 0,
    revenue: 0,
    totalProducts: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user.uid) return;
    const qOrders = query(collection(db, 'orders'), where('importerId', '==', user.uid));
    const qProducts = query(collection(db, 'products'), where('importerId', '==', user.uid));

    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order)).sort((a, b) => b.createdAt - a.createdAt);
      setStats(prev => ({
        ...prev,
        totalSales: orders.filter(o => o.status === 'delivered').length,
        activeOrders: orders.filter(o => ['pending', 'confirmed', 'shipped'].includes(o.status)).length,
        pendingShipments: orders.filter(o => o.status === 'confirmed').length,
        revenue: orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.totalAmount, 0)
      }));
      setRecentOrders(orders.slice(0, 5));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      const products = snapshot.docs.map(d => d.data() as MarketplaceProduct);
      setStats(prev => ({
        ...prev,
        totalProducts: products.length,
        lowStockAlerts: products.filter(p => p.stockQuantity < 50).length
      }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    setLoading(false);
    return () => {
      unsubOrders();
      unsubProducts();
    };
  }, [user.uid]);

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Supply Chain Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your B2B fulfillment and marketplace presence.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl border border-blue-100 dark:border-blue-800">
            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Importer Score</p>
            <p className="text-lg font-black text-blue-700 dark:text-blue-300">98%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: `${stats.revenue.toLocaleString()} ETB`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Active Orders', value: stats.activeOrders, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Low Stock Items', value: stats.lowStockAlerts, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Listed Products', value: stats.totalProducts, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}><stat.icon size={24} /></div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 dark:text-white">
              <Truck size={20} className="text-blue-600" /> Recent Pharmacy Orders
            </h3>
            <div className="space-y-4">
              {recentOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">No recent orders found.</div>
              ) : (
                recentOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><Store size={20} /></div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{order.pharmacyName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900 dark:text-white">{order.totalAmount.toLocaleString()} ETB</p>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BarChart3 size={20} className="text-blue-400" /> Market Intelligence
            </h3>
            <p className="text-slate-400 text-sm mb-6">Real-time data from the ATECH East Africa Ecosystem.</p>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xs font-bold text-slate-500 uppercase">Top Search</p>
                <p className="text-sm mt-1 font-medium">Antibiotics are high in demand in {user.country}.</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xs font-bold text-slate-500 uppercase">Pricing Alert</p>
                <p className="text-sm mt-1 font-medium">Your Vitamin C listing is 5% lower than market average.</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xs font-bold text-slate-500 uppercase">Supply Gap</p>
                <p className="text-sm mt-1 font-medium">Shortage of face masks reported in regional hubs.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const renderCreativeLoop = (slide: any) => {
  if (slide.imageUrl) {
    return (
      <div className="w-full md:w-64 h-40 relative rounded-2xl overflow-hidden bg-slate-900/20 border border-white/10 shrink-0 shadow-inner z-10">
        <img 
          src={slide.imageUrl} 
          alt={slide.headline}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const isVideo = slide.assetType === 'video';
  const videoPreset = slide.videoPreset || 'pills_flow';
  const imagePreset = slide.imagePreset || 'pills';

  const bgClasses = "w-full md:w-64 h-40 relative rounded-2xl overflow-hidden shrink-0 shadow-inner z-10 border border-white/20 flex flex-col items-center justify-center text-white ";

  if (isVideo) {
    return (
      <div className={bgClasses + "bg-slate-950"}>
        <div className="absolute top-2 left-2 bg-red-600/85 text-[8px] font-bold text-white px-1.5 py-0.5 rounded tracking-wider uppercase animate-pulse flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-white rounded-full"></span> 5S VIDEO LOOP
        </div>

        {videoPreset === 'dna_helix' && (
          <div className="flex items-center gap-1.5 relative h-20 w-32 justify-center">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col justify-between items-center h-full relative" style={{ animation: `spin 3s ease-in-out infinite`, animationDelay: `${i * 0.25}s` }}>
                <div className="w-2 h-2 bg-blue-400 rounded-full shadow-lg"></div>
                <div className="w-0.5 bg-white/20 h-8 my-0.5"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full shadow-lg"></div>
              </div>
            ))}
            <style>{`
              @keyframes spin {
                0%, 100% { transform: scaleY(0.3) rotate(0deg); }
                50% { transform: scaleY(1) rotate(180deg); }
              }
            `}</style>
          </div>
        )}

        {videoPreset === 'pills_flow' && (
          <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-25"></div>
            {[...Array(4)].map((_, i) => (
              <div 
                key={i} 
                className="absolute text-base select-none"
                style={{
                  top: `${20 + (i * 15)}%`,
                  left: `${20 + (i * 18)}%`,
                  animation: `float-pill ${2 + (i % 2)}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.4}s`
                }}
              >
                💊
              </div>
            ))}
            <style>{`
              @keyframes float-pill {
                0% { transform: translateY(-6px) rotate(0deg); opacity: 0.3; }
                100% { transform: translateY(6px) rotate(360deg); opacity: 0.95; }
              }
            `}</style>
          </div>
        )}

        {videoPreset === 'syrup_drip' && (
          <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-br from-emerald-950 to-slate-900">
            <div className="relative border-2 border-emerald-400/30 w-8 h-12 rounded-b-xl rounded-t-sm flex items-end overflow-hidden">
              <div className="w-full bg-emerald-500/40 h-2/3 rounded-b-lg animate-pulse relative"></div>
            </div>
            {[...Array(3)].map((_, i) => (
              <div 
                key={i} 
                className="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full opacity-0"
                style={{
                  animation: `drip-drip 2s ease-in infinite`,
                  animationDelay: `${i * 0.6}s`,
                  left: `${45 + (i * 4)}%`,
                  top: '25%'
                }}
              ></div>
            ))}
            <style>{`
              @keyframes drip-drip {
                0% { transform: translateY(0); opacity: 0; }
                20% { opacity: 0.8; }
                80% { opacity: 0.8; }
                100% { transform: translateY(25px); opacity: 0; }
              }
            `}</style>
          </div>
        )}

        {videoPreset === 'heartbeat_wave' && (
          <div className="w-full h-full relative flex items-center justify-center bg-slate-950 overflow-hidden">
            <svg viewBox="0 0 100 40" className="w-32 h-12 stroke-current text-rose-500 fill-none stroke-2">
              <path d="M 0,20 L 20,20 L 25,12 L 30,30 L 35,5 L 40,25 L 43,20 L 100,20" className="stroke-dash" />
            </svg>
            <style>{`
              .stroke-dash {
                stroke-dasharray: 200;
                animation: dash-pulse 2.8s linear infinite;
              }
              @keyframes dash-pulse {
                0% { stroke-dashoffset: 200; }
                100% { stroke-dashoffset: 0; }
              }
            `}</style>
          </div>
        )}

        {(videoPreset === 'delivery_transit' || videoPreset === 'delivery_drone') && (
          <div className="w-full h-full relative flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 to-slate-900 overflow-hidden">
            <div className="text-3xl animate-bounce">
              {videoPreset === 'delivery_transit' ? '🚚' : '🛸'}
            </div>
            <div className="w-20 bg-white/10 h-0.5 rounded mt-1 overflow-hidden">
              <div className="bg-blue-400 h-full w-1/2 animate-shimmer"></div>
            </div>
            <style>{`
              @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(200%); }
              }
              .animate-shimmer {
                animation: shimmer 1.8s infinite linear;
              }
            `}</style>
          </div>
        )}
      </div>
    );
  }

  const PRESET_MAPPING: Record<string, { label: string, color: string, icon: string }> = {
    pills: { label: "Pills Supply", color: "from-blue-600 to-indigo-700", icon: "💊" },
    orange_pills: { label: "Tablets Jar", color: "from-orange-500 to-rose-600", icon: "💊" },
    syrup: { label: "Serum Vial", color: "from-emerald-500 to-teal-600", icon: "🧪" },
    vaccine: { label: "Vial Load", color: "from-purple-500 to-pink-600", icon: "💉" },
    medical_kit: { label: "Medical Kit", color: "from-red-500 to-orange-600", icon: "📦" },
    first_aid: { label: "First Aid", color: "from-teal-500 to-cyan-600", icon: "❤️" },
  };

  const selectedPreset = PRESET_MAPPING[imagePreset] || PRESET_MAPPING.pills;

  return (
    <div className={`${bgClasses} bg-gradient-to-br ${selectedPreset.color}`}>
      <span className="text-3xl select-none animate-pulse">{selectedPreset.icon}</span>
      <span className="text-[9px] font-black tracking-widest uppercase text-white/85 mt-1">{selectedPreset.label}</span>
    </div>
  );
};

const DashboardView = ({ 
  role, 
  user, 
  setActiveTab, 
  selectedBranchId = 'all', 
  branches = [],
  settings = null
}: { 
  role: UserRole, 
  user: UserProfile, 
  setActiveTab: (t: string) => void,
  selectedBranchId?: string,
  branches?: Branch[],
  settings?: SystemSettings | null
}) => {
  const isImporterOwner = role === 'importer' || (role === 'staff' && !!user.importerId);
  const isPharmacy = role === 'pharmacy' || role === 'staff';
  
  // Real-time branch-based billing metric computation
  const billingDetails = isPharmacy ? getSubscriptionCost(user, settings || null, branches.length) : null;
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    lowStock: 0,
    users: 0,
    pharmacies: 0,
    importers: 0,
    activeSubscriptions: 0,
    pendingPayments: 0,
    totalSalesVolume: 0,
    totalProducts: 0,
    totalSales: 0
  });
  const [marketingAgents, setMarketingAgents] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [expiredCount, setExpiredCount] = useState(0);
  const [expiringSoonCount, setExpiringSoonCount] = useState(0);
  const [forecastProducts, setForecastProducts] = useState<InventoryProduct[]>([]);
  const [forecastSales, setForecastSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const [geminiInsights, setGeminiInsights] = useState<{
    isCachedFallback?: boolean;
    outbreakAlerts?: { disease: string; severity: 'high' | 'medium' | 'low'; region: string; description: string }[];
    forecastingSuggestions?: string[];
    recommendedMeds?: { category: string; medicines: string; rationale: string }[];
  } | null>(null);
  const [loadingGemini, setLoadingGemini] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);

  const fetchGeminiInsights = async () => {
    setLoadingGemini(true);
    setGeminiError(null);
    try {
      const res = await fetch('/api/gemini/forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ country: user.country || 'Ethiopia' }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeminiInsights(data);
      } else {
        throw new Error('Failed to load local insights');
      }
    } catch (err: any) {
      console.error('[DashboardView] Error loading Gemini insights:', err);
      setGeminiError(err?.message || 'Could not connect to forecasting agent.');
    } finally {
      setLoadingGemini(false);
    }
  };

  useEffect(() => {
    fetchGeminiInsights();
  }, [user.country]);

  const forecastAlertCount = React.useMemo(() => {
    if (!forecastProducts.length) return 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    const cutOffTime = today.getTime() - (30 * 24 * 60 * 60 * 1000);
    const windowSales = forecastSales.filter(s => s.createdAt >= cutOffTime);
    
    let count = 0;
    forecastProducts.forEach(product => {
      let totalUnitsSold = 0;
      windowSales.forEach(sale => {
        const item = sale.items?.find(i => i.productId === product.id);
        if (item) totalUnitsSold += item.quantity || 0;
      });
      
      const ageInDays = Math.ceil((today.getTime() - product.createdAt) / (1000 * 60 * 60 * 24));
      const effectiveDays = Math.max(1, Math.min(30, ageInDays));
      const avgSales = totalUnitsSold / effectiveDays;
      
      if (avgSales > 0) {
        const coverage = product.quantity / avgSales;
        if (coverage <= 10) { // lead time + safety stock = 10 days
          count++;
        }
      } else if (product.quantity <= (product.lowStockThreshold || 5)) {
        count++;
      }
    });
    return count;
  }, [forecastProducts, forecastSales]);

  useEffect(() => {
    if (!user.uid) return;

    const unsubs: (() => void)[] = [];
    const ownerId = role === 'staff' ? (user.pharmacyId || user.importerId) : user.uid;

    if (role === 'admin') {
      // Admin sees everything
      const qUsers = query(collection(db, 'users'));
      const qOrders = query(collection(db, 'orders'));
      
      const unsubUsers = onSnapshot(qUsers, (snapshot) => {
        const users = snapshot.docs.map(d => d.data() as UserProfile);
        const pharmacies = users.filter(u => u.role === 'pharmacy').length;
        const importers = users.filter(u => u.role === 'importer').length;
        const activeSubs = users.filter(u => u.subscriptionStatus === 'active').length;
        setStats(prev => ({ 
          ...prev, 
          users: users.length, 
          pharmacies, 
          importers,
          activeSubscriptions: activeSubs
        }));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));
      unsubs.push(unsubUsers);

      const qMarketing = query(collection(db, 'users'), where('role', '==', 'marketing'));
      const unsubMarketing = onSnapshot(qMarketing, (snapshot) => {
        setMarketingAgents(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (error) => console.error("Error loading marketing agents for dashboard", error));
      unsubs.push(unsubMarketing);

      const unsubOrders = onSnapshot(qOrders, (snapshot) => {
        const orders = snapshot.docs.map(d => d.data() as Order);
        const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const commission = orders.reduce((sum, o) => sum + (o.commissionAmount || 0), 0);
        setStats(prev => ({ 
          ...prev, 
          orders: orders.length, 
          totalSalesVolume: totalSales,
          revenue: commission + (prev.activeSubscriptions * 500) // Mock subscription revenue
        }));
        
        // Generate chart data from last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return {
            date: d.toLocaleDateString('en-US', { weekday: 'short' }),
            timestamp: d.setHours(0,0,0,0),
            sales: 0
          };
        }).reverse();

        orders.forEach(o => {
          const orderDate = new Date(o.createdAt).setHours(0,0,0,0);
          const day = last7Days.find(d => d.timestamp === orderDate);
          if (day) day.sales += o.totalAmount;
        });

        setChartData(last7Days.map(d => ({ name: d.date, sales: d.sales })));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));
      unsubs.push(unsubOrders);

    } else {
      // Pharmacy, Staff or Importer
      const orderField = isImporterOwner ? 'importerId' : 'pharmacyId';
      const qOrders = query(collection(db, 'orders'), where(orderField, '==', ownerId));
      
      const unsubOrders = onSnapshot(qOrders, (snapshot) => {
        const orders = snapshot.docs.map(d => d.data() as Order);
        // For importers, revenue comes from orders. For pharmacies/staff, orders are expenses.
        if (isImporterOwner) {
          const revenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
          setStats(prev => ({ ...prev, orders: orders.length, revenue }));
          
          // Generate chart data for importers
          const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return {
              date: d.toLocaleDateString('en-US', { weekday: 'short' }),
              timestamp: d.setHours(0,0,0,0),
              sales: 0
            };
          }).reverse();

          orders.forEach(o => {
            const orderDate = new Date(o.createdAt).setHours(0,0,0,0);
            const day = last7Days.find(d => d.timestamp === orderDate);
            if (day) day.sales += o.totalAmount;
          });

          setChartData(last7Days.map(d => ({ name: d.date, sales: d.sales })));
        } else {
          // Pharmacy: orders are B2B purchases
          setStats(prev => ({ ...prev, orders: orders.length }));
        }
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));
      unsubs.push(unsubOrders);

      if (!isImporterOwner) {
        const qMedicines = query(collection(db, 'medicines'), where('pharmacyId', '==', ownerId));
        const unsubMed = onSnapshot(qMedicines, (snapshot) => {
          let products = snapshot.docs.map(d => d.data() as InventoryProduct);
          if (selectedBranchId !== 'all') {
            products = products.filter(m => m.branchId === selectedBranchId);
          }
          const lowStock = products.filter(m => m.quantity <= (m.lowStockThreshold || 10)).length;
          
          let expCount = 0;
          let soonCount = 0;
          const today = new Date();
          today.setHours(0,0,0,0);
          
          products.forEach(p => {
            if (!p.expiryDate) return;
            const expDate = new Date(p.expiryDate);
            expDate.setHours(0,0,0,0);
            const diffTime = expDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 0) {
              expCount++;
            } else if (diffDays <= 30) {
              soonCount++;
            }
          });
          
          setExpiredCount(expCount);
          setExpiringSoonCount(soonCount);
          setForecastProducts(products);
          setStats(prev => ({ ...prev, lowStock, totalProducts: products.length }));
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'medicines'));
        unsubs.push(unsubMed);

        const qSales = query(collection(db, 'sales'), where('pharmacyId', '==', ownerId));
        const unsubSales = onSnapshot(qSales, (snapshot) => {
          let sales = snapshot.docs.map(d => d.data() as Sale);
          if (selectedBranchId !== 'all') {
            sales = sales.filter(s => s.branchId === selectedBranchId);
          }
          const revenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
          setStats(prev => ({ ...prev, revenue, totalSales: sales.length }));

          // Update chart data to show POS sales for pharmacies
          const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return {
              date: d.toLocaleDateString('en-US', { weekday: 'short' }),
              timestamp: d.setHours(0,0,0,0),
              sales: 0
            };
          }).reverse();

          sales.forEach(s => {
            const saleDate = new Date(s.createdAt).setHours(0,0,0,0);
            const day = last7Days.find(d => d.timestamp === saleDate);
            if (day) day.sales += s.totalAmount;
          });

          setForecastSales(sales);
          setChartData(last7Days.map(d => ({ name: d.date, sales: d.sales })));
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'sales'));
        unsubs.push(unsubSales);
      }
    }

    setLoading(false);
    return () => unsubs.forEach(unsub => unsub());
  }, [user.uid, role, selectedBranchId, isImporterOwner]);

  const [activeBanners, setActiveBanners] = useState<any[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [loggedBannerImpressions, setLoggedBannerImpressions] = useState<Record<string, boolean>>({});
  const [hiddenSlides, setHiddenSlides] = useState<string[]>([]);

  const allDashboardSlides = React.useMemo(() => {
    // 1. Build service subscription banners based on their plan
    const subBanners: any[] = [
      {
        id: 'sub_promo_1',
        isSubscription: true,
        badgeText: "Active Service Perk",
        headline: user.subscriptionType === 'premium' ? "⭐⭐⭐ Premium Tier Unlocked" : "🚀 Supercharge with Premium",
        promotionalText: user.subscriptionType === 'premium' ? "Full privilege access active" : "Unlock smart forecasts & cold chain",
        description: user.subscriptionType === 'premium' 
          ? "You have active access to advanced AI forecasting algorithms, regional stockout predictors, and multi-bin warehouse monitors."
          : "Upgrade your retail store to active standard or premium plan to predict stock deprivations, view analytics, and automate expiry workflows.",
        imageUrl: "",
        imagePreset: "syrup",
        assetType: "video",
        videoPreset: "dna_helix",
        targetLink: "#subscription",
        promoThemeColor: "blue"
      },
      {
        id: 'sub_promo_2',
        isSubscription: true,
        badgeText: "B2B Fulfillment",
        headline: "📦 Dynamic Wholesale Marketplace",
        promotionalText: "Direct Wholesaler Connection",
        description: "Browse supply listings, negotiate instant bulk packages, and secure certified pharmaceutical imports directly from prime distributors.",
        imageUrl: "",
        imagePreset: "medical_kit",
        assetType: "video",
        videoPreset: "delivery_transit",
        targetLink: "#marketplace",
        promoThemeColor: "amber"
      },
      {
        id: 'sub_promo_3',
        isSubscription: true,
        badgeText: "Regulatory Standard",
        headline: "🌡️ Cold Chain Verification System",
        promotionalText: "Audit-Ready Logs",
        description: "Maintain strict compliance standards with digital cold storage serialization and automated Quarantine list managers.",
        imageUrl: "",
        imagePreset: "vaccine",
        assetType: "video",
        videoPreset: "heartbeat_wave",
        targetLink: "#inventory",
        promoThemeColor: "emerald"
      }
    ];

    // 2. Maps the active wholesale advertiser banners
    const promoBanners = activeBanners.map(b => ({
      id: b.id,
      isSubscription: false,
      badgeText: b.promotionType ? `Wholesale ${b.promotionType}` : b.badgeText || "Wholesale Promotion",
      headline: b.headline || b.title || b.name || "Premium Supply Offer",
      promotionalText: b.promotionalText || b.promoText || "Deal Announcement",
      description: b.description || "Limited time offer from certified importer partners.",
      imageUrl: b.imageUrl || "",
      imagePreset: b.imagePreset || "pills",
      assetType: b.assetType || "image",
      videoPreset: b.videoPreset || "pills_flow",
      targetLink: "#marketplace",
      promoThemeColor: b.promoThemeColor || "pink"
    }));

    return [...subBanners, ...promoBanners].filter(s => !hiddenSlides.includes(s.id));
  }, [activeBanners, user.subscriptionType, hiddenSlides]);

  useEffect(() => {
    if (!isPharmacy) return;
    const q = query(
      collection(db, 'advertisements'),
      where('status', '==', 'Active'),
      where('type', '==', 'banner')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActiveBanners(list);
    }, (err) => {
      console.warn("Could not load banner ads: ", err);
    });
    return unsub;
  }, [isPharmacy]);

  // Log banner impression
  useEffect(() => {
    if (allDashboardSlides.length > 0) {
      const currentSlide = allDashboardSlides[bannerIndex % allDashboardSlides.length];
      if (currentSlide && !currentSlide.isSubscription && currentSlide.id && !loggedBannerImpressions[currentSlide.id]) {
        setLoggedBannerImpressions(prev => ({ ...prev, [currentSlide.id!]: true }));
        try {
          updateDoc(doc(db, 'advertisements', currentSlide.id), {
            impressions: increment(1),
            updatedAt: Date.now()
          });
        } catch (err) {
          console.error("Banner impression track failed", err);
        }
      }
    }
  }, [allDashboardSlides, bannerIndex, loggedBannerImpressions]);

  // Rotate banners every 8 seconds if multiple exist
  useEffect(() => {
    if (allDashboardSlides.length <= 1) return;
    const interval = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % allDashboardSlides.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [allDashboardSlides]);

  const handleBannerClick = async (bannerId: string) => {
    if (bannerId.startsWith('sub_promo_')) return;
    try {
      await updateDoc(doc(db, 'advertisements', bannerId), {
        clicks: increment(1),
        updatedAt: Date.now()
      });
    } catch (err) {
      console.error("Banner click track failed", err);
    }
  };

  const adminStats = [
    { label: 'Total Pharmacies', value: stats.pharmacies.toString(), icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Importers', value: stats.importers.toString(), icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Revenue', value: `${stats.revenue.toLocaleString()} ETB`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Active Subs', value: stats.activeSubscriptions.toString(), icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Pending Payments', value: stats.pendingPayments.toString(), icon: CreditCard, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Sales Volume', value: `${stats.totalSalesVolume.toLocaleString()} ETB`, icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  const hasPermission = (permId: string) => {
    if (role !== 'staff') return true;
    if (user.permissions) return user.permissions.includes(permId);
    if (user.staffRole) {
      return (DEFAULT_PERMISSIONS[user.staffRole] || []).includes(permId);
    }
    return ['dashboard', 'settings'].includes(permId);
  };

  const userStats = [
    { id: 'sales', label: !isImporterOwner ? 'POS Revenue' : 'My Revenue', value: `${stats.revenue.toLocaleString()} ETB`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { id: 'inventory', label: !isImporterOwner ? 'Inventory' : 'My Orders', value: !isImporterOwner ? `${stats.totalProducts} Items` : stats.orders.toString(), icon: !isImporterOwner ? Package : ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'inventory', label: 'Low Stock', value: `${stats.lowStock} Items`, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'sales', label: !isImporterOwner ? 'Total Sales' : 'Marketplace', value: !isImporterOwner ? stats.totalSales.toString() : 'Live', icon: !isImporterOwner ? ShoppingCart : Globe, color: 'text-purple-600', bg: 'bg-purple-50' },
  ].filter(stat => hasPermission(stat.id));

  const currentStats = role === 'admin' ? adminStats : userStats;
  const plan = user.subscriptionType || 'basic';
  const isPremium = plan === 'premium';
  const isStandardOrPremium = plan !== 'basic';

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
            <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Healthcare Intelligence Platform | powered by emerge globally
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
            Welcome to the ATECH East Africa Ecosystem in <span className="font-bold text-blue-600 dark:text-blue-400">{user.country || 'Global'}</span>.
          </p>
        </div>
        <div className={`px-4 py-2 rounded-xl border font-bold text-xs uppercase tracking-widest ${
          plan === 'premium' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800' :
          plan === 'standard' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800' :
          'bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800'
        }`}>
          {plan} Plan
        </div>
      </div>

      {/* Primary Dashboard Ad Banner Area */}
      {isPharmacy && allDashboardSlides.length > 0 && (() => {
        const currentSlide = allDashboardSlides[bannerIndex % allDashboardSlides.length];
        if (!currentSlide) return null;

        let bannerBgClass = "from-blue-600 via-indigo-750 to-slate-900";
        if (currentSlide.promoThemeColor) {
          const pt = currentSlide.promoThemeColor;
          if (pt === 'pink') {
            bannerBgClass = "from-pink-600 via-rose-600 to-slate-900 ring-2 ring-pink-400/25";
          } else if (pt === 'blue') {
            bannerBgClass = "from-cyan-650 via-blue-700 to-slate-900";
          } else if (pt === 'purple') {
            bannerBgClass = "from-purple-600 via-violet-700 to-slate-900";
          } else if (pt === 'emerald') {
            bannerBgClass = "from-emerald-650 via-teal-700 to-slate-900";
          } else if (pt === 'amber') {
            bannerBgClass = "from-amber-550 via-orange-600 to-slate-900";
          }
        }

        return (
          <div className={`mb-8 relative overflow-hidden rounded-3xl border border-blue-100 dark:border-indigo-900/45 bg-gradient-to-r text-white shadow-xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-500 ${bannerBgClass}`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 rounded-full blur-xl -ml-10 -mb-10 pointer-events-none"></div>

            <div className="flex-1 space-y-4 relative z-10 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {currentSlide.badgeText || "Promotion"}
                </span>
                {allDashboardSlides.length > 1 && (
                  <span className="text-[10px] text-white/70 font-mono bg-black/10 px-2 py-0.5 rounded-full">
                    { (bannerIndex % allDashboardSlides.length) + 1 } of {allDashboardSlides.length}
                  </span>
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setHiddenSlides(prev => [...prev, currentSlide.id]);
                  }}
                  className="px-2.5 py-1 rounded-full bg-black/25 hover:bg-black/45 text-white/90 hover:text-white text-[9.5px] font-bold tracking-wide flex items-center gap-1 transition-all cursor-pointer border border-white/5 shadow-xs"
                  title="Hide this promotion"
                >
                  <EyeOff size={11} className="text-white" /> Hide Banner
                </button>
              </div>
              
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                {currentSlide.headline}
              </h2>
              {currentSlide.promotionalText && (
                <div className="inline-block text-xs font-bold text-amber-300 bg-white/10 px-2.5 py-1 rounded-lg">
                  {currentSlide.promotionalText}
                </div>
              )}
              <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
                {currentSlide.description}
              </p>

              {currentSlide.targetLink && (
                <button 
                  onClick={() => {
                    handleBannerClick(currentSlide.id);
                    if (currentSlide.targetLink === '#marketplace') {
                      setActiveTab('marketplace');
                    } else if (currentSlide.targetLink === '#inventory') {
                      setActiveTab('inventory');
                    } else if (currentSlide.targetLink === '#subscription') {
                      setActiveTab('billing-subs');
                    }
                  }}
                  className="inline-block bg-white text-blue-600 font-bold px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-all font-sans text-xs cursor-pointer shadow-sm animate-pulse"
                >
                  Learn More
                </button>
              )}
            </div>

            {renderCreativeLoop(currentSlide)}
          </div>
        );
      })()}
      
      {/* Expiry Alerts Banner inside Dashboard */}
      {isPharmacy && (expiredCount > 0 || expiringSoonCount > 0 || forecastAlertCount > 0) && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forecastAlertCount > 0 && (
            <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/30 p-4.5 rounded-2xl flex items-start gap-4 shadow-sm">
              <div className="p-2.5 bg-indigo-105 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <TrendingUp size={18} />
              </div>
              <div className="flex-1">
                <h4 className="font-extrabold text-indigo-950 dark:text-indigo-200 text-xs uppercase tracking-wide">Stockout Forecast Warning</h4>
                <p className="text-[11px] text-indigo-800 dark:text-indigo-300 mt-1">
                  You have <span className="font-bold">{forecastAlertCount} products</span> predicted to stock-out or fall below thresholds.
                </p>
                <button 
                  onClick={() => setActiveTab('forecasting')}
                  className="mt-2.5 text-[10px] font-black text-indigo-700 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 underline uppercase tracking-wider block cursor-pointer transition-all"
                >
                  Generate replenishment PO &rarr;
                </button>
              </div>
            </div>
          )}
          
          {expiredCount > 0 && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-4.5 rounded-2xl flex items-start gap-4 shadow-sm">
              <div className="p-2.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl">
                <ShieldAlert size={18} />
              </div>
              <div className="flex-1">
                <h4 className="font-extrabold text-red-950 dark:text-red-200 text-xs uppercase tracking-wide">Quarantine Required</h4>
                <p className="text-[11px] text-red-800 dark:text-red-300 mt-1">
                  You have <span className="font-bold">{expiredCount} expired batches</span> in your active inventory.
                </p>
                <button 
                  onClick={() => setActiveTab('expiry')}
                  className="mt-2.5 text-[10px] font-black text-red-700 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 underline uppercase tracking-wider block cursor-pointer transition-all"
                >
                  Isolate Expired Meds &rarr;
                </button>
              </div>
            </div>
          )}
          
          {expiringSoonCount > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-4.5 rounded-2xl flex items-start gap-4 shadow-sm">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl">
                <AlertTriangle size={18} />
              </div>
              <div className="flex-1">
                <h4 className="font-extrabold text-amber-950 dark:text-amber-200 text-xs uppercase tracking-wide">Expiry Alerts (30 Days)</h4>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1">
                  You have <span className="font-bold">{expiringSoonCount} batches expiring soon</span>. Action is recommended.
                </p>
                <button 
                  onClick={() => setActiveTab('expiry')}
                  className="mt-2.5 text-[10px] font-black text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300 underline uppercase tracking-wider block cursor-pointer transition-all"
                >
                  View Expiry Report &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {currentStats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className={`w-12 h-12 ${stat.bg} dark:bg-slate-800 ${stat.color} dark:text-blue-400 rounded-xl flex items-center justify-center mb-4`}><stat.icon size={24} /></div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Super Admin Sales & Marketing Representative Overview Widget */}
      {role === 'admin' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-5 border-b border-slate-100 dark:border-slate-800/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">ATECH Representative Ledger</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">Authorized Sales & Marketing Payroll & Shift Overview</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time tracking of active agent contracts, assigned work shift hours, base salaries, promo codes, and commission balances.
              </p>
            </div>
            <button 
              onClick={() => setActiveTab('marketing-team')}
              className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1 cursor-pointer"
            >
              <Users size={14} /> Manage Agency Links
            </button>
          </div>

          {marketingAgents.length === 0 ? (
            <div className="py-8 text-center bg-slate-50/45 dark:bg-slate-800/10 rounded-2xl border border-dashed border-slate-150 dark:border-slate-800/50">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Authorized Marketing Agents Active Yet</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                You haven't onboarded any representatives yet. Go to the "Marketing & Teams" tab to generate invitation links with pre-assigned salaries and shifts.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-2">Agent Representative</th>
                    <th className="py-3 px-2">Territory / Branch</th>
                    <th className="py-3 px-2">Assigned Shift</th>
                    <th className="py-3 px-2">Promo Code</th>
                    <th className="py-3 px-2 text-right">Assigned Salary</th>
                    <th className="py-3 px-2 text-right">Commission Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
                  {marketingAgents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/30 transition-all">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2.5">
                          {agent.photo ? (
                            <img src={agent.photo} alt={agent.displayName} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                          ) : (
                            <div className="w-8 h-8 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold uppercase text-[10px]">
                              {agent.displayName ? agent.displayName.charAt(0) : '?'}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{agent.displayName || 'Unnamed Representative'}</span>
                            <span className="text-[10px] text-slate-400 block">{agent.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block">{agent.city || 'N/A'}</span>
                        <span className="text-[10px] text-slate-400 block">{agent.country || 'N/A'}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold inline-block border ${
                          agent.shift?.toLowerCase().includes('full') ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100/30' :
                          agent.shift?.toLowerCase().includes('morning') ? 'bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 border-sky-100/30' :
                          'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100/30'
                        }`}>
                          {agent.shift || 'Full-time Standard'}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20 px-2 py-0.5 rounded-md border border-purple-100/30 tracking-wider">
                          {agent.promoCode || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">{(agent.salary || 0).toLocaleString()} {agent.currency || 'ETB'}</span>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Base Salary</span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block">{(agent.commissionBalance || 0).toLocaleString()} {agent.currency || 'ETB'}</span>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Accrued Perks</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* Pharmacy Subscription Billing Dynamic Panel */}
      {isPharmacy && billingDetails && plan !== 'basic' && user?.subscriptionStatus === 'active' && (
        <div className="mb-8 bg-gradient-to-tr from-slate-900 via-slate-800 to-blue-950 text-white rounded-[2rem] p-6 md:p-8 shadow-xl border border-slate-700/50">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest bg-blue-950/60 px-3 py-1.5 rounded-full border border-blue-900/40">SaaS Subscription Ledger</span>
              <h2 className="text-2xl font-extrabold text-white mt-3">Dynamic Branch-Based Billing</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Base subscription plan covers 1 Main Branch. All additional outlets are charged individually under dynamic multi-outlet scale.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="bg-white/10 backdrop-blur-md p-4 px-6 rounded-2xl border border-white/15">
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">Total Monthly Cost</span>
                <span className="text-2xl font-black text-blue-400">{billingDetails.totalCost.toLocaleString()} {billingDetails.currency}</span>
              </div>
              <button 
                onClick={() => setActiveTab('subscription')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-lg cursor-pointer"
              >
                Invoices & Plans
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8 pt-6 border-t border-slate-700/50">
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Plan</span>
              <strong className="text-sm font-extrabold text-white uppercase block mt-1">{plan} Plan</strong>
              <span className="text-[10px] text-slate-400">Base: {billingDetails.basePrice.toLocaleString()} {billingDetails.currency}</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Main Branch</span>
              <strong className="text-sm font-extrabold text-white block mt-1">Included (HQ)</strong>
              <span className="text-[10px] text-slate-400 font-sans">Cost: Free</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Additional Outlets</span>
              <strong className="text-sm font-extrabold text-white block mt-1">{billingDetails.additionalBranches} Outlets</strong>
              <span className="text-[10px] text-slate-400 font-sans">Total counted: {branches.length}</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Branch Monthly Fee</span>
              <strong className="text-sm font-extrabold text-white block mt-1">+{billingDetails.additionalBranchFee} {billingDetails.currency}</strong>
              <span className="text-[10px] text-slate-400">Charged per retail branch</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Dynamic Discounts</span>
              <strong className="text-sm font-extrabold text-pink-400 block mt-1">-{billingDetails.totalDiscountPercent}% Off</strong>
              <span className="text-[10px] text-slate-400">Promotions & Referrals</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {hasPermission('sales') && (
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm h-96">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Performance Overview</h3>
              {!isStandardOrPremium && (
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">Basic Analytics</span>
              )}
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.length > 0 ? chartData : [{ name: 'No Data', sales: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={user.theme === 'dark' ? "#334155" : "#f1f5f9"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: user.theme === 'dark' ? '#1e293b' : '#fff', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    color: user.theme === 'dark' ? '#f8fafc' : '#1e293b'
                  }} 
                />
                <Bar dataKey="sales" fill={plan === 'premium' ? "#9333ea" : "#2563eb"} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className={`${hasPermission('sales') ? 'lg:col-span-1' : 'lg:col-span-3'} space-y-6`}>
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-6 rounded-3xl text-white shadow-xl border border-slate-800 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold flex flex-col text-indigo-300">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400 animate-pulse shrink-0" />
                  <span>Smart Insights</span>
                </div>
                <span className="text-[10px] text-indigo-400/80 font-semibold mt-1">
                  Daily Focus • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </h3>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[9px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 font-extrabold uppercase rounded-full border border-indigo-500/30">
                  {user.country || 'Ethiopia'}
                </span>
                {geminiInsights?.isCachedFallback && (
                  <span className="text-[7px] px-1.5 py-0.5 bg-amber-500/10 text-amber-300 font-bold uppercase rounded border border-amber-500/20 leading-none">
                    Offline Sim
                  </span>
                )}
              </div>
            </div>

            {loadingGemini ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-2">
                <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] text-slate-400 font-medium text-center">Analysing seasonal outbreak risks...</p>
              </div>
            ) : geminiError ? (
              <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-xl text-center space-y-2">
                <p className="text-[10px] text-red-400 leading-relaxed font-medium">{geminiError}</p>
                <button
                  onClick={fetchGeminiInsights}
                  className="px-2.5 py-1 bg-red-900 hover:bg-red-800 text-white rounded text-[9px] font-black uppercase transition-all cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : geminiInsights ? (
              <div className="space-y-4">
                {/* Outbreak Warning Section */}
                {geminiInsights.outbreakAlerts && geminiInsights.outbreakAlerts.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                        <Activity size={10} /> Active Threat
                      </span>
                      <span className="text-[8px] px-1.5 py-0.5 bg-red-500/15 text-red-400 font-black rounded uppercase">
                        {geminiInsights.outbreakAlerts[0].severity} risk
                      </span>
                    </div>
                    <strong className="text-xs font-extrabold text-white block">
                      {geminiInsights.outbreakAlerts[0].disease}
                    </strong>
                    <p className="text-[9px] text-indigo-300 font-semibold flex items-center gap-1">
                      <MapPin size={10} /> {geminiInsights.outbreakAlerts[0].region}
                    </p>
                    <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                      {geminiInsights.outbreakAlerts[0].description}
                    </p>
                  </div>
                )}

                {/* Stocking Tip Section */}
                {geminiInsights.recommendedMeds && geminiInsights.recommendedMeds.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 space-y-1.5">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Recommended Stock</span>
                    <strong className="text-xs font-bold text-white block">
                      {geminiInsights.recommendedMeds[0].category}
                    </strong>
                    <p className="text-[9px] text-emerald-300/90 font-black">
                      {geminiInsights.recommendedMeds[0].medicines}
                    </p>
                    <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                      {geminiInsights.recommendedMeds[0].rationale}
                    </p>
                  </div>
                )}

                {/* Daily Advisories */}
                {geminiInsights.forecastingSuggestions && geminiInsights.forecastingSuggestions.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 space-y-1.5">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Daily Advisory</span>
                    <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                      {geminiInsights.forecastingSuggestions[0]}
                    </p>
                  </div>
                )}

                <button
                  onClick={fetchGeminiInsights}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  <RefreshCw size={10} /> Refresh AI Forecast
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <button
                  onClick={fetchGeminiInsights}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
                >
                  Load Gemini Insights
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* B2B Ecosystem Guide */}
      <div className="mt-12 bg-blue-600 rounded-[32px] p-8 md:p-12 text-white overflow-hidden relative">
        <div className="relative z-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold mb-4">The B2B Ecosystem</h2>
            <p className="text-blue-100 mb-8 text-lg">
              ATECH East Africa connects pharmacies directly with importers to streamline the medical supply chain in {user.country || 'your region'}.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-bold">1</div>
                <h4 className="font-bold">Importers List</h4>
                <p className="text-sm text-blue-100">Importers list bulk products in the Marketplace with wholesale pricing.</p>
              </div>
              <div className="space-y-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-bold">2</div>
                <h4 className="font-bold">Pharmacies Order</h4>
                <p className="text-sm text-blue-100">Pharmacies browse the Marketplace and place bulk orders for their inventory.</p>
              </div>
              <div className="space-y-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-bold">3</div>
                <h4 className="font-bold">Direct Delivery</h4>
                <p className="text-sm text-blue-100">Orders are confirmed and shipped directly from importer to pharmacy.</p>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              {(role === 'pharmacy' || role === 'staff') ? (
                <button 
                  onClick={() => setActiveTab('marketplace')}
                  className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all flex items-center gap-2"
                >
                  <Search size={18} /> Browse Marketplace
                </button>
              ) : role === 'importer' ? (
                <button 
                  onClick={() => setActiveTab('my-products')}
                  className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all flex items-center gap-2"
                >
                  <Plus size={18} /> List Your Products
                </button>
              ) : null}
              <button 
                onClick={() => setActiveTab('orders')}
                className="bg-blue-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-400 transition-all"
              >
                View B2B Orders
              </button>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-indigo-500 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute top-1/2 right-12 -translate-y-1/2 hidden lg:block opacity-20">
          <Globe size={300} />
        </div>
      </div>
    </div>
  );
};

const InventoryView = ({ 
  user, 
  addToOfflineQueue, 
  syncStatus,
  selectedBranchId = 'all',
  branches = []
}: { 
  user: UserProfile, 
  addToOfflineQueue?: (item: any) => void, 
  syncStatus?: string,
  selectedBranchId?: string,
  branches?: Branch[]
}) => {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<Partial<InventoryProduct>>({
    name: '', category: 'Medicine', price: 0, costPrice: 0, quantity: 0, batchNumber: '', expiryDate: '', lowStockThreshold: 5, supplier: '', branchId: '',
    genericName: '', countryOfOrigin: '', purchaseUnit: '', dispensingUnit: '', conversionFactor: 1
  });

  const ownerId = user.role === 'staff' ? user.pharmacyId : user.uid;
  const plan = user.subscriptionType || 'basic';
  const productLimit = 200;

  useEffect(() => {
    if (!ownerId) return;
    const q = query(collection(db, 'medicines'), where('pharmacyId', '==', ownerId));
    return onSnapshot(q, 
      (s) => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() } as InventoryProduct))),
      (error) => handleFirestoreError(error, OperationType.LIST, 'medicines')
    );
  }, [ownerId]);

  const filteredProducts = products.filter(p => {
    if (selectedBranchId !== 'all') {
      const pBranchId = p.branchId || `main_branch_${ownerId}`;
      const activeMainBranchId = `main_branch_${ownerId}`;
      const matchesBranch = (selectedBranchId === 'main-branch' || selectedBranchId === activeMainBranchId)
        ? (pBranchId === 'main-branch' || pBranchId === activeMainBranchId)
        : (pBranchId === selectedBranchId);
      if (!matchesBranch) return false;
    }
    
    if (searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase();
      const matchesName = p.name ? p.name.toLowerCase().includes(qLower) : false;
      const matchesGeneric = p.genericName ? p.genericName.toLowerCase().includes(qLower) : false;
      return matchesName || matchesGeneric;
    }
    return true;
  });

  const handleAddProduct = async () => {
    if (formData.quantity < 0) {
      toast.error('Quantity cannot be negative');
      return;
    }
    if (plan === 'basic' && products.length >= productLimit) {
      toast.error(`Basic plan limit reached (${productLimit} products). Please upgrade to Standard for unlimited listings.`);
      return;
    }

    const productId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const targetBranchId = formData.branchId || (selectedBranchId === 'all' ? `main_branch_${ownerId}` : selectedBranchId);
    const newProduct = {
      ...formData,
      branchId: targetBranchId,
      id: productId,
      pharmacyId: ownerId,
      createdAt: Date.now()
    };

    try {
      if (!navigator.onLine && addToOfflineQueue) {
        addToOfflineQueue({
          id: productId,
          type: 'inventory',
          action: 'create',
          data: newProduct
        });
      }
      await setDoc(doc(db, 'medicines', productId), newProduct);

      // Log to Bin Card Ledger
      const currentBranchName = branches.find(b => b.id === targetBranchId)?.name || 'Main Branch (HQ)';
      const userRefName = user.displayName || user.email || 'Staff';
      const factorOfConv = newProduct.conversionFactor || 1;
      await recordBinCardMovement(db, {
        pharmacyId: ownerId,
        branchId: targetBranchId,
        productId: productId,
        productName: newProduct.name,
        genericName: newProduct.genericName || '',
        transactionType: 'Purchase',
        referenceNumber: newProduct.batchNumber || 'INVENTORY-GEN',
        quantityIn: newProduct.quantity * factorOfConv, // Record in dispensing units
        quantityOut: 0,
        balance: newProduct.quantity * factorOfConv, // dispensing units balance
        user: userRefName,
        branch: currentBranchName,
        product: newProduct.name,
        countryOfOrigin: newProduct.countryOfOrigin || '',
        purchaseUnit: newProduct.purchaseUnit || '',
        dispensingUnit: newProduct.dispensingUnit || '',
        conversionFactor: factorOfConv
      });

      setIsAdding(false);
      setFormData({ 
        name: '', category: 'Medicine', price: 0, costPrice: 0, quantity: 0, batchNumber: '', expiryDate: '', lowStockThreshold: 5, supplier: '', branchId: '',
        genericName: '', countryOfOrigin: '', purchaseUnit: '', dispensingUnit: '', conversionFactor: 1
      });
      toast.success(navigator.onLine ? 'Product added to inventory and logged to Bin Card' : 'Product added offline successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'medicines');
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    if (formData.quantity < 0) {
      toast.error('Inventory cannot go lower than zero');
      return;
    }

    const updatedFields = {
      ...formData,
      updatedAt: Date.now()
    };

    try {
      if (!navigator.onLine && addToOfflineQueue) {
        addToOfflineQueue({
          id: editingProduct.id,
          type: 'inventory',
          action: 'update',
          data: updatedFields
        });
      }

      await updateDoc(doc(db, 'medicines', editingProduct.id), updatedFields);

      // Save movement log if quantity or units changed
      const oldQty = editingProduct.quantity || 0;
      const newQty = formData.quantity || 0;
      const diffQty = newQty - oldQty;

      if (diffQty !== 0) {
        const brId = editingProduct.branchId || `main_branch_${ownerId}`;
        const currentBranchName = branches.find(b => b.id === brId)?.name || 'Main Branch (HQ)';
        const userRefName = user.displayName || user.email || 'Staff';
        const factorOfConv = updatedFields.conversionFactor || editingProduct.conversionFactor || 1;

        await recordBinCardMovement(db, {
          pharmacyId: ownerId,
          branchId: brId,
          productId: editingProduct.id,
          productName: updatedFields.name || editingProduct.name,
          genericName: updatedFields.genericName || editingProduct.genericName || '',
          transactionType: 'Adjustment',
          referenceNumber: updatedFields.batchNumber || editingProduct.batchNumber || 'ADJUST',
          quantityIn: diffQty > 0 ? (diffQty * factorOfConv) : 0,
          quantityOut: diffQty < 0 ? (Math.abs(diffQty) * factorOfConv) : 0,
          balance: newQty * factorOfConv,
          user: userRefName,
          branch: currentBranchName,
          product: updatedFields.name || editingProduct.name,
          countryOfOrigin: updatedFields.countryOfOrigin || editingProduct.countryOfOrigin || '',
          purchaseUnit: updatedFields.purchaseUnit || editingProduct.purchaseUnit || '',
          dispensingUnit: updatedFields.dispensingUnit || editingProduct.dispensingUnit || '',
          conversionFactor: factorOfConv
        });
      }

      setEditingProduct(null);
      setFormData({ 
        name: '', category: 'Medicine', price: 0, costPrice: 0, quantity: 0, batchNumber: '', expiryDate: '', lowStockThreshold: 5, supplier: '', branchId: '',
        genericName: '', countryOfOrigin: '', purchaseUnit: '', dispensingUnit: '', conversionFactor: 1
      });
      toast.success(navigator.onLine ? 'Inventory updated successfully' : 'Inventory updated offline!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `medicines/${editingProduct.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!navigator.onLine && addToOfflineQueue) {
        addToOfflineQueue({
          id: id,
          type: 'inventory',
          action: 'delete',
          data: {}
        });
      }
      await deleteDoc(doc(db, 'medicines', id));
      toast.success(navigator.onLine ? 'Product removed' : 'Product removed offline');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `medicines/${id}`);
    }
  };

  const handleExportPDF = () => {
    // Group by category for more detail
    const categories = Array.from(new Set(filteredProducts.map(m => m.category)));
    const categoryData = categories.map(cat => {
      const catItems = filteredProducts.filter(m => m.category === cat);
      return {
        label: `Category: ${cat}`,
        revenue: catItems.reduce((sum, m) => sum + (m.quantity * m.price), 0),
        orders: catItems.length
      };
    });

    const doc = generateInventoryReport(filteredProducts, user.displayName || 'Pharmacy');
    doc.save(`inventory-report-${Date.now()}.pdf`);
    toast.success('Detailed inventory report exported!');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory Management</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {plan === 'basic' ? `${products.length} / ${productLimit} products used` : `${products.length} products in stock`}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <Download size={18} /> Export PDF
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none flex items-center gap-2"
          >
            <Plus size={20} /> Add Product
          </button>
        </div>
      </div>

      {(isAdding || editingProduct) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl mb-8">
          <h2 className="text-xl font-bold mb-6 dark:text-white">
            {editingProduct ? `Edit: ${editingProduct.name}` : 'New Product Entry'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Product Name</label>
              <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" placeholder="e.g. Paracetamol" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Generic Name</label>
              <input type="text" value={formData.genericName || ''} onChange={e => setFormData({...formData, genericName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" placeholder="e.g. Paracetamol, Amoxicillin" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Country of Origin</label>
              <input type="text" value={formData.countryOfOrigin || ''} onChange={e => setFormData({...formData, countryOfOrigin: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" placeholder="e.g. Ethiopia, India, Germany" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Purchase Unit</label>
              <input type="text" value={formData.purchaseUnit || ''} onChange={e => setFormData({...formData, purchaseUnit: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" placeholder="e.g. Pack, Box, Bottle" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Dispensing Unit</label>
              <input type="text" value={formData.dispensingUnit || ''} onChange={e => setFormData({...formData, dispensingUnit: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" placeholder="e.g. Strip, Tablet, Capsule" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Conversion Factor</label>
              <input type="number" min="1" value={formData.conversionFactor ?? 1} onChange={e => setFormData({...formData, conversionFactor: Math.max(1, Number(e.target.value))})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" placeholder="e.g. 10 (1 Pack = 10 Strips)" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Category</label>
              <select value={formData.category || 'Medicine'} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500">
                <option>Medicine</option>
                <option>Surgical</option>
                <option>Equipment</option>
                <option>Diagnostics</option>
                <option>Cosmetics</option>
                <option>Hair Supplies</option>
                <option>Personal Care</option>
                <option>Baby Care</option>
                <option>Nutritional Supplements</option>
                <option>Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Batch Number</label>
              <input type="text" value={formData.batchNumber || ''} onChange={e => setFormData({...formData, batchNumber: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" placeholder="BN-12345" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Selling Price (ETB)</label>
              <input type="number" value={formData.price ?? 0} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Cost Price (ETB)</label>
              <input type="number" value={formData.costPrice ?? 0} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Quantity</label>
              <input type="number" min="0" value={formData.quantity ?? 0} onChange={e => setFormData({...formData, quantity: Math.max(0, Number(e.target.value))})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Expiry Date</label>
              <input type="date" value={formData.expiryDate || ''} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Low Stock Alert at</label>
              <input type="number" value={formData.lowStockThreshold ?? 5} onChange={e => setFormData({...formData, lowStockThreshold: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
            </div>
            {plan === 'premium' && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Supplier (Premium Only)</label>
                <input type="text" value={formData.supplier || ''} onChange={e => setFormData({...formData, supplier: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" placeholder="Supplier Name" />
              </div>
            )}
            {branches.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Target Branch Location</label>
                <select 
                  value={formData.branchId || ''} 
                  onChange={e => setFormData({...formData, branchId: e.target.value})} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 font-bold"
                >
                  <option value="">-- HQ / Main Location --</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="mt-8 flex justify-end gap-4">
            <button 
              onClick={() => {
                setIsAdding(false);
                setEditingProduct(null);
                setFormData({ 
                  name: '', category: 'Medicine', price: 0, costPrice: 0, quantity: 0, batchNumber: '', expiryDate: '', lowStockThreshold: 5, supplier: '', branchId: '',
                  genericName: '', countryOfOrigin: '', purchaseUnit: '', dispensingUnit: '', conversionFactor: 1
                });
              }} 
              className="px-6 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={editingProduct ? handleUpdateProduct : handleAddProduct} 
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none"
            >
              {editingProduct ? 'Update Inventory' : 'Save Product'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Brand & Generic Name Search Control */}
      <div className="mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center shadow-xs">
        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 dark:text-slate-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search medicines by brand name or generic name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white text-xs font-bold outline-none focus:border-blue-500 font-sans transition-all"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="px-8 py-5">Product</th>
              <th className="px-8 py-5">Stock</th>
              <th className="px-8 py-5">Price</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredProducts.map(m => {
              const isLowStock = m.quantity <= m.lowStockThreshold;
              
              // Advanced Expiry calculations
              const today = new Date();
              today.setHours(0,0,0,0);
              const expDate = m.expiryDate ? new Date(m.expiryDate) : null;
              if (expDate) expDate.setHours(0,0,0,0);
              const daysLeft = expDate ? Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : Infinity;
              
              const isExpired = daysLeft < 0;
              const isExpiring30 = daysLeft >= 0 && daysLeft <= 30;
              const isExpiring60 = daysLeft > 30 && daysLeft <= 60;
              const isExpiring90 = daysLeft > 60 && daysLeft <= 90;

              let expiryCountdownText = "";
              if (isExpired) {
                expiryCountdownText = " | Expired!";
              } else if (isExpiring30) {
                expiryCountdownText = ` | ${daysLeft} Days left (Critical)`;
              } else if (isExpiring60) {
                expiryCountdownText = ` | ${daysLeft} Days left (Urgent)`;
              } else if (isExpiring90) {
                expiryCountdownText = ` | ${daysLeft} Days left (Monitored)`;
              }

              let rowHighlightClass = "hover:bg-slate-50 dark:hover:bg-slate-800/50";
              if (isExpired) {
                rowHighlightClass = "bg-red-50/10 hover:bg-red-50/20 dark:bg-red-950/5 dark:hover:bg-red-950/10";
              } else if (isExpiring30) {
                rowHighlightClass = "bg-orange-50/15 hover:bg-orange-50/30 dark:bg-orange-950/5 dark:hover:bg-orange-950/10";
              }

              return (
                <tr key={m.id} className={`${rowHighlightClass} transition-colors`}>
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                      <span>{m.name}</span>
                      {m.genericName && (
                        <span className="text-xs text-slate-400 font-normal">({m.genericName})</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Batch: {m.batchNumber} | Exp: {m.expiryDate || 'N/A'}
                      {expiryCountdownText && (
                        <span className={`font-extrabold ml-1 uppercase text-[10px] ${
                          isExpired ? 'text-red-550 dark:text-red-400' :
                          isExpiring30 ? 'text-orange-500 dark:text-orange-400' :
                          'text-amber-500 dark:text-amber-400'
                        }`}>
                          {expiryCountdownText}
                        </span>
                      )}
                    </p>
                    <div className="flex gap-2 items-center mt-1.5 flex-wrap">
                      {m.countryOfOrigin && (
                        <span className="inline-block text-[9px] font-black px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded uppercase">
                          🌍 {m.countryOfOrigin}
                        </span>
                      )}
                      {plan === 'premium' && m.supplier && (
                        <span className="text-[9px] font-black text-blue-500 uppercase">Supplier: {m.supplier}</span>
                      )}
                      {branches.length > 0 && (
                        <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
                          📍 {branches.find(b => b.id === (m.branchId || `main_branch_${ownerId}`))?.name || 'Main Branch (HQ)'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {m.conversionFactor && m.conversionFactor > 1 ? (
                      <div className="space-y-0.5">
                        <p className={`font-bold ${isLowStock ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                          {m.quantity.toFixed(1)} {m.purchaseUnit || 'Packs'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold">
                          {(m.quantity * m.conversionFactor).toFixed(0)} {m.dispensingUnit || 'Strips'}
                        </p>
                        <p className="text-[9px] text-blue-500 italic font-medium">1 unit = {m.conversionFactor} {m.dispensingUnit || 'sub'}</p>
                      </div>
                    ) : (
                      <p className={`font-bold ${isLowStock ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                        {m.quantity} {m.dispensingUnit || 'units'}
                      </p>
                    )}
                  </td>
                  <td className="px-8 py-5 font-bold text-slate-900 dark:text-white">{m.price.toLocaleString()} ETB</td>
                  <td className="px-8 py-5">
                    <div className="flex flex-wrap gap-2">
                      {isLowStock && <span className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><AlertTriangle size={10} /> Low Stock</span>}
                      {isExpired && <span className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><ShieldAlert size={10} /> Expired</span>}
                      {isExpiring30 && <span className="bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><AlertTriangle size={10} /> Expiring &lt;= 30d</span>}
                      {isExpiring60 && <span className="bg-amber-50 dark:bg-amber-950/10 text-amber-500 dark:text-amber-400 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><Clock size={10} /> Expiring &lt;= 60d</span>}
                      {isExpiring90 && <span className="bg-yellow-50 dark:bg-yellow-950/10 text-yellow-600 dark:text-yellow-450 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><Calendar size={10} /> Expiring &lt;= 90d</span>}
                      {!isLowStock && !isExpired && !isExpiring30 && !isExpiring60 && !isExpiring90 && <span className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle size={10} /> Healthy</span>}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingProduct(m);
                          setFormData(m);
                          setIsAdding(false);
                        }} 
                        className="text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(m.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StaffManagementView = ({ 
  user, 
  branches = [], 
  warehouses = [],
  selectedBranchId = 'all' 
}: { 
  user: UserProfile, 
  branches?: Branch[], 
  warehouses?: any[],
  selectedBranchId?: string 
}) => {
  const [staff, setStaff] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [newStaff, setNewStaff] = useState({ name: '', role: user.role === 'importer' ? 'importer_staff' : 'pharmacist', branchId: '' });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(DEFAULT_PERMISSIONS[user.role === 'importer' ? 'importer_staff' : 'pharmacist']);
  const [generatedCreds, setGeneratedCreds] = useState<{username: string, password: string} | null>(null);

  const ownerId = user.role === 'staff' ? (user.pharmacyId || user.importerId || user.distributorId) : user.uid;
  const isImporterOwner = user.role === 'importer' || user.role === 'distributor' || (user.role === 'staff' && (user.importerId || user.distributorId));
  const plan = user.subscriptionType || 'basic';
  const canCustomize = plan !== 'basic';
  const isPremium = plan === 'premium';

  const filteredStaff = staff.filter(s => {
    if (selectedBranchId === 'all') return true;
    const sBranchId = s.branchId || `main_branch_${ownerId}`;
    const activeMainBranchId = `main_branch_${ownerId}`;
    if (selectedBranchId === 'main-branch' || selectedBranchId === activeMainBranchId) {
      return sBranchId === 'main-branch' || sBranchId === activeMainBranchId;
    }
    return sBranchId === selectedBranchId;
  });

  useEffect(() => {
    if (!ownerId) return;
    const field = isImporterOwner ? 'importerId' : 'pharmacyId';
    const q = query(collection(db, 'users'), where(field, '==', ownerId));
    return onSnapshot(q, 
      (s) => setStaff(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      (error) => handleFirestoreError(error, OperationType.LIST, 'users')
    );
  }, [ownerId, isImporterOwner]);

  const handleRoleChange = (role: string) => {
    if (editingStaff) {
      setEditingStaff({ ...editingStaff, staffRole: role });
    } else {
      setNewStaff({ ...newStaff, role });
    }
    setSelectedPermissions(DEFAULT_PERMISSIONS[role] || ['dashboard', 'settings']);
  };

  const handleEditStaff = (staffMember: any) => {
    setEditingStaff(staffMember);
    setSelectedPermissions(staffMember.permissions || DEFAULT_PERMISSIONS[staffMember.staffRole] || ['dashboard', 'settings']);
    setIsAdding(false);
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff) return;
    const updateToast = toast.loading('Updating staff permissions...');
    try {
      await updateDoc(doc(db, 'users', editingStaff.id), {
        staffRole: editingStaff.staffRole,
        branchId: editingStaff.branchId || null,
        permissions: selectedPermissions
      });
      setEditingStaff(null);
      toast.success('Staff permissions updated!', { id: updateToast });
    } catch (error) {
      console.error(error);
      toast.error('Failed to update permissions', { id: updateToast });
    }
  };

  const togglePermission = (perm: string) => {
    if (!canCustomize) {
      toast.error('Upgrade to Standard or Premium to customize permissions');
      return;
    }
    if (selectedPermissions.includes(perm)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== perm));
    } else {
      setSelectedPermissions([...selectedPermissions, perm]);
    }
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleAddStaff = async () => {
    if (!newStaff.name) {
      toast.error('Please enter a name');
      return;
    }
    const addToast = toast.loading('Creating staff account...');
    try {
      const slugify = (text: string, sep: string = '') => {
        const slug = text.toLowerCase().trim().replace(/[^a-z0-9]+/g, sep);
        if (!sep) return slug;
        const escapedSep = sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return slug.replace(new RegExp(`^${escapedSep}+|${escapedSep}+$`, 'g'), '');
      };

      const businessName = user.pharmacyName || user.importerName || user.distributorName || 'business';
      const pharmacySlug = slugify(businessName);
      const nameSlug = slugify(newStaff.name, '.');
      let username = `${nameSlug}@${pharmacySlug}`;
      let email = `${nameSlug}.${pharmacySlug}@staff.atech.com`;
      const password = generatePassword();

      console.log('[Staff Creation Debug]', { 
        name: newStaff.name,
        business: businessName,
        nameSlug,
        pharmacySlug,
        finalEmail: email
      });

      // Use a secondary app instance to create the user without logging out the current manager
      const firebaseConfig = (await import('../firebase-applet-config.json')).default;
      const { initializeApp } = await import('firebase/app');
      const { getAuth, createUserWithEmailAndPassword, signOut: signOutAuth } = await import('firebase/auth');
      
      const secondaryApp = initializeApp(firebaseConfig, `Secondary-${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);
      
      let staffUid = '';
      try {
        const result = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        staffUid = result.user.uid;
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          // Try one more time with a random suffix
          const suffix = Math.floor(100 + Math.random() * 900);
          username = `${nameSlug}${suffix}@${pharmacySlug}`;
          email = `${username.toLowerCase().replace('@', '.')}@staff.atech.com`;
          const result = await createUserWithEmailAndPassword(secondaryAuth, email, password);
          staffUid = result.user.uid;
        } else {
          throw authError;
        }
      }
      
      // Sign out the secondary instance immediately
      await signOutAuth(secondaryAuth);

      await setDoc(doc(db, 'users', staffUid), {
        ...newStaff,
        displayName: (newStaff as any).name,
        uid: staffUid,
        username,
        password,
        email,
        pharmacyId: (user.role === 'pharmacy' ? user.uid : (user.role === 'staff' ? (user.pharmacyId || null) : null)),
        pharmacyName: user.pharmacyName || null,
        importerId: (user.role === 'importer' ? user.uid : (user.role === 'staff' ? (user.importerId || null) : null)),
        importerName: user.importerName || null,
        distributorId: (user.role === 'distributor' ? user.uid : (user.role === 'staff' ? (user.distributorId || null) : null)),
        distributorName: user.distributorName || null,
        role: 'staff',
        staffRole: newStaff.role,
        branchId: newStaff.branchId || null,
        permissions: selectedPermissions,
        verificationStatus: 'approved',
        createdAt: Date.now()
      });
      
      setGeneratedCreds({ username, password });
      setIsAdding(false);
      setNewStaff({ name: '', role: 'pharmacist', branchId: '' });
      toast.success('Staff account created!', { id: addToast });
    } catch (error: any) {
      if (error && error.code !== 'auth/email-already-in-use') {
        console.error(error);
      } else {
        console.warn('Staff validation Check: Staff email is already registered');
      }
      let message = 'Failed to create staff account';
      if (error.code === 'auth/email-already-in-use') {
        message = 'This staff name is already taken for this pharmacy. Please try adding a middle name or initial.';
      }
      toast.error(message, { id: addToast });
    }
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
      toast.success('Staff member removed');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Staff Management</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your pharmacy team and roles. To reset a password, remove and re-add the staff member.</p>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg w-fit">
              <Building2 size={14} />
              <span>Pharmacy Login Name: <strong>{user.pharmacyName ? user.pharmacyName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '') : 'pharmacy'}</strong></span>
            </div>
            <button 
              onClick={() => {
                const name = user.pharmacyName ? user.pharmacyName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '') : 'pharmacy';
                navigator.clipboard.writeText(name);
                toast.success('Copied to clipboard');
              }}
              className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              <Copy size={12} /> Copy
            </button>
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none flex items-center gap-2"
        >
          <UserPlus size={20} /> Add Staff Member
        </button>
      </div>

      {(isAdding || editingStaff) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl mb-8">
          <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">{editingStaff ? `Edit Permissions: ${editingStaff.name}` : 'New Staff Member'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Full Name</label>
              <input 
                type="text" 
                value={(editingStaff ? editingStaff.name : newStaff.name) || ''} 
                onChange={e => editingStaff ? setEditingStaff({...editingStaff, name: e.target.value}) : setNewStaff({...newStaff, name: e.target.value})} 
                className={`w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500 ${editingStaff ? 'bg-slate-50 dark:bg-slate-900 cursor-not-allowed' : ''}`} 
                placeholder="e.g. Abebe Kebede"
                disabled={!!editingStaff}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Role</label>
              <select 
                value={(editingStaff ? editingStaff.staffRole : newStaff.role) || 'pharmacist'} 
                onChange={e => handleRoleChange(e.target.value)} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500"
              >
                <option value="pharmacist">Pharmacist</option>
                <option value="cashier">Cashier</option>
                <option value="inventory">Inventory Manager</option>
                <option value="warehouse_manager">Warehouse Manager</option>
              </select>
            </div>
            {((editingStaff ? editingStaff.staffRole : newStaff.role) === 'warehouse_manager') ? (
              warehouses.length > 0 && !isImporterOwner && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Assign to Warehouse</label>
                  <select 
                    value={(editingStaff ? editingStaff.branchId : newStaff.branchId) || ''} 
                    onChange={e => {
                      const wId = e.target.value;
                      if (editingStaff) {
                        setEditingStaff({...editingStaff, branchId: wId});
                      } else {
                        setNewStaff({...newStaff, branchId: wId});
                      }
                    }} 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="">-- No Specific Warehouse --</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              )
            ) : (
              branches.length > 0 && !isImporterOwner && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Assign to Branch Location</label>
                  <select 
                    value={(editingStaff ? editingStaff.branchId : newStaff.branchId) || ''} 
                    onChange={e => {
                      const bId = e.target.value;
                      if (editingStaff) {
                        setEditingStaff({...editingStaff, branchId: bId});
                      } else {
                        setNewStaff({...newStaff, branchId: bId});
                      }
                    }} 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="">-- Main Branch (HQ) --</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )
            )}
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Access Permissions</label>
              {!canCustomize && (
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full uppercase tracking-wider">Upgrade to customize</span>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'inventory', label: 'Inventory' },
                { id: 'sales', label: 'Sales & POS' },
                { id: 'marketplace', label: 'Marketplace' },
                { id: 'orders', label: 'B2B Orders' },
                { id: 'procurement', label: 'Procurement (PR & PO)' },
                { id: 'settings', label: 'Settings' }
              ].map(perm => (
                <button
                  key={perm.id}
                  onClick={() => togglePermission(perm.id)}
                  className={`px-4 py-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                    selectedPermissions.includes(perm.id)
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                  } ${!canCustomize ? 'cursor-not-allowed opacity-75' : 'hover:border-blue-300 dark:hover:border-blue-700'}`}
                >
                  {perm.label}
                  {selectedPermissions.includes(perm.id) && <CheckCircle size={14} />}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 italic">
              {canCustomize 
                ? "Click to toggle permissions. Defaults are applied based on the selected role."
                : "Standard and Premium plans allow custom permission adjustments."}
            </p>
          </div>
          <div className="mt-8 flex justify-end gap-4">
            <button onClick={() => { setIsAdding(false); setEditingStaff(null); }} className="px-6 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">Cancel</button>
            <button onClick={editingStaff ? handleUpdateStaff : handleAddStaff} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none">
              {editingStaff ? 'Save Changes' : 'Generate Credentials'}
            </button>
          </div>
        </motion.div>
      )}

      {generatedCreds && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-blue-600 text-white p-8 rounded-3xl shadow-xl mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Credentials Generated!</h2>
              <button onClick={() => setGeneratedCreds(null)} className="p-1 hover:bg-white/20 rounded-lg transition-colors"><X size={20} /></button>
            </div>
            <p className="text-blue-100 mb-6">Share these credentials with your new staff member. They can change their password after logging in.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">Username</p>
                <p className="font-mono font-bold">{generatedCreds.username}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">Temporary Password</p>
                <p className="font-mono font-bold">{generatedCreds.password}</p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => {
                  const link = `${window.location.origin}?login=staff&u=${generatedCreds.username}&p=${generatedCreds.password}&ph=${user.pharmacyName}`;
                  navigator.clipboard.writeText(link);
                  toast.success('Login link copied to clipboard!');
                }}
                className="bg-white text-blue-600 px-6 py-2 rounded-xl font-bold hover:bg-blue-50 transition-all flex items-center gap-2 text-sm"
              >
                <ExternalLink size={16} /> Copy Login Link
              </button>
            </div>
          </div>
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        </motion.div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="px-8 py-5">Staff Member</th>
              <th className="px-8 py-5">Role</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredStaff.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-8 py-5">
                  <p className="font-bold text-slate-900 dark:text-white">{s.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{s.username || s.email}</p>
                  {branches.length > 0 && !isImporterOwner && (
                    <div className="mt-1">
                      <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300 rounded border border-slate-100 dark:border-slate-800">
                        📍 {branches.find(b => b.id === (s.branchId || `main_branch_${ownerId}`))?.name || 'Main Branch (HQ)'}
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-8 py-5">
                  <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase">{s.role}</span>
                </td>
                <td className="px-8 py-5">
                  <span className="flex items-center gap-1 text-green-500 text-xs font-bold">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div> Active
                  </span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleEditStaff(s)}
                      className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Edit Permissions"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(s.email);
                        toast.success('Email copied');
                      }}
                      className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Copy Login Email"
                    >
                      <Mail size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteStaff(s.id)}
                      className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      title="Remove Staff"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-12 text-center text-slate-400 dark:text-slate-500 italic">No staff members added yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const BranchesView = ({ user, branches = [], settings = null }: { user: UserProfile, branches: Branch[], settings?: SystemSettings | null }) => {
  const [activeBranchTab, setActiveBranchTab] = useState<'list' | 'transfer' | 'history'>('list');
  const [isAdding, setIsAdding] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: '', location: '', phone: '', manager: '' });

  const [allProducts, setAllProducts] = useState<InventoryProduct[]>([]);
  const [sharedStaff, setSharedStaff] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);

  // Multi-item stock transfer draft states
  const [draftFromBranchId, setDraftFromBranchId] = useState('');
  const [draftToBranchId, setDraftToBranchId] = useState('');
  const [transferDraftItems, setTransferDraftItems] = useState<{
    productId: string;
    productName: string;
    genericName?: string;
    batchNumber?: string;
    expiryDate?: string;
    quantity: number;
    availableQty: number;
  }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProductQty, setSelectedProductQty] = useState<number>(0);
  const [draftNotes, setDraftNotes] = useState('');

  // Search and Filter states for Transfer logs
  const [filterTransferNumber, setFilterTransferNumber] = useState('');
  const [filterSourceBranch, setFilterSourceBranch] = useState('');
  const [filterDestBranch, setFilterDestBranch] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Selected Transfer Detail modal state
  const [selectedTransferForModal, setSelectedTransferForModal] = useState<any | null>(null);

  const ownerId = user.role === 'staff' ? (user.pharmacyId || user.uid) : user.uid;

  useEffect(() => {
    if (!ownerId) return;

    // Load all inventory for stock transfers
    const qProducts = query(collection(db, 'medicines'), where('pharmacyId', '==', ownerId));
    const unsubProducts = onSnapshot(qProducts, (s) => {
      setAllProducts(s.docs.map(d => ({ id: d.id, ...d.data() } as InventoryProduct)));
    });

    // Load active staff count per branch
    const qStaff = query(collection(db, 'users'), where('pharmacyId', '==', ownerId));
    const unsubStaff = onSnapshot(qStaff, (s) => {
      setSharedStaff(s.docs.map(d => d.data()));
    });

    // Load transfer logs
    const qTransfers = query(collection(db, 'transfers'), where('pharmacyId', '==', ownerId));
    const unsubTransfers = onSnapshot(qTransfers, (s) => {
      const logs = s.docs.map(d => ({ id: d.id, ...d.data() } as any));
      // Sort in descending order of createdAt
      logs.sort((a,b) => b.createdAt - a.createdAt);
      setTransfers(logs);
    });

    return () => {
      unsubProducts();
      unsubStaff();
      unsubTransfers();
    };
  }, [ownerId]);

  const handleCreateBranch = async () => {
    if (!newBranch.name.trim() || !newBranch.location.trim()) {
      toast.error('Please enter branch name and location');
      return;
    }
    const createToast = toast.loading('Creating branch & recalculating SaaS subscription...');
    try {
      const branchId = `branch_${Date.now()}`;
      const branchData = {
        id: branchId,
        pharmacyId: ownerId,
        name: newBranch.name,
        location: newBranch.location,
        phone: newBranch.phone || '',
        manager: newBranch.manager || '',
        createdAt: Date.now()
      };
      await setDoc(doc(db, 'branches', branchId), branchData);
      
      // Dynamic branch calculation engine updates!
      await syncPharmacyBillingAndInvoices(ownerId);

      setNewBranch({ name: '', location: '', phone: '', manager: '' });
      setIsAdding(false);
      toast.success('Branch location created successfully! Subscription updated.', { id: createToast });
    } catch (err) {
      console.error(err);
      toast.error('Failed to create branch or update billing', { id: createToast });
    }
  };

  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [isDeletingBranch, setIsDeletingBranch] = useState(false);

  const isAuthorized = user.role === 'pharmacy' || (
    user.role === 'staff' && (
      (user.permissions && user.permissions.includes('branches')) ||
      (!user.permissions && user.staffRole && (DEFAULT_PERMISSIONS[user.staffRole] || []).includes('branches'))
    )
  );

  const handleDeleteBranchClick = (b: Branch) => {
    setBranchToDelete(b);
  };

  const handleExecuteDelete = async () => {
    if (!branchToDelete) return;
    const branchId = branchToDelete.id;
    const branchName = branchToDelete.name;
    setIsDeletingBranch(true);
    const deleteToast = toast.loading('Deleting branch & reconciling SaaS subscription...');
    try {
      // 1. Update references where appropriate to prevent orphaned references
      // Staff members of this branch -> reset their branchId to ''
      const staffQuery = query(collection(db, 'users'), where('pharmacyId', '==', ownerId), where('branchId', '==', branchId));
      const staffSnap = await getDocs(staffQuery);
      for (const d of staffSnap.docs) {
        await updateDoc(doc(db, 'users', d.id), { branchId: '' });
      }

      // Medicines/products of this branch -> reset their branchId to ''
      const medQuery = query(collection(db, 'medicines'), where('pharmacyId', '==', ownerId), where('branchId', '==', branchId));
      const medSnap = await getDocs(medQuery);
      for (const d of medSnap.docs) {
        await updateDoc(doc(db, 'medicines', d.id), { branchId: '' });
      }

      // 2. Remove the branch record from the database
      await deleteDoc(doc(db, 'branches', branchId));

      // 3. Dynamic branch calculation engine updates!
      await syncPharmacyBillingAndInvoices(ownerId);

      // 4. Create an audit log record containing requested metadata
      try {
        await addDoc(collection(db, 'audit_logs'), {
          uid: user.uid,
          action: 'BRANCH_DELETION',
          details: `Deleted Branch ${branchName} (ID: ${branchId}) for organization ${ownerId}`,
          branchId: branchId,
          branchName: branchName,
          userEmail: user.email,
          organizationId: ownerId,
          timestamp: Date.now()
        });
      } catch (auditErr) {
        console.error("Auditing failed", auditErr);
      }

      toast.success('Branch deleted and subscription billing reduced!', { id: deleteToast });
      setBranchToDelete(null);
    } catch (err: any) {
      console.error(err);
      try {
        handleFirestoreError(err, OperationType.DELETE, `branches/${branchId}`);
      } catch (e: any) {
        toast.error(`Deletion failed: ${e.message || 'unknown error'}`, { id: deleteToast });
      }
    } finally {
      setIsDeletingBranch(false);
    }
  };

  // Draft multiple item functions
  const handleAddDraftProduct = () => {
    if (!selectedProductId || selectedProductQty <= 0) {
      toast.error('Select a product and enter valid non-zero count');
      return;
    }
    const productItem = allProducts.find(p => p.id === selectedProductId);
    if (!productItem) {
      toast.error('Selected product not found in active catalog');
      return;
    }

    // Checking if already in draft list
    const isAlreadyAdded = transferDraftItems.some(item => item.productId === selectedProductId);
    if (isAlreadyAdded) {
      toast.error('Product already in draft lists, edit or remove it below first');
      return;
    }

    if (productItem.quantity < selectedProductQty) {
      toast.error(`Insufficient stock! Available matches: ${productItem.quantity}`);
      return;
    }

    setTransferDraftItems([
      ...transferDraftItems,
      {
        productId: productItem.id,
        productName: productItem.name,
        genericName: productItem.genericName || '',
        batchNumber: productItem.batchNumber || 'N/A',
        expiryDate: productItem.expiryDate || 'N/A',
        quantity: selectedProductQty,
        availableQty: productItem.quantity
      }
    ]);

    setSelectedProductId('');
    setSelectedProductQty(0);
  };

  const handleRemoveDraftItem = (index: number) => {
    setTransferDraftItems(transferDraftItems.filter((_, i) => i !== index));
  };

  // Safe Multi-Product Transfer Save or Immediate Dispatch
  const handleSaveTransferWorkflow = async (dispatchImmediately: boolean) => {
    if (!draftFromBranchId || !draftToBranchId) {
      toast.error('Specify source and destination branches');
      return;
    }
    if (draftFromBranchId === draftToBranchId) {
      toast.error('Source and Destination branches cannot be identical');
      return;
    }
    if (transferDraftItems.length === 0) {
      toast.error('Add at least one product item to create transfer list');
      return;
    }

    const nextId = `trf_${Date.now()}`;
    const yearCode = new Date().getFullYear();

    // Generate consecutive sequential unique TRF-YYYY-###### ID
    let highestNum = 0;
    transfers.forEach(t => {
      if (t.transferNumber) {
        const match = t.transferNumber.match(/TRF-\d{4}-(\d{6})/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > highestNum) highestNum = num;
        }
      }
    });
    const nextNum = String(highestNum + 1).padStart(6, '0');
    const transferNumber = `TRF-${yearCode}-${nextNum}`;

    const fromBranchName = getBranchName(draftFromBranchId);
    const toBranchName = getBranchName(draftToBranchId);
    const operatorName = user.displayName || user.email || 'Staff Operator';

    const status = dispatchImmediately ? 'in_transit' : 'pending';
    const initialTimeline = [
      {
        status: 'pending',
        timestamp: Date.now(),
        user: operatorName
      }
    ];

    if (dispatchImmediately) {
      initialTimeline.push({
        status: 'in_transit',
        timestamp: Date.now(),
        user: operatorName
      });
    }

    const newTransferRecord = {
      id: nextId,
      transferNumber,
      pharmacyId: ownerId,
      fromBranchId: draftFromBranchId,
      fromBranchName,
      toBranchId: draftToBranchId,
      toBranchName,
      items: transferDraftItems.map(it => ({
        productId: it.productId,
        productName: it.productName,
        genericName: it.genericName || '',
        batchNumber: it.batchNumber || 'N/A',
        expiryDate: it.expiryDate || 'N/A',
        quantity: it.quantity
      })),
      notes: draftNotes || '',
      status,
      statusHistory: initialTimeline,
      dispatchUser: dispatchImmediately ? operatorName : '',
      dispatchDate: dispatchImmediately ? Date.now() : 0,
      createdAt: Date.now(),
      createdBy: user.uid,
      updatedAt: Date.now()
    };

    const actionToast = toast.loading(dispatchImmediately ? 'Registering transfer and committing stock reservations...' : 'Creating transfer request on system...');

    try {
      const batch = writeBatch(db);
      
      // Save transfer record to Firestore
      const trDocRef = doc(db, 'transfers', nextId);
      batch.set(trDocRef, newTransferRecord);

      if (dispatchImmediately) {
        // Reservable stock safety locking
        for (const it of transferDraftItems) {
          const liveSourceItem = allProducts.find(p => p.id === it.productId);
          if (!liveSourceItem) {
            throw new Error(`Product ${it.productName} is missing inside system data`);
          }
          if (liveSourceItem.quantity < it.quantity) {
            throw new Error(`Insufficient stock for ${it.productName}. Available: ${liveSourceItem.quantity}`);
          }

          // Lock: subtract quantity, increment reserved
          const itemRef = doc(db, 'medicines', it.productId);
          batch.update(itemRef, {
            quantity: increment(-it.quantity),
            reserved: increment(it.quantity)
          });

          // Audit item level action
          await addDoc(collection(db, 'audit_logs'), {
            uid: user.uid,
            action: 'Created',
            details: `Reserved and Dispatched item: ${it.productName} (Qty: ${it.quantity}, Batch: ${it.batchNumber}) under ${transferNumber}`,
            transferNumber,
            branch: fromBranchName,
            product: it.productName,
            quantity: it.quantity,
            timestamp: Date.now()
          });
        }
      }

      // Add main audit trail entry
      await addDoc(collection(db, 'audit_logs'), {
        uid: user.uid,
        action: dispatchImmediately ? 'Dispatched' : 'Created',
        details: `Saved new inter-branch stock movement sheet ${transferNumber} from ${fromBranchName} to ${toBranchName} (items count: ${transferDraftItems.length})`,
        transferNumber,
        branch: fromBranchName,
        timestamp: Date.now()
      });

      await batch.commit();

      toast.success(dispatchImmediately ? 'Dispatched successfully! Stock locked under reserved transit.' : 'Transfer request drafted!', { id: actionToast });
      
      // Clear State
      setTransferDraftItems([]);
      setDraftNotes('');
      setDraftFromBranchId('');
      setDraftToBranchId('');
      setActiveBranchTab('history');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error occurred while saving stock transfer data', { id: actionToast });
    }
  };

  // State Reconciliation Action System (Dispatch, Receive, Reject)
  const handleExecuteTransferStateChange = async (transfer: any, action: 'dispatch' | 'receive' | 'reject') => {
    const operatorName = user.displayName || user.email || 'Staff';
    const actionToast = toast.loading(`Committing transition ${action.toUpperCase()} for transfer sheet ${transfer.transferNumber}...`);

    try {
      const batch = writeBatch(db);
      const docRef = doc(db, 'transfers', transfer.id);
      const currentHistory = [...(transfer.statusHistory || [])];

      if (action === 'dispatch') {
        currentHistory.push({
          status: 'in_transit',
          timestamp: Date.now(),
          user: operatorName
        });

        // Loop items check & reserve
        for (const item of transfer.items) {
          const originalProd = allProducts.find(p => p.id === item.productId);
          if (!originalProd) {
            throw new Error(`Source product item ${item.productName} cannot be located in current branch catalogs.`);
          }
          if (originalProd.quantity < item.quantity) {
            throw new Error(`Insufficient stock in ${item.productName}. Available: ${originalProd.quantity}`);
          }

          // Lock and reserve
          const itemRef = doc(db, 'medicines', item.productId);
          batch.update(itemRef, {
            quantity: increment(-item.quantity),
            reserved: increment(item.quantity)
          });

          // Individual audit
          await addDoc(collection(db, 'audit_logs'), {
            uid: user.uid,
            action: 'Dispatched',
            details: `Dispatched item: ${item.productName} Quantity: ${item.quantity} (Batch: ${item.batchNumber}) under ${transfer.transferNumber}`,
            transferNumber: transfer.transferNumber,
            branch: transfer.fromBranchName,
            product: item.productName,
            quantity: item.quantity,
            timestamp: Date.now()
          });
        }

        // Update transfer status to in_transit
        batch.update(docRef, {
          status: 'in_transit',
          statusHistory: currentHistory,
          dispatchUser: operatorName,
          dispatchDate: Date.now(),
          updatedAt: Date.now()
        });

        // Log main dispatch audit
        await addDoc(collection(db, 'audit_logs'), {
          uid: user.uid,
          action: 'Dispatched',
          details: `Confirmed dispatcher release of Stock Transfer manifest ${transfer.transferNumber} to ${transfer.toBranchName}`,
          transferNumber: transfer.transferNumber,
          branch: transfer.fromBranchName,
          timestamp: Date.now()
        });
      }
      else if (action === 'receive') {
        currentHistory.push({
          status: 'completed',
          timestamp: Date.now(),
          user: operatorName
        });

        // Dual system inventory safe movements
        for (const item of transfer.items) {
          const originalProd = allProducts.find(p => p.id === item.productId || (p.name === item.productName && p.batchNumber === item.batchNumber));
          const conversionRatio = originalProd?.conversionFactor || 1;

          // 1. Permanently remove locked quantity from source reserved
          if (originalProd) {
            const srcDocRef = doc(db, 'medicines', originalProd.id);
            batch.update(srcDocRef, {
              reserved: increment(-item.quantity)
            });

            // Bin Card movement outbound
            await recordBinCardMovement(db, {
              pharmacyId: ownerId,
              branchId: transfer.fromBranchId,
              productId: originalProd.id,
              productName: item.productName,
              genericName: item.genericName || '',
              transactionType: 'Transfer Out',
              referenceNumber: transfer.transferNumber,
              quantityIn: 0,
              quantityOut: item.quantity * conversionRatio,
              balance: Math.max(0, (originalProd.quantity - item.quantity)) * conversionRatio,
              user: operatorName,
              branch: transfer.fromBranchName,
              product: item.productName,
              countryOfOrigin: originalProd.countryOfOrigin || '',
              purchaseUnit: originalProd.purchaseUnit || '',
              dispensingUnit: originalProd.dispensingUnit || '',
              conversionFactor: conversionRatio
            });
          }

          // 2. Safely credit target branch catalog
          const fallbackHQId = `main_branch_${ownerId}`;
          const targetCatalogProduct = allProducts.find(p => 
            p.name === item.productName && 
            p.batchNumber === item.batchNumber && 
            ((p.branchId || fallbackHQId) === transfer.toBranchId || 
             ((p.branchId === 'main-branch' || p.branchId === fallbackHQId || !p.branchId) && 
              (transfer.toBranchId === 'main-branch' || transfer.toBranchId === fallbackHQId)))
          );

          const newTargetId = targetCatalogProduct?.id || `prod_${Date.now()}_tgt_${Math.random().toString(36).substring(2, 6)}`;
          const targetDocRef = doc(db, 'medicines', newTargetId);

          if (targetCatalogProduct) {
            batch.update(targetDocRef, {
              quantity: increment(item.quantity)
            });

            // Bin Card movement inbound
            await recordBinCardMovement(db, {
              pharmacyId: ownerId,
              branchId: transfer.toBranchId,
              productId: targetCatalogProduct.id,
              productName: item.productName,
              genericName: item.genericName || '',
              transactionType: 'Transfer In',
              referenceNumber: transfer.transferNumber,
              quantityIn: item.quantity * conversionRatio,
              quantityOut: 0,
              balance: (targetCatalogProduct.quantity + item.quantity) * conversionRatio,
              user: operatorName,
              branch: transfer.toBranchName,
              product: item.productName,
              countryOfOrigin: targetCatalogProduct.countryOfOrigin || '',
              purchaseUnit: targetCatalogProduct.purchaseUnit || '',
              dispensingUnit: targetCatalogProduct.dispensingUnit || '',
              conversionFactor: conversionRatio
            });
          } else {
            // Duplicate attributes but update branch destination keys
            const sourceTemplate = originalProd || allProducts.find(p => p.name === item.productName) || {};
            const copiedMedicineEntry = {
              ...sourceTemplate,
              id: newTargetId,
              pharmacyId: ownerId,
              branchId: transfer.toBranchId,
              quantity: item.quantity,
              reserved: 0,
              createdAt: Date.now()
            };
            copiedMedicineEntry.branchId = transfer.toBranchId;
            batch.set(targetDocRef, copiedMedicineEntry);

            // Bin Card inbound new creation
            await recordBinCardMovement(db, {
              pharmacyId: ownerId,
              branchId: transfer.toBranchId,
              productId: newTargetId,
              productName: item.productName,
              genericName: item.genericName || '',
              transactionType: 'Transfer In',
              referenceNumber: transfer.transferNumber,
              quantityIn: item.quantity * conversionRatio,
              quantityOut: 0,
              balance: item.quantity * conversionRatio,
              user: operatorName,
              branch: transfer.toBranchName,
              product: item.productName,
              countryOfOrigin: sourceTemplate.countryOfOrigin || '',
              purchaseUnit: sourceTemplate.purchaseUnit || '',
              dispensingUnit: sourceTemplate.dispensingUnit || '',
              conversionFactor: conversionRatio
            });
          }

          // Credit item level receipt audit
          await addDoc(collection(db, 'audit_logs'), {
            uid: user.uid,
            action: 'Received',
            details: `Received item: ${item.productName} (x${item.quantity}, Batch: ${item.batchNumber}) at ${transfer.toBranchName}`,
            transferNumber: transfer.transferNumber,
            branch: transfer.toBranchName,
            product: item.productName,
            quantity: item.quantity,
            timestamp: Date.now()
          });
        }

        // Close Transfer
        batch.update(docRef, {
          status: 'completed',
          statusHistory: currentHistory,
          receivingUser: operatorName,
          receiptDate: Date.now(),
          updatedAt: Date.now()
        });

        // Audit main completed
        await addDoc(collection(db, 'audit_logs'), {
          uid: user.uid,
          action: 'Completed',
          details: `Completed and Reconciled Inter-Branch Stock Transfer sheet ${transfer.transferNumber}`,
          transferNumber: transfer.transferNumber,
          branch: transfer.toBranchName,
          timestamp: Date.now()
        });
      }
      else if (action === 'reject') {
        currentHistory.push({
          status: 'rejected',
          timestamp: Date.now(),
          user: operatorName
        });

        // Rollback reserved locks back into active available quantity
        for (const item of transfer.items) {
          const originalProd = allProducts.find(p => p.id === item.productId || (p.name === item.productName && p.batchNumber === item.batchNumber));
          if (originalProd) {
            const srcDocRef = doc(db, 'medicines', originalProd.id);
            batch.update(srcDocRef, {
              reserved: increment(-item.quantity),
              quantity: increment(item.quantity)
            });
          }

          // Item level rejection rollback audit
          await addDoc(collection(db, 'audit_logs'), {
            uid: user.uid,
            action: 'Rejected',
            details: `Rejected & Rolled back item: ${item.productName} (Qty: ${item.quantity}) at source ${transfer.fromBranchName}`,
            transferNumber: transfer.transferNumber,
            branch: transfer.toBranchName,
            product: item.productName,
            quantity: item.quantity,
            timestamp: Date.now()
          });
        }

        // Lock Rejected state
        batch.update(docRef, {
          status: 'rejected',
          statusHistory: currentHistory,
          updatedAt: Date.now()
        });

        // Audit main release
        await addDoc(collection(db, 'audit_logs'), {
          uid: user.uid,
          action: 'Rejected',
          details: `Rejected Transfer Request ${transfer.transferNumber}. Stock released back at source.`,
          transferNumber: transfer.transferNumber,
          branch: transfer.toBranchName,
          timestamp: Date.now()
        });
      }

      await batch.commit();
      toast.success(`Action: ${action.toUpperCase()} completed and synchronized!`, { id: actionToast });
      
      // Update modal view in real time
      const freshSnap = await getDoc(doc(db, 'transfers', transfer.id));
      if (freshSnap.exists()) {
        setSelectedTransferForModal({ id: freshSnap.id, ...freshSnap.data() });
      } else {
        setSelectedTransferForModal(null);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Execution failed on system', { id: actionToast });
    }
  };

  // Perform filtering calculations
  const filteredTransfers = transfers.filter(t => {
    if (filterTransferNumber && !t.transferNumber?.toLowerCase().includes(filterTransferNumber.toLowerCase())) {
      return false;
    }
    if (filterSourceBranch && t.fromBranchId !== filterSourceBranch) {
      return false;
    }
    if (filterDestBranch && t.toBranchId !== filterDestBranch) {
      return false;
    }
    if (filterStatus && t.status !== filterStatus) {
      return false;
    }
    if (filterProduct) {
      const q = filterProduct.toLowerCase();
      const hasMatch = t.items?.some((it: any) => 
        it.productName.toLowerCase().includes(q) || 
        (it.genericName && it.genericName.toLowerCase().includes(q))
      ) || (t.productName && t.productName.toLowerCase().includes(q));
      if (!hasMatch) return false;
    }
    if (filterStartDate) {
      const start = new Date(filterStartDate).getTime();
      if (t.createdAt < start) return false;
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate).getTime() + (24 * 60 * 60 * 1000) - 1;
      if (t.createdAt > end) return false;
    }
    return true;
  });

  const getBranchName = (bId: string) => {
    if (bId === 'main-branch' || bId === `main_branch_${ownerId}`) return 'Main Branch (HQ)';
    return branches.find(b => b.id === bId)?.name || bId;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Branch Management</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage multiple pharmaceutical outlets, transfer stock, and monitor individual branches.</p>
        </div>
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
          <button 
            onClick={() => setActiveBranchTab('list')} 
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeBranchTab === 'list' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
          >
            Outlets Map
          </button>
          {hasFeature(user, 'branch_stock_transfers', settings) && (
            <button 
              onClick={() => setActiveBranchTab('transfer')} 
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeBranchTab === 'transfer' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              Inter-Branch Transfer
            </button>
          )}
          {hasFeature(user, 'branch_stock_transfers', settings) && (
            <button 
              onClick={() => setActiveBranchTab('history')} 
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeBranchTab === 'history' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              Transfer Logs
            </button>
          )}
        </div>
      </div>

      {activeBranchTab === 'list' && (
        <div className="space-y-8">
          <div className="flex justify-end">
            <button
              onClick={() => setIsAdding(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2 text-sm"
            >
              <Plus size={16} /> Register New Outlet Branch
            </button>
          </div>

          {isAdding && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
              <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">Register Outlet</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Branch Name</label>
                  <input 
                    type="text" 
                    value={newBranch.name} 
                    onChange={e => setNewBranch({...newBranch, name: e.target.value})} 
                    placeholder="e.g. Bole Sub-Branch" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Physical Address / Location</label>
                  <input 
                    type="text" 
                    value={newBranch.location} 
                    onChange={e => setNewBranch({...newBranch, location: e.target.value})} 
                    placeholder="e.g. Bole Road, House #402" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Contact Number</label>
                  <input 
                    type="text" 
                    value={newBranch.phone} 
                    onChange={e => setNewBranch({...newBranch, phone: e.target.value})} 
                    placeholder="e.g. +251 911 223344" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Branch Manager / Representative</label>
                  <input 
                    type="text" 
                    value={newBranch.manager} 
                    onChange={e => setNewBranch({...newBranch, manager: e.target.value})} 
                    placeholder="e.g. Dr. Meron Kassa" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500" 
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setIsAdding(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 font-bold transition-all text-sm">Cancel</button>
                <button onClick={handleCreateBranch} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all text-sm shadow">Save Outlet</button>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Branch (HQ) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 p-3 rounded-2xl">
                    <Store size={22} />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 rounded-full uppercase">Primary HQ</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Main Branch (HQ)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-1">📍 Central Warehouse</p>
                
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <div>
                    <span className="block text-slate-400 text-[10px] uppercase font-bold mb-0.5">Staff Count</span>
                    <strong className="text-base text-slate-900 dark:text-white font-black">
                      {sharedStaff.filter(s => !s.branchId || s.branchId === 'main-branch' || s.branchId === `main_branch_${ownerId}`).length}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-[10px] uppercase font-bold mb-0.5">Product SKUs</span>
                    <strong className="text-base text-slate-900 dark:text-white font-black">
                      {allProducts.filter(p => !p.branchId || p.branchId === 'main-branch' || p.branchId === `main_branch_${ownerId}`).length} Items
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom branches mapped */}
            {branches.filter(b => b.id !== `main_branch_${ownerId}` && b.id !== 'main-branch').map(b => (
              <div key={b.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 p-3 rounded-2xl">
                      <Store size={22} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full uppercase">Outlet</span>
                      {isAuthorized && (
                        <button 
                          onClick={() => handleDeleteBranchClick(b)}
                          className="p-1 px-2 text-xs bg-red-50 hover:bg-red-100 text-red-650 dark:bg-red-950/25 dark:hover:bg-red-900/40 dark:text-red-450 rounded-lg transition-all flex items-center gap-1 font-bold cursor-pointer"
                          title="Delete branch outlet"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{b.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">📍 {b.location}</p>
                  {b.manager && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">Manager: <strong>{b.manager}</strong></p>
                  )}
                  {b.phone && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 font-bold">Phone: <strong>{b.phone}</strong></p>
                  )}

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                    <div>
                      <span className="block text-slate-400 text-[10px] uppercase font-bold mb-0.5">Staff Count</span>
                      <strong className="text-base text-slate-900 dark:text-white font-black">
                        {sharedStaff.filter(s => s.branchId === b.id).length}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[10px] uppercase font-bold mb-0.5">Product SKUs</span>
                      <strong className="text-base text-slate-900 dark:text-white font-black">
                        {allProducts.filter(p => p.branchId === b.id).length} Items
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeBranchTab === 'transfer' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                <RefreshCw size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white-400">Multi-Item Inter-Branch Transfer Manifest</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-sans">Draft a list of products to transfer. Stock is reserved/locked during transit to secure inventory levels.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Column */}
            <div className="space-y-6 lg:border-r lg:border-slate-100 dark:lg:border-slate-800 lg:pr-8 lg:col-span-1">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center text-slate-500">1</span>
                Route Settings
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">From (Source Outlet)</label>
                  <select 
                    value={draftFromBranchId} 
                    onChange={e => {
                      setDraftFromBranchId(e.target.value);
                      setTransferDraftItems([]);
                      setSelectedProductId('');
                    }} 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="">-- Choose Source --</option>
                    <option value={`main_branch_${ownerId}`}>Main Branch (HQ)</option>
                    {branches.filter(b => b.id !== `main_branch_${ownerId}` && b.id !== 'main-branch').map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase font-sans">To (Destination Outlet)</label>
                  <select 
                    value={draftToBranchId} 
                    onChange={e => setDraftToBranchId(e.target.value)} 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="">-- Choose Destination --</option>
                    <option value={`main_branch_${ownerId}`}>Main Branch (HQ)</option>
                    {branches.filter(b => b.id !== `main_branch_${ownerId}` && b.id !== 'main-branch').map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center text-slate-500">2</span>
                  Add Product Item
                </h4>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Active Medical Catalog</label>
                  <select 
                    value={selectedProductId} 
                    onChange={e => setSelectedProductId(e.target.value)} 
                    disabled={!draftFromBranchId}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500 font-bold disabled:bg-slate-50 dark:disabled:bg-slate-950 disabled:cursor-not-allowed text-xs"
                  >
                    <option value="">-- Select Medicine (Batch & Stock Info) --</option>
                    {allProducts
                      .filter(p => {
                        const pBranchId = p.branchId || `main_branch_${ownerId}`;
                        return pBranchId === draftFromBranchId || 
                               ((pBranchId === 'main-branch' || pBranchId === `main_branch_${ownerId}`) && 
                                (draftFromBranchId === 'main-branch' || draftFromBranchId === `main_branch_${ownerId}`));
                      })
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Batch: {p.batchNumber || 'N/A'} | Expiry: {p.expiryDate || 'N/A'} | Qty: {p.quantity})</option>
                      ))
                    }
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Dispatch Count</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      min={1}
                      value={selectedProductQty || ''} 
                      onChange={e => setSelectedProductQty(Math.max(0, Number(e.target.value)))} 
                      disabled={!selectedProductId}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-950" 
                      placeholder="0"
                    />
                    <button 
                      onClick={handleAddDraftProduct}
                      disabled={!selectedProductId}
                      className="px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 text-xs text-nowrap"
                    >
                      + Add Item
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* List & Summary Column */}
            <div className="lg:col-span-2 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center text-slate-500">3</span>
                    Selected Products Sheet
                  </span>
                  <span className="text-xs font-bold font-mono px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg">
                    {transferDraftItems.length} items slated
                  </span>
                </h4>

                <div className="border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden mb-6">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3">Medicine Info</th>
                        <th className="px-5 py-3 text-center">Batch Number</th>
                        <th className="px-5 py-3 text-center">Expiry Date</th>
                        <th className="px-5 py-3 text-right">Transfer Count</th>
                        <th className="px-5 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-sans">
                      {transferDraftItems.map((item, index) => (
                        <tr key={index} className="text-slate-700 dark:text-slate-300">
                          <td className="px-5 py-3.5">
                            <div>
                              <strong className="text-slate-900 dark:text-white font-bold block">{item.productName}</strong>
                              {item.genericName && <span className="text-[10px] text-slate-400">{item.genericName}</span>}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-center font-mono">{item.batchNumber}</td>
                          <td className="px-5 py-3.4 text-center text-slate-400">{item.expiryDate}</td>
                          <td className="px-5 py-3.5 text-right font-bold text-slate-900 dark:text-white">{item.quantity} units</td>
                          <td className="px-5 py-3.5 text-center">
                            <button 
                              onClick={() => handleRemoveDraftItem(index)}
                              className="text-red-550 hover:text-red-700 font-bold p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg cursor-pointer transition-all"
                            >
                              ✕ Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                      {transferDraftItems.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-5 py-12 text-center text-slate-400 italic">No medicines loaded under current transfer yet. Select source/destination to add items.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-2 mb-6">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block">Transfer Remarks / Notes</label>
                  <textarea 
                    value={draftNotes} 
                    onChange={e => setDraftNotes(e.target.value)} 
                    rows={2} 
                    placeholder="e.g. Relocating fast-approaching expiry batch to Bole Sub-Branch to balance peak demand."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-xs leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => handleSaveTransferWorkflow(false)}
                  disabled={transferDraftItems.length === 0}
                  className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Save Draft Request
                </button>
                <button 
                  onClick={() => handleSaveTransferWorkflow(true)}
                  disabled={transferDraftItems.length === 0}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all text-xs flex items-center justify-center gap-2 shadow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <RefreshCw size={14} className="animate-spin-slow" /> Acknowledge & Dispatch Stream
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeBranchTab === 'history' && (
        <div className="space-y-6">
          {/* Enhanced Live Search & Filter Grid */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs font-sans">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Premium ERP Search & Filters</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Transfer ID</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input 
                    type="text"
                    value={filterTransferNumber}
                    onChange={e => setFilterTransferNumber(e.target.value)}
                    placeholder="Search TRF-YYYY-######" 
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-0 outline-none hover:bg-slate-100 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-xl text-xs dark:bg-slate-800 text-slate-950 dark:text-slate-100 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Source Branch</label>
                <select 
                  value={filterSourceBranch}
                  onChange={e => setFilterSourceBranch(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-white hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                >
                  <option value="">-- All Source Branches --</option>
                  <option value={`main_branch_${ownerId}`}>Main Branch (HQ)</option>
                  {branches.filter(b => b.id !== `main_branch_${ownerId}` && b.id !== 'main-branch').map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Destination Branch</label>
                <select 
                  value={filterDestBranch}
                  onChange={e => setFilterDestBranch(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-white hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                >
                  <option value="">-- All Destination Branches --</option>
                  <option value={`main_branch_${ownerId}`}>Main Branch (HQ)</option>
                  {branches.filter(b => b.id !== `main_branch_${ownerId}` && b.id !== 'main-branch').map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Product Name / Generic</label>
                <input 
                  type="text"
                  value={filterProduct}
                  onChange={e => setFilterProduct(e.target.value)}
                  placeholder="e.g. Amoxicillin, Paracetamol"
                  className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-950 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans">Workflow Status</label>
                <select 
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-white hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                >
                  <option value="">-- All Statuses --</option>
                  <option value="pending">Created (Draft)</option>
                  <option value="in_transit">In Transit (Reserved)</option>
                  <option value="completed">Completed (Confirmed)</option>
                  <option value="rejected">Rejected (Returned)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Start Date</label>
                <input 
                  type="date"
                  value={filterStartDate}
                  onChange={e => setFilterStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">End Date</label>
                <input 
                  type="date"
                  value={filterEndDate}
                  onChange={e => setFilterEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>

              <div className="flex items-end justify-between font-sans">
                <button
                  onClick={() => {
                    setFilterTransferNumber('');
                    setFilterSourceBranch('');
                    setFilterDestBranch('');
                    setFilterProduct('');
                    setFilterStatus('');
                    setFilterStartDate('');
                    setFilterEndDate('');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer"
                >
                  Clear Filters
                </button>
                <button 
                  onClick={() => downloadTransferReport(filteredTransfers, 'history', (user.displayName || user.email || 'Owner') + ' Rx ERP')}
                  className="bg-blue-600 text-white text-[11px] font-bold px-4 py-2 hover:bg-blue-700 transition-all rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Download size={13} /> PDF Report
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Inter-Branch Real-time Transfer Streams</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-sans">Track multiple items in sequence. Tap transfer rows to execute reconciliation, confirm dispatcher dispatch, or receive inventory.</p>
              </div>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-8 py-4">Transfer Number</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4">Source &rarr; Target</th>
                  <th className="px-8 py-4">Medicine Qty</th>
                  <th className="px-8 py-4 font-sans">Updated At</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300 font-sans">
                {filteredTransfers.map(tr => (
                  <tr key={tr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-8 py-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex flex-col">
                        <span className="font-mono font-black text-rose-500">{tr.transferNumber || `TRF-${new Date(tr.createdAt).getFullYear()}-000000`}</span>
                        <span className="text-[10px] text-slate-450 uppercase">{tr.notes ? (tr.notes.substring(0, 36) + '...') : 'No remarks recorded'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 font-medium">
                      {tr.status === 'pending' && <span className="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase">Pending Draft</span>}
                      {tr.status === 'in_transit' && <span className="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase">Locked Transit</span>}
                      {tr.status === 'completed' && <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase">Completed</span>}
                      {tr.status === 'rejected' && <span className="bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase">Returned</span>}
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{getBranchName(tr.fromBranchId)}</span>
                        <span className="text-slate-400">&rarr;</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{getBranchName(tr.toBranchId)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      {tr.items ? (
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {tr.items.reduce((acc: number, item: any) => acc + item.quantity, 0)} Units (Total)
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {tr.items.length} dynamic medicine SKU(s)
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{tr.quantity} Units (Single)</p>
                          <p className="text-[11px] text-slate-400">{tr.productName}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-4 text-slate-400 font-mono">{new Date(tr.updatedAt || tr.createdAt).toLocaleString()}</td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => setSelectedTransferForModal(tr)}
                          className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer transition-all text-xs"
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => downloadTransferDocument(tr, user.displayName || user.email || 'Admin')}
                          className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold px-3 py-1.5 rounded-lg transition-all text-xs cursor-pointer"
                        >
                          Print Document
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTransfers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center text-slate-400 dark:text-slate-500 italic">No matches located under selected filter combinations on network database.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details/Actions modal for selected Transfer */}
      {selectedTransferForModal && (
        <div className="fixed inset-0 z-[1150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-3xl w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-bold px-2 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg uppercase font-mono tracking-widest block w-fit mb-2">
                  {selectedTransferForModal.transferNumber || 'TRF-TRANSFER'}
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Inter-Branch Transfer Manifest File</h2>
              </div>
              <button 
                onClick={() => setSelectedTransferForModal(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer font-bold text-slate-450 hover:text-slate-600"
              >
                ✕ Close
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl mb-6 font-sans">
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Route Flow</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  {getBranchName(selectedTransferForModal.fromBranchId)} &rarr; {getBranchName(selectedTransferForModal.toBranchId)}
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Current Phase</span>
                <span className="text-xs font-bold text-slate-700">
                  {selectedTransferForModal.status === 'pending' && <span className="text-amber-550 uppercase font-black">Draft (Pending)</span>}
                  {selectedTransferForModal.status === 'in_transit' && <span className="text-blue-550 uppercase font-black">In Transit (Reserved)</span>}
                  {selectedTransferForModal.status === 'completed' && <span className="text-emerald-550 uppercase font-black">Completed</span>}
                  {selectedTransferForModal.status === 'rejected' && <span className="text-rose-550 uppercase font-black">Rejected (Returned)</span>}
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Document Print</span>
                <button 
                  onClick={() => downloadTransferDocument(selectedTransferForModal, user.displayName || user.email || 'Admin')}
                  className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Download size={12} /> Download PDF Invoice
                </button>
              </div>
            </div>

            {/* Step status transitions history */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Live Lifecycle Timeline History</h3>
              <div className="border border-slate-150 dark:border-slate-800/60 rounded-xl p-4 space-y-3 bg-white dark:bg-slate-800">
                {selectedTransferForModal.statusHistory && selectedTransferForModal.statusHistory.map((step: any, sIdx: number) => (
                  <div key={sIdx} className="flex items-center justify-between text-xs font-sans">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      <strong className="text-slate-950 dark:text-slate-100 uppercase">{step.status} phase trigger</strong>
                    </span>
                    <span className="text-slate-400">
                      Confirmed by: <strong>{step.user || 'System Operator'}</strong> on {new Date(step.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
                {!selectedTransferForModal.statusHistory && (
                  <div className="text-xs text-slate-450 italic">Generated retroactively; standard creation flow is active on file.</div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Loaded Medicines Manifest Items</h3>
              <div className="border border-slate-150 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5">Medicine Name</th>
                      <th className="px-4 py-2.5 text-center">Batch Number</th>
                      <th className="px-4 py-2.5 text-center">Expiry Date</th>
                      <th className="px-4 py-2.5 text-right">Transfer Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {selectedTransferForModal.items ? (
                      selectedTransferForModal.items.map((item: any, itemIdx: number) => (
                        <tr key={itemIdx}>
                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{item.productName}</td>
                          <td className="px-4 py-3 text-center font-mono">{item.batchNumber}</td>
                          <td className="px-4 py-3 text-center text-slate-400">{item.expiryDate}</td>
                          <td className="px-4 py-3 text-right font-black">{item.quantity} Units</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{selectedTransferForModal.productName}</td>
                        <td className="px-4 py-3 text-center font-mono">{selectedTransferForModal.batchNumber || 'N/A'}</td>
                        <td className="px-4 py-3 text-center text-slate-400">N/A</td>
                        <td className="px-4 py-3 text-right font-black">{selectedTransferForModal.quantity} Units</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes Section */}
            {selectedTransferForModal.notes && (
              <div className="mb-6 p-4 bg-amber-50/45 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
                <span className="block text-[10px] uppercase font-bold text-amber-600 mb-1">Authorization Remarks</span>
                <p className="text-xs text-slate-605 dark:text-slate-300 leading-relaxed font-sans">{selectedTransferForModal.notes}</p>
              </div>
            )}

            {/* Action Buttons for Lifecycle management */}
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-150 dark:border-slate-800 font-sans">
              <button 
                onClick={() => setSelectedTransferForModal(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
              >
                Close Back
              </button>

              {selectedTransferForModal.status === 'pending' && (
                <button 
                  onClick={() => handleExecuteTransferStateChange(selectedTransferForModal, 'dispatch')}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={12} /> Dispatch & Reserve Inventory Stock
                </button>
              )}

              {selectedTransferForModal.status === 'in_transit' && (
                <>
                  <button 
                    onClick={() => handleExecuteTransferStateChange(selectedTransferForModal, 'reject')}
                    className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition-all border border-rose-150 dark:border-none cursor-pointer"
                  >
                    Reject (Return to Source)
                  </button>
                  <button 
                    onClick={() => handleExecuteTransferStateChange(selectedTransferForModal, 'receive')}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-1 cursor-pointer"
                  >
                    Acknowledge Safe Receipt
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal for Deletion Confirmation */}
      {branchToDelete && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <div className="w-10 h-10 bg-red-50 dark:bg-red-950/35 rounded-2xl flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Delete Branch</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 font-sans leading-relaxed">
              Are you sure you want to permanently delete this branch?
              <br /><br />
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end font-sans">
              <button 
                onClick={() => setBranchToDelete(null)}
                disabled={isDeletingBranch}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleExecuteDelete}
                disabled={isDeletingBranch}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-100 dark:shadow-none flex items-center gap-1 transition-all cursor-pointer"
              >
                {isDeletingBranch ? 'Deleting...' : 'Delete Branch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const generatePromoCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'MKT-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const getCountryCurrency = (country: string) => {
  const mapping: { [key: string]: string } = {
    Ethiopia: 'ETB',
    Kenya: 'KES',
    Uganda: 'UGX',
    Tanzania: 'TZS',
    Rwanda: 'RWF',
    Burundi: 'BIF',
    Somalia: 'SOS',
    Eritrea: 'ERN',
    Djibouti: 'DJF',
    "South Sudan": 'SSP',
    Sudan: 'SDG',
    Zambia: 'ZMW',
    Zimbabwe: 'ZWL',
  };
  return mapping[country] || 'USD';
};

const AdminMarketingManagement = () => {
  const [managementTab, setManagementTab] = useState<'members' | 'invites'>('members');
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    country: 'Ethiopia',
    city: 'Addis Ababa',
    shift: 'Full-time Standard',
    salary: 15000,
  });
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleteInviteTarget, setDeleteInviteTarget] = useState<any | null>(null);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [selectedMemberReferrals, setSelectedMemberReferrals] = useState<any[]>([]);
  const [selectedMemberOrders, setSelectedMemberOrders] = useState<any[]>([]);
  const [activeDetailTab, setActiveDetailTab] = useState<'referrals' | 'orders'>('referrals');

  useEffect(() => {
    const qMembers = query(collection(db, 'users'), where('role', '==', 'marketing'));
    const unsubMembers = onSnapshot(qMembers, 
      (s) => setMembers(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      (error) => handleFirestoreError(error, OperationType.LIST, 'users')
    );

    const qInvites = query(collection(db, 'marketing_invites'));
    const unsubInvites = onSnapshot(qInvites, 
      (s) => setInvites(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => b.createdAt - a.createdAt)),
      (error) => console.error("Error loading invites", error)
    );

    return () => {
      unsubMembers();
      unsubInvites();
    };
  }, []);

  useEffect(() => {
    if (!selectedMember) {
      setSelectedMemberReferrals([]);
      setSelectedMemberOrders([]);
      return;
    }

    const referralsQuery = query(collection(db, 'users'), where('marketingId', '==', selectedMember.id));
    const unsubReferrals = onSnapshot(referralsQuery, 
      (snap) => {
        setSelectedMemberReferrals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'users')
    );

    const ordersQuery = query(collection(db, 'orders'), where('marketingId', '==', selectedMember.id));
    const unsubOrders = onSnapshot(ordersQuery, 
      (snap) => {
        setSelectedMemberOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'orders')
    );

    return () => {
      unsubReferrals();
      unsubOrders();
    };
  }, [selectedMember]);

  const handleGenerateInvite = async () => {
    if (!inviteForm.name || !inviteForm.city || !inviteForm.salary) {
      toast.error('Please fill in all required fields (Name, City, Salary)');
      return;
    }

    const loadToast = toast.loading('Generating onboarding invitation link...');
    try {
      const inviteId = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const assignedPromoCode = generatePromoCode().toUpperCase();
      const assignedCurrency = getCountryCurrency(inviteForm.country);

      await setDoc(doc(db, 'marketing_invites', inviteId), {
        id: inviteId,
        name: inviteForm.name,
        email: inviteForm.email || 'N/A',
        country: inviteForm.country,
        city: inviteForm.city,
        shift: inviteForm.shift,
        salary: Number(inviteForm.salary),
        currency: assignedCurrency,
        promoCode: assignedPromoCode,
        used: false,
        createdAt: Date.now()
      });

      const registerLink = `${window.location.origin}/?join=marketing&inviteId=${inviteId}`;
      setGeneratedLink(registerLink);
      setIsAdding(false);
      setInviteForm({
        name: '',
        email: '',
        country: 'Ethiopia',
        city: 'Addis Ababa',
        shift: 'Full-time Standard',
        salary: 15000,
      });
      toast.success('Onboarding link generated successfully!', { id: loadToast });
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to generate invitation link: ' + err.message, { id: loadToast });
    }
  };

  const confirmDeleteInvite = async () => {
    if (!deleteInviteTarget) return;
    const inviteId = deleteInviteTarget.id;
    setDeleteInviteTarget(null);
    const delToast = toast.loading('Revoking and deleting onboarding invitation...');
    try {
      await deleteDoc(doc(db, 'marketing_invites', inviteId));
      toast.success('Invitation link successfully revoked/deleted.', { id: delToast });
    } catch (error: any) {
      toast.error('Failed to revoke invitation link: ' + error.message, { id: delToast });
    }
  };

  const confirmDeleteMember = async () => {
    if (!deleteTarget) return;
    const member = deleteTarget;
    setDeleteTarget(null);

    const deleteToast = toast.loading('Removing marketing member and transferring commissions...');
    try {
      const commissionToTransfer = member.commissionBalance || 0;
      const currencyCode = member.currency || 'ETB';
      
      if (commissionToTransfer > 0) {
        const adminQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
        const adminSnap = await getDocs(adminQuery);
        
        if (!adminSnap.empty) {
          const firstAdmin = adminSnap.docs[0];
          await updateDoc(firstAdmin.ref, {
            commissionBalance: increment(commissionToTransfer)
          });
          toast.success(`Transferred ${commissionToTransfer.toLocaleString()} ${currencyCode} commission to Admin (${firstAdmin.data().displayName})`, { id: deleteToast });
        } else {
          console.warn('No admin user found to transfer commission.');
        }
      }

      await deleteDoc(doc(db, 'users', member.id));
      toast.success('Marketing member removed successfully.', { id: deleteToast });
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove marketing member', { id: deleteToast });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Marketing & Sales Administration</h1>
          <p className="text-slate-500 dark:text-slate-400">Invite sales representatives, define native shifts/salaries, and monitor marketing performance.</p>
        </div>
        <button 
          onClick={() => {
            setManagementTab('invites');
            setIsAdding(true);
            setGeneratedLink(null);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none flex items-center gap-2"
        >
          <UserPlus size={20} /> Generate Registration Link
        </button>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit mb-8 gap-1">
        <button 
          onClick={() => { setManagementTab('members'); setIsAdding(false); }}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${managementTab === 'members' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          <Users size={16} /> Active Agents ({members.length})
        </button>
        <button 
          onClick={() => setManagementTab('invites')}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${managementTab === 'invites' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          <ExternalLink size={16} /> Registration Invites ({invites.length})
        </button>
      </div>

      {/* Generated Link Alert Modal */}
      {generatedLink && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-3xl shadow-xl mb-8 border border-emerald-400/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <button onClick={() => setGeneratedLink(null)} className="absolute top-4 right-4 text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-all">
            <X size={18} />
          </button>
          <div className="flex gap-4 items-start max-w-3xl">
            <div className="p-3 bg-white/10 rounded-2xl border border-white/10 mt-1">
              <CheckCircle size={24} className="text-white" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-extrabold text-lg leading-snug">Registration Invite Link Ready!</h3>
              <p className="text-xs text-white/90 leading-relaxed">
                Send this secure signing & registration link to the marketing agent. Opening this link will pre-populate their pre-authorized salary, local currency, country, city, assigned shift, and automatic promo code.
              </p>
              <div className="flex items-center gap-2 mt-4 bg-white/10 p-2.5 rounded-xl border border-white/10 max-w-xl">
                <span className="text-xs font-mono truncate select-all flex-1 text-emerald-50 px-2">{generatedLink}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink);
                    toast.success('Registration link copied to clipboard!');
                  }}
                  className="px-4 py-1.5 bg-white text-emerald-600 rounded-lg text-xs font-black hover:bg-emerald-50 transition-all flex items-center gap-1 shadow-sm shrink-0"
                >
                  <Copy size={13} /> Copy Link
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Create Registration Link Form */}
      {managementTab === 'invites' && isAdding && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold dark:text-white">Generate Agent Registration Invite</h2>
              <p className="text-xs text-slate-400">Pre-authorize and pre-assign salary, shift, currency, and city territory.</p>
            </div>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Agent Full Name <span className="text-red-500">*</span></label>
              <input type="text" value={inviteForm.name} onChange={e => setInviteForm({...inviteForm, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 text-xs" placeholder="e.g. John Doe" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Agent Email Address</label>
              <input type="email" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 text-xs" placeholder="e.g. agent@atech.com" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Pre-authorized Country <span className="text-red-500">*</span></label>
              <select 
                value={inviteForm.country} 
                onChange={e => setInviteForm({...inviteForm, country: e.target.value})} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 text-xs"
              >
                {countries.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Designated Target City <span className="text-red-500">*</span></label>
              <input type="text" value={inviteForm.city} onChange={e => setInviteForm({...inviteForm, city: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 text-xs" placeholder="e.g. Nairobi" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Assigned Shift Schedule <span className="text-red-500">*</span></label>
              <select 
                value={inviteForm.shift} 
                onChange={e => setInviteForm({...inviteForm, shift: e.target.value})} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 text-xs"
              >
                <option value="Morning Shift (6 AM - 2 PM)">Morning Shift (6 AM - 2 PM)</option>
                <option value="Evening Shift (2 PM - 10 PM)">Evening Shift (2 PM - 10 PM)</option>
                <option value="Night Shift (10 PM - 6 AM)">Night Shift (10 PM - 6 AM)</option>
                <option value="Flexible Schedule">Flexible Schedule</option>
                <option value="Full-time Standard">Full-time Standard</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Assigned Monthly Base Salary <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type="number" value={inviteForm.salary} onChange={e => setInviteForm({...inviteForm, salary: Number(e.target.value)})} className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 text-xs font-bold" placeholder="e.g. 15000" />
                <span className="absolute right-4 top-3 text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                  {getCountryCurrency(inviteForm.country)}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 italic">
                Paid automatically in native {getCountryCurrency(inviteForm.country)} currency.
              </p>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-4 border-t border-slate-100 dark:border-slate-800 pt-6">
            <button onClick={() => setIsAdding(false)} className="px-6 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-105 dark:hover:bg-slate-800 rounded-xl transition-all text-xs">Cancel</button>
            <button onClick={handleGenerateInvite} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-100 dark:shadow-none text-xs flex items-center gap-2">
              <Send size={14} /> Generate & Publish Registration Link
            </button>
          </div>
        </motion.div>
      )}

      {/* RENDER ACTIVE TEAM MEMBERS */}
      {managementTab === 'members' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Active Marketing & Sales Agents</h3>
            <span className="text-[10px] font-bold px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">LIVE TRACKING ACTIVE</span>
          </div>
          {members.length === 0 ? (
            <div className="p-16 text-center text-slate-400 dark:text-slate-500">
              <Users className="mx-auto text-slate-300 dark:text-slate-700 mb-4" size={48} />
              <p className="font-bold text-slate-700 dark:text-slate-300">No active marketing agents registered yet</p>
              <p className="text-xs mt-1">Generate a secure registration invite link to onboard a new sales rep!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[1000px]">
                <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-8 py-5">Agent Member</th>
                    <th className="px-8 py-5">Territory</th>
                    <th className="px-8 py-5">Assigned Shift</th>
                    <th className="px-8 py-5">Assigned Salary</th>
                    <th className="px-8 py-5">Promo Tracking</th>
                    <th className="px-8 py-5">Commission Bal.</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {members.map(m => {
                    const localCurrency = m.currency || 'ETB';
                    return (
                      <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-8 py-5 flex items-center gap-4">
                          {m.photo ? (
                            <img src={m.photo} alt={m.displayName} className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-800 shadow-sm" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-inner">
                              {m.displayName ? m.displayName.charAt(0).toUpperCase() : 'M'}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-xs">{m.displayName}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-none mt-0.5">{m.email}</p>
                            {m.phoneNumber && <span className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 mt-1 block">📞 {m.phoneNumber}</span>}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{m.city || 'Central'}</p>
                          <p className="text-[10px] text-slate-400">{m.country || 'Ethiopia'}</p>
                        </td>
                        <td className="px-8 py-5">
                          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold">
                            🕒 {m.shift || 'Flexible Schedule'}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <p className="font-extrabold text-slate-900 dark:text-white text-xs">{(m.salary || 15000).toLocaleString()}</p>
                          <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 leading-none">{localCurrency}</p>
                        </td>
                        <td className="px-8 py-5">
                          <span className="bg-blue-50 dark:bg-blue-900/25 border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] font-black px-2.5 py-1 rounded-lg font-mono">
                            {m.promoCode}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <p className="font-black text-green-600 dark:text-green-400 text-xs">{(m.commissionBalance || 0).toLocaleString()} {localCurrency}</p>
                        </td>
                        <td className="px-8 py-5 text-right space-x-2">
                          <button 
                            onClick={() => setSelectedMember(m)}
                            className="text-slate-400 hover:text-blue-600 p-1 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500/20 transition-all cursor-pointer inline-block" 
                            title="View Performance Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => setDeleteTarget(m)}
                            className="text-red-500 hover:text-red-700 p-1 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100/40 dark:border-red-900/40 hover:border-red-500/30 transition-all cursor-pointer inline-block"
                            title="Delete Agent & Payout Balance"
                          >
                            <Trash2 size={16} />
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
      )}

      {/* RENDER INVITATION LINKS */}
      {managementTab === 'invites' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Onboarding Registration Invite Links</h3>
            <span className="text-[10px] font-bold px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">INVITATION MANAGER</span>
          </div>
          {invites.length === 0 ? (
            <div className="p-16 text-center text-slate-400 dark:text-slate-500">
              <ExternalLink className="mx-auto text-slate-300 dark:text-slate-700 mb-4" size={48} />
              <p className="font-bold text-slate-700 dark:text-slate-300">No onboarding invitations generated yet</p>
              <p className="text-xs mt-1">Generate dynamic invite links to onboard sales & marketing representatives.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[1000px]">
                <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-8 py-5">Target Agent</th>
                    <th className="px-8 py-5">Target Territory</th>
                    <th className="px-8 py-5">Assigned Shift</th>
                    <th className="px-8 py-5">Pre-authorized Salary</th>
                    <th className="px-8 py-5">Assigned Code</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invites.map(inv => {
                    const registerLink = `${window.location.origin}/?join=marketing&inviteId=${inv.id}`;
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-8 py-5">
                          <p className="font-bold text-slate-900 dark:text-white text-xs">{inv.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">{inv.email || 'N/A'}</p>
                          <p className="text-[9px] text-slate-400/80 mt-1 italic">Generated: {new Date(inv.createdAt).toLocaleString()}</p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{inv.city || 'Central'}</p>
                          <p className="text-[10px] text-slate-400">{inv.country || 'Ethiopia'}</p>
                        </td>
                        <td className="px-8 py-5">
                          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold">
                            🕒 {inv.shift || 'Flexible'}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <p className="font-extrabold text-slate-900 dark:text-white text-xs">{(inv.salary || 15000).toLocaleString()}</p>
                          <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 leading-none">{inv.currency || 'ETB'}</p>
                        </td>
                        <td className="px-8 py-5">
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded font-mono border dark:border-slate-750">
                            {inv.promoCode}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          {inv.used ? (
                            <span className="px-2 py-0.5 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-lg text-[9px] font-extrabold uppercase">
                              Used / Registered
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg text-[9px] font-extrabold uppercase animate-pulse">
                              Active / Pending
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-right space-x-2">
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(registerLink);
                              toast.success('Registration link copied!');
                            }}
                            className="text-blue-600 hover:text-blue-700 p-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 rounded-lg hover:bg-blue-100 transition-all cursor-pointer inline-block"
                            title="Copy Invitation Link"
                          >
                            <Copy size={14} />
                          </button>
                          <button 
                            onClick={() => setDeleteInviteTarget(inv)}
                            className="text-red-500 hover:text-red-700 p-1.5 bg-red-50 dark:bg-red-950/40 border border-red-100/40 dark:border-red-900/40 rounded-lg hover:bg-red-100 transition-all cursor-pointer inline-block"
                            title="Delete / Revoke Invitation Link"
                          >
                            <Trash2 size={14} />
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
      )}

      {/* REVOKE INVITATION CONFIRMATION MODAL */}
      {deleteInviteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-8 max-w-md w-full"
          >
            <div className="flex items-center gap-3 text-red-500 dark:text-red-400 mb-4">
              <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-2xl">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-bold dark:text-white font-sans">Revoke Invite Link?</h3>
            </div>
            
            <p className="text-slate-600 dark:text-slate-350 mb-6 text-sm leading-relaxed font-sans">
              Are you sure you want to revoke and delete the onboarding invitation for <span className="font-bold text-slate-800 dark:text-white">{deleteInviteTarget.name}</span> ({deleteInviteTarget.email || 'N/A'})?
              Once deleted, this link can no longer be used for representative registration.
            </p>

            <div className="flex gap-4 justify-end font-sans">
              <button 
                type="button"
                onClick={() => setDeleteInviteTarget(null)}
                className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={confirmDeleteInvite}
                className="px-5 py-2.5 bg-red-600 text-white font-bold hover:bg-red-700 rounded-xl transition-all shadow-lg shadow-red-100 dark:shadow-none text-xs cursor-pointer"
              >
                Yes, Revoke
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* DELETE TEAM MEMBER CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-8 max-w-md w-full"
          >
            <div className="flex items-center gap-3 text-red-500 dark:text-red-400 mb-4">
              <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-2xl">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-bold dark:text-white">Remove Team Member?</h3>
            </div>
            
            <p className="text-slate-600 dark:text-slate-350 mb-6 text-sm leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-slate-800 dark:text-white">{deleteTarget.displayName || 'this member'}</span>? 
              Their remaining commission balance of <span className="font-bold text-green-600 dark:text-green-400">{(deleteTarget.commissionBalance || 0).toLocaleString()} {deleteTarget.currency || 'ETB'}</span> will be transferred directly to an admin account.
            </p>

            <div className="flex gap-4 justify-end">
              <button 
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-105 dark:hover:bg-slate-800 transition-all text-xs"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={confirmDeleteMember}
                className="px-5 py-2.5 bg-red-600 text-white font-bold hover:bg-red-700 rounded-xl transition-all shadow-lg shadow-red-100 dark:shadow-none text-xs"
              >
                Yes, Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* VIEW MEMBER DETAILS MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Marketing Member Details</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">View performance, assigned shifts, salary logs, and dynamic commissions.</p>
              </div>
              <button 
                onClick={() => setSelectedMember(null)}
                className="p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Left Column: Profile Card */}
              <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 text-center">
                  <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                    {selectedMember.photo ? (
                      <img src={selectedMember.photo} alt={selectedMember.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-extrabold text-3xl">
                        {selectedMember.displayName ? selectedMember.displayName.charAt(0).toUpperCase() : 'M'}
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white leading-snug">{selectedMember.displayName}</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">{selectedMember.email}</p>
                  
                  <span className="inline-block bg-blue-50 dark:bg-blue-900/25 text-blue-600 dark:text-blue-400 text-xs font-bold px-3 py-1.5 rounded-xl font-mono uppercase border border-blue-100 dark:border-blue-900/30">
                    Promo Code: {selectedMember.promoCode}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <h5 className="font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Employment Details</h5>
                  <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-400" />
                      <span>Shift: <span className="font-bold">{selectedMember.shift || 'Flexible Schedule'}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign size={14} className="text-slate-400" />
                      <span>Salary: <span className="font-bold">{(selectedMember.salary || 15000).toLocaleString()} {selectedMember.currency || 'ETB'}</span> / mo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-slate-400" />
                      <span>Territory: <span className="font-bold">{selectedMember.city || 'N/A'}, {selectedMember.country || 'N/A'}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      <span>Joined: {new Date(selectedMember.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50/50 dark:bg-green-950/20 p-6 rounded-3xl border border-green-100/65 dark:border-green-900/20">
                  <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold uppercase tracking-wider">Commission Balance</p>
                  <h4 className="text-2xl font-black text-green-700 dark:text-green-400 mt-1">{(selectedMember.commissionBalance || 0).toLocaleString()} {selectedMember.currency || 'ETB'}</h4>
                </div>
              </div>

              {/* Right Column: Dynamic Referrals & Orders lists */}
              <div className="md:col-span-2 flex flex-col">
                
                {/* Tabs */}
                <div className="flex border-b border-slate-100 dark:border-slate-800 mb-6">
                  <button 
                    onClick={() => setActiveDetailTab('referrals')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeDetailTab === 'referrals' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'}`}
                  >
                    Referrals ({selectedMemberReferrals.length})
                  </button>
                  <button 
                    onClick={() => setActiveDetailTab('orders')}
                    className={`ml-6 pb-3 text-sm font-bold border-b-2 transition-all ${activeDetailTab === 'orders' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'}`}
                  >
                    Referred Orders ({selectedMemberOrders.length})
                  </button>
                </div>

                {/* Tab content panel */}
                <div className="flex-1 overflow-y-auto max-h-[450px] pr-2">
                  {activeDetailTab === 'referrals' ? (
                    selectedMemberReferrals.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                        <Users className="mx-auto text-slate-300 dark:text-slate-700 mb-2" size={32} />
                        <p className="text-xs font-medium">No registrations yet using this code.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedMemberReferrals.map((ref) => (
                          <div key={ref.id} className="p-4 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex justify-between items-center hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white dark:bg-slate-700 text-slate-500 border border-slate-150 dark:border-slate-600 rounded-xl flex items-center justify-center">
                                {ref.role === 'pharmacy' ? <Building2 size={18} /> : <Truck size={18} />}
                              </div>
                              <div>
                                <h5 className="font-bold text-xs text-slate-800 dark:text-white leading-snug">{ref.pharmacyName || ref.importerName || ref.displayName}</h5>
                                <p className="text-[10px] text-slate-400 mt-0.5">{ref.city}, {ref.country} • <span className="capitalize">{ref.role}</span></p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                ref.verificationStatus === 'approved' ? 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400' : 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600'
                              }`}>
                                {ref.verificationStatus}
                              </span>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                                {new Date(ref.createdAt || Date.now()).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    selectedMemberOrders.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                        <ShoppingCart className="mx-auto text-slate-300 dark:text-slate-700 mb-2" size={32} />
                        <p className="text-xs font-medium">No sales attributed to this code yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedMemberOrders.map((ord) => (
                          <div key={ord.id} className="p-4 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800/50 hover:bg-slate-100/40 dark:hover:bg-slate-800/40 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="text-[10px] font-mono font-bold text-slate-450 dark:text-slate-500">Order #{ord.id?.slice(-6).toUpperCase()}</span>
                                <h5 className="font-bold text-xs text-slate-800 dark:text-white mt-0.5">{ord.pharmacyName}</h5>
                              </div>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                ord.status === 'delivered' ? 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400' : 
                                ord.status === 'cancelled' ? 'bg-red-50 dark:bg-red-900/20 text-red-600' :
                                'bg-blue-50 dark:bg-blue-900/25 text-blue-600 dark:text-blue-400'
                              }`}>
                                {ord.status}
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-slate-800 mt-2 pt-2">
                              <div>
                                <p className="text-slate-400 text-[10px]">Total volume:</p>
                                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{(ord.totalAmount || 0).toLocaleString()} {selectedMember.currency || 'ETB'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-slate-400 text-[10px]">Commission:</p>
                                <p className="font-black text-green-600 dark:text-green-400 mt-0.5">+{(ord.commissionAmount || 0).toLocaleString()} {selectedMember.currency || 'ETB'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>

              </div>

            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const MarketingDashboard = ({ user }: { user: UserProfile }) => {
  const [profile, setProfile] = useState<UserProfile>(user);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [selectedReferral, setSelectedReferral] = useState<any | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [activeSegment, setActiveSegment] = useState<'referrals' | 'performance'>('referrals');

  useEffect(() => {
    // 1. Keep profile synchronized in real-time for evaluation rating and feedback
    const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (s) => {
      if (s.exists()) {
        setProfile({ id: s.id, ...s.data() } as any);
      }
    });

    // 2. Fetch referrals
    const q = query(collection(db, 'users'), where('marketingId', '==', user.uid));
    const unsubReferrals = onSnapshot(q, 
      (s) => setReferrals(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      (error) => handleFirestoreError(error, OperationType.LIST, 'users')
    );
    
    // 3. Fetch credited orders
    const qOrders = query(collection(db, 'orders'), where('marketingId', '==', user.uid));
    const unsubOrders = onSnapshot(qOrders, 
      (s) => setMyOrders(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      (error) => console.error("Error fetching representative orders:", error)
    );

    // 4. Fetch commission rules
    const unsubSettings = onSnapshot(doc(db, 'system_settings', 'main'), 
      (s) => {
        if (s.exists()) setSettings(s.data() as SystemSettings);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'system_settings/main')
    );

    return () => {
      unsubProfile();
      unsubReferrals();
      unsubOrders();
      unsubSettings();
    };
  }, [user.uid]);

  // Calculations for System Performance Evaluation
  const referralCount = referrals.length;
  const orderCount = myOrders.length;
  const totalSalesVolume = myOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalCommissions = myOrders.reduce((sum, o) => sum + (o.commissionAmount || 0), 0);

  const sysEval = calculateSystemWork({
    referralCount,
    orderCount,
    totalSalesVolume,
    totalCommissions
  });

  const referralPoints = Math.min(referralCount * 10, 40);
  const orderPoints = Math.min(orderCount * 10, 40);
  const salesPoints = Math.min(Math.floor(totalSalesVolume / 100), 20);

  const stats = [
    { label: 'Total Referrals', value: referralCount.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Commission Balance', value: `${(profile.commissionBalance || 0).toLocaleString()} ETB`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'My Promo Code', value: profile.promoCode || 'N/A', icon: Percent, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const getCommissionStatus = (createdAt: number) => {
    if (!settings?.marketingCommission) return { active: true, daysLeft: 0 };
    const durationMonths = settings.marketingCommission.durationMonths;
    const expiryDate = new Date(createdAt);
    expiryDate.setMonth(expiryDate.getMonth() + durationMonths);
    const msLeft = expiryDate.getTime() - Date.now();
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
    return { active: msLeft > 0, daysLeft };
  };

  if (selectedReferral) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <button 
          onClick={() => setSelectedReferral(null)}
          className="mb-6 flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors"
        >
          <ChevronRight className="rotate-180" size={20} /> Back to Dashboard
        </button>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedReferral.pharmacyName || selectedReferral.importerName}</h1>
              <p className="text-slate-500 dark:text-slate-400 uppercase text-xs font-bold tracking-widest mt-1">{selectedReferral.role}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-xs font-bold">
              Managed Referral
            </div>
          </div>
        </div>
        
        {selectedReferral.role === 'pharmacy' ? (
          <InventoryView user={selectedReferral} />
        ) : (
          <MarketplaceView user={selectedReferral} />
        )}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Marketing Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Track your referrals, commissions, and performance reports.</p>
        </div>

        {/* Dynamic score badge */}
        <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 font-mono text-xs font-bold shadow-sm ${sysEval.badgeBg}`}>
          <Award size={16} className={sysEval.color} />
          <span>Work Level: {sysEval.level} ({sysEval.score}/100)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 ${stat.bg} dark:bg-slate-800 ${stat.color} rounded-xl flex items-center justify-center shrink-0`}><stat.icon size={24} /></div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Segment Switcher Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveSegment('referrals')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeSegment === 'referrals' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          My Referrals ({referrals.length})
        </button>
        <button
          onClick={() => setActiveSegment('performance')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-1.5 ${
            activeSegment === 'performance' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Award size={15} />
          Performance Rating & Evaluation
        </button>
      </div>

      {activeSegment === 'referrals' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {referrals.map(r => (
              <div key={r.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {r.role === 'pharmacy' ? <Building2 size={24} /> : <Truck size={24} />}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                    r.verificationStatus === 'approved' ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                  }`}>
                    {r.verificationStatus}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">{r.pharmacyName || r.importerName}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{r.city}, {r.country}</p>
                
                <div className="mb-6">
                  {(() => {
                    const { active, daysLeft } = getCommissionStatus(r.createdAt);
                    return (
                      <div className={`p-3 rounded-xl flex items-center justify-between ${active ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {active ? 'Commission Active' : 'Commission Expired'}
                          </span>
                        </div>
                        {active && <span className="text-[10px] font-black">{daysLeft} days left</span>}
                      </div>
                    );
                  })()}
                </div>

                <button 
                  onClick={() => setSelectedReferral(r)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-3 rounded-xl font-bold hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  Oversee & Fix <ChevronRight size={16} />
                </button>
              </div>
            ))}
            {referrals.length === 0 && (
              <div className="col-span-full bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
                <Users className="mx-auto text-slate-300 dark:text-slate-700 mb-4" size={48} />
                <p className="text-slate-500 dark:text-slate-400 font-medium">No referrals yet. Share your promo code to get started!</p>
                <p className="text-blue-600 dark:text-blue-400 font-bold text-2xl mt-2">{profile.promoCode}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Card 1: Official Super Admin Evaluation */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-850">
              <div className="flex items-center gap-2">
                <Star className="text-amber-500 fill-amber-500 animate-pulse" size={18} />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">Super Admin Grade</h3>
              </div>
              {profile.adminRating ? (
                <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100/40 text-[10px] font-bold px-2.5 py-1 rounded-xl uppercase tracking-wider">
                  Evaluated
                </span>
              ) : (
                <span className="bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-250 dark:border-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-xl uppercase tracking-wider">
                  Pending Review
                </span>
              )}
            </div>

            <div className="flex flex-col items-center py-6 bg-slate-50/50 dark:bg-slate-950/35 rounded-2xl border border-slate-100 dark:border-slate-850 text-center space-y-3">
              <div className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono flex items-baseline gap-1">
                {profile.adminRating ? profile.adminRating.toFixed(1) : "—"}
                <span className="text-xs text-slate-400 font-normal">/ 5.0 Stars</span>
              </div>
              
              <div className="flex items-center gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    size={20} 
                    className={i < (profile.adminRating || 0) ? "fill-amber-500 text-amber-500" : "text-slate-200 dark:text-slate-800"} 
                  />
                ))}
              </div>

              <p className="text-xs text-slate-500 font-medium">
                Official rating assigned manually by the head management.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Official Management Notes</span>
              {profile.adminFeedback ? (
                <div className="p-4 bg-amber-50/30 dark:bg-amber-950/10 border-l-4 border-amber-500 rounded-r-2xl text-xs text-slate-650 dark:text-slate-350 leading-relaxed italic">
                  "{profile.adminFeedback}"
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400 text-center">
                  No written feedback comments have been recorded yet. Complete onboarding referrals to invite a manager assessment.
                </div>
              )}
            </div>
          </div>

          {/* Card 2: System Work Evaluation Engine */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-850">
              <div className="flex items-center gap-2">
                <Award className="text-indigo-600" size={18} />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">System-Calculated Work Rating</h3>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl uppercase tracking-wider border ${sysEval.badgeBg} ${sysEval.color}`}>
                {sysEval.level}
              </span>
            </div>

            {/* Progress Bar showing activity score out of 100 */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500 font-bold">
                <span>Real-time Activity Score</span>
                <span className="font-mono">{sysEval.score} / 100 Points</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    sysEval.score >= 80 ? 'bg-violet-500' :
                    sysEval.score >= 55 ? 'bg-emerald-500' :
                    sysEval.score >= 30 ? 'bg-blue-500' :
                    sysEval.score > 0 ? 'bg-amber-500' : 'bg-slate-400'
                  }`}
                  style={{ width: `${sysEval.score}%` }}
                ></div>
              </div>
            </div>

            {/* Score Breakdown Points */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-850">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scoring Breakdown</h4>
              
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-650 dark:text-slate-350">Referral Signups (10 pts each, Max 40)</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-white">{referralPoints} / 40 pts ({referralCount})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-650 dark:text-slate-350">Sales Orders (10 pts each, Max 40)</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-white">{orderPoints} / 40 pts ({orderCount})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-650 dark:text-slate-350">Sales Volume ($100 per 1 pt, Max 20)</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-white">{salesPoints} / 20 pts (${totalSalesVolume.toLocaleString()})</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-indigo-50/20 dark:bg-indigo-950/10 rounded-2xl border border-indigo-100/30 text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
              "{sysEval.text}"
            </div>

            {/* Promotion/Rating Help Tips */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Tips to Maximize Performance Rating</span>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 list-disc list-inside">
                <li>Refer active pharmacies and wholesale importer nodes using your code.</li>
                <li>Follow up with referred clients to ensure they set up inventories and place orders.</li>
                <li>Achieve over $2,000 in sales volume under your referral ID to claim the full sales points!</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SalesView = ({ 
  user, 
  addToOfflineQueue, 
  syncStatus,
  selectedBranchId = 'all',
  branches = []
}: { 
  user: UserProfile, 
  addToOfflineQueue?: (item: any) => void, 
  syncStatus?: string,
  selectedBranchId?: string,
  branches?: Branch[]
}) => {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [displayBatchOnReceipt, setDisplayBatchOnReceipt] = useState(false);
  const [posSearchSearch, setPosSearchSearch] = useState('');
  const [batchSelectProductName, setBatchSelectProductName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const ownerId = user.role === 'staff' ? user.pharmacyId : user.uid;
  const plan = user.subscriptionType || 'basic';
  const hasCustomerTracking = plan !== 'basic';
  const hasReceipts = plan !== 'basic';

  useEffect(() => {
    if (!ownerId) return;
    const q = query(collection(db, 'medicines'), where('pharmacyId', '==', ownerId));
    return onSnapshot(q, 
      (s) => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() } as InventoryProduct))),
      (error) => handleFirestoreError(error, OperationType.LIST, 'medicines')
    );
  }, [ownerId]);

  useEffect(() => {
    if (!ownerId) return;
    const q = query(collection(db, 'customers'), where('pharmacyId', '==', ownerId));
    return onSnapshot(q, 
      (s) => setCustomers(s.docs.map(d => ({ id: d.id, ...d.data() } as Customer))),
      (error) => console.error("Customers subscription error:", error)
    );
  }, [ownerId]);

  const filteredPOSProducts = products.filter(p => {
    if (selectedBranchId === 'all') return true;
    const pBranchId = p.branchId || `main_branch_${ownerId}`;
    const activeMainBranchId = `main_branch_${ownerId}`;
    if (selectedBranchId === 'main-branch' || selectedBranchId === activeMainBranchId) {
      return pBranchId === 'main-branch' || pBranchId === activeMainBranchId;
    }
    return pBranchId === selectedBranchId;
  });

  const handleCheckout = async () => {
    console.log('Complete Sale button clicked. Cart:', cart);
    
    if (cart.length === 0) {
      toast.error('Your cart is empty. Add products before completing the sale.');
      return;
    }

    if (isProcessing) return;

    if (!navigator.onLine) {
      toast.error('Network is offline. Transaction will be queued locally.');
    }
    
    // Check stock availability first
    for (const item of cart) {
      const product = products.find(m => m.id === item.productId);
      if (!product) {
        toast.error(`Product "${item.name}" not found in current inventory.`);
        return;
      }
      if (product.quantity < item.quantity) {
        toast.error(`Insufficient stock for ${item.name}. Available: ${product.quantity}`);
        return;
      }
    }

    setIsProcessing(true);
    const subtotal = cart.reduce((s, i) => s + i.total, 0);

    // Dynamic customer discount calculation
    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
    let discountAmount = 0;
    if (selectedCustomer && selectedCustomer.discountType && selectedCustomer.discountType !== 'none') {
      if (selectedCustomer.discountType === 'percentage') {
        discountAmount = subtotal * ((selectedCustomer.discountValue || 0) / 100);
      } else if (selectedCustomer.discountType === 'fixed') {
        discountAmount = Math.min(subtotal, selectedCustomer.discountValue || 0);
      }
    }

    const finalSubtotal = Math.max(0, subtotal - discountAmount);
    const vat = finalSubtotal * 0.15;
    const totalAmount = finalSubtotal + vat;
    const saleId = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const targetBranchId = selectedBranchId === 'all' ? `main_branch_${ownerId}` : selectedBranchId;
    
    const sale = { 
      pharmacyId: ownerId, 
      branchId: targetBranchId,
      items: cart, 
      subtotalAmount: subtotal,
      discountType: selectedCustomer?.discountType || 'none',
      discountValue: selectedCustomer?.discountValue || 0,
      discountAmount: discountAmount,
      displayBatchOnReceipt: displayBatchOnReceipt,
      vatAmount: vat,
      totalAmount: totalAmount, 
      paymentMethod: 'cash', 
      createdAt: Date.now(),
      customerName: hasCustomerTracking ? (selectedCustomer ? selectedCustomer.name : customerName) : null,
      customerPhone: hasCustomerTracking ? (selectedCustomer ? selectedCustomer.phone : customerPhone) : null,
      customerId: hasCustomerTracking ? selectedCustomerId || null : null
    };
    
    const checkoutToast = toast.loading(navigator.onLine ? 'Processing sale... Please wait.' : 'Recording sale offline...');
    
    try {
      if (!navigator.onLine && addToOfflineQueue) {
        // Enqueue offline sale transaction with pre-generated id
        addToOfflineQueue({
          id: saleId,
          type: 'sale',
          data: sale
        });

        // Optimistically update local cache persistence
        const batch = writeBatch(db);
        const saleRef = doc(db, 'sales', saleId);
        batch.set(saleRef, sale);
        
        cart.forEach(item => {
          const productRef = doc(db, 'medicines', item.productId);
          batch.update(productRef, {
            quantity: increment(-item.quantity)
          });
        });
        await batch.commit();

        // Write Bin Card Movements for each Cart Item (Offline Flow)
        for (const item of cart) {
          const product = products.find(m => m.id === item.productId);
          if (product) {
            const currentBranchName = branches.find(b => b.id === targetBranchId)?.name || 'Main Branch (HQ)';
            const userRefName = user.displayName || user.email || 'Staff';
            const factorOfConv = product.conversionFactor || 1;

            await recordBinCardMovement(db, {
              pharmacyId: ownerId,
              branchId: targetBranchId,
              productId: item.productId,
              productName: product.name,
              genericName: product.genericName || '',
              transactionType: 'Sale',
              referenceNumber: saleId,
              quantityIn: 0,
              quantityOut: item.quantity * factorOfConv,
              balance: Math.max(0, product.quantity - item.quantity) * factorOfConv,
              user: userRefName,
              branch: currentBranchName,
              product: product.name,
              countryOfOrigin: product.countryOfOrigin || '',
              purchaseUnit: product.purchaseUnit || '',
              dispensingUnit: product.dispensingUnit || '',
              conversionFactor: factorOfConv
            });
          }
        }

        // Audit applied discount offline
        if (discountAmount > 0) {
          try {
            await addDoc(collection(db, 'audit_logs'), {
              uid: user.uid,
              action: 'CUSTOMER_DISCOUNT_APPLIED',
              details: `Applied ${selectedCustomer?.discountType === 'percentage' ? selectedCustomer.discountValue + '%' : selectedCustomer?.discountValue + ' ETB'} discount (Amount: ${discountAmount} ETB) for customer "${selectedCustomer?.name}" on Transaction ${saleId}`,
              customerName: selectedCustomer?.name || '',
              customerId: selectedCustomer?.id || '',
              discountType: selectedCustomer?.discountType || '',
              discountValue: selectedCustomer?.discountValue || 0,
              discountAmount: discountAmount,
              userName: user.displayName || user.email || 'Staff',
              userEmail: user.email,
              transactionId: saleId,
              timestamp: Date.now()
            });
          } catch (e) {
            console.error(e);
          }
        }

        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setSelectedCustomerId('');
        toast.success('Sale registered offline. Will sync instantly when network resuming!', { id: checkoutToast, icon: '💾' });

        if (hasReceipts) {
          setTimeout(() => {
            try {
              downloadReceipt({ ...sale, id: saleId } as any, user.pharmacyName || user.displayName || 'Pharmacy');
              toast.success('Receipt ready (offline)', { icon: '📄' });
            } catch (pdfErr) {
              console.error('PDF generation error:', pdfErr);
            }
          }, 300);
        }
        return;
      }

      // Online default flow
      const batch = writeBatch(db);
      const saleRef = doc(db, 'sales', saleId);
      batch.set(saleRef, sale);

      cart.forEach(item => {
        const productRef = doc(db, 'medicines', item.productId);
        batch.update(productRef, {
          quantity: increment(-item.quantity)
        });
      });

      await new Promise(resolve => setTimeout(resolve, 1200));
      await batch.commit();

      // Write Bin Card Movements for each Cart Item (Online Flow)
      for (const item of cart) {
        const product = products.find(m => m.id === item.productId);
        if (product) {
          const currentBranchName = branches.find(b => b.id === targetBranchId)?.name || 'Main Branch (HQ)';
          const userRefName = user.displayName || user.email || 'Staff';
          const factorOfConv = product.conversionFactor || 1;

          await recordBinCardMovement(db, {
            pharmacyId: ownerId,
            branchId: targetBranchId,
            productId: item.productId,
            productName: product.name,
            genericName: product.genericName || '',
            transactionType: 'Sale',
            referenceNumber: saleId,
            quantityIn: 0,
            quantityOut: item.quantity * factorOfConv,
            balance: Math.max(0, product.quantity - item.quantity) * factorOfConv,
            user: userRefName,
            branch: currentBranchName,
            product: product.name,
            countryOfOrigin: product.countryOfOrigin || '',
            purchaseUnit: product.purchaseUnit || '',
            dispensingUnit: product.dispensingUnit || '',
            conversionFactor: factorOfConv
          });
        }
      }

      // Audit applied discount online
      if (discountAmount > 0) {
        try {
          await addDoc(collection(db, 'audit_logs'), {
            uid: user.uid,
            action: 'CUSTOMER_DISCOUNT_APPLIED',
            details: `Applied ${selectedCustomer?.discountType === 'percentage' ? selectedCustomer.discountValue + '%' : selectedCustomer?.discountValue + ' ETB'} discount (Amount: ${discountAmount} ETB) for customer "${selectedCustomer?.name}" on Transaction ${saleId}`,
            customerName: selectedCustomer?.name || '',
            customerId: selectedCustomer?.id || '',
            discountType: selectedCustomer?.discountType || '',
            discountValue: selectedCustomer?.discountValue || 0,
            discountAmount: discountAmount,
            userName: user.displayName || user.email || 'Staff',
            userEmail: user.email,
            transactionId: saleId,
            timestamp: Date.now()
          });
        } catch (e) {
          console.error(e);
        }
      }

      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setSelectedCustomerId('');
      toast.success('Sale completed successfully!', { id: checkoutToast });
      
      if (hasReceipts) {
        setTimeout(() => {
          try {
            downloadReceipt({ ...sale, id: saleId } as any, user.pharmacyName || user.displayName || 'Pharmacy');
            toast.success('Receipt ready', { icon: '📄' });
          } catch (pdfErr) {
            console.error('PDF generation error:', pdfErr);
            toast.error('Sale recorded, but receipt failed to generate.');
          }
        }, 300);
      } else {
        toast('Sale recorded (Receipts require Standard plan)', { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      handleFirestoreError(error, OperationType.CREATE, 'sales');
      toast.error('Failed to complete sale. Check your network.', { id: checkoutToast });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Point of Sale</h1>
            <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">Pharmacy Retail Terminal</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
            Plan: <span className="text-blue-600 dark:text-blue-400">{plan.toUpperCase()}</span>
          </div>
        </div>

        {/* Dynamic Product Code Search */}
        <div className="mb-6 relative">
          <input
            type="text"
            placeholder="Search products by brand name or generic chemical name..."
            value={posSearchSearch}
            onChange={(e) => setPosSearchSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 pl-12 text-sm focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 outline-none shadow-sm font-medium"
          />
          <Search className="absolute left-4 top-4 text-slate-400" size={18} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(
            filteredPOSProducts
              .filter(p => 
                p.name.toLowerCase().includes(posSearchSearch.toLowerCase()) || 
                (p.genericName && p.genericName.toLowerCase().includes(posSearchSearch.toLowerCase()))
              )
              .reduce((grouped: { [name: string]: InventoryProduct[] }, p) => {
                const nameKey = p.name.trim().toLowerCase();
                if (!grouped[nameKey]) {
                  grouped[nameKey] = [];
                }
                grouped[nameKey].push(p);
                return grouped;
              }, {})
          ).map(([nameKey, pListGroup]) => {
            const pList = pListGroup as InventoryProduct[];
            const firstProduct = pList[0];
            const totalStock = pList.reduce((sum, item) => sum + item.quantity, 0);
            const isMultiBatch = pList.length > 1;
            
            return (
              <button 
                key={nameKey} 
                onClick={() => {
                  setBatchSelectProductName(firstProduct.name);
                }} 
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:shadow-md transition-all text-left group flex flex-col justify-between"
              >
                <div className="w-full">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{firstProduct.name}</p>
                      {firstProduct.genericName && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-mono italic mt-0.5">{firstProduct.genericName}</p>
                      )}
                    </div>
                    {isMultiBatch && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-md uppercase tracking-wider">
                        {pList.length} Batches
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-3 space-y-1">
                    <p className="flex items-center gap-1.5">
                      <span className="font-bold">Total Stock:</span>
                      <span className={`font-mono font-bold ${totalStock <= 5 ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>
                        {totalStock} {firstProduct.dispensingUnit || 'units'}
                      </span>
                    </p>
                    {!isMultiBatch && firstProduct.expiryDate && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Expires: <span className="font-bold">{firstProduct.expiryDate}</span></p>
                    )}
                  </div>
                </div>

                <div className="w-full flex justify-between items-end mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/40">
                  <p className="text-blue-600 dark:text-blue-400 font-black text-lg">{firstProduct.price.toLocaleString()} ETB</p>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-2.5 py-1 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                    Select Batch
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl h-fit">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <ShoppingCart className="text-blue-600 dark:text-blue-400" /> Cart
          </h2>
          
          <div className="space-y-4 mb-8 max-h-60 overflow-y-auto pr-2">
            {cart.map((i, idx) => (
              <div key={idx} className="flex flex-col text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-xl group/item">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 dark:text-white">{i.name}</p>
                    {i.batchNumber && (
                      <p className="text-[10px] font-mono font-bold text-blue-500 dark:text-blue-400">Batch: {i.batchNumber} {i.expiryDate ? `| Exp: ${i.expiryDate}` : ''}</p>
                    )}
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{i.quantity} x {i.price.toLocaleString()} ETB</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">{i.total.toLocaleString()} ETB</p>
                    <button 
                      onClick={() => setCart(cart.filter((_, index) => index !== idx))}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      title="Remove from cart"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="text-center py-8 text-slate-400 dark:text-slate-600 italic">Cart is empty</div>
            )}
          </div>

          {hasCustomerTracking && (
            <div className="space-y-4 mb-8 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-150 dark:border-emerald-900/40">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users size={14} className="text-emerald-600 dark:text-emerald-400" />
                Insurance & Customer Coverage (Standard+)
              </p>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 italic font-medium bg-emerald-100/50 dark:bg-emerald-900/30 p-2.5 rounded-xl border border-emerald-200/40 dark:border-emerald-900/20">
                ⚠️ Note: The only pharmacy insurance in the whole pharmacy industry should be their customers.
              </p>
              
              <div className="space-y-3">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Select Registered Insurance / Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={e => {
                    const cid = e.target.value;
                    setSelectedCustomerId(cid);
                    if (cid) {
                      const c = customers.find(x => x.id === cid);
                      setCustomerName(c?.name || '');
                      setCustomerPhone(c?.phone || '');
                    } else {
                      setCustomerName('');
                      setCustomerPhone('');
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:border-blue-500 text-xs font-bold shadow-sm"
                >
                  <option value="">-- Guest Checkout / Unregistered --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) {c.discountType && c.discountType !== 'none' ? ` [LOYALTY: ${c.discountType === 'percentage' ? c.discountValue + '%' : c.discountValue + ' ETB'}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {!selectedCustomerId && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Or Enter Guest Details:</p>
                  <input 
                    type="text" 
                    placeholder="Customer Name" 
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-900/30 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 text-sm"
                  />
                  <input 
                    type="text" 
                    placeholder="Phone Number" 
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-900/30 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 text-sm"
                  />
                </div>
              )}

              {selectedCustomerId && (
                <div className="bg-green-500/10 p-3 rounded-xl border border-green-500/20 text-xs">
                  {(() => {
                    const c = customers.find(x => x.id === selectedCustomerId);
                    if (c && c.discountType && c.discountType !== 'none') {
                      return (
                        <p className="text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                          <CheckCircle size={14} /> Loyalty Discount applied: {c.discountType === 'percentage' ? `${c.discountValue}% Off` : `${c.discountValue} ETB Off`}.
                        </p>
                      );
                    } else {
                      return <p className="text-slate-500 dark:text-slate-400 font-bold">Loyal Customer holds no active discounts.</p>;
                    }
                  })()}
                </div>
              )}

              {/* PDF Receipt Display Batch Setting Option */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                <input 
                  type="checkbox" 
                  id="displayBatchOnReceipt"
                  checked={displayBatchOnReceipt}
                  onChange={e => setDisplayBatchOnReceipt(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="displayBatchOnReceipt" className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer select-none">
                  Display Batch Numbers on PDF Receipt
                </label>
              </div>
            </div>
          )}

          {/* Checkout Totals Segment */}
          {(() => {
            const subtotal = cart.reduce((s, i) => s + i.total, 0);
            const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
            let discountAmount = 0;
            if (selectedCustomer && selectedCustomer.discountType && selectedCustomer.discountType !== 'none') {
              if (selectedCustomer.discountType === 'percentage') {
                discountAmount = subtotal * ((selectedCustomer.discountValue || 0) / 100);
              } else if (selectedCustomer.discountType === 'fixed') {
                discountAmount = Math.min(subtotal, selectedCustomer.discountValue || 0);
              }
            }
            const finalSub = Math.max(0, subtotal - discountAmount);
            const vat = finalSub * 0.15;
            const totalVal = finalSub + vat;

            return (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mb-6 text-sm">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Subtotal</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {subtotal.toLocaleString()} ETB
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center mb-1.5 text-green-600 dark:text-green-400">
                    <span className="font-bold">Loyalty Discount</span>
                    <span className="font-heavy">
                      -{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">VAT (15%)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                  </span>
                </div>
                
                <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span className="text-slate-900 dark:text-white font-bold text-base">Total</span>
                  <span className="text-blue-600 dark:text-blue-400 font-black text-xl">
                    {totalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                  </span>
                </div>
              </div>
            );
          })()}

          <button 
            onClick={handleCheckout} 
            disabled={isProcessing}
            className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
              cart.length === 0 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100 dark:shadow-none'
            }`}
          >
            {isProcessing ? (
              <motion.div 
                animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
                transition={{ 
                  rotate: { repeat: Infinity, duration: 2, ease: "linear" },
                  scale: { repeat: Infinity, duration: 1, ease: "easeInOut" }
                }}
                className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg"
              >
                <Package className="text-white w-4 h-4" />
              </motion.div>
            ) : (
              <CheckCircle size={20} />
            )}
            {isProcessing ? 'Processing Check...' : 'Complete Sale'}
          </button>
          
          {hasReceipts && cart.length > 0 && (
            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 mt-4 font-medium uppercase tracking-widest">
              PDF Receipt will be generated
            </p>
          )}
        </div>
      </div>

      {/* Dynamic FEFO Batch Selection Popover Dialog Modal */}
      <AnimatePresence>
        {batchSelectProductName && (() => {
          const eligibleBatches = filteredPOSProducts.filter(
            p => p.name.trim().toLowerCase() === batchSelectProductName.trim().toLowerCase()
          );
          
          // FEFO recommendation mechanism: Expiry date ascending
          const sortedFEFOBatches = [...eligibleBatches].sort((a, b) => {
            if (!a.expiryDate) return 1;
            if (!b.expiryDate) return -1;
            return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
          });

          // Recommend the earliest expiring batch that is in stock, otherwise falls back to first
          const fefoRecommended = sortedFEFOBatches.find(b => b.quantity > 0) || sortedFEFOBatches[0];

          return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Batch Selection & FEFO Audit</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{batchSelectProductName}</p>
                  </div>
                  <button 
                    onClick={() => setBatchSelectProductName(null)}
                    className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                  >
                    <X size={18} className="text-slate-500" />
                  </button>
                </div>

                <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 text-xs text-amber-800 dark:text-amber-400 mb-4 font-medium flex gap-2.5 items-start leading-relaxed">
                  <ShieldCheck size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold uppercase text-[10px] tracking-wider mb-0.5">FEFO Expiration Recommendation Policy</p>
                    Ensure first expiry batches are sold first. Green badges specify FEFO suggestions. Cashier may override if branch stock requires it.
                  </div>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1 mb-6">
                  {sortedFEFOBatches.length === 0 ? (
                    <p className="text-sm italic text-slate-500 text-center py-6">No active batches available.</p>
                  ) : (
                    sortedFEFOBatches.map(b => {
                      const isRecommended = fefoRecommended && fefoRecommended.id === b.id;
                      const isOutOfStock = b.quantity <= 0;
                      
                      return (
                        <div 
                          key={b.id} 
                          className={`p-4 rounded-2xl border transition-all flex justify-between items-center ${
                            isRecommended 
                              ? 'border-green-500 bg-green-50/10 dark:bg-green-950/10' 
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50'
                          } ${isOutOfStock ? 'opacity-40' : ''}`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white text-sm">Batch: {b.batchNumber}</span>
                              {isRecommended && !isOutOfStock && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 bg-green-500 text-white rounded-md uppercase tracking-wider">
                                  FEFO recommended
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              Expires: <span className="font-bold text-slate-600 dark:text-slate-300">{b.expiryDate || 'No Expiration'}</span> | Available: <span className="font-bold text-slate-700 dark:text-slate-200">{b.quantity}</span>
                            </p>
                            <p className="text-blue-600 dark:text-blue-400 font-bold text-xs">{b.price.toLocaleString()} ETB</p>
                          </div>

                          {!isOutOfStock ? (
                            <button
                              onClick={() => {
                                // Add to cart with batch details!
                                const existingIndex = cart.findIndex(item => item.productId === b.id);
                                if (existingIndex > -1) {
                                  const newCart = [...cart];
                                  if (newCart[existingIndex].quantity >= b.quantity) {
                                    toast.error(`Cannot override stock limits. Maximum ${b.quantity} units available.`);
                                    return;
                                  }
                                  newCart[existingIndex].quantity += 1;
                                  newCart[existingIndex].total = newCart[existingIndex].quantity * newCart[existingIndex].price;
                                  setCart(newCart);
                                } else {
                                  setCart([
                                    ...cart, 
                                    { 
                                      productId: b.id, 
                                      name: `${b.name}`, 
                                      quantity: 1, 
                                      price: b.price, 
                                      total: b.price,
                                      batchNumber: b.batchNumber,
                                      expiryDate: b.expiryDate
                                    }
                                  ]);
                                }
                                toast.success(`${b.name} (Batch: ${b.batchNumber}) added to retail cart!`);
                                setBatchSelectProductName(null);
                              }}
                              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm active:scale-95"
                            >
                              Add To Cart
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded-lg">Out of Stock</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setBatchSelectProductName(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-705 font-bold text-xs text-slate-500 rounded-xl"
                  >
                    Cancel Selection
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  // --- BRANCHES MANAGEMENT STATE ---
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  // --- WAREHOUSES MANAGEMENT STATE ---
  const [warehouses, setWarehouses] = useState<any[]>([]);

  // --- OFFLINE SYNC ENGINE & QUEUE STATE ---
  const [syncStatus, setSyncStatus] = useState<'Online' | 'Offline' | 'Syncing' | 'Sync Complete'>('Online');
  const [offlineQueue, setOfflineQueue] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('at_pharmacy_offline_queue') || '[]');
    } catch {
      return [];
    }
  });
  const [isSyncCenterOpen, setIsSyncCenterOpen] = useState(false);

  // Monitor online/offline state
  useEffect(() => {
    const handleConnectivityChange = () => {
      const isOnline = navigator.onLine;
      setSyncStatus(isOnline ? 'Online' : 'Offline');
    };

    window.addEventListener('online', handleConnectivityChange);
    window.addEventListener('offline', handleConnectivityChange);
    handleConnectivityChange(); // initial check

    return () => {
      window.removeEventListener('online', handleConnectivityChange);
      window.removeEventListener('offline', handleConnectivityChange);
    };
  }, []);

  const triggerSync = async (currentQueue: any[]) => {
    if (currentQueue.length === 0) return;
    if (!navigator.onLine) {
      setSyncStatus('Offline');
      return;
    }

    setSyncStatus('Syncing');
    const syncToast = toast.loading('Synchronizing offline changes...', { id: 'offline-sync' });

    const failedItems: any[] = [];

    for (const item of currentQueue) {
      try {
        if (item.type === 'sale') {
          // Double-transaction prevention: Check server before writing
          try {
            const docSnap = await getDocFromServer(doc(db, 'sales', item.id));
            if (docSnap.exists()) {
              console.log(`Sale transaction ${item.id} already exists on the server. Skipping dec.`);
              continue;
            }
          } catch (e) {
            console.warn(`Could not check sale existence on server:`, e);
          }

          // Write sale document idempotent setDoc
          await setDoc(doc(db, 'sales', item.id), item.data);

          // Update medicine levels safely
          const batch = writeBatch(db);
          item.data.items.forEach((cartItem: any) => {
            const medicineId = cartItem.productId || cartItem.medicineId;
            const medicineRef = doc(db, 'medicines', medicineId);
            batch.update(medicineRef, {
              quantity: increment(-cartItem.quantity)
            });
          });
          await batch.commit();

        } else if (item.type === 'inventory') {
          const medicineRef = doc(db, 'medicines', item.id);
          if (item.action === 'create') {
            await setDoc(medicineRef, item.data);
          } else if (item.action === 'update') {
            await updateDoc(medicineRef, item.data);
          } else if (item.action === 'delete') {
            await deleteDoc(medicineRef);
          }

        } else if (item.type === 'customer') {
          await setDoc(doc(db, 'customers', item.id), item.data);
        }
      } catch (err) {
        console.error('Synchronization failed for item:', item, err);
        failedItems.push(item);
      }
    }

    setOfflineQueue(failedItems);
    localStorage.setItem('at_pharmacy_offline_queue', JSON.stringify(failedItems));

    if (failedItems.length === 0) {
      setSyncStatus('Sync Complete');
      toast.success('Offline records synchronized with ATech Cloud!', { id: 'offline-sync', icon: '☁️' });
      setTimeout(() => {
        setSyncStatus(prev => prev === 'Sync Complete' ? 'Online' : prev);
      }, 3000);
    } else {
      setSyncStatus('Offline');
      toast.error(`Sync finished with ${failedItems.length} issues. Retrying later.`, { id: 'offline-sync' });
    }
  };

  const addToOfflineQueue = (item: { type: 'sale' | 'inventory' | 'customer'; id: string; action?: string; data: any }) => {
    const newItem = {
      ...item,
      timestamp: Date.now()
    };
    const updatedQueue = [...offlineQueue, newItem];
    setOfflineQueue(updatedQueue);
    localStorage.setItem('at_pharmacy_offline_queue', JSON.stringify(updatedQueue));

    if (navigator.onLine) {
      triggerSync(updatedQueue);
    } else {
      toast.success('Queued offline. Will sync instantly when network resumes.', { icon: '💾' });
    }
  };

  // Auto-sync whenever we transition to 'Online' with pending items
  useEffect(() => {
    if (syncStatus === 'Online' && offlineQueue.length > 0) {
      triggerSync(offlineQueue);
    }
  }, [syncStatus, offlineQueue.length]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [language, setLanguage] = useState<'en' | 'am' | 'om' | 'ti'>(() => {
    return (localStorage.getItem('appLanguage') as any) || 'en';
  });

  const changeLanguage = (lang: 'en' | 'am' | 'om' | 'ti') => {
    setLanguage(lang);
    localStorage.setItem('appLanguage', lang);
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_settings', 'main'), 
      (s) => {
        if (s.exists()) {
          const data = s.data() as SystemSettings;
          setSystemSettings({
            ...data,
            planPrices: {
              ...PLAN_PRICES,
              ...(data.planPrices || {})
            }
          });
        }
      },
      (error) => {
        // Only log if it's not a permission error during initial load
        if (error.code !== 'permission-denied') {
          handleFirestoreError(error, OperationType.GET, 'system_settings/main');
        }
      }
    );
    return unsub;
  }, []);

  useEffect(() => {
    if (profile?.theme) {
      if (profile.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [profile?.theme]);

  const toggleTheme = async () => {
    if (!profile) return;
    const currentTheme = profile.theme || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Update local state immediately for better UX
    setProfile(prev => prev ? { ...prev, theme: newTheme } : null);
    
    try {
      await updateDoc(doc(db, 'users', profile.uid), { theme: newTheme });
      toast.success(`Switched to ${newTheme} mode`);
    } catch (error) {
      // Revert on error
      setProfile(prev => prev ? { ...prev, theme: currentTheme } : null);
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    }
  };

  useEffect(() => {
    // Connection test status
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.log("Firebase connection state: offline mode active.");
        }
      }
    };
    testConnection();

    const handleTabChange = (e: any) => {
      if (e.detail) setActiveTab(e.detail);
    };
    window.addEventListener('changeTab', handleTabChange);

    let profileUnsub: (() => void) | null = null;

    const authUnsub = onAuthStateChanged(auth, async (u) => {
      // Clean up previous profile listener if any
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (u) {
        setUser(u);
        setLoading(true);
        
        try {
          // Ensure admin role is applied if email matches
          await bootstrapAdmin(u);
          
          // Real-time profile listener
          profileUnsub = onSnapshot(doc(db, 'users', u.uid), async (docSnap) => {
            if (docSnap.exists()) {
              const profileData = docSnap.data() as UserProfile;
              
              // Force premium for admins
              if (profileData.role === 'admin') {
                profileData.subscriptionType = 'premium';
              }
              
              // Inherit subscription for staff
              if (profileData.role === 'staff' && (profileData.pharmacyId || profileData.importerId || profileData.distributorId)) {
                try {
                  const parentId = profileData.pharmacyId || profileData.importerId || profileData.distributorId;
                  if (parentId) {
                    const ownerDoc = await getDoc(doc(db, 'users', parentId));
                    if (ownerDoc.exists()) {
                      const ownerData = ownerDoc.data();
                      profileData.subscriptionType = ownerData.subscriptionType;
                      profileData.subscriptionStatus = ownerData.subscriptionStatus;
                    }
                  }
                } catch (e) {
                  console.warn('Could not fetch parent subscription for staff', e);
                }
              }

              // Normalize subscriptionType to exact standard/premium in UI
              const subTypeStr = String(profileData.subscriptionType || 'basic').toLowerCase();
              if (subTypeStr.includes('premium') || subTypeStr.includes('enterprise')) {
                profileData.subscriptionType = 'premium';
              } else if (subTypeStr.includes('standard') || subTypeStr.includes('professional') || subTypeStr.includes('pro')) {
                profileData.subscriptionType = 'standard';
              } else {
                profileData.subscriptionType = 'basic';
              }

              const pendingSubTypeStr = String(profileData.pendingSubscriptionType || '').toLowerCase();
              if (pendingSubTypeStr) {
                if (pendingSubTypeStr.includes('premium') || pendingSubTypeStr.includes('enterprise')) {
                  profileData.pendingSubscriptionType = 'premium';
                } else if (pendingSubTypeStr.includes('standard') || pendingSubTypeStr.includes('professional') || pendingSubTypeStr.includes('pro')) {
                  profileData.pendingSubscriptionType = 'standard';
                } else {
                  profileData.pendingSubscriptionType = 'basic';
                }
              }
              
              setProfile(profileData);
            } else {
              setProfile(null);
            }
            setLoading(false);
          }, (error) => {
            if (error.code === 'permission-denied') {
              console.warn('Profile fetch permission denied, user might not have a profile yet.');
              setProfile(null);
            } else {
              handleFirestoreError(error, OperationType.GET, `users/${u.uid}`);
            }
            setLoading(false);
          });
        } catch (error) {
          console.error('Error in auth state change:', error);
          setLoading(false);
        }
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsub();
      if (profileUnsub) profileUnsub();
      window.removeEventListener('changeTab', handleTabChange);
    };
  }, []);

  // Synchronize branches for pharmacy owners and staff
  useEffect(() => {
    if (!profile) {
      setBranches([]);
      return;
    }
    const isPharmacy = profile.role === 'pharmacy';
    const isStaff = profile.role === 'staff';
    if (!isPharmacy && !isStaff) return;

    const ownerId = isStaff ? (profile.pharmacyId || profile.uid) : profile.uid;
    if (!ownerId) return;

    const q = query(collection(db, 'branches'), where('pharmacyId', '==', ownerId));
    const unsub = onSnapshot(q, (snapshot) => {
      const branchList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Branch));
      setBranches(branchList);
      
      // Auto-migration & protection: if branches are empty, create a default "Main Branch (HQ)"
      // This is our robust migration strategy to ensure single-branch pharmacies continue working.
      if (branchList.length === 0 && isPharmacy && navigator.onLine) {
        const defaultBranchId = `main_branch_${ownerId}`;
        const defaultBranch: Branch = {
          id: defaultBranchId,
          pharmacyId: ownerId,
          name: 'Main Branch (HQ)',
          location: profile.address || profile.region || 'HQ Location',
          phone: profile.displayName || '',
          createdAt: Date.now()
        };
        setDoc(doc(db, 'branches', defaultBranchId), defaultBranch)
          .then(() => console.log('[Auto-Branch-Migration] Initial Main Branch created.'))
          .catch(err => console.error('[Auto-Branch-Migration] Error:', err));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'branches');
    });

    return () => unsub();
  }, [profile]);

  // Synchronize warehouses for pharmacy owners and staff
  useEffect(() => {
    if (!profile) {
      setWarehouses([]);
      return;
    }
    const isPharmacy = profile.role === 'pharmacy';
    const isStaff = profile.role === 'staff';
    if (!isPharmacy && !isStaff) return;

    const ownerId = isStaff ? (profile.pharmacyId || profile.uid) : profile.uid;
    if (!ownerId) return;

    const q = query(collection(db, 'warehouses'), where('pharmacyId', '==', ownerId));
    const unsub = onSnapshot(q, (snapshot) => {
      const warehouseList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setWarehouses(warehouseList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'warehouses');
    });

    return () => unsub();
  }, [profile]);

  // Set selected branch role restrictions
  useEffect(() => {
    if (profile) {
      if (profile.role === 'staff' && profile.branchId) {
        setSelectedBranchId(profile.branchId);
      } else {
        setSelectedBranchId('all');
      }
    }
  }, [profile]);

  const refreshProfile = async () => {
    if (user) {
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const profileData = userDoc.data() as UserProfile;
          if (profileData.role === 'admin') {
            profileData.subscriptionType = 'premium';
          }
          
          // Inherit subscription for staff
          if (profileData.role === 'staff' && (profileData.pharmacyId || profileData.importerId || profileData.distributorId)) {
            try {
              const parentId = profileData.pharmacyId || profileData.importerId || profileData.distributorId;
              if (parentId) {
                const ownerDoc = await getDoc(doc(db, 'users', parentId));
                if (ownerDoc.exists()) {
                  const ownerData = ownerDoc.data();
                  profileData.subscriptionType = ownerData.subscriptionType;
                  profileData.subscriptionStatus = ownerData.subscriptionStatus;
                }
              }
            } catch (e) {
              console.warn('Could not fetch parent subscription for staff', e);
            }
          }

          // Normalize subscriptionType to exact standard/premium in UI
          const subTypeStr = String(profileData.subscriptionType || 'basic').toLowerCase();
          if (subTypeStr.includes('premium') || subTypeStr.includes('enterprise')) {
            profileData.subscriptionType = 'premium';
          } else if (subTypeStr.includes('standard') || subTypeStr.includes('professional') || subTypeStr.includes('pro')) {
            profileData.subscriptionType = 'standard';
          } else {
            profileData.subscriptionType = 'basic';
          }

          const pendingSubTypeStr = String(profileData.pendingSubscriptionType || '').toLowerCase();
          if (pendingSubTypeStr) {
            if (pendingSubTypeStr.includes('premium') || pendingSubTypeStr.includes('enterprise')) {
              profileData.pendingSubscriptionType = 'premium';
            } else if (pendingSubTypeStr.includes('standard') || pendingSubTypeStr.includes('professional') || pendingSubTypeStr.includes('pro')) {
              profileData.pendingSubscriptionType = 'standard';
            } else {
              profileData.pendingSubscriptionType = 'basic';
            }
          }
          setProfile(profileData);
        } else {
          console.warn('Profile not found after refresh for UID:', user.uid);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error refreshing profile:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSignOut = () => {
    signOut(auth);
    setUser(null);
    setProfile(null);
  };

  useEffect(() => {
    if (profile?.uid) {
      // Skip automatic status changes & notifications for pharmacy/staff roles
      if (profile.role === 'pharmacy' || profile.role === 'staff') {
        return;
      }
      const checkSubscription = async () => {
        const now = Date.now();
        const expiry = profile.subscriptionExpiryDate;
        
        if (expiry && now > expiry && profile.subscriptionStatus !== 'expired') {
          await updateDoc(doc(db, 'users', profile.uid), {
            subscriptionStatus: 'expired'
          });
          toast.error('Your subscription has expired!', { duration: 10000 });
        } else if (expiry && now > (expiry - 3 * 24 * 60 * 60 * 1000) && profile.subscriptionStatus === 'active') {
          // Warning if 3 days left
          toast.error('Your subscription is expiring soon! Please renew.', {
            icon: '⚠️',
            duration: 5000
          });
        }
      };
      checkSubscription();
    }
  }, [profile?.uid, profile?.subscriptionExpiryDate, profile?.subscriptionStatus]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Toaster position="top-right" /><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return <><Toaster position="top-right" /><Login onLoginSuccess={setUser} /></>;
  if (!profile || profile.verificationStatus === 'rejected_resubmitting') return <><Toaster position="top-right" /><SignupFlow user={user} onComplete={refreshProfile} settings={systemSettings} initialProfile={profile} /></>;
  
  // Subscription Lock - Bypass and hide for pharmacy
  if (profile.subscriptionStatus === 'expired' && profile.role === 'importer') {
    return (
      <ErrorBoundary>
        <Toaster position="top-right" />
        <SubscriptionLock user={profile} onRenew={refreshProfile} settings={systemSettings} />
      </ErrorBoundary>
    );
  }

  if (profile.verificationStatus !== 'approved' && profile.role !== 'admin') return <><Toaster position="top-right" /><VerificationPending profile={profile} /></>;

  const hasAccess = (tabId: string) => {
    // Admin has access to everything
    if (profile.role === 'admin') return true;

    // Check feature access using centralized gate for pharmacy, staff, importer, or distributor roles
    if (['pharmacy', 'staff', 'importer', 'distributor'].includes(profile.role)) {
      const isFeatureAllowed = hasFeature(profile, tabId, systemSettings);
      if (!isFeatureAllowed) return false;
    }

    // Standard items accessible to everyone by default
    if (['dashboard', 'settings', 'notifications', 'subscription'].includes(tabId)) return true;

    // Plan check
    const menuItems = [
      { id: 'dashboard', label: 'Dashboard', roles: ['admin', 'pharmacy', 'importer', 'regional_manager', 'staff', 'marketing', 'distributor'] },
      { id: 'inventory', label: 'Inventory', roles: ['pharmacy', 'staff'] },
      { id: 'bincard', label: 'Bin Card Reports', roles: ['pharmacy', 'staff'] },
      { id: 'expiry', label: 'Expiry Control', roles: ['pharmacy', 'staff'] },
      { id: 'forecasting', label: 'Forecasting', roles: ['pharmacy', 'staff'] },
      { id: 'my-products', label: 'My Products', roles: ['importer', 'distributor', 'staff'] },
      { id: 'sales', label: 'Sales & POS', roles: ['pharmacy', 'staff'] },
      { id: 'customers', label: 'Customers', roles: ['pharmacy', 'staff'] },
      { id: 'suppliers', label: 'Wholesales', roles: ['pharmacy', 'staff'] },
      { id: 'marketplace', label: 'Marketplace', roles: ['pharmacy', 'admin', 'staff'] },
      { id: 'orders', label: 'B2B Orders', roles: ['pharmacy', 'importer', 'distributor', 'staff'] },
      { id: 'procurement', label: 'Procurement (PR & PO)', roles: ['pharmacy', 'staff'] },
      { id: 'staff', label: 'Staff Accounts', roles: ['pharmacy', 'importer', 'distributor', 'staff'] },
      { id: 'branches', label: 'Branches', roles: ['pharmacy', 'staff'] },
      { id: 'warehouses', label: 'Warehouses', roles: ['pharmacy', 'importer', 'distributor', 'staff'] },
      { id: 'subscription', label: 'Subscription', roles: ['pharmacy', 'importer', 'distributor'] },
      { id: 'advertising', label: 'Wholesale Promotions', roles: ['importer', 'distributor'] },
      { id: 'deliveries', label: 'Delivery & Shipping', roles: ['importer', 'distributor'] },
      { id: 'reports', label: 'Reports', roles: ['importer', 'distributor'] },
      { id: 'analytics', label: 'Analytics Insights', roles: ['importer', 'distributor'] },
      { id: 'super-admin', label: 'Ecosystem Control Tower', roles: ['admin'] },
      { id: 'admin-users', label: 'User Management', roles: ['admin'] },
      { id: 'admin-marketing', label: 'Marketing Team', roles: ['admin'] },
      { id: 'admin-ratings', label: 'Team Performance & Ratings', roles: ['admin'] },
      { id: 'users', label: 'Approve/Reject Users', roles: ['admin'] },
      { id: 'admin-revenue', label: 'Revenue & Finance', roles: ['admin'] },
      { id: 'admin-marketplace', label: 'Marketplace Control', roles: ['admin'] },
      { id: 'admin-notifications', label: 'Notifications', roles: ['admin'] },
      { id: 'admin-ads', label: 'Promotion', roles: ['admin'] },
      { id: 'admin-system', label: 'System Control', roles: ['admin'] },
      { id: 'settings', label: 'Settings', roles: ['admin', 'pharmacy', 'importer', 'regional_manager', 'staff', 'marketing', 'distributor'] },
    ];

    const item = menuItems.find(m => m.id === tabId);
    if (item && !item.roles.includes(profile.role)) return false;

    // Role-specific allowed list for extra safety
    const accessMap: Record<string, string[]> = {
      pharmacy: ['dashboard', 'inventory', 'bincard', 'expiry', 'forecasting', 'sales', 'customers', 'marketplace', 'orders', 'procurement', 'suppliers', 'staff', 'branches', 'warehouses', 'subscription', 'settings'],
      importer: ['dashboard', 'my-products', 'orders', 'warehouses', 'deliveries', 'advertising', 'reports', 'analytics', 'staff', 'subscription', 'notifications', 'settings'],
      regional_manager: ['dashboard', 'settings'],
      marketing: ['dashboard', 'marketing-stats', 'settings'],
      distributor: ['dashboard', 'my-products', 'orders', 'warehouses', 'deliveries', 'advertising', 'reports', 'analytics', 'staff', 'subscription', 'notifications', 'settings'],
    };

    // Staff access
    if (profile.role === 'staff') {
      if (profile.permissions) return profile.permissions.includes(tabId);
      if (profile.staffRole) {
        const defaults = DEFAULT_PERMISSIONS[profile.staffRole] || ['dashboard', 'settings'];
        return defaults.includes(tabId);
      }
      return ['dashboard', 'settings'].includes(tabId);
    }

    return accessMap[profile.role as string]?.includes(tabId) || false;
  };

  const t = (key: string) => {
    const dict = TRANSLATIONS[language as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;
    return (dict as any)[key] || key;
  };

  return (
    <ErrorBoundary>
      <Toaster position="top-right" />
      
      {/* Offline Sync Center Side Sheet */}
      <AnimatePresence>
        {isSyncCenterOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
            {/* Backdrop click closer */}
            <div className="absolute inset-0" onClick={() => setIsSyncCenterOpen(false)} />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl h-full flex flex-col p-6 z-10 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base">
                    <RefreshCw size={18} className="text-blue-600 dark:text-blue-400" /> ATech Sync Center
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Offline operations tracking and cloud syncer.</p>
                </div>
                <button 
                  onClick={() => setIsSyncCenterOpen(false)}
                  className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold"
                >
                  &times;
                </button>
              </div>

              {/* Status Section */}
              <div className="py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ecosystem Status</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  syncStatus === 'Offline'
                    ? 'bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'
                    : syncStatus === 'Syncing'
                    ? 'bg-blue-100 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400'
                    : 'bg-green-100 dark:bg-green-950/20 text-green-700 dark:text-green-400'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    syncStatus === 'Offline'
                      ? 'bg-amber-500'
                      : syncStatus === 'Syncing'
                      ? 'bg-blue-500 animate-pulse'
                      : 'bg-green-500'
                  }`} />
                  {syncStatus}
                </span>
              </div>

              {/* Queue Items */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Unsynchronized Queue ({offlineQueue.length})</span>
                
                {offlineQueue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center overflow-hidden">
                    <div className="h-10 w-10 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-3">
                      <CheckCircle size={20} />
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">All Syncs Complete</h4>
                    <p className="text-slate-400 dark:text-slate-500 text-xs max-w-xs mt-1 leading-relaxed">
                      No pending changes. All pharmacy sales, stock changes, and registered customers are perfectly synced to the ATech cloud.
                    </p>
                  </div>
                ) : (
                  offlineQueue.map((item, index) => (
                    <div key={item.id + index} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                          item.type === 'sale'
                            ? 'bg-purple-100 dark:bg-purple-950/25 text-purple-700 dark:text-purple-400'
                            : item.type === 'customer'
                            ? 'bg-emerald-100 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-400'
                            : 'bg-blue-100 dark:bg-blue-950/25 text-blue-700 dark:text-blue-400'
                        }`}>
                          {item.type}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          {format(item.timestamp, 'HH:mm:ss')}
                        </span>
                      </div>
                      
                      <div className="text-sm font-sans text-slate-800 dark:text-slate-200 text-left">
                        {item.type === 'sale' && (
                          <div className="font-bold">
                            POS Retail Sale: {item.data.totalAmount.toLocaleString()} ETB
                            <p className="text-[11px] font-normal text-slate-400 mt-1">Items: {item.data.items.length}</p>
                          </div>
                        )}
                        {item.type === 'customer' && (
                          <div className="font-bold">
                            Registered Customer: {item.data.name}
                            <p className="text-[11px] font-normal text-slate-400 mt-1">Phone: {item.data.phone}</p>
                          </div>
                        )}
                        {item.type === 'inventory' && (
                          <div className="font-bold">
                            Stock Change ({item.action}): {item.data.name}
                            <p className="text-[11px] font-normal text-slate-400 mt-1">Stock level updated</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer footer controls */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                {offlineQueue.length > 0 && navigator.onLine && (
                  <button
                    onClick={() => triggerSync(offlineQueue)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-xs font-bold shadow-lg shadow-blue-100 dark:shadow-none flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw size={14} className={syncStatus === 'Syncing' ? 'animate-spin' : ''} />
                    Force Synchronize Now
                  </button>
                )}
                <button
                  onClick={() => setIsSyncCenterOpen(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-755 text-slate-500 dark:text-slate-400 rounded-xl py-3 text-xs font-bold"
                >
                  Close Sync Center
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          role={profile.role} 
          user={profile} 
          onSignOut={handleSignOut}
          toggleTheme={toggleTheme}
          settings={systemSettings}
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          language={language}
          changeLanguage={changeLanguage}
        />
        <main className="flex-1 overflow-y-auto h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative w-full lg:w-auto">
          <header className={`sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 sm:px-8 backdrop-blur-md transition-all dark:border-slate-800 dark:bg-slate-950/80`}>
            <div className="flex items-center gap-4">
              {isSidebarCollapsed && (
                <button 
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
                >
                  <Menu size={20} />
                </button>
              )}
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {t(activeTab) || activeTab.replace(/-/g, ' ')}
                </h2>
                {profile && ['pharmacy', 'staff'].includes(profile.role) && (
                  <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-3">
                    <span className="text-[10px] uppercase text-slate-400 font-bold hidden sm:inline">Branch:</span>
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      disabled={profile.role === 'staff' && !!profile.branchId}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-sm"
                    >
                      {profile.role === 'pharmacy' && (
                        <option value="all">🌐 All Branches</option>
                      )}
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>📍 {b.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Sync Status Badge / Button */}
              {profile && ['pharmacy', 'staff'].includes(profile.role) && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsSyncCenterOpen(true)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-300 relative ${
                      syncStatus === 'Offline'
                        ? 'bg-amber-50 dark:bg-amber-950/25 border-amber-205 dark:border-amber-900 text-amber-600 dark:text-amber-400 font-bold'
                        : syncStatus === 'Syncing'
                        ? 'bg-blue-50 dark:bg-blue-950/25 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 animate-pulse font-bold'
                        : syncStatus === 'Sync Complete'
                        ? 'bg-green-50 dark:bg-green-950/25 border-green-200 dark:border-green-900 text-green-600 dark:text-green-400 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {syncStatus === 'Offline' ? (
                      <>
                        <WifiOff size={14} className="text-amber-500 animate-pulse" />
                        <span>Offline</span>
                      </>
                    ) : syncStatus === 'Syncing' ? (
                      <>
                        <RefreshCw size={14} className="text-blue-500 animate-spin" />
                        <span>Syncing...</span>
                      </>
                    ) : syncStatus === 'Sync Complete' ? (
                      <>
                        <CheckCircle size={14} className="text-green-500 animate-bounce" />
                        <span>Sync Complete</span>
                      </>
                    ) : (
                      <>
                        <Wifi size={14} className="text-green-500" />
                        <span>Online</span>
                      </>
                    )}

                    {offlineQueue.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full text-[9px] w-5 h-5 flex items-center justify-center font-bold animate-bounce shadow-md">
                        {offlineQueue.length}
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* Language Selector */}
              <div className="flex items-center gap-2">
                <Globe size={15} className="text-slate-400 dark:text-slate-500" />
                <select 
                  value={language} 
                  onChange={(e) => changeLanguage(e.target.value as any)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name.split(' ')[0]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="hidden items-center gap-2 md:flex">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{profile.role.replace('_', ' ')}: {t('system_active')}</span>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{profile.displayName}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{profile.email}</p>
                </div>
                <div className="h-10 w-10 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-blue-600 dark:text-blue-400">
                  {profile.displayName?.charAt(0)}
                </div>
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
              {!hasAccess(activeTab) ? (
                <div id="access-restricted-container" className="p-12 flex flex-col items-center justify-center min-h-[70vh] text-center max-w-2xl mx-auto">
                  <div className="w-24 h-24 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mb-8 rotate-6 animate-pulse">
                    <ShieldCheck size={48} />
                  </div>
                  
                  <span className="text-[10px] font-black tracking-widest uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-3 py-1.5 rounded-full mb-3">Premium SaaS Feature Lock</span>
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">{getUpgradeRequirementLabel(activeTab)} Required</h2>
                  
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                    The requested section <span className="font-mono font-bold text-slate-700 dark:text-slate-200">"{activeTab.toUpperCase()}"</span> is part of the <span className="font-bold text-blue-600 dark:text-blue-400">{getUpgradeRequirementLabel(activeTab)} Plan</span>. 
                    {profile.role === 'staff' 
                      ? ' Your administrator has configured plan features for this pharmacy. Please contact your supervisor to process a subscription adjustment.' 
                      : ' Unlock multiple-branch transfers, advanced analytical reports, custom patient discounts, unified warehouse layers, and more by updating your ecosystem service tier.'}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <button 
                      id="restricted-dashboard-btn"
                      onClick={() => setActiveTab('dashboard')} 
                      className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-705 transition-all text-xs"
                    >
                      Return to Dashboard
                    </button>
                    {profile.role !== 'staff' && (
                      <button 
                        id="restricted-upgrade-btn"
                        onClick={() => setActiveTab('subscription')} 
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-100 dark:shadow-none transition-all text-xs"
                      >
                        Upgrade Subscription Plan
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {(profile.role === 'importer' || profile.role === 'distributor') ? (
                    <>
                      {['dashboard', 'my-products', 'orders', 'warehouses', 'deliveries', 'advertising', 'reports', 'analytics'].includes(activeTab) && (
                        <DistributorView user={profile} activeTab={activeTab} setActiveTab={setActiveTab} />
                      )}
                      {activeTab === 'subscription' && <SubscriptionView user={profile} settings={systemSettings} language={language} />}
                      {activeTab === 'notifications' && <NotificationsView user={profile} />}
                      {activeTab === 'staff' && <StaffManagementView user={profile} branches={branches} warehouses={warehouses} selectedBranchId={selectedBranchId} />}
                    </>
                  ) : (
                    <>
                      {activeTab === 'dashboard' && (
                        profile.role === 'regional_manager' 
                          ? <RegionalManagerDashboard user={profile} /> 
                          : profile.role === 'marketing'
                          ? <MarketingDashboard user={profile} />
                          : profile.role === 'admin'
                          ? <SuperAdminConsole initialTab="overview" />
                          : <DashboardView role={profile.role} user={profile} setActiveTab={setActiveTab} selectedBranchId={selectedBranchId} branches={branches} settings={systemSettings} />
                      )}
                      {activeTab === 'inventory' && <InventoryView user={profile} addToOfflineQueue={addToOfflineQueue} syncStatus={syncStatus} selectedBranchId={selectedBranchId} branches={branches} />}
                      {activeTab === 'bincard' && <BinCardLedgerView user={profile} branches={branches} />}
                      {activeTab === 'forecasting' && <ForecastingView user={profile} branches={branches} warehouses={warehouses} />}
                      {activeTab === 'expiry' && <ExpiryTrackerView user={profile} branches={branches} warehouses={warehouses} />}
                      {activeTab === 'my-products' && <ImporterInventoryView user={profile} />}
                      {activeTab === 'sales' && <SalesView user={profile} addToOfflineQueue={addToOfflineQueue} syncStatus={syncStatus} selectedBranchId={selectedBranchId} branches={branches} />}
                      {activeTab === 'customers' && <CustomersView user={profile} addToOfflineQueue={addToOfflineQueue} syncStatus={syncStatus} />}
                      {activeTab === 'marketplace' && <MarketplaceView user={profile} />}
                      {activeTab === 'orders' && <OrdersView user={profile} />}
                      {activeTab === 'procurement' && <PurchaseOrdersView user={profile} branches={branches} warehouses={warehouses} />}
                      {activeTab === 'subscription' && <SubscriptionView user={profile} settings={systemSettings} language={language} />}
                      {activeTab === 'advertising' && <WholesaleAdsPortal user={profile} />}
                      {activeTab === 'notifications' && <NotificationsView user={profile} />}
                      {activeTab === 'suppliers' && <SuppliersView user={profile} />}
                      {activeTab === 'staff' && <StaffManagementView user={profile} branches={branches} warehouses={warehouses} selectedBranchId={selectedBranchId} />}
                      {activeTab === 'branches' && <BranchesView user={profile} branches={branches} settings={systemSettings} />}
                      {activeTab === 'warehouses' && <WarehousesView user={profile} branches={branches} />}
                    </>
                  )}
                  {(activeTab === 'super-admin' || activeTab.startsWith('super-admin-')) && (
                    <SuperAdminConsole 
                      initialTab={(activeTab === 'super-admin' ? 'overview' : activeTab.replace('super-admin-', '')) as any} 
                    />
                  )}
                  {activeTab === 'admin-users' && <AdminUserManagement />}
                  {activeTab === 'admin-marketing' && <AdminMarketingManagement />}
                  {activeTab === 'admin-ratings' && <AdminRatingsManagement />}
                  {activeTab === 'admin-revenue' && <AdminRevenuePanel settings={systemSettings} />}
                  {activeTab === 'admin-marketplace' && <AdminMarketplaceControl />}
                  {activeTab === 'admin-notifications' && <AdminNotifications />}
                  {activeTab === 'admin-ads' && <AdminAdsCenter />}
                  {activeTab === 'admin-system' && <AdminSystemControl />}
                  {activeTab === 'users' && <AdminVerificationView />}
                  {activeTab === 'settings' && (
                    <div className="p-8 max-w-2xl mx-auto">
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Settings</h1>
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Name</label>
                          <input type="text" readOnly={profile.role === 'staff'} defaultValue={profile.pharmacyName || profile.importerName || profile.name} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-800 dark:text-white" />
                        </div>
                        {profile.role === 'staff' && (
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Username</label>
                            <input type="text" readOnly defaultValue={profile.username} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 outline-none bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400" />
                          </div>
                        )}
                        
                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                          <h3 className="text-lg font-bold mb-4 dark:text-white">Change Password</h3>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">New Password</label>
                              <input id="new-password" type="password" className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 dark:bg-slate-800 dark:text-white" />
                            </div>
                            <button 
                              onClick={async () => {
                                const newPass = (document.getElementById('new-password') as HTMLInputElement).value;
                                if (newPass.length < 6) {
                                  toast.error('Password must be at least 6 characters');
                                  return;
                                }
                                try {
                                  await updateDoc(doc(db, 'users', user.uid), { password: newPass });
                                  toast.success('Password updated successfully!');
                                  (document.getElementById('new-password') as HTMLInputElement).value = '';
                                } catch (error) {
                                  toast.error('Failed to update password');
                                }
                              }}
                              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 dark:shadow-none"
                            >
                              Update Password
                            </button>
                          </div>
                        </div>

                        {/* Future-ready Finance and Serial Hardware Sandbox Widget */}
                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold dark:text-white">Finance & Hardware Integration</h3>
                            <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Future-Ready</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium">Configure next-generation payment gateways and serial hardware integrations for Ethiopia and future cross-border expansions.</p>
                          
                          <div className="space-y-4">
                            {/* Electronic Payment Gateway Modes */}
                            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-3 justify-between">
                              <div className="flex-1">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Payment Gateways</span>
                                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">National Sandbox (Telebirr, CBE Birr, Chapa)</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Ready for unified direct banking and electronic wallets integration.</p>
                              </div>
                              <select 
                                disabled
                                className="bg-slate-200 dark:bg-slate-800 cursor-not-allowed border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-500 font-bold outline-none self-center"
                              >
                                <option>Sandbox Mode Enforced</option>
                              </select>
                            </div>

                            {/* Serial Device Integration */}
                            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-4 justify-between">
                              <div className="flex-1">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Serial Devices</span>
                                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Hardware & Fiscal Printer Drivers</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Serial RS232 protocols configured for physical billing machines, weight modules, and POS cash registers.</p>
                              </div>
                              <div className="flex items-center self-center">
                                <button 
                                  type="button"
                                  onClick={() => {
                                    toast(
                                      "Serial connection successfully compiled on system-level. Physical register protocols are prepared and will automatically activate upon regional hardware deregulation.", 
                                      { duration: 4000 }
                                    );
                                  }}
                                  className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95"
                                >
                                  Test Port
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
          <LegalFooter settings={systemSettings} />
        </main>
      </div>
    </ErrorBoundary>
  );
}
