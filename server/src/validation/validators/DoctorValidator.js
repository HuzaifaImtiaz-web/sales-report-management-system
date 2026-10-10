const { resolveOrCreateArea } = require('./areaLookup');

class DoctorValidator {
  constructor(db) {
    this.db = db;
  }

  async validateSave(doctor) {
    const { id, name, hospital } = doctor;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Doctor Name cannot be empty.');
    }

    const areaId = await resolveOrCreateArea(this.db, doctor);

    // Check duplicate doctor: Name + Hospital + Area combination.
    // (SQLite compared LOWER(COALESCE(area_id, '')); Postgres can't mix integers and '' so use IS NOT DISTINCT FROM.)
    const normalizedName = name.trim().toLowerCase();
    const normalizedHospital = (hospital || '').trim().toLowerCase();

    const sql = `SELECT id FROM doctors
      WHERE LOWER(name) = ? AND LOWER(COALESCE(hospital, '')) = ? AND area_id IS NOT DISTINCT FROM ?::integer`;
    const dup = id
      ? await this.db.get(`${sql} AND id != ?`, [normalizedName, normalizedHospital, areaId || null, id])
      : await this.db.get(sql, [normalizedName, normalizedHospital, areaId || null]);

    if (dup) {
      throw new Error('Doctor already exists.');
    }
  }

  async validateDelete(id) {
    if (!id) throw new Error('Doctor ID is required for deletion.');

    const row = await this.db.get('SELECT COUNT(*) AS count FROM orders WHERE doctor_id = ?', [id]);
    if (row.count > 0) {
      throw new Error('Doctor cannot be deleted because they are referenced by existing orders.');
    }
  }
}

module.exports = DoctorValidator;
