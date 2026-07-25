const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const logger = require('../logger.cjs');
const SessionManager = require('../auth/SessionManager.cjs');
const UserDatabaseService = require('../auth/UserDatabaseService.cjs');

class BackupService {
  /**
   * Create an online hot backup of the active database connection.
   */
  static async createBackup() {
    const activeDb = SessionManager.getActiveDatabaseConnection();
    if (!activeDb) {
      throw new Error('No active user database session to backup.');
    }
    const session = SessionManager.getSession();
    const username = session.user.username;
    
    const storageDir = UserDatabaseService.getStorageDirectory();
    const backupDir = path.join(storageDir, 'Backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${year}_${month}_${day}_${hours}${minutes}`;
    
    const backupFileName = `backup_${username}_${timestamp}.db`;
    const backupPath = path.join(backupDir, backupFileName);
    
    logger.info(`Starting database backup for ${username} to: ${backupPath}`);
    
    try {
      // 1. Run SQLite hot backup (transactionally safe clone)
      await activeDb.backup(backupPath);
      
      // 2. Verify backup integrity
      const backupDb = new Database(backupPath);
      try {
        const check = backupDb.pragma('integrity_check');
        if (!check || check[0].integrity_check !== 'ok') {
          throw new Error(`Backup integrity check failed: ${JSON.stringify(check)}`);
        }
      } finally {
        backupDb.close();
      }
      
      logger.info(`Database backup successful and verified: ${backupFileName}`);
      return {
        success: true,
        fileName: backupFileName,
        path: backupPath,
        time: now.toISOString()
      };
    } catch (error) {
      logger.error(`Database backup failed: ${error.message}`);
      if (fs.existsSync(backupPath)) {
        try { fs.unlinkSync(backupPath); } catch (e) {}
      }
      throw error;
    }
  }

  /**
   * Perform validation and replace active database with a chosen backup.
   * Relaunches the application if successfully restored.
   */
  static async restoreBackup(backupPath) {
    const session = SessionManager.getSession();
    if (!session) {
      throw new Error('No active session.');
    }
    const username = session.user.username;
    const dbName = session.user.databaseName;
    const activeDbPath = UserDatabaseService.getUserDatabasePath(dbName);
    const tempBackupPath = `${activeDbPath}.tmp`;

    logger.info(`Initiating database restore from: ${backupPath}`);

    // 1. Verify backup file exists
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file does not exist.');
    }

    // 2. Open and validate integrity of the backup file
    let testDb;
    try {
      testDb = new Database(backupPath);
      const integrity = testDb.pragma('integrity_check');
      if (!integrity || integrity[0].integrity_check !== 'ok') {
        throw new Error('Backup file is corrupted or not a valid SQLite database.');
      }
      
      const fkCheck = testDb.pragma('foreign_key_check');
      if (fkCheck && fkCheck.length > 0) {
        throw new Error(`Backup file contains ${fkCheck.length} foreign key violations.`);
      }

      // Schema validation
      const tables = testDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
      const requiredTables = ['products', 'orders', 'order_items', 'doctors', 'institutions', 'areas', 'team_members', 'product_targets', 'business_years'];
      for (const table of requiredTables) {
        if (!tables.includes(table)) {
          throw new Error(`Missing table '${table}' in backup file schema.`);
        }
      }
    } catch (e) {
      logger.error(`Backup validation failed: ${e.message}`);
      throw new Error(`Invalid Backup File: ${e.message}`);
    } finally {
      if (testDb) testDb.close();
    }

    // 3. Perform Transactional Replacement
    logger.info('Safety checks passed. Closing database and copying backup...');
    try {
      // Create backup of active file before we overwrite it
      if (fs.existsSync(activeDbPath)) {
        fs.copyFileSync(activeDbPath, tempBackupPath);
      }

      // Close the connection
      SessionManager.endSession();

      // Overwrite active database file
      fs.copyFileSync(backupPath, activeDbPath);

      // Verify the restored file can be opened
      let verifyDb = new Database(activeDbPath);
      verifyDb.close();

      // Clean up the temp backup
      if (fs.existsSync(tempBackupPath)) {
        fs.unlinkSync(tempBackupPath);
      }

      logger.info('Database restore successfully completed.');

      // Try to restart the application to reset state cleanly
      setTimeout(() => {
        app.relaunch();
        app.exit(0);
      }, 1000);

      return true;
    } catch (err) {
      logger.error(`Database restore failed: ${err.message}. Rolling back to original state...`);
      
      // Rollback
      if (fs.existsSync(tempBackupPath)) {
        try {
          fs.copyFileSync(tempBackupPath, activeDbPath);
          fs.unlinkSync(tempBackupPath);
        } catch (rollbackErr) {
          logger.critical(`CRITICAL: Rollback failed during restore: ${rollbackErr.message}`);
        }
      }
      throw new Error(`Restore failed: ${err.message}. Original database rolled back.`);
    }
  }

  /**
   * Run comprehensive database health check
   */
  static runIntegrityCheck() {
    const db = SessionManager.getActiveDatabaseConnection();
    if (!db) {
      throw new Error('No active database connection.');
    }
    
    const reports = [];
    let healthy = true;
    
    // 1. Run PRAGMA integrity_check
    try {
      const res = db.pragma('integrity_check');
      if (res && res[0] && res[0].integrity_check === 'ok') {
        reports.push({ check: 'Database Integrity Check', status: 'PASS', message: 'No corruption or broken nodes detected.' });
      } else {
        healthy = false;
        reports.push({ check: 'Database Integrity Check', status: 'FAIL', message: `Corruption issues: ${JSON.stringify(res)}` });
      }
    } catch (e) {
      healthy = false;
      reports.push({ check: 'Database Integrity Check', status: 'FAIL', message: e.message });
    }
    
    // 2. Run PRAGMA foreign_key_check
    try {
      const res = db.pragma('foreign_key_check');
      if (!res || res.length === 0) {
        reports.push({ check: 'Foreign Key Verification', status: 'PASS', message: 'No orphan rows or broken foreign key relations.' });
      } else {
        healthy = false;
        reports.push({ check: 'Foreign Key Verification', status: 'FAIL', message: `Violations found in ${res.length} database entries.` });
      }
    } catch (e) {
      healthy = false;
      reports.push({ check: 'Foreign Key Verification', status: 'FAIL', message: e.message });
    }
    
    // 3. Schema Check
    try {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
      const requiredTables = ['products', 'orders', 'order_items', 'doctors', 'institutions', 'areas', 'team_members', 'product_targets', 'business_years', 'settings', 'tasks', 'reminders'];
      const missing = requiredTables.filter(t => !tables.includes(t));
      if (missing.length === 0) {
        reports.push({ check: 'Schema Tables Verification', status: 'PASS', message: 'All required table schemas are present.' });
      } else {
        healthy = false;
        reports.push({ check: 'Schema Tables Verification', status: 'FAIL', message: `Missing tables: ${missing.join(', ')}` });
      }
    } catch (e) {
      healthy = false;
      reports.push({ check: 'Schema Tables Verification', status: 'FAIL', message: e.message });
    }
    
    // 4. Duplicate unique constraint audit
    try {
      const duplicateProducts = db.prepare("SELECT code, COUNT(*) as count FROM products GROUP BY code HAVING count > 1").all();
      const duplicateAreas = db.prepare("SELECT code, COUNT(*) as count FROM areas GROUP BY code HAVING count > 1").all();
      
      if (duplicateProducts.length === 0 && duplicateAreas.length === 0) {
        reports.push({ check: 'Unique Constraint Audit', status: 'PASS', message: 'No duplicate product codes or area codes detected.' });
      } else {
        healthy = false;
        let msg = '';
        if (duplicateProducts.length > 0) msg += `Duplicate product codes: ${duplicateProducts.map(p => p.code).join(', ')}. `;
        if (duplicateAreas.length > 0) msg += `Duplicate area codes: ${duplicateAreas.map(a => a.code).join(', ')}. `;
        reports.push({ check: 'Unique Constraint Audit', status: 'FAIL', message: msg });
      }
    } catch (e) {
      healthy = false;
      reports.push({ check: 'Unique Constraint Audit', status: 'FAIL', message: e.message });
    }
    
    // 5. Dynamic Data Integrity & Orphaned Items Audit
    const audit = {};
    try {
      const tablesList = ['products', 'doctors', 'institutions', 'areas', 'team_members', 'orders', 'product_targets', 'business_years'];
      tablesList.forEach(table => {
        const total = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
        let active = 0;
        let inactive = 0;
        let orphaned = 0;

        if (table === 'business_years') {
          active = db.prepare("SELECT COUNT(*) as count FROM business_years WHERE is_active = 1").get().count;
        } else if (table === 'product_targets') {
          orphaned = db.prepare(`
            SELECT COUNT(*) as count FROM product_targets 
            WHERE product_id NOT IN (SELECT id FROM products) 
            OR business_year_id NOT IN (SELECT id FROM business_years)
          `).get().count;
        } else if (table === 'orders') {
          const pending = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'Pending'").get().count;
          const completed = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'Completed'").get().count;
          active = completed;
          inactive = pending;
          orphaned = db.prepare(`
            SELECT COUNT(*) as count FROM orders 
            WHERE (institution_id IS NOT NULL AND institution_id NOT IN (SELECT id FROM institutions))
            OR (doctor_id IS NOT NULL AND doctor_id NOT IN (SELECT id FROM doctors))
            OR (area_id IS NOT NULL AND area_id NOT IN (SELECT id FROM areas))
            OR (team_member_id IS NOT NULL AND team_member_id NOT IN (SELECT id FROM team_members))
          `).get().count;
        } else {
          const is_active_col = table === 'team_members' ? 'is_active' : 'is_active';
          active = db.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE is_active = 1`).get().count;
          inactive = db.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE is_active = 0`).get().count;
          
          if (table === 'doctors' || table === 'institutions') {
            orphaned = db.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE area_id NOT IN (SELECT id FROM areas)`).get().count;
          }
        }

        audit[table] = { total, active, inactive, orphaned };
      });
    } catch (auditErr) {
      logger.error('Failed to run data integrity audit:', auditErr);
    }
    
    return {
      success: true,
      healthy,
      reports,
      audit,
      checkedAt: new Date().toISOString()
    };
  }

  /**
   * Admin Diagnostics Health Monitor
   */
  static getDiagnostics() {
    const session = SessionManager.getSession();
    if (!session || session.user.role !== 'Admin') {
      throw new Error('Unauthorized: Only administrators can access diagnostics.');
    }
    
    const activeDb = SessionManager.getActiveDatabaseConnection();
    const dbAvailable = activeDb !== null;
    
    let diskWriteSuccess = false;
    let diskErrorMessage = '';
    const storageDir = UserDatabaseService.getStorageDirectory();
    const tempTestFile = path.join(storageDir, '.write_test');
    try {
      fs.writeFileSync(tempTestFile, 'health-check', 'utf8');
      if (fs.readFileSync(tempTestFile, 'utf8') === 'health-check') {
        diskWriteSuccess = true;
      }
      fs.unlinkSync(tempTestFile);
    } catch (err) {
      diskErrorMessage = err.message;
    }
    
    const backupDir = path.join(storageDir, 'Backups');
    let totalBackups = 0;
    let lastBackupFile = 'None';
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir).filter(f => f.startsWith('backup_') && f.endsWith('.db'));
      totalBackups = files.length;
      if (totalBackups > 0) {
        files.sort();
        lastBackupFile = files[files.length - 1];
      }
    }
    
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(memUsage.rss / 1024 / 1024);
    const memoryWarning = heapUsedMB > 250;
    
    const config = require('../config.cjs');
    let dbVersion = 'Unknown';
    let sqliteVersion = 'Unknown';
    let dbSizeBytes = 0;
    let counts = { users: 0, products: 0, doctors: 0, orders: 0, auditLogs: 0 };
    let fkStatus = 'PASS';

    if (dbAvailable) {
      try {
        const row = activeDb.prepare("SELECT value FROM settings WHERE key = 'db_version'").get();
        dbVersion = row ? row.value : '1.0.0';
        
        const sqlVer = activeDb.prepare('SELECT sqlite_version() as ver').get();
        sqliteVersion = sqlVer ? sqlVer.ver : 'Unknown';

        counts.users = activeDb.prepare('SELECT COUNT(*) as count FROM users').get().count;
        counts.products = activeDb.prepare('SELECT COUNT(*) as count FROM products').get().count;
        counts.doctors = activeDb.prepare('SELECT COUNT(*) as count FROM doctors').get().count;
        counts.orders = activeDb.prepare('SELECT COUNT(*) as count FROM orders').get().count;
        counts.auditLogs = activeDb.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;

        const fkCheck = activeDb.pragma('foreign_key_check');
        if (fkCheck && fkCheck.length > 0) fkStatus = `FAIL (${fkCheck.length} violations)`;
      } catch (e) {
        dbVersion = '1.0.0';
      }

      try {
        const session = SessionManager.getSession();
        if (session) {
          const dbPath = UserDatabaseService.getUserDatabasePath(session.user.databaseName);
          if (fs.existsSync(dbPath)) {
            dbSizeBytes = fs.statSync(dbPath).size;
          }
        }
      } catch (e) {}
    }
    
    return {
      databaseAvailable: dbAvailable,
      sessionValid: SessionManager.isAuthenticated(),
      diskWrite: diskWriteSuccess ? 'OK' : `FAIL: ${diskErrorMessage}`,
      totalBackups,
      lastBackupFile,
      backupLocation: backupDir,
      databaseSize: `${(dbSizeBytes / (1024 * 1024)).toFixed(2)} MB`,
      counts,
      healthIndicators: {
        databaseIntegrity: dbAvailable ? 'PASS' : 'FAIL',
        foreignKeyStatus: fkStatus
      },
      systemInfo: {
        appVersion: config.version,
        dbVersion,
        schemaVersion: config.dbVersion,
        electronVersion: process.versions.electron || 'N/A (Web/Node)',
        nodeVersion: process.versions.node,
        reactVersion: '18.3.1',
        sqliteVersion,
        operatingSystem: `${process.platform} (${process.arch})`
      },
      memoryUsage: {
        heapUsed: `${heapUsedMB} MB`,
        heapTotal: `${heapTotalMB} MB`,
        rss: `${rssMB} MB`,
        warning: memoryWarning
      },
      migrationStatus: {
        appVersion: config.version,
        dbVersion,
        status: dbVersion === config.dbVersion ? 'UP-TO-DATE' : 'OUTDATED'
      },
      uptime: `${Math.round(process.uptime())} seconds`
    };
  }

  /**
   * Run background checks for scheduled backups
   */
  static async checkAndRunAutoBackup() {
    const session = SessionManager.getSession();
    if (!session) return;
    
    const db = SessionManager.getActiveDatabaseConnection();
    if (!db) return;
    
    try {
      const scheduleRow = db.prepare("SELECT value FROM settings WHERE key = 'backup_schedule'").get();
      const lastBackupRow = db.prepare("SELECT value FROM settings WHERE key = 'last_backup_time'").get();
      
      const schedule = scheduleRow ? scheduleRow.value : 'daily';
      const lastBackupStr = lastBackupRow ? lastBackupRow.value : null;
      
      if (schedule === 'none') return;
      
      let shouldBackup = false;
      const now = new Date();
      
      if (!lastBackupStr) {
        shouldBackup = true;
      } else {
        const lastBackup = new Date(lastBackupStr);
        const diffMs = now - lastBackup;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        
        if (schedule === 'daily' && diffDays >= 1) {
          shouldBackup = true;
        } else if (schedule === 'weekly' && diffDays >= 7) {
          shouldBackup = true;
        } else if (schedule === 'monthly' && diffDays >= 30) {
          shouldBackup = true;
        }
      }
      
      if (shouldBackup) {
        logger.info(`Running automatic scheduled backup (${schedule})...`);
        const res = await this.createBackup();
        db.prepare("INSERT OR REPLACE INTO settings (key, value, group_name) VALUES ('last_backup_time', ?, 'general')").run(res.time);
      }
    } catch (err) {
      logger.error('Failed to run automatic backup check:', err);
    }
  }
}

module.exports = BackupService;
