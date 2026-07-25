const logger = require('../logger.cjs');

class SettingsRepository {
  constructor(db) {
    this.db = db;
  }

  findAll() {
    logger.info('SQL Trace: SELECT key, value FROM settings');
    const rows = this.db.prepare('SELECT key, value, group_name FROM settings').all();
    const settings = {};
    rows.forEach(r => {
      settings[r.key] = r.value;
    });
    return settings;
  }

  findByKey(key) {
    logger.info(`SQL Trace: SELECT value FROM settings WHERE key = '${key}'`);
    const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : null;
  }

  save(key, value, group = 'general') {
    logger.info(`SQL Trace: INSERT OR REPLACE INTO settings (key, value, group_name) VALUES ('${key}', '${value}')`);
    const stmt = this.db.prepare(`
      INSERT INTO settings (key, value, group_name)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(key, value, group);
    return this.findByKey(key);
  }

  saveAll(settingsMap) {
    logger.info('SQL Trace: Saving all settings map...');
    const stmt = this.db.prepare(`
      INSERT INTO settings (key, value, group_name)
      VALUES (?, ?, 'general')
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `);
    this.db.transaction(() => {
      for (const [key, value] of Object.entries(settingsMap)) {
        stmt.run(key, String(value));
      }
    })();
    return this.findAll();
  }
}

module.exports = SettingsRepository;
