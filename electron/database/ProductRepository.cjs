const logger = require('../logger.cjs');

class ProductRepository {
  constructor(db) {
    this.db = db;
  }

  _resolveDivisionAndGroup(divisionName, groupName) {
    if (!divisionName || typeof divisionName !== 'string' || divisionName.trim().length === 0) {
      throw new Error('Division is required.');
    }
    if (!groupName || typeof groupName !== 'string' || groupName.trim().length === 0) {
      throw new Error('Product Group is required.');
    }

    const div = this.db.prepare('SELECT id FROM divisions WHERE LOWER(name) = ?').get(divisionName.trim().toLowerCase());
    if (!div) {
      throw new Error(`Division '${divisionName}' does not exist.`);
    }

    const group = this.db.prepare('SELECT id FROM groups WHERE division_id = ? AND LOWER(name) = ?').get(div.id, groupName.trim().toLowerCase());
    if (!group) {
      throw new Error(`Product Group '${groupName}' does not exist under Division '${divisionName}'.`);
    }

    return { divisionId: div.id, groupId: group.id };
  }

  _resolveUnitTypeId(unitTypeName) {
    if (!unitTypeName || typeof unitTypeName !== 'string' || unitTypeName.trim().length === 0) {
      throw new Error('Unit Type is required.');
    }

    let name = unitTypeName.trim();
    let row = this.db.prepare('SELECT id FROM unit_types WHERE LOWER(name) = ?').get(name.toLowerCase());
    if (!row && name.toLowerCase().endsWith('s')) {
      row = this.db.prepare('SELECT id FROM unit_types WHERE LOWER(name) = ?').get(name.slice(0, -1).toLowerCase());
    }
    if (!row) {
      row = this.db.prepare('SELECT id FROM unit_types WHERE LOWER(name) LIKE ?').get(`${name.toLowerCase()}%`);
    }
    if (!row) {
      const ins = this.db.prepare('INSERT INTO unit_types (name) VALUES (?)').run(name);
      return ins.lastInsertRowid;
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

  findAll() {
    logger.info('SQL Trace: Fetching all products with division and group details');
    const rows = this.db.prepare(`
      SELECT p.*, 
             u.name AS unit_name,
             d.name AS division_name,
             g.name AS group_name
      FROM products p 
      JOIN unit_types u ON p.unit_type_id = u.id 
      JOIN divisions d ON p.division_id = d.id
      JOIN groups g ON p.group_id = g.id
      ORDER BY p.brand_name ASC
    `).all();
    return rows.map(r => this._mapRow(r));
  }

  findById(id) {
    logger.info(`SQL Trace: Fetching product by id = ${id}`);
    const row = this.db.prepare(`
      SELECT p.*, 
             u.name AS unit_name,
             d.name AS division_name,
             g.name AS group_name
      FROM products p 
      JOIN unit_types u ON p.unit_type_id = u.id 
      JOIN divisions d ON p.division_id = d.id
      JOIN groups g ON p.group_id = g.id
      WHERE p.id = ?
    `).get(id);
    return this._mapRow(row);
  }

  create(p) {
    logger.info(`SQL Trace: Creating product ${p.brandName || p.name}`);
    const { divisionId, groupId } = this._resolveDivisionAndGroup(p.division || p.divisionName || p.category, p.groupName || p.category);
    const unitTypeId = this._resolveUnitTypeId(p.unitTypeName || p.packSizeUnit);
    
    const packSizeInt = parseInt(p.packSize, 10) || parseInt(p.packSizeQty, 10) || 10;

    const stmt = this.db.prepare(`
      INSERT INTO products (
        division_id, group_id, product_code, brand_name, generic_name, strength, dosage_form,
        registration_no, manufacturer, pack_size, unit_type_id, tp, mrp, description, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const res = stmt.run(
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
    );
    return this.findById(res.lastInsertRowid);
  }

  update(id, p) {
    logger.info(`SQL Trace: Updating product id = ${id}`);
    const { divisionId, groupId } = this._resolveDivisionAndGroup(p.division || p.divisionName || p.category, p.groupName || p.category);
    const unitTypeId = this._resolveUnitTypeId(p.unitTypeName || p.packSizeUnit);
    const packSizeInt = parseInt(p.packSize, 10) || parseInt(p.packSizeQty, 10) || 10;

    const stmt = this.db.prepare(`
      UPDATE products
      SET division_id = ?, group_id = ?, product_code = ?, brand_name = ?, generic_name = ?, strength = ?, dosage_form = ?,
          registration_no = ?, manufacturer = ?, pack_size = ?, unit_type_id = ?, tp = ?, mrp = ?, description = ?, status = ?
      WHERE id = ?
    `);

    stmt.run(
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
      p.status || 'Active',
      id
    );
    return this.findById(id);
  }

  delete(id) {
    logger.info(`SQL Trace: Deleting product id = ${id}`);
    const stmt = this.db.prepare('DELETE FROM products WHERE id = ?');
    const res = stmt.run(id);
    return res.changes > 0;
  }
}

module.exports = ProductRepository;
