# Changelog

## [1.0.2] - 2026-08-01 (Phase 20.6 Production Stability Release)
### Fixed
- **Database FK Corruption**: Detected and rebuilt `orders`, `order_items`, `products`, and `product_targets` tables whose foreign key definitions were corrupted by SQLite's automatic RENAME cascade during previous migration phases. All FK references to `*_temp` tables eliminated.
- **Order Save Failure**: `OrderValidator` and `AnalyticsService` referenced non-existent `is_active` column on `business_years` and `products` tables. Replaced with date-range check and `status = 'Active'` respectively.
- **`p.name` Column Error**: `OrderRepository.findAll()` and `findById()` referenced `p.name` (does not exist). Changed to `p.brand_name` throughout.
- **Complete / Cancel Silent Failure**: `SalesEntry.jsx` called `orderService.changeStatus()` (undefined method). Corrected to `orderService.changeOrderStatus()`.
- **Cancel Reason Input Reset**: `PromptDialog` `useEffect` reset input on every render due to `defaultValue` in deps. Fixed with `wasOpenRef` flag — input only resets on open/close transitions.
- **Missing Action Buttons**: Complete ✅ and Cancel 🔄 buttons were absent from the Orders table row. Added alongside Edit and Delete for Pending orders.
- **Groups `division_id` NOT NULL**: `groups` table had `division_id NOT NULL` preventing creation without division. Made nullable.
- **`OrderValidator` Business Year**: Fixed `WHERE is_active = 1` (no such column) on `business_years` — replaced with date-range fallback logic.
- **Schema Self-Healing Migration (Phase 20.5.6)**: `schema.cjs` migration now automatically detects and repairs FK corruption on startup for `orders`, `order_items`, `products`, and `product_targets`.

### Changed
- **Master Data Simplification**: Removed `doctor_code`, `mobile_number`, `email`, `address` from Doctor module; removed `address`, `contact_person`, `contact_number` from Institution module — UI, backend, validators, migrations, and DB schema fully synchronized.
- **Product Backend Sync**: Removed legacy columns from `products` table; validators updated to use safe `.trim()` guards.
- **Areas `code` Column**: Removed NOT NULL `code` field from `areas` table to allow area creation without mandatory code entry.

## [1.0.1] - 2026-07-27 (Phase 20.4 Production Hotfix Release)
### Fixed
- **Startup Freeze Hotfix**: Fixed `checkFirstRun()` boolean unwrapping in renderer so second launch bypasses initialization UI and opens Login immediately.
- **IPC Event Delivery**: Forwarded Electron IPC `event` parameter in `wrapHandler` for `system:start-initialization`.
- **Startup Validator**: Enhanced `StartupValidator` with idempotent runtime folder repair and structured `[Startup]` logs.
- **Database Cleanup & Lock Prevention**: Wrapped SQLite handles in `try...finally` blocks across `SystemInitializer.cjs`.
- **Timeout Watchdog Protection**: 30-second watchdog timer in `SystemInitScreen` with Retry / Open Log / Exit options.

## [1.0.0] - 2026-07-25 (Phase 17 Release)
### Added
- Enterprise UI & UX polish across all 16 core views.
- ErrorBoundary crash protection.
- High-performance SQLite database indexes for fast query execution.
- Production deployment package configuration with installer metadata.
- Automated import & hook integrity verification suites.
- Complete documentation guides for administrative and user workflows.
