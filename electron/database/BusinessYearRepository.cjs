const logger = require('../logger.cjs');

class BusinessYearRepository {
  constructor(db) {
    this.db = db;
  }

  findAll() {
    logger.info('SQL Trace: SELECT * FROM business_years...');
    return this.db.prepare('SELECT * FROM business_years ORDER BY start_date DESC').all();
  }

  findById(id) {
    logger.info(`SQL Trace: SELECT * FROM business_years WHERE id = ${id}`);
    const row = this.db.prepare('SELECT * FROM business_years WHERE id = ?').get(id);
    if (!row) return null;
    return {
      id: row.id,
      yearName: row.year_name,
      startDate: row.start_date,
      endDate: row.end_date,
      isActive: row.is_active
    };
  }

  create(by) {
    logger.info('SQL Trace: INSERT INTO business_years...');
    let id;
    this.db.transaction(() => {
      const activeVal = by.isActive !== undefined ? (by.isActive ? 1 : 0) : 1;
      if (activeVal === 1) {
        this.db.prepare('UPDATE business_years SET is_active = 0').run();
      }
      
      const stmt = this.db.prepare(`
        INSERT INTO business_years (year_name, start_date, end_date, is_active)
        VALUES (?, ?, ?, ?)
      `);
      const res = stmt.run(
        by.yearName,
        by.startDate,
        by.endDate,
        activeVal
      );
      id = res.lastInsertRowid;
    })();
    return this.findById(id);
  }

  update(id, by) {
    logger.info(`SQL Trace: UPDATE business_years WHERE id = ${id}`);
    this.db.transaction(() => {
      const activeVal = by.isActive !== undefined ? (by.isActive ? 1 : 0) : 1;
      if (activeVal === 1) {
        this.db.prepare('UPDATE business_years SET is_active = 0 WHERE id != ?').run(id);
      }
      
      const stmt = this.db.prepare(`
        UPDATE business_years
        SET year_name = ?, start_date = ?, end_date = ?, is_active = ?
        WHERE id = ?
      `);
      stmt.run(
        by.yearName,
        by.startDate,
        by.endDate,
        activeVal,
        id
      );
    })();
    return this.findById(id);
  }

  delete(id) {
    logger.info(`SQL Trace: DELETE FROM business_years WHERE id = ${id}`);
    const stmt = this.db.prepare('DELETE FROM business_years WHERE id = ?');
    const res = stmt.run(id);
    return res.changes > 0;
  }
}

module.exports = BusinessYearRepository;
