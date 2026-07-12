import React, { useState, useMemo } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import {
  FiSearch, FiPlus, FiEye, FiEdit2, FiTrash2,
  FiX, FiMapPin, FiAlertTriangle, FiCheck, FiFilter,
  FiInfo
} from 'react-icons/fi';

/* ─── Static Dummy Data ───────────────────────────────────────────── */
const INITIAL_AREAS = [
  {
    id: 1,
    code: 'AREA-0001',
    name: 'Lahore Central',
    city: 'Lahore',
    region: 'Punjab',
    description: 'Main urban business district in Lahore. High customer density.',
    status: 'Active'
  },
  {
    id: 2,
    code: 'AREA-0002',
    name: 'Karachi South',
    city: 'Karachi',
    region: 'Sindh',
    description: 'Port and surrounding financial zone. Key market area.',
    status: 'Active'
  },
  {
    id: 3,
    code: 'AREA-0003',
    name: 'Islamabad F-10',
    city: 'Islamabad',
    region: 'Islamabad Capital Territory',
    description: 'Residential and commercial hub in F-10 and neighboring sectors.',
    status: 'Active'
  },
  {
    id: 4,
    code: 'AREA-0004',
    name: 'Rawalpindi Cantt',
    city: 'Rawalpindi',
    region: 'Punjab',
    description: 'Military cantonment and commercial markets in Rawalpindi.',
    status: 'Inactive'
  },
  {
    id: 5,
    code: 'AREA-0005',
    name: 'Faisalabad City',
    city: 'Faisalabad',
    region: 'Punjab',
    description: 'Industrial textile hub territory covering central markets.',
    status: 'Active'
  },
  {
    id: 6,
    code: 'AREA-0006',
    name: 'Multan Cantonment',
    city: 'Multan',
    region: 'Punjab',
    description: 'Southern Punjab zone servicing major public hospitals.',
    status: 'Active'
  },
  {
    id: 7,
    code: 'AREA-0007',
    name: 'Peshawar University',
    city: 'Peshawar',
    region: 'KPK',
    description: 'Educational and healthcare sector surrounding Peshawar University.',
    status: 'Inactive'
  }
];

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

let nextId = 8;
const generateCode = (id) => `AREA-${String(id).padStart(4, '0')}`;
const EMPTY_FORM = {
  name: '',
  code: '',
  city: '',
  region: '',
  description: '',
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
    <td colSpan={6} className="px-5 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-center justify-center">
          <FiMapPin className="w-8 h-8 text-gray-200 dark:text-gray-650" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-400 dark:text-gray-500">No areas available.</p>
          <p className="text-[11px] text-gray-300 dark:text-gray-600 font-medium mt-1">Start by adding your first operational area.</p>
        </div>
        <button
          onClick={onAdd}
          className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm hover:shadow-md transition-all duration-150"
        >
          <FiPlus className="w-3.5 h-3.5" /> Add First Area
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
      placeholder="Search by Area Name, City, Region, or Area Code..."
      className="w-full pl-9 pr-4 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-500"
    />
  </div>
);

/* ─── Filter Bar ─────────────────────────────────────────────────── */
export const FilterBar = ({
  city,
  onChangeCity,
  region,
  onChangeRegion,
  status,
  onChangeStatus,
  onClear,
  showClear
}) => (
  <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3">
    {/* Filter by City */}
    <div className="relative w-full sm:w-auto">
      <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      <select
        value={city}
        onChange={(e) => onChangeCity(e.target.value)}
        className="w-full pl-8 pr-8 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all duration-150 appearance-none cursor-pointer min-w-[150px]"
      >
        <option value="">All Cities</option>
        {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>

    {/* Filter by Region */}
    <div className="relative w-full sm:w-auto">
      <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      <select
        value={region}
        onChange={(e) => onChangeRegion(e.target.value)}
        className="w-full pl-8 pr-8 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all duration-150 appearance-none cursor-pointer min-w-[150px]"
      >
        <option value="">All Regions</option>
        {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
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

/* ─── Pagination ─────────────────────────────────────────────────── */
export const Pagination = ({
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

/* ─── Area Table ─────────────────────────────────────────────────── */
export const AreaTable = ({ areas, onDetail, onEdit, onDelete, onAdd }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-xs" aria-label="Areas table">
      <thead>
        <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
          {['Area Code', 'Area Name', 'City', 'Region', 'Status', 'Actions'].map((h) => (
            <th key={h} className="text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-5 py-3.5 whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
        {areas.length === 0 ? (
          <EmptyState onAdd={onAdd} />
        ) : (
          areas.map((a) => (
            <tr key={a.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors duration-100 group">
              {/* Code */}
              <td className="px-5 py-4 whitespace-nowrap">
                <span className="font-mono text-[10px] font-extrabold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                  {a.code}
                </span>
              </td>
              {/* Name */}
              <td className="px-5 py-4 font-semibold text-gray-850 dark:text-gray-200 whitespace-nowrap">
                {a.name}
              </td>
              {/* City */}
              <td className="px-5 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                {a.city}
              </td>
              {/* Region */}
              <td className="px-5 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {a.region || '—'}
              </td>
              {/* Status */}
              <td className="px-5 py-4 whitespace-nowrap">
                <StatusBadge status={a.status} />
              </td>
              {/* Actions */}
              <td className="px-5 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDetail(a)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-blue-650 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-150"
                  >
                    <FiEye className="w-3 h-3" /> View
                  </button>
                  <button
                    onClick={() => onEdit(a)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:border-amber-200 dark:hover:border-amber-700 transition-all duration-150"
                  >
                    <FiEdit2 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => onDelete(a)}
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

/* ─── Area Modal (Add / Edit) ────────────────────────────────────── */
export const AreaModal = ({ mode, area, onClose, onSave }) => {
  const [form, setForm] = useState(
    area ? { ...area } : { ...EMPTY_FORM, code: generateCode(nextId) }
  );
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Area Name is required.';
    if (!form.city) e.city = 'City is required.';
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

  const headerTitle = mode === 'add' ? 'Add New Area' : 'Edit Area';
  const headerIcon = mode === 'add' ? FiPlus : FiEdit2;
  const HeaderIcon = headerIcon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-lg animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-brand-navy to-[#162040]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <HeaderIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{headerTitle}</h2>
              {area && <p className="text-[10px] text-white/50 font-medium mt-0.5">{form.code}</p>}
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
            <Field label="Area Name" required error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Lahore Central"
                className={inputCls(errors.name)}
              />
            </Field>
            <Field label="Area Code">
              <input
                disabled
                value={form.code}
                className={inputCls(false) + ' opacity-60 cursor-default font-mono'}
              />
            </Field>
          </div>

          {/* Row 2: City + Region */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="City" required error={errors.city}>
              <select
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
                className={inputCls(errors.city) + ' appearance-none cursor-pointer'}
              >
                <option value="">Select City…</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Region" error={errors.region}>
              <select
                value={form.region}
                onChange={(e) => set('region', e.target.value)}
                className={inputCls(errors.region) + ' appearance-none cursor-pointer'}
              >
                <option value="">Select Region…</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          </div>

          {/* Description */}
          <Field label="Description">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="e.g. Covers Gulberg, Model Town, and Cantonment areas..."
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
            {mode === 'add' ? 'Save Area' : 'Update Area'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Area Details Modal (View Only) ──────────────────────────────── */
export const AreaDetailsModal = ({ area, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-lg animate-slide-up overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-brand-navy to-[#162040]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <FiMapPin className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">{area.name}</h2>
            <p className="text-[10px] text-white/50 font-medium mt-0.5">{area.code}</p>
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
            { label: 'Area Code', value: area.code, fontMono: true },
            { label: 'Area Name', value: area.name },
            { label: 'City', value: area.city },
            { label: 'Region', value: area.region || '—' },
            { label: 'Status', value: null }
          ].map(({ label, value, fontMono }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-100/50 dark:border-gray-800/50">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</p>
              {label === 'Status' ? (
                <div className="mt-1.5"><StatusBadge status={area.status} /></div>
              ) : (
                <p className={`text-xs font-semibold text-gray-800 dark:text-gray-200 mt-1 ${fontMono ? 'font-mono' : ''}`}>{value}</p>
              )}
            </div>
          ))}
        </div>

        {/* Description / Notes */}
        {area.description && (
          <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800 pb-2 mb-2">Description / Notes</p>
            <div className="flex items-start gap-2.5">
              <FiInfo className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed italic">
                &ldquo;{area.description}&rdquo;
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
export const DeleteConfirmationDialog = ({ area, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-md animate-slide-up">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
          <FiAlertTriangle className="w-5 h-5 text-feedback-error" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Delete Area</h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-550 font-medium mt-0.5">{area.code}</p>
        </div>
      </div>
      <div className="px-6 py-5">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Are you sure you want to delete{' '}
          <span className="font-bold text-gray-900 dark:text-white">{area.name}</span>?
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

/* ─── Main Areas Component ───────────────────────────────────────── */
const Areas = () => {
  const [areas, setAreas] = useState(INITIAL_AREAS);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [viewArea, setViewArea] = useState(null);
  const [modal, setModal] = useState(null); // { mode: 'add'|'edit', area }
  const [toDelete, setToDelete] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  /* Filtered list */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return areas.filter((a) => {
      const matchSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        (a.region && a.region.toLowerCase().includes(q));

      const matchCity = !cityFilter || a.city === cityFilter;
      const matchRegion = !regionFilter || a.region === regionFilter;
      const matchStatus = !statusFilter || a.status === statusFilter;

      return matchSearch && matchCity && matchRegion && matchStatus;
    });
  }, [areas, search, cityFilter, regionFilter, statusFilter]);

  // Reset pagination on search/filter changes
  useMemo(() => {
    setCurrentPage(1);
  }, [search, cityFilter, regionFilter, statusFilter]);

  /* Paginated list */
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAreas = useMemo(() => {
    return filtered.slice(startIndex, endIndex);
  }, [filtered, startIndex, endIndex]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  /* Handlers */
  const openAdd = () => setModal({ mode: 'add', area: null });
  const openEdit = (a) => setModal({ mode: 'edit', area: a });
  const closeModal = () => setModal(null);

  const handleSave = (form) => {
    if (modal.mode === 'add') {
      const newArea = { ...form, id: nextId, code: generateCode(nextId) };
      nextId++;
      setAreas((prev) => [newArea, ...prev]);
    } else {
      setAreas((prev) => prev.map((a) => a.id === form.id ? form : a));
    }
    closeModal();
  };

  const handleDelete = () => {
    setAreas((prev) => prev.filter((a) => a.id !== toDelete.id));
    setToDelete(null);
  };

  const handleClearFilters = () => {
    setSearch('');
    setCityFilter('');
    setRegionFilter('');
    setStatusFilter('');
  };

  const showClear = search || cityFilter || regionFilter || statusFilter;
  const activeCount = areas.filter((a) => a.status === 'Active').length;
  const inactiveCount = areas.filter((a) => a.status === 'Inactive').length;

  return (
    <DashboardLayout pageTitle="Areas">
      <div className="space-y-6 animate-fade-in">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Areas</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-1">Manage sales territories and operational areas.</p>
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
              <FiPlus className="w-3.5 h-3.5" /> Add Area
            </button>
          </div>
        </div>

        {/* ── Search & Filter Controls ── */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            <SearchBar value={search} onChange={setSearch} />
            <FilterBar
              city={cityFilter}
              onChangeCity={setCityFilter}
              region={regionFilter}
              onChangeRegion={setRegionFilter}
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
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Areas List</h3>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                Showing {Math.min(filtered.length, paginatedAreas.length)} of {filtered.length} records
              </p>
            </div>
          </div>

          <AreaTable
            areas={paginatedAreas}
            onDetail={setViewArea}
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
          />
        </div>
      </div>

      {/* ── Modals & Dialogs ── */}
      {modal && (
        <AreaModal
          mode={modal.mode}
          area={modal.area}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}

      {viewArea && (
        <AreaDetailsModal
          area={viewArea}
          onClose={() => setViewArea(null)}
        />
      )}

      {toDelete && (
        <DeleteConfirmationDialog
          area={toDelete}
          onCancel={() => setToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </DashboardLayout>
  );
};

export default Areas;
