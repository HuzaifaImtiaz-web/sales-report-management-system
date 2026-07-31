/**
 * Phase 20.5.4 — Direct DB Repair Script
 * Opens the live DB and applies all pending schema fixes immediately.
 * Run via Electron so better-sqlite3 native bindings match.
 */
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

app.setName('Himmel Pharmaceutical');
const userDataPath = path.join(app.getPath('appData'), 'Himmel Pharmaceutical');
app.setPath('userData', userDataPath);

app.whenReady().then(() => {
  const Database = require('better-sqlite3');
  const dbPath = path.join(userDataPath, 'database', 'admin.db');
  const log = (msg) => { console.log(msg); };

  log('\n============================================================');
  log('PHASE 20.5.4 — DIRECT DATABASE REPAIR');
  log('============================================================');
  log('DB Path: ' + dbPath);
  log('Exists: ' + fs.existsSync(dbPath));

  if (!fs.existsSync(dbPath)) {
    log('FATAL: Database not found!');
    app.quit(); return;
  }

  const db = new Database(dbPath); // READ-WRITE

  try {
    db.pragma('foreign_keys = OFF');
    db.pragma('journal_mode = WAL');

    // Drop all views that reference affected tables
    db.exec("DROP VIEW IF EXISTS view_sales_summary;");
    db.exec("DROP VIEW IF EXISTS view_team_member_targets;");
    db.exec("DROP VIEW IF EXISTS view_target_achievements;");
    db.exec("DROP VIEW IF EXISTS view_team_performance;");
    db.exec("DROP VIEW IF EXISTS view_monthly_sales;");
    log('Views dropped.');

    // ── FIX 1: AREAS — Remove areas.code NOT NULL ──────────────────────────
    const areaCols = db.prepare("PRAGMA table_info(areas)").all();
    const areaColNames = areaCols.map(c => c.name);
    if (areaColNames.includes('code') || areaColNames.includes('area_code')) {
      log('Fixing areas table (code column present)...');
      db.exec("DROP TABLE IF EXISTS areas_temp;");
      db.exec("ALTER TABLE areas RENAME TO areas_temp;");
      db.exec(`
        CREATE TABLE areas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          city TEXT,
          region TEXT,
          description TEXT,
          is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      db.exec("CREATE INDEX IF NOT EXISTS idx_areas_active ON areas(is_active);");
      const tCols = db.prepare("PRAGMA table_info(areas_temp)").all().map(c => c.name);
      const cityE   = tCols.includes('city')        ? 'city'        : 'NULL';
      const regionE = tCols.includes('region')      ? 'region'      : 'NULL';
      const descE   = tCols.includes('description') ? 'description' : 'NULL';
      db.transaction(() => {
        db.prepare(`
          INSERT INTO areas (id, name, city, region, description, is_active, created_at, updated_at)
          SELECT id, name, ${cityE}, ${regionE}, ${descE}, is_active, created_at, updated_at
          FROM areas_temp
        `).run();
      })();
      db.exec("DROP TABLE areas_temp;");
      log('FIXED: areas.code removed. areas table rebuilt.');
    } else {
      log('areas: already clean.');
    }

    // ── FIX 2: DOCTORS — Remove legacy cols + fix area_id NOT NULL ─────────
    const docInfo = db.prepare("PRAGMA table_info(doctors)").all();
    const docColNames = docInfo.map(c => c.name);
    const docAreaId = docInfo.find(c => c.name === 'area_id');
    const docNeedsRebuild = ['doctor_code','mobile_number','email','address','phone']
                              .some(lc => docColNames.includes(lc))
                            || (docAreaId && docAreaId.notnull === 1);
    if (docNeedsRebuild) {
      log('Fixing doctors table...');
      db.exec("DROP TABLE IF EXISTS doctors_temp;");
      db.exec("ALTER TABLE doctors RENAME TO doctors_temp;");
      db.exec(`
        CREATE TABLE doctors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          specialty TEXT,
          hospital TEXT,
          city TEXT,
          notes TEXT,
          area_id INTEGER,
          is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (area_id) REFERENCES areas (id) ON DELETE SET NULL
        );
      `);
      db.exec("CREATE INDEX IF NOT EXISTS idx_doctors_active ON doctors(is_active);");
      const tCols = db.prepare("PRAGMA table_info(doctors_temp)").all().map(c => c.name);
      const specE  = tCols.includes('specialty') ? 'specialty' : 'NULL';
      const hospE  = tCols.includes('hospital')  ? 'hospital'  : 'NULL';
      const cityE  = tCols.includes('city')      ? 'city'      : 'NULL';
      const notesE = tCols.includes('notes')     ? 'notes'     : 'NULL';
      const areaE  = tCols.includes('area_id')   ? 'area_id'   : 'NULL';
      db.transaction(() => {
        db.prepare(`
          INSERT INTO doctors (id, name, specialty, hospital, city, notes, area_id, is_active, created_at, updated_at)
          SELECT id, name, ${specE}, ${hospE}, ${cityE}, ${notesE}, ${areaE}, is_active, created_at, updated_at
          FROM doctors_temp
        `).run();
      })();
      db.exec("DROP TABLE doctors_temp;");
      log('FIXED: doctors table rebuilt (legacy columns removed, area_id now nullable).');
    } else {
      log('doctors: already clean.');
    }

    // ── FIX 3: INSTITUTIONS — Remove legacy cols + fix area_id NOT NULL ────
    const instInfo = db.prepare("PRAGMA table_info(institutions)").all();
    const instColNames = instInfo.map(c => c.name);
    const instAreaId = instInfo.find(c => c.name === 'area_id');
    const instNeedsRebuild = ['address','contact_person','contact_number']
                               .some(lc => instColNames.includes(lc))
                             || (instAreaId && instAreaId.notnull === 1);
    if (instNeedsRebuild) {
      log('Fixing institutions table...');
      db.exec("DROP TABLE IF EXISTS institutions_temp;");
      db.exec("ALTER TABLE institutions RENAME TO institutions_temp;");
      db.exec(`
        CREATE TABLE institutions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          code TEXT UNIQUE,
          type TEXT CHECK (type IN ('Hospital', 'Clinic', 'Pharmacy', 'Other')),
          city TEXT,
          notes TEXT,
          area_id INTEGER,
          is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (area_id) REFERENCES areas (id) ON DELETE SET NULL
        );
      `);
      db.exec("CREATE INDEX IF NOT EXISTS idx_institutions_active ON institutions(is_active);");
      const tCols = db.prepare("PRAGMA table_info(institutions_temp)").all().map(c => c.name);
      const codeE  = tCols.includes('code')    ? 'code'    : 'NULL';
      const typeE  = tCols.includes('type')    ? 'type'    : 'NULL';
      const cityE  = tCols.includes('city')    ? 'city'    : 'NULL';
      const notesE = tCols.includes('notes')   ? 'notes'   : 'NULL';
      const areaE  = tCols.includes('area_id') ? 'area_id' : 'NULL';
      db.transaction(() => {
        db.prepare(`
          INSERT INTO institutions (id, name, code, type, city, notes, area_id, is_active, created_at, updated_at)
          SELECT id, name, ${codeE}, ${typeE}, ${cityE}, ${notesE}, ${areaE}, is_active, created_at, updated_at
          FROM institutions_temp
        `).run();
      })();
      db.exec("DROP TABLE institutions_temp;");
      log('FIXED: institutions table rebuilt (legacy columns removed, area_id now nullable).');
    } else {
      log('institutions: already clean.');
    }

    // ── FIX 4: TEAM MEMBERS — Remove legacy cols ────────────────────────────
    const tmCols = db.prepare("PRAGMA table_info(team_members)").all().map(c => c.name);
    const tmNeedsRebuild = ['email','phone','employee_id','joining_date','address']
                             .some(lc => tmCols.includes(lc));
    if (tmNeedsRebuild) {
      log('Fixing team_members table...');
      db.exec("DROP TABLE IF EXISTS team_members_temp;");
      db.exec("ALTER TABLE team_members RENAME TO team_members_temp;");
      db.exec(`
        CREATE TABLE team_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'Sales Representative',
          area_id INTEGER,
          notes TEXT,
          is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (area_id) REFERENCES areas (id) ON DELETE SET NULL
        );
      `);
      db.exec("CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(is_active);");
      const tCols = db.prepare("PRAGMA table_info(team_members_temp)").all().map(c => c.name);
      const roleE  = tCols.includes('role')    ? "COALESCE(role, 'Sales Representative')" : "'Sales Representative'";
      const areaE  = tCols.includes('area_id') ? 'area_id' : 'NULL';
      const notesE = tCols.includes('notes')   ? 'notes'   : 'NULL';
      db.transaction(() => {
        db.prepare(`
          INSERT INTO team_members (id, name, role, area_id, notes, is_active, created_at, updated_at)
          SELECT id, name, ${roleE}, ${areaE}, ${notesE}, is_active, created_at, updated_at
          FROM team_members_temp
        `).run();
      })();
      db.exec("DROP TABLE team_members_temp;");
      log('FIXED: team_members table rebuilt (legacy columns removed).');
    } else {
      log('team_members: already clean.');
    }

  } catch (err) {
    log('REPAIR ERROR: ' + err.message);
  } finally {
    try { db.pragma('foreign_keys = ON'); } catch(e) {}
    db.close();
  }

  // ── VERIFICATION: Re-open read-only and dump final state ───────────────────
  log('\n============================================================');
  log('POST-REPAIR VERIFICATION');
  log('============================================================');

  const db2 = new Database(dbPath, { readonly: true });
  const tables = ['areas', 'doctors', 'institutions', 'team_members', 'groups', 'products'];
  const schemas = {};

  for (const t of tables) {
    const cols = db2.prepare(`PRAGMA table_info(${t})`).all();
    schemas[t] = cols;
    log(`\n--- ${t} ---`);
    cols.forEach(c => {
      const nn = c.notnull === 1 ? 'NOT NULL' : 'nullable';
      log(`  [${c.cid}] ${c.name}  ${c.type}  ${nn}`);
    });
  }

  log('\n=== LEGACY COLUMN CHECK ===');
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
      log(`  !! STILL PRESENT in '${table}': [${found.join(', ')}]`);
    } else {
      log(`  OK  '${table}': clean`);
    }
  }
  log(allClean ? '\nALL CLEAN — Repair successful!' : '\nWARNING — Some legacy columns remain!');

  db2.close();
  log('\n=== REPAIR COMPLETE ===\n');
  app.quit();
});
