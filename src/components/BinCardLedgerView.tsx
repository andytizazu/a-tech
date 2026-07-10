import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  setDoc, 
  increment,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { InventoryProduct, Branch, UserProfile, BinCardEntry } from '../types';
import { 
  FileText, 
  Search, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp, 
  RefreshCw, 
  Download, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const BinCardLedgerView = ({ 
  user,
  branches = []
}: { 
  user: UserProfile;
  branches?: Branch[];
}) => {
  const [movements, setMovements] = useState<BinCardEntry[]>([]);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  
  // Date filtering states (default to empty string for unfiltered, or set ranges)
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Manual logging form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<'Return' | 'Adjustment' | 'Purchase'>('Adjustment');
  const [formProductId, setFormProductId] = useState('');
  const [formBranchId, setFormBranchId] = useState('');
  const [formQty, setFormQty] = useState<number>(0);
  const [formRefMsg, setFormRefMsg] = useState('');

  const ownerId = user.role === 'staff' ? user.pharmacyId : user.uid;

  // React onSnapshot to load inventory movements
  useEffect(() => {
    if (!ownerId) return;
    const q = query(
      collection(db, 'inventory_movements'),
      where('pharmacyId', '==', ownerId)
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BinCardEntry));
      // Sort client-side in case firestore index is still constructing
      list.sort((a, b) => b.date - a.date);
      setMovements(list);
    }, (error) => {
      console.error("Error fetching bin card movements:", error);
    });

    return unsub;
  }, [ownerId]);

  // React onSnapshot to load products list
  useEffect(() => {
    if (!ownerId) return;
    const q = query(
      collection(db, 'medicines'),
      where('pharmacyId', '==', ownerId)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as InventoryProduct)));
    });
    return unsub;
  }, [ownerId]);

  // Handle Manual Log saving
  const handleSaveManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProductId) {
      toast.error('Please select a product');
      return;
    }
    if (formQty <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    const prod = products.find(p => p.id === formProductId);
    if (!prod) {
      toast.error('Selected product not found');
      return;
    }

    const targetBranch = formBranchId || `main_branch_${ownerId}`;
    const branchName = branches.find(b => b.id === targetBranch)?.name || 'Main Branch (HQ)';
    const factor = prod.conversionFactor || 1;

    // Determine new quantity update
    // Store inventory in purchase units. Qty adjustment inside the manual form represents Dispensing Units, or Purchase Units?
    // Let's make it plain Dispensing Units and automatically calculate deduction/addition in purchase units!
    // Or we let them choose. Let's make manual log strictly Dispensing Units because returns/adjustments at dispensary are usually in single tablet/strip/bottle units!
    const changeInPurchaseUnits = formQty / factor;
    let nextQty = prod.quantity;

    if (formType === 'Purchase' || formType === 'Return') {
      nextQty = prod.quantity + changeInPurchaseUnits;
    } else { // Adjustment
      nextQty = Math.max(0, prod.quantity - changeInPurchaseUnits);
    }

    const transToast = toast.loading('Logging stock transaction...');
    try {
      // 1. Update medicine stock
      await updateDoc(doc(db, 'medicines', formProductId), {
        quantity: nextQty
      });

      // 2. Add Bin Card Movement record
      const movementId = 'bm_man_' + Date.now();
      const newMovement: BinCardEntry = {
        id: movementId,
        pharmacyId: ownerId,
        branchId: targetBranch,
        productId: formProductId,
        productName: prod.name,
        genericName: prod.genericName || '',
        date: Date.now(),
        transactionType: formType,
        referenceNumber: formRefMsg.trim() || 'MANUAL-' + Date.now().toString().slice(-4),
        quantityIn: (formType === 'Purchase' || formType === 'Return') ? formQty : 0,
        quantityOut: (formType === 'Adjustment') ? formQty : 0,
        balance: nextQty * factor,
        user: user.displayName || user.email || 'Staff',
        branch: branchName,
        product: prod.name,
        countryOfOrigin: prod.countryOfOrigin || '',
        purchaseUnit: prod.purchaseUnit || '',
        dispensingUnit: prod.dispensingUnit || '',
        conversionFactor: factor
      };

      await setDoc(doc(db, 'inventory_movements', movementId), newMovement);
      toast.success(`${formType} logged successfully!`, { id: transToast });
      setIsFormOpen(false);
      setFormQty(0);
      setFormProductId('');
      setFormRefMsg('');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to log stock movement: ' + err.message, { id: transToast });
    }
  };

  // Perform filtering
  const filteredMovements = movements.filter(m => {
    // 1. Product Filter
    if (selectedProductId !== 'all' && m.productId !== selectedProductId) {
      return false;
    }

    // 2. Branch Filter
    if (selectedBranchId !== 'all') {
      const activeMainBranchId = `main_branch_${ownerId}`;
      if (selectedBranchId === 'main-branch' || selectedBranchId === activeMainBranchId) {
        if (m.branchId !== 'main-branch' && m.branchId !== activeMainBranchId) return false;
      } else if (m.branchId !== selectedBranchId) {
        return false;
      }
    }

    // 3. Date range filter
    if (startDate) {
      const startMs = new Date(startDate).getTime();
      if (m.date < startMs) return false;
    }
    if (endDate) {
      // end of the selected day
      const endMs = new Date(endDate).getTime() + 86400000;
      if (m.date > endMs) return false;
    }

    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="text-blue-600 dark:text-blue-400" /> Bin Card Ledger
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Professional record of stock transactions, balances, and inventory movements.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-100 dark:shadow-none"
          >
            <Plus size={18} /> Log Return / Adjustment
          </button>
        </div>
      </div>

      {/* Filter and stats banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 shadow-sm">
        {/* Product selector */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Product Select</label>
          <select 
            value={selectedProductId}
            onChange={e => setSelectedProductId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold font-sans dark:text-white outline-none focus:border-blue-500"
          >
            <option value="all">-- All Products --</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} {p.genericName ? `(${p.genericName})` : ''}</option>
            ))}
          </select>
        </div>

        {/* Branch selector */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Branch Outlet</label>
          <select 
            value={selectedBranchId}
            onChange={e => setSelectedBranchId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold font-sans dark:text-white outline-none focus:border-blue-500"
          >
            <option value="all">-- All Locations --</option>
            <option value="main-branch">Main Branch (HQ)</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Date From</label>
          <input 
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium dark:text-white outline-none focus:border-blue-500"
          />
        </div>

        {/* Date To */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Date To</label>
          <input 
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium dark:text-white outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Ledger Log Records */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/10">
          <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Ledger log records ({filteredMovements.length})
          </h2>
          <div className="text-xs text-slate-400 font-medium">
            Showing transactions filtered by selections
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-4">Date & Time</th>
                <th className="px-8 py-4">Product Details</th>
                <th className="px-8 py-4">Branch</th>
                <th className="px-8 py-4">Transaction Details</th>
                <th className="px-8 py-4 text-center">Qty In</th>
                <th className="px-8 py-4 text-center">Qty Out</th>
                <th className="px-8 py-4 text-right">Balance</th>
                <th className="px-8 py-4">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-sans">
              {filteredMovements.map((m) => {
                const dateStr = new Date(m.date).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                // Set transaction type styling labels
                let actionBadge = "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
                if (m.transactionType === 'Purchase') {
                  actionBadge = "bg-green-50 text-green-700 dark:bg-green-950/25 dark:text-green-400";
                } else if (m.transactionType === 'Sale') {
                  actionBadge = "bg-blue-50 text-blue-700 dark:bg-blue-950/25 dark:text-blue-400";
                } else if (m.transactionType === 'Return') {
                  actionBadge = "bg-orange-50 text-orange-700 dark:bg-orange-950/25 dark:text-orange-400";
                } else if (m.transactionType === 'Adjustment') {
                  actionBadge = "bg-purple-50 text-purple-700 dark:bg-purple-950/25 dark:text-purple-400";
                } else if (m.transactionType === 'Transfer') {
                  actionBadge = "bg-amber-50 text-amber-700 dark:bg-amber-950/25 dark:text-amber-400";
                }

                // Convert dispensing units display to purchase units if factor available
                const factorObj = m.conversionFactor || 1;
                const formatUnitsList = (dispQty: number) => {
                  if (!dispQty) return '-';
                  if (m.conversionFactor && m.conversionFactor > 1) {
                    const purchaseVal = dispQty / m.conversionFactor;
                    return (
                      <div>
                        <p className="font-bold">{dispQty.toFixed(0)} {m.dispensingUnit || 'Strips'}</p>
                        <p className="text-[10px] text-slate-400 font-normal">({purchaseVal.toFixed(1)} {m.purchaseUnit || 'Packs'})</p>
                      </div>
                    );
                  }
                  return <span className="font-bold">{dispQty} units</span>;
                };

                return (
                  <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-8 py-4 whitespace-nowrap text-slate-500 font-medium">
                      {dateStr}
                    </td>
                    <td className="px-8 py-4">
                      <p className="font-bold text-slate-900 dark:text-white capitalize leading-snug">
                        {m.productName || m.product}
                      </p>
                      {m.genericName && (
                        <p className="text-[10px] text-slate-400 font-medium italic mt-0.5">
                          Generic: {m.genericName}
                        </p>
                      )}
                      {m.countryOfOrigin && (
                        <span className="inline-block text-[9px] font-bold px-1 mt-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded uppercase">
                          🌍 {m.countryOfOrigin}
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-4 text-slate-600 dark:text-slate-300 font-bold whitespace-nowrap">
                      {m.branch || 'Main Branch (HQ)'}
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1.5">
                        <span className={`inline-block mr-auto text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${actionBadge}`}>
                          {m.transactionType}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                          Ref: {m.referenceNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-center whitespace-nowrap text-green-600">
                      {m.quantityIn > 0 ? formatUnitsList(m.quantityIn) : '-'}
                    </td>
                    <td className="px-8 py-4 text-center whitespace-nowrap text-red-500">
                      {m.quantityOut > 0 ? formatUnitsList(m.quantityOut) : '-'}
                    </td>
                    <td className="px-8 py-4 text-right whitespace-nowrap">
                      {formatUnitsList(m.balance)}
                    </td>
                    <td className="px-8 py-4 font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {m.user}
                    </td>
                  </tr>
                );
              })}

              {filteredMovements.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-8 py-16 text-center text-slate-400 dark:text-slate-500 italic">
                    No matching inventory transactions recorded for the select parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual log transaction modal form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Plus className="text-blue-500" /> Manual Stock Event Form
            </h2>
            <form onSubmit={handleSaveManualLog} className="space-y-4">
              {/* Type Select */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Movement Type</label>
                <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {['Adjustment', 'Return', 'Purchase'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormType(t as any)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${formType === t ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Select */}
              <div className="space-y-12 select-wrap">
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Select Medicine</label>
                <select
                  required
                  value={formProductId}
                  onChange={e => setFormProductId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold font-sans dark:text-white outline-none focus:border-blue-500"
                >
                  <option value="">-- Click to select medicine --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} {p.genericName ? `(${p.genericName})` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Branch select */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Branch Location</label>
                <select
                  value={formBranchId}
                  onChange={e => setFormBranchId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold font-sans dark:text-white outline-none focus:border-blue-500"
                >
                  <option value="">HQ / Main Branch (HQ)</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Quantity in dispensing units */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                  Quantity ({formProductId ? (products.find(p => p.id === formProductId)?.dispensingUnit || 'Dispensing Units') : 'Dispensing Units'})
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 5"
                  value={formQty || ''}
                  onChange={e => setFormQty(Math.max(1, Number(e.target.value)))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 text-sm"
                />
                {formProductId && (
                  <p className="text-[10px] text-blue-500 font-bold block mt-1">
                    Conversion: 1 {products.find(p => p.id === formProductId)?.purchaseUnit || 'Pack'} = {products.find(p => p.id === formProductId)?.conversionFactor || 1} {products.find(p => p.id === formProductId)?.dispensingUnit || 'Strips'}
                  </p>
                )}
              </div>

              {/* Reference */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Reference Info (Invoice / Prescription ID)</label>
                <input
                  type="text"
                  placeholder="e.g. RET-9831"
                  value={formRefMsg}
                  onChange={e => setFormRefMsg(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 text-xs font-mono uppercase"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs font-bold font-sans transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-sans shadow-lg shadow-blue-100 dark:shadow-none transition-all"
                >
                  Register Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BinCardLedgerView;
