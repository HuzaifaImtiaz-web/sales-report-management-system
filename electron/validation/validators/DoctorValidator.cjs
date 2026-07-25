const logger = require('../../logger.cjs');

class DoctorValidator {
  constructor(db) {
    this.db = db;
  }

  validateSave(doctor) {
    const { id, name, hospital } = doctor;
    let areaId = doctor.areaId;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Doctor Name cannot be empty.');
    }

    const areaNameStr = doctor.area || doctor.areaName;
    if (!areaId && areaNameStr && typeof areaNameStr === 'string' && areaNameStr.trim().length > 0) {
      let areaRow = this.db.prepare('SELECT id FROM areas WHERE LOWER(name) = ?').get(areaNameStr.trim().toLowerCase());
      if (!areaRow) {
        // Auto-create missing area
        const newCode = `AREA-${areaNameStr.trim().slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
        const ins = this.db.prepare('INSERT INTO areas (name, code, is_active) VALUES (?, ?, 1)').run(areaNameStr.trim(), newCode);
        areaId = ins.lastInsertRowid;
      } else {
        areaId = areaRow.id;
      }
      doctor.areaId = areaId;
    }

    if (!areaId) {
      throw new Error('Doctor must be assigned to an Area.');
    }

    // Phone / Mobile validation (strict 11 digits)
    const phone = doctor.mobile || doctor.phone;
    if (phone && typeof phone === 'string' && phone.trim().length > 0) {
      const digitsOnly = phone.trim().replace(/\D/g, '');
      if (digitsOnly.length !== 11 || phone.trim() !== digitsOnly) {
        throw new Error('Phone number must contain exactly 11 numeric digits.');
      }
    }

    // Verify Area exists and is active
    const area = this.db.prepare('SELECT id, is_active FROM areas WHERE id = ?').get(areaId);
    if (!area) {
      throw new Error('Assigned Area does not exist.');
    }

    // Check duplicate doctor: Name + Hospital + Area combination
    const normalizedName = name.trim().toLowerCase();
    const normalizedHospital = (hospital || '').trim().toLowerCase();

    const duplicateQuery = id
      ? this.db.prepare("SELECT id FROM doctors WHERE LOWER(name) = ? AND LOWER(COALESCE(hospital, '')) = ? AND area_id = ? AND id != ?")
      : this.db.prepare("SELECT id FROM doctors WHERE LOWER(name) = ? AND LOWER(COALESCE(hospital, '')) = ? AND area_id = ?");

    const dup = id 
      ? duplicateQuery.get(normalizedName, normalizedHospital, areaId, id)
      : duplicateQuery.get(normalizedName, normalizedHospital, areaId);

    if (dup) {
      throw new Error('Doctor already exists.');
    }
  }

  validateDelete(id) {
    if (!id) throw new Error('Doctor ID is required for deletion.');

    // Check if used in Orders
    const orderCount = this.db.prepare('SELECT COUNT(*) as count FROM orders WHERE doctor_id = ?').get(id).count;
    if (orderCount > 0) {
      throw new Error('Doctor cannot be deleted because they are referenced by existing orders.');
    }
  }
}

module.exports = DoctorValidator;
