import React, { useState, useEffect } from 'react';
import { FiCheck, FiEdit2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useUnsavedChanges } from '../../context/UnsavedChangesContext';
import { areaService } from '../../services/areaService';
import { institutionService } from '../../services/institutionService';
import HybridComboBox from '../../components/common/HybridComboBox';
import StatusSelector from '../../components/common/StatusSelector';
import { sanitizePhoneInput, isValid11DigitPhone } from '../../utils/phoneValidator';

const DEFAULT_SPECIALTIES = [
  'Cardiologist',
  'Dermatologist',
  'Pediatrician',
  'General Physician',
  'Orthopedic',
  'Neurologist',
  'Gynecologist',
  'Pulmonologist',
  'Gastroenterologist',
  'ENT Specialist'
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

export default function DoctorsForm({ mode, item, onSave, onCancel }) {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const navigate = useNavigate();
  const { setIsDirty, setOnSave } = useUnsavedChanges();

  const [areasList, setAreasList] = useState([]);
  const [institutionsList, setInstitutionsList] = useState([]);
  const [form, setForm] = useState({
    name: '',
    code: '',
    specialty: '',
    hospital: '',
    area: '',
    city: '',
    mobile: '',
    email: '',
    address: '',
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
    institutionService.getAllInstitutions().then((data) => {
      if (data && data.length > 0) {
        setInstitutionsList(data);
      }
    });
  }, []);

  useEffect(() => {
    if (item) {
      setForm({ ...item, area: item.area || item.areaName || '' });
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
      code: `AREA-${newAreaName.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      status: 'Active'
    }).then(() => {
      areaService.getAllAreas().then(res => setAreasList(res || []));
    }).catch(() => {});
  };

  const handleHospitalSelect = (instName) => {
    set('hospital', instName);
    const foundInst = institutionsList.find(i => i.name.toLowerCase() === instName.toLowerCase());
    if (foundInst) {
      if (foundInst.area && !form.area) set('area', foundInst.area);
      if (foundInst.city && !form.city) set('city', foundInst.city);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Doctor Name is required.';
    if (!form.specialty) e.specialty = 'Specialty is required.';
    if (!form.area) e.area = 'Area is required.';
    if (!form.city.trim()) e.city = 'City is required.';
    if (!form.mobile.trim()) {
      e.mobile = 'Mobile Number is required.';
    } else if (!isValid11DigitPhone(form.mobile)) {
      e.mobile = 'Mobile Number must contain exactly 11 digits (e.g. 03001234567).';
    }
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
      {/* Row 1: Name + Specialty */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Doctor Name" required error={errors.name}>
          <input
            disabled={isView}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Dr. Hamid Raza"
            className={inputCls(errors.name, isView)}
          />
        </Field>
        <Field label="Specialty" required error={errors.specialty}>
          {isView ? (
            <input
              disabled
              value={form.specialty}
              className={inputCls(false, true)}
            />
          ) : (
            <HybridComboBox
              value={form.specialty}
              options={DEFAULT_SPECIALTIES}
              onChange={(val) => set('specialty', val)}
              placeholder="Select or type specialty..."
              disabled={isView}
              error={Boolean(errors.specialty)}
            />
          )}
        </Field>
      </div>

      {/* Row 2: Doctor Code (Fully Editable & Optional) + Hospital */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Doctor Code">
          <input
            disabled={isView}
            value={form.code}
            onChange={(e) => set('code', e.target.value)}
            placeholder="e.g. DOC-001"
            className={inputCls(false, isView) + ' font-mono'}
          />
        </Field>
        <Field label="Hospital / Institution" error={errors.hospital}>
          {isView ? (
            <input
              disabled
              value={form.hospital}
              className={inputCls(false, true)}
            />
          ) : (
            <HybridComboBox
              value={form.hospital}
              options={institutionsList.map(i => i.name)}
              onChange={handleHospitalSelect}
              placeholder="Search institution or type hospital name..."
              disabled={isView}
              error={Boolean(errors.hospital)}
            />
          )}
        </Field>
      </div>

      {/* Row 3: Area & City */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Area" required error={errors.area}>
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
        <Field label="City" required error={errors.city}>
          <input
            disabled={isView}
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="e.g. Lahore"
            className={inputCls(errors.city, isView)}
          />
        </Field>
      </div>

      {/* Row 4: Mobile & Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Mobile Number" required error={errors.mobile}>
          <input
            disabled={isView}
            value={form.mobile}
            onChange={(e) => set('mobile', sanitizePhoneInput(e.target.value))}
            placeholder="e.g. 03001234567"
            maxLength={11}
            className={inputCls(errors.mobile, isView)}
          />
        </Field>
        <Field label="Email Address" error={errors.email}>
          <input
            disabled={isView}
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="e.g. name@domain.com"
            className={inputCls(errors.email, isView)}
          />
        </Field>
      </div>

      {/* Address */}
      <Field label="Address">
        <input
          disabled={isView}
          value={form.address}
          onChange={(e) => set('address', e.target.value)}
          placeholder="Clinic/Room details…"
          className={inputCls(false, isView)}
        />
      </Field>

      {/* Notes */}
      <Field label="Notes / Remarks">
        <textarea
          disabled={isView}
          rows={3}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Special instructions, timings, preferences…"
          className={inputCls(false, isView) + ' resize-none'}
        />
      </Field>

      {/* Status (Standardized Target UI/UX) */}
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
              className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => navigate(`/doctors/${form.id}/edit`)}
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
              className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
