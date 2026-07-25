# Himmel Pharmaceutical Sales Management System — Backup & Restore Guide

## Overview
Database integrity and disaster recovery guidelines for administrators.

---

## 1. Automated & Manual Database Backups
- Manual backups can be triggered anytime via **Settings → Database Management → Create Backup**.
- Backups are stored in `AppData/Roaming/Himmel Pharmaceutical/backups/`.

---

## 2. Restoring a Database Backup
- Go to **Settings → Database Management → Select Backup File**.
- Click **Restore Backup**. The system validates database schema integrity before applying changes.
- Successful restoration triggers a full application state refresh.
