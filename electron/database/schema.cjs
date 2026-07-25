const logger = require('../logger.cjs');

function mapCategoryToDivisionAndGroup(oldCategory) {
  const cat = (oldCategory || '').trim().toLowerCase();
  
  if (cat === 'himmel') return { division: 'Himmel', group: 'General' };
  if (cat === 'pms') return { division: 'PMS', group: 'General' };
  if (cat === 'msa') return { division: 'MSA', group: 'General' };
  
  if (['antibiotics', 'cardiac', 'gastro', 'gastroenterology', 'analgesics', 'antidiabetics', 'respiratory', 'dermatology', 'pediatrics', 'general'].includes(cat)) {
    const groupName = oldCategory.charAt(0).toUpperCase() + oldCategory.slice(1);
    return { division: 'Himmel', group: groupName };
  }
  
  if (['surgical', 'icu', 'critical care'].includes(cat)) {
    const groupName = oldCategory.charAt(0).toUpperCase() + oldCategory.slice(1);
    return { division: 'PMS', group: groupName };
  }
  
  if (['otc', 'nutrition', 'supplements', 'vitamins'].includes(cat)) {
    const groupName = oldCategory.charAt(0).toUpperCase() + oldCategory.slice(1);
    return { division: 'MSA', group: groupName };
  }
  
  const groupName = oldCategory ? (oldCategory.charAt(0).toUpperCase() + oldCategory.slice(1)) : 'Others';
  return { division: 'Himmel', group: groupName };
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
      division_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (division_id) REFERENCES divisions (id) ON DELETE CASCADE,
      UNIQUE(division_id, name)
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
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_areas_active ON areas(is_active);
    CREATE INDEX IF NOT EXISTS idx_areas_code ON areas(code);

    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      role TEXT NOT NULL CHECK (role IN ('Admin', 'Manager', 'Rep', 'Sales Representative')),
      area_id INTEGER,
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
      address TEXT,
      notes TEXT,
      email TEXT UNIQUE,
      phone TEXT,
      area_id INTEGER NOT NULL,
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
      address TEXT,
      contact_person TEXT,
      contact_number TEXT,
      notes TEXT,
      area_id INTEGER NOT NULL,
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
      (v.target_qty * p.per_unit_price) AS target_value,
      COALESCE(actual.qty, 0) AS actual_qty,
      COALESCE(actual.value, 0.0) AS actual_value,
      CASE 
        WHEN v.target_qty = 0 THEN 0.0
        ELSE ROUND((COALESCE(actual.qty, 0) * 100.0) / v.target_qty, 2)
      END AS qty_achievement_percent,
      CASE 
        WHEN (v.target_qty * p.per_unit_price) = 0.0 THEN 0.0
        ELSE ROUND((COALESCE(actual.value, 0.0) * 100.0) / (v.target_qty * p.per_unit_price), 2)
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
    institutions: ['city', 'contact_person', 'contact_number', 'notes'],
    doctors: ['hospital', 'city', 'address', 'notes']
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

  // Phase 17.2 & 17.3 — Safe status and column migration for orders
  try {
    db.exec("UPDATE orders SET status = 'Completed' WHERE status = 'Approved';");
    db.exec("UPDATE orders SET status = 'Pending' WHERE status = 'Draft';");
    db.exec("ALTER TABLE orders ADD COLUMN remarks TEXT;");
  } catch (e) {}

  // Runs LAST — after all products table migrations are complete so views can
  // safely reference products.status, products.per_unit_price, etc.
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
