const logger = require('../../logger.cjs');

class AreaValidator {
  constructor(db) {
    this.db = db;
  }

  validateSave(area) {
    const { id, name, code } = area;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Area Name cannot be empty.');
    }

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      throw new Error('Area Code cannot be empty.');
    }

    // Check duplicate name
    const normalizedName = name.trim().toLowerCase();
    const duplicateNameQuery = id
      ? this.db.prepare('SELECT id FROM areas WHERE LOWER(name) = ? AND id != ?')
      : this.db.prepare('SELECT id FROM areas WHERE LOWER(name) = ?');

    const dupName = id ? duplicateNameQuery.get(normalizedName, id) : duplicateNameQuery.get(normalizedName);
    if (dupName) {
      throw new Error('Area already exists.');
    }

    // Check duplicate code
    const normalizedCode = code.trim().toLowerCase();
    const duplicateCodeQuery = id
      ? this.db.prepare('SELECT id FROM areas WHERE LOWER(code) = ? AND id != ?')
      : this.db.prepare('SELECT id FROM areas WHERE LOWER(code) = ?');

    const dupCode = id ? duplicateCodeQuery.get(normalizedCode, id) : duplicateCodeQuery.get(normalizedCode);
    if (dupCode) {
      throw new Error('Area Code must be unique.');
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
