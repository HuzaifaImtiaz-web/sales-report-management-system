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

  async findAll() {
    const rows = await this.db.all(`
      SELECT i.*, a.name AS area_name
      FROM institutions i
      LEFT JOIN areas a ON i.area_id = a.id
      ORDER BY i.name ASC
    `);
    return rows.map((r) => this._mapRow(r));
  }

  async findById(id) {
    const row = await this.db.get(`
      SELECT i.*, a.name AS area_name
      FROM institutions i
      LEFT JOIN areas a ON i.area_id = a.id
      WHERE i.id = ?
    `, [id]);
    return this._mapRow(row);
  }

  async _resolveAreaId(inst) {
    if (inst.areaId) return inst.areaId;
    const areaName = inst.area || inst.areaName;
    if (areaName && typeof areaName === 'string' && areaName.trim().length > 0) {
      const row = await this.db.get('SELECT id FROM areas WHERE LOWER(name) = ?', [areaName.trim().toLowerCase()]);
      if (row) return row.id;
    }
    return null;
  }

  async create(i) {
    const areaId = await this._resolveAreaId(i);
    const isActive = i.status === 'Inactive' ? 0 : 1;
    const row = await this.db.get(
      `INSERT INTO institutions (name, code, type, city, notes, area_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [i.name, i.code || null, i.type || 'Other', i.city || null, i.notes || null, areaId, isActive]
    );
    return this.findById(row.id);
  }

  async update(id, i) {
    const areaId = await this._resolveAreaId(i);
    const isActive = i.status === 'Inactive' ? 0 : 1;
    await this.db.run(
      `UPDATE institutions
       SET name = ?, code = ?, type = ?, city = ?, notes = ?, area_id = ?, is_active = ?
       WHERE id = ?`,
      [i.name, i.code || null, i.type || 'Other', i.city || null, i.notes || null, areaId, isActive, id]
    );
    return this.findById(id);
  }

  async delete(id) {
    const res = await this.db.run('DELETE FROM institutions WHERE id = ?', [id]);
    return res.changes > 0;
  }
}

module.exports = InstitutionRepository;
