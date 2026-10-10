class ProductRepository {
  constructor(db) {
    this.db = db;
  }

  async _resolveDivisionAndGroup(divisionName, groupName) {
    let divStr = (divisionName ?? '').trim();
    if (!divStr) divStr = 'Cardiology';
    let groupStr = (groupName ?? '').trim();
    if (!groupStr) groupStr = 'General';

    let div = await this.db.get('SELECT id FROM divisions WHERE LOWER(name) = ?', [divStr.toLowerCase()]);
    if (!div) {
      div = await this.db.get('SELECT id FROM divisions ORDER BY id ASC LIMIT 1');
    }
    if (!div) {
      div = await this.db.get('INSERT INTO divisions (name) VALUES (?) RETURNING id', [divStr || 'Cardiology']);
    }

    let group = await this.db.get(
      'SELECT id FROM groups WHERE division_id = ? AND LOWER(name) = ?',
      [div.id, groupStr.toLowerCase()]
    );
    if (!group) {
      group = await this.db.get('SELECT id FROM groups WHERE division_id = ? ORDER BY id ASC LIMIT 1', [div.id]);
    }
    if (!group) {
      group = await this.db.get(
        'INSERT INTO groups (division_id, name, is_active) VALUES (?, ?, 1) RETURNING id',
        [div.id, groupStr || 'General']
      );
    }

    return { divisionId: div.id, groupId: group.id };
  }

  async _resolveUnitTypeId(unitTypeName) {
    let name = (unitTypeName ?? '').trim();
    if (!name) name = 'Tablet';

    let row = await this.db.get('SELECT id FROM unit_types WHERE LOWER(name) = ?', [name.toLowerCase()]);
    if (!row && name.toLowerCase().endsWith('s')) {
      row = await this.db.get('SELECT id FROM unit_types WHERE LOWER(name) = ?', [name.slice(0, -1).toLowerCase()]);
    }
    if (!row) {
      row = await this.db.get('SELECT id FROM unit_types WHERE LOWER(name) LIKE ?', [`${name.toLowerCase()}%`]);
    }
    if (!row) {
      const firstUnit = await this.db.get('SELECT id FROM unit_types ORDER BY id ASC LIMIT 1');
      if (firstUnit) return firstUnit.id;
      const ins = await this.db.get('INSERT INTO unit_types (name) VALUES (?) RETURNING id', [name]);
      return ins.id;
    }

    return row.id;
  }

  _mapRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      productCode: row.product_code,
      brandName: row.brand_name,
      genericName: row.generic_name || '',
      divisionId: row.division_id,
      divisionName: row.division_name || '',
      groupId: row.group_id,
      groupName: row.group_name || '',
      strength: row.strength || '',
      dosageForm: row.dosage_form || '',
      registrationNo: row.registration_no || '',
      manufacturer: row.manufacturer || '',
      packSize: row.pack_size,
      unitTypeId: row.unit_type_id,
      unitTypeName: row.unit_name || '',
      tp: row.tp,
      mrp: row.mrp,
      description: row.description || '',
      status: row.status,

      // Backward compatibility fields
      name: row.brand_name,
      code: row.product_code,
      category: row.division_name || '',
      packSizeQty: row.pack_size,
      packSizeUnit: row.unit_name || '',
      packPrice: row.tp,
      perUnitPrice: row.per_unit_price,
      is_active: row.status === 'Active' ? 1 : 0
    };
  }

  async findAll() {
    const rows = await this.db.all(`
      SELECT p.*,
             u.name AS unit_name,
             d.name AS division_name,
             g.name AS group_name
      FROM products p
      JOIN unit_types u ON p.unit_type_id = u.id
      JOIN divisions d ON p.division_id = d.id
      JOIN groups g ON p.group_id = g.id
      ORDER BY p.brand_name ASC
    `);
    return rows.map((r) => this._mapRow(r));
  }

  async findById(id) {
    const row = await this.db.get(`
      SELECT p.*,
             u.name AS unit_name,
             d.name AS division_name,
             g.name AS group_name
      FROM products p
      JOIN unit_types u ON p.unit_type_id = u.id
      JOIN divisions d ON p.division_id = d.id
      JOIN groups g ON p.group_id = g.id
      WHERE p.id = ?
    `, [id]);
    return this._mapRow(row);
  }

  _values(p, divisionId, groupId, unitTypeId) {
    const packSizeInt = parseInt(p.packSize, 10) || parseInt(p.packSizeQty, 10) || 10;
    return [
      divisionId,
      groupId,
      p.productCode || p.code,
      p.brandName || p.name,
      p.genericName || p.brandName || p.name,
      p.strength || null,
      p.dosageForm || null,
      p.registrationNo || null,
      p.manufacturer || 'Himmel Pharmaceutical',
      packSizeInt,
      unitTypeId,
      Number(p.tp || p.packPrice || p.rate || 0),
      Number(p.mrp || p.tp || p.packPrice || p.rate || 0),
      p.description || null,
      p.status || 'Active'
    ];
  }

  async create(p) {
    const { divisionId, groupId } = await this._resolveDivisionAndGroup(
      p.division || p.divisionName || p.category,
      p.groupName || p.category
    );
    const unitTypeId = await this._resolveUnitTypeId(p.unitTypeName || p.packSizeUnit);

    const row = await this.db.get(`
      INSERT INTO products (
        division_id, group_id, product_code, brand_name, generic_name, strength, dosage_form,
        registration_no, manufacturer, pack_size, unit_type_id, tp, mrp, description, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `, this._values(p, divisionId, groupId, unitTypeId));
    return this.findById(row.id);
  }

  async update(id, p) {
    const { divisionId, groupId } = await this._resolveDivisionAndGroup(
      p.division || p.divisionName || p.category,
      p.groupName || p.category
    );
    const unitTypeId = await this._resolveUnitTypeId(p.unitTypeName || p.packSizeUnit);

    await this.db.run(`
      UPDATE products
      SET division_id = ?, group_id = ?, product_code = ?, brand_name = ?, generic_name = ?, strength = ?, dosage_form = ?,
          registration_no = ?, manufacturer = ?, pack_size = ?, unit_type_id = ?, tp = ?, mrp = ?, description = ?, status = ?
      WHERE id = ?
    `, [...this._values(p, divisionId, groupId, unitTypeId), id]);
    return this.findById(id);
  }

  async delete(id) {
    const res = await this.db.run('DELETE FROM products WHERE id = ?', [id]);
    return res.changes > 0;
  }
}

module.exports = ProductRepository;
