/**
 * Pharmaceutical & Medical Supply Unit Configuration
 * Maps purchase packaging units (e.g. Box, Pack, Bottle, Tube, etc.)
 * to their clinically and logically relatable dispensing units,
 * along with recommended conversion factors.
 */

export interface RelatedDispensingUnit {
  unit: string;
  defaultFactor: number;
  hint: string;
}

export interface PurchaseUnitOption {
  id: string;
  name: string;
  category: 'Solid Dose' | 'Liquid / Injectable' | 'Topical / Inhalant' | 'Bulk / Packaging' | 'Consumables & Devices' | 'Other';
  description: string;
  relatedDispensingUnits: RelatedDispensingUnit[];
}

export const PURCHASE_UNIT_OPTIONS: PurchaseUnitOption[] = [
  {
    id: 'Box',
    name: 'Box',
    category: 'Bulk / Packaging',
    description: 'Standard cardboard packaging for blister strips, ampoules, or tubes',
    relatedDispensingUnits: [
      { unit: 'Strip', defaultFactor: 10, hint: '1 Box = 10 Blister Strips (Most Common)' },
      { unit: 'Tablet', defaultFactor: 100, hint: '1 Box = 100 Tablets total' },
      { unit: 'Capsule', defaultFactor: 100, hint: '1 Box = 100 Capsules total' },
      { unit: 'Ampoule', defaultFactor: 10, hint: '1 Box = 10 Injection Ampoules' },
      { unit: 'Vial', defaultFactor: 10, hint: '1 Box = 10 Vials' },
      { unit: 'Sachet', defaultFactor: 20, hint: '1 Box = 20 Powder Sachets' },
      { unit: 'Bottle', defaultFactor: 12, hint: '1 Box = 12 Bottles' },
      { unit: 'Tube', defaultFactor: 10, hint: '1 Box = 10 Ointment Tubes' },
      { unit: 'Suppository', defaultFactor: 10, hint: '1 Box = 10 Suppositories' },
      { unit: 'Piece', defaultFactor: 24, hint: '1 Box = 24 Individual items' },
      { unit: 'Blister', defaultFactor: 10, hint: '1 Box = 10 Blisters' }
    ]
  },
  {
    id: 'Pack',
    name: 'Pack',
    category: 'Bulk / Packaging',
    description: 'Multi-item blister pack, wallet pack, or retail bundle',
    relatedDispensingUnits: [
      { unit: 'Tablet', defaultFactor: 10, hint: '1 Pack = 10 Tablets' },
      { unit: 'Capsule', defaultFactor: 10, hint: '1 Pack = 10 Capsules' },
      { unit: 'Strip', defaultFactor: 3, hint: '1 Pack = 3 Strips' },
      { unit: 'Sachet', defaultFactor: 10, hint: '1 Pack = 10 Sachets' },
      { unit: 'Piece', defaultFactor: 1, hint: '1 Pack = 1 Unit item' },
      { unit: 'Swab / Wipe', defaultFactor: 100, hint: '1 Pack = 100 Prep Swabs' },
      { unit: 'Patch', defaultFactor: 5, hint: '1 Pack = 5 Transdermal Patches' },
      { unit: 'Ampoule', defaultFactor: 5, hint: '1 Pack = 5 Ampoules' }
    ]
  },
  {
    id: 'Bottle',
    name: 'Bottle',
    category: 'Liquid / Injectable',
    description: 'Oral suspensions, syrups, drop bottles, or bulk tablet bottles',
    relatedDispensingUnits: [
      { unit: 'ml (Milliliter)', defaultFactor: 100, hint: '1 Bottle = 100 ml syrup/suspension' },
      { unit: 'Tablet', defaultFactor: 60, hint: '1 Bottle = 60 Loose Tablets' },
      { unit: 'Capsule', defaultFactor: 60, hint: '1 Bottle = 60 Loose Capsules' },
      { unit: 'Drops', defaultFactor: 300, hint: '1 Bottle = 300 Drops (~15ml ophthalmic)' },
      { unit: 'Dose', defaultFactor: 20, hint: '1 Bottle = 20 liquid doses (5ml each)' },
      { unit: 'Bottle (Intact)', defaultFactor: 1, hint: 'Dispense 1 whole unopened bottle' }
    ]
  },
  {
    id: 'Strip',
    name: 'Strip',
    category: 'Solid Dose',
    description: 'Single aluminium / PVC blister strip of tablets or capsules',
    relatedDispensingUnits: [
      { unit: 'Tablet', defaultFactor: 10, hint: '1 Strip = 10 Tablets' },
      { unit: 'Capsule', defaultFactor: 10, hint: '1 Strip = 10 Capsules' },
      { unit: 'Pill', defaultFactor: 10, hint: '1 Strip = 10 Pills' },
      { unit: 'Strip (Intact)', defaultFactor: 1, hint: 'Dispense 1 complete strip' }
    ]
  },
  {
    id: 'Carton',
    name: 'Carton',
    category: 'Bulk / Packaging',
    description: 'Outer wholesale shipper case containing multiple boxes or bottles',
    relatedDispensingUnits: [
      { unit: 'Box', defaultFactor: 24, hint: '1 Carton = 24 Boxes' },
      { unit: 'Pack', defaultFactor: 50, hint: '1 Carton = 50 Packs' },
      { unit: 'Bottle', defaultFactor: 48, hint: '1 Carton = 48 Bottles' },
      { unit: 'Vial', defaultFactor: 100, hint: '1 Carton = 100 Vials' },
      { unit: 'Strip', defaultFactor: 240, hint: '1 Carton = 240 Strips' },
      { unit: 'Piece', defaultFactor: 100, hint: '1 Carton = 100 Pieces' }
    ]
  },
  {
    id: 'Tube',
    name: 'Tube',
    category: 'Topical / Inhalant',
    description: 'Aluminium or plastic tube for ointments, creams, or gels',
    relatedDispensingUnits: [
      { unit: 'Gram (g)', defaultFactor: 20, hint: '1 Tube = 20 Grams net ointment weight' },
      { unit: 'Application', defaultFactor: 30, hint: '1 Tube = 30 Recommended applications' },
      { unit: 'Tube (Intact)', defaultFactor: 1, hint: 'Dispense 1 complete tube' }
    ]
  },
  {
    id: 'Vial',
    name: 'Vial',
    category: 'Liquid / Injectable',
    description: 'Glass or polymer vial for parenteral injection solutions or freeze-dried powder',
    relatedDispensingUnits: [
      { unit: 'Vial (Intact)', defaultFactor: 1, hint: 'Dispense 1 single-use vial' },
      { unit: 'ml (Milliliter)', defaultFactor: 10, hint: '1 Vial = 10 ml multi-dose volume' },
      { unit: 'Dose', defaultFactor: 1, hint: '1 Vial = 1 Injection dose' }
    ]
  },
  {
    id: 'Ampoule',
    name: 'Ampoule',
    category: 'Liquid / Injectable',
    description: 'Hermetically sealed glass bulb for sterile injectable liquids',
    relatedDispensingUnits: [
      { unit: 'Ampoule (Intact)', defaultFactor: 1, hint: 'Dispense 1 individual ampoule' },
      { unit: 'ml (Milliliter)', defaultFactor: 2, hint: '1 Ampoule = 2 ml sterile solution' },
      { unit: 'Dose', defaultFactor: 1, hint: '1 Ampoule = 1 Single injection' }
    ]
  },
  {
    id: 'Canister',
    name: 'Canister / Inhaler',
    category: 'Topical / Inhalant',
    description: 'Pressurized metered-dose inhaler (MDI) or aerosol spray canister',
    relatedDispensingUnits: [
      { unit: 'Puff / Dose', defaultFactor: 200, hint: '1 Canister = 200 Metered Puffs' },
      { unit: 'Actuation', defaultFactor: 120, hint: '1 Canister = 120 Sprays / Actuations' },
      { unit: 'Canister (Intact)', defaultFactor: 1, hint: 'Dispense 1 complete inhaler device' }
    ]
  },
  {
    id: 'Sachet',
    name: 'Sachet / Pouch',
    category: 'Solid Dose',
    description: 'Sealed foil or paper pouch for rehydration salts, granules, or effervescent powder',
    relatedDispensingUnits: [
      { unit: 'Sachet (Intact)', defaultFactor: 1, hint: 'Dispense 1 individual sachet' },
      { unit: 'Gram (g)', defaultFactor: 5, hint: '1 Sachet = 5 Grams active powder' },
      { unit: 'Dose', defaultFactor: 1, hint: '1 Sachet = 1 Single oral dose' }
    ]
  },
  {
    id: 'Bag',
    name: 'Bag / IV Infusion',
    category: 'Liquid / Injectable',
    description: 'Flexible PVC or non-PVC bag for intravenous fluids, saline, or dialysis',
    relatedDispensingUnits: [
      { unit: 'ml (Milliliter)', defaultFactor: 500, hint: '1 Bag = 500 ml IV fluid' },
      { unit: 'Bag (Intact)', defaultFactor: 1, hint: 'Dispense 1 complete IV infusion bag' },
      { unit: 'Infusion Unit', defaultFactor: 1, hint: '1 Single infusion administration' }
    ]
  },
  {
    id: 'Jar',
    name: 'Jar / Tub',
    category: 'Topical / Inhalant',
    description: 'Rigid container for bulk compounding ointments, petroleum jelly, or powder',
    relatedDispensingUnits: [
      { unit: 'Gram (g)', defaultFactor: 100, hint: '1 Jar = 100 Grams net capacity' },
      { unit: 'Scoop / Dose', defaultFactor: 30, hint: '1 Jar = 30 Measured scoops' },
      { unit: 'Jar (Intact)', defaultFactor: 1, hint: 'Dispense 1 whole jar' }
    ]
  },
  {
    id: 'Roll',
    name: 'Roll',
    category: 'Consumables & Devices',
    description: 'Cotton rolls, absorbent gauze, surgical tapes, or elastic bandages',
    relatedDispensingUnits: [
      { unit: 'Meter (m)', defaultFactor: 5, hint: '1 Roll = 5 Meters total length' },
      { unit: 'Yard', defaultFactor: 5, hint: '1 Roll = 5 Yards total length' },
      { unit: 'Roll (Intact)', defaultFactor: 1, hint: 'Dispense 1 whole packaged roll' },
      { unit: 'Piece', defaultFactor: 10, hint: '1 Roll cut into 10 dressings' }
    ]
  },
  {
    id: 'Kit',
    name: 'Kit / Set',
    category: 'Consumables & Devices',
    description: 'Rapid diagnostic test kits, surgical suture sets, or first-aid packages',
    relatedDispensingUnits: [
      { unit: 'Kit (Complete)', defaultFactor: 1, hint: 'Dispense 1 complete kit' },
      { unit: 'Test', defaultFactor: 25, hint: '1 Kit = 25 Diagnostic tests' },
      { unit: 'Component', defaultFactor: 10, hint: '1 Set = 10 Sterile instruments' }
    ]
  },
  {
    id: 'Blister',
    name: 'Blister Card',
    category: 'Solid Dose',
    description: 'Individual blister card containing unit doses',
    relatedDispensingUnits: [
      { unit: 'Tablet', defaultFactor: 10, hint: '1 Blister = 10 Tablets' },
      { unit: 'Capsule', defaultFactor: 10, hint: '1 Blister = 10 Capsules' },
      { unit: 'Blister (Intact)', defaultFactor: 1, hint: 'Dispense 1 intact blister' }
    ]
  },
  {
    id: 'Piece',
    name: 'Piece / Unit',
    category: 'Consumables & Devices',
    description: 'Individual medical device, thermometer, surgical blade, or cannula',
    relatedDispensingUnits: [
      { unit: 'Piece', defaultFactor: 1, hint: '1 Single Piece' },
      { unit: 'Unit', defaultFactor: 1, hint: '1 Single Unit' }
    ]
  },
  {
    id: 'Drum',
    name: 'Drum / Bulk Container',
    category: 'Bulk / Packaging',
    description: 'Bulk industrial or compounding raw chemical container',
    relatedDispensingUnits: [
      { unit: 'Kilogram (kg)', defaultFactor: 25, hint: '1 Drum = 25 kg raw material' },
      { unit: 'Liter (L)', defaultFactor: 20, hint: '1 Drum = 20 L liquid base' },
      { unit: 'Gram (g)', defaultFactor: 25000, hint: '1 Drum = 25,000 Grams' }
    ]
  },
  {
    id: 'Other',
    name: 'Other / Custom Packaging',
    category: 'Other',
    description: 'Non-standard packaging format',
    relatedDispensingUnits: [
      { unit: 'Unit', defaultFactor: 1, hint: '1 Custom Unit' },
      { unit: 'Piece', defaultFactor: 1, hint: '1 Individual Piece' },
      { unit: 'Tablet', defaultFactor: 10, hint: 'Tablets per custom unit' },
      { unit: 'Capsule', defaultFactor: 10, hint: 'Capsules per custom unit' },
      { unit: 'Strip', defaultFactor: 1, hint: 'Strips per custom unit' },
      { unit: 'ml (Milliliter)', defaultFactor: 100, hint: 'ml volume' },
      { unit: 'Gram (g)', defaultFactor: 50, hint: 'Gram weight' }
    ]
  }
];

export const ALL_STANDARD_DISPENSING_UNITS: string[] = [
  'Strip',
  'Tablet',
  'Capsule',
  'ml (Milliliter)',
  'Gram (g)',
  'Ampoule',
  'Vial',
  'Bottle',
  'Sachet',
  'Piece',
  'Puff / Dose',
  'Actuation',
  'Drops',
  'Box',
  'Pack',
  'Test',
  'Meter (m)',
  'Dose',
  'Unit',
  'Suppository',
  'Patch',
  'Application',
  'Kilogram (kg)',
  'Liter (L)'
];

/**
 * Finds the purchase unit option definition matching a given string.
 * Supports exact id match, name match, or prefix/fuzzy match (e.g. 'Box (10x10)' -> 'Box').
 */
export function findPurchaseUnitOption(unitStr?: string): PurchaseUnitOption | undefined {
  if (!unitStr) return undefined;
  const clean = unitStr.trim().toLowerCase();
  
  // Exact match first
  const exact = PURCHASE_UNIT_OPTIONS.find(
    opt => opt.id.toLowerCase() === clean || opt.name.toLowerCase() === clean
  );
  if (exact) return exact;

  // Prefix / substring match (e.g. "Box of 20", "Pack of 3", "20g Tube", "Bottle 100ml")
  return PURCHASE_UNIT_OPTIONS.find(opt => {
    const optClean = opt.id.toLowerCase();
    return clean.startsWith(optClean) || clean.includes(optClean);
  });
}

/**
 * Given a purchase unit, returns the list of relatable dispensing units.
 * If the purchase unit is not found, returns the default standard dispensing units.
 */
export function getRelatableDispensingUnits(purchaseUnit?: string): RelatedDispensingUnit[] {
  const match = findPurchaseUnitOption(purchaseUnit);
  if (match) {
    return match.relatedDispensingUnits;
  }
  // Default fallback relatable units
  return [
    { unit: 'Strip', defaultFactor: 10, hint: '10 Strips per pack' },
    { unit: 'Tablet', defaultFactor: 100, hint: '100 Tablets total' },
    { unit: 'Capsule', defaultFactor: 100, hint: '100 Capsules total' },
    { unit: 'Piece', defaultFactor: 1, hint: '1 Single Piece' },
    { unit: 'ml (Milliliter)', defaultFactor: 100, hint: '100 ml volume' },
    { unit: 'Gram (g)', defaultFactor: 20, hint: '20 Grams weight' }
  ];
}

/**
 * Formats a clean, readable conversion description badge.
 * e.g., "1 Box = 10 Strips"
 */
export function formatConversionLabel(
  purchaseUnit?: string,
  dispensingUnit?: string,
  conversionFactor?: number
): string {
  const pUnit = purchaseUnit || 'Pack';
  const dUnit = dispensingUnit || 'Units';
  const factor = conversionFactor && conversionFactor > 0 ? conversionFactor : 1;
  return `1 ${pUnit} = ${factor} ${dUnit}`;
}
