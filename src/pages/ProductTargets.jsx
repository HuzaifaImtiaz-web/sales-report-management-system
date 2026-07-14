import React, { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import Toast from '../components/Toast';
import {
  FiSearch, FiPlus, FiEye, FiEdit2, FiTrash2,
  FiX, FiAlertTriangle, FiCheck, FiTarget,
  FiCopy, FiFileText, FiBell
} from 'react-icons/fi';

/* ─── Static Dummy Data & Mappings ────────────────────────────────── */
const PRODUCTS = [
  { id: 1, name: 'Amoxicillin 500mg', group: 'Antibiotics', unit: 'Box' },
  { id: 2, name: 'Paracetamol 650mg', group: 'Analgesics', unit: 'Strip' },
  { id: 3, name: 'Metformin 850mg', group: 'Antidiabetics', unit: 'Box' },
  { id: 4, name: 'Lipitor 10mg', group: 'Cardiovascular', unit: 'Strip' },
  { id: 5, name: 'Ibuprofen 400mg', group: 'Analgesics', unit: 'Strip' },
  { id: 6, name: 'Omeprazole 20mg', group: 'Gastrointestinal', unit: 'Box' },
  { id: 7, name: 'Augmentin 625mg', group: 'Antibiotics', unit: 'Box' },
  { id: 8, name: 'Azithromycin 250mg', group: 'Antibiotics', unit: 'Strip' },
  { id: 9, name: 'Ventolin Inhaler', group: 'Respiratory', unit: 'Piece' },
  { id: 10, name: 'Crestor 10mg', group: 'Cardiovascular', unit: 'Strip' }
];

const GROUPS = [
  'Cardiovascular',
  'Antibiotics',
  'Analgesics',
  'Antidiabetics',
  'Respiratory',
  'Vitamins & Supplements',
  'Gastrointestinal'
];

const INITIAL_BUSINESS_YEARS = [
  { value: '2025-2026', label: '1 July 2025 – 30 June 2026' },
  { value: '2024-2025', label: '1 July 2024 – 30 June 2025' },
  { value: '2023-2024', label: '1 July 2023 – 30 June 2024' }
];

let nextId = 100;

const INITIAL_TARGETS = [
  {
    id: 1,
    businessYear: '2025-2026',
    productId: 1,
    group: 'Antibiotics',
    targetQuantity: 5000,
    achievedQuantity: 1200,
    notes: 'Primary antibiotic focus for Q3 campaign.'
  },
  {
    id: 2,
    businessYear: '2025-2026',
    productId: 3,
    group: 'Antidiabetics',
    targetQuantity: 8000,
    achievedQuantity: 8000,
    notes: 'Annual contract target fulfilled.'
  },
  {
    id: 3,
    businessYear: '2025-2026',
    productId: 4,
    group: 'Cardiovascular',
    targetQuantity: 3000,
    achievedQuantity: 0,
    notes: 'Launches in Q4, targets set early.'
  },
  {
    id: 4,
    businessYear: '2024-2025',
    productId: 2,
    group: 'Analgesics',
    targetQuantity: 10000,
    achievedQuantity: 9500,
    notes: 'High seasonal demand during winter wave.'
  },
  {
    id: 5,
    businessYear: '2024-2025',
    productId: 6,
    group: 'Gastrointestinal',
    targetQuantity: 4000,
    achievedQuantity: 4200,
    notes: 'Oversold due to local tender request.'
  },
  {
    id: 6,
    businessYear: '2025-2026',
    productId: 9,
    group: 'Respiratory',
    targetQuantity: 2500,
    achievedQuantity: 500,
    notes: 'Distribution targets for secondary clinics.'
  }
];

const EMPTY_FORM = {
  businessYear: '2025-2026',
  productId: '',
  group: '',
  targetQuantity: '',
  notes: ''
};

/* ─── Calculations & Helper Functions ────────────────────────────── */
const getTargetStats = (target) => {
  const prod = PRODUCTS.find((p) => p.id === Number(target.productId)) || {};
  const targetQty = Number(target.targetQuantity) || 0;
  const achievedQty = Number(target.achievedQuantity) || 0;
  const remainingQty = Math.max(0, targetQty - achievedQty);
  const progressPct = targetQty > 0 ? Math.min(100, Math.round((achievedQty / targetQty) * 105) / 105 * 100) : 0;
  const roundedProgress = targetQty > 0 ? Math.min(100, Math.round((achievedQty / targetQty) * 100)) : 0;
  
  let status = 'Not Started';
  if (achievedQty >= targetQty && targetQty > 0) {
    status = 'Achieved';
  } else if (achievedQty > 0) {
    status = 'In Progress';
  }

  return {
    productName: prod.name || 'Unknown Product',
    unit: prod.unit || 'Units',
    targetQuantity: targetQty,
    achievedQuantity: achievedQty,
    remainingQuantity: remainingQty,
    progressPercent: roundedProgress,
    status
  };
};

const calculateCurrentBusinessYear = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-11, where July is 6
  if (month >= 6) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

const getNextLogicalBusinessYear = (existingYears) => {
  if (!existingYears || !existingYears.length) return '2026-2027';
  const years = existingYears.map(y => Number(y.value.split('-')[0]));
  const maxYear = Math.max(...years);
  return `${maxYear + 1}-${maxYear + 2}`;
};

/* ─── Status Badge ───────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  if (status === 'Achieved') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 dark:bg-green-900/30 text-feedback-success border border-green-100 dark:border-green-800/50">
        <span className="w-1.5 h-1.5 rounded-full bg-feedback-success inline-block" />
        Achieved
      </span>
    );
  }
  if (status === 'In Progress') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 border border-blue-100 dark:border-blue-800/50">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
        In Progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 text-gray-550 dark:text-gray-400">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
      Not Started
    </span>
  );
};

/* ─── Field Helper ────────────────────────────────────────────────── */
const Field = ({ label, required, error, children }) => (
  <div>
    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
      {label} {required && <span className="text-feedback-error">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-feedback-error font-semibold mt-1">{error}</p>}
  </div>
);

const inputCls = (err) =>
  `w-full px-3 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border rounded-lg outline-none
   transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-500
   focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40
   ${err ? 'border-feedback-error bg-red-50 dark:bg-red-900/10' : 'border-gray-100 dark:border-gray-700'}`;

/* ─── Target Modal (Add / Edit) ──────────────────────────────────── */
const TargetModal = ({ mode, target, onClose, onSave, existingTargets, businessYearsList }) => {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState(
    target
      ? { ...target }
      : { ...EMPTY_FORM, businessYear: businessYearsList[0]?.value || '2025-2026' }
  );
  const [errors, setErrors] = useState({});

  const selectedProduct = useMemo(() => {
    return PRODUCTS.find((p) => p.id === Number(form.productId)) || null;
  }, [form.productId]);

  useEffect(() => {
    if (selectedProduct) {
      setForm((f) => ({
        ...f,
        group: selectedProduct.group
      }));
    } else {
      setForm((f) => ({
        ...f,
        group: ''
      }));
    }
  }, [selectedProduct]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '', api: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.productId) e.productId = 'Product selection is required.';
    if (!form.group) e.group = 'Group selection is required.';
    if (form.targetQuantity === '' || Number(form.targetQuantity) < 0) {
      e.targetQuantity = 'Target Quantity must be 0 or greater.';
    }

    if (!isEdit && form.productId && form.businessYear) {
      const isDuplicate = existingTargets.some(
        (t) =>
          t.businessYear === form.businessYear &&
          Number(t.productId) === Number(form.productId)
      );
      if (isDuplicate) {
        e.productId = `A target for this product already exists in business year ${form.businessYear}.`;
      }
    }

    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    onSave({
      ...form,
      productId: Number(form.productId),
      targetQuantity: Number(form.targetQuantity)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-lg animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-brand-navy to-[#162040]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <FiTarget className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{isEdit ? 'Edit Product Target' : 'Add New Target'}</h2>
              <p className="text-[10px] text-white/50 font-medium mt-0.5">Manage annual distribution objectives</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <FiX className="w-4 h-4 text-white/80" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Row 1: Business Year */}
          <Field label="Business Year" required error={errors.businessYear}>
            <select
              disabled={isEdit}
              value={form.businessYear}
              onChange={(e) => set('businessYear', e.target.value)}
              className={inputCls(errors.businessYear) + ' appearance-none cursor-pointer' + (isEdit ? ' opacity-60' : '')}
            >
              {businessYearsList.map((y) => (
                <option key={y.value} value={y.value}>{y.label}</option>
              ))}
            </select>
          </Field>

          {/* Row 2: Product */}
          <Field label="Product" required error={errors.productId}>
            <select
              disabled={isEdit}
              value={form.productId}
              onChange={(e) => set('productId', e.target.value)}
              className={inputCls(errors.productId) + ' appearance-none cursor-pointer' + (isEdit ? ' opacity-60' : '')}
            >
              <option value="">Select Product...</option>
              {PRODUCTS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>

          {/* Row 3: Group & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Group" required error={errors.group}>
              <select
                disabled
                value={form.group}
                onChange={(e) => set('group', e.target.value)}
                className={inputCls(errors.group) + ' appearance-none opacity-60 cursor-default'}
              >
                <option value="">Select Group...</option>
                {GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </Field>

            <Field label="Unit (Read-only)">
              <input
                disabled
                value={selectedProduct ? selectedProduct.unit : '—'}
                className={inputCls(false) + ' opacity-60 cursor-default font-semibold'}
              />
            </Field>
          </div>

          {/* Row 4: Target Quantity */}
          <Field label="Target Quantity" required error={errors.targetQuantity}>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={form.targetQuantity}
                onChange={(e) => set('targetQuantity', e.target.value)}
                placeholder="e.g. 5000"
                className={inputCls(errors.targetQuantity) + ' pr-12'}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
                {selectedProduct ? selectedProduct.unit : 'units'}
              </span>
            </div>
          </Field>

          {/* Notes */}
          <Field label="Notes">
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="e.g. Quarterly objectives, tender targets, etc."
              className={inputCls(false) + ' resize-none'}
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-enterprise">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-150"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm hover:shadow-md transition-all duration-150 flex items-center gap-1.5"
          >
            <FiCheck className="w-3.5 h-3.5" />
            {isEdit ? 'Update Target' : 'Save Target'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Target Details Modal (View Only) ───────────────────────────── */
const TargetDetailsModal = ({ target, onClose, businessYearsList }) => {
  const stats = useMemo(() => getTargetStats(target), [target]);
  const activeYearLabel = businessYearsList.find((y) => y.value === target.businessYear)?.label || target.businessYear;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-lg animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-brand-navy to-[#162040]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <FiTarget className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Target Details</h2>
              <p className="text-[10px] text-white/50 font-medium mt-0.5">{activeYearLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <FiX className="w-4 h-4 text-white/80" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Main Info Blocks */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-100/50 dark:border-gray-800/50 col-span-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-550">Product Name</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white mt-1">{stats.productName}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-100/50 dark:border-gray-800/50">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-550">Product Group</p>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-1">{target.group}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-100/50 dark:border-gray-800/50">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-550">Status</p>
              <div className="mt-1.5"><StatusBadge status={stats.status} /></div>
            </div>
          </div>

          {/* Progress and Target Quantities */}
          <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-550 border-b border-gray-100 dark:border-gray-800 pb-2">Target Quantities</p>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Target</p>
                <p className="text-sm font-extrabold text-gray-900 dark:text-white mt-1">
                  {stats.targetQuantity.toLocaleString()}{' '}
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-550">{stats.unit}</span>
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Achieved</p>
                <p className="text-sm font-extrabold text-feedback-success mt-1">
                  {stats.achievedQuantity.toLocaleString()}{' '}
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-550">{stats.unit}</span>
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Remaining</p>
                <p className="text-sm font-extrabold text-gray-500 dark:text-gray-400 mt-1">
                  {stats.remainingQuantity.toLocaleString()}{' '}
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-550">{stats.unit}</span>
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="pt-2 border-t border-gray-50 dark:border-gray-800/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Target Progress</span>
                <span className="text-xs font-extrabold text-brand-primary">{stats.progressPercent}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-brand-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          {target.notes && (
            <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-550 border-b border-gray-100 dark:border-gray-800 pb-2 mb-2">Remarks & Notes</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed italic">
                &ldquo;{target.notes}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-brand-navy rounded-lg hover:bg-[#162040] shadow-sm hover:shadow-md transition-all duration-150"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Delete Confirmation Dialog ─────────────────────────────────── */
const DeleteConfirmationDialog = ({ target, onCancel, onConfirm }) => {
  const stats = useMemo(() => getTargetStats(target), [target]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-md animate-slide-up">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <FiAlertTriangle className="w-5 h-5 text-feedback-error" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Delete Product Target</h2>
            <p className="text-[11px] text-gray-400 dark:text-gray-550 font-medium mt-0.5">{target.businessYear}</p>
          </div>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            Are you sure you want to delete this target?
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-550 mt-2 font-medium">
            This action will permanently delete the target set for <span className="font-bold text-gray-900 dark:text-white">{stats.productName}</span> in the year {target.businessYear}.
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-enterprise">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-150"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-bold text-white bg-feedback-error rounded-lg hover:bg-red-650 shadow-sm hover:shadow-md transition-all duration-150 flex items-center gap-1.5"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Create New Business Year Modal ──────────────────────────────── */
const CreateBusinessYearModal = ({ onClose, onCreate, existingYears }) => {
  const nextLogical = getNextLogicalBusinessYear(existingYears);
  const [yearInput, setYearInput] = useState(nextLogical);
  const [copyPrevious, setCopyPrevious] = useState(true);
  const [error, setError] = useState('');

  const handleCreate = () => {
    const formatted = yearInput.trim();
    const yearRegex = /^\d{4}-\d{4}$/;
    if (!yearRegex.test(formatted)) {
      setError('Please enter a valid format (e.g. 2026-2027).');
      return;
    }

    const exists = existingYears.some((y) => y.value === formatted);
    if (exists) {
      setError('This Business Year already exists.');
      return;
    }

    onCreate(formatted, copyPrevious);
  };

  const startYear = yearInput.split('-')[0] || 'YYYY';
  const endYear = yearInput.split('-')[1] || 'YYYY';
  const calculatedLabel = `1 July ${startYear} – 30 June ${endYear}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-md animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-brand-navy to-[#162040]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <FiTarget className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Create New Business Year</h2>
              <p className="text-[10px] text-white/50 font-medium mt-0.5">Setup pharmaceutical target goals</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <FiX className="w-4 h-4 text-white/80" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Business Year Input */}
          <Field label="Business Year (e.g. 2026-2027)" required error={error}>
            <input
              type="text"
              value={yearInput}
              onChange={(e) => {
                setYearInput(e.target.value);
                setError('');
              }}
              placeholder="e.g. 2026-2027"
              className={inputCls(error)}
            />
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-semibold italic">
              (Automatically calculated as {calculatedLabel})
            </p>
          </Field>

          {/* Creation Options */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
              Target Creation Options
            </label>
            <div className="space-y-2.5">
              {/* Option 1: Copy Previous */}
              <button
                type="button"
                onClick={() => setCopyPrevious(true)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 flex items-start gap-3
                  ${copyPrevious
                    ? 'border-brand-primary bg-red-50/10 dark:bg-brand-primary/5 shadow-sm'
                    : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-gray-50/30 dark:bg-gray-800/10'
                  }`}
              >
                <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                  ${copyPrevious ? 'bg-brand-primary text-white' : 'bg-gray-150 dark:bg-gray-800 text-gray-400'}`}>
                  <FiCopy className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Copy Previous Year's Targets</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-normal">
                    Copies all products and their target quantities. You can edit them later.
                  </p>
                </div>
              </button>

              {/* Option 2: Empty Targets */}
              <button
                type="button"
                onClick={() => setCopyPrevious(false)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 flex items-start gap-3
                  ${!copyPrevious
                    ? 'border-brand-primary bg-red-50/10 dark:bg-brand-primary/5 shadow-sm'
                    : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-gray-50/30 dark:bg-gray-800/10'
                  }`}
              >
                <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                  ${!copyPrevious ? 'bg-brand-primary text-white' : 'bg-gray-150 dark:bg-gray-800 text-gray-400'}`}>
                  <FiFileText className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Create Empty Targets</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-550 mt-0.5 leading-normal">
                    Copies all products and sets target quantities to 0. Enter targets manually.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-enterprise">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all duration-150"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-5 py-2 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm hover:shadow-md transition-all duration-150"
          >
            Create Business Year
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Empty State ────────────────────────────────────────────────── */
const EmptyState = ({ onAdd }) => (
  <tr>
    <td colSpan={8} className="px-5 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-center justify-center">
          <FiTarget className="w-8 h-8 text-gray-200 dark:text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-400 dark:text-gray-550">No targets found.</p>
          <p className="text-[11px] text-gray-300 dark:text-gray-650 font-medium mt-1">Start by adding your first product target objective.</p>
        </div>
        <button
          onClick={onAdd}
          className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm hover:shadow-md transition-all duration-150"
        >
          <FiPlus className="w-3.5 h-3.5" /> Add First Target
        </button>
      </div>
    </td>
  </tr>
);

/* ─── Loading Skeleton Rows ──────────────────────────────────────── */
const SkeletonRows = () => {
  return (
    <>
      {[1, 2, 3, 4, 5].map((idx) => (
        <tr key={idx} className="border-b border-gray-50 dark:border-gray-800/50">
          <td className="px-5 py-4">
            <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </td>
          <td className="px-5 py-4">
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </td>
          <td className="px-5 py-4">
            <div className="h-4 w-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </td>
          <td className="px-5 py-4">
            <div className="h-4 w-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </td>
          <td className="px-5 py-4">
            <div className="h-4 w-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </td>
          <td className="px-5 py-4">
            <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
            <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          </td>
          <td className="px-5 py-4">
            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          </td>
          <td className="px-5 py-4">
            <div className="flex gap-2">
              <div className="h-7 w-14 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              <div className="h-7 w-14 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              <div className="h-7 w-14 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
};

/* ─── Pagination Component ────────────────────────────────────────── */
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalRecords,
  startIndex,
  endIndex
}) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10">
      <p className="text-[11px] font-medium text-gray-400 dark:text-gray-550">
        Showing <span className="font-semibold text-gray-700 dark:text-gray-300">{startIndex + 1}</span> to{' '}
        <span className="font-semibold text-gray-700 dark:text-gray-300">{Math.min(endIndex, totalRecords)}</span> of{' '}
        <span className="font-semibold text-gray-700 dark:text-gray-300">{totalRecords}</span> records
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
        >
          Previous
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
              currentPage === p
                ? 'bg-brand-primary text-white shadow-sm'
                : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
        >
          Next
        </button>
      </div>
    </div>
  );
};

/* ─── Main Page ──────────────────────────────────────────────────── */
const ProductTargets = () => {
  const [targets, setTargets] = useState(INITIAL_TARGETS);
  const [businessYears, setBusinessYears] = useState(INITIAL_BUSINESS_YEARS);
  const [activeYear, setActiveYear] = useState('2025-2026'); // Default Business Year
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // New business year banner reminder states
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const [toast, setToast] = useState(null);

  // Modals state
  const [modal, setModal] = useState(null); // { mode: 'add' | 'edit', target }
  const [createYearModalOpen, setCreateYearModalOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Check if current date has entered a new business year that is not created yet
  const showReminderBanner = useMemo(() => {
    if (reminderDismissed) return false;
    const curYearValue = calculateCurrentBusinessYear();
    const exists = businessYears.some((y) => y.value === curYearValue);
    return !exists;
  }, [businessYears, reminderDismissed]);

  // Simulate loading state
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [activeYear]);

  // Reset page when search or status filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, activeYear]);

  /* Filtered List with Calculations */
  const filteredWithStats = useMemo(() => {
    const q = search.toLowerCase().trim();
    return targets
      .map((t) => ({
        ...t,
        stats: getTargetStats(t)
      }))
      .filter((t) => {
        // Business Year filter
        const matchYear = t.businessYear === activeYear;

        // Search filter (Product Name, Group, Notes)
        const matchSearch =
          !q ||
          t.stats.productName.toLowerCase().includes(q) ||
          t.group.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q));

        // Status filter
        const matchStatus = statusFilter === 'All' || t.stats.status === statusFilter;

        return matchYear && matchSearch && matchStatus;
      });
  }, [targets, search, statusFilter, activeYear]);

  /* Paginated List */
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTargets = useMemo(() => {
    return filteredWithStats.slice(startIndex, endIndex);
  }, [filteredWithStats, startIndex, endIndex]);

  const totalPages = Math.ceil(filteredWithStats.length / itemsPerPage);

  /* Handlers */
  const openAdd = () => setModal({ mode: 'add', target: null });
  const openEdit = (t) => setModal({ mode: 'edit', target: t });
  const closeModal = () => setModal(null);

  const handleSave = (form) => {
    if (modal.mode === 'add') {
      const newTarget = {
        ...form,
        id: nextId++,
        achievedQuantity: 0
      };
      setTargets((prev) => [newTarget, ...prev]);
    } else {
      setTargets((prev) =>
        prev.map((t) => (t.id === form.id ? { ...t, ...form } : t))
      );
    }
    closeModal();
  };

  const handleDelete = () => {
    setTargets((prev) => prev.filter((t) => t.id !== toDelete.id));
    setToDelete(null);
  };

  const handleClear = () => {
    setSearch('');
    setStatusFilter('All');
  };

  /* Create Business Year */
  const handleCreateBusinessYear = (newYearValue, copyPrevious) => {
    const startYear = newYearValue.split('-')[0];
    const newYearLabel = `1 July ${startYear} – 30 June ${Number(startYear) + 1}`;

    // 1. Add to business years list
    setBusinessYears((prev) => [
      { value: newYearValue, label: newYearLabel },
      ...prev
    ]);

    let newTargetsToCreate = [];

    if (copyPrevious) {
      const prevYearStart = Number(startYear) - 1;
      const prevYearValue = `${prevYearStart}-${startYear}`;
      const prevTargets = targets.filter((t) => t.businessYear === prevYearValue);
      
      newTargetsToCreate = prevTargets.map((t) => ({
        id: nextId++,
        businessYear: newYearValue,
        productId: t.productId,
        group: t.group,
        targetQuantity: t.targetQuantity,
        achievedQuantity: 0,
        notes: `Copied from business year ${prevYearValue}.`
      }));
    } else {
      newTargetsToCreate = PRODUCTS.map((prod) => ({
        id: nextId++,
        businessYear: newYearValue,
        productId: prod.id,
        group: prod.group,
        targetQuantity: 0,
        achievedQuantity: 0,
        notes: 'Initialized with empty target quantity.'
      }));
    }

    // 2. Add new targets to state list
    setTargets((prev) => [...newTargetsToCreate, ...prev]);

    // 3. Automatically switch selection to newly created business year
    setActiveYear(newYearValue);

    // 4. Close modal & display success toast
    setCreateYearModalOpen(false);
    setToast({
      message: 'Business Year created successfully.',
      type: 'success'
    });
  };

  const activeYearLabel = businessYears.find((y) => y.value === activeYear)?.label || activeYear;

  return (
    <DashboardLayout pageTitle="Product Targets">
      <div className="space-y-6 animate-fade-in">
        {/* ── Optional Automatic Reminder Banner ── */}
        {showReminderBanner && (
          <div className="bg-gradient-to-r from-brand-navy to-[#162040] text-white px-5 py-4 rounded-enterprise shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 animate-bounce">
                <FiBell className="w-4.5 h-4.5 text-brand-primary" />
              </div>
              <div>
                <p className="text-xs font-bold">New Business Year Reminder</p>
                <p className="text-[11px] text-white/70 mt-0.5">
                  A new Business Year has started. Create targets for the new Business Year.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCreateYearModalOpen(true)}
                className="px-4 py-2 text-xs font-bold text-[#1e293b] bg-white rounded-lg hover:bg-gray-100 shadow-sm transition-all duration-150"
              >
                Create Now
              </button>
              <button
                onClick={() => setReminderDismissed(true)}
                className="px-3 py-2 text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-150"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Product Targets</h1>
            <p className="text-xs text-gray-400 dark:text-gray-550 font-medium mt-1">Manage annual product targets.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Business Year Selector */}
            <div className="relative">
              <select
                value={activeYear}
                onChange={(e) => setActiveYear(e.target.value)}
                className="pl-3 pr-8 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none cursor-pointer hover:border-gray-300 dark:hover:border-gray-650 transition-colors appearance-none min-w-[210px]"
              >
                {businessYears.map((y) => (
                  <option key={y.value} value={y.value}>{y.label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>

            {/* New Business Year Action Button */}
            <button
              onClick={() => setCreateYearModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-[#1e293b] dark:bg-gray-800 rounded-lg hover:bg-slate-800 dark:hover:bg-gray-700 shadow-sm transition-all duration-150"
            >
              <FiPlus className="w-3.5 h-3.5" /> New Business Year
            </button>

            {/* Add Target Button */}
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm hover:shadow-md transition-all duration-150"
            >
              <FiPlus className="w-3.5 h-3.5" /> Add Target
            </button>
          </div>
        </div>

        {/* ── Search & Filter Controls ── */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Product name, Group, or Notes..."
                className="w-full pl-9 pr-4 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg p-1">
              {['All', 'Not Started', 'In Progress', 'Achieved'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all duration-150
                    ${statusFilter === s
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm border border-gray-100 dark:border-gray-600'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Clear Button */}
            {(search || statusFilter !== 'All') && (
              <button
                onClick={handleClear}
                className="px-3 py-2.5 text-xs font-bold text-gray-500 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap"
              >
                <FiX className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Table & Pagination Card ── */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">
                Targets for {activeYearLabel}
              </h3>
              <p className="text-[10px] text-gray-400 dark:text-gray-550 font-medium mt-0.5">
                {loading ? 'Loading records...' : `Showing ${paginatedTargets.length} of ${filteredWithStats.length} objectives`}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs" aria-label="Product Targets table">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  {[
                    'Product',
                    'Group',
                    'Target Quantity',
                    'Achieved Quantity',
                    'Remaining Quantity',
                    'Progress (%)',
                    'Status',
                    'Actions'
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-5 py-3.5 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {loading ? (
                  <SkeletonRows />
                ) : paginatedTargets.length === 0 ? (
                  <EmptyState onAdd={openAdd} />
                ) : (
                  paginatedTargets.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors duration-100 group"
                    >
                      {/* Product Name */}
                      <td className="px-5 py-4 font-semibold text-gray-855 dark:text-gray-200 whitespace-nowrap">
                        {t.stats.productName}
                      </td>
                      {/* Group */}
                      <td className="px-5 py-4 text-gray-650 dark:text-gray-300 whitespace-nowrap">
                        {t.group}
                      </td>
                      {/* Target Quantity */}
                      <td className="px-5 py-4 font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                        {t.stats.targetQuantity.toLocaleString()}{' '}
                        <span className="text-[9px] font-medium text-gray-400 dark:text-gray-550">{t.stats.unit}</span>
                      </td>
                      {/* Achieved Quantity */}
                      <td className="px-5 py-4 font-bold text-feedback-success whitespace-nowrap">
                        {t.stats.achievedQuantity.toLocaleString()}{' '}
                        <span className="text-[9px] font-medium text-gray-400 dark:text-gray-550">{t.stats.unit}</span>
                      </td>
                      {/* Remaining Quantity */}
                      <td className="px-5 py-4 font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {t.stats.remainingQuantity.toLocaleString()}{' '}
                        <span className="text-[9px] font-medium text-gray-450 dark:text-gray-550">{t.stats.unit}</span>
                      </td>
                      {/* Progress Bar & percentage */}
                      <td className="px-5 py-4 min-w-[120px]">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-extrabold text-gray-800 dark:text-gray-200">{t.stats.progressPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-brand-primary h-full rounded-full transition-all duration-300"
                            style={{ width: `${t.stats.progressPercent}%` }}
                          />
                        </div>
                      </td>
                      {/* Status Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={t.stats.status} />
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewTarget(t)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-blue-650 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-150"
                          >
                            <FiEye className="w-3 h-3" /> View
                          </button>
                          <button
                            onClick={() => openEdit(t)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:border-amber-200 dark:hover:border-amber-700 transition-all duration-150"
                          >
                            <FiEdit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => setToDelete(t)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-feedback-error bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/50 hover:border-red-200 dark:hover:border-red-700 transition-all duration-150"
                          >
                            <FiTrash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalRecords={filteredWithStats.length}
              startIndex={startIndex}
              endIndex={endIndex}
            />
          )}
        </div>
      </div>

      {/* ── Modals & Dialogs ── */}
      {modal && (
        <TargetModal
          mode={modal.mode}
          target={modal.target}
          existingTargets={targets}
          businessYearsList={businessYears}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}

      {viewTarget && (
        <TargetDetailsModal
          target={viewTarget}
          businessYearsList={businessYears}
          onClose={() => setViewTarget(null)}
        />
      )}

      {toDelete && (
        <DeleteConfirmationDialog
          target={toDelete}
          onCancel={() => setToDelete(null)}
          onConfirm={handleDelete}
        />
      )}

      {createYearModalOpen && (
        <CreateBusinessYearModal
          onClose={() => setCreateYearModalOpen(false)}
          onCreate={handleCreateBusinessYear}
          existingYears={businessYears}
        />
      )}

      {/* ── Success Toast Alert ── */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[100] max-w-sm">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToToast(null)}
          />
        </div>
      )}
    </DashboardLayout>
  );
};

export default ProductTargets;
