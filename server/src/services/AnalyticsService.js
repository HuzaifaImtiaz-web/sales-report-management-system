const logger = require('../logger');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// camelCase aliases are quoted: Postgres lower-cases unquoted names ("productCode" -> productcode).
class AnalyticsService {
  constructor(db) {
    this.db = db;
  }

  async getDashboardSummary() {
    const activeYear = await this.db.get(`
      SELECT year_name, start_date, end_date FROM business_years
      WHERE CURRENT_DATE BETWEEN himmel_date(start_date) AND himmel_date(end_date)
      LIMIT 1
    `);
    const currentBusinessYear = activeYear ? activeYear.year_name : 'N/A';

    const kpis = await this.db.get(`
      SELECT
        (SELECT COALESCE(SUM(total_amount), 0.0) FROM orders WHERE status IN ('Approved', 'Completed')) AS "totalRevenue",
        (SELECT COUNT(*) FROM orders) AS "totalOrders",
        (SELECT COUNT(*) FROM orders WHERE status = 'Pending') AS "pendingOrders",
        (SELECT COUNT(*) FROM orders WHERE status = 'Completed') AS "completedOrders",
        (SELECT COUNT(*) FROM products WHERE status = 'Active') AS "activeProducts",
        (SELECT COUNT(*) FROM doctors WHERE is_active = 1) AS "activeDoctors",
        (SELECT COUNT(*) FROM institutions WHERE is_active = 1) AS "activeInstitutions",
        (SELECT COUNT(*) FROM team_members WHERE is_active = 1 AND role IN ('Rep', 'Sales Representative')) AS "activeRepresentatives"
    `);

    // Growth indicator (comparison to last month)
    let revenueGrowthDirection = 'up';
    let revenueGrowthPercent = 0;

    try {
      const now = new Date();
      const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevYearMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

      const monthlyComparison = await this.db.get(`
        SELECT
          (SELECT COALESCE(SUM(total_amount), 0.0) FROM orders
            WHERE status IN ('Approved', 'Completed') AND to_char(himmel_date(order_date), 'YYYY-MM') = ?) AS "currentMonth",
          (SELECT COALESCE(SUM(total_amount), 0.0) FROM orders
            WHERE status IN ('Approved', 'Completed') AND to_char(himmel_date(order_date), 'YYYY-MM') = ?) AS "prevMonth"
      `, [currentYearMonth, prevYearMonth]);

      const curRev = monthlyComparison.currentMonth;
      const prevRev = monthlyComparison.prevMonth;

      if (prevRev > 0) {
        const diff = curRev - prevRev;
        revenueGrowthPercent = Math.round((diff / prevRev) * 100);
        revenueGrowthDirection = diff >= 0 ? 'up' : 'down';
      } else if (curRev > 0) {
        revenueGrowthPercent = 100;
        revenueGrowthDirection = 'up';
      }
    } catch (err) {
      logger.error('Failed to calculate monthly growth:', err);
    }

    return {
      totalRevenue: kpis.totalRevenue,
      totalOrders: kpis.totalOrders,
      pendingOrders: kpis.pendingOrders,
      completedOrders: kpis.completedOrders,
      activeProducts: kpis.activeProducts,
      activeDoctors: kpis.activeDoctors,
      activeInstitutions: kpis.activeInstitutions,
      activeRepresentatives: kpis.activeRepresentatives,
      currentBusinessYear,
      revenueGrowthDirection,
      revenueGrowthPercent: Math.abs(revenueGrowthPercent)
    };
  }

  async getMonthlySales() {
    const activeYear = await this.db.get('SELECT year_name, start_date, end_date FROM business_years WHERE is_active = 1 ORDER BY id ASC LIMIT 1');
    if (!activeYear || !activeYear.start_date || !activeYear.end_date) {
      return MONTHS.map((month) => ({ month, revenue: 0 }));
    }

    const startYear = parseInt(activeYear.start_date.split('-')[0], 10) || new Date().getFullYear();
    const endYear = parseInt(activeYear.end_date.split('-')[0], 10) || new Date().getFullYear();

    const rows = await this.db.all(`
      SELECT
        to_char(himmel_date(order_date), 'YYYY-MM') AS month,
        SUM(total_amount) AS revenue
      FROM orders
      WHERE status IN ('Approved', 'Completed')
        AND himmel_date(order_date) BETWEEN himmel_date(?) AND himmel_date(?)
      GROUP BY 1
    `, [activeYear.start_date, activeYear.end_date]);

    return MONTHS.map((monthName, index) => {
      // July (index 6) to December (index 11) correspond to startYear
      // January (index 0) to June (index 5) correspond to endYear
      const year = index >= 6 ? startYear : endYear;
      const monthStr = `${year}-${String(index + 1).padStart(2, '0')}`;
      const match = rows.find((r) => r && r.month === monthStr);
      return {
        month: monthName,
        revenue: match ? match.revenue : 0
      };
    });
  }

  async getTopProducts() {
    return this.db.all(`
      SELECT
        p.brand_name AS name,
        p.product_code AS "productCode",
        SUM(oi.quantity) AS quantity
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('Approved', 'Completed')
      GROUP BY p.id
      ORDER BY quantity DESC
      LIMIT 10
    `);
  }

  async getAreaPerformance() {
    return this.db.all(`
      SELECT
        a.name AS name,
        COALESCE(SUM(o.total_amount), 0.0) AS revenue,
        COUNT(DISTINCT o.id) AS orders,
        COALESCE(SUM(oi.quantity), 0) AS quantity
      FROM areas a
      LEFT JOIN orders o ON o.area_id = a.id AND o.status IN ('Approved', 'Completed')
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY a.id, a.name
      ORDER BY revenue DESC
    `);
  }

  async getRepresentativePerformance() {
    return this.db.all(`
      SELECT
        tm.name AS name,
        COUNT(DISTINCT o.id) AS orders,
        COALESCE(SUM(o.total_amount), 0.0) AS revenue,
        COALESCE(SUM(oi.quantity), 0) AS quantity
      FROM team_members tm
      LEFT JOIN orders o ON tm.id = o.team_member_id AND o.status IN ('Approved', 'Completed')
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE tm.role IN ('Rep', 'Sales Representative')
      GROUP BY tm.id, tm.name
      ORDER BY revenue DESC
      LIMIT 5
    `);
  }

  async getTargetProgress() {
    const activeYear = await this.db.get(`
      SELECT id, start_date, end_date FROM business_years
      WHERE CURRENT_DATE BETWEEN himmel_date(start_date) AND himmel_date(end_date)
      LIMIT 1
    `);
    if (!activeYear || !activeYear.start_date || !activeYear.end_date) {
      return { target: 0, achieved: 0, remaining: 0, percent: 0 };
    }

    const targetRow = await this.db.get(`
      SELECT COALESCE(SUM(pt.annual_target_qty * p.tp), 0.0) AS total_target
      FROM product_targets pt
      JOIN products p ON pt.product_id = p.id
      WHERE pt.business_year_id = ?
    `, [activeYear.id]);

    const achievedRow = await this.db.get(`
      SELECT COALESCE(SUM(total_amount), 0.0) AS total_achieved
      FROM orders
      WHERE status IN ('Approved', 'Completed')
        AND himmel_date(order_date) BETWEEN himmel_date(?) AND himmel_date(?)
    `, [activeYear.start_date, activeYear.end_date]);

    const target = targetRow.total_target;
    const achieved = achievedRow.total_achieved;
    const remaining = Math.max(0, target - achieved);
    const percent = target > 0 ? Math.round((achieved / target) * 100) : 0;

    return { target, achieved, remaining, percent };
  }

  async getRecentOrders() {
    return this.db.all(`
      SELECT
        o.id,
        o.order_number AS "orderNumber",
        o.order_date AS "orderDate",
        o.status,
        o.total_amount AS total,
        d.name AS "doctorName",
        inst.name AS "institutionName",
        tm.name AS "representativeName",
        a.name AS "areaName"
      FROM orders o
      LEFT JOIN doctors d ON o.doctor_id = d.id
      LEFT JOIN institutions inst ON o.institution_id = inst.id
      LEFT JOIN team_members tm ON o.team_member_id = tm.id
      LEFT JOIN areas a ON o.area_id = a.id
      ORDER BY o.order_date DESC, o.id DESC
      LIMIT 10
    `);
  }
}

module.exports = AnalyticsService;
