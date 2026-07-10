import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, SystemSettings, SaaSInvoice } from '../types';

// Hardcoded fallback base prices matching PLAN_PRICES in App.tsx
export const PLAN_PRICES = {
  basic: 400,
  standard: 1200,
  premium: 3000
};

/**
 * Calculates the exact dynamic subscription costs for a pharmacy.
 * Formula: Monthly Cost = Base Subscription Price + (Number of Additional Branches × Additional Branch Fee),
 * subject to country-specific guidelines, currencies, and any promo/discount reductions.
 */
export const getSubscriptionCost = (
  profile: UserProfile, 
  settings: SystemSettings | null, 
  totalBranchesCount: number
) => {
  const country = profile.country || 'Ethiopia';
  const rawPlan = (profile.subscriptionType || 'basic') as string;
  const rawPlanLower = rawPlan.toLowerCase();
  const plan: 'basic' | 'standard' | 'premium' = 
    rawPlanLower.includes('premium') || rawPlanLower.includes('enterprise') ? 'premium' : 
    rawPlanLower.includes('standard') || rawPlanLower.includes('professional') || rawPlanLower.includes('pro') ? 'standard' : 'basic';
  
  // 1. Resolve Pricing Config & Overrides
  let basePrice = 0;
  let additionalBranchFee = 300; // default fee
  let currency = 'ETB';
  
  if (settings) {
    const countryConfig = settings.countryPricing?.[country];
    if (countryConfig) {
      basePrice = countryConfig[plan as 'basic' | 'standard' | 'premium'] ?? 0;
      additionalBranchFee = countryConfig.additionalBranchFee ?? 0;
      currency = countryConfig.currency || 'ETB';
    } else {
      basePrice = settings.planPrices?.[plan as 'basic' | 'standard' | 'premium'] ?? PLAN_PRICES[plan as 'basic' | 'standard' | 'premium'];
      additionalBranchFee = settings.additionalBranchFee ?? 300;
      currency = settings.branchPricingCurrency || 'ETB';
    }
  } else {
    basePrice = PLAN_PRICES[plan as 'basic' | 'standard' | 'premium'];
    additionalBranchFee = 300;
    currency = 'ETB';
  }

  // 2. Count "Additional Branches" (Main Branch is free and included with base plan)
  const additionalBranches = Math.max(0, totalBranchesCount - 1);
  const additionalCharges = additionalBranches * additionalBranchFee;
  const subtotal = basePrice + additionalCharges;
  
  // 3. Dynamic Promotions & Referral/Coupon discount checking
  let promoDiscountPercent = 0;
  const activePromo = settings?.promotions?.find(p => p.active);
  if (activePromo) {
    promoDiscountPercent = activePromo.discountPercent || 0;
  }
  
  let couponDiscountPercent = 0;
  if (profile.referredBy && settings?.discounts) {
    const matchedDiscount = settings.discounts.find(
      d => d.code.toUpperCase() === profile.referredBy?.toUpperCase() && d.active
    );
    if (matchedDiscount) {
      couponDiscountPercent = matchedDiscount.percent || 0;
    }
  }
  
  const totalDiscountPercent = Math.min(100, promoDiscountPercent + couponDiscountPercent);
  const totalCost = subtotal * (1 - totalDiscountPercent / 100);
  const vatAmount = totalCost * 0.15;
  const totalCostWithVat = totalCost + vatAmount;

  return {
    basePrice,
    additionalBranches,
    additionalBranchFee,
    additionalCharges,
    subtotal,
    promoDiscountPercent,
    couponDiscountPercent,
    totalDiscountPercent,
    totalCost,
    vatAmount,
    totalCostWithVat,
    currency
  };
};

/**
 * Synchronizes the pharmacy's billing and dynamic invoices in real-time.
 * Recalculates based on the current branches count, updates user profile,
 * and maintains the SaaS invoice records.
 */
export const syncPharmacyBillingAndInvoices = async (pharmacyId: string): Promise<any> => {
  if (!pharmacyId) return null;

  try {
    // 1. Fetch user profile
    const userRef = doc(db, 'users', pharmacyId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      console.warn(`[BillingEngine] User profile not found for uid: ${pharmacyId}`);
      return null;
    }
    const profile = { uid: pharmacyId, ...userSnap.data() } as UserProfile;
    
    // Safety check - only calculate for pharmacy role
    if (profile.role !== 'pharmacy') return null;

    // 2. Fetch standard global settings
    const settingsSnap = await getDoc(doc(db, 'system_settings', 'main'));
    const settings = settingsSnap.exists() ? (settingsSnap.data() as SystemSettings) : null;

    // 3. Query actual branches loaded in Firestore
    const branchesQuery = query(collection(db, 'branches'), where('pharmacyId', '==', pharmacyId));
    const branchesSnap = await getDocs(branchesQuery);
    const totalBranchesCount = branchesSnap.size || 1; // Default to 1 (Main Branch HQ) if none created yet

    // 4. Run calculation
    const billingDetails = getSubscriptionCost(profile, settings, totalBranchesCount);

    // 5. Update user profile to reflect calculated values
    await updateDoc(userRef, {
      monthlyBillingAmount: billingDetails.totalCost,
      monthlyBillingVatAmount: billingDetails.vatAmount,
      monthlyBillingTotalAmountWithVat: billingDetails.totalCostWithVat,
      totalBranchesCount: totalBranchesCount,
      billingCurrency: billingDetails.currency
    });

    // 6. Generate or update monthly invoice
    const dateObj = new Date();
    const billingPeriod = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); // e.g., "June 2026"
    // Cohesive key structure to avoid multiple pending invoices per month
    const invoiceId = `saas_inv_${pharmacyId}_${dateObj.getFullYear()}_${dateObj.getMonth() + 1}`;
    
    const invoiceRef = doc(db, 'saas_invoices', invoiceId);
    const invoiceSnap = await getDoc(invoiceRef);

    const invoiceData: SaaSInvoice = {
      id: invoiceId,
      pharmacyId,
      pharmacyName: profile.pharmacyName || profile.displayName || 'Pharmacy Partner',
      plan: (String(profile.subscriptionType || 'basic').toLowerCase().includes('premium') || String(profile.subscriptionType || 'basic').toLowerCase().includes('enterprise')) ? 'premium' : (String(profile.subscriptionType || 'basic').toLowerCase().includes('standard') || String(profile.subscriptionType || 'basic').toLowerCase().includes('professional') || String(profile.subscriptionType || 'basic').toLowerCase().includes('pro') ? 'standard' : 'basic'),
      basePrice: billingDetails.basePrice,
      additionalBranchesCount: billingDetails.additionalBranches,
      additionalBranchFee: billingDetails.additionalBranchFee,
      additionalCharges: billingDetails.additionalCharges,
      discountPercent: billingDetails.totalDiscountPercent,
      subtotal: billingDetails.totalCost,
      vatAmount: billingDetails.vatAmount,
      totalAmount: billingDetails.totalCostWithVat,
      currency: billingDetails.currency,
      status: invoiceSnap.exists() ? (invoiceSnap.data().status || 'pending') : 'pending',
      billingPeriod,
      createdAt: invoiceSnap.exists() ? (invoiceSnap.data().createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now()
    };

    await setDoc(invoiceRef, invoiceData, { merge: true });
    console.log(`[BillingEngine] Successfully synced billing for ${profile.pharmacyName || pharmacyId}. Total billing cost: ${billingDetails.totalCost} ${billingDetails.currency}`);
    
    return {
      billingDetails,
      totalBranchesCount,
      invoiceData
    };
  } catch (error) {
    console.error(`[BillingEngine] Error in syncPharmacyBillingAndInvoices:`, error);
    throw error;
  }
};
