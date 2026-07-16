const { app, BrowserWindow } = require('electron');
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

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception occurred in Main Process', error);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection occurred in Main Process', new Error(reason));
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
      logger.info('Starting Himmel Sales Management application...');
      const preloadPath = path.join(__dirname, 'preload.cjs');
      mainWindow = createMainWindow(preloadPath);
      
      setCustomMenu(mainWindow);

      mainWindow.on('closed', () => {
        mainWindow = null;
      });
    } catch (error) {
      logger.error('Error occurred during application startup initialization', error);
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
    if (process.platform !== 'darwin') {
      logger.info('All windows closed. Quitting application.');
      app.quit();
    }
  });
}
