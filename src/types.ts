export type UserRole = 'admin' | 'pharmacy' | 'importer' | 'regional_manager' | 'support' | 'staff' | 'marketing' | 'distributor';
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
  distributorName?: string;
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
  branchId?: string; // Associated branch for pharmacy staff
  importerId?: string;
  distributorId?: string;
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

export interface InventoryProduct {
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
  branchId?: string; // Associated branch for the inventory item
  warehouseId?: string; // Associated warehouse for the inventory item
  lowStockThreshold: number;
  createdAt: number;
  
  // Medicine Master Data Enhancements
  genericName?: string;
  countryOfOrigin?: string;
  purchaseUnit?: string;
  dispensingUnit?: string;
  conversionFactor?: number;
}

export interface BinCardEntry {
  id: string;
  pharmacyId: string;
  branchId: string;
  productId: string;
  productName: string;
  genericName?: string;
  date: number;
  transactionType: 'Purchase' | 'Sale' | 'Return' | 'Adjustment' | 'Transfer';
  referenceNumber: string;
  quantityIn: number;
  quantityOut: number;
  balance: number;
  user: string;
  branch: string;
  product: string;
  countryOfOrigin?: string;
  purchaseUnit?: string;
  dispensingUnit?: string;
  conversionFactor?: number;
}

export type Medicine = InventoryProduct;

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Sale {
  id: string;
  pharmacyId: string;
  branchId?: string; // Associated branch for the sale
  items: SaleItem[];
  totalAmount: number;
  subtotalAmount?: number;
  vatAmount?: number;
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

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'approved' | 'packed' | 'dispatched' | 'completed';

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber?: string;
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
  telegramLink?: string;
  whatsappLink?: string;
  contactActiveRegions?: string;
  footerDescription?: string;
  termsOfServiceTitle?: string;
  termsOfServiceContent?: string;
  privacyPolicyTitle?: string;
  privacyPolicyContent?: string;
  cookiePolicyTitle?: string;
  cookiePolicyContent?: string;
  cookiePreferencesDescription?: string;
  importerCommissions: { [importerId: string]: number };
  marketingCommission: {
    durationMonths: number;
    basicPlanRate: number;
    standardPlanRate: number;
    premiumPlanRate: number;
    orderCommissionPercent: number;
  };
  pharmacyReferralRewardMonths: number;
  maxProductsPerPlan: {
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
  additionalBranchFee?: number;
  branchPricingCurrency?: string;
  countryPricing?: {
    [country: string]: {
      basic: number;
      standard: number;
      premium: number;
      additionalBranchFee: number;
      currency: string;
    };
  };
  discounts?: {
    code: string;
    percent: number;
    description: string;
    active: boolean;
  }[];
  promotions?: {
    title: string;
    description: string;
    discountPercent: number;
    active: boolean;
  }[];
  plansCustomize?: {
    [planId in 'basic' | 'standard' | 'premium']?: {
      name: string;
      description: string;
      recommended: boolean;
      features: string[];
      limitations: string[];
      futureFeatures?: string[];
      enableFutureFeatures?: boolean;
      functionalFeatures?: string[];
    };
  };
  updatedAt: number;
}

export interface SaaSInvoice {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  plan: 'basic' | 'standard' | 'premium';
  basePrice: number;
  additionalBranchesCount: number;
  additionalBranchFee: number;
  additionalCharges: number;
  discountPercent: number;
  totalAmount: number;
  vatAmount?: number;
  subtotal?: number;
  currency: string;
  status: 'paid' | 'pending';
  billingPeriod: string; // e.g., "June 2026"
  createdAt: number;
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

export interface Customer {
  id: string;
  pharmacyId: string;
  branchId?: string; // Optional associated branch
  name: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: number;
}

export interface Branch {
  id: string;
  pharmacyId: string; // The owner pharmacy's userId or pharmacy owner UID
  name: string;
  location: string;
  phone?: string;
  manager?: string;
  createdAt: number;
}

export interface StockTransfer {
  id: string;
  pharmacyId: string;
  fromBranchId: string;
  fromBranchName?: string;
  toBranchId: string;
  toBranchName?: string;
  productId: string;
  productName: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: number;
  updatedAt?: number;
  createdBy?: string;
}

export interface Warehouse {
  id: string;
  pharmacyId: string;
  name: string;
  location: string;
  phone?: string;
  managerId?: string;
  managerName?: string;
  createdAt: number;
}

export type WarehouseTransactionType = 'receiving' | 'dispatch' | 'internal_transfer_out' | 'internal_transfer_in' | 'dispatch_to_branch';

export interface WarehouseTransaction {
  id: string;
  pharmacyId: string;
  type: WarehouseTransactionType;
  productId: string;
  productName: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  sourceId: string;
  sourceName: string;
  destinationId: string;
  destinationName: string;
  costPrice?: number;
  sellingPrice?: number;
  notes?: string;
  createdBy?: string;
  createdAt: number;
}

export interface SupplierRating {
  rating: number;
  feedback?: string;
  ratedByName: string;
  createdAt: number;
}

export interface Supplier {
  id: string;
  pharmacyId: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  
  // Licenses
  licenseNumber?: string;
  licenseExpiry?: string;
  licenseAuthority?: string;
  licenseStatus?: 'active' | 'expired' | 'pending' | 'invalid';
  
  // Performance
  rating?: number;
  ratingsCount?: number;
  ratingsList?: SupplierRating[];
  onTimeDeliveryRate?: number; // e.g. 95 (percentage)
  qualityComplianceRate?: number; // e.g. 98 (percentage)
  leadTimeDays?: number; // Average shipment lead time in days
  
  createdAt: number;
  updatedAt?: number;
}

export const getCurrencySymbol = (country?: string): string => {
  const c = country ? country.toLowerCase().trim() : 'ethiopia';
  if (c.includes('ethiopia')) return 'ETB';
  if (c.includes('kenya')) return 'KES';
  if (c.includes('uganda')) return 'UGX';
  if (c.includes('tanzania')) return 'TZS';
  if (c.includes('rwanda')) return 'RWF';
  if (c.includes('burundi')) return 'BIF';
  if (c.includes('somalia')) return 'SOS';
  if (c.includes('south sudan')) return 'SSP';
  if (c.includes('djibouti')) return 'DJF';
  if (c.includes('eritrea')) return 'ERN';
  if (c.includes('sudan')) return 'SDG';
  if (c.includes('madagascar')) return 'MGA';
  if (c.includes('mozambique')) return 'MZN';
  if (c.includes('malawi')) return 'MWK';
  if (c.includes('zambia')) return 'ZMW';
  if (c.includes('zimbabwe')) return 'ZWG';
  if (c.includes('comoros')) return 'KMF';
  if (c.includes('mauritius')) return 'MUR';
  if (c.includes('seychelles')) return 'SCR';
  return 'ETB';
};

export const getCurrencyName = (country?: string): string => {
  const c = country ? country.toLowerCase().trim() : 'ethiopia';
  if (c.includes('ethiopia')) return 'Ethiopian Birr';
  if (c.includes('kenya')) return 'Kenyan Shilling';
  if (c.includes('uganda')) return 'Ugandan Shilling';
  if (c.includes('tanzania')) return 'Tanzanian Shilling';
  if (c.includes('rwanda')) return 'Rwandan Franc';
  if (c.includes('burundi')) return 'Burundian Franc';
  if (c.includes('somalia')) return 'Somali Shilling';
  if (c.includes('south sudan')) return 'South Sudanese Pound';
  if (c.includes('djibouti')) return 'Djiboutian Franc';
  if (c.includes('eritrea')) return 'Eritrean Nakfa';
  if (c.includes('sudan')) return 'Sudanese Pound';
  if (c.includes('madagascar')) return 'Malagasy Ariary';
  if (c.includes('mozambique')) return 'Mozambican Metical';
  if (c.includes('malawi')) return 'Malawian Kwacha';
  if (c.includes('zambia')) return 'Zambian Kwacha';
  if (c.includes('zimbabwe')) return 'Zimbabwean Gold';
  if (c.includes('comoros')) return 'Comorian Franc';
  if (c.includes('mauritius')) return 'Mauritian Rupee';
  if (c.includes('seychelles')) return 'Seychellois Rupee';
  return 'Ethiopian Birr';
};
