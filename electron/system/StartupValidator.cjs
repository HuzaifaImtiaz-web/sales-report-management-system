const fs = require('fs');
const path = require('path');
const logger = require('../logger.cjs');
const UserDatabaseService = require('../auth/UserDatabaseService.cjs');

class StartupValidator {
  /**
   * Get required runtime folder paths
   */
  static getRequiredFolders(baseDir = null) {
    const storageDir = baseDir || UserDatabaseService.getStorageDirectory();
    return [
      { name: 'database', path: path.join(storageDir, 'database') },
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
    const storageDir = baseDir || UserDatabaseService.getStorageDirectory();
    return path.join(storageDir, 'config', 'config.json');
  }

  /**
   * Detect whether this is a first run or missing critical components
   */
  static isFirstRun(baseDir = null) {
    const storageDir = baseDir || UserDatabaseService.getStorageDirectory();
    
    // 1. Check folders
    const folders = this.getRequiredFolders(storageDir);
    const missingFolders = folders.filter(f => !fs.existsSync(f.path));

    // 2. Check config file
    const configFile = this.getConfigFile(storageDir);
    const missingConfig = !fs.existsSync(configFile);

    // 3. Check auth database
    const authDbPath = path.join(storageDir, 'users.db');
    const missingAuthDb = !fs.existsSync(authDbPath);

    // 4. Check admin database
    const adminDbPath = path.join(storageDir, 'database', 'admin.db');
    const missingAdminDb = !fs.existsSync(adminDbPath);

    const isFirst = missingFolders.length > 0 || missingConfig || missingAuthDb || missingAdminDb;
    logger.info(`[Startup] First run check performed. Result: ${isFirst ? 'FIRST_RUN_REQUIRED' : 'NORMAL_STARTUP'} (Missing Folders: ${missingFolders.map(f => f.name).join(', ') || 'None'}, Missing Config: ${missingConfig}, Missing Auth DB: ${missingAuthDb}, Missing Admin DB: ${missingAdminDb})`);
    
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
    const storageDir = baseDir || UserDatabaseService.getStorageDirectory();
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
      logger.info('[Startup] Configuration loaded');
    } else {
      logger.info('[Startup] Configuration loaded');
    }

    // 3. Check databases
    logger.info('[Startup] Checking databases');
    const authDbPath = path.join(storageDir, 'users.db');
    const adminDbPath = path.join(storageDir, 'database', 'admin.db');

    if (fs.existsSync(authDbPath)) {
      logger.info('[Startup] users.db found');
    } else {
      logger.info('[Startup] users.db missing');
    }

    if (fs.existsSync(adminDbPath)) {
      logger.info('[Startup] admin.db found');
    } else {
      logger.info('[Startup] admin.db missing');
    }

    const isFirst = !fs.existsSync(authDbPath) || !fs.existsSync(adminDbPath);
    if (isFirst) {
      logger.info('[Startup] First Run = TRUE');
    } else {
      logger.info('[Startup] First Run = FALSE');
      logger.info('[Startup] Initialization skipped');
      logger.info('[Startup] Launching Login');
    }

    logger.info('[Startup] Startup validation completed successfully.');
    return true;
  }
}

module.exports = StartupValidator;
