import React, { useState, useEffect } from 'react';
import { FiCheck, FiEdit2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  'Antibiotics',
  'Analgesics',
  'Antidiabetics',
  'Cardiovascular',
  'Gastrointestinal',
  'Respiratory',
  'Other'
];

const UNIT_TYPES = [
  'Vials',
  'Tablets',
  'Capsules',
  'Syrup Bottles',
  'Ampoules',
  'Sachets',
  'Tubes',
  'Drops',
  'Inhalers',
  'Other'
];

const Field = ({ label, required, error, children }) => (
  <div>
    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
      {label} {required && <span className="text-feedback-error">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-feedback-error font-semibold mt-1">{error}</p>}
  </div>
);

const inputCls = (err, disabled) =>
  `w-full px-3 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-55 dark:bg-gray-800/50 border rounded-lg outline-none
   transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-550
   focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40
   ${err ? 'border-feedback-error bg-red-50 dark:bg-red-900/10' : 'border-gray-100 dark:border-gray-750'}
   ${disabled ? 'opacity-70 cursor-default bg-gray-100/50 dark:bg-gray-800/30' : ''}`;

export default function ProductsForm({ mode, item, onSave, onCancel }) {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    category: 'Antibiotics',
    packSizeQty: '',
    packSizeUnit: 'Tablets',
    packPrice: '',
    perUnitPrice: 0,
    status: 'Active',
    description: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || '',
        category: item.category || 'Antibiotics',
        packSizeQty: item.packSizeQty || '',
        packSizeUnit: item.packSizeUnit || 'Tablets',
        packPrice: item.packPrice || '',
        perUnitPrice: item.perUnitPrice || 0,
        status: item.status || 'Active',
        description: item.description || '',
        id: item.id
      });
    }
  }, [item]);

  // Auto-calculate perUnitPrice when packPrice or packSizeQty changes
  useEffect(() => {
    const qty = Number(form.packSizeQty);
    const price = Number(form.packPrice);
    if (qty > 0 && price > 0) {
      const perUnit = Number((price / qty).toFixed(2));
      setForm((f) => (f.perUnitPrice === perUnit ? f : { ...f, perUnitPrice: perUnit }));
    } else {
      setForm((f) => (f.perUnitPrice === 0 ? f : { ...f, perUnitPrice: 0 }));
    }
  }, [form.packSizeQty, form.packPrice]);

  const set = (k, v) => {
    if (isView) return;
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Product Name is required.';
    if (!form.category) e.category = 'Product Category is required.';
    
    const qty = Number(form.packSizeQty);
    if (form.packSizeQty === '' || isNaN(qty) || qty <= 0) {
      e.packSizeQty = 'Pack Size Quantity must be greater than 0.';
    }

    if (!form.packSizeUnit) e.packSizeUnit = 'Unit Type is required.';

    const price = Number(form.packPrice);
    if (form.packPrice === '' || isNaN(price) || price <= 0) {
      e.packPrice = 'Pack Price must be greater than 0.';
    }

    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    const qty = Number(form.packSizeQty);
    const price = Number(form.packPrice);
    const perUnit = Number((price / qty).toFixed(2));

    onSave({
      ...form,
      packSizeQty: qty,
      packPrice: price,
      perUnitPrice: perUnit,
      packSize: `${qty} ${form.packSizeUnit}`,
      rate: price // compatibility for orders/sales/reports
    });
  };

  return (
    <div className="space-y-5">
      {/* Name + Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Product Name" required error={errors.name}>
          <input
            disabled={isView}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Amoxicillin 500mg"
            className={inputCls(errors.name, isView)}
          />
        </Field>

        <Field label="Product Category" required error={errors.category}>
          {isView ? (
            <input
              disabled
              value={form.category}
              className={inputCls(false, true)}
            />
          ) : (
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className={inputCls(errors.category, isView) + ' appearance-none cursor-pointer'}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </Field>
      </div>

      {/* Pack Size (Quantity + Unit Type) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Pack Size Quantity" required error={errors.packSizeQty}>
            <input
              disabled={isView}
              type="number"
              min="1"
              value={form.packSizeQty}
              onChange={(e) => set('packSizeQty', e.target.value)}
              placeholder="e.g. 10"
              className={inputCls(errors.packSizeQty, isView)}
            />
          </Field>

          <Field label="Unit Type" required error={errors.packSizeUnit}>
            {isView ? (
              <input
                disabled
                value={form.packSizeUnit}
                className={inputCls(false, true)}
              />
            ) : (
              <select
                value={form.packSizeUnit}
                onChange={(e) => set('packSizeUnit', e.target.value)}
                className={inputCls(errors.packSizeUnit, isView) + ' appearance-none cursor-pointer'}
              >
                {UNIT_TYPES.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            )}
          </Field>
        </div>

        {/* Display Read-only computed Pack Size */}
        <Field label="Pack Size Description">
          <input
            disabled
            value={form.packSizeQty && form.packSizeUnit ? `${form.packSizeQty} ${form.packSizeUnit}` : ''}
            placeholder="Auto-generated Pack Size"
            className={inputCls(false, true)}
          />
        </Field>
      </div>

      {/* Pack Price + Per Unit Price */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Pack Price (Rs.)" required error={errors.packPrice}>
          <input
            disabled={isView}
            type="number"
            min="1"
            value={form.packPrice}
            onChange={(e) => set('packPrice', e.target.value)}
            placeholder="e.g. 5000"
            className={inputCls(errors.packPrice, isView)}
          />
        </Field>

        <Field label="Per Unit Price (Auto Calculated)">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">Rs.</span>
            <input
              disabled
              value={form.perUnitPrice > 0 ? `${form.perUnitPrice.toLocaleString()} per ${form.packSizeUnit ? form.packSizeUnit.replace(/s$/, '') : 'Unit'}` : '0'}
              className={inputCls(false, true) + ' pl-9 font-bold text-brand-primary'}
            />
          </div>
        </Field>
      </div>

      {/* Description */}
      <Field label="Description">
        <textarea
          disabled={isView}
          rows={3}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Optional product description…"
          className={inputCls(false, isView) + ' resize-none'}
        />
      </Field>

      {/* Status */}
      <Field label="Status" required>
        {isView ? (
          <div className="pt-1">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border ${
              form.status === 'Active'
                ? 'bg-green-50 dark:bg-green-900/30 border-green-150 text-feedback-success'
                : 'bg-red-50 dark:bg-red-900/30 border-red-150 text-feedback-error'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${form.status === 'Active' ? 'bg-feedback-success' : 'bg-feedback-error'}`} />
              {form.status}
            </span>
          </div>
        ) : (
          <div className="flex gap-3">
            {['Active', 'Inactive'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set('status', s)}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold border transition-all duration-150
                  ${form.status === s
                    ? s === 'Active'
                      ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-feedback-success'
                      : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-feedback-error'
                    : 'bg-gray-55 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 text-gray-400 hover:border-gray-200 dark:hover:border-gray-600'
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </Field>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
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
