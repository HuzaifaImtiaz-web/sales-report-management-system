// The sign-in / recovery attempt counters live in the database so every server instance shares them.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { PGlite } = require('@electric-sql/pglite');
const { PGLiteSocketServer } = require('@electric-sql/pglite-socket');

let pglite;
let socketServer;
let pool;
let db;
let rateLimiter;

before(async () => {
  pglite = await PGlite.create();
  socketServer = new PGLiteSocketServer({ db: pglite, port: 0, host: '127.0.0.1', maxConnections: 5 });
  await socketServer.start();
  process.env.HIMMEL_SKIP_ENV_FILE = '1';
  process.env.DATABASE_URL = `postgres://postgres:postgres@127.0.0.1:${socketServer.server.address().port}/postgres`;

  const { createPool, createDb } = require('../src/db');
  const { applySchema } = require('../src/db/migrate');
  pool = createPool({ max: 2 });
  db = createDb(pool, pool);
  await applySchema(db);
  rateLimiter = require('../src/auth/rateLimiter');
});

after(async () => {
  if (pool) await pool.end();
  if (socketServer) await socketServer.stop();
  if (pglite) await pglite.close();
});

test('blocks after the limit is reached and only counts recorded hits', async () => {
  const opts = { max: 3, windowMs: 60000 };
  for (let i = 0; i < 3; i++) {
    await rateLimiter.check(db, 'login:1.2.3.4', opts); // successful sign-ins never call hit()
  }
  for (let i = 0; i < 3; i++) {
    await rateLimiter.check(db, 'login:1.2.3.4', opts);
    await rateLimiter.hit(db, 'login:1.2.3.4', opts);
  }
  await assert.rejects(rateLimiter.check(db, 'login:1.2.3.4', opts), /Too many attempts/);
  await rateLimiter.check(db, 'login:5.6.7.8', opts); // other addresses are not affected
});

test('consume counts every attempt and rejects the one over the limit', async () => {
  const opts = { max: 2, windowMs: 60000 };
  await rateLimiter.consume(db, 'recovery:9.9.9.9', opts);
  await rateLimiter.consume(db, 'recovery:9.9.9.9', opts);
  await assert.rejects(rateLimiter.consume(db, 'recovery:9.9.9.9', opts), (err) => err.status === 429);
});

test('the window resets', async () => {
  const opts = { max: 1, windowMs: 1000 };
  await rateLimiter.hit(db, 'k', opts);
  await assert.rejects(rateLimiter.check(db, 'k', opts));
  await new Promise((r) => setTimeout(r, 1200));
  await rateLimiter.check(db, 'k', opts);
});

test('concurrent attempts are all counted', async () => {
  const opts = { max: 1000, windowMs: 60000 };
  await Promise.all(Array.from({ length: 20 }, () => rateLimiter.hit(db, 'burst', opts)));
  const row = await db.get("SELECT count FROM rate_limits WHERE key = 'burst'");
  assert.equal(row.count, 20);
});
