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

  async findAll() {
    const rows = await this.db.all('SELECT * FROM areas ORDER BY name ASC');
    return rows.map((r) => this._mapRow(r));
  }

  async findById(id) {
    const row = await this.db.get('SELECT * FROM areas WHERE id = ?', [id]);
    return this._mapRow(row);
  }

  async create(a) {
    const isActive = a.status === 'Inactive' ? 0 : 1;
    const row = await this.db.get(
      `INSERT INTO areas (name, city, region, description, is_active)
       VALUES (?, ?, ?, ?, ?) RETURNING id`,
      [a.name, a.city || null, a.region || null, a.description || null, isActive]
    );
    return this.findById(row.id);
  }

  async update(id, a) {
    const isActive = a.status === 'Inactive' ? 0 : 1;
    await this.db.run(
      `UPDATE areas
       SET name = ?, city = ?, region = ?, description = ?, is_active = ?
       WHERE id = ?`,
      [a.name, a.city || null, a.region || null, a.description || null, isActive, id]
    );
    return this.findById(id);
  }

  async delete(id) {
    const res = await this.db.run('DELETE FROM areas WHERE id = ?', [id]);
    return res.changes > 0;
  }
}

module.exports = AreaRepository;
