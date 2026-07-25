const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const logger = require('../logger.cjs');
const UserDatabaseService = require('../auth/UserDatabaseService.cjs');
const StartupValidator = require('./StartupValidator.cjs');
const { applyUsersSchema } = require('../auth/usersSchema.cjs');
const UserRepository = require('../auth/UserRepository.cjs');
const SettingsRepository = require('../database/SettingsRepository.cjs');

class SystemInitializer {
  /**
   * Run full system initialization synchronously / asynchronously with progress updates
   */
  static async initializeSystem(baseDir = null, progressCb = null) {
    const storageDir = baseDir || UserDatabaseService.getStorageDirectory();
    logger.info('Starting Himmel Pharmaceutical System Initialization...');

    const reportProgress = (stepIndex, text, isDone = false) => {
      logger.info(`Init Step [${stepIndex}/5]: ${text}`);
      if (typeof progressCb === 'function') {
        progressCb({ step: stepIndex, text, done: isDone });
      }
    };

    try {
      // Step 1: Creating folders
      reportProgress(1, 'Creating folders', false);
      const folders = StartupValidator.getRequiredFolders(storageDir);
      folders.forEach(f => {
        if (!fs.existsSync(f.path)) {
          fs.mkdirSync(f.path, { recursive: true });
          logger.info(`Created folder: ${f.name} at ${f.path}`);
        } else {
          logger.info(`Folder already exists: ${f.name} at ${f.path}`);
        }
      });
      reportProgress(1, 'Creating folders', true);

      // Step 2: Initializing database
      reportProgress(2, 'Initializing database', false);
      const authDbPath = path.join(storageDir, 'users.db');
      logger.info(`Opening authentication database at ${authDbPath}`);
      const usersDb = new Database(authDbPath);
      usersDb.pragma('foreign_keys = ON');
      usersDb.pragma('journal_mode = WAL');
      usersDb.pragma('synchronous = NORMAL');

      applyUsersSchema(usersDb);
      const userRepo = new UserRepository(usersDb);
      reportProgress(2, 'Initializing database', true);

      // Step 3: Loading configuration
      reportProgress(3, 'Loading configuration', false);
      const configFile = StartupValidator.getConfigFile(storageDir);
      let configData = {
        appName: 'Himmel Pharmaceutical',
        version: '1.0.0',
        storageDirectory: storageDir,
        theme: 'light',
        autoBackupEnabled: true,
        initializedAt: new Date().toISOString()
      };

      if (!fs.existsSync(configFile)) {
        fs.mkdirSync(path.dirname(configFile), { recursive: true });
        fs.writeFileSync(configFile, JSON.stringify(configData, null, 2), 'utf-8');
        logger.info(`Created default configuration file at ${configFile}`);
      } else {
        try {
          configData = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
          logger.info('Loaded existing configuration file.');
        } catch (e) {
          logger.warn(`Existing config file corrupt, rewriting default config: ${e.message}`);
          fs.writeFileSync(configFile, JSON.stringify(configData, null, 2), 'utf-8');
        }
      }
      reportProgress(3, 'Loading configuration', true);

      // Step 4: Creating administrator account
      reportProgress(4, 'Creating administrator account', false);
      const adminUsername = 'admin';
      let adminUser = userRepo.findByUsername(adminUsername);

      if (!adminUser) {
        logger.info('Default admin account does not exist. Creating admin account...');
        const passwordHash = bcrypt.hashSync('Password123!', 12);
        adminUser = userRepo.create({
          username: adminUsername,
          passwordHash,
          fullName: 'System Administrator',
          role: 'Admin',
          databaseName: 'admin',
          isActive: true
        });
        logger.info('Default admin user created successfully (admin / Password123!).');
      } else {
        logger.info('Default admin user already exists. Preserving existing credentials.');
      }

      // Ensure user database 'admin.db' exists and seed default settings
      UserDatabaseService.createDatabase('admin', storageDir);
      const adminDbPath = UserDatabaseService.getUserDatabasePath('admin', storageDir);
      const adminDb = new Database(adminDbPath);
      adminDb.pragma('foreign_keys = ON');

      const settingsRepo = new SettingsRepository(adminDb);
      const defaultSettings = {
        company_name: 'Himmel Pharmaceutical Ltd',
        currency: 'PKR (Rs)',
        business_year: '2025-2026',
        theme: 'light',
        date_format: 'YYYY-MM-DD',
        backup_folder: path.join(storageDir, 'backups'),
        export_folder: path.join(storageDir, 'exports'),
        auto_logout_minutes: '30',
        maintenance_mode: 'false',
        recovery_mode: 'false'
      };

      // Insert missing settings without overwriting
      const insertStmt = adminDb.prepare(`
        INSERT INTO settings (key, value, group_name)
        VALUES (?, ?, 'general')
        ON CONFLICT(key) DO NOTHING
      `);

      adminDb.transaction(() => {
        for (const [key, value] of Object.entries(defaultSettings)) {
          insertStmt.run(key, String(value));
        }
      })();

      adminDb.close();
      usersDb.close();
      logger.info('Default Settings Loaded');
      reportProgress(4, 'Creating administrator account', true);

      // Step 5: Finalizing setup
      reportProgress(5, 'Finalizing setup', false);
      logger.info('Initialization Complete');
      reportProgress(5, 'Finalizing setup', true);

      if (typeof progressCb === 'function') {
        progressCb({ step: 6, text: 'System Ready', done: true, complete: true });
      }

      return { success: true };
    } catch (err) {
      logger.error('CRITICAL: System Initialization Failed:', err);
      throw err;
    }
  }

  /**
   * Synchronous helper for main process startup validation
   */
  static initializeSystemSync(baseDir = null) {
    const storageDir = baseDir || UserDatabaseService.getStorageDirectory();
    
    // 1. Folders
    const folders = StartupValidator.getRequiredFolders(storageDir);
    folders.forEach(f => {
      if (!fs.existsSync(f.path)) {
        fs.mkdirSync(f.path, { recursive: true });
      }
    });

    // 2. Auth DB & Admin User
    const authDbPath = path.join(storageDir, 'users.db');
    const usersDb = new Database(authDbPath);
    usersDb.pragma('foreign_keys = ON');
    applyUsersSchema(usersDb);
    const userRepo = new UserRepository(usersDb);

    let adminUser = userRepo.findByUsername('admin');
    if (!adminUser) {
      const passwordHash = bcrypt.hashSync('Password123!', 12);
      userRepo.create({
        username: 'admin',
        passwordHash,
        fullName: 'System Administrator',
        role: 'Admin',
        databaseName: 'admin',
        isActive: true
      });
    }

    // 3. Admin DB & Default Settings
    UserDatabaseService.createDatabase('admin', storageDir);
    const adminDbPath = UserDatabaseService.getUserDatabasePath('admin', storageDir);
    const adminDb = new Database(adminDbPath);
    adminDb.pragma('foreign_keys = ON');

    const defaultSettings = {
      company_name: 'Himmel Pharmaceutical Ltd',
      currency: 'PKR (Rs)',
      business_year: '2025-2026',
      theme: 'light',
      date_format: 'YYYY-MM-DD',
      backup_folder: path.join(storageDir, 'backups'),
      export_folder: path.join(storageDir, 'exports'),
      auto_logout_minutes: '30',
      maintenance_mode: 'false',
      recovery_mode: 'false'
    };

    const insertStmt = adminDb.prepare(`
      INSERT INTO settings (key, value, group_name)
      VALUES (?, ?, 'general')
      ON CONFLICT(key) DO NOTHING
    `);

    adminDb.transaction(() => {
      for (const [key, value] of Object.entries(defaultSettings)) {
        insertStmt.run(key, String(value));
      }
    })();

    adminDb.close();
    usersDb.close();

    // 4. Config
    const configFile = StartupValidator.getConfigFile(storageDir);
    if (!fs.existsSync(configFile)) {
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
    }
  }
}

module.exports = SystemInitializer;
