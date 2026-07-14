import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import Toast from '../components/Toast';
import {
  FiSearch, FiEye, FiDownload, FiCalendar, FiUser,
  FiMapPin, FiBriefcase, FiShoppingBag, FiTag,
  FiFilter, FiRefreshCw, FiChevronLeft, FiChevronRight,
  FiCheckCircle, FiClock, FiFileText, FiTrendingUp, FiX,
  FiCheck
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

/* ─── Static Dummy Data ─────────────────────────────────────────── */
const PRODUCTS = [
  { id: 1, name: 'Amoxicillin 500mg', unit: 'Vials', rate: 450 },
  { id: 2, name: 'Paracetamol 650mg', unit: 'Vials', rate: 120 },
  { id: 3, name: 'Metformin 850mg', unit: 'Vials', rate: 380 },
  { id: 4, name: 'Lipitor 10mg', unit: 'Vials', rate: 950 },
  { id: 5, name: 'Ibuprofen 400mg', unit: 'Vials', rate: 90 },
  { id: 6, name: 'Omeprazole 20mg', unit: 'Vials', rate: 520 },
  { id: 7, name: 'Augmentin 625mg', unit: 'Vials', rate: 1100 },
  { id: 8, name: 'Azithromycin 250mg', unit: 'Vials', rate: 670 },
  { id: 9, name: 'Ventolin Inhaler', unit: 'Vials', rate: 850 },
  { id: 10, name: 'Crestor 10mg', unit: 'Vials', rate: 1350 }
];

const DOCTORS = [
  { id: 1, name: 'Dr. Ayesha Khan', hospital: 'Mayo Hospital' },
  { id: 2, name: 'Dr. Hamid Raza', hospital: 'Jinnah Hospital' },
  { id: 3, name: 'Dr. Nadia Siddiqui', hospital: 'Shifa International' },
  { id: 4, name: 'Dr. Farhan Latif', hospital: 'Holy Family Hospital' },
  { id: 5, name: 'Dr. Saima Riaz', hospital: 'FIC Faisalabad' },
  { id: 6, name: 'Dr. Tariq Mehmood', hospital: 'Nishtar Hospital' },
  { id: 7, name: 'Dr. Bilal Aslam', hospital: 'Lady Reading Hospital' }
];

const AREAS = [
  'Lahore Gulberg',
  'Karachi Clifton',
  'Islamabad F-10',
  'Faisalabad Civil Lines',
  'Peshawar University Road',
  'Multan Cantt',
  'Sialkot Saddar'
];

const TEAM_MEMBERS = [
  { id: 1, name: 'Muhammad Ali', designation: 'Medical Representative' },
  { id: 2, name: 'Sarah Ahmed', designation: 'Senior Rep' },
  { id: 3, name: 'Usman Ghani', designation: 'Area Sales Manager' },
  { id: 4, name: 'Zainab Bibi', designation: 'Medical Representative' },
  { id: 5, name: 'Hamza Khan', designation: 'Medical Representative' }
];

const INITIAL_REPORTS_DATA = [
  {
    id: 1,
    poNumber: 'PO-2026-001',
    poDate: '2026-01-10',
    doctorId: 1,
    area: 'Lahore Gulberg',
    teamMemberId: 1,
    status: 'Completed',
    remarks: 'Urgent delivery requested.',
    items: [
      { productId: 1, quantity: 200, rate: 450 },
      { productId: 3, quantity: 150, rate: 380 }
    ]
  },
  {
    id: 2,
    poNumber: 'PO-2026-002',
    poDate: '2026-01-25',
    doctorId: 2,
    area: 'Karachi Clifton',
    teamMemberId: 2,
    status: 'Completed',
    remarks: 'Routine restocking order.',
    items: [
      { productId: 6, quantity: 300, rate: 520 },
      { productId: 10, quantity: 80, rate: 1350 }
    ]
  },
  {
    id: 3,
    poNumber: 'PO-2026-003',
    poDate: '2026-02-12',
    doctorId: 3,
    area: 'Islamabad F-10',
    teamMemberId: 3,
    status: 'Completed',
    remarks: '',
    items: [
      { productId: 7, quantity: 120, rate: 1100 },
      { productId: 2, quantity: 400, rate: 120 }
    ]
  },
  {
    id: 4,
    poNumber: 'PO-2026-004',
    poDate: '2026-02-28',
    doctorId: 4,
    area: 'Faisalabad Civil Lines',
    teamMemberId: 4,
    status: 'Pending',
    remarks: 'Payment terms pending approval.',
    items: [
      { productId: 8, quantity: 250, rate: 670 }
    ]
  },
  {
    id: 5,
    poNumber: 'PO-2026-005',
    poDate: '2026-03-15',
    doctorId: 5,
    area: 'Peshawar University Road',
    teamMemberId: 5,
    status: 'Completed',
    remarks: '',
    items: [
      { productId: 9, quantity: 150, rate: 850 },
      { productId: 5, quantity: 500, rate: 90 }
    ]
  },
  {
    id: 6,
    poNumber: 'PO-2026-006',
    poDate: '2026-03-29',
    doctorId: 6,
    area: 'Multan Cantt',
    teamMemberId: 1,
    status: 'Completed',
    remarks: 'First order from this hospital.',
    items: [
      { productId: 1, quantity: 100, rate: 450 },
      { productId: 4, quantity: 120, rate: 950 }
    ]
  },
  {
    id: 7,
    poNumber: 'PO-2026-007',
    poDate: '2026-04-05',
    doctorId: 7,
    area: 'Sialkot Saddar',
    teamMemberId: 2,
    status: 'Completed',
    remarks: '',
    items: [
      { productId: 2, quantity: 600, rate: 120 },
      { productId: 6, quantity: 200, rate: 520 }
    ]
  },
  {
    id: 8,
    poNumber: 'PO-2026-008',
    poDate: '2026-04-20',
    doctorId: 1,
    area: 'Lahore Gulberg',
    teamMemberId: 3,
    status: 'Pending',
    remarks: 'Awaiting stock clearance.',
    items: [
      { productId: 7, quantity: 180, rate: 1100 }
    ]
  },
  {
    id: 9,
    poNumber: 'PO-2026-009',
    poDate: '2026-05-11',
    doctorId: 2,
    area: 'Karachi Clifton',
    teamMemberId: 4,
    status: 'Completed',
    remarks: '',
    items: [
      { productId: 3, quantity: 250, rate: 380 },
      { productId: 10, quantity: 110, rate: 1350 }
    ]
  },
  {
    id: 10,
    poNumber: 'PO-2026-050',
    poDate: '2026-05-27',
    doctorId: 3,
    area: 'Islamabad F-10',
    teamMemberId: 5,
    status: 'Completed',
    remarks: '',
    items: [
      { productId: 5, quantity: 800, rate: 90 },
      { productId: 8, quantity: 150, rate: 670 }
    ]
  },
  {
    id: 11,
    poNumber: 'PO-2026-051',
    poDate: '2026-06-12',
    doctorId: 4,
    area: 'Faisalabad Civil Lines',
    teamMemberId: 1,
    status: 'Completed',
    remarks: 'Special discount applied.',
    items: [
      { productId: 6, quantity: 220, rate: 490 }
    ]
  },
  {
    id: 12,
    poNumber: 'PO-2026-052',
    poDate: '2026-06-25',
    doctorId: 5,
    area: 'Peshawar University Road',
    teamMemberId: 2,
    status: 'Completed',
    remarks: '',
    items: [
      { productId: 1, quantity: 300, rate: 450 },
      { productId: 7, quantity: 90, rate: 1100 }
    ]
  },
  {
    id: 13,
    poNumber: 'PO-2026-053',
    poDate: '2026-07-02',
    doctorId: 6,
    area: 'Multan Cantt',
    teamMemberId: 3,
    status: 'Pending',
    remarks: '',
    items: [
      { productId: 2, quantity: 350, rate: 120 }
    ]
  },
  {
    id: 14,
    poNumber: 'PO-2026-054',
    poDate: '2026-07-14',
    doctorId: 7,
    area: 'Sialkot Saddar',
    teamMemberId: 4,
    status: 'Completed',
    remarks: 'Direct delivery at clinic.',
    items: [
      { productId: 10, quantity: 150, rate: 1350 },
      { productId: 9, quantity: 80, rate: 850 }
    ]
  }
];

// Helper to get detailed summary for a PO
const getPOSummary = (po) => {
  const doc = DOCTORS.find((d) => d.id === Number(po.doctorId)) || {};
  const tm = TEAM_MEMBERS.find((e) => e.id === Number(po.teamMemberId)) || {};

  let totalQty = 0;
  let totalVal = 0;
  const itemsDetailed = (po.items || []).map((item) => {
    const prod = PRODUCTS.find((p) => p.id === Number(item.productId)) || {};
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate || prod.rate) || 0;
    const itemTotal = qty * rate;
    totalQty += qty;
    totalVal += itemTotal;
    return {
      ...item,
      productName: prod.name || 'Unknown Product',
      unit: prod.unit || 'Vials',
      rate,
      total: itemTotal
    };
  });

  return {
    doctorName: doc.name || 'Unknown Doctor',
    teamMemberName: tm.name || 'Unknown Member',
    totalProductsCount: (po.items || []).length,
    totalQuantity: totalQty,
    totalValue: totalVal,
    itemsDetailed
  };
};

/* ─── Status Badge Component ────────────────────────────────────── */
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
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-600 border border-amber-100 dark:border-amber-800/50">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
      Pending
    </span>
  );
};

/* ─── Reports Details Modal Component ───────────────────────────── */
const ReportDetailsModal = ({ po, onClose }) => {
  const summary = useMemo(() => getPOSummary(po), [po]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-2xl animate-slide-up overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-brand-navy to-[#162040]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <FiShoppingBag className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Report Purchase Order Details</h2>
              <p className="text-[10px] text-white/50 font-medium mt-0.5">{po.poNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <FiX className="w-4 h-4 text-white/80" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-100/50 dark:border-gray-800/50">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-550">PO Number</p>
              <p className="text-xs font-mono font-bold text-gray-900 dark:text-white mt-1">{po.poNumber}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-100/50 dark:border-gray-800/50">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-550">PO Date</p>
              <p className="text-xs font-semibold text-gray-850 dark:text-gray-250 mt-1">{po.poDate}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-100/50 dark:border-gray-800/50">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-550">Area</p>
              <p className="text-xs font-semibold text-gray-850 dark:text-gray-250 mt-1">{po.area}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-100/50 dark:border-gray-800/50">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-550">Status</p>
              <div className="mt-1.5"><StatusBadge status={po.status} /></div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-100/50 dark:border-gray-800/50 col-span-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-550">Doctor</p>
              <p className="text-xs font-bold text-gray-850 dark:text-gray-200 mt-1">{summary.doctorName}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-100/50 dark:border-gray-800/50 col-span-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-550">Team Member (MR)</p>
              <p className="text-xs font-bold text-gray-850 dark:text-gray-200 mt-1">{summary.teamMemberName}</p>
            </div>
          </div>

          {/* Product Items Table */}
          <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-550">Products Summary</p>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-left bg-gray-50/20 dark:bg-gray-800/10">
                  <th className="px-4 py-2.5 text-gray-400 uppercase font-bold text-[9px] tracking-wider">Product Name</th>
                  <th className="px-4 py-2.5 text-right text-gray-400 uppercase font-bold text-[9px] tracking-wider">Quantity</th>
                  <th className="px-4 py-2.5 text-center text-gray-400 uppercase font-bold text-[9px] tracking-wider">Unit</th>
                  <th className="px-4 py-2.5 text-right text-gray-400 uppercase font-bold text-[9px] tracking-wider">Rate</th>
                  <th className="px-4 py-2.5 text-right text-gray-400 uppercase font-bold text-[9px] tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {summary.itemsDetailed.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/40 dark:hover:bg-gray-800/10">
                    <td className="px-4 py-3 font-semibold text-gray-850 dark:text-gray-200">{item.productName}</td>
                    <td className="px-4 py-3 text-right font-extrabold text-gray-800 dark:text-gray-200">{item.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{item.unit}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Rs {item.rate.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-extrabold text-brand-primary">Rs {item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total Footer */}
            <div className="bg-gray-50/50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800 px-4 py-3 flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-550 dark:text-gray-400">Grand Totals</span>
              <div className="flex gap-6">
                <span className="text-xs font-extrabold text-gray-850 dark:text-gray-200">
                  {summary.totalQuantity.toLocaleString()} vials
                </span>
                <span className="text-xs font-extrabold text-brand-primary">
                  Rs {summary.totalValue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Remarks */}
          {po.remarks && (
            <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-550 border-b border-gray-100 dark:border-gray-800 pb-2 mb-2">Special Remarks</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed italic">
                &ldquo;{po.remarks}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-brand-navy rounded-lg hover:bg-[#162040] shadow-sm transition-all duration-150"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Pagination Component ──────────────────────────────────────── */
const Pagination = ({ currentPage, totalPages, onPageChange, totalRecords, startIndex, endIndex }) => {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10">
      <p className="text-[11px] font-medium text-gray-400 dark:text-gray-550">
        Showing <span className="font-semibold text-gray-700 dark:text-gray-300">{startIndex + 1}</span> to{' '}
        <span className="font-semibold text-gray-700 dark:text-gray-300">{Math.min(endIndex, totalRecords)}</span> of{' '}
        <span className="font-semibold text-gray-700 dark:text-gray-300">{totalRecords}</span> reports
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-655 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
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
                : 'border border-gray-200 dark:border-gray-700 text-gray-655 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-655 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
        >
          Next
        </button>
      </div>
    </div>
  );
};

/* ─── Skeleton Rows Component ───────────────────────────────────── */
const SkeletonRows = () => {
  return (
    <>
      {[1, 2, 3, 4, 5].map((idx) => (
        <tr key={idx} className="border-b border-gray-55 dark:border-gray-800/50">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((col) => (
            <td key={col} className="px-6 py-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-750 rounded animate-pulse w-full max-w-[80px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

/* ─── Main Reports Component ────────────────────────────────────── */
const Reports = () => {
  // Master reports data
  const [reportsData] = useState(INITIAL_REPORTS_DATA);

  // Autocomplete & Search State
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const autocompleteRef = useRef(null);

  // Close autocomplete on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Autocomplete Live Search
  const handleSearchChange = (value) => {
    setTempFilters(prev => ({ ...prev, search: value }));
    if (value.trim().length > 0) {
      const q = value.toLowerCase();
      
      const matchDocs = DOCTORS.filter(d => d.name.toLowerCase().includes(q)).map(d => ({
        label: d.name,
        type: 'Doctor',
        field: 'doctorId',
        value: d.id
      }));

      const matchTMs = TEAM_MEMBERS.filter(tm => tm.name.toLowerCase().includes(q)).map(tm => ({
        label: tm.name,
        type: 'Team Member',
        field: 'teamMemberId',
        value: tm.id
      }));

      const matchProds = PRODUCTS.filter(p => p.name.toLowerCase().includes(q)).map(p => ({
        label: p.name,
        type: 'Product',
        field: 'productId',
        value: p.id
      }));

      const matchAreas = AREAS.filter(a => a.toLowerCase().includes(q)).map(a => ({
        label: a,
        type: 'Area',
        field: 'area',
        value: a
      }));

      const all = [...matchDocs, ...matchTMs, ...matchProds, ...matchAreas];
      setSuggestions(all.slice(0, 8));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (s) => {
    setTempFilters(prev => ({
      ...prev,
      search: s.label,
      [s.field]: s.value
    }));
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Filters State (Temporary UI values)
  const [tempFilters, setTempFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    doctorId: '',
    area: '',
    teamMemberId: '',
    productId: '',
    status: ''
  });

  // Filters State (Active parameters used for rendering)
  const [activeFilters, setActiveFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    doctorId: '',
    area: '',
    teamMemberId: '',
    productId: '',
    status: ''
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [exporting, setExporting] = useState(null); // 'excel' | 'pdf' | 'ppt' | null
  const [selectedPO, setSelectedPO] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Sync temp state with active filters initially
  const handleApplyFilters = () => {
    setLoading(true);
    setTimeout(() => {
      setActiveFilters({ ...tempFilters });
      setCurrentPage(1);
      setLoading(false);
      setToast({ message: 'Filters applied successfully.', type: 'success' });
    }, 450);
  };

  const handleResetFilters = () => {
    setLoading(true);
    setTimeout(() => {
      const reset = {
        search: '',
        startDate: '',
        endDate: '',
        doctorId: '',
        area: '',
        teamMemberId: '',
        productId: '',
        status: ''
      };
      setTempFilters(reset);
      setActiveFilters(reset);
      setSuggestions([]);
      setShowSuggestions(false);
      setCurrentPage(1);
      setLoading(false);
      setToast({ message: 'Filters reset to default.', type: 'success' });
    }, 400);
  };

  // Live filter mapping
  const filteredPOs = useMemo(() => {
    const q = activeFilters.search.toLowerCase().trim();
    return reportsData
      .map((po) => ({
        ...po,
        summary: getPOSummary(po)
      }))
      .filter((po) => {
        const matchSearch =
          !q ||
          po.poNumber.toLowerCase().includes(q) ||
          po.summary.doctorName.toLowerCase().includes(q) ||
          po.area.toLowerCase().includes(q) ||
          po.summary.teamMemberName.toLowerCase().includes(q) ||
          po.summary.itemsDetailed.some(item => 
            item.productName.toLowerCase().includes(q)
          );

        // Date Range
        let matchDate = true;
        if (activeFilters.startDate) {
          matchDate = matchDate && po.poDate >= activeFilters.startDate;
        }
        if (activeFilters.endDate) {
          matchDate = matchDate && po.poDate <= activeFilters.endDate;
        }

        // Doctor
        const matchDoc = !activeFilters.doctorId || Number(po.doctorId) === Number(activeFilters.doctorId);

        // Area
        const matchArea = !activeFilters.area || po.area === activeFilters.area;

        // Team Member
        const matchTeam = !activeFilters.teamMemberId || Number(po.teamMemberId) === Number(activeFilters.teamMemberId);

        // Status
        const matchStatus = !activeFilters.status || po.status === activeFilters.status;

        // Product selection
        const matchProduct =
          !activeFilters.productId ||
          po.items.some((item) => Number(item.productId) === Number(activeFilters.productId));

        return matchSearch && matchDate && matchDoc && matchArea && matchTeam && matchStatus && matchProduct;
      });
  }, [reportsData, activeFilters]);

  // Pagination calculation
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPOs = useMemo(() => {
    return filteredPOs.slice(startIndex, endIndex);
  }, [filteredPOs, startIndex, endIndex]);

  const totalPages = Math.ceil(filteredPOs.length / itemsPerPage);

  // Summary Metrics calculations
  const summaryMetrics = useMemo(() => {
    let vials = 0;
    let amount = 0;
    let pending = 0;
    let completed = 0;

    filteredPOs.forEach((po) => {
      vials += po.summary.totalQuantity;
      amount += po.summary.totalValue;
      if (po.status === 'Completed') {
        completed += 1;
      } else {
        pending += 1;
      }
    });

    return {
      totalPOs: filteredPOs.length,
      totalVials: vials,
      totalAmount: amount,
      pendingOrders: pending,
      completedOrders: completed
    };
  }, [filteredPOs]);

  /* ─── Chart Data Aggregations ──────────────────────────────────── */
  // 1. Monthly Sales & Vials Aggregation
  const monthlyChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    const monthlyMap = months.reduce((acc, m) => {
      acc[m] = { month: m, Sales: 0, Vials: 0 };
      return acc;
    }, {});

    filteredPOs.forEach((po) => {
      const date = new Date(po.poDate);
      const mName = months[date.getMonth()];
      if (monthlyMap[mName]) {
        monthlyMap[mName].Sales += po.summary.totalValue;
        monthlyMap[mName].Vials += po.summary.totalQuantity;
      }
    });

    return Object.values(monthlyMap);
  }, [filteredPOs]);

  // 2. Product-wise Sales
  const productChartData = useMemo(() => {
    const prodMap = {};
    filteredPOs.forEach((po) => {
      po.summary.itemsDetailed.forEach((item) => {
        if (!prodMap[item.productName]) {
          prodMap[item.productName] = { name: item.productName, Sales: 0, Vials: 0 };
        }
        prodMap[item.productName].Sales += item.total;
        prodMap[item.productName].Vials += item.quantity;
      });
    });
    return Object.values(prodMap).sort((a, b) => b.Sales - a.Sales).slice(0, 5);
  }, [filteredPOs]);

  // 3. Area-wise Sales
  const areaChartData = useMemo(() => {
    const areaMap = {};
    filteredPOs.forEach((po) => {
      if (!areaMap[po.area]) {
        areaMap[po.area] = { name: po.area, value: 0 };
      }
      areaMap[po.area].value += po.summary.totalValue;
    });
    return Object.values(areaMap).sort((a, b) => b.value - a.value);
  }, [filteredPOs]);

  // 4. Team Member Performance
  const teamChartData = useMemo(() => {
    const teamMap = {};
    filteredPOs.forEach((po) => {
      const name = po.summary.teamMemberName;
      if (!teamMap[name]) {
        teamMap[name] = { name, Sales: 0 };
      }
      teamMap[name].Sales += po.summary.totalValue;
    });
    return Object.values(teamMap).sort((a, b) => b.Sales - a.Sales);
  }, [filteredPOs]);

  // Colors for pie charts
  const COLORS = ['#0F172A', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  // Export handlers
  const handleExport = (type) => {
    setExporting(type);
    setTimeout(() => {
      setExporting(null);
      setToast({
        message: `Report exported as ${type.toUpperCase()} file successfully.`,
        type: 'success'
      });
    }, 1200);
  };

  return (
    <DashboardLayout pageTitle="Reports">
      <div className="space-y-6 animate-fade-in pb-10">
        
        {/* ── Page Title ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Reports Panel</h1>
            <p className="text-xs text-gray-400 dark:text-gray-550 font-medium mt-1">View, filter, analyze, and export sales reports.</p>
          </div>
          
          {/* Export Options */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/export?search=${encodeURIComponent(activeFilters.search)}&startDate=${encodeURIComponent(activeFilters.startDate)}&endDate=${encodeURIComponent(activeFilters.endDate)}&doctor=${encodeURIComponent(activeFilters.doctorId)}&area=${encodeURIComponent(activeFilters.area)}&teamMember=${encodeURIComponent(activeFilters.teamMemberId)}&product=${encodeURIComponent(activeFilters.productId)}&status=${encodeURIComponent(activeFilters.status)}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-white bg-brand-primary hover:bg-brand-primaryDark rounded-lg transition-colors shadow-sm"
            >
              <FiDownload className="w-3.5 h-3.5" />
              Export Center
            </Link>
            <button
              disabled={exporting !== null}
              onClick={() => handleExport('excel')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-sm disabled:opacity-50"
            >
              <FiFileText className="w-3.5 h-3.5 text-green-600" />
              {exporting === 'excel' ? 'Exporting...' : 'Export Excel'}
            </button>
            <button
              disabled={exporting !== null}
              onClick={() => handleExport('pdf')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-sm disabled:opacity-50"
            >
              <FiFileText className="w-3.5 h-3.5 text-red-500" />
              {exporting === 'pdf' ? 'Exporting...' : 'Export PDF'}
            </button>
            <button
              disabled={exporting !== null}
              onClick={() => handleExport('ppt')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-sm disabled:opacity-50"
            >
              <FiTrendingUp className="w-3.5 h-3.5 text-amber-500" />
              {exporting === 'ppt' ? 'Exporting...' : 'Export PPT'}
            </button>
          </div>
        </div>

        {/* ── Multiple Filter Panel ── */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
            <FiFilter className="w-4 h-4 text-brand-primary" />
            <span className="text-xs font-bold text-gray-850 dark:text-gray-200 uppercase tracking-widest">Filter Controls</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Autocomplete Search input */}
            <div className="flex flex-col relative" ref={autocompleteRef}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Smart Search (Autocomplete)</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Type Doctor, Area, MR, Product..."
                  value={tempFilters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => {
                    if (tempFilters.search.trim().length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-gray-750 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all placeholder:text-gray-400"
                />
              </div>
              
              {/* Autocomplete suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-[100%] left-0 right-0 z-50 mt-1 bg-white dark:bg-[#1e293b] border border-gray-150 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-700">
                  {suggestions.map((s, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectSuggestion(s)}
                      className="px-3.5 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-200 flex justify-between items-center transition-colors duration-150"
                    >
                      <span className="truncate pr-2">{s.label}</span>
                      <span className="text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-550 flex-shrink-0">
                        {s.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date range picker */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Start Date</label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="date"
                  value={tempFilters.startDate}
                  onChange={(e) => setTempFilters({ ...tempFilters, startDate: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-gray-750 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                />
              </div>
            </div>

            {/* End Date */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">End Date</label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="date"
                  value={tempFilters.endDate}
                  onChange={(e) => setTempFilters({ ...tempFilters, endDate: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-gray-750 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                />
              </div>
            </div>

            {/* Doctor */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Doctor</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <select
                  value={tempFilters.doctorId}
                  onChange={(e) => setTempFilters({ ...tempFilters, doctorId: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-gray-750 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-brand-primary/20 transition-all"
                >
                  <option value="">All Doctors</option>
                  {DOCTORS.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Area */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Area</label>
              <div className="relative">
                <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <select
                  value={tempFilters.area}
                  onChange={(e) => setTempFilters({ ...tempFilters, area: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-gray-750 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-brand-primary/20 transition-all"
                >
                  <option value="">All Areas</option>
                  {AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Team Member */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Team Member</label>
              <div className="relative">
                <FiBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <select
                  value={tempFilters.teamMemberId}
                  onChange={(e) => setTempFilters({ ...tempFilters, teamMemberId: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-gray-750 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-brand-primary/20 transition-all"
                >
                  <option value="">All Team Members</option>
                  {TEAM_MEMBERS.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Product</label>
              <div className="relative">
                <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <select
                  value={tempFilters.productId}
                  onChange={(e) => setTempFilters({ ...tempFilters, productId: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-gray-750 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-brand-primary/20 transition-all"
                >
                  <option value="">All Products</option>
                  {PRODUCTS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Status</label>
              <div className="relative">
                <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <select
                  value={tempFilters.status}
                  onChange={(e) => setTempFilters({ ...tempFilters, status: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-gray-750 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-brand-primary/20 transition-all"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-55/60 dark:border-gray-800/50">
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-gray-655 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-150 dark:hover:bg-gray-750 transition-colors shadow-sm"
            >
              <FiRefreshCw className="w-3.5 h-3.5" /> Reset Filters
            </button>
            <button
              onClick={handleApplyFilters}
              className="inline-flex items-center gap-1 px-5 py-2 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark transition-colors shadow-md"
            >
              <FiCheck className="w-3.5 h-3.5" /> Apply Filters
            </button>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Purchase Orders */}
          <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100/50 dark:border-slate-800">
              <FiShoppingBag className="w-5 h-5 text-brand-navy" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total POs</p>
              <p className="text-lg font-extrabold text-gray-900 dark:text-white mt-0.5">{summaryMetrics.totalPOs}</p>
            </div>
          </div>

          {/* Card 2: Total Vials Sold */}
          <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-955/20 flex items-center justify-center border border-sky-100 dark:border-sky-900/30">
              <FiTrendingUp className="w-5 h-5 text-sky-500" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Vials Sold</p>
              <p className="text-lg font-extrabold text-gray-900 dark:text-white mt-0.5">{summaryMetrics.totalVials.toLocaleString()}</p>
            </div>
          </div>

          {/* Card 3: Total Sales Amount */}
          <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft p-4 flex items-center gap-4 col-span-2 lg:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-955/20 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30">
              <span className="text-emerald-500 font-extrabold text-sm">Rs</span>
            </div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Sales Amount</p>
              <p className="text-lg font-extrabold text-brand-primary mt-0.5">Rs {summaryMetrics.totalAmount.toLocaleString()}</p>
            </div>
          </div>

          {/* Card 4: Pending Orders */}
          <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-955/20 flex items-center justify-center border border-amber-100 dark:border-amber-900/30">
              <FiClock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Pending Orders</p>
              <p className="text-lg font-extrabold text-amber-600 mt-0.5">{summaryMetrics.pendingOrders}</p>
            </div>
          </div>

          {/* Card 5: Completed Orders */}
          <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-955/20 flex items-center justify-center border border-green-100 dark:border-green-900/30">
              <FiCheckCircle className="w-5 h-5 text-feedback-success" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Completed Orders</p>
              <p className="text-lg font-extrabold text-feedback-success mt-0.5">{summaryMetrics.completedOrders}</p>
            </div>
          </div>
        </div>

        {/* ── Interactive Charts Section ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Chart 1: Monthly Sales */}
          <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise p-4 shadow-soft">
            <h3 className="text-xs font-bold text-gray-850 dark:text-gray-200 uppercase tracking-widest mb-3">Monthly Sales (Rs)</h3>
            <div className="w-full h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(value) => [value != null ? `Rs ${Number(value).toLocaleString()}` : 'Rs 0', 'Sales']} />
                  <Bar dataKey="Sales" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Monthly Vials Sold */}
          <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise p-4 shadow-soft">
            <h3 className="text-xs font-bold text-gray-850 dark:text-gray-200 uppercase tracking-widest mb-3">Monthly Vials Sold</h3>
            <div className="w-full h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyChartData}>
                  <defs>
                    <linearGradient id="colorVials" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(value) => [value != null ? Number(value).toLocaleString() : '0', 'Vials']} />
                  <Area type="monotone" dataKey="Vials" stroke="#10B981" fillOpacity={1} fill="url(#colorVials)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Product-wise Sales */}
          <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise p-4 shadow-soft">
            <h3 className="text-xs font-bold text-gray-850 dark:text-gray-200 uppercase tracking-widest mb-3">Top Products (Sales)</h3>
            <div className="w-full h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={9} tickLine={false} width={80} />
                  <Tooltip formatter={(value) => [value != null ? `Rs ${Number(value).toLocaleString()}` : 'Rs 0', 'Sales']} />
                  <Bar dataKey="Sales" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Area-wise Sales */}
          <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise p-4 shadow-soft">
            <h3 className="text-xs font-bold text-gray-850 dark:text-gray-200 uppercase tracking-widest mb-3">Area-wise Sales</h3>
            <div className="w-full h-[230px] flex items-center justify-center">
              <div className="w-[60%] h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={areaChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {areaChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value != null ? `Rs ${Number(value).toLocaleString()}` : 'Rs 0', 'Sales']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-[40%] text-[10px] space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                {areaChartData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-gray-600 dark:text-gray-400 font-bold truncate max-w-[80px]" title={item.name}>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart 5: Team Member Performance */}
          <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise p-4 shadow-soft md:col-span-2">
            <h3 className="text-xs font-bold text-gray-850 dark:text-gray-200 uppercase tracking-widest mb-3">Team Member Sales Performance (Rs)</h3>
            <div className="w-full h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(value) => [value != null ? `Rs ${Number(value).toLocaleString()}` : 'Rs 0', 'Sales']} />
                  <Bar dataKey="Sales" fill="#0F172A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* ── Reports Table & Record Entries ── */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Sales Record Log</h3>
              <p className="text-[10px] text-gray-400 dark:text-gray-550 font-medium mt-0.5">
                {loading ? 'Processing filter request...' : `Found ${filteredPOs.length} reports`}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-auto max-h-[500px] relative scrollbar-thin">
            <table className="w-full text-xs min-w-[1000px] table-auto" aria-label="Reports Table Log">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 text-left">
                  {[
                    'PO Number',
                    'PO Date',
                    'Doctor',
                    'Area',
                    'Team Member',
                    'Product Count',
                    'Total Vials',
                    'Total Amount',
                    'Status',
                    'Actions'
                  ].map((h) => (
                    <th key={h} className="sticky top-0 bg-gray-55 dark:bg-[#1e293b] backdrop-blur-sm z-10 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-6 py-4 whitespace-nowrap border-b border-gray-100 dark:border-gray-800 shadow-sm">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {loading ? (
                  <SkeletonRows />
                ) : paginatedPOs.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-400 dark:text-gray-550 font-bold bg-white dark:bg-[#0f172a]">
                      No report records match the selected active filters.
                    </td>
                  </tr>
                ) : (
                  paginatedPOs.map((po) => (
                    <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors duration-150 bg-white dark:bg-[#0f172a]">
                      <td className="px-6 py-4 font-mono font-bold text-gray-955 dark:text-white">{po.poNumber}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-450 font-semibold">{po.poDate}</td>
                      <td className="px-6 py-4 text-gray-900 dark:text-white font-bold">{po.summary.doctorName}</td>
                      <td className="px-6 py-4 text-gray-750 dark:text-gray-300 font-medium">{po.area}</td>
                      <td className="px-6 py-4 text-gray-750 dark:text-gray-250 font-medium">{po.summary.teamMemberName}</td>
                      <td className="px-6 py-4 text-center text-gray-800 dark:text-gray-250 font-extrabold">{po.summary.totalProductsCount}</td>
                      <td className="px-6 py-4 text-right text-gray-850 dark:text-gray-100 font-extrabold">{po.summary.totalQuantity.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-extrabold text-brand-primary">Rs {po.summary.totalValue.toLocaleString()}</td>
                      <td className="px-6 py-4"><StatusBadge status={po.status} /></td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedPO(po)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-brand-primary bg-sky-50 dark:bg-sky-900/30 border border-sky-100 dark:border-sky-800/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 hover:border-sky-200 transition-all duration-150"
                          >
                            <FiEye className="w-3 h-3" /> View
                          </button>
                          <button
                            onClick={() => handleExport('pdf')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-gray-700 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all duration-150"
                          >
                            <FiDownload className="w-3 h-3" /> Export
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
              totalRecords={filteredPOs.length}
              startIndex={startIndex}
              endIndex={endIndex}
            />
          )}
        </div>
      </div>

      {/* ── View Details Modal ── */}
      {selectedPO && (
        <ReportDetailsModal
          po={selectedPO}
          onClose={() => setSelectedPO(null)}
        />
      )}

      {/* ── Action Feedback Toast ── */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[100] max-w-sm">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </DashboardLayout>
  );
};

export default Reports;
