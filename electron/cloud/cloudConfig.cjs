const fs = require('fs');
const path = require('path');
const { getStorageDirectory } = require('../paths.cjs');
const logger = require('../logger.cjs');

const DEFAULT_API_URL = 'http://localhost:4000';

function readJson(file) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    logger.error(`Could not read cloud configuration ${file}: ${e.message}`);
  }
  return {};
}

/**
 * Address of the cloud API server, first match wins:
 *   1. HIMMEL_API_URL environment variable (development)
 *   2. %APPDATA%\Himmel Pharmaceutical\config\cloud.json on this computer (change it without rebuilding)
 *   3. electron/cloud.config.json shipped inside the installer (set it before `npm run electron:build`)
 */
function loadCloudConfig() {
  const shipped = readJson(path.join(__dirname, '..', 'cloud.config.json'));
  const local = readJson(path.join(getStorageDirectory(), 'config', 'cloud.json'));

  const apiUrl = String(process.env.HIMMEL_API_URL || local.apiUrl || shipped.apiUrl || DEFAULT_API_URL)
    .trim()
    .replace(/\/+$/, '');
  const allowInsecureHttp = Boolean(
    process.env.HIMMEL_ALLOW_HTTP === '1' || local.allowInsecureHttp || shipped.allowInsecureHttp
  );

  return { apiUrl, allowInsecureHttp };
}

// Passwords travel to this address, so anything other than this computer must use https://.
function assertSecureUrl({ apiUrl, allowInsecureHttp }) {
  let url;
  try {
    url = new URL(apiUrl);
  } catch (e) {
    throw new Error(`The cloud server address "${apiUrl}" is not valid. Check cloud.config.json.`);
  }
  const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !isLocal && !allowInsecureHttp) {
    throw new Error('The cloud server address must start with https:// to keep passwords and data encrypted.');
  }
}

module.exports = { loadCloudConfig, assertSecureUrl };
