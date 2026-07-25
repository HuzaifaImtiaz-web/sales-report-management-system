const logger = require('../logger.cjs');

class DoctorRepository {
  constructor(db) {
    this.db = db;
  }

  _mapRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      specialty: row.specialty || '',
      hospital: row.hospital || '',
      city: row.city || '',
      address: row.address || '',
      notes: row.notes || '',
      email: row.email || '',
      phone: row.phone || '',
      areaId: row.area_id,
      areaName: row.area_name || '',
      status: row.is_active ? 'Active' : 'Inactive'
    };
  }

  findAll() {
    logger.info('SQL Trace: SELECT d.*, a.name AS area_name FROM doctors d JOIN areas a ON d.area_id = a.id');
    const rows = this.db.prepare(`
      SELECT d.*, a.name AS area_name 
      FROM doctors d 
      JOIN areas a ON d.area_id = a.id
      ORDER BY d.name ASC
    `).all();
    return rows.map(r => this._mapRow(r));
  }

  findById(id) {
    logger.info(`SQL Trace: SELECT d.*, a.name AS area_name FROM doctors d JOIN areas a ON d.area_id = a.id WHERE d.id = ${id}`);
    const row = this.db.prepare(`
      SELECT d.*, a.name AS area_name 
      FROM doctors d 
      JOIN areas a ON d.area_id = a.id 
      WHERE d.id = ?
    `).get(id);
    return this._mapRow(row);
  }

  _resolveAreaId(d) {
    if (d.areaId) return d.areaId;
    const areaName = d.area || d.areaName;
    if (areaName && typeof areaName === 'string') {
      const row = this.db.prepare('SELECT id FROM areas WHERE LOWER(name) = ?').get(areaName.trim().toLowerCase());
      if (row) return row.id;
    }
    throw new Error('Assigned Area does not exist.');
  }

  create(d) {
    logger.info(`SQL Trace: INSERT INTO doctors (name, specialty, hospital, city, address, notes, email, phone, area_id, is_active) VALUES ('${d.name}', '${d.specialty}')`);
    const areaId = this._resolveAreaId(d);
    const phone = d.mobile || d.phone || null;
    const stmt = this.db.prepare(`
      INSERT INTO doctors (name, specialty, hospital, city, address, notes, email, phone, area_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const isActive = d.status === 'Inactive' ? 0 : 1;
    const res = stmt.run(
      d.name,
      d.specialty || null,
      d.hospital || null,
      d.city || null,
      d.address || null,
      d.notes || null,
      d.email || null,
      phone,
      areaId,
      isActive
    );
    return this.findById(res.lastInsertRowid);
  }

  update(id, d) {
    logger.info(`SQL Trace: UPDATE doctors WHERE id = ${id}`);
    const areaId = this._resolveAreaId(d);
    const phone = d.mobile || d.phone || null;
    const stmt = this.db.prepare(`
      UPDATE doctors
      SET name = ?, specialty = ?, hospital = ?, city = ?, address = ?, notes = ?, email = ?, phone = ?, area_id = ?, is_active = ?
      WHERE id = ?
    `);
    const isActive = d.status === 'Inactive' ? 0 : 1;
    stmt.run(
      d.name,
      d.specialty || null,
      d.hospital || null,
      d.city || null,
      d.address || null,
      d.notes || null,
      d.email || null,
      phone,
      areaId,
      isActive,
      id
    );
    return this.findById(id);
  }

  delete(id) {
    logger.info(`SQL Trace: DELETE FROM doctors WHERE id = ${id}`);
    const stmt = this.db.prepare('DELETE FROM doctors WHERE id = ?');
    const res = stmt.run(id);
    return res.changes > 0;
  }
}

module.exports = DoctorRepository;
