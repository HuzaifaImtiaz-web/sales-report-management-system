import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { productService } from '../../services/productService';
import Pagination from '../../components/common/Pagination';
import FilterPresetBar from '../../components/common/FilterPresetBar';
import Toast from '../../components/common/Toast';
import ConfirmDialog from '../../components/common/dialogs/ConfirmDialog';
import StatusSelector from '../../components/common/StatusSelector';
import { exportToCSV } from '../../utils/exportUtils';
import {
  FiSearch, FiPlus, FiEye, FiEdit2, FiTrash2,
  FiX, FiPackage, FiAlertTriangle, FiDownload
} from 'react-icons/fi';

const StatusBadge = ({ status }) => {
  switch (status) {
    case 'Active':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 dark:bg-green-900/30 text-feedback-success border border-green-100 dark:border-green-800/50">
          <span className="w-1.5 h-1.5 rounded-full bg-feedback-success inline-block" />
          Active
        </span>
      );
    case 'Inactive':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-600 border border-amber-100 dark:border-amber-805/50">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
          Inactive
        </span>
      );
    case 'Discontinued':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-900/30 text-feedback-error border border-red-100 dark:border-red-800/50">
          <span className="w-1.5 h-1.5 rounded-full bg-feedback-error inline-block" />
          Discontinued
        </span>
      );
  }
};

const DeleteDialog = ({ product, onCancel, onConfirm }) => (
  <ConfirmDialog
    open={Boolean(product)}
    title="Delete Product"
    message={`Are you sure you want to delete ${product?.brandName || product?.name || 'this product'} (${product?.productCode || product?.code || ''})? This action cannot be undone.`}
    confirmText="Delete Product"
    cancelText="Cancel"
    confirmVariant="danger"
    onConfirm={onConfirm}
    onCancel={onCancel}
  />
);

const EmptyState = ({ onAdd }) => (
  <tr>
    <td colSpan={11} className="px-5 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-gray-55 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-center justify-center">
          <FiPackage className="w-8 h-8 text-gray-200 dark:text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-400 dark:text-gray-555">No products available.</p>
          <p className="text-[11px] text-gray-300 dark:text-gray-655 font-medium mt-1">Start by adding your first product.</p>
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

const Products = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(location.state?.toast || null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatus] = useState('All');
  const [divisionFilter, setDivisionFilter] = useState('All');
  const [groupFilter, setGroupFilter] = useState('');
  const [groupFilterQuery, setGroupFilterQuery] = useState('');
  const [showGroupFilterSuggestions, setShowGroupFilterSuggestions] = useState(false);
  const [sortField, setSortField] = useState('brandName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setSearch(q);
  }, [searchParams]);

  const fetchProducts = () => {
    productService.getAllProducts().then((data) => {
      setProducts(data || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchProducts();
    const handleDbChange = () => fetchProducts();
    window.addEventListener('himmel-db-change', handleDbChange);
    return () => window.removeEventListener('himmel-db-change', handleDbChange);
  }, []);

  useEffect(() => {
    if (location.state?.toast) {
      setToast(location.state.toast);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Compute unique product groups based on division filter for filtering suggestions
  const groupSuggestions = useMemo(() => {
    let filteredProducts = products;
    if (divisionFilter !== 'All') {
      filteredProducts = products.filter(p => {
        const divName = p.divisionName || p.category || '';
        return divName.trim().toLowerCase() === divisionFilter.toLowerCase();
      });
    }
    const groups = [...new Set(filteredProducts.map((p) => p.groupName).filter(Boolean))];
    if (!groupFilterQuery) return groups;
    return groups.filter((g) =>
      g.toLowerCase().includes(groupFilterQuery.toLowerCase())
    );
  }, [products, divisionFilter, groupFilterQuery]);

  /* Filtered list based on Search terms & Advanced filter options */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      // 1. Search query
      const matchQ = !q || 
        (p.brandName && p.brandName.toLowerCase().includes(q)) || 
        (p.name && p.name.toLowerCase().includes(q)) || 
        (p.productCode && p.productCode.toLowerCase().includes(q)) || 
        (p.code && p.code.toLowerCase().includes(q)) || 
        (p.genericName && p.genericName.toLowerCase().includes(q)) || 
        (p.registrationNo && p.registrationNo.toLowerCase().includes(q)) ||
        (p.divisionName && p.divisionName.toLowerCase().includes(q)) || 
        (p.groupName && p.groupName.toLowerCase().includes(q)) ||
        (p.manufacturer && p.manufacturer.toLowerCase().includes(q));

      // 2. Status filter
      const matchS = statusFilter === 'All' || p.status === statusFilter;

      // 3. Division filter
      const divName = p.divisionName || p.category || '';
      const matchDiv = divisionFilter === 'All' || divName.trim().toLowerCase() === divisionFilter.toLowerCase();

      // 4. Group filter
      const matchGroup = !groupFilter || (p.groupName && p.groupName.trim().toLowerCase() === groupFilter.trim().toLowerCase());

      return matchQ && matchS && matchDiv && matchGroup;
    });
  }, [products, search, statusFilter, divisionFilter, groupFilter]);

  /* Sorted list */
  const sorted = useMemo(() => {
    const list = [...filtered];
    if (!sortField) return list;

    list.sort((a, b) => {
      let valA = '';
      let valB = '';

      switch (sortField) {
        case 'productCode':
          valA = a.productCode || a.code || '';
          valB = b.productCode || b.code || '';
          break;
        case 'brandName':
          valA = a.brandName || a.name || '';
          valB = b.brandName || b.name || '';
          break;
        case 'genericName':
          valA = a.genericName || '';
          valB = b.genericName || '';
          break;
        case 'division':
          valA = a.divisionName || a.category || '';
          valB = b.divisionName || b.category || '';
          break;
        case 'groupName':
          valA = a.groupName || '';
          valB = b.groupName || '';
          break;
        case 'tp':
          valA = a.tp !== undefined ? a.tp : (a.packPrice || 0);
          valB = b.tp !== undefined ? b.tp : (b.packPrice || 0);
          break;
        case 'mrp':
          valA = a.mrp !== undefined ? a.mrp : (a.tp !== undefined ? a.tp : (a.packPrice || 0));
          valB = b.mrp !== undefined ? b.mrp : (b.tp !== undefined ? b.tp : (b.packPrice || 0));
          break;
        case 'status':
          valA = a.status || '';
          valB = b.status || '';
          break;
        default:
          return 0;
      }

      if (typeof valA === 'string') {
        const comp = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
        return sortOrder === 'asc' ? comp : -comp;
      } else {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
    });
    return list;
  }, [filtered, sortField, sortOrder]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Pagination calculations
  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = useMemo(() => {
    return sorted.slice(startIndex, endIndex);
  }, [sorted, startIndex, endIndex, itemsPerPage]);

  // Reset page when filters/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, divisionFilter, groupFilter]);

  /* Handlers */
  const openAdd  = ()  => navigate('/products/new');
  const openEdit = (p) => navigate(`/products/${p.id}/edit`);
  const openView = (p) => navigate(`/products/${p.id}`);

  const handleDelete = () => {
    if (toDelete) {
      productService.deleteProduct(toDelete.id).then((newProducts) => {
        setProducts(newProducts || []);
        setToDelete(null);
      });
    }
  };

  const handleClearAll = () => {
    setSearch('');
    setStatus('All');
    setDivisionFilter('All');
    setGroupFilter('');
    setGroupFilterQuery('');
  };

  const activeCount   = products.filter((p) => p.status === 'Active').length;
  const inactiveCount = products.filter((p) => p.status === 'Inactive').length;
  const discontinuedCount = products.filter((p) => p.status === 'Discontinued').length;

  const SORTABLE_COLUMNS = {
    'Product Code': 'productCode',
    'Brand Name': 'brandName',
    'Generic Name': 'genericName',
    'Division': 'division',
    'Product Group': 'groupName',
    'TP': 'tp',
    'MRP': 'mrp',
    'Status': 'status'
  };

  return (
    <DashboardLayout pageTitle="Products">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="space-y-6 animate-fade-in">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-905 dark:text-white tracking-tight">Products Master</h1>
            <p className="text-xs text-gray-400 dark:text-gray-550 font-medium mt-1 font-semibold">Manage Himmel Pharmaceutical products master records.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => exportToCSV('products_master_export', sorted, [
                { key: 'productCode', label: 'Product Code' },
                { key: 'brandName', label: 'Brand Name' },
                { key: 'genericName', label: 'Generic Name' },
                { key: 'registrationNo', label: 'Registration No' },
                { key: 'divisionName', label: 'Division' },
                { key: 'groupName', label: 'Product Group' },
                { key: 'packSize', label: 'Pack Size' },
                { key: 'tp', label: 'Trade Price (TP)' },
                { key: 'mrp', label: 'MRP' },
                { key: 'status', label: 'Status' }
              ])}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Export filtered products to CSV"
            >
              <FiDownload className="w-3.5 h-3.5" /> Export Filtered
            </button>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800/50 text-feedback-success text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-feedback-success" />
              {activeCount} Active
            </span>
            {inactiveCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 text-amber-600 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {inactiveCount} Inactive
              </span>
            )}
            {discontinuedCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 text-feedback-error text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-feedback-error" />
                {discontinuedCount} Discontinued
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
        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
            <FilterPresetBar
              moduleName="products"
              currentFilters={{ search, statusFilter, divisionFilter, groupFilter }}
              onApplyPreset={(f) => {
                if (f.search !== undefined) setSearch(f.search);
                if (f.statusFilter !== undefined) setStatus(f.statusFilter);
                if (f.divisionFilter !== undefined) setDivisionFilter(f.divisionFilter);
                if (f.groupFilter !== undefined) setGroupFilter(f.groupFilter);
              }}
              defaultPresets={[
                { id: 'p_pms_prods', name: 'PMS Products', filters: { statusFilter: 'Active', divisionFilter: 'PMS' } },
                { id: 'p_discontinued', name: 'Discontinued Products', filters: { statusFilter: 'Discontinued' } }
              ]}
            />
          </div>
          <div className="flex flex-col gap-3">
            {/* Row 1: Search & Clear */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products by code, brand, generic, registration number, division, group..."
                  className="w-full pl-9 pr-4 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-255 bg-gray-55 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>

              {(search || statusFilter !== 'All' || divisionFilter !== 'All' || groupFilter) && (
                <button
                  onClick={handleClearAll}
                  className="px-3 py-2.5 text-xs font-bold text-gray-500 bg-gray-55 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap"
                >
                  <FiX className="w-3.5 h-3.5" /> Clear Filters
                </button>
              )}
            </div>

            {/* Row 2: Advanced Filters (Division, Product Group, Status) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              {/* Division Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Division</label>
                <select
                  value={divisionFilter}
                  onChange={(e) => {
                    setDivisionFilter(e.target.value);
                    setGroupFilter('');
                    setGroupFilterQuery('');
                  }}
                  className="w-full px-3 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-205 bg-gray-55 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none cursor-pointer"
                >
                  <option value="All">All Divisions</option>
                  <option value="Himmel">Himmel</option>
                  <option value="PMS">PMS</option>
                  <option value="MSA">MSA</option>
                </select>
              </div>

              {/* Product Group Filter (Searchable ComboBox) */}
              <div className="relative">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Product Group</label>
                <div className="relative">
                  <input
                    type="text"
                    value={groupFilterQuery}
                    onChange={(e) => {
                      setGroupFilterQuery(e.target.value);
                      setGroupFilter(e.target.value);
                      setShowGroupFilterSuggestions(true);
                    }}
                    onFocus={() => setShowGroupFilterSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowGroupFilterSuggestions(false), 200)}
                    placeholder="All Groups / Type to search..."
                    className="w-full px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-205 bg-gray-55 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none"
                  />
                  {groupFilterQuery && (
                    <button
                      type="button"
                      onClick={() => { setGroupFilter(''); setGroupFilterQuery(''); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>
                {showGroupFilterSuggestions && groupSuggestions.length > 0 && (
                  <ul className="absolute z-20 w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg">
                    <li
                      onMouseDown={() => {
                        setGroupFilter('');
                        setGroupFilterQuery('');
                        setShowGroupFilterSuggestions(false);
                      }}
                      className="px-3 py-2 text-xs hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 cursor-pointer text-gray-700 dark:text-gray-200 font-bold border-b border-gray-100 dark:border-gray-700"
                    >
                      All Groups
                    </li>
                    {groupSuggestions.map((g) => (
                      <li
                        key={g}
                        onMouseDown={() => {
                          setGroupFilter(g);
                          setGroupFilterQuery(g);
                          setShowGroupFilterSuggestions(false);
                        }}
                        className="px-3 py-2 text-xs hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 cursor-pointer text-gray-750 dark:text-gray-200 font-semibold"
                      >
                        {g}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Status Filter Buttons */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">Status</label>
                <StatusSelector
                  options={['All', 'Active', 'Inactive', 'Discontinued']}
                  value={statusFilter}
                  onChange={setStatus}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Products Master List</h3>
              <p className="text-[10px] text-gray-405 dark:text-gray-550 font-medium mt-0.5">
                Showing {sorted.length > 0 ? startIndex + 1 : 0}–{Math.min(endIndex, sorted.length)} of {sorted.length} records
              </p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-xs" aria-label="Products table">
              <thead className="sticky top-0 z-10 bg-gray-55 dark:bg-[#0f172a] shadow-xs">
                <tr className="bg-gray-55 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  {[
                    'Product Code', 
                    'Brand Name', 
                    'Generic Name', 
                    'Registration No.',
                    'Division', 
                    'Product Group', 
                    'Pack Size', 
                    'TP', 
                    'MRP', 
                    'Status', 
                    'Actions'
                  ].map((h) => {
                    const field = SORTABLE_COLUMNS[h];
                    const isSortable = !!field;
                    return (
                      <th
                        key={h}
                        onClick={() => {
                          if (isSortable) {
                            if (sortField === field) {
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortField(field);
                              setSortOrder('asc');
                            }
                          }
                        }}
                        className={`text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-5 py-3.5 whitespace-nowrap
                          ${isSortable ? 'cursor-pointer select-none hover:text-gray-705 dark:hover:text-gray-200' : ''}`}
                      >
                        <div className="flex items-center gap-1">
                          {h}
                          {isSortable && sortField === field && (
                            <span className="text-[8px] text-brand-primary">
                              {sortOrder === 'asc' ? ' ▲' : ' ▼'}
                            </span>
                          )}
                          {isSortable && sortField !== field && (
                            <span className="text-[8px] text-gray-300 dark:text-gray-600 opacity-60">
                              {' ↕'}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {sorted.length === 0 ? (
                  <EmptyState onAdd={openAdd} />
                ) : (
                  paginatedProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-55/60 dark:hover:bg-gray-800/30 transition-colors duration-100 group">
                      {/* Product Code */}
                      <td className="px-5 py-4 font-mono font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {p.productCode || p.code}
                      </td>
                      {/* Brand Name */}
                      <td className="px-5 py-4 font-extrabold text-gray-950 dark:text-white whitespace-nowrap">
                        {p.brandName || p.name}
                      </td>
                      {/* Generic Name */}
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                        {p.genericName || '-'}
                      </td>
                      {/* Registration No. */}
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400 font-semibold whitespace-nowrap">
                        {p.registrationNo || '-'}
                      </td>
                      {/* Division */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-brand-primary/10 text-brand-primary">
                          {p.divisionName || p.category}
                        </span>
                      </td>
                      {/* Product Group */}
                      <td className="px-5 py-4 text-gray-550 dark:text-gray-300 font-semibold whitespace-nowrap">
                        {p.groupName || 'Unassigned'}
                      </td>
                      {/* Pack Size */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-[10px] font-extrabold text-gray-705 dark:text-gray-300 bg-gray-105 dark:bg-gray-800 px-2 py-0.5 rounded">
                          {p.packSize} {p.unitTypeName || p.packSizeUnit}
                        </span>
                      </td>
                      {/* TP */}
                      <td className="px-5 py-4 font-extrabold text-gray-950 dark:text-white whitespace-nowrap">
                        Rs {(p.tp || p.packPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      {/* MRP */}
                      <td className="px-5 py-4 text-gray-700 dark:text-gray-355 font-bold whitespace-nowrap">
                        Rs {(p.mrp || p.tp || p.packPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-blue-650 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 hover:bg-blue-105 dark:hover:bg-blue-900/50 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-sm transition-all duration-150"
                          >
                            <FiEye className="w-3.5 h-3.5" /> View
                          </button>
                          <button
                            onClick={() => openEdit(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 hover:bg-amber-105 dark:hover:bg-amber-900/50 hover:border-amber-200 dark:hover:border-amber-700 hover:shadow-sm transition-all duration-150"
                          >
                            <FiEdit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => setToDelete(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-feedback-error bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 hover:bg-red-105 dark:hover:bg-red-955/50 hover:border-red-200 dark:hover:border-red-700 hover:shadow-sm transition-all duration-150"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" /> Delete
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
            totalRecords={sorted.length}
            startIndex={startIndex}
            endIndex={endIndex}
            pageSize={itemsPerPage}
            onPageSizeChange={setItemsPerPage}
          />
        </div>
      </div>

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
