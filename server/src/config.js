const fs = require('fs');
const path = require('path');

// Load server/.env for local development. Hosting platforms set real environment variables instead.
// Tests set HIMMEL_SKIP_ENV_FILE so a developer's real database settings are never picked up.
const envFile = path.join(__dirname, '..', '.env');
if (!process.env.HIMMEL_SKIP_ENV_FILE && fs.existsSync(envFile) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envFile);
}

const pkg = require('../package.json');

const isProduction = process.env.NODE_ENV === 'production';
const isVercel = Boolean(process.env.VERCEL);

function readSslConfig(databaseUrl) {
  const mode = (process.env.DATABASE_SSL || '').trim().toLowerCase();
  const isLocal = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/i.test(databaseUrl || '');

  if (mode === 'off' || mode === 'false' || mode === 'disable' || (!mode && isLocal)) {
    return false;
  }

  const ssl = { rejectUnauthorized: mode !== 'no-verify' };
  const ca = (process.env.DATABASE_SSL_CA || '').trim();
  if (ca) {
    ssl.ca = ca.includes('BEGIN CERTIFICATE') ? ca.replace(/\\n/g, '\n') : fs.readFileSync(ca, 'utf8');
  }
  return ssl;
}

function positiveNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// Origins allowed to send requests (comma-separated), e.g. https://sales.example.com.
// Empty: only the site the request was sent to (same host) is accepted.
function readAllowedOrigins() {
  return (process.env.APP_ORIGIN || '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

// Built web app (vite build) served by this server on hosts other than Vercel (Render, Railway, a VPS...).
function readStaticDir() {
  if (isVercel || process.env.SERVE_STATIC === 'false') return null;
  const dir = path.resolve(process.env.STATIC_DIR || path.join(__dirname, '..', '..', 'dist'));
  return fs.existsSync(path.join(dir, 'index.html')) ? dir : null;
}

// Development default: the database started by `npm run local-db`.
const LOCAL_DATABASE_URL = 'postgres://postgres:postgres@127.0.0.1:5433/postgres';
const databaseUrl = (process.env.DATABASE_URL || (isProduction ? '' : LOCAL_DATABASE_URL)).trim();

// Session cookies are Secure (HTTPS only) in production. COOKIE_SECURE=false allows plain HTTP for
// local testing of a production build; never set it on a public server.
const cookieSecure = process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE !== 'false' : isProduction;

const config = {
  isProduction,
  isVercel,
  version: pkg.version,
  port: Number(process.env.PORT) || 4000,
  host: process.env.HOST || '0.0.0.0',

  databaseUrl,
  databaseSsl: readSslConfig(databaseUrl),
  // Serverless instances are many and short-lived: keep each one's pool small.
  databasePoolMax: positiveNumber(process.env.DATABASE_POOL_MAX, isVercel ? 3 : 10),

  session: {
    // Absolute lifetime of a sign-in, and how long it survives without any request.
    ttlMs: positiveNumber(process.env.SESSION_TTL_HOURS, 12) * 60 * 60 * 1000,
    idleMs: positiveNumber(process.env.SESSION_IDLE_MINUTES, 30) * 60 * 1000,
    recoveryTtlMs: 10 * 60 * 1000
  },

  cookies: {
    secure: cookieSecure,
    // The __Host- prefix makes browsers refuse the cookie unless it is Secure, host-only and Path=/.
    session: cookieSecure ? '__Host-himmel_sid' : 'himmel_sid',
    recovery: cookieSecure ? '__Host-himmel_rsid' : 'himmel_rsid'
  },

  allowedOrigins: readAllowedOrigins(),

  // Number of reverse proxies in front of the server (Vercel, Render, Railway, Fly.io, Nginx...).
  // Needed so rate limiting sees the real client IP. Set to 0 when the server is exposed directly.
  trustProxy: process.env.TRUST_PROXY === undefined ? 1 : Number(process.env.TRUST_PROXY),

  // Normal requests are small (a company logo is the largest). A restore uploads the whole
  // database; the browser gzips it, and this limit applies to the unzipped JSON.
  normalBodySize: process.env.MAX_REQUEST_SIZE || '3mb',
  maxBodySize: process.env.MAX_BODY_SIZE || '100mb',

  staticDir: readStaticDir(),

  // First-start administrator account (only used while the users table is empty).
  adminUsername: (process.env.ADMIN_USERNAME || 'admin').trim(),
  adminPassword: process.env.ADMIN_PASSWORD || '',
  adminFullName: process.env.ADMIN_FULL_NAME || 'System Administrator'
};

function assertDatabaseConfigured() {
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is not set. Copy server/.env.example to server/.env and fill it in.');
  }
}

module.exports = config;
module.exports.assertDatabaseConfigured = assertDatabaseConfigured;
