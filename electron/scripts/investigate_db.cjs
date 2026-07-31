// Phase 20.5.4 — Runtime Database Investigation Script
// Run with: node electron/scripts/investigate_db.cjs (via Electron context)

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Determine the actual db path
let appDataDir;
try {
  const { app } = require('electron');
  appDataDir = app.getPath('userData');
} catch (e) {
  // Fallback for direct node invocation
  appDataDir = path.join(process.env.APPDATA || '', 'Himmel Pharmaceutical');
}

const dbPath = path.join(appDataDir, 'database', 'admin.db');
console.log('\n=== STEP 1: DATABASE PATH ===');
console.log('DB Path:', dbPath);
console.log('Exists:', fs.existsSync(dbPath));

if (!fs.existsSync(dbPath)) {
  console.log('ERROR: Database file not found!');
  process.exit(1);
}

const db = new Database(dbPath, { readonly: true });

console.log('\n=== STEP 2: LIVE TABLE SCHEMAS ===');
const tables = ['areas', 'doctors', 'institutions', 'team_members', 'groups', 'products'];
const schemaResults = {};

for (const t of tables) {
  try {
    const cols = db.prepare(`PRAGMA table_info(${t})`).all();
    schemaResults[t] = cols;
    console.log(`\n--- ${t} ---`);
    cols.forEach(c => {
      const notNull = c.notnull ? 'NOT NULL' : 'nullable';
      console.log(`  [${c.cid}] ${c.name} ${c.type} ${notNull} default=${c.dflt_value}`);
    });
  } catch (e) {
    console.log(`ERROR on ${t}:`, e.message);
  }
}

console.log('\n=== STEP 3: LEGACY COLUMN CHECK ===');
const legacyCols = {
  areas: ['code', 'area_code'],
  doctors: ['doctor_code', 'mobile_number', 'email', 'address', 'phone'],
  institutions: ['address', 'contact_person', 'contact_number'],
  team_members: ['employee_id', 'joining_date', 'email', 'phone', 'address'],
  groups: ['code', 'group_code'],
};

let foundLegacy = false;
for (const [table, cols] of Object.entries(legacyCols)) {
  const actual = (schemaResults[table] || []).map(c => c.name);
  const found = cols.filter(c => actual.includes(c));
  if (found.length > 0) {
    foundLegacy = true;
    console.log(`  LEGACY COLUMNS FOUND in '${table}': ${found.join(', ')}`);
    found.forEach(col => {
      const info = schemaResults[table].find(c => c.name === col);
      if (info) {
        console.log(`    -> ${col}: notnull=${info.notnull}, dflt=${info.dflt_value}`);
      }
    });
  } else {
    console.log(`  OK: '${table}' has no legacy columns.`);
  }
}

if (!foundLegacy) {
  console.log('\n  ALL CLEAR: No legacy columns found in any table.');
}

console.log('\n=== STEP 5: ROW COUNTS ===');
for (const t of tables) {
  try {
    const count = db.prepare(`SELECT COUNT(*) as cnt FROM ${t}`).get();
    console.log(`  ${t}: ${count.cnt} rows`);
  } catch (e) {
    console.log(`  ${t}: ERROR - ${e.message}`);
  }
}

db.close();
console.log('\n=== INVESTIGATION COMPLETE ===\n');
