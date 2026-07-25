/**
 * Centralized Password Policy Validator
 * Himmel Pharmaceutical Sales Management System
 */

export const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true
};

export function validatePassword(password) {
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
  const uppercase = /[A-Z]/.test(password);
  const lowercase = /[a-z]/.test(password);
  const number = /\d/.test(password);
  const special = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const errors = [];
  if (!length) errors.push(`Must be at least ${PASSWORD_RULES.minLength} characters.`);
  if (!uppercase) errors.push('Must contain at least one uppercase letter.');
  if (!lowercase) errors.push('Must contain at least one lowercase letter.');
  if (!number) errors.push('Must contain at least one number.');
  if (!special) errors.push('Must contain at least one special character.');

  const isValid = length && uppercase && lowercase && number && special;

  return {
    isValid,
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
