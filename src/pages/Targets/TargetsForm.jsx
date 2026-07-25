import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiEdit2, FiPlus, FiTrash2, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { useUnsavedChanges } from '../../context/UnsavedChangesContext';

const INITIAL_PRODUCTS = [
  { id: 1,  code: 'PRD-0001', name: 'Amoxicillin 500mg',      unit: 'Box',    rate: 450,   status: 'Active' },
  { id: 2,  code: 'PRD-0002', name: 'Paracetamol 650mg',      unit: 'Strip',  rate: 120,   status: 'Active' },
  { id: 3,  code: 'PRD-0003', name: 'Metformin 850mg',        unit: 'Box',    rate: 380,   status: 'Active' },
  { id: 4,  code: 'PRD-0004', name: 'Lipitor 10mg',           unit: 'Strip',  rate: 950,   status: 'Active' },
  { id: 5,  code: 'PRD-0005', name: 'Ibuprofen 400mg',        unit: 'Strip',  rate: 90,    status: 'Inactive' },
  { id: 6,  code: 'PRD-0006', name: 'Omeprazole 20mg',        unit: 'Box',    rate: 520,   status: 'Active' },
  { id: 7,  code: 'PRD-0007', name: 'Augmentin 625mg',        unit: 'Box',    rate: 1100,  status: 'Active' },
  { id: 8,  code: 'PRD-0008', name: 'Azithromycin 250mg',     unit: 'Strip',  rate: 670,   status: 'Active' },
  { id: 9,  code: 'PRD-0009', name: 'Ventolin Inhaler',       unit: 'Piece',  rate: 850,   status: 'Inactive' },
  { id: 10, code: 'PRD-0010', name: 'Crestor 10mg',           unit: 'Strip',  rate: 1350,  status: 'Active' },
];

const INITIAL_AREAS = [
  { id: 1, code: 'AREA-0001', name: 'Lahore Central', city: 'Lahore', region: 'Punjab', status: 'Active' },
  { id: 2, code: 'AREA-0002', name: 'Karachi South', city: 'Karachi', region: 'Sindh', status: 'Active' },
  { id: 3, code: 'AREA-0003', name: 'Islamabad F-10', city: 'Islamabad', region: 'Islamabad Capital Territory', status: 'Active' },
  { id: 4, code: 'AREA-0004', name: 'Rawalpindi Cantt', city: 'Rawalpindi', region: 'Punjab', status: 'Inactive' },
  { id: 5, code: 'AREA-0005', name: 'Faisalabad City', city: 'Faisalabad', region: 'Punjab', status: 'Active' },
  { id: 6, code: 'AREA-0006', name: 'Multan Cantonment', city: 'Multan', region: 'Punjab', status: 'Active' },
  { id: 7, code: 'AREA-0007', name: 'Peshawar University', city: 'Peshawar', region: 'KPK', status: 'Inactive' }
];

const INITIAL_TEAM = [
  { id: 1, code: 'EMP-0001', name: 'Ahmed Shah', designation: 'Medical Representative', area: 'Lahore Central', status: 'Active' },
  { id: 2, code: 'EMP-0002', name: 'Zainab Fatima', designation: 'Territory Manager', area: 'Karachi South', status: 'Active' },
  { id: 3, code: 'EMP-0003', name: 'Usman Ali', designation: 'Area Sales Manager', area: 'Islamabad F-10', status: 'Active' },
  { id: 4, code: 'EMP-0004', name: 'Mariam Khan', designation: 'Medical Representative', area: 'Rawalpindi Cantt', status: 'Inactive' },
  { id: 5, code: 'EMP-0005', name: 'Bilal Siddiqui', designation: 'Medical Representative', area: 'Faisalabad City', status: 'Active' },
  { id: 6, code: 'EMP-0006', name: 'Ayesha Malik', designation: 'Medical Representative', area: 'Multan Cantonment', status: 'Active' },
  { id: 7, code: 'EMP-0007', name: 'Haris Rehman', designation: 'Territory Manager', area: 'Peshawar University', status: 'Inactive' }
];

const Field = ({ label, required, error, children }) => (
  <div>
    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-555 dark:text-gray-400 mb-1.5">
      {label} {required && <span className="text-feedback-error">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-feedback-error font-semibold mt-1 flex items-center gap-1"><FiAlertCircle /> {error}</p>}
  </div>
);

const inputCls = (err, disabled) =>
  `w-full px-3 py-2.5 text-xs font-semibold text-gray-900 dark:text-white bg-white dark:bg-[#1e293b] border rounded-lg outline-none
   transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-500
   focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40
   ${err ? 'border-feedback-error bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700'}
   ${disabled ? 'cursor-default bg-gray-100 dark:bg-[#1e293b] text-gray-900 dark:text-white font-bold opacity-100' : ''}`;

export default function TargetsForm({
  mode,
  item,
  businessYearsList,
  productsList = [],
  areasList: areasProp = [],
  teamMembersList: teamMembersProp = [],
  onSave,
  onCancel
}) {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const navigate = useNavigate();
  const { setIsDirty, setOnSave } = useUnsavedChanges();

  // Load lists from local storage or defaults
  const products = useMemo(() => {
    const list = productsList.length > 0 ? productsList : INITIAL_PRODUCTS;
    const normalized = list.map(p => {
      if (p.code && !p.packSizeQty) {
        let qty = 10;
        let unitType = 'Tablets';
        if (p.name.toLowerCase().includes('amoxicillin')) { qty = 10; unitType = 'Vials'; }
        else if (p.name.toLowerCase().includes('paracetamol')) { qty = 20; unitType = 'Tablets'; }
        else if (p.name.toLowerCase().includes('metformin')) { qty = 30; unitType = 'Capsules'; }
        else if (p.name.toLowerCase().includes('omeprazole')) { qty = 10; unitType = 'Capsules'; }
        else if (p.name.toLowerCase().includes('augmentin')) { qty = 14; unitType = 'Tablets'; }
        else if (p.name.toLowerCase().includes('azithromycin')) { qty = 6; unitType = 'Tablets'; }
        else if (p.name.toLowerCase().includes('ventolin')) { qty = 1; unitType = 'Inhalers'; }
        else if (p.name.toLowerCase().includes('crestor')) { qty = 10; unitType = 'Tablets'; }
        
        return {
          ...p,
          packSizeQty: qty,
          packSizeUnit: unitType,
          packSize: `${qty} ${unitType}`,
          packPrice: p.rate || 500,
          perUnitPrice: Number(((p.rate || 500) / qty).toFixed(2))
        };
      }
      return p;
    });
    return normalized.filter(p => p.status === 'Active');
  }, [productsList]);

  const areasList = useMemo(() => {
    const list = areasProp.length > 0 ? areasProp : INITIAL_AREAS;
    return list.filter(a => a.status === 'Active');
  }, [areasProp]);

  const teamMembers = useMemo(() => {
    const list = teamMembersProp.length > 0 ? teamMembersProp : INITIAL_TEAM;
    return list.filter(t => t.status === 'Active');
  }, [teamMembersProp]);

  // Form State
  const [businessYear, setBusinessYear] = useState('2025-2026');
  const [productId, setProductId] = useState('');
  const [annualTarget, setAnnualTarget] = useState('');
  const [areasDistribution, setAreasDistributionState] = useState([
    { areaName: '', percentage: 0, teamMembers: [] }
  ]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  const setAreasDistribution = (val) => {
    setAreasDistributionState(val);
    setIsDirty(true);
  };

  const selectedProduct = useMemo(() => {
    return products.find(p => String(p.id) === String(productId));
  }, [productId, products]);

  const productUnit = useMemo(() => {
    return selectedProduct ? (selectedProduct.unitTypeName || selectedProduct.packSizeUnit || selectedProduct.unit || 'Vials') : 'Vials';
  }, [selectedProduct]);

  const productRate = useMemo(() => {
    return selectedProduct ? (Number(selectedProduct.tp || selectedProduct.rate || selectedProduct.packPrice) || 0) : 0;
  }, [selectedProduct]);

  const annualTargetAmount = useMemo(() => {
    return (Number(annualTarget) || 0) * productRate;
  }, [annualTarget, productRate]);

  // Load target item if editing/viewing
  useEffect(() => {
    if (item) {
      setBusinessYear(item.businessYear || '2025-2026');
      setProductId(item.productId || '');
      setAnnualTarget(item.annualTarget || '');
      setAreasDistributionState(item.areasDistribution || []);
      setNotes(item.notes || '');
    }
  }, [item]);

  useEffect(() => {
    if (mode !== 'view') {
      setOnSave(() => {
        const e = validateForm();
        if (Object.keys(e).length) {
          setErrors(e);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return false;
        }
        setErrors({});
        return onSave({
          id: item?.id,
          businessYear,
          productId: Number(productId),
          annualTarget: Number(annualTarget),
          areasDistribution,
          notes
        });
      });
    }
    return () => setOnSave(null);
  }, [businessYear, productId, annualTarget, areasDistribution, notes, mode, onSave, item]);

  // Handler for adding a new area row
  const handleAddAreaRow = () => {
    if (isView) return;
    setAreasDistribution(prev => [...prev, { areaName: '', percentage: 0, teamMembers: [] }]);
  };

  // Handler for removing an area row
  const handleRemoveAreaRow = (index) => {
    if (isView) return;
    if (areasDistribution.length <= 1) {
      // Clear instead of removing last row
      setAreasDistribution([{ areaName: '', percentage: 0, teamMembers: [] }]);
      return;
    }
    setAreasDistribution(prev => prev.filter((_, idx) => idx !== index));
  };

  // Handler for selecting an Area in a row
  const handleAreaSelect = (index, value) => {
    if (isView) return;
    const updated = [...areasDistribution];
    updated[index].areaName = value;
    updated[index].teamMembers = []; // Clear team members when Area changes
    setAreasDistribution(updated);
  };

  // Handler for Area percentage change
  const handleAreaPercentageChange = (index, val) => {
    if (isView) return;
    const num = Math.max(0, Number(val) || 0);
    const updated = [...areasDistribution];
    updated[index].percentage = num;
    setAreasDistribution(updated);
  };

  // Handler for adding a team member row inside an area
  const handleAddTeamMemberRow = (areaIdx) => {
    if (isView) return;
    const updated = [...areasDistribution];
    updated[areaIdx].teamMembers.push({ name: '', percentage: 0 });
    setAreasDistribution(updated);
  };

  // Handler for removing a team member row inside an area
  const handleRemoveTeamMemberRow = (areaIdx, tmIdx) => {
    if (isView) return;
    const updated = [...areasDistribution];
    updated[areaIdx].teamMembers = updated[areaIdx].teamMembers.filter((_, i) => i !== tmIdx);
    setAreasDistribution(updated);
  };

  // Handler for selecting a Team Member in a row
  const handleTeamMemberSelect = (areaIdx, tmIdx, value) => {
    if (isView) return;
    const updated = [...areasDistribution];
    updated[areaIdx].teamMembers[tmIdx].name = value;
    setAreasDistribution(updated);
  };

  // Handler for Team Member percentage change
  const handleTMPercentageChange = (areaIdx, tmIdx, val) => {
    if (isView) return;
    const num = Math.max(0, Number(val) || 0);
    const updated = [...areasDistribution];
    updated[areaIdx].teamMembers[tmIdx].percentage = num;
    setAreasDistribution(updated);
  };

  // Distribute Areas Evenly
  const handleDistributeAreasEvenly = () => {
    if (isView) return;
    const count = areasDistribution.length;
    if (count === 0) return;
    const evenPct = Math.floor(100 / count);
    const remainder = 100 - (evenPct * count);

    const updated = areasDistribution.map((row, idx) => ({
      ...row,
      percentage: idx === count - 1 ? evenPct + remainder : evenPct
    }));
    setAreasDistribution(updated);
  };

  // Distribute Team Members Evenly in an Area
  const handleDistributeTMEvenly = (areaIdx) => {
    if (isView) return;
    const row = areasDistribution[areaIdx];
    const count = row.teamMembers.length;
    if (count === 0) return;
    const evenPct = Math.floor(100 / count);
    const remainder = 100 - (evenPct * count);

    const updated = [...areasDistribution];
    updated[areaIdx].teamMembers = row.teamMembers.map((tm, idx) => ({
      ...tm,
      percentage: idx === count - 1 ? evenPct + remainder : evenPct
    }));
    setAreasDistribution(updated);
  };

  // Get list of Team Members filtered by a specific Area
  const getTeamMembersForArea = (areaName) => {
    if (!areaName) return [];
    return teamMembers.filter(m => 
      m.area && areaName && (
        m.area.toLowerCase() === areaName.toLowerCase()
      )
    );
  };

  // Running total of Area Percentages
  const areaPercentageSum = useMemo(() => {
    return areasDistribution.reduce((sum, row) => sum + (Number(row.percentage) || 0), 0);
  }, [areasDistribution]);

  // Validations
  const validateForm = () => {
    const e = {};
    if (!productId) e.productId = 'Product selection is required.';
    if (!annualTarget || Number(annualTarget) <= 0) {
      e.annualTarget = 'Annual target must be greater than 0.';
    }

    // Check Area selections
    const emptyArea = areasDistribution.some(row => !row.areaName);
    if (emptyArea) {
      e.areasDistribution = 'All selected area rows must specify an Area.';
    }

    // Check duplicate Areas
    const selectedAreas = areasDistribution.map(r => r.areaName).filter(Boolean);
    const uniqueAreas = new Set(selectedAreas);
    if (selectedAreas.length !== uniqueAreas.size) {
      e.duplicateAreas = 'Duplicate Areas are not allowed. Each area must be configured only once.';
    }

    // Check Area Percentage Total
    if (areaPercentageSum !== 100) {
      e.areaTotal = `Total Area Percentage must equal exactly 100% (currently ${areaPercentageSum}%).`;
    }

    // Check Team Member Percentage Totals for each configured Area
    const tmErrors = [];
    areasDistribution.forEach((row) => {
      if (row.areaName) {
        // Verify all rows are filled
        const emptyTM = row.teamMembers.some(tm => !tm.name);
        if (emptyTM) {
          tmErrors.push(`All team member rows in "${row.areaName}" must select a Team Member.`);
        }

        // Check duplicate Team Members within the same area
        const selectedTMs = row.teamMembers.map(tm => tm.name).filter(Boolean);
        const uniqueTMs = new Set(selectedTMs);
        if (selectedTMs.length !== uniqueTMs.size) {
          tmErrors.push(`Duplicate Team Member selections found in area "${row.areaName}".`);
        }

        const sum = row.teamMembers.reduce((s, tm) => s + (Number(tm.percentage) || 0), 0);
        if (sum !== 100) {
          tmErrors.push(`"${row.areaName}" Team Members total percentage must equal exactly 100% (currently ${sum}%).`);
        }
      }
    });

    if (tmErrors.length > 0) {
      e.teamMembersTotal = tmErrors;
    }

    return e;
  };

  const handleSaveClick = () => {
    const e = validateForm();
    if (Object.keys(e).length) {
      setErrors(e);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setErrors({});
    onSave({
      id: item?.id,
      businessYear,
      productId: Number(productId),
      annualTarget: Number(annualTarget),
      areasDistribution,
      notes
    });
  };

  return (
    <div className="space-y-6">
      {/* Validation Alert Card */}
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-feedback-error rounded-xl text-xs text-feedback-error space-y-1.5 animate-fade-in">
          <p className="font-bold flex items-center gap-1.5 text-sm"><FiAlertCircle className="w-4.5 h-4.5" /> Validation Errors Found:</p>
          <ul className="list-disc pl-5 space-y-1 font-semibold">
            {errors.productId && <li>{errors.productId}</li>}
            {errors.annualTarget && <li>{errors.annualTarget}</li>}
            {errors.areasDistribution && <li>{errors.areasDistribution}</li>}
            {errors.duplicateAreas && <li>{errors.duplicateAreas}</li>}
            {errors.areaTotal && <li>{errors.areaTotal}</li>}
            {errors.teamMembersTotal && errors.teamMembersTotal.map((tmErr, idx) => (
              <li key={idx}>{tmErr}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Row 1: Business Year & Product */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Business Year" required>
          <select
            disabled={isView || isEdit}
            value={businessYear}
            onChange={(e) => { setBusinessYear(e.target.value); setIsDirty(true); }}
            className={inputCls(false, isView || isEdit) + ' appearance-none cursor-pointer'}
          >
            {businessYearsList.map((y) => (
              <option key={y.value} value={y.value}>{y.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Product" required error={errors.productId}>
          <select
            disabled={isView || isEdit}
            value={productId}
            onChange={(e) => { setProductId(e.target.value); setIsDirty(true); }}
            className={inputCls(errors.productId, isView || isEdit) + ' appearance-none cursor-pointer'}
          >
            <option value="">Select Product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} - {p.packSize}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Annual Target, Unit, & Estimated Target Amount */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Annual Target Quantity" required error={errors.annualTarget}>
          <div className="relative">
            <input
              disabled={isView}
              type="number"
              min="0"
              value={annualTarget}
              onChange={(e) => { setAnnualTarget(e.target.value); setIsDirty(true); }}
              placeholder="e.g. 50000"
              className={inputCls(errors.annualTarget, isView) + ' pr-16 text-gray-900 dark:text-white font-bold bg-white dark:bg-[#1e293b]'}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-gray-700 dark:text-gray-200">
              {productUnit}
            </span>
          </div>
        </Field>

        <Field label="Unit">
          <input
            disabled
            value={productUnit}
            className={inputCls(false, true) + ' font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-[#1e293b]'}
          />
        </Field>

        <Field label="Estimated Target Amount">
          <div className="w-full px-3 py-2 text-xs font-extrabold text-brand-primary dark:text-red-400 bg-gray-50 dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between h-[38px]">
            <span>Rs {annualTargetAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">({productRate > 0 ? `Rs ${productRate.toLocaleString()}/unit` : 'No Rate'})</span>
          </div>
        </Field>
      </div>

      {/* Area Distribution Table Section */}
      <div className="border border-gray-150 dark:border-gray-800 rounded-xl p-4 bg-white dark:bg-[#0b0f19]/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Area Distribution</h3>
            <p className="text-[10px] text-gray-405 dark:text-gray-500 font-semibold mt-0.5">Define regional target splits. Sum must equal exactly 100%.</p>
          </div>
          {!isView && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDistributeAreasEvenly}
                className="px-2.5 py-1.5 bg-gray-105 dark:bg-gray-800 hover:bg-gray-150 text-gray-700 dark:text-gray-300 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 border border-gray-200 dark:border-gray-700"
              >
                <FiRefreshCw className="w-3 h-3" /> Distribute Evenly
              </button>
              <button
                type="button"
                onClick={handleAddAreaRow}
                className="px-2.5 py-1.5 bg-brand-primary text-white text-[10px] font-bold rounded-lg hover:bg-brand-primaryDark shadow-sm transition-all flex items-center gap-1"
              >
                <FiPlus className="w-3 h-3" /> Add Area
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs" aria-label="Area target distribution table">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                <th className="text-left py-2 pr-4">Area</th>
                <th className="text-center py-2 px-4 w-28">Target %</th>
                <th className="text-right py-2 px-4 w-40">Target Quantity</th>
                {!isView && <th className="text-center py-2 pl-4 w-20">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
              {areasDistribution.map((row, idx) => {
                const rowQty = Math.round((Number(annualTarget) || 0) * (Number(row.percentage) || 0) / 100);
                return (
                  <tr key={idx} className="hover:bg-gray-50/20">
                    <td className="py-2.5 pr-2">
                      <select
                        disabled={isView}
                        value={row.areaName}
                        onChange={(e) => handleAreaSelect(idx, e.target.value)}
                        className={inputCls(false, isView) + ' py-1.5 appearance-none cursor-pointer'}
                      >
                        <option value="">Select Area...</option>
                        {areasList.map((a) => (
                          <option key={a.id} value={a.name}>{a.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="relative">
                        <input
                          disabled={isView}
                          type="number"
                          min="0"
                          max="100"
                          value={row.percentage}
                          onChange={(e) => handleAreaPercentageChange(idx, e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs text-center font-bold bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-extrabold text-gray-800 dark:text-gray-250">
                      {rowQty.toLocaleString()} <span className="text-[10px] text-gray-400 font-normal">{productUnit}</span>
                    </td>
                    {!isView && (
                      <td className="py-2.5 pl-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveAreaRow(idx)}
                          className="p-1.5 text-feedback-error hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Running Area Total Indicator */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-gray-55 dark:bg-gray-800/40 text-xs">
          <span className="font-bold text-gray-600 dark:text-gray-400">Total Area Percentage:</span>
          <span className={`font-extrabold text-sm ${areaPercentageSum === 100 ? 'text-feedback-success' : 'text-feedback-error'}`}>
            {areaPercentageSum}% / 100%
          </span>
        </div>
      </div>

      {/* Team Member Distribution Sections */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-gray-805 dark:text-gray-200 uppercase tracking-wider">Team Member Distribution</h3>
        {areasDistribution.map((row, areaIdx) => {
          if (!row.areaName) return null;
          const areaQty = Math.round((Number(annualTarget) || 0) * (Number(row.percentage) || 0) / 100);
          const tmSum = row.teamMembers.reduce((s, tm) => s + (Number(tm.percentage) || 0), 0);
          const availableMembers = getTeamMembersForArea(row.areaName);

          return (
            <div key={areaIdx} className="border border-gray-150 dark:border-gray-800 rounded-xl p-4 bg-gray-50/30 dark:bg-[#0f172a]/30 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wide">{row.areaName}</h4>
                  <p className="text-[10px] text-gray-405 dark:text-gray-550 mt-0.5 font-semibold">
                    Area Target: <span className="font-bold text-gray-705 dark:text-gray-300">{areaQty.toLocaleString()} {productUnit}</span>
                  </p>
                </div>
                {!isView && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDistributeTMEvenly(areaIdx)}
                      className="px-2 py-1 bg-white dark:bg-gray-800 hover:bg-gray-50 text-gray-600 dark:text-gray-300 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 border border-gray-200 dark:border-gray-700"
                    >
                      <FiRefreshCw className="w-2.5 h-2.5" /> Distribute Evenly
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddTeamMemberRow(areaIdx)}
                      className="px-2.5 py-1 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-[10px] font-bold rounded-lg transition-all flex items-center gap-0.5"
                    >
                      <FiPlus className="w-3 h-3" /> Add Team Member
                    </button>
                  </div>
                )}
              </div>

              {row.teamMembers.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic py-2">
                  No Team Members configured. Click "+ Add Team Member" to configure one.
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-3 text-[9px] font-bold text-gray-405 dark:text-gray-450 uppercase pb-1 tracking-wider">
                    <div className="col-span-5">Team Member</div>
                    <div className="col-span-3 text-center">Target %</div>
                    <div className="col-span-3 text-right">Target Quantity</div>
                    {!isView && <th className="col-span-1 text-center"></th>}
                  </div>
                  {row.teamMembers.map((tm, tmIdx) => {
                    const tmQty = Math.round(areaQty * (Number(tm.percentage) || 0) / 100);
                    return (
                      <div key={tmIdx} className="grid grid-cols-12 gap-3 items-center bg-white dark:bg-gray-805/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                        <div className="col-span-5">
                          <select
                            disabled={isView}
                            value={tm.name}
                            onChange={(e) => handleTeamMemberSelect(areaIdx, tmIdx, e.target.value)}
                            className={inputCls(false, isView) + ' py-1 appearance-none cursor-pointer'}
                          >
                            <option value="">Select Member...</option>
                            {availableMembers.map((m) => (
                              <option key={m.id} value={m.name}>{m.name} - {m.designation}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3 flex justify-center">
                          <div className="relative w-20">
                            <input
                              disabled={isView}
                              type="number"
                              min="0"
                              max="100"
                              value={tm.percentage}
                              onChange={(e) => handleTMPercentageChange(areaIdx, tmIdx, e.target.value)}
                              className="w-full px-2 py-1 text-xs text-center font-bold bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded outline-none"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-405 font-bold">%</span>
                          </div>
                        </div>
                        <div className="col-span-3 text-right font-bold text-gray-800 dark:text-gray-205">
                          {tmQty.toLocaleString()} <span className="text-[9px] text-gray-400 font-normal">{productUnit}</span>
                        </div>
                        {!isView && (
                          <div className="col-span-1 flex justify-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveTeamMemberRow(areaIdx, tmIdx)}
                              className="p-1 text-feedback-error hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors"
                            >
                              <FiTrash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Team Members Total Percentage Indicator */}
                  <div className="flex justify-between items-center text-[10px] font-bold pt-2 text-gray-500 dark:text-gray-405">
                    <span>Total Team Member Split:</span>
                    <span className={tmSum === 100 ? 'text-feedback-success' : 'text-feedback-error'}>
                      {tmSum}% / 100%
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Notes / Remarks */}
      <Field label="Notes / Remarks">
        <textarea
          disabled={isView}
          rows={3}
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setIsDirty(true); }}
          placeholder="Enter details or notes regarding this annual targets split..."
          className={inputCls(false, isView) + ' resize-none'}
        />
      </Field>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-155 dark:border-gray-850">
        {isView ? (
          <>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-55 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => navigate(`/targets/${item.id}/edit`)}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm flex items-center gap-1.5"
            >
              <FiEdit2 className="w-3.5 h-3.5" /> Edit Targets
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-55 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveClick}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark shadow-sm flex items-center gap-1.5"
            >
              <FiCheck className="w-3.5 h-3.5" />
              {isEdit ? 'Update Targets' : 'Save Targets'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
