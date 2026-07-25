const AuthenticationService = require('./AuthenticationService.cjs');
const PasswordService = require('./PasswordService.cjs');
const AuditRepositoryClass = require('../database/AuditRepository.cjs');
const dbProxy = require('../database/dbProxy.cjs');
const logger = require('../logger.cjs');

const DEFAULT_RECOVERY_PASSWORD = 'Recovery@123';
const DEFAULT_RECOVERY_PIN = '1234';

class RecoveryService {
  static getAuditRepo() {
    return new AuditRepositoryClass(dbProxy);
  }

  static async verifyRecoveryPassword(password) {
    if (!password || typeof password !== 'string') {
      logger.warn('Failed emergency recovery password verification attempt (empty).');
      throw new Error('Invalid emergency recovery password.');
    }

    const storedHash = AuthenticationService.getSecuritySetting('recovery_password_hash');
    let isValid = false;

    if (storedHash) {
      isValid = await PasswordService.verifyPassword(password, storedHash);
    } else {
      isValid = (password === DEFAULT_RECOVERY_PASSWORD);
    }

    if (!isValid) {
      logger.warn('Failed emergency recovery password verification attempt.');
      throw new Error('Invalid emergency recovery password.');
    }

    logger.info('Emergency recovery password verified successfully.');

    try {
      this.getAuditRepo().logAction({
        module: 'Authentication',
        entityType: 'Emergency Recovery',
        entityId: 'SYSTEM',
        action: 'Emergency Recovery Login',
        oldValue: null,
        newValue: { access: 'Granted' },
        performedBy: 'Emergency Recovery'
      });
    } catch (e) {
      logger.error('Failed to log emergency recovery login audit action:', e);
    }

    return true;
  }

  static async changeRecoveryPassword(currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
      throw new Error('Current recovery password and new recovery password are required.');
    }

    await this.verifyRecoveryPassword(currentPassword);

    // Validate password policy (8+ chars, uppercase, lowercase, number, special char)
    if (
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/\d/.test(newPassword) ||
      !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)
    ) {
      throw new Error('New recovery password does not meet security requirements.');
    }

    const hash = await PasswordService.hashPassword(newPassword);
    AuthenticationService.setSecuritySetting('recovery_password_hash', hash);
    logger.info('SUCCESS: Emergency recovery password updated.');
    return { success: true };
  }

  static async verifyRecoveryPin(pin) {
    if (!pin || !/^\d{4,8}$/.test(pin)) {
      throw new Error('Recovery PIN must be 4 to 8 numeric digits.');
    }

    const storedHash = AuthenticationService.getSecuritySetting('recovery_pin_hash');
    let isValid = false;

    if (storedHash) {
      isValid = await PasswordService.verifyPassword(pin, storedHash);
    } else {
      isValid = (pin === DEFAULT_RECOVERY_PIN);
    }

    if (!isValid) {
      logger.warn('Failed recovery PIN verification attempt.');
      throw new Error('Invalid recovery PIN.');
    }

    logger.info('Recovery PIN verified successfully.');
    return true;
  }

  static async changeRecoveryPin(currentAuth, newPin) {
    if (!currentAuth || !newPin) {
      throw new Error('Current authorization and new PIN are required.');
    }

    if (!/^\d{4,8}$/.test(newPin)) {
      throw new Error('New Recovery PIN must be 4 to 8 numeric digits.');
    }

    // currentAuth can be current PIN or current recovery password
    let authorized = false;
    try {
      if (/^\d{4,8}$/.test(currentAuth)) {
        authorized = await this.verifyRecoveryPin(currentAuth);
      }
    } catch (e) {}

    if (!authorized) {
      try {
        authorized = await this.verifyRecoveryPassword(currentAuth);
      } catch (e) {}
    }

    if (!authorized) {
      throw new Error('Current authorization (PIN or Recovery Password) is incorrect.');
    }

    const pinHash = await PasswordService.hashPassword(newPin, 4);
    AuthenticationService.setSecuritySetting('recovery_pin_hash', pinHash);
    logger.info('SUCCESS: Recovery PIN updated successfully.');
    return { success: true };
  }

  static async resetRecoveryPasswordWithPin(pin, newPassword) {
    if (!pin || !newPassword) {
      throw new Error('Recovery PIN and new password are required.');
    }

    await this.verifyRecoveryPin(pin);

    if (
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/\d/.test(newPassword) ||
      !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)
    ) {
      throw new Error('New recovery password does not meet security requirements.');
    }

    const hash = await PasswordService.hashPassword(newPassword);
    AuthenticationService.setSecuritySetting('recovery_password_hash', hash);
    logger.info('SUCCESS: Emergency recovery password reset via Recovery PIN.');
    return { success: true };
  }

  static getAllUsers() {
    const userRepo = AuthenticationService.getRepository();
    const users = userRepo.findAll();
    return users.map(u => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      isActive: u.isActive,
      status: u.isActive ? 'Enabled' : 'Disabled'
    }));
  }

  static toggleUserStatus({ username, targetStatus }) {
    if (!username) {
      throw new Error('Username is required for status modification.');
    }

    const userRepo = AuthenticationService.getRepository();
    const user = userRepo.findByUsername(username);
    if (!user) {
      throw new Error(`User '${username}' not found.`);
    }

    const newIsActive = targetStatus === undefined ? !user.isActive : Boolean(targetStatus);
    const updatedUser = userRepo.update(user.id, {
      isActive: newIsActive,
      failedAttempts: 0,
      lockedUntil: null
    });

    const actionText = newIsActive ? 'User Enabled' : 'User Disabled';
    logger.info(`Emergency Recovery: ${actionText} -> ${username}`);

    try {
      this.getAuditRepo().logAction({
        module: 'Authentication',
        entityType: 'User',
        entityId: String(user.id),
        action: actionText,
        oldValue: { username: user.username, status: user.isActive ? 'Enabled' : 'Disabled' },
        newValue: { username: user.username, status: newIsActive ? 'Enabled' : 'Disabled' },
        performedBy: 'Emergency Recovery'
      });
    } catch (e) {
      logger.error(`Failed to log ${actionText} audit action:`, e);
    }

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      fullName: updatedUser.fullName,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      status: updatedUser.isActive ? 'Enabled' : 'Disabled'
    };
  }

  static async resetUserPassword({ username, newPassword, confirmPassword }) {
    if (!username) {
      throw new Error('Username is required for password reset.');
    }
    if (!newPassword || typeof newPassword !== 'string') {
      throw new Error('New password is required.');
    }
    if (newPassword !== confirmPassword) {
      throw new Error('New password and confirm password do not match.');
    }

    const userRepo = AuthenticationService.getRepository();
    const user = userRepo.findByUsername(username);
    if (!user) {
      throw new Error(`User '${username}' not found.`);
    }

    const passwordHash = await PasswordService.hashPassword(newPassword);

    userRepo.update(user.id, {
      passwordHash,
      failedAttempts: 0,
      lockedUntil: null
    });

    logger.info(`Emergency Recovery: Password Reset -> ${username}`);

    try {
      this.getAuditRepo().logAction({
        module: 'Authentication',
        entityType: 'User',
        entityId: String(user.id),
        action: 'Password Reset',
        oldValue: { username: user.username, passwordReset: false },
        newValue: { username: user.username, passwordReset: true },
        performedBy: 'Emergency Recovery'
      });
    } catch (e) {
      logger.error('Failed to log Password Reset audit action:', e);
    }

    return {
      success: true,
      username: user.username
    };
  }
}

module.exports = RecoveryService;
