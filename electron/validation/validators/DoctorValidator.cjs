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
        const ins = this.db.prepare('INSERT INTO areas (name, is_active) VALUES (?, 1)').run(areaNameStr.trim());
        areaId = ins.lastInsertRowid;
      } else {
        areaId = areaRow.id;
      }
      doctor.areaId = areaId;
    }

    // Check duplicate doctor: Name + Hospital + Area combination
    const normalizedName = name.trim().toLowerCase();
    const normalizedHospital = (hospital || '').trim().toLowerCase();

    const duplicateQuery = id
      ? this.db.prepare("SELECT id FROM doctors WHERE LOWER(name) = ? AND LOWER(COALESCE(hospital, '')) = ? AND LOWER(COALESCE(area_id, '')) = LOWER(COALESCE(?, '')) AND id != ?")
      : this.db.prepare("SELECT id FROM doctors WHERE LOWER(name) = ? AND LOWER(COALESCE(hospital, '')) = ? AND LOWER(COALESCE(area_id, '')) = LOWER(COALESCE(?, ''))");

    const dup = id 
      ? duplicateQuery.get(normalizedName, normalizedHospital, areaId || null, id)
      : duplicateQuery.get(normalizedName, normalizedHospital, areaId || null);

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
