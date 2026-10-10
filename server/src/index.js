const config = require('./config');
const logger = require('./logger');
const { getDb, closeDb } = require('./db');
const { migrate } = require('./db/migrate');
const { createApp } = require('./app');

async function start({ port = config.port, host = config.host } = {}) {
  const db = getDb();
  await migrate(db);

  const app = createApp({ db });
  const server = await new Promise((resolve, reject) => {
    const s = app.listen(port, host, () => resolve(s));
    s.on('error', reject);
  });
  const address = server.address();
  logger.info(`Himmel Sales API v${config.version} listening on ${address.address}:${address.port}`);
  return { server, db };
}

if (require.main === module) {
  start()
    .then(({ server }) => {
      const shutdown = (signal) => {
        logger.info(`${signal} received, shutting down...`);
        server.close(() => {
          closeDb().finally(() => process.exit(0));
        });
        setTimeout(() => process.exit(1), 10000).unref();
      };
      process.on('SIGTERM', () => shutdown('SIGTERM'));
      process.on('SIGINT', () => shutdown('SIGINT'));
    })
    .catch(async (err) => {
      logger.error('Server failed to start', err);
      await closeDb();
      process.exit(1);
    });
}

module.exports = { start };
