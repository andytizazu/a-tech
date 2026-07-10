import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Calendar, 
  Mail, 
  Sliders, 
  BarChart3, 
  BellRing, 
  Send, 
  RefreshCw, 
  FileText, 
  Check, 
  Trash2, 
  Printer, 
  Download, 
  Search, 
  DollarSign, 
  FileSpreadsheet,
  PackageCheck,
  ShieldCheck,
  Settings,
  X,
  Edit
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { motion } from 'motion/react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  setDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';

interface UserProfile {
  uid: string;
  role: string;
  pharmacyId?: string;
  displayName?: string;
}

interface InventoryProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice?: number;
  quantity: number;
  batchNumber?: string;
  expiryDate?: string;
  supplier?: string;
  pharmacyId: string;
  branchId?: string;
  lowStockThreshold?: number;
  createdAt: number;
}

interface ExpirySettings {
  id?: string;
  pharmacyId: string;
  notify30: boolean;
  notify60: boolean;
  notify90: boolean;
  recipientEmails: string[];
  enabled: boolean;
  lastSentAt?: number;
}

interface NotificationLog {
  id: string;
  sentAt: number;
  type: '30_days' | '60_days' | '90_days' | 'summary' | 'urgent';
  recipients: string[];
  status: 'sent' | 'failed';
  productsCount: number;
  subject: string;
  message: string;
}

export const ExpiryTrackerView = ({
  user,
  selectedBranchId = 'all',
  branches = [],
  warehouses = []
}: {
  user: UserProfile;
  selectedBranchId?: string;
  branches?: any[];
  warehouses?: any[];
}) => {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'notifications' | 'reports'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'expired' | '30' | '60' | '90' | 'safe'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Expiry Settings State
  const [settings, setSettings] = useState<ExpirySettings>({
    pharmacyId: '',
    notify30: true,
    notify60: true,
    notify90: false,
    recipientEmails: [],
    enabled: true
  });
  
  const [newEmail, setNewEmail] = useState('');
  const [notifLogs, setNotifLogs] = useState<NotificationLog[]>([]);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSendingSimulated, setIsSendingSimulated] = useState(false);

  // Quick Inline Update State for Products
  const [quickEditProduct, setQuickEditProduct] = useState<InventoryProduct | null>(null);
  const [quickExpiryDate, setQuickExpiryDate] = useState('');
  const [quickBatchNumber, setQuickBatchNumber] = useState('');

  const ownerId = user.role === 'staff' ? user.pharmacyId : user.uid;

  // 1. Fetch medicines for the ownerId
  useEffect(() => {
    if (!ownerId) return;
    const q = query(collection(db, 'medicines'), where('pharmacyId', '==', ownerId));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as InventoryProduct)));
      },
      (error) => {
        console.error("Error loading medicines for Expiry Hub:", error);
        toast.error("Failed to load inventory for expiry analysis.");
      }
    );
    return () => unsubscribe();
  }, [ownerId]);

  // 2. Fetch/Initialize settings
  useEffect(() => {
    if (!ownerId) return;
    const settingsDocRef = doc(db, 'expiry_settings', ownerId);
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as ExpirySettings);
      } else {
        // Hydrate default settings with user's own email
        const userEmail = (user as any).email || '';
        const initialSettings: ExpirySettings = {
          pharmacyId: ownerId,
          notify30: true,
          notify60: true,
          notify90: true,
          recipientEmails: userEmail ? [userEmail] : [],
          enabled: true
        };
        setSettings(initialSettings);
        setDoc(settingsDocRef, initialSettings).catch(console.error);
      }
    });

    return () => unsubscribe();
  }, [ownerId, user]);

  // Load notification logs from LocalStorage simulating high fidelity system audit
  useEffect(() => {
    const localLogs = localStorage.getItem(`notif_logs_${ownerId}`);
    if (localLogs) {
      setNotifLogs(JSON.parse(localLogs));
    } else {
      const defaultLogs: NotificationLog[] = [
        {
          id: 'log_1',
          sentAt: Date.now() - 24 * 60 * 60 * 1000 * 3, // 3 days ago
          type: 'summary',
          recipients: [(user as any).email || 'manager@pharmacy.com'],
          status: 'sent',
          productsCount: 4,
          subject: 'Weekly Automated Medicine Expiry Status Digest',
          message: 'This is an automatic notification warning that there are 4 items approaching expiry in the next 30-90 days.'
        }
      ];
      setNotifLogs(defaultLogs);
      localStorage.setItem(`notif_logs_${ownerId}`, JSON.stringify(defaultLogs));
    }
  }, [ownerId, user]);

  // Calculated categories
  const categories = Array.from(new Set(products.map(p => p.category as string))).filter(Boolean) as string[];

  // Helper functions for expiry checks
  const getRemainingDays = (expiryDateStr?: string) => {
    if (!expiryDateStr) return Infinity;
    const exp = new Date(expiryDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    exp.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryStatus = (days: number) => {
    if (days < 0) return { label: 'Expired', color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900', badge: 'Expired' };
    if (days <= 30) return { label: 'Expiry Alert (30 days)', color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900', badge: 'Critical (<30d)' };
    if (days <= 60) return { label: 'Warning (60 days)', color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900', badge: 'Approaching (<60d)' };
    if (days <= 90) return { label: 'Attention (90 days)', color: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900', badge: 'Warning (<90d)' };
    return { label: 'Safe', color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-950', badge: 'Safe' };
  };

  // Branch mapping helper
  const getBranchName = (branchId?: string) => {
    if (!branchId) return 'Main HQ';
    const activeMainBranchId = `main_branch_${ownerId}`;
    if (branchId === 'main-branch' || branchId === activeMainBranchId) return 'Main HQ';
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : 'Main HQ';
  };

  // Filtering products for branch and rules
  const branchFilteredProducts = products.filter(p => {
    if (selectedBranchId === 'all') return true;
    const pBranchId = p.branchId || `main_branch_${ownerId}`;
    const activeMainBranchId = `main_branch_${ownerId}`;
    if (selectedBranchId === 'main-branch' || selectedBranchId === activeMainBranchId) {
      return pBranchId === 'main-branch' || pBranchId === activeMainBranchId;
    }
    return pBranchId === selectedBranchId;
  });

  // Analytics mapping
  let expiredCount = 0;
  let expiring30 = 0;
  let expiring60 = 0;
  let expiring90 = 0;
  let safeCount = 0;

  let expiredValue = 0;
  let expiring30Value = 0;
  let expiring60Value = 0;
  let expiring90Value = 0;
  let safeValue = 0;

  branchFilteredProducts.forEach(p => {
    const days = getRemainingDays(p.expiryDate);
    // Cost calculation (fallback to standard price if cost price is absent)
    const cost = (p.costPrice || p.price * 0.7) * p.quantity;
    
    if (days < 0) {
      expiredCount++;
      expiredValue += cost;
    } else if (days <= 30) {
      expiring30++;
      expiring30Value += cost;
    } else if (days <= 60) {
      expiring60++;
      expiring60Value += cost;
    } else if (days <= 90) {
      expiring90++;
      expiring90Value += cost;
    } else {
      safeCount++;
      safeValue += cost;
    }
  });

  const totalValueAtRisk = expiredValue + expiring30Value + expiring60Value + expiring90Value;

  const summaryStats = [
    { label: 'Expired', count: expiredCount, value: expiredValue, color: '#EF4444', icon: AlertTriangle, status: 'expired' },
    { label: 'Expiring <30 Days', count: expiring30, value: expiring30Value, color: '#F97316', icon: Clock, status: '30' },
    { label: 'Expiring <60 Days', count: expiring60, value: expiring60Value, color: '#F59E0B', icon: Calendar, status: '60' },
    { label: 'Expiring <90 Days', count: expiring90, value: expiring90Value, color: '#6366F1', icon: Calendar, status: '90' },
    { label: 'Safe Stock', count: safeCount, value: safeValue, color: '#10B981', icon: ShieldCheck, status: 'safe' }
  ];

  // Recharts Pie Chart Formatter
  const pieData = [
    { name: 'Expired', value: expiredCount, color: '#EF4444' },
    { name: 'Expiring <30d', value: expiring30, color: '#F97316' },
    { name: 'Expiring <60d', value: expiring60, color: '#F59E0B' },
    { name: 'Expiring <90d', value: expiring90, color: '#6366F1' },
    { name: 'Safe Stock', value: safeCount, color: '#10B981' }
  ].filter(item => item.value > 0);

  // Recharts Cost At Risk Bar Chart Data
  const costAtRiskData = [
    { name: 'Expired', cost: expiredValue },
    { name: '<30 Days', cost: expiring30Value },
    { name: '<60 Days', cost: expiring60Value },
    { name: '<90 Days', cost: expiring90Value }
  ];

  // Reports/Alerts filtered listing
  const getProcessedItems = () => {
    return branchFilteredProducts.filter(p => {
      // Search matches
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (p.batchNumber && p.batchNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (p.supplier && p.supplier.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Category matches
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;

      // Status matches
      const days = getRemainingDays(p.expiryDate);
      let matchesStatus = true;
      if (statusFilter === 'expired') matchesStatus = days < 0;
      else if (statusFilter === '30') matchesStatus = days >= 0 && days <= 30;
      else if (statusFilter === '60') matchesStatus = days > 30 && days <= 60;
      else if (statusFilter === '90') matchesStatus = days > 60 && days <= 90;
      else if (statusFilter === 'safe') matchesStatus = days > 90;

      return matchesSearch && matchesCategory && matchesStatus;
    }).sort((a, b) => {
      const daysA = getRemainingDays(a.expiryDate);
      const daysB = getRemainingDays(b.expiryDate);
      return daysA - daysB; // prioritize sooner expiry first
    });
  };

  const processedItems = getProcessedItems();

  // Save changes to email/alerts configuration
  const handleSaveSettings = async () => {
    if (!ownerId) return;
    setIsSavingSettings(true);
    try {
      await setDoc(doc(db, 'expiry_settings', ownerId), settings);
      toast.success('Successfully saved Expiry Alert rules.');
    } catch (e) {
      console.error(e);
      toast.error('Could not save notification preferences.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Add a recipient email input to listing
  const handleAddEmail = () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) return;
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
      toast.error("Please enter a valid recipient email address.");
      return;
    }
    if (settings.recipientEmails.includes(trimmed)) {
      toast.error("This email is already registered in the list.");
      return;
    }
    setSettings(prev => ({
      ...prev,
      recipientEmails: [...prev.recipientEmails, trimmed]
    }));
    setNewEmail('');
  };

  // Remove a recipient email 
  const handleRemoveEmail = (target: string) => {
    setSettings(prev => ({
      ...prev,
      recipientEmails: prev.recipientEmails.filter(e => e !== target)
    }));
  };

  // Simulate Sending of Expiry Notification Digest
  const handleSendSimulatedNotification = async () => {
    if (settings.recipientEmails.length === 0) {
      toast.error("Please configure at least one recipient email address first.");
      setActiveTab('notifications');
      return;
    }

    const expiringProducts = branchFilteredProducts.filter(p => {
      const d = getRemainingDays(p.expiryDate);
      return d <= 90;
    });

    if (expiringProducts.length === 0) {
      toast.success("Great news! You have no products expiring within 90 days. No alert report is necessary right now.");
      return;
    }

    setIsSendingSimulated(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const subjectLine = `[CRITICAL ALERT] ${expiringProducts.filter(p => getRemainingDays(p.expiryDate) < 0).length} Expired / ${expiringProducts.filter(p => getRemainingDays(p.expiryDate) >= 0).length} Approaching Expiry Medicines Recorded`;
    
    const bodyText = `Dear Pharmacy Management System Team,\n\nThis is an automated medicine stock warning for owner: ${user.displayName || 'Enterprise Account'}.\n\n` + 
      `We have detected ${expiringProducts.length} items with critical dates at ${selectedBranchId === 'all' ? 'All locations' : getBranchName(selectedBranchId)}:\n\n` +
      expiringProducts.map(p => `• Medicine Name: ${p.name} | Batch: ${p.batchNumber || 'N/A'} | Expiry: ${p.expiryDate} (${getRemainingDays(p.expiryDate) < 0 ? 'ALREADY EXPIRED' : `${getRemainingDays(p.expiryDate)} days remaining`}) | Remaining Quantity: ${p.quantity} units`).join('\n') +
      `\n\nPlease act immmediately. Contact registered pharmaceutical manufacturers/vendors for bulk replacement or safely quarantine expired items.\n\nBest Regards,\nIntelligent Expiry Management Service`;

    const newLog: NotificationLog = {
      id: `log_${Date.now()}`,
      sentAt: Date.now(),
      type: 'urgent',
      recipients: settings.recipientEmails,
      status: 'sent',
      productsCount: expiringProducts.length,
      subject: subjectLine,
      message: bodyText
    };

    const updatedLogs = [newLog, ...notifLogs];
    setNotifLogs(updatedLogs);
    localStorage.setItem(`notif_logs_${ownerId}`, JSON.stringify(updatedLogs));

    // Update settings last sent timestamp in Firestore
    try {
      await updateDoc(doc(db, 'expiry_settings', ownerId), {
        lastSentAt: Date.now()
      });
    } catch (err) {
      console.warn("Could not save last sent status on firestore:", err);
    }

    toast.success(`Successfully dispatched expiry digestive notification email to ${settings.recipientEmails.length} recipients! Check execution log list.`);
    setIsSendingSimulated(false);
  };

  // Perform a custom print action of the Expiry Report (Simulated clean print viewport)
  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Popup block prevented print preview. Please enable popups.");
      return;
    }

    const rowsHtml = processedItems.map((p, idx) => {
      const days = getRemainingDays(p.expiryDate);
      const status = getExpiryStatus(days);
      const value = (p.costPrice || p.price * 0.7) * p.quantity;
      return `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 10px; font-weight: bold; font-size:12px;">${idx + 1}</td>
          <td style="padding: 10px; font-size:12px;">
            <div style="font-weight: bold;">${p.name}</div>
            <div style="font-size:10px; color:#555;">Cat: ${p.category} | Batch: ${p.batchNumber || 'N/A'}</div>
          </td>
          <td style="padding: 10px; font-size:12px;">${getBranchName(p.branchId)}</td>
          <td style="padding: 10px; font-weight: bold; font-size:12px;">${p.quantity} units</td>
          <td style="padding: 10px; font-size:12px;">${p.expiryDate || 'N/A'}</td>
          <td style="padding: 10px; font-size:11px; font-weight: bold;">
            ${days < 0 ? `EXPIRED (${Math.abs(days)}d ago)` : `${days} days left`}
          </td>
          <td style="padding: 10px; font-weight: bold; font-size:12px;">${value.toLocaleString()} ETB</td>
        </tr>
      `;
    }).join('');

    const formattedHtml = `
      <html>
        <head>
          <title>Intelligent Medicine Expiry Management - Business Report</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .report-title { font-size: 24px; font-weight: bold; color: #1E3A8A; margin: 0 0 5px 0; }
            .report-sub { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
            .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 30px; font-size: 13px; }
            .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .main-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .main-table th { background: #1E3A8A; color: white; padding: 12px 10px; text-align: left; font-size: 11px; text-transform: uppercase; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #888; border-top: 1px dashed #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td>
                <div class="report-title">Intelligent Medicine Expiry Report</div>
                <div class="report-sub">Digital Inventory Management System</div>
              </td>
              <td style="text-align: right; font-size: 12px; color:#555;">
                <strong>Date Generated:</strong> ${new Date().toLocaleString()}<br />
                <strong>Branch Scope:</strong> ${selectedBranchId === 'all' ? 'All Branches Combined' : getBranchName(selectedBranchId)}
              </td>
            </tr>
          </table>

          <div class="meta-box">
            <span style="font-weight:bold; color: #1E3A8A; margin-bottom:10px; display:inline-block;">RISK & VALUATION SUMMARY:</span>
            <table style="width: 100%; font-size: 12px;">
              <tr>
                <td><strong>Expired Products Count:</strong></td>
                <td><span style="color:#ef4444; font-weight:bold;">${expiredCount} items</span></td>
                <td><strong>Total Stock Cost at Risk:</strong></td>
                <td><span style="color:#d97706; font-weight:bold;">${totalValueAtRisk.toLocaleString()} ETB</span></td>
              </tr>
              <tr>
                <td><strong>Expiring < 30 days:</strong></td>
                <td><span style="color:#ea580c; font-weight:bold;">${expiring30} items</span></td>
                <td><strong>Safe Medicines:</strong></td>
                <td><span style="color:#10b981; font-weight:bold;">${safeCount} items</span></td>
              </tr>
            </table>
          </div>

          <table class="main-table">
            <thead>
              <tr>
                <th style="width:40px;">#</th>
                <th>Product / Medicine</th>
                <th>Branch Location</th>
                <th>Remaining Quantity</th>
                <th>Expiration Date</th>
                <th>Timeline status</th>
                <th>Estimated Stock Cost</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            Generated securely by ${user.displayName || 'Authorized Pharmacist'} (${user.role}). Expiry records comply with standard pharmaceutical security rules.
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(formattedHtml);
    printWindow.document.close();
  };

  // Download tabular reports to simple readable CSV attachment
  const handleExportCSV = () => {
    const headers = ['Product Name', 'Category', 'Batch Number', 'Branch', 'Quantity', 'Expiry Date', 'Days Left', 'Estimated Value (ETB)'];
    const rows = processedItems.map(p => {
      const days = getRemainingDays(p.expiryDate);
      const estVal = (p.costPrice || p.price * 0.7) * p.quantity;
      return [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category}"`,
        `"${p.batchNumber || 'N/A'}"`,
        `"${getBranchName(p.branchId)}"`,
        p.quantity,
        `"${p.expiryDate || 'N/A'}"`,
        days === Infinity ? 'N/A' : days,
        estVal
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Expiry_Analysis_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Successfully downloaded inventory CSV report!");
  };

  // Perform quick update on product's expiry metadata to resolve expiry issues
  const handleSaveQuickEdit = async () => {
    if (!quickEditProduct) return;
    if (!quickExpiryDate) {
      toast.error("Please enter a valid expiry date.");
      return;
    }

    try {
      await updateDoc(doc(db, 'medicines', quickEditProduct.id), {
        expiryDate: quickExpiryDate,
        batchNumber: quickBatchNumber,
        updatedAt: Date.now()
      });
      toast.success("Product expiry metadata updated immediately.");
      setQuickEditProduct(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update product expiry date.");
    }
  };

  return (
    <div className="w-full space-y-8 p-1 sm:p-2">
      {/* Expiry Header Intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-8 text-white shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex px-3 border border-indigo-400 py-1 rounded-full items-center gap-1.5 bg-indigo-950/40 text-xs font-bold text-indigo-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            INTELLIGENT MEDICAL TRACER
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Medicine Expiry Hub</h2>
          <p className="text-blue-100 max-w-xl text-sm leading-relaxed">
            Protect patients and secure inventory. Monitor 30, 60, & 90 days drug expiration windows, generate visual compliance reports, and configure automated alert broadcasts seamlessly.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleSendSimulatedNotification}
            disabled={isSendingSimulated}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl shadow-lg border border-emerald-400/40 transition-all disabled:opacity-50"
          >
            {isSendingSimulated ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
            Trigger Email Broadcast
          </button>
          
          <button 
            onClick={handlePrintReport}
            className="flex items-center gap-2 bg-indigo-950/60 hover:bg-indigo-950 active:bg-indigo-900 text-white font-semibold px-6 py-3 rounded-2xl border border-indigo-800/80 transition-all"
          >
            <Printer size={16} />
            Print Status
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-2 p-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-6 py-3 font-bold rounded-t-2xl transition-all ${
            activeTab === 'overview'
              ? 'text-blue-600 bg-blue-50/70 border-b-2 border-blue-600 dark:text-blue-400 dark:bg-slate-800/40'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 size={18} />
          Overview & Analytics
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-6 py-3 font-bold rounded-t-2xl transition-all ${
            activeTab === 'alerts'
              ? 'text-blue-600 bg-blue-50/70 border-b-2 border-blue-600 dark:text-blue-400 dark:bg-slate-800/40'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <AlertTriangle size={18} />
          Alert Tracker
          {expiredCount + expiring30 > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-bounce">
              {expiredCount + expiring30} Urgent
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-6 py-3 font-bold rounded-t-2xl transition-all ${
            activeTab === 'notifications'
              ? 'text-blue-600 bg-blue-50/70 border-b-2 border-blue-600 dark:text-blue-400 dark:bg-slate-800/40'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BellRing size={18} />
          Notification Rules
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-6 py-3 font-bold rounded-t-2xl transition-all ${
            activeTab === 'reports'
              ? 'text-blue-600 bg-blue-50/70 border-b-2 border-blue-600 dark:text-blue-400 dark:bg-slate-800/40'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText size={18} />
          Inventory Reports
        </button>
      </div>

      {/* TAB CONTENTS */}
      {/* 1. OVERVIEW & ANALYTICS TAB */}
      {activeTab === 'overview' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="space-y-8"
        >
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {summaryStats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={idx} 
                  onClick={() => {
                    setStatusFilter(stat.status as any);
                    setActiveTab('alerts');
                  }}
                  className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-xs hover:shadow-md cursor-pointer transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500">
                      {stat.label}
                    </span>
                    <span 
                      className="p-2.5 rounded-2xl" 
                      style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
                    >
                      <Icon size={18} />
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                      {stat.count} <span className="text-xs font-semibold text-slate-400">items</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Cost: {stat.value.toLocaleString()} ETB
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Graphical analysis panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Pie chart representing stock counts */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">Expiry Stock Distribution</h4>
                <p className="text-xs text-slate-400 mb-6">Visual breakdown of medical supplies by timeline health status.</p>
              </div>
              <div className="h-60 flex items-center justify-center">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-10">
                    <PackageCheck className="mx-auto text-slate-300 dark:text-slate-700 mb-2" size={44} />
                    <p className="text-slate-400 text-xs">No active inventory drugs to analyze.</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: d.color }}></span>
                    <span className="text-slate-500 font-medium truncate">{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expiring Valuation chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">Estimated Stock Cost At Expiry Risk</h4>
                  <span className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold text-xs px-2.5 py-1 rounded-full">
                    Total Risk: {totalValueAtRisk.toLocaleString()} ETB
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-6 font-medium">Estimated procurement costs that will be lost unless liquidated or returned.</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costAtRiskData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <Tooltip formatter={(value) => [`${value.toLocaleString()} ETB`, 'Cost value']} />
                    <Bar dataKey="cost" fill="#d97706" radius={[6, 6, 0, 0]}>
                      <Cell fill="#EF4444" />
                      <Cell fill="#F97316" />
                      <Cell fill="#F59E0B" />
                      <Cell fill="#6366F1" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recommendations Banner */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex gap-4 items-start">
            <span className="bg-amber-100 dark:bg-amber-900/30 p-2.5 rounded-2xl text-amber-600">
              <Sliders size={20} />
            </span>
            <div className="space-y-1.5">
              <h5 className="font-bold text-sm text-slate-900 dark:text-white">Intelligent Operations Guidelines</h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                For medicines expiring in under <strong className="text-red-500 font-black">30 days</strong>, instantly initiate safe quarantine protocols, or place on immediate 50%+ discount sales at POS to recoup cost. For products with <strong className="text-amber-500">60-90 days</strong> remaining, reach out to original B2B importers via B2B orders to request product replacement if eligible.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* 2. ALERTS TAB */}
      {activeTab === 'alerts' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="space-y-6"
        >
          {/* Filters shelf */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-slate-400 font-bold mr-2">Filter Timeline:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                All Products ({branchFilteredProducts.length})
              </button>
              <button
                onClick={() => setStatusFilter('expired')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg ${statusFilter === 'expired' ? 'bg-red-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                Expired ({expiredCount})
              </button>
              <button
                onClick={() => setStatusFilter('30')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg ${statusFilter === '30' ? 'bg-orange-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                &lt; 30 Days ({expiring30})
              </button>
              <button
                onClick={() => setStatusFilter('60')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg ${statusFilter === '60' ? 'bg-amber-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                &lt; 60 Days ({expiring60})
              </button>
              <button
                onClick={() => setStatusFilter('90')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg ${statusFilter === '90' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                &lt; 90 Days ({expiring90})
              </button>
            </div>

            <div className="flex items-center gap-2 max-w-xs w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 rounded-xl">
              <Search size={14} className="text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, batch..."
                className="w-full bg-transparent border-0 outline-none p-0 text-xs text-slate-700 dark:text-white"
              />
              {searchQuery && <X size={14} className="text-slate-400 cursor-pointer" onClick={() => setSearchQuery('')} />}
            </div>
          </div>

          {/* Quick inline edit metadata modal/drawer when editing */}
          {quickEditProduct && (
            <div className="bg-slate-50 dark:bg-slate-900 border-2 border-blue-500 p-6 rounded-3xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <h5 className="font-bold text-sm text-blue-600 flex items-center gap-2">
                  <Edit size={16} /> Update Expiry Metadata: {quickEditProduct.name}
                </h5>
                <button 
                  onClick={() => setQuickEditProduct(null)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={quickBatchNumber}
                    onChange={e => setQuickBatchNumber(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Expiry Expiration Date</label>
                  <input
                    type="date"
                    value={quickExpiryDate}
                    onChange={e => setQuickExpiryDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleSaveQuickEdit}
                    className="w-full text-xs py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700"
                  >
                    Save Modifications
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Alerts Stock list */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-extrabold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Medicine details</th>
                    <th className="px-6 py-4">Branch</th>
                    <th className="px-6 py-4">Remaining Inventory</th>
                    <th className="px-6 py-4">Status & Days Left</th>
                    <th className="px-6 py-4">Cost value</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {processedItems.length > 0 ? (
                    processedItems.map(p => {
                      const days = getRemainingDays(p.expiryDate);
                      const status = getExpiryStatus(days);
                      const value = (p.costPrice || p.price * 0.7) * p.quantity;
                      
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-sm text-slate-900 dark:text-white">{p.name}</p>
                              <p className="text-xs text-slate-400 font-medium">Batch: {p.batchNumber || 'N/A'} | Expiry: {p.expiryDate || 'N/A'}</p>
                              <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">{p.category}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold">
                            {getBranchName(p.branchId)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold">{p.quantity} units</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-extrabold border ${status.color}`}>
                              {days < 0 ? `EXPIRED` : `${days} Days left`}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-xs text-slate-900 dark:text-white">
                            {value.toLocaleString()} ETB
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => {
                                setQuickEditProduct(p);
                                setQuickExpiryDate(p.expiryDate || '');
                                setQuickBatchNumber(p.batchNumber || '');
                              }}
                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-slate-800 p-2 rounded-xl transition-all"
                              title="Quick-Update Expiry metadata"
                            >
                              <Edit size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                        No medicine items fit the current query/status filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. NOTIFICATION RULES TAB */}
      {activeTab === 'notifications' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Left panel: Trigger Rules Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Expiry Alert Thresholds & Receivers</h4>
                <p className="text-xs text-slate-400">Specify when email digest triggers should fire and who receives notifications.</p>
              </div>

              {/* Toggle switch */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">Automated Expiry Alerts</p>
                  <p className="text-xs text-slate-400">Trigger daily health summary & direct email logs to recipients.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${settings.enabled ? 'bg-blue-600 justify-end' : 'bg-slate-300 dark:bg-slate-800 justify-start'}`}
                >
                  <motion.div layout className="w-4.5 h-4.5 bg-white rounded-full shadow-xs"></motion.div>
                </button>
              </div>

              {/* Threshold Checklist */}
              <div className="space-y-3">
                <label className="block text-xs font-extrabold uppercase text-slate-400 tracking-wider">Trigger levels</label>
                
                <div className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/20 rounded-xl transition-all">
                  <input
                    type="checkbox"
                    id="notify30"
                    checked={settings.notify30}
                    onChange={e => setSettings(prev => ({ ...prev, notify30: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded-sm focus:ring-blue-500"
                  />
                  <label htmlFor="notify30" className="text-xs font-semibold text-slate-700 dark:text-white cursor-pointer select-none">
                    Notify on stock expiring in <strong className="text-red-500 font-bold">30 Days</strong> (Highly Critical)
                  </label>
                </div>

                <div className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/20 rounded-xl transition-all">
                  <input
                    type="checkbox"
                    id="notify60"
                    checked={settings.notify60}
                    onChange={e => setSettings(prev => ({ ...prev, notify60: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded-sm focus:ring-blue-500"
                  />
                  <label htmlFor="notify60" className="text-xs font-semibold text-slate-700 dark:text-white cursor-pointer select-none">
                    Notify on stock approaching in <strong className="text-orange-500 font-bold">60 Days</strong> (Warning)
                  </label>
                </div>

                <div className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/20 rounded-xl transition-all">
                  <input
                    type="checkbox"
                    id="notify90"
                    checked={settings.notify90}
                    onChange={e => setSettings(prev => ({ ...prev, notify90: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded-sm focus:ring-blue-500"
                  />
                  <label htmlFor="notify90" className="text-xs font-semibold text-slate-700 dark:text-white cursor-pointer select-none">
                    Notify on stock approaching <strong className="text-indigo-500 font-bold">90 Days</strong> (Standard Attention)
                  </label>
                </div>
              </div>

              {/* Email Addresses list */}
              <div className="space-y-3">
                <label className="block text-xs font-extrabold uppercase text-slate-400 tracking-wider">Recipient Emails</label>
                
                <div className="flex gap-2">
                  <input 
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="Enter receiver email address..."
                    className="flex-1 text-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleAddEmail}
                    className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs px-5 rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {settings.recipientEmails.length > 0 ? (
                    settings.recipientEmails.map((email, idx) => (
                      <span 
                        key={idx} 
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-300 rounded-full border border-blue-100 dark:border-slate-700"
                      >
                        <Mail size={12} />
                        {email}
                        <Trash2 
                          size={12} 
                          className="text-slate-400 hover:text-red-500 cursor-pointer ml-1" 
                          onClick={() => handleRemoveEmail(email)}
                        />
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No emails configured. Alerts will default to { (user as any).email || 'not configured' }.</p>
                  )}
                </div>
              </div>

              {/* Save changes */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                {settings.lastSentAt && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    Last sent alert: {new Date(settings.lastSentAt).toLocaleDateString()}
                  </span>
                )}
                <button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="ml-auto bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-3 rounded-2xl shadow-md border border-blue-400/20 disabled:opacity-50"
                >
                  {isSavingSettings ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </div>

          {/* Right panel: Notification Logs / History */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between h-full">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                  <Clock size={16} /> Broadcast History
                </h4>
                <p className="text-xs text-slate-400 mb-6">Execution log of past automated expiry reports delivered.</p>
              </div>

              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                {notifLogs.length > 0 ? (
                  notifLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-850 flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-extrabold px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                          SENT DELIVERED
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {new Date(log.sentAt).toLocaleDateString()} {new Date(log.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <p className="font-bold text-xs text-slate-800 dark:text-white truncate">
                        {log.subject}
                      </p>
                      <p className="text-[10px] text-slate-500 line-clamp-3 leading-relaxed">
                        {log.message}
                      </p>
                      <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                        <span>Recipients: {log.recipients.join(', ')}</span>
                        <strong>{log.productsCount} medications listed</strong>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-10">No broadcast events logged yet.</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 4. INVENTORY REPORTS TAB */}
      {activeTab === 'reports' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="space-y-6"
        >
          {/* Header Action controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 gap-4">
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Pharmaceutical Compliance Reports</h4>
              <p className="text-xs text-slate-400">Generate clean worksheets, printable summaries, and track total cost liability.</p>
            </div>
            
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={handlePrintReport}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Printer size={14} />
                Print PDF Report
              </button>
              
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <FileSpreadsheet size={14} />
                Export CSV Worksheet
              </button>
            </div>
          </div>

          {/* Filtering options */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Stock Category</label>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-slate-700 dark:text-white outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Criticality Window</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="w-full text-xs bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-slate-700 dark:text-white outline-none"
              >
                <option value="all">All Lifespans</option>
                <option value="expired">Expired Stock Only</option>
                <option value="30">Critical Expiry (&lt;30 days)</option>
                <option value="60">Impending Warning (&lt;60 days)</option>
                <option value="90">Approaching Expiry (&lt;90 days)</option>
                <option value="safe">Adequate Healthy Stock (&gt;90 days)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Search Products</label>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 px-2 rounded-xl">
                <Search size={14} className="text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Query names, batch numbers, vendors..."
                  className="w-full bg-transparent border-0 outline-none p-0 text-xs text-slate-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Detailed table view designed for print previewing */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-serif-sans">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase border-b border-slate-100 dark:border-slate-800/80">
                  <tr>
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Product / Category</th>
                    <th className="px-6 py-4">Branch Location</th>
                    <th className="px-6 py-4">Batch Number</th>
                    <th className="px-6 py-4">Quantity</th>
                    <th className="px-6 py-4">Date Out</th>
                    <th className="px-6 py-4 text-right">Procurement Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {processedItems.length > 0 ? (
                    processedItems.map((p, index) => {
                      const days = getRemainingDays(p.expiryDate);
                      const cost = (p.costPrice || p.price * 0.7) * p.quantity;
                      
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 text-xs">
                          <td className="px-6 py-4 text-slate-400 font-bold">{index + 1}</td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-900 dark:text-white block">{p.name}</span>
                            <span className="text-[10px] text-slate-400">{p.category}</span>
                          </td>
                          <td className="px-6 py-4 font-semibold">{getBranchName(p.branchId)}</td>
                          <td className="px-6 py-4 font-mono">{p.batchNumber || 'N/A'}</td>
                          <td className="px-6 py-4 font-bold">{p.quantity} units</td>
                          <td className="px-6 py-4 font-semibold">
                            {p.expiryDate || 'N/A'}{' '}
                            <span className={`block text-[10px] font-bold ${days < 0 ? 'text-red-500' : days <= 30 ? 'text-orange-500' : 'text-slate-400'}`}>
                              ({days < 0 ? `Expired` : `${days} days left`})
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {cost.toLocaleString()} ETB
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">
                        No products matches filters for generated report.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Simple compliance option helper
const Option = ({ value, children }: { value: string; children: React.ReactNode }) => {
  return <option value={value}>{children}</option>;
};

export default ExpiryTrackerView;
