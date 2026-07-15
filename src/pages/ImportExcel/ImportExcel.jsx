import React, { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Toast from '../../components/common/Toast';
import Pagination from '../../components/common/Pagination';
import {
  FiUploadCloud, FiDownload, FiFileText, FiCheckCircle,
  FiAlertCircle, FiSettings, FiRefreshCw, FiChevronLeft,
  FiChevronRight, FiCheck, FiX, FiArrowRight, FiInfo,
  FiHelpCircle
} from 'react-icons/fi';

// Dummy Excel Columns parsed from a uploaded sample file
const DUMMY_EXCEL_COLUMNS = [
  'po_id',
  'po_date',
  'doc_name',
  'territory',
  'sales_rep',
  'product_sku',
  'qty_ordered',
  'unit_rate',
  'comments'
];

// System fields requiring mapping
const SYSTEM_FIELDS = [
  { key: 'poNumber', label: 'PO Number', required: true, desc: 'Unique identifier for purchase order' },
  { key: 'poDate', label: 'PO Date', required: true, desc: 'Date of purchase order creation' },
  { key: 'doctor', label: 'Doctor', required: true, desc: 'Doctor name or ID' },
  { key: 'area', label: 'Area', required: true, desc: 'Territory or region name' },
  { key: 'teamMember', label: 'Team Member', required: true, desc: 'Sales representative name' },
  { key: 'product', label: 'Product', required: true, desc: 'Product name or code' },
  { key: 'quantity', label: 'Quantity', required: true, desc: 'Number of vials sold' },
  { key: 'rate', label: 'Rate', required: true, desc: 'Rate per vial' },
  { key: 'remarks', label: 'Remarks', required: false, desc: 'Additional notes' }
];

// Initial default column mapping
const DEFAULT_COLUMN_MAPPING = {
  poNumber: 'po_id',
  poDate: 'po_date',
  doctor: 'doc_name',
  area: 'territory',
  teamMember: 'sales_rep',
  product: 'product_sku',
  quantity: 'qty_ordered',
  rate: 'unit_rate',
  remarks: 'comments'
};

// Dummy rows parsed from the uploaded Excel
const INITIAL_EXCEL_ROWS = [
  { id: 1, po_id: 'PO-2026-001', po_date: '2026-07-01', doc_name: 'Dr. Ahmed Ali', territory: 'Gulshan', sales_rep: 'Hamid Raza', product_sku: 'Amoxicillin 500mg', qty_ordered: 120, unit_rate: 450, comments: 'Urgent delivery' },
  { id: 2, po_id: 'PO-2026-002', po_date: '2026-07-01', doc_name: 'Dr. Sarah Khan', territory: 'Saddar', sales_rep: 'Zainab Bibi', product_sku: 'Paracetamol 650mg', qty_ordered: 300, unit_rate: 120, comments: '' },
  { id: 3, po_id: '', po_date: '2026-07-02', doc_name: 'Dr. Tariq Mahmood', territory: 'Clifton', sales_rep: 'Arsalan Shah', product_sku: 'Amoxicillin 500mg', qty_ordered: 50, unit_rate: 450, comments: '' }, // Missing PO number
  { id: 4, po_id: 'PO-2026-004', po_date: '2026-07-02', doc_name: 'Dr. Bilal Qureshi', territory: 'Johar', sales_rep: 'Hamid Raza', product_sku: 'Paracetamol 650mg', qty_ordered: 200, unit_rate: -10, comments: 'Damaged packaging replacement' }, // Invalid rate
  { id: 5, po_id: 'PO-2026-005', po_date: '2026-07-03', doc_name: 'Dr. Yasmin Ara', territory: 'Gulshan', sales_rep: 'Zainab Bibi', product_sku: 'Amoxicillin 500mg', qty_ordered: 0, unit_rate: 450, comments: 'Sample vials only' }, // Zero quantity
  { id: 6, po_id: 'PO-2026-006', po_date: '2026-07-04', doc_name: 'Dr. Hamid Raza', territory: 'Saddar', sales_rep: 'Arsalan Shah', product_sku: 'Paracetamol 650mg', qty_ordered: 180, unit_rate: 120, comments: '' },
  { id: 7, po_id: 'PO-2026-007', po_date: '2026-07-04', doc_name: '', territory: 'Clifton', sales_rep: 'Hamid Raza', product_sku: 'Amoxicillin 500mg', qty_ordered: 90, unit_rate: 450, comments: '' }, // Missing Doctor
  { id: 8, po_id: 'PO-2026-008', po_date: '2026-07-05', doc_name: 'Dr. Sarah Khan', territory: 'Johar', sales_rep: 'Zainab Bibi', product_sku: 'Paracetamol 650mg', qty_ordered: 150, unit_rate: 120, comments: 'Standard order' }
];

const ImportExcel = () => {
  // Wizard steps: 'upload' | 'preview' | 'importing' | 'result'
  const [step, setStep] = useState('upload');
  
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState(null);
  
  // Mapping & Data States
  const [columnMapping, setColumnMapping] = useState(DEFAULT_COLUMN_MAPPING);
  const [excelRows, setExcelRows] = useState(INITIAL_EXCEL_ROWS);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Import options
  const [options, setOptions] = useState({
    skipDuplicates: true,
    updateRecords: false,
    ignoreEmpty: true
  });

  // Import stats result
  const [importStats, setImportStats] = useState({
    total: 0,
    imported: 0,
    skipped: 0,
    failed: 0
  });

  // Handle Drag & Drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension !== 'xlsx' && extension !== 'xls') {
      setToast({
        message: 'Unsupported file format! Please upload an Excel sheet (.xlsx or .xls).',
        type: 'error'
      });
      return;
    }

    setSelectedFile(file);
    setStep('upload');
    setUploadProgress(0);

    // Simulate progress bar loading
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setStep('preview');
            setToast({
              message: 'Excel file loaded and parsed successfully.',
              type: 'success'
            });
          }, 400);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  // Cell editor to fix validation errors directly on table
  const handleCellEdit = (rowId, mappedField, value) => {
    const excelField = columnMapping[mappedField];
    if (!excelField) return;

    setExcelRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id === rowId) {
          let convertedValue = value;
          // Coerce types if number is expected
          if (mappedField === 'quantity' || mappedField === 'rate') {
            convertedValue = value === '' ? '' : Number(value);
          }
          return { ...row, [excelField]: convertedValue };
        }
        return row;
      })
    );
  };

  // Column mapping drop-down change
  const handleMappingChange = (systemFieldKey, excelCol) => {
    setColumnMapping((prev) => ({
      ...prev,
      [systemFieldKey]: excelCol
    }));
  };

  // Validation function
  const validationResults = useMemo(() => {
    const errors = [];
    let validCount = 0;
    let invalidCount = 0;

    excelRows.forEach((row) => {
      const rowErrors = [];

      SYSTEM_FIELDS.forEach((field) => {
        const excelCol = columnMapping[field.key];
        const val = excelCol ? row[excelCol] : undefined;

        if (field.required) {
          if (val === undefined || val === null || val === '') {
            rowErrors.push(`${field.label} is required.`);
          }
        }

        if (field.key === 'quantity' && val !== undefined && val !== '') {
          if (Number(val) <= 0 || isNaN(Number(val))) {
            rowErrors.push(`Quantity must be a positive number.`);
          }
        }

        if (field.key === 'rate' && val !== undefined && val !== '') {
          if (Number(val) <= 0 || isNaN(Number(val))) {
            rowErrors.push(`Rate must be a positive number.`);
          }
        }
      });

      if (rowErrors.length > 0) {
        invalidCount++;
        errors.push({
          rowId: row.id,
          rowNum: row.id, // using index / id for row numbering
          poId: row[columnMapping.poNumber] || 'Unknown PO',
          messages: rowErrors
        });
      } else {
        validCount++;
      }
    });

    return {
      errors,
      validCount,
      invalidCount,
      isValid: errors.length === 0
    };
  }, [excelRows, columnMapping]);

  // Pagination helper
  const totalPages = Math.ceil(excelRows.length / rowsPerPage);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return excelRows.slice(start, start + rowsPerPage);
  }, [excelRows, currentPage, rowsPerPage]);

  const handleStartImport = () => {
    setStep('importing');
    setUploadProgress(0);

    // Simulate final import processing progress bar
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Compute final statistics
            const total = excelRows.length;
            const failed = validationResults.errors.length;
            let skipped = 0;
            if (options.skipDuplicates) {
              skipped = 1; // Simulate skipping 1 PO duplicate
            }
            const imported = total - failed - skipped;

            setImportStats({
              total,
              imported: Math.max(0, imported),
              skipped,
              failed
            });
            setStep('result');
            setToast({
              message: 'Excel import finished successfully.',
              type: 'success'
            });
          }, 450);
          return 100;
        }
        return prev + 20;
      });
    }, 200);
  };

  const downloadSampleTemplate = () => {
    setToast({
      message: 'Downloading sample sales record Excel template...',
      type: 'success'
    });
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setExcelRows(INITIAL_EXCEL_ROWS);
    setColumnMapping(DEFAULT_COLUMN_MAPPING);
    setStep('upload');
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
              Import Excel
            </h1>
            <p className="text-xs text-gray-450 dark:text-gray-550 font-medium mt-1">
              Import existing sales data from Excel.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadSampleTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-sm"
            >
              <FiDownload className="w-3.5 h-3.5 text-brand-primary" />
              Download Template
            </button>
            {step === 'preview' && (
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <FiX className="w-3.5 h-3.5" />
                Cancel Import
              </button>
            )}
          </div>
        </div>

        {/* Wizard progress banner */}
        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft p-4 flex justify-between items-center text-xs font-semibold text-gray-400 dark:text-gray-550">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'upload' ? 'bg-brand-primary text-white' : 'bg-green-500 text-white'}`}>
              {step !== 'upload' ? <FiCheck className="w-3.5 h-3.5" /> : '1'}
            </span>
            <span className={step === 'upload' ? 'text-gray-900 dark:text-white font-bold' : ''}>Upload Excel</span>
          </div>
          <div className="h-px bg-gray-100 dark:bg-gray-800 flex-1 mx-4" />
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'preview' ? 'bg-brand-primary text-white' : step === 'result' ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
              {step === 'result' ? <FiCheck className="w-3.5 h-3.5" /> : '2'}
            </span>
            <span className={step === 'preview' ? 'text-gray-900 dark:text-white font-bold' : ''}>Map & Validate</span>
          </div>
          <div className="h-px bg-gray-100 dark:bg-gray-800 flex-1 mx-4" />
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'result' ? 'bg-brand-primary text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
              3
            </span>
            <span className={step === 'result' ? 'text-gray-900 dark:text-white font-bold' : ''}>Import Results</span>
          </div>
        </div>

        {/* STEP 1: Upload Panel */}
        {step === 'upload' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-enterprise p-12 text-center transition-all ${
                  dragActive
                    ? 'border-brand-primary bg-sky-50/20 dark:bg-brand-primary/5'
                    : 'border-gray-250 dark:border-gray-800 bg-white dark:bg-[#0f172a] hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <div className="max-w-md mx-auto flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-sky-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <FiUploadCloud className="w-8 h-8 text-brand-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-880 dark:text-white uppercase tracking-wider">
                    Drag & Drop Excel File Here
                  </h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-550 mt-1 font-medium">
                    Supported Formats: .xlsx, .xls (Maximum size: 10MB)
                  </p>

                  <div className="relative mt-6">
                    <input
                      type="file"
                      id="excel-file-upload"
                      className="hidden"
                      accept=".xlsx, .xls"
                      onChange={handleFileChange}
                    />
                    <label
                      htmlFor="excel-file-upload"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-colors shadow-soft"
                    >
                      Browse File
                    </label>
                  </div>

                  {selectedFile && uploadProgress > 0 && (
                    <div className="w-full mt-8 space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-505">
                        <span>Uploading {selectedFile.name}...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-primary transition-all duration-150"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Side Tips / Info Card */}
            <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise p-5 space-y-4 shadow-soft">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                <FiInfo className="w-4 h-4 text-brand-primary" />
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-widest">
                  Important Guidelines
                </span>
              </div>
              <ul className="space-y-3 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                <li className="flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0 mt-1.5" />
                  Ensure the columns contain headings mapped correctly to product purchase orders.
                </li>
                <li className="flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0 mt-1.5" />
                  Format dates strictly in YYYY-MM-DD or standard DD/MM/YYYY.
                </li>
                <li className="flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0 mt-1.5" />
                  The rate per vial and quantity ordered should contain positive numeric entries.
                </li>
                <li className="flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0 mt-1.5" />
                  Download our pre-formatted sheet to prevent auto-mapping warnings.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* STEP 2: Preview & Mapping Panel */}
        {step === 'preview' && (
          <div className="space-y-6">
            
            {/* Top Summaries & Options */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Import Stats Summary */}
              <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise p-5 shadow-soft flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Validation Status</span>
                  <span className="text-[10px] text-gray-400 font-medium font-mono">{selectedFile?.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 py-4 text-center">
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Rows</p>
                    <p className="text-xl font-extrabold text-gray-800 dark:text-white mt-1">{excelRows.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-500 font-semibold uppercase tracking-wider">Valid Rows</p>
                    <p className="text-xl font-extrabold text-green-500 mt-1">{validationResults.validCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-red-500 font-semibold uppercase tracking-wider">Errors</p>
                    <p className="text-xl font-extrabold text-red-500 mt-1">{validationResults.invalidCount}</p>
                  </div>
                </div>
                {validationResults.isValid ? (
                  <div className="bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 px-3 py-2 rounded-lg text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-wide justify-center">
                    <FiCheckCircle className="w-3.5 h-3.5" /> All validation checks passed!
                  </div>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 px-3 py-2 rounded-lg text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-wide justify-center">
                    <FiAlertCircle className="w-3.5 h-3.5 shrink-0" /> Edit cell values to fix errors
                  </div>
                )}
              </div>

              {/* Import Options Checkboxes */}
              <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise p-5 shadow-soft space-y-3">
                <div className="pb-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Import Options</span>
                </div>
                <div className="space-y-2.5 pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={options.skipDuplicates}
                      onChange={(e) => setOptions({ ...options, skipDuplicates: e.target.checked })}
                      className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20 w-3.5 h-3.5"
                    />
                    Skip duplicate Purchase Orders
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={options.updateRecords}
                      onChange={(e) => setOptions({ ...options, updateRecords: e.target.checked })}
                      className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20 w-3.5 h-3.5"
                    />
                    Update existing records
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={options.ignoreEmpty}
                      onChange={(e) => setOptions({ ...options, ignoreEmpty: e.target.checked })}
                      className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20 w-3.5 h-3.5"
                    />
                    Ignore empty rows
                  </label>
                </div>
              </div>

              {/* Final Trigger Panel */}
              <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise p-5 shadow-soft flex flex-col justify-between">
                <div>
                  <div className="pb-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Import Action</span>
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-550 font-medium mt-2 leading-relaxed">
                    Review validation alerts and complete mapping. The system will process transactions matching target fields.
                  </p>
                </div>
                <button
                  disabled={!validationResults.isValid}
                  onClick={handleStartImport}
                  className="w-full flex items-center justify-center gap-1.5 py-3 bg-brand-primary hover:bg-brand-primaryDark disabled:bg-gray-200 dark:disabled:bg-gray-800 text-white disabled:text-gray-400 font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-soft mt-4"
                >
                  <span>Start Data Import</span>
                  <FiArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

            {/* Column Mapping Section */}
            <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft p-5">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800 mb-4">
                <FiSettings className="w-4 h-4 text-brand-primary" />
                <span className="text-xs font-bold text-gray-850 dark:text-gray-200 uppercase tracking-widest">Column Mapping Setup</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {SYSTEM_FIELDS.map((field) => {
                  const currentMapped = columnMapping[field.key];
                  const isAuto = DEFAULT_COLUMN_MAPPING[field.key] === currentMapped;
                  return (
                    <div key={field.key} className="bg-gray-50/50 dark:bg-gray-800/30 p-3 rounded-lg border border-gray-100 dark:border-gray-800/80 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </span>
                          <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide ${isAuto ? 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400' : 'bg-gray-105 dark:bg-gray-800 text-gray-400'}`}>
                            {isAuto ? 'Auto-Mapped' : 'Mapped'}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-550 font-medium mt-0.5">{field.desc}</p>
                      </div>
                      <select
                        value={currentMapped}
                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                        className="w-full mt-2.5 px-2 py-1.5 text-[11px] font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md outline-none focus:ring-1 focus:ring-brand-primary"
                      >
                        <option value="">-- Drop Column --</option>
                        {DUMMY_EXCEL_COLUMNS.map((col) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Validation Errors Panel */}
            {!validationResults.isValid && (
              <div className="bg-red-50/40 dark:bg-red-950/10 border border-red-100 dark:border-red-900/50 rounded-enterprise p-4">
                <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400 mb-3">
                  <FiAlertCircle className="w-4.5 h-4.5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Validation Errors Identified ({validationResults.errors.length} rows)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                  {validationResults.errors.map((err) => (
                    <div key={err.rowId} className="bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-red-100/60 dark:border-red-900/30 text-[11px] flex gap-2">
                      <div className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">
                        {err.rowNum}
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-gray-800 dark:text-gray-200">PO: {err.poId}</p>
                        <ul className="list-disc list-inside text-gray-500 dark:text-gray-450 space-y-0.5">
                          {err.messages.map((msg, i) => (
                            <li key={i}>{msg}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Excel Table */}
            <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-soft overflow-hidden">
              <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Excel Parsing Preview Log</h3>
                  <p className="text-[10px] text-gray-400 dark:text-gray-550 font-semibold mt-0.5">Double click cell inputs to modify invalid items</p>
                </div>
              </div>
              <div className="overflow-x-auto relative">
                <table className="w-full text-xs min-w-[1000px] table-auto">
                  <thead>
                    <tr className="bg-gray-55 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-left">
                      <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest w-12">Row</th>
                      {SYSTEM_FIELDS.map((field) => (
                        <th key={field.key} className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                          <p className="text-[8px] font-mono text-gray-400 dark:text-gray-500 lowercase mt-0.5">→ {columnMapping[field.key] || 'Dropped'}</p>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    {paginatedRows.map((row) => {
                      const isRowHasError = validationResults.errors.some(e => e.rowId === row.id);
                      return (
                        <tr key={row.id} className={`hover:bg-gray-50/60 dark:hover:bg-gray-800/20 transition-colors ${isRowHasError ? 'bg-red-50/10 dark:bg-red-950/5' : ''}`}>
                          <td className="px-5 py-3 text-gray-400 dark:text-gray-550 font-bold font-mono">{row.id}</td>
                          {SYSTEM_FIELDS.map((field) => {
                            const excelCol = columnMapping[field.key];
                            const cellValue = excelCol ? row[excelCol] : '';
                            
                            // Check if cell is invalid
                            let hasError = false;
                            if (field.required && (cellValue === undefined || cellValue === null || cellValue === '')) {
                              hasError = true;
                            } else if (field.key === 'quantity' && cellValue !== '' && (Number(cellValue) <= 0 || isNaN(Number(cellValue)))) {
                              hasError = true;
                            } else if (field.key === 'rate' && cellValue !== '' && (Number(cellValue) <= 0 || isNaN(Number(cellValue)))) {
                              hasError = true;
                            }

                            return (
                              <td key={field.key} className={`px-4 py-2 border-r border-gray-50 dark:border-gray-800/30 ${hasError ? 'bg-red-500/10 dark:bg-red-500/10' : ''}`}>
                                <input
                                  type="text"
                                  value={cellValue || ''}
                                  onChange={(e) => handleCellEdit(row.id, field.key, e.target.value)}
                                  className={`w-full bg-transparent px-1.5 py-1 text-xs font-semibold rounded outline-none border transition-all ${
                                    hasError
                                      ? 'border-red-400 focus:border-red-500 text-red-700 dark:text-red-400'
                                      : 'border-transparent hover:border-gray-200 focus:border-brand-primary/30 text-gray-800 dark:text-gray-250'
                                  }`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalRecords={excelRows.length}
                startIndex={(currentPage - 1) * rowsPerPage}
                endIndex={(currentPage - 1) * rowsPerPage + rowsPerPage}
                pageSize={rowsPerPage}
                onPageSizeChange={setRowsPerPage}
              />
            </div>

          </div>
        )}

        {/* STEP 3: Importing loader */}
        {step === 'importing' && (
          <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise p-12 text-center shadow-soft">
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-gray-880 dark:text-white uppercase tracking-wider">
                  Processing & Saving Data Records
                </h3>
                <p className="text-[11px] text-gray-400 dark:text-gray-550 mt-1 font-medium">
                  Uploading elements, verifying entries, and inserting transaction lines...
                </p>
              </div>
              <div className="w-full space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-505">
                  <span>Importing...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-primary transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Import Results Display */}
        {step === 'result' && (
          <div className="space-y-6">
            
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              
              <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise p-5 shadow-soft flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                  <FiFileText className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-450 dark:text-gray-500 font-bold uppercase tracking-wider">Total Rows</p>
                  <p className="text-lg font-extrabold text-gray-900 dark:text-white mt-0.5">{importStats.total}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise p-5 shadow-soft flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <FiCheck className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-450 dark:text-gray-500 font-bold uppercase tracking-wider">Imported</p>
                  <p className="text-lg font-extrabold text-green-500 mt-0.5">{importStats.imported}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise p-5 shadow-soft flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <FiInfo className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-450 dark:text-gray-500 font-bold uppercase tracking-wider">Skipped</p>
                  <p className="text-lg font-extrabold text-amber-500 mt-0.5">{importStats.skipped}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise p-5 shadow-soft flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <FiX className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-450 dark:text-gray-500 font-bold uppercase tracking-wider">Failed</p>
                  <p className="text-lg font-extrabold text-red-500 mt-0.5">{importStats.failed}</p>
                </div>
              </div>

            </div>

            {/* Success message banner */}
            <div className="bg-green-50 dark:bg-green-955/20 border border-green-100 dark:border-green-900/50 rounded-enterprise p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
                <FiCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-green-800 dark:text-green-400 uppercase tracking-wider">
                Excel Import Job Completed!
              </h3>
              <p className="text-xs text-green-600 dark:text-green-500 font-semibold mt-1">
                {importStats.imported} records were successfully loaded into the Sales PO database log.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 bg-white dark:bg-gray-850 hover:bg-gray-50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-750 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm"
                >
                  Upload New File
                </button>
                <a
                  href="/reports"
                  className="px-4 py-2.5 bg-brand-primary hover:bg-brand-primaryDark text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-soft"
                >
                  Go to Reports
                </a>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Action Toast Notifications */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[100] max-w-sm animate-slide-up">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </DashboardLayout>
  );
};

export default ImportExcel;
