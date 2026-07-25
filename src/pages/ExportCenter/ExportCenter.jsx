import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Toast from '../../components/common/Toast';
import Pagination from '../../components/common/Pagination';
import {
  FiSearch, FiDownload, FiFileText, FiCheckCircle,
  FiAlertCircle, FiSettings, FiRefreshCw, FiFilter, FiCalendar,
  FiUser, FiMapPin, FiBriefcase, FiLayers, FiActivity,
  FiTrendingUp, FiShoppingBag, FiFolder, FiExternalLink, FiEye
} from 'react-icons/fi';

const REPORT_TYPES = [
  { id: 'Master Export', label: 'Master Export (All Modules)', icon: FiBriefcase },
  { id: 'Dashboard', label: 'Dashboard Summary', icon: FiTrendingUp },
  { id: 'Products', label: 'Products Master', icon: FiShoppingBag },
  { id: 'Doctors', label: 'Doctors Directory', icon: FiUser },
  { id: 'Institutions', label: 'Institutions Master', icon: FiBriefcase },
  { id: 'Areas', label: 'Territories & Areas', icon: FiMapPin },
  { id: 'Team Members', label: 'Team Members', icon: FiUser },
  { id: 'Groups', label: 'Product Groups', icon: FiLayers },
  { id: 'Orders', label: 'Customer Orders', icon: FiFileText },
  { id: 'Sales', label: 'Sales & Invoicing', icon: FiActivity },
  { id: 'Targets', label: 'Annual Targets', icon: FiTrendingUp },
  { id: 'Audit Trail', label: 'System Audit Log', icon: FiFileText },
  { id: 'Reports', label: 'Analytics Reports', icon: FiActivity }
];

const EXPORT_FORMATS = [
  { id: 'excel', label: 'Excel (.xlsx)', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  { id: 'pdf', label: 'PDF (.pdf)', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/30' },
  { id: 'pptx', label: 'PowerPoint (.pptx)', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' }
];

const ExportCenter = () => {
  const [searchParams] = useSearchParams();
  const [toast, setToast] = useState(null);

  // Core Export Controls State
  const [reportType, setReportType] = useState(searchParams.get('reportType') || 'Products');
  const [exportFormat, setExportFormat] = useState('excel');

  // Filter States
  const [filters, setFilters] = useState({
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    doctor: searchParams.get('doctor') || '',
    institution: searchParams.get('institution') || '',
    area: searchParams.get('area') || '',
    teamMember: searchParams.get('teamMember') || '',
    group: searchParams.get('group') || '',
    product: searchParams.get('product') || '',
    status: searchParams.get('status') || '',
    search: searchParams.get('search') || ''
  });

  // Data dropdown lists
  const [doctorsList, setDoctorsList] = useState([]);
  const [institutionsList, setInstitutionsList] = useState([]);
  const [areasList, setAreasList] = useState([]);
  const [teamMembersList, setTeamMembersList] = useState([]);
  const [groupsList, setGroupsList] = useState([]);
  const [productsList, setProductsList] = useState([]);

  // Live Preview Data State
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Export History State
  const [exportHistory, setExportHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Pagination for Preview Table
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Pagination for History Table
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);

  // Helper to safely extract arrays from IPC responses
  const extractArray = (res) => {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && Array.isArray(res.logs)) return res.logs;
    return [];
  };

  // Load dropdown lists from IPC or services
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        if (window.api) {
          const [dRes, iRes, aRes, tRes, gRes, pRes] = await Promise.all([
            window.api.doctors ? window.api.doctors.getAll() : [],
            window.api.institutions ? window.api.institutions.getAll() : [],
            window.api.areas ? window.api.areas.getAll() : [],
            window.api.teamMembers ? window.api.teamMembers.getAll() : [],
            window.api.categories ? window.api.categories.getAll() : [],
            window.api.products ? window.api.products.getAll() : []
          ]);
          setDoctorsList(extractArray(dRes));
          setInstitutionsList(extractArray(iRes));
          setAreasList(extractArray(aRes));
          setTeamMembersList(extractArray(tRes));
          setGroupsList(extractArray(gRes));
          setProductsList(extractArray(pRes));
        }
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    };

    loadDropdownData();
    loadExportHistory();
  }, []);

  // Fetch preview data whenever reportType or active filters change
  const fetchPreview = async () => {
    setPreviewLoading(true);
    try {
      if (window.api && window.api.export) {
        const res = await window.api.export.getPreviewData({ reportType, filters });
        const data = res?.data || res;
        setPreviewData(data);
      } else {
        // Fallback mock preview
        setPreviewData({
          title: `${reportType} Master Report`,
          columns: [
            { header: 'ID', key: 'id', width: 10, type: 'number' },
            { header: 'Name', key: 'name', width: 30, type: 'text' },
            { header: 'Status', key: 'status', width: 15, type: 'text' }
          ],
          rows: [
            { id: 1, name: 'Sample Item A', status: 'Active' },
            { id: 2, name: 'Sample Item B', status: 'Active' }
          ],
          summary: { totalRecords: 2, totalAmount: 0 }
        });
      }
    } catch (err) {
      setToast({ message: err.message || 'Failed to load preview data.', type: 'error' });
    } finally {
      setPreviewLoading(false);
      setCurrentPage(1);
    }
  };

  const loadExportHistory = async () => {
    setHistoryLoading(true);
    try {
      if (window.api && window.api.export) {
        const res = await window.api.export.getHistory();
        const historyArray = extractArray(res);
        setExportHistory(historyArray);
      }
    } catch (err) {
      console.error('Failed to load export history:', err);
      setExportHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, [reportType]); // eslint-disable-line

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchPreview();
    setToast({ message: 'Filters applied to preview.', type: 'success' });
  };

  const handleResetFilters = () => {
    const emptyFilters = {
      startDate: '',
      endDate: '',
      doctor: '',
      institution: '',
      area: '',
      teamMember: '',
      group: '',
      product: '',
      status: '',
      search: ''
    };
    setFilters(emptyFilters);
    fetchPreview();
    setToast({ message: 'Filters reset to default.', type: 'success' });
  };

  // Perform File Export (Excel / PDF / PowerPoint)
  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (window.api && window.api.export) {
        const res = await window.api.export.generate({
          reportType,
          format: exportFormat,
          filters
        });

        const exportResult = res?.data || res;

        if (exportResult && exportResult.success) {
          setToast({
            message: `Report exported successfully as ${exportResult.fileName}!`,
            type: 'success'
          });
          loadExportHistory();
        } else if (exportResult && exportResult.canceled) {
          setToast({ message: 'Export canceled by user.', type: 'info' });
        } else {
          setToast({ message: exportResult?.error || 'Export failed.', type: 'error' });
        }
      } else {
        setToast({ message: 'Desktop Export API unavailable in browser mode.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: err.message || 'Export error occurred.', type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenFile = async (filePath) => {
    try {
      if (window.api && window.api.export) {
        await window.api.export.openFile(filePath);
      }
    } catch (err) {
      setToast({ message: err.message || 'Unable to open file.', type: 'error' });
    }
  };

  // Safe Arrays for Pagination & Rendering
  const safeHistory = useMemo(() => (Array.isArray(exportHistory) ? exportHistory : []), [exportHistory]);
  const rowsList = useMemo(() => (Array.isArray(previewData?.rows) ? previewData.rows : []), [previewData]);

  // Preview Pagination Calculations
  const totalPreviewPages = Math.ceil(rowsList.length / pageSize) || 1;
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginatedRows = useMemo(() => rowsList.slice(startIdx, endIdx), [rowsList, startIdx, endIdx]);

  // History Pagination Calculations
  const totalHistoryPages = Math.ceil(safeHistory.length / historyPageSize) || 1;
  const histStartIdx = (historyPage - 1) * historyPageSize;
  const histEndIdx = histStartIdx + historyPageSize;
  const paginatedHistory = useMemo(() => safeHistory.slice(histStartIdx, histEndIdx), [safeHistory, histStartIdx, histEndIdx]);

  return (
    <DashboardLayout pageTitle="Enterprise Export Center">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Page Title & Overview */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
              Enterprise Export Center
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-1">
              Central reporting hub for exporting business data into formatted Excel spreadsheets, printed PDF documents, and PowerPoint presentations.
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting || previewLoading}
            className="px-5 py-2.5 bg-brand-primary hover:bg-[#8F161A] text-white text-xs font-bold rounded-xl transition-all shadow-md inline-flex items-center gap-2 cursor-pointer uppercase tracking-wider disabled:opacity-50"
          >
            <FiDownload className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
            {isExporting ? 'Generating Report...' : `Export to ${exportFormat.toUpperCase()}`}
          </button>
        </div>

        {/* 1. REPORT TYPE & FORMAT SELECTION BAR */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Type Selector */}
          <div className="lg:col-span-2 bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
              <FiLayers className="w-4 h-4 text-brand-primary" />
              <h2 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                Select Business Module / Report
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {REPORT_TYPES.map((rt) => {
                const Icon = rt.icon;
                const isSelected = reportType === rt.id;
                return (
                  <button
                    key={rt.id}
                    onClick={() => setReportType(rt.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-bold shadow-sm'
                        : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-900/50 text-gray-600 dark:text-slate-300 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1.5" />
                    <span className="text-[11px] leading-tight">{rt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Format Selector */}
          <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
                <FiSettings className="w-4 h-4 text-brand-primary" />
                <h2 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                  Export Document Format
                </h2>
              </div>
              <div className="space-y-3">
                {EXPORT_FORMATS.map((fmt) => {
                  const isSelected = exportFormat === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      onClick={() => setExportFormat(fmt.id)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-bold shadow-sm'
                          : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-900/50 text-gray-600 dark:text-slate-300 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${fmt.bg}`}>
                          <FiFileText className={`w-5 h-5 ${fmt.color}`} />
                        </div>
                        <span className="text-xs font-bold">{fmt.label}</span>
                      </div>
                      {isSelected && <FiCheckCircle className="w-4 h-4 text-brand-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400 text-center font-medium">
              Format includes headers, logo branding, summary totals, and formatting.
            </div>
          </div>
        </div>

        {/* 2. ENTERPRISE FILTERS BAR */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <FiFilter className="w-4 h-4 text-brand-primary" />
              <h2 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                Applied Export Filters
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleResetFilters}
                className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-4 py-1.5 bg-brand-primary hover:bg-[#8F161A] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer uppercase tracking-wider"
              >
                Apply Filters
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs font-semibold">
            {/* Search */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Search Text</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Keyword..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white outline-none"
                />
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white outline-none"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white outline-none"
              />
            </div>

            {/* Doctor */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Doctor</label>
              <select
                value={filters.doctor}
                onChange={(e) => handleFilterChange('doctor', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white outline-none"
              >
                <option value="">All Doctors</option>
                {doctorsList.map((d) => (
                  <option key={d.id} value={d.id}>{d.doctor_name || d.name}</option>
                ))}
              </select>
            </div>

            {/* Institution */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Institution</label>
              <select
                value={filters.institution}
                onChange={(e) => handleFilterChange('institution', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white outline-none"
              >
                <option value="">All Institutions</option>
                {institutionsList.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>

            {/* Area */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Area</label>
              <select
                value={filters.area}
                onChange={(e) => handleFilterChange('area', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white outline-none"
              >
                <option value="">All Areas</option>
                {areasList.map((a) => (
                  <option key={a.id} value={a.id}>{a.area_name || a.name}</option>
                ))}
              </select>
            </div>

            {/* Team Member */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Team Member</label>
              <select
                value={filters.teamMember}
                onChange={(e) => handleFilterChange('teamMember', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white outline-none"
              >
                <option value="">All Team Members</option>
                {teamMembersList.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Product */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Product</label>
              <select
                value={filters.product}
                onChange={(e) => handleFilterChange('product', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white outline-none"
              >
                <option value="">All Products</option>
                {productsList.map((p) => (
                  <option key={p.id} value={p.id}>{p.product_name || p.name}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. LIVE DATA PREVIEW TABLE */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                Live Data Preview ({previewData?.summary?.totalRecords || rowsList.length} Records)
              </h3>
              <p className="text-[10px] text-gray-400 font-medium">
                Exact filtered dataset that will be compiled into the exported report file.
              </p>
            </div>
            <button
              onClick={fetchPreview}
              className="p-1.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Refresh Preview"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${previewLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-900 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {previewData?.columns?.map((col) => (
                    <th key={col.key} className="px-5 py-4">
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs font-medium">
                {previewLoading ? (
                  <tr>
                    <td colSpan={previewData?.columns?.length || 5} className="text-center py-10 text-gray-400 font-semibold uppercase tracking-wider">
                      Compiling live preview dataset...
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={previewData?.columns?.length || 5} className="text-center py-10 text-gray-400 font-semibold uppercase tracking-wider">
                      No records match current export filters.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      {previewData?.columns?.map((col) => {
                        let val = row[col.key];
                        if (col.type === 'currency') {
                          val = val !== null && val !== undefined ? `Rs ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'Rs 0.00';
                        } else if (val === null || val === undefined) {
                          val = '—';
                        } else {
                          val = String(val);
                        }
                        return (
                          <td key={col.key} className="px-5 py-3.5 text-gray-800 dark:text-slate-200 font-semibold">
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {previewData && rowsList.length > 0 && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPreviewPages}
                onPageChange={setCurrentPage}
                totalRecords={rowsList.length}
                startIndex={startIdx}
                endIndex={endIdx}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </div>

        {/* 4. EXPORT HISTORY LOG TABLE */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <FiFolder className="w-4 h-4 text-brand-primary" />
              <h2 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                Recent Generated Export Files
              </h2>
            </div>
            <button
              onClick={loadExportHistory}
              className="text-xs font-bold text-brand-primary hover:underline uppercase tracking-wider"
            >
              Refresh History
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-900 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3">File Name</th>
                  <th className="px-4 py-3">Format</th>
                  <th className="px-4 py-3">File Size</th>
                  <th className="px-4 py-3">Created Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs font-medium">
                {historyLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-400 uppercase tracking-wider">
                      Loading export directory log...
                    </td>
                  </tr>
                ) : paginatedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-400 uppercase tracking-wider">
                      No exported files found in directory.
                    </td>
                  </tr>
                ) : (
                  paginatedHistory.map((h) => (
                    <tr key={h.id || h.fileName} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-gray-800 dark:text-white">{h.fileName}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
                          {h.format}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-semibold">{h.formattedSize}</td>
                      <td className="px-4 py-3 text-gray-500 font-semibold">{new Date(h.createdDate).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleOpenFile(h.filePath)}
                          className="px-3 py-1.5 bg-brand-primary hover:bg-[#8F161A] text-white text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <FiExternalLink className="w-3 h-3" />
                          Open File
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {safeHistory.length > 0 && (
            <div className="pt-2">
              <Pagination
                currentPage={historyPage}
                totalPages={totalHistoryPages}
                onPageChange={setHistoryPage}
                totalRecords={safeHistory.length}
                startIndex={histStartIdx}
                endIndex={histEndIdx}
                pageSize={historyPageSize}
                onPageSizeChange={setHistoryPageSize}
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ExportCenter;
