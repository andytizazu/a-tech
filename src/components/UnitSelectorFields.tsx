import React, { useState, useEffect } from 'react';
import { Layers, ArrowRight, Sparkles, Check, Hash, Info, Calculator, Package } from 'lucide-react';
import { 
  PURCHASE_UNIT_OPTIONS, 
  ALL_STANDARD_DISPENSING_UNITS, 
  getRelatableDispensingUnits,
  findPurchaseUnitOption,
  formatConversionLabel
} from '../lib/unitConversions';

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

export const UnitSelectorFields: React.FC<UnitSelectorFieldsProps> = ({
  purchaseUnit,
  dispensingUnit,
  conversionFactor,
  quantity,
  onQuantityChange,
  onChange,
  compact = false,
  showQuantitySection = true
}) => {
  const [isCustomPurchase, setIsCustomPurchase] = useState(false);
  const [isCustomDispensing, setIsCustomDispensing] = useState(false);
  const [customPurchaseVal, setCustomPurchaseVal] = useState('');
  const [customDispensingVal, setCustomDispensingVal] = useState('');

  // Local input string buffers for smooth typing
  const [localPurchaseQtyStr, setLocalPurchaseQtyStr] = useState<string>(
    quantity !== undefined && quantity !== null ? String(quantity) : '0'
  );
  const [localDispensingQtyStr, setLocalDispensingQtyStr] = useState<string>(
    quantity !== undefined && quantity !== null 
      ? String(Math.round(quantity * (conversionFactor || 1) * 100) / 100) 
      : '0'
  );

  // Sync internal string buffers when external quantity or conversionFactor updates
  useEffect(() => {
    if (quantity !== undefined && quantity !== null) {
      setLocalPurchaseQtyStr(String(quantity));
      const totalDisp = Math.round(quantity * (conversionFactor || 1) * 100) / 100;
      setLocalDispensingQtyStr(String(totalDisp));
    }
  }, [quantity, conversionFactor]);

  // Determine current matched purchase unit option
  const matchedOption = findPurchaseUnitOption(purchaseUnit);
  const currentPurchaseId = matchedOption ? matchedOption.id : (purchaseUnit ? 'Custom' : 'Box');
  
  // Get relatable dispensing units based on current purchase unit
  const relatableUnits = getRelatableDispensingUnits(purchaseUnit || 'Box');

  // Sync custom input states when external value changes
  useEffect(() => {
    if (purchaseUnit && !PURCHASE_UNIT_OPTIONS.some(o => o.name.toLowerCase() === purchaseUnit.toLowerCase() || o.id.toLowerCase() === purchaseUnit.toLowerCase())) {
      setIsCustomPurchase(true);
      setCustomPurchaseVal(purchaseUnit);
    } else {
      setIsCustomPurchase(false);
    }
  }, [purchaseUnit]);

  useEffect(() => {
    if (dispensingUnit && !ALL_STANDARD_DISPENSING_UNITS.some(u => u.toLowerCase() === dispensingUnit.toLowerCase()) && !relatableUnits.some(r => r.unit.toLowerCase() === dispensingUnit.toLowerCase())) {
      setIsCustomDispensing(true);
      setCustomDispensingVal(dispensingUnit);
    } else {
      setIsCustomDispensing(false);
    }
  }, [dispensingUnit, purchaseUnit]);

  // Handle purchase unit selection
  const handleSelectPurchaseUnit = (newUnitId: string) => {
    if (newUnitId === 'Custom') {
      setIsCustomPurchase(true);
      const newCustom = customPurchaseVal || 'Container';
      const related = getRelatableDispensingUnits(newCustom);
      const defaultD = related[0] || { unit: 'Piece', defaultFactor: 1 };
      onChange({
        purchaseUnit: newCustom,
        dispensingUnit: defaultD.unit,
        conversionFactor: defaultD.defaultFactor
      });
      return;
    }

    setIsCustomPurchase(false);
    const selectedOpt = PURCHASE_UNIT_OPTIONS.find(o => o.id === newUnitId) || PURCHASE_UNIT_OPTIONS[0];
    const related = selectedOpt.relatedDispensingUnits;
    
    // Check if the current dispensing unit is already in the new relatable units
    const existingMatch = related.find(r => r.unit.toLowerCase() === (dispensingUnit || '').toLowerCase());
    
    if (existingMatch) {
      onChange({
        purchaseUnit: selectedOpt.name,
        dispensingUnit: existingMatch.unit,
        conversionFactor: conversionFactor > 0 ? conversionFactor : existingMatch.defaultFactor
      });
    } else {
      // Intelligently auto-select the best default dispensing unit & conversion factor for this purchase unit
      const bestDefault = related[0] || { unit: 'Piece', defaultFactor: 1 };
      onChange({
        purchaseUnit: selectedOpt.name,
        dispensingUnit: bestDefault.unit,
        conversionFactor: bestDefault.defaultFactor
      });
    }
  };

  // Handle dispensing unit selection
  const handleSelectDispensingUnit = (newUnit: string) => {
    if (newUnit === 'Custom') {
      setIsCustomDispensing(true);
      const newCustom = customDispensingVal || 'Unit';
      onChange({
        purchaseUnit: purchaseUnit || 'Box',
        dispensingUnit: newCustom,
        conversionFactor: conversionFactor > 0 ? conversionFactor : 1
      });
      return;
    }

    setIsCustomDispensing(false);
    // If the unit has a recommended default factor in the current relatable list, suggest it
    const match = relatableUnits.find(r => r.unit === newUnit);
    const factorToUse = match ? match.defaultFactor : (conversionFactor > 0 ? conversionFactor : 1);

    onChange({
      purchaseUnit: purchaseUnit || 'Box',
      dispensingUnit: newUnit,
      conversionFactor: factorToUse
    });
  };

  const handleCustomPurchaseChange = (val: string) => {
    setCustomPurchaseVal(val);
    const curPurchaseQty = Number(localPurchaseQtyStr) || 0;
    onChange({
      purchaseUnit: val,
      dispensingUnit: dispensingUnit || 'Piece',
      conversionFactor: conversionFactor > 0 ? conversionFactor : 1,
      quantity: curPurchaseQty
    });
  };

  const handleCustomDispensingChange = (val: string) => {
    setCustomDispensingVal(val);
    const curPurchaseQty = Number(localPurchaseQtyStr) || 0;
    onChange({
      purchaseUnit: purchaseUnit || 'Box',
      dispensingUnit: val,
      conversionFactor: conversionFactor > 0 ? conversionFactor : 1,
      quantity: curPurchaseQty
    });
  };

  const handleFactorPreset = (f: number) => {
    const factorToUse = Math.max(1, f);
    const curPurchaseQty = Number(localPurchaseQtyStr) || 0;
    const newDisp = Math.round(curPurchaseQty * factorToUse * 100) / 100;
    setLocalDispensingQtyStr(String(newDisp));
    onChange({
      purchaseUnit: purchaseUnit || 'Box',
      dispensingUnit: dispensingUnit || 'Strip',
      conversionFactor: factorToUse,
      quantity: curPurchaseQty
    });
  };

  const handleFactorChange = (f: number) => {
    const factorToUse = Math.max(1, f || 1);
    const curPurchaseQty = Number(localPurchaseQtyStr) || 0;
    const newDisp = Math.round(curPurchaseQty * factorToUse * 100) / 100;
    setLocalDispensingQtyStr(String(newDisp));
    onChange({
      purchaseUnit: purchaseUnit || 'Box',
      dispensingUnit: dispensingUnit || 'Strip',
      conversionFactor: factorToUse,
      quantity: curPurchaseQty
    });
  };

  // Handle Purchase Quantity input change: updates purchase qty and automatically calculates dispensing qty!
  const handlePurchaseQtyChange = (valStr: string) => {
    setLocalPurchaseQtyStr(valStr);
    const num = Number(valStr);
    if (!isNaN(num) && num >= 0) {
      const factor = Math.max(1, conversionFactor || 1);
      const calculatedDispensing = Math.round(num * factor * 100) / 100;
      setLocalDispensingQtyStr(String(calculatedDispensing));
      if (onQuantityChange) onQuantityChange(num);
      onChange({
        purchaseUnit: purchaseUnit || 'Box',
        dispensingUnit: dispensingUnit || 'Strip',
        conversionFactor: factor,
        quantity: num
      });
    }
  };

  // Handle Dispensing Quantity input change: updates dispensing qty and automatically calculates purchase qty!
  const handleDispensingQtyChange = (valStr: string) => {
    setLocalDispensingQtyStr(valStr);
    const num = Number(valStr);
    if (!isNaN(num) && num >= 0) {
      const factor = Math.max(1, conversionFactor || 1);
      const calculatedPurchase = Math.round((num / factor) * 100) / 100;
      setLocalPurchaseQtyStr(String(calculatedPurchase));
      if (onQuantityChange) onQuantityChange(calculatedPurchase);
      onChange({
        purchaseUnit: purchaseUnit || 'Box',
        dispensingUnit: dispensingUnit || 'Strip',
        conversionFactor: factor,
        quantity: calculatedPurchase
      });
    }
  };

  // Stepper for Purchase Quantity
  const handleStepPurchaseQty = (delta: number) => {
    const current = Number(localPurchaseQtyStr) || 0;
    const nextVal = Math.max(0, Math.round((current + delta) * 100) / 100);
    handlePurchaseQtyChange(String(nextVal));
  };

  // Group purchase options by category
  const categories = Array.from(new Set(PURCHASE_UNIT_OPTIONS.map(o => o.category)));

  return (
    <div className={`space-y-3 ${compact ? 'text-xs' : 'text-sm'} col-span-full`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. PURCHASE UNIT MENU */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers size={compact ? 14 : 16} className="text-blue-600 dark:text-blue-400" />
              Purchase Unit (Stock Intake)
            </label>
            {isCustomPurchase && (
              <button 
                type="button" 
                onClick={() => handleSelectPurchaseUnit('Box')}
                className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                Select from Menu
              </button>
            )}
          </div>

          {!isCustomPurchase ? (
            <select
              value={currentPurchaseId}
              onChange={e => handleSelectPurchaseUnit(e.target.value)}
              id="purchase-unit-select"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition"
            >
              {categories.map(cat => (
                <optgroup key={cat} label={`-- ${cat} --`}>
                  {PURCHASE_UNIT_OPTIONS.filter(o => o.category === cat).map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name} — {opt.description}
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value="Custom">✨ Other / Custom Packaging...</option>
            </select>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={customPurchaseVal}
                onChange={e => handleCustomPurchaseChange(e.target.value)}
                placeholder="e.g. Sachet Pack, Master Crate"
                id="custom-purchase-unit-input"
                className="w-full px-3.5 py-2.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/40 dark:bg-blue-900/20 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/30 shadow-sm"
              />
            </div>
          )}
          {matchedOption && !isCustomPurchase && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
              {matchedOption.description}
            </p>
          )}
        </div>

        {/* 2. DISPENSING UNIT MENU (RELATABLE TO PURCHASE UNIT) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles size={compact ? 14 : 16} className="text-emerald-600 dark:text-emerald-400" />
              Dispensing Unit (POS / Customer)
            </label>
            {isCustomDispensing && (
              <button 
                type="button" 
                onClick={() => handleSelectDispensingUnit(relatableUnits[0]?.unit || 'Strip')}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                Select from Menu
              </button>
            )}
          </div>

          {!isCustomDispensing ? (
            <select
              value={dispensingUnit || relatableUnits[0]?.unit || 'Strip'}
              onChange={e => handleSelectDispensingUnit(e.target.value)}
              id="dispensing-unit-select"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-sm transition"
            >
              <optgroup label={`-- Recommended for ${purchaseUnit || 'Selected Packaging'} --`}>
                {relatableUnits.map(rel => (
                  <option key={rel.unit} value={rel.unit}>
                    {rel.unit} ({rel.hint})
                  </option>
                ))}
              </optgroup>

              <optgroup label="-- Other Standard Dispensing Units --">
                {ALL_STANDARD_DISPENSING_UNITS.filter(u => !relatableUnits.some(r => r.unit === u)).map(u => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </optgroup>

              <option value="Custom">✨ Other / Custom Unit...</option>
            </select>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={customDispensingVal}
                onChange={e => handleCustomDispensingChange(e.target.value)}
                placeholder="e.g. Lozenges, Spoons, Applicators"
                id="custom-dispensing-unit-input"
                className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-900/20 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-sm"
              />
            </div>
          )}
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Units issued to patient or dispensed at checkout
          </p>
        </div>

        {/* 3. CONVERSION FACTOR */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Hash size={compact ? 14 : 16} className="text-amber-500" />
              Units per {purchaseUnit || 'Pack'}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Factor: {conversionFactor || 1}
            </span>
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="1"
              value={conversionFactor ?? 1}
              onChange={e => handleFactorChange(Math.max(1, Number(e.target.value) || 1))}
              id="conversion-factor-input"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-sm transition"
              placeholder="e.g. 10"
            />
            {/* Quick Presets */}
            <div className="flex gap-1 shrink-0">
              {[1, 10, 20, 100].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleFactorPreset(p)}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition border ${
                    conversionFactor === p 
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm' 
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                  title={`Set conversion factor to ${p}`}
                >
                  {p}x
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            How many <span className="font-bold text-emerald-600 dark:text-emerald-400">{dispensingUnit || 'dispensing units'}</span> are inside 1 <span className="font-bold text-blue-600 dark:text-blue-400">{purchaseUnit || 'purchase pack'}</span>
          </p>
        </div>
      </div>

      {/* AUTOMATIC DUAL QUANTITY CALCULATOR (INTAKE & DISPENSING UNITS) */}
      {showQuantitySection && (
        <div className="p-4 bg-gradient-to-br from-blue-50/90 via-slate-50/80 to-emerald-50/90 dark:from-slate-850 dark:via-slate-900 dark:to-slate-850 rounded-2xl border-2 border-blue-200 dark:border-blue-900/60 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm flex items-center justify-center">
                <Calculator size={compact ? 16 : 18} />
              </div>
              <div>
                <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
                  <span>Automatic Quantity Calculation</span>
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-md text-[10px] font-black uppercase tracking-wider border border-emerald-300 dark:border-emerald-800">
                    Live Sync
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Enter number of <strong>{purchaseUnit || 'Box'}es</strong> or total <strong>{dispensingUnit || 'Strip'}s</strong> — both calculate automatically!
                </p>
              </div>
            </div>
          </div>

          {/* Dual Inputs with Operator in the Center */}
          <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
            {/* 1. PURCHASE QUANTITY (INTAKE) */}
            <div className="md:col-span-5 space-y-1.5 bg-white dark:bg-slate-900 p-3 rounded-xl border border-blue-200 dark:border-blue-900/50 shadow-xs">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <Package size={15} />
                  Intake Amount ({purchaseUnit || 'Box'}es)
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Purchase Qty</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  step="any"
                  id="intake-purchase-quantity-input"
                  value={localPurchaseQtyStr}
                  onChange={e => handlePurchaseQtyChange(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full pl-3 pr-20 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-base outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 transition"
                />
                <span className="absolute right-2.5 text-xs font-bold text-blue-600 dark:text-blue-400 pointer-events-none uppercase">
                  {purchaseUnit || 'Box'}{(Number(localPurchaseQtyStr) !== 1 ? 'es' : '')}
                </span>
              </div>
              {/* Quick Stepper Buttons */}
              <div className="flex gap-1 items-center pt-1">
                <span className="text-[10px] font-bold text-slate-400 mr-0.5">Add:</span>
                {[1, 5, 10, 50, 100].map(step => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => handleStepPurchaseQty(step)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                    title={`Add ${step} ${purchaseUnit || 'Box'}es`}
                  >
                    +{step}
                  </button>
                ))}
                {Number(localPurchaseQtyStr) > 0 && (
                  <button
                    type="button"
                    onClick={() => handleStepPurchaseQty(-1)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 transition ml-auto"
                    title="Subtract 1"
                  >
                    -1
                  </button>
                )}
              </div>
            </div>

            {/* OPERATOR SYMBOL */}
            <div className="md:col-span-1 flex flex-col items-center justify-center py-1">
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-xs border border-blue-200 dark:border-blue-800 shadow-xs">
                ×{conversionFactor || 1}
              </div>
              <span className="text-[9px] font-bold text-slate-400 text-center mt-1">
                per {purchaseUnit || 'Box'}
              </span>
            </div>

            {/* 2. TOTAL DISPENSING QUANTITY (CALCULATED & EDITABLE) */}
            <div className="md:col-span-5 space-y-1.5 bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 shadow-xs">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Sparkles size={15} />
                  Total Dispensing Stock ({dispensingUnit || 'Strip'}s)
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">POS Stock</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  step="any"
                  id="total-dispensing-quantity-input"
                  value={localDispensingQtyStr}
                  onChange={e => handleDispensingQtyChange(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full pl-3 pr-20 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-emerald-50/30 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-base outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 transition"
                />
                <span className="absolute right-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 pointer-events-none uppercase">
                  {dispensingUnit || 'Strip'}{(Number(localDispensingQtyStr) !== 1 ? 's' : '')}
                </span>
              </div>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                ⚡ Auto-computed from intake: <strong>{Number(localPurchaseQtyStr) || 0}</strong> {purchaseUnit || 'Box'}es × <strong>{conversionFactor || 1}</strong>
              </p>
            </div>
          </div>

          {/* Dynamic Formula & Explanation Banner */}
          <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 flex-wrap">
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 rounded font-black">
                {Number(localPurchaseQtyStr) || 0} {purchaseUnit || 'Box'}{(Number(localPurchaseQtyStr) !== 1 ? 'es' : '')}
              </span>
              <span className="text-slate-400">×</span>
              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded font-black">
                {conversionFactor || 1} {dispensingUnit || 'Strip'}s per {purchaseUnit || 'Box'}
              </span>
              <span className="text-slate-400">=</span>
              <span className="px-2.5 py-0.5 bg-emerald-600 text-white rounded-lg font-black shadow-xs">
                {Number(localDispensingQtyStr) || 0} Total {dispensingUnit || 'Strip'}{(Number(localDispensingQtyStr) !== 1 ? 's' : '')} in Inventory
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <Info size={13} className="text-blue-500 shrink-0" />
              <span>Type in either box or strip count to auto-convert</span>
            </div>
          </div>
        </div>
      )}

      {/* RELATIONSHIP SUMMARY (WHEN QUANTITY SECTION IS COLLAPSED) */}
      {!showQuantitySection && (
        <div className="p-3 bg-gradient-to-r from-blue-50 via-slate-50 to-emerald-50 dark:from-blue-950/30 dark:via-slate-900/40 dark:to-emerald-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              1x
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-900 dark:text-white flex-wrap">
              <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg">
                1 {purchaseUnit || 'Box'}
              </span>
              <ArrowRight size={16} className="text-slate-400 shrink-0" />
              <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-lg">
                {conversionFactor || 1} {dispensingUnit || 'Strips'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <Info size={14} className="text-blue-500 shrink-0" />
            <span>
              Purchased in <strong>{purchaseUnit || 'Boxes'}</strong>, sold as <strong>{dispensingUnit || 'Strips'}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
