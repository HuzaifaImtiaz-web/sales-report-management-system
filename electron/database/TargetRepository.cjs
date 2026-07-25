const logger = require('../logger.cjs');

class TargetRepository {
  constructor(db) {
    this.db = db;
  }

  _mapRow(row) {
    if (!row) return null;
    let areasDistribution = [];
    try {
      areasDistribution = JSON.parse(row.areas_distribution);
    } catch (e) {
      logger.error('Failed to parse areas_distribution JSON:', e);
    }
    
    return {
      id: row.id,
      businessYearId: row.business_year_id,
      yearName: row.year_name || '',
      productId: row.product_id,
      productName: row.product_name || '',
      productCode: row.product_code || '',
      division: row.division || '',
      groupName: row.group_name || '',
      perUnitPrice: row.per_unit_price || 0.0,
      annualTargetQty: row.annual_target_qty,
      areasDistribution: areasDistribution,
      notes: row.notes || ''
    };
  }

  findAll() {
    logger.info('SQL Trace: SELECT pt.* FROM product_targets with Product Master JOIN...');
    const rows = this.db.prepare(`
      SELECT pt.*, byr.year_name, 
             COALESCE(p.brand_name, p.name) AS product_name, 
             p.product_code,
             d.name AS division,
             g.name AS group_name,
             p.tp AS per_unit_price
      FROM product_targets pt
      JOIN business_years byr ON pt.business_year_id = byr.id
      JOIN products p ON pt.product_id = p.id
      LEFT JOIN divisions d ON p.division_id = d.id
      LEFT JOIN groups g ON p.group_id = g.id
      ORDER BY byr.year_name DESC, product_name ASC
    `).all();
    return rows.map(r => this._mapRow(r));
  }

  findById(id) {
    logger.info(`SQL Trace: SELECT pt.* FROM product_targets WHERE id = ${id}`);
    const row = this.db.prepare(`
      SELECT pt.*, byr.year_name, 
             COALESCE(p.brand_name, p.name) AS product_name, 
             p.product_code,
             d.name AS division,
             g.name AS group_name,
             p.tp AS per_unit_price
      FROM product_targets pt
      JOIN business_years byr ON pt.business_year_id = byr.id
      JOIN products p ON pt.product_id = p.id
      LEFT JOIN divisions d ON p.division_id = d.id
      LEFT JOIN groups g ON p.group_id = g.id
      WHERE pt.id = ?
    `).get(id);
    return this._mapRow(row);
  }

  create(t) {
    logger.info(`SQL Trace: INSERT INTO product_targets (business_year_id, product_id, annual_target_qty, areas_distribution, notes)`);
    const stmt = this.db.prepare(`
      INSERT INTO product_targets (business_year_id, product_id, annual_target_qty, areas_distribution, notes)
      VALUES (?, ?, ?, ?, ?)
    `);
    const distStr = typeof t.areasDistribution === 'string' ? t.areasDistribution : JSON.stringify(t.areasDistribution);
    const res = stmt.run(
      t.businessYearId,
      t.productId,
      t.annualTargetQty,
      distStr,
      t.notes || null
    );
    return this.findById(res.lastInsertRowid);
  }

  update(id, t) {
    logger.info(`SQL Trace: UPDATE product_targets WHERE id = ${id}`);
    const stmt = this.db.prepare(`
      UPDATE product_targets
      SET business_year_id = ?, product_id = ?, annual_target_qty = ?, areas_distribution = ?, notes = ?
      WHERE id = ?
    `);
    const distStr = typeof t.areasDistribution === 'string' ? t.areasDistribution : JSON.stringify(t.areasDistribution);
    stmt.run(
      t.businessYearId,
      t.productId,
      t.annualTargetQty,
      distStr,
      t.notes || null,
      id
    );
    return this.findById(id);
  }

  delete(id) {
    logger.info(`SQL Trace: DELETE FROM product_targets WHERE id = ${id}`);
    const stmt = this.db.prepare('DELETE FROM product_targets WHERE id = ?');
    const res = stmt.run(id);
    return res.changes > 0;
  }

  getActiveBusinessYears() {
    logger.info('SQL Trace: SELECT * FROM business_years');
    const rows = this.db.prepare('SELECT id, year_name, start_date, end_date FROM business_years ORDER BY year_name DESC').all();
    return rows.map(r => ({
      id: r.id,
      value: r.year_name,
      label: `${r.year_name} (${r.start_date} to ${r.end_date})`
    }));
  }
}

module.exports = TargetRepository;

