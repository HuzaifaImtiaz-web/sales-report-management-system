const SessionManager = require('../auth/SessionManager.cjs');

const dbProxy = new Proxy({}, {
  get(target, prop) {
    const db = SessionManager.getActiveDatabaseConnection();
    if (!db) {
      throw new Error('No active database connection. Please log in first.');
    }
    const value = Reflect.get(db, prop, db);
    if (typeof value === 'function') {
      return value.bind(db);
    }
    return value;
  }
});

module.exports = dbProxy;
