const logger = require('../logger.cjs');

class AreaRepository {
  constructor(db) {
    this.db = db;
  }

  _mapRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      city: row.city || '',
      region: row.region || '',
      description: row.description || '',
      status: row.is_active ? 'Active' : 'Inactive'
    };
  }

  findAll() {
    logger.info('SQL Trace: SELECT * FROM areas');
    const rows = this.db.prepare('SELECT * FROM areas ORDER BY name ASC').all();
    return rows.map(r => this._mapRow(r));
  }

  findById(id) {
    logger.info(`SQL Trace: SELECT * FROM areas WHERE id = ${id}`);
    const row = this.db.prepare('SELECT * FROM areas WHERE id = ?').get(id);
    return this._mapRow(row);
  }

  create(a) {
    logger.info(`SQL Trace: INSERT INTO areas (name, city, region, description, is_active) VALUES ('${a.name}')`);
    const stmt = this.db.prepare(`
      INSERT INTO areas (name, city, region, description, is_active)
      VALUES (?, ?, ?, ?, ?)
    `);
    const isActive = a.status === 'Inactive' ? 0 : 1;
    const res = stmt.run(
      a.name,
      a.city || null,
      a.region || null,
      a.description || null,
      isActive
    );
    return this.findById(res.lastInsertRowid);
  }

  update(id, a) {
    logger.info(`SQL Trace: UPDATE areas WHERE id = ${id}`);
    const stmt = this.db.prepare(`
      UPDATE areas
      SET name = ?, city = ?, region = ?, description = ?, is_active = ?
      WHERE id = ?
    `);
    const isActive = a.status === 'Inactive' ? 0 : 1;
    stmt.run(
      a.name,
      a.city || null,
      a.region || null,
      a.description || null,
      isActive,
      id
    );
    return this.findById(id);
  }

  delete(id) {
    logger.info(`SQL Trace: DELETE FROM areas WHERE id = ${id}`);
    const stmt = this.db.prepare('DELETE FROM areas WHERE id = ?');
    const res = stmt.run(id);
    return res.changes > 0;
  }
}

module.exports = AreaRepository;
