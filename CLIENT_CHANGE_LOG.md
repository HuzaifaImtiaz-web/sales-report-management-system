# Client Change Log - Himmel Sales Management System

This document maintains a client-aligned record of feature requests, architectural modifications, and integration milestones for the Himmel Sales Management System.

| Version | Module | Request / Feature Description | Status | Date |
|:---:|:---:|:---|:---:|:---:|
| **v1.0** | **Product Master** | Implemented centralized Product Master schema (Brand Name, Generic Name, Division, Group, Pack Size, Unit Type, TP, MRP) | Completed | 2026-07-24 |
| **v1.0** | **Product Master** | Added strict validation for Unique Registration Number & Product Code, with deletion restrictions for referenced products | Completed | 2026-07-24 |
| **v1.0** | **Sales Entry** | Integrated Sales Entry with Product Master dropdown, auto-populating metadata and locking pricing to current TP/MRP | Completed | 2026-07-24 |
| **v1.0** | **Orders** | Migrated Orders to reference Product Master IDs while preserving historical pricing snapshots on modified master rates | Completed | 2026-07-24 |
| **v1.0** | **Targets** | Integrated Product Master JOINs with multi-tier filtering (Division, Group, Product) and 100% allocation triggers | Completed | 2026-07-24 |
| **v1.0** | **Reports** | Standardized all executive reports (Sales, Target Achievement, Product Performance) on Product Master fields | Completed | 2026-07-24 |
| **v1.0** | **Dashboard** | Bound Executive Dashboard KPIs, sales trends, top product charts, and target achievement progress to SQLite DB | Completed | 2026-07-24 |
| **v1.0** | **Security & Audit** | Deployed session token IPC authentication, role-based IPC authorization, and automated regression test suites | Completed | 2026-07-24 |
