class TeamMemberRepository {
  constructor(db) {
    this.db = db;
  }

  _mapRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      role: row.role || '',
      designation: row.role || '',
      areaId: row.area_id || null,
      areaName: row.area_name || '',
      area: row.area_name || '',
      notes: row.notes || '',
      status: row.is_active ? 'Active' : 'Inactive'
    };
  }

  async findAll() {
    const rows = await this.db.all(`
      SELECT tm.*, a.name AS area_name
      FROM team_members tm
      LEFT JOIN areas a ON tm.area_id = a.id
      ORDER BY tm.name ASC
    `);
    return rows.map((r) => this._mapRow(r));
  }

  async findById(id) {
    const row = await this.db.get(`
      SELECT tm.*, a.name AS area_name
      FROM team_members tm
      LEFT JOIN areas a ON tm.area_id = a.id
      WHERE tm.id = ?
    `, [id]);
    return this._mapRow(row);
  }

  async _resolveAreaId(tm) {
    if (tm.areaId) return tm.areaId;
    const areaName = tm.area || tm.areaName;
    if (areaName && typeof areaName === 'string' && areaName.trim().length > 0) {
      const row = await this.db.get('SELECT id FROM areas WHERE LOWER(name) = ?', [areaName.trim().toLowerCase()]);
      if (row) return row.id;
    }
    return null;
  }

  async create(tm) {
    const areaId = await this._resolveAreaId(tm);
    const isActive = tm.status === 'Inactive' ? 0 : 1;
    const row = await this.db.get(
      `INSERT INTO team_members (name, role, area_id, notes, is_active)
       VALUES (?, ?, ?, ?, ?) RETURNING id`,
      [tm.name, tm.designation || tm.role || '', areaId, tm.notes || null, isActive]
    );
    return this.findById(row.id);
  }

  async update(id, tm) {
    const areaId = await this._resolveAreaId(tm);
    const isActive = tm.status === 'Inactive' ? 0 : 1;
    await this.db.run(
      `UPDATE team_members
       SET name = ?, role = ?, area_id = ?, notes = ?, is_active = ?
       WHERE id = ?`,
      [tm.name, tm.designation || tm.role || '', areaId, tm.notes || null, isActive, id]
    );
    return this.findById(id);
  }

  async delete(id) {
    const res = await this.db.run('DELETE FROM team_members WHERE id = ?', [id]);
    return res.changes > 0;
  }
}

module.exports = TeamMemberRepository;
