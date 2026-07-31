const logger = require('../logger.cjs');

class InstitutionRepository {
  constructor(db) {
    this.db = db;
  }

  _mapRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      code: row.code || '',
      type: row.type || 'Other',
      city: row.city || '',
      notes: row.notes || '',
      areaId: row.area_id,
      areaName: row.area_name || '',
      area: row.area_name || '',
      status: row.is_active ? 'Active' : 'Inactive'
    };
  }

  findAll() {
    logger.info('SQL Trace: SELECT i.*, a.name AS area_name FROM institutions i LEFT JOIN areas a ON i.area_id = a.id');
    const rows = this.db.prepare(`
      SELECT i.*, a.name AS area_name 
      FROM institutions i 
      LEFT JOIN areas a ON i.area_id = a.id
      ORDER BY i.name ASC
    `).all();
    return rows.map(r => this._mapRow(r));
  }

  findById(id) {
    logger.info(`SQL Trace: SELECT i.*, a.name AS area_name FROM institutions i LEFT JOIN areas a ON i.area_id = a.id WHERE i.id = ${id}`);
    const row = this.db.prepare(`
      SELECT i.*, a.name AS area_name 
      FROM institutions i 
      LEFT JOIN areas a ON i.area_id = a.id 
      WHERE i.id = ?
    `).get(id);
    return this._mapRow(row);
  }

  _resolveAreaId(inst) {
    if (inst.areaId) return inst.areaId;
    const areaName = inst.area || inst.areaName;
    if (areaName && typeof areaName === 'string' && areaName.trim().length > 0) {
      const row = this.db.prepare('SELECT id FROM areas WHERE LOWER(name) = ?').get(areaName.trim().toLowerCase());
      if (row) return row.id;
    }
    return null;
  }

  create(i) {
    logger.info(`SQL Trace: INSERT INTO institutions (name, code, type, city, notes, area_id, is_active) VALUES ('${i.name}', '${i.code}')`);
    const areaId = this._resolveAreaId(i);
    const stmt = this.db.prepare(`
      INSERT INTO institutions (name, code, type, city, notes, area_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const isActive = i.status === 'Inactive' ? 0 : 1;
    const res = stmt.run(
      i.name,
      i.code || null,
      i.type || 'Other',
      i.city || null,
      i.notes || null,
      areaId,
      isActive
    );
    return this.findById(res.lastInsertRowid);
  }

  update(id, i) {
    logger.info(`SQL Trace: UPDATE institutions WHERE id = ${id}`);
    const areaId = this._resolveAreaId(i);
    const stmt = this.db.prepare(`
      UPDATE institutions
      SET name = ?, code = ?, type = ?, city = ?, notes = ?, area_id = ?, is_active = ?
      WHERE id = ?
    `);
    const isActive = i.status === 'Inactive' ? 0 : 1;
    stmt.run(
      i.name,
      i.code || null,
      i.type || 'Other',
      i.city || null,
      i.notes || null,
      areaId,
      isActive,
      id
    );
    return this.findById(id);
  }

  delete(id) {
    logger.info(`SQL Trace: DELETE FROM institutions WHERE id = ${id}`);
    const stmt = this.db.prepare('DELETE FROM institutions WHERE id = ?');
    const res = stmt.run(id);
    return res.changes > 0;
  }
}

module.exports = InstitutionRepository;
