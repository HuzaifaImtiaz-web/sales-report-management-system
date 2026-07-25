const logger = require('../logger.cjs');

class UserRepository {
  constructor(db) {
    if (!db) {
      throw new Error('Database connection is required for UserRepository.');
    }
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
      databaseName: row.database_name,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLogin: row.last_login,
      failedAttempts: row.failed_attempts || 0,
      lockedUntil: row.locked_until,
      forcePasswordChange: row.force_password_change === 1
    };
  }

  findByUsername(username) {
    if (!username) return null;
    const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?');
    const row = stmt.get(username.trim());
    return this._mapRow(row);
  }

  findById(id) {
    if (!id) return null;
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id);
    return this._mapRow(row);
  }

  findAll() {
    const stmt = this.db.prepare('SELECT * FROM users ORDER BY username ASC');
    const rows = stmt.all();
    return rows.map(row => this._mapRow(row));
  }

  create(user) {
    logger.info(`Creating user: ${user.username}`);
    const stmt = this.db.prepare(`
      INSERT INTO users (username, password_hash, full_name, role, database_name, is_active, force_password_change)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const isActive = user.isActive === false ? 0 : 1;
    const forceChange = user.forcePasswordChange ? 1 : 0;
    const res = stmt.run(
      user.username.trim(),
      user.passwordHash,
      user.fullName.trim(),
      user.role,
      user.databaseName,
      isActive,
      forceChange
    );
    return this.findById(res.lastInsertRowid);
  }

  update(id, fields) {
    logger.info(`Updating user ID: ${id}`);
    const keys = Object.keys(fields);
    if (keys.length === 0) return this.findById(id);

    const updateFields = [];
    const values = [];

    // Map JS properties to DB column names
    const fieldMapping = {
      username: 'username',
      passwordHash: 'password_hash',
      fullName: 'full_name',
      role: 'role',
      databaseName: 'database_name',
      isActive: 'is_active',
      lastLogin: 'last_login',
      failedAttempts: 'failed_attempts',
      lockedUntil: 'locked_until',
      forcePasswordChange: 'force_password_change'
    };

    keys.forEach(key => {
      const dbCol = fieldMapping[key];
      if (dbCol) {
        updateFields.push(`${dbCol} = ?`);
        let val = fields[key];
        if (key === 'isActive') val = val ? 1 : 0;
        if (key === 'forcePasswordChange') val = val ? 1 : 0;
        values.push(val);
      }
    });

    if (updateFields.length === 0) return this.findById(id);

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    this.db.prepare(sql).run(...values);
    return this.findById(id);
  }

  delete(id) {
    logger.info(`Deleting user ID: ${id}`);
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    const res = stmt.run(id);
    return res.changes > 0;
  }

  incrementFailedAttempts(username) {
    const user = this.findByUsername(username);
    if (!user) return null;
    const attempts = user.failedAttempts + 1;
    logger.info(`Incrementing failed login attempts for user ${username} to ${attempts}`);
    this.update(user.id, { failedAttempts: attempts });
    return attempts;
  }

  resetFailedAttempts(username) {
    const user = this.findByUsername(username);
    if (!user) return;
    logger.info(`Resetting failed login attempts for user ${username}`);
    this.update(user.id, { failedAttempts: 0, lockedUntil: null });
  }

  lockAccount(username, durationMinutes) {
    const user = this.findByUsername(username);
    if (!user) return;
    const lockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    logger.info(`Locking user account ${username} until ${lockedUntil}`);
    this.update(user.id, { lockedUntil });
  }

  unlockAccount(username) {
    const user = this.findByUsername(username);
    if (!user) return;
    logger.info(`Unlocking user account ${username}`);
    this.update(user.id, { failedAttempts: 0, lockedUntil: null });
  }

  updateLastLogin(username) {
    const user = this.findByUsername(username);
    if (!user) return;
    const lastLogin = new Date().toISOString();
    this.update(user.id, { lastLogin });
  }
}

module.exports = UserRepository;
