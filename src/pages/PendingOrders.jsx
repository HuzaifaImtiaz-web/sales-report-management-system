import React, { useState, useMemo } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import {
  FiSearch, FiFilter, FiEye, FiCheckCircle, FiX,
  FiClipboard, FiAlertTriangle,
} from 'react-icons/fi';

/* ─── Static Dummy Data ───────────────────────────────────────────── */
const INITIAL_ORDERS = [
  {
    id: 1,
    poNumber: 'PO-2026-0901',
    poDate: '12 Jul 2026',
    doctor: 'Dr. Ayesha Khan',
    area: 'Lahore Central',
    products: [
      { name: 'Amoxicillin 500mg', qty: 50 },
      { name: 'Paracetamol 650mg', qty: 100 },
    ],
    totalQty: 150,
    status: 'Pending',
    remarks: 'Urgent delivery required before 15 Jul.',
  },
  {
    id: 2,
    poNumber: 'PO-2026-0902',
    poDate: '12 Jul 2026',
    doctor: 'Dr. Hamid Raza',
    area: 'Karachi South',
    products: [
      { name: 'Metformin 850mg', qty: 200 },
      { name: 'Lipitor 10mg', qty: 60 },
    ],
    totalQty: 260,
    status: 'Pending',
    remarks: 'Deliver to clinic annex, not main entrance.',
  },
  {
    id: 3,
    poNumber: 'PO-2026-0903',
    poDate: '11 Jul 2026',
    doctor: 'Dr. Nadia Siddiqui',
    area: 'Islamabad F-10',
    products: [
      { name: 'Ibuprofen 400mg', qty: 80 },
      { name: 'Omeprazole 20mg', qty: 120 },
      { name: 'Cetirizine 10mg', qty: 40 },
    ],
    totalQty: 240,
    status: 'Pending',
    remarks: 'Morning delivery preferred.',
  },
  {
    id: 4,
    poNumber: 'PO-2026-0904',
    poDate: '11 Jul 2026',
    doctor: 'Dr. Farhan Latif',
    area: 'Rawalpindi',
    products: [
      { name: 'Augmentin 625mg', qty: 30 },
      { name: 'Azithromycin 250mg', qty: 60 },
    ],
    totalQty: 90,
    status: 'Pending',
    remarks: '',
  },
  {
    id: 5,
    poNumber: 'PO-2026-0905',
    poDate: '10 Jul 2026',
    doctor: 'Dr. Saima Riaz',
    area: 'Faisalabad',
    products: [
      { name: 'Crestor 10mg', qty: 45 },
      { name: 'Zoloft 50mg', qty: 30 },
    ],
    totalQty: 75,
    status: 'Pending',
    remarks: 'Call before dispatching.',
  },
  {
    id: 6,
    poNumber: 'PO-2026-0906',
    poDate: '10 Jul 2026',
    doctor: 'Dr. Tariq Mehmood',
    area: 'Multan',
    products: [
      { name: 'Panadol Extra', qty: 200 },
      { name: 'Ventolin Inhaler', qty: 10 },
    ],
    totalQty: 210,
    status: 'Pending',
    remarks: '',
  },
  {
    id: 7,
    poNumber: 'PO-2026-0907',
    poDate: '09 Jul 2026',
    doctor: 'Dr. Bilal Aslam',
    area: 'Peshawar',
    products: [
      { name: 'Lasix 40mg', qty: 100 },
      { name: 'Digoxin 0.25mg', qty: 50 },
    ],
    totalQty: 150,
    status: 'Pending',
    remarks: 'New customer – verify address.',
  },
  {
    id: 8,
    poNumber: 'PO-2026-0908',
    poDate: '09 Jul 2026',
    doctor: 'Dr. Hira Ghulam',
    area: 'Lahore DHA',
    products: [
      { name: 'Nexium 40mg', qty: 60 },
      { name: 'Plavix 75mg', qty: 40 },
      { name: 'Atorvastatin 20mg', qty: 80 },
    ],
    totalQty: 180,
    status: 'Pending',
    remarks: '',
  },
];

const UNIQUE_DOCTORS = [...new Set(INITIAL_ORDERS.map((o) => o.doctor))];
const UNIQUE_AREAS   = [...new Set(INITIAL_ORDERS.map((o) => o.area))];

/* ─── Status Badge ─────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  if (status === 'Completed') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 dark:bg-green-900/30 text-feedback-success border border-green-100 dark:border-green-800/50">
        <span className="w-1.5 h-1.5 rounded-full bg-feedback-success inline-block" />
        Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 border border-amber-100 dark:border-amber-800/50">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse" />
      Pending
    </span>
  );
};

/* ─── Confirmation Dialog ──────────────────────────────────────────── */
const ConfirmDialog = ({ order, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-md animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
          <FiAlertTriangle className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Confirm Action</h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">{order.poNumber}</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Are you sure you want to mark this Purchase Order as{' '}
          <span className="font-bold text-feedback-success">Completed</span>?
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
          This will update the status for <span className="font-semibold text-gray-600 dark:text-gray-400">{order.doctor}</span> — {order.area}.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-enterprise">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-150"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-xs font-bold text-white bg-feedback-success rounded-lg hover:bg-green-600 shadow-sm hover:shadow-md transition-all duration-150 flex items-center gap-1.5"
        >
          <FiCheckCircle className="w-3.5 h-3.5" />
          Confirm
        </button>
      </div>
    </div>
  </div>
);

/* ─── Details Modal ─────────────────────────────────────────────────── */
const DetailsModal = ({ order, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-lg animate-slide-up overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-brand-navy to-[#162040]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <FiClipboard className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">{order.poNumber}</h2>
            <p className="text-[10px] text-white/50 font-medium mt-0.5">{order.poDate}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-150"
          aria-label="Close modal"
        >
          <FiX className="w-4 h-4 text-white/80" />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Doctor', value: order.doctor },
            { label: 'Area', value: order.area },
            { label: 'PO Date', value: order.poDate },
            { label: 'Status', value: null },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</p>
              {label === 'Status' ? (
                <div className="mt-1.5"><StatusBadge status={order.status} /></div>
              ) : (
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-1">{value}</p>
              )}
            </div>
          ))}
        </div>

        {/* Products */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Products & Quantities</p>
          <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Product</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {order.products.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-gray-700 dark:text-gray-300">{p.name}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-gray-900 dark:text-white">{p.qty}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50/70 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-2.5 font-extrabold text-gray-800 dark:text-gray-200 text-[11px] uppercase tracking-wide">Total</td>
                  <td className="px-4 py-2.5 text-right font-extrabold text-brand-primary">{order.totalQty}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Remarks */}
        {order.remarks && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Remarks</p>
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 rounded-xl px-4 py-3 text-xs text-amber-800 dark:text-amber-500 font-medium leading-relaxed">
              {order.remarks}
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

/* ─── Main Page ─────────────────────────────────────────────────────── */
const PendingOrders = () => {
  const [orders, setOrders]             = useState(INITIAL_ORDERS);
  const [search, setSearch]             = useState('');
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterArea, setFilterArea]     = useState('');
  const [viewOrder, setViewOrder]       = useState(null);
  const [confirmOrder, setConfirmOrder] = useState(null);

  /* Filtered list */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter((o) => {
      const matchSearch =
        !q ||
        o.doctor.toLowerCase().includes(q) ||
        o.area.toLowerCase().includes(q) ||
        o.poNumber.toLowerCase().includes(q);
      const matchDoctor = !filterDoctor || o.doctor === filterDoctor;
      const matchArea   = !filterArea   || o.area   === filterArea;
      return matchSearch && matchDoctor && matchArea;
    });
  }, [orders, search, filterDoctor, filterArea]);

  /* Mark as completed */
  const handleConfirm = () => {
    setOrders((prev) =>
      prev.map((o) => o.id === confirmOrder.id ? { ...o, status: 'Completed' } : o)
    );
    setConfirmOrder(null);
  };

  const pendingCount   = orders.filter((o) => o.status === 'Pending').length;
  const completedCount = orders.filter((o) => o.status === 'Completed').length;

  return (
    <DashboardLayout pageTitle="Pending Orders">
      <div className="space-y-6 animate-fade-in">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Pending Purchase Orders
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-1">
              Manage and track all outstanding purchase orders
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 text-amber-700 dark:text-amber-500 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {pendingCount} Pending
            </span>
            {completedCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800/50 text-feedback-success text-[11px] font-bold">
                <FiCheckCircle className="w-3 h-3" />
                {completedCount} Completed
              </span>
            )}
          </div>
        </div>

        {/* ── Search & Filters ── */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by PO number, doctor, or area…"
                className="w-full pl-9 pr-4 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all duration-150 placeholder:text-gray-400"
              />
            </div>

            {/* Filter by Doctor */}
            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <select
                value={filterDoctor}
                onChange={(e) => setFilterDoctor(e.target.value)}
                className="pl-8 pr-8 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all duration-150 appearance-none cursor-pointer min-w-[160px]"
              >
                <option value="">All Doctors</option>
                {UNIQUE_DOCTORS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Filter by Area */}
            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <select
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                className="pl-8 pr-8 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all duration-150 appearance-none cursor-pointer min-w-[150px]"
              >
                <option value="">All Areas</option>
                {UNIQUE_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Clear Filters */}
            {(search || filterDoctor || filterArea) && (
              <button
                onClick={() => { setSearch(''); setFilterDoctor(''); setFilterArea(''); }}
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
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Orders List</h3>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                Showing {filtered.length} of {orders.length} records
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs" aria-label="Pending purchase orders">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  {['PO Number', 'PO Date', 'Doctor Name', 'Area', 'Products', 'Total Qty', 'Status', 'Actions'].map((h) => (
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
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FiClipboard className="w-8 h-8 text-gray-200" />
                        <p className="text-xs font-bold text-gray-400">No orders match your filters</p>
                        <p className="text-[10px] text-gray-300 font-medium">Try adjusting your search or filter criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors duration-100 group"
                    >
                      {/* PO Number */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-[10px] font-extrabold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                          {order.poNumber}
                        </span>
                      </td>
                      {/* PO Date */}
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{order.poDate}</td>
                      {/* Doctor */}
                      <td className="px-5 py-4 font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">{order.doctor}</td>
                      {/* Area */}
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">{order.area}</td>
                      {/* Products */}
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400 max-w-[180px]">
                        <span className="block truncate" title={order.products.map((p) => p.name).join(', ')}>
                          {order.products.map((p) => p.name).join(', ')}
                        </span>
                        <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">{order.products.length} product{order.products.length > 1 ? 's' : ''}</span>
                      </td>
                      {/* Total Qty */}
                      <td className="px-5 py-4 font-extrabold text-gray-900 dark:text-white whitespace-nowrap">{order.totalQty}</td>
                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={order.status} />
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewOrder(order)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold
                              text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50
                              hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-sm
                              transition-all duration-150"
                          >
                            <FiEye className="w-3 h-3" /> View Details
                          </button>
                          {order.status === 'Pending' && (
                            <button
                              onClick={() => setConfirmOrder(order)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold
                                text-feedback-success bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800/50
                                hover:bg-green-100 dark:hover:bg-green-900/50 hover:border-green-200 dark:hover:border-green-700 hover:shadow-sm
                                transition-all duration-150"
                            >
                              <FiCheckCircle className="w-3 h-3" /> Mark as Completed
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
        </div>
      </div>

      {/* ── Modals ── */}
      {viewOrder    && <DetailsModal order={viewOrder}    onClose={() => setViewOrder(null)} />}
      {confirmOrder && <ConfirmDialog order={confirmOrder} onCancel={() => setConfirmOrder(null)} onConfirm={handleConfirm} />}
    </DashboardLayout>
  );
};

export default PendingOrders;
