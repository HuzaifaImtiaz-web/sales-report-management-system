import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { targetService } from '../../services/targetService';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import Pagination from '../../components/common/Pagination';
import Toast from '../../components/common/Toast';
import {
  FiSearch, FiPlus, FiEye, FiEdit2, FiTrash2,
  FiX, FiAlertTriangle, FiTarget, FiCopy, FiFileText
} from 'react-icons/fi';


const getNextLogicalBusinessYear = (existingYears) => {
  if (!existingYears || !existingYears.length) return '2026-2027';
  const years = existingYears.map(y => Number(y.value.split('-')[0]));
  const maxYear = Math.max(...years);
  return `${maxYear + 1}-${maxYear + 2}`;
};

const StatusBadge = ({ status }) => {
  if (status === 'Achieved') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 dark:bg-green-900/30 text-feedback-success border border-green-100 dark:border-green-800/50">
        <span className="w-1.5 h-1.5 rounded-full bg-feedback-success inline-block" />
        Achieved
      </span>
    );
  }
  if (status === 'In Progress') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-650 border border-blue-100 dark:border-blue-800/50">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block animate-pulse" />
        In Progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-55 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 text-gray-550 dark:text-gray-400">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
      Not Started
    </span>
  );
};

const DeleteConfirmationDialog = ({ target, productName, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-2xl w-full max-w-md animate-slide-up">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
          <FiAlertTriangle className="w-5 h-5 text-feedback-error" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Delete Target</h2>
          <p className="text-[11px] text-gray-400 font-medium mt-0.5">{target.businessYear}</p>
        </div>
      </div>
      <div className="px-6 py-5">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-semibold">
          Are you sure you want to delete the target for{' '}
          <span className="font-bold text-gray-900 dark:text-white">{productName}</span> for the year{' '}
          <span className="font-bold text-gray-900 dark:text-white">{target.businessYear}</span>?
        </p>
        <p className="text-[11px] text-gray-405 dark:text-gray-500 mt-2 font-medium">This will remove all area and team member target splits associated with it.</p>
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-enterprise">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-805 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-55"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-xs font-bold text-white bg-feedback-error rounded-lg hover:bg-red-650 transition-colors flex items-center gap-1.5"
        >
          <FiTrash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    </div>
  </div>
);

export const CreateBusinessYearModal = ({ onClose, onCreate, existingYears }) => {
  const nextLogical = getNextLogicalBusinessYear(existingYears);
  const [yearInput, setYearInput] = useState(nextLogical);
  const [copyPrevious, setCopyPrevious] = useState(true);
  const [error, setError] = useState('');

  const handleCreate = () => {
    const formatted = yearInput.trim();
    const yearRegex = /^\d{4}-\d{4}$/;
    if (!yearRegex.test(formatted)) {
      setError('Please enter a valid format (e.g. 2026-2027).');
      return;
    }

    const exists = existingYears.some((y) => y.value === formatted);
    if (exists) {
      setError('This Business Year already exists.');
      return;
    }

    onCreate({ value: formatted, label: `1 July ${formatted.split('-')[0]} – 30 June ${formatted.split('-')[1]}` }, copyPrevious);
  };

  const startYear = yearInput.split('-')[0] || 'YYYY';
  const endYear = yearInput.split('-')[1] || 'YYYY';
  const calculatedLabel = `1 July ${startYear} – 30 June ${endYear}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-2xl w-full max-w-md animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-brand-navy to-[#162040]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <FiTarget className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Create New Business Year</h2>
              <p className="text-[10px] text-white/50 font-medium mt-0.5">Setup pharmaceutical target goals</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <FiX className="w-4 h-4 text-white/80" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-550 dark:text-gray-400 mb-1.5">
              Business Year (e.g. 2026-2027) <span className="text-feedback-error">*</span>
            </label>
            <input
              type="text"
              value={yearInput}
              onChange={(e) => {
                setYearInput(e.target.value);
                setError('');
              }}
              placeholder="e.g. 2026-2027"
              className={`w-full px-3 py-2.5 text-xs font-medium text-gray-705 dark:text-gray-200 bg-gray-55 dark:bg-gray-800/50 border rounded-lg outline-none transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 ${
                error ? 'border-feedback-error' : 'border-gray-100 dark:border-gray-700'
              }`}
            />
            {error && <p className="text-[10px] text-feedback-error font-semibold mt-1">{error}</p>}
            <p className="text-[10px] text-gray-405 dark:text-gray-550 mt-1 font-semibold italic">
              (Automatically calculated as {calculatedLabel})
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-550 dark:text-gray-400 mb-2">
              Target Creation Options
            </label>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setCopyPrevious(true)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 flex items-start gap-3
                  ${copyPrevious
                    ? 'border-brand-primary bg-red-50/10 dark:bg-brand-primary/5 shadow-sm'
                    : 'border-gray-100 dark:border-gray-805 hover:border-gray-200 dark:hover:border-gray-700 bg-gray-50/30 dark:bg-gray-800/10'
                  }`}
              >
                <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                  ${copyPrevious ? 'bg-brand-primary text-white' : 'bg-gray-150 dark:bg-gray-850 text-gray-405'}`}>
                  <FiCopy className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-850 dark:text-gray-200">Copy Previous Year's Targets</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-normal">
                    Copies all products and their target quantities. You can edit them later.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCopyPrevious(false)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 flex items-start gap-3
                  ${!copyPrevious
                    ? 'border-brand-primary bg-red-50/10 dark:bg-brand-primary/5 shadow-sm'
                    : 'border-gray-100 dark:border-gray-805 hover:border-gray-200 dark:hover:border-gray-700 bg-gray-50/30 dark:bg-gray-800/10'
                  }`}
              >
                <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                  ${!copyPrevious ? 'bg-brand-primary text-white' : 'bg-gray-150 dark:bg-gray-850 text-gray-405'}`}>
                  <FiFileText className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-855 dark:text-gray-200">Create Empty Targets</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-550 mt-0.5 leading-normal">
                    Copies all products and sets target quantities to 0. Enter targets manually.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-enterprise">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-55"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-5 py-2 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm transition-all"
          >
            Create Business Year
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Targets() {
  const navigate = useNavigate();

  const [targets, setTargets] = useState([]);
  const [businessYears, setBusinessYears] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      targetService.getAllTargets(),
      targetService.getBusinessYears(),
      productService.getAllProducts(),
      orderService.getAllOrders()
    ]).then(([targetsData, yearsData, productsData, ordersData]) => {
      setTargets(targetsData);
      setBusinessYears(yearsData);
      setProducts(productsData);
      setOrders(ordersData);
      setLoading(false);
    });
  }, []);

  // Filter states
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals / dialogs states
  const [toDelete, setToDelete] = useState(null);
  const [createYearModalOpen, setCreateYearModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Calculate stats for each target entry based on actual orders
  const targetsWithStats = useMemo(() => {
    return targets.map((t) => {
      const prod = products.find((p) => p.id === Number(t.productId)) || {};
      const targetQty = Number(t.annualTarget) || 0;

      // Sum quantities from completed orders for this product in this business year
      const achievedQty = orders
        .filter((o) => {
          if (o.status !== 'Completed') return false;
          // Verify if order falls in this business year
          if (!o.poDate) return false;
          const dt = new Date(o.poDate);
          const y = dt.getFullYear();
          const m = dt.getMonth();
          const orderBY = m >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
          return orderBY === t.businessYear;
        })
        .reduce((sum, o) => {
          const item = o.products?.find((pr) => pr.name === prod.name);
          return sum + (item ? Number(item.qty) || 0 : 0);
        }, 0);

      const remainingQty = Math.max(0, targetQty - achievedQty);
      const progressPercent = targetQty > 0 ? Math.min(100, Math.round((achievedQty / targetQty) * 100)) : 0;

      let status = 'Not Started';
      if (achievedQty >= targetQty && targetQty > 0) {
        status = 'Achieved';
      } else if (achievedQty > 0) {
        status = 'In Progress';
      }

      return {
        ...t,
        productName: prod.name || 'Unknown Product',
        packSize: prod.packSize || '10 Vials',
        unit: prod.packSizeUnit || 'Vials',
        achievedQuantity: achievedQty,
        remainingQuantity: remainingQty,
        progressPercent,
        status
      };
    });
  }, [targets, products, orders]);

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return targetsWithStats.filter((t) => {
      const matchSearch = !q ||
        t.productName.toLowerCase().includes(q) ||
        t.packSize.toLowerCase().includes(q) ||
        t.businessYear.toLowerCase().includes(q);

      const matchYear = yearFilter === 'All' || t.businessYear === yearFilter;
      const matchStatus = statusFilter === 'All' || t.status === statusFilter;

      return matchSearch && matchYear && matchStatus;
    });
  }, [targetsWithStats, search, yearFilter, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginated = useMemo(() => filtered.slice(startIndex, endIndex), [filtered, startIndex, endIndex]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, yearFilter, statusFilter]);

  const handleDelete = () => {
    if (!toDelete) return;
    targetService.deleteTarget(toDelete.id).then((newList) => {
      setTargets(newList);
      setToDelete(null);
      setToast({ message: 'Target deleted successfully.', type: 'success' });
    });
  };

  const handleCreateBusinessYear = (newYearObj) => {
    targetService.saveBusinessYear(newYearObj).then((updatedYears) => {
      setBusinessYears(updatedYears);
      setCreateYearModalOpen(false);
      setToast({ message: `Business year "${newYearObj.value}" added successfully.`, type: 'success' });
    });
  };

  const getProductName = (productId) => {
    const p = products.find(prod => prod.id === Number(productId));
    return p ? p.name : 'Unknown Product';
  };

  return (
    <DashboardLayout pageTitle="Targets">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">Targets</h1>
            <p className="text-xs text-gray-405 dark:text-gray-500 font-medium mt-1">Configure and manage annual targets distributed down to Areas and Team Members.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCreateYearModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-55 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 transition-all"
            >
              Manage Years
            </button>
            <button
              onClick={() => navigate('/targets/new')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-primaryDark shadow-sm transition-all"
            >
              <FiPlus className="w-4 h-4" />
              New Target
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-soft p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Product Name, Code, Business Year..."
                className="w-full pl-10 pr-4 py-2 text-xs font-semibold text-gray-705 dark:text-gray-205 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>
            
            <div className="flex bg-gray-100 dark:bg-gray-850 p-1 rounded-lg">
              {['All', 'Not Started', 'In Progress', 'Achieved'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    statusFilter === s
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-750'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-48">
              <label className="block text-[8px] font-bold text-gray-450 uppercase mb-1">Business Year</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 bg-gray-55 dark:bg-gray-800 text-xs rounded cursor-pointer"
              >
                <option value="All">All Years</option>
                {businessYears.map((y) => (
                  <option key={y.value} value={y.value}>{y.value}</option>
                ))}
              </select>
            </div>

            {(search || yearFilter !== 'All' || statusFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearch('');
                  setYearFilter('All');
                  setStatusFilter('All');
                }}
                className="mt-4 px-3 py-1.5 text-[10px] font-bold border border-gray-200 dark:border-gray-700 rounded text-gray-550 hover:bg-gray-50 flex items-center gap-1"
              >
                <FiX className="w-3 h-3" /> Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-155 dark:border-gray-800 rounded-enterprise shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs" aria-label="Targets list table">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-155 dark:border-gray-800 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  {['Pack Size', 'Product Name', 'Business Year', 'Annual Target', 'Achieved', 'Remaining', 'Progress', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-gray-455 font-bold">
                      No targets found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginated.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-gray-800 dark:text-gray-200">{t.packSize}</td>
                      <td className="px-5 py-4 font-bold text-gray-850 dark:text-white">{t.productName}</td>
                      <td className="px-5 py-4 whitespace-nowrap font-semibold">{t.businessYear}</td>
                      <td className="px-5 py-4 text-right font-extrabold text-brand-primary">
                        {t.annualTarget.toLocaleString()} <span className="text-[9px] text-gray-405 font-normal">{t.unit}</span>
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-gray-800 dark:text-gray-205">
                        {t.achievedQuantity.toLocaleString()} <span className="text-[9px] text-gray-405 font-normal">{t.unit}</span>
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-gray-805 dark:text-gray-300">
                        {t.remainingQuantity.toLocaleString()} <span className="text-[9px] text-gray-405 font-normal">{t.unit}</span>
                      </td>
                      <td className="px-5 py-4 min-w-[120px]">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-extrabold text-gray-800 dark:text-gray-200">{t.progressPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-105 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-brand-primary h-full rounded-full transition-all duration-300"
                            style={{ width: `${t.progressPercent}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/targets/${t.id}`)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-blue-655 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 hover:bg-blue-105 transition-all duration-155"
                          >
                            <FiEye className="w-3 h-3" /> View
                          </button>
                          <button
                            onClick={() => navigate(`/targets/${t.id}/edit`)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 hover:bg-amber-105 transition-all duration-155"
                          >
                            <FiEdit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => setToDelete(t)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-feedback-error bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 hover:bg-red-105 transition-all duration-155"
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
            endIndex={startIndex + itemsPerPage}
            pageSize={itemsPerPage}
            onPageSizeChange={setItemsPerPage}
          />
        </div>
      </div>

      {toDelete && (
        <DeleteConfirmationDialog
          target={toDelete}
          productName={getProductName(toDelete.productId)}
          onCancel={() => setToDelete(null)}
          onConfirm={handleDelete}
        />
      )}

      {createYearModalOpen && (
        <CreateBusinessYearModal
          onClose={() => setCreateYearModalOpen(false)}
          onCreate={handleCreateBusinessYear}
          existingYears={businessYears}
        />
      )}
    </DashboardLayout>
  );
}
