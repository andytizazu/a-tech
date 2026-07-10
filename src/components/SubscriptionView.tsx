import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, SystemSettings, SaaSInvoice } from '../types';
import { getSubscriptionCost, PLAN_PRICES } from '../lib/billingEngine';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { AlertTriangle, Clock, Zap, CheckCircle, XCircle, CreditCard, Check, X, Sparkles } from 'lucide-react';
import { TRANSLATIONS } from '../App';

export const SubscriptionView = ({ 
  user: rawUser, 
  settings, 
  language = 'en' 
}: { 
  user: UserProfile; 
  settings: SystemSettings | null; 
  language?: 'en' | 'am' | 'om' | 'ti';
}) => {
  const user = {
    ...rawUser,
    subscriptionType: (rawUser.subscriptionType as any) === 'enterprise' ? 'premium' : rawUser.subscriptionType,
    pendingSubscriptionType: (rawUser.pendingSubscriptionType as any) === 'enterprise' ? 'premium' : rawUser.pendingSubscriptionType,
  };

  const [renewalMonths, setRenewalMonths] = useState(1);
  const [isRenewing, setIsRenewing] = useState(false);
  const [invoices, setInvoices] = useState<SaaSInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [branchesCount, setBranchesCount] = useState(1);

  // Subscribing to SaaS invoices
  useEffect(() => {
    const q = query(
      collection(db, 'saas_invoices'), 
      where('pharmacyId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const invList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as SaaSInvoice);
      setInvoices(invList);
      setLoadingInvoices(false);
    }, (err) => {
      console.error("Error loading SaaS invoices:", err);
      setLoadingInvoices(false);
    });
    return () => unsub();
  }, [user.uid]);

  // Subscribing to branches count to feed real-time calculations
  useEffect(() => {
    const q = query(collection(db, 'branches'), where('pharmacyId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setBranchesCount(snap.size || 1);
    });
    return () => unsub();
  }, [user.uid]);

  const t = (key: string) => {
    const dict = TRANSLATIONS[language as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;
    return (dict as any)[key] || key;
  };

  const getPlanPrice = (planId: string) => {
    return (settings?.planPrices?.[planId as keyof typeof PLAN_PRICES]) ?? PLAN_PRICES[planId as keyof typeof PLAN_PRICES];
  };

  // Billing Cycle Selection (Monthly vs Annual - Save 20%)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Baseline Fallback New Subscription Plan configurations representing high pharmacy ecosystem fidelity
  const DEFAULT_PLANS = {
    basic: {
      id: 'basic',
      name: 'Basic',
      description: 'Ideal support for single location pharmacies, small stores and new setups starting active workflows.',
      recommended: false,
      features: [
        'Inventory Management',
        'Sales Management',
        'Customer Management',
        'Purchase Management',
        'Expiry Tracking',
        'Generic Name Tracking',
        'Country of Origin Tracking',
        'Purchase Units',
        'Dispensing Units',
        'Conversion Factors',
        'Bin Card Reports',
        'Barcode Support',
        'Basic Reporting',
        'Receipt Printing',
        'User Management',
        'Dashboard Analytics'
      ],
      limitations: [
        'Branch Management & Multi-Outlet accounts',
        'Branch-to-Branch Transfers & approvals',
        'Advanced Inventory Analytics indicators',
        'Logistics & Importers Distributor Ledger Node',
        'Detailed Administrative Audit Operations'
      ],
      futureFeatures: [
        'Standard Multi-user Audits Platform'
      ],
      enableFutureFeatures: false
    },
    standard: {
      id: 'standard', // Maps to Professional Plan
      name: 'Professional',
      description: 'Engineered for expanding pharmacies and businesses running multiple operations seamlessly.',
      recommended: true,
      features: [
        'Everything in Basic Plan',
        'Branch Management',
        'Multiple Branch Support',
        'Branch Billing Options',
        'Branch Creation and Deletion',
        'Branch-Level Reporting',
        'Branch Performance Analytics',
        'Branch Inventory Visibility',
        'Customer Discount Management',
        'Batch-Aware POS',
        'FEFO Recommendations',
        'Batch Tracking',
        'Advanced Inventory Reports',
        'Audit Logs',
        'Transfer Reports',
        'Branch Notifications',
        'Priority Live Support'
      ],
      limitations: [
        'Branch-to-Branch High-Volume Stock Transfers',
        'Transfer Approval Multi-Stage Workflow',
        'Supplier Ledger Ratings & compliance checks',
        'Central Premium Audit Center'
      ],
      futureFeatures: [
        'Ecosystem transit insurance logs'
      ],
      enableFutureFeatures: false
    },
    premium: {
      id: 'premium', // Maps to Premium Plan
      name: 'Premium',
      description: 'Uncapped power for largest multi-branch chains, importers group and administrative regions.',
      recommended: false,
      features: [
        'Everything in Professional Plan',
        'Branch-to-Branch Stock Transfers',
        'Transfer Approval Workflow',
        'Transfer Tracking Numbers (TRF-YYYY-######)',
        'Transfer History logs',
        'Transfer Audit Logs',
        'Transfer Status Monitoring',
        'Warehouse Readiness Layer',
        'Supplier Management',
        'Purchase Order Management',
        'Revenue Analytics charts',
        'Ecosystem Analytics',
        'Advanced Security Controls',
        'Multi-Region Management',
        'Regional Performance Tracking',
        'Country-Level Reporting',
        'Premium Audit Center',
        'Advanced Reporting',
        'API Readiness endpoints',
        'Future AI Readiness Layer',
        'Dedicated SLA Manager Team'
      ],
      limitations: [] as string[],
      futureFeatures: [
        'Interactive AI restock forecasting agent (Sandbox ready)'
      ],
      enableFutureFeatures: true
    }
  };

  // Feature Comparison Matrix Category Configuration
  const MATRIX_CATEGORIES = [
    {
      title: "Core Operations & POS",
      items: [
        { name: "Inventory Management & Expiry Alerts", basic: true, standard: true, premium: true },
        { name: "POS Sales Management", basic: true, standard: true, premium: true },
        { name: "Customer Management & History", basic: true, standard: true, premium: true },
        { name: "Country of Origin Tracking", basic: true, standard: true, premium: true },
        { name: "Bin Card Audit Ledger", basic: true, standard: true, premium: true },
        { name: "Purchase & Dispensing Conversion Factors", basic: true, standard: true, premium: true },
        { name: "Barcode Scanner & Printer Support", basic: true, standard: true, premium: true },
      ]
    },
    {
      title: "Branches, Outlets & Collaboration",
      items: [
        { name: "Multi-branch Network Registry", basic: false, standard: true, premium: true },
        { name: "Branch Creation, Controls & Delete", basic: false, standard: true, premium: true },
        { name: "Branch Performance Analytics Panels", basic: false, standard: true, premium: true },
        { name: "Branch Inventory Live Visibility", basic: false, standard: true, premium: true },
        { name: "User Accounts & Audit Trails", basic: false, standard: true, premium: true },
        { name: "Branch Stock Transfers Workflow", basic: false, standard: false, premium: true },
        { name: "Automatic Unified TRF Transfer IDs", basic: false, standard: false, premium: true },
        { name: "Branch Transfer Audit logs", basic: false, standard: false, premium: true },
      ]
    },
    {
      title: "Premium Controls & AI Innovation",
      items: [
        { name: "Warehouse Ledger Management", basic: false, standard: false, premium: true },
        { name: "Supplier Performance, Lead-Time & Licensing", basic: false, standard: false, premium: true },
        { name: "Regional & Cross-Country Reporting", basic: false, standard: false, premium: true },
        { name: "Premium Multi-Zone Performance Logs", basic: false, standard: false, premium: true },
        { name: "API Access & Unified External Ledger", basic: false, standard: false, premium: true },
        { name: "Future AI Forecasting Engine Layer", basic: false, standard: false, premium: "Future Support Active" },
      ]
    }
  ];

  // Merge Custom Admin Settings with Defaults for all 3 subscription plans
  const getDynamicPlan = (planId: 'basic' | 'standard' | 'premium') => {
    const defaultData = DEFAULT_PLANS[planId];
    const customData = settings?.plansCustomize?.[planId];
    return {
      id: planId,
      name: customData?.name || defaultData.name,
      description: customData?.description || defaultData.description,
      recommended: customData?.recommended !== undefined ? customData.recommended : defaultData.recommended,
      features: customData?.features || defaultData.features,
      limitations: customData?.limitations || defaultData.limitations,
      futureFeatures: customData?.futureFeatures || defaultData.futureFeatures,
      enableFutureFeatures: customData?.enableFutureFeatures !== undefined ? customData.enableFutureFeatures : defaultData.enableFutureFeatures
    };
  };

  const plans = [
    getDynamicPlan('basic'),
    getDynamicPlan('standard'),
    getDynamicPlan('premium')
  ];

  // Obtain dynamic billing calculations for currently selected plan
  const billingDetails = getSubscriptionCost(user, settings, branchesCount);

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
      // Renew calculations interactive with active cycle discount
      let finalMultiplier = billingCycle === 'annual' ? 0.8 : 1.0;
      const expiryDate = Math.max(user.subscriptionExpiryDate || Date.now(), Date.now()) + (renewalMonths * 30 * 24 * 60 * 60 * 1000);
      
      await updateDoc(doc(db, 'users', user.uid), {
        subscriptionExpiryDate: expiryDate,
        subscriptionStatus: 'active',
        lastSubscriptionPaymentDate: Date.now()
      });
      
      toast.success(`Successfully renewed SaaS for ${renewalMonths} month(s) with ${billingCycle} billing rate!`);
    } catch (error) {
      toast.error('Renewal failed');
    } finally {
      setIsRenewing(false);
    }
  };

  const daysRemaining = user.subscriptionExpiryDate 
    ? Math.ceil((user.subscriptionExpiryDate - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  // Custom visual plan display details mapping for current billing cycles:
  const getCycleCost = (baseMonthPrice: number) => {
    if (billingCycle === 'annual') {
      return Math.round(baseMonthPrice * 0.8);
    }
    return baseMonthPrice;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <div className="mb-2 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('subscription')} Plans Registry</h1>
          <p className="text-slate-500 dark:text-slate-400 font-sans text-sm mt-1">
            Manage your high-fidelity multi-branch subscription plan feature sets, pricing tables, and invoice history.
          </p>
        </div>
        {user.subscriptionExpiryDate && (
          <div className={`px-4 py-2 rounded-xl text-xs font-bold ${daysRemaining <= 3 ? 'bg-red-50 text-red-650' : 'bg-green-50 text-green-650'}`}>
            {daysRemaining <= 0 ? 'Expired' : `${daysRemaining} Days Standing Remaining`}
          </div>
        )}
      </div>

      {/* Dynamic Client Billing Details Highlight Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="w-full relative z-10">
            <p className="text-blue-200 font-medium mb-1 uppercase tracking-wider text-[10px]">{t('current_plan')}</p>
            <h2 className="text-4xl font-black uppercase mb-3 flex items-center gap-3">
              {plans.find(p => p.id === (user.subscriptionType || 'basic'))?.name || user.subscriptionType || 'Basic'} 
              <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full border border-white/20 lowercase">active</span>
            </h2>
            
            <div className="space-y-2 border-t border-white/10 pt-4 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-blue-100">Core Subscription Base Price:</span>
                <span className="font-bold">{billingDetails.basePrice.toLocaleString()} {billingDetails.currency}/mo</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-100">Additional Branches ({billingDetails.additionalBranches} active):</span>
                <span className="font-bold">+{billingDetails.additionalCharges.toLocaleString()} {billingDetails.currency}/mo</span>
              </div>
              {billingDetails.totalDiscountPercent > 0 && (
                <div className="flex justify-between text-sm text-pink-300 font-bold">
                  <span>SaaS Special Discount & Promo Applied:</span>
                  <span>-{billingDetails.totalDiscountPercent}%</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black border-t border-white/10 pt-2 text-white">
                <span>Total Charge (Price):</span>
                <span>{billingDetails.totalCost.toLocaleString()} {billingDetails.currency}/mo</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold capitalize">
                Status: {user.subscriptionStatus || 'Active'}
              </span>
              {user.subscriptionExpiryDate && (
                <span className="text-blue-100 text-xs font-semibold">
                  Valid Until: {format(new Date(user.subscriptionExpiryDate), 'MMM dd, yyyy')}
                </span>
              )}
            </div>
          </div>
          {user.pendingSubscriptionType && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl md:max-w-xs shrink-0 z-10">
              <p className="text-xs font-bold flex items-center gap-2 text-amber-200">
                <AlertTriangle size={18} />
                Upgrade Request pending Approval
              </p>
              <p className="text-[10px] text-slate-100 mt-1.5 font-sans">
                You have requested upgrade to <span className="uppercase font-bold">{user.pendingSubscriptionType}</span>. Access will activate once verified by Super Admin.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="text-blue-600" size={18} /> Instant billing renewal
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 mt-1">Extend subscription validity parameters.</p>
            
            <div className="space-y-4 mb-6 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase">Renewal Duration</span>
                <select 
                  value={renewalMonths} 
                  onChange={(e) => setRenewalMonths(parseInt(e.target.value))}
                  className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-1.5 font-bold text-xs focus:ring-2 focus:ring-blue-500 cursor-pointer text-slate-800 dark:text-white"
                >
                  {[1, 3, 6, 12].map(m => (
                    <option key={m} value={m}>{m} Month{m > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-2 text-xs">
                <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-1.5">
                  <span className="font-extrabold text-slate-500 uppercase">Total Price</span>
                  <span className="font-black text-slate-900 dark:text-white text-base">
                    {(billingDetails.totalCost * renewalMonths).toLocaleString()} {billingDetails.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleRenew}
            disabled={isRenewing}
            className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white py-3 rounded-2xl font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isRenewing ? <Clock className="animate-spin" size={16} /> : <Zap size={16} />}
            {isRenewing ? 'Renewing Account State...' : 'Commit Renew Now'}
          </button>
        </div>
      </div>

      {/* Billing Cycle Interactive Control Toggles */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-col items-center space-y-2">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Choose Billing Commitment</p>
          <div className="flex justify-center items-center gap-4 bg-slate-100 dark:bg-slate-850 p-1.5 rounded-full border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${billingCycle === 'monthly' ? 'bg-white dark:bg-slate-900 shadow-md text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${billingCycle === 'annual' ? 'bg-white dark:bg-slate-900 shadow-md text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
            >
              Annual Billing 
              <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[9px] px-2 py-0.5 rounded-full font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Plan Cards Display Rendering */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {plans.map((plan) => {
          // Dynamic calculation relative to plan target
          const planCostDetails = getSubscriptionCost({
            ...user,
            subscriptionType: plan.id as any
          }, settings, branchesCount);

          const monthlyCost = planCostDetails.basePrice;
          const calculatedBaseCost = getCycleCost(monthlyCost);
          const computedTotalRate = getCycleCost(planCostDetails.totalCost);
          const computedBranchFee = getCycleCost(planCostDetails.additionalBranchFee);

          return (
            <div 
              key={plan.id} 
              className={`bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 transition-all flex flex-col relative ${
                user.subscriptionType === plan.id 
                  ? 'border-blue-600 dark:border-blue-500 shadow-xl scale-[1.01]' 
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[9px] font-black tracking-widest uppercase px-3.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <Sparkles size={10} /> Highly Recommended
                </div>
              )}

              {user.subscriptionType === plan.id && (
                <div className="absolute top-4 right-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-extrabold text-[9px] uppercase px-2.5 py-0.5 rounded border border-emerald-500/20">
                  Current Active Plan
                </div>
              )}

              <div className="mb-6 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ATech Tier Option</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase leading-none">{plan.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[32px] line-clamp-3 leading-relaxed mt-1">
                  {plan.description}
                </p>
                
                {/* Dynamically Calibrated Target Pricing Output */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{computedTotalRate.toLocaleString()}</span>
                    <span className="text-xs text-slate-450 text-slate-500 font-bold uppercase">{planCostDetails.currency}/mo</span>
                  </div>
                  {billingCycle === 'annual' && (
                    <p className="text-[10px] text-emerald-600 font-bold">
                      Calculated discount rate billed annually: {(computedTotalRate * 12).toLocaleString()} {planCostDetails.currency}/yr
                    </p>
                  )}
                </div>
              </div>

              {/* Dynamic Branch Pricing Context display box */}
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs mb-6 space-y-1.5 leading-snug text-slate-500 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Base HQ License:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    {calculatedBaseCost.toLocaleString()} {planCostDetails.currency}/mo
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Additional Outlets:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    +{computedBranchFee.toLocaleString()} {planCostDetails.currency}/mo per branch
                  </span>
                </div>
                <div className="flex justify-between font-bold text-blue-650 bg-blue-50/50 dark:bg-blue-950/20 px-1.5 py-0.5 rounded text-[10px]">
                  <span>Estimate for your {branchesCount} branches:</span>
                  <span>{computedTotalRate.toLocaleString()} {planCostDetails.currency}</span>
                </div>
              </div>

              {/* Included and limitations core list */}
              <div className="flex-1 space-y-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Included Capabilities</p>
                  <ul className="space-y-2.5">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-slate-700 dark:text-slate-350 text-xs font-medium">
                        <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" /> <span className="line-clamp-2">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.limitations && plan.limitations.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black text-red-500 dark:text-red-400 uppercase tracking-widest mb-3">Limitations</p>
                    <ul className="space-y-2.5 bg-red-50/30 dark:bg-red-950/10 p-3 rounded-2xl border border-red-100 dark:border-red-950/30">
                      {plan.limitations.map((lim, i) => (
                        <li key={i} className="flex items-start gap-2 text-red-700 dark:text-red-400 text-xs font-semibold leading-tight">
                          <XCircle size={13} className="text-red-400 mt-0.5 shrink-0" /> <span>{lim}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Future Feature Sandbox display indicators */}
                {plan.futureFeatures && plan.futureFeatures.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-2.5">
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-wider">Future Releases</p>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${plan.enableFutureFeatures ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>
                        {plan.enableFutureFeatures ? 'Sandbox Enabled' : 'Sandbox Deactivated'}
                      </span>
                    </div>
                    <ul className="space-y-2 bg-gradient-to-r from-blue-50/20 to-indigo-50/20 dark:from-slate-800/10 dark:to-slate-800/20 p-3 rounded-2xl border border-dashed border-blue-200 dark:border-slate-800">
                      {plan.futureFeatures.map((ff, i) => (
                        <li key={i} className="flex items-center gap-2 text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> {ff}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-805">
                <button 
                  disabled={user.subscriptionType === plan.id || user.pendingSubscriptionType === plan.id}
                  onClick={() => handleRequestUpgrade(plan.id)}
                  className={`w-full py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                    user.subscriptionType === plan.id 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-default' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl active:scale-[0.98] disabled:opacity-50'
                  }`}
                >
                  {user.subscriptionType === plan.id 
                    ? 'Active Core Option' 
                    : user.pendingSubscriptionType === plan.id 
                      ? 'Requested - Pending Verification' 
                      : `Request Selected Level`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Matrix Grid Sheet */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-[2rem] p-8 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="text-blue-600" size={18} /> Plan Capability Matrix Index
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Direct capability map highlighting specific differences between the ATech levels.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-850/50">
                <th className="py-3 px-4">Detailed Capability Specification</th>
                <th className="py-3 px-4 text-center">Basic Plan</th>
                <th className="py-3 px-4 text-center">Professional</th>
                <th className="py-3 px-4 text-center">Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-sans text-xs">
              {MATRIX_CATEGORIES.map((cat, ci) => (
                <React.Fragment key={ci}>
                  <tr className="bg-slate-100/50 dark:bg-slate-800/10 font-black text-slate-800 dark:text-slate-300">
                    <td colSpan={4} className="py-2.5 px-4 text-[10px] uppercase text-blue-650 tracking-wider">
                      {cat.title}
                    </td>
                  </tr>
                  {cat.items.map((item, ii) => (
                    <tr key={ii} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/5 transition-all">
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {item.name}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {typeof item.basic === 'boolean' ? (
                          item.basic ? (
                            <Check className="mx-auto text-green-500 font-bold" size={16} />
                          ) : (
                            <X className="mx-auto text-slate-300" size={14} />
                          )
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500">{item.basic}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center bg-blue-50/10 dark:bg-blue-950/5">
                        {typeof item.standard === 'boolean' ? (
                          item.standard ? (
                            <Check className="mx-auto text-green-500 font-bold" size={16} />
                          ) : (
                            <X className="mx-auto text-slate-300" size={14} />
                          )
                        ) : (
                          <span className="text-[10px] font-bold text-blue-600">{item.standard}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {typeof item.premium === 'boolean' ? (
                          item.premium ? (
                            <Check className="mx-auto text-emerald-500 font-bold" size={16} />
                          ) : (
                            <X className="mx-auto text-slate-300" size={14} />
                          )
                        ) : (
                          <span className="text-[10px] bg-indigo-50 dark:bg-slate-800 px-2 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-black">{item.premium}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      {/* SaaS Invoice History Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
            <CreditCard size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Subscription Billing & Invoices</h3>
            <p className="text-xs text-slate-500 dark:text-slate-405 font-sans">Dynamic system ledger for your active branch subscription levels.</p>
          </div>
        </div>
        
        {loadingInvoices ? (
          <div className="py-8 flex justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : invoices.length === 0 ? (
          <div className="py-12 text-center">
            <CreditCard size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3 animate-pulse" />
            <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No active invoices registered for this account.</p>
            <p className="text-xs text-slate-400 mt-1">Ledgers appear automatically when branches are synced.</p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 uppercase tracking-widest font-extrabold">
                  <th className="py-4">Invoice ID</th>
                  <th className="py-4">Billing Month</th>
                  <th className="py-4">SaaS Base Price</th>
                  <th className="py-4">Additional Branches</th>
                  <th className="py-4 font-black">Total Price</th>
                  <th className="py-4">Status</th>
                  <th className="py-4">Settle/Paid On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {invoices.map((inv) => {
                  const sub = inv.subtotal ?? (inv.vatAmount ? inv.totalAmount - inv.vatAmount : inv.totalAmount / 1.15);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="py-4 font-mono text-[10px] text-slate-500 dark:text-slate-400">{inv.id}</td>
                      <td className="py-4 font-bold text-slate-800 dark:text-slate-200">{inv.billingPeriod}</td>
                      <td className="py-4 text-slate-500 dark:text-slate-400">{inv.basePrice.toLocaleString()} {inv.currency}</td>
                      <td className="py-4 text-slate-500 dark:text-slate-400">{inv.additionalBranchesCount} branches (+{inv.additionalBranchFee} {inv.currency}/ea)</td>
                      <td className="py-4 font-black text-slate-900 dark:text-white">{sub.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {inv.currency}</td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg ${
                          inv.status === 'paid' ? 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-4 text-slate-400">
                        {new Date(inv.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
  );
};
