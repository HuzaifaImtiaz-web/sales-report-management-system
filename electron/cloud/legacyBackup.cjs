const fs = require('fs');
const os = require('os');
const path = require('path');

// Same tables (and order) as server/src/services/SnapshotService.js BUSINESS_TABLES.
const BUSINESS_TABLES = [
  'unit_types', 'divisions', 'groups', 'areas', 'team_members', 'doctors', 'institutions',
  'business_years', 'products', 'product_targets', 'orders', 'order_items',
  'settings', 'audit_logs', 'tasks', 'reminders'
];

function isSqliteFile(filePath) {
  const fd = fs.openSync(filePath, 'r');
  try {
    const header = Buffer.alloc(16);
    fs.readSync(fd, header, 0, 16, 0);
    return header.toString('latin1', 0, 15) === 'SQLite format 3';
  } finally {
    fs.closeSync(fd);
  }
}

/**
 * Reads a backup made by the old local version (backup_<user>_<date>.db or a database/<user>.db file)
 * into the same JSON structure the cloud server restores from.
 */
function readLegacyBackup(filePath) {
  const Database = require('better-sqlite3');

  // Work on a copy so the original file is never touched.
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'himmel-restore-'));
  const copy = path.join(tempDir, 'backup.db');
  fs.copyFileSync(filePath, copy);
  for (const suffix of ['-wal', '-shm']) {
    if (fs.existsSync(filePath + suffix)) fs.copyFileSync(filePath + suffix, copy + suffix);
  }

  const db = new Database(copy, { fileMustExist: true });
  try {
    const integrity = db.pragma('integrity_check');
    if (!integrity || integrity[0].integrity_check !== 'ok') {
      throw new Error('Invalid Backup File: the backup file is corrupted.');
    }

    const existing = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((t) => t.name));
    const tables = {};
    for (const table of BUSINESS_TABLES) {
      if (!existing.has(table)) continue;
      // hidden != 0 are generated columns; the server recomputes them.
      const columns = db.prepare(`PRAGMA table_xinfo("${table}")`).all().filter((c) => c.hidden === 0).map((c) => c.name);
      const rows = db.prepare(`SELECT ${columns.map((c) => `"${c}"`).join(', ')} FROM "${table}"`).raw().all();
      tables[table] = { columns, rows };
    }

    return {
      format: 'himmel-sqlite-export',
      createdAt: new Date().toISOString(),
      source: path.basename(filePath),
      tables
    };
  } finally {
    db.close();
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
      // temp folder cleanup is best effort
    }
  }
}

module.exports = { isSqliteFile, readLegacyBackup };
