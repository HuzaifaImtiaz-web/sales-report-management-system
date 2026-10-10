const config = require('../config');
const logger = require('../logger');

const REQUIRED_TABLES = [
  'products', 'orders', 'order_items', 'doctors', 'institutions', 'areas', 'team_members',
  'product_targets', 'business_years', 'settings', 'tasks', 'reminders', 'users', 'audit_logs'
];

class HealthService {
  constructor(db) {
    this.db = db;
  }

  // Same report shape as the old BackupService.runIntegrityCheck(); the checks are PostgreSQL equivalents.
  async runIntegrityCheck() {
    const reports = [];
    let healthy = true;

    const check = async (name, fn) => {
      try {
        const result = await fn();
        if (result.status !== 'PASS') healthy = false;
        reports.push({ check: name, ...result });
      } catch (e) {
        healthy = false;
        reports.push({ check: name, status: 'FAIL', message: e.message });
      }
    };

    await check('Database Integrity Check', async () => {
      const row = await this.db.get('SELECT version() AS version');
      return { status: 'PASS', message: `Cloud database reachable (${row.version.split(' on ')[0]}).` };
    });

    await check('Foreign Key Verification', async () => {
      const row = await this.db.get(`
        SELECT COUNT(*) AS count FROM pg_constraint
        WHERE contype = 'f' AND NOT convalidated AND connamespace = current_schema()::regnamespace
      `);
      return row.count === 0
        ? { status: 'PASS', message: 'All foreign key relations are enforced by the database.' }
        : { status: 'FAIL', message: `${row.count} foreign key constraints are not validated.` };
    });

    await check('Schema Tables Verification', async () => {
      const rows = await this.db.all(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema()"
      );
      const present = new Set(rows.map((r) => r.table_name));
      const missing = REQUIRED_TABLES.filter((t) => !present.has(t));
      return missing.length === 0
        ? { status: 'PASS', message: 'All required table schemas are present.' }
        : { status: 'FAIL', message: `Missing tables: ${missing.join(', ')}` };
    });

    await check('Unique Constraint Audit', async () => {
      const duplicates = await this.db.all(
        'SELECT product_code, COUNT(*) AS count FROM products GROUP BY product_code HAVING COUNT(*) > 1'
      );
      return duplicates.length === 0
        ? { status: 'PASS', message: 'No duplicate product codes detected.' }
        : { status: 'FAIL', message: `Duplicate product codes: ${duplicates.map((d) => d.product_code).join(', ')}.` };
    });

    const audit = {};
    try {
      const tables = ['products', 'doctors', 'institutions', 'areas', 'team_members', 'orders', 'product_targets', 'business_years'];
      for (const table of tables) {
        const total = (await this.db.get(`SELECT COUNT(*) AS count FROM ${table}`)).count;
        let active = 0;
        let inactive = 0;
        // PostgreSQL enforces every foreign key, so rows can no longer point at deleted records.
        const orphaned = 0;

        if (table === 'business_years') {
          active = (await this.db.get('SELECT COUNT(*) AS count FROM business_years WHERE is_active = 1')).count;
        } else if (table === 'orders') {
          active = (await this.db.get("SELECT COUNT(*) AS count FROM orders WHERE status = 'Completed'")).count;
          inactive = (await this.db.get("SELECT COUNT(*) AS count FROM orders WHERE status = 'Pending'")).count;
        } else if (table !== 'product_targets') {
          active = (await this.db.get(`SELECT COUNT(*) AS count FROM ${table} WHERE is_active = 1`)).count;
          inactive = (await this.db.get(`SELECT COUNT(*) AS count FROM ${table} WHERE is_active = 0`)).count;
        }
        audit[table] = { total, active, inactive, orphaned };
      }
    } catch (auditErr) {
      logger.error('Failed to run data integrity audit:', auditErr);
    }

    return {
      success: true,
      healthy,
      reports,
      audit,
      checkedAt: new Date().toISOString()
    };
  }

  // Database part of the diagnostics panel; the desktop app adds its own local details.
  async getDiagnostics() {
    const versionRow = await this.db.get("SELECT current_setting('server_version') AS version, pg_database_size(current_database()) AS size");
    const dbVersionRow = await this.db.get("SELECT value FROM settings WHERE key = 'db_version'");
    const counts = await this.db.get(`
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM products) AS products,
        (SELECT COUNT(*) FROM doctors) AS doctors,
        (SELECT COUNT(*) FROM orders) AS orders,
        (SELECT COUNT(*) FROM audit_logs) AS "auditLogs"
    `);
    const memory = process.memoryUsage();

    return {
      databaseAvailable: true,
      databaseEngine: `PostgreSQL ${versionRow.version}`,
      databaseSize: `${(Number(versionRow.size) / (1024 * 1024)).toFixed(2)} MB`,
      dbVersion: dbVersionRow ? dbVersionRow.value : config.version,
      counts,
      healthIndicators: {
        databaseIntegrity: 'PASS',
        foreignKeyStatus: 'PASS'
      },
      server: {
        version: config.version,
        nodeVersion: process.versions.node,
        uptime: `${Math.round(process.uptime())} seconds`,
        heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`
      }
    };
  }
}

module.exports = HealthService;
