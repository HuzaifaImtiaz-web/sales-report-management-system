import React, { useState, useEffect } from 'react';
import { FiCheck, FiEdit2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useUnsavedChanges } from '../../context/UnsavedChangesContext';
import StatusSelector from '../../components/common/StatusSelector';

const CITIES = [
  'Lahore',
  'Karachi',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar'
];

const REGIONS = [
  'Punjab',
  'Sindh',
  'KPK',
  'Balochistan',
  'Islamabad Capital Territory'
];

const Field = ({ label, required, error, children }) => (
  <div>
    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-550 dark:text-gray-400 mb-1.5">
      {label} {required && <span className="text-feedback-error">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-feedback-error font-semibold mt-1">{error}</p>}
  </div>
);

const inputCls = (err, disabled) =>
  `w-full px-3 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border rounded-lg outline-none
   transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-500
   focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40
   ${err ? 'border-feedback-error bg-red-50 dark:bg-red-900/10' : 'border-gray-100 dark:border-gray-700'}
   ${disabled ? 'opacity-70 cursor-default bg-gray-100/50 dark:bg-gray-800/30' : ''}`;

export default function AreasForm({ mode, item, onSave, onCancel }) {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const navigate = useNavigate();
  const { setIsDirty, setOnSave } = useUnsavedChanges();

  const [form, setForm] = useState({
    name: '',
    code: '',
    city: '',
    region: '',
    description: '',
    status: 'Active'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (item) {
      setForm({ ...item });
    }
  }, [item]);

  const set = (k, v) => {
    if (isView) return;
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
    setIsDirty(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Area Name is required.';
    if (!form.city) e.city = 'City is required.';
    if (!form.region) e.region = 'Region is required.';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    onSave({ ...form });
  };

  useEffect(() => {
    if (mode !== 'view') {
      setOnSave(() => {
        const e = validate();
        if (Object.keys(e).length) {
          setErrors(e);
          return false;
        }
        return onSave({ ...form });
      });
    }
    return () => setOnSave(null);
  }, [form, mode, onSave]);

  return (
    <div className="space-y-5">
      {/* Row 1: Name & Code */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Area Name" required error={errors.name}>
          <input
            disabled={isView}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Lahore Central"
            className={inputCls(errors.name, isView)}
          />
        </Field>
        <Field label="Area Code">
          <input
            disabled={isView}
            value={form.code || ''}
            onChange={(e) => set('code', e.target.value)}
            placeholder="e.g. LHR-CENTRAL"
            className={inputCls(false, isView) + ' font-mono'}
          />
        </Field>
      </div>

      {/* Row 2: City & Region */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="City" required error={errors.city}>
          {isView ? (
            <input
              disabled
              value={form.city}
              className={inputCls(false, true)}
            />
          ) : (
            <select
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
              className={inputCls(errors.city, isView) + ' appearance-none cursor-pointer'}
            >
              <option value="">Select City…</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Region" required error={errors.region}>
          {isView ? (
            <input
              disabled
              value={form.region}
              className={inputCls(false, true)}
            />
          ) : (
            <select
              value={form.region}
              onChange={(e) => set('region', e.target.value)}
              className={inputCls(errors.region, isView) + ' appearance-none cursor-pointer'}
            >
              <option value="">Select Region…</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          )}
        </Field>
      </div>

      {/* Description */}
      <Field label="Description">
        <textarea
          disabled={isView}
          rows={3}
          value={form.description || ''}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Optional area details or remarks…"
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
          <StatusSelector
            options={['Active', 'Inactive']}
            value={form.status}
            onChange={(s) => set('status', s)}
          />
        )}
      </Field>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
        {isView ? (
          <>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-55 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => navigate(`/areas/${form.id}/edit`)}
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
              className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-55 transition-colors"
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
