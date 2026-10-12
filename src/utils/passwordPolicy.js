/**
 * Centralized Password Policy Validator
 * Himmel Pharmaceutical Sales Management System
 *
 * Same rules as the server (server/src/auth/passwordPolicy.js), which has the final say.
 */

export const PASSWORD_RULES = {
  minLength: 10,
  maxBytes: 72,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true
};

const COMMON_PASSWORDS = new Set([
  'password123!', 'password@123', 'passw0rd123!', 'p@ssw0rd123', 'p@ssword123', 'admin@12345',
  'admin123456!', 'administrator1!', 'welcome@123', 'welcome123!', 'qwerty@1234', 'qwerty12345!',
  'himmel@1234', 'himmel@12345', 'himmel123456!', 'pakistan@123', 'pakistan@1234', 'karachi@123',
  'changeme123!', 'letmein1234!', 'recovery@123', 'abc@1234567', 'iloveyou123!'
]);

const SPECIAL = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

export function validatePassword(password, { username } = {}) {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
      errors: ['Password is required.']
    };
  }

  const length = password.length >= PASSWORD_RULES.minLength;
  const notTooLong = new TextEncoder().encode(password).length <= PASSWORD_RULES.maxBytes;
  const uppercase = /[A-Z]/.test(password);
  const lowercase = /[a-z]/.test(password);
  const number = /\d/.test(password);
  const special = SPECIAL.test(password);
  const lower = password.toLowerCase();
  const notCommon = !COMMON_PASSWORDS.has(lower);
  const name = typeof username === 'string' ? username.trim().toLowerCase() : '';
  const notUsername = !(name.length >= 3 && lower.includes(name));

  const errors = [];
  if (!length) errors.push(`Must be at least ${PASSWORD_RULES.minLength} characters.`);
  if (!notTooLong) errors.push(`Must be at most ${PASSWORD_RULES.maxBytes} characters.`);
  if (!uppercase) errors.push('Must contain at least one uppercase letter.');
  if (!lowercase) errors.push('Must contain at least one lowercase letter.');
  if (!number) errors.push('Must contain at least one number.');
  if (!special) errors.push('Must contain at least one special character.');
  if (!notCommon) errors.push('This password is too common. Choose a less predictable one.');
  if (!notUsername) errors.push('Must not contain the username.');

  return {
    isValid: errors.length === 0,
    length,
    uppercase,
    lowercase,
    number,
    special,
    errors
  };
}

export default {
  PASSWORD_RULES,
  validatePassword
};
