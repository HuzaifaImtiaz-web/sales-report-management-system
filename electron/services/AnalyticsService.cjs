const logger = require('../logger.cjs');
const SessionManager = require('../auth/SessionManager.cjs');

class AnalyticsService {
  static getActiveDb() {
    const db = SessionManager.getActiveDatabaseConnection();
    if (!db) {
      throw new Error('No active database connection. Please log in first.');
    }
    return db;
  }

  static async getDashboardSummary() {
    const db = this.getActiveDb();
    logger.info('SQL Trace: Fetching dashboard summary...');

    // Fetch active business year
    const activeYear = db.prepare("SELECT year_name, start_date, end_date FROM business_years WHERE date('now') BETWEEN date(start_date) AND date(end_date) LIMIT 1").get();
    const currentBusinessYear = activeYear ? activeYear.year_name : 'N/A';

    // 1. KPI Counts and Totals
    const kpis = db.prepare(`
      SELECT 
        (SELECT COALESCE(SUM(total_amount), 0.0) FROM orders WHERE status IN ('Approved', 'Completed')) as totalRevenue,
        (SELECT COUNT(*) FROM orders) as totalOrders,
        (SELECT COUNT(*) FROM orders WHERE status = 'Pending') as pendingOrders,
        (SELECT COUNT(*) FROM orders WHERE status = 'Completed') as completedOrders,
        (SELECT COUNT(*) FROM products WHERE status = 'Active') as activeProducts,
        (SELECT COUNT(*) FROM doctors WHERE is_active = 1) as activeDoctors,
        (SELECT COUNT(*) FROM institutions WHERE is_active = 1) as activeInstitutions,
        (SELECT COUNT(*) FROM team_members WHERE is_active = 1 AND role IN ('Rep', 'Sales Representative')) as activeRepresentatives
    `).get();

    // 2. Growth indicator (comparison to last month)
    let revenueGrowthDirection = 'up'; // 'up' or 'down'
    let revenueGrowthPercent = 0;

    try {
      const now = new Date();
      const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevYearMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

      const monthlyComparison = db.prepare(`
        SELECT 
          (SELECT COALESCE(SUM(total_amount), 0.0) FROM orders WHERE status IN ('Approved', 'Completed') AND strftime('%Y-%m', order_date) = ?) as currentMonth,
          (SELECT COALESCE(SUM(total_amount), 0.0) FROM orders WHERE status IN ('Approved', 'Completed') AND strftime('%Y-%m', order_date) = ?) as prevMonth
      `).get(currentYearMonth, prevYearMonth);

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

  static async getMonthlySales() {
    const db = this.getActiveDb();
    logger.info('SQL Trace: Fetching monthly sales trend...');

    const activeYear = db.prepare("SELECT year_name, start_date, end_date FROM business_years WHERE is_active = 1").get();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    if (!activeYear || !activeYear.start_date || !activeYear.end_date) {
      return months.map((month) => ({ month, revenue: 0 }));
    }

    const startYear = parseInt(activeYear.start_date.split('-')[0]) || new Date().getFullYear();
    const endYear = parseInt(activeYear.end_date.split('-')[0]) || new Date().getFullYear();

    const rows = db.prepare(`
      SELECT 
        strftime('%Y-%m', order_date) as month,
        SUM(total_amount) as revenue
      FROM orders 
      WHERE status IN ('Approved', 'Completed')
      AND date(order_date) BETWEEN date(?) AND date(?)
      GROUP BY month
    `).all(activeYear.start_date, activeYear.end_date);

    const monthlyData = months.map((monthName, index) => {
      // July (index 6) to December (index 11) correspond to startYear
      // January (index 0) to June (index 5) correspond to endYear
      const year = index >= 6 ? startYear : endYear;
      const monthStr = `${year}-${String(index + 1).padStart(2, '0')}`;
      const match = rows.find(r => r && r.month === monthStr);
      return {
        month: monthName,
        revenue: match ? match.revenue : 0
      };
    });

    return monthlyData;
  }

  static async getTopProducts() {
    const db = this.getActiveDb();
    logger.info('SQL Trace: Fetching top 10 products from Product Master...');

    return db.prepare(`
      SELECT 
        p.brand_name as name, 
        p.product_code as productCode,
        SUM(oi.quantity) as quantity 
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id 
      JOIN orders o ON oi.order_id = o.id 
      WHERE o.status IN ('Approved', 'Completed') 
      GROUP BY p.id, name, productCode
      ORDER BY quantity DESC 
      LIMIT 10
    `).all();
  }

  static async getAreaPerformance() {
    const db = this.getActiveDb();
    logger.info('SQL Trace: Fetching area performance...');

    return db.prepare(`
      SELECT 
        a.name as name, 
        COALESCE(SUM(o.total_amount), 0.0) as revenue, 
        COUNT(DISTINCT o.id) as orders, 
        COALESCE(SUM(oi.quantity), 0) as quantity 
      FROM areas a
      LEFT JOIN orders o ON o.area_id = a.id AND o.status IN ('Approved', 'Completed')
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY a.id, a.name 
      ORDER BY revenue DESC
    `).all();
  }

  static async getRepresentativePerformance() {
    const db = this.getActiveDb();
    logger.info('SQL Trace: Fetching representative performance...');

    return db.prepare(`
      SELECT 
        tm.name as name, 
        COUNT(DISTINCT o.id) as orders, 
        COALESCE(SUM(o.total_amount), 0.0) as revenue, 
        COALESCE(SUM(oi.quantity), 0) as quantity 
      FROM team_members tm 
      LEFT JOIN orders o ON tm.id = o.team_member_id AND o.status IN ('Approved', 'Completed') 
      LEFT JOIN order_items oi ON o.id = oi.order_id 
      WHERE tm.role IN ('Rep', 'Sales Representative')
      GROUP BY tm.id, tm.name 
      ORDER BY revenue DESC 
      LIMIT 5
    `).all();
  }

  static async getTargetProgress() {
    const db = this.getActiveDb();
    logger.info('SQL Trace: Fetching target progress from Product Master...');

    const activeYear = db.prepare("SELECT id, start_date, end_date FROM business_years WHERE date('now') BETWEEN date(start_date) AND date(end_date) LIMIT 1").get();
    if (!activeYear || !activeYear.start_date || !activeYear.end_date) {
      return { target: 0, achieved: 0, remaining: 0, percent: 0 };
    }

    const targetRow = db.prepare(`
      SELECT COALESCE(SUM(pt.annual_target_qty * p.tp), 0.0) as total_target
      FROM product_targets pt
      JOIN products p ON pt.product_id = p.id
      WHERE pt.business_year_id = ?
    `).get(activeYear.id);

    const achievedRow = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0.0) as total_achieved
      FROM orders
      WHERE status IN ('Approved', 'Completed')
      AND date(order_date) BETWEEN date(?) AND date(?)
    `).get(activeYear.start_date, activeYear.end_date);

    const target = targetRow.total_target;
    const achieved = achievedRow.total_achieved;
    const remaining = Math.max(0, target - achieved);
    const percent = target > 0 ? Math.round((achieved / target) * 100) : 0;

    return {
      target,
      achieved,
      remaining,
      percent
    };
  }

  static async getRecentOrders() {
    const db = this.getActiveDb();
    logger.info('SQL Trace: Fetching recent orders...');

    return db.prepare(`
      SELECT 
        o.id,
        o.order_number as orderNumber,
        o.order_date as orderDate,
        o.status,
        o.total_amount as total,
        d.name as doctorName,
        inst.name as institutionName,
        tm.name as representativeName,
        a.name as areaName
      FROM orders o
      LEFT JOIN doctors d ON o.doctor_id = d.id
      LEFT JOIN institutions inst ON o.institution_id = inst.id
      LEFT JOIN team_members tm ON o.team_member_id = tm.id
      LEFT JOIN areas a ON o.area_id = a.id
      ORDER BY o.order_date DESC, o.id DESC
      LIMIT 10
    `).all();
  }
}

function getMonthName(index) {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return months[index];
}

module.exports = AnalyticsService;
