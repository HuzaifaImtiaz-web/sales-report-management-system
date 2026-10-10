class AreaValidator {
  constructor(db) {
    this.db = db;
  }

  async validateSave(area) {
    const { id, name, city } = area;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Area Name cannot be empty.');
    }

    // Check duplicate combination of Name + City
    const normalizedName = name.trim().toLowerCase();
    const normalizedCity = (city || '').trim().toLowerCase();

    const dup = id
      ? await this.db.get(
        "SELECT id FROM areas WHERE LOWER(name) = ? AND LOWER(COALESCE(city, '')) = ? AND id != ?",
        [normalizedName, normalizedCity, id]
      )
      : await this.db.get(
        "SELECT id FROM areas WHERE LOWER(name) = ? AND LOWER(COALESCE(city, '')) = ?",
        [normalizedName, normalizedCity]
      );

    if (dup) {
      throw new Error('Area with this Name and City already exists.');
    }
  }

  async validateDelete(id) {
    if (!id) throw new Error('Area ID is required for deletion.');

    const counts = await this.db.get(`
      SELECT
        (SELECT COUNT(*) FROM doctors WHERE area_id = ?) AS doctors,
        (SELECT COUNT(*) FROM institutions WHERE area_id = ?) AS institutions,
        (SELECT COUNT(*) FROM team_members WHERE area_id = ?) AS team_members,
        (SELECT COUNT(*) FROM orders WHERE area_id = ?) AS orders
    `, [id, id, id, id]);

    if (counts.doctors > 0 || counts.institutions > 0 || counts.team_members > 0 || counts.orders > 0) {
      let msg = 'This Area cannot be deleted because it is currently used by:\n';
      if (counts.doctors > 0) msg += `• ${counts.doctors} Doctors\n`;
      if (counts.institutions > 0) msg += `• ${counts.institutions} Institutions\n`;
      if (counts.team_members > 0) msg += `• ${counts.team_members} Team Members\n`;
      if (counts.orders > 0) msg += `• ${counts.orders} Orders\n`;
      throw new Error(msg.trim());
    }
  }
}

module.exports = AreaValidator;
