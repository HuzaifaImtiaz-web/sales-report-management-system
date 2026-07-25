const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { applySchema } = require('../database/schema.cjs');
const { seedDatabase } = require('../database/seed.cjs');
const logger = require('../logger.cjs');

let electronApp = null;
try {
  electronApp = require('electron').app;
} catch (e) {
  // Not in Electron
}

class UserDatabaseService {
  static getStorageDirectory() {
    if (electronApp && typeof electronApp.getPath === 'function') {
      try {
        return electronApp.getPath('userData');
      } catch (e) {
        // App might not be ready yet
      }
    }
    return process.cwd();
  }

  static getUserDataDirectory(baseDir = null) {
    const storageDir = baseDir || this.getStorageDirectory();
    const dir = path.join(storageDir, 'database');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  static getAuthDatabasePath(baseDir = null) {
    const storageDir = baseDir || this.getStorageDirectory();
    return path.join(storageDir, 'users.db');
  }

  static getUserDatabasePath(dbName, baseDir = null) {
    // Sanitize database name to prevent directory traversal
    const safeDbName = dbName.replace(/[^a-zA-Z0-9_-]/g, '');
    return path.join(this.getUserDataDirectory(baseDir), `${safeDbName}.db`);
  }

  static createDatabase(dbName, baseDir = null) {
    if (!dbName || typeof dbName !== 'string' || dbName.trim().length === 0) {
      throw new Error('Database creation failed: Database name cannot be empty.');
    }
    const dbPath = this.getUserDatabasePath(dbName, baseDir);
    logger.info(`Starting creation of user database: ${dbName} at ${dbPath}`);

    // If database file already exists, open it, apply migrations/schema, and return true.
    if (fs.existsSync(dbPath)) {
      logger.info(`Database at ${dbPath} already exists. Opening and verifying schema...`);
      let db;
      try {
        db = new Database(dbPath);
        db.pragma('foreign_keys = ON');
        db.pragma('journal_mode = WAL');
        db.pragma('synchronous = NORMAL');
        
        // Apply schema (handles IF NOT EXISTS and migrations safely)
        applySchema(db);
        
        // Verify Schema
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
        const requiredTables = ['products', 'orders', 'order_items', 'doctors', 'institutions', 'areas', 'team_members', 'product_targets', 'business_years'];
        for (const table of requiredTables) {
          if (!tables.includes(table)) {
            throw new Error(`Verification failed: Missing table '${table}'`);
          }
        }
        db.close();
        logger.info(`User database ${dbName} verified successfully.`);
        return true;
      } catch (error) {
        logger.error(`Failed to verify existing database for ${dbName}: ${error.message}`);
        if (db) {
          try { db.close(); } catch (e) {}
        }
        throw new Error(`Database verification failed: ${error.message}`);
      }
    }

    let db;
    try {
      db = new Database(dbPath);
      
      // Enable pragmas
      db.pragma('foreign_keys = ON');
      db.pragma('journal_mode = WAL');
      db.pragma('synchronous = NORMAL');

      // 1. Apply Schema
      applySchema(db);

      // 2. Seed Database
      seedDatabase(db);

      // 3. Verify Schema
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
      const requiredTables = ['products', 'orders', 'order_items', 'doctors', 'institutions', 'areas', 'team_members', 'product_targets', 'business_years'];
      
      for (const table of requiredTables) {
        if (!tables.includes(table)) {
          throw new Error(`Verification failed: Missing table '${table}'`);
        }
      }

      db.close();
      logger.info(`User database ${dbName} created and verified successfully.`);
      return true;
    } catch (error) {
      logger.error(`Failed to create database for ${dbName}: ${error.message}`);
      
      if (db) {
        try {
          db.close();
        } catch (e) {}
      }

      // Rollback: Delete the incomplete database file
      if (fs.existsSync(dbPath)) {
        try {
          fs.unlinkSync(dbPath);
          logger.info(`Deleted incomplete database file: ${dbPath}`);
        } catch (e) {
          logger.error(`Failed to delete incomplete database file ${dbPath}: ${e.message}`);
        }
      }
      throw new Error(`Database creation failed: ${error.message}`);
    }
  }
}

module.exports = UserDatabaseService;
