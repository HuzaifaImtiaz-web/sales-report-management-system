import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { productService } from '../../services/productService';
import Pagination from '../../components/common/Pagination';
import {
  FiSearch, FiPlus, FiEye, FiEdit2, FiTrash2,
  FiX, FiPackage, FiAlertTriangle,
} from 'react-icons/fi';


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

const DeleteDialog = ({ product, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-md animate-slide-up">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
          <FiAlertTriangle className="w-5 h-5 text-feedback-error" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Delete Product</h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-550 font-medium mt-0.5">{product.packSize}</p>
        </div>
      </div>
      <div className="px-6 py-5">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-semibold">
          Are you sure you want to delete{' '}
          <span className="font-bold text-gray-900 dark:text-white">{product.name}</span>?
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-550 mt-2 font-medium">This action cannot be undone.</p>
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-enterprise">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-55 dark:hover:bg-gray-700 transition-all duration-150"
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

const EmptyState = ({ onAdd }) => (
  <tr>
    <td colSpan={6} className="px-5 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-gray-55 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-center justify-center">
          <FiPackage className="w-8 h-8 text-gray-200 dark:text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-400 dark:text-gray-550">No products available.</p>
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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatus] = useState('All');
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    productService.getAllProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  /* Filtered list */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      const matchQ = !q || 
        p.name.toLowerCase().includes(q) || 
        (p.packSize && p.packSize.toLowerCase().includes(q)) || 
        (p.category && p.category.toLowerCase().includes(q));
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
  const openAdd  = ()  => navigate('/products/new');
  const openEdit = (p) => navigate(`/products/${p.id}/edit`);
  const openView = (p) => navigate(`/products/${p.id}`);

  const handleDelete = () => {
    if (toDelete) {
      productService.deleteProduct(toDelete.id).then((newProducts) => {
        setProducts(newProducts);
        setToDelete(null);
      });
    }
  };

  const activeCount   = products.filter((p) => p.status === 'Active').length;
  const inactiveCount = products.filter((p) => p.status === 'Inactive').length;

  return (
    <DashboardLayout pageTitle="Products">
      <div className="space-y-6 animate-fade-in">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-905 dark:text-white tracking-tight">Products</h1>
            <p className="text-xs text-gray-400 dark:text-gray-550 font-medium mt-1">Manage pharmaceutical products.</p>
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
                placeholder="Search product by name, pack size, or category..."
                className="w-full pl-9 pr-4 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-250 bg-gray-55 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-805 border border-gray-100 dark:border-gray-700 rounded-lg p-1">
              {['All', 'Active', 'Inactive'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all duration-150
                    ${statusFilter === s
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm border border-gray-100 dark:border-gray-600'
                      : 'text-gray-405 hover:text-gray-650 dark:hover:text-gray-300'
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
              <p className="text-[10px] text-gray-405 dark:text-gray-550 font-medium mt-0.5">
                Showing {filtered.length > 0 ? startIndex + 1 : 0}–{Math.min(endIndex, filtered.length)} of {filtered.length} records
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs" aria-label="Products table">
              <thead>
                <tr className="bg-gray-55 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  {['Product Name', 'Pack Size', 'Pack Price', 'Per Unit Price', 'Status', 'Actions'].map((h) => (
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
                    <tr key={p.id} className="hover:bg-gray-55/60 dark:hover:bg-gray-800/30 transition-colors duration-100 group">
                      {/* Name */}
                      <td className="px-5 py-4 font-semibold text-gray-805 dark:text-white whitespace-nowrap">
                        <div>
                          <p className="text-xs font-bold text-gray-850 dark:text-white">{p.name}</p>
                          <p className="text-[9px] text-gray-400 dark:text-gray-500 font-semibold mt-0.5">{p.category}</p>
                        </div>
                      </td>
                      {/* Pack Size */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-[10px] font-extrabold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                          {p.packSize}
                        </span>
                      </td>
                      {/* Pack Price */}
                      <td className="px-5 py-4 font-extrabold text-gray-900 dark:text-white whitespace-nowrap">
                        Rs {p.packPrice.toLocaleString()}
                      </td>
                      {/* Per Unit Price */}
                      <td className="px-5 py-4 font-bold text-brand-primary whitespace-nowrap">
                        Rs {p.perUnitPrice.toLocaleString()} <span className="text-[10px] text-gray-400 font-normal">/ {p.packSizeUnit ? p.packSizeUnit.replace(/s$/, '') : 'Unit'}</span>
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-feedback-error bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 hover:bg-red-105 dark:hover:bg-red-950/50 hover:border-red-200 dark:hover:border-red-700 hover:shadow-sm transition-all duration-150"
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
            totalRecords={filtered.length}
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
