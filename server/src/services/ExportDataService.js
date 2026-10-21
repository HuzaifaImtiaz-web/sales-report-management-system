// Data half of the Export Center: { title, columns, rows, summary } for each report type.
// The preview screen shows it directly; server/src/export/ExportService.js turns it into files.
// SQLite's LIKE ignored case, so the search filters use ILIKE.

// Filters arrive as ids from the screens (Reports, Export Center) or as names from older callers.
function idOrName(alias, value, params) {
  const raw = String(value).trim();
  if (/^\d+$/.test(raw)) {
    params.push(Number(raw));
    return ` AND ${alias}.id = ?`;
  }
  params.push(raw);
  return ` AND ${alias}.name = ?`;
}

// Orders (alias o) that contain the product, given by id or exact name.
function orderHasProduct(value, params) {
  const raw = String(value).trim();
  if (/^\d+$/.test(raw)) {
    params.push(Number(raw));
    return ' AND EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = ?)';
  }
  params.push(raw);
  return ' AND EXISTS (SELECT 1 FROM order_items oi JOIN products pr ON pr.id = oi.product_id WHERE oi.order_id = o.id AND pr.name = ?)';
}

class ExportDataService {
  constructor(db) {
    this.db = db;
  }

  async fetchData(reportType, filters = {}) {
    filters = filters || {};
    const type = (reportType || 'Products').trim();
    let sql = '';
    const params = [];
    let title = '';
    let columns = [];
    let rows = [];
    const summary = { totalRecords: 0, totalAmount: 0, totalQty: 0 };

    switch (type.toLowerCase()) {
      case 'products': {
        title = 'Products Master Report';
        sql = `SELECT p.id, p.product_code, p.brand_name AS product_name, d.name AS category_name, g.name AS group_name, u.name AS unit_type_name, p.tp, p.status, p.created_at
               FROM products p
               LEFT JOIN unit_types u ON p.unit_type_id = u.id
               LEFT JOIN divisions d ON p.division_id = d.id
               LEFT JOIN groups g ON p.group_id = g.id
               WHERE 1=1`;
        if (filters.search) {
          sql += ' AND (p.brand_name ILIKE ? OR p.product_code ILIKE ? OR d.name ILIKE ?)';
          const term = `%${filters.search}%`;
          params.push(term, term, term);
        }
        if (filters.product || filters.productId) {
          sql += ' AND p.id = ?';
          params.push(filters.product || filters.productId);
        }
        if (filters.group) {
          sql += ' AND g.name = ?';
          params.push(filters.group);
        }
        if (filters.status && filters.status !== 'All') {
          sql += ' AND p.status = ?';
          params.push(filters.status);
        }
        sql += ' ORDER BY p.brand_name ASC';

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

        rows = await this.db.all(sql, params);
        summary.totalRecords = rows.length;
        summary.totalAmount = rows.reduce((sum, r) => sum + (Number(r.tp) || 0), 0);
        break;
      }

      case 'doctors': {
        title = 'Doctors Directory Report';
        sql = `SELECT d.id, d.name AS doctor_name, COALESCE(d.hospital, '—') AS designation, COALESCE(d.specialty, '—') AS specialty, COALESCE(d.city, '—') AS city, a.name AS area_name, CASE WHEN d.is_active = 1 THEN 'Active' ELSE 'Inactive' END AS status
               FROM doctors d
               LEFT JOIN areas a ON d.area_id = a.id
               WHERE 1=1`;
        if (filters.search) {
          sql += ' AND (d.name ILIKE ? OR d.specialty ILIKE ? OR d.hospital ILIKE ? OR d.city ILIKE ?)';
          const term = `%${filters.search}%`;
          params.push(term, term, term, term);
        }
        if (filters.doctor || filters.doctorId) {
          sql += ' AND d.id = ?';
          params.push(filters.doctor || filters.doctorId);
        }
        if (filters.area || filters.areaId) {
          sql += ' AND d.area_id = ?';
          params.push(filters.area || filters.areaId);
        }
        if (filters.status && filters.status !== 'All') {
          sql += ' AND d.is_active = ?';
          params.push(filters.status === 'Active' ? 1 : 0);
        }
        sql += ' ORDER BY d.name ASC';

        columns = [
          { header: 'ID', key: 'id', width: 8, type: 'number' },
          { header: 'Doctor Name', key: 'doctor_name', width: 28, type: 'text' },
          { header: 'Hospital/Designation', key: 'designation', width: 22, type: 'text' },
          { header: 'Specialty', key: 'specialty', width: 20, type: 'text' },
          { header: 'City', key: 'city', width: 16, type: 'text' },
          { header: 'Area', key: 'area_name', width: 18, type: 'text' },
          { header: 'Status', key: 'status', width: 12, type: 'text' }
        ];

        rows = await this.db.all(sql, params);
        summary.totalRecords = rows.length;
        break;
      }

      case 'institutions': {
        title = 'Institutions Master Report';
        sql = `SELECT i.id, COALESCE(i.code, 'INST-' || i.id) AS institution_code, i.name, COALESCE(i.type, '—') AS type, COALESCE(i.city, '—') AS city, a.name AS area_name, CASE WHEN i.is_active = 1 THEN 'Active' ELSE 'Inactive' END AS status
               FROM institutions i
               LEFT JOIN areas a ON i.area_id = a.id
               WHERE 1=1`;
        if (filters.search) {
          sql += ' AND (i.name ILIKE ? OR i.code ILIKE ? OR i.type ILIKE ? OR i.city ILIKE ?)';
          const term = `%${filters.search}%`;
          params.push(term, term, term, term);
        }
        if (filters.institution || filters.institutionId) {
          sql += ' AND i.id = ?';
          params.push(filters.institution || filters.institutionId);
        }
        if (filters.area || filters.areaId) {
          sql += ' AND i.area_id = ?';
          params.push(filters.area || filters.areaId);
        }
        if (filters.status && filters.status !== 'All') {
          sql += ' AND i.is_active = ?';
          params.push(filters.status === 'Active' ? 1 : 0);
        }
        sql += ' ORDER BY i.name ASC';

        columns = [
          { header: 'ID', key: 'id', width: 8, type: 'number' },
          { header: 'Code', key: 'institution_code', width: 15, type: 'text' },
          { header: 'Institution Name', key: 'name', width: 32, type: 'text' },
          { header: 'Type', key: 'type', width: 18, type: 'text' },
          { header: 'City', key: 'city', width: 16, type: 'text' },
          { header: 'Area', key: 'area_name', width: 20, type: 'text' },
          { header: 'Status', key: 'status', width: 12, type: 'text' }
        ];

        rows = await this.db.all(sql, params);
        summary.totalRecords = rows.length;
        break;
      }

      case 'areas': {
        title = 'Territory & Area Directory Report';
        sql = `SELECT id, name AS area_name, COALESCE(city, '—') AS city, COALESCE(description, '—') AS region, CASE WHEN is_active = 1 THEN 'Active' ELSE 'Inactive' END AS status FROM areas WHERE 1=1`;
        if (filters.search) {
          sql += ' AND (name ILIKE ? OR city ILIKE ? OR description ILIKE ?)';
          const term = `%${filters.search}%`;
          params.push(term, term, term);
        }
        if (filters.area || filters.areaId) {
          sql += ' AND id = ?';
          params.push(filters.area || filters.areaId);
        }
        if (filters.status && filters.status !== 'All') {
          sql += ' AND is_active = ?';
          params.push(filters.status === 'Active' ? 1 : 0);
        }
        sql += ' ORDER BY name ASC';

        columns = [
          { header: 'ID', key: 'id', width: 8, type: 'number' },
          { header: 'Area Name', key: 'area_name', width: 30, type: 'text' },
          { header: 'City', key: 'city', width: 18, type: 'text' },
          { header: 'Description', key: 'region', width: 22, type: 'text' },
          { header: 'Status', key: 'status', width: 12, type: 'text' }
        ];

        rows = await this.db.all(sql, params);
        summary.totalRecords = rows.length;
        break;
      }

      case 'team members':
      case 'team_members':
      case 'teammembers': {
        title = 'Team Members & Field Force Report';
        sql = `SELECT t.id, t.name, t.role, a.name AS area_name, CASE WHEN t.is_active = 1 THEN 'Active' ELSE 'Inactive' END AS status
               FROM team_members t
               LEFT JOIN areas a ON t.area_id = a.id
               WHERE 1=1`;
        if (filters.search) {
          sql += ' AND (t.name ILIKE ? OR t.role ILIKE ?)';
          const term = `%${filters.search}%`;
          params.push(term, term);
        }
        if (filters.teamMember || filters.teamMemberId) {
          sql += ' AND t.id = ?';
          params.push(filters.teamMember || filters.teamMemberId);
        }
        if (filters.area || filters.areaId) {
          sql += ' AND t.area_id = ?';
          params.push(filters.area || filters.areaId);
        }
        if (filters.status && filters.status !== 'All') {
          sql += ' AND t.is_active = ?';
          params.push(filters.status === 'Active' ? 1 : 0);
        }
        sql += ' ORDER BY t.name ASC';

        columns = [
          { header: 'ID', key: 'id', width: 8, type: 'number' },
          { header: 'Full Name', key: 'name', width: 28, type: 'text' },
          { header: 'Role', key: 'role', width: 20, type: 'text' },
          { header: 'Assigned Area', key: 'area_name', width: 20, type: 'text' },
          { header: 'Status', key: 'status', width: 12, type: 'text' }
        ];

        rows = await this.db.all(sql, params);
        summary.totalRecords = rows.length;
        break;
      }

      case 'groups': {
        title = 'Product Groups Report';
        sql = `SELECT id, name AS group_name, COALESCE(description, '—') AS description, CASE WHEN is_active = 1 THEN 'Active' ELSE 'Inactive' END AS status FROM groups WHERE 1=1`;
        if (filters.search) {
          sql += ' AND (name ILIKE ? OR description ILIKE ?)';
          const term = `%${filters.search}%`;
          params.push(term, term);
        }
        if (filters.status && filters.status !== 'All') {
          sql += ' AND is_active = ?';
          params.push(filters.status === 'Active' ? 1 : 0);
        }
        sql += ' ORDER BY name ASC';

        columns = [
          { header: 'ID', key: 'id', width: 8, type: 'number' },
          { header: 'Group Name', key: 'group_name', width: 30, type: 'text' },
          { header: 'Description', key: 'description', width: 35, type: 'text' },
          { header: 'Status', key: 'status', width: 12, type: 'text' }
        ];

        rows = await this.db.all(sql, params);
        summary.totalRecords = rows.length;
        break;
      }

      case 'orders': {
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
          sql += ' AND o.order_date >= ?';
          params.push(filters.startDate);
        }
        if (filters.endDate) {
          sql += ' AND o.order_date <= ?';
          params.push(filters.endDate);
        }
        if (filters.search) {
          sql += ' AND (o.order_number ILIKE ? OR d.name ILIKE ? OR i.name ILIKE ?)';
          const term = `%${filters.search}%`;
          params.push(term, term, term);
        }
        if (filters.doctor || filters.doctorId) {
          sql += idOrName('d', filters.doctor || filters.doctorId, params);
        }
        if (filters.institution || filters.institutionId) {
          sql += idOrName('i', filters.institution || filters.institutionId, params);
        }
        if (filters.area || filters.areaId) {
          sql += idOrName('a', filters.area || filters.areaId, params);
        }
        if (filters.teamMember || filters.teamMemberId) {
          sql += idOrName('tm', filters.teamMember || filters.teamMemberId, params);
        }
        if (filters.product || filters.productId) {
          sql += orderHasProduct(filters.product || filters.productId, params);
        }
        if (filters.orderNumber) {
          sql += ' AND o.order_number = ?';
          params.push(String(filters.orderNumber));
        }
        if (filters.status && filters.status !== 'All') {
          sql += ' AND o.status = ?';
          params.push(filters.status);
        }
        sql += ' ORDER BY o.id DESC';

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

        rows = await this.db.all(sql, params);
        summary.totalRecords = rows.length;
        summary.totalAmount = rows.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);
        break;
      }

      case 'sales': {
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
          sql += ' AND o.order_date >= ?';
          params.push(filters.startDate);
        }
        if (filters.endDate) {
          sql += ' AND o.order_date <= ?';
          params.push(filters.endDate);
        }
        if (filters.search) {
          sql += ' AND (o.order_number ILIKE ? OR d.name ILIKE ? OR i.name ILIKE ?)';
          const term = `%${filters.search}%`;
          params.push(term, term, term);
        }
        if (filters.area || filters.areaId) {
          sql += idOrName('a', filters.area || filters.areaId, params);
        }
        if (filters.teamMember || filters.teamMemberId) {
          sql += idOrName('tm', filters.teamMember || filters.teamMemberId, params);
        }
        if (filters.product || filters.productId) {
          sql += orderHasProduct(filters.product || filters.productId, params);
        }
        sql += ' ORDER BY o.id DESC';

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

        rows = await this.db.all(sql, params);
        summary.totalRecords = rows.length;
        summary.totalAmount = rows.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);
        break;
      }

      case 'targets': {
        title = 'Annual Sales Targets & Achievement Report';
        sql = `SELECT pt.id, byr.year_name AS business_year, COALESCE(p.brand_name, p.name) AS product_name, u.name AS unit,
                      pt.annual_target_qty AS annual_target, (pt.annual_target_qty * COALESCE(p.tp, 0)) AS target_value, pt.created_at
               FROM product_targets pt
               JOIN products p ON pt.product_id = p.id
               LEFT JOIN unit_types u ON p.unit_type_id = u.id
               JOIN business_years byr ON pt.business_year_id = byr.id
               WHERE 1=1`;
        if (filters.search) {
          sql += ' AND (p.brand_name ILIKE ? OR byr.year_name ILIKE ?)';
          const term = `%${filters.search}%`;
          params.push(term, term);
        }
        if (filters.product || filters.productId) {
          sql += idOrName('p', filters.product || filters.productId, params);
        }
        sql += ' ORDER BY byr.year_name DESC, product_name ASC';

        columns = [
          { header: 'Business Year', key: 'business_year', width: 16, type: 'text' },
          { header: 'Product Name', key: 'product_name', width: 28, type: 'text' },
          { header: 'Unit', key: 'unit', width: 12, type: 'text' },
          { header: 'Annual Target Qty', key: 'annual_target', width: 18, type: 'number' },
          { header: 'Target Value (Rs)', key: 'target_value', width: 20, type: 'currency' }
        ];

        rows = await this.db.all(sql, params);
        summary.totalRecords = rows.length;
        summary.totalQty = rows.reduce((sum, r) => sum + (Number(r.annual_target) || 0), 0);
        summary.totalAmount = rows.reduce((sum, r) => sum + (Number(r.target_value) || 0), 0);
        break;
      }

      case 'audit trail':
      case 'audit_trail':
      case 'auditlog': {
        title = 'System Activity & Audit Trail Report';
        sql = 'SELECT id, module, entity_type, entity_id, action, performed_by, performed_at FROM audit_logs WHERE 1=1';
        if (filters.startDate) {
          sql += ' AND performed_at >= ?';
          params.push(filters.startDate);
        }
        if (filters.endDate) {
          sql += ' AND performed_at <= ?';
          params.push(filters.endDate);
        }
        if (filters.search) {
          sql += ' AND (module ILIKE ? OR action ILIKE ? OR performed_by ILIKE ?)';
          const term = `%${filters.search}%`;
          params.push(term, term, term);
        }
        if (filters.status && filters.status !== 'All') {
          sql += ' AND module = ?';
          params.push(filters.status);
        }
        sql += ' ORDER BY id DESC LIMIT 500';

        columns = [
          { header: 'Log ID', key: 'id', width: 10, type: 'number' },
          { header: 'Module', key: 'module', width: 18, type: 'text' },
          { header: 'Entity', key: 'entity_type', width: 16, type: 'text' },
          { header: 'Entity ID', key: 'entity_id', width: 16, type: 'text' },
          { header: 'Action', key: 'action', width: 22, type: 'text' },
          { header: 'Performed By', key: 'performed_by', width: 20, type: 'text' },
          { header: 'Timestamp', key: 'performed_at', width: 22, type: 'text' }
        ];

        rows = await this.db.all(sql, params);
        summary.totalRecords = rows.length;
        break;
      }

      case 'master export':
      case 'master_export': {
        title = 'Master Enterprise System Export';
        columns = [
          { header: 'Module Name', key: 'module_name', width: 25, type: 'text' },
          { header: 'Total Records', key: 'record_count', width: 16, type: 'number' },
          { header: 'Total Value (Rs)', key: 'total_val', width: 22, type: 'currency' },
          { header: 'Status / Scope', key: 'status_scope', width: 18, type: 'text' }
        ];

        const masterDataObj = await this.fetchMasterData(filters);
        rows = Object.keys(masterDataObj.modules).map((modKey) => {
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
      }

      case 'dashboard':
      case 'reports':
      default: {
        title = 'Executive Business Summary & Performance Report';
        sql = `SELECT to_char(himmel_date(order_date), 'YYYY-MM') AS sales_month, COUNT(id) AS total_orders, COALESCE(SUM(total_amount), 0.0) AS total_sales
               FROM orders
               WHERE status = 'Completed'
               GROUP BY 1
               ORDER BY 1 ASC NULLS FIRST`;
        columns = [
          { header: 'Sales Month', key: 'sales_month', width: 20, type: 'text' },
          { header: 'Total Orders', key: 'total_orders', width: 18, type: 'number' },
          { header: 'Total Sales (Rs)', key: 'total_sales', width: 25, type: 'currency' }
        ];

        rows = await this.db.all(sql);
        summary.totalRecords = rows.length;
        summary.totalAmount = rows.reduce((sum, r) => sum + (Number(r.total_sales) || 0), 0);
        summary.totalQty = rows.reduce((sum, r) => sum + (Number(r.total_orders) || 0), 0);
        break;
      }
    }

    return { title, columns, rows, summary };
  }

  /**
   * Fetch all 12 modules into a single Master Export data object
   */
  async fetchMasterData(filters = {}) {
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
      const data = await this.fetchData(mod.type, filters);
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
}

module.exports = ExportDataService;
