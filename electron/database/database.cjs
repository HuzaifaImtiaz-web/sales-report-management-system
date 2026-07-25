const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const logger = require('../logger.cjs');

function getDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'HimmelSales.db');
  logger.info(`Opening SQLite database at: ${dbPath}`);
  const db = new Database(dbPath);
  
  // Enable pragmas
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  
  logger.info('SQL Trace: PRAGMA foreign_keys = ON');
  logger.info('SQL Trace: PRAGMA journal_mode = WAL');
  logger.info('SQL Trace: PRAGMA synchronous = NORMAL');
  
  return db;
}

module.exports = { getDatabase };
