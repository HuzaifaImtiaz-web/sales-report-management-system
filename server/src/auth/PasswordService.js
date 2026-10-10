const bcrypt = require('bcryptjs');

// Real bcrypt hash (same cost) compared against when a username does not exist, so a failed
// login takes the same time either way and does not reveal which usernames are valid.
let dummyHashPromise = null;

class PasswordService {
  /**
   * Hashes a plaintext password using bcrypt with a cost factor of 12.
   */
  static async hashPassword(password, minLength = 8) {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string.');
    }
    if (password.length < minLength) {
      throw new Error(`Password must be at least ${minLength} characters long.`);
    }
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compares a plaintext password with a hashed password.
   */
  static async verifyPassword(password, hash) {
    if (!password || !hash || typeof password !== 'string') return false;
    return bcrypt.compare(password, hash);
  }

  static async spendComparisonTime(password) {
    if (!dummyHashPromise) dummyHashPromise = bcrypt.hash('himmel-timing-equalizer', 12);
    await bcrypt.compare(String(password || ''), await dummyHashPromise);
  }
}

module.exports = PasswordService;
