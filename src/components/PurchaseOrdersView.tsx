import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  setDoc,
  doc, 
  getDoc,
  getDocs,
  updateDoc,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, InventoryProduct, Branch, Warehouse } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  Check, 
  X, 
  ShoppingBag, 
  Truck, 
  Calendar, 
  DollarSign, 
  BarChart2, 
  Hash, 
  AlertCircle, 
  TrendingUp, 
  Info, 
  ArrowRight, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  MapPin, 
  Loader2, 
  Clock, 
  Search,
  Building2,
  Lock,
  ChevronRight,
  FileSpreadsheet
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
  Cell,
  Legend
} from 'recharts';
import toast from 'react-hot-toast';

// Define Purchase Status
export type PurchaseStatus = 
  | 'draft' 
  | 'pending_approval' 
  | 'approved' 
  | 'rejected' 
  | 'ordered' 
  | 'received_part' 
  | 'received_full' 
  | 'completed';

export interface PurchaseOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  quantityReceived: number;
}

export interface PurchaseOrder {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  createdById: string;
  createdByName: string;
  createdAt: number;
  updatedAt: number;
  status: PurchaseStatus;
  
  supplierId?: string;
  supplierName?: string;
  supplierType?: 'importer' | 'local';
  
  items: PurchaseOrderItem[];
  totalAmount: number;
  
  branchId?: string;
  warehouseId?: string;
  
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: number;
  notes?: string;
  
  invoiceNumber?: string;
  invoiceAmount?: number;
  invoiceMatched?: 'pending' | 'matched' | 'mismatched';
  invoiceNotes?: string;
}

interface PurchaseOrdersViewProps {
  user: UserProfile;
  branches: Branch[];
  warehouses: Warehouse[];
}

export default function PurchaseOrdersView({ user, branches = [], warehouses = [] }: PurchaseOrdersViewProps) {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [marketplaceProducts, setMarketplaceProducts] = useState<any[]>([]);
  const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>([]);
  const [suppliers, setSuppliers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'requests' | 'approvals' | 'po' | 'receiving' | 'invoices'>('overview');
  
  // Modals state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  
  // Selected items for detail/editing
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  
  // Form states
  const [prNote, setPrNote] = useState('');
  const [prItems, setPrItems] = useState<PurchaseOrderItem[]>([]);
  const [prBranchId, setPrBranchId] = useState('');
  const [prWarehouseId, setPrWarehouseId] = useState('');
  const [prSupplierType, setPrSupplierType] = useState<'importer' | 'local'>('importer');
  const [prSupplierId, setPrSupplierId] = useState('');
  const [prSupplierName, setPrSupplierName] = useState('');
  
  // Receive goods item form state
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>({});
  const [receiveBatches, setReceiveBatches] = useState<Record<string, string>>({});
  const [receiveExpiries, setReceiveExpiries] = useState<Record<string, string>>({});
  
  // Invoice form state
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState<number>(0);
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Search keyword inside request modal
  const [searchTerm, setSearchTerm] = useState('');

  const ownerId = user.role === 'staff' ? (user.pharmacyId || user.uid) : user.uid;

  // Listen to purchase orders
  useEffect(() => {
    if (!ownerId) return;
    setLoading(true);
    const q = query(collection(db, 'purchase_orders'), where('pharmacyId', '==', ownerId));
    const unsub = onSnapshot(q, (snapshot) => {
      const pos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder))
        .sort((a, b) => b.createdAt - a.createdAt);
      setPurchaseOrders(pos);
      setLoading(false);
    }, (err) => {
      console.error(err);
      toast.error('Failed to load purchase orders.');
      setLoading(false);
    });

    // Load marketplace products for integration
    const qMarketplace = query(collection(db, 'products'), where('country', '==', user.country || 'Ethiopia'));
    const unsubMarketplace = onSnapshot(qMarketplace, (snap) => {
      setMarketplaceProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Load actual medicine inventory for matching suggestions
    const qMedicines = query(collection(db, 'medicines'), where('pharmacyId', '==', ownerId));
    const unsubMed = onSnapshot(qMedicines, (snap) => {
      setInventoryProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryProduct)));
    });

    // Load approved importers for supplier assignments
    const qSuppliers = query(
      collection(db, 'users'), 
      where('role', '==', 'importer'),
      where('verificationStatus', '==', 'approved')
    );
    const unsubSuppliers = onSnapshot(qSuppliers, (snap) => {
      setSuppliers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
    });

    return () => {
      unsub();
      unsubMarketplace();
      unsubMed();
      unsubSuppliers();
    };
  }, [ownerId, user.country]);

  // Handle creating Purchase Request
  const handleCreateRequest = async (asDraft = false) => {
    if (prItems.length === 0) {
      toast.error('Please add at least one item to the request.');
      return;
    }
    
    const targetStatus: PurchaseStatus = asDraft ? 'draft' : 'pending_approval';
    const total = prItems.reduce((sum, item) => sum + item.total, 0);
    
    const newPO: Omit<PurchaseOrder, 'id'> = {
      pharmacyId: ownerId,
      pharmacyName: user.pharmacyName || user.displayName || 'Pharmacy Group',
      createdById: user.uid,
      createdByName: user.displayName || 'Staff Member',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: targetStatus,
      items: prItems,
      totalAmount: total,
      notes: prNote
    };

    if (prBranchId) newPO.branchId = prBranchId;
    if (prWarehouseId) newPO.warehouseId = prWarehouseId;
    if (prSupplierId) {
      newPO.supplierId = prSupplierId;
      newPO.supplierName = prSupplierName;
      newPO.supplierType = prSupplierType;
    }

    try {
      await addDoc(collection(db, 'purchase_orders'), newPO);
      toast.success(asDraft ? 'Purchase request saved to drafts!' : 'Purchase request submitted for approval!');
      setShowRequestModal(false);
      resetRequestForm();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create purchase request.');
    }
  };

  const resetRequestForm = () => {
    setPrNote('');
    setPrItems([]);
    setPrBranchId('');
    setPrWarehouseId('');
    setPrSupplierId('');
    setPrSupplierName('');
  };

  const addProductToPR = (p: any, isMarketplace = false) => {
    const existingIndex = prItems.findIndex(item => item.productId === p.id);
    if (existingIndex > -1) {
      const updated = [...prItems];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setPrItems(updated);
    } else {
      setPrItems([
        ...prItems,
        {
          productId: p.id,
          name: p.name,
          quantity: 1,
          unitPrice: isMarketplace ? p.price : (p.costPrice || p.price || 0),
          total: isMarketplace ? p.price : (p.costPrice || p.price || 0),
          quantityReceived: 0
        }
      ]);
    }
    toast.success(`"${p.name}" added to request.`);
  };

  const handleUpdateItemQty = (index: number, qty: number) => {
    if (qty < 1) return;
    const updated = [...prItems];
    updated[index].quantity = qty;
    updated[index].total = qty * updated[index].unitPrice;
    setPrItems(updated);
  };

  const handleUpdateItemPrice = (index: number, price: number) => {
    if (price < 0) return;
    const updated = [...prItems];
    updated[index].unitPrice = price;
    updated[index].total = updated[index].quantity * price;
    setPrItems(updated);
  };

  const handleRemovePRItem = (index: number) => {
    const updated = prItems.filter((_, i) => i !== index);
    setPrItems(updated);
  };

  // Approval Process
  const handleApprovePO = async (po: PurchaseOrder, approve = true) => {
    const nextStatus: PurchaseStatus = approve ? 'approved' : 'rejected';
    try {
      await updateDoc(doc(db, 'purchase_orders', po.id), {
        status: nextStatus,
        approvedById: user.uid,
        approvedByName: user.displayName || 'Owner',
        approvedAt: Date.now(),
        updatedAt: Date.now()
      });
      toast.success(approve ? 'Purchase request approved!' : 'Purchase request rejected.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to process approval.');
    }
  };

  // PO Generation & Supplier Assignment
  const handleAssignSupplier = async (po: PurchaseOrder) => {
    if (!prSupplierId) {
      toast.error('Please select a supplier first.');
      return;
    }

    try {
      await updateDoc(doc(db, 'purchase_orders', po.id), {
        supplierId: prSupplierId,
        supplierName: prSupplierName,
        supplierType: prSupplierType,
        status: 'ordered',
        updatedAt: Date.now()
      });

      // If supplier is a B2B Wholesale Pharmacy, optionally generate a synchronized B2B Order!
      if (prSupplierType === 'importer') {
        const orderPayload = {
          pharmacyId: ownerId,
          pharmacyName: user.pharmacyName || user.displayName || 'Pharmacy',
          pharmacyCreatedAt: Date.now(),
          importerId: prSupplierId,
          importerName: prSupplierName,
          items: po.items.map(item => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.unitPrice,
            total: item.total
          })),
          totalAmount: po.totalAmount,
          commissionAmount: po.totalAmount * 0.03,
          status: 'pending',
          country: user.country || 'Ethiopia',
          createdAt: Date.now(),
          deliveryMethod: 'delivery',
          deliveryAddress: user.address || 'Select during dispatch',
          purchaseGroupId: po.id // Link them
        };
        await addDoc(collection(db, 'orders'), orderPayload);
        toast.success(`PO Created and synchronised with Wholesale Pharmacy: ${prSupplierName}!`);
      } else {
        toast.success('PO Created and sent to Local Supplier!');
      }

      setShowSupplierModal(false);
      setSelectedPO(null);
      resetRequestForm();
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate purchase order.');
    }
  };

  // Goods Receiving
  const handleOpenReceive = (po: PurchaseOrder) => {
    setSelectedPO(po);
    const initialQty: Record<string, number> = {};
    const initialBatches: Record<string, string> = {};
    const initialExpiries: Record<string, string> = {};
    
    po.items.forEach(item => {
      const remaining = item.quantity - (item.quantityReceived || 0);
      initialQty[item.productId] = remaining > 0 ? remaining : 0;
      initialBatches[item.productId] = '';
      initialExpiries[item.productId] = '';
    });

    setReceiveQuantities(initialQty);
    setReceiveBatches(initialBatches);
    setReceiveExpiries(initialExpiries);
    setShowReceiveModal(true);
  };

  const handleRecordReceiving = async () => {
    if (!selectedPO) return;

    // We must destination allocate (either branchId or warehouseId).
    const targetBranchId = selectedPO.branchId || `main_branch_${ownerId}`;
    const targetWarehouseId = selectedPO.warehouseId || '';

    const batch = writeBatch(db);
    const updatedItems = [...selectedPO.items];
    let allReceivedFull = true;

    for (let index = 0; index < updatedItems.length; index++) {
      const item = updatedItems[index];
      const newlyReceived = Number(receiveQuantities[item.productId] || 0);
      
      if (newlyReceived < 0) {
        toast.error('Received quantity cannot be negative.');
        return;
      }

      const totalReceived = (item.quantityReceived || 0) + newlyReceived;
      item.quantityReceived = totalReceived;

      if (totalReceived < item.quantity) {
        allReceivedFull = false;
      }

      if (newlyReceived > 0) {
        const batchNum = receiveBatches[item.productId]?.trim() || `PO-${selectedPO.id.slice(-5).toUpperCase()}`;
        const expiry = receiveExpiries[item.productId] || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Let's find matches in current medicines or create new
        const existingMed = inventoryProducts.find(m => 
          m.name.toLowerCase() === item.name.toLowerCase() && 
          m.batchNumber === batchNum && 
          (targetWarehouseId ? m.warehouseId === targetWarehouseId : m.branchId === targetBranchId)
        );

        if (existingMed) {
          // Update existing stock
          const medRef = doc(db, 'medicines', existingMed.id);
          batch.update(medRef, {
            quantity: increment(newlyReceived),
            costPrice: item.unitPrice
          });
        } else {
          // Create new medicine record
          const nextId = 'med_' + Math.random().toString(36).substring(2, 11);
          const newMedRef = doc(db, 'medicines', nextId);
          const newMedicine: any = {
            id: nextId,
            name: item.name,
            category: 'Medicine',
            price: item.unitPrice * 1.25, // Auto set 25% markup on cost price
            costPrice: item.unitPrice,
            quantity: newlyReceived,
            batchNumber: batchNum,
            expiryDate: expiry,
            supplier: selectedPO.supplierName || 'Unknown Supplier',
            pharmacyId: ownerId,
            lowStockThreshold: 10,
            createdAt: Date.now()
          };

          if (targetWarehouseId) {
            newMedicine.warehouseId = targetWarehouseId;
          } else {
            newMedicine.branchId = targetBranchId;
          }

          batch.set(newMedRef, newMedicine);
        }

        // Also if we have a targetWarehouseId, create a Warehouse Transaction
        if (targetWarehouseId) {
          const transId = 'wh_tx_' + Math.random().toString(36).substring(2, 11);
          const transRef = doc(db, 'warehouse_transactions', transId);
          batch.set(transRef, {
            id: transId,
            pharmacyId: ownerId,
            type: 'receiving',
            productId: item.productId,
            productName: item.name,
            batchNumber: batchNum,
            expiryDate: expiry,
            quantity: newlyReceived,
            sourceId: selectedPO.supplierId || 'direct',
            sourceName: selectedPO.supplierName || 'External Vendor',
            destinationId: targetWarehouseId,
            destinationName: warehouses.find(w => w.id === targetWarehouseId)?.name || 'Central Warehouse',
            costPrice: item.unitPrice,
            sellingPrice: item.unitPrice * 1.25,
            createdBy: user.displayName || 'Staff',
            createdAt: Date.now()
          });
        }
      }
    }

    const nextStatus: PurchaseStatus = allReceivedFull ? 'received_full' : 'received_part';

    try {
      const poRef = doc(db, 'purchase_orders', selectedPO.id);
      batch.update(poRef, {
        items: updatedItems,
        status: nextStatus,
        updatedAt: Date.now()
      });

      await batch.commit();
      toast.success('Goods received recorded safely and inventory updated!');
      setShowReceiveModal(false);
      setSelectedPO(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update goods inventory.');
    }
  };

  // Invoice Matching
  const handleOpenInvoice = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setInvoiceNumber('');
    setInvoiceAmount(po.totalAmount); // default matched value
    setInvoiceNotes('');
    setShowInvoiceModal(true);
  };

  const handleMatchInvoice = async () => {
    if (!selectedPO) return;
    if (!invoiceNumber.trim()) {
      toast.error('Please enter an invoice number.');
      return;
    }

    const matchedStatus = Math.abs(invoiceAmount - selectedPO.totalAmount) < 1 
      ? 'matched' 
      : 'mismatched';

    try {
      await updateDoc(doc(db, 'purchase_orders', selectedPO.id), {
        invoiceNumber,
        invoiceAmount,
        invoiceMatched: matchedStatus,
        invoiceNotes,
        status: 'completed', // Move to terminal state
        updatedAt: Date.now()
      });

      if (matchedStatus === 'matched') {
        toast.success('Invoice matched perfectly with PO amount! Purchase completed.');
      } else {
        toast.error(`Invoice saved but marked MISMATCHED! PO: ${selectedPO.totalAmount} ETB vs. Inv: ${invoiceAmount} ETB.`);
      }

      setShowInvoiceModal(false);
      setSelectedPO(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to log invoice matching.');
    }
  };

  // Charts data preparation
  const getOverviewStats = () => {
    const totalRequests = purchaseOrders.length;
    const pendingApproval = purchaseOrders.filter(po => po.status === 'pending_approval');
    const pendingApprovalVol = pendingApproval.reduce((sum, po) => sum + po.totalAmount, 0);
    
    const activePOs = purchaseOrders.filter(po => ['ordered', 'received_part'].includes(po.status));
    const activePOsVol = activePOs.reduce((sum, po) => sum + po.totalAmount, 0);
    
    const completedPOs = purchaseOrders.filter(po => po.status === 'completed');
    const totalSpend = completedPOs.reduce((sum, po) => sum + po.totalAmount, 0);

    const supplierVolume: Record<string, number> = {};
    const monthlySpend: Record<string, number> = {};

    purchaseOrders.forEach(po => {
      if (po.status === 'completed' || po.status === 'received_full' || po.status === 'ordered') {
        const sName = po.supplierName || 'Unassigned';
        supplierVolume[sName] = (supplierVolume[sName] || 0) + po.totalAmount;

        const date = new Date(po.createdAt);
        const month = date.toLocaleString('default', { month: 'short' });
        monthlySpend[month] = (monthlySpend[month] || 0) + po.totalAmount;
      }
    });

    const supplierChartData = Object.entries(supplierVolume).map(([name, value]) => ({ name, value })).slice(0, 5);
    const monthlyChartData = Object.entries(monthlySpend).map(([name, spend]) => ({ name, spend }));

    // Fallback if no data
    const finalMonthlyData = monthlyChartData.length > 0 ? monthlyChartData : [
      { name: 'Jan', spend: 0 },
      { name: 'Feb', spend: 0 },
      { name: 'Mar', spend: 0 },
      { name: 'Apr', spend: 0 },
      { name: 'May', spend: 0 }
    ];

    return {
      totalRequests,
      pendingApprovalCount: pendingApproval.length,
      pendingApprovalVol,
      activePOsCount: activePOs.length,
      activePOsVol,
      totalSpend,
      supplierChartData,
      monthlyChartData: finalMonthlyData
    };
  };

  const stats = getOverviewStats();

  const getStatusBadgeColor = (status: PurchaseStatus) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      case 'pending_approval': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400';
      case 'approved': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400';
      case 'ordered': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400';
      case 'received_part': return 'bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400';
      case 'received_full': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400';
    }
  };

  // Filter lists inside sub-tabs
  const filteredRequests = purchaseOrders.filter(po => ['draft', 'pending_approval', 'rejected'].includes(po.status));
  const filteredApprovals = purchaseOrders.filter(po => po.status === 'pending_approval');
  const filteredPOs = purchaseOrders.filter(po => ['approved', 'ordered', 'received_part', 'received_full', 'completed'].includes(po.status));
  const filteredReceiving = purchaseOrders.filter(po => ['ordered', 'received_part'].includes(po.status));
  const filteredInvoices = purchaseOrders.filter(po => ['received_part', 'received_full', 'completed'].includes(po.status));

  // Search results inside modern Request Modal
  const matchedSearchProducts = 
    searchTerm.trim() === '' ? [] : [
      ...marketplaceProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => ({ ...p, source: 'B2B Marketplace' })),
      ...inventoryProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => ({ ...p, source: 'My Store' }))
    ].slice(0, 8);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      
      {/* Header and Add Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <Layers className="text-blue-600" size={28} />
            Enterprise Procurement System
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Complete Purchase Orders (PO), approval controls, supplier matching, inventory intake, and invoice matching.</p>
        </div>
        
        {/* Purchase Request Action button */}
        {(user.role === 'pharmacy' || user.role === 'staff') && (
          <button 
            onClick={() => {
              resetRequestForm();
              setShowRequestModal(true);
            }}
            className="flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-2xl shadow-xl shadow-blue-100 dark:shadow-none transition-all duration-300 scale-100 hover:scale-[1.02] cursor-pointer"
          >
            <Plus size={20} />
            Raise Purchase Request
          </button>
        )}
      </div>

      {/* Sub tabs navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        {(['overview', 'requests', 'approvals', 'po', 'receiving', 'invoices'] as const).map(tab => {
          const isActive = activeSubTab === tab;
          let label = tab.toUpperCase();
          if (tab === 'po') label = 'Purchase Orders';
          if (tab === 'overview') label = 'Spend Hub';
          if (tab === 'requests') label = 'Requests';
          if (tab === 'approvals') label = `Approvals (${filteredApprovals.length})`;
          if (tab === 'receiving') label = 'Receiving Intake';
          if (tab === 'invoices') label = 'Invoice Match';
          
          return (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all uppercase ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-100 dark:shadow-none' 
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="animate-spin text-blue-600" size={36} />
          <p className="text-slate-400 text-sm font-sans font-medium">Syncing live procurement ledger...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          
          {/* OVERVIEW / SPEND HUB */}
          {activeSubTab === 'overview' && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Approved Spend</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{(stats.totalSpend).toLocaleString()} <span className="text-xs text-blue-500 font-bold">ETB</span></h3>
                    <p className="text-[10px] text-green-500 font-bold flex items-center gap-1"><TrendingUp size={10} /> Cumulative spend</p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center">
                    <DollarSign size={22} />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active PO Backlog</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.activePOsCount} <span className="text-xs text-indigo-500 font-bold">Orders</span></h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Valued at {stats.activePOsVol.toLocaleString()} ETB</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                    <Truck size={22} />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Awaiting Signoff</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.pendingApprovalCount} <span className="text-xs text-amber-500 font-bold">Requests</span></h3>
                    <p className="text-[10px] text-amber-500 font-bold">Requires manager review</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center">
                    <Clock size={22} />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Mismatched Invoices</p>
                    <h3 className="text-2xl font-black text-red-600 dark:text-red-400">
                      {purchaseOrders.filter(po => po.invoiceMatched === 'mismatched').length} <span className="text-xs text-red-500 font-bold">Flags</span>
                    </h3>
                    <p className="text-[10px] text-red-400 font-bold">Alert: Audit required</p>
                  </div>
                  <div className="w-12 h-12 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center">
                    <AlertTriangle size={22} />
                  </div>
                </div>

              </div>

              {/* Spend Analytics Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Monthly spend chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm lg:col-span-2">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-slate-400">
                    <BarChart2 size={16} className="text-blue-500" /> Procurement Spend Trend
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.monthlyChartData}>
                        <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="spend" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Spend (ETB)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Vendor Spend Breakdown */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-slate-400">
                      <Layers size={16} className="text-emerald-500" /> Supplier Spend Share
                    </h3>
                    {stats.supplierChartData.length === 0 ? (
                      <div className="text-center py-12 text-xs italic text-slate-400 dark:text-slate-500">No finalized vendor spend recorded.</div>
                    ) : (
                      <div className="h-44 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stats.supplierChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={65}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {stats.supplierChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: number) => `${v.toLocaleString()} ETB`} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Spend</span>
                          <span className="text-sm font-black dark:text-white">Ledger</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pie legend */}
                  <div className="space-y-1.5 mt-2">
                    {stats.supplierChartData.map((d, index) => (
                      <div key={d.name} className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          {d.name}
                        </span>
                        <span className="font-black dark:text-white">{d.value.toLocaleString()} ETB</span>
                      </div>
                    ))}
                  </div>

                </div>

              </div>

              {/* Highlight Queue Section */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Active Procurement Ledger</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Up-to-date tracking of most recent enterprise purchase orders.</p>
                  </div>
                  <button onClick={() => setActiveSubTab('requests')} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 font-sans">
                    View Requests <ChevronRight size={14} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">
                        <th className="py-3 px-4">PO Ref</th>
                        <th className="py-3 px-4">Date Raised</th>
                        <th className="py-3 px-4">Supplier</th>
                        <th className="py-3 px-4">Destination</th>
                        <th className="py-3 px-4">Total value</th>
                        <th className="py-3 px-4 text-center">Receipts Match</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-850/50">
                      {purchaseOrders.slice(0, 5).map(po => {
                        const dateStr = new Date(po.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                        const locationLabel = po.warehouseId 
                          ? warehouses.find(w => w.id === po.warehouseId)?.name || 'Central WH'
                          : branches.find(b => b.id === po.branchId)?.name || 'Main shop';
                        const totalQty = po.items.reduce((s, i) => s + (i.quantity || 1), 0);
                        const rcvQty = po.items.reduce((s, i) => s + (i.quantityReceived || 0), 0);

                        return (
                          <tr key={po.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all font-sans">
                            <td className="py-4 px-4 font-black text-slate-800 dark:text-slate-200">#{po.id?.slice(-5).toUpperCase() || 'NEW'}</td>
                            <td className="py-4 px-4 text-slate-500 dark:text-slate-400">{dateStr}</td>
                            <td className="py-4 px-4 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <Building2 size={14} className="text-slate-400" />
                              {po.supplierName || <span className="text-slate-400 dark:text-slate-600 font-normal">Unassigned</span>}
                            </td>
                            <td className="py-4 px-4 text-slate-600 dark:text-slate-400 font-medium">{locationLabel}</td>
                            <td className="py-4 px-4 font-black dark:text-white">{po.totalAmount.toLocaleString()} ETB</td>
                            <td className="py-4 px-4 text-center">
                              <span className="text-xs font-bold text-slate-500">
                                {rcvQty} / {totalQty} items
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusBadgeColor(po.status)}`}>
                                {po.status.replace('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {purchaseOrders.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-slate-400 dark:text-slate-600 italic">No enterprise purchase documents logged yet. Click "Raise Purchase Request" to begin.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

            </motion.div>
          )}

          {/* PURCHASE REQUESTS */}
          {activeSubTab === 'requests' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm">
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">Internal Purchase Requests (PR)</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Manage internal requests, draft procurements, or view past rejections.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredRequests.map(po => {
                  const dateStr = new Date(po.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <div key={po.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all gap-5">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">PR ID: #{po.id?.slice(-6).toUpperCase()}</span>
                            <h4 className="font-bold dark:text-white">Raised by {po.createdByName}</h4>
                            <p className="text-[10px] text-slate-400">{dateStr}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusBadgeColor(po.status)}`}>
                            {po.status}
                          </span>
                        </div>

                        {/* List items preview */}
                        <div className="space-y-1 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                          {po.items.map((it, i) => (
                            <div key={i} className="flex justify-between text-xs font-sans">
                              <span className="text-slate-600 dark:text-slate-400 font-medium truncate max-w-[200px]">{it.name} <span className="text-slate-400 dark:text-slate-500 font-normal">x{it.quantity}</span></span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">{(it.unitPrice * it.quantity).toLocaleString()} ETB</span>
                            </div>
                          ))}
                        </div>

                        {po.notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-blue-50/40 dark:bg-slate-800/20 p-2.5 rounded-lg border-l-2 border-blue-500">
                            " {po.notes} "
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between items-start border-t border-slate-100 dark:border-slate-800/50 pt-4 flex-wrap gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Sourcing Cost Breakdown</p>
                          <div className="grid grid-cols-2 gap-x-4 text-xs font-medium text-slate-500">
                            <span>Subtotal (Excl. VAT):</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300 text-right">{po.totalAmount.toLocaleString()} ETB</span>
                            <span>VAT (15%):</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300 text-right">{(po.totalAmount * 0.15).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB</span>
                          </div>
                          <div className="border-t border-dashed border-slate-200 dark:border-slate-700 pt-1.5 flex gap-x-4 text-sm font-black text-blue-600 dark:text-blue-400">
                            <span>Total Cost (Incl. VAT):</span>
                            <span>{(po.totalAmount * 1.15).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB</span>
                          </div>
                        </div>
                        {po.status === 'draft' && (
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                await updateDoc(doc(db, 'purchase_orders', po.id), { status: 'pending_approval' });
                                toast.success('Submitted for approval!');
                              }}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all"
                            >
                              Submit
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this draft?')) {
                                  await updateDoc(doc(db, 'purchase_orders', po.id), { status: 'rejected' });
                                }
                              }}
                              className="px-4 py-2 hover:bg-red-50 text-red-600 font-bold text-xs rounded-xl transition-all"
                            >
                              Discard
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredRequests.length === 0 && (
                  <div className="col-span-full text-center py-16 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 italic">
                    <FileText className="mx-auto text-slate-250 dark:text-slate-850 mb-3" size={48} />
                    No active or pending purchase requests logged.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* APPROVALS MODULE */}
          {activeSubTab === 'approvals' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5"><Lock className="text-amber-500" size={18} /> Central Signoff Queue</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Owner security clearance. Authorize orders or generate final PO layouts.</p>
                </div>
              </div>

              {user.role !== 'pharmacy' && user.role !== 'admin' ? (
                <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-850 text-slate-400">
                  <Lock className="mx-auto text-amber-400/40 mb-3" size={32} />
                  Access Restricted. Only corporate Owners or Managers can sign off on purchase requests.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {filteredApprovals.map(po => {
                    const raisedStr = new Date(po.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                    const targetLocationName = po.warehouseId 
                      ? warehouses.find(w => w.id === po.warehouseId)?.name || 'Central Warehouse'
                      : branches.find(b => b.id === po.branchId)?.name || 'Main Branch Shop';

                    return (
                      <div key={po.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-all">
                        
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">Awaiting approval</span>
                            <span className="text-xs text-slate-400 font-bold">Request #{po.id?.slice(-6).toUpperCase()}</span>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Raise Proposal by {po.createdByName}</h3>
                            <p className="text-xs text-slate-500">Proposed intake into: <span className="font-bold text-blue-600 dark:text-blue-400">{targetLocationName}</span> | Date: {raisedStr}</p>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-850/50 rounded-2xl p-4 space-y-2">
                            <div className="grid grid-cols-3 text-xs text-slate-400 font-bold">
                              <span>Item</span>
                              <span className="text-center">Prop. Qty</span>
                              <span className="text-right">Unit Price</span>
                            </div>
                            {po.items.map((it, i) => (
                              <div key={i} className="grid grid-cols-3 text-xs border-t border-slate-100 dark:border-slate-800 pt-2 font-sans font-medium text-slate-600 dark:text-slate-300">
                                <span>{it.name}</span>
                                <span className="text-center font-bold text-slate-900 dark:text-white">{it.quantity}</span>
                                <span className="text-right font-bold text-slate-900 dark:text-white">{(it.unitPrice).toLocaleString()} ETB</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actions block */}
                        <div className="md:w-64 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
                          <div className="space-y-1 text-right">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Purchase Cost</p>
                            <p className="text-[11px] text-slate-500 font-medium">Subtotal: {po.totalAmount.toLocaleString()} ETB</p>
                            <p className="text-[11px] text-slate-500 font-medium">VAT (15%): {(po.totalAmount * 0.15).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB</p>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white border-t border-dashed border-slate-100 dark:border-slate-800 pt-1">{(po.totalAmount * 1.15).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs font-bold text-slate-500">ETB</span></h4>
                          </div>

                          <div className="space-y-2.5 mt-4">
                            <button
                              onClick={() => handleApprovePO(po, true)}
                              className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-green-100 dark:shadow-none transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Check size={16} /> Approve Request
                            </button>
                            <button
                              onClick={() => handleApprovePO(po, false)}
                              className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <X size={16} /> Disapprove
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                  {filteredApprovals.length === 0 && (
                    <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 italic">
                      <Lock className="mx-auto text-slate-200 dark:text-slate-850 mb-3" size={48} />
                      Perfect! Signoff queue cleared. No requests currently awaiting approval.
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* PURCHASE ORDERS */}
          {activeSubTab === 'po' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">Corporate Purchase Orders (PO)</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Generate, assign suppliers, and dispatch approved purchase orders.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {filteredPOs.map(po => {
                  const dateStr = new Date(po.createdAt).toLocaleDateString();
                  const locName = po.warehouseId 
                    ? warehouses.find(w => w.id === po.warehouseId)?.name || 'Central Warehouse'
                    : branches.find(b => b.id === po.branchId)?.name || 'Main Branch Shop';

                  return (
                    <div key={po.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all space-y-4">
                      
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-50 dark:border-slate-800/60 pb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200">PO Ref: #{po.id?.slice(-6).toUpperCase()}</span>
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusBadgeColor(po.status)}`}>
                              {po.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">Approved Spend | Date: {dateStr} | Target: {locName}</p>
                        </div>

                        {/* Top Supplier Assignment button if approved but unassigned */}
                        {po.status === 'approved' && (
                          <button
                            onClick={() => {
                              setSelectedPO(po);
                              setPrSupplierId('');
                              setPrSupplierName('');
                              setShowSupplierModal(true);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black py-2.5 px-4 rounded-xl flex items-center gap-1 shadow-lg shadow-indigo-150 transition-all cursor-pointer"
                          >
                            <Send size={14} /> Send / Assign Supplier
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col lg:flex-row gap-6">
                        
                        <div className="flex-1 space-y-3">
                          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Purchase Items list</p>
                          <div className="space-y-2 bg-slate-50 dark:bg-slate-850/50 p-4 rounded-2xl">
                            {po.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-105 dark:border-slate-800/40 pb-2 last:border-0 last:pb-0 font-sans">
                                <div>
                                  <p className="font-bold text-slate-800 dark:text-slate-200">{it.name}</p>
                                  <p className="text-[10px] text-slate-400">Qty Order: {it.quantity} | Cost: {(it.unitPrice).toLocaleString()} ETB</p>
                                </div>
                                <span className="font-black text-slate-900 dark:text-white">{(it.total).toLocaleString()} ETB</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="lg:w-80 space-y-4">
                          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Matched Supplier Details</p>
                          <div className="bg-slate-50 dark:bg-slate-850/50 p-4 rounded-2xl space-y-3 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-medium">Supplier:</span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {po.supplierName || <span className="text-amber-500 font-medium italic">Unassigned Draft</span>}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-medium">Channel Type:</span>
                              <span className="font-bold capitalize text-slate-700 dark:text-slate-300">{po.supplierType || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-slate-500 font-medium border-b border-dashed border-slate-150 dark:border-slate-800 pb-1.5 mb-1.5">
                              <span>Subtotal (Excl. VAT):</span>
                              <span>{po.totalAmount.toLocaleString()} ETB</span>
                            </div>
                            <div className="flex justify-between text-slate-500 font-medium">
                              <span>VAT (15%):</span>
                              <span>{(po.totalAmount * 0.15).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1.5 font-bold">
                              <span className="text-slate-400 font-medium">PO Total Cost (Incl. VAT):</span>
                              <span className="font-black text-blue-600 dark:text-blue-400 text-sm">{(po.totalAmount * 1.15).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB</span>
                            </div>
                          </div>
                        </div>

                      </div>

                    </div>
                  );
                })}
                {filteredPOs.length === 0 && (
                  <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 italic">
                    <ShoppingBag className="mx-auto text-slate-200 dark:text-slate-850 mb-3" size={48} />
                    No generated or active purchase orders available.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* GOODS RECEIVING */}
          {activeSubTab === 'receiving' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm">
                <h2 className="font-bold text-slate-900 dark:text-white">Goods Receiving / Intake Node</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Match shipped goods, add batch codes, and auto-increment pharmaceutical inventory.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredReceiving.map(po => {
                  const itemsCount = po.items.length;
                  const receivedTotal = po.items.reduce((s, i) => s + (i.quantityReceived || 0), 0);
                  const orderedTotal = po.items.reduce((s, i) => s + i.quantity, 0);

                  return (
                    <div key={po.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all gap-5">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-slate-400 dark:text-slate-500">PO Ref: #{po.id?.slice(-6).toUpperCase()}</span>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusBadgeColor(po.status)}`}>
                            {po.status}
                          </span>
                        </div>
                        
                        <div>
                          <h4 className="font-bold dark:text-white">From: {po.supplierName}</h4>
                          <p className="text-xs text-slate-500 font-sans">Intake progress: <span className="font-bold text-indigo-600 dark:text-indigo-400">{receivedTotal} / {orderedTotal} items received</span></p>
                        </div>

                        {/* Percent gauge bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                          <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${Math.min(100, (receivedTotal / orderedTotal) * 100)}%` }} />
                        </div>
                      </div>

                      <div className="flex justify-between items-center border-t border-slate-50 dark:border-slate-800/40 pt-4">
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">{itemsCount} Unique lines</span>
                        <button
                          onClick={() => handleOpenReceive(po)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer"
                        >
                          Record Intake Receipt
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filteredReceiving.length === 0 && (
                  <div className="col-span-full text-center py-16 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 italic">
                    <CheckCircle2 className="mx-auto text-slate-200 dark:text-slate-850 mb-3" size={48} />
                    All outstanding goods received! Nothing currently awaiting intake.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* INVOICE MATCHING */}
          {activeSubTab === 'invoices' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm">
                <h2 className="font-bold text-slate-900 dark:text-white">Invoice Matching Matrix</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Match incoming supplier bills with PO totals to ensure financial accuracy.</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {filteredInvoices.map(po => {
                  const isVerifiedMatch = po.invoiceMatched === 'matched';
                  const isPendingMatch = !po.invoiceMatched || po.invoiceMatched === 'pending';

                  return (
                    <div key={po.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition-all">
                      
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">PO: #{po.id?.slice(-6).toUpperCase()}</span>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusBadgeColor(po.status)}`}>
                            {po.status}
                          </span>
                          
                          {po.invoiceMatched && (
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              isVerifiedMatch ? 'bg-green-150 text-green-700' : 'bg-red-150 text-red-700'
                            }`}>
                              Ref: {po.invoiceNumber} | {po.invoiceMatched}
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold dark:text-white text-slate-900">Supplier Account: {po.supplierName}</h4>
                        <p className="text-xs text-slate-500 font-sans space-y-1">
                          <div>Expected PO Subtotal: <span className="font-bold text-slate-700 dark:text-slate-350">{po.totalAmount.toLocaleString()} ETB</span></div>
                          <div>Expected PO VAT (15%): <span className="font-bold text-slate-700 dark:text-slate-350">{(po.totalAmount * 0.15).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB</span></div>
                          <div>Expected PO Total (Incl. VAT): <span className="font-black text-blue-600 dark:text-blue-450">{(po.totalAmount * 1.15).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB</span></div>
                          {po.invoiceAmount !== undefined && (
                            <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-1 mt-1">Invoiced Amount: <span className="font-black">{(po.invoiceAmount).toLocaleString()} ETB (Incl. VAT)</span></div>
                          )}
                        </p>
                      </div>

                      <div>
                        {isPendingMatch ? (
                          <button
                            onClick={() => handleOpenInvoice(po)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileSpreadsheet size={16} /> Enter & Verify Invoice
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            {isVerifiedMatch ? (
                              <div className="flex items-center gap-1 text-xs font-bold text-green-600">
                                <CheckCircle2 size={16} /> Verified financial match
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-xs font-bold text-red-500">
                                <AlertTriangle size={16} /> Discrepancy Flagged
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
                {filteredInvoices.length === 0 && (
                  <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 italic">
                    <FileSpreadsheet className="mx-auto text-slate-200 dark:text-slate-850 mb-3" size={48} />
                    No intake receipts recorded yet to enable billing invoice match.
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      )}

      {/* RAISING PROPOSAL MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black dark:text-white">New B2B Corporate Purchase Request</h3>
                <p className="text-xs text-slate-400 font-sans">Durable cloud record creation with supplier auto-lookup.</p>
              </div>
              <button 
                onClick={() => setShowRequestModal(false)}
                className="w-10 h-10 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content body split */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2">
              
              {/* Left Column: Product Selector with marketplace integration */}
              <div className="p-6 border-r border-slate-100 dark:border-slate-800/80 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Search Store/Marketplace Items</label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Type medicine name (e.g. Paracetamol, Amoxicillin)..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/40 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  {searchTerm.trim() === '' && (
                    <p className="text-[10px] text-slate-400 italic mt-1 font-sans">Type letters to search catalog and live marketplace products.</p>
                  )}
                </div>

                {/* Instant matched list */}
                <div className="space-y-2.5 max-h-[280px] overflow-y-auto border border-slate-50 dark:border-slate-800 p-2 rounded-xl">
                  {matchedSearchProducts.map((p, i) => (
                    <div key={i} className="flex justify-between items-center p-2.5 hover:bg-slate-50 dark:hover:bg-slate-850/40 rounded-xl transition-all">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{p.name}</p>
                        <p className="text-[9px] text-blue-500 font-bold uppercase tracking-wider">{p.source} | Cost: {(p.costPrice || p.price || 0).toLocaleString()} ETB</p>
                      </div>
                      <button
                        onClick={() => addProductToPR(p, p.source === 'B2B Marketplace')}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-0.5"
                      >
                        <Plus size={10} /> Add
                      </button>
                    </div>
                  ))}
                  {searchTerm.trim() !== '' && matchedSearchProducts.length === 0 && (
                    <div className="text-center py-6 text-xs italic text-slate-400">
                      No matching items found. Proceeding with custom temporary entry?
                      <button
                        onClick={() => {
                          const customProd = { id: 'cust_' + Date.now(), name: searchTerm, price: 100, costPrice: 80 };
                          addProductToPR(customProd);
                        }}
                        className="block bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-blue-600 text-[10px] px-3 py-1.5 rounded-lg mx-auto mt-2 font-bold transition-all"
                      >
                        Add custom item: "{searchTerm}"
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Active request items summary, note, and destinations */}
              <div className="p-6 space-y-6 flex flex-col justify-between">
                
                <div className="space-y-4">
                  
                  {/* Select Destination allocation */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase">Target Branch Intake</label>
                      <select
                        value={prBranchId}
                        onChange={(e) => {
                          setPrBranchId(e.target.value);
                          setPrWarehouseId('');
                        }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:text-white"
                      >
                        <option value="">-- Main Shop Branch --</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase">Target Warehouse Intake</label>
                      <select
                        value={prWarehouseId}
                        onChange={(e) => {
                          setPrWarehouseId(e.target.value);
                          setPrBranchId('');
                        }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:text-white"
                      >
                        <option value="">-- Select Warehouse --</option>
                        {warehouses.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Added items list with input values */}
                  <div className="space-y-2 border-t border-slate-50 dark:border-slate-800/60 pt-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase">PR Line items ({prItems.length})</p>
                    <div className="space-y-2.5 max-h-[160px] overflow-y-auto">
                      {prItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl text-xs gap-3 font-sans">
                          <div className="flex-1 truncate">
                            <p className="font-bold text-slate-850 dark:text-slate-150 truncate">{item.name}</p>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            <input 
                              type="number" 
                              value={item.quantity} 
                              onChange={(e) => handleUpdateItemQty(idx, Number(e.target.value))}
                              className="w-12 text-center py-1 rounded border border-slate-200 bg-white dark:bg-slate-800 text-xs dark:text-white"
                            />
                            <input 
                              type="number" 
                              value={item.unitPrice} 
                              onChange={(e) => handleUpdateItemPrice(idx, Number(e.target.value))}
                              className="w-16 text-center py-1 rounded border border-slate-200 bg-white dark:bg-slate-800 text-xs dark:text-white"
                            />
                            <span className="font-bold shrink-0">ETB</span>
                            <button onClick={() => handleRemovePRItem(idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded text-xs">
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {prItems.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-6">Your request items ledger is empty. Search products on the left and click Add.</p>
                      )}
                    </div>
                  </div>

                  {/* Proposal brief note */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase">Proposal Justification note</label>
                    <textarea
                      placeholder="e.g. Critical stock shortage leading into winter season..."
                      rows={2}
                      value={prNote}
                      onChange={(e) => setPrNote(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white bg-slate-50 focus:bg-white dark:bg-slate-80s dark:bg-slate-800/50 dark:text-white outline-none"
                    />
                  </div>

                </div>

                {/* Footer totals & actions */}
                <div className="border-t border-slate-50 dark:border-slate-800 pt-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-450 uppercase">Estimated Total Cash</span>
                    <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                      {prItems.reduce((accum, item) => accum + item.total, 0).toLocaleString()} ETB
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCreateRequest(false)}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-lg transition-all"
                    >
                      Proposal Signoff
                    </button>
                    <button
                      onClick={() => handleCreateRequest(true)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all"
                    >
                      Draft
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* SUPPLIER MATCHING MODAL */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl space-y-6">
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight">Ecosystem Supplier Match</h3>
              <p className="text-xs text-slate-400">Choose between verified B2B Wholesale Pharmacies or local offline suppliers.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Channel Type</label>
                <div className="flex gap-2.5 mt-1">
                  <button
                    onClick={() => {
                      setPrSupplierType('importer');
                      setPrSupplierId('');
                      setPrSupplierName('');
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      prSupplierType === 'importer' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-850 text-slate-500'
                    }`}
                  >
                    Wholesale Pharmacy
                  </button>
                  <button
                    onClick={() => {
                      setPrSupplierType('local');
                      setPrSupplierId('');
                      setPrSupplierName('');
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      prSupplierType === 'local' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-850 text-slate-500'
                    }`}
                  >
                    Local Supplier
                  </button>
                </div>
              </div>

              {prSupplierType === 'importer' ? (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Verified Wholesale Partners</label>
                  <select
                    onChange={(e) => {
                      const selectedImp = suppliers.find(s => s.uid === e.target.value);
                      if (selectedImp) {
                        setPrSupplierId(selectedImp.uid);
                        setPrSupplierName(selectedImp.importerName || selectedImp.displayName || 'Wholesale Pharmacy');
                      }
                    }}
                    value={prSupplierId}
                    className="w-full mt-1.5 px-3 py-2 text-xs rounded-xl border border-slate-205 bg-white dark:bg-slate-880 dark:text-white"
                  >
                    <option value="">-- Choose Wholesale Pharmacy --</option>
                    {suppliers.map(s => (
                      <option key={s.uid} value={s.uid}>{s.importerName || s.displayName}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Local Vendor Name</label>
                  <input
                    type="text"
                    value={prSupplierName}
                    onChange={(e) => {
                      setPrSupplierName(e.target.value);
                      setPrSupplierId('local_supplier_' + Date.now());
                    }}
                    placeholder="Enter local vendor/farm name..."
                    className="w-full mt-1.5 px-3 py-2 text-xs rounded-xl border border-slate-205 bg-white dark:bg-slate-880 dark:text-white"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 border-t border-slate-50 dark:border-slate-800 pt-4">
              <button
                onClick={() => {
                  if (selectedPO) handleAssignSupplier(selectedPO);
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg transition-all"
              >
                Dispatch Purchase Order
              </button>
              <button
                onClick={() => setShowSupplierModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-650 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTAKE / GOODS RECEIVING MODAL */}
      {showReceiveModal && selectedPO && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 dark:border-slate-800/90 gap-5">
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight">Log Intake Shipment</h3>
              <p className="text-xs text-slate-400 font-sans">Enter arriving quantities, batch numbers, and expiries to match PO.</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {selectedPO.items.map((item, index) => {
                const remaining = item.quantity - (item.quantityReceived || 0);

                return (
                  <div key={index} className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 font-sans">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-xs text-slate-900 dark:text-white">{item.name}</h4>
                        <p className="text-[10px] text-slate-500">Ordered: {item.quantity} | Already Received: {item.quantityReceived || 0}</p>
                      </div>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">Rcv Pending: {remaining}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Receiving Now</label>
                        <input
                          type="number"
                          value={receiveQuantities[item.productId] ?? 0}
                          onChange={(e) => setReceiveQuantities({ ...receiveQuantities, [item.productId]: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-205 bg-white dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Batch Code</label>
                        <input
                          type="text"
                          placeholder="e.g. B-741"
                          value={receiveBatches[item.productId] || ''}
                          onChange={(e) => setReceiveBatches({ ...receiveBatches, [item.productId]: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-205 bg-white dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Expiry Date</label>
                        <input
                          type="date"
                          value={receiveExpiries[item.productId] || ''}
                          onChange={(e) => setReceiveExpiries({ ...receiveExpiries, [item.productId]: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-205 bg-white dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 border-t border-slate-50 dark:border-slate-800 pt-4">
              <button
                onClick={handleRecordReceiving}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg transition-all"
              >
                Commit Received Inventory
              </button>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-650 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BILL/INVOICE MATCHING MODAL */}
      {showInvoiceModal && selectedPO && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl space-y-6">
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight">Invoice Matching Screen</h3>
              <p className="text-xs text-slate-455">Enter supplier bill information to match with PO: <span className="font-bold text-indigo-600 font-sans">#{selectedPO.id?.slice(-5).toUpperCase()}</span></p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Arriving invoice / Bill Number</label>
                <input
                  type="text"
                  placeholder="e.g. INV-9685"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Gross bill amount (Including Tax/Surcharges)</label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(Number(e.target.value))}
                    className="w-full pl-3 pr-12 py-2 text-xs rounded-xl border border-slate-205 bg-white dark:bg-slate-800 dark:text-white font-black text-slate-900"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ETB</span>
                </div>
                <div className="flex justify-between items-center mt-1.5 p-2 bg-slate-50 dark:bg-slate-850 rounded-lg text-[10px] text-slate-450 font-sans">
                  <span>Target value match:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPO.totalAmount.toLocaleString()} ETB</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Discrepancy / Reconciliation Notes</label>
                <textarea
                  placeholder="e.g. Tax values matched with PO perfectly..."
                  rows={2}
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-205 bg-white dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-50 dark:border-slate-800 pt-4">
              <button
                onClick={handleMatchInvoice}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg transition-all"
              >
                Log Verification Match
              </button>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-650 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
