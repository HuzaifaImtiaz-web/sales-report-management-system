# Himmel Sales – API Server

The only part of the system that talks to the database. The web app (in `../src`) calls it from
the browser; on Vercel it runs as one serverless function (`../api/index.js`), on any other host as
a normal Node.js server that also serves the built web app.

```
Browser ──HTTPS, session cookie + CSRF token──▶  this server (Node.js)  ──TLS──▶  PostgreSQL (Supabase)
```

The database password exists only in this server's environment variables. Browsers get an
HttpOnly session cookie, never a database credential or a token readable by scripts.

## Endpoints

| Method & path | Purpose |
|---|---|
| `POST /api/rpc/<channel>` | Every operation of the app, e.g. `orders:save`, `auth:login`. Body: `{ "args": [...] }`. Handlers and role rules: `src/rpc/handlers.js`. |
| `POST /api/export` | Builds an Excel / PDF / PowerPoint report and returns the file (Admin, Manager). |
| `POST /api/backup/download` | Gzipped JSON copy of the business data. Needs the admin's password again. |
| `POST /api/backup/restore` | Replaces the business data with a backup (gzipped upload). Needs the admin's password again. |
| `GET /health` | `{"status":"ok"}` when the database answers (for uptime checks). |

## How a request is checked (`src/app.js`)

1. Security headers on every response (CSP, HSTS, frame and MIME protections, no caching of API data).
2. A coarse per-IP request budget, then the cross-site checks: `Origin` must be this site (or
   `APP_ORIGIN`), `Sec-Fetch-Site` must not be cross-site, bodies must be JSON.
3. The session cookie is looked up in the `sessions` table (only its SHA-256 hash is stored). The
   session must not be expired or idle, the account must be active, and its password must not have
   changed since sign-in.
4. Every signed-in call must send the session's CSRF token in `X-CSRF-Token`.
5. The channel's role list is checked; sign-in and recovery attempts are counted in `rate_limits`.

Sessions last 12 hours and end after 30 minutes without activity (`SESSION_TTL_HOURS`,
`SESSION_IDLE_MINUTES`). Signing out deletes the session on the server. Changing a password,
an admin reset, or disabling an account ends that user's other sessions immediately.

## Configuration

All settings are environment variables; `server/.env` is read in development (never commit it).
See [.env.example](.env.example) for the full list. In production you need at least
`NODE_ENV=production`, `DATABASE_URL`, `DATABASE_SSL_CA` (Supabase) and `APP_ORIGIN`.

## Scripts

| Command (in `server/`) | What it does |
|---|---|
| `npm start` | Applies the schema, then serves the API (and `../dist` if it exists) on `$PORT`. |
| `npm run migrate` | Applies `src/db/schema.sql` and creates the first administrator if there are no users. |
| `npm test` | All tests (PGlite in memory; never touches a real database). |
| `npm run local-db` | A local PostgreSQL on port 5433 for manual testing. |
| `node scripts/dev-local.js` | Local database + API in one process (`npm run dev` in the project folder uses it). |
| `npm run import-sqlite` | One-time import of the desktop app's SQLite files (below). |

## Moving data from the desktop app

```bash
node scripts/import-from-sqlite.js --data "<folder>/database/admin.db" --users "<folder>/users.db"        # preview
node scripts/import-from-sqlite.js --data "<folder>/database/admin.db" --users "<folder>/users.db" --yes  # import
```

Uses `DATABASE_URL` from `server/.env`. Needs Node.js 22.13+ (built-in `node:sqlite`). The import
replaces the business data in the cloud database, and with `--users` also all accounts and the
emergency recovery password/PIN (passwords keep working). Only one business database can be
imported; if several PCs hold real data, merge them by hand first.

## Backups

`Settings → Backup Now` downloads a gzipped JSON copy of the business data (accounts are not
included). Restoring one replaces the business data for everyone. The database host's own backups
(Supabase Pro: daily, point-in-time recovery) remain the primary safety net.

## Tests

`npm test` runs the real server against PostgreSQL in memory: business rules, every role
restriction, sessions, CSRF and cross-site checks, security headers, password policy, rate
limiting, exports in all three formats, backups, emergency recovery and the import of a database
made by the old desktop app (`test/fixtures/legacy-*.sqlite`).
