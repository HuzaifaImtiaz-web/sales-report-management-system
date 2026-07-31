# Phase 20.5.5 — Final Backend Synchronization Report

## Evidence-Based — Not Assumptions

---

## Issue 1: Groups Cannot Be Created — `NOT NULL constraint failed: groups.division_id`

### Root Cause

**Live database**: `groups.division_id INTEGER NOT NULL` — the original schema enforced a mandatory division.

**Why it surfaced**: The Phase 20.5.2 migration rebuilt the groups table when `code` or `group_code` columns were detected. In the live DB, those columns were successfully removed by an earlier `dropColumnSafely()` call. So the full table-reconstruction never triggered. `division_id NOT NULL` survived.

**CategoryRepository.cjs** sends `null` correctly:
```js
stmt.run(c.divisionId || null, ...)
```
But SQLite rejected it because of the NOT NULL constraint.

### Schema Before Repair

```
PRAGMA table_info(groups);
cid  name         type     notnull  dflt
0    id           INTEGER  0        null
1    division_id  INTEGER  1 ← BAD  null
2    name         TEXT     1        null
3    description  TEXT     0        null
4    is_active    INTEGER  1        1
```

### Schema After Repair

```
cid  name         type     notnull  dflt
0    id           INTEGER  0        null
1    division_id  INTEGER  0 ← OK   null
2    name         TEXT     1        null
3    description  TEXT     0        null
4    is_active    INTEGER  1        1
```

### Verified INSERT Test

```sql
INSERT INTO groups (division_id, name, description, is_active) VALUES (NULL, 'TestGroup20_5_5', NULL, 1);
-- OK: id=16 inserted successfully, cleanup done
```

### Files Modified

| File | Change |
|------|--------|
| `electron/database/schema.cjs` | `CREATE TABLE IF NOT EXISTS groups` — changed `division_id INTEGER NOT NULL` → `division_id INTEGER` |
| `electron/database/schema.cjs` | Added **Phase 20.5.5 migration** — checks `divColInfo.notnull === 1` and rebuilds groups table if true |
| `electron/scripts/repair_20_5_5.cjs` | One-shot repair applied directly to live `admin.db` |

---

## Issue 2: Orders Module — "The system database is unavailable"

### Root Cause (Traced End-to-End)

**Not a missing table.** The `formatErrorMessage()` function in `ipc.cjs` catches all errors containing `no such table` and converts them to "The system database is unavailable."

**Actual error chain:**

1. On app startup, `schema.cjs` executes `viewsTriggersSql` which includes:

```sql
CREATE VIEW view_target_achievements AS
SELECT
  ...
  (v.target_qty * p.per_unit_price) AS target_value,
  ...
  WHEN (v.target_qty * p.per_unit_price) = 0.0 THEN 0.0
  ...
```

2. **`products.per_unit_price` does not exist** — the column was never in the schema. Products uses `tp` for trade price.

3. SQLite's view creation with `CREATE VIEW` does **not validate column existence at creation time** — it only fails at query time. So `view_target_achievements` appears to be created, but every query against it fails with:
```
no such column: p.per_unit_price
```

4. `ReportRepository.getDashboardSummaryData()` queries `view_target_achievements` on Dashboard load:
```sql
SELECT COALESCE(SUM(target_qty), 0) AS total_target_qty, ...
FROM view_target_achievements
```

5. This throws an error. `ipc.cjs` `formatErrorMessage()` sees the message and returns "The system database is unavailable." — **masking the real error**.

### Fix Applied

**`schema.cjs` — `view_target_achievements` definition:**

```diff
- (v.target_qty * p.per_unit_price) AS target_value,
+ (v.target_qty * COALESCE(p.tp, 0.0)) AS target_value,

- WHEN (v.target_qty * p.per_unit_price) = 0.0 THEN 0.0
- ELSE ROUND((COALESCE(actual.value, 0.0) * 100.0) / (v.target_qty * p.per_unit_price), 2)
+ WHEN (v.target_qty * COALESCE(p.tp, 0.0)) = 0.0 THEN 0.0
+ ELSE ROUND((COALESCE(actual.value, 0.0) * 100.0) / (v.target_qty * COALESCE(p.tp, 0.0)), 2)
```

Live DB repair directly recreated the view with the corrected SQL.

### Files Modified

| File | Change |
|------|--------|
| `electron/database/schema.cjs` | Replaced `p.per_unit_price` with `COALESCE(p.tp, 0.0)` in `view_target_achievements` (×2) |
| `electron/scripts/repair_20_5_5.cjs` | Dropped and recreated all 5 views on live DB with corrected SQL |

---

## Verification Results

### Live DB Verification (Post-Repair)

| Check | Result |
|-------|--------|
| `groups.division_id notnull` | **0 (nullable)** ✅ |
| `view_sales_summary` | EXISTS ✅ |
| `view_team_member_targets` | EXISTS ✅ |
| `view_target_achievements` | EXISTS ✅ |
| `view_team_performance` | EXISTS ✅ |
| `view_monthly_sales` | EXISTS ✅ |
| `SELECT COUNT(*) FROM view_target_achievements` | OK ✅ |
| `SELECT COUNT(*) FROM view_monthly_sales` | OK ✅ |
| `INSERT INTO groups (division_id=NULL, name='TestGroup')` | OK, id=16 ✅ |

### Production Build

```
✓ 915 modules transformed.
✓ built in 12.12s
Exit code: 0
```

---

## Summary

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| `NOT NULL constraint failed: groups.division_id` | Live DB had `division_id INTEGER NOT NULL`; migration never ran because `code`/`group_code` columns had already been removed | Rebuilt `groups` table with `division_id INTEGER` (nullable); added Phase 20.5.5 migration in `schema.cjs` |
| Orders module "system database unavailable" | `view_target_achievements` referenced non-existent column `p.per_unit_price`; all queries against it silently returned `no such column` which was caught and displayed as "unavailable" | Replaced `p.per_unit_price` with `COALESCE(p.tp, 0.0)` in schema and live DB |
