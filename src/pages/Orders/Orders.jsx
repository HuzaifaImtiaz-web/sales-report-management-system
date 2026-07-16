import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { orderService } from '../../services/orderService';
import Pagination from '../../components/common/Pagination';
import Toast from '../../components/common/Toast';
import {
  FiSearch, FiX, FiAlertTriangle, FiPlus, FiTrash2,
  FiDownload
} from 'react-icons/fi';

import { productService } from '../../services/productService';
import { doctorService } from '../../services/doctorService';
import { institutionService } from '../../services/institutionService';
import { areaService } from '../../services/areaService';
import { teamMemberService } from '../../services/teamMemberService';

const StatusBadge = ({ status }) =>
  status === 'Completed' ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 dark:bg-green-900/30 text-feedback-success border border-green-100 dark:border-green-800/50">
      <span className="w-1.5 h-1.5 rounded-full bg-feedback-success inline-block" />
      Completed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-600 border border-amber-100 dark:border-amber-800/50">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse" />
      Pending
    </span>
  );

const DeleteDialog = ({ order, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-2xl w-full max-w-md animate-slide-up">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
          <FiAlertTriangle className="w-5 h-5 text-feedback-error" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Delete Order</h2>
          <p className="text-[11px] text-gray-400 font-medium mt-0.5">{order.poNumber}</p>
        </div>
      </div>
      <div className="px-6 py-5">
        <p className="text-sm text-gray-755 dark:text-gray-300 font-semibold">
          Are you sure you want to delete Purchase Order <span className="font-bold text-gray-900 dark:text-white">{order.poNumber}</span>?
        </p>
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-enterprise">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-55"
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

const Orders = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [areas, setAreas] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // All, Pending, Completed
  const [dateFilter, setDateFilter] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [teamMemberFilter, setTeamMemberFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');

  const [toDelete, setToDelete] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    Promise.all([
      orderService.getAllOrders(),
      productService.getAllProducts(),
      doctorService.getAllDoctors(),
      institutionService.getAllInstitutions(),
      areaService.getAllAreas(),
      teamMemberService.getAllTeamMembers()
    ]).then(([ordersData, productsData, doctorsData, instData, areasData, teamData]) => {
      setOrders(ordersData);
      setProducts(productsData);
      setDoctors(doctorsData);
      setInstitutions(instData);
      setAreas(areasData);
      setTeamMembers(teamData);
      setLoading(false);
    });
  }, []);

  // If there's a search param redirect or specific PO filter
  useEffect(() => {
    const selectPo = searchParams.get('poNumber');
    if (selectPo) {
      setSearch(selectPo);
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orders.filter((o) => {
      // Basic Search: PO Number, Doctor, Area
      const matchSearch = !q ||
        o.poNumber.toLowerCase().includes(q) ||
        o.doctor.toLowerCase().includes(q) ||
        o.area.toLowerCase().includes(q);

      // Status
      const matchStatus = statusFilter === 'All' || o.status === statusFilter;

      // Other filters
      const matchDate = !dateFilter || o.poDate === dateFilter;
      const matchInstitution = !institutionFilter || o.institution === institutionFilter;
      const matchDoctor = !doctorFilter || o.doctor === doctorFilter;
      const matchArea = !areaFilter || o.area === areaFilter;
      const matchTeamMember = !teamMemberFilter || o.teamMember === teamMemberFilter;
      
      const matchProduct = !productFilter || o.products.some((p) => p.name === productFilter);

      return matchSearch && matchStatus && matchDate && matchInstitution && matchDoctor && matchArea && matchTeamMember && matchProduct;
    });
  }, [orders, search, statusFilter, dateFilter, institutionFilter, doctorFilter, areaFilter, teamMemberFilter, productFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginated = useMemo(() => filtered.slice(startIndex, startIndex + itemsPerPage), [filtered, startIndex, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dateFilter, institutionFilter, doctorFilter, areaFilter, teamMemberFilter, productFilter]);

  const handleMarkCompleted = (po) => {
    orderService.saveOrder({ ...po, status: 'Completed' }).then((updatedList) => {
      setOrders(updatedList);
      setToast({ message: 'Purchase Order marked as Completed.', type: 'success' });
    });
  };

  const handleDelete = () => {
    orderService.deleteOrder(toDelete.id).then((newList) => {
      setOrders(newList);
      setToDelete(null);
      setToast({ message: 'Purchase Order deleted successfully.', type: 'success' });
    });
  };

  const handleExport = (po) => {
    navigate(`/export?poNumber=${po.poNumber}`);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setDateFilter('');
    setInstitutionFilter('');
    setDoctorFilter('');
    setAreaFilter('');
    setTeamMemberFilter('');
    setProductFilter('');
  };

  const hasActiveFilters = search || statusFilter !== 'All' || dateFilter || institutionFilter || doctorFilter || areaFilter || teamMemberFilter || productFilter;

  return (
    <DashboardLayout pageTitle="Orders">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">Orders</h1>
            <p className="text-xs text-gray-405 dark:text-gray-500 font-medium mt-1">Track and manage all purchase orders.</p>
          </div>
          <div>
            <button
              onClick={() => navigate('/sales')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-primaryDark transition-all"
            >
              <FiPlus className="w-4 h-4" />
              New Order
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-soft p-5 space-y-4">
          {/* Main search and Tab status filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by PO Number, Doctor, Area..."
                className="w-full pl-10 pr-4 py-2 text-xs font-semibold text-gray-705 dark:text-gray-205 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>
            
            <div className="flex bg-gray-100 dark:bg-gray-850 p-1 rounded-lg">
              {['All', 'Pending', 'Completed'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
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

          {/* Grid of advanced filters */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div>
              <label className="block text-[8px] font-bold text-gray-450 uppercase mb-1">Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 bg-gray-55 dark:bg-gray-800 text-xs rounded"
              />
            </div>
            <div>
              <label className="block text-[8px] font-bold text-gray-455 uppercase mb-1">Institution</label>
              <select
                value={institutionFilter}
                onChange={(e) => setInstitutionFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 bg-gray-55 dark:bg-gray-800 text-xs rounded cursor-pointer"
              >
                <option value="">All</option>
                {institutions.map((inst) => (
                  <option key={inst.id || inst.name || inst} value={inst.name || inst}>{inst.name || inst}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[8px] font-bold text-gray-455 uppercase mb-1">Doctor</label>
              <select
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 bg-gray-55 dark:bg-gray-800 text-xs rounded cursor-pointer"
              >
                <option value="">All</option>
                {doctors.map((d) => (
                  <option key={d.id || d.name || d} value={d.name || d}>{d.name || d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[8px] font-bold text-gray-455 uppercase mb-1">Area</label>
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 bg-gray-55 dark:bg-gray-800 text-xs rounded cursor-pointer"
              >
                <option value="">All</option>
                {areas.map((a) => (
                  <option key={a.id || a.name || a} value={a.name || a}>{a.name || a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[8px] font-bold text-gray-455 uppercase mb-1">Team Member</label>
              <select
                value={teamMemberFilter}
                onChange={(e) => setTeamMemberFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 bg-gray-55 dark:bg-gray-800 text-xs rounded cursor-pointer"
              >
                <option value="">All</option>
                {teamMembers.map((t) => (
                  <option key={t.id || t.name || t} value={t.name || t}>{t.name || t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[8px] font-bold text-gray-455 uppercase mb-1">Product</label>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 bg-gray-55 dark:bg-gray-800 text-xs rounded cursor-pointer"
              >
                <option value="">All</option>
                {products.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex justify-end pt-1">
              <button
                onClick={handleClearFilters}
                className="px-3 py-1.5 text-[10px] font-bold border border-gray-200 dark:border-gray-700 rounded text-gray-550 hover:bg-gray-50 flex items-center gap-1"
              >
                <FiX className="w-3 h-3" /> Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Orders Table */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-155 dark:border-gray-800 rounded-enterprise shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs" aria-label="Orders table">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-155 dark:border-gray-800 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  {['PO Number', 'Date', 'Institution', 'Doctor', 'Area', 'Team Member', 'Total Products', 'Total Vials', 'Total Amount', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-5 py-12 text-center text-gray-455 font-bold">
                      No purchase orders found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((po) => (
                    <tr key={po.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-gray-800 dark:text-gray-200">{po.poNumber}</td>
                      <td className="px-5 py-4 whitespace-nowrap">{po.poDate}</td>
                      <td className="px-5 py-4 font-bold text-gray-850 dark:text-white">{po.institution || '—'}</td>
                      <td className="px-5 py-4 whitespace-nowrap">{po.doctor}</td>
                      <td className="px-5 py-4 whitespace-nowrap">{po.area}</td>
                      <td className="px-5 py-4 whitespace-nowrap">{po.teamMember}</td>
                      <td className="px-5 py-4 text-center font-semibold">{po.products ? po.products.length : 0}</td>
                      <td className="px-5 py-4 text-right font-semibold">{po.totalQty || 0}</td>
                      <td className="px-5 py-4 text-right font-extrabold text-brand-primary whitespace-nowrap">Rs {(po.totalAmount || 0).toLocaleString()}</td>
                      <td className="px-5 py-4"><StatusBadge status={po.status} /></td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/orders/${po.id}`)}
                            className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-905 text-blue-655 rounded text-[10px] font-bold"
                          >
                            View
                          </button>
                          <button
                            onClick={() => navigate(`/orders/${po.id}/edit`)}
                            className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded text-[10px] font-bold"
                          >
                            Edit
                          </button>
                          {po.status === 'Pending' && (
                            <button
                              onClick={() => handleMarkCompleted(po)}
                              className="px-2.5 py-1.5 bg-green-50 dark:bg-green-900/20 text-feedback-success rounded text-[10px] font-bold"
                            >
                              Mark Completed
                            </button>
                          )}
                          <button
                            onClick={() => handleExport(po)}
                            className="px-2.5 py-1.5 bg-gray-55 dark:bg-gray-800 text-gray-655 dark:text-gray-300 rounded text-[10px] font-bold inline-flex items-center gap-0.5"
                          >
                            <FiDownload className="w-2.5 h-2.5" /> Export
                          </button>
                          <button
                            onClick={() => setToDelete(po)}
                            className="px-2.5 py-1.5 bg-red-50 dark:bg-red-900/20 text-feedback-error rounded text-[10px] font-bold"
                          >
                            Delete
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
        <DeleteDialog
          order={toDelete}
          onCancel={() => setToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </DashboardLayout>
  );
};

export default Orders;
