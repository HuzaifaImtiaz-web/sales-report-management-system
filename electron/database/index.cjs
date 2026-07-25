const dbProxy = require('./dbProxy.cjs');
const AuthenticationService = require('../auth/AuthenticationService.cjs');
const SessionManager = require('../auth/SessionManager.cjs');
const logger = require('../logger.cjs');

function initDatabase() {
  try {
    logger.info('Initializing SQLite database system (Authentication Foundation)...');
    // Initialize the authentication database
    AuthenticationService.initialize();
    
    logger.info('SQLite database system setup complete (Proxy enabled).');
    return dbProxy;
  } catch (error) {
    logger.error('Failed to initialize database system:', error);
    throw error;
  }
}

function closeDatabase() {
  try {
    SessionManager.endSession();
    logger.info('Database connection closed (Session ended).');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
}

module.exports = {
  initDatabase,
  closeDatabase,
  get db() {
    return dbProxy;
  }
};
