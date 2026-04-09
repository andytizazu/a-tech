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
  sendPasswordResetEmail
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
  Users,
  MapPin,
  ChevronRight,
  ShieldCheck,
  CreditCard,
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
  Phone
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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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
  // We don't throw here to avoid crashing the app, but we log it as required.
  toast.error(`Permission Denied: ${operationType} on ${path}`);
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
  if (user.email === 'andualemtyb@gmail.com') {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      const adminProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        role: 'admin',
        displayName: user.displayName || 'Super Admin',
        verificationStatus: 'approved',
        createdAt: Date.now()
      };
      await setDoc(userRef, adminProfile);
    } else {
      const data = userDoc.data() as UserProfile;
      if (data.role !== 'admin' || data.verificationStatus !== 'approved') {
        await updateDoc(userRef, { 
          role: 'admin', 
          verificationStatus: 'approved' 
        });
      }
    }
  }
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
      
      const result = await signInWithEmailAndPassword(auth, email, inputPassword);
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
      }
      toast.error(message, { id: authToast });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await bootstrapAdmin(user);
      onLoginSuccess(user);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        // User closed the popup or cancelled the request, no need to show an error toast
        console.log('Login popup closed or cancelled by user');
        return;
      }
      console.error(error);
      toast.error('Google login failed');
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }
    const resetToast = toast.loading('Sending reset email...');
    try {
      await sendPasswordResetEmail(auth, email);
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
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        user = result.user;
        toast.success('Account created!', { id: authToast });
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        user = result.user;
        toast.success('Welcome back!', { id: authToast });
      }
      await bootstrapAdmin(user);
      onLoginSuccess(user);
    } catch (error: any) {
      console.error('Auth error:', error);
      let message = 'Authentication failed';
      if (error.code === 'auth/invalid-credential') {
        message = 'Invalid email or password. Please try again.';
      } else if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password.';
      } else if (error.code === 'auth/email-already-in-use') {
        message = 'An account already exists with this email. Switching to Sign In...';
        setIsSignUp(false); // Automatically switch to sign in mode
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.';
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
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                placeholder="name@company.com"
              />
            </div>
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
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-bold shadow-sm active:scale-95"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Google Account
        </button>

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

const SignupFlow = ({ user, onComplete }: { user: any, onComplete: () => void }) => {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploading(true);
      // Simulate upload delay
      setTimeout(() => {
        const files = Array.from(e.target.files as FileList);
        const newFiles = files.map(f => f.name);
        setUploadedFiles(prev => [...prev, ...newFiles]);
        setUploading(false);
        toast.success('Files attached successfully');
      }, 1500);
    }
  };

  const handleComplete = async () => {
    if (step === 4 && uploadedFiles.length === 0) {
      toast.error('Please upload at least one document');
      return;
    }

    const completeToast = toast.loading('Submitting application...');
    try {
      let marketingId = '';
      if (formData.referredBy) {
        const q = query(collection(db, 'users'), where('role', '==', 'marketing'), where('promoCode', '==', formData.referredBy));
        const snap = await getDocs(q);
        if (!snap.empty) {
          marketingId = snap.docs[0].id;
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
        referredBy: formData.referredBy || undefined,
        marketingId: marketingId || undefined,
        subscriptionType: formData.subscriptionType,
        subscriptionStatus: 'active',
        verificationStatus: 'pending',
        verificationDocs: uploadedFiles.map(name => `https://picsum.photos/seed/${name}/400/600`),
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
                  <input type="text" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{formData.role === 'pharmacy' ? 'Pharmacy Name' : 'Company Name'}</label>
                  <input type="text" value={formData.role === 'pharmacy' ? formData.pharmacyName : formData.importerName} 
                    onChange={e => setFormData({...formData, [formData.role === 'pharmacy' ? 'pharmacyName' : 'importerName']: e.target.value})} 
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1 relative">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Country</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search country..."
                      value={formData.country || countrySearch} 
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
                  <input type="text" value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">City</label>
                  <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Promo Code (Optional)</label>
                  <input type="text" value={formData.referredBy} onChange={e => setFormData({...formData, referredBy: e.target.value.toUpperCase()})} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" placeholder="e.g. ATECH123" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Subscription Plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'basic', name: 'Basic', price: 'Free', features: ['100 Meds', 'Reports'] },
                  { id: 'standard', name: 'Standard', price: '499 ETB', features: ['Unlimited', 'Dashboard'] },
                  { id: 'premium', name: 'Premium', price: '999 ETB', features: ['AI Insights', 'Support'] },
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
                      {f}
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

const AdminVerificationView = () => {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [subscriptionRequests, setSubscriptionRequests] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // Listen for all users to catch those with missing or pending status
    const q1 = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsub1 = onSnapshot(q1, (snapshot) => {
      setAllUsers(snapshot.docs.map(doc => doc.data() as UserProfile));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users (verification)'));

    // Listen for subscription change requests
    const q2 = query(collection(db, 'users'), where('pendingSubscriptionType', 'in', ['basic', 'standard', 'premium']));
    const unsub2 = onSnapshot(q2, (snapshot) => {
      setSubscriptionRequests(snapshot.docs.map(doc => doc.data() as UserProfile));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users (subscriptions)'));

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
        await updateDoc(doc(db, 'users', uid), { 
          subscriptionType: plan as any,
          pendingSubscriptionType: null 
        });
        toast.success('Subscription updated');
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
    return (showAll || isPending) && matchesSearch;
  });

  const filteredSubscriptions = subscriptionRequests.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.pharmacyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.importerName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Verifications & Requests</h1>
          <p className="text-slate-500 dark:text-slate-400">Review new accounts and subscription changes.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
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
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {showAll ? 'All Registered Accounts' : 'New Account Verifications'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {showAll ? 'Browse all accounts in the system.' : 'Review and verify new business accounts.'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredPending.map(user => (
            <div key={user.uid} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center font-bold">{(user.displayName || '?').charAt(0)}</div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{user.pharmacyName || user.importerName || user.displayName}</h3>
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
                  <div key={i} className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Document {i + 1}</p>
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800 aspect-[3/4]">
                      <img src={d} alt={`Doc ${i+1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <a href={d} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 text-sm font-bold flex items-center gap-1 hover:underline">
                      <ExternalLink size={14} /> View Full Size
                    </a>
                  </div>
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

const SubscriptionView = ({ user }: { user: UserProfile }) => {
  const plans = [
    { 
      id: 'basic', 
      name: 'Basic', 
      price: 'Free / 100 ETB', 
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
      price: '1,200 ETB/mo', 
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
      price: '3,000 ETB/mo', 
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

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Subscription Plan</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your business subscription and features.</p>
      </div>

      <div className="bg-blue-600 rounded-3xl p-8 text-white mb-12 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl shadow-blue-100 dark:shadow-none">
        <div>
          <p className="text-blue-100 font-medium mb-1 uppercase tracking-wider text-xs">Current Plan</p>
          <h2 className="text-4xl font-black uppercase">{user.subscriptionType || 'Basic'}</h2>
          <p className="text-blue-100 mt-2">Status: <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm font-bold capitalize">{user.subscriptionStatus || 'Active'}</span></p>
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

const MarketplaceView = ({ user }: { user: UserProfile }) => {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [cart, setCart] = useState<{ product: MarketplaceProduct, quantity: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [distanceKm, setDistanceKm] = useState(0);

  const PAGE_SIZE = 12;
  const DELIVERY_RATE_PER_KM = 50; // 50 ETB per km
  const deliveryFee = deliveryMethod === 'delivery' ? distanceKm * DELIVERY_RATE_PER_KM : 0;

  useEffect(() => {
    if (!user.country) return;
    // Filter by country for pharmacies
    const q = query(
      collection(db, 'products'), 
      where('country', '==', user.country),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketplaceProduct)));
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));
    return unsub;
  }, [user.country]);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const q = query(
        collection(db, 'products'), 
        where('country', '==', user.country),
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
      if (distanceKm <= 0) {
        toast.error('Please enter a valid distance');
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
        const order: Omit<Order, 'id'> = {
          pharmacyId: user.uid,
          pharmacyName: user.pharmacyName || user.displayName,
          pharmacyCreatedAt: user.createdAt,
          marketingId: user.marketingId,
          importerId: importerId,
          importerName: items[0].product.importerName,
          items: items.map(i => ({
            productId: i.product.id,
            name: i.product.name,
            quantity: i.quantity,
            price: i.product.price,
            total: i.product.price * i.quantity
          })),
          totalAmount: itemsTotal + deliveryFee,
          commissionAmount: itemsTotal * 0.03, // Default 3% commission
          status: 'pending',
          country: user.country || 'Global',
          createdAt: Date.now(),
          deliveryMethod,
          deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : undefined,
          distanceKm: deliveryMethod === 'delivery' ? distanceKm : undefined,
          deliveryFee: deliveryMethod === 'delivery' ? deliveryFee : 0
        };
        await addDoc(collection(db, 'orders'), order);
      }
      setCart([]);
      setDeliveryAddress('');
      setDistanceKm(0);
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
                  <div className="space-y-3">
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
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Distance (km)</label>
                      <input 
                        type="number" 
                        value={distanceKm} 
                        onChange={e => setDistanceKm(Number(e.target.value))}
                        placeholder="0"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Delivery Fee ({DELIVERY_RATE_PER_KM} ETB/km)</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{deliveryFee.toLocaleString()} ETB</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mb-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white">Total Amount</span>
                <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                  {(cart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0) + deliveryFee).toLocaleString()} ETB
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
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: 'Medicine',
    price: 0,
    minOrderQuantity: 10,
    stockQuantity: 100
  });

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Marketplace Listings</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your products visible to pharmacies in {user.country}.</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none flex items-center gap-2">
          <Plus size={20} /> List New Product
        </button>
      </div>

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

    const unsubSettings = onSnapshot(doc(db, 'system_settings', 'main'), (s) => {
      if (s.exists()) setSettings(s.data() as SystemSettings);
    });

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
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  const PAGE_SIZE = 20;

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
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const unsubSettings = onSnapshot(doc(db, 'system_settings', 'main'), (s) => {
      if (s.exists()) setSettings(s.data() as SystemSettings);
    });

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
      await updateDoc(doc(db, 'users', uid), { verificationStatus: status });
      toast.success(`User status updated to ${status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleSubscriptionUpdate = async (uid: string, type: 'basic' | 'standard' | 'premium', status: 'active' | 'expired') => {
    try {
      const userToUpdate = users.find(u => u.uid === uid);
      const isUpgrade = userToUpdate && userToUpdate.subscriptionType !== type && status === 'active';
      
      await updateDoc(doc(db, 'users', uid), { 
        subscriptionType: type,
        subscriptionStatus: status,
        pendingSubscriptionType: null
      });

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

  const filteredUsers = users.filter(u => {
    const matchesFilter = filter === 'all' || u.role === filter;
    const matchesSearch = u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (u.pharmacyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (u.importerName || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage pharmacies, importers, and staff accounts.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by email or name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 w-full md:w-64 dark:text-white"
            />
          </div>
          <div className="flex gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
            {(['all', 'pharmacy', 'importer', 'regional_manager'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filter === f ? 'bg-blue-600 text-white shadow-md shadow-blue-100 dark:shadow-none' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}s
              </button>
            ))}
          </div>
        </div>
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
                <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
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
                            value={u.subscriptionType || 'basic'} 
                            onChange={(e) => handleSubscriptionUpdate(u.uid, e.target.value as any, u.subscriptionStatus || 'active')}
                            className="text-[10px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                          >
                            <option value="basic">BASIC</option>
                            <option value="standard">STANDARD</option>
                            <option value="premium">PREMIUM</option>
                          </select>
                          {u.pendingSubscriptionType && (
                            <button 
                              onClick={() => handleSubscriptionUpdate(u.uid, u.pendingSubscriptionType as any, 'active')}
                              className="text-[8px] font-bold text-white bg-amber-500 px-1 rounded hover:bg-amber-600 transition-colors"
                              title={`Approve upgrade to ${u.pendingSubscriptionType}`}
                            >
                              APPROVE {u.pendingSubscriptionType.toUpperCase()}
                            </button>
                          )}
                        </div>
                        <select 
                          value={u.subscriptionStatus || 'expired'} 
                          onChange={(e) => handleSubscriptionUpdate(u.uid, u.subscriptionType || 'basic', e.target.value as any)}
                          className={`text-[9px] font-bold border rounded px-1 py-0.5 outline-none ${u.subscriptionStatus === 'active' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-200 dark:border-red-800'}`}
                        >
                          <option value="active">ACTIVE</option>
                          <option value="expired">EXPIRED</option>
                        </select>
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
    </div>
  );
};

const AdminRevenuePanel = () => {
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
  const subscriptionIncome = activeSubs * 500; // Mock price
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

  const PAGE_SIZE = 20;

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

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Marketplace Control</h1>
          <p className="text-slate-500 dark:text-slate-400">Monitor and manage all medicine listings.</p>
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
            ) : products.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No products listed.</td></tr>
            ) : (
              products.map((p) => (
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_settings', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as SystemSettings);
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
          maxMedicinesPerPlan: { basic: 100, standard: 500, premium: 2000 },
          featuresEnabled: { marketplace: true, subscriptions: true, analytics: true },
          updatedAt: Date.now()
        };
        setDoc(doc(db, 'system_settings', 'main'), defaultSettings);
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'system_settings/main'));
    return unsub;
  }, []);

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      await updateDoc(doc(db, 'system_settings', 'main'), {
        ...newSettings,
        updatedAt: Date.now()
      });
      toast.success('System settings updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'system_settings/main');
    }
  };

  if (loading || !settings) return <div className="p-8 text-center text-slate-500 italic">Loading settings...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">System Control</h1>
      
      <div className="space-y-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><Mail size={20} className="text-blue-600" /> Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Support Email</label>
              <input 
                type="email" 
                value={settings.contactEmail}
                onChange={(e) => updateSettings({ contactEmail: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Support Phone</label>
              <input 
                type="text" 
                value={settings.contactPhone}
                onChange={(e) => updateSettings({ contactPhone: e.target.value })}
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
                  value={settings.globalCommissionPercent}
                  onChange={(e) => updateSettings({ globalCommissionPercent: Number(e.target.value) })}
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
                value={settings.marketingCommission?.durationMonths || 12}
                onChange={(e) => updateSettings({ marketingCommission: { ...settings.marketingCommission, durationMonths: Number(e.target.value) } })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 italic">How many months a marketing member earns from a referral.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Order Commission (%)</label>
              <input 
                type="number" 
                value={settings.marketingCommission?.orderCommissionPercent || 1}
                onChange={(e) => updateSettings({ marketingCommission: { ...settings.marketingCommission, orderCommissionPercent: Number(e.target.value) } })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 italic">Percentage of B2B order totals paid to referrer.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Basic Plan Referral (ETB)</label>
              <input 
                type="number" 
                value={settings.marketingCommission?.basicPlanRate || 50}
                onChange={(e) => updateSettings({ marketingCommission: { ...settings.marketingCommission, basicPlanRate: Number(e.target.value) } })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Standard Plan Referral (ETB)</label>
              <input 
                type="number" 
                value={settings.marketingCommission?.standardPlanRate || 100}
                onChange={(e) => updateSettings({ marketingCommission: { ...settings.marketingCommission, standardPlanRate: Number(e.target.value) } })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Premium Plan Referral (ETB)</label>
              <input 
                type="number" 
                value={settings.marketingCommission?.premiumPlanRate || 250}
                onChange={(e) => updateSettings({ marketingCommission: { ...settings.marketingCommission, premiumPlanRate: Number(e.target.value) } })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><ShieldCheck size={20} className="text-blue-600" /> Feature Flags</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(settings.featuresEnabled).map(([feature, enabled]) => (
              <button 
                key={feature}
                onClick={() => updateSettings({ featuresEnabled: { ...settings.featuresEnabled, [feature]: !enabled } })}
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
          <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><Package size={20} className="text-blue-600" /> Inventory Limits</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(settings.maxMedicinesPerPlan).map(([plan, limit]) => (
              <div key={plan}>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">{plan} Plan Limit</label>
                <input 
                  type="number" 
                  value={limit}
                  onChange={(e) => updateSettings({ maxMedicinesPerPlan: { ...settings.maxMedicinesPerPlan, [plan]: Number(e.target.value) } })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
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
  pharmacist: ['dashboard', 'inventory', 'sales', 'marketplace', 'orders', 'settings'],
  cashier: ['dashboard', 'sales', 'settings'],
  inventory: ['dashboard', 'inventory', 'marketplace', 'orders', 'settings'],
};

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  role, 
  user, 
  onSignOut,
  toggleTheme,
  settings
}: { 
  activeTab: string, 
  setActiveTab: (t: string) => void, 
  role: UserRole, 
  user: UserProfile, 
  onSignOut: () => void,
  toggleTheme: () => void,
  settings: SystemSettings | null
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'pharmacy', 'importer', 'regional_manager', 'staff', 'marketing'] },
    { id: 'inventory', label: 'Inventory', icon: Package, roles: ['pharmacy', 'staff'] },
    { id: 'importer-inventory', label: 'My Products', icon: Package, roles: ['importer'] },
    { id: 'sales', label: 'Sales & POS', icon: ShoppingCart, roles: ['pharmacy', 'staff'] },
    { id: 'marketplace', label: 'Marketplace', icon: Truck, roles: ['pharmacy', 'admin', 'staff'], minPlan: 'standard' },
    { id: 'orders', label: 'B2B Orders', icon: ShoppingCart, roles: ['pharmacy', 'importer', 'staff'], minPlan: 'standard' },
    { id: 'suppliers', label: 'Suppliers', icon: Building2, roles: ['pharmacy'], minPlan: 'premium' },
    { id: 'staff', label: 'Staff Accounts', icon: Users, roles: ['pharmacy'], minPlan: 'premium' },
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
    <div className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 h-screen flex flex-col sticky top-0 transition-colors duration-300 overflow-y-auto scrollbar-hide">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8 group">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100 dark:shadow-[0_0_20px_rgba(37,99,235,0.5)] dark:shadow-blue-900/50 transition-all duration-500 group-hover:scale-110">
            <Package className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">A-Tech</span>
        </div>
        <nav className="space-y-1">
          {filteredMenuItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-bold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'}`}>
              <item.icon size={20} /> {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-6 border-t border-slate-100 dark:border-slate-800">
        {settings && (
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
          className="w-full flex items-center gap-3 px-4 py-2 mb-4 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors text-sm font-bold"
        >
          {user.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {user.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">{(user.displayName || '?').charAt(0)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.displayName}</p>
            <div className="flex items-center gap-1 text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">
              <MapPin size={10} /> {user.country || 'Global'}
            </div>
          </div>
        </div>
        <button onClick={onSignOut} className="w-full flex items-center gap-3 px-4 py-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-bold"><LogOut size={18} /> Sign Out</button>
      </div>
    </div>
  );
};

const DashboardView = ({ role, user, setActiveTab }: { role: UserRole, user: UserProfile, setActiveTab: (t: string) => void }) => {
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
      // Pharmacy or Importer
      const orderField = role === 'pharmacy' ? 'pharmacyId' : 'importerId';
      const qOrders = query(collection(db, 'orders'), where(orderField, '==', user.uid));
      
      const unsubOrders = onSnapshot(qOrders, (snapshot) => {
        const orders = snapshot.docs.map(d => d.data() as Order);
        // For importers, revenue comes from orders. For pharmacies, orders are expenses.
        if (role === 'importer') {
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

      if (role === 'pharmacy') {
        const qMedicines = query(collection(db, 'medicines'), where('pharmacyId', '==', user.uid));
        const unsubMed = onSnapshot(qMedicines, (snapshot) => {
          const meds = snapshot.docs.map(d => d.data() as Medicine);
          const lowStock = meds.filter(m => m.quantity <= (m.lowStockThreshold || 10)).length;
          setStats(prev => ({ ...prev, lowStock, totalMedicines: meds.length }));
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'medicines'));
        unsubs.push(unsubMed);

        const qSales = query(collection(db, 'sales'), where('pharmacyId', '==', user.uid));
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
    { id: 'sales', label: isPharmacy ? 'POS Revenue' : 'My Revenue', value: `${stats.revenue.toLocaleString()} ETB`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { id: 'inventory', label: isPharmacy ? 'Inventory' : 'My Orders', value: isPharmacy ? `${stats.totalMedicines} Items` : stats.orders.toString(), icon: isPharmacy ? Package : ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'inventory', label: 'Low Stock', value: `${stats.lowStock} Items`, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'sales', label: isPharmacy ? 'Total Sales' : 'Marketplace', value: isPharmacy ? stats.totalSales.toString() : 'Live', icon: isPharmacy ? ShoppingCart : Globe, color: 'text-purple-600', bg: 'bg-purple-50' },
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
                  onClick={() => setActiveTab('importer-inventory')}
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
  const [newMedicine, setNewMedicine] = useState<Partial<Medicine>>({
    name: '', category: 'Medicine', price: 0, costPrice: 0, quantity: 0, batchNumber: '', expiryDate: '', lowStockThreshold: 5, supplier: ''
  });

  const plan = user.subscriptionType || 'basic';
  const medicineLimit = 200;

  useEffect(() => {
    if (!user.uid) return;
    const q = query(collection(db, 'medicines'), where('pharmacyId', '==', user.uid));
    return onSnapshot(q, 
      (s) => setMedicines(s.docs.map(d => ({ id: d.id, ...d.data() } as Medicine))),
      (error) => handleFirestoreError(error, OperationType.LIST, 'medicines')
    );
  }, [user.uid]);

  const handleAddMedicine = async () => {
    if (plan === 'basic' && medicines.length >= medicineLimit) {
      toast.error(`Basic plan limit reached (${medicineLimit} medicines). Please upgrade to Standard for unlimited listings.`);
      return;
    }

    try {
      await addDoc(collection(db, 'medicines'), {
        ...newMedicine,
        pharmacyId: user.uid,
        createdAt: Date.now()
      });
      setIsAdding(false);
      setNewMedicine({ name: '', category: 'Medicine', price: 0, costPrice: 0, quantity: 0, batchNumber: '', expiryDate: '', lowStockThreshold: 5, supplier: '' });
      toast.success('Medicine added to inventory');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'medicines');
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

      {isAdding && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl mb-8">
          <h2 className="text-xl font-bold mb-6 dark:text-white">New Medicine Entry</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Medicine Name</label>
              <input type="text" value={newMedicine.name} onChange={e => setNewMedicine({...newMedicine, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" placeholder="e.g. Paracetamol" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Category</label>
              <select value={newMedicine.category} onChange={e => setNewMedicine({...newMedicine, category: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500">
                <option>Medicine</option>
                <option>Surgical</option>
                <option>Equipment</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Batch Number</label>
              <input type="text" value={newMedicine.batchNumber} onChange={e => setNewMedicine({...newMedicine, batchNumber: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" placeholder="BN-12345" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Selling Price (ETB)</label>
              <input type="number" value={newMedicine.price} onChange={e => setNewMedicine({...newMedicine, price: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Cost Price (ETB)</label>
              <input type="number" value={newMedicine.costPrice} onChange={e => setNewMedicine({...newMedicine, costPrice: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Quantity</label>
              <input type="number" value={newMedicine.quantity} onChange={e => setNewMedicine({...newMedicine, quantity: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Expiry Date</label>
              <input type="date" value={newMedicine.expiryDate} onChange={e => setNewMedicine({...newMedicine, expiryDate: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Low Stock Alert at</label>
              <input type="number" value={newMedicine.lowStockThreshold} onChange={e => setNewMedicine({...newMedicine, lowStockThreshold: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
            </div>
            {plan === 'premium' && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Supplier (Premium Only)</label>
                <input type="text" value={newMedicine.supplier} onChange={e => setNewMedicine({...newMedicine, supplier: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" placeholder="Supplier Name" />
              </div>
            )}
          </div>
          <div className="mt-8 flex justify-end gap-4">
            <button onClick={() => setIsAdding(false)} className="px-6 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">Cancel</button>
            <button onClick={handleAddMedicine} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none">Save Medicine</button>
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
                      <button className="text-slate-400 hover:text-blue-600 transition-colors"><Edit size={18} /></button>
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
  const [newStaff, setNewStaff] = useState({ name: '', role: 'pharmacist' });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(DEFAULT_PERMISSIONS['pharmacist']);
  const [generatedCreds, setGeneratedCreds] = useState<{username: string, password: string} | null>(null);

  const plan = user.subscriptionType || 'basic';
  const canCustomize = plan !== 'basic';
  const isPremium = plan === 'premium';

  useEffect(() => {
    if (!user.uid) return;
    const q = query(collection(db, 'users'), where('pharmacyId', '==', user.uid));
    return onSnapshot(q, (s) => setStaff(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user.uid]);

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

      const pharmacySlug = slugify(user.pharmacyName || 'pharmacy');
      const nameSlug = slugify(newStaff.name, '.');
      let username = `${nameSlug}@${pharmacySlug}`;
      let email = `${nameSlug}.${pharmacySlug}@staff.atech.com`;
      const password = generatePassword();

      console.log('[Staff Creation Debug]', { 
        name: newStaff.name,
        pharmacy: user.pharmacyName,
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
        uid: staffUid,
        username,
        password,
        email,
        pharmacyId: user.uid,
        pharmacyName: user.pharmacyName,
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
                value={editingStaff ? editingStaff.name : newStaff.name} 
                onChange={e => editingStaff ? setEditingStaff({...editingStaff, name: e.target.value}) : setNewStaff({...newStaff, name: e.target.value})} 
                className={`w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500 ${editingStaff ? 'bg-slate-50 dark:bg-slate-900 cursor-not-allowed' : ''}`} 
                placeholder="e.g. Abebe Kebede"
                disabled={!!editingStaff}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Role</label>
              <select 
                value={editingStaff ? editingStaff.staffRole : newStaff.role} 
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
    return onSnapshot(q, (s) => setMembers(s.docs.map(d => ({ id: d.id, ...d.data() }))));
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
    const unsubReferrals = onSnapshot(q, (s) => setReferrals(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    const unsubSettings = onSnapshot(doc(db, 'system_settings', 'main'), (s) => {
      if (s.exists()) setSettings(s.data() as SystemSettings);
    });

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
  
  const plan = user.subscriptionType || 'basic';
  const hasCustomerTracking = plan !== 'basic';
  const hasReceipts = plan !== 'basic';

  useEffect(() => {
    if (!user.uid) return;
    const q = query(collection(db, 'medicines'), where('pharmacyId', '==', user.uid));
    return onSnapshot(q, 
      (s) => setMedicines(s.docs.map(d => ({ id: d.id, ...d.data() } as Medicine))),
      (error) => handleFirestoreError(error, OperationType.LIST, 'medicines')
    );
  }, [user.uid]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    // Check stock availability first
    for (const item of cart) {
      const medicine = medicines.find(m => m.id === item.medicineId);
      if (!medicine || medicine.quantity < item.quantity) {
        toast.error(`Insufficient stock for ${item.name}`);
        return;
      }
    }

    const total = cart.reduce((s, i) => s + i.total, 0);
    const sale = { 
      pharmacyId: user.uid, 
      items: cart, 
      totalAmount: total, 
      paymentMethod: 'cash', 
      createdAt: Date.now(),
      customerName: hasCustomerTracking ? customerName : null,
      customerPhone: hasCustomerTracking ? customerPhone : null
    };
    
    try {
      // 1. Record the sale
      const docRef = await addDoc(collection(db, 'sales'), sale);

      // 2. Update medicine quantities
      const updatePromises = cart.map(item => {
        const medicineRef = doc(db, 'medicines', item.medicineId);
        return updateDoc(medicineRef, {
          quantity: increment(-item.quantity)
        });
      });
      await Promise.all(updatePromises);

      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      toast.success('Sale recorded and stock updated!');
      
      if (hasReceipts) {
        downloadReceipt({ ...sale, id: docRef.id } as Sale, user.displayName || 'Pharmacy');
        toast.success('Receipt generated (PDF)');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sales');
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
            disabled={cart.length === 0}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} /> Complete Sale
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

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_settings', 'main'), (s) => {
      if (s.exists()) setSystemSettings(s.data() as SystemSettings);
    });
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
          profileUnsub = onSnapshot(doc(db, 'users', u.uid), (doc) => {
            if (doc.exists()) {
              setProfile(doc.data() as UserProfile);
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
          setProfile(userDoc.data() as UserProfile);
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Toaster position="top-right" /><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return <><Toaster position="top-right" /><Login onLoginSuccess={setUser} /></>;
  if (!profile) return <><Toaster position="top-right" /><SignupFlow user={user} onComplete={refreshProfile} /></>;
  if (profile.verificationStatus !== 'approved' && profile.role !== 'admin') return <><Toaster position="top-right" /><VerificationPending profile={profile} /></>;

  const hasAccess = (tabId: string) => {
    if (profile.role !== 'staff') return true;
    if (profile.permissions) return profile.permissions.includes(tabId);
    if (profile.staffRole) {
      const defaults = DEFAULT_PERMISSIONS[profile.staffRole] || ['dashboard', 'settings'];
      return defaults.includes(tabId);
    }
    return ['dashboard', 'settings'].includes(tabId);
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
        />
        <main className="flex-1 overflow-y-auto h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
              {!hasAccess(activeTab) ? (
                <div className="p-8 flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Restricted</h2>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md">You do not have permission to access this section. Please contact your pharmacy manager if you believe this is an error.</p>
                  <button onClick={() => setActiveTab('dashboard')} className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">Back to Dashboard</button>
                </div>
              ) : (
                <>
                  {activeTab === 'dashboard' && (
                    profile.role === 'regional_manager' 
                      ? <RegionalManagerDashboard user={profile} /> 
                      : profile.role === 'marketing'
                      ? <MarketingDashboard user={profile} />
                      : <DashboardView role={profile.role} user={profile} setActiveTab={setActiveTab} />
                  )}
                  {activeTab === 'inventory' && <InventoryView user={profile} />}
                  {activeTab === 'importer-inventory' && <ImporterInventoryView user={profile} />}
                  {activeTab === 'sales' && <SalesView user={profile} />}
                  {activeTab === 'marketplace' && <MarketplaceView user={profile} />}
                  {activeTab === 'orders' && <OrdersView user={profile} />}
                  {activeTab === 'subscription' && <SubscriptionView user={profile} />}
                  {activeTab === 'staff' && <StaffManagementView user={profile} />}
                  {activeTab === 'admin-users' && <AdminUserManagement />}
                  {activeTab === 'admin-marketing' && <AdminMarketingManagement />}
                  {activeTab === 'admin-revenue' && <AdminRevenuePanel />}
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
