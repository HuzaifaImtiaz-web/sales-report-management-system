# Release Notes — v1.0.3 (Branding, Icon & Dynamic Version Architecture Release)

**Release Date:** 2026-08-01  
**Release Type:** Feature & Branding Enhancement  
**Previous Version:** v1.0.2  

---

## Overview

Himmel Pharmaceutical Sales Management System **v1.0.3** introduces a single-source dynamic versioning architecture, enterprise white-badge logo visibility across all light and dark screens, updated Windows icon assets (`.ico` and `.png`), and an expanded About Application diagnostic card layout.

---

## What's New in v1.0.3

### 🎨 Logo Visibility & White Badge Cards
- **High-Contrast Badges**: Added pure white rounded background cards with subtle borders around the Himmel logo on all dark crimson, dark mode, and colored screens (Login panel, Splash screen, System init screen, Sidebar, Navbar, Settings header, Update Center modal).
- **Aspect Ratio Preservation**: Guaranteed crisp logo display without cropping or background color bleeding across all display resolutions.

### 🖼️ Windows Multi-Resolution Icon Assets
- **Generated 256x256 Badged Icon**: Built white-badged 256x256 `icon.png` and multi-resolution `icon.ico` for Windows Desktop shortcuts, Taskbar, Start Menu, File Explorer, NSIS installer, and uninstaller.
- **Vite Favicon Support**: Added `public/favicon.png` & `public/favicon.ico` so web views and window titlebars render the badged logo icon.

### ⚙️ Single-Source Dynamic Version Architecture
- **Centralized Resolution**: Connected `package.json` version directly to Electron main process, React frontend (`src/utils/version.js`), Update Center, and Settings UI.
- **Auto-Syncing**: Updating `package.json` version automatically updates every screen and process in the application without touching any source code strings.
- **Settings → About Application**: Expanded card layout to display Installed Version, Release Channel (`Production`), Build Type (`Stable Release`), and Build Date (`2026-08-01`).

---

## Release Notes — v1.0.2 (Production Stability Release)

---

## What's Fixed in v1.0.2

### 🔴 Critical Database Fixes
- **SQLite FK Corruption Repair**: Previous schema migrations used `ALTER TABLE RENAME` which caused SQLite to permanently rewrite foreign key definitions to reference `*_temp` tables. Affected: `orders`, `order_items`, `products`, `product_targets`. All tables rebuilt with correct FK references. A self-healing Phase 20.5.6 migration is now embedded in `schema.cjs` to prevent this on future installs.
- **Schema Self-Healing**: On every startup, the schema migration now automatically audits and repairs any corrupted FK references before the app runs any business logic.

### 🔴 Order Module Fixes
- **Order Save Failure** (`no such table: areas_temp`): Completely resolved. Orders can now be created and updated without error.
- **Order Complete Button** (silent failure): `SalesEntry.jsx` called a non-existent method `orderService.changeStatus()`. Fixed to `changeOrderStatus()`. Complete now works correctly.
- **Order Cancel Button** (silent failure): Same root cause as Complete. Fixed. Cancel now correctly prompts for reason and updates status.
- **Cancel Reason Input** (only accepted 1 character): `PromptDialog` useEffect reset the input field on every keystroke. Fixed with open/close state tracking.
- **Missing Action Buttons**: Complete ✅ and Cancel 🔄 buttons were absent from the Orders table. Added alongside Edit and Delete.

### 🟡 Validation & Column Fixes
- **`no such column: is_active`** on `business_years`: Fixed in `OrderValidator`, `AnalyticsService` (×3 locations). Replaced with date-range active year detection.
- **`no such column: is_active`** on `products`: Fixed in `OrderValidator` and dashboard KPI query. Changed to `status = 'Active'`.
- **`no such column: p.name`** in `OrderRepository`: `products` has `brand_name`, not `name`. Fixed in `findAll()` and `findById()`.
- **`no such column: p.name`** in `AnalyticsService.getTopProducts()`: Same fix applied.

### 🟡 Master Data Simplification (Backend Sync)
- **Doctor Module**: Permanently removed `doctor_code`, `mobile_number`, `email`, `address` from DB schema, validators, repositories, IPC, and migrations.
- **Institution Module**: Permanently removed `address`, `contact_person`, `contact_number` from DB schema, validators, repositories, IPC, and migrations.
- **Areas Module**: Removed mandatory `code` field (`NOT NULL` constraint). Areas can now be created with name only.
- **Groups Module**: Made `division_id` nullable. Groups can now be created without mandatory division assignment.
- **Product Module**: Removed all legacy/optional columns. Validators updated with safe `.trim()` guards (`(value ?? '').trim()`).

---

## What's NOT in This Release (Planned for v1.0.3)

> **PPT Export Redesign**: The PowerPoint export feature redesign has been postponed to v1.0.3. The existing PPT export remains functional as-is.

Planned for v1.0.3:
- Professional PowerPoint export templates with Himmel branding
- Enterprise cover page, executive summary slides
- Professional color palette aligned with corporate identity
- Better embedded charts
- Management dashboard slide layouts
- Modern corporate report formatting

---

## Upgrade Instructions

This release is a seamless drop-in upgrade from v1.0.1.
- Auto-update will detect v1.0.2 and offer the update automatically.
- All existing databases and production data are preserved.
- No manual migration steps required.

---

## Build Information

| Property | Value |
|----------|-------|
| Version | 1.0.2 |
| Release Type | Stability / Bugfix |
| Build Date | 2026-08-01 |
| Electron | v42.x |
| SQLite | better-sqlite3 |
| Node | Bundled with Electron |
