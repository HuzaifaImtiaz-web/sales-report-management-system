import React, { useState, useEffect } from 'react';
import { FiCheck, FiEdit2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const DESIGNATIONS = [
  'Medical Representative',
  'Territory Manager',
  'Area Sales Manager',
  'Regional Sales Manager'
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

export default function TeamMembersForm({ mode, item, onSave, onCancel }) {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    code: '',
    designation: '',
    area: '',
    mobile: '',
    email: '',
    address: '',
    joiningDate: '',
    notes: '',
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
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Employee Name is required.';
    if (!form.designation) e.designation = 'Designation is required.';
    if (!form.area) e.area = 'Area is required.';
    if (!form.mobile.trim()) e.mobile = 'Mobile Number is required.';
    if (!form.joiningDate) e.joiningDate = 'Joining Date is required.';
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

  return (
    <div className="space-y-5">
      {/* Row 1: Name & Designation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Employee Name" required error={errors.name}>
          <input
            disabled={isView}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Ahmed Shah"
            className={inputCls(errors.name, isView)}
          />
        </Field>
        <Field label="Designation" required error={errors.designation}>
          {isView ? (
            <input
              disabled
              value={form.designation}
              className={inputCls(false, true)}
            />
          ) : (
            <select
              value={form.designation}
              onChange={(e) => set('designation', e.target.value)}
              className={inputCls(errors.designation, isView) + ' appearance-none cursor-pointer'}
            >
              <option value="">Select Designation…</option>
              {DESIGNATIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}
        </Field>
      </div>

      {/* Row 2: Code & Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Employee ID">
          <input
            disabled
            value={form.code}
            className={inputCls(false, true) + ' font-mono'}
          />
        </Field>
        <Field label="Area" required error={errors.area}>
          {isView ? (
            <input
              disabled
              value={form.area}
              className={inputCls(false, true)}
            />
          ) : (
            <select
              value={form.area}
              onChange={(e) => set('area', e.target.value)}
              className={inputCls(errors.area, isView) + ' appearance-none cursor-pointer'}
            >
              <option value="">Select Area…</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          )}
        </Field>
      </div>

      {/* Row 3: Mobile & Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Mobile Number" required error={errors.mobile}>
          <input
            disabled={isView}
            value={form.mobile}
            onChange={(e) => set('mobile', e.target.value)}
            placeholder="e.g. 03001234567"
            className={inputCls(errors.mobile, isView)}
          />
        </Field>
        <Field label="Email Address" error={errors.email}>
          <input
            disabled={isView}
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="e.g. name@himmel.com"
            className={inputCls(errors.email, isView)}
          />
        </Field>
      </div>

      {/* Row 4: Joining Date & Address */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Joining Date" required error={errors.joiningDate}>
          <input
            disabled={isView}
            type="date"
            value={form.joiningDate}
            onChange={(e) => set('joiningDate', e.target.value)}
            className={inputCls(errors.joiningDate, isView)}
          />
        </Field>
        <Field label="Address">
          <input
            disabled={isView}
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="Residential address details…"
            className={inputCls(false, isView)}
          />
        </Field>
      </div>

      {/* Notes */}
      <Field label="Notes / Remarks">
        <textarea
          disabled={isView}
          rows={3}
          value={form.notes || ''}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Accounts handled, performance details, special notes…"
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
                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 text-gray-400 hover:border-gray-200 dark:hover:border-gray-600'
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
              className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-55 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => navigate(`/team/${form.id}/edit`)}
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
