// The web app's connection to the server. It provides window.api with the same methods the
// screens have always used (window.api.products.getAll() ...); every call becomes
// POST /api/rpc/<channel> and resolves to { success: true, data } or { success: false, error }.
//
// Security model:
//  - The session lives in an HttpOnly cookie the browser sends automatically; scripts never see it.
//  - Every signed-in call carries a CSRF token, kept here in memory only (never in localStorage).
//  - The emergency recovery screen uses its own short-lived session and token.
import { APP_VERSION } from '../utils/version';

const NETWORK_ERROR = 'Cannot reach the server. Please check your internet connection and try again.';
const RECOVERY_CHANNELS = new Set(['auth:recoveryGetUsers', 'auth:recoveryToggleUserStatus', 'auth:recoveryResetUserPassword']);
const RECOVERY_START = new Set(['auth:recoveryVerifyPassword', 'auth:verifyRecoveryPin']);

let csrfToken = null;
let recoveryCsrfToken = null;

function signalSessionExpired(message) {
  csrfToken = null;
  window.dispatchEvent(new CustomEvent('session-expired', { detail: { message } }));
}

function rememberToken(channel, response, body) {
  const rotated = response.headers.get('X-CSRF-Token');
  if (rotated) csrfToken = rotated;
  const data = body && body.data;
  if (!data || !data.csrfToken) return;
  if (RECOVERY_START.has(channel)) recoveryCsrfToken = data.csrfToken;
  else if (channel === 'auth:login' || channel === 'auth:getCurrentUser') csrfToken = data.csrfToken;
}

async function send(path, { body, headers = {}, isRecovery = false } = {}) {
  const token = isRecovery ? recoveryCsrfToken : csrfToken;
  return fetch(path, {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(token ? { 'X-CSRF-Token': token } : {}), ...headers },
    body
  });
}

async function readJson(response) {
  try {
    return await response.json();
  } catch (e) {
    return null;
  }
}

/** Re-reads this browser's CSRF token (after it rotated in another tab, for example). */
async function refreshCsrfToken() {
  const response = await send('/api/rpc/auth:getCurrentUser', { body: JSON.stringify({ args: [] }) });
  const body = await readJson(response);
  rememberToken('auth:getCurrentUser', response, body);
  return Boolean(body && body.data);
}

async function invoke(channel, ...args) {
  const isRecovery = RECOVERY_CHANNELS.has(channel);
  const payload = JSON.stringify({ args });

  for (let attempt = 0; attempt < 2; attempt++) {
    let response;
    try {
      response = await send(`/api/rpc/${encodeURIComponent(channel)}`, { body: payload, isRecovery });
    } catch (err) {
      return { success: false, error: NETWORK_ERROR };
    }

    const body = await readJson(response);
    rememberToken(channel, response, body);

    // A stale CSRF token (rotated by a password change in another tab): refresh once and retry.
    if (response.status === 403 && body && body.code === 'CSRF' && attempt === 0 && !isRecovery) {
      if (await refreshCsrfToken()) continue;
    }

    if (!body || typeof body !== 'object') {
      return { success: false, error: `The server returned an unexpected response (HTTP ${response.status}).` };
    }
    if (response.status === 401 && !isRecovery && !RECOVERY_START.has(channel)) {
      signalSessionExpired(body.error || 'Session expired. Please log in again.');
    }
    if (channel === 'auth:logout') csrfToken = null;
    return body.success ? { success: true, data: body.data } : { success: false, error: body.error || 'The request failed. Please try again.' };
  }
  return { success: false, error: 'The request failed. Please try again.' };
}

// ─── Files (exports, backups) ───────────────────────────────────────────────

function fileNameFrom(response, fallback) {
  const header = response.headers.get('Content-Disposition') || '';
  const match = /filename="([^"]+)"/.exec(header);
  return match ? match[1] : fallback;
}

function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
}

async function download(path, payload, fallbackName) {
  let response;
  try {
    response = await send(path, { body: JSON.stringify(payload) });
    if (response.status === 403) {
      const body = await readJson(response.clone());
      if (body && body.code === 'CSRF' && await refreshCsrfToken()) {
        response = await send(path, { body: JSON.stringify(payload) });
      }
    }
  } catch (err) {
    return { success: false, error: NETWORK_ERROR };
  }

  if (!response.ok) {
    const body = await readJson(response);
    if (response.status === 401) signalSessionExpired((body && body.error) || 'Session expired. Please log in again.');
    return { success: false, error: (body && body.error) || `Download failed (HTTP ${response.status}).` };
  }

  const fileName = fileNameFrom(response, fallbackName);
  saveBlob(await response.blob(), fileName);
  return {
    success: true,
    data: { fileName, totalRecords: Number(response.headers.get('X-Export-Records')) || 0 }
  };
}

async function gunzipToText(buffer) {
  const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).text();
}

async function gzip(text) {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Response(stream).arrayBuffer();
}

/** Reads a backup file chosen by the user (.json or .json.gz) and uploads it gzipped. */
async function restoreBackup(file, password) {
  if (!file) return { success: false, error: 'Choose a backup file first.' };
  let snapshot;
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer.slice(0, 16));
    if (bytes[0] === 0x53 && bytes[1] === 0x51 && bytes[2] === 0x4c) {
      return { success: false, error: 'This is a backup from the old desktop app (.db). Ask your administrator to import it with the server\'s import tool.' };
    }
    const text = bytes[0] === 0x1f && bytes[1] === 0x8b ? await gunzipToText(buffer) : new TextDecoder().decode(buffer);
    snapshot = JSON.parse(text);
  } catch (err) {
    return { success: false, error: 'Invalid Backup File: the file is not a Himmel backup.' };
  }

  let response;
  try {
    const body = await gzip(JSON.stringify({ password, snapshot, fileName: file.name }));
    response = await send('/api/backup/restore', { body, headers: { 'Content-Encoding': 'gzip' } });
  } catch (err) {
    return { success: false, error: NETWORK_ERROR };
  }
  const body = await readJson(response);
  if (response.status === 401) signalSessionExpired((body && body.error) || 'Session expired. Please log in again.');
  if (!body) return { success: false, error: `The server returned an unexpected response (HTTP ${response.status}).` };
  return body.success ? { success: true, data: body.data } : { success: false, error: body.error };
}

const notInWebApp = async () => ({ success: false, error: 'This feature is only available in the desktop app.' });

function crud(prefix) {
  return {
    getAll: () => invoke(`${prefix}:getAll`),
    getById: (id) => invoke(`${prefix}:getById`, id),
    save: (item) => invoke(`${prefix}:save`, item),
    delete: (id) => invoke(`${prefix}:delete`, id)
  };
}

export function createWebApi() {
  return {
    dashboardData: (filters) => invoke('reports:getDashboardSummaryData', filters),

    categories: crud('categories'),
    divisions: { getAll: () => invoke('divisions:getAll') },
    products: crud('products'),
    areas: crud('areas'),
    doctors: crud('doctors'),
    institutions: crud('institutions'),
    teamMembers: crud('teamMembers'),
    targets: {
      ...crud('targets'),
      getActiveBusinessYears: () => invoke('targets:getActiveBusinessYears')
    },
    orders: {
      ...crud('orders'),
      changeStatus: (id, newStatus, reason) => invoke('orders:changeStatus', id, newStatus, reason)
    },
    settings: {
      getAll: () => invoke('settings:getAll'),
      save: (key, value, groupName) => invoke('settings:save', key, value, groupName),
      getByKey: (key) => invoke('settings:getByKey', key)
    },
    auditLogs: {
      getAll: (filters) => invoke('auditLogs:getAll', filters),
      getById: (id) => invoke('auditLogs:getById', id)
    },
    export: {
      // Builds the file on the server and downloads it in the browser.
      generate: ({ reportType, format, filters } = {}) => download('/api/export', {
        reportType,
        format,
        filters,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }, `Himmel_${String(reportType || 'Export').replace(/[^a-zA-Z0-9]/g, '_')}`),
      getHistory: () => invoke('export:getHistory'),
      getPreviewData: (params) => invoke('export:getPreviewData', params),
      openFile: notInWebApp
    },
    production: {
      getConfig: async () => ({
        success: true,
        data: {
          mode: 'production',
          version: APP_VERSION,
          // eslint-disable-next-line no-undef
          buildDate: typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : undefined,
          platform: 'Web',
          dbEngine: 'PostgreSQL (Cloud)',
          reactVersion: '18.3.1',
          cloudServer: window.location.origin
        }
      }),
      downloadBackup: (password) => download('/api/backup/download', { password }, 'Himmel_Backup.json.gz'),
      restoreBackup,
      getBackupHistory: () => invoke('backup:getHistory'),
      runIntegrityCheck: () => invoke('integrity:check'),
      getDiagnostics: () => invoke('diagnostics:get')
    },
    tasks: {
      getAll: () => invoke('tasks:getAll'),
      save: (t) => invoke('tasks:save', t),
      delete: (id) => invoke('tasks:delete', id)
    },
    reminders: {
      getAll: () => invoke('reminders:getAll'),
      save: (r) => invoke('reminders:save', r),
      delete: (id) => invoke('reminders:delete', id)
    },
    auth: {
      login: (credentials) => invoke('auth:login', credentials),
      logout: () => invoke('auth:logout'),
      getCurrentUser: () => invoke('auth:getCurrentUser'),
      createUser: (user) => invoke('auth:createUser', user),
      changePassword: (data) => invoke('auth:changePassword', data),
      changeUsername: (data) => invoke('auth:changeUsername', data),
      resetPassword: (data) => invoke('auth:resetPassword', data),
      activateUser: (username) => invoke('auth:activateUser', { username }),
      disableUser: (username) => invoke('auth:disableUser', { username }),
      unlockUser: (username) => invoke('auth:unlockUser', { username }),
      getAllUsers: () => invoke('auth:getAllUsers'),
      changeRole: (username, role) => invoke('auth:changeRole', { username, role }),
      deleteUser: (username) => invoke('auth:deleteUser', username),
      getSecurityStatus: () => invoke('auth:getSecurityStatus'),
      completeFirstLoginWizard: (data) => invoke('auth:completeFirstLoginWizard', data),
      changeRecoveryPassword: (data) => invoke('auth:changeRecoveryPassword', data),
      verifyRecoveryPin: (pin) => invoke('auth:verifyRecoveryPin', { pin }),
      changeRecoveryPin: (data) => invoke('auth:changeRecoveryPin', data),
      resetRecoveryPasswordWithPin: (data) => invoke('auth:resetRecoveryPasswordWithPin', data)
    },
    recovery: {
      verifyPassword: (password) => invoke('auth:recoveryVerifyPassword', password),
      getUsers: () => invoke('auth:recoveryGetUsers'),
      toggleStatus: (data) => invoke('auth:recoveryToggleUserStatus', data),
      resetPassword: (data) => invoke('auth:recoveryResetUserPassword', data)
    },
    search: {
      global: (query) => invoke('search:global', query)
    },
    analytics: {
      getDashboardSummary: () => invoke('analytics:getDashboardSummary'),
      getMonthlySales: () => invoke('analytics:getMonthlySales'),
      getTopProducts: () => invoke('analytics:getTopProducts'),
      getAreaPerformance: () => invoke('analytics:getAreaPerformance'),
      getRepresentativePerformance: () => invoke('analytics:getRepresentativePerformance'),
      getTargetProgress: () => invoke('analytics:getTargetProgress'),
      getRecentOrders: () => invoke('analytics:getRecentOrders')
    },
    reports: {
      getDashboardSummaryData: (filters) => invoke('reports:getDashboardSummaryData', filters),
      getSalesTrendData: (filters) => invoke('reports:getSalesTrendData', filters),
      getTargetAchievementData: (filters) => invoke('reports:getTargetAchievementData', filters),
      getTeamContributionData: (filters) => invoke('reports:getTeamContributionData', filters),
      getProductPerformanceData: (filters) => invoke('reports:getProductPerformanceData', filters),
      getReportsData: (filters) => invoke('reports:getReportsData', filters)
    }
  };
}

/** Installs window.api once, before the app renders. */
export function installWebApi() {
  if (!window.api) {
    Object.defineProperty(window, 'api', { value: Object.freeze(createWebApi()), writable: false, configurable: false });
  }
  return window.api;
}
