class UserRepository {
  constructor(db) {
    this.db = db;
  }

  _mapRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash, // Internal use only
      fullName: row.full_name,
      role: row.role,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLogin: row.last_login,
      failedAttempts: row.failed_attempts || 0,
      lockedUntil: row.locked_until,
      forcePasswordChange: row.force_password_change === 1,
      sessionVersion: row.session_version || 0
    };
  }

  // Usernames are case-insensitive (COLLATE NOCASE in the SQLite version).
  async findByUsername(username) {
    if (!username) return null;
    const row = await this.db.get('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', [String(username).trim()]);
    return this._mapRow(row);
  }

  async findById(id) {
    if (!id) return null;
    const row = await this.db.get('SELECT * FROM users WHERE id = ?', [id]);
    return this._mapRow(row);
  }

  async findAll() {
    const rows = await this.db.all('SELECT * FROM users ORDER BY username ASC');
    return rows.map((row) => this._mapRow(row));
  }

  async create(user) {
    const row = await this.db.get(`
      INSERT INTO users (username, password_hash, full_name, role, is_active, force_password_change)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING id
    `, [
      user.username.trim(),
      user.passwordHash,
      user.fullName.trim(),
      user.role,
      user.isActive === false ? 0 : 1,
      user.forcePasswordChange ? 1 : 0
    ]);
    return this.findById(row.id);
  }

  async update(id, fields) {
    const fieldMapping = {
      username: 'username',
      passwordHash: 'password_hash',
      fullName: 'full_name',
      role: 'role',
      isActive: 'is_active',
      lastLogin: 'last_login',
      failedAttempts: 'failed_attempts',
      lockedUntil: 'locked_until',
      forcePasswordChange: 'force_password_change'
    };

    const updateFields = [];
    const values = [];
    for (const [key, value] of Object.entries(fields)) {
      const column = fieldMapping[key];
      if (!column) continue;
      updateFields.push(`${column} = ?`);
      values.push(key === 'isActive' || key === 'forcePasswordChange' ? (value ? 1 : 0) : value);
    }

    // Changing the password or disabling an account signs that user out everywhere.
    if (fields.passwordHash !== undefined || fields.isActive === false || fields.bumpSessionVersion) {
      updateFields.push('session_version = session_version + 1');
    }

    if (updateFields.length === 0) return this.findById(id);

    values.push(id);
    await this.db.run(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  async delete(id) {
    const res = await this.db.run('DELETE FROM users WHERE id = ?', [id]);
    return res.changes > 0;
  }

  async incrementFailedAttempts(id) {
    const row = await this.db.get(
      'UPDATE users SET failed_attempts = failed_attempts + 1 WHERE id = ? RETURNING failed_attempts',
      [id]
    );
    return row ? row.failed_attempts : 0;
  }

  async lockAccount(id, durationMinutes) {
    const lockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    await this.update(id, { lockedUntil });
  }

  async unlockAccount(id) {
    await this.update(id, { failedAttempts: 0, lockedUntil: null });
  }

  async recordSuccessfulLogin(id) {
    await this.update(id, { failedAttempts: 0, lockedUntil: null, lastLogin: new Date().toISOString() });
  }

  async countOtherActiveAdmins(excludeId) {
    const row = await this.db.get(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'Admin' AND is_active = 1 AND id != ?",
      [excludeId]
    );
    return row.count;
  }
}

module.exports = UserRepository;
