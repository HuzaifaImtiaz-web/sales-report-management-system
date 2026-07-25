import React, { useState, useEffect, useMemo } from 'react';
import { FiCheck, FiEdit2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useUnsavedChanges } from '../../context/UnsavedChangesContext';
import { groupService } from '../../services/groupService';
import { productService } from '../../services/productService';
import StatusSelector from '../../components/common/StatusSelector';

const DIVISIONS = ['Himmel', 'PMS', 'MSA'];

const UNIT_TYPES = [
  'Tablet',
  'Capsule',
  'Vial',
  'Ampoule',
  'Injection',
  'Syrup Bottle',
  'Sachet',
  'Tube',
  'Cream',
  'Bottle',
  'Strip',
  'Pack',
  'Box'
];

const Field = ({ label, required, error, children, className = '' }) => (
  <div className={className}>
    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-550 dark:text-gray-400 mb-1.5">
      {label} {required && <span className="text-feedback-error">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-feedback-error font-semibold mt-1">{error}</p>}
  </div>
);

const inputCls = (err, disabled) =>
  `w-full px-3 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-55 dark:bg-gray-800/50 border rounded-lg outline-none
   transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-555
   focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40
   ${err ? 'border-feedback-error bg-red-50 dark:bg-red-900/10' : 'border-gray-100 dark:border-gray-750'}
   ${disabled ? 'opacity-70 cursor-default bg-gray-100/50 dark:bg-gray-800/30' : ''}`;

export default function ProductsForm({ mode, item, onSave, onCancel }) {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const navigate = useNavigate();
  const { setIsDirty, setOnSave } = useUnsavedChanges();

  const [form, setForm] = useState({
    productCode: '',
    brandName: '',
    genericName: '',
    division: 'Himmel',
    groupName: '',
    strength: '',
    dosageForm: '',
    registrationNo: '',
    manufacturer: 'Himmel Pharmaceutical',
    packSize: '',
    unitTypeName: 'Tablet',
    tp: '',
    mrp: '',
    description: '',
    status: 'Active'
  });

  const [errors, setErrors] = useState({});
  const [allGroups, setAllGroups] = useState([]);
  const [existingDosageForms, setExistingDosageForms] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showDosageSuggestions, setShowDosageSuggestions] = useState(false);

  // Fetch groups and dosage forms on mount
  useEffect(() => {
    groupService.getAllGroups().then((data) => {
      setAllGroups(data || []);
    });
    productService.getAllProducts().then((data) => {
      if (data) {
        const uniqueForms = [...new Set(data.map(p => p.dosageForm).filter(Boolean))];
        setExistingDosageForms(uniqueForms);
      }
    });
  }, []);

  useEffect(() => {
    if (item) {
      setForm({
        id: item.id,
        productCode: item.productCode || item.code || '',
        brandName: item.brandName || item.name || '',
        genericName: item.genericName || '',
        division: item.divisionName || item.category || 'Himmel',
        groupName: item.groupName || '',
        strength: item.strength || '',
        dosageForm: item.dosageForm || '',
        registrationNo: item.registrationNo || '',
        manufacturer: item.manufacturer || 'Himmel Pharmaceutical',
        packSize: item.packSize || item.packSizeQty || '',
        unitTypeName: item.unitTypeName || item.packSizeUnit || 'Tablet',
        tp: item.tp !== undefined ? item.tp : (item.packPrice || ''),
        mrp: item.mrp !== undefined ? item.mrp : (item.tp || item.packPrice || ''),
        description: item.description || '',
        status: item.status || 'Active'
      });
    }
  }, [item]);

  // Compute suggestions based on selected division and query typed
  const filteredGroups = useMemo(() => {
    if (!form.division) return [];
    return allGroups
      .filter((g) => g.divisionName === form.division)
      .map((g) => g.name);
  }, [allGroups, form.division]);

  const suggestions = useMemo(() => {
    if (!form.groupName) return filteredGroups;
    return filteredGroups.filter((g) =>
      g.toLowerCase().includes(form.groupName.toLowerCase())
    );
  }, [filteredGroups, form.groupName]);

  // Compute suggestions for Dosage Form Hybrid ComboBox
  const dosageSuggestions = useMemo(() => {
    const defaultList = [
      'Tablet', 'Capsule', 'Syrup', 'Suspension', 'Injection', 'Infusion', 'Cream', 
      'Ointment', 'Gel', 'Lotion', 'Drops', 'Eye Drops', 'Ear Drops', 'Nasal Spray', 
      'Inhaler', 'Sachet', 'Powder', 'Solution', 'Oral Solution', 'IV Solution', 
      'Ampoule', 'Vial', 'Softgel', 'Suppository', 'Patch'
    ];
    // Combine and case-insensitively deduplicate
    const combined = [...defaultList];
    existingDosageForms.forEach(f => {
      if (!combined.some(c => c.toLowerCase() === f.toLowerCase())) {
        combined.push(f);
      }
    });

    if (!form.dosageForm) return combined;
    return combined.filter(c => c.toLowerCase().includes(form.dosageForm.toLowerCase()));
  }, [existingDosageForms, form.dosageForm]);

  const set = (k, v) => {
    if (isView) return;
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
    setIsDirty(true);
  };

  // Compute Per Unit Price
  const computedPerUnitPrice = useMemo(() => {
    const size = Number(form.packSize);
    const tpVal = Number(form.tp);
    if (size > 0 && tpVal > 0) {
      return Number((tpVal / size).toFixed(2));
    }
    return 0;
  }, [form.packSize, form.tp]);

  const validate = () => {
    const e = {};
    if (!form.brandName.trim()) e.brandName = 'Brand Name is required.';
    if (!form.genericName.trim()) e.genericName = 'Generic Name is required.';
    if (!form.division) e.division = 'Division selection is required.';
    if (!form.groupName.trim()) e.groupName = 'Product Group is required.';

    const size = Number(form.packSize);
    if (form.packSize === '' || isNaN(size) || size <= 0 || !Number.isInteger(size)) {
      e.packSize = 'Pack Size must be a positive integer.';
    }

    if (!form.unitTypeName) e.unitTypeName = 'Unit Type is required.';

    const tpVal = Number(form.tp);
    if (form.tp === '' || isNaN(tpVal) || tpVal < 0) {
      e.tp = 'Trade Price (TP) must be a positive number.';
    }

    const mrpVal = Number(form.mrp);
    if (form.mrp === '' || isNaN(mrpVal) || mrpVal < 0) {
      e.mrp = 'MRP must be a positive number.';
    }

    if (!e.tp && !e.mrp && mrpVal < tpVal) {
      e.mrp = 'MRP cannot be less than Trade Price (TP).';
    }

    return e;
  };

  const getSavePayload = () => {
    const size = Number(form.packSize);
    const tpVal = Number(form.tp);
    const mrpVal = Number(form.mrp);
    return {
      ...form,
      packSize: size,
      tp: tpVal,
      mrp: mrpVal,
      packSizeQty: size, // Compatibility
      packPrice: tpVal, // Compatibility
      rate: tpVal, // Compatibility
      packSizeUnit: form.unitTypeName, // Compatibility
      category: form.division // Compatibility
    };
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    onSave(getSavePayload());
  };

  useEffect(() => {
    if (mode !== 'view') {
      setOnSave(() => {
        const e = validate();
        if (Object.keys(e).length) {
          setErrors(e);
          return false;
        }
        return onSave(getSavePayload());
      });
    }
    return () => setOnSave(null);
  }, [form, mode, onSave]);

  const statusBadgeCls = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-50 dark:bg-green-900/30 border-green-150 text-feedback-success';
      case 'Inactive':
        return 'bg-amber-50 dark:bg-amber-900/30 border-amber-150 text-amber-600';
      case 'Discontinued':
      default:
        return 'bg-red-50 dark:bg-red-900/30 border-red-150 text-feedback-error';
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto bg-white dark:bg-[#0f172a] p-6 rounded-enterprise border border-gray-100 dark:border-gray-800 shadow-soft">
      {/* Strict Field Ordering:
          1. Division
          2. Product Group
          3. Product Code
          4. Brand Name
          5. Generic Name
          6. Strength
          7. Dosage Form (Hybrid ComboBox)
          8. Registration Number
          9. Manufacturer
          10. Pack Size
          11. Unit Type
          12. TP
          13. MRP
          14. Description
          15. Status
      */}

      {/* Row 1: Division & Product Group */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Division" required error={errors.division}>
          {isView ? (
            <input disabled value={form.division} className={inputCls(false, true)} />
          ) : (
            <select
              value={form.division}
              onChange={(e) => {
                set('division', e.target.value);
                set('groupName', ''); // Reset groupName when division changes
              }}
              className={inputCls(errors.division, isView) + ' appearance-none cursor-pointer'}
            >
              {DIVISIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Product Group" required error={errors.groupName} className="relative">
          {isView ? (
            <input disabled value={form.groupName} className={inputCls(false, true)} />
          ) : (
            <>
              <input
                value={form.groupName}
                onChange={(e) => {
                  set('groupName', e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Type or select a group..."
                className={inputCls(errors.groupName, isView)}
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {suggestions.map((s) => (
                    <li
                      key={s}
                      onMouseDown={() => {
                        set('groupName', s);
                        setShowSuggestions(false);
                      }}
                      className="px-3 py-2 text-xs hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 cursor-pointer text-gray-750 dark:text-gray-200 font-semibold"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Field>
      </div>

      {/* Row 2: Product Code & Brand Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Product Code" error={errors.productCode}>
          <input
            disabled={isView}
            value={form.productCode}
            onChange={(e) => set('productCode', e.target.value)}
            placeholder="e.g. PRD-001"
            className={inputCls(errors.productCode, isView) + ' font-mono'}
          />
        </Field>

        <Field label="Brand Name" required error={errors.brandName}>
          <input
            disabled={isView}
            value={form.brandName}
            onChange={(e) => set('brandName', e.target.value)}
            placeholder="e.g. Amoxil"
            className={inputCls(errors.brandName, isView)}
          />
        </Field>
      </div>

      {/* Row 3: Generic Name & Strength */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Generic Name" required error={errors.genericName}>
          <input
            disabled={isView}
            value={form.genericName}
            onChange={(e) => set('genericName', e.target.value)}
            placeholder="e.g. Amoxicillin Trihydrate"
            className={inputCls(errors.genericName, isView)}
          />
        </Field>

        <Field label="Strength" error={errors.strength}>
          <input
            disabled={isView}
            value={form.strength}
            onChange={(e) => set('strength', e.target.value)}
            placeholder="e.g. 500mg, 10ml, etc."
            className={inputCls(errors.strength, isView)}
          />
        </Field>
      </div>

      {/* Row 4: Dosage Form & Registration Number */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Dosage Form" error={errors.dosageForm} className="relative">
          {isView ? (
            <input disabled value={form.dosageForm} className={inputCls(false, true)} />
          ) : (
            <>
              <div className="relative">
                <input
                  value={form.dosageForm}
                  onChange={(e) => {
                    set('dosageForm', e.target.value);
                    setShowDosageSuggestions(true);
                  }}
                  onFocus={() => setShowDosageSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowDosageSuggestions(false), 200)}
                  placeholder="Type or select a dosage form..."
                  className={inputCls(errors.dosageForm, isView)}
                />
                <button
                  type="button"
                  onClick={() => setShowDosageSuggestions(!showDosageSuggestions)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-650"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              {showDosageSuggestions && dosageSuggestions.length > 0 && (
                <ul className="absolute z-20 w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {dosageSuggestions.map((s) => (
                    <li
                      key={s}
                      onMouseDown={() => {
                        set('dosageForm', s);
                        setShowDosageSuggestions(false);
                      }}
                      className="px-3 py-2 text-xs hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 cursor-pointer text-gray-750 dark:text-gray-200 font-semibold"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Field>

        <Field label="Registration Number" error={errors.registrationNo}>
          <input
            disabled={isView}
            value={form.registrationNo}
            onChange={(e) => set('registrationNo', e.target.value)}
            placeholder="e.g. Reg-100012"
            className={inputCls(errors.registrationNo, isView)}
          />
        </Field>
      </div>

      {/* Row 5: Manufacturer & Pack Size */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Manufacturer" error={errors.manufacturer}>
          <input
            disabled={isView}
            value={form.manufacturer}
            onChange={(e) => set('manufacturer', e.target.value)}
            placeholder="e.g. Himmel Pharmaceutical"
            className={inputCls(errors.manufacturer, isView)}
          />
        </Field>

        <Field label="Pack Size" required error={errors.packSize}>
          <input
            disabled={isView}
            type="number"
            min="1"
            value={form.packSize}
            onChange={(e) => set('packSize', e.target.value)}
            placeholder="e.g. 10"
            className={inputCls(errors.packSize, isView)}
          />
        </Field>
      </div>

      {/* Row 6: Unit Type & Trade Price */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Unit Type" required error={errors.unitTypeName}>
          {isView ? (
            <input disabled value={form.unitTypeName} className={inputCls(false, true)} />
          ) : (
            <select
              value={form.unitTypeName}
              onChange={(e) => set('unitTypeName', e.target.value)}
              className={inputCls(errors.unitTypeName, isView) + ' appearance-none cursor-pointer'}
            >
              {UNIT_TYPES.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Trade Price" required error={errors.tp}>
          <input
            disabled={isView}
            type="number"
            min="0"
            step="0.01"
            value={form.tp}
            onChange={(e) => set('tp', e.target.value)}
            placeholder="e.g. 4500"
            className={inputCls(errors.tp, isView)}
          />
        </Field>
      </div>

      {/* Row 7: MRP & Computed Per Unit Price */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Maximum Retail Price" required error={errors.mrp}>
          <input
            disabled={isView}
            type="number"
            min="0"
            step="0.01"
            value={form.mrp}
            onChange={(e) => set('mrp', e.target.value)}
            placeholder="e.g. 5000"
            className={inputCls(errors.mrp, isView)}
          />
        </Field>

        <Field label="Per Unit Price">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-405">Rs.</span>
            <input
              disabled
              value={computedPerUnitPrice > 0 ? `${computedPerUnitPrice.toLocaleString()} per ${form.unitTypeName}` : '0'}
              className={inputCls(false, true) + ' pl-9 font-bold text-brand-primary'}
            />
          </div>
        </Field>
      </div>

      {/* Row 8: Description */}
      <Field label="Description">
        <textarea
          disabled={isView}
          rows={3}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Optional product description details…"
          className={inputCls(false, isView) + ' resize-none'}
        />
      </Field>

      {/* Row 9: Status */}
      <Field label="Status" required>
        {isView ? (
          <div className="pt-1">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border ${statusBadgeCls(form.status)}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                form.status === 'Active' ? 'bg-feedback-success' : form.status === 'Inactive' ? 'bg-amber-500' : 'bg-feedback-error'
              }`} />
              {form.status}
            </span>
          </div>
        ) : (
          <StatusSelector
            options={['Active', 'Inactive', 'Discontinued']}
            value={form.status}
            onChange={(s) => set('status', s)}
          />
        )}
      </Field>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-105 dark:border-gray-800">
        {isView ? (
          <>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => navigate(`/products/${form.id}/edit`)}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm flex items-center gap-1.5"
            >
              <FiEdit2 className="w-3.5 h-3.5" /> Edit
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm flex items-center gap-1.5"
            >
              <FiCheck className="w-3.5 h-3.5" />
              {isEdit ? 'Update' : 'Save'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
