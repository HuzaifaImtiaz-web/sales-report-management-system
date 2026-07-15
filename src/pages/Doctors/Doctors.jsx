import React, { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Pagination from '../../components/common/Pagination';
import {
  FiSearch, FiPlus, FiEye, FiEdit2, FiTrash2,
  FiX, FiUsers, FiAlertTriangle, FiCheck, FiFilter,
  FiPhone, FiMail, FiMapPin, FiInfo, FiBookOpen
} from 'react-icons/fi';

/* ─── Static Dummy Data ───────────────────────────────────────────── */
const INITIAL_DOCTORS = [
  {
    id: 1,
    code: 'DOC-0001',
    name: 'Dr. Ayesha Khan',
    specialty: 'Cardiologist',
    hospital: 'Mayo Hospital',
    area: 'Lahore Central',
    city: 'Lahore',
    mobile: '03001234567',
    email: 'ayesha.khan@gmail.com',
    address: 'Room 12, Cardiology Ward, Mayo Hospital, Lahore',
    notes: 'Preferred meeting time: Tuesday morning. High prescription volume.',
    status: 'Active'
  },
  {
    id: 2,
    code: 'DOC-0002',
    name: 'Dr. Hamid Raza',
    specialty: 'General Physician',
    hospital: 'Jinnah Hospital',
    area: 'Karachi South',
    city: 'Karachi',
    mobile: '03217654321',
    email: 'hamid.raza@yahoo.com',
    address: 'Clinic Annex, Near Main Gate, Jinnah Hospital, Karachi',
    notes: 'Likes product brochures printed. Discuss cardiometabolic drugs.',
    status: 'Active'
  },
  {
    id: 3,
    code: 'DOC-0003',
    name: 'Dr. Nadia Siddiqui',
    specialty: 'Pediatrician',
    hospital: 'Shifa International',
    area: 'Islamabad F-10',
    city: 'Islamabad',
    mobile: '03339876543',
    email: 'nadia.siddiqui@shifa.com',
    address: 'Consultant Clinic 4, Shifa International Hospital, Islamabad',
    notes: 'Very strict schedule. Keep detailings under 5 minutes.',
    status: 'Active'
  },
  {
    id: 4,
    code: 'DOC-0004',
    name: 'Dr. Farhan Latif',
    specialty: 'Orthopedic',
    hospital: 'Holy Family Hospital',
    area: 'Rawalpindi',
    city: 'Rawalpindi',
    mobile: '03124567890',
    email: 'farhan.latif@hotmail.com',
    address: 'Department of Orthopedics, Holy Family Hospital, Rawalpindi',
    notes: 'Focus on joint pain and calcium supplement products.',
    status: 'Inactive'
  },
  {
    id: 5,
    code: 'DOC-0005',
    name: 'Dr. Saima Riaz',
    specialty: 'Gynecologist',
    hospital: 'Faisalabad Institute of Cardiology',
    area: 'Faisalabad',
    city: 'Faisalabad',
    mobile: '03451122334',
    email: 'saima.riaz@gmail.com',
    address: 'Consultancy Plaza, Block C, Faisalabad',
    notes: 'Often busy in operations. Contact assistant prior to visit.',
    status: 'Active'
  },
  {
    id: 6,
    code: 'DOC-0006',
    name: 'Dr. Tariq Mehmood',
    specialty: 'Dermatologist',
    hospital: 'Nishtar Hospital',
    area: 'Multan',
    city: 'Multan',
    mobile: '03229988776',
    email: 'tariq.mehmood@nishtar.edu.pk',
    address: 'Skin Clinic, Nishtar Road, Multan',
    notes: 'Interested in anti-allergic range and topical creams.',
    status: 'Active'
  },
  {
    id: 7,
    code: 'DOC-0007',
    name: 'Dr. Bilal Aslam',
    specialty: 'Neurologist',
    hospital: 'Lady Reading Hospital',
    area: 'Peshawar',
    city: 'Peshawar',
    mobile: '03015554433',
    email: 'bilal.aslam@lrh.gov.pk',
    address: 'Neurology Department, Lady Reading Hospital, Peshawar',
    notes: 'Interested in neuroprotective formulas.',
    status: 'Inactive'
  }
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

const SPECIALTIES = [
  'Cardiologist',
  'Dermatologist',
  'Pediatrician',
  'General Physician',
  'Orthopedic',
  'Neurologist',
  'Gynecologist'
];

let nextId = 8;
const generateCode = (id) => `DOC-${String(id).padStart(4, '0')}`;
const EMPTY_FORM = {
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
};

/* ─── Status Badge ───────────────────────────────────────────────── */
export const StatusBadge = ({ status }) =>
  status === 'Active' ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 dark:bg-green-900/30 text-feedback-success border border-green-100 dark:border-green-800/50">
      <span className="w-1.5 h-1.5 rounded-full bg-feedback-success inline-block" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 text-gray-550 dark:text-gray-400">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-455 dark:bg-gray-500 inline-block" />
      Inactive
    </span>
  );

/* ─── Empty State ────────────────────────────────────────────────── */
export const EmptyState = ({ onAdd }) => (
  <tr>
    <td colSpan={9} className="px-5 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-center justify-center">
          <FiUsers className="w-8 h-8 text-gray-200 dark:text-gray-650" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-400 dark:text-gray-500">No doctors available.</p>
          <p className="text-[11px] text-gray-300 dark:text-gray-600 font-medium mt-1">Start by adding your first doctor.</p>
        </div>
        <button
          onClick={onAdd}
          className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm hover:shadow-md transition-all duration-150"
        >
          <FiPlus className="w-3.5 h-3.5" /> Add First Doctor
        </button>
      </div>
    </td>
  </tr>
);

/* ─── Search Bar ─────────────────────────────────────────────────── */
export const SearchBar = ({ value, onChange }) => (
  <div className="relative flex-1">
    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search by Doctor Name, Code, Hospital, or Area..."
      className="w-full pl-9 pr-4 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-500"
    />
  </div>
);

/* ─── Filter Bar ─────────────────────────────────────────────────── */
export const FilterBar = ({
  area,
  onChangeArea,
  specialty,
  onChangeSpecialty,
  status,
  onChangeStatus,
  onClear,
  showClear
}) => (
  <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3">
    {/* Filter by Area */}
    <div className="relative w-full sm:w-auto">
      <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      <select
        value={area}
        onChange={(e) => onChangeArea(e.target.value)}
        className="w-full pl-8 pr-8 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all duration-150 appearance-none cursor-pointer min-w-[150px]"
      >
        <option value="">All Areas</option>
        {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
      </select>
    </div>

    {/* Filter by Specialty */}
    <div className="relative w-full sm:w-auto">
      <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      <select
        value={specialty}
        onChange={(e) => onChangeSpecialty(e.target.value)}
        className="w-full pl-8 pr-8 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all duration-150 appearance-none cursor-pointer min-w-[150px]"
      >
        <option value="">All Specialties</option>
        {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>

    {/* Filter by Status */}
    <div className="relative w-full sm:w-auto">
      <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      <select
        value={status}
        onChange={(e) => onChangeStatus(e.target.value)}
        className="w-full pl-8 pr-8 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all duration-150 appearance-none cursor-pointer min-w-[130px]"
      >
        <option value="">All Statuses</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>
    </div>

    {/* Clear Filters */}
    {showClear && (
      <button
        onClick={onClear}
        className="w-full sm:w-auto px-3 py-2.5 text-xs font-bold text-gray-500 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-150 flex items-center justify-center gap-1.5 whitespace-nowrap"
      >
        <FiX className="w-3.5 h-3.5" /> Clear Filters
      </button>
    )}
  </div>
);



/* ─── Doctor Table ───────────────────────────────────────────────── */
export const DoctorTable = ({ doctors, onDetail, onEdit, onDelete, onAdd }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-xs" aria-label="Doctors table">
      <thead>
        <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
          {['Doctor Code', 'Doctor Name', 'Specialty', 'Hospital / Clinic', 'Area', 'City', 'Mobile Number', 'Status', 'Actions'].map((h) => (
            <th key={h} className="text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-5 py-3.5 whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
        {doctors.length === 0 ? (
          <EmptyState onAdd={onAdd} />
        ) : (
          doctors.map((d) => (
            <tr key={d.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors duration-100 group">
              {/* Code */}
              <td className="px-5 py-4 whitespace-nowrap">
                <span className="font-mono text-[10px] font-extrabold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                  {d.code}
                </span>
              </td>
              {/* Name */}
              <td className="px-5 py-4 font-semibold text-gray-850 dark:text-gray-200 whitespace-nowrap">
                {d.name}
              </td>
              {/* Specialty */}
              <td className="px-5 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                {d.specialty || '—'}
              </td>
              {/* Hospital */}
              <td className="px-5 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {d.hospital}
              </td>
              {/* Area */}
              <td className="px-5 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {d.area}
              </td>
              {/* City */}
              <td className="px-5 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {d.city || '—'}
              </td>
              {/* Mobile */}
              <td className="px-5 py-4 font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {d.mobile || '—'}
              </td>
              {/* Status */}
              <td className="px-5 py-4 whitespace-nowrap">
                <StatusBadge status={d.status} />
              </td>
              {/* Actions */}
              <td className="px-5 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDetail(d)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-blue-650 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-150"
                  >
                    <FiEye className="w-3 h-3" /> View
                  </button>
                  <button
                    onClick={() => onEdit(d)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:border-amber-200 dark:hover:border-amber-700 transition-all duration-150"
                  >
                    <FiEdit2 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => onDelete(d)}
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
);

/* ─── Field Helper for Form Modals ────────────────────────────────── */
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

/* ─── Doctor Modal (Add / Edit) ──────────────────────────────────── */
export const DoctorModal = ({ mode, doctor, onClose, onSave }) => {
  const [form, setForm] = useState(
    doctor ? { ...doctor } : { ...EMPTY_FORM, code: generateCode(nextId) }
  );
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    // Mobile Validation: Numbers only
    if (k === 'mobile') {
      const numericVal = v.replace(/[^0-9]/g, '');
      setForm((f) => ({ ...f, mobile: numericVal }));
    } else {
      setForm((f) => ({ ...f, [k]: v }));
    }
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Doctor Name is required.';
    if (!form.area) e.area = 'Area is required.';
    if (!form.hospital.trim()) e.hospital = 'Hospital / Clinic is required.';

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Please enter a valid email address.';
    }

    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    onSave(form);
  };

  const headerTitle = mode === 'add' ? 'Add New Doctor' : 'Edit Doctor';
  const headerIcon = mode === 'add' ? FiPlus : FiEdit2;
  const HeaderIcon = headerIcon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-brand-navy to-[#162040]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <HeaderIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{headerTitle}</h2>
              {doctor && <p className="text-[10px] text-white/50 font-medium mt-0.5">{form.code}</p>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <FiX className="w-4 h-4 text-white/80" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Row 1: Name + Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Doctor Name" required error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Dr. Ayesha Khan"
                className={inputCls(errors.name)}
              />
            </Field>
            <Field label="Doctor Code">
              <input
                disabled
                value={form.code}
                className={inputCls(false) + ' opacity-60 cursor-default font-mono'}
              />
            </Field>
          </div>

          {/* Row 2: Specialty + Hospital */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Specialty" error={errors.specialty}>
              <select
                value={form.specialty}
                onChange={(e) => set('specialty', e.target.value)}
                className={inputCls(errors.specialty) + ' appearance-none cursor-pointer'}
              >
                <option value="">Select specialty…</option>
                {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Hospital / Clinic" required error={errors.hospital}>
              <input
                value={form.hospital}
                onChange={(e) => set('hospital', e.target.value)}
                placeholder="e.g. Mayo Hospital"
                className={inputCls(errors.hospital)}
              />
            </Field>
          </div>

          {/* Row 3: Area + City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Area" required error={errors.area}>
              <select
                value={form.area}
                onChange={(e) => set('area', e.target.value)}
                className={inputCls(errors.area) + ' appearance-none cursor-pointer'}
              >
                <option value="">Select Area…</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="City" error={errors.city}>
              <input
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
                placeholder="e.g. Lahore"
                className={inputCls(errors.city)}
              />
            </Field>
          </div>

          {/* Row 4: Mobile + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Mobile Number" error={errors.mobile}>
              <input
                value={form.mobile}
                onChange={(e) => set('mobile', e.target.value)}
                placeholder="Numbers only, e.g. 03001234567"
                className={inputCls(errors.mobile)}
              />
            </Field>
            <Field label="Email Address" error={errors.email}>
              <input
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="e.g. ayesha.khan@gmail.com"
                className={inputCls(errors.email)}
              />
            </Field>
          </div>

          {/* Address */}
          <Field label="Address" error={errors.address}>
            <input
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="Full clinic or chamber address…"
              className={inputCls(errors.address)}
            />
          </Field>

          {/* Notes */}
          <Field label="Notes">
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="e.g. Best timing to visit, product interests, prescription habits..."
              className={inputCls(false) + ' resize-none'}
            />
          </Field>

          {/* Status */}
          <Field label="Status" required>
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
                        : 'bg-gray-150 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-750 dark:text-white font-extrabold shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 text-gray-405 dark:text-gray-500 hover:border-gray-200 dark:hover:border-gray-650'
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
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
            {mode === 'add' ? 'Save Doctor' : 'Update Doctor'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Doctor Details Modal (View Only) ────────────────────────────── */
export const DoctorDetailsModal = ({ doctor, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-lg animate-slide-up overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-brand-navy to-[#162040]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <FiUsers className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">{doctor.name}</h2>
            <p className="text-[10px] text-white/50 font-medium mt-0.5">{doctor.code}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-150"
          aria-label="Close details"
        >
          <FiX className="w-4 h-4 text-white/80" />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
        {/* Info Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Doctor Code', value: doctor.code, fontMono: true },
            { label: 'Specialty', value: doctor.specialty || '—' },
            { label: 'Hospital / Clinic', value: doctor.hospital },
            { label: 'Area', value: doctor.area },
            { label: 'City', value: doctor.city || '—' },
            { label: 'Status', value: null }
          ].map(({ label, value, fontMono }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-100/50 dark:border-gray-800/50">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</p>
              {label === 'Status' ? (
                <div className="mt-1.5"><StatusBadge status={doctor.status} /></div>
              ) : (
                <p className={`text-xs font-semibold text-gray-800 dark:text-gray-200 mt-1 ${fontMono ? 'font-mono' : ''}`}>{value}</p>
              )}
            </div>
          ))}
        </div>

        {/* Contact Info */}
        <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800 pb-2">Contact Details</p>
          <div className="flex items-center gap-3 text-xs">
            <FiPhone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase">Mobile Number</p>
              <p className="font-semibold text-gray-850 dark:text-gray-200">{doctor.mobile || '—'}</p>
            </div>
          </div>
          {doctor.email && (
            <div className="flex items-center gap-3 text-xs pt-1">
              <FiMail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase">Email Address</p>
                <p className="font-semibold text-gray-850 dark:text-gray-200">{doctor.email}</p>
              </div>
            </div>
          )}
          {doctor.address && (
            <div className="flex items-start gap-3 text-xs pt-1">
              <FiMapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase">Address / Chamber</p>
                <p className="font-semibold text-gray-850 dark:text-gray-200 leading-relaxed">{doctor.address}</p>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        {doctor.notes && (
          <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800 pb-2 mb-2">Remarks & Notes</p>
            <div className="flex items-start gap-2.5">
              <FiInfo className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed italic">
                &ldquo;{doctor.notes}&rdquo;
              </p>
            </div>
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

/* ─── Delete Confirmation Dialog ─────────────────────────────────── */
export const DeleteConfirmationDialog = ({ doctor, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-md animate-slide-up">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
          <FiAlertTriangle className="w-5 h-5 text-feedback-error" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Delete Doctor</h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">{doctor.code}</p>
        </div>
      </div>
      <div className="px-6 py-5">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Are you sure you want to delete{' '}
          <span className="font-bold text-gray-900 dark:text-white">{doctor.name}</span>?
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-550 mt-2">This action cannot be undone.</p>
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

/* ─── Main Doctors Component ─────────────────────────────────────── */
const Doctors = () => {
  const [doctors, setDoctors] = useState(INITIAL_DOCTORS);
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [viewDoctor, setViewDoctor] = useState(null);
  const [modal, setModal] = useState(null); // { mode: 'add'|'edit', doctor }
  const [toDelete, setToDelete] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  /* Filtered list */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return doctors.filter((d) => {
      const matchSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        (d.specialty && d.specialty.toLowerCase().includes(q)) ||
        d.hospital.toLowerCase().includes(q) ||
        d.area.toLowerCase().includes(q);

      const matchArea = !areaFilter || d.area === areaFilter;
      const matchSpecialty = !specialtyFilter || d.specialty === specialtyFilter;
      const matchStatus = !statusFilter || d.status === statusFilter;

      return matchSearch && matchArea && matchSpecialty && matchStatus;
    });
  }, [doctors, search, areaFilter, specialtyFilter, statusFilter]);

  // Reset pagination on search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, areaFilter, specialtyFilter, statusFilter]);

  /* Paginated list */
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDoctors = useMemo(() => {
    return filtered.slice(startIndex, endIndex);
  }, [filtered, startIndex, endIndex]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  /* Handlers */
  const openAdd = () => setModal({ mode: 'add', doctor: null });
  const openEdit = (d) => setModal({ mode: 'edit', doctor: d });
  const closeModal = () => setModal(null);

  const handleSave = (form) => {
    if (modal.mode === 'add') {
      const newDoc = { ...form, id: nextId, code: generateCode(nextId) };
      nextId++;
      setDoctors((prev) => [newDoc, ...prev]);
    } else {
      setDoctors((prev) => prev.map((d) => d.id === form.id ? form : d));
    }
    closeModal();
  };

  const handleDelete = () => {
    setDoctors((prev) => prev.filter((d) => d.id !== toDelete.id));
    setToDelete(null);
  };

  const handleClearFilters = () => {
    setSearch('');
    setAreaFilter('');
    setSpecialtyFilter('');
    setStatusFilter('');
  };

  const showClear = search || areaFilter || specialtyFilter || statusFilter;
  const activeCount = doctors.filter((d) => d.status === 'Active').length;
  const inactiveCount = doctors.filter((d) => d.status === 'Inactive').length;

  return (
    <DashboardLayout pageTitle="Doctors">
      <div className="space-y-6 animate-fade-in">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Doctors</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-1">Manage all doctors for sales reporting.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800/50 text-feedback-success text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-feedback-success" />
              {activeCount} Active
            </span>
            {inactiveCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 text-gray-500 dark:text-gray-450 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                {inactiveCount} Inactive
              </span>
            )}
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm hover:shadow-md transition-all duration-150"
            >
              <FiPlus className="w-3.5 h-3.5" /> Add Doctor
            </button>
          </div>
        </div>

        {/* ── Search & Filter Controls ── */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            <SearchBar value={search} onChange={setSearch} />
            <FilterBar
              area={areaFilter}
              onChangeArea={setAreaFilter}
              specialty={specialtyFilter}
              onChangeSpecialty={setSpecialtyFilter}
              status={statusFilter}
              onChangeStatus={setStatusFilter}
              onClear={handleClearFilters}
              showClear={showClear}
            />
          </div>
        </div>

        {/* ── Table & Pagination Card ── */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Doctors List</h3>
              <p className="text-[10px] text-gray-400 dark:text-gray-550 font-medium mt-0.5">
                Showing {filtered.length > 0 ? startIndex + 1 : 0}–{Math.min(endIndex, filtered.length)} of {filtered.length} records
              </p>
            </div>
          </div>

          <DoctorTable
            doctors={paginatedDoctors}
            onDetail={setViewDoctor}
            onEdit={openEdit}
            onDelete={setToDelete}
            onAdd={openAdd}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalRecords={filtered.length}
            startIndex={startIndex}
            endIndex={endIndex}
            pageSize={itemsPerPage}
            onPageSizeChange={setItemsPerPage}
          />
        </div>
      </div>

      {/* ── Modals & Dialogs ── */}
      {modal && (
        <DoctorModal
          mode={modal.mode}
          doctor={modal.doctor}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}

      {viewDoctor && (
        <DoctorDetailsModal
          doctor={viewDoctor}
          onClose={() => setViewDoctor(null)}
        />
      )}

      {toDelete && (
        <DeleteConfirmationDialog
          doctor={toDelete}
          onCancel={() => setToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </DashboardLayout>
  );
};

export default Doctors;
