const { Pool, types } = require('pg');
const config = require('../config');
const logger = require('../logger');

// SQLite returned COUNT()/SUM() results and decimals as JS numbers. pg returns int8 and numeric
// as strings by default, so parse them to keep every repository's output identical.
types.setTypeParser(20, (value) => (value === null ? null : Number(value)));   // int8 / bigint
types.setTypeParser(1700, (value) => (value === null ? null : Number(value))); // numeric
types.setTypeParser(1082, (value) => value);                                     // date -> 'YYYY-MM-DD' text

const placeholderCache = new Map();

/**
 * The repositories keep SQLite-style "?" placeholders. Convert them to $1, $2… while skipping
 * string literals, quoted identifiers, comments and dollar-quoted blocks.
 * (Do not use the jsonb "?" operators in queries that go through this helper.)
 */
function toPgPlaceholders(sql) {
  const cached = placeholderCache.get(sql);
  if (cached !== undefined) return cached;

  let out = '';
  let index = 0;
  let i = 0;
  const len = sql.length;

  while (i < len) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (ch === "'") {
      let j = i + 1;
      while (j < len) {
        if (sql[j] === "'") {
          if (sql[j + 1] === "'") { j += 2; continue; }
          break;
        }
        j++;
      }
      out += sql.slice(i, j + 1);
      i = j + 1;
      continue;
    }

    if (ch === '"') {
      let j = sql.indexOf('"', i + 1);
      if (j === -1) j = len - 1;
      out += sql.slice(i, j + 1);
      i = j + 1;
      continue;
    }

    if (ch === '-' && next === '-') {
      let j = sql.indexOf('\n', i);
      if (j === -1) j = len;
      out += sql.slice(i, j);
      i = j;
      continue;
    }

    if (ch === '/' && next === '*') {
      let j = sql.indexOf('*/', i + 2);
      j = j === -1 ? len : j + 2;
      out += sql.slice(i, j);
      i = j;
      continue;
    }

    if (ch === '$') {
      const match = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i));
      if (match) {
        const tag = match[0];
        const end = sql.indexOf(tag, i + tag.length);
        const j = end === -1 ? len : end + tag.length;
        out += sql.slice(i, j);
        i = j;
        continue;
      }
    }

    if (ch === '?') {
      index += 1;
      out += `$${index}`;
      i++;
      continue;
    }

    out += ch;
    i++;
  }

  // Only cache the normal, short queries (bulk INSERTs during a restore are huge and one-off).
  if (sql.length <= 4096 && placeholderCache.size < 2000) placeholderCache.set(sql, out);
  return out;
}

function normalizeParam(value) {
  if (value === undefined) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  return value;
}

/**
 * Small query API used by every repository:
 *   all(sql, params)  -> rows
 *   get(sql, params)  -> first row or null
 *   run(sql, params)  -> { changes, rows }
 *   transaction(fn)   -> runs fn(txDb) inside BEGIN/COMMIT on one connection
 */
function createDb(executor, pool, inTransaction = false) {
  const db = {
    inTransaction,

    async query(sql, params = []) {
      return executor.query(toPgPlaceholders(sql), params.map(normalizeParam));
    },

    async all(sql, params = []) {
      const result = await db.query(sql, params);
      return result.rows;
    },

    async get(sql, params = []) {
      const result = await db.query(sql, params);
      return result.rows[0] || null;
    },

    async run(sql, params = []) {
      const result = await db.query(sql, params);
      return { changes: result.rowCount || 0, rows: result.rows };
    },

    // Multi-statement SQL without parameters (schema files).
    async exec(sql) {
      return executor.query(sql);
    },

    async transaction(fn) {
      if (inTransaction) return fn(db);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn(createDb(client, pool, true));
        await client.query('COMMIT');
        return result;
      } catch (err) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackErr) {
          logger.error('Transaction rollback failed', rollbackErr);
        }
        throw err;
      } finally {
        client.release();
      }
    }
  };
  return db;
}

function createPool(options = {}) {
  config.assertDatabaseConfigured();
  const pool = new Pool({
    connectionString: options.connectionString || config.databaseUrl,
    ssl: options.ssl !== undefined ? options.ssl : config.databaseSsl,
    max: options.max || config.databasePoolMax,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000
  });
  pool.on('error', (err) => logger.error('Unexpected error on idle database connection', err));
  return pool;
}

let defaultPool = null;
let defaultDb = null;

function getDb() {
  if (!defaultDb) {
    defaultPool = createPool();
    defaultDb = createDb(defaultPool, defaultPool);
  }
  return defaultDb;
}

async function closeDb() {
  if (defaultPool) {
    const pool = defaultPool;
    defaultPool = null;
    defaultDb = null;
    await pool.end();
  }
}

module.exports = {
  getDb,
  closeDb,
  createPool,
  createDb,
  toPgPlaceholders
};
