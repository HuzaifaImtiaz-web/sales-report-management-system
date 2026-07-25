const logger = require('../../logger.cjs');

class TeamMemberValidator {
  constructor(db) {
    this.db = db;
  }

  validateSave(member) {
    const { id, name } = member;
    
    // Normalize role / designation to fit CHECK constraint: ('Admin', 'Manager', 'Rep', 'Sales Representative')
    const rawRole = (member.role || member.designation || 'Sales Representative').trim();
    let validRole = 'Sales Representative';
    if (['Admin'].includes(rawRole)) validRole = 'Admin';
    else if (['Manager', 'Area Sales Manager', 'Regional Sales Manager', 'Sales Manager'].includes(rawRole)) validRole = 'Manager';
    else if (['Rep', 'Medical Representative', 'Territory Manager', 'Sales Representative'].includes(rawRole)) validRole = 'Sales Representative';
    member.role = validRole;

    let areaId = member.areaId;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Team Member Name cannot be empty.');
    }

    const areaNameStr = member.area || member.areaName;
    if (!areaId && areaNameStr && typeof areaNameStr === 'string' && areaNameStr.trim().length > 0) {
      let areaRow = this.db.prepare('SELECT id FROM areas WHERE LOWER(name) = ?').get(areaNameStr.trim().toLowerCase());
      if (!areaRow) {
        const newCode = `AREA-${areaNameStr.trim().slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
        const ins = this.db.prepare('INSERT INTO areas (name, code, is_active) VALUES (?, ?, 1)').run(areaNameStr.trim(), newCode);
        areaId = ins.lastInsertRowid;
      } else {
        areaId = areaRow.id;
      }
      member.areaId = areaId;
    }

    // Phone / Mobile validation (strict 11 digits)
    const phone = member.phone || member.mobile;
    if (phone && typeof phone === 'string' && phone.trim().length > 0) {
      const digitsOnly = phone.trim().replace(/\D/g, '');
      if (digitsOnly.length !== 11 || phone.trim() !== digitsOnly) {
        throw new Error('Phone number must contain exactly 11 numeric digits.');
      }
    }

    const email = member.email;
    if (email && typeof email === 'string' && email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw new Error('Invalid email address format.');
      }

      // Check unique email
      const duplicateEmailQuery = id
        ? this.db.prepare('SELECT id FROM team_members WHERE LOWER(email) = ? AND id != ?')
        : this.db.prepare('SELECT id FROM team_members WHERE LOWER(email) = ?');

      const dupEmail = id 
        ? duplicateEmailQuery.get(email.trim().toLowerCase(), id)
        : duplicateEmailQuery.get(email.trim().toLowerCase());

      if (dupEmail) {
        throw new Error('Email address already registered by another team member.');
      }
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
