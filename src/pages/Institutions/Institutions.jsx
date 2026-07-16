import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { institutionService } from '../../services/institutionService';
import Pagination from '../../components/common/Pagination';
import {
  FiSearch, FiPlus, FiEye, FiEdit2, FiTrash2,
  FiX, FiAlertTriangle
} from 'react-icons/fi';

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

const DeleteDialog = ({ institution, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-md animate-slide-up">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
          <FiAlertTriangle className="w-5 h-5 text-feedback-error" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Delete Institution</h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-550 font-medium mt-0.5">{institution.code}</p>
        </div>
      </div>
      <div className="px-6 py-5">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-semibold">
          Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">{institution.name}</span>?
        </p>
        <p className="text-[11px] text-gray-400 mt-2 font-medium">This action is permanent and cannot be undone.</p>
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-enterprise">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-xs font-bold text-white bg-feedback-error rounded-lg hover:bg-red-650 transition-all flex items-center gap-1.5"
        >
          <FiTrash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    </div>
  </div>
);

const Institutions = () => {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toDelete, setToDelete] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    institutionService.getAllInstitutions().then((data) => {
      setList(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return list.filter((item) => {
      return !q ||
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.area.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        (item.contactPerson && item.contactPerson.toLowerCase().includes(q));
    });
  }, [list, search]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = useMemo(() => filtered.slice(startIndex, startIndex + itemsPerPage), [filtered, startIndex, itemsPerPage]);

  const openAdd = () => navigate('/institutions/new');
  const openEdit = (item) => navigate(`/institutions/${item.id}/edit`);
  const openView = (item) => navigate(`/institutions/${item.id}`);

  const handleDelete = () => {
    if (toDelete) {
      institutionService.deleteInstitution(toDelete.id).then((newInstitutions) => {
        setList(newInstitutions);
        setToDelete(null);
      });
    }
  };

  const activeCount = list.filter((item) => item.status === 'Active').length;
  const inactiveCount = list.filter((item) => item.status === 'Inactive').length;

  return (
    <DashboardLayout pageTitle="Institutions">
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Institutions</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-1">Manage all institutions.</p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
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
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-primaryDark transition-all"
            >
              <FiPlus className="w-4 h-4" />
              Add Institution
            </button>
          </div>
        </div>

        {/* Search controls */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft p-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search by Institution Name, Code, Area, City..."
              className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold text-gray-750 dark:text-gray-200 bg-gray-55 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Table list */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs" aria-label="Institutions table">
              <thead>
                <tr className="bg-gray-55 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  {['Institution Code', 'Institution Name', 'Area', 'City', 'Contact Person', 'Contact Number', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-5 py-3.5 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-gray-400 font-bold text-xs">
                      No institutions found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-55/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-gray-750 dark:text-gray-300">{item.code}</td>
                      <td className="px-5 py-4 font-bold text-gray-905 dark:text-white">{item.name}</td>
                      <td className="px-5 py-4 text-gray-650 dark:text-gray-300">{item.area}</td>
                      <td className="px-5 py-4 text-gray-650 dark:text-gray-300">{item.city}</td>
                      <td className="px-5 py-4 text-gray-650 dark:text-gray-300">{item.contactPerson || '—'}</td>
                      <td className="px-5 py-4 text-gray-650 dark:text-gray-300">{item.contactNumber || '—'}</td>
                      <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openView(item)}
                            className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-650 dark:text-blue-400 hover:bg-blue-105 rounded-lg text-[10px] font-bold transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => openEdit(item)}
                            className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 hover:bg-amber-105 rounded-lg text-[10px] font-bold transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setToDelete(item)}
                            className="px-2.5 py-1.5 bg-red-50 dark:bg-red-900/20 text-feedback-error hover:bg-red-105 rounded-lg text-[10px] font-bold transition-colors"
                          >
                            Delete
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
            endIndex={startIndex + itemsPerPage}
            pageSize={itemsPerPage}
            onPageSizeChange={setItemsPerPage}
          />
        </div>
      </div>

      {toDelete && (
        <DeleteDialog
          institution={toDelete}
          onCancel={() => setToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </DashboardLayout>
  );
};

export default Institutions;
