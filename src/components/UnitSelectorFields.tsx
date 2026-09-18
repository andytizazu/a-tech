import React, { useState, useEffect } from 'react';
import { Package, Hash, Sparkles } from 'lucide-react';

interface UnitSelectorFieldsProps {
  purchaseUnit: string;
  dispensingUnit: string;
  conversionFactor: number;
  quantity?: number;
  onQuantityChange?: (newQuantity: number) => void;
  onChange: (updates: { 
    purchaseUnit: string; 
    dispensingUnit: string; 
    conversionFactor: number;
    quantity?: number;
  }) => void;
  compact?: boolean;
  showQuantitySection?: boolean;
}

// Standard options for Purchase Units (Packaging)
const PURCHASE_UNIT_LIST = [
  { value: 'Box', label: 'Box' },
  { value: 'Pack', label: 'Pack' },
  { value: 'Carton', label: 'Carton' },
  { value: 'pk', label: 'pk (Pack)' },
  { value: 'Bottle', label: 'Bottle' },
  { value: 'Strip', label: 'Strip' },
  { value: 'Tube', label: 'Tube' },
  { value: 'Vial', label: 'Vial' },
  { value: 'Ampoule', label: 'Ampoule' },
  { value: 'Sachet', label: 'Sachet' },
  { value: 'Blister', label: 'Blister' },
  { value: 'Bag', label: 'Bag / IV Infusion' },
  { value: 'Jar', label: 'Jar / Tub' },
  { value: 'Roll', label: 'Roll' },
  { value: 'Kit', label: 'Kit / Set' },
  { value: 'Piece', label: 'Piece / Unit' },
  { value: 'Canister', label: 'Canister / Inhaler' },
  { value: 'Drum', label: 'Drum' },
  { value: 'Custom', label: '✨ Other / Custom Packaging...' }
];

// Standard options for Dispensing Units (Sales / POS)
const DISPENSING_UNIT_LIST = [
  { value: 'Strip', label: 'Strip' },
  { value: 'Tablet', label: 'Tablet' },
  { value: 'Capsule', label: 'Capsule' },
  { value: 'Piece', label: 'Piece' },
  { value: 'ml', label: 'ml (Milliliter)' },
  { value: 'Gram', label: 'Gram (g)' },
  { value: 'Ampoule', label: 'Ampoule' },
  { value: 'Vial', label: 'Vial' },
  { value: 'Sachet', label: 'Sachet' },
  { value: 'Bottle', label: 'Bottle' },
  { value: 'Dose', label: 'Dose' },
  { value: 'Puff', label: 'Puff / Inhalation' },
  { value: 'Drops', label: 'Drops' },
  { value: 'Suppository', label: 'Suppository' },
  { value: 'Patch', label: 'Patch' },
  { value: 'Test', label: 'Test' },
  { value: 'Meter', label: 'Meter (m)' },
  { value: 'Unit', label: 'Unit' },
  { value: 'Custom', label: '✨ Other / Custom Unit...' }
];

export const UnitSelectorFields: React.FC<UnitSelectorFieldsProps> = ({
  purchaseUnit,
  dispensingUnit,
  conversionFactor,
  quantity,
  onQuantityChange,
  onChange,
  compact = false
}) => {
  const isKnownPurchase = PURCHASE_UNIT_LIST.some(p => p.value.toLowerCase() === (purchaseUnit || '').toLowerCase());
  const isKnownDispensing = DISPENSING_UNIT_LIST.some(d => d.value.toLowerCase() === (dispensingUnit || '').toLowerCase());

  const [selectedPurchase, setSelectedPurchase] = useState<string>(
    purchaseUnit ? (isKnownPurchase ? purchaseUnit : 'Custom') : 'Box'
  );
  const [customPurchaseText, setCustomPurchaseText] = useState<string>(
    !isKnownPurchase && purchaseUnit ? purchaseUnit : ''
  );

  const [selectedDispensing, setSelectedDispensing] = useState<string>(
    dispensingUnit ? (isKnownDispensing ? dispensingUnit : 'Custom') : 'Strip'
  );
  const [customDispensingText, setCustomDispensingText] = useState<string>(
    !isKnownDispensing && dispensingUnit ? dispensingUnit : ''
  );

  const [factorVal, setFactorVal] = useState<number | string>(
    conversionFactor > 0 ? conversionFactor : 1
  );

  const [qtyVal, setQtyVal] = useState<number | string>(
    quantity !== undefined ? quantity : ''
  );

  // Sync with prop updates
  useEffect(() => {
    if (purchaseUnit !== undefined) {
      const known = PURCHASE_UNIT_LIST.some(p => p.value.toLowerCase() === purchaseUnit.toLowerCase());
      if (known) {
        setSelectedPurchase(purchaseUnit);
      } else if (purchaseUnit) {
        setSelectedPurchase('Custom');
        setCustomPurchaseText(purchaseUnit);
      }
    }
  }, [purchaseUnit]);

  useEffect(() => {
    if (dispensingUnit !== undefined) {
      const known = DISPENSING_UNIT_LIST.some(d => d.value.toLowerCase() === dispensingUnit.toLowerCase());
      if (known) {
        setSelectedDispensing(dispensingUnit);
      } else if (dispensingUnit) {
        setSelectedDispensing('Custom');
        setCustomDispensingText(dispensingUnit);
      }
    }
  }, [dispensingUnit]);

  useEffect(() => {
    if (conversionFactor !== undefined && Number(conversionFactor) !== Number(factorVal)) {
      setFactorVal(conversionFactor > 0 ? conversionFactor : 1);
    }
  }, [conversionFactor]);

  useEffect(() => {
    if (quantity !== undefined && Number(quantity) !== Number(qtyVal)) {
      setQtyVal(quantity);
    }
  }, [quantity]);

  const getEffectivePurchaseUnit = (sel: string, customTxt: string) => {
    return sel === 'Custom' ? (customTxt.trim() || 'Pack') : sel;
  };

  const getEffectiveDispensingUnit = (sel: string, customTxt: string) => {
    return sel === 'Custom' ? (customTxt.trim() || 'Unit') : sel;
  };

  const currentEffectiveP = getEffectivePurchaseUnit(selectedPurchase, customPurchaseText);
  const currentEffectiveD = getEffectiveDispensingUnit(selectedDispensing, customDispensingText);

  const handlePurchaseSelectChange = (newVal: string) => {
    setSelectedPurchase(newVal);
    const effP = getEffectivePurchaseUnit(newVal, customPurchaseText);
    const effD = currentEffectiveD;
    const numFactor = Number(factorVal) > 0 ? Number(factorVal) : 1;
    const numQty = qtyVal !== '' ? Number(qtyVal) : undefined;

    onChange({
      purchaseUnit: effP,
      dispensingUnit: effD,
      conversionFactor: numFactor,
      ...(numQty !== undefined ? { quantity: numQty } : {})
    });
  };

  const handleCustomPurchaseChange = (text: string) => {
    setCustomPurchaseText(text);
    const effP = text.trim() || 'Pack';
    const effD = currentEffectiveD;
    const numFactor = Number(factorVal) > 0 ? Number(factorVal) : 1;
    const numQty = qtyVal !== '' ? Number(qtyVal) : undefined;

    onChange({
      purchaseUnit: effP,
      dispensingUnit: effD,
      conversionFactor: numFactor,
      ...(numQty !== undefined ? { quantity: numQty } : {})
    });
  };

  const handleDispensingSelectChange = (newVal: string) => {
    setSelectedDispensing(newVal);
    const effP = currentEffectiveP;
    const effD = getEffectiveDispensingUnit(newVal, customDispensingText);
    const numFactor = Number(factorVal) > 0 ? Number(factorVal) : 1;
    const numQty = qtyVal !== '' ? Number(qtyVal) : undefined;

    onChange({
      purchaseUnit: effP,
      dispensingUnit: effD,
      conversionFactor: numFactor,
      ...(numQty !== undefined ? { quantity: numQty } : {})
    });
  };

  const handleCustomDispensingChange = (text: string) => {
    setCustomDispensingText(text);
    const effP = currentEffectiveP;
    const effD = text.trim() || 'Unit';
    const numFactor = Number(factorVal) > 0 ? Number(factorVal) : 1;
    const numQty = qtyVal !== '' ? Number(qtyVal) : undefined;

    onChange({
      purchaseUnit: effP,
      dispensingUnit: effD,
      conversionFactor: numFactor,
      ...(numQty !== undefined ? { quantity: numQty } : {})
    });
  };

  const handleFactorChange = (val: string | number) => {
    setFactorVal(val);
    const parsed = Number(val);
    const numFactor = !isNaN(parsed) && parsed > 0 ? parsed : 1;
    const numQty = qtyVal !== '' ? Number(qtyVal) : undefined;

    onChange({
      purchaseUnit: currentEffectiveP,
      dispensingUnit: currentEffectiveD,
      conversionFactor: numFactor,
      ...(numQty !== undefined ? { quantity: numQty } : {})
    });
  };

  const handleQuantityChange = (val: string | number) => {
    setQtyVal(val);
    const parsed = Number(val);
    const numQty = !isNaN(parsed) && parsed >= 0 ? parsed : 0;
    const numFactor = Number(factorVal) > 0 ? Number(factorVal) : 1;

    if (onQuantityChange) {
      onQuantityChange(numQty);
    }
    onChange({
      purchaseUnit: currentEffectiveP,
      dispensingUnit: currentEffectiveD,
      conversionFactor: numFactor,
      quantity: numQty
    });
  };

  return (
    <div className={`col-span-full space-y-3 ${compact ? 'text-xs' : 'text-sm'}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Purchase Unit (Packaging) + How many boxes/packs */}
        <div className="space-y-2">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Package size={compact ? 14 : 16} className="text-blue-600 dark:text-blue-400" />
                <span>Purchase Unit</span>
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                Packaging
              </span>
            </label>
            <select
              value={selectedPurchase}
              onChange={e => handlePurchaseSelectChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs transition cursor-pointer"
            >
              {PURCHASE_UNIT_LIST.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {selectedPurchase === 'Custom' && (
              <input
                type="text"
                value={customPurchaseText}
                onChange={e => handleCustomPurchaseChange(e.target.value)}
                placeholder="Enter packaging name (e.g. Master Crate)"
                className="w-full mt-1.5 px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30 text-slate-900 dark:text-white font-medium text-xs outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            )}
          </div>

          {/* Direct Input: How many boxes / packs you have */}
          <div className="space-y-1 pt-1">
            <label className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center justify-between">
              <span>How many {currentEffectiveP}es do you have?</span>
              <span className="text-[10px] text-slate-400">Total count</span>
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={qtyVal}
              onChange={e => handleQuantityChange(e.target.value)}
              placeholder={`Enter number of ${currentEffectiveP}s (e.g. 10)`}
              className="w-full px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs transition"
            />
          </div>
        </div>

        {/* 2. Dispensing Unit (Sales Unit) */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles size={compact ? 14 : 16} className="text-emerald-600 dark:text-emerald-400" />
              <span>Dispensing Unit</span>
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
              Sales Unit
            </span>
          </label>
          <select
            value={selectedDispensing}
            onChange={e => handleDispensingSelectChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs transition cursor-pointer"
          >
            {DISPENSING_UNIT_LIST.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {selectedDispensing === 'Custom' && (
            <input
              type="text"
              value={customDispensingText}
              onChange={e => handleCustomDispensingChange(e.target.value)}
              placeholder="Enter unit name (e.g. Suppositories)"
              className="w-full mt-1.5 px-3 py-2 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/30 text-slate-900 dark:text-white font-medium text-xs outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          )}

          <p className="text-[11px] text-slate-400">
            How it is dispensed or sold to patients (e.g. Strip, Tablet)
          </p>
        </div>

        {/* 3. Contains / How many in 1 Box / Pack */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Hash size={compact ? 14 : 16} className="text-amber-500" />
              <span>How many in 1 {currentEffectiveP}?</span>
            </span>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
              {currentEffectiveD} count
            </span>
          </label>
          <input
            type="number"
            min="0.001"
            step="any"
            value={factorVal}
            onChange={e => handleFactorChange(e.target.value)}
            placeholder={`e.g. 54`}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-xs transition"
          />
          <p className="text-[11px] text-slate-400">
            Number of {currentEffectiveD}s in 1 {currentEffectiveP} (e.g. 54, 3, 100)
          </p>
        </div>
      </div>
    </div>
  );
};
