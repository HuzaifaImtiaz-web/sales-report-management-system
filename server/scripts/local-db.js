// Local PostgreSQL for development, with no installation needed: runs PGlite (PostgreSQL compiled
// to WebAssembly) and exposes it on a normal Postgres port. Data is kept in server/.local-db/.
//
//   npm run local-db            -> postgres://postgres:postgres@127.0.0.1:5433/postgres
//   npm run local-db -- --memory  (throw-away database)
//
// For development only. Production must use a real hosted PostgreSQL database.

const path = require('path');
const { PGlite } = require('@electric-sql/pglite');
const { PGLiteSocketServer } = require('@electric-sql/pglite-socket');

const port = Number(process.env.LOCAL_DB_PORT) || 5433;
const inMemory = process.argv.includes('--memory');
const dataDir = path.join(__dirname, '..', '.local-db');

(async () => {
  const db = inMemory ? await PGlite.create() : await PGlite.create(dataDir);
  const server = new PGLiteSocketServer({ db, port, host: '127.0.0.1', maxConnections: 20 });
  await server.start();

  console.log(`Local PostgreSQL (PGlite) is running${inMemory ? ' in memory' : ` with data in ${dataDir}`}.`);
  console.log(`DATABASE_URL=postgres://postgres:postgres@127.0.0.1:${port}/postgres`);
  console.log('Press Ctrl+C to stop.');

  const stop = async () => {
    await server.stop();
    await db.close();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
})().catch((err) => {
  console.error('Could not start the local database:', err);
  process.exit(1);
});
