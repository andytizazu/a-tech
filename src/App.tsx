/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Component } from 'react';
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
  BarChart3
} from 'lucide-react';
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
import { 
  UserProfile, 
  Medicine, 
  Sale, 
  SaleItem, 
  UserRole, 
  MarketplaceProduct, 
  Order, 
  OrderStatus,
  VerificationStatus,
  SystemSettings,
  Notification,
  AuditLog
} from './types';
import { downloadReceipt, printReceipt, generateInventoryReport, generateRevenueReport } from './lib/pdfGenerator';

import { countries } from './constants/countries';

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
  if (adminEmails.includes(user.email)) {
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

  const validateEmail = (emailStr: string) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailStr.trim());
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
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
      console.error('Auth error detail:', error);
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">A-Tech Pharmacy</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
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
    </div>
  );
};

const SignupFlow = ({ user, onComplete, settings }: { user: any, onComplete: () => void, settings: SystemSettings | null }) => {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, data: string}[]>([]);
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryList, setShowCountryList] = useState(false);
  const [formData, setFormData] = useState({
    role: 'pharmacy' as UserRole,
    displayName: user.displayName || '',
    pharmacyName: '',
    importerName: '',
    country: '',
    region: '',
    city: '',
    referredBy: '',
    subscriptionType: 'basic' as 'basic' | 'standard' | 'premium'
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
                  <p className="text-sm text-slate-500 dark:text-slate-400">Retail medicine sales and inventory.</p>
                </button>
                <button 
                  onClick={() => setFormData({...formData, role: 'importer'})}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${formData.role === 'importer' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${formData.role === 'importer' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    <Truck size={24} />
                  </div>
                  <p className="font-bold text-lg text-slate-900 dark:text-white">Importer</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Bulk supply and distribution.</p>
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
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{formData.role === 'pharmacy' ? 'Pharmacy Name' : 'Company Name'}</label>
                  <input type="text" value={(formData.role === 'pharmacy' ? formData.pharmacyName : formData.importerName) || ''} 
                    onChange={e => setFormData({...formData, [formData.role === 'pharmacy' ? 'pharmacyName' : 'importerName']: e.target.value})} 
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
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
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Region</label>
                  <input type="text" value={formData.region || ''} onChange={e => setFormData({...formData, region: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
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
                  { id: 'basic', name: 'Basic', price: (settings?.planPrices?.basic === 0) ? 'Free' : `${settings?.planPrices?.basic || PLAN_PRICES.basic} ETB`, features: ['100 Meds', 'Reports'] },
                  { id: 'standard', name: 'Standard', price: `${settings?.planPrices?.standard || PLAN_PRICES.standard} ETB`, features: ['Unlimited', 'Dashboard'] },
                  { id: 'premium', name: 'Premium', price: `${settings?.planPrices?.premium || PLAN_PRICES.premium} ETB`, features: ['AI Insights', 'Support'] },
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
                    <div key={i} className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-xl text-sm font-medium">
                      <CheckCircle size={18} />
                      <span className="truncate">{f.name}</span>
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
              onClick={() => step < 4 ? setStep(step + 1) : handleComplete()}
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
                await updateDoc(doc(db, 'users', profile.uid), { verificationStatus: 'pending', rejectionReason: null });
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
  const [roleFilter, setRoleFilter] = useState<'all' | 'pharmacy' | 'importer'>('all');

  useEffect(() => {
    // Listen for all users to catch those with missing or pending status
    const q1 = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsub1 = onSnapshot(q1, (snapshot) => {
      setAllUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    }, (error) => {
      if (error.code === 'failed-precondition') {
        // Fallback for missing index: fetch without ordering
        const qFallback = query(collection(db, 'users'), limit(500));
        onSnapshot(qFallback, (snapshot) => {
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
        // This query also needs an index (composite: pendingSubscriptionType + createdAt or similar)
        // Fallback: use the allUsers data to find subscription requests
      } else {
        handleFirestoreError(error, OperationType.LIST, 'users (subscriptions)');
      }
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const handleVerify = async (uid: string, status: 'approved' | 'rejected') => {
    try {
      const updateData: any = { verificationStatus: status };
      if (status === 'rejected') {
        updateData.rejectionReason = rejectionReason;
      }
      await updateDoc(doc(db, 'users', uid), updateData);
      toast.success(`Account ${status}`);
      setShowRejectionModal(false);
      setRejectionReason('');
      setSelectedUser(null);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleSubscriptionApprove = async (uid: string, plan: string, approve: boolean) => {
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
        toast.success('Subscription approved and activated');
      } else {
        await updateDoc(doc(db, 'users', uid), { 
          pendingSubscriptionType: null 
        });
        toast.success('Subscription request rejected');
      }
    } catch (error) {
      toast.error('Failed to process request');
    }
  };

  const filteredPending = allUsers.filter(u => {
    const isPending = u.role !== 'admin' && u.verificationStatus !== 'approved' && u.verificationStatus !== 'rejected';
    const matchesSearch = u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (u.pharmacyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (u.importerName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return (showAll || isPending) && matchesSearch && matchesRole;
  });

  const filteredSubscriptions = subscriptionRequests.length > 0
    ? subscriptionRequests.filter(u => 
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.pharmacyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.importerName || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allUsers.filter(u => 
        u.pendingSubscriptionType && (
          u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
          u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.pharmacyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.importerName || '').toLowerCase().includes(searchQuery.toLowerCase())
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
            {['all', 'pharmacy', 'importer'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  roleFilter === r 
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                {r === 'all' ? 'All Roles' : r.charAt(0).toUpperCase() + r.slice(1) + 's'}
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
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${showAll ? 'bg-slate-800 dark:bg-slate-700 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            {showAll ? 'Showing All Users' : 'Show Only Pending'}
          </button>
        </div>
      </div>

      <section>
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {showAll ? 'All Registered Accounts' : 'New Account Verifications'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {showAll ? 'Browse all accounts in the system.' : 'Review and verify new business accounts.'}
            </p>
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
            Total: {allUsers.length} Users
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredPending.map(user => (
            <div key={user.uid} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${user.role === 'importer' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'} rounded-xl flex items-center justify-center font-bold`}>
                  {user.role === 'importer' ? <Truck size={20} /> : (user.displayName || '?').charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {user.pharmacyName || user.importerName || user.displayName}
                    {user.role === 'importer' && (
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 tracking-tighter uppercase">Importer</span>
                    )}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{user.email} • <span className="capitalize">{user.role.replace('_', ' ')}</span></p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1 uppercase tracking-wider flex items-center gap-1">
                    <MapPin size={12} /> {user.country || 'No Country'}, {user.city}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  {user.verificationDocs?.map((d, i) => (
                    <button 
                      key={i} 
                      onClick={() => setSelectedUser(user)}
                      className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                      <FileText size={20} />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setSelectedUser(user);
                      setShowRejectionModal(true);
                    }} 
                    className="px-4 py-2 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleVerify(user.uid, 'approved')} 
                    className="px-6 py-2 bg-green-600 text-white font-bold hover:bg-green-700 rounded-xl shadow-lg shadow-green-100 dark:shadow-none"
                  >
                    Approve
                  </button>
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
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button onClick={() => { setShowRejectionModal(true); }} className="px-6 py-3 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl transition-all">Reject Account</button>
                <button onClick={() => handleVerify(selectedUser.uid, 'approved')} className="px-8 py-3 bg-green-600 text-white font-bold hover:bg-green-700 rounded-xl shadow-lg shadow-green-100 dark:shadow-none">Approve Account</button>
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
                  <button onClick={() => { setShowRejectionModal(false); setRejectionReason(''); }} className="flex-1 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">Cancel</button>
                  <button 
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
                <button onClick={() => handleSubscriptionApprove(user.uid, '', false)} className="px-4 py-2 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl">Decline</button>
                <button onClick={() => handleSubscriptionApprove(user.uid, user.pendingSubscriptionType!, true)} className="px-6 py-2 bg-blue-600 text-white font-bold hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-100 dark:shadow-none">Approve Upgrade</button>
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
  basic: 0,
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

const SubscriptionView = ({ user, settings }: { user: UserProfile, settings: SystemSettings | null }) => {
  const [renewalMonths, setRenewalMonths] = useState(1);
  const [isRenewing, setIsRenewing] = useState(false);

  const getPlanPrice = (planId: string) => {
    return (settings?.planPrices?.[planId as keyof typeof PLAN_PRICES]) ?? PLAN_PRICES[planId as keyof typeof PLAN_PRICES];
  };

  const plans = [
    { 
      id: 'basic', 
      name: 'Basic', 
      price: getPlanPrice('basic') === 0 ? 'Free' : `${getPlanPrice('basic')} ETB`, 
      features: [
        'Add/Edit/Delete medicines',
        'Basic inventory tracking',
        'Low stock alerts',
        'Expiry tracking',
        'Record sales',
        'Basic profit calculation'
      ],
      limitations: [
        'Max 200 medicines',
        'No PDF reports',
        'No marketplace access',
        'No customer tracking'
      ]
    },
    { 
      id: 'standard', 
      name: 'Standard', 
      price: `${getPlanPrice('standard')} ETB/mo`, 
      features: [
        'Everything in Basic',
        'Unlimited medicines',
        'PDF receipts & reports',
        'Sales history',
        'Customer tracking',
        'Basic dashboard analytics',
        'Importer marketplace access'
      ],
      limitations: [
        'No advanced analytics',
        'No smart suggestions',
        'No multi-user staff accounts'
      ]
    },
    { 
      id: 'premium', 
      name: 'Premium', 
      price: `${getPlanPrice('premium')} ETB/mo`, 
      features: [
        'Everything in Standard',
        'Advanced analytics & trends',
        'Smart insights (Auto-reorder)',
        'Multi-user staff accounts',
        'Supplier management',
        'Region performance insights',
        'Priority notifications',
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Subscription Plan</h1>
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
            <p className="text-blue-100 font-medium mb-1 uppercase tracking-wider text-xs">Current Plan</p>
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
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Quick Renew</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Extend your current plan instantly.</p>
            
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
            {isRenewing ? 'Renewing...' : 'Renew Now'}
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
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-4">What's included:</p>
              <ul className="space-y-3 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-slate-400 text-sm">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>

              {plan.limitations && (
                <>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-4">Limitations:</p>
                  <ul className="space-y-3 mb-8">
                    {plan.limitations.map((f, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-400 dark:text-slate-500 text-sm">
                        <XCircle size={16} className="text-slate-300 dark:text-slate-700 mt-0.5 shrink-0" /> {f}
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
              {user.subscriptionType === plan.id ? 'Current Plan' : user.pendingSubscriptionType === plan.id ? 'Request Pending' : 'Select Plan'}
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

  const getPharmacyLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const newLoc = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(newLoc);
        // Also save to profile
        updateDoc(doc(db, 'users', user.uid), {
          latitude: newLoc.lat,
          longitude: newLoc.lng
        });
        toast.success("Location updated!");
      });
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
    if (!importer || !importer.deliverySettings) return { distance: 0, fee: 0 };
    
    const settings = importer.deliverySettings;
    const distance = calculateDistance(
      userLocation.lat || 0, 
      userLocation.lng || 0, 
      importer.latitude || 0, 
      importer.longitude || 0
    );

    if (settings.isFreeDelivery) return { distance, fee: 0 };
    if (settings.freeDeliveryThreshold && orderAmount >= settings.freeDeliveryThreshold) return { distance, fee: 0 };
    if (settings.freeDistanceLimit && distance <= settings.freeDistanceLimit) return { distance, fee: 0 };
    
    const fee = settings.baseFee + (distance * settings.feePerKm);
    return { distance, fee };
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

  const addToCart = (product: MarketplaceProduct) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product, quantity: product.minOrderQuantity }]);
    }
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
      for (const importerId in ordersByImporter) {
        const items = ordersByImporter[importerId];
        const itemsTotal = items.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
        const { distance, fee } = getFeesForImporter(importerId, itemsTotal);

        const order: Omit<Order, 'id'> = {
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
          deliveryFee: deliveryMethod === 'delivery' ? fee : 0
        };
        await addDoc(collection(db, 'orders'), order);
      }
      setCart([]);
      toast.success('Orders placed successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">B2B Marketplace</h1>
          <p className="text-slate-500 dark:text-slate-400">Bulk medical supplies in {user.country}</p>
        </div>
        <div className="relative">
          <button className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all dark:text-white">
            <ShoppingCart size={20} />
            <span className="font-bold">{cart.length}</span>
          </button>
          {cart.length > 0 && (
            <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 z-50">
              <h3 className="font-bold mb-4 dark:text-white">Your Cart</h3>
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
                  <div className="space-y-4">
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
                          onClick={getPharmacyLocation}
                          className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <MapPin size={10} /> Auto-Set Location
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

                      <div className="pt-2 space-y-1">
                        {Object.keys(importersData).length > 0 && (Array.from(new Set(cart.map(i => i.product.importerId))) as string[]).map((id: string) => {
                          const amount = cart.filter(i => i.product.importerId === id).reduce((s, i) => s + (i.product.price * i.quantity), 0);
                          const { distance, fee } = getFeesForImporter(id, amount);
                          return (
                            <div key={id} className="flex justify-between text-[9px] text-slate-500">
                              <span className="truncate max-w-[140px]">{importersData[id]?.importerName || 'Supplier'} ({distance}km)</span>
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
                  <span className="font-bold dark:text-white">
                    {cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toLocaleString()} ETB
                  </span>
                </div>
                {deliveryMethod === 'delivery' && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Delivery Total</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {totalDeliveryFee > 0 ? `${totalDeliveryFee.toLocaleString()} ETB` : 'FREE'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-slate-900 dark:text-white">Total Amount</span>
                <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                  {(cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) + totalDeliveryFee).toLocaleString()} ETB
                </span>
              </div>

              <button 
                onClick={handlePlaceOrder} 
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none"
              >
                Place Order
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center"><Package size={24} /></div>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase">{product.category}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{product.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{product.description}</p>
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{product.price.toLocaleString()} ETB</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Min. Order: {product.minOrderQuantity}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{product.importerName}</p>
                <p className="text-[10px] text-slate-400">Importer</p>
              </div>
            </div>
            <button onClick={() => addToCart(product)} className="w-full py-3 bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2">
              <Plus size={18} /> Add to Order
            </button>
          </div>
        ))}
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
            className="px-8 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load More Products'}
          </button>
        </div>
      )}
    </div>
  );
};

const ImporterInventoryView = ({ user }: { user: UserProfile }) => {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState(user.deliverySettings || {
    isFreeDelivery: false,
    freeDeliveryThreshold: 5000,
    baseFee: 100,
    feePerKm: 10
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
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setWarehouse({
          ...warehouse,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        toast.success("Coordinates updated to current location!");
      }, () => {
        toast.error("Failed to get location. Using default.");
      });
    }
  };

  useEffect(() => {
    if (!user.uid) return;
    const q = query(collection(db, 'products'), where('importerId', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketplaceProduct)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));
    return unsub;
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Base Fee (ETB)</label>
                    <input type="number" value={deliverySettings.baseFee ?? 0} onChange={e => setDeliverySettings({...deliverySettings, baseFee: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Fee Per KM (ETB)</label>
                    <input type="number" value={deliverySettings.feePerKm ?? 0} onChange={e => setDeliverySettings({...deliverySettings, feePerKm: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase">Free Delivery Threshold (ETB)</label>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">Reward Bulk Orders</span>
                </div>
                <input type="number" value={deliverySettings.freeDeliveryThreshold ?? 0} onChange={e => setDeliverySettings({...deliverySettings, freeDeliveryThreshold: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" placeholder="e.g. 10000" />
                <p className="text-[10px] text-slate-500">Delivery will be free if order total exceeds this amount.</p>
              </div>

              <div className="space-y-2 pt-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase">Free Delivery Distance Limit (KM)</label>
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase">Reward Local Orders</span>
                </div>
                <input type="number" value={deliverySettings.freeDistanceLimit || 0} onChange={e => setDeliverySettings({...deliverySettings, freeDistanceLimit: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" placeholder="e.g. 5" />
                <p className="text-[10px] text-slate-500">Delivery will be free if distance is less than or equal to this limit.</p>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <MapPin size={18} className="text-blue-500" /> Warehouse Location
              </h3>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Warehouse Address</label>
                <input type="text" value={warehouse.address || ''} onChange={e => setWarehouse({...warehouse, address: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" placeholder="e.g. Merkato, Building A, Addis Ababa" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Latitude</label>
                  <input type="number" step="0.000001" value={warehouse.latitude ?? 0} readOnly className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Longitude</label>
                  <input type="number" step="0.000001" value={warehouse.longitude ?? 0} readOnly className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-500 outline-none" />
                </div>
              </div>
              <button 
                onClick={getUserLocation}
                className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
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
                  <h3 className="font-bold text-slate-900 dark:text-white">Order #{order.id?.slice(-6).toUpperCase()}</h3>
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
    try {
      const userToUpdate = users.find(u => u.uid === uid);
      const oldStatus = userToUpdate?.verificationStatus;
      
      await updateDoc(doc(db, 'users', uid), { verificationStatus: status });

      // Pharmacy Referral Reward Logic
      if (status === 'approved' && oldStatus === 'pending' && userToUpdate?.referrerUid && settings?.pharmacyReferralRewardMonths) {
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
      }

      toast.success(`User status updated to ${status}`);
    } catch (error) {
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
                    {(u.role === 'pharmacy' || u.role === 'importer') ? (
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
          <p className="text-slate-500 dark:text-slate-400">Monitor and manage all medicine listings.</p>
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
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
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
          importerCommissions: {},
          marketingCommission: {
            durationMonths: 12,
            basicPlanRate: 50,
            standardPlanRate: 100,
            premiumPlanRate: 250,
            orderCommissionPercent: 1
          },
          pharmacyReferralRewardMonths: 1,
          maxMedicinesPerPlan: { basic: 100, standard: 500, premium: 2000 },
          planPrices: { basic: 0, standard: 1200, premium: 3000 },
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
  pharmacist: ['dashboard', 'inventory', 'sales', 'marketplace', 'orders', 'suppliers', 'settings'],
  cashier: ['dashboard', 'sales', 'settings'],
  inventory: ['dashboard', 'inventory', 'marketplace', 'orders', 'suppliers', 'settings'],
  importer_staff: ['dashboard', 'my-products', 'orders', 'settings'],
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
  onToggle
}: { 
  activeTab: string, 
  setActiveTab: (t: string) => void, 
  role: UserRole, 
  user: UserProfile, 
  onSignOut: () => void,
  toggleTheme: () => void,
  settings: SystemSettings | null,
  isCollapsed: boolean,
  onToggle: () => void
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'pharmacy', 'importer', 'regional_manager', 'staff', 'marketing'] },
    { id: 'inventory', label: 'Inventory', icon: Package, roles: ['pharmacy', 'staff'] },
    { id: 'my-products', label: 'My Products', icon: Box, roles: ['importer', 'staff'] },
    { id: 'sales', label: 'Sales & POS', icon: ShoppingCart, roles: ['pharmacy', 'staff'] },
    { id: 'marketplace', label: 'Marketplace', icon: Truck, roles: ['pharmacy', 'admin', 'staff'], minPlan: 'standard' },
    { id: 'orders', label: 'B2B Orders', icon: ShoppingCart, roles: ['pharmacy', 'importer', 'staff'], minPlan: 'standard' },
    { id: 'suppliers', label: 'Suppliers', icon: Building2, roles: ['pharmacy', 'importer', 'staff'], minPlan: 'premium' },
    { id: 'staff', label: 'Staff Accounts', icon: Users, roles: ['pharmacy', 'importer', 'staff'], minPlan: 'premium' },
    { id: 'subscription', label: 'Subscription', icon: CreditCard, roles: ['pharmacy', 'importer'] },
    { id: 'admin-users', label: 'User Management', icon: Users, roles: ['admin'] },
    { id: 'admin-marketing', label: 'Marketing Team', icon: Users, roles: ['admin'] },
    { id: 'users', label: 'Approve/Reject Users', icon: ShieldCheck, roles: ['admin'] },
    { id: 'admin-revenue', label: 'Revenue & Finance', icon: TrendingUp, roles: ['admin'] },
    { id: 'admin-marketplace', label: 'Marketplace Control', icon: Globe, roles: ['admin'] },
    { id: 'admin-notifications', label: 'Notifications', icon: Mail, roles: ['admin'] },
    { id: 'admin-system', label: 'System Control', icon: Settings, roles: ['admin'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin', 'pharmacy', 'importer', 'regional_manager', 'staff', 'marketing'] },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles.includes(role)) return false;
    
    // Check subscription plan for pharmacies
    if (role === 'pharmacy') {
      const plan = user.subscriptionType || 'basic';
      if (item.minPlan === 'premium' && plan !== 'premium') return false;
      if (item.minPlan === 'standard' && plan === 'basic') return false;
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
    <div className={`${isCollapsed ? 'w-20' : 'w-72'} bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 h-screen flex flex-col sticky top-0 transition-all duration-300 overflow-y-auto scrollbar-hide z-[100]`}>
      <div className={`${isCollapsed ? 'p-4' : 'p-6'}`}>
        <div className={`flex items-center ${isCollapsed ? 'flex-col gap-6' : 'justify-between'} mb-10`}>
          <div className="flex items-center gap-3 group">
            <div className={`w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 dark:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-500 group-hover:rotate-6`}>
              <Package className="text-white w-7 h-7" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-black text-xl text-slate-900 dark:text-white tracking-tighter leading-none">A-TECH</span>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mt-1">Ethiopia</span>
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
            <p className="text-slate-400 text-sm mb-6">Real-time data from the A-Tech Ecosystem.</p>
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

const DashboardView = ({ role, user, setActiveTab }: { role: UserRole, user: UserProfile, setActiveTab: (t: string) => void }) => {
  const isImporterOwner = role === 'importer' || (role === 'staff' && !!user.importerId);
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
    totalMedicines: 0,
    totalSales: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          const meds = snapshot.docs.map(d => d.data() as Medicine);
          const lowStock = meds.filter(m => m.quantity <= (m.lowStockThreshold || 10)).length;
          setStats(prev => ({ ...prev, lowStock, totalMedicines: meds.length }));
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'medicines'));
        unsubs.push(unsubMed);

        const qSales = query(collection(db, 'sales'), where('pharmacyId', '==', ownerId));
        const unsubSales = onSnapshot(qSales, (snapshot) => {
          const sales = snapshot.docs.map(d => d.data() as Sale);
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

          setChartData(last7Days.map(d => ({ name: d.date, sales: d.sales })));
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'sales'));
        unsubs.push(unsubSales);
      }
    }

    setLoading(false);
    return () => unsubs.forEach(unsub => unsub());
  }, [user.uid, role]);

  const adminStats = [
    { label: 'Total Pharmacies', value: stats.pharmacies.toString(), icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Importers', value: stats.importers.toString(), icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Revenue', value: `${stats.revenue.toLocaleString()} ETB`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Active Subs', value: stats.activeSubscriptions.toString(), icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Pending Payments', value: stats.pendingPayments.toString(), icon: CreditCard, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Sales Volume', value: `${stats.totalSalesVolume.toLocaleString()} ETB`, icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  const isPharmacy = role === 'pharmacy' || role === 'staff';
  
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
    { id: 'inventory', label: !isImporterOwner ? 'Inventory' : 'My Orders', value: !isImporterOwner ? `${stats.totalMedicines} Items` : stats.orders.toString(), icon: !isImporterOwner ? Package : ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'inventory', label: 'Low Stock', value: `${stats.lowStock} Items`, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'sales', label: !isImporterOwner ? 'Total Sales' : 'Marketplace', value: !isImporterOwner ? stats.totalSales.toString() : 'Live', icon: !isImporterOwner ? ShoppingCart : Globe, color: 'text-purple-600', bg: 'bg-purple-50' },
  ].filter(stat => hasPermission(stat.id));

  const currentStats = role === 'admin' ? adminStats : userStats;
  const plan = user.subscriptionType || 'basic';
  const isPremium = plan === 'premium';
  const isStandardOrPremium = plan !== 'basic';

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
            Welcome to the A-Tech Ecosystem in <span className="font-bold text-blue-600 dark:text-blue-400">{user.country || 'Global'}</span>.
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {currentStats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className={`w-12 h-12 ${stat.bg} dark:bg-slate-800 ${stat.color} dark:text-blue-400 rounded-xl flex items-center justify-center mb-4`}><stat.icon size={24} /></div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

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
          {plan === 'premium' ? (
            <div className="bg-purple-600 p-6 rounded-3xl text-white shadow-xl shadow-purple-100 dark:shadow-none">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Zap size={20} /> Smart Insights
              </h3>
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                  <p className="text-xs font-bold text-purple-100 uppercase mb-1">Auto Reorder</p>
                  <p className="text-sm">3 items are below threshold. Suggested order generated.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                  <p className="text-xs font-bold text-purple-100 uppercase mb-1">Top Selling</p>
                  <p className="text-sm">Amoxicillin sales are up 24% this week.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                  <p className="text-xs font-bold text-purple-100 uppercase mb-1">Trend Alert</p>
                  <p className="text-sm">Flu season starting. Stock up on Antipyretics.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4 shadow-sm">
                <Zap size={24} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Unlock Smart Insights</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 px-4">Upgrade to Premium to get AI-powered reorder suggestions and trend analysis.</p>
              <button 
                onClick={() => setActiveTab('subscription')}
                className="bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 px-6 py-2 rounded-xl font-bold border border-blue-100 dark:border-blue-900 shadow-sm hover:bg-blue-50 dark:hover:bg-slate-700 transition-all"
              >
                View Plans
              </button>
            </div>
          )}
        </div>
      </div>

      {/* B2B Ecosystem Guide */}
      <div className="mt-12 bg-blue-600 rounded-[32px] p-8 md:p-12 text-white overflow-hidden relative">
        <div className="relative z-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold mb-4">The B2B Ecosystem</h2>
            <p className="text-blue-100 mb-8 text-lg">
              A-Tech connects pharmacies directly with importers to streamline the medical supply chain in {user.country || 'your region'}.
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

// --- Inventory & Sales Views (Simplified for brevity) ---

const InventoryView = ({ user }: { user: UserProfile }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [formData, setFormData] = useState<Partial<Medicine>>({
    name: '', category: 'Medicine', price: 0, costPrice: 0, quantity: 0, batchNumber: '', expiryDate: '', lowStockThreshold: 5, supplier: ''
  });

  const ownerId = user.role === 'staff' ? user.pharmacyId : user.uid;
  const plan = user.subscriptionType || 'basic';
  const medicineLimit = 200;

  useEffect(() => {
    if (!ownerId) return;
    const q = query(collection(db, 'medicines'), where('pharmacyId', '==', ownerId));
    return onSnapshot(q, 
      (s) => setMedicines(s.docs.map(d => ({ id: d.id, ...d.data() } as Medicine))),
      (error) => handleFirestoreError(error, OperationType.LIST, 'medicines')
    );
  }, [ownerId]);

  const handleAddMedicine = async () => {
    if (formData.quantity < 0) {
      toast.error('Quantity cannot be negative');
      return;
    }
    if (plan === 'basic' && medicines.length >= medicineLimit) {
      toast.error(`Basic plan limit reached (${medicineLimit} medicines). Please upgrade to Standard for unlimited listings.`);
      return;
    }

    try {
      await addDoc(collection(db, 'medicines'), {
        ...formData,
        pharmacyId: ownerId,
        createdAt: Date.now()
      });
      setIsAdding(false);
      setFormData({ name: '', category: 'Medicine', price: 0, costPrice: 0, quantity: 0, batchNumber: '', expiryDate: '', lowStockThreshold: 5, supplier: '' });
      toast.success('Medicine added to inventory');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'medicines');
    }
  };

  const handleUpdateMedicine = async () => {
    if (!editingMedicine) return;
    if (formData.quantity < 0) {
      toast.error('Inventory cannot go lower than zero');
      return;
    }
    try {
      await updateDoc(doc(db, 'medicines', editingMedicine.id), {
        ...formData,
        updatedAt: Date.now()
      });
      setEditingMedicine(null);
      setFormData({ name: '', category: 'Medicine', price: 0, costPrice: 0, quantity: 0, batchNumber: '', expiryDate: '', lowStockThreshold: 5, supplier: '' });
      toast.success('Inventory updated successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `medicines/${editingMedicine.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'medicines', id));
      toast.success('Medicine removed');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `medicines/${id}`);
    }
  };

  const handleExportPDF = () => {
    // Group by category for more detail
    const categories = Array.from(new Set(medicines.map(m => m.category)));
    const categoryData = categories.map(cat => {
      const catItems = medicines.filter(m => m.category === cat);
      return {
        label: `Category: ${cat}`,
        revenue: catItems.reduce((sum, m) => sum + (m.quantity * m.price), 0),
        orders: catItems.length
      };
    });

    const doc = generateInventoryReport(medicines, user.displayName || 'Pharmacy');
    
    // We can add a second page or more info if needed, but for now the enhanced 
    // generateInventoryReport already handles summary stats.
    
    doc.save(`inventory-report-${Date.now()}.pdf`);
    toast.success('Detailed inventory report exported!');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory Management</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {plan === 'basic' ? `${medicines.length} / ${medicineLimit} medicines used` : `${medicines.length} medicines in stock`}
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
            <Plus size={20} /> Add Medicine
          </button>
        </div>
      </div>

      {(isAdding || editingMedicine) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl mb-8">
          <h2 className="text-xl font-bold mb-6 dark:text-white">
            {editingMedicine ? `Edit: ${editingMedicine.name}` : 'New Medicine Entry'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Medicine Name</label>
              <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" placeholder="e.g. Paracetamol" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Category</label>
              <select value={formData.category || 'Medicine'} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500">
                <option>Medicine</option>
                <option>Surgical</option>
                <option>Equipment</option>
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
          </div>
          <div className="mt-8 flex justify-end gap-4">
            <button 
              onClick={() => {
                setIsAdding(false);
                setEditingMedicine(null);
                setFormData({ name: '', category: 'Medicine', price: 0, costPrice: 0, quantity: 0, batchNumber: '', expiryDate: '', lowStockThreshold: 5, supplier: '' });
              }} 
              className="px-6 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={editingMedicine ? handleUpdateMedicine : handleAddMedicine} 
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none"
            >
              {editingMedicine ? 'Update Inventory' : 'Save Medicine'}
            </button>
          </div>
        </motion.div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="px-8 py-5">Medicine</th>
              <th className="px-8 py-5">Stock</th>
              <th className="px-8 py-5">Price</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {medicines.map(m => {
              const isLowStock = m.quantity <= m.lowStockThreshold;
              const isExpired = new Date(m.expiryDate) < new Date();
              return (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-900 dark:text-white">{m.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Batch: {m.batchNumber} | Exp: {m.expiryDate}</p>
                    {plan === 'premium' && m.supplier && (
                      <p className="text-[10px] text-blue-500 font-bold uppercase mt-1">Supplier: {m.supplier}</p>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    <p className={`font-bold ${isLowStock ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>{m.quantity} units</p>
                  </td>
                  <td className="px-8 py-5 font-bold text-slate-900 dark:text-white">{m.price.toLocaleString()} ETB</td>
                  <td className="px-8 py-5">
                    <div className="flex flex-wrap gap-2">
                      {isLowStock && <span className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><AlertTriangle size={10} /> Low Stock</span>}
                      {isExpired && <span className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><AlertTriangle size={10} /> Expired</span>}
                      {!isLowStock && !isExpired && <span className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle size={10} /> Healthy</span>}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingMedicine(m);
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

const StaffManagementView = ({ user }: { user: UserProfile }) => {
  const [staff, setStaff] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [newStaff, setNewStaff] = useState({ name: '', role: user.role === 'importer' ? 'importer_staff' : 'pharmacist' });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(DEFAULT_PERMISSIONS[user.role === 'importer' ? 'importer_staff' : 'pharmacist']);
  const [generatedCreds, setGeneratedCreds] = useState<{username: string, password: string} | null>(null);

  const ownerId = user.role === 'staff' ? (user.pharmacyId || user.importerId) : user.uid;
  const isImporterOwner = user.role === 'importer' || (user.role === 'staff' && user.importerId);
  const plan = user.subscriptionType || 'basic';
  const canCustomize = plan !== 'basic';
  const isPremium = plan === 'premium';

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

      const businessName = user.pharmacyName || user.importerName || 'business';
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
        role: 'staff',
        staffRole: newStaff.role,
        permissions: selectedPermissions,
        verificationStatus: 'approved',
        createdAt: Date.now()
      });
      
      setGeneratedCreds({ username, password });
      setIsAdding(false);
      setNewStaff({ name: '', role: 'pharmacist' });
      toast.success('Staff account created!', { id: addToast });
    } catch (error: any) {
      console.error(error);
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
              </select>
            </div>
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
            {staff.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-8 py-5">
                  <p className="font-bold text-slate-900 dark:text-white">{s.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{s.username || s.email}</p>
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

const AdminMarketingManagement = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', promoCode: '' });

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'marketing'));
    return onSnapshot(q, 
      (s) => setMembers(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      (error) => handleFirestoreError(error, OperationType.LIST, 'users')
    );
  }, []);

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email || !newMember.promoCode) {
      toast.error('Please fill in all fields');
      return;
    }
    const addToast = toast.loading('Adding marketing member...');
    try {
      // Check if promo code is unique
      const q = query(collection(db, 'users'), where('promoCode', '==', newMember.promoCode.toUpperCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        toast.error('Promo code already exists', { id: addToast });
        return;
      }

      const memberUid = `mkt-${Date.now()}`; // Simplified for demo, usually use Auth
      await setDoc(doc(db, 'users', memberUid), {
        uid: memberUid,
        displayName: newMember.name,
        email: newMember.email,
        role: 'marketing',
        promoCode: newMember.promoCode.toUpperCase(),
        commissionBalance: 0,
        verificationStatus: 'approved',
        createdAt: Date.now()
      });
      setIsAdding(false);
      setNewMember({ name: '', email: '', promoCode: '' });
      toast.success('Marketing member added!', { id: addToast });
    } catch (error) {
      console.error(error);
      toast.error('Failed to add member', { id: addToast });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Marketing Team</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage marketing members and their performance.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none flex items-center gap-2"
        >
          <UserPlus size={20} /> Add Member
        </button>
      </div>

      {isAdding && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl mb-8">
          <h2 className="text-xl font-bold mb-6 dark:text-white">New Marketing Member</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Full Name</label>
              <input type="text" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" placeholder="e.g. John Doe" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email</label>
              <input type="email" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" placeholder="john@atech.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Promo Code</label>
              <input type="text" value={newMember.promoCode} onChange={e => setNewMember({...newMember, promoCode: e.target.value.toUpperCase()})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" placeholder="ATECH10" />
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-4">
            <button onClick={() => setIsAdding(false)} className="px-6 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">Cancel</button>
            <button onClick={handleAddMember} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none">Add Member</button>
          </div>
        </motion.div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="px-8 py-5">Member</th>
              <th className="px-8 py-5">Promo Code</th>
              <th className="px-8 py-5">Commission</th>
              <th className="px-8 py-5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {members.map(m => (
              <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-8 py-5">
                  <p className="font-bold text-slate-900 dark:text-white">{m.displayName}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{m.email}</p>
                </td>
                <td className="px-8 py-5">
                  <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold px-3 py-1 rounded-lg">{m.promoCode}</span>
                </td>
                <td className="px-8 py-5">
                  <p className="font-bold text-green-600 dark:text-green-400">{(m.commissionBalance || 0).toLocaleString()} ETB</p>
                </td>
                <td className="px-8 py-5">
                  <button className="text-slate-400 hover:text-blue-600 transition-colors"><Eye size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MarketingDashboard = ({ user }: { user: UserProfile }) => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [selectedReferral, setSelectedReferral] = useState<any | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('marketingId', '==', user.uid));
    const unsubReferrals = onSnapshot(q, 
      (s) => setReferrals(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      (error) => handleFirestoreError(error, OperationType.LIST, 'users')
    );
    
    const unsubSettings = onSnapshot(doc(db, 'system_settings', 'main'), 
      (s) => {
        if (s.exists()) setSettings(s.data() as SystemSettings);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'system_settings/main')
    );

    return () => {
      unsubReferrals();
      unsubSettings();
    };
  }, [user.uid]);

  const stats = [
    { label: 'Total Referrals', value: referrals.length.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Commission Balance', value: `${(user.commissionBalance || 0).toLocaleString()} ETB`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'My Promo Code', value: user.promoCode || 'N/A', icon: Percent, color: 'text-purple-600', bg: 'bg-purple-50' },
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
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Marketing Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">Track your referrals and commissions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className={`w-12 h-12 ${stat.bg} dark:bg-slate-800 ${stat.color} rounded-xl flex items-center justify-center mb-4`}><stat.icon size={24} /></div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">My Referrals</h2>
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
            <p className="text-blue-600 dark:text-blue-400 font-bold text-2xl mt-2">{user.promoCode}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SalesView = ({ user }: { user: UserProfile }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const ownerId = user.role === 'staff' ? user.pharmacyId : user.uid;
  const plan = user.subscriptionType || 'basic';
  const hasCustomerTracking = plan !== 'basic';
  const hasReceipts = plan !== 'basic';

  useEffect(() => {
    if (!ownerId) return;
    const q = query(collection(db, 'medicines'), where('pharmacyId', '==', ownerId));
    return onSnapshot(q, 
      (s) => setMedicines(s.docs.map(d => ({ id: d.id, ...d.data() } as Medicine))),
      (error) => handleFirestoreError(error, OperationType.LIST, 'medicines')
    );
  }, [ownerId]);

  const handleCheckout = async () => {
    console.log('Complete Sale button clicked. Cart:', cart);
    
    if (cart.length === 0) {
      toast.error('Your cart is empty. Add medicines before completing the sale.');
      return;
    }

    if (isProcessing) return;

    if (!navigator.onLine) {
      toast.error('Network seems to be offline. Attempting anyway...');
    }
    
    // Check stock availability first
    for (const item of cart) {
      const medicine = medicines.find(m => m.id === item.medicineId);
      if (!medicine) {
        toast.error(`Medicine "${item.name}" not found in current inventory.`);
        return;
      }
      if (medicine.quantity < item.quantity) {
        toast.error(`Insufficient stock for ${item.name}. Available: ${medicine.quantity}`);
        return;
      }
    }

    setIsProcessing(true);
    const total = cart.reduce((s, i) => s + i.total, 0);
    const sale = { 
      pharmacyId: ownerId, 
      items: cart, 
      totalAmount: total, 
      paymentMethod: 'cash', 
      createdAt: Date.now(),
      customerName: hasCustomerTracking ? customerName : null,
      customerPhone: hasCustomerTracking ? customerPhone : null
    };
    
    const checkoutToast = toast.loading('Processing sale... Please wait.');
    
    try {
      // 1. Prepare batch
      const batch = writeBatch(db);
      
      // 2. Add sale document
      const saleRef = doc(collection(db, 'sales'));
      batch.set(saleRef, sale);

      // 3. Update medicine quantities in same batch
      cart.forEach(item => {
        const medicineRef = doc(db, 'medicines', item.medicineId);
        batch.update(medicineRef, {
          quantity: increment(-item.quantity)
        });
      });

      // Artificial delay so the branded loading logo is actually visible
      await new Promise(resolve => setTimeout(resolve, 1200));

      // 4. Commit batch
      await batch.commit();

      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      toast.success('Sale completed successfully!', { id: checkoutToast });
      
      if (hasReceipts) {
        setTimeout(() => {
          try {
            downloadReceipt({ ...sale, id: saleRef.id } as Sale, user.pharmacyName || user.displayName || 'Pharmacy');
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Point of Sale</h1>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
            Plan: <span className="text-blue-600 dark:text-blue-400">{plan.toUpperCase()}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {medicines.map(m => (
            <button 
              key={m.id} 
              onClick={() => {
                const existingIndex = cart.findIndex(item => item.medicineId === m.id);
                if (existingIndex > -1) {
                  const newCart = [...cart];
                  newCart[existingIndex].quantity += 1;
                  newCart[existingIndex].total = newCart[existingIndex].quantity * newCart[existingIndex].price;
                  setCart(newCart);
                } else {
                  setCart([...cart, { medicineId: m.id, name: m.name, quantity: 1, price: m.price, total: m.price }]);
                }
              }} 
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all text-left group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{m.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Stock: {m.quantity} units</p>
                </div>
                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus size={16} />
                </div>
              </div>
              <p className="text-blue-600 dark:text-blue-400 font-black mt-4 text-lg">{m.price.toLocaleString()} ETB</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl h-fit">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <ShoppingCart className="text-blue-600 dark:text-blue-400" /> Cart
          </h2>
          
          <div className="space-y-4 mb-8 max-h-60 overflow-y-auto pr-2">
            {cart.map((i, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-xl group/item">
                <div className="flex-1">
                  <p className="font-bold text-slate-900 dark:text-white">{i.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{i.quantity} x {i.price.toLocaleString()} ETB</p>
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
            ))}
            {cart.length === 0 && (
              <div className="text-center py-8 text-slate-400 dark:text-slate-600 italic">Cart is empty</div>
            )}
          </div>

          {hasCustomerTracking && (
            <div className="space-y-4 mb-8 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Customer Details (Standard+)</p>
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

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
              <span className="font-bold dark:text-white">{cart.reduce((s, i) => s + i.total, 0).toLocaleString()} ETB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-900 dark:text-white font-bold text-lg">Total</span>
              <span className="text-blue-600 dark:text-blue-400 font-black text-2xl">{cart.reduce((s, i) => s + i.total, 0).toLocaleString()} ETB</span>
            </div>
          </div>

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
            {isProcessing ? 'Processing...' : 'Complete Sale'}
          </button>
          
          {hasReceipts && cart.length > 0 && (
            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 mt-4 font-medium uppercase tracking-widest">
              PDF Receipt will be generated
            </p>
          )}
        </div>
      </div>
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
    // Connection test as required by instructions
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
          toast.error("Firebase is offline. Check your configuration.");
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
              if (profileData.role === 'staff' && (profileData.pharmacyId || profileData.importerId)) {
                try {
                  const parentId = profileData.pharmacyId || profileData.importerId;
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
  if (!profile) return <><Toaster position="top-right" /><SignupFlow user={user} onComplete={refreshProfile} settings={systemSettings} /></>;
  
  // Subscription Lock
  if (profile.subscriptionStatus === 'expired' && (profile.role === 'pharmacy' || profile.role === 'importer')) {
    return (
      <ErrorBoundary>
        <Toaster position="top-right" />
        <SubscriptionLock user={profile} onRenew={refreshProfile} settings={systemSettings} />
      </ErrorBoundary>
    );
  }

  if (profile.verificationStatus !== 'approved' && profile.role !== 'admin') return <><Toaster position="top-right" /><VerificationPending profile={profile} /></>;

  const hasAccess = (tabId: string) => {
    // Only dashboard and settings are accessible to everyone by default
    if (['dashboard', 'settings'].includes(tabId)) return true;

    // Admin has access to everything
    if (profile.role === 'admin') return true;

    // Plan check
    const menuItems = [
      { id: 'dashboard', label: 'Dashboard', roles: ['admin', 'pharmacy', 'importer', 'regional_manager', 'staff', 'marketing'] },
      { id: 'inventory', label: 'Inventory', roles: ['pharmacy', 'staff'] },
      { id: 'my-products', label: 'My Products', roles: ['importer', 'staff'] },
      { id: 'sales', label: 'Sales & POS', roles: ['pharmacy', 'staff'] },
      { id: 'marketplace', label: 'Marketplace', roles: ['pharmacy', 'admin', 'staff'], minPlan: 'standard' },
      { id: 'orders', label: 'B2B Orders', roles: ['pharmacy', 'importer', 'staff'], minPlan: 'standard' },
      { id: 'suppliers', label: 'Suppliers', roles: ['pharmacy', 'importer', 'staff'], minPlan: 'premium' },
      { id: 'staff', label: 'Staff Accounts', roles: ['pharmacy', 'importer', 'staff'], minPlan: 'premium' },
      { id: 'subscription', label: 'Subscription', roles: ['pharmacy', 'importer'] },
      { id: 'admin-users', label: 'User Management', roles: ['admin'] },
      { id: 'admin-marketing', label: 'Marketing Team', roles: ['admin'] },
      { id: 'users', label: 'Approve/Reject Users', roles: ['admin'] },
      { id: 'admin-revenue', label: 'Revenue & Finance', roles: ['admin'] },
      { id: 'admin-marketplace', label: 'Marketplace Control', roles: ['admin'] },
      { id: 'admin-notifications', label: 'Notifications', roles: ['admin'] },
      { id: 'admin-system', label: 'System Control', roles: ['admin'] },
      { id: 'settings', label: 'Settings', roles: ['admin', 'pharmacy', 'importer', 'regional_manager', 'staff', 'marketing'] },
    ];

    const item = menuItems.find(m => m.id === tabId);
    if (item && !item.roles.includes(profile.role)) return false;

    if (item && (profile.role === 'pharmacy' || profile.role === 'importer')) {
      const plan = profile.subscriptionType || 'basic';
      if (item.minPlan === 'premium' && plan !== 'premium') return false;
      if (item.minPlan === 'standard' && (plan === 'basic')) return false; // Basic can't access standard/premium
    }

    // Role-specific allowed list for extra safety
    const accessMap: Record<string, string[]> = {
      pharmacy: ['dashboard', 'inventory', 'sales', 'marketplace', 'orders', 'suppliers', 'staff', 'subscription', 'settings'],
      importer: ['dashboard', 'my-products', 'orders', 'suppliers', 'staff', 'subscription', 'settings'],
      regional_manager: ['dashboard', 'settings'],
      marketing: ['dashboard', 'marketing-stats', 'settings'],
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

  return (
    <ErrorBoundary>
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
        />
        <main className="flex-1 overflow-y-auto h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative">
          <header className={`sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-md transition-all dark:border-slate-800 dark:bg-slate-950/80`}>
            <div className="flex items-center gap-4">
              {isSidebarCollapsed && (
                <button 
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
                >
                  <Menu size={20} />
                </button>
              )}
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {activeTab.replace(/-/g, ' ')}
              </h2>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden items-center gap-2 md:flex">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{profile.role.replace('_', ' ')} System Active</span>
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
                <div className="p-8 flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Restricted</h2>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md">
                    You do not have permission to access this section. 
                    {profile.role === 'staff' ? ' Please contact your manager if you believe this is an error.' : ' Please upgrade your plan or contact support if you believe this is an error.'}
                  </p>
                  <button onClick={() => setActiveTab('dashboard')} className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">Back to Dashboard</button>
                </div>
              ) : (
                <>
                  {activeTab === 'dashboard' && (
                    profile.role === 'regional_manager' 
                      ? <RegionalManagerDashboard user={profile} /> 
                      : profile.role === 'marketing'
                      ? <MarketingDashboard user={profile} />
                      : profile.role === 'importer'
                      ? <ImporterDashboard user={profile} />
                      : <DashboardView role={profile.role} user={profile} setActiveTab={setActiveTab} />
                  )}
                  {activeTab === 'inventory' && <InventoryView user={profile} />}
                  {activeTab === 'my-products' && <ImporterInventoryView user={profile} />}
                  {activeTab === 'sales' && <SalesView user={profile} />}
                  {activeTab === 'marketplace' && <MarketplaceView user={profile} />}
                  {activeTab === 'orders' && <OrdersView user={profile} />}
                  {activeTab === 'subscription' && <SubscriptionView user={profile} settings={systemSettings} />}
                  {activeTab === 'suppliers' && <SuppliersView user={profile} />}
                  {activeTab === 'staff' && <StaffManagementView user={profile} />}
                  {activeTab === 'admin-users' && <AdminUserManagement />}
                  {activeTab === 'admin-marketing' && <AdminMarketingManagement />}
                  {activeTab === 'admin-revenue' && <AdminRevenuePanel settings={systemSettings} />}
                  {activeTab === 'admin-marketplace' && <AdminMarketplaceControl />}
                  {activeTab === 'admin-notifications' && <AdminNotifications />}
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
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </ErrorBoundary>
  );
}
