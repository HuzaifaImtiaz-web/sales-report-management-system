/**
 * Strict 11-Digit Phone Number Validator
 * Enforces exactly 11 digits, no spaces, no letters, no symbols, no less, no greater.
 */

export const PHONE_REGEX = /^\d{11}$/;

export const isValid11DigitPhone = (val) => {
  if (!val || typeof val !== 'string') return false;
  return PHONE_REGEX.test(val.trim());
};

export const sanitizePhoneInput = (val) => {
  if (!val) return '';
  // Remove all non-digits and cap at 11 characters max
  return val.replace(/\D/g, '').slice(0, 11);
};
