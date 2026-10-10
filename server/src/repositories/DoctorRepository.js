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
      notes: row.notes || '',
      areaId: row.area_id,
      areaName: row.area_name || '',
      area: row.area_name || '',
      status: row.is_active ? 'Active' : 'Inactive'
    };
  }

  async findAll() {
    const rows = await this.db.all(`
      SELECT d.*, a.name AS area_name
      FROM doctors d
      LEFT JOIN areas a ON d.area_id = a.id
      ORDER BY d.name ASC
    `);
    return rows.map((r) => this._mapRow(r));
  }

  async findById(id) {
    const row = await this.db.get(`
      SELECT d.*, a.name AS area_name
      FROM doctors d
      LEFT JOIN areas a ON d.area_id = a.id
      WHERE d.id = ?
    `, [id]);
    return this._mapRow(row);
  }

  async _resolveAreaId(d) {
    if (d.areaId) return d.areaId;
    const areaName = d.area || d.areaName;
    if (areaName && typeof areaName === 'string' && areaName.trim().length > 0) {
      const row = await this.db.get('SELECT id FROM areas WHERE LOWER(name) = ?', [areaName.trim().toLowerCase()]);
      if (row) return row.id;
    }
    return null;
  }

  async create(d) {
    const areaId = await this._resolveAreaId(d);
    const isActive = d.status === 'Inactive' ? 0 : 1;
    const row = await this.db.get(
      `INSERT INTO doctors (name, specialty, hospital, city, notes, area_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [d.name, d.specialty || null, d.hospital || null, d.city || null, d.notes || null, areaId, isActive]
    );
    return this.findById(row.id);
  }

  async update(id, d) {
    const areaId = await this._resolveAreaId(d);
    const isActive = d.status === 'Inactive' ? 0 : 1;
    await this.db.run(
      `UPDATE doctors
       SET name = ?, specialty = ?, hospital = ?, city = ?, notes = ?, area_id = ?, is_active = ?
       WHERE id = ?`,
      [d.name, d.specialty || null, d.hospital || null, d.city || null, d.notes || null, areaId, isActive, id]
    );
    return this.findById(id);
  }

  async delete(id) {
    const res = await this.db.run('DELETE FROM doctors WHERE id = ?', [id]);
    return res.changes > 0;
  }
}

module.exports = DoctorRepository;
