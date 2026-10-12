// Local development: PostgreSQL (PGlite, data kept in server/.local-db/) plus the API on
// http://127.0.0.1:4000, in one process. It ignores server/.env on purpose, so development never
// touches the real (cloud) database. `npm run dev` in the project folder starts this and Vite.
//
//   Sign in as admin / Local#Dev2026!  (override with LOCAL_ADMIN_PASSWORD; development data only)

const path = require('path');
const { PGlite } = require('@electric-sql/pglite');
const { PGLiteSocketServer } = require('@electric-sql/pglite-socket');

const DB_PORT = Number(process.env.LOCAL_DB_PORT) || 5433;
const API_PORT = Number(process.env.PORT) || 4000;
const ADMIN_PASSWORD = process.env.LOCAL_ADMIN_PASSWORD || 'Local#Dev2026!';

process.env.HIMMEL_SKIP_ENV_FILE = '1';
process.env.NODE_ENV = 'development';
process.env.DATABASE_URL = `postgres://postgres:postgres@127.0.0.1:${DB_PORT}/postgres`;
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
process.env.SERVE_STATIC = 'false';
process.env.TRUST_PROXY = '0';

(async () => {
  const dataDir = path.join(__dirname, '..', '.local-db');
  const pglite = await PGlite.create(dataDir);
  const dbServer = new PGLiteSocketServer({ db: pglite, port: DB_PORT, host: '127.0.0.1', maxConnections: 20 });
  await dbServer.start();

  const { start } = require('../src/index');
  const { closeDb } = require('../src/db');
  const { server } = await start({ port: API_PORT, host: '127.0.0.1' });

  console.log(`\nLocal API: http://127.0.0.1:${API_PORT}  (database: ${dataDir})`);
  console.log(`Sign in as admin / ${ADMIN_PASSWORD} (development data only).\n`);

  const stop = async () => {
    server.close();
    await closeDb().catch(() => {});
    await dbServer.stop().catch(() => {});
    await pglite.close().catch(() => {});
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
})().catch((err) => {
  console.error('Could not start local development:', err);
  process.exit(1);
});
