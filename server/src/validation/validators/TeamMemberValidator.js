const { resolveOrCreateArea } = require('./areaLookup');

class TeamMemberValidator {
  constructor(db) {
    this.db = db;
  }

  async validateSave(member) {
    const { name } = member;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Team Member Name cannot be empty.');
    }

    // Save exact designation typed or selected by user
    member.role = (member.designation || member.role || '').trim();

    await resolveOrCreateArea(this.db, member);
  }

  async validateDelete(id) {
    if (!id) throw new Error('Team Member ID is required for deletion.');

    const row = await this.db.get('SELECT COUNT(*) AS count FROM orders WHERE team_member_id = ?', [id]);
    if (row.count > 0) {
      throw new Error('Team Member cannot be deleted because they are referenced by existing orders.');
    }
  }
}

module.exports = TeamMemberValidator;
