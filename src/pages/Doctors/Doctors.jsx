import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiEye, FiUserCheck,
  FiPhone, FiMapPin, FiBriefcase, FiX, FiCheck, FiDownload, FiAlertCircle
} from 'react-icons/fi';
import DashboardLayout from '../../layouts/DashboardLayout';
import Toast from '../../components/common/Toast';
import ConfirmDialog from '../../components/common/dialogs/ConfirmDialog';
import StatusSelector from '../../components/common/StatusSelector';
import { doctorService } from '../../services/doctorService';
import { exportToCSV } from '../../utils/exportUtils';

const SPECIALTIES = [
  'Cardiologist',
  'Dermatologist',
  'Pediatrician',
  'General Physician',
  'Orthopedic',
  'Neurologist',
  'Gynecologist'
];

const AREAS = [
  'Lahore Central',
  'Karachi South',
  'Islamabad F-10',
  'Rawalpindi Cantt',
  'Faisalabad City',
  'Multan Cantonment'
];

const EmptyState = ({ onAdd }) => (
  <tr id="empty-state-row">
    <td colSpan={7} className="py-12 text-center">
      <div className="flex flex-col items-center justify-center max-w-xs mx-auto text-center">
        <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-3">
          <FiUserCheck className="w-6 h-6" />
        </div>
        <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">No Doctors Found</p>
        <p className="text-[11px] text-gray-400 dark:text-gray-550 mb-4">
          No records match your criteria. Add your first doctor to get started.
        </p>
        <button
          onClick={onAdd}
          className="px-4 py-2 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <FiPlus className="w-3.5 h-3.5" /> Add First Doctor
        </button>
      </div>
    </td>
  </tr>
);

export default function Doctors() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(location.state?.toast || null);
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setSearch(q);
  }, [searchParams]);

  const fetchDoctors = () => {
    doctorService.getAllDoctors().then((data) => {
      setDoctors(data || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchDoctors();
    const handleDbChange = () => fetchDoctors();
    window.addEventListener('himmel-db-change', handleDbChange);
    return () => window.removeEventListener('himmel-db-change', handleDbChange);
  }, []);

  useEffect(() => {
    if (location.state?.toast) {
      setToast(location.state.toast);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return doctors.filter((d) => {
      const matchSearch =
        !q ||
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.code && d.code.toLowerCase().includes(q)) ||
        (d.specialty && d.specialty.toLowerCase().includes(q)) ||
        (d.hospital && d.hospital.toLowerCase().includes(q));

      const matchArea = !areaFilter || (d.area && d.area.toLowerCase() === areaFilter.toLowerCase());
      const matchSpecialty = !specialtyFilter || (d.specialty && d.specialty.toLowerCase() === specialtyFilter.toLowerCase());
      const matchStatus = statusFilter === 'All' || !statusFilter || d.status === statusFilter;

      return matchSearch && matchArea && matchSpecialty && matchStatus;
    });
  }, [doctors, search, areaFilter, specialtyFilter, statusFilter]);

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

  const handleDelete = () => {
    if (!toDelete) return;
    doctorService.deleteDoctor(toDelete.id).then((updatedList) => {
      setDoctors(updatedList);
      setToast({ message: `Doctor "${toDelete.name}" deleted successfully.`, type: 'success' });
      setToDelete(null);
    }).catch(err => {
      setToast({ message: err.message || 'Failed to delete doctor.', type: 'error' });
      setToDelete(null);
    });
  };

  const handleClear = () => {
    setSearch('');
    setAreaFilter('');
    setSpecialtyFilter('');
    setStatusFilter('All');
  };

  const showClear = search || areaFilter || specialtyFilter || (statusFilter && statusFilter !== 'All');
  const activeCount = doctors.filter((d) => d.status === 'Active').length;
  const inactiveCount = doctors.filter((d) => d.status === 'Inactive').length;

  return (
    <DashboardLayout pageTitle="Doctors">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Doctors</h1>
            <p className="text-xs text-gray-400 dark:text-gray-550 font-medium mt-1">Manage hospital doctors & consultants.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => exportToCSV('doctors_export', filtered, [
                { key: 'code', label: 'Doctor Code' },
                { key: 'name', label: 'Doctor Name' },
                { key: 'specialty', label: 'Specialty' },
                { key: 'hospital', label: 'Hospital' },
                { key: 'area', label: 'Area' },
                { key: 'mobile', label: 'Mobile' },
                { key: 'status', label: 'Status' }
              ])}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Export filtered doctors to CSV"
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
              onClick={() => navigate('/doctors/new')}
              className="px-4 py-2 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <FiPlus className="w-3.5 h-3.5" /> Add Doctor
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise p-4 shadow-soft">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Doctor Name, Code, Hospital, Specialty..."
                className="w-full pl-9 pr-8 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-55 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-750 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-555"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="pl-3 pr-8 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-55 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-750 rounded-lg outline-none cursor-pointer appearance-none"
              >
                <option value="">All Areas</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>

              <select
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="pl-3 pr-8 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-55 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-750 rounded-lg outline-none cursor-pointer appearance-none"
              >
                <option value="">All Specialties</option>
                {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>

              {/* Standardized Status Selector UI */}
              <StatusSelector
                options={['All', 'Active', 'Inactive']}
                value={statusFilter}
                onChange={setStatusFilter}
              />

              {showClear && (
                <button
                  onClick={handleClear}
                  className="px-2.5 py-1.5 text-[11px] font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Doctor Name</th>
                  <th className="py-3 px-4">Specialty</th>
                  <th className="py-3 px-4">Hospital</th>
                  <th className="py-3 px-4">Area</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400 font-medium">Loading doctors...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <EmptyState onAdd={() => navigate('/doctors/new')} />
                ) : (
                  filtered.map((d) => (
                    <tr
                      id={`row-${d.id}`}
                      key={d.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-gray-600 dark:text-gray-400 text-[11px]">
                        {d.code || `DOC-${d.id}`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900 dark:text-white">{d.name}</div>
                        {d.mobile && (
                          <div className="text-[10px] text-gray-400 dark:text-gray-550 flex items-center gap-1 font-medium mt-0.5">
                            <FiPhone className="w-2.5 h-2.5" /> {d.mobile}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                          <FiBriefcase className="w-2.5 h-2.5" /> {d.specialty || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">
                        {d.hospital || '—'}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">
                        <span className="flex items-center gap-1">
                          <FiMapPin className="w-3 h-3 text-gray-400" /> {d.area || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          d.status === 'Active'
                            ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-feedback-success'
                            : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-feedback-error'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${d.status === 'Active' ? 'bg-feedback-success' : 'bg-feedback-error'}`} />
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/doctors/${d.id}`)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                            title="View Doctor Details"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => navigate(`/doctors/${d.id}/edit`)}
                            className="p-1.5 text-gray-400 hover:text-brand-primary rounded-lg hover:bg-brand-primary/10 transition-colors"
                            title="Edit Doctor"
                          >
                            <FiEdit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setToDelete(d)}
                            className="p-1.5 text-gray-400 hover:text-feedback-error rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete Doctor"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmDialog
          open={!!toDelete}
          title="Delete Doctor"
          message={`Are you sure you want to delete "${toDelete?.name}"? This action cannot be undone.`}
          confirmVariant="danger"
          confirmText="Delete"
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      </div>
    </DashboardLayout>
  );
}
