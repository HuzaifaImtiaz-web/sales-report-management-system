const logger = require('../../logger.cjs');

class TeamMemberValidator {
  constructor(db) {
    this.db = db;
  }

  validateSave(member) {
    const { id, name } = member;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Team Member Name cannot be empty.');
    }
    
    // Save exact designation typed or selected by user
    const rawRole = (member.designation || member.role || '').trim();
    member.role = rawRole;

    let areaId = member.areaId;
    const areaNameStr = member.area || member.areaName;
    if (!areaId && areaNameStr && typeof areaNameStr === 'string' && areaNameStr.trim().length > 0) {
      let areaRow = this.db.prepare('SELECT id FROM areas WHERE LOWER(name) = ?').get(areaNameStr.trim().toLowerCase());
      if (!areaRow) {
        const ins = this.db.prepare('INSERT INTO areas (name, is_active) VALUES (?, 1)').run(areaNameStr.trim());
        areaId = ins.lastInsertRowid;
      } else {
        areaId = areaRow.id;
      }
      member.areaId = areaId;
    }
  }

  validateDelete(id) {
    if (!id) throw new Error('Team Member ID is required for deletion.');

    // Check if used in Orders
    const orderCount = this.db.prepare('SELECT COUNT(*) as count FROM orders WHERE team_member_id = ?').get(id).count;
    if (orderCount > 0) {
      throw new Error('Team Member cannot be deleted because they are referenced by existing orders.');
    }
  }
}

module.exports = TeamMemberValidator;
