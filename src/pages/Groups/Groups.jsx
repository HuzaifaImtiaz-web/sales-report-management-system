import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Toast from '../../components/common/Toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { groupService } from '../../services/groupService';
import Pagination from '../../components/common/Pagination';
import {
  FiSearch, FiPlus, FiEye, FiEdit2, FiTrash2,
  FiX, FiAlertTriangle, FiLayers
} from 'react-icons/fi';

const StatusBadge = ({ status }) =>
  status === 'Active' ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 dark:bg-green-900/30 text-feedback-success border border-green-100 dark:border-green-800/50">
      <span className="w-1.5 h-1.5 rounded-full bg-feedback-success inline-block" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-900/30 text-feedback-error border border-red-100 dark:border-red-800/50">
      <span className="w-1.5 h-1.5 rounded-full bg-feedback-error inline-block" />
      Inactive
    </span>
  );

const EmptyState = ({ onAdd }) => (
  <tr>
    <td colSpan={6} className="px-5 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-brand-navy/50 border border-gray-200 dark:border-brand-navyLine flex items-center justify-center">
          <FiLayers className="w-8 h-8 text-gray-200 dark:text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-550">No groups available.</p>
          <p className="text-[11px] text-gray-300 dark:text-gray-600 font-medium mt-1">Start by adding your first group.</p>
        </div>
        <button
          onClick={onAdd}
          className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm hover:shadow-md transition-all duration-150"
        >
          <FiPlus className="w-3.5 h-3.5" /> Add First Group
        </button>
      </div>
    </td>
  </tr>
);

const DeleteDialog = ({ group, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-brand-navyCard border dark:border-brand-navyLine rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-md animate-slide-up">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-brand-navyLine">
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
          <FiAlertTriangle className="w-5 h-5 text-feedback-error" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Delete Group</h2>
        </div>
      </div>
      <div className="px-6 py-5">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-semibold">
          Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">{group.name}</span>?
        </p>
        <p className="text-[11px] text-gray-500 mt-2 font-medium">This action cannot be undone.</p>
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-brand-navyLine bg-gray-50/50 dark:bg-brand-navy/30 rounded-b-enterprise">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-white dark:bg-brand-navy border border-gray-200 dark:border-brand-navyLine rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-xs font-semibold text-white bg-feedback-error rounded-lg hover:bg-red-655 transition-all flex items-center gap-1.5"
        >
          <FiTrash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    </div>
  </div>
);

const Groups = () => {
  const navigate = useNavigate();
  // Buttons follow the role's permissions (the server enforces the same rules).
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('groups.create');
  const canEdit = hasPermission('groups.edit');
  const canDelete = hasPermission('groups.delete');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const location = useLocation();
  const [toast, setToast] = useState(location.state?.toast || null);
  useEffect(() => {
    if (location.state?.toast) setToast(location.state.toast);
  }, [location.state]);


  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    groupService.getAllGroups().then((data) => {
      setGroups(data || []);
      setLoading(false);
    }).catch((err) => {
      setToast({ message: err.message || 'The list could not be loaded. Check your connection and refresh the page.', type: 'error' });
      setLoading(false);
    });
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, divisionFilter]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return groups.filter((g) => {
      const matchQ =
        !q ||
        g.name.toLowerCase().includes(q) ||
        (g.divisionName && g.divisionName.toLowerCase().includes(q)) ||
        (g.description && g.description.toLowerCase().includes(q));

      const matchStatus = !statusFilter || g.status === statusFilter;
      const matchDivision = !divisionFilter || g.divisionName === divisionFilter;

      return matchQ && matchStatus && matchDivision;
    });
  }, [groups, search, statusFilter, divisionFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedGroups = useMemo(() => {
    return filtered.slice(startIndex, endIndex);
  }, [filtered, startIndex, endIndex, itemsPerPage]);

  const openAdd = () => navigate('/groups/new');
  const openEdit = (g) => navigate(`/groups/${g.id}/edit`);
  const openView = (g) => navigate(`/groups/${g.id}`);

  const handleDelete = () => {
    if (!toDelete) return;
    const item = toDelete;
    groupService.deleteGroup(item.id)
      .then((newList) => {
        setGroups(newList);
        setToast({ message: `Group "${item.name}" deleted.`, type: 'success' });
      })
      .catch((err) => {
        // The server explains why, e.g. the record is still used by orders.
        setToast({ message: err.message || 'This group could not be deleted.', type: 'error' });
      })
      .finally(() => setToDelete(null));
  };

  const handleClear = () => {
    setSearch('');
    setStatusFilter('');
    setDivisionFilter('');
  };

  const showClear = search || statusFilter || divisionFilter;
  const activeCount = groups.filter((g) => g.status === 'Active').length;
  const inactiveCount = groups.filter((g) => g.status === 'Inactive').length;

  return (
    <DashboardLayout pageTitle="Product Groups">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-905 dark:text-white tracking-tight">Product Groups</h1>
            <p className="text-xs text-gray-500 dark:text-gray-550 font-medium mt-1 font-semibold">Manage Division-specific Product Groups classification.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800/50 text-feedback-success text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-feedback-success" />
              {activeCount} Active
            </span>
            {inactiveCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 text-feedback-error text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-feedback-error" />
                {inactiveCount} Inactive
              </span>
            )}
            {canCreate && (
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm hover:shadow-md transition-all duration-150"
            >
              <FiPlus className="w-3.5 h-3.5" /> Add Group
            </button>
            )}
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white dark:bg-brand-navyCard border border-gray-105 dark:border-brand-navyLine rounded-enterprise shadow-soft p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Group Name, Division, or Description..."
                className="w-full pl-9 pr-4 py-2.5 text-xs font-medium text-gray-705 dark:text-gray-205 bg-gray-50 dark:bg-brand-navy/50 border border-gray-105 dark:border-brand-navyLine rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Filter Selections */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3">
              {/* Division Filter */}
              <div className="relative w-full sm:w-auto">
                <select
                  value={divisionFilter}
                  onChange={(e) => setDivisionFilter(e.target.value)}
                  className="w-full pl-3 pr-8 py-2.5 text-xs font-medium text-gray-705 dark:text-gray-250 bg-gray-50 dark:bg-brand-navy/50 border border-gray-105 dark:border-brand-navyLine rounded-lg outline-none cursor-pointer min-w-[130px] appearance-none"
                >
                  <option value="">All Divisions</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Oncology">Oncology</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="relative w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-3 pr-8 py-2.5 text-xs font-medium text-gray-705 dark:text-gray-250 bg-gray-50 dark:bg-brand-navy/50 border border-gray-105 dark:border-brand-navyLine rounded-lg outline-none cursor-pointer min-w-[130px] appearance-none"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {showClear && (
                <button
                  onClick={handleClear}
                  className="px-3 py-2.5 text-xs font-semibold text-gray-500 bg-gray-50 dark:bg-brand-navy/50 border border-gray-200 dark:border-brand-navyLine rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-305 transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap"
                >
                  <FiX className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table & Pagination Card */}
        <div className="bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-enterprise shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-brand-navyLine">
            <div>
              <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Groups List</h3>
              <p className="text-xs text-gray-500 dark:text-gray-550 font-medium mt-0.5">
                Showing {filtered.length > 0 ? startIndex + 1 : 0}–{Math.min(endIndex, filtered.length)} of {filtered.length} records
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs" aria-label="Groups table">
              <thead>
                <tr className="bg-gray-50 dark:bg-brand-navy/50 border-b border-gray-200 dark:border-brand-navyLine">
                  {['Division', 'Group Name', 'Description', 'Total Products', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3.5 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {filtered.length === 0 ? (
                  <EmptyState onAdd={openAdd} />
                ) : (
                  paginatedGroups.map((g) => (
                    <tr key={g.id} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors duration-100 group">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center w-max px-2.5 py-0.5 rounded text-[11px] font-semibold bg-brand-primary/10 text-brand-primary">
                          {g.divisionName || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-855 dark:text-gray-200 whitespace-nowrap">{g.name}</td>
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-300 max-w-[250px] truncate">{g.description || '—'}</td>
                      <td className="px-5 py-4 font-semibold text-gray-800 dark:text-gray-205 whitespace-nowrap">{g.totalProducts}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={g.status} />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openView(g)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-650 dark:text-gray-400 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-brand-navyLine hover:bg-gray-105 transition-all duration-150"
                          >
                            <FiEye className="w-3 h-3" /> View
                          </button>
                          {canEdit && (
                          <button
                            onClick={() => openEdit(g)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 hover:bg-amber-105 transition-all duration-150"
                          >
                            <FiEdit2 className="w-3 h-3" /> Edit
                          </button>
                          )}
                          {canDelete && (
                          <button
                            onClick={() => setToDelete(g)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-feedback-error bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 hover:bg-red-105 transition-all duration-150"
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
            endIndex={endIndex}
            pageSize={itemsPerPage}
            onPageSizeChange={setItemsPerPage}
          />
        </div>
      </div>

      {toDelete && (
        <DeleteDialog
          group={toDelete}
          onCancel={() => setToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </DashboardLayout>
  );
};

export default Groups;
