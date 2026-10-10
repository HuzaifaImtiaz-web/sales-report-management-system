// One-time move of an existing desktop installation (SQLite files) into the shared cloud database.
//
//   node scripts/import-from-sqlite.js --data "<folder>/database/admin.db" --users "<folder>/users.db"          (preview)
//   node scripts/import-from-sqlite.js --data "<folder>/database/admin.db" --users "<folder>/users.db" --yes    (import)
//
// The files are in %APPDATA%\Himmel Pharmaceutical\ on the computer that ran the desktop app.
// Close the desktop app first. The import REPLACES the business data in the cloud database, and with
// --users also all login accounts and the emergency recovery password/PIN.
// Without --users the existing cloud accounts are kept.
//
// Uses DATABASE_URL from server/.env (or the environment). Needs Node.js 22.13 or newer (built-in node:sqlite).

const fs = require('fs');
const os = require('os');
const path = require('path');

function parseArgs(argv) {
  const args = { yes: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--yes' || arg === '-y') args.yes = true;
    else if (arg === '--data') args.data = argv[++i];
    else if (arg === '--users') args.users = argv[++i];
    else if (arg === '--owner') args.owner = argv[++i];
    else if (arg === '--help' || arg === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function loadSqlite() {
  try {
    return require('node:sqlite');
  } catch (e) {
    throw new Error(`This script needs Node.js 22.13 or newer (node:sqlite). You are running ${process.version}.`);
  }
}

// Work on a copy so the original files (and any pending -wal changes) are never modified.
function copyDatabase(file) {
  if (!fs.existsSync(file)) throw new Error(`File not found: ${file}`);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'himmel-import-'));
  const target = path.join(dir, path.basename(file));
  fs.copyFileSync(file, target);
  for (const suffix of ['-wal', '-shm']) {
    if (fs.existsSync(file + suffix)) fs.copyFileSync(file + suffix, target + suffix);
  }
  return target;
}

function readTables(file, tableNames) {
  const { DatabaseSync } = loadSqlite();
  const db = new DatabaseSync(copyDatabase(file));
  try {
    const existing = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((r) => r.name));
    const tables = {};
    for (const table of tableNames) {
      if (!existing.has(table)) continue;
      // hidden != 0 are generated columns; PostgreSQL recomputes them.
      const columns = db.prepare(`PRAGMA table_xinfo("${table}")`).all().filter((c) => c.hidden === 0).map((c) => c.name);
      const rows = db.prepare(`SELECT ${columns.map((c) => `"${c}"`).join(', ')} FROM "${table}"`).all();
      tables[table] = { columns, rows: rows.map((row) => columns.map((c) => row[c])) };
    }
    return tables;
  } finally {
    db.close();
  }
}

function maskUrl(url) {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.port ? `:${u.port}` : ''}${u.pathname}`;
  } catch (e) {
    return '(invalid DATABASE_URL)';
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.data) {
    console.log('Usage: node scripts/import-from-sqlite.js --data <admin.db> [--users <users.db>] [--owner <username>] [--yes]');
    process.exit(args.help ? 0 : 1);
  }

  // Loaded after argument checks so `--help` works without a database configured.
  const config = require('../src/config');
  const { createPool, createDb } = require('../src/db');
  const { migrate } = require('../src/db/migrate');
  const { restoreSnapshot, BUSINESS_TABLES, ACCOUNT_TABLES, LEGACY_FORMAT } = require('../src/services/SnapshotService');

  const snapshot = {
    format: LEGACY_FORMAT,
    createdAt: new Date().toISOString(),
    tables: readTables(path.resolve(args.data), BUSINESS_TABLES)
  };
  if (args.users) {
    Object.assign(snapshot.tables, readTables(path.resolve(args.users), ACCOUNT_TABLES));
  }

  console.log(`\nSource: ${path.resolve(args.data)}${args.users ? ` + ${path.resolve(args.users)}` : ''}`);
  console.log(`Target: ${maskUrl(config.databaseUrl)}\n`);
  for (const [table, data] of Object.entries(snapshot.tables)) {
    console.log(`  ${table.padEnd(18)} ${String(data.rows.length).padStart(7)} rows`);
  }

  if (!args.yes) {
    console.log('\nPreview only. Run again with --yes to REPLACE the data in the cloud database with these rows.');
    return;
  }

  const pool = createPool({ max: 2 });
  const db = createDb(pool, pool);
  try {
    await migrate(db); // make sure the schema exists

    // Tasks, reminders and personal settings had no owner in the old single-user database.
    // They go to the account that owned this database file (users.database_name), else to an admin.
    const ownerName = (args.owner || path.basename(args.data, path.extname(args.data))).toLowerCase();
    let ownerId = null;
    const users = snapshot.tables.users;
    if (users) {
      const col = (name) => users.columns.indexOf(name);
      const match = users.rows.find((r) => String(r[col('database_name')] || '').toLowerCase() === ownerName)
        || users.rows.find((r) => String(r[col('username')] || '').toLowerCase() === ownerName)
        || users.rows.find((r) => r[col('role')] === 'Admin');
      ownerId = match ? Number(match[col('id')]) : null;
    } else {
      const row = await db.get(
        "SELECT id FROM users WHERE LOWER(username) = ? OR role = 'Admin' ORDER BY (LOWER(username) = ?) DESC, id LIMIT 1",
        [ownerName, ownerName]
      );
      ownerId = row ? row.id : null;
    }

    const counts = await restoreSnapshot(db, snapshot, {
      includeAccounts: Boolean(users),
      fallbackUserId: ownerId,
      personalUserId: ownerId
    });

    console.log('\nImport finished:');
    for (const [table, count] of Object.entries(counts)) {
      console.log(`  ${table.padEnd(18)} ${String(count).padStart(7)} rows`);
    }
    if (users) {
      console.log('\nUsers can now sign in with the same usernames and passwords as before.');
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(`\nImport failed: ${err.message}`);
  if (err.detail) console.error(err.detail);
  process.exit(1);
});
