import React, { useState, useEffect, useCallback } from 'react';
import {
  FiShield, FiSearch, FiFilter, FiDownload, FiRefreshCw, FiChevronLeft,
  FiChevronRight, FiEye, FiClock, FiUser, FiLayers, FiAlertCircle
} from 'react-icons/fi';
import auditService, { calculateDiff } from '../../services/auditService';
import AuditLogDetailsModal from './AuditLogDetailsModal';
import DashboardLayout from '../../layouts/DashboardLayout';

const MODULE_OPTIONS = [
  'All', 'Authentication', 'Products', 'Doctors', 'Institutions',
  'Areas', 'Team Members', 'Groups', 'Targets', 'Orders', 'Settings'
];

const ACTION_OPTIONS = [
  'All', 'Create', 'Edit', 'Update', 'Status Change', 'Delete',
  'Delete Attempt', 'Delete Success', 'Submitted', 'Approved',
  'Returned to Draft', 'Completed', 'Cancelled', 'Edit Attempt on Locked Order',
  'Login', 'Logout', 'Failed Login', 'Password Change', 'Backup', 'Restore'
];

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  // Filter State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userFilter, setUserFilter] = useState('All');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditService.getAll({
        startDate,
        endDate,
        user: userFilter,
        module: moduleFilter,
        action: actionFilter,
        search,
        limit,
        offset: (page - 1) * limit
      });
      setLogs(res.logs || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, userFilter, moduleFilter, actionFilter, search, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setUserFilter('All');
    setModuleFilter('All');
    setActionFilter('All');
    setSearch('');
    setPage(1);
  };

  const handleExport = async () => {
    try {
      if (window.api && window.api.export) {
        const res = await window.api.export.generate({
          reportType: 'Audit Trail',
          format: 'excel',
          filters: { search, startDate, endDate, status: moduleFilter }
        });
        if (res && res.success) {
          alert(`Audit Trail exported to Excel successfully: ${res.fileName}`);
        } else {
          alert(res?.error || 'Export failed.');
        }
      } else {
        auditService.exportToCSV(logs);
      }
    } catch (err) {
      alert(err.message || 'Export error');
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const formatTimestamp = (ts) => {
    if (!ts) return '—';
    try {
      const d = new Date(ts);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
             d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return ts;
    }
  };

  const getActionBadgeColor = (action) => {
    const act = (action || '').toLowerCase();
    if (act.includes('create') || act.includes('submitted') || act.includes('approved') || act.includes('completed')) {
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40';
    }
    if (act.includes('delete') || act.includes('failed') || act.includes('cancelled') || act.includes('attempt')) {
      return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40';
    }
    if (act.includes('status') || act.includes('edit') || act.includes('update') || act.includes('returned')) {
      return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40';
    }
    return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40';
  };

  return (
    <DashboardLayout pageTitle="Audit Trail">
      <div className="space-y-6 animate-fadeIn">
        {/* Top Banner & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-2xl">
              <FiShield className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Enterprise Audit Trail</h1>
              <p className="text-xs text-gray-500 font-medium">Complete system activity, field diffs, and accountability log</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={fetchLogs}
              className="p-2.5 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Refresh Logs"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>

            <button
              onClick={handleExport}
              className="px-4 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-xl hover:bg-brand-primaryDark shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer"
            >
              <FiDownload className="w-4 h-4" /> Export Excel / PDF
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 pb-3">
            <span className="flex items-center gap-1.5">
              <FiFilter className="w-4 h-4 text-brand-primary" /> Filter & Search Logs
            </span>
            <button
              onClick={handleResetFilters}
              className="text-brand-primary hover:underline text-[11px] font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
            {/* Search Box */}
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Search Keyword</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-gray-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search user, action, field..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20 text-xs font-medium"
                />
              </div>
            </div>

            {/* Module Filter */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Module</label>
              <select
                value={moduleFilter}
                onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-xs font-medium cursor-pointer"
              >
                {MODULE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Action Filter */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Action</label>
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-xs font-medium cursor-pointer"
              >
                {ACTION_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-xs font-medium"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-xs font-medium"
              />
            </div>
          </div>
        </div>

        {/* Main Audit Logs Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-gray-500 font-semibold flex items-center justify-center gap-2">
              <FiRefreshCw className="w-4 h-4 animate-spin text-brand-primary" /> Loading audit records…
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-500 space-y-2">
              <FiAlertCircle className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="font-bold text-gray-700 dark:text-gray-300">No audit logs found matching your criteria</p>
              <p className="text-[11px] text-gray-400">Try adjusting your filters or date range.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/80 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Module</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Summary / Changes</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {logs.map((log) => {
                    const diffs = calculateDiff(log.oldValue, log.newValue);
                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 whitespace-nowrap text-gray-600 dark:text-gray-400 font-mono text-[11px]">
                          {formatTimestamp(log.performedAt)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">
                          <span className="inline-flex items-center gap-1.5">
                            <FiUser className="w-3.5 h-3.5 text-gray-400" />
                            {log.performedBy || 'System'}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-semibold text-gray-700 dark:text-gray-300">
                          {log.module}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-gray-500">
                          {log.entityId ? `${log.entityType} #${log.entityId}` : log.entityType}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${getActionBadgeColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 max-w-xs truncate text-[11px]">
                          {diffs.length > 0
                            ? diffs.slice(0, 2).map(d => `${d.field}: ${d.oldValue} → ${d.newValue}`).join(' | ') + (diffs.length > 2 ? ` (+${diffs.length - 2} more)` : '')
                            : 'No direct property diff'}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <FiEye className="w-3.5 h-3.5" /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Bar */}
          <div className="px-6 py-3.5 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-gray-500 font-medium">
              Showing <strong className="text-gray-900 dark:text-white">{logs.length > 0 ? (page - 1) * limit + 1 : 0}</strong> to{' '}
              <strong className="text-gray-900 dark:text-white">{Math.min(page * limit, total)}</strong> of{' '}
              <strong className="text-gray-900 dark:text-white">{total}</strong> audit records
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-all cursor-pointer"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-bold text-gray-700 dark:text-gray-300 px-2">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-all cursor-pointer"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Details View Modal */}
        {selectedLog && (
          <AuditLogDetailsModal
            log={selectedLog}
            onClose={() => setSelectedLog(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
