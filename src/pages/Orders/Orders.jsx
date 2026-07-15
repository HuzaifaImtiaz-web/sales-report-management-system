import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation, useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Pagination from '../../components/common/Pagination';
import Toast from '../../components/common/Toast';
import {
  FiSearch, FiFilter, FiEye, FiCheckCircle, FiX,
  FiClipboard, FiAlertTriangle, FiPlus, FiEdit2, FiTrash2,
  FiDownload, FiSave, FiInfo
} from 'react-icons/fi';

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
  'Dr. Ayesha Khan',
  'Dr. Hamid Raza',
  'Dr. Nadia Siddiqui',
  'Dr. Farhan Latif',
  'Dr. Saima Riaz',
  'Dr. Tariq Mehmood',
  'Dr. Bilal Aslam'
];

const INSTITUTIONS = [
  'Mayo Hospital',
  'Jinnah Hospital',
  'Shifa International',
  'Holy Family Hospital',
  'FIC Faisalabad',
  'Nishtar Hospital'
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

const TEAM_MEMBERS = [
  'Ahmed Shah',
  'Zainab Fatima',
  'Usman Ali',
  'Mariam Khan',
  'Bilal Siddiqui'
];

const INITIAL_ORDERS = [
  {
    id: 1,
    poNumber: 'PO-2026-0901',
    poDate: '2026-07-12',
    institution: 'Mayo Hospital',
    doctor: 'Dr. Ayesha Khan',
    area: 'Lahore Central',
    teamMember: 'Ahmed Shah',
    products: [
      { name: 'Amoxicillin 500mg', qty: 50, rate: 450 },
      { name: 'Paracetamol 650mg', qty: 100, rate: 120 }
    ],
    totalQty: 150,
    totalAmount: 34500,
    status: 'Pending',
    remarks: 'Urgent delivery required before 15 Jul.'
  },
  {
    id: 2,
    poNumber: 'PO-2026-0902',
    poDate: '2026-07-12',
    institution: 'Jinnah Hospital',
    doctor: 'Dr. Hamid Raza',
    area: 'Karachi South',
    teamMember: 'Zainab Fatima',
    products: [
      { name: 'Metformin 850mg', qty: 200, rate: 380 },
      { name: 'Lipitor 10mg', qty: 60, rate: 950 }
    ],
    totalQty: 260,
    totalAmount: 133000,
    status: 'Pending',
    remarks: 'Deliver to clinic annex, not main entrance.'
  },
  {
    id: 3,
    poNumber: 'PO-2026-0903',
    poDate: '2026-07-11',
    institution: 'Shifa International',
    doctor: 'Dr. Nadia Siddiqui',
    area: 'Islamabad F-10',
    teamMember: 'Usman Ali',
    products: [
      { name: 'Ibuprofen 400mg', qty: 80, rate: 90 },
      { name: 'Omeprazole 20mg', qty: 120, rate: 520 },
      { name: 'Crestor 10mg', qty: 40, rate: 1350 }
    ],
    totalQty: 240,
    totalAmount: 123600,
    status: 'Completed',
    remarks: 'Morning delivery preferred.'
  }
];

const StatusBadge = ({ status }) =>
  status === 'Completed' ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 dark:bg-green-900/30 text-feedback-success border border-green-100 dark:border-green-800/50">
      <span className="w-1.5 h-1.5 rounded-full bg-feedback-success inline-block" />
      Completed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-600 border border-amber-100 dark:border-amber-800/50">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse" />
      Pending
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
   transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-505
   focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40
   ${err ? 'border-feedback-error bg-red-50 dark:bg-red-900/10' : 'border-gray-100 dark:border-gray-700'}`;

/* ─── Edit Form Page ──────────────────────────────────────────────── */
const OrderEditPage = ({ order, onCancel, onSave }) => {
  const [form, setForm] = useState({ ...order });
  const [items, setItems] = useState(
    order.products.map((p) => {
      const found = PRODUCTS.find((pr) => pr.name === p.name);
      return {
        productId: found ? found.id : 1,
        quantity: p.qty,
        rate: p.rate
      };
    })
  );

  const handleProductChange = (index, prodId) => {
    const selectedProd = PRODUCTS.find((p) => p.id === Number(prodId));
    if (!selectedProd) return;
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: selectedProd.id,
      rate: selectedProd.rate
    };
    setItems(newItems);
  };

  const handleQtyChange = (index, qty) => {
    const newItems = [...items];
    newItems[index].quantity = Math.max(1, Number(qty) || 0);
    setItems(newItems);
  };

  const handleRateChange = (index, rate) => {
    const newItems = [...items];
    newItems[index].rate = Math.max(0, Number(rate) || 0);
    setItems(newItems);
  };

  const addRow = () => {
    setItems([...items, { productId: 1, quantity: 1, rate: 450 }]);
  };

  const removeRow = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleSave = () => {
    const updated = {
      ...form,
      products: items.map((it) => {
        const prod = PRODUCTS.find((p) => p.id === it.productId);
        return {
          name: prod ? prod.name : 'Unknown Product',
          qty: it.quantity,
          rate: it.rate
        };
      }),
      totalQty: items.reduce((sum, it) => sum + it.quantity, 0),
      totalAmount: items.reduce((sum, it) => sum + (it.quantity * it.rate), 0)
    };
    onSave(updated);
  };

  return (
    <DashboardLayout pageTitle="Edit Purchase Order">
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-555 hover:text-gray-700 transition-colors"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Edit Purchase Order</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5">Modify PO settings, items, and delivery preferences.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-sm p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="PO Number">
              <input
                type="text"
                value={form.poNumber}
                onChange={(e) => setForm({ ...form, poNumber: e.target.value })}
                className={inputCls(false) + ' font-semibold'}
              />
            </Field>

            <Field label="PO Date">
              <input
                type="date"
                value={form.poDate}
                onChange={(e) => setForm({ ...form, poDate: e.target.value })}
                className={inputCls(false) + ' font-semibold'}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Institution">
              <select
                value={form.institution}
                onChange={(e) => setForm({ ...form, institution: e.target.value })}
                className={inputCls(false) + ' appearance-none cursor-pointer'}
              >
                {INSTITUTIONS.map((inst) => (
                  <option key={inst} value={inst}>{inst}</option>
                ))}
              </select>
            </Field>

            <Field label="Doctor">
              <select
                value={form.doctor}
                onChange={(e) => setForm({ ...form, doctor: e.target.value })}
                className={inputCls(false) + ' appearance-none cursor-pointer'}
              >
                {DOCTORS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Area">
              <select
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                className={inputCls(false) + ' appearance-none cursor-pointer'}
              >
                {AREAS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </Field>

            <Field label="Team Member">
              <select
                value={form.teamMember}
                onChange={(e) => setForm({ ...form, teamMember: e.target.value })}
                className={inputCls(false) + ' appearance-none cursor-pointer'}
              >
                {TEAM_MEMBERS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className={inputCls(false) + ' appearance-none cursor-pointer'}
            >
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </Field>

          <Field label="Remarks">
            <textarea
              rows={2}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              className={inputCls(false) + ' resize-none'}
              placeholder="Add specific instructions or delivery details..."
            />
          </Field>

          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-xs font-bold text-gray-800 dark:text-gray-205 uppercase tracking-wider">Order Items</h3>
              <button
                type="button"
                onClick={addRow}
                className="px-3 py-1.5 bg-brand-primary text-white text-[10px] font-bold rounded-lg hover:bg-brand-primaryDark shadow-sm hover:shadow transition-all"
              >
                + Add Product
              </button>
            </div>

            <div className="space-y-3">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-gray-55 dark:bg-gray-850 p-3 rounded-xl border border-gray-100/50 dark:border-gray-800/50">
                  <div className="md:col-span-5">
                    <label className="block md:hidden text-[9px] text-gray-400 font-bold uppercase mb-1">Product</label>
                    <select
                      value={it.productId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded text-xs"
                    >
                      {PRODUCTS.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block md:hidden text-[9px] text-gray-400 font-bold uppercase mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={it.quantity}
                      onChange={(e) => handleQtyChange(idx, e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded text-xs text-center font-semibold"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block md:hidden text-[9px] text-gray-400 font-bold uppercase mb-1">Rate (Rs)</label>
                    <input
                      type="number"
                      min="0"
                      value={it.rate}
                      onChange={(e) => handleRateChange(idx, e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded text-xs text-center font-semibold"
                    />
                  </div>
                  <div className="md:col-span-2 text-right font-bold text-brand-primary">
                    Rs {(it.quantity * it.rate).toLocaleString()}
                  </div>
                  <div className="md:col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      disabled={items.length <= 1}
                      className="text-feedback-error disabled:opacity-30 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                      title="Remove Item"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-305 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-150"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <FiSave className="w-3.5 h-3.5" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

/* ─── Details View Page ────────────────────────────────────────────── */
const OrderDetailsPage = ({ order, onBack }) => {
  return (
    <DashboardLayout pageTitle="Order Details">
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">{order.poNumber}</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5">{order.poDate}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                <FiClipboard className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                Purchase Order details
              </h2>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'PO Number', value: order.poNumber, fontMono: true },
              { label: 'PO Date', value: order.poDate },
              { label: 'Institution', value: order.institution || '—' },
              { label: 'Doctor', value: order.doctor },
              { label: 'Area', value: order.area },
              { label: 'Team Member', value: order.teamMember },
              { label: 'Total Items', value: order.products ? order.products.length : 0 },
              { label: 'Total Vials', value: order.totalQty || 0 },
              { label: 'Total Amount', value: `Rs ${order.totalAmount.toLocaleString()}`, highlight: true }
            ].map(({ label, value, fontMono, highlight }) => (
              <div key={label} className="bg-gray-55 dark:bg-gray-800/40 p-3 rounded-lg border border-gray-100/50 dark:border-gray-800/50">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</p>
                <p className={`text-xs font-semibold mt-1 ${fontMono ? 'font-mono' : ''} ${highlight ? 'text-brand-primary font-bold' : 'text-gray-800 dark:text-gray-200'}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-205 uppercase tracking-wider mb-2.5">
              Order Items List
            </h3>
            <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-xs" aria-label="Purchase Order Items">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-150 dark:border-gray-800 text-[10px] font-bold text-gray-500 dark:text-gray-405 uppercase">
                    <th className="text-left px-4 py-3">Product Name</th>
                    <th className="text-right px-4 py-3">Qty</th>
                    <th className="text-right px-4 py-3">Rate</th>
                    <th className="text-right px-4 py-3">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {order.products.map((p, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-gray-700 dark:text-gray-300">{p.name}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-gray-900 dark:text-white">{p.qty}</td>
                      <td className="px-4 py-2.5 text-right text-gray-500 dark:text-gray-400">Rs {p.rate.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-brand-primary">Rs {(p.qty * p.rate).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {order.remarks && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-4 flex items-start gap-2.5 text-amber-800 dark:text-amber-500">
              <FiInfo className="w-4 h-4 text-amber-600 dark:text-amber-550 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5">Remarks / Delivery Notes</p>
                <p className="text-xs font-medium italic">"{order.remarks}"</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end pt-6 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={onBack}
              className="px-5 py-2 text-xs font-bold text-gray-655 dark:text-gray-405 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-305 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-150"
            >
              Back to List
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

/* ─── Delete Dialog ──────────────────────────────────────────────── */
const DeleteDialog = ({ order, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-[#0f172a] border dark:border-gray-800 rounded-enterprise shadow-2xl w-full max-w-md animate-slide-up">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
          <FiAlertTriangle className="w-5 h-5 text-feedback-error" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Delete Order</h2>
          <p className="text-[11px] text-gray-400 font-medium mt-0.5">{order.poNumber}</p>
        </div>
      </div>
      <div className="px-6 py-5">
        <p className="text-sm text-gray-755 dark:text-gray-303">
          Are you sure you want to delete Purchase Order <span className="font-bold">{order.poNumber}</span>?
        </p>
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-enterprise">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs font-bold text-gray-650 dark:text-gray-405 bg-white dark:bg-gray-800 border border-gray-250 rounded-lg hover:bg-gray-55"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-xs font-bold text-white bg-feedback-error rounded-lg hover:bg-red-650 transition-colors flex items-center gap-1.5"
        >
          <FiTrash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    </div>
  </div>
);

/* ─── Main Component ─────────────────────────────────────────────── */
const Orders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  // Load from localStorage or seed with defaults
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('himmel_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [toast, setToast] = useState(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // All, Pending, Completed
  const [dateFilter, setDateFilter] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [teamMemberFilter, setTeamMemberFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');

  const [toDelete, setToDelete] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const isEdit = location.pathname.endsWith('/edit');
  const isView = !isEdit && id !== undefined;

  const currentOrder = useMemo(() => {
    if (!id) return null;
    return orders.find((o) => o.id === Number(id)) || null;
  }, [orders, id]);

  // Persist list changes helper
  const saveOrdersList = (newList) => {
    setOrders(newList);
    localStorage.setItem('himmel_orders', JSON.stringify(newList));
  };

  // If there's a search param redirect or specific PO filter
  useEffect(() => {
    const selectPo = searchParams.get('poNumber');
    if (selectPo) {
      setSearch(selectPo);
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orders.filter((o) => {
      // Basic Search: PO Number, Doctor, Area
      const matchSearch = !q ||
        o.poNumber.toLowerCase().includes(q) ||
        o.doctor.toLowerCase().includes(q) ||
        o.area.toLowerCase().includes(q);

      // Status
      const matchStatus = statusFilter === 'All' || o.status === statusFilter;

      // Other filters
      const matchDate = !dateFilter || o.poDate === dateFilter;
      const matchInstitution = !institutionFilter || o.institution === institutionFilter;
      const matchDoctor = !doctorFilter || o.doctor === doctorFilter;
      const matchArea = !areaFilter || o.area === areaFilter;
      const matchTeamMember = !teamMemberFilter || o.teamMember === teamMemberFilter;
      
      const matchProduct = !productFilter || o.products.some((p) => p.name === productFilter);

      return matchSearch && matchStatus && matchDate && matchInstitution && matchDoctor && matchArea && matchTeamMember && matchProduct;
    });
  }, [orders, search, statusFilter, dateFilter, institutionFilter, doctorFilter, areaFilter, teamMemberFilter, productFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginated = useMemo(() => filtered.slice(startIndex, startIndex + itemsPerPage), [filtered, startIndex, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dateFilter, institutionFilter, doctorFilter, areaFilter, teamMemberFilter, productFilter]);

  const handleMarkCompleted = (po) => {
    const updated = orders.map((o) => o.id === po.id ? { ...o, status: 'Completed' } : o);
    saveOrdersList(updated);
    setToast({ message: 'Purchase Order marked as Completed.', type: 'success' });
  };

  const handleSaveEdit = (updatedPO) => {
    const updated = orders.map((o) => o.id === updatedPO.id ? updatedPO : o);
    saveOrdersList(updated);
    navigate('/orders');
    setToast({ message: 'Purchase Order updated successfully.', type: 'success' });
  };

  const handleDelete = () => {
    const updated = orders.filter((o) => o.id !== toDelete.id);
    saveOrdersList(updated);
    setToDelete(null);
    setToast({ message: 'Purchase Order deleted successfully.', type: 'success' });
  };

  const handleExport = (po) => {
    navigate(`/export?poNumber=${po.poNumber}`);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setDateFilter('');
    setInstitutionFilter('');
    setDoctorFilter('');
    setAreaFilter('');
    setTeamMemberFilter('');
    setProductFilter('');
  };

  const hasActiveFilters = search || statusFilter !== 'All' || dateFilter || institutionFilter || doctorFilter || areaFilter || teamMemberFilter || productFilter;

  if (isEdit && currentOrder) {
    return (
      <OrderEditPage
        order={currentOrder}
        onCancel={() => navigate('/orders')}
        onSave={handleSaveEdit}
      />
    );
  }

  if (isView && currentOrder) {
    return (
      <OrderDetailsPage
        order={currentOrder}
        onBack={() => navigate('/orders')}
      />
    );
  }

  return (
    <DashboardLayout pageTitle="Orders">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">Orders</h1>
            <p className="text-xs text-gray-405 dark:text-gray-500 font-medium mt-1">Track and manage all purchase orders.</p>
          </div>
          <div>
            <button
              onClick={() => navigate('/sales')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-primaryDark transition-all"
            >
              <FiPlus className="w-4 h-4" />
              New Order
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-soft p-5 space-y-4">
          {/* Main search and Tab status filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by PO Number, Doctor, Area..."
                className="w-full pl-10 pr-4 py-2 text-xs font-semibold text-gray-705 dark:text-gray-205 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>
            
            <div className="flex bg-gray-100 dark:bg-gray-850 p-1 rounded-lg">
              {['All', 'Pending', 'Completed'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    statusFilter === s
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of advanced filters */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div>
              <label className="block text-[8px] font-bold text-gray-450 uppercase mb-1">Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 bg-gray-55 dark:bg-gray-800 text-xs rounded"
              />
            </div>
            <div>
              <label className="block text-[8px] font-bold text-gray-455 uppercase mb-1">Institution</label>
              <select
                value={institutionFilter}
                onChange={(e) => setInstitutionFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 bg-gray-55 dark:bg-gray-800 text-xs rounded cursor-pointer"
              >
                <option value="">All</option>
                {INSTITUTIONS.map((inst) => (
                  <option key={inst} value={inst}>{inst}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[8px] font-bold text-gray-455 uppercase mb-1">Doctor</label>
              <select
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 bg-gray-55 dark:bg-gray-800 text-xs rounded cursor-pointer"
              >
                <option value="">All</option>
                {DOCTORS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[8px] font-bold text-gray-455 uppercase mb-1">Area</label>
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 bg-gray-55 dark:bg-gray-800 text-xs rounded cursor-pointer"
              >
                <option value="">All</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[8px] font-bold text-gray-455 uppercase mb-1">Team Member</label>
              <select
                value={teamMemberFilter}
                onChange={(e) => setTeamMemberFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 bg-gray-55 dark:bg-gray-800 text-xs rounded cursor-pointer"
              >
                <option value="">All</option>
                {TEAM_MEMBERS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[8px] font-bold text-gray-455 uppercase mb-1">Product</label>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 bg-gray-55 dark:bg-gray-800 text-xs rounded cursor-pointer"
              >
                <option value="">All</option>
                {PRODUCTS.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex justify-end pt-1">
              <button
                onClick={handleClearFilters}
                className="px-3 py-1.5 text-[10px] font-bold border border-gray-200 dark:border-gray-700 rounded text-gray-550 hover:bg-gray-50 flex items-center gap-1"
              >
                <FiX className="w-3 h-3" /> Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Orders Table */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-150 dark:border-gray-800 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  {['PO Number', 'Date', 'Institution', 'Doctor', 'Area', 'Team Member', 'Total Products', 'Total Vials', 'Total Amount', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-5 py-12 text-center text-gray-455 font-bold">
                      No purchase orders found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((po) => (
                    <tr key={po.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-gray-800 dark:text-gray-200">{po.poNumber}</td>
                      <td className="px-5 py-4 whitespace-nowrap">{po.poDate}</td>
                      <td className="px-5 py-4 font-bold text-gray-850 dark:text-white">{po.institution || '—'}</td>
                      <td className="px-5 py-4 whitespace-nowrap">{po.doctor}</td>
                      <td className="px-5 py-4 whitespace-nowrap">{po.area}</td>
                      <td className="px-5 py-4 whitespace-nowrap">{po.teamMember}</td>
                      <td className="px-5 py-4 text-center font-semibold">{po.products ? po.products.length : 0}</td>
                      <td className="px-5 py-4 text-right font-semibold">{po.totalQty || 0}</td>
                      <td className="px-5 py-4 text-right font-extrabold text-brand-primary whitespace-nowrap">Rs {(po.totalAmount || 0).toLocaleString()}</td>
                      <td className="px-5 py-4"><StatusBadge status={po.status} /></td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/orders/${po.id}`)}
                            className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-650 rounded text-[10px] font-bold"
                          >
                            View
                          </button>
                          <button
                            onClick={() => navigate(`/orders/${po.id}/edit`)}
                            className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded text-[10px] font-bold"
                          >
                            Edit
                          </button>
                          {po.status === 'Pending' && (
                            <button
                              onClick={() => handleMarkCompleted(po)}
                              className="px-2.5 py-1.5 bg-green-50 dark:bg-green-900/20 text-feedback-success rounded text-[10px] font-bold"
                            >
                              Mark Completed
                            </button>
                          )}
                          <button
                            onClick={() => handleExport(po)}
                            className="px-2.5 py-1.5 bg-gray-55 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded text-[10px] font-bold inline-flex items-center gap-0.5"
                          >
                            <FiDownload className="w-2.5 h-2.5" /> Export
                          </button>
                          <button
                            onClick={() => setToDelete(po)}
                            className="px-2.5 py-1.5 bg-red-50 dark:bg-red-900/20 text-feedback-error rounded text-[10px] font-bold"
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
          order={toDelete}
          onCancel={() => setToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </DashboardLayout>
  );
};

export default Orders;
