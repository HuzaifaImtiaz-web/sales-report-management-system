import React, { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Pagination from '../../components/common/Pagination';
import {
  FiSearch, FiPlus, FiEye, FiEdit2, FiTrash2,
  FiX, FiPackage, FiAlertTriangle, FiCheck,
} from 'react-icons/fi';

/* ─── Dummy Data ─────────────────────────────────────────────────── */
let nextId = 11;
const generateCode = (id) => `PRD-${String(id).padStart(4, '0')}`;

const INITIAL_PRODUCTS = [
  { id: 1,  code: 'PRD-0001', name: 'Amoxicillin 500mg',      unit: 'Box',    rate: 450,   status: 'Active',   description: 'Broad-spectrum antibiotic for bacterial infections.' },
  { id: 2,  code: 'PRD-0002', name: 'Paracetamol 650mg',      unit: 'Strip',  rate: 120,   status: 'Active',   description: 'Pain reliever and fever reducer.' },
  { id: 3,  code: 'PRD-0003', name: 'Metformin 850mg',        unit: 'Box',    rate: 380,   status: 'Active',   description: 'Oral diabetes medication.' },
  { id: 4,  code: 'PRD-0004', name: 'Lipitor 10mg',           unit: 'Strip',  rate: 950,   status: 'Active',   description: 'Cholesterol-lowering statin medication.' },
  { id: 5,  code: 'PRD-0005', name: 'Ibuprofen 400mg',        unit: 'Strip',  rate: 90,    status: 'Inactive', description: 'Anti-inflammatory pain relief.' },
  { id: 6,  code: 'PRD-0006', name: 'Omeprazole 20mg',        unit: 'Box',    rate: 520,   status: 'Active',   description: 'Proton pump inhibitor for acid reflux.' },
  { id: 7,  code: 'PRD-0007', name: 'Augmentin 625mg',        unit: 'Box',    rate: 1100,  status: 'Active',   description: 'Antibiotic combination for resistant infections.' },
  { id: 8,  code: 'PRD-0008', name: 'Azithromycin 250mg',     unit: 'Strip',  rate: 670,   status: 'Active',   description: 'Macrolide antibiotic.' },
  { id: 9,  code: 'PRD-0009', name: 'Ventolin Inhaler',       unit: 'Piece',  rate: 850,   status: 'Inactive', description: 'Bronchodilator for asthma relief.' },
  { id: 10, code: 'PRD-0010', name: 'Crestor 10mg',           unit: 'Strip',  rate: 1350,  status: 'Active',   description: 'Statin for lowering LDL cholesterol.' },
];

const UNITS = ['Box', 'Strip', 'Piece', 'Vial', 'Sachet', 'Bottle', 'Ampoule'];
const EMPTY_FORM = { name: '', code: '', unit: '', rate: '', description: '', status: 'Active' };

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
const ProductModal = ({ mode, product, onClose, onSave }) => {
  const isView = mode === 'view';
  const [form, setForm] = useState(
    product ? { ...product } : { ...EMPTY_FORM, code: generateCode(nextId) }
  );
  const [errors, setErrors] = useState({});

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name = 'Product Name is required.';
    if (!form.unit)         e.unit = 'Unit is required.';
    if (!form.rate && form.rate !== 0) e.rate = 'Default Rate is required.';
    else if (isNaN(Number(form.rate)) || Number(form.rate) < 0) e.rate = 'Must be a valid positive number.';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({ ...form, rate: Number(form.rate) });
  };

  const headerTitle = isView ? 'Product Details' : mode === 'add' ? 'Add New Product' : 'Edit Product';
  const headerIcon  = isView ? FiEye : mode === 'add' ? FiPlus : FiEdit2;
  const HeaderIcon  = headerIcon;

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
              {product && <p className="text-[10px] text-white/50 font-medium mt-0.5">{form.code}</p>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <FiX className="w-4 h-4 text-white/80" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">

          {/* Row 1: Name + Code */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Product Name" required error={errors.name}>
              <input
                disabled={isView}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Amoxicillin 500mg"
                className={inputCls(errors.name) + (isView ? ' opacity-70 cursor-default' : '')}
              />
            </Field>
            <Field label="Product Code">
              <input
                disabled
                value={form.code}
                className={inputCls(false) + ' opacity-60 cursor-default font-mono'}
              />
            </Field>
          </div>

          {/* Row 2: Unit + Rate */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Unit" required error={errors.unit}>
              {isView ? (
                <input disabled value={form.unit} className={inputCls(false) + ' opacity-70 cursor-default'} />
              ) : (
                <select
                  value={form.unit}
                  onChange={(e) => set('unit', e.target.value)}
                  className={inputCls(errors.unit) + ' appearance-none cursor-pointer'}
                >
                  <option value="">Select unit…</option>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              )}
            </Field>
            <Field label="Default Rate (PKR)" required error={errors.rate}>
              <input
                disabled={isView}
                type="number"
                min="0"
                value={form.rate}
                onChange={(e) => set('rate', e.target.value)}
                placeholder="0.00"
                className={inputCls(errors.rate) + (isView ? ' opacity-70 cursor-default' : '')}
              />
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
              className={inputCls(false) + ' resize-none' + (isView ? ' opacity-70 cursor-default' : '')}
            />
          </Field>

          {/* Status */}
          <Field label="Status" required>
            {isView ? (
              <div className="pt-1"><StatusBadge status={form.status} /></div>
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
              {mode === 'add' ? 'Save Product' : 'Update Product'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Delete Confirmation ────────────────────────────────────────── */
const DeleteDialog = ({ product, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-md animate-slide-up">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
          <FiAlertTriangle className="w-5 h-5 text-feedback-error" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Delete Product</h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">{product.code}</p>
        </div>
      </div>
      <div className="px-6 py-5">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Are you sure you want to delete{' '}
          <span className="font-bold text-gray-900 dark:text-white">{product.name}</span>?
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">This action cannot be undone.</p>
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
          className="px-4 py-2 text-xs font-bold text-white bg-feedback-error rounded-lg hover:bg-red-600 shadow-sm hover:shadow-md transition-all duration-150 flex items-center gap-1.5"
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
          <FiPackage className="w-8 h-8 text-gray-200 dark:text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-400 dark:text-gray-500">No products available.</p>
          <p className="text-[11px] text-gray-300 dark:text-gray-600 font-medium mt-1">Start by adding your first product.</p>
        </div>
        <button
          onClick={onAdd}
          className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm hover:shadow-md transition-all duration-150"
        >
          <FiPlus className="w-3.5 h-3.5" /> Add First Product
        </button>
      </div>
    </td>
  </tr>
);

/* ─── Main Page ──────────────────────────────────────────────────── */
const Products = () => {
  const [products, setProducts]   = useState(INITIAL_PRODUCTS);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('All');
  const [modal, setModal]         = useState(null); // { mode: 'add'|'edit'|'view', product }
  const [toDelete, setToDelete]   = useState(null);

  /* Filtered list */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.unit.toLowerCase().includes(q);
      const matchS = statusFilter === 'All' || p.status === statusFilter;
      return matchQ && matchS;
    });
  }, [products, search, statusFilter]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = useMemo(() => {
    return filtered.slice(startIndex, endIndex);
  }, [filtered, startIndex, endIndex, itemsPerPage]);

  // Reset page when filters/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  /* Handlers */
  const openAdd  = ()  => setModal({ mode: 'add',  product: null });
  const openEdit = (p) => setModal({ mode: 'edit', product: p });
  const openView = (p) => setModal({ mode: 'view', product: p });
  const closeModal = () => setModal(null);

  const handleSave = (form) => {
    if (modal.mode === 'add') {
      const newProd = { ...form, id: nextId, code: generateCode(nextId) };
      nextId++;
      setProducts((prev) => [newProd, ...prev]);
    } else {
      setProducts((prev) => prev.map((p) => p.id === form.id ? form : p));
    }
    closeModal();
  };

  const handleDelete = () => {
    setProducts((prev) => prev.filter((p) => p.id !== toDelete.id));
    setToDelete(null);
  };

  const activeCount   = products.filter((p) => p.status === 'Active').length;
  const inactiveCount = products.filter((p) => p.status === 'Inactive').length;

  return (
    <DashboardLayout pageTitle="Products">
      <div className="space-y-6 animate-fade-in">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Products</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-1">Manage pharmaceutical products.</p>
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
              <FiPlus className="w-3.5 h-3.5" /> Add Product
            </button>
          </div>
        </div>

        {/* ── Search & Filter ── */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product..."
                className="w-full pl-9 pr-4 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg p-1">
              {['All', 'Active', 'Inactive'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
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

            {/* Clear */}
            {(search || statusFilter !== 'All') && (
              <button
                onClick={() => { setSearch(''); setStatus('All'); }}
                className="px-3 py-2.5 text-xs font-bold text-gray-500 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap"
              >
                <FiX className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Products List</h3>
              <p className="text-[10px] text-gray-400 dark:text-gray-550 font-medium mt-0.5">
                Showing {filtered.length > 0 ? startIndex + 1 : 0}–{Math.min(endIndex, filtered.length)} of {filtered.length} records
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs" aria-label="Products table">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  {['Product Code', 'Product Name', 'Unit', 'Default Rate', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-5 py-3.5 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {filtered.length === 0 ? (
                  <EmptyState onAdd={openAdd} />
                ) : (
                  paginatedProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors duration-100 group">
                      {/* Code */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-[10px] font-extrabold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                          {p.code}
                        </span>
                      </td>
                      {/* Name */}
                      <td className="px-5 py-4 font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">{p.name}</td>
                      {/* Unit */}
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">{p.unit}</td>
                      {/* Rate */}
                      <td className="px-5 py-4 font-extrabold text-gray-900 dark:text-white whitespace-nowrap">
                        PKR {p.rate.toLocaleString()}
                      </td>
                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={p.status} />
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openView(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-sm transition-all duration-150"
                          >
                            <FiEye className="w-3 h-3" /> View
                          </button>
                          <button
                            onClick={() => openEdit(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:border-amber-200 dark:hover:border-amber-700 hover:shadow-sm transition-all duration-150"
                          >
                            <FiEdit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => setToDelete(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-feedback-error bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/50 hover:border-red-200 dark:hover:border-red-700 hover:shadow-sm transition-all duration-150"
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

      {/* ── Modals ── */}
      {modal && (
        <ProductModal
          mode={modal.mode}
          product={modal.product}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
      {toDelete && (
        <DeleteDialog
          product={toDelete}
          onCancel={() => setToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </DashboardLayout>
  );
};

export default Products;
