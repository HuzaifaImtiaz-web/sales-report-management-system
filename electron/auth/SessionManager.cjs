const Database = require('better-sqlite3');
const UserDatabaseService = require('./UserDatabaseService.cjs');
const { applySchema } = require('../database/schema.cjs');
const logger = require('../logger.cjs');

class SessionManager {
  constructor() {
    this.currentUser = null;
    this.activeDbConnection = null;
    this.loginTimestamp = null;
  }

  startSession(user) {
    if (!user) {
      throw new Error('User is required to start a session.');
    }

    // If there is an active session, close it first
    this.endSession();

    logger.info(`Starting session for user: ${user.username}`);
    const dbPath = UserDatabaseService.getUserDatabasePath(user.databaseName);
    logger.info(`Opening active user database at: ${dbPath}`);

    try {
      const db = new Database(dbPath);
      db.pragma('foreign_keys = OFF'); // must be OFF during migration to allow table recreation
      db.pragma('journal_mode = WAL');
      db.pragma('synchronous = NORMAL');

      // Always apply schema + migrations on session open so existing databases
      // are automatically upgraded to the current schema without manual steps.
      logger.info(`Applying schema migrations for user database: ${dbPath}`);
      applySchema(db);
      logger.info('Schema migrations applied successfully.');
      
      db.pragma('foreign_keys = ON'); // re-enable after migration

      this.currentUser = {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        databaseName: user.databaseName,
        isActive: user.isActive
      };
      this.activeDbConnection = db;
      this.loginTimestamp = new Date().toISOString();
      
      logger.info(`Session successfully initialized for user ${user.username}`);

      // Run automatic backup check asynchronously
      try {
        const BackupService = require('../database/BackupService.cjs');
        BackupService.checkAndRunAutoBackup().catch(err => {
          logger.error('Error running automatic scheduled backup check:', err);
        });
      } catch (err) {
        logger.error('Failed to load BackupService for auto-backup check:', err);
      }
    } catch (error) {
      logger.error(`Failed to open user database during session start: ${error.message}`);
      this.endSession();
      throw new Error(`Session start failed: ${error.message}`);
    }
  }

  endSession() {
    if (this.currentUser) {
      logger.info(`Ending session for user: ${this.currentUser.username}`);
    }
    
    if (this.activeDbConnection) {
      try {
        this.activeDbConnection.close();
        logger.info('Closed active user database connection.');
      } catch (error) {
        logger.error(`Error closing active user database connection: ${error.message}`);
      }
    }

    this.currentUser = null;
    this.activeDbConnection = null;
    this.loginTimestamp = null;
  }

  getSession() {
    if (!this.currentUser) return null;
    return {
      user: { ...this.currentUser },
      loginTimestamp: this.loginTimestamp
    };
  }

  getActiveDatabaseConnection() {
    return this.activeDbConnection;
  }

  isAuthenticated() {
    return this.currentUser !== null;
  }

  validateSession() {
    if (!this.isAuthenticated()) {
      throw new Error('Unauthorized: No active session.');
    }
    return true;
  }
}

// Export singleton instance
const instance = new SessionManager();
module.exports = instance;
