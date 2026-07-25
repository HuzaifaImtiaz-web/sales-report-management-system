const { contextBridge, ipcRenderer } = require('electron');

const safeInvoke = async (channel, ...args) => {
  try {
    const res = await ipcRenderer.invoke(channel, ...args);
    if (res && res.success === false) {
      const errMsg = res.error || '';
      if (
        errMsg.includes('Session expired') ||
        errMsg.includes('No active session') ||
        errMsg.includes('Unauthorized')
      ) {
        window.dispatchEvent(new CustomEvent('session-expired', { detail: { message: errMsg } }));
      }
    }
    return res;
  } catch (err) {
    const errMsg = err.message || '';
    if (
      errMsg.includes('Session expired') ||
      errMsg.includes('No active session') ||
      errMsg.includes('Unauthorized')
    ) {
      window.dispatchEvent(new CustomEvent('session-expired', { detail: { message: errMsg } }));
    }
    throw err;
  }
};

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  version: process.versions.electron
});

contextBridge.exposeInMainWorld('api', {
  dashboardData: (filters) => safeInvoke('reports:getDashboardSummaryData', filters),

  categories: {
    getAll: () => safeInvoke('categories:getAll'),
    getById: (id) => safeInvoke('categories:getById', id),
    save: (c) => safeInvoke('categories:save', c),
    delete: (id) => safeInvoke('categories:delete', id)
  },

  divisions: {
    getAll: () => safeInvoke('divisions:getAll')
  },

  products: {
    getAll: () => safeInvoke('products:getAll'),
    getById: (id) => safeInvoke('products:getById', id),
    save: (p) => safeInvoke('products:save', p),
    delete: (id) => safeInvoke('products:delete', id)
  },
  areas: {
    getAll: () => safeInvoke('areas:getAll'),
    getById: (id) => safeInvoke('areas:getById', id),
    save: (a) => safeInvoke('areas:save', a),
    delete: (id) => safeInvoke('areas:delete', id)
  },
  doctors: {
    getAll: () => safeInvoke('doctors:getAll'),
    getById: (id) => safeInvoke('doctors:getById', id),
    save: (d) => safeInvoke('doctors:save', d),
    delete: (id) => safeInvoke('doctors:delete', id)
  },
  institutions: {
    getAll: () => safeInvoke('institutions:getAll'),
    getById: (id) => safeInvoke('institutions:getById', id),
    save: (inst) => safeInvoke('institutions:save', inst),
    delete: (id) => safeInvoke('institutions:delete', id)
  },
  teamMembers: {
    getAll: () => safeInvoke('teamMembers:getAll'),
    getById: (id) => safeInvoke('teamMembers:getById', id),
    save: (tm) => safeInvoke('teamMembers:save', tm),
    delete: (id) => safeInvoke('teamMembers:delete', id)
  },
  targets: {
    getAll: () => safeInvoke('targets:getAll'),
    getById: (id) => safeInvoke('targets:getById', id),
    save: (t) => safeInvoke('targets:save', t),
    delete: (id) => safeInvoke('targets:delete', id),
    getActiveBusinessYears: () => safeInvoke('targets:getActiveBusinessYears')
  },
  orders: {
    getAll: () => safeInvoke('orders:getAll'),
    getById: (id) => safeInvoke('orders:getById', id),
    save: (o) => safeInvoke('orders:save', o),
    changeStatus: (id, newStatus, reason) => safeInvoke('orders:changeStatus', id, newStatus, reason),
    delete: (id) => safeInvoke('orders:delete', id)
  },
  businessYears: {
    getAll: () => safeInvoke('businessYears:getAll'),
    save: (by) => safeInvoke('businessYears:save', by),
    delete: (id) => safeInvoke('businessYears:delete', id)
  },
  settings: {
    getAll: () => safeInvoke('settings:getAll'),
    save: (key, value, groupName) => safeInvoke('settings:save', key, value, groupName),
    getByKey: (key) => safeInvoke('settings:getByKey', key)
  },
  auditLogs: {
    getAll: (filters) => safeInvoke('auditLogs:getAll', filters),
    getById: (id) => safeInvoke('auditLogs:getById', id)
  },
  export: {
    generate: (params) => safeInvoke('export:generate', params),
    getHistory: () => safeInvoke('export:getHistory'),
    getPreviewData: (params) => safeInvoke('export:getPreviewData', params),
    openFile: (filePath) => safeInvoke('export:openFile', filePath)
  },
  production: {
    getConfig: () => safeInvoke('app:getConfig'),
    createBackup: () => safeInvoke('backup:create'),
    restoreBackup: (path) => safeInvoke('backup:restore', path),
    getBackupHistory: () => safeInvoke('backup:getHistory'),
    runIntegrityCheck: () => safeInvoke('integrity:check'),
    getDiagnostics: () => safeInvoke('diagnostics:get'),
    selectFolder: () => safeInvoke('dialog:selectFolder'),
    selectFile: () => safeInvoke('dialog:selectFile')
  },
  tasks: {
    getAll: () => safeInvoke('tasks:getAll'),
    save: (t) => safeInvoke('tasks:save', t),
    delete: (id) => safeInvoke('tasks:delete', id)
  },
  reminders: {
    getAll: () => safeInvoke('reminders:getAll'),
    save: (r) => safeInvoke('reminders:save', r),
    delete: (id) => safeInvoke('reminders:delete', id)
  },
  auth: {
    login: (credentials) => safeInvoke('auth:login', credentials),
    logout: () => safeInvoke('auth:logout'),
    getCurrentUser: () => safeInvoke('auth:getCurrentUser'),
    createUser: (user) => safeInvoke('auth:createUser', user),
    changePassword: (data) => safeInvoke('auth:changePassword', data),
    changeUsername: (data) => safeInvoke('auth:changeUsername', data),
    resetPassword: (data) => safeInvoke('auth:resetPassword', data),
    activateUser: (username) => safeInvoke('auth:activateUser', { username }),
    disableUser: (username) => safeInvoke('auth:disableUser', { username }),
    getAllUsers: () => safeInvoke('auth:getAllUsers'),
    changeRole: (username, role) => safeInvoke('auth:changeRole', { username, role }),
    deleteUser: (username) => safeInvoke('auth:deleteUser', username),
    getSecurityStatus: () => safeInvoke('auth:getSecurityStatus'),
    completeFirstLoginWizard: (data) => safeInvoke('auth:completeFirstLoginWizard', data),
    changeRecoveryPassword: (data) => safeInvoke('auth:changeRecoveryPassword', data),
    verifyRecoveryPin: (pin) => safeInvoke('auth:verifyRecoveryPin', { pin }),
    changeRecoveryPin: (data) => safeInvoke('auth:changeRecoveryPin', data),
    resetRecoveryPasswordWithPin: (data) => safeInvoke('auth:resetRecoveryPasswordWithPin', data)
  },
  recovery: {
    verifyPassword: (password) => safeInvoke('auth:recoveryVerifyPassword', password),
    getUsers: () => safeInvoke('auth:recoveryGetUsers'),
    toggleStatus: (data) => safeInvoke('auth:recoveryToggleUserStatus', data),
    resetPassword: (data) => safeInvoke('auth:recoveryResetUserPassword', data)
  },
  search: {
    global: (query) => safeInvoke('search:global', query)
  },
  analytics: {
    getDashboardSummary: () => safeInvoke('analytics:getDashboardSummary'),
    getMonthlySales: () => safeInvoke('analytics:getMonthlySales'),
    getTopProducts: () => safeInvoke('analytics:getTopProducts'),
    getAreaPerformance: () => safeInvoke('analytics:getAreaPerformance'),
    getRepresentativePerformance: () => safeInvoke('analytics:getRepresentativePerformance'),
    getTargetProgress: () => safeInvoke('analytics:getTargetProgress'),
    getRecentOrders: () => safeInvoke('analytics:getRecentOrders')
  },
  reports: {
    getDashboardSummaryData: (filters) => safeInvoke('reports:getDashboardSummaryData', filters),
    getSalesTrendData: (filters) => safeInvoke('reports:getSalesTrendData', filters),
    getTargetAchievementData: (filters) => safeInvoke('reports:getTargetAchievementData', filters),
    getTeamContributionData: (filters) => safeInvoke('reports:getTeamContributionData', filters),
    getProductPerformanceData: (filters) => safeInvoke('reports:getProductPerformanceData', filters),
    getReportsData: (filters) => safeInvoke('reports:getReportsData', filters)
  },
  system: {
    checkFirstRun: () => safeInvoke('system:check-first-run'),
    startInitialization: () => safeInvoke('system:start-initialization'),
    validateStartup: () => safeInvoke('system:validate-startup'),
    openLogFolder: () => safeInvoke('system:open-log-folder'),
    exitApp: () => safeInvoke('system:exit-app'),
    onInitProgress: (callback) => {
      const listener = (_event, value) => callback(value);
      ipcRenderer.on('system:init-progress', listener);
      return () => ipcRenderer.removeListener('system:init-progress', listener);
    }
  },
  updater: {
    checkForUpdates: (isSilent) => safeInvoke('updater:check', isSilent),
    downloadUpdate: () => safeInvoke('updater:download'),
    installUpdate: () => safeInvoke('updater:install'),
    cancelDownload: () => safeInvoke('updater:cancel'),
    getStatus: () => safeInvoke('updater:getStatus'),
    getVersionHistory: () => safeInvoke('updater:getVersionHistory'),
    onStatusChanged: (callback) => {
      const listener = (_event, value) => callback(value);
      ipcRenderer.on('updater:status-changed', listener);
      return () => ipcRenderer.removeListener('updater:status-changed', listener);
    }
  }
});
