import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, UserPlus, Plus, Search, FileText, TrendingUp, ShoppingCart, 
  Trash2, Edit2, FileDown, Calendar, DollarSign, CheckCircle, AlertCircle, 
  X, ChevronRight, Filter, ArrowUpRight, QrCode, Mail, Share2, Printer, RotateCcw, ScanLine 
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { db, auth } from '../firebase';
import { 
  collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDoc, arrayUnion 
} from 'firebase/firestore';
import { UserProfile, InventoryProduct, Order, WholesaleCustomer } from '../types';

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
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
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
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface CustomerManagementViewProps {
  user: UserProfile;
}

export default function CustomerManagementView({ user }: CustomerManagementViewProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'directory' | 'pos' | 'sales'>('dashboard');
  const [customers, setCustomers] = useState<WholesaleCustomer[]>([]);
  const [privateSales, setPrivateSales] = useState<any[]>([]);
  const [inventory, setInventory] = useState<InventoryProduct[]>([]);
  const [linkedPharmacies, setLinkedPharmacies] = useState<UserProfile[]>([]);
  const [incomingOrders, setIncomingOrders] = useState<Order[]>([]);

  // Modals & UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<WholesaleCustomer | null>(null);
  
  // New Customer Form State
  const [formData, setFormData] = useState({
    businessName: '',
    customerType: 'pharmacy',
    ownerName: '',
    phone: '',
    alternativePhone: '',
    email: '',
    tinNumber: '',
    licenseNumber: '',
    address: '',
    region: 'Addis Ababa',
    city: '',
    gpsLocation: '',
    paymentTerms: 'Cash',
    creditLimit: '0',
    openingBalance: '0',
    preferredSalesRep: '',
    internalNotes: '',
    status: 'active'
  });

  // POS State
  const [selectedPosCustId, setSelectedPosCustId] = useState('');
  const [posSearchTerm, setPosSearchTerm] = useState('');
  const [posCart, setPosCart] = useState<Array<{ product: InventoryProduct; quantity: number; discountPercent: number }>>([]);
  const [posPaymentMethod, setPosPaymentMethod] = useState<'cash' | 'bank' | 'credit' | 'mixed'>('cash');
  const [mixedCashAmount, setMixedCashAmount] = useState('0');
  const [mixedBankAmount, setMixedBankAmount] = useState('0');
  const [posDiscount, setPosDiscount] = useState('0'); // overall percentage discount
  const [posTaxEnabled, setPosTaxEnabled] = useState(true); // 15% VAT
  const [posDrafts, setPosDrafts] = useState<any[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');

  // Refund processing state
  const [selectedSaleToReturn, setSelectedSaleToReturn] = useState<any | null>(null);
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});

  // Real-time FireStore Subscriptions
  useEffect(() => {
    // 1. Load private wholesaler customers
    const qCust = query(collection(db, 'wholesale_customers'), where('wholesalerId', '==', user.uid));
    const unsubCust = onSnapshot(qCust, (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() } as WholesaleCustomer)));
    }, err => handleFirestoreError(err, OperationType.LIST, 'wholesale_customers'));

    // 2. Load private wholesaler sales
    const qSales = query(collection(db, 'wholesale_private_sales'), where('wholesalerId', '==', user.uid));
    const unsubSales = onSnapshot(qSales, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }) as any);
      list.sort((a: any, b: any) => b.createdAt - a.createdAt);
      setPrivateSales(list);
    }, err => handleFirestoreError(err, OperationType.LIST, 'wholesale_private_sales'));

    // 3. Load Wholesaler's active medicines/inventory
    const qInv = query(collection(db, 'medicines'), where('pharmacyId', '==', user.uid));
    const unsubInv = onSnapshot(qInv, (snap) => {
      setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryProduct)));
    }, err => handleFirestoreError(err, OperationType.LIST, 'medicines'));

    // 4. Load A-Tech approved pharmacies (linked to same country)
    const qPharm = query(collection(db, 'users'), where('role', '==', 'pharmacy'), where('verificationStatus', '==', 'approved'));
    const unsubPharm = onSnapshot(qPharm, (snap) => {
      const list = snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile))
        .filter(p => p.country === user.country);
      setLinkedPharmacies(list);
    }, err => handleFirestoreError(err, OperationType.LIST, 'users'));

    // 5. Load standard incoming orders placed with this wholesaler
    const qOrders = query(collection(db, 'orders'), where('importerId', '==', user.uid));
    const unsubOrders = onSnapshot(qOrders, (snap) => {
      setIncomingOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    }, err => handleFirestoreError(err, OperationType.LIST, 'orders'));

    return () => {
      unsubCust();
      unsubSales();
      unsubInv();
      unsubPharm();
      unsubOrders();
    };
  }, [user.uid, user.country]);

  // Load POS drafts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`pos_drafts_${user.uid}`);
    if (saved) {
      try { setPosDrafts(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, [user.uid]);

  const saveDraftsToStorage = (newDrafts: any[]) => {
    setPosDrafts(newDrafts);
    localStorage.setItem(`pos_drafts_${user.uid}`, JSON.stringify(newDrafts));
  };

  // Combine and calculate real-time CRM entries
  const compiledCustomers = useMemo(() => {
    // A-Tech customers are pharmacies that have placed an order
    const orderedPharmIds = new Set(incomingOrders.map(o => o.pharmacyId));
    const aTechPartners = linkedPharmacies.filter(p => orderedPharmIds.has(p.uid));

    // Map A-Tech partners to customer object
    const aTechMapped: WholesaleCustomer[] = aTechPartners.map(p => {
      // Check if there is already a linked private customer record
      const linkedRecord = customers.find(c => c.linkedOrgId === p.uid);
      if (linkedRecord) return null; // Avoid duplicate display

      const customerOrders = incomingOrders.filter(o => o.pharmacyId === p.uid);
      const totalSpend = customerOrders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0);
      const outstanding = customerOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.totalAmount, 0); // Delivered but unpaid on credit
      
      // Calculate dynamic score (0-100)
      let score = 50;
      if (totalSpend > 50000) score += 20;
      else if (totalSpend > 10000) score += 10;
      if (customerOrders.length > 5) score += 15;
      if (customerOrders.some(o => o.status === 'completed')) score += 15;
      score = Math.min(score, 100);

      const rating: 'VIP' | 'Gold' | 'Silver' | 'Bronze' = 
        score >= 90 ? 'VIP' : score >= 75 ? 'Gold' : score >= 55 ? 'Silver' : 'Bronze';

      return {
        id: `atech_${p.uid}`,
        wholesalerId: user.uid,
        isPrivate: false,
        linkedOrgId: p.uid,
        businessName: p.pharmacyName || p.displayName || 'Official Pharmacy',
        customerType: 'pharmacy',
        ownerName: p.ownerName || p.displayName || 'N/A',
        phone: p.phone || 'N/A',
        email: p.email || 'N/A',
        licenseNumber: p.licenseNumber || 'N/A',
        region: p.region || 'Addis Ababa',
        city: p.city || 'N/A',
        status: 'active',
        createdAt: p.createdAt || Date.now(),
        creditLimit: 0,
        openingBalance: 0,
        totalOrders: customerOrders.length,
        totalSpending: totalSpend,
        outstandingBalance: outstanding,
        score,
        rating,
        timeline: [
          { id: 't1', type: 'system', title: 'A-Tech Integration', description: 'Automatically added to CRM via platform order synchronization.', timestamp: p.createdAt || Date.now() }
        ],
        uploadedDocuments: []
      } as WholesaleCustomer;
    }).filter(Boolean) as WholesaleCustomer[];

    // Process private customers
    const privateMapped: WholesaleCustomer[] = customers.map(c => {
      const customerSales = privateSales.filter(s => s.customerId === c.id);
      const totalSpend = customerSales.reduce((sum, s) => sum + s.totalAmount, 0);
      const outstanding = customerSales.filter(s => s.paymentMethod === 'credit').reduce((sum, s) => sum + s.totalAmount, 0);

      // Score
      let score = 40;
      if (totalSpend > 20000) score += 25;
      else if (totalSpend > 5000) score += 15;
      if (customerSales.length > 3) score += 15;
      if (c.status === 'active') score += 10;
      score = Math.min(score, 100);

      const rating: 'VIP' | 'Gold' | 'Silver' | 'Bronze' = 
        score >= 85 ? 'VIP' : score >= 70 ? 'Gold' : score >= 50 ? 'Silver' : 'Bronze';

      return {
        ...c,
        totalOrders: customerSales.length,
        totalSpending: totalSpend,
        outstandingBalance: outstanding,
        score,
        rating
      };
    });

    return [...privateMapped, ...aTechMapped];
  }, [customers, privateSales, incomingOrders, linkedPharmacies, user.uid]);

  // Filters and Search
  const filteredCustomers = useMemo(() => {
    return compiledCustomers.filter(c => {
      const matchesSearch = 
        c.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.ownerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.tinNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || c.customerType === filterType;
      const matchesRating = filterRating === 'all' || c.rating === filterRating;

      return matchesSearch && matchesType && matchesRating;
    });
  }, [compiledCustomers, searchTerm, filterType, filterRating]);

  // Analytics Metrics
  const metrics = useMemo(() => {
    const total = compiledCustomers.length;
    const active = compiledCustomers.filter(c => c.status === 'active').length;
    const totalSpending = compiledCustomers.reduce((sum, c) => sum + c.totalSpending, 0);
    const totalOutstanding = compiledCustomers.reduce((sum, c) => sum + c.outstandingBalance, 0);
    return { total, active, totalSpending, totalOutstanding };
  }, [compiledCustomers]);

  // Chart Data Calculations
  const chartData = useMemo(() => {
    // Top 5 Customers by Revenue
    const topRevenue = [...compiledCustomers]
      .sort((a, b) => b.totalSpending - a.totalSpending)
      .slice(0, 5)
      .map(c => ({ name: c.businessName.slice(0, 12), revenue: c.totalSpending }));

    // Customer Type distribution
    const types: Record<string, number> = {};
    compiledCustomers.forEach(c => {
      types[c.customerType] = (types[c.customerType] || 0) + 1;
    });
    const typeDist = Object.entries(types).map(([key, value]) => ({ name: key.toUpperCase(), value }));

    return { topRevenue, typeDist };
  }, [compiledCustomers]);

  // Add manual Private Customer
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName || !formData.phone) {
      toast.error('Business Name and Phone Number are required');
      return;
    }

    try {
      const customerId = `cust_${Date.now()}`;
      const newCustomer: WholesaleCustomer = {
        id: customerId,
        wholesalerId: user.uid,
        isPrivate: true,
        businessName: formData.businessName,
        customerType: formData.customerType as any,
        ownerName: formData.ownerName,
        phone: formData.phone,
        alternativePhone: formData.alternativePhone || null,
        email: formData.email,
        tinNumber: formData.tinNumber || null,
        licenseNumber: formData.licenseNumber || null,
        address: formData.address,
        region: formData.region,
        city: formData.city,
        gpsLocation: formData.gpsLocation || null,
        paymentTerms: formData.paymentTerms,
        creditLimit: parseFloat(formData.creditLimit) || 0,
        openingBalance: parseFloat(formData.openingBalance) || 0,
        preferredSalesRep: formData.preferredSalesRep || null,
        internalNotes: formData.internalNotes || null,
        status: formData.status as any,
        createdAt: Date.now(),
        totalOrders: 0,
        totalSpending: 0,
        outstandingBalance: 0,
        score: 40,
        rating: 'Bronze',
        timeline: [
          { id: `t_${Date.now()}`, type: 'creation', title: 'Account Established', description: `Manually added as private client: ${formData.customerType}.`, timestamp: Date.now() }
        ],
        uploadedDocuments: []
      };

      await setDoc(doc(db, 'wholesale_customers', customerId), newCustomer);
      toast.success('Private customer added successfully!');
      setShowAddModal(false);
      
      // Reset form
      setFormData({
        businessName: '',
        customerType: 'pharmacy',
        ownerName: '',
        phone: '',
        alternativePhone: '',
        email: '',
        tinNumber: '',
        licenseNumber: '',
        address: '',
        region: 'Addis Ababa',
        city: '',
        gpsLocation: '',
        paymentTerms: 'Cash',
        creditLimit: '0',
        openingBalance: '0',
        preferredSalesRep: '',
        internalNotes: '',
        status: 'active'
      });
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to add customer: ${err?.message || err}`);
    }
  };

  // Generate invite link / details
  const handleSendInvitation = async (cust: WholesaleCustomer) => {
    try {
      const inviteId = `invite_${cust.id}_${Date.now()}`;
      const inviteLink = `${window.location.origin}/?refWholesale=${user.uid}&inviteCustId=${cust.id}`;
      
      // Save invite details in wholesaler crm record timeline
      const updatedTimeline = [
        ...(cust.timeline || []),
        { id: `invite_${Date.now()}`, type: 'invite', title: 'A-Tech Invitation Initiated', description: `Registration invitation generated with ID: ${inviteId}`, timestamp: Date.now() }
      ];

      await updateDoc(doc(db, 'wholesale_customers', cust.id), {
        timeline: updatedTimeline
      });

      setSelectedCustomer({
        ...cust,
        timeline: updatedTimeline
      });

      toast.success('Invitation generated! Copy links below from the customer profile drawer.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to register invitation.');
    }
  };

  // Block/Unblock customer status
  const handleUpdateStatus = async (custId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'active' ? 'blocked' : 'active';
      await updateDoc(doc(db, 'wholesale_customers', custId), {
        status: nextStatus
      });
      toast.success(`Customer account status updated to ${nextStatus}`);
    } catch (e) {
      toast.error('Could not update customer status');
    }
  };

  // POS Inventory Search and Barcode Scanner Simulator
  const filteredInventory = useMemo(() => {
    return inventory.filter(prod => {
      const matchesSearch = prod.name.toLowerCase().includes(posSearchTerm.toLowerCase()) || 
        (prod.genericName || '').toLowerCase().includes(posSearchTerm.toLowerCase()) ||
        prod.batchNumber.toLowerCase().includes(posSearchTerm.toLowerCase());
      return matchesSearch && prod.quantity > 0;
    });
  }, [inventory, posSearchTerm]);

  // Scanner Simulator / input handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;
    
    // Find matching batch
    const match = inventory.find(prod => prod.batchNumber.toLowerCase() === barcodeInput.toLowerCase().trim() || prod.id === barcodeInput);
    if (match) {
      addToCart(match);
      toast.success(`Scanned: ${match.name} (Batch: ${match.batchNumber})`);
    } else {
      toast.error(`No batch found matching: ${barcodeInput}`);
    }
    setBarcodeInput('');
  };

  const addToCart = (product: InventoryProduct) => {
    const existing = posCart.find(it => it.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.quantity) {
        toast.error(`Cannot add more than available stock (${product.quantity} units)`);
        return;
      }
      setPosCart(posCart.map(it => it.product.id === product.id ? { ...it, quantity: it.quantity + 1 } : it));
    } else {
      setPosCart([...posCart, { product, quantity: 1, discountPercent: 0 }]);
    }
  };

  const updateCartQty = (productId: string, newQty: number, max: number) => {
    if (newQty <= 0) {
      setPosCart(posCart.filter(it => it.product.id !== productId));
      return;
    }
    if (newQty > max) {
      toast.error(`Cannot exceed maximum batch quantity of ${max}`);
      return;
    }
    setPosCart(posCart.map(it => it.product.id === productId ? { ...it, quantity: newQty } : it));
  };

  // Calculations for POS totals
  const posTotals = useMemo(() => {
    const subtotal = posCart.reduce((sum, it) => sum + (it.product.price * it.quantity), 0);
    const overallDiscountVal = (subtotal * (parseFloat(posDiscount) || 0)) / 100;
    const discountedTotal = subtotal - overallDiscountVal;
    const vatAmount = posTaxEnabled ? discountedTotal * 0.15 : 0;
    const total = discountedTotal + vatAmount;
    return { subtotal, discountValue: overallDiscountVal, vatAmount, total };
  }, [posCart, posDiscount, posTaxEnabled]);

  // Checkout sale
  const handlePosCheckout = async () => {
    if (!selectedPosCustId) {
      toast.error('Please select a customer for this checkout');
      return;
    }
    if (posCart.length === 0) {
      toast.error('Checkout cart is empty');
      return;
    }

    const currentCustomer = compiledCustomers.find(c => c.id === selectedPosCustId);
    if (!currentCustomer) return;

    // Credit limits validation
    if (posPaymentMethod === 'credit' && currentCustomer.creditLimit > 0) {
      const potentialDebt = currentCustomer.outstandingBalance + posTotals.total;
      if (potentialDebt > currentCustomer.creditLimit) {
        toast.error(`Credit limit exceeded! Customer credit limit: $${currentCustomer.creditLimit}. Outstanding: $${currentCustomer.outstandingBalance}`);
        return;
      }
    }

    try {
      const saleId = `sale_${Date.now()}`;
      const saleItems = posCart.map(it => ({
        productId: it.product.id,
        name: it.product.name,
        batchNumber: it.product.batchNumber,
        expiryDate: it.product.expiryDate,
        quantity: it.quantity,
        price: it.product.price,
        total: it.product.price * it.quantity
      }));

      const newSale = {
        id: saleId,
        wholesalerId: user.uid,
        customerId: selectedPosCustId,
        customerName: currentCustomer.businessName,
        items: saleItems,
        subtotal: posTotals.subtotal,
        discount: posTotals.discountValue,
        vatAmount: posTotals.vatAmount,
        totalAmount: posTotals.total,
        paymentMethod: posPaymentMethod,
        mixedCash: posPaymentMethod === 'mixed' ? parseFloat(mixedCashAmount) : 0,
        mixedBank: posPaymentMethod === 'mixed' ? parseFloat(mixedBankAmount) : 0,
        createdAt: Date.now()
      };

      // 1. Save sale document
      await setDoc(doc(db, 'wholesale_private_sales', saleId), newSale);

      // 2. Reduce inventory in FireStore
      for (const item of posCart) {
        const nextQty = Math.max(0, item.product.quantity - item.quantity);
        await updateDoc(doc(db, 'medicines', item.product.id), {
          quantity: nextQty
        });
      }

      // 3. Append to timeline of Customer
      if (currentCustomer.isPrivate) {
        const newTimeline = [
          ...(currentCustomer.timeline || []),
          { 
            id: `t_sale_${Date.now()}`, 
            type: 'sale', 
            title: 'POS Purchase Executed', 
            description: `Acquired ${saleItems.length} line items. Total Invoice: $${posTotals.total.toFixed(2)} (${posPaymentMethod.toUpperCase()}).`, 
            timestamp: Date.now() 
          }
        ];
        await updateDoc(doc(db, 'wholesale_customers', currentCustomer.id), {
          timeline: newTimeline
        });
      }

      toast.success('Sale successfully executed!');
      setPosCart([]);
      setSelectedPosCustId('');
      
      // Auto-trigger receipt printing simulation
      handlePrintReceipt(newSale);
    } catch (err: any) {
      console.error(err);
      toast.error(`Checkout failed: ${err?.message || err}`);
    }
  };

  // Draft Sale Handling
  const saveAsDraft = () => {
    if (!selectedPosCustId) {
      toast.error('Select customer to hold the draft');
      return;
    }
    const draftId = `draft_${Date.now()}`;
    const draft = {
      id: draftId,
      customerId: selectedPosCustId,
      customerName: compiledCustomers.find(c => c.id === selectedPosCustId)?.businessName || '',
      cart: posCart,
      discount: posDiscount,
      taxEnabled: posTaxEnabled,
      paymentMethod: posPaymentMethod,
      timestamp: Date.now()
    };

    const nextDrafts = [...posDrafts, draft];
    saveDraftsToStorage(nextDrafts);
    toast.success('POS order successfully saved as draft!');
    setPosCart([]);
    setSelectedPosCustId('');
  };

  const loadDraft = (draft: any) => {
    setSelectedPosCustId(draft.customerId);
    setPosCart(draft.cart);
    setPosDiscount(draft.discount);
    setPosTaxEnabled(draft.taxEnabled);
    setPosPaymentMethod(draft.paymentMethod);

    // Filter out loaded draft
    const nextDrafts = posDrafts.filter(d => d.id !== draft.id);
    saveDraftsToStorage(nextDrafts);
    toast.success('Loaded draft to active workspace');
  };

  const deleteDraft = (draftId: string) => {
    const nextDrafts = posDrafts.filter(d => d.id !== draftId);
    saveDraftsToStorage(nextDrafts);
    toast.success('Draft removed');
  };

  // Print Receipt simulator
  const handlePrintReceipt = (sale: any) => {
    const receiptWindow = window.open('', '_blank', 'width=400,height=600');
    if (!receiptWindow) {
      toast.success(`Invoice generated! ID: ${sale.id}. Blocked popup prevented showing standard ticket.`);
      return;
    }

    const itemsRows = sale.items.map((it: any) => `
      <tr>
        <td style="padding: 4px 0;">${it.name}<br/><small style="color: #666">B: ${it.batchNumber}</small></td>
        <td style="text-align: right; padding: 4px 0;">${it.quantity}</td>
        <td style="text-align: right; padding: 4px 0;">$${it.price.toFixed(2)}</td>
        <td style="text-align: right; padding: 4px 0;">$${it.total.toFixed(2)}</td>
      </tr>
    `).join('');

    receiptWindow.document.write(`
      <html>
        <head>
          <title>A-Tech Wholesales Ticket</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; font-size: 12px; line-height: 1.4; padding: 15px; color: #000; }
            .header { text-align: center; margin-bottom: 15px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            .totals { text-align: right; margin-top: 10px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h3>ATECH WHOLESALE DEPOT</h3>
            <p>Wholesaler Code: ${user.uid.slice(0,6).toUpperCase()}<br/>
               Date: ${new Date(sale.createdAt).toLocaleString()}</p>
          </div>
          <div class="divider"></div>
          <p><strong>Customer:</strong> ${sale.customerName}<br/>
             <strong>Invoice:</strong> ${sale.id.slice(-8).toUpperCase()}</p>
          <div class="divider"></div>
          <table>
            <thead>
              <tr style="border-bottom: 1px solid #000;">
                <th style="text-align: left;">Item</th>
                <th style="text-align: right;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
          <div class="divider"></div>
          <div class="totals">
            <p>Subtotal: $${sale.subtotal.toFixed(2)}</p>
            <p>Discount: -$${sale.discount.toFixed(2)}</p>
            <p>VAT (15%): $${sale.vatAmount.toFixed(2)}</p>
            <p style="font-size: 14px;">TOTAL DUE: $${sale.totalAmount.toFixed(2)}</p>
          </div>
          <div class="divider"></div>
          <p style="text-align: center; font-size: 10px;">Payment: ${sale.paymentMethod.toUpperCase()}<br/>Thank you for your partnership!</p>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    receiptWindow.document.close();
  };

  // Refund processing logic
  const handleReturnExecution = async () => {
    if (!selectedSaleToReturn) return;
    
    try {
      let isAnyReturned = false;
      for (const item of selectedSaleToReturn.items) {
        const returnQty = returnQuantities[item.productId] || 0;
        if (returnQty > 0) {
          isAnyReturned = true;
          // 1. Re-increment medicine stock
          // Retrieve medicine first to add
          const medRef = doc(db, 'medicines', item.productId);
          const medSnap = await getDoc(medRef);
          if (medSnap.exists()) {
            const currentQty = medSnap.data().quantity || 0;
            await updateDoc(medRef, {
              quantity: currentQty + returnQty
            });
          }
        }
      }

      if (!isAnyReturned) {
        toast.error('Please specify return quantities');
        return;
      }

      // Mark sale document as partially returned / update transaction record
      await updateDoc(doc(db, 'wholesale_private_sales', selectedSaleToReturn.id), {
        returnedItems: returnQuantities,
        status: 'refunded'
      });

      // Append timeline to customer
      const currentCustomer = compiledCustomers.find(c => c.id === selectedSaleToReturn.customerId);
      if (currentCustomer && currentCustomer.isPrivate) {
        const updatedTimeline = [
          ...(currentCustomer.timeline || []),
          { 
            id: `return_${Date.now()}`, 
            type: 'return', 
            title: 'POS Sales Return Registered', 
            description: `Returned items from invoice: ${selectedSaleToReturn.id.slice(-8).toUpperCase()}. Stock replenished.`, 
            timestamp: Date.now() 
          }
        ];
        await updateDoc(doc(db, 'wholesale_customers', currentCustomer.id), {
          timeline: updatedTimeline
        });
      }

      toast.success('Return processed and inventory restored!');
      setSelectedSaleToReturn(null);
      setReturnQuantities({});
    } catch (err: any) {
      console.error(err);
      toast.error('Refund processing failed.');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    try {
      const headers = ['Business Name', 'Category', 'Contact Person', 'Phone', 'Email', 'Region', 'Status', 'Total Orders', 'Total Spending', 'Outstanding Balance'];
      const rows = compiledCustomers.map(c => [
        `"${c.businessName}"`,
        c.customerType.toUpperCase(),
        `"${c.ownerName}"`,
        `"${c.phone}"`,
        c.email,
        c.region,
        c.status.toUpperCase(),
        c.totalOrders,
        c.totalSpending.toFixed(2),
        c.outstandingBalance.toFixed(2)
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Wholesaler_Customers_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Customers directory exported successfully!');
    } catch (e) {
      toast.error('Could not export CSV');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Navigation Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 gap-6">
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition relative ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          {activeTab === 'dashboard' && <motion.div layoutId="activeCRM" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
          CRM Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('directory')} 
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition relative ${activeTab === 'directory' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          {activeTab === 'directory' && <motion.div layoutId="activeCRM" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
          Customers Directory
        </button>
        <button 
          onClick={() => setActiveTab('pos')} 
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition relative ${activeTab === 'pos' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          {activeTab === 'pos' && <motion.div layoutId="activeCRM" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
          Private POS Sales
        </button>
        <button 
          onClick={() => setActiveTab('sales')} 
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition relative ${activeTab === 'sales' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          {activeTab === 'sales' && <motion.div layoutId="activeCRM" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
          POS Sales History
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* TAB 1: CRM DASHBOARD */}
        {activeTab === 'dashboard' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Bento Grid Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Connected Accounts</p>
                <h4 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">{metrics.total}</h4>
                <span className="text-[10px] text-slate-400 block mt-2">{metrics.active} Active accounts in CRM</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Accumulated CRM Revenue</p>
                <h4 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">${metrics.totalSpending.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h4>
                <span className="text-[10px] text-slate-400 block mt-2">Aggregated B2B and POS sales</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Credit Ledger Outstanding</p>
                <h4 className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">${metrics.totalOutstanding.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h4>
                <span className="text-[10px] text-rose-500 font-bold block mt-2">Requires direct matching</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Repeat Client Rate</p>
                <h4 className="text-2xl font-extrabold text-blue-600 mt-1">
                  {metrics.total > 0 ? ((compiledCustomers.filter(c => c.totalOrders > 1).length / metrics.total) * 100).toFixed(0) : 0}%
                </h4>
                <span className="text-[10px] text-slate-400 block mt-2">More than 1 purchase lifecycle</span>
              </div>
            </div>

            {/* Recharts Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">Top Customers by Wholesale Procurement Volume</h4>
                  <TrendingUp size={16} className="text-slate-400" />
                </div>
                {chartData.topRevenue.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-xs text-slate-400">Generate POS/B2B invoices to render data streams.</div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.topRevenue}>
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">Demographics Mix</h4>
                {chartData.typeDist.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-xs text-slate-400">No demographics logs present.</div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={chartData.typeDist} 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={60} 
                          outerRadius={80} 
                          paddingAngle={5} 
                          dataKey="value"
                        >
                          {chartData.typeDist.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: CUSTOMER DIRECTORY */}
        {activeTab === 'directory' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Search, Filter & CTA Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex flex-wrap gap-2.5 items-center w-full md:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search by name, owner, TIN..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-1.5 w-60 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="pharmacy">Pharmacies</option>
                  <option value="clinic">Clinics</option>
                  <option value="hospital">Hospitals</option>
                  <option value="medical_store">Medical Stores</option>
                  <option value="ngo">NGO Facilites</option>
                  <option value="government">Government</option>
                </select>

                <select 
                  value={filterRating}
                  onChange={(e) => setFilterRating(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="all">All Ratings</option>
                  <option value="VIP">VIP</option>
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                  <option value="Bronze">Bronze</option>
                </select>
              </div>

              <div className="flex gap-2 w-full md:w-auto justify-end">
                <button 
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  <FileDown size={14} />
                  Export CSV
                </button>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                >
                  <UserPlus size={14} />
                  Add Customer
                </button>
              </div>
            </div>

            {/* Customers Grid/List */}
            {filteredCustomers.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl py-12 text-center text-slate-400 text-xs border border-slate-100 dark:border-slate-800 shadow-sm">
                No matching wholesaler customer profiles found. Add new Private Accounts above!
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-850">
                        <th className="p-4">Customer Details</th>
                        <th className="p-4">Demographics</th>
                        <th className="p-4">Score & Status</th>
                        <th className="p-4">Orders Sync</th>
                        <th className="p-4">Procured Spending</th>
                        <th className="p-4">Credit Limit Balance</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-850/80">
                      {filteredCustomers.map(cust => (
                        <tr key={cust.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-805/10 transition">
                          <td className="p-4">
                            <div>
                              <p className="font-extrabold text-slate-800 dark:text-white text-xs">{cust.businessName}</p>
                              <span className="text-[10px] text-slate-400 mt-0.5 block">Owner: {cust.ownerName} | ID: {cust.id.slice(-6).toUpperCase()}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 block w-max">
                              {cust.customerType}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-1">{cust.region}, {cust.city || 'Central'}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {/* Dynamic Score Indicator */}
                              <div className="relative w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-805 border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-black text-slate-800 dark:text-white">{cust.score}</span>
                              </div>
                              <div>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold block w-max uppercase ${
                                  cust.rating === 'VIP' ? 'bg-purple-100 text-purple-800' :
                                  cust.rating === 'Gold' ? 'bg-amber-100 text-amber-800' :
                                  cust.rating === 'Silver' ? 'bg-slate-100 text-slate-700' : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {cust.rating}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{cust.totalOrders} batches</span>
                            <span className={`text-[9px] font-bold block mt-0.5 ${cust.isPrivate ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600'}`}>
                              {cust.isPrivate ? 'Manual CRM Record' : 'Linked A-Tech Org'}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-emerald-600">${cust.totalSpending.toFixed(2)}</p>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">Procured overall</span>
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-slate-800 dark:text-white">${cust.outstandingBalance.toFixed(2)}</p>
                            <span className="text-[9px] text-slate-400 block mt-0.5">Limit: ${cust.creditLimit}</span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => setSelectedCustomer(cust)}
                                className="p-1 text-slate-400 hover:text-blue-600 transition"
                                title="Open detailed profile timeline"
                              >
                                <ChevronRight size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 3: PRIVATE POS SALES */}
        {activeTab === 'pos' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left Column: Product Picker */}
            <div className="lg:col-span-2 space-y-4">
              {/* Customer Selector & Barcode */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Select CRM Customer</label>
                    <select 
                      value={selectedPosCustId}
                      onChange={(e) => setSelectedPosCustId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white focus:outline-none"
                    >
                      <option value="">-- Select Active Customer --</option>
                      {compiledCustomers.filter(c => c.status === 'active').map(c => (
                        <option key={c.id} value={c.id}>{c.businessName} [Rating: ${c.rating} | Balance: $${c.outstandingBalance}]</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Barcode scanner emulation */}
                  <form onSubmit={handleBarcodeSubmit}>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Barcode Scanner / SKU Input</label>
                    <div className="relative">
                      <ScanLine className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Scan or type batch ID and press Enter..." 
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        className="w-full pl-9 pr-20 py-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white focus:outline-none"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (inventory.length > 0) {
                            const randIdx = Math.floor(Math.random() * inventory.length);
                            setBarcodeInput(inventory[randIdx].batchNumber);
                            toast.success('Simulated physical scanner click! Press Enter to scan.');
                          } else {
                            toast.error('Inventory ledger is empty');
                          }
                        }}
                        className="absolute right-2 top-1.5 px-2 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 rounded-lg text-[9px] font-bold uppercase text-slate-600 dark:text-slate-300"
                      >
                        Simulate
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Inventory Lookup */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white">Active Warehouse Inventory</h4>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="Search drugs by name..." 
                      value={posSearchTerm}
                      onChange={(e) => setPosSearchTerm(e.target.value)}
                      className="pl-8 pr-4 py-1.5 w-48 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] focus:outline-none"
                    />
                  </div>
                </div>

                {filteredInventory.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">No active stock matches your warehouse search.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                    {filteredInventory.map(prod => (
                      <div 
                        key={prod.id}
                        onClick={() => addToCart(prod)}
                        className="p-3 rounded-2xl border border-slate-100 hover:border-blue-500/30 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-white cursor-pointer transition text-xs flex justify-between items-center"
                      >
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white">{prod.name}</p>
                          <span className="text-[10px] text-slate-400 block mt-0.5">B: {prod.batchNumber} | Exp: {prod.expiryDate}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-800 dark:text-white">${prod.price.toFixed(2)}</p>
                          <span className={`text-[9px] font-bold ${prod.quantity < 50 ? 'text-rose-500' : 'text-slate-400'}`}>
                            {prod.quantity} units left
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Shopping Cart Checkout */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShoppingCart size={16} className="text-blue-600" />
                    Wholesaler Terminal Cart
                  </h4>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 font-extrabold px-2 py-0.5 rounded-full">{posCart.length} lines</span>
                </div>

                {posCart.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">Checkout cart is currently empty. Tap warehouse inventory drugs or scan barcodes to begin!</div>
                ) : (
                  <div className="space-y-4">
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {posCart.map(item => (
                        <div key={item.product.id} className="p-2 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-xs flex justify-between items-center">
                          <div className="truncate pr-2">
                            <p className="font-bold truncate text-slate-900 dark:text-white">{item.product.name}</p>
                            <span className="text-[9px] text-slate-400">Batch: {item.product.batchNumber} @ ${item.product.price.toFixed(2)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button 
                              onClick={() => updateCartQty(item.product.id, item.quantity - 1, item.product.quantity)}
                              className="w-5 h-5 flex items-center justify-center bg-white dark:bg-slate-800 rounded border border-slate-100"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold w-6 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateCartQty(item.product.id, item.quantity + 1, item.product.quantity)}
                              className="w-5 h-5 flex items-center justify-center bg-white dark:bg-slate-800 rounded border border-slate-100"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bill Aggregates */}
                    <div className="border-t border-slate-100 dark:border-slate-850 pt-3 space-y-2 text-xs">
                      {/* Overall discount */}
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold uppercase text-[9px]">Overall Discount (%)</span>
                        <input 
                          type="number" 
                          placeholder="0"
                          value={posDiscount}
                          onChange={(e) => setPosDiscount(e.target.value)}
                          className="w-16 text-right px-2 py-1 rounded bg-slate-50 border border-slate-100 text-xs focus:outline-none"
                        />
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold uppercase text-[9px]">Apply Standard Tax (15% VAT)</span>
                        <input 
                          type="checkbox" 
                          checked={posTaxEnabled}
                          onChange={(e) => setPosTaxEnabled(e.target.checked)}
                          className="h-3.5 w-3.5 text-blue-600 rounded"
                        />
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-850 pt-2 space-y-1">
                        <div className="flex justify-between text-slate-500">
                          <span>Subtotal:</span>
                          <span className="font-bold">${posTotals.subtotal.toFixed(2)}</span>
                        </div>
                        {parseFloat(posDiscount) > 0 && (
                          <div className="flex justify-between text-rose-500">
                            <span>Discount:</span>
                            <span>-${posTotals.discountValue.toFixed(2)}</span>
                          </div>
                        )}
                        {posTaxEnabled && (
                          <div className="flex justify-between text-slate-500">
                            <span>VAT Amount (15%):</span>
                            <span>${posTotals.vatAmount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-extrabold border-t border-slate-50 dark:border-slate-850 pt-1.5 text-slate-900 dark:text-white">
                          <span>TOTAL VALUE:</span>
                          <span>${posTotals.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment methods */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Payment Channel</label>
                        <div className="grid grid-cols-2 gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                          {['cash', 'bank', 'credit', 'mixed'].map(method => (
                            <button 
                              key={method}
                              type="button"
                              onClick={() => setPosPaymentMethod(method as any)}
                              className={`p-1.5 border rounded-lg uppercase transition ${posPaymentMethod === method ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-100 hover:bg-slate-50'}`}
                            >
                              {method}
                            </button>
                          ))}
                        </div>
                      </div>

                      {posPaymentMethod === 'mixed' && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[9px] text-slate-400 block mb-1">CASH PORTION ($)</span>
                            <input 
                              type="number" 
                              value={mixedCashAmount}
                              onChange={(e) => setMixedCashAmount(e.target.value)}
                              className="w-full px-2 py-1 bg-slate-50 rounded border"
                            />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block mb-1">BANK PORTION ($)</span>
                            <input 
                              type="number" 
                              value={mixedBankAmount}
                              onChange={(e) => setMixedBankAmount(e.target.value)}
                              className="w-full px-2 py-1 bg-slate-50 rounded border"
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button 
                          onClick={saveAsDraft}
                          className="py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 dark:border-slate-800 dark:text-white rounded-xl text-xs font-semibold uppercase transition"
                        >
                          Hold / Draft
                        </button>
                        <button 
                          onClick={handlePosCheckout}
                          className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold uppercase transition shadow-sm"
                        >
                          Checkout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Active Hold Drafts list */}
              {posDrafts.length > 0 && (
                <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                  <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400">Held POS Draft Orders</h4>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {posDrafts.map(draft => (
                      <div key={draft.id} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/20 text-xs flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{draft.customerName}</p>
                          <span className="text-[9px] text-slate-400 block">{new Date(draft.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => loadDraft(draft)}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-[10px] font-bold"
                          >
                            Load
                          </button>
                          <button 
                            onClick={() => deleteDraft(draft.id)}
                            className="p-1 text-slate-300 hover:text-rose-500 transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 4: POS SALES HISTORY & DAILY SUMMARY */}
        {activeTab === 'sales' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Daily stats summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="p-3">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Cash POS Billings</span>
                <p className="text-lg font-black text-slate-800 dark:text-white mt-1">
                  ${privateSales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.totalAmount, 0).toFixed(2)}
                </p>
              </div>
              <div className="p-3 border-l border-slate-100 dark:border-slate-850">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Bank POS Billings</span>
                <p className="text-lg font-black text-slate-800 dark:text-white mt-1">
                  ${privateSales.filter(s => s.paymentMethod === 'bank').reduce((sum, s) => sum + s.totalAmount, 0).toFixed(2)}
                </p>
              </div>
              <div className="p-3 border-l border-slate-100 dark:border-slate-850">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Credit POS Billings</span>
                <p className="text-lg font-black text-slate-800 dark:text-white mt-1">
                  ${privateSales.filter(s => s.paymentMethod === 'credit').reduce((sum, s) => sum + s.totalAmount, 0).toFixed(2)}
                </p>
              </div>
              <div className="p-3 border-l border-slate-100 dark:border-slate-850">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Mixed POS Billings</span>
                <p className="text-lg font-black text-slate-800 dark:text-white mt-1">
                  ${privateSales.filter(s => s.paymentMethod === 'mixed').reduce((sum, s) => sum + s.totalAmount, 0).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Sales Table log */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-850">
                      <th className="p-4">Invoice ID</th>
                      <th className="p-4">Customer Name</th>
                      <th className="p-4">Items Procured</th>
                      <th className="p-4">Subtotal</th>
                      <th className="p-4">Total Amount</th>
                      <th className="p-4">Payment Channel</th>
                      <th className="p-4">Timestamp</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-850/80">
                    {privateSales.map(sale => (
                      <tr key={sale.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-805/10 transition">
                        <td className="p-4 font-mono font-bold text-blue-600">
                          #{sale.id.slice(-8).toUpperCase()}
                        </td>
                        <td className="p-4 font-bold text-slate-800 dark:text-white">
                          {sale.customerName}
                        </td>
                        <td className="p-4 text-slate-500 font-medium">
                          {sale.items.map((it: any) => `${it.name} (x${it.quantity})`).join(', ').slice(0, 30)}...
                        </td>
                        <td className="p-4 text-slate-400">
                          ${sale.subtotal.toFixed(2)}
                        </td>
                        <td className="p-4 font-black text-slate-900 dark:text-white">
                          ${sale.totalAmount.toFixed(2)}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">
                            {sale.paymentMethod}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button 
                              onClick={() => handlePrintReceipt(sale)}
                              className="text-slate-400 hover:text-blue-600 transition"
                              title="Reprint Invoice"
                            >
                              <Printer size={15} />
                            </button>
                            {sale.status !== 'refunded' ? (
                              <button 
                                onClick={() => {
                                  setSelectedSaleToReturn(sale);
                                  // Initialize default quantities to return to 0
                                  const initReturnMap: Record<string, number> = {};
                                  sale.items.forEach((it: any) => { initReturnMap[it.productId] = 0; });
                                  setReturnQuantities(initReturnMap);
                                }}
                                className="text-slate-400 hover:text-rose-500 transition"
                                title="Process Refund Return"
                              >
                                <RotateCcw size={15} />
                              </button>
                            ) : (
                              <span className="text-[9px] text-rose-500 font-bold uppercase">Returned</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 1: ADD PRIVATE CUSTOMER PROFILE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-100 dark:border-slate-800 shadow-xl max-h-[85vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="text-blue-600" size={18} />
                Estabilish CRM Private Client Profile
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-4 text-xs text-slate-800 dark:text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1 uppercase tracking-wider text-[10px] text-slate-400">Business / Clinic Name *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 uppercase tracking-wider text-[10px] text-slate-400">Customer Type</label>
                  <select 
                    value={formData.customerType}
                    onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none"
                  >
                    <option value="pharmacy">Pharmacy</option>
                    <option value="clinic">Clinic</option>
                    <option value="hospital">Hospital</option>
                    <option value="medical_store">Medical Store</option>
                    <option value="ngo">NGO Clinic</option>
                    <option value="government">Government Facility</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 uppercase tracking-wider text-[10px] text-slate-400">Primary Contact / Owner Name</label>
                  <input 
                    type="text" 
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 uppercase tracking-wider text-[10px] text-slate-400">Mobile Phone No *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 uppercase tracking-wider text-[10px] text-slate-400">Alternate Phone</label>
                  <input 
                    type="text" 
                    value={formData.alternativePhone}
                    onChange={(e) => setFormData({ ...formData, alternativePhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 uppercase tracking-wider text-[10px] text-slate-400">Email Address</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 uppercase tracking-wider text-[10px] text-slate-400">TIN Registration Number</label>
                  <input 
                    type="text" 
                    value={formData.tinNumber}
                    onChange={(e) => setFormData({ ...formData, tinNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 uppercase tracking-wider text-[10px] text-slate-400">Trading / Medical License No</label>
                  <input 
                    type="text" 
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 uppercase tracking-wider text-[10px] text-slate-400">Region Location</label>
                  <select 
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none"
                  >
                    <option value="Addis Ababa">Addis Ababa</option>
                    <option value="Oromia">Oromia</option>
                    <option value="Amhara">Amhara</option>
                    <option value="Tigray">Tigray</option>
                    <option value="Sidama">Sidama</option>
                    <option value="Harari">Harari</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 uppercase tracking-wider text-[10px] text-slate-400">City / Operational Sector</label>
                  <input 
                    type="text" 
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 uppercase tracking-wider text-[10px] text-slate-400">Payment Terms</label>
                  <select 
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none"
                  >
                    <option value="Cash">Cash On Delivery</option>
                    <option value="Bank Transfer">Bank Electronic Transfer</option>
                    <option value="Credit 15 Days">15-Day Credit Window</option>
                    <option value="Credit 30 Days">30-Day Credit Window</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 uppercase tracking-wider text-[10px] text-slate-400">Granted Credit Limit ($)</label>
                  <input 
                    type="number" 
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 uppercase tracking-wider text-[10px] text-slate-400">Internal Audit & Sales CRM Notes</label>
                <textarea 
                  value={formData.internalNotes}
                  onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none"
                  placeholder="Insert any relevant credit scores, preferred reps, logistics preferences..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-50">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-white rounded-xl font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase tracking-wider shadow-sm"
                >
                  Authorize Profile
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* DRAWER MODAL 2: CUSTOMER DETAIL CRM TIMELINE */}
      {selectedCustomer && (
        <div className="fixed inset-y-0 right-0 max-w-lg w-full bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 shadow-2xl z-[1000] p-6 flex flex-col justify-between">
          <div className="space-y-6 overflow-y-auto pr-1">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-850 pb-3">
              <div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                  selectedCustomer.rating === 'VIP' ? 'bg-purple-100 text-purple-800' :
                  selectedCustomer.rating === 'Gold' ? 'bg-amber-100 text-amber-800' :
                  selectedCustomer.rating === 'Silver' ? 'bg-slate-100 text-slate-700' : 'bg-orange-100 text-orange-800'
                }`}>
                  {selectedCustomer.rating} RATING
                </span>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1.5">{selectedCustomer.businessName}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Primary Owner: {selectedCustomer.ownerName}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            {/* Profile Overview */}
            <div className="bg-slate-50 dark:bg-slate-950/20 p-4 rounded-2xl text-[11px] space-y-2 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              <p><strong>Phone:</strong> {selectedCustomer.phone}</p>
              <p><strong>Email:</strong> {selectedCustomer.email || 'N/A'}</p>
              <p><strong>TIN Reg No:</strong> {selectedCustomer.tinNumber || 'N/A'}</p>
              <p><strong>Credit Limits:</strong> ${selectedCustomer.creditLimit} | <strong>Outstanding:</strong> ${selectedCustomer.outstandingBalance.toFixed(2)}</p>
              <p><strong>Score Index:</strong> {selectedCustomer.score} / 100</p>
            </div>

            {/* Platform Integration Actions (Invite/Link) */}
            <div className="space-y-3 p-4 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100/30 dark:border-blue-800/20 rounded-2xl">
              <h4 className="font-bold text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <QrCode size={14} />
                A-Tech Smart Invitation Channel
              </h4>
              
              {!selectedCustomer.isPrivate ? (
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-xl">
                  <CheckCircle size={14} />
                  Already Converted to Official A-Tech Node
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Generate an official registration invitation. Once approved, all historical billing ledger and data structures bind instantly to their official live account.
                  </p>
                  
                  {selectedCustomer.timeline?.some(t => t.type === 'invite') ? (
                    <div className="space-y-2 text-[11px] text-slate-700 dark:text-slate-300">
                      <div className="p-2 bg-white dark:bg-slate-950 rounded border border-slate-100 font-mono text-[9px] break-all select-all">
                        {`${window.location.origin}/?refWholesale=${user.uid}&inviteCustId=${selectedCustomer.id}`}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/?refWholesale=${user.uid}&inviteCustId=${selectedCustomer.id}`);
                            toast.success('Onboarding invite link copied to clipboard!');
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-slate-900 text-white rounded-lg font-bold"
                        >
                          <Share2 size={12} /> Copy Link
                        </button>
                        <a 
                          href={`mailto:${selectedCustomer.email}?subject=Join A-Tech Ecosystem&body=Hi ${selectedCustomer.businessName}, register here: ${window.location.origin}/?refWholesale=${user.uid}%26inviteCustId=${selectedCustomer.id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-blue-600 text-white rounded-lg font-bold text-center"
                        >
                          <Mail size={12} /> Send Email
                        </a>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleSendInvitation(selectedCustomer)}
                      className="w-full p-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
                    >
                      Invite to Join A-Tech
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Timeline Audit Logs */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider">CRM Activity & Billing Timeline</h4>
              <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                {(selectedCustomer.timeline || []).map((t, idx) => (
                  <div key={idx} className="flex gap-3 text-xs pl-0.5">
                    <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[8px] font-black text-white relative z-10 mt-1">
                      {idx + 1}
                    </div>
                    <div className="flex-1 bg-slate-50/50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                      <p className="font-extrabold text-slate-800 dark:text-white">{t.title}</p>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">{t.description}</p>
                      <span className="text-[9px] text-slate-400 mt-1.5 block">{new Date(t.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex gap-2">
            {selectedCustomer.isPrivate && (
              <button 
                onClick={() => {
                  handleUpdateStatus(selectedCustomer.id, selectedCustomer.status);
                  setSelectedCustomer(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition ${selectedCustomer.status === 'active' ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
              >
                {selectedCustomer.status === 'active' ? 'Suspended Account' : 'Activate Account'}
              </button>
            )}
            <button 
              onClick={() => setSelectedCustomer(null)}
              className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: POS SALES RETURN / REFUND SCREEN */}
      {selectedSaleToReturn && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 border border-slate-100 dark:border-slate-800 shadow-xl"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <RotateCcw className="text-rose-500" size={18} />
                Fulfill POS Sales Return & Refund
              </h3>
              <button onClick={() => setSelectedSaleToReturn(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-400">
                Invoice ID: <strong>#{selectedSaleToReturn.id.slice(-8).toUpperCase()}</strong> | Customer: <strong>{selectedSaleToReturn.customerName}</strong>
              </p>
              
              <div className="space-y-3">
                {selectedSaleToReturn.items.map((item: any) => (
                  <div key={item.productId} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/20">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">{item.name}</p>
                      <span className="text-[10px] text-slate-400">Batch: {item.batchNumber} | Quantity Sold: {item.quantity}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Return Qty:</span>
                      <input 
                        type="number" 
                        min="0"
                        max={item.quantity}
                        value={returnQuantities[item.productId] || 0}
                        onChange={(e) => setReturnQuantities({
                          ...returnQuantities,
                          [item.productId]: Math.min(item.quantity, Math.max(0, parseInt(e.target.value) || 0))
                        })}
                        className="w-16 px-2 py-1 bg-white border rounded text-right focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-50">
                <button 
                  onClick={() => setSelectedSaleToReturn(null)}
                  className="px-4 py-2 border rounded-xl font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleReturnExecution}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold uppercase tracking-wider"
                >
                  Process Stock Replenishment
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
