// One password rule for every place a password is set (sign-up by an admin, password change,
// admin reset, emergency recovery reset, first-login wizard, first administrator).
// Mirrors src/utils/passwordPolicy.js in the web app so the screens show the same rules.

const MIN_LENGTH = 10;
// bcrypt only uses the first 72 bytes; longer passwords would be silently truncated.
const MAX_BYTES = 72;

// Passwords that satisfy the character rules but are among the first ones an attacker tries.
const COMMON_PASSWORDS = new Set([
  'password123!', 'password@123', 'passw0rd123!', 'p@ssw0rd123', 'p@ssword123', 'admin@12345',
  'admin123456!', 'administrator1!', 'welcome@123', 'welcome123!', 'qwerty@1234', 'qwerty12345!',
  'himmel@1234', 'himmel@12345', 'himmel123456!', 'pakistan@123', 'pakistan@1234', 'karachi@123',
  'changeme123!', 'letmein1234!', 'recovery@123', 'abc@1234567', 'iloveyou123!'
]);

const SPECIAL = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

/**
 * Returns a list of problems (empty when the password is acceptable).
 */
function passwordProblems(password, { username } = {}) {
  if (!password || typeof password !== 'string') return ['Password is required.'];

  const problems = [];
  if (password.length < MIN_LENGTH) problems.push(`Must be at least ${MIN_LENGTH} characters.`);
  if (Buffer.byteLength(password, 'utf8') > MAX_BYTES) problems.push(`Must be at most ${MAX_BYTES} characters.`);
  if (!/[A-Z]/.test(password)) problems.push('Must contain at least one uppercase letter.');
  if (!/[a-z]/.test(password)) problems.push('Must contain at least one lowercase letter.');
  if (!/\d/.test(password)) problems.push('Must contain at least one number.');
  if (!SPECIAL.test(password)) problems.push('Must contain at least one special character.');

  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) problems.push('This password is too common. Choose a less predictable one.');
  const name = typeof username === 'string' ? username.trim().toLowerCase() : '';
  if (name.length >= 3 && lower.includes(name)) problems.push('Must not contain the username.');
  return problems;
}

function isStrongPassword(password, options) {
  return passwordProblems(password, options).length === 0;
}

/** Throws a user-facing error naming the first rule that is not met. */
function assertStrongPassword(password, { label = 'Password', username } = {}) {
  const problems = passwordProblems(password, { username });
  if (problems.length > 0) {
    throw new Error(`${label} does not meet the security policy: ${problems[0]}`);
  }
}

module.exports = { passwordProblems, isStrongPassword, assertStrongPassword, MIN_LENGTH, MAX_BYTES };
