/**
 * Phase 20.5.6 — Complete DB FK Corruption Audit & Repair
 * Finds EVERY table/trigger with _temp references and rebuilds them.
 */
const {app}=require('electron');
app.setName('Himmel Pharmaceutical');
const path=require('path');
app.setPath('userData',path.join(app.getPath('appData'),'Himmel Pharmaceutical'));

app.whenReady().then(()=>{
  const Database=require('better-sqlite3');
  const dbPath=path.join(app.getPath('userData'),'database','admin.db');
  const log=(m)=>console.log(m);

  log('\n====== Phase 20.5.6 — Complete FK Corruption Repair ======');

  const db=new Database(dbPath);

  // Step 1: Audit everything
  log('\n=== AUDIT: ALL OBJECTS WITH _temp REFERENCES ===');
  const allObjs = db.prepare("SELECT name, type, sql FROM sqlite_master WHERE sql LIKE '%_temp%' ORDER BY type, name").all();
  allObjs.forEach(o => {
    log(`\n  [${o.type}] ${o.name}`);
    (o.sql||'').split('\n').filter(l=>l.includes('_temp')).forEach(l=>log('    '+l.trim()));
  });
  if (allObjs.length === 0) log('  NONE — DB appears clean');

  log('\n=== PRAGMA foreign_key_check (before repair) ===');
  const fkBefore = db.prepare('PRAGMA foreign_key_check').all();
  fkBefore.forEach(e=>log(`  VIOLATION: table=${e.table} rowid=${e.rowid} parent=${e.parent} fkid=${e.fkid}`));
  if (fkBefore.length===0) log('  No violations');

  // Step 2: Disable everything
  db.pragma('foreign_keys = OFF');
  db.exec('DROP VIEW IF EXISTS view_sales_summary;');
  db.exec('DROP VIEW IF EXISTS view_team_member_targets;');
  db.exec('DROP VIEW IF EXISTS view_target_achievements;');
  db.exec('DROP VIEW IF EXISTS view_team_performance;');
  db.exec('DROP VIEW IF EXISTS view_monthly_sales;');
  // Drop triggers that get in the way of table renaming
  db.exec('DROP TRIGGER IF EXISTS trg_order_items_insert;');
  db.exec('DROP TRIGGER IF EXISTS trg_order_items_update;');
  db.exec('DROP TRIGGER IF EXISTS trg_order_items_delete;');
  db.exec('DROP TRIGGER IF EXISTS trg_order_items_updated;');
  db.exec('DROP TRIGGER IF EXISTS trg_orders_updated;');
  db.exec('DROP TRIGGER IF EXISTS trg_products_updated;');
  db.exec('DROP TRIGGER IF EXISTS trg_team_members_updated;');
  db.exec('DROP TRIGGER IF EXISTS trg_areas_updated;');
  db.exec('DROP TRIGGER IF EXISTS trg_doctors_updated;');
  db.exec('DROP TRIGGER IF EXISTS trg_institutions_updated;');
  db.exec('DROP TRIGGER IF EXISTS trg_business_years_updated;');
  db.exec('DROP TRIGGER IF EXISTS trg_unit_types_updated;');
  db.exec('DROP TRIGGER IF EXISTS trg_divisions_updated;');
  db.exec('DROP TRIGGER IF EXISTS trg_groups_updated;');
  db.exec('DROP TRIGGER IF EXISTS trg_settings_updated;');
  db.exec('DROP TRIGGER IF EXISTS trg_product_targets_updated;');
  db.exec('DROP TRIGGER IF EXISTS trg_product_targets_validate_insert;');
  db.exec('DROP TRIGGER IF EXISTS trg_product_targets_validate_update;');
  log('\nAll views and triggers dropped.');

  // Helper: get row count safely
  const rowCount = (table) => {
    try { return db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get().c; } catch(e){ return 'ERROR:'+e.message; }
  };

  // Step 3: Fix PRODUCTS (FK references groups_temp)
  try {
    const pRow = db.prepare("SELECT sql FROM sqlite_master WHERE name='products' AND type='table'").get();
    if (pRow && pRow.sql && pRow.sql.includes('_temp')) {
      const cnt = rowCount('products');
      log(`\nFixing products table (${cnt} rows)...`);
      db.exec('DROP TABLE IF EXISTS products_fix_temp;');
      db.exec('ALTER TABLE products RENAME TO products_fix_temp;');
      db.exec(`
        CREATE TABLE products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          division_id INTEGER NOT NULL,
          group_id INTEGER NOT NULL,
          product_code TEXT NOT NULL UNIQUE,
          brand_name TEXT NOT NULL,
          generic_name TEXT,
          strength TEXT,
          dosage_form TEXT,
          registration_no TEXT UNIQUE,
          manufacturer TEXT,
          pack_size INTEGER NOT NULL CHECK (pack_size > 0),
          unit_type_id INTEGER NOT NULL,
          tp REAL NOT NULL CHECK (tp >= 0.0),
          mrp REAL NOT NULL CHECK (mrp >= 0.0),
          description TEXT,
          status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Discontinued')),
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (division_id)  REFERENCES divisions (id)   ON DELETE RESTRICT,
          FOREIGN KEY (group_id)     REFERENCES groups (id)      ON DELETE RESTRICT,
          FOREIGN KEY (unit_type_id) REFERENCES unit_types (id)  ON DELETE RESTRICT
        );
      `);
      const tCols = db.prepare('PRAGMA table_info(products_fix_temp)').all().map(c=>c.name);
      const keep = ['id','division_id','group_id','product_code','brand_name','generic_name','strength',
                    'dosage_form','registration_no','manufacturer','pack_size','unit_type_id','tp','mrp',
                    'description','status','created_at','updated_at'];
      const cols = keep.filter(c=>tCols.includes(c)).join(', ');
      db.transaction(()=>{
        const r = db.prepare(`INSERT INTO products (${cols}) SELECT ${cols} FROM products_fix_temp`).run();
        log(`  Copied ${r.changes} products.`);
      })();
      db.exec('DROP TABLE products_fix_temp;');
      log('  products FIXED.');
    } else {
      log('\nproducts: FK clean, skipping.');
    }
  } catch(e) { log('products FIX ERROR: '+e.message); }

  // Step 4: Fix ORDER_ITEMS (FK references orders_temp or products_temp)
  try {
    const oiRow = db.prepare("SELECT sql FROM sqlite_master WHERE name='order_items' AND type='table'").get();
    if (oiRow && oiRow.sql && oiRow.sql.includes('_temp')) {
      const cnt = rowCount('order_items');
      log(`\nFixing order_items table (${cnt} rows)...`);
      db.exec('DROP TABLE IF EXISTS order_items_fix_temp;');
      db.exec('ALTER TABLE order_items RENAME TO order_items_fix_temp;');
      db.exec(`
        CREATE TABLE order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL CHECK (quantity > 0),
          unit_price REAL NOT NULL CHECK (unit_price >= 0.0),
          total_price REAL NOT NULL CHECK (total_price >= 0.0),
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id)   REFERENCES orders (id)   ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT,
          UNIQUE (order_id, product_id)
        );
      `);
      db.transaction(()=>{
        const r = db.prepare(`
          INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price, created_at, updated_at)
          SELECT id, order_id, product_id, quantity, unit_price, total_price, created_at, updated_at
          FROM order_items_fix_temp
        `).run();
        log(`  Copied ${r.changes} order_items.`);
      })();
      db.exec('DROP TABLE order_items_fix_temp;');
      log('  order_items FIXED.');
    } else {
      log('\norder_items: FK clean, skipping.');
    }
  } catch(e) { log('order_items FIX ERROR: '+e.message); }

  // Step 5: Fix ORDERS (already fixed in previous run but re-verify)
  try {
    const oRow = db.prepare("SELECT sql FROM sqlite_master WHERE name='orders' AND type='table'").get();
    if (oRow && oRow.sql && oRow.sql.includes('_temp')) {
      const cnt = rowCount('orders');
      log(`\nFixing orders table (${cnt} rows)...`);
      db.exec('DROP TABLE IF EXISTS orders_fix_temp;');
      db.exec('ALTER TABLE orders RENAME TO orders_fix_temp;');
      db.exec(`
        CREATE TABLE orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_number TEXT NOT NULL UNIQUE,
          order_date TEXT NOT NULL,
          team_member_id INTEGER NOT NULL,
          doctor_id INTEGER,
          institution_id INTEGER,
          area_id INTEGER NOT NULL,
          total_amount REAL NOT NULL DEFAULT 0.0 CHECK (total_amount >= 0.0),
          status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Draft', 'Pending', 'Approved', 'Completed', 'Cancelled')),
          created_by TEXT, submitted_at TEXT, approved_by TEXT, approved_at TEXT,
          completed_by TEXT, completed_at TEXT, cancelled_by TEXT, cancelled_at TEXT,
          cancel_reason TEXT, remarks TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          import_id TEXT,
          FOREIGN KEY (team_member_id) REFERENCES team_members (id) ON DELETE RESTRICT,
          FOREIGN KEY (doctor_id)      REFERENCES doctors (id)      ON DELETE SET NULL,
          FOREIGN KEY (institution_id) REFERENCES institutions (id) ON DELETE SET NULL,
          FOREIGN KEY (area_id)        REFERENCES areas (id)        ON DELETE RESTRICT
        );
      `);
      const tCols = db.prepare('PRAGMA table_info(orders_fix_temp)').all().map(c=>c.name);
      const keep = ['id','order_number','order_date','team_member_id','doctor_id','institution_id',
                    'area_id','total_amount','status','created_by','submitted_at','approved_by',
                    'approved_at','completed_by','completed_at','cancelled_by','cancelled_at',
                    'cancel_reason','remarks','created_at','updated_at','import_id'];
      const cols = keep.filter(c=>tCols.includes(c)).join(', ');
      db.transaction(()=>{
        const r = db.prepare(`INSERT INTO orders (${cols}) SELECT ${cols} FROM orders_fix_temp`).run();
        log(`  Copied ${r.changes} orders.`);
      })();
      db.exec('DROP TABLE orders_fix_temp;');
      log('  orders FIXED.');
    } else {
      log('\norders: FK clean, skipping.');
    }
  } catch(e) { log('orders FIX ERROR: '+e.message); }

  // Step 6: Audit any remaining _temp references in other tables
  log('\n=== CHECK REMAINING TABLES FOR _temp REFS ===');
  const remaining = db.prepare("SELECT name, type, sql FROM sqlite_master WHERE sql LIKE '%_temp%' AND type='table'").all();
  remaining.forEach(o => {
    log(`  STILL CORRUPT: [${o.type}] ${o.name}`);
    (o.sql||'').split('\n').filter(l=>l.includes('_temp')).forEach(l=>log('    '+l.trim()));
  });
  if (remaining.length === 0) log('  NONE — all tables clean!');

  // Step 7: Rebuild all indexes
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_orders_date        ON orders(order_date);'); } catch(e){}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_orders_member      ON orders(team_member_id);'); } catch(e){}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_orders_status_date ON orders(status, order_date);'); } catch(e){}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_orders_area        ON orders(area_id);'); } catch(e){}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_orders_doctor      ON orders(doctor_id);'); } catch(e){}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_orders_institution ON orders(institution_id);'); } catch(e){}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_products_status    ON products(status);'); } catch(e){}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_products_code      ON products(product_code);'); } catch(e){}
  log('\nIndexes rebuilt.');

  // Step 8: Recreate all views + triggers
  log('\nRecreating views and triggers...');
  try {
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
      LEFT JOIN team_members tm_db  ON tm_db.name   = json_extract(tm.value,'$.name')
      LEFT JOIN areas area_db       ON area_db.name  = json_extract(area.value,'$.areaName');

      DROP VIEW IF EXISTS view_sales_summary;
      CREATE VIEW view_sales_summary AS
      SELECT oi.id AS order_item_id, oi.order_id, o.order_number, o.order_date,
             o.status AS order_status,
             tm.id AS team_member_id, tm.name AS team_member_name,
             p.id AS product_id, p.brand_name AS product_name,
             a.id AS area_id, a.name AS area_name,
             oi.quantity, oi.unit_price, oi.total_price
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN team_members tm ON o.team_member_id = tm.id
      JOIN products p ON oi.product_id = p.id
      JOIN areas a ON o.area_id = a.id;

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
        FROM order_items oi
        JOIN orders o ON oi.order_id=o.id
        JOIN business_years byr ON date(o.order_date) BETWEEN date(byr.start_date) AND date(byr.end_date)
        WHERE o.status='Completed'
        GROUP BY o.team_member_id, oi.product_id, byr.id
      ) actual ON v.team_member_id=actual.team_member_id
              AND v.product_id=actual.product_id
              AND v.business_year_id=actual.business_year_id;

      DROP VIEW IF EXISTS view_team_performance;
      CREATE VIEW view_team_performance AS
      SELECT tm.id AS team_member_id, tm.name AS team_member_name, tm.role,
             COUNT(o.id) AS total_orders,
             SUM(CASE WHEN o.status='Completed' THEN 1 ELSE 0 END) AS completed_orders,
             COALESCE(SUM(CASE WHEN o.status='Completed' THEN o.total_amount ELSE 0.0 END),0.0) AS total_sales_value,
             COALESCE(AVG(CASE WHEN o.status='Completed' THEN o.total_amount ELSE NULL END),0.0) AS average_order_value
      FROM team_members tm
      LEFT JOIN orders o ON tm.id=o.team_member_id
      GROUP BY tm.id;

      DROP VIEW IF EXISTS view_monthly_sales;
      CREATE VIEW view_monthly_sales AS
      SELECT strftime('%Y-%m',o.order_date) AS sales_month,
             COUNT(o.id) AS total_orders,
             COALESCE(SUM(CASE WHEN o.status='Completed' THEN o.total_amount ELSE 0.0 END),0.0) AS total_sales
      FROM orders o WHERE o.status='Completed'
      GROUP BY sales_month;
    `);
    log('Views recreated.');

    db.exec(`
      DROP TRIGGER IF EXISTS trg_business_years_updated;
      CREATE TRIGGER trg_business_years_updated AFTER UPDATE ON business_years FOR EACH ROW BEGIN
        UPDATE business_years SET updated_at=CURRENT_TIMESTAMP WHERE id=NEW.id; END;

      DROP TRIGGER IF EXISTS trg_unit_types_updated;
      CREATE TRIGGER trg_unit_types_updated AFTER UPDATE ON unit_types FOR EACH ROW BEGIN
        UPDATE unit_types SET updated_at=CURRENT_TIMESTAMP WHERE id=NEW.id; END;

      DROP TRIGGER IF EXISTS trg_divisions_updated;
      CREATE TRIGGER trg_divisions_updated AFTER UPDATE ON divisions FOR EACH ROW BEGIN
        UPDATE divisions SET updated_at=CURRENT_TIMESTAMP WHERE id=NEW.id; END;

      DROP TRIGGER IF EXISTS trg_groups_updated;
      CREATE TRIGGER trg_groups_updated AFTER UPDATE ON groups FOR EACH ROW BEGIN
        UPDATE groups SET updated_at=CURRENT_TIMESTAMP WHERE id=NEW.id; END;

      DROP TRIGGER IF EXISTS trg_products_updated;
      CREATE TRIGGER trg_products_updated AFTER UPDATE ON products FOR EACH ROW BEGIN
        UPDATE products SET updated_at=CURRENT_TIMESTAMP WHERE id=NEW.id; END;

      DROP TRIGGER IF EXISTS trg_areas_updated;
      CREATE TRIGGER trg_areas_updated AFTER UPDATE ON areas FOR EACH ROW BEGIN
        UPDATE areas SET updated_at=CURRENT_TIMESTAMP WHERE id=NEW.id; END;

      DROP TRIGGER IF EXISTS trg_team_members_updated;
      CREATE TRIGGER trg_team_members_updated AFTER UPDATE ON team_members FOR EACH ROW BEGIN
        UPDATE team_members SET updated_at=CURRENT_TIMESTAMP WHERE id=NEW.id; END;

      DROP TRIGGER IF EXISTS trg_doctors_updated;
      CREATE TRIGGER trg_doctors_updated AFTER UPDATE ON doctors FOR EACH ROW BEGIN
        UPDATE doctors SET updated_at=CURRENT_TIMESTAMP WHERE id=NEW.id; END;

      DROP TRIGGER IF EXISTS trg_institutions_updated;
      CREATE TRIGGER trg_institutions_updated AFTER UPDATE ON institutions FOR EACH ROW BEGIN
        UPDATE institutions SET updated_at=CURRENT_TIMESTAMP WHERE id=NEW.id; END;

      DROP TRIGGER IF EXISTS trg_product_targets_updated;
      CREATE TRIGGER trg_product_targets_updated AFTER UPDATE ON product_targets FOR EACH ROW BEGIN
        UPDATE product_targets SET updated_at=CURRENT_TIMESTAMP WHERE id=NEW.id; END;

      DROP TRIGGER IF EXISTS trg_orders_updated;
      CREATE TRIGGER trg_orders_updated AFTER UPDATE ON orders FOR EACH ROW BEGIN
        UPDATE orders SET updated_at=CURRENT_TIMESTAMP WHERE id=NEW.id; END;

      DROP TRIGGER IF EXISTS trg_order_items_updated;
      CREATE TRIGGER trg_order_items_updated AFTER UPDATE ON order_items FOR EACH ROW BEGIN
        UPDATE order_items SET updated_at=CURRENT_TIMESTAMP WHERE id=NEW.id; END;

      DROP TRIGGER IF EXISTS trg_settings_updated;
      CREATE TRIGGER trg_settings_updated AFTER UPDATE ON settings FOR EACH ROW BEGIN
        UPDATE settings SET updated_at=CURRENT_TIMESTAMP WHERE id=NEW.id; END;

      DROP TRIGGER IF EXISTS trg_order_items_insert;
      CREATE TRIGGER trg_order_items_insert AFTER INSERT ON order_items FOR EACH ROW BEGIN
        UPDATE orders SET total_amount=(SELECT COALESCE(SUM(total_price),0.0) FROM order_items WHERE order_id=NEW.order_id)
        WHERE id=NEW.order_id; END;

      DROP TRIGGER IF EXISTS trg_order_items_update;
      CREATE TRIGGER trg_order_items_update AFTER UPDATE ON order_items FOR EACH ROW BEGIN
        UPDATE orders SET total_amount=(SELECT COALESCE(SUM(total_price),0.0) FROM order_items WHERE order_id=NEW.order_id)
        WHERE id=NEW.order_id; END;

      DROP TRIGGER IF EXISTS trg_order_items_delete;
      CREATE TRIGGER trg_order_items_delete AFTER DELETE ON order_items FOR EACH ROW BEGIN
        UPDATE orders SET total_amount=(SELECT COALESCE(SUM(total_price),0.0) FROM order_items WHERE order_id=OLD.order_id)
        WHERE id=OLD.order_id; END;
    `);
    log('Triggers recreated.');
  } catch(e) { log('VIEW/TRIGGER ERROR: '+e.message+'\n'+e.stack); }

  db.pragma('foreign_keys = ON');

  // WAL checkpoint
  try { db.pragma('wal_checkpoint(TRUNCATE)'); log('WAL checkpointed.'); } catch(e){}
  db.close();

  // ── VERIFICATION ──────────────────────────────────────────────────────────
  log('\n====== FINAL VERIFICATION ======');
  const db2=new Database(dbPath, {readonly:true});

  log('\n1. _temp references audit:');
  const corrupt2 = db2.prepare("SELECT name, type FROM sqlite_master WHERE sql LIKE '%_temp%'").all();
  if (corrupt2.length===0) log('   ✓ NONE — fully clean');
  else corrupt2.forEach(o=>log(`   ✗ STILL CORRUPT: [${o.type}] ${o.name}`));

  log('\n2. FK violation check:');
  const fkAfter = db2.prepare('PRAGMA foreign_key_check').all();
  if (fkAfter.length===0) log('   ✓ No FK violations');
  else fkAfter.forEach(e=>log(`   ✗ VIOLATION: table=${e.table} rowid=${e.rowid} parent=${e.parent}`));

  log('\n3. Integrity check:');
  const ic = db2.prepare('PRAGMA integrity_check').all();
  ic.forEach(r=>log('   '+JSON.stringify(r)));

  log('\n4. INSERT prepare test (OrderRepository.create):');
  try {
    db2.prepare(`
      INSERT INTO orders (order_number,order_date,team_member_id,doctor_id,institution_id,
        area_id,status,remarks,created_by,submitted_at,import_id)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `);
    log('   ✓ INSERT INTO orders: prepare OK');
  } catch(e) { log('   ✗ INSERT prepare ERROR: '+e.message); }

  log('\n5. Views:');
  ['view_sales_summary','view_target_achievements','view_team_performance',
   'view_monthly_sales','view_team_member_targets'].forEach(v=>{
    try { db2.prepare(`SELECT COUNT(*) as c FROM ${v}`).get(); log(`   ✓ ${v}: OK`); }
    catch(e) { log(`   ✗ ${v}: ${e.message}`); }
  });

  log('\n6. Triggers:');
  const triggers = db2.prepare("SELECT name FROM sqlite_master WHERE type='trigger' ORDER BY name").all();
  triggers.forEach(t=>log(`   ✓ ${t.name}`));

  log('\n7. Row counts:');
  ['areas','doctors','institutions','team_members','groups','products','orders','order_items']
    .forEach(t=>{
      try { log(`   ${t}: ${db2.prepare('SELECT COUNT(*) as c FROM '+t).get().c} rows`); }
      catch(e) { log(`   ${t}: ERROR - ${e.message}`); }
    });

  db2.close();
  log('\n====== COMPLETE ======\n');
  app.quit();
});
