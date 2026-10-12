const logger = require('./logger');

class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// 401: the web app signs the user out when it gets this status (src/api/webApi.js).
class AuthError extends AppError {
  constructor(message = 'Session expired. Please log in again.') {
    super(message, 401);
  }
}

// 403: the user stays signed in; only this action is refused.
class ForbiddenError extends AppError {
  constructor(message = 'Permission denied: your role is not allowed to perform this action.') {
    super(message, 403);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many attempts. Please wait a few minutes and try again.') {
    super(message, 429);
  }
}

const UNAVAILABLE_MESSAGE = 'The cloud database is temporarily unavailable. Please try again shortly.';
const INTERNAL_MESSAGE = 'An unexpected server error occurred. Please try again.';

function uniqueViolationMessage(err) {
  const detail = `${err.detail || ''} ${err.constraint || ''}`;
  if (detail.includes('product_code')) {
    return 'This Product Code already exists. Please use a unique Product Code.';
  }
  if (detail.includes('registration_no')) {
    return 'Registration Number must be unique.';
  }
  if (detail.includes('institutions_code') || (detail.includes('(code)') && detail.includes('institution'))) {
    return 'This Institution Code already exists. Please use a unique Institution Code.';
  }
  if (detail.includes('order_number')) {
    return 'PO Number already exists.';
  }
  if (detail.includes('username')) {
    return 'This username is already taken.';
  }
  if (detail.includes('name')) {
    return 'A record with this name already exists.';
  }
  return 'This record already exists in the system.';
}

/** Maps any thrown error to { status, message } for the JSON response (same wording as the old IPC layer). */
function toHttpError(err) {
  if (err instanceof AppError) {
    return { status: err.status, message: err.message };
  }

  // PostgreSQL errors carry a five-character SQLSTATE code.
  if (err && typeof err.code === 'string' && /^[0-9A-Z]{5}$/.test(err.code)) {
    switch (err.code) {
      case '23505':
        return { status: 409, message: uniqueViolationMessage(err) };
      case '23503':
        return { status: 409, message: 'Cannot complete operation because this record is referenced by active sales, orders, or other entities.' };
      case '23502':
        return { status: 400, message: `A required field is missing${err.column ? ` (${err.column})` : ''}.` };
      case '23514':
        return { status: 400, message: 'Invalid value: the data does not meet the required rules.' };
      case 'P0001': // RAISE EXCEPTION in our triggers
        return { status: 400, message: err.message };
      case '22P02':
      case '22003':
      case '22007':
      case '22008':
        return { status: 400, message: `Invalid value: ${err.message}` };
      case '57P01':
      case '57P03':
      case '53300':
      case '08000':
      case '08001':
      case '08003':
      case '08006':
        logger.error('Database unavailable', err);
        return { status: 503, message: UNAVAILABLE_MESSAGE };
      default:
        logger.error('Unhandled database error', err);
        return { status: 500, message: INTERNAL_MESSAGE };
    }
  }

  if (err && ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'].includes(err.code)) {
    logger.error('Database connection failed', err);
    return { status: 503, message: UNAVAILABLE_MESSAGE };
  }

  if (err instanceof TypeError || err instanceof ReferenceError || err instanceof RangeError || err instanceof SyntaxError) {
    logger.error('Internal error', err);
    return { status: 500, message: INTERNAL_MESSAGE };
  }

  // Plain Errors are the business-rule messages thrown by repositories and validators.
  return { status: 400, message: (err && err.message) || INTERNAL_MESSAGE };
}

module.exports = { AppError, AuthError, ForbiddenError, RateLimitError, toHttpError };
