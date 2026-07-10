import { UserProfile, SystemSettings } from '../types';

export interface FeatureDefinition {
  id: string;
  name: string;
  category: 'core' | 'advanced' | 'enterprise';
  description: string;
}

export const FEATURES_LIST: FeatureDefinition[] = [
  // Core Tabs
  { id: 'dashboard', name: 'Dashboard Analytics', category: 'core', description: 'Interactive overview of sales, inventory counts, and branch overview.' },
  { id: 'inventory', name: 'Inventory Management', category: 'core', description: 'Standard product catalog, batch records, units of purchase & conversion.' },
  { id: 'sales', name: 'Sales & POS Screen', category: 'core', description: 'Point of sale, checkouts, receipt printing, and daily cashier lists.' },
  { id: 'customers', name: 'Customer Accounts', category: 'core', description: 'Patient records, basic contact information, and customer lists.' },
  { id: 'bincard', name: 'Bin Card Reports', category: 'core', description: 'In-depth audit history of specific stock bin card ledger transactions.' },
  { id: 'expiry', name: 'Expiry Tracking', category: 'core', description: 'Automated monitoring of approaching expiration dates across inventory.' },
  { id: 'forecasting', name: 'Interactive Forecasting', category: 'core', description: 'Predict future stock levels and restock schedules based on historical data.' },
  { id: 'procurement', name: 'Procurement (PR & PO)', category: 'core', description: 'Purchase requisition and official purchase order workflows.' },
  { id: 'subscription', name: 'Subscription & Billing', category: 'core', description: 'Access plan details, renew cycles, and load invoice logs.' },
  { id: 'notifications', name: 'Alert Central', category: 'core', description: 'Dynamic in-app alerts on low stock, expiry, and system updates.' },
  { id: 'settings', name: 'System Settings', category: 'core', description: 'Basic workspace metadata, details, and customization options.' },
  
  // Advanced Roles & Tabs
  { id: 'staff', name: 'User & Staff Management', category: 'advanced', description: 'Invite internal employees, manage roles, and customize staff permission access.' },
  { id: 'branches', name: 'Branch Management', category: 'advanced', description: 'Register, edit, and audit distinct pharmacy outlet branches.' },
  { id: 'warehouses', name: 'Central Warehouses', category: 'advanced', description: 'Log central depot locations to oversee stock storage distribution.' },
  { id: 'marketplace', name: 'B2B Importer Marketplace', category: 'advanced', description: 'Browse and order inventory directly from certified importing partners.' },
  { id: 'orders', name: 'B2B Order Tracking', category: 'advanced', description: 'Real-time overview of inbound and outbound commercial shipments.' },
  
  // Enterprise Exclusive Tabs
  { id: 'suppliers', name: 'Supplier Management ledger', category: 'enterprise', description: 'Consolidated ratings, performance scorecards, and historical ledgers of B2B sellers.' },

  // Sub-Features
  { id: 'branch_creation_deletion', name: 'Branch Creation & Deletion', category: 'advanced', description: 'Unlocking capability to actively register or permanently terminate branch outlets.' },
  { id: 'customer_discounts', name: 'Customer Loyalty Discounts', category: 'advanced', description: 'Configure custom percentage discount levels per patient or customer.' },
  { id: 'batch_aware_pos', name: 'Batch-Aware POS Selection', category: 'advanced', description: 'Manually choose precise production batches on the sales checkout screen.' },
  { id: 'fefo_recommendations', name: 'FEFO Recommendations', category: 'advanced', description: 'Automated advice recommending earliest-expiring inventory batches first.' },
  { id: 'audit_logs', name: 'Daily Activity Audit Tracker', category: 'advanced', description: 'Review security actions and administrative event logs.' },
  { id: 'advanced_inventory_reports', name: 'Advanced Comparative Reports', category: 'advanced', description: 'Filter or download stock flow reports grouped by branch, supplier, or category.' },
  
  // Enterprise Actions
  { id: 'branch_stock_transfers', name: 'Branch-to-Branch Transfers', category: 'enterprise', description: 'Redistribute stock directly between registered physical branch outlets.' },
  { id: 'transfer_tracking_workflow', name: 'Transfer & Flow Approvals', category: 'enterprise', description: 'Enforce workflow check points for inventory transfers (TRF-YYYY-XXXXX).' },
  { id: 'revenue_analytics', name: 'Multi-Branch Revenue Analytics', category: 'enterprise', description: 'Interactive visual financial charts analyzing revenue and cost multipliers.' },
  { id: 'multi_region', name: 'Multi-Region & Country Reports', category: 'enterprise', description: 'Group dashboard performance filters by administrative regional zone or country.' },
  { id: 'enterprise_audit_center', name: 'Global Enterprise Audit Control', category: 'enterprise', description: 'Central governance dashboard for high-volume corporate administrative oversight.' }
];

export const DEFAULT_PLAN_FEATURES: Record<'basic' | 'standard' | 'premium', string[]> = {
  basic: [
    'dashboard', 'inventory', 'sales', 'customers', 'bincard', 'expiry', 'forecasting', 
    'procurement', 'subscription', 'notifications', 'settings', 'suppliers'
  ],
  standard: [
    'dashboard', 'inventory', 'sales', 'customers', 'bincard', 'expiry', 'forecasting', 
    'procurement', 'subscription', 'notifications', 'settings',
    'staff', 'branches', 'warehouses', 'marketplace', 'orders', 'suppliers',
    'branch_creation_deletion', 'customer_discounts', 'batch_aware_pos', 'fefo_recommendations', 
    'audit_logs', 'advanced_inventory_reports'
  ],
  premium: [
    'dashboard', 'inventory', 'sales', 'customers', 'bincard', 'expiry', 'forecasting', 
    'procurement', 'subscription', 'notifications', 'settings',
    'staff', 'branches', 'warehouses', 'marketplace', 'orders',
    'suppliers',
    'branch_creation_deletion', 'customer_discounts', 'batch_aware_pos', 'fefo_recommendations', 
    'audit_logs', 'advanced_inventory_reports',
    'branch_stock_transfers', 'transfer_tracking_workflow', 'revenue_analytics', 'multi_region', 
    'enterprise_audit_center'
  ]
};

/**
 * Core validation gate checking if a given user/profile qualifies on a specific feature
 */
export const hasFeature = (
  profile: UserProfile | null,
  featureId: string,
  settings: SystemSettings | null
): boolean => {
  if (!profile) return false;
  
  // Super admin bypasses all locks
  if (profile.role === 'admin') return true;

  // Importers always have access to their base set
  if (profile.role === 'importer') {
    const importerBase = [
      'dashboard', 'my-products', 'customers', 'orders', 'suppliers', 'warehouses', 
      'deliveries', 'advertising', 'reports', 'analytics', 'staff', 'subscription', 
      'settings', 'notifications'
    ];
    return importerBase.includes(featureId);
  }

  // Distributors always have access to their base set
  if (profile.role === 'distributor') {
    const distributorBase = [
      'dashboard', 'my-products', 'orders', 'warehouses', 'deliveries', 
      'advertising', 'reports', 'analytics', 'staff', 'subscription', 'settings', 
      'notifications'
    ];
    return distributorBase.includes(featureId);
  }

  // Get current pharmacy/staff plan
  const rawPlan = (profile.subscriptionType || 'basic') as string;
  const rawPlanLower = rawPlan.toLowerCase();
  const plan: 'basic' | 'standard' | 'premium' = 
    rawPlanLower.includes('premium') || rawPlanLower.includes('enterprise') ? 'premium' : 
    rawPlanLower.includes('standard') || rawPlanLower.includes('professional') || rawPlanLower.includes('pro') ? 'standard' : 'basic';

  // Baseline standard features for this plan tier
  const baselineFeatures = DEFAULT_PLAN_FEATURES[plan];

  // Try to load any customization from system settings
  let allowedFeatures = baselineFeatures;
  if (settings?.plansCustomize?.[plan]?.functionalFeatures && settings.plansCustomize[plan].functionalFeatures.length > 0) {
    allowedFeatures = settings.plansCustomize[plan].functionalFeatures;
  } else if (settings?.plansCustomize?.[plan]?.features) {
    // If customized features have explicit functional codes (e.g. 'branches'), use them
    const functionalKeys = settings.plansCustomize[plan].features.filter((f: string) => 
      DEFAULT_PLAN_FEATURES.basic.includes(f) || 
      DEFAULT_PLAN_FEATURES.standard.includes(f) || 
      DEFAULT_PLAN_FEATURES.premium.includes(f)
    );
    if (functionalKeys.length > 0) {
      allowedFeatures = functionalKeys;
    }
  }

  // The feature is allowed if it is in the customized list OR part of the hardcoded baseline tier list
  // (guaranteeing that paid tiers like standard/premium never lose access to their core suite)
  return allowedFeatures.includes(featureId) || baselineFeatures.includes(featureId);
};

/**
 * Gets user-friendly upgrade path text
 */
export const getUpgradeRequirementLabel = (featureId: string): string => {
  for (const planId of ['standard', 'premium'] as const) {
    if (DEFAULT_PLAN_FEATURES[planId].includes(featureId)) {
      return planId === 'standard' ? 'Professional (Standard)' : 'Premium';
    }
  }
  return 'Premium';
};
