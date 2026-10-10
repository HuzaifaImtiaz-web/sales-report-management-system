// Settings used to live in each user's own database. In the shared database most settings are
// company-wide, but a few are personal and are stored per user as "user:<id>:<key>".
const PERSONAL_KEYS = new Set(['himmel_account_info', 'himmel_export_preferences']);
const USER_PREFIX = 'user:';

function isPersonalKey(key) {
  return PERSONAL_KEYS.has(key);
}

function scopedKey(key, userId) {
  return isPersonalKey(key) && userId ? `${USER_PREFIX}${userId}:${key}` : key;
}

class SettingsRepository {
  constructor(db) {
    this.db = db;
  }

  async findAll(userId = null) {
    const rows = await this.db.all('SELECT key, value, group_name FROM settings ORDER BY key ASC');
    const settings = {};
    const ownPrefix = userId ? `${USER_PREFIX}${userId}:` : null;

    for (const r of rows) {
      if (r.key.startsWith(USER_PREFIX)) continue;
      settings[r.key] = r.value;
    }
    // The user's personal values replace the company-wide defaults with the same name.
    if (ownPrefix) {
      for (const r of rows) {
        if (r.key.startsWith(ownPrefix)) settings[r.key.slice(ownPrefix.length)] = r.value;
      }
    }
    return settings;
  }

  async findByKey(key, userId = null) {
    const row = await this.db.get('SELECT value FROM settings WHERE key = ?', [scopedKey(key, userId)]);
    if (row) return row.value;
    if (isPersonalKey(key) && userId) {
      // Fall back to the value imported from the old single-user database, if any.
      const shared = await this.db.get('SELECT value FROM settings WHERE key = ?', [key]);
      return shared ? shared.value : null;
    }
    return null;
  }

  async save(key, value, group = 'general', userId = null) {
    await this.db.run(`
      INSERT INTO settings (key, value, group_name)
      VALUES (?, ?, ?)
      ON CONFLICT (key) DO UPDATE SET value = excluded.value
    `, [scopedKey(key, userId), value === null || value === undefined ? null : String(value), group || 'general']);
    return this.findByKey(key, userId);
  }
}

module.exports = SettingsRepository;
module.exports.isPersonalKey = isPersonalKey;
module.exports.PERSONAL_KEYS = PERSONAL_KEYS;
