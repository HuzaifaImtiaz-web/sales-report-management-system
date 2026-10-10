const { resolveOrCreateArea } = require('./areaLookup');

class InstitutionValidator {
  constructor(db) {
    this.db = db;
  }

  async validateSave(institution) {
    const { id, name } = institution;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Institution Name cannot be empty.');
    }

    const areaId = await resolveOrCreateArea(this.db, institution);

    // Check duplicate institution: Name + Area combination (if area set) or Name
    const normalizedName = name.trim().toLowerCase();
    const sql = 'SELECT id FROM institutions WHERE LOWER(name) = ? AND area_id IS NOT DISTINCT FROM ?::integer';
    const dup = id
      ? await this.db.get(`${sql} AND id != ?`, [normalizedName, areaId || null, id])
      : await this.db.get(sql, [normalizedName, areaId || null]);

    if (dup) {
      throw new Error('Institution already exists.');
    }
  }

  async validateDelete(id) {
    if (!id) throw new Error('Institution ID is required for deletion.');

    const row = await this.db.get('SELECT COUNT(*) AS count FROM orders WHERE institution_id = ?', [id]);
    if (row.count > 0) {
      throw new Error('Institution cannot be deleted because it is referenced by existing orders.');
    }
  }
}

module.exports = InstitutionValidator;
