const UserRepository = require('./UserRepository');
const PasswordService = require('./PasswordService');
const { signAccessToken } = require('./tokens');
const logger = require('../logger');

const ALLOWED_ROLES = ['Admin', 'Manager', 'Rep', 'Sales Representative'];
const LEGACY_DEFAULT_ADMIN_PASSWORD = 'Password123!';
const STRONG_PASSWORD = (value) =>
  value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) &&
  /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

function toSessionUser(user) {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive
  };
}

function toPublicUser(u) {
  return {
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt,
    lastLogin: u.lastLogin
  };
}

class AuthService {
  constructor(db) {
    this.db = db;
    this.users = new UserRepository(db);
  }

  async getSecuritySetting(key) {
    const row = await this.db.get('SELECT value FROM system_security WHERE key = ?', [key]);
    return row ? row.value : null;
  }

  async setSecuritySetting(key, value) {
    await this.db.run(`
      INSERT INTO system_security (key, value, updated_at)
      VALUES (?, ?, himmel_now_text())
      ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `, [key, String(value)]);
  }

  async _assertNotLastActiveAdmin(user, action) {
    if (user.role !== 'Admin' || !user.isActive) return;
    if ((await this.users.countOtherActiveAdmins(user.id)) === 0) {
      throw new Error(`Cannot ${action} the last active administrator account.`);
    }
  }

  async login(username, password) {
    if (!username || !password) {
      throw new Error('Username and password are required.');
    }

    const cleanUsername = String(username).trim();
    const user = await this.users.findByUsername(cleanUsername);

    if (!user) {
      await PasswordService.spendComparisonTime(password);
      logger.warn(`Login failure: User not found: ${cleanUsername}`);
      throw new Error('Invalid username or password.');
    }

    if (!user.isActive) {
      logger.warn(`Login failure: Disabled account access attempt: ${cleanUsername}`);
      throw new Error('Your account is disabled. Please contact your administrator.');
    }

    if (user.lockedUntil) {
      const lockedUntilDate = new Date(user.lockedUntil);
      if (lockedUntilDate > new Date()) {
        const remainingMinutes = Math.ceil((lockedUntilDate - new Date()) / (60 * 1000));
        logger.warn(`Login failure: Attempt to access locked account: ${cleanUsername}`);
        throw new Error(`Account is temporarily locked. Please try again in ${remainingMinutes} minutes.`);
      }
      await this.users.unlockAccount(user.id);
    }

    const isPasswordCorrect = await PasswordService.verifyPassword(password, user.passwordHash);
    if (!isPasswordCorrect) {
      const failedCount = await this.users.incrementFailedAttempts(user.id);
      logger.warn(`Login failure: Incorrect password for user: ${cleanUsername}. Failed attempts: ${failedCount}`);

      if (failedCount >= 5) {
        await this.users.lockAccount(user.id, 15);
        logger.warn(`Account locked: User ${cleanUsername} locked for 15 minutes due to 5 failed attempts.`);
        throw new Error('Account locked due to too many failed attempts. Please try again in 15 minutes.');
      }
      throw new Error('Invalid username or password.');
    }

    await this.users.recordSuccessfulLogin(user.id);

    // Maintenance Mode: only Administrators may log in.
    if (user.role !== 'Admin') {
      const row = await this.db.get("SELECT value FROM settings WHERE key = 'maintenance_mode'");
      if (row && row.value === 'true') {
        logger.warn(`Login blocked due to Maintenance Mode for user: ${cleanUsername}`);
        throw new Error('System is currently under maintenance. Only Administrators may log in.');
      }
    }

    logger.info(`SUCCESS: User logged in: ${user.username}`);
    return {
      token: signAccessToken(user),
      session: {
        user: toSessionUser(user),
        loginTimestamp: new Date().toISOString()
      }
    };
  }

  async createUser({ username, password, fullName, role } = {}) {
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      throw new Error('Username must be at least 3 characters long.');
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      throw new Error('Full name must be at least 2 characters long.');
    }
    if (!role || !ALLOWED_ROLES.includes(role)) {
      throw new Error(`Invalid role. Allowed roles are: ${ALLOWED_ROLES.join(', ')}`);
    }

    const cleanUsername = username.trim();
    if (await this.users.findByUsername(cleanUsername)) {
      throw new Error(`Username '${cleanUsername}' already exists.`);
    }

    const passwordHash = await PasswordService.hashPassword(password);
    const createdUser = await this.users.create({
      username: cleanUsername,
      passwordHash,
      fullName: fullName.trim(),
      role,
      isActive: true
    });

    logger.info(`SUCCESS: User created successfully: ${cleanUsername}`);
    return {
      id: createdUser.id,
      username: createdUser.username,
      fullName: createdUser.fullName,
      role: createdUser.role,
      isActive: createdUser.isActive,
      createdAt: createdUser.createdAt
    };
  }

  /** Returns the updated user so the caller can issue a fresh login token. */
  async changePassword(userId, oldPassword, newPassword) {
    if (!userId || !oldPassword || !newPassword) {
      throw new Error('All fields are required.');
    }

    const user = await this.users.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    if (!(await PasswordService.verifyPassword(oldPassword, user.passwordHash))) {
      throw new Error('Incorrect current password.');
    }

    const passwordHash = await PasswordService.hashPassword(newPassword);
    const updated = await this.users.update(userId, { passwordHash });
    logger.info(`SUCCESS: Password changed for user: ${user.username}`);
    return updated;
  }

  async resetPassword(username, newPassword) {
    if (!username || !newPassword) {
      throw new Error('Username and new password are required.');
    }

    const user = await this.users.findByUsername(username);
    if (!user) {
      throw new Error('User not found.');
    }

    const passwordHash = await PasswordService.hashPassword(newPassword);
    const updated = await this.users.update(user.id, { passwordHash });
    logger.info(`SUCCESS: Password reset by administrator for user: ${user.username}`);
    return updated;
  }

  async activateUser(username) {
    const user = await this.users.findByUsername(username);
    if (!user) {
      throw new Error('User not found.');
    }
    await this.users.update(user.id, { isActive: true });
    logger.info(`SUCCESS: User activated: ${username}`);
    return true;
  }

  async disableUser(username) {
    const user = await this.users.findByUsername(username);
    if (!user) {
      throw new Error('User not found.');
    }
    await this._assertNotLastActiveAdmin(user, 'disable');
    // Disabling bumps the session version, so that user is signed out on every computer.
    await this.users.update(user.id, { isActive: false });
    logger.info(`SUCCESS: User disabled: ${username}`);
    return true;
  }

  async getAllUsers() {
    const users = await this.users.findAll();
    return users.map(toPublicUser);
  }

  async changeRole(username, newRole) {
    if (!newRole || !ALLOWED_ROLES.includes(newRole)) {
      throw new Error(`Invalid role. Allowed roles are: ${ALLOWED_ROLES.join(', ')}`);
    }
    const user = await this.users.findByUsername(username);
    if (!user) {
      throw new Error('User not found.');
    }
    if (newRole !== 'Admin') {
      await this._assertNotLastActiveAdmin(user, 'change the role of');
    }
    await this.users.update(user.id, { role: newRole });
    logger.info(`SUCCESS: Role changed for user ${username} to ${newRole}`);
    return true;
  }

  async deleteUser(username) {
    if (!username) {
      throw new Error('Username is required.');
    }
    const user = await this.users.findByUsername(username);
    if (!user) {
      throw new Error('User not found.');
    }
    if (user.username.toLowerCase() === 'admin') {
      throw new Error('Default system administrator account cannot be deleted.');
    }
    await this._assertNotLastActiveAdmin(user, 'delete');
    const deleted = await this.users.delete(user.id);
    logger.info(`SUCCESS: User deleted: ${username}`);
    return deleted;
  }

  async changeUsername(userId, currentPassword, newUsername) {
    if (!userId || !currentPassword || !newUsername) {
      throw new Error('User ID, current password, and new username are required.');
    }

    const cleanUsername = String(newUsername).trim();
    if (cleanUsername.length < 3) {
      throw new Error('Username must be at least 3 characters long.');
    }

    const user = await this.users.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    if (!(await PasswordService.verifyPassword(currentPassword, user.passwordHash))) {
      throw new Error('Incorrect current password.');
    }

    const existing = await this.users.findByUsername(cleanUsername);
    if (existing && existing.id !== user.id) {
      throw new Error(`Username '${cleanUsername}' is already taken.`);
    }

    await this.users.update(user.id, { username: cleanUsername });
    logger.info(`SUCCESS: Username changed for user ID ${userId} to '${cleanUsername}'`);
    return { success: true, username: cleanUsername };
  }

  async getSecurityStatus() {
    const firstLoginDone = (await this.getSecuritySetting('first_login_completed')) === 'true';
    const adminUser = await this.users.findByUsername('admin');
    let isDefaultPassword = false;
    if (adminUser) {
      isDefaultPassword = await PasswordService.verifyPassword(LEGACY_DEFAULT_ADMIN_PASSWORD, adminUser.passwordHash);
    }

    return {
      isFirstLoginPending: !firstLoginDone && isDefaultPassword,
      firstLoginCompleted: firstLoginDone,
      hasRecoveryPassword: Boolean(await this.getSecuritySetting('recovery_password_hash')),
      hasRecoveryPin: Boolean(await this.getSecuritySetting('recovery_pin_hash'))
    };
  }

  /**
   * First-login security wizard for the signed-in administrator.
   * Returns { result, user } so the caller can hand the desktop app a fresh token.
   */
  async completeFirstLoginWizard(currentUserId, { newUsername, newPassword, recoveryPassword, recoveryPin } = {}) {
    if ((await this.getSecuritySetting('first_login_completed')) === 'true') {
      throw new Error('The first-login security setup has already been completed.');
    }

    if (!newUsername || !newPassword || !recoveryPassword || !recoveryPin) {
      throw new Error('All security fields are required.');
    }

    const cleanUsername = String(newUsername).trim();
    if (cleanUsername.length < 3) {
      throw new Error('Username must be at least 3 characters long.');
    }
    if (!STRONG_PASSWORD(newPassword)) {
      throw new Error('New password does not meet security policy requirements.');
    }
    if (!STRONG_PASSWORD(recoveryPassword)) {
      throw new Error('Recovery password does not meet security policy requirements.');
    }
    if (!/^\d{4,8}$/.test(recoveryPin)) {
      throw new Error('Recovery PIN must be 4 to 8 numeric digits.');
    }

    const adminUser = await this.users.findById(currentUserId);
    if (!adminUser || adminUser.role !== 'Admin') {
      throw new Error('Administrator account not found.');
    }

    const existing = await this.users.findByUsername(cleanUsername);
    if (existing && existing.id !== adminUser.id) {
      throw new Error(`Username '${cleanUsername}' is already taken.`);
    }

    const passwordHash = await PasswordService.hashPassword(newPassword);
    const updated = await this.users.update(adminUser.id, { username: cleanUsername, passwordHash });

    await this.setSecuritySetting('recovery_password_hash', await PasswordService.hashPassword(recoveryPassword));
    await this.setSecuritySetting('recovery_pin_hash', await PasswordService.hashPassword(recoveryPin, 4));
    await this.setSecuritySetting('first_login_completed', 'true');

    logger.info(`SUCCESS: First Login Security Wizard completed for '${cleanUsername}'`);
    return { result: { success: true, username: cleanUsername }, user: updated };
  }
}

module.exports = AuthService;
module.exports.STRONG_PASSWORD = STRONG_PASSWORD;
module.exports.toSessionUser = toSessionUser;
