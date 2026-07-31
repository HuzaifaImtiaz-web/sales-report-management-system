const logger = require('../logger.cjs');

class CategoryRepository {
  constructor(db) {
    this.db = db;
  }

  _mapRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      divisionId: row.division_id || null,
      divisionName: row.division_name || '',
      description: row.description || '',
      status: row.is_active ? 'Active' : 'Inactive',
      totalProducts: row.total_products || 0
    };
  }

  findAll() {
    logger.info('SQL Trace: Fetching product groups');
    const rows = this.db.prepare(`
      SELECT g.*, 
             d.name AS division_name,
             (SELECT COUNT(*) FROM products p WHERE p.group_id = g.id) AS total_products
      FROM groups g
      LEFT JOIN divisions d ON g.division_id = d.id
      ORDER BY d.name ASC, g.name ASC
    `).all();
    return rows.map(r => this._mapRow(r));
  }

  findById(id) {
    logger.info(`SQL Trace: Fetching product group by id = ${id}`);
    const row = this.db.prepare(`
      SELECT g.*, 
             d.name AS division_name,
             (SELECT COUNT(*) FROM products p WHERE p.group_id = g.id) AS total_products
      FROM groups g
      LEFT JOIN divisions d ON g.division_id = d.id
      WHERE g.id = ?
    `).get(id);
    return this._mapRow(row);
  }

  create(c) {
    logger.info(`SQL Trace: Creating product group ${c.name}`);
    const stmt = this.db.prepare(`
      INSERT INTO groups (division_id, name, description, is_active)
      VALUES (?, ?, ?, ?)
    `);
    const isActive = c.status === 'Inactive' ? 0 : 1;
    const res = stmt.run(c.divisionId || null, c.name, c.description || null, isActive);
    return this.findById(res.lastInsertRowid);
  }

  update(id, c) {
    logger.info(`SQL Trace: Updating product group id = ${id}`);
    const stmt = this.db.prepare(`
      UPDATE groups
      SET division_id = ?, name = ?, description = ?, is_active = ?
      WHERE id = ?
    `);
    const isActive = c.status === 'Inactive' ? 0 : 1;
    stmt.run(c.divisionId || null, c.name, c.description || null, isActive, id);
    return this.findById(id);
  }

  delete(id) {
    logger.info(`SQL Trace: Deleting product group id = ${id}`);
    const stmt = this.db.prepare('DELETE FROM groups WHERE id = ?');
    const res = stmt.run(id);
    return res.changes > 0;
  }
}

module.exports = CategoryRepository;
