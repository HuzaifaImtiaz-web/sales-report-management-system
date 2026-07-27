const Database = require('better-sqlite3');
const UserDatabaseService = require('./UserDatabaseService.cjs');
const UserRepository = require('./UserRepository.cjs');
const PasswordService = require('./PasswordService.cjs');
const SessionManager = require('./SessionManager.cjs');
const { applyUsersSchema } = require('./usersSchema.cjs');
const logger = require('../logger.cjs');

let usersDb = null;
let userRepo = null;

function initUsersDb() {
  if (usersDb) return;
  const dbPath = UserDatabaseService.getAuthDatabasePath();
  logger.info(`Opening authentication database at: ${dbPath}`);
  usersDb = new Database(dbPath);
  usersDb.pragma('foreign_keys = ON');
  usersDb.pragma('journal_mode = WAL');
  usersDb.pragma('synchronous = NORMAL');
  
  // Apply schema
  applyUsersSchema(usersDb);
  
  userRepo = new UserRepository(usersDb);
}

class AuthenticationService {
  static initialize() {
    initUsersDb();
    
    try {
      const users = userRepo.findAll();
      if (users.length === 0) {
        logger.info('No users found in database. Seeding default administrator account...');
        const bcrypt = require('bcryptjs');
        const username = 'admin';
        const passwordHash = bcrypt.hashSync('Password123!', 12);
        const fullName = 'System Administrator';
        const role = 'Admin';
        const databaseName = 'admin';
        
        // 1. Create user database file
        UserDatabaseService.createDatabase(databaseName);
        
        // 2. Insert user record
        userRepo.create({
          username,
          passwordHash,
          fullName,
          role,
          databaseName,
          isActive: true
        });
        logger.info('Default administrator account successfully seeded: admin / Password123!');
      }
    } catch (err) {
      logger.error('Failed to seed default administrator account:', err);
    }
  }

  static getRepository() {
    initUsersDb();
    return userRepo;
  }

  static async createUser({ username, password, fullName, role }) {
    initUsersDb();

    // 1. Validate inputs
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      throw new Error('Username must be at least 3 characters long.');
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      throw new Error('Full name must be at least 2 characters long.');
    }
    const allowedRoles = ['Admin', 'Manager', 'Rep', 'Sales Representative'];
    if (!role || !allowedRoles.includes(role)) {
      throw new Error(`Invalid role. Allowed roles are: ${allowedRoles.join(', ')}`);
    }

    const cleanUsername = username.trim();

    // 2. Check duplicate username
    const existing = userRepo.findByUsername(cleanUsername);
    if (existing) {
      throw new Error(`Username '${cleanUsername}' already exists.`);
    }

    // 3. Hash password
    const passwordHash = await PasswordService.hashPassword(password);
    const databaseName = cleanUsername.toLowerCase();

    // 4. Create the physical database for the user
    try {
      UserDatabaseService.createDatabase(databaseName);
    } catch (dbError) {
      logger.error(`Database creation failed during user creation: ${dbError.message}`);
      throw dbError;
    }

    // 5. Create user record
    try {
      const createdUser = userRepo.create({
        username: cleanUsername,
        passwordHash,
        fullName: fullName.trim(),
        role,
        databaseName,
        isActive: true
      });

      logger.info(`SUCCESS: User created successfully: ${cleanUsername}`);
      
      // Return safe user object (no hash)
      return {
        id: createdUser.id,
        username: createdUser.username,
        fullName: createdUser.fullName,
        role: createdUser.role,
        isActive: createdUser.isActive,
        createdAt: createdUser.createdAt
      };
    } catch (saveError) {
      // Rollback database file if database was created but user record failed to save
      logger.error(`Failed to save user record: ${saveError.message}. Rolling back user database file.`);
      const dbPath = UserDatabaseService.getUserDatabasePath(databaseName);
      const fs = require('fs');
      if (fs.existsSync(dbPath)) {
        try {
          fs.unlinkSync(dbPath);
        } catch (e) {}
      }
      throw saveError;
    }
  }

  static async authenticateUser(username, password) {
    initUsersDb();

    if (!username || !password) {
      throw new Error('Username and password are required.');
    }

    const cleanUsername = username.trim();
    const user = userRepo.findByUsername(cleanUsername);

    if (!user) {
      logger.warn(`Login failure: User not found: ${cleanUsername}`);
      throw new Error('Invalid username or password.');
    }

    // Check if account is active
    if (!user.isActive) {
      logger.warn(`Login failure: Disabled account access attempt: ${cleanUsername}`);
      throw new Error('Your account is disabled. Please contact your administrator.');
    }

    // Check account lockout
    if (user.lockedUntil) {
      const lockedUntilDate = new Date(user.lockedUntil);
      if (lockedUntilDate > new Date()) {
        const remainingMinutes = Math.ceil((lockedUntilDate - new Date()) / (60 * 1000));
        logger.warn(`Login failure: Attempt to access locked account: ${cleanUsername}`);
        throw new Error(`Account is temporarily locked. Please try again in ${remainingMinutes} minutes.`);
      } else {
        // Lock has expired, unlock it
        userRepo.unlockAccount(cleanUsername);
        user.lockedUntil = null;
        user.failedAttempts = 0;
      }
    }

    // Verify password
    const isPasswordCorrect = await PasswordService.verifyPassword(password, user.passwordHash);

    if (!isPasswordCorrect) {
      const failedCount = userRepo.incrementFailedAttempts(cleanUsername);
      logger.warn(`Login failure: Incorrect password for user: ${cleanUsername}. Failed attempts: ${failedCount}`);

      if (failedCount >= 5) {
        userRepo.lockAccount(cleanUsername, 15); // 15 minutes lock
        logger.warn(`Account locked: User ${cleanUsername} locked for 15 minutes due to 5 failed attempts.`);
        throw new Error('Account locked due to too many failed attempts. Please try again in 15 minutes.');
      }

      throw new Error('Invalid username or password.');
    }

    // Password correct: Reset failed attempts, update last login
    userRepo.resetFailedAttempts(cleanUsername);
    userRepo.updateLastLogin(cleanUsername);

    // Boot user session database
    SessionManager.startSession(user);

    // Check Maintenance Mode for non-Admin users
    if (user.role !== 'Admin') {
      try {
        const activeDb = SessionManager.getActiveDatabaseConnection();
        if (activeDb) {
          const row = activeDb.prepare("SELECT value FROM settings WHERE key = 'maintenance_mode'").get();
          if (row && row.value === 'true') {
            SessionManager.endSession();
            logger.warn(`Login blocked due to Maintenance Mode for user: ${cleanUsername}`);
            throw new Error('System is currently under maintenance. Only Administrators may log in.');
          }
        }
      } catch (mErr) {
        if (mErr.message.includes('maintenance')) {
          throw mErr;
        }
      }
    }

    logger.info(`SUCCESS: User logged in: ${cleanUsername}`);

    // Return safe user profile and session info
    return SessionManager.getSession();
  }

  static async changePassword(userId, oldPassword, newPassword) {
    initUsersDb();

    if (!userId || !oldPassword || !newPassword) {
      throw new Error('All fields are required.');
    }

    const user = userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    // Verify old password
    const isOldCorrect = await PasswordService.verifyPassword(oldPassword, user.passwordHash);
    if (!isOldCorrect) {
      throw new Error('Incorrect current password.');
    }

    // Hash and update new password
    const passwordHash = await PasswordService.hashPassword(newPassword);
    userRepo.update(userId, { passwordHash });
    logger.info(`SUCCESS: Password changed for user: ${user.username}`);
    return true;
  }

  static async resetPassword(username, newPassword) {
    initUsersDb();

    if (!username || !newPassword) {
      throw new Error('Username and new password are required.');
    }

    const user = userRepo.findByUsername(username);
    if (!user) {
      throw new Error('User not found.');
    }

    const passwordHash = await PasswordService.hashPassword(newPassword);
    userRepo.update(user.id, { passwordHash });
    logger.info(`SUCCESS: Password reset by administrator for user: ${user.username}`);
    return true;
  }

  static activateUser(username) {
    initUsersDb();
    const user = userRepo.findByUsername(username);
    if (!user) {
      throw new Error('User not found.');
    }
    userRepo.update(user.id, { isActive: true });
    logger.info(`SUCCESS: User activated: ${username}`);
    return true;
  }

  static disableUser(username) {
    initUsersDb();
    const user = userRepo.findByUsername(username);
    if (!user) {
      throw new Error('User not found.');
    }
    userRepo.update(user.id, { isActive: false });
    logger.info(`SUCCESS: User disabled: ${username}`);

    // If the currently logged-in user is disabled, force log out
    const session = SessionManager.getSession();
    if (session && session.user.username.toLowerCase() === username.toLowerCase()) {
      SessionManager.endSession();
    }
    return true;
  }

  static getAllUsers() {
    initUsersDb();
    const users = userRepo.findAll();
    return users.map(u => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin
    }));
  }

  static changeRole(username, newRole) {
    initUsersDb();
    const allowedRoles = ['Admin', 'Manager', 'Rep', 'Sales Representative'];
    if (!newRole || !allowedRoles.includes(newRole)) {
      throw new Error(`Invalid role. Allowed roles are: ${allowedRoles.join(', ')}`);
    }
    const user = userRepo.findByUsername(username);
    if (!user) {
      throw new Error('User not found.');
    }
    userRepo.update(user.id, { role: newRole });
    logger.info(`SUCCESS: Role changed for user ${username} to ${newRole}`);
    return true;
  }

  static deleteUser(username) {
    initUsersDb();
    if (!username) {
      throw new Error('Username is required.');
    }
    const user = userRepo.findByUsername(username);
    if (!user) {
      throw new Error('User not found.');
    }
    if (user.username.toLowerCase() === 'admin') {
      throw new Error('Default system administrator account cannot be deleted.');
    }
    const deleted = userRepo.delete(user.id);
    logger.info(`SUCCESS: User deleted: ${username}`);

    // If the currently logged-in user is deleted, force log out
    const session = SessionManager.getSession();
    if (session && session.user && session.user.username.toLowerCase() === username.toLowerCase()) {
      SessionManager.endSession();
    }
    return deleted;
  }

  static getSecuritySetting(key) {
    initUsersDb();
    const row = usersDb.prepare('SELECT value FROM system_security WHERE key = ?').get(key);
    return row ? row.value : null;
  }

  static setSecuritySetting(key, value) {
    initUsersDb();
    usersDb.prepare(`
      INSERT INTO system_security (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `).run(key, String(value));
  }

  static async changeUsername(userId, currentPassword, newUsername) {
    initUsersDb();
    if (!userId || !currentPassword || !newUsername) {
      throw new Error('User ID, current password, and new username are required.');
    }

    const cleanUsername = newUsername.trim();
    if (cleanUsername.length < 3) {
      throw new Error('Username must be at least 3 characters long.');
    }

    const user = userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    const isPasswordValid = await PasswordService.verifyPassword(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Incorrect current password.');
    }

    const existing = userRepo.findByUsername(cleanUsername);
    if (existing && existing.id !== user.id) {
      throw new Error(`Username '${cleanUsername}' is already taken.`);
    }

    userRepo.update(user.id, { username: cleanUsername });
    logger.info(`SUCCESS: Username changed for user ID ${userId} to '${cleanUsername}'`);
    return { success: true, username: cleanUsername };
  }

  static async getSecurityStatus() {
    initUsersDb();
    const firstLoginDone = this.getSecuritySetting('first_login_completed') === 'true';
    const adminUser = userRepo.findByUsername('admin');
    let isDefaultPassword = false;
    if (adminUser) {
      isDefaultPassword = await PasswordService.verifyPassword('Password123!', adminUser.passwordHash);
    }

    return {
      isFirstLoginPending: !firstLoginDone && isDefaultPassword,
      firstLoginCompleted: firstLoginDone,
      hasRecoveryPassword: Boolean(this.getSecuritySetting('recovery_password_hash')),
      hasRecoveryPin: Boolean(this.getSecuritySetting('recovery_pin_hash'))
    };
  }

  static async completeFirstLoginWizard({ newUsername, newPassword, recoveryPassword, recoveryPin }) {
    initUsersDb();

    if (!newUsername || !newPassword || !recoveryPassword || !recoveryPin) {
      throw new Error('All security fields are required.');
    }

    const cleanUsername = newUsername.trim();
    if (cleanUsername.length < 3) {
      throw new Error('Username must be at least 3 characters long.');
    }

    // Password policy check
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      throw new Error('New password does not meet security policy requirements.');
    }

    if (recoveryPassword.length < 8 || !/[A-Z]/.test(recoveryPassword) || !/[a-z]/.test(recoveryPassword) || !/\d/.test(recoveryPassword) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(recoveryPassword)) {
      throw new Error('Recovery password does not meet security policy requirements.');
    }

    if (!/^\d{4,8}$/.test(recoveryPin)) {
      throw new Error('Recovery PIN must be 4 to 8 numeric digits.');
    }

    // Find admin user
    let adminUser = userRepo.findByUsername('admin');
    if (!adminUser) {
      const allUsers = userRepo.findAll();
      adminUser = allUsers.find(u => u.role === 'Admin') || allUsers[0];
    }
    if (!adminUser) {
      throw new Error('Administrator account not found.');
    }

    // 1. Update Username and Password
    const passwordHash = await PasswordService.hashPassword(newPassword);
    userRepo.update(adminUser.id, {
      username: cleanUsername,
      passwordHash
    });

    // 2. Hash and store Recovery Password
    const recHash = await PasswordService.hashPassword(recoveryPassword);
    this.setSecuritySetting('recovery_password_hash', recHash);

    // 3. Hash and store Recovery PIN
    const pinHash = await PasswordService.hashPassword(recoveryPin, 4);
    this.setSecuritySetting('recovery_pin_hash', pinHash);

    // 4. Mark first login completed
    this.setSecuritySetting('first_login_completed', 'true');

    logger.info(`SUCCESS: First Login Security Wizard completed for '${cleanUsername}'`);
    return { success: true, username: cleanUsername };
  }
}

// Export AuthenticationService without auto-running top-level initialization
module.exports = AuthenticationService;
