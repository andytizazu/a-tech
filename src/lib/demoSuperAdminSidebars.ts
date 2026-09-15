// High-fidelity demonstration datasets for Super Admin Console sidebars
// Designed for ATECH East Africa Pharmaceutical Command Center

export interface SystemVitalService {
  name: string;
  category: string;
  region: string;
  status: 'operational' | 'degraded' | 'maintenance';
  uptime: string;
  latencyMs: number;
  lastChecked: string;
}

export interface SecurityIncident {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  title: string;
  source: string;
  target: string;
  ip: string;
  location: string;
  targetAccount: string;
  status: 'blocked' | 'mitigated' | 'investigating' | 'resolved';
  timestamp: string;
  description: string;
}

export interface RbacRoleDefinition {
  role: string;
  roleKey: string;
  name: string;
  title: string;
  activeUsers: number;
  assignedCount: number;
  mfaMandatory: boolean;
  sessionTimeout: string;
  permissionsCount: number;
  scope: string;
  description: string;
  permissions: string[];
  badgeColor: string;
}

export interface CountryPerformanceMetric {
  name: string;
  code: string;
  currency: string;
  currencySymbol: string;
  usdExchangeRate: number;
  exchangeRateToUsd: number;
  regulatoryBody: string;
  pharmacies: number;
  totalPharmacies: number;
  wholesalers: number;
  totalWholesalers: number;
  b2bVolumeEtb: number;
  monthlyVolumeEtb: number;
  growth: string;
  regionalManagers: number;
  activeDistributors: number;
  complianceScore: number;
  flag: string;
}

export interface RegionalTerritoryData {
  id: string;
  name: string;
  regionName: string;
  country: string;
  managerName: string;
  directorName: string;
  managerPhone: string;
  pharmaciesCount: number;
  wholesalersCount: number;
  revenue30d: number;
  monthlyRevenueEtb: number;
  quotaTarget: number;
  quotaAchievement: number;
  quotaPercent: number;
  fefoRiskIndex: 'Low' | 'Moderate' | 'High';
  fefoRiskScore: number;
  auditsCompleted: number;
  activeVisits: number;
}

export interface ExtendedSupportTicket {
  id: string;
  organizationName: string;
  orgRole: 'pharmacy' | 'importer' | 'distributor';
  title: string;
  category: 'Billing & Payments' | 'API & Integration' | 'Regulatory & Licensing' | 'POS & Inventory' | 'Account & MFA';
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo: string;
  slaMinutesRemaining: number;
  createdAt: string;
  description: string;
  resolutionNotes?: string;
}

export interface BroadcastHistoryItem {
  id: string;
  title: string;
  category: 'Emergency Regulatory' | 'System Maintenance' | 'Commercial & Pricing' | 'Feature Update';
  targetAudience: string;
  recipientCount: number;
  readRate: string;
  channels: string[];
  sentAt: string;
  sender: string;
  priority: 'urgent' | 'high' | 'normal';
}

export interface ExtendedDistributor {
  id: string;
  companyName: string;
  licenseNumber: string;
  country: string;
  city: string;
  fleetVans: number;
  fleetBikes: number;
  refrigeratedVans: number;
  coverageZones: string[];
  primaryWarehouse: string;
  rating: number;
  onTimeRate: string;
  contactPerson: string;
  contactPhone: string;
  status: 'active' | 'pending' | 'review';
}

export interface LiveDispatch {
  trackingId: string;
  distributorName: string;
  originHub: string;
  destinationPharmacy: string;
  itemsSummary: string;
  batchNumber: string;
  temperatureReading: string;
  temperatureStatus: 'normal' | 'warning' | 'alert';
  carrierDriver: string;
  eta: string;
  status: 'Dispatched' | 'In Transit' | 'Out for Delivery' | 'Delivered';
}

export interface ExtendedWarehouse {
  id: string;
  name: string;
  code: string;
  country: string;
  city: string;
  address: string;
  totalFootprintSqFt: number;
  occupiedPercent: number;
  valuationEtb: number;
  ambientCapacity: string;
  coldChainCapacity: string;
  temperatureRanges: string;
  manager: string;
  phone: string;
  complianceCert: string;
  status: 'operational' | 'near_capacity' | 'maintenance';
}

export interface WarehouseTransferItem {
  id: string;
  transferCode: string;
  medicineName: string;
  batchNumber: string;
  units: number;
  originDepot: string;
  destinationDepot: string;
  dispatchedAt: string;
  status: 'In Transit' | 'Received & Verified' | 'Preparing Dispatch';
}

export interface AiDemandSurgeAlert {
  id: string;
  therapeuticCategory: string;
  projectedSurgePercent: number;
  affectedRegions: string[];
  primaryDriver: string;
  recommendedBufferUnits: number;
  confidenceScore: number;
  severity: 'high' | 'medium' | 'elevated';
}

export interface AiRestockRecommendation {
  id: string;
  medicineName: string;
  category: string;
  networkCurrentStock: number;
  recommendedOrderUnits: number;
  bufferDaysAvailable: number;
  velocity30d: number;
  primarySupplier: string;
  estimatedCostEtb: number;
}

// 1. SYSTEM VITALS & HEALTH DATA
export const DEMO_SYSTEM_SERVICES: SystemVitalService[] = [
  { name: 'Core Cloud Run API Cluster', category: 'Compute', region: 'europe-west2', status: 'operational', uptime: '99.99%', latencyMs: 14, lastChecked: '15s ago' },
  { name: 'Firestore Multi-Region DB', category: 'Database', region: 'eur3 (Dual-Region)', status: 'operational', uptime: '100.0%', latencyMs: 18, lastChecked: '10s ago' },
  { name: 'Redis Cache & Session Store', category: 'In-Memory Cache', region: 'europe-west2', status: 'operational', uptime: '99.98%', latencyMs: 4, lastChecked: '5s ago' },
  { name: 'Cloud Storage Media & Files Bucket', category: 'Object Storage', region: 'Multi-Region EU', status: 'operational', uptime: '100.0%', latencyMs: 32, lastChecked: '1m ago' },
  { name: 'Ethio Telecom & Safaricom SMS Gateway', category: 'Telecom Bridge', region: 'Addis Ababa', status: 'operational', uptime: '99.85%', latencyMs: 145, lastChecked: '30s ago' },
  { name: 'EFDA Regulatory Verification Pipeline', category: 'Regulatory API', region: 'National Gateway', status: 'operational', uptime: '99.40%', latencyMs: 210, lastChecked: '2m ago' },
  { name: 'Background Cron & Expiry Workers', category: 'Task Queue', region: 'Managed Cloud Tasks', status: 'operational', uptime: '100.0%', latencyMs: 8, lastChecked: '20s ago' },
  { name: 'Real-time WebSocket Push Relay', category: 'Socket Daemon', region: 'europe-west2', status: 'operational', uptime: '99.95%', latencyMs: 12, lastChecked: '12s ago' }
];

export const DEMO_HOURLY_LATENCY = [
  { hour: '00:00', p50: 12, p95: 28, p99: 45, throughput: 1420 },
  { hour: '03:00', p50: 10, p95: 22, p99: 38, throughput: 890 },
  { hour: '06:00', p50: 14, p95: 32, p99: 52, throughput: 2100 },
  { hour: '09:00', p50: 18, p95: 42, p99: 68, throughput: 4650 },
  { hour: '12:00', p50: 22, p95: 56, p99: 88, throughput: 6120 },
  { hour: '15:00', p50: 19, p95: 48, p99: 74, throughput: 5890 },
  { hour: '18:00', p50: 16, p95: 38, p99: 62, throughput: 4200 },
  { hour: '21:00', p50: 13, p95: 30, p99: 48, throughput: 2840 }
];

export const DEMO_SCHEDULED_CRONS = [
  { name: 'SaaS Subscription Expiry & Renewal Daemon', schedule: 'Every 24h at 00:00 UTC', lastRun: '4h 12m ago', duration: '1.4s', status: 'Success (0 errors, 4 notices queued)' },
  { name: 'FEFO Batch Expiration Alert Dispatcher', schedule: 'Every 12h at 06:00 & 18:00', lastRun: '2h 45m ago', duration: '3.2s', status: 'Success (18 pharmacy alerts dispatched)' },
  { name: 'Enterprise Inventory Valuation Re-index', schedule: 'Every 6h', lastRun: '1h 15m ago', duration: '8.6s', status: 'Success (Indexed 1,256 master SKUs)' },
  { name: 'Multi-Region Cloud Snapshot & Cold Backup', schedule: 'Daily at 02:00 UTC', lastRun: '6h 30m ago', duration: '42.1s', status: 'Success (Verified RPO: 15m, RTO: 4m)' },
  { name: 'Geo-IP Anomaly & Intrusion Log Scrubber', schedule: 'Every 1h', lastRun: '28m ago', duration: '0.8s', status: 'Success (14 flagged IPs quarantined)' }
];

// 2. SECURITY OPERATIONS CENTER (SOC) DATA
export const DEMO_SECOPS_INCIDENTS: SecurityIncident[] = [
  { id: 'SEC-4091', severity: 'high', type: 'Credential Spraying Attack Throttled', title: 'Credential Spraying Attack Throttled', source: '196.188.42.18 (Addis Bole)', target: 'api/v1/auth/session', ip: '196.188.42.18', location: 'Addis Ababa (Bole)', targetAccount: 'api/v1/auth/session', status: 'blocked', timestamp: '12 min ago', description: 'Repeated unauthorized login attempts across 12 pharmacy endpoints; IP auto-banned for 24h.' },
  { id: 'SEC-4088', severity: 'medium', type: 'Geo-Fencing Travel Discrepancy', title: 'Geo-Fencing Travel Discrepancy', source: '105.163.14.92 (Nairobi)', target: 'yohannes@unitypharmacy.et', ip: '105.163.14.92', location: 'Nairobi, Kenya', targetAccount: 'yohannes@unitypharmacy.et', status: 'mitigated', timestamp: '1 hour ago', description: 'Account accessed outside standard Addis Ababa radius; triggered step-up SMS OTP authentication.' },
  { id: 'SEC-4082', severity: 'low', type: 'Privileged Role Elevation Audited', title: 'Privileged Role Elevation Audited', source: '197.156.78.210 (Kirkos)', target: 'superadmin@atech.et', ip: '197.156.78.210', location: 'Addis Ababa (Kirkos)', targetAccount: 'superadmin@atech.et', status: 'resolved', timestamp: '3 hours ago', description: 'Super Administrator granted temporary billing override permission; signed with hardware token.' },
  { id: 'SEC-4079', severity: 'critical', type: 'Database Injection Pattern Filtered', title: 'Database Injection Pattern Filtered', source: '185.220.101.5 (Proxy)', target: 'public-search-endpoint', ip: '185.220.101.5', location: 'Frankfurt (VPN Proxy)', targetAccount: 'public-search-endpoint', status: 'blocked', timestamp: '5 hours ago', description: 'Cloud Armor WAF dropped malicious SQL/NoSQL injection payload; 0 bytes persisted.' },
  { id: 'SEC-4074', severity: 'low', type: 'Batch File Upload Anti-Virus Scan', title: 'Batch File Upload Anti-Virus Scan', source: '196.189.11.89 (Hawassa)', target: 'hawassacare@pharma.et', ip: '196.189.11.89', location: 'Hawassa, Sidama', targetAccount: 'hawassacare@pharma.et', status: 'resolved', timestamp: '8 hours ago', description: 'Pharmacy license PDF scanned clean via ClamAV and SHA-256 fingerprint verified.' }
];

export const DEMO_RBAC_ROLES: RbacRoleDefinition[] = [
  { role: 'admin', roleKey: 'admin', name: 'Super Administrator', title: 'Super Administrator', activeUsers: 4, assignedCount: 4, mfaMandatory: true, sessionTimeout: '30 Minutes', permissionsCount: 42, scope: 'Full Global Ecosystem Master Controls', description: 'Unrestricted administrative access to all multi-country operations, revenue ledgers, and security modules.', permissions: ['system.all', 'audit.read', 'billing.write', 'users.impersonate', 'compliance.sign'], badgeColor: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20' },
  { role: 'regional_manager', roleKey: 'regional_manager', name: 'Territory Regional Director', title: 'Territory Regional Director', activeUsers: 8, assignedCount: 8, mfaMandatory: true, sessionTimeout: '2 Hours', permissionsCount: 26, scope: 'Jurisdictional State & Quota Delegation', description: 'Oversight across regional pharmacies, wholesale distribution quotas, and on-site EFDA audit certifications.', permissions: ['territory.read', 'pharmacy.audit', 'quota.manage', 'reports.export'], badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20' },
  { role: 'importer', roleKey: 'importer', name: 'Licensed Wholesale Importer', title: 'Licensed Wholesale Importer', activeUsers: 48, assignedCount: 48, mfaMandatory: true, sessionTimeout: '4 Hours', permissionsCount: 20, scope: 'B2B Catalog, Consignments, Ads & Delivery', description: 'Manage bulk pharmaceutical imports, EFDA customs clearance, B2B consignments, and wholesale ordering catalogs.', permissions: ['catalog.publish', 'b2b.consign', 'batch.qc', 'orders.fulfill'], badgeColor: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' },
  { role: 'pharmacy', roleKey: 'pharmacy', name: 'Pharmacy Managing Pharmacist', title: 'Pharmacy Managing Pharmacist', activeUsers: 298, assignedCount: 298, mfaMandatory: false, sessionTimeout: '8 Hours', permissionsCount: 18, scope: 'Local POS, Inventory, Prescriptions & B2B Purchasing', description: 'Operate point-of-sale dispensary, FEFO inventory tracking, digital prescription logs, and B2B wholesale replenishment.', permissions: ['pos.dispense', 'inventory.manage', 'orders.purchase', 'rx.verify'], badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' },
  { role: 'distributor', roleKey: 'distributor', name: 'Logistics Fleet Dispatcher', title: 'Logistics Fleet Dispatcher', activeUsers: 14, assignedCount: 14, mfaMandatory: true, sessionTimeout: '4 Hours', permissionsCount: 14, scope: 'Manifests, Consignments & Proof of Delivery', description: 'Manage refrigerated transport fleet, waypoint telemetry, and electronic proof of delivery verification.', permissions: ['fleet.dispatch', 'coldchain.monitor', 'delivery.confirm'], badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20' },
  { role: 'staff', roleKey: 'staff', name: 'Dispensary Counter Staff', title: 'Dispensary Counter Staff', activeUsers: 642, assignedCount: 642, mfaMandatory: false, sessionTimeout: '8 Hours', permissionsCount: 8, scope: 'Prescription Dispensing & Cash Register Only', description: 'Restricted cashier and pharmacy technician terminal access without inventory restructuring permissions.', permissions: ['pos.checkout', 'barcode.scan'], badgeColor: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/20' },
  { role: 'marketing', roleKey: 'marketing', name: 'Brand & Ads Representative', title: 'Brand & Ads Representative', activeUsers: 12, assignedCount: 12, mfaMandatory: false, sessionTimeout: '4 Hours', permissionsCount: 11, scope: 'Sponsored Banners, Broadcasts & Campaign Analytics', description: 'Configure sponsored pharmaceutical banners, marketing intelligence broadcasts, and supplier promotion feeds.', permissions: ['campaigns.create', 'analytics.view'], badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20' }
];

// 3. MULTI-COUNTRY PERFORMANCE METRICS
export const DEMO_COUNTRY_METRICS: CountryPerformanceMetric[] = [
  { name: 'Ethiopia', code: 'ET', currency: 'ETB', currencySymbol: 'ETB', usdExchangeRate: 124.5, exchangeRateToUsd: 124.5, regulatoryBody: 'EFDA (Ethiopian Food & Drug Authority)', pharmacies: 298, totalPharmacies: 298, wholesalers: 48, totalWholesalers: 48, b2bVolumeEtb: 12480000, monthlyVolumeEtb: 12480000, growth: '+22.4%', regionalManagers: 8, activeDistributors: 12, complianceScore: 98.4, flag: '🇪🇹' },
  { name: 'Kenya', code: 'KE', currency: 'KES', currencySymbol: 'KSh', usdExchangeRate: 129.2, exchangeRateToUsd: 129.2, regulatoryBody: 'PPB (Pharmacy and Poisons Board)', pharmacies: 46, totalPharmacies: 46, wholesalers: 12, totalWholesalers: 12, b2bVolumeEtb: 3840000, monthlyVolumeEtb: 3840000, growth: '+31.8%', regionalManagers: 2, activeDistributors: 6, complianceScore: 96.2, flag: '🇰🇪' },
  { name: 'Uganda', code: 'UG', currency: 'UGX', currencySymbol: 'USh', usdExchangeRate: 3720.0, exchangeRateToUsd: 3720.0, regulatoryBody: 'NDA (National Drug Authority)', pharmacies: 22, totalPharmacies: 22, wholesalers: 6, totalWholesalers: 6, b2bVolumeEtb: 1420000, monthlyVolumeEtb: 1420000, growth: '+18.5%', regionalManagers: 1, activeDistributors: 3, complianceScore: 94.0, flag: '🇺🇬' },
  { name: 'Tanzania', code: 'TZ', currency: 'TZS', currencySymbol: 'TSh', usdExchangeRate: 2610.0, exchangeRateToUsd: 2610.0, regulatoryBody: 'TMDA (Tanzania Medicines & Medical Devices)', pharmacies: 18, totalPharmacies: 18, wholesalers: 5, totalWholesalers: 5, b2bVolumeEtb: 1120000, monthlyVolumeEtb: 1120000, growth: '+15.2%', regionalManagers: 1, activeDistributors: 2, complianceScore: 92.8, flag: '🇹🇿' },
  { name: 'Rwanda', code: 'RW', currency: 'RWF', currencySymbol: 'FRw', usdExchangeRate: 1340.0, exchangeRateToUsd: 1340.0, regulatoryBody: 'Rwanda FDA', pharmacies: 14, totalPharmacies: 14, wholesalers: 4, totalWholesalers: 4, b2bVolumeEtb: 890000, monthlyVolumeEtb: 890000, growth: '+42.0%', regionalManagers: 1, activeDistributors: 2, complianceScore: 99.1, flag: '🇷🇼' },
  { name: 'South Sudan', code: 'SS', currency: 'SSP', currencySymbol: 'SSP', usdExchangeRate: 1540.0, exchangeRateToUsd: 1540.0, regulatoryBody: 'DCMSS (Drug and Food Control Authority)', pharmacies: 8, totalPharmacies: 8, wholesalers: 2, totalWholesalers: 2, b2bVolumeEtb: 450000, monthlyVolumeEtb: 450000, growth: '+12.0%', regionalManagers: 1, activeDistributors: 1, complianceScore: 88.5, flag: '🇸🇸' },
  { name: 'Djibouti', code: 'DJ', currency: 'DJF', currencySymbol: 'Fdj', usdExchangeRate: 177.7, exchangeRateToUsd: 177.7, regulatoryBody: 'Ministry of Health & Pharmacy Directorate', pharmacies: 6, totalPharmacies: 6, wholesalers: 2, totalWholesalers: 2, b2bVolumeEtb: 390000, monthlyVolumeEtb: 390000, growth: '+14.2%', regionalManagers: 1, activeDistributors: 1, complianceScore: 91.0, flag: '🇩🇯' }
];

// 4. REGIONAL TERRITORIES DATA
export const DEMO_REGIONAL_DATA: RegionalTerritoryData[] = [
  { id: 'reg_addis', name: 'Addis Ababa Metropolitan', regionName: 'Addis Ababa Metropolitan', country: 'Ethiopia', managerName: 'Dr. Selamawit Bekele', directorName: 'Dr. Selamawit Bekele', managerPhone: '+251 911 200300', pharmaciesCount: 142, wholesalersCount: 28, revenue30d: 6850000, monthlyRevenueEtb: 6850000, quotaTarget: 6000000, quotaAchievement: 114, quotaPercent: 114, fefoRiskIndex: 'Low', fefoRiskScore: 12, auditsCompleted: 84, activeVisits: 84 },
  { id: 'reg_oromia', name: 'Oromia Region (Adama/Jimma)', regionName: 'Oromia Region (Adama/Jimma)', country: 'Ethiopia', managerName: 'Ato Gemechu Tufa', directorName: 'Ato Gemechu Tufa', managerPhone: '+251 912 345678', pharmaciesCount: 68, wholesalersCount: 8, revenue30d: 2450000, monthlyRevenueEtb: 2450000, quotaTarget: 2200000, quotaAchievement: 111, quotaPercent: 111, fefoRiskIndex: 'Moderate', fefoRiskScore: 24, auditsCompleted: 42, activeVisits: 42 },
  { id: 'reg_amhara', name: 'Amhara Region (Bahir Dar/Gondar)', regionName: 'Amhara Region (Bahir Dar/Gondar)', country: 'Ethiopia', managerName: 'Pharm. Muluken Kassahun', directorName: 'Pharm. Muluken Kassahun', managerPhone: '+251 918 765432', pharmaciesCount: 38, wholesalersCount: 4, revenue30d: 1380000, monthlyRevenueEtb: 1380000, quotaTarget: 1400000, quotaAchievement: 98, quotaPercent: 98, fefoRiskIndex: 'Moderate', fefoRiskScore: 28, auditsCompleted: 28, activeVisits: 28 },
  { id: 'reg_sidama', name: 'Sidama Region (Hawassa/Yirgalem)', regionName: 'Sidama Region (Hawassa/Yirgalem)', country: 'Ethiopia', managerName: 'W/ro Bethlehem Desta', directorName: 'W/ro Bethlehem Desta', managerPhone: '+251 916 554433', pharmaciesCount: 26, wholesalersCount: 3, revenue30d: 980000, monthlyRevenueEtb: 980000, quotaTarget: 900000, quotaAchievement: 108, quotaPercent: 108, fefoRiskIndex: 'Low', fefoRiskScore: 16, auditsCompleted: 19, activeVisits: 19 },
  { id: 'reg_diredawa', name: 'Dire Dawa & Harari Corridor', regionName: 'Dire Dawa & Harari Corridor', country: 'Ethiopia', managerName: 'Ato Ahmed Abdullahi', directorName: 'Ato Ahmed Abdullahi', managerPhone: '+251 925 112233', pharmaciesCount: 16, wholesalersCount: 3, revenue30d: 620000, monthlyRevenueEtb: 620000, quotaTarget: 650000, quotaAchievement: 95, quotaPercent: 95, fefoRiskIndex: 'Low', fefoRiskScore: 14, auditsCompleted: 14, activeVisits: 14 },
  { id: 'reg_tigray', name: 'Tigray Region (Mekelle/Shire)', regionName: 'Tigray Region (Mekelle/Shire)', country: 'Ethiopia', managerName: 'Dr. Hailay Berhe', directorName: 'Dr. Hailay Berhe', managerPhone: '+251 914 998877', pharmaciesCount: 14, wholesalersCount: 2, revenue30d: 480000, monthlyRevenueEtb: 480000, quotaTarget: 500000, quotaAchievement: 96, quotaPercent: 96, fefoRiskIndex: 'High', fefoRiskScore: 36, auditsCompleted: 11, activeVisits: 11 },
  { id: 'reg_nairobi', name: 'Nairobi Central & Industrial County', regionName: 'Nairobi Central & Industrial County', country: 'Kenya', managerName: 'Kevin Mwangi', directorName: 'Kevin Mwangi', managerPhone: '+254 722 889900', pharmaciesCount: 32, wholesalersCount: 9, revenue30d: 2650000, monthlyRevenueEtb: 2650000, quotaTarget: 2400000, quotaAchievement: 110, quotaPercent: 110, fefoRiskIndex: 'Low', fefoRiskScore: 15, auditsCompleted: 36, activeVisits: 36 },
  { id: 'reg_mombasa', name: 'Mombasa Coastal Corridor', regionName: 'Mombasa Coastal Corridor', country: 'Kenya', managerName: 'Amina Hassan', directorName: 'Amina Hassan', managerPhone: '+254 733 445566', pharmaciesCount: 14, wholesalersCount: 3, revenue30d: 1190000, monthlyRevenueEtb: 1190000, quotaTarget: 1100000, quotaAchievement: 108, quotaPercent: 108, fefoRiskIndex: 'Low', fefoRiskScore: 18, auditsCompleted: 16, activeVisits: 16 }
];

// 5. EXTENDED SUPPORT TICKETS
export const DEMO_SUPPORT_TICKETS_LIST: ExtendedSupportTicket[] = [
  {
    id: 'TCK-8812',
    organizationName: 'Addis Care Pharmacy (Bole)',
    orgRole: 'pharmacy',
    title: 'POS Printer & ESC/POS Receipt Alignment Discrepancy',
    category: 'POS & Inventory',
    severity: 'medium',
    status: 'in_progress',
    assignedTo: 'Yared M. (Tier 2 Technical)',
    slaMinutesRemaining: 45,
    createdAt: '42 min ago',
    description: 'When dispensing 5+ items, paper feed cuts off before pharmacist signature line prints.',
    resolutionNotes: 'Configuring CSS page-break margin utility in thermal driver template.'
  },
  {
    id: 'TCK-8809',
    organizationName: 'Cadila Pharma Wholesale Ltd',
    orgRole: 'importer',
    title: 'EFDA Digital Batch Certification Upload Failure (HTTP 502)',
    category: 'Regulatory & Licensing',
    severity: 'critical',
    status: 'open',
    assignedTo: 'Dawit K. (Regulatory Lead)',
    slaMinutesRemaining: 18,
    createdAt: '1 hour ago',
    description: 'Unable to commit importation certificate for Amoxicillin 500mg (Batch CD-2026-99); EFDA customs gateway timeout.',
    resolutionNotes: 'Directing payload to regional backup proxy endpoint.'
  },
  {
    id: 'TCK-8804',
    organizationName: 'Hope Medical Pharmacy',
    orgRole: 'pharmacy',
    title: 'Telebirr QR Code Settlement Auto-Verification Lag',
    category: 'Billing & Payments',
    severity: 'high',
    status: 'open',
    assignedTo: 'Helina T. (FinOps Support)',
    slaMinutesRemaining: 75,
    createdAt: '2 hours ago',
    description: 'Customer scanned and paid 1,450 ETB via Telebirr app; status stayed "Pending Confirmation" for 6 minutes.',
    resolutionNotes: 'Re-syncing webhook event queue with Telebirr gateway worker.'
  },
  {
    id: 'TCK-8798',
    organizationName: 'Bole Family Pharmacy',
    orgRole: 'pharmacy',
    title: 'Request Additional Counter Staff Account for Night Shift',
    category: 'Account & MFA',
    severity: 'low',
    status: 'resolved',
    assignedTo: 'Biniyam A. (Customer Success)',
    slaMinutesRemaining: 0,
    createdAt: '5 hours ago',
    description: 'Need to provision dispenser role for new licensed intern (Pharm. Tigist Hailu) under standard subscription tier.',
    resolutionNotes: 'Provisioned dispenser credentials and emailed one-time onboarding link.'
  },
  {
    id: 'TCK-8792',
    organizationName: 'Abyssinia Cold-Chain Transporters',
    orgRole: 'distributor',
    title: 'IoT Sensor Live Telemetry API Webhook Setup Assistance',
    category: 'API & Integration',
    severity: 'medium',
    status: 'resolved',
    assignedTo: 'Yared M. (Tier 2 Technical)',
    slaMinutesRemaining: 0,
    createdAt: '8 hours ago',
    description: 'Calibrating digital datalogger to send temperature warnings when van cargo temperature exceeds 8.0°C.',
    resolutionNotes: 'Validated JSON payload schema and verified alert triggering threshold.'
  },
  {
    id: 'TCK-8785',
    organizationName: 'Unity Community Pharmacy',
    orgRole: 'pharmacy',
    title: 'SaaS Subscription Extension Verification following Bank Wire Transfer',
    category: 'Billing & Payments',
    severity: 'medium',
    status: 'resolved',
    assignedTo: 'Helina T. (FinOps Support)',
    slaMinutesRemaining: 0,
    createdAt: '1 day ago',
    description: 'Submitted CBE transaction reference #TXN992818 for Annual Premium tier payment.',
    resolutionNotes: 'Reconciled with Commercial Bank of Ethiopia statement; 12 months added to expiry ledger.'
  }
];

// 6. BROADCAST HISTORY
export const DEMO_BROADCAST_FEED: BroadcastHistoryItem[] = [
  {
    id: 'BRD-109',
    title: 'MOH & EFDA National Cold-Chain Storage Directives 2026',
    category: 'Emergency Regulatory',
    targetAudience: 'All Licensed Pharmacies & Wholesalers',
    recipientCount: 346,
    readRate: '98.4%',
    channels: ['In-App Banner', 'SMS Alert', 'Email'],
    sentAt: 'Yesterday, 14:30',
    sender: 'Super Admin Compliance Desk',
    priority: 'urgent'
  },
  {
    id: 'BRD-106',
    title: 'Scheduled Cloud Maintenance: Zero-Downtime Migration Window',
    category: 'System Maintenance',
    targetAudience: 'All System Users',
    recipientCount: 684,
    readRate: '94.2%',
    channels: ['In-App Banner', 'Dashboard Notice'],
    sentAt: '3 days ago',
    sender: 'Ecosystem Engineering Core',
    priority: 'high'
  },
  {
    id: 'BRD-102',
    title: 'Wholesale B2B Ramadan & Spring Season Bulk Purchase Discounts Active',
    category: 'Commercial & Pricing',
    targetAudience: 'All Retail Pharmacies',
    recipientCount: 298,
    readRate: '91.8%',
    channels: ['In-App Feed', 'Marketplace Notification'],
    sentAt: '1 week ago',
    sender: 'Marketing & Commercial Ops',
    priority: 'normal'
  },
  {
    id: 'BRD-098',
    title: 'FEFO Smart Expiry Automation & Batch Ledger Upgrade Released',
    category: 'Feature Update',
    targetAudience: 'Pharmacy Owners & Staff',
    recipientCount: 298,
    readRate: '88.5%',
    channels: ['In-App Interactive Modal', 'Release Notes'],
    sentAt: '2 weeks ago',
    sender: 'Product Development Core',
    priority: 'normal'
  }
];

// 7. EXTENDED DISTRIBUTORS & FLEET
export const DEMO_DISTRIBUTORS_FLEET: ExtendedDistributor[] = [
  {
    id: 'dist_ethio_express',
    companyName: 'Ethio Pharma Express Logistics',
    licenseNumber: 'EFDA-DIST-2024-0012',
    country: 'Ethiopia',
    city: 'Addis Ababa',
    fleetVans: 24,
    fleetBikes: 18,
    refrigeratedVans: 12,
    coverageZones: ['Addis Ababa (All Sub-cities)', 'Adama', 'Bishoftu', 'Hawassa'],
    primaryWarehouse: 'Merkato Central Hub A',
    rating: 4.9,
    onTimeRate: '98.8%',
    contactPerson: 'Ato Yohannes Girma',
    contactPhone: '+251 911 445566',
    status: 'active'
  },
  {
    id: 'dist_abyssinia_cold',
    companyName: 'Abyssinia Cold-Chain Transporters',
    licenseNumber: 'EFDA-DIST-2023-0089',
    country: 'Ethiopia',
    city: 'Addis Ababa',
    fleetVans: 16,
    fleetBikes: 0,
    refrigeratedVans: 16,
    coverageZones: ['National Interstate Corridors', 'Dire Dawa', 'Bahir Dar', 'Mekelle'],
    primaryWarehouse: 'Kality Refrigerated Terminal',
    rating: 5.0,
    onTimeRate: '99.4%',
    contactPerson: 'Dr. Yonas Tefera',
    contactPhone: '+251 912 778899',
    status: 'active'
  },
  {
    id: 'dist_sheger_moto',
    companyName: 'Sheger Rapid Rx Courier',
    licenseNumber: 'EFDA-DIST-2025-0144',
    country: 'Ethiopia',
    city: 'Addis Ababa',
    fleetVans: 4,
    fleetBikes: 32,
    refrigeratedVans: 2,
    coverageZones: ['Bole', 'Kirkos', 'Arada', 'Yeka', 'Lideta'],
    primaryWarehouse: 'Bole Medhanealem Rapid Hub',
    rating: 4.8,
    onTimeRate: '99.1%',
    contactPerson: 'Pharm. Meron Assefa',
    contactPhone: '+251 920 334455',
    status: 'active'
  },
  {
    id: 'dist_rift_valley',
    companyName: 'Rift Valley Regional Medical Dispatch',
    licenseNumber: 'EFDA-DIST-2024-0067',
    country: 'Ethiopia',
    city: 'Hawassa',
    fleetVans: 12,
    fleetBikes: 8,
    refrigeratedVans: 6,
    coverageZones: ['Sidama Region', 'Adama', 'Shashemene', 'Wolaita Sodo', 'Arba Minch'],
    primaryWarehouse: 'Hawassa Industrial Park Pharma Depot',
    rating: 4.7,
    onTimeRate: '97.6%',
    contactPerson: 'Ato Daniel Worku',
    contactPhone: '+251 916 221100',
    status: 'active'
  }
];

export const DEMO_LIVE_DISPATCHES: LiveDispatch[] = [
  {
    trackingId: 'TRK-9021',
    distributorName: 'Ethio Pharma Express Logistics',
    originHub: 'Addis Central Storage Depot',
    destinationPharmacy: 'Addis Care Pharmacy (Bole)',
    itemsSummary: 'Paracetamol 500mg (x500), Amoxicillin (x200)',
    batchNumber: 'BT-2026-0814',
    temperatureReading: '18.4°C',
    temperatureStatus: 'normal',
    carrierDriver: 'Kassahun Bekele (Van #04)',
    eta: '25 Mins',
    status: 'Out for Delivery'
  },
  {
    trackingId: 'TRK-9018',
    distributorName: 'Abyssinia Cold-Chain Transporters',
    originHub: 'Kality Cold Terminal',
    destinationPharmacy: 'Hawassa Care Pharmacy',
    itemsSummary: 'Insulin Glargine 100IU (x80), Ceftriaxone 1g (x150)',
    batchNumber: 'BT-2026-0419',
    temperatureReading: '4.2°C',
    temperatureStatus: 'normal',
    carrierDriver: 'Tamrat Hailu (Reefer #12)',
    eta: '1h 45m',
    status: 'In Transit'
  },
  {
    trackingId: 'TRK-9014',
    distributorName: 'Sheger Rapid Rx Courier',
    originHub: 'Bole Medhanealem Rapid Hub',
    destinationPharmacy: 'Bole Family Pharmacy',
    itemsSummary: 'Metformin 500mg (x120), Omeprazole 20mg (x90)',
    batchNumber: 'BT-2026-0611',
    temperatureReading: '21.0°C',
    temperatureStatus: 'normal',
    carrierDriver: 'Eyob Desta (Moto #19)',
    eta: '10 Mins',
    status: 'Out for Delivery'
  },
  {
    trackingId: 'TRK-9008',
    distributorName: 'Ethio Pharma Express Logistics',
    originHub: 'Addis Central Storage Depot',
    destinationPharmacy: 'Unity Pharmacy (Kazanchis)',
    itemsSummary: 'Vitamin C 500mg (x300), ORS Sachets (x400)',
    batchNumber: 'BT-2026-0299',
    temperatureReading: '19.8°C',
    temperatureStatus: 'normal',
    carrierDriver: 'Mulugeta T. (Van #09)',
    eta: 'Delivered',
    status: 'Delivered'
  }
];

// 8. EXTENDED WAREHOUSE HUBS & CONSIGNMENT LEDGER
export const DEMO_EXTENDED_WAREHOUSES: ExtendedWarehouse[] = [
  {
    id: 'wh_addis_central',
    name: 'Addis Ababa Central Strategic Stockpile',
    code: 'HUB-ADD-01',
    country: 'Ethiopia',
    city: 'Addis Ababa',
    address: 'Merkato Commercial Zone, Gate 4, Addis Ketema',
    totalFootprintSqFt: 24000,
    occupiedPercent: 82,
    valuationEtb: 78500000,
    ambientCapacity: '18,000 Pallets',
    coldChainCapacity: '6,000 Pallets (2°C to 8°C)',
    temperatureRanges: 'Ambient (15-25°C) & Cold-Chain (2-8°C)',
    manager: 'Pharm. Adisu Bekele',
    phone: '+251 911 234567',
    complianceCert: 'EFDA Good Storage Practice (GSP) Certified',
    status: 'operational'
  },
  {
    id: 'wh_hawassa_park',
    name: 'Hawassa Industrial Park Pharma Depot',
    code: 'HUB-HAW-02',
    country: 'Ethiopia',
    city: 'Hawassa',
    address: 'Industrial Park Avenue, Shed 14, Hawassa',
    totalFootprintSqFt: 14000,
    occupiedPercent: 64,
    valuationEtb: 34200000,
    ambientCapacity: '10,000 Pallets',
    coldChainCapacity: '4,000 Pallets (Deep Freeze -20°C Available)',
    temperatureRanges: 'Ambient (15-25°C), Cold (2-8°C), Frozen (-20°C)',
    manager: 'W/ro Bethlehem Desta',
    phone: '+251 916 554433',
    complianceCert: 'EFDA-GSP-2025-0044',
    status: 'operational'
  },
  {
    id: 'wh_diredawa_freezone',
    name: 'Dire Dawa Free Trade Zone Logistics Depot',
    code: 'HUB-DIR-03',
    country: 'Ethiopia',
    city: 'Dire Dawa',
    address: 'Customs Free Trade Industrial Zone, Terminal C',
    totalFootprintSqFt: 16000,
    occupiedPercent: 48,
    valuationEtb: 29800000,
    ambientCapacity: '12,000 Pallets',
    coldChainCapacity: '4,000 Pallets',
    temperatureRanges: 'Climate-Controlled Ambient & Cold-Chain',
    manager: 'Ato Ahmed Abdullahi',
    phone: '+251 925 112233',
    complianceCert: 'International Logistics & Cross-Border Customs Clearance',
    status: 'operational'
  },
  {
    id: 'wh_bahirdar_transit',
    name: 'Bahir Dar Lakeview Cold Depot',
    code: 'HUB-BDR-04',
    country: 'Ethiopia',
    city: 'Bahir Dar',
    address: 'Airport Expressway Commercial Terminal, Bahir Dar',
    totalFootprintSqFt: 11000,
    occupiedPercent: 56,
    valuationEtb: 22400000,
    ambientCapacity: '8,000 Pallets',
    coldChainCapacity: '3,000 Pallets',
    temperatureRanges: 'Monitored (2°C - 24°C Continuous Telemetry)',
    manager: 'Pharm. Muluken Kassahun',
    phone: '+251 918 765432',
    complianceCert: 'EFDA Regional Node Validated',
    status: 'operational'
  },
  {
    id: 'wh_nairobi_east',
    name: 'Nairobi East Medical Distribution Hub',
    code: 'HUB-NBO-05',
    country: 'Kenya',
    city: 'Nairobi',
    address: 'Industrial Area, Enterprise Road, Gate 8',
    totalFootprintSqFt: 18000,
    occupiedPercent: 52,
    valuationEtb: 44600000,
    ambientCapacity: '14,000 Pallets',
    coldChainCapacity: '4,000 Pallets',
    temperatureRanges: 'Ambient (15-25°C) & Cold (2-8°C)',
    manager: 'Jane Kamau',
    phone: '+254 722 000111',
    complianceCert: 'PPB Kenya Approved Cold Depot',
    status: 'operational'
  }
];

export const DEMO_WAREHOUSE_TRANSFERS: WarehouseTransferItem[] = [
  { id: 'tx_104', transferCode: 'WT-2026-4412', medicineName: 'Amoxicillin 500mg Capsules', batchNumber: 'AMX-2026-08', units: 4800, originDepot: 'Addis Ababa Central Strategic Stockpile', destinationDepot: 'Hawassa Industrial Park Pharma Depot', dispatchedAt: '3 hours ago', status: 'In Transit' },
  { id: 'tx_103', transferCode: 'WT-2026-4409', medicineName: 'Paracetamol 500mg Tablets', batchNumber: 'PCM-2026-14', units: 12000, originDepot: 'Addis Ababa Central Strategic Stockpile', destinationDepot: 'Bahir Dar Lakeview Cold Depot', dispatchedAt: '8 hours ago', status: 'Received & Verified' },
  { id: 'tx_102', transferCode: 'WT-2026-4398', medicineName: 'Ceftriaxone 1g Injection Vial', batchNumber: 'CFT-2026-03', units: 2500, originDepot: 'Dire Dawa Free Trade Zone Logistics Depot', destinationDepot: 'Addis Ababa Central Strategic Stockpile', dispatchedAt: '1 day ago', status: 'Received & Verified' },
  { id: 'tx_101', transferCode: 'WT-2026-4384', medicineName: 'Insulin Glargine 100IU', batchNumber: 'INS-2026-91', units: 1400, originDepot: 'Addis Ababa Central Strategic Stockpile', destinationDepot: 'Dire Dawa Free Trade Zone Logistics Depot', dispatchedAt: '1 day ago', status: 'Received & Verified' }
];

// 9. AI STRATEGY & COPILOT INTELLIGENCE DATA
export const DEMO_AI_DEMAND_SURGES: AiDemandSurgeAlert[] = [
  {
    id: 'SURGE-01',
    therapeuticCategory: 'Upper Respiratory & Antihistamines',
    projectedSurgePercent: 36,
    affectedRegions: ['Addis Ababa', 'Oromia (Adama)', 'Amhara (Bahir Dar)'],
    primaryDriver: 'Seasonal transition & temperature inversion causing spike in viral upper respiratory infections.',
    recommendedBufferUnits: 45000,
    confidenceScore: 96.4,
    severity: 'high'
  },
  {
    id: 'SURGE-02',
    therapeuticCategory: 'Antimalarials (Artemether + Lumefantrine)',
    projectedSurgePercent: 52,
    affectedRegions: ['Rift Valley Corridor', 'Hawassa & SNNPR Lowlands', 'Afar Valley'],
    primaryDriver: 'Post-rainy vector breeding index surge in lowland irrigation clusters.',
    recommendedBufferUnits: 28000,
    confidenceScore: 94.1,
    severity: 'high'
  },
  {
    id: 'SURGE-03',
    therapeuticCategory: 'Gastrointestinal & Oral Rehydration Salts (ORS)',
    projectedSurgePercent: 24,
    affectedRegions: ['Dire Dawa', 'Somali Region', 'East Hararghe'],
    primaryDriver: 'Dry seasonal municipal water rationing and heightened enteric infection risks.',
    recommendedBufferUnits: 32000,
    confidenceScore: 91.8,
    severity: 'elevated'
  }
];

export const DEMO_AI_RESTOCK_RECOMMENDATIONS: AiRestockRecommendation[] = [
  { id: 'RESTOCK-01', medicineName: 'Paracetamol 500mg Tablets', category: 'Analgesics & Antipyretics', networkCurrentStock: 48200, recommendedOrderUnits: 85000, bufferDaysAvailable: 9, velocity30d: 5210, primarySupplier: 'Cadila Pharmaceuticals Ethiopia', estimatedCostEtb: 93500 },
  { id: 'RESTOCK-02', medicineName: 'Amoxicillin 500mg Capsules', category: 'Antibiotics & Anti-infectives', networkCurrentStock: 24100, recommendedOrderUnits: 60000, bufferDaysAvailable: 7, velocity30d: 3440, primarySupplier: 'Julphar Pharmaceuticals PLC', estimatedCostEtb: 156000 },
  { id: 'RESTOCK-03', medicineName: 'Omeprazole 20mg Capsules', category: 'Gastrointestinal', networkCurrentStock: 18400, recommendedOrderUnits: 45000, bufferDaysAvailable: 11, velocity30d: 2540, primarySupplier: 'EPHARM (Ethiopian Pharmaceuticals)', estimatedCostEtb: 112500 },
  { id: 'RESTOCK-04', medicineName: 'Metformin 500mg Tablets', category: 'Cardiovascular & Antidiabetic', networkCurrentStock: 16200, recommendedOrderUnits: 38000, bufferDaysAvailable: 12, velocity30d: 2120, primarySupplier: 'Cadila Pharmaceuticals Ethiopia', estimatedCostEtb: 76000 },
  { id: 'RESTOCK-05', medicineName: 'Vitamin C 500mg Chewable', category: 'Vitamins & Supplements', networkCurrentStock: 14800, recommendedOrderUnits: 30000, bufferDaysAvailable: 14, velocity30d: 1810, primarySupplier: 'MedTech Ethiopia Importers', estimatedCostEtb: 45000 }
];

// 10. REVENUE DETAILED METRICS & FINANCIAL CHANNELS
export const DEMO_PAYMENT_CHANNELS = [
  { name: 'Telebirr SuperApp & QR', percent: 48.5, volumeEtb: 6054100, feePercent: '0.5%', status: 'Instant Settlement (Auto-Reconciled)', transactionCount: 14280, successRate: 99.8, settlementTime: '< 3 seconds' },
  { name: 'Commercial Bank of Ethiopia (CBE Birr)', percent: 27.8, volumeEtb: 3470200, feePercent: '0.75%', status: 'Direct Core Banking API', transactionCount: 8420, successRate: 99.4, settlementTime: 'Instant / < 1m' },
  { name: 'Chapa Payment Gateway', percent: 14.2, volumeEtb: 1772500, feePercent: '1.8%', status: 'Visa / Mastercard / Local Cards', transactionCount: 3940, successRate: 98.9, settlementTime: 'T+0 End of Day' },
  { name: 'Bank Wire / RTGS Settlement', percent: 9.5, volumeEtb: 1185950, feePercent: 'Flat 50 ETB', status: 'Corporate B2B Wholesale Accounts', transactionCount: 860, successRate: 99.9, settlementTime: 'Same Day RTGS' }
];

export const DEMO_REVENUE_TRAJECTORY_12M = [
  { month: 'Jun', subscriptions: 720000, commissions: 210000, ads: 120000, total: 1050000 },
  { month: 'Jul', subscriptions: 780000, commissions: 245000, ads: 135000, total: 1160000 },
  { month: 'Aug', subscriptions: 840000, commissions: 280000, ads: 150000, total: 1270000 },
  { month: 'Sep', subscriptions: 910000, commissions: 310000, ads: 165000, total: 1385000 },
  { month: 'Oct', subscriptions: 990000, commissions: 350000, ads: 190000, total: 1530000 },
  { month: 'Nov', subscriptions: 1080000, commissions: 395000, ads: 210000, total: 1685000 },
  { month: 'Dec', subscriptions: 1190000, commissions: 450000, ads: 240000, total: 1880000 },
  { month: 'Jan', subscriptions: 1260000, commissions: 480000, ads: 260000, total: 2000000 },
  { month: 'Feb', subscriptions: 1350000, commissions: 520000, ads: 285000, total: 2155000 },
  { month: 'Mar', subscriptions: 1460000, commissions: 575000, ads: 310000, total: 2345000 },
  { month: 'Apr', subscriptions: 1580000, commissions: 630000, ads: 340000, total: 2550000 },
  { month: 'May (Proj)', subscriptions: 1720000, commissions: 690000, ads: 380000, total: 2790000 }
];

// 11. MARKETPLACE ADMIN CATALOG COMMISSION MATRIX
export const DEMO_COMMISSION_STRUCTURE = [
  { category: 'Antibiotics & Anti-infectives', tier: 'Essential Antibiotics', rate: '1.2%', ratePercent: 1.2, minFee: '15 ETB', minVolumeEtb: 5000, payoutCycle: 'Weekly Batch', verificationRequired: 'Strict EFDA Batch QC', activeMerchants: 42 },
  { category: 'Analgesics & Pain Management', tier: 'Over-The-Counter Pain Care', rate: '1.0%', ratePercent: 1.0, minFee: '10 ETB', minVolumeEtb: 3000, payoutCycle: 'Instant T+0', verificationRequired: 'Standard Wholesale Certificate', activeMerchants: 48 },
  { category: 'Chronic & Cardiovascular Rx', tier: 'Chronic Care & Non-Communicable', rate: '1.5%', ratePercent: 1.5, minFee: '20 ETB', minVolumeEtb: 8000, payoutCycle: 'Weekly Batch', verificationRequired: 'Licensed Cold/Prescription Hub', activeMerchants: 36 },
  { category: 'Medical Equipment & Diagnostic Devices', tier: 'Hospital Diagnostics & Devices', rate: '2.5%', ratePercent: 2.5, minFee: '50 ETB', minVolumeEtb: 15000, payoutCycle: 'Bi-Weekly', verificationRequired: 'ISO / CE Medical Device Standards', activeMerchants: 22 },
  { category: 'Vitamins, Nutrition & Baby Care', tier: 'Nutritional & Pediatric', rate: '2.0%', ratePercent: 2.0, minFee: '15 ETB', minVolumeEtb: 4000, payoutCycle: 'Instant T+0', verificationRequired: 'Food & Nutrition Agency Verified', activeMerchants: 44 }
];

export const DEMO_TRENDING_B2B_SEARCHES = [
  { keyword: 'Amoxicillin 500mg Batch 1000s', category: 'Antibiotics', searchCount: 1420, volume: '1,420 queries', trend: '+42%', weeklyDelta: '+42% WoW', stockAvailability: 'High' },
  { keyword: 'Paracetamol 500mg Cadila', category: 'Analgesics', searchCount: 1180, volume: '1,180 queries', trend: '+28%', weeklyDelta: '+28% WoW', stockAvailability: 'High' },
  { keyword: 'Ceftriaxone 1g Vials Box of 50', category: 'Injections', searchCount: 890, volume: '890 queries', trend: '+35%', weeklyDelta: '+35% WoW', stockAvailability: 'Medium' },
  { keyword: 'Insulin Glargine Cold Chain', category: 'Endocrine', searchCount: 740, volume: '740 queries', trend: '+19%', weeklyDelta: '+19% WoW', stockAvailability: 'Low (Priority)' },
  { keyword: 'Omeprazole 20mg Blisters', category: 'Gastrointestinal', searchCount: 680, volume: '680 queries', trend: '+15%', weeklyDelta: '+15% WoW', stockAvailability: 'High' }
];

// 12. EXTENDED AUDIT LOGS
export const DEMO_EXTENDED_AUDIT_LOGS = [
  { id: 'AUD-9921', action: 'SUBSCRIPTION_EXTENDED', category: 'BILLING', details: 'Added 1 goodwill month to Unity Pharmacy (Kirkos Branch)', uid: 'super-admin-01', ip: '196.188.10.12', timestamp: Date.now() - 15 * 60 * 1000, severity: 'INFO' },
  { id: 'AUD-9918', action: 'REGULATORY_DOC_VERIFIED', category: 'COMPLIANCE', details: 'Verified EFDA Pharmacist License renewal for Addis Care Pharmacy', uid: 'super-admin-01', ip: '196.188.10.12', timestamp: Date.now() - 45 * 60 * 1000, severity: 'SUCCESS' },
  { id: 'AUD-9912', action: 'SECURITY_THREAT_THROTTLED', category: 'SECOPS', details: 'Automated IP lock applied to 196.188.42.18 for 24h following failed auth attempts', uid: 'SYSTEM_DAEMON_WAF', ip: '196.188.42.18', timestamp: Date.now() - 75 * 60 * 1000, severity: 'WARNING' },
  { id: 'AUD-9905', action: 'MARKETPLACE_BADGE_UPDATE', category: 'COMMERCIAL', details: 'Promoted Amoxicillin 500mg to Featured Sponsored Banner', uid: 'super-admin-01', ip: '196.188.10.12', timestamp: Date.now() - 120 * 60 * 1000, severity: 'INFO' },
  { id: 'AUD-9899', action: 'BROADCAST_FEED_DISPATCHED', category: 'COMMUNICATION', details: 'Delivered "MOH Cold-Chain Storage Directives 2026" to 346 organizations', uid: 'super-admin-01', ip: '196.188.10.12', timestamp: Date.now() - 180 * 60 * 1000, severity: 'INFO' },
  { id: 'AUD-9892', action: 'TERRITORY_QUOTA_ADJUSTED', category: 'GOVERNANCE', details: 'Updated Q2 target for Oromia Region Territory to 2.45M ETB', uid: 'super-admin-01', ip: '196.188.10.12', timestamp: Date.now() - 240 * 60 * 1000, severity: 'INFO' },
  { id: 'AUD-9884', action: 'WAREHOUSE_CONSIGNMENT_TRANSIT', category: 'LOGISTICS', details: 'Dispatched 4,800 units Amoxicillin from Addis Central to Hawassa Depot', uid: 'dist_ethio_express', ip: '197.156.22.84', timestamp: Date.now() - 360 * 60 * 1000, severity: 'INFO' },
  { id: 'AUD-9878', action: 'CRON_FEFO_DISPATCH_COMPLETE', category: 'SYSTEM', details: 'FEFO batch expiry sweep flagged 18 pharmacy items expiring within 60 days', uid: 'SYSTEM_CRON_WORKER', ip: '127.0.0.1 (Internal)', timestamp: Date.now() - 480 * 60 * 1000, severity: 'SUCCESS' }
];
