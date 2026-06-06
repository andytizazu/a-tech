export type UserRole = 'admin' | 'pharmacy' | 'importer' | 'regional_manager' | 'support' | 'staff' | 'marketing';
export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'deactivated';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  country?: string;
  region?: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  pharmacyName?: string;
  importerName?: string;
  subscriptionType?: 'basic' | 'standard' | 'premium';
  subscriptionStatus?: 'active' | 'expired' | 'past_due';
  subscriptionExpiryDate?: number;
  lastSubscriptionPaymentDate?: number;
  pendingSubscriptionType?: 'basic' | 'standard' | 'premium';
  verificationStatus: VerificationStatus;
  verificationDocs?: string[]; // URLs to uploaded files
  rejectionReason?: string;
  username?: string;
  password?: string;
  staffRole?: string;
  pharmacyId?: string;
  importerId?: string;
  permissions?: string[];
  promoCode?: string; // For marketing team or pharmacy referrals
  referralCode?: string; // Unique code for pharmacies to invite others
  referredBy?: string; // Code used during signup
  referrerUid?: string; // UID of the pharmacy/importer who referred this user
  referralRewardMonthsEarned?: number; // Total months earned through referrals
  marketingId?: string; // UID of the marketing member who referred this user
  commissionBalance?: number; // For marketing team
  theme?: 'light' | 'dark';
  createdAt: number;
  deliverySettings?: {
    isFreeDelivery: boolean;
    freeDeliveryThreshold?: number;
    baseFee: number;
    feePerKm: number;
  };
}

export interface Medicine {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  quantity: number;
  batchNumber: string;
  expiryDate: string;
  supplier: string;
  pharmacyId: string;
  lowStockThreshold: number;
  createdAt: number;
}

export interface SaleItem {
  medicineId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Sale {
  id: string;
  pharmacyId: string;
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'credit';
  customerName?: string;
  customerPhone?: string;
  createdAt: number;
}

export interface MarketplaceProduct {
  id: string;
  importerId: string;
  importerName: string;
  name: string;
  description: string;
  category: string;
  price: number;
  minOrderQuantity: number;
  stockQuantity: number;
  country: string;
  createdAt: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  pharmacyCreatedAt?: number;
  marketingId?: string;
  importerId: string;
  importerName: string;
  items: OrderItem[];
  totalAmount: number;
  commissionAmount: number;
  status: OrderStatus;
  country: string;
  region?: string;
  createdAt: number;
  deliveryMethod: 'pickup' | 'delivery';
  deliveryAddress?: string;
  distanceKm?: number;
  deliveryFee?: number;
}

export interface SystemSettings {
  globalCommissionPercent: number;
  contactEmail: string;
  contactPhone: string;
  importerCommissions: { [importerId: string]: number };
  marketingCommission: {
    durationMonths: number;
    basicPlanRate: number;
    standardPlanRate: number;
    premiumPlanRate: number;
    orderCommissionPercent: number;
  };
  pharmacyReferralRewardMonths: number;
  maxMedicinesPerPlan: {
    basic: number;
    standard: number;
    premium: number;
  };
  featuresEnabled: {
    marketplace: boolean;
    subscriptions: boolean;
    analytics: boolean;
  };
  planPrices: {
    basic: number;
    standard: number;
    premium: number;
  };
  updatedAt: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  target: 'all' | 'pharmacies' | 'importers' | 'region' | 'specific';
  targetRegion?: string;
  targetUids?: string[];
  senderId: string;
  createdAt: number;
}

export interface AuditLog {
  id: string;
  uid: string;
  action: string;
  details: string;
  ip?: string;
  timestamp: number;
}

export interface SubscriptionPlan {
  id: 'basic' | 'standard' | 'premium';
  name: string;
  price: number;
  durationDays: number;
  features: string[];
}
