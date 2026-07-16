import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { doctorService } from '../../services/doctorService';
import Pagination from '../../components/common/Pagination';
import {
  FiSearch, FiPlus, FiEye, FiEdit2, FiTrash2,
  FiX, FiUsers, FiAlertTriangle, FiFilter
} from 'react-icons/fi';


const AREAS = [
  'Lahore Central',
  'Karachi South',
  'Islamabad F-10',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar'
];

const SPECIALTIES = [
  'Cardiologist',
  'Dermatologist',
  'Pediatrician',
  'General Physician',
  'Orthopedic',
  'Neurologist',
  'Gynecologist'
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
    <td colSpan={9} className="px-5 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-gray-55 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-center justify-center">
          <FiUsers className="w-8 h-8 text-gray-200 dark:text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-400 dark:text-gray-550">No doctors available.</p>
          <p className="text-[11px] text-gray-300 dark:text-gray-655 font-medium mt-1">Start by adding your first doctor.</p>
        </div>
        <button
          onClick={onAdd}
          className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm hover:shadow-md transition-all duration-150"
        >
          <FiPlus className="w-3.5 h-3.5" /> Add First Doctor
        </button>
      </div>
    </td>
  </tr>
);

const DeleteDialog = ({ doctor, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-md animate-slide-up">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
          <FiAlertTriangle className="w-5 h-5 text-feedback-error" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Delete Doctor</h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-550 font-medium mt-0.5">{doctor.code}</p>
        </div>
      </div>
      <div className="px-6 py-5">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-semibold">
          Are you sure you want to delete{' '}
          <span className="font-bold text-gray-900 dark:text-white">{doctor.name}</span>?
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 font-medium">This action cannot be undone.</p>
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-enterprise">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-55 dark:hover:bg-gray-700 transition-all duration-150"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-xs font-bold text-white bg-feedback-error rounded-lg hover:bg-red-650 shadow-sm hover:shadow-md transition-all duration-150 flex items-center gap-1.5"
        >
          <FiTrash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    </div>
  </div>
);

const Doctors = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toDelete, setToDelete] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    doctorService.getAllDoctors().then((data) => {
      setDoctors(data);
      setLoading(false);
    });
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, areaFilter, specialtyFilter, statusFilter]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return doctors.filter((d) => {
      const matchQ =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.hospital.toLowerCase().includes(q) ||
        d.area.toLowerCase().includes(q);

      const matchArea = !areaFilter || d.area === areaFilter;
      const matchSpecialty = !specialtyFilter || d.specialty === specialtyFilter;
      const matchStatus = !statusFilter || d.status === statusFilter;

      return matchQ && matchArea && matchSpecialty && matchStatus;
    });
  }, [doctors, search, areaFilter, specialtyFilter, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDoctors = useMemo(() => {
    return filtered.slice(startIndex, endIndex);
  }, [filtered, startIndex, endIndex, itemsPerPage]);

  const openAdd = () => navigate('/doctors/new');
  const openEdit = (d) => navigate(`/doctors/${d.id}/edit`);
  const openView = (d) => navigate(`/doctors/${d.id}`);

  const handleDelete = () => {
    if (toDelete) {
      doctorService.deleteDoctor(toDelete.id).then((newDoctors) => {
        setDoctors(newDoctors);
        setToDelete(null);
      });
    }
  };

  const handleClear = () => {
    setSearch('');
    setAreaFilter('');
    setSpecialtyFilter('');
    setStatusFilter('');
  };

  const showClear = search || areaFilter || specialtyFilter || statusFilter;
  const activeCount = doctors.filter((d) => d.status === 'Active').length;
  const inactiveCount = doctors.filter((d) => d.status === 'Inactive').length;

  return (
    <DashboardLayout pageTitle="Doctors">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Doctors</h1>
            <p className="text-xs text-gray-400 dark:text-gray-550 font-medium mt-1">Manage hospital doctors & consultants.</p>
          </div>
          <div className="flex items-center gap-3">
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
              <FiPlus className="w-3.5 h-3.5" /> Add Doctor
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Doctor Name, Code, Hospital, or Area..."
                className="w-full pl-9 pr-4 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-55 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Filter Selections */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-auto">
                <select
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                  className="w-full pl-3 pr-8 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-205 bg-gray-55 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none cursor-pointer min-w-[150px] appearance-none"
                >
                  <option value="">All Areas</option>
                  {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div className="relative w-full sm:w-auto">
                <select
                  value={specialtyFilter}
                  onChange={(e) => setSpecialtyFilter(e.target.value)}
                  className="w-full pl-3 pr-8 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-250 bg-gray-55 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none cursor-pointer min-w-[150px] appearance-none"
                >
                  <option value="">All Specialties</option>
                  {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="relative w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-3 pr-8 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-250 bg-gray-55 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg outline-none cursor-pointer min-w-[130px] appearance-none"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

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
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Doctors List</h3>
              <p className="text-[10px] text-gray-405 dark:text-gray-550 font-medium mt-0.5">
                Showing {filtered.length > 0 ? startIndex + 1 : 0}–{Math.min(endIndex, filtered.length)} of {filtered.length} records
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs" aria-label="Doctors table">
              <thead>
                <tr className="bg-gray-55 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  {['Doctor Code', 'Name', 'Specialty', 'Hospital', 'Area', 'Mobile', 'Status', 'Actions'].map((h) => (
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
                  paginatedDoctors.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-55/60 dark:hover:bg-gray-800/30 transition-colors duration-100 group">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-[10px] font-extrabold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                          {d.code}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-855 dark:text-gray-200 whitespace-nowrap">{d.name}</td>
                      <td className="px-5 py-4 text-gray-650 dark:text-gray-300 whitespace-nowrap">{d.specialty}</td>
                      <td className="px-5 py-4 text-gray-650 dark:text-gray-300 whitespace-nowrap">{d.hospital}</td>
                      <td className="px-5 py-4 text-gray-650 dark:text-gray-300 whitespace-nowrap">{d.area}</td>
                      <td className="px-5 py-4 font-semibold text-gray-800 dark:text-gray-205 whitespace-nowrap">{d.mobile}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openView(d)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-blue-650 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 hover:bg-blue-105 dark:hover:bg-blue-900/50 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-sm transition-all duration-150"
                          >
                            <FiEye className="w-3 h-3" /> View
                          </button>
                          <button
                            onClick={() => openEdit(d)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 hover:bg-amber-105 dark:hover:bg-amber-900/50 hover:border-amber-200 dark:hover:border-amber-700 hover:shadow-sm transition-all duration-150"
                          >
                            <FiEdit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => setToDelete(d)}
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
          doctor={toDelete}
          onCancel={() => setToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </DashboardLayout>
  );
};

export default Doctors;
