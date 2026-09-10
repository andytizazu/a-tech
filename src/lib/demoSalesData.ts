import { 
  collection, 
  doc, 
  getDocs, 
  writeBatch, 
  query, 
  where,
  limit 
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, InventoryProduct, Sale } from '../types';

export interface DemoSeedStatus {
  isSeeded: boolean;
  pharmacyCount: number;
  medicineCount: number;
  saleCount: number;
  wholesaleCount: number;
  purchaseOrderCount: number;
}

// 1. Realistic Demo Pharmacies across multiple Ethiopian cities
export const DEMO_PHARMACIES: (Partial<UserProfile> & { uid: string })[] = [
  {
    uid: 'demo_pharm_addis_01',
    email: 'demo.addis01@atech-pharma.et',
    role: 'pharmacy',
    displayName: 'DEMO Addis Pharmacy 01',
    pharmacyName: 'DEMO Addis Pharmacy 01 (Bole Central)',
    country: 'Ethiopia',
    region: 'Addis Ababa',
    city: 'Addis Ababa City',
    address: 'Bole Medhanealem Road, Sub-City Bole, Addis Ababa',
    verificationStatus: 'approved',
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
    subscriptionType: 'premium',
    subscriptionStatus: 'active',
    // @ts-ignore
    isDemo: true
  },
  {
    uid: 'demo_pharm_addis_02',
    email: 'demo.addis02@atech-pharma.et',
    role: 'pharmacy',
    displayName: 'DEMO Addis Pharmacy 02',
    pharmacyName: 'DEMO Addis Pharmacy 02 (Piazza Care)',
    country: 'Ethiopia',
    region: 'Addis Ababa',
    city: 'Addis Ababa City',
    address: 'Churchill Ave, Arada Sub-City, Addis Ababa',
    verificationStatus: 'approved',
    createdAt: Date.now() - 85 * 24 * 60 * 60 * 1000,
    subscriptionType: 'standard',
    subscriptionStatus: 'active',
    // @ts-ignore
    isDemo: true
  },
  {
    uid: 'demo_pharm_addis_03',
    email: 'demo.addis03@atech-pharma.et',
    role: 'pharmacy',
    displayName: 'DEMO Addis Pharmacy 03',
    pharmacyName: 'DEMO Addis Pharmacy 03 (Yeka Heights)',
    country: 'Ethiopia',
    region: 'Addis Ababa',
    city: 'Addis Ababa City',
    address: 'Megenagna Square, Yeka Sub-City, Addis Ababa',
    verificationStatus: 'approved',
    createdAt: Date.now() - 70 * 24 * 60 * 60 * 1000,
    subscriptionType: 'basic',
    subscriptionStatus: 'active',
    // @ts-ignore
    isDemo: true
  },
  {
    uid: 'demo_pharm_adama_01',
    email: 'demo.adama01@atech-pharma.et',
    role: 'pharmacy',
    displayName: 'DEMO Adama Pharmacy 01',
    pharmacyName: 'DEMO Adama Pharmacy 01 (Rift Valley Rx)',
    country: 'Ethiopia',
    region: 'Oromia',
    city: 'Adama',
    address: 'Posta Bet Road, Kebele 03, Adama City',
    verificationStatus: 'approved',
    createdAt: Date.now() - 80 * 24 * 60 * 60 * 1000,
    subscriptionType: 'standard',
    subscriptionStatus: 'active',
    // @ts-ignore
    isDemo: true
  },
  {
    uid: 'demo_pharm_hawassa_01',
    email: 'demo.hawassa01@atech-pharma.et',
    role: 'pharmacy',
    displayName: 'DEMO Hawassa Pharmacy 01',
    pharmacyName: 'DEMO Hawassa Pharmacy 01 (Lake City Pharma)',
    country: 'Ethiopia',
    region: 'Sidama',
    city: 'Hawassa',
    address: 'Main Avenue, Kebele 05, Hawassa City',
    verificationStatus: 'approved',
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    subscriptionType: 'standard',
    subscriptionStatus: 'active',
    // @ts-ignore
    isDemo: true
  },
  {
    uid: 'demo_pharm_diredawa_01',
    email: 'demo.diredawa01@atech-pharma.et',
    role: 'pharmacy',
    displayName: 'DEMO Dire Dawa Pharmacy 01',
    pharmacyName: 'DEMO Dire Dawa Pharmacy 01 (Eastern Gateway)',
    country: 'Ethiopia',
    region: 'Dire Dawa',
    city: 'Dire Dawa',
    address: 'Kebele 02, Commercial District, Dire Dawa',
    verificationStatus: 'approved',
    createdAt: Date.now() - 75 * 24 * 60 * 60 * 1000,
    subscriptionType: 'basic',
    subscriptionStatus: 'active',
    // @ts-ignore
    isDemo: true
  }
];

// 2. Realistic Demo Wholesale Companies (Ready for Prompt 2 Wholesale & Supplier Traceability)
export const DEMO_WHOLESALERS: (Partial<UserProfile> & { uid: string })[] = [
  {
    uid: 'demo_ws_ethiopha',
    email: 'contact@demo-ethiopha.et',
    role: 'importer',
    displayName: 'DEMO Wholesale Company A',
    importerName: 'DEMO Wholesale Company A (Ethio-Pharma Wholesalers)',
    country: 'Ethiopia',
    region: 'Addis Ababa',
    city: 'Addis Ababa City',
    address: 'Bole Sub-City Woreda 03, Logistics Zone, Addis Ababa',
    verificationStatus: 'approved',
    createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
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
    createdAt: Date.now() - 110 * 24 * 60 * 60 * 1000,
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
    createdAt: Date.now() - 100 * 24 * 60 * 60 * 1000,
    subscriptionType: 'standard',
    subscriptionStatus: 'active',
    // @ts-ignore
    isDemo: true
  }
];

// 3. Medicine Catalog Templates
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
  // Zero-sales inventory products to test Requirement 5 (NO SALES / SLOW MOVING)
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

// Check status of demo data in Firestore
export async function checkDemoDataStatus(): Promise<DemoSeedStatus> {
  try {
    const usersQ = query(collection(db, 'users'), where('isDemo', '==', true));
    const medsQ = query(collection(db, 'medicines'), where('isDemo', '==', true));
    const salesQ = query(collection(db, 'sales'), where('isDemo', '==', true));
    const poQ = query(collection(db, 'purchase_orders'), where('isDemo', '==', true));

    const [uSnap, mSnap, sSnap, poSnap] = await Promise.all([
      getDocs(usersQ),
      getDocs(medsQ),
      getDocs(salesQ),
      getDocs(poQ)
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
      purchaseOrderCount: poSnap.docs.length
    };
  } catch (err) {
    console.error('Failed to check demo status:', err);
    return {
      isSeeded: false,
      pharmacyCount: 0,
      wholesaleCount: 0,
      medicineCount: 0,
      saleCount: 0,
      purchaseOrderCount: 0
    };
  }
}

// Clear all demo data cleanly and safely (ONLY isDemo === true)
export async function clearDemoSalesData(): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    let deletedCount = 0;

    // 1. Delete Demo Sales
    const salesQ = query(collection(db, 'sales'), where('isDemo', '==', true));
    const sSnap = await getDocs(salesQ);
    const sBatches: any[] = [];
    let currentBatch = writeBatch(db);
    let countInBatch = 0;

    sSnap.docs.forEach(d => {
      currentBatch.delete(doc(db, 'sales', d.id));
      countInBatch++;
      deletedCount++;
      if (countInBatch >= 450) {
        sBatches.push(currentBatch);
        currentBatch = writeBatch(db);
        countInBatch = 0;
      }
    });
    if (countInBatch > 0) sBatches.push(currentBatch);
    for (const b of sBatches) await b.commit();

    // 2. Delete Demo Medicines
    const medsQ = query(collection(db, 'medicines'), where('isDemo', '==', true));
    const mSnap = await getDocs(medsQ);
    const mBatches: any[] = [];
    currentBatch = writeBatch(db);
    countInBatch = 0;

    mSnap.docs.forEach(d => {
      currentBatch.delete(doc(db, 'medicines', d.id));
      countInBatch++;
      deletedCount++;
      if (countInBatch >= 450) {
        mBatches.push(currentBatch);
        currentBatch = writeBatch(db);
        countInBatch = 0;
      }
    });
    if (countInBatch > 0) mBatches.push(currentBatch);
    for (const b of mBatches) await b.commit();

    // 3. Delete Demo Purchase Orders
    const poQ = query(collection(db, 'purchase_orders'), where('isDemo', '==', true));
    const poSnap = await getDocs(poQ);
    const poBatches: any[] = [];
    currentBatch = writeBatch(db);
    countInBatch = 0;

    poSnap.docs.forEach(d => {
      currentBatch.delete(doc(db, 'purchase_orders', d.id));
      countInBatch++;
      deletedCount++;
      if (countInBatch >= 450) {
        poBatches.push(currentBatch);
        currentBatch = writeBatch(db);
        countInBatch = 0;
      }
    });
    if (countInBatch > 0) poBatches.push(currentBatch);
    for (const b of poBatches) await b.commit();

    // 4. Delete Demo Users (Pharmacies & Wholesalers)
    const usersQ = query(collection(db, 'users'), where('isDemo', '==', true));
    const uSnap = await getDocs(usersQ);
    const uBatches: any[] = [];
    currentBatch = writeBatch(db);
    countInBatch = 0;

    uSnap.docs.forEach(d => {
      currentBatch.delete(doc(db, 'users', d.id));
      countInBatch++;
      deletedCount++;
      if (countInBatch >= 450) {
        uBatches.push(currentBatch);
        currentBatch = writeBatch(db);
        countInBatch = 0;
      }
    });
    if (countInBatch > 0) uBatches.push(currentBatch);
    for (const b of uBatches) await b.commit();

    return { success: true, deletedCount };
  } catch (err: any) {
    console.error('Error purging demo data:', err);
    return { success: false, deletedCount: 0, error: err.message };
  }
}

// Seed comprehensive, realistic demo data with geographic hierarchy and uneven demand
export async function seedDemoSalesData(): Promise<{ success: boolean; stats: { pharmacies: number; wholesalers: number; medicines: number; sales: number; purchaseOrders?: number }; error?: string }> {
  try {
    // 1. First purge any previous demo records to ensure strict idempotency and clean state
    await clearDemoSalesData();

    // 2. Seed Demo Wholesalers
    const uBatch1 = writeBatch(db);
    DEMO_WHOLESALERS.forEach(w => {
      const ref = doc(db, 'users', w.uid);
      uBatch1.set(ref, w);
    });
    await uBatch1.commit();

    // 3. Seed Demo Pharmacies
    const uBatch2 = writeBatch(db);
    DEMO_PHARMACIES.forEach(p => {
      const ref = doc(db, 'users', p.uid);
      uBatch2.set(ref, p);
    });
    await uBatch2.commit();

    // 4. Seed Inventory Medicines for each pharmacy
    // Every pharmacy stocks the catalog items, with realistic stock levels and prices
    const medicineDocs: any[] = [];
    DEMO_PHARMACIES.forEach(pharm => {
      DEMO_MEDICINE_CATALOG.forEach(medDef => {
        const medId = `${pharm.uid}_${medDef.key}`;
        // Slight natural price variation per pharmacy (+/- 5%)
        const priceJitter = 1 + ((medDef.key.length % 7) - 3) * 0.02;
        const sellingPrice = Math.round(medDef.sellingPrice * priceJitter);
        
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
          quantity: medDef.demandTier === 'zero' ? 35 : 120 + ((medDef.key.length * 13) % 80),
          batchNumber: `BATCH-ET-${(2026 + medDef.costPrice).toFixed(0).slice(-4)}`,
          expiryDate: '2027-11-30',
          supplier: medDef.supplier,
          lowStockThreshold: 15,
          createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
          isDemo: true
        });
      });
    });

    // Write medicines in batches
    for (let i = 0; i < medicineDocs.length; i += 400) {
      const batch = writeBatch(db);
      medicineDocs.slice(i, i + 400).forEach(m => {
        const ref = doc(db, 'medicines', m.id);
        batch.set(ref, m);
      });
      await batch.commit();
    }

    // 5. Generate Realistic Demo Sales
    // We create realistic uneven distribution:
    // Addis 01: High volume (45 sales)
    // Addis 02: Moderate-high volume (35 sales)
    // Addis 03: Moderate volume (25 sales)
    // Adama 01: Strong regional volume (30 sales)
    // Hawassa 01: Regional volume (20 sales)
    // Dire Dawa 01: Regional volume (18 sales)
    const pharmacySalesWeights: Record<string, number> = {
      'demo_pharm_addis_01': 45,
      'demo_pharm_addis_02': 35,
      'demo_pharm_addis_03': 25,
      'demo_pharm_adama_01': 30,
      'demo_pharm_hawassa_01': 20,
      'demo_pharm_diredawa_01': 18,
    };

    // Filter active selling medicines (excluding 'zero' demand tier to test zero-sales inventory)
    const activeSellingMeds = DEMO_MEDICINE_CATALOG.filter(m => m.demandTier !== 'zero');

    const customerNames = [
      'Abebe Bikila', 'Tigist Assefa', 'Dawit Kebede', 'Hiwot Haile', 
      'Yohannes Tadesse', 'Selamawit Desta', 'Mulugeta Berhanu', 'Almaz Ayana', 
      'Kenenisa Bekele', 'Meron Tesfaye', 'Natnael Girma', 'Bethlehem Tilahun'
    ];

    const salesDocs: any[] = [];
    let saleCounter = 1001;
    const now = Date.now();

    DEMO_PHARMACIES.forEach(pharm => {
      const targetSalesCount = pharmacySalesWeights[pharm.uid] || 20;

      for (let s = 0; s < targetSalesCount; s++) {
        // Stagger sales over the last 45 days
        const daysAgo = (s % 45) + (s * 3 % 5);
        const hoursAgo = (s * 7) % 24;
        const minutesAgo = (s * 13) % 60;
        const saleTimestamp = now - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 3600 * 1000) - (minutesAgo * 60 * 1000);

        // Basket size: 1 to 4 items
        const itemCount = (s % 4) + 1;
        const saleItems: any[] = [];
        let subtotal = 0;

        for (let it = 0; it < itemCount; it++) {
          // Select item based on demand tier probability
          let chosenMedDef: DemoMedicineDef;
          const roll = (s * 17 + it * 23) % 100;
          if (roll < 55) {
            // High demand item
            const highDemandList = activeSellingMeds.filter(m => m.demandTier === 'high');
            chosenMedDef = highDemandList[(s + it) % highDemandList.length];
          } else if (roll < 88) {
            // Medium demand item
            const medDemandList = activeSellingMeds.filter(m => m.demandTier === 'medium');
            chosenMedDef = medDemandList[(s + it) % medDemandList.length];
          } else {
            // Low demand item
            const lowDemandList = activeSellingMeds.filter(m => m.demandTier === 'low');
            chosenMedDef = lowDemandList[(s + it) % lowDemandList.length];
          }

          // Avoid duplicate items in same sale
          if (saleItems.some(i => i.name === chosenMedDef.name)) {
            continue;
          }

          // Quantity sold: 1 to 5 units (higher for paracetamol / amoxicillin)
          const qty = chosenMedDef.demandTier === 'high' ? ((s + it) % 4) + 1 : ((s + it) % 2) + 1;
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

        // Occasional discount (10% of sales get a small 5-15 ETB loyalty discount)
        const hasDiscount = (s % 10 === 0);
        const discountAmount = hasDiscount ? Math.min(25, Math.round(subtotal * 0.05)) : 0;
        const totalAmount = subtotal - discountAmount;
        const paymentMethod = (s % 3 === 0) ? 'credit' : 'cash';
        const isWalkIn = (s % 3 !== 0);
        const customerName = isWalkIn ? 'Walk-in Patient' : customerNames[s % customerNames.length];
        const customerPhone = isWalkIn ? undefined : `+251 91 ${100000 + (s * 37) % 899999}`;

        // Prescription flag if items contain antibiotics or cardiovascular
        const hasRxItem = saleItems.some(it => {
          const medDef = DEMO_MEDICINE_CATALOG.find(m => m.name === it.name);
          return medDef?.isRx;
        });

        salesDocs.push({
          id: `demo_sale_${saleCounter++}`,
          pharmacyId: pharm.uid,
          items: saleItems,
          subtotalAmount: subtotal,
          discountAmount,
          totalAmount,
          paymentMethod,
          customerName,
          customerPhone,
          prescriptionId: hasRxItem ? `RX-${pharm.city?.substring(0, 3).toUpperCase()}-${saleCounter}` : null,
          createdAt: saleTimestamp,
          isDemo: true
        });
      }
    });

    // Write sales in batches
    for (let i = 0; i < salesDocs.length; i += 400) {
      const batch = writeBatch(db);
      salesDocs.slice(i, i + 400).forEach(s => {
        const ref = doc(db, 'sales', s.id);
        batch.set(ref, s);
      });
      await batch.commit();
    }

    // 6. Generate Realistic Demo Purchase Orders linking Pharmacies to Wholesalers
    const poDocs: any[] = [];
    let poCounter = 101;

    DEMO_PHARMACIES.forEach(pharm => {
      DEMO_WHOLESALERS.forEach((w, wIdx) => {
        // Find which medicine catalog products belong to this wholesaler
        const wholesalerMeds = DEMO_MEDICINE_CATALOG.filter(m => 
          m.supplier.toLowerCase().includes(w.displayName?.toLowerCase().replace('demo wholesale company ', '').trim() || '') ||
          (w.uid === 'demo_ws_ethiopha' && m.supplier.includes('Ethio-Pharma')) ||
          (w.uid === 'demo_ws_abyssinia' && m.supplier.includes('Abyssinia')) ||
          (w.uid === 'demo_ws_redsea' && m.supplier.includes('Red Sea'))
        );

        if (wholesalerMeds.length === 0) return;

        // Create 2 POs per wholesaler-pharmacy pair:
        // PO 1: Initial Bulk Procurement (65 days ago, completed)
        // PO 2: Mid-term Replenishment (20 days ago, received)
        const schedules = [
          { daysAgo: 65, status: 'completed' as const, suffix: '1' },
          { daysAgo: 20, status: 'received_full' as const, suffix: '2' }
        ];

        schedules.forEach(sched => {
          const poId = `demo_po_${pharm.uid.replace('demo_pharm_', '')}_${w.uid.replace('demo_ws_', '')}_${sched.suffix}`;
          const poCreatedAt = now - (sched.daysAgo * 24 * 60 * 60 * 1000);
          
          let poTotal = 0;
          const poItems = wholesalerMeds.map(mDef => {
            const qty = sched.suffix === '1' ? 120 + ((mDef.costPrice * 7) % 60) : 50 + ((mDef.costPrice * 3) % 40);
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
              expiryDate: '2027-11-30'
            };
          });

          poDocs.push({
            id: poId,
            pharmacyId: pharm.uid,
            pharmacyName: pharm.pharmacyName || pharm.displayName || 'Demo Pharmacy',
            createdById: pharm.uid,
            createdByName: pharm.displayName || 'Pharmacy Superintendent',
            createdAt: poCreatedAt,
            updatedAt: poCreatedAt + 2 * 24 * 3600 * 1000,
            status: sched.status,
            supplierId: w.uid,
            supplierName: w.importerName || w.displayName || 'Wholesale Supplier',
            supplierType: 'importer',
            items: poItems,
            totalAmount: Math.round(poTotal),
            invoiceNumber: `INV-ET-${poCounter++}`,
            invoiceAmount: Math.round(poTotal),
            invoiceMatched: 'matched',
            notes: `Consignment shipment delivered via certified medical transport to ${pharm.city}. Quality inspected and registered in bin cards.`,
            isDemo: true
          });
        });
      });
    });

    // Write POs in batches
    for (let i = 0; i < poDocs.length; i += 400) {
      const batch = writeBatch(db);
      poDocs.slice(i, i + 400).forEach(po => {
        const ref = doc(db, 'purchase_orders', po.id);
        batch.set(ref, po);
      });
      await batch.commit();
    }

    return {
      success: true,
      stats: {
        pharmacies: DEMO_PHARMACIES.length,
        wholesalers: DEMO_WHOLESALERS.length,
        medicines: medicineDocs.length,
        sales: salesDocs.length,
        purchaseOrders: poDocs.length
      }
    };
  } catch (err: any) {
    console.error('Failed to seed demo sales data:', err);
    return {
      success: false,
      stats: { pharmacies: 0, wholesalers: 0, medicines: 0, sales: 0 },
      error: err.message
    };
  }
}
