const UserRepository = require('./UserRepository');
const PasswordService = require('./PasswordService');
const { assertStrongPassword, isStrongPassword } = require('./passwordPolicy');
const logger = require('../logger');

const ALLOWED_ROLES = ['Admin', 'Manager', 'Rep', 'Sales Representative'];
// The only message for a failed sign-in (unknown user, wrong password or a paused account), so it
// never tells a stranger which usernames exist.
const LOCK_AFTER_FAILURES = 5;
const LOCK_MINUTES = 15;
const INVALID_LOGIN =
  `Username or password is incorrect. After ${LOCK_AFTER_FAILURES} wrong tries, sign-in pauses for ${LOCK_MINUTES} minutes.`;
// New emergency recovery PINs: 6 to 8 digits (4-digit PINs set earlier still verify).
const NEW_PIN = /^\d{6,8}$/;

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

  /**
   * Verifies the credentials and returns the user record (the caller starts the session).
   * The disabled-account and maintenance messages only appear after a correct password, so
   * they do not tell a stranger which usernames exist.
   */
  async login(username, password) {
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      throw new Error('Username and password are required.');
    }
    if (username.length > 100 || password.length > 200) {
      throw new Error(INVALID_LOGIN);
    }

    const cleanUsername = username.trim();
    const user = await this.users.findByUsername(cleanUsername);

    if (!user) {
      await PasswordService.spendComparisonTime(password);
      logger.warn(`Login failure: User not found: ${cleanUsername}`);
      throw new Error(INVALID_LOGIN);
    }

    if (user.lockedUntil) {
      if (new Date(user.lockedUntil) > new Date()) {
        // Same time and message as a wrong password: a paused account is not revealed.
        await PasswordService.spendComparisonTime(password);
        logger.warn(`Login failure: Attempt to access locked account: ${cleanUsername}`);
        throw new Error(INVALID_LOGIN);
      }
      await this.users.unlockAccount(user.id);
    }

    const isPasswordCorrect = await PasswordService.verifyPassword(password, user.passwordHash);
    if (!isPasswordCorrect) {
      const failedCount = await this.users.incrementFailedAttempts(user.id);
      logger.warn(`Login failure: Incorrect password for user: ${cleanUsername}. Failed attempts: ${failedCount}`);

      if (failedCount >= LOCK_AFTER_FAILURES) {
        await this.users.lockAccount(user.id, LOCK_MINUTES);
        logger.warn(`Account locked: User ${cleanUsername} locked for ${LOCK_MINUTES} minutes after ${failedCount} failed attempts.`);
      }
      throw new Error(INVALID_LOGIN);
    }

    if (!user.isActive) {
      logger.warn(`Login failure: Disabled account access attempt: ${cleanUsername}`);
      throw new Error('Your account is disabled. Please contact your administrator.');
    }

    // Maintenance Mode: only Administrators may log in.
    if (user.role !== 'Admin') {
      const row = await this.db.get("SELECT value FROM settings WHERE key = 'maintenance_mode'");
      if (row && row.value === 'true') {
        logger.warn(`Login blocked due to Maintenance Mode for user: ${cleanUsername}`);
        throw new Error('System is currently under maintenance. Only Administrators may log in.');
      }
    }

    await this.users.recordSuccessfulLogin(user.id);
    logger.info(`SUCCESS: User logged in: ${user.username}`);
    return this.users.findById(user.id);
  }

  async createUser({ username, password, fullName, role } = {}) {
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      throw new Error('Username must be at least 3 characters long.');
    }
    assertStrongPassword(password, { username });
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
    assertStrongPassword(newPassword, { label: 'New password', username: user.username });
    if (await PasswordService.verifyPassword(newPassword, user.passwordHash)) {
      throw new Error('The new password must be different from the current password.');
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

    assertStrongPassword(newPassword, { label: 'New password', username: user.username });

    const passwordHash = await PasswordService.hashPassword(newPassword);
    // Also clears a lockout, so the user can sign in with the new password straight away.
    const updated = await this.users.update(user.id, { passwordHash, failedAttempts: 0, lockedUntil: null });
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
    return user;
  }

  /** Clears a lockout after too many wrong passwords (administrators, from User Management). */
  async unlockUser(username) {
    const user = await this.users.findByUsername(username);
    if (!user) {
      throw new Error('User not found.');
    }
    await this.users.unlockAccount(user.id);
    logger.info(`SUCCESS: Account unlocked by administrator: ${user.username}`);
    return user;
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

    await this.db.transaction(async (tx) => {
      await new UserRepository(tx).update(user.id, { username: cleanUsername });
      // Orders record who entered them by username; representatives may edit only their own.
      await tx.run('UPDATE orders SET created_by = ? WHERE created_by = ?', [cleanUsername, user.username]);
    });
    logger.info(`SUCCESS: Username changed for user ID ${userId} to '${cleanUsername}'`);
    return { success: true, username: cleanUsername };
  }

  /**
   * Security setup state for the signed-in user. Administrators are asked to complete the
   * first-login security setup (strong password, recovery password and PIN) until it is done.
   */
  async getSecurityStatus(currentUser) {
    if (!currentUser || currentUser.role !== 'Admin') {
      return { isFirstLoginPending: false };
    }
    const firstLoginDone = (await this.getSecuritySetting('first_login_completed')) === 'true';
    return {
      isFirstLoginPending: !firstLoginDone,
      firstLoginCompleted: firstLoginDone,
      hasRecoveryPassword: Boolean(await this.getSecuritySetting('recovery_password_hash')),
      hasRecoveryPin: Boolean(await this.getSecuritySetting('recovery_pin_hash'))
    };
  }

  /**
   * First-login security wizard for the signed-in administrator.
   * Returns { result, user } so the caller can start a fresh session (new cookie and CSRF token).
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
    assertStrongPassword(newPassword, { label: 'New password', username: cleanUsername });
    assertStrongPassword(recoveryPassword, { label: 'Recovery password' });
    if (recoveryPassword === newPassword) {
      throw new Error('The recovery password must be different from your login password.');
    }
    if (!NEW_PIN.test(String(recoveryPin))) {
      throw new Error('Recovery PIN must be 6 to 8 numeric digits.');
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
    await this.setSecuritySetting('recovery_pin_hash', await PasswordService.hashPassword(String(recoveryPin), 6));
    await this.setSecuritySetting('first_login_completed', 'true');

    logger.info(`SUCCESS: First Login Security Wizard completed for '${cleanUsername}'`);
    return { result: { success: true, username: cleanUsername }, user: updated };
  }
}

module.exports = AuthService;
module.exports.isStrongPassword = isStrongPassword;
module.exports.NEW_PIN = NEW_PIN;
module.exports.INVALID_LOGIN = INVALID_LOGIN;
module.exports.toSessionUser = toSessionUser;
