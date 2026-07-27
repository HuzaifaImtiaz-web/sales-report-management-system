# Changelog

## [1.0.1] - 2026-07-27 (Phase 20.4 Production Hotfix Release)
### Fixed
- **Startup Freeze Hotfix**: Fixed `checkFirstRun()` boolean unwrapping in renderer (`src/App.jsx`) so subsequent application launches bypass initialization UI and open Login immediately.
- **IPC Event Delivery**: Forwarded Electron IPC `event` parameter in `wrapHandler` (`electron/ipc.cjs`) for `system:start-initialization` to ensure initialization progress updates are delivered reliably to renderer UI.
- **Startup Validator**: Enhanced `StartupValidator` (`electron/system/StartupValidator.cjs`) with idempotent runtime folder repair, database checks, and structured `[Startup]` logs.
- **Initialization Lifecycle**: Improved `SystemInitializer` (`electron/system/SystemInitializer.cjs`) with `try ... finally` SQLite database handle cleanups to eliminate database file lock contention.
- **Timeout Watchdog Protection**: Implemented a 30-second watchdog timer in `SystemInitScreen` with recovery options (Retry / Open Log Folder / Exit).

## [1.0.0] - 2026-07-25 (Phase 17 Release)
### Added
- Enterprise UI & UX polish across all 16 core views.
- ErrorBoundary crash protection.
- High-performance SQLite database indexes for fast query execution.
- Production deployment package configuration with installer metadata.
- Automated import & hook integrity verification suites.
- Complete documentation guides for administrative and user workflows.
