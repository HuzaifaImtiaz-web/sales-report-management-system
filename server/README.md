# Himmel Sales – Cloud Server

All desktop apps now share **one PostgreSQL database in the cloud**. Every person still signs in
with their own username and role, but they all see and edit the same company data.

```
Desktop app (any PC)  ──HTTPS + login token──▶  this server (Node.js)  ──▶  PostgreSQL (cloud)
React UI → window.api → electron/ipc.cjs          src/rpc/handlers.js          src/db/schema.sql
```

- The React screens did not change: they call the same `window.api.*` functions as before.
- `electron/ipc.cjs` forwards each call to `POST /api/rpc/<channel>`, with the same channel names and results.
- The database password stays on the server. The desktop app only ever holds a login token.
- The server checks each user's role on every request, using the same rules as `src/services/permissionService.js`.

## What lives where

| Before (local SQLite) | Now |
|---|---|
| `users.db` on each PC | `users` + `system_security` tables in PostgreSQL |
| `database/<username>.db`: a separate copy per user | One shared set of tables for everyone |
| `electron/database/*Repository.cjs`, `electron/validation/*`, `electron/auth/*` | `server/src/repositories`, `server/src/validation`, `server/src/auth` |
| Tasks, reminders, "account info" in each user's own DB | Still private: stored per user (`tasks.user_id`, `user:<id>:<key>` settings) |
| Backups = copies of the `.db` file | Cloud provider backups + **Settings → Create Backup** downloads a `.json` copy |

Exports (Excel/PDF/PowerPoint) are still built on the PC. Only the data comes from the server.

## Run everything on your PC (development)

No PostgreSQL installation needed. `local-db` runs real PostgreSQL compiled to WebAssembly (PGlite).

```bash
cd server && npm install && cd ..
npm run dev:server     # terminal 1: local database (port 5433) + API server (port 4000)
npm run dev            # terminal 2: the desktop app (talks to http://localhost:4000)
```

On first start the server creates the first administrator. Set `ADMIN_PASSWORD` in `server/.env`
(copy `.env.example`), or read the generated password from the server output.

`npm run local-db` keeps its data in `server/.local-db/`. Add `-- --memory` for a throw-away database.
To run two users side by side on one PC, start a second app with
`HIMMEL_USER_DATA_DIR=<some folder>` set.

## Put it online (production)

### 1. Create the PostgreSQL database

Use any managed PostgreSQL 14+ (for example Neon, Supabase, Railway, AWS RDS or Azure).
Copy its connection string, for example `postgres://user:password@host:5432/dbname`.
Pick a region close to your users (and the same region as the server).

### 2. Host the server

Any Node.js 20+ host works (Render, Railway, Fly.io, a VPS with Nginx...). Deploy the `server/`
folder with:

- **Build:** `npm ci --omit=dev`
- **Start:** `npm start`
- **Health check path:** `/health`

Environment variables:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` (makes `JWT_SECRET` mandatory) |
| `DATABASE_URL` | connection string from step 1 |
| `DATABASE_SSL` | `on` (default). Use `no-verify` only if your provider asks for it, or set `DATABASE_SSL_CA` |
| `JWT_SECRET` | 48+ random characters: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | first administrator (only used while the database has no users) |
| `TRUST_PROXY` | `1` behind the host's proxy (Render/Railway/Fly/Nginx), `0` if exposed directly |
| `PORT` | usually set by the host |

The server must be reached over **https://** (all the hosts above provide it). The desktop app
refuses plain `http://` for anything other than `localhost`.

On every start the server applies `src/db/schema.sql`, which is safe to re-run, and seeds reference
data (unit types, divisions, groups, settings, business year) into an empty database.

### 3. Move the existing data (one time)

The old data is in `%APPDATA%\Himmel Pharmaceutical\` on the PC that used the desktop app:
`database\admin.db` (business data) and `users.db` (logins). Close the app, copy both files to
your PC, then:

```bash
cd server
# DATABASE_URL in server/.env (or the environment) must point at the cloud database
node scripts/import-from-sqlite.js --data path/to/admin.db --users path/to/users.db          # preview
node scripts/import-from-sqlite.js --data path/to/admin.db --users path/to/users.db --yes    # import
```

- The import **replaces** the data in the cloud database. Run it once, before people start using the cloud version.
- Everyone keeps their username and password. The recovery password and PIN are kept too.
- Tasks, reminders and "account info" from that file are given to the account that owned it
  (`users.database_name`, normally `admin`). Use `--owner <username>` to choose a different account.
- Only **one** business database can be imported: before, each user had a separate copy. If other users
  entered real orders in their own `database\<username>.db`, those orders must be merged by hand.
- Without `--users`, the existing cloud accounts are kept and only business data is replaced.

An admin can also use **Settings → Restore** in the app with an old `.db` backup. That replaces the
business data but leaves user accounts alone.

### 4. Point the desktop app at the server

Set the address in `electron/cloud.config.json` **before** building the installer:

```json
{ "apiUrl": "https://your-server.example.com", "allowInsecureHttp": false }
```

Then run `npm run electron:build`. To change the address on one PC without rebuilding, create
`%APPDATA%\Himmel Pharmaceutical\config\cloud.json` with the same content.

## Security notes

- **Roles are enforced on the server.** Managers can create and edit master data. Only Admins can delete
  master data, manage users, change company-wide settings, back up or restore, and view audit logs and
  diagnostics. Every role can enter and process orders, as the Sales Entry screen allows. To change a
  rule, edit `roles:` in `src/rpc/handlers.js`.
- **Sessions:** login tokens last `TOKEN_TTL` (12h by default). Changing or resetting a password, or
  disabling an account, signs that user out on every PC.
- **Emergency recovery** (login screen) works only after an Admin has set a recovery password/PIN in
  Settings. The old built-in defaults are refused over the internet. Recovery attempts are rate-limited,
  and recovery locks for 30 minutes after 5 failures.
- Login is rate-limited per IP, and accounts lock for 15 minutes after 5 wrong passwords (as before).
- The last active Admin cannot be disabled, demoted or deleted.

## Backups

1. Turn on your provider's automatic backups and point-in-time restore. This is the main safety net.
2. **Settings → Create Backup** (Admin) downloads the whole shared database to
   `%APPDATA%\Himmel Pharmaceutical\Backups\backup_<user>_<date>.json`. The backup schedule setting
   does this automatically on an Admin's PC.
3. **Settings → Restore** uploads a `.json` backup, or an old `.db` backup, and replaces the data for
   **every** user.

Login accounts are not included in in-app backups. Use provider backups for those.

## Changing the database later

Edit `src/db/schema.sql`. For a new column on an existing table, add
`ALTER TABLE <table> ADD COLUMN IF NOT EXISTS ...` at the end, because `CREATE TABLE IF NOT EXISTS`
does not change existing tables. Views and triggers are recreated on every start.

## Tests

```bash
cd server && npm test
```

The tests start the real server against an in-memory PostgreSQL (PGlite) and cover:
- every API area, including roles, sessions, recovery and backup/restore
- the import of a database made by the old desktop app (`test/fixtures/legacy-*.sqlite`), checked
  against the figures the SQLite version produced
