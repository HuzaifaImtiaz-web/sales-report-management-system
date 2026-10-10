const jwt = require('jsonwebtoken');
const config = require('../config');
const { AuthError } = require('../errors');

const ISSUER = 'himmel-sales-server';
const AUDIENCE = 'himmel-sales-desktop';

function signAccessToken(user) {
  return jwt.sign(
    { typ: 'access', sv: user.sessionVersion || 0 },
    config.jwtSecret,
    { subject: String(user.id), expiresIn: config.tokenTtl, issuer: ISSUER, audience: AUDIENCE, algorithm: 'HS256' }
  );
}

// Short-lived token proving the emergency recovery password/PIN was entered.
function signRecoveryToken() {
  return jwt.sign(
    { typ: 'recovery' },
    config.jwtSecret,
    { subject: 'recovery', expiresIn: config.recoveryTokenTtl, issuer: ISSUER, audience: AUDIENCE, algorithm: 'HS256' }
  );
}

function verifyToken(token, expectedType) {
  if (!token) throw new AuthError();
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'], issuer: ISSUER, audience: AUDIENCE });
  } catch (e) {
    throw new AuthError();
  }
  if (payload.typ !== expectedType) throw new AuthError();
  return payload;
}

module.exports = { signAccessToken, signRecoveryToken, verifyToken };
