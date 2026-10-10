const express = require('express');
const config = require('./config');
const logger = require('./logger');
const { handlers, createServices } = require('./rpc/handlers');
const { verifyToken } = require('./auth/tokens');
const UserRepository = require('./auth/UserRepository');
const { AuthError, ForbiddenError, toHttpError } = require('./errors');
const rateLimiter = require('./auth/rateLimiter');

async function authenticate(req, db) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const payload = verifyToken(token, 'access');

  // Load the account on every request so disabled users, deleted users and role changes apply immediately.
  const user = await new UserRepository(db).findById(Number(payload.sub));
  if (!user || !user.isActive || user.sessionVersion !== payload.sv) {
    throw new AuthError();
  }
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive
  };
}

function createRpcHandler(db) {
  return async function rpc(req, res) {
    const started = Date.now();
    const channel = req.params.channel;
    const definition = Object.prototype.hasOwnProperty.call(handlers, channel) ? handlers[channel] : null;

    if (!definition) {
      res.status(404).json({ success: false, error: `Unknown operation: ${channel}` });
      return;
    }

    const services = createServices(db);
    const ctx = {
      db,
      s: services,
      ip: req.ip,
      user: null,
      refreshedToken: null,
      audit: (entry) => services.audit.logAction({
        ...entry,
        performedBy: entry.performedBy || (ctx.user ? ctx.user.username : 'System')
      })
    };

    try {
      if (!definition.public) {
        ctx.user = await authenticate(req, db);
      }
      if (definition.recovery) {
        verifyToken(req.get('x-recovery-token'), 'recovery');
      }
      if (definition.roles && !definition.roles.includes(ctx.user.role)) {
        throw new ForbiddenError(`Permission denied: the ${ctx.user.role} role cannot perform this action.`);
      }
      const limit = definition.rateLimit;
      const limitKey = limit ? limit.key(ctx) : null;
      if (limit) {
        rateLimiter.check(limitKey, limit);
        if (!limit.failuresOnly) rateLimiter.hit(limitKey, limit);
      }

      const args = req.body && Array.isArray(req.body.args) ? req.body.args : [];
      let data;
      try {
        data = await definition.handler(ctx, ...args);
      } catch (err) {
        if (limit && limit.failuresOnly) rateLimiter.hit(limitKey, limit);
        throw err;
      }

      const body = { success: true, data: data === undefined ? null : data };
      if (ctx.refreshedToken) body.refreshedToken = ctx.refreshedToken;
      res.json(body);
      logger.debug(`${channel} by ${ctx.user ? ctx.user.username : 'guest'} in ${Date.now() - started} ms`);
    } catch (err) {
      const { status, message } = toHttpError(err);
      if (status >= 500) {
        logger.error(`${channel} failed after ${Date.now() - started} ms`);
      } else {
        logger.info(`${channel} rejected (${status}): ${message}`);
      }
      res.status(status).json({ success: false, error: message });
    }
  };
}

function createApp({ db }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  // Used by hosting health checks and by the desktop app to test the connection.
  app.get('/health', async (req, res) => {
    try {
      await db.get('SELECT 1 AS ok');
      res.json({ status: 'ok', service: 'himmel-sales-server', version: config.version });
    } catch (err) {
      logger.error('Health check failed', err);
      res.status(503).json({ status: 'error', service: 'himmel-sales-server', version: config.version });
    }
  });

  // Normal requests are small (a company logo is the largest). Only a restore uploads a whole
  // database, and that body is only read for a request carrying a valid login token.
  const normalBody = express.json({ limit: '10mb' });
  const restoreBody = express.json({ limit: config.maxBodySize });
  const parseBody = (req, res, next) => {
    if (req.params.channel !== 'backup:restore') return normalBody(req, res, next);
    try {
      const header = req.get('authorization') || '';
      verifyToken(header.startsWith('Bearer ') ? header.slice(7).trim() : '', 'access');
    } catch (err) {
      res.status(401).json({ success: false, error: err.message });
      return undefined;
    }
    return restoreBody(req, res, next);
  };

  app.post('/api/rpc/:channel', parseBody, createRpcHandler(db));

  app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Not found.' });
  });

  // Body parser errors (invalid JSON, payload too large).
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const message = status === 413
      ? 'The request is too large for the server.'
      : status < 500 ? 'Invalid request.' : 'An unexpected server error occurred. Please try again.';
    if (status >= 500) logger.error('Request failed', err);
    res.status(status).json({ success: false, error: message });
  });

  return app;
}

module.exports = { createApp };
