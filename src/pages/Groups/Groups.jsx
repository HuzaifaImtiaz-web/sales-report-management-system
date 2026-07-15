import React, { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Pagination from '../../components/common/Pagination';
import {
  FiSearch, FiPlus, FiEye, FiEdit2, FiTrash2,
  FiX, FiAlertTriangle, FiCheck, FiLayers
} from 'react-icons/fi';

/* ─── Static Dummy Data ───────────────────────────────────────────── */
let nextId = 8;
const generateCode = (id) => `GRP-${String(id).padStart(4, '0')}`;

const INITIAL_GROUPS = [
  {
    id: 1,
    code: 'GRP-0001',
    name: 'Cardiovascular',
    description: 'Cardiovascular medications, statins, and blood pressure regulators.',
    totalProducts: 12,
    status: 'Active'
  },
  {
    id: 2,
    code: 'GRP-0002',
    name: 'Antibiotics',
    description: 'Broad-spectrum and narrow-spectrum antibacterial treatments.',
    totalProducts: 8,
    status: 'Active'
  },
  {
    id: 3,
    code: 'GRP-0003',
    name: 'Analgesics',
    description: 'Pain relief, NSAIDs, and anti-inflammatory medications.',
    totalProducts: 15,
    status: 'Active'
  },
  {
    id: 4,
    code: 'GRP-0004',
    name: 'Antidiabetics',
    description: 'Oral hypoglycemics, insulin sensitizers, and diabetes control agents.',
    totalProducts: 6,
    status: 'Active'
  },
  {
    id: 5,
    code: 'GRP-0005',
    name: 'Respiratory',
    description: 'Inhalers, bronchodilators, and chronic asthma control drugs.',
    totalProducts: 5,
    status: 'Inactive'
  },
  {
    id: 6,
    code: 'GRP-0006',
    name: 'Vitamins & Supplements',
    description: 'Multivitamins, mineral complexes, and general wellness supplements.',
    totalProducts: 20,
    status: 'Active'
  },
  {
    id: 7,
    code: 'GRP-0007',
    name: 'Gastrointestinal',
    description: 'Proton pump inhibitors, antacids, antiemetics, and digestive enzymes.',
    totalProducts: 9,
    status: 'Active'
  }
];

const EMPTY_FORM = {
  name: '',
  description: '',
  status: 'Active',
  totalProducts: 0
};

/* ─── Status Badge ───────────────────────────────────────────────── */
const StatusBadge = ({ status }) =>
  status === 'Active' ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 dark:bg-green-900/30 text-feedback-success border border-green-100 dark:border-green-800/50">
      <span className="w-1.5 h-1.5 rounded-full bg-feedback-success inline-block" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-900/30 text-feedback-error border border-red-100 dark:border-red-800/50">
      <span className="w-1.5 h-1.5 rounded-full bg-feedback-error inline-block" />
      Inactive
    </span>
  );

/* ─── Field Component ────────────────────────────────────────────── */
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

/* ─── Add / Edit Modal ───────────────────────────────────────────── */
const GroupModal = ({ mode, group, onClose, onSave }) => {
  const isView = mode === 'view';
  const [form, setForm] = useState(
    group ? { ...group } : { ...EMPTY_FORM, code: generateCode(nextId) }
  );
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Group Name is required.';
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

  const headerTitle = isView ? 'Group Details' : mode === 'add' ? 'Add Group' : 'Edit Group';
  const headerIcon = isView ? FiEye : mode === 'add' ? FiPlus : FiEdit2;
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
              {group && <p className="text-[10px] text-white/50 font-medium mt-0.5">{form.code}</p>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <FiX className="w-4 h-4 text-white/80" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Row 1: Code + Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Group Code">
              <input
                disabled
                value={form.code}
                className={inputCls(false) + ' opacity-60 cursor-default font-mono'}
              />
            </Field>
            <Field label="Group Name" required error={errors.name}>
              <input
                disabled={isView}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Cardiovascular"
                className={inputCls(errors.name) + (isView ? ' opacity-70 cursor-default' : '')}
              />
            </Field>
          </div>

          {/* Row 2: Total Products (Only visible in View Mode or pre-existing) */}
          {isView && (
            <Field label="Total Products">
              <input
                disabled
                value={form.totalProducts}
                className={inputCls(false) + ' opacity-70 cursor-default font-semibold'}
              />
            </Field>
          )}

          {/* Description */}
          <Field label="Description">
            <textarea
              disabled={isView}
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Provide a brief description of the product group..."
              className={inputCls(false) + ' resize-none' + (isView ? ' opacity-70 cursor-default' : '')}
            />
          </Field>

          {/* Status */}
          <Field label="Status" required>
            {isView ? (
              <div className="pt-1">
                <StatusBadge status={form.status} />
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
                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 text-gray-405 dark:text-gray-500 hover:border-gray-200 dark:hover:border-gray-650'
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </Field>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-enterprise">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-150"
          >
            {isView ? 'Close' : 'Cancel'}
          </button>
          {!isView && (
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm hover:shadow-md transition-all duration-150 flex items-center gap-1.5"
            >
              <FiCheck className="w-3.5 h-3.5" />
              {mode === 'add' ? 'Save Group' : 'Update Group'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Delete Confirmation Dialog ─────────────────────────────────── */
const DeleteConfirmationDialog = ({ group, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-md animate-slide-up">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
          <FiAlertTriangle className="w-5 h-5 text-feedback-error" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Delete Group</h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">{group.code}</p>
        </div>
      </div>
      <div className="px-6 py-5">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Are you sure you want to delete this group?
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 font-medium">This action will permanently delete <span className="font-bold text-gray-900 dark:text-white">{group.name}</span> and cannot be undone.</p>
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

/* ─── Empty State ────────────────────────────────────────────────── */
const EmptyState = ({ onAdd }) => (
  <tr>
    <td colSpan={6} className="px-5 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-center justify-center">
          <FiLayers className="w-8 h-8 text-gray-200 dark:text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-400 dark:text-gray-550">No groups available.</p>
          <p className="text-[11px] text-gray-300 dark:text-gray-650 font-medium mt-1">Start by adding your first product group.</p>
        </div>
        <button
          onClick={onAdd}
          className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm hover:shadow-md transition-all duration-150"
        >
          <FiPlus className="w-3.5 h-3.5" /> Add First Group
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
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </td>
          <td className="px-5 py-4">
            <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </td>
          <td className="px-5 py-4">
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </td>
          <td className="px-5 py-4">
            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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



/* ─── Main Component ─────────────────────────────────────────────── */
const Groups = () => {
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [modal, setModal] = useState(null); // { mode: 'add' | 'edit' | 'view', group }
  const [toDelete, setToDelete] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Simulate initial load for Loading Skeleton requirement
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  /* Filtered list */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return groups.filter((g) => {
      const matchSearch =
        !q ||
        g.name.toLowerCase().includes(q) ||
        g.code.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'All' || g.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [groups, search, statusFilter]);

  // Reset pagination on search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  /* Paginated list */
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedGroups = useMemo(() => {
    return filtered.slice(startIndex, endIndex);
  }, [filtered, startIndex, endIndex]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  /* Handlers */
  const openAdd = () => setModal({ mode: 'add', group: null });
  const openEdit = (g) => setModal({ mode: 'edit', group: g });
  const openView = (g) => setModal({ mode: 'view', group: g });
  const closeModal = () => setModal(null);

  const handleSave = (form) => {
    if (modal.mode === 'add') {
      const newGroup = { ...form, id: nextId, code: generateCode(nextId) };
      nextId++;
      setGroups((prev) => [newGroup, ...prev]);
    } else {
      setGroups((prev) => prev.map((g) => (g.id === form.id ? form : g)));
    }
    closeModal();
  };

  const handleDelete = () => {
    setGroups((prev) => prev.filter((g) => g.id !== toDelete.id));
    setToDelete(null);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('All');
  };

  const activeCount = groups.filter((g) => g.status === 'Active').length;
  const inactiveCount = groups.filter((g) => g.status === 'Inactive').length;

  return (
    <DashboardLayout pageTitle="Groups">
      <div className="space-y-6 animate-fade-in">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Groups</h1>
            <p className="text-xs text-gray-400 dark:text-gray-550 font-medium mt-1">Manage product groups.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800/50 text-feedback-success text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-feedback-success" />
              {activeCount} Active
            </span>
            {inactiveCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 text-feedback-error text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-feedback-error" />
                {inactiveCount} Inactive
              </span>
            )}
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm hover:shadow-md transition-all duration-150"
            >
              <FiPlus className="w-3.5 h-3.5" /> Add Group
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
                placeholder="Search by Group Name, Group Code, or Description..."
                className="w-full pl-9 pr-4 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg p-1">
              {['All', 'Active', 'Inactive'].map((s) => (
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
                onClick={handleClearFilters}
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
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Groups List</h3>
              <p className="text-[10px] text-gray-400 dark:text-gray-550 font-medium mt-0.5">
                {loading ? 'Loading records...' : `Showing ${filtered.length > 0 ? startIndex + 1 : 0}–${Math.min(endIndex, filtered.length)} of ${filtered.length} records`}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs" aria-label="Product Groups table">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  {['Group Code', 'Group Name', 'Description', 'Total Products', 'Status', 'Actions'].map((h) => (
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
                ) : paginatedGroups.length === 0 ? (
                  <EmptyState onAdd={openAdd} />
                ) : (
                  paginatedGroups.map((g) => (
                    <tr
                      key={g.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors duration-100 group"
                    >
                      {/* Group Code */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-[10px] font-extrabold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                          {g.code}
                        </span>
                      </td>
                      {/* Group Name */}
                      <td className="px-5 py-4 font-semibold text-gray-850 dark:text-gray-200 whitespace-nowrap">
                        {g.name}
                      </td>
                      {/* Description */}
                      <td className="px-5 py-4 text-gray-650 dark:text-gray-300 max-w-xs truncate">
                        {g.description || <span className="text-gray-300 dark:text-gray-600 font-normal italic">No description</span>}
                      </td>
                      {/* Total Products */}
                      <td className="px-5 py-4 font-extrabold text-gray-900 dark:text-white whitespace-nowrap">
                        {g.totalProducts}
                      </td>
                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={g.status} />
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openView(g)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-blue-650 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-150"
                          >
                            <FiEye className="w-3 h-3" /> View
                          </button>
                          <button
                            onClick={() => openEdit(g)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:border-amber-200 dark:hover:border-amber-700 transition-all duration-150"
                          >
                            <FiEdit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => setToDelete(g)}
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
              totalRecords={filtered.length}
              startIndex={startIndex}
              endIndex={endIndex}
              pageSize={itemsPerPage}
              onPageSizeChange={setItemsPerPage}
            />
          )}
        </div>
      </div>

      {/* ── Modals & Dialogs ── */}
      {modal && (
        <GroupModal
          mode={modal.mode}
          group={modal.group}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}

      {toDelete && (
        <DeleteConfirmationDialog
          group={toDelete}
          onCancel={() => setToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </DashboardLayout>
  );
};

export default Groups;
