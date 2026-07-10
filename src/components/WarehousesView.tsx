import React, { useState, useEffect } from 'react';
import { 
  Warehouse as WarehouseIcon, 
  Package, 
  Plus, 
  Search, 
  Building2, 
  TrendingUp, 
  ArrowRightLeft, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Trash2, 
  Edit, 
  ClipboardList, 
  MapPin, 
  AlertTriangle, 
  FileText, 
  Download, 
  Truck, 
  Store,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Branch, Warehouse, WarehouseTransaction, InventoryProduct } from '../types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface WarehousesViewProps {
  user: UserProfile;
  branches: Branch[];
}

export default function WarehousesView({ user, branches = [] }: WarehousesViewProps) {
  const [activeTab, setActiveTab] = useState<'warehouses' | 'inventory' | 'receiving' | 'dispatch' | 'transfer' | 'logs' | 'reports'>('warehouses');
  
  // Real-time states
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseProducts, setWarehouseProducts] = useState<InventoryProduct[]>([]);
  const [transactions, setTransactions] = useState<WarehouseTransaction[]>([]);
  const [staffList, setStaffList] = useState<UserProfile[]>([]);

  // Selection state
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  
  // Create / Edit Warehouse form
  const [isOpenWHModal, setIsOpenWHModal] = useState(false);
  const [editingWH, setEditingWH] = useState<Warehouse | null>(null);
  const [whForm, setWhForm] = useState({ name: '', location: '', phone: '', managerId: '' });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Workflows states
  const [receivingForm, setReceivingForm] = useState({
    name: '',
    category: 'Medicine',
    quantity: 0,
    costPrice: 0,
    price: 0,
    batchNumber: '',
    expiryDate: '',
    supplier: '',
    lowStockThreshold: 10,
    notes: ''
  });

  const [dispatchForm, setDispatchForm] = useState({
    productId: '',
    targetBranchId: '',
    quantity: 0,
    notes: ''
  });

  const [transferForm, setTransferForm] = useState({
    productId: '',
    targetWarehouseId: '',
    quantity: 0,
    notes: ''
  });

  const ownerId = user.role === 'staff' ? (user.pharmacyId || user.uid) : user.uid;
  const isManager = user.role === 'staff' && user.staffRole === 'warehouse_manager';

  // Limit warehouses for manager
  useEffect(() => {
    if (isManager && user.branchId && warehouses.length > 0) {
      // For warehouse_manager, branchId is used to store their assigned warehouse ID
      setSelectedWarehouseId(user.branchId);
    }
  }, [isManager, user.branchId, warehouses]);

  // Load staff to assign as manager
  useEffect(() => {
    if (!ownerId) return;
    const staffQuery = query(collection(db, 'users'), where('pharmacyId', '==', ownerId));
    const unsub = onSnapshot(staffQuery, (snap) => {
      const list = snap.docs.map(doc => doc.data() as UserProfile);
      setStaffList(list.filter(s => s.staffRole === 'warehouse_manager'));
    });
    return unsub;
  }, [ownerId]);

  // Real-time sync warehouses
  useEffect(() => {
    if (!ownerId) return;

    const whQuery = query(collection(db, 'warehouses'), where('pharmacyId', '==', ownerId));
    const unsubWH = onSnapshot(whQuery, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Warehouse));
      setWarehouses(list);
      
      // Auto-initialize selectedWarehouseId if first load and not manager
      if (list.length > 0 && selectedWarehouseId === 'all' && !isManager) {
        setSelectedWarehouseId('all');
      }
    });

    return unsubWH;
  }, [ownerId, isManager]);

  // Real-time sync warehouse products (Medicines containing warehouseId)
  useEffect(() => {
    if (!ownerId) return;

    const prodQuery = query(collection(db, 'medicines'), where('pharmacyId', '==', ownerId));
    const unsubProd = onSnapshot(prodQuery, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryProduct));
      // Filter out products with warehouseId
      const whProds = list.filter(p => !!p.warehouseId);
      setWarehouseProducts(whProds);
    });

    return unsubProd;
  }, [ownerId]);

  // Real-time sync warehouse transactions
  useEffect(() => {
    if (!ownerId) return;

    const transQuery = query(collection(db, 'warehouse_transactions'), where('pharmacyId', '==', ownerId));
    const unsubTrans = onSnapshot(transQuery, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WarehouseTransaction));
      list.sort((a, b) => b.createdAt - a.createdAt);
      setTransactions(list);
    });

    return unsubTrans;
  }, [ownerId]);

  // Handle Create / Edit Warehouse
  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whForm.name.trim() || !whForm.location.trim()) {
      toast.error('Warehouse name and location are required');
      return;
    }

    const tId = toast.loading('Saving warehouse...');
    try {
      const whId = editingWH ? editingWH.id : `wh_${Date.now()}`;
      
      // Look up manager's displayName
      const managerUser = staffList.find(s => s.uid === whForm.managerId);
      const managerName = managerUser ? managerUser.displayName : '';

      const whData: Warehouse = {
        id: whId,
        pharmacyId: ownerId,
        name: whForm.name,
        location: whForm.location,
        phone: whForm.phone,
        createdAt: editingWH ? editingWH.createdAt : Date.now()
      };

      if (whForm.managerId) whData.managerId = whForm.managerId;
      if (managerName) whData.managerName = managerName;

      await setDoc(doc(db, 'warehouses', whId), whData);

      // If manager is selected, bind their branchId to this warehouse ID so that they are routed
      if (whForm.managerId) {
        await updateDoc(doc(db, 'users', whForm.managerId), {
          branchId: whId
        });
      }

      toast.success(editingWH ? 'Warehouse updated!' : 'Warehouse created!', { id: tId });
      setIsOpenWHModal(false);
      setEditingWH(null);
      setWhForm({ name: '', location: '', phone: '', managerId: '' });
    } catch (err: any) {
      console.error(err);
      toast.error('Error saving warehouse: ' + err.message, { id: tId });
    }
  };

  const handleEditClick = (wh: Warehouse) => {
    setEditingWH(wh);
    setWhForm({
      name: wh.name,
      location: wh.location,
      phone: wh.phone || '',
      managerId: wh.managerId || ''
    });
    setIsOpenWHModal(true);
  };

  const handleDeleteWH = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this warehouse? Clean up of associated stocks is advised.')) return;
    try {
      await deleteDoc(doc(db, 'warehouses', id));
      toast.success('Warehouse removed successfully');
      if (selectedWarehouseId === id) setSelectedWarehouseId('all');
    } catch (err: any) {
      toast.error('Error deleting warehouse: ' + err.message);
    }
  };

  // Stock Receiving logic
  const handleStockReceiving = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWarehouseId === 'all') {
      toast.error('Please select a specific active warehouse to receive stock into');
      return;
    }
    if (!receivingForm.name.trim() || receivingForm.quantity <= 0 || receivingForm.costPrice <= 0 || receivingForm.price <= 0) {
      toast.error('Please fill in complete product details and positive values');
      return;
    }

    const tId = toast.loading('Recording stock receiving...');
    try {
      const activeWH = warehouses.find(w => w.id === selectedWarehouseId)!;
      
      // Match existing inventory in this warehouse
      const existingProd = warehouseProducts.find(p => 
        p.warehouseId === selectedWarehouseId && 
        p.name.toLowerCase().trim() === receivingForm.name.toLowerCase().trim() && 
        p.batchNumber === receivingForm.batchNumber
      );

      const batch = writeBatch(db);
      let prodId = existingProd?.id;

      if (existingProd) {
        // Increment quantity
        const newQty = existingProd.quantity + Number(receivingForm.quantity);
        batch.update(doc(db, 'medicines', existingProd.id), {
          quantity: newQty,
          costPrice: Number(receivingForm.costPrice),
          price: Number(receivingForm.price),
          expiryDate: receivingForm.expiryDate || existingProd.expiryDate,
          supplier: receivingForm.supplier || existingProd.supplier
        });
      } else {
        // Create new item
        prodId = `prod_${Date.now()}_wh_${Math.random().toString(36).substring(2, 7)}`;
        const newProduct: InventoryProduct = {
          id: prodId,
          name: receivingForm.name.trim(),
          category: receivingForm.category,
          price: Number(receivingForm.price),
          costPrice: Number(receivingForm.costPrice),
          quantity: Number(receivingForm.quantity),
          batchNumber: receivingForm.batchNumber,
          expiryDate: receivingForm.expiryDate,
          supplier: receivingForm.supplier,
          pharmacyId: ownerId,
          lowStockThreshold: Number(receivingForm.lowStockThreshold),
          createdAt: Date.now(),
          branchId: undefined // Stored at warehouse
        };
        // Add warehouse specific properties
        (newProduct as any).warehouseId = selectedWarehouseId;

        batch.set(doc(db, 'medicines', prodId), newProduct);
      }

      // Add audit transaction log
      const transId = `trans_wh_${Date.now()}`;
      const transaction: WarehouseTransaction = {
        id: transId,
        pharmacyId: ownerId,
        type: 'receiving',
        productId: prodId!,
        productName: receivingForm.name.trim(),
        batchNumber: receivingForm.batchNumber,
        expiryDate: receivingForm.expiryDate,
        quantity: Number(receivingForm.quantity),
        sourceId: receivingForm.supplier || 'Supplier',
        sourceName: receivingForm.supplier || 'External Supplier',
        destinationId: selectedWarehouseId,
        destinationName: activeWH.name,
        costPrice: Number(receivingForm.costPrice),
        sellingPrice: Number(receivingForm.price),
        notes: receivingForm.notes,
        createdBy: user.displayName || user.email,
        createdAt: Date.now()
      };

      batch.set(doc(db, 'warehouse_transactions', transId), transaction);
      await batch.commit();

      toast.success('Stock received safely and added to warehouse inventory!', { id: tId });
      setReceivingForm({
        name: '',
        category: 'Medicine',
        quantity: 0,
        costPrice: 0,
        price: 0,
        batchNumber: '',
        expiryDate: '',
        supplier: '',
        lowStockThreshold: 10,
        notes: ''
      });
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to register stock: ' + err.message, { id: tId });
    }
  };

  // Stock Dispatch to Branch logic
  const handleStockDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const { productId, targetBranchId, quantity, notes } = dispatchForm;
    if (!productId || !targetBranchId || quantity <= 0) {
      toast.error('Please complete all dispatch variables');
      return;
    }

    const sourceProduct = warehouseProducts.find(p => p.id === productId);
    if (!sourceProduct) {
      toast.error('Source product not found');
      return;
    }

    if (sourceProduct.quantity < quantity) {
      toast.error(`Insufficient stock! Only ${sourceProduct.quantity} units available in warehouse.`);
      return;
    }

    const tId = toast.loading('Dispatching stock to branch...');
    try {
      const activeWH = warehouses.find(w => w.id === sourceProduct.warehouseId)!;
      const targetBranchName = targetBranchId === `main_branch_${ownerId}` ? 'Main Branch (HQ)' : branches.find(b => b.id === targetBranchId)?.name || 'Pharmacy Branch';
      
      const batch = writeBatch(db);

      // 1. Decrease Warehouse Quantity
      const remainingWhQty = sourceProduct.quantity - Number(quantity);
      batch.update(doc(db, 'medicines', sourceProduct.id), {
        quantity: remainingWhQty
      });

      // 2. Fetch or Add Product to Target Pharmacy Branch
      // Query if destination branch already has this product (by name and batchNumber)
      const matches = await getDocs(query(
        collection(db, 'medicines'),
        where('pharmacyId', '==', ownerId),
        where('name', '==', sourceProduct.name),
        where('batchNumber', '==', sourceProduct.batchNumber || '')
      ));

      // Find one matching the target branchId
      const branchProductDoc = matches.docs.find(d => {
        const dData = d.data();
        const pBranchId = dData.branchId || `main_branch_${ownerId}`;
        return pBranchId === targetBranchId;
      });

      let destinationId = '';
      if (branchProductDoc) {
        destinationId = branchProductDoc.id;
        const currentBranchQty = branchProductDoc.data().quantity || 0;
        batch.update(doc(db, 'medicines', destinationId), {
          quantity: currentBranchQty + Number(quantity),
          // sync prices and details if transfer modifies them
          costPrice: sourceProduct.costPrice,
          price: sourceProduct.price,
          expiryDate: sourceProduct.expiryDate
        });
      } else {
        // Create duplicate product for the target branch
        destinationId = `prod_dispatch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const newBranchProduct: InventoryProduct = {
          id: destinationId,
          name: sourceProduct.name,
          category: sourceProduct.category,
          price: sourceProduct.price,
          costPrice: sourceProduct.costPrice,
          quantity: Number(quantity),
          batchNumber: sourceProduct.batchNumber || '',
          expiryDate: sourceProduct.expiryDate,
          supplier: sourceProduct.supplier,
          pharmacyId: ownerId,
          branchId: targetBranchId,
          lowStockThreshold: sourceProduct.lowStockThreshold || 10,
          createdAt: Date.now()
        };
        batch.set(doc(db, 'medicines', destinationId), newBranchProduct);
      }

      // 3. Save warehouse dispatch log
      const transId = `trans_wh_${Date.now()}`;
      const transaction: WarehouseTransaction = {
        id: transId,
        pharmacyId: ownerId,
        type: 'dispatch_to_branch',
        productId: sourceProduct.id,
        productName: sourceProduct.name,
        batchNumber: sourceProduct.batchNumber,
        expiryDate: sourceProduct.expiryDate,
        quantity: Number(quantity),
        sourceId: sourceProduct.warehouseId!,
        sourceName: activeWH.name,
        destinationId: targetBranchId,
        destinationName: targetBranchName,
        costPrice: sourceProduct.costPrice,
        sellingPrice: sourceProduct.price,
        notes: notes || 'Dispatch to pharmacy inventory',
        createdBy: user.displayName || user.email,
        createdAt: Date.now()
      };

      batch.set(doc(db, 'warehouse_transactions', transId), transaction);
      await batch.commit();

      toast.success(`Successfully dispatched ${quantity} units out to ${targetBranchName}!`, { id: tId });
      setDispatchForm({ productId: '', targetBranchId: '', quantity: 0, notes: '' });
    } catch (err: any) {
      console.error(err);
      toast.error('Dispatch failed: ' + err.message, { id: tId });
    }
  };

  // Internal Warehouse to Warehouse Transfer logic
  const handleInternalTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const { productId, targetWarehouseId, quantity, notes } = transferForm;
    if (!productId || !targetWarehouseId || quantity <= 0) {
      toast.error('Please fill in complete internal transfer fields');
      return;
    }

    const sourceProduct = warehouseProducts.find(p => p.id === productId);
    if (!sourceProduct) {
      toast.error('Product not found');
      return;
    }

    if (sourceProduct.quantity < quantity) {
      toast.error(`Insufficient stock! Only ${sourceProduct.quantity} units available.`);
      return;
    }

    if (sourceProduct.warehouseId === targetWarehouseId) {
      toast.error('Source and target warehouses cannot be identical');
      return;
    }

    const tId = toast.loading('Transferring internal warehouse stock...');
    try {
      const sourceWH = warehouses.find(w => w.id === sourceProduct.warehouseId)!;
      const targetWH = warehouses.find(w => w.id === targetWarehouseId)!;

      const batch = writeBatch(db);

      // Match destination item
      const destProduct = warehouseProducts.find(p => 
        p.warehouseId === targetWarehouseId && 
        p.name === sourceProduct.name && 
        p.batchNumber === sourceProduct.batchNumber
      );

      // Decrement source
      batch.update(doc(db, 'medicines', sourceProduct.id), {
        quantity: sourceProduct.quantity - Number(quantity)
      });

      // Increment/Create target
      let destId = '';
      if (destProduct) {
        destId = destProduct.id;
        batch.update(doc(db, 'medicines', destId), {
          quantity: destProduct.quantity + Number(quantity)
        });
      } else {
        destId = `prod_trans_wh_${Date.now()}`;
        const newProduct: InventoryProduct = {
          ...sourceProduct,
          id: destId,
          quantity: Number(quantity),
          createdAt: Date.now(),
          branchId: undefined
        };
        (newProduct as any).warehouseId = targetWarehouseId;
        batch.set(doc(db, 'medicines', destId), newProduct);
      }

      // Add double logging for internal transfers
      const transId = `trans_wh_${Date.now()}`;
      const transaction: WarehouseTransaction = {
        id: transId,
        pharmacyId: ownerId,
        type: 'internal_transfer_in',
        productId: sourceProduct.id,
        productName: sourceProduct.name,
        batchNumber: sourceProduct.batchNumber,
        expiryDate: sourceProduct.expiryDate,
        quantity: Number(quantity),
        sourceId: sourceWH.id,
        sourceName: sourceWH.name,
        destinationId: targetWH.id,
        destinationName: targetWH.name,
        costPrice: sourceProduct.costPrice,
        sellingPrice: sourceProduct.price,
        notes: notes || 'Warehouse redistribution',
        createdBy: user.displayName || user.email,
        createdAt: Date.now()
      };

      batch.set(doc(db, 'warehouse_transactions', transId), transaction);
      await batch.commit();

      toast.success(`Successfully relocated ${quantity} units to ${targetWH.name}!`, { id: tId });
      setTransferForm({ productId: '', targetWarehouseId: '', quantity: 0, notes: '' });
    } catch (err: any) {
      console.error(err);
      toast.error('Internal relocation failed: ' + err.message, { id: tId });
    }
  };

  // Filter operations
  const activeWHList = selectedWarehouseId === 'all' 
    ? warehouses 
    : warehouses.filter(w => w.id === selectedWarehouseId);

  const filteredWHProducts = warehouseProducts.filter(p => {
    // Warehouse Filter
    if (selectedWarehouseId !== 'all' && p.warehouseId !== selectedWarehouseId) return false;
    
    // Category Filter
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;

    // Search Term Filter
    if (searchTerm.trim() !== '') {
      const matchText = `${p.name} ${p.batchNumber} ${p.supplier}`.toLowerCase();
      return matchText.includes(searchTerm.toLowerCase());
    }

    return true;
  });

  const filteredLogs = transactions.filter(t => {
    if (selectedWarehouseId !== 'all' && t.sourceId !== selectedWarehouseId && t.destinationId !== selectedWarehouseId) {
      return false;
    }
    return true;
  });

  // Calculate stats/valuation
  const valuationByWarehouse = activeWHList.map(wh => {
    const whProds = warehouseProducts.filter(p => p.warehouseId === wh.id);
    const totalCost = whProds.reduce((sum, p) => sum + (p.quantity * (p.costPrice || 0)), 0);
    const totalSale = whProds.reduce((sum, p) => sum + (p.quantity * (p.price || 0)), 0);
    const totalItems = whProds.reduce((sum, p) => sum + p.quantity, 0);
    const uniqueSkus = whProds.length;
    return {
      name: wh.name,
      totalCost,
      totalSale,
      margin: totalSale - totalCost,
      totalItems,
      uniqueSkus
    };
  });

  const totalWarehouseStockItems = filteredWHProducts.reduce((sum, p) => sum + p.quantity, 0);
  const totalCostValuation = filteredWHProducts.reduce((sum, p) => sum + (p.quantity * (p.costPrice || 0)), 0);
  const totalSellingValuation = filteredWHProducts.reduce((sum, p) => sum + (p.quantity * (p.price || 0)), 0);
  const totalProfitPotential = totalSellingValuation - totalCostValuation;

  // Pie chart categories distribution
  const categoriesMap = filteredWHProducts.reduce((acc: {[key: string]: number}, p) => {
    acc[p.category] = (acc[p.category] || 0) + (p.quantity * (p.costPrice || 0));
    return acc;
  }, {});
  const categoryChartData = Object.entries(categoriesMap).map(([key, val]) => ({ name: key, value: val }));
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

  // PDF Export
  const handleExportPDF = () => {
    const doc = new jsPDF() as any;
    const whName = selectedWarehouseId === 'all' ? 'All Warehouses' : warehouses.find(w => w.id === selectedWarehouseId)?.name || 'WH';
    
    // Title Section
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text('Warehouse Inventory & Valuation Report', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Warehouse: ${whName}`, 14, 29);
    doc.text(`Generated Date: ${new Date().toLocaleString()}`, 14, 34);

    // Summary Cards block
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('Financial Summary:', 14, 45);
    
    doc.setFontSize(10);
    doc.text(`Total SKU Stock Types: ${filteredWHProducts.length}`, 14, 52);
    doc.text(`Total Physical Item Units: ${totalWarehouseStockItems.toLocaleString()}`, 14, 57);
    doc.text(`Total Inventory Cost Value: ${totalCostValuation.toLocaleString()} ETB`, 14, 62);
    doc.text(`Total Inventory Market Selling Value: ${totalSellingValuation.toLocaleString()} ETB`, 14, 67);
    doc.text(`Unrealized Profit Potential: ${totalProfitPotential.toLocaleString()} ETB`, 14, 72);

    // Grid details
    const tableColumn = ["Product Name", "Category", "Batch", "Expiry Date", "Unit Cost (ETB)", "Unit Price (ETB)", "Stock Qty", "Cost Value (ETB)"];
    const tableRows = filteredWHProducts.map(p => [
      p.name,
      p.category,
      p.batchNumber || 'N/A',
      p.expiryDate || 'N/A',
      p.costPrice.toFixed(2),
      p.price.toFixed(2),
      p.quantity.toLocaleString(),
      (p.quantity * p.costPrice).toFixed(2)
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 78,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
      margin: { top: 78 }
    });

    doc.save(`Warehouse-Valuation-Report-${Date.now()}.pdf`);
    toast.success('Professional PDF valuation report downloaded!');
  };

  return (
    <div className="space-y-6">
      {/* Upper Module header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center">
            <WarehouseIcon size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Warehouse Management System</h1>
            <p className="text-xs text-slate-400">Handle central storage, receiving/dispatch operations, and internal branch redistribution</p>
          </div>
        </div>

        {/* Global Warehouse Selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-300">Active Location:</span>
          <select 
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            disabled={isManager}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500 cursor-pointer disabled:bg-slate-950/80 disabled:cursor-not-allowed"
          >
            {!isManager && <option value="all">All Warehouses (Global Summary)</option>}
            {warehouses.map(wh => (
              <option key={wh.id} value={wh.id}>{wh.name} {isManager && wh.id === user.branchId ? '(My Warehouse)' : ''}</option>
            ))}
          </select>

          {!isManager && (
            <button 
              onClick={() => {
                setEditingWH(null);
                setWhForm({ name: '', location: '', phone: '', managerId: '' });
                setIsOpenWHModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Plus size={16} /> New WH
            </button>
          )}
        </div>
      </div>

      {/* Grid Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('warehouses')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'warehouses' 
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Building2 size={16} /> Warehouses ({warehouses.length})
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'inventory' 
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Package size={16} /> Inventory ({filteredWHProducts.length})
        </button>
        <button
          onClick={() => setActiveTab('receiving')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'receiving' 
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <ArrowDownLeft size={16} className="text-green-500" /> Stock Receiving
        </button>
        <button
          onClick={() => setActiveTab('dispatch')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'dispatch' 
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <ArrowUpRight size={16} className="text-blue-500" /> Stock Dispatch
        </button>
        <button
          onClick={() => setActiveTab('transfer')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'transfer' 
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <ArrowRightLeft size={16} className="text-amber-500" /> Internal WH Transfer
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'logs' 
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <ClipboardList size={16} /> Transaction Logs ({filteredLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'reports' 
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <TrendingUp size={16} /> Reports & Valuation
        </button>
      </div>

      {/* Tab Render Switchers */}
      <AnimatePresence mode="wait">
        {/* TAB 1: SUB-WAREHOUSES DETAIL OVERVIEW & CARDS */}
        {activeTab === 'warehouses' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeWHList.map(wh => {
                const metrics = valuationByWarehouse.find(m => m.name === wh.name) || { totalCost: 0, totalSale:0, totalItems:0, uniqueSkus:0 };
                return (
                  <div key={wh.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-xs flex flex-col justify-between hover:border-blue-400 transition-all">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl text-slate-700 dark:text-slate-300">
                          <WarehouseIcon size={24} />
                        </div>
                        
                        {!isManager && (
                          <div className="flex gap-1">
                            <button 
                              onClick={() => handleEditClick(wh)} 
                              className="p-1 px-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg text-[10px] font-bold"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteWH(wh.id)} 
                              className="p-1 px-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-[10px]"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{wh.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                        <MapPin size={12} /> {wh.location}
                      </p>
                      {wh.phone && (
                        <p className="text-xs text-slate-400 mt-0.5">📞 {wh.phone}</p>
                      )}
                      
                      <div className="mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-2">Manager Assigned</span>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-[10px] font-bold">
                            {wh.managerName ? wh.managerName.charAt(0) : '?'}
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {wh.managerName || 'Unassigned / Owner managed'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl mt-5">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Unique SKUs</span>
                        <strong className="text-sm text-slate-900 dark:text-white font-black">{metrics.uniqueSkus}</strong>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Physical Stock</span>
                        <strong className="text-sm text-slate-900 dark:text-white font-black">{metrics.totalItems.toLocaleString()} Units</strong>
                      </div>
                      <div className="col-span-2 border-t border-slate-100 dark:border-slate-800/80 pt-2 mt-1">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Valuation (at cost)</span>
                        <strong className="text-sm text-blue-600 dark:text-blue-400 font-black">{metrics.totalCost.toLocaleString()} ETB</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* TAB 2: INVENTORY STOCK VISUAL CONTROL & SEARCH TABLE */}
        {activeTab === 'inventory' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Search and limits */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search warehouse stock by name, batch, supplier..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                >
                  <option value="all">All Product Categories</option>
                  <option value="Medicine">Medicines</option>
                  <option value="Medical Device">Medical Devices</option>
                  <option value="Supplements">Supplements</option>
                  <option value="Baby Care">Baby Care</option>
                  <option value="Cosmetics">Cosmetics</option>
                </select>
              </div>
            </div>

            {/* Live stats summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
                <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Unique Stock Types</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">{filteredWHProducts.length} SKU(s)</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
                <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Total Unit Units</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">{totalWarehouseStockItems.toLocaleString()} Units</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
                <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Inventory Cost Value</span>
                <span className="text-xl font-black text-green-600 dark:text-green-400">{totalCostValuation.toLocaleString()} ETB</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
                <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Est. Profit Potential</span>
                <span className="text-xl font-black text-blue-600 dark:text-blue-400">{totalProfitPotential.toLocaleString()} ETB</span>
              </div>
            </div>

            {/* Warehouse Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Item Details</th>
                      <th className="px-6 py-4">Batch / Exp</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Unit Cost (ETB)</th>
                      <th className="px-6 py-4">Unit Selling (ETB)</th>
                      <th className="px-6 py-4">Stock Level</th>
                      <th className="px-6 py-4">Total Cost Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {filteredWHProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                          No items tracked in this warehouse inventory category
                        </td>
                      </tr>
                    ) : (
                      filteredWHProducts.map(p => {
                        const isLow = p.quantity <= (p.lowStockThreshold || 10);
                        const whName = warehouses.find(w => w.id === p.warehouseId)?.name || 'Central WH';
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</p>
                              <span className="inline-block px-2 py-0.5 mt-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold rounded-md text-slate-500">
                                {p.category}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-slate-700 dark:text-slate-300">Lot: {p.batchNumber || 'N/A'}</p>
                              <p className="text-[10px] text-slate-400">Exp: {p.expiryDate || 'N/A'}</p>
                            </td>
                            <td className="px-6 py-4 flex items-center gap-1 mt-7">
                              <WarehouseIcon size={12} className="text-blue-500" />
                              <span className="font-bold text-slate-700 dark:text-slate-300">{whName}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-800 dark:text-slate-200">
                              {(p.costPrice || 0).toLocaleString()} ETB
                            </td>
                            <td className="px-6 py-4 text-slate-800 dark:text-slate-200">
                              {(p.price || 0).toLocaleString()} ETB
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  isLow 
                                    ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-950'
                                    : 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400'
                                }`}>
                                  {p.quantity.toLocaleString()} Unit(s)
                                </span>
                                {isLow && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                              {(p.quantity * (p.costPrice || 0)).toLocaleString()} ETB
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: STOCK INBOUND RECEIVING WORKFLOW */}
        {activeTab === 'receiving' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl">
              <h2 className="text-base font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowDownLeft size={18} className="text-green-600" /> Receive Inbound Shipment / Register Stock
              </h2>
              {selectedWarehouseId === 'all' ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-950 rounded-2xl">
                  <AlertTriangle size={32} className="text-amber-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Specific Warehouse Selected</p>
                  <p className="text-xs text-slate-400 mt-1">Please select a specific active warehouse from the header dropdown before registering received shipments.</p>
                </div>
              ) : (
                <form onSubmit={handleStockReceiving} className="space-y-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label>Product Name</label>
                      <input 
                        type="text"
                        required
                        value={receivingForm.name}
                        onChange={e => setReceivingForm({...receivingForm, name: e.target.value})}
                        placeholder="e.g. Amoxicillin 500mg"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white font-medium outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label>Category</label>
                      <select 
                        value={receivingForm.category}
                        onChange={e => setReceivingForm({...receivingForm, category: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white font-medium outline-none"
                      >
                        <option value="Medicine">Medicine (Tablet/Capsule/Syrup)</option>
                        <option value="Medical Device">Medical Device</option>
                        <option value="Supplements">Supplements & Nutrition</option>
                        <option value="Baby Care">Baby Products</option>
                        <option value="Cosmetics">Cosmetics & Hygiene</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label>Batch / Lot Number</label>
                      <input 
                        type="text"
                        required
                        value={receivingForm.batchNumber}
                        onChange={e => setReceivingForm({...receivingForm, batchNumber: e.target.value.toUpperCase()})}
                        placeholder="e.g. BXT904"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white font-medium outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label>Expiry Date</label>
                      <input 
                        type="date"
                        required
                        value={receivingForm.expiryDate}
                        onChange={e => setReceivingForm({...receivingForm, expiryDate: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white font-medium outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label>Received Qty (Units)</label>
                      <input 
                        type="number"
                        required
                        min="1"
                        value={receivingForm.quantity || ''}
                        onChange={e => setReceivingForm({...receivingForm, quantity: Number(e.target.value)})}
                        placeholder="0"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white font-medium outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label>Unit Cost Price (ETB)</label>
                      <input 
                        type="number"
                        required
                        min="0.1"
                        step="any"
                        value={receivingForm.costPrice || ''}
                        onChange={e => setReceivingForm({...receivingForm, costPrice: Number(e.target.value)})}
                        placeholder="0.00"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white font-medium outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label>Default Unit Sale Price (ETB)</label>
                      <input 
                        type="number"
                        required
                        min="0.1"
                        step="any"
                        value={receivingForm.price || ''}
                        onChange={e => setReceivingForm({...receivingForm, price: Number(e.target.value)})}
                        placeholder="0.00"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white font-medium outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label>Low Stock Alert Threshold</label>
                      <input 
                        type="number"
                        required
                        min="1"
                        value={receivingForm.lowStockThreshold || ''}
                        onChange={e => setReceivingForm({...receivingForm, lowStockThreshold: Number(e.target.value)})}
                        placeholder="10"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white font-medium outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 col-span-2">
                    <label>Supplier / Importer Source</label>
                    <input 
                      type="text"
                      required
                      value={receivingForm.supplier}
                      onChange={e => setReceivingForm({...receivingForm, supplier: e.target.value})}
                      placeholder="e.g. Epiphany Importers Plc"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white font-medium outline-none"
                    />
                  </div>

                  <div className="space-y-1 col-span-2">
                    <label>Receiving Notes</label>
                    <textarea 
                      rows={3}
                      value={receivingForm.notes}
                      onChange={e => setReceivingForm({...receivingForm, notes: e.target.value})}
                      placeholder="Shipment container details, damage checks..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white font-medium outline-none font-sans"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4.5 bg-green-600 font-bold hover:bg-green-700 text-white rounded-xl shadow-lg transition-all active:scale-95 text-xs tracking-wider"
                  >
                    CONFIRM & REGISTER INBOUND SHIPMENT
                  </button>
                </form>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 h-fit space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white">Recent Received Logs</h3>
              <div className="space-y-3">
                {transactions.filter(t => t.type === 'receiving').slice(0, 4).map(log => {
                  const day = new Date(log.createdAt).toLocaleDateString();
                  return (
                    <div key={log.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{log.productName}</span>
                        <span className="text-[10px] bg-green-50 dark:bg-green-950/20 text-green-600 font-black px-2 py-0.5 rounded-lg">
                          +{log.quantity}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">Source: {log.sourceName}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Received in: {log.destinationName} on {day}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: DISPATCH FROM WH TO BRANCH SHELF */}
        {activeTab === 'dispatch' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl">
              <h2 className="text-base font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowUpRight size={18} className="text-blue-600" /> Dispatch Stock out to Pharmacy Branch location
              </h2>

              <form onSubmit={handleStockDispatch} className="space-y-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                <div className="space-y-1">
                  <label>Select WH Product in Store</label>
                  <select
                    required
                    value={dispatchForm.productId}
                    onChange={e => setDispatchForm({...dispatchForm, productId: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white font-medium outline-none"
                  >
                    <option value="">-- Choose Warehouse Item To Ship --</option>
                    {warehouseProducts.filter(p => selectedWarehouseId === 'all' || p.warehouseId === selectedWarehouseId).map(p => {
                      const whName = warehouses.find(w => w.id === p.warehouseId)?.name || 'WH';
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} (Batch: {p.batchNumber}) - {p.quantity} Available [Stored in: {whName}]
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label>Destination Pharmacy Branch</label>
                    <select
                      required
                      value={dispatchForm.targetBranchId}
                      onChange={e => setDispatchForm({...dispatchForm, targetBranchId: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white font-medium outline-none"
                    >
                      <option value="">-- Choose Target Branch --</option>
                      <option value={`main_branch_${ownerId}`}>Main Branch (HQ)</option>
                      {branches.filter(b => b.id !== `main_branch_${ownerId}`).map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label>Quantity to Dispatch (Units)</label>
                    <input 
                      type="number"
                      required
                      min="1"
                      placeholder="0"
                      value={dispatchForm.quantity || ''}
                      onChange={e => setDispatchForm({...dispatchForm, quantity: Number(e.target.value)})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white font-medium outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label>Dispatch manifest notes</label>
                  <input 
                    type="text"
                    value={dispatchForm.notes}
                    onChange={e => setDispatchForm({...dispatchForm, notes: e.target.value})}
                    placeholder="e.g. Courier rider details, store manifest validation lot..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white font-medium outline-none font-sans"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4.5 bg-blue-600 font-bold hover:bg-blue-700 text-white rounded-xl shadow-lg transition-all active:scale-95 text-xs tracking-wider"
                >
                  DISPATCH & CONFLICT RESOLVE BRANCH STOCK
                </button>
              </form>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 h-fit space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white">Recent Outstanding Dispatches</h3>
              <div className="space-y-3">
                {transactions.filter(t => t.type === 'dispatch_to_branch').slice(0, 4).map(log => {
                  const day = new Date(log.createdAt).toLocaleDateString();
                  return (
                    <div key={log.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{log.productName}</span>
                        <span className="text-[10px] bg-blue-50 dark:bg-blue-950/20 text-blue-600 font-black px-2 py-0.5 rounded-lg">
                          -{log.quantity}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">Shipped: {log.sourceName} &rarr; {log.destinationName}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Recorded by: {log.createdBy} on {day}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 5: INTERNAL TRANSFER BETWEEN WAREHOUSES */}
        {activeTab === 'transfer' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl">
              <h2 className="text-base font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowRightLeft size={18} className="text-amber-600" /> Internal Warehouse Relocation / Stock Rebalancing
              </h2>

              <form onSubmit={handleInternalTransfer} className="space-y-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                <div className="space-y-1">
                  <label>Select Item to Relocate</label>
                  <select
                    required
                    value={transferForm.productId}
                    onChange={e => setTransferForm({...transferForm, productId: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white font-medium outline-none"
                  >
                    <option value="">-- Choose Stock To Move --</option>
                    {warehouseProducts.filter(p => selectedWarehouseId === 'all' || p.warehouseId === selectedWarehouseId).map(p => {
                      const whName = warehouses.find(w => w.id === p.warehouseId)?.name || 'WH';
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} (Batch: {p.batchNumber}) - {p.quantity} Available [Origin: {whName}]
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label>Destination Warehouse</label>
                    <select
                      required
                      value={transferForm.targetWarehouseId}
                      onChange={e => setTransferForm({...transferForm, targetWarehouseId: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white font-medium outline-none"
                    >
                      <option value="">-- Choose Destination --</option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label>Transfer Quantity (Units)</label>
                    <input 
                      type="number"
                      required
                      min="1"
                      placeholder="0"
                      value={transferForm.quantity || ''}
                      onChange={e => setTransferForm({...transferForm, quantity: Number(e.target.value)})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white font-medium outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label>Internal Relocation notes</label>
                  <input 
                    type="text"
                    value={transferForm.notes}
                    onChange={e => setTransferForm({...transferForm, notes: e.target.value})}
                    placeholder="e.g. WH space rearrangement or stock re-assignment..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white font-medium outline-none font-sans"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4.5 bg-amber-600 font-bold hover:bg-amber-700 text-white rounded-xl shadow-lg transition-all active:scale-95 text-xs tracking-wider"
                >
                  PROCESS INTERNAL STOCK REALLOCATION
                </button>
              </form>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 h-fit space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white">Relocation Checklist</h3>
              <ul className="text-xs text-slate-500 list-disc list-inside space-y-2 leading-relaxed font-sans">
                <li>Verify dispatch lot has been packed securely.</li>
                <li>Confirm target warehouse manager signature on delivery receipts.</li>
                <li>Ensure batch matches between transfer documentation and product box tags.</li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* TAB 6: HISTORICAL COMPREHENSIVE TRANSACTION LOGS */}
        {activeTab === 'logs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden p-6">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Stock Ledger Chronological History</h2>
              
              <div className="space-y-4">
                {filteredLogs.length === 0 ? (
                  <p className="text-center text-slate-400 py-8 text-xs font-sans">No recorded operations in the stock ledger for selected filters</p>
                ) : (
                  filteredLogs.map(t => {
                    const isReceiving = t.type === 'receiving';
                    const isDispatch = t.type === 'dispatch_to_branch';
                    return (
                      <div key={t.id} className="border-l-4 border-slate-100 dark:border-slate-800 pl-4 py-1.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center h-fit ${
                            isReceiving ? 'bg-green-50 text-green-600' : isDispatch ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {isReceiving ? <ArrowDownLeft size={16} /> : isDispatch ? <ArrowUpRight size={16} /> : <ArrowRightLeft size={16} />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{t.productName}</p>
                            <span className="text-[10px] text-slate-400 uppercase font-black block">
                              {t.type.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs text-slate-600 dark:text-slate-400 block mt-1 leading-relaxed">
                              Route: <strong className="text-slate-800 dark:text-slate-200">{t.sourceName}</strong> &rarr; <strong className="text-slate-800 dark:text-slate-200">{t.destinationName}</strong>
                            </span>
                            {t.notes && <p className="text-[11px] text-slate-400 italic font-sans mt-0.5">"{t.notes}"</p>}
                          </div>
                        </div>

                        <div className="text-right flex flex-col md:items-end justify-center min-w-[120px]">
                          <span className={`text-base font-black text-slate-900 dark:text-white ${
                            isReceiving ? 'text-green-600' : isDispatch ? 'text-blue-600' : 'text-amber-600'
                          }`}>
                            {isReceiving ? '+' : isDispatch ? '-' : ''}{t.quantity} U
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans">{new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 7: WAREHOUSE REPORTS & INVENTORY VALUATION DASHBOARD */}
        {activeTab === 'reports' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Inventory Valuation & Analytical Charts</h2>
                <p className="text-xs text-slate-400">Export audited list summaries and view stock cost breakdown patterns</p>
              </div>

              <button 
                onClick={handleExportPDF}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 px-5 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
              >
                <Download size={14} /> EXPORT PDF VALUE AUDIT
              </button>
            </div>

            {/* Visual Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Warehouse comparison bar */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-xs">
                <span className="block font-bold text-slate-900 dark:text-white text-sm mb-4">Stock Value by Warehouse Location (ETB)</span>
                {valuationByWarehouse.length === 0 ? (
                  <p className="text-xs text-slate-400 py-12 text-center">No warehouses tracked</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={valuationByWarehouse}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="totalCost" name="Total Cost Value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="totalSale" name="Market/Retail Value" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Category pie layout */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-xs flex flex-col justify-between">
                <div>
                  <span className="block font-bold text-slate-900 dark:text-white text-sm mb-4">InStock Category Financial Breakdown (Cost Value)</span>
                  {categoryChartData.length === 0 ? (
                    <p className="text-xs text-slate-400 py-12 text-center">No categories to display</p>
                  ) : (
                    <div className="h-48 flex justify-center items-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {categoryChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${Number(value).toLocaleString()} ETB`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] uppercase font-bold text-slate-500 mt-4">
                  {categoryChartData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span>{entry.name}: {entry.value.toLocaleString()} ETB</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 1: CREATE / EDIT WAREHOUSE SUB-GATE */}
      {isOpenWHModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 text-xs font-bold text-slate-700 dark:text-slate-300">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              {editingWH ? 'Edit Warehouse Location Details' : 'Register New Warehouse'}
            </h2>

            <form onSubmit={handleSaveWarehouse} className="space-y-4">
              <div className="space-y-1">
                <label>Warehouse Name</label>
                <input 
                  type="text"
                  required
                  value={whForm.name}
                  onChange={e => setWhForm({...whForm, name: e.target.value})}
                  placeholder="e.g. Merkato Main Warehouse (A)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white font-medium outline-none"
                />
              </div>

              <div className="space-y-1">
                <label>Physical Address / Location</label>
                <input 
                  type="text"
                  required
                  value={whForm.location}
                  onChange={e => setWhForm({...whForm, location: e.target.value})}
                  placeholder="e.g. Addis Ababa, Lideta District"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white font-medium outline-none"
                />
              </div>

              <div className="space-y-1">
                <label>Warehouse Phone (Optional)</label>
                <input 
                  type="text"
                  value={whForm.phone}
                  onChange={e => setWhForm({...whForm, phone: e.target.value})}
                  placeholder="+251 911 ..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white font-medium outline-none"
                />
              </div>

              <div className="space-y-1">
                <label>Assign Warehouse Manager</label>
                <select
                  value={whForm.managerId}
                  onChange={e => setWhForm({...whForm, managerId: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white font-medium outline-none"
                >
                  <option value="">-- No Assignment / Owner Managed --</option>
                  {staffList.map(s => (
                    <option key={s.uid} value={s.uid}>{s.displayName} (Warehouse Manager)</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 font-sans font-medium mt-1 leading-tight">
                  Note: Register staff under the standard 'Staff Accounts' tab as 'Warehouse Manager' to list them here.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsOpenWHModal(false)}
                  className="px-4 py-2.5 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 px-5 rounded-xl shadow-md"
                >
                  Confirm & Save
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
