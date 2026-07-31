const logger = require('../logger.cjs');

function mapCategoryToDivisionAndGroup(oldCategory) {
  const cat = (oldCategory || '').trim().toLowerCase();
  
  if (cat.includes('onco') || cat.includes('cancer') || cat.includes('chemo')) {
    return { division: 'Oncology', group: 'General' };
  }
  
  return { division: 'Cardiology', group: 'General' };
}

function applySchema(db) {
  logger.info('Applying database schema (tables, indices, views, triggers)...');

  // ─── Phase 1: Tables + Indexes only ─────────────────────────────────────────
  // Must run BEFORE migrations, so that all non-products tables are created
  // first. Views and triggers (which reference products.status etc.) run AFTER
  // the products table has been migrated to the current schema.
  const tablesSql = `
    -- Tables
    CREATE TABLE IF NOT EXISTS business_years (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year_name TEXT NOT NULL UNIQUE,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CHECK (date(start_date) <= date(end_date))
    );
    CREATE INDEX IF NOT EXISTS idx_business_years_active ON business_years(is_active);

    CREATE TABLE IF NOT EXISTS unit_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS divisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      division_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (division_id) REFERENCES divisions (id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_groups_active ON groups(is_active);

    CREATE TABLE IF NOT EXISTS products (
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
      -- Generated/Virtual columns for backward compatibility
      name TEXT GENERATED ALWAYS AS (brand_name) STORED,
      code TEXT GENERATED ALWAYS AS (product_code) STORED,
      pack_price REAL GENERATED ALWAYS AS (tp) STORED,
      pack_size_qty INTEGER GENERATED ALWAYS AS (pack_size) STORED,
      per_unit_price REAL GENERATED ALWAYS AS (tp / CAST(pack_size AS REAL)) STORED,
      is_active INTEGER GENERATED ALWAYS AS (CASE WHEN status = 'Active' THEN 1 ELSE 0 END) STORED,
      FOREIGN KEY (division_id) REFERENCES divisions (id) ON DELETE RESTRICT,
      FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE RESTRICT,
      FOREIGN KEY (unit_type_id) REFERENCES unit_types (id) ON DELETE RESTRICT
    );
    -- Note: product indexes (idx_products_status, idx_products_code) are created
    -- by the migration blocks below, since they reference columns not in v1 schema.

    CREATE TABLE IF NOT EXISTS areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      city TEXT,
      region TEXT,
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_areas_active ON areas(is_active);

    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      area_id INTEGER,
      notes TEXT,
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (area_id) REFERENCES areas (id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(is_active);

    CREATE TABLE IF NOT EXISTS doctors (
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
      FOREIGN KEY (area_id) REFERENCES areas (id) ON DELETE RESTRICT
    );
    CREATE INDEX IF NOT EXISTS idx_doctors_active ON doctors(is_active);

    CREATE TABLE IF NOT EXISTS institutions (
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
      FOREIGN KEY (area_id) REFERENCES areas (id) ON DELETE RESTRICT
    );
    CREATE INDEX IF NOT EXISTS idx_institutions_active ON institutions(is_active);

    CREATE TABLE IF NOT EXISTS product_targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_year_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      annual_target_qty INTEGER NOT NULL CHECK (annual_target_qty >= 0),
      areas_distribution TEXT NOT NULL, -- JSON string storing the Area -> Team Member split tree
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_year_id) REFERENCES business_years (id) ON DELETE RESTRICT,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
      UNIQUE (business_year_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      order_date TEXT NOT NULL,
      team_member_id INTEGER NOT NULL,
      doctor_id INTEGER,
      institution_id INTEGER,
      area_id INTEGER NOT NULL,
      total_amount REAL NOT NULL DEFAULT 0.0 CHECK (total_amount >= 0.0),
      status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending', 'Approved', 'Completed', 'Cancelled')),
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
      FOREIGN KEY (doctor_id) REFERENCES doctors (id) ON DELETE SET NULL,
      FOREIGN KEY (institution_id) REFERENCES institutions (id) ON DELETE SET NULL,
      FOREIGN KEY (area_id) REFERENCES areas (id) ON DELETE RESTRICT
    );
    CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
    CREATE INDEX IF NOT EXISTS idx_orders_member ON orders(team_member_id);

    CREATE TABLE IF NOT EXISTS order_items (
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

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      group_name TEXT NOT NULL DEFAULT 'general',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      is_done INTEGER NOT NULL DEFAULT 0 CHECK (is_done IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      reminder_time TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'meeting',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      action TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      performed_by TEXT NOT NULL,
      performed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ip_or_device TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_audit_performed_at ON audit_logs(performed_at);
    CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_logs(module);
    CREATE INDEX IF NOT EXISTS idx_audit_performed_by ON audit_logs(performed_by);
    CREATE INDEX IF NOT EXISTS idx_audit_entity_type ON audit_logs(entity_type);
  `;

  db.exec(tablesSql);
  logger.info('Phase 1: Tables and indexes applied.');

  // ─── Phase 2: Product migration (must run BEFORE views/triggers) ─────────────
  // (Migration code follows below, then views/triggers are applied in Phase 3.)

  // ─── Phase 3: Views + Triggers ───────────────────────────────────────────────
  // Deferred until AFTER migration so views can reference the correct columns.
  const viewsTriggersSql = `
    -- Views
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

    DROP VIEW IF EXISTS view_monthly_sales;
    CREATE VIEW view_monthly_sales AS
    SELECT 
      strftime('%Y-%m', o.order_date) AS sales_month,
      COUNT(o.id) AS total_orders,
      COALESCE(SUM(CASE WHEN o.status = 'Completed' THEN o.total_amount ELSE 0.0 END), 0.0) AS total_sales
    FROM orders o
    WHERE o.status = 'Completed'
    GROUP BY sales_month;

    -- Triggers
    DROP TRIGGER IF EXISTS trg_business_years_updated;
    CREATE TRIGGER trg_business_years_updated 
      AFTER UPDATE ON business_years
      FOR EACH ROW
      BEGIN
        UPDATE business_years 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = NEW.id;
      END;

    DROP TRIGGER IF EXISTS trg_unit_types_updated;
    CREATE TRIGGER trg_unit_types_updated 
      AFTER UPDATE ON unit_types
      FOR EACH ROW
      BEGIN
        UPDATE unit_types 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = NEW.id;
      END;

    DROP TRIGGER IF EXISTS trg_divisions_updated;
    CREATE TRIGGER trg_divisions_updated 
      AFTER UPDATE ON divisions
      FOR EACH ROW
      BEGIN
        UPDATE divisions 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = NEW.id;
      END;

    DROP TRIGGER IF EXISTS trg_groups_updated;
    CREATE TRIGGER trg_groups_updated 
      AFTER UPDATE ON groups
      FOR EACH ROW
      BEGIN
        UPDATE groups 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = NEW.id;
      END;

    DROP TRIGGER IF EXISTS trg_products_updated;
    CREATE TRIGGER trg_products_updated 
      AFTER UPDATE ON products
      FOR EACH ROW
      BEGIN
        UPDATE products 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = NEW.id;
      END;

    DROP TRIGGER IF EXISTS trg_areas_updated;
    CREATE TRIGGER trg_areas_updated 
      AFTER UPDATE ON areas
      FOR EACH ROW
      BEGIN
        UPDATE areas 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = NEW.id;
      END;

    DROP TRIGGER IF EXISTS trg_team_members_updated;
    CREATE TRIGGER trg_team_members_updated 
      AFTER UPDATE ON team_members
      FOR EACH ROW
      BEGIN
        UPDATE team_members 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = NEW.id;
      END;

    DROP TRIGGER IF EXISTS trg_doctors_updated;
    CREATE TRIGGER trg_doctors_updated 
      AFTER UPDATE ON doctors
      FOR EACH ROW
      BEGIN
        UPDATE doctors 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = NEW.id;
      END;

    DROP TRIGGER IF EXISTS trg_institutions_updated;
    CREATE TRIGGER trg_institutions_updated 
      AFTER UPDATE ON institutions
      FOR EACH ROW
      BEGIN
        UPDATE institutions 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = NEW.id;
      END;

    DROP TRIGGER IF EXISTS trg_product_targets_updated;
    CREATE TRIGGER trg_product_targets_updated 
      AFTER UPDATE ON product_targets
      FOR EACH ROW
      BEGIN
        UPDATE product_targets 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = NEW.id;
      END;

    DROP TRIGGER IF EXISTS trg_orders_updated;
    CREATE TRIGGER trg_orders_updated 
      AFTER UPDATE ON orders
      FOR EACH ROW
      BEGIN
        UPDATE orders 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = NEW.id;
      END;

    DROP TRIGGER IF EXISTS trg_order_items_updated;
    CREATE TRIGGER trg_order_items_updated 
      AFTER UPDATE ON order_items
      FOR EACH ROW
      BEGIN
        UPDATE order_items 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = NEW.id;
      END;

    DROP TRIGGER IF EXISTS trg_settings_updated;
    CREATE TRIGGER trg_settings_updated 
      AFTER UPDATE ON settings
      FOR EACH ROW
      BEGIN
        UPDATE settings 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = NEW.id;
      END;

    DROP TRIGGER IF EXISTS trg_order_items_insert;
    CREATE TRIGGER trg_order_items_insert 
    AFTER INSERT ON order_items
    FOR EACH ROW
    BEGIN
      UPDATE orders 
      SET total_amount = (SELECT COALESCE(SUM(total_price), 0.0) FROM order_items WHERE order_id = NEW.order_id)
      WHERE id = NEW.order_id;
    END;

    DROP TRIGGER IF EXISTS trg_order_items_update;
    CREATE TRIGGER trg_order_items_update 
    AFTER UPDATE ON order_items
    FOR EACH ROW
    BEGIN
      UPDATE orders 
      SET total_amount = (SELECT COALESCE(SUM(total_price), 0.0) FROM order_items WHERE order_id = NEW.order_id)
      WHERE id = NEW.order_id;
    END;

    DROP TRIGGER IF EXISTS trg_order_items_delete;
    CREATE TRIGGER trg_order_items_delete 
    AFTER DELETE ON order_items
    FOR EACH ROW
    BEGIN
      UPDATE orders 
      SET total_amount = (SELECT COALESCE(SUM(total_price), 0.0) FROM order_items WHERE order_id = OLD.order_id)
      WHERE id = OLD.order_id;
    END;

    DROP TRIGGER IF EXISTS trg_product_targets_validate_insert;
    CREATE TRIGGER trg_product_targets_validate_insert
    BEFORE INSERT ON product_targets
    FOR EACH ROW
    BEGIN
      SELECT CASE 
        WHEN (
          SELECT COALESCE(SUM(CAST(json_extract(area.value, '$.percentage') AS REAL)), 0.0)
          FROM json_each(NEW.areas_distribution) area
        ) != 100.0 THEN
          RAISE(ABORT, 'Validation Error: Total Area percentages must sum to exactly 100%.')
      END;

      SELECT CASE 
        WHEN EXISTS (
          SELECT 1
          FROM json_each(NEW.areas_distribution) area
          WHERE (
            SELECT COALESCE(SUM(CAST(json_extract(tm.value, '$.percentage') AS REAL)), 0.0)
            FROM json_each(json_extract(area.value, '$.teamMembers')) tm
          ) != 100.0
        ) THEN
          RAISE(ABORT, 'Validation Error: Team Member percentages inside each Area must sum to exactly 100%.')
      END;
    END;

    DROP TRIGGER IF EXISTS trg_product_targets_validate_update;
    CREATE TRIGGER trg_product_targets_validate_update
    BEFORE UPDATE ON product_targets
    FOR EACH ROW
    BEGIN
      SELECT CASE 
        WHEN (
          SELECT COALESCE(SUM(CAST(json_extract(area.value, '$.percentage') AS REAL)), 0.0)
          FROM json_each(NEW.areas_distribution) area
        ) != 100.0 THEN
          RAISE(ABORT, 'Validation Error: Total Area percentages must sum to exactly 100%.')
      END;

      SELECT CASE 
        WHEN EXISTS (
          SELECT 1
          FROM json_each(NEW.areas_distribution) area
          WHERE (
            SELECT COALESCE(SUM(CAST(json_extract(tm.value, '$.percentage') AS REAL)), 0.0)
            FROM json_each(json_extract(area.value, '$.teamMembers')) tm
          ) != 100.0
        ) THEN
          RAISE(ABORT, 'Validation Error: Team Member percentages inside each Area must sum to exactly 100%.')
      END;
    END;
  `;
  // NOTE: viewsTriggersSql will be executed AFTER product migration below (Phase 3).

  // ─── Phase 2a: Simple column migrations (ADD COLUMN — safe to run any time) ──
  const tablesToMigrate = {
    institutions: ['city', 'notes'],
    doctors: ['hospital', 'city', 'notes']
  };

  for (const [table, columns] of Object.entries(tablesToMigrate)) {
    for (const column of columns) {
      try {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} TEXT`);
        logger.info(`Database Migration: Added column '${column}' to table '${table}'.`);
      } catch (e) {
        // Ignored if column already exists
      }
    }
  }

  // Seed divisions if missing
  const stmtDiv = db.prepare('INSERT OR IGNORE INTO divisions (name) VALUES (?)');
  ['Himmel', 'PMS', 'MSA'].forEach(name => stmtDiv.run(name));

  // Check if products table needs migration from old schema
  let needMigration = false;
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='products'").get();
  if (tableCheck) {
    const cols = db.prepare("PRAGMA table_info(products)").all();
    const hasPackPrice = cols.some(c => c.name === 'pack_price');
    const hasBrandName = cols.some(c => c.name === 'brand_name');
    if (hasPackPrice && !hasBrandName) {
      needMigration = true;
    }
  }

  if (needMigration) {
    logger.info('Database Migration: Old products schema (v1) detected. Starting migration to v2...');
    
    // Step 1: Rename old table (DDL must run outside transaction in better-sqlite3)
    db.exec("ALTER TABLE products RENAME TO products_old;");
    
    // Step 2: Create new products table
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
        name TEXT GENERATED ALWAYS AS (brand_name) STORED,
        code TEXT GENERATED ALWAYS AS (product_code) STORED,
        pack_price REAL GENERATED ALWAYS AS (tp) STORED,
        pack_size_qty INTEGER GENERATED ALWAYS AS (pack_size) STORED,
        per_unit_price REAL GENERATED ALWAYS AS (tp / CAST(pack_size AS REAL)) STORED,
        is_active INTEGER GENERATED ALWAYS AS (CASE WHEN status = 'Active' THEN 1 ELSE 0 END) STORED,
        FOREIGN KEY (division_id) REFERENCES divisions (id) ON DELETE RESTRICT,
        FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE RESTRICT,
        FOREIGN KEY (unit_type_id) REFERENCES unit_types (id) ON DELETE RESTRICT
      );
    `);
    
    // Step 3: Create indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
      CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code);
    `);

    // Step 4: Migrate existing data (DML — wrap in transaction for atomicity)
    db.transaction(() => {
      const oldProducts = db.prepare("SELECT * FROM products_old").all();
      const insertStmt = db.prepare(`
        INSERT INTO products (
          id, division_id, group_id, product_code, brand_name,
          generic_name, strength, dosage_form, registration_no, manufacturer,
          pack_size, unit_type_id, tp, mrp, description, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const op of oldProducts) {
        const mapped = mapCategoryToDivisionAndGroup(op.category);
        
        let divRow = db.prepare("SELECT id FROM divisions WHERE name = ?").get(mapped.division);
        if (!divRow) {
          const res = db.prepare("INSERT INTO divisions (name) VALUES (?)").run(mapped.division);
          divRow = { id: res.lastInsertRowid };
        }
        
        let groupRow = db.prepare("SELECT id FROM groups WHERE division_id = ? AND name = ?").get(divRow.id, mapped.group);
        if (!groupRow) {
          const res = db.prepare("INSERT INTO groups (division_id, name, description) VALUES (?, ?, ?)").run(
            divRow.id,
            mapped.group,
            `Migrated from old category '${op.category}'`
          );
          groupRow = { id: res.lastInsertRowid };
        }
        
        insertStmt.run(
          op.id,
          divRow.id,
          groupRow.id,
          op.code,
          op.name,
          null, // generic_name
          null, // strength
          null, // dosage_form
          null, // registration_no
          'Himmel Pharmaceutical', // manufacturer
          op.pack_size_qty,
          op.unit_type_id,
          op.pack_price, // tp
          op.pack_price, // mrp
          op.description || '',
          op.is_active === 0 ? 'Inactive' : 'Active',
          op.created_at,
          op.updated_at
        );
      }
    })();

    // Step 5: Drop old table and cleanup
    db.exec("DROP TABLE IF EXISTS products_old;");
    db.exec("DROP TABLE IF EXISTS product_categories;");
    logger.info('Database Migration: v1→v2 products table migration completed successfully. ' + 
                'All existing products preserved with auto-mapped divisions and groups.');
  }


  // Check if products table needs Sprint 2 schema upgrade
  let needSprint2Upgrade = false;
  const productsInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='products'").get();
  if (productsInfo) {
    const sql = productsInfo.sql;
    if (sql.includes('brand_name TEXT NOT NULL UNIQUE') || !sql.includes("'Discontinued'") || !sql.includes('registration_no TEXT UNIQUE')) {
      needSprint2Upgrade = true;
    }
  }

  if (needSprint2Upgrade) {
    logger.info('Database Migration: Sprint 2 products schema upgrade: removing brand_name UNIQUE, adding registration_no UNIQUE, adding Discontinued status.');
    
    // DDL must run OUTSIDE better-sqlite3 transaction
    db.exec("ALTER TABLE products RENAME TO products_temp;");
    
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
        name TEXT GENERATED ALWAYS AS (brand_name) STORED,
        code TEXT GENERATED ALWAYS AS (product_code) STORED,
        pack_price REAL GENERATED ALWAYS AS (tp) STORED,
        pack_size_qty INTEGER GENERATED ALWAYS AS (pack_size) STORED,
        per_unit_price REAL GENERATED ALWAYS AS (tp / CAST(pack_size AS REAL)) STORED,
        is_active INTEGER GENERATED ALWAYS AS (CASE WHEN status = 'Active' THEN 1 ELSE 0 END) STORED,
        FOREIGN KEY (division_id) REFERENCES divisions (id) ON DELETE RESTRICT,
        FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE RESTRICT,
        FOREIGN KEY (unit_type_id) REFERENCES unit_types (id) ON DELETE RESTRICT
      );
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
      CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code);
    `);

    // DML — copy data inside transaction for atomicity
    db.transaction(() => {
      db.prepare(`
        INSERT INTO products (
          id, division_id, group_id, product_code, brand_name,
          generic_name, strength, dosage_form, registration_no, manufacturer,
          pack_size, unit_type_id, tp, mrp, description, status, created_at, updated_at
        )
        SELECT 
          id, division_id, group_id, product_code, brand_name,
          generic_name, strength, dosage_form, NULLIF(registration_no, ''), manufacturer,
          pack_size, unit_type_id, tp, mrp, description, status, created_at, updated_at
        FROM products_temp
      `).run();
    })();

    db.exec("DROP TABLE products_temp;");
    logger.info('Database Migration: Sprint 2 products schema upgrade completed successfully.');
  }

  // ─── Phase 15 Sprint 1: Orders Workflow Migration ───────────────────────────────────
  let needOrdersWorkflowUpgrade = false;
  const ordersInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='orders'").get();
  if (ordersInfo) {
    const sql = ordersInfo.sql;
    if (!sql.includes("'Draft'") || !sql.includes('created_by') || !sql.includes('cancel_reason')) {
      needOrdersWorkflowUpgrade = true;
    }
  }

  if (needOrdersWorkflowUpgrade) {
    logger.info('Database Migration: Phase 15 Sprint 1 orders schema upgrade (adding Draft status, workflow tracking fields).');
    
    db.exec("ALTER TABLE orders RENAME TO orders_temp;");
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
        status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending', 'Approved', 'Completed', 'Cancelled')),
        created_by TEXT,
        submitted_at TEXT,
        approved_by TEXT,
        approved_at TEXT,
        completed_by TEXT,
        completed_at TEXT,
        cancelled_by TEXT,
        cancelled_at TEXT,
        cancel_reason TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        import_id TEXT,
        FOREIGN KEY (team_member_id) REFERENCES team_members (id) ON DELETE RESTRICT,
        FOREIGN KEY (doctor_id) REFERENCES doctors (id) ON DELETE SET NULL,
        FOREIGN KEY (institution_id) REFERENCES institutions (id) ON DELETE SET NULL,
        FOREIGN KEY (area_id) REFERENCES areas (id) ON DELETE RESTRICT
      );
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
      CREATE INDEX IF NOT EXISTS idx_orders_member ON orders(team_member_id);
    `);

    db.transaction(() => {
      const oldCols = db.prepare("PRAGMA table_info(orders_temp)").all().map(c => c.name);
      if (oldCols.includes('created_by')) {
        db.prepare("INSERT INTO orders SELECT * FROM orders_temp").run();
      } else {
        const importIdCol = oldCols.includes('import_id') ? 'import_id' : 'NULL';
        db.prepare(`
          INSERT INTO orders (
            id, order_number, order_date, team_member_id, doctor_id, institution_id, area_id,
            total_amount, status, created_at, updated_at, import_id,
            submitted_at, approved_at, completed_at
          )
          SELECT 
            id, order_number, order_date, team_member_id, doctor_id, institution_id, area_id,
            total_amount, status, created_at, updated_at, ${importIdCol},
            CASE WHEN status IN ('Pending', 'Approved', 'Completed') THEN created_at ELSE NULL END,
            CASE WHEN status IN ('Approved', 'Completed') THEN updated_at ELSE NULL END,
            CASE WHEN status = 'Completed' THEN updated_at ELSE NULL END
          FROM orders_temp
        `).run();
      }
    })();

    db.exec("DROP TABLE orders_temp;");
    logger.info('Database Migration: Phase 15 Sprint 1 orders schema migration completed successfully.');
  }

  // ─── Phase 3: Views + Triggers ───────────────────────────────────────────────
  // Clean up any stale views/triggers in sqlite_master referencing products_old, products_temp, or orders_temp
  try {
    const legacyObjects = db.prepare("SELECT type, name FROM sqlite_master WHERE sql LIKE '%products_old%' OR sql LIKE '%products_temp%' OR sql LIKE '%orders_temp%'").all();
    for (const obj of legacyObjects) {
      logger.info(`Database Migration: Dropping legacy ${obj.type} '${obj.name}' referencing old table...`);
      db.exec(`DROP ${obj.type.toUpperCase()} IF EXISTS ${obj.name}`);
    }
  } catch (e) {
    logger.warn('Error cleaning up legacy objects:', e.message);
  }

  // Ensure old migration tables are completely dropped
  try { db.exec("DROP TABLE IF EXISTS products_old;"); } catch(e) {}
  try { db.exec("DROP TABLE IF EXISTS products_temp;"); } catch(e) {}
  try { db.exec("DROP TABLE IF EXISTS orders_temp;"); } catch(e) {}

  // ─── Phase 20.5: Master Data Simplification & Schema Migrations ───────────
  try {
    // 1. Division Migration: Keep ONLY Cardiology and Oncology
    db.exec("INSERT OR IGNORE INTO divisions (name) VALUES ('Cardiology');");
    db.exec("INSERT OR IGNORE INTO divisions (name) VALUES ('Oncology');");
    
    const cardDiv = db.prepare("SELECT id FROM divisions WHERE name = 'Cardiology'").get();
    const oncDiv = db.prepare("SELECT id FROM divisions WHERE name = 'Oncology'").get();
    
    if (cardDiv) {
      db.prepare("UPDATE groups SET division_id = ? WHERE division_id NOT IN (?, ?)").run(cardDiv.id, cardDiv.id, oncDiv ? oncDiv.id : cardDiv.id);
      db.prepare("UPDATE products SET division_id = ? WHERE division_id NOT IN (?, ?)").run(cardDiv.id, cardDiv.id, oncDiv ? oncDiv.id : cardDiv.id);
      db.prepare("DELETE FROM divisions WHERE name NOT IN ('Cardiology', 'Oncology')").run();
    }
  } catch (e) {
    logger.warn('Phase 20.5 Division migration error:', e.message);
  }

  try {
    // 2. Areas table migrations
    db.exec("ALTER TABLE areas ADD COLUMN city TEXT;");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE areas ADD COLUMN region TEXT;");
  } catch (e) {}

  // ─── Phase 20.5.2: Master Data Schema Refactor (Column Removals) ───────────
  try {
    db.pragma('foreign_keys = OFF');
    db.exec("DROP VIEW IF EXISTS view_sales_summary;");
    db.exec("DROP VIEW IF EXISTS view_team_member_targets;");
    db.exec("DROP VIEW IF EXISTS view_target_achievements;");
    db.exec("DROP VIEW IF EXISTS view_team_performance;");
    db.exec("DROP VIEW IF EXISTS view_monthly_sales;");

    const dropColumnSafely = (table, col) => {
      try {
        const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
        if (cols.includes(col)) {
          db.exec(`ALTER TABLE ${table} DROP COLUMN ${col}`);
          logger.info(`Database Migration: Dropped column '${col}' from table '${table}'.`);
        }
      } catch (e) {
        // Ignored if drop column fails or not supported (e.g. NOT NULL columns need table rebuild)
      }
    };

    // ── 1. AREAS ──────────────────────────────────────────────────────────────
    // Always reconstruct if 'code' or 'area_code' column exists — regardless of
    // NOT NULL status — to fully purge it. Old schema had code TEXT NOT NULL
    // which causes INSERT failures when creating areas without a code value.
    try {
      const areaCols = db.prepare("PRAGMA table_info(areas)").all();
      const areaColNames = areaCols.map(c => c.name);
      const needsRebuild = areaColNames.includes('code') || areaColNames.includes('area_code');

      if (needsRebuild) {
        const codeCol = areaCols.find(c => c.name === 'code');
        logger.info(`Database Migration: Rebuilding areas table (code present, notnull=${codeCol ? codeCol.notnull : 'n/a'})...`);
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
        const tCols  = db.prepare("PRAGMA table_info(areas_temp)").all().map(c => c.name);
        const cityE  = tCols.includes('city')        ? 'city'        : 'NULL';
        const regionE = tCols.includes('region')     ? 'region'      : 'NULL';
        const descE  = tCols.includes('description') ? 'description' : 'NULL';
        db.transaction(() => {
          db.prepare(`
            INSERT INTO areas (id, name, city, region, description, is_active, created_at, updated_at)
            SELECT id, name, ${cityE}, ${regionE}, ${descE}, is_active, created_at, updated_at
            FROM areas_temp
          `).run();
        })();
        db.exec("DROP TABLE areas_temp;");
        logger.info('Database Migration: areas table rebuilt successfully — code column removed.');
      } else {
        logger.info('Database Migration: areas table already clean, skipping rebuild.');
      }
    } catch (e) {
      logger.warn('Error migrating areas table:', e.message);
    }

    // ── 2. DOCTORS ───────────────────────────────────────────────────────────
    // Must reconstruct if any legacy column exists OR if area_id is NOT NULL
    // (must be nullable so doctors can be saved without an area).
    try {
      const docCols = db.prepare("PRAGMA table_info(doctors)").all();
      const docColNames = docCols.map(c => c.name);
      const areaIdCol = docCols.find(c => c.name === 'area_id');
      const hasLegacy = ['doctor_code','mobile_number','email','address','phone']
                          .some(lc => docColNames.includes(lc));
      const areaIdNotNull = areaIdCol && areaIdCol.notnull === 1;

      if (hasLegacy || areaIdNotNull) {
        logger.info(`Database Migration: Rebuilding doctors table (legacy=${hasLegacy}, area_id_notnull=${areaIdNotNull})...`);
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
        const tCols  = db.prepare("PRAGMA table_info(doctors_temp)").all().map(c => c.name);
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
        logger.info('Database Migration: doctors table rebuilt successfully.');
      } else {
        logger.info('Database Migration: doctors table already clean, skipping rebuild.');
      }
    } catch (e) {
      logger.warn('Error migrating doctors table:', e.message);
    }

    // ── 3. INSTITUTIONS ──────────────────────────────────────────────────────
    // Must reconstruct if address, contact_person, contact_number exist
    // OR if area_id is NOT NULL.
    try {
      const instCols = db.prepare("PRAGMA table_info(institutions)").all();
      const instColNames = instCols.map(c => c.name);
      const areaIdCol = instCols.find(c => c.name === 'area_id');
      const hasLegacy = ['address','contact_person','contact_number']
                          .some(lc => instColNames.includes(lc));
      const areaIdNotNull = areaIdCol && areaIdCol.notnull === 1;

      if (hasLegacy || areaIdNotNull) {
        logger.info(`Database Migration: Rebuilding institutions table (legacy=${hasLegacy}, area_id_notnull=${areaIdNotNull})...`);
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
        const tCols  = db.prepare("PRAGMA table_info(institutions_temp)").all().map(c => c.name);
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
        logger.info('Database Migration: institutions table rebuilt successfully.');
      } else {
        logger.info('Database Migration: institutions table already clean, skipping rebuild.');
      }
    } catch (e) {
      logger.warn('Error migrating institutions table:', e.message);
    }

    // ── 4. TEAM MEMBERS ──────────────────────────────────────────────────────
    // Must reconstruct if email, phone, employee_id, joining_date, address exist.
    try {
      const tmCols = db.prepare("PRAGMA table_info(team_members)").all().map(c => c.name);
      const hasLegacy = ['email','phone','employee_id','joining_date','address']
                          .some(lc => tmCols.includes(lc));

      if (hasLegacy) {
        logger.info('Database Migration: Rebuilding team_members table...');
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
        const tCols  = db.prepare("PRAGMA table_info(team_members_temp)").all().map(c => c.name);
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
        logger.info('Database Migration: team_members table rebuilt successfully.');
      } else {
        logger.info('Database Migration: team_members table already clean, skipping rebuild.');
      }
    } catch (e) {
      logger.warn('Error migrating team_members table:', e.message);
    }

    // ── 5. GROUPS ────────────────────────────────────────────────────────────
    // Try direct DROP COLUMN first; fall back to table rebuild if needed.
    try {
      dropColumnSafely('groups', 'code');
      dropColumnSafely('groups', 'group_code');

      const groupCols = db.prepare("PRAGMA table_info(groups)").all().map(c => c.name);
      if (groupCols.includes('code') || groupCols.includes('group_code')) {
        logger.info('Database Migration: Rebuilding groups table...');
        db.exec("DROP TABLE IF EXISTS groups_temp;");
        db.exec("ALTER TABLE groups RENAME TO groups_temp;");
        db.exec(`
          CREATE TABLE groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            division_id INTEGER,
            name TEXT NOT NULL,
            description TEXT,
            is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (division_id) REFERENCES divisions (id) ON DELETE CASCADE
          );
        `);
        db.exec("CREATE INDEX IF NOT EXISTS idx_groups_active ON groups(is_active);");
        const tCols = db.prepare("PRAGMA table_info(groups_temp)").all().map(c => c.name);
        const divE  = tCols.includes('division_id') ? 'division_id' : 'NULL';
        const descE = tCols.includes('description') ? 'description' : 'NULL';
        db.transaction(() => {
          db.prepare(`
            INSERT INTO groups (id, division_id, name, description, is_active, created_at, updated_at)
            SELECT id, ${divE}, name, ${descE}, is_active, created_at, updated_at
            FROM groups_temp
          `).run();
        })();
        db.exec("DROP TABLE groups_temp;");
        logger.info('Database Migration: groups table rebuilt successfully.');
      } else {
        logger.info('Database Migration: groups table already clean, skipping rebuild.');
      }
    } catch (e) {
      logger.warn('Error migrating groups table:', e.message);
    }
  } finally {
    try { db.pragma('foreign_keys = ON'); } catch(e) {}
  }

  // ─── Phase 20.5.5: Groups division_id nullable migration ─────────────────
  // groups.division_id was NOT NULL in the original schema — must rebuild
  // so that groups can be created without an assigned division.
  try {
    db.pragma('foreign_keys = OFF');
    db.exec('DROP VIEW IF EXISTS view_sales_summary;');
    db.exec('DROP VIEW IF EXISTS view_team_member_targets;');
    db.exec('DROP VIEW IF EXISTS view_target_achievements;');
    db.exec('DROP VIEW IF EXISTS view_team_performance;');
    db.exec('DROP VIEW IF EXISTS view_monthly_sales;');

    const groupCols = db.prepare('PRAGMA table_info(groups)').all();
    const divColInfo = groupCols.find(c => c.name === 'division_id');
    if (divColInfo && divColInfo.notnull === 1) {
      logger.info('Database Migration Phase 20.5.5: Rebuilding groups table — making division_id nullable...');
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
      const tCols = db.prepare('PRAGMA table_info(groups_temp)').all().map(c => c.name);
      const divE  = tCols.includes('division_id') ? 'division_id' : 'NULL';
      const descE = tCols.includes('description') ? 'description' : 'NULL';
      db.transaction(() => {
        db.prepare(`
          INSERT INTO groups (id, division_id, name, description, is_active, created_at, updated_at)
          SELECT id, ${divE}, name, ${descE}, is_active, created_at, updated_at
          FROM groups_temp
        `).run();
      })();
      db.exec('DROP TABLE groups_temp;');
      logger.info('Database Migration Phase 20.5.5: groups table rebuilt — division_id is now nullable.');
    } else {
      logger.info('Database Migration Phase 20.5.5: groups.division_id already nullable, skipping rebuild.');
    }
  } catch (e) {
    logger.warn('Phase 20.5.5 Error migrating groups table:', e.message);
  } finally {
    try { db.pragma('foreign_keys = ON'); } catch(e) {}
  }

  try {
    // 3. Team members table migrations
    db.exec("ALTER TABLE team_members ADD COLUMN notes TEXT;");
  } catch (e) {}

  // ─── Phase 20.5.6: Repair orders table FK corruption ─────────────────────
  // SQLite automatically rewrites FK definitions when a referenced table is
  // renamed (ALTER TABLE x RENAME TO x_temp). If the migrated table is then
  // recreated and x_temp is dropped, orders still references "areas_temp",
  // "team_members_temp" etc. — causing "no such table: main.areas_temp" on
  // every INSERT INTO orders.
  try {
    db.pragma('foreign_keys = OFF');
    db.exec('DROP VIEW IF EXISTS view_sales_summary;');
    db.exec('DROP VIEW IF EXISTS view_team_member_targets;');
    db.exec('DROP VIEW IF EXISTS view_target_achievements;');
    db.exec('DROP VIEW IF EXISTS view_team_performance;');
    db.exec('DROP VIEW IF EXISTS view_monthly_sales;');

    const ordersRow = db.prepare("SELECT sql FROM sqlite_master WHERE name='orders' AND type='table'").get();
    if (ordersRow && ordersRow.sql && ordersRow.sql.includes('_temp')) {
      logger.info('Database Migration Phase 20.5.6: orders table has corrupt FK references to _temp tables — rebuilding...');
      db.exec('DROP TABLE IF EXISTS orders_repair_temp;');
      db.exec('ALTER TABLE orders RENAME TO orders_repair_temp;');
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
          FOREIGN KEY (doctor_id)      REFERENCES doctors (id)      ON DELETE SET NULL,
          FOREIGN KEY (institution_id) REFERENCES institutions (id) ON DELETE SET NULL,
          FOREIGN KEY (area_id)        REFERENCES areas (id)        ON DELETE RESTRICT
        );
      `);
      const tCols = db.prepare("PRAGMA table_info(orders_repair_temp)").all().map(c => c.name);
      const keep = ['id','order_number','order_date','team_member_id','doctor_id','institution_id',
                    'area_id','total_amount','status','created_by','submitted_at','approved_by',
                    'approved_at','completed_by','completed_at','cancelled_by','cancelled_at',
                    'cancel_reason','remarks','created_at','updated_at','import_id'];
      const cols = keep.filter(c => tCols.includes(c)).join(', ');
      db.transaction(() => {
        db.prepare(`INSERT INTO orders (${cols}) SELECT ${cols} FROM orders_repair_temp`).run();
      })();
      db.exec('DROP TABLE orders_repair_temp;');
      logger.info('Database Migration Phase 20.5.6: orders table rebuilt with correct FK references.');
    } else {
      logger.info('Database Migration Phase 20.5.6: orders table FK references are clean, skipping rebuild.');
    }

    // Also check order_items
    const oiRow = db.prepare("SELECT sql FROM sqlite_master WHERE name='order_items' AND type='table'").get();
    if (oiRow && oiRow.sql && oiRow.sql.includes('_temp')) {
      logger.info('Database Migration Phase 20.5.6: order_items table has corrupt FK references — rebuilding...');
      db.exec('DROP TABLE IF EXISTS order_items_repair_temp;');
      db.exec('ALTER TABLE order_items RENAME TO order_items_repair_temp;');
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
      db.transaction(() => {
        db.prepare(`
          INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price, created_at, updated_at)
          SELECT id, order_id, product_id, quantity, unit_price, total_price, created_at, updated_at
          FROM order_items_repair_temp
        `).run();
      })();
      db.exec('DROP TABLE order_items_repair_temp;');
      logger.info('Database Migration Phase 20.5.6: order_items table rebuilt with correct FK references.');
    }

    // Rebuild orders indexes
    try { db.exec('CREATE INDEX IF NOT EXISTS idx_orders_date        ON orders(order_date);'); } catch(e){}
    try { db.exec('CREATE INDEX IF NOT EXISTS idx_orders_member      ON orders(team_member_id);'); } catch(e){}
    try { db.exec('CREATE INDEX IF NOT EXISTS idx_orders_status_date ON orders(status, order_date);'); } catch(e){}
    try { db.exec('CREATE INDEX IF NOT EXISTS idx_orders_area        ON orders(area_id);'); } catch(e){}
    try { db.exec('CREATE INDEX IF NOT EXISTS idx_orders_doctor      ON orders(doctor_id);'); } catch(e){}
    try { db.exec('CREATE INDEX IF NOT EXISTS idx_orders_institution ON orders(institution_id);'); } catch(e){}

    // Also fix products FK (may reference groups_temp after Phase 20.5.5 ran)
    const pRow = db.prepare("SELECT sql FROM sqlite_master WHERE name='products' AND type='table'").get();
    if (pRow && pRow.sql && pRow.sql.includes('_temp')) {
      logger.info('Database Migration Phase 20.5.6: products table has corrupt FK references — rebuilding...');
      // Drop all triggers first to avoid cascade errors
      ['trg_products_updated','trg_order_items_insert','trg_order_items_update',
       'trg_order_items_delete','trg_order_items_updated'].forEach(t => {
        try { db.exec(`DROP TRIGGER IF EXISTS ${t};`); } catch(e){}
      });
      db.exec('DROP TABLE IF EXISTS products_fix_temp;');
      db.exec('ALTER TABLE products RENAME TO products_fix_temp;');
      db.exec(`
        CREATE TABLE products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          division_id INTEGER NOT NULL,
          group_id INTEGER NOT NULL,
          product_code TEXT NOT NULL UNIQUE,
          brand_name TEXT NOT NULL,
          generic_name TEXT, strength TEXT, dosage_form TEXT,
          registration_no TEXT UNIQUE, manufacturer TEXT,
          pack_size INTEGER NOT NULL CHECK (pack_size > 0),
          unit_type_id INTEGER NOT NULL,
          tp REAL NOT NULL CHECK (tp >= 0.0),
          mrp REAL NOT NULL CHECK (mrp >= 0.0),
          description TEXT,
          status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Discontinued')),
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (division_id)  REFERENCES divisions (id)  ON DELETE RESTRICT,
          FOREIGN KEY (group_id)     REFERENCES groups (id)     ON DELETE RESTRICT,
          FOREIGN KEY (unit_type_id) REFERENCES unit_types (id) ON DELETE RESTRICT
        );
      `);
      const pCols = db.prepare('PRAGMA table_info(products_fix_temp)').all().map(c => c.name);
      const pKeep = ['id','division_id','group_id','product_code','brand_name','generic_name','strength',
                     'dosage_form','registration_no','manufacturer','pack_size','unit_type_id','tp','mrp',
                     'description','status','created_at','updated_at'];
      const pCols2 = pKeep.filter(c => pCols.includes(c)).join(', ');
      db.transaction(() => {
        db.prepare(`INSERT INTO products (${pCols2}) SELECT ${pCols2} FROM products_fix_temp`).run();
      })();
      db.exec('DROP TABLE products_fix_temp;');
      logger.info('Database Migration Phase 20.5.6: products table rebuilt.');
    }

    // Also fix product_targets FK (may reference products_fix_temp)
    const ptRow = db.prepare("SELECT sql FROM sqlite_master WHERE name='product_targets' AND type='table'").get();
    if (ptRow && ptRow.sql && ptRow.sql.includes('_temp')) {
      logger.info('Database Migration Phase 20.5.6: product_targets table has corrupt FK references — rebuilding...');
      ['trg_product_targets_updated','trg_product_targets_validate_insert','trg_product_targets_validate_update']
        .forEach(t => { try { db.exec(`DROP TRIGGER IF EXISTS ${t};`); } catch(e){} });
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
      const ptCols = db.prepare('PRAGMA table_info(pt_fix_temp)').all().map(c => c.name);
      const ptKeep = ['id','business_year_id','product_id','annual_target_qty','areas_distribution','notes','created_at','updated_at'];
      const ptCols2 = ptKeep.filter(c => ptCols.includes(c)).join(', ');
      db.transaction(() => {
        db.prepare(`INSERT INTO product_targets (${ptCols2}) SELECT ${ptCols2} FROM pt_fix_temp`).run();
      })();
      db.exec('DROP TABLE pt_fix_temp;');
      logger.info('Database Migration Phase 20.5.6: product_targets table rebuilt.');
    }

  } catch (e) {
    logger.warn('Phase 20.5.6 Error repairing orders FK:', e.message);
  } finally {
    try { db.pragma('foreign_keys = ON'); } catch(e) {}
  }

  // Runs LAST — after all products table migrations are complete so views can
  // safely reference products.status, products.tp, etc.
  db.exec(viewsTriggersSql);

  // Performance Indexes — created here to ensure all tables are in their final state
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)'); } catch(e) {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code)'); } catch(e) {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_orders_status_date ON orders(status, order_date)'); } catch(e) {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_orders_area ON orders(area_id)'); } catch(e) {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_orders_doctor ON orders(doctor_id)'); } catch(e) {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_orders_institution ON orders(institution_id)'); } catch(e) {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)'); } catch(e) {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id)'); } catch(e) {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_doctors_active ON doctors(is_active)'); } catch(e) {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_institutions_active ON institutions(is_active)'); } catch(e) {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(is_active)'); } catch(e) {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_product_targets_year ON product_targets(business_year_id)'); } catch(e) {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)'); } catch(e) {}

  logger.info('Phase 3: Views, triggers and indexes applied. Schema fully up to date.');
}

module.exports = { applySchema };
