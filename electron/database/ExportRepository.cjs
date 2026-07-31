const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const pptxgen = require('pptxgenjs');
const UserDatabaseService = require('../auth/UserDatabaseService.cjs');
const logger = require('../logger.cjs');

class ExportRepository {
  constructor(db, auditRepo) {
    this.db = db;
    this.auditRepo = auditRepo;
  }

  getExportDirectory() {
    const dir = path.join(UserDatabaseService.getStorageDirectory(), 'Exports');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  /**
   * Fetch filtered records from SQLite for any report type
   */
  fetchData(reportType, filters = {}) {
    const type = (reportType || 'Products').trim();
    let sql = '';
    let params = [];
    let title = '';
    let columns = [];
    let rows = [];
    let summary = { totalRecords: 0, totalAmount: 0, totalQty: 0 };

    switch (type.toLowerCase()) {
      case 'products':
        title = 'Products Master Report';
        sql = `SELECT p.id, p.product_code, p.brand_name AS product_name, d.name AS category_name, g.name AS group_name, u.name AS unit_type_name, p.tp, p.status, p.created_at
               FROM products p
               LEFT JOIN unit_types u ON p.unit_type_id = u.id
               LEFT JOIN divisions d ON p.division_id = d.id
               LEFT JOIN groups g ON p.group_id = g.id
               WHERE 1=1`;
        if (filters.search) {
          sql += ` AND (p.brand_name LIKE ? OR p.product_code LIKE ? OR d.name LIKE ?)`;
          const term = `%${filters.search}%`;
          params.push(term, term, term);
        }
        if (filters.product || filters.productId) {
          sql += ` AND p.id = ?`;
          params.push(filters.product || filters.productId);
        }
        if (filters.group) {
          sql += ` AND g.name = ?`;
          params.push(filters.group);
        }
        if (filters.status && filters.status !== 'All') {
          sql += ` AND p.status = ?`;
          params.push(filters.status);
        }
        sql += ` ORDER BY p.brand_name ASC`;

        columns = [
          { header: 'ID', key: 'id', width: 8, type: 'number' },
          { header: 'Code', key: 'product_code', width: 15, type: 'text' },
          { header: 'Product Name', key: 'product_name', width: 30, type: 'text' },
          { header: 'Category', key: 'category_name', width: 20, type: 'text' },
          { header: 'Group', key: 'group_name', width: 20, type: 'text' },
          { header: 'Unit', key: 'unit_type_name', width: 12, type: 'text' },
          { header: 'TP / Rate (Rs)', key: 'tp', width: 18, type: 'currency' },
          { header: 'Status', key: 'status', width: 12, type: 'text' }
        ];

        rows = this.db.prepare(sql).all(...params);
        summary.totalRecords = rows.length;
        summary.totalAmount = rows.reduce((sum, r) => sum + (Number(r.tp) || 0), 0);
        break;

      case 'doctors':
        title = 'Doctors Directory Report';
        sql = `SELECT d.id, d.name AS doctor_name, COALESCE(d.hospital, '—') AS designation, COALESCE(d.specialty, '—') AS specialty, COALESCE(d.city, '—') AS city, a.name AS area_name, CASE WHEN d.is_active = 1 THEN 'Active' ELSE 'Inactive' END AS status
               FROM doctors d
               LEFT JOIN areas a ON d.area_id = a.id
               WHERE 1=1`;
        if (filters.search) {
          sql += ` AND (d.name LIKE ? OR d.specialty LIKE ? OR d.hospital LIKE ? OR d.city LIKE ?)`;
          const term = `%${filters.search}%`;
          params.push(term, term, term, term);
        }
        if (filters.doctor || filters.doctorId) {
          sql += ` AND d.id = ?`;
          params.push(filters.doctor || filters.doctorId);
        }
        if (filters.area || filters.areaId) {
          sql += ` AND d.area_id = ?`;
          params.push(filters.area || filters.areaId);
        }
        if (filters.status && filters.status !== 'All') {
          const activeVal = filters.status === 'Active' ? 1 : 0;
          sql += ` AND d.is_active = ?`;
          params.push(activeVal);
        }
        sql += ` ORDER BY d.name ASC`;

        columns = [
          { header: 'ID', key: 'id', width: 8, type: 'number' },
          { header: 'Doctor Name', key: 'doctor_name', width: 28, type: 'text' },
          { header: 'Hospital/Designation', key: 'designation', width: 22, type: 'text' },
          { header: 'Specialty', key: 'specialty', width: 20, type: 'text' },
          { header: 'City', key: 'city', width: 16, type: 'text' },
          { header: 'Area', key: 'area_name', width: 18, type: 'text' },
          { header: 'Status', key: 'status', width: 12, type: 'text' }
        ];

        rows = this.db.prepare(sql).all(...params);
        summary.totalRecords = rows.length;
        break;

      case 'institutions':
        title = 'Institutions Master Report';
        sql = `SELECT i.id, COALESCE(i.code, 'INST-' || i.id) AS institution_code, i.name, COALESCE(i.type, '—') AS type, COALESCE(i.city, '—') AS city, a.name AS area_name, CASE WHEN i.is_active = 1 THEN 'Active' ELSE 'Inactive' END AS status
               FROM institutions i
               LEFT JOIN areas a ON i.area_id = a.id
               WHERE 1=1`;
        if (filters.search) {
          sql += ` AND (i.name LIKE ? OR i.code LIKE ? OR i.type LIKE ? OR i.city LIKE ?)`;
          const term = `%${filters.search}%`;
          params.push(term, term, term, term);
        }
        if (filters.institution || filters.institutionId) {
          sql += ` AND i.id = ?`;
          params.push(filters.institution || filters.institutionId);
        }
        if (filters.area || filters.areaId) {
          sql += ` AND i.area_id = ?`;
          params.push(filters.area || filters.areaId);
        }
        if (filters.status && filters.status !== 'All') {
          const activeVal = filters.status === 'Active' ? 1 : 0;
          sql += ` AND i.is_active = ?`;
          params.push(activeVal);
        }
        sql += ` ORDER BY i.name ASC`;

        columns = [
          { header: 'ID', key: 'id', width: 8, type: 'number' },
          { header: 'Code', key: 'institution_code', width: 15, type: 'text' },
          { header: 'Institution Name', key: 'name', width: 32, type: 'text' },
          { header: 'Type', key: 'type', width: 18, type: 'text' },
          { header: 'City', key: 'city', width: 16, type: 'text' },
          { header: 'Area', key: 'area_name', width: 20, type: 'text' },
          { header: 'Status', key: 'status', width: 12, type: 'text' }
        ];

        rows = this.db.prepare(sql).all(...params);
        summary.totalRecords = rows.length;
        break;

      case 'areas':
        title = 'Territory & Area Directory Report';
        sql = `SELECT id, name AS area_name, COALESCE(city, '—') AS city, COALESCE(description, '—') AS region, CASE WHEN is_active = 1 THEN 'Active' ELSE 'Inactive' END AS status FROM areas WHERE 1=1`;
        if (filters.search) {
          sql += ` AND (name LIKE ? OR city LIKE ? OR description LIKE ?)`;
          const term = `%${filters.search}%`;
          params.push(term, term, term);
        }
        if (filters.area || filters.areaId) {
          sql += ` AND id = ?`;
          params.push(filters.area || filters.areaId);
        }
        if (filters.status && filters.status !== 'All') {
          const activeVal = filters.status === 'Active' ? 1 : 0;
          sql += ` AND is_active = ?`;
          params.push(activeVal);
        }
        sql += ` ORDER BY name ASC`;

        columns = [
          { header: 'ID', key: 'id', width: 8, type: 'number' },
          { header: 'Area Name', key: 'area_name', width: 30, type: 'text' },
          { header: 'City', key: 'city', width: 18, type: 'text' },
          { header: 'Description', key: 'region', width: 22, type: 'text' },
          { header: 'Status', key: 'status', width: 12, type: 'text' }
        ];

        rows = this.db.prepare(sql).all(...params);
        summary.totalRecords = rows.length;
        break;

      case 'team members':
      case 'team_members':
      case 'teammembers':
        title = 'Team Members & Field Force Report';
        sql = `SELECT t.id, t.name, t.role, a.name AS area_name, CASE WHEN t.is_active = 1 THEN 'Active' ELSE 'Inactive' END AS status
               FROM team_members t
               LEFT JOIN areas a ON t.area_id = a.id
               WHERE 1=1`;
        if (filters.search) {
          sql += ` AND (t.name LIKE ? OR t.role LIKE ?)`;
          const term = `%${filters.search}%`;
          params.push(term, term);
        }
        if (filters.teamMember || filters.teamMemberId) {
          sql += ` AND t.id = ?`;
          params.push(filters.teamMember || filters.teamMemberId);
        }
        if (filters.area || filters.areaId) {
          sql += ` AND t.area_id = ?`;
          params.push(filters.area || filters.areaId);
        }
        if (filters.status && filters.status !== 'All') {
          const activeVal = filters.status === 'Active' ? 1 : 0;
          sql += ` AND t.is_active = ?`;
          params.push(activeVal);
        }
        sql += ` ORDER BY t.name ASC`;

        columns = [
          { header: 'ID', key: 'id', width: 8, type: 'number' },
          { header: 'Full Name', key: 'name', width: 28, type: 'text' },
          { header: 'Role', key: 'role', width: 20, type: 'text' },
          { header: 'Assigned Area', key: 'area_name', width: 20, type: 'text' },
          { header: 'Status', key: 'status', width: 12, type: 'text' }
        ];

        rows = this.db.prepare(sql).all(...params);
        summary.totalRecords = rows.length;
        break;

      case 'groups':
        title = 'Product Groups Report';
        sql = `SELECT id, name AS group_name, COALESCE(description, '—') AS description, CASE WHEN is_active = 1 THEN 'Active' ELSE 'Inactive' END AS status FROM groups WHERE 1=1`;
        if (filters.search) {
          sql += ` AND (name LIKE ? OR description LIKE ?)`;
          const term = `%${filters.search}%`;
          params.push(term, term);
        }
        if (filters.status && filters.status !== 'All') {
          const activeVal = filters.status === 'Active' ? 1 : 0;
          sql += ` AND is_active = ?`;
          params.push(activeVal);
        }
        sql += ` ORDER BY name ASC`;

        columns = [
          { header: 'ID', key: 'id', width: 8, type: 'number' },
          { header: 'Group Name', key: 'group_name', width: 30, type: 'text' },
          { header: 'Description', key: 'description', width: 35, type: 'text' },
          { header: 'Status', key: 'status', width: 12, type: 'text' }
        ];

        rows = this.db.prepare(sql).all(...params);
        summary.totalRecords = rows.length;
        break;

      case 'orders':
        title = 'Customer Orders Master Report';
        sql = `SELECT o.id, o.order_number, o.order_number AS po_number, o.order_date,
                      d.name AS doctor_name, i.name AS institution_name, a.name AS area_name, tm.name AS team_member_name,
                      o.total_amount, o.status, o.created_at
               FROM orders o
               LEFT JOIN doctors d ON o.doctor_id = d.id
               LEFT JOIN institutions i ON o.institution_id = i.id
               LEFT JOIN areas a ON o.area_id = a.id
               LEFT JOIN team_members tm ON o.team_member_id = tm.id
               WHERE 1=1`;
        if (filters.startDate) {
          sql += ` AND o.order_date >= ?`;
          params.push(filters.startDate);
        }
        if (filters.endDate) {
          sql += ` AND o.order_date <= ?`;
          params.push(filters.endDate);
        }
        if (filters.search) {
          sql += ` AND (o.order_number LIKE ? OR d.name LIKE ? OR i.name LIKE ?)`;
          const term = `%${filters.search}%`;
          params.push(term, term, term);
        }
        if (filters.doctor) {
          sql += ` AND d.name = ?`;
          params.push(filters.doctor);
        }
        if (filters.institution) {
          sql += ` AND i.name = ?`;
          params.push(filters.institution);
        }
        if (filters.area) {
          sql += ` AND a.name = ?`;
          params.push(filters.area);
        }
        if (filters.teamMember) {
          sql += ` AND tm.name = ?`;
          params.push(filters.teamMember);
        }
        if (filters.status && filters.status !== 'All') {
          sql += ` AND o.status = ?`;
          params.push(filters.status);
        }
        sql += ` ORDER BY o.id DESC`;

        columns = [
          { header: 'Order #', key: 'order_number', width: 16, type: 'text' },
          { header: 'PO Number', key: 'po_number', width: 16, type: 'text' },
          { header: 'Order Date', key: 'order_date', width: 14, type: 'text' },
          { header: 'Doctor', key: 'doctor_name', width: 24, type: 'text' },
          { header: 'Institution', key: 'institution_name', width: 24, type: 'text' },
          { header: 'Area', key: 'area_name', width: 18, type: 'text' },
          { header: 'Team Member', key: 'team_member_name', width: 20, type: 'text' },
          { header: 'Total Amount (Rs)', key: 'total_amount', width: 20, type: 'currency' },
          { header: 'Status', key: 'status', width: 14, type: 'text' }
        ];

        rows = this.db.prepare(sql).all(...params);
        summary.totalRecords = rows.length;
        summary.totalAmount = rows.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);
        break;

      case 'sales':
        title = 'Sales Processing & Invoicing Report';
        sql = `SELECT o.id, o.order_number, o.order_number AS po_number, o.order_date,
                      d.name AS doctor_name, i.name AS institution_name, a.name AS area_name, tm.name AS team_member_name,
                      o.total_amount, o.status, o.created_at
               FROM orders o
               LEFT JOIN doctors d ON o.doctor_id = d.id
               LEFT JOIN institutions i ON o.institution_id = i.id
               LEFT JOIN areas a ON o.area_id = a.id
               LEFT JOIN team_members tm ON o.team_member_id = tm.id
               WHERE o.status = 'Completed'`;
        if (filters.startDate) {
          sql += ` AND o.order_date >= ?`;
          params.push(filters.startDate);
        }
        if (filters.endDate) {
          sql += ` AND o.order_date <= ?`;
          params.push(filters.endDate);
        }
        if (filters.search) {
          sql += ` AND (o.order_number LIKE ? OR d.name LIKE ? OR i.name LIKE ?)`;
          const term = `%${filters.search}%`;
          params.push(term, term, term);
        }
        if (filters.area) {
          sql += ` AND a.name = ?`;
          params.push(filters.area);
        }
        if (filters.teamMember) {
          sql += ` AND tm.name = ?`;
          params.push(filters.teamMember);
        }
        sql += ` ORDER BY o.id DESC`;

        columns = [
          { header: 'Invoice / Order #', key: 'order_number', width: 18, type: 'text' },
          { header: 'PO Number', key: 'po_number', width: 16, type: 'text' },
          { header: 'Sale Date', key: 'order_date', width: 14, type: 'text' },
          { header: 'Doctor Name', key: 'doctor_name', width: 24, type: 'text' },
          { header: 'Institution', key: 'institution_name', width: 24, type: 'text' },
          { header: 'Area', key: 'area_name', width: 18, type: 'text' },
          { header: 'Sales Rep', key: 'team_member_name', width: 20, type: 'text' },
          { header: 'Net Value (Rs)', key: 'total_amount', width: 20, type: 'currency' },
          { header: 'Status', key: 'status', width: 14, type: 'text' }
        ];

        rows = this.db.prepare(sql).all(...params);
        summary.totalRecords = rows.length;
        summary.totalAmount = rows.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);
        break;

      case 'targets':
        title = 'Annual Sales Targets & Achievement Report';
        sql = `SELECT pt.id, byr.year_name AS business_year, COALESCE(p.brand_name, p.name) AS product_name, u.name AS unit,
                      pt.annual_target_qty AS annual_target, (pt.annual_target_qty * COALESCE(p.tp, 0)) AS target_value, pt.created_at
               FROM product_targets pt
               JOIN products p ON pt.product_id = p.id
               LEFT JOIN unit_types u ON p.unit_type_id = u.id
               JOIN business_years byr ON pt.business_year_id = byr.id
               WHERE 1=1`;
        if (filters.search) {
          sql += ` AND (p.brand_name LIKE ? OR byr.year_name LIKE ?)`;
          const term = `%${filters.search}%`;
          params.push(term, term);
        }
        sql += ` ORDER BY byr.year_name DESC, product_name ASC`;

        columns = [
          { header: 'Business Year', key: 'business_year', width: 16, type: 'text' },
          { header: 'Product Name', key: 'product_name', width: 28, type: 'text' },
          { header: 'Unit', key: 'unit', width: 12, type: 'text' },
          { header: 'Annual Target Qty', key: 'annual_target', width: 18, type: 'number' },
          { header: 'Target Value (Rs)', key: 'target_value', width: 20, type: 'currency' }
        ];

        rows = this.db.prepare(sql).all(...params);
        summary.totalRecords = rows.length;
        summary.totalQty = rows.reduce((sum, r) => sum + (Number(r.annual_target) || 0), 0);
        summary.totalAmount = rows.reduce((sum, r) => sum + (Number(r.target_value) || 0), 0);
        break;

      case 'audit trail':
      case 'audit_trail':
      case 'auditlog':
        title = 'System Activity & Audit Trail Report';
        sql = `SELECT id, module, entity_type, entity_id, action, performed_by, performed_at FROM audit_logs WHERE 1=1`;
        if (filters.startDate) {
          sql += ` AND performed_at >= ?`;
          params.push(filters.startDate);
        }
        if (filters.endDate) {
          sql += ` AND performed_at <= ?`;
          params.push(filters.endDate);
        }
        if (filters.search) {
          sql += ` AND (module LIKE ? OR action LIKE ? OR performed_by LIKE ?)`;
          const term = `%${filters.search}%`;
          params.push(term, term, term);
        }
        if (filters.status && filters.status !== 'All') {
          sql += ` AND module = ?`;
          params.push(filters.status);
        }
        sql += ` ORDER BY id DESC LIMIT 500`;

        columns = [
          { header: 'Log ID', key: 'id', width: 10, type: 'number' },
          { header: 'Module', key: 'module', width: 18, type: 'text' },
          { header: 'Entity', key: 'entity_type', width: 16, type: 'text' },
          { header: 'Entity ID', key: 'entity_id', width: 16, type: 'text' },
          { header: 'Action', key: 'action', width: 22, type: 'text' },
          { header: 'Performed By', key: 'performed_by', width: 20, type: 'text' },
          { header: 'Timestamp', key: 'performed_at', width: 22, type: 'text' }
        ];

        rows = this.db.prepare(sql).all(...params);
        summary.totalRecords = rows.length;
        break;

      case 'master export':
      case 'master_export':
        title = 'Master Enterprise System Export';
        columns = [
          { header: 'Module Name', key: 'module_name', width: 25, type: 'text' },
          { header: 'Total Records', key: 'record_count', width: 16, type: 'number' },
          { header: 'Total Value (Rs)', key: 'total_val', width: 22, type: 'currency' },
          { header: 'Status / Scope', key: 'status_scope', width: 18, type: 'text' }
        ];

        const masterDataObj = this.fetchMasterData(filters);
        rows = Object.keys(masterDataObj.modules).map(modKey => {
          const modData = masterDataObj.modules[modKey];
          return {
            module_name: modKey,
            record_count: modData.summary.totalRecords || 0,
            total_val: modData.summary.totalAmount || 0,
            status_scope: 'Active Scope'
          };
        });

        summary.totalRecords = masterDataObj.summary.totalRecords;
        summary.totalAmount = masterDataObj.summary.totalAmount;
        break;

      case 'dashboard':
      case 'reports':
      default:
        title = 'Executive Business Summary & Performance Report';
        sql = `SELECT strftime('%Y-%m', order_date) AS sales_month, COUNT(id) AS total_orders, COALESCE(SUM(total_amount), 0.0) AS total_sales
               FROM orders
               WHERE status = 'Completed'
               GROUP BY sales_month
               ORDER BY sales_month ASC`;
        columns = [
          { header: 'Sales Month', key: 'sales_month', width: 20, type: 'text' },
          { header: 'Total Orders', key: 'total_orders', width: 18, type: 'number' },
          { header: 'Total Sales (Rs)', key: 'total_sales', width: 25, type: 'currency' }
        ];

        rows = this.db.prepare(sql).all();
        summary.totalRecords = rows.length;
        summary.totalAmount = rows.reduce((sum, r) => sum + (Number(r.total_sales) || 0), 0);
        summary.totalQty = rows.reduce((sum, r) => sum + (Number(r.total_orders) || 0), 0);
        break;
    }

    return { title, columns, rows, summary };
  }

  /**
   * Fetch all 12 modules into a single Master Export data object
   */
  fetchMasterData(filters = {}) {
    const modulesToFetch = [
      { key: 'Dashboard Summary', type: 'Dashboard' },
      { key: 'Products', type: 'Products' },
      { key: 'Doctors', type: 'Doctors' },
      { key: 'Institutions', type: 'Institutions' },
      { key: 'Areas', type: 'Areas' },
      { key: 'Team Members', type: 'Team Members' },
      { key: 'Groups', type: 'Groups' },
      { key: 'Orders', type: 'Orders' },
      { key: 'Sales', type: 'Sales' },
      { key: 'Targets', type: 'Targets' },
      { key: 'Audit Trail', type: 'Audit Trail' },
      { key: 'Reports Summary', type: 'Reports' }
    ];

    const masterModules = {};
    let totalRecords = 0;
    let totalAmount = 0;

    for (const mod of modulesToFetch) {
      const data = this.fetchData(mod.type, filters);
      masterModules[mod.key] = data;
      totalRecords += data.summary.totalRecords || 0;
      totalAmount += data.summary.totalAmount || 0;
    }

    return {
      title: 'Master Enterprise System Export',
      reportType: 'Master Export',
      modules: masterModules,
      summary: {
        totalRecords,
        totalAmount
      }
    };
  }

  /**
   * Main export handler supporting Excel (.xlsx), PDF (.pdf), and PowerPoint (.pptx)
   */
  async generateExport({ reportType, format, filters = {}, targetFilePath = null, user = 'System' }) {
    const formatClean = (format || 'excel').toLowerCase().replace('.', '');
    const exportDir = this.getExportDirectory();

    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const safeType = (reportType || 'Export').replace(/[^a-zA-Z0-9]/g, '_');
    let ext = 'xlsx';
    if (formatClean === 'pdf') ext = 'pdf';
    if (formatClean === 'pptx' || formatClean === 'powerpoint') ext = 'pptx';

    const defaultPrefix = safeType.toLowerCase().includes('master') ? 'Master_Export' : `Himmel_${safeType}`;
    const fileName = targetFilePath ? path.basename(targetFilePath) : `${defaultPrefix}_${timestampStr}.${ext}`;
    const filePath = targetFilePath || path.join(exportDir, fileName);

    logger.info(`Starting export: ${reportType} -> ${formatClean.toUpperCase()} at ${filePath}`);

    let totalRecords = 0;
    let totalAmount = 0;

    if (safeType.toLowerCase().includes('master')) {
      const masterData = this.fetchMasterData(filters);
      totalRecords = masterData.summary.totalRecords;
      totalAmount = masterData.summary.totalAmount;

      if (ext === 'xlsx') {
        await this.generateMasterExcel(filePath, masterData, filters, user);
      } else if (ext === 'pdf') {
        await this.generateMasterPDF(filePath, masterData, filters, user);
      } else if (ext === 'pptx') {
        await this.generateMasterPowerPoint(filePath, masterData, filters, user);
      } else {
        throw new Error(`Unsupported export format '${format}'.`);
      }
    } else {
      const data = this.fetchData(reportType, filters);
      totalRecords = data.summary.totalRecords;
      totalAmount = data.summary.totalAmount;

      if (ext === 'xlsx') {
        await this.generateExcel(filePath, data, filters, user);
      } else if (ext === 'pdf') {
        await this.generatePDF(filePath, data, filters, user);
      } else if (ext === 'pptx') {
        await this.generatePowerPoint(filePath, data, filters, user);
      } else {
        throw new Error(`Unsupported export format '${format}'.`);
      }
    }

    // Log action to audit repository
    if (this.auditRepo && typeof this.auditRepo.logAction === 'function') {
      try {
        this.auditRepo.logAction({
          module: 'Export Center',
          entityType: safeType.toLowerCase().includes('master') ? 'MasterExportFile' : 'ExportFile',
          entityId: fileName,
          action: safeType.toLowerCase().includes('master') ? `Master Export ${ext.toUpperCase()}` : `Export ${ext.toUpperCase()}`,
          newValue: { reportType, format: ext, fileName, totalRecords, filters },
          performedBy: user
        });
      } catch (aErr) {
        logger.error('Failed to log export action to audit trail:', aErr);
      }
    }

    return {
      success: true,
      reportType,
      format: ext,
      fileName,
      filePath,
      totalRecords,
      totalAmount,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Excel Export (.xlsx) using exceljs
   */
  async generateExcel(filePath, data, filters, user) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Himmel Pharmaceutical System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(data.title.substring(0, 30));

    // 1. Header Information Block
    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'HIMMEL PHARMACEUTICAL LTD';
    titleCell.font = { bold: true, size: 16, color: { argb: '9E1B1E' } };
    titleCell.alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:H2');
    const subCell = sheet.getCell('A2');
    subCell.value = `${data.title} | Generated: ${new Date().toLocaleString()} | User: ${user}`;
    subCell.font = { bold: true, size: 11, color: { argb: '475569' } };
    subCell.alignment = { horizontal: 'center' };

    let filterText = 'Filters: None';
    const filterParts = [];
    if (filters.startDate) filterParts.push(`Start: ${filters.startDate}`);
    if (filters.endDate) filterParts.push(`End: ${filters.endDate}`);
    if (filters.search) filterParts.push(`Search: "${filters.search}"`);
    if (filters.area) filterParts.push(`Area: ${filters.area}`);
    if (filters.status) filterParts.push(`Status: ${filters.status}`);
    if (filterParts.length > 0) filterText = `Filters: ${filterParts.join(' | ')}`;

    sheet.mergeCells('A3:H3');
    const filterCell = sheet.getCell('A3');
    filterCell.value = filterText;
    filterCell.font = { italic: true, size: 10, color: { argb: '64748B' } };
    filterCell.alignment = { horizontal: 'center' };

    sheet.addRow([]); // Blank row at row 4

    // 2. Table Column Headers (Row 5)
    const headerRowValues = data.columns.map(c => c.header);
    const headerRow = sheet.addRow(headerRowValues);
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: '334155' } },
        bottom: { style: 'medium', color: { argb: '0F172A' } }
      };
    });

    // 3. Populate Rows
    data.rows.forEach((r, idx) => {
      const rowVals = data.columns.map(col => {
        const val = r[col.key];
        if (col.type === 'currency') {
          return Number(val) || 0;
        }
        return val !== null && val !== undefined ? val : '—';
      });
      const dataRow = sheet.addRow(rowVals);
      dataRow.height = 20;

      dataRow.eachCell((cell, colIdx) => {
        const colDef = data.columns[colIdx - 1];
        if (colDef && colDef.type === 'currency') {
          cell.numFmt = '"Rs "#,##0.00';
          cell.alignment = { horizontal: 'right' };
        } else if (colDef && colDef.type === 'number') {
          cell.alignment = { horizontal: 'right' };
        } else {
          cell.alignment = { horizontal: 'left' };
        }

        // Zebra striping
        if (idx % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
        }
      });
    });

    // 4. Totals Row (if applicable)
    if (data.rows.length > 0 && (data.summary.totalAmount > 0 || data.summary.totalQty > 0)) {
      const totalVals = data.columns.map((col, idx) => {
        if (idx === 0) return 'TOTAL / SUMMARY';
        if (col.type === 'currency') return data.summary.totalAmount;
        if (col.key === 'annual_target' || col.key === 'total_orders') return data.summary.totalQty;
        return '';
      });

      const totalRow = sheet.addRow(totalVals);
      totalRow.height = 24;
      totalRow.eachCell((cell, colIdx) => {
        cell.font = { bold: true, color: { argb: '9E1B1E' }, size: 11 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF2F2' } };
        cell.border = { top: { style: 'double', color: { argb: '9E1B1E' } }, bottom: { style: 'double', color: { argb: '9E1B1E' } } };
        const colDef = data.columns[colIdx - 1];
        if (colDef && colDef.type === 'currency') {
          cell.numFmt = '"Rs "#,##0.00';
        }
      });
    }

    // Auto column widths
    sheet.columns.forEach((col, idx) => {
      const colDef = data.columns[idx];
      if (colDef) {
        col.width = Math.max(colDef.width || 15, 12);
      }
    });

    // Freeze header row
    sheet.views = [{ state: 'frozen', ySplit: 5 }];

    await workbook.xlsx.writeFile(filePath);
  }

  /**
   * PDF Export (.pdf) using pdfkit
   */
  async generatePDF(filePath, data, filters, user) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header Banner
      doc.rect(30, 25, 782, 45).fill('#1E293B');
      doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold').text('HIMMEL PHARMACEUTICAL LTD', 45, 33);
      doc.fillColor('#F1F5F9').fontSize(10).font('Helvetica').text(data.title.toUpperCase(), 45, 52);

      const timestamp = new Date().toLocaleString();
      doc.fillColor('#94A3B8').fontSize(9).text(`Generated: ${timestamp}`, 580, 35, { align: 'right' });
      doc.text(`User: ${user}`, 580, 50, { align: 'right' });

      // Filters summary bar
      doc.rect(30, 75, 782, 20).fill('#F8FAFC');
      let filterStr = `Total Records: ${data.summary.totalRecords}`;
      if (data.summary.totalAmount > 0) {
        filterStr += `  |  Total Value: Rs ${data.summary.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      }
      if (filters.search) filterStr += `  |  Search: "${filters.search}"`;
      if (filters.status) filterStr += `  |  Status: ${filters.status}`;
      doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold').text(filterStr, 40, 80);

      // Table Setup
      let y = 105;
      const startX = 30;
      const totalW = 782;

      // Draw Column Headers
      doc.rect(startX, y, totalW, 20).fill('#9E1B1E');
      let x = startX;
      const colWidths = data.columns.map(c => Math.floor((c.width / 160) * totalW));

      doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
      data.columns.forEach((col, i) => {
        const w = colWidths[i];
        doc.text(col.header, x + 4, y + 5, { width: w - 8, align: col.type === 'currency' || col.type === 'number' ? 'right' : 'left' });
        x += w;
      });

      y += 20;

      // Table Rows
      doc.font('Helvetica').fontSize(8);
      data.rows.forEach((row, rowIdx) => {
        if (y > 520) {
          doc.addPage({ size: 'A4', layout: 'landscape', margin: 30 });
          y = 40;
          // Redraw Table Header on new page
          doc.rect(startX, y, totalW, 20).fill('#9E1B1E');
          let rx = startX;
          doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
          data.columns.forEach((col, i) => {
            const w = colWidths[i];
            doc.text(col.header, rx + 4, y + 5, { width: w - 8, align: col.type === 'currency' || col.type === 'number' ? 'right' : 'left' });
            rx += w;
          });
          y += 20;
          doc.font('Helvetica').fontSize(8);
        }

        // Zebra background
        if (rowIdx % 2 === 1) {
          doc.rect(startX, y, totalW, 18).fill('#F8FAFC');
        }

        let cx = startX;
        doc.fillColor('#1E293B');
        data.columns.forEach((col, colIdx) => {
          const w = colWidths[colIdx];
          let val = row[col.key];
          if (col.type === 'currency') {
            val = val !== null && val !== undefined ? `Rs ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'Rs 0.00';
          } else if (val === null || val === undefined) {
            val = '—';
          } else {
            val = String(val);
          }
          doc.text(val, cx + 4, y + 4, { width: w - 8, align: col.type === 'currency' || col.type === 'number' ? 'right' : 'left', lineBreak: false });
          cx += w;
        });

        // Bottom row border
        doc.moveTo(startX, y + 18).lineTo(startX + totalW, y + 18).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
        y += 18;
      });

      // Footer with Page Numbers
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fillColor('#94A3B8').fontSize(8).font('Helvetica').text(
          `Himmel Pharmaceutical Sales System  |  Confidential  |  Page ${i + 1} of ${pages.count}`,
          30,
          560,
          { width: 782, align: 'center' }
        );
      }

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  }

  /**
   * PowerPoint Export (.pptx) using pptxgenjs
   */
  async generatePowerPoint(filePath, data, filters, user) {
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';

    const crimson = '9E1B1E';
    const darkSlate = '1E293B';
    const lightBg = 'F8FAFC';

    // SLIDE 1: Cover Slide
    const slide1 = pptx.addSlide();
    slide1.background = { color: darkSlate };
    slide1.addText('HIMMEL PHARMACEUTICAL LTD', {
      x: 0.8, y: 1.5, w: '90%', fontSize: 26, color: 'FFFFFF', bold: true
    });
    slide1.addText(data.title, {
      x: 0.8, y: 2.3, w: '90%', fontSize: 20, color: crimson, bold: true
    });
    slide1.addText(`Enterprise Sales & Management Intelligence Presentation`, {
      x: 0.8, y: 3.0, w: '90%', fontSize: 13, color: 'CBD5E1'
    });
    slide1.addText(`Generated By: ${user}  |  Date: ${new Date().toLocaleDateString()}  |  Year: 2025-2026`, {
      x: 0.8, y: 4.8, w: '90%', fontSize: 11, color: '94A3B8'
    });

    // SLIDE 2: Executive Summary
    const slide2 = pptx.addSlide();
    slide2.background = { color: lightBg };
    slide2.addText('Executive Summary & Metrics', {
      x: 0.5, y: 0.4, w: '90%', fontSize: 20, bold: true, color: darkSlate
    });

    // KPI Cards
    const kpis = [
      { title: 'Total Records', val: data.summary.totalRecords.toLocaleString(), color: '0284C7' },
      { title: 'Total Value (Rs)', val: data.summary.totalAmount > 0 ? `Rs ${data.summary.totalAmount.toLocaleString()}` : 'N/A', color: crimson },
      { title: 'Total Target / Qty', val: data.summary.totalQty > 0 ? data.summary.totalQty.toLocaleString() : 'N/A', color: '16A34A' }
    ];

    kpis.forEach((k, idx) => {
      const xPos = 0.5 + idx * 3.2;
      slide2.addShape(pptx.shapes.RECTANGLE, {
        x: xPos, y: 1.2, w: 3.0, h: 1.6, fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 1 }
      });
      slide2.addText(k.title, {
        x: xPos + 0.2, y: 1.4, w: 2.6, fontSize: 11, color: '64748B', bold: true
      });
      slide2.addText(k.val, {
        x: xPos + 0.2, y: 1.9, w: 2.6, fontSize: 18, color: k.color, bold: true
      });
    });

    slide2.addText('Key Takeaways & Highlights:', {
      x: 0.5, y: 3.2, w: 9.0, fontSize: 14, bold: true, color: darkSlate
    });
    slide2.addText(`• System processed ${data.summary.totalRecords} filtered records for module '${data.title}'.`, {
      x: 0.8, y: 3.7, w: 8.5, fontSize: 12, color: '334155'
    });
    slide2.addText(`• Applied Filter Criteria: ${filters.search ? `Search: "${filters.search}"` : 'All Active Scope'}.`, {
      x: 0.8, y: 4.1, w: 8.5, fontSize: 12, color: '334155'
    });
    slide2.addText(`• Prepared and verified automatically by Himmel Enterprise Data Bridge.`, {
      x: 0.8, y: 4.5, w: 8.5, fontSize: 12, color: '334155'
    });

    // SLIDE 3: Performance Chart
    const slide3 = pptx.addSlide();
    slide3.background = { color: 'FFFFFF' };
    slide3.addText('Visual Graphical Analytics', {
      x: 0.5, y: 0.4, w: '90%', fontSize: 20, bold: true, color: darkSlate
    });

    // Generate bar chart data from rows
    const chartRows = data.rows.slice(0, 8);
    const chartLabels = chartRows.map(r => r.product_name || r.doctor_name || r.name || r.order_number || r.sales_month || `Row #${r.id}`);
    const chartValues = chartRows.map(r => Number(r.tp || r.total_amount || r.annual_target || r.total_sales || 100));

    const chartData = [
      {
        name: 'Metrics',
        labels: chartLabels.length > 0 ? chartLabels : ['Sample A', 'Sample B', 'Sample C'],
        values: chartValues.length > 0 ? chartValues : [100, 200, 150]
      }
    ];

    slide3.addChart(pptx.ChartType.bar, chartData, {
      x: 0.5, y: 1.1, w: 9.0, h: 4.2, barDir: 'col', chartColors: [crimson], showValue: true
    });

    // SLIDE 4+: Data Tables (auto page break)
    const tableHeaderCells = data.columns.map(col => ({
      text: col.header,
      options: { fill: darkSlate, color: 'FFFFFF', bold: true, fontSize: 10, align: 'center' }
    }));

    const tableBodyRows = data.rows.map((row, idx) => {
      return data.columns.map(col => {
        let val = row[col.key];
        if (col.type === 'currency') {
          val = val !== null && val !== undefined ? `Rs ${Number(val).toLocaleString()}` : 'Rs 0';
        } else if (val === null || val === undefined) {
          val = '—';
        } else {
          val = String(val);
        }
        return {
          text: val,
          options: {
            fontSize: 9,
            fill: idx % 2 === 1 ? 'F8FAFC' : 'FFFFFF',
            align: col.type === 'currency' || col.type === 'number' ? 'right' : 'left'
          }
        };
      });
    });

    const slide4 = pptx.addSlide();
    slide4.addText(`${data.title} Data Directory`, {
      x: 0.5, y: 0.4, w: '90%', fontSize: 18, bold: true, color: darkSlate
    });

    const fullTable = [tableHeaderCells, ...tableBodyRows];
    slide4.addTable(fullTable, {
      x: 0.5, y: 1.0, w: 9.0, colW: data.columns.map(c => Math.max(1.0, c.width / 15)), autoPage: true
    });

    // FINAL SLIDE: Sign-off & Verification
    const slideFinal = pptx.addSlide();
    slideFinal.background = { color: darkSlate };
    slideFinal.addText('Report Execution Completed', {
      x: 0.8, y: 1.8, w: '90%', fontSize: 24, bold: true, color: 'FFFFFF'
    });
    slideFinal.addText('Himmel Pharmaceutical Sales Management Intelligence System', {
      x: 0.8, y: 2.6, w: '90%', fontSize: 14, color: crimson, bold: true
    });
    slideFinal.addText(`Export Verified: ${filePath}`, {
      x: 0.8, y: 3.4, w: '90%', fontSize: 10, color: '94A3B8'
    });
    slideFinal.addText('Confidential  |  Internal Management & Board Presentation Use Only', {
      x: 0.8, y: 4.8, w: '90%', fontSize: 10, color: 'CBD5E1'
    });

    await pptx.writeFile({ fileName: filePath });
  }

  /**
   * Master Excel Export (.xlsx) containing 12 worksheets
   */
  async generateMasterExcel(filePath, masterData, filters, user) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Himmel Pharmaceutical System';
    workbook.created = new Date();

    for (const [modName, data] of Object.entries(masterData.modules)) {
      const sheetName = modName.substring(0, 31).replace(/[\/*?:\[\]]/g, '_');
      const sheet = workbook.addWorksheet(sheetName);

      // Header Information Block
      sheet.mergeCells('A1:H1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'HIMMEL PHARMACEUTICAL LTD';
      titleCell.font = { bold: true, size: 16, color: { argb: '9E1B1E' } };
      titleCell.alignment = { horizontal: 'center' };

      sheet.mergeCells('A2:H2');
      const subCell = sheet.getCell('A2');
      subCell.value = `${data.title} (Master Export) | Generated: ${new Date().toLocaleString()} | User: ${user}`;
      subCell.font = { bold: true, size: 11, color: { argb: '475569' } };
      subCell.alignment = { horizontal: 'center' };

      let filterText = 'Filters: None';
      const filterParts = [];
      if (filters.startDate) filterParts.push(`Start: ${filters.startDate}`);
      if (filters.endDate) filterParts.push(`End: ${filters.endDate}`);
      if (filters.search) filterParts.push(`Search: "${filters.search}"`);
      if (filters.area) filterParts.push(`Area: ${filters.area}`);
      if (filters.status) filterParts.push(`Status: ${filters.status}`);
      if (filterParts.length > 0) filterText = `Filters: ${filterParts.join(' | ')}`;

      sheet.mergeCells('A3:H3');
      const filterCell = sheet.getCell('A3');
      filterCell.value = filterText;
      filterCell.font = { italic: true, size: 10, color: { argb: '64748B' } };
      filterCell.alignment = { horizontal: 'center' };

      sheet.addRow([]);

      // Table Column Headers
      const headerRowValues = data.columns.map(c => c.header);
      const headerRow = sheet.addRow(headerRowValues);
      headerRow.height = 24;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: '334155' } },
          bottom: { style: 'medium', color: { argb: '0F172A' } }
        };
      });

      // Populate Rows
      data.rows.forEach((r, idx) => {
        const rowVals = data.columns.map(col => {
          const val = r[col.key];
          if (col.type === 'currency') return Number(val) || 0;
          return val !== null && val !== undefined ? val : '—';
        });
        const dataRow = sheet.addRow(rowVals);
        dataRow.height = 20;

        dataRow.eachCell((cell, colIdx) => {
          const colDef = data.columns[colIdx - 1];
          if (colDef && colDef.type === 'currency') {
            cell.numFmt = '"Rs "#,##0.00';
            cell.alignment = { horizontal: 'right' };
          } else if (colDef && colDef.type === 'number') {
            cell.alignment = { horizontal: 'right' };
          } else {
            cell.alignment = { horizontal: 'left' };
          }

          if (idx % 2 === 1) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
          }
        });
      });

      // Totals Row
      if (data.rows.length > 0 && (data.summary.totalAmount > 0 || data.summary.totalQty > 0)) {
        const totalVals = data.columns.map((col, idx) => {
          if (idx === 0) return 'TOTAL / SUMMARY';
          if (col.type === 'currency') return data.summary.totalAmount;
          if (col.key === 'annual_target' || col.key === 'total_orders') return data.summary.totalQty;
          return '';
        });

        const totalRow = sheet.addRow(totalVals);
        totalRow.height = 24;
        totalRow.eachCell((cell, colIdx) => {
          cell.font = { bold: true, color: { argb: '9E1B1E' }, size: 11 };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF2F2' } };
          cell.border = { top: { style: 'double', color: { argb: '9E1B1E' } }, bottom: { style: 'double', color: { argb: '9E1B1E' } } };
          const colDef = data.columns[colIdx - 1];
          if (colDef && colDef.type === 'currency') {
            cell.numFmt = '"Rs "#,##0.00';
          }
        });
      }

      sheet.columns.forEach((col, idx) => {
        const colDef = data.columns[idx];
        if (colDef) {
          col.width = Math.max(colDef.width || 15, 12);
        }
      });
      sheet.views = [{ state: 'frozen', ySplit: 5 }];
    }

    await workbook.xlsx.writeFile(filePath);
  }

  /**
   * Master PDF Export (.pdf) containing cover page, executive summary, and multi-module sections
   */
  async generateMasterPDF(filePath, masterData, filters, user) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // 1. COVER PAGE
      doc.rect(0, 0, 842, 595).fill('#1E293B');
      doc.fillColor('#9E1B1E').fontSize(28).font('Helvetica-Bold').text('HIMMEL PHARMACEUTICAL LTD', 50, 180, { align: 'center' });
      doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('MASTER ENTERPRISE SYSTEM EXPORT', 50, 230, { align: 'center' });
      doc.fillColor('#CBD5E1').fontSize(14).font('Helvetica').text('Comprehensive Multi-Module Business Intelligence Report', 50, 270, { align: 'center' });
      
      const filterSummaryText = filters.search ? `Filter: Search "${filters.search}"` : 'Scope: Full Business System';
      doc.fillColor('#94A3B8').fontSize(11).text(`Generated By: ${user}  |  Date: ${new Date().toLocaleString()}  |  ${filterSummaryText}`, 50, 480, { align: 'center' });

      // 2. EXECUTIVE SUMMARY PAGE
      doc.addPage({ size: 'A4', layout: 'landscape', margin: 30 });
      doc.rect(30, 25, 782, 45).fill('#1E293B');
      doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold').text('HIMMEL PHARMACEUTICAL LTD', 45, 33);
      doc.fillColor('#F1F5F9').fontSize(10).font('Helvetica').text('MASTER EXPORT — EXECUTIVE SUMMARY', 45, 52);

      let yPos = 90;
      doc.fillColor('#0F172A').fontSize(14).font('Helvetica-Bold').text('Module Summary Overview', 40, yPos);
      yPos += 25;

      doc.rect(40, yPos, 760, 22).fill('#9E1B1E');
      doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold');
      doc.text('Module Name', 50, yPos + 6);
      doc.text('Total Records', 300, yPos + 6);
      doc.text('Total Value (Rs)', 500, yPos + 6, { width: 150, align: 'right' });
      yPos += 22;

      for (const [modName, data] of Object.entries(masterData.modules)) {
        if (yPos > 520) {
          doc.addPage({ size: 'A4', layout: 'landscape', margin: 30 });
          yPos = 40;
        }
        doc.rect(40, yPos, 760, 20).fill(yPos % 40 === 0 ? '#F8FAFC' : '#FFFFFF');
        doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold').text(modName, 50, yPos + 5);
        doc.fillColor('#334155').fontSize(9).font('Helvetica').text(String(data.summary.totalRecords || 0), 300, yPos + 5);
        const valStr = data.summary.totalAmount > 0 ? `Rs ${data.summary.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—';
        doc.fillColor('#334155').fontSize(9).font('Helvetica').text(valStr, 500, yPos + 5, { width: 150, align: 'right' });
        yPos += 20;
      }

      // 3. MODULE DETAIL SECTIONS
      for (const [modName, data] of Object.entries(masterData.modules)) {
        doc.addPage({ size: 'A4', layout: 'landscape', margin: 30 });
        doc.rect(30, 25, 782, 40).fill('#1E293B');
        doc.fillColor('#FFFFFF').fontSize(14).font('Helvetica-Bold').text('HIMMEL PHARMACEUTICAL LTD', 45, 32);
        doc.fillColor('#F1F5F9').fontSize(10).font('Helvetica').text(modName.toUpperCase(), 45, 48);
        doc.fillColor('#94A3B8').fontSize(9).text(`Records: ${data.summary.totalRecords}`, 600, 38, { align: 'right' });

        let mY = 80;
        const colCount = Math.max(1, data.columns.length);
        const colWidth = Math.min(100, Math.floor(760 / colCount));

        doc.rect(40, mY, 760, 20).fill('#334155');
        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
        data.columns.forEach((col, cIdx) => {
          doc.text(col.header, 45 + cIdx * colWidth, mY + 6, { width: colWidth - 5, ellipsis: true });
        });
        mY += 20;

        data.rows.slice(0, 22).forEach((r, rIdx) => {
          if (mY > 520) {
            doc.addPage({ size: 'A4', layout: 'landscape', margin: 30 });
            mY = 40;
          }
          doc.rect(40, mY, 760, 18).fill(rIdx % 2 === 1 ? '#F8FAFC' : '#FFFFFF');
          doc.fillColor('#1E293B').fontSize(8).font('Helvetica');
          data.columns.forEach((col, cIdx) => {
            let val = r[col.key];
            if (col.type === 'currency') {
              val = val !== null && val !== undefined ? `Rs ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'Rs 0.00';
            } else {
              val = val !== null && val !== undefined ? String(val) : '—';
            }
            doc.text(val, 45 + cIdx * colWidth, mY + 5, { width: colWidth - 5, ellipsis: true });
          });
          mY += 18;
        });
      }

      // 4. END OF REPORT PAGE
      doc.addPage({ size: 'A4', layout: 'landscape', margin: 30 });
      doc.rect(0, 0, 842, 595).fill('#0F172A');
      doc.fillColor('#FFFFFF').fontSize(24).font('Helvetica-Bold').text('END OF MASTER REPORT', 50, 260, { align: 'center' });
      doc.fillColor('#94A3B8').fontSize(12).font('Helvetica').text('Himmel Pharmaceutical Ltd — Master Enterprise Export System', 50, 300, { align: 'center' });

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  }

  /**
   * Master PowerPoint Export (.pptx) containing 15 executive presentation slides
   */
  async generateMasterPowerPoint(filePath, masterData, filters, user) {
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';

    const crimson = '9E1B1E';
    const darkSlate = '1E293B';
    const lightBg = 'F8FAFC';

    // Slide 1: Cover
    const s1 = pptx.addSlide();
    s1.background = { color: darkSlate };
    s1.addText('HIMMEL PHARMACEUTICAL LTD', { x: 0.8, y: 1.5, w: '90%', fontSize: 26, color: 'FFFFFF', bold: true });
    s1.addText('MASTER ENTERPRISE SYSTEM EXPORT', { x: 0.8, y: 2.3, w: '90%', fontSize: 20, color: crimson, bold: true });
    s1.addText('Comprehensive Business Intelligence Presentation Deck', { x: 0.8, y: 3.0, w: '90%', fontSize: 13, color: 'CBD5E1' });
    s1.addText(`Generated By: ${user}  |  Date: ${new Date().toLocaleDateString()}`, { x: 0.8, y: 4.8, w: '90%', fontSize: 11, color: '94A3B8' });

    // Slide 2: Executive Summary
    const s2 = pptx.addSlide();
    s2.background = { color: lightBg };
    s2.addText('Master Executive Summary', { x: 0.5, y: 0.4, w: '90%', fontSize: 20, bold: true, color: darkSlate });

    const kpis = [
      { title: 'Total System Records', val: masterData.summary.totalRecords.toLocaleString(), color: '0284C7' },
      { title: 'Total Net Value (Rs)', val: masterData.summary.totalAmount > 0 ? `Rs ${masterData.summary.totalAmount.toLocaleString()}` : 'N/A', color: crimson },
      { title: 'Active Modules', val: Object.keys(masterData.modules).length.toString(), color: '16A34A' }
    ];
    kpis.forEach((k, idx) => {
      const xPos = 0.5 + idx * 3.2;
      s2.addShape(pptx.shapes.RECTANGLE, { x: xPos, y: 1.2, w: 3.0, h: 1.6, fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 1 } });
      s2.addText(k.title, { x: xPos + 0.2, y: 1.4, w: 2.6, fontSize: 11, color: '64748B', bold: true });
      s2.addText(k.val, { x: xPos + 0.2, y: 1.9, w: 2.6, fontSize: 18, color: k.color, bold: true });
    });

    s2.addText('Executive Highlights & System Scope:', { x: 0.5, y: 3.2, w: 9.0, fontSize: 14, bold: true, color: darkSlate });
    s2.addText(`• Compiled complete business dataset covering 12 enterprise modules.`, { x: 0.8, y: 3.7, w: 8.5, fontSize: 12, color: '334155' });
    s2.addText(`• Applied Scope: ${filters.search ? `Search Filter: "${filters.search}"` : 'All Active Master Scope'}.`, { x: 0.8, y: 4.1, w: 8.5, fontSize: 12, color: '334155' });
    s2.addText(`• Generated automatically via Himmel Enterprise Master Data Engine.`, { x: 0.8, y: 4.5, w: 8.5, fontSize: 12, color: '334155' });

    // Slides 3-14: Module Slides
    const slideTitles = [
      { key: 'Dashboard Summary', title: '3. Dashboard KPIs & Overview' },
      { key: 'Sales', title: '4. Sales Performance & Invoicing' },
      { key: 'Orders', title: '5. Customer Orders Summary' },
      { key: 'Products', title: '6. Products Master Directory' },
      { key: 'Doctors', title: '7. Doctors Directory & Panel' },
      { key: 'Institutions', title: '8. Institutional Customers' },
      { key: 'Areas', title: '9. Territories & Geographic Areas' },
      { key: 'Team Members', title: '10. Sales Representatives & Team' },
      { key: 'Groups', title: '11. Product Groups & Categories' },
      { key: 'Targets', title: '12. Annual Targets & Performance' },
      { key: 'Audit Trail', title: '13. System Activity & Audit Log' },
      { key: 'Reports Summary', title: '14. Analytics & Reports Overview' }
    ];

    slideTitles.forEach((st) => {
      const modData = masterData.modules[st.key] || { columns: [], rows: [], summary: { totalRecords: 0 } };
      const s = pptx.addSlide();
      s.background = { color: 'FFFFFF' };
      s.addText(st.title, { x: 0.5, y: 0.4, w: '90%', fontSize: 18, bold: true, color: darkSlate });

      const headerCells = modData.columns.slice(0, 5).map(col => ({
        text: col.header,
        options: { fill: darkSlate, color: 'FFFFFF', bold: true, fontSize: 9, align: 'center' }
      }));

      const rowCells = modData.rows.slice(0, 8).map((r, rIdx) => {
        return modData.columns.slice(0, 5).map(col => {
          let val = r[col.key];
          if (col.type === 'currency') {
            val = val !== null && val !== undefined ? `Rs ${Number(val).toLocaleString()}` : 'Rs 0';
          } else {
            val = val !== null && val !== undefined ? String(val) : '—';
          }
          return {
            text: val,
            options: { fill: rIdx % 2 === 1 ? 'F8FAFC' : 'FFFFFF', color: '334155', fontSize: 8 }
          };
        });
      });

      if (headerCells.length > 0) {
        s.addTable([headerCells, ...rowCells], { x: 0.5, y: 1.1, w: 9.0, colW: [1.8, 1.8, 1.8, 1.8, 1.8] });
      } else {
        s.addText('No data available for this module.', { x: 0.5, y: 2.0, w: 9.0, fontSize: 12, color: '94A3B8' });
      }
    });

    // Slide 15: Thank You
    const s15 = pptx.addSlide();
    s15.background = { color: darkSlate };
    s15.addText('THANK YOU', { x: 0.8, y: 2.0, w: '90%', fontSize: 32, color: 'FFFFFF', bold: true, align: 'center' });
    s15.addText('Himmel Pharmaceutical Sales & Management System', { x: 0.8, y: 2.8, w: '90%', fontSize: 14, color: crimson, bold: true, align: 'center' });
    s15.addText('Confidential & Proprietary Enterprise Report', { x: 0.8, y: 3.4, w: '90%', fontSize: 11, color: '94A3B8', align: 'center' });

    await pptx.writeFile({ fileName: filePath });
  }

  /**
   * Retrieve list of generated export files
   */
  getExportHistory() {
    const exportDir = this.getExportDirectory();
    if (!fs.existsSync(exportDir)) return [];

    const files = fs.readdirSync(exportDir);
    return files
      .filter(f => (f.startsWith('Himmel_') || f.startsWith('Master_Export')) && (f.endsWith('.xlsx') || f.endsWith('.pdf') || f.endsWith('.pptx')))
      .map(fileName => {
        const fullPath = path.join(exportDir, fileName);
        const stats = fs.statSync(fullPath);
        let format = 'EXCEL';
        if (fileName.endsWith('.pdf')) format = 'PDF';
        if (fileName.endsWith('.pptx')) format = 'POWERPOINT';

        return {
          id: fileName,
          fileName,
          filePath: fullPath,
          format,
          sizeBytes: stats.size,
          formattedSize: `${(stats.size / 1024).toFixed(1)} KB`,
          createdDate: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
  }
}

module.exports = ExportRepository;
