const config = require('../config');
const logger = require('../logger');
const { PERSONAL_KEYS } = require('../repositories/SettingsRepository');

// Business tables in foreign-key order (parents first). This is what each user's old
// database/<username>.db contained, and what in-app backups/restores cover.
const BUSINESS_TABLES = [
  'unit_types', 'divisions', 'groups', 'areas', 'team_members', 'doctors', 'institutions',
  'business_years', 'products', 'product_targets', 'orders', 'order_items',
  'settings', 'audit_logs', 'tasks', 'reminders'
];

// Login accounts (the old users.db). Only the one-time import script restores these.
const ACCOUNT_TABLES = ['users', 'system_security'];

const REQUIRED_TABLES = ['products', 'orders', 'order_items', 'areas', 'team_members'];

const SNAPSHOT_FORMAT = 'himmel-cloud-backup';
const LEGACY_FORMAT = 'himmel-sqlite-export';
const SNAPSHOT_VERSION = 1;

const MAX_PARAMS_PER_INSERT = 30000;

const quoteIdent = (name) => `"${String(name).replace(/"/g, '""')}"`;

async function getWritableColumns(db, table) {
  const rows = await db.all(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = ? AND is_generated = 'NEVER'
    ORDER BY ordinal_position
  `, [table]);
  return rows.map((r) => ({ name: r.column_name, type: r.data_type }));
}

/**
 * Full copy of the shared database as JSON: { format, tables: { name: { columns, rows } } }.
 * Generated columns are left out; they are recomputed on restore.
 */
async function exportSnapshot(db, { createdBy = 'System', includeAccounts = false } = {}) {
  const tables = includeAccounts ? [...ACCOUNT_TABLES, ...BUSINESS_TABLES] : BUSINESS_TABLES;

  return db.transaction(async (tx) => {
    // One consistent point-in-time view across all tables.
    await tx.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY');

    const snapshot = {
      format: SNAPSHOT_FORMAT,
      formatVersion: SNAPSHOT_VERSION,
      appVersion: config.version,
      createdAt: new Date().toISOString(),
      createdBy,
      tables: {}
    };

    for (const table of tables) {
      const columns = (await getWritableColumns(tx, table)).map((c) => c.name);
      const orderBy = columns.includes('id') ? 'id' : columns[0];
      const result = await tx.query(
        `SELECT ${columns.map(quoteIdent).join(', ')} FROM ${quoteIdent(table)} ORDER BY ${quoteIdent(orderBy)}`
      );
      snapshot.tables[table] = {
        columns,
        rows: result.rows.map((row) => columns.map((c) => row[c]))
      };
    }
    return snapshot;
  });
}

function describeSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || !snapshot.tables || typeof snapshot.tables !== 'object') {
    throw new Error('Invalid Backup File: the file does not contain Himmel backup data.');
  }
  if (![SNAPSHOT_FORMAT, LEGACY_FORMAT].includes(snapshot.format)) {
    throw new Error('Invalid Backup File: unknown backup format.');
  }
  for (const table of REQUIRED_TABLES) {
    if (!snapshot.tables[table]) {
      throw new Error(`Invalid Backup File: Missing table '${table}' in backup file schema.`);
    }
  }
  for (const [name, data] of Object.entries(snapshot.tables)) {
    if (!data || !Array.isArray(data.columns) || !Array.isArray(data.rows)) {
      throw new Error(`Invalid Backup File: table '${name}' is malformed.`);
    }
  }
}

function coerceValue(value, column, table) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'object' && !(value instanceof Date)) {
    if (value.type === 'Buffer' && Array.isArray(value.data)) return Buffer.from(value.data).toString('utf8');
    return JSON.stringify(value);
  }

  switch (column.type) {
    case 'integer':
    case 'smallint':
    case 'bigint': {
      if (typeof value === 'boolean') return value ? 1 : 0;
      const text = String(value).trim();
      if (text === '') return null;
      const n = Number(text);
      if (!Number.isInteger(n)) {
        throw new Error(`Cannot import value "${text}" into ${table}.${column.name} (whole number expected).`);
      }
      return n;
    }
    case 'double precision':
    case 'real':
    case 'numeric': {
      const text = String(value).trim();
      if (text === '') return null;
      const n = Number(text);
      if (!Number.isFinite(n)) {
        throw new Error(`Cannot import value "${text}" into ${table}.${column.name} (number expected).`);
      }
      return n;
    }
    default:
      return typeof value === 'string' ? value : String(value);
  }
}

async function insertRows(tx, table, columns, rows) {
  if (rows.length === 0) return;
  const columnList = columns.map((c) => quoteIdent(c.name)).join(', ');
  const rowsPerStatement = Math.max(1, Math.floor(MAX_PARAMS_PER_INSERT / columns.length));

  for (let start = 0; start < rows.length; start += rowsPerStatement) {
    const chunk = rows.slice(start, start + rowsPerStatement);
    const params = [];
    const tuples = chunk.map((row) => {
      const placeholders = row.map((value) => {
        params.push(value);
        return `$${params.length}`;
      });
      return `(${placeholders.join(', ')})`;
    });
    await tx.query(`INSERT INTO ${quoteIdent(table)} (${columnList}) VALUES ${tuples.join(', ')}`, params);
  }
}

/**
 * Replaces the shared database content with a snapshot (one transaction: all or nothing).
 *
 * options.includeAccounts  restore users + system_security from the snapshot as well (import script)
 * options.fallbackUserId   owner for tasks/reminders whose user does not exist (or old data without owners)
 * options.personalUserId   user who receives personal settings stored without a user prefix (old data)
 */
async function restoreSnapshot(db, snapshot, options = {}) {
  describeSnapshot(snapshot);
  const includeAccounts = Boolean(options.includeAccounts);

  const tables = [
    ...(includeAccounts ? ACCOUNT_TABLES.filter((t) => snapshot.tables[t]) : []),
    ...BUSINESS_TABLES
  ];
  const counts = {};

  await db.transaction(async (tx) => {
    // TRUNCATE also covers tables that are absent from the snapshot (they end up empty).
    await tx.query(`TRUNCATE ${tables.map(quoteIdent).join(', ')} RESTART IDENTITY CASCADE`);

    // Keep the stored values exactly as they are (no updated_at stamping, no total recalculation).
    for (const table of tables) {
      await tx.query(`ALTER TABLE ${quoteIdent(table)} DISABLE TRIGGER USER`);
    }

    for (const table of tables) {
      const data = snapshot.tables[table];
      if (!data) {
        counts[table] = 0;
        continue;
      }

      const targetColumns = await getWritableColumns(tx, table);
      const sourceIndex = new Map(data.columns.map((name, i) => [name, i]));
      const columns = targetColumns.filter((c) => sourceIndex.has(c.name));

      // Tasks/reminders belong to a user; old single-user data has no owner column at all.
      const hasUserColumn = targetColumns.some((c) => c.name === 'user_id');
      let userIds = null;
      if (hasUserColumn) {
        if (!columns.some((c) => c.name === 'user_id')) {
          columns.push(targetColumns.find((c) => c.name === 'user_id'));
        }
        userIds = new Set((await tx.all('SELECT id FROM users')).map((r) => r.id));
      }

      const existingSettingKeys = table === 'settings'
        ? new Set(data.rows.map((row) => row[sourceIndex.get('key')]))
        : null;

      const rows = data.rows.map((sourceRow) => {
        const row = columns.map((column) => {
          const idx = sourceIndex.get(column.name);
          return coerceValue(idx === undefined ? null : sourceRow[idx], column, table);
        });

        if (hasUserColumn) {
          const userIdx = columns.findIndex((c) => c.name === 'user_id');
          if (row[userIdx] === null || !userIds.has(row[userIdx])) {
            row[userIdx] = options.fallbackUserId || null;
          }
        }

        if (table === 'settings' && options.personalUserId) {
          const keyIdx = columns.findIndex((c) => c.name === 'key');
          const key = row[keyIdx];
          const scoped = `user:${options.personalUserId}:${key}`;
          if (PERSONAL_KEYS.has(key) && !existingSettingKeys.has(scoped)) {
            row[keyIdx] = scoped;
          }
        }
        return row;
      });

      await insertRows(tx, table, columns, rows);
      counts[table] = rows.length;
    }

    for (const table of tables) {
      await tx.query(`ALTER TABLE ${quoteIdent(table)} ENABLE TRIGGER USER`);
      const hasId = (await getWritableColumns(tx, table)).some((c) => c.name === 'id');
      if (hasId) {
        await tx.query(`
          SELECT setval(
            pg_get_serial_sequence('${table}', 'id'),
            GREATEST(COALESCE((SELECT MAX(id) FROM ${quoteIdent(table)}), 0), 1),
            (SELECT MAX(id) FROM ${quoteIdent(table)}) IS NOT NULL
          )
        `);
      }
    }

    await tx.run(
      `INSERT INTO settings (key, value, group_name) VALUES ('db_version', ?, 'system')
       ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
      [config.version]
    );
  });

  logger.info(`Snapshot restored: ${Object.entries(counts).map(([t, n]) => `${t}=${n}`).join(', ')}`);
  return counts;
}

module.exports = {
  exportSnapshot,
  restoreSnapshot,
  describeSnapshot,
  BUSINESS_TABLES,
  ACCOUNT_TABLES,
  SNAPSHOT_FORMAT,
  LEGACY_FORMAT
};
