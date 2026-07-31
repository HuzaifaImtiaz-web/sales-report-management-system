/**
 * Phase 20.5.6/7 — Root Cause: orders table has FK references to *_temp tables.
 * SQLite auto-rewrites FK definitions when you RENAME a table, but does NOT 
 * revert them when you rename back. This repair rebuilds orders + order_items
 * with correct FK references, preserving all data.
 */
const {app}=require('electron');
app.setName('Himmel Pharmaceutical');
const path=require('path');
app.setPath('userData',path.join(app.getPath('appData'),'Himmel Pharmaceutical'));

app.whenReady().then(()=>{
  const Database=require('better-sqlite3');
  const dbPath=path.join(app.getPath('userData'),'database','admin.db');
  const log=(m)=>console.log(m);

  log('\n====== Phase 20.5.6 — Orders FK Repair ======');
  log('DB: '+dbPath);

  const db=new Database(dbPath);

  // First: confirm the corruption
  log('\n=== CONFIRMING CORRUPTION ===');
  const ordersSQL = db.prepare("SELECT sql FROM sqlite_master WHERE name='orders'").get();
  if (ordersSQL && ordersSQL.sql) {
    const hasCorruptFK = ordersSQL.sql.includes('_temp');
    log('orders table SQL contains "_temp" references: '+hasCorruptFK);
    if (hasCorruptFK) {
      log('CORRUPT FK references found:');
      ordersSQL.sql.split('\n').filter(l=>l.includes('_temp')).forEach(l=>log('  '+l.trim()));
    }
  }

  const orderCount = db.prepare('SELECT COUNT(*) as c FROM orders').get();
  const itemCount  = db.prepare('SELECT COUNT(*) as c FROM order_items').get();
  log(`\norders rows: ${orderCount.c}, order_items rows: ${itemCount.c}`);

  try {
    db.pragma('foreign_keys = OFF');
    db.pragma('journal_mode = WAL');

    // Drop views/triggers that depend on orders
    log('\nDropping dependent views...');
    db.exec("DROP VIEW IF EXISTS view_sales_summary;");
    db.exec("DROP VIEW IF EXISTS view_target_achievements;");
    db.exec("DROP VIEW IF EXISTS view_team_performance;");
    db.exec("DROP VIEW IF EXISTS view_monthly_sales;");
    db.exec("DROP VIEW IF EXISTS view_team_member_targets;");
    log('Views dropped.');

    // Rebuild orders table with correct FK references
    log('\nRebuilding orders table...');
    db.exec("DROP TABLE IF EXISTS orders_repair_temp;");
    db.exec("ALTER TABLE orders RENAME TO orders_repair_temp;");
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
        created_by TEXT,
        submitted_at TEXT,
        approved_by TEXT,
        approved_at TEXT,
        completed_by TEXT,
        completed_at TEXT,
        cancelled_by TEXT,
        cancelled_at TEXT,
        cancel_reason TEXT,
        remarks TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        import_id TEXT,
        FOREIGN KEY (team_member_id) REFERENCES team_members (id) ON DELETE RESTRICT,
        FOREIGN KEY (doctor_id)      REFERENCES doctors (id)       ON DELETE SET NULL,
        FOREIGN KEY (institution_id) REFERENCES institutions (id)  ON DELETE SET NULL,
        FOREIGN KEY (area_id)        REFERENCES areas (id)         ON DELETE RESTRICT
      );
    `);
    log('New orders table created.');

    // Copy all data from temp
    const tCols = db.prepare("PRAGMA table_info(orders_repair_temp)").all().map(c=>c.name);
    const keep  = ['id','order_number','order_date','team_member_id','doctor_id','institution_id',
                   'area_id','total_amount','status','created_by','submitted_at','approved_by',
                   'approved_at','completed_by','completed_at','cancelled_by','cancelled_at',
                   'cancel_reason','remarks','created_at','updated_at','import_id'];
    const cols  = keep.filter(c=>tCols.includes(c));
    const colList = cols.join(', ');

    db.transaction(()=>{
      const copied = db.prepare(`INSERT INTO orders (${colList}) SELECT ${colList} FROM orders_repair_temp`).run();
      log(`Copied ${copied.changes} orders.`);
    })();
    db.exec("DROP TABLE orders_repair_temp;");
    log('orders_repair_temp dropped.');

    // Rebuild order_items with correct FK
    log('\nRebuilding order_items table...');
    const orderItemsSQL = db.prepare("SELECT sql FROM sqlite_master WHERE name='order_items'").get();
    const orderItemsHasCorrupt = orderItemsSQL && orderItemsSQL.sql && orderItemsSQL.sql.includes('_temp');
    log('order_items has corrupt FK: '+orderItemsHasCorrupt);

    if (orderItemsHasCorrupt) {
      db.exec("DROP TABLE IF EXISTS order_items_repair_temp;");
      db.exec("ALTER TABLE order_items RENAME TO order_items_repair_temp;");
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
          FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT,
          UNIQUE (order_id, product_id)
        );
      `);
      db.transaction(()=>{
        const copied = db.prepare(`
          INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price, created_at, updated_at)
          SELECT id, order_id, product_id, quantity, unit_price, total_price, created_at, updated_at
          FROM order_items_repair_temp
        `).run();
        log(`Copied ${copied.changes} order_items.`);
      })();
      db.exec("DROP TABLE order_items_repair_temp;");
      log('order_items_repair_temp dropped.');
    } else {
      log('order_items FK is clean, skipping rebuild.');
    }

    // Rebuild indexes
    try { db.exec("CREATE INDEX IF NOT EXISTS idx_orders_date    ON orders(order_date);"); } catch(e){}
    try { db.exec("CREATE INDEX IF NOT EXISTS idx_orders_member  ON orders(team_member_id);"); } catch(e){}
    try { db.exec("CREATE INDEX IF NOT EXISTS idx_orders_status_date ON orders(status, order_date);"); } catch(e){}
    try { db.exec("CREATE INDEX IF NOT EXISTS idx_orders_area    ON orders(area_id);"); } catch(e){}
    try { db.exec("CREATE INDEX IF NOT EXISTS idx_orders_doctor  ON orders(doctor_id);"); } catch(e){}
    try { db.exec("CREATE INDEX IF NOT EXISTS idx_orders_institution ON orders(institution_id);"); } catch(e){}
    log('Indexes rebuilt.');

  } catch(err) {
    log('REPAIR ERROR: '+err.message);
    log(err.stack);
  } finally {
    try { db.pragma('foreign_keys = ON'); } catch(e){}
  }

  // Recreate views
  log('\nRecreating views...');
  try {
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
        oi.id AS order_item_id, oi.order_id, o.order_number, o.order_date,
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
    `);
    db.exec(`
      DROP VIEW IF EXISTS view_target_achievements;
      CREATE VIEW view_target_achievements AS
      SELECT 
        v.product_target_id AS target_id, v.business_year_id, byr.year_name,
        v.team_member_id, v.team_member_name, v.product_id,
        p.brand_name AS product_name, v.target_qty,
        (v.target_qty * COALESCE(p.tp, 0.0)) AS target_value,
        COALESCE(actual.qty, 0) AS actual_qty,
        COALESCE(actual.value, 0.0) AS actual_value,
        CASE WHEN v.target_qty = 0 THEN 0.0
             ELSE ROUND((COALESCE(actual.qty,0)*100.0)/v.target_qty,2)
        END AS qty_achievement_percent,
        CASE WHEN (v.target_qty * COALESCE(p.tp,0.0)) = 0.0 THEN 0.0
             ELSE ROUND((COALESCE(actual.value,0.0)*100.0)/(v.target_qty*COALESCE(p.tp,0.0)),2)
        END AS value_achievement_percent
      FROM view_team_member_targets v
      JOIN business_years byr ON v.business_year_id = byr.id
      JOIN products p ON v.product_id = p.id
      LEFT JOIN (
        SELECT o.team_member_id, oi.product_id, byr.id AS business_year_id,
               SUM(oi.quantity) AS qty, SUM(oi.total_price) AS value
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN business_years byr ON date(o.order_date) BETWEEN date(byr.start_date) AND date(byr.end_date)
        WHERE o.status = 'Completed'
        GROUP BY o.team_member_id, oi.product_id, byr.id
      ) actual ON v.team_member_id = actual.team_member_id
              AND v.product_id     = actual.product_id
              AND v.business_year_id = actual.business_year_id;
    `);
    db.exec(`
      DROP VIEW IF EXISTS view_team_performance;
      CREATE VIEW view_team_performance AS
      SELECT tm.id AS team_member_id, tm.name AS team_member_name, tm.role,
             COUNT(o.id) AS total_orders,
             SUM(CASE WHEN o.status='Completed' THEN 1 ELSE 0 END) AS completed_orders,
             COALESCE(SUM(CASE WHEN o.status='Completed' THEN o.total_amount ELSE 0.0 END),0.0) AS total_sales_value,
             COALESCE(AVG(CASE WHEN o.status='Completed' THEN o.total_amount ELSE NULL END),0.0) AS average_order_value
      FROM team_members tm
      LEFT JOIN orders o ON tm.id = o.team_member_id
      GROUP BY tm.id;
    `);
    db.exec(`
      DROP VIEW IF EXISTS view_monthly_sales;
      CREATE VIEW view_monthly_sales AS
      SELECT strftime('%Y-%m', o.order_date) AS sales_month,
             COUNT(o.id) AS total_orders,
             COALESCE(SUM(CASE WHEN o.status='Completed' THEN o.total_amount ELSE 0.0 END),0.0) AS total_sales
      FROM orders o
      WHERE o.status = 'Completed'
      GROUP BY sales_month;
    `);
    log('Views recreated.');
  } catch(e) {
    log('VIEW ERROR: '+e.message);
  }

  // VERIFICATION
  log('\n====== VERIFICATION ======');
  const db2=new Database(dbPath,{readonly:true});

  log('\n1. orders FK check:');
  const sql2 = db2.prepare("SELECT sql FROM sqlite_master WHERE name='orders'").get();
  const stillCorrupt = sql2 && sql2.sql && sql2.sql.includes('_temp');
  log('   Still has _temp refs: '+stillCorrupt);
  if (!stillCorrupt) log('   ✓ orders FK CLEAN');

  log('\n2. PRAGMA foreign_key_check:');
  try {
    const fkErrors = db2.prepare('PRAGMA foreign_key_check').all();
    if (fkErrors.length===0) log('   ✓ No FK violations');
    else fkErrors.forEach(e=>log('   FK VIOLATION: '+JSON.stringify(e)));
  } catch(e){ log('   FK check error: '+e.message); }

  log('\n3. Row counts:');
  log('   orders: '+db2.prepare('SELECT COUNT(*) as c FROM orders').get().c);
  log('   order_items: '+db2.prepare('SELECT COUNT(*) as c FROM order_items').get().c);

  log('\n4. Test INSERT simulation:');
  try {
    const db3=new Database(dbPath);
    db3.pragma('foreign_keys = ON');
    // Test prepare (same as what OrderRepository.create does at line 140)
    db3.prepare(`
      INSERT INTO orders (order_number, order_date, team_member_id, doctor_id,
        institution_id, area_id, status, remarks, created_by, submitted_at, import_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    log('   ✓ INSERT INTO orders prepare: OK (no areas_temp error)');
    db3.close();
  } catch(e) { log('   INSERT prepare ERROR: '+e.message); }

  log('\n5. Views:');
  ['view_sales_summary','view_target_achievements','view_team_performance','view_monthly_sales']
    .forEach(v=>{
      try { db2.prepare(`SELECT COUNT(*) as c FROM ${v}`).get(); log(`   ✓ ${v}: OK`); }
      catch(e) { log(`   ✗ ${v}: ${e.message}`); }
    });

  db2.close();
  db.close();
  log('\n====== REPAIR COMPLETE ======\n');
  app.quit();
});
