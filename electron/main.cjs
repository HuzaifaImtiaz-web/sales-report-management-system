process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Configure application name and custom user data directory
app.setName('Himmel Pharmaceutical');
const userDataPath = path.join(app.getPath('appData'), 'Himmel Pharmaceutical');
app.setPath('userData', userDataPath);

// Ensure full data directory structure
function ensureFolderStructure() {
  const folders = ['backups', 'exports', 'imports', 'temp'];
  folders.forEach(folder => {
    const folderPath = path.join(userDataPath, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  });
}
ensureFolderStructure();

// Load remaining modules after overriding paths
const logger = require('./logger.cjs');
const { createMainWindow } = require('./window.cjs');
const { setCustomMenu } = require('./menu.cjs');
const { initDatabase, closeDatabase } = require('./database/index.cjs');
const { setupIpcHandlers } = require('./ipc.cjs');

process.on('uncaughtException', (error) => {
  logger.error('CRITICAL: Uncaught Exception in Main Process:', error);
  try {
    dialog.showErrorBox('System Error', `A critical error occurred in the background process:\n${error.message || error}`);
  } catch (e) {}
});

process.on('unhandledRejection', (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  logger.error('CRITICAL: Unhandled Rejection in Main Process:', err);
  try {
    dialog.showErrorBox('System Error', `A critical asynchronous error occurred:\n${err.message}`);
  } catch (e) {}
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  logger.info('Duplicate application instance detected. Quitting.');
  app.quit();
} else {
  let mainWindow;

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  function initApp() {
    try {
      logger.info('[Startup] Starting Himmel Sales Management application...');
      const StartupValidator = require('./system/StartupValidator.cjs');
      StartupValidator.validateStartup();

      const db = initDatabase();
      setupIpcHandlers(db);

      // Hourly automatic backup check
      setInterval(() => {
        try {
          const BackupService = require('./database/BackupService.cjs');
          BackupService.checkAndRunAutoBackup().catch(err => {
            logger.error('Background automatic backup check failed:', err);
          });
        } catch (e) {
          logger.error('Failed to run background backup scheduler:', e);
        }
      }, 1000 * 60 * 60); // 1 hour

      const preloadPath = path.join(__dirname, 'preload.cjs');
      mainWindow = createMainWindow(preloadPath);
      
      setCustomMenu(mainWindow);

      mainWindow.webContents.on('render-process-gone', (event, details) => {
        logger.error('Renderer process gone:', details);
        dialog.showErrorBox('Application Error', 'The UI process crashed unexpectedly. The application will close.');
        app.quit();
      });

      mainWindow.on('closed', () => {
        mainWindow = null;
      });
    } catch (error) {
      logger.error('Error occurred during application startup initialization', error);
      dialog.showErrorBox('Fatal Startup Error', error.message);
      app.quit();
    }
  }

  app.whenReady().then(() => {
    initApp();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        initApp();
      }
    });
  });

  app.on('window-all-closed', () => {
    closeDatabase();
    if (process.platform !== 'darwin') {
      logger.info('All windows closed. Quitting application.');
      app.quit();
    }
  });
}
