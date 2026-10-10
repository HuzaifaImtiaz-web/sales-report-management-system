const { ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const logger = require('./logger.cjs');
const cloud = require('./cloud/CloudClient.cjs');
const BackupManager = require('./cloud/BackupManager.cjs');
const ExportRepository = require('./database/ExportRepository.cjs');
const { getStorageDirectory } = require('./paths.cjs');

// All business data now lives in the shared cloud database. These channels are passed to the
// cloud API server unchanged (same names, arguments and results), which also checks the user's role.
const CLOUD_CHANNELS = [
  'categories:getAll', 'categories:getById', 'categories:save', 'categories:delete',
  'divisions:getAll',
  'products:getAll', 'products:getById', 'products:save', 'products:delete',
  'areas:getAll', 'areas:getById', 'areas:save', 'areas:delete',
  'doctors:getAll', 'doctors:getById', 'doctors:save', 'doctors:delete',
  'institutions:getAll', 'institutions:getById', 'institutions:save', 'institutions:delete',
  'teamMembers:getAll', 'teamMembers:getById', 'teamMembers:save', 'teamMembers:delete',
  'targets:getAll', 'targets:getById', 'targets:save', 'targets:delete', 'targets:getActiveBusinessYears',
  'orders:getAll', 'orders:getById', 'orders:save', 'orders:changeStatus', 'orders:delete',
  'settings:getAll', 'settings:save', 'settings:getByKey',
  'reports:getDashboardSummaryData', 'reports:getSalesTrendData', 'reports:getTargetAchievementData',
  'reports:getTeamContributionData', 'reports:getProductPerformanceData', 'reports:getReportsData',
  'tasks:getAll', 'tasks:save', 'tasks:delete',
  'reminders:getAll', 'reminders:save', 'reminders:delete',
  'auth:completeFirstLoginWizard', 'auth:changeRecoveryPassword', 'auth:changeRecoveryPin',
  'auth:createUser', 'auth:changePassword', 'auth:resetPassword', 'auth:activateUser',
  'auth:disableUser', 'auth:getAllUsers', 'auth:changeRole', 'auth:deleteUser',
  'auditLogs:getAll', 'auditLogs:getById',
  'integrity:check',
  'search:global',
  'analytics:getDashboardSummary', 'analytics:getMonthlySales', 'analytics:getTopProducts',
  'analytics:getAreaPerformance', 'analytics:getRepresentativePerformance',
  'analytics:getTargetProgress', 'analytics:getRecentOrders',
  'export:getPreviewData'
];

// Cloud channels that work before login (login screen, emergency recovery, security wizard check).
const PUBLIC_CLOUD_CHANNELS = ['auth:getSecurityStatus', 'auth:resetRecoveryPasswordWithPin'];

function createExportRepository() {
  return new ExportRepository({
    fetchData: (reportType, filters) => cloud.request('export:getPreviewData', [{ reportType, filters }]),
    fetchMasterData: (filters) => cloud.request('export:getMasterData', [{ filters }], { timeoutMs: 2 * 60 * 1000 }),
    logExport: (entry) => cloud.request('export:logExport', [entry])
  });
}

function setupIpcHandlers() {
  logger.info('Setting up Electron IPC handlers (cloud mode)...');

  function wrapHandler(channel, handlerFn, options = {}) {
    ipcMain.handle(channel, async (event, ...args) => {
      try {
        logger.info(`IPC Request: ${channel}`);

        // The renderer logs out when it sees "No active session".
        if (!options.isPublic && !cloud.isAuthenticated()) {
          throw new Error('No active session. Please log in.');
        }

        const res = options.passEvent
          ? await handlerFn(event, ...args)
          : await handlerFn(...args);
        return { success: true, data: res };
      } catch (error) {
        logger.error(`IPC Error on ${channel}: ${error.message}`);
        return { success: false, error: (error && error.message) || 'An unexpected error occurred. Please try again.' };
      }
    });
  }

  for (const channel of CLOUD_CHANNELS) {
    wrapHandler(channel, (...args) => cloud.request(channel, args));
  }
  for (const channel of PUBLIC_CLOUD_CHANNELS) {
    wrapHandler(channel, (...args) => cloud.request(channel, args), { isPublic: true });
  }

  // --- App Config ---
  wrapHandler('app:getConfig', () => {
    const config = require('./config.cjs');
    return {
      mode: config.mode,
      version: config.version,
      dbVersion: config.dbVersion,
      buildDate: '2026-08-01',
      electronVersion: process.versions.electron || '42.0.1',
      nodeVersion: process.versions.node || '20.11.0',
      chromeVersion: process.versions.chrome || '124.0.0',
      platform: process.platform === 'win32' ? 'Windows (win32)' : process.platform,
      arch: process.arch || 'x64',
      reactVersion: '18.3.1',
      dbEngine: 'PostgreSQL (Cloud)',
      cloudServer: cloud.getApiUrl()
    };
  }, { isPublic: true });

  // --- Authentication (session is kept in memory on this computer) ---
  wrapHandler('auth:login', async (credentials) => {
    const session = await cloud.login(credentials);
    // Scheduled backups run on administrator computers after sign-in, as before.
    BackupManager.checkAndRunAutoBackup().catch((err) => logger.error('Auto backup check failed:', err));
    return session;
  }, { isPublic: true });

  wrapHandler('auth:logout', () => cloud.logout());

  wrapHandler('auth:getCurrentUser', async () => cloud.getSession(), { isPublic: true });

  wrapHandler('auth:changeUsername', async (data) => {
    const res = await cloud.request('auth:changeUsername', [data]);
    if (res && res.username) cloud.updateSessionUser({ username: res.username });
    return res;
  });

  // --- Emergency recovery (login screen) ---
  wrapHandler('auth:recoveryVerifyPassword', (password) =>
    cloud.verifyRecovery('auth:recoveryVerifyPassword', [password]), { isPublic: true });
  wrapHandler('auth:verifyRecoveryPin', (data) =>
    cloud.verifyRecovery('auth:verifyRecoveryPin', [data]), { isPublic: true });
  wrapHandler('auth:recoveryGetUsers', () =>
    cloud.request('auth:recoveryGetUsers', [], { recovery: true }), { isPublic: true });
  wrapHandler('auth:recoveryToggleUserStatus', (data) =>
    cloud.request('auth:recoveryToggleUserStatus', [data], { recovery: true }), { isPublic: true });
  wrapHandler('auth:recoveryResetUserPassword', (data) =>
    cloud.request('auth:recoveryResetUserPassword', [data], { recovery: true }), { isPublic: true });

  // --- Backup & Restore (backup files are kept on this computer) ---
  wrapHandler('backup:create', () => BackupManager.createBackup());
  wrapHandler('backup:restore', (backupPath) => BackupManager.restoreBackup(backupPath));
  wrapHandler('backup:getHistory', async () => BackupManager.getBackupHistory());

  // --- Diagnostics: cloud database details + this computer's details ---
  wrapHandler('diagnostics:get', async () => {
    const config = require('./config.cjs');
    const server = await cloud.request('diagnostics:get');

    let diskWrite = 'OK';
    const tempTestFile = path.join(getStorageDirectory(), '.write_test');
    try {
      fs.writeFileSync(tempTestFile, 'health-check', 'utf8');
      fs.unlinkSync(tempTestFile);
    } catch (err) {
      diskWrite = `FAIL: ${err.message}`;
    }

    const backups = BackupManager.getBackupHistory();
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);

    return {
      databaseAvailable: server.databaseAvailable,
      sessionValid: cloud.isAuthenticated(),
      diskWrite,
      totalBackups: backups.length,
      lastBackupFile: backups.length > 0 ? backups[0].fileName : 'None',
      backupLocation: path.join(getStorageDirectory(), 'Backups'),
      databaseSize: server.databaseSize,
      counts: server.counts,
      healthIndicators: server.healthIndicators,
      systemInfo: {
        appVersion: config.version,
        dbVersion: server.dbVersion,
        schemaVersion: config.dbVersion,
        electronVersion: process.versions.electron || 'N/A',
        nodeVersion: process.versions.node,
        reactVersion: '18.3.1',
        sqliteVersion: server.databaseEngine,
        databaseEngine: server.databaseEngine,
        cloudServer: cloud.getApiUrl(),
        serverVersion: server.server && server.server.version,
        operatingSystem: `${process.platform} (${process.arch})`
      },
      memoryUsage: {
        heapUsed: `${heapUsedMB} MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
        rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
        warning: heapUsedMB > 250
      },
      // The cloud server applies schema changes itself when it starts.
      migrationStatus: {
        appVersion: config.version,
        dbVersion: server.dbVersion,
        status: 'UP-TO-DATE'
      },
      uptime: `${Math.round(process.uptime())} seconds`
    };
  });

  // --- File dialogs ---
  wrapHandler('dialog:selectFolder', async () => {
    const res = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    });
    if (!res.canceled && res.filePaths.length > 0) {
      return res.filePaths[0];
    }
    return null;
  });

  wrapHandler('dialog:selectFile', async () => {
    const res = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Himmel Backup', extensions: ['json', 'db', 'sqlite'] }
      ]
    });
    if (!res.canceled && res.filePaths.length > 0) {
      return res.filePaths[0];
    }
    return null;
  });

  // --- Export Center (data from the cloud, files written on this computer) ---
  wrapHandler('export:generate', async ({ reportType, format, filters }) => {
    const user = cloud.getCurrentUsername();
    const exportRepo = createExportRepository();

    const safeType = (reportType || 'Report').replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    const fmtClean = (format || 'excel').toLowerCase().replace('.', '');

    let ext = 'xlsx';
    let filterName = 'Excel Spreadsheet';
    if (fmtClean === 'pdf') {
      ext = 'pdf';
      filterName = 'PDF Document';
    } else if (fmtClean === 'pptx' || fmtClean === 'powerpoint') {
      ext = 'pptx';
      filterName = 'PowerPoint Presentation';
    }

    const defaultName = `Himmel_${safeType}_${dateStr}.${ext}`;

    const saveDialogResult = await dialog.showSaveDialog({
      title: `Save ${reportType} Export File`,
      defaultPath: defaultName,
      filters: [{ name: filterName, extensions: [ext] }]
    });

    if (saveDialogResult.canceled || !saveDialogResult.filePath) {
      return { success: false, canceled: true, error: 'Export canceled by user.' };
    }

    return exportRepo.generateExport({
      reportType,
      format: fmtClean,
      filters,
      targetFilePath: saveDialogResult.filePath,
      user
    });
  });

  wrapHandler('export:getHistory', async () => createExportRepository().getExportHistory());

  wrapHandler('export:openFile', async (filePath) => {
    const { shell } = require('electron');
    if (filePath && fs.existsSync(filePath)) {
      await shell.openPath(filePath);
      return true;
    }
    throw new Error('File does not exist on disk.');
  });

  // --- System ---
  wrapHandler('system:check-first-run', async () => {
    const StartupValidator = require('./system/StartupValidator.cjs');
    return StartupValidator.isFirstRun();
  }, { isPublic: true });

  wrapHandler('system:start-initialization', async (event) => {
    const SystemInitializer = require('./system/SystemInitializer.cjs');
    return SystemInitializer.initializeSystem(null, (progress) => {
      if (event && event.sender && typeof event.sender.send === 'function') {
        event.sender.send('system:init-progress', progress);
      }
    });
  }, { isPublic: true, passEvent: true });

  wrapHandler('system:validate-startup', async () => {
    const StartupValidator = require('./system/StartupValidator.cjs');
    return StartupValidator.validateStartup();
  }, { isPublic: true });

  wrapHandler('system:open-log-folder', async () => {
    const { shell } = require('electron');
    const logDir = path.join(getStorageDirectory(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    await shell.openPath(logDir);
    return true;
  }, { isPublic: true });

  wrapHandler('system:exit-app', async () => {
    const { app } = require('electron');
    logger.info('[Startup] system:exit-app requested by renderer');
    app.quit();
    return true;
  }, { isPublic: true });

  // --- Enterprise Auto Update IPC Handlers ---
  const UpdateManager = require('./system/UpdateManager.cjs');
  UpdateManager.subscribe((statusData) => {
    const { BrowserWindow } = require('electron');
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send('updater:status-changed', statusData);
      }
    });
  });

  wrapHandler('updater:check', (isSilent) => UpdateManager.checkForUpdates(isSilent), { isPublic: true });
  wrapHandler('updater:download', () => UpdateManager.downloadUpdate(), { isPublic: true });
  wrapHandler('updater:install', () => UpdateManager.quitAndInstall(), { isPublic: true });
  wrapHandler('updater:cancel', () => UpdateManager.cancelDownload(), { isPublic: true });
  wrapHandler('updater:getStatus', () => UpdateManager.getStatus(), { isPublic: true });
  wrapHandler('updater:getVersionHistory', () => UpdateManager.getVersionHistory(), { isPublic: true });

  logger.info('Electron IPC handlers successfully registered.');
  logger.info('Checkpoint: IPC handlers register');
}

module.exports = { setupIpcHandlers, CLOUD_CHANNELS };
