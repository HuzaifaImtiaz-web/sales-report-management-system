const logger = require('../../logger.cjs');

class AreaValidator {
  constructor(db) {
    this.db = db;
  }

  validateSave(area) {
    const { id, name, city } = area;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Area Name cannot be empty.');
    }

    // Check duplicate combination of Name + City
    const normalizedName = name.trim().toLowerCase();
    const normalizedCity = (city || '').trim().toLowerCase();

    const duplicateQuery = id
      ? this.db.prepare("SELECT id FROM areas WHERE LOWER(name) = ? AND LOWER(COALESCE(city, '')) = ? AND id != ?")
      : this.db.prepare("SELECT id FROM areas WHERE LOWER(name) = ? AND LOWER(COALESCE(city, '')) = ?");

    const dup = id 
      ? duplicateQuery.get(normalizedName, normalizedCity, id) 
      : duplicateQuery.get(normalizedName, normalizedCity);

    if (dup) {
      throw new Error('Area with this Name and City already exists.');
    }
  }

  validateDelete(id) {
    if (!id) throw new Error('Area ID is required for deletion.');

    const doctorsCount = this.db.prepare('SELECT COUNT(*) as count FROM doctors WHERE area_id = ?').get(id).count;
    const institutionsCount = this.db.prepare('SELECT COUNT(*) as count FROM institutions WHERE area_id = ?').get(id).count;
    const teamMembersCount = this.db.prepare('SELECT COUNT(*) as count FROM team_members WHERE area_id = ?').get(id).count;
    const ordersCount = this.db.prepare('SELECT COUNT(*) as count FROM orders WHERE area_id = ?').get(id).count;

    if (doctorsCount > 0 || institutionsCount > 0 || teamMembersCount > 0 || ordersCount > 0) {
      let msg = 'This Area cannot be deleted because it is currently used by:\n';
      if (doctorsCount > 0) msg += `• ${doctorsCount} Doctors\n`;
      if (institutionsCount > 0) msg += `• ${institutionsCount} Institutions\n`;
      if (teamMembersCount > 0) msg += `• ${teamMembersCount} Team Members\n`;
      if (ordersCount > 0) msg += `• ${ordersCount} Orders\n`;
      throw new Error(msg.trim());
    }
  }
}

module.exports = AreaValidator;
