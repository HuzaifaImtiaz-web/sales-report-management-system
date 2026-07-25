const logger = require('../logger.cjs');

function applyUsersSchema(db) {
  logger.info('Applying authentication database schema...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('Admin', 'Manager', 'Rep', 'Sales Representative')),
      database_name TEXT NOT NULL UNIQUE,
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_login TEXT,
      failed_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until TEXT,
      force_password_change INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

    CREATE TABLE IF NOT EXISTS system_security (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration check for force_password_change column in case table existed previously
  try {
    const columns = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
    if (!columns.includes('force_password_change')) {
      db.exec('ALTER TABLE users ADD COLUMN force_password_change INTEGER NOT NULL DEFAULT 0;');
    }
  } catch (err) {
    logger.warn(`Could not add force_password_change column: ${err.message}`);
  }

  logger.info('Authentication database schema applied successfully.');
}

module.exports = { applyUsersSchema };
