/**
 * Phase 20.5.4 — Standalone DB Investigation Script
 * Runs directly with electron (it sets app name/path same as main.cjs)
 */
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

// Mirror main.cjs setup exactly
app.setName('Himmel Pharmaceutical');
const userDataPath = path.join(app.getPath('appData'), 'Himmel Pharmaceutical');
app.setPath('userData', userDataPath);

app.whenReady().then(() => {
  const Database = require('better-sqlite3');
  const dbPath = path.join(userDataPath, 'database', 'admin.db');

  const OUT = [];
  const log = (...args) => { const line = args.join(' '); console.log(line); OUT.push(line); };

  log('\n============================================================');
  log('PHASE 20.5.4 — RUNTIME DATABASE INVESTIGATION');
  log('============================================================');

  // STEP 1: Database Path
  log('\n=== STEP 1: DATABASE PATH ===');
  log('Path:', dbPath);
  log('Exists:', fs.existsSync(dbPath));

  if (!fs.existsSync(dbPath)) {
    log('FATAL: Database file does not exist. App was never run or path changed.');
    app.quit();
    return;
  }

  const db = new Database(dbPath, { readonly: true });

  // STEP 2: Table Schemas
  log('\n=== STEP 2: LIVE TABLE SCHEMAS ===');
  const tables = ['areas', 'doctors', 'institutions', 'team_members', 'groups', 'products'];
  const schemas = {};

  for (const t of tables) {
    try {
      const cols = db.prepare(`PRAGMA table_info(${t})`).all();
      schemas[t] = cols;
      log(`\n--- ${t} (${cols.length} columns) ---`);
      cols.forEach(c => {
        const nn = c.notnull === 1 ? 'NOT NULL' : 'nullable';
        const def = c.dflt_value !== null ? `DEFAULT ${c.dflt_value}` : '';
        log(`  [${c.cid}] ${c.name}  ${c.type}  ${nn}  ${def}`);
      });
    } catch (e) {
      log(`ERROR reading ${t}:`, e.message);
      schemas[t] = [];
    }
  }

  // STEP 3: Legacy Column Detection
  log('\n=== STEP 3: LEGACY COLUMN DETECTION ===');
  const legacyMap = {
    areas:        ['code', 'area_code'],
    doctors:      ['doctor_code', 'mobile_number', 'email', 'address', 'phone'],
    institutions: ['address', 'contact_person', 'contact_number'],
    team_members: ['employee_id', 'joining_date', 'email', 'phone', 'address'],
    groups:       ['code', 'group_code'],
  };

  let allClean = true;
  for (const [table, legacyCols] of Object.entries(legacyMap)) {
    const actualCols = (schemas[table] || []).map(c => c.name);
    const found = legacyCols.filter(lc => actualCols.includes(lc));
    if (found.length > 0) {
      allClean = false;
      log(`  !! LEGACY COLUMNS PRESENT in '${table}': [${found.join(', ')}]`);
      found.forEach(fc => {
        const info = (schemas[table] || []).find(c => c.name === fc);
        if (info) {
          log(`       ${fc}: type=${info.type} notnull=${info.notnull} default=${info.dflt_value}`);
        }
      });
    } else {
      log(`  OK  '${table}': no legacy columns`);
    }
  }

  if (allClean) {
    log('\n  ALL TABLES CLEAN — migration ran successfully.');
  } else {
    log('\n  MIGRATION DID NOT COMPLETE — legacy columns still present!');
  }

  // STEP 5: Row Counts
  log('\n=== STEP 5: ROW COUNTS ===');
  for (const t of tables) {
    try {
      const r = db.prepare(`SELECT COUNT(*) as cnt FROM ${t}`).get();
      log(`  ${t}: ${r.cnt} rows`);
    } catch (e) {
      log(`  ${t}: ERROR - ${e.message}`);
    }
  }

  db.close();

  // Write report
  const reportPath = path.join('d:\\Sales-record-System', 'PHASE20_5_4_INVESTIGATION_RAW.txt');
  fs.writeFileSync(reportPath, OUT.join('\n'), 'utf8');
  log('\nRaw report written to:', reportPath);
  log('\n=== INVESTIGATION COMPLETE ===\n');

  app.quit();
});
