import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Toast from '../../components/common/Toast';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../Orders/StatusBadge';
import CancelOrderModal from '../Orders/CancelOrderModal';
import ConfirmDialog from '../../components/common/dialogs/ConfirmDialog';
import {
  FiSearch, FiX, FiPlus, FiTrash2, FiEdit3, FiEye, FiCheckCircle,
  FiXCircle, FiPrinter, FiFilter, FiRefreshCw, FiDollarSign, FiShoppingBag
} from 'react-icons/fi';
import { productService } from '../../services/productService';
import { doctorService } from '../../services/doctorService';
import { institutionService } from '../../services/institutionService';
import { areaService } from '../../services/areaService';
import { teamMemberService } from '../../services/teamMemberService';
import { orderService } from '../../services/orderService';
import { exportToCSV } from '../../utils/exportUtils';

export default function SalesEntry() {
  const navigate = useNavigate();
  const location = useLocation();

  const [toast, setToast] = useState(location.state?.toast || null);
  const [loading, setLoading] = useState(true);

  // Data lists
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [areas, setAreas] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  // Enterprise Filters state
  const [statusFilter, setStatusFilter] = useState('All'); // All, Pending, Completed, Cancelled
  const [doctorFilter, setDoctorFilter] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [teamMemberFilter, setTeamMemberFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Action Modals State
  const [toComplete, setToComplete] = useState(null);
  const [toCancel, setToCancel] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      orderService.getAllOrders(),
      productService.getAllProducts(),
      doctorService.getAllDoctors(),
      institutionService.getAllInstitutions(),
      areaService.getAllAreas(),
      teamMemberService.getAllTeamMembers()
    ])
      .then(([ordersData, prodsData, docsData, instsData, areasData, teamData]) => {
        setSales(ordersData || []);
        setProducts(prodsData || []);
        setDoctors(docsData || []);
        setInstitutions(instsData || []);
        setAreas(areasData || []);
        setTeamMembers(teamData || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading sales processing data:', err);
        setToast({ message: err.message || 'Failed to load sales data.', type: 'error' });
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered sales matching all enterprise filters together
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      // 1. Status Filter
      if (statusFilter !== 'All' && s.status !== statusFilter) return false;

      // 2. Doctor Filter
      if (doctorFilter && String(s.doctorId) !== String(doctorFilter)) return false;

      // 3. Institution Filter
      if (institutionFilter && String(s.institutionId) !== String(institutionFilter)) return false;

      // 4. Area Filter
      if (areaFilter && String(s.areaId) !== String(areaFilter)) return false;

      // 5. Team Member Filter
      if (teamMemberFilter && String(s.teamMemberId) !== String(teamMemberFilter)) return false;

      // 6. Product Filter
      if (productFilter) {
        const hasProduct = (s.items || s.products || []).some(it => String(it.productId) === String(productFilter));
        if (!hasProduct) return false;
      }

      // 7. Date Range Filter
      const poDate = s.poDate || s.orderDate;
      if (startDate && poDate < startDate) return false;
      if (endDate && poDate > endDate) return false;

      // 8. Search Query (PO Number, Doctor, Institution, Area, Team Member)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const poMatch = (s.poNumber || s.orderNumber || '').toLowerCase().includes(q);
        const docMatch = (s.doctorName || '').toLowerCase().includes(q);
        const instMatch = (s.institutionName || '').toLowerCase().includes(q);
        const areaMatch = (s.areaName || '').toLowerCase().includes(q);
        const teamMatch = (s.teamMemberName || '').toLowerCase().includes(q);
        if (!poMatch && !docMatch && !instMatch && !areaMatch && !teamMatch) return false;
      }

      return true;
    });
  }, [
    sales,
    statusFilter,
    doctorFilter,
    institutionFilter,
    areaFilter,
    teamMemberFilter,
    productFilter,
    startDate,
    endDate,
    searchQuery
  ]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage) || 1;
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSales.slice(start, start + itemsPerPage);
  }, [filteredSales, currentPage, itemsPerPage]);

  const resetFilters = () => {
    setStatusFilter('All');
    setDoctorFilter('');
    setInstitutionFilter('');
    setAreaFilter('');
    setTeamMemberFilter('');
    setProductFilter('');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleConfirmComplete = () => {
    if (!toComplete) return;
    orderService.changeStatus(toComplete.id, 'Completed')
      .then(() => {
        setToast({ message: `Sale PO ${toComplete.poNumber} completed successfully. Revenue and Dashboard updated.`, type: 'success' });
        setToComplete(null);
        loadData();
      })
      .catch(err => {
        setToast({ message: err.message || 'Failed to complete sale.', type: 'error' });
      });
  };

  const handleConfirmCancel = (reason) => {
    if (!toCancel) return;
    orderService.changeStatus(toCancel.id, 'Cancelled', reason)
      .then(() => {
        setToast({ message: `Sale PO ${toCancel.poNumber} cancelled successfully.`, type: 'success' });
        setToCancel(null);
        loadData();
      })
      .catch(err => {
        setToast({ message: err.message || 'Failed to cancel sale.', type: 'error' });
      });
  };

  const handleConfirmDelete = () => {
    if (!toDelete) return;
    orderService.deleteOrder(toDelete.id)
      .then(() => {
        setToast({ message: `Order PO ${toDelete.poNumber} deleted successfully.`, type: 'success' });
        setToDelete(null);
        loadData();
      })
      .catch(err => {
        setToast({ message: err.message || 'Failed to delete order.', type: 'error' });
      });
  };

  const handlePrint = (sale) => {
    window.print();
  };

  return (
    <DashboardLayout pageTitle="Sales Processing Center">
      <div className="space-y-6 animate-fade-in pb-12">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* Page Header */}
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Sales Processing Center
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Process customer orders, view status, complete sales, and manage orders.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3 overflow-x-auto">
          {['All', 'Pending', 'Completed', 'Cancelled'].map(st => {
            const count = st === 'All' ? sales.length : sales.filter(s => s.status === st).length;
            const isActive = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <span>{st}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Enterprise Business Filters Panel */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-enterprise p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
              <FiFilter className="w-4 h-4 text-brand-primary" />
              <span>Enterprise Filters</span>
            </div>
            <button
              onClick={resetFilters}
              className="text-[11px] font-bold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <FiRefreshCw className="w-3 h-3" /> Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search PO#, Doctor, Inst..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-brand-primary font-medium"
              />
              <FiSearch className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
            </div>

            {/* Doctor Filter */}
            <select
              value={doctorFilter}
              onChange={(e) => { setDoctorFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium cursor-pointer"
            >
              <option value="">All Doctors</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            {/* Institution Filter */}
            <select
              value={institutionFilter}
              onChange={(e) => { setInstitutionFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium cursor-pointer"
            >
              <option value="">All Institutions</option>
              {institutions.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>

            {/* Area Filter */}
            <select
              value={areaFilter}
              onChange={(e) => { setAreaFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium cursor-pointer"
            >
              <option value="">All Areas</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>

            {/* Team Member Filter */}
            <select
              value={teamMemberFilter}
              onChange={(e) => { setTeamMemberFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium cursor-pointer"
            >
              <option value="">All Team Members</option>
              {teamMembers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            {/* Product Filter */}
            <select
              value={productFilter}
              onChange={(e) => { setProductFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium cursor-pointer"
            >
              <option value="">All Products</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.brandName || p.name}</option>
              ))}
            </select>

            {/* Start Date */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase shrink-0">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium"
              />
            </div>

            {/* End Date */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase shrink-0">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Sales Table Container */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-enterprise shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <FiShoppingBag className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No Sales Orders Found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search criteria or create a new order.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-800 text-[10px] uppercase tracking-wider font-extrabold text-gray-500 dark:text-gray-400">
                    <th className="py-3 px-4">PO Number</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Doctor / Institution</th>
                    <th className="py-3 px-4">Area</th>
                    <th className="py-3 px-4">Team Member</th>
                    <th className="py-3 px-4">Products</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                  {paginatedSales.map(sale => {
                    const docName = doctors.find(d => String(d.id) === String(sale.doctorId))?.name || sale.doctorName || '—';
                    const instName = institutions.find(i => String(i.id) === String(sale.institutionId))?.name || sale.institutionName || '—';
                    const areaName = areas.find(a => String(a.id) === String(sale.areaId))?.name || sale.areaName || '—';
                    const teamName = teamMembers.find(t => String(t.id) === String(sale.teamMemberId))?.name || sale.teamMemberName || '—';

                    const itemsList = sale.items || sale.products || [];
                    const itemsSummary = itemsList.map(it => {
                      const pName = products.find(p => String(p.id) === String(it.productId))?.brandName || it.productName || `Prod #${it.productId}`;
                      const qty = it.quantity || it.qty || 1;
                      return `${pName} (${qty})`;
                    }).join(', ');

                    const isPending = sale.status === 'Pending';
                    const isCompleted = sale.status === 'Completed';
                    const isCancelled = sale.status === 'Cancelled';

                    return (
                      <tr key={sale.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white">
                          {sale.poNumber || sale.orderNumber}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-600 dark:text-gray-300">
                          {sale.poDate || sale.orderDate}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-800 dark:text-gray-200">
                          <div>{docName}</div>
                          {instName !== '—' && (
                            <div className="text-[10px] text-gray-400">{instName}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-600 dark:text-gray-300">
                          {areaName}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-600 dark:text-gray-300">
                          {teamName}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-600 dark:text-gray-300 max-w-[200px] truncate" title={itemsSummary}>
                          {itemsSummary || '—'}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-extrabold text-right text-brand-primary">
                          Rs {Number(sale.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <StatusBadge status={sale.status} />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Pending Actions */}
                            {isPending && (
                              <>
                                <button
                                  onClick={() => navigate(`/orders/${sale.id}/edit`)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
                                  title="Edit Order"
                                >
                                  <FiEdit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setToComplete(sale)}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
                                  title="Complete Sale"
                                >
                                  <FiCheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setToCancel(sale)}
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors"
                                  title="Cancel Sale"
                                >
                                  <FiXCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setToDelete(sale)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                                  title="Delete Order"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {/* Completed Actions */}
                            {isCompleted && (
                              <>
                                <button
                                  onClick={() => navigate(`/orders/${sale.id}`)}
                                  className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                  title="View Order Details"
                                >
                                  <FiEye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handlePrint(sale)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
                                  title="Print Order"
                                >
                                  <FiPrinter className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {/* Cancelled Actions */}
                            {isCancelled && (
                              <button
                                onClick={() => navigate(`/orders/${sale.id}`)}
                                className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                title="View Order Details"
                              >
                                <FiEye className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredSales.length > 0 && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>

        {/* Complete Sale Confirmation Dialog */}
        <ConfirmDialog
          open={Boolean(toComplete)}
          title="Complete Sale"
          message={`Are you sure you want to mark Sale PO ${toComplete?.poNumber} as Completed? This will reflect in financial dashboard revenue, reports, and target metrics.`}
          confirmText="Complete Sale"
          confirmVariant="success"
          onConfirm={handleConfirmComplete}
          onCancel={() => setToComplete(null)}
        />

        {/* Cancel Sale Modal (Mandatory Reason) */}
        <CancelOrderModal
          order={toCancel}
          onConfirm={handleConfirmCancel}
          onCancel={() => setToCancel(null)}
        />

        {/* Delete Order Confirmation Dialog */}
        <ConfirmDialog
          open={Boolean(toDelete)}
          title="Delete Order"
          message={`Are you sure you want to delete Pending Order PO ${toDelete?.poNumber}? This action cannot be undone.`}
          confirmText="Delete Order"
          confirmVariant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setToDelete(null)}
        />
      </div>
    </DashboardLayout>
  );
}
