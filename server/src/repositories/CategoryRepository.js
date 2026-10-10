// Product groups ("categories" in the IPC channel names).
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

  async findAll() {
    // NULLS FIRST keeps SQLite's ordering for groups without a division.
    const rows = await this.db.all(`
      SELECT g.*,
             d.name AS division_name,
             (SELECT COUNT(*) FROM products p WHERE p.group_id = g.id) AS total_products
      FROM groups g
      LEFT JOIN divisions d ON g.division_id = d.id
      ORDER BY d.name ASC NULLS FIRST, g.name ASC
    `);
    return rows.map((r) => this._mapRow(r));
  }

  async findById(id) {
    const row = await this.db.get(`
      SELECT g.*,
             d.name AS division_name,
             (SELECT COUNT(*) FROM products p WHERE p.group_id = g.id) AS total_products
      FROM groups g
      LEFT JOIN divisions d ON g.division_id = d.id
      WHERE g.id = ?
    `, [id]);
    return this._mapRow(row);
  }

  async create(c) {
    const isActive = c.status === 'Inactive' ? 0 : 1;
    const row = await this.db.get(
      `INSERT INTO groups (division_id, name, description, is_active)
       VALUES (?, ?, ?, ?) RETURNING id`,
      [c.divisionId || null, c.name, c.description || null, isActive]
    );
    return this.findById(row.id);
  }

  async update(id, c) {
    const isActive = c.status === 'Inactive' ? 0 : 1;
    await this.db.run(
      `UPDATE groups
       SET division_id = ?, name = ?, description = ?, is_active = ?
       WHERE id = ?`,
      [c.divisionId || null, c.name, c.description || null, isActive, id]
    );
    return this.findById(id);
  }

  async delete(id) {
    const res = await this.db.run('DELETE FROM groups WHERE id = ?', [id]);
    return res.changes > 0;
  }

  async findAllDivisions() {
    return this.db.all('SELECT * FROM divisions ORDER BY name ASC');
  }
}

module.exports = CategoryRepository;
