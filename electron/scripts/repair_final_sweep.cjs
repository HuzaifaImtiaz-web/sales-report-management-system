/**
 * Final sweep: fix product_targets corrupt FK + verify everything
 */
const {app}=require('electron');
app.setName('Himmel Pharmaceutical');
const path=require('path');
app.setPath('userData',path.join(app.getPath('appData'),'Himmel Pharmaceutical'));

app.whenReady().then(()=>{
  const Database=require('better-sqlite3');
  const dbPath=path.join(app.getPath('userData'),'database','admin.db');
  const log=(m)=>console.log(m);
  log('\n====== Final Sweep: product_targets FK Repair ======');

  const db=new Database(dbPath);
  db.pragma('foreign_keys = OFF');

  // Drop triggers that fire on product_targets
  db.exec('DROP TRIGGER IF EXISTS trg_product_targets_updated;');
  db.exec('DROP TRIGGER IF EXISTS trg_product_targets_validate_insert;');
  db.exec('DROP TRIGGER IF EXISTS trg_product_targets_validate_update;');

  // Drop views that query product_targets
  db.exec('DROP VIEW IF EXISTS view_team_member_targets;');
  db.exec('DROP VIEW IF EXISTS view_target_achievements;');

  try {
    const ptRow = db.prepare("SELECT sql FROM sqlite_master WHERE name='product_targets' AND type='table'").get();
    if (ptRow && ptRow.sql && ptRow.sql.includes('_temp')) {
      const cnt = db.prepare('SELECT COUNT(*) as c FROM product_targets').get().c;
      log(`product_targets has corrupt FK (${cnt} rows) — rebuilding...`);
      db.exec('DROP TABLE IF EXISTS pt_fix_temp;');
      db.exec('ALTER TABLE product_targets RENAME TO pt_fix_temp;');
      db.exec(`
        CREATE TABLE product_targets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          business_year_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          annual_target_qty INTEGER NOT NULL CHECK (annual_target_qty >= 0),
          areas_distribution TEXT NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (business_year_id) REFERENCES business_years (id) ON DELETE RESTRICT,
          FOREIGN KEY (product_id)       REFERENCES products (id)       ON DELETE CASCADE,
          UNIQUE (business_year_id, product_id)
        );
      `);
      const tCols = db.prepare('PRAGMA table_info(pt_fix_temp)').all().map(c=>c.name);
      const keep  = ['id','business_year_id','product_id','annual_target_qty','areas_distribution','notes','created_at','updated_at'];
      const cols  = keep.filter(c=>tCols.includes(c)).join(', ');
      db.transaction(()=>{
        const r = db.prepare(`INSERT INTO product_targets (${cols}) SELECT ${cols} FROM pt_fix_temp`).run();
        log(`Copied ${r.changes} product_targets rows.`);
      })();
      db.exec('DROP TABLE pt_fix_temp;');
      log('product_targets FIXED.');
    } else {
      log('product_targets: FK clean, skipping.');
    }
  } catch(e) { log('product_targets ERROR: '+e.message); }

  // Recreate product_targets triggers
  db.exec(`
    DROP TRIGGER IF EXISTS trg_product_targets_updated;
    CREATE TRIGGER trg_product_targets_updated AFTER UPDATE ON product_targets FOR EACH ROW BEGIN
      UPDATE product_targets SET updated_at=CURRENT_TIMESTAMP WHERE id=NEW.id; END;

    DROP TRIGGER IF EXISTS trg_product_targets_validate_insert;
    CREATE TRIGGER trg_product_targets_validate_insert BEFORE INSERT ON product_targets FOR EACH ROW BEGIN
      SELECT CASE WHEN (
        SELECT COALESCE(SUM(CAST(json_extract(area.value,'$.percentage') AS REAL)),0.0)
        FROM json_each(NEW.areas_distribution) area
      ) != 100.0 THEN RAISE(ABORT,'Validation Error: Total Area percentages must sum to exactly 100%.') END;
      SELECT CASE WHEN EXISTS (
        SELECT 1 FROM json_each(NEW.areas_distribution) area
        WHERE (SELECT COALESCE(SUM(CAST(json_extract(tm.value,'$.percentage') AS REAL)),0.0)
               FROM json_each(json_extract(area.value,'$.teamMembers')) tm) != 100.0
      ) THEN RAISE(ABORT,'Validation Error: Team Member percentages inside each Area must sum to exactly 100%.') END; END;

    DROP TRIGGER IF EXISTS trg_product_targets_validate_update;
    CREATE TRIGGER trg_product_targets_validate_update BEFORE UPDATE ON product_targets FOR EACH ROW BEGIN
      SELECT CASE WHEN (
        SELECT COALESCE(SUM(CAST(json_extract(area.value,'$.percentage') AS REAL)),0.0)
        FROM json_each(NEW.areas_distribution) area
      ) != 100.0 THEN RAISE(ABORT,'Validation Error: Total Area percentages must sum to exactly 100%.') END;
      SELECT CASE WHEN EXISTS (
        SELECT 1 FROM json_each(NEW.areas_distribution) area
        WHERE (SELECT COALESCE(SUM(CAST(json_extract(tm.value,'$.percentage') AS REAL)),0.0)
               FROM json_each(json_extract(area.value,'$.teamMembers')) tm) != 100.0
      ) THEN RAISE(ABORT,'Validation Error: Team Member percentages inside each Area must sum to exactly 100%.') END; END;
  `);

  // Recreate views
  db.exec(`
    DROP VIEW IF EXISTS view_team_member_targets;
    CREATE VIEW view_team_member_targets AS
    SELECT pt.id AS product_target_id, pt.business_year_id, pt.product_id,
           tm_db.id AS team_member_id, tm_db.name AS team_member_name,
           area_db.id AS area_id, area_db.name AS area_name,
           CAST(ROUND(pt.annual_target_qty *
             (CAST(json_extract(area.value,'$.percentage') AS REAL)/100.0) *
             (CAST(json_extract(tm.value,'$.percentage')   AS REAL)/100.0)) AS INTEGER) AS target_qty
    FROM product_targets pt
    CROSS JOIN json_each(pt.areas_distribution) area
    CROSS JOIN json_each(json_extract(area.value,'$.teamMembers')) tm
    LEFT JOIN team_members tm_db ON tm_db.name  = json_extract(tm.value,'$.name')
    LEFT JOIN areas area_db      ON area_db.name = json_extract(area.value,'$.areaName');

    DROP VIEW IF EXISTS view_target_achievements;
    CREATE VIEW view_target_achievements AS
    SELECT v.product_target_id AS target_id, v.business_year_id, byr.year_name,
           v.team_member_id, v.team_member_name, v.product_id,
           p.brand_name AS product_name, v.target_qty,
           (v.target_qty * COALESCE(p.tp,0.0)) AS target_value,
           COALESCE(actual.qty,0) AS actual_qty,
           COALESCE(actual.value,0.0) AS actual_value,
           CASE WHEN v.target_qty=0 THEN 0.0
                ELSE ROUND((COALESCE(actual.qty,0)*100.0)/v.target_qty,2)
           END AS qty_achievement_percent,
           CASE WHEN (v.target_qty*COALESCE(p.tp,0.0))=0.0 THEN 0.0
                ELSE ROUND((COALESCE(actual.value,0.0)*100.0)/(v.target_qty*COALESCE(p.tp,0.0)),2)
           END AS value_achievement_percent
    FROM view_team_member_targets v
    JOIN business_years byr ON v.business_year_id=byr.id
    JOIN products p ON v.product_id=p.id
    LEFT JOIN (
      SELECT o.team_member_id, oi.product_id, byr.id AS business_year_id,
             SUM(oi.quantity) AS qty, SUM(oi.total_price) AS value
      FROM order_items oi JOIN orders o ON oi.order_id=o.id
      JOIN business_years byr ON date(o.order_date) BETWEEN date(byr.start_date) AND date(byr.end_date)
      WHERE o.status='Completed' GROUP BY o.team_member_id, oi.product_id, byr.id
    ) actual ON v.team_member_id=actual.team_member_id
            AND v.product_id=actual.product_id
            AND v.business_year_id=actual.business_year_id;
  `);

  db.pragma('foreign_keys = ON');
  try { db.pragma('wal_checkpoint(TRUNCATE)'); } catch(e){}
  db.close();

  // ── FINAL VERIFICATION ────────────────────────────────────────────────────
  log('\n====== FINAL VERIFICATION ======');
  const db2=new Database(dbPath,{readonly:true});

  log('\n1. _temp refs:');
  const corrupt = db2.prepare("SELECT name,type FROM sqlite_master WHERE sql LIKE '%_temp%'").all();
  if (corrupt.length===0) log('   ✓ ZERO corrupt objects');
  else corrupt.forEach(o=>log(`   ✗ ${o.type}:${o.name}`));

  log('\n2. FK violations:');
  const fk = db2.prepare('PRAGMA foreign_key_check').all();
  if (fk.length===0) log('   ✓ No violations');
  else fk.forEach(e=>log(`   ✗ ${e.table} → parent=${e.parent}`));

  log('\n3. Integrity:');
  log('   '+db2.prepare('PRAGMA integrity_check').all().map(r=>r.integrity_check).join(', '));

  log('\n4. INSERT prepare (orders):');
  try {
    db2.prepare('INSERT INTO orders (order_number,order_date,team_member_id,doctor_id,institution_id,area_id,status,remarks,created_by,submitted_at,import_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    log('   ✓ OK — no areas_temp error');
  } catch(e) { log('   ✗ '+e.message); }

  log('\n5. Views:');
  ['view_sales_summary','view_target_achievements','view_team_performance','view_monthly_sales','view_team_member_targets']
    .forEach(v=>{ try { db2.prepare(`SELECT COUNT(*) as c FROM ${v}`).get(); log(`   ✓ ${v}`); } catch(e){log(`   ✗ ${v}: ${e.message}`);}});

  log('\n6. All triggers:');
  db2.prepare("SELECT name FROM sqlite_master WHERE type='trigger' ORDER BY name").all()
    .forEach(t=>log(`   ✓ ${t.name}`));

  log('\n7. Row counts:');
  ['areas','doctors','institutions','team_members','groups','products','orders','order_items','product_targets']
    .forEach(t=>{ try { log(`   ${t}: ${db2.prepare('SELECT COUNT(*) as c FROM '+t).get().c}`); } catch(e){log(`   ${t}: ERROR`);}});

  db2.close();
  log('\n====== ALL DONE ======\n');
  app.quit();
});
