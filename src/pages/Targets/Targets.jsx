import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { targetService } from '../../services/targetService';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import Pagination from '../../components/common/Pagination';
import Toast from '../../components/common/Toast';
import {
  FiSearch, FiPlus, FiEye, FiEdit2, FiTrash2,
  FiX, FiAlertTriangle, FiTarget, FiCopy, FiFileText, FiFilter
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
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 dark:bg-green-900/30 text-feedback-success border border-green-100 dark:border-green-800/50">
        <span className="w-1.5 h-1.5 rounded-full bg-feedback-success inline-block" />
        Achieved
      </span>
    );
  }
  if (status === 'In Progress') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 dark:bg-white/5 text-gray-650 border border-gray-100 dark:border-brand-navyLine">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 inline-block animate-pulse" />
        In Progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 dark:bg-brand-navy border border-gray-200 dark:border-brand-navyLine text-gray-550 dark:text-gray-400">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
      Not Started
    </span>
  );
};

const DeleteConfirmationDialog = ({ target, productName, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-brand-navyCard border dark:border-brand-navyLine rounded-enterprise shadow-2xl w-full max-w-md animate-slide-up">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-brand-navyLine">
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
          <FiAlertTriangle className="w-5 h-5 text-feedback-error" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Delete Target</h2>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5">{target.businessYear}</p>
        </div>
      </div>
      <div className="px-6 py-5">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-semibold">
          Are you sure you want to delete the target for{' '}
          <span className="font-semibold text-gray-900 dark:text-white">{productName}</span> for the year{' '}
          <span className="font-semibold text-gray-900 dark:text-white">{target.businessYear}</span>?
        </p>
        <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-2 font-medium">This will remove all area and team member target splits associated with it.</p>
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-brand-navyLine bg-gray-50/50 dark:bg-brand-navy/30 rounded-b-enterprise">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-805 border border-gray-200 dark:border-brand-navyLine rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-xs font-semibold text-white bg-feedback-error rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5"
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
      <div className="bg-white dark:bg-brand-navyCard border dark:border-brand-navyLine rounded-enterprise shadow-2xl w-full max-w-md animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-brand-navyLine bg-brand-navy">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <FiTarget className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Create New Business Year</h2>
              <p className="text-xs text-white/50 font-medium mt-0.5">Setup pharmaceutical target goals</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <FiX className="w-4 h-4 text-white/80" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-550 dark:text-gray-400 mb-1.5">
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
              className={`w-full px-3 py-2.5 text-xs font-medium text-gray-705 dark:text-gray-200 bg-gray-50 dark:bg-brand-navy/50 border rounded-lg outline-none transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 ${
                error ? 'border-feedback-error' : 'border-gray-200 dark:border-brand-navyLine'
              }`}
            />
            {error && <p className="text-xs text-feedback-error font-semibold mt-1">{error}</p>}
            <p className="text-xs text-gray-500 dark:text-gray-550 mt-1 font-semibold italic">
              (Automatically calculated as {calculatedLabel})
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-550 dark:text-gray-400 mb-2">
              Target Creation Options
            </label>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setCopyPrevious(true)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 flex items-start gap-3
                  ${copyPrevious
                    ? 'border-brand-primary bg-red-50/10 dark:bg-brand-primary/5 shadow-sm'
                    : 'border-gray-200 dark:border-gray-805 hover:border-gray-200 dark:hover:border-gray-700 bg-gray-50/30 dark:bg-brand-navy/10'
                  }`}
              >
                <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                  ${copyPrevious ? 'bg-brand-primary text-white' : 'bg-gray-150 dark:bg-brand-navy text-gray-500'}`}>
                  <FiCopy className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Copy Previous Year's Targets</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 leading-normal">
                    Copies last year's product targets and area split. You can edit them later.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCopyPrevious(false)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 flex items-start gap-3
                  ${!copyPrevious
                    ? 'border-brand-primary bg-red-50/10 dark:bg-brand-primary/5 shadow-sm'
                    : 'border-gray-200 dark:border-gray-805 hover:border-gray-200 dark:hover:border-gray-700 bg-gray-50/30 dark:bg-brand-navy/10'
                  }`}
              >
                <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                  ${!copyPrevious ? 'bg-brand-primary text-white' : 'bg-gray-150 dark:bg-brand-navy text-gray-500'}`}>
                  <FiFileText className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-855 dark:text-gray-200">Create Empty Targets</p>
                  <p className="text-xs text-gray-500 dark:text-gray-550 mt-0.5 leading-normal">
                    Last year's products and area split, with quantities set to 0. Enter the new quantities.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-brand-navyLine bg-gray-50/50 dark:bg-brand-navy/30 rounded-b-enterprise">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-white dark:bg-brand-navy border border-gray-200 dark:border-brand-navyLine rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-5 py-2 text-xs font-semibold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm transition-all"
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
  const location = useLocation();
  // Buttons follow the role's permissions (the server enforces the same rules).
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('targets.create');
  const canEdit = hasPermission('targets.edit');
  const canDelete = hasPermission('targets.delete');

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
    }).catch((err) => {
      setToast({ message: err.message || 'Targets could not be loaded.', type: 'error' });
      setLoading(false);
    });
  }, []);

  // Filter states
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('All');
  const [divisionFilter, setDivisionFilter] = useState('All');
  const [groupFilter, setGroupFilter] = useState('All');
  const [productFilter, setProductFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals / dialogs states
  const [toDelete, setToDelete] = useState(null);
  const [createYearModalOpen, setCreateYearModalOpen] = useState(false);
  // A message from the form (e.g. "Record updated successfully.") arrives with the navigation.
  const [toast, setToast] = useState(location.state?.toast || null);

  useEffect(() => {
    if (location.state?.toast) {
      setToast(location.state.toast);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Unique Divisions & Groups derived from Product Master
  const uniqueDivisions = useMemo(() => {
    const set = new Set();
    products.forEach(p => {
      const div = p.divisionName || p.category || p.division;
      if (div) set.add(div);
    });
    return Array.from(set).sort();
  }, [products]);

  const uniqueGroups = useMemo(() => {
    const set = new Set();
    products.forEach(p => {
      const grp = p.groupName || p.group;
      if (grp) set.add(grp);
    });
    return Array.from(set).sort();
  }, [products]);

  // Calculate stats for each target entry based on actual orders
  const targetsWithStats = useMemo(() => {
    return targets.map((t) => {
      const prod = products.find((p) => p.id === Number(t.productId)) || {};
      const targetQty = Number(t.annualTarget) || 0;
      const brandName = prod.brandName || prod.name || t.productName || 'Unknown Product';
      const code = prod.productCode || prod.code || t.productCode || '';
      const division = prod.divisionName || prod.category || prod.division || t.division || '';
      const groupName = prod.groupName || prod.group || t.groupName || '';

      // Sum quantities from completed orders for this product in this business year
      const achievedQty = orders
        .filter((o) => {
          if (o.status !== 'Completed') return false;
          if (!o.poDate) return false;
          const dt = new Date(o.poDate);
          const y = dt.getFullYear();
          const m = dt.getMonth();
          const orderBY = m >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
          return orderBY === t.businessYear;
        })
        .reduce((sum, o) => {
          const item = o.products?.find((pr) => pr.productId === prod.id || pr.name === brandName);
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
        productCode: code,
        productName: brandName,
        division,
        groupName,
        packSize: prod.packSize ? `${prod.packSize} ${prod.unitTypeName || prod.packSizeUnit || 'Units'}` : '10 Vials',
        unit: prod.unitTypeName || prod.packSizeUnit || 'Vials',
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
        String(t.productName || '').toLowerCase().includes(q) ||
        String(t.productCode || '').toLowerCase().includes(q) ||
        String(t.division || '').toLowerCase().includes(q) ||
        String(t.groupName || '').toLowerCase().includes(q) ||
        String(t.businessYear || '').toLowerCase().includes(q);

      const matchYear = yearFilter === 'All' || t.businessYear === yearFilter;
      const matchDivision = divisionFilter === 'All' || t.division === divisionFilter;
      const matchGroup = groupFilter === 'All' || t.groupName === groupFilter;
      const matchProduct = productFilter === 'All' || Number(t.productId) === Number(productFilter);
      const matchStatus = statusFilter === 'All' || t.status === statusFilter;

      return matchSearch && matchYear && matchDivision && matchGroup && matchProduct && matchStatus;
    });
  }, [targetsWithStats, search, yearFilter, divisionFilter, groupFilter, productFilter, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginated = useMemo(() => filtered.slice(startIndex, endIndex), [filtered, startIndex, endIndex]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, yearFilter, divisionFilter, groupFilter, productFilter, statusFilter]);

  const handleDelete = () => {
    if (!toDelete) return;
    const item = toDelete;
    targetService.deleteTarget(item.id)
      .then((newList) => {
        setTargets(newList);
        setToast({ message: `Target "${item.productName || item.brandName || 'target'}" deleted.`, type: 'success' });
      })
      .catch((err) => {
        // The server explains why, e.g. the record is still used by orders.
        setToast({ message: err.message || 'This target could not be deleted.', type: 'error' });
      })
      .finally(() => setToDelete(null));
  };

  // Creates the year in the database; its targets are copied from the year before or start at 0.
  const handleCreateBusinessYear = async (newYearObj, copyPrevious) => {
    setCreateYearModalOpen(false);
    try {
      const created = await targetService.createBusinessYear(newYearObj.value, copyPrevious);
      const [years, list] = await Promise.all([targetService.getBusinessYears(), targetService.getAllTargets()]);
      setBusinessYears(years);
      setTargets(list);
      setToast({
        message: `Business year ${created.value} created: ${created.targets} product target${created.targets === 1 ? '' : 's'} ${created.copiedFrom ? `copied from ${created.copiedFrom}` : 'set to 0'}.`,
        type: 'success'
      });
    } catch (err) {
      setToast({ message: err.message || 'The business year could not be created.', type: 'error' });
    }
  };

  const getProductName = (productId) => {
    const p = products.find(prod => prod.id === Number(productId));
    return p ? (p.brandName || p.name) : 'Unknown Product';
  };

  return (
    <DashboardLayout pageTitle="Targets">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Targets</h1>
            <p className="text-xs text-gray-500 dark:text-gray-500 font-medium mt-1">
              Product Master integrated target allocation with Division, Group, and Product filtering.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Creating business years is for administrators (settings.modify), as on the server. */}
            {hasPermission('settings.modify') && (
            <button
              onClick={() => setCreateYearModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-brand-navy text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg border border-gray-200 dark:border-brand-navyLine hover:bg-gray-100 transition-all"
            >
              Manage Years
            </button>
            )}
            {canCreate && (
            <button
              onClick={() => navigate('/targets/new')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-lg hover:bg-brand-primaryDark shadow-sm transition-all"
            >
              <FiPlus className="w-4 h-4" />
              New Target
            </button>
            )}
          </div>
        </div>

        {/* Multi-tier Filters Panel */}
        <div className="bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-enterprise shadow-soft p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Product Name, Code, Division, Group, Business Year..."
                className="w-full pl-10 pr-4 py-2 text-xs font-semibold text-gray-705 dark:text-gray-205 bg-gray-50 dark:bg-brand-navy border border-gray-200 dark:border-brand-navyLine rounded-lg outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>
            
            <div className="flex bg-gray-100 dark:bg-brand-navy p-1 rounded-lg">
              {['All', 'Not Started', 'In Progress', 'Achieved'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    statusFilter === s
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-gray-200 dark:border-brand-navyLine">
            <div>
              <label className="block text-[8px] font-semibold text-gray-500 mb-1">Business Year</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-brand-navyLine bg-gray-50 dark:bg-brand-navy text-xs font-semibold rounded cursor-pointer"
              >
                <option value="All">All Years</option>
                {businessYears.map((y) => (
                  <option key={y.value} value={y.value}>{y.value}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[8px] font-semibold text-gray-500 mb-1">Division Filter</label>
              <select
                value={divisionFilter}
                onChange={(e) => setDivisionFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-brand-navyLine bg-gray-50 dark:bg-brand-navy text-xs font-semibold rounded cursor-pointer"
              >
                <option value="All">All Divisions</option>
                {uniqueDivisions.map((div) => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[8px] font-semibold text-gray-500 mb-1">Group Filter</label>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-brand-navyLine bg-gray-50 dark:bg-brand-navy text-xs font-semibold rounded cursor-pointer"
              >
                <option value="All">All Groups</option>
                {uniqueGroups.map((grp) => (
                  <option key={grp} value={grp}>{grp}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[8px] font-semibold text-gray-500 mb-1">Product Filter</label>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-brand-navyLine bg-gray-50 dark:bg-brand-navy text-xs font-semibold rounded cursor-pointer"
              >
                <option value="All">All Products</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.productCode || p.code}] {p.brandName || p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(search || yearFilter !== 'All' || divisionFilter !== 'All' || groupFilter !== 'All' || productFilter !== 'All' || statusFilter !== 'All') && (
            <div className="flex justify-end pt-1">
              <button
                onClick={() => {
                  setSearch('');
                  setYearFilter('All');
                  setDivisionFilter('All');
                  setGroupFilter('All');
                  setProductFilter('All');
                  setStatusFilter('All');
                }}
                className="px-3 py-1.5 text-xs font-semibold border border-gray-200 dark:border-brand-navyLine rounded text-gray-550 hover:bg-gray-50 flex items-center gap-1"
              >
                <FiX className="w-3 h-3" /> Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-enterprise shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs" aria-label="Targets list table">
              <thead>
                <tr className="bg-gray-50 dark:bg-brand-navy/50 border-b border-gray-200 dark:border-brand-navyLine text-xs font-semibold text-gray-500">
                  {['Code', 'Product Master', 'Division / Group', 'Business Year', 'Annual Target', 'Achieved', 'Remaining', 'Progress', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-gray-455 font-semibold">
                      No targets found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginated.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4 font-mono font-semibold text-gray-500 dark:text-gray-400">{t.productCode || '—'}</td>
                      <td className="px-5 py-4 font-semibold text-gray-800 dark:text-white">
                        {t.productName}
                        <span className="block text-[11px] text-gray-500 font-normal">{t.packSize}</span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-block font-semibold text-gray-700 dark:text-gray-300">
                          {t.division || 'Himmel'}
                        </span>
                        <span className="block text-[11px] text-gray-500 font-normal">{t.groupName || 'General'}</span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-semibold">{t.businessYear}</td>
                      <td className="px-5 py-4 text-right font-semibold text-brand-primary dark:text-red-400">
                        {t.annualTarget.toLocaleString()} <span className="text-[11px] text-gray-500 dark:text-gray-300 font-medium">{t.unit}</span>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-gray-800 dark:text-white">
                        {t.achievedQuantity.toLocaleString()} <span className="text-[11px] text-gray-500 dark:text-gray-300 font-medium">{t.unit}</span>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-gray-800 dark:text-gray-200">
                        {t.remainingQuantity.toLocaleString()} <span className="text-[11px] text-gray-500 dark:text-gray-300 font-medium">{t.unit}</span>
                      </td>
                      <td className="px-5 py-4 min-w-[120px]">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{t.progressPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-105 dark:bg-brand-navy rounded-full h-1.5 overflow-hidden">
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
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-655 dark:text-gray-400 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-brand-navyLine hover:bg-gray-105 transition-all duration-155"
                          >
                            <FiEye className="w-3 h-3" /> View
                          </button>
                          {canEdit && (
                          <button
                            onClick={() => navigate(`/targets/${t.id}/edit`)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 hover:bg-amber-105 transition-all duration-155"
                          >
                            <FiEdit2 className="w-3 h-3" /> Edit
                          </button>
                          )}
                          {canDelete && (
                          <button
                            onClick={() => setToDelete(t)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-feedback-error bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 hover:bg-red-105 transition-all duration-155"
                          >
                            <FiTrash2 className="w-3 h-3" /> Delete
                          </button>
                          )}
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

