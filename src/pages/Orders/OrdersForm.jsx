import React, { useState, useMemo, useEffect } from 'react';
import { FiPlus, FiTrash2, FiSave, FiInfo } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Field = ({ label, required, error, children }) => (
  <div>
    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-550 dark:text-gray-400 mb-1.5">
      {label} {required && <span className="text-feedback-error">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-feedback-error font-semibold mt-1">{error}</p>}
  </div>
);

const inputCls = (err, disabled) =>
  `w-full px-3 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-205 bg-gray-55 dark:bg-gray-805 border rounded-lg outline-none
   transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-500
   focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40
   ${err ? 'border-feedback-error bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700'}
   ${disabled ? 'opacity-70 cursor-default bg-gray-100/50 dark:bg-gray-800/30' : ''}`;

export default function OrdersForm({
  mode,
  item,
  products = [],
  doctors = [],
  institutions = [],
  areas = [],
  teamMembers = [],
  onSave,
  onCancel
}) {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const navigate = useNavigate();

  const [form, setForm] = useState({
    poNumber: '',
    poDate: '',
    institution: '',
    doctor: '',
    area: '',
    teamMember: '',
    status: 'Pending',
    remarks: ''
  });

  const [items, setItems] = useState([
    { productId: 1, quantity: 1, rate: 450 }
  ]);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (item && products.length > 0) {
      setForm({ ...item });
      if (item.products) {
        setItems(
          item.products.map((p) => {
            const found = products.find((pr) => pr.name === p.name);
            return {
              productId: found ? found.id : (products[0]?.id || 1),
              quantity: p.qty,
              rate: p.rate
            };
          })
        );
      }
    }
  }, [item, products]);

  const handleProductChange = (index, prodId) => {
    if (isView) return;
    const selectedProd = products.find((p) => p.id === Number(prodId));
    if (!selectedProd) return;
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: selectedProd.id,
      rate: selectedProd.rate || selectedProd.packPrice || 0
    };
    setItems(newItems);
  };

  const handleQtyChange = (index, qty) => {
    if (isView) return;
    const newItems = [...items];
    newItems[index].quantity = Math.max(1, Number(qty) || 0);
    setItems(newItems);
  };

  const handleRateChange = (index, rate) => {
    if (isView) return;
    const newItems = [...items];
    newItems[index].rate = Math.max(0, Number(rate) || 0);
    setItems(newItems);
  };

  const addRow = () => {
    if (isView) return;
    const firstProd = products[0] || { id: 1, rate: 450 };
    setItems([...items, { productId: firstProd.id, quantity: 1, rate: firstProd.rate || firstProd.packPrice || 450 }]);
  };

  const removeRow = (index) => {
    if (isView) return;
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const validate = () => {
    const e = {};
    if (!form.poNumber.trim()) e.poNumber = 'PO Number is required.';
    if (!form.poDate) e.poDate = 'PO Date is required.';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    const updated = {
      ...form,
      products: items.map((it) => {
        const prod = products.find((p) => p.id === it.productId);
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

  if (isView) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'PO Number', value: form.poNumber, fontMono: true },
            { label: 'PO Date', value: form.poDate },
            { label: 'Institution', value: form.institution || '—' },
            { label: 'Doctor', value: form.doctor },
            { label: 'Area', value: form.area },
            { label: 'Team Member', value: form.teamMember },
            { label: 'Total Items', value: items.length },
            { label: 'Total Vials', value: items.reduce((s, i) => s + i.quantity, 0) },
            { label: 'Total Amount', value: `Rs ${items.reduce((s, i) => s + (i.quantity * i.rate), 0).toLocaleString()}`, highlight: true }
          ].map(({ label, value, fontMono, highlight }) => (
            <div key={label} className="bg-gray-55 dark:bg-gray-800/40 p-3 rounded-lg border border-gray-100/50 dark:border-gray-800/50">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</p>
              <p className={`text-xs font-semibold mt-1 ${fontMono ? 'font-mono' : ''} ${highlight ? 'text-brand-primary font-bold' : 'text-gray-800 dark:text-gray-205'}`}>
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
                {items.map((it, idx) => {
                  const prod = products.find((p) => p.id === it.productId) || {};
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-gray-700 dark:text-gray-300">{prod.name || '—'}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-gray-900 dark:text-white">{it.quantity}</td>
                      <td className="px-4 py-2.5 text-right text-gray-500 dark:text-gray-400">Rs {it.rate.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-brand-primary">Rs {(it.quantity * it.rate).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {form.remarks && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-4 flex items-start gap-2.5 text-amber-800 dark:text-amber-500">
            <FiInfo className="w-4 h-4 text-amber-600 dark:text-amber-550 shrink-0 mt-0.5" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5">Remarks / Delivery Notes</p>
              <p className="text-xs font-medium italic">"{form.remarks}"</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-55 transition-colors"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => navigate(`/orders/${form.id}/edit`)}
            className="px-5 py-2 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm flex items-center gap-1.5"
          >
            Edit Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="PO Number" required error={errors.poNumber}>
          <input
            type="text"
            value={form.poNumber}
            onChange={(e) => setForm({ ...form, poNumber: e.target.value })}
            className={inputCls(errors.poNumber, false) + ' font-semibold'}
          />
        </Field>

        <Field label="PO Date" required error={errors.poDate}>
          <input
            type="date"
            value={form.poDate}
            onChange={(e) => setForm({ ...form, poDate: e.target.value })}
            className={inputCls(errors.poDate, false) + ' font-semibold'}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Institution">
          <select
            value={form.institution}
            onChange={(e) => setForm({ ...form, institution: e.target.value })}
            className={inputCls(false, false) + ' appearance-none cursor-pointer'}
          >
            <option value="">Select Institution…</option>
            {institutions.map((inst) => (
              <option key={inst.id || inst.name || inst} value={inst.name || inst}>{inst.name || inst}</option>
            ))}
          </select>
        </Field>

        <Field label="Doctor">
          <select
            value={form.doctor}
            onChange={(e) => setForm({ ...form, doctor: e.target.value })}
            className={inputCls(false, false) + ' appearance-none cursor-pointer'}
          >
            <option value="">Select Doctor…</option>
            {doctors.map((d) => (
              <option key={d.id || d.name || d} value={d.name || d}>{d.name || d}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Area">
          <select
            value={form.area}
            onChange={(e) => setForm({ ...form, area: e.target.value })}
            className={inputCls(false, false) + ' appearance-none cursor-pointer'}
          >
            <option value="">Select Area…</option>
            {areas.map((a) => (
              <option key={a.id || a.name || a} value={a.name || a}>{a.name || a}</option>
            ))}
          </select>
        </Field>

        <Field label="Team Member">
          <select
            value={form.teamMember}
            onChange={(e) => setForm({ ...form, teamMember: e.target.value })}
            className={inputCls(false, false) + ' appearance-none cursor-pointer'}
          >
            <option value="">Select Team Member…</option>
            {teamMembers.map((t) => (
              <option key={t.id || t.name || t} value={t.name || t}>{t.name || t}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Status">
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className={inputCls(false, false) + ' appearance-none cursor-pointer'}
        >
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
        </select>
      </Field>

      <Field label="Remarks">
        <textarea
          rows={2}
          value={form.remarks || ''}
          onChange={(e) => setForm({ ...form, remarks: e.target.value })}
          className={inputCls(false, false) + ' resize-none'}
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
            <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-gray-55 dark:bg-gray-855 p-3 rounded-xl border border-gray-100/50 dark:border-gray-800/50">
              <div className="md:col-span-5">
                <label className="block md:hidden text-[9px] text-gray-400 font-bold uppercase mb-1">Product</label>
                <select
                  value={it.productId}
                  onChange={(e) => handleProductChange(idx, e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded text-xs"
                >
                  {products.map((p) => (
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
                  className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-805 rounded text-xs text-center font-semibold"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block md:hidden text-[9px] text-gray-400 font-bold uppercase mb-1">Rate (Rs)</label>
                <input
                  type="number"
                  min="0"
                  value={it.rate}
                  onChange={(e) => handleRateChange(idx, e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-805 rounded text-xs text-center font-semibold"
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
          className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-55 transition-colors"
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
  );
}
