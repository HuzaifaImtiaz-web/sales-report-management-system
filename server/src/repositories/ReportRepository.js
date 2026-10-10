class ReportRepository {
  constructor(db) {
    this.db = db;
  }

  async getDashboardSummaryData(filters = {}) {
    const salesRow = await this.db.get(`
      SELECT COALESCE(SUM(total_amount), 0.0) AS total_sales,
             COUNT(id) AS total_orders,
             COALESCE(AVG(total_amount), 0.0) AS avg_order_value
      FROM orders
      WHERE status = 'Completed'
    `);

    const targetRow = await this.db.get(`
      SELECT COALESCE(SUM(target_qty), 0) AS total_target_qty,
             COALESCE(SUM(actual_qty), 0) AS total_actual_qty,
             COALESCE(SUM(target_value), 0.0) AS total_target_value,
             COALESCE(SUM(actual_value), 0.0) AS total_actual_value
      FROM view_target_achievements
    `);

    const achievementPercent = targetRow.total_target_value > 0
      ? Math.round((targetRow.total_actual_value * 100) / targetRow.total_target_value)
      : 0;

    return {
      totalSales: salesRow.total_sales,
      totalOrders: salesRow.total_orders,
      averageOrderValue: Math.round(salesRow.avg_order_value * 100) / 100,
      targetAchievementPercent: achievementPercent,
      targetQty: targetRow.total_target_qty,
      actualQty: targetRow.total_actual_qty,
      targetValue: targetRow.total_target_value,
      actualValue: targetRow.total_actual_value
    };
  }

  async getSalesTrendData(filters = {}) {
    const rows = await this.db.all(`
      SELECT sales_month, total_orders, total_sales
      FROM view_monthly_sales
      ORDER BY sales_month ASC NULLS FIRST
    `);

    return rows.map((r) => ({
      month: r.sales_month,
      orders: r.total_orders,
      sales: r.total_sales
    }));
  }

  async getTargetAchievementData(filters = {}) {
    let sql = `
      SELECT team_member_name, product_name, target_qty, target_value, actual_qty, actual_value, qty_achievement_percent, value_achievement_percent
      FROM view_target_achievements
      WHERE 1=1
    `;
    const params = [];
    if (filters && filters.teamMemberId) {
      sql += ' AND team_member_id = ?';
      params.push(filters.teamMemberId);
    }
    if (filters && filters.productId) {
      sql += ' AND product_id = ?';
      params.push(filters.productId);
    }
    sql += ' ORDER BY value_achievement_percent DESC NULLS LAST';

    const rows = await this.db.all(sql, params);
    return rows.map((r) => ({
      teamMemberName: r.team_member_name,
      productName: r.product_name,
      targetQty: r.target_qty,
      targetValue: r.target_value,
      actualQty: r.actual_qty,
      actualValue: r.actual_value,
      qtyAchievementPercent: r.qty_achievement_percent,
      valueAchievementPercent: r.value_achievement_percent
    }));
  }

  async getTeamContributionData(filters = {}) {
    const rows = await this.db.all(`
      SELECT team_member_name, role, total_orders, completed_orders, total_sales_value, average_order_value
      FROM view_team_performance
      ORDER BY total_sales_value DESC
    `);

    return rows.map((r) => ({
      teamMemberName: r.team_member_name,
      role: r.role,
      totalOrders: r.total_orders,
      completedOrders: r.completed_orders,
      totalSalesValue: r.total_sales_value,
      averageOrderValue: Math.round(r.average_order_value * 100) / 100
    }));
  }

  async getProductPerformanceData(filters = {}) {
    // Postgres needs every non-aggregated column in GROUP BY (SQLite allowed GROUP BY p.id alone).
    const rows = await this.db.all(`
      SELECT p.brand_name AS product_name,
             p.product_code,
             p.generic_name,
             d.name AS division,
             g.name AS group_name,
             u.name AS unit_type,
             p.tp,
             p.mrp,
             SUM(oi.quantity) AS total_qty,
             SUM(oi.total_price) AS total_sales
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN divisions d ON p.division_id = d.id
      LEFT JOIN groups g ON p.group_id = g.id
      LEFT JOIN unit_types u ON p.unit_type_id = u.id
      WHERE o.status = 'Completed'
      GROUP BY p.id, d.name, g.name, u.name
      ORDER BY total_sales DESC
    `);

    return rows.map((r) => ({
      productCode: r.product_code,
      productName: r.product_name,
      genericName: r.generic_name || '',
      division: r.division || 'Himmel',
      groupName: r.group_name || 'General',
      unitType: r.unit_type || 'Vials',
      tp: r.tp,
      mrp: r.mrp,
      totalQty: r.total_qty,
      totalSales: r.total_sales
    }));
  }

  async getReportsData(filters = {}) {
    filters = filters || {};
    let sql = `
      SELECT o.*,
             tm.name AS team_member_name,
             d.name AS doctor_name,
             i.name AS institution_name,
             a.name AS area_name
      FROM orders o
      JOIN team_members tm ON o.team_member_id = tm.id
      LEFT JOIN doctors d ON o.doctor_id = d.id
      LEFT JOIN institutions i ON o.institution_id = i.id
      JOIN areas a ON o.area_id = a.id
      WHERE 1=1
    `;
    const params = [];
    if (filters.startDate) {
      sql += ' AND himmel_date(o.order_date) >= himmel_date(?)';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      sql += ' AND himmel_date(o.order_date) <= himmel_date(?)';
      params.push(filters.endDate);
    }
    if (filters.areaId) {
      sql += ' AND o.area_id = ?';
      params.push(filters.areaId);
    }
    if (filters.teamMemberId) {
      sql += ' AND o.team_member_id = ?';
      params.push(filters.teamMemberId);
    }
    if (filters.status) {
      sql += ' AND o.status = ?';
      params.push(filters.status);
    }
    sql += ' ORDER BY o.order_date DESC, o.order_number DESC';

    const orders = await this.db.all(sql, params);
    if (orders.length === 0) return [];

    // One query for all items instead of one query per order (each query is a network round trip now).
    const items = await this.db.all(`
      SELECT oi.*,
             p.product_code,
             COALESCE(p.brand_name, p.name) AS product_name,
             p.generic_name,
             d.name AS division,
             g.name AS group_name,
             u.name AS unit_type,
             p.tp,
             p.mrp
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN divisions d ON p.division_id = d.id
      LEFT JOIN groups g ON p.group_id = g.id
      LEFT JOIN unit_types u ON p.unit_type_id = u.id
      WHERE oi.order_id = ANY(?::int[])
      ORDER BY oi.id ASC
    `, [orders.map((o) => o.id)]);

    const itemsByOrder = new Map();
    for (const item of items) {
      if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, []);
      itemsByOrder.get(item.order_id).push(item);
    }

    return orders.map((o) => ({
      id: o.id,
      poNumber: o.order_number,
      poDate: o.order_date,
      doctorId: o.doctor_id,
      doctorName: o.doctor_name || '',
      area: o.area_name,
      areaId: o.area_id,
      teamMemberId: o.team_member_id,
      teamMemberName: o.team_member_name,
      status: o.status,
      remarks: '',
      totalAmount: o.total_amount,
      items: (itemsByOrder.get(o.id) || []).map((item) => ({
        productId: item.product_id,
        productCode: item.product_code,
        productName: item.product_name,
        genericName: item.generic_name || '',
        division: item.division || 'Himmel',
        groupName: item.group_name || 'General',
        unitType: item.unit_type || 'Vials',
        tp: item.tp,
        mrp: item.mrp,
        quantity: item.quantity,
        rate: item.unit_price,
        totalPrice: item.total_price
      }))
    }));
  }
}

module.exports = ReportRepository;
