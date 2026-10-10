const AuthService = require('./AuthService');
const PasswordService = require('./PasswordService');
const logger = require('../logger');

const { STRONG_PASSWORD } = AuthService;

// The desktop app shipped these defaults. Over the internet they would let anyone in, so they are
// only accepted from a signed-in administrator who is setting the real recovery password/PIN.
const DEFAULT_RECOVERY_PASSWORD = 'Recovery@123';
const DEFAULT_RECOVERY_PIN = '1234';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 30;

const NOT_CONFIGURED =
  'Emergency recovery is not set up yet. An administrator must set a recovery password and PIN in Settings first.';

class RecoveryService {
  constructor(db) {
    this.db = db;
    this.auth = new AuthService(db);
  }

  async _assertNotLocked() {
    const lockedUntil = await this.auth.getSecuritySetting('recovery_locked_until');
    if (lockedUntil && new Date(lockedUntil) > new Date()) {
      const minutes = Math.ceil((new Date(lockedUntil) - new Date()) / 60000);
      throw new Error(`Emergency recovery is locked after repeated failed attempts. Please try again in ${minutes} minutes.`);
    }
  }

  async _recordFailure() {
    const failed = Number(await this.auth.getSecuritySetting('recovery_failed_attempts')) || 0;
    if (failed + 1 >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString();
      await this.auth.setSecuritySetting('recovery_locked_until', lockedUntil);
      await this.auth.setSecuritySetting('recovery_failed_attempts', '0');
      logger.warn(`Emergency recovery locked for ${LOCK_MINUTES} minutes after ${MAX_FAILED_ATTEMPTS} failed attempts.`);
    } else {
      await this.auth.setSecuritySetting('recovery_failed_attempts', String(failed + 1));
    }
  }

  async _recordSuccess() {
    await this.auth.setSecuritySetting('recovery_failed_attempts', '0');
  }

  async verifyRecoveryPassword(password, { allowDefault = false } = {}) {
    if (!password || typeof password !== 'string') {
      throw new Error('Invalid emergency recovery password.');
    }
    await this._assertNotLocked();

    const storedHash = await this.auth.getSecuritySetting('recovery_password_hash');
    let isValid;
    if (storedHash) {
      isValid = await PasswordService.verifyPassword(password, storedHash);
    } else if (allowDefault) {
      isValid = password === DEFAULT_RECOVERY_PASSWORD;
    } else {
      throw new Error(NOT_CONFIGURED);
    }

    if (!isValid) {
      await this._recordFailure();
      logger.warn('Failed emergency recovery password verification attempt.');
      throw new Error('Invalid emergency recovery password.');
    }

    await this._recordSuccess();
    logger.info('Emergency recovery password verified successfully.');
    return true;
  }

  async verifyRecoveryPin(pin, { allowDefault = false } = {}) {
    if (!pin || !/^\d{4,8}$/.test(String(pin))) {
      throw new Error('Recovery PIN must be 4 to 8 numeric digits.');
    }
    await this._assertNotLocked();

    const storedHash = await this.auth.getSecuritySetting('recovery_pin_hash');
    let isValid;
    if (storedHash) {
      isValid = await PasswordService.verifyPassword(String(pin), storedHash);
    } else if (allowDefault) {
      isValid = String(pin) === DEFAULT_RECOVERY_PIN;
    } else {
      throw new Error(NOT_CONFIGURED);
    }

    if (!isValid) {
      await this._recordFailure();
      logger.warn('Failed recovery PIN verification attempt.');
      throw new Error('Invalid recovery PIN.');
    }

    await this._recordSuccess();
    logger.info('Recovery PIN verified successfully.');
    return true;
  }

  async changeRecoveryPassword(currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
      throw new Error('Current recovery password and new recovery password are required.');
    }
    await this.verifyRecoveryPassword(currentPassword, { allowDefault: true });

    if (!STRONG_PASSWORD(newPassword)) {
      throw new Error('New recovery password does not meet security requirements.');
    }

    await this.auth.setSecuritySetting('recovery_password_hash', await PasswordService.hashPassword(newPassword));
    logger.info('SUCCESS: Emergency recovery password updated.');
    return { success: true };
  }

  async changeRecoveryPin(currentAuth, newPin) {
    if (!currentAuth || !newPin) {
      throw new Error('Current authorization and new PIN are required.');
    }
    if (!/^\d{4,8}$/.test(newPin)) {
      throw new Error('New Recovery PIN must be 4 to 8 numeric digits.');
    }

    // currentAuth can be the current PIN or the current recovery password
    let authorized = false;
    if (/^\d{4,8}$/.test(currentAuth)) {
      try {
        authorized = await this.verifyRecoveryPin(currentAuth, { allowDefault: true });
      } catch (e) {
        authorized = false;
      }
    }
    if (!authorized) {
      try {
        authorized = await this.verifyRecoveryPassword(currentAuth, { allowDefault: true });
      } catch (e) {
        authorized = false;
      }
    }
    if (!authorized) {
      throw new Error('Current authorization (PIN or Recovery Password) is incorrect.');
    }

    await this.auth.setSecuritySetting('recovery_pin_hash', await PasswordService.hashPassword(newPin, 4));
    logger.info('SUCCESS: Recovery PIN updated successfully.');
    return { success: true };
  }

  async resetRecoveryPasswordWithPin(pin, newPassword) {
    if (!pin || !newPassword) {
      throw new Error('Recovery PIN and new password are required.');
    }
    await this.verifyRecoveryPin(pin);

    if (!STRONG_PASSWORD(newPassword)) {
      throw new Error('New recovery password does not meet security requirements.');
    }

    await this.auth.setSecuritySetting('recovery_password_hash', await PasswordService.hashPassword(newPassword));
    logger.info('SUCCESS: Emergency recovery password reset via Recovery PIN.');
    return { success: true };
  }

  async getAllUsers() {
    const users = await this.auth.users.findAll();
    return users.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      isActive: u.isActive,
      status: u.isActive ? 'Enabled' : 'Disabled'
    }));
  }

  async toggleUserStatus({ username, targetStatus } = {}) {
    if (!username) {
      throw new Error('Username is required for status modification.');
    }

    const user = await this.auth.users.findByUsername(username);
    if (!user) {
      throw new Error(`User '${username}' not found.`);
    }

    const newIsActive = targetStatus === undefined ? !user.isActive : Boolean(targetStatus);
    if (!newIsActive) {
      await this.auth._assertNotLastActiveAdmin(user, 'disable');
    }
    const updatedUser = await this.auth.users.update(user.id, {
      isActive: newIsActive,
      failedAttempts: 0,
      lockedUntil: null
    });

    logger.info(`Emergency Recovery: ${newIsActive ? 'User Enabled' : 'User Disabled'} -> ${username}`);
    return {
      user,
      updatedUser,
      result: {
        id: updatedUser.id,
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        status: updatedUser.isActive ? 'Enabled' : 'Disabled'
      }
    };
  }

  async resetUserPassword({ username, newPassword, confirmPassword } = {}) {
    if (!username) {
      throw new Error('Username is required for password reset.');
    }
    if (!newPassword || typeof newPassword !== 'string') {
      throw new Error('New password is required.');
    }
    if (newPassword !== confirmPassword) {
      throw new Error('New password and confirm password do not match.');
    }

    const user = await this.auth.users.findByUsername(username);
    if (!user) {
      throw new Error(`User '${username}' not found.`);
    }

    const passwordHash = await PasswordService.hashPassword(newPassword);
    await this.auth.users.update(user.id, { passwordHash, failedAttempts: 0, lockedUntil: null });

    logger.info(`Emergency Recovery: Password Reset -> ${username}`);
    return { user, result: { success: true, username: user.username } };
  }
}

module.exports = RecoveryService;
