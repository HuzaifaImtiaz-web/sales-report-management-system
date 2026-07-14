import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import Toast from '../components/Toast';
import {
  FiSearch, FiPlus, FiEye, FiEdit2, FiTrash2,
  FiX, FiAlertTriangle, FiCheck, FiShoppingBag,
  FiCalendar, FiUser, FiMapPin, FiBriefcase,
  FiTrash, FiCheckCircle
} from 'react-icons/fi';

/* ─── Static Dummy Data from Other Modules ───────────────────────── */
const PRODUCTS = [
  { id: 1, name: 'Amoxicillin 500mg', unit: 'Vials', rate: 450 },
  { id: 2, name: 'Paracetamol 650mg', unit: 'Vials', rate: 120 },
  { id: 3, name: 'Metformin 850mg', unit: 'Vials', rate: 380 },
  { id: 4, name: 'Lipitor 10mg', unit: 'Vials', rate: 950 },
  { id: 5, name: 'Ibuprofen 400mg', unit: 'Vials', rate: 90 },
  { id: 6, name: 'Omeprazole 20mg', unit: 'Vials', rate: 520 },
  { id: 7, name: 'Augmentin 625mg', unit: 'Vials', rate: 1100 },
  { id: 8, name: 'Azithromycin 250mg', unit: 'Vials', rate: 670 },
  { id: 9, name: 'Ventolin Inhaler', unit: 'Vials', rate: 850 },
  { id: 10, name: 'Crestor 10mg', unit: 'Vials', rate: 1350 }
];

const DOCTORS = [
  { id: 1, name: 'Dr. Ayesha Khan', hospital: 'Mayo Hospital' },
  { id: 2, name: 'Dr. Hamid Raza', hospital: 'Jinnah Hospital' },
  { id: 3, name: 'Dr. Nadia Siddiqui', hospital: 'Shifa International' },
  { id: 4, name: 'Dr. Farhan Latif', hospital: 'Holy Family Hospital' },
  { id: 5, name: 'Dr. Saima Riaz', hospital: 'FIC Faisalabad' },
  { id: 6, name: 'Dr. Tariq Mehmood', hospital: 'Nishtar Hospital' },
  { id: 7, name: 'Dr. Bilal Aslam', hospital: 'Lady Reading Hospital' }
];

const AREAS = [
  'Lahore Central',
  'Karachi South',
  'Islamabad F-10',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar'
];

const TEAM_MEMBERS = [
  { id: 1, name: 'Ahmed Shah', designation: 'Medical Representative' },
  { id: 2, name: 'Zainab Fatima', designation: 'Territory Manager' },
  { id: 3, name: 'Usman Ali', designation: 'Area Sales Manager' },
  { id: 4, name: 'Mariam Khan', designation: 'Medical Representative' },
  { id: 5, name: 'Bilal Siddiqui', designation: 'Medical Representative' },
  { id: 6, name: 'Ayesha Malik', designation: 'Medical Representative' },
  { id: 7, name: 'Haris Rehman', designation: 'Territory Manager' }
];

const INITIAL_PURCHASE_ORDERS = [
  {
    id: 1,
    poNumber: 'PO-2026-081',
    poDate: '2026-07-10',
    doctorId: 1,
    area: 'Lahore Central',
    teamMemberId: 1,
    status: 'Pending',
    remarks: 'Deliver to main pharmacy branch before Friday noon. Priority delivery requested.',
    items: [
      { productId: 1, quantity: 150 }, // Amoxicillin 500mg
      { productId: 3, quantity: 80 }   // Metformin 850mg
    ]
  },
  {
    id: 2,
    poNumber: 'PO-2026-082',
    poDate: '2026-07-12',
    doctorId: 2,
    area: 'Karachi South',
    teamMemberId: 2,
    status: 'Completed',
    remarks: 'Standard bulk procurement order.',
    items: [
      { productId: 4, quantity: 300 }, // Lipitor 10mg
      { productId: 6, quantity: 120 }, // Omeprazole 20mg
      { productId: 10, quantity: 50 }  // Crestor 10mg
    ]
  },
  {
    id: 3,
    poNumber: 'PO-2026-083',
    poDate: '2026-07-14',
    doctorId: 3,
    area: 'Islamabad F-10',
    teamMemberId: 3,
    status: 'Pending',
    remarks: 'Discuss options if Augmentin is short on inventory.',
    items: [
      { productId: 7, quantity: 100 }, // Augmentin 625mg
      { productId: 2, quantity: 500 }  // Paracetamol 650mg
    ]
  }
];

let nextId = 4;

/* ─── Calculations & Helper Functions ────────────────────────────── */
const getPOSummary = (po) => {
  const doc = DOCTORS.find((d) => d.id === Number(po.doctorId)) || {};
  const tm = TEAM_MEMBERS.find((e) => e.id === Number(po.teamMemberId)) || {};

  let totalQty = 0;
  let totalVal = 0;
  const itemsDetailed = (po.items || []).map((item) => {
    const prod = PRODUCTS.find((p) => p.id === Number(item.productId)) || {};
    const qty = Number(item.quantity) || 0;
    const rate = Number(prod.rate) || 0;
    const itemTotal = qty * rate;
    totalQty += qty;
    totalVal += itemTotal;
    return {
      ...item,
      productName: prod.name || 'Unknown Product',
      unit: prod.unit || 'Units',
      rate,
      total: itemTotal
    };
  });

  return {
    doctorName: doc.name || 'Unknown Doctor',
    teamMemberName: tm.name || 'Unknown Member',
    totalProductsCount: (po.items || []).length,
    totalQuantity: totalQty,
    totalValue: totalVal,
    itemsDetailed
  };
};

/* ─── Status Badge ───────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  if (status === 'Completed') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 dark:bg-green-900/30 text-feedback-success border border-green-100 dark:border-green-800/50">
        <span className="w-1.5 h-1.5 rounded-full bg-feedback-success inline-block" />
        Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-600 border border-amber-100 dark:border-amber-800/50">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
      Pending
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

/* ─── Multi-Step Form Modal (Create / Edit) ────────────────────────── */
const POModal = ({ mode, po, onClose, onSave, existingPOs }) => {
  const isEdit = mode === 'edit';
  const [step, setStep] = useState(1);

  // Form State
  const [form, setForm] = useState(() => {
    if (po) {
      // Ensure existing items have a rate field (back-fill from product if missing)
      return {
        ...po,
        items: (po.items || []).map((item) => {
          if (item.rate !== undefined) return item;
          const prod = PRODUCTS.find((p) => p.id === Number(item.productId));
          return { ...item, rate: prod ? prod.rate : 0 };
        })
      };
    }
    return {
      poNumber: '',
      poDate: new Date().toISOString().split('T')[0],
      doctorId: '',
      area: '',
      teamMemberId: '',
      remarks: '',
      items: [{ productId: '', quantity: '', rate: '' }]
    };
  });

  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const handleItemChange = (index, key, val) => {
    const newItems = [...form.items];
    const updatedItem = { ...newItems[index], [key]: val };
    // When product changes, auto-fill rate from the product's default rate
    if (key === 'productId') {
      const prod = PRODUCTS.find((p) => p.id === Number(val));
      updatedItem.rate = prod ? prod.rate : '';
    }
    newItems[index] = updatedItem;
    setForm((f) => ({ ...f, items: newItems }));
    setErrors((e) => ({ ...e, items: '' }));
  };

  const addItemRow = () => {
    setForm((f) => ({
      ...f,
      items: [...f.items, { productId: '', quantity: '', rate: '' }]
    }));
  };

  const removeItemRow = (index) => {
    const newItems = form.items.filter((_, i) => i !== index);
    setForm((f) => ({ ...f, items: newItems }));
  };

  // Grand Total Quantity of form items
  const grandTotalQuantity = useMemo(() => {
    return form.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [form.items]);

  // Grand Total Value of form items — uses per-item rate, NOT product default
  const grandTotalValue = useMemo(() => {
    return form.items.reduce((sum, item) => {
      const rate = Number(item.rate) || 0;
      return sum + (Number(item.quantity) || 0) * rate;
    }, 0);
  }, [form.items]);

  const validateStep = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.poNumber.trim()) e.poNumber = 'PO Number is required.';
      // Check duplicate PO number
      if (form.poNumber.trim()) {
        const isDuplicate = existingPOs.some(
          (o) => o.poNumber.toLowerCase().trim() === form.poNumber.toLowerCase().trim() && (!isEdit || o.id !== form.id)
        );
        if (isDuplicate) {
          e.poNumber = 'This PO Number already exists.';
        }
      }
      if (!form.poDate) e.poDate = 'PO Date is required.';
      if (!form.doctorId) e.doctorId = 'Doctor is required.';
      if (!form.area) e.area = 'Area is required.';
      if (!form.teamMemberId) e.teamMemberId = 'Team Member is required.';
    } else if (s === 2) {
      if (!form.items || form.items.length === 0) {
        e.items = 'At least one product item is required.';
      } else {
        const itemErrors = [];
        form.items.forEach((item, index) => {
          if (!item.productId) {
            itemErrors.push(`Row ${index + 1}: Product selection is required.`);
          }
          if (item.quantity === '' || Number(item.quantity) <= 0) {
            itemErrors.push(`Row ${index + 1}: Quantity must be greater than 0.`);
          }
        });
        if (itemErrors.length) {
          e.items = itemErrors.join(' | ');
        }
      }
    }
    return e;
  };

  const handleNext = () => {
    const e = validateStep(step);
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSave = () => {
    const e = validateStep(3); // Double check final validation
    const e2 = validateStep(2);
    const e1 = validateStep(1);
    const combined = { ...e1, ...e2, ...e };
    if (Object.keys(combined).length) {
      setErrors(combined);
      // Fallback to step that contains the error
      if (Object.keys(e1).length) setStep(1);
      else if (Object.keys(e2).length) setStep(2);
      return;
    }

    onSave({
      ...form,
      doctorId: Number(form.doctorId),
      teamMemberId: Number(form.teamMemberId),
      items: form.items.map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity)
      }))
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-2xl animate-slide-up overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-brand-navy to-[#162040]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <FiShoppingBag className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}</h2>
              <p className="text-[10px] text-white/50 font-medium mt-0.5">Step {step} of 3: {step === 1 ? 'Information' : step === 2 ? 'Products Selection' : 'Remarks'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <FiX className="w-4 h-4 text-white/80" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-gray-150 dark:bg-gray-800 h-1">
          <div
            className="bg-brand-primary h-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {/* STEP 1: PO Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Purchase Order Number" required error={errors.poNumber}>
                  <input
                    type="text"
                    value={form.poNumber}
                    onChange={(e) => set('poNumber', e.target.value)}
                    placeholder="e.g. PO-8831"
                    className={inputCls(errors.poNumber)}
                  />
                </Field>
                <Field label="PO Date" required error={errors.poDate}>
                  <input
                    type="date"
                    value={form.poDate}
                    onChange={(e) => set('poDate', e.target.value)}
                    className={inputCls(errors.poDate)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Doctor" required error={errors.doctorId}>
                  <select
                    value={form.doctorId}
                    onChange={(e) => set('doctorId', e.target.value)}
                    className={inputCls(errors.doctorId) + ' appearance-none cursor-pointer'}
                  >
                    <option value="">Select Doctor...</option>
                    {DOCTORS.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.hospital})</option>
                    ))}
                  </select>
                </Field>

                <Field label="Area" required error={errors.area}>
                  <select
                    value={form.area}
                    onChange={(e) => set('area', e.target.value)}
                    className={inputCls(errors.area) + ' appearance-none cursor-pointer'}
                  >
                    <option value="">Select Area...</option>
                    {AREAS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Team Member" required error={errors.teamMemberId}>
                  <select
                    value={form.teamMemberId}
                    onChange={(e) => set('teamMemberId', e.target.value)}
                    className={inputCls(errors.teamMemberId) + ' appearance-none cursor-pointer'}
                  >
                    <option value="">Select Member...</option>
                    {TEAM_MEMBERS.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.designation})</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          )}

          {/* STEP 2: Products Section */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Selected Products</span>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm transition-all duration-150"
                >
                  <FiPlus className="w-3.5 h-3.5" /> Add Product
                </button>
              </div>

              {errors.items && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-lg text-xs font-semibold text-feedback-error">
                  {errors.items}
                </div>
              )}

              {/* Rows List */}
              <div className="space-y-3">
                {form.items.map((item, idx) => {
                  const selectedProd = PRODUCTS.find((p) => p.id === Number(item.productId)) || null;
                  const unit = selectedProd ? selectedProd.unit : '—';
                  // Use item's own rate (editable per-PO), NOT the product default
                  const lineRate = Number(item.rate) || 0;
                  const lineTotal = (Number(item.quantity) || 0) * lineRate;

                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-gray-50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 rounded-xl p-3"
                    >
                      {/* Product Selector — col-span 4 */}
                      <div className="sm:col-span-4">
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                          Product
                        </label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          className={inputCls(false) + ' appearance-none cursor-pointer'}
                        >
                          <option value="">Choose product...</option>
                          {PRODUCTS.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity Input — col-span 2 */}
                      <div className="sm:col-span-2">
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-550 mb-1.5">
                          Qty
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          placeholder="0"
                          className={inputCls(false)}
                        />
                      </div>

                      {/* Unit Column — col-span 1 */}
                      <div className="sm:col-span-1 flex flex-col justify-end">
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                          Unit
                        </label>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block pb-2.5 text-center">
                          {unit}
                        </span>
                      </div>

                      {/* Rate Input (editable) — col-span 2 */}
                      <div className="sm:col-span-2">
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                          Rate (Rs)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                          placeholder="0.00"
                          className={inputCls(false)}
                        />
                        {selectedProd && Number(item.rate) !== selectedProd.rate && (
                          <p className="text-[9px] text-amber-500 font-semibold mt-0.5">
                            Default: Rs {selectedProd.rate.toLocaleString()}
                          </p>
                        )}
                      </div>

                      {/* Line Total — col-span 2 */}
                      <div className="sm:col-span-2 flex flex-col justify-end">
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                          Total
                        </label>
                        <span className="text-xs font-extrabold text-brand-primary block pb-2.5 text-right">
                          Rs {lineTotal.toLocaleString()}
                        </span>
                      </div>

                      {/* Delete Action — col-span 1 */}
                      <div className="sm:col-span-1 flex justify-center pb-1">
                        <button
                          type="button"
                          disabled={form.items.length <= 1}
                          onClick={() => removeItemRow(idx)}
                          className="w-8 h-8 rounded-lg border border-red-100 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 text-feedback-error disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                        >
                          <FiTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grand Totals Block */}
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-enterprise flex items-center justify-between border border-gray-150 dark:border-gray-800">
                <span className="text-xs font-bold text-gray-550 dark:text-gray-400 uppercase tracking-widest">Grand Totals</span>
                <div className="flex gap-6">
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Quantity</p>
                    <p className="text-sm font-extrabold text-gray-800 dark:text-white mt-0.5">{grandTotalQuantity.toLocaleString()} units</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Total Value</p>
                    <p className="text-sm font-extrabold text-brand-primary mt-0.5">Rs {grandTotalValue.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Remarks */}
          {step === 3 && (
            <div className="space-y-4">
              <Field label="Remarks & Special Notes">
                <textarea
                  rows={6}
                  value={form.remarks}
                  onChange={(e) => set('remarks', e.target.value)}
                  placeholder="Enter any medical representative notes, order routing instructions, or custom delivery requests..."
                  className={inputCls(false) + ' resize-none'}
                />
              </Field>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-enterprise">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-150"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-150"
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 text-xs font-bold text-white bg-brand-navy rounded-lg hover:bg-[#162040] shadow-sm transition-all duration-150"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm hover:shadow-md transition-all duration-150 flex items-center gap-1.5"
              >
                <FiCheck className="w-3.5 h-3.5" />
                {isEdit ? 'Save Changes' : 'Save Purchase Order'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Detail Modal (View Only) ────────────────────────────────────── */
const PODetailsModal = ({ po, onClose }) => {
  const summary = useMemo(() => getPOSummary(po), [po]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-2xl animate-slide-up overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-brand-navy to-[#162040]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <FiShoppingBag className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Purchase Order Details</h2>
              <p className="text-[10px] text-white/50 font-medium mt-0.5">{po.poNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <FiX className="w-4 h-4 text-white/80" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Info Blocks Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-100/50 dark:border-gray-800/50">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">PO Number</p>
              <p className="text-xs font-mono font-bold text-gray-900 dark:text-white mt-1">{po.poNumber}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-100/50 dark:border-gray-800/50">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">PO Date</p>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-1">{po.poDate}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-100/50 dark:border-gray-800/50">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-550">Area</p>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-1">{po.area}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-100/50 dark:border-gray-800/50">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Status</p>
              <div className="mt-1.5"><StatusBadge status={po.status} /></div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-100/50 dark:border-gray-800/50 col-span-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-550">Doctor</p>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-1">{summary.doctorName}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-100/50 dark:border-gray-800/50 col-span-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-550">Team Member (MR)</p>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-1">{summary.teamMemberName}</p>
            </div>
          </div>

          {/* Product Items Table */}
          <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-550">Products List</p>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-left bg-gray-50/20 dark:bg-gray-800/10">
                  <th className="px-4 py-2.5 text-gray-400 uppercase font-bold text-[9px] tracking-wider">Product Name</th>
                  <th className="px-4 py-2.5 text-right text-gray-400 uppercase font-bold text-[9px] tracking-wider">Quantity</th>
                  <th className="px-4 py-2.5 text-center text-gray-400 uppercase font-bold text-[9px] tracking-wider">Unit</th>
                  <th className="px-4 py-2.5 text-right text-gray-400 uppercase font-bold text-[9px] tracking-wider">Rate</th>
                  <th className="px-4 py-2.5 text-right text-gray-400 uppercase font-bold text-[9px] tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {summary.itemsDetailed.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/40 dark:hover:bg-gray-800/10">
                    <td className="px-4 py-3 font-semibold text-gray-850 dark:text-gray-200">{item.productName}</td>
                    <td className="px-4 py-3 text-right font-extrabold text-gray-800 dark:text-gray-200">{item.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{item.unit}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Rs {item.rate.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-extrabold text-brand-primary">Rs {item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total Footer */}
            <div className="bg-gray-50/50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800 px-4 py-3 flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-550 dark:text-gray-400">Grand Totals</span>
              <div className="flex gap-6">
                <span className="text-xs font-extrabold text-gray-850 dark:text-gray-200">
                  {summary.totalQuantity.toLocaleString()} units
                </span>
                <span className="text-xs font-extrabold text-brand-primary">
                  Rs {summary.totalValue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Remarks */}
          {po.remarks && (
            <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800 pb-2 mb-2">Remarks & Notes</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed italic">
                &ldquo;{po.remarks}&rdquo;
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

/* ─── Confirmation Dialog ────────────────────────────────────────── */
const ConfirmDialog = ({ title, message, onCancel, onConfirm, actionText = 'Confirm', type = 'info' }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-md animate-slide-up">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
            ${type === 'danger' ? 'bg-red-50 dark:bg-red-900/30' : 'bg-green-50 dark:bg-green-900/30'}`}>
            {type === 'danger' ? (
              <FiAlertTriangle className="w-5 h-5 text-feedback-error" />
            ) : (
              <FiCheckCircle className="w-5 h-5 text-feedback-success" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h2>
          </div>
        </div>
        <div className="px-6 py-5">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-enterprise">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 transition-all duration-150"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all duration-150
              ${type === 'danger' ? 'bg-feedback-error hover:bg-red-600' : 'bg-feedback-success hover:bg-green-600'}`}
          >
            {actionText}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Empty State ────────────────────────────────────────────────── */
const EmptyState = ({ onAdd }) => (
  <tr>
    <td colSpan={9} className="px-5 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-center justify-center">
          <FiShoppingBag className="w-8 h-8 text-gray-200 dark:text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-400 dark:text-gray-550">No Purchase Orders Found</p>
          <p className="text-[11px] text-gray-305 dark:text-gray-600 font-medium mt-1">Start by creating your first purchase order.</p>
        </div>
        <button
          onClick={onAdd}
          className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm hover:shadow-md transition-all duration-150"
        >
          <FiPlus className="w-3.5 h-3.5" /> Create Purchase Order
        </button>
      </div>
    </td>
  </tr>
);

/* ─── Pagination Component ──────────────────────────────────────── */
const Pagination = ({ currentPage, totalPages, onPageChange, totalRecords, startIndex, endIndex }) => {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10">
      <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
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

/* ─── Loading Skeleton Rows ──────────────────────────────────────── */
const SkeletonRows = () => {
  return (
    <>
      {[1, 2, 3, 4, 5].map((idx) => (
        <tr key={idx} className="border-b border-gray-50 dark:border-gray-800/50">
          <td className="px-5 py-4">
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </td>
          <td className="px-5 py-4">
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </td>
          <td className="px-5 py-4">
            <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </td>
          <td className="px-5 py-4">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </td>
          <td className="px-5 py-4">
            <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </td>
          <td className="px-5 py-4 text-right">
            <div className="h-4 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto" />
          </td>
          <td className="px-5 py-4 text-right">
            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto" />
          </td>
          <td className="px-5 py-4">
            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          </td>
          <td className="px-5 py-4">
            <div className="flex gap-2">
              <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
};

/* ─── Main Sales Entry Component ─────────────────────────────────── */
const SalesEntry = () => {
  const [purchaseOrders, setPurchaseOrders] = useState(INITIAL_PURCHASE_ORDERS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [teamMemberFilter, setTeamMemberFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modals state
  const [modal, setModal] = useState(null); // { mode: 'add' | 'edit', po }
  const [viewPO, setViewPO] = useState(null);
  const [toComplete, setToComplete] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Loading state simulation on filter changes
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [statusFilter, dateFilter, areaFilter, teamMemberFilter]);

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dateFilter, areaFilter, teamMemberFilter]);

  /* Filtered List with Calculations */
  const filteredWithStats = useMemo(() => {
    const q = search.toLowerCase().trim();
    return purchaseOrders
      .map((po) => ({
        ...po,
        summary: getPOSummary(po)
      }))
      .filter((po) => {
        // Search filter (PO Number, Doctor, Team Member)
        const matchSearch =
          !q ||
          po.poNumber.toLowerCase().includes(q) ||
          po.summary.doctorName.toLowerCase().includes(q) ||
          po.summary.teamMemberName.toLowerCase().includes(q);

        // Status filter
        const matchStatus = statusFilter === 'All' || po.status === statusFilter;

        // Date filter
        const matchDate = !dateFilter || po.poDate === dateFilter;

        // Area filter
        const matchArea = !areaFilter || po.area === areaFilter;

        // Team Member filter
        const matchTeamMember = !teamMemberFilter || Number(po.teamMemberId) === Number(teamMemberFilter);

        return matchSearch && matchStatus && matchDate && matchArea && matchTeamMember;
      });
  }, [purchaseOrders, search, statusFilter, dateFilter, areaFilter, teamMemberFilter]);

  /* Paginated List */
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPOs = useMemo(() => {
    return filteredWithStats.slice(startIndex, endIndex);
  }, [filteredWithStats, startIndex, endIndex]);

  const totalPages = Math.ceil(filteredWithStats.length / itemsPerPage);

  /* Handlers */
  const openAdd = () => setModal({ mode: 'add', po: null });
  const openEdit = (po) => setModal({ mode: 'edit', po });
  const closeModal = () => setModal(null);

  const handleSave = (form) => {
    if (modal.mode === 'add') {
      const newPO = {
        ...form,
        id: nextId++,
        status: 'Pending' // Defaults to Pending
      };
      setPurchaseOrders((prev) => [newPO, ...prev]);
      setToast({ message: 'Purchase Order created successfully.', type: 'success' });
    } else {
      setPurchaseOrders((prev) =>
        prev.map((o) => (o.id === form.id ? { ...o, ...form } : o))
      );
      setToast({ message: 'Purchase Order updated successfully.', type: 'success' });
    }
    closeModal();
  };

  const handleMarkCompleted = () => {
    setPurchaseOrders((prev) =>
      prev.map((o) => (o.id === toComplete.id ? { ...o, status: 'Completed' } : o))
    );
    setToComplete(null);
    setToast({ message: 'Purchase Order marked as Completed.', type: 'success' });
  };

  const handleDelete = () => {
    setPurchaseOrders((prev) => prev.filter((o) => o.id !== toDelete.id));
    setToDelete(null);
    setToast({ message: 'Purchase Order deleted successfully.', type: 'success' });
  };

  const handleClear = () => {
    setSearch('');
    setStatusFilter('All');
    setDateFilter('');
    setAreaFilter('');
    setTeamMemberFilter('');
  };

  return (
    <DashboardLayout pageTitle="Sales Entry">
      <div className="space-y-6 animate-fade-in">
        
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Sales Entry</h1>
            <p className="text-xs text-gray-400 dark:text-gray-550 font-medium mt-1">Create and manage Purchase Orders.</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              to={`/export?search=${encodeURIComponent(search)}&status=${encodeURIComponent(statusFilter === 'All' ? '' : statusFilter)}&area=${encodeURIComponent(areaFilter)}&startDate=${encodeURIComponent(dateFilter)}`}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-sm"
            >
              Export Center
            </Link>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm hover:shadow-md transition-all duration-150"
            >
              <FiPlus className="w-3.5 h-3.5" /> New Purchase Order
            </button>
          </div>
        </div>

        {/* ── Search & Filter Controls ── */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by PO Number, Doctor, or Team Member..."
                className="w-full pl-9 pr-4 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Status Filter Tab Controls */}
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg p-1">
              {['All', 'Pending', 'Completed'].map((s) => (
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
            {/* Date Filter */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <FiCalendar className="w-3.5 h-3.5" />
              </span>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-250 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all duration-150"
              />
            </div>

            {/* Area Filter */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <FiMapPin className="w-3.5 h-3.5" />
              </span>
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-250 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all duration-150 appearance-none"
              >
                <option value="">All Areas</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Team Member Filter */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <FiBriefcase className="w-3.5 h-3.5" />
              </span>
              <select
                value={teamMemberFilter}
                onChange={(e) => setTeamMemberFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-250 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all duration-150 appearance-none"
              >
                <option value="">All Team Members</option>
                {TEAM_MEMBERS.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Clear Button */}
            {(search || statusFilter !== 'All' || dateFilter || areaFilter || teamMemberFilter) ? (
              <button
                onClick={handleClear}
                className="px-3 py-2.5 text-xs font-bold text-gray-500 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-150 flex items-center justify-center gap-1.5"
              >
                <FiX className="w-3.5 h-3.5" /> Clear Filters
              </button>
            ) : null}
          </div>
        </div>

        {/* ── Table & Pagination Card ── */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">
                Purchase Order Entries
              </h3>
              <p className="text-[10px] text-gray-400 dark:text-gray-550 font-medium mt-0.5">
                {loading ? 'Loading records...' : `Showing ${paginatedPOs.length} of ${filteredWithStats.length} entries`}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs" aria-label="Purchase Orders table">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  {[
                    'PO Number',
                    'PO Date',
                    'Doctor',
                    'Area',
                    'Team Member',
                    'Total Products',
                    'Total Quantity',
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
                ) : paginatedPOs.length === 0 ? (
                  <EmptyState onAdd={openAdd} />
                ) : (
                  paginatedPOs.map((po) => (
                    <tr
                      key={po.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors duration-100 group"
                    >
                      {/* PO Number */}
                      <td className="px-5 py-4 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        {po.poNumber}
                      </td>
                      {/* PO Date */}
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {po.poDate}
                      </td>
                      {/* Doctor */}
                      <td className="px-5 py-4 font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                        {po.summary.doctorName}
                      </td>
                      {/* Area */}
                      <td className="px-5 py-4 text-gray-550 dark:text-gray-400 whitespace-nowrap">
                        {po.area}
                      </td>
                      {/* Team Member */}
                      <td className="px-5 py-4 text-gray-650 dark:text-gray-300 whitespace-nowrap">
                        {po.summary.teamMemberName}
                      </td>
                      {/* Total Products */}
                      <td className="px-5 py-4 font-semibold text-right text-gray-850 dark:text-gray-200 whitespace-nowrap">
                        {po.summary.totalProductsCount}
                      </td>
                      {/* Total Quantity */}
                      <td className="px-5 py-4 font-bold text-right text-brand-primary whitespace-nowrap">
                        {po.summary.totalQuantity.toLocaleString()}
                      </td>
                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={po.status} />
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewPO(po)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-blue-650 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-150"
                          >
                            <FiEye className="w-3 h-3" /> View
                          </button>
                          <button
                            onClick={() => openEdit(po)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:border-amber-200 dark:hover:border-amber-700 transition-all duration-150"
                          >
                            <FiEdit2 className="w-3 h-3" /> Edit
                          </button>
                          {po.status === 'Pending' && (
                            <button
                              onClick={() => setToComplete(po)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800/50 hover:bg-green-100 dark:hover:bg-green-900/50 hover:border-green-200 dark:hover:border-green-700 transition-all duration-150"
                            >
                              <FiCheck className="w-3 h-3" /> Complete
                            </button>
                          )}
                          <button
                            onClick={() => setToDelete(po)}
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
        <POModal
          mode={modal.mode}
          po={modal.po}
          existingPOs={purchaseOrders}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}

      {viewPO && (
        <PODetailsModal
          po={viewPO}
          onClose={() => setViewPO(null)}
        />
      )}

      {toComplete && (
        <ConfirmDialog
          title="Mark Purchase Order Completed"
          message="Are you sure you want to mark this Purchase Order as Completed?"
          actionText="Confirm"
          type="success"
          onCancel={() => setToComplete(null)}
          onConfirm={handleMarkCompleted}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete Purchase Order"
          message={`Are you sure you want to delete Purchase Order ${toDelete.poNumber}? This action cannot be undone.`}
          actionText="Delete"
          type="danger"
          onCancel={() => setToDelete(null)}
          onConfirm={handleDelete}
        />
      )}

      {/* ── Success Toast Alert ── */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[100] max-w-sm">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </DashboardLayout>
  );
};

export default SalesEntry;
