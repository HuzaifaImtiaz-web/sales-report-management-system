const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const config = require('../config');
const logger = require('../logger');
const { assertStrongPassword } = require('../auth/passwordPolicy');

const UNIT_TYPES = [
  'Tablet', 'Capsule', 'Vial', 'Ampoule', 'Injection',
  'Syrup Bottle', 'Sachet', 'Tube', 'Cream', 'Bottle',
  'Strip', 'Pack', 'Box'
];

const GROUPS = [
  { division: 'Cardiology', name: 'Cardiovascular', description: 'Cardiovascular medications' },
  { division: 'Cardiology', name: 'Anti-hypertensive', description: 'Blood pressure control' },
  { division: 'Cardiology', name: 'Anti-arrhythmic', description: 'Heart rhythm control' },
  { division: 'Cardiology', name: 'Heart Failure', description: 'Heart failure management' },
  { division: 'Cardiology', name: 'General', description: 'General cardiology' },
  { division: 'Oncology', name: 'Chemotherapy', description: 'Chemotherapy agents' },
  { division: 'Oncology', name: 'Targeted Therapy', description: 'Targeted cancer therapy' },
  { division: 'Oncology', name: 'Immunotherapy', description: 'Cancer immunotherapy' },
  { division: 'Oncology', name: 'Supportive Care', description: 'Oncology supportive care' }
];

// Defaults from the desktop app's seed data (machine-specific folders left out).
const SETTINGS = {
  company_name: 'Himmel Pharmaceutical',
  app_name: 'Himmel Sales Management',
  currency: 'PKR',
  fiscal_year_start: 'July 1',
  fiscal_year_end: 'June 30',
  theme: 'Dark',
  backup_enabled: 'true',
  business_year: '2025-2026',
  date_format: 'YYYY-MM-DD',
  auto_logout_minutes: '30',
  maintenance_mode: 'false',
  recovery_mode: 'false'
};

/**
 * Reference data for a brand-new database. Runs only while unit_types is empty, so it never
 * re-creates rows an administrator deleted and never touches imported data.
 */
async function seedReferenceData(db) {
  const existing = await db.get('SELECT COUNT(*) AS count FROM unit_types');
  if (existing.count > 0) return false;

  logger.info('Seeding reference data (unit types, divisions, groups, settings, business year)...');
  await db.transaction(async (tx) => {
    for (const name of UNIT_TYPES) {
      await tx.run('INSERT INTO unit_types (name) VALUES (?) ON CONFLICT (name) DO NOTHING', [name]);
    }

    for (const name of ['Cardiology', 'Oncology']) {
      await tx.run('INSERT INTO divisions (name) VALUES (?) ON CONFLICT (name) DO NOTHING', [name]);
    }

    const groupCount = await tx.get('SELECT COUNT(*) AS count FROM groups');
    if (groupCount.count === 0) {
      for (const g of GROUPS) {
        const division = await tx.get('SELECT id FROM divisions WHERE name = ?', [g.division]);
        await tx.run(
          'INSERT INTO groups (division_id, name, description, is_active) VALUES (?, ?, ?, 1)',
          [division.id, g.name, g.description]
        );
      }
    }

    for (const [key, value] of Object.entries(SETTINGS)) {
      await tx.run(
        "INSERT INTO settings (key, value, group_name) VALUES (?, ?, 'general') ON CONFLICT (key) DO NOTHING",
        [key, value]
      );
    }

    const years = await tx.get('SELECT COUNT(*) AS count FROM business_years');
    if (years.count === 0) {
      await tx.run(
        'INSERT INTO business_years (year_name, start_date, end_date, is_active) VALUES (?, ?, ?, 1)',
        ['2026-2027', '2026-07-01', '2027-06-30']
      );
    }
  });
  return true;
}

/**
 * Creates the first administrator when there are no users at all.
 * The password comes from ADMIN_PASSWORD. Outside production a random one is generated and
 * printed once when it is missing; in production it is required (server logs are often shared).
 */
async function ensureAdministrator(db) {
  const users = await db.get('SELECT COUNT(*) AS count FROM users');
  if (users.count > 0) return null;

  let password = config.adminPassword;
  let generated = false;
  if (!password) {
    if (config.isProduction) {
      throw new Error('ADMIN_PASSWORD must be set to create the first administrator account.');
    }
    password = `${crypto.randomBytes(12).toString('base64url')}aA1!`;
    generated = true;
  }
  assertStrongPassword(password, { label: 'ADMIN_PASSWORD', username: config.adminUsername });

  const passwordHash = await bcrypt.hash(password, 12);
  await db.run(
    `INSERT INTO users (username, password_hash, full_name, role, is_active)
     VALUES (?, ?, ?, 'Admin', 1)`,
    [config.adminUsername, passwordHash, config.adminFullName]
  );

  logger.info(`Created the first administrator account '${config.adminUsername}'.`);
  if (generated) {
    // Printed once so the person deploying the server can sign in; change it after the first login.
    console.log('\n============================================================');
    console.log(' First administrator account created');
    console.log(`   Username: ${config.adminUsername}`);
    console.log(`   Password: ${password}`);
    console.log(' Sign in and change this password. It will not be shown again.');
    console.log('============================================================\n');
  }
  return { username: config.adminUsername, generated };
}

module.exports = { seedReferenceData, ensureAdministrator };
