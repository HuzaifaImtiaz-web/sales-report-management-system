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
    const missingFolders = folders.some(f => !fs.existsSync(f.path));

    // 2. Check config file
    const configFile = this.getConfigFile(storageDir);
    const missingConfig = !fs.existsSync(configFile);

    // 3. Check auth database
    const authDbPath = path.join(storageDir, 'users.db');
    const missingAuthDb = !fs.existsSync(authDbPath);

    const isFirst = missingFolders || missingConfig || missingAuthDb;
    logger.info(`First run check performed. Result: ${isFirst ? 'FIRST_RUN_REQUIRED' : 'NORMAL_STARTUP'} (Missing Folders: ${missingFolders}, Missing Config: ${missingConfig}, Missing Auth DB: ${missingAuthDb})`);
    
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
    logger.info('Application Started');
    logger.info('Checking folders...');

    // 1. Recreate missing folders idempotently
    const folders = this.getRequiredFolders(storageDir);
    let recreatedFolderCount = 0;
    folders.forEach(f => {
      if (!fs.existsSync(f.path)) {
        this.ensureDirSync(f.path);
        logger.info(`Recreated missing runtime folder: ${f.name} at ${f.path}`);
        recreatedFolderCount++;
      }
    });
    if (recreatedFolderCount === 0) {
      logger.info('Folders OK');
    }

    // 2. Check configuration file
    logger.info('Checking configuration...');
    const configFile = this.getConfigFile(storageDir);
    if (!fs.existsSync(configFile)) {
      logger.info(`Configuration missing. Creating default configuration file at ${configFile}`);
      const defaultConfig = {
        appName: 'Himmel Pharmaceutical',
        version: '1.0.0',
        storageDirectory: storageDir,
        theme: 'light',
        autoBackupEnabled: true,
        initializedAt: new Date().toISOString()
      };
      fs.mkdirSync(path.dirname(configFile), { recursive: true });
      fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2), 'utf-8');
      logger.info('Configuration created cleanly');
    } else {
      logger.info('Configuration OK');
    }

    // 3. Check database
    logger.info('Checking database...');
    const authDbPath = path.join(storageDir, 'users.db');
    if (!fs.existsSync(authDbPath)) {
      logger.info('Auth database missing. Triggering system initializer...');
      const SystemInitializer = require('./SystemInitializer.cjs');
      SystemInitializer.initializeSystemSync(storageDir);
      logger.info('Database Created');
    } else {
      logger.info('Database OK');
    }

    logger.info('Startup validation completed successfully.');
    return true;
  }
}

module.exports = StartupValidator;
