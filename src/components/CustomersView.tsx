import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  doc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Customer, Sale } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  WifiOff,
  Activity,
  Heart,
  ShieldAlert,
  Award,
  FileText,
  Calendar,
  PlusCircle,
  AlertCircle,
  TrendingUp,
  History,
  Pill,
  Check,
  Clock,
  Sparkles,
  Filter,
  X,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CustomersViewProps {
  user: UserProfile;
  addToOfflineQueue: (item: { type: 'sale' | 'inventory' | 'customer'; id: string; action?: string; data: any }) => void;
  syncStatus: 'Online' | 'Offline' | 'Syncing' | 'Sync Complete';
}

// Extended Local Customer interface to support rich clinical details
interface PharmacyCustomer extends Customer {
  discountType?: 'percentage' | 'fixed' | 'none';
  discountValue?: number;
  chronicConditions?: string[];
  allergies?: string[];
  prescriptions?: Array<{
    id: string;
    drugName: string;
    dosage: string;
    frequency: string;
    startDate: number;
    durationDays: number;
    notes?: string;
  }>;
  vitals?: Array<{
    id: string;
    type: 'bp' | 'glucose' | 'weight';
    value: string; // "120/80", "135", "72" etc.
    notes?: string;
    timestamp: number;
  }>;
}

const COMMON_CHRONIC_CONDITIONS = [
  'Hypertension',
  'Diabetes (Type 2)',
  'Diabetes (Type 1)',
  'Asthma',
  'Chronic Kidney Disease',
  'COPD',
  'Dyslipidemia',
  'Peptic Ulcer Disease',
  'Heart Failure'
];

const CustomersView = ({ user, addToOfflineQueue, syncStatus }: CustomersViewProps) => {
  const [customers, setCustomers] = useState<PharmacyCustomer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<PharmacyCustomer | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'clinical' | 'meds' | 'vitals' | 'billing'>('clinical');

  // Form states for new customer
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    discountType: 'none',
    discountValue: 0,
    chronicConditions: [] as string[],
    allergies: ''
  });

  // Clinical Sub-Form States
  const [newAllergy, setNewAllergy] = useState('');
  const [newPrescription, setNewPrescription] = useState({
    drugName: '',
    dosage: '',
    frequency: 'Once Daily (QD)',
    durationDays: 30,
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [newVital, setNewVital] = useState({
    type: 'bp' as 'bp' | 'glucose' | 'weight',
    value: '', // e.g. "120/80"
    notes: ''
  });

  // Live drug safety screen text
  const [screenDrugQuery, setScreenDrugQuery] = useState('');

  const ownerId = user.role === 'staff' ? (user.pharmacyId || user.uid) : user.uid;
  const isPharmacySide = user.role === 'pharmacy' || user.role === 'staff';

  // Listen to customers of this pharmacy
  useEffect(() => {
    if (!ownerId) return;

    const q = query(
      collection(db, 'customers'),
      where('pharmacyId', '==', ownerId)
    );

    const unsub = onSnapshot(q, 
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as PharmacyCustomer));
        list.sort((a, b) => b.createdAt - a.createdAt);
        setCustomers(list);
        setLoading(false);

        // Keep selected customer synchronized if drawer is open
        if (selectedCustomer) {
          const updated = list.find(c => c.id === selectedCustomer.id);
          if (updated) setSelectedCustomer(updated);
        }
      },
      (error) => {
        console.error("Firestore customers error:", error);
        setLoading(false);
      }
    );

    return unsub;
  }, [ownerId, selectedCustomer?.id]);

  // Listen to Sales to correlate purchase history
  useEffect(() => {
    if (!ownerId) return;

    const qSales = query(
      collection(db, 'sales'),
      where('pharmacyId', '==', ownerId)
    );

    const unsubSales = onSnapshot(qSales, 
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Sale));
        setSales(list);
      },
      (error) => {
        console.error("Firestore sales error in customers view:", error);
      }
    );

    return unsubSales;
  }, [ownerId]);

  // Handler to register a new customer
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('Name and Phone are required.');
      return;
    }

    const customerId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const parsedAllergies = formData.allergies
      ? formData.allergies.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const newCustomer: PharmacyCustomer = {
      id: customerId,
      pharmacyId: ownerId || '',
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      discountType: formData.discountType as 'percentage' | 'fixed' | 'none',
      discountValue: Number(formData.discountValue) || 0,
      chronicConditions: formData.chronicConditions,
      allergies: parsedAllergies,
      prescriptions: [],
      vitals: [],
      createdAt: Date.now()
    };

    if (formData.email.trim()) newCustomer.email = formData.email.trim();
    if (formData.address.trim()) newCustomer.address = formData.address.trim();

    try {
      if (!navigator.onLine) {
        addToOfflineQueue({
          id: customerId,
          type: 'customer',
          data: newCustomer
        });
        
        await setDoc(doc(db, 'customers', customerId), newCustomer);
        setCustomers(prev => {
          if (prev.some(c => c.id === customerId)) return prev;
          return [newCustomer, ...prev];
        });
        setIsAdding(false);
        resetForm();
        toast.success('Customer registered offline successfully!', { icon: '💾' });
      } else {
        await setDoc(doc(db, 'customers', customerId), newCustomer);
        setCustomers(prev => {
          if (prev.some(c => c.id === customerId)) return prev;
          return [newCustomer, ...prev];
        });
        setIsAdding(false);
        resetForm();
        toast.success('Customer registered successfully!');
      }
    } catch (err) {
      console.error('Error adding customer:', err);
      toast.error('Failed to register customer. Saving offline.');
      addToOfflineQueue({
        id: customerId,
        type: 'customer',
        data: newCustomer
      });
      // Still show in local UI so they don't lose sight
      setCustomers(prev => {
        if (prev.some(c => c.id === customerId)) return prev;
        return [newCustomer, ...prev];
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      discountType: 'none',
      discountValue: 0,
      chronicConditions: [],
      allergies: ''
    });
  };

  // Delete customer handler
  const handleDeleteCustomer = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this customer? All medication and clinical history will be lost.')) {
      try {
        await deleteDoc(doc(db, 'customers', id));
        toast.success('Customer removed.');
        if (selectedCustomer?.id === id) {
          setSelectedCustomer(null);
        }
      } catch (err) {
        console.error('Error deleting customer:', err);
        toast.error('Failed to delete customer.');
      }
    }
  };

  // Helper to persist edits on the selected customer profile
  const saveCustomerProfileUpdate = async (updated: PharmacyCustomer) => {
    try {
      await setDoc(doc(db, 'customers', updated.id), updated);
      setSelectedCustomer(updated);
    } catch (err) {
      console.error('Error updating customer document:', err);
      toast.error('Failed to update profile. Saving offline.');
      addToOfflineQueue({
        id: updated.id,
        type: 'customer',
        data: updated
      });
    }
  };

  // Clinical updates handlers
  const handleToggleChronicCondition = async (condition: string) => {
    if (!selectedCustomer) return;
    const current = selectedCustomer.chronicConditions || [];
    const updatedConditions = current.includes(condition)
      ? current.filter(c => c !== condition)
      : [...current, condition];

    const updatedCustomer = {
      ...selectedCustomer,
      chronicConditions: updatedConditions
    };
    await saveCustomerProfileUpdate(updatedCustomer);
    toast.success(`${condition} profile state updated.`);
  };

  const handleAddAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !newAllergy.trim()) return;
    const current = selectedCustomer.allergies || [];
    if (current.map(a => a.toLowerCase()).includes(newAllergy.trim().toLowerCase())) {
      toast.error('Allergy already logged.');
      return;
    }

    const updatedCustomer = {
      ...selectedCustomer,
      allergies: [...current, newAllergy.trim()]
    };
    await saveCustomerProfileUpdate(updatedCustomer);
    setNewAllergy('');
    toast.success('Drug allergy warning added.');
  };

  const handleRemoveAllergy = async (allergy: string) => {
    if (!selectedCustomer) return;
    const updatedCustomer = {
      ...selectedCustomer,
      allergies: (selectedCustomer.allergies || []).filter(a => a !== allergy)
    };
    await saveCustomerProfileUpdate(updatedCustomer);
    toast.success('Allergy removed.');
  };

  // Prescription additions
  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !newPrescription.drugName.trim() || !newPrescription.dosage.trim()) {
      toast.error('Medication and Dosage are required.');
      return;
    }

    const startTimestamp = new Date(newPrescription.startDate).getTime() || Date.now();
    const rxItem: any = {
      id: `rx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      drugName: newPrescription.drugName.trim(),
      dosage: newPrescription.dosage.trim(),
      frequency: newPrescription.frequency,
      startDate: startTimestamp,
      durationDays: Number(newPrescription.durationDays) || 30
    };

    if (newPrescription.notes.trim()) {
      rxItem.notes = newPrescription.notes.trim();
    }

    const updatedCustomer = {
      ...selectedCustomer,
      prescriptions: [...(selectedCustomer.prescriptions || []), rxItem]
    };
    await saveCustomerProfileUpdate(updatedCustomer);
    setNewPrescription({
      drugName: '',
      dosage: '',
      frequency: 'Once Daily (QD)',
      durationDays: 30,
      startDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    toast.success('Medication prescription regimen logged!');
  };

  const handleRemovePrescription = async (rxId: string) => {
    if (!selectedCustomer) return;
    const updatedCustomer = {
      ...selectedCustomer,
      prescriptions: (selectedCustomer.prescriptions || []).filter(r => r.id !== rxId)
    };
    await saveCustomerProfileUpdate(updatedCustomer);
    toast.success('Prescription history cleared.');
  };

  // Vitals logs
  const handleAddVital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !newVital.value.trim()) {
      toast.error('Value is required to log clinical vitals.');
      return;
    }

    // Validation pattern checks
    if (newVital.type === 'bp' && !/^\d+\/\d+$/.test(newVital.value.trim())) {
      toast.error('Blood pressure must be formatted as Systolic/Diastolic (e.g. 120/80)');
      return;
    }

    const vitalReading: any = {
      id: `vt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: newVital.type,
      value: newVital.value.trim(),
      timestamp: Date.now()
    };

    if (newVital.notes.trim()) {
      vitalReading.notes = newVital.notes.trim();
    }

    const updatedCustomer = {
      ...selectedCustomer,
      vitals: [...(selectedCustomer.vitals || []), vitalReading]
    };
    await saveCustomerProfileUpdate(updatedCustomer);
    setNewVital({
      type: 'bp',
      value: '',
      notes: ''
    });
    toast.success('Vital sign logged successfully!');
  };

  const handleRemoveVital = async (vitalId: string) => {
    if (!selectedCustomer) return;
    const updatedCustomer = {
      ...selectedCustomer,
      vitals: (selectedCustomer.vitals || []).filter(v => v.id !== vitalId)
    };
    await saveCustomerProfileUpdate(updatedCustomer);
    toast.success('Vital record removed.');
  };

  // Filter customers list
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Compute metrics for the active customer
  const customerSales = useMemo(() => {
    if (!selectedCustomer) return [];
    return sales.filter(s => s.customerId === selectedCustomer.id || s.customerPhone === selectedCustomer.phone);
  }, [selectedCustomer, sales]);

  const customerTotalSpend = useMemo(() => {
    return customerSales.reduce((acc, cr) => acc + (cr.totalAmount || 0), 0);
  }, [customerSales]);

  const customerAvgSpend = useMemo(() => {
    return customerSales.length > 0 ? (customerTotalSpend / customerSales.length) : 0;
  }, [customerSales, customerTotalSpend]);

  const loyaltyTier = useMemo(() => {
    const total = customerTotalSpend;
    if (total >= 30000) return { name: 'Platinum Patient', color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900', tier: 'Platinum' };
    if (total >= 10000) return { name: 'Gold Patient', color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900', tier: 'Gold' };
    if (total >= 2000) return { name: 'Silver Patient', color: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700', tier: 'Silver' };
    return { name: 'Bronze Patient', color: 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30', tier: 'Bronze' };
  }, [customerTotalSpend]);

  const loyaltyProgress = useMemo(() => {
    const total = customerTotalSpend;
    let nextTierName = 'Silver';
    let target = 2000;
    let currentBase = 0;

    if (total >= 30000) return { percent: 100, remaining: 0, nextTier: 'Max Tier reached!' };
    if (total >= 10000) {
      nextTierName = 'Platinum';
      target = 30000;
      currentBase = 10000;
    } else if (total >= 2000) {
      nextTierName = 'Gold';
      target = 10000;
      currentBase = 2000;
    }

    const percent = Math.min(100, Math.max(0, ((total - currentBase) / (target - currentBase)) * 100));
    return {
      percent,
      remaining: target - total,
      nextTier: nextTierName
    };
  }, [customerTotalSpend]);

  // Clinical Safety Screening Logic
  const screenAlerts = useMemo(() => {
    if (!selectedCustomer || !screenDrugQuery.trim()) return null;
    const q = screenDrugQuery.toLowerCase();
    const alerts: Array<{ type: 'danger' | 'warning' | 'info'; text: string; details: string }> = [];

    const hasCondition = (cond: string) => 
      (selectedCustomer.chronicConditions || []).some(c => c.toLowerCase().includes(cond.toLowerCase()));

    const hasAllergy = (allg: string) => 
      (selectedCustomer.allergies || []).some(a => a.toLowerCase().includes(allg.toLowerCase()));

    // 1. Allergies Checks
    if (hasAllergy('penicillin') || hasAllergy('amoxicillin')) {
      if (q.includes('amox') || q.includes('penicil') || q.includes('ampicil') || q.includes('clox') || q.includes('augmentin') || q.includes('co-amox')) {
        alerts.push({
          type: 'danger',
          text: 'Severe Allergenic Contraindication!',
          details: 'Patient has a registered Penicillin Allergy. Dispensing Amoxicillin or other penicillins is strictly contraindicated. High risk of anaphylaxis. Suggest Azithromycin or Erythromycin instead.'
        });
      }
      if (q.includes('cef') || q.includes('cepha')) {
        alerts.push({
          type: 'warning',
          text: 'Potential Cephalosporin Cross-Reactivity Risk',
          details: 'Patient is allergic to Penicillin. Cephalosporins (e.g. Ceftriaxone, Cefalexin) have a 3-5% cross-reactivity rate. Use with extreme caution under pharmacist/physician oversight.'
        });
      }
    }

    if (hasAllergy('sulfa') || hasAllergy('sulfonamide') || hasAllergy('co-trimoxazole')) {
      if (q.includes('sulf') || q.includes('trimethoprim') || q.includes('bactrim') || q.includes('co-trim')) {
        alerts.push({
          type: 'danger',
          text: 'Sulfa Allergy Warning!',
          details: 'Patient has Sulfa/Sulfonamide allergies. Avoid dispensing Sulfamethoxazole/Trimethoprim. Risk of Stevens-Johnson syndrome.'
        });
      }
    }

    if (hasAllergy('aspirin') || hasAllergy('nsaid') || hasAllergy('ibuprofen')) {
      if (q.includes('aspirin') || q.includes('ibup') || q.includes('diclof') || q.includes('naprox') || q.includes('voltaren') || q.includes('nsaid')) {
        alerts.push({
          type: 'danger',
          text: 'NSAID / Aspirin Allergy Trigger',
          details: 'Patient has sensitivities/allergies to NSAIDs or Aspirin. High danger of bronchospasms or severe urticaria. Use Acetaminophen (Paracetamol) for pain relief.'
        });
      }
    }

    // 2. Chronic Illness Drug Interactions (Contraindications)
    if (hasCondition('asthma')) {
      if (q.includes('propran') || q.includes('carvedil') || q.includes('atenol') || q.includes('metoprol') || q.includes('beta blocker')) {
        alerts.push({
          type: 'danger',
          text: 'Clinical Contraindication: Asthma + Beta Blocker',
          details: 'Beta-blockers can trigger acute, life-threatening bronchoconstriction in patients with Asthma. Recommend Calcium Channel Blockers (Amlodipine) or ACEi instead.'
        });
      }
      if (q.includes('ibup') || q.includes('diclof') || q.includes('aspirin') || q.includes('naprox')) {
        alerts.push({
          type: 'warning',
          text: 'NSAID Induced Asthma Risk',
          details: 'NSAIDs can provoke asthma exacerbation in up to 10% of asthma sufferers due to leukotriene pathway shifts. Counsel patient on checking respiration.'
        });
      }
    }

    if (hasCondition('diabetes')) {
      if (q.includes('prednis') || q.includes('dexameth') || q.includes('cortis') || q.includes('steroid')) {
        alerts.push({
          type: 'warning',
          text: 'Hyperglycemic Steroid Interaction',
          details: 'Corticosteroids trigger severe insulin resistance, causing blood glucose levels to spike rapidly. Advise close blood glucose monitoring.'
        });
      }
      if (q.includes('propran') || q.includes('atenol') || q.includes('beta blocker')) {
        alerts.push({
          type: 'warning',
          text: 'Hypoglycemic Masking Warning',
          details: 'Beta blockers can mask key autonomic symptoms of hypoglycemia (tachycardia, tremors, palpitations), delaying patient response. Diaphoresis (sweating) remains unmasked.'
        });
      }
    }

    if (hasCondition('kidney')) {
      if (q.includes('ibup') || q.includes('diclof') || q.includes('naprox') || q.includes('meloxicam')) {
        alerts.push({
          type: 'danger',
          text: 'Nephrotoxicity Contraindication',
          details: 'NSAIDs inhibit renal prostaglandins, reducing renal blood flow and inducing acute-on-chronic kidney injury. Avoid completely in CKD.'
        });
      }
      if (q.includes('metform')) {
        alerts.push({
          type: 'warning',
          text: 'Metformin Renal Clearance Risk',
          details: 'Metformin clearance decreases with reduced eGFR. Discontinue or reduce dose if eGFR < 45 ml/min to avoid Lactic Acidosis risk.'
        });
      }
    }

    if (hasCondition('ulcer') || hasCondition('peptic')) {
      if (q.includes('ibup') || q.includes('diclof') || q.includes('aspirin') || q.includes('naprox')) {
        alerts.push({
          type: 'danger',
          text: 'Active GI Bleed & Ulceration Risk',
          details: 'NSAIDs cause severe COX-1 inhibition, depleting gastric mucosal protection and triggering bleeding or active peptic ulcers. Must co-prescribe PPI (e.g. Omeprazole) or avoid.'
        });
      }
    }

    // 3. Counseling tips (Informational)
    if (q.includes('metformin')) {
      alerts.push({
        type: 'info',
        text: 'Counseling: Administer with Meals',
        details: 'Advise patient to take Metformin during or immediately after meals to significantly reduce gastrointestinal side effects (bloating, nausea, diarrhea).'
      });
    }
    if (q.includes('atorvast') || q.includes('simvast') || q.includes('statin')) {
      alerts.push({
        type: 'info',
        text: 'Counseling: Take at Bedtime',
        details: 'Statins (especially short-acting ones like Simvastatin) are more effective at night since cholesterol synthesis peaks in the early morning hours.'
      });
    }
    if (q.includes('cipro') || q.includes('doxycyclin')) {
      alerts.push({
        type: 'info',
        text: 'Counseling: Avoid Dairy/Antacids',
        details: 'Cation-rich products (milk, yogurt, calcium supplements, antacids) chelate with fluoroquinolones/tetracyclines, reducing absorption by up to 80%. Take 2 hours before or 4 hours after.'
      });
    }

    return alerts;
  }, [selectedCustomer, screenDrugQuery]);

  // Dynamic calculation of prescription refill statuses
  const rxWithStatuses = useMemo(() => {
    if (!selectedCustomer || !selectedCustomer.prescriptions) return [];
    const now = Date.now();
    return selectedCustomer.prescriptions.map(rx => {
      const durationMs = rx.durationDays * 24 * 60 * 60 * 1000;
      const refillDate = rx.startDate + durationMs;
      const daysRemaining = Math.ceil((refillDate - now) / (24 * 60 * 60 * 1000));
      
      let status: 'overdue' | 'due' | 'stocked' = 'stocked';
      let label = '';
      let badgeClass = '';

      if (daysRemaining < 0) {
        status = 'overdue';
        label = `Refill Overdue by ${Math.abs(daysRemaining)} days`;
        badgeClass = 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50';
      } else if (daysRemaining <= 3) {
        status = 'due';
        label = daysRemaining === 0 ? 'Refill Due Today!' : `Refill Due in ${daysRemaining} days`;
        badgeClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50';
      } else {
        status = 'stocked';
        label = `${daysRemaining} days of supply remaining`;
        badgeClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50';
      }

      return {
        ...rx,
        refillDate,
        daysRemaining,
        status,
        label,
        badgeClass
      };
    });
  }, [selectedCustomer]);

  // Vitals Trend Plot Calculations (SVG Chart)
  const renderVitalsChart = (type: 'bp' | 'glucose') => {
    if (!selectedCustomer || !selectedCustomer.vitals) return null;
    const list = selectedCustomer.vitals
      .filter(v => v.type === type)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (list.length < 2) {
      return (
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 text-center border border-dashed border-slate-200 dark:border-slate-800">
          <Activity size={24} className="mx-auto text-slate-350 mb-2" />
          <p className="text-xs text-slate-500">Add at least 2 historical vital readings to visualize the trends chart.</p>
        </div>
      );
    }

    const width = 500;
    const height = 180;
    const padding = 30;

    // Scale calculations
    const timestamps = list.map(v => v.timestamp);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const timeRange = maxTime - minTime || 1;

    let points: string[] = [];
    let points2: string[] = []; // For diastolic in case of BP

    if (type === 'bp') {
      const systolics = list.map(v => parseInt(v.value.split('/')[0]) || 120);
      const diastolics = list.map(v => parseInt(v.value.split('/')[1]) || 80);
      const allVals = [...systolics, ...diastolics];
      const maxVal = Math.max(...allVals, 160) + 10;
      const minVal = Math.min(...allVals, 60) - 10;
      const valRange = maxVal - minVal || 1;

      const getX = (t: number) => padding + ((t - minTime) / timeRange) * (width - padding * 2);
      const getY = (val: number) => height - padding - ((val - minVal) / valRange) * (height - padding * 2);

      points = list.map((v, idx) => {
        const sys = parseInt(v.value.split('/')[0]) || 120;
        return `${getX(v.timestamp)},${getY(sys)}`;
      });

      points2 = list.map((v, idx) => {
        const dia = parseInt(v.value.split('/')[1]) || 80;
        return `${getX(v.timestamp)},${getY(dia)}`;
      });

      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Blood Pressure Trend (mmHg)</span>
            <div className="flex gap-4 text-[10px] font-bold">
              <span className="flex items-center gap-1.5 text-blue-500"><span className="h-2 w-2 rounded-full bg-blue-500 inline-block"></span>Systolic</span>
              <span className="flex items-center gap-1.5 text-emerald-500"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>Diastolic</span>
            </div>
          </div>
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            {/* Grid Lines */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f1f5f9" className="dark:stroke-slate-800" strokeWidth={1} />
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#f1f5f9" className="dark:stroke-slate-800" strokeWidth={1} />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" className="dark:stroke-slate-700" strokeWidth={1.5} />

            {/* Systolic Line */}
            <polyline fill="none" stroke="#3b82f6" strokeWidth="2.5" points={points.join(' ')} />
            {/* Diastolic Line */}
            <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={points2.join(' ')} />

            {/* Dots */}
            {list.map((v, idx) => {
              const sys = parseInt(v.value.split('/')[0]) || 120;
              const dia = parseInt(v.value.split('/')[1]) || 80;
              const cx = getX(v.timestamp);
              const cySys = getY(sys);
              const cyDia = getY(dia);

              return (
                <g key={v.id}>
                  <circle cx={cx} cy={cySys} r="4" fill="#3b82f6" stroke="#fff" strokeWidth="1.5" className="cursor-pointer" />
                  <circle cx={cx} cy={cyDia} r="4" fill="#10b981" stroke="#fff" strokeWidth="1.5" className="cursor-pointer" />
                  <text x={cx} y={cySys - 8} fontSize="8" fontWeight="bold" textAnchor="middle" fill="#1e40af" className="dark:fill-blue-400 font-mono">
                    {sys}
                  </text>
                  <text x={cx} y={cyDia + 12} fontSize="8" fontWeight="bold" textAnchor="middle" fill="#065f46" className="dark:fill-emerald-400 font-mono">
                    {dia}
                  </text>
                  <text x={cx} y={height - 12} fontSize="8" textAnchor="middle" fill="#94a3b8" className="font-mono">
                    {new Date(v.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      );
    } else {
      // Glucose charts
      const glucVals = list.map(v => parseInt(v.value) || 100);
      const maxVal = Math.max(...glucVals, 140) + 20;
      const minVal = Math.min(...glucVals, 70) - 10;
      const valRange = maxVal - minVal || 1;

      const getX = (t: number) => padding + ((t - minTime) / timeRange) * (width - padding * 2);
      const getY = (val: number) => height - padding - ((val - minVal) / valRange) * (height - padding * 2);

      points = list.map((v, idx) => {
        const glu = parseInt(v.value) || 100;
        return `${getX(v.timestamp)},${getY(glu)}`;
      });

      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Blood Sugar History (mg/dL)</span>
            <span className="text-[10px] font-bold text-rose-500 font-sans">Therapeutic Goal: 70 - 130 mg/dL</span>
          </div>
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            {/* Grid lines */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f1f5f9" className="dark:stroke-slate-800" strokeWidth={1} />
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#f1f5f9" className="dark:stroke-slate-800" strokeWidth={1} />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" className="dark:stroke-slate-700" strokeWidth={1.5} />

            {/* Glucose Path */}
            <polyline fill="none" stroke="#f43f5e" strokeWidth="2.5" points={points.join(' ')} />

            {/* Dots */}
            {list.map((v, idx) => {
              const glu = parseInt(v.value) || 100;
              const cx = getX(v.timestamp);
              const cy = getY(glu);

              return (
                <g key={v.id}>
                  <circle cx={cx} cy={cy} r="4" fill="#f43f5e" stroke="#fff" strokeWidth="1.5" />
                  <text x={cx} y={cy - 8} fontSize="8" fontWeight="bold" textAnchor="middle" fill="#9f1239" className="dark:fill-rose-400 font-mono">
                    {glu}
                  </text>
                  <text x={cx} y={height - 12} fontSize="8" textAnchor="middle" fill="#94a3b8" className="font-mono">
                    {new Date(v.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      );
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white font-sans flex items-center gap-2.5">
            <Users className="text-blue-600 dark:text-blue-500" size={26} /> 
            {isPharmacySide ? 'Patient Medication & CRM Registry' : 'Wholesale Customers Directory'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isPharmacySide 
              ? 'Real-time drug-allergy warnings, chronic illness safety screenings, clinical vital sign trends, and POS transaction trackers.' 
              : 'Add, filter, and review wholesale pricing structures and discount loyalty settings for distributors.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 text-white rounded-xl px-5 py-2.5 font-bold text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none flex items-center gap-2"
          >
            <Plus size={16} /> {isPharmacySide ? 'Register New Patient' : 'Register Customer'}
          </button>
        </div>
      </div>

      {/* Connection Mode Bar */}
      {syncStatus === 'Offline' && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex items-center gap-3 text-amber-800 dark:text-amber-400">
          <WifiOff size={18} />
          <p className="text-xs font-bold leading-relaxed">
            You are operating in <strong>Offline Mode</strong>. Registered patients, medication histories, and vital log files will cache locally and automatically synchronize when internet returns.
          </p>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isPharmacySide ? "Search registered patients by name, phone list, or clinical illness..." : "Search buyers by name, phone, or address..."}
            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-6 py-3.5 text-xs focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 outline-none font-sans"
          />
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-xs font-bold text-slate-400 mt-4 uppercase tracking-widest">Loading Customer Ledgers...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users className="text-slate-400" size={28} />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white mb-2">No Registered Accounts Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed mb-6">
            Logging buyers and patients tracks allergies, clinical vitals, custom pricing discounts, and chronic disease adherence over time.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl px-5 py-3 shadow-lg shadow-blue-100 dark:shadow-none"
          >
            Add First Entry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map(c => {
            const loyaltySpend = sales
              .filter(s => s.customerId === c.id || s.customerPhone === c.phone)
              .reduce((sum, s) => sum + s.totalAmount, 0);

            let cardBadge = 'Bronze Patient';
            let cardBadgeClass = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
            if (loyaltySpend >= 30000) {
              cardBadge = 'Platinum VIP';
              cardBadgeClass = 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/50';
            } else if (loyaltySpend >= 10000) {
              cardBadge = 'Gold Star';
              cardBadgeClass = 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50';
            } else if (loyaltySpend >= 2000) {
              cardBadge = 'Silver Loyalty';
              cardBadgeClass = 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50';
            }

            return (
              <div 
                key={c.id} 
                onClick={() => setSelectedCustomer(c)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl relative hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => handleDeleteCustomer(c.id, e)} 
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all"
                      title="Delete profile"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-5">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-850 dark:text-slate-100">{c.name}</h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${cardBadgeClass}`}>
                          {cardBadge}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="space-y-2.5 pt-3 border-t border-slate-50 dark:border-slate-800/50">
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                      <Phone size={14} className="text-slate-400" />
                      <span className="text-xs font-mono">{c.phone}</span>
                    </div>
                    {c.email && (
                      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                        <Mail size={14} className="text-slate-400" />
                        <span className="text-xs truncate">{c.email}</span>
                      </div>
                    )}
                    {c.address && (
                      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                        <MapPin size={14} className="text-slate-400" />
                        <span className="text-xs truncate">{c.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Clinical Indicators on Card (Pharmacy side only) */}
                  {isPharmacySide && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/40 space-y-2">
                      {/* Chronic conditions chips */}
                      {c.chronicConditions && c.chronicConditions.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {c.chronicConditions.slice(0, 3).map(cond => (
                            <span key={cond} className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 rounded-md">
                              {cond.split(' ')[0]}
                            </span>
                          ))}
                          {c.chronicConditions.length > 3 && (
                            <span className="text-[9px] font-bold text-slate-400">+{c.chronicConditions.length - 3} more</span>
                          )}
                        </div>
                      )}

                      {/* Allergies Alerts */}
                      {c.allergies && c.allergies.length > 0 && (
                        <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                          <ShieldAlert size={12} />
                          <span className="truncate">Allergic to: {c.allergies.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/20 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Total Spent:</span>
                  <span className="font-extrabold text-slate-800 dark:text-white font-mono">{loyaltySpend.toLocaleString()} ETB</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Customer Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users size={18} className="text-blue-600" /> 
                  {isPharmacySide ? 'Patient Clinical Registration' : 'New Wholesale Account'}
                </h3>
                <button 
                  onClick={() => setIsAdding(false)} 
                  className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddCustomer} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Patient Full Name *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Almaz Bekele" 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Mobile Phone *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+251 911 234567" 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="almaz@example.com" 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Residential Address</label>
                    <input 
                      type="text" 
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Addis Ababa, Kebele 04" 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {isPharmacySide && (
                  <>
                    <div className="p-4 bg-blue-50/50 dark:bg-slate-800/40 rounded-2xl border border-blue-100/30">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 block mb-2">Pre-Existing Chronic Pathologies</span>
                      <div className="grid grid-cols-2 gap-2">
                        {COMMON_CHRONIC_CONDITIONS.map(cond => {
                          const isSel = formData.chronicConditions.includes(cond);
                          return (
                            <button
                              type="button"
                              key={cond}
                              onClick={() => {
                                const current = formData.chronicConditions;
                                setFormData({
                                  ...formData,
                                  chronicConditions: isSel ? current.filter(x => x !== cond) : [...current, cond]
                                });
                              }}
                              className={`px-3 py-2 rounded-xl text-[11px] font-bold text-left border transition-all ${isSel ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-900 text-slate-650 border-slate-150 dark:border-slate-800'}`}
                            >
                              {cond}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Drug Allergies & Chemical Sensitivities</label>
                      <input 
                        type="text" 
                        value={formData.allergies}
                        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                        placeholder="Comma separated: Penicillin, Sulfa, Ibuprofen" 
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">POS Discount Type</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value, discountValue: e.target.value === 'none' ? 0 : formData.discountValue })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-xs text-slate-850 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    >
                      <option value="none">None</option>
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed (ETB)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Discount Value</label>
                    <input 
                      type="number" 
                      min="0"
                      disabled={formData.discountType === 'none'}
                      value={formData.discountValue || ''}
                      onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) || 0 })}
                      placeholder="e.g. 10" 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    type="button" 
                    onClick={() => { setIsAdding(false); resetForm(); }} 
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl font-bold text-xs text-slate-500"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-100 dark:shadow-none"
                  >
                    Save Customer Account
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rich Patient Drawer / Clinical Panel (Pharmacy/Staff Side Only) */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setSelectedCustomer(null)} />

            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-900 h-full shadow-2xl flex flex-col justify-between overflow-hidden z-10"
            >
              {/* Drawer Header */}
              <div className="p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-lg font-black">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      {selectedCustomer.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase border ${loyaltyTier.color}`}>
                        {loyaltyTier.name}
                      </span>
                      <span className="text-slate-400 text-xs font-mono">{selectedCustomer.phone}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCustomer(null)} 
                  className="rounded-full p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Sub-Navigation Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4">
                {[
                  { id: 'clinical', label: '🩺 Clinical Profile', isPharmacyOnly: true },
                  { id: 'meds', label: '💊 Prescriptions & Refills', isPharmacyOnly: true },
                  { id: 'vitals', label: '📊 Vitals Tracker', isPharmacyOnly: true },
                  { id: 'billing', label: '💳 Loyalty & POS Ledger', isPharmacyOnly: false }
                ]
                  .filter(tab => !tab.isPharmacyOnly || isPharmacySide)
                  .map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveDrawerTab(tab.id as any)}
                      className={`py-3 px-4 font-bold text-xs border-b-2 transition-all ${activeDrawerTab === tab.id ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* TAB 1: Clinical Profile & Allergy Warnings */}
                {activeDrawerTab === 'clinical' && isPharmacySide && (
                  <div className="space-y-6">
                    {/* Clinical Alert Card if allergic/conditions exist */}
                    <div className="p-4 bg-rose-500/5 dark:bg-rose-950/10 border border-rose-500/20 rounded-2xl">
                      <div className="flex items-start gap-3">
                        <ShieldAlert className="text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" size={18} />
                        <div>
                          <h4 className="text-xs font-extrabold text-rose-800 dark:text-rose-400 uppercase tracking-wider">Drug & Clinical Safety Summary</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            Always screen prescriptions. Patient has <strong>{(selectedCustomer.chronicConditions || []).length} chronic condition(s)</strong> and <strong>{(selectedCustomer.allergies || []).length} drug allergy warning(s)</strong> logged.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Allergies tag manager */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Active Drug Allergies</h4>
                        <span className="text-[10px] text-red-500 font-bold">Anaphylaxis Risk Alert</span>
                      </div>
                      <form onSubmit={handleAddAllergy} className="flex gap-2">
                        <input 
                          type="text" 
                          value={newAllergy}
                          onChange={(e) => setNewAllergy(e.target.value)}
                          placeholder="e.g. Penicillin, Aspirin, Sulfa drugs..." 
                          className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button type="submit" className="px-4 py-2 bg-slate-900 text-white dark:bg-blue-600 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-slate-850">
                          <PlusCircle size={14} /> Add
                        </button>
                      </form>

                      <div className="flex flex-wrap gap-1.5">
                        {(selectedCustomer.allergies || []).length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">No drug allergies logged for this patient profile.</p>
                        ) : (
                          (selectedCustomer.allergies || []).map(allg => (
                            <span key={allg} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-red-100/70 text-red-800 dark:bg-red-950/40 dark:text-red-400 border border-red-200/40 dark:border-red-950 rounded-xl">
                              {allg}
                              <button type="button" onClick={() => handleRemoveAllergy(allg)} className="text-red-500 hover:text-red-700">
                                &times;
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Chronic care conditions panel */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-4">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Chronic Diseases & Comorbidities</h4>
                      <p className="text-[11px] text-slate-400">Click to toggle the medical status flags of the patient. Auto-screens safety checks.</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {COMMON_CHRONIC_CONDITIONS.map(cond => {
                          const isSel = (selectedCustomer.chronicConditions || []).includes(cond);
                          return (
                            <button
                              type="button"
                              key={cond}
                              onClick={() => handleToggleChronicCondition(cond)}
                              className={`px-3 py-2.5 rounded-xl text-[11px] font-bold text-left border transition-all ${isSel ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60' : 'bg-slate-50/50 dark:bg-slate-900 text-slate-450 border-slate-150 dark:border-slate-850'}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${isSel ? 'bg-blue-600 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
                                {cond}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Live Dispensing Clinical Decision Support Safety Screener */}
                    <div className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-950 p-5 rounded-3xl space-y-4 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 h-1 bg-emerald-500 w-full"></div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="text-emerald-500" size={16} />
                          <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Clinical Decision Support Screening</h4>
                        </div>
                        <span className="text-[9.5px] px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 font-extrabold rounded-md uppercase">PMP Safety AI</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Type a therapeutic molecule or brand drug name to cross-check clinical safety warnings for this patient profile.</p>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="text" 
                          value={screenDrugQuery}
                          onChange={(e) => setScreenDrugQuery(e.target.value)}
                          placeholder="Type drug molecule: Amoxicillin, Ibuprofen, Propranolol, Metformin..." 
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-800 pl-9 pr-4 py-2.5 rounded-xl text-xs text-slate-800 dark:text-slate-150 outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Screen Results */}
                      {screenDrugQuery.trim() && (
                        <div className="space-y-3.5 pt-2">
                          {screenAlerts && screenAlerts.length > 0 ? (
                            screenAlerts.map((alert, i) => (
                              <div 
                                key={i} 
                                className={`p-4 rounded-2xl border text-xs leading-relaxed flex gap-3 ${alert.type === 'danger' ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-300' : alert.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-300' : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-300'}`}
                              >
                                {alert.type === 'danger' ? <AlertTriangle className="text-rose-500 shrink-0" size={18} /> : alert.type === 'warning' ? <AlertCircle className="text-amber-500 shrink-0" size={18} /> : <BookOpen className="text-blue-500 shrink-0" size={18} />}
                                <div>
                                  <h5 className="font-extrabold">{alert.text}</h5>
                                  <p className="text-[11px] mt-1 leading-normal opacity-90">{alert.details}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 bg-emerald-50/50 border border-emerald-200/50 text-emerald-800 rounded-2xl text-xs flex items-center gap-2.5 dark:bg-emerald-950/10 dark:border-emerald-900 dark:text-emerald-400">
                              <CheckCircle size={16} className="text-emerald-500" />
                              <span className="font-bold">No safety alerts triggered for "{screenDrugQuery}". Continue clinical consultation.</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: Prescription Ledger & Medication Refills */}
                {activeDrawerTab === 'meds' && isPharmacySide && (
                  <div className="space-y-6">
                    {/* Log New Prescription */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-4">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                        <PlusCircle size={16} className="text-blue-600" /> Log Medication Regimen / Prescription
                      </h4>
                      <form onSubmit={handleAddPrescription} className="space-y-3.5">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Drug Name *</label>
                            <input 
                              type="text" 
                              required
                              value={newPrescription.drugName}
                              onChange={(e) => setNewPrescription({ ...newPrescription, drugName: e.target.value })}
                              placeholder="e.g. Metformin, Amlodipine" 
                              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2.5 text-xs outline-none text-slate-800 dark:text-slate-100"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Strength / Dosage *</label>
                            <input 
                              type="text" 
                              required
                              value={newPrescription.dosage}
                              onChange={(e) => setNewPrescription({ ...newPrescription, dosage: e.target.value })}
                              placeholder="e.g. 500mg, 5mg" 
                              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2.5 text-xs outline-none text-slate-800 dark:text-slate-100"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Frequency</label>
                            <select 
                              value={newPrescription.frequency}
                              onChange={(e) => setNewPrescription({ ...newPrescription, frequency: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2.5 text-xs outline-none text-slate-800 dark:text-slate-100"
                            >
                              <option value="Once Daily (QD)">Once Daily (QD)</option>
                              <option value="Twice Daily (BID)">Twice Daily (BID)</option>
                              <option value="Three Times (TID)">Three Times (TID)</option>
                              <option value="Four Times (QID)">Four Times (QID)</option>
                              <option value="As Needed (PRN)">As Needed (PRN)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Days Supply (Duration)</label>
                            <input 
                              type="number" 
                              min="1"
                              value={newPrescription.durationDays}
                              onChange={(e) => setNewPrescription({ ...newPrescription, durationDays: Number(e.target.value) || 30 })}
                              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2.5 text-xs outline-none text-slate-800 dark:text-slate-100 font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Start Date</label>
                            <input 
                              type="date" 
                              value={newPrescription.startDate}
                              onChange={(e) => setNewPrescription({ ...newPrescription, startDate: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2.5 text-xs outline-none text-slate-800 dark:text-slate-100 font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Counseling Notes / Directions</label>
                          <input 
                            type="text" 
                            value={newPrescription.notes}
                            onChange={(e) => setNewPrescription({ ...newPrescription, notes: e.target.value })}
                            placeholder="Take after dinner, watch out for renal indicators..." 
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2.5 text-xs outline-none text-slate-800 dark:text-slate-100"
                          />
                        </div>

                        <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-100 dark:shadow-none flex items-center justify-center gap-2">
                          <Pill size={14} /> Save Active Prescription
                        </button>
                      </form>
                    </div>

                    {/* Prescription History and Refills Alerts */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                          <History size={16} className="text-blue-500" /> Active Prescriptions & Refill Statuses
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold">Chronological Order</span>
                      </div>

                      {rxWithStatuses.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                          <Pill size={32} className="mx-auto text-slate-300 mb-2 animate-bounce" />
                          <p className="text-xs">No active prescriptions logged for this patient profile.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {rxWithStatuses.map(rx => (
                            <div key={rx.id} className="border border-slate-100 dark:border-slate-800/80 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2.5">
                                  <h5 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">{rx.drugName}</h5>
                                  <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-slate-600 dark:text-slate-400 font-mono">{rx.dosage}</span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-normal">
                                  Freq: <span className="font-bold text-slate-600 dark:text-slate-300">{rx.frequency}</span> | Duration: <span className="font-bold text-slate-600 dark:text-slate-300">{rx.durationDays} Days</span> | Started: <span className="font-mono text-slate-500">{new Date(rx.startDate).toLocaleDateString()}</span>
                                </p>
                                {rx.notes && (
                                  <p className="text-[10.5px] text-blue-600 dark:text-blue-400 italic">Counsel: {rx.notes}</p>
                                )}
                              </div>
                              
                              <div className="flex flex-row md:flex-col items-end gap-2 shrink-0">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-xl ${rx.badgeClass}`}>
                                  {rx.label}
                                </span>
                                <button 
                                  onClick={() => handleRemovePrescription(rx.id)}
                                  className="text-[10px] text-slate-400 hover:text-rose-500 font-bold uppercase tracking-wider pt-1 flex items-center gap-1 transition-all"
                                >
                                  <Trash2 size={11} /> Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: Clinical Vitals & Trends Graph */}
                {activeDrawerTab === 'vitals' && isPharmacySide && (
                  <div className="space-y-6">
                    {/* Log new Vital Reading */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-4">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                        <Activity size={16} className="text-emerald-500 animate-pulse" /> Log Clinical Vital Reading
                      </h4>
                      <form onSubmit={handleAddVital} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Vital Type</label>
                          <select
                            value={newVital.type}
                            onChange={(e) => setNewVital({ ...newVital, type: e.target.value as any, value: '' })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2.5 text-xs outline-none text-slate-805 dark:text-slate-100 font-bold"
                          >
                            <option value="bp">Blood Pressure</option>
                            <option value="glucose">Blood Glucose</option>
                            <option value="weight">Body Weight</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            {newVital.type === 'bp' ? 'BP Value (Systolic/Diastolic)*' : newVital.type === 'glucose' ? 'Glucose Level (mg/dL)*' : 'Weight Value (kg)*'}
                          </label>
                          <input 
                            type="text"
                            required
                            value={newVital.value}
                            onChange={(e) => setNewVital({ ...newVital, value: e.target.value })}
                            placeholder={newVital.type === 'bp' ? 'e.g. 120/80' : newVital.type === 'glucose' ? 'e.g. 105' : 'e.g. 74'}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2.5 text-xs outline-none text-slate-800 dark:text-slate-100 font-mono"
                          />
                        </div>

                        <button type="submit" className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-100 dark:shadow-none flex items-center justify-center gap-1.5">
                          <Check size={14} /> Log Vital
                        </button>
                      </form>
                    </div>

                    {/* Vitals Trends Graph charts */}
                    {renderVitalsChart('bp')}
                    {renderVitalsChart('glucose')}

                    {/* Vitals logs ledger table */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-4">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Historical Vitals Index</h4>
                      {(selectedCustomer.vitals || []).length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-4 text-center">No vital sign records logged yet.</p>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-850 text-slate-400 font-black uppercase text-[9.5px]">
                                <th className="p-3">Logged Date</th>
                                <th className="p-3">Vital Sign Type</th>
                                <th className="p-3">Recorded Value</th>
                                <th className="p-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(selectedCustomer.vitals || [])
                                .sort((a,b) => b.timestamp - a.timestamp)
                                .map(v => (
                                  <tr key={v.id} className="border-t border-slate-100 dark:border-slate-850 hover:bg-slate-50/50">
                                    <td className="p-3 font-mono text-slate-500">{new Date(v.timestamp).toLocaleString()}</td>
                                    <td className="p-3 font-bold text-slate-700 dark:text-slate-300">
                                      {v.type === 'bp' ? '🩺 Blood Pressure' : v.type === 'glucose' ? '🩸 Blood Glucose' : '⚖️ Body Weight'}
                                    </td>
                                    <td className="p-3 font-extrabold text-slate-900 dark:text-white font-mono">{v.value} {v.type === 'glucose' ? 'mg/dL' : v.type === 'weight' ? 'kg' : 'mmHg'}</td>
                                    <td className="p-3 text-right">
                                      <button 
                                        type="button" 
                                        onClick={() => handleRemoveVital(v.id)} 
                                        className="text-slate-400 hover:text-red-500 transition-all"
                                      >
                                        <Trash2 size={13} />
                                      </button>
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

                {/* TAB 4: Loyalty, Sales Ledger, POS Metrics */}
                {activeDrawerTab === 'billing' && (
                  <div className="space-y-6">
                    {/* Loyalty Reward Card */}
                    <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl p-6 shadow-xl border border-blue-900/40 relative overflow-hidden">
                      <div className="absolute right-0 bottom-0 opacity-10 font-black text-8xl -mr-6 -mb-6 select-none font-sans">LOYAL</div>
                      <div className="absolute top-4 right-4 text-amber-400 animate-pulse"><Award size={24} /></div>
                      
                      <span className="text-[9px] uppercase tracking-widest font-black text-blue-300 block">Patient Loyalty Reward Program</span>
                      <h4 className="text-xl font-black mt-1 font-sans">{selectedCustomer.name}</h4>
                      
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div>
                          <span className="text-[10px] text-blue-300 font-bold block uppercase tracking-wider">Accumulated Volume</span>
                          <span className="text-2xl font-black font-mono mt-0.5 block text-amber-400">{customerTotalSpend.toLocaleString()} ETB</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-blue-300 font-bold block uppercase tracking-wider">Average Ticket</span>
                          <span className="text-xl font-black font-mono mt-1 block">{customerAvgSpend.toLocaleString(undefined, { maximumFractionDigits: 1 })} ETB</span>
                        </div>
                      </div>

                      {/* Loyalty Tier Progress */}
                      {loyaltyProgress.percent < 100 ? (
                        <div className="mt-6 pt-5 border-t border-blue-900/50 space-y-2">
                          <div className="flex justify-between items-center text-[11px] font-bold">
                            <span className="text-blue-300">Next Tier: {loyaltyProgress.nextTier}</span>
                            <span>{loyaltyProgress.remaining.toLocaleString()} ETB remaining</span>
                          </div>
                          <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${loyaltyProgress.percent}%` }}></div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-6 pt-4 border-t border-blue-900/50 flex items-center gap-2 text-xs text-amber-400 font-black">
                          <Award size={16} /> Max Tier (Platinum VIP Status) Reached!
                        </div>
                      )}
                    </div>

                    {/* Historical POS Receipts Index */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-4">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Historical POS Purchase Ledger</h4>
                      {customerSales.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-xs">
                          <FileText size={24} className="mx-auto text-slate-350 mb-2" />
                          No purchase history associated with this patient account.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {customerSales
                            .sort((a,b) => b.createdAt - a.createdAt)
                            .map(sale => (
                              <div key={sale.id} className="p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl bg-slate-50/50 dark:bg-slate-900 space-y-2.5">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs font-mono">{sale.id}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">| {new Date(sale.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <span className="font-black text-slate-900 dark:text-white font-mono text-xs">{sale.totalAmount.toLocaleString()} ETB</span>
                                </div>

                                <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 pl-2.5 border-l-2 border-slate-200 dark:border-slate-850">
                                  {sale.items.map((it, idx) => (
                                    <div key={idx} className="flex justify-between">
                                      <span>{it.name} <span className="text-slate-400 font-bold font-mono">x{it.quantity}</span></span>
                                      <span className="font-mono">{(it.price * it.quantity).toLocaleString()} ETB</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* Drawer Footer Status */}
              <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider flex justify-between items-center">
                <span>Clinical Decision Record: Secure PMP</span>
                <span>Active Status: Live Registry</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomersView;
