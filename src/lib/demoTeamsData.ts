import { UserProfile } from '../types';

export interface DemoWholesaleStaffSpec {
  uid: string;
  email: string;
  displayName: string;
  role: 'importer'; // existing wholesale role
  staffRoleTitle: string;
  phone: string;
  country: string;
  region: string;
  city: string;
  address: string;
  verificationStatus: 'approved';
  subscriptionType: 'premium';
  subscriptionStatus: 'active';
  createdAt: number;
  managedTerritories: string[];
  isDemo: true;
}

export const DEMO_WHOLESALE_STAFF: DemoWholesaleStaffSpec[] = [
  {
    uid: 'demo_ws_staff_logistics',
    email: 'logistics.lead@atech-import-demo.et',
    displayName: 'DEMO Yonas Mekonnen (Supply Chain Director)',
    role: 'importer',
    staffRoleTitle: 'Director of National Supply Chain & Port Logistics',
    phone: '+251 90 000 8801 (DEMO)',
    country: 'Ethiopia',
    region: 'Addis Ababa',
    city: 'Addis Ababa City',
    address: 'Bole Sub-City, Cargo Terminal 2, Addis Ababa',
    verificationStatus: 'approved',
    subscriptionType: 'premium',
    subscriptionStatus: 'active',
    createdAt: Date.now() - 150 * 24 * 60 * 60 * 1000,
    managedTerritories: ['Addis Ababa', 'Oromia', 'Dire Dawa'],
    isDemo: true
  },
  {
    uid: 'demo_ws_staff_central',
    email: 'central.rep@atech-import-demo.et',
    displayName: 'DEMO Meron Tefera (Central Distribution Manager)',
    role: 'importer',
    staffRoleTitle: 'Central Region Pharmacy Account Specialist',
    phone: '+251 90 000 8802 (DEMO)',
    country: 'Ethiopia',
    region: 'Addis Ababa',
    city: 'Addis Ababa City',
    address: 'Akaki Kality Cold Chain Depot, Addis Ababa',
    verificationStatus: 'approved',
    subscriptionType: 'premium',
    subscriptionStatus: 'active',
    createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
    managedTerritories: ['Addis Ababa', 'Oromia'],
    isDemo: true
  },
  {
    uid: 'demo_ws_staff_regional',
    email: 'north.rep@atech-import-demo.et',
    displayName: 'DEMO Daniel Habte (Northern & Eastern Corridors Rep)',
    role: 'importer',
    staffRoleTitle: 'Regional Wholesale Distribution Representative',
    phone: '+251 90 000 8803 (DEMO)',
    country: 'Ethiopia',
    region: 'Amhara',
    city: 'Bahir Dar',
    address: 'Commercial Highway Depot, Bahir Dar',
    verificationStatus: 'approved',
    subscriptionType: 'premium',
    subscriptionStatus: 'active',
    createdAt: Date.now() - 100 * 24 * 60 * 60 * 1000,
    managedTerritories: ['Amhara', 'Tigray', 'Dire Dawa'],
    isDemo: true
  }
];

export interface DemoMarketingMemberSpec {
  uid: string;
  email: string;
  displayName: string;
  role: 'marketing';
  promoCode: string;
  phone: string;
  country: string;
  city: string;
  shift: string;
  salary: number;
  commissionRate: number;
  verificationStatus: 'approved';
  createdAt: number;
  isDemo: true;
}

export const DEMO_MARKETING_MEMBERS: DemoMarketingMemberSpec[] = [
  {
    uid: 'demo_mkt_member_01',
    email: 'mkt.selam@atech-demo.et',
    displayName: 'DEMO Selam Teshome (Senior Brand & Campaign Manager)',
    role: 'marketing',
    promoCode: 'SELAM2026',
    phone: '+251 90 000 7701 (DEMO)',
    country: 'Ethiopia',
    city: 'Addis Ababa',
    shift: 'Full-time Standard',
    salary: 22000,
    commissionRate: 5,
    verificationStatus: 'approved',
    createdAt: Date.now() - 100 * 24 * 60 * 60 * 1000,
    isDemo: true
  },
  {
    uid: 'demo_mkt_member_02',
    email: 'mkt.kirubel@atech-demo.et',
    displayName: 'DEMO Kirubel Desta (Regional Pharmacy Outreach Lead)',
    role: 'marketing',
    promoCode: 'KIRUHEALTH',
    phone: '+251 90 000 7702 (DEMO)',
    country: 'Ethiopia',
    city: 'Hawassa',
    shift: 'Full-time Standard',
    salary: 18000,
    commissionRate: 5,
    verificationStatus: 'approved',
    createdAt: Date.now() - 80 * 24 * 60 * 60 * 1000,
    isDemo: true
  },
  {
    uid: 'demo_mkt_member_03',
    email: 'mkt.eden@atech-demo.et',
    displayName: 'DEMO Eden Berhanu (Clinical Products Specialist)',
    role: 'marketing',
    promoCode: 'EDENPHARM',
    phone: '+251 90 000 7703 (DEMO)',
    country: 'Ethiopia',
    city: 'Adama',
    shift: 'Full-time Standard',
    salary: 19500,
    commissionRate: 5,
    verificationStatus: 'approved',
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    isDemo: true
  }
];
