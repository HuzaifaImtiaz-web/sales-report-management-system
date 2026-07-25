/**
 * Emergency Admin Account Recovery CLI Script
 * Inspects users table schema, locates 'admin' user, and restores account access.
 */

const Database = require('better-sqlite3');
const UserDatabaseService = require('../auth/UserDatabaseService.cjs');

function recoverAdminAccount() {
  let db = null;
  try {
    const authDbPath = UserDatabaseService.getAuthDatabasePath();
    console.log(`Opening authentication database at: ${authDbPath}`);
    db = new Database(authDbPath);

    // 1. Inspect table columns dynamically
    const columns = db.prepare("PRAGMA table_info(users)").all();
    const colNames = columns.map(c => c.name.toLowerCase());
    
    let statusCol = null;
    if (colNames.includes('is_active')) statusCol = 'is_active';
    else if (colNames.includes('status')) statusCol = 'status';
    else if (colNames.includes('disabled')) statusCol = 'disabled';
    else if (colNames.includes('is_disabled')) statusCol = 'is_disabled';

    if (!statusCol) {
      console.error('Failure: Unable to determine account status column in users table.');
      process.exit(1);
    }

    // 2. Find admin user
    const adminUser = db.prepare('SELECT * FROM users WHERE LOWER(username) = ?').get('admin');
    if (!adminUser) {
      console.error('User found: None');
      console.error('Failure: Admin user account does not exist.');
      process.exit(1);
    }

    console.log(`User found: ${adminUser.username} (ID: ${adminUser.id})`);
    const prevStatus = adminUser[statusCol];
    console.log(`Previous status (${statusCol}): ${prevStatus}`);

    // 3. Re-enable account
    let updateSql = `UPDATE users SET ${statusCol} = 1`;
    const params = [];
    if (colNames.includes('failed_attempts')) {
      updateSql += `, failed_attempts = 0`;
    }
    if (colNames.includes('locked_until')) {
      updateSql += `, locked_until = NULL`;
    }
    if (colNames.includes('updated_at')) {
      updateSql += `, updated_at = CURRENT_TIMESTAMP`;
    }
    updateSql += ` WHERE id = ?`;
    params.push(adminUser.id);

    const result = db.prepare(updateSql).run(...params);

    // 4. Verify new status
    const updatedAdmin = db.prepare('SELECT * FROM users WHERE id = ?').get(adminUser.id);
    const newStatus = updatedAdmin[statusCol];
    console.log(`New status (${statusCol}): ${newStatus}`);

    if (result.changes > 0) {
      console.log('Success or failure: SUCCESS');
    } else {
      console.log('Success or failure: FAILURE');
      process.exit(1);
    }
  } catch (err) {
    console.error('Success or failure: FAILURE');
    console.error('Error during admin recovery execution:', err.message);
    process.exit(1);
  } finally {
    if (db) db.close();
  }
}

recoverAdminAccount();
