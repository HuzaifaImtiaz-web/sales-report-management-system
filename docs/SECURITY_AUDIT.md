# Security Audit – Himmel Sales Management (web app v2.0.0)

**Date:** 12 October 2026 · **Scope:** the whole repository (web app, API server, database
schema, hosting configuration, dependencies, full git history) as it moved from a desktop
(Electron) app to a public website on Vercel + Supabase.

**How it was checked:** code review of every server route and screen; 47 automated API tests
(including new security tests) on a real PostgreSQL; 41 automated checks in headless Chrome
against the production build served with the production security headers (zero
Content-Security-Policy violations); `npm audit` on both packages; a secret scan of all 23
commits on every branch; inspection of database files found in history; live checks of the
Supabase database permissions.

---

## Your checklist

| Request | Status | Where |
|---|---|---|
| Hide API keys | Done. No key, password or token in the web app's code; secrets live only in server environment variables. The Supabase keys are not used at all. | `src/`, `vercel.json`, `server/.env.example` |
| Check environment variables | Done. Production refuses to start without `DATABASE_URL`; `ADMIN_PASSWORD` must meet the policy; `.env` files are git- and Vercel-ignored; tests never read `.env`. | `server/src/config.js` |
| Protect admin routes | Done. Every admin operation is checked on the server; screens also hide what a role cannot use. | `server/src/rpc/handlers.js` |
| Proper authentication | Done. Server-side sessions in HttpOnly/Secure/SameSite=Strict cookies, idle and absolute timeouts, real logout, sessions end on password change/disable, account lockout, mandatory admin security setup. | `server/src/auth/sessions.js` |
| Users only access what they should | Done. Role checks on every operation (including order completion/cancel/delete, which were open to every role); tasks, reminders and personal settings private per user. | handlers + tests |
| Sanitize forms / prevent XSS | Done. Server rejects markup and script URLs in text fields; React escapes all output; strict CSP (`script-src 'self'`); CSV exports neutralise formulas. | `ValidationService.js`, `exportUtils.js` |
| Rate limiting | Done. Sign-in, emergency recovery, password re-checks and exports are counted in the database (works across serverless instances), plus a per-IP request budget. | `rateLimiter.js`, `security.js` |
| Secure API endpoints | Done. Session + CSRF token on every signed-in call, origin checks, JSON-only bodies, size limits, generic error messages. | `server/src/app.js` |
| CORS settings | Done. No CORS headers at all (other sites cannot read responses); cross-site POSTs rejected by `Origin`/`Sec-Fetch-Site`; optional allow-list via `APP_ORIGIN`. | `security.js` |
| Security headers | Done. CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP/CORP; API responses `no-store`. Same headers in `vercel.json` (a test keeps them identical). | `security.js`, `vercel.json` |
| Turn off debug mode | Done. No source maps; `console.log` stripped from production builds; server debug lines only with `LOG_LEVEL=debug`; no stack traces in responses; `X-Powered-By` off; search engines told not to index. | `vite.config.js` |
| Update dependencies, remove unused | Done. Electron, electron-builder, better-sqlite3, docx, react-hook-form, jsonwebtoken and 389 packages removed; React Router 7, Vite 7; safe audit fixes applied. Remaining advisories below. | `package.json` |
| Check for exposed files | Done. Database/backup folders are untracked; `.vercelignore` added; only `dist/` and the API function are deployed. | `.gitignore`, `.vercelignore` |
| Secure the database | Done. TLS with certificate verification; Supabase Data API roles have no access (verified: 0 tables reachable); parameterized SQL everywhere; session tokens and passwords stored only as hashes. | Supabase, `db/index.js` |
| Hash passwords properly | Verified/improved. bcrypt cost 12 with constant-time handling of unknown users; new shared policy (10+ chars, upper/lower/number/symbol, no username, not a common password, max 72 bytes). | `PasswordService.js`, `passwordPolicy.js` |
| Check git history for leaked secrets | Done. No API keys, tokens, private keys or real passwords in any commit. Details below. | – |
| Full security audit | This document. | – |

---

## Findings fixed

| # | Severity | Finding | Fix |
|---|---|---|---|
| 1 | Critical | In a browser the app fell back to a fake login: admin / `Password123!` accepted in the page, other users kept with **plaintext passwords in localStorage**, emergency recovery accepted `Recovery@123` / `1234` locally. On a public website this path would have been live. | All browser-only fallbacks and mock data removed; the web app only talks to the server (`src/api/webApi.js`). |
| 2 | High | Order completion, cancellation and deletion allowed for every role on the server, contrary to the app's own permission matrix. | Enforced: complete = Admin; cancel = Admin, Manager; delete = Admin (`ORDER_STATUS_ROLES`). Buttons hidden accordingly. |
| 3 | High | Login token usable by page scripts; no server-side logout or idle timeout. | Random session token in an HttpOnly, Secure, SameSite=Strict `__Host-` cookie; hash stored in `sessions`; 30-minute idle and 12-hour absolute expiry; logout deletes the session. |
| 4 | High | Cookie-based sessions need CSRF protection. | Per-session CSRF token required on every signed-in call; recovery has its own; `Origin`/`Sec-Fetch-Site` checks; JSON-only bodies (forms cannot send them). |
| 5 | High | Rate limits kept in memory, ineffective on serverless hosting (each instance counts separately). | Counters in the database for sign-in (per IP), recovery (per IP), password re-checks (per user) and exports (per user). |
| 6 | High | CSV injection: the audit-log CSV export wrote values like failed-login usernames unescaped (`=HYPERLINK(...)` runs when opened in Excel); quotes broke rows. | `csvCell()` quotes every cell and prefixes formula characters. |
| 7 | Medium | Weak and inconsistent password rules (admin-created and reset passwords only needed 8 characters). | One policy on the server and screens (see checklist), enforced for creation, change, admin reset, recovery reset and the first administrator. |
| 8 | Medium | 4-digit emergency recovery PIN over the internet. | New PINs must be 6–8 digits; attempts rate-limited and the recovery lock (5 failures → 30 min) kept. Older 4-digit PINs still verify; change them in Settings. |
| 9 | Medium | No HTTP security headers suitable for a website. | Full header set (checklist); verified with a strict CSP in Chrome. |
| 10 | Medium | A stolen session could download or wipe all data through backup/restore. | Both require re-entering the admin password (rate-limited); backups travel gzipped with size limits; restore body read only after the session check. |
| 11 | Medium | First-login security setup never appeared (wrong field read, then a remount race); its text showed the default password. | Setup is now driven by the auth state and is mandatory for administrators until done; default-password text removed. |
| 12 | Medium | Supabase Data API could serve the tables to anyone with the publishable key (shared during setup). | `anon`/`authenticated` privileges revoked on all objects and for future objects; verified 0 reachable. |
| 13 | Low | `auth:getSecurityStatus` was public (revealed whether recovery is configured). | Requires sign-in; non-admins get only `isFirstLoginPending: false`. |
| 14 | Low | Login said "account disabled" before checking the password (account enumeration). | Disabled/maintenance messages only after a correct password. |
| 15 | Low | Fonts loaded from Google; logo could be any external image URL (leaks visitors' IPs, conflicts with CSP). | Fonts self-hosted; logo is an uploaded PNG/JPG/WebP (≤1 MB) stored as image data. |
| 16 | Low | Audit-log page size taken from the client without a cap; unbounded search text. | Capped at 500 rows; search terms capped. |
| 17 | Low | The whole `package.json` (dependencies, repository details) was bundled into the site's JavaScript. | Only the version number is included. |
| 18 | Low | Notifications persisted in localStorage (visible to the next user of a shared PC). | Per-tab storage, cleared on sign-out; theme/sidebar preferences are the only localStorage keys left. |
| 19 | Low | The input filter rejected normal text ("prescription", "description", "Union Hospital") while suggesting SQL protection it did not provide. | Precise checks for markup/script URLs/control characters; SQL injection is prevented by parameterized queries (verified for every query). |
| 20 | Info | Audit entries had no client address. | IP recorded on every audit entry. |

Functional bugs fixed along the way: "Unlock account" called an emergency-recovery-only function
(always failed; now `auth:unlockUser`); multi-page PDF exports failed (`bufferPages`) and footers
could create blank pages; the page title in the top bar always said "Dashboard".

---

## Verified, no change needed

- Every SQL query uses bound parameters (the `?` → `$n` converter skips strings and comments);
  interpolated fragments are fixed table/column names only.
- React escapes all output; no `dangerouslySetInnerHTML`, `eval`, `innerHTML` or `new Function`.
- Every non-public operation checks the session; role lists match the permission matrix
  (with the deliberate change in finding 2, and the Audit Trail limited to administrators).
- Tasks, reminders and personal settings are filtered by the signed-in user's id on the server.
- Password hashes never leave the server (`getAllUsers` returns public fields only).
- Database connection uses TLS with the Supabase CA certificate (`rejectUnauthorized: true`).

---

## Git history and exposed files

- **Secrets:** pattern scan of all text in all 23 commits (private keys, AWS/GitHub/Stripe/Slack
  tokens, Supabase secret keys, JWTs, credentialed database URLs): only the local development
  placeholder `postgres:postgres@127.0.0.1` matched. No real credentials.
- **Database files in history** (`HimmelSales.db`, `database/admin.db-wal`, a sample backup):
  starter reference data and table definitions only; no users, no password hashes, no doctor
  names or phone numbers (email addresses found are placeholder `@himmel.com` ones). They remain
  in history but are harmless.
- **Repository size:** 620 MB of history comes from installers committed earlier. Not a security
  issue; it can be removed with a history rewrite (force push) if you want a smaller repository.
- **Current tree:** `Backups/`, `UserData/`, `database/`, `dist/`, `release/` and `.env` files are
  untracked; `.vercelignore` keeps them out of CLI deployments.

---

## Dependencies (`npm audit`)

- **Server: 4 findings, not exploitable here.** `image-size` (via `pptxgenjs`) can hang on
  malicious JXL/HEIF/ICNS images; the only image processed is the bundled PNG logo. `uuid` (via
  `exceljs`) misbehaves when given a caller buffer; `exceljs` never does that. The offered fixes
  downgrade both libraries. Re-check when new versions are released.
- **Web app: 7 findings, build-time only.** All come from Tailwind CSS 3's file watcher and CSS
  parser (`braces`, `micromatch`, `chokidar`, `fast-glob`, `postcss-selector-parser`), which only
  run on your own source files during the build and never reach the website. Clearing them needs
  the Tailwind 4 migration.
- React Router (open redirect, SSR deserialization) and Vite (development server) advisories were
  resolved by upgrading to React Router 7 and Vite 7.

---

## Remaining risks and recommendations

1. **Turn on Vercel Firewall rate limiting** for `/api/rpc/auth:login` and `/api/rpc/auth:*Recovery*`
   (defence in depth against distributed password guessing; the app's own limits remain).
2. **Database backups:** Supabase's free plan has no automatic backups and pauses after a week of
   inactivity. Use Supabase Pro (daily backups, point-in-time recovery) for production, and keep
   downloading backups from Settings.
3. **Two-factor authentication** for administrators is not implemented; consider it next.
4. **Custom domain:** set one and `APP_ORIGIN`; later consider HSTS preload.
5. **Recovery PINs imported from the desktop app** may be 4 digits: change them in Settings → Security.
6. **Database role:** the app connects as the database owner (restore and migrations need it).
   A separate least-privilege role for day-to-day traffic is possible later.
7. **Order rules** are now strict (finding 2). If representatives must complete their own sales,
   change one line in `ORDER_STATUS_ROLES` (`server/src/rpc/handlers.js`) and `permissionService.js`.
8. **Keys shared during setup:** the Supabase publishable key and project URL were pasted in a chat.
   They are designed to be public and the Data API is now locked, so no action is required; the
   secret key was masked. Rotate them in Supabase if you want to be thorough.

---

## Re-running the checks

```bash
npm test          # 47 API and security tests (PostgreSQL in memory)
npm audit         # web app dependencies
npm --prefix server audit
```
