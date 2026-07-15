import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Pagination from '../../components/common/Pagination';
import {
  FiSearch, FiPlus, FiEye, FiEdit2, FiTrash2,
  FiX, FiAlertTriangle, FiCheck, FiFilter, FiInfo
} from 'react-icons/fi';

/* ─── Static Dummy Data ───────────────────────────────────────────── */
const INITIAL_INSTITUTIONS = [
  {
    id: 1,
    code: 'INST-0001',
    name: 'Mayo Hospital',
    area: 'Lahore Central',
    city: 'Lahore',
    address: 'Nila Gumbad Chowk, Lahore, Punjab',
    contactPerson: 'Dr. Tariq Mahmood',
    contactNumber: '+92 300 1234567',
    notes: 'Largest tertiary care public sector hospital.',
    status: 'Active'
  },
  {
    id: 2,
    code: 'INST-0002',
    name: 'Jinnah Hospital',
    area: 'Karachi South',
    city: 'Karachi',
    address: 'Rafiqui Shaheed Road, Karachi, Sindh',
    contactPerson: 'Dr. Hamid Raza',
    contactNumber: '+92 321 9876543',
    notes: 'Major teaching hospital. High volume orders.',
    status: 'Active'
  },
  {
    id: 3,
    code: 'INST-0003',
    name: 'Shifa International',
    area: 'Islamabad F-10',
    city: 'Islamabad',
    address: 'H-8/4, Islamabad, Capital Territory',
    contactPerson: 'Dr. Nadia Siddiqui',
    contactNumber: '+92 333 5556667',
    notes: 'Premium private healthcare institution.',
    status: 'Active'
  },
  {
    id: 4,
    code: 'INST-0004',
    name: 'Holy Family Hospital',
    area: 'Rawalpindi Cantt',
    city: 'Rawalpindi',
    address: 'Asghar Mall Road, Rawalpindi, Punjab',
    contactPerson: 'Dr. Farhan Latif',
    contactNumber: '+92 345 4443322',
    notes: 'High demand for cardiac medicines.',
    status: 'Active'
  },
  {
    id: 5,
    code: 'INST-0005',
    name: 'FIC Faisalabad',
    area: 'Faisalabad City',
    city: 'Faisalabad',
    address: 'Sargodha Road, Faisalabad, Punjab',
    contactPerson: 'Dr. Saima Riaz',
    contactNumber: '+92 312 8889900',
    notes: 'Specialist institute for cardiac care.',
    status: 'Active'
  },
  {
    id: 6,
    code: 'INST-0006',
    name: 'Nishtar Hospital',
    area: 'Multan Cantonment',
    city: 'Multan',
    address: 'Nishtar Road, Multan, Punjab',
    contactPerson: 'Dr. Tariq Mehmood',
    contactNumber: '+92 301 7776655',
    notes: 'Main tertiary care center for South Punjab.',
    status: 'Inactive'
  }
];

const AREAS = [
  'Lahore Central',
  'Karachi South',
  'Islamabad F-10',
  'Rawalpindi Cantt',
  'Faisalabad City',
  'Multan Cantonment',
  'Peshawar University'
];

const CITIES = [
  'Lahore',
  'Karachi',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar'
];

export const getActiveInstitutions = () => {
  const saved = localStorage.getItem('institutions');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Error parsing institutions from localStorage', e);
    }
  }
  return INITIAL_INSTITUTIONS;
};

const generateCode = (id) => `INST-${String(id).padStart(4, '0')}`;
const EMPTY_FORM = {
  name: '',
  code: '',
  area: 'Lahore Central',
  city: 'Lahore',
  address: '',
  contactPerson: '',
  contactNumber: '',
  notes: '',
  status: 'Active'
};

/* ─── Status Badge ───────────────────────────────────────────────── */
const StatusBadge = ({ status }) =>
  status === 'Active' ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 dark:bg-green-900/30 text-feedback-success border border-green-100 dark:border-green-800/50">
      <span className="w-1.5 h-1.5 rounded-full bg-feedback-success inline-block" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 text-gray-550 dark:text-gray-400">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
      Inactive
    </span>
  );

/* ─── Field Helper ────────────────────────────────────────────────── */
const Field = ({ label, required, error, children }) => (
  <div>
    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-550 dark:text-gray-400 mb-1.5">
      {label} {required && <span className="text-feedback-error">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-feedback-error font-semibold mt-1">{error}</p>}
  </div>
);

const inputCls = (err) =>
  `w-full px-3 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-55 dark:bg-gray-800/50 border rounded-lg outline-none
   transition-all duration-155 placeholder:text-gray-400 dark:placeholder:text-gray-500
   focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40
   ${err ? 'border-feedback-error bg-red-50 dark:bg-red-900/10' : 'border-gray-100 dark:border-gray-700'}`;

/* ─── Institution Form Page ──────────────────────────────────────── */
const InstitutionFormPage = ({ mode, institution, nextCode, onSave, onCancel }) => {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState(
    institution ? { ...institution } : { ...EMPTY_FORM, code: nextCode }
  );
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Institution Name is required.';
    if (!form.city) e.city = 'City is required.';
    if (!form.area) e.area = 'Area is required.';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    onSave(form);
  };

  const pageTitle = isEdit ? 'Edit Institution' : 'Add Institution';
  const shortDesc = 'Configure institution / hospital profile, location settings, and contact person.';

  return (
    <DashboardLayout pageTitle={pageTitle}>
      <div className="space-y-6 animate-fade-in max-w-3xl mx-auto pb-12">
        {/* Top Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-505 hover:text-gray-700 transition-colors"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {pageTitle}
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5">
              {shortDesc}
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
            <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <FiInfo className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
              Institution Profile
            </h2>
          </div>

          {/* Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Institution Name" required error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Mayo Hospital"
                className={inputCls(errors.name)}
              />
            </Field>
            <Field label="Institution Code">
              <input
                disabled
                value={form.code}
                className={inputCls(false) + ' opacity-60 cursor-default font-mono'}
              />
            </Field>
          </div>

          {/* Area & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Area" required error={errors.area}>
              <select
                value={form.area}
                onChange={(e) => set('area', e.target.value)}
                className={inputCls(errors.area) + ' appearance-none cursor-pointer'}
              >
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="City" required error={errors.city}>
              <select
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
                className={inputCls(errors.city) + ' appearance-none cursor-pointer'}
              >
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          {/* Address */}
          <Field label="Address">
            <input
              value={form.address || ''}
              onChange={(e) => set('address', e.target.value)}
              placeholder="e.g. Sector-G, Medical Area"
              className={inputCls(false)}
            />
          </Field>

          {/* Contact Person & Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Contact Person">
              <input
                value={form.contactPerson || ''}
                onChange={(e) => set('contactPerson', e.target.value)}
                placeholder="e.g. Dr. Tariq Mahmood"
                className={inputCls(false)}
              />
            </Field>
            <Field label="Contact Number">
              <input
                value={form.contactNumber || ''}
                onChange={(e) => set('contactNumber', e.target.value)}
                placeholder="e.g. +92 300 1234567"
                className={inputCls(false)}
              />
            </Field>
          </div>

          {/* Notes */}
          <Field label="Notes">
            <textarea
              rows={3}
              value={form.notes || ''}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Any additional remarks..."
              className={inputCls(false) + ' resize-none'}
            />
          </Field>

          {/* Status */}
          <Field label="Status" required>
            <div className="flex gap-3">
              {['Active', 'Inactive'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set('status', s)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold border transition-all duration-150
                    ${form.status === s
                      ? s === 'Active'
                        ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-feedback-success'
                        : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-feedback-error'
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-550 hover:border-gray-200 dark:hover:border-gray-600'
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Field>

          {/* Action buttons inside form card */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-105 dark:border-gray-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-805 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-150"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm hover:shadow-md transition-all duration-150 flex items-center gap-1.5"
            >
              <FiCheck className="w-3.5 h-3.5" />
              {isEdit ? 'Update Institution' : 'Save Institution'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

/* ─── Institution View Page ──────────────────────────────────────── */
const InstitutionViewPage = ({ institution, onBack }) => (
  <DashboardLayout pageTitle="Institution Details">
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {institution.name}
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5">
            {institution.code}
          </p>
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <FiInfo className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
              Institution Information
            </h2>
          </div>
          <StatusBadge status={institution.status} />
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-lg border border-gray-100/50 dark:border-gray-800/55">
            <p className="text-[9px] font-bold text-gray-400 uppercase">Institution Code</p>
            <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{institution.code}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-lg border border-gray-100/50 dark:border-gray-800/55">
            <p className="text-[9px] font-bold text-gray-400 uppercase">Status</p>
            <div className="mt-1"><StatusBadge status={institution.status} /></div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-lg border border-gray-100/50 dark:border-gray-800/55">
            <p className="text-[9px] font-bold text-gray-400 uppercase">Area</p>
            <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{institution.area}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-lg border border-gray-100/50 dark:border-gray-800/55">
            <p className="text-[9px] font-bold text-gray-400 uppercase">City</p>
            <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{institution.city}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-lg border border-gray-100/50 dark:border-gray-800/55 col-span-2">
            <p className="text-[9px] font-bold text-gray-400 uppercase">Address</p>
            <p className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{institution.address || '—'}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-lg border border-gray-100/50 dark:border-gray-800/55">
            <p className="text-[9px] font-bold text-gray-400 uppercase">Contact Person</p>
            <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{institution.contactPerson || '—'}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-lg border border-gray-100/50 dark:border-gray-800/55">
            <p className="text-[9px] font-bold text-gray-400 uppercase">Contact Number</p>
            <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{institution.contactNumber || '—'}</p>
          </div>
        </div>

        {/* Notes */}
        {institution.notes && (
          <div className="border border-gray-100 dark:border-gray-800 rounded-lg p-3">
            <p className="text-[9px] font-bold text-gray-400 uppercase pb-1 mb-1 border-b border-gray-100 dark:border-gray-800">Notes</p>
            <p className="text-xs text-gray-700 dark:text-gray-300 italic">"{institution.notes}"</p>
          </div>
        )}

        <div className="flex items-center justify-end pt-6 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onBack}
            className="px-5 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-150"
          >
            Back to List
          </button>
        </div>
      </div>
    </div>
  </DashboardLayout>
);

/* ─── Delete Dialog ──────────────────────────────────────────────── */
const DeleteDialog = ({ institution, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] w-full max-w-md animate-slide-up">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
          <FiAlertTriangle className="w-5 h-5 text-feedback-error" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Delete Institution</h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">{institution.code}</p>
        </div>
      </div>
      <div className="px-6 py-5">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-semibold">
          Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">{institution.name}</span>?
        </p>
        <p className="text-[11px] text-gray-400 mt-2">This action is permanent and cannot be undone.</p>
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

/* ─── Main Component ─────────────────────────────────────────────── */
const Institutions = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { pathname } = useLocation();

  const isNew = pathname.endsWith('/new');
  const isEdit = pathname.endsWith('/edit');
  const isView = !isNew && !isEdit && id !== undefined;

  const [list, setList] = useState(getActiveInstitutions);
  const [search, setSearch] = useState('');
  const [toDelete, setToDelete] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    localStorage.setItem('institutions', JSON.stringify(list));
  }, [list]);

  const selectedInst = useMemo(() => {
    if (id && id !== 'new') {
      return list.find(item => item.id === Number(id)) || null;
    }
    return null;
  }, [id, list]);

  const nextCode = useMemo(() => {
    const maxId = list.length > 0 ? Math.max(...list.map(item => item.id)) : 0;
    return generateCode(maxId + 1);
  }, [list]);

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

  const handleSave = (form) => {
    if (isNew) {
      const maxId = list.length > 0 ? Math.max(...list.map(item => item.id)) : 0;
      const newInst = { ...form, id: maxId + 1 };
      setList((prev) => [newInst, ...prev]);
    } else {
      setList((prev) => prev.map((item) => item.id === form.id ? form : item));
    }
    navigate('/institutions');
  };

  const handleDelete = () => {
    setList((prev) => prev.filter((item) => item.id !== toDelete.id));
    setToDelete(null);
  };

  const activeCount = list.filter((item) => item.status === 'Active').length;
  const inactiveCount = list.filter((item) => item.status === 'Inactive').length;

  if (isNew || isEdit) {
    const formInst = selectedInst || null;
    return (
      <InstitutionFormPage
        mode={isNew ? 'add' : 'edit'}
        institution={formInst}
        nextCode={nextCode}
        onSave={handleSave}
        onCancel={() => navigate('/institutions')}
      />
    );
  }

  if (isView) {
    if (!selectedInst) {
      return (
        <DashboardLayout pageTitle="Institution Details">
          <div className="p-8 text-center text-gray-500">Institution not found.</div>
        </DashboardLayout>
      );
    }
    return (
      <InstitutionViewPage
        institution={selectedInst}
        onBack={() => navigate('/institutions')}
      />
    );
  }

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
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-550 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
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
              className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold text-gray-750 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>
        </div>

        {/* Table list */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
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
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-gray-750 dark:text-gray-300">{item.code}</td>
                      <td className="px-5 py-4 font-bold text-gray-900 dark:text-white">{item.name}</td>
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
