const electron = require('electron');
const config = require('../config.cjs');
const logger = require('../logger.cjs');
const { loadCloudConfig, assertSecureUrl } = require('./cloudConfig.cjs');

const DEFAULT_TIMEOUT_MS = 30 * 1000;
const NETWORK_ERROR = 'Cannot reach the cloud server. Please check your internet connection and try again.';
const TIMEOUT_ERROR = 'The cloud server took too long to respond. Please try again.';
const SESSION_EXPIRED = 'Session expired. Please log in again.';
// Must not contain "Session expired" (with a capital S): the renderer treats that as a logout.
const RECOVERY_EXPIRED = 'The recovery session has expired. Please enter the recovery password or PIN again.';

// electron.net.fetch uses Chromium's network stack (system proxy settings); plain fetch is the fallback.
function doFetch(url, options) {
  if (electron && electron.net && typeof electron.net.fetch === 'function' && electron.app && electron.app.isReady()) {
    return electron.net.fetch(url, options);
  }
  return fetch(url, options);
}

/**
 * Talks to the cloud API server and keeps this computer's login session (in memory, like the old
 * SessionManager: closing the app signs the user out).
 */
class CloudClient {
  constructor() {
    this.token = null;
    this.session = null;
    this.recoveryToken = null;
    this.settings = null;
  }

  getSettings() {
    if (!this.settings) this.settings = loadCloudConfig();
    return this.settings;
  }

  getApiUrl() {
    return this.getSettings().apiUrl;
  }

  /**
   * Calls one server operation (same channel names as the IPC layer) and returns its data.
   * Throws an Error with a user-facing message on failure.
   */
  async request(channel, args = [], { timeoutMs = DEFAULT_TIMEOUT_MS, recovery = false } = {}) {
    const settings = this.getSettings();
    assertSecureUrl(settings);

    const headers = {
      'Content-Type': 'application/json',
      'X-Client-Version': config.version
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    if (recovery && this.recoveryToken) headers['X-Recovery-Token'] = this.recoveryToken;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await doFetch(`${settings.apiUrl}/api/rpc/${encodeURIComponent(channel)}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ args }),
        signal: controller.signal
      });
    } catch (err) {
      logger.error(`Cloud request ${channel} failed: ${err.message}`);
      throw new Error(controller.signal.aborted ? TIMEOUT_ERROR : NETWORK_ERROR);
    } finally {
      clearTimeout(timer);
    }

    let body = null;
    try {
      body = await response.json();
    } catch (e) {
      body = null;
    }

    if (response.status === 401) {
      if (recovery) {
        this.recoveryToken = null;
        throw new Error(RECOVERY_EXPIRED);
      }
      if (this.token) logger.warn(`Cloud session rejected on ${channel}; signing out.`);
      this.clearSession();
      throw new Error((body && body.error) || SESSION_EXPIRED);
    }

    if (!body || typeof body !== 'object') {
      throw new Error(`The cloud server returned an unexpected response (HTTP ${response.status}).`);
    }
    // The server re-issues the token after this user's own password change.
    if (body.refreshedToken) this.token = body.refreshedToken;
    if (!body.success) {
      throw new Error(body.error || 'The request failed. Please try again.');
    }
    return body.data;
  }

  async login(credentials) {
    const data = await this.request('auth:login', [credentials || {}]);
    this.token = data.token;
    this.session = data.session;
    this.recoveryToken = null;
    return this.getSession();
  }

  async logout() {
    if (this.token) {
      try {
        await this.request('auth:logout');
      } catch (err) {
        logger.warn(`Cloud logout could not be recorded: ${err.message}`);
      }
    }
    this.clearSession();
    return true;
  }

  // Emergency recovery: keep the short-lived token for the following user-management calls.
  async verifyRecovery(channel, args) {
    const data = await this.request(channel, args);
    this.recoveryToken = data && data.recoveryToken ? data.recoveryToken : null;
    return true;
  }

  clearSession() {
    this.token = null;
    this.session = null;
  }

  isAuthenticated() {
    return Boolean(this.token && this.session);
  }

  getSession() {
    if (!this.session) return null;
    return {
      user: { ...this.session.user },
      loginTimestamp: this.session.loginTimestamp
    };
  }

  getCurrentUsername() {
    return this.session ? this.session.user.username : 'System';
  }

  updateSessionUser(fields) {
    if (this.session) this.session.user = { ...this.session.user, ...fields };
  }

  async checkHealth() {
    const settings = this.getSettings();
    assertSecureUrl(settings);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await doFetch(`${settings.apiUrl}/health`, { signal: controller.signal });
      const body = await res.json();
      return { reachable: res.ok, ...body };
    } catch (err) {
      return { reachable: false, error: err.message };
    } finally {
      clearTimeout(timer);
    }
  }
}

module.exports = new CloudClient();
module.exports.CloudClient = CloudClient;
