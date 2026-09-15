import { 
  collection, 
  doc, 
  getDocs, 
  writeBatch, 
  query, 
  where,
  limit,
  WriteBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, InventoryProduct, Sale, Order, Notification } from '../types';
import { generate120DemoPharmacies, DemoPharmacySpec } from './demoPharmacyNetwork';
import { DEMO_WHOLESALE_STAFF, DEMO_MARKETING_MEMBERS } from './demoTeamsData';
import { Advertisement } from '../components/WholesaleAdsPortal';

export interface DemoSeedStatus {
  isSeeded: boolean;
  pharmacyCount: number;
  wholesaleCount: number;
  medicineCount: number;
  saleCount: number;
  purchaseOrderCount: number;
  wholesaleOrderCount: number;
  marketingCampaignCount: number;
  announcementCount: number;
}

// 1. Realistic 120 Demo Pharmacies distributed across all key regions of Ethiopia
export const DEMO_PHARMACIES: DemoPharmacySpec[] = generate120DemoPharmacies();

// 2. Realistic Demo Wholesale Companies (The Primary Importing Organization & Partners)
export const DEMO_WHOLESALERS: (Partial<UserProfile> & { uid: string })[] = [
  {
    uid: 'demo_ws_ethiopha',
    email: 'contact@demo-ethiopha.et',
    role: 'importer',
    displayName: 'DEMO Wholesale Company A',
    importerName: 'DEMO Wholesale Company A (Ethio-Pharma Wholesalers & Importers PLC)',
    country: 'Ethiopia',
    region: 'Addis Ababa',
    city: 'Addis Ababa City',
    address: 'Bole Sub-City Woreda 03, Logistics Zone, Addis Ababa',
    verificationStatus: 'approved',
    createdAt: Date.now() - 150 * 24 * 60 * 60 * 1000,
    subscriptionType: 'premium',
    subscriptionStatus: 'active',
    // @ts-ignore
    isDemo: true
  },
  {
    uid: 'demo_ws_abyssinia',
    email: 'contact@demo-abyssinia.et',
    role: 'importer',
    displayName: 'DEMO Wholesale Company B',
    importerName: 'DEMO Wholesale Company B (Abyssinia Medical Distributors)',
    country: 'Ethiopia',
    region: 'Addis Ababa',
    city: 'Addis Ababa City',
    address: 'Akaki Kality Industrial Zone, Addis Ababa',
    verificationStatus: 'approved',
    createdAt: Date.now() - 130 * 24 * 60 * 60 * 1000,
    subscriptionType: 'premium',
    subscriptionStatus: 'active',
    // @ts-ignore
    isDemo: true
  },
  {
    uid: 'demo_ws_redsea',
    email: 'contact@demo-redsea.et',
    role: 'importer',
    displayName: 'DEMO Wholesale Company C',
    importerName: 'DEMO Wholesale Company C (Red Sea Pharmaceutical Importers)',
    country: 'Ethiopia',
    region: 'Dire Dawa',
    city: 'Dire Dawa',
    address: 'Free Trade Zone, Dire Dawa',
    verificationStatus: 'approved',
    createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
    subscriptionType: 'standard',
    subscriptionStatus: 'active',
    // @ts-ignore
    isDemo: true
  }
];

// 3. Master Medicine Catalog Templates
export interface DemoMedicineDef {
  key: string;
  name: string;
  genericName: string;
  category: string;
  dispensingUnit: string;
  purchaseUnit: string;
  costPrice: number;
  sellingPrice: number;
  supplier: string;
  isRx: boolean;
  demandTier: 'high' | 'medium' | 'low' | 'zero'; // for realistic demand simulation
}

export const DEMO_MEDICINE_CATALOG: DemoMedicineDef[] = [
  {
    key: 'paracetamol_500',
    name: 'Paracetamol 500mg Tablets (Box of 100)',
    genericName: 'Paracetamol / Acetaminophen',
    category: 'Analgesics & Antipyretics',
    dispensingUnit: 'Box',
    purchaseUnit: 'Box (10x10)',
    costPrice: 95.0,
    sellingPrice: 145.0,
    supplier: 'Ethio-Pharma Wholesalers',
    isRx: false,
    demandTier: 'high'
  },
  {
    key: 'amoxicillin_500',
    name: 'Amoxicillin 500mg Capsules (Box of 50)',
    genericName: 'Amoxicillin Trihydrate',
    category: 'Antibiotics',
    dispensingUnit: 'Box',
    purchaseUnit: 'Box (5x10)',
    costPrice: 190.0,
    sellingPrice: 280.0,
    supplier: 'Abyssinia Medical Distributors',
    isRx: true,
    demandTier: 'high'
  },
  {
    key: 'omeprazole_20',
    name: 'Omeprazole 20mg Delayed-Release Capsules (Strip of 14)',
    genericName: 'Omeprazole',
    category: 'Gastrointestinal',
    dispensingUnit: 'Strip',
    purchaseUnit: 'Box (2x7)',
    costPrice: 85.0,
    sellingPrice: 135.0,
    supplier: 'Red Sea Pharmaceutical Importers',
    isRx: false,
    demandTier: 'high'
  },
  {
    key: 'ibuprofen_400',
    name: 'Ibuprofen 400mg Film-Coated Tablets (Box of 30)',
    genericName: 'Ibuprofen',
    category: 'Pain Relief & NSAIDs',
    dispensingUnit: 'Box',
    purchaseUnit: 'Box (3x10)',
    costPrice: 110.0,
    sellingPrice: 175.0,
    supplier: 'Ethio-Pharma Wholesalers',
    isRx: false,
    demandTier: 'medium'
  },
  {
    key: 'metformin_500',
    name: 'Metformin HCl 500mg Tablets (Box of 100)',
    genericName: 'Metformin Hydrochloride',
    category: 'Antidiabetic',
    dispensingUnit: 'Box',
    purchaseUnit: 'Box (10x10)',
    costPrice: 210.0,
    sellingPrice: 320.0,
    supplier: 'Abyssinia Medical Distributors',
    isRx: true,
    demandTier: 'medium'
  },
  {
    key: 'azithromycin_500',
    name: 'Azithromycin 500mg Tablets (Pack of 3)',
    genericName: 'Azithromycin Dihydrate',
    category: 'Antibiotics',
    dispensingUnit: 'Pack',
    purchaseUnit: 'Pack of 3',
    costPrice: 140.0,
    sellingPrice: 230.0,
    supplier: 'Red Sea Pharmaceutical Importers',
    isRx: true,
    demandTier: 'medium'
  },
  {
    key: 'amlodipine_5',
    name: 'Amlodipine Besylate 5mg Tablets (Box of 30)',
    genericName: 'Amlodipine',
    category: 'Cardiovascular',
    dispensingUnit: 'Box',
    purchaseUnit: 'Box (3x10)',
    costPrice: 130.0,
    sellingPrice: 210.0,
    supplier: 'Abyssinia Medical Distributors',
    isRx: true,
    demandTier: 'medium'
  },
  {
    key: 'salbutamol_100',
    name: 'Salbutamol Inhaler 100mcg (200 Doses)',
    genericName: 'Salbutamol Sulfate',
    category: 'Respiratory',
    dispensingUnit: 'Inhaler Canister',
    purchaseUnit: 'Canister with Actuator',
    costPrice: 320.0,
    sellingPrice: 490.0,
    supplier: 'Ethio-Pharma Wholesalers',
    isRx: true,
    demandTier: 'medium'
  },
  {
    key: 'vitaminc_1000',
    name: 'Vitamin C 1000mg Effervescent Tablets (Tube of 20)',
    genericName: 'Ascorbic Acid + Zinc',
    category: 'Vitamins & Supplements',
    dispensingUnit: 'Tube',
    purchaseUnit: 'Tube of 20',
    costPrice: 180.0,
    sellingPrice: 295.0,
    supplier: 'Red Sea Pharmaceutical Importers',
    isRx: false,
    demandTier: 'high'
  },
  {
    key: 'cetirizine_10',
    name: 'Cetirizine 10mg Tablets (Box of 20)',
    genericName: 'Cetirizine Hydrochloride',
    category: 'Allergy & Antihistamines',
    dispensingUnit: 'Box',
    purchaseUnit: 'Box (2x10)',
    costPrice: 75.0,
    sellingPrice: 125.0,
    supplier: 'Ethio-Pharma Wholesalers',
    isRx: false,
    demandTier: 'low'
  },
  {
    key: 'atorvastatin_20',
    name: 'Atorvastatin 20mg Tablets (Box of 30)',
    genericName: 'Atorvastatin Calcium',
    category: 'Cardiovascular',
    dispensingUnit: 'Box',
    purchaseUnit: 'Box (3x10)',
    costPrice: 280.0,
    sellingPrice: 420.0,
    supplier: 'Abyssinia Medical Distributors',
    isRx: true,
    demandTier: 'low'
  },
  {
    key: 'clotrimazole_cream',
    name: 'Clotrimazole 1% Topical Cream (20g Tube)',
    genericName: 'Clotrimazole',
    category: 'Dermatology',
    dispensingUnit: 'Tube',
    purchaseUnit: '20g Aluminum Tube',
    costPrice: 65.0,
    sellingPrice: 110.0,
    supplier: 'Red Sea Pharmaceutical Importers',
    isRx: false,
    demandTier: 'low'
  },
  // Zero-sales inventory products to test Slow-moving / Zero-sales metrics
  {
    key: 'artemether_lumefantrine',
    name: 'Artemether-Lumefantrine 20/120mg Tablets (Box of 24)',
    genericName: 'Artemether + Lumefantrine',
    category: 'Antimalarials',
    dispensingUnit: 'Box',
    purchaseUnit: 'Box of 24',
    costPrice: 240.0,
    sellingPrice: 380.0,
    supplier: 'Ethio-Pharma Wholesalers',
    isRx: true,
    demandTier: 'zero'
  },
  {
    key: 'erythromycin_eye',
    name: 'Erythromycin 0.5% Ophthalmic Ointment (3.5g Tube)',
    genericName: 'Erythromycin Ophthalmic',
    category: 'Ophthalmic',
    dispensingUnit: 'Tube',
    purchaseUnit: 'Sterile Tube 3.5g',
    costPrice: 120.0,
    sellingPrice: 195.0,
    supplier: 'Abyssinia Medical Distributors',
    isRx: true,
    demandTier: 'zero'
  }
];

// Helper to commit document array in safe 400-doc Firestore batches
async function commitInBatches(collectionName: string, docs: any[]) {
  for (let i = 0; i < docs.length; i += 400) {
    const batch = writeBatch(db);
    const chunk = docs.slice(i, i + 400);
    chunk.forEach(d => {
      const docId = d.id || d.uid;
      const ref = doc(db, collectionName, docId);
      batch.set(ref, d);
    });
    await batch.commit();
  }
}

// Check status of demo data in Firestore
export async function checkDemoDataStatus(): Promise<DemoSeedStatus> {
  try {
    const [uSnap, mSnap, sSnap, poSnap, oSnap, adSnap, nSnap] = await Promise.all([
      getDocs(query(collection(db, 'users'), where('isDemo', '==', true))),
      getDocs(query(collection(db, 'medicines'), where('isDemo', '==', true))),
      getDocs(query(collection(db, 'sales'), where('isDemo', '==', true))),
      getDocs(query(collection(db, 'purchase_orders'), where('isDemo', '==', true))),
      getDocs(query(collection(db, 'orders'), where('isDemo', '==', true))),
      getDocs(query(collection(db, 'advertisements'), where('isDemo', '==', true))),
      getDocs(query(collection(db, 'notifications'), where('isDemo', '==', true)))
    ]);

    let pharmacyCount = 0;
    let wholesaleCount = 0;
    uSnap.docs.forEach(d => {
      const data = d.data();
      if (data.role === 'pharmacy') pharmacyCount++;
      if (data.role === 'importer' || data.role === 'distributor') wholesaleCount++;
    });

    return {
      isSeeded: !sSnap.empty && sSnap.docs.length > 0,
      pharmacyCount,
      wholesaleCount,
      medicineCount: mSnap.docs.length,
      saleCount: sSnap.docs.length,
      purchaseOrderCount: poSnap.docs.length,
      wholesaleOrderCount: oSnap.docs.length,
      marketingCampaignCount: adSnap.docs.length,
      announcementCount: nSnap.docs.length
    };
  } catch (err) {
    console.error('Failed to check demo status:', err);
    return {
      isSeeded: false,
      pharmacyCount: 0,
      wholesaleCount: 0,
      medicineCount: 0,
      saleCount: 0,
      purchaseOrderCount: 0,
      wholesaleOrderCount: 0,
      marketingCampaignCount: 0,
      announcementCount: 0
    };
  }
}

// Clear all demo data cleanly and safely (ONLY isDemo === true across all collections)
export async function clearDemoSalesData(): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    let deletedCount = 0;

    const collectionsToClean = [
      'sales',
      'medicines',
      'purchase_orders',
      'orders',
      'advertisements',
      'notifications',
      'marketing_invites',
      'users'
    ];

    for (const colName of collectionsToClean) {
      const q = query(collection(db, colName), where('isDemo', '==', true));
      const snap = await getDocs(q);
      
      const batches: WriteBatch[] = [];
      let currentBatch = writeBatch(db);
      let countInBatch = 0;

      snap.docs.forEach(d => {
        currentBatch.delete(doc(db, colName, d.id));
        countInBatch++;
        deletedCount++;
        if (countInBatch >= 450) {
          batches.push(currentBatch);
          currentBatch = writeBatch(db);
          countInBatch = 0;
        }
      });
      if (countInBatch > 0) batches.push(currentBatch);
      for (const b of batches) await b.commit();
    }

    return { success: true, deletedCount };
  } catch (err: any) {
    console.error('Error purging demo data:', err);
    return { success: false, deletedCount: 0, error: err.message };
  }
}

// Seed the complete demonstration network:
// 120 Pharmacies, Wholesalers & Wholesale Staff, Marketing Team, Inventory, Sales, POs, Wholesale Orders, Ads & Announcements
export async function seedDemoSalesData(): Promise<{
  success: boolean;
  stats: {
    pharmacies: number;
    wholesalers: number;
    wholesaleStaff: number;
    marketingStaff: number;
    medicines: number;
    sales: number;
    purchaseOrders: number;
    wholesaleOrders: number;
    advertisements: number;
    announcements: number;
  };
  error?: string;
}> {
  try {
    const now = Date.now();

    // 1. Purge previous demo data to ensure pristine idempotency
    await clearDemoSalesData();

    // 2. Seed Wholesalers and Wholesale Staff Accounts
    const allWholesaleUsers = [
      ...DEMO_WHOLESALERS,
      ...DEMO_WHOLESALE_STAFF
    ];
    await commitInBatches('users', allWholesaleUsers);

    // 3. Seed Marketing Team Members
    await commitInBatches('users', DEMO_MARKETING_MEMBERS);

    // 3b. Seed Marketing Onboarding Invites
    const marketingInvites = DEMO_MARKETING_MEMBERS.map(m => ({
      id: `demo_inv_${m.uid}`,
      name: m.displayName.replace('DEMO ', ''),
      email: m.email,
      country: m.country,
      city: m.city,
      shift: m.shift,
      salary: m.salary,
      promoCode: m.promoCode,
      currency: 'ETB',
      link: `https://atech-pharma.et/join?code=${m.promoCode}`,
      status: 'accepted',
      createdAt: m.createdAt,
      isDemo: true
    }));
    await commitInBatches('marketing_invites', marketingInvites);

    // 4. Seed 120 Demo Pharmacies (distributed with marketing member attribution)
    const pharmaciesWithAttribution = DEMO_PHARMACIES.map((pharm, idx) => {
      const assignedMarketer = DEMO_MARKETING_MEMBERS[idx % DEMO_MARKETING_MEMBERS.length];
      return {
        ...pharm,
        marketingId: assignedMarketer.uid,
        marketingPromoCode: assignedMarketer.promoCode,
        isDemo: true
      };
    });
    await commitInBatches('users', pharmaciesWithAttribution);

    // 5. Seed Inventory Medicines for all 120 Pharmacies
    // Every pharmacy stocks the catalog items with realistic pricing, stock levels and batch numbers
    const medicineDocs: any[] = [];
    pharmaciesWithAttribution.forEach(pharm => {
      DEMO_MEDICINE_CATALOG.forEach(medDef => {
        const medId = `${pharm.uid}_${medDef.key}`;
        // Realistic regional & pharmacy price jitter (+/- 4%)
        const priceJitter = 1 + ((medDef.key.length + pharm.uid.length) % 7 - 3) * 0.015;
        const sellingPrice = Math.round(medDef.sellingPrice * priceJitter);
        
        // Stock quantity based on volume tier
        const baseStock = 
          pharm.salesVolumeTier === 'flagship' ? 180 :
          pharm.salesVolumeTier === 'high' ? 120 :
          pharm.salesVolumeTier === 'medium' ? 70 : 40;

        const quantity = medDef.demandTier === 'zero' ? 30 : baseStock + ((medDef.key.length * 7) % 45);

        medicineDocs.push({
          id: medId,
          pharmacyId: pharm.uid,
          name: medDef.name,
          genericName: medDef.genericName,
          category: medDef.category,
          dispensingUnit: medDef.dispensingUnit,
          purchaseUnit: medDef.purchaseUnit,
          costPrice: medDef.costPrice,
          price: sellingPrice,
          quantity,
          batchNumber: `BATCH-ET-${(2026 + medDef.costPrice).toFixed(0).slice(-4)}`,
          expiryDate: '2027-12-31',
          supplier: medDef.supplier,
          lowStockThreshold: 15,
          createdAt: pharm.createdAt,
          isDemo: true
        });
      });
    });
    await commitInBatches('medicines', medicineDocs);

    // 6. Generate Realistic Demo Sales (Uneven Volume Across Flagship, High, Medium, Boutique)
    const activeSellingMeds = DEMO_MEDICINE_CATALOG.filter(m => m.demandTier !== 'zero');

    const customerNames = [
      'Abebe Bikila', 'Tigist Assefa', 'Dawit Kebede', 'Hiwot Haile', 
      'Yohannes Tadesse', 'Selamawit Desta', 'Mulugeta Berhanu', 'Almaz Ayana', 
      'Kenenisa Bekele', 'Meron Tesfaye', 'Natnael Girma', 'Bethlehem Tilahun',
      'Solomon Mengistu', 'Rahel Alemayehu', 'Yared Worku', 'Genet Zewde',
      'Daniel Kassa', 'Tsion Gebre', 'Bereket Wolde', 'Hanna Melaku'
    ];

    const salesDocs: any[] = [];
    let saleCounter = 1001;

    pharmaciesWithAttribution.forEach((pharm, pIdx) => {
      // Volume distribution based on tier
      const salesCount = 
        pharm.salesVolumeTier === 'flagship' ? 22 :
        pharm.salesVolumeTier === 'high' ? 14 :
        pharm.salesVolumeTier === 'medium' ? 8 : 4;

      for (let s = 0; s < salesCount; s++) {
        // Stagger sales across past 60 days
        const daysAgo = (s * 3 + pIdx) % 55;
        const hoursAgo = (s * 5 + pIdx * 2) % 24;
        const minutesAgo = (s * 11) % 60;
        const saleTimestamp = now - (daysAgo * 24 * 3600 * 1000) - (hoursAgo * 3600 * 1000) - (minutesAgo * 60 * 1000);

        // Basket size: 1 to 4 items
        const itemCount = (s % 3) + 1;
        const saleItems: any[] = [];
        let subtotal = 0;

        for (let it = 0; it < itemCount; it++) {
          let chosenMedDef: DemoMedicineDef;
          const roll = (s * 19 + it * 31 + pIdx * 7) % 100;
          if (roll < 55) {
            const highList = activeSellingMeds.filter(m => m.demandTier === 'high');
            chosenMedDef = highList[(s + it + pIdx) % highList.length];
          } else if (roll < 88) {
            const medList = activeSellingMeds.filter(m => m.demandTier === 'medium');
            chosenMedDef = medList[(s + it + pIdx) % medList.length];
          } else {
            const lowList = activeSellingMeds.filter(m => m.demandTier === 'low');
            chosenMedDef = lowList[(s + it + pIdx) % lowList.length];
          }

          if (saleItems.some(i => i.name === chosenMedDef.name)) continue;

          const qty = chosenMedDef.demandTier === 'high' ? ((s + it) % 3) + 1 : 1;
          const itemPrice = chosenMedDef.sellingPrice;
          const itemTotal = qty * itemPrice;

          saleItems.push({
            productId: `${pharm.uid}_${chosenMedDef.key}`,
            name: chosenMedDef.name,
            quantity: qty,
            price: itemPrice,
            costPrice: chosenMedDef.costPrice,
            total: itemTotal
          });

          subtotal += itemTotal;
        }

        if (saleItems.length === 0) continue;

        const hasDiscount = (s % 8 === 0);
        const discountAmount = hasDiscount ? Math.min(30, Math.round(subtotal * 0.05)) : 0;
        const totalAmount = subtotal - discountAmount;
        const paymentMethod = (s % 3 === 0) ? 'credit' : 'cash';
        const isWalkIn = (s % 2 === 0);
        const customerName = isWalkIn ? 'Walk-in Patient' : customerNames[(s + pIdx) % customerNames.length];
        const customerPhone = isWalkIn ? undefined : `+251 90 000 ${String(2000 + (s * 13 + pIdx) % 7000).slice(-4)} (DEMO)`;

        const hasRxItem = saleItems.some(it => {
          const mDef = DEMO_MEDICINE_CATALOG.find(m => m.name === it.name);
          return mDef?.isRx;
        });

        salesDocs.push({
          id: `demo_sale_${saleCounter++}`,
          pharmacyId: pharm.uid,
          branchId: pharm.branchCount > 1 ? `branch_${(s % pharm.branchCount) + 1}` : undefined,
          items: saleItems,
          subtotalAmount: subtotal,
          totalAmount,
          paymentMethod,
          customerName,
          customerPhone,
          createdAt: saleTimestamp,
          prescriptionVerified: hasRxItem,
          doctorName: hasRxItem ? 'Dr. DEMO Kassahun (Tikur Anbessa Hospital)' : undefined,
          isDemo: true
        });
      }
    });
    await commitInBatches('sales', salesDocs);

    // 7. Generate Purchase Orders (Connecting Pharmacies to Wholesalers for Inventory Replenishment)
    // 60-70 realistic purchase orders representing recurring consignments
    const poDocs: any[] = [];
    let poCounter = 201;

    // Pick a subset of active pharmacies from each region to have detailed PO records
    pharmaciesWithAttribution.forEach((pharm, pIdx) => {
      // Create POs for 50% of pharmacies
      if (pIdx % 2 !== 0) return;

      const w = DEMO_WHOLESALERS[pIdx % DEMO_WHOLESALERS.length];
      const wholesalerMeds = DEMO_MEDICINE_CATALOG.filter(m => 
        (w.uid === 'demo_ws_ethiopha' && m.supplier.includes('Ethio-Pharma')) ||
        (w.uid === 'demo_ws_abyssinia' && m.supplier.includes('Abyssinia')) ||
        (w.uid === 'demo_ws_redsea' && m.supplier.includes('Red Sea'))
      );

      if (wholesalerMeds.length === 0) return;

      const poCreatedAt = now - ((15 + (pIdx % 45)) * 24 * 3600 * 1000);
      let poTotal = 0;
      const poItems = wholesalerMeds.map(mDef => {
        const qty = 60 + ((pIdx * 5 + mDef.costPrice) % 50);
        const lineTotal = qty * mDef.costPrice;
        poTotal += lineTotal;
        return {
          productId: `${pharm.uid}_${mDef.key}`,
          name: mDef.name,
          quantity: Math.round(qty),
          unitPrice: mDef.costPrice,
          total: Math.round(lineTotal),
          quantityReceived: Math.round(qty),
          batchNumber: `BATCH-ET-${(2026 + mDef.costPrice).toFixed(0).slice(-4)}`,
          expiryDate: '2027-12-31'
        };
      });

      const poId = `demo_po_${pharm.uid.replace('demo_pharm_', '')}_${poCounter++}`;
      poDocs.push({
        id: poId,
        pharmacyId: pharm.uid,
        pharmacyName: pharm.pharmacyName,
        createdById: pharm.uid,
        createdByName: pharm.ownerName,
        createdAt: poCreatedAt,
        updatedAt: poCreatedAt + 2 * 24 * 3600 * 1000,
        status: (pIdx % 5 === 0) ? 'received_full' : 'completed',
        supplierId: w.uid,
        supplierName: w.importerName || w.displayName,
        supplierType: 'importer',
        items: poItems,
        totalAmount: Math.round(poTotal),
        invoiceNumber: `INV-ET-${poCounter}`,
        invoiceAmount: Math.round(poTotal),
        invoiceMatched: 'matched',
        notes: `Imported shipment cleared through customs and delivered to ${pharm.city}, ${pharm.area}. Bin cards updated.`,
        isDemo: true
      });
    });
    await commitInBatches('purchase_orders', poDocs);

    // 8. Generate Wholesale Orders (`orders` collection) linking Pharmacies, Wholesalers & Marketing Team
    // Demonstrates Wholesale Distribution fulfillment, shipping status & Marketing commissions
    const orderDocs: Order[] = [];
    let orderNum = 5001;

    pharmaciesWithAttribution.slice(0, 50).forEach((pharm, oIdx) => {
      const w = DEMO_WHOLESALERS[oIdx % DEMO_WHOLESALERS.length];
      const marketer = DEMO_MARKETING_MEMBERS[oIdx % DEMO_MARKETING_MEMBERS.length];
      const orderCreatedAt = now - ((5 + (oIdx % 35)) * 24 * 3600 * 1000);

      // Order items
      const sampleMeds = DEMO_MEDICINE_CATALOG.slice(oIdx % 4, (oIdx % 4) + 3);
      let orderTotal = 0;
      const orderItems = sampleMeds.map(mDef => {
        const qty = 25 + ((oIdx * 7) % 30);
        const price = mDef.costPrice;
        const lineTotal = qty * price;
        orderTotal += lineTotal;
        return {
          productId: mDef.key,
          name: mDef.name,
          quantity: qty,
          price,
          total: lineTotal
        };
      });

      const commissionAmount = Math.round(orderTotal * 0.05); // 5% marketing commission
      const orderStatuses: ('delivered' | 'shipped' | 'confirmed' | 'packed')[] = ['delivered', 'delivered', 'shipped', 'confirmed'];
      const status = orderStatuses[oIdx % orderStatuses.length];

      orderDocs.push({
        id: `demo_order_${orderNum++}`,
        orderNumber: `ORD-ET-${orderNum}`,
        pharmacyId: pharm.uid,
        pharmacyName: pharm.pharmacyName,
        pharmacyCreatedAt: pharm.createdAt,
        marketingId: marketer.uid,
        importerId: w.uid,
        importerName: w.importerName || w.displayName || 'Ethio-Pharma Wholesale',
        items: orderItems,
        totalAmount: orderTotal,
        commissionAmount,
        status,
        country: 'Ethiopia',
        region: pharm.region,
        createdAt: orderCreatedAt,
        deliveryMethod: 'delivery',
        deliveryAddress: pharm.address,
        distanceKm: 15 + ((oIdx * 19) % 180),
        deliveryFee: 450,
        // @ts-ignore
        isDemo: true
      });
    });
    await commitInBatches('orders', orderDocs);

    // 9. Generate Marketing Team Campaigns & Advertisements (`advertisements` collection)
    const advertisementDocs: (Advertisement & { isDemo: true })[] = [
      {
        id: 'demo_ad_amoxicillin_boost',
        importerId: 'demo_ws_abyssinia',
        importerName: 'DEMO Wholesale Company B (Abyssinia Medical)',
        productId: 'amoxicillin_500',
        productName: 'Amoxicillin 500mg Capsules (Box of 50)',
        type: 'sponsored',
        status: 'Active',
        startDate: new Date(now - 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
        endDate: new Date(now + 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
        priorityLevel: 'high',
        displayPosition: 'marketplace_top',
        headline: '🌟 Quality-Certified Amoxicillin 500mg - Bulk Import Offer',
        promotionalText: 'Direct batch importation with strict cold-chain compliance. Fast distribution across all Ethiopian regions.',
        description: 'Approved EFDA batch import with full Certificate of Analysis (CoA). Exclusive wholesale tiers for verified pharmacies.',
        ctaText: 'Order Consignment',
        linkTarget: 'marketplace',
        imagePreset: 'capsules',
        promotionType: 'Percentage Discount',
        discountPercent: 12,
        impressions: 4850,
        clicks: 342,
        revenueEst: 8500,
        bannerSource: 'agency',
        promoThemeColor: 'blue',
        createdAt: now - 15 * 24 * 3600 * 1000,
        updatedAt: now - 2 * 24 * 3600 * 1000,
        isDemo: true
      },
      {
        id: 'demo_ad_paracetamol_volume',
        importerId: 'demo_ws_ethiopha',
        importerName: 'DEMO Wholesale Company A (Ethio-Pharma Wholesalers)',
        productId: 'paracetamol_500',
        productName: 'Paracetamol 500mg Tablets (Box of 100)',
        type: 'banner',
        status: 'Active',
        startDate: new Date(now - 20 * 24 * 3600 * 1000).toISOString().split('T')[0],
        endDate: new Date(now + 20 * 24 * 3600 * 1000).toISOString().split('T')[0],
        priorityLevel: 'high',
        displayPosition: 'top_banner',
        headline: '⚡ Essential Analgesics Stock Guarantee — Ethio-Pharma',
        promotionalText: 'Guaranteed replenishment within 24h in Addis Ababa & 48h in regional regional hubs.',
        description: 'Partnered with 120+ pharmacies nationwide. Dependable supply of high-turnover essential remedies.',
        ctaText: 'View Inventory Catalog',
        linkTarget: 'marketplace',
        imagePreset: 'pills',
        promotionType: 'Free Shipping',
        discountPercent: 0,
        impressions: 6200,
        clicks: 512,
        revenueEst: 11200,
        bannerSource: 'agency',
        promoThemeColor: 'emerald',
        createdAt: now - 20 * 24 * 3600 * 1000,
        updatedAt: now - 1 * 24 * 3600 * 1000,
        isDemo: true
      },
      {
        id: 'demo_ad_vitaminc_campaign',
        importerId: 'demo_ws_redsea',
        importerName: 'DEMO Wholesale Company C (Red Sea Pharmaceutical)',
        productId: 'vitaminc_1000',
        productName: 'Vitamin C 1000mg Effervescent Tablets (Tube of 20)',
        type: 'sponsored',
        status: 'Active',
        startDate: new Date(now - 10 * 24 * 3600 * 1000).toISOString().split('T')[0],
        endDate: new Date(now + 25 * 24 * 3600 * 1000).toISOString().split('T')[0],
        priorityLevel: 'medium',
        displayPosition: 'marketplace_top',
        headline: '🍊 Premium Vitamin C & Zinc Effervescent — High Consumer Demand',
        promotionalText: 'Direct importation via Free Trade Zone. High margin product for community pharmacies.',
        description: 'Consumer favorite for immune support. Display cartons included for retail counter presentation.',
        ctaText: 'Request Wholesale Quote',
        linkTarget: 'marketplace',
        imagePreset: 'syrup',
        promotionType: 'Percentage Discount',
        discountPercent: 15,
        impressions: 3100,
        clicks: 215,
        revenueEst: 5400,
        bannerSource: 'agency',
        promoThemeColor: 'amber',
        createdAt: now - 10 * 24 * 3600 * 1000,
        updatedAt: now - 3 * 24 * 3600 * 1000,
        isDemo: true
      },
      {
        id: 'demo_ad_salbutamol_respiratory',
        importerId: 'demo_ws_ethiopha',
        importerName: 'DEMO Wholesale Company A (Ethio-Pharma Wholesalers)',
        productId: 'salbutamol_100',
        productName: 'Salbutamol Inhaler 100mcg (200 Doses)',
        type: 'sponsored',
        status: 'Approved',
        startDate: new Date(now - 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
        endDate: new Date(now + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        priorityLevel: 'medium',
        displayPosition: 'marketplace_grid',
        headline: '🫁 Certified Respiratory Inhalers — Batch Ready for Dispatch',
        promotionalText: 'WHO-GMP certified production with batch verification barcodes.',
        description: 'Essential respiratory care inventory for clinical dispensaries and urban hospital pharmacies.',
        ctaText: 'Order Restock',
        linkTarget: 'marketplace',
        imagePreset: 'vaccine',
        promotionType: 'Volume Tier',
        discountPercent: 8,
        impressions: 1420,
        clicks: 98,
        revenueEst: 3200,
        bannerSource: 'agency',
        promoThemeColor: 'purple',
        createdAt: now - 5 * 24 * 3600 * 1000,
        updatedAt: now - 1 * 24 * 3600 * 1000,
        isDemo: true
      }
    ];
    await commitInBatches('advertisements', advertisementDocs);

    // 10. Generate Targeted Marketing & Regulatory Announcements (`notifications` collection)
    const notificationDocs: (Notification & { isDemo: true })[] = [
      {
        id: 'demo_notif_all_network',
        title: '📢 ATECH National Import Network Update: Q3 Essential Medicines Dispatch',
        message: 'Ethio-Pharma Wholesalers and regional distribution partners announce scheduled delivery runs for Paracetamol, Amoxicillin, and Omeprazole consignments across all 120 partner pharmacies in Addis Ababa, Oromia, Amhara, and Sidama.',
        target: 'all',
        senderId: 'demo_ws_staff_logistics',
        createdAt: now - 3 * 24 * 3600 * 1000,
        isDemo: true
      },
      {
        id: 'demo_notif_pharmacies_promo',
        title: '🎯 Special Wholesale Terms on Essential Antibiotics (Code: SELAM2026)',
        message: 'The marketing and clinical outreach team is pleased to offer 12% off bulk orders of Amoxicillin 500mg and Azithromycin 500mg through our wholesale distributor portal. Apply code SELAM2026 on your next purchase order.',
        target: 'pharmacies',
        senderId: 'demo_mkt_member_01',
        createdAt: now - 7 * 24 * 3600 * 1000,
        isDemo: true
      },
      {
        id: 'demo_notif_region_oromia',
        title: '🚚 Regional Route Dispatch: Adama, Bishoftu & Jimma Corridors',
        message: 'Cold-chain delivery vehicles departed the central logistics hub. Expected delivery to Adama and Bishoftu pharmacies within 6 hours. Jimma deliveries scheduled for tomorrow morning.',
        target: 'region',
        targetRegion: 'Ethiopia',
        senderId: 'demo_ws_staff_central',
        createdAt: now - 1 * 24 * 3600 * 1000,
        isDemo: true
      },
      {
        id: 'demo_notif_importers_compliance',
        title: '📋 EFDA Batch Traceability & Digital Invoicing Protocol Reminder',
        message: 'All wholesale distributors and port agents must verify digital batch inspection certificates before releasing medical shipments to regional pharmacy consignees.',
        target: 'importers',
        senderId: 'demo_ws_staff_logistics',
        createdAt: now - 12 * 24 * 3600 * 1000,
        isDemo: true
      }
    ];
    await commitInBatches('notifications', notificationDocs);

    return {
      success: true,
      stats: {
        pharmacies: pharmaciesWithAttribution.length,
        wholesalers: DEMO_WHOLESALERS.length,
        wholesaleStaff: DEMO_WHOLESALE_STAFF.length,
        marketingStaff: DEMO_MARKETING_MEMBERS.length,
        medicines: medicineDocs.length,
        sales: salesDocs.length,
        purchaseOrders: poDocs.length,
        wholesaleOrders: orderDocs.length,
        advertisements: advertisementDocs.length,
        announcements: notificationDocs.length
      }
    };
  } catch (err: any) {
    console.error('Failed to seed demo sales data:', err);
    return {
      success: false,
      stats: {
        pharmacies: 0,
        wholesalers: 0,
        wholesaleStaff: 0,
        marketingStaff: 0,
        medicines: 0,
        sales: 0,
        purchaseOrders: 0,
        wholesaleOrders: 0,
        advertisements: 0,
        announcements: 0
      },
      error: err.message
    };
  }
}
