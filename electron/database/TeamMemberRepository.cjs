const logger = require('../logger.cjs');

class TeamMemberRepository {
  constructor(db) {
    this.db = db;
  }

  _mapRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      email: row.email || '',
      phone: row.phone || '',
      role: row.role,
      areaId: row.area_id || null,
      areaName: row.area_name || 'Unassigned',
      status: row.is_active ? 'Active' : 'Inactive'
    };
  }

  findAll() {
    logger.info('SQL Trace: SELECT tm.*, a.name AS area_name FROM team_members tm LEFT JOIN areas a ON tm.area_id = a.id');
    const rows = this.db.prepare(`
      SELECT tm.*, a.name AS area_name 
      FROM team_members tm 
      LEFT JOIN areas a ON tm.area_id = a.id
      ORDER BY tm.name ASC
    `).all();
    return rows.map(r => this._mapRow(r));
  }

  findById(id) {
    logger.info(`SQL Trace: SELECT tm.*, a.name AS area_name FROM team_members tm LEFT JOIN areas a ON tm.area_id = a.id WHERE tm.id = ${id}`);
    const row = this.db.prepare(`
      SELECT tm.*, a.name AS area_name 
      FROM team_members tm 
      LEFT JOIN areas a ON tm.area_id = a.id 
      WHERE tm.id = ?
    `).get(id);
    return this._mapRow(row);
  }

  _resolveAreaId(tm) {
    if (tm.areaId) return tm.areaId;
    const areaName = tm.area || tm.areaName;
    if (areaName && typeof areaName === 'string') {
      const row = this.db.prepare('SELECT id FROM areas WHERE LOWER(name) = ?').get(areaName.trim().toLowerCase());
      if (row) return row.id;
    }
    return null;
  }

  create(tm) {
    logger.info(`SQL Trace: INSERT INTO team_members (name, email, phone, role, area_id, is_active) VALUES ('${tm.name}', '${tm.email}')`);
    const areaId = this._resolveAreaId(tm);
    const stmt = this.db.prepare(`
      INSERT INTO team_members (name, email, phone, role, area_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const isActive = tm.status === 'Inactive' ? 0 : 1;
    const res = stmt.run(
      tm.name,
      tm.email || null,
      tm.phone || tm.mobile || null,
      tm.role || tm.designation || 'Sales Representative',
      areaId,
      isActive
    );
    return this.findById(res.lastInsertRowid);
  }

  update(id, tm) {
    logger.info(`SQL Trace: UPDATE team_members WHERE id = ${id}`);
    const areaId = this._resolveAreaId(tm);
    const stmt = this.db.prepare(`
      UPDATE team_members
      SET name = ?, email = ?, phone = ?, role = ?, area_id = ?, is_active = ?
      WHERE id = ?
    `);
    const isActive = tm.status === 'Inactive' ? 0 : 1;
    stmt.run(
      tm.name,
      tm.email || null,
      tm.phone || tm.mobile || null,
      tm.role || tm.designation || 'Sales Representative',
      areaId,
      isActive,
      id
    );
    return this.findById(id);
  }

  delete(id) {
    logger.info(`SQL Trace: DELETE FROM team_members WHERE id = ${id}`);
    const stmt = this.db.prepare('DELETE FROM team_members WHERE id = ?');
    const res = stmt.run(id);
    return res.changes > 0;
  }
}

module.exports = TeamMemberRepository;
