const bcrypt = require('bcryptjs');

class PasswordService {
  /**
   * Hashes a plaintext password using bcrypt with a cost factor of 12.
   * @param {string} password - Plaintext password
   * @returns {Promise<string>} Hashed password
   */
  static async hashPassword(password, minLength = 8) {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string.');
    }
    if (password.length < minLength) {
      throw new Error(`Password must be at least ${minLength} characters long.`);
    }
    // Generate salt with 12 rounds
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compares a plaintext password with a hashed password.
   * @param {string} password - Plaintext password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} Match result
   */
  static async verifyPassword(password, hash) {
    if (!password || !hash) return false;
    return bcrypt.compare(password, hash);
  }
}

module.exports = PasswordService;
