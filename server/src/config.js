const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load server/.env for local development. Hosting platforms set real environment variables instead.
const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envFile);
}

const pkg = require('../package.json');

const isProduction = process.env.NODE_ENV === 'production';

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

function readJwtSecret() {
  const secret = (process.env.JWT_SECRET || '').trim();
  if (secret.length >= 32) return secret;

  if (isProduction) {
    throw new Error('JWT_SECRET must be set to a random string of at least 32 characters in production.');
  }
  // Development fallback: tokens stop working whenever the server restarts.
  console.warn('[config] JWT_SECRET is not set (or shorter than 32 characters). Using a temporary random secret.');
  return crypto.randomBytes(48).toString('hex');
}

// Development default: the database started by `npm run local-db`.
const LOCAL_DATABASE_URL = 'postgres://postgres:postgres@127.0.0.1:5433/postgres';
const databaseUrl = (process.env.DATABASE_URL || (isProduction ? '' : LOCAL_DATABASE_URL)).trim();

const config = {
  isProduction,
  version: pkg.version,
  port: Number(process.env.PORT) || 4000,
  host: process.env.HOST || '0.0.0.0',

  databaseUrl,
  databaseSsl: readSslConfig(databaseUrl),
  databasePoolMax: Number(process.env.DATABASE_POOL_MAX) || 10,

  jwtSecret: readJwtSecret(),
  tokenTtl: process.env.TOKEN_TTL || '12h',
  recoveryTokenTtl: '10m',

  // Number of reverse proxies in front of the server (Render, Railway, Fly.io, Nginx...).
  // Needed so rate limiting sees the real client IP. Set to 0 when the server is exposed directly.
  trustProxy: process.env.TRUST_PROXY === undefined ? 1 : Number(process.env.TRUST_PROXY),

  // Backups/restores send the whole database as one JSON document.
  maxBodySize: process.env.MAX_BODY_SIZE || '100mb',

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
