# Himmel Sales System

![Himmel Logo](src/assets/logos/Himmel-Logo.png)

Sales and distribution management for Himmel Pharmaceutical Ltd, as a web app: open it in any
browser, on a computer or a phone. Everyone works on one shared company database, and each person
signs in with their own account and role (Admin, Manager, Sales Representative).

- **Web app**: React 18 + Vite 7 + Tailwind CSS (`src/`)
- **API server**: Node.js + Express 5 (`server/`), the only part that talks to the database
- **Database**: PostgreSQL (Supabase in production, PGlite on your PC for development)
- **Hosting**: Vercel (static site + one serverless function), portable to any Node.js host

Security design and the full audit: [docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md).

---

## Modules

- **Dashboard**: sales KPIs, monthly trend, target progress, top products.
- **Sales & Orders**: purchase orders from entry to completion or cancellation, with history.
- **Products, Doctors, Institutions, Areas, Team Members, Product Groups**: master data.
- **Targets**: annual targets distributed across areas and team members.
- **Reports & Export Center**: Excel, PDF and PowerPoint reports, built on the server and downloaded.
- **Audit Trail**: who did what, when and from where (administrators).
- **Users**: accounts, roles, password resets, unlocking (administrators).
- **Settings**: company details and logo, business year, backups, diagnostics, security.

Roles are enforced by the server (see `server/src/rpc/handlers.js`) and mirrored by the screens
(`src/services/permissionService.js`): representatives enter and edit orders, managers also
maintain master data and cancel orders, only administrators complete or delete orders, delete
master data, manage users, read the audit trail and handle backups.

---

## Local development

Requirements: Node.js 20.12 or newer (22 LTS recommended), npm 10.

```bash
npm install
npm --prefix server install
npm run dev
```

`npm run dev` starts a local PostgreSQL (PGlite, data in `server/.local-db/`), the API on
http://127.0.0.1:4000 and the web app on http://localhost:5180. Sign in as `admin` /
`Local#Dev2026!` (development data only). It never reads `server/.env`, so it cannot touch the
real database.

Other commands:

| Command | What it does |
|---|---|
| `npm test` | API tests (real server + PostgreSQL in memory): auth, roles, CSRF, exports, backups... |
| `npm run build` | Production build of the web app into `dist/` |
| `npm start` | Runs the API and serves `dist/` (any Node.js host) |
| `npm run migrate` | Creates/updates the database tables (uses `server/.env`) |
| `npm run dev:cloud` | Development against the database in `server/.env` (careful: real data) |

---

## Deploying: Supabase + Vercel

### 1. Database (Supabase)

1. Create a project at supabase.com (pick the region closest to your users).
2. **Lock down the Data API** (the app does not use it): in the SQL editor run

   ```sql
   revoke all on all tables in schema public from anon, authenticated;
   revoke all on all sequences in schema public from anon, authenticated;
   revoke all on all functions in schema public from anon, authenticated;
   alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
   alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
   alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;
   ```
3. Download the CA certificate: **Database settings → SSL Configuration → Download Certificate**.
4. Copy two connection strings from **Connect → Direct**: the **Session pooler** (port 5432) for
   running migrations from your PC, and the **Transaction pooler** (port 6543) for Vercel.
5. Create the tables from your PC: put the session pooler URL in `server/.env` (see
   `server/.env.example`), then run `npm run migrate`. Run it again after updates that change
   `server/src/db/schema.sql`.

### 2. Web app + API (Vercel)

1. Import the GitHub repository in Vercel. `vercel.json` already sets the build, the API
   function (region `sin1`, Singapore) and the security headers.
2. Add these **Environment Variables** (Production):

   | Name | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | the **Transaction pooler** URL (port 6543), with your database password |
   | `DATABASE_SSL_CA` | the full text of the downloaded certificate (`-----BEGIN CERTIFICATE-----...`) |
   | `ADMIN_PASSWORD` | strong password, only used if the database has no users yet |
   | `APP_ORIGIN` | your site's address, e.g. `https://sales.example.com` |

3. Deploy. Sign in as the administrator; the first sign-in asks you to choose a new password and
   set the emergency recovery password and PIN.
4. Recommended: attach your own domain (Vercel → Domains), so the address stays the same if you
   ever move to another host, and turn on Vercel's Firewall rate limiting for `/api/*`.

Vercel's free Hobby plan is for non-commercial use only; a company app needs the Pro plan.

### Moving to another host later

The app is a normal Node.js server plus a static build, so any host works (Render, Railway, a
VPS, Azure...):

```bash
npm ci --include=dev && npm --prefix server ci --omit=dev
npm run build
npm start          # serves the web app and the API on $PORT
```

Set the same environment variables (`DATABASE_URL` can then use the session pooler), point your
domain's DNS to the new host, and you are done; the database does not move.

---

## Moving data from the desktop app

The desktop app (v1.0.x) kept data in SQLite files. Import them once, when you switch over:

```bash
cd server
node scripts/import-from-sqlite.js --data "<folder>/database/admin.db" --users "<folder>/users.db"        # preview
node scripts/import-from-sqlite.js --data "<folder>/database/admin.db" --users "<folder>/users.db" --yes  # import
```

The files are in `%APPDATA%\Himmel Pharmaceutical\` on the computer that ran the desktop app.
Close the desktop app first. The import replaces the business data (and, with `--users`, the
accounts) in the cloud database. Details: [server/README.md](server/README.md).

---

## Project layout

```
api/index.js        Vercel serverless entry (wraps the Express app)
server/             API server: auth, roles, sessions, exports, backups, database
  src/app.js        HTTP pipeline (headers, CSRF/origin checks, sessions, RPC endpoint)
  src/rpc/          one handler per operation (window.api.* in the web app)
  src/export/       Excel / PDF / PowerPoint generation
  src/db/schema.sql PostgreSQL schema
  test/             API and security tests
src/                web app (React)
  api/webApi.js     the browser's connection to the API
vercel.json         Vercel build, function and security headers
```

---

© 2026 Himmel Pharmaceutical Ltd. All rights reserved.
