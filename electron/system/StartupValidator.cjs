const fs = require('fs');
const path = require('path');
const logger = require('../logger.cjs');
const { getStorageDirectory } = require('../paths.cjs');

class StartupValidator {
  /**
   * Get required runtime folder paths. Business data lives in the cloud database,
   * so this computer only keeps backups, exports, logs and configuration.
   */
  static getRequiredFolders(baseDir = null) {
    const storageDir = baseDir || getStorageDirectory();
    return [
      { name: 'backups', path: path.join(storageDir, 'backups') },
      { name: 'exports', path: path.join(storageDir, 'exports') },
      { name: 'logs', path: path.join(storageDir, 'logs') },
      { name: 'temp', path: path.join(storageDir, 'temp') },
      { name: 'config', path: path.join(storageDir, 'config') }
    ];
  }

  /**
   * Get path to configuration file
   */
  static getConfigFile(baseDir = null) {
    const storageDir = baseDir || getStorageDirectory();
    return path.join(storageDir, 'config', 'config.json');
  }

  /**
   * Detect whether this computer still needs its local folders/configuration.
   * (There is no local database to create any more.)
   */
  static isFirstRun(baseDir = null) {
    const storageDir = baseDir || getStorageDirectory();

    const folders = this.getRequiredFolders(storageDir);
    const missingFolders = folders.filter(f => !fs.existsSync(f.path));
    const missingConfig = !fs.existsSync(this.getConfigFile(storageDir));

    const isFirst = missingFolders.length > 0 || missingConfig;
    logger.info(`[Startup] First run check performed. Result: ${isFirst ? 'FIRST_RUN_REQUIRED' : 'NORMAL_STARTUP'} (Missing Folders: ${missingFolders.map(f => f.name).join(', ') || 'None'}, Missing Config: ${missingConfig})`);

    return isFirst;
  }

  static ensureDirSync(dirPath) {
    for (let attempt = 0; attempt < 10; attempt++) {
      if (fs.existsSync(dirPath)) return true;
      try {
        fs.mkdirSync(dirPath, { recursive: true });
      } catch (err) {}
      if (fs.existsSync(dirPath)) return true;
      const stop = Date.now() + 50;
      while (Date.now() < stop) {}
    }
    return fs.existsSync(dirPath);
  }

  /**
   * Validate runtime environment on every application startup.
   * Recreates missing components idempotently without overwriting existing data.
   */
  static validateStartup(baseDir = null) {
    const storageDir = baseDir || getStorageDirectory();
    logger.info('[Startup] App launched');
    logger.info('[Startup] Checking runtime folders');

    // 1. Recreate missing folders idempotently
    const folders = this.getRequiredFolders(storageDir);
    let recreatedFolderCount = 0;
    folders.forEach(f => {
      if (!fs.existsSync(f.path)) {
        this.ensureDirSync(f.path);
        logger.info(`[Startup] Recreated missing runtime folder: ${f.name} at ${f.path}`);
        recreatedFolderCount++;
      }
    });
    if (recreatedFolderCount === 0) {
      logger.info('[Startup] Runtime folders verified');
    }

    // 2. Check configuration file
    logger.info('[Startup] Checking configuration...');
    const configFile = this.getConfigFile(storageDir);
    if (!fs.existsSync(configFile)) {
      logger.info(`[Startup] Configuration missing. Creating default configuration file at ${configFile}`);
      const defaultConfig = {
        appName: 'Himmel Pharmaceutical',
        version: '1.0.1',
        storageDirectory: storageDir,
        theme: 'light',
        autoBackupEnabled: true,
        initializedAt: new Date().toISOString()
      };
      fs.mkdirSync(path.dirname(configFile), { recursive: true });
      fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    }
    logger.info('[Startup] Configuration loaded');

    // 3. Data storage
    const cloud = require('../cloud/CloudClient.cjs');
    logger.info(`[Startup] Business data is stored in the cloud database (${cloud.getApiUrl()})`);
    logger.info('[Startup] Launching Login');

    logger.info('[Startup] Startup validation completed successfully.');
    return true;
  }
}

module.exports = StartupValidator;
