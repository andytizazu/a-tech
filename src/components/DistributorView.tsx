import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Package, 
  ShoppingCart, 
  Truck, 
  Store, 
  TrendingUp, 
  Users, 
  FileText, 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  Download, 
  RefreshCw, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Send, 
  ChevronRight, 
  BarChart2, 
  ShieldAlert,
  Sliders,
  Calendar,
  Layers,
  Sparkles,
  Award,
  Tag
} from 'lucide-react';
import { 
  collection, 
  doc, 
  getDoc,
  addDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Warehouse, WarehouseTransaction, InventoryProduct, Order, OrderStatus } from '../types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import jsPDF from 'jspdf';
import { WholesaleAdsPortal } from './WholesaleAdsPortal';
import 'jspdf-autotable';

interface DistributorViewProps {
  user: UserProfile;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export default function DistributorView({ user, activeTab = 'dashboard', setActiveTab }: DistributorViewProps) {
  const activeSegment: 'dashboard' | 'inventory' | 'orders' | 'deliveries' | 'warehouses' | 'analytics' | 'directory' | 'reports' | 'promotions' = (
    activeTab === 'dashboard' ? 'dashboard' :
    activeTab === 'my-products' ? 'inventory' :
    activeTab === 'orders' ? 'orders' :
    activeTab === 'warehouses' ? 'warehouses' :
    activeTab === 'customers' ? 'directory' :
    activeTab === 'deliveries' ? 'deliveries' :
    activeTab === 'advertising' ? 'promotions' :
    activeTab === 'reports' ? 'reports' :
    activeTab === 'analytics' ? 'analytics' :
    'dashboard'
  );

  // Firestore collections states
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventory, setInventory] = useState<InventoryProduct[]>([]);
  const [incomingOrders, setIncomingOrders] = useState<Order[]>([]);
  const [outgoingOrders, setOutgoingOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<WarehouseTransaction[]>([]);
  const [partners, setPartners] = useState<UserProfile[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [selectedPharmacyCustomer, setSelectedPharmacyCustomer] = useState<UserProfile | null>(null);

  // Dispatch variables
  const [dispatchDriverName, setDispatchDriverName] = useState('');
  const [dispatchTrackerCode, setDispatchTrackerCode] = useState('');

  // Local selection & loader states
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState('all');
  const [showAddWHModal, setShowAddWHModal] = useState(false);
  const [showAddProdModal, setShowAddProdModal] = useState(false);
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [showRaisePOModal, setShowRaisePOModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Forms states
  const [whForm, setWhForm] = useState({ name: '', location: '', phone: '', managerName: '', code: '', region: 'Addis Ababa', status: 'active' as 'active' | 'inactive' | 'full' });
  const [prodForm, setProdForm] = useState({
    name: '',
    genericName: '',
    category: 'Antibiotics',
    price: 0,
    costPrice: 0,
    quantity: 0,
    batchNumber: '',
    expiryDate: '',
    supplier: '',
    warehouseId: '',
    lowStockThreshold: 15,
    purchaseUnit: 'Box',
    dispensingUnit: 'Tablet',
    conversionFactor: 100
  });
  const [txForm, setTxForm] = useState({
    type: 'receiving' as 'receiving' | 'dispatch',
    productId: '',
    warehouseId: '',
    quantity: 0,
    notes: ''
  });
  const [deliveryRates, setDeliveryRates] = useState({
    isFreeDelivery: false,
    freeDeliveryThreshold: 200,
    baseFee: 25,
    feePerKm: 1.5
  });
  const [driverAssignments, setDriverAssignments] = useState<Record<string, { driverName: string; trackerCode: string }>>({});

  // Supplier Purchase Order form (Replenish from importer)
  const [poForm, setPoForm] = useState({
    importerId: '',
    productName: '',
    quantity: 1,
    price: 1,
    notes: ''
  });

  const distributorUid = user.uid;

  // 1. Sync Warehouses
  useEffect(() => {
    const qW = query(collection(db, 'warehouses'), where('pharmacyId', '==', distributorUid));
    return onSnapshot(qW, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Warehouse));
      setWarehouses(list);
    }, (err) => console.error(err));
  }, [distributorUid]);

  // 2. Sync Inventory
  useEffect(() => {
    const qI = query(collection(db, 'medicines'), where('pharmacyId', '==', distributorUid));
    return onSnapshot(qI, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryProduct));
      setInventory(list);
      setLoading(false);
    }, (err) => console.error(err));
  }, [distributorUid]);

  // 3. Sync Incoming Orders (from Pharmacies referencing this distributor as Importer or Distributor)
  useEffect(() => {
    const qIn = query(collection(db, 'orders'), where('importerId', '==', distributorUid));
    return onSnapshot(qIn, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      list.sort((a, b) => b.createdAt - a.createdAt);
      setIncomingOrders(list);
    }, (err) => console.error(err));
  }, [distributorUid]);

  // 4. Sync Outgoing Orders (Replenishments sent from Distributor to Importers)
  useEffect(() => {
    const qOut = query(collection(db, 'orders'), where('pharmacyId', '==', distributorUid));
    return onSnapshot(qOut, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      list.sort((a, b) => b.createdAt - a.createdAt);
      setOutgoingOrders(list);
    }, (err) => console.error(err));
  }, [distributorUid]);

  // 5. Sync Warehouse Transactions
  useEffect(() => {
    const qT = query(collection(db, 'warehouse_transactions'), where('pharmacyId', '==', distributorUid));
    return onSnapshot(qT, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WarehouseTransaction));
      list.sort((a, b) => b.createdAt - a.createdAt);
      setTransactions(list);
    }, (err) => console.error(err));
  }, [distributorUid]);

  // Sync Distributor profile details (to dynamic track block lists and mappings)
  useEffect(() => {
    return onSnapshot(doc(db, 'users', distributorUid), (snap) => {
      if (snap.exists()) {
        setProfileData(snap.data() as UserProfile);
      }
    }, (err) => console.error(err));
  }, [distributorUid]);

  const [settings, setSettings] = useState<any>(null);

  // Sync System Settings for commission logic
  useEffect(() => {
    return onSnapshot(doc(db, 'system_settings', 'main'), (snap) => {
      if (snap.exists()) {
        setSettings(snap.data());
      }
    }, (err) => console.error(err));
  }, []);

  // Sync Advertisements defined by this distributor
  useEffect(() => {
    const qAds = query(collection(db, 'advertisements'), where('importerId', '==', distributorUid));
    return onSnapshot(qAds, (snap) => {
      setAds(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error(err));
  }, [distributorUid]);

  // 6. Sync Partners Directory (read approved pharmacies and importers to coordinate integration)
  useEffect(() => {
    const qP = query(
      collection(db, 'users'),
      where('role', 'in', ['pharmacy', 'importer']),
      where('verificationStatus', '==', 'approved')
    );
    return onSnapshot(qP, (snap) => {
      const list = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      // Filter out non-pharmacy & non-importers or unapproved ones
      const approvedPartners = list.filter(p => 
        p.uid !== distributorUid &&
        p.country === user.country
      );
      setPartners(approvedPartners);
    }, (err) => console.error(err));
  }, [distributorUid, user.country]);

  // Auto-populate driver and tracking code when an order is opened in the Fulfillment Processing Control modal
  useEffect(() => {
    if (selectedOrderDetails) {
      setDispatchDriverName(selectedOrderDetails.driverName || '');
      if (selectedOrderDetails.trackerCode) {
        setDispatchTrackerCode(selectedOrderDetails.trackerCode);
      } else {
        const randNum = Math.floor(100000 + Math.random() * 900000);
        setDispatchTrackerCode(`TRK-${selectedOrderDetails.id.slice(-6).toUpperCase()}-${randNum}`);
      }
    } else {
      setDispatchDriverName('');
      setDispatchTrackerCode('');
    }
  }, [selectedOrderDetails]);

  // Handle Delivery Setup Save
  const handleSaveDeliveryRates = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'users', distributorUid), {
        deliverySettings: {
          isFreeDelivery: deliveryRates.isFreeDelivery,
          freeDeliveryThreshold: Number(deliveryRates.freeDeliveryThreshold),
          baseFee: Number(deliveryRates.baseFee),
          feePerKm: Number(deliveryRates.feePerKm)
        }
      });
      toast.success('Fulfillment fees updated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Could not save delivery settings');
    }
  };

  // Create Warehouse Handler
  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whForm.name || !whForm.location) {
      toast.error('Please enter name and location');
      return;
    }
    const whId = `wh_${Date.now()}`;
    const whCode = whForm.code || `WH-${Date.now().toString().slice(-4)}`;
    const whData: any = {
      id: whId,
      pharmacyId: distributorUid,
      name: whForm.name,
      location: whForm.location,
      phone: whForm.phone,
      managerName: whForm.managerName || 'Assigned Manager',
      code: whCode,
      region: whForm.region || 'Addis Ababa',
      status: whForm.status || 'active',
      createdAt: Date.now()
    };
    try {
      await setDoc(doc(db, 'warehouses', whId), whData);
      toast.success('Warehouse created successfully!');
      setShowAddWHModal(false);
      setWhForm({ name: '', location: '', phone: '', managerName: '', code: '', region: 'Addis Ababa', status: 'active' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to create warehouse');
    }
  };

  // Add Product to Inventory
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name || !prodForm.batchNumber || !prodForm.expiryDate) {
      toast.error('Required fields must be populated');
      return;
    }
    const prodId = `prod_${Date.now()}`;
    const prodData: InventoryProduct = {
      id: prodId,
      pharmacyId: distributorUid,
      name: prodForm.name,
      genericName: prodForm.genericName || '',
      category: prodForm.category,
      price: Number(prodForm.price),
      costPrice: Number(prodForm.costPrice),
      quantity: Number(prodForm.quantity),
      batchNumber: prodForm.batchNumber,
      expiryDate: prodForm.expiryDate,
      supplier: prodForm.supplier || 'Import Wholesalers',
      warehouseId: warehouses.length === 0 ? 'main' : (prodForm.warehouseId || null),
      lowStockThreshold: Number(prodForm.lowStockThreshold),
      purchaseUnit: prodForm.purchaseUnit || 'Box',
      dispensingUnit: prodForm.dispensingUnit || 'Tablet',
      conversionFactor: Number(prodForm.conversionFactor || 100),
      createdAt: Date.now()
    };
    try {
      // 1. Create medicine document (distributor internal)
      await setDoc(doc(db, 'medicines', prodId), prodData);

      // 2. Sync to marketplace B2B catalog (/products) so pharmacy can see/order!
      const marketplaceProduct = {
        name: prodForm.name,
        genericName: prodForm.genericName || '',
        category: prodForm.category,
        description: `${prodForm.name} (Generic: ${prodForm.genericName || 'N/A'}). Pack: ${prodForm.purchaseUnit || 'Box'} / Dispensing: ${prodForm.dispensingUnit || 'Tablet'}. Conversion factor: ${prodForm.conversionFactor || 100}. Stock batch: ${prodForm.batchNumber}.`,
        price: Number(prodForm.price),
        minOrderQuantity: 1,
        stockQuantity: Number(prodForm.quantity),
        importerId: distributorUid,
        importerName: user.distributorName || user.importerName || user.displayName,
        country: user.country || 'Ethiopia',
        createdAt: Date.now()
      };
      await setDoc(doc(db, 'products', prodId), marketplaceProduct);
      
      // Also log beautiful transaction automatically in the warehouse logic!
      if (prodForm.quantity > 0) {
        const txId = `tx_${Date.now()}`;
        const targetWH = warehouses.find(w => w.id === prodForm.warehouseId);
        const txData: WarehouseTransaction = {
          id: txId,
          pharmacyId: distributorUid,
          type: 'receiving',
          productId: prodId,
          productName: prodForm.name,
          quantity: Number(prodForm.quantity),
          batchNumber: prodForm.batchNumber,
          expiryDate: prodForm.expiryDate,
          sourceId: prodForm.supplier || 'Importer',
          sourceName: prodForm.supplier || 'Importer Hub',
          destinationId: warehouses.length === 0 ? 'main' : (prodForm.warehouseId || 'primary'),
          destinationName: warehouses.length === 0 ? 'Main Warehouse' : (targetWH ? targetWH.name : 'General Warehouse'),
          notes: 'Initial stock intake on registration',
          createdBy: user.displayName,
          createdAt: Date.now()
        };
        await setDoc(doc(db, 'warehouse_transactions', txId), txData);
      }

      toast.success('Drug stock registered in warehouse & B2B marketplace!');
      setShowAddProdModal(false);
      setProdForm({
        name: '',
        genericName: '',
        category: 'Antibiotics',
        price: 0,
        costPrice: 0,
        quantity: 0,
        batchNumber: '',
        expiryDate: '',
        supplier: '',
        warehouseId: '',
        lowStockThreshold: 15,
        purchaseUnit: 'Box',
        dispensingUnit: 'Tablet',
        conversionFactor: 100
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to add product');
    }
  };

  // Log Custom Internal Transaction
  const handleLogTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.productId || txForm.quantity <= 0) {
      toast.error('Invalid product or quantity input');
      return;
    }

    const prod = inventory.find(p => p.id === txForm.productId);
    if (!prod) return;

    if (txForm.type === 'dispatch' && prod.quantity < txForm.quantity) {
      toast.error(`Out of stock! Only ${prod.quantity} boxes available in warehouse.`);
      return;
    }

    const txId = `tx_${Date.now()}`;
    const targetWH = warehouses.find(w => w.id === (txForm.warehouseId || prod.warehouseId));
    const whName = targetWH ? targetWH.name : 'Unassigned Lot';

    const txData: WarehouseTransaction = {
      id: txId,
      pharmacyId: distributorUid,
      type: txForm.type,
      productId: prod.id,
      productName: prod.name,
      quantity: Number(txForm.quantity),
      batchNumber: prod.batchNumber,
      expiryDate: prod.expiryDate,
      sourceId: txForm.type === 'receiving' ? 'External Supplier' : (prod.warehouseId || 'primary'),
      sourceName: txForm.type === 'receiving' ? 'Replenishment Lot' : whName,
      destinationId: txForm.type === 'receiving' ? (txForm.warehouseId || 'primary') : 'Dispatch Courier',
      destinationName: txForm.type === 'receiving' ? whName : 'Target Clinic/Pharmacy Dispatch',
      notes: txForm.notes || 'Manually logged distribution adjustment',
      createdBy: user.displayName,
      createdAt: Date.now()
    };

    try {
      const nextQuantity = txForm.type === 'receiving' 
        ? prod.quantity + Number(txForm.quantity)
        : prod.quantity - Number(txForm.quantity);

      await updateDoc(doc(db, 'medicines', prod.id), { quantity: nextQuantity });
      
      // Keep B2B marketplace synchronized in real-time
      try {
        await updateDoc(doc(db, 'products', prod.id), { stockQuantity: nextQuantity });
      } catch (errProductSync) {
        console.warn("Product sync skipped (non-listed item or separate catalog product id)", errProductSync);
      }

      await setDoc(doc(db, 'warehouse_transactions', txId), txData);

      toast.success('Warehouse transaction processed & stock ledger updated!');
      setShowAddTxModal(false);
      setTxForm({ type: 'receiving', productId: '', warehouseId: '', quantity: 0, notes: '' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to update warehouse transaction');
    }
  };

  // Update Pharmacy Order Status
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: OrderStatus, extraFields?: any) => {
    try {
      const orderToUpdate = incomingOrders.find(o => o.id === orderId);
      const updatePayload: any = { status: nextStatus };
      if (extraFields) {
        Object.assign(updatePayload, extraFields);
      }

      // Credit marketing commission if delivered
      if (nextStatus === 'delivered' && orderToUpdate?.marketingId && settings?.marketingCommission) {
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
                updatePayload.commissionAmount = commission;
              }
            }
          }
        }
      }

      await updateDoc(doc(db, 'orders', orderId), updatePayload);
      toast.success(`Order status converted to: ${nextStatus}`);
      if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
        setSelectedOrderDetails({ 
          ...selectedOrderDetails, 
          status: nextStatus, 
          commissionAmount: updatePayload.commissionAmount !== undefined ? updatePayload.commissionAmount : selectedOrderDetails.commissionAmount,
          ...extraFields 
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to change order status');
    }
  };

  // Block a pharmacy customer from placing orders
  const handleBlockPharmacy = async (pharmacyUid: string) => {
    const list = profileData?.blockedPharmacies || [];
    if (list.includes(pharmacyUid)) {
      toast.error('Pharmacy is already blocked.');
      return;
    }
    const newList = [...list, pharmacyUid];
    try {
      await updateDoc(doc(db, 'users', distributorUid), { blockedPharmacies: newList });
      toast.success('Pharmacy customer blocked successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Could not block pharmacy');
    }
  };

  // Reactivate a blocked pharmacy customer
  const handleReactivatePharmacy = async (pharmacyUid: string) => {
    const list = profileData?.blockedPharmacies || [];
    const newList = list.filter(id => id !== pharmacyUid);
    try {
      await updateDoc(doc(db, 'users', distributorUid), { blockedPharmacies: newList });
      toast.success('Pharmacy customer reactivated successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Could not reactivate pharmacy');
    }
  };

  // Place Purchase Requisition directly to Wholesale Pharmacy
  const handleRaisePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poForm.importerId || !poForm.productName || poForm.quantity <= 0) {
      toast.error('Required fields must be filled');
      return;
    }

    const imp = partners.find(p => p.uid === poForm.importerId);
    if (!imp) return;

    const reqId = `order_${Date.now()}`;
    const orderData: Order = {
      id: reqId,
      pharmacyId: distributorUid,
      pharmacyName: user.distributorName || user.displayName,
      importerId: imp.uid,
      importerName: imp.importerName || imp.displayName,
      items: [{
        productId: `req_prod_${Date.now()}`,
        name: poForm.productName,
        quantity: Number(poForm.quantity),
        price: Number(poForm.price),
        total: Number(poForm.quantity) * Number(poForm.price)
      }],
      totalAmount: Number(poForm.quantity) * Number(poForm.price),
      commissionAmount: 0,
      status: 'pending',
      country: user.country || 'Global',
      createdAt: Date.now(),
      deliveryMethod: 'delivery',
      deliveryAddress: user.address || 'Distributor HQ Warehouses'
    };

    try {
      await setDoc(doc(db, 'orders', reqId), orderData);
      toast.success('Replenishment Purchase Order sent successfully!');
      setShowRaisePOModal(false);
      setPoForm({ importerId: '', productName: '', quantity: 1, price: 1, notes: '' });
    } catch (err) {
      console.error(err);
      toast.error('Could not dispatch purchase order');
    }
  };

  // Set Driver and Courier Code for Shipments
  const handleAssignDriver = (orderId: string, driverName: string, trackerCode: string) => {
    if (!driverName || !trackerCode) {
      toast.error('Driver name and tracking sequence are required');
      return;
    }
    setDriverAssignments(prev => ({
      ...prev,
      [orderId]: { driverName, trackerCode }
    }));
    toast.success('Dispatch variables saved! Click "Dispatch" to ship.');
  };

  // Export PDF Report with jsPDF
  const exportPDFReport = () => {
    try {
      const docPDF = new jsPDF() as any;
      docPDF.setFont('helvetica', 'normal');
      
      // Title
      docPDF.setFontSize(20);
      docPDF.setTextColor(30, 41, 59); // Slate-800
      docPDF.text(`${user.distributorName || user.displayName} - Distribution Report`, 14, 20);
      
      // Subtitle
      docPDF.setFontSize(10);
      docPDF.setTextColor(100, 116, 139); // Slate-500
      docPDF.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} | Location: ${user.city || ''}, ${user.country || ''}`, 14, 26);
      docPDF.text(`Role: Medical Products Wholesaler / Distributor Organization`, 14, 31);
      
      // Horizontal Line
      docPDF.setLineWidth(0.5);
      docPDF.setDrawColor(226, 232, 240); // Slate-200
      docPDF.line(14, 35, 196, 35);

      // Section 1: Overview
      docPDF.setFontSize(14);
      docPDF.setTextColor(15, 23, 42); // Slate-900
      docPDF.text('Distribution Center Stats', 14, 45);

      const totalActiveOrders = incomingOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
      const totalInventoryVal = inventory.reduce((acc, cr) => acc + (cr.price * cr.quantity), 0);
      const lowStockAlertsCount = inventory.filter(p => p.quantity <= p.lowStockThreshold).length;

      docPDF.setFontSize(11);
      docPDF.setTextColor(51, 65, 85); // Slate-700
      docPDF.text(`Total Active Operations: ${totalActiveOrders} batches`, 14, 52);
      docPDF.text(`Warehoused Volume: ${inventory.reduce((acc, curr) => acc + curr.quantity, 0)} boxes`, 14, 57);
      docPDF.text(`Low-Stock Depot Alerts: ${lowStockAlertsCount} products under warning threshold`, 14, 62);
      docPDF.text(`Total Warehouse Stock Value: $${totalInventoryVal.toFixed(2)}`, 14, 67);

      // Section 2: Product Depot Ledger Table
      docPDF.setFontSize(14);
      docPDF.text('Warehouse Stock List', 14, 80);

      const tableRows = inventory.map((prod, idx) => {
        const warehouseObj = warehouses.find(w => w.id === prod.warehouseId);
        return [
          idx + 1,
          prod.name,
          prod.category,
          prod.batchNumber,
          prod.quantity,
          `$${prod.price.toFixed(2)}`,
          `$${(prod.price * prod.quantity).toFixed(2)}`,
          warehouseObj ? warehouseObj.name : 'Main Warehouse'
        ];
      });

      docPDF.autoTable({
        head: [['#', 'Drug Name', 'Category', 'Batch #', 'Stock Qty', 'Price', 'Value', 'Warehouse']],
        body: tableRows,
        startY: 85,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
        styles: { fontSize: 9 }
      });

      // Section 3: Distribution Orders Log
      const finalY = (docPDF as any).lastAutoTable.finalY + 15;
      docPDF.setFontSize(14);
      docPDF.text('Recent Orders Completed & Outstanding', 14, finalY);

      const orderRows = incomingOrders.map((o, idx) => {
        return [
          idx + 1,
          o.id.slice(-6).toUpperCase(),
          o.pharmacyName || 'Partner Pharmacy',
          o.items.map(it => `${it.name} (x${it.quantity})`).join(', '),
          `$${o.totalAmount.toFixed(2)}`,
          o.status.toUpperCase(),
          new Date(o.createdAt).toLocaleDateString()
        ];
      });

      docPDF.autoTable({
        head: [['#', 'Order ID', 'Recipient Organization', 'Items Filled', 'Total Billing', 'Fulfillment Status', 'Placement Date']],
        body: orderRows,
        startY: finalY + 5,
        theme: 'striped',
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255] },
        styles: { fontSize: 8 }
      });

      docPDF.save(`Distributor_Reporting_${Date.now()}.pdf`);
      toast.success('PDF report compiled and downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Could not generate PDF');
    }
  };

  // Export CSV Report
  const exportCSVReport = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "ID,Drug Name,Category,Batch Number,Warehouse Quantity,Unit Price,Total Cost,Expiry Date\n";
      
      inventory.forEach(p => {
        const row = `${p.id},"${p.name}","${p.category}","${p.batchNumber}",${p.quantity},${p.price},${p.price * p.quantity},${p.expiryDate}`;
        csvContent += row + "\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Depot_Stock_Ledger_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV spreadsheet exported successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Could not export CSV spreadsheet');
    }
  };

  const segmentHeaders: Record<string, { title: string; subtitle: string; icon: React.ReactNode; actions: React.ReactNode }> = {
    dashboard: {
      title: "Wholesale Portal Dashboard",
      subtitle: "Orders Today, Revenue, Inventory Value, Low Stock, Pending Deliveries, Active Promotions, Recent Activity.",
      icon: <BarChart2 size={24} />,
      actions: (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 500); }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white rounded-xl text-xs font-semibold border border-slate-100 dark:border-slate-700 transition"
          >
            <RefreshCw size={14} className="text-slate-500 dark:text-slate-300" />
            Sync Dashboard
          </button>
        </div>
      )
    },
    inventory: {
      title: "Product Settings & Inventory",
      subtitle: "All Products, Add Product, Categories, Batches, Expiry Tracking, Product Pricing.",
      icon: <Package size={24} />,
      actions: (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAddProdModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
          >
            <Plus size={14} />
            Intake Product
          </button>
        </div>
      )
    },
    orders: {
      title: "Order Management Pipeline",
      subtitle: "Track, manage, pack, and process incoming pharmacy orders through the fulfillment conveyor.",
      icon: <ShoppingCart size={24} />,
      actions: null
    },
    warehouses: {
      title: "Warehouse Depots",
      subtitle: "All Depots, Warehouse Inventory, Stock Movement, Transfers, and Low Stock Alerts.",
      icon: <Store size={24} />,
      actions: (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAddWHModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
          >
            <Plus size={14} />
            Add Warehouse
          </button>
        </div>
      )
    },
    deliveries: {
      title: "Delivery & Shipping Logistics",
      subtitle: "Pending Deliveries, Dispatch Center, Delivery Tracking, and Custom Shipping Rates.",
      icon: <Truck size={24} />,
      actions: null
    },
    directory: {
      title: "Pharmacy Customers Center",
      subtitle: "Registered Pharmacies, Approved Accounts, Performance Directory, and Transaction Logs.",
      icon: <Users size={24} />,
      actions: null
    },
    promotions: {
      title: "Wholesale Campaigns & Promotions",
      subtitle: "Run banner advertisements, sponsor products, and analyze direct conversions.",
      icon: <Tag size={24} />,
      actions: null
    },
    reports: {
      title: "Worksheets & CSV Ledger Reports",
      subtitle: "Execute CSV ledger sheets, download data outputs, and print PDF logs.",
      icon: <FileText size={24} />,
      actions: null
    },
  };

  const headerDetails = segmentHeaders[activeSegment] || segmentHeaders.dashboard;

  return (
    <div className="space-y-6">
      {/* Dynamic Header Profile Title and Contextual Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-100 dark:shadow-none">
              {headerDetails.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {headerDetails.title}
                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                  Wholesale Node
                </span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">
                {headerDetails.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Contextual Actions */}
        {headerDetails.actions}
      </div>

      {/* Main Container */}
      <div className="min-h-[500px]">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <RefreshCw className="animate-spin text-blue-600 mr-2" />
            <p className="text-slate-500 font-bold font-mono">Loading data buffers...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSegment}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* ==================================== */}
              {/* SEGMENT 1: OVERVIEW DASHBOARD */}
              {/* ==================================== */}
              {activeSegment === 'dashboard' && (
                <div className="space-y-6">
                  {/* Stats Ribbon */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Orders Today Card */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Orders Today</p>
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <ShoppingCart size={16} />
                          </div>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
                          {(() => {
                            const startOfToday = new Date().setHours(0,0,0,0);
                            return incomingOrders.filter(o => o.createdAt >= startOfToday).length;
                          })()}
                        </h3>
                      </div>
                      <div className="text-[10px] text-slate-450 mt-2 font-medium">
                        Incoming requests received today
                      </div>
                    </div>

                    {/* Revenue Card */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Revenue</p>
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <TrendingUp size={16} />
                          </div>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
                          ${incomingOrders
                            .filter(o => o.status === 'delivered' || o.status === 'completed')
                            .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
                            .toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </h3>
                      </div>
                      <div className="text-[10px] text-emerald-650 mt-2 font-bold flex items-center gap-1">
                        <CheckCircle2 size={10} /> From completed sales
                      </div>
                    </div>

                    {/* Inventory Value Card */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                      {(() => {
                        const sub = inventory.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
                        return (
                          <div>
                            <div className="flex items-center justify-between">
                              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Inventory Value</p>
                              <div className="w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                                <Layers size={16} />
                              </div>
                            </div>
                            <div className="mt-2">
                              <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                                ${sub.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </h3>
                            </div>
                          </div>
                        );
                      })()}
                      <div className="text-[10px] text-slate-400 mt-2 font-medium">
                        Total valuation (Original Price)
                      </div>
                    </div>

                    {/* Low Stock Products Card */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Low Stock Products</p>
                          <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-rose-600 flex items-center justify-center">
                            <AlertTriangle size={16} />
                          </div>
                        </div>
                        <h3 className={`text-3xl font-black mt-2 font-mono ${inventory.filter(p => p.quantity <= p.lowStockThreshold).length > 0 ? 'text-rose-601 text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                          {inventory.filter(p => p.quantity <= p.lowStockThreshold).length}
                        </h3>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-2">
                        Batches below safety metrics
                      </div>
                    </div>

                    {/* Pharmacy Customers Card */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pharmacy Customers</p>
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-750 dark:text-slate-300 flex items-center justify-center">
                            <Users size={16} />
                          </div>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2">
                          {partners.filter(p => p.role === 'pharmacy').length}
                        </h3>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-2">
                        Approved retail partners
                      </div>
                    </div>

                    {/* Pending Deliveries Card */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pending Deliveries</p>
                          <div className="w-8 h-8 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
                            <Clock size={16} />
                          </div>
                        </div>
                        <h3 className="text-3xl font-black text-yellow-600 mt-2 font-mono">
                          {incomingOrders.filter(o => ['approved', 'packed', 'dispatched', 'shipped'].includes(o.status)).length}
                        </h3>
                      </div>
                      <div className="text-[10px] text-yellow-605 mt-2 font-bold">
                        En route or packaging phase
                      </div>
                    </div>

                    {/* Active Promotions Card */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Promotions</p>
                          <div className="w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                            <Plus size={16} />
                          </div>
                        </div>
                        <h3 className="text-3xl font-black text-pink-600 mt-2 font-mono">
                          {ads.filter(a => a.status === 'Active' || a.status === 'Approved').length}
                        </h3>
                      </div>
                      <div className="text-[10px] text-pink-650 mt-2 font-bold">
                        Campaign segments active
                      </div>
                    </div>
                  </div>

                  {/* Low Stock Warnings Alerts */}
                  {inventory.filter(p => p.quantity <= p.lowStockThreshold).length > 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 p-4 rounded-2xl flex items-start gap-3">
                      <AlertTriangle className="text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" size={18} />
                      <div>
                        <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-400">Warehouse Depots Warning Alert</h4>
                        <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-1">
                          The following {inventory.filter(p => p.quantity <= p.lowStockThreshold).length} bulk products are critically falling below their minimum set threshold. Please update inventory stock levels:
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {inventory.filter(p => p.quantity <= p.lowStockThreshold).map(p => (
                            <span key={p.id} className="bg-white dark:bg-slate-900 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border border-yellow-105">
                              {p.name}: {p.quantity} boxes left (min {p.lowStockThreshold})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Incoming Pharmacy Orders Quick Table */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 lg:col-span-2 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                          <ShoppingCart size={16} className="text-blue-600" />
                          Recent Pharmacy Orders Requested
                        </h3>
                        <button onClick={() => setActiveTab ? setActiveTab('orders') : null} className="text-xs text-blue-600 hover:text-blue-500 font-bold flex items-center gap-1">
                          View All
                          <ChevronRight size={14} />
                        </button>
                      </div>

                      {incomingOrders.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          No pending orders placed yet from pharmacies. Invite them under the Partners tab.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                              <tr>
                                <th className="pb-2.5">ID</th>
                                <th className="pb-2.5">Client Pharmacy</th>
                                <th className="pb-2.5">Items</th>
                                <th className="pb-2.5">Price</th>
                                <th className="pb-2.5">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                              {incomingOrders.slice(0, 5).map(order => (
                                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                  <td className="py-2.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                                    {order.id.slice(-6).toUpperCase()}
                                  </td>
                                  <td className="py-2.5 font-semibold text-slate-900 dark:text-white">
                                    {order.pharmacyName}
                                  </td>
                                  <td className="py-2.5 text-slate-500 dark:text-slate-400 max-w-[150px] truncate">
                                    {order.items.map(it => `${it.name} (x${it.quantity})`).join(', ')}
                                  </td>
                                  <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                                    ${order.totalAmount.toFixed(2)}
                                  </td>
                                  <td className="py-2.5">
                                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                      order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' :
                                      order.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400' :
                                      order.status === 'shipped' ? 'bg-orange-100 text-orange-850 dark:bg-orange-950 dark:text-orange-400' :
                                      'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-305'
                                    }`}>
                                      {order.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                  {/* Recent Activity Log */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800/50 pb-2">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Clock size={16} className="text-blue-600 animate-pulse" />
                        Recent Activity Log
                      </h3>
                    </div>

                    {(() => {
                      const events: { id: string; type: string; title: string; desc: string; time: number; status?: string }[] = [];

                      incomingOrders.forEach(o => {
                        events.push({
                          id: `order-${o.id}`,
                          type: 'order',
                          title: `Order Received`,
                          desc: `${o.pharmacyName} - $${o.totalAmount.toFixed(2)}`,
                          time: o.createdAt || Date.now(),
                          status: o.status
                        });
                      });

                      transactions.forEach(t => {
                        events.push({
                          id: `tx-${t.id}`,
                          type: 'stock',
                          title: `Stock Movement`,
                          desc: `${t.notes || `Processed ${t.quantity} boxes.`}`,
                          time: t.createdAt || Date.now()
                        });
                      });

                      ads.forEach(a => {
                        events.push({
                          id: `ad-${a.id}`,
                          type: 'promotion',
                          title: `Ad campaign: ${a.status}`,
                          desc: `Product: ${a.productName}.`,
                          time: a.createdAt || Date.now()
                        });
                      });

                      events.sort((a, b) => b.time - a.time);

                      if (events.length === 0) {
                        return (
                          <div className="py-8 text-center text-slate-400 text-xs">
                            No recent activities logged yet.
                          </div>
                        );
                      }

                      return (
                        <div className="relative border-l border-slate-100 dark:border-slate-800 pl-4 space-y-4 max-h-[350px] overflow-y-auto">
                          {events.slice(0, 8).map(event => (
                            <div key={event.id} className="relative group">
                              <div className={`absolute -left-[22px] top-1 w-2.5 h-2.5 rounded-full border border-white dark:border-slate-900 shadow-sm transition-all group-hover:scale-125 ${
                                event.type === 'order' ? 'bg-blue-600' :
                                event.type === 'stock' ? 'bg-indigo-600' : 'bg-pink-650'
                              }`} />

                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-800 dark:text-white flex items-center gap-1.5 flex-wrap">
                                  {event.title}
                                  {event.status && (
                                    <span className={`px-1 rounded text-[7px] font-bold uppercase bg-blue-55 text-blue-800 dark:bg-blue-950/40 dark:text-blue-305`}>
                                      {event.status}
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{event.desc}</span>
                                <span className="text-[9px] text-slate-400 font-mono mt-1">
                                  {new Date(event.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  </div>
                </div>
              )}

              {/* ==================================== */}
              {/* SEGMENT 2: INVENTORY MANAGEMENT */}
              {/* ==================================== */}
              {activeSegment === 'inventory' && (
                <div className="space-y-6">
                  {/* Filters Menu */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 flex-1">
                      <Search size={16} className="text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search medicines in warehouses..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none outline-none text-slate-800 dark:text-white text-xs w-full"
                      />
                    </div>

                    <div className="flex gap-2">
                      <select 
                        value={selectedWarehouseFilter}
                        onChange={e => setSelectedWarehouseFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-semibold outline-none"
                      >
                        <option value="all">All Depots</option>
                        {warehouses.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>

                      <button 
                        onClick={() => setShowAddProdModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                      >
                        <Plus size={14} />
                        Add Product Batch
                      </button>

                      <button 
                        onClick={() => setShowAddTxModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 dark:bg-slate-800 text-white font-bold text-xs rounded-xl border border-slate-600 rounded-xl transition"
                      >
                        <Sliders size={14} />
                        Intake/Adjust
                      </button>
                    </div>
                  </div>

                  {/* Inventory Grid Table */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Depot Active Inventory & Batches</h3>
                    </div>

                    {inventory.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 font-bold text-xs">
                        Depot warehouses contain no medicine packages currently. Click 'Add Product Batch' to make an initial intake.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                            <tr>
                              <th className="p-4">Medicine & Class</th>
                              <th className="p-4">Batch #</th>
                              <th className="p-4">Housed Warehouse</th>
                              <th className="p-4 text-center">In-Stock boxes</th>
                              <th className="p-4">Cost Price ($)</th>
                              <th className="p-4">Direct Price ($ Excl / Incl 15% VAT)</th>
                              <th className="p-4 text-center">Expiry Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                            {inventory
                              .filter(p => {
                                const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.batchNumber.includes(searchTerm);
                                const matchesWH = selectedWarehouseFilter === 'all' || p.warehouseId === selectedWarehouseFilter;
                                return matchesSearch && matchesWH;
                              })
                              .map(p => {
                                const wh = warehouses.find(w => w.id === p.warehouseId);
                                const isExpired = new Date(p.expiryDate) < new Date();
                                return (
                                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                                    <td className="p-4">
                                      <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                                      <div className="text-[10px] text-slate-450 text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300 px-1.5 py-0.5 rounded w-max mt-0.5 font-semibold">
                                        {p.category}
                                      </div>
                                    </td>
                                    <td className="p-4 font-mono font-bold text-slate-600 dark:text-slate-400">
                                      {p.batchNumber}
                                    </td>
                                    <td className="p-4 text-slate-650 dark:text-slate-350">
                                      {wh ? wh.name : 'Main Warehouse'}
                                    </td>
                                    <td className="p-4 text-center">
                                      <span className={`font-mono font-bold text-sm ${p.quantity <= p.lowStockThreshold ? 'text-rose-600 dark:text-rose-450' : 'text-slate-800 dark:text-slate-200'}`}>
                                        {p.quantity.toLocaleString()}
                                      </span>
                                      {p.quantity <= p.lowStockThreshold && (
                                        <div className="text-[9px] text-rose-500 font-bold">LOW STOCK</div>
                                      )}
                                    </td>
                                    <td className="p-4 font-mono font-medium text-slate-600 dark:text-slate-400">
                                      ${p.costPrice?.toFixed(2) || '0.00'}
                                    </td>
                                    <td className="p-4 font-mono">
                                      <div className="font-bold text-slate-900 dark:text-white">${p.price.toFixed(2)}</div>
                                      <div className="text-[10px] text-slate-500 font-semibold">Incl. VAT: ${(p.price * 1.15).toFixed(2)}</div>
                                    </td>
                                    <td className="p-4 text-center">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isExpired ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                                        {p.expiryDate} {isExpired ? '(EXPIRED)' : ''}
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
                </div>
              )}

              {/* ==================================== */}
              {/* SEGMENT 3: ORDER MANAGEMENT */}
              {/* ==================================== */}
              {activeSegment === 'orders' && (
                <div className="space-y-6">
                  {/* Action switcher */}
                  <div className="grid grid-cols-1 gap-6">
                    {/* Incoming Client Pharmacy Orders */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="text-blue-600" size={18} />
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            Orders Received from Pharmacies
                          </h3>
                        </div>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 font-extrabold px-2 py-0.5 rounded-full">
                          {incomingOrders.length}
                        </span>
                      </div>

                      {incomingOrders.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                          No incoming client pharmacy orders logged yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {incomingOrders.map(order => (
                            <div 
                              key={order.id} 
                              onClick={() => { setSelectedOrderDetails(order); setShowDetailsModal(true); }}
                              className="p-3.5 rounded-2xl border border-slate-100 hover:border-blue-500/30 dark:border-slate-800 dark:hover:border-blue-800 bg-slate-50/50 dark:bg-slate-805/50 hover:bg-white dark:hover:bg-slate-800/50 cursor-pointer transition-all"
                            >
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-mono font-bold text-blue-600 dark:text-blue-300">#{order.id.slice(-6).toUpperCase()}</span>
                                <span className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">{order.pharmacyName}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">{order.items.map(it => `${it.name} (x${it.quantity})`).join(', ')}</p>
                              <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                                <span className="font-bold text-slate-900 dark:text-white">${order.totalAmount.toFixed(2)}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' :
                                  order.status === 'cancelled' ? 'bg-rose-100 text-rose-850 dark:bg-rose-950 dark:text-rose-400' :
                                  order.status === 'shipped' ? 'bg-orange-100 text-orange-850 dark:bg-orange-950' : 'bg-blue-150 text-blue-800'
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ==================================== */}
              {/* SEGMENT 4: DELIVERY MANAGEMENT */}
              {/* ==================================== */}
              {activeSegment === 'deliveries' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Truck className="text-blue-600" size={18} />
                      Active Shipping Shipments Logistics (Courier Assigns)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Coordinate drivers, designate tracking codes, and compute automated final shipment billing based on configured delivery settings per mile/KM.
                    </p>

                    {incomingOrders.filter(o => o.deliveryMethod === 'delivery').length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                        No shipping orders received from pharmacies yet. Create sample deliveries.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {incomingOrders.filter(o => o.deliveryMethod === 'delivery').map(order => {
                          const currentAssign = driverAssignments[order.id] || { 
                            driverName: '', 
                            trackerCode: order.trackerCode || `TRK-${order.id.slice(-6).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}` 
                          };
                          return (
                            <div key={order.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-805/30 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="font-mono text-xs font-bold text-blue-600">Order: #{order.id.slice(-6).toUpperCase()}</span>
                                <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400`}>
                                  {order.status}
                                </span>
                              </div>

                              <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                                <p><span className="font-bold text-slate-800 dark:text-white">Pharmacy Outlet:</span> {order.pharmacyName}</p>
                                <p><span className="font-semibold">Shipment Address:</span> {order.deliveryAddress || 'Branch Destination Address'}</p>
                                <p><span className="font-semibold">Computed Distance:</span> {order.distanceKm ? `${order.distanceKm} KM` : '32 KM (calculated)'}</p>
                                <p><span className="font-semibold">Logistics Delivery Fee:</span> ${order.deliveryFee || 35}</p>
                              </div>

                              {/* Form assignment */}
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-850 grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-450 uppercase">Assign driver</label>
                                  <input 
                                    type="text" 
                                    placeholder="e.g. John Driver" 
                                    defaultValue={currentAssign.driverName}
                                    onBlur={(e) => handleAssignDriver(order.id, e.target.value, currentAssign.trackerCode || `TRK_${Date.now().toString().slice(-4)}`)}
                                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-450 uppercase">Tracking custom code</label>
                                  <input 
                                    type="text" 
                                    placeholder="e.g. MEDIC-9512" 
                                    defaultValue={currentAssign.trackerCode}
                                    onBlur={(e) => handleAssignDriver(order.id, currentAssign.driverName || 'Courier', e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                                  />
                                </div>
                              </div>

                              {/* Shipment quick action buttons */}
                              <div className="flex justify-end gap-1.5 pt-1">
                                {order.status === 'confirmed' && (
                                  <button 
                                    onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}
                                    className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white font-bold text-[10px] rounded-lg transition"
                                  >
                                    Mark Dispatch Shipped
                                  </button>
                                )}
                                {order.status === 'shipped' && (
                                  <button 
                                    onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition"
                                  >
                                    Mark Safe Delivered
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Logistics Shipping Rate Setup */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Sliders className="text-blue-600" size={18} />
                      Logistics Shipping Rate Setup
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Configure baseline courier fees and per-kilometer distance shipping surcharges for retail pharmacy deliveries.
                    </p>

                    <form onSubmit={handleSaveDeliveryRates} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Enable Free Shipping</label>
                        <input 
                          type="checkbox" 
                          checked={deliveryRates.isFreeDelivery} 
                          onChange={e => setDeliveryRates({ ...deliveryRates, isFreeDelivery: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                      </div>

                      {deliveryRates.isFreeDelivery ? (
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-500">Free Threshold Amount ($)</label>
                          <input 
                            type="number" 
                            value={deliveryRates.freeDeliveryThreshold}
                            onChange={e => setDeliveryRates({ ...deliveryRates, freeDeliveryThreshold: Number(e.target.value) })}
                            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                          />
                        </div>
                      ) : <div />}

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">Base Dispatch Fee ($)</label>
                        <input 
                          type="number" 
                          value={deliveryRates.baseFee}
                          onChange={e => setDeliveryRates({ ...deliveryRates, baseFee: Number(e.target.value) })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">Rate per KM ($)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={deliveryRates.feePerKm}
                          onChange={e => setDeliveryRates({ ...deliveryRates, feePerKm: Number(e.target.value) })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                        />
                      </div>

                      <div className="md:col-span-2 flex justify-end">
                        <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition">
                          Save Dispatch Constants
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ==================================== */}
              {/* SEGMENT 5: WAREHOUSE INTEGRATION */}
              {/* ==================================== */}
              {activeSegment === 'warehouses' && (
                <div className="space-y-6">
                  {/* Depots list */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Store className="text-indigo-650" size={18} />
                        Active Physical Wholesaler Depots
                      </h3>
                      <button 
                        onClick={() => setShowAddWHModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-indigo-650 text-white font-bold text-xs rounded-lg shadow-sm hover:opacity-90"
                      >
                        <Plus size={14} /> Add Depot
                      </button>
                    </div>

                    {warehouses.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        No depots entered yet. Create your warehouse to initiate stock tracking registers.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {warehouses.map(w => {
                          const wProds = inventory.filter(p => p.warehouseId === w.id);
                          return (
                            <div key={w.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-805/40 space-y-3">
                              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{w.name}</h4>
                              <div className="text-xs space-y-1 text-slate-500">
                                <p className="flex items-center gap-1.5"><MapPin size={12} /> {w.location}</p>
                                <p className="flex items-center gap-1.5"><Phone size={12} /> {w.phone || 'No phone'}</p>
                                <p className="flex items-center gap-1.5"><Users size={12} /> Manager: {w.managerName || 'Depot Driver'}</p>
                              </div>
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                                <span className="font-bold text-indigo-700">{wProds.length} products stored</span>
                                <span className="text-slate-400 font-mono">Lot Capacity OK</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Transactions Ledger Log */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <FileText className="text-blue-600" size={18} />
                      Depots Transaction Stock Ledger Log
                    </h3>

                    {transactions.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        Warehouse audit log contains no receiving or dispatch entries yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-bold sticky top-0">
                            <tr>
                              <th className="p-3">Action Date</th>
                              <th className="p-3">Ledger Type</th>
                              <th className="p-3">Medicine Info</th>
                              <th className="p-3 text-center">Batch Lots</th>
                              <th className="p-3">Transfer Route</th>
                              <th className="p-3">Logged By</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150/50 dark:divide-slate-800">
                            {transactions.map(t => (
                              <tr key={t.id} className="hover:bg-slate-50/30">
                                <td className="p-3 text-slate-400 font-mono text-[10px]">
                                  {new Date(t.createdAt).toLocaleString()}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.type === 'receiving' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-orange-100 text-orange-850 dark:bg-orange-950 text-orange-400'}`}>
                                    {t.type}
                                  </span>
                                </td>
                                <td className="p-3 font-semibold text-slate-800 dark:text-white">
                                  {t.productName}
                                </td>
                                <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                                  {t.quantity.toLocaleString()} boxes (Lot {t.batchNumber || 'N/A'})
                                </td>
                                <td className="p-3 text-slate-500 max-w-[150px] truncate text-[11px]">
                                  {t.sourceName} &rarr; {t.destinationName}
                                </td>
                                <td className="p-3 text-slate-400 font-medium">
                                  {t.createdBy || 'Staff Manager'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ==================================== */}
              {/* SEGMENT 6: ANALYTICS */}
              {/* ==================================== */}
              {activeSegment === 'analytics' && (
                <div className="space-y-6">
                  {/* Recharts analysis grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Graph 1: Shipment Volume by Category */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                        Distribution Volume by Product Category
                      </h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={
                            Object.entries(
                              inventory.reduce((acc, current) => {
                                acc[current.category] = (acc[current.category] || 0) + current.quantity;
                                return acc;
                              }, {} as Record<string, number>)
                            ).map(([key, val]) => ({ name: key, boxes: val }))
                          }>
                            <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} />
                            <YAxis stroke="#888888" fontSize={10} tickLine={false} />
                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                            <Bar dataKey="boxes" fill="#2563eb" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Graph 2: Revenue Flow Monthly Estimate */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                        Operational Order Stream Trends
                      </h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={
                            incomingOrders.slice(-10).map(o => ({
                              date: new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                              billing: o.totalAmount
                            }))
                          }>
                            <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} />
                            <YAxis stroke="#888888" fontSize={10} tickLine={false} />
                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                            <Line type="monotone" dataKey="billing" stroke="#4f46e5" strokeWidth={2.5} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================================== */}
              {/* SEGMENT 7: PARTNERS DIRECTORY / PHARMACY CUSTOMER CENTER */}
              {/* ==================================== */}
              {activeSegment === 'directory' && (
                <div className="space-y-6">
                  {selectedPharmacyCustomer ? (
                    // Customer Drilldown Analyzer Profile
                    <div className="space-y-6">
                      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setSelectedPharmacyCustomer(null)}
                            className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1"
                          >
                            ← Back to Customers
                          </button>
                          <div>
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-[15px] flex items-center gap-2">
                              {selectedPharmacyCustomer.pharmacyName || selectedPharmacyCustomer.displayName}
                              {profileData?.blockedPharmacies?.includes(selectedPharmacyCustomer.uid) && (
                                <span className="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded-full font-bold">BLOCKED</span>
                              )}
                            </h3>
                            <p className="text-xs text-slate-400 font-mono">ID: {selectedPharmacyCustomer.uid}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {profileData?.blockedPharmacies?.includes(selectedPharmacyCustomer.uid) ? (
                            <button
                              onClick={() => {
                                handleReactivatePharmacy(selectedPharmacyCustomer.uid);
                              }}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                            >
                              Reactivate Pharmacy Support
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                handleBlockPharmacy(selectedPharmacyCustomer.uid);
                              }}
                              className="px-3.5 py-1.5 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition"
                            >
                              Block Pharmacy Account
                            </button>
                          )}
                          <a 
                            href={`mailto:${selectedPharmacyCustomer.email}`}
                            className="p-2 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition"
                          >
                            Email Dispatcher
                          </a>
                        </div>
                      </div>

                      {/* Bento Cards Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Sales Billing</p>
                          <h4 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                            ${incomingOrders
                              .filter(o => o.pharmacyId === selectedPharmacyCustomer.uid && o.status !== 'cancelled')
                              .reduce((sum, o) => sum + o.totalAmount, 0)
                              .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </h4>
                          <span className="text-[10px] text-slate-400 mt-2 block">Excludes cancelled batches</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Orders Placed</p>
                          <h4 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">
                            {incomingOrders.filter(o => o.pharmacyId === selectedPharmacyCustomer.uid).length} orders
                          </h4>
                          <span className="text-[10px] text-indigo-500 font-bold block mt-2">
                            {incomingOrders.filter(o => o.pharmacyId === selectedPharmacyCustomer.uid && (o.status === 'completed' || o.status === 'delivered')).length} completed
                          </span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Average Ticket</p>
                          <h4 className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                            ${(() => {
                              const list = incomingOrders.filter(o => o.pharmacyId === selectedPharmacyCustomer.uid && o.status !== 'cancelled');
                              if (list.length === 0) return '0.00';
                              const total = list.reduce((sum, o) => sum + o.totalAmount, 0);
                              return (total / list.length).toFixed(2);
                            })()}
                          </h4>
                          <span className="text-[10px] text-slate-400 mt-2 block">Weighted order average</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Operational Location</p>
                          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-2 truncate">
                            {selectedPharmacyCustomer.city || 'Addis Ababa'}
                          </h4>
                          <span className="text-[10px] text-slate-400 block mt-1">{selectedPharmacyCustomer.address || 'Central Pharmacy Hub'}</span>
                        </div>
                      </div>

                      {/* Wide Details Bento Cards Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Order History */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                            Order History Log
                          </h4>
                          {incomingOrders.filter(o => o.pharmacyId === selectedPharmacyCustomer.uid).length === 0 ? (
                            <div className="text-center py-10 text-xs text-slate-400">No orders filed from this pharmacy customer.</div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                  <tr>
                                    <th className="pb-2">Order No</th>
                                    <th className="pb-2">Date</th>
                                    <th className="pb-2">Total Amount</th>
                                    <th className="pb-2">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                                  {incomingOrders
                                    .filter(o => o.pharmacyId === selectedPharmacyCustomer.uid)
                                    .map(order => (
                                      <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-805/20 transition">
                                        <td className="py-2.5 font-mono font-bold text-blue-600">
                                          {order.orderNumber || order.id.slice(-6).toUpperCase()}
                                        </td>
                                        <td className="py-2.5 text-slate-500">
                                          {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                                          ${order.totalAmount.toFixed(2)}
                                        </td>
                                        <td className="py-2.5">
                                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                            order.status === 'completed' || order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                            'bg-blue-105 text-blue-800'
                                          }`}>
                                            {order.status}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* Drug Purchase Breakdown */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                            Accumulated Product Procurement
                          </h4>
                          {(() => {
                            const medicationMap: Record<string, { name: string, totalQty: number, totalSpend: number }> = {};
                            incomingOrders
                              .filter(o => o.pharmacyId === selectedPharmacyCustomer.uid && o.status !== 'cancelled')
                              .forEach(o => {
                                o.items.forEach(it => {
                                  if (!medicationMap[it.name]) {
                                    medicationMap[it.name] = { name: it.name, totalQty: 0, totalSpend: 0 };
                                  }
                                  medicationMap[it.name].totalQty += it.quantity;
                                  medicationMap[it.name].totalSpend += (it.price * it.quantity);
                                });
                              });
                            const medicationList = Object.values(medicationMap);

                            return medicationList.length === 0 ? (
                              <div className="text-center py-10 text-xs text-slate-400">No items processed yet.</div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead className="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                      <th className="pb-2">Drug Name</th>
                                      <th className="pb-2 text-right">Total Quantity</th>
                                      <th className="pb-2 text-right">Total Billing Sourced</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                                    {medicationList.map((med, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-805/20 transition">
                                        <td className="py-2.5 font-semibold text-slate-805 dark:text-slate-300">
                                          {med.name}
                                        </td>
                                        <td className="py-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                                          {med.totalQty} units
                                        </td>
                                        <td className="py-2.5 text-right font-bold text-slate-900 dark:text-white">
                                          ${med.totalSpend.toFixed(2)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Customer List View
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <Users className="text-blue-600" size={18} />
                            Active Pharmacy Customer Directory & Control Center
                          </h3>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">Control pharmacy access state and query custom drilldown telemetry</p>
                        </div>
                        <div className="relative w-full sm:w-64">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                            <Search size={14} />
                          </span>
                          <input 
                            type="text" 
                            placeholder="Find pharmacy client..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                          />
                        </div>
                      </div>

                      {(() => {
                        const filteredPharmacies = partners.filter(p => {
                          if (p.role !== 'pharmacy') return false;
                          const nameMatch = (p.pharmacyName || p.displayName || '').toLowerCase().includes(searchTerm.toLowerCase());
                          const mailMatch = p.email.toLowerCase().includes(searchTerm.toLowerCase());
                          return nameMatch || mailMatch;
                        });

                        return filteredPharmacies.length === 0 ? (
                          <div className="py-12 text-center text-slate-400 text-xs">
                            No registered pharmacy clients match the query parameters in {user.country}.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredPharmacies.map(p => {
                              const isBlocked = profileData?.blockedPharmacies?.includes(p.uid);
                              return (
                                <div key={p.uid} className={`p-5 rounded-2xl border bg-slate-50/50 dark:bg-slate-805/30 transition shadow-sm space-y-3 ${
                                  isBlocked ? 'border-red-155 bg-red-50/10' : 'border-slate-100 dark:border-slate-800'
                                }`}>
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-extrabold text-slate-900 dark:text-white text-xs truncate max-w-[180px]">
                                        {p.pharmacyName || p.displayName}
                                      </h4>
                                      <span className="text-[10px] text-slate-400 font-mono block truncate mt-0.5">{p.email}</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                      isBlocked ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {isBlocked ? 'Blocked' : 'Active'}
                                    </span>
                                  </div>

                                  <div className="text-[11px] text-slate-500 space-y-1">
                                    <p>
                                      📍 Location Address: <span className="font-semibold text-slate-700 dark:text-slate-300">{p.address || p.city || 'Central Hub'}</span>
                                    </p>
                                    <p>
                                      📦 Orders Processed: <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                                        {incomingOrders.filter(o => o.pharmacyId === p.uid).length}
                                      </span>
                                    </p>
                                  </div>

                                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-1">
                                    <button
                                      onClick={() => {
                                        if (isBlocked) {
                                          handleReactivatePharmacy(p.uid);
                                        } else {
                                          handleBlockPharmacy(p.uid);
                                        }
                                      }}
                                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex-1 ${
                                        isBlocked 
                                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200' 
                                          : 'bg-red-50 hover:bg-red-100 text-red-650 border border-red-200'
                                      }`}
                                    >
                                      {isBlocked ? 'Reactivate' : 'Block Client'}
                                    </button>
                                    <button 
                                      onClick={() => setSelectedPharmacyCustomer(p)}
                                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition flex-1"
                                    >
                                      Analyze Performance
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* ==================================== */}
              {/* SEGMENT 8: REPORTING & REPORT BUILDERS */}
              {/* ==================================== */}
              {activeSegment === 'reports' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <FileText className="text-indigo-650" size={18} />
                      Export Warehouse Inventories & Distribution Reporting
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Generate completely compliant, formal ledger files to coordinate with health boards, importers, pharmacists, or internal accounting audits.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <button 
                        onClick={exportPDFReport}
                        className="p-5 rounded-2xl border-2 border-indigo-50 hover:border-indigo-600 bg-indigo-50/10 dark:border-slate-800 dark:hover:border-indigo-500 text-left transition flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-indigo-700 dark:text-indigo-400 text-sm">Download Formal Audit PDF</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Includes metadata, stats grids and structured auto-tables.</p>
                        </div>
                        <Download className="text-indigo-600" size={20} />
                      </button>

                      <button 
                        onClick={exportCSVReport}
                        className="p-5 rounded-2xl border-2 border-emerald-50 hover:border-emerald-600 bg-emerald-50/10 dark:border-slate-800 dark:hover:border-emerald-550 text-left transition flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">Download Spreadsheet CSV Ledger</p>
                          <p className="text-[11px] text-slate-450 mt-0.5">Plain structure of item descriptions, categories and stock prices.</p>
                        </div>
                        <Download className="text-emerald-600" size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================================== */}
              {/* SEGMENT 9: WHOLESALE PROMOTIONS      */}
              {/* ==================================== */}
              {activeSegment === 'promotions' && (
                <WholesaleAdsPortal user={user} />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* ==================================== */}
      {/* MODALS SECTION */}
      {/* ==================================== */}
      
      {/* 1. ADD WAREHOUSE MODAL */}
      {showAddWHModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-150 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-md">Register New Distributor Warehouse</h3>
            <form onSubmit={handleCreateWarehouse} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Warehouse Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Northern Gantry, Depot B"
                  value={whForm.name}
                  onChange={e => setWhForm({ ...whForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Location Address</label>
                <input 
                  type="text" 
                  placeholder="e.g. 52 Industrial Bypass"
                  value={whForm.location}
                  onChange={e => setWhForm({ ...whForm, location: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Contact Telephone</label>
                <input 
                  type="text" 
                  placeholder="e.g. +1 555-0192"
                  value={whForm.phone}
                  onChange={e => setWhForm({ ...whForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Manager Driver</label>
                <input 
                  type="text" 
                  placeholder="e.g. Daniel Wholesales"
                  value={whForm.managerName}
                  onChange={e => setWhForm({ ...whForm, managerName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddWHModal(false)} className="px-3.5 py-1.5 rounded-lg text-slate-500 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition">
                  Create Depot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. REGISTER MEDICINE MODAL */}
      {showAddProdModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-md">Intake Direct Medicine to Warehouses</h3>
            <form onSubmit={handleAddProduct} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Medicine Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Amoxicillin 500mg"
                    value={prodForm.name}
                    onChange={e => setProdForm({ ...prodForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Product Category</label>
                  <select 
                    value={prodForm.category}
                    onChange={e => setProdForm({ ...prodForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                  >
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Analgesics">Analgesics</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Oncology">Oncology</option>
                    <option value="Gastroenterology">Gastroenterology</option>
                    <option value="Endocrinology">Endocrinology</option>
                    <option value="Pulmonology">Pulmonology</option>
                    <option value="Immunology & Vaccines">Immunology & Vaccines</option>
                    <option value="Gynecology & Women's Health">Gynecology & Women's Health</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Ophthalmology">Ophthalmology</option>
                    <option value="Urology & Nephrology">Urology & Nephrology</option>
                    <option value="Psychiatry & Mental Health">Psychiatry & Mental Health</option>
                    <option value="Rheumatology & Bone Health">Rheumatology & Bone Health</option>
                    <option value="Vitamins, Minerals & Supplements">Vitamins, Minerals & Supplements</option>
                    <option value="Medical Devices & Equipment">Medical Devices & Equipment</option>
                    <option value="Surgical Consumables & Supplies">Surgical Consumables & Supplies</option>
                    <option value="PPE & Hygiene Products">PPE & Hygiene Products</option>
                    <option value="Diagnostics & Lab Reagents">Diagnostics & Lab Reagents</option>
                    <option value="Over-the-Counter (OTC) Drugs">Over-the-Counter (OTC) Drugs</option>
                    <option value="Anesthetics">Anesthetics</option>
                    <option value="Hematology">Hematology</option>
                    <option value="Antivirals">Antivirals</option>
                    <option value="Antifungals">Antifungals</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Unit Price to Client ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="25.50"
                    value={prodForm.price || ''}
                    onChange={e => setProdForm({ ...prodForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Intelligent Cost Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="18.00"
                    value={prodForm.costPrice || ''}
                    onChange={e => setProdForm({ ...prodForm, costPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Stock Qty (Boxes)</label>
                  <input 
                    type="number" 
                    placeholder="250"
                    value={prodForm.quantity || ''}
                    onChange={e => setProdForm({ ...prodForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Depot Batch Number</label>
                  <input 
                    type="text" 
                    placeholder="BAT-915x"
                    value={prodForm.batchNumber}
                    onChange={e => setProdForm({ ...prodForm, batchNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Expiry Date</label>
                  <input 
                    type="date"
                    value={prodForm.expiryDate}
                    onChange={e => setProdForm({ ...prodForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Depot Housed Warehouse</label>
                  {warehouses.length === 0 ? (
                    <select
                      value="main"
                      disabled
                      className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-lg outline-none cursor-not-allowed font-medium font-semibold"
                    >
                      <option value="main">Main Warehouse</option>
                    </select>
                  ) : (
                    <select
                      value={prodForm.warehouseId}
                      onChange={e => setProdForm({ ...prodForm, warehouseId: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                      required
                    >
                      <option value="">-- Choose Warehouse --</option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Minimum Alert Level</label>
                  <input 
                    type="number" 
                    placeholder="15"
                    value={prodForm.lowStockThreshold}
                    onChange={e => setProdForm({ ...prodForm, lowStockThreshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                  />
                </div>
                <div className="space-y-1 font-semibold">
                  <label className="text-xs font-bold text-slate-500">Initial Wholesaler / Importer</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Health Wholesalers"
                    value={prodForm.supplier}
                    onChange={e => setProdForm({ ...prodForm, supplier: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddProdModal(false)} className="px-3.5 py-1.5 rounded-lg text-slate-500 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition">
                  Save Intake Box
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. LOG LEDGER TRANSACTION MODAL */}
      {showAddTxModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Depot Distribution Adjustment</h3>
            <form onSubmit={handleLogTransaction} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Intake/Dispatch Type</label>
                <select 
                  value={txForm.type}
                  onChange={e => setTxForm({ ...txForm, type: e.target.value as any })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                >
                  <option value="receiving">Depot Receiving Intake</option>
                  <option value="dispatch">Dispatch Release</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Select Medicine Item</label>
                <select 
                  value={txForm.productId}
                  onChange={e => setTxForm({ ...txForm, productId: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                  required
                >
                  <option value="">-- Choose Medicine Batch --</option>
                  {inventory.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Batch {p.batchNumber} - {p.quantity} left)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Box Quantity (lots)</label>
                  <input 
                    type="number" 
                    placeholder="50"
                    value={txForm.quantity || ''}
                    onChange={e => setTxForm({ ...txForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Select Depot Terminal</label>
                  <select 
                    value={txForm.warehouseId}
                    onChange={e => setTxForm({ ...txForm, warehouseId: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                  >
                    <option value="">Primary Active</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Transaction Notes</label>
                <textarea 
                  rows={2}
                  placeholder="e.g. Incoming logistics, damaged replacement lot"
                  value={txForm.notes}
                  onChange={e => setTxForm({ ...txForm, notes: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddTxModal(false)} className="px-3.5 py-1.5 rounded-lg text-slate-500 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition">
                  Confirm Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. WHOLESALE REPLENISH PO MODAL */}
      {showRaisePOModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Stock Replenishment Order</h3>
            <form onSubmit={handleRaisePO} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Select Partner Wholesaler</label>
                <select 
                  value={poForm.importerId}
                  onChange={e => setPoForm({ ...poForm, importerId: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                  required
                >
                  <option value="">-- Choose Wholesaler --</option>
                  {partners.filter(p => p.role === 'importer').map(p => (
                    <option key={p.uid} value={p.uid}>{p.importerName || p.displayName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Requested Drug Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Paracetamol 500mg Batch Pack"
                  value={poForm.productName}
                  onChange={e => setPoForm({ ...poForm, productName: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Requested Box Qty</label>
                  <input 
                    type="number" 
                    value={poForm.quantity}
                    onChange={e => setPoForm({ ...poForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Bulk Target Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={poForm.price}
                    onChange={e => setPoForm({ ...poForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Purchase Order Notes</label>
                <textarea 
                  rows={2}
                  placeholder="Provide shipping instructions and timeline limits."
                  value={poForm.notes}
                  onChange={e => setPoForm({ ...poForm, notes: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowRaisePOModal(false)} className="px-3.5 py-1.5 rounded-lg text-slate-500 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs rounded-lg transition">
                  Dispatch Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. ORDER DETAILS & PROGRESS TRANSITIONS MODAL */}
      {showDetailsModal && selectedOrderDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                SERIAL: {selectedOrderDetails.orderNumber || `ORD-#${selectedOrderDetails.id.slice(-6).toUpperCase()}`}
              </span>
              <button onClick={() => setShowDetailsModal(false)} className="text-slate-400 hover:text-slate-500 font-bold">Close</button>
            </div>
            
            <h3 className="font-bold text-slate-900 dark:text-white text-md">Fulfillment Processing Control</h3>
            
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <p><span className="font-bold text-slate-800 dark:text-white">Pharmacy Buyer:</span> {selectedOrderDetails.pharmacyName}</p>
              <p><span className="font-semibold">Items List:</span></p>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-1 text-[11px] font-mono">
                {selectedOrderDetails.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between select-none">
                    <span>{i.name} x{i.quantity}</span>
                    <span className="font-bold">${i.total.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-2 flex justify-between font-bold text-slate-800 dark:text-white text-xs">
                  <span>Grand Total</span>
                  <span>${selectedOrderDetails.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <p><span className="font-semibold">Method:</span> <span className="uppercase">{selectedOrderDetails.deliveryMethod}</span></p>
              {selectedOrderDetails.deliveryMethod === 'delivery' && (
                <>
                  <p><span className="font-semibold">Fulfillment Address:</span> {selectedOrderDetails.deliveryAddress}</p>
                  <p><span className="font-semibold">Fulfillment Distance:</span> {selectedOrderDetails.distanceKm ? `${selectedOrderDetails.distanceKm} KM` : '32 KM'}</p>
                  <p><span className="font-semibold">Fulfillment Charge:</span> ${selectedOrderDetails.deliveryFee || 35}</p>
                </>
              )}

              {/* Read-Only Dispatch Metadata */}
              {(selectedOrderDetails.driverName || selectedOrderDetails.trackerCode) && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-105 space-y-1 mt-2">
                  <p className="font-bold text-blue-800 dark:text-blue-400 uppercase text-[9px] tracking-wider">Logistics Dispatch Parameters</p>
                  <p><span className="font-semibold text-slate-755 dark:text-slate-350">Driver Allocator:</span> {selectedOrderDetails.driverName || 'N/A'}</p>
                  <p><span className="font-semibold text-slate-755 dark:text-slate-350">Tracking sequence:</span> {selectedOrderDetails.trackerCode || 'N/A'}</p>
                </div>
              )}
            </div>

            {/* Interactive Progress Transitions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="text-[11px] font-bold text-slate-450 uppercase tracking-widest">Interactive Shipment Control State</h4>
              
              {/* Packed Input prompt variables */}
              {(selectedOrderDetails.status === 'packed' || selectedOrderDetails.status === 'confirmed') && (
                <div className="space-y-2.5 p-3 rounded-2xl bg-amber-50/50 dark:bg-slate-800 border border-amber-200/50">
                  <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase">Input Courier Parameters to Dispatch</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      placeholder="Driver Name"
                      value={dispatchDriverName}
                      onChange={e => setDispatchDriverName(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-905 dark:text-white rounded-lg outline-none"
                    />
                    <input 
                      type="text" 
                      placeholder="Tracking Code"
                      value={dispatchTrackerCode}
                      onChange={e => setDispatchTrackerCode(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-905 dark:text-white rounded-lg outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                {/* 1. Pending -> Approved */}
                {selectedOrderDetails.status === 'pending' && (
                  <button 
                    onClick={() => handleUpdateOrderStatus(selectedOrderDetails.id, 'approved')}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition"
                  >
                    Approve Order Requisition
                  </button>
                )}

                {/* 2. Approved -> Packed */}
                {selectedOrderDetails.status === 'approved' && (
                  <button 
                    onClick={() => handleUpdateOrderStatus(selectedOrderDetails.id, 'packed')}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition"
                  >
                    Mark Depot Stock as Packed
                  </button>
                )}

                {/* 3. Packed -> Dispatched */}
                {(selectedOrderDetails.status === 'packed' || selectedOrderDetails.status === 'confirmed') && (
                  <button 
                    onClick={() => {
                      if (!dispatchDriverName || !dispatchTrackerCode) {
                        toast.error("Please fill in Driver Name and Tracking Code to dispatch.");
                        return;
                      }
                      handleUpdateOrderStatus(selectedOrderDetails.id, 'dispatched', {
                        driverName: dispatchDriverName,
                        trackerCode: dispatchTrackerCode
                      });
                      setDispatchDriverName('');
                      setDispatchTrackerCode('');
                    }}
                    className="w-full py-2 bg-orange-650 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
                  >
                    <Truck size={14} /> Dispatch Courier & Ship Order
                  </button>
                )}

                {/* 4. Dispatched -> Delivered */}
                {(selectedOrderDetails.status === 'dispatched' || selectedOrderDetails.status === 'shipped') && (
                  <button 
                    onClick={() => handleUpdateOrderStatus(selectedOrderDetails.id, 'delivered')}
                    className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition"
                  >
                    Confirm Arrived / Delivered to Pharmacy
                  </button>
                )}

                {/* 5. Delivered -> Completed */}
                {selectedOrderDetails.status === 'delivered' && (
                  <button 
                    onClick={() => handleUpdateOrderStatus(selectedOrderDetails.id, 'completed')}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition"
                  >
                    Archive Order as Completed
                  </button>
                )}

                {/* Cancel controls */}
                {selectedOrderDetails.status !== 'completed' && selectedOrderDetails.status !== 'cancelled' && selectedOrderDetails.status !== 'delivered' && (
                  <button 
                    onClick={() => handleUpdateOrderStatus(selectedOrderDetails.id, 'cancelled')}
                    className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450 font-bold text-xs rounded-xl transition border border-rose-200/50 mt-1"
                  >
                    Cancel Requisition Order
                  </button>
                )}

                {/* Completed or Cancelled Terminal status */}
                {(selectedOrderDetails.status === 'completed' || selectedOrderDetails.status === 'cancelled') && (
                  <div className="w-full text-center text-xs font-semibold py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-500">
                    This order transaction is in terminal status: <span className="uppercase font-bold text-slate-700 dark:text-white">{selectedOrderDetails.status}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
