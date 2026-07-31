# Himmel Pharmaceutical Sales Management System

![Himmel Logo](src/assets/logos/Himmel-Logo.png)

Enterprise Sales & Distribution Management System designed for Himmel Pharmaceutical Ltd. Built with Electron, Vite, React, Tailwind CSS, and SQLite (`better-sqlite3`).

---

## 🚀 System Overview

The Himmel Pharmaceutical Sales Management System provides complete end-to-end management for pharmaceutical operations, team members, doctor interactions, institution contracts, territory areas, target allocations, order processing, and analytics reporting.

### Core Modules

- **Dashboard**: High-level sales overview, KPI metrics, monthly target progress, and top-performing products.
- **Sales Entry & Invoicing**: Order completion, status tracking, invoicing, and sales performance tracking.
- **Customer Orders**: Complete order processing lifecycle (Pending → Complete / Cancel / Edit / Delete) with reason logging and stock validation.
- **Products Master**: Product catalog management with pricing, target allocation, and status controls.
- **Doctors Directory**: Managed database of healthcare practitioners and target institution affiliations.
- **Institutions**: Health centers, hospitals, and clinical institution records.
- **Territories & Areas**: Geographic area, district, and region mapping.
- **Team Members**: Sales representative management and hierarchy assignment.
- **Annual Targets**: Annual sales target setting and distribution across team members and territories.
- **Audit Logs**: Enterprise-grade audit trail capturing system events, user actions, and system modifications.
- **Backup & Recovery**: Automated SQLite database backup, manual backup creation, and point-in-time recovery.
- **Settings & About**: Dynamic application configuration, runtime metrics, system initialization, and developer attribution.

---

## 🛠️ Technology Stack

- **Desktop Runtime**: [Electron 42](https://www.electronjs.org/)
- **Frontend Framework**: [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/)
- **Database Engine**: [SQLite](https://sqlite.org/) via [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3)
- **State & Context**: Custom React Providers (Auth, Theme, Toast, Unsaved Changes, Database Init)
- **Packaging & Build**: [Electron Builder 26](https://www.electron-userland.github.io/electron-builder/) (NSIS Setup & Portable Windows Binaries)

---

## 📋 Prerequisites & Setup

### Prerequisites

- **Node.js**: `v20.11.0` or higher
- **npm**: `v10.0.0` or higher
- **OS**: Windows 10 / 11 (x64)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/HuzaifaImtiaz-web/sales-report-management-system.git
cd sales-report-management-system
npm install
```

---

## 💻 Development & Build Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Vite Dev Server** | `npm run dev` | Starts Vite development server at `http://localhost:5180`. |
| **Electron Dev** | `npm run electron:dev` | Launches Electron connected to local Vite dev server. |
| **Vite Build** | `npm run build` | Compiles production assets into `dist/`. |
| **Electron Packaging** | `npm run electron:build` | Generates NSIS installer (`.exe`) and Portable executable in `dist/`. |

---

## 📁 Repository Structure

```
.
├── build/                      # Build icons (icon.ico, icon.png)
├── Client_Delivery/            # Production client delivery package
│   ├── Documentation/          # Complete PDF & Markdown user manuals & guides
│   ├── Installer/              # Production Setup & Portable executables
│   └── Sample_Backups/         # Initial database backup seeds
├── electron/                   # Main process, IPC handlers, database migrations
│   ├── database/               # SQLite connection, repositories & migrations
│   ├── scripts/                # White badge icon generator scripts
│   ├── config.cjs              # Electron dynamic runtime configuration
│   ├── ipc.cjs                 # Main process IPC channel handlers
│   └── main.cjs                # Electron entry point
├── src/                        # React renderer application
│   ├── assets/                 # Brand assets and logo images
│   ├── components/             # Reusable UI components & dialogs
│   ├── context/                # Global React context providers
│   ├── pages/                  # Page views (Dashboard, Orders, Products, etc.)
│   ├── utils/                  # Version resolution & format helpers
│   └── main.jsx                # React application entry point
├── CHANGELOG.md                # Release version history & changelog
├── RELEASE_NOTES.md            # Detailed notes for latest release
├── VERSION_HISTORY.md          # Multi-version audit tracking
└── package.json                # Source of truth for version & dependencies
```

---

## 📚 Documentation & User Manuals

Complete user documentation is available in `Client_Delivery/Documentation/`:

- **User Guide**: `Client_Delivery/Documentation/USER_GUIDE.pdf` (`USER_GUIDE.md`)
- **Installation Guide**: `Client_Delivery/Documentation/INSTALLATION_GUIDE.pdf` (`INSTALLATION_GUIDE.md`)
- **Administrator Guide**: `Client_Delivery/Documentation/ADMIN_GUIDE.pdf` (`ADMIN_GUIDE.md`)
- **Backup & Recovery Guide**: `Client_Delivery/Documentation/BACKUP_RESTORE_GUIDE.pdf` (`BACKUP_RESTORE_GUIDE.md`)
- **Troubleshooting Guide**: `Client_Delivery/Documentation/TROUBLESHOOTING.pdf` (`TROUBLESHOOTING.md`)
- **System Architecture**: `Client_Delivery/Documentation/SYSTEM_ARCHITECTURE.md`
- **Database Schema**: `Client_Delivery/Documentation/DATABASE_SCHEMA.md`

---

## 🏷️ Versioning & Releases

This project follows [Semantic Versioning](https://semver.org/). `package.json` serves as the single source of truth for version resolution across the entire system.

Latest Release: [`v1.0.3`](https://github.com/HuzaifaImtiaz-web/sales-report-management-system/releases/tag/v1.0.3)
