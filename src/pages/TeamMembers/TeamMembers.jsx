import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { teamMemberService } from '../../services/teamMemberService';
import Pagination from '../../components/common/Pagination';
import FilterPresetBar from '../../components/common/FilterPresetBar';
import StatusSelector from '../../components/common/StatusSelector';
import { exportToCSV } from '../../utils/exportUtils';
import {
  FiSearch, FiPlus, FiEye, FiEdit2, FiTrash2,
  FiX, FiUsers, FiAlertTriangle, FiDownload
} from 'react-icons/fi';

const DESIGNATIONS = [
  'Medical Representative',
  'Territory Manager',
  'Area Sales Manager',
  'Regional Sales Manager'
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

const EmptyState = ({ onAdd }) => (
  <tr>
    <td colSpan={6} className="px-5 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-gray-55 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-center justify-center">
          <FiUsers className="w-8 h-8 text-gray-200 dark:text-gray-650" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-400 dark:text-gray-550">No team members available.</p>
          <p className="text-[11px] text-gray-300 dark:text-gray-655 font-medium mt-1">Start by adding your first team member.</p>
        </div>
        <button
          onClick={onAdd}
          className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm hover:shadow-md transition-all duration-150"
        >
          <FiPlus className="w-3.5 h-3.5" /> Add First Team Member
        </button>
      </div>
    </td>
  </tr>
);

const DeleteDialog = ({ member, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-md animate-slide-up">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
          <FiAlertTriangle className="w-5 h-5 text-feedback-error" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Delete Team Member</h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-550 font-medium mt-0.5">{member.code}</p>
        </div>
      </div>
      <div className="px-6 py-5">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-semibold">
          Are you sure you want to delete{' '}
          <span className="font-bold text-gray-900 dark:text-white">{member.name}</span>?
        </p>
        <p className="text-[11px] text-gray-400 mt-2 font-medium">This action cannot be undone.</p>
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
          className="px-4 py-2 text-xs font-bold text-white bg-feedback-error rounded-lg hover:bg-red-655 transition-all flex items-center gap-1.5"
        >
          <FiTrash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    </div>
  </div>
);

const TeamMembers = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toDelete, setToDelete] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setSearch(q);
  }, [searchParams]);

  useEffect(() => {
    teamMemberService.getAllTeamMembers().then((data) => {
      setTeam(data || []);
      setLoading(false);
    });
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, areaFilter, designationFilter, statusFilter]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return team.filter((t) => {
      const matchQ =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.area.toLowerCase().includes(q) ||
        t.designation.toLowerCase().includes(q);

      const matchArea = !areaFilter || t.area === areaFilter;
      const matchDesignation = !designationFilter || t.designation === designationFilter;
      const matchStatus = statusFilter === 'All' || !statusFilter || t.status === statusFilter;

      return matchQ && matchArea && matchDesignation && matchStatus;
    });
  }, [team, search, areaFilter, designationFilter, statusFilter]);

  // Deep linking scroll into view effect
  useEffect(() => {
    const highlightId = searchParams.get('highlightId');
    if (highlightId && !loading && filtered.length > 0) {
      const el = document.getElementById(`row-${highlightId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-brand-primary', 'bg-amber-50', 'dark:bg-amber-900/30');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-brand-primary', 'bg-amber-50', 'dark:bg-amber-900/30');
        }, 3000);
      }
    }
  }, [searchParams, loading, filtered]);

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTeam = useMemo(() => {
    return filtered.slice(startIndex, endIndex);
  }, [filtered, startIndex, endIndex, itemsPerPage]);

  const openAdd = () => navigate('/team/new');
  const openEdit = (t) => navigate(`/team/${t.id}/edit`);
  const openView = (t) => navigate(`/team/${t.id}`);

  const handleDelete = () => {
    if (toDelete) {
      teamMemberService.deleteTeamMember(toDelete.id).then((newTeam) => {
        setTeam(newTeam);
        setToDelete(null);
      });
    }
  };

  const handleClear = () => {
    setSearch('');
    setAreaFilter('');
    setDesignationFilter('');
    setStatusFilter('All');
  };

  const showClear = search || areaFilter || designationFilter || (statusFilter && statusFilter !== 'All');
  const activeCount = team.filter((t) => t.status === 'Active').length;
  const inactiveCount = team.filter((t) => t.status === 'Inactive').length;

  return (
    <DashboardLayout pageTitle="Team Members">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Team Members</h1>
            <p className="text-xs text-gray-400 dark:text-gray-550 font-medium mt-1">Manage sales force and field staff.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => exportToCSV('team_members_export', filtered, [
                { key: 'code', label: 'Employee ID' },
                { key: 'name', label: 'Employee Name' },
                { key: 'designation', label: 'Designation' },
                { key: 'area', label: 'Area' },
                { key: 'status', label: 'Status' }
              ])}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Export filtered team members to CSV"
            >
              <FiDownload className="w-3.5 h-3.5" /> Export Filtered
            </button>
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
              <FiPlus className="w-3.5 h-3.5" /> Add Member
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
            <FilterPresetBar
              moduleName="team"
              currentFilters={{ search, areaFilter, designationFilter, statusFilter }}
              onApplyPreset={(f) => {
                if (f.search !== undefined) setSearch(f.search);
                if (f.areaFilter !== undefined) setAreaFilter(f.areaFilter);
                if (f.designationFilter !== undefined) setDesignationFilter(f.designationFilter);
                if (f.statusFilter !== undefined) setStatusFilter(f.statusFilter);
              }}
            />
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Employee Name, Employee ID, Area, or Designation..."
                className="w-full pl-9 pr-4 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-205 bg-gray-55 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Filter Selections */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-auto">
                <select
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                  className="w-full pl-3 pr-8 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-250 bg-gray-55 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none cursor-pointer min-w-[150px] appearance-none"
                >
                  <option value="">All Areas</option>
                  {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div className="relative w-full sm:w-auto">
                <select
                  value={designationFilter}
                  onChange={(e) => setDesignationFilter(e.target.value)}
                  className="w-full pl-3 pr-8 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-250 bg-gray-55 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none cursor-pointer min-w-[170px] appearance-none"
                >
                  <option value="">All Designations</option>
                  {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <StatusSelector
                options={['All', 'Active', 'Inactive']}
                value={statusFilter}
                onChange={setStatusFilter}
              />

              {showClear && (
                <button
                  onClick={handleClear}
                  className="px-3 py-2.5 text-xs font-bold text-gray-500 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-305 transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap"
                >
                  <FiX className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table & Pagination Card */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Team Members List</h3>
              <p className="text-[10px] text-gray-405 dark:text-gray-550 font-medium mt-0.5">
                Showing {filtered.length > 0 ? startIndex + 1 : 0}–{Math.min(endIndex, filtered.length)} of {filtered.length} records
              </p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-xs" aria-label="Team table">
              <thead className="sticky top-0 z-10 bg-gray-55 dark:bg-[#0f172a] shadow-xs">
                <tr className="bg-gray-55 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  {['Employee ID', 'Employee Name', 'Designation', 'Area', 'Status', 'Actions'].map((h) => (
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
                  paginatedTeam.map((t) => (
                    <tr
                      id={`row-${t.id}`}
                      key={t.id}
                      className="hover:bg-gray-55/60 dark:hover:bg-gray-800/30 transition-colors duration-100 group"
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-[10px] font-extrabold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                          {t.code}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-855 dark:text-gray-205 whitespace-nowrap">{t.name}</td>
                      <td className="px-5 py-4 text-gray-650 dark:text-gray-300 whitespace-nowrap">{t.designation}</td>
                      <td className="px-5 py-4 text-gray-650 dark:text-gray-300 whitespace-nowrap">{t.area}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openView(t)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-blue-650 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 hover:bg-blue-105 dark:hover:bg-blue-900/50 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-sm transition-all duration-150"
                          >
                            <FiEye className="w-3 h-3" /> View
                          </button>
                          <button
                            onClick={() => openEdit(t)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 hover:bg-amber-105 dark:hover:bg-amber-900/50 hover:border-amber-200 dark:hover:border-amber-700 hover:shadow-sm transition-all duration-150"
                          >
                            <FiEdit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => setToDelete(t)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-feedback-error bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 hover:bg-red-105 transition-all duration-150"
                          >
                            <FiTrash2 className="w-3 h-3" /> Delete
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
          member={toDelete}
          onCancel={() => setToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </DashboardLayout>
  );
};

export default TeamMembers;
