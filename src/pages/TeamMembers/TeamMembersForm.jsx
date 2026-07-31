import React, { useState, useEffect } from 'react';
import { FiCheck, FiEdit2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useUnsavedChanges } from '../../context/UnsavedChangesContext';
import { areaService } from '../../services/areaService';
import HybridComboBox from '../../components/common/HybridComboBox';
import StatusSelector from '../../components/common/StatusSelector';

const DESIGNATIONS = [
  'SPO',
  'Area Manager',
  'Regional Sales Manager',
  'Zonal Manager',
  'Sales Director',
  'Medical Representative',
  'Territory Executive',
  'Territory Manager',
  'Area Sales Manager'
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
  `w-full px-3 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-55 dark:bg-gray-800/50 border rounded-lg outline-none
   transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-555
   focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40
   ${err ? 'border-feedback-error bg-red-50 dark:bg-red-900/10' : 'border-gray-100 dark:border-gray-750'}
   ${disabled ? 'opacity-70 cursor-default bg-gray-100/50 dark:bg-gray-800/30' : ''}`;

export default function TeamMembersForm({ mode, item, onSave, onCancel }) {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const navigate = useNavigate();
  const { setIsDirty, setOnSave } = useUnsavedChanges();

  const [areasList, setAreasList] = useState([]);
  const [form, setForm] = useState({
    name: '',
    designation: '',
    area: '',
    notes: '',
    status: 'Active'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    areaService.getAllAreas().then((data) => {
      if (data && data.length > 0) {
        setAreasList(data);
      }
    });
  }, []);

  useEffect(() => {
    if (item) {
      setForm({
        id: item.id,
        name: item.name || '',
        designation: item.designation || item.role || '',
        area: item.area || item.areaName || '',
        notes: item.notes || '',
        status: item.status || 'Active'
      });
    }
  }, [item]);

  const set = (k, v) => {
    if (isView) return;
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
    setIsDirty(true);
  };

  const handleAreaAddNew = (newAreaName) => {
    areaService.saveArea({
      name: newAreaName,
      status: 'Active'
    }).then(() => {
      areaService.getAllAreas().then(res => setAreasList(res || []));
    }).catch(() => {});
  };

  const validate = () => {
    const e = {};
    if (!form.name || !form.name.trim()) e.name = 'Employee Name is required.';
    return e;
  };

  const resetForm = () => {
    setForm({
      name: '',
      designation: '',
      area: '',
      notes: '',
      status: 'Active'
    });
    setErrors({});
    setIsDirty(false);
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    const res = onSave({ ...form });
    if (res !== false && !isEdit) {
      resetForm();
    }
  };

  useEffect(() => {
    if (mode !== 'view') {
      setOnSave(() => {
        const e = validate();
        if (Object.keys(e).length) {
          setErrors(e);
          return false;
        }
        const res = onSave({ ...form });
        if (res !== false && !isEdit) {
          resetForm();
        }
        return res;
      });
    }
    return () => setOnSave(null);
  }, [form, mode, onSave]);

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
        <Field label="Designation" error={errors.designation}>
          {isView ? (
            <input
              disabled
              value={form.designation}
              className={inputCls(false, true)}
            />
          ) : (
            <HybridComboBox
              value={form.designation}
              options={DESIGNATIONS}
              onChange={(val) => set('designation', val)}
              placeholder="Select or type designation..."
              disabled={isView}
              error={Boolean(errors.designation)}
            />
          )}
        </Field>
      </div>

      {/* Row 2: Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Area" error={errors.area}>
          {isView ? (
            <input
              disabled
              value={form.area}
              className={inputCls(false, true)}
            />
          ) : (
            <HybridComboBox
              value={form.area}
              options={areasList.map(a => a.name)}
              onChange={(val) => set('area', val)}
              onAddNew={handleAreaAddNew}
              placeholder="Select or type area..."
              disabled={isView}
              error={Boolean(errors.area)}
            />
          )}
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
              onClick={() => navigate(`/team-members/${form.id}/edit`)}
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
