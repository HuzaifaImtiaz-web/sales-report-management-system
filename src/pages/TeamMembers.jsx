import React, { useState, useMemo } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import {
  FiSearch, FiPlus, FiEye, FiEdit2, FiTrash2,
  FiX, FiUsers, FiAlertTriangle, FiCheck, FiFilter,
  FiPhone, FiMail, FiMapPin, FiCalendar, FiInfo
} from 'react-icons/fi';

/* ─── Static Dummy Data ───────────────────────────────────────────── */
const INITIAL_TEAM = [
  {
    id: 1,
    code: 'EMP-0001',
    name: 'Ahmed Shah',
    designation: 'Medical Representative',
    area: 'Lahore Central',
    mobile: '03001234567',
    email: 'ahmed.shah@himmel.com',
    address: 'Flat 4, Street 10, Gulberg III, Lahore',
    joiningDate: '2024-01-15',
    notes: 'Handles major institutional accounts in Lahore Central. Top performer.',
    status: 'Active'
  },
  {
    id: 2,
    code: 'EMP-0002',
    name: 'Zainab Fatima',
    designation: 'Territory Manager',
    area: 'Karachi South',
    mobile: '03217654321',
    email: 'zainab.fatima@himmel.com',
    address: 'House 14B, Phase 5, DHA, Karachi',
    joiningDate: '2023-06-01',
    notes: 'Supervises all MRs in Karachi South. Experienced professional.',
    status: 'Active'
  },
  {
    id: 3,
    code: 'EMP-0003',
    name: 'Usman Ali',
    designation: 'Area Sales Manager',
    area: 'Islamabad F-10',
    mobile: '03339876543',
    email: 'usman.ali@himmel.com',
    address: 'Sector G-9/1, Islamabad',
    joiningDate: '2022-11-20',
    notes: 'Manages sales operations in the capital territory.',
    status: 'Active'
  },
  {
    id: 4,
    code: 'EMP-0004',
    name: 'Mariam Khan',
    designation: 'Medical Representative',
    area: 'Rawalpindi',
    mobile: '03124567890',
    email: 'mariam.khan@himmel.com',
    address: 'Saddar Road, Rawalpindi',
    joiningDate: '2024-03-10',
    notes: 'On medical leave. Previously handled Rawalpindi area.',
    status: 'Inactive'
  },
  {
    id: 5,
    code: 'EMP-0005',
    name: 'Bilal Siddiqui',
    designation: 'Medical Representative',
    area: 'Faisalabad',
    mobile: '03451122334',
    email: 'bilal.siddiqui@himmel.com',
    address: 'Peoples Colony No. 1, Faisalabad',
    joiningDate: '2024-02-01',
    notes: 'Responsible for private clinics in Faisalabad.',
    status: 'Active'
  },
  {
    id: 6,
    code: 'EMP-0006',
    name: 'Ayesha Malik',
    designation: 'Medical Representative',
    area: 'Multan',
    mobile: '03019876543',
    email: 'ayesha.malik@himmel.com',
    address: 'Boson Road, Multan',
    joiningDate: '2023-09-12',
    notes: 'Covers public hospital visits in Multan.',
    status: 'Active'
  },
  {
    id: 7,
    code: 'EMP-0007',
    name: 'Haris Rehman',
    designation: 'Territory Manager',
    area: 'Peshawar',
    mobile: '03115556677',
    email: 'haris.rehman@himmel.com',
    address: 'Hayatabad Phase 3, Peshawar',
    joiningDate: '2022-04-18',
    notes: 'Maintains relationships with distributors in KPK.',
    status: 'Inactive'
  }
];

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

let nextId = 8;
const generateCode = (id) => `EMP-${String(id).padStart(4, '0')}`;
const EMPTY_FORM = {
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
    <td colSpan={5} className="px-5 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-center justify-center">
          <FiUsers className="w-8 h-8 text-gray-200 dark:text-gray-650" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-400 dark:text-gray-500">No team members available.</p>
          <p className="text-[11px] text-gray-300 dark:text-gray-600 font-medium mt-1">Start by adding your first team member.</p>
        </div>
        <button
          onClick={onAdd}
          className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm hover:shadow-md transition-all duration-150"
        >
          <FiPlus className="w-3.5 h-3.5" /> Add First Team Member
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
      placeholder="Search by Employee Name, Employee ID, Area, or Designation..."
      className="w-full pl-9 pr-4 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-500"
    />
  </div>
);

/* ─── Filter Bar ─────────────────────────────────────────────────── */
export const FilterBar = ({
  area,
  onChangeArea,
  designation,
  onChangeDesignation,
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

    {/* Filter by Designation */}
    <div className="relative w-full sm:w-auto">
      <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      <select
        value={designation}
        onChange={(e) => onChangeDesignation(e.target.value)}
        className="w-full pl-8 pr-8 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all duration-150 appearance-none cursor-pointer min-w-[170px]"
      >
        <option value="">All Designations</option>
        {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
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

/* ─── Team Members Table ─────────────────────────────────────────── */
export const TeamMembersTable = ({ members, onDetail, onEdit, onDelete, onAdd }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-xs" aria-label="Team Members table">
      <thead>
        <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
          {['Employee Name', 'Designation', 'Assigned Area', 'Status', 'Actions'].map((h) => (
            <th key={h} className="text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-5 py-3.5 whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
        {members.length === 0 ? (
          <EmptyState onAdd={onAdd} />
        ) : (
          members.map((m) => (
            <tr key={m.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors duration-100 group">
              {/* Name */}
              <td className="px-5 py-4 font-semibold text-gray-850 dark:text-gray-200 whitespace-nowrap">
                {m.name}
              </td>
              {/* Designation */}
              <td className="px-5 py-4 text-gray-650 dark:text-gray-300 whitespace-nowrap">
                {m.designation}
              </td>
              {/* Assigned Area */}
              <td className="px-5 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {m.area}
              </td>
              {/* Status */}
              <td className="px-5 py-4 whitespace-nowrap">
                <StatusBadge status={m.status} />
              </td>
              {/* Actions */}
              <td className="px-5 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDetail(m)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-blue-650 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-150"
                  >
                    <FiEye className="w-3 h-3" /> View
                  </button>
                  <button
                    onClick={() => onEdit(m)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:border-amber-200 dark:hover:border-amber-700 transition-all duration-150"
                  >
                    <FiEdit2 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => onDelete(m)}
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

/* ─── Team Member Modal (Add / Edit) ─────────────────────────────── */
export const TeamMemberModal = ({ mode, member, onClose, onSave }) => {
  const [form, setForm] = useState(
    member ? { ...member } : { ...EMPTY_FORM, code: generateCode(nextId) }
  );
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
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
    if (!form.name.trim()) e.name = 'Employee Name is required.';
    if (!form.designation) e.designation = 'Designation is required.';
    if (!form.area) e.area = 'Assigned Area is required.';
    if (!form.mobile.trim()) e.mobile = 'Mobile Number is required.';

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

  const headerTitle = mode === 'add' ? 'Add Team Member' : 'Edit Team Member';
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
              {member && <p className="text-[10px] text-white/50 font-medium mt-0.5">{form.code}</p>}
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
            <Field label="Employee Name" required error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Ahmed Shah"
                className={inputCls(errors.name)}
              />
            </Field>
            <Field label="Employee ID">
              <input
                disabled
                value={form.code}
                className={inputCls(false) + ' opacity-60 cursor-default font-mono'}
              />
            </Field>
          </div>

          {/* Row 2: Designation + Assigned Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Designation" required error={errors.designation}>
              <select
                value={form.designation}
                onChange={(e) => set('designation', e.target.value)}
                className={inputCls(errors.designation) + ' appearance-none cursor-pointer'}
              >
                <option value="">Select Designation…</option>
                {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Assigned Area" required error={errors.area}>
              <select
                value={form.area}
                onChange={(e) => set('area', e.target.value)}
                className={inputCls(errors.area) + ' appearance-none cursor-pointer'}
              >
                <option value="">Select Area…</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
          </div>

          {/* Row 3: Mobile + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Mobile Number" required error={errors.mobile}>
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
                placeholder="e.g. ahmed.shah@himmel.com"
                className={inputCls(errors.email)}
              />
            </Field>
          </div>

          {/* Row 4: Joining Date + Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Joining Date" error={errors.joiningDate}>
              <input
                type="date"
                value={form.joiningDate}
                onChange={(e) => set('joiningDate', e.target.value)}
                className={inputCls(errors.joiningDate)}
              />
            </Field>
            <Field label="Address" error={errors.address}>
              <input
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="e.g. Town, Street, House..."
                className={inputCls(errors.address)}
              />
            </Field>
          </div>

          {/* Notes */}
          <Field label="Notes">
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="e.g. Key client contact, target achievement trends, remarks..."
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
            {mode === 'add' ? 'Save Team Member' : 'Update Team Member'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Team Member Details Modal (View Only) ───────────────────────── */
export const TeamMemberDetailsModal = ({ member, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-lg animate-slide-up overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-brand-navy to-[#162040]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <FiUsers className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">{member.name}</h2>
            <p className="text-[10px] text-white/50 font-medium mt-0.5">{member.code}</p>
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
            { label: 'Employee ID', value: member.code, fontMono: true },
            { label: 'Designation', value: member.designation },
            { label: 'Assigned Area', value: member.area },
            { label: 'Joining Date', value: member.joiningDate ? new Date(member.joiningDate).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—' },
            { label: 'Status', value: null }
          ].map(({ label, value, fontMono }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-100/50 dark:border-gray-800/50">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-550">{label}</p>
              {label === 'Status' ? (
                <div className="mt-1.5"><StatusBadge status={member.status} /></div>
              ) : (
                <p className={`text-xs font-semibold text-gray-800 dark:text-gray-200 mt-1 ${fontMono ? 'font-mono' : ''}`}>{value}</p>
              )}
            </div>
          ))}
        </div>

        {/* Contact Info */}
        <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-550 border-b border-gray-100 dark:border-gray-800 pb-2">Contact details</p>
          <div className="flex items-center gap-3 text-xs">
            <FiPhone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase">Mobile Number</p>
              <p className="font-semibold text-gray-850 dark:text-gray-200">{member.mobile}</p>
            </div>
          </div>
          {member.email && (
            <div className="flex items-center gap-3 text-xs pt-1">
              <FiMail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase">Email Address</p>
                <p className="font-semibold text-gray-850 dark:text-gray-200">{member.email}</p>
              </div>
            </div>
          )}
          {member.address && (
            <div className="flex items-start gap-3 text-xs pt-1">
              <FiMapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase">Home Address</p>
                <p className="font-semibold text-gray-850 dark:text-gray-200 leading-relaxed">{member.address}</p>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        {member.notes && (
          <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-550 border-b border-gray-100 dark:border-gray-800 pb-2 mb-2">Remarks & Notes</p>
            <div className="flex items-start gap-2.5">
              <FiInfo className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed italic">
                &ldquo;{member.notes}&rdquo;
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
export const DeleteConfirmationDialog = ({ member, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-md animate-slide-up">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
          <FiAlertTriangle className="w-5 h-5 text-feedback-error" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Delete Team Member</h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-550 font-medium mt-0.5">{member.code}</p>
        </div>
      </div>
      <div className="px-6 py-5">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Are you sure you want to delete{' '}
          <span className="font-bold text-gray-900 dark:text-white">{member.name}</span>?
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

/* ─── Main TeamMembers Component ─────────────────────────────────── */
const TeamMembers = () => {
  const [members, setMembers] = useState(INITIAL_TEAM);
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [viewMember, setViewMember] = useState(null);
  const [modal, setModal] = useState(null); // { mode: 'add'|'edit', member }
  const [toDelete, setToDelete] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  /* Filtered list */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return members.filter((m) => {
      const matchSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.designation.toLowerCase().includes(q) ||
        m.area.toLowerCase().includes(q);

      const matchArea = !areaFilter || m.area === areaFilter;
      const matchDesignation = !designationFilter || m.designation === designationFilter;
      const matchStatus = !statusFilter || m.status === statusFilter;

      return matchSearch && matchArea && matchDesignation && matchStatus;
    });
  }, [members, search, areaFilter, designationFilter, statusFilter]);

  // Reset pagination on search/filter changes
  useMemo(() => {
    setCurrentPage(1);
  }, [search, areaFilter, designationFilter, statusFilter]);

  /* Paginated list */
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMembers = useMemo(() => {
    return filtered.slice(startIndex, endIndex);
  }, [filtered, startIndex, endIndex]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  /* Handlers */
  const openAdd = () => setModal({ mode: 'add', member: null });
  const openEdit = (m) => setModal({ mode: 'edit', member: m });
  const closeModal = () => setModal(null);

  const handleSave = (form) => {
    if (modal.mode === 'add') {
      const newMember = { ...form, id: nextId, code: generateCode(nextId) };
      nextId++;
      setMembers((prev) => [newMember, ...prev]);
    } else {
      setMembers((prev) => prev.map((m) => m.id === form.id ? form : m));
    }
    closeModal();
  };

  const handleDelete = () => {
    setMembers((prev) => prev.filter((m) => m.id !== toDelete.id));
    setToDelete(null);
  };

  const handleClearFilters = () => {
    setSearch('');
    setAreaFilter('');
    setDesignationFilter('');
    setStatusFilter('');
  };

  const showClear = search || areaFilter || designationFilter || statusFilter;
  const activeCount = members.filter((m) => m.status === 'Active').length;
  const inactiveCount = members.filter((m) => m.status === 'Inactive').length;

  return (
    <DashboardLayout pageTitle="Team Members">
      <div className="space-y-6 animate-fade-in">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Team Members</h1>
            <p className="text-xs text-gray-400 dark:text-gray-550 font-medium mt-1">Manage all sales representatives and employees.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800/50 text-feedback-success text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-feedback-success" />
              {activeCount} Active
            </span>
            {inactiveCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 text-gray-550 dark:text-gray-450 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                {inactiveCount} Inactive
              </span>
            )}
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm hover:shadow-md transition-all duration-150"
            >
              <FiPlus className="w-3.5 h-3.5" /> Add Team Member
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
              designation={designationFilter}
              onChangeDesignation={setDesignationFilter}
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
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Team Members List</h3>
              <p className="text-[10px] text-gray-400 dark:text-gray-550 font-medium mt-0.5">
                Showing {Math.min(filtered.length, paginatedMembers.length)} of {filtered.length} records
              </p>
            </div>
          </div>

          <TeamMembersTable
            members={paginatedMembers}
            onDetail={setViewMember}
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
        <TeamMemberModal
          mode={modal.mode}
          member={modal.member}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}

      {viewMember && (
        <TeamMemberDetailsModal
          member={viewMember}
          onClose={() => setViewMember(null)}
        />
      )}

      {toDelete && (
        <DeleteConfirmationDialog
          member={toDelete}
          onCancel={() => setToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </DashboardLayout>
  );
};

export default TeamMembers;
