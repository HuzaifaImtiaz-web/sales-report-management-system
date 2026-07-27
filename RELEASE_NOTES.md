# Release Notes v1.0.1 (Production Hotfix)

## Production Release Overview
Himmel Pharmaceutical Sales Management System v1.0.1 is a production hotfix release addressing the application startup freeze on second launch, improving initialization lifecycle stability, optimizing SQLite handle cleanups, and enhancing auto-update compatibility.

---

## Highlights & Fixes
- **Fixed Startup Freeze**: Resolved `checkFirstRun()` boolean unwrapping in renderer so second launch skips initialization UI and opens Login immediately.
- **IPC Event Delivery**: Forwarded Electron IPC `event` parameter in `wrapHandler` for `system:start-initialization` to ensure initialization progress updates are delivered reliably to renderer UI.
- **Improved Startup Validator**: Enhanced `StartupValidator` with idempotent runtime folder repair and structured `[Startup]` logs.
- **Database Cleanup & Lock Prevention**: Wrapped SQLite connection handles in `try ... finally` blocks across `SystemInitializer.cjs` to eliminate database locking issues.
- **Timeout Watchdog Protection**: Added 30-second watchdog timer in `SystemInitScreen` to catch stalls and present user recovery options (Retry / Open Log Folder / Exit).
- **Auto-Update System**: Fully compatible with existing v1.0.0 installations for seamless automated update to v1.0.1.

