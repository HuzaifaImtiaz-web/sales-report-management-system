const logger = require('../../logger.cjs');

class InstitutionValidator {
  constructor(db) {
    this.db = db;
  }

  validateSave(institution) {
    const { id, name } = institution;
    
    // Normalize institution type to fit constraint: ('Hospital', 'Clinic', 'Pharmacy', 'Other')
    let rawType = (institution.type || 'Hospital').trim();
    if (rawType.toLowerCase().includes('hospital')) rawType = 'Hospital';
    else if (rawType.toLowerCase().includes('clinic')) rawType = 'Clinic';
    else if (rawType.toLowerCase().includes('pharmacy')) rawType = 'Pharmacy';
    else if (!['Hospital', 'Clinic', 'Pharmacy', 'Other'].includes(rawType)) rawType = 'Other';
    institution.type = rawType;

    let areaId = institution.areaId;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Institution Name cannot be empty.');
    }

    const areaNameStr = institution.area || institution.areaName;
    if (!areaId && areaNameStr && typeof areaNameStr === 'string' && areaNameStr.trim().length > 0) {
      let areaRow = this.db.prepare('SELECT id FROM areas WHERE LOWER(name) = ?').get(areaNameStr.trim().toLowerCase());
      if (!areaRow) {
        const newCode = `AREA-${areaNameStr.trim().slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
        const ins = this.db.prepare('INSERT INTO areas (name, code, is_active) VALUES (?, ?, 1)').run(areaNameStr.trim(), newCode);
        areaId = ins.lastInsertRowid;
      } else {
        areaId = areaRow.id;
      }
      institution.areaId = areaId;
    }

    if (!areaId) {
      throw new Error('Institution must be assigned to an Area.');
    }

    // Phone / Mobile validation (strict 11 digits)
    const phone = institution.contactNumber || institution.phone;
    if (phone && typeof phone === 'string' && phone.trim().length > 0) {
      const digitsOnly = phone.trim().replace(/\D/g, '');
      if (digitsOnly.length !== 11 || phone.trim() !== digitsOnly) {
        throw new Error('Phone number must contain exactly 11 numeric digits.');
      }
    }

    // Verify Area exists
    const area = this.db.prepare('SELECT id, is_active FROM areas WHERE id = ?').get(areaId);
    if (!area) {
      throw new Error('Assigned Area does not exist.');
    }

    // Check duplicate institution: Name + Area combination
    const normalizedName = name.trim().toLowerCase();
    const duplicateQuery = id
      ? this.db.prepare('SELECT id FROM institutions WHERE LOWER(name) = ? AND area_id = ? AND id != ?')
      : this.db.prepare('SELECT id FROM institutions WHERE LOWER(name) = ? AND area_id = ?');

    const dup = id
      ? duplicateQuery.get(normalizedName, areaId, id)
      : duplicateQuery.get(normalizedName, areaId);

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
