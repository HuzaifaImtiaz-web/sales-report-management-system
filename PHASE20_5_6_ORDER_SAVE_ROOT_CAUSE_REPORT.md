# Phase 20.5.6/7 — Order Save Root Cause Investigation Report

## Exact Root Cause (Evidence-Based)

---

## The Real Exception

```
SqliteError: no such table: main.areas_temp
    at Database.prepare (better-sqlite3/lib/methods/wrappers.js:5:21)
    at OrderRepository.create (electron/database/OrderRepository.cjs:140:31)
    at electron/ipc.cjs:442:74
```

**This is NOT a missing table error.** It is a **SQLite foreign key definition corruption** caused by the RENAME TABLE pattern used in all previous migration phases.

---

## Root Cause Analysis

### The SQLite RENAME Cascade Problem

When SQLite executes:

```sql
ALTER TABLE areas RENAME TO areas_temp;
```

SQLite **automatically rewrites the FK definitions** of every table that references `areas`, changing them to reference `areas_temp` instead. This is documented SQLite behavior.

The Phase 20.5.2 migration pattern was:

```sql
ALTER TABLE areas RENAME TO areas_temp;     -- SQLite rewrites orders FK to reference areas_temp
CREATE TABLE areas (...);                    -- New areas table
INSERT INTO areas SELECT ... FROM areas_temp;
DROP TABLE areas_temp;                       -- areas_temp gone, but orders still references it!
```

After `DROP TABLE areas_temp`, the `orders` table's stored FK definition still reads:

```sql
FOREIGN KEY (area_id) REFERENCES "areas_temp" (id) ON DELETE RESTRICT
```

SQLite does **not** rewrite the FK back when you drop the temp table. Every `INSERT INTO orders` then calls FK validation which tries to find `areas_temp` → `no such table: main.areas_temp`.

### Cascade of Corruption Across Phases

| Migration Phase | Table Renamed | Tables Corrupted |
|----------------|---------------|-----------------|
| Phase 20.5.2 | `areas` → `areas_temp` | `orders` (area_id FK) |
| Phase 20.5.2 | `doctors` → `doctors_temp` | `orders` (doctor_id FK) |
| Phase 20.5.2 | `institutions` → `institutions_temp` | `orders` (institution_id FK) |
| Phase 20.5.2 | `team_members` → `team_members_temp` | `orders` (team_member_id FK) |
| Phase 20.5.5 | `groups` → `groups_temp` | `products` (group_id FK) |
| Phase 20.5.6 (repair run 1) | `products` → `products_fix_temp` | `product_targets` (product_id FK) |

### Why ORDER SAVE Specifically Failed

`OrderRepository.create()` at line 140 calls:

```js
const stmtOrder = this.db.prepare(`
  INSERT INTO orders (order_number, order_date, team_member_id, doctor_id,
    institution_id, area_id, status, remarks, created_by, submitted_at, import_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
```

SQLite validates FK references at `prepare()` time when `foreign_keys = ON`. The stored FK definition in `sqlite_master` for the `orders` table reads `REFERENCES "areas_temp"` → FK lookup fails immediately.

### Why It Was Masked

`ipc.cjs` `formatErrorMessage()` checked:

```js
if (msg.includes('no such table')) {
  return 'The system database is unavailable. Please contact the Administrator.';
}
```

The error `no such table: main.areas_temp` matched this condition, hiding the actual FK corruption from the user.

---

## Additional Issues Found During Investigation

### Issue 2: `view_target_achievements` referenced `p.per_unit_price`

The view used `p.per_unit_price` which was never a column in `products`. Fixed in Phase 20.5.5.

### Issue 3: `AnalyticsService.cjs` stale column references

| Line | Bad SQL | Fix |
|------|---------|-----|
| 18, 85, 180 | `business_years WHERE is_active = 1` | `WHERE date('now') BETWEEN date(start_date) AND date(end_date)` — `business_years` has no `is_active` column |
| 28 | `products WHERE is_active = 1` | `products WHERE status = 'Active'` |
| 125 | `COALESCE(p.brand_name, p.name)` | `p.brand_name` — `products` has no `name` column |

---

## Files Modified

| File | Change |
|------|--------|
| `electron/database/schema.cjs` | Phase 20.5.6 migration: checks every table for `_temp` FK references and rebuilds `orders`, `order_items`, `products`, `product_targets` if corrupted |
| `electron/services/AnalyticsService.cjs` | Fixed `business_years.is_active` (×3), `products.is_active`, `p.name` fallback |
| `electron/scripts/repair_all_fk.cjs` | One-shot repair: rebuilt `products`, `order_items` tables with clean FKs |
| `electron/scripts/repair_final_sweep.cjs` | One-shot repair: rebuilt `product_targets` with clean FK |

---

## SQL Before / After

### orders table FK (before)

```sql
FOREIGN KEY (team_member_id) REFERENCES "team_members_temp" (id) ON DELETE RESTRICT,
FOREIGN KEY (doctor_id)      REFERENCES "doctors_temp" (id)      ON DELETE SET NULL,
FOREIGN KEY (institution_id) REFERENCES "institutions_temp" (id) ON DELETE SET NULL,
FOREIGN KEY (area_id)        REFERENCES "areas_temp" (id)        ON DELETE RESTRICT
```

### orders table FK (after)

```sql
FOREIGN KEY (team_member_id) REFERENCES team_members (id) ON DELETE RESTRICT,
FOREIGN KEY (doctor_id)      REFERENCES doctors (id)      ON DELETE SET NULL,
FOREIGN KEY (institution_id) REFERENCES institutions (id) ON DELETE SET NULL,
FOREIGN KEY (area_id)        REFERENCES areas (id)        ON DELETE RESTRICT
```

---

## Verification Evidence

### Live DB State (Post-Repair)

```
_temp references: ZERO corrupt objects ✓
FK violations:    No violations ✓
Integrity check:  ok ✓
INSERT INTO orders prepare: OK — no areas_temp error ✓
```

### App Startup Log (Clean — No Errors)

```
[INFO] analytics:getDashboardSummary  → SQL Trace: Fetching dashboard summary...
[INFO] analytics:getMonthlySales      → SQL Trace: Fetching monthly sales trend...
[INFO] analytics:getTopProducts       → SQL Trace: Fetching top 10 products...
[INFO] analytics:getAreaPerformance   → SQL Trace: Fetching area performance...
[INFO] analytics:getRepresentativePerformance → SQL Trace: Fetching representative performance...
[INFO] analytics:getTargetProgress    → SQL Trace: Fetching target progress...
[INFO] analytics:getRecentOrders      → SQL Trace: Fetching recent orders...
```

Zero `[ERROR]` entries. All analytics queries complete without exception.

### Production Build

```
✓ 915 modules transformed.
✓ built in 9.22s
Exit code: 0
```

---

## Prevention: Phase 20.5.6 Migration Pattern

The migration now detects corruption at startup by scanning `sqlite_master`:

```js
const ordersRow = db.prepare(
  "SELECT sql FROM sqlite_master WHERE name='orders' AND type='table'"
).get();
if (ordersRow && ordersRow.sql && ordersRow.sql.includes('_temp')) {
  // rebuild orders with clean FK references
}
```

This runs on every app startup and self-heals any future instance that has corrupt FK definitions from old schema files.

---

## Summary

| Issue | Exact Exception | Fix |
|-------|----------------|-----|
| Orders save fails | `SqliteError: no such table: main.areas_temp` — `orders` FK definitions corrupted by SQLite RENAME cascade | Rebuilt `orders`, `order_items`, `products`, `product_targets` tables with correct FK references |
| Dashboard unavailable | `SqliteError: no such column: is_active` in `AnalyticsService` — `business_years` has no `is_active` col | Replaced with date-range check |
| Top products error | `SqliteError: no such column: p.name` — `products` has `brand_name` not `name` | Changed to `p.brand_name` |
