/**
 * Phase 20.5.5 — Direct Live DB Repair
 * Fixes: groups.division_id NOT NULL and recreates views
 */
const {app}=require('electron');
app.setName('Himmel Pharmaceutical');
const path=require('path');
app.setPath('userData',path.join(app.getPath('appData'),'Himmel Pharmaceutical'));

app.whenReady().then(()=>{
  const Database=require('better-sqlite3');
  const dbPath=path.join(app.getPath('userData'),'database','admin.db');
  const log=(m)=>console.log(m);

  log('\n====== Phase 20.5.5 Direct DB Repair ======');
  log('DB: '+dbPath);

  const db=new Database(dbPath);

  try {
    db.pragma('foreign_keys = OFF');
    db.pragma('journal_mode = WAL');

    // Drop views before rebuilding
    db.exec('DROP VIEW IF EXISTS view_sales_summary;');
    db.exec('DROP VIEW IF EXISTS view_team_member_targets;');
    db.exec('DROP VIEW IF EXISTS view_target_achievements;');
    db.exec('DROP VIEW IF EXISTS view_team_performance;');
    db.exec('DROP VIEW IF EXISTS view_monthly_sales;');
    log('Views dropped.');

    // Fix 1: groups.division_id NOT NULL
    const groupCols = db.prepare('PRAGMA table_info(groups)').all();
    const divColInfo = groupCols.find(c => c.name === 'division_id');
    if (divColInfo && divColInfo.notnull === 1) {
      log('Fixing groups table — division_id is NOT NULL, rebuilding...');
      db.exec('DROP TABLE IF EXISTS groups_temp;');
      db.exec('ALTER TABLE groups RENAME TO groups_temp;');
      db.exec(`
        CREATE TABLE groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          division_id INTEGER,
          name TEXT NOT NULL,
          description TEXT,
          is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (division_id) REFERENCES divisions (id) ON DELETE SET NULL
        );
      `);
      db.exec('CREATE INDEX IF NOT EXISTS idx_groups_active ON groups(is_active);');
      const tCols = db.prepare('PRAGMA table_info(groups_temp)').all().map(c=>c.name);
      const divE  = tCols.includes('division_id') ? 'division_id' : 'NULL';
      const descE = tCols.includes('description') ? 'description' : 'NULL';
      db.transaction(()=>{
        db.prepare(`
          INSERT INTO groups (id, division_id, name, description, is_active, created_at, updated_at)
          SELECT id, ${divE}, name, ${descE}, is_active, created_at, updated_at
          FROM groups_temp
        `).run();
      })();
      db.exec('DROP TABLE groups_temp;');
      log('FIXED: groups.division_id is now nullable.');
    } else {
      log('groups: division_id already nullable, skipping.');
    }

  } catch(err) {
    log('REPAIR ERROR: '+err.message);
  } finally {
    try { db.pragma('foreign_keys = ON'); } catch(e) {}
  }

  // Recreate views with corrected SQL (p.tp instead of p.per_unit_price)
  try {
    log('Recreating views...');
    db.exec(`
      DROP VIEW IF EXISTS view_team_member_targets;
      CREATE VIEW view_team_member_targets AS
      SELECT
        pt.id AS product_target_id,
        pt.business_year_id,
        pt.product_id,
        tm_db.id AS team_member_id,
        tm_db.name AS team_member_name,
        area_db.id AS area_id,
        area_db.name AS area_name,
        CAST(ROUND(pt.annual_target_qty * 
          (CAST(json_extract(area.value, '$.percentage') AS REAL) / 100.0) * 
          (CAST(json_extract(tm.value, '$.percentage') AS REAL) / 100.0)
        ) AS INTEGER) AS target_qty
      FROM product_targets pt
      CROSS JOIN json_each(pt.areas_distribution) area
      CROSS JOIN json_each(json_extract(area.value, '$.teamMembers')) tm
      LEFT JOIN team_members tm_db ON tm_db.name = json_extract(tm.value, '$.name')
      LEFT JOIN areas area_db ON area_db.name = json_extract(area.value, '$.areaName');
    `);

    db.exec(`
      DROP VIEW IF EXISTS view_sales_summary;
      CREATE VIEW view_sales_summary AS
      SELECT 
        oi.id AS order_item_id,
        oi.order_id,
        o.order_number,
        o.order_date,
        o.status AS order_status,
        tm.id AS team_member_id,
        tm.name AS team_member_name,
        p.id AS product_id,
        p.brand_name AS product_name,
        a.id AS area_id,
        a.name AS area_name,
        oi.quantity,
        oi.unit_price,
        oi.total_price
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN team_members tm ON o.team_member_id = tm.id
      JOIN products p ON oi.product_id = p.id
      JOIN areas a ON o.area_id = a.id;
    `);

    db.exec(`
      DROP VIEW IF EXISTS view_target_achievements;
      CREATE VIEW view_target_achievements AS
      SELECT 
        v.product_target_id AS target_id,
        v.business_year_id,
        byr.year_name,
        v.team_member_id,
        v.team_member_name,
        v.product_id,
        p.brand_name AS product_name,
        v.target_qty,
        (v.target_qty * COALESCE(p.tp, 0.0)) AS target_value,
        COALESCE(actual.qty, 0) AS actual_qty,
        COALESCE(actual.value, 0.0) AS actual_value,
        CASE 
          WHEN v.target_qty = 0 THEN 0.0
          ELSE ROUND((COALESCE(actual.qty, 0) * 100.0) / v.target_qty, 2)
        END AS qty_achievement_percent,
        CASE 
          WHEN (v.target_qty * COALESCE(p.tp, 0.0)) = 0.0 THEN 0.0
          ELSE ROUND((COALESCE(actual.value, 0.0) * 100.0) / (v.target_qty * COALESCE(p.tp, 0.0)), 2)
        END AS value_achievement_percent
      FROM view_team_member_targets v
      JOIN business_years byr ON v.business_year_id = byr.id
      JOIN products p ON v.product_id = p.id
      LEFT JOIN (
        SELECT 
          o.team_member_id,
          oi.product_id,
          byr.id AS business_year_id,
          SUM(oi.quantity) AS qty,
          SUM(oi.total_price) AS value
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN business_years byr ON date(o.order_date) BETWEEN date(byr.start_date) AND date(byr.end_date)
        WHERE o.status = 'Completed'
        GROUP BY o.team_member_id, oi.product_id, byr.id
      ) actual ON v.team_member_id = actual.team_member_id 
              AND v.product_id = actual.product_id 
              AND v.business_year_id = actual.business_year_id;
    `);

    db.exec(`
      DROP VIEW IF EXISTS view_team_performance;
      CREATE VIEW view_team_performance AS
      SELECT 
        tm.id AS team_member_id,
        tm.name AS team_member_name,
        tm.role,
        COUNT(o.id) AS total_orders,
        SUM(CASE WHEN o.status = 'Completed' THEN 1 ELSE 0 END) AS completed_orders,
        COALESCE(SUM(CASE WHEN o.status = 'Completed' THEN o.total_amount ELSE 0.0 END), 0.0) AS total_sales_value,
        COALESCE(AVG(CASE WHEN o.status = 'Completed' THEN o.total_amount ELSE NULL END), 0.0) AS average_order_value
      FROM team_members tm
      LEFT JOIN orders o ON tm.id = o.team_member_id
      GROUP BY tm.id;
    `);

    db.exec(`
      DROP VIEW IF EXISTS view_monthly_sales;
      CREATE VIEW view_monthly_sales AS
      SELECT 
        strftime('%Y-%m', o.order_date) AS sales_month,
        COUNT(o.id) AS total_orders,
        COALESCE(SUM(CASE WHEN o.status = 'Completed' THEN o.total_amount ELSE 0.0 END), 0.0) AS total_sales
      FROM orders o
      WHERE o.status = 'Completed'
      GROUP BY sales_month;
    `);

    log('Views recreated successfully.');
  } catch(err) {
    log('VIEW RECREATION ERROR: '+err.message);
  }

  // Verification
  log('\n====== POST-REPAIR VERIFICATION ======');
  const db2 = new Database(dbPath, {readonly:true});
  
  log('groups schema:');
  db2.prepare('PRAGMA table_info(groups)').all().forEach(c=>
    log('  '+c.cid+' '+c.name+' '+c.type+' notnull:'+c.notnull)
  );

  log('\nView existence check:');
  const views = db2.prepare("SELECT name FROM sqlite_master WHERE type='view'").all().map(v=>v.name);
  ['view_sales_summary','view_team_member_targets','view_target_achievements','view_team_performance','view_monthly_sales']
    .forEach(v => log('  '+v+': '+(views.includes(v)?'EXISTS':'MISSING')));

  log('\nQuery test: SELECT from view_target_achievements');
  try { db2.prepare('SELECT COUNT(*) as c FROM view_target_achievements').get(); log('  OK'); }
  catch(e) { log('  ERROR: '+e.message); }

  log('\nQuery test: SELECT from view_monthly_sales');
  try { db2.prepare('SELECT COUNT(*) as c FROM view_monthly_sales').get(); log('  OK'); }
  catch(e) { log('  ERROR: '+e.message); }

  log('\nGroups INSERT test (null division_id):');
  const db3 = new Database(dbPath);
  try {
    db3.pragma('foreign_keys = ON');
    const r = db3.prepare("INSERT INTO groups (division_id, name, description, is_active) VALUES (NULL, 'TestGroup20_5_5', NULL, 1)").run();
    log('  INSERT OK, id='+r.lastInsertRowid);
    db3.prepare('DELETE FROM groups WHERE id=?').run(r.lastInsertRowid);
    log('  Cleanup OK');
  } catch(e) {
    log('  INSERT ERROR: '+e.message);
  }
  db3.close();
  db2.close();
  db.close();

  log('\n====== REPAIR COMPLETE ======\n');
  app.quit();
});
