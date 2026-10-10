const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('../logger');
const { seedReferenceData, ensureAdministrator } = require('./seed');

// Arbitrary constant: makes concurrent server instances apply the schema one at a time.
const MIGRATION_LOCK_ID = 724391;

async function applySchema(db) {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await db.transaction(async (tx) => {
    await tx.query('SELECT pg_advisory_xact_lock(?)', [MIGRATION_LOCK_ID]);
    await tx.exec(sql);
    await tx.run(
      `INSERT INTO settings (key, value, group_name) VALUES ('db_version', ?, 'system')
       ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
      [config.version]
    );
  });
}

async function migrate(db) {
  logger.info('Applying database schema...');
  await applySchema(db);
  await seedReferenceData(db);
  await ensureAdministrator(db);
  logger.info('Database schema is up to date.');
}

module.exports = { migrate, applySchema };

if (require.main === module) {
  const { getDb, closeDb } = require('./index');
  migrate(getDb())
    .then(() => closeDb())
    .catch(async (err) => {
      logger.error('Migration failed', err);
      await closeDb();
      process.exit(1);
    });
}
