import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Toast from '../../components/common/Toast';
import Pagination from '../../components/common/Pagination';
import {
  FiSearch, FiDownload, FiFileText, FiCheckCircle,
  FiAlertCircle, FiSettings, FiRefreshCw, FiChevronLeft,
  FiChevronRight, FiCheck, FiX, FiFilter, FiCalendar,
  FiUser, FiMapPin, FiBriefcase, FiLayers, FiActivity,
  FiTrendingUp, FiShoppingBag, FiLayers as FiGroupIcon
} from 'react-icons/fi';

/* ─── Static Mock Data ───────────────────────────────────────────── */
const PRODUCTS = [
  { id: 1, name: 'Amoxicillin 500mg', rate: 450, group: 'Antibiotics' },
  { id: 2, name: 'Paracetamol 650mg', rate: 120, group: 'Analgesics' },
  { id: 3, name: 'Metformin 850mg', rate: 380, group: 'Anti-Diabetic' },
  { id: 4, name: 'Lipitor 10mg', rate: 950, group: 'Cardiovascular' },
  { id: 5, name: 'Ibuprofen 400mg', rate: 90, group: 'Analgesics' },
  { id: 6, name: 'Omeprazole 20mg', rate: 520, group: 'Gastroenterology' },
  { id: 7, name: 'Augmentin 625mg', rate: 1100, group: 'Antibiotics' },
  { id: 8, name: 'Azithromycin 250mg', rate: 670, group: 'Antibiotics' },
  { id: 9, name: 'Ventolin Inhaler', rate: 850, group: 'Respiratory' },
  { id: 10, name: 'Crestor 10mg', rate: 1350, group: 'Cardiovascular' }
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
  'Lahore Central',
  'Karachi South',
  'Islamabad F-10',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar'
];

const TEAM_MEMBERS = [
  { id: 1, name: 'Ahmed Shah', designation: 'Medical Representative' },
  { id: 2, name: 'Zainab Fatima', designation: 'Territory Manager' },
  { id: 3, name: 'Usman Ali', designation: 'Area Sales Manager' },
  { id: 4, name: 'Mariam Khan', designation: 'Medical Representative' },
  { id: 5, name: 'Bilal Siddiqui', designation: 'Medical Representative' },
  { id: 6, name: 'Ayesha Malik', designation: 'Medical Representative' },
  { id: 7, name: 'Haris Rehman', designation: 'Territory Manager' }
];

const GROUPS = [
  'Cardiovascular',
  'Antibiotics',
  'Analgesics',
  'Anti-Diabetic',
  'Gastroenterology',
  'Respiratory'
];

const MOCK_ORDERS = [
  { id: 1, poNumber: 'PO-2026-001', date: '2026-01-10', doctorId: 1, area: 'Lahore Central', teamMemberId: 1, group: 'Antibiotics', items: [{ productId: 1, qty: 150 }, { productId: 7, qty: 50 }], status: 'Completed', year: '2026' },
  { id: 2, poNumber: 'PO-2026-002', date: '2026-02-14', doctorId: 2, area: 'Karachi South', teamMemberId: 2, group: 'Cardiovascular', items: [{ productId: 4, qty: 300 }, { productId: 10, qty: 100 }], status: 'Completed', year: '2026' },
  { id: 3, poNumber: 'PO-2026-003', date: '2026-03-22', doctorId: 3, area: 'Islamabad F-10', teamMemberId: 3, group: 'Analgesics', items: [{ productId: 2, qty: 500 }, { productId: 5, qty: 250 }], status: 'Pending', year: '2026' },
  { id: 4, poNumber: 'PO-2026-004', date: '2026-04-05', doctorId: 4, area: 'Rawalpindi', teamMemberId: 4, group: 'Anti-Diabetic', items: [{ productId: 3, qty: 400 }], status: 'Completed', year: '2026' },
  { id: 5, poNumber: 'PO-2026-005', date: '2026-05-18', doctorId: 5, area: 'Faisalabad', teamMemberId: 5, group: 'Gastroenterology', items: [{ productId: 6, qty: 180 }], status: 'Pending', year: '2026' },
  { id: 6, poNumber: 'PO-2026-006', date: '2026-06-29', doctorId: 6, area: 'Multan', teamMemberId: 6, group: 'Respiratory', items: [{ productId: 9, qty: 220 }], status: 'Completed', year: '2026' },
  { id: 7, poNumber: 'PO-2025-050', date: '2025-08-12', doctorId: 7, area: 'Peshawar', teamMemberId: 7, group: 'Antibiotics', items: [{ productId: 8, qty: 150 }], status: 'Completed', year: '2025' },
  { id: 8, poNumber: 'PO-2025-051', date: '2025-11-20', doctorId: 1, area: 'Lahore Central', teamMemberId: 1, group: 'Analgesics', items: [{ productId: 2, qty: 300 }], status: 'Completed', year: '2025' },
  { id: 9, poNumber: 'PO-2026-007', date: '2026-07-02', doctorId: 3, area: 'Islamabad F-10', teamMemberId: 3, group: 'Antibiotics', items: [{ productId: 1, qty: 100 }, { productId: 8, qty: 80 }], status: 'Pending', year: '2026' },
  { id: 10, poNumber: 'PO-2026-008', date: '2026-07-05', doctorId: 5, area: 'Faisalabad', teamMemberId: 7, group: 'Cardiovascular', items: [{ productId: 4, qty: 150 }], status: 'Completed', year: '2026' }
];

const INITIAL_EXPORT_HISTORY = [
  { id: 1, date: '2026-07-14 11:20 AM', fileName: 'Sales_Report_Q2_2026.xlsx', format: 'Excel (.xlsx)' },
  { id: 2, date: '2026-07-13 04:45 PM', fileName: 'Himmel_Audit_Summary_Jul2026.pdf', format: 'PDF' },
  { id: 3, date: '2026-07-12 09:15 AM', fileName: 'Sales_Presentation_Board_v3.pptx', format: 'PowerPoint (.pptx)' }
];

/* ─── Calculations & Helper Functions ────────────────────────────── */
const getOrderTotals = (order) => {
  const doc = DOCTORS.find((d) => d.id === Number(order.doctorId)) || {};
  const tm = TEAM_MEMBERS.find((e) => e.id === Number(order.teamMemberId)) || {};

  let totalVials = 0;
  let totalVal = 0;
  (order.items || []).forEach((item) => {
    const prod = PRODUCTS.find((p) => p.id === Number(item.productId)) || {};
    const qty = Number(item.qty) || 0;
    const rate = Number(prod.rate) || 0;
    totalVials += qty;
    totalVal += qty * rate;
  });

  return {
    doctorName: doc.name || 'Unknown Doctor',
    institutionName: doc.hospital || 'Unknown Hospital',
    teamMemberName: tm.name || 'Unknown Member',
    productCount: (order.items || []).length,
    totalVials,
    totalAmount: totalVal
  };
};

/* ─── Status Badge ───────────────────────────────────────────────── */
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

const ExportCenter = () => {
  const [searchParams] = useSearchParams();

  // Read pre-populated filters from URL (passed by SalesEntry / Reports)
  const initFilters = () => ({
    year:       searchParams.get('year')       || '',
    startDate:  searchParams.get('startDate')  || '',
    endDate:    searchParams.get('endDate')    || '',
    product:    searchParams.get('product')    || '',
    doctor:     searchParams.get('doctor')     || '',
    institution:searchParams.get('institution')|| '',
    area:       searchParams.get('area')       || '',
    teamMember: searchParams.get('teamMember') || '',
    group:      searchParams.get('group')      || '',
    status:     searchParams.get('status')     || '',
    poNumber:   searchParams.get('poNumber')   || '',
  });

  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [globalSearch, setGlobalSearch] = useState(searchParams.get('search') || '');

  const [tempFilters, setTempFilters] = useState(initFilters);
  const [activeFilters, setActiveFilters] = useState(initFilters);

  // Auto-apply any URL-passed filters on mount
  useEffect(() => {
    const hasParams = [...searchParams.keys()].length > 0;
    if (hasParams) {
      setToast({ message: 'Filters pre-populated from your previous module.', type: 'success' });
    }
  }, []); // eslint-disable-line

  // Settings & Options States
  const [exportFormat, setExportFormat] = useState('excel');
  const [settings, setSettings] = useState({
    exportAll: false,
    exportOnlyFiltered: true,
    includeLogo: true,
    includeSummary: true,
    includeCharts: true
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [history, setHistory] = useState(INITIAL_EXPORT_HISTORY);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Export History Pagination
  const [historyPage, setHistoryPage] = useState(1);
  const [historyItemsPerPage, setHistoryItemsPerPage] = useState(10);

  // Filter application
  const handleApplyFilters = () => {
    setLoading(true);
    setTimeout(() => {
      setActiveFilters({ ...tempFilters });
      setGlobalSearch(searchQuery);
      setCurrentPage(1);
      setLoading(false);
      setToast({ message: 'Filters applied successfully.', type: 'success' });
    }, 450);
  };

  const handleResetFilters = () => {
    setLoading(true);
    setTimeout(() => {
      const reset = {
        year: '',
        startDate: '',
        endDate: '',
        product: '',
        doctor: '',
        institution: '',
        area: '',
        teamMember: '',
        group: '',
        status: '',
        poNumber: ''
      };
      setTempFilters(reset);
      setActiveFilters(reset);
      setSearchQuery('');
      setGlobalSearch('');
      setCurrentPage(1);
      setLoading(false);
      setToast({ message: 'Filters reset to default.', type: 'success' });
    }, 400);
  };

  // Live filter mapping
  const filteredOrders = useMemo(() => {
    const q = globalSearch.toLowerCase().trim();
    return MOCK_ORDERS.filter((order) => {
      const info = getOrderTotals(order);
      
      // Search Box Filter
      if (q) {
        const matchesSearch =
          order.poNumber.toLowerCase().includes(q) ||
          info.doctorName.toLowerCase().includes(q) ||
          order.area.toLowerCase().includes(q) ||
          info.teamMemberName.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Year Filter
      if (activeFilters.year && order.year !== activeFilters.year) return false;

      // PO Number Filter
      if (activeFilters.poNumber && !order.poNumber.toLowerCase().includes(activeFilters.poNumber.toLowerCase())) return false;

      // Status Filter
      if (activeFilters.status && order.status !== activeFilters.status) return false;

      // Area Filter
      if (activeFilters.area && order.area !== activeFilters.area) return false;

      // Doctor Filter
      if (activeFilters.doctor && order.doctorId !== Number(activeFilters.doctor)) return false;

      // Institution Filter
      if (activeFilters.institution && info.institutionName !== activeFilters.institution) return false;

      // Team Member Filter
      if (activeFilters.teamMember && order.teamMemberId !== Number(activeFilters.teamMember)) return false;

      // Group Filter
      if (activeFilters.group && order.group !== activeFilters.group) return false;

      // Product Filter
      if (activeFilters.product) {
        const hasProduct = order.items.some(it => it.productId === Number(activeFilters.product));
        if (!hasProduct) return false;
      }

      // Date Range Filter
      if (activeFilters.startDate && order.date < activeFilters.startDate) return false;
      if (activeFilters.endDate && order.date > activeFilters.endDate) return false;

      return true;
    });
  }, [globalSearch, activeFilters]);

  // Summaries based on filtered or all orders
  const summary = useMemo(() => {
    const targetList = settings.exportAll ? MOCK_ORDERS : filteredOrders;
    
    let totalVials = 0;
    let totalSales = 0;
    let pendingCount = 0;
    let completedCount = 0;

    targetList.forEach((order) => {
      const totals = getOrderTotals(order);
      totalVials += totals.totalVials;
      totalSales += totals.totalAmount;
      if (order.status === 'Completed') completedCount++;
      else pendingCount++;
    });

    return {
      totalOrders: targetList.length,
      totalVials,
      totalSales,
      pendingOrders: pendingCount,
      completedOrders: completedCount
    };
  }, [filteredOrders, settings.exportAll]);

  // Pagination Calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, startIndex, endIndex, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [globalSearch, activeFilters]);

  // History Pagination Calculations
  const historyTotalPages = Math.ceil(history.length / historyItemsPerPage);
  const historyStartIndex = (historyPage - 1) * historyItemsPerPage;
  const historyEndIndex = historyStartIndex + historyItemsPerPage;
  const paginatedHistory = useMemo(() => {
    return history.slice(historyStartIndex, historyEndIndex);
  }, [history, historyStartIndex, historyEndIndex, historyItemsPerPage]);

  // Trigger export flow
  const handleExportData = () => {
    if (filteredOrders.length === 0 && !settings.exportAll) {
      setToast({ message: 'No records available to export.', type: 'error' });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const ext = exportFormat === 'excel' ? 'xlsx' : exportFormat === 'pdf' ? 'pdf' : 'pptx';
            const formatName = exportFormat === 'excel' ? 'Excel (.xlsx)' : exportFormat === 'pdf' ? 'PDF' : 'PowerPoint (.pptx)';
            const newFile = `Himmel_Export_${new Date().toISOString().split('T')[0]}_${Math.floor(1000 + Math.random() * 9000)}.${ext}`;
            
            // Add to Export History list
            setHistory((prevHistory) => [
              {
                id: Date.now(),
                date: new Date().toLocaleString(),
                fileName: newFile,
                format: formatName
              },
              ...prevHistory
            ]);

            setIsExporting(false);
            setToast({
              message: `Data exported successfully as ${newFile}!`,
              type: 'success'
            });
          }, 400);
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  return (
    <DashboardLayout pageTitle="Export Center">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto space-y-6 pb-10">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
              Export Center
            </h1>
            <p className="text-xs text-gray-450 dark:text-gray-550 font-medium mt-1">
              Filter and export sales data.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search PO, Doctor, Area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold text-white bg-brand-primary hover:bg-brand-primaryDark rounded-lg transition-all shadow-soft"
            >
              <FiDownload className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
            </button>
          </div>
        </div>

        {/* FILTERS PANEL */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-soft p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
            <FiFilter className="w-4 h-4 text-brand-primary" />
            <span className="text-xs font-bold text-gray-850 dark:text-gray-200 uppercase tracking-widest">Filter Configurations</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Business Year */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Business Year</label>
              <select
                value={tempFilters.year}
                onChange={(e) => setTempFilters({ ...tempFilters, year: e.target.value })}
                className="w-full px-3 py-2 text-xs font-medium text-gray-750 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-150 dark:border-gray-700 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-brand-primary/20"
              >
                <option value="">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>

            {/* Date Range - Start */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Start Date</label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
                <input
                  type="date"
                  value={tempFilters.startDate}
                  onChange={(e) => setTempFilters({ ...tempFilters, startDate: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium text-gray-750 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-150 dark:border-gray-700 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
            </div>

            {/* Date Range - End */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">End Date</label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
                <input
                  type="date"
                  value={tempFilters.endDate}
                  onChange={(e) => setTempFilters({ ...tempFilters, endDate: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium text-gray-750 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-150 dark:border-gray-700 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
            </div>

            {/* Product */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Product</label>
              <select
                value={tempFilters.product}
                onChange={(e) => setTempFilters({ ...tempFilters, product: e.target.value })}
                className="w-full px-3 py-2 text-xs font-medium text-gray-750 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-150 dark:border-gray-700 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-brand-primary/20"
              >
                <option value="">All Products</option>
                {PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {/* Doctor */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Doctor</label>
              <select
                value={tempFilters.doctor}
                onChange={(e) => setTempFilters({ ...tempFilters, doctor: e.target.value })}
                className="w-full px-3 py-2 text-xs font-medium text-gray-750 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-150 dark:border-gray-700 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-brand-primary/20"
              >
                <option value="">All Doctors</option>
                {DOCTORS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            {/* Institution */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Institution</label>
              <select
                value={tempFilters.institution}
                onChange={(e) => setTempFilters({ ...tempFilters, institution: e.target.value })}
                className="w-full px-3 py-2 text-xs font-medium text-gray-750 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-150 dark:border-gray-700 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-brand-primary/20"
              >
                <option value="">All Institutions</option>
                {Array.from(new Set(DOCTORS.map(d => d.hospital))).map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Area */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Area</label>
              <select
                value={tempFilters.area}
                onChange={(e) => setTempFilters({ ...tempFilters, area: e.target.value })}
                className="w-full px-3 py-2 text-xs font-medium text-gray-750 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-150 dark:border-gray-700 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-brand-primary/20"
              >
                <option value="">All Areas</option>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Team Member */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Team Member</label>
              <select
                value={tempFilters.teamMember}
                onChange={(e) => setTempFilters({ ...tempFilters, teamMember: e.target.value })}
                className="w-full px-3 py-2 text-xs font-medium text-gray-750 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-150 dark:border-gray-700 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-brand-primary/20"
              >
                <option value="">All Team Members</option>
                {TEAM_MEMBERS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            {/* Group */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Group</label>
              <select
                value={tempFilters.group}
                onChange={(e) => setTempFilters({ ...tempFilters, group: e.target.value })}
                className="w-full px-3 py-2 text-xs font-medium text-gray-750 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-150 dark:border-gray-700 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-brand-primary/20"
              >
                <option value="">All Groups</option>
                {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* PO Status */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">PO Status</label>
              <select
                value={tempFilters.status}
                onChange={(e) => setTempFilters({ ...tempFilters, status: e.target.value })}
                className="w-full px-3 py-2 text-xs font-medium text-gray-750 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-150 dark:border-gray-700 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-brand-primary/20"
              >
                <option value="">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            {/* PO Number */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">PO Number</label>
              <input
                type="text"
                placeholder="Search PO Number..."
                value={tempFilters.poNumber}
                onChange={(e) => setTempFilters({ ...tempFilters, poNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs font-medium text-gray-750 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-150 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 border border-gray-200 dark:border-gray-750 hover:bg-gray-150/40 dark:hover:bg-gray-800/40 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-450 transition-colors"
            >
              Reset Filters
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-5 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Total Orders */}
          <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise p-5 shadow-soft flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center shrink-0">
              <FiShoppingBag className="w-4.5 h-4.5 text-brand-primary" />
            </div>
            <div>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Total Orders</p>
              <p className="text-base font-extrabold text-gray-900 dark:text-white mt-0.5">{summary.totalOrders}</p>
            </div>
          </div>

          {/* Total Vials */}
          <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise p-5 shadow-soft flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center shrink-0">
              <FiActivity className="w-4.5 h-4.5 text-purple-500" />
            </div>
            <div>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Total Vials</p>
              <p className="text-base font-extrabold text-gray-900 dark:text-white mt-0.5">{summary.totalVials.toLocaleString()}</p>
            </div>
          </div>

          {/* Total Sales */}
          <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise p-5 shadow-soft flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center shrink-0">
              <FiTrendingUp className="w-4.5 h-4.5 text-feedback-success" />
            </div>
            <div>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Total Sales</p>
              <p className="text-base font-extrabold text-feedback-success mt-0.5">Rs {summary.totalSales.toLocaleString()}</p>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise p-5 shadow-soft flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
              <FiRefreshCw className="w-4.5 h-4.5 text-amber-500" />
            </div>
            <div>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Pending Orders</p>
              <p className="text-base font-extrabold text-amber-500 mt-0.5">{summary.pendingOrders}</p>
            </div>
          </div>

          {/* Completed Orders */}
          <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise p-5 shadow-soft flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
              <FiCheckCircle className="w-4.5 h-4.5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Completed Orders</p>
              <p className="text-base font-extrabold text-emerald-500 mt-0.5">{summary.completedOrders}</p>
            </div>
          </div>
        </div>

        {/* LIVE PREVIEW TABLE */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Live Export Data Preview</h3>
            <p className="text-[10px] text-gray-400 dark:text-gray-550 font-semibold mt-0.5">Showing records configured under filtered criteria</p>
          </div>

          <div className="overflow-x-auto relative">
            <table className="w-full text-xs text-left min-w-[900px] table-auto">
              <thead>
                <tr className="bg-gray-55 dark:bg-gray-800/50 border-b border-gray-150 dark:border-gray-800 text-left">
                  <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">PO Number</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Institution</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Area</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Team Member</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">Product Count</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">Total Vials</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">Total Amount</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {loading ? (
                  /* Loading Skeleton Rows */
                  [1, 2, 3].map((n) => (
                    <tr key={n}>
                      <td colSpan={10} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-full" />
                      </td>
                    </tr>
                  ))
                ) : filteredOrders.length === 0 ? (
                  /* Empty State */
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-gray-400 dark:text-gray-550 font-bold uppercase tracking-wider">
                      <div className="flex flex-col items-center gap-2">
                        <FiAlertCircle className="w-8 h-8 text-gray-300 dark:text-gray-700" />
                        <span>No records match the applied filters.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => {
                    const info = getOrderTotals(order);
                    return (
                      <tr key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                        <td className="px-5 py-3.5 font-bold font-mono text-gray-850 dark:text-white">{order.poNumber}</td>
                        <td className="px-5 py-3.5 font-semibold text-gray-700 dark:text-gray-300">{order.date}</td>
                        <td className="px-5 py-3.5 font-bold text-gray-800 dark:text-gray-200">{info.doctorName}</td>
                        <td className="px-5 py-3.5 font-bold text-gray-800 dark:text-gray-200">{info.institutionName}</td>
                        <td className="px-5 py-3.5 font-semibold text-gray-700 dark:text-gray-300">{order.area}</td>
                        <td className="px-5 py-3.5 font-semibold text-gray-700 dark:text-gray-300">{info.teamMemberName}</td>
                        <td className="px-5 py-3.5 font-extrabold text-right text-gray-800 dark:text-gray-200">{info.productCount}</td>
                        <td className="px-5 py-3.5 font-extrabold text-right text-gray-850 dark:text-white">{info.totalVials.toLocaleString()}</td>
                        <td className="px-5 py-3.5 font-extrabold text-right text-brand-primary">Rs {info.totalAmount.toLocaleString()}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={order.status} /></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredOrders.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalRecords={filteredOrders.length}
              startIndex={startIndex}
              endIndex={endIndex}
              pageSize={itemsPerPage}
              onPageSizeChange={setItemsPerPage}
            />
          )}
        </div>

        {/* BOTTOM OPTIONS & HISTORY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* EXPORT OPTIONS & SETTINGS */}
          <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-soft p-5 space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
              <FiSettings className="w-4 h-4 text-brand-primary" />
              <span className="text-xs font-bold text-gray-850 dark:text-gray-200 uppercase tracking-widest">Export Settings & Formats</span>
            </div>

            {/* FORMAT CHOOSER */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">File Output Format</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setExportFormat('excel')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    exportFormat === 'excel'
                      ? 'border-brand-primary bg-sky-50/15 dark:bg-brand-primary/10 text-brand-primary shadow-sm font-bold'
                      : 'border-gray-150 dark:border-gray-750 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <FiFileText className="w-6 h-6 text-green-500" />
                  <span className="text-[10px] uppercase tracking-wider">Excel (.xlsx)</span>
                </button>

                <button
                  onClick={() => setExportFormat('pdf')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    exportFormat === 'pdf'
                      ? 'border-brand-primary bg-sky-50/15 dark:bg-brand-primary/10 text-brand-primary shadow-sm font-bold'
                      : 'border-gray-150 dark:border-gray-750 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <FiFileText className="w-6 h-6 text-red-500" />
                  <span className="text-[10px] uppercase tracking-wider">PDF File</span>
                </button>

                <button
                  onClick={() => setExportFormat('ppt')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    exportFormat === 'ppt'
                      ? 'border-brand-primary bg-sky-50/15 dark:bg-brand-primary/10 text-brand-primary shadow-sm font-bold'
                      : 'border-gray-150 dark:border-gray-750 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <FiTrendingUp className="w-6 h-6 text-amber-500" />
                  <span className="text-[10px] uppercase tracking-wider">PowerPoint (.pptx)</span>
                </button>
              </div>
            </div>

            {/* SETTINGS CHECKBOXES */}
            <div className="space-y-3 pt-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Export Settings</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={settings.exportAll}
                    onChange={(e) => setSettings({ ...settings, exportAll: e.target.checked, exportOnlyFiltered: !e.target.checked })}
                    className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20 w-3.5 h-3.5"
                  />
                  Export All Records
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={settings.exportOnlyFiltered}
                    onChange={(e) => setSettings({ ...settings, exportOnlyFiltered: e.target.checked, exportAll: !e.target.checked })}
                    className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20 w-3.5 h-3.5"
                  />
                  Export Only Filtered Records
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={settings.includeLogo}
                    onChange={(e) => setSettings({ ...settings, includeLogo: e.target.checked })}
                    className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20 w-3.5 h-3.5"
                  />
                  Include Company Logo
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={settings.includeSummary}
                    onChange={(e) => setSettings({ ...settings, includeSummary: e.target.checked })}
                    className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20 w-3.5 h-3.5"
                  />
                  Include Summary
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={settings.includeCharts}
                    onChange={(e) => setSettings({ ...settings, includeCharts: e.target.checked })}
                    className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20 w-3.5 h-3.5"
                  />
                  Include Charts
                </label>
              </div>
            </div>

            {/* ACTION TRIGGER BUTTON */}
            <div className="pt-2">
              <button
                onClick={handleExportData}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-brand-primary hover:bg-brand-primaryDark text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-soft"
              >
                <FiDownload className="w-4 h-4 animate-bounce" />
                <span>{isExporting ? `Generating Export (${exportProgress}%)` : 'Generate Export'}</span>
              </button>
            </div>
          </div>

          {/* EXPORT HISTORY */}
          <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-soft p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800 mb-4">
                <FiRefreshCw className="w-4 h-4 text-brand-primary" />
                <span className="text-xs font-bold text-gray-850 dark:text-gray-200 uppercase tracking-widest">Recent Export History Log</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left table-auto">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/10">
                      <th className="px-4 py-2.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-2.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider">File Name</th>
                      <th className="px-4 py-2.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider">Format</th>
                      <th className="px-4 py-2.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/40">
                    {paginatedHistory.map((h) => (
                      <tr key={h.id} className="hover:bg-gray-55/40 dark:hover:bg-gray-800/10 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gray-400 dark:text-gray-555 whitespace-nowrap">{h.date}</td>
                        <td className="px-4 py-3 font-bold text-gray-800 dark:text-gray-200 truncate max-w-[200px]" title={h.fileName}>{h.fileName}</td>
                        <td className="px-4 py-3 font-semibold text-gray-650 dark:text-gray-400 whitespace-nowrap">{h.format}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              setToast({
                                message: `Re-downloading ${h.fileName} from file cache...`,
                                type: 'success'
                              });
                            }}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg border border-gray-150 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-brand-primary transition-colors"
                            title="Download again"
                          >
                            <FiDownload className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3">
                <Pagination
                  currentPage={historyPage}
                  totalPages={historyTotalPages}
                  onPageChange={setHistoryPage}
                  totalRecords={history.length}
                  startIndex={historyStartIndex}
                  endIndex={historyEndIndex}
                  pageSize={historyItemsPerPage}
                  onPageSizeChange={setHistoryItemsPerPage}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Export cache persists on current session</span>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default ExportCenter;
