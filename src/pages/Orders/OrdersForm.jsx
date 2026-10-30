import React, { useState, useMemo, useEffect } from 'react';
import { FiTrash2, FiSave, FiAlertCircle, FiCheck, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useUnsavedChanges } from '../../context/UnsavedChangesContext';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from './StatusBadge';

const Field = ({ label, required, error, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
      {label} {required && <span className="text-feedback-error">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-feedback-error font-semibold mt-1">{error}</p>}
  </div>
);

const STEPS = ['Customer', 'Products', 'Review'];

const Stepper = ({ step, onStep }) => (
  <ol aria-label="Steps" className="flex flex-wrap items-center gap-3 text-sm">
    {STEPS.map((label, i) => {
      const done = i < step;
      const current = i === step;
      return (
        <React.Fragment key={label}>
          {i > 0 && <li aria-hidden="true" className="hidden sm:block w-10 h-px bg-line dark:bg-brand-navyLine" />}
          <li>
            <button
              type="button"
              onClick={() => onStep(i)}
              aria-current={current ? 'step' : undefined}
              className={`flex items-center gap-2.5 rounded-lg px-1 py-1 ${current ? 'font-semibold text-brand-primary dark:text-brand-primaryBright' : done ? 'text-ink dark:text-white' : 'text-muted dark:text-gray-400'}`}
            >
              <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs ${
                done ? 'bg-feedback-success text-white' : current ? 'bg-brand-primary text-white' : 'border border-gray-300 dark:border-brand-navyLine'
              }`}>
                {done ? <FiCheck className="w-3.5 h-3.5" /> : i + 1}
              </span>
              {label}
            </button>
          </li>
        </React.Fragment>
      );
    })}
  </ol>
);

const ReviewRow = ({ label, value }) => (
  <div className="flex justify-between gap-4 py-2.5 border-b border-line dark:border-brand-navyLine last:border-0 text-sm">
    <dt className="text-muted dark:text-gray-400">{label}</dt>
    <dd className="font-medium text-ink dark:text-white text-right">{value || '—'}</dd>
  </div>
);

const ReadOnlyValue = ({ value }) => (
  <div className="px-3 py-2 border border-gray-200 dark:border-brand-navyLine bg-gray-50 dark:bg-brand-navy/60 rounded-lg text-xs font-medium text-gray-800 dark:text-gray-200">
    {value || '—'}
  </div>
);

const inputCls = (err, disabled) =>
  `w-full px-3 py-2.5 text-xs font-medium text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-brand-navy border rounded-lg outline-none
   transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-500
   focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40
   ${err ? 'border-feedback-error bg-red-50 dark:bg-red-950/20' : 'border-gray-200 dark:border-brand-navyLine'}
   ${disabled ? 'opacity-75 cursor-not-allowed bg-gray-100 dark:bg-brand-navy' : ''}`;

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
  const navigate = useNavigate();
  const { setIsDirty } = useUnsavedChanges();
  // Only managers and administrators sell away from the trade price (the server enforces this too).
  const { hasPermission } = useAuth();
  const canChangePrice = hasPermission('orders.changePrice');

  const [form, setForm] = useState({
    id: '',
    poNumber: '',
    poDate: new Date().toISOString().split('T')[0],
    institutionId: '',
    doctorId: '',
    areaId: '',
    teamMemberId: '',
    status: 'Pending',
    remarks: ''
  });

  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [step, setStep] = useState(0);

  // Lock status checks: Completed or Cancelled orders are read-only
  const isCompleted = form.status === 'Completed';
  const isCancelled = form.status === 'Cancelled';
  const isReadOnly = isView || isCompleted || isCancelled;

  const displayInstitution = useMemo(() => {
    const inst = institutions.find(i => i.id === Number(form.institutionId));
    return inst ? inst.name : '—';
  }, [form.institutionId, institutions]);

  const displayDoctor = useMemo(() => {
    const doc = doctors.find(d => d.id === Number(form.doctorId));
    return doc ? doc.name : '—';
  }, [form.doctorId, doctors]);

  const displayArea = useMemo(() => {
    const ar = areas.find(a => a.id === Number(form.areaId));
    return ar ? ar.name : '—';
  }, [form.areaId, areas]);

  const displayTeamMember = useMemo(() => {
    const tm = teamMembers.find(t => t.id === Number(form.teamMemberId));
    return tm ? tm.name : '—';
  }, [form.teamMemberId, teamMembers]);

  const updateForm = (updater) => {
    setForm(updater);
    setIsDirty(true);
  };

  const updateItems = (updater) => {
    setItems(updater);
    setIsDirty(true);
    setDuplicateWarning('');
  };

  useEffect(() => {
    if (item && products.length > 0) {
      setForm({
        id: item.id || '',
        poNumber: item.poNumber || '',
        poDate: item.poDate || '',
        institutionId: item.institutionId || '',
        doctorId: item.doctorId || '',
        areaId: item.areaId || '',
        teamMemberId: item.teamMemberId || '',
        status: item.status || 'Pending',
        remarks: item.remarks || ''
      });
      if (item.products && item.products.length > 0) {
        setItems(
          item.products.map((p) => {
            const masterP = products.find(prod => prod.id === p.productId) || {};
            return {
              productId: p.productId || masterP.id || (products[0]?.id || 1),
              quantity: p.qty || 1,
              rate: p.rate !== undefined ? p.rate : (masterP.tp || masterP.packPrice || 0)
            };
          })
        );
      } else {
        const firstP = products[0];
        setItems([{
          productId: firstP.id,
          quantity: 1,
          rate: firstP.tp !== undefined ? firstP.tp : (firstP.packPrice || 0)
        }]);
      }
    } else if (!item && products.length > 0 && items.length === 0) {
      const firstP = products[0];
      setItems([{
        productId: firstP.id,
        quantity: 1,
        rate: firstP.tp !== undefined ? firstP.tp : (firstP.packPrice || 0)
      }]);
    }
  }, [item, products]);

  const grandTotal = useMemo(() => {
    return items.reduce((acc, it) => acc + Number(it.quantity || 0) * Number(it.rate || 0), 0);
  }, [items]);

  const handleProductChange = (index, prodIdStr) => {
    if (isReadOnly) return;
    const prodId = Number(prodIdStr);
    const pMaster = products.find(p => p.id === prodId);
    
    // Check duplicates
    const exists = items.some((it, i) => i !== index && Number(it.productId) === prodId);
    if (exists && pMaster) {
      setDuplicateWarning(`Product '${pMaster.brandName || pMaster.name}' is already added in another row.`);
    } else {
      setDuplicateWarning('');
    }

    const rate = pMaster ? (pMaster.tp !== undefined ? pMaster.tp : (pMaster.packPrice || 0)) : 0;
    const next = [...items];
    next[index] = {
      ...next[index],
      productId: prodId,
      rate: rate
    };
    updateItems(next);
  };

  const handleRateChange = (index, rateVal) => {
    if (isReadOnly) return;
    const rate = parseFloat(rateVal) >= 0 ? parseFloat(rateVal) : 0;
    const next = [...items];
    next[index] = { ...next[index], rate: rate };
    updateItems(next);
  };

  const handleQtyChange = (index, qtyVal) => {
    if (isReadOnly) return;
    const qty = parseInt(qtyVal, 10) || 0;
    const next = [...items];
    next[index] = { ...next[index], quantity: qty };
    updateItems(next);
  };

  const addRow = () => {
    if (isReadOnly) return;
    const firstP = products[0];
    if (!firstP) return;
    const rate = firstP.tp !== undefined ? firstP.tp : (firstP.packPrice || 0);
    updateItems([...items, { productId: firstP.id, quantity: 1, rate: rate }]);
  };

  const removeRow = (index) => {
    if (isReadOnly || items.length <= 1) return;
    updateItems(items.filter((_, i) => i !== index));
  };

  const collectErrors = () => {
    const errs = {};
    if (!form.poNumber.trim()) errs.poNumber = 'PO Number is required.';
    if (!form.poDate) errs.poDate = 'Order Date is required.';
    if (!form.teamMemberId) errs.teamMemberId = 'Team Member is required.';
    if (items.length === 0) errs.items = 'At least one product is required.';

    items.forEach((it, idx) => {
      if (!it.productId) errs[`product_${idx}`] = 'Product is required.';
      if (it.quantity <= 0) errs[`qty_${idx}`] = 'Quantity must be > 0.';
      if (it.rate < 0) errs[`rate_${idx}`] = 'Selling price must be >= 0.';
    });

    return errs;
  };

  const hasDetailErrors = (errs) => ['poNumber', 'poDate', 'teamMemberId'].some((k) => errs[k]);

  // Moving forward checks the steps in between; going back is always allowed.
  const goToStep = (target) => {
    if (target <= step) {
      setStep(target);
      return;
    }
    const errs = collectErrors();
    setErrors(errs);
    if (hasDetailErrors(errs)) {
      setStep(0);
      return;
    }
    if (target === 2 && Object.keys(errs).length > 0) {
      setStep(1);
      return;
    }
    setStep(target);
  };

  const handleSaveOrder = () => {
    const errs = collectErrors();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setStep(hasDetailErrors(errs) ? 0 : 1);
      return;
    }
    const payload = {
      ...form,
      status: form.status || 'Pending',
      products: items.map(it => ({
        productId: it.productId,
        qty: it.quantity,
        rate: it.rate
      }))
    };
    onSave(payload);
  };

  return (
    <div className="space-y-6">
      {!isReadOnly && <Stepper step={step} onStep={goToStep} />}

      {/* Workflow Status Banner */}
      {mode !== 'add' && (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 dark:bg-brand-navy/50 rounded-xl border border-gray-200 dark:border-brand-navyLine gap-3">
        <div className="flex items-center gap-3">
          <StatusBadge status={form.status} />
          <div>
            <span className="text-xs font-mono font-semibold text-gray-900 dark:text-white">{form.poNumber || 'New Order'}</span>
            <p className="text-[11px] text-gray-500 font-medium">
              {form.status === 'Pending' && 'Order entered and pending processing in Sales module.'}
              {form.status === 'Completed' && 'Order completed and finalized.'}
              {form.status === 'Cancelled' && 'Order cancelled.'}
            </p>
          </div>
        </div>
      </div>
      )}

      {item?.cancelReason && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl text-xs text-rose-700 dark:text-rose-300 space-y-1">
          <strong className="font-semibold flex items-center gap-1">
            <FiAlertCircle className="w-4 h-4" /> Cancellation Reason:
          </strong>
          <p>{item.cancelReason}</p>
        </div>
      )}

      {duplicateWarning && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <FiAlertCircle className="w-4 h-4 shrink-0" />
          <span>{duplicateWarning}</span>
        </div>
      )}

      {(isReadOnly || step === 0) && (<>
      {/* Main Order Details Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="PO Number" required error={errors.poNumber}>
          <input
            type="text"
            value={form.poNumber}
            onChange={(e) => updateForm({ ...form, poNumber: e.target.value })}
            className={inputCls(errors.poNumber, isReadOnly) + ' font-mono'}
            placeholder="e.g. PO-2026-001"
            disabled={isReadOnly}
          />
        </Field>

        <Field label="Order Date" required error={errors.poDate}>
          <input
            type="date"
            value={form.poDate}
            onChange={(e) => updateForm({ ...form, poDate: e.target.value })}
            className={inputCls(errors.poDate, isReadOnly)}
            disabled={isReadOnly}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Institution">
          {isReadOnly ? (
            <ReadOnlyValue value={displayInstitution} />
          ) : (
            <div>
              <select
                value={form.institutionId}
                onChange={(e) => updateForm({ ...form, institutionId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-brand-navyLine bg-white dark:bg-brand-navy text-gray-800 dark:text-gray-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                <option value="" className="bg-white dark:bg-brand-navyCard text-gray-800 dark:text-gray-200">Select Institution</option>
                {institutions
                  .filter(i => i.status === 'Active' || form.institutionId === String(i.id))
                  .map(i => (
                    <option key={i.id} value={i.id} className="bg-white dark:bg-brand-navyCard text-gray-800 dark:text-gray-200">{i.name}</option>
                  ))}
              </select>
              {form.institutionId && !institutions.some(i => String(i.id) === String(form.institutionId)) && (
                <div className="text-xs text-amber-600 font-semibold flex items-center gap-1 mt-1">
                  Institution not found.{' '}
                  <button type="button" onClick={() => navigate('/institutions/new')} className="underline text-brand-primary font-semibold">
                    Create New Institution
                  </button>
                </div>
              )}
            </div>
          )}
        </Field>

        <Field label="Doctor">
          {isReadOnly ? (
            <ReadOnlyValue value={displayDoctor} />
          ) : (
            <div>
              <select
                value={form.doctorId}
                onChange={(e) => updateForm({ ...form, doctorId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-brand-navyLine bg-white dark:bg-brand-navy text-gray-800 dark:text-gray-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                <option value="" className="bg-white dark:bg-brand-navyCard text-gray-800 dark:text-gray-200">Select Doctor</option>
                {doctors
                  .filter(d => d.status === 'Active' || form.doctorId === String(d.id))
                  .map(d => (
                    <option key={d.id} value={d.id} className="bg-white dark:bg-brand-navyCard text-gray-800 dark:text-gray-200">{d.name}</option>
                  ))}
              </select>
              {form.doctorId && !doctors.some(d => String(d.id) === String(form.doctorId)) && (
                <div className="text-xs text-amber-600 font-semibold flex items-center gap-1 mt-1">
                  Doctor not found.{' '}
                  <button type="button" onClick={() => navigate('/doctors/new')} className="underline text-brand-primary font-semibold">
                    Create New Doctor
                  </button>
                </div>
              )}
            </div>
          )}
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Area">
          {isReadOnly ? (
            <ReadOnlyValue value={displayArea} />
          ) : (
            <div>
              <select
                value={form.areaId}
                onChange={(e) => updateForm({ ...form, areaId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-brand-navyLine bg-white dark:bg-brand-navy text-gray-800 dark:text-gray-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                <option value="" className="bg-white dark:bg-brand-navyCard text-gray-800 dark:text-gray-200">Select Area</option>
                {areas
                  .filter(a => a.status === 'Active' || form.areaId === String(a.id))
                  .map(a => (
                    <option key={a.id} value={a.id} className="bg-white dark:bg-brand-navyCard text-gray-800 dark:text-gray-200">{a.name}</option>
                  ))}
              </select>
              {form.areaId && !areas.some(a => String(a.id) === String(form.areaId)) && (
                <div className="text-xs text-amber-600 font-semibold flex items-center gap-1 mt-1">
                  Area not found.{' '}
                  <button type="button" onClick={() => navigate('/areas/new')} className="underline text-brand-primary font-semibold">
                    Create New Area
                  </button>
                </div>
              )}
            </div>
          )}
        </Field>

        <Field label="Team Member" required error={errors.teamMemberId}>
          {isReadOnly ? (
            <ReadOnlyValue value={displayTeamMember} />
          ) : (
            <div>
              <select
                value={form.teamMemberId}
                onChange={(e) => updateForm({ ...form, teamMemberId: e.target.value })}
                className={inputCls(errors.teamMemberId, false) + ' cursor-pointer'}
              >
                <option value="" className="bg-white dark:bg-brand-navyCard text-gray-800 dark:text-gray-200">Select Team Member</option>
                {teamMembers
                  .filter(t => t.status === 'Active' || form.teamMemberId === String(t.id))
                  .map(t => (
                    <option key={t.id} value={t.id} className="bg-white dark:bg-brand-navyCard text-gray-800 dark:text-gray-200">{t.name} - {t.role || 'Sales Rep'}</option>
                  ))}
              </select>
              {form.teamMemberId && !teamMembers.some(t => String(t.id) === String(form.teamMemberId)) && (
                <div className="text-xs text-amber-600 font-semibold flex items-center gap-1 mt-1">
                  Team Member not found.{' '}
                  <button type="button" onClick={() => navigate('/team-members/new')} className="underline text-brand-primary font-semibold">
                    Create New Team Member
                  </button>
                </div>
              )}
            </div>
          )}
        </Field>
      </div>

      <Field label="Remarks">
        <textarea
          rows={2}
          value={form.remarks || ''}
          onChange={(e) => updateForm({ ...form, remarks: e.target.value })}
          className={inputCls(false, isReadOnly) + ' resize-none'}
          placeholder="Add specific order instructions or delivery notes..."
          disabled={isReadOnly}
        />
      </Field>
      </>)}

      {(isReadOnly || step === 1) && (
      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-brand-navyLine">
          <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200">
            Order Line Items (Product & Price Override)
          </h3>
          {!isReadOnly && (
            <button
              type="button"
              onClick={addRow}
              className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-lg hover:bg-brand-primaryDark shadow-sm hover:shadow transition-all"
            >
              + Add Product
            </button>
          )}
        </div>

        <div className="space-y-3">
          {items.map((it, idx) => {
            const masterP = products.find(p => p.id === Number(it.productId)) || {};
            const defaultTp = masterP.tp !== undefined ? masterP.tp : (masterP.packPrice || 0);

            return (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-gray-50 dark:bg-brand-navy/40 p-3 rounded-xl border border-gray-200/60 dark:border-brand-navyLine/60">
                {/* Product Selection */}
                <div className="md:col-span-4">
                  <label className="block text-[11px] text-gray-500 font-semibold mb-1">Product</label>
                  {isReadOnly ? (
                    <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                      {masterP.brandName || masterP.name || `Product #${it.productId}`}
                    </div>
                  ) : (
                    <select
                      value={it.productId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 dark:border-brand-navyLine bg-white dark:bg-brand-navy rounded text-xs font-semibold cursor-pointer"
                    >
                      {products
                        .filter((p) => p.status === 'Active' || it.productId === p.id)
                        .map((p) => {
                          const code = p.productCode || p.code || '';
                          const brand = p.brandName || p.name;
                          const gen = p.genericName ? ` (${p.genericName})` : '';
                          return (
                            <option key={p.id} value={p.id}>
                              [{code}] {brand}{gen}
                            </option>
                          );
                        })}
                    </select>
                  )}
                </div>

                {/* Default TP (Read-only Reference) */}
                <div className="md:col-span-2 text-center">
                  <label className="block text-[11px] text-gray-500 font-semibold mb-1">Default TP</label>
                  <div className="text-xs font-mono font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 py-1.5 px-2 rounded">
                    Rs {Number(defaultTp).toFixed(2)}
                  </div>
                </div>

                {/* Selling Price (Editable Override) */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] text-gray-500 font-semibold mb-1">Selling Price</label>
                  {isReadOnly || !canChangePrice ? (
                    <div className="text-xs font-mono font-semibold text-gray-800 dark:text-gray-200 text-center">
                      Rs {Number(it.rate).toFixed(2)}
                    </div>
                  ) : (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={it.rate}
                      onChange={(e) => handleRateChange(idx, e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 dark:border-brand-navyLine bg-white dark:bg-brand-navy rounded text-xs text-center font-semibold font-mono focus:ring-2 focus:ring-brand-primary/20"
                    />
                  )}
                </div>

                {/* Quantity */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] text-gray-500 font-semibold mb-1">Quantity</label>
                  {isReadOnly ? (
                    <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 text-center">
                      {it.quantity}
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="1"
                      value={it.quantity}
                      onChange={(e) => handleQtyChange(idx, e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 dark:border-brand-navyLine bg-white dark:bg-brand-navy rounded text-xs text-center font-semibold"
                    />
                  )}
                </div>

                {/* Subtotal */}
                <div className="md:col-span-1 text-right font-semibold text-brand-primary text-xs">
                  Rs {(it.quantity * it.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>

                {/* Actions */}
                <div className="md:col-span-1 flex justify-center">
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      disabled={items.length <= 1}
                      className="text-feedback-error disabled:opacity-30 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                      title="Remove Item"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grand Total Summary */}
        <div className="flex justify-between items-center p-4 bg-brand-primary/5 dark:bg-brand-primary/10 rounded-xl border border-brand-primary/20">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Total Purchase Amount:
          </span>
          <span className="text-lg font-semibold text-brand-primary">
            Rs {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
      )}

      {/* Step 3: review before saving */}
      {!isReadOnly && step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-ink dark:text-white">Order details</h3>
            <dl>
              <ReviewRow label="PO number" value={form.poNumber} />
              <ReviewRow label="Order date" value={form.poDate} />
              <ReviewRow label="Institution" value={displayInstitution} />
              <ReviewRow label="Doctor" value={displayDoctor} />
              <ReviewRow label="Area" value={displayArea} />
              <ReviewRow label="Team member" value={displayTeamMember} />
              {form.remarks && <ReviewRow label="Remarks" value={form.remarks} />}
            </dl>
          </section>
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-ink dark:text-white">Products</h3>
            <div className="overflow-x-auto border border-line dark:border-brand-navyLine rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted dark:text-gray-400 border-b border-line dark:border-brand-navyLine">
                    <th className="px-3 py-2.5 font-medium">Product</th>
                    <th className="px-3 py-2.5 font-medium text-right">Qty</th>
                    <th className="px-3 py-2.5 font-medium text-right">Price</th>
                    <th className="px-3 py-2.5 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const p = products.find((x) => x.id === Number(it.productId)) || {};
                    return (
                      <tr key={idx} className="border-b border-line dark:border-brand-navyLine last:border-0">
                        <td className="px-3 py-2.5 font-medium text-ink dark:text-white">{p.brandName || p.name || `Product #${it.productId}`}</td>
                        <td className="px-3 py-2.5 text-right">{it.quantity}</td>
                        <td className="px-3 py-2.5 text-right">Rs {Number(it.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2.5 text-right font-medium">Rs {(it.quantity * it.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-baseline pt-3">
              <span className="text-sm text-muted dark:text-gray-400">Total</span>
              <span className="text-2xl font-semibold text-ink dark:text-white">Rs {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </section>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-brand-navyLine">
        {!isReadOnly && step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)} className="btn-secondary mr-auto">
            <FiArrowLeft className="w-4 h-4" /> Back
          </button>
        )}
        {mode !== 'add' && (isReadOnly || step === 0) && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-white dark:bg-brand-navy border border-gray-200 dark:border-brand-navyLine rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {mode === 'edit' ? 'Cancel' : 'Back to Sales'}
          </button>
        )}

        {!isReadOnly && step < 2 && (
          <button type="button" onClick={() => goToStep(step + 1)} className="btn-primary">
            {step === 0 ? 'Next: Products' : 'Next: Review'} <FiArrowRight className="w-4 h-4" />
          </button>
        )}

        {!isReadOnly && step === 2 && (
          <button
            type="button"
            onClick={handleSaveOrder}
            className="px-5 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <FiSave className="w-3.5 h-3.5" />
            {mode === 'edit' ? 'Save Changes' : 'Save Order'}
          </button>
        )}
      </div>
    </div>
  );
}
