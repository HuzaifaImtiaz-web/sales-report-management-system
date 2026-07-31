const logger = require('../../logger.cjs');

class InstitutionValidator {
  constructor(db) {
    this.db = db;
  }

  validateSave(institution) {
    const { id, name } = institution;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Institution Name cannot be empty.');
    }

    let areaId = institution.areaId;
    const areaNameStr = institution.area || institution.areaName;
    if (!areaId && areaNameStr && typeof areaNameStr === 'string' && areaNameStr.trim().length > 0) {
      let areaRow = this.db.prepare('SELECT id FROM areas WHERE LOWER(name) = ?').get(areaNameStr.trim().toLowerCase());
      if (!areaRow) {
        const ins = this.db.prepare('INSERT INTO areas (name, is_active) VALUES (?, 1)').run(areaNameStr.trim());
        areaId = ins.lastInsertRowid;
      } else {
        areaId = areaRow.id;
      }
      institution.areaId = areaId;
    }

    // Check duplicate institution: Name + Area combination (if area set) or Name
    const normalizedName = name.trim().toLowerCase();
    const duplicateQuery = id
      ? this.db.prepare("SELECT id FROM institutions WHERE LOWER(name) = ? AND LOWER(COALESCE(area_id, '')) = LOWER(COALESCE(?, '')) AND id != ?")
      : this.db.prepare("SELECT id FROM institutions WHERE LOWER(name) = ? AND LOWER(COALESCE(area_id, '')) = LOWER(COALESCE(?, ''))");

    const dup = id
      ? duplicateQuery.get(normalizedName, areaId || null, id)
      : duplicateQuery.get(normalizedName, areaId || null);

    if (dup) {
      throw new Error('Institution already exists.');
    }
  }

  validateDelete(id) {
    if (!id) throw new Error('Institution ID is required for deletion.');

    // Check if used in Orders
    const orderCount = this.db.prepare('SELECT COUNT(*) as count FROM orders WHERE institution_id = ?').get(id).count;
    if (orderCount > 0) {
      throw new Error('Institution cannot be deleted because it is referenced by existing orders.');
    }
  }
}

module.exports = InstitutionValidator;
