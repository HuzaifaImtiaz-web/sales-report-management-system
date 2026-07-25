# System Architecture Documentation

## Architecture Overview
The Himmel Pharmaceutical Sales Management System is built on a multi-tier Electron & React architecture:
- **Renderer Tier**: React 18 SPA with React Router v6, Tailwind CSS, Recharts, and Context API state management.
- **IPC Bridge**: Secure ContextBridge IPC pattern exposing restricted API surface via `window.api`.
- **Main & Service Tier**: Node.js Electron main process hosting business services, repositories, and validation.
- **Persistence Tier**: Embedded SQLite (`better-sqlite3`) database with foreign keys and performance indexes.
