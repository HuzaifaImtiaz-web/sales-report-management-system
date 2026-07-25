# Himmel Pharmaceutical Sales Management System — Administrator Guide

## Overview
This guide provides comprehensive instructions for system administrators managing the Himmel Pharmaceutical Sales Management System desktop application.

---

## 1. System Administration & Configuration
- **Business Years**: Navigate to **Settings → Business Years** to view, open, activate, or close fiscal years.
- **Maintenance Mode**: Toggle **Maintenance Mode** in Settings to prevent sales representatives from entering new sales data while system maintenance is in progress. Admin users maintain full access during maintenance mode.
- **Enterprise Logo Customization**: Update company logo and branding dynamically from Settings without needing rebuilds.

---

## 2. User Management & Role-Based Access Control (RBAC)
- **Roles**:
  - `Admin`: Complete system privilege including configuration, recovery mode, user management, and system audits.
  - `Manager`: Approval and oversight of order workflows, target assignments, and analytical reports.
  - `Sales Representative`: Order creation, doctor & institution directory views, and personal sales tracking.
- **User Administration**:
  - Create, edit, enable, disable users via **User Management**.
  - Reset user passwords and unlock locked accounts caused by failed login attempts.

---

## 3. Emergency Recovery Mode
- In case of forgotten master admin credentials, launch the application with `--recovery` or select **Emergency Recovery** on the login screen.
- Enter the master emergency password (`HimmelAdmin2026!`) to access system bypass controls, reset credentials, and audit security events.
